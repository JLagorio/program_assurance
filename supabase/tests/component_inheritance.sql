-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Component inheritance: who may reach the internal reads and write the integration set, and the
-- placement read held to plans made for the program asked about; and, with
-- the pinned references installed (a catalog and a reference baseline), a component set assessed
-- once and read from below. A draft component assessment decides nothing. A product element takes
-- its component's determination, the product's own stands over it, and a control marked for
-- integration reads not assessed until the product judges it; a variant and the product branch of
-- its program's control status follow each step. In a program, an objective its requirements place
-- on one inherited element is judged by inheritance, one placed on two elements of which one is
-- not inherited is left to the assessor, and two inherited elements give the worse determination;
-- the control is decided once every objective is judged or inherited; plan_control_holdings and a
-- new plan leave an inherited objective out; the program's own determination stands over an
-- inherited one; an element that holds a second component that is not from the library, and one
-- the program declared modified, inherit nothing. Where used and Upstream count what each
-- consumer inherits. Last, a viewer and the tenant boundary.
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
declare v_function text;
begin
  -- The internal reads are a signed-in session's, as their caller: row-level security decides
  -- every row, and none asks who calls, since the posture snapshots count through them.
  foreach v_function in array array[
    'public.product_element_standing(uuid, uuid)', 'public.program_element_inheritance(uuid, uuid[])',
    'public.program_objective_inheritance(uuid, uuid[])', 'public.program_objective_placement_answer(uuid, uuid[])',
    'public.program_objective_placement(uuid)', 'public.program_control_objective_judgments(uuid, uuid[])',
    'public.program_control_standing_lines(uuid)', 'public.program_control_status_lines(uuid)',
    'public.product_control_status(uuid, uuid)', 'public.variant_control_delta_answer(uuid, uuid)',
    'public.program_control_status(uuid)', 'public.component_consumers(uuid)', 'public.system_upstream(uuid)'] loop
    if has_function_privilege('anon', v_function, 'execute') or has_function_privilege('public', v_function, 'execute') then
      raise exception 'An anonymous session may execute %', v_function;
    end if;
    if not has_function_privilege('authenticated', v_function, 'execute') then
      raise exception 'A signed-in session may not execute %', v_function;
    end if;
    if (select p.prosecdef from pg_catalog.pg_proc p where p.oid = v_function::regprocedure) then
      raise exception '% does not run as its caller', v_function;
    end if;
  end loop;
  -- The placement read is planned for the program it is asked about on every call, never by a
  -- generic plan estimated for an average program (20261117185710_placement_planned_for_its_program).
  if not exists (select 1 from pg_catalog.pg_proc p
      where p.oid = 'public.program_objective_placement_answer(uuid, uuid[])'::regprocedure
        and p.proconfig @> array['plan_cache_mode=force_custom_plan']) then
    raise exception 'The placement read may run a generic plan';
  end if;
  if has_table_privilege('anon', 'public.product_integration_controls', 'select')
    or not has_table_privilege('authenticated', 'public.product_integration_controls', 'select')
    or not (select c.relrowsecurity from pg_catalog.pg_class c where c.oid = 'public.product_integration_controls'::regclass) then
    raise exception 'The integration set is not a signed-in member''s, row by row';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- A workspace: its owner and a viewer; and a member of another workspace.
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email, raw_user_meta_data) values
  ('c1470000-0000-0000-0000-000000000001', 'component-inheritance-owner@example.test', '{"name":"Component inheritance test owner"}'),
  ('c1470000-0000-0000-0000-000000000002', 'component-inheritance-outsider@example.test', '{}'),
  ('c1470000-0000-0000-0000-000000000003', 'component-inheritance-viewer@example.test', '{}');
select set_config('request.jwt.claim.sub', 'c1470000-0000-0000-0000-000000000002', true);
set local role authenticated;
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
select set_config('request.jwt.claim.sub', 'c1470000-0000-0000-0000-000000000001', true);
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'c1470000-0000-0000-0000-000000000003', 'viewer');
select set_config('test.ready', '', true);

-- One control's line of a status answer, a product's, a variant's or a program's.
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
    'requestId', gen_random_uuid(), 'code', p_code, 'name', p_code || ' component inheritance test', 'description', '',
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
-- The selection of a control in the control baseline a system reads, which a mapping on it names.
create function pg_temp.selection(system uuid, control uuid) returns uuid language sql stable as $$
  select sc.id from public.selected_controls sc
  join public.system_effective_baselines b on b.profile_resolution_id = sc.profile_resolution_id
  where b.system_id = system and sc.control_id = control limit 1;
$$;
-- The rows of the two inheritance reads as lists a check compares whole.
create function pg_temp.elements(program uuid, controls uuid[]) returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_array(e.code, i.control_id, i.determination, i.component_assessment_id)
    order by e.code, i.control_id, i.component_assessment_id), '[]'::jsonb)
  from public.program_element_inheritance(program, controls) i
  join public.systems e on e.id = i.element_id;
$$;
create function pg_temp.objectives(program uuid, controls uuid[]) returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_array(i.control_id, i.objective_id, i.determination, i.component_assessments)
    order by i.control_id, i.objective_id), '[]'::jsonb)
  from public.program_objective_inheritance(program, controls) i;
$$;
grant execute on function pg_temp.line(jsonb, uuid), pg_temp.system(text, uuid, uuid, jsonb, jsonb),
  pg_temp.selection(uuid, uuid), pg_temp.elements(uuid, uuid[]), pg_temp.objectives(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- With the pinned references installed.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_base uuid; v_controls uuid[];
  -- Five controls that each count two objectives, neither above the other: s for the program's
  -- objectives, p for what is inherited, q for the product's own standing, i and n for integration.
  v_s uuid; v_p uuid; v_q uuid; v_i uuid; v_n uuid;
  v_o1 uuid; v_o2 uuid; v_p_objectives uuid[];
  v_definition uuid := gen_random_uuid(); v_rev uuid := gen_random_uuid();
  v_unit_a uuid := gen_random_uuid(); v_unit_b uuid := gen_random_uuid();
  v_ca uuid := gen_random_uuid(); v_ca_draft uuid := gen_random_uuid();
  v_ca_title text := 'Inheritance test component assessment';
  v_ca_entry jsonb;
  v_product uuid := gen_random_uuid(); v_prev uuid := gen_random_uuid();
  v_e_one uuid := gen_random_uuid(); v_e_plain uuid := gen_random_uuid(); v_config uuid := gen_random_uuid();
  v_pa1 uuid := gen_random_uuid(); v_pa2 uuid := gen_random_uuid(); v_mark uuid := gen_random_uuid();
  v_pin_a jsonb; v_pin_b jsonb;
  v_variant uuid; v_variant_program uuid; v_variant_one public.systems;
  v_own uuid; v_own_program uuid; v_e1 uuid; v_e2 uuid; v_e3 uuid;
  v_component_a uuid; v_component_b uuid; v_variant_component uuid;
  v_ssp uuid; v_plan uuid; v_set uuid;
  v_results1 uuid := gen_random_uuid(); v_results2 uuid := gen_random_uuid();
  v_answer jsonb; v_line jsonb; v_row jsonb; v_count integer; v_ladder text;
begin
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) >= 5
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the checks of component inheritance were skipped';
    return;
  end if;
  select array_agg(x.control_id order by x.code_order, x.control_id) into v_controls
  from (
    select a.control_id, k.code_order
    from public.control_assessment_parts(array(
      select sc.control_id from public.selected_controls sc where sc.profile_resolution_id = v_base)) a
    join public.catalog_control_rows k on k.id = a.control_id
    group by a.control_id, k.code_order
    having count(*) filter (where a.objective) = 2
      and not bool_or(a.above && array(select b.part_id from public.control_assessment_parts(array[a.control_id]) b where b.objective))
    order by k.code_order, a.control_id limit 5
  ) x;
  if coalesce(cardinality(v_controls), 0) < 5 then
    raise notice 'The baseline has no five controls that count two objectives side by side: the checks of component inheritance were skipped';
    return;
  end if;
  v_s := v_controls[1]; v_p := v_controls[2]; v_q := v_controls[3]; v_i := v_controls[4]; v_n := v_controls[5];
  select (array_agg(a.part_id order by a.place))[1], (array_agg(a.part_id order by a.place))[2] into v_o1, v_o2
  from public.control_assessment_parts(array[v_s]) a where a.objective;
  select array_agg(a.part_id order by a.part_id) into v_p_objectives
  from public.control_assessment_parts(array[v_p]) a where a.objective;

  -- A component set with two units, published. Neither claims a control: what stands on them is
  -- what an assessment determined.
  insert into public.component_definitions(id, tenant_id, code, name) values (v_definition, v_tenant, 'ci-units', 'Component inheritance units');
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values (v_rev, v_tenant, v_definition, 1);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values
    (v_unit_a, v_tenant, v_rev, 'Unit A', 'software'), (v_unit_b, v_tenant, v_rev, 'Unit B', 'hardware');
  update public.component_definition_revisions set state = 'published', revision = revision + 1 where id = v_rev;
  v_pin_a := jsonb_build_object('revisionId', v_rev, 'definedComponentId', v_unit_a, 'rationale', 'Taken from the library.');
  v_pin_b := jsonb_build_object('revisionId', v_rev, 'definedComponentId', v_unit_b, 'rationale', 'Taken from the library.');

  -- A product whose one configuration holds an element pinned to unit A and a plain one.
  insert into public.products(id, tenant_id, code, name) values (v_product, v_tenant, 'CI-P', 'Component inheritance test product');
  insert into public.product_revisions(id, tenant_id, product_id, version_number) values (v_prev, v_tenant, v_product, 1);
  insert into public.product_elements(id, tenant_id, product_revision_id, code, name, element_type, defined_component_id, position) values
    (v_e_one, v_tenant, v_prev, 'ONE', 'Pinned element', 'software', v_unit_a, 0),
    (v_e_plain, v_tenant, v_prev, 'PLAIN', 'Plain element', 'other', null, 1);
  insert into public.product_configurations(id, tenant_id, product_id, code, name) values (v_config, v_tenant, v_product, 'A', 'Configuration A');
  insert into public.product_configuration_elements(tenant_id, product_revision_id, product_configuration_id, product_element_id) values
    (v_tenant, v_prev, v_config, v_e_one), (v_tenant, v_prev, v_config, v_e_plain);
  update public.product_revisions set state = 'published', revision = revision + 1 where id = v_prev;

  -- A program that takes the configuration as the product delivers it, and one of its own whose
  -- system holds an element built from each unit and one from neither.
  v_variant := pg_temp.system('CI-V', v_catalog, v_base, jsonb_build_object('revisionId', v_prev, 'configurationId', v_config),
    jsonb_build_array(jsonb_build_array('ONE', v_e_one, v_pin_a), jsonb_build_array('PLAIN', v_e_plain, null)));
  v_own := pg_temp.system('CI-OWN', v_catalog, v_base, null, jsonb_build_array(
    jsonb_build_array('E1', null, v_pin_a), jsonb_build_array('E2', null, v_pin_b), jsonb_build_array('E3', null, null)));
  select s.program_id into v_variant_program from public.systems s where s.id = v_variant;
  select s.program_id into v_own_program from public.systems s where s.id = v_own;
  select * into v_variant_one from public.systems where tenant_id = v_tenant and code = 'CI-V-ONE';
  select s.id into v_e1 from public.systems s where s.tenant_id = v_tenant and s.code = 'CI-OWN-E1';
  select s.id into v_e2 from public.systems s where s.tenant_id = v_tenant and s.code = 'CI-OWN-E2';
  select s.id into v_e3 from public.systems s where s.tenant_id = v_tenant and s.code = 'CI-OWN-E3';
  select k.id into v_component_a from public.system_component_element_links k
    join public.system_components c on c.id = k.id where k.system_element_id = v_e1 and c.defined_component_id = v_unit_a;
  select k.id into v_component_b from public.system_component_element_links k
    join public.system_components c on c.id = k.id where k.system_element_id = v_e2 and c.defined_component_id = v_unit_b;
  select k.id into v_variant_component from public.system_component_element_links k
    join public.system_components c on c.id = k.id where k.system_element_id = v_variant_one.id and c.defined_component_id = v_unit_a;
  if v_component_a is null or v_component_b is null or v_variant_component is null
    or (select count(*) from public.system_component_element_links k where k.system_element_id in (v_e1, v_e2, v_variant_one.id)) <> 3
    or exists (select 1 from public.system_component_element_links k where k.system_element_id = v_e3) then
    raise exception 'The elements do not each hold the one system component built from their unit';
  end if;

  -- The program's requirements place the objectives of s and p. One objective of s on the element
  -- built from unit A alone; the other on that element and on the one built from neither unit; and
  -- p whole on both elements built from a unit. The variant's program places the first objective of
  -- s on its element built from unit A.
  insert into public.engineering_requirements(id, tenant_id, program_id, code) values
    ('c1472000-0000-0000-0000-000000000001', v_tenant, v_own_program, 'REQ-ONE-ELEMENT'),
    ('c1472000-0000-0000-0000-000000000002', v_tenant, v_own_program, 'REQ-TWO-ELEMENTS'),
    ('c1472000-0000-0000-0000-000000000003', v_tenant, v_own_program, 'REQ-BOTH-UNITS'),
    ('c1472000-0000-0000-0000-000000000004', v_tenant, v_variant_program, 'REQ-VARIANT');
  insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type) values
    ('c1473000-0000-0000-0000-000000000001', v_tenant, 'c1472000-0000-0000-0000-000000000001', 1, 'Unit A does it', 'Unit A does it.', 'It is recorded.', 'functional'),
    ('c1473000-0000-0000-0000-000000000002', v_tenant, 'c1472000-0000-0000-0000-000000000002', 1, 'Two elements do it', 'Two elements do it.', 'It is recorded.', 'functional'),
    ('c1473000-0000-0000-0000-000000000003', v_tenant, 'c1472000-0000-0000-0000-000000000003', 1, 'Both units do it', 'Both units do it.', 'It is recorded.', 'functional'),
    ('c1473000-0000-0000-0000-000000000004', v_tenant, 'c1472000-0000-0000-0000-000000000004', 1, 'The variant''s unit does it', 'The variant''s unit does it.', 'It is recorded.', 'functional');
  insert into public.requirement_allocations(tenant_id, requirement_revision_id, system_id) values
    (v_tenant, 'c1473000-0000-0000-0000-000000000001', v_e1),
    (v_tenant, 'c1473000-0000-0000-0000-000000000002', v_e1), (v_tenant, 'c1473000-0000-0000-0000-000000000002', v_e3),
    (v_tenant, 'c1473000-0000-0000-0000-000000000003', v_e1), (v_tenant, 'c1473000-0000-0000-0000-000000000003', v_e2),
    (v_tenant, 'c1473000-0000-0000-0000-000000000004', v_variant_one.id);
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, control_part_id, system_id, selected_control_id, relationship_type) values
    (v_tenant, 'c1473000-0000-0000-0000-000000000001', v_s, v_o1, v_e1, pg_temp.selection(v_e1, v_s), 'maps_to'),
    (v_tenant, 'c1473000-0000-0000-0000-000000000002', v_s, v_o2, v_e1, pg_temp.selection(v_e1, v_s), 'maps_to'),
    (v_tenant, 'c1473000-0000-0000-0000-000000000002', v_s, v_o2, v_e3, pg_temp.selection(v_e3, v_s), 'maps_to'),
    (v_tenant, 'c1473000-0000-0000-0000-000000000003', v_p, null, v_e1, pg_temp.selection(v_e1, v_p), 'maps_to'),
    (v_tenant, 'c1473000-0000-0000-0000-000000000003', v_p, null, v_e2, pg_temp.selection(v_e2, v_p), 'maps_to'),
    (v_tenant, 'c1473000-0000-0000-0000-000000000004', v_s, v_o1, v_variant_one.id, pg_temp.selection(v_variant_one.id, v_s), 'maps_to');
  -- Mapped and with no evidence, both controls stand on the ladder where nothing is judged.
  v_ladder := 'no_evidence';

  -- One component assessment judges unit A on s, p, q and i and unit B on s and p. While it is a
  -- draft it decides nothing, anywhere: no element inherits, no objective is judged, no status says
  -- a word of it, and a version of the product nobody assessed reads no control.
  insert into public.component_assessments(id, tenant_id, component_definition_revision_id, profile_resolution_id, title)
    values (v_ca, v_tenant, v_rev, v_base, v_ca_title);
  insert into public.component_determinations(tenant_id, component_assessment_id, component_definition_revision_id, defined_component_id, control_id, determination) values
    (v_tenant, v_ca, v_rev, v_unit_a, v_s, 'satisfied'), (v_tenant, v_ca, v_rev, v_unit_a, v_p, 'satisfied'),
    (v_tenant, v_ca, v_rev, v_unit_a, v_q, 'partially_satisfied'), (v_tenant, v_ca, v_rev, v_unit_a, v_i, 'satisfied'),
    (v_tenant, v_ca, v_rev, v_unit_b, v_s, 'other_than_satisfied'), (v_tenant, v_ca, v_rev, v_unit_b, v_p, 'partially_satisfied');
  v_answer := public.program_control_status(v_own_program);
  if pg_temp.elements(v_own_program, null) <> '[]'::jsonb or pg_temp.objectives(v_own_program, null) <> '[]'::jsonb
    or exists (select 1 from public.product_element_standing(v_tenant, v_prev))
    or exists (select 1 from jsonb_array_elements(v_answer->'controls') c where c ? 'objectives_inherited' or c ? 'component_assessments')
    or pg_temp.line(v_answer, v_s)->>'status' <> v_ladder or pg_temp.line(v_answer, v_s)->'objectives_assessed' <> '0'::jsonb
    or pg_temp.line(v_answer, v_p)->>'status' <> v_ladder
    or public.product_control_status(v_tenant, v_prev)->'controls' <> '[]'::jsonb
    or public.product_control_status(v_tenant, v_prev) ? 'component_assessments'
    or public.variant_control_delta(v_tenant, v_variant) ? 'component_assessments'
    or exists (select 1 from jsonb_array_elements(public.system_upstream(v_own)->'components') c
      where c->'controls_judged' <> '0'::jsonb or c->'controls_inherited' <> '0'::jsonb) then
    raise exception 'A draft component assessment decided something: elements %, program %',
      pg_temp.elements(v_own_program, null), pg_temp.line(v_answer, v_s);
  end if;
  update public.component_assessments set state = 'published', published_at = now() - interval '3 hours', revision = revision + 1 where id = v_ca;
  -- A later draft that judges unit A otherwise changes nothing either.
  insert into public.component_assessments(id, tenant_id, component_definition_revision_id, profile_resolution_id, title)
    values (v_ca_draft, v_tenant, v_rev, v_base, 'A later draft');
  insert into public.component_determinations(tenant_id, component_assessment_id, component_definition_revision_id, defined_component_id, control_id, determination)
    values (v_tenant, v_ca_draft, v_rev, v_unit_a, v_s, 'other_than_satisfied'), (v_tenant, v_ca_draft, v_rev, v_unit_a, v_n, 'satisfied');
  v_ca_entry := jsonb_build_object('id', v_ca, 'title', v_ca_title);

  -- -------------------------------------------------------------------------------------------
  -- A product element takes its component's determination.
  -- -------------------------------------------------------------------------------------------
  -- Nobody assessed the product: what stands on its pinned element is unit A's, each marked with
  -- the component assessment it came from, and the version is read over those four controls.
  if (select jsonb_agg(jsonb_build_array(s.product_element_id, s.control_id, s.determination, s.inherited, s.component_assessment_id)
      order by s.control_id) from public.product_element_standing(v_tenant, v_prev) s)
    <> (select jsonb_agg(jsonb_build_array(v_e_one, x.control_id, x.determination, true, v_ca) order by x.control_id)
      from (values (v_s, 'satisfied'), (v_p, 'satisfied'), (v_q, 'partially_satisfied'), (v_i, 'satisfied')) x(control_id, determination)) then
    raise exception 'A pinned element nobody judged does not stand as its component does';
  end if;
  v_answer := public.product_control_status(v_tenant, v_prev);
  v_line := pg_temp.line(v_answer, v_p);
  if v_answer->'assessment' <> 'null'::jsonb or jsonb_array_length(v_answer->'controls') <> 4
    or v_line->>'core' <> 'satisfied' or v_line->'configurations' <> jsonb_build_object(v_config, 'satisfied')
    or v_line->'inherited' <> jsonb_build_object('core', jsonb_build_array(v_ca), v_config, jsonb_build_array(v_ca))
    or pg_temp.line(v_answer, v_q)->>'core' <> 'partially_satisfied'
    or pg_temp.line(v_answer, v_n) is not null
    or jsonb_array_length(v_answer->'component_assessments') <> 1
    or not v_answer->'component_assessments'->0 @> v_ca_entry
    or (v_answer->'component_assessments'->0->>'published_at') is null
    or v_answer->'totals'->'scopes'->'core' <> '{"satisfied": 3, "partially_satisfied": 1, "other_than_satisfied": 0, "not_assessed": 0, "not_covered": 0}'::jsonb then
    raise exception 'A product nobody assessed, pinned to an assessed component, answered %', v_answer;
  end if;
  -- The variant follows: it inherits p as the product gives it, and says whose determination it is.
  v_answer := public.variant_control_delta(v_tenant, v_variant);
  v_line := pg_temp.line(v_answer, v_p);
  if v_answer->'assessment' <> 'null'::jsonb or v_line->>'delta' <> 'inherited' or v_line->>'product_status' <> 'satisfied'
    or v_line->'component_assessments' <> jsonb_build_array(jsonb_build_object('id', v_ca, 'determination', 'satisfied'))
    or v_line->'product_determined' <> 'false'::jsonb
    or pg_temp.line(v_answer, v_q)->>'product_status' <> 'partially_satisfied'
    or pg_temp.line(v_answer, v_n)->>'delta' <> 'program_only' or pg_temp.line(v_answer, v_n) ? 'component_assessments'
    or not v_answer->'component_assessments'->0 @> v_ca_entry then
    raise exception 'A variant of a product nobody assessed answered % of %', v_line, v_answer - 'controls';
  end if;
  -- And so does the product branch of its program's control status: the product decides p, no
  -- product assessment judged it, and the component assessment is named. Its own requirement
  -- places one objective of s on the inherited element, which is judged by inheritance while the
  -- product decides the control.
  v_answer := public.program_control_status(v_variant_program);
  v_line := pg_temp.line(v_answer, v_p);
  if v_line->>'status' <> 'satisfied' or v_line->>'determined_by' <> 'product' or v_line->'product_assessments' <> '[]'::jsonb
    or v_line->'objectives_inherited' <> '0'::jsonb or v_line->'objectives_assessed' <> '0'::jsonb
    or v_line->'component_assessments' <> jsonb_build_array(v_ca_entry || '{"determination": "satisfied"}'::jsonb) then
    raise exception 'A control the product inherits from its component read % in the variant''s program', v_line;
  end if;
  v_line := pg_temp.line(v_answer, v_s);
  if v_line->>'status' <> 'satisfied' or v_line->>'determined_by' <> 'product'
    or v_line->'objectives_inherited' <> '1'::jsonb or v_line->'objectives_assessed' <> '1'::jsonb
    or v_line->'component_assessments' <> jsonb_build_array(v_ca_entry || '{"determination": "satisfied"}'::jsonb) then
    raise exception 'A control with one inherited objective that the product decides read %', v_line;
  end if;
  if pg_temp.line(v_answer, v_n) ? 'component_assessments' or pg_temp.line(v_answer, v_n) ? 'objectives_inherited' then
    raise exception 'A control nothing is inherited for says something of inheritance: %', pg_temp.line(v_answer, v_n);
  end if;

  -- -------------------------------------------------------------------------------------------
  -- The product's own standing over its component's.
  -- -------------------------------------------------------------------------------------------
  -- The product's assessment judges q on the pinned element: its own determination stands there,
  -- and the cell is no longer an inherited one. What it did not judge is still its component's.
  insert into public.product_assessments(id, tenant_id, product_revision_id, profile_resolution_id, title)
    values (v_pa1, v_tenant, v_prev, v_base, 'First product assessment');
  insert into public.product_determinations(tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination)
    values (v_tenant, v_pa1, v_prev, v_e_one, v_q, 'satisfied');
  update public.product_assessments set state = 'published', published_at = now() - interval '2 hours', revision = revision + 1 where id = v_pa1;
  if (select jsonb_agg(jsonb_build_array(s.determination, s.inherited, s.component_assessment_id))
      from public.product_element_standing(v_tenant, v_prev) s where s.control_id = v_q)
    <> jsonb_build_array(jsonb_build_array('satisfied', false, null)) then
    raise exception 'The product''s own determination does not stand alone over its component''s';
  end if;
  v_answer := public.product_control_status(v_tenant, v_prev);
  if (v_answer->'assessment'->>'id')::uuid <> v_pa1
    or pg_temp.line(v_answer, v_q)->>'core' <> 'satisfied' or pg_temp.line(v_answer, v_q) ? 'inherited'
    or pg_temp.line(v_answer, v_p)->>'core' <> 'satisfied'
    or pg_temp.line(v_answer, v_p)->'inherited' <> jsonb_build_object('core', jsonb_build_array(v_ca), v_config, jsonb_build_array(v_ca))
    or pg_temp.line(v_answer, v_i)->>'core' <> 'satisfied' or not pg_temp.line(v_answer, v_i) ? 'inherited'
    or pg_temp.line(v_answer, v_n)->>'core' <> 'not_covered' then
    raise exception 'A product that judged one control itself answered q %, p %, n %',
      pg_temp.line(v_answer, v_q), pg_temp.line(v_answer, v_p), pg_temp.line(v_answer, v_n);
  end if;
  v_line := pg_temp.line(public.variant_control_delta(v_tenant, v_variant), v_q);
  if v_line->>'product_status' <> 'satisfied' or v_line ? 'component_assessments' or v_line ? 'product_determined' then
    raise exception 'A control the product judged itself read % in the variant', v_line;
  end if;
  v_answer := public.program_control_status(v_variant_program);
  v_line := pg_temp.line(v_answer, v_q);
  if v_line->>'status' <> 'satisfied' or v_line->>'determined_by' <> 'product'
    or v_line->'product_assessments' <> jsonb_build_array(jsonb_build_object('id', v_pa1, 'title', 'First product assessment', 'determination', 'satisfied'))
    or v_line ? 'component_assessments' or v_line ? 'objectives_inherited' then
    raise exception 'A control the product judged itself read % in the variant''s program', v_line;
  end if;
  -- The product assessment did not judge p, so it is not named behind it.
  v_line := pg_temp.line(v_answer, v_p);
  if v_line->>'determined_by' <> 'product' or v_line->'product_assessments' <> '[]'::jsonb
    or v_line->'component_assessments' <> jsonb_build_array(v_ca_entry || '{"determination": "satisfied"}'::jsonb) then
    raise exception 'A control only the component judged names a product assessment: %', v_line;
  end if;

  -- -------------------------------------------------------------------------------------------
  -- A control marked for integration reads not assessed until the product judges it.
  -- -------------------------------------------------------------------------------------------
  -- The set names a control once, with why; the control is the catalog's, the version the
  -- workspace's, and neither changes on a row.
  perform pg_temp.expect_error(format(
    $q$insert into public.product_integration_controls(tenant_id, product_revision_id, control_id, rationale) values (%L, %L, %L, '  ')$q$,
    v_tenant, v_prev, v_i), '23514');
  perform pg_temp.expect_error(format(
    $q$insert into public.product_integration_controls(tenant_id, product_revision_id, control_id, rationale) values (%L, %L, %L, 'No such control.')$q$,
    v_tenant, v_prev, gen_random_uuid()), '23503');
  perform pg_temp.expect_error(format(
    $q$insert into public.product_integration_controls(tenant_id, product_revision_id, control_id, rationale) values (%L, %L, %L, 'No such version.')$q$,
    v_tenant, gen_random_uuid(), v_i), '23503');
  insert into public.product_integration_controls(id, tenant_id, product_revision_id, control_id, rationale) values
    (v_mark, v_tenant, v_prev, v_i, 'Shown only once the units are wired together.'),
    (gen_random_uuid(), v_tenant, v_prev, v_n, 'No unit can show it alone.');
  perform pg_temp.expect_error(format(
    $q$insert into public.product_integration_controls(tenant_id, product_revision_id, control_id, rationale) values (%L, %L, %L, 'Marked twice.')$q$,
    v_tenant, v_prev, v_i), '23505');
  perform pg_temp.expect_error(format(
    $q$update public.product_integration_controls set control_id = %L, revision = revision + 1 where id = %L$q$, v_q, v_mark), '23514');
  -- The component's determination on i no longer stands on the element, and a control nothing
  -- claims is owed, not uncovered.
  v_answer := public.product_control_status(v_tenant, v_prev);
  if exists (select 1 from public.product_element_standing(v_tenant, v_prev) s where s.control_id = v_i)
    or pg_temp.line(v_answer, v_i)->>'core' <> 'not_assessed' or pg_temp.line(v_answer, v_i) ? 'inherited'
    or pg_temp.line(v_answer, v_i)->'configurations' <> jsonb_build_object(v_config, 'not_assessed')
    or pg_temp.line(v_answer, v_n)->>'core' <> 'not_assessed'
    or pg_temp.line(v_answer, v_p)->>'core' <> 'satisfied' then
    raise exception 'Controls marked for integration read i %, n %', pg_temp.line(v_answer, v_i), pg_temp.line(v_answer, v_n);
  end if;
  -- The variant and its program follow: the product gives nothing for i yet, and no one decides it.
  v_line := pg_temp.line(public.variant_control_delta(v_tenant, v_variant), v_i);
  if v_line->>'delta' <> 'program_only' or v_line->'product_status' <> 'null'::jsonb or v_line ? 'component_assessments' then
    raise exception 'A control marked for integration read % in the variant', v_line;
  end if;
  v_line := pg_temp.line(public.program_control_status(v_variant_program), v_i);
  if v_line->'determined_by' <> 'null'::jsonb or v_line->>'status' <> 'no_requirement' or v_line ? 'component_assessments' then
    raise exception 'A control marked for integration read % in the variant''s program', v_line;
  end if;
  -- The product's next assessment judges i on the product as a whole: that stands everywhere.
  insert into public.product_assessments(id, tenant_id, product_revision_id, profile_resolution_id, title)
    values (v_pa2, v_tenant, v_prev, v_base, 'Second product assessment');
  insert into public.product_determinations(tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination) values
    (v_tenant, v_pa2, v_prev, v_e_one, v_q, 'satisfied'), (v_tenant, v_pa2, v_prev, null, v_i, 'partially_satisfied');
  update public.product_assessments set state = 'published', published_at = now() - interval '1 hour', revision = revision + 1 where id = v_pa2;
  v_answer := public.product_control_status(v_tenant, v_prev);
  if (v_answer->'assessment'->>'id')::uuid <> v_pa2
    or pg_temp.line(v_answer, v_i)->>'core' <> 'partially_satisfied' or pg_temp.line(v_answer, v_i) ? 'inherited'
    or pg_temp.line(v_answer, v_n)->>'core' <> 'not_assessed' then
    raise exception 'A control marked for integration that the product judged read %', pg_temp.line(v_answer, v_i);
  end if;
  v_line := pg_temp.line(public.variant_control_delta(v_tenant, v_variant), v_i);
  if v_line->>'delta' <> 'inherited' or v_line->>'product_status' <> 'partially_satisfied' or v_line ? 'component_assessments' then
    raise exception 'A control the product judged at integration read % in the variant', v_line;
  end if;
  v_line := pg_temp.line(public.program_control_status(v_variant_program), v_i);
  if v_line->>'status' <> 'partially_satisfied' or v_line->>'determined_by' <> 'product'
    or v_line->'product_assessments' <> jsonb_build_array(jsonb_build_object('id', v_pa2, 'title', 'Second product assessment', 'determination', 'partially_satisfied'))
    or v_line ? 'component_assessments' then
    raise exception 'A control the product judged at integration read % in the variant''s program', v_line;
  end if;

  -- -------------------------------------------------------------------------------------------
  -- A program inherits per element.
  -- -------------------------------------------------------------------------------------------
  -- The element built from unit A inherits what unit A was judged on, the one built from unit B
  -- what unit B was, and the one built from neither nothing.
  if pg_temp.elements(v_own_program, array[v_s, v_p, v_n]) <> (
      select jsonb_agg(jsonb_build_array(x.code, x.control_id, x.determination, v_ca) order by x.code, x.control_id)
      from (values ('CI-OWN-E1', v_s, 'satisfied'), ('CI-OWN-E1', v_p, 'satisfied'),
        ('CI-OWN-E2', v_s, 'other_than_satisfied'), ('CI-OWN-E2', v_p, 'partially_satisfied')) x(code, control_id, determination))
    or jsonb_array_length(pg_temp.elements(v_own_program, null)) <> 6 then
    raise exception 'The program''s elements inherit %', pg_temp.elements(v_own_program, null);
  end if;
  -- The objective of s placed on the first element alone is judged by inheritance; the one placed
  -- on two elements, of which one inherits nothing, is left to the assessor. Both objectives of p
  -- stand on two inherited elements and take the worse determination.
  if pg_temp.objectives(v_own_program, array[v_s]) <> jsonb_build_array(jsonb_build_array(v_s, v_o1, 'satisfied',
      jsonb_build_array(jsonb_build_object('id', v_ca, 'determination', 'satisfied'))))
    or pg_temp.objectives(v_own_program, array[v_p]) <> (
      select jsonb_agg(jsonb_build_array(v_p, o, 'partially_satisfied',
        jsonb_build_array(jsonb_build_object('id', v_ca, 'determination', 'partially_satisfied'))) order by o)
      from unnest(v_p_objectives) o) then
    raise exception 'The program''s objectives are inherited as %', pg_temp.objectives(v_own_program, array[v_s, v_p]);
  end if;
  if (select jsonb_agg(jsonb_build_array(j.objective_id, j.determination, j.inherited) order by j.objective_id)
      from public.program_control_objective_judgments(v_own_program, array[v_s]) j)
    <> jsonb_build_array(jsonb_build_array(v_o1, 'satisfied', true)) then
    raise exception 'The judgments of a control with one inherited objective are not that one';
  end if;
  v_answer := public.program_control_status(v_own_program);
  v_line := pg_temp.line(v_answer, v_s);
  if v_line->>'status' <> v_ladder or v_line->'determined_by' <> 'null'::jsonb
    or v_line->'objectives' <> '2'::jsonb or v_line->'objectives_assessed' <> '1'::jsonb or v_line->'objectives_inherited' <> '1'::jsonb
    or v_line->'component_assessments' <> jsonb_build_array(v_ca_entry || '{"determination": "satisfied"}'::jsonb) then
    raise exception 'A control with one objective inherited and one left to the assessor read %', v_line;
  end if;
  -- Every objective of p is inherited, so the control is decided, and it is the program's.
  v_line := pg_temp.line(v_answer, v_p);
  if v_line->>'status' <> 'partially_satisfied' or v_line->>'determined_by' <> 'program' or v_line->'product_assessments' <> '[]'::jsonb
    or v_line->'objectives_assessed' <> '2'::jsonb or v_line->'objectives_inherited' <> '2'::jsonb
    or v_line->'component_assessments' <> jsonb_build_array(v_ca_entry || '{"determination": "partially_satisfied"}'::jsonb) then
    raise exception 'A control with every objective inherited read %', v_line;
  end if;
  -- The lines the counts and the snapshots read say the same without the two keys, and the counts
  -- of the program are the status's totals.
  if (select jsonb_build_array(l.status, l.determined_by, l.objectives_assessed)
      from public.program_control_status_lines(v_own_program) l where l.id = v_p) <> '["partially_satisfied", "program", 2]'::jsonb
    or (select to_jsonb(c) - 'program_id' - 'baseline' from public.program_control_status_counts(array[v_own_program]) c)
      <> v_answer->'totals' then
    raise exception 'The lines and the counts do not follow the status: %',
      (select to_jsonb(c) from public.program_control_status_counts(array[v_own_program]) c);
  end if;
  if (v_answer->'totals'->>'partially_satisfied')::integer <> 1 then
    raise exception 'The program''s totals read %', v_answer->'totals';
  end if;

  -- An inherited objective counts as assessed, so an assessment leaves it out: the holdings say one
  -- of the two is judged, and a new plan takes only the other.
  select r.id into v_ssp from public.ssp_revisions r where r.system_id = v_own order by r.version_number limit 1;
  update public.ssp_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_ssp and state <> 'published';
  v_answer := public.plan_control_holdings(v_tenant, v_s, '{}', v_own_program);
  if v_answer->'objectives' <> '2'::jsonb or v_answer->'objectives_assessed' <> '1'::jsonb then
    raise exception 'The holdings of a control with one inherited objective read %', v_answer;
  end if;
  v_answer := public.plan_control_assessment(v_tenant, v_own_program, v_ssp, 'Inheritance test assessment',
    'c1474000-0000-0000-0000-000000000001', array[v_s]);
  select pl.id into v_plan from public.assessment_plan_revisions pl
    join public.assessment_campaigns g on g.id = pl.campaign_id
    where g.program_id = v_own_program and g.title = 'Inheritance test assessment';
  if (v_answer->>'added')::integer <> 1 or (v_answer->>'counted')::integer <> 2 or (v_answer->>'judged')::integer <> 1
    or (select jsonb_agg(o.target_control_part_id) from public.assessment_objectives o where o.plan_revision_id = v_plan)
      <> jsonb_build_array(v_o2) then
    raise exception 'A plan of a control with one inherited objective took %', v_answer;
  end if;
  v_answer := public.plan_control_holdings(v_tenant, v_s, array[v_plan], v_own_program);
  if v_answer->'plans'->0->'holds_unjudged' <> 'true'::jsonb or v_answer->'plans'->0->'unjudged_held' <> '1'::jsonb
    or v_answer->'plans'->0->'holds' <> 'false'::jsonb then
    raise exception 'A plan that holds what is left of a control with one inherited objective read %', v_answer;
  end if;

  -- The assessor judges the objective left: the control is decided once every objective is judged
  -- or inherited, by the worst of them, and it is the program's.
  update public.assessment_plan_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_plan;
  insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title)
    values (v_results1, v_tenant, 1, v_plan, 'What was left');
  insert into public.result_sets(tenant_id, assessment_results_revision_id, title) values (v_tenant, v_results1, 'First set') returning id into v_set;
  insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at)
    values (v_tenant, v_results1, v_set, v_o2, 'The objective left', 'partially_satisfied', now() - interval '2 days');
  update public.assessment_results_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_results1;
  v_line := pg_temp.line(public.program_control_status(v_own_program), v_s);
  if v_line->>'status' <> 'partially_satisfied' or v_line->>'determined_by' <> 'program'
    or v_line->'objectives_assessed' <> '2'::jsonb or v_line->'objectives_inherited' <> '1'::jsonb
    or v_line->'component_assessments' <> jsonb_build_array(v_ca_entry || '{"determination": "satisfied"}'::jsonb) then
    raise exception 'A control judged on one objective and inherited on the other read %', v_line;
  end if;
  -- The program's own determination stands over the inherited one: the assessor judges the first
  -- objective too, and nothing of the control is inherited any more.
  insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title)
    values (v_results2, v_tenant, 2, v_plan, 'The first objective, judged here');
  insert into public.result_sets(tenant_id, assessment_results_revision_id, title) values (v_tenant, v_results2, 'Second set') returning id into v_set;
  insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at)
    values (v_tenant, v_results2, v_set, v_o1, 'The first objective', 'other_than_satisfied', now() - interval '1 day');
  update public.assessment_results_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_results2;
  v_line := pg_temp.line(public.program_control_status(v_own_program), v_s);
  if v_line->>'status' <> 'other_than_satisfied' or v_line->>'determined_by' <> 'program'
    or v_line->'objectives_assessed' <> '2'::jsonb or v_line ? 'objectives_inherited' or v_line ? 'component_assessments'
    or exists (select 1 from public.program_control_objective_judgments(v_own_program, array[v_s]) j where j.inherited)
    -- The inheritance itself still says the element gives it; the program's own word stands over it.
    or jsonb_array_length(pg_temp.objectives(v_own_program, array[v_s])) <> 1 then
    raise exception 'A control the program judged over an inherited objective read %', v_line;
  end if;

  -- Where used and Upstream count what each consumer inherits: unit A is judged on four controls and
  -- its elements inherit all four, unit B on two.
  v_answer := public.system_upstream(v_own);
  select c into v_line from jsonb_array_elements(v_answer->'components') c where c->>'system_component_id' = v_component_a::text;
  select c into v_row from jsonb_array_elements(v_answer->'components') c where c->>'system_component_id' = v_component_b::text;
  if v_line->'controls_judged' <> '4'::jsonb or v_line->'controls_inherited' <> '4'::jsonb
    or v_row->'controls_judged' <> '2'::jsonb or v_row->'controls_inherited' <> '2'::jsonb
    or v_answer->'totals'->'controls_judged' <> '4'::jsonb or v_answer->'totals'->'controls_inherited' <> '4'::jsonb then
    raise exception 'Upstream counts % and % of %', v_line - 'standing', v_row - 'standing', v_answer->'totals';
  end if;
  v_answer := public.component_consumers(v_unit_a);
  if (select jsonb_agg(jsonb_build_array(x->>'element_code', x->'controls_judged', x->'controls_inherited') order by x->>'element_code')
      from jsonb_array_elements(v_answer->'systems') x)
    <> '[["CI-OWN-E1", 4, 4], ["CI-V-ONE", 4, 4]]'::jsonb then
    raise exception 'Where used counts %', v_answer->'systems';
  end if;

  -- An element that holds a second component that is not from the library inherits nothing: the
  -- objectives of p, placed on it too, go back to the assessor, and the control to the ladder.
  insert into public.system_components(tenant_id, system_id, system_element_id, code, name, component_type)
    values (v_tenant, v_own, v_e2, 'CI-OWN-EXTRA', 'A unit of the program''s own', 'hardware');
  v_answer := public.program_control_status(v_own_program);
  v_line := pg_temp.line(v_answer, v_p);
  if exists (select 1 from jsonb_array_elements(pg_temp.elements(v_own_program, null)) e where e->>0 = 'CI-OWN-E2')
    or jsonb_array_length(pg_temp.elements(v_own_program, null)) <> 4
    or pg_temp.objectives(v_own_program, array[v_p]) <> '[]'::jsonb
    or v_line->>'status' <> v_ladder or v_line->'determined_by' <> 'null'::jsonb or v_line->'objectives_assessed' <> '0'::jsonb
    or v_line ? 'objectives_inherited' or v_line ? 'component_assessments' then
    raise exception 'An element with a component that is not from the library still inherits: %, p %',
      pg_temp.elements(v_own_program, null), v_line;
  end if;
  v_answer := public.system_upstream(v_own);
  select c into v_row from jsonb_array_elements(v_answer->'components') c where c->>'system_component_id' = v_component_b::text;
  if v_row->'controls_judged' <> '2'::jsonb or v_row->'controls_inherited' <> '0'::jsonb
    or v_answer->'totals'->'controls_inherited' <> '4'::jsonb then
    raise exception 'Upstream of an element that no longer inherits counts % of %', v_row - 'standing', v_answer->'totals';
  end if;

  -- An element the program declared modified inherits nothing: the variant's objective of s goes
  -- back to its assessor, the product no longer decides the control, and Where used says none.
  perform public.declare_product_element_change(v_tenant, v_variant_one.id, v_variant_one.revision, array['software'], 'A customer build of unit A.');
  v_line := pg_temp.line(public.program_control_status(v_variant_program), v_s);
  if pg_temp.elements(v_variant_program, null) <> '[]'::jsonb
    -- One of its two objectives is mapped, so it stands at no requirement.
    or v_line->'determined_by' <> 'null'::jsonb or v_line->>'status' <> 'no_requirement' or v_line->'objectives_assessed' <> '0'::jsonb
    or v_line ? 'objectives_inherited' or v_line ? 'component_assessments' then
    raise exception 'An element declared modified still inherits: %, s %', pg_temp.elements(v_variant_program, null), v_line;
  end if;
  if (select jsonb_agg(jsonb_build_array(x->>'element_code', x->>'change', x->'controls_judged', x->'controls_inherited') order by x->>'element_code')
      from jsonb_array_elements(public.component_consumers(v_unit_a)->'systems') x)
    <> '[["CI-OWN-E1", null, 4, 4], ["CI-V-ONE", "modified", 4, 0]]'::jsonb then
    raise exception 'Where used of a modified element counts %', public.component_consumers(v_unit_a)->'systems';
  end if;

  perform set_config('test.product_revision', v_prev::text, true);
  perform set_config('test.program', v_own_program::text, true);
  perform set_config('test.control', v_s::text, true);
  perform set_config('test.ready', 'yes', true);
end $$;

-- ---------------------------------------------------------------------------------------------
-- A viewer reads what a member reads and writes nothing.
-- ---------------------------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'c1470000-0000-0000-0000-000000000003', true);
do $$
declare v_tenant uuid := current_setting('test.tenant')::uuid;
begin
  if current_setting('test.ready') <> 'yes' then return; end if;
  if (select count(*) from public.product_integration_controls) <> 2
    or public.product_control_status(v_tenant, current_setting('test.product_revision')::uuid)->'component_assessments' is null
    or jsonb_array_length(pg_temp.elements(current_setting('test.program')::uuid, null)) <> 4 then
    raise exception 'A viewer does not read what a member reads';
  end if;
  perform pg_temp.expect_error(format(
    $q$insert into public.product_integration_controls(tenant_id, product_revision_id, control_id, rationale) values (%L, %L, %L, 'A viewer''s mark.')$q$,
    v_tenant, current_setting('test.product_revision'), current_setting('test.control')), '42501');
  delete from public.product_integration_controls;
end $$;
select set_config('request.jwt.claim.sub', 'c1470000-0000-0000-0000-000000000001', true);
do $$ begin
  if current_setting('test.ready') = 'yes' and (select count(*) from public.product_integration_controls) <> 2 then
    raise exception 'A viewer removed a control from the integration set';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- The tenant boundary: another workspace's member reads none of it and names none of it.
-- ---------------------------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'c1470000-0000-0000-0000-000000000002', true);
do $$
declare v_tenant uuid := current_setting('test.tenant')::uuid; v_other uuid := current_setting('test.other_tenant')::uuid;
begin
  if current_setting('test.ready') <> 'yes' then return; end if;
  if exists (select 1 from public.product_integration_controls)
    or exists (select 1 from public.product_element_standing(v_tenant, current_setting('test.product_revision')::uuid)) then
    raise exception 'Another workspace reads what a component gave';
  end if;
  perform pg_temp.expect_error(format($q$select count(*) from public.program_element_inheritance(%L, null)$q$, current_setting('test.program')), '42501');
  perform pg_temp.expect_error(format($q$select public.product_control_status(%L, %L)$q$, v_tenant, current_setting('test.product_revision')), '42501');
  perform pg_temp.expect_error(format($q$select public.product_control_status(%L, %L)$q$, v_other, current_setting('test.product_revision')), '42501');
  perform pg_temp.expect_error(format($q$select public.program_control_status(%L)$q$, current_setting('test.program')), '42501');
  perform pg_temp.expect_error(format($q$select count(*) from public.program_objective_inheritance(%L, null)$q$, current_setting('test.program')), '42501');
  perform pg_temp.expect_error(format($q$select count(*) from public.program_control_objective_judgments(%L, array[%L]::uuid[])$q$,
    current_setting('test.program'), current_setting('test.control')), '42501');
  -- A product version of another workspace cannot be marked from one's own.
  perform pg_temp.expect_error(format(
    $q$insert into public.product_integration_controls(tenant_id, product_revision_id, control_id, rationale) values (%L, %L, %L, 'Marked across workspaces.')$q$,
    v_other, current_setting('test.product_revision'), current_setting('test.control')), '23503');
  perform pg_temp.expect_error(format(
    $q$insert into public.product_integration_controls(tenant_id, product_revision_id, control_id, rationale) values (%L, %L, %L, 'Written into another workspace.')$q$,
    v_tenant, current_setting('test.product_revision'), current_setting('test.control')), '42501');
end $$;
-- A session with no account reaches none of it.
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$select count(*) from public.product_integration_controls$$, '42501');
select pg_temp.expect_error($$select count(*) from public.program_element_inheritance(gen_random_uuid(), null)$$, '42501');
reset role;
rollback;
