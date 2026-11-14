-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Putting a control into an assessment from its record: add_controls_to_assessment_plan adds the
-- chosen controls to a campaign's draft plan at the plan revision the reader saw, and
-- plan_control_assessment plans a new campaign around them. What each writes and skips, what a
-- request sent again answers, what they refuse and from whom, and that their receipts stay private.
-- The checks of what they write need the pinned references (a catalog and a reference baseline).
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
-- Who may call what: a signed-in member calls the two commands; no client calls their helpers or
-- reads their receipts.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_command text;
begin
  foreach v_command in array array[
    'public.add_controls_to_assessment_plan(uuid, uuid, bigint, uuid, uuid[])',
    'public.plan_control_assessment(uuid, uuid, uuid, text, uuid, uuid[])'
  ] loop
    if has_function_privilege('anon', v_command, 'execute') or has_function_privilege('public', v_command, 'execute') then
      raise exception 'An anonymous session may execute %', v_command;
    end if;
    if not has_function_privilege('authenticated', v_command, 'execute') then
      raise exception 'A signed-in session may not execute %', v_command;
    end if;
  end loop;
  foreach v_command in array array[
    'public.add_control_objectives(uuid, uuid, uuid, uuid[])',
    'public.assessment_control_choice(uuid[])'
  ] loop
    if has_function_privilege('authenticated', v_command, 'execute') or has_function_privilege('anon', v_command, 'execute') then
      raise exception 'A client may execute the helper %', v_command;
    end if;
  end loop;
  if has_table_privilege('authenticated', 'public.assessment_plan_requests', 'select')
    or has_table_privilege('authenticated', 'public.assessment_plan_requests', 'insert') then
    raise exception 'A client may read or write the commands'' receipts';
  end if;
end $$;

insert into auth.users(id, email) values
  ('ca500000-0000-0000-0000-000000000001', 'control-assessment-owner@example.test'),
  ('ca500000-0000-0000-0000-000000000002', 'control-assessment-outsider@example.test'),
  ('ca500000-0000-0000-0000-000000000003', 'control-assessment-viewer@example.test');
select set_config('request.jwt.claim.sub', 'ca500000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
select set_config('test.ready', 'false', true);

-- A program set up as the product sets one up, through create_program_wizard, with one system that
-- adopts a reference baseline as it comes.
create function pg_temp.program(code text, catalog uuid, base uuid) returns uuid language plpgsql as $$
declare created jsonb; profile uuid := gen_random_uuid();
begin
  created := public.create_program_wizard(current_setting('test.tenant')::uuid, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', code, 'name', code || ' control assessment test', 'description', '',
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
grant execute on function pg_temp.program(text, uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Two programs on the smallest reference baseline, each with its system's security plan
-- published. The first has a planned campaign with a draft plan, a completed campaign with a draft
-- plan, and an active campaign whose plan is published.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_base uuid; v_program uuid; v_other uuid; v_system uuid; v_ssp uuid; v_draft_ssp uuid;
  v_other_ssp uuid; v_resolution uuid; v_controls uuid[]; v_unselected uuid;
begin
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published'
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) >= 3
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the checks of what the commands write were skipped';
    return;
  end if;
  v_program := pg_temp.program('ASSESS-ONE', v_catalog, v_base);
  v_other := pg_temp.program('ASSESS-OTHER', v_catalog, v_base);
  select s.id into v_system from public.systems s where s.program_id = v_program order by s.created_at, s.id limit 1;
  select r.id, r.profile_resolution_id into v_ssp, v_resolution
    from public.ssp_revisions r where r.system_id = v_system order by r.version_number limit 1;
  update public.ssp_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_ssp;
  -- A second revision of the system's plan, still a draft.
  insert into public.ssp_revisions(id, tenant_id, system_id, profile_resolution_id, version_number)
    values ('ca510000-0000-0000-0000-000000000002', v_tenant, v_system, v_resolution, 2)
    returning id into v_draft_ssp;
  select r.id into v_other_ssp from public.ssp_revisions r
    join public.systems s on s.id = r.system_id where s.program_id = v_other order by r.version_number limit 1;
  update public.ssp_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_other_ssp;

  -- Three controls the plan's SSP selects, each with a statement, in code order; and one control of
  -- the catalog with a statement that it does not select.
  select array_agg(x.control_id order by x.code_order) into v_controls from (
    select distinct sc.control_id, k.code_order
    from public.selected_controls sc
    join public.catalog_control_rows k on k.id = sc.control_id
    where sc.profile_resolution_id = v_resolution
      and exists (select 1 from public.control_parts p
        where p.control_id = sc.control_id and p.parent_part_id is null and p.name = 'statement')
    order by k.code_order limit 3
  ) x;
  select k.id into v_unselected from public.catalog_control_rows k
    where k.catalog_revision_id = v_catalog
      and not exists (select 1 from public.selected_controls sc where sc.profile_resolution_id = v_resolution and sc.control_id = k.id)
      and exists (select 1 from public.control_parts p where p.control_id = k.id and p.parent_part_id is null and p.name = 'statement')
    order by k.code_order limit 1;
  if cardinality(v_controls) < 3 or v_unselected is null then
    raise notice 'The baseline has too few controls with statements: the checks of what the commands write were skipped';
    return;
  end if;

  insert into public.assessment_campaigns(id, tenant_id, title, program_id, status) values
    ('ca520000-0000-0000-0000-000000000001', v_tenant, 'Planned rollback campaign', v_program, 'planned'),
    ('ca520000-0000-0000-0000-000000000002', v_tenant, 'Completed rollback campaign', v_program, 'completed'),
    ('ca520000-0000-0000-0000-000000000003', v_tenant, 'Active rollback campaign', v_program, 'active');
  insert into public.assessment_plan_revisions(id, tenant_id, version_number, campaign_id, ssp_revision_id, title) values
    ('ca530000-0000-0000-0000-000000000001', v_tenant, 1, 'ca520000-0000-0000-0000-000000000001', v_ssp, 'Planned rollback plan'),
    ('ca530000-0000-0000-0000-000000000002', v_tenant, 1, 'ca520000-0000-0000-0000-000000000002', v_ssp, 'Completed rollback plan'),
    ('ca530000-0000-0000-0000-000000000003', v_tenant, 1, 'ca520000-0000-0000-0000-000000000003', v_ssp, 'Active rollback plan');
  update public.assessment_plan_revisions set state = 'published', published_at = now(), revision = revision + 1
    where id = 'ca530000-0000-0000-0000-000000000003';

  perform set_config('test.program', v_program::text, true);
  perform set_config('test.other_program', v_other::text, true);
  perform set_config('test.ssp', v_ssp::text, true);
  perform set_config('test.draft_ssp', v_draft_ssp::text, true);
  perform set_config('test.other_ssp', v_other_ssp::text, true);
  perform set_config('test.a', v_controls[1]::text, true);
  perform set_config('test.b', v_controls[2]::text, true);
  perform set_config('test.c', v_controls[3]::text, true);
  perform set_config('test.unselected', v_unselected::text, true);
  perform set_config('test.ready', 'true', true);
end $$;

-- One plan's objectives, by the control each is aimed at, in the order the plan lists them.
create function pg_temp.objectives(plan uuid) returns table (id uuid, control_id uuid, title text, part_name text, top boolean)
language sql stable as $$
  select o.id, p.control_id, o.title, p.name, p.parent_part_id is null
  from public.assessment_objectives o join public.control_parts p on p.id = o.target_control_part_id
  where o.plan_revision_id = plan order by public.natural_sort_key(o.title), o.id;
$$;
grant execute on function pg_temp.objectives(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Add to assessment campaign.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_plan uuid := 'ca530000-0000-0000-0000-000000000001';
  v_a uuid; v_b uuid; v_c uuid; v_answer jsonb; v_again jsonb; v_objectives record;
begin
  if current_setting('test.ready') <> 'true' then return; end if;
  v_a := current_setting('test.a')::uuid; v_b := current_setting('test.b')::uuid; v_c := current_setting('test.c')::uuid;

  -- Two controls, chosen second first: one objective each, titled by the control's code and title
  -- and aimed at its statement, listed in code order.
  v_answer := public.add_controls_to_assessment_plan(v_tenant, v_plan, 1, 'ca540000-0000-0000-0000-000000000001', array[v_b, v_a]);
  if (v_answer->>'added')::integer <> 2 or (v_answer->>'skipped')::integer <> 0
    or v_answer->>'planRevisionId' <> v_plan::text
    or v_answer->>'campaignId' <> 'ca520000-0000-0000-0000-000000000001'
    or jsonb_array_length(v_answer->'objectiveIds') <> 2 then
    raise exception 'The command did not answer with what it added: %', v_answer;
  end if;
  select array_agg(o.control_id order by public.natural_sort_key(o.title), o.id) as controls,
    bool_and(o.part_name = 'statement' and o.top) as aimed,
    bool_and(o.title = (select k.code || ' ' || k.title from public.controls k where k.id = o.control_id)) as titled,
    jsonb_agg(o.id order by public.natural_sort_key(o.title), o.id) as ids
    into v_objectives from pg_temp.objectives(v_plan) o;
  if v_objectives.controls <> array[v_a, v_b] or not v_objectives.aimed or not v_objectives.titled
    or v_objectives.ids <> v_answer->'objectiveIds' then
    raise exception 'The objectives are not one a control, titled and aimed at its statement: %', to_jsonb(v_objectives);
  end if;
  if exists (select 1 from public.assessment_objectives o where o.plan_revision_id = v_plan
      and (o.created_by <> 'ca500000-0000-0000-0000-000000000001' or o.description is not null or o.requirement_revision_id is not null)) then
    raise exception 'An objective was not stamped with its author, or says more than its control';
  end if;

  -- The same request sent again, the controls in another order and one twice, answers as it first
  -- did and adds nothing, even once the plan has changed since.
  update public.assessment_plan_revisions set description = 'Edited after the first request', revision = revision + 1 where id = v_plan;
  v_again := public.add_controls_to_assessment_plan(v_tenant, v_plan, 1, 'ca540000-0000-0000-0000-000000000001', array[v_a, v_b, v_a]);
  if v_again <> v_answer or (select count(*) from public.assessment_objectives o where o.plan_revision_id = v_plan) <> 2 then
    raise exception 'The request sent again answered % and left % objectives', v_again,
      (select count(*) from public.assessment_objectives o where o.plan_revision_id = v_plan);
  end if;

  -- A new request at the plan's new revision: a control the plan holds is skipped, the other added.
  v_answer := public.add_controls_to_assessment_plan(v_tenant, v_plan, 2, 'ca540000-0000-0000-0000-000000000002', array[v_a, v_c]);
  if (v_answer->>'added')::integer <> 1 or (v_answer->>'skipped')::integer <> 1
    or (select array_agg(o.control_id order by public.natural_sort_key(o.title), o.id) from pg_temp.objectives(v_plan) o) <> array[v_a, v_b, v_c] then
    raise exception 'A held control was not skipped and the other added: %', v_answer;
  end if;

  -- What stops a request, writing nothing.
  -- The same request id with another choice.
  perform pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, %L, 2, 'ca540000-0000-0000-0000-000000000001', array[%L]::uuid[])$f$,
    v_tenant, v_plan, v_c), 'PT409');
  -- A plan revision the reader no longer sees.
  perform pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, %L, 1, 'ca540000-0000-0000-0000-000000000003', array[%L]::uuid[])$f$,
    v_tenant, v_plan, v_c), 'PT409');
  -- A published plan, and a completed campaign's draft plan.
  perform pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, 'ca530000-0000-0000-0000-000000000003', 2, 'ca540000-0000-0000-0000-000000000004', array[%L]::uuid[])$f$,
    v_tenant, v_a), '23514');
  perform pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, 'ca530000-0000-0000-0000-000000000002', 1, 'ca540000-0000-0000-0000-000000000005', array[%L]::uuid[])$f$,
    v_tenant, v_a), '23514');
  -- A control the plan's SSP does not select refuses the whole choice.
  perform pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, %L, 2, 'ca540000-0000-0000-0000-000000000006', array[%L, %L]::uuid[])$f$,
    v_tenant, v_plan, v_c, current_setting('test.unselected')), '23514');
  -- No control, more than 500, a missing one in the list, and a plan that is not there.
  perform pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, %L, 2, 'ca540000-0000-0000-0000-000000000007', '{}'::uuid[])$f$,
    v_tenant, v_plan), '23514');
  perform pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, %L, 2, 'ca540000-0000-0000-0000-000000000008',
      (select array_agg(gen_random_uuid()) from generate_series(1, 501)))$f$, v_tenant, v_plan), '23514');
  perform pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, %L, 2, 'ca540000-0000-0000-0000-000000000009', array[%L, null]::uuid[])$f$,
    v_tenant, v_plan, v_a), '23514');
  perform pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, 'ca530000-0000-0000-0000-00000000dead', 1, 'ca540000-0000-0000-0000-000000000010', array[%L]::uuid[])$f$,
    v_tenant, v_a), 'PT404');
  if (select count(*) from public.assessment_objectives o
      join public.assessment_plan_revisions p on p.id = o.plan_revision_id
      join public.assessment_campaigns g on g.id = p.campaign_id
      where g.program_id = current_setting('test.program')::uuid) <> 3 then
    raise exception 'A refused request wrote an objective';
  end if;
  -- A client never calls the helper that writes the objectives.
  perform pg_temp.expect_error(format($f$select public.add_control_objectives(%L, %L, %L, array[%L]::uuid[])$f$,
    v_tenant, v_plan, gen_random_uuid(), v_a), '42501');
end $$;

-- ---------------------------------------------------------------------------------------------
-- Plan an assessment.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_program uuid; v_ssp uuid; v_a uuid; v_b uuid; v_answer jsonb; v_again jsonb;
  v_campaign public.assessment_campaigns; v_plan public.assessment_plan_revisions;
  v_campaigns integer;
begin
  if current_setting('test.ready') <> 'true' then return; end if;
  v_program := current_setting('test.program')::uuid; v_ssp := current_setting('test.ssp')::uuid;
  v_a := current_setting('test.a')::uuid; v_b := current_setting('test.b')::uuid;

  v_answer := public.plan_control_assessment(v_tenant, v_program, v_ssp, '  Rollback planned assessment  ',
    'ca550000-0000-0000-0000-000000000001', array[v_b, v_a]);
  select * into v_campaign from public.assessment_campaigns where id = (v_answer->>'campaignId')::uuid;
  select * into v_plan from public.assessment_plan_revisions where id = (v_answer->>'planRevisionId')::uuid;
  if v_campaign.id is null or v_campaign.program_id <> v_program or v_campaign.status <> 'planned'
    or v_campaign.title <> 'Rollback planned assessment' or v_campaign.variant_system_id is not null then
    raise exception 'The planned campaign is not the program''s, planned, with the title given: %', to_jsonb(v_campaign);
  end if;
  if v_plan.id is null or v_plan.campaign_id <> v_campaign.id or v_plan.state <> 'draft'
    or v_plan.version_number <> 1 or v_plan.ssp_revision_id <> v_ssp or v_plan.title <> v_campaign.title then
    raise exception 'The campaign''s plan is not its first draft on the chosen SSP: %', to_jsonb(v_plan);
  end if;
  if (v_answer->>'added')::integer <> 2 or (v_answer->>'skipped')::integer <> 0
    or (select array_agg(o.control_id order by public.natural_sort_key(o.title), o.id) from pg_temp.objectives(v_plan.id) o) <> array[v_a, v_b] then
    raise exception 'The new plan does not hold one objective a chosen control: %', v_answer;
  end if;

  -- Sent again, it answers as it first did and plans nothing more; the id with another choice is refused.
  select count(*) into v_campaigns from public.assessment_campaigns where program_id = v_program;
  v_again := public.plan_control_assessment(v_tenant, v_program, v_ssp, 'Rollback planned assessment',
    'ca550000-0000-0000-0000-000000000001', array[v_a, v_b]);
  if v_again <> v_answer or (select count(*) from public.assessment_campaigns where program_id = v_program) <> v_campaigns then
    raise exception 'Planning sent again answered % and planned another campaign', v_again;
  end if;
  perform pg_temp.expect_error(format($f$select public.plan_control_assessment(%L, %L, %L, 'Another title', 'ca550000-0000-0000-0000-000000000001', array[%L]::uuid[])$f$,
    v_tenant, v_program, v_ssp, v_a), 'PT409');
  -- An SSP that is still a draft, one of another program's system, a blank title, a control the SSP
  -- does not select, and a program that is not there.
  perform pg_temp.expect_error(format($f$select public.plan_control_assessment(%L, %L, %L, 'Draft plan', 'ca550000-0000-0000-0000-000000000002', array[%L]::uuid[])$f$,
    v_tenant, v_program, current_setting('test.draft_ssp'), v_a), '23514');
  perform pg_temp.expect_error(format($f$select public.plan_control_assessment(%L, %L, %L, 'Elsewhere', 'ca550000-0000-0000-0000-000000000003', array[%L]::uuid[])$f$,
    v_tenant, v_program, current_setting('test.other_ssp'), v_a), '23514');
  perform pg_temp.expect_error(format($f$select public.plan_control_assessment(%L, %L, %L, '   ', 'ca550000-0000-0000-0000-000000000004', array[%L]::uuid[])$f$,
    v_tenant, v_program, v_ssp, v_a), '23514');
  perform pg_temp.expect_error(format($f$select public.plan_control_assessment(%L, %L, %L, 'Unselected', 'ca550000-0000-0000-0000-000000000005', array[%L]::uuid[])$f$,
    v_tenant, v_program, v_ssp, current_setting('test.unselected')), '23514');
  perform pg_temp.expect_error(format($f$select public.plan_control_assessment(%L, 'ca560000-0000-0000-0000-00000000dead', %L, 'Nowhere', 'ca550000-0000-0000-0000-000000000006', array[%L]::uuid[])$f$,
    v_tenant, v_ssp, v_a), 'PT404');
  if (select count(*) from public.assessment_campaigns where program_id = v_program) <> v_campaigns then
    raise exception 'A refused plan wrote a campaign';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Who may add or plan: a viewer of the workspace does neither, nor does a member of another
-- workspace in this one's name, nor a session with no account.
-- ---------------------------------------------------------------------------------------------
insert into public.tenant_memberships(tenant_id, user_id, role)
  values (current_setting('test.tenant')::uuid, 'ca500000-0000-0000-0000-000000000003', 'viewer');
select set_config('request.jwt.claim.sub', 'ca500000-0000-0000-0000-000000000003', true);
do $$ begin
  if current_setting('test.ready') <> 'true' then return; end if;
  perform pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, 'ca530000-0000-0000-0000-000000000001', 2, 'ca540000-0000-0000-0000-000000000011', array[%L]::uuid[])$f$,
    current_setting('test.tenant'), current_setting('test.c')), '42501');
  perform pg_temp.expect_error(format($f$select public.plan_control_assessment(%L, %L, %L, 'Viewer plan', 'ca550000-0000-0000-0000-000000000011', array[%L]::uuid[])$f$,
    current_setting('test.tenant'), current_setting('test.program'), current_setting('test.ssp'), current_setting('test.a')), '42501');
end $$;
select set_config('request.jwt.claim.sub', 'ca500000-0000-0000-0000-000000000002', true);
select public.ensure_personal_tenant() is not null as outsider_has_a_workspace;
do $$ begin
  if current_setting('test.ready') <> 'true' then return; end if;
  perform pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, 'ca530000-0000-0000-0000-000000000001', 2, 'ca540000-0000-0000-0000-000000000012', array[%L]::uuid[])$f$,
    current_setting('test.tenant'), current_setting('test.c')), '42501');
  perform pg_temp.expect_error(format($f$select public.plan_control_assessment(%L, %L, %L, 'Outsider plan', 'ca550000-0000-0000-0000-000000000012', array[%L]::uuid[])$f$,
    current_setting('test.tenant'), current_setting('test.program'), current_setting('test.ssp'), current_setting('test.a')), '42501');
end $$;
-- An outsider calling in its own workspace's name still cannot reach this workspace's plan.
do $$
declare v_own uuid := public.ensure_personal_tenant();
begin
  if current_setting('test.ready') <> 'true' then return; end if;
  perform pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, 'ca530000-0000-0000-0000-000000000001', 2, 'ca540000-0000-0000-0000-000000000013', array[%L]::uuid[])$f$,
    v_own, current_setting('test.c')), 'PT404');
  perform pg_temp.expect_error(format($f$select public.plan_control_assessment(%L, %L, %L, 'Outsider plan', 'ca550000-0000-0000-0000-000000000013', array[%L]::uuid[])$f$,
    v_own, current_setting('test.program'), current_setting('test.ssp'), current_setting('test.a')), 'PT404');
end $$;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  perform pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, 'ca530000-0000-0000-0000-000000000001', 2, 'ca540000-0000-0000-0000-000000000014', array[gen_random_uuid()])$f$,
    current_setting('test.tenant')), '42501');
end $$;
reset role;
set local role anon;
select pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, 'ca530000-0000-0000-0000-000000000001', 2, 'ca540000-0000-0000-0000-000000000015', array[gen_random_uuid()])$f$,
  current_setting('test.tenant')), '42501');
reset role;

-- The receipts: one a request that wrote, none for a refused one.
do $$ begin
  if current_setting('test.ready') <> 'true' then return; end if;
  if (select count(*) from public.assessment_plan_requests where tenant_id = current_setting('test.tenant')::uuid) <> 3 then
    raise exception 'Expected three receipts, found %',
      (select count(*) from public.assessment_plan_requests where tenant_id = current_setting('test.tenant')::uuid);
  end if;
end $$;

rollback;
