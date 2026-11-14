-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Product assurance: who may read and write a business line and a product assessment, what an
-- assessment may judge, the command that records what a program changed in an inherited element,
-- and the two reads. With the pinned references installed (a catalog and a reference baseline), a
-- product with two configurations is assessed and read by configuration, and two variants of it
-- are read for their delta: inherited, shared, changed here and program only, an element modified,
-- withdrawn and removed, and a newer product version: offered, read for what taking it would
-- change, and taken.
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
-- Who may ask and who may write.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_function text;
begin
  foreach v_function in array array[
    'public.product_control_status(uuid, uuid)', 'public.variant_control_delta(uuid, uuid)',
    'public.declare_product_element_change(uuid, uuid, bigint, text[], text)',
    'public.plan_delta_assessment(uuid, uuid, uuid, text)',
    'public.variant_version_changes(uuid, uuid, uuid)',
    'public.take_product_version(uuid, uuid, bigint, uuid, uuid)',
    'public.product_assessment_sheet(uuid, uuid)',
    'public.record_product_determinations(uuid, uuid, uuid, uuid[], text, text)'] loop
    if has_function_privilege('anon', v_function, 'execute') or has_function_privilege('public', v_function, 'execute') then
      raise exception 'An anonymous session may execute %', v_function;
    end if;
    if not has_function_privilege('authenticated', v_function, 'execute') then
      raise exception 'A signed-in session may not execute %', v_function;
    end if;
  end loop;
  if (select p.prosecdef from pg_catalog.pg_proc p where p.oid = 'public.product_control_status(uuid, uuid)'::regprocedure)
    or (select p.prosecdef from pg_catalog.pg_proc p where p.oid = 'public.variant_control_delta(uuid, uuid)'::regprocedure)
    or (select p.prosecdef from pg_catalog.pg_proc p where p.oid = 'public.variant_version_changes(uuid, uuid, uuid)'::regprocedure) then
    raise exception 'A product assurance read does not run as its caller';
  end if;
  if has_table_privilege('anon', 'public.business_lines', 'select')
    or has_table_privilege('anon', 'public.product_assessments', 'select')
    or has_table_privilege('anon', 'public.product_determinations', 'select') then
    raise exception 'An anonymous session may read product assurance records';
  end if;
end $$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('9a550000-0000-0000-0000-000000000001', 'product-assurance-owner@example.test', '{"name":"Product assurance test owner"}'),
  ('9a550000-0000-0000-0000-000000000002', 'product-assurance-outsider@example.test', '{}');
select set_config('request.jwt.claim.sub', '9a550000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);

-- A business line holds products and programs of its own workspace only.
insert into public.business_lines(id, tenant_id, code, name) values
  ('9a551000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'AD', 'Air Defense');
insert into public.products(id, tenant_id, code, name, business_line_id) values
  ('9a552000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'PA-X', 'Product assurance test product',
   '9a551000-0000-0000-0000-000000000001');
select pg_temp.expect_error($$insert into public.business_lines(tenant_id, code, name)
  values (current_setting('test.tenant')::uuid, 'AD', 'A second Air Defense')$$, '23505');
select set_config('request.jwt.claim.sub', '9a550000-0000-0000-0000-000000000002', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
do $$ begin
  if exists (select 1 from public.business_lines) then
    raise exception 'Another workspace reads a business line';
  end if;
end $$;
select pg_temp.expect_error($$insert into public.products(tenant_id, code, name, business_line_id)
  values (current_setting('test.other_tenant')::uuid, 'PA-Y', 'Another workspace''s product', '9a551000-0000-0000-0000-000000000001')$$, '23503');
select pg_temp.expect_error($$select public.product_control_status(current_setting('test.tenant')::uuid, '9a553000-0000-0000-0000-000000000001')$$, '42501');
select set_config('request.jwt.claim.sub', '9a550000-0000-0000-0000-000000000001', true);

-- ---------------------------------------------------------------------------------------------
-- With the pinned references installed.
-- ---------------------------------------------------------------------------------------------
create function pg_temp.line(answer jsonb, control uuid) returns jsonb language sql stable as $$
  select c from jsonb_array_elements(answer->'controls') c where c->>'id' = control::text;
$$;
-- A program with one system created from a configuration of the test product. `elements` is a
-- list of [code, product element id or null, library pin or null].
create function pg_temp.variant(p_code text, catalog uuid, base uuid, product jsonb, elements jsonb) returns uuid
language plpgsql as $$
declare created jsonb; profile uuid := gen_random_uuid();
begin
  created := public.create_program_wizard(current_setting('test.tenant')::uuid, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', p_code, 'name', p_code || ' product assurance test', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb,
    'catalogRevisionId', catalog,
    'profiles', jsonb_build_array(jsonb_build_object(
      'key', profile, 'baseResolutionId', base, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)),
    'systems', jsonb_build_array(jsonb_build_object(
      'key', gen_random_uuid(), 'code', p_code || '-SYS', 'name', p_code || ' variant', 'description', '',
      'type', 'platform', 'ownerPartyId', null,
      'confidentiality', 'low', 'integrity', 'low', 'availability', 'low',
      'categorizationRationale', 'A limited impact boundary for a rollback test.',
      'profileKey', profile, 'product', product,
      'elements', (select coalesce(jsonb_agg(jsonb_build_object(
        'key', gen_random_uuid(), 'parentKey', null, 'code', p_code || '-' || (e->>0), 'name', e->>0, 'description', '',
        'type', case when e->>1 is null then 'hardware' else null end,
        'library', case when e->2 = 'null'::jsonb then null else e->2 end,
        'productElementId', e->>1)), '[]'::jsonb) from jsonb_array_elements(elements) e)))));
  return (select s.id from public.systems s where s.tenant_id = current_setting('test.tenant')::uuid and s.code = p_code || '-SYS');
end;
$$;
grant execute on function pg_temp.line(jsonb, uuid), pg_temp.variant(text, uuid, uuid, jsonb, jsonb) to authenticated;

do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_product uuid := '9a552000-0000-0000-0000-000000000001';
  v_catalog uuid; v_base uuid; v_controls uuid[]; v_outside uuid;
  v_a uuid; v_b uuid; v_c uuid; v_d uuid; v_e uuid;
  v_definition uuid := gen_random_uuid(); v_library uuid := gen_random_uuid();
  v_core_unit uuid := gen_random_uuid(); v_kit_unit uuid := gen_random_uuid();
  v_revision uuid := gen_random_uuid();
  v_core uuid := gen_random_uuid(); v_kit uuid := gen_random_uuid(); v_plain uuid := gen_random_uuid();
  v_config_a uuid := gen_random_uuid(); v_config_b uuid := gen_random_uuid();
  v_assessment uuid := gen_random_uuid(); v_determination uuid := gen_random_uuid(); v_draft uuid := gen_random_uuid();
  v_selected integer; v_answer jsonb; v_totals jsonb; v_line jsonb; v_result jsonb;
  v_pin_core jsonb; v_pin_kit jsonb; v_lineage jsonb;
  v_variant uuid; v_pruned uuid; v_plain_system uuid; v_core_system public.systems; v_added_system uuid;
  v_next uuid; v_request uuid := gen_random_uuid(); v_plan jsonb; v_owed integer;
  v_third uuid; v_new uuid := gen_random_uuid(); v_new_sub uuid := gen_random_uuid(); v_kit_ext uuid := gen_random_uuid();
  v_core3 uuid; v_kit3 uuid; v_other_product uuid := gen_random_uuid(); v_other_revision uuid := gen_random_uuid();
  v_boundary public.systems; v_take uuid := gen_random_uuid(); v_count integer; v_new_system uuid;
begin
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) >= 5
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the checks of an assessed product were skipped';
    return;
  end if;
  select array_agg(x.control_id order by x.ordinal, x.control_id) into v_controls
  from (select sc.control_id, sc.ordinal from public.selected_controls sc
    where sc.profile_resolution_id = v_base order by sc.ordinal, sc.control_id limit 5) x;
  v_a := v_controls[1]; v_b := v_controls[2]; v_c := v_controls[3]; v_d := v_controls[4]; v_e := v_controls[5];
  select count(*) into v_selected from public.selected_controls sc where sc.profile_resolution_id = v_base;
  select k.id into v_outside from public.controls k
  where k.catalog_revision_id = v_catalog
    and not exists (select 1 from public.selected_controls sc where sc.profile_resolution_id = v_base and sc.control_id = k.id)
  limit 1;

  -- The library behind the product: a core unit that claims A in full and B in part, with what its
  -- consumer still owes, and a kit unit that claims C.
  insert into public.component_definitions(id, tenant_id, code, name) values (v_definition, v_tenant, 'pa-units', 'Product assurance units');
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values (v_library, v_tenant, v_definition, 1);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values
    (v_core_unit, v_tenant, v_library, 'Core unit', 'software'),
    (v_kit_unit, v_tenant, v_library, 'Kit unit', 'hardware');
  insert into public.defined_component_implementations(tenant_id, component_definition_revision_id, defined_component_id, control_id, description, implementation_status, coverage, consumer_responsibility) values
    (v_tenant, v_library, v_core_unit, v_a, 'The core unit enforces it.', 'implemented', 'full', null),
    (v_tenant, v_library, v_core_unit, v_b, 'The core unit provides the mechanism.', 'implemented', 'partial', 'The consumer sets the values.'),
    (v_tenant, v_library, v_kit_unit, v_c, 'The kit unit enforces it.', 'implemented', 'full', null);
  update public.component_definition_revisions set state = 'published', revision = revision + 1 where id = v_library;

  -- The product: a core element and a plain one in both configurations, a kit element in A only.
  insert into public.product_revisions(id, tenant_id, product_id, version_number) values (v_revision, v_tenant, v_product, 1);
  insert into public.product_elements(id, tenant_id, product_revision_id, code, name, element_type, defined_component_id, position) values
    (v_core, v_tenant, v_revision, 'CORE', 'Core element', 'software', v_core_unit, 0),
    (v_kit, v_tenant, v_revision, 'KIT', 'Kit element', 'hardware', v_kit_unit, 1),
    (v_plain, v_tenant, v_revision, 'PLAIN', 'Plain element', 'other', null, 2);
  insert into public.product_configurations(id, tenant_id, product_id, code, name) values
    (v_config_a, v_tenant, v_product, 'A', 'Configuration A'),
    (v_config_b, v_tenant, v_product, 'B', 'Configuration B');
  insert into public.product_configuration_elements(tenant_id, product_revision_id, product_configuration_id, product_element_id) values
    (v_tenant, v_revision, v_config_a, v_core), (v_tenant, v_revision, v_config_a, v_kit), (v_tenant, v_revision, v_config_a, v_plain),
    (v_tenant, v_revision, v_config_b, v_core), (v_tenant, v_revision, v_config_b, v_plain);

  -- An assessment judges a published version, against a published control baseline.
  perform pg_temp.expect_error(format(
    $q$insert into public.product_assessments(tenant_id, product_revision_id, profile_resolution_id, title) values (%L, %L, %L, 'Too early')$q$,
    v_tenant, v_revision, v_base), '23514');
  update public.product_revisions set state = 'published', revision = revision + 1 where id = v_revision;

  -- With nothing assessed, a product answers what its elements claim, none of it judged.
  v_answer := public.product_control_status(v_tenant, v_revision);
  if v_answer->'assessment' <> 'null'::jsonb or (v_answer->'totals'->>'controls')::integer <> 3
    or (v_answer->>'core_elements')::integer <> 2 or jsonb_array_length(v_answer->'configurations') <> 2
    or pg_temp.line(v_answer, v_a)->>'core' <> 'not_assessed'
    or pg_temp.line(v_answer, v_c)->>'core' <> 'not_covered'
    or pg_temp.line(v_answer, v_c)->'configurations'->>v_config_a::text <> 'not_assessed'
    or pg_temp.line(v_answer, v_c)->'configurations'->>v_config_b::text <> 'not_covered' then
    raise exception 'An unassessed product answered %', v_answer;
  end if;

  insert into public.product_assessments(id, tenant_id, product_revision_id, profile_resolution_id, title)
    values (v_assessment, v_tenant, v_revision, v_base, 'Product assessment');
  insert into public.product_determinations(id, tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination) values
    (v_determination, v_tenant, v_assessment, v_revision, v_core, v_a, 'satisfied'),
    (gen_random_uuid(), v_tenant, v_assessment, v_revision, v_kit, v_c, 'other_than_satisfied'),
    (gen_random_uuid(), v_tenant, v_assessment, v_revision, null, v_d, 'satisfied');
  -- One determination an element and control, and one for the product as a whole.
  perform pg_temp.expect_error(format(
    $q$insert into public.product_determinations(tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination) values (%L, %L, %L, null, %L, 'satisfied')$q$,
    v_tenant, v_assessment, v_revision, v_d), '23505');
  -- A control outside the assessment's baseline is not judged.
  if v_outside is not null then
    perform pg_temp.expect_error(format(
      $q$insert into public.product_determinations(tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination) values (%L, %L, %L, null, %L, 'satisfied')$q$,
      v_tenant, v_assessment, v_revision, v_outside), '23514');
  end if;
  -- Authoring through the command, on a second draft: one determination for many controls of one
  -- element at once, each control once; the same again changes nothing; none clears.
  insert into public.product_assessments(id, tenant_id, product_revision_id, profile_resolution_id, title)
    values (v_draft, v_tenant, v_revision, v_base, 'Draft product assessment');
  v_result := public.record_product_determinations(v_tenant, v_draft, v_core, array[v_a, v_b, v_a], 'satisfied', '  Shown in test. ');
  if (v_result->>'recorded')::integer <> 2 or (v_result->>'unchanged')::integer <> 0
    or (select count(*) from public.product_determinations d where d.product_assessment_id = v_draft
      and d.product_element_id = v_core and d.determination = 'satisfied' and d.rationale = 'Shown in test.') <> 2 then
    raise exception 'Recording two determinations answered %', v_result;
  end if;
  v_result := public.record_product_determinations(v_tenant, v_draft, v_core, array[v_a, v_b], 'satisfied', 'Shown in test.');
  if (v_result->>'recorded')::integer <> 0 or (v_result->>'unchanged')::integer <> 2 then
    raise exception 'Recording the same determinations again answered %', v_result;
  end if;
  v_result := public.record_product_determinations(v_tenant, v_draft, v_core, array[v_b], 'partially_satisfied', null);
  if (v_result->>'recorded')::integer <> 1 or not exists (select 1 from public.product_determinations d
      where d.product_assessment_id = v_draft and d.product_element_id = v_core and d.control_id = v_b
        and d.determination = 'partially_satisfied' and d.rationale is null) then
    raise exception 'Changing a determination answered %', v_result;
  end if;
  -- For the product as a whole, beside the element's own.
  v_result := public.record_product_determinations(v_tenant, v_draft, null, array[v_a], 'other_than_satisfied', null);
  if (v_result->>'recorded')::integer <> 1 then
    raise exception 'A determination on the whole product answered %', v_result;
  end if;
  -- The sheet: the baseline's controls, each element with what it has determined, every record.
  if public.product_assessment_sheet(v_tenant, gen_random_uuid()) is not null then
    raise exception 'An assessment that is not there answered a sheet';
  end if;
  v_answer := public.product_assessment_sheet(v_tenant, v_draft);
  if v_answer->'assessment'->>'state' <> 'draft'
    or jsonb_array_length(v_answer->'controls') <> (select count(*) from public.selected_controls sc where sc.profile_resolution_id = v_base)
    or jsonb_array_length(v_answer->'determinations') <> 3
    or (v_answer->>'whole_determined')::integer <> 1
    or (select (e->>'determined')::integer from jsonb_array_elements(v_answer->'elements') e where e->>'id' = v_core::text) <> 2
    or (select (e->>'determined')::integer from jsonb_array_elements(v_answer->'elements') e where e->>'id' = v_kit::text) <> 0
    or jsonb_typeof(v_answer->'claims') <> 'array' then
    raise exception 'The assessment sheet answered %', v_answer - 'controls';
  end if;
  v_result := public.record_product_determinations(v_tenant, v_draft, v_core, array[v_a, v_c], null, null);
  if (v_result->>'cleared')::integer <> 1 or exists (select 1 from public.product_determinations d
      where d.product_assessment_id = v_draft and d.product_element_id = v_core and d.control_id = v_a) then
    raise exception 'Clearing a determination answered %', v_result;
  end if;
  -- Refused, with nothing written: a word that is no determination, no control, a control outside
  -- the baseline, an element of no version of this product, and an assessment that is gone.
  perform pg_temp.expect_error(format($q$select public.record_product_determinations(%L, %L, %L, array[%L]::uuid[], 'fine', null)$q$, v_tenant, v_draft, v_core, v_a), '22023');
  perform pg_temp.expect_error(format($q$select public.record_product_determinations(%L, %L, %L, '{}'::uuid[], 'satisfied', null)$q$, v_tenant, v_draft, v_core), '22023');
  if v_outside is not null then
    perform pg_temp.expect_error(format($q$select public.record_product_determinations(%L, %L, %L, array[%L, %L]::uuid[], 'satisfied', null)$q$, v_tenant, v_draft, v_core, v_a, v_outside), '23514');
  end if;
  perform pg_temp.expect_error(format($q$select public.record_product_determinations(%L, %L, %L, array[%L]::uuid[], 'satisfied', null)$q$, v_tenant, v_draft, gen_random_uuid(), v_a), '23514');
  perform pg_temp.expect_error(format($q$select public.record_product_determinations(%L, %L, null, array[%L]::uuid[], 'satisfied', null)$q$, v_tenant, gen_random_uuid(), v_a), 'PT404');
  if (select count(*) from public.product_determinations d where d.product_assessment_id = v_draft) <> 2 then
    raise exception 'A refused record wrote something';
  end if;
  -- The second draft leaves with what it recorded, so the checks below read the first alone.
  delete from public.product_determinations where product_assessment_id = v_draft;
  delete from public.product_assessments where id = v_draft;

  -- A draft assessment decides nothing.
  if public.product_control_status(v_tenant, v_revision)->'assessment' <> 'null'::jsonb then
    raise exception 'A draft product assessment was read as the product''s standing';
  end if;
  update public.product_assessments set state = 'published', revision = revision + 1 where id = v_assessment;
  perform pg_temp.expect_error(format(
    $q$update public.product_determinations set determination = 'satisfied', revision = revision + 1 where product_assessment_id = %L$q$, v_assessment), '23514');
  -- A published assessment takes no record and no clear, and still gives its sheet.
  perform pg_temp.expect_error(format($q$select public.record_product_determinations(%L, %L, %L, array[%L]::uuid[], 'satisfied', null)$q$, v_tenant, v_assessment, v_core, v_b), '23514');
  perform pg_temp.expect_error(format($q$select public.record_product_determinations(%L, %L, %L, array[%L]::uuid[], null, null)$q$, v_tenant, v_assessment, v_core, v_a), '23514');
  if public.product_assessment_sheet(v_tenant, v_assessment)->'assessment'->>'state' <> 'published' then
    raise exception 'A published assessment gave no sheet';
  end if;
  perform set_config('test.assessment', v_assessment::text, true);

  -- Assessed: the baseline's controls, each by the core and by configuration.
  v_answer := public.product_control_status(v_tenant, v_revision);
  v_totals := v_answer->'totals';
  if (v_answer->'assessment'->>'id')::uuid <> v_assessment or (v_totals->>'controls')::integer <> v_selected
    or jsonb_array_length(v_answer->'controls') <> v_selected then
    raise exception 'An assessed product did not answer its baseline: %', v_totals;
  end if;
  v_line := pg_temp.line(v_answer, v_a);
  if v_line->>'core' <> 'satisfied' or v_line->'configurations'->>v_config_a::text <> 'satisfied'
    or v_line->'configurations'->>v_config_b::text <> 'satisfied' or (v_line->>'differs')::boolean then
    raise exception 'A control the core satisfies read %', v_line;
  end if;
  v_line := pg_temp.line(v_answer, v_b);
  if v_line->>'core' <> 'not_assessed' or v_line->'configurations'->>v_config_b::text <> 'not_assessed' then
    raise exception 'A claimed control nobody judged read %', v_line;
  end if;
  v_line := pg_temp.line(v_answer, v_c);
  if v_line->>'core' <> 'not_covered' or v_line->'configurations'->>v_config_a::text <> 'other_than_satisfied'
    or v_line->'configurations'->>v_config_b::text <> 'not_covered' or not (v_line->>'differs')::boolean then
    raise exception 'A control one configuration''s own element answers read %', v_line;
  end if;
  v_line := pg_temp.line(v_answer, v_d);
  if v_line->>'core' <> 'satisfied' or v_line->'configurations'->>v_config_b::text <> 'satisfied' then
    raise exception 'A determination on the whole product read %', v_line;
  end if;
  if pg_temp.line(v_answer, v_e)->>'core' <> 'not_covered' then
    raise exception 'A control nothing claims read %', pg_temp.line(v_answer, v_e);
  end if;
  if (v_totals->>'satisfied_everywhere')::integer <> 2 or (v_totals->>'differs')::integer <> 1 then
    raise exception 'The product totals read %', v_totals;
  end if;
  -- Every scope's statuses add up to the baseline.
  if exists (select 1 from jsonb_each(v_totals->'scopes') s
    where (select sum(n.value::integer) from jsonb_each_text(s.value) n) <> v_selected)
    or (select count(*) from jsonb_object_keys(v_totals->'scopes')) <> 3 then
    raise exception 'A scope''s statuses do not add up to % controls: %', v_selected, v_totals->'scopes';
  end if;

  -- A variant of configuration A, as the product delivers it, with one element of the program's own.
  v_pin_core := jsonb_build_object('revisionId', v_library, 'definedComponentId', v_core_unit, 'rationale', 'Inherited from the test product.');
  v_pin_kit := jsonb_build_object('revisionId', v_library, 'definedComponentId', v_kit_unit, 'rationale', 'Inherited from the test product.');
  v_lineage := jsonb_build_object('revisionId', v_revision, 'configurationId', v_config_a);
  v_variant := pg_temp.variant('PA-V1', v_catalog, v_base, v_lineage, jsonb_build_array(
    jsonb_build_array('CORE', v_core, v_pin_core), jsonb_build_array('KIT', v_kit, v_pin_kit),
    jsonb_build_array('PLAIN', v_plain, null), jsonb_build_array('OWN', null, null)));
  select * into v_core_system from public.systems where tenant_id = v_tenant and code = 'PA-V1-CORE';
  select id into v_added_system from public.systems where tenant_id = v_tenant and code = 'PA-V1-OWN';
  select id into v_plain_system from public.systems where tenant_id = v_tenant and code = 'PA-V1-PLAIN';

  v_answer := public.variant_control_delta(v_tenant, v_variant);
  v_totals := v_answer->'totals';
  if v_answer->'product'->>'configuration_code' <> 'A' or (v_answer->'product'->>'version')::integer <> 1
    or (v_answer->'assessment'->>'id')::uuid <> v_assessment or v_answer->'update_available' <> 'null'::jsonb
    or v_answer->'elements' <> '{"inherited": 3, "modified": 0, "removed": 0, "added": 1}'::jsonb then
    raise exception 'A variant as the product delivers it answered %', v_answer - 'controls';
  end if;
  if pg_temp.line(v_answer, v_a)->>'delta' <> 'inherited' or pg_temp.line(v_answer, v_a)->>'product_status' <> 'satisfied'
    or pg_temp.line(v_answer, v_b)->>'delta' <> 'shared' or pg_temp.line(v_answer, v_b)->>'product_status' <> 'not_assessed'
    or pg_temp.line(v_answer, v_c)->>'delta' <> 'inherited' or pg_temp.line(v_answer, v_c)->>'product_status' <> 'other_than_satisfied'
    or pg_temp.line(v_answer, v_d)->>'delta' <> 'inherited' or pg_temp.line(v_answer, v_d)->>'product_status' <> 'satisfied'
    or pg_temp.line(v_answer, v_e)->>'delta' <> 'program_only' or pg_temp.line(v_answer, v_e)->'product_status' <> 'null'::jsonb then
    raise exception 'A variant''s controls read A % B % C % D % E %', pg_temp.line(v_answer, v_a), pg_temp.line(v_answer, v_b),
      pg_temp.line(v_answer, v_c), pg_temp.line(v_answer, v_d), pg_temp.line(v_answer, v_e);
  end if;
  if (v_totals->>'controls')::integer <> v_selected or (v_totals->>'inherited')::integer <> 3 or (v_totals->>'shared')::integer <> 1
    or (v_totals->>'changed_here')::integer <> 0 or (v_totals->>'program_only')::integer <> v_selected - 4 then
    raise exception 'A variant''s totals read %', v_totals;
  end if;

  -- Only the command records a change, on an inherited element, with a reason.
  perform pg_temp.expect_error(format(
    $q$update public.systems set product_change_kinds = array['software'], product_change_rationale = 'Direct', product_changed_at = now(), revision = revision + 1 where id = %L$q$,
    v_core_system.id), '23514');
  perform pg_temp.expect_error(format($q$select public.declare_product_element_change(%L, %L, %s, array['software'], '  ')$q$, v_tenant, v_core_system.id, v_core_system.revision), '22023');
  perform pg_temp.expect_error(format($q$select public.declare_product_element_change(%L, %L, %s, array['paint'], 'A new colour')$q$, v_tenant, v_core_system.id, v_core_system.revision), '22023');
  perform pg_temp.expect_error(format($q$select public.declare_product_element_change(%L, %L, 1, array['hardware'], 'It is the program''s own')$q$, v_tenant, v_added_system), '23514');
  perform pg_temp.expect_error(format($q$select public.declare_product_element_change(%L, %L, %s, array['software'], 'Customer keys')$q$, v_tenant, v_core_system.id, v_core_system.revision + 7), 'PT409');
  perform pg_temp.expect_error(format($q$select public.declare_product_element_change(%L, %L, 1, array['software'], 'Customer keys')$q$, v_tenant, gen_random_uuid()), 'PT404');

  v_result := public.declare_product_element_change(v_tenant, v_core_system.id, v_core_system.revision, array['software', 'firmware', 'software'], 'Customer keys and mission data are built in.');
  if not (v_result->>'changed')::boolean or v_result->'kinds' <> '["firmware", "software"]'::jsonb
    or (v_result->>'revision')::bigint <> v_core_system.revision + 1 then
    raise exception 'Declaring a change answered %', v_result;
  end if;
  -- The same declaration again changes nothing, whatever revision it names.
  v_result := public.declare_product_element_change(v_tenant, v_core_system.id, v_core_system.revision, array['firmware', 'software'], 'Customer keys and mission data are built in.');
  if (v_result->>'changed')::boolean or (v_result->>'revision')::bigint <> v_core_system.revision + 1 then
    raise exception 'The same declaration again answered %', v_result;
  end if;

  -- A modified element: every control it stands behind owes a new assessment, the shared one too.
  v_answer := public.variant_control_delta(v_tenant, v_variant);
  v_line := pg_temp.line(v_answer, v_a);
  if v_line->>'delta' <> 'changed_here' or v_line->>'product_status' <> 'satisfied'
    or jsonb_array_length(v_line->'changed_elements') <> 1
    or v_line->'changed_elements'->0->>'change' <> 'modified'
    or (v_line->'changed_elements'->0->>'system_id')::uuid <> v_core_system.id
    or v_line->'changed_elements'->0->'kinds' <> '["firmware", "software"]'::jsonb then
    raise exception 'A control behind a modified element read %', v_line;
  end if;
  if pg_temp.line(v_answer, v_b)->>'delta' <> 'changed_here' or pg_temp.line(v_answer, v_c)->>'delta' <> 'inherited'
    or pg_temp.line(v_answer, v_d)->>'delta' <> 'inherited'
    or v_answer->'elements' <> '{"inherited": 2, "modified": 1, "removed": 0, "added": 1}'::jsonb
    or (v_answer->'totals'->>'changed_here')::integer <> 2 or (v_answer->'totals'->>'inherited')::integer <> 2
    or (v_answer->'totals'->>'shared')::integer <> 0 then
    raise exception 'A variant with a modified element answered % %', v_answer->'elements', v_answer->'totals';
  end if;

  -- Withdrawn, the element is as the product delivers it again.
  v_result := public.declare_product_element_change(v_tenant, v_core_system.id, v_core_system.revision + 1, '{}', null);
  if not (v_result->>'changed')::boolean or v_result->'kinds' <> '[]'::jsonb then
    raise exception 'Withdrawing a change answered %', v_result;
  end if;
  v_answer := public.variant_control_delta(v_tenant, v_variant);
  if pg_temp.line(v_answer, v_a)->>'delta' <> 'inherited' or pg_temp.line(v_answer, v_b)->>'delta' <> 'shared'
    or exists (select 1 from public.systems s where s.id = v_core_system.id and (s.product_change_kinds is not null or s.product_changed_at is not null)) then
    raise exception 'A withdrawn change still stands: %', v_answer->'totals';
  end if;

  -- A variant that leaves the kit element out: the control only that element answered is the
  -- program's own, and the element counts as removed.
  v_pruned := pg_temp.variant('PA-V2', v_catalog, v_base, v_lineage, jsonb_build_array(
    jsonb_build_array('CORE', v_core, v_pin_core), jsonb_build_array('PLAIN', v_plain, null)));
  v_answer := public.variant_control_delta(v_tenant, v_pruned);
  if pg_temp.line(v_answer, v_c)->>'delta' <> 'program_only' or pg_temp.line(v_answer, v_c)->'product_status' <> 'null'::jsonb
    or pg_temp.line(v_answer, v_a)->>'delta' <> 'inherited'
    or v_answer->'elements' <> '{"inherited": 2, "modified": 0, "removed": 1, "added": 0}'::jsonb then
    raise exception 'A variant without the kit element answered % %', v_answer->'elements', pg_temp.line(v_answer, v_c);
  end if;
  -- Every control stands in exactly one delta.
  v_totals := v_answer->'totals';
  if (v_totals->>'inherited')::integer + (v_totals->>'shared')::integer + (v_totals->>'changed_here')::integer
    + (v_totals->>'program_only')::integer <> (v_totals->>'controls')::integer then
    raise exception 'A variant''s deltas do not add up: %', v_totals;
  end if;

  -- An element of the variant is not a variant; a system outside a product has no delta.
  if public.variant_control_delta(v_tenant, v_plain_system)->'product' <> 'null'::jsonb then
    raise exception 'An element answered a delta of its own';
  end if;

  -- A newer published version of the product is said, and changes nothing by itself.
  v_next := public.copy_product_revision(v_tenant, v_revision);
  if public.variant_control_delta(v_tenant, v_variant)->'update_available' <> 'null'::jsonb then
    raise exception 'A draft product version was offered as an update';
  end if;
  update public.product_revisions set state = 'published', revision = revision + 1 where id = v_next;
  v_answer := public.variant_control_delta(v_tenant, v_variant);
  if (v_answer->'update_available'->>'version')::integer <> 2 or (v_answer->'update_available'->>'revision_id')::uuid <> v_next
    or pg_temp.line(v_answer, v_a)->>'delta' <> 'inherited' then
    raise exception 'A newer product version read %', v_answer->'update_available';
  end if;

  -- The delta assessment: a campaign whose draft plan holds one objective a control the program
  -- owes an assessment on, pinned to the variant's published SSP.
  select * into v_core_system from public.systems where id = v_core_system.id;
  perform public.declare_product_element_change(v_tenant, v_core_system.id, v_core_system.revision, array['software'], 'Customer keys are built in.');
  v_answer := public.variant_control_delta(v_tenant, v_variant);
  v_owed := (v_answer->'totals'->>'changed_here')::integer + (v_answer->'totals'->>'program_only')::integer;
  if (v_answer->'totals'->>'changed_here')::integer <> 2 then
    raise exception 'The variant should owe two changed controls, read %', v_answer->'totals';
  end if;
  perform pg_temp.expect_error(format($q$select public.plan_delta_assessment(%L, %L, %L)$q$, v_tenant, v_variant, v_request), '23514');
  update public.ssp_revisions set state = 'published', revision = revision + 1 where tenant_id = v_tenant and system_id = v_variant;
  v_plan := public.plan_delta_assessment(v_tenant, v_variant, v_request);
  if not (v_plan->>'created')::boolean or (v_plan->>'campaignId')::uuid <> v_request
    or (v_plan->>'objectives')::integer <> v_owed or (v_plan->>'changedHere')::integer <> 2
    or (v_plan->>'programOnly')::integer <> v_owed - 2 then
    raise exception 'Planning a delta assessment answered %, with % controls owed', v_plan, v_owed;
  end if;
  if not exists (select 1 from public.assessment_campaigns g where g.id = v_request and g.status = 'planned'
      and g.title = 'PA-V1 variant delta assessment' and g.program_id = (select program_id from public.systems where id = v_variant)
      -- The campaign names the variant it assesses.
      and g.variant_system_id = v_variant)
    or not exists (select 1 from public.assessment_plan_revisions pr join public.ssp_revisions ssp on ssp.id = pr.ssp_revision_id
      where pr.id = (v_plan->>'planRevisionId')::uuid and pr.state = 'draft' and pr.campaign_id = v_request and ssp.system_id = v_variant)
    or not exists (select 1 from public.assessment_objectives o where o.plan_revision_id = (v_plan->>'planRevisionId')::uuid
      and o.description = 'Changed here: Core element (software).'
      and o.title = (select k.code || ' ' || k.title from public.controls k where k.id = v_a))
    or (select count(*) from public.assessment_objectives o where o.plan_revision_id = (v_plan->>'planRevisionId')::uuid
      and o.description like 'Program only:%') <> v_owed - 2
    -- What the variant inherits or shares is not assessed again.
    or exists (select 1 from public.assessment_objectives o where o.plan_revision_id = (v_plan->>'planRevisionId')::uuid
      and o.title = (select k.code || ' ' || k.title from public.controls k where k.id = v_c)) then
    raise exception 'The planned delta assessment is not the controls the variant owes';
  end if;
  -- The same request again answers the campaign it made and writes nothing.
  v_plan := public.plan_delta_assessment(v_tenant, v_variant, v_request, 'Another title');
  if (v_plan->>'created')::boolean or (v_plan->>'objectives')::integer <> v_owed
    or (select count(*) from public.assessment_campaigns g where g.program_id = (select program_id from public.systems where id = v_variant)) <> 1 then
    raise exception 'The same request again answered %', v_plan;
  end if;
  -- Only the command says which variant a campaign assesses: a direct write of it is refused.
  perform pg_temp.expect_error(format(
    $q$update public.assessment_campaigns set variant_system_id = null, revision = revision + 1 where id = %L$q$, v_request), '23514');
  perform pg_temp.expect_error(format(
    $q$insert into public.assessment_campaigns (tenant_id, title, program_id, variant_system_id) values (%L, 'Direct', %L, %L)$q$,
    v_tenant, (select program_id from public.systems where id = v_variant), v_variant), '23514');
  -- Refused: a variant whose SSP is a draft, an element, and a system that is gone.
  perform pg_temp.expect_error(format($q$select public.plan_delta_assessment(%L, %L, %L)$q$, v_tenant, v_pruned, gen_random_uuid()), '23514');
  perform pg_temp.expect_error(format($q$select public.plan_delta_assessment(%L, %L, %L)$q$, v_tenant, v_plain_system, gen_random_uuid()), '23514');
  perform pg_temp.expect_error(format($q$select public.plan_delta_assessment(%L, %L, %L)$q$, v_tenant, gen_random_uuid(), gen_random_uuid()), 'PT404');

  -- Taking a newer version. Version 3 of the product adds an element with one inside it and one
  -- inside the kit element, and its configuration A no longer has the plain element.
  select * into v_core_system from public.systems where id = v_core_system.id;
  v_third := public.copy_product_revision(v_tenant, v_next);
  select id into v_core3 from public.product_elements where product_revision_id = v_third and code = 'CORE';
  select id into v_kit3 from public.product_elements where product_revision_id = v_third and code = 'KIT';
  insert into public.product_elements(id, tenant_id, product_revision_id, parent_element_id, code, name, element_type, defined_component_id, position) values
    (v_new, v_tenant, v_third, null, 'NEW', 'New element', 'hardware', v_kit_unit, 3),
    (v_new_sub, v_tenant, v_third, v_new, 'NEW-SUB', 'Part of the new element', 'other', null, 0),
    (v_kit_ext, v_tenant, v_third, v_kit3, 'KIT-EXT', 'Kit extension', 'other', null, 0);
  insert into public.product_configuration_elements(tenant_id, product_revision_id, product_configuration_id, product_element_id) values
    (v_tenant, v_third, v_config_a, v_new), (v_tenant, v_third, v_config_a, v_new_sub), (v_tenant, v_third, v_config_a, v_kit_ext);
  delete from public.product_configuration_elements
    where product_revision_id = v_third and product_configuration_id = v_config_a
      and product_element_id = (select id from public.product_elements where product_revision_id = v_third and code = 'PLAIN');
  -- A draft version cannot be taken, nor one of another product, nor one that is gone; an element
  -- takes no version.
  perform pg_temp.expect_error(format($q$select public.variant_version_changes(%L, %L, %L)$q$, v_tenant, v_variant, v_third), '23514');
  update public.product_revisions set state = 'published', revision = revision + 1 where id = v_third;
  insert into public.products(id, tenant_id, code, name) values (v_other_product, v_tenant, 'PA-Z', 'Another test product');
  insert into public.product_revisions(id, tenant_id, product_id, version_number) values (v_other_revision, v_tenant, v_other_product, 9);
  perform pg_temp.expect_error(format($q$select public.variant_version_changes(%L, %L, %L)$q$, v_tenant, v_variant, v_other_revision), '23514');
  perform pg_temp.expect_error(format($q$select public.variant_version_changes(%L, %L, %L)$q$, v_tenant, v_variant, gen_random_uuid()), 'PT404');
  perform pg_temp.expect_error(format($q$select public.variant_version_changes(%L, %L, %L)$q$, v_tenant, v_plain_system, v_third), '23514');

  -- What taking it would do, and that asking changes nothing. The variant holds every element of
  -- its configuration: two are kept, the modified one still modified, three are added under the
  -- variant's own prefix, and the plain one is released.
  v_plan := public.variant_version_changes(v_tenant, v_variant, v_third);
  if (v_plan->>'current')::boolean or (v_plan->'from'->>'version')::integer <> 1 or (v_plan->'to'->>'version')::integer <> 3
    or v_plan->'assessment' <> 'null'::jsonb
    or v_plan->'totals' <> '{"kept": 2, "added": 3, "released": 1, "stays_removed": 0, "skipped": 0, "pin_changed": 0}'::jsonb
    or not exists (select 1 from jsonb_array_elements(v_plan->'elements') e where e->>'code' = 'CORE' and e->>'change' = 'kept'
      and (e->>'modified')::boolean and (e->>'to_element_id')::uuid = v_core3 and (e->>'system_id')::uuid = v_core_system.id)
    or not exists (select 1 from jsonb_array_elements(v_plan->'elements') e where e->>'code' = 'NEW' and e->>'change' = 'added'
      and e->>'system_code' = 'PA-V1-NEW' and e->'parent_code' = 'null'::jsonb and (e->>'depth')::integer = 1)
    or not exists (select 1 from jsonb_array_elements(v_plan->'elements') e where e->>'code' = 'NEW-SUB' and e->>'change' = 'added'
      and e->>'system_code' = 'PA-V1-NEW-SUB' and e->>'parent_code' = 'NEW' and (e->>'depth')::integer = 2)
    or not exists (select 1 from jsonb_array_elements(v_plan->'elements') e where e->>'code' = 'KIT-EXT' and e->>'change' = 'added'
      and e->>'parent_code' = 'KIT')
    or not exists (select 1 from jsonb_array_elements(v_plan->'elements') e where e->>'code' = 'PLAIN' and e->>'change' = 'released'
      and (e->>'system_id')::uuid = v_plain_system) then
    raise exception 'What version 3 would change read %', v_plan;
  end if;
  if (public.variant_control_delta(v_tenant, v_variant)->'product'->>'version')::integer <> 1 then
    raise exception 'Asking what a version would change changed the variant';
  end if;
  -- The variant that left the kit element out: it stays out, and what is new inside it is skipped.
  v_plan := public.variant_version_changes(v_tenant, v_pruned, v_third);
  if v_plan->'totals' <> '{"kept": 1, "added": 2, "released": 1, "stays_removed": 1, "skipped": 1, "pin_changed": 0}'::jsonb
    or not exists (select 1 from jsonb_array_elements(v_plan->'elements') e where e->>'code' = 'KIT' and e->>'change' = 'stays_removed')
    or not exists (select 1 from jsonb_array_elements(v_plan->'elements') e where e->>'code' = 'KIT-EXT' and e->>'change' = 'skipped') then
    raise exception 'What version 3 would change in the variant without the kit read %', v_plan;
  end if;

  -- Refused: no request id, a revision the reader did not see, a system that is gone.
  select * into v_boundary from public.systems where id = v_variant;
  perform pg_temp.expect_error(format($q$select public.take_product_version(%L, %L, %s, %L, null)$q$, v_tenant, v_variant, v_boundary.revision, v_third), '22023');
  perform pg_temp.expect_error(format($q$select public.take_product_version(%L, %L, %s, %L, %L)$q$, v_tenant, v_variant, v_boundary.revision + 3, v_third, v_take), 'PT409');
  perform pg_temp.expect_error(format($q$select public.take_product_version(%L, %L, 1, %L, %L)$q$, v_tenant, gen_random_uuid(), v_third, v_take), 'PT404');
  -- The version the variant is at already: nothing to take, whatever revision is sent.
  v_result := public.take_product_version(v_tenant, v_variant, v_boundary.revision + 3, v_revision, v_take);
  if (v_result->>'changed')::boolean or (v_result->>'version')::integer <> 1 then
    raise exception 'Taking the version a variant is at answered %', v_result;
  end if;

  select count(*) into v_count from public.systems where tenant_id = v_tenant and boundary_system_id = v_variant;
  v_result := public.take_product_version(v_tenant, v_variant, v_boundary.revision, v_third, v_take);
  if not (v_result->>'changed')::boolean or (v_result->>'version')::integer <> 3 or (v_result->>'revision')::bigint <> v_boundary.revision + 1
    or (v_result->>'kept')::integer <> 2 or (v_result->>'added')::integer <> 3 or (v_result->>'released')::integer <> 1
    or (v_result->>'staysRemoved')::integer <> 0 or (v_result->>'skipped')::integer <> 0
    or jsonb_array_length(v_result->'elements') <> 3 then
    raise exception 'Taking version 3 answered %', v_result;
  end if;
  select id into v_new_system from public.systems where tenant_id = v_tenant and code = 'PA-V1-NEW';
  if (select count(*) from public.systems where tenant_id = v_tenant and boundary_system_id = v_variant) <> v_count + 3
    -- The boundary and the kept elements follow version 3; the declared change stays.
    or not exists (select 1 from public.systems s where s.id = v_variant and s.product_revision_id = v_third
      and s.product_configuration_id = v_config_a and s.revision = v_boundary.revision + 1)
    or not exists (select 1 from public.systems s where s.id = v_core_system.id and s.product_revision_id = v_third
      and s.product_element_id = v_core3 and s.product_change_kinds = array['software']
      and s.product_change_rationale = 'Customer keys are built in.' and s.revision = v_core_system.revision + 1)
    or not exists (select 1 from public.systems s where s.code = 'PA-V1-KIT' and s.tenant_id = v_tenant and s.product_element_id = v_kit3)
    -- The released element is the program's own.
    or not exists (select 1 from public.systems s where s.id = v_plain_system and s.product_revision_id is null and s.product_element_id is null)
    -- The added elements sit where the product places them, the pinned one with its library component.
    or not exists (select 1 from public.systems s where s.id = v_new_system and s.parent_system_id = v_variant
      and s.product_revision_id = v_third and s.product_element_id = v_new and s.system_type = 'hardware' and s.name = 'New element')
    or not exists (select 1 from public.systems s where s.tenant_id = v_tenant and s.code = 'PA-V1-NEW-SUB'
      and s.parent_system_id = v_new_system and s.product_element_id = v_new_sub)
    or not exists (select 1 from public.systems s where s.tenant_id = v_tenant and s.code = 'PA-V1-KIT-EXT'
      and s.parent_system_id = (select k.id from public.systems k where k.tenant_id = v_tenant and k.code = 'PA-V1-KIT')
      and s.product_element_id = v_kit_ext)
    or not exists (select 1 from public.system_components c where c.tenant_id = v_tenant and c.system_id = v_variant
      and c.system_element_id = v_new_system and c.defined_component_id = v_kit_unit)
    or (select count(*) from public.library_assignments a where a.tenant_id = v_tenant and a.request_id = v_take
      and a.system_id = v_new_system and a.source_revision_id = v_library) <> 1
    or not exists (select 1 from public.activity_events e where e.tenant_id = v_tenant and e.program_id = v_boundary.program_id
      and e.event_type = 'updated' and e.description = 'PA-V1-SYS: took version 3 of Product assurance test product.') then
    raise exception 'Taking version 3 did not write what it answered';
  end if;
  -- The delta is read against version 3, and no newer version is offered.
  v_answer := public.variant_control_delta(v_tenant, v_variant);
  if (v_answer->'product'->>'version')::integer <> 3 or v_answer->'update_available' <> 'null'::jsonb
    or v_answer->'elements' <> '{"inherited": 4, "modified": 1, "removed": 0, "added": 2}'::jsonb then
    raise exception 'The delta after taking version 3 read % %', v_answer->'product', v_answer->'elements';
  end if;
  -- The same request again, at the revision the reader first saw, changes nothing.
  v_result := public.take_product_version(v_tenant, v_variant, v_boundary.revision, v_third, v_take);
  if (v_result->>'changed')::boolean
    or (select count(*) from public.systems where tenant_id = v_tenant and boundary_system_id = v_variant) <> v_count + 3 then
    raise exception 'The same request again answered %', v_result;
  end if;
  -- An older version is not taken.
  perform pg_temp.expect_error(format($q$select public.take_product_version(%L, %L, %s, %L, %L)$q$, v_tenant, v_variant, v_boundary.revision + 1, v_next, gen_random_uuid()), '23514');
  -- A variant with a draft SSP takes it too, and leaves out what it left out.
  select * into v_boundary from public.systems where id = v_pruned;
  v_result := public.take_product_version(v_tenant, v_pruned, v_boundary.revision, v_third, gen_random_uuid());
  v_answer := public.variant_control_delta(v_tenant, v_pruned);
  if (v_result->>'added')::integer <> 2 or (v_result->>'staysRemoved')::integer <> 1 or (v_result->>'skipped')::integer <> 1
    or v_answer->'elements' <> '{"inherited": 3, "modified": 0, "removed": 2, "added": 1}'::jsonb
    or exists (select 1 from public.systems s where s.tenant_id = v_tenant and s.code in ('PA-V2-KIT', 'PA-V2-KIT-EXT')) then
    raise exception 'The variant without the kit took version 3 as % %', v_result, v_answer->'elements';
  end if;
  -- Only the command moves a variant to another version: a direct write of its lineage is refused.
  perform pg_temp.expect_error(format(
    $q$update public.systems set product_revision_id = %L, revision = revision + 1 where id = %L$q$, v_next, v_variant), '23514');

  perform set_config('test.variant', v_variant::text, true);
  perform set_config('test.revision', v_revision::text, true);
  perform set_config('test.third', v_third::text, true);
end $$;

-- A workspace that cannot read the product or the variant is refused, never answered as empty.
do $$
begin
  if current_setting('test.variant', true) is null or current_setting('test.variant', true) = '' then return; end if;
  perform set_config('request.jwt.claim.sub', '9a550000-0000-0000-0000-000000000002', true);
  perform pg_temp.expect_error(format($q$select public.variant_control_delta(%L, %L)$q$, current_setting('test.tenant'), current_setting('test.variant')), '42501');
  perform pg_temp.expect_error(format($q$select public.variant_control_delta(%L, %L)$q$, current_setting('test.other_tenant'), current_setting('test.variant')), '42501');
  perform pg_temp.expect_error(format($q$select public.product_control_status(%L, %L)$q$, current_setting('test.other_tenant'), current_setting('test.revision')), '42501');
  perform pg_temp.expect_error(format($q$select public.declare_product_element_change(%L, %L, 1, array['software'], 'Not mine')$q$, current_setting('test.tenant'), current_setting('test.variant')), '42501');
  perform pg_temp.expect_error(format($q$select public.plan_delta_assessment(%L, %L, %L)$q$, current_setting('test.tenant'), current_setting('test.variant'), gen_random_uuid()), '42501');
  perform pg_temp.expect_error(format($q$select public.variant_version_changes(%L, %L, %L)$q$, current_setting('test.tenant'), current_setting('test.variant'), current_setting('test.third')), '42501');
  perform pg_temp.expect_error(format($q$select public.take_product_version(%L, %L, 1, %L, %L)$q$, current_setting('test.tenant'), current_setting('test.variant'), current_setting('test.third'), gen_random_uuid()), '42501');
  perform pg_temp.expect_error(format($q$select public.product_assessment_sheet(%L, %L)$q$, current_setting('test.tenant'), current_setting('test.assessment')), '42501');
  -- In the outsider's own workspace the assessment is not there: no sheet, and nothing said of it.
  if public.product_assessment_sheet(current_setting('test.other_tenant')::uuid, current_setting('test.assessment')::uuid) is not null then
    raise exception 'Another workspace read a product assessment''s sheet';
  end if;
  perform pg_temp.expect_error(format($q$select public.record_product_determinations(%L, %L, null, array[gen_random_uuid()], 'satisfied', null)$q$, current_setting('test.tenant'), current_setting('test.assessment')), '42501');
  perform set_config('request.jwt.claim.sub', '', true);
  perform pg_temp.expect_error(format($q$select public.product_control_status(%L, %L)$q$, current_setting('test.tenant'), current_setting('test.revision')), '42501');
end $$;

rollback;
