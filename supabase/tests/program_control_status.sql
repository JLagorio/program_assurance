-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- One status for each control of a program's control baseline: who may ask, what a program with no
-- baseline answers and, with the pinned references installed (a catalog and a reference baseline),
-- how a control climbs the ladder: no requirement, no evidence, not assessed, and the worst of the
-- latest determinations an assessor published on its parts. What does not count is checked beside
-- it: another program's requirement, another program's campaign and a draft result. Then a program
-- that takes two products: a control every variant inherits with a determination takes the
-- product's, the worst of the two, and names the product assessments it was taken from; the
-- program's own determination still wins; a control one variant does not inherit (program only,
-- shared, changed here, or claimed and not judged) keeps the program's ladder; and a draft product
-- assessment decides nothing.
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
-- Who may ask: a signed-in member, as themselves.
-- ---------------------------------------------------------------------------------------------
do $$ begin
  if has_function_privilege('anon', 'public.program_control_status(uuid)', 'execute')
    or has_function_privilege('public', 'public.program_control_status(uuid)', 'execute') then
    raise exception 'An anonymous session may execute program_control_status';
  end if;
  if not has_function_privilege('authenticated', 'public.program_control_status(uuid)', 'execute') then
    raise exception 'A signed-in session may not execute program_control_status';
  end if;
  if (select p.prosecdef from pg_catalog.pg_proc p where p.oid = 'public.program_control_status(uuid)'::regprocedure) then
    raise exception 'program_control_status does not run as its caller';
  end if;
end $$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('c5700000-0000-0000-0000-000000000001', 'control-status-owner@example.test', '{"name":"Control status test owner"}'),
  ('c5700000-0000-0000-0000-000000000002', 'control-status-outsider@example.test', '{}');
select set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.programs(id, tenant_id, code, name) values
  ('c5710000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'STATUS-BARE', 'Program with no control baseline');

-- A program with no control baseline says so: nothing stands, and nothing is counted as standing nowhere.
do $$
declare v_answer jsonb := public.program_control_status('c5710000-0000-0000-0000-000000000001');
begin
  if (v_answer->>'baseline')::boolean or v_answer->'controls' <> '[]'::jsonb
    or v_answer->'totals' <> '{"controls": 0, "satisfied": 0, "partially_satisfied": 0, "other_than_satisfied": 0, "not_assessed": 0, "no_evidence": 0, "no_requirement": 0}'::jsonb then
    raise exception 'A program with no baseline answered %', v_answer;
  end if;
end $$;

-- A program the reader cannot read is refused, never answered as empty: one that does not exist,
-- any program for a session with no account, and another workspace's program.
select pg_temp.expect_error($$select public.program_control_status('c5710000-0000-0000-0000-00000000dead')$$, '42501');
select pg_temp.expect_error($$select public.program_control_status(null)$$, '42501');
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$select public.program_control_status('c5710000-0000-0000-0000-000000000001')$$, '42501');
set local role anon;
select pg_temp.expect_error($$select public.program_control_status('c5710000-0000-0000-0000-000000000001')$$, '42501');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000002', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
select pg_temp.expect_error($$select public.program_control_status('c5710000-0000-0000-0000-000000000001')$$, '42501');
select set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000001', true);

-- ---------------------------------------------------------------------------------------------
-- With the pinned references installed: a program set up as the product sets one up, through
-- create_program_wizard, with one system that adopts a reference baseline as it comes.
-- ---------------------------------------------------------------------------------------------
create function pg_temp.program(code text, catalog uuid, base uuid) returns uuid language plpgsql as $$
declare created jsonb; profile uuid := gen_random_uuid();
begin
  created := public.create_program_wizard(current_setting('test.tenant')::uuid, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', code, 'name', code || ' control status test', 'description', '',
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
-- One control's line of an answer.
create function pg_temp.line(answer jsonb, control uuid) returns jsonb language sql stable as $$
  select c from jsonb_array_elements(answer->'controls') c where c->>'id' = control::text;
$$;
grant execute on function pg_temp.program(text, uuid, uuid), pg_temp.line(jsonb, uuid) to authenticated;

do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_base uuid; v_program uuid; v_other uuid;
  v_a uuid; v_b uuid; v_c uuid; v_part_a uuid; v_part_b uuid; v_part_b2 uuid; v_part_c uuid;
  v_system uuid; v_ssp uuid;
  v_campaign uuid := gen_random_uuid(); v_plan uuid := gen_random_uuid();
  v_first uuid := gen_random_uuid(); v_second uuid := gen_random_uuid(); v_draft uuid := gen_random_uuid();
  v_set uuid;
  v_selected integer; v_answer jsonb; v_totals jsonb;
begin
  -- The smallest published reference baseline, on its catalog.
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
  v_program := pg_temp.program('CS-ONE', v_catalog, v_base);
  v_other := pg_temp.program('CS-OTHER', v_catalog, v_base);

  -- A baseline with nothing recorded against it: every control it selects, each with no requirement.
  select count(distinct sc.control_id) into v_selected
  from public.program_reference_choices c
  join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
  where c.program_id = v_program;
  v_answer := public.program_control_status(v_program);
  if not (v_answer->>'baseline')::boolean or v_selected < 3
    or (v_answer->'totals'->>'controls')::integer <> v_selected
    or (v_answer->'totals'->>'no_requirement')::integer <> v_selected
    or jsonb_array_length(v_answer->'controls') <> v_selected
    or exists (select 1 from jsonb_array_elements(v_answer->'controls') c
      where c->>'status' <> 'no_requirement' or c->'requirements' <> '0'::jsonb or c->'evidenced' <> '0'::jsonb) then
    raise exception 'A baseline with nothing recorded answered % for % selected controls', v_answer->'totals', v_selected;
  end if;
  -- Each control is named as the catalog names it, with its family.
  if exists (select 1 from jsonb_array_elements(v_answer->'controls') c
      join public.catalog_control_rows k on k.id = (c->>'id')::uuid
      where c->>'code' <> k.code or c->>'family' is distinct from k.family) then
    raise exception 'program_control_status does not name a control as the catalog does';
  end if;

  -- Three controls of the baseline that each have a part an assessor can judge.
  select (array_agg(x.control_id order by x.code_order))[1], (array_agg(x.control_id order by x.code_order))[2],
    (array_agg(x.control_id order by x.code_order))[3]
  into v_a, v_b, v_c
  from (
    select distinct sc.control_id, k.code_order
    from public.program_reference_choices c
    join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
    join public.catalog_control_rows k on k.id = sc.control_id
    where c.program_id = v_program
      and (select count(*) from public.control_parts p where p.control_id = sc.control_id) >= 2
  ) x;
  if v_c is null then
    raise notice 'The baseline has no three controls with parts: the ladder checks were skipped';
    return;
  end if;

  -- A requirement maps A; one with evidence maps B; C is mapped by another program's requirement alone.
  insert into public.engineering_requirements(id, tenant_id, program_id, code) values
    ('c5720000-0000-0000-0000-000000000001', v_tenant, v_program, 'REQ-BARE'),
    ('c5720000-0000-0000-0000-000000000002', v_tenant, v_program, 'REQ-EVIDENCED'),
    ('c5720000-0000-0000-0000-000000000004', v_tenant, v_other, 'REQ-ELSEWHERE');
  insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type) values
    ('c5730000-0000-0000-0000-000000000001', v_tenant, 'c5720000-0000-0000-0000-000000000001', 1, 'Mapped and bare', 'The system does the first thing.', 'It is recorded.', 'functional'),
    ('c5730000-0000-0000-0000-000000000002', v_tenant, 'c5720000-0000-0000-0000-000000000002', 1, 'Mapped with evidence', 'The system does the second thing.', 'It is recorded.', 'functional'),
    ('c5730000-0000-0000-0000-000000000005', v_tenant, 'c5720000-0000-0000-0000-000000000004', 1, 'Mapped elsewhere', 'The other system does the third thing.', 'It is recorded.', 'functional');
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type) values
    (v_tenant, 'c5730000-0000-0000-0000-000000000001', v_a, 'satisfies'),
    -- One requirement maps a control twice, in two relationships: it is one requirement.
    (v_tenant, 'c5730000-0000-0000-0000-000000000002', v_b, 'satisfies'),
    (v_tenant, 'c5730000-0000-0000-0000-000000000002', v_b, 'maps_to'),
    (v_tenant, 'c5730000-0000-0000-0000-000000000005', v_c, 'satisfies');
  insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind, program_id) values
    ('c5740000-0000-0000-0000-000000000001', v_tenant, 'Rollback control status report', 'document', v_program);
  insert into public.evidence_versions(id, tenant_id, artifact_id, version_number, state, external_uri) values
    ('c5750000-0000-0000-0000-000000000001', v_tenant, 'c5740000-0000-0000-0000-000000000001', 1, 'published', 'https://example.test/evidence/control-status');
  insert into public.requirement_evidence(tenant_id, requirement_revision_id, evidence_version_id) values
    (v_tenant, 'c5730000-0000-0000-0000-000000000002', 'c5750000-0000-0000-0000-000000000001'),
    (v_tenant, 'c5730000-0000-0000-0000-000000000005', 'c5750000-0000-0000-0000-000000000001');

  v_answer := public.program_control_status(v_program);
  v_totals := v_answer->'totals';
  if pg_temp.line(v_answer, v_a)->>'status' <> 'no_evidence'
    or pg_temp.line(v_answer, v_a)->'requirements' <> '1'::jsonb or pg_temp.line(v_answer, v_a)->'evidenced' <> '0'::jsonb then
    raise exception 'A control one bare requirement maps answered %', pg_temp.line(v_answer, v_a);
  end if;
  if pg_temp.line(v_answer, v_b)->>'status' <> 'not_assessed'
    or pg_temp.line(v_answer, v_b)->'requirements' <> '1'::jsonb or pg_temp.line(v_answer, v_b)->'evidenced' <> '1'::jsonb then
    raise exception 'A control an evidenced requirement maps answered %', pg_temp.line(v_answer, v_b);
  end if;
  if pg_temp.line(v_answer, v_c)->>'status' <> 'no_requirement' or pg_temp.line(v_answer, v_c)->'requirements' <> '0'::jsonb then
    raise exception 'Another program''s requirement counted: %', pg_temp.line(v_answer, v_c);
  end if;
  if (v_totals->>'no_evidence')::integer <> 1 or (v_totals->>'not_assessed')::integer <> 1
    or (v_totals->>'no_requirement')::integer <> v_selected - 2
    or (select sum(value::integer) from jsonb_each_text(v_totals) where key <> 'controls') <> v_selected then
    raise exception 'The totals do not add up to the baseline: %', v_totals;
  end if;
  -- The other program reads its own: its requirement maps C with evidence.
  if pg_temp.line(public.program_control_status(v_other), v_c)->>'status' <> 'not_assessed' then
    raise exception 'The other program''s own requirement was not counted on it';
  end if;

  -- An assessor's determinations, on the parts of the controls. The plan stands on a published
  -- system security plan, and results on a published plan.
  select p.id into v_part_a from public.control_parts p where p.control_id = v_a order by p.ordinal, p.id limit 1;
  select p.id into v_part_b from public.control_parts p where p.control_id = v_b order by p.ordinal, p.id limit 1;
  select p.id into v_part_b2 from public.control_parts p where p.control_id = v_b order by p.ordinal, p.id offset 1 limit 1;
  select p.id into v_part_c from public.control_parts p where p.control_id = v_c order by p.ordinal, p.id limit 1;
  select s.id into v_system from public.systems s where s.program_id = v_program order by s.created_at, s.id limit 1;
  -- Program setup wrote the system's first security plan revision; the plan stands on it once published.
  select r.id into v_ssp from public.ssp_revisions r where r.system_id = v_system order by r.version_number limit 1;
  update public.ssp_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_ssp and state <> 'published';
  insert into public.assessment_campaigns(id, tenant_id, title, program_id) values (v_campaign, v_tenant, 'Control status test campaign', v_program);
  insert into public.assessment_plan_revisions(id, tenant_id, version_number, campaign_id, ssp_revision_id, title)
    values (v_plan, v_tenant, 1, v_campaign, v_ssp, 'Control status test plan');
  update public.assessment_plan_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_plan;

  -- First results: B's first part satisfied, and a determination of not assessed on A, which decides nothing.
  insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title)
    values (v_first, v_tenant, 1, v_plan, 'First results');
  insert into public.result_sets(tenant_id, assessment_results_revision_id, title) values (v_tenant, v_first, 'First set') returning id into v_set;
  insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at) values
    (v_tenant, v_first, v_set, v_part_b, 'B, first part', 'satisfied', now() - interval '2 days'),
    (v_tenant, v_first, v_set, v_part_a, 'A, looked at and left', 'not_assessed', now() - interval '2 days');
  -- A draft result decides nothing.
  if pg_temp.line(public.program_control_status(v_program), v_b)->>'status' <> 'not_assessed' then
    raise exception 'A draft result decided a control''s status';
  end if;
  update public.assessment_results_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_first;
  v_answer := public.program_control_status(v_program);
  if pg_temp.line(v_answer, v_b)->>'status' <> 'satisfied' or pg_temp.line(v_answer, v_a)->>'status' <> 'no_evidence' then
    raise exception 'Published results answered B % and A %', pg_temp.line(v_answer, v_b)->>'status', pg_temp.line(v_answer, v_a)->>'status';
  end if;

  -- Second results, later: B's second part partially satisfied, so the worst of B's parts decides;
  -- A other than satisfied, whatever it holds; and C satisfied in a result left in draft.
  insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title)
    values (v_second, v_tenant, 2, v_plan, 'Second results');
  insert into public.result_sets(tenant_id, assessment_results_revision_id, title) values (v_tenant, v_second, 'Second set') returning id into v_set;
  insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at) values
    (v_tenant, v_second, v_set, v_part_b2, 'B, second part', 'partially_satisfied', now() - interval '1 day'),
    (v_tenant, v_second, v_set, v_part_a, 'A, judged', 'other_than_satisfied', now() - interval '1 day');
  update public.assessment_results_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_second;
  insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title)
    values (v_draft, v_tenant, 3, v_plan, 'Results in draft');
  insert into public.result_sets(tenant_id, assessment_results_revision_id, title) values (v_tenant, v_draft, 'Draft set') returning id into v_set;
  insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at) values
    (v_tenant, v_draft, v_set, v_part_c, 'C, not yet published', 'satisfied', now()),
    -- A later word on B's second part, unpublished: the published one still stands.
    (v_tenant, v_draft, v_set, v_part_b2, 'B, second part again', 'satisfied', now());
  v_answer := public.program_control_status(v_program);
  v_totals := v_answer->'totals';
  if pg_temp.line(v_answer, v_b)->>'status' <> 'partially_satisfied'
    or pg_temp.line(v_answer, v_a)->>'status' <> 'other_than_satisfied'
    or pg_temp.line(v_answer, v_c)->>'status' <> 'no_requirement' then
    raise exception 'The determinations answered A %, B %, C %', pg_temp.line(v_answer, v_a)->>'status',
      pg_temp.line(v_answer, v_b)->>'status', pg_temp.line(v_answer, v_c)->>'status';
  end if;
  if (v_totals->>'other_than_satisfied')::integer <> 1 or (v_totals->>'partially_satisfied')::integer <> 1
    or (v_totals->>'satisfied')::integer <> 0
    or (select sum(value::integer) from jsonb_each_text(v_totals) where key <> 'controls') <> v_selected then
    raise exception 'The totals after the determinations do not add up: %', v_totals;
  end if;
  -- A program with no product variant: every determination is its own assessors', and no control
  -- names a product assessment.
  if pg_temp.line(v_answer, v_a)->>'determined_by' <> 'program' or pg_temp.line(v_answer, v_b)->>'determined_by' <> 'program'
    or pg_temp.line(v_answer, v_c)->'determined_by' <> 'null'::jsonb
    or exists (select 1 from jsonb_array_elements(v_answer->'controls') c
      where c->'product_assessments' <> '[]'::jsonb
        or (c->>'determined_by' is not null) <> (c->>'status' in ('satisfied', 'partially_satisfied', 'other_than_satisfied'))) then
    raise exception 'A program with no variant said whose determinations: A %, B %, C %', pg_temp.line(v_answer, v_a),
      pg_temp.line(v_answer, v_b), pg_temp.line(v_answer, v_c);
  end if;
  -- The other program's campaigns are its own: nothing of this one's results reaches it.
  if pg_temp.line(public.program_control_status(v_other), v_a)->>'status' <> 'no_requirement' then
    raise exception 'A determination of one program''s campaign reached another program';
  end if;

  -- A viewer of the workspace reads the same answer.
  insert into public.tenant_memberships(tenant_id, user_id, role) values (v_tenant, 'c5700000-0000-0000-0000-000000000002', 'viewer');
  perform set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000002', true);
  if public.program_control_status(v_program) is distinct from v_answer then
    raise exception 'A viewer read another answer';
  end if;
  perform set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000001', true);
  raise notice 'The ladder checks ran against the pinned references';
end $$;

-- ---------------------------------------------------------------------------------------------
-- A program that takes two products, one variant of each, set up as the product sets one up.
-- Seven controls of the baseline, as the two products' library components claim them and their
-- product assessments judge them:
--
--   K1  P: claimed, satisfied        Q: claimed, satisfied           both inherit it
--   K2  P: claimed, satisfied        Q: claimed, partially satisfied both inherit it, the worst
--   K3  P: claimed, satisfied        Q: nothing                      Q's own: program only
--   K4  P: claimed, satisfied        Q: claimed, satisfied           the program judges it too
--   K5  P's kit: claimed, satisfied  Q: claimed, satisfied           P's kit is then modified
--   K6  P: claimed in part           Q: claimed, satisfied           shared in P
--   K7  P: claimed, nobody judged    Q: claimed, satisfied           not assessed in P
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_base uuid; v_k uuid[]; v_selected integer;
  v_definition uuid := gen_random_uuid(); v_library uuid := gen_random_uuid();
  v_unit_p uuid := gen_random_uuid(); v_unit_kit uuid := gen_random_uuid(); v_unit_q uuid := gen_random_uuid();
  v_product_p uuid := gen_random_uuid(); v_product_q uuid := gen_random_uuid();
  v_revision_p uuid := gen_random_uuid(); v_revision_q uuid := gen_random_uuid();
  v_core_p uuid := gen_random_uuid(); v_kit_p uuid := gen_random_uuid(); v_core_q uuid := gen_random_uuid();
  v_config_p uuid := gen_random_uuid(); v_config_q uuid := gen_random_uuid();
  v_assessment_p uuid := gen_random_uuid(); v_assessment_q uuid := gen_random_uuid(); v_later uuid := gen_random_uuid();
  v_profile uuid := gen_random_uuid(); v_created jsonb; v_program uuid; v_variant_p uuid; v_kit_system public.systems;
  v_ssp uuid; v_part uuid; v_campaign uuid := gen_random_uuid(); v_plan uuid := gen_random_uuid();
  v_results uuid := gen_random_uuid(); v_set uuid;
  v_answer jsonb; v_totals jsonb; v_line jsonb;
begin
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) >= 8
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the checks of a program that takes products were skipped';
    return;
  end if;
  select count(distinct sc.control_id) into v_selected from public.selected_controls sc where sc.profile_resolution_id = v_base;
  -- Seven controls of the baseline, each with a part an assessor can judge.
  select array_agg(x.control_id order by x.code_order) into v_k
  from (
    select distinct sc.control_id, k.code_order
    from public.selected_controls sc
    join public.catalog_control_rows k on k.id = sc.control_id
    where sc.profile_resolution_id = v_base
      and exists (select 1 from public.control_parts p where p.control_id = sc.control_id)
    order by k.code_order limit 7
  ) x;
  if coalesce(cardinality(v_k), 0) < 7 then
    raise notice 'The baseline has no seven controls with parts: the checks of a program that takes products were skipped';
    return;
  end if;

  -- The library behind the products, published before a product element is pinned to it.
  insert into public.component_definitions(id, tenant_id, code, name) values (v_definition, v_tenant, 'cs-units', 'Control status units');
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values (v_library, v_tenant, v_definition, 1);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values
    (v_unit_p, v_tenant, v_library, 'P unit', 'software'),
    (v_unit_kit, v_tenant, v_library, 'P kit unit', 'hardware'),
    (v_unit_q, v_tenant, v_library, 'Q unit', 'software');
  insert into public.defined_component_implementations(tenant_id, component_definition_revision_id, defined_component_id, control_id, description, implementation_status, coverage, consumer_responsibility)
  select v_tenant, v_library, c.unit, c.control, 'The unit enforces it.', 'implemented', c.coverage, c.owed
  from (values
    (v_unit_p, v_k[1], 'full', null), (v_unit_p, v_k[2], 'full', null), (v_unit_p, v_k[3], 'full', null),
    (v_unit_p, v_k[4], 'full', null), (v_unit_kit, v_k[5], 'full', null),
    (v_unit_p, v_k[6], 'partial', 'The consumer sets the values.'), (v_unit_p, v_k[7], 'full', null),
    (v_unit_q, v_k[1], 'full', null), (v_unit_q, v_k[2], 'full', null), (v_unit_q, v_k[4], 'full', null),
    (v_unit_q, v_k[5], 'full', null), (v_unit_q, v_k[6], 'full', null), (v_unit_q, v_k[7], 'full', null)
  ) c(unit, control, coverage, owed);
  update public.component_definition_revisions set state = 'published', revision = revision + 1 where id = v_library;

  -- Two products, one published version each: P with a core element and a kit, Q with a core.
  insert into public.products(id, tenant_id, code, name) values
    (v_product_p, v_tenant, 'CS-P', 'Control status product P'), (v_product_q, v_tenant, 'CS-Q', 'Control status product Q');
  insert into public.product_revisions(id, tenant_id, product_id, version_number) values
    (v_revision_p, v_tenant, v_product_p, 1), (v_revision_q, v_tenant, v_product_q, 1);
  insert into public.product_elements(id, tenant_id, product_revision_id, code, name, element_type, defined_component_id, position) values
    (v_core_p, v_tenant, v_revision_p, 'CORE', 'P core', 'software', v_unit_p, 0),
    (v_kit_p, v_tenant, v_revision_p, 'KIT', 'P kit', 'hardware', v_unit_kit, 1),
    (v_core_q, v_tenant, v_revision_q, 'CORE', 'Q core', 'software', v_unit_q, 0);
  insert into public.product_configurations(id, tenant_id, product_id, code, name) values
    (v_config_p, v_tenant, v_product_p, 'A', 'Configuration A'), (v_config_q, v_tenant, v_product_q, 'S', 'Standard');
  insert into public.product_configuration_elements(tenant_id, product_revision_id, product_configuration_id, product_element_id) values
    (v_tenant, v_revision_p, v_config_p, v_core_p), (v_tenant, v_revision_p, v_config_p, v_kit_p),
    (v_tenant, v_revision_q, v_config_q, v_core_q);
  update public.product_revisions set state = 'published', revision = revision + 1 where id in (v_revision_p, v_revision_q);

  -- The program, with one variant of each product as the product delivers it.
  v_created := public.create_program_wizard(v_tenant, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', 'CS-PRODUCTS', 'name', 'Control status products test', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb,
    'catalogRevisionId', v_catalog,
    'profiles', jsonb_build_array(jsonb_build_object(
      'key', v_profile, 'baseResolutionId', v_base, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)),
    'systems', (select jsonb_agg(jsonb_build_object(
        'key', gen_random_uuid(), 'code', s.code, 'name', s.code || ' variant', 'description', '',
        'type', 'platform', 'ownerPartyId', null,
        'confidentiality', 'low', 'integrity', 'low', 'availability', 'low',
        'categorizationRationale', 'A limited impact boundary for a rollback test.',
        'profileKey', v_profile,
        'product', jsonb_build_object('revisionId', s.revision, 'configurationId', s.configuration),
        'elements', s.elements) order by s.code)
      from (values
        ('CSP-P', v_revision_p, v_config_p, jsonb_build_array(
          jsonb_build_object('key', gen_random_uuid(), 'parentKey', null, 'code', 'CSP-P-CORE', 'name', 'P core', 'description', '',
            'type', null, 'productElementId', v_core_p,
            'library', jsonb_build_object('revisionId', v_library, 'definedComponentId', v_unit_p, 'rationale', 'Inherited from P.')),
          jsonb_build_object('key', gen_random_uuid(), 'parentKey', null, 'code', 'CSP-P-KIT', 'name', 'P kit', 'description', '',
            'type', null, 'productElementId', v_kit_p,
            'library', jsonb_build_object('revisionId', v_library, 'definedComponentId', v_unit_kit, 'rationale', 'Inherited from P.')))),
        ('CSP-Q', v_revision_q, v_config_q, jsonb_build_array(
          jsonb_build_object('key', gen_random_uuid(), 'parentKey', null, 'code', 'CSP-Q-CORE', 'name', 'Q core', 'description', '',
            'type', null, 'productElementId', v_core_q,
            'library', jsonb_build_object('revisionId', v_library, 'definedComponentId', v_unit_q, 'rationale', 'Inherited from Q.'))))
      ) s(code, revision, configuration, elements))));
  v_program := (v_created->>'programId')::uuid;
  select s.id into v_variant_p from public.systems s where s.tenant_id = v_tenant and s.code = 'CSP-P';
  if (select count(*) from public.systems s where s.program_id = v_program and s.product_configuration_id is not null) <> 2 then
    raise exception 'The program was not set up with two variants';
  end if;

  -- K5 is mapped by a requirement that cites evidence, so the ladder under it says not assessed.
  insert into public.engineering_requirements(id, tenant_id, program_id, code) values
    ('c5720000-0000-0000-0000-000000000011', v_tenant, v_program, 'REQ-KIT');
  insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type) values
    ('c5730000-0000-0000-0000-000000000011', v_tenant, 'c5720000-0000-0000-0000-000000000011', 1, 'The kit does it', 'The kit does the fifth thing.', 'It is recorded.', 'functional');
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type) values
    (v_tenant, 'c5730000-0000-0000-0000-000000000011', v_k[5], 'satisfies');
  insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind, program_id) values
    ('c5740000-0000-0000-0000-000000000011', v_tenant, 'Rollback kit report', 'document', v_program);
  insert into public.evidence_versions(id, tenant_id, artifact_id, version_number, state, external_uri) values
    ('c5750000-0000-0000-0000-000000000011', v_tenant, 'c5740000-0000-0000-0000-000000000011', 1, 'published', 'https://example.test/evidence/kit');
  insert into public.requirement_evidence(tenant_id, requirement_revision_id, evidence_version_id) values
    (v_tenant, 'c5730000-0000-0000-0000-000000000011', 'c5750000-0000-0000-0000-000000000011');

  -- Each product assessed once, against the program's baseline.
  insert into public.product_assessments(id, tenant_id, product_revision_id, profile_resolution_id, title) values
    (v_assessment_p, v_tenant, v_revision_p, v_base, 'P version 1 product assessment'),
    (v_assessment_q, v_tenant, v_revision_q, v_base, 'Q version 1 product assessment');
  insert into public.product_determinations(tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination)
  select v_tenant, d.assessment, d.revision, d.element, d.control, d.determination
  from (values
    (v_assessment_p, v_revision_p, v_core_p, v_k[1], 'satisfied'), (v_assessment_p, v_revision_p, v_core_p, v_k[2], 'satisfied'),
    (v_assessment_p, v_revision_p, v_core_p, v_k[3], 'satisfied'), (v_assessment_p, v_revision_p, v_core_p, v_k[4], 'satisfied'),
    (v_assessment_p, v_revision_p, v_kit_p, v_k[5], 'satisfied'), (v_assessment_p, v_revision_p, v_core_p, v_k[6], 'satisfied'),
    (v_assessment_q, v_revision_q, v_core_q, v_k[1], 'satisfied'), (v_assessment_q, v_revision_q, v_core_q, v_k[2], 'partially_satisfied'),
    (v_assessment_q, v_revision_q, v_core_q, v_k[4], 'satisfied'), (v_assessment_q, v_revision_q, v_core_q, v_k[5], 'satisfied'),
    (v_assessment_q, v_revision_q, v_core_q, v_k[6], 'satisfied'), (v_assessment_q, v_revision_q, v_core_q, v_k[7], 'satisfied')
  ) d(assessment, revision, element, control, determination);

  -- While the assessments are drafts they decide nothing: every control keeps the program's ladder.
  v_answer := public.program_control_status(v_program);
  if exists (select 1 from jsonb_array_elements(v_answer->'controls') c
      where c->>'determined_by' is not null or c->'product_assessments' <> '[]'::jsonb)
    or pg_temp.line(v_answer, v_k[1])->>'status' <> 'no_requirement'
    or pg_temp.line(v_answer, v_k[5])->>'status' <> 'not_assessed' then
    raise exception 'A draft product assessment decided a control: K1 %, K5 %', pg_temp.line(v_answer, v_k[1]), pg_temp.line(v_answer, v_k[5]);
  end if;

  update public.product_assessments set state = 'published', revision = revision + 1 where id in (v_assessment_p, v_assessment_q);
  v_answer := public.program_control_status(v_program);
  -- K1: both variants inherit it satisfied. It is the product's, and names both assessments in
  -- the order the program took the variants.
  v_line := pg_temp.line(v_answer, v_k[1]);
  if v_line->>'status' <> 'satisfied' or v_line->>'determined_by' <> 'product'
    or v_line->'product_assessments' <> jsonb_build_array(
      jsonb_build_object('id', v_assessment_p, 'title', 'P version 1 product assessment', 'determination', 'satisfied'),
      jsonb_build_object('id', v_assessment_q, 'title', 'Q version 1 product assessment', 'determination', 'satisfied'))
    or v_line->'requirements' <> '0'::jsonb then
    raise exception 'A control both variants inherit satisfied read %', v_line;
  end if;
  -- K2: the worst of the two variants', and the assessment that decided it first.
  v_line := pg_temp.line(v_answer, v_k[2]);
  if v_line->>'status' <> 'partially_satisfied' or v_line->>'determined_by' <> 'product'
    or (v_line->'product_assessments'->0->>'id')::uuid <> v_assessment_q
    or v_line->'product_assessments'->0->>'determination' <> 'partially_satisfied'
    or (v_line->'product_assessments'->1->>'id')::uuid <> v_assessment_p
    or jsonb_array_length(v_line->'product_assessments') <> 2 then
    raise exception 'A control the variants inherit at two determinations read %', v_line;
  end if;
  -- K3, K6, K7: one variant does not inherit a determination (program only in Q, shared in P,
  -- claimed and not judged in P), so the program's own ladder stands.
  if exists (select 1 from unnest(array[v_k[3], v_k[6], v_k[7]]) k
      where pg_temp.line(v_answer, k)->>'status' <> 'no_requirement'
        or pg_temp.line(v_answer, k)->'determined_by' <> 'null'::jsonb
        or pg_temp.line(v_answer, k)->'product_assessments' <> '[]'::jsonb) then
    raise exception 'A control one variant does not inherit read K3 %, K6 %, K7 %', pg_temp.line(v_answer, v_k[3]),
      pg_temp.line(v_answer, v_k[6]), pg_temp.line(v_answer, v_k[7]);
  end if;
  -- K4 and K5 are the product's too, until the program judges one and changes the other.
  if pg_temp.line(v_answer, v_k[4])->>'determined_by' <> 'product' or pg_temp.line(v_answer, v_k[5])->>'status' <> 'satisfied'
    or pg_temp.line(v_answer, v_k[5])->>'determined_by' <> 'product' then
    raise exception 'Inherited controls read K4 %, K5 %', pg_temp.line(v_answer, v_k[4]), pg_temp.line(v_answer, v_k[5]);
  end if;

  -- The program's own published determination still wins over the product's.
  select p.id into v_part from public.control_parts p where p.control_id = v_k[4] order by p.ordinal, p.id limit 1;
  select r.id into v_ssp from public.ssp_revisions r where r.system_id = v_variant_p order by r.version_number limit 1;
  update public.ssp_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_ssp and state <> 'published';
  insert into public.assessment_campaigns(id, tenant_id, title, program_id) values (v_campaign, v_tenant, 'Products test campaign', v_program);
  insert into public.assessment_plan_revisions(id, tenant_id, version_number, campaign_id, ssp_revision_id, title)
    values (v_plan, v_tenant, 1, v_campaign, v_ssp, 'Products test plan');
  update public.assessment_plan_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_plan;
  insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title)
    values (v_results, v_tenant, 1, v_plan, 'Products test results');
  insert into public.result_sets(tenant_id, assessment_results_revision_id, title) values (v_tenant, v_results, 'Products test set') returning id into v_set;
  insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at)
    values (v_tenant, v_results, v_set, v_part, 'K4, judged in the program', 'other_than_satisfied', now());
  update public.assessment_results_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_results;

  -- A modified element: the control behind it is changed here in P, so the ladder stands under it.
  select * into v_kit_system from public.systems where tenant_id = v_tenant and code = 'CSP-P-KIT';
  perform public.declare_product_element_change(v_tenant, v_kit_system.id, v_kit_system.revision, array['firmware'], 'The program loads its own firmware.');

  -- A later assessment of P's version, left in draft, decides nothing either.
  insert into public.product_assessments(id, tenant_id, product_revision_id, profile_resolution_id, title)
    values (v_later, v_tenant, v_revision_p, v_base, 'P version 1 reassessment');
  insert into public.product_determinations(tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination)
    values (v_tenant, v_later, v_revision_p, v_core_p, v_k[1], 'other_than_satisfied');

  v_answer := public.program_control_status(v_program);
  v_totals := v_answer->'totals';
  v_line := pg_temp.line(v_answer, v_k[4]);
  if v_line->>'status' <> 'other_than_satisfied' or v_line->>'determined_by' <> 'program'
    or v_line->'product_assessments' <> '[]'::jsonb then
    raise exception 'The program''s own determination did not win: %', v_line;
  end if;
  v_line := pg_temp.line(v_answer, v_k[5]);
  if v_line->>'status' <> 'not_assessed' or v_line->'determined_by' <> 'null'::jsonb
    or v_line->'product_assessments' <> '[]'::jsonb or v_line->'evidenced' <> '1'::jsonb then
    raise exception 'A control behind a modified element read %', v_line;
  end if;
  if pg_temp.line(v_answer, v_k[1])->>'status' <> 'satisfied'
    or (pg_temp.line(v_answer, v_k[1])->'product_assessments'->0->>'id')::uuid <> v_assessment_p then
    raise exception 'A draft reassessment decided a control: %', pg_temp.line(v_answer, v_k[1]);
  end if;
  -- Every control stands at one status, and the totals add up to the baseline.
  if (v_totals->>'controls')::integer <> v_selected or jsonb_array_length(v_answer->'controls') <> v_selected
    or (v_totals->>'satisfied')::integer <> 1 or (v_totals->>'partially_satisfied')::integer <> 1
    or (v_totals->>'other_than_satisfied')::integer <> 1 or (v_totals->>'not_assessed')::integer <> 1
    or (v_totals->>'no_evidence')::integer <> 0 or (v_totals->>'no_requirement')::integer <> v_selected - 4
    or (select sum(value::integer) from jsonb_each_text(v_totals) where key <> 'controls') <> v_selected
    or (select count(*) from jsonb_array_elements(v_answer->'controls') c where c->>'determined_by' = 'product') <> 2 then
    raise exception 'The totals of a program that takes products do not add up: %', v_totals;
  end if;

  -- A viewer of the workspace reads the same answer.
  insert into public.tenant_memberships(tenant_id, user_id, role)
  select v_tenant, 'c5700000-0000-0000-0000-000000000002', 'viewer'
  where not exists (select 1 from public.tenant_memberships m
    where m.tenant_id = v_tenant and m.user_id = 'c5700000-0000-0000-0000-000000000002');
  perform set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000002', true);
  if public.program_control_status(v_program) is distinct from v_answer then
    raise exception 'A viewer read another answer of a program that takes products';
  end if;
  perform set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000001', true);
  raise notice 'The checks of a program that takes products ran against the pinned references';
end $$;

reset role;
rollback;
select 'Program control status: privileges, refusal, a program with no baseline, the ladder a control climbs and the determinations a program takes from its products passed.' as result;
