-- Every system counts: a control is covered only once it is covered on every system that selects it.
--
-- Where a program stands on a control pooled its requirements' mappings: a mapping on one system
-- covered the control, or an objective of it, for the whole program, so a control mapped on some of
-- the systems whose control baseline selects it read as having a requirement while the other
-- systems' SSPs list none under it. A control, and each objective it counts, is now covered only
-- once it is covered on every such system, and evidenced only once, on every such system, a
-- requirement that cites evidence covers it (Josef, 2026-11-13: "Every system counts").
--
-- The systems a control is counted on are the program's authorization boundaries, the systems that
-- hold an SSP, whose effective control baseline selects it: system_effective_baselines, the
-- baseline Map a requirement reads when it says "Not selected on its systems". An element is part of
-- its boundary's system rather than a system of its own: a mapping on it counts on its boundary,
-- whose SSP lists it under the control. The elements are not each counted, since every one inherits
-- its boundary's baseline and a control is met by the elements its requirements are allocated to,
-- not by all of them (each of WS-X90's 27 elements would otherwise need a mapping of every control,
-- its subsystems and the boundary's own row among them).
--
--   a mapping that names a system        counts on that system's boundary
--   a mapping that names no system       counts on every system, as it always counted: the catalog
--                                        references of September (REQ-0042 and its parts) and the
--                                        demo seed's mappings, which name no system
--   a control no system of the program   is covered as before, by any mapping of the program's
--   selects, or a program with none      requirements: nothing is left at No requirement for want of
--                                        a system to map it on
--
-- A control the catalog gives no objective is counted as one target on each system, the control
-- itself. Determinations decide as before (an assessor's latest published one, else the product's
-- where every variant inherits the control): only No requirement, No evidence and Not assessed are
-- counted anew.
--
--   program_control_objective_cover   internal: each objective a control counts, or the control
--                                     itself where it counts none, on each system that selects the
--                                     control, once with each requirement that covers it there and
--                                     whether that requirement cites evidence, and once with no
--                                     requirement where none does. Its answer gains the system and
--                                     the whole-control rows, so it is dropped and created again,
--                                     and every read over it is created again from its current
--                                     definition, counting per system
--   program_control_status_lines      climbs the ladder by what is covered on every system, so
--                                     program_control_status and the daily posture snapshots follow
--   program_control_objectives        one control's objectives, each with the systems it is covered
--                                     on; the systems that select the control, each with what is
--                                     covered there and how many of the program's requirements are
--                                     allocated there; and the requirements that cover it, each
--                                     with whether it owes evidence: what the control's next step
--                                     and its Map a requirement say of each system
--   risk_threats,                     count a control's objectives mapped as its status counts them
--   control_objective_counts
--   program_requirement_rows          gains allocated_boundaries, the systems a requirement's latest
--                                     revision is allocated in, which Map a requirement filters by

-- ---------------------------------------------------------------------------------------------
-- Which of the program's requirements cover each target of the named controls, on each system.
-- ---------------------------------------------------------------------------------------------
drop function if exists public.program_control_objective_cover(uuid, uuid[]);
create function public.program_control_objective_cover(p_program_id uuid, p_control_ids uuid[])
returns table (control_id uuid, objective_id uuid, system_id uuid, requirement_id uuid, evidenced boolean)
language plpgsql stable security invoker set search_path = '' as $$
#variable_conflict use_column
begin
  -- A program the caller cannot read is refused, never answered as covering nothing.
  if not exists (select 1 from public.programs p where p.id = p_program_id) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  return query
  with recursive
  control as materialized (
    select distinct c.id from unnest(p_control_ids) c(id) where c.id is not null
  ),
  objective as materialized (
    select cp.id, cp.control_id, cp.parent_part_id, cp.prose
    from public.control_parts cp
    where cp.name = 'assessment-objective' and cp.control_id = any(p_control_ids)
  ),
  -- The objectives a control counts: its leaves, with no objective under them, and each heading
  -- that prints a sentence of its own besides the objectives under it.
  counted as materialized (
    select o.id, o.control_id
    from objective o
    where not exists (select 1 from objective c where c.parent_part_id = o.id)
      or public.objective_prints_own_sentence(o.prose)
  ),
  -- What is counted of each control: each objective it counts, or the control itself (no
  -- objective) where it counts none. target_id names either: the objective's id, or the control's.
  target as materialized (
    select k.control_id, k.id as objective_id, k.id as target_id
    from counted k
    union all
    select c.id, null::uuid, c.id
    from control c
    where not exists (select 1 from counted k where k.control_id = c.id)
  ),
  -- Each counted objective with itself and every objective above it, since a mapping that names
  -- any of them covers it. Sixteen levels bound a broken chain; the catalog nests four.
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
  -- The systems each control is counted on: the program's authorization boundaries whose
  -- effective control baseline selects it, as Map a requirement reads a system's baseline.
  carrier as materialized (
    select distinct sc.control_id, s.id as system_id
    from public.systems s
    join public.system_effective_baselines b on b.tenant_id = s.tenant_id and b.system_id = s.id
    join public.selected_controls sc on sc.profile_resolution_id = b.profile_resolution_id
    where s.program_id = p_program_id and s.is_authorization_boundary
      and sc.control_id = any(p_control_ids)
  ),
  -- Where each target is counted: on each system that selects its control, or once on no system
  -- where none does, which any mapping of the program's requirements covers, as before.
  place as materialized (
    select t.control_id, t.objective_id, t.target_id, c.system_id
    from target t
    join carrier c on c.control_id = t.control_id
    union all
    select t.control_id, t.objective_id, t.target_id, null::uuid
    from target t
    where not exists (select 1 from carrier c where c.control_id = t.control_id)
  ),
  -- The program's requirements whose latest revision maps one of the controls, the objective each
  -- mapping names (none where it maps the whole control, or names a statement, an item or a part
  -- that is not one of the control's objectives, which cover the whole control) and the system it
  -- counts on: the boundary of the system it names, or every system where it names none.
  met as materialized (
    select distinct l.control_id, q.id as requirement_id, v.id as revision_id,
      case when cp.name = 'assessment-objective' and cp.control_id = l.control_id
        then l.control_part_id end as objective_id,
      l.system_id is null as everywhere,
      ms.boundary_system_id as boundary_id
    from public.requirement_control_links l
    join public.requirement_revisions v on v.tenant_id = l.tenant_id and v.id = l.requirement_revision_id
    join public.engineering_requirements q on q.tenant_id = v.tenant_id and q.id = v.engineering_requirement_id
    left join public.control_parts cp on cp.id = l.control_part_id
    left join public.systems ms on ms.tenant_id = l.tenant_id and ms.id = l.system_id
    where q.program_id = p_program_id
      and l.control_id = any(p_control_ids)
      and v.version_number = (select max(x.version_number) from public.requirement_revisions x
        where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)
  ),
  evidenced as materialized (
    select distinct m.requirement_id
    from met m
    join public.requirement_evidence re on re.requirement_revision_id = m.revision_id
    join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
  ),
  -- Which requirements cover each target, and where: a mapping of the whole control covers every
  -- target of it, and one that names an objective the objectives at and under it. Two hash joins,
  -- never a test of every mapping against every objective.
  covered as materialized (
    select t.target_id, m.requirement_id, m.everywhere, m.boundary_id
    from target t
    join met m on m.control_id = t.control_id and m.objective_id is null
    union
    select r.counted_id, m.requirement_id, m.everywhere, m.boundary_id
    from reach r
    join met m on m.objective_id = r.part_id
  )
  select distinct p.control_id, p.objective_id, p.system_id, c.requirement_id,
    e.requirement_id is not null
  from place p
  left join covered c on c.target_id = p.target_id
    and (p.system_id is null or c.everywhere or c.boundary_id = p.system_id)
  left join evidenced e on e.requirement_id = c.requirement_id;
end; $$;
revoke all on function public.program_control_objective_cover(uuid, uuid[]) from public, anon;
grant execute on function public.program_control_objective_cover(uuid, uuid[]) to authenticated;
comment on function public.program_control_objective_cover(uuid, uuid[]) is 'Internal: each target of the named controls (each assessment objective a control counts, a leaf or a heading that prints a sentence of its own, or, objective_id null, the control itself where it counts none) on each system it is counted on, once with each of the program''s requirements whose latest revision covers it there and whether that requirement cites evidence, and once with no requirement where none does. A control is counted on each of the program''s authorization boundaries whose effective control baseline selects it (system_id); where none does, once with no system, covered by any mapping. A mapping covers the objective it names and every objective under it, or the whole control where it names no part, a statement or an item; it counts on the boundary of the system it names, or on every system where it names none. A target is mapped once covered on every system, and evidenced once covered on every system by a requirement that cites evidence. Security invoker: a program the caller cannot read is refused. program_control_status_lines, program_control_objectives, risk_threats and control_objective_counts read it.';

-- ---------------------------------------------------------------------------------------------
-- One line a control of a program's control baseline, as program_control_status counts it: the
-- body of 20261114030116_objective_level_derivation, with each target counted on every system.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_control_status_lines(p_program_id uuid)
returns table (
  id uuid, code text, title text, parent_control_id uuid, code_order text,
  family text, family_title text, requirements bigint, evidenced bigint,
  status text, determined_by text, product_assessments jsonb,
  objectives bigint, objectives_mapped bigint, objectives_evidenced bigint
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
  -- The program's requirements whose latest revision maps each control.
  met as materialized (
    select distinct l.control_id, q.id as requirement_id, v.id as revision_id
    from public.requirement_control_links l
    join public.requirement_revisions v on v.tenant_id = l.tenant_id and v.id = l.requirement_revision_id
    join public.engineering_requirements q on q.tenant_id = v.tenant_id and q.id = v.engineering_requirement_id
    where q.program_id = p_program_id
      and l.control_id in (select control_id from selected)
      and v.version_number = (select max(x.version_number) from public.requirement_revisions x
        where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)
  ),
  evidenced as materialized (
    select distinct m.requirement_id
    from met m
    join public.requirement_evidence re on re.requirement_revision_id = m.revision_id
    join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
  ),
  -- Each target on each system: covered there, and covered there by a requirement that cites
  -- evidence. One read of every control, never a read a control.
  spot as materialized (
    select o.control_id, o.objective_id, o.system_id,
      bool_or(o.requirement_id is not null) as covered,
      bool_or(o.evidenced) as evidenced
    from public.program_control_objective_cover(p_program_id, array(select s.control_id from selected s)) o
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
  -- The latest determination on each part of a control, in a published results revision of one
  -- of the program's campaigns.
  judged as materialized (
    select distinct on (f.target_control_part_id) cp.control_id, f.determination
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
      and cp.control_id in (select control_id from selected)
    order by f.target_control_part_id, f.determined_at desc nulls last, f.created_at desc, f.id desc
  ),
  worst as (
    select j.control_id,
      bool_or(j.determination = 'other_than_satisfied') as other_than,
      bool_or(j.determination = 'partially_satisfied') as partially,
      bool_or(j.determination = 'satisfied') as satisfied
    from judged j
    group by j.control_id
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
      v.delta->'assessment'->>'title' as assessment_title
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
      end as determination
    from inherits i
    where i.control_id in (select control_id from whole)
    group by i.control_id, i.assessment_id
  ),
  product as (
    select b.control_id,
      bool_or(b.determination = 'other_than_satisfied') as other_than,
      bool_or(b.determination = 'partially_satisfied') as partially,
      jsonb_agg(jsonb_build_object('id', b.assessment_id, 'title', b.title, 'determination', b.determination)
        order by case b.determination when 'other_than_satisfied' then 0 when 'partially_satisfied' then 1 else 2 end,
          b.position, b.assessment_id) as assessments
    from behind b
    group by b.control_id
  ),
  -- Joined and grouped, never asked once a control: the session's row-level security is checked
  -- on every row a subquery reads, and a subquery a control reads its tables 546 times over.
  counted as (
    select s.control_id,
      count(distinct m.requirement_id) as requirements,
      count(distinct m.requirement_id) filter (where e.requirement_id is not null) as evidenced
    from selected s
    left join met m on m.control_id = s.control_id
    left join evidenced e on e.requirement_id = m.requirement_id
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
        when w.satisfied then 'satisfied'
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
      coalesce(o.evidenced, 0) as objectives_evidenced
    from counted n
    join public.controls k on k.id = n.control_id
    left join public.catalog_groups g on g.id = k.group_id
    left join worst w on w.control_id = n.control_id
    left join product d on d.control_id = n.control_id
    left join coverage o on o.control_id = n.control_id
  )
  select l.id, l.code, l.title, l.parent_control_id, l.code_order, l.family, l.family_title,
    l.requirements, l.evidenced, l.status, l.determined_by, l.product_assessments,
    l.objectives, l.objectives_mapped, l.objectives_evidenced
  from line l;
end; $$;
revoke all on function public.program_control_status_lines(uuid) from public, anon;
grant execute on function public.program_control_status_lines(uuid) to authenticated;
comment on function public.program_control_status_lines(uuid) is 'Internal: one line a control of a program''s control baseline, as program_control_status answers it (its status, the requirements that map it and how many cite evidence, its assessment objectives with how many are mapped and how many evidenced, whose determination and the product assessments behind a product''s), asking nothing of who calls but that row-level security lets them read the program. A target (each objective, or the control itself where it counts none) is mapped once covered on every system of the program whose control baseline selects the control, and evidenced once covered on every one by a requirement that cites evidence (program_control_objective_cover); a control leaves no requirement once every target is mapped and no evidence once every one is evidenced. Security invoker. program_control_status and the posture snapshots count from it.';

comment on function public.program_control_status(uuid) is 'One status for each control of a program''s control baseline: the worst of the latest determinations an assessor of the program published on its parts; else, where every product variant of the program inherits the control with a determination, the worst of the product''s determinations; else not assessed, no evidence or no requirement, counted on every system of the program whose control baseline selects the control (each of its authorization boundaries that does; the program as a whole where none does): no requirement until every objective of the control (the control itself, for one with none) is covered on every such system, no evidence until each is covered on every one by a requirement that cites evidence. Each control says whose determination its status is (determined_by: program or product) and the product assessments behind a product''s, with the program''s requirements that map it and how many of them cite evidence, and its objectives (objectives), how many are covered on every system (objectives_mapped) and how many with evidence on every one (objectives_evidenced). Security invoker: a program the reader cannot read is refused. The lines are program_control_status_lines''s, which the posture snapshots count too.';

-- ---------------------------------------------------------------------------------------------
-- One control's objectives and systems, as a program stands on each.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_control_objectives(p_program_id uuid, p_control_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare answer jsonb;
begin
  if auth.uid() is null or p_control_id is null
    or not exists (select 1 from public.programs p where p.id = p_program_id) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  with recursive
  part as materialized (
    select cp.id, cp.parent_part_id, cp.ordinal, cp.prose,
      (select x->>'value' from jsonb_array_elements(cp.props) x where x->>'name' = 'label' limit 1) as label
    from public.control_parts cp
    where cp.control_id = p_control_id and cp.name = 'assessment-objective'
  ),
  -- Each objective's place in the catalog's reading order (its position under every objective
  -- above it) and the objectives above it, from the root down.
  place as (
    select p.id, array[p.ordinal] as path, array[]::uuid[] as ancestors, 1 as depth
    from part p
    where p.parent_part_id is null
    union all
    select c.id, pl.path || c.ordinal, pl.ancestors || pl.id, pl.depth + 1
    from part c
    join place pl on c.parent_part_id = pl.id
    where pl.depth < 16
  ),
  cover as materialized (
    select o.objective_id, o.system_id, o.requirement_id, o.evidenced
    from public.program_control_objective_cover(p_program_id, array[p_control_id]) o
  ),
  -- Each target (an objective, or the control itself where it counts none) on each system:
  -- covered there, and covered there by a requirement that cites evidence.
  spot as materialized (
    select c.objective_id, c.system_id,
      bool_or(c.requirement_id is not null) as mapped,
      bool_or(c.evidenced) as evidenced
    from cover c
    group by c.objective_id, c.system_id
  ),
  standing as (
    select s.objective_id,
      bool_and(s.mapped) as mapped,
      bool_and(s.evidenced) as evidenced,
      coalesce(array_agg(s.system_id order by s.system_id)
        filter (where s.mapped and s.system_id is not null), '{}') as mapped_on
    from spot s
    where s.objective_id is not null
    group by s.objective_id
  ),
  -- The systems that select the control, each with what is covered there.
  system as (
    select s.system_id as id, y.code, y.name,
      bool_and(s.mapped) as mapped,
      bool_and(s.evidenced) as evidenced,
      count(s.objective_id) filter (where s.mapped) as objectives_mapped,
      count(s.objective_id) filter (where s.evidenced) as objectives_evidenced
    from spot s
    join public.systems y on y.id = s.system_id
    group by s.system_id, y.code, y.name
  ),
  -- How many of the program's requirements, at their latest revision, are allocated in each of
  -- them (to it, or to a system inside it whose control baseline selects the control): those a
  -- mapping on it can be recorded for.
  allocated as (
    select y.boundary_system_id as system_id, count(distinct q.id) as requirements
    from public.requirement_allocations a
    join public.systems y on y.tenant_id = a.tenant_id and y.id = a.system_id
    join public.system_effective_baselines b on b.tenant_id = y.tenant_id and b.system_id = y.id
    join public.selected_controls sc
      on sc.profile_resolution_id = b.profile_resolution_id and sc.control_id = p_control_id
    join public.requirement_revisions v on v.tenant_id = a.tenant_id and v.id = a.requirement_revision_id
    join public.engineering_requirements q on q.tenant_id = v.tenant_id and q.id = v.engineering_requirement_id
    where y.program_id = p_program_id
      and y.boundary_system_id in (select s.id from system s)
      and v.version_number = (select max(x.version_number) from public.requirement_revisions x
        where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)
    group by y.boundary_system_id
  ),
  -- The requirements that cover the control somewhere it is counted, each with whether it cites
  -- evidence and whether it owes some: it cites none and covers a target on a system where no
  -- requirement that cites evidence covers it.
  covering as (
    select c.requirement_id,
      bool_or(c.evidenced) as evidenced,
      bool_or(not c.evidenced and not s.evidenced) as owes
    from cover c
    join spot s on s.objective_id is not distinct from c.objective_id
      and s.system_id is not distinct from c.system_id
    where c.requirement_id is not null
    group by c.requirement_id
  )
  select jsonb_build_object(
    'program_id', p_program_id,
    'control_id', p_control_id,
    'systems', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'code', s.code, 'name', s.name,
        'mapped', s.mapped, 'evidenced', s.evidenced,
        'objectives_mapped', s.objectives_mapped, 'objectives_evidenced', s.objectives_evidenced,
        'allocated', coalesce(a.requirements, 0)
      ) order by public.natural_sort_key(s.code) collate "C", s.id)
      from system s
      left join allocated a on a.system_id = s.id), '[]'::jsonb),
    'objectives', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'label', p.label, 'prose', p.prose, 'ancestors', to_jsonb(pl.ancestors),
        'mapped', s.mapped, 'evidenced', s.evidenced, 'mapped_on', to_jsonb(s.mapped_on)
      ) order by pl.path, p.id)
      from standing s
      join part p on p.id = s.objective_id
      join place pl on pl.id = p.id), '[]'::jsonb),
    'requirements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', q.id, 'code', q.code, 'evidenced', c.evidenced, 'owes', c.owes
      ) order by public.natural_sort_key(q.code) collate "C", q.id)
      from covering c
      join public.engineering_requirements q on q.id = c.requirement_id), '[]'::jsonb)
  ) into answer;
  return answer;
end; $$;
revoke all on function public.program_control_objectives(uuid, uuid) from public, anon;
grant execute on function public.program_control_objectives(uuid, uuid) to authenticated;
comment on function public.program_control_objectives(uuid, uuid) is 'Where a program stands on one control, target by target and system by system. objectives: the assessment objectives the control counts (its leaf objectives, and each heading that prints a sentence of its own, which comes before the objectives under it), in the catalog''s reading order, each with its label (AC-02a.[01]), its text, the objectives above it, whether it is covered on every system that selects the control (mapped) and with evidence on every one (evidenced), and the systems it is covered on (mapped_on); none for a control with no objective. systems: the program''s authorization boundaries whose control baseline selects the control, in code order, each with whether every target is covered there (mapped) and with evidence (evidenced), how many objectives are covered and evidenced there, and how many of the program''s requirements, at their latest revision, are allocated there (allocated: to it, or to a system inside it whose baseline selects the control); none where no system selects it, whose objectives are covered by any mapping. requirements: the program''s requirements that cover the control where it is counted, each with whether it cites evidence (evidenced) and whether it owes some (owes: it cites none and covers a target on a system where no requirement that cites evidence covers it). Counted as program_control_status counts (program_control_objective_cover). Security invoker: a program the reader cannot read is refused.';

-- ---------------------------------------------------------------------------------------------
-- One control's objectives, counted in each of the programs named: the catalog control's table.
-- The body of 20261114051138_objective_counts_on_screens, counting each objective on every system.
-- ---------------------------------------------------------------------------------------------
create or replace function public.control_objective_counts(p_control_id uuid, p_program_ids uuid[])
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare answer jsonb;
begin
  if auth.uid() is null then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  if p_control_id is null then
    raise exception 'Name the control' using errcode = '22023';
  end if;
  -- A program the reader cannot read is refused, never answered as covering nothing.
  if exists (select 1 from unnest(coalesce(p_program_ids, '{}')) w(id)
      where not exists (select 1 from public.programs p where p.id = w.id)) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  with
  program as (
    select distinct w.id from unnest(coalesce(p_program_ids, '{}')) w(id)
  ),
  -- Each objective of the control in each program, on each system it is counted on.
  spot as (
    select p.id as program_id, o.objective_id, o.system_id,
      bool_or(o.requirement_id is not null) as covered,
      bool_or(o.evidenced) as evidenced
    from program p
    cross join lateral public.program_control_objective_cover(p.id, array[p_control_id]) o
    where o.objective_id is not null
    group by p.id, o.objective_id, o.system_id
  ),
  -- Each program's coverage of the control, counted as its control status counts it: an objective
  -- mapped once covered on every system, and evidenced once evidenced on every one.
  counted as (
    select t.program_id,
      count(*) as objectives,
      count(*) filter (where t.mapped) as mapped,
      count(*) filter (where t.evidenced) as evidenced
    from (
      select s.program_id, s.objective_id, bool_and(s.covered) as mapped, bool_and(s.evidenced) as evidenced
      from spot s
      group by s.program_id, s.objective_id
    ) t
    group by t.program_id
  )
  select jsonb_build_object(
    'control_id', p_control_id,
    'programs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'program_id', p.id,
        'objectives', coalesce(k.objectives, 0),
        'objectives_mapped', coalesce(k.mapped, 0),
        'objectives_evidenced', coalesce(k.evidenced, 0)
      ) order by p.id)
      from program p
      left join counted k on k.program_id = p.id), '[]'::jsonb)
  ) into answer;
  return answer;
end; $$;
revoke all on function public.control_objective_counts(uuid, uuid[]) from public, anon;
grant execute on function public.control_objective_counts(uuid, uuid[]) to authenticated;
comment on function public.control_objective_counts(uuid, uuid[]) is 'One control''s assessment objectives counted in each program named, for the catalog control''s table of the workspace''s programs: objectives (how many the control counts: its leaves and each heading that prints a sentence of its own), objectives_mapped (how many the program''s requirements, at their latest revision, cover on every system of the program whose control baseline selects the control) and objectives_evidenced (how many are covered on every one by a requirement that cites evidence), counted as program_control_status counts them (program_control_objective_cover). A control with no objective counts none. Security invoker: a program the reader cannot read is refused.';

-- ---------------------------------------------------------------------------------------------
-- A program's requirements as its register reads them, with the systems each is allocated in: the
-- view as it stands, with allocated_boundaries last, so Map a requirement filters by a system and
-- the server pages within it.
-- ---------------------------------------------------------------------------------------------
create or replace view public.program_requirement_rows with (security_invoker = true) as
 WITH parents AS MATERIALIZED (
         SELECT jsonb_object_agg(links.child::text, jsonb_build_array(links.parent, links.parents)) AS map
           FROM ( SELECT cr.engineering_requirement_id AS child,
                    (array_agg(DISTINCT pr.engineering_requirement_id))[1] AS parent,
                    count(DISTINCT pr.engineering_requirement_id) AS parents
                   FROM requirement_decompositions d
                     JOIN requirement_revisions cr ON cr.id = d.child_requirement_revision_id
                     JOIN requirement_revisions pr ON pr.id = d.parent_requirement_revision_id
                  GROUP BY cr.engineering_requirement_id) links
        )
 SELECT r.id,
    r.tenant_id,
    r.program_id,
    r.code,
    natural_sort_key(r.code) COLLATE "C" AS code_order,
    latest.id AS revision_id,
    latest.version_number,
    latest.title,
    latest.statement,
    latest.requirement_type,
    latest.owner_party_id,
    owner.name AS owner_name,
        CASE
            WHEN latest.id IS NULL THEN 'Details not recorded'::text
            WHEN allocated.names IS NOT NULL THEN 'Allocated'::text
            ELSE 'Unallocated'::text
        END AS allocation,
        CASE
            WHEN latest.id IS NULL THEN 'Details not recorded'::text
            WHEN linked.needs_review THEN 'Needs review'::text
            WHEN linked.labels IS NOT NULL THEN 'Control linked'::text
            ELSE 'No control linked'::text
        END AS control_mapping,
    COALESCE(allocated.list, '[]'::jsonb) AS allocations,
    allocated.names AS allocated_to,
    COALESCE(linked.list, '[]'::jsonb) AS control_sources,
    linked.labels AS linked_controls,
    tree.parent_id,
    COALESCE(tree.ancestors, '{}'::uuid[]) AS ancestors,
    COALESCE(cardinality(tree.ancestors), 0) AS depth,
    tree.tree_order,
    tree.unstructured,
    COALESCE(allocated.boundaries, '{}'::uuid[]) AS allocated_boundaries
   FROM engineering_requirements r
     CROSS JOIN parents
     LEFT JOIN LATERAL ( SELECT v.id,
            v.version_number,
            v.title,
            v.statement,
            v.requirement_type,
            v.owner_party_id
           FROM requirement_revisions v
          WHERE v.tenant_id = r.tenant_id AND v.engineering_requirement_id = r.id
          ORDER BY v.version_number DESC
         LIMIT 1) latest ON true
     LEFT JOIN parties owner ON owner.id = latest.owner_party_id
     LEFT JOIN LATERAL ( SELECT jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'kind', t.kind, 'system_id', t.system_id, 'rationale', t.rationale) ORDER BY t.name, t.id) AS list,
            string_agg(t.name, ', '::text ORDER BY t.name, t.id) AS names,
            array_agg(DISTINCT t.boundary_id) FILTER (WHERE t.boundary_id IS NOT NULL) AS boundaries
           FROM ( SELECT a.id,
                    a.rationale,
                    s.id AS system_id,
                    s.boundary_system_id AS boundary_id,
                        CASE
                            WHEN s.id IS NOT NULL THEN (s.code || ' · '::text) || s.name
                            WHEN pc.id IS NOT NULL THEN (pc.code || ' · '::text) || pc.name
                            WHEN sp.id IS NOT NULL THEN (sp.code || ' · '::text) || sp.name
                            ELSE 'Target unavailable'::text
                        END AS name,
                        CASE
                            WHEN a.system_id IS NOT NULL THEN 'System element'::text
                            WHEN a.provider_capability_id IS NOT NULL THEN 'Provider capability'::text
                            ELSE 'Security process'::text
                        END AS kind
                   FROM requirement_allocations a
                     LEFT JOIN systems s ON s.id = a.system_id
                     LEFT JOIN provider_capabilities pc ON pc.id = a.provider_capability_id
                     LEFT JOIN security_processes sp ON sp.id = a.security_process_id
                  WHERE a.tenant_id = r.tenant_id AND a.requirement_revision_id = latest.id) t) allocated ON true
     LEFT JOIN LATERAL ( SELECT jsonb_agg(jsonb_build_object('id', t.id, 'label', t.label, 'relationship_type', t.relationship_type, 'needs_review', t.needs_review, 'part_name', t.part_name) ORDER BY t.label, t.id) AS list,
            string_agg(t.label, ', '::text ORDER BY t.label, t.id) AS labels,
            bool_or(t.needs_review) AS needs_review
           FROM ( SELECT l.id,
                    l.relationship_type,
                    p.name AS part_name,
                    COALESCE((c.code || ' · '::text) || c.title, 'Control unavailable'::text) AS label,
                    l.control_part_id IS NOT NULL AND NOT is_control_statement(l.control_part_id) AS needs_review
                   FROM requirement_control_links l
                     LEFT JOIN controls c ON c.id = l.control_id
                     LEFT JOIN control_parts p ON p.id = l.control_part_id
                  WHERE l.tenant_id = r.tenant_id AND l.requirement_revision_id = latest.id) t) linked ON true
     LEFT JOIN LATERAL ( WITH RECURSIVE up(node, path, keys, closed) AS (
                 SELECT r.id,
                    ARRAY[r.id] AS "array",
                    ARRAY[natural_sort_key(r.code) COLLATE "C"] AS "array",
                    false AS "?column?"
                UNION ALL
                 SELECT step.parent,
                    up.path || step.parent,
                    up.keys || (( SELECT natural_sort_key(e.code) COLLATE "C" AS natural_sort_key
                           FROM engineering_requirements e
                          WHERE e.id = step.parent)),
                    step.parent = ANY (up.path)
                   FROM up
                     CROSS JOIN LATERAL ( SELECT ((parents.map -> up.node::text) ->> 0)::uuid AS parent,
                            ((parents.map -> up.node::text) ->> 1)::integer AS count) step
                  WHERE NOT up.closed AND step.count = 1
                ), walk AS (
                 SELECT up.path,
                    up.keys,
                    up.closed,
                        CASE
                            WHEN up.closed THEN array_position(up.path, up.path[cardinality(up.path)])
                            ELSE cardinality(up.path)
                        END AS length
                   FROM up
                  ORDER BY (cardinality(up.path)) DESC
                 LIMIT 1
                )
         SELECT
                CASE
                    WHEN walk.length > 1 THEN walk.path[2]
                    ELSE NULL::uuid
                END AS parent_id,
            ( SELECT array_agg(u.node ORDER BY u.at DESC) AS array_agg
                   FROM unnest(walk.path[2:walk.length]) WITH ORDINALITY u(node, at)) AS ancestors,
            ( SELECT array_agg(u.key ORDER BY u.at DESC) AS array_agg
                   FROM unnest(walk.keys[1:walk.length]) WITH ORDINALITY u(key, at)) AS tree_order,
            walk.closed AND walk.length = 1 OR COALESCE(((parents.map -> r.id::text) ->> 1)::integer, 0) > 1 AS unstructured
           FROM walk) tree ON true;
comment on column public.program_requirement_rows.allocated_boundaries is 'The systems the requirement''s latest revision is allocated in: the authorization boundary of each system it is allocated to, the boundary itself or an element inside it. Map a requirement filters by it.';

-- ---------------------------------------------------------------------------------------------
-- What a risk concerns and what counters it: the body of 20261114051138_objective_counts_on_screens,
-- counting each countering control's objectives mapped as its control status counts them.
-- ---------------------------------------------------------------------------------------------
create or replace function public.risk_threats(p_tenant_id uuid, p_risk_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $function$
declare
  answer jsonb;
  -- Appendix F and Appendix G, as the reference manifest names their frameworks; the first
  -- holds Table F-1's effects.
  v_frameworks constant text[] := array['nist-sp800-160v2r1-attack', 'nist-sp800-160v2r1-attack-ics'];
  v_effects constant text := 'nist-sp800-160v2r1-attack';
  v_program uuid;
  v_editions uuid[];
  v_catalog uuid;
  v_current uuid;
  v_loaded boolean;
  v_counted boolean;
  v_baseline boolean;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  if p_risk_id is null then
    raise exception 'Name the risk' using errcode = '22023';
  end if;
  select k.program_id into v_program
  from public.risks k
  where k.tenant_id = p_tenant_id and k.id = p_risk_id;
  -- The catalog editions the program's control baselines were chosen on.
  select coalesce(array_agg(distinct c.catalog_revision_id), '{}') into v_editions
  from public.program_reference_choices c
  where c.tenant_id = p_tenant_id and c.program_id = v_program;
  -- The reading made against one of them, Appendix F's current one first.
  select r.catalog_revision_id into v_catalog
  from public.framework_revisions r
  join public.frameworks f on f.id = r.framework_id
  where f.code = any(v_frameworks) and f.tenant_id is null and r.state = 'published'
    and r.catalog_revision_id = any(v_editions)
  order by (r.id = f.current_revision_id) desc nulls last, (f.code = v_frameworks[1]) desc,
    r.created_at desc, r.id desc
  limit 1;
  select true, fr.catalog_revision_id into v_loaded, v_current
  from public.framework_rows fr
  where fr.code = any(v_frameworks) and fr.tenant_id is null
  order by (fr.code = v_frameworks[1]) desc
  limit 1;
  v_loaded := coalesce(v_loaded, false);
  v_catalog := coalesce(v_catalog, v_current);
  -- The program's records can be counted on these controls when they are of its own edition, or
  -- when it records none; it stands in a baseline only when it records one.
  v_counted := v_program is not null and v_catalog is not null
    and (cardinality(v_editions) = 0 or v_catalog = any(v_editions));
  v_baseline := v_counted and cardinality(v_editions) > 0;

  with
  tech as (
    select l.id as link_id, i.id as item_id, i.code, f.code as framework_code,
      coalesce(cur.title, i.title) as title,
      public.natural_sort_key(i.code) collate "C" as code_order
    from public.risk_attack_techniques l
    join public.framework_items i on i.id = l.framework_item_id
    join public.framework_revisions r on r.id = i.framework_revision_id
    join public.frameworks f on f.id = r.framework_id
    left join public.framework_item_rows cur
      on cur.framework_code = f.code and cur.tenant_id is null
     and cur.kind = 'attack-technique' and cur.code = i.code
    where l.tenant_id = p_tenant_id and l.risk_id = p_risk_id
  ),
  tactic as (
    select t.framework_code, t.code as technique_code, tl.target_code as code,
      tl.target_title as title, held.ordinal
    from tech t
    join public.framework_item_link_rows tl
      on tl.framework_code = t.framework_code and tl.tenant_id is null
     and tl.relation = 'tactic' and tl.source_code = t.code
    join public.framework_items held on held.id = tl.target_item_id
  ),
  -- Every row either appendix prints against one of the techniques, for a control of the reading.
  printed as (
    select s.control_id, s.control_code, s.control_title, s.item_code as technique_code,
      s.framework_code, s.props,
      public.natural_sort_key(s.source_identifier) collate "C" as place
    from public.framework_control_link_rows s
    join tech t on t.framework_code = s.framework_code and t.code = s.item_code
    where s.tenant_id is null and s.relation = 'mitigates'
      and s.catalog_revision_id = v_catalog and s.control_id is not null
  ),
  control as (
    select p.control_id as id, min(p.control_code) as code, min(p.control_title) as title
    from printed p
    group by p.control_id
  ),
  counters as (
    select distinct p.control_id, p.technique_code, p.framework_code from printed p
  ),
  -- A row names its approaches by reference: an item's code, or <framework code>:<item code> for
  -- an item of another framework, as the cyber resiliency approaches are.
  approach as (
    select p.control_id, a.code, a.title, min(p.place) as place, min(named.nth) as nth
    from printed p
    cross join lateral jsonb_array_elements_text(
      case when jsonb_typeof(p.props->'approaches') = 'array' then p.props->'approaches' else '[]'::jsonb end
    ) with ordinality as named(reference, nth)
    join public.framework_item_rows a
      on a.tenant_id is null
     and a.framework_code = case when position(':' in named.reference) > 0
       then split_part(named.reference, ':', 1) else p.framework_code end
     and a.code = case when position(':' in named.reference) > 0
       then substr(named.reference, position(':' in named.reference) + 1) else named.reference end
    group by p.control_id, a.code, a.title
  ),
  -- A row names its effects by title; Table F-1 orders them.
  effect as (
    select p.control_id, named.title, min(e.ordinal) as ordinal, min(p.place) as place, min(named.nth) as nth
    from printed p
    cross join lateral jsonb_array_elements_text(
      case when jsonb_typeof(p.props->'effects') = 'array' then p.props->'effects' else '[]'::jsonb end
    ) with ordinality as named(title, nth)
    left join public.framework_item_rows e
      on e.framework_code = v_effects and e.tenant_id is null and e.kind = 'effect' and e.title = named.title
    group by p.control_id, named.title
  ),
  -- The program's requirements whose latest revision maps each control.
  met as (
    select distinct l.control_id, q.id as requirement_id, v.id as revision_id
    from public.requirement_control_links l
    join public.requirement_revisions v on v.tenant_id = l.tenant_id and v.id = l.requirement_revision_id
    join public.engineering_requirements q on q.tenant_id = v.tenant_id and q.id = v.engineering_requirement_id
    where v_counted and l.tenant_id = p_tenant_id and q.program_id = v_program
      and l.control_id in (select id from control)
      and v.version_number = (select max(x.version_number) from public.requirement_revisions x
        where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)
  ),
  evidenced as (
    select distinct m.requirement_id
    from met m
    join public.requirement_evidence re on re.tenant_id = p_tenant_id and re.requirement_revision_id = m.revision_id
    join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
  ),
  -- The controls a control baseline of the program selects: any of the baselines it adopted.
  selected as (
    select distinct sc.control_id
    from public.program_reference_choices c
    join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
    where v_baseline and c.tenant_id = p_tenant_id and c.program_id = v_program
      and sc.control_id in (select id from control)
  ),
  line as (
    select c.id, c.code, c.title, public.natural_sort_key(c.code) collate "C" as code_order,
      case when v_baseline then exists (select 1 from selected s where s.control_id = c.id) end as in_baseline,
      case when v_counted then (select count(distinct m.requirement_id) from met m
        where m.control_id = c.id) end as requirements,
      case when v_counted then (select count(distinct m.requirement_id) from met m
        where m.control_id = c.id and m.requirement_id in (select requirement_id from evidenced)) end as evidenced
    from control c
  )
  select jsonb_build_object(
    'risk_id', p_risk_id,
    'program_id', v_program,
    'loaded', v_loaded,
    'catalog_revision_id', v_catalog,
    'baseline', v_baseline,
    'techniques', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'link_id', t.link_id, 'item_id', t.item_id, 'code', t.code, 'title', t.title,
        'framework', t.framework_code,
        'tactics', (
          select coalesce(jsonb_agg(jsonb_build_object('code', x.code, 'title', x.title)
            order by x.ordinal, x.code), '[]'::jsonb)
          from tactic x where x.framework_code = t.framework_code and x.technique_code = t.code)
      ) order by array_position(v_frameworks, t.framework_code), t.code_order, t.link_id), '[]'::jsonb)
      from tech t),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id, 'code', l.code, 'title', l.title,
        'techniques', (
          select coalesce(jsonb_agg(k.technique_code
            order by array_position(v_frameworks, k.framework_code),
              public.natural_sort_key(k.technique_code) collate "C"), '[]'::jsonb)
          from counters k where k.control_id = l.id),
        'approaches', (
          select coalesce(jsonb_agg(jsonb_build_object('code', a.code, 'title', a.title)
            order by a.place, a.nth, a.code), '[]'::jsonb)
          from approach a where a.control_id = l.id),
        'effects', (
          select coalesce(jsonb_agg(e.title order by e.ordinal nulls last, e.place, e.nth, e.title), '[]'::jsonb)
          from effect e where e.control_id = l.id),
        'in_baseline', l.in_baseline, 'requirements', l.requirements, 'evidenced', l.evidenced
      ) order by l.code_order, l.id), '[]'::jsonb)
      from line l),
    'totals', jsonb_build_object(
      'techniques', (select count(*) from tech),
      'controls', (select count(*) from line),
      'in_baseline', case when v_baseline then (select count(*) from line where line.in_baseline) end,
      'with_requirement', case when v_counted then (select count(*) from line where line.requirements > 0) end,
      'with_evidence', case when v_counted then (select count(*) from line where line.evidenced > 0) end
    )
  ) into answer;
  -- How many of each control's assessment objectives the program's requirements cover, counted as
  -- its control status counts them (program_control_objective_cover: an objective is mapped once
  -- covered on every system of the program whose control baseline selects the control), in one
  -- read for every control; empty where no standing can be said, as its requirements are.
  if v_counted and jsonb_array_length(answer->'controls') > 0 then
    with spot as (
      select o.control_id, o.objective_id, o.system_id,
        bool_or(o.requirement_id is not null) as covered
      from public.program_control_objective_cover(v_program,
        array(select (c->>'id')::uuid from jsonb_array_elements(answer->'controls') c)) o
      where o.objective_id is not null
      group by o.control_id, o.objective_id, o.system_id
    ),
    cover as (
      select t.control_id, count(*) as objectives, count(*) filter (where t.mapped) as mapped
      from (
        select s.control_id, s.objective_id, bool_and(s.covered) as mapped
        from spot s
        group by s.control_id, s.objective_id
      ) t
      group by t.control_id
    )
    select jsonb_set(answer, '{controls}', jsonb_agg(c.line || jsonb_build_object(
        'objectives', coalesce(v.objectives, 0), 'objectives_mapped', coalesce(v.mapped, 0))
        order by c.n))
      into answer
    from jsonb_array_elements(answer->'controls') with ordinality c(line, n)
    left join cover v on v.control_id = (c.line->>'id')::uuid;
  else
    select jsonb_set(answer, '{controls}', coalesce(jsonb_agg(c.line || jsonb_build_object(
        'objectives', null, 'objectives_mapped', null) order by c.n), '[]'::jsonb))
      into answer
    from jsonb_array_elements(answer->'controls') with ordinality c(line, n);
  end if;
  return answer;
end; $function$;

revoke all on function public.risk_threats(uuid, uuid) from public, anon;
grant execute on function public.risk_threats(uuid, uuid) to authenticated;
comment on function public.risk_threats(uuid, uuid) is 'What a risk concerns and what counters it: the ATT&CK techniques the risk names (code, title, framework and tactics, from the reference frameworks nist-sp800-160v2r1-attack, ATT&CK for Enterprise, and nist-sp800-160v2r1-attack-ics, ATT&CK for ICS), and the controls NIST SP 800-160 Vol. 2 Rev. 1 Appendices F and G print against them, each once in the catalog''s order with the techniques it counters, its approaches and its effects. For each control, where the risk''s program stands: in_baseline (a control baseline the program adopted selects it), requirements (the program''s requirements whose latest revision maps it), evidenced (those whose latest revision cites an evidence version), objectives (the assessment objectives the control counts) and objectives_mapped (those the program''s requirements cover on every system of the program whose control baseline selects the control, as program_control_status counts them); empty where no standing can be said. loaded says whether the reference data is there; totals count the techniques, the controls and the controls in the baseline, with a requirement and with evidence.';

notify pgrst, 'reload schema';
