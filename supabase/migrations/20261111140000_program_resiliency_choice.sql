-- What a program chose for SA-24, Design for Cyber Resiliency. The control asks an organization to
-- define its cyber resiliency goals, objectives, techniques, implementation approaches and design
-- principles (parameters sa-24_odp.01 to .05) and then to implement them. NIST SP 800-160 Vol. 2
-- says no system employs every technique, so what the program names is what a reading of its
-- resiliency measures against.
--
-- No reference baseline selects SA-24: a program gets it by tailoring it in, and sets its five
-- parameters in the same tailoring. A parameter value is text, as OSCAL has it. This read names the
-- items of the cyber resiliency framework (nist-sp800-160v2r1-cref) those values say, by code.
--
-- It runs as the caller, so row-level security decides every row: nothing here widens what a member
-- may see. Every statement here can run again: this migration is also applied by hand.

-- ---------------------------------------------------------------------------------------------
-- The choice. A program's control baseline is the stack its reference choice names the top of; a
-- program with several program profiles has several stacks.
--
-- A parameter's effective value is resolved as author_tailored_profile resolves it: the catalog's
-- own values, then each layer's settings from the reference profile up, a later layer replacing an
-- earlier one. Read from the top, that is the nearest layer of the stack that sets the parameter,
-- and the catalog's values when none does. A layer's setting names its parameter by source id.
--
-- A value names an item when it is the item's title, whatever its case and the space around it,
-- and the item is of the kind its parameter defines: a goal for the goals, a strategic or a
-- structural design principle for the design principles. Several stacks answer as one: SA-24 is
-- selected when any selects it, and each list is every item one of them names, once.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_resiliency_choice(p_program_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare answer jsonb;
begin
  if auth.uid() is null or not exists (select 1 from public.programs p where p.id = p_program_id) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  with recursive
  -- The stacks that select SA-24: the top of each, with the control in the stack's catalog edition.
  top as (
    select c.profile_resolution_id as top_id, c.catalog_revision_id, k.id as control_id
    from public.program_reference_choices c
    join public.controls k on k.catalog_revision_id = c.catalog_revision_id and k.source_id = 'sa-24'
    join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id and sc.control_id = k.id
    where c.program_id = p_program_id
  ),
  -- Each stack's layers, the top first (depth 0), down to the reference profile on the catalog.
  layer (top_id, profile_revision_id, base_id, depth) as (
    select t.top_id, r.profile_revision_id, r.base_profile_resolution_id, 0
    from top t
    join public.profile_resolutions r on r.id = t.top_id
    union all
    select l.top_id, b.profile_revision_id, b.base_profile_resolution_id, l.depth + 1
    from layer l
    join public.profile_resolutions b on b.id = l.base_id
    where l.depth < 16
  ),
  -- SA-24's five parameters in each stack's catalog edition, by the list each one defines.
  param as (
    select t.top_id, p.id as parameter_id, p.source_id, x.slot, x.place
    from top t
    join public.parameters p on p.catalog_revision_id = t.catalog_revision_id and p.control_id = t.control_id
    join (values
      ('sa-24_odp.01', 'goals', 1),
      ('sa-24_odp.02', 'objectives', 2),
      ('sa-24_odp.03', 'techniques', 3),
      ('sa-24_odp.04', 'approaches', 4),
      ('sa-24_odp.05', 'design_principles', 5)
    ) as x (source_id, slot, place) on x.source_id = p.source_id
  ),
  -- The nearest layer that sets each parameter.
  setting as (
    select distinct on (pm.top_id, pm.parameter_id) pm.top_id, pm.parameter_id, s.id as setting_id
    from param pm
    join layer l on l.top_id = pm.top_id
    join public.profile_parameter_settings s
      on s.profile_revision_id = l.profile_revision_id and s.parameter_source_id = pm.source_id
    where exists (select 1 from public.profile_parameter_values v where v.setting_id = s.id)
    order by pm.top_id, pm.parameter_id, l.depth
  ),
  -- The effective values: that layer's, else the catalog's own.
  said as (
    select pm.slot, pm.place, v.ordinal, v.value
    from param pm
    join setting st on st.top_id = pm.top_id and st.parameter_id = pm.parameter_id
    join public.profile_parameter_values v on v.setting_id = st.setting_id
    union all
    select pm.slot, pm.place, v.ordinal, v.value
    from param pm
    join public.parameter_values v on v.parameter_id = pm.parameter_id
    where not exists (
      select 1 from setting st where st.top_id = pm.top_id and st.parameter_id = pm.parameter_id
    )
  ),
  value as (
    select s.slot, s.place, s.ordinal, s.value, lower(btrim(s.value, E' \t\r\n')) as name
    from said s
    where btrim(s.value, E' \t\r\n') <> ''
  ),
  -- The vocabulary, in the order the publication prints it: an approach under its technique, the
  -- strategic design principles before the structural ones.
  item as (
    select i.code, i.ordinal, coalesce(h.ordinal, 0) as held_at, lower(btrim(i.title)) as name,
      case i.kind
        when 'goal' then 'goals'
        when 'objective' then 'objectives'
        when 'technique' then 'techniques'
        when 'approach' then 'approaches'
        else 'design_principles'
      end as slot,
      case i.kind when 'structural-design-principle' then 2 else 1 end as kind_at
    from public.framework_item_rows i
    left join public.framework_item_rows h on h.id = i.parent_item_id
    where i.framework_code = 'nist-sp800-160v2r1-cref'
      and i.kind in ('goal', 'objective', 'technique', 'approach',
        'strategic-design-principle', 'structural-design-principle')
  ),
  named as (
    select distinct i.slot, i.code, i.kind_at, i.held_at, i.ordinal
    from value v
    join item i on i.slot = v.slot and i.name = v.name
  ),
  unnamed as (
    select v.value, min(v.place) as place, min(v.ordinal) as ordinal
    from value v
    where not exists (select 1 from item i where i.slot = v.slot and i.name = v.name)
    group by v.value
  )
  select jsonb_build_object(
    'selected', exists (select 1 from top),
    'goals', coalesce((select jsonb_agg(n.code order by n.kind_at, n.held_at, n.ordinal, n.code)
      from named n where n.slot = 'goals'), '[]'::jsonb),
    'objectives', coalesce((select jsonb_agg(n.code order by n.kind_at, n.held_at, n.ordinal, n.code)
      from named n where n.slot = 'objectives'), '[]'::jsonb),
    'techniques', coalesce((select jsonb_agg(n.code order by n.kind_at, n.held_at, n.ordinal, n.code)
      from named n where n.slot = 'techniques'), '[]'::jsonb),
    'approaches', coalesce((select jsonb_agg(n.code order by n.kind_at, n.held_at, n.ordinal, n.code)
      from named n where n.slot = 'approaches'), '[]'::jsonb),
    'design_principles', coalesce((select jsonb_agg(n.code order by n.kind_at, n.held_at, n.ordinal, n.code)
      from named n where n.slot = 'design_principles'), '[]'::jsonb),
    'unmatched', coalesce((select jsonb_agg(u.value order by u.place, u.ordinal, u.value)
      from unnamed u), '[]'::jsonb)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.program_resiliency_choice(uuid) from public, anon;
grant execute on function public.program_resiliency_choice(uuid) to authenticated;
comment on function public.program_resiliency_choice(uuid) is 'What a program chose for SA-24, Design for Cyber Resiliency: whether one of its control baselines selects the control, and the items of the cyber resiliency framework (nist-sp800-160v2r1-cref) that the effective values of its five parameters name, by code and in the publication''s order: goals, objectives, techniques, approaches and design_principles, with the values that name no item as unmatched. A value is effective as author_tailored_profile resolves it: the nearest layer of the stack that sets the parameter, else the catalog''s own. Read as the caller; a program the caller cannot read is refused.';
