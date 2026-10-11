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
returns trigger language plpgsql as $$
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
returns trigger language plpgsql as $$
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