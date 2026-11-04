-- Capacity is expressed in attendee seats, not registration records.
-- Team registrations reserve all of their requested seats atomically; if there
-- is not enough room for the entire team, the registration is waitlisted.

create or replace function public.register_for_event(
  p_event_id uuid,
  p_user_id uuid,
  p_lead_email text,
  p_form_data jsonb,
  p_team_data jsonb,
  p_idempotency_key uuid,
  p_idempotency_claim_hash text,
  p_request_fingerprint text
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
  v_requested_seats integer := 1;
  v_max_team_size integer;
  v_looking_for_members boolean := false;
begin
  if p_event_id is null or nullif(trim(p_lead_email), '') is null
     or nullif(p_idempotency_claim_hash, '') is null
     or nullif(p_request_fingerprint, '') is null then
    return jsonb_build_object('success', false, 'error', 'Registration claim and request fingerprint are required');
  end if;

  -- A replay is valid only for the same event, identity, claim and request.
  if p_idempotency_key is not null then
    select * into v_existing
    from public.registrations
    where idempotency_key = p_idempotency_key;
    if found then
      if v_existing.event_id = p_event_id
         and v_existing.user_id is not distinct from p_user_id
         and v_existing.idempotency_claim_hash = p_idempotency_claim_hash
         and v_existing.request_fingerprint = p_request_fingerprint
         and lower(v_existing.lead_email) = lower(trim(p_lead_email)) then
        return jsonb_build_object(
          'success', true, 'registration_id', v_existing.id,
          'hash_payload', v_existing.hash_payload, 'status', v_existing.status,
          'replayed', true, 'reservation_expires_at', v_existing.reservation_expires_at
        );
      end if;
      return jsonb_build_object('success', false, 'error', 'Idempotency key cannot be reused for a different registration');
    end if;
  end if;

  -- Serialize all registrations for this event. This prevents concurrent
  -- requests from reading the same remaining capacity and overselling seats.
  select * into v_event
  from public.events
  where id = p_event_id
  for update;

  if not found then return jsonb_build_object('success', false, 'error', 'Event not found'); end if;
  if not v_event.registration_open then return jsonb_build_object('success', false, 'error', 'Registration is closed'); end if;

  select * into v_existing
  from public.registrations
  where event_id = p_event_id
    and lower(lead_email) = lower(trim(p_lead_email))
    and status <> 'cancelled'
  limit 1;

  if found then
    return jsonb_build_object('success', false, 'already_registered', true,
      'error', 'A registration for this event already exists with this email address. Please use ticket recovery.');
  end if;

  if p_team_data is not null and jsonb_typeof(p_team_data->'members') = 'array' then
    v_requested_seats := greatest(jsonb_array_length(p_team_data->'members'), 1);
    v_max_team_size := coalesce((v_event.form_requirements->>'max_team_size')::integer, 4);
    if coalesce(v_event.form_requirements->>'allow_teams', 'false') <> 'true' then
      return jsonb_build_object('success', false, 'error', 'Team registration is not enabled for this event');
    end if;
    if v_requested_seats > v_max_team_size then
      return jsonb_build_object('success', false, 'error', 'Team exceeds the maximum team size');
    end if;
  end if;

  -- Count confirmed seats and unexpired payment reservations. Expired payment
  -- reservations no longer consume capacity. A team consumes its member count.
  select coalesce(sum(
    case
      when jsonb_typeof(team_data->'members') = 'array'
        then greatest(jsonb_array_length(team_data->'members'), 1)
      else 1
    end
  ), 0)::integer
  into v_count
  from public.registrations
  where event_id = p_event_id
    and (
      status = 'confirmed'
      or (status = 'pending_payment' and reservation_expires_at > now())
    );

  if v_event.max_capacity is not null
     and v_count + v_requested_seats > v_event.max_capacity then
    v_status := 'waitlisted';
    v_expires_at := null;
  elsif coalesce(v_event.form_requirements->>'event_pricing', 'free') = 'paid' then
    v_status := 'pending_payment';
    v_expires_at := now() + interval '15 minutes';
  else
    v_status := 'confirmed';
    v_expires_at := null;
  end if;

  insert into public.registrations (
    event_id, user_id, lead_email, form_data, team_data, status,
    idempotency_key, idempotency_claim_hash, request_fingerprint, reservation_expires_at
  ) values (
    p_event_id, p_user_id, lower(trim(p_lead_email)), coalesce(p_form_data, '{}'::jsonb), p_team_data, v_status,
    p_idempotency_key, p_idempotency_claim_hash, p_request_fingerprint, v_expires_at
  ) returning id, hash_payload into v_registration_id, v_hash_payload;

  v_looking_for_members := coalesce((p_team_data->>'looking_for_members')::boolean, false);
  if p_team_data is not null and v_looking_for_members then
    insert into public.teams (event_id, registration_id, team_name, leader_name, leader_email, leader_year, leader_branch, looking_for_members)
    values (p_event_id, v_registration_id, coalesce(nullif(p_team_data->>'team_name', ''), 'Team'),
      coalesce(p_team_data->>'leader_name', ''), lower(trim(p_lead_email)),
      coalesce(p_team_data->>'leader_year', ''), coalesce(p_team_data->>'leader_branch', ''), true);
  end if;

  return jsonb_build_object('success', true, 'registration_id', v_registration_id,
    'hash_payload', v_hash_payload, 'status', v_status, 'replayed', false,
    'reservation_expires_at', v_expires_at);
exception when unique_violation then
  select * into v_existing from public.registrations where idempotency_key = p_idempotency_key;
  if found and v_existing.event_id = p_event_id
     and v_existing.user_id is not distinct from p_user_id
     and v_existing.idempotency_claim_hash = p_idempotency_claim_hash
     and v_existing.request_fingerprint = p_request_fingerprint
     and lower(v_existing.lead_email) = lower(trim(p_lead_email)) then
    return jsonb_build_object('success', true, 'registration_id', v_existing.id,
      'hash_payload', v_existing.hash_payload, 'status', v_existing.status,
      'replayed', true, 'reservation_expires_at', v_existing.reservation_expires_at);
  end if;
  return jsonb_build_object('success', false, 'error', 'Idempotency key cannot be reused for a different registration');
end;
$$;

revoke all on function public.register_for_event(uuid, uuid, text, jsonb, jsonb, uuid, text, text) from public, anon, authenticated;
grant execute on function public.register_for_event(uuid, uuid, text, jsonb, jsonb, uuid, text, text) to service_role;

notify pgrst, 'reload schema';
