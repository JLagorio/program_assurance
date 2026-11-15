-- One-control reads faster: a control's objectives, a risk's countering controls and the catalog
-- control's programs answer as before, in less time (Josef, 2026-11-15: "One-control reads
-- faster").
--
-- Every row these reads touch is checked by row-level security as the reader, one call of
-- can_read_tenant a row (about 5 microseconds), so a read is as slow as the rows it touches.
-- Measured as a member on WS-X90 and PRG-2101, one control's reads spent most of their time outside
-- the coverage read:
--
--   program_control_objectives   its allocated step (how many requirements are allocated in each
--                                system that selects the control) read each allocation of the
--                                boundary with its revision, its requirement and its requirement's
--                                latest version, asked again for each allocation: 1,328 allocations
--                                on WS-X90, about 4,000 rows for one control. It now reads each
--                                allocation once and each revision allocated once, and asks only
--                                whether a later version of its requirement is recorded
--   risk_threats                 counted each countering control's requirements from a read of its
--                                own (every mapping of the workspace, then a revision, its
--                                requirement and its latest version for each mapping of a
--                                countering control), beside the coverage read that reads the same
--                                mappings. It now counts them from the coverage read's own rows
--                                (program_control_coverage's mapping rows), read once with the
--                                objectives
--   control_objective_counts     read the coverage of every program named, though a program whose
--                                requirements map the control on no revision covers none of its
--                                objectives and answers as any other such program does. It now
--                                reads each program that maps the control and one that does not,
--                                which stands for the rest: AC-2 is read for 2 of the developer
--                                workspace's 13 programs
--   the mappings                 had no index by control, so a read of a few controls' mappings
--                                read every mapping of the workspace's index.
--                                requirement_control_links (tenant_id, control_id) keeps that read
--                                to the controls' own mappings as the workspace grows
--
-- system_effective_baselines is not changed. It walks every system of the workspace whichever
-- systems a read names, since a view cannot take them into its recursive walk, and costs about 1 to
-- 2 ms a read on the developer workspace. Walked one system at a time it took about 4 ms over every
-- system (1 ms now) and longer over a program's 28 systems, and walked down from the systems that
-- adopt a baseline it was no faster, so it stays the one rule every reader shares.
--
-- No answer changes: program_control_objectives (4,013 reads: every control of every program's
-- control baseline and every control its requirements map), risk_threats (every risk) and
-- control_objective_counts (643 controls in every program of their workspace, and 658 with one
-- program, none, or the list reversed with a duplicate) answered the same old and new, read side by
-- side in one snapshot as a member of each workspace, 5,383 reads, and so did their refusals. On
-- WS-X90, as a member, side by side on a loaded machine: program_control_objectives for AC-2 about
-- 44 to 24 ms, risk_threats for a risk of two techniques 82 to 56, and control_objective_counts for
-- AC-2 in 13 programs 151 to 102. What is left of the counts, the holdings and the threats is mostly
-- program_control_objective_judgments. A Posture cell still places every control of the program for
-- one cell: placing only the cell's controls needs a placement read by control, which this schema
-- does not have yet.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- The mappings of a few controls, read by control.
-- ---------------------------------------------------------------------------------------------
create index if not exists requirement_control_links_control_idx
  on public.requirement_control_links (tenant_id, control_id);

-- ---------------------------------------------------------------------------------------------
-- One control's objectives and systems: the live body of 20261114072913_every_system_counts, with
-- its allocated step reading each allocation and each revision once.
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
  -- The program's systems inside them whose control baseline selects the control: where a
  -- requirement allocated in one of them can be mapped.
  holder as materialized (
    select y.tenant_id, y.id, y.boundary_system_id
    from public.systems y
    join public.system_effective_baselines b on b.tenant_id = y.tenant_id and b.system_id = y.id
    join public.selected_controls sc
      on sc.profile_resolution_id = b.profile_resolution_id and sc.control_id = p_control_id
    where y.program_id = p_program_id
      and y.boundary_system_id in (select s.id from system s)
  ),
  -- The requirement revisions allocated to them, each once a boundary: every allocation read once,
  -- never a revision and its requirement's latest version asked again for each allocation.
  allotted as materialized (
    select distinct h.boundary_system_id, a.tenant_id, a.requirement_revision_id
    from holder h
    join public.requirement_allocations a on a.tenant_id = h.tenant_id and a.system_id = h.id
  ),
  -- Those that are their requirement's latest revision, each read once: no later version of the
  -- requirement is recorded.
  latest as materialized (
    select v.id, v.engineering_requirement_id
    from (select distinct t.tenant_id, t.requirement_revision_id from allotted t) t
    join public.requirement_revisions v on v.tenant_id = t.tenant_id and v.id = t.requirement_revision_id
    where not exists (select 1 from public.requirement_revisions x
      where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id
        and x.version_number > v.version_number)
  ),
  -- How many of the program's requirements, at their latest revision, are allocated in each of
  -- them (to it, or to a system inside it whose control baseline selects the control): those a
  -- mapping on it can be recorded for.
  allocated as (
    select t.boundary_system_id as system_id, count(distinct l.engineering_requirement_id) as requirements
    from allotted t
    join latest l on l.id = t.requirement_revision_id
    group by t.boundary_system_id
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

-- ---------------------------------------------------------------------------------------------
-- What a risk concerns and what counters it: the live body of 20261114165512_latest_per_objective,
-- counting each countering control's requirements from the coverage read it reads anyway.
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
  -- What the program's requirements cover of the controls and which of them map each, read once for
  -- every control as the control status reads them (program_control_coverage: a requirement
  -- counts at its latest revision, and evidence once that revision cites an evidence version); read
  -- only where a standing can be said and a control is listed.
  coverage as materialized (
    select o.control_id, o.objective_id, o.system_id, o.requirement_id, o.evidenced, o.mapping
    from public.program_control_coverage(v_program, array(select c.id from control c)) o
    where v_counted and exists (select 1 from control)
  ),
  -- The program's requirements whose latest revision maps each control, and those of them that cite
  -- evidence.
  mapped as (
    select o.control_id,
      count(distinct o.requirement_id) as requirements,
      count(distinct o.requirement_id) filter (where o.evidenced) as evidenced
    from coverage o
    where o.mapping
    group by o.control_id
  ),
  -- How many of each control's assessment objectives the program's requirements cover, and how many
  -- they cover with evidence, counted as its control status counts them: an objective is mapped once
  -- covered on every system of the program whose control baseline selects the control, and
  -- evidenced once covered on every one by a requirement that cites evidence. A control that counts
  -- no objective counts none.
  spot as (
    select o.control_id, o.objective_id, o.system_id,
      bool_or(o.requirement_id is not null) as covered,
      bool_or(o.evidenced) as evidenced
    from coverage o
    where not o.mapping and o.objective_id is not null
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
  -- How many of them its assessors have judged (program_control_objective_judgments: judged once a
  -- published determination decides it), read once for every control.
  judged as (
    select j.control_id, count(j.objective_id) as assessed
    from public.program_control_objective_judgments(v_program, array(select c.id from control c)) j
    where v_counted and exists (select 1 from control)
    group by j.control_id
  ),
  -- The controls a control baseline of the program selects: any of the baselines it adopted.
  selected as (
    select distinct sc.control_id
    from public.program_reference_choices c
    join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
    where v_baseline and c.tenant_id = p_tenant_id and c.program_id = v_program
      and sc.control_id in (select id from control)
  ),
  -- Each control's standing; empty where no standing can be said.
  line as (
    select c.id, c.code, c.title, public.natural_sort_key(c.code) collate "C" as code_order,
      case when v_baseline then exists (select 1 from selected s where s.control_id = c.id) end as in_baseline,
      case when v_counted then coalesce(m.requirements, 0) end as requirements,
      case when v_counted then coalesce(m.evidenced, 0) end as evidenced,
      case when v_counted then coalesce(v.objectives, 0) end as objectives,
      case when v_counted then coalesce(v.mapped, 0) end as objectives_mapped,
      case when v_counted then coalesce(v.evidenced, 0) end as objectives_evidenced,
      case when v_counted then
        case when coalesce(v.objectives, 0) > 0 then coalesce(a.assessed, 0) else 0 end end as objectives_assessed
    from control c
    left join mapped m on m.control_id = c.id
    left join cover v on v.control_id = c.id
    left join judged a on a.control_id = c.id
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
        'in_baseline', l.in_baseline, 'requirements', l.requirements, 'evidenced', l.evidenced,
        'objectives', l.objectives, 'objectives_mapped', l.objectives_mapped,
        'objectives_evidenced', l.objectives_evidenced, 'objectives_assessed', l.objectives_assessed
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
  return answer;
end; $$;
revoke all on function public.risk_threats(uuid, uuid) from public, anon;
grant execute on function public.risk_threats(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- One control's objectives in several programs: the live body of 20261114165512_latest_per_objective,
-- reading the coverage of each program that maps the control and of one that does not.
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
  -- The programs named whose requirements map the control, on any of their revisions: the only
  -- ones whose coverage of it can differ. Every other program's requirements cover none of its
  -- objectives, so each of them answers as any one of them does.
  mapping as materialized (
    select distinct q.program_id as id
    from (select distinct p.tenant_id from public.programs p where p.id in (select id from program)) w
    join public.requirement_control_links l on l.tenant_id = w.tenant_id and l.control_id = p_control_id
    join public.requirement_revisions v on v.tenant_id = l.tenant_id and v.id = l.requirement_revision_id
    join public.engineering_requirements q on q.tenant_id = v.tenant_id and q.id = v.engineering_requirement_id
    where q.program_id in (select id from program)
  ),
  -- The programs whose coverage is read: each that maps the control, and the first that does not,
  -- which stands for the rest.
  asked as materialized (
    select m.id from mapping m
    union all
    (select p.id from program p where p.id not in (select id from mapping) order by p.id limit 1)
  ),
  -- Each objective of the control in each of those programs, on each system it is counted on.
  spot as (
    select p.id as program_id, o.objective_id, o.system_id,
      bool_or(o.requirement_id is not null) as covered,
      bool_or(o.evidenced) as evidenced
    from asked p
    cross join lateral public.program_control_objective_cover(p.id, array[p_control_id]) o
    where o.objective_id is not null
    group by p.id, o.objective_id, o.system_id
  ),
  -- Each program's coverage of the control, counted as its control status counts it: an objective
  -- mapped once covered on every system, and evidenced once evidenced on every one.
  counted as materialized (
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
  -- Each program named with the program whose coverage it answers with: its own where it maps the
  -- control, else the one that stands for the rest.
  reading as (
    select p.id, case when p.id in (select id from mapping) then p.id
      else (select a.id from asked a where a.id not in (select id from mapping)) end as read_id
    from program p
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
      from reading p
      left join counted k on k.program_id = p.read_id
      left join judged a on a.program_id = p.id), '[]'::jsonb)
  ) into answer;
  return answer;
end; $$;
revoke all on function public.control_objective_counts(uuid, uuid[]) from public, anon;
grant execute on function public.control_objective_counts(uuid, uuid[]) to authenticated;

notify pgrst, 'reload schema';
