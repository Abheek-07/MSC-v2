-- Give every embedded team member a stable, independent QR token.
-- Safe to re-run: existing valid UUID tokens are preserved.
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
        end order by m.ordinality
      ), '[]'::jsonb
    )
    from jsonb_array_elements(r.team_data->'members') with ordinality as m(value, ordinality)
  ),
  true
)
where jsonb_typeof(r.team_data->'members') = 'array'
  and exists (
    select 1 from jsonb_array_elements(r.team_data->'members') as member(value)
    where jsonb_typeof(member.value) = 'object'
      and coalesce(member.value->>'hash_payload', '') !~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

comment on column public.registrations.team_data is
  'Team JSON. Embedded members receive independent hash_payload UUIDs for individual QR check-in.';
