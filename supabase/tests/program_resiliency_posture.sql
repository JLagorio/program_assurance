-- Run with psql -v ON_ERROR_STOP=1 after migrations and the pinned reference data
-- (npm run seed:reference). Every test row rolls back.
-- A program's posture, by control family and by cyber resiliency technique, in assessment
-- objectives (20261114170435_posture_by_objective): where a mapping stands (the element it names
-- where that element's control baseline selects the control, or, naming none, the elements its
-- requirement is allocated to), what it covers there (the objective it names, or every one of the
-- control), what an element that holds others pools, what is not placed, that the band is the
-- control status's and a line counts each objective once, that a cell's records add up to its
-- numbers, where open issues and risks stand, and who may ask.
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
create function pg_temp.selection(system uuid, control uuid) returns uuid language sql stable as $$
  select sc.id from public.selected_controls sc
  join public.system_effective_baselines b on b.profile_resolution_id = sc.profile_resolution_id
  where b.system_id = system and sc.control_id = control limit 1;
$$;
grant execute on function pg_temp.selection(uuid, uuid) to authenticated;
create function pg_temp.counts(answer jsonb) returns jsonb language sql immutable as $$
  select jsonb_build_object('objectives', answer->'objectives', 'evidenced', answer->'evidenced',
    'issues', answer->'issues', 'issue_severity', answer->'issue_severity',
    'risks', answer->'risks', 'risk_severity', answer->'risk_severity')
$$;
grant execute on function pg_temp.counts(jsonb) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- The reference data: a published reference baseline; a control of it that Table E-1 prints under
-- two techniques or more and that counts three objectives or more; a control of it in another family
-- that the table does not print; and a control of the catalog the baseline does not select.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_baseline uuid; v_catalog uuid; v_control uuid; v_other uuid; v_unselected uuid;
begin
  select r.id, i.catalog_revision_id, c.control_id into v_baseline, v_catalog, v_control
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  cross join lateral (
    select sc.control_id
    from public.selected_controls sc
    join public.catalog_control_rows x on x.id = sc.control_id
    where sc.profile_resolution_id = r.id
      and (select count(distinct coalesce(s.technique_code, case when s.item_kind = 'technique' then s.item_code end))
        from public.framework_control_link_rows s
        where s.tenant_id is null and s.framework_code = 'nist-sp800-160v2r1-cref' and s.relation = 'supports'
          and s.control_id = sc.control_id) >= 2
      and (select count(*) from public.control_parts o where o.control_id = sc.control_id and o.name = 'assessment-objective'
        and not exists (select 1 from public.control_parts g where g.parent_part_id = o.id and g.name = 'assessment-objective')) >= 3
    order by x.code_order limit 1) c
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id
  limit 1;
  if v_control is null then
    raise exception 'The reference data is not loaded. Run npm run seed:reference first.';
  end if;
  select sc.control_id into v_other
  from public.selected_controls sc
  join public.catalog_control_rows x on x.id = sc.control_id
  join public.controls g on g.id = sc.control_id
  where sc.profile_resolution_id = v_baseline
    and g.group_id is distinct from (select group_id from public.controls where id = v_control)
    and not exists (select 1 from public.framework_control_link_rows s
      where s.framework_code = 'nist-sp800-160v2r1-cref' and s.control_id = sc.control_id)
    and exists (select 1 from public.control_parts o where o.control_id = sc.control_id and o.name = 'assessment-objective')
  order by x.code_order limit 1;
  select c.id into v_unselected
  from public.controls c join public.catalog_control_rows x on x.id = c.id
  where c.catalog_revision_id = v_catalog and c.status = 'active'
    and not exists (select 1 from public.selected_controls sc where sc.profile_resolution_id = v_baseline and sc.control_id = c.id)
  order by x.code_order limit 1;
  perform set_config('test.baseline', v_baseline::text, true);
  perform set_config('test.catalog', v_catalog::text, true);
  perform set_config('test.control', v_control::text, true);
  perform set_config('test.family', (select group_id::text from public.controls where id = v_control), true);
  perform set_config('test.other', v_other::text, true);
  perform set_config('test.other_family', (select group_id::text from public.controls where id = v_other), true);
  perform set_config('test.unselected', v_unselected::text, true);
  perform set_config('test.techniques', (
    select array_agg(distinct coalesce(s.technique_code, case when s.item_kind = 'technique' then s.item_code end))::text
    from public.framework_control_link_rows s
    where s.tenant_id is null and s.framework_code = 'nist-sp800-160v2r1-cref' and s.relation = 'supports'
      and s.control_id = v_control), true);
  -- The control's first two leaf objectives, in the catalog's order.
  perform set_config('test.objective_a', (
    select o.id::text from public.control_parts o
    where o.control_id = v_control and o.name = 'assessment-objective'
      and not exists (select 1 from public.control_parts g where g.parent_part_id = o.id and g.name = 'assessment-objective')
    order by o.source_pointer limit 1), true);
  perform set_config('test.objective_b', (
    select o.id::text from public.control_parts o
    where o.control_id = v_control and o.name = 'assessment-objective'
      and not exists (select 1 from public.control_parts g where g.parent_part_id = o.id and g.name = 'assessment-objective')
    order by o.source_pointer offset 1 limit 1), true);
end $$;

-- ---------------------------------------------------------------------------------------------
-- The program: one authorization boundary on the reference baseline (the program wizard), which
-- holds elements A and B, and B holds C. Its requirements, and where their mappings stand:
--   REQ-1  allocated to A, maps the control on A, with evidence
--   REQ-2  allocated to B, maps the control on B, without evidence
--   REQ-3  allocated to A, maps the other control on A, with evidence: under no technique
--   REQ-4  allocated to nothing, maps the control naming no system: not placed
--   REQ-5  allocated to A and B: maps the control's first objective naming no system (so on A and
--          on B) and the other control on B, without evidence
--   REQ-6  allocated to A, maps a control the baseline does not select, naming no system: not placed
--   REQ-7  mapped the control at its first revision, and the unselected control at its latest: not
--          placed
--   REQ-8  allocated to C, maps the control's second objective on C, without evidence
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email, raw_user_meta_data) values
  ('e7900000-0000-0000-0000-000000000001', 'posture-member@example.test', '{"name":"Posture test member"}'),
  ('e7900000-0000-0000-0000-000000000002', 'posture-outsider@example.test', '{"name":"Posture test outsider"}'),
  ('e7900000-0000-0000-0000-000000000003', 'posture-viewer@example.test', '{"name":"Posture test viewer"}');
select set_config('request.jwt.claim.sub', 'e7900000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_key uuid := gen_random_uuid();
  v_program uuid; v_root uuid;
  v_a uuid := 'e7200000-0000-0000-0000-00000000000a';
  v_b uuid := 'e7200000-0000-0000-0000-00000000000b';
  v_c uuid := 'e7200000-0000-0000-0000-00000000000c';
  v_control uuid := current_setting('test.control')::uuid;
  v_other uuid := current_setting('test.other')::uuid;
  v_unselected uuid := current_setting('test.unselected')::uuid;
begin
  v_program := (public.create_program_wizard(v_tenant, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', 'POSTURE-TEST', 'name', 'Rollback posture program', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb,
    'catalogRevisionId', current_setting('test.catalog')::uuid,
    'profiles', jsonb_build_array(jsonb_build_object(
      'key', v_key, 'baseResolutionId', current_setting('test.baseline')::uuid, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)),
    'systems', jsonb_build_array(jsonb_build_object(
      'key', gen_random_uuid(), 'code', 'SYS-ROOT', 'name', 'Mission system', 'profileKey', v_key,
      'description', '', 'type', 'information_system', 'ownerPartyId', null,
      'confidentiality', 'low', 'integrity', 'low', 'availability', 'low',
      'categorizationRationale', 'A limited impact boundary for a rollback test.', 'elements', '[]'::jsonb))))->>'programId')::uuid;
  select s.id into v_root from public.systems s where s.program_id = v_program and s.code = 'SYS-ROOT';
  insert into public.systems(id, tenant_id, program_id, code, name, system_type, parent_system_id, boundary_system_id, is_authorization_boundary) values
    (v_a, v_tenant, v_program, 'SYS-A', 'Flight computer', 'software', v_root, v_root, false),
    (v_b, v_tenant, v_program, 'SYS-B', 'Ground station', 'software', v_root, v_root, false),
    (v_c, v_tenant, v_program, 'SYS-C', 'Ground antenna', 'hardware', v_b, v_root, false);
  insert into public.engineering_requirements(id, tenant_id, program_id, code)
    select ('e7300000-0000-0000-0000-00000000000' || n)::uuid, v_tenant, v_program, 'REQ-' || n
    from generate_series(1, 8) n;
  insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type)
    select ('e7400000-0000-0000-0000-00000000000' || n)::uuid, v_tenant, ('e7300000-0000-0000-0000-00000000000' || n)::uuid,
      1, 'Requirement ' || n, 'The element signs every record.', 'Every record verifies.', 'security'
    from generate_series(1, 8) n;
  insert into public.requirement_allocations(tenant_id, requirement_revision_id, system_id)
    select v_tenant, allocation.revision_id::uuid, allocation.system_id
    from (values
      ('e7400000-0000-0000-0000-000000000001', v_a),
      ('e7400000-0000-0000-0000-000000000002', v_b),
      ('e7400000-0000-0000-0000-000000000003', v_a),
      ('e7400000-0000-0000-0000-000000000005', v_a),
      ('e7400000-0000-0000-0000-000000000005', v_b),
      ('e7400000-0000-0000-0000-000000000006', v_a),
      ('e7400000-0000-0000-0000-000000000007', v_a),
      ('e7400000-0000-0000-0000-000000000008', v_c)
    ) allocation(revision_id, system_id);
  -- The mappings that name their systems, as Map a requirement writes them.
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, control_part_id, system_id, selected_control_id, relationship_type)
    select v_tenant, link.revision_id::uuid, link.control_id, link.part_id, link.system_id, pg_temp.selection(link.system_id, link.control_id), 'satisfies'
    from (values
      ('e7400000-0000-0000-0000-000000000001', v_control, null::uuid, v_a),
      ('e7400000-0000-0000-0000-000000000002', v_control, null::uuid, v_b),
      ('e7400000-0000-0000-0000-000000000003', v_other, null::uuid, v_a),
      ('e7400000-0000-0000-0000-000000000005', v_other, null::uuid, v_b),
      ('e7400000-0000-0000-0000-000000000008', v_control, current_setting('test.objective_b')::uuid, v_c)
    ) link(revision_id, control_id, part_id, system_id);
  -- The mappings that name no system, as the September records did.
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, control_part_id, relationship_type)
    select v_tenant, link.revision_id::uuid, link.control_id, link.part_id, 'satisfies'
    from (values
      ('e7400000-0000-0000-0000-000000000004', v_control, null::uuid),
      ('e7400000-0000-0000-0000-000000000005', v_control, current_setting('test.objective_a')::uuid),
      ('e7400000-0000-0000-0000-000000000006', v_unselected, null::uuid),
      ('e7400000-0000-0000-0000-000000000007', v_control, null::uuid)
    ) link(revision_id, control_id, part_id);
  perform set_config('test.program', v_program::text, true);
  perform set_config('test.root', v_root::text, true);
end $$;
-- A requirement keeps one revision now, and its guard refuses a second. Requirements written
-- before the guard have several, and only the latest is read. REQ-7 is given its second revision
-- as those were written, with the triggers asleep for these three rows, which locks nothing.
reset role;
set local session_replication_role = replica;
insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type) values
  ('e7400000-0000-0000-0000-000000000072', current_setting('test.tenant')::uuid, 'e7300000-0000-0000-0000-000000000007', 2, 'Requirement 7, revised', 'The element signs every record.', 'Every record verifies.', 'security');
insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type) values
  (current_setting('test.tenant')::uuid, 'e7400000-0000-0000-0000-000000000072', current_setting('test.unselected')::uuid, 'satisfies');
insert into public.requirement_allocations(tenant_id, requirement_revision_id, system_id) values
  (current_setting('test.tenant')::uuid, 'e7400000-0000-0000-0000-000000000072', 'e7200000-0000-0000-0000-00000000000a');
set local session_replication_role = origin;
set local role authenticated;

-- Evidence for REQ-1 and for REQ-3. An open high issue and a closed critical one cite REQ-1's; an
-- open low one cites REQ-3's, which stands under no technique. One open risk rests on the high
-- issue at its latest assessment, and one rests on nothing.
insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind, program_id) values
  ('e7500000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'Signature test report', 'document', current_setting('test.program')::uuid),
  ('e7500000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'Training record', 'document', current_setting('test.program')::uuid);
insert into public.evidence_versions(id, tenant_id, artifact_id, version_number, state, external_uri) values
  ('e7510000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'e7500000-0000-0000-0000-000000000001', 1, 'published', 'https://example.test/evidence/report'),
  ('e7510000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'e7500000-0000-0000-0000-000000000003', 1, 'published', 'https://example.test/evidence/training');
insert into public.requirement_evidence(tenant_id, requirement_revision_id, evidence_version_id) values
  (current_setting('test.tenant')::uuid, 'e7400000-0000-0000-0000-000000000001', 'e7510000-0000-0000-0000-000000000001'),
  (current_setting('test.tenant')::uuid, 'e7400000-0000-0000-0000-000000000003', 'e7510000-0000-0000-0000-000000000003');
insert into public.operational_issues(id, tenant_id, program_id, title, severity, status) values
  ('e7600000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, current_setting('test.program')::uuid, 'Signatures fail under a rotated key', 'high', 'open'),
  ('e7600000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, current_setting('test.program')::uuid, 'Rotation was not recorded', 'critical', 'closed'),
  ('e7600000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, current_setting('test.program')::uuid, 'Training record is out of date', 'low', 'open');
insert into public.issue_evidence(tenant_id, issue_id, evidence_version_id) values
  (current_setting('test.tenant')::uuid, 'e7600000-0000-0000-0000-000000000001', 'e7510000-0000-0000-0000-000000000001'),
  (current_setting('test.tenant')::uuid, 'e7600000-0000-0000-0000-000000000002', 'e7510000-0000-0000-0000-000000000001'),
  (current_setting('test.tenant')::uuid, 'e7600000-0000-0000-0000-000000000003', 'e7510000-0000-0000-0000-000000000003');
insert into public.observations(id, tenant_id, program_id, title, method) values
  ('e7700000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, current_setting('test.program')::uuid, 'Signature check fails', 'test');
insert into public.issue_observations(tenant_id, issue_id, observation_id) values
  (current_setting('test.tenant')::uuid, 'e7600000-0000-0000-0000-000000000001', 'e7700000-0000-0000-0000-000000000001');
insert into public.risks(id, tenant_id, program_id, title) values
  ('e7800000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, current_setting('test.program')::uuid, 'Records become unverifiable'),
  ('e7800000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, current_setting('test.program')::uuid, 'Supplier goes out of business');
insert into public.risk_revisions(id, tenant_id, risk_id, version_number, severity) values
  ('e7810000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'e7800000-0000-0000-0000-000000000001', 1, 'critical'),
  ('e7810000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'e7800000-0000-0000-0000-000000000002', 1, 'low');
insert into public.risk_observations(tenant_id, risk_revision_id, observation_id) values
  (current_setting('test.tenant')::uuid, 'e7810000-0000-0000-0000-000000000001', 'e7700000-0000-0000-0000-000000000001');

-- ---------------------------------------------------------------------------------------------
-- The posture by control family.
-- ---------------------------------------------------------------------------------------------
do $$ begin
  perform set_config('test.family_answer', public.program_posture(current_setting('test.tenant')::uuid, current_setting('test.program')::uuid)::text, true);
  perform set_config('test.answer', public.program_resiliency_posture(current_setting('test.program')::uuid)::text, true);
end $$;
do $$
declare
  answer constant jsonb := current_setting('test.family_answer')::jsonb;
  program constant uuid := current_setting('test.program')::uuid;
  v_family constant text := current_setting('test.family');
  v_other_family constant text := current_setting('test.other_family');
  root constant text := current_setting('test.root');
  a constant text := 'e7200000-0000-0000-0000-00000000000a';
  b constant text := 'e7200000-0000-0000-0000-00000000000b';
  c constant text := 'e7200000-0000-0000-0000-00000000000c';
  -- How many objectives each control counts, as its control status counts them.
  n1 integer; n2 integer;
  standing record;
  expected jsonb;
  found jsonb;
begin
  select jsonb_array_length(public.program_control_objectives(program, current_setting('test.control')::uuid)->'objectives'),
    jsonb_array_length(public.program_control_objectives(program, current_setting('test.other')::uuid)->'objectives')
    into n1, n2;
  if n1 < 3 or n2 < 1 then
    raise exception 'The controls do not count the objectives the test expects: % and %', n1, n2;
  end if;
  perform set_config('test.n1', n1::text, true);
  perform set_config('test.n2', n2::text, true);

  -- Every family the baseline holds, in the catalog's order; one nothing is mapped in reads none.
  if (select count(*) from jsonb_array_elements(answer->'families'))
      <> (select count(distinct x.group_id) from public.selected_controls sc join public.controls x on x.id = sc.control_id
        where sc.profile_resolution_id = (select b.profile_resolution_id from public.system_effective_baselines b where b.system_id = root::uuid))
    or exists (select 1 from jsonb_array_elements(answer->'families') f
      where f->>'id' not in (v_family, v_other_family) and pg_temp.counts(f) is distinct from
        '{"objectives":0,"evidenced":0,"issues":0,"issue_severity":null,"risks":0,"risk_severity":null}'::jsonb) then
    raise exception 'The posture does not list every family of the baseline, nothing in those nothing is mapped in: %', answer->'families';
  end if;

  -- A cell where a requirement stands: the family's objectives the mappings on the element and the
  -- elements inside it cover, each once. B pools C's objective with its own, and the boundary pools
  -- them all; an objective REQ-1 covers with evidence on A has evidence on the boundary, though B
  -- covers it with none.
  if (select count(*) from jsonb_array_elements(answer->'cells')) <> 7 then
    raise exception 'The posture does not hold a cell where each requirement stands: %', answer->'cells';
  end if;
  for found in select x from jsonb_array_elements(answer->'cells') x loop
    expected := case found->>'family_id'
      when v_family then case found->>'element_id'
        when a then jsonb_build_object('objectives', n1, 'evidenced', n1, 'issues', 1, 'issue_severity', 3, 'risks', 1, 'risk_severity', 4)
        when b then jsonb_build_object('objectives', n1, 'evidenced', 0, 'issues', 0, 'issue_severity', null, 'risks', 0, 'risk_severity', null)
        when c then jsonb_build_object('objectives', 1, 'evidenced', 0, 'issues', 0, 'issue_severity', null, 'risks', 0, 'risk_severity', null)
        when root then jsonb_build_object('objectives', n1, 'evidenced', n1, 'issues', 1, 'issue_severity', 3, 'risks', 1, 'risk_severity', 4)
      end
      when v_other_family then case found->>'element_id'
        when a then jsonb_build_object('objectives', n2, 'evidenced', n2, 'issues', 1, 'issue_severity', 1, 'risks', 0, 'risk_severity', null)
        when b then jsonb_build_object('objectives', n2, 'evidenced', 0, 'issues', 0, 'issue_severity', null, 'risks', 0, 'risk_severity', null)
        when root then jsonb_build_object('objectives', n2, 'evidenced', n2, 'issues', 1, 'issue_severity', 1, 'risks', 0, 'risk_severity', null)
      end
    end;
    if expected is null or pg_temp.counts(found) is distinct from expected then
      raise exception 'A cell does not count what stands in it: % (expected %)', found, expected;
    end if;
  end loop;

  -- A line counts each objective and each record once.
  expected := jsonb_build_object(
    a, jsonb_build_object('objectives', n1 + n2, 'evidenced', n1 + n2, 'issues', 2, 'issue_severity', 3, 'risks', 1, 'risk_severity', 4),
    b, jsonb_build_object('objectives', n1 + n2, 'evidenced', 0, 'issues', 0, 'issue_severity', null, 'risks', 0, 'risk_severity', null),
    c, jsonb_build_object('objectives', 1, 'evidenced', 0, 'issues', 0, 'issue_severity', null, 'risks', 0, 'risk_severity', null),
    root, jsonb_build_object('objectives', n1 + n2, 'evidenced', n1 + n2, 'issues', 2, 'issue_severity', 3, 'risks', 1, 'risk_severity', 4));
  select jsonb_object_agg(e->>'id', pg_temp.counts(e)) into found from jsonb_array_elements(answer->'elements') e;
  if found is distinct from expected then
    raise exception 'An element''s line does not count each objective once: % (expected %)', found, expected;
  end if;
  if array(select e->>'code' from jsonb_array_elements(answer->'elements') with ordinality as x(e, n) order by n) <> array['SYS-A', 'SYS-B', 'SYS-C', 'SYS-ROOT']
    or (answer->'elements'->2->>'parent_id') <> b or (answer->'elements'->3->>'boundary')::boolean is not true
    or exists (select 1 from jsonb_array_elements(answer->'elements') e where e ? 'own_requirements' or e ? 'requirements') then
    raise exception 'The posture does not list the program''s elements by code with their holder: %', answer->'elements';
  end if;
  select pg_temp.counts(f) into found from jsonb_array_elements(answer->'families') f where f->>'id' = v_family;
  if found is distinct from jsonb_build_object('objectives', n1, 'evidenced', n1, 'issues', 1, 'issue_severity', 3, 'risks', 1, 'risk_severity', 4) then
    raise exception 'The family''s line does not count each objective once: %', found;
  end if;

  -- The band is the program's control baseline as its control status counts it. Three
  -- requirements are not placed: REQ-4 is allocated to nothing, and REQ-6 and REQ-7 (at its latest
  -- revision) map a control the baseline does not select. The closed issue is not counted, and the
  -- risk on nothing is counted and not placed.
  select count(*) as controls, sum(l.objectives) as objectives, sum(l.objectives_mapped) as mapped,
    sum(l.objectives_evidenced) as evidenced,
    sum(l.objectives_mapped) filter (where x.group_id::text = v_family) as family_mapped,
    sum(l.objectives_evidenced) filter (where x.group_id::text = v_family) as family_evidenced
    into standing
  from public.program_control_status_lines(program) l join public.controls x on x.id = l.id;
  expected := jsonb_build_object('requirements', 8, 'unplaced', 3, 'objectives', standing.objectives,
    'mapped', n1 + n2, 'evidenced', n1 + n2, 'placed', n1 + n2,
    'issues', 2, 'issues_severe', 1, 'issues_placed', 2, 'risks', 2, 'risks_severe', 1, 'risks_placed', 1);
  if answer->'totals' is distinct from expected or standing.mapped <> n1 + n2 or standing.evidenced <> n1 + n2 then
    raise exception 'The totals do not say what is placed, or the band is not the control status''s: % (expected %, control status %)', answer->'totals', expected, row_to_json(standing);
  end if;
  -- The boundary's row reads as its control status: one authorization boundary holds them all.
  select pg_temp.counts(x) into found from jsonb_array_elements(answer->'cells') x
    where x->>'element_id' = root and x->>'family_id' = v_family;
  if (found->>'objectives')::int <> standing.family_mapped or (found->>'evidenced')::int <> standing.family_evidenced then
    raise exception 'The boundary''s family does not read as its control status: % (control status % and %)', found, standing.family_mapped, standing.family_evidenced;
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- The posture by technique: an objective stands under every technique its control supports.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  answer constant jsonb := current_setting('test.answer')::jsonb;
  family_answer constant jsonb := current_setting('test.family_answer')::jsonb;
  techniques constant text[] := current_setting('test.techniques')::text[];
  n1 constant integer := current_setting('test.n1')::integer;
  root constant text := current_setting('test.root');
  a constant text := 'e7200000-0000-0000-0000-00000000000a';
  b constant text := 'e7200000-0000-0000-0000-00000000000b';
  c constant text := 'e7200000-0000-0000-0000-00000000000c';
  expected jsonb;
  found jsonb;
  listed text[];
begin
  -- Every technique the framework's current revision names, in the publication's order, by code.
  select array_agg(i.code order by i.ordinal, i.code) into listed
    from public.framework_item_rows i
    where i.tenant_id is null and i.framework_code = 'nist-sp800-160v2r1-cref' and i.kind = 'technique';
  if array(select t->>'code' from jsonb_array_elements(answer->'techniques') with ordinality as x(t, n) order by n) is distinct from listed
    or exists (select 1 from jsonb_array_elements(answer->'techniques') t where t ? 'id' or coalesce(t->>'title', '') = '') then
    raise exception 'The posture does not list the framework''s techniques in its order, by code and title: %', answer->'techniques';
  end if;

  -- The control's objectives stand under every technique it supports, at each element where they
  -- stand, and under no other; the other control's stand under none.
  if (select count(*) from jsonb_array_elements(answer->'cells')) <> 4 * cardinality(techniques)
    or exists (select 1 from jsonb_array_elements(answer->'cells') x where not (x->>'technique_code' = any(techniques))) then
    raise exception 'An objective stands under a technique its control does not support, or misses one it does: %', answer->'cells';
  end if;
  for found in select x from jsonb_array_elements(answer->'cells') x loop
    expected := case found->>'element_id'
      when a then jsonb_build_object('objectives', n1, 'evidenced', n1, 'issues', 1, 'issue_severity', 3, 'risks', 1, 'risk_severity', 4)
      when b then jsonb_build_object('objectives', n1, 'evidenced', 0, 'issues', 0, 'issue_severity', null, 'risks', 0, 'risk_severity', null)
      when c then jsonb_build_object('objectives', 1, 'evidenced', 0, 'issues', 0, 'issue_severity', null, 'risks', 0, 'risk_severity', null)
      when root then jsonb_build_object('objectives', n1, 'evidenced', n1, 'issues', 1, 'issue_severity', 3, 'risks', 1, 'risk_severity', 4)
    end;
    if pg_temp.counts(found) is distinct from expected then
      raise exception 'A cell does not count what stands in it: % (expected %)', found, expected;
    end if;
  end loop;

  -- A line counts each objective once, however many techniques it stands under; the other
  -- control's objectives are on no line.
  expected := jsonb_build_object(
    a, jsonb_build_object('objectives', n1, 'evidenced', n1, 'issues', 1, 'issue_severity', 3, 'risks', 1, 'risk_severity', 4),
    b, jsonb_build_object('objectives', n1, 'evidenced', 0, 'issues', 0, 'issue_severity', null, 'risks', 0, 'risk_severity', null),
    c, jsonb_build_object('objectives', 1, 'evidenced', 0, 'issues', 0, 'issue_severity', null, 'risks', 0, 'risk_severity', null),
    root, jsonb_build_object('objectives', n1, 'evidenced', n1, 'issues', 1, 'issue_severity', 3, 'risks', 1, 'risk_severity', 4));
  select jsonb_object_agg(e->>'id', pg_temp.counts(e)) into found from jsonb_array_elements(answer->'elements') e;
  if found is distinct from expected then
    raise exception 'An element''s line does not count each objective once: % (expected %)', found, expected;
  end if;
  for found in select t from jsonb_array_elements(answer->'techniques') t loop
    expected := case when found->>'code' = any(techniques)
      then jsonb_build_object('objectives', n1, 'evidenced', n1, 'issues', 1, 'issue_severity', 3, 'risks', 1, 'risk_severity', 4)
      else '{"objectives":0,"evidenced":0,"issues":0,"issue_severity":null,"risks":0,"risk_severity":null}'::jsonb
    end;
    if pg_temp.counts(found) is distinct from expected then
      raise exception 'A technique''s line does not count what stands under it: % (expected %)', found, expected;
    end if;
  end loop;

  -- The control's objectives are placed; REQ-3 stands on A under no technique, and so does the
  -- issue that cites its evidence.
  if (answer->'totals'->>'placed')::int <> n1 or (answer->'totals'->>'unsupported')::int <> 1
    or (answer->'totals'->>'unplaced')::int <> 3
    or (answer->'totals'->>'issues_placed')::int <> 1 or (answer->'totals'->>'risks_placed')::int <> 1 then
    raise exception 'The totals by technique do not say what is placed: %', answer->'totals';
  end if;
  -- What the two postures count alike, they count the same.
  if (answer->'totals') - 'placed' - 'unsupported' - 'issues_placed' - 'risks_placed'
    is distinct from (family_answer->'totals') - 'placed' - 'issues_placed' - 'risks_placed' then
    raise exception 'The posture by technique and the posture by family disagree: % and %', answer->'totals', family_answer->'totals';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- A cell's records add up to its numbers: every cell, every line, and the whole grid.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  tenant constant uuid := current_setting('test.tenant')::uuid;
  program constant uuid := current_setting('test.program')::uuid;
  family_answer constant jsonb := current_setting('test.family_answer')::jsonb;
  answer constant jsonb := current_setting('test.answer')::jsonb;
  technique constant text := (current_setting('test.techniques')::text[])[1];
  n1 constant integer := current_setting('test.n1')::integer;
  counted jsonb;
  detail jsonb;
begin
  for counted in
    select x || jsonb_build_object('by', 'family') from jsonb_array_elements(family_answer->'cells') x
    union all
    select e || jsonb_build_object('element_id', e->'id', 'by', 'family') from jsonb_array_elements(family_answer->'elements') e
    union all
    select f || jsonb_build_object('family_id', f->'id', 'by', 'family') from jsonb_array_elements(family_answer->'families') f
    union all
    select jsonb_build_object('objectives', family_answer->'totals'->'placed', 'evidenced', null,
      'issues', family_answer->'totals'->'issues_placed', 'risks', family_answer->'totals'->'risks_placed', 'by', 'family')
    union all
    select x || jsonb_build_object('by', 'technique') from jsonb_array_elements(answer->'cells') x
    union all
    select e || jsonb_build_object('element_id', e->'id', 'by', 'technique') from jsonb_array_elements(answer->'elements') e
    union all
    select t || jsonb_build_object('technique_code', t->'code', 'by', 'technique') from jsonb_array_elements(answer->'techniques') t
    union all
    select jsonb_build_object('objectives', answer->'totals'->'placed', 'evidenced', null,
      'issues', answer->'totals'->'issues_placed', 'risks', answer->'totals'->'risks_placed', 'by', 'technique')
  loop
    detail := case counted->>'by'
      when 'family' then public.program_posture_cell(tenant, program, (counted->>'element_id')::uuid, (counted->>'family_id')::uuid)
      else public.program_resiliency_posture_cell(program, (counted->>'element_id')::uuid, counted->>'technique_code')
    end;
    if (detail->>'objectives')::int <> (counted->>'objectives')::int
      or (counted->>'evidenced' is not null and (detail->>'evidenced')::int <> (counted->>'evidenced')::int)
      or coalesce((select sum((x->>'objectives')::int) from jsonb_array_elements(detail->'controls') x), 0) <> (detail->>'objectives')::int
      or coalesce((select sum((x->>'evidenced')::int) from jsonb_array_elements(detail->'controls') x), 0) <> (detail->>'evidenced')::int
      or ((detail->>'objectives')::int > (detail->>'evidenced')::int) <> ((detail->>'unevidenced_count')::int > 0)
      or jsonb_array_length(detail->'unevidenced') <> least((detail->>'unevidenced_count')::int, 50)
      or jsonb_array_length(detail->'issues') <> (counted->>'issues')::int
      or jsonb_array_length(detail->'risks') <> (counted->>'risks')::int then
      raise exception 'The records of % do not add up to its numbers: %', counted, detail;
    end if;
  end loop;

  -- B pools its own mappings and C's: none cites evidence, so every requirement there is one to
  -- evidence, the one that covers the most first.
  detail := public.program_posture_cell(tenant, program, 'e7200000-0000-0000-0000-00000000000b', current_setting('test.family')::uuid);
  if detail->'unevidenced' <> jsonb_build_array(
      jsonb_build_object('id', 'e7300000-0000-0000-0000-000000000002', 'code', 'REQ-2', 'title', 'Requirement 2', 'objectives', n1),
      jsonb_build_object('id', 'e7300000-0000-0000-0000-000000000005', 'code', 'REQ-5', 'title', 'Requirement 5', 'objectives', 1),
      jsonb_build_object('id', 'e7300000-0000-0000-0000-000000000008', 'code', 'REQ-8', 'title', 'Requirement 8', 'objectives', 1))
    or (detail->>'unevidenced_count')::int <> 3
    or detail->'controls' <> jsonb_build_array(jsonb_build_object('id', current_setting('test.control')::uuid,
      'code', (select code from public.controls where id = current_setting('test.control')::uuid),
      'title', (select title from public.controls where id = current_setting('test.control')::uuid),
      'objectives', n1, 'evidenced', 0, 'total', n1))
    or detail->'issues' <> '[]'::jsonb then
    raise exception 'B''s cell does not list its control and its requirements to evidence: %', detail;
  end if;
  -- C holds the one objective REQ-8 maps there, of the control's.
  detail := public.program_posture_cell(tenant, program, 'e7200000-0000-0000-0000-00000000000c', current_setting('test.family')::uuid);
  if (detail->>'objectives')::int <> 1 or (detail->'controls'->0->>'total')::int <> n1
    or detail->'unevidenced' <> jsonb_build_array(jsonb_build_object('id', 'e7300000-0000-0000-0000-000000000008',
      'code', 'REQ-8', 'title', 'Requirement 8', 'objectives', 1)) then
    raise exception 'C''s cell does not hold the one objective mapped there: %', detail;
  end if;
  -- The boundary has evidence for every objective of the control: nothing to evidence there.
  detail := public.program_posture_cell(tenant, program, current_setting('test.root')::uuid, current_setting('test.family')::uuid);
  if detail->'unevidenced' <> '[]'::jsonb or (detail->>'unevidenced_count')::int <> 0
    or detail->'issues' <> '[{"id":"e7600000-0000-0000-0000-000000000001","title":"Signatures fail under a rotated key","severity":"high","status":"open"}]'::jsonb
    or (select jsonb_agg(r - 'status') from jsonb_array_elements(detail->'risks') r)
      <> '[{"id":"e7800000-0000-0000-0000-000000000001","title":"Records become unverifiable","severity":"critical"}]'::jsonb then
    raise exception 'The boundary''s cell does not list its issue and risk, with nothing to evidence: %', detail;
  end if;
  -- By technique, the same at B.
  detail := public.program_resiliency_posture_cell(program, 'e7200000-0000-0000-0000-00000000000b', technique);
  if (detail->>'objectives')::int <> n1 or (detail->>'unevidenced_count')::int <> 3 then
    raise exception 'B''s cell by technique does not hold the control''s objectives: %', detail;
  end if;
  -- A technique the framework does not name holds nothing.
  detail := public.program_resiliency_posture_cell(program, null, 'technique.not-a-technique');
  if (detail->>'objectives')::int <> 0 or detail->'issues' <> '[]'::jsonb or detail->'controls' <> '[]'::jsonb then
    raise exception 'An unknown technique holds records: %', detail;
  end if;
  -- A program of another workspace, or of none, holds nothing in this workspace's posture.
  if public.program_posture(tenant, 'e71fffff-0000-0000-0000-000000000001')->'cells' <> '[]'::jsonb
    or (public.program_posture_cell(tenant, 'e71fffff-0000-0000-0000-000000000001')->>'objectives')::int <> 0 then
    raise exception 'A program nobody has holds something';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Who may ask.
-- ---------------------------------------------------------------------------------------------
-- A viewer of the workspace reads what its owner reads.
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'e7900000-0000-0000-0000-000000000003', 'viewer');
select set_config('request.jwt.claim.sub', 'e7900000-0000-0000-0000-000000000003', true);
do $$ begin
  if public.program_resiliency_posture(current_setting('test.program')::uuid)->'totals' is distinct from current_setting('test.answer')::jsonb->'totals'
    or public.program_posture(current_setting('test.tenant')::uuid, current_setting('test.program')::uuid)->'totals'
      is distinct from current_setting('test.family_answer')::jsonb->'totals'
    or (public.program_resiliency_posture_cell(current_setting('test.program')::uuid)->>'objectives')::int
      <> (current_setting('test.answer')::jsonb->'totals'->>'placed')::int then
    raise exception 'A viewer does not read the posture its workspace''s owner reads';
  end if;
end $$;
-- A member of another workspace cannot read the program, and is refused. So is a program nobody has.
select set_config('request.jwt.claim.sub', 'e7900000-0000-0000-0000-000000000002', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
select pg_temp.expect_error(format('select public.program_posture(%L, %L)', current_setting('test.tenant'), current_setting('test.program')), '42501');
select pg_temp.expect_error(format('select public.program_posture_cell(%L, %L)', current_setting('test.tenant'), current_setting('test.program')), '42501');
select pg_temp.expect_error(format('select public.program_resiliency_posture(%L)', current_setting('test.program')), '42501');
select pg_temp.expect_error(format('select public.program_resiliency_posture_cell(%L)', current_setting('test.program')), '42501');
select pg_temp.expect_error(format('select count(*) from public.program_objective_placement(%L)', current_setting('test.program')), '42501');
select pg_temp.expect_error($$select public.program_resiliency_posture('e71fffff-0000-0000-0000-000000000001')$$, '42501');
select pg_temp.expect_error($$select public.program_resiliency_posture_cell('e71fffff-0000-0000-0000-000000000001', null, 'technique.redundancy')$$, '42501');
-- A session with no signed-in user is refused, and an anonymous one may not execute at all.
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error(format('select public.program_resiliency_posture(%L)', current_setting('test.program')), '42501');
select pg_temp.expect_error(format('select public.program_resiliency_posture_cell(%L)', current_setting('test.program')), '42501');
select pg_temp.expect_error(format('select count(*) from public.program_objective_placement(%L)', current_setting('test.program')), '42501');
set local role anon;
do $$ begin
  if has_function_privilege('public.program_posture(uuid, uuid)', 'execute')
    or has_function_privilege('public.program_posture_cell(uuid, uuid, uuid, uuid)', 'execute')
    or has_function_privilege('public.program_resiliency_posture(uuid)', 'execute')
    or has_function_privilege('public.program_resiliency_posture_cell(uuid, uuid, text)', 'execute')
    or has_function_privilege('public.program_objective_placement(uuid)', 'execute') then
    raise exception 'An anonymous session may execute the posture reads';
  end if;
end $$;
select pg_temp.expect_error(format('select public.program_resiliency_posture(%L)', current_setting('test.program')), '42501');
select pg_temp.expect_error(format('select public.program_resiliency_posture_cell(%L)', current_setting('test.program')), '42501');
reset role;
do $$ begin
  if not has_function_privilege('authenticated', 'public.program_posture(uuid, uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.program_posture_cell(uuid, uuid, uuid, uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.program_resiliency_posture(uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.program_resiliency_posture_cell(uuid, uuid, text)', 'execute')
    or not has_function_privilege('authenticated', 'public.program_objective_placement(uuid)', 'execute')
    or (select bool_or(p.prosecdef) from pg_catalog.pg_proc p
      where p.oid in ('public.program_posture(uuid, uuid)'::regprocedure, 'public.program_posture_cell(uuid, uuid, uuid, uuid)'::regprocedure,
        'public.program_resiliency_posture(uuid)'::regprocedure, 'public.program_resiliency_posture_cell(uuid, uuid, text)'::regprocedure,
        'public.program_objective_placement(uuid)'::regprocedure)) then
    raise exception 'The posture reads are not the caller''s to execute as the caller';
  end if;
end $$;
rollback;
select 'Program posture by family and by technique: placement, objectives, pooling, the band, cell records and access passed.' as result;
