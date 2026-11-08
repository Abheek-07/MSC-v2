-- Event promotions: early-bird pricing and coupon codes.
-- Amounts and ticket prices are stored in whole INR to match the current MSC checkout.

create table if not exists public.event_promotions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  promotion_type text not null check (promotion_type in ('early_bird', 'coupon')),
  code text,
  discount_type text not null check (discount_type in ('fixed', 'percentage')),
  discount_value integer not null check (discount_value > 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  max_per_email integer not null default 1 check (max_per_email > 0),
  min_order_amount integer not null default 0 check (min_order_amount >= 0),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((promotion_type = 'coupon' and nullif(trim(code), '') is not null)
      or (promotion_type = 'early_bird' and code is null))
);

create unique index if not exists event_promotions_event_code_unique
  on public.event_promotions(event_id, upper(code)) where promotion_type = 'coupon';
create index if not exists event_promotions_active_idx
  on public.event_promotions(event_id, promotion_type, active, starts_at, ends_at);

create table if not exists public.event_promotion_redemptions (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.event_promotions(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  registration_id uuid not null references public.registrations(id) on delete restrict,
  lead_email text not null,
  status text not null default 'reserved' check (status in ('reserved', 'redeemed', 'cancelled')),
  reserved_until timestamptz not null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (promotion_id, registration_id)
);
create index if not exists event_promotion_redemptions_quota_idx
  on public.event_promotion_redemptions(promotion_id, status, reserved_until);
create index if not exists event_promotion_redemptions_email_idx
  on public.event_promotion_redemptions(promotion_id, lower(lead_email), status);

alter table public.payment_orders
  add column if not exists promotion_id uuid references public.event_promotions(id) on delete set null,
  add column if not exists discount_amount integer not null default 0 check (discount_amount >= 0);

alter table public.event_promotions enable row level security;
alter table public.event_promotion_redemptions enable row level security;
revoke all on public.event_promotions, public.event_promotion_redemptions from anon, authenticated;
grant select, insert, update, delete on public.event_promotions to service_role;
grant select, insert, update, delete on public.event_promotion_redemptions to service_role;

create or replace function public.preview_event_promotion(
  p_event_id uuid, p_registration_id uuid, p_coupon_code text, p_base_amount integer, p_lead_email text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_promotion public.event_promotions%rowtype;
  v_discount integer := 0;
  v_now timestamptz := now();
  v_code text := upper(trim(coalesce(p_coupon_code, '')));
begin
  if p_event_id is null or p_base_amount is null or p_base_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Invalid promotion request');
  end if;

  if v_code <> '' then
    select * into v_promotion from public.event_promotions
      where event_id = p_event_id and promotion_type = 'coupon' and upper(code) = v_code
      and active for share;
  else
    select * into v_promotion from public.event_promotions
      where event_id = p_event_id and promotion_type = 'early_bird' and active
      and starts_at <= v_now and (ends_at is null or ends_at > v_now)
      order by created_at desc limit 1;
  end if;

  if not found then
    if v_code <> '' then return jsonb_build_object('success', false, 'error', 'Coupon code is invalid or inactive'); end if;
    return jsonb_build_object('success', true, 'promotion', null, 'base_amount', p_base_amount, 'discount_amount', 0, 'final_amount', p_base_amount);
  end if;

  if v_promotion.starts_at > v_now or (v_promotion.ends_at is not null and v_promotion.ends_at <= v_now) then
    return jsonb_build_object('success', false, 'error', 'This offer is not currently available');
  end if;
  if p_base_amount < v_promotion.min_order_amount then
    return jsonb_build_object('success', false, 'error', format('Minimum order amount is ₹%s', v_promotion.min_order_amount));
  end if;

  if v_promotion.max_redemptions is not null and (
    select count(*) from public.event_promotion_redemptions r
    where r.promotion_id = v_promotion.id
      and (r.status = 'redeemed' or (r.status = 'reserved' and r.reserved_until > v_now))
  ) >= v_promotion.max_redemptions then
    return jsonb_build_object('success', false, 'error', 'This offer has reached its redemption limit');
  end if;

  if p_lead_email is not null and (
    select count(*) from public.event_promotion_redemptions r
    where r.promotion_id = v_promotion.id and lower(r.lead_email) = lower(trim(p_lead_email))
      and (r.status = 'redeemed' or (r.status = 'reserved' and r.reserved_until > v_now))
  ) >= v_promotion.max_per_email then
    return jsonb_build_object('success', false, 'error', 'This offer has already been used the maximum number of times for this email');
  end if;

  if v_promotion.discount_type = 'percentage' then
    v_discount := least(p_base_amount, floor(p_base_amount::numeric * v_promotion.discount_value / 100)::integer);
  else
    v_discount := least(p_base_amount, v_promotion.discount_value);
  end if;

  if v_discount >= p_base_amount then
    return jsonb_build_object('success', false, 'error', 'The discount must leave a positive ticket price.');
  end if;

  return jsonb_build_object(
    'success', true,
    'promotion', jsonb_build_object('id', v_promotion.id, 'type', v_promotion.promotion_type, 'code', v_promotion.code,
      'discount_type', v_promotion.discount_type, 'discount_value', v_promotion.discount_value),
    'base_amount', p_base_amount, 'discount_amount', v_discount, 'final_amount', p_base_amount - v_discount
  );
end;
$$;

create or replace function public.reserve_event_promotion(
  p_event_id uuid, p_registration_id uuid, p_coupon_code text, p_base_amount integer, p_lead_email text,
  p_reserved_until timestamptz
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_promotion public.event_promotions%rowtype;
  v_preview jsonb;
  v_discount integer;
  v_code text := upper(trim(coalesce(p_coupon_code, '')));
begin
  if p_reserved_until is null or p_reserved_until <= now() then
    return jsonb_build_object('success', false, 'error', 'Invalid reservation expiry');
  end if;

  if v_code <> '' then
    select * into v_promotion from public.event_promotions
      where event_id = p_event_id and promotion_type = 'coupon' and upper(code) = v_code and active
      for update;
  else
    select * into v_promotion from public.event_promotions
      where event_id = p_event_id and promotion_type = 'early_bird' and active
      and starts_at <= now() and (ends_at is null or ends_at > now())
      order by created_at desc limit 1 for update;
  end if;

  if not found then
    if v_code <> '' then return jsonb_build_object('success', false, 'error', 'Coupon code is invalid or inactive'); end if;
    return jsonb_build_object('success', true, 'promotion_id', null, 'discount_amount', 0, 'final_amount', p_base_amount);
  end if;

  v_preview := public.preview_event_promotion(p_event_id, p_registration_id, p_coupon_code, p_base_amount, p_lead_email);
  if coalesce((v_preview->>'success')::boolean, false) is not true then return v_preview; end if;
  v_discount := coalesce((v_preview->>'discount_amount')::integer, 0);

  insert into public.event_promotion_redemptions(promotion_id, event_id, registration_id, lead_email, status, reserved_until)
  values (v_promotion.id, p_event_id, p_registration_id, lower(trim(p_lead_email)), 'reserved', p_reserved_until)
  on conflict (promotion_id, registration_id) do update
    set status = 'reserved', reserved_until = excluded.reserved_until, lead_email = excluded.lead_email
    where public.event_promotion_redemptions.status <> 'redeemed';

  return jsonb_build_object('success', true, 'promotion_id', v_promotion.id,
    'discount_amount', v_discount, 'final_amount', p_base_amount - v_discount);
end;
$$;

create or replace function public.release_event_promotion(p_registration_id uuid)
returns void language sql security definer set search_path = public
as $$
  update public.event_promotion_redemptions set status = 'cancelled'
  where registration_id = p_registration_id and status = 'reserved';
$$;

create or replace function public.redeem_event_promotion_after_payment()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  update public.event_promotion_redemptions
  set status = 'redeemed', redeemed_at = now()
  where registration_id = new.registration_id and status = 'reserved' and reserved_until > now();
  return new;
end;
$$;

drop trigger if exists payments_redeem_event_promotion on public.payments;
create trigger payments_redeem_event_promotion
  after insert on public.payments
  for each row execute function public.redeem_event_promotion_after_payment();

revoke all on function public.preview_event_promotion(uuid, uuid, text, integer, text) from public, anon, authenticated;
revoke all on function public.reserve_event_promotion(uuid, uuid, text, integer, text, timestamptz) from public, anon, authenticated;
revoke all on function public.release_event_promotion(uuid) from public, anon, authenticated;
grant execute on function public.preview_event_promotion(uuid, uuid, text, integer, text) to service_role;
grant execute on function public.reserve_event_promotion(uuid, uuid, text, integer, text, timestamptz) to service_role;
grant execute on function public.release_event_promotion(uuid) to service_role;

notify pgrst, 'reload schema';
