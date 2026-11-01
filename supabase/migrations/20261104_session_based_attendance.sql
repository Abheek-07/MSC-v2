-- Session-based attendance for MSC-v2.
-- Each session has independent attendance records per attendee.
create table if not exists public.event_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 120),
  description text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_sessions_valid_time check (
    starts_at is null or ends_at is null or ends_at > starts_at
  )
);

create index if not exists event_sessions_event_id_idx
  on public.event_sessions(event_id, starts_at);

create table if not exists public.session_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.event_sessions(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  attendee_token text not null,
  member_index integer,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references auth.users(id) on delete set null,
  constraint session_attendance_member_index_nonnegative
    check (member_index is null or member_index >= 0),
  constraint session_attendance_unique_attendee
    unique (session_id, attendee_token)
);

create index if not exists session_attendance_session_idx
  on public.session_attendance(session_id, checked_in_at desc);
create index if not exists session_attendance_registration_idx
  on public.session_attendance(registration_id);

alter table public.event_sessions enable row level security;
alter table public.session_attendance enable row level security;

-- These tables are accessed through admin-guarded server routes using service_role.
revoke all on public.event_sessions from anon, authenticated;
revoke all on public.session_attendance from anon, authenticated;
grant select, insert, update, delete on public.event_sessions to service_role;
grant select, insert, update, delete on public.session_attendance to service_role;

create or replace function public.record_session_attendance(
  p_session_id uuid,
  p_registration_id uuid,
  p_attendee_token text,
  p_member_index integer default null,
  p_checked_in_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.event_sessions%rowtype;
  v_registration public.registrations%rowtype;
  v_attendance public.session_attendance%rowtype;
  v_inserted boolean := false;
begin
  if p_session_id is null or p_registration_id is null
     or p_attendee_token is null or length(trim(p_attendee_token)) < 8
     or (p_member_index is not null and p_member_index < 0) then
    return jsonb_build_object('success', false, 'error', 'Invalid session check-in request');
  end if;

  select * into v_session
  from public.event_sessions
  where id = p_session_id and is_active = true;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Session not found or inactive');
  end if;

  select * into v_registration
  from public.registrations
  where id = p_registration_id and event_id = v_session.event_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Registration does not belong to this event');
  end if;

  if v_registration.status <> 'confirmed' then
    return jsonb_build_object('success', false, 'error', 'Only confirmed registrations can attend a session');
  end if;

  if p_member_index is not null then
    if jsonb_typeof(v_registration.team_data->'members') is distinct from 'array'
       or jsonb_array_length(v_registration.team_data->'members') <= p_member_index then
      return jsonb_build_object('success', false, 'error', 'Team member not found');
    end if;
    if v_registration.team_data->'members'->p_member_index->>'hash_payload' is distinct from p_attendee_token then
      return jsonb_build_object('success', false, 'error', 'Member ticket does not match the selected attendee');
    end if;
  else
    if v_registration.hash_payload is distinct from p_attendee_token
       and v_registration.id::text is distinct from p_attendee_token then
      return jsonb_build_object('success', false, 'error', 'Ticket does not match this registration');
    end if;
  end if;

  insert into public.session_attendance (
    session_id, registration_id, attendee_token, member_index, checked_in_by
  )
  values (
    p_session_id, p_registration_id, p_attendee_token, p_member_index, p_checked_in_by
  )
  on conflict (session_id, attendee_token) do nothing
  returning * into v_attendance;

  if found then
    v_inserted := true;
  else
    select * into v_attendance
    from public.session_attendance
    where session_id = p_session_id and attendee_token = p_attendee_token;
  end if;

  return jsonb_build_object(
    'success', true,
    'already_checked_in', not v_inserted,
    'session_id', p_session_id,
    'registration_id', p_registration_id,
    'attendee_token', p_attendee_token,
    'member_index', p_member_index,
    'checked_in_at', v_attendance.checked_in_at
  );
end;
$$;

revoke all on function public.record_session_attendance(uuid, uuid, text, integer, uuid) from public, anon, authenticated;
grant execute on function public.record_session_attendance(uuid, uuid, text, integer, uuid) to service_role;

notify pgrst, 'reload schema';
