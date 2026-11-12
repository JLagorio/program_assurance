-- A program's posture by cyber resiliency technique: the grid program_posture answers by control
-- family (migration 20261111090000_assurance_trace), with the techniques of NIST SP 800-160 Vol. 2
-- Rev. 1 where that has the families. A requirement stands at every element it is allocated to and
-- under every technique a control it meets supports in Table E-1. An open issue or an open risk
-- stands where the requirements its evidence supports stand.
--
-- A requirement whose controls support several techniques stands under each of them, and counts
-- once on a line that crosses them. One whose controls support none stands under no technique: it
-- is not placed, and totals.placed beside totals.requirements says how many are not. The readings,
-- the counting rules and the grants are program_posture's: each element's numbers count the
-- elements inside it, every record once, and the issues and the risks of a cell wear the worst
-- severity among them. The reads run as the caller, so row-level security decides every row. They
-- name the program alone, as program_resiliency_choice does: its workspace is read from it, and a
-- program the caller cannot read is refused.
--
-- The answers are program_posture's and program_posture_cell's, but for the columns: `techniques`
-- (code, title and the technique's line) where those have `families`, a cell named by its
-- technique's code, and `placed` among the totals. A technique is named by its code and never by
-- an id, since an item's id changes when the publication is read again.
--
-- Table E-1 is read through framework_control_link_rows, which answers with the framework revision
-- the product reads for each catalog revision: a control keeps the links printed for its own
-- edition, the program's. A link's technique is the one the table prints it under (technique_code),
-- never its approach's parent. The techniques are those of the framework's current revision, in
-- the publication's order, and every one is listed, also where nothing stands under it. Only the
-- shared framework is read, the one the importer writes.
--
-- Every statement here can run again: this migration is also applied by hand.

create or replace function public.program_resiliency_posture(p_program_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
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
  -- Each requirement at its latest revision, as program_posture reads it. It is picked with
  -- distinct on, not by comparing each revision with a max: the rows are the same, and the planner
  -- then expects the program's requirements rather than one row, so it joins the steps below by
  -- hash, not by a loop over one for every row of the other.
  cur as (
    select distinct on (q.id) q.id as requirement_id, v.id as revision_id
    from public.engineering_requirements q
    join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
    where q.tenant_id = v_tenant and q.program_id = p_program_id
    order by q.id, v.version_number desc
  ),
  el as (
    select s.id, s.code, s.name, s.system_type, s.parent_system_id, s.is_authorization_boundary
    from public.systems s
    where s.tenant_id = v_tenant and s.program_id = p_program_id
  ),
  -- Every element under each element that holds it, itself first.
  up (id, holder, depth) as (
    select el.id, el.id, 0 from el
    union all
    select up.id, parent.parent_system_id, up.depth + 1
    from up join el parent on parent.id = up.holder
    where parent.parent_system_id is not null and up.depth < 32
  ),
  req_el as (
    select distinct cur.requirement_id, up.holder as system_id
    from public.requirement_allocations a
    join cur on cur.revision_id = a.requirement_revision_id
    join up on up.id = a.system_id
    where a.tenant_id = v_tenant
  ),
  req_own as (
    select distinct cur.requirement_id, a.system_id
    from public.requirement_allocations a
    join cur on cur.revision_id = a.requirement_revision_id
    join el on el.id = a.system_id
    where a.tenant_id = v_tenant
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
  -- A requirement under each technique a control it meets supports.
  req_tech as (
    select distinct cur.requirement_id, support.technique_code
    from public.requirement_control_links l
    join cur on cur.revision_id = l.requirement_revision_id
    join support on support.control_id = l.control_id
    where l.tenant_id = v_tenant
  ),
  req_ev as (
    select distinct cur.requirement_id, ev.artifact_id
    from public.requirement_evidence re
    join cur on cur.revision_id = re.requirement_revision_id
    join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
    where re.tenant_id = v_tenant
  ),
  evidenced as (select distinct requirement_id from req_ev),
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
  issue_req as (
    select distinct open_issue.id as issue_id, open_issue.rank, req_ev.requirement_id
    from open_issue
    join cited on cited.issue_id = open_issue.id
    join req_ev on req_ev.artifact_id = cited.artifact_id
  ),
  -- A risk stands where its issues stand, whether or not those issues are still open.
  risk_req as (
    select distinct open_risk.id as risk_id, open_risk.rank, req_ev.requirement_id
    from open_risk
    join public.assurance_issue_risks(v_tenant) rests on rests.risk_id = open_risk.id
    join cited on cited.issue_id = rests.issue_id
    join req_ev on req_ev.artifact_id = cited.artifact_id
  ),
  req_cell as (
    select req_el.system_id, req_tech.technique_code, req_el.requirement_id
    from req_el join req_tech on req_tech.requirement_id = req_el.requirement_id
  ),
  cell as (
    select rc.system_id, rc.technique_code,
      count(distinct rc.requirement_id) as requirements,
      count(distinct rc.requirement_id) filter (
        where rc.requirement_id in (select requirement_id from evidenced)
      ) as evidenced
    from req_cell rc group by rc.system_id, rc.technique_code
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
  -- Across the techniques: each element's own line, each record once. A requirement under three
  -- techniques is one requirement here, and one that stands under none is not on the line.
  line as (
    select rc.system_id,
      count(distinct rc.requirement_id) as requirements,
      count(distinct rc.requirement_id) filter (
        where rc.requirement_id in (select requirement_id from evidenced)
      ) as evidenced
    from req_cell rc group by rc.system_id
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
  -- Down the elements: each technique's own line. A requirement allocated to no element is not on
  -- it, so `placed` holds the requirements that stand in a cell, once under each technique.
  placed as (
    select req_tech.requirement_id, req_tech.technique_code
    from req_tech
    where req_tech.requirement_id in (select requirement_id from req_own)
  ),
  tech_line as (
    select placed.technique_code,
      count(distinct placed.requirement_id) as requirements,
      count(distinct placed.requirement_id) filter (
        where placed.requirement_id in (select requirement_id from evidenced)
      ) as evidenced
    from placed group by placed.technique_code
  ),
  tech_issue as (
    select placed.technique_code, count(distinct ir.issue_id) as issues, max(ir.rank) as severity
    from placed join issue_req ir on ir.requirement_id = placed.requirement_id
    group by placed.technique_code
  ),
  tech_risk as (
    select placed.technique_code, count(distinct rr.risk_id) as risks, max(rr.rank) as severity
    from placed join risk_req rr on rr.requirement_id = placed.requirement_id
    group by placed.technique_code
  )
  select jsonb_build_object(
    'elements', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', el.id, 'code', el.code, 'name', el.name, 'type', el.system_type,
        'parent_id', el.parent_system_id, 'boundary', el.is_authorization_boundary,
        'own_requirements', (select count(*) from req_own where req_own.system_id = el.id),
        'requirements', coalesce(line.requirements, 0), 'evidenced', coalesce(line.evidenced, 0),
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
        'requirements', coalesce(tech_line.requirements, 0), 'evidenced', coalesce(tech_line.evidenced, 0),
        'issues', coalesce(tech_issue.issues, 0), 'issue_severity', tech_issue.severity,
        'risks', coalesce(tech_risk.risks, 0), 'risk_severity', tech_risk.severity
      ) order by technique.ordinal, technique.code), '[]'::jsonb)
      from technique
      left join tech_line on tech_line.technique_code = technique.code
      left join tech_issue on tech_issue.technique_code = technique.code
      left join tech_risk on tech_risk.technique_code = technique.code),
    'cells', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'element_id', cell.system_id, 'technique_code', cell.technique_code,
        'requirements', cell.requirements, 'evidenced', cell.evidenced,
        'issues', coalesce(cell_issue.issues, 0), 'issue_severity', cell_issue.severity,
        'risks', coalesce(cell_risk.risks, 0), 'risk_severity', cell_risk.severity
      )), '[]'::jsonb)
      from cell
      left join cell_issue on cell_issue.system_id = cell.system_id and cell_issue.technique_code = cell.technique_code
      left join cell_risk on cell_risk.system_id = cell.system_id and cell_risk.technique_code = cell.technique_code),
    -- program_posture's totals, and how many requirements stand under a technique at an element.
    'totals', jsonb_build_object(
      'requirements', (select count(*) from cur),
      'allocated', (select count(distinct requirement_id) from req_own),
      'allocated_elements', (select count(distinct system_id) from req_own),
      'evidenced', (select count(distinct req_own.requirement_id) from req_own
        where req_own.requirement_id in (select requirement_id from evidenced)),
      'placed', (select count(distinct requirement_id) from placed),
      'issues', (select count(*) from open_issue),
      'issues_severe', (select count(*) from open_issue where rank >= 3),
      'issues_placed', (select count(distinct ir.issue_id) from issue_req ir
        where ir.requirement_id in (select requirement_id from placed)),
      'risks', (select count(*) from open_risk),
      'risks_severe', (select count(*) from open_risk where rank >= 3),
      'risks_placed', (select count(distinct rr.risk_id) from risk_req rr
        where rr.requirement_id in (select requirement_id from placed))
    )
  ) into answer;
  return answer;
end; $$;
revoke all on function public.program_resiliency_posture(uuid) from public, anon;
grant execute on function public.program_resiliency_posture(uuid) to authenticated;
comment on function public.program_resiliency_posture(uuid) is 'A program''s posture by cyber resiliency technique: its system elements by the techniques of NIST SP 800-160 Vol. 2 Rev. 1 that the controls its requirements meet support in Table E-1, with the requirements, the requirements with evidence, the open operational issues and the open risks that stand in each cell. A requirement stands under every technique its controls support and counts once on a line; totals.placed is how many stand under any. An element''s numbers count the elements inside it, each record once.';

-- What stands in one cell of the posture by technique, or on one element's or one technique's
-- whole line: the open issues and risks worst first, the requirements with no evidence, and the
-- controls met that support the technique.
create or replace function public.program_resiliency_posture_cell(
  p_program_id uuid,
  p_element_id uuid default null,
  p_technique_code text default null
) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
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
    join public.systems s on s.tenant_id = v_tenant and s.parent_system_id = inside.id
    where inside.depth < 32
  ),
  -- Each requirement at its latest revision, picked as program_resiliency_posture picks it.
  cur as (
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
  -- The requirements that stand in the cell, with the controls they map that support the technique.
  mapped as (
    select distinct cur.requirement_id, l.control_id
    from cur
    join public.requirement_control_links l on l.tenant_id = v_tenant and l.requirement_revision_id = cur.revision_id
    where l.control_id in (select control_id from support)
      and exists (
        select 1 from public.requirement_allocations a
        where a.tenant_id = v_tenant and a.requirement_revision_id = cur.revision_id
          and a.system_id in (select id from inside))
  ),
  here as (select distinct requirement_id from mapped),
  req_ev as (
    select distinct cur.requirement_id, ev.artifact_id
    from cur
    join here on here.requirement_id = cur.requirement_id
    join public.requirement_evidence re on re.tenant_id = v_tenant and re.requirement_revision_id = cur.revision_id
    join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
  ),
  cited as (select * from public.assurance_issue_evidence(v_tenant)),
  issue_here as (
    select distinct cited.issue_id
    from cited join req_ev on req_ev.artifact_id = cited.artifact_id
  )
  select jsonb_build_object(
    'requirements', (select count(*) from here),
    'evidenced', (select count(distinct requirement_id) from req_ev),
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
          where rests.issue_id in (select issue_id from issue_here))),
    'unevidenced', (
      select coalesce(jsonb_agg(row.item order by row.sort_key), '[]'::jsonb)
      from (
        select jsonb_build_object('id', cur.requirement_id, 'code', cur.code, 'title', cur.title) as item,
          public.natural_sort_key(cur.code) collate "C" as sort_key
        from cur join here on here.requirement_id = cur.requirement_id
        where not exists (select 1 from req_ev where req_ev.requirement_id = cur.requirement_id)
        order by public.natural_sort_key(cur.code) collate "C"
        limit 50
      ) row),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', x.id, 'code', x.code, 'title', x.title,
        'requirements', (select count(*) from mapped where mapped.control_id = x.id)
      ) order by public.natural_sort_key(x.code) collate "C"), '[]'::jsonb)
      from public.controls x
      where x.id in (select control_id from mapped))
  ) into answer;
  return answer;
end; $$;
revoke all on function public.program_resiliency_posture_cell(uuid, uuid, text) from public, anon;
grant execute on function public.program_resiliency_posture_cell(uuid, uuid, text) to authenticated;
comment on function public.program_resiliency_posture_cell(uuid, uuid, text) is 'What stands in one cell of a program''s posture by cyber resiliency technique (an element with the elements inside it, by a technique''s code; either may be left out for a whole line): its open operational issues and open risks worst first, up to 50 requirements with no evidence, and the controls its requirements map that support the technique.';
