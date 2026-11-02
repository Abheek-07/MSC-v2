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
