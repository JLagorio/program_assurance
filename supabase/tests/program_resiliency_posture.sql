-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- A program's posture by cyber resiliency technique: where a requirement stands, what is not
-- placed, what an element totals, that a cell's records add up to its number, and who may ask.
-- The functions read the shared framework nist-sp800-160v2r1-cref. Where the pinned publication is
-- installed the test reads it; where it is not, the test writes a small reading of its own under
-- that code, so it needs no reference data and disturbs none.
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

-- ---------------------------------------------------------------------------------------------
-- The framework. A reading of the test's own, written as the importer writes one, only where no
-- shared framework has the code: two controls, three techniques, and one approach that Table E-1
-- prints under its own technique and under another, as it prints Self-Challenge under Deception.
-- ---------------------------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from public.frameworks where tenant_id is null and code = 'nist-sp800-160v2r1-cref') then
    return;
  end if;
  insert into public.ref_sources(id, code, title, authority, source_uri, authoritative) values
    ('e7a00000-0000-0000-0000-000000000001', 'test-posture-catalog', 'Test catalog', 'Test', 'https://example.test/catalog.json', false),
    ('e7a00000-0000-0000-0000-000000000002', 'test-posture-transcription', 'Test transcription', 'Test', 'https://example.test/source.pdf', false);
  insert into public.oscal_documents(id, source_id, model, title, code) values
    ('e7a10000-0000-0000-0000-000000000001', 'e7a00000-0000-0000-0000-000000000001', 'catalog', 'Test catalog', 'test-posture-catalog');
  insert into public.oscal_document_revisions(id, document_id, source_uuid, document_version, oscal_version, title, last_modified, content_sha256, original_content) values
    ('e7a20000-0000-0000-0000-000000000001', 'e7a10000-0000-0000-0000-000000000001', 'e7a21000-0000-0000-0000-000000000001', '1', '1.1.2', 'Test catalog', now(), repeat('7', 64), '{"catalog":{"uuid":"e7a21000-0000-0000-0000-000000000001"}}');
  insert into public.catalogs(id, source_id, code, title) values
    ('e7a30000-0000-0000-0000-000000000001', 'e7a00000-0000-0000-0000-000000000001', 'TEST-POSTURE-CATALOG', 'Test catalog');
  insert into public.catalog_revisions(id, catalog_id, document_revision_id, version, title) values
    ('e7a40000-0000-0000-0000-000000000001', 'e7a30000-0000-0000-0000-000000000001', 'e7a20000-0000-0000-0000-000000000001', '1', 'Test catalog');
  insert into public.controls(id, catalog_revision_id, source_id, code, title, status, ordinal) values
    ('e7a50000-0000-0000-0000-000000000001', 'e7a40000-0000-0000-0000-000000000001', 'sr-7', 'SR-7', 'Supply Chain Operations Security', 'active', 0),
    ('e7a50000-0000-0000-0000-000000000002', 'e7a40000-0000-0000-0000-000000000001', 'at-1', 'AT-1', 'Policy and Procedures', 'active', 1);
  update public.oscal_document_revisions set state = 'published', published_at = now() where id = 'e7a20000-0000-0000-0000-000000000001';
  update public.catalog_revisions set state = 'published' where id = 'e7a40000-0000-0000-0000-000000000001';
  insert into public.frameworks(id, source_id, code, title) values
    ('e7b00000-0000-0000-0000-000000000001', 'e7a00000-0000-0000-0000-000000000002', 'nist-sp800-160v2r1-cref', 'Test cyber resiliency constructs');
  insert into public.framework_revisions(id, framework_id, version, title, format, content_sha256, input_sha256, catalog_revision_id, source_document) values
    ('e7c00000-0000-0000-0000-000000000001', 'e7b00000-0000-0000-0000-000000000001', 'Rev. 1', 'Test cyber resiliency constructs', 'reference-framework/1', repeat('7', 64), repeat('7', 64), 'e7a40000-0000-0000-0000-000000000001', '{"title":"Test source"}');
  insert into public.framework_items(id, framework_revision_id, parent_item_id, kind, code, title, ordinal, printed_in) values
    ('e7d00000-0000-0000-0000-000000000001', 'e7c00000-0000-0000-0000-000000000001', null, 'technique', 'technique.coordinated-protection', 'Coordinated Protection', 1, 'Table D-4'),
    ('e7d00000-0000-0000-0000-000000000002', 'e7c00000-0000-0000-0000-000000000001', null, 'technique', 'technique.deception', 'Deception', 2, 'Table D-4'),
    ('e7d00000-0000-0000-0000-000000000003', 'e7c00000-0000-0000-0000-000000000001', null, 'technique', 'technique.redundancy', 'Redundancy', 3, 'Table D-4'),
    ('e7d00000-0000-0000-0000-000000000011', 'e7c00000-0000-0000-0000-000000000001', 'e7d00000-0000-0000-0000-000000000001', 'approach', 'approach.self-challenge', 'Self-Challenge', 1, 'Table D-4');
  insert into public.framework_control_links(id, framework_revision_id, item_id, control_label, control_id, catalog_revision_id, resolution_status, relation, ordinal, props, source_identifier, printed_in) values
    ('e7f00000-0000-0000-0000-000000000001', 'e7c00000-0000-0000-0000-000000000001', 'e7d00000-0000-0000-0000-000000000011', 'SR-7', 'e7a50000-0000-0000-0000-000000000001', 'e7a40000-0000-0000-0000-000000000001', 'resolved', 'supports', 1, '{"technique":"technique.coordinated-protection"}', 'E-1:SR-7:1:1', 'Table E-1'),
    ('e7f00000-0000-0000-0000-000000000002', 'e7c00000-0000-0000-0000-000000000001', 'e7d00000-0000-0000-0000-000000000011', 'SR-7', 'e7a50000-0000-0000-0000-000000000001', 'e7a40000-0000-0000-0000-000000000001', 'resolved', 'supports', 2, '{"technique":"technique.deception"}', 'E-1:SR-7:2:1', 'Table E-1');
  update public.framework_revisions set state = 'published' where id = 'e7c00000-0000-0000-0000-000000000001';
  update public.frameworks set current_revision_id = 'e7c00000-0000-0000-0000-000000000001' where id = 'e7b00000-0000-0000-0000-000000000001';
end $$;

-- A control Table E-1 prints under two techniques or more, the techniques it is printed under, and
-- a control of the same catalog revision the table does not print.
select set_config('test.control', (
  select s.control_id::text from public.framework_control_link_rows s
  where s.tenant_id is null and s.framework_code = 'nist-sp800-160v2r1-cref' and s.relation = 'supports'
  group by s.control_id, s.control_order having count(distinct s.technique_code) >= 2
  order by s.control_order limit 1), true);
select set_config('test.techniques', (
  select array_agg(distinct s.technique_code)::text from public.framework_control_link_rows s
  where s.tenant_id is null and s.framework_code = 'nist-sp800-160v2r1-cref' and s.relation = 'supports'
    and s.control_id = current_setting('test.control')::uuid), true);
select set_config('test.unsupported_control', (
  select c.id::text from public.controls c
  where c.status = 'active'
    and c.catalog_revision_id = (select x.catalog_revision_id from public.controls x where x.id = current_setting('test.control')::uuid)
    and not exists (select 1 from public.framework_control_link_rows s
      where s.framework_code = 'nist-sp800-160v2r1-cref' and s.control_id = c.id)
  order by c.code limit 1), true);
do $$ begin
  if current_setting('test.control') = '' or current_setting('test.unsupported_control') = ''
    or cardinality(coalesce(nullif(current_setting('test.techniques'), ''), '{}')::text[]) < 2 then
    raise exception 'The framework holds no control under two techniques, or no control outside Table E-1';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- The program: a system that holds two elements, and six requirements.
--   REQ-1  meets the control, allocated to element A, with evidence
--   REQ-2  meets the control, allocated to element B, without evidence
--   REQ-3  meets the control the table does not print, allocated to A, with evidence: not placed
--   REQ-4  meets the control, allocated to no element: not placed
--   REQ-5  meets both controls, allocated to A and to B
--   REQ-6  met the control at its first revision and meets the other at its latest: not placed
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email, raw_user_meta_data) values
  ('e7900000-0000-0000-0000-000000000001', 'posture-member@example.test', '{"name":"Posture test member"}'),
  ('e7900000-0000-0000-0000-000000000002', 'posture-outsider@example.test', '{"name":"Posture test outsider"}'),
  ('e7900000-0000-0000-0000-000000000003', 'posture-viewer@example.test', '{"name":"Posture test viewer"}');
select set_config('request.jwt.claim.sub', 'e7900000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.programs(id, tenant_id, code, name) values
  ('e7100000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'POSTURE-TEST', 'Rollback posture program');
insert into public.systems(id, tenant_id, program_id, code, name, system_type) values
  ('e7200000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'e7100000-0000-0000-0000-000000000001', 'SYS-ROOT', 'Mission system', 'information_system');
insert into public.systems(id, tenant_id, program_id, code, name, system_type, parent_system_id, is_authorization_boundary) values
  ('e7200000-0000-0000-0000-00000000000a', current_setting('test.tenant')::uuid, 'e7100000-0000-0000-0000-000000000001', 'SYS-A', 'Flight computer', 'software', 'e7200000-0000-0000-0000-000000000001', false),
  ('e7200000-0000-0000-0000-00000000000b', current_setting('test.tenant')::uuid, 'e7100000-0000-0000-0000-000000000001', 'SYS-B', 'Ground station', 'software', 'e7200000-0000-0000-0000-000000000001', false);
insert into public.engineering_requirements(id, tenant_id, program_id, code)
  select ('e7300000-0000-0000-0000-00000000000' || n)::uuid, current_setting('test.tenant')::uuid, 'e7100000-0000-0000-0000-000000000001', 'REQ-' || n
  from generate_series(1, 6) n;
insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type)
  select ('e7400000-0000-0000-0000-00000000000' || n)::uuid, current_setting('test.tenant')::uuid, ('e7300000-0000-0000-0000-00000000000' || n)::uuid,
    1, 'Requirement ' || n, 'The element signs every record.', 'Every record verifies.', 'security'
  from generate_series(1, 6) n;
insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type)
  select current_setting('test.tenant')::uuid, link.revision_id::uuid, current_setting(link.control)::uuid, 'satisfies'
  from (values
    ('e7400000-0000-0000-0000-000000000001', 'test.control'),
    ('e7400000-0000-0000-0000-000000000002', 'test.control'),
    ('e7400000-0000-0000-0000-000000000003', 'test.unsupported_control'),
    ('e7400000-0000-0000-0000-000000000004', 'test.control'),
    ('e7400000-0000-0000-0000-000000000005', 'test.control'),
    ('e7400000-0000-0000-0000-000000000005', 'test.unsupported_control'),
    ('e7400000-0000-0000-0000-000000000006', 'test.control')
  ) link(revision_id, control);
insert into public.requirement_allocations(tenant_id, requirement_revision_id, system_id)
  select current_setting('test.tenant')::uuid, allocation.revision_id::uuid, allocation.system_id::uuid
  from (values
    ('e7400000-0000-0000-0000-000000000001', 'e7200000-0000-0000-0000-00000000000a'),
    ('e7400000-0000-0000-0000-000000000002', 'e7200000-0000-0000-0000-00000000000b'),
    ('e7400000-0000-0000-0000-000000000003', 'e7200000-0000-0000-0000-00000000000a'),
    ('e7400000-0000-0000-0000-000000000005', 'e7200000-0000-0000-0000-00000000000a'),
    ('e7400000-0000-0000-0000-000000000005', 'e7200000-0000-0000-0000-00000000000b'),
    ('e7400000-0000-0000-0000-000000000006', 'e7200000-0000-0000-0000-00000000000a')
  ) allocation(revision_id, system_id);
-- A requirement keeps one revision now, and its guard refuses a second. Requirements written
-- before the guard have several, and only the latest is read. REQ-6 is given its second revision
-- as those were written, with the triggers asleep for these three rows, which locks nothing.
reset role;
set local session_replication_role = replica;
insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type) values
  ('e7400000-0000-0000-0000-000000000062', current_setting('test.tenant')::uuid, 'e7300000-0000-0000-0000-000000000006', 2, 'Requirement 6, revised', 'The element signs every record.', 'Every record verifies.', 'security');
insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type) values
  (current_setting('test.tenant')::uuid, 'e7400000-0000-0000-0000-000000000062', current_setting('test.unsupported_control')::uuid, 'satisfies');
insert into public.requirement_allocations(tenant_id, requirement_revision_id, system_id) values
  (current_setting('test.tenant')::uuid, 'e7400000-0000-0000-0000-000000000062', 'e7200000-0000-0000-0000-00000000000a');
set local session_replication_role = origin;
set local role authenticated;

-- Evidence for REQ-1 and for REQ-3. An open high issue and a closed critical one cite REQ-1's; an
-- open low one cites REQ-3's, which stands under no technique. One open risk rests on the high
-- issue at its latest assessment, and one rests on nothing.
insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind, program_id) values
  ('e7500000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'Signature test report', 'document', 'e7100000-0000-0000-0000-000000000001'),
  ('e7500000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'Training record', 'document', 'e7100000-0000-0000-0000-000000000001');
insert into public.evidence_versions(id, tenant_id, artifact_id, version_number, state, external_uri) values
  ('e7510000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'e7500000-0000-0000-0000-000000000001', 1, 'published', 'https://example.test/evidence/report'),
  ('e7510000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'e7500000-0000-0000-0000-000000000003', 1, 'published', 'https://example.test/evidence/training');
insert into public.requirement_evidence(tenant_id, requirement_revision_id, evidence_version_id) values
  (current_setting('test.tenant')::uuid, 'e7400000-0000-0000-0000-000000000001', 'e7510000-0000-0000-0000-000000000001'),
  (current_setting('test.tenant')::uuid, 'e7400000-0000-0000-0000-000000000003', 'e7510000-0000-0000-0000-000000000003');
insert into public.operational_issues(id, tenant_id, program_id, title, severity, status) values
  ('e7600000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'e7100000-0000-0000-0000-000000000001', 'Signatures fail under a rotated key', 'high', 'open'),
  ('e7600000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'e7100000-0000-0000-0000-000000000001', 'Rotation was not recorded', 'critical', 'closed'),
  ('e7600000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'e7100000-0000-0000-0000-000000000001', 'Training record is out of date', 'low', 'open');
insert into public.issue_evidence(tenant_id, issue_id, evidence_version_id) values
  (current_setting('test.tenant')::uuid, 'e7600000-0000-0000-0000-000000000001', 'e7510000-0000-0000-0000-000000000001'),
  (current_setting('test.tenant')::uuid, 'e7600000-0000-0000-0000-000000000002', 'e7510000-0000-0000-0000-000000000001'),
  (current_setting('test.tenant')::uuid, 'e7600000-0000-0000-0000-000000000003', 'e7510000-0000-0000-0000-000000000003');
insert into public.observations(id, tenant_id, program_id, title, method) values
  ('e7700000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'e7100000-0000-0000-0000-000000000001', 'Signature check fails', 'test');
insert into public.issue_observations(tenant_id, issue_id, observation_id) values
  (current_setting('test.tenant')::uuid, 'e7600000-0000-0000-0000-000000000001', 'e7700000-0000-0000-0000-000000000001');
insert into public.risks(id, tenant_id, program_id, title) values
  ('e7800000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'e7100000-0000-0000-0000-000000000001', 'Records become unverifiable'),
  ('e7800000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'e7100000-0000-0000-0000-000000000001', 'Supplier goes out of business');
insert into public.risk_revisions(id, tenant_id, risk_id, version_number, severity) values
  ('e7810000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'e7800000-0000-0000-0000-000000000001', 1, 'critical'),
  ('e7810000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'e7800000-0000-0000-0000-000000000002', 1, 'low');
insert into public.risk_observations(tenant_id, risk_revision_id, observation_id) values
  (current_setting('test.tenant')::uuid, 'e7810000-0000-0000-0000-000000000001', 'e7700000-0000-0000-0000-000000000001');

-- ---------------------------------------------------------------------------------------------
-- The posture.
-- ---------------------------------------------------------------------------------------------
do $$ begin
  perform set_config('test.answer', public.program_resiliency_posture('e7100000-0000-0000-0000-000000000001')::text, true);
end $$;
do $$
declare
  answer constant jsonb := current_setting('test.answer')::jsonb;
  family constant jsonb := public.program_posture(current_setting('test.tenant')::uuid, 'e7100000-0000-0000-0000-000000000001');
  techniques constant text[] := current_setting('test.techniques')::text[];
  root constant text := 'e7200000-0000-0000-0000-000000000001';
  a constant text := 'e7200000-0000-0000-0000-00000000000a';
  b constant text := 'e7200000-0000-0000-0000-00000000000b';
  expected jsonb;
  found jsonb;
  listed text[];
begin
  -- Every technique the framework's current revision names, in the publication's order, by code.
  select array_agg(i.code order by i.ordinal, i.code) into listed
    from public.framework_item_rows i
    where i.tenant_id is null and i.framework_code = 'nist-sp800-160v2r1-cref' and i.kind = 'technique';
  if array(select t->>'code' from jsonb_array_elements(answer->'techniques') with ordinality as x(t, n) order by n) is distinct from listed
    or exists (select 1 from jsonb_array_elements(answer->'techniques') t where t ? 'id' or coalesce(t->>'title', '') = '') then
    raise exception 'The posture does not list the framework''s techniques in its order, by code and title: %', answer->'techniques';
  end if;

  -- REQ-1, REQ-2 and REQ-5 stand under every technique the control supports, and under no other.
  -- REQ-5 is allocated twice and counts once in the element that holds both.
  if (select count(*) from jsonb_array_elements(answer->'cells')) <> 3 * cardinality(techniques)
    or exists (select 1 from jsonb_array_elements(answer->'cells') c where not (c->>'technique_code' = any(techniques))) then
    raise exception 'A requirement stands under a technique its controls do not support, or misses one they do: %', answer->'cells';
  end if;
  for found in select c from jsonb_array_elements(answer->'cells') c loop
    expected := case found->>'element_id'
      when a then '{"requirements":2,"evidenced":1,"issues":1,"issue_severity":3,"risks":1,"risk_severity":4}'
      when b then '{"requirements":2,"evidenced":0,"issues":0,"issue_severity":null,"risks":0,"risk_severity":null}'
      when root then '{"requirements":3,"evidenced":1,"issues":1,"issue_severity":3,"risks":1,"risk_severity":4}'
    end::jsonb;
    if found - 'element_id' - 'technique_code' is distinct from expected then
      raise exception 'A cell does not count what stands in it: % (expected %)', found, expected;
    end if;
  end loop;

  -- A line counts each record once, however many techniques it stands under. An element's own
  -- requirements are every one allocated to it; REQ-3 and REQ-6 stand under no technique.
  expected := jsonb_build_object(
    a, '{"own_requirements":4,"requirements":2,"evidenced":1,"issues":1,"issue_severity":3,"risks":1,"risk_severity":4}'::jsonb,
    b, '{"own_requirements":2,"requirements":2,"evidenced":0,"issues":0,"issue_severity":null,"risks":0,"risk_severity":null}'::jsonb,
    root, '{"own_requirements":0,"requirements":3,"evidenced":1,"issues":1,"issue_severity":3,"risks":1,"risk_severity":4}'::jsonb);
  select jsonb_object_agg(e->>'id', e - 'id' - 'code' - 'name' - 'type' - 'parent_id' - 'boundary') into found
    from jsonb_array_elements(answer->'elements') e;
  if found is distinct from expected then
    raise exception 'An element''s line does not count each record once: % (expected %)', found, expected;
  end if;
  if array(select e->>'code' from jsonb_array_elements(answer->'elements') with ordinality as x(e, n) order by n) <> array['SYS-A', 'SYS-B', 'SYS-ROOT']
    or (answer->'elements'->0->>'parent_id') <> root or (answer->'elements'->2->>'boundary')::boolean is not true then
    raise exception 'The posture does not list the program''s elements by code with their holder: %', answer->'elements';
  end if;
  for found in select t from jsonb_array_elements(answer->'techniques') t loop
    expected := case when found->>'code' = any(techniques)
      then '{"requirements":3,"evidenced":1,"issues":1,"issue_severity":3,"risks":1,"risk_severity":4}'
      else '{"requirements":0,"evidenced":0,"issues":0,"issue_severity":null,"risks":0,"risk_severity":null}'
    end::jsonb;
    if found - 'code' - 'title' is distinct from expected then
      raise exception 'A technique''s line does not count what stands under it: % (expected %)', found, expected;
    end if;
  end loop;

  -- Three of six requirements are placed: REQ-3 and REQ-6 meet no control that supports a
  -- technique, and REQ-4 is allocated to no element. The closed issue is not counted, and the
  -- issue and the risk that reach no placed requirement are counted and not placed.
  expected := '{"requirements":6,"allocated":5,"allocated_elements":2,"evidenced":2,"placed":3,
    "issues":2,"issues_severe":1,"issues_placed":1,"risks":2,"risks_severe":1,"risks_placed":1}'::jsonb;
  if answer->'totals' is distinct from expected then
    raise exception 'The totals do not say what is placed: % (expected %)', answer->'totals', expected;
  end if;
  -- What the two postures count alike, they count the same.
  if (answer->'totals') - 'placed' - 'issues_placed' - 'risks_placed'
    is distinct from (family->'totals') - 'issues_placed' - 'risks_placed' then
    raise exception 'The posture by technique and the posture by family disagree: % and %', answer->'totals', family->'totals';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- A cell's records add up to its number: every cell, every line, and the whole grid.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  program constant uuid := 'e7100000-0000-0000-0000-000000000001';
  answer constant jsonb := current_setting('test.answer')::jsonb;
  technique constant text := (current_setting('test.techniques')::text[])[1];
  counted jsonb;
  detail jsonb;
begin
  for counted in
    select c from jsonb_array_elements(answer->'cells') c
    union all
    select e || jsonb_build_object('element_id', e->'id') from jsonb_array_elements(answer->'elements') e
    union all
    select t || jsonb_build_object('technique_code', t->'code') from jsonb_array_elements(answer->'techniques') t
    union all
    select jsonb_build_object('requirements', answer->'totals'->'placed', 'evidenced', null,
      'issues', answer->'totals'->'issues_placed', 'risks', answer->'totals'->'risks_placed')
  loop
    detail := public.program_resiliency_posture_cell(program, (counted->>'element_id')::uuid, counted->>'technique_code');
    if (detail->>'requirements')::int <> (counted->>'requirements')::int
      or (counted->>'evidenced' is not null and (
        (detail->>'evidenced')::int <> (counted->>'evidenced')::int
        or jsonb_array_length(detail->'unevidenced') <> (counted->>'requirements')::int - (counted->>'evidenced')::int))
      or jsonb_array_length(detail->'issues') <> (counted->>'issues')::int
      or jsonb_array_length(detail->'risks') <> (counted->>'risks')::int
      or jsonb_array_length(detail->'controls') <> least((counted->>'requirements')::int, 1)
      or coalesce((detail->'controls'->0->>'requirements')::int, 0) <> (counted->>'requirements')::int then
      raise exception 'The records of % do not add up to its numbers: %', counted, detail;
    end if;
  end loop;

  -- What stands in the cell of the element that holds both, under one technique.
  detail := public.program_resiliency_posture_cell(program, 'e7200000-0000-0000-0000-000000000001', technique);
  if detail->'issues' <> '[{"id":"e7600000-0000-0000-0000-000000000001","title":"Signatures fail under a rotated key","severity":"high","status":"open"}]'::jsonb
    or (select jsonb_agg(r - 'status') from jsonb_array_elements(detail->'risks') r)
      <> '[{"id":"e7800000-0000-0000-0000-000000000001","title":"Records become unverifiable","severity":"critical"}]'::jsonb
    or detail->'unevidenced' <> '[{"id":"e7300000-0000-0000-0000-000000000002","code":"REQ-2","title":"Requirement 2"},
      {"id":"e7300000-0000-0000-0000-000000000005","code":"REQ-5","title":"Requirement 5"}]'::jsonb
    or detail->'controls'->0->>'id' <> current_setting('test.control') then
    raise exception 'A cell does not list its issue, its risk, its requirements without evidence and its control: %', detail;
  end if;
  -- A technique the framework does not name holds nothing.
  detail := public.program_resiliency_posture_cell(program, null, 'technique.not-a-technique');
  if (detail->>'requirements')::int <> 0 or detail->'issues' <> '[]'::jsonb or detail->'controls' <> '[]'::jsonb then
    raise exception 'An unknown technique holds records: %', detail;
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Who may ask.
-- ---------------------------------------------------------------------------------------------
-- A viewer of the workspace reads what its owner reads.
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'e7900000-0000-0000-0000-000000000003', 'viewer');
select set_config('request.jwt.claim.sub', 'e7900000-0000-0000-0000-000000000003', true);
do $$ begin
  if public.program_resiliency_posture('e7100000-0000-0000-0000-000000000001')->'totals' is distinct from current_setting('test.answer')::jsonb->'totals'
    or (public.program_resiliency_posture_cell('e7100000-0000-0000-0000-000000000001')->>'requirements')::int <> 3 then
    raise exception 'A viewer does not read the posture its workspace''s owner reads';
  end if;
end $$;
-- A member of another workspace cannot read the program, and is refused. So is a program nobody has.
select set_config('request.jwt.claim.sub', 'e7900000-0000-0000-0000-000000000002', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
select pg_temp.expect_error($$select public.program_resiliency_posture('e7100000-0000-0000-0000-000000000001')$$, '42501');
select pg_temp.expect_error($$select public.program_resiliency_posture_cell('e7100000-0000-0000-0000-000000000001')$$, '42501');
select pg_temp.expect_error($$select public.program_resiliency_posture('e71fffff-0000-0000-0000-000000000001')$$, '42501');
select pg_temp.expect_error($$select public.program_resiliency_posture_cell('e71fffff-0000-0000-0000-000000000001', null, 'technique.redundancy')$$, '42501');
-- A session with no signed-in user is refused, and an anonymous one may not execute at all.
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$select public.program_resiliency_posture('e7100000-0000-0000-0000-000000000001')$$, '42501');
select pg_temp.expect_error($$select public.program_resiliency_posture_cell('e7100000-0000-0000-0000-000000000001')$$, '42501');
set local role anon;
do $$ begin
  if has_function_privilege('public.program_resiliency_posture(uuid)', 'execute')
    or has_function_privilege('public.program_resiliency_posture_cell(uuid, uuid, text)', 'execute') then
    raise exception 'An anonymous session may execute the posture reads';
  end if;
end $$;
select pg_temp.expect_error($$select public.program_resiliency_posture('e7100000-0000-0000-0000-000000000001')$$, '42501');
select pg_temp.expect_error($$select public.program_resiliency_posture_cell('e7100000-0000-0000-0000-000000000001')$$, '42501');
reset role;
do $$ begin
  if not has_function_privilege('authenticated', 'public.program_resiliency_posture(uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.program_resiliency_posture_cell(uuid, uuid, text)', 'execute')
    or (select bool_or(p.prosecdef) from pg_catalog.pg_proc p
      where p.oid in ('public.program_resiliency_posture(uuid)'::regprocedure, 'public.program_resiliency_posture_cell(uuid, uuid, text)'::regprocedure)) then
    raise exception 'The posture reads are not the caller''s to execute as the caller';
  end if;
end $$;
rollback;
select 'Program resiliency posture placement, counting, cell records and access passed.' as result;
