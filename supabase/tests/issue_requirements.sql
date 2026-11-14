-- Run with psql -v ON_ERROR_STOP=1 after migrations and the pinned reference data
-- (npm run seed:reference). Every test row rolls back.
-- The requirements an operational issue names: who links and unlinks, that both ends stay in one
-- workspace and one program, that a link is never moved, the trace both ways and outward only,
-- and the Posture, by control family and by resiliency technique, placing a linked issue once.
begin;
create function pg_temp.expect_error(statement text, expected_state text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_state then return; end if;
    raise exception 'Expected SQLSTATE %, got %: %', expected_state, sqlstate, sqlerrm;
  end;
  raise exception 'Statement unexpectedly succeeded: %', statement;
end;
$$;
grant execute on function pg_temp.expect_error(text, text) to authenticated, anon;
create function pg_temp.ids(answer jsonb) returns uuid[] language sql immutable as $$
  select coalesce(array_agg((x->>'id')::uuid order by x->>'id'), '{}') from jsonb_array_elements(answer) x
$$;
grant execute on function pg_temp.ids(jsonb) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- The reference data the test reads: a catalog control in a family that Table E-1 of NIST SP
-- 800-160 Vol. 2 prints under a resiliency technique and a reference baseline selects, that
-- technique, and the smallest such baseline.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_control uuid; v_technique text;
begin
  select s.control_id, t.code into v_control, v_technique
  from public.framework_control_link_rows s
  join public.controls c on c.id = s.control_id
  join public.framework_item_rows t on t.framework_code = s.framework_code and t.tenant_id is null
    and t.kind = 'technique' and t.code = coalesce(s.technique_code, case when s.item_kind = 'technique' then s.item_code end)
  where s.tenant_id is null and s.framework_code = 'nist-sp800-160v2r1-cref' and s.relation = 'supports'
    and c.group_id is not null
    -- A control a reference baseline selects, so the program's system can hold it.
    and exists (select 1 from public.selected_controls sc
      join public.profile_resolutions r on r.id = sc.profile_resolution_id
      where sc.control_id = s.control_id and r.tenant_id is null and r.state = 'published'
        and r.base_profile_resolution_id is null)
  order by s.control_order, s.control_id, t.code
  limit 1;
  if v_control is null then
    raise exception 'The reference data is not loaded. Run npm run seed:reference first.';
  end if;
  perform set_config('test.control', v_control::text, true);
  perform set_config('test.family', (select group_id::text from public.controls where id = v_control), true);
  perform set_config('test.technique', v_technique, true);
  -- The smallest published reference baseline that selects the control, which the system adopts.
  perform set_config('test.baseline', (
    select r.id::text from public.profile_resolutions r
    where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
      and exists (select 1 from public.selected_controls sc where sc.profile_resolution_id = r.id and sc.control_id = v_control)
    order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id
    limit 1), true);
  if current_setting('test.baseline') = '' then
    raise exception 'No reference baseline selects the control. Run npm run seed:reference first.';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- A workspace: its owner, an editor and a viewer; and a member of another workspace.
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email, raw_user_meta_data) values
  ('c8000000-0000-0000-0000-000000000001', 'issue-requirement-owner@example.test', '{"name":"Issue requirement test owner"}'),
  ('c8000000-0000-0000-0000-000000000002', 'issue-requirement-editor@example.test', '{"name":"Issue requirement test editor"}'),
  ('c8000000-0000-0000-0000-000000000003', 'issue-requirement-viewer@example.test', '{"name":"Issue requirement test viewer"}'),
  ('c8000000-0000-0000-0000-000000000004', 'issue-requirement-outsider@example.test', '{"name":"Issue requirement test outsider"}');
select set_config('request.jwt.claim.sub', 'c8000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'c8000000-0000-0000-0000-000000000002', 'editor'),
  (current_setting('test.tenant')::uuid, 'c8000000-0000-0000-0000-000000000003', 'viewer');

-- ---------------------------------------------------------------------------------------------
-- The program: a system that holds one element, on a reference baseline that selects the control,
-- and three requirements that meet the control, their mappings naming no system (so each stands on
-- the elements its requirement is allocated to).
--   REQ-NAMED  allocated to the element, without evidence
--   REQ-BOTH   allocated to the element, with the evidence report
--   REQ-LOOSE  allocated to no element
-- Another program holds REQ-ELSEWHERE.
-- Its operational issues:
--   I-BOTH   open, high: names REQ-NAMED and REQ-BOTH, and cites the report
--   I-LOOSE  open, moderate: names REQ-LOOSE
--   I-CLOSED closed: names REQ-NAMED; the risk rests on it
--   I-NAMED  open, low: names REQ-BOTH and cites nothing
-- ---------------------------------------------------------------------------------------------
insert into public.programs(id, tenant_id, code, name) values
  ('c8100000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'ISSUE-REQ', 'Rollback issue requirement program'),
  ('c8100000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'ISSUE-REQ-OTHER', 'Another rollback program');
insert into public.systems(id, tenant_id, program_id, code, name, system_type) values
  ('c8200000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'SYS-ROOT', 'Mission system', 'information_system');
insert into public.systems(id, tenant_id, program_id, code, name, system_type, parent_system_id, is_authorization_boundary) values
  ('c8200000-0000-0000-0000-00000000000a', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'SYS-A', 'Flight computer', 'software', 'c8200000-0000-0000-0000-000000000001', false);
-- The system adopts the baseline as the system baseline dialog would; a guard keeps the column to
-- that command, so the test sets it as the database's owner.
reset role;
update public.systems set adopted_profile_resolution_id = current_setting('test.baseline')::uuid, revision = revision + 1
  where id = 'c8200000-0000-0000-0000-000000000001';
set local role authenticated;
insert into public.engineering_requirements(id, tenant_id, program_id, code) values
  ('c8300000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'REQ-NAMED'),
  ('c8300000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'REQ-BOTH'),
  ('c8300000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'REQ-LOOSE'),
  ('c8300000-0000-0000-0000-000000000004', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000002', 'REQ-ELSEWHERE');
insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type)
  select ('c8400000-0000-0000-0000-00000000000' || n)::uuid, current_setting('test.tenant')::uuid,
    ('c8300000-0000-0000-0000-00000000000' || n)::uuid, 1, 'Requirement ' || n,
    'The element signs every record.', 'Every record verifies.', 'security'
  from generate_series(1, 4) n;
insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type)
  select current_setting('test.tenant')::uuid, ('c8400000-0000-0000-0000-00000000000' || n)::uuid,
    current_setting('test.control')::uuid, 'satisfies'
  from generate_series(1, 4) n;
insert into public.requirement_allocations(tenant_id, requirement_revision_id, system_id) values
  (current_setting('test.tenant')::uuid, 'c8400000-0000-0000-0000-000000000001', 'c8200000-0000-0000-0000-00000000000a'),
  (current_setting('test.tenant')::uuid, 'c8400000-0000-0000-0000-000000000002', 'c8200000-0000-0000-0000-00000000000a');
insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind, program_id) values
  ('c8500000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'Rollback signature test report', 'document', 'c8100000-0000-0000-0000-000000000001');
insert into public.evidence_versions(id, tenant_id, artifact_id, version_number, state, external_uri) values
  ('c8510000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c8500000-0000-0000-0000-000000000001', 1, 'published', 'https://example.test/evidence/signature-report');
insert into public.requirement_evidence(tenant_id, requirement_revision_id, evidence_version_id) values
  (current_setting('test.tenant')::uuid, 'c8400000-0000-0000-0000-000000000002', 'c8510000-0000-0000-0000-000000000001');
insert into public.operational_issues(id, tenant_id, program_id, title, status, severity) values
  ('c8600000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'Signatures fail on two requirements', 'open', 'high'),
  ('c8600000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'Unmet requirement REQ-LOOSE', 'open', 'moderate'),
  ('c8600000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'Unmet requirement REQ-NAMED', 'closed', 'moderate'),
  ('c8600000-0000-0000-0000-000000000004', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'Unmet requirement REQ-BOTH', 'open', 'low'),
  ('c8600000-0000-0000-0000-000000000005', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000002', 'Another program''s issue', 'open', 'low');
insert into public.issue_evidence(tenant_id, issue_id, evidence_version_id) values
  (current_setting('test.tenant')::uuid, 'c8600000-0000-0000-0000-000000000001', 'c8510000-0000-0000-0000-000000000001');
-- The risk rests on the closed issue: its latest assessment is supported by one of its observations.
insert into public.observations(id, tenant_id, program_id, title, method) values
  ('c8700000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'REQ-NAMED does not hold', 'examine');
insert into public.issue_observations(tenant_id, issue_id, observation_id) values
  (current_setting('test.tenant')::uuid, 'c8600000-0000-0000-0000-000000000003', 'c8700000-0000-0000-0000-000000000001');
insert into public.risks(id, tenant_id, program_id, title) values
  ('c8800000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'Records become unverifiable');
insert into public.risk_revisions(id, tenant_id, risk_id, version_number, severity) values
  ('c8810000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c8800000-0000-0000-0000-000000000001', 1, 'high');
insert into public.risk_observations(tenant_id, risk_revision_id, observation_id) values
  (current_setting('test.tenant')::uuid, 'c8810000-0000-0000-0000-000000000001', 'c8700000-0000-0000-0000-000000000001');

-- Before any issue names a requirement, only the issue that cites the report stands on the Posture,
-- and the risk on a closed issue that cites nothing stands nowhere.
do $$
declare answer jsonb;
begin
  answer := public.program_posture(current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001');
  if (answer->'totals'->>'issues')::integer <> 3 or (answer->'totals'->>'issues_placed')::integer <> 1
    or (answer->'totals'->>'risks')::integer <> 1 or (answer->'totals'->>'risks_placed')::integer <> 0 then
    raise exception 'The posture does not start from the evidence path alone: %', answer->'totals';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- A member links a requirement to an issue, once, with the audit stamps every record carries.
-- ---------------------------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'c8000000-0000-0000-0000-000000000002', true);
insert into public.issue_requirements(id, tenant_id, program_id, issue_id, engineering_requirement_id) values
  ('c8900000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000001', 'c8300000-0000-0000-0000-000000000001');
do $$
declare link public.issue_requirements;
begin
  select * into link from public.issue_requirements where id = 'c8900000-0000-0000-0000-000000000001';
  if link.revision <> 1 or link.created_by <> 'c8000000-0000-0000-0000-000000000002'
    or link.updated_by <> 'c8000000-0000-0000-0000-000000000002' or link.created_at is null then
    raise exception 'An issue''s requirement link does not carry its audit stamps';
  end if;
end $$;
select pg_temp.expect_error(format($$insert into public.issue_requirements(tenant_id, program_id, issue_id, engineering_requirement_id)
  values (%L, 'c8100000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000001', 'c8300000-0000-0000-0000-000000000001')$$,
  current_setting('test.tenant')), '23505');
-- Linking what is already linked again passes over it, as the product's command does.
insert into public.issue_requirements(tenant_id, program_id, issue_id, engineering_requirement_id) values
  (current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000001', 'c8300000-0000-0000-0000-000000000001')
  on conflict (tenant_id, issue_id, engineering_requirement_id) do nothing;
insert into public.issue_requirements(id, tenant_id, program_id, issue_id, engineering_requirement_id) values
  ('c8900000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000001', 'c8300000-0000-0000-0000-000000000002'),
  ('c8900000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000002', 'c8300000-0000-0000-0000-000000000003'),
  ('c8900000-0000-0000-0000-000000000004', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000003', 'c8300000-0000-0000-0000-000000000001'),
  ('c8900000-0000-0000-0000-000000000005', current_setting('test.tenant')::uuid, 'c8100000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000004', 'c8300000-0000-0000-0000-000000000002');
do $$ begin
  if (select count(*) from public.issue_requirements where issue_id = 'c8600000-0000-0000-0000-000000000001') <> 2 then
    raise exception 'An issue names a requirement more than once';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Both ends in one program: the link's program is the issue's and the requirement's.
-- ---------------------------------------------------------------------------------------------
-- A requirement of another program, under the issue's program or under the requirement's.
select pg_temp.expect_error(format($$insert into public.issue_requirements(tenant_id, program_id, issue_id, engineering_requirement_id)
  values (%L, 'c8100000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000001', 'c8300000-0000-0000-0000-000000000004')$$,
  current_setting('test.tenant')), '23503');
select pg_temp.expect_error(format($$insert into public.issue_requirements(tenant_id, program_id, issue_id, engineering_requirement_id)
  values (%L, 'c8100000-0000-0000-0000-000000000002', 'c8600000-0000-0000-0000-000000000001', 'c8300000-0000-0000-0000-000000000004')$$,
  current_setting('test.tenant')), '23503');
-- Another program's issue naming this program's requirement.
select pg_temp.expect_error(format($$insert into public.issue_requirements(tenant_id, program_id, issue_id, engineering_requirement_id)
  values (%L, 'c8100000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000005', 'c8300000-0000-0000-0000-000000000001')$$,
  current_setting('test.tenant')), '23503');
-- An issue that names requirements keeps to their program.
select pg_temp.expect_error($$update public.operational_issues set program_id = 'c8100000-0000-0000-0000-000000000002', revision = 2
  where id = 'c8600000-0000-0000-0000-000000000001'$$, '23503');
-- A link is removed and made again, never moved.
select pg_temp.expect_error($$update public.issue_requirements set engineering_requirement_id = 'c8300000-0000-0000-0000-000000000003', revision = 2
  where id = 'c8900000-0000-0000-0000-000000000001'$$, '23514');
select pg_temp.expect_error($$update public.issue_requirements set issue_id = 'c8600000-0000-0000-0000-000000000004', revision = 2
  where id = 'c8900000-0000-0000-0000-000000000001'$$, '23514');

-- ---------------------------------------------------------------------------------------------
-- The trace walks the link both ways, and outward only.
-- ---------------------------------------------------------------------------------------------
do $$
declare t jsonb; v_tenant uuid := current_setting('test.tenant')::uuid;
begin
  -- From the issue: the requirements it names, beside the one its evidence supports, and where
  -- they reach. The other issues on those requirements are not walked back to.
  t := public.assurance_trace(v_tenant, 'issue', 'c8600000-0000-0000-0000-000000000001');
  if pg_temp.ids(t->'requirements') <> array['c8300000-0000-0000-0000-000000000001', 'c8300000-0000-0000-0000-000000000002']::uuid[]
    or pg_temp.ids(t->'controls') <> array[current_setting('test.control')::uuid]
    or pg_temp.ids(t->'evidence') <> array['c8500000-0000-0000-0000-000000000001']::uuid[]
    or pg_temp.ids(t->'elements') <> array['c8200000-0000-0000-0000-00000000000a']::uuid[]
    or pg_temp.ids(t->'issues') <> array['c8600000-0000-0000-0000-000000000001']::uuid[] then
    raise exception 'The trace from an issue does not reach the requirements it names: %', t - 'links';
  end if;
  if t->'links'->'requirement_issue' <> jsonb_build_array(
      jsonb_build_array('c8300000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000001'),
      jsonb_build_array('c8300000-0000-0000-0000-000000000002', 'c8600000-0000-0000-0000-000000000001')) then
    raise exception 'The trace does not hold the issue''s requirement links: %', t->'links';
  end if;
  -- From a requirement: the issues that name it, and the risk that rests on one of them.
  t := public.assurance_trace(v_tenant, 'requirement', 'c8300000-0000-0000-0000-000000000001');
  if pg_temp.ids(t->'issues') <> array['c8600000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000003']::uuid[]
    or pg_temp.ids(t->'risks') <> array['c8800000-0000-0000-0000-000000000001']::uuid[]
    or t->'evidence' <> '[]'::jsonb then
    raise exception 'The trace from a requirement does not reach the issues that name it: %', t - 'links';
  end if;
  -- From the control, kept to the program: every issue on its requirements, by either path.
  t := public.assurance_trace(v_tenant, 'control', current_setting('test.control')::uuid, 'c8100000-0000-0000-0000-000000000001');
  if pg_temp.ids(t->'issues') <> array['c8600000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000002',
      'c8600000-0000-0000-0000-000000000003', 'c8600000-0000-0000-0000-000000000004']::uuid[] then
    raise exception 'The trace from a control does not reach the issues its requirements are named by: %', t->'issues';
  end if;
  -- From the evidence: the issue that cites it, never the one that only names a requirement it supports.
  t := public.assurance_trace(v_tenant, 'evidence', 'c8500000-0000-0000-0000-000000000001');
  if pg_temp.ids(t->'requirements') <> array['c8300000-0000-0000-0000-000000000002']::uuid[]
    or pg_temp.ids(t->'issues') <> array['c8600000-0000-0000-0000-000000000001']::uuid[] then
    raise exception 'The trace from evidence walks back through a requirement to the issues naming it: %', t - 'links';
  end if;
  -- From the risk: its issue, and the requirement that issue names.
  t := public.assurance_trace(v_tenant, 'risk', 'c8800000-0000-0000-0000-000000000001');
  if pg_temp.ids(t->'issues') <> array['c8600000-0000-0000-0000-000000000003']::uuid[]
    or pg_temp.ids(t->'requirements') <> array['c8300000-0000-0000-0000-000000000001']::uuid[]
    or pg_temp.ids(t->'controls') <> array[current_setting('test.control')::uuid] then
    raise exception 'The trace from a risk does not reach the requirement its issue names: %', t - 'links';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- The Posture places an issue where the requirements it names stand, each record once.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  answer jsonb; cell jsonb; v_tenant uuid := current_setting('test.tenant')::uuid;
  -- The objectives the control counts, as its control status counts them.
  v_objectives integer := jsonb_array_length(public.program_control_objectives(
    'c8100000-0000-0000-0000-000000000001', current_setting('test.control')::uuid)->'objectives');
begin
  answer := public.program_posture(v_tenant, 'c8100000-0000-0000-0000-000000000001');
  -- Three open issues: the one on both requirements once, the one naming a requirement no element
  -- holds not at all, and the low one naming a requirement with evidence it does not cite. The
  -- risk on a closed issue stands where that issue's requirement stands.
  if (answer->'totals'->>'issues')::integer <> 3 or (answer->'totals'->>'issues_placed')::integer <> 2
    or (answer->'totals'->>'risks')::integer <> 1 or (answer->'totals'->>'risks_placed')::integer <> 1 then
    raise exception 'The posture does not place the issues by the requirements they name: %', answer->'totals';
  end if;
  for cell in select c from jsonb_array_elements(answer->'cells') c
    where c->>'family_id' = current_setting('test.family')
      and c->>'element_id' in ('c8200000-0000-0000-0000-000000000001', 'c8200000-0000-0000-0000-00000000000a') loop
    -- REQ-BOTH maps the whole control and cites the report: every objective has evidence there.
    if v_objectives < 1 or (cell->>'objectives')::integer <> v_objectives or (cell->>'evidenced')::integer <> v_objectives
      or (cell->>'issues')::integer <> 2 or (cell->>'issue_severity')::integer <> 3
      or (cell->>'risks')::integer <> 1 or (cell->>'risk_severity')::integer <> 3 then
      raise exception 'A cell does not count each issue and risk once: %', cell;
    end if;
  end loop;
  if (select count(*) from jsonb_array_elements(answer->'cells') c where c->>'family_id' = current_setting('test.family')) <> 2 then
    raise exception 'The posture does not hold the element and the system that holds it: %', answer->'cells';
  end if;
  if exists (select 1 from jsonb_array_elements(answer->'elements') e
      where (e->>'issues')::integer <> 2 or (e->>'risks')::integer <> 1)
    or exists (select 1 from jsonb_array_elements(answer->'families') f
      where f->>'id' = current_setting('test.family') and ((f->>'issues')::integer <> 2 or (f->>'risks')::integer <> 1)) then
    raise exception 'A line does not count each issue and risk once: % %', answer->'elements', answer->'families';
  end if;
  -- The cell's records: the issues worst first, each once, and the risk. REQ-NAMED cites no
  -- evidence, and REQ-BOTH's covers every objective it covers, so nothing is left to evidence.
  answer := public.program_posture_cell(v_tenant, 'c8100000-0000-0000-0000-000000000001',
    'c8200000-0000-0000-0000-000000000001', current_setting('test.family')::uuid);
  if (select jsonb_agg(i->>'id') from jsonb_array_elements(answer->'issues') i)
      <> '["c8600000-0000-0000-0000-000000000001", "c8600000-0000-0000-0000-000000000004"]'::jsonb
    or pg_temp.ids(answer->'risks') <> array['c8800000-0000-0000-0000-000000000001']::uuid[]
    or answer->'unevidenced' <> '[]'::jsonb or (answer->>'unevidenced_count')::integer <> 0 then
    raise exception 'A cell does not list the issues that name its requirements: %', answer;
  end if;
  -- By resiliency technique: the same issues under the technique the control supports.
  answer := public.program_resiliency_posture('c8100000-0000-0000-0000-000000000001');
  if (answer->'totals'->>'issues_placed')::integer <> 2 or (answer->'totals'->>'risks_placed')::integer <> 1 then
    raise exception 'The posture by technique does not place the issues by the requirements they name: %', answer->'totals';
  end if;
  select c into cell from jsonb_array_elements(answer->'cells') c
    where c->>'technique_code' = current_setting('test.technique') and c->>'element_id' = 'c8200000-0000-0000-0000-000000000001';
  if (cell->>'issues')::integer <> 2 or (cell->>'risks')::integer <> 1 then
    raise exception 'A cell by technique does not count each issue and risk once: %', cell;
  end if;
  answer := public.program_resiliency_posture_cell('c8100000-0000-0000-0000-000000000001',
    'c8200000-0000-0000-0000-00000000000a', current_setting('test.technique'));
  if pg_temp.ids(answer->'issues') <> array['c8600000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000004']::uuid[]
    or pg_temp.ids(answer->'risks') <> array['c8800000-0000-0000-0000-000000000001']::uuid[] then
    raise exception 'A cell by technique does not list the issues that name its requirements: %', answer;
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Who reads and who writes.
-- ---------------------------------------------------------------------------------------------
-- A viewer reads the links and the trace, and writes nothing: an insert is refused, and a delete
-- finds nothing to change.
select set_config('request.jwt.claim.sub', 'c8000000-0000-0000-0000-000000000003', true);
do $$ begin
  if (select count(*) from public.issue_requirements where program_id = 'c8100000-0000-0000-0000-000000000001') <> 5
    or jsonb_array_length(public.assurance_trace(current_setting('test.tenant')::uuid, 'issue', 'c8600000-0000-0000-0000-000000000001')->'links'->'requirement_issue') <> 2 then
    raise exception 'A viewer cannot read an issue''s requirements';
  end if;
end $$;
select pg_temp.expect_error(format($$insert into public.issue_requirements(tenant_id, program_id, issue_id, engineering_requirement_id)
  values (%L, 'c8100000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000004', 'c8300000-0000-0000-0000-000000000001')$$,
  current_setting('test.tenant')), '42501');
delete from public.issue_requirements where program_id = 'c8100000-0000-0000-0000-000000000001';
do $$ begin
  if (select count(*) from public.issue_requirements where program_id = 'c8100000-0000-0000-0000-000000000001') <> 5 then
    raise exception 'A viewer removed an issue''s requirement link';
  end if;
end $$;

-- A member of another workspace sees none of it, and names nothing on this workspace's issues,
-- from its own workspace or from this one.
select set_config('request.jwt.claim.sub', 'c8000000-0000-0000-0000-000000000004', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
do $$ begin
  if exists (select 1 from public.issue_requirements) then
    raise exception 'A member of another workspace read an issue''s requirement link';
  end if;
end $$;
select pg_temp.expect_error(format($$select public.assurance_trace(%L, 'issue', 'c8600000-0000-0000-0000-000000000001')$$,
  current_setting('test.tenant')), '42501');
select pg_temp.expect_error(format($$insert into public.issue_requirements(tenant_id, program_id, issue_id, engineering_requirement_id)
  values (%L, 'c8100000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000004', 'c8300000-0000-0000-0000-000000000001')$$,
  current_setting('test.other_tenant')), '23503');
select pg_temp.expect_error(format($$insert into public.issue_requirements(tenant_id, program_id, issue_id, engineering_requirement_id)
  values (%L, 'c8100000-0000-0000-0000-000000000001', 'c8600000-0000-0000-0000-000000000004', 'c8300000-0000-0000-0000-000000000001')$$,
  current_setting('test.tenant')), '42501');

-- A member unlinks, and the walk no longer finds the issue there.
select set_config('request.jwt.claim.sub', 'c8000000-0000-0000-0000-000000000002', true);
delete from public.issue_requirements where id = 'c8900000-0000-0000-0000-000000000001';
do $$
declare t jsonb;
begin
  if exists (select 1 from public.issue_requirements where id = 'c8900000-0000-0000-0000-000000000001') then
    raise exception 'A member could not unlink a requirement';
  end if;
  t := public.assurance_trace(current_setting('test.tenant')::uuid, 'requirement', 'c8300000-0000-0000-0000-000000000001');
  if pg_temp.ids(t->'issues') <> array['c8600000-0000-0000-0000-000000000003']::uuid[] then
    raise exception 'The trace still reaches an issue whose link was removed: %', t->'issues';
  end if;
end $$;

-- An anonymous session reads none of it.
set local role anon;
select pg_temp.expect_error('select count(*) from public.issue_requirements', '42501');
reset role;
do $$ begin
  if has_function_privilege('anon', 'public.assurance_trace(uuid, text, uuid, uuid)', 'execute')
    or has_function_privilege('public', 'public.program_posture(uuid, uuid)', 'execute')
    or has_function_privilege('anon', 'public.program_posture_cell(uuid, uuid, uuid, uuid)', 'execute')
    or has_function_privilege('anon', 'public.program_resiliency_posture(uuid)', 'execute')
    or has_function_privilege('anon', 'public.program_resiliency_posture_cell(uuid, uuid, text)', 'execute')
    or not has_function_privilege('authenticated', 'public.assurance_trace(uuid, text, uuid, uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.program_posture(uuid, uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.program_posture_cell(uuid, uuid, uuid, uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.program_resiliency_posture(uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.program_resiliency_posture_cell(uuid, uuid, text)', 'execute') then
    raise exception 'The chain reads are not granted to signed-in members alone';
  end if;
end $$;
rollback;
select 'Issue requirement links, their program guard, the trace both ways and the Posture placing a linked issue once passed.' as result;
