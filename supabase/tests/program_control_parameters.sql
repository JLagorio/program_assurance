-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- A program's values for the parameters of one control: who may ask, what a program without a
-- control baseline answers and, with the pinned references installed (the catalog that holds AC-1
-- and a reference baseline that selects it), what a program answers through its stack: the
-- catalog's own value, a tailoring that sets a value over it, nothing set, a layer beneath that
-- still answers, several stacks answered one by one, and a control the baseline leaves out.
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
  if has_function_privilege('anon', 'public.program_control_parameters(uuid, uuid)', 'execute')
    or has_function_privilege('public', 'public.program_control_parameters(uuid, uuid)', 'execute') then
    raise exception 'An anonymous session may execute program_control_parameters';
  end if;
  if not has_function_privilege('authenticated', 'public.program_control_parameters(uuid, uuid)', 'execute') then
    raise exception 'A signed-in session may not execute program_control_parameters';
  end if;
  if (select p.prosecdef from pg_catalog.pg_proc p where p.oid = 'public.program_control_parameters(uuid, uuid)'::regprocedure) then
    raise exception 'program_control_parameters does not run as its caller';
  end if;
end $$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('a5250000-0000-0000-0000-000000000001', 'parameters-owner@example.test', '{"name":"Parameters test owner"}'),
  ('a5250000-0000-0000-0000-000000000002', 'parameters-outsider@example.test', '{}');
select set_config('request.jwt.claim.sub', 'a5250000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.programs(id, tenant_id, code, name) values
  ('b5250000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'PARAMETERS-BARE', 'Program with no control baseline');

-- A program with no control baseline selects no control: no stack answers, whatever the control.
do $$ begin
  if public.program_control_parameters('b5250000-0000-0000-0000-000000000001', gen_random_uuid())
    is distinct from '{"selected": false, "stacks": []}'::jsonb then
    raise exception 'A program with no baseline answered %',
      public.program_control_parameters('b5250000-0000-0000-0000-000000000001', gen_random_uuid());
  end if;
end $$;

-- A program the reader cannot read is refused, never answered as selecting nothing: one that does
-- not exist, any program for a session with no account, and another workspace's program.
select pg_temp.expect_error($$select public.program_control_parameters('b5250000-0000-0000-0000-00000000dead', gen_random_uuid())$$, '42501');
select pg_temp.expect_error($$select public.program_control_parameters(null, gen_random_uuid())$$, '42501');
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$select public.program_control_parameters('b5250000-0000-0000-0000-000000000001', gen_random_uuid())$$, '42501');
set local role anon;
select pg_temp.expect_error($$select public.program_control_parameters('b5250000-0000-0000-0000-000000000001', gen_random_uuid())$$, '42501');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5250000-0000-0000-0000-000000000002', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
select pg_temp.expect_error($$select public.program_control_parameters('b5250000-0000-0000-0000-000000000001', gen_random_uuid())$$, '42501');
select set_config('request.jwt.claim.sub', 'a5250000-0000-0000-0000-000000000001', true);

-- ---------------------------------------------------------------------------------------------
-- With the pinned references installed. The catalog gives AC-1's parameters no values of its own,
-- so one is given one here, with the triggers asleep for that row: a published catalog does not
-- change, and the row rolls back with the rest.
-- ---------------------------------------------------------------------------------------------
reset role;
set local session_replication_role = replica;
insert into public.parameter_values(parameter_id, ordinal, value)
  select p.id, 0, 'annually'
  from public.parameters p
  where p.source_id = 'ac-01_odp.07'
    and p.catalog_revision_id = (
      select c.catalog_revision_id
      from public.controls c join public.catalog_revisions r on r.id = c.catalog_revision_id
      where c.tenant_id is null and c.source_id = 'ac-1' and c.status = 'active' and r.state = 'published'
      order by r.created_at desc limit 1);
set local session_replication_role = origin;
set local role authenticated;

-- One of AC-1's parameters set to some values, as a tailoring names it.
create function pg_temp.setting(catalog uuid, source text, parameter_values jsonb) returns jsonb language sql stable as $$
  select jsonb_build_object('parameterId', p.id, 'values', parameter_values, 'rationale', 'Set for the parameter test.')
  from public.parameters p where p.catalog_revision_id = catalog and p.source_id = source;
$$;
-- A program with the profiles given, set up as the product sets one up, and the program's id.
create function pg_temp.program(code text, catalog uuid, profiles jsonb) returns uuid language plpgsql as $$
declare created jsonb;
begin
  created := public.create_program_wizard(current_setting('test.tenant')::uuid, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', code, 'name', code || ' parameter test', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb,
    'catalogRevisionId', catalog, 'profiles', profiles,
    'systems', jsonb_build_array(jsonb_build_object(
      'key', gen_random_uuid(), 'code', code || '-SYS', 'name', code || ' system', 'description', '',
      'type', 'information_system', 'ownerPartyId', null,
      'confidentiality', 'low', 'integrity', 'low', 'availability', 'low',
      'categorizationRationale', 'A limited impact boundary for a rollback test.',
      'profileKey', profiles->0->>'key', 'elements', '[]'::jsonb))));
  return (created->>'programId')::uuid;
end;
$$;
-- One parameter of a stack's answer, by the parameter's source id.
create function pg_temp.entry(stack jsonb, source text) returns jsonb language sql stable as $$
  select e - 'parameter_id'
  from jsonb_array_elements(stack->'parameters') e
  join public.parameters p on p.id = (e->>'parameter_id')::uuid
  where p.source_id = source;
$$;
-- A resolution's profile, by title: how the answer names a stack and a tailoring.
create function pg_temp.profile_title(resolution uuid) returns text language sql stable as $$
  select coalesce(f.title, v.title)
  from public.profile_resolutions r
  join public.profile_revisions v on v.id = r.profile_revision_id
  left join public.profiles f on f.id = v.profile_id
  where r.id = resolution;
$$;
grant execute on function pg_temp.setting(uuid, text, jsonb), pg_temp.program(text, uuid, jsonb),
  pg_temp.entry(jsonb, text), pg_temp.profile_title(uuid) to authenticated;

do $$
declare
  v_catalog uuid; v_control uuid; v_left_out uuid; v_base uuid; v_top uuid; v_layered_top uuid;
  v_plain uuid; v_tailored uuid; v_layered uuid; v_two uuid; v_excluding uuid;
  v_parameters integer; v_answer jsonb; v_stack jsonb; v_expected jsonb;
begin
  select c.id, c.catalog_revision_id into v_control, v_catalog
  from public.controls c join public.catalog_revisions r on r.id = c.catalog_revision_id
  where c.tenant_id is null and c.source_id = 'ac-1' and c.status = 'active' and r.state = 'published'
  order by r.created_at desc limit 1;
  -- The smallest reference baseline on that catalog that selects AC-1.
  select r.id into v_base
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and i.catalog_revision_id = v_catalog
    and exists (select 1 from public.selected_controls sc where sc.profile_resolution_id = r.id and sc.control_id = v_control)
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  select count(*) into v_parameters from public.parameters p where p.control_id = v_control;
  if v_control is null or v_base is null
    or (select count(*) from public.parameters p where p.control_id = v_control
      and p.source_id in ('ac-01_odp.05', 'ac-01_odp.06', 'ac-01_odp.07')) <> 3
    or not exists (select 1 from public.parameter_values v join public.parameters p on p.id = v.parameter_id
      where p.control_id = v_control and p.source_id = 'ac-01_odp.07') then
    raise notice 'The pinned references are not installed: the checks of a program''s values were skipped';
    return;
  end if;
  -- A control of the catalog that baseline leaves out.
  select c.id into v_left_out
  from public.controls c
  where c.catalog_revision_id = v_catalog and c.status = 'active'
    and not exists (select 1 from public.selected_controls sc where sc.profile_resolution_id = v_base and sc.control_id = c.id)
  order by c.source_id limit 1;

  -- The baseline as it comes: one stack, the reference baseline, every parameter of the control
  -- answered. The catalog's own value stands where it has one, and the rest have none.
  v_plain := pg_temp.program('PCP-PLAIN', v_catalog, jsonb_build_array(jsonb_build_object(
    'key', gen_random_uuid(), 'baseResolutionId', v_base, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)));
  v_answer := public.program_control_parameters(v_plain, v_control);
  v_stack := v_answer->'stacks'->0;
  if v_answer->'selected' is distinct from 'true'::jsonb or jsonb_array_length(v_answer->'stacks') <> 1
    or v_stack->>'resolution_id' is distinct from v_base::text
    or v_stack->>'title' is distinct from pg_temp.profile_title(v_base)
    or v_stack->>'choice_id' is distinct from (select c.id::text from public.program_reference_choices c where c.program_id = v_plain)
    or jsonb_array_length(v_stack->'parameters') <> v_parameters then
    raise exception 'The baseline as it comes answered %', v_answer;
  end if;
  if pg_temp.entry(v_stack, 'ac-01_odp.07') is distinct from '{"values": ["annually"], "source": {"kind": "catalog"}, "rationale": null}'::jsonb
    or pg_temp.entry(v_stack, 'ac-01_odp.05') is distinct from '{"values": [], "source": null, "rationale": null}'::jsonb then
    raise exception 'The baseline as it comes answered its parameters as %', v_stack->'parameters';
  end if;
  -- A control the baseline leaves out has no values in the program.
  if public.program_control_parameters(v_plain, v_left_out) is distinct from '{"selected": false, "stacks": []}'::jsonb then
    raise exception 'A control the baseline leaves out answered %', public.program_control_parameters(v_plain, v_left_out);
  end if;

  -- A tailoring that sets two of the parameters: its values stand, over the catalog's own, named
  -- by the tailoring with its rationale; what it leaves alone keeps what the catalog says.
  v_tailored := pg_temp.program('PCP-TAILORED', v_catalog, jsonb_build_array(jsonb_build_object(
    'key', gen_random_uuid(), 'baseResolutionId', v_base, 'tailoring', '[]'::jsonb, 'parameters', jsonb_build_array(
      pg_temp.setting(v_catalog, 'ac-01_odp.05', '["monthly"]'::jsonb),
      pg_temp.setting(v_catalog, 'ac-01_odp.07', '["quarterly"]'::jsonb)))));
  select c.profile_resolution_id into v_top from public.program_reference_choices c where c.program_id = v_tailored;
  v_stack := public.program_control_parameters(v_tailored, v_control)->'stacks'->0;
  if v_stack->>'resolution_id' is distinct from v_top::text or v_stack->>'title' is distinct from pg_temp.profile_title(v_top)
    or pg_temp.entry(v_stack, 'ac-01_odp.05') is distinct from jsonb_build_object('values', '["monthly"]'::jsonb,
      'source', jsonb_build_object('kind', 'tailoring', 'title', pg_temp.profile_title(v_top), 'resolution_id', v_top),
      'rationale', 'Set for the parameter test.')
    or pg_temp.entry(v_stack, 'ac-01_odp.07')->'values' is distinct from '["quarterly"]'::jsonb
    or pg_temp.entry(v_stack, 'ac-01_odp.07')->'source'->>'kind' is distinct from 'tailoring'
    or pg_temp.entry(v_stack, 'ac-01_odp.06') is distinct from '{"values": [], "source": null, "rationale": null}'::jsonb then
    raise exception 'A tailored stack answered %', v_stack;
  end if;

  -- A layer on that stack that sets a third, with two values: the top layer's values in their
  -- order, and the layer beneath still answering for what it set, named as that layer.
  v_layered := pg_temp.program('PCP-LAYERED', v_catalog, jsonb_build_array(jsonb_build_object(
    'key', gen_random_uuid(), 'baseResolutionId', v_top, 'tailoring', '[]'::jsonb, 'parameters', jsonb_build_array(
      pg_temp.setting(v_catalog, 'ac-01_odp.06', '["a significant change", "an audit finding"]'::jsonb)))));
  select c.profile_resolution_id into v_layered_top from public.program_reference_choices c where c.program_id = v_layered;
  v_stack := public.program_control_parameters(v_layered, v_control)->'stacks'->0;
  if v_stack->>'title' is distinct from pg_temp.profile_title(v_layered_top)
    or pg_temp.entry(v_stack, 'ac-01_odp.06') is distinct from jsonb_build_object(
      'values', '["a significant change", "an audit finding"]'::jsonb,
      'source', jsonb_build_object('kind', 'tailoring', 'title', pg_temp.profile_title(v_layered_top), 'resolution_id', v_layered_top),
      'rationale', 'Set for the parameter test.')
    or pg_temp.entry(v_stack, 'ac-01_odp.05') is distinct from jsonb_build_object('values', '["monthly"]'::jsonb,
      'source', jsonb_build_object('kind', 'tailoring', 'title', pg_temp.profile_title(v_top), 'resolution_id', v_top),
      'rationale', 'Set for the parameter test.') then
    raise exception 'A layered stack answered %', v_stack;
  end if;

  -- Three program profiles: two that set the same parameter to different values, each answered as
  -- its own stack under its own profile's title, and one that tailors the control out, which says
  -- nothing of it.
  v_two := pg_temp.program('PCP-TWO', v_catalog, jsonb_build_array(
    jsonb_build_object('key', gen_random_uuid(), 'baseResolutionId', v_base, 'tailoring', '[]'::jsonb, 'parameters', jsonb_build_array(
      pg_temp.setting(v_catalog, 'ac-01_odp.05', '["monthly"]'::jsonb))),
    jsonb_build_object('key', gen_random_uuid(), 'baseResolutionId', v_base, 'tailoring', '[]'::jsonb, 'parameters', jsonb_build_array(
      pg_temp.setting(v_catalog, 'ac-01_odp.05', '["weekly"]'::jsonb))),
    jsonb_build_object('key', gen_random_uuid(), 'baseResolutionId', v_base, 'parameters', '[]'::jsonb, 'tailoring', jsonb_build_array(
      jsonb_build_object('controlId', v_control, 'action', 'exclude', 'rationale', 'Policy is set elsewhere.')))));
  if (select count(*) from public.program_reference_choices c where c.program_id = v_two) <> 3 then
    raise exception 'The program with three profiles did not record three reference choices';
  end if;
  select c.profile_resolution_id into v_excluding
  from public.program_reference_choices c
  where c.program_id = v_two
    and not exists (select 1 from public.selected_controls sc where sc.profile_resolution_id = c.profile_resolution_id and sc.control_id = v_control);
  v_answer := public.program_control_parameters(v_two, v_control);
  if v_answer->'selected' is distinct from 'true'::jsonb or jsonb_array_length(v_answer->'stacks') <> 2
    or v_excluding is null
    or exists (select 1 from jsonb_array_elements(v_answer->'stacks') s where s->>'resolution_id' = v_excluding::text)
    or exists (select 1 from jsonb_array_elements(v_answer->'stacks') s
      where s->>'title' is distinct from pg_temp.profile_title((s->>'resolution_id')::uuid)
        or pg_temp.entry(s, 'ac-01_odp.05')->'source'->>'resolution_id' is distinct from s->>'resolution_id')
    or (select jsonb_agg(pg_temp.entry(s, 'ac-01_odp.05')->'values'->>0 order by pg_temp.entry(s, 'ac-01_odp.05')->'values'->>0)
      from jsonb_array_elements(v_answer->'stacks') s) is distinct from '["monthly", "weekly"]'::jsonb
    -- In the order the program adopted them: by when, then by the choice.
    or (select jsonb_agg(s->>'choice_id' order by o.ordinality) from jsonb_array_elements(v_answer->'stacks') with ordinality o(s, ordinality))
      is distinct from (select jsonb_agg(c.id::text order by c.created_at, c.id) from public.program_reference_choices c
        where c.program_id = v_two and c.profile_resolution_id <> v_excluding) then
    raise exception 'Three program profiles answered %', v_answer;
  end if;

  -- A viewer of the workspace reads the same answer; another workspace is refused.
  insert into public.tenant_memberships(tenant_id, user_id, role)
    values (current_setting('test.tenant')::uuid, 'a5250000-0000-0000-0000-000000000002', 'viewer');
  perform set_config('request.jwt.claim.sub', 'a5250000-0000-0000-0000-000000000002', true);
  if public.program_control_parameters(v_two, v_control) is distinct from v_answer then
    raise exception 'A viewer read %', public.program_control_parameters(v_two, v_control);
  end if;
  -- The owner takes the membership back, and the same reader is refused.
  perform set_config('request.jwt.claim.sub', 'a5250000-0000-0000-0000-000000000001', true);
  delete from public.tenant_memberships
    where tenant_id = current_setting('test.tenant')::uuid and user_id = 'a5250000-0000-0000-0000-000000000002';
  if not found then raise exception 'The owner could not take the viewer''s membership back'; end if;
  perform set_config('request.jwt.claim.sub', 'a5250000-0000-0000-0000-000000000002', true);
  begin
    perform public.program_control_parameters(v_two, v_control);
    raise exception 'Another workspace read a program''s values';
  exception when sqlstate '42501' then null;
  end;
  perform set_config('request.jwt.claim.sub', 'a5250000-0000-0000-0000-000000000001', true);
  raise notice 'The checks of a program''s values ran against the pinned references';
end $$;

reset role;
rollback;
select 'Program control parameters: privileges, refusal, a program without a baseline and the values a stack answers passed.' as result;
