-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- One status for each control of a program's control baseline: who may ask, what a program with no
-- baseline answers and, with the pinned references installed (a catalog and a reference baseline),
-- how a control climbs the ladder: no requirement, no evidence, not assessed, and the worst of its
-- objectives' determinations, each the latest an assessor published on it, on an objective above it
-- or on its statement. What does not count is checked beside
-- it: another program's requirement, another program's campaign and a draft result. Then a program
-- that takes two products: a control every variant inherits with a determination takes the
-- product's, the worst of the two, and names the product assessments it was taken from; the
-- program's own determination still wins; a control one variant does not inherit (program only,
-- shared, changed here, or claimed and not judged) keeps the program's ladder; and a draft product
-- assessment decides nothing. Last, objective-level derivation: a control whose requirements map
-- some of its assessment objectives stays no requirement, a mapped heading covers the objectives
-- under it, a whole-control mapping covers them all, evidence counts per objective, the read of one
-- control's objectives answers the same, a mapping naming another control's objective or an
-- assessment method is refused, and so is a reader of another workspace. And a heading that prints
-- a sentence of its own counts on its own: the rule finds the nine SP 800-53A prints, a control
-- whose leaves are all mapped without such a heading stays no requirement, the heading covers
-- itself and every objective under it, the read of the control's objectives lists it before them,
-- and the catalog control's table (control_objective_counts) counts as the status does. Last, every
-- system counts: a control, and each objective it counts, is covered only once it is covered on
-- every system of the program whose control baseline selects it, an element's mapping counting on
-- its boundary, a mapping that names no system on every one, evidence system by system, and a
-- control no system selects by any mapping; the read of one control's objectives says each
-- system's standing, how many requirements are allocated there and which requirement owes evidence.
-- Last, not assessed until all: the program's assessors decide a control once they have judged
-- every objective it counts, a determination on an objective judging it and every objective under
-- it and one on the statement judging them all; a control judged in part reads the ladder, with no
-- one's determination, and says how many of its objectives are judged. Last, latest per objective:
-- the newest of the determinations that judge an objective decides it, a newer objective's over an
-- older statement's and a newer statement's over older objectives', a heading's over the older ones
-- under it, at one moment the nearer part's, and not assessed or a draft nothing.
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
  -- One control's objectives, and the coverage both reads count from: a member's, as themselves.
  if has_function_privilege('anon', 'public.program_control_objectives(uuid, uuid)', 'execute')
    or has_function_privilege('public', 'public.program_control_objectives(uuid, uuid)', 'execute')
    or has_function_privilege('anon', 'public.program_control_objective_cover(uuid, uuid[])', 'execute')
    or has_function_privilege('public', 'public.program_control_objective_cover(uuid, uuid[])', 'execute') then
    raise exception 'An anonymous session may read a control''s objectives';
  end if;
  if not has_function_privilege('authenticated', 'public.program_control_objectives(uuid, uuid)', 'execute') then
    raise exception 'A signed-in session may not execute program_control_objectives';
  end if;
  if exists (select 1 from pg_catalog.pg_proc p where p.prosecdef and p.oid in (
      'public.program_control_objectives(uuid, uuid)'::regprocedure,
      'public.program_control_objective_cover(uuid, uuid[])'::regprocedure,
      'public.program_control_objective_judgments(uuid, uuid[])'::regprocedure,
      'public.program_control_status_lines(uuid)'::regprocedure)) then
    raise exception 'A read of a control''s objectives does not run as its caller';
  end if;
  -- What the program's assessors have judged of a control: a member's, as themselves.
  if has_function_privilege('anon', 'public.program_control_objective_judgments(uuid, uuid[])', 'execute')
    or has_function_privilege('public', 'public.program_control_objective_judgments(uuid, uuid[])', 'execute')
    or not has_function_privilege('authenticated', 'public.program_control_objective_judgments(uuid, uuid[])', 'execute') then
    raise exception 'program_control_objective_judgments is not a signed-in member''s read';
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

-- The read of one control's objectives refuses the same readers, and a control left unnamed. A
-- program with no control baseline still answers a control's objectives, none of them mapped.
select pg_temp.expect_error($$select public.program_control_objectives('c5710000-0000-0000-0000-00000000dead', (select id from public.controls limit 1))$$, '42501');
select pg_temp.expect_error($$select public.program_control_objectives('c5710000-0000-0000-0000-000000000001', null)$$, '42501');
select pg_temp.expect_error($$select * from public.program_control_objective_cover('c5710000-0000-0000-0000-00000000dead', array[]::uuid[])$$, '42501');
select pg_temp.expect_error($$select * from public.program_control_objective_judgments('c5710000-0000-0000-0000-00000000dead', array[]::uuid[])$$, '42501');
do $$
declare v_control uuid; v_answer jsonb;
begin
  select cp.control_id into v_control from public.control_parts cp
  where cp.name = 'assessment-objective' order by cp.control_id limit 1;
  if v_control is null then return; end if;
  v_answer := public.program_control_objectives('c5710000-0000-0000-0000-000000000001', v_control);
  if jsonb_array_length(v_answer->'objectives') = 0
    or exists (select 1 from jsonb_array_elements(v_answer->'objectives') o
      where (o->>'mapped')::boolean or (o->>'evidenced')::boolean or o->'mapped_on' <> '[]'::jsonb)
    or v_answer->'requirements' <> '[]'::jsonb or v_answer->'systems' <> '[]'::jsonb then
    raise exception 'A program with no requirement answered a control''s objectives as %', v_answer;
  end if;
end $$;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$select public.program_control_objectives('c5710000-0000-0000-0000-000000000001', (select id from public.controls limit 1))$$, '42501');
set local role anon;
select pg_temp.expect_error($$select public.program_control_objectives('c5710000-0000-0000-0000-000000000001', (select id from public.controls limit 1))$$, '42501');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000002', true);
select pg_temp.expect_error($$select public.program_control_objectives('c5710000-0000-0000-0000-000000000001', (select id from public.controls limit 1))$$, '42501');
select pg_temp.expect_error($$select * from public.program_control_objective_cover('c5710000-0000-0000-0000-000000000001', array[]::uuid[])$$, '42501');
select pg_temp.expect_error($$select * from public.program_control_objective_judgments('c5710000-0000-0000-0000-000000000001', array[]::uuid[])$$, '42501');
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

  -- Three controls of the baseline that each have a statement and a root assessment objective: an
  -- assessor's determination on either judges the whole control, every objective it counts.
  select (array_agg(x.control_id order by x.code_order))[1], (array_agg(x.control_id order by x.code_order))[2],
    (array_agg(x.control_id order by x.code_order))[3]
  into v_a, v_b, v_c
  from (
    select distinct sc.control_id, k.code_order
    from public.program_reference_choices c
    join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
    join public.catalog_control_rows k on k.id = sc.control_id
    where c.program_id = v_program
      and exists (select 1 from public.control_parts p
        where p.control_id = sc.control_id and p.parent_part_id is null and p.name = 'statement')
      and exists (select 1 from public.control_parts p
        where p.control_id = sc.control_id and p.parent_part_id is null and p.name = 'assessment-objective')
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

  -- An assessor's determinations, on parts that judge the whole control: each control's statement,
  -- and B's root objective, above every objective B counts. The plan stands on a published system
  -- security plan, and results on a published plan.
  select p.id into v_part_a from public.control_parts p
    where p.control_id = v_a and p.parent_part_id is null and p.name = 'statement' order by p.ordinal, p.id limit 1;
  select p.id into v_part_b from public.control_parts p
    where p.control_id = v_b and p.parent_part_id is null and p.name = 'statement' order by p.ordinal, p.id limit 1;
  select p.id into v_part_b2 from public.control_parts p
    where p.control_id = v_b and p.parent_part_id is null and p.name = 'assessment-objective' order by p.ordinal, p.id limit 1;
  select p.id into v_part_c from public.control_parts p
    where p.control_id = v_c and p.parent_part_id is null and p.name = 'statement' order by p.ordinal, p.id limit 1;
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

  -- Second results, later: B's root objective partially satisfied, newer than its statement's
  -- determination, so it decides every objective of B; A other than satisfied, whatever it holds;
  -- and C satisfied in a result left in draft.
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
  -- A determination on the statement or the root objective judges every objective the control
  -- counts; a control nobody judged has none judged.
  if exists (select 1 from jsonb_array_elements(v_answer->'controls') c
      where (c->>'objectives_assessed')::integer
        <> case when c->>'id' in (v_a::text, v_b::text) then (c->>'objectives')::integer else 0 end) then
    raise exception 'The objectives judged read A %, B %', pg_temp.line(v_answer, v_a), pg_temp.line(v_answer, v_b);
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
  v_ssp uuid; v_part uuid; v_k1_leaf uuid; v_campaign uuid := gen_random_uuid(); v_plan uuid := gen_random_uuid();
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
  -- Seven controls of the baseline, each with a statement an assessor can judge it on.
  select array_agg(x.control_id order by x.code_order) into v_k
  from (
    select distinct sc.control_id, k.code_order
    from public.selected_controls sc
    join public.catalog_control_rows k on k.id = sc.control_id
    where sc.profile_resolution_id = v_base
      and exists (select 1 from public.control_parts p
        where p.control_id = sc.control_id and p.parent_part_id is null and p.name = 'statement')
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

  -- The program's own published determination still wins over the product's, once it judges every
  -- objective the control counts: one on its statement does.
  select p.id into v_part from public.control_parts p
    where p.control_id = v_k[4] and p.parent_part_id is null and p.name = 'statement' order by p.ordinal, p.id limit 1;
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
  -- K1 judged on one of its objectives alone: the program has no determination of it yet, so the
  -- product's still decides.
  select o.id into v_k1_leaf from public.control_parts o
    where o.control_id = v_k[1] and o.name = 'assessment-objective'
      and not exists (select 1 from public.control_parts g where g.parent_part_id = o.id and g.name = 'assessment-objective')
    order by o.source_pointer limit 1;
  if v_k1_leaf is not null then
    insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at)
      values (v_tenant, v_results, v_set, v_k1_leaf, 'K1, one objective judged in the program', 'other_than_satisfied', now());
  end if;
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
  -- K1, judged by the program on one objective of the several it counts, is still the product's,
  -- and says the one objective judged; K4, judged on its statement, has every objective judged.
  v_line := pg_temp.line(v_answer, v_k[1]);
  if v_k1_leaf is not null and (v_line->>'objectives')::integer > 1
    and (v_line->>'determined_by' <> 'product' or v_line->>'status' <> 'satisfied'
      or v_line->'objectives_assessed' <> '1'::jsonb) then
    raise exception 'A program''s determination on one objective of an inherited control decided it: %', v_line;
  end if;
  if pg_temp.line(v_answer, v_k[4])->'objectives_assessed' <> pg_temp.line(v_answer, v_k[4])->'objectives' then
    raise exception 'A determination on the statement did not judge every objective: %', pg_temp.line(v_answer, v_k[4]);
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

-- ---------------------------------------------------------------------------------------------
-- Objective-level derivation. A control counts its leaf assessment objectives (no objective under
-- them); a mapping covers the objective it names and every objective under it, and one that names
-- no part covers the whole control. A control whose requirements map only some of its objectives
-- stays no requirement, and it leaves no evidence only once every objective is covered by a
-- requirement that cites evidence.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_base uuid; v_program uuid;
  v_control uuid; v_heading uuid; v_under uuid[]; v_leaves uuid[]; v_rest uuid[];
  v_other uuid; v_other_objective uuid; v_method uuid; v_leaf uuid;
  v_answer jsonb; v_line jsonb; v_read jsonb;
begin
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) >= 3
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the objective checks were skipped';
    return;
  end if;
  v_program := pg_temp.program('CS-OBJECTIVES', v_catalog, v_base);

  -- A control of the baseline whose objectives nest: a heading over two leaves or more, with a
  -- leaf of the control outside it, and no heading that prints a sentence of its own (those count
  -- on their own, checked after this).
  select x.control_id, x.heading into v_control, v_heading
  from (
    select sc.control_id, h.id as heading, k.code_order, h.source_pointer
    from public.program_reference_choices c
    join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
    join public.catalog_control_rows k on k.id = sc.control_id
    join public.control_parts h on h.control_id = sc.control_id and h.name = 'assessment-objective'
      and h.parent_part_id is not null
    where c.program_id = v_program
      and (select count(*) from public.control_parts u where u.parent_part_id = h.id and u.name = 'assessment-objective'
        and not exists (select 1 from public.control_parts g where g.parent_part_id = u.id and g.name = 'assessment-objective')) >= 2
      and not exists (select 1 from public.control_parts u join public.control_parts g on g.parent_part_id = u.id
        where u.parent_part_id = h.id and g.name = 'assessment-objective')
      and not exists (select 1 from public.control_parts s
        where s.control_id = sc.control_id and s.name = 'assessment-objective'
          and exists (select 1 from public.control_parts u where u.parent_part_id = s.id and u.name = 'assessment-objective')
          and public.objective_prints_own_sentence(s.prose))
  ) x
  order by x.code_order, x.source_pointer limit 1;
  if v_control is null then
    raise notice 'The baseline has no control whose objectives nest: the objective checks were skipped';
    return;
  end if;
  select array_agg(u.id order by u.ordinal, u.id) into v_under
  from public.control_parts u where u.parent_part_id = v_heading and u.name = 'assessment-objective';
  select array_agg(o.id order by o.source_pointer) into v_leaves
  from public.control_parts o
  where o.control_id = v_control and o.name = 'assessment-objective'
    and not exists (select 1 from public.control_parts g where g.parent_part_id = o.id and g.name = 'assessment-objective');
  select array_agg(l order by l) into v_rest from unnest(v_leaves) l where l <> all(v_under);
  -- Another control of the baseline, with its own objectives, and an assessment method of this one.
  select sc.control_id into v_other
  from public.program_reference_choices c
  join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
  where c.program_id = v_program and sc.control_id <> v_control
    and exists (select 1 from public.control_parts o where o.control_id = sc.control_id and o.name = 'assessment-objective')
  order by sc.control_id limit 1;
  select o.id into v_other_objective from public.control_parts o
  where o.control_id = v_other and o.name = 'assessment-objective' order by o.source_pointer desc limit 1;
  select p.id into v_method from public.control_parts p where p.control_id = v_control and p.name = 'assessment-method' limit 1;
  if coalesce(cardinality(v_rest), 0) = 0 or v_other_objective is null then
    raise notice 'The control has no objective outside its heading: the objective checks were skipped';
    return;
  end if;

  insert into public.engineering_requirements(id, tenant_id, program_id, code) values
    ('c5720000-0000-0000-0000-000000000021', v_tenant, v_program, 'REQ-HEADING'),
    ('c5720000-0000-0000-0000-000000000022', v_tenant, v_program, 'REQ-REST'),
    ('c5720000-0000-0000-0000-000000000023', v_tenant, v_program, 'REQ-WHOLE');
  insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type) values
    ('c5730000-0000-0000-0000-000000000021', v_tenant, 'c5720000-0000-0000-0000-000000000021', 1, 'Meets a heading', 'The system does what the heading asks.', 'It is recorded.', 'functional'),
    ('c5730000-0000-0000-0000-000000000022', v_tenant, 'c5720000-0000-0000-0000-000000000022', 1, 'Meets the rest', 'The system does the rest.', 'It is recorded.', 'functional'),
    ('c5730000-0000-0000-0000-000000000023', v_tenant, 'c5720000-0000-0000-0000-000000000023', 1, 'Meets another control', 'The system does all of it.', 'It is recorded.', 'functional');

  -- A mapping names an objective of the control it maps, never another control's; an assessment
  -- method is not a target either.
  perform pg_temp.expect_error(format(
    $f$insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, control_part_id, relationship_type)
       values (%L, 'c5730000-0000-0000-0000-000000000021', %L, %L, 'maps_to')$f$, v_tenant, v_control, v_other_objective), '23514');
  if v_method is not null then
    perform pg_temp.expect_error(format(
      $f$insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, control_part_id, relationship_type)
         values (%L, 'c5730000-0000-0000-0000-000000000021', %L, %L, 'maps_to')$f$, v_tenant, v_control, v_method), '23514');
  end if;

  -- The heading alone: it covers the objectives under it, and the control stays no requirement.
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, control_part_id, relationship_type)
    values (v_tenant, 'c5730000-0000-0000-0000-000000000021', v_control, v_heading, 'maps_to');
  v_answer := public.program_control_status(v_program);
  v_line := pg_temp.line(v_answer, v_control);
  if v_line->>'status' <> 'no_requirement' or v_line->'requirements' <> '1'::jsonb
    or (v_line->>'objectives')::integer <> cardinality(v_leaves)
    or (v_line->>'objectives_mapped')::integer <> cardinality(v_under)
    or v_line->'objectives_evidenced' <> '0'::jsonb then
    raise exception 'A control mapped at one heading read % (% objectives, % under the heading)', v_line, cardinality(v_leaves), cardinality(v_under);
  end if;
  -- The read of the control's objectives answers the same, objective by objective, in the
  -- catalog's reading order, each with its label, its text and the objectives above it.
  v_read := public.program_control_objectives(v_program, v_control);
  if jsonb_array_length(v_read->'objectives') <> cardinality(v_leaves)
    or exists (select 1 from jsonb_array_elements(v_read->'objectives') o
      where ((o->>'id')::uuid = any(v_under)) <> (o->>'mapped')::boolean
        or (o->>'evidenced')::boolean
        or nullif(o->>'label', '') is null or nullif(o->>'prose', '') is null
        or ((o->>'id')::uuid = any(v_under)) <> (o->'ancestors' ? v_heading::text)
        -- A mapping that names no system counts on the program's one system.
        or ((o->>'mapped')::boolean and o->'mapped_on' <> (
          select jsonb_agg(s.id) from public.systems s where s.program_id = v_program and s.is_authorization_boundary))
        or (not (o->>'mapped')::boolean and o->'mapped_on' <> '[]'::jsonb))
    -- The requirement that covers what is covered, citing no evidence, owes it.
    or v_read->'requirements' <> jsonb_build_array(jsonb_build_object(
      'id', 'c5720000-0000-0000-0000-000000000021', 'code', 'REQ-HEADING', 'evidenced', false, 'owes', true))
    or jsonb_array_length(v_read->'systems') <> 1
    or (v_read->'systems'->0->>'objectives_mapped')::integer <> cardinality(v_under)
    or (v_read->'systems'->0->>'mapped')::boolean then
    raise exception 'The objectives of a control mapped at one heading read %', v_read;
  end if;
  if (select array_agg((o->>'id')::uuid order by n) from jsonb_array_elements(v_read->'objectives') with ordinality t(o, n))
    is distinct from (
      with recursive place(id, path) as (
        select p.id, array[p.ordinal] from public.control_parts p
        where p.control_id = v_control and p.name = 'assessment-objective' and p.parent_part_id is null
        union all
        select p.id, pl.path || p.ordinal from public.control_parts p join place pl on p.parent_part_id = pl.id
        where p.name = 'assessment-objective')
      select array_agg(pl.id order by pl.path, pl.id) from place pl where pl.id = any(v_leaves)) then
    raise exception 'The objectives are not in the catalog''s reading order: %', v_read->'objectives';
  end if;

  -- Every other objective, one mapping each: the control is covered and leaves no requirement,
  -- and with no evidence anywhere it reads no evidence.
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, control_part_id, relationship_type)
  select v_tenant, 'c5730000-0000-0000-0000-000000000022', v_control, l, 'satisfies' from unnest(v_rest) l;
  v_line := pg_temp.line(public.program_control_status(v_program), v_control);
  if v_line->>'status' <> 'no_evidence' or v_line->'requirements' <> '2'::jsonb
    or (v_line->>'objectives_mapped')::integer <> cardinality(v_leaves) or v_line->'objectives_evidenced' <> '0'::jsonb then
    raise exception 'A control whose objectives are all mapped read %', v_line;
  end if;

  -- Evidence counts per objective: the heading's requirement cites evidence, the rest's does not,
  -- so the control still reads no evidence, with the objectives under the heading evidenced.
  insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind, program_id) values
    ('c5740000-0000-0000-0000-000000000021', v_tenant, 'Rollback objective report', 'document', v_program);
  insert into public.evidence_versions(id, tenant_id, artifact_id, version_number, state, external_uri) values
    ('c5750000-0000-0000-0000-000000000021', v_tenant, 'c5740000-0000-0000-0000-000000000021', 1, 'published', 'https://example.test/evidence/objectives');
  insert into public.requirement_evidence(tenant_id, requirement_revision_id, evidence_version_id) values
    (v_tenant, 'c5730000-0000-0000-0000-000000000021', 'c5750000-0000-0000-0000-000000000021');
  v_line := pg_temp.line(public.program_control_status(v_program), v_control);
  if v_line->>'status' <> 'no_evidence' or v_line->'evidenced' <> '1'::jsonb
    or (v_line->>'objectives_evidenced')::integer <> cardinality(v_under) then
    raise exception 'A control with evidence behind some of its objectives read %', v_line;
  end if;
  v_read := public.program_control_objectives(v_program, v_control);
  if exists (select 1 from jsonb_array_elements(v_read->'objectives') o
      where ((o->>'id')::uuid = any(v_under)) <> (o->>'evidenced')::boolean or not (o->>'mapped')::boolean) then
    raise exception 'The objectives with evidence read %', v_read;
  end if;
  -- Once the rest's requirement cites evidence too, every objective is evidenced: not assessed.
  insert into public.requirement_evidence(tenant_id, requirement_revision_id, evidence_version_id) values
    (v_tenant, 'c5730000-0000-0000-0000-000000000022', 'c5750000-0000-0000-0000-000000000021');
  v_line := pg_temp.line(public.program_control_status(v_program), v_control);
  if v_line->>'status' <> 'not_assessed' or (v_line->>'objectives_evidenced')::integer <> cardinality(v_leaves) then
    raise exception 'A control with evidence behind every objective read %', v_line;
  end if;

  -- A whole-control mapping covers every objective of the other control at once, as it always did.
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type)
    values (v_tenant, 'c5730000-0000-0000-0000-000000000023', v_other, 'maps_to');
  v_line := pg_temp.line(public.program_control_status(v_program), v_other);
  if v_line->>'status' <> 'no_evidence' or (v_line->>'objectives')::integer = 0
    or v_line->'objectives_mapped' <> v_line->'objectives' or v_line->'objectives_evidenced' <> '0'::jsonb then
    raise exception 'A control mapped as a whole read %', v_line;
  end if;
  -- The root objective covers every objective of its control, as the whole control does.
  update public.requirement_control_links set revision = revision + 1, control_part_id = (
      select o.id from public.control_parts o where o.control_id = v_other and o.name = 'assessment-objective' and o.parent_part_id is null)
    where requirement_revision_id = 'c5730000-0000-0000-0000-000000000023';
  v_line := pg_temp.line(public.program_control_status(v_program), v_other);
  if v_line->>'status' <> 'no_evidence' or v_line->'objectives_mapped' <> v_line->'objectives' then
    raise exception 'A control mapped at its root objective read %', v_line;
  end if;
  -- One leaf of it alone leaves the rest unmapped, unless the control has only that one.
  select o.id into v_leaf from public.control_parts o
  where o.control_id = v_other and o.name = 'assessment-objective'
    and not exists (select 1 from public.control_parts g where g.parent_part_id = o.id and g.name = 'assessment-objective')
  order by o.source_pointer limit 1;
  update public.requirement_control_links set revision = revision + 1, control_part_id = v_leaf
    where requirement_revision_id = 'c5730000-0000-0000-0000-000000000023';
  v_line := pg_temp.line(public.program_control_status(v_program), v_other);
  if v_line->'objectives_mapped' <> '1'::jsonb
    or v_line->>'status' <> (case when v_line->'objectives' = '1'::jsonb then 'no_evidence' else 'no_requirement' end) then
    raise exception 'A control mapped at one leaf read %', v_line;
  end if;

  -- Every control still stands at one status, and a viewer reads the same answer.
  v_answer := public.program_control_status(v_program);
  if (select sum(value::integer) from jsonb_each_text(v_answer->'totals') where key <> 'controls')
      <> (v_answer->'totals'->>'controls')::integer
    or exists (select 1 from jsonb_array_elements(v_answer->'controls') c
      where (c->>'objectives_mapped')::integer > (c->>'objectives')::integer
        or (c->>'objectives_evidenced')::integer > (c->>'objectives_mapped')::integer) then
    raise exception 'The objective counts do not add up: %', v_answer->'totals';
  end if;
  v_read := public.program_control_objectives(v_program, v_control);
  insert into public.tenant_memberships(tenant_id, user_id, role)
  select v_tenant, 'c5700000-0000-0000-0000-000000000002', 'viewer'
  where not exists (select 1 from public.tenant_memberships m
    where m.tenant_id = v_tenant and m.user_id = 'c5700000-0000-0000-0000-000000000002');
  perform set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000002', true);
  if public.program_control_status(v_program) is distinct from v_answer
    or public.program_control_objectives(v_program, v_control) is distinct from v_read then
    raise exception 'A viewer read another answer of a control''s objectives';
  end if;
  perform set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000001', true);
  raise notice 'The objective checks ran against the pinned references';
end $$;

-- ---------------------------------------------------------------------------------------------
-- A heading that prints a sentence of its own counts on its own (20261114051136): beside its
-- leaves a control counts each heading whose text says something once SP 800-53A's lead-in
-- "Determine if:" is set aside. Mapping the heading covers it and every objective under it; mapping
-- every leaf without it leaves its own sentence uncovered, so the control stays no requirement.
-- The catalog control's table counts each program as the status does (control_objective_counts).
-- ---------------------------------------------------------------------------------------------
do $$ begin
  -- The rule reads the lead-in apart from what follows it.
  if public.objective_prints_own_sentence('Determine if:')
    or public.objective_prints_own_sentence(E'  determine if:\n\n ')
    or public.objective_prints_own_sentence(null)
    or public.objective_prints_own_sentence('   ')
    or not public.objective_prints_own_sentence('a Data Integrity Board is established;')
    or not public.objective_prints_own_sentence(E'Determine if:\n\nthe developer logs each change.') then
    raise exception 'objective_prints_own_sentence does not read the lead-in apart from what follows it';
  end if;
  -- The catalog control's table: a member's, as themselves.
  if has_function_privilege('anon', 'public.control_objective_counts(uuid, uuid[])', 'execute')
    or has_function_privilege('public', 'public.control_objective_counts(uuid, uuid[])', 'execute')
    or not has_function_privilege('authenticated', 'public.control_objective_counts(uuid, uuid[])', 'execute')
    or (select p.prosecdef from pg_catalog.pg_proc p
      where p.oid = 'public.control_objective_counts(uuid, uuid[])'::regprocedure) then
    raise exception 'control_objective_counts is not a signed-in member''s read, as themselves';
  end if;
end $$;

do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_base uuid; v_program uuid;
  v_control uuid; v_heading uuid; v_leaves uuid[]; v_under uuid[]; v_counted integer;
  v_labels text[]; v_root_only uuid; v_root_leaves integer;
  v_line jsonb; v_read jsonb; v_counts jsonb;
begin
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) >= 3
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the heading checks were skipped';
    return;
  end if;

  -- The rule finds the nine headings SP 800-53A prints a sentence of their own for, and no other.
  select array_agg(x.label order by x.label collate "C") into v_labels
  from (
    select (select p->>'value' from jsonb_array_elements(h.props) p where p->>'name' = 'label' limit 1) as label
    from public.control_parts h
    join public.controls k on k.id = h.control_id and k.catalog_revision_id = v_catalog
    where h.name = 'assessment-objective'
      and exists (select 1 from public.control_parts u where u.parent_part_id = h.id and u.name = 'assessment-objective')
      and public.objective_prints_own_sentence(h.prose)
  ) x;
  if v_labels is distinct from array['AC-08a.', 'CA-07(04)', 'CM-07(07)', 'PE-11(02)', 'PM-21a.',
      'PM-24', 'PM-27a.', 'PM-31', 'RA-05b.'] then
    raise exception 'The headings that print a sentence of their own read %', v_labels;
  end if;

  v_program := pg_temp.program('CS-HEADINGS', v_catalog, v_base);
  -- A control of the baseline with one such heading, below its root, and a leaf of the control
  -- outside it.
  select h.control_id, h.id into v_control, v_heading
  from public.program_reference_choices c
  join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
  join public.catalog_control_rows k on k.id = sc.control_id
  join public.control_parts h on h.control_id = sc.control_id and h.name = 'assessment-objective'
    and h.parent_part_id is not null
  where c.program_id = v_program
    and public.objective_prints_own_sentence(h.prose)
    and exists (select 1 from public.control_parts u where u.parent_part_id = h.id and u.name = 'assessment-objective')
    and (select count(*) from public.control_parts s
      where s.control_id = sc.control_id and s.name = 'assessment-objective'
        and exists (select 1 from public.control_parts u where u.parent_part_id = s.id and u.name = 'assessment-objective')
        and public.objective_prints_own_sentence(s.prose)) = 1
  order by k.code_order, h.source_pointer limit 1;
  if v_control is null then
    raise notice 'The baseline has no control with a heading of its own below its root: the heading checks were skipped';
    return;
  end if;
  select array_agg(o.id order by o.source_pointer) into v_leaves
  from public.control_parts o
  where o.control_id = v_control and o.name = 'assessment-objective'
    and not exists (select 1 from public.control_parts g where g.parent_part_id = o.id and g.name = 'assessment-objective');
  -- Every objective under the heading, at any depth.
  with recursive under(id) as (
    select u.id from public.control_parts u where u.parent_part_id = v_heading and u.name = 'assessment-objective'
    union all
    select u.id from public.control_parts u join under on u.parent_part_id = under.id
    where u.name = 'assessment-objective')
  select array_agg(id) into v_under from under;
  v_counted := cardinality(v_leaves) + 1;
  if cardinality(v_leaves) <= (select count(*) from unnest(v_leaves) l where l = any(v_under)) then
    raise notice 'The control has no leaf outside its heading: the heading checks were skipped';
    return;
  end if;

  insert into public.engineering_requirements(id, tenant_id, program_id, code) values
    ('c5720000-0000-0000-0000-000000000031', v_tenant, v_program, 'REQ-LEAVES'),
    ('c5720000-0000-0000-0000-000000000032', v_tenant, v_program, 'REQ-OWN-SENTENCE');
  insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type) values
    ('c5730000-0000-0000-0000-000000000031', v_tenant, 'c5720000-0000-0000-0000-000000000031', 1, 'Meets every leaf', 'The system does what each leaf asks.', 'It is recorded.', 'functional'),
    ('c5730000-0000-0000-0000-000000000032', v_tenant, 'c5720000-0000-0000-0000-000000000032', 1, 'Meets the heading', 'The system does what the heading says.', 'It is recorded.', 'functional');

  -- Every leaf, one mapping each: the heading's own sentence stays uncovered, so the control counts
  -- it beside its leaves and stays no requirement, one short.
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, control_part_id, relationship_type)
  select v_tenant, 'c5730000-0000-0000-0000-000000000031', v_control, l, 'maps_to' from unnest(v_leaves) l;
  v_line := pg_temp.line(public.program_control_status(v_program), v_control);
  if v_line->>'status' <> 'no_requirement' or (v_line->>'objectives')::integer <> v_counted
    or (v_line->>'objectives_mapped')::integer <> v_counted - 1 or v_line->'objectives_evidenced' <> '0'::jsonb then
    raise exception 'A control with every leaf mapped and its heading not read % (% leaves and a heading)', v_line, cardinality(v_leaves);
  end if;
  -- The read of the control's objectives lists the heading, with its own label and text, before the
  -- objectives under it, which name it among the objectives above them.
  v_read := public.program_control_objectives(v_program, v_control);
  if jsonb_array_length(v_read->'objectives') <> v_counted
    or not exists (select 1 from jsonb_array_elements(v_read->'objectives') o
      where (o->>'id')::uuid = v_heading and not (o->>'mapped')::boolean and o->'mapped_on' = '[]'::jsonb
        and nullif(o->>'label', '') is not null and nullif(o->>'prose', '') is not null)
    or exists (select 1 from jsonb_array_elements(v_read->'objectives') o
      where (o->>'id')::uuid = any(v_under) and not (o->'ancestors' ? v_heading::text))
    or (select min(t.n) from jsonb_array_elements(v_read->'objectives') with ordinality t(o, n)
        where (t.o->>'id')::uuid = any(v_under))
      < (select t.n from jsonb_array_elements(v_read->'objectives') with ordinality t(o, n)
        where (t.o->>'id')::uuid = v_heading) then
    raise exception 'The objectives of a control with a heading of its own read %', v_read;
  end if;

  -- The heading mapped covers its own sentence and the objectives under it: every objective is
  -- covered, and with no evidence the control reads no evidence.
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, control_part_id, relationship_type)
    values (v_tenant, 'c5730000-0000-0000-0000-000000000032', v_control, v_heading, 'satisfies');
  v_line := pg_temp.line(public.program_control_status(v_program), v_control);
  if v_line->>'status' <> 'no_evidence' or (v_line->>'objectives_mapped')::integer <> v_counted then
    raise exception 'A control whose heading of its own is mapped read %', v_line;
  end if;
  -- Without the leaves under it mapped one by one, the heading still covers them.
  delete from public.requirement_control_links
    where requirement_revision_id = 'c5730000-0000-0000-0000-000000000031' and control_part_id = any(v_under);
  v_line := pg_temp.line(public.program_control_status(v_program), v_control);
  if v_line->>'status' <> 'no_evidence' or (v_line->>'objectives_mapped')::integer <> v_counted then
    raise exception 'A heading of its own mapped alone does not cover the objectives under it: %', v_line;
  end if;

  -- A root heading that prints only the lead-in says nothing of its own: SA-24 counts its leaves.
  select k.id into v_root_only from public.controls k where k.catalog_revision_id = v_catalog and k.code = 'SA-24';
  if v_root_only is not null then
    select count(*) into v_root_leaves from public.control_parts o
    where o.control_id = v_root_only and o.name = 'assessment-objective'
      and not exists (select 1 from public.control_parts g where g.parent_part_id = o.id and g.name = 'assessment-objective');
    if (select count(distinct o.objective_id) from public.program_control_objective_cover(v_program, array[v_root_only]) o)
        <> v_root_leaves then
      raise exception 'A heading that prints only "Determine if:" is counted as an objective of its own';
    end if;
  end if;

  -- The catalog control's table counts each program as the program's control status does (mapped,
  -- with evidence and judged); a program the reader cannot read is refused, and none named answers
  -- none.
  v_counts := public.control_objective_counts(v_control, array[v_program]);
  if v_counts->'programs' <> jsonb_build_array(jsonb_build_object('program_id', v_program,
      'objectives', v_line->'objectives', 'objectives_mapped', v_line->'objectives_mapped',
      'objectives_evidenced', v_line->'objectives_evidenced',
      'objectives_assessed', v_line->'objectives_assessed')) then
    raise exception 'The catalog control''s table reads % where the control status reads %', v_counts, v_line;
  end if;
  perform pg_temp.expect_error(format('select public.control_objective_counts(%L, array[%L, %L]::uuid[])',
    v_control, v_program, gen_random_uuid()), '42501');
  if public.control_objective_counts(v_control, '{}')->'programs' <> '[]'::jsonb then
    raise exception 'The catalog control''s table answers a program it was not asked for';
  end if;
  -- A viewer reads the same answers.
  perform set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000002', true);
  if public.control_objective_counts(v_control, array[v_program]) is distinct from v_counts
    or pg_temp.line(public.program_control_status(v_program), v_control) is distinct from v_line then
    raise exception 'A viewer read another count of a control''s objectives';
  end if;
  perform set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000001', true);
  raise notice 'The checks of a heading of its own ran against the pinned references';
end $$;

-- ---------------------------------------------------------------------------------------------
-- Every system counts (20261114072913_every_system_counts): a control, and each objective it
-- counts, is covered only once it is covered on every system of the program whose control baseline
-- selects it (each of its authorization boundaries that does), and evidenced only once covered on
-- every one by a requirement that cites evidence. A mapping counts on the boundary of the system it
-- names, an element's on its boundary; a mapping that names no system counts on every system; and a
-- control no system selects is covered by any mapping, as before. The read of one control's
-- objectives says each system's standing, how many requirements are allocated there and which
-- requirement owes evidence.
-- ---------------------------------------------------------------------------------------------
create function pg_temp.selection(system uuid, control uuid) returns uuid language sql stable as $$
  select sc.id from public.selected_controls sc
  join public.system_effective_baselines b on b.profile_resolution_id = sc.profile_resolution_id
  where b.system_id = system and sc.control_id = control limit 1;
$$;
grant execute on function pg_temp.selection(uuid, uuid) to authenticated;

do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_small uuid; v_more uuid; v_program uuid; v_created jsonb;
  v_small_key uuid := gen_random_uuid(); v_more_key uuid := gen_random_uuid();
  v_one uuid; v_two uuid; v_element uuid := gen_random_uuid();
  v_control uuid; v_first uuid; v_counted integer; v_legacy uuid; v_unselected uuid;
  v_line jsonb; v_read jsonb;
  v_system jsonb := jsonb_build_object('description', '', 'type', 'information_system', 'ownerPartyId', null,
    'confidentiality', 'low', 'integrity', 'low', 'availability', 'low',
    'categorizationRationale', 'A limited impact boundary for a rollback test.', 'elements', '[]'::jsonb);
begin
  -- The smallest published reference baseline, and a larger one of its catalog that selects
  -- controls it does not.
  select r.id, i.catalog_revision_id into v_small, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) >= 3
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_small is null then
    raise notice 'The pinned references are not installed: the checks of every system were skipped';
    return;
  end if;
  select r.id into v_more
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id and i.catalog_revision_id = v_catalog
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null and r.id <> v_small
    and exists (select 1 from public.selected_controls sc where sc.profile_resolution_id = r.id
      and not exists (select 1 from public.selected_controls x
        where x.profile_resolution_id = v_small and x.control_id = sc.control_id))
  order by r.id limit 1;
  -- Two systems on the smaller baseline; the program adopts the larger one too, which no system does.
  v_created := public.create_program_wizard(v_tenant, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', 'CS-SYSTEMS', 'name', 'Every system counts test', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb,
    'catalogRevisionId', v_catalog,
    'profiles', jsonb_build_array(jsonb_build_object(
        'key', v_small_key, 'baseResolutionId', v_small, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb))
      || case when v_more is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object(
        'key', v_more_key, 'baseResolutionId', v_more, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)) end,
    'systems', jsonb_build_array(
      v_system || jsonb_build_object('key', gen_random_uuid(), 'code', 'CS-SYS-ONE', 'name', 'First system', 'profileKey', v_small_key),
      v_system || jsonb_build_object('key', gen_random_uuid(), 'code', 'CS-SYS-TWO', 'name', 'Second system', 'profileKey', v_small_key))));
  v_program := (v_created->>'programId')::uuid;
  select s.id into v_one from public.systems s where s.program_id = v_program and s.code = 'CS-SYS-ONE';
  select s.id into v_two from public.systems s where s.program_id = v_program and s.code = 'CS-SYS-TWO';
  -- An element inside the second system, which inherits its baseline.
  insert into public.systems(id, tenant_id, program_id, code, name, system_type, parent_system_id, boundary_system_id, is_authorization_boundary)
    values (v_element, v_tenant, v_program, 'CS-SYS-TWO-EL', 'Element of the second system', 'subsystem', v_two, v_two, false);

  -- A control of the smaller baseline with two leaves or more and no heading of its own, another
  -- for a mapping that names no system, and one only the larger baseline selects.
  select sc.control_id into v_control
  from public.selected_controls sc
  join public.catalog_control_rows k on k.id = sc.control_id
  where sc.profile_resolution_id = v_small
    and (select count(*) from public.control_parts o where o.control_id = sc.control_id and o.name = 'assessment-objective'
      and not exists (select 1 from public.control_parts g where g.parent_part_id = o.id and g.name = 'assessment-objective')) >= 2
    and not exists (select 1 from public.control_parts h where h.control_id = sc.control_id and h.name = 'assessment-objective'
      and exists (select 1 from public.control_parts u where u.parent_part_id = h.id and u.name = 'assessment-objective')
      and public.objective_prints_own_sentence(h.prose))
  order by k.code_order limit 1;
  select count(*), (array_agg(o.id order by o.source_pointer))[1] into v_counted, v_first
  from public.control_parts o where o.control_id = v_control and o.name = 'assessment-objective'
    and not exists (select 1 from public.control_parts g where g.parent_part_id = o.id and g.name = 'assessment-objective');
  select sc.control_id into v_legacy
  from public.selected_controls sc join public.catalog_control_rows k on k.id = sc.control_id
  where sc.profile_resolution_id = v_small and sc.control_id <> v_control
  order by k.code_order limit 1;
  if v_more is not null then
    select sc.control_id into v_unselected
    from public.selected_controls sc join public.catalog_control_rows k on k.id = sc.control_id
    where sc.profile_resolution_id = v_more
      and not exists (select 1 from public.selected_controls x where x.profile_resolution_id = v_small and x.control_id = sc.control_id)
    order by k.code_order limit 1;
  end if;

  insert into public.engineering_requirements(id, tenant_id, program_id, code) values
    ('c5720000-0000-0000-0000-000000000041', v_tenant, v_program, 'REQ-ONE'),
    ('c5720000-0000-0000-0000-000000000042', v_tenant, v_program, 'REQ-TWO');
  insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type) values
    ('c5730000-0000-0000-0000-000000000041', v_tenant, 'c5720000-0000-0000-0000-000000000041', 1, 'Meets it on the first system', 'The first system does it.', 'It is recorded.', 'functional'),
    ('c5730000-0000-0000-0000-000000000042', v_tenant, 'c5720000-0000-0000-0000-000000000042', 1, 'Meets it on the second system', 'The second system does it.', 'It is recorded.', 'functional');
  insert into public.requirement_allocations(tenant_id, requirement_revision_id, system_id) values
    (v_tenant, 'c5730000-0000-0000-0000-000000000041', v_one),
    (v_tenant, 'c5730000-0000-0000-0000-000000000042', v_element);

  -- Mapped as a whole on the first system: covered there, and short on the second.
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, system_id, selected_control_id, relationship_type)
    values (v_tenant, 'c5730000-0000-0000-0000-000000000041', v_control, v_one, pg_temp.selection(v_one, v_control), 'maps_to');
  v_line := pg_temp.line(public.program_control_status(v_program), v_control);
  if v_line->>'status' <> 'no_requirement' or v_line->'requirements' <> '1'::jsonb
    or (v_line->>'objectives')::integer <> v_counted or v_line->'objectives_mapped' <> '0'::jsonb then
    raise exception 'A control mapped on one of the two systems that select it read %', v_line;
  end if;
  v_read := public.program_control_objectives(v_program, v_control);
  if v_read->'systems' <> jsonb_build_array(
      jsonb_build_object('id', v_one, 'code', 'CS-SYS-ONE', 'name', 'First system', 'mapped', true, 'evidenced', false,
        'objectives_mapped', v_counted, 'objectives_evidenced', 0, 'allocated', 1),
      jsonb_build_object('id', v_two, 'code', 'CS-SYS-TWO', 'name', 'Second system', 'mapped', false, 'evidenced', false,
        'objectives_mapped', 0, 'objectives_evidenced', 0, 'allocated', 1))
    or exists (select 1 from jsonb_array_elements(v_read->'objectives') o
      where (o->>'mapped')::boolean or o->'mapped_on' <> jsonb_build_array(v_one)) then
    raise exception 'The systems of a control mapped on one of them read %', v_read;
  end if;

  -- One objective mapped on the element inside the second system counts on the second system:
  -- that objective is covered on both, the rest on the first alone.
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, control_part_id, system_id, selected_control_id, relationship_type)
    values (v_tenant, 'c5730000-0000-0000-0000-000000000042', v_control, v_first, v_element, pg_temp.selection(v_element, v_control), 'maps_to');
  v_line := pg_temp.line(public.program_control_status(v_program), v_control);
  if v_line->>'status' <> 'no_requirement' or v_line->'requirements' <> '2'::jsonb
    or v_line->'objectives_mapped' <> '1'::jsonb then
    raise exception 'A control with one objective mapped on both systems read %', v_line;
  end if;
  v_read := public.program_control_objectives(v_program, v_control);
  if (v_read->'systems'->1->>'objectives_mapped')::integer <> 1
    or exists (select 1 from jsonb_array_elements(v_read->'objectives') o
      where (o->>'mapped')::boolean <> ((o->>'id')::uuid = v_first)) then
    raise exception 'The objectives of a control mapped in part on the second system read %', v_read;
  end if;

  -- The whole control mapped there too: covered on every system, with no evidence anywhere.
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, system_id, selected_control_id, relationship_type)
    values (v_tenant, 'c5730000-0000-0000-0000-000000000042', v_control, v_element, pg_temp.selection(v_element, v_control), 'maps_to');
  v_line := pg_temp.line(public.program_control_status(v_program), v_control);
  if v_line->>'status' <> 'no_evidence' or (v_line->>'objectives_mapped')::integer <> v_counted then
    raise exception 'A control covered on both systems read %', v_line;
  end if;

  -- Evidence on the first system's requirement alone evidences nothing on the second: the control
  -- stays no evidence, and the second system's requirement owes it.
  insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind, program_id) values
    ('c5740000-0000-0000-0000-000000000041', v_tenant, 'Rollback systems report', 'document', v_program);
  insert into public.evidence_versions(id, tenant_id, artifact_id, version_number, state, external_uri) values
    ('c5750000-0000-0000-0000-000000000041', v_tenant, 'c5740000-0000-0000-0000-000000000041', 1, 'published', 'https://example.test/evidence/systems');
  insert into public.requirement_evidence(tenant_id, requirement_revision_id, evidence_version_id) values
    (v_tenant, 'c5730000-0000-0000-0000-000000000041', 'c5750000-0000-0000-0000-000000000041');
  v_line := pg_temp.line(public.program_control_status(v_program), v_control);
  if v_line->>'status' <> 'no_evidence' or v_line->'evidenced' <> '1'::jsonb
    or v_line->'objectives_evidenced' <> '0'::jsonb then
    raise exception 'A control with evidence on one of its two systems read %', v_line;
  end if;
  v_read := public.program_control_objectives(v_program, v_control);
  if v_read->'requirements' <> jsonb_build_array(
      jsonb_build_object('id', 'c5720000-0000-0000-0000-000000000041', 'code', 'REQ-ONE', 'evidenced', true, 'owes', false),
      jsonb_build_object('id', 'c5720000-0000-0000-0000-000000000042', 'code', 'REQ-TWO', 'evidenced', false, 'owes', true))
    or (v_read->'systems'->0->>'evidenced')::boolean is distinct from true
    or (v_read->'systems'->1->>'evidenced')::boolean is distinct from false then
    raise exception 'The requirements of a control evidenced on one system read %', v_read;
  end if;
  -- Evidence on the second system's requirement too: evidenced on every system, not assessed.
  insert into public.requirement_evidence(tenant_id, requirement_revision_id, evidence_version_id) values
    (v_tenant, 'c5730000-0000-0000-0000-000000000042', 'c5750000-0000-0000-0000-000000000041');
  v_line := pg_temp.line(public.program_control_status(v_program), v_control);
  if v_line->>'status' <> 'not_assessed' or (v_line->>'objectives_evidenced')::integer <> v_counted then
    raise exception 'A control evidenced on both systems read %', v_line;
  end if;

  -- A mapping that names no system counts on every system, as it always counted.
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type)
    values (v_tenant, 'c5730000-0000-0000-0000-000000000041', v_legacy, 'derived_from');
  v_line := pg_temp.line(public.program_control_status(v_program), v_legacy);
  if v_line->>'status' <> 'not_assessed' or v_line->'objectives_mapped' <> v_line->'objectives' then
    raise exception 'A control mapped with no system read %', v_line;
  end if;
  v_read := public.program_control_objectives(v_program, v_legacy);
  if exists (select 1 from jsonb_array_elements(v_read->'systems') s where not (s->>'mapped')::boolean)
    or jsonb_array_length(v_read->'systems') <> 2 then
    raise exception 'A mapping that names no system did not count on both systems: %', v_read;
  end if;

  -- A control no system of the program selects is counted on no system: any mapping covers it.
  if v_unselected is not null then
    v_line := pg_temp.line(public.program_control_status(v_program), v_unselected);
    if v_line->>'status' <> 'no_requirement' then
      raise exception 'A control nothing maps, and no system selects, read %', v_line;
    end if;
    insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type)
      values (v_tenant, 'c5730000-0000-0000-0000-000000000042', v_unselected, 'maps_to');
    v_line := pg_temp.line(public.program_control_status(v_program), v_unselected);
    v_read := public.program_control_objectives(v_program, v_unselected);
    if v_line->>'status' <> 'not_assessed' or v_line->'objectives_mapped' <> v_line->'objectives'
      or v_read->'systems' <> '[]'::jsonb
      or exists (select 1 from jsonb_array_elements(v_read->'objectives') o
        where not (o->>'mapped')::boolean or o->'mapped_on' <> '[]'::jsonb) then
      raise exception 'A control no system selects, mapped, read % and %', v_line, v_read;
    end if;
  end if;

  -- Every control still stands at one status, its counts within its objectives, and the
  -- internal lines the snapshots count are the read's.
  if (select sum(value::integer) from jsonb_each_text(public.program_control_status(v_program)->'totals') where key <> 'controls')
      <> (public.program_control_status(v_program)->'totals'->>'controls')::integer
    or exists (select 1 from public.program_control_status_lines(v_program) l
      where l.objectives_mapped > l.objectives or l.objectives_evidenced > l.objectives_mapped) then
    raise exception 'The counts of a program with two systems do not add up';
  end if;
  raise notice 'The checks of every system ran against the pinned references';
end $$;

-- ---------------------------------------------------------------------------------------------
-- Not assessed until all (20261114144036_not_assessed_until_all): the program's assessors decide a
-- control once they have judged every objective it counts. A determination on an objective judges
-- it and every objective under it, one on the control's statement judges them all, and not
-- assessed, or a result left in draft, judges nothing. Until every objective is judged the control
-- reads the ladder, with no one's determination; once they all are, the worst of the determinations
-- decides it. Each control says how many of its objectives are judged.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_base uuid; v_program uuid; v_system uuid; v_ssp uuid;
  v_control uuid; v_heading uuid; v_under uuid[]; v_counted uuid[]; v_outside uuid; v_last uuid[];
  v_other uuid; v_other_statement uuid;
  v_campaign uuid := gen_random_uuid(); v_plan uuid := gen_random_uuid();
  v_first uuid := gen_random_uuid(); v_second uuid := gen_random_uuid();
  v_third uuid := gen_random_uuid(); v_draft uuid := gen_random_uuid(); v_whole uuid := gen_random_uuid();
  v_set uuid; v_line jsonb; v_answer jsonb; v_judged integer;
begin
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) >= 3
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the checks of a control judged in part were skipped';
    return;
  end if;
  v_program := pg_temp.program('CS-JUDGED', v_catalog, v_base);

  -- A control whose objectives nest, as the objective checks pick one: a heading over two leaves or
  -- more, with a leaf of the control outside it, and no heading that prints a sentence of its own.
  select x.control_id, x.heading into v_control, v_heading
  from (
    select sc.control_id, h.id as heading, k.code_order, h.source_pointer
    from public.program_reference_choices c
    join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
    join public.catalog_control_rows k on k.id = sc.control_id
    join public.control_parts h on h.control_id = sc.control_id and h.name = 'assessment-objective'
      and h.parent_part_id is not null
    where c.program_id = v_program
      and (select count(*) from public.control_parts u where u.parent_part_id = h.id and u.name = 'assessment-objective'
        and not exists (select 1 from public.control_parts g where g.parent_part_id = u.id and g.name = 'assessment-objective')) >= 2
      and not exists (select 1 from public.control_parts u join public.control_parts g on g.parent_part_id = u.id
        where u.parent_part_id = h.id and g.name = 'assessment-objective')
      and not exists (select 1 from public.control_parts s
        where s.control_id = sc.control_id and s.name = 'assessment-objective'
          and exists (select 1 from public.control_parts u where u.parent_part_id = s.id and u.name = 'assessment-objective')
          and public.objective_prints_own_sentence(s.prose))
  ) x
  order by x.code_order, x.source_pointer limit 1;
  if v_control is null then
    raise notice 'The baseline has no control whose objectives nest: the checks of a control judged in part were skipped';
    return;
  end if;
  select array_agg(u.id order by u.source_pointer) into v_under
  from public.control_parts u where u.parent_part_id = v_heading and u.name = 'assessment-objective';
  select array_agg((o->>'id')::uuid order by n) into v_counted
  from jsonb_array_elements(public.program_control_objectives(v_program, v_control)->'objectives') with ordinality as x(o, n);
  select l into v_outside from unnest(v_counted) with ordinality as x(l, n) where l <> all(v_under) order by n limit 1;
  -- Another control of the baseline with objectives of its own, judged on its statement alone.
  select sc.control_id, st.id into v_other, v_other_statement
  from public.program_reference_choices c
  join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
  join public.catalog_control_rows k on k.id = sc.control_id
  join public.control_parts st on st.control_id = sc.control_id and st.parent_part_id is null and st.name = 'statement'
  where c.program_id = v_program and sc.control_id <> v_control
    and (select count(*) from public.control_parts o where o.control_id = sc.control_id and o.name = 'assessment-objective') >= 2
  order by k.code_order, st.id limit 1;
  if v_outside is null or v_other is null then
    raise notice 'The baseline has no control to judge in part: the checks of a control judged in part were skipped';
    return;
  end if;

  -- One requirement that cites evidence maps both controls whole: every objective is evidenced, and
  -- with nothing judged both read not assessed, with no objective judged.
  insert into public.engineering_requirements(id, tenant_id, program_id, code) values
    ('c5720000-0000-0000-0000-000000000051', v_tenant, v_program, 'REQ-JUDGED');
  insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type) values
    ('c5730000-0000-0000-0000-000000000051', v_tenant, 'c5720000-0000-0000-0000-000000000051', 1, 'Meets both', 'The system does both things.', 'It is recorded.', 'functional');
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type) values
    (v_tenant, 'c5730000-0000-0000-0000-000000000051', v_control, 'satisfies'),
    (v_tenant, 'c5730000-0000-0000-0000-000000000051', v_other, 'satisfies');
  insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind, program_id) values
    ('c5740000-0000-0000-0000-000000000051', v_tenant, 'Rollback judged report', 'document', v_program);
  insert into public.evidence_versions(id, tenant_id, artifact_id, version_number, state, external_uri) values
    ('c5750000-0000-0000-0000-000000000051', v_tenant, 'c5740000-0000-0000-0000-000000000051', 1, 'published', 'https://example.test/evidence/judged');
  insert into public.requirement_evidence(tenant_id, requirement_revision_id, evidence_version_id) values
    (v_tenant, 'c5730000-0000-0000-0000-000000000051', 'c5750000-0000-0000-0000-000000000051');
  v_line := pg_temp.line(public.program_control_status(v_program), v_control);
  if v_line->>'status' <> 'not_assessed' or (v_line->>'objectives')::integer <> cardinality(v_counted)
    or v_line->'objectives_assessed' <> '0'::jsonb or v_line->'determined_by' <> 'null'::jsonb then
    raise exception 'A control evidenced and judged by nobody read %', v_line;
  end if;

  -- A campaign's plan on the system's published security plan.
  select s.id into v_system from public.systems s where s.program_id = v_program order by s.created_at, s.id limit 1;
  select r.id into v_ssp from public.ssp_revisions r where r.system_id = v_system order by r.version_number limit 1;
  update public.ssp_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_ssp and state <> 'published';
  insert into public.assessment_campaigns(id, tenant_id, title, program_id) values (v_campaign, v_tenant, 'Judged in part campaign', v_program);
  insert into public.assessment_plan_revisions(id, tenant_id, version_number, campaign_id, ssp_revision_id, title)
    values (v_plan, v_tenant, 1, v_campaign, v_ssp, 'Judged in part plan');
  update public.assessment_plan_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_plan;

  -- First results: one objective outside the heading satisfied, and the heading found not assessed,
  -- which judges nothing. Published, they decide nothing yet: one objective is judged.
  insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title)
    values (v_first, v_tenant, 1, v_plan, 'First results');
  insert into public.result_sets(tenant_id, assessment_results_revision_id, title) values (v_tenant, v_first, 'First set') returning id into v_set;
  insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at) values
    (v_tenant, v_first, v_set, v_outside, 'One objective', 'satisfied', now() - interval '3 days'),
    (v_tenant, v_first, v_set, v_heading, 'The heading, looked at and left', 'not_assessed', now() - interval '3 days');
  update public.assessment_results_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_first;
  v_line := pg_temp.line(public.program_control_status(v_program), v_control);
  if v_line->>'status' <> 'not_assessed' or v_line->'objectives_assessed' <> '1'::jsonb
    or v_line->'determined_by' <> 'null'::jsonb or v_line->'product_assessments' <> '[]'::jsonb then
    raise exception 'A control judged on one of its objectives read %', v_line;
  end if;
  if (select count(*) from public.program_control_objective_judgments(v_program, array[v_control])) <> 1
    or not exists (select 1 from public.program_control_objective_judgments(v_program, array[v_control]) j
      where j.objective_id = v_outside and j.determination = 'satisfied') then
    raise exception 'What the program judged of the control reads %', (select jsonb_agg(to_jsonb(j))
      from public.program_control_objective_judgments(v_program, array[v_control]) j);
  end if;

  -- Second results: the heading partially satisfied judges every objective under it. Unless that
  -- leaves none, the control is still not assessed; a result left in draft judges nothing more.
  insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title)
    values (v_second, v_tenant, 2, v_plan, 'Second results');
  insert into public.result_sets(tenant_id, assessment_results_revision_id, title) values (v_tenant, v_second, 'Second set') returning id into v_set;
  insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at) values
    (v_tenant, v_second, v_set, v_heading, 'The heading', 'partially_satisfied', now() - interval '2 days');
  update public.assessment_results_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_second;
  select array_agg(l order by n) into v_last
  from unnest(v_counted) with ordinality as x(l, n) where l <> v_outside and l <> all(v_under);
  insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title)
    values (v_draft, v_tenant, 3, v_plan, 'Results in draft');
  insert into public.result_sets(tenant_id, assessment_results_revision_id, title) values (v_tenant, v_draft, 'Draft set') returning id into v_set;
  insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at)
  select v_tenant, v_draft, v_set, l, 'Not yet published', 'satisfied', now() from unnest(coalesce(v_last, '{}')) l;
  v_judged := 1 + cardinality(v_under);
  v_line := pg_temp.line(public.program_control_status(v_program), v_control);
  if (v_line->>'objectives_assessed')::integer <> v_judged
    or v_line->>'status' <> (case when v_judged = cardinality(v_counted) then 'partially_satisfied' else 'not_assessed' end) then
    raise exception 'A control judged at a heading read % (% objectives judged of %)', v_line, v_judged, cardinality(v_counted);
  end if;

  -- Third results: every objective left, satisfied. Every objective is judged: the worst of the
  -- determinations, the heading's, decides it, and it is the program's.
  insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title)
    values (v_third, v_tenant, 4, v_plan, 'Third results');
  insert into public.result_sets(tenant_id, assessment_results_revision_id, title) values (v_tenant, v_third, 'Third set') returning id into v_set;
  insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at)
  select v_tenant, v_third, v_set, l, 'The rest', 'satisfied', now() - interval '1 day' from unnest(coalesce(v_last, '{}')) l;
  update public.assessment_results_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_third;
  v_line := pg_temp.line(public.program_control_status(v_program), v_control);
  if v_line->>'status' <> 'partially_satisfied' or v_line->>'determined_by' <> 'program'
    or (v_line->>'objectives_assessed')::integer <> cardinality(v_counted) then
    raise exception 'A control with every objective judged read %', v_line;
  end if;

  -- The other control, judged on its statement alone as every plan before took a control: every
  -- objective it counts is judged, and its determination decides it, as it always did.
  insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title)
    values (v_whole, v_tenant, 5, v_plan, 'Results on the statement');
  insert into public.result_sets(tenant_id, assessment_results_revision_id, title) values (v_tenant, v_whole, 'Statement set') returning id into v_set;
  insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at)
    values (v_tenant, v_whole, v_set, v_other_statement, 'The other control, whole', 'other_than_satisfied', now());
  update public.assessment_results_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_whole;
  v_answer := public.program_control_status(v_program);
  v_line := pg_temp.line(v_answer, v_other);
  if v_line->>'status' <> 'other_than_satisfied' or v_line->>'determined_by' <> 'program'
    or v_line->'objectives_assessed' <> v_line->'objectives' or (v_line->>'objectives')::integer < 2 then
    raise exception 'A control judged on its statement read %', v_line;
  end if;

  -- Every control stands at one status; a determined control has every objective judged and no
  -- other has more judged than it counts; the internal lines the snapshots count are the read's;
  -- and a viewer reads the same answer.
  if (select sum(value::integer) from jsonb_each_text(v_answer->'totals') where key <> 'controls')
      <> (v_answer->'totals'->>'controls')::integer
    or exists (select 1 from jsonb_array_elements(v_answer->'controls') c
      where (c->>'objectives_assessed')::integer > (c->>'objectives')::integer
        or (c->>'determined_by' = 'program' and (c->>'objectives_assessed')::integer <> (c->>'objectives')::integer))
    or exists (select 1 from public.program_control_status_lines(v_program) l
      where l.status is distinct from pg_temp.line(v_answer, l.id)->>'status'
        or l.objectives_assessed <> (pg_temp.line(v_answer, l.id)->>'objectives_assessed')::bigint) then
    raise exception 'The objectives judged do not add up: %', v_answer->'totals';
  end if;
  perform set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000002', true);
  if public.program_control_status(v_program) is distinct from v_answer then
    raise exception 'A viewer read another answer of a control judged in part';
  end if;
  perform set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000001', true);
  raise notice 'The checks of a control judged in part ran against the pinned references';
end $$;

-- ---------------------------------------------------------------------------------------------
-- Latest per objective (20261114165512_latest_per_objective): the newest of the determinations
-- that judge an objective decides it (its own, one on an objective above it, one on the control's
-- statement), and the control reads the worst of its objectives. A newer objective's determination
-- stands over an older statement's, a newer statement's over older objectives', a heading's over
-- the older ones under it; two made at one moment fall to the nearer part; not assessed and a
-- result left in draft decide nothing.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_base uuid; v_program uuid; v_system uuid; v_ssp uuid;
  v_control uuid; v_heading uuid; v_statement uuid; v_under uuid[]; v_counted uuid[]; v_outside uuid;
  v_campaign uuid := gen_random_uuid(); v_plan uuid := gen_random_uuid();
  v_results uuid; v_set uuid; v_version integer := 0; v_line jsonb; v_answer jsonb;
  v_read text;
begin
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) >= 3
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the checks of the latest determination were skipped';
    return;
  end if;
  v_program := pg_temp.program('CS-LATEST', v_catalog, v_base);

  -- A control whose objectives nest, picked as the checks of a control judged in part pick one: a
  -- heading over two leaves or more, a leaf of the control outside it, and a statement.
  select x.control_id, x.heading into v_control, v_heading
  from (
    select sc.control_id, h.id as heading, k.code_order, h.source_pointer
    from public.program_reference_choices c
    join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
    join public.catalog_control_rows k on k.id = sc.control_id
    join public.control_parts h on h.control_id = sc.control_id and h.name = 'assessment-objective'
      and h.parent_part_id is not null
    where c.program_id = v_program
      and (select count(*) from public.control_parts u where u.parent_part_id = h.id and u.name = 'assessment-objective'
        and not exists (select 1 from public.control_parts g where g.parent_part_id = u.id and g.name = 'assessment-objective')) >= 2
      and not exists (select 1 from public.control_parts u join public.control_parts g on g.parent_part_id = u.id
        where u.parent_part_id = h.id and g.name = 'assessment-objective')
      and not exists (select 1 from public.control_parts s
        where s.control_id = sc.control_id and s.name = 'assessment-objective'
          and exists (select 1 from public.control_parts u where u.parent_part_id = s.id and u.name = 'assessment-objective')
          and public.objective_prints_own_sentence(s.prose))
      and exists (select 1 from public.control_parts st
        where st.control_id = sc.control_id and st.parent_part_id is null and st.name = 'statement')
  ) x
  order by x.code_order, x.source_pointer limit 1;
  if v_control is null then
    raise notice 'The baseline has no control whose objectives nest: the checks of the latest determination were skipped';
    return;
  end if;
  select st.id into v_statement from public.control_parts st
  where st.control_id = v_control and st.parent_part_id is null and st.name = 'statement'
  order by st.ordinal, st.id limit 1;
  select array_agg(u.id order by u.source_pointer) into v_under
  from public.control_parts u where u.parent_part_id = v_heading and u.name = 'assessment-objective';
  select array_agg((o->>'id')::uuid order by n) into v_counted
  from jsonb_array_elements(public.program_control_objectives(v_program, v_control)->'objectives') with ordinality as x(o, n);
  select l into v_outside from unnest(v_counted) with ordinality as x(l, n) where l <> all(v_under) order by n limit 1;
  if v_outside is null then
    raise notice 'The control has no objective outside its heading: the checks of the latest determination were skipped';
    return;
  end if;

  -- One requirement that cites evidence maps the control whole: it waits on its assessors.
  insert into public.engineering_requirements(id, tenant_id, program_id, code) values
    ('c5720000-0000-0000-0000-000000000061', v_tenant, v_program, 'REQ-LATEST');
  insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type) values
    ('c5730000-0000-0000-0000-000000000061', v_tenant, 'c5720000-0000-0000-0000-000000000061', 1, 'Meets it', 'The system does the thing.', 'It is recorded.', 'functional');
  insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type) values
    (v_tenant, 'c5730000-0000-0000-0000-000000000061', v_control, 'satisfies');
  insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind, program_id) values
    ('c5740000-0000-0000-0000-000000000061', v_tenant, 'Rollback latest report', 'document', v_program);
  insert into public.evidence_versions(id, tenant_id, artifact_id, version_number, state, external_uri) values
    ('c5750000-0000-0000-0000-000000000061', v_tenant, 'c5740000-0000-0000-0000-000000000061', 1, 'published', 'https://example.test/evidence/latest');
  insert into public.requirement_evidence(tenant_id, requirement_revision_id, evidence_version_id) values
    (v_tenant, 'c5730000-0000-0000-0000-000000000061', 'c5750000-0000-0000-0000-000000000061');
  select s.id into v_system from public.systems s where s.program_id = v_program order by s.created_at, s.id limit 1;
  select r.id into v_ssp from public.ssp_revisions r where r.system_id = v_system order by r.version_number limit 1;
  update public.ssp_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_ssp and state <> 'published';
  insert into public.assessment_campaigns(id, tenant_id, title, program_id) values (v_campaign, v_tenant, 'Latest determination campaign', v_program);
  insert into public.assessment_plan_revisions(id, tenant_id, version_number, campaign_id, ssp_revision_id, title)
    values (v_plan, v_tenant, 1, v_campaign, v_ssp, 'Latest determination plan');
  update public.assessment_plan_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_plan;

  -- Each step publishes one results revision of the plan: its findings, a part and a determination
  -- each, made the given number of days ago. What every objective, and the control, then reads:
  -- read is the determination each objective counted reads (s, p, o for satisfied, partially and
  -- other than satisfied), in the order the control's objectives are read.
  create temporary table latest_step(part uuid, determination text, days integer) on commit drop;
  -- 1. The statement other than satisfied: every objective is judged by it.
  insert into latest_step values (v_statement, 'other_than_satisfied', 6);
  -- 2. Every objective satisfied, later: each one's own is the newest, and the older statement no
  --    longer holds the control down, as the worst of the two did.
  insert into latest_step select l, 'satisfied', 5 from unnest(v_counted) l;
  -- 3. The heading partially satisfied, later still: the objectives under it read it.
  insert into latest_step values (v_heading, 'partially_satisfied', 4);
  -- 4. One objective under the heading satisfied again: newer than the heading, it reads its own.
  insert into latest_step values (v_under[1], 'satisfied', 3);
  -- 5. The statement satisfied: newer than everything, every objective reads it.
  insert into latest_step values (v_statement, 'satisfied', 2);
  -- 6. At one moment, the statement other than satisfied and the objective outside the heading
  --    satisfied: that objective reads its own, the nearer part; every other the statement's.
  insert into latest_step values (v_statement, 'other_than_satisfied', 1), (v_outside, 'satisfied', 1);
  -- 7. Not assessed on the statement, today, decides nothing: step 6 stands.
  insert into latest_step values (v_statement, 'not_assessed', 0);

  for v_version in 1..7 loop
    v_results := gen_random_uuid();
    insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title)
      values (v_results, v_tenant, v_version, v_plan, 'Results ' || v_version);
    insert into public.result_sets(tenant_id, assessment_results_revision_id, title)
      values (v_tenant, v_results, 'Set ' || v_version) returning id into v_set;
    insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at)
    select v_tenant, v_results, v_set, s.part, 'Step ' || v_version, s.determination, now() - make_interval(days => s.days)
    from latest_step s
    where s.days = case v_version when 1 then 6 when 2 then 5 when 3 then 4 when 4 then 3 when 5 then 2 when 6 then 1 else 0 end;
    update public.assessment_results_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_results;

    v_line := pg_temp.line(public.program_control_status(v_program), v_control);
    select string_agg(coalesce(left(j.determination, 1), '-'), '' order by n) into v_read
    from unnest(v_counted) with ordinality as x(l, n)
    left join public.program_control_objective_judgments(v_program, array[v_control]) j on j.objective_id = x.l;
    if v_read is distinct from (case v_version
        when 1 then repeat('o', cardinality(v_counted))
        when 2 then repeat('s', cardinality(v_counted))
        when 5 then repeat('s', cardinality(v_counted))
        else (select string_agg(case
            when v_version in (3, 4) and l = any(v_under) and not (v_version = 4 and l = v_under[1]) then 'p'
            when v_version in (3, 4) then 's'
            when l = v_outside then 's'
            else 'o' end, '' order by n)
          from unnest(v_counted) with ordinality as x(l, n))
      end)
      or v_line->>'status' <> (case v_version when 1 then 'other_than_satisfied' when 2 then 'satisfied'
        when 3 then 'partially_satisfied' when 4 then 'partially_satisfied' when 5 then 'satisfied'
        else 'other_than_satisfied' end)
      or v_line->>'determined_by' <> 'program'
      or v_line->'objectives_assessed' <> v_line->'objectives' then
      raise exception 'After step %, the objectives read % and the control %', v_version, v_read, v_line;
    end if;
  end loop;

  -- A result left in draft, newer and satisfied everywhere, decides nothing.
  v_results := gen_random_uuid();
  insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title)
    values (v_results, v_tenant, 8, v_plan, 'Results in draft');
  insert into public.result_sets(tenant_id, assessment_results_revision_id, title)
    values (v_tenant, v_results, 'Draft set') returning id into v_set;
  insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at)
  select v_tenant, v_results, v_set, l, 'Not yet published', 'satisfied', now() from unnest(v_counted || v_statement) l;
  v_answer := public.program_control_status(v_program);
  if pg_temp.line(v_answer, v_control)->>'status' <> 'other_than_satisfied' then
    raise exception 'A result left in draft decided the control: %', pg_temp.line(v_answer, v_control);
  end if;

  -- The internal lines the snapshots count are the read's, and a viewer reads the same answer.
  if exists (select 1 from public.program_control_status_lines(v_program) l
      where l.status is distinct from pg_temp.line(v_answer, l.id)->>'status'
        or l.objectives_assessed <> (pg_temp.line(v_answer, l.id)->>'objectives_assessed')::bigint) then
    raise exception 'The internal lines do not read the latest determination as the read does';
  end if;
  perform set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000002', true);
  if public.program_control_status(v_program) is distinct from v_answer then
    raise exception 'A viewer read another answer of the latest determinations';
  end if;
  perform set_config('request.jwt.claim.sub', 'c5700000-0000-0000-0000-000000000001', true);
  raise notice 'The checks of the latest determination ran against the pinned references';
end $$;

reset role;
rollback;
select 'Program control status: privileges, refusal, a program with no baseline, the ladder a control climbs, the determinations a program takes from its products, the objectives a control''s requirements cover, the headings that count on their own, every system that selects a control, a control judged in part and the latest determination on each objective passed.' as result;
