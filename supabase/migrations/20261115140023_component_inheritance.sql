-- Component inheritance: what a component version was judged on stands for everything built from
-- it, unmodified. Slice 4 of "assess once, use everywhere", and the first that changes what the
-- status reads answer.
--
-- Slices 1 to 3 let a component version be assessed once (component_assessments,
-- component_determinations, component_standing_lines), findings flow up to its owner, and its SBOM
-- and CVEs be recorded. Until now only the reads of those slices read a component's determinations.
-- From here on the status reads inherit them, under four rules:
--
--   1. A component determination names a whole control, and so covers every assessment objective
--      the control counts.
--   2. Where a product's own assessment and its component's both judge one element and control,
--      the product's own stands.
--   3. A program inherits per element, with nothing to do: the determination stands for the element
--      built from the component, and an objective counts as judged for the program where its
--      requirements place it only on elements that inherit the control. The rest stays with the
--      program's assessor, whose own determination always stands over an inherited one.
--   4. The product's assessor marks the controls no single component can show and judges them on
--      the product (product_integration_controls); anyone using a component version unmodified
--      inherits its determinations.
--
-- Each rule lives in one internal read, and every status read counts from them:
--
--   product_element_standing        what stands on each element of a product version for each
--                                   control: the product's own determination, else its component's
--   program_element_inheritance     the elements of a program that inherit a control, with the
--                                   determination and the component assessment it came from
--   program_objective_inheritance   the objectives (and controls that count none) judged by
--                                   inheritance, from where the program's mappings place them
--
-- product_control_status and variant_control_delta_answer read the first, so the product branch of
-- a program's control status follows. program_control_objective_judgments reads the third and marks
-- what is inherited, so the status lines, the counts, the daily posture snapshots,
-- plan_control_holdings and the two assessment commands follow by themselves: an inherited
-- objective counts as assessed, and Add to assessment campaign and Plan an assessment leave it out.
--
-- Nothing moves without a published component assessment: an answer changes only where a
-- determination is inherited or a control is marked for integration, and the keys that say so are
-- written only there: inherited on a product's control, component_assessments and
-- product_determined on a variant's, objectives_inherited and component_assessments on a
-- program's, and component_assessments on a product's and a variant's answer. Where used and
-- Upstream (component_consumers, system_upstream) gain controls_judged and controls_inherited on
-- every row.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- The controls of a product version that only integration can show.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.product_integration_controls (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  product_revision_id uuid not null,
  control_id uuid not null references public.controls(id),
  rationale text not null check (length(btrim(rationale)) > 0),
  unique (tenant_id, id),
  unique (tenant_id, product_revision_id, control_id),
  foreign key (tenant_id, product_revision_id) references public.product_revisions(tenant_id, id)
);
create index if not exists product_integration_controls_control_idx on public.product_integration_controls(control_id);

-- The version is the workspace's by its foreign key; the control is the catalog's or the
-- workspace's own, never another workspace's (guard_reference_tenant). The set is the assessor's
-- to change after the version is published, since a product is assessed once it no longer changes.
do $$
begin
  if not exists (select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'product_integration_controls' and policyname = 'tenant_read') then
    perform public.apply_tenant_security('product_integration_controls');
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.product_integration_controls'::regclass and tgname = 'record_lifecycle' and not tgisinternal) then
    perform public.attach_record_lifecycle('product_integration_controls', false);
    perform public.attach_reference_tenant_guard('product_integration_controls', 'control_id', 'controls');
  end if;
end $$;
create or replace trigger stable_context before update on public.product_integration_controls
  for each row execute function public.guard_stable_assurance_context('product_revision_id', 'control_id');

comment on table public.product_integration_controls is 'The controls of a product version that no single component can show: the product''s assessor marks them and judges them on the product. A component''s determination on such a control is not inherited by the product''s elements, and until the product''s own assessment judges it the control reads not assessed, never not covered.';
comment on column public.product_integration_controls.product_revision_id is 'The product version the control is marked for.';
comment on column public.product_integration_controls.control_id is 'The control only integration can show.';
comment on column public.product_integration_controls.rationale is 'Why no single component can show it.';

-- ---------------------------------------------------------------------------------------------
-- Internal: what stands on each element of a product version for each control.
-- ---------------------------------------------------------------------------------------------
-- The one place the product's rule lives. The product's latest published assessment decides what it
-- judged, on an element or on the product as a whole (no element). Where it made no determination
-- on an element and control, and the element is pinned to a library component, that component
-- version's standing determination stands there, marked with the component assessment it came
-- from, unless the control is marked for integration. A draft decides nothing on either side.
create or replace function public.product_element_standing(p_tenant_id uuid, p_product_revision_id uuid)
returns table (
  product_element_id uuid, control_id uuid, determination text,
  inherited boolean, component_assessment_id uuid
)
language sql stable security invoker set search_path = '' as $$
  with
  own as materialized (
    select d.product_element_id, d.control_id, d.determination
    from public.product_determinations d
    where d.tenant_id = p_tenant_id and d.product_assessment_id = (
      select a.id from public.product_assessments a
      where a.tenant_id = p_tenant_id and a.product_revision_id = p_product_revision_id and a.state = 'published'
      order by a.published_at desc, a.id desc limit 1)
  ),
  pinned as materialized (
    select e.id as product_element_id, e.defined_component_id
    from public.product_elements e
    where e.tenant_id = p_tenant_id and e.product_revision_id = p_product_revision_id
      and e.defined_component_id is not null
  ),
  handed as (
    select p.product_element_id, l.control_id, l.status, l.component_assessment_id
    from pinned p
    join public.component_standing_lines(array(select distinct x.defined_component_id from pinned x)) l
      on l.defined_component_id = p.defined_component_id
    -- A determination, never a claim nobody judged.
    where l.component_assessment_id is not null
      and not exists (select 1 from public.product_integration_controls i
        where i.tenant_id = p_tenant_id and i.product_revision_id = p_product_revision_id
          and i.control_id = l.control_id)
      and not exists (select 1 from own o
        where o.product_element_id = p.product_element_id and o.control_id = l.control_id)
  )
  select o.product_element_id, o.control_id, o.determination, false, null::uuid from own o
  union all
  select h.product_element_id, h.control_id, h.status, true, h.component_assessment_id from handed h
$$;
revoke all on function public.product_element_standing(uuid, uuid) from public, anon;
grant execute on function public.product_element_standing(uuid, uuid) to authenticated;
comment on function public.product_element_standing(uuid, uuid) is 'Internal: what stands on each element of a product version for each control, one row a determination. The determinations of the product''s latest published assessment, on an element or on the product as a whole (product_element_id null); and, on an element pinned to a library component that the product did not judge on a control, that component version''s standing determination (component_standing_lines), inherited true with the component assessment it came from, unless the control is marked for integration (product_integration_controls). The product''s own always stands over its component''s. Security invoker, asking nothing of who calls. product_control_status and variant_control_delta_answer read it, and through the second the product branch of program_control_status.';

-- ---------------------------------------------------------------------------------------------
-- What a product version gives for each control, by core and configuration, now with what its
-- elements take from their components.
-- ---------------------------------------------------------------------------------------------
create or replace function public.product_control_status(p_tenant_id uuid, p_product_revision_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_revision public.product_revisions;
  v_assessment public.product_assessments;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  select * into v_revision from public.product_revisions
    where tenant_id = p_tenant_id and id = p_product_revision_id;
  if v_revision.id is null then
    raise exception 'Product version access is required' using errcode = '42501';
  end if;
  select * into v_assessment from public.product_assessments a
    where a.tenant_id = p_tenant_id and a.product_revision_id = p_product_revision_id and a.state = 'published'
    order by a.published_at desc, a.id desc limit 1;
  with
  configs as materialized (
    select c.id, c.code, c.name
    from public.product_configurations c
    where c.tenant_id = p_tenant_id and c.product_id = v_revision.product_id and c.state = 'active'
  ),
  members as materialized (
    select m.product_configuration_id, m.product_element_id
    from public.product_configuration_elements m
    where m.tenant_id = p_tenant_id and m.product_revision_id = p_product_revision_id
      and m.product_configuration_id in (select id from configs)
  ),
  elements as materialized (
    select e.id, e.defined_component_id
    from public.product_elements e
    where e.tenant_id = p_tenant_id and e.product_revision_id = p_product_revision_id
  ),
  -- One row a scope and element. The core is what every active configuration includes.
  scope_elements as materialized (
    select 'core'::text as scope, m.product_element_id as element_id
    from members m
    group by m.product_element_id
    having count(*) = (select count(*) from configs)
    union all
    select m.product_configuration_id::text, m.product_element_id from members m
  ),
  scopes as materialized (
    select 'core'::text as scope union all select c.id::text from configs c
  ),
  claims as materialized (
    select distinct e.id as element_id, i.control_id
    from elements e
    join public.defined_component_implementations i
      on i.tenant_id = p_tenant_id and i.defined_component_id = e.defined_component_id
    where i.control_id is not null
  ),
  -- What stands on each element and on the product as a whole (product_element_standing): the
  -- product's own determinations, and on an element pinned to a library component that the
  -- product did not judge on a control, the component's, with the component assessment it came
  -- from.
  dets as materialized (
    select s.control_id, s.product_element_id, s.determination, s.component_assessment_id
    from public.product_element_standing(p_tenant_id, p_product_revision_id) s
  ),
  -- The controls only integration can show: with no determination of the product's own they read
  -- not assessed, whatever an element claims and whatever its component was judged on.
  integration as materialized (
    select i.control_id from public.product_integration_controls i
    where i.tenant_id = p_tenant_id and i.product_revision_id = p_product_revision_id
  ),
  -- A version nobody assessed is read over what its elements claim, what their components were
  -- judged on and what is marked for integration.
  selected as materialized (
    select sc.control_id from public.selected_controls sc
    where v_assessment.id is not null and sc.profile_resolution_id = v_assessment.profile_resolution_id
    union
    select c.control_id from claims c where v_assessment.id is null
    union
    select d.control_id from dets d where v_assessment.id is null
    union
    select i.control_id from integration i where v_assessment.id is null
  ),
  det_scope as (
    select d.control_id, se.scope, d.determination, d.component_assessment_id
    from dets d join scope_elements se on se.element_id = d.product_element_id
    union all
    select d.control_id, s.scope, d.determination, d.component_assessment_id
    from dets d cross join scopes s where d.product_element_id is null
  ),
  -- handed: the component assessments whose determinations stand in the cell, none where every
  -- determination in it is the product's own.
  judged as (
    select ds.control_id, ds.scope,
      bool_or(ds.determination = 'other_than_satisfied') as other_than,
      bool_or(ds.determination = 'partially_satisfied') as partially,
      array_agg(distinct ds.component_assessment_id order by ds.component_assessment_id)
        filter (where ds.component_assessment_id is not null) as handed
    from det_scope ds group by ds.control_id, ds.scope
  ),
  claimed as (
    select distinct c.control_id, se.scope
    from claims c join scope_elements se on se.element_id = c.element_id
  ),
  cell as materialized (
    select s.control_id, sc.scope,
      case
        when j.other_than then 'other_than_satisfied'
        when j.partially then 'partially_satisfied'
        when j.control_id is not null then 'satisfied'
        when c.control_id is not null or i.control_id is not null then 'not_assessed'
        else 'not_covered'
      end as status,
      j.handed
    from selected s
    cross join scopes sc
    left join judged j on j.control_id = s.control_id and j.scope = sc.scope
    left join claimed c on c.control_id = s.control_id and c.scope = sc.scope
    left join integration i on i.control_id = s.control_id
  ),
  -- The cells a component's determination stands in, core or a configuration by its id, each with
  -- the component assessments behind it: one row a control that has any.
  handed as (
    select x.control_id, jsonb_object_agg(x.scope, to_jsonb(x.handed)) as cells
    from cell x
    where x.handed is not null
    group by x.control_id
  ),
  line as (
    select k.id, k.code, k.title, k.parent_control_id,
      public.natural_sort_key(k.code) collate "C" as code_order,
      upper(g.source_id) as family, g.title as family_title,
      (select x.status from cell x where x.control_id = k.id and x.scope = 'core') as core,
      (select coalesce(jsonb_object_agg(x.scope, x.status), '{}'::jsonb) from cell x
        where x.control_id = k.id and x.scope <> 'core') as by_configuration,
      (select count(distinct x.status) from cell x where x.control_id = k.id and x.scope <> 'core') as distinct_statuses,
      (select bool_and(x.status = 'satisfied') from cell x where x.control_id = k.id and x.scope <> 'core') as satisfied_everywhere,
      h.cells as inherited
    from selected s
    join public.controls k on k.id = s.control_id
    left join public.catalog_groups g on g.id = k.group_id
    left join handed h on h.control_id = s.control_id
  )
  select jsonb_build_object(
    'product_revision_id', p_product_revision_id,
    'assessment', case when v_assessment.id is null then null else jsonb_build_object(
      'id', v_assessment.id, 'title', v_assessment.title, 'published_at', v_assessment.published_at,
      'completed_on', v_assessment.completed_on, 'assessor_party_id', v_assessment.assessor_party_id,
      'profile_resolution_id', v_assessment.profile_resolution_id) end,
    'configurations', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'code', c.code, 'name', c.name,
        'elements', (select count(*) from members m where m.product_configuration_id = c.id)
      ) order by c.code, c.id), '[]'::jsonb) from configs c),
    'core_elements', (select count(*) from scope_elements se where se.scope = 'core'),
    'totals', jsonb_build_object(
      'controls', (select count(*) from line),
      'satisfied_everywhere', (select count(*) from line l where l.satisfied_everywhere),
      'differs', (select count(*) from line l where l.distinct_statuses > 1),
      'scopes', (
        select coalesce(jsonb_object_agg(t.scope, t.counts), '{}'::jsonb)
        from (
          select sc.scope, jsonb_build_object(
            'satisfied', count(*) filter (where x.status = 'satisfied'),
            'partially_satisfied', count(*) filter (where x.status = 'partially_satisfied'),
            'other_than_satisfied', count(*) filter (where x.status = 'other_than_satisfied'),
            'not_assessed', count(*) filter (where x.status = 'not_assessed'),
            'not_covered', count(*) filter (where x.status = 'not_covered')) as counts
          from scopes sc left join cell x on x.scope = sc.scope
          group by sc.scope
        ) t)
    ),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id, 'code', l.code, 'title', l.title, 'parent_id', l.parent_control_id,
        'family', l.family, 'family_title', l.family_title,
        'core', l.core, 'configurations', l.by_configuration,
        'differs', l.distinct_statuses > 1
      ) || case when l.inherited is null then '{}'::jsonb else jsonb_build_object('inherited', l.inherited) end
        order by l.family nulls last, l.code_order, l.id), '[]'::jsonb)
      from line l)
  )
  -- Named only where something is inherited: the component assessments behind the inherited cells.
  || coalesce((
    select jsonb_build_object('component_assessments', jsonb_agg(jsonb_build_object(
      'id', a.id, 'title', a.title, 'published_at', a.published_at) order by a.title, a.id))
    from public.component_assessments a
    where a.tenant_id = p_tenant_id
      and a.id in (select unnest(x.handed) from cell x where x.handed is not null)
    having count(*) > 0), '{}'::jsonb)
  into answer;
  return answer;
end;
$$;
revoke all on function public.product_control_status(uuid, uuid) from public, anon;
grant execute on function public.product_control_status(uuid, uuid) to authenticated;
comment on function public.product_control_status(uuid, uuid) is 'What a product version gives for each control of the baseline it was last assessed against: the status of its core (the elements every active configuration includes) and of each configuration, as the worst determination that stands on the elements in it (product_element_standing): the product''s own, and on an element pinned to a library component that the product did not judge on the control, the component''s. not_assessed where an element claims the control with no determination, or the control is marked for integration (product_integration_controls) and the product has not judged it; not_covered where nothing claims it. A control with a cell a component''s determination stands in says so in inherited (the scope, core or a configuration''s id, with the component assessments behind it), and the answer names those assessments in component_assessments; neither key is written where nothing is inherited. A version nobody assessed is read over what its elements claim, what their components were judged on and what is marked for integration.';

-- ---------------------------------------------------------------------------------------------
-- A variant against its product, reading the same standing.
-- ---------------------------------------------------------------------------------------------
create or replace function public.variant_control_delta_answer(p_tenant_id uuid, p_system_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_system public.systems;
  v_revision public.product_revisions;
  v_product public.products;
  v_configuration public.product_configurations;
  v_assessment public.product_assessments;
  v_latest public.product_revisions;
begin
  select * into v_system from public.systems where tenant_id = p_tenant_id and id = p_system_id;
  if v_system.id is null then
    raise exception 'System access is required' using errcode = '42501';
  end if;
  -- A system that was not created from a product has no delta, which is not an empty one.
  if v_system.product_configuration_id is null then
    return jsonb_build_object('system_id', p_system_id, 'product', null);
  end if;
  select * into v_revision from public.product_revisions where tenant_id = p_tenant_id and id = v_system.product_revision_id;
  select * into v_product from public.products where tenant_id = p_tenant_id and id = v_revision.product_id;
  select * into v_configuration from public.product_configurations where tenant_id = p_tenant_id and id = v_system.product_configuration_id;
  select * into v_assessment from public.product_assessments a
    where a.tenant_id = p_tenant_id and a.product_revision_id = v_revision.id and a.state = 'published'
    order by a.published_at desc, a.id desc limit 1;
  select * into v_latest from public.product_revisions r
    where r.tenant_id = p_tenant_id and r.product_id = v_revision.product_id and r.state = 'published'
      and r.version_number > v_revision.version_number
    order by r.version_number desc limit 1;
  with
  inst as materialized (
    select s.id, s.code, s.name, s.product_element_id, s.product_change_kinds
    from public.systems s
    where s.tenant_id = p_tenant_id and s.boundary_system_id = v_system.id and not s.is_authorization_boundary
  ),
  -- One row an element of the configuration: what became of it in the variant.
  elem as materialized (
    select m.product_element_id, pe.code, pe.name, pe.defined_component_id, i.id as system_id,
      i.product_change_kinds as kinds,
      case when i.id is null then 'removed' when i.product_change_kinds is not null then 'modified' else 'inherited' end as change
    from public.product_configuration_elements m
    join public.product_elements pe on pe.tenant_id = m.tenant_id and pe.id = m.product_element_id
    left join inst i on i.product_element_id = m.product_element_id
    where m.tenant_id = p_tenant_id and m.product_revision_id = v_revision.id
      and m.product_configuration_id = v_configuration.id
  ),
  selected as materialized (
    select sc.control_id from public.selected_controls sc
    where sc.profile_resolution_id = v_system.adopted_profile_resolution_id
  ),
  claims as materialized (
    select e.product_element_id, i.control_id,
      bool_or(i.coverage <> 'full' or nullif(btrim(coalesce(i.consumer_responsibility, '')), '') is not null) as shared
    from elem e
    join public.defined_component_implementations i
      on i.tenant_id = p_tenant_id and i.defined_component_id = e.defined_component_id
    where i.control_id is not null
    group by e.product_element_id, i.control_id
  ),
  -- What stands on the configuration's elements and on the product as a whole
  -- (product_element_standing): the product's own determinations, and its components' where it
  -- made none.
  dets as materialized (
    select s.control_id, s.product_element_id, s.determination, s.component_assessment_id
    from public.product_element_standing(p_tenant_id, v_revision.id) s
    where s.product_element_id is null or s.product_element_id in (select product_element_id from elem)
  ),
  -- The product's basis for a control: one row an element (or the whole product) and control.
  basis as materialized (
    select coalesce(c.control_id, d.control_id) as control_id,
      coalesce(c.product_element_id, d.product_element_id) as product_element_id,
      coalesce(c.shared, false) as shared, d.determination, d.component_assessment_id
    from claims c
    full join dets d on d.control_id = c.control_id and d.product_element_id = c.product_element_id
  ),
  -- The component assessments behind what the product gives for a control: each one whose
  -- determination stands on an element the variant kept, with its worst there.
  handed as (
    select x.control_id,
      jsonb_agg(jsonb_build_object('id', x.id, 'determination',
        (array['other_than_satisfied', 'partially_satisfied', 'satisfied'])[x.rank + 1]) order by x.rank, x.id) as assessments
    from (
      select b.control_id, b.component_assessment_id as id,
        min(case b.determination when 'other_than_satisfied' then 0 when 'partially_satisfied' then 1 else 2 end) as rank
      from basis b
      join elem e on e.product_element_id = b.product_element_id and e.change <> 'removed'
      where b.component_assessment_id is not null
      group by b.control_id, b.component_assessment_id
    ) x
    group by x.control_id
  ),
  per as materialized (
    select s.control_id,
      count(b.control_id) as basis,
      count(b.control_id) filter (where b.product_element_id is null or e.change <> 'removed') as kept,
      count(*) filter (where e.change = 'modified') as modified,
      count(*) filter (where e.change = 'removed') as removed,
      coalesce(bool_or(b.shared) filter (where e.change = 'inherited'), false) as shared,
      bool_or(b.determination = 'other_than_satisfied') filter (where b.product_element_id is null or e.change <> 'removed') as other_than,
      bool_or(b.determination = 'partially_satisfied') filter (where b.product_element_id is null or e.change <> 'removed') as partially,
      bool_or(b.determination = 'satisfied') filter (where b.product_element_id is null or e.change <> 'removed') as satisfied,
      -- Whether a determination of the product's own stands behind the control, on an element the
      -- variant kept or on the product as a whole.
      coalesce(bool_or(b.determination is not null and b.component_assessment_id is null)
        filter (where b.product_element_id is null or e.change <> 'removed'), false) as product_determined,
      coalesce(jsonb_agg(jsonb_build_object(
        'product_element_id', e.product_element_id, 'system_id', e.system_id, 'code', e.code, 'name', e.name,
        'change', e.change, 'kinds', coalesce(to_jsonb(e.kinds), '[]'::jsonb)
      ) order by e.code) filter (where e.change in ('modified', 'removed')), '[]'::jsonb) as changed_elements
    from selected s
    left join basis b on b.control_id = s.control_id
    left join elem e on e.product_element_id = b.product_element_id
    group by s.control_id
  ),
  line as (
    select k.id, k.code, k.title, k.parent_control_id,
      public.natural_sort_key(k.code) collate "C" as code_order,
      upper(g.source_id) as family, g.title as family_title,
      case
        when p.kept = 0 then 'program_only'
        when p.modified > 0 or p.removed > 0 then 'changed_here'
        when p.shared then 'shared'
        else 'inherited'
      end as delta,
      case
        when p.kept = 0 then null
        when p.other_than then 'other_than_satisfied'
        when p.partially then 'partially_satisfied'
        when p.satisfied then 'satisfied'
        else 'not_assessed'
      end as product_status,
      p.changed_elements, h.assessments as component_assessments, p.product_determined
    from per p
    join public.controls k on k.id = p.control_id
    left join public.catalog_groups g on g.id = k.group_id
    left join handed h on h.control_id = p.control_id
  )
  select jsonb_build_object(
    'system_id', p_system_id,
    'program_id', v_system.program_id,
    'product', jsonb_build_object(
      'id', v_product.id, 'code', v_product.code, 'name', v_product.name,
      'revision_id', v_revision.id, 'version', v_revision.version_number,
      'configuration_id', v_configuration.id, 'configuration_code', v_configuration.code,
      'configuration', v_configuration.name),
    'assessment', case when v_assessment.id is null then null else jsonb_build_object(
      'id', v_assessment.id, 'title', v_assessment.title, 'published_at', v_assessment.published_at) end,
    'update_available', case when v_latest.id is null then null else jsonb_build_object(
      'revision_id', v_latest.id, 'version', v_latest.version_number) end,
    'elements', jsonb_build_object(
      'inherited', (select count(*) from elem where change = 'inherited'),
      'modified', (select count(*) from elem where change = 'modified'),
      'removed', (select count(*) from elem where change = 'removed'),
      'added', (select count(*) from inst where product_element_id is null)),
    'totals', jsonb_build_object(
      'controls', (select count(*) from line),
      'inherited', (select count(*) from line where delta = 'inherited'),
      'shared', (select count(*) from line where delta = 'shared'),
      'changed_here', (select count(*) from line where delta = 'changed_here'),
      'program_only', (select count(*) from line where delta = 'program_only')),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id, 'code', l.code, 'title', l.title, 'parent_id', l.parent_control_id,
        'family', l.family, 'family_title', l.family_title,
        'delta', l.delta, 'product_status', l.product_status, 'changed_elements', l.changed_elements
      ) || case when l.component_assessments is null then '{}'::jsonb
          else jsonb_build_object(
            'component_assessments', l.component_assessments, 'product_determined', l.product_determined) end
        order by l.family nulls last, l.code_order, l.id), '[]'::jsonb)
      from line l)
  )
  -- Named only where something is inherited: the component assessments behind those controls.
  || coalesce((
    select jsonb_build_object('component_assessments', jsonb_agg(jsonb_build_object(
      'id', a.id, 'title', a.title, 'published_at', a.published_at) order by a.title, a.id))
    from public.component_assessments a
    where a.tenant_id = p_tenant_id
      and a.id in (select (s->>'id')::uuid from line l
        cross join lateral jsonb_array_elements(l.component_assessments) s)
    having count(*) > 0), '{}'::jsonb)
  into answer;
  return answer;
end;
$$;
revoke all on function public.variant_control_delta_answer(uuid, uuid) from public, anon;
grant execute on function public.variant_control_delta_answer(uuid, uuid) to authenticated;
comment on function public.variant_control_delta_answer(uuid, uuid) is 'Internal: variant_control_delta''s answer, asking nothing of who calls. Row-level security decides what it reads, and a system the caller cannot read is refused. The product''s standing on a control is the worst of what stands on the elements the variant kept and on the product as a whole (product_element_standing), the product''s own determinations and its components'' where it made none; a control such a component determination stands behind names the component assessments in component_assessments, each with its worst there, and says whether a determination of the product''s own stands behind it too (product_determined), and the answer names those assessments once more with their titles; none of the keys is written where nothing is inherited. Security invoker; program_control_standing_lines reads it for the posture snapshots, which a scheduled job takes with no identity.';

-- ---------------------------------------------------------------------------------------------
-- Internal: where a program's mappings stand, asked by anyone row-level security lets read the
-- program, and for a few controls.
-- ---------------------------------------------------------------------------------------------
-- program_objective_placement's read, so the inheritance below and the posture reads place an
-- objective by one rule. It asks nothing of who calls, since the daily posture snapshots count
-- inherited objectives with no identity, and takes the controls to place: every control where none
-- is named.
create or replace function public.program_objective_placement_answer(p_program_id uuid, p_control_ids uuid[])
returns table (
  system_id uuid, requirement_id uuid, control_id uuid, objective_id uuid,
  evidenced boolean, control_objectives bigint
)
language plpgsql stable security invoker rows 5000 set search_path = '' as $$
#variable_conflict use_column
declare v_tenant uuid;
begin
  -- A program the caller cannot read is refused, never answered as placing nothing. Row-level
  -- security decides: a member reads the programs of their workspace, and the snapshot job, as the
  -- database's owner, reads every one.
  select p.tenant_id into v_tenant from public.programs p where p.id = p_program_id;
  if v_tenant is null then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  -- No control named is nothing to place, and nothing is read.
  if p_control_ids is not null and cardinality(p_control_ids) = 0 then
    return;
  end if;
  return query
  with recursive
  -- Each requirement at its latest revision, picked with distinct on (program_resiliency_posture
  -- says why).
  cur as materialized (
    select distinct on (q.id) q.id as requirement_id, v.id as revision_id
    from public.engineering_requirements q
    join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
    where q.tenant_id = v_tenant and q.program_id = p_program_id
    order by q.id, v.version_number desc
  ),
  el as materialized (
    select s.id from public.systems s where s.tenant_id = v_tenant and s.program_id = p_program_id
  ),
  -- Each element's control baseline: the controls it selects are the objectives it can be mapped
  -- for.
  base as materialized (
    select b.system_id, b.profile_resolution_id
    from public.system_effective_baselines b
    where b.tenant_id = v_tenant and b.system_id in (select el.id from el)
      and b.profile_resolution_id is not null
  ),
  -- The program's mappings at their requirements' latest revisions, each with the objective it
  -- names: none where it maps the whole control or names a statement, an item or a part that is not
  -- one of the control's objectives, which cover the whole control.
  mapping as materialized (
    select distinct cur.requirement_id, cur.revision_id, l.control_id, l.system_id,
      case when cp.name = 'assessment-objective' and cp.control_id = l.control_id
        then l.control_part_id end as objective_id
    from public.requirement_control_links l
    join cur on cur.revision_id = l.requirement_revision_id
    left join public.control_parts cp on cp.id = l.control_part_id
    where l.tenant_id = v_tenant
      and (p_control_ids is null or l.control_id = any(p_control_ids))
  ),
  -- What each of those baselines selects, read once a baseline and by the baseline: the elements of
  -- a program share a few, and a selection read an element, or a control, is read under row-level
  -- security as many times over (by the controls mapped, every baseline of the workspace that
  -- selects them).
  selects as materialized (
    select x.profile_resolution_id, x.control_id
    from (select distinct b.profile_resolution_id from base b) r
    cross join lateral (
      select sc.profile_resolution_id, sc.control_id
      from public.selected_controls sc
      where sc.profile_resolution_id = r.profile_resolution_id
      -- Read as a range of each baseline's selections: never flattened into a join the planner may
      -- answer by reading every selection of every workspace.
      offset 0
    ) x
  ),
  -- Where each mapping stands: on the element it names, where that element's baseline selects the
  -- control; one that names none, on each element its requirement is allocated to whose baseline
  -- selects it.
  placed as materialized (
    select m.requirement_id, m.control_id, m.objective_id, m.system_id
    from mapping m
    join base b on b.system_id = m.system_id
    join selects s on s.profile_resolution_id = b.profile_resolution_id and s.control_id = m.control_id
    union
    select m.requirement_id, m.control_id, m.objective_id, a.system_id
    from mapping m
    join public.requirement_allocations a on a.tenant_id = v_tenant and a.requirement_revision_id = m.revision_id
    join base b on b.system_id = a.system_id
    join selects s on s.profile_resolution_id = b.profile_resolution_id and s.control_id = m.control_id
    where m.system_id is null
  ),
  control as materialized (select distinct p.control_id from placed p),
  objective as materialized (
    select cp.id, cp.control_id, cp.parent_part_id, cp.prose
    from public.control_parts cp
    where cp.name = 'assessment-objective' and cp.control_id in (select c.control_id from control c)
  ),
  -- The objectives a control counts: its leaves, and each heading that prints a sentence of its own
  -- besides the objectives under it (program_control_objective_cover's rule).
  counted as materialized (
    select o.id, o.control_id
    from objective o
    where not exists (select 1 from objective c where c.parent_part_id = o.id)
      or public.objective_prints_own_sentence(o.prose)
  ),
  per_control as materialized (
    select k.control_id, count(*) as objectives from counted k group by k.control_id
  ),
  -- Each counted objective with itself and every objective above it, since a mapping that names any
  -- of them covers it. Sixteen levels bound a broken chain; the catalog nests four.
  reach as (
    select k.id as counted_id, k.id as part_id, o.parent_part_id as parent_id, 1 as depth
    from counted k
    join objective o on o.id = k.id
    union all
    select r.counted_id, o.id, o.parent_part_id, r.depth + 1
    from reach r
    join objective o on o.id = r.parent_id
    where r.depth < 16
  ),
  -- What each placed mapping covers where it stands. A control that counts no objective covers none,
  -- and its mapping still stands there, so the requirement does.
  covered as (
    select p.system_id, p.requirement_id, p.control_id, k.id as objective_id
    from placed p
    join counted k on k.control_id = p.control_id
    where p.objective_id is null
    union
    select p.system_id, p.requirement_id, p.control_id, r.counted_id
    from placed p
    join reach r on r.part_id = p.objective_id
    union
    select p.system_id, p.requirement_id, p.control_id, null::uuid
    from placed p
    where not exists (select 1 from per_control k where k.control_id = p.control_id)
  ),
  evidenced as materialized (
    select distinct cur.requirement_id
    from cur
    join public.requirement_evidence re on re.tenant_id = v_tenant and re.requirement_revision_id = cur.revision_id
    join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
  )
  select c.system_id, c.requirement_id, c.control_id, c.objective_id,
    e.requirement_id is not null, coalesce(k.objectives, 0)
  from covered c
  left join evidenced e on e.requirement_id = c.requirement_id
  left join per_control k on k.control_id = c.control_id;
end;
$$;
revoke all on function public.program_objective_placement_answer(uuid, uuid[]) from public, anon;
grant execute on function public.program_objective_placement_answer(uuid, uuid[]) to authenticated;
comment on function public.program_objective_placement_answer(uuid, uuid[]) is 'Internal: program_objective_placement''s answer, asking nothing of who calls but that row-level security lets them read the program, for the controls named (every control where p_control_ids is null, none where it is empty). A mapping stands on the element it names where that element''s effective control baseline selects the control; one that names no element on each element its requirement is allocated to whose baseline selects it; elsewhere it is not placed. It covers the objective it names and every one under it, or every objective its control counts where it names none, a statement or a part that is not an objective. One row an element, requirement, control and objective covered, with whether the requirement cites evidence and how many objectives the control counts; a control that counts none answers one row with no objective. Security invoker. The posture reads place through program_objective_placement, and program_objective_inheritance reads it for the status reads and the posture snapshots.';

create or replace function public.program_objective_placement(p_program_id uuid)
returns table (
  system_id uuid, requirement_id uuid, control_id uuid, objective_id uuid,
  evidenced boolean, control_objectives bigint
)
language plpgsql stable security invoker rows 5000 set search_path = '' as $$
#variable_conflict use_column
begin
  -- A session with no account is refused, as a program the caller cannot read is by the answer.
  if auth.uid() is null then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  return query
  select a.system_id, a.requirement_id, a.control_id, a.objective_id, a.evidenced, a.control_objectives
  from public.program_objective_placement_answer(p_program_id, null) a;
end;
$$;
revoke all on function public.program_objective_placement(uuid) from public, anon;
grant execute on function public.program_objective_placement(uuid) to authenticated;
comment on function public.program_objective_placement(uuid) is 'Internal to the posture reads, as the caller: where each mapping of a program''s requirements (at their latest revisions) stands and what it covers there. A mapping stands on the element it names where that element''s effective control baseline selects the control; one that names no element on each element its requirement is allocated to whose baseline selects it; elsewhere it is not placed. It covers the objective it names and every one under it, or every objective its control counts (each leaf, and each heading that prints a sentence of its own) where it names none, a statement or a part that is not an objective. One row an element, requirement, control and objective covered, with whether the requirement cites evidence and how many objectives the control counts; a control that counts none answers one row with no objective. A program the caller cannot read is refused, as is a session with no account. The answer is program_objective_placement_answer''s, for every control.';

-- ---------------------------------------------------------------------------------------------
-- Internal: the elements of a program that inherit a control.
-- ---------------------------------------------------------------------------------------------
-- The one place the program's rule about an element lives. An element inherits a control when at
-- least one system component sits on it, every system component on it is built from a library
-- component version whose standing holds a determination on that control, and the program has not
-- declared the element modified. One row an element, control and component assessment behind it,
-- with the worst that assessment determined among the element's components; the element's own
-- determination is the worst of its rows.
create or replace function public.program_element_inheritance(p_program_id uuid, p_control_ids uuid[])
returns table (element_id uuid, control_id uuid, determination text, component_assessment_id uuid)
language plpgsql stable security invoker set search_path = '' as $$
#variable_conflict use_column
begin
  -- A program the caller cannot read is refused, never answered as inheriting nothing.
  if not exists (select 1 from public.programs p where p.id = p_program_id) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  -- Nothing is inherited where no system component of the program is built from a library
  -- component a published assessment judged on one of the controls. Asked first and by the
  -- components, so a program that takes nothing judged from the library reads nothing more.
  if not exists (
    select 1
    from public.systems b
    join public.system_components c on c.tenant_id = b.tenant_id and c.system_id = b.id
    join public.component_determinations d
      on d.tenant_id = c.tenant_id and d.defined_component_id = c.defined_component_id
    join public.component_assessments a
      on a.tenant_id = d.tenant_id and a.id = d.component_assessment_id and a.state = 'published'
    where b.program_id = p_program_id
      and (p_control_ids is null or d.control_id = any(p_control_ids))
  ) then
    return;
  end if;
  return query
  with
  -- Each system component of the program on the element it sits on: the one it names, else the one
  -- a single inventory relationship gives it (system_component_element_links), else its system, as
  -- component_consumers and system_upstream place it.
  component as materialized (
    select coalesce(k.system_element_id, c.system_id) as element_id, c.id, c.defined_component_id
    from public.systems b
    join public.system_components c on c.tenant_id = b.tenant_id and c.system_id = b.id
    left join public.system_component_element_links k on k.tenant_id = c.tenant_id and k.id = c.id
    where b.program_id = p_program_id
  ),
  -- Where the library component versions among them stand: a determination, never a claim nobody
  -- judged.
  stands as materialized (
    select l.defined_component_id, l.control_id, l.status, l.component_assessment_id
    from public.component_standing_lines(array(
      select distinct c.defined_component_id from component c where c.defined_component_id is not null)) l
    where l.component_assessment_id is not null
      and (p_control_ids is null or l.control_id = any(p_control_ids))
  ),
  held as materialized (
    select c.element_id, c.id as system_component_id, s.control_id, s.status, s.component_assessment_id
    from component c
    join stands s on s.defined_component_id = c.defined_component_id
  ),
  -- An element inherits a control once every system component on it holds a determination on it:
  -- one that is not from the library, or whose version nobody judged on the control, leaves the
  -- control with the program's assessor. So does an element the program declared modified.
  inherited as (
    select h.element_id, h.control_id
    from held h
    join public.systems e on e.id = h.element_id and e.product_change_kinds is null
    group by h.element_id, h.control_id
    having count(*) = (select count(*) from component c where c.element_id = h.element_id)
  )
  select h.element_id, h.control_id,
    (array['other_than_satisfied', 'partially_satisfied', 'satisfied'])[
      min(case h.status when 'other_than_satisfied' then 0 when 'partially_satisfied' then 1 else 2 end) + 1],
    h.component_assessment_id
  from held h
  join inherited i on i.element_id = h.element_id and i.control_id = h.control_id
  group by h.element_id, h.control_id, h.component_assessment_id;
end;
$$;
revoke all on function public.program_element_inheritance(uuid, uuid[]) from public, anon;
grant execute on function public.program_element_inheritance(uuid, uuid[]) to authenticated;
comment on function public.program_element_inheritance(uuid, uuid[]) is 'Internal: the elements of a program that inherit one of the controls named (every control where p_control_ids is null). An element inherits a control when at least one system component sits on it (the element it names, else the one its single inventory relationship gives it, else its system), every system component on it is built from a library component version whose standing holds a determination on the control (component_standing_lines), and the program has not declared the element modified (systems.product_change_kinds). One row an element, control and component assessment behind it, with the worst that assessment determined among the element''s components; the element''s determination is the worst of its rows. A draft component assessment decides nothing. Security invoker, asking nothing of who calls but that row-level security lets them read the program: one they cannot read is refused. program_objective_inheritance, component_consumers and system_upstream read it.';

-- ---------------------------------------------------------------------------------------------
-- Internal: what is judged for a program by inheritance.
-- ---------------------------------------------------------------------------------------------
-- A component determination names a whole control, so it covers every objective the control
-- counts; which of them it covers for a program is said by where the program's requirements place
-- them. A target (an objective a control counts, or the control itself where it counts none) is
-- judged by inheritance when the program's mappings place it on at least one element and every
-- element it is placed on inherits the control: placed on one element more, it stays with the
-- program's assessor. It takes the worst of those elements' determinations.
create or replace function public.program_objective_inheritance(p_program_id uuid, p_control_ids uuid[])
returns table (control_id uuid, objective_id uuid, determination text, component_assessments jsonb)
language plpgsql stable security invoker set search_path = '' as $$
#variable_conflict use_column
begin
  -- A program the caller cannot read is refused, never answered as inheriting nothing.
  if not exists (select 1 from public.programs p where p.id = p_program_id) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  return query
  with
  element as materialized (
    select e.element_id, e.control_id, e.determination, e.component_assessment_id
    from public.program_element_inheritance(p_program_id, p_control_ids) e
  ),
  -- Where the program's mappings place each target of the controls some element inherits; nothing
  -- is read where none inherits any.
  place as materialized (
    select distinct p.control_id, p.objective_id, p.system_id
    from public.program_objective_placement_answer(
      p_program_id, array(select distinct e.control_id from element e)) p
  ),
  target as materialized (
    select p.control_id, p.objective_id
    from place p
    left join (select distinct e.element_id, e.control_id from element e) i
      on i.element_id = p.system_id and i.control_id = p.control_id
    group by p.control_id, p.objective_id
    having bool_and(i.element_id is not null)
  ),
  -- Each component assessment behind a target, with its worst on the elements the target is
  -- placed on.
  source as (
    select t.control_id, t.objective_id, e.component_assessment_id as id,
      min(case e.determination when 'other_than_satisfied' then 0 when 'partially_satisfied' then 1 else 2 end) as rank
    from target t
    join place p on p.control_id = t.control_id and p.objective_id is not distinct from t.objective_id
    join element e on e.element_id = p.system_id and e.control_id = p.control_id
    group by t.control_id, t.objective_id, e.component_assessment_id
  )
  select s.control_id, s.objective_id,
    (array['other_than_satisfied', 'partially_satisfied', 'satisfied'])[min(s.rank) + 1],
    jsonb_agg(jsonb_build_object('id', s.id, 'determination',
      (array['other_than_satisfied', 'partially_satisfied', 'satisfied'])[s.rank + 1]) order by s.rank, s.id)
  from source s
  group by s.control_id, s.objective_id;
end;
$$;
revoke all on function public.program_objective_inheritance(uuid, uuid[]) from public, anon;
grant execute on function public.program_objective_inheritance(uuid, uuid[]) to authenticated;
comment on function public.program_objective_inheritance(uuid, uuid[]) is 'Internal: each target of the named controls that is judged for the program by inheritance, whatever its own assessors judged: an assessment objective a control counts (or, objective_id null, the control itself where it counts none) that the program''s mappings place on at least one element (program_objective_placement_answer), every one of which inherits the control (program_element_inheritance). Its determination is the worst of those elements'', and component_assessments lists the component assessments behind it, each with its worst there, the worst first. A target placed on an element that does not inherit the control, or placed nowhere, has no row. Security invoker, asking nothing of who calls but that row-level security lets them read the program: one they cannot read is refused. program_control_objective_judgments reads it and lets the program''s own determination stand over it.';

-- ---------------------------------------------------------------------------------------------
-- Internal: what is judged of each control for a program, by its assessors or by inheritance.
-- ---------------------------------------------------------------------------------------------
-- The answer gains two columns, so the function is made again; nothing depends on it but the
-- bodies that call it, which read its columns by name.
drop function if exists public.program_control_objective_judgments(uuid, uuid[]);
create function public.program_control_objective_judgments(p_program_id uuid, p_control_ids uuid[])
returns table (
  control_id uuid, objective_id uuid, determination text,
  inherited boolean, component_assessments jsonb
)
language plpgsql stable security invoker set search_path = '' as $$
#variable_conflict use_column
begin
  -- A program the caller cannot read is refused, never answered as judging nothing.
  if not exists (select 1 from public.programs p where p.id = p_program_id) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  return query
  with recursive
  -- The latest determination on each part of the named controls, in a published results revision
  -- of one of the program's campaigns, with when it was made and recorded. Not assessed decides
  -- nothing.
  judged as materialized (
    select distinct on (f.target_control_part_id) cp.control_id, cp.id as part_id,
      cp.name = 'assessment-objective' as objective, f.determination,
      f.determined_at, f.created_at, f.id as finding_id
    from public.assessment_findings f
    join public.control_parts cp on cp.id = f.target_control_part_id
    join public.assessment_results_revisions r
      on r.tenant_id = f.tenant_id and r.id = f.assessment_results_revision_id
    join public.assessment_plan_revisions pl
      on pl.tenant_id = r.tenant_id and pl.id = r.assessment_plan_revision_id
    join public.assessment_campaigns g on g.tenant_id = pl.tenant_id and g.id = pl.campaign_id
    where g.program_id = p_program_id
      and r.state = 'published'
      and f.determination <> 'not_assessed'
      and cp.control_id = any(p_control_ids)
    order by f.target_control_part_id, f.determined_at desc nulls last, f.created_at desc, f.id desc
  ),
  -- Only a control with a judged part has anything judged: its objectives are read, no other's.
  control as materialized (
    select distinct j.control_id as id from judged j
  ),
  objective as materialized (
    select cp.id, cp.control_id, cp.parent_part_id, cp.prose
    from public.control_parts cp
    where cp.name = 'assessment-objective' and cp.control_id in (select c.id from control c)
  ),
  -- The objectives a control counts, as program_control_objective_cover counts them: its leaves,
  -- and each heading that prints a sentence of its own besides the objectives under it.
  counted as materialized (
    select o.id, o.control_id
    from objective o
    where not exists (select 1 from objective c where c.parent_part_id = o.id)
      or public.objective_prints_own_sentence(o.prose)
  ),
  -- Each counted objective, with its control, with itself (depth 1) and every objective above it,
  -- the nearer first: the control carried along, so a determination on a part finds the targets it
  -- judges without asking the counted objectives again for each. Sixteen levels bound a broken
  -- chain; the catalog nests four.
  reach as (
    select k.control_id, k.id as counted_id, k.id as part_id, o.parent_part_id as parent_id, 1 as depth
    from counted k
    join objective o on o.id = k.id
    union all
    select r.control_id, r.counted_id, o.id, o.parent_part_id, r.depth + 1
    from reach r
    join objective o on o.id = r.parent_id
    where r.depth < 16
  ),
  -- Every determination that judges each target, with how near its part stands to the target: a
  -- determination on a part that is not one of the control's objectives judges every target of it,
  -- and stands farthest; one on an objective judges that objective and every objective under it, at
  -- the objective's depth above the target; and a control that counts no objective is judged by a
  -- determination on any of its parts.
  verdict as (
    select k.control_id, k.id as objective_id, j.determination, j.determined_at, j.created_at,
      j.finding_id, 2147483647 as nearness
    from counted k
    join judged j on j.control_id = k.control_id and not j.objective
    union all
    select r.control_id, r.counted_id, j.determination, j.determined_at, j.created_at, j.finding_id, r.depth
    from reach r
    join judged j on j.part_id = r.part_id
    union all
    select c.id, null::uuid, j.determination, j.determined_at, j.created_at, j.finding_id, 0
    from control c
    join judged j on j.control_id = c.id
    where not exists (select 1 from counted k where k.control_id = c.id)
  ),
  -- The latest decides each target: the newest determination that judges it, by when it was made
  -- (one with no moment the oldest) and then recorded; at the same moment, the nearer part's, then
  -- the worse.
  own as materialized (
    select distinct on (v.control_id, v.objective_id) v.control_id, v.objective_id, v.determination
    from verdict v
    order by v.control_id, v.objective_id, v.determined_at desc nulls last, v.created_at desc,
      v.nearness,
      case v.determination when 'other_than_satisfied' then 0 when 'partially_satisfied' then 1 else 2 end,
      v.finding_id desc
  )
  select o.control_id, o.objective_id, o.determination, false, null::jsonb
  from own o
  union all
  -- A target the program's assessors have not judged is judged by inheritance where every element
  -- its requirements place it on takes its components' determination
  -- (program_objective_inheritance). The program's own determination always stands over it.
  select i.control_id, i.objective_id, i.determination, true, i.component_assessments
  from public.program_objective_inheritance(p_program_id, p_control_ids) i
  where not exists (select 1 from own o
    where o.control_id = i.control_id and o.objective_id is not distinct from i.objective_id);
end;
$$;
revoke all on function public.program_control_objective_judgments(uuid, uuid[]) from public, anon;
grant execute on function public.program_control_objective_judgments(uuid, uuid[]) to authenticated;
comment on function public.program_control_objective_judgments(uuid, uuid[]) is 'Internal: each target of the named controls that is judged for the program (each assessment objective a control counts, a leaf or a heading that prints a sentence of its own, as program_control_objective_cover counts them; or, objective_id null, the control itself where it counts none), with the determination that decides it. A target is judged by the program''s assessors through a determination, other than not assessed, in a published results revision of one of the program''s campaigns on a part of its control: a part that is not one of the control''s objectives (its statement, an item of its text) judges every target of the control, an objective judges itself and every objective under it, and any part judges a control that counts no objective. Of the latest determination on each such part, the newest decides the target (by determined_at, one with none the oldest, then by when it was recorded; at the same moment the nearer part''s, the objective''s own before one above it and both before the statement''s, then the worse). A target they have not judged is judged by inheritance (inherited true) where the program''s mappings place it only on elements that inherit the control from the components they are built from (program_objective_inheritance), with the worst of those elements'' determinations and the component assessments behind it (component_assessments, each with its determination); the program''s own determination always stands over an inherited one. A target nobody has judged has no row. Security invoker: a program the caller cannot read is refused. program_control_standing_lines, risk_threats, control_objective_counts, plan_control_holdings and add_control_objectives read it, so an inherited objective counts as assessed and an assessment leaves it out.';

-- ---------------------------------------------------------------------------------------------
-- Internal: one line a control of a program's control baseline, with what inheritance adds.
-- ---------------------------------------------------------------------------------------------
-- The counting of program_control_status_lines, which keeps its columns and reads this. The two
-- columns it adds are read by program_control_status alone.
create or replace function public.program_control_standing_lines(p_program_id uuid)
returns table (
  id uuid, code text, title text, parent_control_id uuid, code_order text,
  family text, family_title text, requirements bigint, evidenced bigint,
  status text, determined_by text, product_assessments jsonb,
  objectives bigint, objectives_mapped bigint, objectives_evidenced bigint, objectives_assessed bigint,
  objectives_inherited bigint, component_assessments jsonb
)
language plpgsql stable security invoker set search_path = '' as $$
#variable_conflict use_column
declare v_tenant uuid;
begin
  -- A program the caller cannot read is refused, never answered as empty. Row-level security
  -- decides: a member reads the programs of their workspace, and the snapshot job, as the
  -- database's owner, reads every one.
  select p.tenant_id into v_tenant from public.programs p where p.id = p_program_id;
  if v_tenant is null then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  return query
  with
  -- The controls a control baseline of the program selects: any of the baselines it adopted.
  selected as materialized (
    select distinct sc.control_id
    from public.program_reference_choices c
    join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
    where c.program_id = p_program_id
  ),
  -- What the program's requirements cover of every control, and each control's requirements: one
  -- read of every control, never a read a control.
  cover as materialized (
    select o.control_id, o.objective_id, o.system_id, o.requirement_id, o.evidenced, o.mapping
    from public.program_control_coverage(p_program_id, array(select s.control_id from selected s)) o
  ),
  -- Each target on each system: covered there, and covered there by a requirement that cites
  -- evidence. One read of every control, never a read a control.
  spot as materialized (
    select o.control_id, o.objective_id, o.system_id,
      bool_or(o.requirement_id is not null) as covered,
      bool_or(o.evidenced) as evidenced
    from cover o
    where not o.mapping
    group by o.control_id, o.objective_id, o.system_id
  ),
  -- Each target mapped once covered on every system, and evidenced once evidenced on every one.
  target as (
    select t.control_id, t.objective_id, bool_and(t.covered) as mapped, bool_and(t.evidenced) as evidenced
    from spot t
    group by t.control_id, t.objective_id
  ),
  -- Each control's objectives, how many are mapped and how many evidenced; and, for a control that
  -- counts no objective, whether the control itself is.
  coverage as materialized (
    select t.control_id,
      count(t.objective_id) as objectives,
      count(t.objective_id) filter (where t.mapped) as mapped,
      count(t.objective_id) filter (where t.evidenced) as evidenced,
      bool_or(t.mapped) filter (where t.objective_id is null) as whole_mapped,
      bool_or(t.evidenced) filter (where t.objective_id is null) as whole_evidenced
    from target t
    group by t.control_id
  ),
  -- What is judged of each control for the program, by its assessors or by inheritance from the
  -- components its elements are built from: how many of its objectives, how many of those by
  -- inheritance, whether the control itself (one that counts none), and the worst determination
  -- among them. One read of every control.
  judged as materialized (
    select j.control_id, j.objective_id, j.determination, j.inherited, j.component_assessments
    from public.program_control_objective_judgments(p_program_id, array(select s.control_id from selected s)) j
  ),
  judgment as materialized (
    select j.control_id,
      count(j.objective_id) as assessed,
      count(j.objective_id) filter (where j.inherited) as inherited,
      bool_or(j.objective_id is null) as whole,
      bool_or(j.determination = 'other_than_satisfied') as other_than,
      bool_or(j.determination = 'partially_satisfied') as partially
    from judged j
    group by j.control_id
  ),
  -- The component assessments behind each control's inherited targets, with what each determined.
  handed as (
    select j.control_id, (s->>'id')::uuid as assessment_id, s->>'determination' as determination
    from judged j
    cross join lateral jsonb_array_elements(j.component_assessments) s
    where j.inherited
  ),
  -- The program's own determination: the worst of its assessors', once every target is judged
  -- (every objective the control counts, or the control itself where it counts none). A control
  -- judged in part has none yet.
  worst as (
    select j.control_id, j.other_than, j.partially
    from judgment j
    left join coverage o on o.control_id = j.control_id
    where case when coalesce(o.objectives, 0) > 0 then j.assessed = o.objectives else j.whole end
  ),
  -- The program's product variants (its boundary systems created from a product configuration),
  -- in the order the program took them, each read for its delta once, as the Product delta view
  -- reads it, so the two never disagree.
  variant as materialized (
    select s.id, row_number() over (order by s.created_at, s.code, s.id) as position,
      public.variant_control_delta_answer(s.tenant_id, s.id) as delta
    from public.systems s
    where s.tenant_id = v_tenant and s.program_id = p_program_id
      and s.is_authorization_boundary and s.product_configuration_id is not null
  ),
  -- A variant's word on a control it inherits from its product with a determination, and the
  -- product assessment the determination was read from.
  inherits as materialized (
    select (c->>'id')::uuid as control_id, v.id as variant_id, v.position,
      c->>'product_status' as determination,
      (v.delta->'assessment'->>'id')::uuid as assessment_id,
      v.delta->'assessment'->>'title' as assessment_title,
      -- Said only of a control a component's determination stands behind: the component assessments,
      -- and whether the product's own assessment judged the control too.
      c->'component_assessments' as handed,
      coalesce((c->>'product_determined')::boolean, true) as own
    from variant v
    cross join lateral jsonb_array_elements(v.delta->'controls') c
    where c->>'delta' = 'inherited'
      and c->>'product_status' in ('satisfied', 'partially_satisfied', 'other_than_satisfied')
  ),
  -- The controls every variant of the program inherits with a determination.
  whole as (
    select i.control_id
    from inherits i
    group by i.control_id
    having count(distinct i.variant_id) = (select count(*) from variant)
  ),
  -- Each product assessment behind such a control, with its worst determination on it: two
  -- variants of one product version read one assessment.
  behind as (
    select i.control_id, i.assessment_id, min(i.assessment_title) as title, min(i.position) as position,
      case
        when bool_or(i.determination = 'other_than_satisfied') then 'other_than_satisfied'
        when bool_or(i.determination = 'partially_satisfied') then 'partially_satisfied'
        else 'satisfied'
      end as determination,
      bool_or(i.own) as own
    from inherits i
    where i.control_id in (select control_id from whole)
    group by i.control_id, i.assessment_id
  ),
  -- A product assessment is named where it judged the control itself: one whose elements take
  -- their components' determinations on it, and made none of its own, is not.
  product as (
    select b.control_id,
      bool_or(b.determination = 'other_than_satisfied') as other_than,
      bool_or(b.determination = 'partially_satisfied') as partially,
      jsonb_agg(jsonb_build_object('id', b.assessment_id, 'title', b.title, 'determination', b.determination)
        order by case b.determination when 'other_than_satisfied' then 0 when 'partially_satisfied' then 1 else 2 end,
          b.position, b.assessment_id) filter (where b.own and b.assessment_id is not null) as assessments
    from behind b
    group by b.control_id
  ),
  -- The component assessments behind a product's determination, where an element the variants kept
  -- takes its component's (variant_control_delta's component_assessments).
  passed as (
    select i.control_id, (s->>'id')::uuid as assessment_id, s->>'determination' as determination
    from inherits i
    cross join lateral jsonb_array_elements(i.handed) s
    where i.control_id in (select control_id from whole)
  ),
  -- The component assessments behind each control by name, with the worst each determined: those
  -- behind its inherited targets (inherited) and those behind the product's determination.
  named as materialized (
    select s.control_id, s.inherited, a.id, a.title,
      min(case s.determination when 'other_than_satisfied' then 0 when 'partially_satisfied' then 1 else 2 end) as rank
    from (
      select h.control_id, h.assessment_id, h.determination, true as inherited from handed h
      union all
      select p.control_id, p.assessment_id, p.determination, false from passed p
    ) s
    join public.component_assessments a on a.id = s.assessment_id
    group by s.control_id, s.inherited, a.id, a.title
  ),
  -- Joined and grouped, never asked once a control: the session's row-level security is checked
  -- on every row a subquery reads, and a subquery a control reads its tables 546 times over.
  counted as (
    select s.control_id,
      count(distinct o.requirement_id) as requirements,
      count(distinct o.requirement_id) filter (where o.evidenced) as evidenced
    from selected s
    left join cover o on o.control_id = s.control_id and o.mapping
    group by s.control_id
  ),
  line as (
    select k.id, k.code, k.title, k.parent_control_id,
      public.natural_sort_key(k.code) collate "C" as code_order,
      upper(g.source_id) as family, g.title as family_title,
      n.requirements, n.evidenced,
      case
        when w.other_than then 'other_than_satisfied'
        when w.partially then 'partially_satisfied'
        when w.control_id is not null then 'satisfied'
        when d.other_than then 'other_than_satisfied'
        when d.partially then 'partially_satisfied'
        when d.control_id is not null then 'satisfied'
        -- A control with objectives climbs by them: each evidenced on every system that selects
        -- the control, each covered on every one, or not every one covered on every one.
        when coalesce(o.objectives, 0) > 0 then
          case
            when o.evidenced = o.objectives then 'not_assessed'
            when o.mapped = o.objectives then 'no_evidence'
            else 'no_requirement'
          end
        -- One the catalog gives no objective climbs by the control itself, on every such system.
        when o.whole_evidenced then 'not_assessed'
        when o.whole_mapped then 'no_evidence'
        else 'no_requirement'
      end as status,
      case
        when w.control_id is not null then 'program'
        when d.control_id is not null then 'product'
      end as determined_by,
      case when w.control_id is null then d.assessments end as product_assessments,
      coalesce(o.objectives, 0) as objectives,
      coalesce(o.mapped, 0) as objectives_mapped,
      coalesce(o.evidenced, 0) as objectives_evidenced,
      case when coalesce(o.objectives, 0) > 0 then coalesce(j.assessed, 0) else 0 end as objectives_assessed,
      case when coalesce(o.objectives, 0) > 0 then coalesce(j.inherited, 0) else 0 end as objectives_inherited
    from counted n
    join public.controls k on k.id = n.control_id
    left join public.catalog_groups g on g.id = k.group_id
    left join worst w on w.control_id = n.control_id
    left join product d on d.control_id = n.control_id
    left join coverage o on o.control_id = n.control_id
    left join judgment j on j.control_id = n.control_id
  )
  select l.id, l.code, l.title, l.parent_control_id, l.code_order, l.family, l.family_title,
    l.requirements, l.evidenced, l.status, l.determined_by, l.product_assessments,
    l.objectives, l.objectives_mapped, l.objectives_evidenced, l.objectives_assessed,
    l.objectives_inherited,
    -- The component assessments behind the control, the worst determination first: those its
    -- inherited targets came from and, where the product's determination decides it, the product's.
    -- Null where there is none.
    (select jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'determination',
          (array['other_than_satisfied', 'partially_satisfied', 'satisfied'])[x.rank + 1])
        order by x.rank, x.title, x.id)
      from (
        select c.id, c.title, min(c.rank) as rank
        from named c
        where c.control_id = l.id and (c.inherited or l.determined_by = 'product')
        group by c.id, c.title
      ) x)
  from line l;
end;
$$;
revoke all on function public.program_control_standing_lines(uuid) from public, anon;
grant execute on function public.program_control_standing_lines(uuid) to authenticated;
comment on function public.program_control_standing_lines(uuid) is 'Internal: one line a control of a program''s control baseline, as program_control_status answers it (its status, the requirements that map it and how many cite evidence, its assessment objectives with how many are mapped, how many evidenced and how many judged, whose determination and the product assessments behind a product''s), with how many of its objectives are judged by inheritance (objectives_inherited) and the component assessments behind them or behind a product''s determination (component_assessments, null where there is none), asking nothing of who calls but that row-level security lets them read the program. A target (each objective, or the control itself where it counts none) is mapped once covered on every system of the program whose control baseline selects the control, and evidenced once covered on every one by a requirement that cites evidence (program_control_objective_cover, read with the requirements that map each control through program_control_coverage); a control leaves no requirement once every target is mapped and no evidence once every one is evidenced. A control is decided for the program once every target is judged, by its assessors or by inheritance (program_control_objective_judgments, where the program''s own newest determination decides a target and an inherited one stands only where its assessors judged nothing), with the worst of the targets'' determinations, and is then the program''s (determined_by program); until then the product''s determination decides where every variant inherits the control, else the ladder. Security invoker. program_control_status reads it, and program_control_status_lines for the counts and the posture snapshots.';

create or replace function public.program_control_status_lines(p_program_id uuid)
returns table (
  id uuid, code text, title text, parent_control_id uuid, code_order text,
  family text, family_title text, requirements bigint, evidenced bigint,
  status text, determined_by text, product_assessments jsonb,
  objectives bigint, objectives_mapped bigint, objectives_evidenced bigint, objectives_assessed bigint
)
language sql stable security invoker set search_path = '' as $$
  select l.id, l.code, l.title, l.parent_control_id, l.code_order, l.family, l.family_title,
    l.requirements, l.evidenced, l.status, l.determined_by, l.product_assessments,
    l.objectives, l.objectives_mapped, l.objectives_evidenced, l.objectives_assessed
  from public.program_control_standing_lines(p_program_id) l
$$;
revoke all on function public.program_control_status_lines(uuid) from public, anon;
grant execute on function public.program_control_status_lines(uuid) to authenticated;
comment on function public.program_control_status_lines(uuid) is 'Internal: one line a control of a program''s control baseline, as program_control_status answers it (its status, the requirements that map it and how many cite evidence, its assessment objectives with how many are mapped, how many evidenced and how many judged, whose determination and the product assessments behind a product''s), asking nothing of who calls but that row-level security lets them read the program. The lines and their counting are program_control_standing_lines''s, without the two columns that say what is inherited: an objective judged by inheritance counts among objectives_assessed, and a control decided through its objectives, judged or inherited, is the program''s. Security invoker. program_control_status_counts, program_posture and the posture snapshots count from it.';

-- ---------------------------------------------------------------------------------------------
-- One status for each control of a program's control baseline, saying what is inherited.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_control_status(p_program_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare answer jsonb; v_tenant uuid;
begin
  select p.tenant_id into v_tenant from public.programs p where p.id = p_program_id;
  if auth.uid() is null or v_tenant is null then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  with line as materialized (
    select * from public.program_control_standing_lines(p_program_id)
  )
  select jsonb_build_object(
    'program_id', p_program_id,
    -- Whether the program records a control baseline at all: without one there is nothing to
    -- stand on, which is not the same as every control standing nowhere.
    'baseline', exists (select 1 from public.program_reference_choices c where c.program_id = p_program_id),
    'totals', jsonb_build_object(
      'controls', (select count(*) from line),
      'satisfied', (select count(*) from line where status = 'satisfied'),
      'partially_satisfied', (select count(*) from line where status = 'partially_satisfied'),
      'other_than_satisfied', (select count(*) from line where status = 'other_than_satisfied'),
      'not_assessed', (select count(*) from line where status = 'not_assessed'),
      'no_evidence', (select count(*) from line where status = 'no_evidence'),
      'no_requirement', (select count(*) from line where status = 'no_requirement')
    ),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id, 'code', l.code, 'title', l.title,
        'parent_id', l.parent_control_id,
        'family', l.family, 'family_title', l.family_title,
        'status', l.status, 'requirements', l.requirements, 'evidenced', l.evidenced,
        'objectives', l.objectives, 'objectives_mapped', l.objectives_mapped,
        'objectives_evidenced', l.objectives_evidenced,
        'objectives_assessed', l.objectives_assessed,
        'determined_by', l.determined_by,
        'product_assessments', coalesce(l.product_assessments, '[]'::jsonb)
      )
      -- Said only of a control a component's determination stands behind: how many of its
      -- objectives are judged by inheritance, and the component assessments they came from.
      || case when l.component_assessments is null then '{}'::jsonb else jsonb_build_object(
        'objectives_inherited', l.objectives_inherited,
        'component_assessments', l.component_assessments) end
        order by l.family nulls last, l.code_order collate "C", l.id), '[]'::jsonb)
      from line l)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.program_control_status(uuid) from public, anon;
grant execute on function public.program_control_status(uuid) to authenticated;
comment on function public.program_control_status(uuid) is 'One status for each control of a program''s control baseline: once every assessment objective the control counts (the control itself, for one with none) is judged for the program, the worst of its objectives'' determinations, each objective decided by the newest of the latest determinations the program''s assessors published on it, on an objective above it and on a part that is not one of its objectives (its statement, an item of its text, which judges every objective), and one they have not judged by inheritance where the program''s requirements place it only on elements that inherit the control from the library components they are built from, unmodified; else, where every product variant of the program inherits the control with a determination, the worst of the product''s determinations; else not assessed, no evidence or no requirement, counted on every system of the program whose control baseline selects the control (each of its authorization boundaries that does; the program as a whole where none does): no requirement until every objective of the control (the control itself, for one with none) is covered on every such system, no evidence until each is covered on every one by a requirement that cites evidence. Each control says whose determination its status is (determined_by: program, for a control decided through its objectives, judged or inherited, or product) and the product assessments behind a product''s, with the program''s requirements that map it and how many of them cite evidence, and its objectives (objectives), how many are covered on every system (objectives_mapped), how many with evidence on every one (objectives_evidenced) and how many are judged, by an assessor of the program or by inheritance (objectives_assessed). A control a component''s determination stands behind also says how many of its objectives are judged by inheritance (objectives_inherited) and the component assessments they, or the product''s determination, came from (component_assessments, each with its title and its worst determination, the worst first); neither key is written on any other control, and a product assessment is named among product_assessments only where it judged the control itself. Security invoker: a program the reader cannot read is refused. The lines are program_control_standing_lines''s, which the counts and the posture snapshots count from too.';

-- ---------------------------------------------------------------------------------------------
-- Where used and Upstream: how much of what a component version is judged on each consumer
-- inherits. Redefined from 20261115090429 with new keys only.
-- ---------------------------------------------------------------------------------------------
create or replace function public.component_consumers(p_defined_component_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_component public.defined_components;
  v_revision public.component_definition_revisions;
  v_definition public.component_definitions;
  v_latest public.component_definition_revisions;
  v_tenant uuid;
begin
  select * into v_component from public.defined_components where id = p_defined_component_id;
  if auth.uid() is null or v_component.id is null then
    raise exception 'Component access is required' using errcode = '42501';
  end if;
  v_tenant := v_component.tenant_id;
  select * into v_revision from public.component_definition_revisions
    where tenant_id = v_tenant and id = v_component.component_definition_revision_id;
  select * into v_definition from public.component_definitions
    where tenant_id = v_tenant and id = v_revision.component_definition_id;
  select * into v_latest from public.component_definition_revisions r
    where r.tenant_id = v_tenant and r.component_definition_id = v_definition.id and r.state = 'published'
    order by r.version_number desc limit 1;
  with
  lineage as materialized (
    select * from public.component_lineage(p_defined_component_id)
  ),
  product_rows as materialized (
    select pe.id as element_id, pe.code as element_code, pe.name as element_name,
      pr.id as product_revision_id, pr.version_number as product_version, pr.state as product_state,
      p.id as product_id, p.code as product_code, p.name as product_name, p.business_line_id,
      l.defined_component_id, l.version_number as version, l.behind,
      pr.id = (select c.id from public.product_revisions c
        where c.tenant_id = v_tenant and c.product_id = p.id
        order by (c.state = 'published') desc, c.version_number desc limit 1) as is_current,
      (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'code', c.code, 'name', c.name) order by c.code, c.id), '[]'::jsonb)
        from public.product_configuration_elements m
        join public.product_configurations c on c.tenant_id = m.tenant_id and c.id = m.product_configuration_id
        where m.tenant_id = v_tenant and m.product_revision_id = pr.id and m.product_element_id = pe.id) as configurations
    from lineage l
    join public.product_elements pe on pe.tenant_id = v_tenant and pe.defined_component_id = l.defined_component_id
    join public.product_revisions pr on pr.tenant_id = v_tenant and pr.id = pe.product_revision_id
    join public.products p on p.tenant_id = v_tenant and p.id = pr.product_id
  ),
  system_rows as materialized (
    select sc.id as system_component_id, sc.code as component_code, sc.name as component_name,
      sc.version as component_version,
      b.id as system_id, b.code as system_code, b.name as system_name,
      e.id as element_id, e.code as element_code, e.name as element_name,
      g.id as program_id, g.code as program_code, g.name as program_name, g.business_line_id,
      l.defined_component_id, l.version_number as version, l.behind,
      e.product_element_id,
      case
        when e.product_change_kinds is not null then 'modified'
        when e.product_element_id is not null then 'inherited'
      end as change,
      e.product_change_kinds as change_kinds, e.product_change_rationale as change_rationale,
      pin.pin
    from lineage l
    join public.system_components sc on sc.tenant_id = v_tenant and sc.defined_component_id = l.defined_component_id
    join public.systems b on b.tenant_id = v_tenant and b.id = sc.system_id
    -- The element a component sits on is the one it names or, where it names none, the one a
    -- single inventory relationship gives it (system_component_element_links); else its system.
    left join public.system_component_element_links k on k.tenant_id = v_tenant and k.id = sc.id
    join public.systems e on e.tenant_id = v_tenant and e.id = coalesce(k.system_element_id, sc.system_id)
    join public.programs g on g.tenant_id = v_tenant and g.id = b.program_id
    left join lateral (
      select jsonb_build_object(
        'configuration_baseline_id', cb.id, 'name', cb.name, 'baseline_version', cb.version_number,
        'state', cb.state, 'version', cp.version) as pin
      from public.component_pins cp
      join public.configuration_baselines cb on cb.tenant_id = cp.tenant_id and cb.id = cp.configuration_baseline_id
      where cp.tenant_id = v_tenant and cp.system_component_id = sc.id
      order by (cb.state = 'published') desc, cb.version_number desc, cb.id limit 1
    ) pin on true
  ),
  -- A variant whose configuration includes an element built from the component and that holds no
  -- element for it: the program left it out.
  removed_rows as materialized (
    select b.id as system_id, b.code as system_code, b.name as system_name,
      g.id as program_id, g.code as program_code, g.name as program_name, g.business_line_id,
      pe.id as product_element_id, pe.code as element_code, pe.name as element_name,
      l.defined_component_id, l.version_number as version, l.behind
    from lineage l
    join public.product_elements pe on pe.tenant_id = v_tenant and pe.defined_component_id = l.defined_component_id
    join public.product_configuration_elements m
      on m.tenant_id = v_tenant and m.product_revision_id = pe.product_revision_id and m.product_element_id = pe.id
    join public.systems b
      on b.tenant_id = v_tenant and b.product_revision_id = m.product_revision_id
      and b.product_configuration_id = m.product_configuration_id and b.is_authorization_boundary
    join public.programs g on g.tenant_id = v_tenant and g.id = b.program_id
    where not exists (select 1 from public.systems s
      where s.tenant_id = v_tenant and s.boundary_system_id = b.id and s.product_element_id = pe.id)
  ),
  -- The findings that stand on a version of the component: each issue of an accepted offer.
  found as materialized (
    select o.id as offer_id, i.id as item_id, o.defined_component_id, l.version_number as version,
      o.reviewed_at as accepted_at, o.program_id as source_program_id, i.issue_id as source_issue_id,
      src.title, src.severity
    from lineage l
    join public.component_offers o
      on o.tenant_id = v_tenant and o.defined_component_id = l.defined_component_id
      and o.kind = 'finding' and o.state = 'accepted'
    join public.component_offer_items i on i.tenant_id = v_tenant and i.component_offer_id = o.id
    join public.operational_issues src on src.tenant_id = v_tenant and src.id = i.issue_id
  ),
  -- Each program's own issue for a finding that stands, and whether it is still open.
  held as materialized (
    select f.offer_id, f.item_id, f.defined_component_id, k.program_id, k.issue_id, k.source,
      x.title, x.severity, x.status, x.opened_at, x.status not in ('resolved', 'closed') as open
    from found f
    join public.component_offer_issues k on k.tenant_id = v_tenant and k.component_offer_item_id = f.item_id
    join public.operational_issues x on x.tenant_id = v_tenant and x.id = k.issue_id
  ),
  -- How many CVEs affect each version of the component, through its standing SBOM.
  exposure as materialized (
    select x.defined_component_id, count(*) as vulnerabilities
    from public.component_open_vulnerabilities(array(select l.defined_component_id from lineage l)) x
    group by x.defined_component_id
  ),
  -- The controls each version of the component is judged on.
  judged as materialized (
    select l.defined_component_id, l.control_id
    from public.component_standing_lines(array(select l.defined_component_id from lineage l)) l
    where l.component_assessment_id is not null
  ),
  -- Of those, the ones each element that holds the component inherits (program_element_inheritance)
  -- and its control baseline selects.
  inherit as materialized (
    select distinct i.element_id, i.control_id
    from (select distinct r.program_id from system_rows r) g
    cross join lateral public.program_element_inheritance(
      g.program_id, array(select distinct j.control_id from judged j)) i
    where exists (select 1 from public.system_effective_baselines b
      join public.selected_controls sc on sc.profile_resolution_id = b.profile_resolution_id
      where b.tenant_id = v_tenant and b.system_id = i.element_id and sc.control_id = i.control_id)
  )
  select jsonb_build_object(
    'defined_component_id', p_defined_component_id,
    'component', jsonb_build_object(
      'id', v_component.id, 'name', v_component.name, 'component_type', v_component.component_type,
      'definition_id', v_definition.id, 'definition_code', v_definition.code, 'definition_name', v_definition.name,
      'revision_id', v_revision.id, 'version', v_revision.version_number, 'state', v_revision.state,
      'owner_party_id', public.component_owner_party(p_defined_component_id),
      'definition_owner_party_id', v_definition.owner_party_id, 'business_line_id', v_definition.business_line_id),
    -- The definition's latest published version, and the component of this name in it.
    'latest', case when v_latest.id is null then null else jsonb_build_object(
      'revision_id', v_latest.id, 'version', v_latest.version_number,
      'defined_component_id', (select l.defined_component_id from lineage l
        where l.component_definition_revision_id = v_latest.id order by l.defined_component_id limit 1)) end,
    'products', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'product_id', r.product_id, 'product_code', r.product_code, 'product_name', r.product_name,
        'business_line_id', r.business_line_id,
        'product_revision_id', r.product_revision_id, 'product_version', r.product_version,
        'product_state', r.product_state, 'current', r.is_current,
        'element_id', r.element_id, 'element_code', r.element_code, 'element_name', r.element_name,
        'configurations', r.configurations,
        'defined_component_id', r.defined_component_id, 'version', r.version, 'behind', r.behind,
        'vulnerabilities_open', coalesce((select e.vulnerabilities from exposure e
          where e.defined_component_id = r.defined_component_id), 0)
      ) order by r.product_code, r.product_version desc, r.element_code, r.element_id), '[]'::jsonb)
      from product_rows r),
    'systems', (
      select coalesce(jsonb_agg(x.line order by x.program_code, x.system_code, x.element_code, x.id), '[]'::jsonb)
      from (
        select r.program_code, r.system_code, r.element_code, r.system_component_id as id, jsonb_build_object(
          'program_id', r.program_id, 'program_code', r.program_code, 'program_name', r.program_name,
          'business_line_id', r.business_line_id,
          'system_id', r.system_id, 'system_code', r.system_code, 'system_name', r.system_name,
          'element_id', r.element_id, 'element_code', r.element_code, 'element_name', r.element_name,
          'system_component_id', r.system_component_id, 'component_code', r.component_code,
          'component_name', r.component_name, 'component_version', r.component_version,
          'product_element_id', r.product_element_id,
          'defined_component_id', r.defined_component_id, 'version', r.version, 'behind', r.behind,
          'pin', r.pin,
          'change', r.change, 'change_kinds', coalesce(to_jsonb(r.change_kinds), '[]'::jsonb),
          'change_rationale', r.change_rationale,
          -- The program's own open issues for the findings that stand on the version it took.
          'findings', (select coalesce(jsonb_agg(jsonb_build_object(
              'offer_id', h.offer_id, 'issue_id', h.issue_id, 'title', h.title, 'severity', h.severity,
              'status', h.status, 'opened_at', h.opened_at, 'source', h.source
            ) order by h.opened_at nulls last, h.issue_id), '[]'::jsonb)
            from held h
            where h.program_id = r.program_id and h.defined_component_id = r.defined_component_id and h.open),
          'findings_open', (select count(*) from held h
            where h.program_id = r.program_id and h.defined_component_id = r.defined_component_id and h.open),
          -- The CVEs that affect the version it took.
          'vulnerabilities_open', coalesce((select e.vulnerabilities from exposure e
            where e.defined_component_id = r.defined_component_id), 0),
          -- How many controls the version it took is judged on, and how many of them its element
          -- inherits: those its control baseline selects, on an element the program did not
          -- declare modified and that holds nothing but judged library components.
          'controls_judged', (select count(*) from judged j where j.defined_component_id = r.defined_component_id),
          'controls_inherited', (select count(*) from judged j
            join inherit i on i.element_id = r.element_id and i.control_id = j.control_id
            where j.defined_component_id = r.defined_component_id)) as line
        from system_rows r
        union all
        select r.program_code, r.system_code, r.element_code, r.product_element_id, jsonb_build_object(
          'program_id', r.program_id, 'program_code', r.program_code, 'program_name', r.program_name,
          'business_line_id', r.business_line_id,
          'system_id', r.system_id, 'system_code', r.system_code, 'system_name', r.system_name,
          'element_id', null, 'element_code', r.element_code, 'element_name', r.element_name,
          'system_component_id', null, 'component_code', null,
          'component_name', null, 'component_version', null,
          'product_element_id', r.product_element_id,
          'defined_component_id', r.defined_component_id, 'version', r.version, 'behind', r.behind,
          'pin', null,
          'change', 'removed', 'change_kinds', '[]'::jsonb, 'change_rationale', null,
          'findings', '[]'::jsonb, 'findings_open', 0, 'vulnerabilities_open', 0,
          'controls_judged', (select count(*) from judged j where j.defined_component_id = r.defined_component_id),
          'controls_inherited', 0)
        from removed_rows r
      ) x),
    -- The findings that stand on a version of the component, the newest first.
    'findings', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'offer_id', f.offer_id, 'item_id', f.item_id, 'title', f.title, 'severity', f.severity,
        'defined_component_id', f.defined_component_id, 'version', f.version, 'accepted_at', f.accepted_at,
        'source_program_id', f.source_program_id, 'source_issue_id', f.source_issue_id,
        'programs', (select count(*) from held h where h.item_id = f.item_id),
        'programs_open', (select count(*) from held h where h.item_id = f.item_id and h.open)
      ) order by f.accepted_at desc, f.item_id), '[]'::jsonb)
      from found f),
    'totals', jsonb_build_object(
      'products', (select count(distinct r.product_id) from product_rows r where r.is_current),
      'product_elements', (select count(*) from product_rows),
      'programs', (select count(distinct r.program_id) from system_rows r),
      'systems', (select count(distinct r.system_id) from system_rows r),
      'system_components', (select count(*) from system_rows),
      'behind', (select count(*) from product_rows r where r.is_current and r.behind > 0)
        + (select count(*) from system_rows r where r.behind > 0),
      'modified', (select count(*) from system_rows r where r.change = 'modified'),
      'removed', (select count(*) from removed_rows)),
    -- How many of those findings some program still holds open, and how many offers wait on the
    -- component's owner, for any of its versions.
    'findings_open', (select count(*) from found f
      where exists (select 1 from held h where h.item_id = f.item_id and h.open)),
    'offers_open', (select count(*) from lineage l
      join public.component_offers o
        on o.tenant_id = v_tenant and o.defined_component_id = l.defined_component_id and o.state = 'offered'),
    -- How many CVEs affect the version asked for.
    'vulnerabilities_open', coalesce((select e.vulnerabilities from exposure e
      where e.defined_component_id = p_defined_component_id), 0)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.component_consumers(uuid) from public, anon;
grant execute on function public.component_consumers(uuid) to authenticated;
comment on function public.component_consumers(uuid) is 'Where a library component is used, followed by its name through every version of its definition: each product element pinned to it (its product and version, whether that is the product''s current version, the configurations that include it) and each system component built from it (its program, system and element, its pin in the system''s latest configuration baseline, whether the program declared the inherited element modified), each with the version taken and how many published versions of the definition are newer (behind); a variant that left the element out is listed as removed. Totals count a product by its current version. The component''s owner_party_id is its effective owner, its own (component_owners) else its set''s. The findings that stand on a version of the component (the issues of accepted offers) are listed with how many programs still hold their own issue open, each system line carries the program''s own open issues for the findings on the version it took, and findings_open and offers_open count the findings still open somewhere and the offers that wait on the owner. vulnerabilities_open says how many CVEs affect a component version, those a component of its standing SBOM carries in the state affected: of the version asked for, and on each product and system line of the version it took. Each system line says how many controls the version it took is judged on (controls_judged) and how many of them its element inherits (controls_inherited: those the element''s control baseline selects, where the element inherits the control as program_element_inheritance says, so none on an element declared modified, one that holds a component nobody judged, or one the program left out). Security invoker: a component the reader cannot read is refused.';

create or replace function public.system_upstream(p_system_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_system public.systems;
  v_boundary public.systems;
  v_tenant uuid;
  v_revision public.product_revisions;
  v_product public.products;
  v_configuration public.product_configurations;
  v_latest public.product_revisions;
begin
  select * into v_system from public.systems where id = p_system_id;
  if auth.uid() is null or v_system.id is null then
    raise exception 'System access is required' using errcode = '42501';
  end if;
  v_tenant := v_system.tenant_id;
  select * into v_boundary from public.systems where tenant_id = v_tenant and id = v_system.boundary_system_id;
  if v_boundary.product_configuration_id is not null then
    select * into v_revision from public.product_revisions where tenant_id = v_tenant and id = v_boundary.product_revision_id;
    select * into v_product from public.products where tenant_id = v_tenant and id = v_revision.product_id;
    select * into v_configuration from public.product_configurations where tenant_id = v_tenant and id = v_boundary.product_configuration_id;
    select * into v_latest from public.product_revisions r
      where r.tenant_id = v_tenant and r.product_id = v_revision.product_id and r.state = 'published'
      order by r.version_number desc limit 1;
  end if;
  with recursive
  -- The elements the answer covers: the whole boundary, or one element and what is inside it.
  scope as (
    select s.id from public.systems s where s.tenant_id = v_tenant and s.id = p_system_id
    union all
    select s.id from public.systems s join scope p on s.parent_system_id = p.id where s.tenant_id = v_tenant
  ),
  used as materialized (
    select sc.id as system_component_id, sc.code, sc.name, sc.version as component_version,
      e.id as element_id, e.code as element_code, e.name as element_name, e.product_element_id,
      case
        when e.product_change_kinds is not null then 'modified'
        when e.product_element_id is not null then 'inherited'
      end as change,
      e.product_change_kinds as change_kinds,
      dc.id as defined_component_id, dc.name as component_name, dc.component_type,
      r.id as revision_id, r.version_number as version,
      d.id as definition_id, d.code as definition_code, d.name as definition_name,
      coalesce(named.owner_party_id, d.owner_party_id) as owner_party_id,
      d.owner_party_id as definition_owner_party_id, d.business_line_id,
      newest.id as latest_revision_id, newest.version_number as latest_version,
      (select count(*) from public.component_definition_revisions n
        where n.tenant_id = v_tenant and n.component_definition_id = d.id
          and n.state = 'published' and n.version_number > r.version_number) as behind,
      pin.pin
    from public.system_components sc
    -- The element a component sits on: the one it names, else the one a single inventory
    -- relationship gives it (system_component_element_links), else its system.
    left join public.system_component_element_links k on k.tenant_id = v_tenant and k.id = sc.id
    join public.systems e on e.tenant_id = v_tenant and e.id = coalesce(k.system_element_id, sc.system_id)
    join public.defined_components dc on dc.tenant_id = v_tenant and dc.id = sc.defined_component_id
    join public.component_definition_revisions r on r.tenant_id = v_tenant and r.id = dc.component_definition_revision_id
    join public.component_definitions d on d.tenant_id = v_tenant and d.id = r.component_definition_id
    -- The component's own owner, where one is named over its set's.
    left join public.component_owners named
      on named.tenant_id = v_tenant and named.component_definition_id = d.id and named.component_name = dc.name
    left join lateral (
      select n.id, n.version_number from public.component_definition_revisions n
      where n.tenant_id = v_tenant and n.component_definition_id = d.id and n.state = 'published'
      order by n.version_number desc limit 1
    ) newest on true
    left join lateral (
      select jsonb_build_object(
        'configuration_baseline_id', cb.id, 'name', cb.name, 'baseline_version', cb.version_number,
        'state', cb.state, 'version', cp.version) as pin
      from public.component_pins cp
      join public.configuration_baselines cb on cb.tenant_id = cp.tenant_id and cb.id = cp.configuration_baseline_id
      where cp.tenant_id = v_tenant and cp.system_component_id = sc.id
      order by (cb.state = 'published') desc, cb.version_number desc, cb.id limit 1
    ) pin on true
    where sc.tenant_id = v_tenant and sc.system_id = v_boundary.id
      and e.id in (select id from scope)
  ),
  stands as materialized (
    select l.defined_component_id, l.control_id, l.status, l.component_assessment_id
    from public.component_standing_lines(array(select distinct u.defined_component_id from used u)) l
  ),
  standing as materialized (
    select l.defined_component_id,
      count(*) as controls,
      count(*) filter (where l.status = 'satisfied') as satisfied,
      count(*) filter (where l.status = 'partially_satisfied') as partially_satisfied,
      count(*) filter (where l.status = 'other_than_satisfied') as other_than_satisfied,
      count(*) filter (where l.status = 'not_assessed') as not_assessed
    from stands l
    group by l.defined_component_id
  ),
  -- The controls each version taken is judged on.
  judged as materialized (
    select l.defined_component_id, l.control_id from stands l where l.component_assessment_id is not null
  ),
  -- Of those, the ones each element inherits from what sits on it (program_element_inheritance)
  -- and its control baseline selects.
  inherit as materialized (
    select distinct i.element_id, i.control_id
    from public.program_element_inheritance(
      v_system.program_id, array(select distinct j.control_id from judged j)) i
    where i.element_id in (select u.element_id from used u)
      and exists (select 1 from public.system_effective_baselines b
        join public.selected_controls sc on sc.profile_resolution_id = b.profile_resolution_id
        where b.tenant_id = v_tenant and b.system_id = i.element_id and sc.control_id = i.control_id)
  ),
  -- The program's own open issues for the findings that stand on the versions it took.
  held as materialized (
    select o.defined_component_id, o.id as offer_id, k.issue_id, k.source,
      x.title, x.severity, x.status, x.opened_at
    from public.component_offers o
    join public.component_offer_issues k
      on k.tenant_id = v_tenant and k.component_offer_id = o.id and k.program_id = v_system.program_id
    join public.operational_issues x on x.tenant_id = v_tenant and x.id = k.issue_id
    where o.tenant_id = v_tenant and o.kind = 'finding' and o.state = 'accepted'
      and o.defined_component_id in (select u.defined_component_id from used u)
      and x.status not in ('resolved', 'closed')
  ),
  -- The offers that wait on the owner of each version taken, whoever made them.
  waiting as materialized (
    select o.defined_component_id, count(*) as offers
    from public.component_offers o
    where o.tenant_id = v_tenant and o.state = 'offered'
      and o.defined_component_id in (select u.defined_component_id from used u)
    group by o.defined_component_id
  ),
  -- The CVEs that affect each version taken, through its standing SBOM.
  exposure as materialized (
    select x.defined_component_id, x.vulnerability_id
    from public.component_open_vulnerabilities(array(select distinct u.defined_component_id from used u)) x
  )
  select jsonb_build_object(
    'system_id', p_system_id,
    'boundary_system_id', v_boundary.id,
    'program_id', v_system.program_id,
    'product', case when v_boundary.product_configuration_id is null then null else jsonb_build_object(
      'id', v_product.id, 'code', v_product.code, 'name', v_product.name,
      'business_line_id', v_product.business_line_id,
      'revision_id', v_revision.id, 'version', v_revision.version_number,
      'configuration_id', v_configuration.id, 'configuration_code', v_configuration.code,
      'configuration', v_configuration.name,
      'latest_revision_id', v_latest.id, 'latest_version', v_latest.version_number,
      'behind', (select count(*) from public.product_revisions r
        where r.tenant_id = v_tenant and r.product_id = v_revision.product_id and r.state = 'published'
          and r.version_number > v_revision.version_number)) end,
    'components', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'system_component_id', u.system_component_id, 'code', u.code, 'name', u.name,
        'component_version', u.component_version,
        'element_id', u.element_id, 'element_code', u.element_code, 'element_name', u.element_name,
        'product_element_id', u.product_element_id,
        'change', u.change, 'change_kinds', coalesce(to_jsonb(u.change_kinds), '[]'::jsonb),
        'defined_component_id', u.defined_component_id, 'component_name', u.component_name,
        'component_type', u.component_type,
        'definition_id', u.definition_id, 'definition_code', u.definition_code, 'definition_name', u.definition_name,
        'owner_party_id', u.owner_party_id, 'definition_owner_party_id', u.definition_owner_party_id,
        'business_line_id', u.business_line_id,
        'revision_id', u.revision_id, 'version', u.version,
        'latest_revision_id', u.latest_revision_id, 'latest_version', u.latest_version,
        'behind', u.behind, 'pin', u.pin,
        'standing', jsonb_build_object(
          'controls', coalesce(s.controls, 0), 'satisfied', coalesce(s.satisfied, 0),
          'partially_satisfied', coalesce(s.partially_satisfied, 0),
          'other_than_satisfied', coalesce(s.other_than_satisfied, 0),
          'not_assessed', coalesce(s.not_assessed, 0)),
        -- How many controls the version taken is judged on, and how many of them its element
        -- inherits: those its control baseline selects, on an element the program did not declare
        -- modified and that holds nothing but judged library components.
        'controls_judged', (select count(*) from judged j where j.defined_component_id = u.defined_component_id),
        'controls_inherited', (select count(*) from judged j
          join inherit i on i.element_id = u.element_id and i.control_id = j.control_id
          where j.defined_component_id = u.defined_component_id),
        'findings', (select coalesce(jsonb_agg(jsonb_build_object(
            'offer_id', h.offer_id, 'issue_id', h.issue_id, 'title', h.title, 'severity', h.severity,
            'status', h.status, 'opened_at', h.opened_at, 'source', h.source
          ) order by h.opened_at nulls last, h.issue_id), '[]'::jsonb)
          from held h where h.defined_component_id = u.defined_component_id),
        'findings_open', (select count(*) from held h where h.defined_component_id = u.defined_component_id),
        'offers_open', coalesce((select w.offers from waiting w where w.defined_component_id = u.defined_component_id), 0),
        'vulnerabilities_open', (select count(*) from exposure e where e.defined_component_id = u.defined_component_id)
      ) order by public.natural_sort_key(u.element_code) collate "C", public.natural_sort_key(u.code) collate "C", u.system_component_id), '[]'::jsonb)
      from used u left join standing s on s.defined_component_id = u.defined_component_id),
    'totals', jsonb_build_object(
      'components', (select count(*) from used),
      'behind', (select count(*) from used u where u.behind > 0),
      'modified', (select count(*) from used u where u.change = 'modified'),
      'assessed', (select count(*) from used u join standing s on s.defined_component_id = u.defined_component_id
        where s.controls > s.not_assessed),
      -- Each control once: those some version taken is judged on, and those some element inherits.
      'controls_judged', (select count(distinct j.control_id) from judged j),
      'controls_inherited', (select count(distinct i.control_id) from inherit i)),
    -- The program's open issues for findings that stand on what the system takes, each once, and
    -- the offers that wait on the owners of those versions.
    'findings_open', (select count(distinct h.issue_id) from held h),
    'offers_open', (select coalesce(sum(w.offers), 0) from waiting w),
    -- The CVEs that affect what the system takes, each once.
    'vulnerabilities_open', (select count(distinct e.vulnerability_id) from exposure e)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.system_upstream(uuid) from public, anon;
grant execute on function public.system_upstream(uuid) to authenticated;
comment on function public.system_upstream(uuid) is 'What a system takes from above: for a system created from a product, the product, the version and configuration it was created from and the newest published version; and each library component the system (an authorization boundary whole, or one element and what is inside it) is built from, with the version taken, the latest published version of its definition, how many published versions it is behind, whether the program declared the inherited element modified, its pin in the latest configuration baseline, the component''s standing as component_control_status counts it, its effective owner (its own, else its set''s), the program''s own open issues for the findings that stand on the version taken (the issues of accepted offers) how many offers wait on that version''s owner and how many CVEs affect the version taken (vulnerabilities_open: those a component of its standing SBOM carries in the state affected), which the answer also counts across what the system takes, each CVE once. Each component says how many controls the version taken is judged on (controls_judged) and how many of them its element inherits (controls_inherited: those the element''s control baseline selects, where the element inherits the control as program_element_inheritance says), and the totals count each such control once. Security invoker: a system the reader cannot read is refused.';
