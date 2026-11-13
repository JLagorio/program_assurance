-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Customer requirements: the command that imports a source document's requirements (what it
-- writes and passes over, a request sent again, what it refuses and from whom), what a requirement
-- may say of its source, the program's answer to a requirement, and the read that gives a document
-- back as a compliance matrix with what meets each requirement.
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

do $$
declare v_function text;
begin
  foreach v_function in array array[
    'public.import_customer_requirements(uuid, uuid, uuid, jsonb, jsonb)',
    'public.requirement_source_compliance(uuid, uuid)'] loop
    if has_function_privilege('anon', v_function, 'execute') or has_function_privilege('public', v_function, 'execute') then
      raise exception 'An anonymous session may execute %', v_function;
    end if;
    if not has_function_privilege('authenticated', v_function, 'execute') then
      raise exception 'A signed-in session may not execute %', v_function;
    end if;
  end loop;
  if (select p.prosecdef from pg_catalog.pg_proc p where p.oid = 'public.requirement_source_compliance(uuid, uuid)'::regprocedure) then
    raise exception 'requirement_source_compliance does not run as its caller';
  end if;
  if has_table_privilege('authenticated', 'public.requirement_import_requests', 'insert')
    or has_table_privilege('anon', 'public.requirement_sources', 'select') then
    raise exception 'A session may write an import receipt, or an anonymous one read a source';
  end if;
end $$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('c4e00000-0000-0000-0000-000000000001', 'customer-requirements-owner@example.test', '{"name":"Customer requirements test owner"}'),
  ('c4e00000-0000-0000-0000-000000000002', 'customer-requirements-outsider@example.test', '{}');
select set_config('request.jwt.claim.sub', 'c4e00000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.programs(id, tenant_id, code, name) values
  ('c4e10000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'CR-ONE', 'Customer requirements test program'),
  ('c4e10000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'CR-TWO', 'Another program of the workspace');

create function pg_temp.import(request uuid, requirements jsonb, source jsonb default null) returns jsonb language sql as $$
  select public.import_customer_requirements(current_setting('test.tenant')::uuid, 'c4e10000-0000-0000-0000-000000000001', request,
    coalesce(source, '{"code": "CUS-SRD", "title": "Customer security requirements", "versionLabel": "Rev C", "receivedOn": "2026-07-15"}'::jsonb),
    requirements);
$$;
grant execute on function pg_temp.import(uuid, jsonb, jsonb) to authenticated;

-- What an import needs before it writes anything.
select pg_temp.expect_error($$select pg_temp.import(gen_random_uuid(), '[]')$$, '22023');
select pg_temp.expect_error($$select pg_temp.import(gen_random_uuid(), '[{"reference": "3.1", "statement": "It shall."}]', '{"title": "No code"}')$$, '22023');
select pg_temp.expect_error($$select pg_temp.import(gen_random_uuid(), '[{"reference": " ", "statement": "It shall."}]')$$, '22023');
select pg_temp.expect_error($$select pg_temp.import(gen_random_uuid(), '[{"reference": "3.1", "statement": ""}]')$$, '22023');
select pg_temp.expect_error($$select pg_temp.import(gen_random_uuid(), '[{"reference": "3.1", "statement": "It shall."}, {"reference": "3.1 ", "statement": "It shall again."}]')$$, '22023');
select pg_temp.expect_error($$select pg_temp.import(gen_random_uuid(), '[{"reference": "3.1", "statement": "It shall.", "type": "wish"}]')$$, '22023');
select pg_temp.expect_error($$select public.import_customer_requirements(current_setting('test.tenant')::uuid, gen_random_uuid(), gen_random_uuid(),
  '{"code": "X", "title": "X"}', '[{"reference": "1", "statement": "It shall."}]')$$, 'P0002');
do $$ begin
  if exists (select 1 from public.requirement_sources) or exists (select 1 from public.engineering_requirements) then
    raise exception 'A refused import wrote something';
  end if;
end $$;

do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_program uuid := 'c4e10000-0000-0000-0000-000000000001';
  v_first uuid := gen_random_uuid(); v_second uuid := gen_random_uuid();
  v_three jsonb := '[
    {"reference": "3.1", "title": "Maintenance access", "statement": "The system shall limit maintenance access.", "acceptanceCriteria": "Shown at acceptance."},
    {"reference": "3.2", "statement": "The system shall encrypt its datalink."},
    {"reference": "3.10", "statement": "The system shall record maintenance sessions.", "type": "operational"}]';
  v_result jsonb; v_again jsonb; v_source uuid; v_count integer;
  v_r1 uuid; v_r2 uuid; v_r3 uuid; v_r4 uuid; v_rev1 uuid; v_rev2 uuid; v_rev3 uuid;
  v_boundary uuid := gen_random_uuid(); v_inherited uuid := gen_random_uuid(); v_modified uuid := gen_random_uuid(); v_own uuid := gen_random_uuid();
  v_product uuid := gen_random_uuid(); v_revision uuid := gen_random_uuid(); v_element_a uuid := gen_random_uuid(); v_element_b uuid := gen_random_uuid();
  v_control uuid; v_answer jsonb; v_totals jsonb; v_line jsonb;
begin
  -- A first import makes the document and its requirements, each with what the document says of it.
  v_result := pg_temp.import(v_first, v_three);
  v_source := (v_result->>'sourceId')::uuid;
  if not (v_result->>'sourceCreated')::boolean or (v_result->>'created')::integer <> 3 or (v_result->>'skipped')::integer <> 0
    or jsonb_array_length(v_result->'requirementIds') <> 3 then
    raise exception 'A first import answered %', v_result;
  end if;
  select q.id, v.id into v_r1, v_rev1 from public.engineering_requirements q join public.requirement_revisions v on v.engineering_requirement_id = q.id
    where q.source_id = v_source and q.source_reference = '3.1';
  select q.id, v.id into v_r2, v_rev2 from public.engineering_requirements q join public.requirement_revisions v on v.engineering_requirement_id = q.id
    where q.source_id = v_source and q.source_reference = '3.2';
  select q.id, v.id into v_r3, v_rev3 from public.engineering_requirements q join public.requirement_revisions v on v.engineering_requirement_id = q.id
    where q.source_id = v_source and q.source_reference = '3.10';
  if not exists (select 1 from public.engineering_requirements q join public.requirement_revisions v on v.engineering_requirement_id = q.id
      where q.id = v_r1 and q.code = 'CUS-SRD-3.1' and v.title = 'Maintenance access' and v.acceptance_criteria = 'Shown at acceptance.' and v.requirement_type = 'security')
    or not exists (select 1 from public.requirement_revisions v where v.id = v_rev2
      and v.title = 'The system shall encrypt its datalink.' and v.acceptance_criteria = 'Not stated in the source document.')
    or not exists (select 1 from public.requirement_revisions v where v.id = v_rev3 and v.requirement_type = 'operational')
    or not exists (select 1 from public.requirement_sources s where s.id = v_source and s.version_label = 'Rev C' and s.received_on = date '2026-07-15') then
    raise exception 'The imported requirements do not hold what the document said';
  end if;

  -- The same request again answers what it answered and writes nothing; with other details it is refused.
  v_again := pg_temp.import(v_first, v_three);
  select count(*) into v_count from public.engineering_requirements where source_id = v_source;
  if v_again <> v_result or v_count <> 3 then
    raise exception 'The same request again answered % and left % requirements', v_again, v_count;
  end if;
  perform pg_temp.expect_error(format($q$select pg_temp.import(%L, '[{"reference": "9.9", "statement": "Something else."}]')$q$, v_first), 'PT409');

  -- A later import of the same document adds only the paragraphs that are not there yet.
  v_result := pg_temp.import(v_second, '[{"reference": "3.2", "statement": "Reworded, and passed over."}, {"reference": "4.1", "statement": "The system shall report incidents."}]');
  if (v_result->>'sourceCreated')::boolean or (v_result->>'created')::integer <> 1 or (v_result->>'skipped')::integer <> 1
    or (v_result->>'sourceId')::uuid <> v_source then
    raise exception 'A later import answered %', v_result;
  end if;
  select q.id into v_r4 from public.engineering_requirements q where q.source_id = v_source and q.source_reference = '4.1';
  if exists (select 1 from public.requirement_revisions v where v.id = v_rev2 and v.statement like 'Reworded%') then
    raise exception 'A paragraph already imported was overwritten';
  end if;

  -- A code another requirement holds stops the whole import.
  perform pg_temp.expect_error($q$select pg_temp.import(gen_random_uuid(), '[{"reference": "5.1", "statement": "A new one."}, {"reference": "5.2", "code": "CUS-SRD-3.1", "statement": "A clash."}]')$q$, '23505');
  select count(*) into v_count from public.engineering_requirements where source_id = v_source;
  if v_count <> 4 then raise exception 'A refused import left % requirements', v_count; end if;

  -- What a requirement may say of its source: one paragraph once, a reference only with its
  -- document, and a document of its own program.
  perform pg_temp.expect_error(format($q$insert into public.engineering_requirements(tenant_id, program_id, code, source_id, source_reference) values (%L, %L, 'CR-DUP', %L, '3.1')$q$, v_tenant, v_program, v_source), '23505');
  perform pg_temp.expect_error(format($q$insert into public.engineering_requirements(tenant_id, program_id, code, source_reference) values (%L, %L, 'CR-LOOSE', '7.7')$q$, v_tenant, v_program), '23514');
  perform pg_temp.expect_error(format($q$insert into public.engineering_requirements(tenant_id, program_id, code, source_id) values (%L, 'c4e10000-0000-0000-0000-000000000002', 'CR-ELSEWHERE', %L)$q$, v_tenant, v_source), '23503');

  -- The program's answer: one a requirement, in the product's words.
  insert into public.requirement_compliance(tenant_id, engineering_requirement_id, status, verification_method, statement) values
    (v_tenant, v_r1, 'compliant', 'similarity', 'Met by the product as assessed.'),
    (v_tenant, v_r2, 'partially_compliant', 'test', 'The changed module is to be tested.'),
    (v_tenant, v_r4, 'not_applicable', null, 'Outside the delivered system.');
  perform pg_temp.expect_error(format($q$insert into public.requirement_compliance(tenant_id, engineering_requirement_id, status) values (%L, %L, 'compliant')$q$, v_tenant, v_r1), '23505');
  perform pg_temp.expect_error(format($q$insert into public.requirement_compliance(tenant_id, engineering_requirement_id, status) values (%L, %L, 'mostly')$q$, v_tenant, v_r3), '23514');
  perform pg_temp.expect_error(format($q$insert into public.requirement_compliance(tenant_id, engineering_requirement_id, status, verification_method) values (%L, %L, 'compliant', 'hope')$q$, v_tenant, v_r3), '23514');

  -- A system with an element as a product delivers it, one the program modified and one of its own.
  insert into public.systems(id, tenant_id, program_id, code, name, system_type) values (v_boundary, v_tenant, v_program, 'CR-SYS', 'Test variant', 'platform');
  insert into public.systems(id, tenant_id, program_id, parent_system_id, is_authorization_boundary, code, name, system_type) values
    (v_inherited, v_tenant, v_program, v_boundary, false, 'CR-INH', 'Inherited element', 'hardware'),
    (v_modified, v_tenant, v_program, v_boundary, false, 'CR-MOD', 'Modified element', 'software'),
    (v_own, v_tenant, v_program, v_boundary, false, 'CR-OWN', 'Own element', 'hardware');
  insert into public.products(id, tenant_id, code, name) values (v_product, v_tenant, 'CR-P', 'Test product');
  insert into public.product_revisions(id, tenant_id, product_id, version_number) values (v_revision, v_tenant, v_product, 1);
  insert into public.product_elements(id, tenant_id, product_revision_id, code, name, element_type, position) values
    (v_element_a, v_tenant, v_revision, 'A', 'Element A', 'hardware', 0), (v_element_b, v_tenant, v_revision, 'B', 'Element B', 'software', 1);
  -- Lineage and a declared change are the commands' to write; the test writes them as the owner of the schema.
  reset role;
  update public.systems set product_revision_id = v_revision, product_element_id = v_element_a, revision = revision + 1 where id = v_inherited;
  update public.systems set product_revision_id = v_revision, product_element_id = v_element_b,
    product_change_kinds = array['software'], product_change_rationale = 'Customer data built in.', product_changed_at = now(),
    revision = revision + 1 where id = v_modified;
  set local role authenticated;

  insert into public.requirement_allocations(tenant_id, requirement_revision_id, system_id) values
    (v_tenant, v_rev1, v_inherited),
    (v_tenant, v_rev2, v_inherited), (v_tenant, v_rev2, v_modified),
    (v_tenant, v_rev3, v_inherited), (v_tenant, v_rev3, v_own);
  select k.id into v_control from public.controls k where k.status = 'active' limit 1;
  if v_control is not null then
    insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type)
      values (v_tenant, v_rev1, v_control, 'maps_to');
  end if;

  -- The document as a matrix: each requirement in the document's order, with what meets it.
  v_answer := public.requirement_source_compliance(v_tenant, v_source);
  v_totals := v_answer->'totals';
  if v_answer->'source'->>'code' <> 'CUS-SRD' or v_answer->'source'->>'version_label' <> 'Rev C'
    or (select jsonb_agg(r->>'reference') from jsonb_array_elements(v_answer->'requirements') r) <> '["3.1", "3.2", "3.10", "4.1"]'::jsonb then
    raise exception 'The matrix is not the document in its order: %', (select jsonb_agg(r->>'reference') from jsonb_array_elements(v_answer->'requirements') r);
  end if;
  if v_totals - 'met_by' <> '{"requirements": 4, "compliant": 1, "partially_compliant": 1, "non_compliant": 0, "not_applicable": 1, "unanswered": 1}'::jsonb
    or v_totals->'met_by' <> '{"product": 1, "variant_change": 1, "program": 1, "unallocated": 1}'::jsonb then
    raise exception 'The matrix totals read %', v_totals;
  end if;
  v_line := v_answer->'requirements'->0;
  if v_line->>'met_by' <> 'product' or v_line->>'status' <> 'compliant' or v_line->>'verification_method' <> 'similarity'
    or (v_line->>'controls')::integer <> (case when v_control is null then 0 else 1 end) or (v_line->>'evidence')::integer <> 0
    or v_line->'elements'->0->>'standing' <> 'inherited' then
    raise exception 'A requirement the product meets read %', v_line;
  end if;
  v_line := v_answer->'requirements'->1;
  if v_line->>'met_by' <> 'variant_change' or jsonb_array_length(v_line->'elements') <> 2
    or not exists (select 1 from jsonb_array_elements(v_line->'elements') e where e->>'standing' = 'modified' and (e->>'system_id')::uuid = v_modified) then
    raise exception 'A requirement a changed element meets read %', v_line;
  end if;
  v_line := v_answer->'requirements'->2;
  if v_line->>'met_by' <> 'program' or v_line->'status' <> 'null'::jsonb then
    raise exception 'An unanswered requirement on the program''s own element read %', v_line;
  end if;
  v_line := v_answer->'requirements'->3;
  if v_line->>'met_by' <> 'unallocated' or v_line->>'status' <> 'not_applicable' or v_line->'elements' <> '[]'::jsonb then
    raise exception 'A requirement allocated nowhere read %', v_line;
  end if;

  perform set_config('test.source', v_source::text, true);
end $$;

-- Another workspace reads nothing and imports nothing; a session with no account is refused.
-- A document that names elements allocates what it imports: by code in the program, whatever the
-- case, each element once. A code the program does not hold stops the whole import.
do $$
declare
  v_result jsonb; v_source uuid;
  v_icd jsonb := '{"code": "CUS-ICD", "title": "Customer interface control document"}';
begin
  perform pg_temp.expect_error(format($q$select pg_temp.import(gen_random_uuid(),
    '[{"reference": "5.1", "statement": "It shall.", "elements": ["CR-INH"]}, {"reference": "5.2", "statement": "It shall too.", "elements": ["CR-GONE"]}]', %L)$q$, v_icd), '22023');
  if exists (select 1 from public.requirement_sources where code = 'CUS-ICD') then
    raise exception 'An import that names an unknown element wrote something';
  end if;
  v_result := pg_temp.import(gen_random_uuid(),
    '[{"reference": "5.1", "statement": "It shall.", "elements": ["cr-inh", "CR-OWN", "CR-INH", " "]}, {"reference": "5.2", "statement": "It shall too."}]', v_icd);
  v_source := (v_result->>'sourceId')::uuid;
  if (v_result->>'created')::integer <> 2 or (v_result->>'allocated')::integer <> 2
    or (select count(*) from public.requirement_allocations a
      join public.requirement_revisions v on v.id = a.requirement_revision_id
      join public.engineering_requirements q on q.id = v.engineering_requirement_id
      join public.systems s on s.id = a.system_id
      where q.source_id = v_source and q.source_reference = '5.1' and s.code in ('CR-INH', 'CR-OWN')) <> 2
    or exists (select 1 from public.requirement_allocations a
      join public.requirement_revisions v on v.id = a.requirement_revision_id
      join public.engineering_requirements q on q.id = v.engineering_requirement_id
      where q.source_id = v_source and q.source_reference = '5.2') then
    raise exception 'An import that names elements answered %', v_result;
  end if;
  -- The matrix reads them at once: one requirement met by its allocation, one not allocated.
  if (public.requirement_source_compliance(current_setting('test.tenant')::uuid, v_source)->'totals'->'met_by'->>'unallocated')::integer <> 1 then
    raise exception 'The matrix does not read the imported allocations';
  end if;
end $$;

select set_config('request.jwt.claim.sub', 'c4e00000-0000-0000-0000-000000000002', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
do $$ begin
  if exists (select 1 from public.requirement_sources) or exists (select 1 from public.requirement_compliance)
    or exists (select 1 from public.requirement_import_requests) then
    raise exception 'Another workspace reads a document, an answer or a receipt';
  end if;
  perform pg_temp.expect_error(format($q$select public.requirement_source_compliance(%L, %L)$q$, current_setting('test.tenant'), current_setting('test.source')), '42501');
  perform pg_temp.expect_error(format($q$select public.requirement_source_compliance(%L, %L)$q$, current_setting('test.other_tenant'), current_setting('test.source')), '42501');
  perform pg_temp.expect_error($q$select pg_temp.import(gen_random_uuid(), '[{"reference": "8.1", "statement": "Not mine."}]')$q$, '42501');
  perform pg_temp.expect_error(format($q$select public.import_customer_requirements(%L, 'c4e10000-0000-0000-0000-000000000001', gen_random_uuid(), '{"code": "X", "title": "X"}', '[{"reference": "1", "statement": "It shall."}]')$q$, current_setting('test.other_tenant')), 'P0002');
  perform set_config('request.jwt.claim.sub', '', true);
  perform pg_temp.expect_error(format($q$select public.requirement_source_compliance(%L, %L)$q$, current_setting('test.tenant'), current_setting('test.source')), '42501');
end $$;

rollback;
