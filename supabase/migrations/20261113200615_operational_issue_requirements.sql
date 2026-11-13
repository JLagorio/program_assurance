-- An operational issue names the requirements it is about.
--
-- Until now an issue reached a requirement only through the evidence it cites, directly or through
-- one of its observations (assurance_issue_evidence, migration 20261111090000_assurance_trace). An
-- issue raised against a requirement and citing no evidence, such as an assessment that found the
-- requirement unmet, stood nowhere on its program's Posture, and its trace reached the requirement
-- only by way of evidence, if at all.
--
--   issue_requirements   a requirement an operational issue is about: one row an issue and a
--                        requirement, both of the link's program
--
-- The link belongs to the issue, as a task's link to an issue does (task_issues). It names the
-- requirement, not one of its revisions: the issue is about the requirement whatever its wording,
-- so a requirement revised or published keeps it, and a member who may write makes and removes it
-- at any time. A link is removed and made again, never moved. Its foreign keys keep both ends in
-- the link's program, so an issue that names requirements stays in their program.
--
-- The chain reads walk it beside the evidence path. Their signatures, grants and answers are the
-- same, but for one more list among assurance_trace's links.
--
--   assurance_trace                  from an issue (and from a risk or a remediation item, through
--                                    its issues) reaches the requirements the issue names; from a
--                                    requirement (and from a control, through its requirements)
--                                    the issues that name it. The walk still goes outward only:
--                                    from evidence it reaches the issues that cite it, not those
--                                    naming a requirement it supports. links.requirement_issue
--                                    holds the pairs.
--   program_posture                  an issue stands where the requirements it names stand, as it
--   program_posture_cell             stands where those its evidence supports stand, and a risk
--   program_resiliency_posture       where its issues stand; every record counts once wherever it
--   program_resiliency_posture_cell  stands, by either path or both.
--
-- Every statement here can run again: this migration is also applied by hand.

-- ---------------------------------------------------------------------------------------------
-- The link: one row an issue and a requirement of the same program.
-- ---------------------------------------------------------------------------------------------
-- An issue named by its workspace, its program and itself, as a requirement already is
-- (engineering_requirements' unique (tenant_id, program_id, id)): what the link's keys refer to.
do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.operational_issues'::regclass and conname = 'operational_issues_tenant_program_id_key') then
    alter table public.operational_issues
      add constraint operational_issues_tenant_program_id_key unique (tenant_id, program_id, id);
  end if;
end $$;

create table if not exists public.issue_requirements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  program_id uuid not null,
  issue_id uuid not null,
  engineering_requirement_id uuid not null,
  unique (tenant_id, id),
  unique (tenant_id, issue_id, engineering_requirement_id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id) on delete restrict,
  foreign key (tenant_id, program_id, issue_id)
    references public.operational_issues(tenant_id, program_id, id) on delete restrict,
  foreign key (tenant_id, program_id, engineering_requirement_id)
    references public.engineering_requirements(tenant_id, program_id, id) on delete restrict
);

-- The tenancy and the audit columns an issue's other link tables have, through the helpers that
-- give them: each is called once, since the helpers create and do not replace.
do $$
begin
  if not exists (select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'issue_requirements' and policyname = 'tenant_read') then
    perform public.apply_tenant_security('issue_requirements');
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.issue_requirements'::regclass and tgname = 'record_lifecycle' and not tgisinternal) then
    perform public.attach_record_lifecycle('issue_requirements', false);
  end if;
end $$;
-- A link is removed and made again, never moved.
create or replace trigger stable_context before update on public.issue_requirements
  for each row execute function public.guard_stable_assurance_context('program_id', 'issue_id', 'engineering_requirement_id');
-- The walk from a requirement to the issues that name it.
create index if not exists issue_requirements_requirement_idx
  on public.issue_requirements(tenant_id, engineering_requirement_id);

comment on table public.issue_requirements is 'A requirement an operational issue is about: one row an issue and a requirement of the same program. The link is the issue''s own, made and removed at any time; it names the requirement, not a revision, so it holds whatever revision the requirement is read at. The chain reads walk it beside the evidence the issue cites.';
comment on column public.issue_requirements.program_id is 'The program of both the issue and the requirement; the foreign keys keep them in it.';
comment on column public.issue_requirements.issue_id is 'The operational issue.';
comment on column public.issue_requirements.engineering_requirement_id is 'The requirement the issue is about.';

-- ---------------------------------------------------------------------------------------------
-- The chain around one record. As migration 20261111090000_assurance_trace walks it, with two more
-- steps: r+i adds the requirements the issues reached name, and i+r the issues that name the
-- requirements reached. Each is taken where the walk goes outward: from an issue up to its
-- requirements, from a requirement down to its issues.
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
    when 'control' then c := array[p_id]; steps := array['r<c', 'e<r', 'i<e', 'i+r', 'k<i', 'm<i'];
    when 'requirement' then r := array[p_id]; steps := array['c<r', 'e<r', 'i<e', 'i+r', 'k<i', 'm<i'];
    when 'evidence' then e := array[p_id]; steps := array['r<e', 'c<r', 'i<e', 'k<i', 'm<i'];
    when 'issue' then i := array[p_id]; steps := array['e<i', 'r<e', 'r+i', 'c<r', 'k<i', 'm<i'];
    when 'risk' then k := array[p_id]; steps := array['i<k', 'e<i', 'r<e', 'r+i', 'c<r', 'm<i'];
    when 'remediation' then m := array[p_id]; steps := array['i<m', 'e<i', 'r<e', 'r+i', 'c<r', 'k<i'];
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
      -- The requirements the issues name, beside those their evidence supports.
      when 'r+i' then
        select coalesce(array_agg(distinct found.id), '{}') into r
        from (
          select unnest(r) as id
          union
          select l.engineering_requirement_id
          from public.issue_requirements l
          where l.tenant_id = p_tenant_id and l.issue_id = any(i)
            and (p_program_id is null or l.program_id = p_program_id)
        ) found;
      when 'i<e' then
        select coalesce(array_agg(distinct cited.issue_id), '{}') into i
        from public.assurance_issue_evidence(p_tenant_id) cited
        join public.operational_issues o on o.tenant_id = p_tenant_id and o.id = cited.issue_id
        where cited.artifact_id = any(e) and (p_program_id is null or o.program_id = p_program_id);
      -- The issues that name the requirements, beside those that cite their evidence.
      when 'i+r' then
        select coalesce(array_agg(distinct found.id), '{}') into i
        from (
          select unnest(i) as id
          union
          select l.issue_id
          from public.issue_requirements l
          where l.tenant_id = p_tenant_id and l.engineering_requirement_id = any(r)
            and (p_program_id is null or l.program_id = p_program_id)
        ) found;
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
      -- A requirement and an issue that names it: drawn straight from one to the other.
      'requirement_issue', (
        select coalesce(jsonb_agg(distinct jsonb_build_array(l.engineering_requirement_id, l.issue_id)), '[]'::jsonb)
        from public.issue_requirements l
        where l.tenant_id = p_tenant_id and l.engineering_requirement_id = any(r) and l.issue_id = any(i)),
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
comment on function public.assurance_trace(uuid, text, uuid, uuid) is 'The assurance chain around one record (a control, requirement, evidence artifact, operational issue, risk or remediation item): the records of each stage it reaches, walking outward only, and the links between them. An issue reaches a requirement through the evidence it cites and through the requirements it names (issue_requirements). p_program_id keeps a control''s requirements to one program.';

-- ---------------------------------------------------------------------------------------------
-- A program's posture, as migration 20261111090000_assurance_trace counts it, with an issue also
-- standing where the requirements it names stand. issue_place says where every issue stands, open
-- or not; an open issue counts where it stands, and an open risk where its issues stand.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_posture(p_tenant_id uuid, p_program_id uuid)
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
comment on function public.program_posture(uuid, uuid) is 'A program''s posture: its system elements by the control families its requirements meet, with the requirements, the requirements with evidence, the open operational issues and the open risks that stand in each cell. An open issue stands where the requirements it names and those its evidence supports stand, and an open risk where its issues stand. An element''s numbers count the elements inside it, each record once.';

-- What stands in one cell of the posture, or on one element's or one family's whole line: the
-- open issues and risks worst first, the requirements with no evidence, and the controls met.
create or replace function public.program_posture_cell(
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
  -- The issues that stand in the cell: those whose evidence supports one of its requirements, and
  -- those that name one.
  issue_here as (
    select cited.issue_id
    from cited join req_ev on req_ev.artifact_id = cited.artifact_id
    union
    select l.issue_id
    from public.issue_requirements l
    join here on here.requirement_id = l.engineering_requirement_id
    where l.tenant_id = p_tenant_id and l.program_id = p_program_id
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
comment on function public.program_posture_cell(uuid, uuid, uuid, uuid) is 'What stands in one cell of a program''s posture (an element with the elements inside it, by a control family; either may be left out for a whole line): its open operational issues (those naming one of its requirements or citing their evidence) and open risks worst first, up to 50 requirements with no evidence, and the controls its requirements map.';

-- ---------------------------------------------------------------------------------------------
-- The posture by cyber resiliency technique, as migration 20261111141000_program_resiliency_posture
-- counts it, with an issue also standing where the requirements it names stand.
-- ---------------------------------------------------------------------------------------------
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
comment on function public.program_resiliency_posture(uuid) is 'A program''s posture by cyber resiliency technique: its system elements by the techniques of NIST SP 800-160 Vol. 2 Rev. 1 that the controls its requirements meet support in Table E-1, with the requirements, the requirements with evidence, the open operational issues and the open risks that stand in each cell. A requirement stands under every technique its controls support and counts once on a line; totals.placed is how many stand under any. An open issue stands where the requirements it names and those its evidence supports stand, and an open risk where its issues stand. An element''s numbers count the elements inside it, each record once.';

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
  -- The issues that stand in the cell: those whose evidence supports one of its requirements, and
  -- those that name one.
  issue_here as (
    select cited.issue_id
    from cited join req_ev on req_ev.artifact_id = cited.artifact_id
    union
    select l.issue_id
    from public.issue_requirements l
    join here on here.requirement_id = l.engineering_requirement_id
    where l.tenant_id = v_tenant and l.program_id = p_program_id
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
comment on function public.program_resiliency_posture_cell(uuid, uuid, text) is 'What stands in one cell of a program''s posture by cyber resiliency technique (an element with the elements inside it, by a technique''s code; either may be left out for a whole line): its open operational issues (those naming one of its requirements or citing their evidence) and open risks worst first, up to 50 requirements with no evidence, and the controls its requirements map that support the technique.';
