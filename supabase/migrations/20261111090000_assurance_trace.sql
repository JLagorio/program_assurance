-- The assurance chain around one record, and a program's posture by system element and control
-- family. A control is met by requirements, a requirement is supported by evidence, an operational
-- issue cites evidence, a risk assessment rests on an issue's observations, and a remediation item
-- answers an issue. These reads walk that chain in one request each. They run as the caller, so
-- row-level security decides every row: nothing here widens what a member may see.

-- A requirement is read at its latest revision, a risk at its latest assessment and a remediation
-- item at its latest commitment, as their registers read them. Evidence is one node per artifact:
-- a link to any of its versions is a link to the artifact.

-- ---------------------------------------------------------------------------------------------
-- Two links the chain reads in both directions. An issue cites evidence directly, or through an
-- observation that cites it. A risk rests on an issue when its latest assessment is supported by
-- one of the issue's observations.
-- ---------------------------------------------------------------------------------------------
create function public.assurance_issue_evidence(p_tenant_id uuid)
returns table (issue_id uuid, artifact_id uuid)
language sql stable security invoker set search_path = '' as $$
  select ie.issue_id, ev.artifact_id
  from public.issue_evidence ie
  join public.evidence_versions ev on ev.tenant_id = ie.tenant_id and ev.id = ie.evidence_version_id
  where ie.tenant_id = p_tenant_id
  union
  select io.issue_id, ev.artifact_id
  from public.issue_observations io
  join public.observation_evidence oe on oe.tenant_id = io.tenant_id and oe.observation_id = io.observation_id
  join public.evidence_versions ev on ev.tenant_id = oe.tenant_id and ev.id = oe.evidence_version_id
  where io.tenant_id = p_tenant_id;
$$;
revoke all on function public.assurance_issue_evidence(uuid) from public, anon;
grant execute on function public.assurance_issue_evidence(uuid) to authenticated;

create function public.assurance_issue_risks(p_tenant_id uuid)
returns table (issue_id uuid, risk_id uuid)
language sql stable security invoker set search_path = '' as $$
  select distinct io.issue_id, kv.risk_id
  from public.risk_observations ro
  join public.risk_revisions kv on kv.tenant_id = ro.tenant_id and kv.id = ro.risk_revision_id
  join public.issue_observations io on io.tenant_id = ro.tenant_id and io.observation_id = ro.observation_id
  where ro.tenant_id = p_tenant_id
    and kv.version_number = (select max(x.version_number) from public.risk_revisions x
      where x.tenant_id = kv.tenant_id and x.risk_id = kv.risk_id);
$$;
revoke all on function public.assurance_issue_risks(uuid) from public, anon;
grant execute on function public.assurance_issue_risks(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- The chain around one record. The walk goes outward from the focus and never back: a risk reaches
-- its issues, their evidence, the requirements that evidence supports and the controls those
-- requirements meet, and not the other issues that cite the same evidence.
-- ---------------------------------------------------------------------------------------------
create function public.assurance_trace(
  p_tenant_id uuid,
  p_kind text,
  p_id uuid,
  p_program_id uuid default null
) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  c uuid[] := '{}'; -- controls
  r uuid[] := '{}'; -- engineering requirements
  e uuid[] := '{}'; -- evidence artifacts
  i uuid[] := '{}'; -- operational issues
  k uuid[] := '{}'; -- risks
  m uuid[] := '{}'; -- remediation items
  steps text[];
  step text;
  clipped boolean := false;
  -- A stage holds at most this many records; past it the trace says it was cut.
  cap constant integer := 400;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  if p_id is null then
    raise exception 'Name the record to trace' using errcode = '22023';
  end if;
  case p_kind
    when 'control' then c := array[p_id]; steps := array['r<c', 'e<r', 'i<e', 'k<i', 'm<i'];
    when 'requirement' then r := array[p_id]; steps := array['c<r', 'e<r', 'i<e', 'k<i', 'm<i'];
    when 'evidence' then e := array[p_id]; steps := array['r<e', 'c<r', 'i<e', 'k<i', 'm<i'];
    when 'issue' then i := array[p_id]; steps := array['e<i', 'r<e', 'c<r', 'k<i', 'm<i'];
    when 'risk' then k := array[p_id]; steps := array['i<k', 'e<i', 'r<e', 'c<r', 'm<i'];
    when 'remediation' then m := array[p_id]; steps := array['i<m', 'e<i', 'r<e', 'c<r', 'k<i'];
    else raise exception 'Unknown trace focus' using errcode = '22023';
  end case;

  foreach step in array steps loop
    case step
      when 'r<c' then
        select coalesce(array_agg(distinct q.id), '{}') into r
        from public.requirement_control_links l
        join public.requirement_revisions v on v.tenant_id = l.tenant_id and v.id = l.requirement_revision_id
        join public.engineering_requirements q on q.tenant_id = v.tenant_id and q.id = v.engineering_requirement_id
        where l.tenant_id = p_tenant_id and l.control_id = any(c)
          and (p_program_id is null or q.program_id = p_program_id)
          and v.version_number = (select max(x.version_number) from public.requirement_revisions x
            where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id);
      when 'c<r' then
        select coalesce(array_agg(distinct l.control_id), '{}') into c
        from public.requirement_control_links l
        join public.requirement_revisions v on v.tenant_id = l.tenant_id and v.id = l.requirement_revision_id
        where l.tenant_id = p_tenant_id and v.engineering_requirement_id = any(r)
          and v.version_number = (select max(x.version_number) from public.requirement_revisions x
            where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id);
      when 'e<r' then
        select coalesce(array_agg(distinct ev.artifact_id), '{}') into e
        from public.requirement_evidence re
        join public.requirement_revisions v on v.tenant_id = re.tenant_id and v.id = re.requirement_revision_id
        join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
        where re.tenant_id = p_tenant_id and v.engineering_requirement_id = any(r)
          and v.version_number = (select max(x.version_number) from public.requirement_revisions x
            where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id);
      when 'r<e' then
        select coalesce(array_agg(distinct q.id), '{}') into r
        from public.requirement_evidence re
        join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
        join public.requirement_revisions v on v.tenant_id = re.tenant_id and v.id = re.requirement_revision_id
        join public.engineering_requirements q on q.tenant_id = v.tenant_id and q.id = v.engineering_requirement_id
        where re.tenant_id = p_tenant_id and ev.artifact_id = any(e)
          and (p_program_id is null or q.program_id = p_program_id)
          and v.version_number = (select max(x.version_number) from public.requirement_revisions x
            where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id);
      when 'i<e' then
        select coalesce(array_agg(distinct cited.issue_id), '{}') into i
        from public.assurance_issue_evidence(p_tenant_id) cited
        join public.operational_issues o on o.tenant_id = p_tenant_id and o.id = cited.issue_id
        where cited.artifact_id = any(e) and (p_program_id is null or o.program_id = p_program_id);
      when 'e<i' then
        select coalesce(array_agg(distinct cited.artifact_id), '{}') into e
        from public.assurance_issue_evidence(p_tenant_id) cited
        where cited.issue_id = any(i);
      when 'k<i' then
        select coalesce(array_agg(distinct rests.risk_id), '{}') into k
        from public.assurance_issue_risks(p_tenant_id) rests
        where rests.issue_id = any(i);
      when 'i<k' then
        select coalesce(array_agg(distinct rests.issue_id), '{}') into i
        from public.assurance_issue_risks(p_tenant_id) rests
        where rests.risk_id = any(k);
      when 'm<i' then
        select coalesce(array_agg(distinct ip.poam_item_id), '{}') into m
        from public.issue_poams ip
        where ip.tenant_id = p_tenant_id and ip.issue_id = any(i);
      when 'i<m' then
        select coalesce(array_agg(distinct ip.issue_id), '{}') into i
        from public.issue_poams ip
        where ip.tenant_id = p_tenant_id and ip.poam_item_id = any(m);
    end case;
    if greatest(cardinality(c), cardinality(r), cardinality(e), cardinality(i), cardinality(k), cardinality(m)) > cap then
      clipped := true;
      c := c[1:cap]; r := r[1:cap]; e := e[1:cap]; i := i[1:cap]; k := k[1:cap]; m := m[1:cap];
    end if;
  end loop;

  return jsonb_build_object(
    'focus', jsonb_build_object('kind', p_kind, 'id', p_id),
    'clipped', clipped,
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', x.id, 'code', x.code, 'title', x.title,
        'family', upper(g.source_id), 'family_title', g.title
      ) order by public.natural_sort_key(x.code) collate "C"), '[]'::jsonb)
      from public.controls x
      left join public.catalog_groups g on g.id = x.group_id
      where x.id = any(c)),
    'requirements', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', q.id, 'code', q.code, 'title', v.title, 'state', v.state, 'program_id', q.program_id,
        'evidence_count', (
          select count(distinct ev.artifact_id)
          from public.requirement_evidence re
          join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
          where re.tenant_id = q.tenant_id and re.requirement_revision_id = v.id)
      ) order by public.natural_sort_key(q.code) collate "C"), '[]'::jsonb)
      from public.engineering_requirements q
      join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
      where q.tenant_id = p_tenant_id and q.id = any(r)
        and v.version_number = (select max(x.version_number) from public.requirement_revisions x
          where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)),
    'evidence', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id, 'title', a.title, 'kind', a.artifact_kind, 'program_id', a.program_id,
        'version_id', a.latest_version_id, 'version_number', a.latest_version_number,
        'collected_at', a.collected_at, 'review', a.review,
        'expires_at', (select ev.expires_at from public.evidence_versions ev
          where ev.tenant_id = a.tenant_id and ev.id = a.latest_version_id)
      ) order by a.title, a.id), '[]'::jsonb)
      from public.evidence_artifact_rows a
      where a.tenant_id = p_tenant_id and a.id = any(e)),
    'issues', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', o.id, 'title', o.title, 'severity', o.severity, 'status', o.status,
        'opened_at', o.opened_at, 'closed_at', o.closed_at, 'program_id', o.program_id
      ) order by array_position('{low,moderate,high,critical}'::text[], o.severity) desc nulls last,
        o.opened_at, o.id), '[]'::jsonb)
      from public.operational_issues o
      where o.tenant_id = p_tenant_id and o.id = any(i)),
    'risks', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', x.id, 'title', x.title, 'status', x.status, 'severity', x.severity,
        'likelihood', x.likelihood, 'impact', x.impact, 'program_id', x.program_id
      ) order by x.severity_rank desc nulls last, x.title, x.id), '[]'::jsonb)
      from public.risk_rows x
      where x.tenant_id = p_tenant_id and x.id = any(k)),
    'remediation', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', p.id, 'title', p.title, 'status', p.status,
        'planned_on', latest.planned_completion_date, 'completed_on', latest.actual_completion_date,
        'milestones', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', ms.id, 'title', ms.title, 'status', ms.status,
            'planned_on', ms.planned_date, 'completed_on', ms.completed_date
          ) order by ms.sequence_number nulls last, ms.planned_date nulls last, ms.id)
          from public.poam_milestones ms
          where ms.tenant_id = p.tenant_id and ms.poam_item_revision_id = latest.id), '[]'::jsonb)
      ) order by latest.planned_completion_date nulls last, p.title, p.id), '[]'::jsonb)
      from public.poam_items p
      left join lateral (
        select pv.id, pv.planned_completion_date, pv.actual_completion_date
        from public.poam_item_revisions pv
        where pv.tenant_id = p.tenant_id and pv.poam_item_id = p.id
        order by pv.version_number desc limit 1
      ) latest on true
      where p.tenant_id = p_tenant_id and p.id = any(m)),
    'elements', (
      select coalesce(jsonb_agg(distinct jsonb_build_object(
        'id', s.id, 'code', s.code, 'name', s.name, 'program_id', s.program_id
      )), '[]'::jsonb)
      from public.requirement_allocations a
      join public.requirement_revisions v on v.tenant_id = a.tenant_id and v.id = a.requirement_revision_id
      join public.systems s on s.tenant_id = a.tenant_id and s.id = a.system_id
      where a.tenant_id = p_tenant_id and v.engineering_requirement_id = any(r)
        and v.version_number = (select max(x.version_number) from public.requirement_revisions x
          where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)),
    'links', jsonb_build_object(
      'control_requirement', (
        select coalesce(jsonb_agg(distinct jsonb_build_array(l.control_id, v.engineering_requirement_id)), '[]'::jsonb)
        from public.requirement_control_links l
        join public.requirement_revisions v on v.tenant_id = l.tenant_id and v.id = l.requirement_revision_id
        where l.tenant_id = p_tenant_id and l.control_id = any(c) and v.engineering_requirement_id = any(r)
          and v.version_number = (select max(x.version_number) from public.requirement_revisions x
            where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)),
      'requirement_evidence', (
        select coalesce(jsonb_agg(distinct jsonb_build_array(v.engineering_requirement_id, ev.artifact_id)), '[]'::jsonb)
        from public.requirement_evidence re
        join public.requirement_revisions v on v.tenant_id = re.tenant_id and v.id = re.requirement_revision_id
        join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
        where re.tenant_id = p_tenant_id and v.engineering_requirement_id = any(r) and ev.artifact_id = any(e)
          and v.version_number = (select max(x.version_number) from public.requirement_revisions x
            where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)),
      'evidence_issue', (
        select coalesce(jsonb_agg(distinct jsonb_build_array(cited.artifact_id, cited.issue_id)), '[]'::jsonb)
        from public.assurance_issue_evidence(p_tenant_id) cited
        where cited.artifact_id = any(e) and cited.issue_id = any(i)),
      'issue_risk', (
        select coalesce(jsonb_agg(distinct jsonb_build_array(rests.issue_id, rests.risk_id)), '[]'::jsonb)
        from public.assurance_issue_risks(p_tenant_id) rests
        where rests.issue_id = any(i) and rests.risk_id = any(k)),
      'issue_remediation', (
        select coalesce(jsonb_agg(distinct jsonb_build_array(ip.issue_id, ip.poam_item_id)), '[]'::jsonb)
        from public.issue_poams ip
        where ip.tenant_id = p_tenant_id and ip.issue_id = any(i) and ip.poam_item_id = any(m))
    )
  );
end; $$;
revoke all on function public.assurance_trace(uuid, text, uuid, uuid) from public, anon;
grant execute on function public.assurance_trace(uuid, text, uuid, uuid) to authenticated;
comment on function public.assurance_trace(uuid, text, uuid, uuid) is 'The assurance chain around one record (a control, requirement, evidence artifact, operational issue, risk or remediation item): the records of each stage it reaches, walking outward only, and the links between them. p_program_id keeps a control''s requirements to one program.';

-- ---------------------------------------------------------------------------------------------
-- A program's posture: its system elements by the control families its requirements meet. A
-- requirement stands at every element it is allocated to and under every family of a control it
-- maps. An open issue or an open risk stands where the requirements its evidence supports stand.
-- Each element's numbers count the elements inside it too, each record once.
-- ---------------------------------------------------------------------------------------------
create function public.program_posture(p_tenant_id uuid, p_program_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare answer jsonb;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  with recursive
  cur as (
    select q.id as requirement_id, v.id as revision_id
    from public.engineering_requirements q
    join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
    where q.tenant_id = p_tenant_id and q.program_id = p_program_id
      and v.version_number = (select max(x.version_number) from public.requirement_revisions x
        where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)
  ),
  el as (
    select s.id, s.code, s.name, s.system_type, s.parent_system_id, s.is_authorization_boundary
    from public.systems s
    where s.tenant_id = p_tenant_id and s.program_id = p_program_id
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
    where a.tenant_id = p_tenant_id
  ),
  req_own as (
    select distinct cur.requirement_id, a.system_id
    from public.requirement_allocations a
    join cur on cur.revision_id = a.requirement_revision_id
    join el on el.id = a.system_id
    where a.tenant_id = p_tenant_id
  ),
  req_fam as (
    select distinct cur.requirement_id, x.group_id as family_id
    from public.requirement_control_links l
    join cur on cur.revision_id = l.requirement_revision_id
    join public.controls x on x.id = l.control_id
    where l.tenant_id = p_tenant_id and x.group_id is not null
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
    join public.assurance_issue_risks(p_tenant_id) rests on rests.risk_id = open_risk.id
    join cited on cited.issue_id = rests.issue_id
    join req_ev on req_ev.artifact_id = cited.artifact_id
  ),
  req_cell as (
    select req_el.system_id, req_fam.family_id, req_el.requirement_id
    from req_el join req_fam on req_fam.requirement_id = req_el.requirement_id
  ),
  cell as (
    select rc.system_id, rc.family_id,
      count(distinct rc.requirement_id) as requirements,
      count(distinct rc.requirement_id) filter (
        where exists (select 1 from req_ev where req_ev.requirement_id = rc.requirement_id)
      ) as evidenced
    from req_cell rc group by rc.system_id, rc.family_id
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
  -- Across the families: each element's own line, each record once.
  line as (
    select req_el.system_id,
      count(distinct req_el.requirement_id) as requirements,
      count(distinct req_el.requirement_id) filter (
        where exists (select 1 from req_ev where req_ev.requirement_id = req_el.requirement_id)
      ) as evidenced
    from req_el group by req_el.system_id
  ),
  line_issue as (
    select req_el.system_id, count(distinct ir.issue_id) as issues, max(ir.rank) as severity
    from req_el join issue_req ir on ir.requirement_id = req_el.requirement_id
    group by req_el.system_id
  ),
  line_risk as (
    select req_el.system_id, count(distinct rr.risk_id) as risks, max(rr.rank) as severity
    from req_el join risk_req rr on rr.requirement_id = req_el.requirement_id
    group by req_el.system_id
  ),
  family as (
    select g.id, upper(g.source_id) as code, g.title, g.ordinal
    from public.catalog_groups g
    where g.id in (select family_id from req_fam)
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
    'families', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', family.id, 'code', family.code, 'title', family.title,
        'requirements', (select count(distinct requirement_id) from req_fam
          where req_fam.family_id = family.id
            and exists (select 1 from req_own where req_own.requirement_id = req_fam.requirement_id)),
        'evidenced', (select count(distinct requirement_id) from req_fam
          where req_fam.family_id = family.id
            and exists (select 1 from req_own where req_own.requirement_id = req_fam.requirement_id)
            and exists (select 1 from req_ev where req_ev.requirement_id = req_fam.requirement_id)),
        'issues', (select count(distinct ir.issue_id) from req_fam join issue_req ir on ir.requirement_id = req_fam.requirement_id
          where req_fam.family_id = family.id
            and exists (select 1 from req_own where req_own.requirement_id = req_fam.requirement_id)),
        'issue_severity', (select max(ir.rank) from req_fam join issue_req ir on ir.requirement_id = req_fam.requirement_id
          where req_fam.family_id = family.id
            and exists (select 1 from req_own where req_own.requirement_id = req_fam.requirement_id)),
        'risks', (select count(distinct rr.risk_id) from req_fam join risk_req rr on rr.requirement_id = req_fam.requirement_id
          where req_fam.family_id = family.id
            and exists (select 1 from req_own where req_own.requirement_id = req_fam.requirement_id)),
        'risk_severity', (select max(rr.rank) from req_fam join risk_req rr on rr.requirement_id = req_fam.requirement_id
          where req_fam.family_id = family.id
            and exists (select 1 from req_own where req_own.requirement_id = req_fam.requirement_id))
      ) order by family.ordinal, family.code), '[]'::jsonb)
      from family),
    'cells', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'element_id', cell.system_id, 'family_id', cell.family_id,
        'requirements', cell.requirements, 'evidenced', cell.evidenced,
        'issues', coalesce(cell_issue.issues, 0), 'issue_severity', cell_issue.severity,
        'risks', coalesce(cell_risk.risks, 0), 'risk_severity', cell_risk.severity
      )), '[]'::jsonb)
      from cell
      left join cell_issue on cell_issue.system_id = cell.system_id and cell_issue.family_id = cell.family_id
      left join cell_risk on cell_risk.system_id = cell.system_id and cell_risk.family_id = cell.family_id),
    'totals', jsonb_build_object(
      'requirements', (select count(*) from cur),
      'allocated', (select count(distinct requirement_id) from req_own),
      'allocated_elements', (select count(distinct system_id) from req_own),
      'evidenced', (select count(distinct req_own.requirement_id) from req_own
        where exists (select 1 from req_ev where req_ev.requirement_id = req_own.requirement_id)),
      'issues', (select count(*) from open_issue),
      'issues_severe', (select count(*) from open_issue where rank >= 3),
      'issues_placed', (select count(distinct ir.issue_id) from issue_req ir
        join req_cell on req_cell.requirement_id = ir.requirement_id),
      'risks', (select count(*) from open_risk),
      'risks_severe', (select count(*) from open_risk where rank >= 3),
      'risks_placed', (select count(distinct rr.risk_id) from risk_req rr
        join req_cell on req_cell.requirement_id = rr.requirement_id)
    )
  ) into answer;
  return answer;
end; $$;
revoke all on function public.program_posture(uuid, uuid) from public, anon;
grant execute on function public.program_posture(uuid, uuid) to authenticated;
comment on function public.program_posture(uuid, uuid) is 'A program''s posture: its system elements by the control families its requirements meet, with the requirements, the requirements with evidence, the open operational issues and the open risks that stand in each cell. An element''s numbers count the elements inside it, each record once.';

-- What stands in one cell of the posture, or on one element's or one family's whole line: the
-- open issues and risks worst first, the requirements with no evidence, and the controls met.
create function public.program_posture_cell(
  p_tenant_id uuid,
  p_program_id uuid,
  p_element_id uuid default null,
  p_family_id uuid default null
) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare answer jsonb;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  with recursive
  -- The element and every element inside it; every element of the program when none is named.
  inside (id, depth) as (
    select s.id, 0 from public.systems s
    where s.tenant_id = p_tenant_id and s.program_id = p_program_id
      and (p_element_id is null or s.id = p_element_id)
    union
    select s.id, inside.depth + 1 from inside
    join public.systems s on s.tenant_id = p_tenant_id and s.parent_system_id = inside.id
    where inside.depth < 32
  ),
  cur as (
    select q.id as requirement_id, q.code, v.id as revision_id, v.title
    from public.engineering_requirements q
    join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
    where q.tenant_id = p_tenant_id and q.program_id = p_program_id
      and v.version_number = (select max(x.version_number) from public.requirement_revisions x
        where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)
  ),
  -- The requirements that stand in the cell, with the controls of the family they map.
  mapped as (
    select distinct cur.requirement_id, x.id as control_id
    from cur
    join public.requirement_control_links l on l.tenant_id = p_tenant_id and l.requirement_revision_id = cur.revision_id
    join public.controls x on x.id = l.control_id
    where (p_family_id is null or x.group_id = p_family_id)
      and exists (
        select 1 from public.requirement_allocations a
        where a.tenant_id = p_tenant_id and a.requirement_revision_id = cur.revision_id
          and a.system_id in (select id from inside))
  ),
  here as (select distinct requirement_id from mapped),
  req_ev as (
    select distinct cur.requirement_id, ev.artifact_id
    from cur
    join here on here.requirement_id = cur.requirement_id
    join public.requirement_evidence re on re.tenant_id = p_tenant_id and re.requirement_revision_id = cur.revision_id
    join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
  ),
  cited as (select * from public.assurance_issue_evidence(p_tenant_id)),
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
revoke all on function public.program_posture_cell(uuid, uuid, uuid, uuid) from public, anon;
grant execute on function public.program_posture_cell(uuid, uuid, uuid, uuid) to authenticated;
comment on function public.program_posture_cell(uuid, uuid, uuid, uuid) is 'What stands in one cell of a program''s posture (an element with the elements inside it, by a control family; either may be left out for a whole line): its open operational issues and open risks worst first, up to 50 requirements with no evidence, and the controls its requirements map.';

-- ---------------------------------------------------------------------------------------------
-- Search results open product pages: a control its catalog record, an evidence artifact its
-- evidence record. Neither opens the schema inspector.
-- ---------------------------------------------------------------------------------------------
create or replace view public.assurance_search_documents with(security_invoker=true) as
select p.tenant_id,'program'::text kind,p.id,p.code identifier,p.name title,p.description body,
 '/programs/'||p.id href,p.updated_at from public.programs p
union all select r.tenant_id,'requirement',r.id,r.code,c.title,concat_ws(E'\n',c.statement,c.acceptance_criteria,c.rationale),
 '/programs/'||r.program_id||'/requirements/'||r.id,c.updated_at
 from public.engineering_requirements r join lateral(select * from public.requirement_revisions c where c.tenant_id=r.tenant_id and c.engineering_requirement_id=r.id order by c.version_number desc limit 1)c on true
union all select c.tenant_id,'control',c.id,c.code,c.title,coalesce((select string_agg(p.prose,E'\n' order by p.id) from public.control_parts p where p.control_id=c.id),''),
 '/catalog/controls/'||c.id,c.updated_at from public.controls c
union all select a.tenant_id,'evidence',a.id,null,a.title,concat_ws(E'\n',a.description,(select string_agg(concat_ws(E'\n',v.description,v.provenance),E'\n') from public.evidence_versions v where v.tenant_id=a.tenant_id and v.artifact_id=a.id)),
 '/evidence/'||a.id,a.updated_at from public.evidence_artifacts a
union all select c.tenant_id,'citation',c.id,null,c.evidence_title,c.passage,
 '/evidence?artifact='||v.artifact_id||'&version='||v.id||'&citation='||c.id,c.created_at
 from public.assurance_citations c join public.evidence_versions v on v.tenant_id=c.tenant_id and v.id=c.evidence_version_id
union all select r.tenant_id,'risk',r.id,null,r.title,r.status,'/register/risks/'||r.id,r.updated_at from public.risks r
union all select f.tenant_id,'finding',f.id,null,f.title,f.description,'/findings/'||f.id,f.updated_at from public.assessment_findings f;
