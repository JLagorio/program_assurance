-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- What a program chose for SA-24, Design for Cyber Resiliency: who may ask, what a program without
-- the control answers and, with the pinned references installed (the catalog that holds SA-24, a
-- reference baseline and the cyber resiliency framework), what a program answers through its stack:
-- the values as the form writes them, a layer that replaces one list of the layer beneath, values
-- typed by hand, the control tailored out again, and two program profiles answered as one.
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
  if has_function_privilege('anon', 'public.program_resiliency_choice(uuid)', 'execute')
    or has_function_privilege('public', 'public.program_resiliency_choice(uuid)', 'execute') then
    raise exception 'An anonymous session may execute program_resiliency_choice';
  end if;
  if not has_function_privilege('authenticated', 'public.program_resiliency_choice(uuid)', 'execute') then
    raise exception 'A signed-in session may not execute program_resiliency_choice';
  end if;
  if (select p.prosecdef from pg_catalog.pg_proc p where p.oid = 'public.program_resiliency_choice(uuid)'::regprocedure) then
    raise exception 'program_resiliency_choice does not run as its caller';
  end if;
end $$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('a5240000-0000-0000-0000-000000000001', 'resiliency-owner@example.test', '{"name":"Resiliency test owner"}'),
  ('a5240000-0000-0000-0000-000000000002', 'resiliency-outsider@example.test', '{}');
select set_config('request.jwt.claim.sub', 'a5240000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.programs(id, tenant_id, code, name) values
  ('b5240000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'RESILIENCY-BARE', 'Program with no control baseline');

-- A program with no control baseline does not select SA-24: every list is there, and empty.
do $$ begin
  if public.program_resiliency_choice('b5240000-0000-0000-0000-000000000001') is distinct from
    '{"selected": false, "goals": [], "objectives": [], "techniques": [], "approaches": [], "design_principles": [], "unmatched": []}'::jsonb then
    raise exception 'A program with no baseline answered %', public.program_resiliency_choice('b5240000-0000-0000-0000-000000000001');
  end if;
end $$;

-- A program the reader cannot read is refused, never answered as not selected: one that does not
-- exist, any program for a session with no account, and another workspace's program.
select pg_temp.expect_error($$select public.program_resiliency_choice('b5240000-0000-0000-0000-00000000dead')$$, '42501');
select pg_temp.expect_error($$select public.program_resiliency_choice(null)$$, '42501');
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$select public.program_resiliency_choice('b5240000-0000-0000-0000-000000000001')$$, '42501');
set local role anon;
select pg_temp.expect_error($$select public.program_resiliency_choice('b5240000-0000-0000-0000-000000000001')$$, '42501');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5240000-0000-0000-0000-000000000002', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
select pg_temp.expect_error($$select public.program_resiliency_choice('b5240000-0000-0000-0000-000000000001')$$, '42501');
select set_config('request.jwt.claim.sub', 'a5240000-0000-0000-0000-000000000001', true);

-- ---------------------------------------------------------------------------------------------
-- With the pinned references installed: programs set up as the product sets them up, through
-- create_program_wizard, each with one system that adopts its first program profile.
-- ---------------------------------------------------------------------------------------------
-- The titles of framework items, by code and in the order given: what a parameter's values hold.
create function pg_temp.titles(variadic codes text[]) returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(i.title order by array_position(codes, i.code)), '[]'::jsonb)
  from public.framework_item_rows i
  where i.framework_code = 'nist-sp800-160v2r1-cref' and i.code = any (codes);
$$;
-- One of SA-24's parameters set to some values, as a tailoring names it.
create function pg_temp.setting(catalog uuid, source text, parameter_values jsonb) returns jsonb language sql stable as $$
  select jsonb_build_object('parameterId', p.id, 'values', parameter_values, 'rationale', 'Chosen for the resiliency choice test.')
  from public.parameters p where p.catalog_revision_id = catalog and p.source_id = source;
$$;
-- A program with the profiles given, and the program's id.
create function pg_temp.program(code text, catalog uuid, profiles jsonb) returns uuid language plpgsql as $$
declare created jsonb;
begin
  created := public.create_program_wizard(current_setting('test.tenant')::uuid, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', code, 'name', code || ' resiliency choice test', 'description', '',
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
grant execute on function pg_temp.titles(text[]), pg_temp.setting(uuid, text, jsonb), pg_temp.program(text, uuid, jsonb) to authenticated;

do $$
declare
  v_catalog uuid; v_control uuid; v_base uuid; v_top uuid;
  v_written uuid; v_layered uuid; v_out uuid; v_two uuid;
  v_include jsonb; v_answer jsonb; v_expected jsonb;
begin
  select c.id, c.catalog_revision_id into v_control, v_catalog
  from public.controls c join public.catalog_revisions r on r.id = c.catalog_revision_id
  where c.tenant_id is null and c.source_id = 'sa-24' and c.status = 'active' and r.state = 'published'
  order by r.created_at desc limit 1;
  -- The smallest reference baseline on that catalog; none selects SA-24.
  select r.id into v_base
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and i.catalog_revision_id = v_catalog
    and not exists (select 1 from public.selected_controls sc where sc.profile_resolution_id = r.id and sc.control_id = v_control)
  order by (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id), r.id limit 1;
  if v_control is null or v_base is null
    or (select count(*) from public.parameters p where p.catalog_revision_id = v_catalog and p.control_id = v_control and p.source_id like 'sa-24\_odp.0_') <> 5
    or jsonb_array_length(pg_temp.titles('goal.anticipate', 'objective.constrain', 'technique.segmentation', 'approach.obfuscation',
      'strategic-principle.reduce-attack-surfaces', 'structural-principle.maintain-redundancy')) <> 6 then
    raise notice 'The pinned references are not installed: the checks of a tailored program were skipped';
    return;
  end if;
  v_include := jsonb_build_array(jsonb_build_object('controlId', v_control, 'action', 'include', 'rationale', 'The program designs for cyber resiliency.'));

  -- A baseline as it comes selects no SA-24.
  v_out := pg_temp.program('RC-PLAIN', v_catalog, jsonb_build_array(jsonb_build_object(
    'key', gen_random_uuid(), 'baseResolutionId', v_base, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)));
  v_answer := public.program_resiliency_choice(v_out);
  if v_answer is distinct from '{"selected": false, "goals": [], "objectives": [], "techniques": [], "approaches": [], "design_principles": [], "unmatched": []}'::jsonb then
    raise exception 'A reference baseline answered %', v_answer;
  end if;

  -- SA-24 tailored in with nothing set: selected, and nothing named. The catalog gives its
  -- parameters no values of their own.
  v_out := pg_temp.program('RC-UNSET', v_catalog, jsonb_build_array(jsonb_build_object(
    'key', gen_random_uuid(), 'baseResolutionId', v_base, 'tailoring', v_include, 'parameters', '[]'::jsonb)));
  v_answer := public.program_resiliency_choice(v_out);
  if v_answer is distinct from '{"selected": true, "goals": [], "objectives": [], "techniques": [], "approaches": [], "design_principles": [], "unmatched": []}'::jsonb then
    raise exception 'SA-24 with no values answered %', v_answer;
  end if;

  -- As the form writes them: each value an item's title, in the publication's order.
  v_written := pg_temp.program('RC-WRITTEN', v_catalog, jsonb_build_array(jsonb_build_object(
    'key', gen_random_uuid(), 'baseResolutionId', v_base, 'tailoring', v_include, 'parameters', jsonb_build_array(
      pg_temp.setting(v_catalog, 'sa-24_odp.01', pg_temp.titles('goal.anticipate', 'goal.withstand')),
      pg_temp.setting(v_catalog, 'sa-24_odp.02', pg_temp.titles('objective.constrain', 'objective.understand')),
      pg_temp.setting(v_catalog, 'sa-24_odp.03', pg_temp.titles('technique.deception', 'technique.redundancy', 'technique.segmentation')),
      pg_temp.setting(v_catalog, 'sa-24_odp.04', pg_temp.titles('approach.obfuscation', 'approach.protected-backup-and-restore', 'approach.predefined-segmentation')),
      pg_temp.setting(v_catalog, 'sa-24_odp.05', pg_temp.titles('strategic-principle.reduce-attack-surfaces', 'structural-principle.limit-the-need-for-trust', 'structural-principle.maintain-redundancy'))))));
  v_answer := public.program_resiliency_choice(v_written);
  v_expected := jsonb_build_object('selected', true,
    'goals', '["goal.anticipate", "goal.withstand"]'::jsonb,
    'objectives', '["objective.constrain", "objective.understand"]'::jsonb,
    'techniques', '["technique.deception", "technique.redundancy", "technique.segmentation"]'::jsonb,
    'approaches', '["approach.obfuscation", "approach.protected-backup-and-restore", "approach.predefined-segmentation"]'::jsonb,
    'design_principles', '["strategic-principle.reduce-attack-surfaces", "structural-principle.limit-the-need-for-trust", "structural-principle.maintain-redundancy"]'::jsonb,
    'unmatched', '[]'::jsonb);
  if v_answer is distinct from v_expected then
    raise exception 'Values written as titles answered %, expected %', v_answer, v_expected;
  end if;

  -- A layer on that stack that sets the goals alone, typed by hand: in another order, in another
  -- case, with a technique's name and words that name nothing. The nearest layer's goals replace
  -- the ones beneath; the lists it leaves alone come from the layer beneath; a value names an item
  -- of its own list's kind only; and the answer keeps the publication's order.
  select c.profile_resolution_id into v_top from public.program_reference_choices c where c.program_id = v_written;
  v_layered := pg_temp.program('RC-LAYERED', v_catalog, jsonb_build_array(jsonb_build_object(
    'key', gen_random_uuid(), 'baseResolutionId', v_top, 'tailoring', '[]'::jsonb, 'parameters', jsonb_build_array(
      pg_temp.setting(v_catalog, 'sa-24_odp.01', '["ADAPT", "  recover ", "Segmentation", "Zero trust"]'::jsonb)))));
  v_answer := public.program_resiliency_choice(v_layered);
  v_expected := v_expected || '{"goals": ["goal.recover", "goal.adapt"], "unmatched": ["Segmentation", "Zero trust"]}'::jsonb;
  if v_answer is distinct from v_expected then
    raise exception 'A layered stack answered %, expected %', v_answer, v_expected;
  end if;

  -- Tailored out again on top of that stack: not selected, whatever the layers beneath set.
  v_out := pg_temp.program('RC-OUT', v_catalog, jsonb_build_array(jsonb_build_object(
    'key', gen_random_uuid(), 'baseResolutionId', v_top, 'parameters', '[]'::jsonb, 'tailoring', jsonb_build_array(
      jsonb_build_object('controlId', v_control, 'action', 'exclude', 'rationale', 'Resiliency is designed elsewhere.')))));
  v_answer := public.program_resiliency_choice(v_out);
  if v_answer is distinct from '{"selected": false, "goals": [], "objectives": [], "techniques": [], "approaches": [], "design_principles": [], "unmatched": []}'::jsonb then
    raise exception 'SA-24 tailored out answered %', v_answer;
  end if;

  -- Two program profiles answer as one: every item either names, once, and a baseline that does
  -- not select SA-24 adds nothing.
  v_two := pg_temp.program('RC-TWO', v_catalog, jsonb_build_array(
    jsonb_build_object('key', gen_random_uuid(), 'baseResolutionId', v_base, 'tailoring', v_include, 'parameters', jsonb_build_array(
      pg_temp.setting(v_catalog, 'sa-24_odp.01', pg_temp.titles('goal.recover')),
      pg_temp.setting(v_catalog, 'sa-24_odp.03', pg_temp.titles('technique.redundancy', 'technique.diversity')))),
    jsonb_build_object('key', gen_random_uuid(), 'baseResolutionId', v_base, 'tailoring', v_include, 'parameters', jsonb_build_array(
      pg_temp.setting(v_catalog, 'sa-24_odp.01', pg_temp.titles('goal.anticipate')),
      pg_temp.setting(v_catalog, 'sa-24_odp.03', pg_temp.titles('technique.diversity')))),
    jsonb_build_object('key', gen_random_uuid(), 'baseResolutionId', v_base, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)));
  if (select count(*) from public.program_reference_choices c where c.program_id = v_two) <> 3 then
    raise exception 'The program with three profiles did not record three reference choices';
  end if;
  v_answer := public.program_resiliency_choice(v_two);
  v_expected := '{"selected": true, "goals": ["goal.anticipate", "goal.recover"], "objectives": [], "techniques": ["technique.diversity", "technique.redundancy"], "approaches": [], "design_principles": [], "unmatched": []}'::jsonb;
  if v_answer is distinct from v_expected then
    raise exception 'Two program profiles answered %, expected %', v_answer, v_expected;
  end if;

  -- A viewer of the workspace reads the same answer; another workspace is refused.
  insert into public.tenant_memberships(tenant_id, user_id, role)
    values (current_setting('test.tenant')::uuid, 'a5240000-0000-0000-0000-000000000002', 'viewer');
  perform set_config('request.jwt.claim.sub', 'a5240000-0000-0000-0000-000000000002', true);
  if public.program_resiliency_choice(v_two) is distinct from v_expected then
    raise exception 'A viewer read %', public.program_resiliency_choice(v_two);
  end if;
  perform set_config('request.jwt.claim.sub', 'a5240000-0000-0000-0000-000000000001', true);
  raise notice 'The checks of a tailored program ran against the pinned references';
end $$;

reset role;
rollback;
select 'Program resiliency choice: privileges, refusal, a program without SA-24 and the choice a tailored stack answers passed.' as result;
