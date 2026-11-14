-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- A program's control status, once a day: who may take, read and write a snapshot; what a snapshot
-- holds against program_control_status; a second run the same day, by the command a trend calls
-- (which takes a day once) and by the job (which counts it again); a program with no control
-- baseline; the job with no identity, over every program and over a product variant, which
-- program_control_status itself would refuse; the tenant boundary; and a viewer's read.
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
-- Who may call what: members read the trend and ask for today's snapshot; only the job and that
-- command take one; nobody writes the table directly.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_function text;
begin
  foreach v_function in array array[
    'public.program_posture_trend(uuid[], date)', 'public.ensure_program_posture_snapshots(uuid[])',
    'public.take_program_posture_snapshots(uuid)', 'public.program_control_status_lines(uuid)',
    'public.variant_control_delta_answer(uuid, uuid)'] loop
    if has_function_privilege('anon', v_function, 'execute') or has_function_privilege('public', v_function, 'execute') then
      raise exception 'An anonymous session may execute %', v_function;
    end if;
  end loop;
  if not has_function_privilege('authenticated', 'public.program_posture_trend(uuid[], date)', 'execute')
    or not has_function_privilege('authenticated', 'public.ensure_program_posture_snapshots(uuid[])', 'execute') then
    raise exception 'A signed-in session may not read the trend or ask for today''s snapshot';
  end if;
  if has_function_privilege('authenticated', 'public.take_program_posture_snapshots(uuid)', 'execute') then
    raise exception 'A signed-in session may take a snapshot directly';
  end if;
  -- The reads run as their caller; the two that write run as the table's owner.
  if exists (select 1 from pg_catalog.pg_proc p where p.prosecdef and p.oid in (
      'public.program_posture_trend(uuid[], date)'::regprocedure, 'public.program_control_status_lines(uuid)'::regprocedure,
      'public.variant_control_delta_answer(uuid, uuid)'::regprocedure, 'public.program_control_status(uuid)'::regprocedure,
      'public.variant_control_delta(uuid, uuid)'::regprocedure)) then
    raise exception 'A read does not run as its caller';
  end if;
  if exists (select 1 from pg_catalog.pg_proc p where not p.prosecdef and p.oid in (
      'public.take_program_posture_snapshots(uuid)'::regprocedure, 'public.ensure_program_posture_snapshots(uuid[])'::regprocedure)) then
    raise exception 'A snapshot command runs as its caller, who may not write the table';
  end if;
  if not has_table_privilege('authenticated', 'public.program_posture_snapshots', 'select')
    or has_table_privilege('authenticated', 'public.program_posture_snapshots', 'insert')
    or has_table_privilege('authenticated', 'public.program_posture_snapshots', 'update')
    or has_table_privilege('authenticated', 'public.program_posture_snapshots', 'delete')
    or has_table_privilege('anon', 'public.program_posture_snapshots', 'select')
    or not (select c.relrowsecurity from pg_catalog.pg_class c where c.oid = 'public.program_posture_snapshots'::regclass) then
    raise exception 'Members do not read the snapshots under row-level security alone';
  end if;
  -- Once a day, where pg_cron is installed.
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    execute $q$select count(*) from cron.job where jobname = 'program-posture-snapshots'
      and schedule = '55 23 * * *' and command = 'select public.take_program_posture_snapshots()' and active$q$
      into v_function;
    if v_function <> '1' then
      raise exception 'The daily job program-posture-snapshots is not scheduled at 23:55';
    end if;
  else
    raise notice 'pg_cron is not installed: the daily job was not checked';
  end if;
end $$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('c5800000-0000-0000-0000-000000000001', 'posture-owner@example.test', '{"name":"Posture snapshot test owner"}'),
  ('c5800000-0000-0000-0000-000000000002', 'posture-outsider@example.test', '{}'),
  ('c5800000-0000-0000-0000-000000000003', 'posture-viewer@example.test', '{}');
select set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000002', true);
set local role authenticated;
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
select set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000001', true);
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.programs(id, tenant_id, code, name) values
  ('c5810000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'POSTURE-BARE', 'Program with no control baseline');

-- A program with no control baseline takes no snapshot, and its trend is empty.
do $$
declare v_answer jsonb := public.ensure_program_posture_snapshots(array['c5810000-0000-0000-0000-000000000001'::uuid]);
begin
  if v_answer->'taken' <> '[]'::jsonb or (v_answer->>'taken_on')::date <> (clock_timestamp() at time zone 'utc')::date then
    raise exception 'A program with no baseline answered %', v_answer;
  end if;
  if exists (select 1 from public.program_posture_trend(array['c5810000-0000-0000-0000-000000000001'::uuid]))
    or exists (select 1 from public.program_posture_snapshots) then
    raise exception 'A program with no baseline took a snapshot';
  end if;
end $$;

-- A program the reader cannot read is refused, never answered as empty: one that does not exist,
-- a list that names nothing, a session with no account, an anonymous one, another workspace's.
select pg_temp.expect_error($$select * from public.program_posture_trend(array['c5810000-0000-0000-0000-00000000dead'::uuid])$$, '42501');
select pg_temp.expect_error($$select public.ensure_program_posture_snapshots(array['c5810000-0000-0000-0000-00000000dead'::uuid])$$, '42501');
select pg_temp.expect_error($$select * from public.program_posture_trend(null)$$, '42501');
select pg_temp.expect_error($$select public.ensure_program_posture_snapshots(array[null]::uuid[])$$, '42501');
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$select * from public.program_posture_trend(array['c5810000-0000-0000-0000-000000000001'::uuid])$$, '42501');
select pg_temp.expect_error($$select public.ensure_program_posture_snapshots(array['c5810000-0000-0000-0000-000000000001'::uuid])$$, '42501');
set local role anon;
select pg_temp.expect_error($$select * from public.program_posture_trend(array['c5810000-0000-0000-0000-000000000001'::uuid])$$, '42501');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000002', true);
select pg_temp.expect_error($$select * from public.program_posture_trend(array['c5810000-0000-0000-0000-000000000001'::uuid])$$, '42501');
select pg_temp.expect_error($$select public.ensure_program_posture_snapshots(array['c5810000-0000-0000-0000-000000000001'::uuid])$$, '42501');
select set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000001', true);
-- Nobody takes a snapshot directly.
select pg_temp.expect_error($$select public.take_program_posture_snapshots('c5810000-0000-0000-0000-000000000001')$$, '42501');

-- ---------------------------------------------------------------------------------------------
-- With the pinned references installed: a program set up as the product sets one up, with a
-- requirement that cites evidence and one that does not, so its baseline stands at three statuses.
-- ---------------------------------------------------------------------------------------------
create function pg_temp.program(code text, catalog uuid, base uuid) returns uuid language plpgsql as $$
declare created jsonb; profile uuid := gen_random_uuid();
begin
  created := public.create_program_wizard(current_setting('test.tenant')::uuid, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', code, 'name', code || ' posture snapshot test', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb,
    'catalogRevisionId', catalog,
    'profiles', jsonb_build_array(jsonb_build_object(
      'key', profile, 'baseResolutionId', base, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)),
    'systems', jsonb_build_array(jsonb_build_object(
      'key', gen_random_uuid(), 'code', code || '-SYS', 'name', code || ' system', 'description', '',
      'type', 'information_system', 'ownerPartyId', null,
      'confidentiality', 'low', 'integrity', 'low', 'availability', 'low',
      'categorizationRationale', 'A limited impact boundary for a rollback test.',
      'profileKey', profile, 'elements', '[]'::jsonb))));
  return (created->>'programId')::uuid;
end;
$$;
-- The day's snapshot of a program as a row's counts, and program_control_status's totals the same way.
create function pg_temp.snapshot_counts(program uuid) returns jsonb language sql stable as $$
  select jsonb_build_object('controls', s.controls, 'no_requirement', s.no_requirement, 'no_evidence', s.no_evidence,
    'not_assessed', s.not_assessed, 'other_than_satisfied', s.other_than_satisfied,
    'partially_satisfied', s.partially_satisfied, 'satisfied', s.satisfied)
  from public.program_posture_snapshots s
  where s.program_id = program and s.taken_on = (clock_timestamp() at time zone 'utc')::date;
$$;
grant execute on function pg_temp.program(text, uuid, uuid), pg_temp.snapshot_counts(uuid) to authenticated;

do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_base uuid; v_program uuid; v_a uuid; v_b uuid;
  v_answer jsonb; v_totals jsonb; v_row public.program_posture_snapshots; v_later public.program_posture_snapshots;
begin
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) >= 3
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the checks of a program with a baseline were skipped';
    return;
  end if;
  perform set_config('test.catalog', v_catalog::text, true);
  perform set_config('test.base', v_base::text, true);
  v_program := pg_temp.program('PS-ONE', v_catalog, v_base);
  perform set_config('test.program', v_program::text, true);
  select (array_agg(x.control_id order by x.code_order))[1], (array_agg(x.control_id order by x.code_order))[2]
  into v_a, v_b
  from (select distinct sc.control_id, k.code_order
    from public.program_reference_choices c
    join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
    join public.catalog_control_rows k on k.id = sc.control_id
    where c.program_id = v_program) x;
  insert into public.engineering_requirements(id, tenant_id, program_id, code) values
    ('c5820000-0000-0000-0000-000000000001', v_tenant, v_program, 'REQ-BARE'),
    ('c5820000-0000-0000-0000-000000000002', v_tenant, v_program, 'REQ-EVIDENCED');
  insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type) values
    ('c5830000-0000-0000-0000-000000000001', v_tenant, 'c5820000-0000-0000-0000-000000000001', 1, 'Mapped and bare', 'The system does the first thing.', 'It is recorded.', 'functional'),
    ('c5830000-0000-0000-0000-000000000002', v_tenant, 'c5820000-0000-0000-0000-000000000002', 1, 'Mapped with evidence', 'The system does the second thing.', 'It is recorded.', 'functional');
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type) values
    (v_tenant, 'c5830000-0000-0000-0000-000000000001', v_a, 'satisfies'),
    (v_tenant, 'c5830000-0000-0000-0000-000000000002', v_b, 'satisfies');
  insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind, program_id) values
    ('c5840000-0000-0000-0000-000000000001', v_tenant, 'Rollback posture report', 'document', v_program);
  insert into public.evidence_versions(id, tenant_id, artifact_id, version_number, state, external_uri) values
    ('c5850000-0000-0000-0000-000000000001', v_tenant, 'c5840000-0000-0000-0000-000000000001', 1, 'published', 'https://example.test/evidence/posture');
  insert into public.requirement_evidence(tenant_id, requirement_revision_id, evidence_version_id) values
    (v_tenant, 'c5830000-0000-0000-0000-000000000002', 'c5850000-0000-0000-0000-000000000001');

  -- The command takes today's snapshot of a program that has none, and only of that one.
  v_answer := public.ensure_program_posture_snapshots(array[v_program, 'c5810000-0000-0000-0000-000000000001'::uuid]);
  if v_answer->'taken' <> jsonb_build_array(v_program) then
    raise exception 'The command took %', v_answer;
  end if;
  -- What a snapshot holds: program_control_status's totals for the day, the six adding up to the baseline.
  v_totals := public.program_control_status(v_program)->'totals';
  if pg_temp.snapshot_counts(v_program) is distinct from v_totals
    or (v_totals->>'no_evidence')::integer <> 1 or (v_totals->>'not_assessed')::integer <> 1
    or (v_totals->>'no_requirement')::integer <> (v_totals->>'controls')::integer - 2 then
    raise exception 'The snapshot holds %, program_control_status counts %', pg_temp.snapshot_counts(v_program), v_totals;
  end if;
  select * into v_row from public.program_posture_snapshots where program_id = v_program;
  if v_row.tenant_id <> v_tenant or v_row.taken_on <> (clock_timestamp() at time zone 'utc')::date
    or v_row.taken_at > clock_timestamp() then
    raise exception 'The snapshot was taken for % on % at %', v_row.tenant_id, v_row.taken_on, v_row.taken_at;
  end if;
  -- The trend reads it, by program and day.
  if (select count(*) from public.program_posture_trend(array[v_program])) <> 1
    or (select t.id from public.program_posture_trend(array[v_program]) t) <> v_row.id
    or exists (select 1 from public.program_posture_trend(array[v_program], v_row.taken_on + 1)) then
    raise exception 'The trend did not read the day''s snapshot';
  end if;

  -- A second run the same day. The bare requirement cites evidence now, so the program stands
  -- elsewhere; the command a trend calls takes a day once, and leaves the day as it was.
  insert into public.requirement_evidence(tenant_id, requirement_revision_id, evidence_version_id) values
    (v_tenant, 'c5830000-0000-0000-0000-000000000001', 'c5850000-0000-0000-0000-000000000001');
  v_answer := public.ensure_program_posture_snapshots(array[v_program]);
  if v_answer->'taken' <> '[]'::jsonb or pg_temp.snapshot_counts(v_program) is distinct from v_totals then
    raise exception 'The command counted a day again: %', v_answer;
  end if;
end $$;

-- The job counts the day again, with no identity: an upsert, never a second row. Over every
-- program at once, a program's day is counted as program_control_status counts it, which itself
-- refuses a caller with no identity.
reset role;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$select public.program_control_status('c5810000-0000-0000-0000-000000000001')$$, '42501');
do $$
declare v_program uuid := nullif(current_setting('test.program', true), '')::uuid; v_before timestamptz; v_taken integer;
begin
  if v_program is null then return; end if;
  select taken_at into v_before from public.program_posture_snapshots where program_id = v_program;
  if public.take_program_posture_snapshots(v_program) <> 1 then
    raise exception 'The job did not take the program''s snapshot';
  end if;
  if (select count(*) from public.program_posture_snapshots where program_id = v_program) <> 1
    or (select taken_at from public.program_posture_snapshots where program_id = v_program) <= v_before
    or pg_temp.snapshot_counts(v_program)->>'no_evidence' <> '0'
    or pg_temp.snapshot_counts(v_program)->>'not_assessed' <> '2' then
    raise exception 'A second run the same day held %', pg_temp.snapshot_counts(v_program);
  end if;
  -- Every program that records a control baseline takes its day, the bare one none.
  v_taken := public.take_program_posture_snapshots();
  if v_taken < 1 or v_taken <> (select count(*) from public.programs p
      where exists (select 1 from public.program_reference_choices c where c.program_id = p.id))
    or exists (select 1 from public.program_posture_snapshots where program_id = 'c5810000-0000-0000-0000-000000000001')
    or exists (select 1 from public.programs p
      where exists (select 1 from public.program_reference_choices c where c.program_id = p.id)
        and (select count(*) from public.program_posture_snapshots s
          where s.program_id = p.id and s.taken_on = (clock_timestamp() at time zone 'utc')::date) <> 1) then
    raise exception 'The job over every program took %', v_taken;
  end if;
  -- Two earlier days, as the job would have left them, so the read's order and its first day show.
  insert into public.program_posture_snapshots(tenant_id, program_id, taken_on, taken_at, controls,
    no_requirement, no_evidence, not_assessed, other_than_satisfied, partially_satisfied, satisfied)
  select s.tenant_id, s.program_id, s.taken_on - d.back, s.taken_at - make_interval(days => d.back),
    s.controls, s.controls, 0, 0, 0, 0, 0
  from public.program_posture_snapshots s cross join (values (1), (2)) d(back)
  where s.program_id = v_program;
end $$;
select set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$
declare v_program uuid := nullif(current_setting('test.program', true), '')::uuid; v_today date := (clock_timestamp() at time zone 'utc')::date;
begin
  if v_program is null then return; end if;
  -- The trend reads a program's days in order, and from a day on when one is given.
  if array(select t.taken_on from public.program_posture_trend(array[v_program, 'c5810000-0000-0000-0000-000000000001'::uuid]) t)
      <> array[v_today - 2, v_today - 1, v_today]
    or array(select t.taken_on from public.program_posture_trend(array[v_program], v_today - 1) t) <> array[v_today - 1, v_today] then
    raise exception 'The trend read the days as %', array(select t.taken_on from public.program_posture_trend(array[v_program]) t);
  end if;
end $$;
-- The earlier days go again, so the checks after read today's alone.
reset role;
delete from public.program_posture_snapshots
where program_id = nullif(current_setting('test.program', true), '')::uuid
  and taken_on < (clock_timestamp() at time zone 'utc')::date;
select set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$
declare v_program uuid := nullif(current_setting('test.program', true), '')::uuid;
begin
  if v_program is null then return; end if;
  if pg_temp.snapshot_counts(v_program) is distinct from public.program_control_status(v_program)->'totals' then
    raise exception 'The job''s count % is not program_control_status''s %', pg_temp.snapshot_counts(v_program),
      public.program_control_status(v_program)->'totals';
  end if;
end $$;

-- A member never writes a snapshot directly.
select pg_temp.expect_error(format($$insert into public.program_posture_snapshots(tenant_id, program_id, taken_on, controls, no_requirement, no_evidence, not_assessed, other_than_satisfied, partially_satisfied, satisfied)
  values (%L, 'c5810000-0000-0000-0000-000000000001', current_date - 1, 1, 1, 0, 0, 0, 0, 0)$$, current_setting('test.tenant')), '42501');
select pg_temp.expect_error($$update public.program_posture_snapshots set satisfied = satisfied$$, '42501');
select pg_temp.expect_error($$delete from public.program_posture_snapshots$$, '42501');

-- The tenant boundary: another workspace's member sees none of them, and is refused the read.
select set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000002', true);
do $$
begin
  if exists (select 1 from public.program_posture_snapshots) then
    raise exception 'Another workspace''s member read a snapshot';
  end if;
  if nullif(current_setting('test.program', true), '') is not null then
    perform pg_temp.expect_error(format('select * from public.program_posture_trend(array[%L::uuid])', current_setting('test.program')), '42501');
  end if;
end $$;

-- A viewer of the workspace reads the trend, and asking for today's snapshot takes nothing more.
select set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000001', true);
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'c5800000-0000-0000-0000-000000000003', 'viewer');
select set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000003', true);
do $$
declare v_program uuid := nullif(current_setting('test.program', true), '')::uuid;
begin
  if v_program is null then return; end if;
  if (select count(*) from public.program_posture_trend(array[v_program])) <> 1
    or (select count(*) from public.program_posture_snapshots where tenant_id = current_setting('test.tenant')::uuid) <> 1
    or public.ensure_program_posture_snapshots(array[v_program])->'taken' <> '[]'::jsonb then
    raise exception 'A viewer did not read the workspace''s trend';
  end if;
end $$;
select pg_temp.expect_error($$delete from public.program_posture_snapshots$$, '42501');
select set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000001', true);

-- ---------------------------------------------------------------------------------------------
-- A product variant, judged by its product: the job reads the variant's delta with no identity,
-- which variant_control_delta itself would refuse, and counts the control the product satisfies.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid := nullif(current_setting('test.catalog', true), '')::uuid;
  v_base uuid := nullif(current_setting('test.base', true), '')::uuid;
  v_control uuid; v_definition uuid := gen_random_uuid(); v_library uuid := gen_random_uuid();
  v_unit uuid := gen_random_uuid(); v_product uuid := gen_random_uuid(); v_revision uuid := gen_random_uuid();
  v_core uuid := gen_random_uuid(); v_config uuid := gen_random_uuid(); v_assessment uuid := gen_random_uuid();
  v_profile uuid := gen_random_uuid(); v_created jsonb; v_program uuid;
begin
  if v_base is null then return; end if;
  select sc.control_id into v_control
  from public.selected_controls sc join public.catalog_control_rows k on k.id = sc.control_id
  where sc.profile_resolution_id = v_base order by k.code_order limit 1;
  insert into public.component_definitions(id, tenant_id, code, name) values (v_definition, v_tenant, 'ps-units', 'Posture snapshot units');
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values (v_library, v_tenant, v_definition, 1);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values
    (v_unit, v_tenant, v_library, 'Posture unit', 'software');
  insert into public.defined_component_implementations(tenant_id, component_definition_revision_id, defined_component_id, control_id, description, implementation_status, coverage)
    values (v_tenant, v_library, v_unit, v_control, 'The unit enforces it.', 'implemented', 'full');
  update public.component_definition_revisions set state = 'published', revision = revision + 1 where id = v_library;
  insert into public.products(id, tenant_id, code, name) values (v_product, v_tenant, 'PS-P', 'Posture snapshot product');
  insert into public.product_revisions(id, tenant_id, product_id, version_number) values (v_revision, v_tenant, v_product, 1);
  insert into public.product_elements(id, tenant_id, product_revision_id, code, name, element_type, defined_component_id, position)
    values (v_core, v_tenant, v_revision, 'CORE', 'Posture core', 'software', v_unit, 0);
  insert into public.product_configurations(id, tenant_id, product_id, code, name) values (v_config, v_tenant, v_product, 'S', 'Standard');
  insert into public.product_configuration_elements(tenant_id, product_revision_id, product_configuration_id, product_element_id)
    values (v_tenant, v_revision, v_config, v_core);
  update public.product_revisions set state = 'published', revision = revision + 1 where id = v_revision;
  v_created := public.create_program_wizard(v_tenant, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', 'PS-VARIANT', 'name', 'Posture snapshot variant test', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb,
    'catalogRevisionId', v_catalog,
    'profiles', jsonb_build_array(jsonb_build_object(
      'key', v_profile, 'baseResolutionId', v_base, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)),
    'systems', jsonb_build_array(jsonb_build_object(
      'key', gen_random_uuid(), 'code', 'PSV-P', 'name', 'PSV-P variant', 'description', '',
      'type', 'platform', 'ownerPartyId', null,
      'confidentiality', 'low', 'integrity', 'low', 'availability', 'low',
      'categorizationRationale', 'A limited impact boundary for a rollback test.',
      'profileKey', v_profile,
      'product', jsonb_build_object('revisionId', v_revision, 'configurationId', v_config),
      'elements', jsonb_build_array(jsonb_build_object('key', gen_random_uuid(), 'parentKey', null,
        'code', 'PSV-P-CORE', 'name', 'Posture core', 'description', '', 'type', null, 'productElementId', v_core,
        'library', jsonb_build_object('revisionId', v_library, 'definedComponentId', v_unit, 'rationale', 'Inherited from the product.')))))));
  v_program := (v_created->>'programId')::uuid;
  insert into public.product_assessments(id, tenant_id, product_revision_id, profile_resolution_id, title)
    values (v_assessment, v_tenant, v_revision, v_base, 'Posture product assessment');
  insert into public.product_determinations(tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination)
    values (v_tenant, v_assessment, v_revision, v_core, v_control, 'satisfied');
  update public.product_assessments set state = 'published', revision = revision + 1 where id = v_assessment;
  if (select l->>'determined_by' from jsonb_array_elements(public.program_control_status(v_program)->'controls') l
      where l->>'id' = v_control::text) is distinct from 'product' then
    raise exception 'The variant does not inherit the product''s determination';
  end if;
  perform set_config('test.variant_program', v_program::text, true);
end $$;
reset role;
select set_config('request.jwt.claim.sub', '', true);
do $$
declare v_program uuid := nullif(current_setting('test.variant_program', true), '')::uuid;
begin
  if v_program is null then return; end if;
  perform pg_temp.expect_error(format('select public.variant_control_delta(%L, s.id) from public.systems s where s.program_id = %L',
    current_setting('test.tenant'), v_program), '42501');
  if public.take_program_posture_snapshots(v_program) <> 1 or pg_temp.snapshot_counts(v_program)->>'satisfied' <> '1' then
    raise exception 'The job counted the variant as %', pg_temp.snapshot_counts(v_program);
  end if;
end $$;
select set_config('request.jwt.claim.sub', 'c5800000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$
declare v_program uuid := nullif(current_setting('test.variant_program', true), '')::uuid;
begin
  if v_program is null then return; end if;
  if pg_temp.snapshot_counts(v_program) is distinct from public.program_control_status(v_program)->'totals' then
    raise exception 'The variant''s snapshot % is not program_control_status''s %', pg_temp.snapshot_counts(v_program),
      public.program_control_status(v_program)->'totals';
  end if;
  raise notice 'The checks of programs with a baseline ran against the pinned references';
end $$;

reset role;
rollback;
select 'Posture snapshots: privileges, the daily job, refusal, a program with no baseline, what a snapshot holds, a second run the same day, the job with no identity over every program and a product variant, the tenant boundary and a viewer''s read passed.' as result;
