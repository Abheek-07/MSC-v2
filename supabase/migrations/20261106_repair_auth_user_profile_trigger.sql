-- Repair the auth.users -> member_profiles trigger used by both public
-- sign-up and administrator-provisioned accounts.
--
-- The live database may still use the legacy user_role enum. Ensure that the
-- member label exists before replacing the trigger function that inserts it.

do $$
declare
  v_role_type regtype;
  v_type_kind "char";
begin
  select a.atttypid::regtype, t.typtype
    into v_role_type, v_type_kind
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_type t on t.oid = a.atttypid
   where n.nspname = 'public'
     and c.relname = 'member_profiles'
     and a.attname = 'role'
     and a.attnum > 0
     and not a.attisdropped;

  if v_role_type is null then
    raise exception 'public.member_profiles.role column was not found';
  end if;

  if v_type_kind = 'e' then
    execute format('alter type %s add value if not exists %L', v_role_type, 'member');
  end if;
end
$$;

-- PostgreSQL requires a newly-added enum value to be committed before use.
commit;

-- Normalize legacy role values and enforce the two roles used by the app.
update public.member_profiles
   set role = 'member'
 where role::text in ('user', 'core_member');

do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select conname
      from pg_constraint
     where conrelid = 'public.member_profiles'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) like '%role%'
  loop
    execute format('alter table public.member_profiles drop constraint %I', v_constraint.conname);
  end loop;
end
$$;

alter table public.member_profiles
  add constraint member_profiles_role_check
  check (role::text in ('admin', 'member'));

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
        full_name = coalesce(public.member_profiles.full_name, excluded.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Verify the trigger is installed and points to the repaired function.
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
