-- ==============================================================================
-- 20261107_secure_ticket_and_registration.sql
-- Security Hardening:
--  1. Prevent ticket token disclosure on duplicate registrations in register_for_event
--  2. Explicit search_path = public on role triggers
-- ==============================================================================

-- 1. Hardened register_for_event: Never disclose hash_payload on duplicate email submissions
create or replace function public.register_for_event(
  p_event_id uuid,
  p_user_id uuid,
  p_lead_email text,
  p_form_data jsonb,
  p_team_data jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_existing public.registrations%rowtype;
  v_registration_id uuid;
  v_hash_payload uuid;
  v_status text;
  v_expires_at timestamptz;
  v_count integer;
  v_looking_for_members boolean := false;
begin
  if p_event_id is null or nullif(trim(p_lead_email), '') is null then
    return jsonb_build_object('success', false, 'error', 'Event and email are required');
  end if;

  -- True idempotency check: only an exact match on idempotency_key is a valid replay
  if p_idempotency_key is not null then
    select * into v_existing
    from public.registrations
    where idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object(
        'success', true, 'registration_id', v_existing.id,
        'hash_payload', v_existing.hash_payload, 'status', v_existing.status,
        'replayed', true
      );
    end if;
  end if;

  -- Serialize registrations for this event so capacity cannot be oversold.
  select * into v_event
  from public.events
  where id = p_event_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Event not found');
  end if;
  if not v_event.registration_open then
    return jsonb_build_object('success', false, 'error', 'Registration is closed');
  end if;

  -- If this email is already registered, refuse to return the secret hash_payload.
  -- This prevents malicious actors from stealing existing tickets by re-registering an email.
  select * into v_existing
  from public.registrations
  where event_id = p_event_id
    and lower(lead_email) = lower(trim(p_lead_email))
    and status <> 'cancelled'
  limit 1;

  if found then
    return jsonb_build_object(
      'success', false,
      'already_registered', true,
      'error', 'A registration for this event already exists with this email address. Please check your confirmation email or use ticket recovery.'
    );
  end if;

  -- Capacity check (confirmed + unexpired pending reservations)
  select count(*) into v_count
  from public.registrations
  where event_id = p_event_id
    and (
      status = 'confirmed'
      or (status = 'pending_payment' and reservation_expires_at > now())
    );

  if v_event.max_capacity is not null and v_count >= v_event.max_capacity then
    return jsonb_build_object('success', false, 'error', 'Event is sold out');
  end if;

  if coalesce(v_event.form_requirements->>'event_pricing', 'free') = 'paid' then
    v_status := 'pending_payment';
    v_expires_at := now() + interval '15 minutes';
  else
    v_status := 'confirmed';
    v_expires_at := null;
  end if;

  v_registration_id := gen_random_uuid();
  v_hash_payload := gen_random_uuid();

  insert into public.registrations (
    id, event_id, user_id, lead_email, hash_payload,
    form_data, team_data, checked_in, status,
    idempotency_key, reservation_expires_at,
    created_at, updated_at
  ) values (
    v_registration_id, p_event_id, p_user_id, lower(trim(p_lead_email)), v_hash_payload,
    coalesce(p_form_data, '{}'::jsonb), p_team_data, false, v_status,
    p_idempotency_key, v_expires_at,
    now(), now()
  );

  -- Team matchmaking logic
  if p_team_data is not null and p_team_data->>'team_name' is not null then
    v_looking_for_members := coalesce((p_team_data->>'looking_for_members')::boolean, false);
    insert into public.teams (
      event_id, team_name, registration_id, looking_for_members, created_at, updated_at
    ) values (
      p_event_id, trim(p_team_data->>'team_name'), v_registration_id, v_looking_for_members, now(), now()
    )
    on conflict do nothing;
  end if;

  return jsonb_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'hash_payload', v_hash_payload,
    'status', v_status,
    'replayed', false,
    'reservation_expires_at', v_expires_at
  );
end;
$$;

revoke all on function public.register_for_event(uuid, uuid, text, jsonb, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.register_for_event(uuid, uuid, text, jsonb, jsonb, uuid) to service_role;

-- 2. Explicit search path on role triggers
create or replace function public.enforce_single_admin()
returns trigger language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from public.member_profiles where role = 'admin') > 1 then
    raise exception 'SINGLE_ADMIN: only one admin allowed'
      using errcode = 'P0001';
  end if;
  return null;
end;
$$;

create or replace function public.protect_role_change()
returns trigger language plpgsql
set search_path = public
as $$
begin
  if old.role is distinct from new.role then
    if old.id = auth.uid() then
      raise exception 'SELF_ROLE_CHANGE: users cannot change their own role'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';

