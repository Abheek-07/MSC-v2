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
