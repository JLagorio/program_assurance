-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Component offers: who may read and write a component's own owner and an offer, and whom the three
-- commands refuse; the effective owner (the component's own over its set's) in every read that
-- answers one; each refusal of an offer in its words (a component built from no library component,
-- an element the program declared modified, an item that is not the program's, a finding of draft
-- results or with no determination, two findings on one control, an item already offered or
-- accepted); a request sent again; withdrawing and returning an offer; accepting a finding, which
-- opens one operational issue in every other program built from the same component version, one a
-- program and none twice; accepting determinations, which publishes them as a component assessment
-- citing the findings and changes the component's standing; the Review queue's row joining and
-- leaving; what component_consumers and system_upstream gain; and the tenant boundary.
begin;
create function pg_temp.expect_error(statement text, expected_state text, expected_words text default null) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_state and (expected_words is null or sqlerrm like '%' || expected_words || '%') then return; end if;
    raise exception 'Expected SQLSTATE % saying "%", got %: %', expected_state, expected_words, sqlstate, sqlerrm;
  end;
  raise exception 'Statement unexpectedly succeeded: %', statement;
end;
$$;
grant execute on function pg_temp.expect_error(text, text, text) to authenticated, anon;

-- ---------------------------------------------------------------------------------------------
-- Who may ask and who may write.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_function text; v_relation text;
begin
  foreach v_function in array array[
    'public.offer_to_component(uuid, uuid, text, uuid[], text, text, uuid)',
    'public.withdraw_component_offer(uuid, uuid, bigint, uuid)',
    'public.review_component_offer(uuid, uuid, bigint, text, text, uuid)',
    'public.component_owner_party(uuid)',
    'public.component_control_status(uuid)', 'public.component_consumers(uuid)', 'public.system_upstream(uuid)'] loop
    if has_function_privilege('anon', v_function, 'execute') or has_function_privilege('public', v_function, 'execute') then
      raise exception 'An anonymous session may execute %', v_function;
    end if;
    if not has_function_privilege('authenticated', v_function, 'execute') then
      raise exception 'A signed-in session may not execute %', v_function;
    end if;
  end loop;
  -- The reads run as their caller, so row-level security decides every row.
  foreach v_function in array array[
    'public.component_owner_party(uuid)',
    'public.component_control_status(uuid)', 'public.component_consumers(uuid)', 'public.system_upstream(uuid)'] loop
    if (select p.prosecdef from pg_catalog.pg_proc p where p.oid = v_function::regprocedure) then
      raise exception '% does not run as its caller', v_function;
    end if;
  end loop;
  -- The commands' helpers are theirs alone.
  foreach v_function in array array[
    'public.component_offer_words(text, bigint)',
    'public.record_component_offer_event(public.component_offers, uuid, text, text, text, timestamptz)'] loop
    if has_function_privilege('authenticated', v_function, 'execute') or has_function_privilege('anon', v_function, 'execute') then
      raise exception 'A client may execute %', v_function;
    end if;
  end loop;
  foreach v_relation in array array[
    'public.component_owners', 'public.component_offers', 'public.component_offer_items',
    'public.component_offer_issues', 'public.component_offer_rows', 'public.component_offer_requests',
    'public.review_queue_rows', 'public.component_rows'] loop
    if has_table_privilege('anon', v_relation, 'select') then
      raise exception 'An anonymous session may read %', v_relation;
    end if;
  end loop;
  -- Clients read the offers and write none of them; the receipts are read by no client.
  foreach v_relation in array array[
    'public.component_offers', 'public.component_offer_items', 'public.component_offer_issues'] loop
    if not has_table_privilege('authenticated', v_relation, 'select')
      or has_table_privilege('authenticated', v_relation, 'insert')
      or has_table_privilege('authenticated', v_relation, 'update')
      or has_table_privilege('authenticated', v_relation, 'delete') then
      raise exception 'A signed-in session does not read % alone', v_relation;
    end if;
    if not (select c.relrowsecurity from pg_catalog.pg_class c where c.oid = v_relation::regclass) then
      raise exception '% has no row-level security', v_relation;
    end if;
  end loop;
  if has_table_privilege('authenticated', 'public.component_offer_requests', 'select')
    or has_table_privilege('authenticated', 'public.component_offer_requests', 'insert') then
    raise exception 'A signed-in session reaches the offers'' receipts';
  end if;
  if not has_table_privilege('authenticated', 'public.component_owners', 'select')
    or not has_table_privilege('authenticated', 'public.component_owners', 'insert') then
    raise exception 'A signed-in session may not name a component''s owner';
  end if;
  foreach v_relation in array array['public.component_offer_rows', 'public.review_queue_rows', 'public.component_rows'] loop
    if not exists (select 1 from pg_catalog.pg_class c where c.oid = v_relation::regclass
        and c.reloptions @> array['security_invoker=true'])
      or not has_table_privilege('authenticated', v_relation, 'select') then
      raise exception '% does not read as a signed-in caller', v_relation;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------------------------
-- A workspace: its owner, whose own party the commands record, and a viewer; and a member of
-- another workspace.
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email, raw_user_meta_data) values
  ('c0ff0000-0000-0000-0000-000000000001', 'component-offer-owner@example.test', '{"name":"Component offer test owner"}'),
  ('c0ff0000-0000-0000-0000-000000000002', 'component-offer-outsider@example.test', '{}'),
  ('c0ff0000-0000-0000-0000-000000000003', 'component-offer-viewer@example.test', '{}');
select set_config('request.jwt.claim.sub', 'c0ff0000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'c0ff0000-0000-0000-0000-000000000003', 'viewer');
insert into public.parties(id, tenant_id, party_type, name, auth_user_id) values
  ('c0ff1000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'person', 'Set owner', null),
  ('c0ff1000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'person', 'Component owner', null),
  ('c0ff1000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'person', 'Offer assessor', null);
insert into public.component_definitions(id, tenant_id, code, name, owner_party_id) values
  ('c0ff3000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'co-units', 'Component offer units',
   'c0ff1000-0000-0000-0000-000000000001');
select set_config('request.jwt.claim.sub', 'c0ff0000-0000-0000-0000-000000000002', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
insert into public.parties(id, tenant_id, party_type, name) values
  ('c0ff1000-0000-0000-0000-000000000009', current_setting('test.other_tenant')::uuid, 'person', 'Someone elsewhere');
select set_config('request.jwt.claim.sub', 'c0ff0000-0000-0000-0000-000000000001', true);

-- ---------------------------------------------------------------------------------------------
-- With the pinned references installed.
-- ---------------------------------------------------------------------------------------------
create function pg_temp.line(answer jsonb, control uuid) returns jsonb language sql stable as $$
  select c from jsonb_array_elements(answer->'controls') c where c->>'id' = control::text;
$$;
-- One system line of component_consumers, by its program's code.
create function pg_temp.consumer(answer jsonb, program text) returns jsonb language sql stable as $$
  select s from jsonb_array_elements(answer->'systems') s where s->>'program_code' = program;
$$;
-- One component line of system_upstream, by the library component's name.
create function pg_temp.taken(answer jsonb, component text) returns jsonb language sql stable as $$
  select c from jsonb_array_elements(answer->'components') c where c->>'component_name' = component;
$$;
-- A program with one system, created from a configuration of a product (`product`) or not.
-- `elements` is a list of [code, product element id or null, library pin or null].
create function pg_temp.system(p_code text, catalog uuid, base uuid, product jsonb, elements jsonb) returns uuid
language plpgsql as $$
declare profile uuid := gen_random_uuid();
begin
  perform public.create_program_wizard(current_setting('test.tenant')::uuid, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', p_code, 'name', p_code || ' component offer test', 'description', '',
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
-- A campaign of a program whose plan is published on the system's SSP, with one results revision
-- holding a result set: returns the results revision. The SSP is published first if it is a draft.
create function pg_temp.results(p_system uuid, p_title text, out results_id uuid, out set_id uuid, out campaign_id uuid)
language plpgsql as $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_program uuid; v_ssp public.ssp_revisions; v_plan uuid := gen_random_uuid();
begin
  select s.program_id into v_program from public.systems s where s.id = p_system;
  select * into v_ssp from public.ssp_revisions r where r.tenant_id = v_tenant and r.system_id = p_system
    order by r.version_number desc limit 1;
  if v_ssp.state = 'draft' then
    update public.ssp_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_ssp.id;
  end if;
  campaign_id := gen_random_uuid(); results_id := gen_random_uuid(); set_id := gen_random_uuid();
  insert into public.assessment_campaigns(id, tenant_id, title, program_id) values (campaign_id, v_tenant, p_title || ' campaign', v_program);
  insert into public.assessment_plan_revisions(id, tenant_id, version_number, campaign_id, ssp_revision_id, title)
    values (v_plan, v_tenant, 1, campaign_id, v_ssp.id, p_title || ' plan');
  update public.assessment_plan_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_plan;
  insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title)
    values (results_id, v_tenant, 1, v_plan, p_title);
  insert into public.result_sets(id, tenant_id, assessment_results_revision_id, title) values (set_id, v_tenant, results_id, p_title || ' set');
end;
$$;
grant execute on function pg_temp.line(jsonb, uuid), pg_temp.consumer(jsonb, text), pg_temp.taken(jsonb, text),
  pg_temp.system(text, uuid, uuid, jsonb, jsonb), pg_temp.results(uuid, text) to authenticated;

do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_other_tenant uuid := current_setting('test.other_tenant')::uuid;
  v_owner_user uuid := 'c0ff0000-0000-0000-0000-000000000001';
  v_outsider uuid := 'c0ff0000-0000-0000-0000-000000000002';
  v_viewer uuid := 'c0ff0000-0000-0000-0000-000000000003';
  v_definition uuid := 'c0ff3000-0000-0000-0000-000000000001';
  v_set_owner uuid := 'c0ff1000-0000-0000-0000-000000000001';
  v_named_owner uuid := 'c0ff1000-0000-0000-0000-000000000002';
  v_assessor uuid := 'c0ff1000-0000-0000-0000-000000000003';
  v_account uuid; v_account_name text;
  v_catalog uuid; v_base uuid; v_a uuid; v_b uuid; v_c uuid; v_out uuid;
  v_part_a uuid; v_part_a2 uuid; v_part_b uuid; v_part_c uuid; v_part_out uuid;
  v_rev1 uuid := gen_random_uuid(); v_rev2 uuid := gen_random_uuid();
  v_shared1 uuid := gen_random_uuid(); v_other1 uuid := gen_random_uuid(); v_shared2 uuid := gen_random_uuid();
  v_product uuid := gen_random_uuid(); v_prev uuid := gen_random_uuid(); v_e_shr uuid := gen_random_uuid();
  v_config uuid := gen_random_uuid();
  v_pin_shared jsonb; v_pin_other jsonb;
  v_p1 uuid; v_p2 uuid; v_p3 uuid; v_p4 uuid;
  v_g1 uuid; v_g2 uuid; v_g3 uuid; v_g4 uuid;
  v_c1 uuid; v_c1_other uuid; v_c2 uuid; v_c4 uuid; v_plain uuid := gen_random_uuid();
  v_element public.systems;
  v_i1 uuid := gen_random_uuid(); v_i2 uuid := gen_random_uuid(); v_i_else uuid := gen_random_uuid(); v_i4 uuid := gen_random_uuid();
  v_published record; v_draft record; v_elsewhere record;
  v_f_a uuid := gen_random_uuid(); v_f_a2 uuid := gen_random_uuid(); v_f_b uuid := gen_random_uuid();
  v_f_none uuid := gen_random_uuid(); v_f_out uuid := gen_random_uuid(); v_f_draft uuid := gen_random_uuid();
  v_f_else uuid := gen_random_uuid();
  v_earlier uuid := gen_random_uuid();
  v_request uuid := gen_random_uuid(); v_request2 uuid := gen_random_uuid(); v_request3 uuid := gen_random_uuid();
  v_o1 uuid; v_o2 uuid; v_o3 uuid; v_o4 uuid; v_o5 uuid;
  v_offer public.component_offers; v_queue public.review_queue_rows; v_row public.component_offer_rows;
  v_register public.component_rows; v_assessment public.component_assessments;
  v_result jsonb; v_again jsonb; v_answer jsonb; v_line jsonb; v_count integer; v_events integer; v_issues integer;
  v_event public.activity_events;
begin
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) >= 5
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the checks of an offer were skipped';
    return;
  end if;
  -- The owner's own party, which the commands record as who offered and who reviewed.
  select p.id, p.name into v_account, v_account_name from public.parties p
    where p.tenant_id = v_tenant and p.auth_user_id = v_owner_user;
  if v_account is null then
    raise exception 'The workspace''s owner has no party';
  end if;
  -- Three controls of the baseline an assessor can judge (A on two of its parts), and one outside it.
  select x.control_id, x.part, x.second into v_a, v_part_a, v_part_a2
  from (select sc.control_id, sc.ordinal,
      (array_agg(p.id order by p.ordinal, p.id))[1] as part, (array_agg(p.id order by p.ordinal, p.id))[2] as second
    from public.selected_controls sc join public.control_parts p on p.control_id = sc.control_id
    where sc.profile_resolution_id = v_base group by sc.control_id, sc.ordinal having count(*) > 1) x
  order by x.ordinal, x.control_id limit 1;
  select x.control_id, x.part into v_b, v_part_b
  from (select sc.control_id, sc.ordinal, (array_agg(p.id order by p.ordinal, p.id))[1] as part
    from public.selected_controls sc join public.control_parts p on p.control_id = sc.control_id
    where sc.profile_resolution_id = v_base and sc.control_id <> v_a group by sc.control_id, sc.ordinal) x
  order by x.ordinal, x.control_id limit 1;
  select x.control_id, x.part into v_c, v_part_c
  from (select sc.control_id, sc.ordinal, (array_agg(p.id order by p.ordinal, p.id))[1] as part
    from public.selected_controls sc join public.control_parts p on p.control_id = sc.control_id
    where sc.profile_resolution_id = v_base and sc.control_id not in (v_a, v_b) group by sc.control_id, sc.ordinal) x
  order by x.ordinal, x.control_id limit 1;
  select k.id, (select p.id from public.control_parts p where p.control_id = k.id order by p.ordinal, p.id limit 1)
    into v_out, v_part_out
  from public.controls k
  where k.catalog_revision_id = v_catalog
    and exists (select 1 from public.control_parts p where p.control_id = k.id)
    and not exists (select 1 from public.selected_controls sc where sc.profile_resolution_id = v_base and sc.control_id = k.id)
  order by k.code limit 1;
  if v_a is null or v_b is null or v_c is null or v_out is null then
    raise exception 'The pinned references hold no controls the test can judge';
  end if;

  -- The component set: version 1 with a shared unit, which claims A and B, and another unit;
  -- version 2 with the shared unit again. Both are published.
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values
    (v_rev1, v_tenant, v_definition, 1);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values
    (v_shared1, v_tenant, v_rev1, 'Shared unit', 'software'), (v_other1, v_tenant, v_rev1, 'Other unit', 'hardware');
  insert into public.defined_component_implementations(tenant_id, component_definition_revision_id, defined_component_id, control_id, description, implementation_status) values
    (v_tenant, v_rev1, v_shared1, v_a, 'The shared unit enforces it.', 'implemented'),
    (v_tenant, v_rev1, v_shared1, v_b, 'The shared unit provides the mechanism.', 'implemented');
  update public.component_definition_revisions set state = 'published', revision = revision + 1 where id = v_rev1;
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values
    (v_rev2, v_tenant, v_definition, 2);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values
    (v_shared2, v_tenant, v_rev2, 'Shared unit', 'software');
  update public.component_definition_revisions set state = 'published', revision = revision + 1 where id = v_rev2;

  -- Four programs. P1 holds both units of version 1 and is the one that offers; P2 holds the shared
  -- unit of version 1; P3 took the shared unit from version 2; P4 inherited the shared unit of
  -- version 1 from a product and declared its element modified.
  v_pin_shared := jsonb_build_object('revisionId', v_rev1, 'definedComponentId', v_shared1, 'rationale', 'Taken from the library.');
  v_pin_other := jsonb_build_object('revisionId', v_rev1, 'definedComponentId', v_other1, 'rationale', 'Taken from the library.');
  v_p1 := pg_temp.system('CO-P1', v_catalog, v_base, null, jsonb_build_array(
    jsonb_build_array('SHR', null, v_pin_shared), jsonb_build_array('OTH', null, v_pin_other)));
  v_p2 := pg_temp.system('CO-P2', v_catalog, v_base, null, jsonb_build_array(jsonb_build_array('SHR', null, v_pin_shared)));
  v_p3 := pg_temp.system('CO-P3', v_catalog, v_base, null, jsonb_build_array(jsonb_build_array('SHR', null,
    jsonb_build_object('revisionId', v_rev2, 'definedComponentId', v_shared2, 'rationale', 'Taken from the library.'))));
  insert into public.products(id, tenant_id, code, name) values (v_product, v_tenant, 'CO-P', 'Component offer test product');
  insert into public.product_revisions(id, tenant_id, product_id, version_number) values (v_prev, v_tenant, v_product, 1);
  insert into public.product_elements(id, tenant_id, product_revision_id, code, name, element_type, defined_component_id, position)
    values (v_e_shr, v_tenant, v_prev, 'SHR', 'Shared element', 'software', v_shared1, 0);
  insert into public.product_configurations(id, tenant_id, product_id, code, name) values (v_config, v_tenant, v_product, 'A', 'Configuration A');
  insert into public.product_configuration_elements(tenant_id, product_revision_id, product_configuration_id, product_element_id)
    values (v_tenant, v_prev, v_config, v_e_shr);
  update public.product_revisions set state = 'published', revision = revision + 1 where id = v_prev;
  v_p4 := pg_temp.system('CO-P4', v_catalog, v_base, jsonb_build_object('revisionId', v_prev, 'configurationId', v_config),
    jsonb_build_array(jsonb_build_array('SHR', v_e_shr, jsonb_build_object(
      'revisionId', v_rev1, 'definedComponentId', v_shared1, 'rationale', 'Inherited from the test product.'))));
  select * into v_element from public.systems where tenant_id = v_tenant and code = 'CO-P4-SHR';
  perform public.declare_product_element_change(v_tenant, v_element.id, v_element.revision, array['software'], 'A customer build of the shared unit.');
  select s.program_id into v_g1 from public.systems s where s.id = v_p1;
  select s.program_id into v_g2 from public.systems s where s.id = v_p2;
  select s.program_id into v_g3 from public.systems s where s.id = v_p3;
  select s.program_id into v_g4 from public.systems s where s.id = v_p4;
  select c.id into v_c1 from public.system_components c where c.tenant_id = v_tenant and c.system_id = v_p1 and c.defined_component_id = v_shared1;
  select c.id into v_c1_other from public.system_components c where c.tenant_id = v_tenant and c.system_id = v_p1 and c.defined_component_id = v_other1;
  select c.id into v_c2 from public.system_components c where c.tenant_id = v_tenant and c.system_id = v_p2 and c.defined_component_id = v_shared1;
  select c.id into v_c4 from public.system_components c where c.tenant_id = v_tenant and c.system_id = v_p4 and c.defined_component_id = v_shared1;
  if v_c1 is null or v_c1_other is null or v_c2 is null or v_c4 is null then
    raise exception 'A program holds no system component built from the units';
  end if;
  -- A component of P1 that is built from no library component.
  insert into public.system_components(id, tenant_id, system_id, code, name, component_type)
    values (v_plain, v_tenant, v_p1, 'CO-P1-PLAIN', 'Plain unit', 'hardware');

  -- ---------------------------------------------------------------------------------------------
  -- The effective owner: the component's own, else its set's.
  -- ---------------------------------------------------------------------------------------------
  select * into v_register from public.component_rows r where r.id = v_shared2;
  if v_register.owner_party_id <> v_set_owner or v_register.owner_name <> 'Set owner' or v_register.offers_open <> 0
    or public.component_owner_party(v_shared1) <> v_set_owner
    or (public.component_control_status(v_shared1)->'component'->>'owner_party_id')::uuid <> v_set_owner then
    raise exception 'A component with no owner of its own is not its set''s: %', to_jsonb(v_register);
  end if;
  -- An owner is named for a component of the set, once, by a party of the workspace.
  perform pg_temp.expect_error(format(
    $q$insert into public.component_owners(tenant_id, component_definition_id, component_name, owner_party_id) values (%L, %L, 'No such unit', %L)$q$,
    v_tenant, v_definition, v_named_owner), '23514', 'a component of a version of this component set');
  perform pg_temp.expect_error(format(
    $q$insert into public.component_owners(tenant_id, component_definition_id, component_name, owner_party_id) values (%L, %L, 'Shared unit', 'c0ff1000-0000-0000-0000-000000000009')$q$,
    v_tenant, v_definition), '23503');
  insert into public.component_owners(tenant_id, component_definition_id, component_name, owner_party_id)
    values (v_tenant, v_definition, 'Shared unit', v_assessor);
  perform pg_temp.expect_error(format(
    $q$insert into public.component_owners(tenant_id, component_definition_id, component_name, owner_party_id) values (%L, %L, 'Shared unit', %L)$q$,
    v_tenant, v_definition, v_named_owner), '23505');
  perform pg_temp.expect_error(format(
    $q$update public.component_owners set component_name = 'Other unit', revision = revision + 1 where tenant_id = %L and component_name = 'Shared unit'$q$,
    v_tenant), '23514');
  -- Handed on: the row names another party from then on.
  update public.component_owners set owner_party_id = v_named_owner, revision = revision + 1
    where tenant_id = v_tenant and component_definition_id = v_definition and component_name = 'Shared unit';
  select * into v_register from public.component_rows r where r.id = v_shared2;
  v_answer := public.component_control_status(v_shared1);
  if v_register.owner_party_id <> v_named_owner or v_register.owner_name <> 'Component owner'
    or public.component_owner_party(v_shared1) <> v_named_owner or public.component_owner_party(v_shared2) <> v_named_owner
    or public.component_owner_party(v_other1) <> v_set_owner
    or (v_answer->'component'->>'owner_party_id')::uuid <> v_named_owner
    or (v_answer->'component'->>'definition_owner_party_id')::uuid <> v_set_owner then
    raise exception 'A component with an owner of its own answered % and %', to_jsonb(v_register), v_answer->'component';
  end if;
  v_answer := public.component_consumers(v_shared1);
  if (v_answer->'component'->>'owner_party_id')::uuid <> v_named_owner
    or (v_answer->'component'->>'definition_owner_party_id')::uuid <> v_set_owner
    or (public.component_consumers(v_other1)->'component'->>'owner_party_id')::uuid <> v_set_owner
    or v_answer->'findings' <> '[]'::jsonb
    or jsonb_array_length(v_answer->'findings') <> 0 or (v_answer->>'offers_open')::integer <> 0
    or (pg_temp.consumer(v_answer, 'CO-P2')->>'findings_open')::integer <> 0 then
    raise exception 'The consumers of a component nothing was offered on answered %', v_answer;
  end if;
  v_answer := public.system_upstream(v_p1);
  if (pg_temp.taken(v_answer, 'Shared unit')->>'owner_party_id')::uuid <> v_named_owner
    or (pg_temp.taken(v_answer, 'Shared unit')->>'definition_owner_party_id')::uuid <> v_set_owner
    or (pg_temp.taken(v_answer, 'Other unit')->>'owner_party_id')::uuid <> v_set_owner
    or pg_temp.taken(v_answer, 'Shared unit')->'findings' <> '[]'::jsonb
    or (pg_temp.taken(v_answer, 'Shared unit')->>'offers_open')::integer <> 0
    or (v_answer->>'findings_open')::integer <> 0 or (v_answer->>'offers_open')::integer <> 0 then
    raise exception 'What a system takes from above, before any offer, answered %', v_answer;
  end if;

  -- ---------------------------------------------------------------------------------------------
  -- What P1 holds: two operational issues, and published assessment results with a finding on A
  -- (satisfied), a second on A, one on B (partially satisfied), one that reached no determination
  -- and one on a control outside its baseline; draft results with a finding; and what P2 holds.
  -- ---------------------------------------------------------------------------------------------
  insert into public.operational_issues(id, tenant_id, program_id, title, description, severity, opened_at, owner_party_id) values
    (v_i1, v_tenant, v_g1, 'Remote code execution in the shared unit', 'An unauthenticated attacker can run code.', 'high', now() - interval '3 days', v_assessor),
    (v_i2, v_tenant, v_g1, 'Weak cipher offered by the shared unit', null, 'moderate', now() - interval '2 days', null),
    (v_i_else, v_tenant, v_g2, 'An issue of another program', null, 'low', now(), null);
  select * into v_published from pg_temp.results(v_p1, 'P1 published results');
  select * into v_draft from pg_temp.results(v_p1, 'P1 draft results');
  select * into v_elsewhere from pg_temp.results(v_p2, 'P2 published results');
  insert into public.assessment_findings(id, tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, description, determination, assessor_party_id, determined_at) values
    (v_f_a, v_tenant, v_published.results_id, v_published.set_id, v_part_a, 'A holds on the shared unit', '  The shared unit enforced it in test. ', 'satisfied', v_assessor, '2026-10-02T10:00:00Z'),
    (v_f_a2, v_tenant, v_published.results_id, v_published.set_id, v_part_a2, 'A holds on the shared unit, second part', null, 'satisfied', v_assessor, '2026-10-03T10:00:00Z'),
    (v_f_b, v_tenant, v_published.results_id, v_published.set_id, v_part_b, 'B holds in part on the shared unit', null, 'partially_satisfied', v_assessor, '2026-10-05T10:00:00Z'),
    (v_f_none, v_tenant, v_published.results_id, v_published.set_id, v_part_c, 'C was not assessed', null, 'not_assessed', v_assessor, null),
    (v_f_out, v_tenant, v_published.results_id, v_published.set_id, v_part_out, 'A control outside the baseline holds', null, 'satisfied', v_assessor, '2026-10-06T10:00:00Z'),
    (v_f_draft, v_tenant, v_draft.results_id, v_draft.set_id, v_part_c, 'C holds, in draft results', null, 'satisfied', v_assessor, '2026-10-07T10:00:00Z'),
    (v_f_else, v_tenant, v_elsewhere.results_id, v_elsewhere.set_id, v_part_c, 'C holds in another program', null, 'satisfied', v_assessor, '2026-10-08T10:00:00Z');
  update public.assessment_results_revisions set state = 'published', published_at = now(), revision = revision + 1
    where id in (v_published.results_id, v_elsewhere.results_id);

  -- ---------------------------------------------------------------------------------------------
  -- Each refusal of an offer, in its words, with nothing written.
  -- ---------------------------------------------------------------------------------------------
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'finding', array[%L]::uuid[], 'An offer', null, null)$q$, v_tenant, v_c1, v_i1), '22023', 'Choose the component');
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'opinion', array[%L]::uuid[], 'An offer', null, %L)$q$, v_tenant, v_c1, v_i1, gen_random_uuid()), '22023', 'a finding or determinations');
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'finding', '{}'::uuid[], 'An offer', null, %L)$q$, v_tenant, v_c1, gen_random_uuid()), '22023', 'between 1 and 200 operational issues');
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'finding', array[%L]::uuid[], 'An offer', null, %L)$q$, v_tenant, gen_random_uuid(), v_i1, gen_random_uuid()), 'PT404', 'no longer available');
  -- A component built from no library component has no owner to offer to.
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'finding', array[%L]::uuid[], 'An offer', null, %L)$q$, v_tenant, v_plain, v_i1, gen_random_uuid()), '23514', 'built from no library component');
  -- The decision is an unmodified component: P4 declared the element it inherited modified.
  insert into public.operational_issues(id, tenant_id, program_id, title, severity) values (v_i4, v_tenant, v_g4, 'An issue on a modified element', 'low');
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'finding', array[%L]::uuid[], 'An offer', null, %L)$q$, v_tenant, v_c4, v_i4, gen_random_uuid()), '23514', 'declared this component''s element modified');
  -- An item that is not the offering program's.
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'finding', array[%L, %L]::uuid[], 'An offer', null, %L)$q$, v_tenant, v_c1, v_i1, v_i_else, gen_random_uuid()), '23514', 'operational issues of the program that holds the component');
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'determinations', array[%L, %L]::uuid[], 'An offer', null, %L)$q$, v_tenant, v_c1, v_f_b, v_f_else, gen_random_uuid()), '23514', 'assessment findings of the program that holds the component');
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'determinations', array[%L]::uuid[], 'An offer', null, %L)$q$, v_tenant, v_c1, v_i1, gen_random_uuid()), '23514', 'assessment findings of the program that holds the component');
  -- A finding of draft results decides nothing, and neither does one that reached no determination.
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'determinations', array[%L, %L]::uuid[], 'An offer', null, %L)$q$, v_tenant, v_c1, v_f_b, v_f_draft, gen_random_uuid()), '23514', 'published assessment results');
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'determinations', array[%L]::uuid[], 'An offer', null, %L)$q$, v_tenant, v_c1, v_f_none, gen_random_uuid()), '23514', 'reached a determination on a control');
  -- One finding a control.
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'determinations', array[%L, %L]::uuid[], 'An offer', null, %L)$q$, v_tenant, v_c1, v_f_a, v_f_a2, gen_random_uuid()), '23514', 'Offer one finding a control');
  -- A viewer, a member of another workspace and a client writing the tables are refused.
  perform set_config('request.jwt.claim.sub', v_viewer::text, true);
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'finding', array[%L]::uuid[], 'An offer', null, %L)$q$, v_tenant, v_c1, v_i1, gen_random_uuid()), '42501', 'can offer a result');
  perform set_config('request.jwt.claim.sub', v_outsider::text, true);
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'finding', array[%L]::uuid[], 'An offer', null, %L)$q$, v_tenant, v_c1, v_i1, gen_random_uuid()), '42501');
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'finding', array[%L]::uuid[], 'An offer', null, %L)$q$, v_other_tenant, v_c1, v_i1, gen_random_uuid()), 'PT404');
  perform set_config('request.jwt.claim.sub', v_owner_user::text, true);
  perform pg_temp.expect_error(format(
    $q$insert into public.component_offers(tenant_id, defined_component_id, program_id, system_id, system_component_id, kind, title) values (%L, %L, %L, %L, %L, 'finding', 'Written by hand')$q$,
    v_tenant, v_shared1, v_g1, v_p1, v_c1), '42501');
  if exists (select 1 from public.component_offers) or exists (select 1 from public.component_offer_items)
    or exists (select 1 from public.review_queue_rows q where q.kind = 'component_offer')
    or exists (select 1 from public.activity_events e where e.tenant_id = v_tenant and e.description like 'offered %') then
    raise exception 'A refused offer wrote something';
  end if;

  -- ---------------------------------------------------------------------------------------------
  -- An offer of a finding: what it writes, the request sent again, and the queue's row.
  -- ---------------------------------------------------------------------------------------------
  v_result := public.offer_to_component(v_tenant, v_c1, 'finding', array[v_i1, v_i1], '  Remote code   execution ', ' Seen on the bench. ', v_request);
  v_o1 := (v_result->>'offerId')::uuid;
  select * into v_offer from public.component_offers where id = v_o1;
  select * into v_event from public.activity_events e where e.id = (v_result->>'activityEventId')::uuid;
  if v_offer.state <> 'offered' or v_offer.kind <> 'finding' or v_offer.title <> 'Remote code execution' or v_offer.note <> 'Seen on the bench.'
    or v_offer.defined_component_id <> v_shared1 or v_offer.program_id <> v_g1 or v_offer.system_id <> v_p1 or v_offer.system_component_id <> v_c1
    or v_offer.offered_by_party_id <> v_account or v_offer.revision <> 1 or v_offer.reviewed_at is not null
    or (v_result->>'items')::integer <> 1 or (v_result->>'waitingOnPartyId')::uuid <> v_named_owner
    or v_result->>'state' <> 'offered' or (v_result->>'revision')::integer <> 1
    or (select count(*) from public.component_offer_items i where i.component_offer_id = v_o1 and i.issue_id = v_i1 and i.control_id is null) <> 1
    or (select count(*) from public.component_offer_items i where i.component_offer_id = v_o1) <> 1 then
    raise exception 'Offering a finding answered % and wrote %', v_result, to_jsonb(v_offer);
  end if;
  if v_event.program_id <> v_g1 or v_event.issue_id <> v_i1 or v_event.actor_party_id <> v_account or v_event.event_type <> 'created'
    or v_event.description <> E'offered a finding on Shared unit to Component owner\nRemote code execution: found on version 1 of Component offer units.'
    or v_event.occurred_at <> v_offer.offered_at then
    raise exception 'Offering a finding recorded the event %', to_jsonb(v_event);
  end if;
  -- The same request again answers as it first did and writes nothing; its id with another choice
  -- is refused, and so is the same issue offered again while it waits.
  v_again := public.offer_to_component(v_tenant, v_c1, 'finding', array[v_i1], 'Another title', null, v_request);
  if v_again <> v_result or (select count(*) from public.component_offers) <> 1
    or (select count(*) from public.activity_events e where e.tenant_id = v_tenant and e.description like 'offered %') <> 1 then
    raise exception 'The same offer sent again answered % after %', v_again, v_result;
  end if;
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'finding', array[%L]::uuid[], 'An offer', null, %L)$q$, v_tenant, v_c1, v_i2, v_request), 'PT409', 'already made another offer');
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'finding', array[%L, %L]::uuid[], 'An offer', null, %L)$q$, v_tenant, v_c1, v_i1, v_i2, gen_random_uuid()), '23505', 'already waits in an offer');
  -- The Review queue lists it, waiting on the component's own owner, asked by who offered it.
  select * into v_queue from public.review_queue_rows q where q.id = v_o1;
  if v_queue.kind <> 'component_offer' or v_queue.kind_rank <> 7 or v_queue.record_table <> 'component_offers'
    or v_queue.parent_table <> 'defined_components' or v_queue.parent_id <> v_shared1 or v_queue.parent_name <> 'Shared unit'
    or v_queue.version_number <> 1 or v_queue.name <> 'Remote code execution' or v_queue.program_id <> v_g1
    or v_queue.program_name <> 'CO-P1 component offer test' or v_queue.waiting_since <> v_offer.offered_at
    or v_queue.waiting_on_party_id <> v_named_owner or v_queue.waiting_on_name <> 'Component owner'
    or v_queue.requested_by_party_id <> v_account or v_queue.requested_by_name <> v_account_name
    or v_queue.owner_party_id is not null or v_queue.determination_count is not null
    or (select count(*) from public.review_queue_rows q where q.kind = 'component_offer') <> 1 then
    raise exception 'The Review queue lists the offer as %', to_jsonb(v_queue);
  end if;
  select * into v_row from public.component_offer_rows r where r.id = v_o1;
  if v_row.kind <> 'finding' or v_row.kind_rank <> 1 or v_row.state <> 'offered' or v_row.state_rank <> 1
    or v_row.component_name <> 'Shared unit' or v_row.definition_code <> 'co-units' or v_row.version <> 1
    or v_row.component_definition_revision_id <> v_rev1
    or v_row.program_code <> 'CO-P1' or v_row.system_code <> 'CO-P1-SYS' or v_row.system_component_code <> 'CO-P1-SHR'
    or v_row.items <> 1 or v_row.offered_by_name <> v_account_name or v_row.offered_at <> v_offer.offered_at
    or v_row.owner_party_id <> v_named_owner or v_row.waiting_on_party_id <> v_named_owner or v_row.waiting_on_name <> 'Component owner'
    or v_row.reviewed_by_party_id is not null or v_row.reviewed_at is not null or v_row.issues_opened <> 0 or v_row.revision <> 1 then
    raise exception 'The offers register lists the offer as %', to_jsonb(v_row);
  end if;
  -- The offer waits on every version of the component: the register counts it, and so do the
  -- consumers' reads. Until it is accepted nothing stands on the component.
  v_answer := public.component_consumers(v_shared1);
  if (select r.offers_open from public.component_rows r where r.id = v_shared2) <> 1
    or (v_answer->>'offers_open')::integer <> 1 or jsonb_array_length(v_answer->'findings') <> 0
    or (pg_temp.taken(public.system_upstream(v_p2), 'Shared unit')->>'offers_open')::integer <> 1
    or (public.system_upstream(v_p2)->>'offers_open')::integer <> 1
    or (pg_temp.taken(public.system_upstream(v_p3), 'Shared unit')->>'offers_open')::integer <> 0
    or (pg_temp.taken(public.system_upstream(v_p2), 'Shared unit')->>'findings_open')::integer <> 0
    or (select count(*) from public.operational_issues i where i.tenant_id = v_tenant and i.program_id in (v_g2, v_g3, v_g4)) <> 2 then
    raise exception 'An offer that waits is counted as %', v_answer - 'systems' - 'products';
  end if;

  -- ---------------------------------------------------------------------------------------------
  -- Withdrawing: at the revision read, once; the offer leaves the queue and its item is free again.
  -- ---------------------------------------------------------------------------------------------
  perform pg_temp.expect_error(format($q$select public.withdraw_component_offer(%L, %L, 1, null)$q$, v_tenant, v_o1), '22023', 'Choose the offer to withdraw');
  perform pg_temp.expect_error(format($q$select public.withdraw_component_offer(%L, %L, 2, %L)$q$, v_tenant, v_o1, gen_random_uuid()), 'PT409', 'changed since you read it');
  perform pg_temp.expect_error(format($q$select public.withdraw_component_offer(%L, %L, 1, %L)$q$, v_tenant, gen_random_uuid(), gen_random_uuid()), 'PT404', 'no longer available');
  perform set_config('request.jwt.claim.sub', v_viewer::text, true);
  perform pg_temp.expect_error(format($q$select public.withdraw_component_offer(%L, %L, 1, %L)$q$, v_tenant, v_o1, gen_random_uuid()), '42501', 'can withdraw an offer');
  perform set_config('request.jwt.claim.sub', v_owner_user::text, true);
  v_result := public.withdraw_component_offer(v_tenant, v_o1, 1, v_request2);
  select * into v_offer from public.component_offers where id = v_o1;
  select * into v_event from public.activity_events e where e.id = (v_result->>'activityEventId')::uuid;
  if v_offer.state <> 'withdrawn' or v_offer.withdrawn_at is null or v_offer.withdrawn_by_party_id <> v_account
    or v_offer.reviewed_at is not null or v_offer.revision <> 2
    or v_result->>'state' <> 'withdrawn' or (v_result->>'revision')::integer <> 2
    or v_event.event_type <> 'updated' or v_event.program_id <> v_g1 or v_event.issue_id <> v_i1
    or v_event.description <> E'withdrew the offer of a finding on Shared unit\nRemote code execution.'
    or exists (select 1 from public.review_queue_rows q where q.kind = 'component_offer')
    or (select r.offers_open from public.component_rows r where r.id = v_shared2) <> 0
    or (select r.waiting_on_party_id from public.component_offer_rows r where r.id = v_o1) is not null
    or (select r.state_rank from public.component_offer_rows r where r.id = v_o1) <> 4 then
    raise exception 'Withdrawing an offer answered % and wrote % with the event %', v_result, to_jsonb(v_offer), to_jsonb(v_event);
  end if;
  v_again := public.withdraw_component_offer(v_tenant, v_o1, 1, v_request2);
  if v_again <> v_result then
    raise exception 'The same withdrawal sent again answered %', v_again;
  end if;
  -- A withdrawn offer is neither withdrawn nor reviewed again, and a receipt answers one command.
  perform pg_temp.expect_error(format($q$select public.withdraw_component_offer(%L, %L, 2, %L)$q$, v_tenant, v_o1, gen_random_uuid()), '23514', 'already withdrawn');
  perform pg_temp.expect_error(format($q$select public.review_component_offer(%L, %L, 2, 'accepted', null, %L)$q$, v_tenant, v_o1, gen_random_uuid()), '23514', 'already withdrawn');
  perform pg_temp.expect_error(format($q$select public.review_component_offer(%L, %L, 2, 'accepted', null, %L)$q$, v_tenant, v_o1, v_request2), 'PT409', 'already answered another offer');

  -- ---------------------------------------------------------------------------------------------
  -- Returning: a note is required; nothing is opened anywhere, and the item is free again.
  -- ---------------------------------------------------------------------------------------------
  v_result := public.offer_to_component(v_tenant, v_c1, 'finding', array[v_i1], null, null, gen_random_uuid());
  v_o2 := (v_result->>'offerId')::uuid;
  if (select o.title from public.component_offers o where o.id = v_o2) <> 'Remote code execution in the shared unit' then
    raise exception 'An offer with no title is not titled by its issue';
  end if;
  perform pg_temp.expect_error(format($q$select public.review_component_offer(%L, %L, 1, 'returned', '  ', %L)$q$, v_tenant, v_o2, gen_random_uuid()), '22023', 'Say why the offer is returned');
  perform pg_temp.expect_error(format($q$select public.review_component_offer(%L, %L, 1, 'declined', 'No.', %L)$q$, v_tenant, v_o2, gen_random_uuid()), '22023', 'Accept the offer or return it');
  perform pg_temp.expect_error(format($q$select public.review_component_offer(%L, %L, 2, 'returned', 'No.', %L)$q$, v_tenant, v_o2, gen_random_uuid()), 'PT409', 'changed since you read it');
  perform pg_temp.expect_error(format($q$select public.review_component_offer(%L, %L, 1, 'returned', 'No.', %L)$q$, v_tenant, gen_random_uuid(), gen_random_uuid()), 'PT404', 'no longer available');
  perform set_config('request.jwt.claim.sub', v_viewer::text, true);
  perform pg_temp.expect_error(format($q$select public.review_component_offer(%L, %L, 1, 'accepted', null, %L)$q$, v_tenant, v_o2, gen_random_uuid()), '42501', 'can review an offer');
  perform set_config('request.jwt.claim.sub', v_owner_user::text, true);
  v_result := public.review_component_offer(v_tenant, v_o2, 1, 'returned', ' Seen on a bench build only. ', gen_random_uuid());
  select * into v_offer from public.component_offers where id = v_o2;
  select * into v_event from public.activity_events e where e.id = (v_result->>'activityEventId')::uuid;
  if v_offer.state <> 'returned' or v_offer.review_note <> 'Seen on a bench build only.' or v_offer.reviewed_by_party_id <> v_account
    or v_offer.reviewed_at is null or v_offer.revision <> 2 or v_offer.component_assessment_id is not null
    or v_result->>'state' <> 'returned' or (v_result->>'programs')::integer <> 0 or v_result->'issues' <> '[]'::jsonb
    or v_result->'componentAssessmentId' <> 'null'::jsonb
    or v_event.event_type <> 'reviewed' or v_event.program_id <> v_g1 or v_event.issue_id <> v_i1
    or v_event.description <> E'returned the offer of a finding on Shared unit\nRemote code execution in the shared unit: Seen on a bench build only.'
    or exists (select 1 from public.component_offer_issues)
    or exists (select 1 from public.review_queue_rows q where q.kind = 'component_offer')
    or (select count(*) from public.operational_issues i where i.tenant_id = v_tenant and i.program_id in (v_g2, v_g3, v_g4)) <> 2 then
    raise exception 'Returning an offer answered % and wrote % with the event %', v_result, to_jsonb(v_offer), to_jsonb(v_event);
  end if;

  -- ---------------------------------------------------------------------------------------------
  -- Accepting a finding: it stands on the component version, and every other program built from
  -- that version gets one operational issue of its own for each issue offered.
  -- ---------------------------------------------------------------------------------------------
  v_result := public.offer_to_component(v_tenant, v_c1, 'finding', array[v_i2, v_i1], 'Two findings on the shared unit', null, gen_random_uuid());
  v_o3 := (v_result->>'offerId')::uuid;
  select count(*) into v_events from public.activity_events e where e.tenant_id = v_tenant;
  v_result := public.review_component_offer(v_tenant, v_o3, 1, 'accepted', 'Confirmed on the reference unit.', v_request3);
  select * into v_offer from public.component_offers where id = v_o3;
  if v_offer.state <> 'accepted' or v_offer.reviewed_by_party_id <> v_account or v_offer.reviewed_at is null
    or v_offer.review_note <> 'Confirmed on the reference unit.' or v_offer.revision <> 2 or v_offer.component_assessment_id is not null
    or v_result->>'state' <> 'accepted' or (v_result->>'programs')::integer <> 2
    or jsonb_array_length(v_result->'issues') <> 4 or (v_result->>'skipped')::integer <> 2
    or (v_result->>'determinations')::integer <> 0 then
    raise exception 'Accepting a finding answered % and wrote %', v_result, to_jsonb(v_offer);
  end if;
  -- The offering program's two issues are the source; P2 and P4, built from version 1, each got
  -- two issues of their own; P3, built from version 2, got none, and P1 got none more.
  if (select count(*) from public.component_offer_issues k where k.component_offer_id = v_o3) <> 6
    or (select count(*) from public.component_offer_issues k where k.component_offer_id = v_o3 and k.source
      and k.program_id = v_g1 and k.issue_id in (v_i1, v_i2) and k.system_component_id = v_c1) <> 2
    or (select count(*) from public.component_offer_issues k where k.component_offer_id = v_o3 and not k.source and k.program_id = v_g2 and k.system_component_id = v_c2) <> 2
    or (select count(*) from public.component_offer_issues k where k.component_offer_id = v_o3 and not k.source and k.program_id = v_g4 and k.system_component_id = v_c4) <> 2
    or (select count(*) from public.operational_issues i where i.tenant_id = v_tenant and i.program_id = v_g1) <> 2
    or (select count(*) from public.operational_issues i where i.tenant_id = v_tenant and i.program_id = v_g3) <> 0
    or (select count(*) from public.operational_issues i where i.tenant_id = v_tenant and i.program_id = v_g2) <> 3
    or (select count(*) from public.operational_issues i where i.tenant_id = v_tenant and i.program_id = v_g4) <> 3 then
    raise exception 'An accepted finding opened %', (select jsonb_agg(to_jsonb(k)) from public.component_offer_issues k where k.component_offer_id = v_o3);
  end if;
  -- A consumer's issue copies the title, description and severity, open, nobody's, opened now.
  if (select count(*) from public.component_offer_issues k
      join public.operational_issues i on i.id = k.issue_id
      where k.component_offer_id = v_o3 and not k.source and k.program_id = v_g2
        and i.status = 'open' and i.owner_party_id is null and i.opened_at = v_offer.reviewed_at and i.closed_at is null
        and ((i.title = 'Remote code execution in the shared unit' and i.description = 'An unauthenticated attacker can run code.' and i.severity = 'high')
          or (i.title = 'Weak cipher offered by the shared unit' and i.description is null and i.severity = 'moderate'))) <> 2 then
    raise exception 'A consumer''s issue is not a copy of the finding';
  end if;
  -- One activity event a program touched, and one for the offering program saying it was reviewed.
  if (select count(*) from public.activity_events e where e.tenant_id = v_tenant) <> v_events + 3
    or (select count(*) from public.activity_events e where e.tenant_id = v_tenant and e.program_id in (v_g2, v_g4)
      and e.event_type = 'created' and e.actor_party_id = v_account and e.occurred_at = v_offer.reviewed_at
      and e.issue_id in (select k.issue_id from public.component_offer_issues k where k.component_offer_id = v_o3 and k.program_id = e.program_id)
      and e.description = E'opened 2 operational issues from 2 findings accepted on Shared unit\nTwo findings on the shared unit: found in CO-P1 CO-P1-SYS, and standing on version 1 for every program built from it.') <> 2 then
    raise exception 'An accepted finding recorded %', (select jsonb_agg(e.description) from public.activity_events e where e.tenant_id = v_tenant and e.occurred_at = v_offer.reviewed_at);
  end if;
  select * into v_event from public.activity_events e where e.id = (v_result->>'activityEventId')::uuid;
  if v_event.event_type <> 'reviewed' or v_event.program_id <> v_g1 or v_event.issue_id <> v_i1 or v_event.actor_party_id <> v_account
    or v_event.description <> E'accepted the offer of 2 findings on Shared unit\nTwo findings on the shared unit: stands on version 1 for every program built from it; opened in 2 other programs.' then
    raise exception 'An accepted finding told the offering program %', to_jsonb(v_event);
  end if;
  -- The same review again answers as it first did and opens nothing twice; an accepted offer is not
  -- reviewed or withdrawn again, and its issues are not offered again for that version.
  select count(*) into v_issues from public.operational_issues i where i.tenant_id = v_tenant;
  v_again := public.review_component_offer(v_tenant, v_o3, 1, 'accepted', null, v_request3);
  if v_again <> v_result or (select count(*) from public.operational_issues i where i.tenant_id = v_tenant) <> v_issues
    or (select count(*) from public.activity_events e where e.tenant_id = v_tenant) <> v_events + 3 then
    raise exception 'The same review sent again answered %', v_again;
  end if;
  perform pg_temp.expect_error(format($q$select public.review_component_offer(%L, %L, 1, 'returned', 'No.', %L)$q$, v_tenant, v_o3, v_request3), 'PT409', 'already answered another offer');
  perform pg_temp.expect_error(format($q$select public.review_component_offer(%L, %L, 2, 'accepted', null, %L)$q$, v_tenant, v_o3, gen_random_uuid()), '23514', 'already accepted');
  perform pg_temp.expect_error(format($q$select public.withdraw_component_offer(%L, %L, 2, %L)$q$, v_tenant, v_o3, gen_random_uuid()), '23514', 'already accepted');
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'finding', array[%L]::uuid[], 'Again', null, %L)$q$, v_tenant, v_c1, v_i1, gen_random_uuid()), '23505', 'already accepted for this component version');
  if exists (select 1 from public.review_queue_rows q where q.kind = 'component_offer')
    or (select r.issues_opened from public.component_offer_rows r where r.id = v_o3) <> 4
    or (select r.items from public.component_offer_rows r where r.id = v_o3) <> 2
    or (select r.reviewed_by_name from public.component_offer_rows r where r.id = v_o3) <> v_account_name
    or (select r.state_rank from public.component_offer_rows r where r.id = v_o3) <> 2 then
    raise exception 'A reviewed offer is listed as %', (select to_jsonb(r) from public.component_offer_rows r where r.id = v_o3);
  end if;
  -- The findings stand on version 1: each consumer reads its own open issues for them, and the
  -- program built from version 2 reads none.
  v_answer := public.component_consumers(v_shared2);
  if jsonb_array_length(v_answer->'findings') <> 2 or (v_answer->>'findings_open')::integer <> 2
    or (v_answer->>'offers_open')::integer <> 0
    or (select count(*) from jsonb_array_elements(v_answer->'findings') f
      where (f->>'offer_id')::uuid = v_o3 and (f->>'version')::integer = 1 and (f->>'defined_component_id')::uuid = v_shared1
        and (f->>'source_program_id')::uuid = v_g1 and (f->>'programs')::integer = 3 and (f->>'programs_open')::integer = 3
        and (f->>'source_issue_id')::uuid in (v_i1, v_i2)) <> 2
    or (pg_temp.consumer(v_answer, 'CO-P1')->>'findings_open')::integer <> 2
    or not (pg_temp.consumer(v_answer, 'CO-P1')->'findings'->0->>'source')::boolean
    or (pg_temp.consumer(v_answer, 'CO-P1')->'findings'->0->>'issue_id')::uuid <> v_i1
    or (pg_temp.consumer(v_answer, 'CO-P2')->>'findings_open')::integer <> 2
    or (pg_temp.consumer(v_answer, 'CO-P2')->'findings'->0->>'source')::boolean
    or (pg_temp.consumer(v_answer, 'CO-P4')->>'findings_open')::integer <> 2
    or (pg_temp.consumer(v_answer, 'CO-P3')->>'findings_open')::integer <> 0
    or pg_temp.consumer(v_answer, 'CO-P3')->'findings' <> '[]'::jsonb then
    raise exception 'The consumers of a component a finding stands on answered %', v_answer;
  end if;
  v_answer := public.system_upstream(v_p2);
  v_line := pg_temp.taken(v_answer, 'Shared unit');
  if (v_line->>'findings_open')::integer <> 2 or jsonb_array_length(v_line->'findings') <> 2
    or (v_line->'findings'->0->>'offer_id')::uuid <> v_o3 or (v_line->'findings'->0->>'source')::boolean
    or v_line->'findings'->0->>'status' <> 'open'
    or (v_answer->>'findings_open')::integer <> 2
    or (pg_temp.taken(public.system_upstream(v_p3), 'Shared unit')->>'findings_open')::integer <> 0
    or (pg_temp.taken(public.system_upstream(v_p1), 'Other unit')->>'findings_open')::integer <> 0
    or (pg_temp.taken(public.system_upstream(v_p1), 'Shared unit')->>'findings_open')::integer <> 2 then
    raise exception 'What a consumer takes from above, with a finding standing, answered %', v_answer;
  end if;
  -- Each program answers its own row: P2 closes one of its issues, and only P2 reads one fewer.
  update public.operational_issues i set status = 'closed', closed_at = now(), closure_rationale = 'Patched.', revision = revision + 1
    where i.id = (select k.issue_id from public.component_offer_issues k
      join public.operational_issues x on x.id = k.issue_id
      where k.component_offer_id = v_o3 and k.program_id = v_g2 and x.severity = 'high');
  v_answer := public.component_consumers(v_shared1);
  if (pg_temp.consumer(v_answer, 'CO-P2')->>'findings_open')::integer <> 1
    or (pg_temp.consumer(v_answer, 'CO-P4')->>'findings_open')::integer <> 2
    or (v_answer->>'findings_open')::integer <> 2
    or (select (f->>'programs_open')::integer from jsonb_array_elements(v_answer->'findings') f where (f->>'source_issue_id')::uuid = v_i1) <> 2
    or (select (f->>'programs')::integer from jsonb_array_elements(v_answer->'findings') f where (f->>'source_issue_id')::uuid = v_i1) <> 3
    or (public.system_upstream(v_p2)->>'findings_open')::integer <> 1 then
    raise exception 'A consumer that closed its own issue reads %', v_answer;
  end if;

  -- ---------------------------------------------------------------------------------------------
  -- Accepting determinations: published as a component assessment that cites the findings, which
  -- changes the component's standing for every consumer.
  -- ---------------------------------------------------------------------------------------------
  -- An earlier component assessment judged A other than satisfied; B is claimed and not judged.
  insert into public.component_assessments(id, tenant_id, component_definition_revision_id, profile_resolution_id, title)
    values (v_earlier, v_tenant, v_rev1, v_base, 'An earlier component assessment');
  perform public.record_component_determinations(v_tenant, v_earlier, v_shared1, array[v_a], 'other_than_satisfied', 'Not shown at the time.');
  update public.component_assessments set state = 'published', published_at = now() - interval '30 days', revision = revision + 1
    where id = v_earlier;
  v_answer := public.component_control_status(v_shared1);
  if pg_temp.line(v_answer, v_a)->>'status' <> 'other_than_satisfied' or pg_temp.line(v_answer, v_b)->>'status' <> 'not_assessed' then
    raise exception 'Before the offer the shared unit stands as %', v_answer->'totals';
  end if;
  v_result := public.offer_to_component(v_tenant, v_c1, 'determinations', array[v_f_b, v_f_a], 'Shared unit determinations from P1', 'Made on the unit as delivered.', gen_random_uuid());
  v_o4 := (v_result->>'offerId')::uuid;
  select * into v_event from public.activity_events e where e.id = (v_result->>'activityEventId')::uuid;
  select * into v_queue from public.review_queue_rows q where q.id = v_o4;
  if (v_result->>'items')::integer <> 2
    or (select count(*) from public.component_offer_items i where i.component_offer_id = v_o4
      and ((i.assessment_finding_id = v_f_a and i.control_id = v_a) or (i.assessment_finding_id = v_f_b and i.control_id = v_b))
      and i.issue_id is null) <> 2
    or v_event.assessment_campaign_id <> v_published.campaign_id or v_event.program_id <> v_g1 or v_event.issue_id is not null
    or v_event.description <> E'offered 2 determinations on Shared unit to Component owner\nShared unit determinations from P1: found on version 1 of Component offer units.'
    or v_queue.kind <> 'component_offer' or v_queue.determination_count <> 2 or v_queue.waiting_on_party_id <> v_named_owner then
    raise exception 'Offering determinations answered %, recorded % and waits as %', v_result, to_jsonb(v_event), to_jsonb(v_queue);
  end if;
  -- The same finding is not offered twice for the version.
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'determinations', array[%L]::uuid[], 'Again', null, %L)$q$, v_tenant, v_c1, v_f_a, gen_random_uuid()), '23505', 'already waits in an offer');
  -- A control outside the offering system's control baseline refuses the review: nothing is
  -- published and the offer still waits. It is returned instead.
  v_result := public.offer_to_component(v_tenant, v_c1, 'determinations', array[v_f_out], 'A control outside the baseline', null, gen_random_uuid());
  v_o5 := (v_result->>'offerId')::uuid;
  perform pg_temp.expect_error(format($q$select public.review_component_offer(%L, %L, 1, 'accepted', null, %L)$q$, v_tenant, v_o5, gen_random_uuid()), '23514',
    '1 offered control is outside the offering system''s control baseline, so nothing was published: ' || (select k.code from public.controls k where k.id = v_out));
  if (select o.state from public.component_offers o where o.id = v_o5) <> 'offered'
    or (select count(*) from public.component_assessments a where a.tenant_id = v_tenant) <> 1 then
    raise exception 'A refused review wrote something';
  end if;
  perform public.review_component_offer(v_tenant, v_o5, 1, 'returned', 'Not a control of the unit.', gen_random_uuid());
  -- Accepted: one published component assessment of version 1 against P1's control baseline, one
  -- determination a finding, each citing it.
  v_request := gen_random_uuid();
  v_result := public.review_component_offer(v_tenant, v_o4, 1, 'accepted', null, v_request);
  select * into v_offer from public.component_offers where id = v_o4;
  select * into v_assessment from public.component_assessments a where a.id = (v_result->>'componentAssessmentId')::uuid;
  if v_offer.state <> 'accepted' or v_offer.component_assessment_id <> v_assessment.id or v_offer.review_note is not null
    or (v_result->>'determinations')::integer <> 2 or (v_result->>'programs')::integer <> 0 or v_result->'issues' <> '[]'::jsonb
    or v_assessment.state <> 'published' or v_assessment.published_at <> v_offer.reviewed_at
    or v_assessment.component_definition_revision_id <> v_rev1 or v_assessment.profile_resolution_id <> v_base
    or v_assessment.title <> 'Shared unit determinations from P1' or v_assessment.assessor_party_id <> v_assessor
    or v_assessment.started_on <> '2026-10-02' or v_assessment.completed_on <> '2026-10-05'
    or v_assessment.description <> E'Offered by CO-P1 from the published assessment results of CO-P1-SYS, and accepted for Shared unit version 1.\nMade on the unit as delivered.'
    or (select count(*) from public.component_assessments a where a.tenant_id = v_tenant) <> 2 then
    raise exception 'Accepting determinations answered % and published %', v_result, to_jsonb(v_assessment);
  end if;
  if (select count(*) from public.component_determinations d where d.component_assessment_id = v_assessment.id) <> 2
    or not exists (select 1 from public.component_determinations d where d.component_assessment_id = v_assessment.id
      and d.defined_component_id = v_shared1 and d.control_id = v_a and d.determination = 'satisfied'
      and d.assessment_finding_id = v_f_a and d.rationale = 'The shared unit enforced it in test.')
    or not exists (select 1 from public.component_determinations d where d.component_assessment_id = v_assessment.id
      and d.defined_component_id = v_shared1 and d.control_id = v_b and d.determination = 'partially_satisfied'
      and d.assessment_finding_id = v_f_b and d.rationale is null) then
    raise exception 'The published determinations are %', (select jsonb_agg(to_jsonb(d)) from public.component_determinations d where d.component_assessment_id = v_assessment.id);
  end if;
  -- The standing it changes: the newer determination on A stands, and B is judged.
  v_answer := public.component_control_status(v_shared1);
  if v_answer->'totals' <> '{"controls": 2, "satisfied": 1, "partially_satisfied": 1, "other_than_satisfied": 0, "not_assessed": 0, "carried": 0, "to_review": 0}'::jsonb
    or pg_temp.line(v_answer, v_a)->>'status' <> 'satisfied' or (pg_temp.line(v_answer, v_a)->>'assessment_id')::uuid <> v_assessment.id
    or pg_temp.line(v_answer, v_b)->>'status' <> 'partially_satisfied'
    or (v_answer->'assessments'->0->>'id')::uuid <> v_assessment.id
    or (pg_temp.taken(public.system_upstream(v_p2), 'Shared unit')->'standing'->>'satisfied')::integer <> 1
    or (pg_temp.taken(public.system_upstream(v_p4), 'Shared unit')->'standing'->>'partially_satisfied')::integer <> 1
    -- Version 2 of the unit, which nobody judged, carries both determinations forward.
    or (public.component_control_status(v_shared2)->'totals'->>'controls')::integer <> 2
    or (public.component_control_status(v_shared2)->'totals'->>'carried')::integer <> 2 then
    raise exception 'After the accepted determinations the shared unit stands as %', v_answer;
  end if;
  select * into v_event from public.activity_events e where e.id = (v_result->>'activityEventId')::uuid;
  if v_event.event_type <> 'reviewed' or v_event.program_id <> v_g1 or v_event.assessment_campaign_id <> v_published.campaign_id
    or v_event.description <> E'accepted 2 determinations offered on Shared unit\nShared unit determinations from P1: published as the standing of version 1 for every program built from it.' then
    raise exception 'Accepted determinations told the offering program %', to_jsonb(v_event);
  end if;
  v_again := public.review_component_offer(v_tenant, v_o4, 1, 'accepted', null, v_request);
  if v_again <> v_result or (select count(*) from public.component_assessments a where a.tenant_id = v_tenant) <> 2
    or exists (select 1 from public.review_queue_rows q where q.kind = 'component_offer') then
    raise exception 'The same acceptance sent again answered %', v_again;
  end if;
  perform pg_temp.expect_error(format($q$select public.offer_to_component(%L, %L, 'determinations', array[%L]::uuid[], 'Again', null, %L)$q$, v_tenant, v_c1, v_f_b, gen_random_uuid()), '23505', 'already accepted for this component version');

  -- ---------------------------------------------------------------------------------------------
  -- Who reads: a viewer as a member; another workspace nothing, in either workspace's name.
  -- ---------------------------------------------------------------------------------------------
  perform set_config('request.jwt.claim.sub', v_viewer::text, true);
  if (select count(*) from public.component_offer_rows) <> 5 or (select count(*) from public.component_offers) <> 5
    or (select count(*) from public.component_offer_items) <> 7 or (select count(*) from public.component_offer_issues) <> 6
    or (select count(*) from public.component_owners) <> 1
    or jsonb_array_length(public.component_consumers(v_shared1)->'findings') <> 2 then
    raise exception 'A viewer does not read the offers a member reads';
  end if;
  perform pg_temp.expect_error(format(
    $q$insert into public.component_owners(tenant_id, component_definition_id, component_name, owner_party_id) values (%L, %L, 'Other unit', %L)$q$,
    v_tenant, v_definition, v_named_owner), '42501');
  perform set_config('request.jwt.claim.sub', v_outsider::text, true);
  if exists (select 1 from public.component_offer_rows) or exists (select 1 from public.component_offers)
    or exists (select 1 from public.component_offer_items) or exists (select 1 from public.component_offer_issues)
    or exists (select 1 from public.component_owners) or exists (select 1 from public.review_queue_rows)
    or public.component_owner_party(v_shared1) is not null then
    raise exception 'Another workspace reads an offer or a component''s owner';
  end if;
  perform pg_temp.expect_error(format($q$select public.review_component_offer(%L, %L, 2, 'accepted', null, %L)$q$, v_tenant, v_o5, gen_random_uuid()), '42501');
  perform pg_temp.expect_error(format($q$select public.review_component_offer(%L, %L, 2, 'accepted', null, %L)$q$, v_other_tenant, v_o5, gen_random_uuid()), 'PT404');
  perform pg_temp.expect_error(format($q$select public.withdraw_component_offer(%L, %L, 2, %L)$q$, v_other_tenant, v_o5, gen_random_uuid()), 'PT404');
  perform pg_temp.expect_error(format($q$select public.component_consumers(%L)$q$, v_shared1), '42501');
  perform set_config('request.jwt.claim.sub', v_owner_user::text, true);
end $$;

-- Past the grants, as the tables' owner, the guards still hold: an offer that was reviewed or
-- withdrawn no longer changes and takes no more items.
reset role;
select pg_temp.expect_error($$update public.component_offers set title = 'Rewritten' where state = 'accepted'$$, '23514', 'no longer changes');
select pg_temp.expect_error($$update public.component_offers set state = 'offered', withdrawn_at = null where state = 'withdrawn'$$, '23514', 'no longer changes');
select pg_temp.expect_error($$insert into public.component_offer_items(tenant_id, component_offer_id, program_id, issue_id)
  select o.tenant_id, o.id, o.program_id, i.issue_id from public.component_offers o
  join public.component_offer_items i on i.component_offer_id = o.id where o.state = 'returned' and o.kind = 'finding' limit 1$$, '23514', 'takes no more items');

-- An anonymous session reads none of it.
set local role anon;
select pg_temp.expect_error('select count(*) from public.component_offer_rows', '42501');
select pg_temp.expect_error('select count(*) from public.component_offers', '42501');
select pg_temp.expect_error('select count(*) from public.component_owners', '42501');
select pg_temp.expect_error($$select public.offer_to_component(gen_random_uuid(), gen_random_uuid(), 'finding', array[gen_random_uuid()], 'An offer', null, gen_random_uuid())$$, '42501');
rollback;
