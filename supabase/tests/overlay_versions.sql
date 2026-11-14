-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Versions of an overlay: who may create one, what the next version of a published overlay
-- carries (its code, catalog edition, name, description, decisions and parameter values, numbered
-- one more), a request sent again, what stops one (a draft, a version that already has a next
-- version, a request id used for another overlay, a viewer, someone outside the workspace), that a
-- version keeps its overlay's code while its name may change, that deleting a draft version leaves
-- the published one as it is and lets it take a next version again, and, with the pinned references
-- installed, that a program's stack keeps the version it applied until set_program_baseline_overlays
-- takes the newer one in its place.
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
-- Who may create a version: a signed-in member, through the command, which runs as its owner as
-- the other overlay commands do.
-- ---------------------------------------------------------------------------------------------
do $$ begin
  if has_function_privilege('anon', 'public.create_control_overlay_version(uuid, uuid, uuid)', 'execute')
    or has_function_privilege('public', 'public.create_control_overlay_version(uuid, uuid, uuid)', 'execute') then
    raise exception 'An anonymous session may execute create_control_overlay_version';
  end if;
  if not has_function_privilege('authenticated', 'public.create_control_overlay_version(uuid, uuid, uuid)', 'execute') then
    raise exception 'A signed-in session may not execute create_control_overlay_version';
  end if;
  if not (select p.prosecdef from pg_catalog.pg_proc p where p.oid = 'public.create_control_overlay_version(uuid, uuid, uuid)'::regprocedure)
    or has_table_privilege('authenticated', 'public.control_overlays', 'insert') then
    raise exception 'A version can be created around the command';
  end if;
end $$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('a5630000-0000-0000-0000-000000000001', 'overlay-versions-editor@example.test', '{"name":"Overlay versions test editor"}'),
  ('a5630000-0000-0000-0000-000000000002', 'overlay-versions-outsider@example.test', '{}'),
  ('a5630000-0000-0000-0000-000000000003', 'overlay-versions-viewer@example.test', '{}');
select set_config('request.jwt.claim.sub', 'a5630000-0000-0000-0000-000000000002', true);
set local role authenticated;
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
select set_config('request.jwt.claim.sub', 'a5630000-0000-0000-0000-000000000001', true);
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);

-- With no account, nothing is created; a request that names nothing is refused.
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$select public.create_control_overlay_version(current_setting('test.tenant')::uuid, gen_random_uuid(), gen_random_uuid())$$, '42501');
select set_config('request.jwt.claim.sub', 'a5630000-0000-0000-0000-000000000001', true);
select pg_temp.expect_error($$select public.create_control_overlay_version(current_setting('test.tenant')::uuid, null, gen_random_uuid())$$, '23514');
select pg_temp.expect_error($$select public.create_control_overlay_version(current_setting('test.tenant')::uuid, gen_random_uuid(), null)$$, '23514');
select pg_temp.expect_error($$select public.create_control_overlay_version(current_setting('test.tenant')::uuid, gen_random_uuid(), gen_random_uuid())$$, '23514');

-- ---------------------------------------------------------------------------------------------
-- A chain of versions, with a catalog edition installed.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_controls uuid[]; v_parameter public.parameters;
  v_first uuid := gen_random_uuid(); v_second uuid := gen_random_uuid(); v_third uuid := gen_random_uuid();
  v_overlay public.control_overlays; v_again public.control_overlays; v_revision bigint;
begin
  select k.id into v_catalog from public.catalog_revisions k where k.state = 'published' and k.tenant_id is null order by k.created_at desc limit 1;
  if v_catalog is null then
    raise notice 'No catalog edition is installed: the checks of an overlay''s versions were skipped';
    return;
  end if;
  -- Two active controls the smallest reference baseline on the edition leaves out, where one is
  -- installed, so a program's stack can take what the versions add.
  select array_agg(c.id order by c.source_id) into v_controls from (
    select c.id, c.source_id from public.controls c where c.catalog_revision_id = v_catalog and c.status = 'active'
      and not exists (select 1 from public.selected_controls s where s.control_id = c.id and s.profile_resolution_id = (
        select r.id from public.profile_resolutions r
        join public.profile_imports i on i.profile_revision_id = r.profile_revision_id and i.catalog_revision_id = v_catalog
        where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
        order by (select count(*) from public.selected_controls x where x.profile_resolution_id = r.id), r.id limit 1))
      and exists (select 1 from public.parameters p where p.control_id = c.id and not p.has_selection)
    order by c.source_id limit 2) c;
  select p.* into v_parameter from public.parameters p where p.catalog_revision_id = v_catalog and p.control_id = v_controls[1] and not p.has_selection
    order by p.source_id limit 1;
  if v_parameter.id is null then
    raise notice 'The edition has no parameter to set: the checks of an overlay''s versions were skipped';
    return;
  end if;

  -- Version 1: a decision and a value, published.
  v_overlay := public.save_control_overlay(v_tenant, v_first, null, jsonb_build_object('code', 'OV-CHAIN', 'title', 'Chain overlay',
    'description', 'The first version.', 'catalogRevisionId', v_catalog));
  if v_overlay.version <> 1 or v_overlay.previous_overlay_id is not null then raise exception 'A new overlay is not its first version'; end if;
  v_overlay := public.set_control_overlay_decisions(v_tenant, v_first, v_overlay.revision,
    jsonb_build_array(jsonb_build_object('controlId', v_controls[1], 'action', 'include', 'rationale', 'Version 1 adds it.')), '[]'::jsonb);
  v_overlay := public.set_control_overlay_parameters(v_tenant, v_first, v_overlay.revision,
    jsonb_build_array(jsonb_build_object('parameterId', v_parameter.id, 'values', jsonb_build_array('annually'), 'rationale', 'Version 1 sets it.')), '[]'::jsonb);
  -- A draft has no next version.
  perform pg_temp.expect_error(format('select public.create_control_overlay_version(%L, %L, %L)', v_tenant, v_first, v_second), '23514');
  v_overlay := public.publish_control_overlay(v_tenant, v_first, v_overlay.revision);

  -- Version 2: the same code, edition, name, description, decisions and values, a draft numbered 2.
  v_overlay := public.create_control_overlay_version(v_tenant, v_first, v_second);
  if v_overlay.id <> v_second or v_overlay.version <> 2 or v_overlay.previous_overlay_id <> v_first or v_overlay.state <> 'draft'
    or v_overlay.code <> 'OV-CHAIN' or v_overlay.title <> 'Chain overlay' or v_overlay.description <> 'The first version.'
    or v_overlay.catalog_revision_id <> v_catalog then
    raise exception 'The next version does not carry the published one: %', row_to_json(v_overlay);
  end if;
  if (select count(*) from public.control_overlay_decisions d where d.overlay_id = v_second and d.control_id = v_controls[1]
        and d.action = 'include' and d.rationale = 'Version 1 adds it.') <> 1
    or (select p.parameter_values from public.control_overlay_parameters p where p.overlay_id = v_second and p.parameter_id = v_parameter.id)
      is distinct from array['annually'] then
    raise exception 'The next version does not carry the decisions and values';
  end if;
  -- Sent again, it answers the same draft and writes nothing more.
  v_again := public.create_control_overlay_version(v_tenant, v_first, v_second);
  if v_again.id <> v_second or v_again.revision <> v_overlay.revision
    or (select count(*) from public.control_overlays o where o.code = 'OV-CHAIN') <> 2 then
    raise exception 'A version request sent again wrote again';
  end if;
  -- One next version a version, and a request id names one overlay's.
  perform pg_temp.expect_error(format('select public.create_control_overlay_version(%L, %L, %L)', v_tenant, v_first, v_third), '23514');
  perform pg_temp.expect_error(format('select public.create_control_overlay_version(%L, %L, %L)', v_tenant, gen_random_uuid(), v_second), 'PT409');
  -- The register says where each version stands.
  if (select r.next_overlay_id from public.control_overlay_rows r where r.id = v_first) <> v_second
    or (select r.next_overlay_id from public.control_overlay_rows r where r.id = v_second) is not null
    or (select r.version from public.control_overlay_rows r where r.id = v_second) <> 2 then
    raise exception 'The register does not chain the versions';
  end if;

  -- A version keeps its overlay's code; its name may change; the published version does not.
  perform pg_temp.expect_error(format('select public.save_control_overlay(%L, %L, %s, %L::jsonb)', v_tenant, v_second, v_overlay.revision,
    jsonb_build_object('code', 'OV-OTHER', 'title', 'Chain overlay', 'description', '', 'catalogRevisionId', v_catalog)), '23514');
  v_overlay := public.save_control_overlay(v_tenant, v_second, v_overlay.revision, jsonb_build_object('code', 'OV-CHAIN',
    'title', 'Chain overlay, revised', 'description', 'The second version.', 'catalogRevisionId', v_catalog));
  if v_overlay.title <> 'Chain overlay, revised' then raise exception 'A version''s name did not change'; end if;
  perform pg_temp.expect_error(format('select public.save_control_overlay(%L, %L, %s, %L::jsonb)', v_tenant, v_first,
    (select o.revision from public.control_overlays o where o.id = v_first),
    jsonb_build_object('code', 'OV-CHAIN', 'title', 'Changed after publishing', 'description', '', 'catalogRevisionId', v_catalog)), '23514');
  -- Another overlay may not take the code.
  perform pg_temp.expect_error(format('select public.save_control_overlay(%L, %L, null, %L::jsonb)', v_tenant, gen_random_uuid(),
    jsonb_build_object('code', 'OV-CHAIN', 'title', 'A namesake', 'description', '', 'catalogRevisionId', v_catalog)), '23505');

  -- The draft is edited: it removes the published version's decision and adds another.
  v_overlay := public.set_control_overlay_decisions(v_tenant, v_second, v_overlay.revision,
    jsonb_build_array(jsonb_build_object('controlId', v_controls[2], 'action', 'include', 'rationale', 'Version 2 adds this one.')),
    jsonb_build_array(v_controls[1]));
  if not exists (select 1 from public.control_overlay_decisions d where d.overlay_id = v_first and d.control_id = v_controls[1]) then
    raise exception 'Editing the draft version changed the published one';
  end if;

  -- Deleting the draft version deletes it alone; the published one stays, and may take a next
  -- version again.
  if public.delete_control_overlay(v_tenant, v_second, v_overlay.revision) is not true then
    raise exception 'The draft version was not deleted';
  end if;
  if not exists (select 1 from public.control_overlays o where o.id = v_first and o.state = 'published')
    or (select count(*) from public.control_overlay_decisions d where d.overlay_id = v_first) <> 1
    or (select count(*) from public.control_overlay_parameters p where p.overlay_id = v_first) <> 1 then
    raise exception 'Deleting a draft version touched the published one';
  end if;
  v_overlay := public.create_control_overlay_version(v_tenant, v_first, v_third);
  if v_overlay.version <> 2 then raise exception 'The version after a deleted draft is not numbered 2 again'; end if;
  v_overlay := public.set_control_overlay_decisions(v_tenant, v_third, v_overlay.revision,
    jsonb_build_array(jsonb_build_object('controlId', v_controls[2], 'action', 'include', 'rationale', 'Version 2 adds this one.')), '[]'::jsonb);
  v_overlay := public.publish_control_overlay(v_tenant, v_third, v_overlay.revision);
  -- A published version may not be deleted, and the older one now has its next.
  perform pg_temp.expect_error(format('select public.delete_control_overlay(%L, %L, %s)', v_tenant, v_third, v_overlay.revision), '23514');
  perform pg_temp.expect_error(format('select public.create_control_overlay_version(%L, %L, %L)', v_tenant, v_first, gen_random_uuid()), '23514');
  perform set_config('test.chain_first', v_first::text, true);
  perform set_config('test.chain_second', v_third::text, true);
end $$;

-- A viewer reads the versions and may not create one; someone outside the workspace may do neither.
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'a5630000-0000-0000-0000-000000000003', 'viewer');
select set_config('request.jwt.claim.sub', 'a5630000-0000-0000-0000-000000000003', true);
do $$ begin
  if coalesce(current_setting('test.chain_second', true), '') = '' then return; end if;
  if (select count(*) from public.control_overlays o where o.code = 'OV-CHAIN') <> 2 then raise exception 'A viewer cannot read the versions'; end if;
  perform pg_temp.expect_error(format('select public.create_control_overlay_version(%L, %L, %L)', current_setting('test.tenant'),
    current_setting('test.chain_second'), gen_random_uuid()), '42501');
end $$;
select set_config('request.jwt.claim.sub', 'a5630000-0000-0000-0000-000000000002', true);
do $$ begin
  if coalesce(current_setting('test.chain_second', true), '') = '' then return; end if;
  if exists (select 1 from public.control_overlays o where o.code = 'OV-CHAIN') then raise exception 'Someone outside the workspace reads its versions'; end if;
  perform pg_temp.expect_error(format('select public.create_control_overlay_version(%L, %L, %L)', current_setting('test.tenant'),
    current_setting('test.chain_second'), gen_random_uuid()), '42501');
  -- Their own workspace holds no such overlay.
  perform pg_temp.expect_error(format('select public.create_control_overlay_version(%L, %L, %L)', current_setting('test.other_tenant'),
    current_setting('test.chain_second'), gen_random_uuid()), '23514');
end $$;
select set_config('request.jwt.claim.sub', 'a5630000-0000-0000-0000-000000000001', true);

-- ---------------------------------------------------------------------------------------------
-- A program's stack keeps the version it applied until it takes the newer one.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_first uuid := nullif(current_setting('test.chain_first', true), '')::uuid;
  v_second uuid := nullif(current_setting('test.chain_second', true), '')::uuid;
  v_catalog uuid; v_base uuid; v_created jsonb; v_key uuid := gen_random_uuid(); v_program uuid;
  v_choice uuid; v_revision bigint; v_top uuid; v_answer jsonb; v_applied uuid; v_control uuid;
begin
  if v_first is null then return; end if;
  select o.catalog_revision_id into v_catalog from public.control_overlays o where o.id = v_first;
  -- A reference baseline on the overlay's edition that selects neither control the versions add.
  select r.id into v_base from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id and i.catalog_revision_id = v_catalog
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    and not exists (select 1 from public.selected_controls s join public.control_overlay_decisions d on d.control_id = s.control_id
      where s.profile_resolution_id = r.id and d.overlay_id in (v_first, v_second))
  order by (select count(*) from public.selected_controls s where s.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'No reference baseline leaves room for the versions: the checks of a stack that takes a newer version were skipped';
    return;
  end if;
  v_created := public.create_program_wizard(v_tenant, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', 'OV-PROG', 'name', 'Overlay versions test program', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb, 'catalogRevisionId', v_catalog,
    'profiles', jsonb_build_array(jsonb_build_object('key', v_key, 'baseResolutionId', v_base, 'overlayIds', jsonb_build_array(v_first),
      'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)),
    'systems', jsonb_build_array(jsonb_build_object(
      'key', gen_random_uuid(), 'code', 'OV-PROG-SYS', 'name', 'Overlay versions system', 'description', '',
      'type', 'information_system', 'ownerPartyId', null, 'confidentiality', 'low', 'integrity', 'low', 'availability', 'low',
      'categorizationRationale', 'A limited impact boundary for a rollback test.', 'profileKey', v_key, 'elements', '[]'::jsonb))));
  v_program := (v_created->>'programId')::uuid;
  select c.id, c.revision, c.profile_resolution_id into v_choice, v_revision, v_top from public.program_reference_choices c where c.program_id = v_program;
  select a.overlay_id into v_applied from public.profile_overlay_applications a where a.profile_resolution_id = v_top;
  if v_applied <> v_first then raise exception 'The program does not apply version 1'; end if;
  -- A newer version published elsewhere changes nothing in the program's stack.
  if (select c.profile_resolution_id from public.program_reference_choices c where c.id = v_choice) <> v_top then
    raise exception 'Publishing a newer version moved the program''s stack';
  end if;
  -- An applied version may not be deleted, whatever its state.
  perform pg_temp.expect_error(format('select public.delete_control_overlay(%L, %L, 1)', v_tenant, v_first), '23514');
  -- Taking the newer version: the stack applies it in the older one's place.
  v_answer := public.set_program_baseline_overlays(v_tenant, v_choice, v_revision, gen_random_uuid(), jsonb_build_array(v_second));
  select c.profile_resolution_id into v_top from public.program_reference_choices c where c.id = v_choice;
  select a.overlay_id into v_applied from public.profile_overlay_applications a where a.profile_resolution_id = v_top;
  if not (v_answer->>'changed')::boolean or v_applied <> v_second then
    raise exception 'The stack did not take the newer version: %', v_answer;
  end if;
  -- What version 2 decides is the program's now: both controls, the first carried from version 1.
  select d.control_id into v_control from public.control_overlay_decisions d where d.overlay_id = v_second order by d.control_id limit 1;
  if not exists (select 1 from public.selected_controls s where s.profile_resolution_id = v_top and s.control_id = v_control) then
    raise exception 'The newer version''s decision is not in the program''s baseline';
  end if;
  -- The register counts the baselines that apply either version on each.
  if (select r.overlay_application_count from public.control_overlay_rows r where r.id = v_second) < 2 then
    raise exception 'The register does not count the baselines that apply any version';
  end if;
end $$;

rollback;
