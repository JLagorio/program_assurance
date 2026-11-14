-- The Posture counts assessment objectives instead of requirements (Josef, 2026-11-14: "Posture by
-- objective").
--
-- The program's Posture counted requirements: a requirement stood at every element it was allocated
-- to and each element holding that one, under the family of every control it mapped, and a cell read
-- Requirements or Requirements without evidence. Since 20261114030116_objective_level_derivation a
-- control counts its assessment objectives and a requirement maps a whole control or some of them,
-- and since 20261114150844_mapping_systems every mapping names the system it is on. So a cell now
-- counts the objectives the mappings place there:
--
--   an element's objectives  those of the controls its control baseline selects
--                            (system_effective_baselines), counted as a control counts them: each
--                            leaf, and each heading that prints a sentence of its own, as
--                            program_control_objective_cover counts them
--   where a mapping stands   on the element it names, where that element's control baseline selects
--                            the control. One that names no element stands on each element its
--                            requirement's latest revision is allocated to whose baseline selects
--                            the control, where Map a requirement would have put it. Anywhere else
--                            it is not placed
--   what it covers there     the objective it names and every one under it; every objective of the
--                            control where it names none, a statement of the control's text or a
--                            part that is not one of its objectives
--   a cell                   an element with the elements inside it, by a control family (or a
--                            resiliency technique): the family's objectives the mappings there
--                            cover, each once, and of those the ones no requirement that cites
--                            evidence covers there. An element that holds others pools them: an
--                            objective one of its elements covers with evidence has evidence there,
--                            as a boundary has in the control status, so on a program of one
--                            authorization boundary the boundary's row reads as its control status
--   a line, the totals       each objective once
--   the band                 the program's control baseline as its control status counts it, through
--                            program_control_objective_cover: its objectives, those mapped (covered
--                            on every system that selects the control) and those evidenced (evidenced
--                            on every one), so the band and the Control status view always agree
--   by technique             an objective stands under every technique its control supports in
--                            Table E-1, and counts once on a line
--   issues and risks         still records: an open issue stands where the requirements it names and
--                            those its evidence supports stand, an open risk where its issues stand,
--                            and a requirement stands where its mappings stand (on the element, under
--                            the family or the techniques of the control mapped there), no longer on
--                            every element it is allocated to under every family it maps
--
-- program_objective_placement is the one read of where the mappings stand and what they cover, which
-- the four posture reads share. Every read stays one request, and every return type stays jsonb.

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
  -- What each of those baselines selects of the controls mapped, read once a baseline: the
  -- elements of a program share a few, and a selection read an element is read under row-level
  -- security as many times over.
  selects as materialized (
    select distinct sc.profile_resolution_id, sc.control_id
    from public.selected_controls sc
    where sc.profile_resolution_id in (select b.profile_resolution_id from base b)
      and sc.control_id in (select m.control_id from mapping m)
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
comment on function public.program_objective_placement(uuid) is 'Internal to the posture reads, as the caller: where each mapping of a program''s requirements (at their latest revisions) stands and what it covers there. A mapping stands on the element it names where that element''s effective control baseline selects the control; one that names no element on each element its requirement is allocated to whose baseline selects it; elsewhere it is not placed. It covers the objective it names and every one under it, or every objective its control counts (each leaf, and each heading that prints a sentence of its own) where it names none, a statement or a part that is not an objective. One row an element, requirement, control and objective covered, with whether the requirement cites evidence and how many objectives the control counts; a control that counts none answers one row with no objective. A program the caller cannot read is refused.';

-- ---------------------------------------------------------------------------------------------
-- The posture by control family.
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
  -- baseline's selection is read once, however many elements share it.
  family as (
    select g.id, upper(g.source_id) as code, g.title, g.ordinal
    from public.catalog_groups g
    where g.id in (
      select x.group_id
      from public.selected_controls sc
      join public.controls x on x.id = sc.control_id
      where sc.profile_resolution_id in (
        select b.profile_resolution_id from public.system_effective_baselines b
        where b.tenant_id = p_tenant_id and b.system_id in (select id from el))
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
comment on function public.program_posture(uuid, uuid) is 'A program''s posture: its system elements by control family, each cell the family''s assessment objectives the program''s requirement mappings cover on the element and the elements inside it (each once), those with evidence (covered there by a requirement that cites evidence), and the open operational issues and open risks that stand there. A mapping stands on the element it names, where that element''s control baseline selects the control (program_objective_placement); a requirement stands where its mappings stand, an open issue where the requirements it names and those its evidence supports stand, and an open risk where its issues stand. Every family the elements'' baselines hold is listed. totals.objectives, mapped and evidenced are the program''s control baseline as its control status counts it; placed is how many objectives the grid places; unplaced how many requirements map a control and stand on no element.';

-- ---------------------------------------------------------------------------------------------
-- What stands in one cell of the posture by control family.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_posture_cell(
  p_tenant_id uuid,
  p_program_id uuid,
  p_element_id uuid default null,
  p_family_id uuid default null
) returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare answer jsonb;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.programs p where p.id = p_program_id and p.tenant_id = p_tenant_id) then
    return jsonb_build_object('objectives', 0, 'evidenced', 0, 'controls', '[]'::jsonb,
      'unevidenced', '[]'::jsonb, 'unevidenced_count', 0, 'issues', '[]'::jsonb, 'risks', '[]'::jsonb);
  end if;
  with recursive
  -- The element and every element inside it; every element of the program when none is named.
  inside (id, depth) as (
    select s.id, 0 from public.systems s
    where s.tenant_id = p_tenant_id and s.program_id = p_program_id
      and (p_element_id is null or s.id = p_element_id)
    union
    select s.id, inside.depth + 1 from inside
    join public.systems s on s.tenant_id = p_tenant_id and s.program_id = p_program_id
      and s.parent_system_id = inside.id
    where inside.depth < 32
  ),
  cur as materialized (
    select distinct on (q.id) q.id as requirement_id, q.code, v.id as revision_id, v.title
    from public.engineering_requirements q
    join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
    where q.tenant_id = p_tenant_id and q.program_id = p_program_id
    order by q.id, v.version_number desc
  ),
  -- What the mappings on those elements cover of the family's controls.
  here as materialized (
    select pl.requirement_id, pl.control_id, pl.objective_id, pl.evidenced, pl.control_objectives
    from public.program_objective_placement(p_program_id) pl
    join public.controls x on x.id = pl.control_id
    where pl.system_id in (select id from inside)
      and x.group_id is not null and (p_family_id is null or x.group_id = p_family_id)
  ),
  -- Each objective once, with evidence where a requirement that cites evidence covers it there.
  pool as materialized (
    select h.control_id, h.objective_id, bool_or(h.evidenced) as evidenced
    from here h where h.objective_id is not null
    group by h.control_id, h.objective_id
  ),
  -- The requirements to evidence: those that cover an objective with no evidence there, each with
  -- how many such objectives it covers. Linking evidence to one of them gives them evidence.
  owing as materialized (
    select h.requirement_id, count(distinct h.objective_id) as objectives
    from here h
    join pool p on p.objective_id = h.objective_id and not p.evidenced
    group by h.requirement_id
  ),
  standing as (select distinct requirement_id from here),
  req_ev as (
    select distinct cur.requirement_id, ev.artifact_id
    from cur
    join standing on standing.requirement_id = cur.requirement_id
    join public.requirement_evidence re on re.tenant_id = p_tenant_id and re.requirement_revision_id = cur.revision_id
    join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
  ),
  cited as (select * from public.assurance_issue_evidence(p_tenant_id)),
  -- The issues that stand in the cell: those whose evidence supports one of its requirements, and
  -- those that name one.
  issue_here as (
    select cited.issue_id
    from cited join req_ev on req_ev.artifact_id = cited.artifact_id
    union
    select l.issue_id
    from public.issue_requirements l
    join standing on standing.requirement_id = l.engineering_requirement_id
    where l.tenant_id = p_tenant_id and l.program_id = p_program_id
  )
  select jsonb_build_object(
    'objectives', (select count(*) from pool),
    'evidenced', (select count(*) from pool where evidenced),
    -- The controls whose objectives stand there, each with how many of them and of all it counts.
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', x.id, 'code', x.code, 'title', x.title,
        'objectives', c.objectives, 'evidenced', c.evidenced, 'total', c.total
      ) order by public.natural_sort_key(x.code) collate "C", x.id), '[]'::jsonb)
      from (
        select h.control_id, count(distinct h.objective_id) as objectives,
          count(distinct h.objective_id) filter (where p.evidenced) as evidenced,
          max(h.control_objectives) as total
        from here h
        left join pool p on p.objective_id = h.objective_id
        group by h.control_id
      ) c
      join public.controls x on x.id = c.control_id),
    'unevidenced', (
      select coalesce(jsonb_agg(row.item order by row.objectives desc, row.sort_key, row.id), '[]'::jsonb)
      from (
        select jsonb_build_object('id', cur.requirement_id, 'code', cur.code, 'title', cur.title,
          'objectives', o.objectives) as item,
          o.objectives, public.natural_sort_key(cur.code) collate "C" as sort_key, cur.requirement_id as id
        from owing o join cur on cur.requirement_id = o.requirement_id
        order by o.objectives desc, public.natural_sort_key(cur.code) collate "C", cur.requirement_id
        limit 50
      ) row),
    'unevidenced_count', (select count(*) from owing),
    'issues', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', o.id, 'title', o.title, 'severity', o.severity, 'status', o.status
      ) order by array_position('{low,moderate,high,critical}'::text[], o.severity) desc nulls last,
        o.opened_at, o.id), '[]'::jsonb)
      from public.operational_issues o
      where o.tenant_id = p_tenant_id and o.program_id = p_program_id
        and o.status not in ('resolved', 'closed', 'cancelled')
        and o.id in (select issue_id from issue_here)),
    'risks', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', x.id, 'title', x.title, 'severity', x.severity, 'status', x.status
      ) order by x.severity_rank desc nulls last, x.title, x.id), '[]'::jsonb)
      from public.risk_rows x
      where x.tenant_id = p_tenant_id and x.program_id = p_program_id and x.status <> 'closed'
        and x.id in (
          select rests.risk_id from public.assurance_issue_risks(p_tenant_id) rests
          where rests.issue_id in (select issue_id from issue_here)))
  ) into answer;
  return answer;
end;
$$;

revoke all on function public.program_posture_cell(uuid, uuid, uuid, uuid) from public, anon;
grant execute on function public.program_posture_cell(uuid, uuid, uuid, uuid) to authenticated;
comment on function public.program_posture_cell(uuid, uuid, uuid, uuid) is 'What stands in one cell of a program''s posture (an element with the elements inside it, by a control family; either may be left out for a whole line): how many of the family''s assessment objectives the mappings there cover and how many with evidence, the controls whose objectives stand there (each with how many, how many with evidence and how many it counts), up to 50 requirements to evidence (they cite none and cover an objective no requirement with evidence covers there, most such objectives first) with how many there are, and its open operational issues (those naming one of its requirements or citing their evidence) and open risks, worst first.';

-- ---------------------------------------------------------------------------------------------
-- The posture by cyber resiliency technique.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_resiliency_posture(p_program_id uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  answer jsonb;
  -- The program's workspace, read as the caller: a program the caller cannot read has none.
  v_tenant uuid;
  -- The cyber resiliency constructs, by the code the importer gives their framework.
  v_framework constant text := 'nist-sp800-160v2r1-cref';
begin
  if auth.uid() is not null then
    select p.tenant_id into v_tenant from public.programs p where p.id = p_program_id;
  end if;
  if v_tenant is null then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  with recursive
  cur as materialized (
    select distinct on (q.id) q.id as requirement_id, v.id as revision_id
    from public.engineering_requirements q
    join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
    where q.tenant_id = v_tenant and q.program_id = p_program_id
    order by q.id, v.version_number desc
  ),
  el as materialized (
    select s.id, s.code, s.name, s.system_type, s.parent_system_id, s.is_authorization_boundary
    from public.systems s
    where s.tenant_id = v_tenant and s.program_id = p_program_id
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
  technique as (
    select i.code, i.title, i.ordinal
    from public.framework_item_rows i
    where i.framework_code = v_framework and i.tenant_id is null and i.kind = 'technique'
  ),
  -- Table E-1, read once: each control with the techniques its links are printed under. A link
  -- printed under no technique names one only when its item is a technique.
  support as materialized (
    select distinct s.control_id, technique.code as technique_code
    from public.framework_control_link_rows s
    join technique on technique.code = coalesce(s.technique_code, case when s.item_kind = 'technique' then s.item_code end)
    where s.framework_code = v_framework and s.tenant_id is null and s.relation = 'supports'
      and s.control_id is not null
  ),
  placement as materialized (
    select * from public.program_objective_placement(p_program_id)
  ),
  -- What stands under a technique: every placement of a control that supports it.
  under as materialized (
    select pl.system_id, pl.requirement_id, pl.objective_id, pl.evidenced, support.technique_code
    from placement pl
    join support on support.control_id = pl.control_id
  ),
  -- Each element's objectives under each technique: those the mappings on it and on the elements
  -- inside it cover, each once.
  pooled as materialized (
    select up.holder as system_id, u.technique_code, u.objective_id, bool_or(u.evidenced) as evidenced
    from under u
    join up on up.id = u.system_id
    where u.objective_id is not null
    group by up.holder, u.technique_code, u.objective_id
  ),
  cell as (
    select p.system_id, p.technique_code, count(*) as objectives, count(*) filter (where p.evidenced) as evidenced
    from pooled p group by p.system_id, p.technique_code
  ),
  -- Across the techniques: each element's own line, each objective once. An objective under three
  -- techniques is one objective here, and one under none is not on the line.
  line as (
    select t.system_id, count(*) as objectives, count(*) filter (where t.evidenced) as evidenced
    from (
      select p.system_id, p.objective_id, bool_or(p.evidenced) as evidenced
      from pooled p group by p.system_id, p.objective_id
    ) t
    group by t.system_id
  ),
  -- Down the elements: each objective once under each technique, and once under any.
  anywhere as materialized (
    select u.technique_code, u.objective_id, bool_or(u.evidenced) as evidenced
    from under u where u.objective_id is not null
    group by u.technique_code, u.objective_id
  ),
  tech_line as (
    select a.technique_code, count(*) as objectives, count(*) filter (where a.evidenced) as evidenced
    from anywhere a group by a.technique_code
  ),
  -- Where each requirement stands: on every element a mapping of it stands on and every element that
  -- holds that one, under each technique the control mapped there supports.
  req_cell as materialized (
    select distinct up.holder as system_id, u.technique_code, u.requirement_id
    from under u
    join up on up.id = u.system_id
  ),
  req_ev as (
    select distinct cur.requirement_id, ev.artifact_id
    from public.requirement_evidence re
    join cur on cur.revision_id = re.requirement_revision_id
    join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
    where re.tenant_id = v_tenant
  ),
  open_issue as (
    select o.id, array_position('{low,moderate,high,critical}'::text[], o.severity) as rank
    from public.operational_issues o
    where o.tenant_id = v_tenant and o.program_id = p_program_id
      and o.status not in ('resolved', 'closed', 'cancelled')
  ),
  open_risk as (
    select x.id, x.severity_rank as rank
    from public.risk_rows x
    where x.tenant_id = v_tenant and x.program_id = p_program_id and x.status <> 'closed'
  ),
  cited as (select * from public.assurance_issue_evidence(v_tenant)),
  -- Where every issue stands, open or not: the requirements its evidence supports, and the
  -- program's requirements it names.
  issue_place as (
    select cited.issue_id, req_ev.requirement_id
    from cited join req_ev on req_ev.artifact_id = cited.artifact_id
    union
    select l.issue_id, cur.requirement_id
    from public.issue_requirements l
    join cur on cur.requirement_id = l.engineering_requirement_id
    where l.tenant_id = v_tenant and l.program_id = p_program_id
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
    join public.assurance_issue_risks(v_tenant) rests on rests.risk_id = open_risk.id
    join issue_place on issue_place.issue_id = rests.issue_id
  ),
  cell_issue as (
    select rc.system_id, rc.technique_code, count(distinct ir.issue_id) as issues, max(ir.rank) as severity
    from req_cell rc join issue_req ir on ir.requirement_id = rc.requirement_id
    group by rc.system_id, rc.technique_code
  ),
  cell_risk as (
    select rc.system_id, rc.technique_code, count(distinct rr.risk_id) as risks, max(rr.rank) as severity
    from req_cell rc join risk_req rr on rr.requirement_id = rc.requirement_id
    group by rc.system_id, rc.technique_code
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
  tech_issue as (
    select rc.technique_code, count(distinct ir.issue_id) as issues, max(ir.rank) as severity
    from req_cell rc join issue_req ir on ir.requirement_id = rc.requirement_id
    group by rc.technique_code
  ),
  tech_risk as (
    select rc.technique_code, count(distinct rr.risk_id) as risks, max(rr.rank) as severity
    from req_cell rc join risk_req rr on rr.requirement_id = rc.requirement_id
    group by rc.technique_code
  ),
  -- The program's control baseline as its control status counts it, as program_posture reads it.
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
    -- Every technique the framework names, in its order: one nothing stands under says so.
    'techniques', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'code', technique.code, 'title', technique.title,
        'objectives', coalesce(tech_line.objectives, 0), 'evidenced', coalesce(tech_line.evidenced, 0),
        'issues', coalesce(tech_issue.issues, 0), 'issue_severity', tech_issue.severity,
        'risks', coalesce(tech_risk.risks, 0), 'risk_severity', tech_risk.severity
      ) order by technique.ordinal, technique.code), '[]'::jsonb)
      from technique
      left join tech_line on tech_line.technique_code = technique.code
      left join tech_issue on tech_issue.technique_code = technique.code
      left join tech_risk on tech_risk.technique_code = technique.code),
    'cells', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'element_id', k.system_id, 'technique_code', k.technique_code,
        'objectives', coalesce(cell.objectives, 0), 'evidenced', coalesce(cell.evidenced, 0),
        'issues', coalesce(cell_issue.issues, 0), 'issue_severity', cell_issue.severity,
        'risks', coalesce(cell_risk.risks, 0), 'risk_severity', cell_risk.severity
      )), '[]'::jsonb)
      -- A cell where a requirement stands, also one whose controls count no objective.
      from (select distinct rc.system_id, rc.technique_code from req_cell rc) k
      left join cell on cell.system_id = k.system_id and cell.technique_code = k.technique_code
      left join cell_issue on cell_issue.system_id = k.system_id and cell_issue.technique_code = k.technique_code
      left join cell_risk on cell_risk.system_id = k.system_id and cell_risk.technique_code = k.technique_code),
    -- program_posture's totals; placed is how many objectives stand under a technique, and
    -- unsupported how many requirements stand on an element under no technique.
    'totals', jsonb_build_object(
      'requirements', (select count(*) from cur),
      'unplaced', (select count(*) from cur
        where exists (select 1 from public.requirement_control_links l
          where l.tenant_id = v_tenant and l.requirement_revision_id = cur.revision_id)
          and not exists (select 1 from placement pl where pl.requirement_id = cur.requirement_id)),
      'unsupported', (select count(distinct pl.requirement_id) from placement pl
        where not exists (select 1 from under u where u.requirement_id = pl.requirement_id)),
      'objectives', (select count(*) from standing),
      'mapped', (select count(*) from standing where mapped),
      'evidenced', (select count(*) from standing where evidenced),
      'placed', (select count(distinct objective_id) from anywhere),
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

revoke all on function public.program_resiliency_posture(uuid) from public, anon;
grant execute on function public.program_resiliency_posture(uuid) to authenticated;
comment on function public.program_resiliency_posture(uuid) is 'A program''s posture by cyber resiliency technique: its system elements by the techniques of NIST SP 800-160 Vol. 2 Rev. 1, each cell the assessment objectives of controls that support the technique in Table E-1 that the program''s requirement mappings cover on the element and the elements inside it (each once), those with evidence, and the open operational issues and open risks that stand there. An objective stands under every technique its control supports and counts once on a line. A mapping stands on the element it names, where that element''s control baseline selects the control (program_objective_placement); a requirement stands where its mappings stand, an open issue where the requirements it names and those its evidence supports stand, and an open risk where its issues stand. totals are program_posture''s, with placed how many objectives stand under a technique and unsupported how many requirements stand on an element under none.';

-- ---------------------------------------------------------------------------------------------
-- What stands in one cell of the posture by technique.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_resiliency_posture_cell(
  p_program_id uuid,
  p_element_id uuid default null,
  p_technique_code text default null
) returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  answer jsonb;
  v_tenant uuid;
  v_framework constant text := 'nist-sp800-160v2r1-cref';
begin
  if auth.uid() is not null then
    select p.tenant_id into v_tenant from public.programs p where p.id = p_program_id;
  end if;
  if v_tenant is null then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  with recursive
  -- The element and every element inside it; every element of the program when none is named.
  inside (id, depth) as (
    select s.id, 0 from public.systems s
    where s.tenant_id = v_tenant and s.program_id = p_program_id
      and (p_element_id is null or s.id = p_element_id)
    union
    select s.id, inside.depth + 1 from inside
    join public.systems s on s.tenant_id = v_tenant and s.program_id = p_program_id
      and s.parent_system_id = inside.id
    where inside.depth < 32
  ),
  cur as materialized (
    select distinct on (q.id) q.id as requirement_id, q.code, v.id as revision_id, v.title
    from public.engineering_requirements q
    join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
    where q.tenant_id = v_tenant and q.program_id = p_program_id
    order by q.id, v.version_number desc
  ),
  -- The technique named, or every technique of the framework when none is.
  technique as (
    select i.code
    from public.framework_item_rows i
    where i.framework_code = v_framework and i.tenant_id is null and i.kind = 'technique'
      and (p_technique_code is null or i.code = p_technique_code)
  ),
  -- Table E-1, read once: the controls with a link printed under the technique. A link printed
  -- under no technique names one only when its item is a technique.
  support as materialized (
    select distinct s.control_id
    from public.framework_control_link_rows s
    join technique on technique.code = coalesce(s.technique_code, case when s.item_kind = 'technique' then s.item_code end)
    where s.framework_code = v_framework and s.tenant_id is null and s.relation = 'supports'
      and s.control_id is not null
  ),
  -- What the mappings on those elements cover of the controls that support the technique.
  here as materialized (
    select pl.requirement_id, pl.control_id, pl.objective_id, pl.evidenced, pl.control_objectives
    from public.program_objective_placement(p_program_id) pl
    where pl.system_id in (select id from inside)
      and pl.control_id in (select control_id from support)
  ),
  pool as materialized (
    select h.control_id, h.objective_id, bool_or(h.evidenced) as evidenced
    from here h where h.objective_id is not null
    group by h.control_id, h.objective_id
  ),
  owing as materialized (
    select h.requirement_id, count(distinct h.objective_id) as objectives
    from here h
    join pool p on p.objective_id = h.objective_id and not p.evidenced
    group by h.requirement_id
  ),
  standing as (select distinct requirement_id from here),
  req_ev as (
    select distinct cur.requirement_id, ev.artifact_id
    from cur
    join standing on standing.requirement_id = cur.requirement_id
    join public.requirement_evidence re on re.tenant_id = v_tenant and re.requirement_revision_id = cur.revision_id
    join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
  ),
  cited as (select * from public.assurance_issue_evidence(v_tenant)),
  -- The issues that stand in the cell: those whose evidence supports one of its requirements, and
  -- those that name one.
  issue_here as (
    select cited.issue_id
    from cited join req_ev on req_ev.artifact_id = cited.artifact_id
    union
    select l.issue_id
    from public.issue_requirements l
    join standing on standing.requirement_id = l.engineering_requirement_id
    where l.tenant_id = v_tenant and l.program_id = p_program_id
  )
  select jsonb_build_object(
    'objectives', (select count(*) from pool),
    'evidenced', (select count(*) from pool where evidenced),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', x.id, 'code', x.code, 'title', x.title,
        'objectives', c.objectives, 'evidenced', c.evidenced, 'total', c.total
      ) order by public.natural_sort_key(x.code) collate "C", x.id), '[]'::jsonb)
      from (
        select h.control_id, count(distinct h.objective_id) as objectives,
          count(distinct h.objective_id) filter (where p.evidenced) as evidenced,
          max(h.control_objectives) as total
        from here h
        left join pool p on p.objective_id = h.objective_id
        group by h.control_id
      ) c
      join public.controls x on x.id = c.control_id),
    'unevidenced', (
      select coalesce(jsonb_agg(row.item order by row.objectives desc, row.sort_key, row.id), '[]'::jsonb)
      from (
        select jsonb_build_object('id', cur.requirement_id, 'code', cur.code, 'title', cur.title,
          'objectives', o.objectives) as item,
          o.objectives, public.natural_sort_key(cur.code) collate "C" as sort_key, cur.requirement_id as id
        from owing o join cur on cur.requirement_id = o.requirement_id
        order by o.objectives desc, public.natural_sort_key(cur.code) collate "C", cur.requirement_id
        limit 50
      ) row),
    'unevidenced_count', (select count(*) from owing),
    'issues', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', o.id, 'title', o.title, 'severity', o.severity, 'status', o.status
      ) order by array_position('{low,moderate,high,critical}'::text[], o.severity) desc nulls last,
        o.opened_at, o.id), '[]'::jsonb)
      from public.operational_issues o
      where o.tenant_id = v_tenant and o.program_id = p_program_id
        and o.status not in ('resolved', 'closed', 'cancelled')
        and o.id in (select issue_id from issue_here)),
    'risks', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', x.id, 'title', x.title, 'severity', x.severity, 'status', x.status
      ) order by x.severity_rank desc nulls last, x.title, x.id), '[]'::jsonb)
      from public.risk_rows x
      where x.tenant_id = v_tenant and x.program_id = p_program_id and x.status <> 'closed'
        and x.id in (
          select rests.risk_id from public.assurance_issue_risks(v_tenant) rests
          where rests.issue_id in (select issue_id from issue_here)))
  ) into answer;
  return answer;
end;
$$;

revoke all on function public.program_resiliency_posture_cell(uuid, uuid, text) from public, anon;
grant execute on function public.program_resiliency_posture_cell(uuid, uuid, text) to authenticated;
comment on function public.program_resiliency_posture_cell(uuid, uuid, text) is 'What stands in one cell of a program''s posture by cyber resiliency technique (an element with the elements inside it, by a technique''s code; either may be left out for a whole line): how many assessment objectives of the controls that support the technique the mappings there cover and how many with evidence, those controls (each with how many, how many with evidence and how many it counts), up to 50 requirements to evidence with how many there are, and its open operational issues (those naming one of its requirements or citing their evidence) and open risks, worst first.';
