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
