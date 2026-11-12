-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- One status for each control of a program's control baseline: who may ask, what a program with no
-- baseline answers and, with the pinned references installed (a catalog and a reference baseline),
-- how a control climbs the ladder: no requirement, no evidence, not assessed, and the worst of the
-- latest determinations an assessor published on its parts. What does not count is checked beside
-- it: another program's requirement, another program's campaign and a draft result.
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

reset role;
rollback;
select 'Program control status: privileges, refusal, a program with no baseline and the ladder a control climbs passed.' as result;
