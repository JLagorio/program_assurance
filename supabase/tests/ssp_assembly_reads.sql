-- Run with psql -v ON_ERROR_STOP=1 after migrations and the pinned reference data
-- (npm run seed:reference). Every test row rolls back.
-- The SSP assembly's reads (20261114170710_ssp_assembly_and_objective_register_reads):
-- ssp_control_rows answers an SSP revision's register in one request, each control its stored
-- baseline selects in the baseline's order with its implementation, whether its narrative is
-- written (whitespace is not a narrative), and how many contributions, requirements and evidence
-- versions stand behind it: a requirement linked to the narrative or a contribution, or mapping the
-- control (a part of it too) on a system inside the boundary, or on none and allocated inside it,
-- never a mapping elsewhere; evidence on the narrative, a statement, a contribution or such a
-- requirement, each version once. It says the totals, whether the boundary resolves to another
-- baseline now, and what the boundary's systems' own baselines add outside the selection.
-- ssp_control_detail answers one control's records, the ones the preview edits with every column
-- but the lifecycle stamps (the workspace too, which the edit form checks), the mappings of the control wherever they are (the screen applies the boundary),
-- and refuses a control the SSP does not select as not found. A viewer reads what a member reads;
-- another workspace's member and an anonymous session read nothing.
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
-- One control's line of the register, by the catalog control.
create function pg_temp.line(answer jsonb, control uuid) returns jsonb language sql immutable as $$
  select r from jsonb_array_elements(answer->'rows') r where (r->>'control_id')::uuid = control
$$;
grant execute on function pg_temp.line(jsonb, uuid) to authenticated;
-- A system's selection of a control, from the baseline it resolves to now.
create function pg_temp.selection(system uuid, control uuid) returns uuid language sql stable as $$
  select sc.id from public.selected_controls sc
  join public.system_effective_baselines b on b.profile_resolution_id = sc.profile_resolution_id
  where b.system_id = system and sc.control_id = control limit 1;
$$;
grant execute on function pg_temp.selection(uuid, uuid) to authenticated;

-- No anonymous session runs either read; both run as their caller.
do $$ begin
  if has_function_privilege('anon', 'public.ssp_control_rows(uuid)', 'execute')
    or has_function_privilege('anon', 'public.ssp_control_detail(uuid, uuid)', 'execute') then
    raise exception 'An anonymous session may read an SSP assembly';
  end if;
  if (select bool_or(p.prosecdef) from pg_catalog.pg_proc p
      where p.oid in ('public.ssp_control_rows(uuid)'::regprocedure, 'public.ssp_control_detail(uuid, uuid)'::regprocedure)) then
    raise exception 'An SSP assembly read does not run as its caller';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- The reference data the test reads: the smallest published baseline with four controls that have
-- a statement and assessment objectives, and a larger baseline of its catalog that selects more.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_small uuid; v_more uuid; v_controls uuid[];
begin
  select r.id into v_small
  from public.profile_resolutions r
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id
      and exists (select 1 from public.control_parts p where p.control_id = sc.control_id and p.name = 'statement')
      and exists (select 1 from public.control_parts p where p.control_id = sc.control_id and p.name = 'assessment-objective')) >= 4
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id
  limit 1;
  if v_small is null then
    raise exception 'The reference data is not loaded. Run npm run seed:reference first.';
  end if;
  v_controls := array(
    select sc.control_id from public.selected_controls sc
    where sc.profile_resolution_id = v_small
      and exists (select 1 from public.control_parts p where p.control_id = sc.control_id and p.name = 'statement')
      and exists (select 1 from public.control_parts p where p.control_id = sc.control_id and p.name = 'assessment-objective')
    order by sc.ordinal limit 4);
  select r.id into v_more
  from public.profile_resolutions r
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null and r.id <> v_small
    and exists (select 1 from public.selected_controls sc where sc.profile_resolution_id = r.id
      and not exists (select 1 from public.selected_controls x where x.profile_resolution_id = v_small and x.control_id = sc.control_id))
  order by r.id limit 1;
  if v_more is null then
    raise exception 'The reference data holds no larger baseline to test against. Run npm run seed:reference first.';
  end if;
  perform set_config('test.small', v_small::text, true);
  perform set_config('test.more', v_more::text, true);
  for i in 1..4 loop
    perform set_config('test.c' || i, v_controls[i]::text, true);
  end loop;
end $$;

-- ---------------------------------------------------------------------------------------------
-- A workspace: its owner and a viewer; and a member of another workspace.
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email, raw_user_meta_data) values
  ('55a00000-0000-0000-0000-000000000001', 'ssp-assembly-owner@example.test', '{"name":"SSP assembly test owner"}'),
  ('55a00000-0000-0000-0000-000000000002', 'ssp-assembly-viewer@example.test', '{"name":"SSP assembly test viewer"}'),
  ('55a00000-0000-0000-0000-000000000003', 'ssp-assembly-outsider@example.test', '{"name":"SSP assembly test outsider"}');
select set_config('request.jwt.claim.sub', '55a00000-0000-0000-0000-000000000003', true);
set local role authenticated;
select public.ensure_personal_tenant();
select set_config('request.jwt.claim.sub', '55a00000-0000-0000-0000-000000000001', true);
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, '55a00000-0000-0000-0000-000000000002', 'viewer');

-- ---------------------------------------------------------------------------------------------
-- A program: an authorization boundary with an element, another boundary, and an SSP revision of
-- each on the smaller baseline.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_small uuid := current_setting('test.small')::uuid;
  c1 uuid := current_setting('test.c1')::uuid; c2 uuid := current_setting('test.c2')::uuid;
  c3 uuid := current_setting('test.c3')::uuid; c4 uuid := current_setting('test.c4')::uuid;
  v_program uuid := '55a10000-0000-0000-0000-000000000001';
  v_boundary uuid := '55a20000-0000-0000-0000-000000000001';
  v_element uuid := '55a20000-0000-0000-0000-000000000002';
  v_other uuid := '55a20000-0000-0000-0000-000000000003';
  v_ssp uuid := '55a30000-0000-0000-0000-000000000001';
  v_statement_part uuid; v_objective uuid;
begin
  insert into public.programs(id, tenant_id, code, name) values (v_program, v_tenant, 'SSP-READS', 'SSP assembly reads test');
  insert into public.systems(id, tenant_id, program_id, code, name, system_type, is_authorization_boundary) values
    (v_boundary, v_tenant, v_program, 'SSP-B', 'Assembly boundary', 'information_system', true),
    (v_other, v_tenant, v_program, 'SSP-OTHER', 'Another boundary', 'information_system', true);
  insert into public.systems(id, tenant_id, program_id, code, name, system_type, parent_system_id, is_authorization_boundary) values
    (v_element, v_tenant, v_program, 'SSP-B-EL', 'Assembly element', 'subsystem', v_boundary, false);
  insert into public.ssp_revisions(id, tenant_id, system_id, profile_resolution_id, version_number) values
    (v_ssp, v_tenant, v_boundary, v_small, 1),
    ('55a30000-0000-0000-0000-000000000002', v_tenant, v_other, v_small, 1);

  -- The first control's narrative with a statement and a contribution; the second's narrative is
  -- only whitespace; the third has none; the fourth's narrative and contribution.
  insert into public.implemented_requirements(id, tenant_id, ssp_revision_id, selected_control_id, description) values
    ('55a40000-0000-0000-0000-000000000001', v_tenant, v_ssp, pg_temp.selection(v_boundary, c1), 'The boundary meets the first control.'),
    ('55a40000-0000-0000-0000-000000000002', v_tenant, v_ssp, pg_temp.selection(v_boundary, c2), E' \n\t '),
    ('55a40000-0000-0000-0000-000000000004', v_tenant, v_ssp, pg_temp.selection(v_boundary, c4), 'The boundary meets the fourth control.');
  select p.id into v_statement_part from public.control_parts p where p.control_id = c1 and p.name = 'statement' order by p.id limit 1;
  insert into public.implementation_statements(id, tenant_id, ssp_revision_id, implemented_requirement_id, control_part_id, description) values
    ('55a41000-0000-0000-0000-000000000001', v_tenant, v_ssp, '55a40000-0000-0000-0000-000000000001', v_statement_part, 'The statement is met.');
  insert into public.system_components(id, tenant_id, system_id, code, name, component_type, system_element_id) values
    ('55a42000-0000-0000-0000-000000000001', v_tenant, v_boundary, 'SSP-K', 'Assembly component', 'software', v_element);
  insert into public.component_contributions(id, tenant_id, ssp_revision_id, implemented_requirement_id, system_component_id, description) values
    ('55a43000-0000-0000-0000-000000000001', v_tenant, v_ssp, '55a40000-0000-0000-0000-000000000001', '55a42000-0000-0000-0000-000000000001', 'The component does its part for the first.'),
    ('55a43000-0000-0000-0000-000000000004', v_tenant, v_ssp, '55a40000-0000-0000-0000-000000000004', '55a42000-0000-0000-0000-000000000001', 'The component does its part for the fourth.');

  -- Seven requirements, one revision each.
  insert into public.engineering_requirements(id, tenant_id, program_id, code)
    select ('55a50000-0000-0000-0000-00000000000' || n)::uuid, v_tenant, v_program, 'REQ-' || chr(64 + n)
    from generate_series(1, 7) n;
  insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type)
    select ('55a51000-0000-0000-0000-00000000000' || n)::uuid, v_tenant, ('55a50000-0000-0000-0000-00000000000' || n)::uuid, 1,
      'Requirement ' || chr(64 + n), 'It is done.', 'It is shown.', 'functional'
    from generate_series(1, 7) n;
  -- REQ-C and REQ-D on the element, REQ-E and REQ-F on the other boundary, REQ-G on the boundary.
  insert into public.requirement_allocations(tenant_id, requirement_revision_id, system_id) values
    (v_tenant, '55a51000-0000-0000-0000-000000000003', v_element),
    (v_tenant, '55a51000-0000-0000-0000-000000000004', v_element),
    (v_tenant, '55a51000-0000-0000-0000-000000000005', v_other),
    (v_tenant, '55a51000-0000-0000-0000-000000000006', v_other),
    (v_tenant, '55a51000-0000-0000-0000-000000000007', v_boundary);
  -- REQ-A linked to the first control's narrative; REQ-B to the fourth's contribution.
  insert into public.requirement_implementations(id, tenant_id, requirement_revision_id, implemented_requirement_id, component_contribution_id) values
    ('55a52000-0000-0000-0000-000000000001', v_tenant, '55a51000-0000-0000-0000-000000000001', '55a40000-0000-0000-0000-000000000001', null),
    ('55a52000-0000-0000-0000-000000000002', v_tenant, '55a51000-0000-0000-0000-000000000002', null, '55a43000-0000-0000-0000-000000000004');
  -- The second control mapped four ways: on the element (inside), on no system allocated inside,
  -- on no system allocated only outside, and on the other boundary. REQ-G maps one of the third
  -- control's assessment objectives on no system, allocated inside.
  select o.id into v_objective from public.control_parts o
    where o.control_id = c3 and o.name = 'assessment-objective' order by o.id limit 1;
  insert into public.requirement_control_links(id, tenant_id, requirement_revision_id, control_id, control_part_id, system_id, selected_control_id, relationship_type) values
    ('55a53000-0000-0000-0000-000000000003', v_tenant, '55a51000-0000-0000-0000-000000000003', c2, null, v_element, pg_temp.selection(v_element, c2), 'maps_to'),
    ('55a53000-0000-0000-0000-000000000004', v_tenant, '55a51000-0000-0000-0000-000000000004', c2, null, null, null, 'maps_to'),
    ('55a53000-0000-0000-0000-000000000005', v_tenant, '55a51000-0000-0000-0000-000000000005', c2, null, null, null, 'maps_to'),
    ('55a53000-0000-0000-0000-000000000006', v_tenant, '55a51000-0000-0000-0000-000000000006', c2, null, v_other, pg_temp.selection(v_other, c2), 'maps_to'),
    ('55a53000-0000-0000-0000-000000000007', v_tenant, '55a51000-0000-0000-0000-000000000007', c3, v_objective, null, null, 'satisfies');

  -- Evidence: one version on the first control's narrative and on its statement, the other on the
  -- fourth's contribution; REQ-A cites the second, REQ-D the first.
  insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind, program_id) values
    ('55a60000-0000-0000-0000-000000000001', v_tenant, 'Assembly evidence', 'document', v_program);
  insert into public.evidence_versions(id, tenant_id, artifact_id, version_number, state, external_uri) values
    ('55a61000-0000-0000-0000-000000000001', v_tenant, '55a60000-0000-0000-0000-000000000001', 1, 'published', 'https://example.test/ssp-assembly-1'),
    ('55a61000-0000-0000-0000-000000000002', v_tenant, '55a60000-0000-0000-0000-000000000001', 2, 'published', 'https://example.test/ssp-assembly-2');
  insert into public.implementation_evidence(id, tenant_id, implemented_requirement_id, implementation_statement_id, component_contribution_id, evidence_version_id) values
    ('55a62000-0000-0000-0000-000000000001', v_tenant, '55a40000-0000-0000-0000-000000000001', null, null, '55a61000-0000-0000-0000-000000000001'),
    ('55a62000-0000-0000-0000-000000000002', v_tenant, null, '55a41000-0000-0000-0000-000000000001', null, '55a61000-0000-0000-0000-000000000001'),
    ('55a62000-0000-0000-0000-000000000003', v_tenant, null, null, '55a43000-0000-0000-0000-000000000004', '55a61000-0000-0000-0000-000000000002');
  insert into public.requirement_evidence(id, tenant_id, requirement_revision_id, evidence_version_id) values
    ('55a63000-0000-0000-0000-000000000001', v_tenant, '55a51000-0000-0000-0000-000000000001', '55a61000-0000-0000-0000-000000000002'),
    ('55a63000-0000-0000-0000-000000000002', v_tenant, '55a51000-0000-0000-0000-000000000004', '55a61000-0000-0000-0000-000000000001');
end $$;

-- ---------------------------------------------------------------------------------------------
-- The register.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_answer jsonb := public.ssp_control_rows('55a30000-0000-0000-0000-000000000001');
  c1 uuid := current_setting('test.c1')::uuid; c2 uuid := current_setting('test.c2')::uuid;
  c3 uuid := current_setting('test.c3')::uuid; c4 uuid := current_setting('test.c4')::uuid;
  v_line jsonb;
begin
  -- Every control the stored baseline selects, in the baseline's order, each once.
  if jsonb_array_length(v_answer->'rows') <> (select count(*) from public.selected_controls
      where profile_resolution_id = current_setting('test.small')::uuid)
    or (select array_agg((r->>'id')::uuid order by n) from jsonb_array_elements(v_answer->'rows') with ordinality x(r, n))
      <> (select array_agg(sc.id order by sc.ordinal, sc.id) from public.selected_controls sc
          where sc.profile_resolution_id = current_setting('test.small')::uuid) then
    raise exception 'The register does not list the stored selection in its order: %', v_answer->'rows';
  end if;
  v_line := pg_temp.line(v_answer, c1);
  if v_line->>'implementation_id' <> '55a40000-0000-0000-0000-000000000001' or not (v_line->>'narrative')::boolean
    or (v_line->>'contributions')::int <> 1 or (v_line->>'requirements')::int <> 1 or (v_line->>'evidence')::int <> 2
    or v_line->>'code' is null or v_line->>'title' is null then
    raise exception 'The first control: a narrative, its contribution, REQ-A, and two versions (one counted once): %', v_line;
  end if;
  v_line := pg_temp.line(v_answer, c2);
  if (v_line->>'narrative')::boolean or (v_line->>'contributions')::int <> 0
    or (v_line->>'requirements')::int <> 2 or (v_line->>'evidence')::int <> 1 then
    raise exception 'The second control: no narrative in whitespace, REQ-C and REQ-D inside and none outside, REQ-D''s version: %', v_line;
  end if;
  v_line := pg_temp.line(v_answer, c3);
  if v_line->>'implementation_id' is not null or v_line->>'implementation_status' is not null
    or (v_line->>'narrative')::boolean or (v_line->>'requirements')::int <> 1 or (v_line->>'evidence')::int <> 0 then
    raise exception 'The third control: no implementation, and REQ-G''s objective mapping: %', v_line;
  end if;
  v_line := pg_temp.line(v_answer, c4);
  if not (v_line->>'narrative')::boolean or (v_line->>'contributions')::int <> 1
    or (v_line->>'requirements')::int <> 1 or (v_line->>'evidence')::int <> 1 then
    raise exception 'The fourth control: REQ-B through its contribution, and the contribution''s version: %', v_line;
  end if;
  if exists (select 1 from jsonb_array_elements(v_answer->'rows') r
      where (r->>'control_id')::uuid not in (c1, c2, c3, c4)
        and ((r->>'requirements')::int <> 0 or (r->>'evidence')::int <> 0 or (r->>'contributions')::int <> 0
          or r->>'implementation_id' is not null)) then
    raise exception 'A control nothing stands behind counts something';
  end if;
  -- Across every control: REQ-A, B, C, D and G; the two versions.
  if (v_answer->>'requirements')::int <> 5 or (v_answer->>'evidence')::int <> 2 then
    raise exception 'The totals count each requirement and version once: % and %', v_answer->'requirements', v_answer->'evidence';
  end if;
  if (v_answer->>'boundary_differs')::boolean or v_answer->'gaps' <> '[]'::jsonb then
    raise exception 'The boundary still resolves to this SSP''s baseline: % %', v_answer->'boundary_differs', v_answer->'gaps';
  end if;
  if v_answer->>'baseline_title' is distinct from (select p.title from public.profile_resolutions r
      join public.profile_revisions v on v.id = r.profile_revision_id join public.profiles p on p.id = v.profile_id
      where r.id = current_setting('test.small')::uuid)
    or (v_answer->>'imported_demo')::boolean then
    raise exception 'The stored baseline is named by its profile: %', v_answer->'baseline_title';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- A control's preview.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  c1 uuid := current_setting('test.c1')::uuid; c2 uuid := current_setting('test.c2')::uuid;
  v_detail jsonb;
begin
  v_detail := public.ssp_control_detail('55a30000-0000-0000-0000-000000000001', pg_temp.selection('55a20000-0000-0000-0000-000000000001', c1));
  -- The implementation the preview edits: every column but the lifecycle stamps, its workspace too,
  -- which the edit form checks before it offers an edit.
  if (select array_agg(k order by k) from jsonb_object_keys(v_detail->'implementation') k)
    <> (select array_agg(column_name::text order by column_name::text) from information_schema.columns
        where table_schema = 'public' and table_name = 'implemented_requirements'
          and column_name not in ('created_at', 'updated_at', 'created_by', 'updated_by')) then
    raise exception 'The implementation does not carry every column its form edits: %', v_detail->'implementation';
  end if;
  if v_detail->'statements'->0->>'id' <> '55a41000-0000-0000-0000-000000000001'
    or v_detail->'statements'->0->>'tenant_id' <> current_setting('test.tenant')
    or v_detail->'statements'->0 ? 'created_at'
    or jsonb_array_length(v_detail->'contributions') <> 1
    or v_detail->'contributions'->0->>'id' <> '55a43000-0000-0000-0000-000000000001'
    or not (v_detail->'contributions'->0 ? 'library_implementation_id')
    or v_detail->'components'->0->>'name' <> 'Assembly component'
    or v_detail->'component_elements'->0->>'link_source' <> 'explicit'
    or v_detail->'component_elements'->0->>'system_element_id' <> '55a20000-0000-0000-0000-000000000002' then
    raise exception 'The first control''s statement, contribution and component: %', v_detail;
  end if;
  if jsonb_array_length(v_detail->'requirement_links') <> 1
    or v_detail->'requirement_links'->0->>'requirement_revision_id' <> '55a51000-0000-0000-0000-000000000001'
    or (select array_agg(e->>'id') from jsonb_array_elements(v_detail->'implementation_evidence') e)
      <> array['55a62000-0000-0000-0000-000000000001', '55a62000-0000-0000-0000-000000000002']
    or jsonb_array_length(v_detail->'versions') <> 2
    or v_detail->'artifacts'->0->>'title' <> 'Assembly evidence' then
    raise exception 'The first control''s link and evidence, the narrative''s first: %', v_detail;
  end if;
  -- The statement's part with every part above it.
  if not exists (select 1 from jsonb_array_elements(v_detail->'parts') p
      where p->>'id' = (select control_part_id::text from public.implementation_statements where id = '55a41000-0000-0000-0000-000000000001'))
    or exists (select 1 from jsonb_array_elements(v_detail->'parts') p
      where p->>'parent_part_id' is not null
        and not exists (select 1 from jsonb_array_elements(v_detail->'parts') q where q->>'id' = p->>'parent_part_id')) then
    raise exception 'The statement''s part and its parents: %', v_detail->'parts';
  end if;

  -- The second control: all four of its mappings, the screen tells inside from outside; the mapped
  -- revisions with their allocations, requirements and evidence; the selections the mappings
  -- recorded, and the baselines their systems resolve to.
  v_detail := public.ssp_control_detail('55a30000-0000-0000-0000-000000000001', pg_temp.selection('55a20000-0000-0000-0000-000000000001', c2));
  if (select array_agg(m->>'id' order by m->>'id') from jsonb_array_elements(v_detail->'control_mappings') m)
      <> array['55a53000-0000-0000-0000-000000000003', '55a53000-0000-0000-0000-000000000004',
               '55a53000-0000-0000-0000-000000000005', '55a53000-0000-0000-0000-000000000006']
    or jsonb_array_length(v_detail->'revisions') <> 4 or jsonb_array_length(v_detail->'requirements') <> 4
    or jsonb_array_length(v_detail->'allocations') <> 4
    or jsonb_array_length(v_detail->'requirement_evidence') <> 1
    -- Both systems resolve to the smaller baseline: their mappings recorded the same selection.
    or jsonb_array_length(v_detail->'source_selections') <> 1
    or jsonb_array_length(v_detail->'effective_baselines') <> 2
    or v_detail->'implementation'->>'description' <> E' \n\t ' then
    raise exception 'The second control''s mappings and what they name: %', v_detail;
  end if;
  -- A control the SSP does not select is not found.
  perform pg_temp.expect_error(format('select public.ssp_control_detail(%L, %L)', '55a30000-0000-0000-0000-000000000001',
    (select sc.id from public.selected_controls sc where sc.profile_resolution_id = current_setting('test.more')::uuid
      and not exists (select 1 from public.selected_controls x where x.profile_resolution_id = current_setting('test.small')::uuid
        and x.control_id = sc.control_id) limit 1)), 'PT404');
end $$;

-- ---------------------------------------------------------------------------------------------
-- A newer SSP revision on the larger baseline: the boundary and its element resolve to it, so the
-- first revision's boundary differs and its systems' baseline adds controls outside its selection.
-- ---------------------------------------------------------------------------------------------
insert into public.ssp_revisions(id, tenant_id, system_id, profile_resolution_id, version_number) values
  ('55a30000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid,
   '55a20000-0000-0000-0000-000000000001', current_setting('test.more')::uuid, 2);
do $$
declare
  v_answer jsonb := public.ssp_control_rows('55a30000-0000-0000-0000-000000000001');
  v_codes jsonb;
begin
  v_codes := (select jsonb_agg(k.code order by sc.id) from public.selected_controls sc
    join public.controls k on k.id = sc.control_id
    where sc.profile_resolution_id = current_setting('test.more')::uuid
      and not exists (select 1 from public.selected_controls x where x.profile_resolution_id = current_setting('test.small')::uuid
        and x.control_id = sc.control_id));
  if not (v_answer->>'boundary_differs')::boolean
    or v_answer->'gaps' <> jsonb_build_array(
      jsonb_build_object('system_id', '55a20000-0000-0000-0000-000000000001', 'name', 'Assembly boundary', 'codes', v_codes),
      jsonb_build_object('system_id', '55a20000-0000-0000-0000-000000000002', 'name', 'Assembly element', 'codes', v_codes)) then
    raise exception 'The first revision''s boundary differs, and its two systems add the larger baseline''s controls: % %',
      v_answer->'boundary_differs', v_answer->'gaps';
  end if;
  -- The other boundary is not this SSP's.
  if exists (select 1 from jsonb_array_elements(v_answer->'gaps') g where g->>'system_id' = '55a20000-0000-0000-0000-000000000003') then
    raise exception 'Another boundary''s system is not this SSP''s';
  end if;
  -- The newer revision reads its own selection, with no implementation recorded yet.
  v_answer := public.ssp_control_rows('55a30000-0000-0000-0000-000000000003');
  if (v_answer->>'boundary_differs')::boolean or v_answer->'gaps' <> '[]'::jsonb
    or exists (select 1 from jsonb_array_elements(v_answer->'rows') r where r->>'implementation_id' is not null) then
    raise exception 'The newer revision stands on its own selection: %', v_answer - 'rows';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Who reads: a viewer reads what a member reads; another workspace's member and an anonymous
-- session read nothing.
-- ---------------------------------------------------------------------------------------------
create temp table ssp_owner_answer as
  select public.ssp_control_rows('55a30000-0000-0000-0000-000000000001') as answer;
grant select on ssp_owner_answer to authenticated;
select set_config('request.jwt.claim.sub', '55a00000-0000-0000-0000-000000000002', true);
do $$ begin
  if public.ssp_control_rows('55a30000-0000-0000-0000-000000000001') <> (select answer from ssp_owner_answer) then
    raise exception 'A viewer reads another register than a member';
  end if;
end $$;
select set_config('request.jwt.claim.sub', '55a00000-0000-0000-0000-000000000003', true);
select pg_temp.expect_error($$select public.ssp_control_rows('55a30000-0000-0000-0000-000000000001')$$, '42501');
select pg_temp.expect_error(format('select public.ssp_control_detail(%L, %L)', '55a30000-0000-0000-0000-000000000001',
  (select (answer->'rows'->0->>'id') from ssp_owner_answer)), '42501');
set local role anon;
select pg_temp.expect_error($$select public.ssp_control_rows('55a30000-0000-0000-0000-000000000001')$$, '42501');
select pg_temp.expect_error($$select public.ssp_control_detail('55a30000-0000-0000-0000-000000000001', '55a30000-0000-0000-0000-000000000001')$$, '42501');
reset role;
rollback;
