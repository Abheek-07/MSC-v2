-- Ensure event capacity values are valid at the database boundary as well as in admin APIs.
-- NULL remains allowed for legacy/unlimited-capacity events.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_max_capacity_positive'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_max_capacity_positive
      check (max_capacity is null or max_capacity >= 1);
  end if;
end;
$$;

notify pgrst, 'reload schema';
