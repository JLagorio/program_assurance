-- Run with psql -v ON_ERROR_STOP=1 after migrations and the pinned reference data
-- (npm run seed:reference). Every test row rolls back.
-- A risk's ATT&CK techniques: who links and unlinks, what a link may name, who sees it, and what
-- risk_threats answers: the controls Appendix F of NIST SP 800-160 Vol. 2 Rev. 1 prints against a
-- technique, and where the risk's program stands on each.
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
-- The reference data the test reads: the appendix's framework, as the importer pinned it.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_framework constant text := 'nist-sp800-160v2r1-attack';
begin
  if not exists (select 1 from public.framework_rows where code = v_framework and tenant_id is null) then
    raise exception 'The ATT&CK reference data is not loaded. Run npm run seed:reference first.';
  end if;
  -- The second reading below is published later: the views go on reading the first only because
  -- the framework names it, as the importer leaves it.
  if (select current_revision_id from public.frameworks where code = v_framework and tenant_id is null) is null then
    raise exception 'The ATT&CK framework names no current revision. Run npm run seed:reference first.';
  end if;
  perform set_config('test.catalog', (select catalog_revision_id::text from public.framework_rows
    where code = v_framework and tenant_id is null), true);
  perform set_config('test.t1595', (select id::text from public.framework_item_rows
    where framework_code = v_framework and tenant_id is null and kind = 'attack-technique' and code = 'T1595'), true);
  perform set_config('test.t1190', (select id::text from public.framework_item_rows
    where framework_code = v_framework and tenant_id is null and kind = 'attack-technique' and code = 'T1190'), true);
  perform set_config('test.tactic', (select id::text from public.framework_item_rows
    where framework_code = v_framework and tenant_id is null and kind = 'tactic' and code = 'tactic.reconnaissance'), true);
  perform set_config('test.mitigation', (select id::text from public.framework_item_rows
    where framework_code = v_framework and tenant_id is null and kind = 'mitigation' order by code limit 1), true);
  perform set_config('test.approach', (select id::text from public.framework_item_rows
    where framework_code = 'nist-sp800-160v2r1-cref' and tenant_id is null and kind = 'approach' order by code limit 1), true);
  -- IR-4(13), which Table F-3 prints against T1595, and a published baseline on the same edition.
  perform set_config('test.control', (select control_id::text from public.framework_control_link_rows
    where framework_code = v_framework and tenant_id is null and item_code = 'T1595' and control_code = 'IR-4(13)'
      and catalog_revision_id = current_setting('test.catalog')::uuid limit 1), true);
  perform set_config('test.resolution', (select r.id::text from public.profile_resolutions r
    join public.profile_resolution_catalogs c on c.profile_resolution_id = r.id
    where r.tenant_id is null and r.state = 'published' and c.catalog_revision_id = current_setting('test.catalog')::uuid
    order by r.id limit 1), true);
  if '' in (current_setting('test.t1595'), current_setting('test.t1190'), current_setting('test.tactic'),
    current_setting('test.mitigation'), current_setting('test.approach'), current_setting('test.control'),
    current_setting('test.resolution')) then
    raise exception 'The pinned reference data is incomplete: a technique, a tactic, a mitigation, an approach, IR-4(13) or a published baseline is missing';
  end if;
end $$;

-- A second reading of the appendix, as the importer would record one: the same techniques under
-- new item ids. The framework goes on naming its first reading as the one the product reads.
insert into public.framework_revisions(id, framework_id, version, title, format, content_sha256, input_sha256, source_document)
  select 'd7300000-0000-0000-0000-000000000001', f.id, 'Test reading', f.title, 'reference-framework/1',
    repeat('7', 64), repeat('7', 64), '{"title":"Test reading"}'
  from public.frameworks f where f.code = 'nist-sp800-160v2r1-attack' and f.tenant_id is null;
insert into public.framework_items(id, framework_revision_id, kind, code, title, ordinal, printed_in) values
  ('d7400000-0000-0000-0000-000000000001', 'd7300000-0000-0000-0000-000000000001', 'attack-technique', 'T1595', 'Active Scanning, read again', 1, 'Table F-3'),
  ('d7400000-0000-0000-0000-000000000002', 'd7300000-0000-0000-0000-000000000001', 'attack-technique', 'T1190', 'Exploit Public-Facing Application, read again', 2, 'Table F-5');

-- ---------------------------------------------------------------------------------------------
-- A workspace: its owner, an editor and a viewer; and a member of another workspace.
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email, raw_user_meta_data) values
  ('d7000000-0000-0000-0000-000000000001', 'threat-owner@example.test', '{"name":"Threat test owner"}'),
  ('d7000000-0000-0000-0000-000000000002', 'threat-editor@example.test', '{"name":"Threat test editor"}'),
  ('d7000000-0000-0000-0000-000000000003', 'threat-viewer@example.test', '{"name":"Threat test viewer"}'),
  ('d7000000-0000-0000-0000-000000000004', 'threat-outsider@example.test', '{"name":"Threat test outsider"}');
select set_config('request.jwt.claim.sub', 'd7000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'd7000000-0000-0000-0000-000000000002', 'editor'),
  (current_setting('test.tenant')::uuid, 'd7000000-0000-0000-0000-000000000003', 'viewer');
insert into public.programs(id, tenant_id, code, name) values
  ('d7100000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'THREAT-TEST', 'Rollback threat program'),
  ('d7100000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'THREAT-OTHER', 'Another rollback program');
insert into public.risks(id, tenant_id, program_id, title) values
  ('d7200000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'd7100000-0000-0000-0000-000000000001', 'Rollback risk'),
  ('d7200000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'd7100000-0000-0000-0000-000000000001', 'Rollback risk with no technique');
-- The risk's assessment is published: the link is the risk's, so it is still made and removed.
insert into public.risk_revisions(id, tenant_id, risk_id, version_number, threat) values
  ('d7210000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'd7200000-0000-0000-0000-000000000001', 1, 'An adversary scans the boundary');
update public.risk_revisions set state = 'published', revision = 2 where id = 'd7210000-0000-0000-0000-000000000001';

-- ---------------------------------------------------------------------------------------------
-- A member links a technique, once.
-- ---------------------------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'd7000000-0000-0000-0000-000000000002', true);
insert into public.risk_attack_techniques(id, tenant_id, risk_id, framework_item_id) values
  ('d7500000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'd7200000-0000-0000-0000-000000000001', current_setting('test.t1595')::uuid);
do $$
declare link public.risk_attack_techniques;
begin
  select * into link from public.risk_attack_techniques where id = 'd7500000-0000-0000-0000-000000000001';
  if link.revision <> 1 or link.created_by <> 'd7000000-0000-0000-0000-000000000002'
    or link.updated_by <> 'd7000000-0000-0000-0000-000000000002' or link.created_at is null then
    raise exception 'A technique link does not carry its audit stamps';
  end if;
end $$;
select pg_temp.expect_error(format($$insert into public.risk_attack_techniques(tenant_id, risk_id, framework_item_id)
  values (%L, 'd7200000-0000-0000-0000-000000000001', %L)$$, current_setting('test.tenant'), current_setting('test.t1595')), '23505');
-- Linking what is already linked again passes over it, as the product's command does.
insert into public.risk_attack_techniques(tenant_id, risk_id, framework_item_id) values
  (current_setting('test.tenant')::uuid, 'd7200000-0000-0000-0000-000000000001', current_setting('test.t1595')::uuid)
  on conflict (tenant_id, risk_id, framework_item_id) do nothing;
do $$ begin
  if (select count(*) from public.risk_attack_techniques where risk_id = 'd7200000-0000-0000-0000-000000000001') <> 1 then
    raise exception 'A risk names a technique more than once';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- What a link may name: an ATT&CK technique of the published reference framework, never moved.
-- ---------------------------------------------------------------------------------------------
select pg_temp.expect_error(format($$insert into public.risk_attack_techniques(tenant_id, risk_id, framework_item_id)
  values (%L, 'd7200000-0000-0000-0000-000000000001', %L)$$, current_setting('test.tenant'), current_setting('test.tactic')), '23514');
select pg_temp.expect_error(format($$insert into public.risk_attack_techniques(tenant_id, risk_id, framework_item_id)
  values (%L, 'd7200000-0000-0000-0000-000000000001', %L)$$, current_setting('test.tenant'), current_setting('test.mitigation')), '23514');
select pg_temp.expect_error(format($$insert into public.risk_attack_techniques(tenant_id, risk_id, framework_item_id)
  values (%L, 'd7200000-0000-0000-0000-000000000001', %L)$$, current_setting('test.tenant'), current_setting('test.approach')), '23514');
select pg_temp.expect_error(format($$insert into public.risk_attack_techniques(tenant_id, risk_id, framework_item_id)
  values (%L, 'd7200000-0000-0000-0000-000000000001', 'd7400000-0000-0000-0000-0000000000ff')$$, current_setting('test.tenant')), '23503');
-- A technique of a reading that is still a draft is not yet one to name.
select pg_temp.expect_error(format($$insert into public.risk_attack_techniques(tenant_id, risk_id, framework_item_id)
  values (%L, 'd7200000-0000-0000-0000-000000000001', 'd7400000-0000-0000-0000-000000000002')$$, current_setting('test.tenant')), '23514');
select pg_temp.expect_error(format($$update public.risk_attack_techniques set framework_item_id = %L, revision = 2
  where id = 'd7500000-0000-0000-0000-000000000001'$$, current_setting('test.t1190')), '23514');
select pg_temp.expect_error($$update public.risk_attack_techniques set risk_id = 'd7200000-0000-0000-0000-000000000002', revision = 2
  where id = 'd7500000-0000-0000-0000-000000000001'$$, '23514');

-- The second reading is published. The technique the risk already names is the same technique
-- read again, and is refused; one it does not name yet is linked by its item of that reading.
reset role;
update public.framework_revisions set state = 'published', revision = revision + 1 where id = 'd7300000-0000-0000-0000-000000000001';
set local role authenticated;
select pg_temp.expect_error(format($$insert into public.risk_attack_techniques(tenant_id, risk_id, framework_item_id)
  values (%L, 'd7200000-0000-0000-0000-000000000001', 'd7400000-0000-0000-0000-000000000001')$$, current_setting('test.tenant')), '23505');
insert into public.risk_attack_techniques(id, tenant_id, risk_id, framework_item_id) values
  ('d7500000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'd7200000-0000-0000-0000-000000000001', 'd7400000-0000-0000-0000-000000000002');

-- ---------------------------------------------------------------------------------------------
-- The read names each technique by its code in the reading the product reads, with its tactics.
-- ---------------------------------------------------------------------------------------------
do $$
declare answer jsonb;
begin
  answer := public.risk_threats(current_setting('test.tenant')::uuid, 'd7200000-0000-0000-0000-000000000001');
  if answer->>'program_id' <> 'd7100000-0000-0000-0000-000000000001' or (answer->>'loaded')::boolean is not true
    or answer->>'catalog_revision_id' <> current_setting('test.catalog') then
    raise exception 'risk_threats does not name the risk''s program and the reading''s catalog edition: %', answer - 'controls';
  end if;
  if (select jsonb_agg(t->>'code') from jsonb_array_elements(answer->'techniques') t) <> '["T1190", "T1595"]'::jsonb
    or (answer->'totals'->>'techniques')::integer <> 2 then
    raise exception 'risk_threats does not list the risk''s techniques by identifier: %', answer->'techniques';
  end if;
  -- T1190 was linked from the second reading: its item is kept, its name is the current reading's.
  if answer->'techniques'->0->>'item_id' <> 'd7400000-0000-0000-0000-000000000002'
    or answer->'techniques'->0->>'link_id' <> 'd7500000-0000-0000-0000-000000000002'
    or answer->'techniques'->0->>'title' <> 'Exploit Public-Facing Application'
    or answer->'techniques'->0->'tactics' <> '[{"code": "tactic.initial-access", "title": "Initial Access"}]'::jsonb then
    raise exception 'risk_threats does not name a technique linked from another reading by its code: %', answer->'techniques'->0;
  end if;
  if answer->'techniques'->1->>'item_id' <> current_setting('test.t1595') or answer->'techniques'->1->>'title' <> 'Active Scanning'
    or answer->'techniques'->1->'tactics' <> '[{"code": "tactic.reconnaissance", "title": "Reconnaissance"}]'::jsonb then
    raise exception 'risk_threats does not name a technique with its tactics: %', answer->'techniques'->1;
  end if;
end $$;

-- A member unlinks, also on a risk whose assessment is published.
delete from public.risk_attack_techniques where id = 'd7500000-0000-0000-0000-000000000002';
do $$ begin
  if exists (select 1 from public.risk_attack_techniques where id = 'd7500000-0000-0000-0000-000000000002') then
    raise exception 'A member could not unlink a technique';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- The read answers the controls the appendix prints against T1595, each once: Table F-3 prints
-- eleven control links for it, over eleven controls.
-- ---------------------------------------------------------------------------------------------
do $$
declare answer jsonb; printed integer; control jsonb;
begin
  answer := public.risk_threats(current_setting('test.tenant')::uuid, 'd7200000-0000-0000-0000-000000000001');
  select count(*) into printed from public.framework_control_link_rows
    where framework_code = 'nist-sp800-160v2r1-attack' and tenant_id is null and item_code = 'T1595' and relation = 'mitigates';
  if printed <> 11 or jsonb_array_length(answer->'controls') <> 11 or (answer->'totals'->>'controls')::integer <> 11 then
    raise exception 'risk_threats does not answer the eleven controls printed against T1595: % printed, % answered',
      printed, jsonb_array_length(answer->'controls');
  end if;
  -- In the catalog's order: SC-7(16) before SC-26, SI-4(2) before SI-20.
  if (select jsonb_agg(c->>'code') from jsonb_array_elements(answer->'controls') c)
    <> '["IR-4(13)", "SC-7(16)", "SC-26", "SC-28(1)", "SC-29", "SC-30", "SC-30(4)", "SC-30(5)", "SI-4(2)", "SI-4(4)", "SI-20"]'::jsonb then
    raise exception 'risk_threats does not list the printed controls in the catalog''s order: %',
      (select jsonb_agg(c->>'code') from jsonb_array_elements(answer->'controls') c);
  end if;
  if exists (select 1 from jsonb_array_elements(answer->'controls') c where c->'techniques' <> '["T1595"]'::jsonb) then
    raise exception 'risk_threats does not say which technique each control counters';
  end if;
  -- A row's approaches in the order it prints them, and its effects in the order of Table F-1.
  select c into control from jsonb_array_elements(answer->'controls') c where c->>'code' = 'SC-7(16)';
  if control->>'title' <> 'Prevent Discovery of System Components'
    or (select jsonb_agg(a->>'title') from jsonb_array_elements(control->'approaches') a)
      <> '["Obfuscation", "Functional Relocation of Cyber Resources"]'::jsonb
    or control->'approaches'->0->>'code' <> 'approach.obfuscation'
    or control->'effects' <> '["Degrade", "Exert", "Shorten"]'::jsonb then
    raise exception 'risk_threats does not answer a control''s approaches and effects: %', control;
  end if;
  select c into control from jsonb_array_elements(answer->'controls') c where c->>'code' = 'SC-26';
  if (select jsonb_agg(a->>'title') from jsonb_array_elements(control->'approaches') a) <> '["Misdirection"]'::jsonb
    or control->'effects' <> '["Divert", "Deceive"]'::jsonb then
    raise exception 'risk_threats does not order a control''s effects as Table F-1 does: %', control;
  end if;
  -- The program records no control baseline and no requirement: nothing stands in a baseline, and
  -- the counts are zeros that were counted.
  if (answer->>'baseline')::boolean or answer->'totals'->'in_baseline' <> 'null'::jsonb
    or exists (select 1 from jsonb_array_elements(answer->'controls') c
      where c->'in_baseline' <> 'null'::jsonb or c->'requirements' <> '0'::jsonb or c->'evidenced' <> '0'::jsonb)
    or answer->'totals'->'with_requirement' <> '0'::jsonb or answer->'totals'->'with_evidence' <> '0'::jsonb then
    raise exception 'risk_threats invents a standing for a program with no baseline and no requirement: %', answer->'totals';
  end if;
  -- A risk with no technique answers empty lists.
  answer := public.risk_threats(current_setting('test.tenant')::uuid, 'd7200000-0000-0000-0000-000000000002');
  if answer->'techniques' <> '[]'::jsonb or answer->'controls' <> '[]'::jsonb
    or (answer->'totals'->>'techniques')::integer <> 0 or (answer->'totals'->>'controls')::integer <> 0 then
    raise exception 'risk_threats does not answer empty lists for a risk with no technique: %', answer;
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Where the program stands, counted as the product counts it for a control: its requirements whose
-- latest revision maps the control, those of them with evidence, and its control baseline.
-- ---------------------------------------------------------------------------------------------
insert into public.engineering_requirements(id, tenant_id, program_id, code) values
  ('d7600000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'd7100000-0000-0000-0000-000000000001', 'REQ-EVIDENCED'),
  ('d7600000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'd7100000-0000-0000-0000-000000000001', 'REQ-BARE'),
  ('d7600000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'd7100000-0000-0000-0000-000000000002', 'REQ-ELSEWHERE');
insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type) values
  ('d7610000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'd7600000-0000-0000-0000-000000000001', 1, 'Behavior is analysed', 'The system analyses anomalous behavior.', 'Analysis is recorded.', 'security'),
  ('d7610000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'd7600000-0000-0000-0000-000000000002', 1, 'Behavior is reviewed', 'The team reviews anomalous behavior.', 'Reviews are recorded.', 'security'),
  ('d7610000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'd7600000-0000-0000-0000-000000000003', 1, 'Another program analyses behavior', 'The other system analyses behavior.', 'Analysis is recorded.', 'security');
insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type) values
  (current_setting('test.tenant')::uuid, 'd7610000-0000-0000-0000-000000000001', current_setting('test.control')::uuid, 'satisfies'),
  -- One requirement maps the control twice, in two relationships: it is one requirement.
  (current_setting('test.tenant')::uuid, 'd7610000-0000-0000-0000-000000000001', current_setting('test.control')::uuid, 'maps_to'),
  (current_setting('test.tenant')::uuid, 'd7610000-0000-0000-0000-000000000002', current_setting('test.control')::uuid, 'satisfies'),
  (current_setting('test.tenant')::uuid, 'd7610000-0000-0000-0000-000000000003', current_setting('test.control')::uuid, 'satisfies');
insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind, program_id) values
  ('d7700000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'Rollback behavior analysis report', 'document', 'd7100000-0000-0000-0000-000000000001');
insert into public.evidence_versions(id, tenant_id, artifact_id, version_number, state, external_uri) values
  ('d7710000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'd7700000-0000-0000-0000-000000000001', 1, 'published', 'https://example.test/evidence/behavior-analysis');
insert into public.requirement_evidence(tenant_id, requirement_revision_id, evidence_version_id) values
  (current_setting('test.tenant')::uuid, 'd7610000-0000-0000-0000-000000000001', 'd7710000-0000-0000-0000-000000000001'),
  (current_setting('test.tenant')::uuid, 'd7610000-0000-0000-0000-000000000003', 'd7710000-0000-0000-0000-000000000001');
do $$
declare answer jsonb; control jsonb;
begin
  answer := public.risk_threats(current_setting('test.tenant')::uuid, 'd7200000-0000-0000-0000-000000000001');
  select c into control from jsonb_array_elements(answer->'controls') c where c->>'id' = current_setting('test.control');
  -- Two requirements of the risk's program map IR-4(13), one with evidence; the other program's does not count.
  if control->'requirements' <> '2'::jsonb or control->'evidenced' <> '1'::jsonb then
    raise exception 'risk_threats does not count the program''s requirements and those with evidence: %', control;
  end if;
  if (select requirement_count from public.program_control_requirement_counts
      where program_id = 'd7100000-0000-0000-0000-000000000001' and control_id = current_setting('test.control')::uuid) <> 2 then
    raise exception 'risk_threats and program_control_requirement_counts no longer count a control''s requirements alike';
  end if;
  if answer->'totals'->'with_requirement' <> '1'::jsonb or answer->'totals'->'with_evidence' <> '1'::jsonb
    or exists (select 1 from jsonb_array_elements(answer->'controls') c
      where c->>'id' <> current_setting('test.control') and (c->'requirements' <> '0'::jsonb or c->'evidenced' <> '0'::jsonb)) then
    raise exception 'risk_threats counts a requirement on a control it does not map: %', answer->'totals';
  end if;
end $$;

-- The program adopts a published baseline: each control stands in it or not.
select set_config('request.jwt.claim.sub', 'd7000000-0000-0000-0000-000000000001', true);
insert into public.program_reference_choices(tenant_id, program_id, catalog_revision_id, profile_resolution_id) values
  (current_setting('test.tenant')::uuid, 'd7100000-0000-0000-0000-000000000001', current_setting('test.catalog')::uuid, current_setting('test.resolution')::uuid);
select set_config('request.jwt.claim.sub', 'd7000000-0000-0000-0000-000000000002', true);
do $$
declare answer jsonb; held integer;
begin
  answer := public.risk_threats(current_setting('test.tenant')::uuid, 'd7200000-0000-0000-0000-000000000001');
  if (answer->>'baseline')::boolean is not true then
    raise exception 'risk_threats does not say the program records a control baseline';
  end if;
  if exists (
    select 1 from jsonb_array_elements(answer->'controls') c
    where (c->>'in_baseline')::boolean is distinct from exists (
      select 1 from public.selected_controls sc
      where sc.profile_resolution_id = current_setting('test.resolution')::uuid and sc.control_id = (c->>'id')::uuid)
  ) then
    raise exception 'risk_threats does not read a control''s place in the baseline the program adopted';
  end if;
  select count(*) into held from public.selected_controls sc
    where sc.profile_resolution_id = current_setting('test.resolution')::uuid
      and sc.control_id in (select (c->>'id')::uuid from jsonb_array_elements(answer->'controls') c);
  if (answer->'totals'->>'in_baseline')::integer <> held then
    raise exception 'risk_threats does not total the controls in the baseline: % of %', answer->'totals'->'in_baseline', held;
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Who reads and who writes.
-- ---------------------------------------------------------------------------------------------
-- A viewer reads the link and the answer, and writes nothing: an insert is refused, and a delete
-- finds nothing to change.
select set_config('request.jwt.claim.sub', 'd7000000-0000-0000-0000-000000000003', true);
do $$ begin
  if (select count(*) from public.risk_attack_techniques where risk_id = 'd7200000-0000-0000-0000-000000000001') <> 1
    or jsonb_array_length(public.risk_threats(current_setting('test.tenant')::uuid, 'd7200000-0000-0000-0000-000000000001')->'techniques') <> 1 then
    raise exception 'A viewer cannot read a risk''s techniques';
  end if;
end $$;
select pg_temp.expect_error(format($$insert into public.risk_attack_techniques(tenant_id, risk_id, framework_item_id)
  values (%L, 'd7200000-0000-0000-0000-000000000001', %L)$$, current_setting('test.tenant'), current_setting('test.t1190')), '42501');
delete from public.risk_attack_techniques where risk_id = 'd7200000-0000-0000-0000-000000000001';
do $$ begin
  if (select count(*) from public.risk_attack_techniques where risk_id = 'd7200000-0000-0000-0000-000000000001') <> 1 then
    raise exception 'A viewer removed a technique link';
  end if;
end $$;

-- A member of another workspace sees neither the link nor the answer, and cannot name a technique
-- on this workspace's risk from its own.
select set_config('request.jwt.claim.sub', 'd7000000-0000-0000-0000-000000000004', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
do $$
declare answer jsonb;
begin
  if exists (select 1 from public.risk_attack_techniques) then
    raise exception 'A member of another workspace read a technique link';
  end if;
  answer := public.risk_threats(current_setting('test.other_tenant')::uuid, 'd7200000-0000-0000-0000-000000000001');
  if answer->'program_id' <> 'null'::jsonb or answer->'techniques' <> '[]'::jsonb or answer->'controls' <> '[]'::jsonb then
    raise exception 'A member of another workspace read a risk''s techniques through their own workspace: %', answer;
  end if;
end $$;
select pg_temp.expect_error(format($$select public.risk_threats(%L, 'd7200000-0000-0000-0000-000000000001')$$, current_setting('test.tenant')), '42501');
select pg_temp.expect_error(format($$insert into public.risk_attack_techniques(tenant_id, risk_id, framework_item_id)
  values (%L, 'd7200000-0000-0000-0000-000000000001', %L)$$, current_setting('test.other_tenant'), current_setting('test.t1595')), '23503');
select pg_temp.expect_error(format($$insert into public.risk_attack_techniques(tenant_id, risk_id, framework_item_id)
  values (%L, 'd7200000-0000-0000-0000-000000000001', %L)$$, current_setting('test.tenant'), current_setting('test.t1190')), '42501');

-- An anonymous session reads none of it and cannot run the read.
set local role anon;
select pg_temp.expect_error('select count(*) from public.risk_attack_techniques', '42501');
select pg_temp.expect_error(format($$select public.risk_threats(%L, 'd7200000-0000-0000-0000-000000000001')$$, current_setting('test.tenant')), '42501');
reset role;
do $$ begin
  if has_function_privilege('anon', 'public.risk_threats(uuid, uuid)', 'execute')
    or has_function_privilege('public', 'public.risk_threats(uuid, uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.risk_threats(uuid, uuid)', 'execute')
    or has_function_privilege('authenticated', 'public.risk_attack_technique_guard()', 'execute') then
    raise exception 'risk_threats is not granted to signed-in members alone';
  end if;
end $$;
rollback;
select 'Risk technique links, what they may name, tenant isolation and the risk_threats standing passed.' as result;
