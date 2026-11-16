-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Component versions: who may reach the reads, the command and the two tables; and, with the
-- pinned references installed (a catalog and a reference baseline), a component set whose unit is
-- assessed once and then versioned. A change is recorded against the version before, while its
-- version is a draft, and is frozen with it. A draft version reads what it would carry and hands
-- consumers nothing: they stay on the version they took, not behind. Published, the new version
-- carries every determination but the ones on the controls its change lists, which read not
-- assessed and to review where an earlier version was judged on them; its own determination stands
-- over a carried one; a third version carries across two, keeps a control an earlier change left
-- to review, and reads to review what its own change lists. Consumers still inherit what they
-- took. The review read says what Take version would change, with the CVE the newer version fixes
-- and the program's issue for it. The command refuses a target that is not a newer published
-- version of the same component, a component that came through a library assignment, one on an
-- element inherited from a product, one built from no library component and one changed since it
-- was read; taken, the consumer inherits what carried and loses the affected control, one activity
-- event says so, and a request sent again answers as it first did. A product element pinned to
-- the new version follows. Last, a viewer and the tenant boundary.
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
-- A system component built from a library component with no library assignment behind it, which
-- no client writes: the shared components seed links WS-X90's mission computer this way. The
-- helper is its owner's, so the guard that keeps clients from the pin lets it through.
create function pg_temp.build_from(p_system_component uuid, p_defined_component uuid) returns void
language sql security definer set search_path = '' as $$
  update public.system_components
    set defined_component_id = p_defined_component, applied_rationale = 'Built from the library unit.',
      applied_at = now() - interval '1 day', revision = revision + 1
    where id = p_system_component;
$$;
grant execute on function pg_temp.build_from(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Who may ask and who may write.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_function text; v_table text;
begin
  -- The reads are a signed-in session's, as their caller: row-level security decides every row.
  foreach v_function in array array[
    'public.component_standing_lines(uuid[])', 'public.component_control_status(uuid)',
    'public.component_version_review(uuid)', 'public.program_element_inheritance(uuid, uuid[])',
    'public.system_upstream(uuid)', 'public.component_version_refusal(text)',
    'public.take_component_version(uuid, uuid, uuid, bigint, uuid)'] loop
    if has_function_privilege('anon', v_function, 'execute') or has_function_privilege('public', v_function, 'execute') then
      raise exception 'An anonymous session may execute %', v_function;
    end if;
    if not has_function_privilege('authenticated', v_function, 'execute') then
      raise exception 'A signed-in session may not execute %', v_function;
    end if;
    -- Only the command runs as its owner, behind its own check of who calls.
    if (select p.prosecdef from pg_catalog.pg_proc p where p.oid = v_function::regprocedure)
      <> (v_function like 'public.take_component_version%') then
      raise exception '% runs as the wrong role', v_function;
    end if;
  end loop;
  if has_function_privilege('authenticated', 'public.guard_component_version_change()', 'execute') then
    raise exception 'A client may execute the guard of a version change';
  end if;
  foreach v_table in array array['public.component_version_changes', 'public.component_version_change_controls'] loop
    if has_table_privilege('anon', v_table, 'select') or not has_table_privilege('authenticated', v_table, 'select')
      or not (select c.relrowsecurity from pg_catalog.pg_class c where c.oid = v_table::regclass) then
      raise exception '% is not a signed-in member''s, row by row', v_table;
    end if;
  end loop;
  -- What the register gained comes last, so nothing that read it by position moves.
  if (select a.attname from pg_catalog.pg_attribute a where a.attrelid = 'public.component_rows'::regclass
      and a.attnum > 0 and not a.attisdropped order by a.attnum desc limit 1) <> 'controls_to_review' then
    raise exception 'controls_to_review is not the last column of component_rows';
  end if;
  -- The receipts are nobody's to read.
  if has_table_privilege('authenticated', 'public.component_version_requests', 'select')
    or has_table_privilege('anon', 'public.component_version_requests', 'select')
    or not (select c.relrowsecurity from pg_catalog.pg_class c where c.oid = 'public.component_version_requests'::regclass) then
    raise exception 'A client reads the receipts of Take version';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- A workspace: its owner and a viewer; and a member of another workspace.
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email, raw_user_meta_data) values
  ('c5510000-0000-0000-0000-000000000001', 'component-versions-owner@example.test', '{"name":"Component versions test owner"}'),
  ('c5510000-0000-0000-0000-000000000002', 'component-versions-outsider@example.test', '{}'),
  ('c5510000-0000-0000-0000-000000000003', 'component-versions-viewer@example.test', '{}');
select set_config('request.jwt.claim.sub', 'c5510000-0000-0000-0000-000000000002', true);
set local role authenticated;
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
select set_config('request.jwt.claim.sub', 'c5510000-0000-0000-0000-000000000001', true);
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'c5510000-0000-0000-0000-000000000003', 'viewer');
select set_config('test.ready', '', true);

-- A program with one system, created from a configuration of a product (`product`) or not.
-- `elements` is a list of [code, product element id or null, library pin or null].
create function pg_temp.system(p_code text, catalog uuid, base uuid, product jsonb, elements jsonb) returns uuid
language plpgsql as $$
declare profile uuid := gen_random_uuid();
begin
  perform public.create_program_wizard(current_setting('test.tenant')::uuid, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', p_code, 'name', p_code || ' component versions test', 'description', '',
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
-- A component's standing as a list a check compares whole: one entry a control, in the order the
-- controls are given, [status, assessment, carried from version, to review, affected in version,
-- earlier version, earlier determination], null for a control the component holds no line for.
create function pg_temp.standing(component uuid, controls uuid[]) returns jsonb language sql stable as $$
  select jsonb_agg((select jsonb_build_array(l.status, l.component_assessment_id, l.carried_from_version,
      l.to_review, l.affected_in_version, l.earlier_version, l.earlier_determination)
    from public.component_standing_lines(array[component]) l where l.control_id = k.id) order by k.place)
  from unnest(controls) with ordinality k(id, place);
$$;
-- What an element inherits, [control, determination, assessment] in the order of the controls.
create function pg_temp.inherits(program uuid, element uuid, controls uuid[]) returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_array(k.place, i.determination, i.component_assessment_id) order by k.place), '[]'::jsonb)
  from public.program_element_inheritance(program, controls) i
  join unnest(controls) with ordinality k(id, place) on k.id = i.control_id
  where i.element_id = element;
$$;
grant execute on function pg_temp.system(text, uuid, uuid, jsonb, jsonb), pg_temp.standing(uuid, uuid[]),
  pg_temp.inherits(uuid, uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- With the pinned references installed.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_owner_user uuid := 'c5510000-0000-0000-0000-000000000001';
  v_party uuid;
  v_catalog uuid; v_base uuid; v_controls uuid[];
  -- k1 is never touched, k2 is what version 2 changes, k3 is judged again on version 2 and changed
  -- by version 3, k4 is claimed and never judged, k5 is the other unit's.
  v_k1 uuid; v_k2 uuid; v_k3 uuid; v_k4 uuid; v_k5 uuid; v_k2_code text; v_k3_code text;
  v_definition uuid := gen_random_uuid();
  v_r1 uuid := gen_random_uuid(); v_r2 uuid := gen_random_uuid(); v_r3 uuid := gen_random_uuid(); v_r4 uuid := gen_random_uuid();
  v_a1 uuid := gen_random_uuid(); v_b1 uuid := gen_random_uuid();
  v_a2 uuid := gen_random_uuid(); v_b2 uuid := gen_random_uuid(); v_c2 uuid := gen_random_uuid();
  v_a3 uuid := gen_random_uuid(); v_a4 uuid := gen_random_uuid();
  v_change2 uuid := gen_random_uuid(); v_change3 uuid := gen_random_uuid(); v_listed uuid := gen_random_uuid();
  v_ca1 uuid := gen_random_uuid(); v_ca2 uuid := gen_random_uuid(); v_ca3 uuid := gen_random_uuid(); v_ca_draft uuid := gen_random_uuid();
  v_product uuid := gen_random_uuid(); v_prev1 uuid := gen_random_uuid(); v_prev2 uuid := gen_random_uuid();
  v_pe1 uuid := gen_random_uuid(); v_pe2 uuid := gen_random_uuid(); v_config uuid := gen_random_uuid();
  v_pin jsonb;
  v_own uuid; v_own_program uuid; v_e1 uuid; v_e2 uuid; v_e3 uuid;
  v_variant uuid; v_variant_program uuid; v_variant_one uuid;
  v_free uuid := gen_random_uuid(); v_assigned uuid; v_plain uuid := gen_random_uuid(); v_inherited uuid := gen_random_uuid();
  v_sbom1 uuid := gen_random_uuid(); v_sbom2 uuid := gen_random_uuid();
  v_cve_fixed uuid := gen_random_uuid(); v_cve_open uuid := gen_random_uuid(); v_issue uuid := gen_random_uuid();
  v_request uuid := gen_random_uuid();
  v_row public.system_components; v_event public.activity_events;
  v_answer jsonb; v_again jsonb; v_line jsonb; v_events integer; v_element_revision bigint;
begin
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) >= 5
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the checks of component versions were skipped';
    return;
  end if;
  select array_agg(x.control_id order by x.code_order, x.control_id) into v_controls
  from (select sc.control_id, k.code_order from public.selected_controls sc
    join public.catalog_control_rows k on k.id = sc.control_id
    where sc.profile_resolution_id = v_base order by k.code_order, sc.control_id limit 5) x;
  v_k1 := v_controls[1]; v_k2 := v_controls[2]; v_k3 := v_controls[3]; v_k4 := v_controls[4]; v_k5 := v_controls[5];
  select k.code into v_k2_code from public.controls k where k.id = v_k2;
  select k.code into v_k3_code from public.controls k where k.id = v_k3;
  select p.id into v_party from public.parties p where p.tenant_id = v_tenant and p.auth_user_id = v_owner_user;

  -- -------------------------------------------------------------------------------------------
  -- Version 1: two units, assessed once.
  -- -------------------------------------------------------------------------------------------
  insert into public.component_definitions(id, tenant_id, code, name) values (v_definition, v_tenant, 'cv-units', 'Component versions units');
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values (v_r1, v_tenant, v_definition, 1);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values
    (v_a1, v_tenant, v_r1, 'Unit A', 'hardware'), (v_b1, v_tenant, v_r1, 'Unit B', 'hardware');
  -- A change is recorded against the version before: a first version records none.
  perform pg_temp.expect_error(format(
    $q$insert into public.component_version_changes(tenant_id, component_definition_revision_id, defined_component_id, change_kinds, summary) values (%L, %L, %L, '{software}', 'Nothing to change against.')$q$,
    v_tenant, v_r1, v_a1), '23514', 'no earlier version');
  update public.component_definition_revisions set state = 'published', revision = revision + 1 where id = v_r1;
  insert into public.component_assessments(id, tenant_id, component_definition_revision_id, profile_resolution_id, title)
    values (v_ca1, v_tenant, v_r1, v_base, 'Version 1 component assessment');
  insert into public.component_determinations(tenant_id, component_assessment_id, component_definition_revision_id, defined_component_id, control_id, determination) values
    (v_tenant, v_ca1, v_r1, v_a1, v_k1, 'satisfied'), (v_tenant, v_ca1, v_r1, v_a1, v_k2, 'satisfied'),
    (v_tenant, v_ca1, v_r1, v_a1, v_k3, 'partially_satisfied'), (v_tenant, v_ca1, v_r1, v_b1, v_k5, 'satisfied');
  update public.component_assessments set state = 'published', published_at = now() - interval '5 hours', revision = revision + 1 where id = v_ca1;
  v_pin := jsonb_build_object('revisionId', v_r1, 'definedComponentId', v_a1, 'rationale', 'Taken from the library.');
  -- A first version stands on its own assessment alone: nothing is carried, nothing is to review.
  if pg_temp.standing(v_a1, v_controls) <> jsonb_build_array(
      jsonb_build_array('satisfied', v_ca1, null, false, null, null, null),
      jsonb_build_array('satisfied', v_ca1, null, false, null, null, null),
      jsonb_build_array('partially_satisfied', v_ca1, null, false, null, null, null), null, null) then
    raise exception 'A first version stands as %', pg_temp.standing(v_a1, v_controls);
  end if;

  -- A product whose one element is pinned to unit A, and a program that takes it as delivered.
  insert into public.products(id, tenant_id, code, name) values (v_product, v_tenant, 'CV-P', 'Component versions test product');
  insert into public.product_revisions(id, tenant_id, product_id, version_number) values (v_prev1, v_tenant, v_product, 1);
  insert into public.product_elements(id, tenant_id, product_revision_id, code, name, element_type, defined_component_id, position)
    values (v_pe1, v_tenant, v_prev1, 'ONE', 'Pinned element', 'hardware', v_a1, 0);
  insert into public.product_configurations(id, tenant_id, product_id, code, name) values (v_config, v_tenant, v_product, 'A', 'Configuration A');
  insert into public.product_configuration_elements(tenant_id, product_revision_id, product_configuration_id, product_element_id)
    values (v_tenant, v_prev1, v_config, v_pe1);
  update public.product_revisions set state = 'published', revision = revision + 1 where id = v_prev1;
  v_variant := pg_temp.system('CV-V', v_catalog, v_base, jsonb_build_object('revisionId', v_prev1, 'configurationId', v_config),
    jsonb_build_array(jsonb_build_array('ONE', v_pe1, v_pin)));
  -- A program of its own: one element whose component is built from unit A with no assignment
  -- behind it, one that took unit A through a library assignment, and one that holds a component
  -- that is not from the library.
  v_own := pg_temp.system('CV-OWN', v_catalog, v_base, null, jsonb_build_array(
    jsonb_build_array('E1', null, null), jsonb_build_array('E2', null, v_pin), jsonb_build_array('E3', null, null)));
  select s.program_id into v_variant_program from public.systems s where s.id = v_variant;
  select s.program_id into v_own_program from public.systems s where s.id = v_own;
  select s.id into v_variant_one from public.systems s where s.tenant_id = v_tenant and s.code = 'CV-V-ONE';
  select s.id into v_e1 from public.systems s where s.tenant_id = v_tenant and s.code = 'CV-OWN-E1';
  select s.id into v_e2 from public.systems s where s.tenant_id = v_tenant and s.code = 'CV-OWN-E2';
  select s.id into v_e3 from public.systems s where s.tenant_id = v_tenant and s.code = 'CV-OWN-E3';
  insert into public.system_components(id, tenant_id, system_id, system_element_id, code, name, component_type) values
    (v_free, v_tenant, v_own, v_e1, 'CV-OWN-A', 'Unit A as built', 'hardware'),
    (v_plain, v_tenant, v_own, v_e3, 'CV-OWN-PLAIN', 'A unit of the program''s own', 'hardware'),
    (v_inherited, v_tenant, v_variant, v_variant_one, 'CV-V-A', 'A second unit A on the product''s element', 'hardware');
  perform pg_temp.build_from(v_free, v_a1);
  perform pg_temp.build_from(v_inherited, v_a1);
  select c.id into v_assigned from public.system_components c
    where c.tenant_id = v_tenant and c.system_id = v_own and c.system_element_id = v_e2 and c.defined_component_id = v_a1;
  if v_assigned is null or (select c.assignment_id from public.system_components c where c.id = v_assigned) is null
    or (select c.assignment_id from public.system_components c where c.id = v_free) is not null then
    raise exception 'The fixtures do not hold one component through an assignment and one without';
  end if;
  -- The element built from unit A inherits what version 1 was judged on.
  if pg_temp.inherits(v_own_program, v_e1, v_controls) <> jsonb_build_array(
      jsonb_build_array(1, 'satisfied', v_ca1), jsonb_build_array(2, 'satisfied', v_ca1),
      jsonb_build_array(3, 'partially_satisfied', v_ca1)) then
    raise exception 'The element built from version 1 inherits %', pg_temp.inherits(v_own_program, v_e1, v_controls);
  end if;

  -- What is known to be wrong with version 1: two CVEs on its SBOM, one of which the program
  -- holds an issue for.
  insert into public.sboms(id, tenant_id, defined_component_id, title, format, generated_on)
    values (v_sbom1, v_tenant, v_a1, 'Unit A version 1 SBOM', 'cyclonedx', current_date - 30);
  insert into public.sbom_components(tenant_id, sbom_id, name, version) values
    (v_tenant, v_sbom1, 'sshd', '1.0'), (v_tenant, v_sbom1, 'libc', '2.0');
  insert into public.vulnerabilities(id, tenant_id, cve_id, title, severity, fixed_in) values
    (v_cve_fixed, v_tenant, 'CVE-2099-0001', 'A race in sshd', 'high', 'sshd 1.1'),
    (v_cve_open, v_tenant, 'CVE-2099-0002', 'An overflow in libc', 'moderate', null);
  insert into public.sbom_component_vulnerabilities(tenant_id, sbom_component_id, vulnerability_id, state)
    select v_tenant, c.id, x.cve, 'affected'
    from (values ('sshd', v_cve_fixed), ('libc', v_cve_open)) x(name, cve)
    join public.sbom_components c on c.tenant_id = v_tenant and c.sbom_id = v_sbom1 and c.name = x.name;
  insert into public.operational_issues(id, tenant_id, program_id, title, severity, opened_at)
    values (v_issue, v_tenant, v_own_program, 'CVE-2099-0001 in sshd', 'high', now() - interval '2 days');
  insert into public.issue_vulnerabilities(tenant_id, issue_id, vulnerability_id) values (v_tenant, v_issue, v_cve_fixed);

  -- -------------------------------------------------------------------------------------------
  -- Version 2, a draft: what it changes, and what it would carry.
  -- -------------------------------------------------------------------------------------------
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values (v_r2, v_tenant, v_definition, 2);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values
    (v_a2, v_tenant, v_r2, 'Unit A', 'hardware'), (v_b2, v_tenant, v_r2, 'Unit B', 'hardware'), (v_c2, v_tenant, v_r2, 'Unit C', 'software');
  insert into public.defined_component_implementations(tenant_id, component_definition_revision_id, defined_component_id, control_id, description, implementation_status) values
    (v_tenant, v_r2, v_a2, v_k1, 'Unit A does it.', 'implemented'), (v_tenant, v_r2, v_a2, v_k4, 'Unit A does it.', 'implemented');
  -- A change says what kinds of thing changed, in words, once a component version; and a unit the
  -- version holds for the first time has nothing to change against.
  perform pg_temp.expect_error(format(
    $q$insert into public.component_version_changes(tenant_id, component_definition_revision_id, defined_component_id, change_kinds, summary) values (%L, %L, %L, '{}', 'No kind.')$q$,
    v_tenant, v_r2, v_a2), '23514');
  perform pg_temp.expect_error(format(
    $q$insert into public.component_version_changes(tenant_id, component_definition_revision_id, defined_component_id, change_kinds, summary) values (%L, %L, %L, '{software,paint}', 'A kind nobody knows.')$q$,
    v_tenant, v_r2, v_a2), '23514');
  perform pg_temp.expect_error(format(
    $q$insert into public.component_version_changes(tenant_id, component_definition_revision_id, defined_component_id, change_kinds, summary) values (%L, %L, %L, '{software}', '  ')$q$,
    v_tenant, v_r2, v_a2), '23514');
  perform pg_temp.expect_error(format(
    $q$insert into public.component_version_changes(tenant_id, component_definition_revision_id, defined_component_id, change_kinds, summary) values (%L, %L, %L, '{software}', 'A new unit.')$q$,
    v_tenant, v_r2, v_c2), '23514', 'no earlier version');
  insert into public.component_version_changes(id, tenant_id, component_definition_revision_id, defined_component_id, change_kinds, summary)
    values (v_change2, v_tenant, v_r2, v_a2, array['software', 'firmware'], 'A newer sshd and the boot firmware that carries it.');
  perform pg_temp.expect_error(format(
    $q$insert into public.component_version_changes(tenant_id, component_definition_revision_id, defined_component_id, change_kinds, summary) values (%L, %L, %L, '{data}', 'A second change.')$q$,
    v_tenant, v_r2, v_a2), '23505');
  -- It affects the control version 1 was judged on and one nobody judged. A control is the
  -- catalog's, named once a change, and neither end of the row changes.
  insert into public.component_version_change_controls(id, tenant_id, component_definition_revision_id, component_version_change_id, control_id) values
    (v_listed, v_tenant, v_r2, v_change2, v_k2), (gen_random_uuid(), v_tenant, v_r2, v_change2, v_k4);
  perform pg_temp.expect_error(format(
    $q$insert into public.component_version_change_controls(tenant_id, component_definition_revision_id, component_version_change_id, control_id) values (%L, %L, %L, %L)$q$,
    v_tenant, v_r2, v_change2, v_k2), '23505');
  perform pg_temp.expect_error(format(
    $q$insert into public.component_version_change_controls(tenant_id, component_definition_revision_id, component_version_change_id, control_id) values (%L, %L, %L, %L)$q$,
    v_tenant, v_r2, v_change2, gen_random_uuid()), '23503');
  perform pg_temp.expect_error(format(
    $q$update public.component_version_change_controls set control_id = %L, revision = revision + 1 where id = %L$q$, v_k3, v_listed), '23514');
  perform pg_temp.expect_error(format(
    $q$update public.component_version_changes set defined_component_id = %L, revision = revision + 1 where id = %L$q$, v_b2, v_change2), '23514');
  -- While its version is a draft a change is its author's to correct.
  update public.component_version_changes set summary = 'A newer sshd, and the boot firmware that carries it.', revision = revision + 1 where id = v_change2;

  -- The draft reads what it would carry: k1 and k3 from version 1, k2 to review since its change
  -- lists it and version 1 was judged on it, k4 claimed and not assessed (its change lists it, and
  -- nobody ever judged it, so there is nothing to review), and nothing of the other unit's. The
  -- other unit carries its own, by its name; the new unit stands on nothing.
  if pg_temp.standing(v_a2, v_controls) <> jsonb_build_array(
      jsonb_build_array('satisfied', v_ca1, 1, false, null, null, null),
      jsonb_build_array('not_assessed', null, null, true, 2, 1, 'satisfied'),
      jsonb_build_array('partially_satisfied', v_ca1, 1, false, null, null, null),
      jsonb_build_array('not_assessed', null, null, false, null, null, null), null)
    or pg_temp.standing(v_b2, array[v_k1, v_k5]) <> jsonb_build_array(null, jsonb_build_array('satisfied', v_ca1, 1, false, null, null, null))
    or exists (select 1 from public.component_standing_lines(array[v_c2]))
    or (select l.carried_from_component_id from public.component_standing_lines(array[v_a2]) l where l.control_id = v_k1) <> v_a1
    or (select l.claimed from public.component_standing_lines(array[v_a2]) l where l.control_id = v_k2)
    or not (select l.claimed from public.component_standing_lines(array[v_a2]) l where l.control_id = v_k4) then
    raise exception 'A draft version reads %, the other unit %', pg_temp.standing(v_a2, v_controls), pg_temp.standing(v_b2, array[v_k1, v_k5]);
  end if;
  -- A draft version hands consumers nothing. They stay on the version they took, which reads as
  -- it did; nobody is behind; the review says there is nothing to take yet, and the command
  -- refuses the draft.
  select * into v_row from public.system_components where id = v_free;
  v_answer := public.component_version_review(v_free);
  if pg_temp.standing(v_a1, v_controls)->1 <> jsonb_build_array('satisfied', v_ca1, null, false, null, null, null)
    or pg_temp.inherits(v_own_program, v_e1, v_controls) <> jsonb_build_array(
      jsonb_build_array(1, 'satisfied', v_ca1), jsonb_build_array(2, 'satisfied', v_ca1),
      jsonb_build_array(3, 'partially_satisfied', v_ca1))
    or exists (select 1 from jsonb_array_elements(public.component_consumers(v_a1)->'systems') x where x->'behind' <> '0'::jsonb)
    or (select r.id from public.component_rows r where r.component_definition_id = v_definition and r.name = 'Unit A') <> v_a1
    or v_answer->'latest' <> 'null'::jsonb or v_answer->'behind' <> '0'::jsonb or v_answer->'newer_drafts' <> '1'::jsonb
    or v_answer->'versions' <> '[]'::jsonb or v_answer->'affected_controls' <> '[]'::jsonb
    or v_answer->'blocked'->>'code' <> 'latest' or v_answer->'taken'->'version' <> '1'::jsonb
    or (v_answer->'system_component'->>'revision')::bigint <> v_row.revision then
    raise exception 'A draft version moved a consumer: review %', v_answer;
  end if;
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, %s, %L)$q$,
    v_tenant, v_free, v_a2, v_row.revision, gen_random_uuid()), '23514', 'Only a published version can be taken');

  -- -------------------------------------------------------------------------------------------
  -- Version 2 published: its change is frozen, and consumers stay pinned.
  -- -------------------------------------------------------------------------------------------
  update public.component_definition_revisions set state = 'published', revision = revision + 1 where id = v_r2;
  perform pg_temp.expect_error(format(
    $q$update public.component_version_changes set summary = 'Rewritten after publication.', revision = revision + 1 where id = %L$q$, v_change2), '23514');
  perform pg_temp.expect_error(format($q$delete from public.component_version_changes where id = %L$q$, v_change2), '23514');
  perform pg_temp.expect_error(format($q$delete from public.component_version_change_controls where id = %L$q$, v_listed), '23514');
  perform pg_temp.expect_error(format(
    $q$insert into public.component_version_change_controls(tenant_id, component_definition_revision_id, component_version_change_id, control_id) values (%L, %L, %L, %L)$q$,
    v_tenant, v_r2, v_change2, v_k3), '23514');
  perform pg_temp.expect_error(format(
    $q$insert into public.component_version_changes(tenant_id, component_definition_revision_id, defined_component_id, change_kinds, summary) values (%L, %L, %L, '{data}', 'Recorded after publication.')$q$,
    v_tenant, v_r2, v_b2), '23514');
  -- The consumers still inherit what they took, the affected control too, and now read as behind.
  if pg_temp.inherits(v_own_program, v_e1, v_controls) <> jsonb_build_array(
      jsonb_build_array(1, 'satisfied', v_ca1), jsonb_build_array(2, 'satisfied', v_ca1),
      jsonb_build_array(3, 'partially_satisfied', v_ca1))
    or (select count(*) from jsonb_array_elements(public.component_consumers(v_a1)->'systems') x where x->'behind' = '1'::jsonb) <> 4
    or (select x->'behind' from jsonb_array_elements(public.system_upstream(v_own)->'components') x
      where x->>'system_component_id' = v_free::text) <> '1'::jsonb then
    raise exception 'A published version moved a consumer that did not take it: %', pg_temp.inherits(v_own_program, v_e1, v_controls);
  end if;
  -- The register lists the unit at its new version: two determinations stand on it, both carried
  -- from version 1's assessment, and one control is to review.
  select to_jsonb(r) into v_line from public.component_rows r where r.component_definition_id = v_definition and r.name = 'Unit A';
  if (v_line->>'id')::uuid <> v_a2 or v_line->'version' <> '2'::jsonb or v_line->'controls_claimed' <> '2'::jsonb
    or v_line->'controls_determined' <> '2'::jsonb or v_line->'controls_satisfied' <> '1'::jsonb
    or v_line->'controls_partially_satisfied' <> '1'::jsonb or v_line->'controls_to_review' <> '1'::jsonb
    or (v_line->>'assessment_id')::uuid <> v_ca1 or v_line->'consumers_behind' <> '5'::jsonb then
    raise exception 'The register lists the new version as %', v_line;
  end if;
  if (select r.controls_to_review from public.component_rows r where r.component_definition_id = v_definition and r.name = 'Unit B') <> 0
    or (select r.controls_determined from public.component_rows r where r.component_definition_id = v_definition and r.name = 'Unit C') <> 0 then
    raise exception 'The register counts a review or a determination on a unit that has none';
  end if;
  -- Its status says the same control by control, with the change and the assessment it rests on.
  v_answer := public.component_control_status(v_a2);
  if v_answer->'totals' <> '{"controls": 4, "satisfied": 1, "partially_satisfied": 1, "other_than_satisfied": 0, "not_assessed": 2, "carried": 2, "to_review": 1}'::jsonb
    or (select jsonb_agg(jsonb_build_array(c->'carried', c->'carried_from', c->'to_review', c->'review', c->>'status') order by k.place)
        from jsonb_array_elements(v_answer->'controls') c join unnest(v_controls) with ordinality k(id, place) on k.id::text = c->>'id')
      <> jsonb_build_array(
        jsonb_build_array(true, jsonb_build_object('defined_component_id', v_a1, 'version', 1), false, null, 'satisfied'),
        jsonb_build_array(false, null, true, '{"affected_in_version": 2, "earlier_version": 1, "earlier_determination": "satisfied"}'::jsonb, 'not_assessed'),
        jsonb_build_array(true, jsonb_build_object('defined_component_id', v_a1, 'version', 1), false, null, 'partially_satisfied'),
        jsonb_build_array(false, null, false, null, 'not_assessed'))
    or (v_answer->'change'->>'id')::uuid <> v_change2 or v_answer->'change'->'kinds' <> '["software", "firmware"]'::jsonb
    or v_answer->'change'->>'summary' <> 'A newer sshd, and the boot firmware that carries it.'
    or (select jsonb_agg(c->>'id') from jsonb_array_elements(v_answer->'change'->'controls') c) <> jsonb_build_array(v_k2, v_k4)
    or jsonb_array_length(v_answer->'assessments') <> 1
    or not v_answer->'assessments'->0 @> jsonb_build_object('id', v_ca1, 'version', 1, 'determinations', 2)
    or public.component_control_status(v_a1)->'change' <> 'null'::jsonb
    or public.component_control_status(v_a1)->'totals' <> '{"controls": 3, "satisfied": 2, "partially_satisfied": 1, "other_than_satisfied": 0, "not_assessed": 0, "carried": 0, "to_review": 0}'::jsonb then
    raise exception 'The new version''s status answered % of %', v_answer->'controls', v_answer - 'controls';
  end if;

  -- -------------------------------------------------------------------------------------------
  -- The version's own determination stands over a carried one. A draft assessment decides nothing.
  -- -------------------------------------------------------------------------------------------
  insert into public.component_assessments(id, tenant_id, component_definition_revision_id, profile_resolution_id, title)
    values (v_ca2, v_tenant, v_r2, v_base, 'Version 2 component assessment'), (v_ca_draft, v_tenant, v_r2, v_base, 'A draft on version 2');
  insert into public.component_determinations(tenant_id, component_assessment_id, component_definition_revision_id, defined_component_id, control_id, determination) values
    (v_tenant, v_ca2, v_r2, v_a2, v_k3, 'other_than_satisfied'), (v_tenant, v_ca_draft, v_r2, v_a2, v_k2, 'satisfied');
  if pg_temp.standing(v_a2, v_controls)->2 <> jsonb_build_array('partially_satisfied', v_ca1, 1, false, null, null, null) then
    raise exception 'A draft assessment of the new version decided %', pg_temp.standing(v_a2, v_controls)->2;
  end if;
  -- Published with an earlier moment than version 1's assessment, it still stands on its own version.
  update public.component_assessments set state = 'published', published_at = now() - interval '6 hours', revision = revision + 1 where id = v_ca2;
  if pg_temp.standing(v_a2, v_controls) <> jsonb_build_array(
      jsonb_build_array('satisfied', v_ca1, 1, false, null, null, null),
      jsonb_build_array('not_assessed', null, null, true, 2, 1, 'satisfied'),
      jsonb_build_array('other_than_satisfied', v_ca2, null, false, null, null, null),
      jsonb_build_array('not_assessed', null, null, false, null, null, null), null)
    -- Version 1 keeps what it was judged on.
    or pg_temp.standing(v_a1, v_controls)->2 <> jsonb_build_array('partially_satisfied', v_ca1, null, false, null, null, null) then
    raise exception 'The new version''s own determination does not stand over the carried one: %', pg_temp.standing(v_a2, v_controls);
  end if;
  -- The register names the version's own assessment before the one a carried determination came
  -- from, and counts both determinations.
  if (select jsonb_build_array(r.assessment_id, r.controls_determined, r.controls_other_than_satisfied, r.controls_to_review)
      from public.component_rows r where r.id = v_a2) <> jsonb_build_array(v_ca2, 2, 1, 1) then
    raise exception 'The register reads the version''s own assessment as %',
      (select to_jsonb(r) from public.component_rows r where r.id = v_a2);
  end if;

  -- -------------------------------------------------------------------------------------------
  -- The review: what Take version would change.
  -- -------------------------------------------------------------------------------------------
  -- Version 2 has no SBOM yet, so nothing says it fixes a CVE.
  v_answer := public.component_version_review(v_free);
  if v_answer->'vulnerabilities_fixed' <> '[]'::jsonb
    or v_answer->'vulnerabilities_open' <> '{"taken": 2, "latest": null}'::jsonb then
    raise exception 'A version with no SBOM is said to fix %', v_answer->'vulnerabilities_fixed';
  end if;
  -- Its SBOM lists the newer sshd with the first CVE fixed, and the same libc.
  insert into public.sboms(id, tenant_id, defined_component_id, title, format, generated_on)
    values (v_sbom2, v_tenant, v_a2, 'Unit A version 2 SBOM', 'cyclonedx', current_date - 1);
  insert into public.sbom_components(tenant_id, sbom_id, name, version) values
    (v_tenant, v_sbom2, 'sshd', '1.1'), (v_tenant, v_sbom2, 'libc', '2.0');
  insert into public.sbom_component_vulnerabilities(tenant_id, sbom_component_id, vulnerability_id, state)
    select v_tenant, c.id, x.cve, x.state
    from (values ('sshd', v_cve_fixed, 'fixed'), ('libc', v_cve_open, 'affected')) x(name, cve, state)
    join public.sbom_components c on c.tenant_id = v_tenant and c.sbom_id = v_sbom2 and c.name = x.name;
  select * into v_row from public.system_components where id = v_free;
  v_answer := public.component_version_review(v_free);
  if v_answer->'blocked' <> 'null'::jsonb or v_answer->'behind' <> '1'::jsonb or v_answer->'newer_drafts' <> '0'::jsonb
    or not v_answer->'system_component' @> jsonb_build_object('id', v_free, 'code', 'CV-OWN-A', 'revision', v_row.revision, 'assignment_id', null)
    or v_answer->'program'->>'id' <> v_own_program::text or v_answer->'system'->>'id' <> v_own::text
    or not v_answer->'element' @> jsonb_build_object('id', v_e1, 'product_element_id', null, 'modified', false)
    or not v_answer->'component' @> jsonb_build_object('name', 'Unit A', 'definition_id', v_definition, 'definition_code', 'cv-units')
    or not v_answer->'taken' @> jsonb_build_object('defined_component_id', v_a1, 'revision_id', v_r1, 'version', 1, 'state', 'published')
    or not v_answer->'latest' @> jsonb_build_object('defined_component_id', v_a2, 'revision_id', v_r2, 'version', 2)
    -- The one version between, with what it changes.
    or jsonb_array_length(v_answer->'versions') <> 1
    or not v_answer->'versions'->0 @> jsonb_build_object('revision_id', v_r2, 'version', 2, 'defined_component_id', v_a2)
    or not v_answer->'versions'->0->'change' @> jsonb_build_object('id', v_change2, 'kinds', jsonb_build_array('software', 'firmware'))
    or (select jsonb_agg(c->>'id') from jsonb_array_elements(v_answer->'versions'->0->'change'->'controls') c) <> jsonb_build_array(v_k2, v_k4)
    -- Three determinations stand on the version taken; on the latest one carries, one is its own
    -- and one control is to review.
    or v_answer->'determinations' <> '{"taken": 3, "carried": 1, "judged": 1, "to_review": 1}'::jsonb
    -- The CVE version 2 fixes, with the program's issue for it; the other still affects both.
    or jsonb_array_length(v_answer->'vulnerabilities_fixed') <> 1
    or not v_answer->'vulnerabilities_fixed'->0 @> jsonb_build_object('id', v_cve_fixed, 'cve_id', 'CVE-2099-0001', 'severity', 'high',
      'fixed_in', 'sshd 1.1', 'latest_state', 'fixed',
      'issue', jsonb_build_object('id', v_issue, 'title', 'CVE-2099-0001 in sshd', 'status', 'open', 'severity', 'high'))
    or v_answer->'vulnerabilities_open' <> '{"taken": 2, "latest": 1}'::jsonb then
    raise exception 'The review answered %', v_answer;
  end if;
  -- The affected controls: the one version 1 was judged on, which the element inherits today and
  -- would lose, with the program's control status on it; and the one nobody judged.
  if (select jsonb_agg(c order by k.place) from jsonb_array_elements(v_answer->'affected_controls') c
      join unnest(v_controls) with ordinality k(id, place) on k.id::text = c->>'id')
    <> (select jsonb_build_array(
      jsonb_build_object('id', v_k2, 'code', v_k2_code, 'title', (select k.title from public.controls k where k.id = v_k2),
        'versions', '[2]'::jsonb, 'taken_status', 'satisfied', 'latest_status', 'not_assessed', 'to_review', true,
        'control_status', s2.status, 'determined_by', s2.determined_by, 'inherited', true),
      jsonb_build_object('id', v_k4, 'code', (select k.code from public.controls k where k.id = v_k4),
        'title', (select k.title from public.controls k where k.id = v_k4),
        'versions', '[2]'::jsonb, 'taken_status', null, 'latest_status', 'not_assessed', 'to_review', false,
        'control_status', s4.status, 'determined_by', s4.determined_by, 'inherited', false))
      from public.program_control_standing_lines(v_own_program) s2, public.program_control_standing_lines(v_own_program) s4
      where s2.id = v_k2 and s4.id = v_k4)
    or v_answer->'affected_controls'->0->>'control_status' is null then
    raise exception 'The review lists the affected controls as %', v_answer->'affected_controls';
  end if;
  -- Why a version cannot be taken, where it cannot: through a library assignment, on an element
  -- inherited from a product, or built from no library component.
  if public.component_version_review(v_assigned)->'blocked'->>'code' <> 'assignment'
    or public.component_version_review(v_assigned)->'blocked'->>'message' not like '%Library tab%'
    or public.component_version_review(v_inherited)->'blocked'->>'code' <> 'product'
    or public.component_version_review(v_inherited)->'element'->>'product_element_id' <> v_pe1::text
    or public.component_version_review(v_plain)->'blocked'->>'code' <> 'not_library'
    or public.component_version_review(v_plain)->'taken' <> 'null'::jsonb
    or public.component_version_review(v_assigned)->'behind' <> '1'::jsonb then
    raise exception 'The review does not say why a version cannot be taken: %, %, %',
      public.component_version_review(v_assigned)->'blocked', public.component_version_review(v_inherited)->'blocked',
      public.component_version_review(v_plain)->'blocked';
  end if;

  -- -------------------------------------------------------------------------------------------
  -- Take version: what it refuses.
  -- -------------------------------------------------------------------------------------------
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values (v_r3, v_tenant, v_definition, 3);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values (v_a3, v_tenant, v_r3, 'Unit A', 'hardware');
  select count(*) into v_events from public.activity_events e where e.program_id = v_own_program;
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, null, %L)$q$,
    v_tenant, v_free, v_a2, gen_random_uuid()), '22023');
  -- A component changed since it was read, or gone.
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, %s, %L)$q$,
    v_tenant, v_free, v_a2, v_row.revision - 1, gen_random_uuid()), 'PT409', 'changed since you reviewed');
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, 1, %L)$q$,
    v_tenant, gen_random_uuid(), v_a2, gen_random_uuid()), 'PT404');
  -- A target that is not a newer published version of the same component: another unit, a
  -- component that does not exist, the version in use, and a draft.
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, %s, %L)$q$,
    v_tenant, v_free, v_b2, v_row.revision, gen_random_uuid()), '23514', 'Choose a version of the same component');
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, %s, %L)$q$,
    v_tenant, v_free, gen_random_uuid(), v_row.revision, gen_random_uuid()), '23514', 'Choose a version of the same component');
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, %s, %L)$q$,
    v_tenant, v_free, v_a1, v_row.revision, gen_random_uuid()), '23514', 'Choose a newer version');
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, %s, %L)$q$,
    v_tenant, v_free, v_a3, v_row.revision, gen_random_uuid()), '23514', 'Only a published version can be taken');
  -- A component that came through a library assignment, one on an element inherited from a
  -- product, and one built from no library component.
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, %s, %L)$q$,
    v_tenant, v_assigned, v_a2, (select c.revision from public.system_components c where c.id = v_assigned), gen_random_uuid()),
    '23514', 'came through a library assignment');
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, %s, %L)$q$,
    v_tenant, v_inherited, v_a2, (select c.revision from public.system_components c where c.id = v_inherited), gen_random_uuid()),
    '23514', 'inherited from a product');
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, %s, %L)$q$,
    v_tenant, v_plain, v_a2, (select c.revision from public.system_components c where c.id = v_plain), gen_random_uuid()),
    '23514', 'built from no library component');
  if (select c.defined_component_id from public.system_components c where c.id = v_free) <> v_a1
    or (select count(*) from public.activity_events e where e.program_id = v_own_program) <> v_events then
    raise exception 'A refused request moved the component or recorded an event';
  end if;

  -- -------------------------------------------------------------------------------------------
  -- Take version: what it writes, once.
  -- -------------------------------------------------------------------------------------------
  select s.revision into v_element_revision from public.systems s where s.id = v_e1;
  v_answer := public.take_component_version(v_tenant, v_free, v_a2, v_row.revision, v_request);
  if not v_answer @> jsonb_build_object('systemComponentId', v_free, 'programId', v_own_program,
      'definedComponentId', v_a2, 'previousDefinedComponentId', v_a1, 'version', 2, 'previousVersion', 1,
      'revision', v_row.revision + 1, 'carried', 1, 'judged', 1, 'toReview', 1) then
    raise exception 'Take version answered %', v_answer;
  end if;
  select * into v_row from public.system_components where id = v_free;
  -- The one pin moved, with its version text and who took it and when; why the component was
  -- built from the unit is its author's and stays. Nothing else was written.
  if v_row.defined_component_id <> v_a2 or v_row.version <> '2' or v_row.applied_by <> v_owner_user
    or v_row.applied_at < now() - interval '1 minute' or v_row.applied_rationale <> 'Built from the library unit.'
    or v_row.assignment_id is not null or v_row.revision <> (v_answer->>'revision')::bigint
    or (select s.revision from public.systems s where s.id = v_e1) <> v_element_revision
    or (select c.defined_component_id from public.system_components c where c.id = v_assigned) <> v_a1 then
    raise exception 'Take version wrote %', to_jsonb(v_row);
  end if;
  -- One activity event of the program, by the person, in the feeds' shape.
  select e.* into v_event from public.activity_events e where e.id = (v_answer->>'activityEventId')::uuid;
  if (select count(*) from public.activity_events e where e.program_id = v_own_program) <> v_events + 1
    or v_event.program_id <> v_own_program or v_event.actor_party_id is distinct from v_party or v_event.event_type <> 'updated'
    or num_nonnulls(v_event.task_id, v_event.issue_id, v_event.risk_id, v_event.poam_item_id, v_event.assessment_campaign_id) <> 0
    or v_event.description <> format(E'took version 2 of Unit A for CV-OWN-A\nComponent versions units, version 1 before. 1 determination carried forward; 1 control to review (%s).', v_k2_code) then
    raise exception 'Take version recorded the event %', to_jsonb(v_event);
  end if;
  -- The same request sent again answers as it first did and writes nothing; its id sent with
  -- another choice is refused.
  v_again := public.take_component_version(v_tenant, v_free, v_a2, v_row.revision - 1, v_request);
  if v_again <> v_answer or (select c.revision from public.system_components c where c.id = v_free) <> v_row.revision
    or (select count(*) from public.activity_events e where e.program_id = v_own_program) <> v_events + 1 then
    raise exception 'A request sent again answered % and wrote again', v_again;
  end if;
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, %s, %L)$q$,
    v_tenant, v_free, v_a2, v_row.revision, v_request), 'PT409', 'already answered another choice');
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, %s, %L)$q$,
    v_tenant, v_assigned, v_a2, v_row.revision - 1, v_request), 'PT409', 'already answered another choice');
  -- The consumer now inherits what carried and the version's own determination, and no longer the
  -- affected control; the element that did not take the version inherits what it did.
  if pg_temp.inherits(v_own_program, v_e1, v_controls) <> jsonb_build_array(
      jsonb_build_array(1, 'satisfied', v_ca1), jsonb_build_array(3, 'other_than_satisfied', v_ca2))
    or pg_temp.inherits(v_own_program, v_e2, v_controls) <> jsonb_build_array(
      jsonb_build_array(1, 'satisfied', v_ca1), jsonb_build_array(2, 'satisfied', v_ca1),
      jsonb_build_array(3, 'partially_satisfied', v_ca1)) then
    raise exception 'After taking the version the elements inherit % and %',
      pg_temp.inherits(v_own_program, v_e1, v_controls), pg_temp.inherits(v_own_program, v_e2, v_controls);
  end if;
  -- Upstream counts it: no longer behind, two controls judged and inherited, one carried and one
  -- to review; the review has nothing more to take.
  select x into v_line from jsonb_array_elements(public.system_upstream(v_own)->'components') x where x->>'system_component_id' = v_free::text;
  if v_line->'behind' <> '0'::jsonb or v_line->'version' <> '2'::jsonb or v_line->>'component_version' <> '2'
    or v_line->'controls_judged' <> '2'::jsonb or v_line->'controls_inherited' <> '2'::jsonb
    or v_line->'standing' <> '{"controls": 4, "satisfied": 1, "partially_satisfied": 0, "other_than_satisfied": 1, "not_assessed": 2, "carried": 1, "to_review": 1}'::jsonb
    or v_line->'vulnerabilities_open' <> '1'::jsonb
    or public.component_version_review(v_free)->'blocked'->>'code' <> 'latest'
    or public.component_version_review(v_free)->'taken'->'version' <> '2'::jsonb then
    raise exception 'Upstream of the component that took the version reads %', v_line;
  end if;

  -- A product element pinned to the new version follows the same lines: what carried and the
  -- version's own determination stand on it, the affected control does not.
  insert into public.product_revisions(id, tenant_id, product_id, version_number) values (v_prev2, v_tenant, v_product, 2);
  insert into public.product_elements(id, tenant_id, product_revision_id, code, name, element_type, defined_component_id, position)
    values (v_pe2, v_tenant, v_prev2, 'ONE', 'Pinned element', 'hardware', v_a2, 0);
  if (select jsonb_agg(jsonb_build_array(k.place, s.determination, s.inherited, s.component_assessment_id) order by k.place)
      from public.product_element_standing(v_tenant, v_prev2) s
      join unnest(v_controls) with ordinality k(id, place) on k.id = s.control_id where s.product_element_id = v_pe2)
    <> jsonb_build_array(jsonb_build_array(1, 'satisfied', true, v_ca1), jsonb_build_array(3, 'other_than_satisfied', true, v_ca2))
    or (select count(*) from public.product_element_standing(v_tenant, v_prev1) s where s.product_element_id = v_pe1) <> 3 then
    raise exception 'A product element pinned to the new version stands as %',
      (select jsonb_agg(to_jsonb(s)) from public.product_element_standing(v_tenant, v_prev2) s);
  end if;

  -- -------------------------------------------------------------------------------------------
  -- Version 3: carried across two versions, and a review that stays open.
  -- -------------------------------------------------------------------------------------------
  -- Its change lists k3, which version 2 was judged on itself. While it is a draft it already
  -- reads so, and a draft version between two published ones is no version's to answer for.
  -- A change names a component of its own version.
  perform pg_temp.expect_error(format(
    $q$insert into public.component_version_changes(tenant_id, component_definition_revision_id, defined_component_id, change_kinds, summary) values (%L, %L, %L, '{hardware}', 'Another version''s unit.')$q$,
    v_tenant, v_r3, v_b2), '23503');
  insert into public.component_version_changes(id, tenant_id, component_definition_revision_id, defined_component_id, change_kinds, summary)
    values (v_change3, v_tenant, v_r3, v_a3, array['hardware'], 'A new board revision.');
  insert into public.component_version_change_controls(tenant_id, component_definition_revision_id, component_version_change_id, control_id)
    values (v_tenant, v_r3, v_change3, v_k3);
  -- And a control a change of its own version.
  perform pg_temp.expect_error(format(
    $q$insert into public.component_version_change_controls(tenant_id, component_definition_revision_id, component_version_change_id, control_id) values (%L, %L, %L, %L)$q$,
    v_tenant, v_r3, v_change2, v_k1), '23503');
  update public.component_definition_revisions set state = 'published', revision = revision + 1 where id = v_r3;
  -- k1 is carried from version 1 across both; k2 is still to review, since version 2's change
  -- listed it and nobody judged it since; k3 is to review by this version's own change, with what
  -- version 2 read; k4 has no line, since version 3 claims nothing.
  if pg_temp.standing(v_a3, v_controls) <> jsonb_build_array(
      jsonb_build_array('satisfied', v_ca1, 1, false, null, null, null),
      jsonb_build_array('not_assessed', null, null, true, 2, 1, 'satisfied'),
      jsonb_build_array('not_assessed', null, null, true, 3, 2, 'other_than_satisfied'),
      null, null) then
    raise exception 'A third version reads %', pg_temp.standing(v_a3, v_controls);
  end if;
  -- Judged on version 3, k2 is its own again; version 2 still reads it to review.
  insert into public.component_assessments(id, tenant_id, component_definition_revision_id, profile_resolution_id, title)
    values (v_ca3, v_tenant, v_r3, v_base, 'Version 3 component assessment');
  insert into public.component_determinations(tenant_id, component_assessment_id, component_definition_revision_id, defined_component_id, control_id, determination)
    values (v_tenant, v_ca3, v_r3, v_a3, v_k2, 'partially_satisfied');
  update public.component_assessments set state = 'published', published_at = now() - interval '3 hours', revision = revision + 1 where id = v_ca3;
  if pg_temp.standing(v_a3, v_controls)->1 <> jsonb_build_array('partially_satisfied', v_ca3, null, false, null, null, null)
    or pg_temp.standing(v_a2, v_controls)->1 <> jsonb_build_array('not_assessed', null, null, true, 2, 1, 'satisfied') then
    raise exception 'A control judged again reads % on version 3 and % on version 2',
      pg_temp.standing(v_a3, v_controls)->1, pg_temp.standing(v_a2, v_controls)->1;
  end if;
  -- A fourth version, a draft with no change of its own, would carry k1 from version 1 and k2 from
  -- version 3, and keeps k3 to review by version 3's change.
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values (v_r4, v_tenant, v_definition, 4);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values (v_a4, v_tenant, v_r4, 'Unit A', 'hardware');
  if pg_temp.standing(v_a4, v_controls) <> jsonb_build_array(
      jsonb_build_array('satisfied', v_ca1, 1, false, null, null, null),
      jsonb_build_array('partially_satisfied', v_ca3, 3, false, null, null, null),
      jsonb_build_array('not_assessed', null, null, true, 3, 2, 'other_than_satisfied'),
      null, null) then
    raise exception 'A fourth version would read %', pg_temp.standing(v_a4, v_controls);
  end if;
  -- The review of a component two versions behind lists both versions between and every control
  -- their changes affect, each with the versions that list it.
  v_answer := public.component_version_review(v_assigned);
  if v_answer->'behind' <> '2'::jsonb or v_answer->'latest'->'version' <> '3'::jsonb or v_answer->'newer_drafts' <> '1'::jsonb
    or (select jsonb_agg(x->'version') from jsonb_array_elements(v_answer->'versions') x) <> '[2, 3]'::jsonb
    or (select jsonb_agg(jsonb_build_array(c->>'code', c->'versions', c->>'latest_status', c->'to_review', c->'inherited') order by k.place)
        from jsonb_array_elements(v_answer->'affected_controls') c join unnest(v_controls) with ordinality k(id, place) on k.id::text = c->>'id')
      <> jsonb_build_array(
        jsonb_build_array(v_k2_code, '[2]'::jsonb, 'partially_satisfied', false, true),
        jsonb_build_array(v_k3_code, '[3]'::jsonb, 'not_assessed', true, true),
        jsonb_build_array((select k.code from public.controls k where k.id = v_k4), '[2]'::jsonb, null, false, false))
    or v_answer->'determinations' <> '{"taken": 3, "carried": 1, "judged": 1, "to_review": 1}'::jsonb then
    raise exception 'The review of a component two versions behind answered %', v_answer;
  end if;

  perform set_config('test.program', v_own_program::text, true);
  perform set_config('test.revision', v_r4::text, true);
  perform set_config('test.unit', v_a4::text, true);
  perform set_config('test.unit_published', v_a3::text, true);
  perform set_config('test.component', v_free::text, true);
  perform set_config('test.control', v_k1::text, true);
  perform set_config('test.ready', 'yes', true);
end $$;

-- ---------------------------------------------------------------------------------------------
-- A viewer reads what a member reads and writes nothing.
-- ---------------------------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'c5510000-0000-0000-0000-000000000003', true);
do $$
declare v_tenant uuid := current_setting('test.tenant')::uuid;
begin
  if current_setting('test.ready') <> 'yes' then return; end if;
  if (select count(*) from public.component_version_changes) <> 2 or (select count(*) from public.component_version_change_controls) <> 3
    or public.component_version_review(current_setting('test.component')::uuid)->'latest'->'version' <> '3'::jsonb
    or public.component_control_status(current_setting('test.unit_published')::uuid)->'totals'->'to_review' <> '1'::jsonb then
    raise exception 'A viewer does not read what a member reads';
  end if;
  perform pg_temp.expect_error(format(
    $q$insert into public.component_version_changes(tenant_id, component_definition_revision_id, defined_component_id, change_kinds, summary) values (%L, %L, %L, '{software}', 'A viewer''s change.')$q$,
    v_tenant, current_setting('test.revision'), current_setting('test.unit')), '42501');
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, 1, %L)$q$,
    v_tenant, current_setting('test.component'), current_setting('test.unit_published'), gen_random_uuid()),
    '42501', 'An editor, admin, or owner can take a component version');
end $$;

-- ---------------------------------------------------------------------------------------------
-- The tenant boundary: another workspace's member reads none of it and names none of it.
-- ---------------------------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'c5510000-0000-0000-0000-000000000002', true);
do $$
declare v_tenant uuid := current_setting('test.tenant')::uuid; v_other uuid := current_setting('test.other_tenant')::uuid;
begin
  if current_setting('test.ready') <> 'yes' then return; end if;
  if exists (select 1 from public.component_version_changes) or exists (select 1 from public.component_version_change_controls)
    or exists (select 1 from public.component_standing_lines(array[current_setting('test.unit_published')::uuid])) then
    raise exception 'Another workspace reads a component''s versions';
  end if;
  perform pg_temp.expect_error(format($q$select public.component_version_review(%L)$q$, current_setting('test.component')), '42501');
  perform pg_temp.expect_error(format($q$select public.component_control_status(%L)$q$, current_setting('test.unit_published')), '42501');
  -- In the other workspace's name it may not write; in its own, the component is not there.
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, 1, %L)$q$,
    v_tenant, current_setting('test.component'), current_setting('test.unit_published'), gen_random_uuid()), '42501');
  perform pg_temp.expect_error(format($q$select public.take_component_version(%L, %L, %L, 1, %L)$q$,
    v_other, current_setting('test.component'), current_setting('test.unit_published'), gen_random_uuid()), 'PT404');
  -- A change of another workspace's component cannot be recorded from one's own, nor written into
  -- the other.
  perform pg_temp.expect_error(format(
    $q$insert into public.component_version_changes(tenant_id, component_definition_revision_id, defined_component_id, change_kinds, summary) values (%L, %L, %L, '{software}', 'Recorded across workspaces.')$q$,
    v_other, current_setting('test.revision'), current_setting('test.unit')), '23503');
  perform pg_temp.expect_error(format(
    $q$insert into public.component_version_changes(tenant_id, component_definition_revision_id, defined_component_id, change_kinds, summary) values (%L, %L, %L, '{software}', 'Written into another workspace.')$q$,
    v_tenant, current_setting('test.revision'), current_setting('test.unit')), '42501');
end $$;
-- A session with no account reaches none of it.
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$select count(*) from public.component_version_changes$$, '42501');
select pg_temp.expect_error($$select count(*) from public.component_version_change_controls$$, '42501');
select pg_temp.expect_error($$select public.component_version_review(gen_random_uuid())$$, '42501');
select pg_temp.expect_error($$select public.take_component_version(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 1, gen_random_uuid())$$, '42501');
reset role;
rollback;
