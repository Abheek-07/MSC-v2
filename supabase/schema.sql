
create extension if not exists pgcrypto;

-- 1. MEMBER PROFILES (1:1 with auth.users)
create table if not exists public.member_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  registration_number text,
  phone_number text,
  department text,
  year_of_study text,
  bio text,
  profile_picture_url text,
  is_onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper function to break RLS recursion: returns role of current authenticated user
-- Replace lines 22-30 with:
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.member_profiles where id = auth.uid();
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.member_profiles (
    id,
    email,
    full_name,
    role,
    is_onboarded
  )
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    'member',
    false
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(
          nullif(public.member_profiles.full_name, ''),
          excluded.full_name
        );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. EVENTS
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  description text,
  location text,
  type text,
  status text not null default 'upcoming' check (status in ('upcoming', 'completed')),
  date_start timestamptz,
  date_end timestamptz,
  image_url text,
  banner_url text,
  registration_open boolean not null default false,
  show_opening_soon boolean not null default false,
  is_published boolean not null default true,
  max_capacity integer,
  form_requirements jsonb not null default '{}'::jsonb,
  certificate_html text,
  gallery_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_events_status_date on public.events(status, date_start desc);
create index if not exists idx_events_slug on public.events(slug);

-- 3. REGISTRATIONS
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  lead_email text not null,
  hash_payload uuid not null default gen_random_uuid(),
  form_data jsonb not null default '{}'::jsonb,
  team_data jsonb,
  checked_in boolean not null default false,
  status text not null default 'confirmed'
    check (status in ('pending_payment', 'confirmed', 'waitlisted', 'cancelled')),
  idempotency_key uuid,
  reservation_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_registrations_hash_payload on public.registrations(hash_payload);
create unique index if not exists idx_registrations_event_lead_email on public.registrations(event_id, lower(lead_email));
create unique index if not exists idx_registrations_event_user_id on public.registrations(event_id, user_id) where user_id is not null;
create index if not exists idx_registrations_event_status on public.registrations(event_id, status, created_at desc);

-- 4. TEAMS (Matchmaking)
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  registration_id uuid references public.registrations(id) on delete cascade,
  team_name text not null,
  leader_name text,
  leader_email text,
  leader_year text,
  leader_branch text,
  looking_for_members boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_teams_event_looking on public.teams(event_id, looking_for_members);

-- 5. TEAM MEMBERS (Public /team roster)
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  tier text default 'member' check (tier is null or tier in ('chief','president','board','lead','member')),
  category text default 'team',
  email text,
  linkedin_url text,
  github_url text,
  twitter_url text,
  instagram_url text,
  portfolio_url text,
  image_url text,
  display_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. GALLERY ITEMS
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text,
  category text default 'misc',
  image_url text not null,
  alt_text text,
  created_at timestamptz not null default now()
);

-- 7. PASSWORD RESET REQUESTS
create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  new_password text, -- Deprecated; must remain NULL. Passwords are reset through Supabase Auth.
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. PAYMENTS & PAYMENT ORDERS
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  registration_id uuid references public.registrations(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  razorpay_order_id text,
  razorpay_payment_id text unique,
  amount integer not null,
  charge_type text,
  payer_email text,
  status text not null default 'pending',
  gateway_payload jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  registration_id uuid not null references public.registrations(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  idempotency_key uuid not null,
  razorpay_order_id text unique,
  amount integer not null check (amount > 0 and amount <= 10000000),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'creating'
    check (status in ('creating','created','paid','failed','cancelled')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_id, idempotency_key)
);

-- Ensure all table columns exist on upgraded/pre-existing databases before compiling functions:
alter table public.teams
  add column if not exists registration_id uuid references public.registrations(id) on delete cascade,
  add column if not exists looking_for_members boolean not null default false,
  add column if not exists leader_year text,
  add column if not exists leader_branch text;

alter table public.payments
  add column if not exists registration_id uuid references public.registrations(id) on delete set null,
  add column if not exists event_id uuid references public.events(id) on delete set null,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text,
  add column if not exists charge_type text,
  add column if not exists payer_email text,
  add column if not exists gateway_payload jsonb,
  add column if not exists verified_at timestamptz;

alter table public.payment_orders
  add column if not exists registration_id uuid references public.registrations(id) on delete restrict,
  add column if not exists event_id uuid references public.events(id) on delete restrict,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists idempotency_key uuid,
  add column if not exists razorpay_order_id text,
  add column if not exists amount integer,
  add column if not exists currency text default 'INR',
  add column if not exists status text default 'creating',
  add column if not exists expires_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.registrations
  add column if not exists idempotency_key uuid,
  add column if not exists reservation_expires_at timestamptz,
  add column if not exists checked_in boolean not null default false,
  add column if not exists status text not null default 'confirmed',
  add column if not exists form_data jsonb not null default '{}'::jsonb,
  add column if not exists team_data jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.password_reset_requests
  add column if not exists expires_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.events
  add column if not exists show_opening_soon boolean not null default false,
  add column if not exists max_capacity integer,
  add column if not exists is_published boolean not null default true,
  add column if not exists certificate_html text,
  add column if not exists gallery_urls text[] not null default '{}',
  add column if not exists form_requirements jsonb not null default '{}'::jsonb;

-- ==============================================================================
-- SECURITY DEFINER RPCs
-- ==============================================================================

-- Cron helper: Expire abandoned payment holds
create or replace function public.expire_payment_reservations()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  with expired as (
    update public.registrations
    set status = 'cancelled', updated_at = now()
    where status = 'pending_payment'
      and reservation_expires_at is not null
      and reservation_expires_at < now()
    returning id
  )
  select count(*) into v_count from expired;

  update public.payment_orders
  set status = 'cancelled', updated_at = now()
  where status in ('creating', 'created')
    and expires_at < now();

  return v_count;
end;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.member_profiles enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.gallery_items enable row level security;
alter table public.password_reset_requests enable row level security;
alter table public.payments enable row level security;
alter table public.payment_orders enable row level security;

-- 1. member_profiles
drop policy if exists "member_profiles_owner_read" on public.member_profiles;
create policy "member_profiles_owner_read" on public.member_profiles
  for select using (auth.uid() = id or public.current_user_role() = 'admin');

drop policy if exists "member_profiles_owner_update" on public.member_profiles;
create policy "member_profiles_owner_update" on public.member_profiles
  for update using (auth.uid() = id or public.current_user_role() = 'admin');

-- 2. events
drop policy if exists "events_public_read" on public.events;
create policy "events_public_read" on public.events
  for select using (is_published = true or public.current_user_role() = 'admin');

drop policy if exists "events_staff_write" on public.events;
create policy "events_staff_write" on public.events
  for all using (public.current_user_role() = 'admin');

-- 3. registrations
drop policy if exists "registrations_read" on public.registrations;
create policy "registrations_read" on public.registrations
  for select using (
    auth.uid() = user_id or
    public.current_user_role() = 'admin'
  );

drop policy if exists "registrations_staff_update" on public.registrations;
create policy "registrations_staff_update" on public.registrations
  for update using (public.current_user_role() = 'admin');

-- 4. teams
drop policy if exists "teams_public_read" on public.teams;
create policy "teams_public_read" on public.teams
  for select using (true);

drop policy if exists "teams_staff_write" on public.teams;
create policy "teams_staff_write" on public.teams
  for all using (public.current_user_role() = 'admin');

-- 5. team_members
drop policy if exists "team_members_public_read" on public.team_members;
create policy "team_members_public_read" on public.team_members
  for select using (true);

drop policy if exists "team_members_staff_write" on public.team_members;
create policy "team_members_staff_write" on public.team_members
  for all using (public.current_user_role() = 'admin');

-- 6. gallery_items
drop policy if exists "gallery_items_public_read" on public.gallery_items;
create policy "gallery_items_public_read" on public.gallery_items
  for select using (true);

drop policy if exists "gallery_items_staff_write" on public.gallery_items;
create policy "gallery_items_staff_write" on public.gallery_items
  for all using (public.current_user_role() = 'admin');

-- 7. password_reset_requests
drop policy if exists "password_reset_requests_admin_read" on public.password_reset_requests;
create policy "password_reset_requests_admin_read" on public.password_reset_requests
  for select using (public.current_user_role() = 'admin');

drop policy if exists "password_reset_requests_admin_update" on public.password_reset_requests;
create policy "password_reset_requests_admin_update" on public.password_reset_requests
  for update using (public.current_user_role() = 'admin');

-- 8. payments & payment_orders: Revoke all from anon & authenticated
revoke all on public.payments from anon, authenticated;
revoke all on public.payment_orders from anon, authenticated;




-- ==============================================================================
-- CONSOLIDATED MIGRATION STATE
-- This section represents the final schema after all numbered migrations.
-- It is a fresh-install reference, not a migration runner.
-- ==============================================================================

-- Two-role model. Legacy enum labels, if present in an upgraded database, are
-- not removable; this text-based reference schema enforces the active values.
alter table public.member_profiles alter column role set default 'member';
alter table public.member_profiles drop constraint if exists member_profiles_role_check;
alter table public.member_profiles
  add constraint member_profiles_role_check check (role in ('admin', 'member'));

-- Password reset requests never store password material and expire after 24h.
alter table public.password_reset_requests alter column new_password drop not null;
alter table public.password_reset_requests
  add column if not exists expires_at timestamptz;
alter table public.password_reset_requests
  add column if not exists updated_at timestamptz not null default now();
alter table public.password_reset_requests
  alter column expires_at set default (now() + interval '24 hours');
create index if not exists idx_password_reset_requests_pending_expiry
  on public.password_reset_requests(status, expires_at)
  where status = 'pending';

-- Payment order ownership supports guest registrations.
alter table public.payment_orders
  add column if not exists registration_id uuid references public.registrations(id) on delete restrict;
alter table public.payment_orders alter column user_id drop not null;

alter table public.payments
  add column if not exists registration_id uuid references public.registrations(id) on delete set null;

alter table public.teams
  add column if not exists registration_id uuid references public.registrations(id) on delete cascade;

alter table public.registrations
  add column if not exists idempotency_key uuid;
alter table public.registrations
  add column if not exists reservation_expires_at timestamptz;

create unique index if not exists payment_orders_one_active_per_registration
  on public.payment_orders(registration_id)
  where status in ('creating', 'created', 'paid');
create index if not exists payments_order_id_idx
  on public.payments(razorpay_order_id);
create unique index if not exists registrations_idempotency_key_unique
  on public.registrations(idempotency_key)
  where idempotency_key is not null;

-- Corrected equivalent of 20261103_individual_team_member_qr.sql.
-- The committed migration file contains malformed duplicated SQL fragments.
-- This version assigns UUIDs only to missing or invalid member tokens.
update public.registrations r
set team_data = jsonb_set(
  r.team_data,
  '{members}',
  (
    select coalesce(
      jsonb_agg(
        case
          when jsonb_typeof(m.value) = 'object'
            and coalesce(m.value->>'hash_payload', '') !~*
              '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then jsonb_set(m.value, '{hash_payload}', to_jsonb(gen_random_uuid()::text), true)
          else m.value
        end
        order by m.ordinality
      ),
      '[]'::jsonb
    )
    from jsonb_array_elements(r.team_data->'members')
      with ordinality as m(value, ordinality)
  ),
  true
)
where jsonb_typeof(r.team_data->'members') = 'array'
  and exists (
    select 1
    from jsonb_array_elements(r.team_data->'members') as member(value)
    where jsonb_typeof(member.value) = 'object'
      and coalesce(member.value->>'hash_payload', '') !~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

comment on column public.registrations.team_data is
  'Team JSON. Embedded members receive independent hash_payload UUIDs for individual QR check-in.';

-- The two-role migration removes these older staff write policies and does not
-- recreate them. Admin-only access is provided by the remaining server RPCs.
drop policy if exists "registrations_staff_insert" on public.registrations;
drop policy if exists "registrations_staff_delete" on public.registrations;


-- Final function, trigger, index, and table definitions from the migrations.
-- ==============================================================================
-- SINGLE ADMIN ENFORCEMENT (database layer)
-- ==============================================================================
-- There can be only one administrator. This is enforced by:
--  1. A deferred constraint trigger that counts admins at commit time.
--  2. A BEFORE trigger preventing users from changing their own role.
--  3. A helper function for SQL-only admin handover (2-statement transaction).
--
-- The application layer (lib/single-admin.ts) also rejects promotions when an
-- admin already exists (HTTP 409), but these triggers are the ultimate backstop.
-- ==============================================================================

-- 1. Single-admin constraint: allows at most one 'admin' row in member_profiles.
--    DEFERRABLE INITIALLY DEFERRED means the check runs at COMMIT, so a SQL
--    handover (demote old admin + promote new admin in one transaction) works.
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

drop trigger if exists enforce_single_admin_trigger on public.member_profiles;
create constraint trigger enforce_single_admin_trigger
  after insert or update or delete on public.member_profiles
  deferrable initially deferred
  for each row execute function public.enforce_single_admin();

-- 2. Prevent users from changing their own role (self-demotion / self-promotion).
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

drop trigger if exists protect_role_change_trigger on public.member_profiles;
create trigger protect_role_change_trigger
  before update of role on public.member_profiles
  for each row execute function public.protect_role_change();

-- 3. SQL-only admin handover procedure (documentation).
--    Run as a single transaction in the Supabase SQL editor:
--
--    begin;
--    update public.member_profiles set role = 'member' where role = 'admin';
--    update public.member_profiles set role = 'admin' where id = 'NEW_ADMIN_UUID';
--    commit;
--
--    The deferred constraint trigger allows the temporary zero-admin state
--    within the transaction. At commit, exactly one admin exists → success.

-- 4. Refresh PostgREST schema cache so new triggers are visible immediately
notify pgrst, 'reload schema';

-- >>> 20261101_payment_hardening.sql
-- Payment hardening: allow public event registrations to own payment orders,
-- enforce one active order per registration, and make confirmation idempotent.
-- Review and apply this migration in the Supabase project before deploying code.

alter table public.payment_orders
  add column if not exists registration_id uuid references public.registrations(id) on delete restrict;

alter table public.payment_orders
  alter column user_id drop not null;

alter table public.payments
  add column if not exists registration_id uuid references public.registrations(id) on delete set null;

alter table public.teams
  add column if not exists registration_id uuid references public.registrations(id) on delete cascade;

alter table public.registrations
  add column if not exists idempotency_key uuid;

alter table public.registrations
  add column if not exists reservation_expires_at timestamptz;

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
      'success', false,
      'already_registered', true,
      'error', 'A registration for this event already exists with this email address. Please check your confirmation email or use ticket recovery.'
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



-- >>> 20261102_atomic_admin_registration_import.sql
-- Atomic admin registration import.
-- The caller validates and normalizes rows. This function guarantees that
-- clear-first and all upserts commit together or roll back together.
create or replace function public.admin_import_registrations(
  p_rows jsonb,
  p_clear_first boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row_count integer;
  v_processed integer;
  v_event_ids uuid[];
begin
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'p_rows must be a JSON array';
  end if;

  v_row_count := jsonb_array_length(p_rows);
  if v_row_count < 1 or v_row_count > 500 then
    raise exception 'Import must contain between 1 and 500 rows';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_rows) as x(event_id uuid, lead_email text)
    group by event_id, lower(lead_email)
    having count(*) > 1
  ) then
    raise exception 'Duplicate event/email pair in import';
  end if;

  select array_agg(distinct event_id)
    into v_event_ids
    from jsonb_to_recordset(p_rows) as x(event_id uuid);

  if v_event_ids is null or cardinality(v_event_ids) = 0 then
    raise exception 'Import contains no event IDs';
  end if;

  -- Validate all referenced events before any destructive operation.
  if exists (
    select 1
    from unnest(v_event_ids) as requested(id)
    left join public.events e on e.id = requested.id
    where e.id is null
  ) then
    raise exception 'One or more events do not exist';
  end if;

  if p_clear_first then
    delete from public.registrations
    where event_id = any(v_event_ids);
  end if;

  insert into public.registrations (
    event_id, lead_email, status, checked_in, form_data, team_data, created_at, updated_at
  )
  select
    x.event_id,
    lower(trim(x.lead_email)),
    coalesce(x.status, 'confirmed'),
    coalesce(x.checked_in, false),
    coalesce(x.form_data, '{}'::jsonb),
    x.team_data,
    coalesce(x.created_at, now()),
    now()
  from jsonb_to_recordset(p_rows) as x(
    event_id uuid,
    lead_email text,
    status text,
    checked_in boolean,
    form_data jsonb,
    team_data jsonb,
    created_at timestamptz
  )
  on conflict (event_id, lower(lead_email))
  do update set
    status = excluded.status,
    checked_in = excluded.checked_in,
    form_data = excluded.form_data,
    team_data = excluded.team_data,
    updated_at = now();

  get diagnostics v_processed = row_count;
  return jsonb_build_object('success', true, 'processed_count', v_processed);
end;
$$;

revoke all on function public.admin_import_registrations(jsonb, boolean) from public;
revoke all on function public.admin_import_registrations(jsonb, boolean) from anon;
revoke all on function public.admin_import_registrations(jsonb, boolean) from authenticated;
grant execute on function public.admin_import_registrations(jsonb, boolean) to service_role;


-- >>> 20261102_atomic_checkin.sql
-- Atomic, event-scoped check-in. Apply after 20261101_payment_hardening.sql.
create or replace function public.checkin_registration(
  p_event_id uuid,
  p_registration_id uuid,
  p_team_mode text default 'lead_only',
  p_member_index integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg public.registrations%rowtype;
  v_team_name text;
  v_team_id text;
  v_updated public.registrations%rowtype;
  v_already_checked_in boolean := false;
begin
  if p_event_id is null or p_registration_id is null
     or p_team_mode is null or p_team_mode not in ('lead_only', 'all', 'member') then
    return jsonb_build_object('success', false, 'error', 'Invalid check-in request');
  end if;
  if p_member_index is not null and p_member_index < 0 then
    return jsonb_build_object('success', false, 'error', 'Invalid team member index');
  end if;

  select * into v_reg from public.registrations
  where id = p_registration_id and event_id = p_event_id for update;
  if not found then return jsonb_build_object('success', false, 'error', 'Registration not found for this event'); end if;
  if v_reg.status <> 'confirmed' then return jsonb_build_object('success', false, 'error', 'Only confirmed registrations can be checked in'); end if;

  v_already_checked_in := v_reg.checked_in;
  v_team_name := nullif(trim(v_reg.team_data->>'team_name'), '');
  v_team_id := nullif(trim(v_reg.team_data->>'team_id'), '');

  if p_team_mode = 'all' and (v_team_name is not null or v_team_id is not null) then
    update public.registrations r
    set checked_in = true,
        team_data = case
          when jsonb_typeof(r.team_data->'members') = 'array'
          then jsonb_set(r.team_data, '{members}', (
            select coalesce(jsonb_agg(
              case when jsonb_typeof(m.value) = 'object'
                then jsonb_set(m.value, '{checked_in}', 'true'::jsonb, true)
                else m.value end order by m.ordinality
            ), '[]'::jsonb)
            from jsonb_array_elements(r.team_data->'members') with ordinality as m(value, ordinality)
          ), true)
          else r.team_data end,
        updated_at = now()
    where r.event_id = p_event_id
      and ((v_team_id is not null and r.team_data->>'team_id' = v_team_id)
        or (v_team_id is null and v_team_name is not null and lower(r.team_data->>'team_name') = lower(v_team_name))
        or r.id = p_registration_id);
  elsif p_team_mode = 'member' and p_member_index is not null then
    if jsonb_typeof(v_reg.team_data->'members') is distinct from 'array' then
      return jsonb_build_object('success', false, 'error', 'Team member not found');
    end if;
    if jsonb_array_length(v_reg.team_data->'members') <= p_member_index then
      return jsonb_build_object('success', false, 'error', 'Team member not found');
    end if;
    v_already_checked_in := coalesce((v_reg.team_data->'members'->p_member_index->>'checked_in')::boolean, false);
    update public.registrations
    set team_data = jsonb_set(team_data, '{members}', (
          select jsonb_agg(
            case when (m.ordinality - 1) = p_member_index
              then jsonb_set(m.value, '{checked_in}', 'true'::jsonb, true)
              else m.value end order by m.ordinality
          ) from jsonb_array_elements(team_data->'members') with ordinality as m(value, ordinality)
        ), true),
        checked_in = case when p_member_index = 0 then true else checked_in end,
        updated_at = now()
    where id = p_registration_id and event_id = p_event_id;
  else
    update public.registrations set checked_in = true, updated_at = now()
    where id = p_registration_id and event_id = p_event_id;
  end if;

  select * into v_updated from public.registrations
  where id = p_registration_id and event_id = p_event_id;
  return jsonb_build_object(
    'success', true, 'already_checked_in', v_already_checked_in,
    'registration_id', v_updated.id, 'event_id', v_updated.event_id,
    'checked_in', v_updated.checked_in, 'form_data', v_updated.form_data,
    'team_data', v_updated.team_data, 'lead_email', v_updated.lead_email,
    'updated_at', v_updated.updated_at
  );
end;
$$;

revoke all on function public.checkin_registration(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.checkin_registration(uuid, uuid, text, integer) to service_role;
notify pgrst, 'reload schema';


-- >>> 20261102_secure_password_reset_requests.sql
-- Remove password material from reset requests and give requests a bounded lifetime.
alter table public.password_reset_requests
  alter column new_password drop not null;

alter table public.password_reset_requests
  add column if not exists expires_at timestamptz;

alter table public.password_reset_requests
  add column if not exists updated_at timestamptz not null default now();

update public.password_reset_requests
set new_password = null,
    expires_at = coalesce(expires_at, created_at + interval '24 hours');

update public.password_reset_requests
set status = 'rejected',
    updated_at = now()
where status = 'pending'
  and expires_at <= now();

alter table public.password_reset_requests
  alter column expires_at set default (now() + interval '24 hours');

create index if not exists idx_password_reset_requests_pending_expiry
  on public.password_reset_requests(status, expires_at)
  where status = 'pending';


-- >>> 20261104_session_based_attendance.sql
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

alter table public.session_attendance
  add column if not exists registration_id uuid references public.registrations(id) on delete cascade;

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

  if v_registration.status is distinct from 'confirmed' then
    return jsonb_build_object('success', false, 'error', 'Only confirmed registrations can attend a session');
  end if;

  if p_member_index is not null then
    if jsonb_typeof(v_registration.team_data->'members') is distinct from 'array' then
      return jsonb_build_object('success', false, 'error', 'Team member not found');
    end if;
    if jsonb_array_length(v_registration.team_data->'members') <= p_member_index then
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


-- >>> 20261105_revocable_ticket_tokens.sql
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

alter table public.ticket_token_revocations
  add column if not exists registration_id uuid references public.registrations(id) on delete cascade;

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
    v_old_token := coalesce(v_registration.hash_payload::text, v_registration.id::text);
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


-- >>> 20261106_repair_auth_user_profile_trigger.sql
notify pgrst, 'reload schema';

