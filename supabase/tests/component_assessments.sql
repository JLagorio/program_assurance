-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Component assessments: who may read and write a component's owner, an assessment and its
-- determinations, what an assessment may judge, the two commands (record and clear on a draft,
-- publish at the revision read, a request sent again, each refusal) and the reads. With the pinned
-- references installed (a catalog and a reference baseline), a component set with two versions is
-- assessed and read: where a component version stands on each control, the latest published
-- determination deciding; where it is used, by a product in two versions and by three programs,
-- one that declared its element modified, one that left it out and one that took the newer
-- version, so two consumers are behind; a component placed on its element by its inventory item;
-- what a system takes from above; the register's view; and the tenant boundary.
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
declare v_function text; v_relation text;
begin
  foreach v_function in array array[
    'public.component_assessment_sheet(uuid)', 'public.component_control_status(uuid)',
    'public.component_consumers(uuid)', 'public.system_upstream(uuid)',
    'public.component_lineage(uuid)', 'public.component_standing_lines(uuid[])',
    'public.record_component_determinations(uuid, uuid, uuid, uuid[], text, text)',
    'public.publish_component_assessment(uuid, uuid, bigint, integer, uuid, date)'] loop
    if has_function_privilege('anon', v_function, 'execute') or has_function_privilege('public', v_function, 'execute') then
      raise exception 'An anonymous session may execute %', v_function;
    end if;
    if not has_function_privilege('authenticated', v_function, 'execute') then
      raise exception 'A signed-in session may not execute %', v_function;
    end if;
  end loop;
  -- The reads run as their caller, so row-level security decides every row.
  foreach v_function in array array[
    'public.component_assessment_sheet(uuid)', 'public.component_control_status(uuid)',
    'public.component_consumers(uuid)', 'public.system_upstream(uuid)',
    'public.component_lineage(uuid)', 'public.component_standing_lines(uuid[])'] loop
    if (select p.prosecdef from pg_catalog.pg_proc p where p.oid = v_function::regprocedure) then
      raise exception '% does not run as its caller', v_function;
    end if;
  end loop;
  foreach v_relation in array array[
    'public.component_assessments', 'public.component_determinations', 'public.component_rows',
    'public.component_assessment_requests'] loop
    if has_table_privilege('anon', v_relation, 'select') then
      raise exception 'An anonymous session may read %', v_relation;
    end if;
  end loop;
  -- The register's view reads as the reader; the receipts are read by no client.
  if not exists (select 1 from pg_catalog.pg_class c where c.oid = 'public.component_rows'::regclass
      and c.reloptions @> array['security_invoker=true'])
    or not has_table_privilege('authenticated', 'public.component_rows', 'select') then
    raise exception 'component_rows does not read as a signed-in caller';
  end if;
  if has_table_privilege('authenticated', 'public.component_assessment_requests', 'select')
    or has_table_privilege('authenticated', 'public.component_assessment_requests', 'insert') then
    raise exception 'A signed-in session reaches the publication receipts';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- A workspace: its owner and a viewer; and a member of another workspace.
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email, raw_user_meta_data) values
  ('ca550000-0000-0000-0000-000000000001', 'component-assessment-owner@example.test', '{"name":"Component assessment test owner"}'),
  ('ca550000-0000-0000-0000-000000000002', 'component-assessment-outsider@example.test', '{}'),
  ('ca550000-0000-0000-0000-000000000003', 'component-assessment-viewer@example.test', '{}');
select set_config('request.jwt.claim.sub', 'ca550000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'ca550000-0000-0000-0000-000000000003', 'viewer');

-- A shared component has a named owner and a business line, both of its own workspace.
insert into public.parties(id, tenant_id, party_type, name) values
  ('ca551000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'person', 'Component owner'),
  ('ca551000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'person', 'Component assessor');
insert into public.business_lines(id, tenant_id, code, name) values
  ('ca552000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'CA', 'Component assessment line');
insert into public.component_definitions(id, tenant_id, code, name, owner_party_id, business_line_id) values
  ('ca553000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'ca-units', 'Component assessment units',
   'ca551000-0000-0000-0000-000000000001', 'ca552000-0000-0000-0000-000000000001'),
  ('ca553000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'ca-else', 'Another component set', null, null);
select set_config('request.jwt.claim.sub', 'ca550000-0000-0000-0000-000000000002', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
do $$ begin
  if exists (select 1 from public.component_definitions) or exists (select 1 from public.component_rows) then
    raise exception 'Another workspace reads a component';
  end if;
end $$;
select pg_temp.expect_error($$insert into public.component_definitions(tenant_id, code, name, owner_party_id)
  values (current_setting('test.other_tenant')::uuid, 'ca-theirs', 'Owned across workspaces', 'ca551000-0000-0000-0000-000000000001')$$, '23503');
select pg_temp.expect_error($$insert into public.component_definitions(tenant_id, code, name, business_line_id)
  values (current_setting('test.other_tenant')::uuid, 'ca-theirs', 'Placed across workspaces', 'ca552000-0000-0000-0000-000000000001')$$, '23503');
select set_config('request.jwt.claim.sub', 'ca550000-0000-0000-0000-000000000001', true);

-- ---------------------------------------------------------------------------------------------
-- With the pinned references installed.
-- ---------------------------------------------------------------------------------------------
create function pg_temp.line(answer jsonb, control uuid) returns jsonb language sql stable as $$
  select c from jsonb_array_elements(answer->'controls') c where c->>'id' = control::text;
$$;
-- A program with one system, created from a configuration of a product (`product`) or not.
-- `elements` is a list of [code, product element id or null, library pin or null].
create function pg_temp.system(p_code text, catalog uuid, base uuid, product jsonb, elements jsonb) returns uuid
language plpgsql as $$
declare profile uuid := gen_random_uuid();
begin
  perform public.create_program_wizard(current_setting('test.tenant')::uuid, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', p_code, 'name', p_code || ' component assessment test', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb,
    'catalogRevisionId', catalog,
    'profiles', jsonb_build_array(jsonb_build_object(
      'key', profile, 'baseResolutionId', base, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)),
    'systems', jsonb_build_array(jsonb_build_object(
      'key', gen_random_uuid(), 'code', p_code || '-SYS', 'name', p_code || ' system', 'description', '',
      'type', 'platform', 'ownerPartyId', null,
      'confidentiality', 'low', 'integrity', 'low', 'availability', 'low',
      'categorizationRationale', 'A limited impact boundary for a rollback test.',
      'profileKey', profile, 'product', product,
      'elements', (select coalesce(jsonb_agg(jsonb_build_object(
        'key', gen_random_uuid(), 'parentKey', null, 'code', p_code || '-' || (e->>0), 'name', e->>0, 'description', '',
        'type', case when e->>1 is null and e->2 = 'null'::jsonb then 'hardware' else null end,
        'library', case when e->2 = 'null'::jsonb then null else e->2 end,
        'productElementId', e->>1)), '[]'::jsonb) from jsonb_array_elements(elements) e)))));
  return (select s.id from public.systems s where s.tenant_id = current_setting('test.tenant')::uuid and s.code = p_code || '-SYS');
end;
$$;
grant execute on function pg_temp.line(jsonb, uuid), pg_temp.system(text, uuid, uuid, jsonb, jsonb) to authenticated;

do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_definition uuid := 'ca553000-0000-0000-0000-000000000001';
  v_else_definition uuid := 'ca553000-0000-0000-0000-000000000002';
  v_assessor uuid := 'ca551000-0000-0000-0000-000000000002';
  v_catalog uuid; v_base uuid; v_controls uuid[]; v_outside uuid;
  v_a uuid; v_b uuid; v_c uuid; v_d uuid; v_e uuid;
  v_rev1 uuid := gen_random_uuid(); v_rev2 uuid := gen_random_uuid(); v_else_rev uuid := gen_random_uuid();
  v_shared1 uuid := gen_random_uuid(); v_other1 uuid := gen_random_uuid();
  v_shared2 uuid := gen_random_uuid(); v_other2 uuid := gen_random_uuid(); v_else uuid := gen_random_uuid();
  v_assessment uuid := gen_random_uuid(); v_second uuid := gen_random_uuid(); v_third uuid := gen_random_uuid();
  v_empty uuid := gen_random_uuid(); v_newer uuid := gen_random_uuid();
  v_request uuid := gen_random_uuid(); v_row public.component_assessments;
  v_product uuid := gen_random_uuid(); v_prev1 uuid := gen_random_uuid(); v_prev2 uuid := gen_random_uuid();
  v_e_shr uuid := gen_random_uuid(); v_e_oth uuid := gen_random_uuid(); v_e_plain uuid := gen_random_uuid();
  v_e_shr2 uuid := gen_random_uuid();
  v_config_a uuid := gen_random_uuid(); v_config_b uuid := gen_random_uuid();
  v_pin_shared jsonb; v_pin_other jsonb; v_lineage jsonb;
  v_variant uuid; v_pruned uuid; v_own uuid; v_shr_system public.systems; v_shr_component uuid;
  v_baseline uuid := gen_random_uuid();
  v_own_component uuid; v_own_element uuid; v_inventory_item uuid := gen_random_uuid();
  v_selected integer; v_answer jsonb; v_again jsonb; v_result jsonb; v_line jsonb; v_totals jsonb; v_count integer;
  v_register public.component_rows;
begin
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) >= 5
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the checks of an assessed component were skipped';
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

  -- The component set's first version: a shared unit that claims A in full and B in part, and
  -- another unit that claims C. A second set stays a draft.
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values
    (v_rev1, v_tenant, v_definition, 1), (v_else_rev, v_tenant, v_else_definition, 1);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values
    (v_shared1, v_tenant, v_rev1, 'Shared unit', 'software'),
    (v_other1, v_tenant, v_rev1, 'Other unit', 'hardware'),
    (v_else, v_tenant, v_else_rev, 'Unit of another set', 'hardware');
  insert into public.defined_component_implementations(tenant_id, component_definition_revision_id, defined_component_id, control_id, description, implementation_status, coverage, consumer_responsibility) values
    (v_tenant, v_rev1, v_shared1, v_a, 'The shared unit enforces it.', 'implemented', 'full', null),
    (v_tenant, v_rev1, v_shared1, v_b, 'The shared unit provides the mechanism.', 'implemented', 'partial', 'The consumer sets the values.'),
    (v_tenant, v_rev1, v_other1, v_c, 'The other unit enforces it.', 'implemented', 'full', null);

  -- An assessment judges a published component version, against a published control baseline.
  perform pg_temp.expect_error(format(
    $q$insert into public.component_assessments(tenant_id, component_definition_revision_id, profile_resolution_id, title) values (%L, %L, %L, 'Too early')$q$,
    v_tenant, v_rev1, v_base), '23514');
  update public.component_definition_revisions set state = 'published', revision = revision + 1 where id = v_rev1;
  insert into public.component_assessments(id, tenant_id, component_definition_revision_id, profile_resolution_id, title, assessor_party_id, started_on)
    values (v_assessment, v_tenant, v_rev1, v_base, 'Component assessment', v_assessor, '2026-09-01');
  perform pg_temp.expect_error(format(
    $q$insert into public.component_assessments(tenant_id, component_definition_revision_id, profile_resolution_id, title, started_on, completed_on) values (%L, %L, %L, 'Ends before it starts', '2026-09-02', '2026-09-01')$q$,
    v_tenant, v_rev1, v_base), '23514');

  -- A determination names a component of the assessed version and a control of the baseline, once.
  insert into public.component_determinations(tenant_id, component_assessment_id, component_definition_revision_id, defined_component_id, control_id, determination)
    values (v_tenant, v_assessment, v_rev1, v_other1, v_c, 'satisfied');
  perform pg_temp.expect_error(format(
    $q$insert into public.component_determinations(tenant_id, component_assessment_id, component_definition_revision_id, defined_component_id, control_id, determination) values (%L, %L, %L, %L, %L, 'satisfied')$q$,
    v_tenant, v_assessment, v_rev1, v_other1, v_c), '23505');
  perform pg_temp.expect_error(format(
    $q$insert into public.component_determinations(tenant_id, component_assessment_id, component_definition_revision_id, defined_component_id, control_id, determination) values (%L, %L, %L, %L, %L, 'satisfied')$q$,
    v_tenant, v_assessment, v_rev1, v_else, v_a), '23503');
  perform pg_temp.expect_error(format(
    $q$insert into public.component_determinations(tenant_id, component_assessment_id, component_definition_revision_id, defined_component_id, control_id, determination) values (%L, %L, %L, %L, %L, 'satisfied')$q$,
    v_tenant, v_assessment, v_else_rev, v_else, v_a), '23503');
  perform pg_temp.expect_error(format(
    $q$insert into public.component_determinations(tenant_id, component_assessment_id, component_definition_revision_id, defined_component_id, control_id, determination) values (%L, %L, %L, %L, %L, 'fine')$q$,
    v_tenant, v_assessment, v_rev1, v_shared1, v_a), '23514');
  if v_outside is not null then
    perform pg_temp.expect_error(format(
      $q$insert into public.component_determinations(tenant_id, component_assessment_id, component_definition_revision_id, defined_component_id, control_id, determination) values (%L, %L, %L, %L, %L, 'satisfied')$q$,
      v_tenant, v_assessment, v_rev1, v_shared1, v_outside), '23514');
  end if;

  -- Authoring through the command: one determination for many controls of one component at once,
  -- each control once; the same again changes nothing; none clears.
  v_result := public.record_component_determinations(v_tenant, v_assessment, v_shared1, array[v_a, v_b, v_a], 'satisfied', '  Shown in test. ');
  if (v_result->>'recorded')::integer <> 2 or (v_result->>'unchanged')::integer <> 0
    or (select count(*) from public.component_determinations d where d.component_assessment_id = v_assessment
      and d.defined_component_id = v_shared1 and d.determination = 'satisfied' and d.rationale = 'Shown in test.') <> 2 then
    raise exception 'Recording two determinations answered %', v_result;
  end if;
  v_result := public.record_component_determinations(v_tenant, v_assessment, v_shared1, array[v_a, v_b], 'satisfied', 'Shown in test.');
  if (v_result->>'recorded')::integer <> 0 or (v_result->>'unchanged')::integer <> 2 then
    raise exception 'Recording the same determinations again answered %', v_result;
  end if;
  v_result := public.record_component_determinations(v_tenant, v_assessment, v_shared1, array[v_b], 'partially_satisfied', null);
  if (v_result->>'recorded')::integer <> 1 or not exists (select 1 from public.component_determinations d
      where d.component_assessment_id = v_assessment and d.defined_component_id = v_shared1 and d.control_id = v_b
        and d.determination = 'partially_satisfied' and d.rationale is null) then
    raise exception 'Changing a determination answered %', v_result;
  end if;
  -- A control the component does not claim can be judged on it all the same.
  v_result := public.record_component_determinations(v_tenant, v_assessment, v_shared1, array[v_d], 'other_than_satisfied', 'Not shown.');
  if (v_result->>'recorded')::integer <> 1 then
    raise exception 'A determination on a control the component does not claim answered %', v_result;
  end if;

  -- The sheet: the version judged, the baseline's controls, each component with what it claims and
  -- has determined, every record.
  if public.component_assessment_sheet(gen_random_uuid()) is not null then
    raise exception 'An assessment that is not there answered a sheet';
  end if;
  v_answer := public.component_assessment_sheet(v_assessment);
  if v_answer->'assessment'->>'state' <> 'draft' or (v_answer->'assessment'->>'revision')::integer <> 1
    or v_answer->'definition'->>'code' <> 'ca-units' or (v_answer->'definition'->>'version')::integer <> 1
    or (v_answer->'definition'->>'owner_party_id')::uuid <> 'ca551000-0000-0000-0000-000000000001'
    or jsonb_array_length(v_answer->'controls') <> v_selected
    or jsonb_array_length(v_answer->'components') <> 2
    or v_answer->'components'->0->>'name' <> 'Other unit'
    or (select (c->>'claimed')::integer from jsonb_array_elements(v_answer->'components') c where c->>'id' = v_shared1::text) <> 2
    or (select (c->>'determined')::integer from jsonb_array_elements(v_answer->'components') c where c->>'id' = v_shared1::text) <> 3
    or (select (c->>'determined')::integer from jsonb_array_elements(v_answer->'components') c where c->>'id' = v_other1::text) <> 1
    or jsonb_array_length(v_answer->'claims') <> 3
    or not v_answer->'claims' @> jsonb_build_array(jsonb_build_array(v_shared1, v_b))
    or jsonb_array_length(v_answer->'determinations') <> 4
    or not v_answer->'determinations' @> jsonb_build_array(jsonb_build_object(
      'component_id', v_shared1, 'control_id', v_d, 'determination', 'other_than_satisfied', 'rationale', 'Not shown.')) then
    raise exception 'The assessment sheet answered %', v_answer - 'controls';
  end if;
  v_result := public.record_component_determinations(v_tenant, v_assessment, v_shared1, array[v_a, v_e], null, null);
  if (v_result->>'cleared')::integer <> 1 or (v_result->>'recorded')::integer <> 0 or exists (select 1 from public.component_determinations d
      where d.component_assessment_id = v_assessment and d.defined_component_id = v_shared1 and d.control_id = v_a) then
    raise exception 'Clearing a determination answered %', v_result;
  end if;
  v_result := public.record_component_determinations(v_tenant, v_assessment, v_shared1, array[v_a], 'satisfied', null);
  -- Refused, with nothing written: a word that is no determination, no control, a control outside
  -- the baseline, a component of another version, no component, and an assessment that is gone.
  perform pg_temp.expect_error(format($q$select public.record_component_determinations(%L, %L, %L, array[%L]::uuid[], 'fine', null)$q$, v_tenant, v_assessment, v_shared1, v_a), '22023');
  perform pg_temp.expect_error(format($q$select public.record_component_determinations(%L, %L, %L, '{}'::uuid[], 'satisfied', null)$q$, v_tenant, v_assessment, v_shared1), '22023');
  if v_outside is not null then
    perform pg_temp.expect_error(format($q$select public.record_component_determinations(%L, %L, %L, array[%L, %L]::uuid[], 'satisfied', null)$q$, v_tenant, v_assessment, v_shared1, v_e, v_outside), '23514');
  end if;
  perform pg_temp.expect_error(format($q$select public.record_component_determinations(%L, %L, %L, array[%L]::uuid[], 'satisfied', null)$q$, v_tenant, v_assessment, v_else, v_a), '23514');
  perform pg_temp.expect_error(format($q$select public.record_component_determinations(%L, %L, null, array[%L]::uuid[], 'satisfied', null)$q$, v_tenant, v_assessment, v_a), '23514');
  perform pg_temp.expect_error(format($q$select public.record_component_determinations(%L, %L, %L, array[%L]::uuid[], 'satisfied', null)$q$, v_tenant, gen_random_uuid(), v_shared1, v_a), 'PT404');
  if (select count(*) from public.component_determinations d where d.component_assessment_id = v_assessment) <> 4 then
    raise exception 'A refused record wrote something';
  end if;

  -- A draft assessment decides nothing: the component stands on what it claims, none of it judged.
  v_answer := public.component_control_status(v_shared1);
  if v_answer->'totals' <> '{"controls": 2, "satisfied": 0, "partially_satisfied": 0, "other_than_satisfied": 0, "not_assessed": 2, "carried": 0, "to_review": 0}'::jsonb
    or v_answer->'assessments' <> '[]'::jsonb or v_answer->'component'->>'definition_code' <> 'ca-units'
    or (v_answer->'component'->>'version')::integer <> 1
    or pg_temp.line(v_answer, v_a)->>'status' <> 'not_assessed' or not (pg_temp.line(v_answer, v_a)->>'claimed')::boolean
    or pg_temp.line(v_answer, v_d) is not null then
    raise exception 'A component only a draft judged answered %', v_answer;
  end if;

  -- Publishing, at the revision read and with the determinations the reader was told. Refused: a
  -- request that names nothing, another revision, another number of determinations, a day before
  -- the assessment started, an assessment that holds nothing and one that is gone.
  insert into public.component_assessments(id, tenant_id, component_definition_revision_id, profile_resolution_id, title)
    values (v_empty, v_tenant, v_rev1, v_base, 'Nothing recorded yet');
  perform pg_temp.expect_error(format($q$select public.publish_component_assessment(%L, %L, 1, 4, null)$q$, v_tenant, v_assessment), '22023');
  perform pg_temp.expect_error(format($q$select public.publish_component_assessment(%L, %L, 2, 4, %L)$q$, v_tenant, v_assessment, gen_random_uuid()), 'PT409');
  perform pg_temp.expect_error(format($q$select public.publish_component_assessment(%L, %L, 1, 3, %L)$q$, v_tenant, v_assessment, gen_random_uuid()), 'PT409');
  perform pg_temp.expect_error(format($q$select public.publish_component_assessment(%L, %L, 1, 4, %L, '2026-08-31')$q$, v_tenant, v_assessment, gen_random_uuid()), '22023');
  perform pg_temp.expect_error(format($q$select public.publish_component_assessment(%L, %L, 1, 0, %L)$q$, v_tenant, v_empty, gen_random_uuid()), '23514');
  perform pg_temp.expect_error(format($q$select public.publish_component_assessment(%L, %L, 1, 4, %L)$q$, v_tenant, gen_random_uuid(), gen_random_uuid()), 'PT404');
  if exists (select 1 from public.component_assessments a where a.tenant_id = v_tenant and a.state = 'published') then
    raise exception 'A refused publication published something';
  end if;
  v_result := public.publish_component_assessment(v_tenant, v_assessment, 1, 4, v_request, '2026-09-30');
  select * into v_row from public.component_assessments where id = v_assessment;
  if v_row.state <> 'published' or v_row.published_at is null or v_row.completed_on <> '2026-09-30' or v_row.revision <> 2
    or (v_result->>'assessmentId')::uuid <> v_assessment or (v_result->>'determinations')::integer <> 4
    or (v_result->>'components')::integer <> 2 or v_result->>'completedOn' <> '2026-09-30'
    or (v_result->>'componentDefinitionRevisionId')::uuid <> v_rev1 then
    raise exception 'Publishing a component assessment answered % and wrote %', v_result, to_jsonb(v_row);
  end if;
  -- The same request again answers as it first did and writes nothing; its id is refused for
  -- another assessment; a new request finds the assessment published.
  v_again := public.publish_component_assessment(v_tenant, v_assessment, 1, 4, v_request, '2026-09-30');
  if v_again <> v_result or (select revision from public.component_assessments where id = v_assessment) <> 2 then
    raise exception 'A publication sent again answered % after %', v_again, v_result;
  end if;
  perform pg_temp.expect_error(format($q$select public.publish_component_assessment(%L, %L, 1, 0, %L)$q$, v_tenant, v_empty, v_request), 'PT409');
  perform pg_temp.expect_error(format($q$select public.publish_component_assessment(%L, %L, 2, 4, %L)$q$, v_tenant, v_assessment, gen_random_uuid()), '23514');
  -- Published, the assessment and its determinations no longer change, and it still gives its sheet.
  perform pg_temp.expect_error(format($q$select public.record_component_determinations(%L, %L, %L, array[%L]::uuid[], 'satisfied', null)$q$, v_tenant, v_assessment, v_shared1, v_e), '23514');
  perform pg_temp.expect_error(format($q$select public.record_component_determinations(%L, %L, %L, array[%L]::uuid[], null, null)$q$, v_tenant, v_assessment, v_shared1, v_a), '23514');
  perform pg_temp.expect_error(format(
    $q$update public.component_determinations set determination = 'satisfied', revision = revision + 1 where component_assessment_id = %L$q$, v_assessment), '23514');
  perform pg_temp.expect_error(format($q$update public.component_assessments set title = 'Renamed', revision = revision + 1 where id = %L$q$, v_assessment), '23514');
  perform pg_temp.expect_error(format($q$delete from public.component_assessments where id = %L$q$, v_assessment), '23514');
  if public.component_assessment_sheet(v_assessment)->'assessment'->>'state' <> 'published' then
    raise exception 'A published assessment gave no sheet';
  end if;
  -- No client reads a receipt.
  perform pg_temp.expect_error($q$select 1 from public.component_assessment_requests$q$, '42501');
  delete from public.component_assessments where id = v_empty;

  -- Where the component version stands: the determination on each control, a judged control it does
  -- not claim among them, and the assessment they were taken from.
  v_answer := public.component_control_status(v_shared1);
  if v_answer->'totals' <> '{"controls": 3, "satisfied": 1, "partially_satisfied": 1, "other_than_satisfied": 1, "not_assessed": 0, "carried": 0, "to_review": 0}'::jsonb
    or pg_temp.line(v_answer, v_a)->>'status' <> 'satisfied'
    or pg_temp.line(v_answer, v_b)->>'status' <> 'partially_satisfied'
    or pg_temp.line(v_answer, v_d)->>'status' <> 'other_than_satisfied' or (pg_temp.line(v_answer, v_d)->>'claimed')::boolean
    or pg_temp.line(v_answer, v_d)->>'rationale' <> 'Not shown.'
    or (pg_temp.line(v_answer, v_a)->>'assessment_id')::uuid <> v_assessment
    or jsonb_array_length(v_answer->'assessments') <> 1
    or (v_answer->'assessments'->0->>'id')::uuid <> v_assessment
    or (v_answer->'assessments'->0->>'determinations')::integer <> 3
    or v_answer->'assessments'->0->>'completed_on' <> '2026-09-30'
    or (v_answer->'assessments'->0->>'assessor_party_id')::uuid <> v_assessor then
    raise exception 'An assessed component answered %', v_answer;
  end if;
  if public.component_control_status(v_other1)->'totals' <> '{"controls": 1, "satisfied": 1, "partially_satisfied": 0, "other_than_satisfied": 0, "not_assessed": 0, "carried": 0, "to_review": 0}'::jsonb then
    raise exception 'The other component answered %', public.component_control_status(v_other1);
  end if;
  -- The latest published determination on a control stands: a later assessment decides the control
  -- it judges and leaves the others to the assessment before it. A draft decides nothing.
  insert into public.component_assessments(id, tenant_id, component_definition_revision_id, profile_resolution_id, title) values
    (v_second, v_tenant, v_rev1, v_base, 'A later component assessment'),
    (v_third, v_tenant, v_rev1, v_base, 'A draft component assessment');
  perform public.record_component_determinations(v_tenant, v_second, v_shared1, array[v_a], 'other_than_satisfied', 'Found short on a retest.');
  perform public.record_component_determinations(v_tenant, v_third, v_shared1, array[v_b], 'satisfied', null);
  update public.component_assessments set state = 'published', published_at = now() + interval '1 hour', revision = revision + 1 where id = v_second;
  v_answer := public.component_control_status(v_shared1);
  if v_answer->'totals' <> '{"controls": 3, "satisfied": 0, "partially_satisfied": 1, "other_than_satisfied": 2, "not_assessed": 0, "carried": 0, "to_review": 0}'::jsonb
    or pg_temp.line(v_answer, v_a)->>'status' <> 'other_than_satisfied'
    or (pg_temp.line(v_answer, v_a)->>'assessment_id')::uuid <> v_second
    or pg_temp.line(v_answer, v_b)->>'status' <> 'partially_satisfied'
    or (pg_temp.line(v_answer, v_b)->>'assessment_id')::uuid <> v_assessment
    or jsonb_array_length(v_answer->'assessments') <> 2
    or (v_answer->'assessments'->0->>'id')::uuid <> v_second or (v_answer->'assessments'->0->>'determinations')::integer <> 1
    or (v_answer->'assessments'->1->>'id')::uuid <> v_assessment or (v_answer->'assessments'->1->>'determinations')::integer <> 2 then
    raise exception 'A component judged twice answered %', v_answer;
  end if;

  -- A product pins an element to each unit: the shared one in both configurations, the other in A.
  insert into public.products(id, tenant_id, code, name, business_line_id)
    values (v_product, v_tenant, 'CA-P', 'Component assessment test product', 'ca552000-0000-0000-0000-000000000001');
  insert into public.product_revisions(id, tenant_id, product_id, version_number) values (v_prev1, v_tenant, v_product, 1);
  insert into public.product_elements(id, tenant_id, product_revision_id, code, name, element_type, defined_component_id, position) values
    (v_e_shr, v_tenant, v_prev1, 'SHR', 'Shared element', 'software', v_shared1, 0),
    (v_e_oth, v_tenant, v_prev1, 'OTH', 'Other element', 'hardware', v_other1, 1),
    (v_e_plain, v_tenant, v_prev1, 'PLAIN', 'Plain element', 'other', null, 2);
  insert into public.product_configurations(id, tenant_id, product_id, code, name) values
    (v_config_a, v_tenant, v_product, 'A', 'Configuration A'),
    (v_config_b, v_tenant, v_product, 'B', 'Configuration B');
  insert into public.product_configuration_elements(tenant_id, product_revision_id, product_configuration_id, product_element_id) values
    (v_tenant, v_prev1, v_config_a, v_e_shr), (v_tenant, v_prev1, v_config_a, v_e_oth), (v_tenant, v_prev1, v_config_a, v_e_plain),
    (v_tenant, v_prev1, v_config_b, v_e_shr), (v_tenant, v_prev1, v_config_b, v_e_plain);
  update public.product_revisions set state = 'published', revision = revision + 1 where id = v_prev1;
  -- Two programs take configuration A: one as the product delivers it, one that leaves the shared
  -- element out.
  v_pin_shared := jsonb_build_object('revisionId', v_rev1, 'definedComponentId', v_shared1, 'rationale', 'Inherited from the test product.');
  v_pin_other := jsonb_build_object('revisionId', v_rev1, 'definedComponentId', v_other1, 'rationale', 'Inherited from the test product.');
  v_lineage := jsonb_build_object('revisionId', v_prev1, 'configurationId', v_config_a);
  v_variant := pg_temp.system('CA-V1', v_catalog, v_base, v_lineage, jsonb_build_array(
    jsonb_build_array('SHR', v_e_shr, v_pin_shared), jsonb_build_array('OTH', v_e_oth, v_pin_other),
    jsonb_build_array('PLAIN', v_e_plain, null)));
  v_pruned := pg_temp.system('CA-V2', v_catalog, v_base, v_lineage, jsonb_build_array(
    jsonb_build_array('OTH', v_e_oth, v_pin_other), jsonb_build_array('PLAIN', v_e_plain, null)));
  select * into v_shr_system from public.systems where tenant_id = v_tenant and code = 'CA-V1-SHR';
  select c.id into v_shr_component from public.system_components c
    where c.tenant_id = v_tenant and c.system_id = v_variant and c.defined_component_id = v_shared1;
  if v_shr_component is null then
    raise exception 'The variant holds no system component built from the shared unit';
  end if;

  -- Where the shared unit is used while nobody is behind: the product's element with its
  -- configurations, the program that holds it, and the program that left it out.
  v_answer := public.component_consumers(v_shared1);
  v_totals := v_answer->'totals';
  if v_totals <> '{"products": 1, "product_elements": 1, "programs": 1, "systems": 1, "system_components": 1, "behind": 0, "modified": 0, "removed": 1}'::jsonb
    or (v_answer->'latest'->>'version')::integer <> 1 or (v_answer->'latest'->>'defined_component_id')::uuid <> v_shared1
    or jsonb_array_length(v_answer->'products') <> 1
    or v_answer->'products'->0->>'element_code' <> 'SHR' or v_answer->'products'->0->>'product_code' <> 'CA-P'
    or not (v_answer->'products'->0->>'current')::boolean or (v_answer->'products'->0->>'behind')::integer <> 0
    or jsonb_array_length(v_answer->'products'->0->'configurations') <> 2
    or v_answer->'products'->0->'configurations'->0->>'code' <> 'A'
    or jsonb_array_length(v_answer->'systems') <> 2
    or (v_answer->'systems'->0->>'system_component_id')::uuid <> v_shr_component
    or v_answer->'systems'->0->>'program_code' <> 'CA-V1' or v_answer->'systems'->0->>'element_code' <> 'CA-V1-SHR'
    or (v_answer->'systems'->0->>'system_id')::uuid <> v_variant
    or v_answer->'systems'->0->>'change' <> 'inherited' or v_answer->'systems'->0->'pin' <> 'null'::jsonb
    or (v_answer->'systems'->0->>'version')::integer <> 1 or (v_answer->'systems'->0->>'behind')::integer <> 0
    or v_answer->'systems'->1->>'change' <> 'removed' or v_answer->'systems'->1->>'program_code' <> 'CA-V2'
    or (v_answer->'systems'->1->>'system_id')::uuid <> v_pruned or v_answer->'systems'->1->>'element_code' <> 'SHR'
    or v_answer->'systems'->1->'system_component_id' <> 'null'::jsonb then
    raise exception 'A component nobody is behind on answered %', v_answer;
  end if;

  -- The program changes the element it inherited, and pins the component in a configuration baseline.
  perform public.declare_product_element_change(v_tenant, v_shr_system.id, v_shr_system.revision, array['software'], 'A customer build of the shared unit.');
  insert into public.configuration_baselines(id, tenant_id, system_id, version_number, name) values (v_baseline, v_tenant, v_variant, 1, 'Block 1');
  insert into public.component_pins(tenant_id, system_id, configuration_baseline_id, system_component_id, defined_component_id, version)
    values (v_tenant, v_variant, v_baseline, v_shr_component, v_shared1, '1.4.2');
  -- The component set's second version is published with both units, and a third program takes the
  -- shared unit from it. The product's next version, still a draft, pins the newer unit.
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values (v_rev2, v_tenant, v_definition, 2);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values
    (v_shared2, v_tenant, v_rev2, 'Shared unit', 'software'), (v_other2, v_tenant, v_rev2, 'Other unit', 'hardware');
  insert into public.defined_component_implementations(tenant_id, component_definition_revision_id, defined_component_id, control_id, description, implementation_status) values
    (v_tenant, v_rev2, v_shared2, v_a, 'The shared unit enforces it.', 'implemented'),
    (v_tenant, v_rev2, v_shared2, v_b, 'The shared unit enforces it whole.', 'implemented'),
    (v_tenant, v_rev2, v_shared2, v_e, 'The shared unit now records it.', 'implemented');
  update public.component_definition_revisions set state = 'published', revision = revision + 1 where id = v_rev2;
  v_own := pg_temp.system('CA-V3', v_catalog, v_base, null, jsonb_build_array(
    jsonb_build_array('OWN', null, jsonb_build_object('revisionId', v_rev2, 'definedComponentId', v_shared2, 'rationale', 'Taken from the library.'))));
  insert into public.product_revisions(id, tenant_id, product_id, version_number) values (v_prev2, v_tenant, v_product, 2);
  insert into public.product_elements(id, tenant_id, product_revision_id, code, name, element_type, defined_component_id, position)
    values (v_e_shr2, v_tenant, v_prev2, 'SHR', 'Shared element', 'software', v_shared2, 0);
  insert into public.product_configuration_elements(tenant_id, product_revision_id, product_configuration_id, product_element_id)
    values (v_tenant, v_prev2, v_config_a, v_e_shr2);

  -- Where the shared unit is used now, asked of its newer version: every version's consumers, each
  -- with the version it took. The product's current version and the first program are behind by
  -- one; the first program's element is modified and pinned; the second program left it out; the
  -- third took the newer version.
  v_answer := public.component_consumers(v_shared2);
  v_totals := v_answer->'totals';
  if v_totals <> '{"products": 1, "product_elements": 2, "programs": 2, "systems": 2, "system_components": 2, "behind": 2, "modified": 1, "removed": 1}'::jsonb
    or (v_answer->'component'->>'version')::integer <> 2 or (v_answer->'component'->>'owner_party_id')::uuid <> 'ca551000-0000-0000-0000-000000000001'
    or (v_answer->'latest'->>'version')::integer <> 2 or (v_answer->'latest'->>'defined_component_id')::uuid <> v_shared2
    or jsonb_array_length(v_answer->'products') <> 2
    or (v_answer->'products'->0->>'product_version')::integer <> 2 or (v_answer->'products'->0->>'current')::boolean
    or v_answer->'products'->0->>'product_state' <> 'draft' or (v_answer->'products'->0->>'behind')::integer <> 0
    or (v_answer->'products'->0->>'version')::integer <> 2
    or (v_answer->'products'->1->>'product_version')::integer <> 1 or not (v_answer->'products'->1->>'current')::boolean
    or (v_answer->'products'->1->>'behind')::integer <> 1 or (v_answer->'products'->1->>'version')::integer <> 1
    or jsonb_array_length(v_answer->'systems') <> 3 then
    raise exception 'A component with consumers behind answered %', v_answer;
  end if;
  v_line := v_answer->'systems'->0;
  if v_line->>'program_code' <> 'CA-V1' or v_line->>'change' <> 'modified' or v_line->'change_kinds' <> '["software"]'::jsonb
    or v_line->>'change_rationale' <> 'A customer build of the shared unit.'
    or (v_line->>'version')::integer <> 1 or (v_line->>'behind')::integer <> 1
    or v_line->'pin'->>'version' <> '1.4.2' or v_line->'pin'->>'name' <> 'Block 1' or v_line->'pin'->>'state' <> 'draft'
    or (v_line->'pin'->>'configuration_baseline_id')::uuid <> v_baseline
    or (v_line->>'product_element_id')::uuid <> v_e_shr then
    raise exception 'A modified consumer that is behind read %', v_line;
  end if;
  v_line := v_answer->'systems'->1;
  if v_line->>'program_code' <> 'CA-V2' or v_line->>'change' <> 'removed' or (v_line->>'behind')::integer <> 1 then
    raise exception 'A consumer that left the element out read %', v_line;
  end if;
  v_line := v_answer->'systems'->2;
  if v_line->>'program_code' <> 'CA-V3' or v_line->'change' <> 'null'::jsonb or (v_line->>'version')::integer <> 2
    or (v_line->>'behind')::integer <> 0 or (v_line->>'defined_component_id')::uuid <> v_shared2
    or (v_line->>'system_id')::uuid <> v_own or v_line->>'element_code' <> 'CA-V3-OWN' then
    raise exception 'A consumer of the newer version read %', v_line;
  end if;
  -- Asked of the older version, the same consumers answer.
  v_again := public.component_consumers(v_shared1);
  if v_again->'totals' <> v_totals or v_again->'systems' <> v_answer->'systems' or v_again->'products' <> v_answer->'products'
    or (v_again->'component'->>'version')::integer <> 1 or (v_again->'latest'->>'defined_component_id')::uuid <> v_shared2 then
    raise exception 'The older version''s consumers answered %', v_again;
  end if;
  -- The other unit is used by the product's first version and both variants, each behind by one.
  v_totals := public.component_consumers(v_other1)->'totals';
  if v_totals <> '{"products": 1, "product_elements": 1, "programs": 2, "systems": 2, "system_components": 2, "behind": 3, "modified": 0, "removed": 0}'::jsonb then
    raise exception 'The other unit''s consumers total %', v_totals;
  end if;

  -- A component that names no element sits on its system, and on the element a single inventory
  -- item gives it, as an imported component does (system_component_element_links).
  select c.id into v_own_component from public.system_components c
    where c.tenant_id = v_tenant and c.system_id = v_own and c.defined_component_id = v_shared2;
  select e.id into v_own_element from public.systems e where e.tenant_id = v_tenant and e.code = 'CA-V3-OWN';
  update public.system_components set system_element_id = null, revision = revision + 1 where id = v_own_component;
  select x into v_line from jsonb_array_elements(public.component_consumers(v_shared2)->'systems') x
    where x->>'system_component_id' = v_own_component::text;
  if v_line->>'element_code' <> 'CA-V3-SYS' or (v_line->>'element_id')::uuid <> v_own
    or jsonb_array_length(public.system_upstream(v_own_element)->'components') <> 0 then
    raise exception 'A component that names no element read %', v_line;
  end if;
  insert into public.inventory_items(id, tenant_id, system_id, composition_node_id, asset_id, name)
    values (v_inventory_item, v_tenant, v_own, v_own_element, 'CA-ASSET-1', 'Shared unit, serial 1');
  insert into public.inventory_components(tenant_id, system_id, inventory_item_id, system_component_id)
    values (v_tenant, v_own, v_inventory_item, v_own_component);
  select x into v_line from jsonb_array_elements(public.component_consumers(v_shared2)->'systems') x
    where x->>'system_component_id' = v_own_component::text;
  if v_line->>'element_code' <> 'CA-V3-OWN' or (v_line->>'element_id')::uuid <> v_own_element
    or (public.system_upstream(v_own_element)->'components'->0->>'system_component_id')::uuid <> v_own_component then
    raise exception 'A component its inventory item places on an element read %', v_line;
  end if;

  -- What the first variant takes from above: its product, and each library component with the
  -- version taken, the latest published one and the component version's standing.
  v_answer := public.system_upstream(v_variant);
  if v_answer->'product'->>'code' <> 'CA-P' or (v_answer->'product'->>'version')::integer <> 1
    or v_answer->'product'->>'configuration_code' <> 'A' or (v_answer->'product'->>'latest_version')::integer <> 1
    or (v_answer->'product'->>'behind')::integer <> 0
    or (v_answer->>'boundary_system_id')::uuid <> v_variant
    or v_answer->'totals' <> '{"components": 2, "behind": 2, "modified": 1, "assessed": 2, "controls_judged": 4, "controls_inherited": 1}'::jsonb
    or jsonb_array_length(v_answer->'components') <> 2 then
    raise exception 'A variant''s upstream answered %', v_answer;
  end if;
  select c into v_line from jsonb_array_elements(v_answer->'components') c where c->>'system_component_id' = v_shr_component::text;
  if (v_line->>'defined_component_id')::uuid <> v_shared1 or v_line->>'definition_code' <> 'ca-units'
    or (v_line->>'version')::integer <> 1 or (v_line->>'latest_version')::integer <> 2 or (v_line->>'behind')::integer <> 1
    or (v_line->>'latest_revision_id')::uuid <> v_rev2
    or v_line->>'change' <> 'modified' or v_line->'change_kinds' <> '["software"]'::jsonb
    or v_line->'pin'->>'version' <> '1.4.2' or v_line->>'element_code' <> 'CA-V1-SHR'
    or (v_line->>'owner_party_id')::uuid <> 'ca551000-0000-0000-0000-000000000001'
    or v_line->'standing' <> '{"controls": 3, "satisfied": 0, "partially_satisfied": 1, "other_than_satisfied": 2, "not_assessed": 0, "carried": 0, "to_review": 0}'::jsonb then
    raise exception 'A variant''s shared component read %', v_line;
  end if;
  -- An element inside the variant answers its own components alone.
  v_answer := public.system_upstream(v_shr_system.id);
  if jsonb_array_length(v_answer->'components') <> 1 or (v_answer->'components'->0->>'system_component_id')::uuid <> v_shr_component
    or (v_answer->>'boundary_system_id')::uuid <> v_variant or v_answer->'product'->>'code' <> 'CA-P'
    or v_answer->'totals' <> '{"components": 1, "behind": 1, "modified": 1, "assessed": 1, "controls_judged": 3, "controls_inherited": 0}'::jsonb then
    raise exception 'An element''s upstream answered %', v_answer;
  end if;
  -- A system that was not created from a product names none; the newer component version it took
  -- stands on what version 1 was judged on, carried forward, since nobody assessed that version,
  -- and on the control it claims for the first time, which nobody judged.
  v_answer := public.system_upstream(v_own);
  if v_answer->'product' <> 'null'::jsonb or jsonb_array_length(v_answer->'components') <> 1
    or (v_answer->'components'->0->>'version')::integer <> 2 or (v_answer->'components'->0->>'behind')::integer <> 0
    or v_answer->'components'->0->'change' <> 'null'::jsonb
    or v_answer->'components'->0->'standing' <> '{"controls": 4, "satisfied": 0, "partially_satisfied": 1, "other_than_satisfied": 2, "not_assessed": 1, "carried": 3, "to_review": 0}'::jsonb
    or v_answer->'totals' <> '{"components": 1, "behind": 0, "modified": 0, "assessed": 1, "controls_judged": 3, "controls_inherited": 3}'::jsonb then
    raise exception 'A plain system''s upstream answered %', v_answer;
  end if;
  -- Once the product's next version is published, the variant is behind its product too.
  update public.product_revisions set state = 'published', revision = revision + 1 where id = v_prev2;
  v_answer := public.system_upstream(v_variant);
  if (v_answer->'product'->>'latest_version')::integer <> 2 or (v_answer->'product'->>'behind')::integer <> 1
    or (v_answer->'product'->>'latest_revision_id')::uuid <> v_prev2 then
    raise exception 'A variant behind its product answered %', v_answer->'product';
  end if;
  -- The product's current version now pins the newer unit, so the product is no longer behind.
  v_totals := public.component_consumers(v_shared2)->'totals';
  if v_totals <> '{"products": 1, "product_elements": 2, "programs": 2, "systems": 2, "system_components": 2, "behind": 1, "modified": 1, "removed": 1}'::jsonb then
    raise exception 'Once the product pins the newer unit its consumers total %', v_totals;
  end if;

  -- The newer version is assessed in turn, through the commands.
  insert into public.component_assessments(id, tenant_id, component_definition_revision_id, profile_resolution_id, title, assessor_party_id)
    values (v_newer, v_tenant, v_rev2, v_base, 'Version 2 component assessment', v_assessor);
  perform public.record_component_determinations(v_tenant, v_newer, v_shared2, array[v_a, v_b], 'satisfied', null);
  perform public.record_component_determinations(v_tenant, v_newer, v_shared2, array[v_e], 'partially_satisfied', 'Records, does not yet alert.');
  perform public.publish_component_assessment(v_tenant, v_newer, 1, 3, gen_random_uuid(), '2026-10-15');

  -- The register: one row a component of each definition's latest published version, else of its
  -- latest, with its owner, its consumers through every version and this version's standing.
  select count(*) into v_count from public.component_rows r where r.tenant_id = v_tenant;
  if v_count <> 3 then
    raise exception 'The register lists % components, not the two of the latest version and the draft set''s one', v_count;
  end if;
  select * into v_register from public.component_rows r where r.id = v_shared2;
  if v_register.name <> 'Shared unit' or v_register.definition_code <> 'ca-units' or v_register.component_type <> 'software'
    or v_register.version <> 2 or v_register.state <> 'published' or v_register.component_definition_revision_id <> v_rev2
    or v_register.owner_name <> 'Component owner' or v_register.business_line_name <> 'Component assessment line'
    or v_register.business_line_code <> 'CA'
    or v_register.products <> 1 or v_register.programs <> 2
    or v_register.consumers_behind <> 1 or v_register.consumers_modified <> 1
    -- Three determinations of its own, and the one version 1 was judged on and it was not, carried
    -- forward.
    or v_register.controls_claimed <> 3 or v_register.controls_determined <> 4 or v_register.controls_satisfied <> 2
    or v_register.controls_partially_satisfied <> 1 or v_register.controls_other_than_satisfied <> 1
    or v_register.controls_to_review <> 0
    or v_register.assessment_id <> v_newer or v_register.assessment_title <> 'Version 2 component assessment'
    or v_register.assessed_on <> '2026-10-15' then
    raise exception 'The shared unit''s row read %', to_jsonb(v_register);
  end if;
  select * into v_register from public.component_rows r where r.id = v_other2;
  if v_register.products <> 0 or v_register.programs <> 2 or v_register.consumers_behind <> 2 or v_register.consumers_modified <> 0
    -- Nobody assessed its version 2: the one determination that stands on it is version 1's,
    -- carried forward.
    or v_register.controls_claimed <> 0 or v_register.controls_determined <> 1 or v_register.controls_satisfied <> 1
    or v_register.controls_to_review <> 0 or v_register.assessment_title <> 'Component assessment' then
    raise exception 'The other unit''s row read %', to_jsonb(v_register);
  end if;
  select * into v_register from public.component_rows r where r.id = v_else;
  if v_register.state <> 'draft' or v_register.version <> 1 or v_register.definition_code <> 'ca-else'
    or v_register.owner_party_id is not null or v_register.owner_name is not null or v_register.business_line_id is not null
    or v_register.products <> 0 or v_register.programs <> 0 or v_register.consumers_behind <> 0 then
    raise exception 'A draft set''s row read %', to_jsonb(v_register);
  end if;
  if exists (select 1 from public.component_rows r where r.id in (v_shared1, v_other1)) then
    raise exception 'The register lists a component of an older version';
  end if;

  perform set_config('test.assessment', v_assessment::text, true);
  perform set_config('test.draft', v_third::text, true);
  perform set_config('test.shared', v_shared1::text, true);
  perform set_config('test.variant', v_variant::text, true);
  perform set_config('test.control', v_a::text, true);
end $$;

-- A viewer reads what a member reads and writes nothing.
do $$
begin
  if current_setting('test.assessment', true) is null or current_setting('test.assessment', true) = '' then return; end if;
  perform set_config('request.jwt.claim.sub', 'ca550000-0000-0000-0000-000000000003', true);
  if public.component_assessment_sheet(current_setting('test.assessment')::uuid) is null
    or (public.component_control_status(current_setting('test.shared')::uuid)->'totals'->>'controls')::integer <> 3
    or (public.component_consumers(current_setting('test.shared')::uuid)->'totals'->>'programs')::integer <> 2
    or (public.system_upstream(current_setting('test.variant')::uuid)->'totals'->>'components')::integer <> 2
    or (select count(*) from public.component_rows) <> 3 then
    raise exception 'A viewer does not read what a member reads';
  end if;
  perform pg_temp.expect_error(format($q$select public.record_component_determinations(%L, %L, %L, array[%L]::uuid[], 'satisfied', null)$q$,
    current_setting('test.tenant'), current_setting('test.draft'), current_setting('test.shared'), current_setting('test.control')), '42501');
  perform pg_temp.expect_error(format($q$select public.publish_component_assessment(%L, %L, 1, 1, %L)$q$,
    current_setting('test.tenant'), current_setting('test.draft'), gen_random_uuid()), '42501');
  perform pg_temp.expect_error(format(
    $q$insert into public.component_assessments(tenant_id, component_definition_revision_id, profile_resolution_id, title)
      select a.tenant_id, a.component_definition_revision_id, a.profile_resolution_id, 'A viewer''s assessment'
      from public.component_assessments a where a.id = %L$q$, current_setting('test.assessment')), '42501');
  -- Row-level security leaves a viewer's update of the component's owner with no row to change.
  update public.component_definitions set owner_party_id = null, revision = revision + 1
    where id = 'ca553000-0000-0000-0000-000000000001';
  if (select owner_party_id from public.component_definitions where id = 'ca553000-0000-0000-0000-000000000001') is null then
    raise exception 'A viewer changed a component''s owner';
  end if;
end $$;

-- A workspace that cannot read the component or the system is refused, never answered as empty.
do $$
begin
  if current_setting('test.assessment', true) is null or current_setting('test.assessment', true) = '' then return; end if;
  perform set_config('request.jwt.claim.sub', 'ca550000-0000-0000-0000-000000000002', true);
  perform pg_temp.expect_error(format($q$select public.component_control_status(%L)$q$, current_setting('test.shared')), '42501');
  perform pg_temp.expect_error(format($q$select public.component_consumers(%L)$q$, current_setting('test.shared')), '42501');
  perform pg_temp.expect_error(format($q$select public.system_upstream(%L)$q$, current_setting('test.variant')), '42501');
  -- The assessment is not there for them: no sheet, and nothing said of it.
  if public.component_assessment_sheet(current_setting('test.assessment')::uuid) is not null then
    raise exception 'Another workspace read a component assessment''s sheet';
  end if;
  if exists (select 1 from public.component_rows) or exists (select 1 from public.component_assessments)
    or exists (select 1 from public.component_determinations)
    or exists (select 1 from public.component_lineage(current_setting('test.shared')::uuid))
    or exists (select 1 from public.component_standing_lines(array[current_setting('test.shared')::uuid])) then
    raise exception 'Another workspace reads a component assessment';
  end if;
  -- Nor do they write it, in its workspace's name or in their own.
  perform pg_temp.expect_error(format($q$select public.record_component_determinations(%L, %L, %L, array[%L]::uuid[], 'satisfied', null)$q$,
    current_setting('test.tenant'), current_setting('test.draft'), current_setting('test.shared'), current_setting('test.control')), '42501');
  perform pg_temp.expect_error(format($q$select public.record_component_determinations(%L, %L, %L, array[%L]::uuid[], 'satisfied', null)$q$,
    current_setting('test.other_tenant'), current_setting('test.draft'), current_setting('test.shared'), current_setting('test.control')), 'PT404');
  perform pg_temp.expect_error(format($q$select public.publish_component_assessment(%L, %L, 1, 1, %L)$q$,
    current_setting('test.tenant'), current_setting('test.draft'), gen_random_uuid()), '42501');
  perform pg_temp.expect_error(format($q$select public.publish_component_assessment(%L, %L, 1, 1, %L)$q$,
    current_setting('test.other_tenant'), current_setting('test.draft'), gen_random_uuid()), 'PT404');
  -- A session with no account is refused.
  perform set_config('request.jwt.claim.sub', '', true);
  perform pg_temp.expect_error(format($q$select public.component_control_status(%L)$q$, current_setting('test.shared')), '42501');
  perform pg_temp.expect_error(format($q$select public.component_assessment_sheet(%L)$q$, current_setting('test.assessment')), '42501');
  perform pg_temp.expect_error(format($q$select public.system_upstream(%L)$q$, current_setting('test.variant')), '42501');
end $$;

rollback;
