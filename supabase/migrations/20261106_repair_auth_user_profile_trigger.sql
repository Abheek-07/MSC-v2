-- Repair the profile provisioning trigger used by the Admin > Users flow.
-- Public self-registration remains disabled in the application UI.
--
-- The two-role migration (20261011_two_roles_member_admin.sql) already adds
-- the 'member' enum value, migrates legacy roles, and installs the role check.
-- This migration only makes the auth.users profile trigger safe and idempotent.

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

-- Ensure the auth.users trigger invokes the repaired function.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Confirm the trigger exists after installation.
do $$
begin
  if not exists (
    select 1
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'auth'
       and c.relname = 'users'
       and t.tgname = 'on_auth_user_created'
       and not t.tgisinternal
  ) then
    raise exception 'Failed to install on_auth_user_created trigger';
  end if;
end
$$;

notify pgrst, 'reload schema';
