-- A program's values for the parameters of one control: what the control's text says once the
-- program has set its organization-defined values. The catalog prints a parameter as a
-- placeholder, "[Assignment: organization-defined frequency]"; a program's control baseline gives
-- it values, and the program's record of the control prints them in its place.
--
-- A value is effective as author_tailored_profile resolves it, and as program_resiliency_choice
-- reads SA-24's five: the nearest layer of the stack that sets the parameter (a layer's setting
-- names its parameter by source id), else the catalog's own values, else none, and the placeholder
-- stays. A program with several program profiles has several stacks, and each may say something
-- else: the read answers every stack that selects the control, in the order the program adopted
-- them, and the page draws a disagreement.
--
-- It runs as the caller, so row-level security decides every row: nothing here widens what a member
-- may see. Every statement here can run again: this migration is also applied by hand.

create or replace function public.program_control_parameters(p_program_id uuid, p_control_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare answer jsonb;
begin
  if auth.uid() is null or not exists (select 1 from public.programs p where p.id = p_program_id) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  with recursive
  -- The stacks that select the control: the top of each, on the control's catalog edition. A stack
  -- that leaves the control out has no values for it.
  top as (
    select c.id as choice_id, c.profile_resolution_id as top_id, c.created_at
    from public.program_reference_choices c
    join public.controls k on k.id = p_control_id and k.catalog_revision_id = c.catalog_revision_id
    where c.program_id = p_program_id
      and exists (
        select 1 from public.selected_controls sc
        where sc.profile_resolution_id = c.profile_resolution_id and sc.control_id = k.id
      )
  ),
  -- Each stack's layers, the top first (depth 0), down to the reference baseline on the catalog.
  layer (top_id, resolution_id, profile_revision_id, base_id, depth) as (
    select t.top_id, r.id, r.profile_revision_id, r.base_profile_resolution_id, 0
    from top t
    join public.profile_resolutions r on r.id = t.top_id
    union all
    select l.top_id, b.id, b.profile_revision_id, b.base_profile_resolution_id, l.depth + 1
    from layer l
    join public.profile_resolutions b on b.id = l.base_id
    where l.depth < 16
  ),
  -- What each layer is, as the program's Control baseline names it: the reference baseline the
  -- stack starts from, an overlay from the library by its title, or a tailoring by its profile's.
  named as (
    select l.top_id, l.resolution_id, l.profile_revision_id, l.depth,
      case
        when l.base_id is null then 'reference'
        when a.overlay_id is not null then 'overlay'
        else 'tailoring'
      end as kind,
      coalesce(o.title, f.title, v.title) as title,
      coalesce(f.title, v.title) as profile_title
    from layer l
    join public.profile_revisions v on v.id = l.profile_revision_id
    left join public.profiles f on f.id = v.profile_id
    left join public.profile_overlay_applications a on a.profile_resolution_id = l.resolution_id
    left join public.control_overlays o on o.id = a.overlay_id
  ),
  -- The control's parameters: every one its statement and its objectives may insert.
  param as (
    select p.id as parameter_id, p.source_id, p.ordinal
    from public.parameters p
    where p.control_id = p_control_id
  ),
  -- The nearest layer of each stack that sets each parameter.
  setting as (
    select distinct on (t.top_id, pm.parameter_id)
      t.top_id, pm.parameter_id, s.id as setting_id, s.rationale, n.resolution_id, n.kind, n.title
    from top t
    cross join param pm
    join named n on n.top_id = t.top_id
    join public.profile_parameter_settings s
      on s.profile_revision_id = n.profile_revision_id and s.parameter_source_id = pm.source_id
    where exists (select 1 from public.profile_parameter_values v where v.setting_id = s.id)
    order by t.top_id, pm.parameter_id, n.depth
  ),
  -- Each parameter in each stack: that layer's values, else the catalog's own, else none.
  catalog_value as (
    select v.parameter_id, jsonb_agg(v.value order by v.ordinal) as said
    from public.parameter_values v
    join param pm on pm.parameter_id = v.parameter_id
    group by v.parameter_id
  ),
  resolved as (
    select t.top_id, pm.parameter_id, pm.ordinal,
      case
        when st.setting_id is not null then (
          select jsonb_agg(v.value order by v.ordinal)
          from public.profile_parameter_values v where v.setting_id = st.setting_id)
        else coalesce(cv.said, '[]'::jsonb)
      end as said,
      case
        when st.setting_id is not null then
          jsonb_build_object('kind', st.kind, 'title', st.title, 'resolution_id', st.resolution_id)
        when cv.said is not null then jsonb_build_object('kind', 'catalog')
      end as source,
      st.rationale
    from top t
    cross join param pm
    left join setting st on st.top_id = t.top_id and st.parameter_id = pm.parameter_id
    left join catalog_value cv on cv.parameter_id = pm.parameter_id
  )
  select jsonb_build_object(
    'selected', exists (select 1 from top),
    'stacks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'choice_id', t.choice_id,
        'resolution_id', t.top_id,
        'title', (select n.profile_title from named n where n.top_id = t.top_id and n.depth = 0),
        'parameters', coalesce((
          select jsonb_agg(jsonb_build_object(
            'parameter_id', r.parameter_id,
            'values', r.said,
            'source', r.source,
            'rationale', r.rationale
          ) order by r.ordinal, r.parameter_id)
          from resolved r where r.top_id = t.top_id
        ), '[]'::jsonb)
      ) order by t.created_at, t.choice_id)
      from top t
    ), '[]'::jsonb)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.program_control_parameters(uuid, uuid) from public, anon;
grant execute on function public.program_control_parameters(uuid, uuid) to authenticated;
comment on function public.program_control_parameters(uuid, uuid) is 'A program''s values for the parameters of one control, for the control''s text on the program''s record: for every stack of the program that selects the control (choice_id, its top resolution_id and the adopted profile''s title, in the order the program adopted them), each parameter of the control with its effective values and their source: the layer that set them (reference, overlay or tailoring, by title and resolution_id, with the setting''s rationale) or the catalog. A value is effective as author_tailored_profile resolves it: the nearest layer of the stack that sets the parameter, else the catalog''s own, else none. Read as the caller; a program the caller cannot read is refused.';
