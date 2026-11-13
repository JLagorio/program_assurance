-- The assurance chain holds the assessor's findings.
--
-- Until now assurance_trace (latest definition: migration 20261113200615_operational_issue_requirements)
-- walked six stages: controls, requirements, evidence, operational issues, risks and remediation.
-- An assessment finding stood on none of them, so a control an assessor found short of satisfied
-- showed nothing of the verdict, and a risk raised from a finding did not reach it. The trace now
-- holds a seventh stage, assessment findings, between evidence and operational issues, and a
-- finding is a record a trace starts from (p_kind 'finding').
--
-- No table names a finding's place on the chain outright; the schema records it in four links,
-- which the trace reads in both directions:
--
--   a finding judges a control      its target_control_part_id is a part of the control
--                                   (control_parts.control_id); the finding belongs to the program
--                                   of its results' campaign (assessment_results_revisions →
--                                   assessment_plan_revisions → assessment_campaigns.program_id)
--   a finding cites evidence        finding_evidence, a version of the artifact
--   a finding became an issue       an observation the finding rests on is one the issue rests on
--                                   (finding_observations, issue_observations), as a risk rests on
--                                   an issue through an observation; the demo seed records the
--                                   operational issue a failed result became this way
--   a finding raised a risk         finding_risks, a revision of the risk
--
-- No table links a finding to a remediation item either. A remediation item answers a finding
-- through what the finding led to: the issue it became (issue_poams) and the risk it raised,
-- which the item's latest commitment cites (poam_item_risks, the commitment's Linked risk
-- assessments). That second link is new to every trace: a remediation item answers the risks its
-- latest commitment cites, as well as the risks resting on the issues it answers.
--
-- A walk reaches a finding of published results only: an assessor's draft results decide nothing,
-- as program_control_status reads them. A finding of draft results is in the trace only when it is
-- the record traced. Every determination is kept, satisfied and not assessed included, and the
-- trace says each, so a control found short of satisfied and later satisfied shows both verdicts.
--
-- The walk still goes outward from the record and never back. A control reaches the findings on it
-- in its program and those citing its requirements' evidence; a finding reaches its evidence, the
-- requirements that evidence supports and the controls those meet, with the controls it judges,
-- upstream, and the issues it became, the risks it raised or that rest on those issues, and their
-- remediation, downstream; a risk reaches the findings that raised it and those its issues came
-- from. From evidence a walk reaches the findings that cite it, not those judging a control its
-- requirements meet; from a requirement, the findings citing its evidence.
--
-- Every step of the walk now adds to its stage, so the order of the steps, not which step comes
-- first, decides what a stage holds. The answer is the same as before for a record no finding and
-- no commitment's risk touches, but for the new list `findings` and five more pairs among `links`.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- The links. Each runs as the caller, so row-level security decides every row it reads.
-- ---------------------------------------------------------------------------------------------
-- What each finding judges, the program it belongs to, and whether its results are published. A
-- part of a control group judges no control; a results revision the caller cannot read publishes
-- nothing to them.
create or replace function public.assurance_findings(p_tenant_id uuid)
returns table (finding_id uuid, control_id uuid, program_id uuid, published boolean)
language sql stable security invoker set search_path = '' as $$
  select f.id, cp.control_id, g.program_id, coalesce(rr.state = 'published', false)
  from public.assessment_findings f
  left join public.control_parts cp on cp.id = f.target_control_part_id
  left join public.assessment_results_revisions rr
    on rr.tenant_id = f.tenant_id and rr.id = f.assessment_results_revision_id
  left join public.assessment_plan_revisions pl
    on pl.tenant_id = rr.tenant_id and pl.id = rr.assessment_plan_revision_id
  left join public.assessment_campaigns g on g.tenant_id = pl.tenant_id and g.id = pl.campaign_id
  where f.tenant_id = p_tenant_id;
$$;
revoke all on function public.assurance_findings(uuid) from public, anon;
grant execute on function public.assurance_findings(uuid) to authenticated;

-- The evidence a finding cites, one node per artifact.
create or replace function public.assurance_finding_evidence(p_tenant_id uuid)
returns table (finding_id uuid, artifact_id uuid)
language sql stable security invoker set search_path = '' as $$
  select distinct fe.finding_id, ev.artifact_id
  from public.finding_evidence fe
  join public.evidence_versions ev on ev.tenant_id = fe.tenant_id and ev.id = fe.evidence_version_id
  where fe.tenant_id = p_tenant_id;
$$;
revoke all on function public.assurance_finding_evidence(uuid) from public, anon;
grant execute on function public.assurance_finding_evidence(uuid) to authenticated;

-- The operational issue a finding became: one resting on an observation the finding rests on.
create or replace function public.assurance_finding_issues(p_tenant_id uuid)
returns table (finding_id uuid, issue_id uuid)
language sql stable security invoker set search_path = '' as $$
  select distinct fo.finding_id, io.issue_id
  from public.finding_observations fo
  join public.issue_observations io on io.tenant_id = fo.tenant_id and io.observation_id = fo.observation_id
  where fo.tenant_id = p_tenant_id;
$$;
revoke all on function public.assurance_finding_issues(uuid) from public, anon;
grant execute on function public.assurance_finding_issues(uuid) to authenticated;

-- The risks a finding raised: a finding names a revision of the risk, which stays its link
-- whatever the risk is assessed at later.
create or replace function public.assurance_finding_risks(p_tenant_id uuid)
returns table (finding_id uuid, risk_id uuid)
language sql stable security invoker set search_path = '' as $$
  select distinct fr.finding_id, kv.risk_id
  from public.finding_risks fr
  join public.risk_revisions kv on kv.tenant_id = fr.tenant_id and kv.id = fr.risk_revision_id
  where fr.tenant_id = p_tenant_id;
$$;
revoke all on function public.assurance_finding_risks(uuid) from public, anon;
grant execute on function public.assurance_finding_risks(uuid) to authenticated;

-- The risks a remediation item answers outright: those its latest commitment cites, as its
-- record's Linked risk assessments.
create or replace function public.assurance_remediation_risks(p_tenant_id uuid)
returns table (poam_item_id uuid, risk_id uuid)
language sql stable security invoker set search_path = '' as $$
  select distinct pv.poam_item_id, kv.risk_id
  from public.poam_item_risks pr
  join public.poam_item_revisions pv on pv.tenant_id = pr.tenant_id and pv.id = pr.poam_item_revision_id
  join public.risk_revisions kv on kv.tenant_id = pr.tenant_id and kv.id = pr.risk_revision_id
  where pr.tenant_id = p_tenant_id
    and pv.version_number = (select max(x.version_number) from public.poam_item_revisions x
      where x.tenant_id = pv.tenant_id and x.poam_item_id = pv.poam_item_id);
$$;
revoke all on function public.assurance_remediation_risks(uuid) from public, anon;
grant execute on function public.assurance_remediation_risks(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- The chain around one record. A step `t<s` adds to stage t the records linked to those stage s
-- holds; each kind of record walks its own list of steps, outward from it.
-- ---------------------------------------------------------------------------------------------
create or replace function public.assurance_trace(
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
  fd uuid[] := '{}'; -- assessment findings
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
    when 'control' then c := array[p_id];
      steps := array['r<c', 'e<r', 'f<c', 'f<e', 'i<e', 'i<r', 'i<f', 'k<i', 'k<f', 'm<i', 'm<k'];
    when 'requirement' then r := array[p_id];
      steps := array['c<r', 'e<r', 'f<e', 'i<e', 'i<r', 'i<f', 'k<i', 'k<f', 'm<i', 'm<k'];
    when 'evidence' then e := array[p_id];
      steps := array['r<e', 'c<r', 'f<e', 'i<e', 'i<f', 'k<i', 'k<f', 'm<i', 'm<k'];
    when 'finding' then fd := array[p_id];
      steps := array['e<f', 'r<e', 'c<f', 'c<r', 'i<f', 'k<f', 'k<i', 'm<i', 'm<k'];
    when 'issue' then i := array[p_id];
      steps := array['f<i', 'e<i', 'e<f', 'r<e', 'r<i', 'c<r', 'c<f', 'k<i', 'm<i', 'm<k'];
    -- A risk and a remediation item read each other through the issues and the findings behind
    -- them, as the risks resting on an issue and the items answering it are its two outcomes.
    when 'risk' then k := array[p_id];
      steps := array['i<k', 'f<k', 'f<i', 'e<i', 'e<f', 'r<e', 'r<i', 'c<r', 'c<f', 'm<k', 'm<i'];
    when 'remediation' then m := array[p_id];
      steps := array['i<m', 'k<m', 'k<i', 'f<i', 'f<k', 'e<i', 'e<f', 'r<e', 'r<i', 'c<r', 'c<f'];
    else raise exception 'Unknown trace focus' using errcode = '22023';
  end case;

  foreach step in array steps loop
    case step
      -- The requirements whose latest revision maps the controls, in the program when one is named.
      when 'r<c' then r := r || array(
        select q.id
        from public.requirement_control_links l
        join public.requirement_revisions v on v.tenant_id = l.tenant_id and v.id = l.requirement_revision_id
        join public.engineering_requirements q on q.tenant_id = v.tenant_id and q.id = v.engineering_requirement_id
        where l.tenant_id = p_tenant_id and l.control_id = any(c)
          and (p_program_id is null or q.program_id = p_program_id)
          and v.version_number = (select max(x.version_number) from public.requirement_revisions x
            where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id));
      when 'c<r' then c := c || array(
        select l.control_id
        from public.requirement_control_links l
        join public.requirement_revisions v on v.tenant_id = l.tenant_id and v.id = l.requirement_revision_id
        where l.tenant_id = p_tenant_id and v.engineering_requirement_id = any(r)
          and v.version_number = (select max(x.version_number) from public.requirement_revisions x
            where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id));
      when 'e<r' then e := e || array(
        select ev.artifact_id
        from public.requirement_evidence re
        join public.requirement_revisions v on v.tenant_id = re.tenant_id and v.id = re.requirement_revision_id
        join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
        where re.tenant_id = p_tenant_id and v.engineering_requirement_id = any(r)
          and v.version_number = (select max(x.version_number) from public.requirement_revisions x
            where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id));
      when 'r<e' then r := r || array(
        select q.id
        from public.requirement_evidence re
        join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
        join public.requirement_revisions v on v.tenant_id = re.tenant_id and v.id = re.requirement_revision_id
        join public.engineering_requirements q on q.tenant_id = v.tenant_id and q.id = v.engineering_requirement_id
        where re.tenant_id = p_tenant_id and ev.artifact_id = any(e)
          and (p_program_id is null or q.program_id = p_program_id)
          and v.version_number = (select max(x.version_number) from public.requirement_revisions x
            where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id));
      -- The requirements the issues name, and the issues that name the requirements.
      when 'r<i' then r := r || array(
        select l.engineering_requirement_id
        from public.issue_requirements l
        where l.tenant_id = p_tenant_id and l.issue_id = any(i)
          and (p_program_id is null or l.program_id = p_program_id));
      when 'i<r' then i := i || array(
        select l.issue_id
        from public.issue_requirements l
        where l.tenant_id = p_tenant_id and l.engineering_requirement_id = any(r)
          and (p_program_id is null or l.program_id = p_program_id));
      when 'i<e' then i := i || array(
        select cited.issue_id
        from public.assurance_issue_evidence(p_tenant_id) cited
        join public.operational_issues o on o.tenant_id = p_tenant_id and o.id = cited.issue_id
        where cited.artifact_id = any(e) and (p_program_id is null or o.program_id = p_program_id));
      when 'e<i' then e := e || array(
        select cited.artifact_id
        from public.assurance_issue_evidence(p_tenant_id) cited
        where cited.issue_id = any(i));
      -- The findings that judge the controls, and the controls the findings judge.
      when 'f<c' then fd := fd || array(
        select a.finding_id
        from public.assurance_findings(p_tenant_id) a
        where a.control_id = any(c) and a.published
          and (p_program_id is null or a.program_id = p_program_id));
      when 'c<f' then c := c || array(
        select a.control_id
        from public.assurance_findings(p_tenant_id) a
        where a.finding_id = any(fd) and a.control_id is not null);
      -- The findings that cite the evidence, and the evidence the findings cite.
      when 'f<e' then fd := fd || array(
        select a.finding_id
        from public.assurance_finding_evidence(p_tenant_id) cited
        join public.assurance_findings(p_tenant_id) a on a.finding_id = cited.finding_id
        where cited.artifact_id = any(e) and a.published
          and (p_program_id is null or a.program_id = p_program_id));
      when 'e<f' then e := e || array(
        select cited.artifact_id
        from public.assurance_finding_evidence(p_tenant_id) cited
        where cited.finding_id = any(fd));
      -- The issues the findings became, and the findings the issues came from.
      when 'i<f' then i := i || array(
        select became.issue_id
        from public.assurance_finding_issues(p_tenant_id) became
        join public.operational_issues o on o.tenant_id = p_tenant_id and o.id = became.issue_id
        where became.finding_id = any(fd) and (p_program_id is null or o.program_id = p_program_id));
      when 'f<i' then fd := fd || array(
        select a.finding_id
        from public.assurance_finding_issues(p_tenant_id) became
        join public.assurance_findings(p_tenant_id) a on a.finding_id = became.finding_id
        where became.issue_id = any(i) and a.published
          and (p_program_id is null or a.program_id = p_program_id));
      when 'k<i' then k := k || array(
        select rests.risk_id
        from public.assurance_issue_risks(p_tenant_id) rests
        where rests.issue_id = any(i));
      when 'i<k' then i := i || array(
        select rests.issue_id
        from public.assurance_issue_risks(p_tenant_id) rests
        where rests.risk_id = any(k));
      -- The risks the findings raised, and the findings that raised the risks.
      when 'k<f' then k := k || array(
        select raised.risk_id
        from public.assurance_finding_risks(p_tenant_id) raised
        where raised.finding_id = any(fd));
      when 'f<k' then fd := fd || array(
        select a.finding_id
        from public.assurance_finding_risks(p_tenant_id) raised
        join public.assurance_findings(p_tenant_id) a on a.finding_id = raised.finding_id
        where raised.risk_id = any(k) and a.published
          and (p_program_id is null or a.program_id = p_program_id));
      when 'm<i' then m := m || array(
        select ip.poam_item_id
        from public.issue_poams ip
        where ip.tenant_id = p_tenant_id and ip.issue_id = any(i));
      when 'i<m' then i := i || array(
        select ip.issue_id
        from public.issue_poams ip
        where ip.tenant_id = p_tenant_id and ip.poam_item_id = any(m));
      -- The items whose latest commitment cites the risks, and the risks it cites.
      when 'm<k' then m := m || array(
        select answers.poam_item_id
        from public.assurance_remediation_risks(p_tenant_id) answers
        where answers.risk_id = any(k));
      when 'k<m' then k := k || array(
        select answers.risk_id
        from public.assurance_remediation_risks(p_tenant_id) answers
        where answers.poam_item_id = any(m));
    end case;
    -- Each record once in its stage.
    c := array(select distinct x from unnest(c) x);
    r := array(select distinct x from unnest(r) x);
    e := array(select distinct x from unnest(e) x);
    fd := array(select distinct x from unnest(fd) x);
    i := array(select distinct x from unnest(i) x);
    k := array(select distinct x from unnest(k) x);
    m := array(select distinct x from unnest(m) x);
    if greatest(cardinality(c), cardinality(r), cardinality(e), cardinality(fd), cardinality(i),
        cardinality(k), cardinality(m)) > cap then
      clipped := true;
      c := c[1:cap]; r := r[1:cap]; e := e[1:cap]; fd := fd[1:cap]; i := i[1:cap]; k := k[1:cap];
      m := m[1:cap];
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
    -- The findings, the verdicts short of satisfied first and the latest of each first.
    'findings', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', f.id, 'title', f.title, 'determination', f.determination,
        'determined_at', f.determined_at, 'results_state', rr.state, 'program_id', g.program_id
      ) order by array_position(
          '{other_than_satisfied,partially_satisfied,not_assessed,satisfied}'::text[], f.determination),
        f.determined_at desc nulls last, f.title, f.id), '[]'::jsonb)
      from public.assessment_findings f
      left join public.assessment_results_revisions rr
        on rr.tenant_id = f.tenant_id and rr.id = f.assessment_results_revision_id
      left join public.assessment_plan_revisions pl
        on pl.tenant_id = rr.tenant_id and pl.id = rr.assessment_plan_revision_id
      left join public.assessment_campaigns g on g.tenant_id = pl.tenant_id and g.id = pl.campaign_id
      where f.tenant_id = p_tenant_id and f.id = any(fd)),
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
      -- A requirement and an issue that names it: drawn straight from one to the other.
      'requirement_issue', (
        select coalesce(jsonb_agg(distinct jsonb_build_array(l.engineering_requirement_id, l.issue_id)), '[]'::jsonb)
        from public.issue_requirements l
        where l.tenant_id = p_tenant_id and l.engineering_requirement_id = any(r) and l.issue_id = any(i)),
      -- A control and a finding that judges one of its parts: drawn across requirements and evidence.
      'control_finding', (
        select coalesce(jsonb_agg(distinct jsonb_build_array(a.control_id, a.finding_id)), '[]'::jsonb)
        from public.assurance_findings(p_tenant_id) a
        where a.control_id = any(c) and a.finding_id = any(fd)),
      'evidence_finding', (
        select coalesce(jsonb_agg(distinct jsonb_build_array(cited.artifact_id, cited.finding_id)), '[]'::jsonb)
        from public.assurance_finding_evidence(p_tenant_id) cited
        where cited.artifact_id = any(e) and cited.finding_id = any(fd)),
      'finding_issue', (
        select coalesce(jsonb_agg(distinct jsonb_build_array(became.finding_id, became.issue_id)), '[]'::jsonb)
        from public.assurance_finding_issues(p_tenant_id) became
        where became.finding_id = any(fd) and became.issue_id = any(i)),
      'issue_risk', (
        select coalesce(jsonb_agg(distinct jsonb_build_array(rests.issue_id, rests.risk_id)), '[]'::jsonb)
        from public.assurance_issue_risks(p_tenant_id) rests
        where rests.issue_id = any(i) and rests.risk_id = any(k)),
      -- A finding and a risk it raised: drawn across the issues.
      'finding_risk', (
        select coalesce(jsonb_agg(distinct jsonb_build_array(raised.finding_id, raised.risk_id)), '[]'::jsonb)
        from public.assurance_finding_risks(p_tenant_id) raised
        where raised.finding_id = any(fd) and raised.risk_id = any(k)),
      'issue_remediation', (
        select coalesce(jsonb_agg(distinct jsonb_build_array(ip.issue_id, ip.poam_item_id)), '[]'::jsonb)
        from public.issue_poams ip
        where ip.tenant_id = p_tenant_id and ip.issue_id = any(i) and ip.poam_item_id = any(m)),
      -- A risk and a remediation item whose latest commitment cites it.
      'risk_remediation', (
        select coalesce(jsonb_agg(distinct jsonb_build_array(answers.risk_id, answers.poam_item_id)), '[]'::jsonb)
        from public.assurance_remediation_risks(p_tenant_id) answers
        where answers.risk_id = any(k) and answers.poam_item_id = any(m))
    )
  );
end; $$;
revoke all on function public.assurance_trace(uuid, text, uuid, uuid) from public, anon;
grant execute on function public.assurance_trace(uuid, text, uuid, uuid) to authenticated;
comment on function public.assurance_trace(uuid, text, uuid, uuid) is 'The assurance chain around one record (a control, requirement, evidence artifact, assessment finding, operational issue, risk or remediation item): the records of each stage it reaches, walking outward only, and the links between them. An issue reaches a requirement through the evidence it cites and through the requirements it names (issue_requirements). A finding judges the control of its target part, cites evidence (finding_evidence), became the issues resting on an observation it rests on, and raised the risks it names (finding_risks); a walk reaches findings of published results only. A remediation item answers the issues it is linked to (issue_poams) and the risks its latest commitment cites (poam_item_risks). p_program_id keeps a control''s requirements, findings and issues to one program.';

notify pgrst, 'reload schema';
