-- Latest per objective: an objective's latest determination decides it; and the objectives a
-- control counts on two more screens.
--
-- A program's assessors decide a control once they have judged every assessment objective it
-- counts (20261114144036_not_assessed_until_all). An objective is judged by a determination on
-- it, on an objective above it or on a part of the control that is not one of its objectives (its
-- statement, an item of its text), and each of those parts' latest determination stood on its own:
-- the objective read the worst of them. A statement found other than satisfied in March, then each
-- objective found satisfied in June, left the control other than satisfied for good. The latest
-- now wins objective by objective (Josef, 2026-11-14: "Latest per objective"):
--
--   an objective                 is decided by the newest of the determinations that judge it:
--                                its own latest, the latest on each objective above it and the
--                                latest on each part of the control that is not one of its
--                                objectives. Newest is the moment the determination was made
--                                (determined_at; one with none is the oldest), then the moment it
--                                was recorded; two made at the same moment fall to the nearer part
--                                (the objective, then the objective right above it, then the
--                                statement), then to the worse determination
--   a control that counts none   is decided by the newest determination on any of its parts
--   the control                  reads the worst of its objectives' determinations, once every one
--                                is judged, as before. Not assessed, and a result left in draft,
--                                still decide nothing
--
-- Every published finding so far targets a control's statement, which judges every objective of
-- its control with the one latest determination on it, so no status moves.
--
-- Objectives on more screens (Josef, 2026-11-14: "Objectives on more screens"):
--
--   risk_threats               each countering control also says objectives_evidenced and
--                              objectives_assessed, counted as program_control_status counts them
--   control_objective_counts   each program also says objectives_assessed
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- What a program's assessors have judged of each control, target by target: the live body of
-- 20261114144036_not_assessed_until_all, with each target decided by the newest determination
-- that judges it rather than the worst.
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
  -- Each counted objective with itself (depth 1) and every objective above it, the nearer first.
  -- Sixteen levels bound a broken chain; the catalog nests four.
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
    select k.control_id, k.id, j.determination, j.determined_at, j.created_at, j.finding_id, r.depth
    from reach r
    join counted k on k.id = r.counted_id
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
comment on function public.program_control_objective_judgments(uuid, uuid[]) is 'Internal: each target of the named controls the program''s assessors have judged (each assessment objective a control counts, a leaf or a heading that prints a sentence of its own, as program_control_objective_cover counts them; or, objective_id null, the control itself where it counts none), with the determination that decides it. A target is judged by a determination, other than not assessed, in a published results revision of one of the program''s campaigns on a part of its control: a part that is not one of the control''s objectives (its statement, an item of its text) judges every target of the control, an objective judges itself and every objective under it, and any part judges a control that counts no objective. Of the latest determination on each such part, the newest decides the target (by determined_at, one with none the oldest, then by when it was recorded; at the same moment the nearer part''s, the objective''s own before one above it and both before the statement''s, then the worse). A target nobody has judged has no row. Security invoker: a program the caller cannot read is refused. program_control_status_lines, risk_threats, control_objective_counts and plan_control_holdings read it.';

-- The status read's words, for the newest determination of each objective; their bodies read the
-- judgments by name, so they follow.
comment on function public.program_control_status_lines(uuid) is 'Internal: one line a control of a program''s control baseline, as program_control_status answers it (its status, the requirements that map it and how many cite evidence, its assessment objectives with how many are mapped, how many evidenced and how many judged, whose determination and the product assessments behind a product''s), asking nothing of who calls but that row-level security lets them read the program. A target (each objective, or the control itself where it counts none) is mapped once covered on every system of the program whose control baseline selects the control, and evidenced once covered on every one by a requirement that cites evidence (program_control_objective_cover); a control leaves no requirement once every target is mapped and no evidence once every one is evidenced. The program''s assessors decide a control once they have judged every target (program_control_objective_judgments, where the newest determination that judges a target decides it), with the worst of the targets'' determinations; until then the product''s determination decides where every variant inherits the control, else the ladder. Security invoker. program_control_status and the posture snapshots count from it.';
comment on function public.program_control_status(uuid) is 'One status for each control of a program''s control baseline: once an assessor of the program has judged every assessment objective the control counts (the control itself, for one with none), the worst of its objectives'' determinations, each objective decided by the newest of the latest determinations published on it, on an objective above it and on a part that is not one of its objectives (its statement, an item of its text, which judges every objective); else, where every product variant of the program inherits the control with a determination, the worst of the product''s determinations; else not assessed, no evidence or no requirement, counted on every system of the program whose control baseline selects the control (each of its authorization boundaries that does; the program as a whole where none does): no requirement until every objective of the control (the control itself, for one with none) is covered on every such system, no evidence until each is covered on every one by a requirement that cites evidence. Each control says whose determination its status is (determined_by: program or product) and the product assessments behind a product''s, with the program''s requirements that map it and how many of them cite evidence, and its objectives (objectives), how many are covered on every system (objectives_mapped), how many with evidence on every one (objectives_evidenced) and how many an assessor of the program has judged (objectives_assessed). Security invoker: a program the reader cannot read is refused. The lines are program_control_status_lines''s, which the posture snapshots count too.';

-- ---------------------------------------------------------------------------------------------
-- What a risk concerns and what counters it: the live body, with each countering control's
-- objectives with evidence and judged beside those mapped.
-- ---------------------------------------------------------------------------------------------
create or replace function public.risk_threats(p_tenant_id uuid, p_risk_id uuid)
returns jsonb
language plpgsql stable set search_path = '' as $$
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
  -- How many of each control's assessment objectives the program's requirements cover, how many
  -- they cover with evidence and how many its assessors have judged, counted as its control status
  -- counts them (program_control_objective_cover: an objective is mapped once covered on every
  -- system of the program whose control baseline selects the control, and evidenced once covered on
  -- every one by a requirement that cites evidence; program_control_objective_judgments: judged once
  -- a published determination decides it), in one read of each for every control; empty where no
  -- standing can be said, as its requirements are. A control that counts no objective counts none
  -- of either.
  if v_counted and jsonb_array_length(answer->'controls') > 0 then
    with listed as materialized (
      select array_agg((c->>'id')::uuid) as ids from jsonb_array_elements(answer->'controls') c
    ),
    spot as (
      select o.control_id, o.objective_id, o.system_id,
        bool_or(o.requirement_id is not null) as covered,
        bool_or(o.evidenced) as evidenced
      from public.program_control_objective_cover(v_program, (select ids from listed)) o
      where o.objective_id is not null
      group by o.control_id, o.objective_id, o.system_id
    ),
    cover as (
      select t.control_id, count(*) as objectives,
        count(*) filter (where t.mapped) as mapped,
        count(*) filter (where t.evidenced) as evidenced
      from (
        select s.control_id, s.objective_id, bool_and(s.covered) as mapped, bool_and(s.evidenced) as evidenced
        from spot s
        group by s.control_id, s.objective_id
      ) t
      group by t.control_id
    ),
    judged as (
      select j.control_id, count(j.objective_id) as assessed
      from public.program_control_objective_judgments(v_program, (select ids from listed)) j
      group by j.control_id
    )
    select jsonb_set(answer, '{controls}', jsonb_agg(c.line || jsonb_build_object(
        'objectives', coalesce(v.objectives, 0),
        'objectives_mapped', coalesce(v.mapped, 0),
        'objectives_evidenced', coalesce(v.evidenced, 0),
        'objectives_assessed', case when coalesce(v.objectives, 0) > 0 then coalesce(a.assessed, 0) else 0 end)
        order by c.n))
      into answer
    from jsonb_array_elements(answer->'controls') with ordinality c(line, n)
    left join cover v on v.control_id = (c.line->>'id')::uuid
    left join judged a on a.control_id = (c.line->>'id')::uuid;
  else
    select jsonb_set(answer, '{controls}', coalesce(jsonb_agg(c.line || jsonb_build_object(
        'objectives', null, 'objectives_mapped', null, 'objectives_evidenced', null,
        'objectives_assessed', null) order by c.n), '[]'::jsonb))
      into answer
    from jsonb_array_elements(answer->'controls') with ordinality c(line, n);
  end if;
  return answer;
end; $$;
revoke all on function public.risk_threats(uuid, uuid) from public, anon;
grant execute on function public.risk_threats(uuid, uuid) to authenticated;
comment on function public.risk_threats(uuid, uuid) is 'What a risk concerns and what counters it: the ATT&CK techniques the risk names (code, title, framework and tactics, from the reference frameworks nist-sp800-160v2r1-attack, ATT&CK for Enterprise, and nist-sp800-160v2r1-attack-ics, ATT&CK for ICS), and the controls NIST SP 800-160 Vol. 2 Rev. 1 Appendices F and G print against them, each once in the catalog''s order with the techniques it counters, its approaches and its effects. For each control, where the risk''s program stands: in_baseline (a control baseline the program adopted selects it), requirements (the program''s requirements whose latest revision maps it), evidenced (those whose latest revision cites an evidence version), objectives (the assessment objectives the control counts), objectives_mapped (those the program''s requirements cover on every system of the program whose control baseline selects the control), objectives_evidenced (those covered on every one by a requirement that cites evidence) and objectives_assessed (those an assessor of the program has judged), each counted as program_control_status counts them; empty where no standing can be said. loaded says whether the reference data is there; totals count the techniques, the controls and the controls in the baseline, with a requirement and with evidence.';

-- ---------------------------------------------------------------------------------------------
-- One control's objectives in several programs: the live body, with how many each program's
-- assessors have judged.
-- ---------------------------------------------------------------------------------------------
create or replace function public.control_objective_counts(p_control_id uuid, p_program_ids uuid[])
returns jsonb
language plpgsql stable set search_path = '' as $$
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
  ),
  -- How many of the objectives each program's assessors have judged, as its control status counts
  -- them: a control that counts none counts none judged.
  judged as (
    select p.id as program_id, count(j.objective_id) as assessed
    from program p
    cross join lateral public.program_control_objective_judgments(p.id, array[p_control_id]) j
    group by p.id
  )
  select jsonb_build_object(
    'control_id', p_control_id,
    'programs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'program_id', p.id,
        'objectives', coalesce(k.objectives, 0),
        'objectives_mapped', coalesce(k.mapped, 0),
        'objectives_evidenced', coalesce(k.evidenced, 0),
        'objectives_assessed', case when coalesce(k.objectives, 0) > 0 then coalesce(a.assessed, 0) else 0 end
      ) order by p.id)
      from program p
      left join counted k on k.program_id = p.id
      left join judged a on a.program_id = p.id), '[]'::jsonb)
  ) into answer;
  return answer;
end; $$;
revoke all on function public.control_objective_counts(uuid, uuid[]) from public, anon;
grant execute on function public.control_objective_counts(uuid, uuid[]) to authenticated;
comment on function public.control_objective_counts(uuid, uuid[]) is 'One control''s assessment objectives counted in each program named, for the catalog control''s table of the workspace''s programs: objectives (how many the control counts: its leaves and each heading that prints a sentence of its own), objectives_mapped (how many the program''s requirements, at their latest revision, cover on every system of the program whose control baseline selects the control), objectives_evidenced (how many are covered on every one by a requirement that cites evidence) and objectives_assessed (how many an assessor of the program has judged), counted as program_control_status counts them (program_control_objective_cover, program_control_objective_judgments). A control with no objective counts none. Security invoker: a program the reader cannot read is refused.';

notify pgrst, 'reload schema';
