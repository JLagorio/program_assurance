-- Not assessed until all: a program's assessors decide a control once they have judged every
-- assessment objective it counts.
--
-- Plans take a control as the assessment objectives it counts (20261114073741_plan_by_objective),
-- so an assessor can publish findings on some of a control's objectives. The status read the worst
-- of whatever its assessors had judged, so 3 of AC-2's 26 objectives found satisfied read Satisfied.
-- A control now stays without a program determination until every objective it counts is judged
-- (Josef, 2026-11-14: "Not assessed until all"):
--
--   an objective is judged       when the latest published determination on it, on an objective
--                                above it (a heading, as a mapping of a heading covers the
--                                objectives under it) or on a part of the control that is not one
--                                of its objectives (its statement, an item of its text, which judges
--                                the whole control, as a mapping of one covers the whole control)
--                                is other than not assessed. Every plan written before took the
--                                control's statement, so every determination recorded so far judges
--                                its whole control and no status moves
--   a control that counts none   is judged as a whole, by a determination on any of its parts, as
--                                before
--   every objective judged       the control reads the worst of their determinations, which is the
--                                worst of the latest determinations on its parts, as before
--   some judged, or none         no program determination: the product's determination decides
--                                where every variant inherits the control, as before, else the
--                                control reads the ladder below (No requirement, No evidence or Not
--                                assessed, whichever it reaches), and Determined by stays empty
--
--   program_control_objective_judgments   internal: each target of the named controls the program's
--                                         assessors have judged (each objective a control counts,
--                                         or the control itself where it counts none), with the
--                                         worst of the determinations that judge it
--   program_control_status_lines          decides by it, and answers objectives_assessed: how many of
--                                         the objectives a control counts are judged. Its answer
--                                         gains the column, so it is dropped and created again from
--                                         its current definition; program_control_status and the
--                                         daily posture snapshots read it by name, so they follow
--   program_control_status                says objectives_assessed for each control
--   plan_control_holdings                 says of each plan whether it holds every objective of the
--                                         control its program has not judged yet (holds_unjudged):
--                                         the step of a control judged in part opens the campaign
--                                         whose plan holds the rest
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- What a program's assessors have judged of each control, target by target.
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
  -- of one of the program's campaigns: what program_control_status_lines read before. Not assessed
  -- decides nothing.
  judged as materialized (
    select distinct on (f.target_control_part_id) cp.control_id, cp.id as part_id,
      cp.name = 'assessment-objective' as objective, f.determination
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
  -- Each counted objective with itself and every objective above it. Sixteen levels bound a broken
  -- chain; the catalog nests four.
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
  -- What judges each target: a determination on a part that is not one of the control's objectives
  -- judges every target of it; one on an objective, that objective and every objective under it;
  -- and a control that counts no objective is judged by a determination on any of its parts.
  verdict as (
    select k.control_id, k.id as objective_id, j.determination
    from counted k
    join judged j on j.control_id = k.control_id and not j.objective
    union all
    select k.control_id, k.id, j.determination
    from reach r
    join counted k on k.id = r.counted_id
    join judged j on j.part_id = r.part_id
    union all
    select c.id, null::uuid, j.determination
    from control c
    join judged j on j.control_id = c.id
    where not exists (select 1 from counted k where k.control_id = c.id)
  )
  select v.control_id, v.objective_id,
    case
      when bool_or(v.determination = 'other_than_satisfied') then 'other_than_satisfied'
      when bool_or(v.determination = 'partially_satisfied') then 'partially_satisfied'
      else 'satisfied'
    end
  from verdict v
  group by v.control_id, v.objective_id;
end; $$;
revoke all on function public.program_control_objective_judgments(uuid, uuid[]) from public, anon;
grant execute on function public.program_control_objective_judgments(uuid, uuid[]) to authenticated;
comment on function public.program_control_objective_judgments(uuid, uuid[]) is 'Internal: each target of the named controls the program''s assessors have judged (each assessment objective a control counts, a leaf or a heading that prints a sentence of its own, as program_control_objective_cover counts them; or, objective_id null, the control itself where it counts none), with the worst of the determinations that judge it. A target is judged by the latest determination, other than not assessed, in a published results revision of one of the program''s campaigns on a part of its control: a part that is not one of the control''s objectives (its statement, an item of its text) judges every target of the control, an objective judges itself and every objective under it, and any part judges a control that counts no objective. A target nobody has judged has no row. Security invoker: a program the caller cannot read is refused. program_control_status_lines and plan_control_holdings read it.';

-- ---------------------------------------------------------------------------------------------
-- One line a control of a program's control baseline, as program_control_status counts it: the
-- body of 20261114072913_every_system_counts, with a program determination only once every target
-- is judged, and each control's objectives judged. The answer gains a column, so the function is
-- dropped and created again; its readers are PL/pgSQL and find it by name.
-- ---------------------------------------------------------------------------------------------
drop function if exists public.program_control_status_lines(uuid);
create function public.program_control_status_lines(p_program_id uuid)
returns table (
  id uuid, code text, title text, parent_control_id uuid, code_order text,
  family text, family_title text, requirements bigint, evidenced bigint,
  status text, determined_by text, product_assessments jsonb,
  objectives bigint, objectives_mapped bigint, objectives_evidenced bigint,
  objectives_assessed bigint
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
comment on function public.program_control_status_lines(uuid) is 'Internal: one line a control of a program''s control baseline, as program_control_status answers it (its status, the requirements that map it and how many cite evidence, its assessment objectives with how many are mapped, how many evidenced and how many judged, whose determination and the product assessments behind a product''s), asking nothing of who calls but that row-level security lets them read the program. A target (each objective, or the control itself where it counts none) is mapped once covered on every system of the program whose control baseline selects the control, and evidenced once covered on every one by a requirement that cites evidence (program_control_objective_cover); a control leaves no requirement once every target is mapped and no evidence once every one is evidenced. The program''s assessors decide a control once they have judged every target (program_control_objective_judgments), with the worst of their determinations; until then the product''s determination decides where every variant inherits the control, else the ladder. Security invoker. program_control_status and the posture snapshots count from it.';

-- ---------------------------------------------------------------------------------------------
-- One status for each control of a program's control baseline: the live body, with each control's
-- objectives judged.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_control_status(p_program_id uuid)
returns jsonb
language plpgsql stable set search_path = '' as $$
declare answer jsonb; v_tenant uuid;
begin
  select p.tenant_id into v_tenant from public.programs p where p.id = p_program_id;
  if auth.uid() is null or v_tenant is null then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  with line as materialized (
    select * from public.program_control_status_lines(p_program_id)
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
      ) order by l.family nulls last, l.code_order collate "C", l.id), '[]'::jsonb)
      from line l)
  ) into answer;
  return answer;
end; $$;
comment on function public.program_control_status(uuid) is 'One status for each control of a program''s control baseline: once an assessor of the program has judged every assessment objective the control counts (the control itself, for one with none), the worst of the latest determinations they published on its parts, a determination on a part that is not one of its objectives (its statement, an item of its text) judging every objective; else, where every product variant of the program inherits the control with a determination, the worst of the product''s determinations; else not assessed, no evidence or no requirement, counted on every system of the program whose control baseline selects the control (each of its authorization boundaries that does; the program as a whole where none does): no requirement until every objective of the control (the control itself, for one with none) is covered on every such system, no evidence until each is covered on every one by a requirement that cites evidence. Each control says whose determination its status is (determined_by: program or product) and the product assessments behind a product''s, with the program''s requirements that map it and how many of them cite evidence, and its objectives (objectives), how many are covered on every system (objectives_mapped), how many with evidence on every one (objectives_evidenced) and how many an assessor of the program has judged (objectives_assessed). Security invoker: a program the reader cannot read is refused. The lines are program_control_status_lines''s, which the posture snapshots count too.';

-- ---------------------------------------------------------------------------------------------
-- What the named plans hold of one control: the live body, with whether each holds what its
-- program has not judged yet.
-- ---------------------------------------------------------------------------------------------
create or replace function public.plan_control_holdings(p_tenant_id uuid, p_control_id uuid, p_plan_revision_ids uuid[])
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare answer jsonb;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  if p_control_id is null then
    raise exception 'Name the control' using errcode = '22023';
  end if;
  if cardinality(coalesce(p_plan_revision_ids, '{}')) > 500 then
    raise exception 'Name at most 500 assessment plans' using errcode = '22023';
  end if;
  with
  -- The plans named that the reader reads in the workspace, each with its campaign's program; any
  -- other is left out.
  plan as (
    select r.id, g.program_id
    from public.assessment_plan_revisions r
    join public.assessment_campaigns g on g.tenant_id = r.tenant_id and g.id = r.campaign_id
    where r.tenant_id = p_tenant_id and r.id = any(coalesce(p_plan_revision_ids, '{}'))
  ),
  holding as materialized (
    select h.plan_revision_id, h.part_id, h.objective, h.held
    from public.assessment_plan_control_parts(array(select p.id from plan p), array[p_control_id]) h
  ),
  -- What each plan's program has judged of the control: the objectives it counts that an
  -- assessor's latest published results judge, or the control itself (no objective) where it
  -- counts none.
  judged as materialized (
    select w.program_id, j.objective_id
    from (select distinct p.program_id from plan p) w
    cross join lateral public.program_control_objective_judgments(w.program_id, array[p_control_id]) j
  )
  select jsonb_build_object(
    'control_id', p_control_id,
    'objectives', (select count(*) from public.control_assessment_parts(array[p_control_id]) a where a.objective),
    'plans', coalesce((
      select jsonb_agg(jsonb_build_object(
        'plan_revision_id', p.id,
        'objectives_held', (select count(*) from holding h where h.plan_revision_id = p.id and h.objective and h.held),
        'holds', coalesce((select bool_and(h.held) from holding h where h.plan_revision_id = p.id), false),
        -- What is left to judge of the control: each part an assessment of it takes (an objective
        -- it counts, or its statement for one that counts none) that the plan's program has not
        -- judged. The plan holds all of it; nothing left is held.
        'holds_unjudged', coalesce((select bool_and(h.held) from holding h
          where h.plan_revision_id = p.id
            and not exists (select 1 from judged j
              where j.program_id = p.program_id
                and j.objective_id is not distinct from (case when h.objective then h.part_id end))), true)
      ) order by p.id)
      from plan p), '[]'::jsonb)
  ) into answer;
  return answer;
end; $$;
revoke all on function public.plan_control_holdings(uuid, uuid, uuid[]) from public, anon;
grant execute on function public.plan_control_holdings(uuid, uuid, uuid[]) to authenticated;
comment on function public.plan_control_holdings(uuid, uuid, uuid[]) is 'What the named assessment plans hold of one control, for its next step and Add to assessment campaign''s picker: objectives (how many assessment objectives the control counts, none for a control written as its statement) and, for each plan named that the reader reads in the workspace, objectives_held (how many of them the plan holds: an objective aimed at it, at an objective above it, or at the control''s statement), holds (the plan holds every one, or the statement, so the control takes nothing more) and holds_unjudged (the plan holds every objective of the control its campaign''s program has not judged yet, program_control_objective_judgments; the whole control while none is judged, and true once nothing is left), which the step of a control judged in part follows to the campaign whose plan holds the rest. Security invoker.';

notify pgrst, 'reload schema';
