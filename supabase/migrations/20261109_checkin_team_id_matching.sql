-- Fix team-wide check-in matching.
-- Team names are display values and are not guaranteed to be unique.
-- Only expand a team check-in across registrations sharing the stable team_id.
-- If team_id is missing, update only the registration selected by the admin.
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
      and (
        r.id = p_registration_id
        or (v_team_id is not null and r.team_data->>'team_id' = v_team_id)
      );
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
