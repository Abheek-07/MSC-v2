-- Payment hardening: allow public event registrations to own payment orders,
-- enforce one active order per registration, and make confirmation idempotent.
-- Review and apply this migration in the Supabase project before deploying code.

alter table public.payment_orders
  alter column user_id drop not null;

create unique index if not exists payment_orders_one_active_per_registration
  on public.payment_orders (registration_id)
  where status in ('creating', 'created', 'paid');

create index if not exists payments_order_id_idx
  on public.payments (razorpay_order_id);

create or replace function public.confirm_captured_payment(
  p_razorpay_payment_id text,
  p_razorpay_order_id text,
  p_amount int,
  p_payer_email text,
  p_gateway_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.payment_orders%rowtype;
  v_existing public.payments%rowtype;
  v_registration_status text;
begin
  if nullif(p_razorpay_payment_id, '') is null
     or nullif(p_razorpay_order_id, '') is null
     or p_amount is null
     or p_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Invalid payment parameters');
  end if;

  select * into v_order
  from public.payment_orders
  where razorpay_order_id = p_razorpay_order_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Payment order not found');
  end if;

  if v_order.amount <> p_amount or v_order.currency <> 'INR' then
    return jsonb_build_object('success', false, 'error', 'Payment amount or currency mismatch');
  end if;

  select * into v_existing
  from public.payments
  where razorpay_payment_id = p_razorpay_payment_id;

  if found then
    if v_existing.razorpay_order_id <> p_razorpay_order_id then
      return jsonb_build_object('success', false, 'error', 'Payment ID is already linked to another order');
    end if;

    return jsonb_build_object(
      'success', true,
      'registration_id', v_order.registration_id,
      'status', 'confirmed',
      'replayed', true
    );
  end if;

  if v_order.status <> 'created' then
    return jsonb_build_object('success', false, 'error', 'Payment order is not in a payable state');
  end if;

  select status into v_registration_status
  from public.registrations
  where id = v_order.registration_id
    and event_id = v_order.event_id
  for update;

  if not found or v_registration_status not in ('pending_payment', 'confirmed') then
    return jsonb_build_object('success', false, 'error', 'Registration is not eligible for payment confirmation');
  end if;

  insert into public.payments (
    event_id, registration_id, user_id, razorpay_order_id,
    razorpay_payment_id, amount, payer_email, status,
    gateway_payload, verified_at
  ) values (
    v_order.event_id, v_order.registration_id, v_order.user_id,
    p_razorpay_order_id, p_razorpay_payment_id, p_amount,
    p_payer_email, 'captured', p_gateway_payload, now()
  );

  update public.payment_orders
  set status = 'paid', updated_at = now()
  where id = v_order.id and status = 'created';

  update public.registrations
  set status = 'confirmed',
      reservation_expires_at = null,
      updated_at = now()
  where id = v_order.registration_id
    and event_id = v_order.event_id
    and status = 'pending_payment';

  return jsonb_build_object(
    'success', true,
    'registration_id', v_order.registration_id,
    'status', 'confirmed',
    'replayed', false
  );
end;
$$;

revoke all on function public.confirm_captured_payment(text, text, int, text, jsonb) from public, anon, authenticated;
grant execute on function public.confirm_captured_payment(text, text, int, text, jsonb) to service_role;

notify pgrst, 'reload schema';


-- Registration idempotency and capacity are enforced in the database transaction.
create unique index if not exists registrations_idempotency_key_unique
  on public.registrations (idempotency_key)
  where idempotency_key is not null;

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

  select * into v_existing
  from public.registrations
  where event_id = p_event_id
    and lower(lead_email) = lower(trim(p_lead_email))
    and status <> 'cancelled'
  limit 1;

  if found then
    return jsonb_build_object(
      'success', true, 'registration_id', v_existing.id,
      'hash_payload', v_existing.hash_payload, 'status', v_existing.status,
      'replayed', true
    );
  end if;

  select count(*) into v_count
  from public.registrations
  where event_id = p_event_id
    and (
      status = 'confirmed'
      or (status = 'pending_payment' and reservation_expires_at > now())
    );

  if v_event.max_capacity is not null and v_count >= v_event.max_capacity then
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
    event_id, user_id, lead_email, form_data, team_data,
    status, idempotency_key, reservation_expires_at
  ) values (
    p_event_id, p_user_id, lower(trim(p_lead_email)),
    coalesce(p_form_data, '{}'::jsonb), p_team_data,
    v_status, p_idempotency_key, v_expires_at
  )
  returning id, hash_payload into v_registration_id, v_hash_payload;

  v_looking_for_members := coalesce((p_team_data->>'looking_for_members')::boolean, false);
  if p_team_data is not null and v_looking_for_members then
    insert into public.teams (
      event_id, registration_id, team_name, leader_name, leader_email,
      leader_year, leader_branch, looking_for_members
    ) values (
      p_event_id, v_registration_id,
      coalesce(nullif(p_team_data->>'team_name', ''), 'Team'),
      coalesce(p_team_data->>'leader_name', ''),
      lower(trim(p_lead_email)),
      coalesce(p_team_data->>'leader_year', ''),
      coalesce(p_team_data->>'leader_branch', ''),
      true
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'hash_payload', v_hash_payload,
    'status', v_status,
    'replayed', false,
    'reservation_expires_at', v_expires_at
  );
exception
  when unique_violation then
    -- A duplicate idempotency key can only occur under concurrent retries.
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
    raise;
end;
$$;

revoke all on function public.register_for_event(uuid, uuid, text, jsonb, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.register_for_event(uuid, uuid, text, jsonb, jsonb, uuid) to service_role;

