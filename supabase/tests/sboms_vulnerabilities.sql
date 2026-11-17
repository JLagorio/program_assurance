-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- SBOMs and CVE records: who may read and write them and whom import_sbom refuses; what an import
-- writes, the request sent again and each refusal in its words (no subject or two, a subject or an
-- evidence artifact of another workspace, no component or too many, a component with no name or of
-- an unknown kind, a name and version given twice, a ref given twice, a parent that is not in the
-- document, a component inside itself); a subject's standing SBOM being its latest by the day it
-- was generated; a CVE's record, its state on an SBOM component, the controls it bears on and the
-- operational issue that is a program's row for it; each view's counts; component_vulnerabilities
-- with a consumer that holds an issue and one that does not; what component_consumers,
-- system_upstream and component_rows gain, and a component's CVEs staying open while a consumer
-- still runs an affected version (a newer version that holds the fix, every consumer moved to it,
-- and the newest version affected with nobody on it); an accepted offer carrying the CVE to the
-- consumers' issues; and the tenant boundary.
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
-- Moves a system component to another version of its library component, as Take version would.
-- No client writes the pin; the helper is its owner's, so the guard that keeps clients from it lets
-- it through.
create function pg_temp.build_from(p_system_component uuid, p_defined_component uuid) returns void
language sql security definer set search_path = '' as $$
  update public.system_components
    set defined_component_id = p_defined_component, revision = revision + 1
    where id = p_system_component;
$$;
grant execute on function pg_temp.build_from(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Who may ask and who may write.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_function text; v_relation text;
begin
  foreach v_function in array array[
    'public.import_sbom(uuid, uuid, uuid, text, text, text, text, date, uuid, jsonb, uuid)',
    'public.component_vulnerabilities(uuid)', 'public.standing_sboms()',
    'public.component_open_vulnerabilities(uuid[])',
    'public.review_component_offer(uuid, uuid, bigint, text, text, uuid)',
    'public.component_consumers(uuid)', 'public.system_upstream(uuid)'] loop
    if has_function_privilege('anon', v_function, 'execute') or has_function_privilege('public', v_function, 'execute') then
      raise exception 'An anonymous session may execute %', v_function;
    end if;
    if not has_function_privilege('authenticated', v_function, 'execute') then
      raise exception 'A signed-in session may not execute %', v_function;
    end if;
  end loop;
  -- The reads run as their caller, so row-level security decides every row.
  foreach v_function in array array[
    'public.component_vulnerabilities(uuid)', 'public.standing_sboms()',
    'public.component_open_vulnerabilities(uuid[])',
    'public.component_consumers(uuid)', 'public.system_upstream(uuid)'] loop
    if (select p.prosecdef from pg_catalog.pg_proc p where p.oid = v_function::regprocedure) then
      raise exception '% does not run as its caller', v_function;
    end if;
  end loop;
  if has_function_privilege('authenticated', 'public.guard_sbom_component()', 'execute')
    or has_function_privilege('anon', 'public.guard_sbom_component()', 'execute') then
    raise exception 'A client may execute the SBOM component guard';
  end if;
  -- Members read the six tables and writers write them, row-level security deciding.
  foreach v_relation in array array[
    'public.sboms', 'public.sbom_components', 'public.vulnerabilities',
    'public.sbom_component_vulnerabilities', 'public.vulnerability_controls', 'public.issue_vulnerabilities'] loop
    if has_table_privilege('anon', v_relation, 'select') or has_table_privilege('anon', v_relation, 'insert') then
      raise exception 'An anonymous session reaches %', v_relation;
    end if;
    if not has_table_privilege('authenticated', v_relation, 'select')
      or not has_table_privilege('authenticated', v_relation, 'insert')
      or not has_table_privilege('authenticated', v_relation, 'update')
      or not has_table_privilege('authenticated', v_relation, 'delete') then
      raise exception 'A signed-in session may not read and write %', v_relation;
    end if;
    if not (select c.relrowsecurity from pg_catalog.pg_class c where c.oid = v_relation::regclass)
      or (select count(*) from pg_catalog.pg_policies p
        where p.schemaname = 'public' and p.tablename = split_part(v_relation, '.', 2)) <> 4 then
      raise exception '% is not under the tenant''s row-level security', v_relation;
    end if;
  end loop;
  -- The import's receipts are read by no client.
  if has_table_privilege('authenticated', 'public.sbom_import_requests', 'select')
    or has_table_privilege('authenticated', 'public.sbom_import_requests', 'insert')
    or has_table_privilege('anon', 'public.sbom_import_requests', 'select')
    or not (select c.relrowsecurity from pg_catalog.pg_class c where c.oid = 'public.sbom_import_requests'::regclass) then
    raise exception 'A client reaches the import''s receipts';
  end if;
  foreach v_relation in array array['public.vulnerability_rows', 'public.sbom_component_rows', 'public.component_rows'] loop
    if has_table_privilege('anon', v_relation, 'select') then
      raise exception 'An anonymous session may read %', v_relation;
    end if;
    if not exists (select 1 from pg_catalog.pg_class c where c.oid = v_relation::regclass
        and c.reloptions @> array['security_invoker=true'])
      or not has_table_privilege('authenticated', v_relation, 'select') then
      raise exception '% does not read as a signed-in caller', v_relation;
    end if;
  end loop;
  -- What the three reads gained comes last, so nothing that read them by position moves; after it
  -- comes only what component versions added, controls_to_review.
  if (select array_agg(x.attname::text order by x.attnum) from (
      select a.attname, a.attnum from pg_catalog.pg_attribute a where a.attrelid = 'public.component_rows'::regclass
        and a.attnum > 0 and not a.attisdropped order by a.attnum desc limit 2) x)
    <> array['vulnerabilities_open', 'controls_to_review'] then
    raise exception 'vulnerabilities_open is not the last column of component_rows before controls_to_review';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- A workspace: its owner and a viewer; and a member of another workspace, which holds a library
-- component and an evidence artifact of its own.
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email, raw_user_meta_data) values
  ('5b0a0000-0000-0000-0000-000000000001', 'sbom-owner@example.test', '{"name":"SBOM test owner"}'),
  ('5b0a0000-0000-0000-0000-000000000002', 'sbom-outsider@example.test', '{}'),
  ('5b0a0000-0000-0000-0000-000000000003', 'sbom-viewer@example.test', '{}');
select set_config('request.jwt.claim.sub', '5b0a0000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, '5b0a0000-0000-0000-0000-000000000003', 'viewer');
insert into public.parties(id, tenant_id, party_type, name, auth_user_id) values
  ('5b0a1000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'person', 'Set owner', null);
insert into public.component_definitions(id, tenant_id, code, name, owner_party_id) values
  ('5b0a3000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'sb-units', 'SBOM test units',
   '5b0a1000-0000-0000-0000-000000000001');
insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind) values
  ('5b0a4000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'Shared unit SBOM document', 'document');
select set_config('request.jwt.claim.sub', '5b0a0000-0000-0000-0000-000000000002', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
insert into public.component_definitions(id, tenant_id, code, name) values
  ('5b0a3000-0000-0000-0000-000000000009', current_setting('test.other_tenant')::uuid, 'elsewhere', 'Units elsewhere');
insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values
  ('5b0a3100-0000-0000-0000-000000000009', current_setting('test.other_tenant')::uuid, '5b0a3000-0000-0000-0000-000000000009', 1);
insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values
  ('5b0a3200-0000-0000-0000-000000000009', current_setting('test.other_tenant')::uuid, '5b0a3100-0000-0000-0000-000000000009', 'A unit elsewhere', 'software');
insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind) values
  ('5b0a4000-0000-0000-0000-000000000009', current_setting('test.other_tenant')::uuid, 'A document elsewhere', 'document');
insert into public.vulnerabilities(id, tenant_id, cve_id, title) values
  ('5b0a5000-0000-0000-0000-000000000009', current_setting('test.other_tenant')::uuid, 'CVE-2020-0001', 'A CVE recorded elsewhere');
select set_config('request.jwt.claim.sub', '5b0a0000-0000-0000-0000-000000000001', true);

-- ---------------------------------------------------------------------------------------------
-- With the pinned references installed.
-- ---------------------------------------------------------------------------------------------
-- One system line of component_consumers, by its program's code.
create function pg_temp.consumer(answer jsonb, program text) returns jsonb language sql stable as $$
  select s from jsonb_array_elements(answer->'systems') s where s->>'program_code' = program;
$$;
-- One component line of system_upstream, by the library component's name.
create function pg_temp.taken(answer jsonb, component text) returns jsonb language sql stable as $$
  select c from jsonb_array_elements(answer->'components') c where c->>'component_name' = component;
$$;
-- One CVE of component_vulnerabilities, by its identifier, and one of its consumers by program.
create function pg_temp.cve(answer jsonb, cve text) returns jsonb language sql stable as $$
  select v from jsonb_array_elements(answer->'vulnerabilities') v where v->>'cve_id' = cve;
$$;
create function pg_temp.answer_of(line jsonb, program text) returns jsonb language sql stable as $$
  select c from jsonb_array_elements(line->'consumers') c where c->>'program_code' = program;
$$;
-- A program with one system. `elements` is a list of [code, library pin].
create function pg_temp.system(p_code text, catalog uuid, base uuid, elements jsonb) returns uuid
language plpgsql as $$
declare profile uuid := gen_random_uuid();
begin
  perform public.create_program_wizard(current_setting('test.tenant')::uuid, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', p_code, 'name', p_code || ' SBOM test', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb,
    'catalogRevisionId', catalog,
    'profiles', jsonb_build_array(jsonb_build_object(
      'key', profile, 'baseResolutionId', base, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)),
    'systems', jsonb_build_array(jsonb_build_object(
      'key', gen_random_uuid(), 'code', p_code || '-SYS', 'name', p_code || ' system', 'description', '',
      'type', 'platform', 'ownerPartyId', null,
      'confidentiality', 'low', 'integrity', 'low', 'availability', 'low',
      'categorizationRationale', 'A limited impact boundary for a rollback test.',
      'profileKey', profile, 'product', null,
      'elements', (select coalesce(jsonb_agg(jsonb_build_object(
        'key', gen_random_uuid(), 'parentKey', null, 'code', p_code || '-' || (e->>0), 'name', e->>0, 'description', '',
        'type', null, 'library', e->1, 'productElementId', null)), '[]'::jsonb) from jsonb_array_elements(elements) e)))));
  return (select s.id from public.systems s where s.tenant_id = current_setting('test.tenant')::uuid and s.code = p_code || '-SYS');
end;
$$;
grant execute on function pg_temp.consumer(jsonb, text), pg_temp.taken(jsonb, text), pg_temp.cve(jsonb, text),
  pg_temp.answer_of(jsonb, text), pg_temp.system(text, uuid, uuid, jsonb) to authenticated;

do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_other_tenant uuid := current_setting('test.other_tenant')::uuid;
  v_owner_user uuid := '5b0a0000-0000-0000-0000-000000000001';
  v_outsider uuid := '5b0a0000-0000-0000-0000-000000000002';
  v_viewer uuid := '5b0a0000-0000-0000-0000-000000000003';
  v_definition uuid := '5b0a3000-0000-0000-0000-000000000001';
  v_document uuid := '5b0a4000-0000-0000-0000-000000000001';
  v_elsewhere_component uuid := '5b0a3200-0000-0000-0000-000000000009';
  v_elsewhere_document uuid := '5b0a4000-0000-0000-0000-000000000009';
  v_elsewhere_cve uuid := '5b0a5000-0000-0000-0000-000000000009';
  v_catalog uuid; v_base uuid; v_a uuid; v_b uuid; v_code_a text; v_code_b text;
  v_rev1 uuid := gen_random_uuid(); v_rev2 uuid := gen_random_uuid();
  v_shared1 uuid := gen_random_uuid(); v_other1 uuid := gen_random_uuid(); v_shared2 uuid := gen_random_uuid();
  v_product uuid := gen_random_uuid(); v_prev uuid := gen_random_uuid(); v_e_shr uuid := gen_random_uuid();
  v_p1 uuid; v_p2 uuid; v_p3 uuid; v_g1 uuid; v_g2 uuid; v_g3 uuid; v_c1 uuid;
  v_element uuid; v_asset uuid := gen_random_uuid();
  v_request uuid := gen_random_uuid();
  v_s1 uuid; v_s0 uuid; v_s_asset uuid; v_s_v2 uuid; v_s3 uuid;
  v_image uuid; v_sshd uuid; v_ssl uuid; v_zlib uuid; v_sshd_old uuid; v_sshd_asset uuid; v_sshd_v2 uuid;
  v_cve1 uuid := gen_random_uuid(); v_cve2 uuid := gen_random_uuid(); v_cve3 uuid := gen_random_uuid();
  v_i1 uuid := gen_random_uuid(); v_i_plain uuid := gen_random_uuid(); v_i2 uuid; v_poam uuid := gen_random_uuid();
  v_poam_item uuid := gen_random_uuid();
  v_sbom public.sboms; v_row public.vulnerability_rows; v_listed public.sbom_component_rows;
  v_register public.component_rows;
  v_components jsonb; v_result jsonb; v_again jsonb; v_answer jsonb; v_line jsonb; v_count integer;
  v_offer jsonb;
begin
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) >= 5
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the checks of SBOMs and CVEs were skipped';
    return;
  end if;
  -- Two controls a CVE can bear on, in the catalog's order.
  select (array_agg(k.id order by public.natural_sort_key(k.code) collate "C"))[1],
      (array_agg(k.id order by public.natural_sort_key(k.code) collate "C"))[2],
      (array_agg(k.code order by public.natural_sort_key(k.code) collate "C"))[1],
      (array_agg(k.code order by public.natural_sort_key(k.code) collate "C"))[2]
    into v_a, v_b, v_code_a, v_code_b
  from (select k.id, k.code from public.selected_controls sc join public.controls k on k.id = sc.control_id
    where sc.profile_resolution_id = v_base order by sc.ordinal, sc.control_id limit 2) k;

  -- The component set: version 1 with a shared unit and another unit; version 2 with the shared
  -- unit again. Both are published.
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values
    (v_rev1, v_tenant, v_definition, 1);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values
    (v_shared1, v_tenant, v_rev1, 'Shared unit', 'software'), (v_other1, v_tenant, v_rev1, 'Other unit', 'hardware');
  update public.component_definition_revisions set state = 'published', revision = revision + 1 where id = v_rev1;
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values
    (v_rev2, v_tenant, v_definition, 2);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values
    (v_shared2, v_tenant, v_rev2, 'Shared unit', 'software');
  update public.component_definition_revisions set state = 'published', revision = revision + 1 where id = v_rev2;
  -- Three programs: P1 holds both units of version 1, P2 the shared unit of version 1, and P3 took
  -- the shared unit from version 2. A product's element is pinned to the shared unit of version 1.
  v_p1 := pg_temp.system('SB-P1', v_catalog, v_base, jsonb_build_array(
    jsonb_build_array('SHR', jsonb_build_object('revisionId', v_rev1, 'definedComponentId', v_shared1, 'rationale', 'Taken from the library.')),
    jsonb_build_array('OTH', jsonb_build_object('revisionId', v_rev1, 'definedComponentId', v_other1, 'rationale', 'Taken from the library.'))));
  v_p2 := pg_temp.system('SB-P2', v_catalog, v_base, jsonb_build_array(
    jsonb_build_array('SHR', jsonb_build_object('revisionId', v_rev1, 'definedComponentId', v_shared1, 'rationale', 'Taken from the library.'))));
  v_p3 := pg_temp.system('SB-P3', v_catalog, v_base, jsonb_build_array(
    jsonb_build_array('SHR', jsonb_build_object('revisionId', v_rev2, 'definedComponentId', v_shared2, 'rationale', 'Taken from the library.'))));
  insert into public.products(id, tenant_id, code, name) values (v_product, v_tenant, 'SB-P', 'SBOM test product');
  insert into public.product_revisions(id, tenant_id, product_id, version_number) values (v_prev, v_tenant, v_product, 1);
  insert into public.product_elements(id, tenant_id, product_revision_id, code, name, element_type, defined_component_id, position)
    values (v_e_shr, v_tenant, v_prev, 'SHR', 'Shared element', 'software', v_shared1, 0);
  select s.program_id into v_g1 from public.systems s where s.id = v_p1;
  select s.program_id into v_g2 from public.systems s where s.id = v_p2;
  select s.program_id into v_g3 from public.systems s where s.id = v_p3;
  select c.id into v_c1 from public.system_components c where c.tenant_id = v_tenant and c.system_id = v_p1 and c.defined_component_id = v_shared1;
  select e.id into v_element from public.systems e where e.tenant_id = v_tenant and e.code = 'SB-P1-SHR';
  if v_c1 is null or v_element is null then
    raise exception 'P1 holds no system component built from the shared unit';
  end if;
  -- An asset of P1: the shared unit as installed.
  insert into public.inventory_items(id, tenant_id, system_id, composition_node_id, asset_id, name)
    values (v_asset, v_tenant, v_p1, v_element, 'SB-ASSET-1', 'Shared unit, serial 1');

  -- ---------------------------------------------------------------------------------------------
  -- Each refusal of an import, in its words, with nothing written.
  -- ---------------------------------------------------------------------------------------------
  v_components := jsonb_build_array(
    jsonb_build_object('ref', 'image', 'name', ' unit-image ', 'version', '1.0', 'kind', 'operating-system'),
    jsonb_build_object('ref', 'sshd', 'parent', 'image', 'name', 'sshd', 'version', '9.6', 'kind', 'application',
      'supplier', 'A supplier', 'purl', 'pkg:generic/sshd@9.6', 'cpe', 'cpe:2.3:a:example:sshd:9.6', 'license', 'BSD-2-Clause', 'hash', 'sha256:00'),
    jsonb_build_object('ref', 'ssl', 'parent', 'image', 'name', 'libssl', 'version', '3.0'),
    jsonb_build_object('name', 'zlib', 'parent', 'ssl'));
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, null)$q$, v_tenant, v_shared1, v_components), '22023', 'one subject');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, null, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_components, gen_random_uuid()), '22023', 'one subject: a library component version or an asset');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, %L, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_shared1, v_asset, v_components, gen_random_uuid()), '22023', 'one subject');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, '  ', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_shared1, v_components, gen_random_uuid()), '22023', 'a title and the day it was generated');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, null, null, %L, %L)$q$, v_tenant, v_shared1, v_components, gen_random_uuid()), '22023', 'a title and the day it was generated');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'pdf', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_shared1, v_components, gen_random_uuid()), '22023', 'CycloneDX, SPDX or other');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, '[]', %L)$q$, v_tenant, v_shared1, gen_random_uuid()), '22023', 'between 1 and 5,000 components');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, '{"name":"one"}', %L)$q$, v_tenant, v_shared1, gen_random_uuid()), '22023', 'between 1 and 5,000 components');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_shared1,
    (select jsonb_agg(jsonb_build_object('name', 'part-' || n)) from generate_series(1, 5001) n), gen_random_uuid()), '22023', 'between 1 and 5,000 components');
  -- A subject, or the evidence artifact that holds the document, outside the workspace.
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_elsewhere_component, v_components, gen_random_uuid()), 'PT404', 'library component is not in the workspace');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, null, %L, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, gen_random_uuid(), v_components, gen_random_uuid()), 'PT404', 'asset is not in the workspace');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', %L, %L, %L)$q$, v_tenant, v_shared1, v_elsewhere_document, v_components, gen_random_uuid()), 'PT404', 'evidence artifact is not in the workspace');
  -- A component with no name, of an unknown kind, listed twice, referred to twice, inside a
  -- component the document does not hold, or inside itself.
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_shared1,
    v_components || jsonb_build_array(jsonb_build_object('version', '1.0'), jsonb_build_object('name', '  '), 'a string'), gen_random_uuid()), '22023', 'Every component needs a name; 3 of this SBOM''s have none');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_shared1,
    v_components || jsonb_build_array(jsonb_build_object('name', 'a driver', 'kind', 'driver')), gen_random_uuid()), '22023', 'Component a driver has an unknown kind');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_shared1,
    v_components || jsonb_build_array(jsonb_build_object('name', 'sshd', 'version', ' 9.6 ')), gen_random_uuid()), '22023', 'sshd 9.6 is listed more than once');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_shared1,
    v_components || jsonb_build_array(jsonb_build_object('name', 'zlib')), gen_random_uuid()), '22023', 'zlib is listed more than once');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_shared1,
    v_components || jsonb_build_array(jsonb_build_object('name', 'another', 'ref', 'ssl')), gen_random_uuid()), '22023', 'The reference ssl names more than one component');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_shared1,
    v_components || jsonb_build_array(jsonb_build_object('name', 'orphan', 'parent', 'nowhere')), gen_random_uuid()), '22023', 'orphan names a parent, nowhere, that is not a component of this SBOM');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_shared1,
    jsonb_build_array(jsonb_build_object('name', 'loop', 'ref', 'loop', 'parent', 'loop')), gen_random_uuid()), '23514', 'cannot sit inside itself');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_shared1,
    jsonb_build_array(jsonb_build_object('name', 'one', 'ref', 'one', 'parent', 'two'), jsonb_build_object('name', 'two', 'ref', 'two', 'parent', 'one')), gen_random_uuid()), '23514', 'cannot sit inside itself');
  -- A viewer and a member of another workspace are refused, in either workspace's name.
  perform set_config('request.jwt.claim.sub', v_viewer::text, true);
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_shared1, v_components, gen_random_uuid()), '42501', 'can import an SBOM');
  perform set_config('request.jwt.claim.sub', v_outsider::text, true);
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_tenant, v_shared1, v_components, gen_random_uuid()), '42501');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'An SBOM', 'cyclonedx', '1.5', null, '2026-09-01', null, %L, %L)$q$, v_other_tenant, v_shared1, v_components, gen_random_uuid()), 'PT404');
  perform set_config('request.jwt.claim.sub', v_owner_user::text, true);
  if exists (select 1 from public.sboms) or exists (select 1 from public.sbom_components) then
    raise exception 'A refused import wrote something';
  end if;

  -- ---------------------------------------------------------------------------------------------
  -- An import: what it writes, and the request sent again.
  -- ---------------------------------------------------------------------------------------------
  v_result := public.import_sbom(v_tenant, v_shared1, null, '  Shared unit   image SBOM ', 'cyclonedx', ' 1.5 ',
    'urn:uuid:5b0a6000-0000-0000-0000-000000000001', '2026-09-01', v_document, v_components, v_request);
  v_s1 := (v_result->>'sbomId')::uuid;
  select * into v_sbom from public.sboms where id = v_s1;
  select c.id into v_image from public.sbom_components c where c.sbom_id = v_s1 and c.name = 'unit-image';
  select c.id into v_sshd from public.sbom_components c where c.sbom_id = v_s1 and c.name = 'sshd';
  select c.id into v_ssl from public.sbom_components c where c.sbom_id = v_s1 and c.name = 'libssl';
  select c.id into v_zlib from public.sbom_components c where c.sbom_id = v_s1 and c.name = 'zlib';
  if v_sbom.title <> 'Shared unit image SBOM' or v_sbom.format <> 'cyclonedx' or v_sbom.spec_version <> '1.5'
    or v_sbom.serial <> 'urn:uuid:5b0a6000-0000-0000-0000-000000000001' or v_sbom.generated_on <> date '2026-09-01'
    or v_sbom.defined_component_id <> v_shared1 or v_sbom.inventory_item_id is not null
    or v_sbom.evidence_artifact_id <> v_document or v_sbom.created_by <> v_owner_user
    or (v_result->>'components')::integer <> 4 or not (v_result->>'standing')::boolean
    or (v_result->>'definedComponentId')::uuid <> v_shared1 or v_result->'inventoryItemId' <> 'null'::jsonb
    or v_result->>'title' <> 'Shared unit image SBOM' or v_result->>'generatedOn' <> '2026-09-01'
    or (select count(*) from public.sbom_components c where c.sbom_id = v_s1) <> 4 then
    raise exception 'Importing an SBOM answered % and wrote %', v_result, to_jsonb(v_sbom);
  end if;
  if not exists (select 1 from public.sbom_components c where c.id = v_image and c.parent_component_id is null
      and c.kind = 'operating-system' and c.version = '1.0')
    or not exists (select 1 from public.sbom_components c where c.id = v_sshd and c.parent_component_id = v_image
      and c.kind = 'application' and c.version = '9.6' and c.supplier = 'A supplier' and c.purl = 'pkg:generic/sshd@9.6'
      and c.cpe = 'cpe:2.3:a:example:sshd:9.6' and c.license = 'BSD-2-Clause' and c.hash = 'sha256:00')
    or not exists (select 1 from public.sbom_components c where c.id = v_ssl and c.parent_component_id = v_image and c.kind = 'library')
    or not exists (select 1 from public.sbom_components c where c.id = v_zlib and c.parent_component_id = v_ssl
      and c.kind = 'library' and c.version is null and c.supplier is null) then
    raise exception 'The components of an imported SBOM read %',
      (select jsonb_agg(to_jsonb(c)) from public.sbom_components c where c.sbom_id = v_s1);
  end if;
  -- The same request again answers as it first did and writes nothing; its id with another choice
  -- is refused.
  v_again := public.import_sbom(v_tenant, v_shared1, null, 'Shared unit image SBOM', 'cyclonedx', '1.5',
    'urn:uuid:5b0a6000-0000-0000-0000-000000000001', '2026-09-01', v_document, v_components, v_request);
  if v_again <> v_result or (select count(*) from public.sboms) <> 1 or (select count(*) from public.sbom_components) <> 4 then
    raise exception 'The same import sent again answered % after %', v_again, v_result;
  end if;
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'Shared unit image SBOM', 'cyclonedx', '1.5', 'urn:uuid:5b0a6000-0000-0000-0000-000000000001', '2026-09-01', %L, %L, %L)$q$,
    v_tenant, v_shared1, v_document, v_components || jsonb_build_array(jsonb_build_object('name', 'one more')), v_request), 'PT409', 'already used with different details');
  perform pg_temp.expect_error(format($q$select public.import_sbom(%L, %L, null, 'Shared unit image SBOM', 'cyclonedx', '1.5', 'urn:uuid:5b0a6000-0000-0000-0000-000000000001', '2026-09-02', %L, %L, %L)$q$,
    v_tenant, v_shared1, v_document, v_components, v_request), 'PT409', 'already used with different details');
  -- What the tables themselves refuse: two subjects or none, a subject that changes, a name and
  -- version listed twice, a parent in another SBOM, and a client writing a receipt.
  perform pg_temp.expect_error(format($q$insert into public.sboms(tenant_id, title, format, generated_on) values (%L, 'No subject', 'spdx', '2026-09-01')$q$, v_tenant), '23514', 'sboms_subject');
  perform pg_temp.expect_error(format($q$insert into public.sboms(tenant_id, defined_component_id, inventory_item_id, title, format, generated_on) values (%L, %L, %L, 'Two subjects', 'spdx', '2026-09-01')$q$, v_tenant, v_shared1, v_asset), '23514', 'sboms_subject');
  perform pg_temp.expect_error(format($q$update public.sboms set defined_component_id = %L, revision = revision + 1 where id = %L$q$, v_other1, v_s1), '23514', 'cannot change');
  perform pg_temp.expect_error(format($q$insert into public.sbom_components(tenant_id, sbom_id, name, version) values (%L, %L, 'sshd', '9.6')$q$, v_tenant, v_s1), '23505');
  perform pg_temp.expect_error(format($q$insert into public.sbom_components(tenant_id, sbom_id, name) values (%L, %L, 'zlib')$q$, v_tenant, v_s1), '23505');
  perform pg_temp.expect_error(format($q$insert into public.sbom_components(tenant_id, sbom_id, name, kind) values (%L, %L, 'a driver', 'driver')$q$, v_tenant, v_s1), '23514');
  perform pg_temp.expect_error(format($q$update public.sbom_components set parent_component_id = %L, revision = revision + 1 where id = %L$q$, v_zlib, v_image), '23514', 'cannot sit inside itself');
  perform pg_temp.expect_error(format($q$insert into public.sbom_import_requests(id, tenant_id, sbom_id, request, result, created_by) values (%L, %L, %L, '{}', '{}', %L)$q$,
    gen_random_uuid(), v_tenant, v_s1, v_owner_user), '42501');

  -- ---------------------------------------------------------------------------------------------
  -- The standing SBOM is the subject's latest by the day it was generated. An older one recorded
  -- afterwards does not stand; an asset and another version each have their own.
  -- ---------------------------------------------------------------------------------------------
  v_result := public.import_sbom(v_tenant, v_shared1, null, 'Shared unit image SBOM, August', 'cyclonedx', '1.4', null, '2026-08-01', null,
    jsonb_build_array(jsonb_build_object('name', 'sshd', 'version', '9.5', 'kind', 'application')), gen_random_uuid());
  v_s0 := (v_result->>'sbomId')::uuid;
  select c.id into v_sshd_old from public.sbom_components c where c.sbom_id = v_s0;
  if (v_result->>'standing')::boolean
    or (select s.sbom_id from public.standing_sboms() s where s.defined_component_id = v_shared1) <> v_s1
    or (select count(*) from public.standing_sboms()) <> 1 then
    raise exception 'An older SBOM recorded afterwards stands: %', v_result;
  end if;
  v_result := public.import_sbom(v_tenant, null, v_asset, 'Shared unit serial 1, as installed', 'spdx', '2.3', null, '2026-09-10', null,
    jsonb_build_array(jsonb_build_object('name', 'sshd', 'version', '9.6', 'kind', 'application'),
      jsonb_build_object('name', 'kernel', 'version', '6.1', 'kind', 'operating-system')), gen_random_uuid());
  v_s_asset := (v_result->>'sbomId')::uuid;
  select c.id into v_sshd_asset from public.sbom_components c where c.sbom_id = v_s_asset and c.name = 'sshd';
  v_result := public.import_sbom(v_tenant, v_shared2, null, 'Shared unit image SBOM, version 2', 'cyclonedx', '1.5', null, '2026-09-15', null,
    jsonb_build_array(jsonb_build_object('name', 'sshd', 'version', '9.8', 'kind', 'application')), gen_random_uuid());
  v_s_v2 := (v_result->>'sbomId')::uuid;
  select c.id into v_sshd_v2 from public.sbom_components c where c.sbom_id = v_s_v2;
  if not (v_result->>'standing')::boolean or (v_result->>'inventoryItemId') is not null
    or (select count(*) from public.standing_sboms()) <> 3
    or (select s.sbom_id from public.standing_sboms() s where s.inventory_item_id = v_asset) <> v_s_asset
    or (select s.sbom_id from public.standing_sboms() s where s.defined_component_id = v_shared2) <> v_s_v2 then
    raise exception 'Each subject does not have its own standing SBOM';
  end if;

  -- ---------------------------------------------------------------------------------------------
  -- CVE records, their state on SBOM components and the controls they bear on.
  -- ---------------------------------------------------------------------------------------------
  insert into public.vulnerabilities(id, tenant_id, cve_id, title, description, severity, cvss_score, cvss_vector, published_on, fixed_in, source_uri, known_exploited) values
    (v_cve1, v_tenant, 'CVE-2024-11111', 'A race in sshd', 'A test record.', 'high', 8.1, 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H', '2024-07-01', 'sshd 9.8', 'https://example.test/cve-2024-11111', false),
    (v_cve2, v_tenant, 'CVE-2024-2222', 'A flaw in libssl', null, 'critical', 9.8, null, '2024-03-01', null, null, true),
    (v_cve3, v_tenant, 'CVE-2023-33333', 'Something in zlib nobody has rated', null, null, null, null, null, null, null, false);
  perform pg_temp.expect_error(format($q$insert into public.vulnerabilities(tenant_id, cve_id, title) values (%L, 'CVE-24-1', 'Misshapen')$q$, v_tenant), '23514');
  perform pg_temp.expect_error(format($q$insert into public.vulnerabilities(tenant_id, cve_id, title) values (%L, 'cve-2024-11112', 'Lower case')$q$, v_tenant), '23514');
  perform pg_temp.expect_error(format($q$insert into public.vulnerabilities(tenant_id, cve_id, title) values (%L, 'CVE-2024-11111', 'Twice')$q$, v_tenant), '23505');
  perform pg_temp.expect_error(format($q$insert into public.vulnerabilities(tenant_id, cve_id, title, severity) values (%L, 'CVE-2024-44444', 'Unknown level', 'severe')$q$, v_tenant), '23514');
  perform pg_temp.expect_error(format($q$insert into public.vulnerabilities(tenant_id, cve_id, title, cvss_score) values (%L, 'CVE-2024-44444', 'Off the scale', 10.1)$q$, v_tenant), '23514');
  perform pg_temp.expect_error(format($q$update public.vulnerabilities set cve_id = 'CVE-2024-55555', revision = revision + 1 where id = %L$q$, v_cve1), '23514', 'cannot change');
  insert into public.sbom_component_vulnerabilities(tenant_id, sbom_component_id, vulnerability_id, state, note) values
    (v_tenant, v_sshd, v_cve1, 'affected', '9.6 is inside the affected range.'),
    (v_tenant, v_sshd, v_cve2, 'affected', null),
    (v_tenant, v_ssl, v_cve2, 'affected', null),
    (v_tenant, v_zlib, v_cve3, 'under_investigation', null),
    -- On an SBOM a later one replaced, on an asset, and fixed in version 2.
    (v_tenant, v_sshd_old, v_cve1, 'affected', null),
    (v_tenant, v_sshd_asset, v_cve1, 'affected', null),
    (v_tenant, v_sshd_v2, v_cve1, 'fixed', '9.8 holds the fix.');
  perform pg_temp.expect_error(format($q$insert into public.sbom_component_vulnerabilities(tenant_id, sbom_component_id, vulnerability_id) values (%L, %L, %L)$q$, v_tenant, v_sshd, v_cve1), '23505');
  perform pg_temp.expect_error(format($q$insert into public.sbom_component_vulnerabilities(tenant_id, sbom_component_id, vulnerability_id, state) values (%L, %L, %L, 'exploitable')$q$, v_tenant, v_image, v_cve1), '23514');
  perform pg_temp.expect_error(format($q$insert into public.sbom_component_vulnerabilities(tenant_id, sbom_component_id, vulnerability_id) values (%L, %L, %L)$q$, v_tenant, v_image, v_elsewhere_cve), '23503');
  insert into public.vulnerability_controls(tenant_id, vulnerability_id, control_id) values
    (v_tenant, v_cve1, v_b), (v_tenant, v_cve1, v_a);
  perform pg_temp.expect_error(format($q$insert into public.vulnerability_controls(tenant_id, vulnerability_id, control_id) values (%L, %L, %L)$q$, v_tenant, v_cve1, v_a), '23505');
  perform pg_temp.expect_error(format($q$insert into public.vulnerability_controls(tenant_id, vulnerability_id, control_id) values (%L, %L, %L)$q$, v_tenant, v_cve1, gen_random_uuid()), '23503');

  -- ---------------------------------------------------------------------------------------------
  -- The CVEs' register and the standing SBOMs' components.
  -- ---------------------------------------------------------------------------------------------
  select * into v_row from public.vulnerability_rows r where r.id = v_cve1;
  if v_row.cve_id <> 'CVE-2024-11111' or v_row.severity <> 'high' or v_row.severity_rank <> 3 or v_row.cvss_score <> 8.1
    or v_row.fixed_in <> 'sshd 9.8' or v_row.known_exploited
    -- The shared unit's sshd and the asset's; the August SBOM's does not stand and version 2 holds the fix.
    or v_row.sbom_components_affected <> 2 or v_row.components_affected <> 1 or v_row.assets_affected <> 1
    or v_row.programs_open <> 0 or v_row.issues_open <> 0 or v_row.controls <> 2 then
    raise exception 'A CVE on a library component and an asset read %', to_jsonb(v_row);
  end if;
  select * into v_row from public.vulnerability_rows r where r.id = v_cve2;
  if v_row.severity_rank <> 4 or not v_row.known_exploited or v_row.sbom_components_affected <> 2
    or v_row.components_affected <> 1 or v_row.assets_affected <> 0 or v_row.controls <> 0 then
    raise exception 'A CVE on two components of one SBOM read %', to_jsonb(v_row);
  end if;
  select * into v_row from public.vulnerability_rows r where r.id = v_cve3;
  if v_row.severity_rank is not null or v_row.sbom_components_affected <> 0 or v_row.components_affected <> 0
    or v_row.assets_affected <> 0 then
    raise exception 'A CVE under investigation read %', to_jsonb(v_row);
  end if;
  -- CVE-2024-2222 before CVE-2024-11111, numbers by their value.
  if (select array_agg(r.cve_id order by r.cve_order) from public.vulnerability_rows r)
    <> array['CVE-2023-33333', 'CVE-2024-2222', 'CVE-2024-11111'] then
    raise exception 'The CVEs do not sort by their numbers';
  end if;
  -- Four components of the shared unit's standing SBOM, two of the asset's, one of version 2's;
  -- the August SBOM's is not listed.
  if (select count(*) from public.sbom_component_rows) <> 7
    or (select count(*) from public.sbom_component_rows r where r.defined_component_id = v_shared1) <> 4
    or exists (select 1 from public.sbom_component_rows r where r.id = v_sshd_old) then
    raise exception 'The standing SBOMs list % components', (select count(*) from public.sbom_component_rows);
  end if;
  select * into v_listed from public.sbom_component_rows r where r.id = v_sshd;
  if v_listed.subject_kind <> 'component' or v_listed.subject_name <> 'Shared unit' or v_listed.subject_version <> 1
    or v_listed.subject_code <> 'sb-units' or v_listed.inventory_item_id is not null or v_listed.program_id is not null
    or v_listed.sbom_id <> v_s1 or v_listed.sbom_title <> 'Shared unit image SBOM' or v_listed.sbom_format <> 'cyclonedx'
    or v_listed.sbom_generated_on <> date '2026-09-01' or v_listed.parent_name <> 'unit-image'
    or v_listed.vulnerabilities <> 2 or v_listed.worst_severity <> 'critical' or v_listed.worst_severity_rank <> 4 then
    raise exception 'A component with two CVEs read %', to_jsonb(v_listed);
  end if;
  select * into v_listed from public.sbom_component_rows r where r.id = v_zlib;
  if v_listed.vulnerabilities <> 0 or v_listed.worst_severity is not null or v_listed.worst_severity_rank is not null
    or v_listed.parent_name <> 'libssl' then
    raise exception 'A component under investigation read %', to_jsonb(v_listed);
  end if;
  select * into v_listed from public.sbom_component_rows r where r.id = v_sshd_asset;
  if v_listed.subject_kind <> 'asset' or v_listed.subject_name <> 'Shared unit, serial 1' or v_listed.subject_version is not null
    or v_listed.subject_code <> 'SB-ASSET-1' or v_listed.inventory_item_id <> v_asset or v_listed.defined_component_id is not null
    or v_listed.system_id <> v_p1 or v_listed.program_id <> v_g1 or v_listed.parent_name is not null
    or v_listed.vulnerabilities <> 1 or v_listed.worst_severity <> 'high' or v_listed.worst_severity_rank <> 3 then
    raise exception 'A component of an asset''s SBOM read %', to_jsonb(v_listed);
  end if;

  -- ---------------------------------------------------------------------------------------------
  -- The CVEs on a component version, and who has answered them.
  -- ---------------------------------------------------------------------------------------------
  v_answer := public.component_vulnerabilities(v_shared1);
  if (v_answer->'sbom'->>'id')::uuid <> v_s1 or (v_answer->'sbom'->>'components')::integer <> 4
    or v_answer->'sbom'->>'generated_on' <> '2026-09-01' or v_answer->'component'->>'name' <> 'Shared unit'
    or (v_answer->'component'->>'version')::integer <> 1
    or (v_answer->'component'->>'owner_party_id')::uuid <> '5b0a1000-0000-0000-0000-000000000001'
    -- The worst first.
    or (select jsonb_agg(v->>'cve_id') from jsonb_array_elements(v_answer->'vulnerabilities') v)
      <> '["CVE-2024-2222", "CVE-2024-11111"]'::jsonb
    or v_answer->'totals' <> jsonb_build_object('vulnerabilities', 2, 'sbom_components', 2, 'programs', 2,
      'unanswered', 4, 'programs_unanswered', 2) then
    raise exception 'The CVEs on the shared unit, before anybody answered, read %', v_answer;
  end if;
  v_line := pg_temp.cve(v_answer, 'CVE-2024-11111');
  if v_line->>'severity' <> 'high' or (v_line->>'cvss_score')::numeric <> 8.1 or v_line->>'fixed_in' <> 'sshd 9.8'
    or (v_line->>'known_exploited')::boolean
    or jsonb_array_length(v_line->'components') <> 1 or v_line->'components'->0->>'name' <> 'sshd'
    or (v_line->'components'->0->>'sbom_component_id')::uuid <> v_sshd
    or v_line->'components'->0->>'note' <> '9.6 is inside the affected range.'
    or (select jsonb_agg(k->>'code') from jsonb_array_elements(v_line->'controls') k) <> jsonb_build_array(v_code_a, v_code_b)
    -- P1 and P2 are built from version 1; P3 took version 2 and is not exposed.
    or (select jsonb_agg(c->>'program_code') from jsonb_array_elements(v_line->'consumers') c) <> '["SB-P1", "SB-P2"]'::jsonb
    or (pg_temp.answer_of(v_line, 'SB-P1')->>'answered')::boolean or pg_temp.answer_of(v_line, 'SB-P1')->'issue' <> 'null'::jsonb
    or (pg_temp.answer_of(v_line, 'SB-P1')->>'issues')::integer <> 0
    or (pg_temp.answer_of(v_line, 'SB-P1')->'system_components'->0->>'system_component_id')::uuid <> v_c1
    or (v_line->>'programs')::integer <> 2 or (v_line->>'programs_answered')::integer <> 0
    or (v_line->>'programs_open')::integer <> 0 then
    raise exception 'A CVE nobody has answered read %', v_line;
  end if;
  if jsonb_array_length(pg_temp.cve(v_answer, 'CVE-2024-2222')->'components') <> 2
    or pg_temp.cve(v_answer, 'CVE-2024-2222')->'controls' <> '[]'::jsonb then
    raise exception 'A CVE on two components read %', pg_temp.cve(v_answer, 'CVE-2024-2222');
  end if;
  -- Version 2 holds the fix, and the other unit has no SBOM.
  v_answer := public.component_vulnerabilities(v_shared2);
  if (v_answer->'sbom'->>'id')::uuid <> v_s_v2 or v_answer->'vulnerabilities' <> '[]'::jsonb
    or v_answer->'totals' <> jsonb_build_object('vulnerabilities', 0, 'sbom_components', 0, 'programs', 1,
      'unanswered', 0, 'programs_unanswered', 0) then
    raise exception 'A version that holds the fix read %', v_answer;
  end if;
  v_answer := public.component_vulnerabilities(v_other1);
  if v_answer->'sbom' <> 'null'::jsonb or v_answer->'vulnerabilities' <> '[]'::jsonb
    or (v_answer->'totals'->>'programs')::integer <> 1 then
    raise exception 'A component with no SBOM read %', v_answer;
  end if;

  -- P1 opens its row for the first CVE, and a POA&M item answers it.
  insert into public.operational_issues(id, tenant_id, program_id, title, description, severity, opened_at) values
    (v_i1, v_tenant, v_g1, 'CVE-2024-11111 in the shared unit''s sshd', 'Found by a scan.', 'high', now() - interval '2 days'),
    (v_i_plain, v_tenant, v_g1, 'A loose connector', null, 'low', now() - interval '1 day');
  insert into public.issue_vulnerabilities(tenant_id, issue_id, vulnerability_id) values (v_tenant, v_i1, v_cve1);
  perform pg_temp.expect_error(format($q$insert into public.issue_vulnerabilities(tenant_id, issue_id, vulnerability_id) values (%L, %L, %L)$q$, v_tenant, v_i1, v_cve1), '23505');
  perform pg_temp.expect_error(format($q$insert into public.issue_vulnerabilities(tenant_id, issue_id, vulnerability_id) values (%L, %L, %L)$q$, v_tenant, v_i1, v_elsewhere_cve), '23503');
  perform pg_temp.expect_error(format($q$update public.issue_vulnerabilities set vulnerability_id = %L, revision = revision + 1 where issue_id = %L$q$, v_cve2, v_i1), '23514', 'cannot change');
  insert into public.poam_documents(id, tenant_id, title, program_id) values (v_poam, v_tenant, 'SB-P1 POA&M', v_g1);
  insert into public.poam_items(id, tenant_id, poam_document_id, title) values (v_poam_item, v_tenant, v_poam, 'Rebuild the image with sshd 9.8');
  insert into public.issue_poams(tenant_id, issue_id, poam_item_id) values (v_tenant, v_i1, v_poam_item);
  v_answer := public.component_vulnerabilities(v_shared1);
  v_line := pg_temp.cve(v_answer, 'CVE-2024-11111');
  if not (pg_temp.answer_of(v_line, 'SB-P1')->>'answered')::boolean
    or (pg_temp.answer_of(v_line, 'SB-P1')->'issue'->>'issue_id')::uuid <> v_i1
    or pg_temp.answer_of(v_line, 'SB-P1')->'issue'->>'status' <> 'open'
    or not (pg_temp.answer_of(v_line, 'SB-P1')->'issue'->>'open')::boolean
    or (pg_temp.answer_of(v_line, 'SB-P1')->'issue'->>'poam_items')::integer <> 1
    or (pg_temp.answer_of(v_line, 'SB-P1')->>'issues')::integer <> 1
    -- P2 holds none: exposed, and it has not answered.
    or (pg_temp.answer_of(v_line, 'SB-P2')->>'answered')::boolean or pg_temp.answer_of(v_line, 'SB-P2')->'issue' <> 'null'::jsonb
    or (v_line->>'programs_answered')::integer <> 1 or (v_line->>'programs_open')::integer <> 1
    or (pg_temp.answer_of(pg_temp.cve(v_answer, 'CVE-2024-2222'), 'SB-P1')->>'answered')::boolean
    or v_answer->'totals' <> jsonb_build_object('vulnerabilities', 2, 'sbom_components', 2, 'programs', 2,
      'unanswered', 3, 'programs_unanswered', 2) then
    raise exception 'A CVE one consumer answered read % with the totals %', v_line, v_answer->'totals';
  end if;
  select * into v_row from public.vulnerability_rows r where r.id = v_cve1;
  if v_row.programs_open <> 1 or v_row.issues_open <> 1 then
    raise exception 'A CVE one program holds an issue for read %', to_jsonb(v_row);
  end if;

  -- ---------------------------------------------------------------------------------------------
  -- What the three reads gained: how many CVEs affect each component version, and how many are
  -- open on the component.
  -- ---------------------------------------------------------------------------------------------
  v_answer := public.component_consumers(v_shared1);
  if (v_answer->>'vulnerabilities_open')::integer <> 2
    or (pg_temp.consumer(v_answer, 'SB-P1')->>'vulnerabilities_open')::integer <> 2
    or (pg_temp.consumer(v_answer, 'SB-P2')->>'vulnerabilities_open')::integer <> 2
    -- P3 took version 2, which no CVE affects.
    or (pg_temp.consumer(v_answer, 'SB-P3')->>'vulnerabilities_open')::integer <> 0
    or (v_answer->'products'->0->>'vulnerabilities_open')::integer <> 2
    -- The component's own count is the same whichever version names it: version 1's two CVEs, which
    -- P1, P2 and the product still run.
    or (public.component_consumers(v_shared2)->>'vulnerabilities_open')::integer <> 2
    or (public.component_consumers(v_other1)->>'vulnerabilities_open')::integer <> 0 then
    raise exception 'The consumers of a component with CVEs answered %', v_answer;
  end if;
  v_answer := public.system_upstream(v_p1);
  if (pg_temp.taken(v_answer, 'Shared unit')->>'vulnerabilities_open')::integer <> 2
    or (pg_temp.taken(v_answer, 'Other unit')->>'vulnerabilities_open')::integer <> 0
    or (v_answer->>'vulnerabilities_open')::integer <> 2
    or (public.system_upstream(v_p3)->>'vulnerabilities_open')::integer <> 0 then
    raise exception 'What a system takes from above, with CVEs on it, answered %', v_answer;
  end if;
  -- A CVE stays open, and counted, while any consumer still runs an affected version, after the fix
  -- is published. The register lists the set's latest version, version 2, whose SBOM marks the
  -- first CVE fixed; P1, P2 and the product still run version 1, so both of its CVEs count.
  select * into v_register from public.component_rows r where r.id = v_shared2;
  if v_register.vulnerabilities_open <> 2 or v_register.programs <> 3 or v_register.products <> 1 then
    raise exception 'A component whose newest version holds the fix, with consumers on version 1, read %', to_jsonb(v_register);
  end if;
  -- A CVE on both versions counts once: version 2 affected again by the first CVE still reads two.
  update public.sbom_component_vulnerabilities set state = 'affected', revision = revision + 1
    where sbom_component_id = v_sshd_v2 and vulnerability_id = v_cve1;
  select * into v_register from public.component_rows r where r.id = v_shared2;
  if v_register.vulnerabilities_open <> 2 or v_register.offers_open <> 0
    or (public.component_consumers(v_shared2)->>'vulnerabilities_open')::integer <> 2
    or (public.system_upstream(v_p3)->>'vulnerabilities_open')::integer <> 1 then
    raise exception 'A component a CVE affects in two versions read %', to_jsonb(v_register);
  end if;
  update public.sbom_component_vulnerabilities set state = 'fixed', revision = revision + 1
    where sbom_component_id = v_sshd_v2 and vulnerability_id = v_cve1;
  -- Every consumer on version 2, then every consumer back on version 1 with version 2 affected
  -- alone; the block undoes both as it ends.
  begin
    perform pg_temp.build_from(c.id, v_shared2) from public.system_components c
      where c.tenant_id = v_tenant and c.defined_component_id = v_shared1;
    update public.product_elements set defined_component_id = v_shared2, revision = revision + 1 where id = v_e_shr;
    -- Version 1 still carries both CVEs, but nobody runs it: none is open.
    select * into v_register from public.component_rows r where r.id = v_shared2;
    if v_register.vulnerabilities_open <> 0 or v_register.programs <> 3 or v_register.consumers_behind <> 0
      or (public.component_consumers(v_shared1)->>'vulnerabilities_open')::integer <> 0
      or (public.component_consumers(v_shared2)->>'vulnerabilities_open')::integer <> 0
      or (pg_temp.consumer(public.component_consumers(v_shared2), 'SB-P1')->>'vulnerabilities_open')::integer <> 0
      or (public.system_upstream(v_p1)->>'vulnerabilities_open')::integer <> 0 then
      raise exception 'A component every consumer moved off the affected version read %', to_jsonb(v_register);
    end if;
    -- Every consumer back on version 1, P3 too, and the zlib CVE, which version 1 only
    -- investigates, affecting version 2: the newest version counts with nobody on it, beside
    -- version 1's two.
    perform pg_temp.build_from(c.id, v_shared1) from public.system_components c
      where c.tenant_id = v_tenant and c.defined_component_id = v_shared2;
    update public.product_elements set defined_component_id = v_shared1, revision = revision + 1 where id = v_e_shr;
    insert into public.sbom_component_vulnerabilities(tenant_id, sbom_component_id, vulnerability_id, state)
      values (v_tenant, v_sshd_v2, v_cve3, 'affected');
    select * into v_register from public.component_rows r where r.id = v_shared2;
    if v_register.vulnerabilities_open <> 3 or v_register.programs <> 3 or v_register.consumers_behind <> 4
      or (public.component_consumers(v_shared1)->>'vulnerabilities_open')::integer <> 3
      or (public.system_upstream(v_p3)->>'vulnerabilities_open')::integer <> 2 then
      raise exception 'A component whose newest version nobody runs, affected, read %', to_jsonb(v_register);
    end if;
    raise exception using errcode = 'PT999', message = 'Undo the moves';
  exception when sqlstate 'PT999' then
    null;
  end;
  select * into v_register from public.component_rows r where r.id = v_shared2;
  if v_register.vulnerabilities_open <> 2 or (pg_temp.consumer(public.component_consumers(v_shared1), 'SB-P3')->>'version')::integer <> 2 then
    raise exception 'The moves were not undone: %', to_jsonb(v_register);
  end if;

  -- ---------------------------------------------------------------------------------------------
  -- An accepted offer carries the CVE to the consumers' issues: P1 offers its issue on the shared
  -- unit, the owner accepts it, and the issue opened in P2 is P2's row for the same CVE.
  -- ---------------------------------------------------------------------------------------------
  v_offer := public.offer_to_component(v_tenant, v_c1, 'finding', array[v_i1, v_i_plain], 'Two findings on the shared unit', null, gen_random_uuid());
  v_result := public.review_component_offer(v_tenant, (v_offer->>'offerId')::uuid, 1, 'accepted', null, gen_random_uuid());
  -- One issue for each offered issue in P2, the only other program built from version 1.
  if (v_result->>'programs')::integer <> 1 or jsonb_array_length(v_result->'issues') <> 2
    or (select count(*) from public.operational_issues i where i.program_id = v_g2) <> 2
    or exists (select 1 from public.operational_issues i where i.program_id = v_g3) then
    raise exception 'Accepting two findings answered %', v_result;
  end if;
  select i.id into v_i2 from public.operational_issues i
    where i.program_id = v_g2 and i.title = 'CVE-2024-11111 in the shared unit''s sshd';
  if (select count(*) from public.issue_vulnerabilities l where l.issue_id = v_i2 and l.vulnerability_id = v_cve1) <> 1
    or (select count(*) from public.issue_vulnerabilities l where l.issue_id = v_i2) <> 1
    -- The issue that names no CVE carries none, and the offering program's own link is as it was.
    or exists (select 1 from public.issue_vulnerabilities l join public.operational_issues i on i.id = l.issue_id
      where i.title = 'A loose connector')
    or (select count(*) from public.issue_vulnerabilities) <> 2 then
    raise exception 'The issue opened in a consumer does not carry the CVE: %',
      (select jsonb_agg(to_jsonb(l)) from public.issue_vulnerabilities l);
  end if;
  v_answer := public.component_vulnerabilities(v_shared1);
  v_line := pg_temp.cve(v_answer, 'CVE-2024-11111');
  if not (pg_temp.answer_of(v_line, 'SB-P2')->>'answered')::boolean
    or (pg_temp.answer_of(v_line, 'SB-P2')->'issue'->>'issue_id')::uuid <> v_i2
    or (pg_temp.answer_of(v_line, 'SB-P2')->'issue'->>'poam_items')::integer <> 0
    or (v_line->>'programs_answered')::integer <> 2 or (v_line->>'programs_open')::integer <> 2
    or v_answer->'totals' <> jsonb_build_object('vulnerabilities', 2, 'sbom_components', 2, 'programs', 2,
      'unanswered', 2, 'programs_unanswered', 2) then
    raise exception 'A CVE every consumer holds a row for read % with the totals %', v_line, v_answer->'totals';
  end if;
  select * into v_row from public.vulnerability_rows r where r.id = v_cve1;
  if v_row.programs_open <> 2 or v_row.issues_open <> 2 then
    raise exception 'A CVE two programs hold an issue for read %', to_jsonb(v_row);
  end if;
  -- P2 resolves its row: it has answered, and its issue is no longer open.
  update public.operational_issues set status = 'resolved', revision = revision + 1 where id = v_i2;
  v_line := pg_temp.cve(public.component_vulnerabilities(v_shared1), 'CVE-2024-11111');
  select * into v_row from public.vulnerability_rows r where r.id = v_cve1;
  if not (pg_temp.answer_of(v_line, 'SB-P2')->>'answered')::boolean
    or (pg_temp.answer_of(v_line, 'SB-P2')->'issue'->>'open')::boolean
    or pg_temp.answer_of(v_line, 'SB-P2')->'issue'->>'status' <> 'resolved'
    or (v_line->>'programs_answered')::integer <> 2 or (v_line->>'programs_open')::integer <> 1
    or v_row.programs_open <> 1 or v_row.issues_open <> 1 then
    raise exception 'A CVE a consumer resolved read % and %', v_line, to_jsonb(v_row);
  end if;

  -- ---------------------------------------------------------------------------------------------
  -- A newer SBOM stands in the older one's place, in every read: the shared unit's October image
  -- carries neither component, so no CVE affects version 1 any more; the asset's SBOM is its own.
  -- ---------------------------------------------------------------------------------------------
  v_result := public.import_sbom(v_tenant, v_shared1, null, 'Shared unit image SBOM, October', 'cyclonedx', '1.5', null, '2026-10-01', null,
    jsonb_build_array(jsonb_build_object('name', 'unit-image', 'version', '1.1', 'kind', 'operating-system'),
      jsonb_build_object('name', 'zlib')), gen_random_uuid());
  v_s3 := (v_result->>'sbomId')::uuid;
  v_answer := public.component_vulnerabilities(v_shared1);
  select * into v_row from public.vulnerability_rows r where r.id = v_cve1;
  if not (v_result->>'standing')::boolean or (v_answer->'sbom'->>'id')::uuid <> v_s3
    or v_answer->'vulnerabilities' <> '[]'::jsonb or (v_answer->'totals'->>'unanswered')::integer <> 0
    or (public.component_consumers(v_shared1)->>'vulnerabilities_open')::integer <> 0
    or (public.system_upstream(v_p1)->>'vulnerabilities_open')::integer <> 0
    or (select count(*) from public.sbom_component_rows r where r.defined_component_id = v_shared1) <> 2
    or exists (select 1 from public.sbom_component_rows r where r.sbom_id = v_s1)
    or v_row.sbom_components_affected <> 1 or v_row.components_affected <> 0 or v_row.assets_affected <> 1 then
    raise exception 'A newer SBOM does not stand in the older one''s place: % and %', v_answer, to_jsonb(v_row);
  end if;
  -- Removing the newer one lets the September SBOM stand again, with its components and its CVEs.
  delete from public.sboms where id = v_s3;
  if (public.component_consumers(v_shared1)->>'vulnerabilities_open')::integer <> 2
    or exists (select 1 from public.sbom_components c where c.sbom_id = v_s3) then
    raise exception 'Removing the newest SBOM did not let the one before it stand';
  end if;

  -- ---------------------------------------------------------------------------------------------
  -- Who reads: a viewer as a member, writing nothing; another workspace nothing.
  -- ---------------------------------------------------------------------------------------------
  perform set_config('request.jwt.claim.sub', v_viewer::text, true);
  if (select count(*) from public.vulnerability_rows) <> 3 or (select count(*) from public.sbom_component_rows) <> 7
    or (select count(*) from public.sboms) <> 4 or (select count(*) from public.sbom_components) <> 8
    or (select count(*) from public.sbom_component_vulnerabilities) <> 7
    or (select count(*) from public.vulnerability_controls) <> 2 or (select count(*) from public.issue_vulnerabilities) <> 2
    or jsonb_array_length(public.component_vulnerabilities(v_shared1)->'vulnerabilities') <> 2 then
    raise exception 'A viewer does not read the SBOMs and CVEs a member reads';
  end if;
  perform pg_temp.expect_error(format($q$insert into public.vulnerabilities(tenant_id, cve_id, title) values (%L, 'CVE-2024-66666', 'A viewer''s')$q$, v_tenant), '42501');
  perform pg_temp.expect_error(format($q$insert into public.issue_vulnerabilities(tenant_id, issue_id, vulnerability_id) values (%L, %L, %L)$q$, v_tenant, v_i1, v_cve2), '42501');
  perform pg_temp.expect_error(format($q$insert into public.sbom_component_vulnerabilities(tenant_id, sbom_component_id, vulnerability_id) values (%L, %L, %L)$q$, v_tenant, v_image, v_cve3), '42501');
  update public.vulnerabilities set title = 'Rewritten by a viewer' where id = v_cve1;
  delete from public.sboms where id = v_s0;
  if exists (select 1 from public.vulnerabilities v where v.title = 'Rewritten by a viewer')
    or not exists (select 1 from public.sboms s where s.id = v_s0) then
    raise exception 'A viewer changed a CVE or removed an SBOM';
  end if;
  perform set_config('request.jwt.claim.sub', v_outsider::text, true);
  if (select count(*) from public.vulnerability_rows) <> 1 or exists (select 1 from public.sbom_component_rows)
    or exists (select 1 from public.sboms) or exists (select 1 from public.sbom_components)
    or exists (select 1 from public.sbom_component_vulnerabilities) or exists (select 1 from public.vulnerability_controls)
    or exists (select 1 from public.issue_vulnerabilities) or exists (select 1 from public.standing_sboms())
    or exists (select 1 from public.component_open_vulnerabilities(null))
    or (select r.id from public.vulnerability_rows r) <> v_elsewhere_cve then
    raise exception 'Another workspace reads an SBOM or a CVE';
  end if;
  perform pg_temp.expect_error(format($q$select public.component_vulnerabilities(%L)$q$, v_shared1), '42501', 'Component access is required');
  perform pg_temp.expect_error(format($q$insert into public.vulnerabilities(tenant_id, cve_id, title) values (%L, 'CVE-2024-77777', 'An outsider''s')$q$, v_tenant), '42501');
  perform pg_temp.expect_error(format($q$insert into public.sbom_component_vulnerabilities(tenant_id, sbom_component_id, vulnerability_id) values (%L, %L, %L)$q$, v_other_tenant, v_image, v_elsewhere_cve), '23503');
  perform set_config('request.jwt.claim.sub', v_owner_user::text, true);
  perform set_config('test.sbom', v_s1::text, true);
end $$;

-- Past the grants, as the tables' owner: an import left one receipt, the guard still refuses a
-- component inside itself, and removing an SBOM takes its components, their CVEs and its receipt.
reset role;
do $$
declare v_sbom uuid := nullif(current_setting('test.sbom', true), '')::uuid; v_components integer;
begin
  if v_sbom is null then return; end if;
  if (select count(*) from public.sbom_import_requests r where r.sbom_id = v_sbom) <> 1 then
    raise exception 'An import and the same request sent again left % receipts',
      (select count(*) from public.sbom_import_requests r where r.sbom_id = v_sbom);
  end if;
  perform pg_temp.expect_error(format(
    $q$update public.sbom_components c set parent_component_id = (select z.id from public.sbom_components z where z.sbom_id = c.sbom_id and z.name = 'zlib') where c.sbom_id = %L and c.name = 'libssl'$q$,
    v_sbom), '23514', 'cannot sit inside itself');
  delete from public.sboms where id = v_sbom;
  if exists (select 1 from public.sbom_components c where c.sbom_id = v_sbom)
    or exists (select 1 from public.sbom_import_requests r where r.sbom_id = v_sbom)
    -- Counted in the test's own workspaces: as the tables' owner the session reads every workspace.
    or (select count(*) from public.sbom_component_vulnerabilities x
      where x.tenant_id in (current_setting('test.tenant')::uuid, current_setting('test.other_tenant')::uuid)) <> 3 then
    raise exception 'Removing an SBOM left its components, their CVEs or its receipt';
  end if;
end $$;

-- An anonymous session reads none of it.
set local role anon;
select pg_temp.expect_error('select count(*) from public.vulnerability_rows', '42501');
select pg_temp.expect_error('select count(*) from public.sbom_component_rows', '42501');
select pg_temp.expect_error('select count(*) from public.sboms', '42501');
select pg_temp.expect_error('select count(*) from public.vulnerabilities', '42501');
select pg_temp.expect_error('select count(*) from public.issue_vulnerabilities', '42501');
select pg_temp.expect_error($$select public.component_vulnerabilities(gen_random_uuid())$$, '42501');
select pg_temp.expect_error($$select public.import_sbom(gen_random_uuid(), gen_random_uuid(), null, 'An SBOM', 'spdx', null, null, current_date, null, '[{"name":"one"}]', gen_random_uuid())$$, '42501');
rollback;
