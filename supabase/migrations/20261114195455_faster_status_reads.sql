-- Faster status reads: the shared reads behind every control status answer as before, in less
-- time, and the Portfolio reads counts (Josef, 2026-11-14: "Faster status reads").
--
-- Every row these reads touch is checked by row-level security as the reader, one call of
-- can_read_tenant a row (about 5 microseconds), so a read is as slow as the rows it touches. They
-- touched rows they did not need, and some rows many times over:
--
--   the coverage read      program_control_objective_cover picked each requirement's latest
--                          revision with a max asked once a revision, read a mapping's system
--                          once a mapping, and asked for evidence once a mapping. It now reads
--                          each row once, and reads only what the controls named can reach: for a
--                          control baseline (more than 100 controls) the program's requirements,
--                          each at its latest revision, then the mappings on those revisions; for a
--                          few controls (one control's record, a risk's countering controls) the
--                          mappings of those controls, then only the requirements they stand on,
--                          as before
--   the status lines       program_control_status_lines read the program's mappings and evidence
--                          a second time, beside the coverage read, to count each control's
--                          requirements. The new internal program_control_coverage answers both in
--                          one read: the coverage read's rows, and each control's requirements
--                          whose latest revision maps it, with whether each cites evidence.
--                          program_control_objective_cover answers the first part of it
--   the judgments read     program_control_objective_judgments found the targets a determination
--                          on an objective judges by asking the counted objectives again for each
--                          objective above them. Every published finding so far targets a
--                          statement, which never asks; with a finding on every objective of a
--                          control baseline (as plans by objective will bring) it took about 370 ms
--                          on WS-X90. Each objective now carries its control up the walk, which
--                          takes about 36 ms
--   the placement read     program_objective_placement read what each element's baseline selects
--                          through the controls mapped, every baseline of every workspace that
--                          selects them (about 25,000 rows on the developer workspace, to keep
--                          560); program_posture's families could do the same. Both read each
--                          baseline's selections as a range of that baseline
--
-- No answer changes: program_control_status, program_control_status_lines, the coverage and
-- judgments reads, one control's objectives, the four posture reads and their cells, risk_threats
-- and control_objective_counts answered the same before and after for every program of the
-- database, read back to back in one transaction, and so did the status, its lines, the judgments
-- and the catalog control's counts with about 3,000 determinations on objectives written in that
-- transaction. On WS-X90, as a member, side by side on a loaded machine: program_control_status
-- about 178 to 75 ms, program_posture 334 to 167, program_resiliency_posture 243 to 139, the
-- coverage read over the baseline 77 to 58; a read of one control stays about 4 ms.
--
-- program_control_status_counts is new: each named program's six status counts and their total,
-- counted from program_control_status_lines as program_control_status and the posture snapshots
-- count them, in one request for a widget that lists a few programs: the Portfolio's Recently
-- updated programs, which read program_control_status whole for each of its five rows.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- The coverage read and each control's requirements, in one read: the live body of
-- program_control_objective_cover (20261114072913_every_system_counts), each row read once.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_control_coverage(p_program_id uuid, p_control_ids uuid[])
returns table (control_id uuid, objective_id uuid, system_id uuid, requirement_id uuid, evidenced boolean,
  mapping boolean)
language plpgsql
stable
rows 1000
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_tenant uuid;
  -- A few controls (one control's record, a risk's countering controls) are read from their
  -- mappings; more (a control baseline) from the program's requirements.
  v_few boolean := cardinality(p_control_ids) <= 100;
begin
  -- A program the caller cannot read is refused, never answered as covering nothing.
  select p.tenant_id into v_tenant from public.programs p where p.id = p_program_id;
  if v_tenant is null then
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
  -- For a few controls, the revisions their mappings in the workspace stand on, read first and on
  -- their own, so the requirements are read from them under any plan (none for a control
  -- baseline).
  touched as materialized (
    select distinct l.requirement_revision_id
    from public.requirement_control_links l
    where v_few and l.tenant_id = v_tenant and l.control_id = any(p_control_ids)
  ),
  -- The program's requirements a mapping of the controls can stand on: for a control baseline,
  -- every one; for a few controls, those a mapping of one of them stands on a revision of, so the
  -- rest of the program is never read.
  candidate as materialized (
    select q.id
    from public.engineering_requirements q
    where not v_few and q.tenant_id = v_tenant and q.program_id = p_program_id
    union
    select q.id
    from touched t
    join public.requirement_revisions x on x.tenant_id = v_tenant and x.id = t.requirement_revision_id
    join public.engineering_requirements q on q.tenant_id = x.tenant_id and q.id = x.engineering_requirement_id
    where q.program_id = p_program_id
  ),
  -- Each of them at its latest revision: one revision read a requirement, never a latest version
  -- asked again for each of its mappings.
  cur as materialized (
    select c.id as requirement_id, v.revision_id
    from candidate c
    cross join lateral (
      select r.id as revision_id
      from public.requirement_revisions r
      where r.tenant_id = v_tenant and r.engineering_requirement_id = c.id
      order by r.version_number desc
      limit 1
    ) v
  ),
  -- The mappings of the controls on those revisions: matched against the controls by a join, never
  -- by the list of them as a key of every revision's index probe, which sorts the list each time.
  link as materialized (
    select l.control_id, cur.requirement_id, cur.revision_id, l.control_part_id, l.system_id
    from cur
    join public.requirement_control_links l
      on l.tenant_id = v_tenant and l.requirement_revision_id = cur.revision_id
    join control c on c.id = l.control_id
  ),
  -- The systems they name, with their authorization boundaries: each read once, never once a
  -- mapping.
  named as materialized (
    select s.id, s.boundary_system_id
    from public.systems s
    where s.tenant_id = v_tenant and s.id in (select k.system_id from link k)
  ),
  -- The program's requirements whose latest revision maps one of the controls, the objective each
  -- mapping names (none where it maps the whole control, or names a statement, an item or a part
  -- that is not one of the control's objectives, which cover the whole control) and the system it
  -- counts on: the boundary of the system it names, or every system where it names none.
  met as materialized (
    select distinct k.control_id, k.requirement_id, k.revision_id,
      case when cp.name = 'assessment-objective' and cp.control_id = k.control_id
        then k.control_part_id end as objective_id,
      k.system_id is null as everywhere,
      ms.boundary_system_id as boundary_id
    from link k
    left join public.control_parts cp on cp.id = k.control_part_id
    left join named ms on ms.id = k.system_id
  ),
  -- Those requirements whose latest revision cites an evidence version: asked once a requirement.
  evidenced as materialized (
    select m.requirement_id
    from (select distinct m.requirement_id, m.revision_id from met m) m
    where exists (
      select 1
      from public.requirement_evidence re
      join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
      where re.tenant_id = v_tenant and re.requirement_revision_id = m.revision_id)
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
  -- Each target on each system it is counted on, once with each requirement that covers it there
  -- and once with none where none does: program_control_objective_cover's rows.
  (select distinct p.control_id, p.objective_id, p.system_id, c.requirement_id,
    e.requirement_id is not null, false
  from place p
  left join covered c on c.target_id = p.target_id
    and (p.system_id is null or c.everywhere or c.boundary_id = p.system_id)
  left join evidenced e on e.requirement_id = c.requirement_id)
  union all
  -- Each control with each of the program's requirements whose latest revision maps it, wherever
  -- that mapping counts.
  (select distinct m.control_id, null::uuid, null::uuid, m.requirement_id,
    e.requirement_id is not null, true
  from met m
  left join evidenced e on e.requirement_id = m.requirement_id);
end; $$;

revoke all on function public.program_control_coverage(uuid, uuid[]) from public, anon;
grant execute on function public.program_control_coverage(uuid, uuid[]) to authenticated;
comment on function public.program_control_coverage(uuid, uuid[]) is 'Internal: what the program''s requirements cover of the named controls, in one read. mapping false: program_control_objective_cover''s rows, each target (each assessment objective a control counts, or, objective_id null, the control itself where it counts none) on each system it is counted on, once with each requirement whose latest revision covers it there and whether that requirement cites evidence, and once with no requirement where none does. mapping true: each named control once with each of the program''s requirements whose latest revision maps it, wherever that mapping counts, and whether the requirement cites evidence (no objective, no system). Each row read once: a control baseline (more than 100 controls) is read from the program''s requirements, a few controls from their mappings. Security invoker: a program the caller cannot read is refused. program_control_status_lines counts from it.';

-- ---------------------------------------------------------------------------------------------
-- The coverage read itself: program_control_coverage's targets.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_control_objective_cover(p_program_id uuid, p_control_ids uuid[])
returns table (control_id uuid, objective_id uuid, system_id uuid, requirement_id uuid, evidenced boolean)
language plpgsql
stable
rows 1000
set search_path = ''
as $$
#variable_conflict use_column
begin
  -- program_control_coverage refuses a program the caller cannot read, never answered as covering
  -- nothing.
  return query
  select o.control_id, o.objective_id, o.system_id, o.requirement_id, o.evidenced
  from public.program_control_coverage(p_program_id, p_control_ids) o
  where not o.mapping;
end; $$;

revoke all on function public.program_control_objective_cover(uuid, uuid[]) from public, anon;
grant execute on function public.program_control_objective_cover(uuid, uuid[]) to authenticated;
comment on function public.program_control_objective_cover(uuid, uuid[]) is 'Internal: each target of the named controls (each assessment objective a control counts, a leaf or a heading that prints a sentence of its own, or, objective_id null, the control itself where it counts none) on each system it is counted on, once with each of the program''s requirements whose latest revision covers it there and whether that requirement cites evidence, and once with no requirement where none does. A control is counted on each of the program''s authorization boundaries whose effective control baseline selects it (system_id); where none does, once with no system, covered by any mapping. A mapping covers the objective it names and every objective under it, or the whole control where it names no part, a statement or an item; it counts on the boundary of the system it names, or on every system where it names none. A target is mapped once covered on every system, and evidenced once covered on every system by a requirement that cites evidence. Security invoker: a program the caller cannot read is refused. program_control_objectives, risk_threats, control_objective_counts and the posture reads read it; program_control_status_lines reads the same rows through program_control_coverage.';

-- ---------------------------------------------------------------------------------------------
-- One line a control of a program's control baseline: the live body of
-- 20261114165512_latest_per_objective, with its coverage and its requirements read in one read.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_control_status_lines(p_program_id uuid)
returns table (id uuid, code text, title text, parent_control_id uuid, code_order text, family text,
  family_title text, requirements bigint, evidenced bigint, status text, determined_by text,
  product_assessments jsonb, objectives bigint, objectives_mapped bigint, objectives_evidenced bigint,
  objectives_assessed bigint)
language plpgsql
stable
rows 1000
set search_path = ''
as $$
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
  -- What the program's assessors have judged of each control: how many of its objectives, whether
  -- the control itself (one that counts none), and the worst determination among them. One read of
  -- every control.
  judgment as materialized (
    select j.control_id,
      count(j.objective_id) as assessed,
      bool_or(j.objective_id is null) as whole,
      bool_or(j.determination = 'other_than_satisfied') as other_than,
      bool_or(j.determination = 'partially_satisfied') as partially
    from public.program_control_objective_judgments(p_program_id, array(select s.control_id from selected s)) j
    group by j.control_id
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
      case when coalesce(o.objectives, 0) > 0 then coalesce(j.assessed, 0) else 0 end as objectives_assessed
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
    l.objectives, l.objectives_mapped, l.objectives_evidenced, l.objectives_assessed
  from line l;
end; $$;

revoke all on function public.program_control_status_lines(uuid) from public, anon;
grant execute on function public.program_control_status_lines(uuid) to authenticated;
comment on function public.program_control_status_lines(uuid) is 'Internal: one line a control of a program''s control baseline, as program_control_status answers it (its status, the requirements that map it and how many cite evidence, its assessment objectives with how many are mapped, how many evidenced and how many judged, whose determination and the product assessments behind a product''s), asking nothing of who calls but that row-level security lets them read the program. A target (each objective, or the control itself where it counts none) is mapped once covered on every system of the program whose control baseline selects the control, and evidenced once covered on every one by a requirement that cites evidence (program_control_objective_cover, read with the requirements that map each control through program_control_coverage); a control leaves no requirement once every target is mapped and no evidence once every one is evidenced. The program''s assessors decide a control once they have judged every target (program_control_objective_judgments, where the newest determination that judges a target decides it), with the worst of the targets'' determinations; until then the product''s determination decides where every variant inherits the control, else the ladder. Security invoker. program_control_status, program_control_status_counts and the posture snapshots count from it.';

-- ---------------------------------------------------------------------------------------------
-- What a program's assessors have judged of each control: the live body of
-- 20261114165512_latest_per_objective, with each objective's control carried through its walk up
-- the objectives above it.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_control_objective_judgments(p_program_id uuid, p_control_ids uuid[])
returns table (control_id uuid, objective_id uuid, determination text)
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
  )
  -- The latest decides each target: the newest determination that judges it, by when it was made
  -- (one with no moment the oldest) and then recorded; at the same moment, the nearer part's, then
  -- the worse.
  select distinct on (v.control_id, v.objective_id) v.control_id, v.objective_id, v.determination
  from verdict v
  order by v.control_id, v.objective_id, v.determined_at desc nulls last, v.created_at desc,
    v.nearness,
    case v.determination when 'other_than_satisfied' then 0 when 'partially_satisfied' then 1 else 2 end,
    v.finding_id desc;
end; $$;

revoke all on function public.program_control_objective_judgments(uuid, uuid[]) from public, anon;
grant execute on function public.program_control_objective_judgments(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Where the program's mappings stand, for the posture reads: the live body of
-- 20261114170435_posture_by_objective, with each baseline's selections read by the baseline.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_objective_placement(p_program_id uuid)
returns table (
  system_id uuid,
  requirement_id uuid,
  control_id uuid,
  objective_id uuid,
  evidenced boolean,
  control_objectives bigint
)
language plpgsql
stable
rows 5000
set search_path = ''
as $$
#variable_conflict use_column
declare v_tenant uuid;
begin
  -- A program the caller cannot read is refused, never answered as placing nothing.
  select p.tenant_id into v_tenant from public.programs p where p.id = p_program_id;
  if auth.uid() is null or v_tenant is null then
    raise exception 'Program access is required' using errcode = '42501';
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

revoke all on function public.program_objective_placement(uuid) from public, anon;
grant execute on function public.program_objective_placement(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- A program's posture by control family: the live body of 20261114170435_posture_by_objective,
-- with each baseline's selections read by the baseline for its families.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_posture(p_tenant_id uuid, p_program_id uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare answer jsonb;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  -- A program of another workspace, or of none, holds nothing here.
  if not exists (select 1 from public.programs p where p.id = p_program_id and p.tenant_id = p_tenant_id) then
    return jsonb_build_object('elements', '[]'::jsonb, 'families', '[]'::jsonb, 'cells', '[]'::jsonb,
      'totals', jsonb_build_object('requirements', 0, 'unplaced', 0, 'objectives', 0, 'mapped', 0,
        'evidenced', 0, 'placed', 0, 'issues', 0, 'issues_severe', 0, 'issues_placed', 0,
        'risks', 0, 'risks_severe', 0, 'risks_placed', 0));
  end if;
  with recursive
  cur as materialized (
    select distinct on (q.id) q.id as requirement_id, v.id as revision_id
    from public.engineering_requirements q
    join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
    where q.tenant_id = p_tenant_id and q.program_id = p_program_id
    order by q.id, v.version_number desc
  ),
  el as materialized (
    select s.id, s.code, s.name, s.system_type, s.parent_system_id, s.is_authorization_boundary
    from public.systems s
    where s.tenant_id = p_tenant_id and s.program_id = p_program_id
  ),
  -- Every element under each element of the program that holds it, itself first.
  up (id, holder, depth) as (
    select el.id, el.id, 0 from el
    union all
    select up.id, above.id, up.depth + 1
    from up
    join el holder on holder.id = up.holder
    join el above on above.id = holder.parent_system_id
    where up.depth < 32
  ),
  placement as materialized (
    select * from public.program_objective_placement(p_program_id)
  ),
  family_of as materialized (
    select x.id as control_id, x.group_id as family_id
    from public.controls x
    where x.id in (select control_id from placement) and x.group_id is not null
  ),
  -- Each element's objectives: those the mappings on it and on the elements inside it cover, each
  -- once, with evidence there when a requirement that cites evidence covers it there.
  pooled as materialized (
    select up.holder as system_id, f.family_id, pl.objective_id, bool_or(pl.evidenced) as evidenced
    from placement pl
    join up on up.id = pl.system_id
    join family_of f on f.control_id = pl.control_id
    where pl.objective_id is not null
    group by up.holder, f.family_id, pl.objective_id
  ),
  -- Across the program, each objective once.
  anywhere as materialized (
    select f.family_id, pl.objective_id, bool_or(pl.evidenced) as evidenced
    from placement pl
    join family_of f on f.control_id = pl.control_id
    where pl.objective_id is not null
    group by f.family_id, pl.objective_id
  ),
  cell as (
    select p.system_id, p.family_id, count(*) as objectives, count(*) filter (where p.evidenced) as evidenced
    from pooled p group by p.system_id, p.family_id
  ),
  line as (
    select p.system_id, count(*) as objectives, count(*) filter (where p.evidenced) as evidenced
    from pooled p group by p.system_id
  ),
  fam_line as (
    select a.family_id, count(*) as objectives, count(*) filter (where a.evidenced) as evidenced
    from anywhere a group by a.family_id
  ),
  -- Where each requirement stands: on every element a mapping of it stands on and every element that
  -- holds that one, under the family of the control mapped there.
  req_cell as materialized (
    select distinct up.holder as system_id, f.family_id, pl.requirement_id
    from placement pl
    join up on up.id = pl.system_id
    join family_of f on f.control_id = pl.control_id
  ),
  req_ev as (
    select distinct cur.requirement_id, ev.artifact_id
    from public.requirement_evidence re
    join cur on cur.revision_id = re.requirement_revision_id
    join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
    where re.tenant_id = p_tenant_id
  ),
  open_issue as (
    select o.id, array_position('{low,moderate,high,critical}'::text[], o.severity) as rank
    from public.operational_issues o
    where o.tenant_id = p_tenant_id and o.program_id = p_program_id
      and o.status not in ('resolved', 'closed', 'cancelled')
  ),
  open_risk as (
    select x.id, x.severity_rank as rank
    from public.risk_rows x
    where x.tenant_id = p_tenant_id and x.program_id = p_program_id and x.status <> 'closed'
  ),
  cited as (select * from public.assurance_issue_evidence(p_tenant_id)),
  -- Where every issue stands, open or not: the requirements its evidence supports, and the
  -- program's requirements it names.
  issue_place as (
    select cited.issue_id, req_ev.requirement_id
    from cited join req_ev on req_ev.artifact_id = cited.artifact_id
    union
    select l.issue_id, cur.requirement_id
    from public.issue_requirements l
    join cur on cur.requirement_id = l.engineering_requirement_id
    where l.tenant_id = p_tenant_id and l.program_id = p_program_id
  ),
  issue_req as (
    select distinct open_issue.id as issue_id, open_issue.rank, issue_place.requirement_id
    from open_issue
    join issue_place on issue_place.issue_id = open_issue.id
  ),
  -- A risk stands where its issues stand, whether or not those issues are still open.
  risk_req as (
    select distinct open_risk.id as risk_id, open_risk.rank, issue_place.requirement_id
    from open_risk
    join public.assurance_issue_risks(p_tenant_id) rests on rests.risk_id = open_risk.id
    join issue_place on issue_place.issue_id = rests.issue_id
  ),
  cell_issue as (
    select rc.system_id, rc.family_id, count(distinct ir.issue_id) as issues, max(ir.rank) as severity
    from req_cell rc join issue_req ir on ir.requirement_id = rc.requirement_id
    group by rc.system_id, rc.family_id
  ),
  cell_risk as (
    select rc.system_id, rc.family_id, count(distinct rr.risk_id) as risks, max(rr.rank) as severity
    from req_cell rc join risk_req rr on rr.requirement_id = rc.requirement_id
    group by rc.system_id, rc.family_id
  ),
  line_issue as (
    select rc.system_id, count(distinct ir.issue_id) as issues, max(ir.rank) as severity
    from req_cell rc join issue_req ir on ir.requirement_id = rc.requirement_id
    group by rc.system_id
  ),
  line_risk as (
    select rc.system_id, count(distinct rr.risk_id) as risks, max(rr.rank) as severity
    from req_cell rc join risk_req rr on rr.requirement_id = rc.requirement_id
    group by rc.system_id
  ),
  fam_issue as (
    select rc.family_id, count(distinct ir.issue_id) as issues, max(ir.rank) as severity
    from req_cell rc join issue_req ir on ir.requirement_id = rc.requirement_id
    group by rc.family_id
  ),
  fam_risk as (
    select rc.family_id, count(distinct rr.risk_id) as risks, max(rr.rank) as severity
    from req_cell rc join risk_req rr on rr.requirement_id = rc.requirement_id
    group by rc.family_id
  ),
  -- Every family the elements' control baselines hold, also one nothing is mapped in. Each
  -- baseline's selection is read once, however many elements share it, as a range of that
  -- baseline's selections (program_objective_placement says why).
  family as (
    select g.id, upper(g.source_id) as code, g.title, g.ordinal
    from public.catalog_groups g
    where g.id in (
      select x.group_id
      from (
        select distinct b.profile_resolution_id from public.system_effective_baselines b
        where b.tenant_id = p_tenant_id and b.system_id in (select id from el)) r
      cross join lateral (
        select sc.control_id from public.selected_controls sc
        where sc.profile_resolution_id = r.profile_resolution_id
        offset 0) sc
      join public.controls x on x.id = sc.control_id
      union
      select family_id from family_of)
  ),
  -- The program's control baseline as its control status counts it (program_control_status_lines):
  -- each objective once, mapped once covered on every system that selects its control, and
  -- evidenced once evidenced on every one.
  baseline as materialized (
    select distinct sc.control_id
    from public.program_reference_choices c
    join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
    where c.program_id = p_program_id
  ),
  standing as (
    select o.objective_id, bool_and(o.covered) as mapped, bool_and(o.evidenced) as evidenced
    from (
      select c.control_id, c.objective_id, c.system_id,
        bool_or(c.requirement_id is not null) as covered, bool_or(c.evidenced) as evidenced
      from public.program_control_objective_cover(p_program_id, array(select control_id from baseline)) c
      where c.objective_id is not null
      group by c.control_id, c.objective_id, c.system_id
    ) o
    group by o.control_id, o.objective_id
  )
  select jsonb_build_object(
    'elements', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', el.id, 'code', el.code, 'name', el.name, 'type', el.system_type,
        'parent_id', el.parent_system_id, 'boundary', el.is_authorization_boundary,
        'objectives', coalesce(line.objectives, 0), 'evidenced', coalesce(line.evidenced, 0),
        'issues', coalesce(line_issue.issues, 0), 'issue_severity', line_issue.severity,
        'risks', coalesce(line_risk.risks, 0), 'risk_severity', line_risk.severity
      ) order by public.natural_sort_key(el.code) collate "C", el.id), '[]'::jsonb)
      from el
      left join line on line.system_id = el.id
      left join line_issue on line_issue.system_id = el.id
      left join line_risk on line_risk.system_id = el.id),
    'families', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', family.id, 'code', family.code, 'title', family.title,
        'objectives', coalesce(fam_line.objectives, 0), 'evidenced', coalesce(fam_line.evidenced, 0),
        'issues', coalesce(fam_issue.issues, 0), 'issue_severity', fam_issue.severity,
        'risks', coalesce(fam_risk.risks, 0), 'risk_severity', fam_risk.severity
      ) order by family.ordinal, family.code, family.id), '[]'::jsonb)
      from family
      left join fam_line on fam_line.family_id = family.id
      left join fam_issue on fam_issue.family_id = family.id
      left join fam_risk on fam_risk.family_id = family.id),
    'cells', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'element_id', k.system_id, 'family_id', k.family_id,
        'objectives', coalesce(cell.objectives, 0), 'evidenced', coalesce(cell.evidenced, 0),
        'issues', coalesce(cell_issue.issues, 0), 'issue_severity', cell_issue.severity,
        'risks', coalesce(cell_risk.risks, 0), 'risk_severity', cell_risk.severity
      )), '[]'::jsonb)
      -- A cell where a requirement stands, also one whose controls count no objective.
      from (select distinct rc.system_id, rc.family_id from req_cell rc) k
      left join cell on cell.system_id = k.system_id and cell.family_id = k.family_id
      left join cell_issue on cell_issue.system_id = k.system_id and cell_issue.family_id = k.family_id
      left join cell_risk on cell_risk.system_id = k.system_id and cell_risk.family_id = k.family_id),
    'totals', jsonb_build_object(
      'requirements', (select count(*) from cur),
      -- Requirements that map a control and stand on no element.
      'unplaced', (select count(*) from cur
        where exists (select 1 from public.requirement_control_links l
          where l.tenant_id = p_tenant_id and l.requirement_revision_id = cur.revision_id)
          and not exists (select 1 from placement pl where pl.requirement_id = cur.requirement_id)),
      'objectives', (select count(*) from standing),
      'mapped', (select count(*) from standing where mapped),
      'evidenced', (select count(*) from standing where evidenced),
      'placed', (select count(*) from anywhere),
      'issues', (select count(*) from open_issue),
      'issues_severe', (select count(*) from open_issue where rank >= 3),
      'issues_placed', (select count(distinct ir.issue_id) from issue_req ir
        where ir.requirement_id in (select requirement_id from req_cell)),
      'risks', (select count(*) from open_risk),
      'risks_severe', (select count(*) from open_risk where rank >= 3),
      'risks_placed', (select count(distinct rr.risk_id) from risk_req rr
        where rr.requirement_id in (select requirement_id from req_cell))
    )
  ) into answer;
  return answer;
end;
$$;

revoke all on function public.program_posture(uuid, uuid) from public, anon;
grant execute on function public.program_posture(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Each named program's control status counts, in one request: the Portfolio's Recently updated
-- programs, five rows, which read program_control_status whole for each.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_control_status_counts(p_program_ids uuid[])
returns table (
  program_id uuid,
  baseline boolean,
  controls bigint,
  no_requirement bigint,
  no_evidence bigint,
  not_assessed bigint,
  other_than_satisfied bigint,
  partially_satisfied bigint,
  satisfied bigint
)
language plpgsql
stable
set search_path = ''
as $$
#variable_conflict use_column
begin
  -- A program the reader cannot read is refused, never answered as having no control baseline.
  if auth.uid() is null or p_program_ids is null
    or exists (select 1 from unnest(p_program_ids) n(id)
      where n.id is null or not exists (select 1 from public.programs p where p.id = n.id)) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  if cardinality(p_program_ids) > 100 then
    raise exception 'Ask for at most 100 programs at once' using errcode = '22023';
  end if;
  return query
  select w.id,
    -- Whether the program records a control baseline at all, as program_control_status says it.
    exists (select 1 from public.program_reference_choices c where c.program_id = w.id),
    count(l.id),
    count(l.id) filter (where l.status = 'no_requirement'),
    count(l.id) filter (where l.status = 'no_evidence'),
    count(l.id) filter (where l.status = 'not_assessed'),
    count(l.id) filter (where l.status = 'other_than_satisfied'),
    count(l.id) filter (where l.status = 'partially_satisfied'),
    count(l.id) filter (where l.status = 'satisfied')
  from (select distinct n.id from unnest(p_program_ids) n(id)) w
  left join lateral public.program_control_status_lines(w.id) l on true
  group by w.id
  order by w.id;
end; $$;

revoke all on function public.program_control_status_counts(uuid[]) from public, anon;
grant execute on function public.program_control_status_counts(uuid[]) to authenticated;
comment on function public.program_control_status_counts(uuid[]) is 'Each named program''s control status counts, for a widget that lists a few programs (the Portfolio''s Recently updated programs): whether it records a control baseline (baseline), how many controls its baseline selects (controls) and how many stand at each control status, counted from program_control_status_lines as program_control_status counts its totals and the posture snapshots count theirs. One row a program, by id. Security invoker: every named program must be one the reader can read; at most 100 at once.';
