-- Revocable individual ticket tokens.
-- Tokens remain UUIDs for compatibility with existing scanner and ticket URLs.
create table if not exists public.ticket_token_revocations (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  token text not null unique,
  revoked_by uuid,
  revoked_at timestamptz not null default now(),
  reason text not null default 'regenerated'
);

create index if not exists ticket_token_revocations_registration_idx
  on public.ticket_token_revocations(registration_id);

alter table public.ticket_token_revocations enable row level security;
revoke all on public.ticket_token_revocations from public, anon, authenticated;
grant select, insert on public.ticket_token_revocations to service_role;

create or replace function public.rotate_ticket_token(
  p_registration_id uuid,
  p_member_index integer,
  p_new_token text,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.registrations%rowtype;
  v_old_token text;
  v_members jsonb;
begin
  if p_registration_id is null
     or p_new_token is null
     or p_new_token !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return jsonb_build_object('success', false, 'error', 'Invalid ticket token parameters');
  end if;

  select * into v_registration
  from public.registrations
  where id = p_registration_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Registration not found');
  end if;

  if p_member_index is null then
    v_old_token := v_registration.hash_payload::text;
    update public.registrations
    set hash_payload = p_new_token::uuid, updated_at = now()
    where id = p_registration_id;
  else
    v_members := v_registration.team_data->'members';
    if jsonb_typeof(v_members) <> 'array'
       or p_member_index < 0
       or p_member_index >= jsonb_array_length(v_members) then
      return jsonb_build_object('success', false, 'error', 'Team member not found');
    end if;

    v_old_token := v_members->p_member_index->>'hash_payload';
    v_members := jsonb_set(
      v_members,
      array[p_member_index::text, 'hash_payload'],
      to_jsonb(p_new_token),
      true
    );
    update public.registrations
    set team_data = jsonb_set(coalesce(team_data, '{}'::jsonb), '{members}', v_members, true),
        updated_at = now()
    where id = p_registration_id;
  end if;

  if v_old_token is not null and v_old_token <> '' and v_old_token <> p_new_token then
    insert into public.ticket_token_revocations(registration_id, token, revoked_by)
    values (p_registration_id, v_old_token, p_actor_id)
    on conflict (token) do nothing;
  end if;

  return jsonb_build_object('success', true, 'old_token_revoked', v_old_token is not null);
end;
$$;

revoke all on function public.rotate_ticket_token(uuid, integer, text, uuid) from public, anon, authenticated;
grant execute on function public.rotate_ticket_token(uuid, integer, text, uuid) to service_role;

notify pgrst, 'reload schema';
