-- ==============================================================================
-- MSC SRM AP - Production Database Schema & Hardening
-- Grounded in production requirements with concurrency, idempotency & RLS
-- ==============================================================================

create extension if not exists pgcrypto;

-- 1. MEMBER PROFILES (1:1 with auth.users)
create table if not exists public.member_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'core_member', 'user')),
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
create or replace function public.current_user_role()
returns text language plpgsql security definer set search_path = public as $$
declare
  v_role text;
begin
  select role into v_role from public.member_profiles where id = auth.uid();
  return coalesce(v_role, 'user');
end;
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.member_profiles (id, email, role, is_onboarded)
  values (new.id, new.email, 'user', false)
  on conflict (id) do nothing;
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
  new_password text not null, -- AES-256-GCM ciphertext
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
  user_id uuid not null references auth.users(id) on delete restrict,
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

-- ==============================================================================
-- SECURITY DEFINER RPCs
-- ==============================================================================

-- Atomic event registration RPC
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
  v_event record;
  v_existing record;
  v_confirmed_count int;
  v_status text;
  v_expires_at timestamptz;
  v_registration_id uuid;
  v_hash_payload uuid;
begin
  -- 1. Check idempotency: if registration with same key exists, return it
  if p_idempotency_key is not null then
    select * into v_existing from public.registrations where idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object(
        'success', true,
        'registration_id', v_existing.id,
        'hash_payload', v_existing.hash_payload,
        'status', v_existing.status,
        'replayed', true
      );
    end if;
  end if;

  -- 2. Lock event row for atomic check
  select * into v_event from public.events where id = p_event_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Event not found');
  end if;

  if not v_event.registration_open then
    return jsonb_build_object('success', false, 'error', 'Registration is closed for this event');
  end if;

  -- Check duplicate registration
  if p_user_id is not null then
    select * into v_existing from public.registrations
    where event_id = p_event_id and user_id = p_user_id and status != 'cancelled';
    if found then
      return jsonb_build_object(
        'success', true,
        'registration_id', v_existing.id,
        'hash_payload', v_existing.hash_payload,
        'status', v_existing.status,
        'replayed', true
      );
    end if;
  end if;

  select * into v_existing from public.registrations
  where event_id = p_event_id and lower(lead_email) = lower(p_lead_email) and status != 'cancelled';
  if found then
    return jsonb_build_object(
      'success', true,
      'registration_id', v_existing.id,
      'hash_payload', v_existing.hash_payload,
      'status', v_existing.status,
      'replayed', true
    );
  end if;

  -- 3. Check capacity
  select count(*) into v_confirmed_count
  from public.registrations
  where event_id = p_event_id
    and (status = 'confirmed' or (status = 'pending_payment' and reservation_expires_at > now()));

  -- Determine initial status
  if v_event.max_capacity is not null and v_confirmed_count >= v_event.max_capacity then
    v_status := 'waitlisted';
    v_expires_at := null;
  elsif (v_event.form_requirements->>'event_pricing') = 'paid' then
    v_status := 'pending_payment';
    v_expires_at := now() + interval '15 minutes';
  else
    v_status := 'confirmed';
    v_expires_at := null;
  end if;

  -- 4. Insert registration
  insert into public.registrations (
    event_id,
    user_id,
    lead_email,
    form_data,
    team_data,
    status,
    idempotency_key,
    reservation_expires_at
  ) values (
    p_event_id,
    p_user_id,
    p_lead_email,
    p_form_data,
    p_team_data,
    v_status,
    p_idempotency_key,
    v_expires_at
  ) returning id, hash_payload into v_registration_id, v_hash_payload;

  -- 5. If team is looking for members, register in matchmaking table
  if p_team_data is not null and (p_team_data->>'looking_for_members')::boolean is true then
    insert into public.teams (
      event_id,
      registration_id,
      team_name,
      leader_name,
      leader_email,
      leader_year,
      leader_branch,
      looking_for_members
    ) values (
      p_event_id,
      v_registration_id,
      coalesce(p_team_data->>'team_name', 'Team'),
      coalesce(p_team_data->>'leader_name', ''),
      p_lead_email,
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
    'reservation_expires_at', v_expires_at
  );
end;
$$;

-- Atomic payment confirmation RPC
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
  v_order record;
begin
  -- 1. Find matching payment order
  select * into v_order
  from public.payment_orders
  where razorpay_order_id = p_razorpay_order_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Payment order not found');
  end if;

  -- Amount verification
  if v_order.amount != p_amount then
    return jsonb_build_object('success', false, 'error', 'Amount mismatch');
  end if;

  -- 2. Idempotent insert into payments
  insert into public.payments (
    event_id,
    registration_id,
    user_id,
    razorpay_order_id,
    razorpay_payment_id,
    amount,
    payer_email,
    status,
    gateway_payload,
    verified_at
  ) values (
    v_order.event_id,
    v_order.registration_id,
    v_order.user_id,
    p_razorpay_order_id,
    p_razorpay_payment_id,
    p_amount,
    p_payer_email,
    'captured',
    p_gateway_payload,
    now()
  ) on conflict (razorpay_payment_id) do nothing;

  -- 3. Update payment order
  update public.payment_orders
  set status = 'paid', updated_at = now()
  where id = v_order.id;

  -- 4. Confirm registration
  update public.registrations
  set status = 'confirmed',
      reservation_expires_at = null,
      updated_at = now()
  where id = v_order.registration_id;

  return jsonb_build_object(
    'success', true,
    'registration_id', v_order.registration_id,
    'status', 'confirmed'
  );
end;
$$;

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
create policy "member_profiles_owner_read" on public.member_profiles
  for select using (auth.uid() = id or public.current_user_role() in ('admin', 'core_member'));

create policy "member_profiles_owner_update" on public.member_profiles
  for update using (auth.uid() = id or public.current_user_role() = 'admin');

-- 2. events
create policy "events_public_read" on public.events
  for select using (is_published = true or public.current_user_role() in ('admin', 'core_member'));

create policy "events_staff_write" on public.events
  for all using (public.current_user_role() in ('admin', 'core_member'));

-- 3. registrations
create policy "registrations_read" on public.registrations
  for select using (
    auth.uid() = user_id or
    public.current_user_role() in ('admin', 'core_member')
  );

create policy "registrations_staff_update" on public.registrations
  for update using (public.current_user_role() in ('admin', 'core_member'));

-- 4. teams
create policy "teams_public_read" on public.teams
  for select using (true);

create policy "teams_staff_write" on public.teams
  for all using (public.current_user_role() in ('admin', 'core_member'));

-- 5. team_members
create policy "team_members_public_read" on public.team_members
  for select using (true);

create policy "team_members_staff_write" on public.team_members
  for all using (public.current_user_role() in ('admin', 'core_member'));

-- 6. gallery_items
create policy "gallery_items_public_read" on public.gallery_items
  for select using (true);

create policy "gallery_items_staff_write" on public.gallery_items
  for all using (public.current_user_role() in ('admin', 'core_member'));

-- 7. password_reset_requests
create policy "password_reset_requests_admin_read" on public.password_reset_requests
  for select using (public.current_user_role() = 'admin');

create policy "password_reset_requests_admin_update" on public.password_reset_requests
  for update using (public.current_user_role() = 'admin');

-- 8. payments & payment_orders: Revoke all from anon & authenticated
revoke all on public.payments from anon, authenticated;
revoke all on public.payment_orders from anon, authenticated;



