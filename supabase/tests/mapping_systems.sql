-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Requirement mappings name their systems (20261114150844_mapping_systems): a mapping that names no
-- system becomes, through name_requirement_mapping_systems, one mapping on each system its
-- requirement's latest revision is allocated to whose control baseline selects the control, the
-- mapping itself taking the first system in code order and a new mapping each other one, with the
-- same requirement revision, control, part, relationship and rationale. A mapping it cannot place is
-- left as it is and counted by why: its requirement allocated to no system, or only to security
-- processes or provider capabilities, its systems' baselines leaving the control out, or every such
-- system holding the same mapping already (a historical revision, which a requirement can no longer
-- take, and a part that is not a mapping target, which the guard no longer lets a mapping name, are
-- the developer workspace's September records). A seeded mapping's new rows are listed under its
-- batch, from its source, and the batch's summary counts them; another workspace and mappings not
-- named stay as they are, a further run changes nothing, no client may call it, and the control
-- status counts each named mapping on its own system.
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

-- No client may name a mapping's systems: the migration and the seeds call it, as the database's owner.
do $$ begin
  if has_function_privilege('anon', 'public.name_requirement_mapping_systems(uuid, uuid[])', 'execute')
    or has_function_privilege('public', 'public.name_requirement_mapping_systems(uuid, uuid[])', 'execute')
    or has_function_privilege('authenticated', 'public.name_requirement_mapping_systems(uuid, uuid[])', 'execute') then
    raise exception 'A client session may name a mapping''s systems';
  end if;
  if (select p.prosecdef from pg_catalog.pg_proc p
      where p.oid = 'public.name_requirement_mapping_systems(uuid, uuid[])'::regprocedure) then
    raise exception 'name_requirement_mapping_systems does not run as its caller';
  end if;
end $$;
-- A database with no mapping that names no system is left as it is.
create temp table mapping_systems_before as
  select l.id, l.system_id, l.selected_control_id, l.revision from public.requirement_control_links l;
grant select on mapping_systems_before to authenticated;

insert into auth.users(id, email, raw_user_meta_data) values
  ('c5800000-0000-0000-0000-000000000001', 'mapping-systems-owner@example.test', '{"name":"Mapping systems test owner"}'),
  ('c5800000-0000-0000-0000-000000000002', 'mapping-systems-other@example.test', '{}');
select set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
select pg_temp.expect_error($$select public.name_requirement_mapping_systems()$$, '42501');
set local role anon;
select pg_temp.expect_error($$select public.name_requirement_mapping_systems()$$, '42501');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000002', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
select set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000001', true);

create function pg_temp.line(answer jsonb, control uuid) returns jsonb language sql immutable as $$
  select c from jsonb_array_elements(answer->'controls') c where (c->>'id')::uuid = control
$$;
grant execute on function pg_temp.line(jsonb, uuid) to authenticated;
create function pg_temp.selection(system uuid, control uuid) returns uuid language sql stable as $$
  select sc.id from public.selected_controls sc
  join public.system_effective_baselines b on b.profile_resolution_id = sc.profile_resolution_id
  where b.system_id = system and sc.control_id = control limit 1;
$$;
grant execute on function pg_temp.selection(uuid, uuid) to authenticated;

do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_other uuid := current_setting('test.other_tenant')::uuid;
  v_catalog uuid; v_small uuid; v_more uuid; v_program uuid; v_created jsonb; v_key uuid := gen_random_uuid();
  v_one uuid; v_two uuid; v_element uuid := gen_random_uuid(); v_process uuid := gen_random_uuid();
  v_control uuid; v_second uuid; v_third uuid; v_fourth uuid; v_unselected uuid; v_objective uuid;
  v_both uuid := 'c5830000-0000-0000-0000-000000000001'; v_part uuid := 'c5830000-0000-0000-0000-000000000002';
  v_first_only uuid := 'c5830000-0000-0000-0000-000000000003'; v_nowhere uuid := 'c5830000-0000-0000-0000-000000000004';
  v_process_only uuid := 'c5830000-0000-0000-0000-000000000005'; v_left_out uuid := 'c5830000-0000-0000-0000-000000000006';
  v_held uuid := 'c5830000-0000-0000-0000-000000000008';
  v_named uuid := 'c5830000-0000-0000-0000-000000000009'; v_scoped uuid := 'c5830000-0000-0000-0000-000000000010';
  v_others uuid := 'c5830000-0000-0000-0000-000000000011';
  v_job uuid := gen_random_uuid(); v_batch uuid := gen_random_uuid(); v_source uuid := gen_random_uuid();
  v_answer jsonb; v_row public.requirement_control_links; v_count integer; v_record public.demo_import_records;
  v_system jsonb := jsonb_build_object('description', '', 'type', 'information_system', 'ownerPartyId', null,
    'confidentiality', 'low', 'integrity', 'low', 'availability', 'low',
    'categorizationRationale', 'A limited impact boundary for a rollback test.', 'elements', '[]'::jsonb);
begin
  -- The smallest published reference baseline, and a larger one of its catalog that selects
  -- controls it does not.
  select r.id, i.catalog_revision_id into v_small, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) >= 3
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_small is null then
    raise notice 'The pinned references are not installed: the checks of named systems were skipped';
    return;
  end if;
  select r.id into v_more
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id and i.catalog_revision_id = v_catalog
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null and r.id <> v_small
    and exists (select 1 from public.selected_controls sc where sc.profile_resolution_id = r.id
      and not exists (select 1 from public.selected_controls x
        where x.profile_resolution_id = v_small and x.control_id = sc.control_id))
  order by r.id limit 1;
  -- Two systems on the smaller baseline, an element inside the second, and a security process.
  v_created := public.create_program_wizard(v_tenant, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', 'MS-SYSTEMS', 'name', 'Mapping systems test', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb,
    'catalogRevisionId', v_catalog,
    'profiles', jsonb_build_array(jsonb_build_object(
      'key', v_key, 'baseResolutionId', v_small, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)),
    'systems', jsonb_build_array(
      v_system || jsonb_build_object('key', gen_random_uuid(), 'code', 'MS-SYS-ONE', 'name', 'First system', 'profileKey', v_key),
      v_system || jsonb_build_object('key', gen_random_uuid(), 'code', 'MS-SYS-TWO', 'name', 'Second system', 'profileKey', v_key))));
  v_program := (v_created->>'programId')::uuid;
  select s.id into v_one from public.systems s where s.program_id = v_program and s.code = 'MS-SYS-ONE';
  select s.id into v_two from public.systems s where s.program_id = v_program and s.code = 'MS-SYS-TWO';
  insert into public.systems(id, tenant_id, program_id, code, name, system_type, parent_system_id, boundary_system_id, is_authorization_boundary)
    values (v_element, v_tenant, v_program, 'MS-SYS-TWO-EL', 'Element of the second system', 'subsystem', v_two, v_two, false);
  insert into public.security_processes(id, tenant_id, program_id, code, name)
    values (v_process, v_tenant, v_program, 'MS-PRC', 'Mapping systems test process');

  -- Four controls of the smaller baseline with assessment objectives, and one only the larger
  -- baseline selects.
  select (array_agg(x.control_id order by x.code_order))[1], (array_agg(x.control_id order by x.code_order))[2],
         (array_agg(x.control_id order by x.code_order))[3], (array_agg(x.control_id order by x.code_order))[4]
    into v_control, v_second, v_third, v_fourth
  from (select sc.control_id, k.code_order
        from public.selected_controls sc join public.catalog_control_rows k on k.id = sc.control_id
        where sc.profile_resolution_id = v_small
          and exists (select 1 from public.control_parts o where o.control_id = sc.control_id and o.name = 'assessment-objective')
        order by k.code_order limit 4) x;
  select o.id into v_objective from public.control_parts o
    where o.control_id = v_second and o.name = 'assessment-objective'
      and not exists (select 1 from public.control_parts g where g.parent_part_id = o.id and g.name = 'assessment-objective')
    order by o.source_pointer limit 1;
  if v_more is not null then
    select sc.control_id into v_unselected
    from public.selected_controls sc join public.catalog_control_rows k on k.id = sc.control_id
    where sc.profile_resolution_id = v_more
      and not exists (select 1 from public.selected_controls x where x.profile_resolution_id = v_small and x.control_id = sc.control_id)
    order by k.code_order limit 1;
  end if;

  insert into public.engineering_requirements(id, tenant_id, program_id, code) values
    ('c5810000-0000-0000-0000-000000000001', v_tenant, v_program, 'REQ-BOTH'),
    ('c5810000-0000-0000-0000-000000000002', v_tenant, v_program, 'REQ-FIRST'),
    ('c5810000-0000-0000-0000-000000000003', v_tenant, v_program, 'REQ-NOWHERE'),
    ('c5810000-0000-0000-0000-000000000004', v_tenant, v_program, 'REQ-PROCESS');
  insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type) values
    ('c5820000-0000-0000-0000-000000000001', v_tenant, 'c5810000-0000-0000-0000-000000000001', 1, 'Met on both systems', 'Both systems do it.', 'It is recorded.', 'functional'),
    ('c5820000-0000-0000-0000-000000000002', v_tenant, 'c5810000-0000-0000-0000-000000000002', 1, 'Met on the first system', 'The first system does it.', 'It is recorded.', 'functional'),
    ('c5820000-0000-0000-0000-000000000003', v_tenant, 'c5810000-0000-0000-0000-000000000003', 1, 'Allocated nowhere', 'Nothing does it yet.', 'It is recorded.', 'functional'),
    ('c5820000-0000-0000-0000-000000000004', v_tenant, 'c5810000-0000-0000-0000-000000000004', 1, 'Met by a process', 'A process does it.', 'It is recorded.', 'functional');
  -- REQ-BOTH on the first system and on the element inside the second; REQ-FIRST on the first alone.
  insert into public.requirement_allocations(tenant_id, requirement_revision_id, system_id) values
    (v_tenant, 'c5820000-0000-0000-0000-000000000001', v_one),
    (v_tenant, 'c5820000-0000-0000-0000-000000000001', v_element),
    (v_tenant, 'c5820000-0000-0000-0000-000000000002', v_one);
  insert into public.requirement_allocations(tenant_id, requirement_revision_id, security_process_id) values
    (v_tenant, 'c5820000-0000-0000-0000-000000000004', v_process);

  insert into public.requirement_control_links(id, tenant_id, requirement_revision_id, control_id, control_part_id, relationship_type, rationale) values
    (v_both, v_tenant, 'c5820000-0000-0000-0000-000000000001', v_control, null, 'maps_to', 'Both systems carry it.'),
    (v_part, v_tenant, 'c5820000-0000-0000-0000-000000000001', v_second, v_objective, 'satisfies', null),
    (v_first_only, v_tenant, 'c5820000-0000-0000-0000-000000000002', v_third, null, 'derived_from', 'The first system carries it.'),
    (v_nowhere, v_tenant, 'c5820000-0000-0000-0000-000000000003', v_fourth, null, 'maps_to', null),
    (v_process_only, v_tenant, 'c5820000-0000-0000-0000-000000000004', v_fourth, null, 'maps_to', null),
    -- The same mapping already on REQ-FIRST's only system, beside one that names none.
    (v_named, v_tenant, 'c5820000-0000-0000-0000-000000000002', v_control, null, 'maps_to', null);
  update public.requirement_control_links set system_id = v_one, selected_control_id = pg_temp.selection(v_one, v_control), revision = revision + 1
    where id = v_named;
  insert into public.requirement_control_links(id, tenant_id, requirement_revision_id, control_id, relationship_type) values
    (v_held, v_tenant, 'c5820000-0000-0000-0000-000000000002', v_control, 'maps_to');
  if v_unselected is not null then
    insert into public.requirement_control_links(id, tenant_id, requirement_revision_id, control_id, relationship_type)
      values (v_left_out, v_tenant, 'c5820000-0000-0000-0000-000000000002', v_unselected, 'maps_to');
  end if;

  -- A mapping of another workspace that names no system, which a run for this one leaves as it is.
  perform set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000002', true);
  insert into public.programs(id, tenant_id, code, name) values
    ('c5840000-0000-0000-0000-000000000001', v_other, 'MS-OTHER', 'Another workspace''s program');
  insert into public.engineering_requirements(id, tenant_id, program_id, code) values
    ('c5840000-0000-0000-0000-000000000002', v_other, 'c5840000-0000-0000-0000-000000000001', 'REQ-OTHER');
  insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type) values
    ('c5840000-0000-0000-0000-000000000003', v_other, 'c5840000-0000-0000-0000-000000000002', 1, 'Another workspace''s', 'It does it.', 'It is recorded.', 'functional');
  insert into public.requirement_control_links(id, tenant_id, requirement_revision_id, control_id, relationship_type)
    values (v_others, v_other, 'c5840000-0000-0000-0000-000000000003', v_third, 'maps_to');
  perform set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000001', true);

  -- Before: a mapping that names no system counts on every system, so REQ-FIRST's covers the third
  -- control on the second system too, where REQ-FIRST is not allocated. Only REQ-FIRST maps it.
  if pg_temp.line(public.program_control_status(v_program), v_third)->>'status' <> 'no_evidence' then
    raise exception 'A control mapped with no system read %', pg_temp.line(public.program_control_status(v_program), v_third);
  end if;
  perform set_config('test.program', v_program::text, true);
  perform set_config('test.one', v_one::text, true);
  perform set_config('test.two', v_two::text, true);
  perform set_config('test.element', v_element::text, true);
  perform set_config('test.control', v_control::text, true);
  perform set_config('test.second', v_second::text, true);
  perform set_config('test.third', v_third::text, true);
  perform set_config('test.objective', v_objective::text, true);
  perform set_config('test.unselected', coalesce(v_unselected::text, ''), true);
end $$;

-- REQ-BOTH's mapping is the seed's: listed under a batch of its own, from a source of its own.
reset role;
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_both uuid := 'c5830000-0000-0000-0000-000000000001';
  v_job uuid := gen_random_uuid(); v_batch uuid := gen_random_uuid(); v_source uuid := gen_random_uuid();
begin
  if current_setting('test.program', true) is null or current_setting('test.program', true) = '' then return; end if;
  insert into public.ingestion_jobs(id, tenant_id, title, source_uri, status, started_at, completed_at, summary)
    values (v_job, v_tenant, 'Mapping systems test seed', 'urn:program-assurance:test', 'completed', now(), now(), 'A rollback test.');
  insert into public.demo_import_batches(id, tenant_id, ingestion_job_id, dataset_id, fixture_sha256, imported_at, source_manifest, summary)
    values (v_batch, v_tenant, v_job, 'mapping-systems-test', repeat('a', 64), now(), '{}'::jsonb,
      jsonb_build_object('tables', jsonb_build_object('requirement_control_links', 1, 'programs', 1)));
  insert into public.demo_import_sources(id, tenant_id, import_batch_id, source_pointer, source_sha256, source_record)
    values (v_source, v_tenant, v_batch, '/derivations/0', repeat('b', 64), '{"control": "test"}'::jsonb);
  insert into public.demo_import_records(id, tenant_id, import_batch_id, dataset_id, destination_table, destination_id,
      source_key, source_pointer, source_sha256, source_record_id, mapped_values)
    values (gen_random_uuid(), v_tenant, v_batch, 'mapping-systems-test', 'requirement_control_links', v_both,
      'REQ-BOTH:derived', '/derivations/0', repeat('b', 64), v_source,
      jsonb_build_object('id', v_both, 'system_id', null, 'selected_control_id', null, 'relationship_type', 'maps_to'));
  perform set_config('test.batch', v_batch::text, true);
  perform set_config('test.source', v_source::text, true);
end $$;

-- A run limited to mappings it is not given changes nothing.
do $$
declare v_answer jsonb;
begin
  if current_setting('test.program', true) is null or current_setting('test.program', true) = '' then return; end if;
  v_answer := public.name_requirement_mapping_systems(current_setting('test.tenant')::uuid,
    array['c5830000-0000-0000-0000-0000000000ff'::uuid]);
  if v_answer <> '{"held": 0, "added": 0, "named": 0, "historical": 0, "notATarget": 0, "notSelected": 0, "processOnly": 0, "unallocated": 0}'::jsonb then
    raise exception 'A run given no mapping of the workspace answered %', v_answer;
  end if;
  -- A run given one mapping names that one alone.
  v_answer := public.name_requirement_mapping_systems(current_setting('test.tenant')::uuid,
    array['c5830000-0000-0000-0000-000000000003'::uuid]);
  if v_answer->>'named' <> '1' or v_answer->>'added' <> '0'
    or (select system_id from public.requirement_control_links where id = 'c5830000-0000-0000-0000-000000000003')
      is distinct from current_setting('test.one')::uuid
    or (select system_id from public.requirement_control_links where id = 'c5830000-0000-0000-0000-000000000001') is not null then
    raise exception 'A run given one mapping answered %', v_answer;
  end if;
end $$;

-- The workspace's run: every mapping that names no system is placed, or counted by why it is not.
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_one uuid := current_setting('test.one')::uuid; v_element uuid := current_setting('test.element')::uuid;
  v_control uuid := current_setting('test.control')::uuid; v_second uuid := current_setting('test.second')::uuid;
  v_objective uuid := current_setting('test.objective')::uuid;
  v_unselected text := current_setting('test.unselected');
  v_answer jsonb; v_row public.requirement_control_links; v_new public.requirement_control_links;
  v_record public.demo_import_records; v_summary jsonb;
begin
  if current_setting('test.program', true) is null or current_setting('test.program', true) = '' then return; end if;
  v_answer := public.name_requirement_mapping_systems(v_tenant);
  if v_answer <> jsonb_build_object('held', 1, 'added', 2, 'named', 2, 'historical', 0, 'notATarget', 0,
      'notSelected', case when v_unselected = '' then 0 else 1 end, 'processOnly', 1, 'unallocated', 1) then
    raise exception 'The workspace''s run answered %', v_answer;
  end if;

  -- REQ-BOTH's whole-control mapping names the first system, in code order, by its baseline's
  -- selection, at its next revision; the element inside the second system takes a mapping of its
  -- own with the same revision, control, part, relationship and rationale.
  select * into v_row from public.requirement_control_links where id = 'c5830000-0000-0000-0000-000000000001';
  if v_row.system_id is distinct from v_one or v_row.selected_control_id is distinct from pg_temp.selection(v_one, v_control)
    or v_row.revision <> 2 or v_row.rationale <> 'Both systems carry it.' then
    raise exception 'REQ-BOTH''s mapping read %', to_jsonb(v_row);
  end if;
  select * into v_new from public.requirement_control_links
    where id = md5('requirement_control_links/c5830000-0000-0000-0000-000000000001/' || v_element)::uuid;
  if v_new.id is null or v_new.system_id <> v_element or v_new.selected_control_id <> pg_temp.selection(v_element, v_control)
    or v_new.requirement_revision_id <> v_row.requirement_revision_id or v_new.control_id <> v_control
    or v_new.control_part_id is not null or v_new.relationship_type <> 'maps_to' or v_new.rationale <> 'Both systems carry it.' then
    raise exception 'REQ-BOTH''s mapping on the element read %', to_jsonb(v_new);
  end if;
  if (select count(*) from public.requirement_control_links
      where requirement_revision_id = 'c5820000-0000-0000-0000-000000000001' and control_id = v_control) <> 2 then
    raise exception 'REQ-BOTH maps its control other than once on each of its systems';
  end if;
  -- Its objective mapping keeps the objective it names on both systems.
  if (select count(*) from public.requirement_control_links
      where requirement_revision_id = 'c5820000-0000-0000-0000-000000000001' and control_id = v_second
        and control_part_id = v_objective and system_id in (v_one, v_element) and relationship_type = 'satisfies') <> 2 then
    raise exception 'REQ-BOTH''s objective mapping was not placed on both systems';
  end if;

  -- The seeded mapping's new row is listed under the seed's batch, from its source, keyed by the
  -- mapping's key and the system, and the batch's summary counts what it holds and what was named.
  select * into v_record from public.demo_import_records
    where tenant_id = v_tenant and destination_table = 'requirement_control_links' and destination_id = v_new.id;
  if v_record.id is null or v_record.import_batch_id <> current_setting('test.batch')::uuid
    or v_record.dataset_id <> 'mapping-systems-test' or v_record.source_key <> 'REQ-BOTH:derived/' || v_element
    or v_record.source_pointer <> '/derivations/0' or v_record.source_sha256 <> repeat('b', 64)
    or v_record.source_record_id <> current_setting('test.source')::uuid
    or v_record.mapped_values <> jsonb_build_object('id', v_new.id, 'system_id', v_element,
      'selected_control_id', v_new.selected_control_id, 'relationship_type', 'maps_to') then
    raise exception 'The seeded mapping''s new row was recorded as %', to_jsonb(v_record);
  end if;
  select summary into v_summary from public.demo_import_batches where id = current_setting('test.batch')::uuid;
  if v_summary <> jsonb_build_object('tables', jsonb_build_object('requirement_control_links', 2, 'programs', 1),
      'systemsNamed', jsonb_build_object('named', 1, 'added', 1)) then
    raise exception 'The seed''s batch summary read %', v_summary;
  end if;
  -- A mapping no seed wrote takes no provenance.
  if exists (select 1 from public.demo_import_records r
      join public.requirement_control_links l on l.id = r.destination_id
      where r.tenant_id = v_tenant and l.control_id = v_second) then
    raise exception 'An authored mapping''s new row was listed under a seed';
  end if;

  -- What is left names no system: allocated nowhere, allocated to a process alone, left out of its
  -- systems' baselines, and the same mapping held on its one system. (A historical revision, which
  -- a requirement can no longer take, is left too: its content cannot change.)
  if exists (select 1 from public.requirement_control_links where system_id is not null and id in (
      'c5830000-0000-0000-0000-000000000004', 'c5830000-0000-0000-0000-000000000005',
      'c5830000-0000-0000-0000-000000000006', 'c5830000-0000-0000-0000-000000000008')) then
    raise exception 'A mapping that cannot be placed named a system';
  end if;
  -- Another workspace's mapping is not this run's.
  if (select system_id from public.requirement_control_links where id = 'c5830000-0000-0000-0000-000000000011') is not null then
    raise exception 'A run for one workspace named another''s mapping';
  end if;
  -- Nothing else in the database changed.
  if exists (select 1 from mapping_systems_before b join public.requirement_control_links l on l.id = b.id
      where (l.system_id, l.selected_control_id, l.revision) is distinct from (b.system_id, b.selected_control_id, b.revision)) then
    raise exception 'A run for one workspace changed a mapping of another';
  end if;

  -- A further run changes nothing, and says again what it leaves.
  v_answer := public.name_requirement_mapping_systems(v_tenant);
  if v_answer <> jsonb_build_object('held', 1, 'added', 0, 'named', 0, 'historical', 0, 'notATarget', 0,
      'notSelected', case when v_unselected = '' then 0 else 1 end, 'processOnly', 1, 'unallocated', 1)
    or (select summary from public.demo_import_batches where id = current_setting('test.batch')::uuid) <> v_summary then
    raise exception 'A further run answered %', v_answer;
  end if;
end $$;

-- The control status counts each named mapping on its own system: REQ-BOTH's control stays covered
-- on both systems, and REQ-FIRST's now covers the third control on the first system alone, so the
-- control has no requirement on the second, the truth the rule shows.
set local role authenticated;
do $$
declare v_program uuid; v_line jsonb;
begin
  if current_setting('test.program', true) is null or current_setting('test.program', true) = '' then return; end if;
  v_program := current_setting('test.program')::uuid;
  v_line := pg_temp.line(public.program_control_status(v_program), current_setting('test.control')::uuid);
  if v_line->>'status' <> 'no_evidence' or v_line->'objectives_mapped' <> v_line->'objectives' then
    raise exception 'A control named on both of its systems read %', v_line;
  end if;
  v_line := pg_temp.line(public.program_control_status(v_program), current_setting('test.third')::uuid);
  if v_line->>'status' <> 'no_requirement' then
    raise exception 'A control named on one of its two systems read %', v_line;
  end if;
  if (select count(*) from jsonb_array_elements(public.program_control_objectives(v_program, current_setting('test.third')::uuid)->'systems') s
      where (s->>'mapped')::boolean) <> 1 then
    raise exception 'The control named on one system is not mapped on exactly one';
  end if;
  raise notice 'The checks of named systems ran against the pinned references';
end $$;

reset role;
rollback;
select 'Mapping systems: privileges, a run given no mapping, one mapping, the workspace''s run with every rule it leaves, a seeded mapping''s provenance and batch summary, another workspace, a further run and the control status of named systems passed.' as result;
