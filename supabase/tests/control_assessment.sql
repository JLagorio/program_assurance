-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Putting a control into an assessment from its record: add_controls_to_assessment_plan adds the
-- chosen controls to a campaign's draft plan at the plan revision the reader saw, and
-- plan_control_assessment plans a new campaign around them, each control as the assessment
-- objectives it counts (a control that counts none as its statement). What each writes and skips,
-- what a plan holds of a control (plan_control_holdings), what a request sent again answers, what
-- they refuse and from whom, that their receipts stay private, and that a finding on an objective
-- they wrote judges the control in its status and its trace. The checks of what they write need the
-- pinned references (a catalog and a reference baseline).
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
-- Who may call what: a signed-in member calls the two commands and the read; no client calls the
-- helpers that write or reads their receipts. The parts a plan holds are a security invoker read.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_command text;
begin
  foreach v_command in array array[
    'public.add_controls_to_assessment_plan(uuid, uuid, bigint, uuid, uuid[])',
    'public.plan_control_assessment(uuid, uuid, uuid, text, uuid, uuid[])',
    'public.plan_control_holdings(uuid, uuid, uuid[])'
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
    'public.assessment_control_choice(uuid[])',
    'public.assessment_objective_title(uuid)',
    'public.control_prose_words(uuid, text, integer)',
    'public.control_parameter_placeholder(uuid, text, integer)'
  ] loop
    if has_function_privilege('authenticated', v_command, 'execute') or has_function_privilege('anon', v_command, 'execute') then
      raise exception 'A client may execute the helper %', v_command;
    end if;
  end loop;
  foreach v_command in array array[
    'public.control_assessment_parts(uuid[])',
    'public.assessment_plan_control_parts(uuid[], uuid[])',
    'public.plan_control_holdings(uuid, uuid, uuid[])'
  ] loop
    if has_function_privilege('anon', v_command, 'execute')
      or (select p.prosecdef from pg_proc p where p.oid = v_command::regprocedure) then
      raise exception 'The read % is not a security invoker read for signed-in sessions', v_command;
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
select set_config('test.bare', '', true);

-- A program set up as the product sets one up, through create_program_wizard, with one system that
-- adopts a reference baseline with the tailoring given.
create function pg_temp.program(code text, catalog uuid, base uuid, tailoring jsonb) returns uuid language plpgsql as $$
declare created jsonb; profile uuid := gen_random_uuid();
begin
  created := public.create_program_wizard(current_setting('test.tenant')::uuid, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', code, 'name', code || ' control assessment test', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb,
    'catalogRevisionId', catalog,
    'profiles', jsonb_build_array(jsonb_build_object(
      'key', profile, 'baseResolutionId', base, 'tailoring', tailoring, 'parameters', '[]'::jsonb)),
    'systems', jsonb_build_array(jsonb_build_object(
      'key', gen_random_uuid(), 'code', code || '-SYS', 'name', code || ' system', 'description', '',
      'type', 'information_system', 'ownerPartyId', null,
      'confidentiality', 'low', 'integrity', 'low', 'availability', 'low',
      'categorizationRationale', 'A limited impact boundary for a rollback test.',
      'profileKey', profile, 'elements', '[]'::jsonb))));
  return (created->>'programId')::uuid;
end;
$$;
grant execute on function pg_temp.program(text, uuid, uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Two programs on the smallest reference baseline, each with its system's security plan
-- published. The first has a planned campaign with a draft plan, a completed campaign with a draft
-- plan, an active campaign whose plan is published, and a planned campaign whose draft plan holds a
-- control's statement, as every plan written before plans took objectives.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_base uuid; v_program uuid; v_other uuid; v_system uuid; v_ssp uuid; v_draft_ssp uuid;
  v_other_ssp uuid; v_resolution uuid; v_controls uuid[]; v_unselected uuid; v_bare uuid; v_c uuid; v_heading uuid;
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
  -- A control of the catalog with a statement and no assessment objective, which no baseline
  -- selects: SP 800-53 Rev 5 has two, CP-10(3) and SC-19, both withdrawn, so a baseline cannot
  -- include them. The first program's SSP baseline is given one below, with the triggers asleep.
  select a.control_id into v_bare
  from public.control_assessment_parts(array(
      select k.id from public.controls k where k.catalog_revision_id = v_catalog)) a
  where not a.objective
  order by a.control_id limit 1;
  v_program := pg_temp.program('ASSESS-ONE', v_catalog, v_base, '[]'::jsonb);
  v_other := pg_temp.program('ASSESS-OTHER', v_catalog, v_base, '[]'::jsonb);
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

  -- Two controls the plan's SSP selects that count assessment objectives, in code order; a third
  -- with a heading that prints nothing of its own over two or more of the objectives it counts,
  -- and others outside it; and one control of the catalog with a statement that it does not select.
  select array_agg(x.control_id order by x.code_order) into v_controls from (
    select distinct sc.control_id, k.code_order
    from public.selected_controls sc
    join public.catalog_control_rows k on k.id = sc.control_id
    where sc.profile_resolution_id = v_resolution
      and exists (select 1 from public.control_assessment_parts(array[sc.control_id]) a where a.objective)
    order by k.code_order limit 2
  ) x;
  select h.control_id, h.id into v_c, v_heading
  from public.selected_controls sc
  join public.catalog_control_rows k on k.id = sc.control_id
  join public.control_parts h on h.control_id = sc.control_id and h.name = 'assessment-objective' and h.parent_part_id is not null
  where sc.profile_resolution_id = v_resolution and sc.control_id <> all(coalesce(v_controls, '{}'))
    and not exists (select 1 from public.control_assessment_parts(array[sc.control_id]) a where a.part_id = h.id)
    and (select count(*) from public.control_assessment_parts(array[sc.control_id]) a where a.objective and h.id = any(a.above)) >= 2
    and exists (select 1 from public.control_assessment_parts(array[sc.control_id]) a where a.objective and not h.id = any(a.above))
  order by k.code_order, h.ordinal, h.id limit 1;
  select k.id into v_unselected from public.catalog_control_rows k
    where k.catalog_revision_id = v_catalog
      and not exists (select 1 from public.selected_controls sc where sc.profile_resolution_id = v_resolution and sc.control_id = k.id)
      and exists (select 1 from public.control_parts p where p.control_id = k.id and p.parent_part_id is null and p.name = 'statement')
    order by k.code_order limit 1;
  if cardinality(v_controls) < 2 or v_c is null or v_unselected is null then
    raise notice 'The baseline has too few controls with objectives: the checks of what the commands write were skipped';
    return;
  end if;

  insert into public.assessment_campaigns(id, tenant_id, title, program_id, status) values
    ('ca520000-0000-0000-0000-000000000001', v_tenant, 'Planned rollback campaign', v_program, 'planned'),
    ('ca520000-0000-0000-0000-000000000002', v_tenant, 'Completed rollback campaign', v_program, 'completed'),
    ('ca520000-0000-0000-0000-000000000003', v_tenant, 'Active rollback campaign', v_program, 'active'),
    ('ca520000-0000-0000-0000-000000000004', v_tenant, 'Statement rollback campaign', v_program, 'planned');
  insert into public.assessment_plan_revisions(id, tenant_id, version_number, campaign_id, ssp_revision_id, title) values
    ('ca530000-0000-0000-0000-000000000001', v_tenant, 1, 'ca520000-0000-0000-0000-000000000001', v_ssp, 'Planned rollback plan'),
    ('ca530000-0000-0000-0000-000000000002', v_tenant, 1, 'ca520000-0000-0000-0000-000000000002', v_ssp, 'Completed rollback plan'),
    ('ca530000-0000-0000-0000-000000000003', v_tenant, 1, 'ca520000-0000-0000-0000-000000000003', v_ssp, 'Active rollback plan'),
    ('ca530000-0000-0000-0000-000000000004', v_tenant, 1, 'ca520000-0000-0000-0000-000000000004', v_ssp, 'Statement rollback plan');
  update public.assessment_plan_revisions set state = 'published', published_at = now(), revision = revision + 1
    where id = 'ca530000-0000-0000-0000-000000000003';
  -- The fourth plan holds the first control as plans held a control before: one objective aimed
  -- at its statement.
  insert into public.assessment_objectives(tenant_id, plan_revision_id, title, target_control_part_id)
    select v_tenant, 'ca530000-0000-0000-0000-000000000004', k.code || ' ' || k.title, p.id
    from public.controls k
    join public.control_parts p on p.control_id = k.id and p.parent_part_id is null and p.name = 'statement'
    where k.id = v_controls[1];

  perform set_config('test.program', v_program::text, true);
  perform set_config('test.other_program', v_other::text, true);
  perform set_config('test.ssp', v_ssp::text, true);
  perform set_config('test.draft_ssp', v_draft_ssp::text, true);
  perform set_config('test.other_ssp', v_other_ssp::text, true);
  perform set_config('test.a', v_controls[1]::text, true);
  perform set_config('test.b', v_controls[2]::text, true);
  perform set_config('test.c', v_c::text, true);
  perform set_config('test.heading', v_heading::text, true);
  perform set_config('test.unselected', v_unselected::text, true);
  perform set_config('test.resolution', v_resolution::text, true);
  if v_bare is not null then
    perform set_config('test.bare', v_bare::text, true);
  else
    raise notice 'The catalog has no control with a statement and no objective: those checks were skipped';
  end if;
  perform set_config('test.ready', 'true', true);
end $$;

-- The SSP's baseline selects the control with no objective, given it here with the triggers asleep
-- for that one row: a resolved baseline does not change, and the row rolls back with the rest.
reset role;
set local session_replication_role = replica;
insert into public.selected_controls(tenant_id, profile_resolution_id, control_id, ordinal)
  select r.tenant_id, r.id, current_setting('test.bare')::uuid,
    (select coalesce(max(sc.ordinal), 0) + 1 from public.selected_controls sc where sc.profile_resolution_id = r.id)
  from public.profile_resolutions r
  where current_setting('test.bare') <> '' and r.id = nullif(current_setting('test.resolution', true), '')::uuid;
set local session_replication_role = origin;
set local role authenticated;

-- One plan's objectives, by the control and the part each is aimed at, in the order the command
-- answered them: the controls' code order, then each control's reading order.
create function pg_temp.objectives(plan uuid) returns table (id uuid, control_id uuid, part_id uuid, title text, part_name text, top boolean)
language sql stable as $$
  select o.id, p.control_id, p.id, o.title, p.name, p.parent_part_id is null
  from public.assessment_objectives o
  join public.control_parts p on p.id = o.target_control_part_id
  join public.controls k on k.id = p.control_id
  left join public.control_assessment_parts(array[p.control_id]) a on a.part_id = p.id
  where o.plan_revision_id = plan
  order by public.natural_sort_key(k.code) collate "C", a.place nulls first, o.id;
$$;
grant execute on function pg_temp.objectives(uuid) to authenticated;

-- The objectives a control counts, in reading order, as program_control_objectives lists them.
create function pg_temp.counted(program uuid, control uuid) returns uuid[] language sql stable as $$
  select coalesce(array_agg((o->>'id')::uuid order by n), '{}')
  from jsonb_array_elements(public.program_control_objectives(program, control)->'objectives') with ordinality as x(o, n);
$$;
grant execute on function pg_temp.counted(uuid, uuid) to authenticated;

-- What plan_control_holdings answers of one plan.
create function pg_temp.holding(control uuid, plan uuid) returns jsonb language sql stable as $$
  select coalesce((select p from jsonb_array_elements(public.plan_control_holdings(
    current_setting('test.tenant')::uuid, control, array[plan])->'plans') p
    where p->>'plan_revision_id' = plan::text), 'null'::jsonb);
$$;
grant execute on function pg_temp.holding(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Add to assessment campaign.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_program uuid := current_setting('test.program')::uuid;
  v_plan uuid := 'ca530000-0000-0000-0000-000000000001';
  v_a uuid; v_b uuid; v_c uuid; v_answer jsonb; v_again jsonb; v_objectives record;
  v_counted_a uuid[]; v_counted_b uuid[]; v_counted_c uuid[]; v_under uuid[]; v_outside uuid; v_held integer;
begin
  if current_setting('test.ready') <> 'true' then return; end if;
  v_a := current_setting('test.a')::uuid; v_b := current_setting('test.b')::uuid; v_c := current_setting('test.c')::uuid;
  v_counted_a := pg_temp.counted(v_program, v_a);
  v_counted_b := pg_temp.counted(v_program, v_b);
  v_counted_c := pg_temp.counted(v_program, v_c);

  -- Before anything is added: the control counts its objectives and the plan holds none of them.
  if (public.plan_control_holdings(v_tenant, v_a, array[v_plan])->>'objectives')::integer <> cardinality(v_counted_a)
    or pg_temp.holding(v_a, v_plan) <> jsonb_build_object('plan_revision_id', v_plan, 'objectives_held', 0, 'holds', false) then
    raise exception 'An empty plan answered %', public.plan_control_holdings(v_tenant, v_a, array[v_plan]);
  end if;

  -- Two controls, chosen second first: each as the objectives it counts, one plan objective each,
  -- the list program_control_objectives gives in its order, titled by the objective's label and
  -- text and aimed at its part, the first control's before the second's.
  v_answer := public.add_controls_to_assessment_plan(v_tenant, v_plan, 1, 'ca540000-0000-0000-0000-000000000001', array[v_b, v_a]);
  if (v_answer->>'added')::integer <> cardinality(v_counted_a) + cardinality(v_counted_b)
    or (v_answer->>'skipped')::integer <> 0
    or (v_answer->>'counted')::integer <> cardinality(v_counted_a) + cardinality(v_counted_b)
    or v_answer->>'planRevisionId' <> v_plan::text
    or v_answer->>'campaignId' <> 'ca520000-0000-0000-0000-000000000001'
    or jsonb_array_length(v_answer->'objectiveIds') <> cardinality(v_counted_a) + cardinality(v_counted_b) then
    raise exception 'The command did not answer with what it added: %', v_answer;
  end if;
  -- A title is the objective's label and its text in one line: the closing punctuation left off,
  -- and each parameter as its placeholder.
  select array_agg(o.part_id order by n) as parts,
    bool_and(o.part_name = 'assessment-objective') as aimed,
    bool_and(case when p.prose ~ '\{\{' then o.title like l.label || ' %' and o.title ~ '\[(Assignment|Selection)' and o.title !~ '\{\{'
      else o.title = l.label || ' ' || regexp_replace(btrim(regexp_replace(
        regexp_replace(p.prose, '^\s*determine if:', '', 'i'), '\s+', ' ', 'g')), '\s*(?:[;,]\s*(?:and|or)|[;,.:])$', '', 'i')
      end) as titled,
    jsonb_agg(o.id order by n) as ids
    into v_objectives
    from pg_temp.objectives(v_plan) with ordinality as o(id, control_id, part_id, title, part_name, top, n)
    join public.control_parts p on p.id = o.part_id
    cross join lateral (select x->>'value' as label from jsonb_array_elements(p.props) x where x->>'name' = 'label' limit 1) l;
  if v_objectives.parts <> v_counted_a || v_counted_b or not v_objectives.aimed or not v_objectives.titled
    or v_objectives.ids <> v_answer->'objectiveIds' then
    raise exception 'The objectives are not each objective the controls count, titled by label and text, in order: %', to_jsonb(v_objectives);
  end if;
  if exists (select 1 from public.assessment_objectives o where o.plan_revision_id = v_plan
      and (o.created_by <> 'ca500000-0000-0000-0000-000000000001' or o.description is not null or o.requirement_revision_id is not null)) then
    raise exception 'An objective was not stamped with its author, or says more than its objective';
  end if;
  if pg_temp.holding(v_a, v_plan) <> jsonb_build_object('plan_revision_id', v_plan, 'objectives_held', cardinality(v_counted_a), 'holds', true) then
    raise exception 'The plan does not hold the control it took whole: %', pg_temp.holding(v_a, v_plan);
  end if;

  -- The same request sent again, the controls in another order and one twice, answers as it first
  -- did and adds nothing, even once the plan has changed since.
  update public.assessment_plan_revisions set description = 'Edited after the first request', revision = revision + 1 where id = v_plan;
  v_again := public.add_controls_to_assessment_plan(v_tenant, v_plan, 1, 'ca540000-0000-0000-0000-000000000001', array[v_a, v_b, v_a]);
  if v_again <> v_answer or (select count(*) from public.assessment_objectives o where o.plan_revision_id = v_plan)
      <> cardinality(v_counted_a) + cardinality(v_counted_b) then
    raise exception 'The request sent again answered % and left % objectives', v_again,
      (select count(*) from public.assessment_objectives o where o.plan_revision_id = v_plan);
  end if;

  -- A plan that holds some of a control's objectives: one aimed at a heading that prints nothing of
  -- its own holds the objectives under it, and one aimed at an objective outside it holds that one.
  select array_agg(a.part_id order by a.place) into v_under
    from public.control_assessment_parts(array[v_c]) a where a.objective and current_setting('test.heading')::uuid = any(a.above);
  select a.part_id into v_outside from public.control_assessment_parts(array[v_c]) a
    where a.objective and not current_setting('test.heading')::uuid = any(a.above) order by a.place limit 1;
  insert into public.assessment_objectives(tenant_id, plan_revision_id, title, target_control_part_id) values
    (v_tenant, v_plan, 'An assessor''s own objective over a heading', current_setting('test.heading')::uuid),
    (v_tenant, v_plan, 'An assessor''s own objective', v_outside);
  v_held := cardinality(v_under) + 1;
  if pg_temp.holding(v_c, v_plan) <> jsonb_build_object('plan_revision_id', v_plan, 'objectives_held', v_held, 'holds', false) then
    raise exception 'A plan holding part of a control answered %, not % held', pg_temp.holding(v_c, v_plan), v_held;
  end if;
  -- A new request at the plan's new revision: the control it holds whole is skipped, and the one it
  -- holds in part takes only the rest, in reading order.
  v_answer := public.add_controls_to_assessment_plan(v_tenant, v_plan, 2, 'ca540000-0000-0000-0000-000000000002', array[v_a, v_c]);
  if (v_answer->>'added')::integer <> cardinality(v_counted_c) - v_held or (v_answer->>'skipped')::integer <> 1
    or (v_answer->>'counted')::integer <> cardinality(v_counted_a) + cardinality(v_counted_c)
    or (select array_agg(o.target_control_part_id order by n) from jsonb_array_elements_text(v_answer->'objectiveIds') with ordinality as x(id, n)
        join public.assessment_objectives o on o.id = x.id::uuid)
      <> array(select x from unnest(v_counted_c) with ordinality as u(x, n) where x <> all(v_under || v_outside) order by n) then
    raise exception 'A held control was not skipped and the rest of the other added: %', v_answer;
  end if;
  if pg_temp.holding(v_c, v_plan) <> jsonb_build_object('plan_revision_id', v_plan, 'objectives_held', cardinality(v_counted_c), 'holds', true)
    or (select count(*) from public.assessment_objectives o where o.plan_revision_id = v_plan)
      <> cardinality(v_counted_a) + cardinality(v_counted_b) + cardinality(v_counted_c) - cardinality(v_under) + 1 then
    raise exception 'The plan does not hold the rest of the control: %', pg_temp.holding(v_c, v_plan);
  end if;

  -- A plan that holds a control's statement holds the whole control, whatever objectives it counts.
  if pg_temp.holding(v_a, 'ca530000-0000-0000-0000-000000000004')
      <> jsonb_build_object('plan_revision_id', 'ca530000-0000-0000-0000-000000000004', 'objectives_held', cardinality(v_counted_a), 'holds', true) then
    raise exception 'A plan holding the statement answered %', pg_temp.holding(v_a, 'ca530000-0000-0000-0000-000000000004');
  end if;
  v_answer := public.add_controls_to_assessment_plan(v_tenant, 'ca530000-0000-0000-0000-000000000004', 1,
    'ca540000-0000-0000-0000-000000000016', array[v_a]);
  if (v_answer->>'added')::integer <> 0 or (v_answer->>'skipped')::integer <> 1
    or (v_answer->>'counted')::integer <> cardinality(v_counted_a) or v_answer->'objectiveIds' <> '[]'::jsonb then
    raise exception 'A plan holding the statement took more of the control: %', v_answer;
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
  if (select count(*) from public.assessment_objectives o where o.plan_revision_id = v_plan)
      <> cardinality(v_counted_a) + cardinality(v_counted_b) + cardinality(v_counted_c) - cardinality(v_under) + 1
    or exists (select 1 from public.assessment_objectives o where o.plan_revision_id in
      ('ca530000-0000-0000-0000-000000000002', 'ca530000-0000-0000-0000-000000000003')) then
    raise exception 'A refused request wrote an objective';
  end if;
  -- A client never calls the helpers that write the objectives and their titles.
  perform pg_temp.expect_error(format($f$select public.add_control_objectives(%L, %L, %L, array[%L]::uuid[])$f$,
    v_tenant, v_plan, gen_random_uuid(), v_a), '42501');
  perform pg_temp.expect_error(format($f$select public.assessment_objective_title(%L)$f$, v_outside), '42501');
end $$;

-- ---------------------------------------------------------------------------------------------
-- A control that counts no assessment objective joins a plan as its statement, as before.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_plan uuid := 'ca530000-0000-0000-0000-000000000004';
  v_bare uuid; v_answer jsonb; v_objective record;
begin
  if current_setting('test.ready') <> 'true' or current_setting('test.bare') = '' then return; end if;
  v_bare := current_setting('test.bare')::uuid;
  if (public.plan_control_holdings(v_tenant, v_bare, array[v_plan])->>'objectives')::integer <> 0
    or pg_temp.holding(v_bare, v_plan) <> jsonb_build_object('plan_revision_id', v_plan, 'objectives_held', 0, 'holds', false) then
    raise exception 'A control with no objective answered %', public.plan_control_holdings(v_tenant, v_bare, array[v_plan]);
  end if;
  v_answer := public.add_controls_to_assessment_plan(v_tenant, v_plan, 1, 'ca540000-0000-0000-0000-000000000017', array[v_bare]);
  select o.* into v_objective from pg_temp.objectives(v_plan) o where o.control_id = v_bare;
  if (v_answer->>'added')::integer <> 1 or (v_answer->>'skipped')::integer <> 0 or (v_answer->>'counted')::integer <> 0
    or v_answer->'objectiveIds' <> jsonb_build_array(v_objective.id)
    or v_objective.part_name <> 'statement' or not v_objective.top
    or v_objective.title <> (select k.code || ' ' || k.title from public.controls k where k.id = v_bare) then
    raise exception 'A control with no objective was not written as its statement: % %', v_answer, to_jsonb(v_objective);
  end if;
  if pg_temp.holding(v_bare, v_plan) <> jsonb_build_object('plan_revision_id', v_plan, 'objectives_held', 0, 'holds', true) then
    raise exception 'The plan does not hold the control by its statement: %', pg_temp.holding(v_bare, v_plan);
  end if;
  -- Asked again in a new request, it is held and takes nothing more.
  v_answer := public.add_controls_to_assessment_plan(v_tenant, v_plan, 1, 'ca540000-0000-0000-0000-000000000018', array[v_bare]);
  if (v_answer->>'added')::integer <> 0 or (v_answer->>'skipped')::integer <> 1
    or (select count(*) from public.assessment_objectives o where o.plan_revision_id = v_plan) <> 2 then
    raise exception 'A control held by its statement took another objective: %', v_answer;
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Plan an assessment.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_program uuid; v_ssp uuid; v_a uuid; v_b uuid; v_answer jsonb; v_again jsonb;
  v_campaign public.assessment_campaigns; v_plan public.assessment_plan_revisions;
  v_campaigns integer; v_counted integer;
begin
  if current_setting('test.ready') <> 'true' then return; end if;
  v_program := current_setting('test.program')::uuid; v_ssp := current_setting('test.ssp')::uuid;
  v_a := current_setting('test.a')::uuid; v_b := current_setting('test.b')::uuid;
  v_counted := cardinality(pg_temp.counted(v_program, v_a)) + cardinality(pg_temp.counted(v_program, v_b));

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
  if (v_answer->>'added')::integer <> v_counted or (v_answer->>'skipped')::integer <> 0 or (v_answer->>'counted')::integer <> v_counted
    or (select array_agg(o.part_id order by n) from pg_temp.objectives(v_plan.id) with ordinality as o(id, control_id, part_id, title, part_name, top, n))
      <> pg_temp.counted(v_program, v_a) || pg_temp.counted(v_program, v_b)
    or pg_temp.holding(v_a, v_plan.id)->>'holds' <> 'true' or pg_temp.holding(v_b, v_plan.id)->>'holds' <> 'true' then
    raise exception 'The new plan does not hold each objective the chosen controls count: %', v_answer;
  end if;
  perform set_config('test.planned_plan', v_plan.id::text, true);

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

  -- A control that counts no objective plans as its statement.
  if current_setting('test.bare') <> '' then
    v_answer := public.plan_control_assessment(v_tenant, v_program, v_ssp, 'Statement assessment',
      'ca550000-0000-0000-0000-000000000007', array[current_setting('test.bare')::uuid]);
    if (v_answer->>'added')::integer <> 1 or (v_answer->>'counted')::integer <> 0
      or (select array_agg(o.part_name) from pg_temp.objectives((v_answer->>'planRevisionId')::uuid) o) <> array['statement'] then
      raise exception 'A control with no objective did not plan as its statement: %', v_answer;
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- A finding on an objective the plan holds judges the control: its status reads the determination
-- once the results are published, and its trace reaches the finding, which reaches the control.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_program uuid; v_a uuid; v_plan uuid; v_part uuid; v_results uuid := gen_random_uuid(); v_set uuid;
  v_finding uuid := gen_random_uuid(); v_line jsonb;
begin
  if current_setting('test.ready') <> 'true' then return; end if;
  v_program := current_setting('test.program')::uuid; v_a := current_setting('test.a')::uuid;
  v_plan := current_setting('test.planned_plan')::uuid;
  select o.target_control_part_id into v_part
    from public.assessment_objectives o join public.control_parts p on p.id = o.target_control_part_id
    where o.plan_revision_id = v_plan and p.control_id = v_a and p.name = 'assessment-objective'
    order by o.title limit 1;
  update public.assessment_plan_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_plan;
  insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title)
    values (v_results, v_tenant, 1, v_plan, 'Objective results');
  insert into public.result_sets(tenant_id, assessment_results_revision_id, title) values (v_tenant, v_results, 'Objective set') returning id into v_set;
  insert into public.assessment_findings(id, tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at)
    values (v_finding, v_tenant, v_results, v_set, v_part, 'One objective judged', 'other_than_satisfied', now());
  select c into v_line from jsonb_array_elements(public.program_control_status(v_program)->'controls') c where c->>'id' = v_a::text;
  if v_line->>'status' = 'other_than_satisfied' then
    raise exception 'A finding of draft results decided the control: %', v_line;
  end if;
  update public.assessment_results_revisions set state = 'published', published_at = now(), revision = revision + 1 where id = v_results;
  select c into v_line from jsonb_array_elements(public.program_control_status(v_program)->'controls') c where c->>'id' = v_a::text;
  if v_line->>'status' <> 'other_than_satisfied' or v_line->>'determined_by' <> 'program' then
    raise exception 'A finding on one of the control''s objectives did not judge it: %', v_line;
  end if;
  if not exists (select 1 from jsonb_array_elements(public.assurance_trace(v_tenant, 'control', v_a, v_program)->'findings') f
      where f->>'id' = v_finding::text)
    or not exists (select 1 from jsonb_array_elements(public.assurance_trace(v_tenant, 'finding', v_finding, null)->'controls') c
      where c->>'id' = v_a::text) then
    raise exception 'The trace does not join the control and the finding on its objective';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Who may add, plan or read what a plan holds: a viewer of the workspace reads but adds and plans
-- nothing, a member of another workspace does none of it in this one's name, nor a session with
-- no account.
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
  if pg_temp.holding(current_setting('test.a')::uuid, 'ca530000-0000-0000-0000-000000000001')->>'holds' <> 'true' then
    raise exception 'A viewer does not read what a plan holds';
  end if;
end $$;
select set_config('request.jwt.claim.sub', 'ca500000-0000-0000-0000-000000000002', true);
select public.ensure_personal_tenant() is not null as outsider_has_a_workspace;
do $$ begin
  if current_setting('test.ready') <> 'true' then return; end if;
  perform pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, 'ca530000-0000-0000-0000-000000000001', 2, 'ca540000-0000-0000-0000-000000000012', array[%L]::uuid[])$f$,
    current_setting('test.tenant'), current_setting('test.c')), '42501');
  perform pg_temp.expect_error(format($f$select public.plan_control_assessment(%L, %L, %L, 'Outsider plan', 'ca550000-0000-0000-0000-000000000012', array[%L]::uuid[])$f$,
    current_setting('test.tenant'), current_setting('test.program'), current_setting('test.ssp'), current_setting('test.a')), '42501');
  perform pg_temp.expect_error(format($f$select public.plan_control_holdings(%L, %L, array['ca530000-0000-0000-0000-000000000001']::uuid[])$f$,
    current_setting('test.tenant'), current_setting('test.a')), '42501');
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
  if public.plan_control_holdings(v_own, current_setting('test.a')::uuid, array['ca530000-0000-0000-0000-000000000001']::uuid[])->'plans' <> '[]'::jsonb then
    raise exception 'An outsider read what another workspace''s plan holds';
  end if;
end $$;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  perform pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, 'ca530000-0000-0000-0000-000000000001', 2, 'ca540000-0000-0000-0000-000000000014', array[gen_random_uuid()])$f$,
    current_setting('test.tenant')), '42501');
  perform pg_temp.expect_error(format($f$select public.plan_control_holdings(%L, gen_random_uuid(), '{}'::uuid[])$f$,
    current_setting('test.tenant')), '42501');
end $$;
reset role;
set local role anon;
select pg_temp.expect_error(format($f$select public.add_controls_to_assessment_plan(%L, 'ca530000-0000-0000-0000-000000000001', 2, 'ca540000-0000-0000-0000-000000000015', array[gen_random_uuid()])$f$,
  current_setting('test.tenant')), '42501');
select pg_temp.expect_error(format($f$select public.plan_control_holdings(%L, gen_random_uuid(), '{}'::uuid[])$f$,
  current_setting('test.tenant')), '42501');
reset role;

-- The receipts: one a request that answered, none for a refused one.
do $$
declare v_expected integer;
begin
  if current_setting('test.ready') <> 'true' then return; end if;
  -- Add: the first choice, the rest of a control, the statement plan; plan: the first assessment.
  -- With a control that counts no objective: its add, its add again and its planned assessment.
  v_expected := 4 + case when current_setting('test.bare') <> '' then 3 else 0 end;
  if (select count(*) from public.assessment_plan_requests where tenant_id = current_setting('test.tenant')::uuid) <> v_expected then
    raise exception 'Expected % receipts, found %', v_expected,
      (select count(*) from public.assessment_plan_requests where tenant_id = current_setting('test.tenant')::uuid);
  end if;
end $$;

rollback;
