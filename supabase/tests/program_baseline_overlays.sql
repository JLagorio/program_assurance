-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Changing a program's control baseline after creation: who may ask, and, with the pinned
-- references installed (a catalog edition and a reference baseline on it), what a change does to a
-- program set up through create_program_wizard: an overlay added, the stack reordered, an overlay
-- removed, the program's tailoring kept last with what still changes something, a tailoring left
-- with nothing to change, a request sent again, a stale revision, what stops a change (a draft
-- overlay, another workspace's overlay, an overlay that changes nothing where it sits, a viewer,
-- someone outside the workspace) and what happens to the program's systems and SSP revisions.
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
-- A program profile's stack, bottom up: root, then each overlay layer by its overlay's code, then
-- tailoring for a layer no overlay accounts for.
create function pg_temp.stack(p_choice uuid) returns text[] language plpgsql stable as $$
declare v_cursor uuid; v_base uuid; v_code text; v_out text[] := '{}';
begin
  select c.profile_resolution_id into v_cursor from public.program_reference_choices c where c.id = p_choice;
  while v_cursor is not null loop
    select o.code into v_code from public.profile_overlay_applications a join public.control_overlays o on o.id = a.overlay_id
      where a.profile_resolution_id = v_cursor;
    select r.base_profile_resolution_id into v_base from public.profile_resolutions r where r.id = v_cursor;
    v_out := array_prepend(coalesce(v_code, case when v_base is null then 'root' else 'tailoring' end), v_out);
    v_cursor := v_base;
  end loop;
  return v_out;
end;
$$;
-- The resolution n layers above the root of a program profile's stack (0 is the root).
create function pg_temp.layer(p_choice uuid, p_index integer) returns uuid language plpgsql stable as $$
declare v_cursor uuid; v_hops uuid[] := '{}';
begin
  select c.profile_resolution_id into v_cursor from public.program_reference_choices c where c.id = p_choice;
  while v_cursor is not null loop
    v_hops := array_prepend(v_cursor, v_hops);
    select r.base_profile_resolution_id into v_cursor from public.profile_resolutions r where r.id = v_cursor;
  end loop;
  return v_hops[p_index + 1];
end;
$$;
-- The source ids a resolution selects, of the ones named.
create function pg_temp.selects(p_resolution uuid, p_control uuid) returns boolean language sql stable as $$
  select exists (select 1 from public.selected_controls s where s.profile_resolution_id = p_resolution and s.control_id = p_control);
$$;
-- A published overlay of the decisions given, written through the overlay commands.
create function pg_temp.overlay(p_tenant uuid, p_catalog uuid, p_code text, p_decisions jsonb, p_publish boolean default true) returns uuid language plpgsql as $$
declare v_id uuid := gen_random_uuid(); v_overlay public.control_overlays;
begin
  v_overlay := public.save_control_overlay(p_tenant, v_id, null, jsonb_build_object('code', p_code, 'title', p_code || ' test overlay',
    'description', 'A test overlay.', 'catalogRevisionId', p_catalog));
  v_overlay := public.set_control_overlay_decisions(p_tenant, v_id, v_overlay.revision, p_decisions, '[]'::jsonb);
  if p_publish then v_overlay := public.publish_control_overlay(p_tenant, v_id, v_overlay.revision); end if;
  return v_id;
end;
$$;
-- A program with one program profile and one system adopting it; the program profile's choice id.
create function pg_temp.program(p_code text, p_catalog uuid, p_base uuid, p_overlays jsonb, p_tailoring jsonb, p_parameters jsonb) returns uuid language plpgsql as $$
declare v_created jsonb; v_key uuid := gen_random_uuid();
begin
  v_created := public.create_program_wizard(current_setting('test.tenant')::uuid, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', p_code, 'name', p_code || ' baseline overlays test', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb, 'catalogRevisionId', p_catalog,
    'profiles', jsonb_build_array(jsonb_build_object('key', v_key, 'baseResolutionId', p_base, 'overlayIds', p_overlays,
      'tailoring', p_tailoring, 'parameters', p_parameters)),
    'systems', jsonb_build_array(jsonb_build_object(
      'key', gen_random_uuid(), 'code', p_code || '-SYS', 'name', p_code || ' system', 'description', '',
      'type', 'information_system', 'ownerPartyId', null, 'confidentiality', 'low', 'integrity', 'low', 'availability', 'low',
      'categorizationRationale', 'A limited impact boundary for a rollback test.', 'profileKey', v_key, 'elements', '[]'::jsonb))));
  return (select c.id from public.program_reference_choices c where c.program_id = (v_created->>'programId')::uuid);
end;
$$;
-- The command, as the screen sends it.
create function pg_temp.restack(p_choice uuid, p_revision bigint, p_request uuid, p_overlays uuid[]) returns jsonb language sql as $$
  select public.set_program_baseline_overlays(current_setting('test.tenant')::uuid, p_choice, p_revision, p_request, to_jsonb(p_overlays));
$$;
grant execute on function pg_temp.expect_error(text, text), pg_temp.stack(uuid), pg_temp.layer(uuid, integer), pg_temp.selects(uuid, uuid),
  pg_temp.overlay(uuid, uuid, text, jsonb, boolean), pg_temp.program(text, uuid, uuid, jsonb, jsonb, jsonb), pg_temp.restack(uuid, bigint, uuid, uuid[])
  to authenticated, anon;

-- ---------------------------------------------------------------------------------------------
-- Who may ask: a signed-in member, through the command, which runs as its owner as the other
-- overlay commands do (it authors profiles through internal functions no member may call).
-- ---------------------------------------------------------------------------------------------
do $$ begin
  if has_function_privilege('anon', 'public.set_program_baseline_overlays(uuid, uuid, bigint, uuid, jsonb)', 'execute')
    or has_function_privilege('public', 'public.set_program_baseline_overlays(uuid, uuid, bigint, uuid, jsonb)', 'execute') then
    raise exception 'An anonymous session may execute set_program_baseline_overlays';
  end if;
  if not has_function_privilege('authenticated', 'public.set_program_baseline_overlays(uuid, uuid, bigint, uuid, jsonb)', 'execute') then
    raise exception 'A signed-in session may not execute set_program_baseline_overlays';
  end if;
  if not (select p.prosecdef from pg_catalog.pg_proc p where p.oid = 'public.set_program_baseline_overlays(uuid, uuid, bigint, uuid, jsonb)'::regprocedure)
    or not (select p.prosecdef from pg_catalog.pg_proc p where p.oid = 'public.save_control_overlay(uuid, uuid, bigint, jsonb)'::regprocedure) then
    raise exception 'set_program_baseline_overlays does not run as the overlay commands do';
  end if;
  if has_table_privilege('authenticated', 'public.program_baseline_requests', 'insert')
    or has_table_privilege('authenticated', 'public.program_baseline_requests', 'update') then
    raise exception 'A member may write a command receipt directly';
  end if;
end $$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('a5600000-0000-0000-0000-000000000001', 'baseline-overlays-editor@example.test', '{"name":"Baseline overlays test editor"}'),
  ('a5600000-0000-0000-0000-000000000002', 'baseline-overlays-outsider@example.test', '{}'),
  ('a5600000-0000-0000-0000-000000000003', 'baseline-overlays-viewer@example.test', '{}');
select set_config('request.jwt.claim.sub', 'a5600000-0000-0000-0000-000000000002', true);
set local role authenticated;
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
select set_config('request.jwt.claim.sub', 'a5600000-0000-0000-0000-000000000001', true);
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);

-- With no account, nothing is asked.
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$select public.set_program_baseline_overlays(current_setting('test.tenant')::uuid, gen_random_uuid(), 1, gen_random_uuid(), '[]'::jsonb)$$, '42501');
set local role anon;
select pg_temp.expect_error($$select public.set_program_baseline_overlays(current_setting('test.tenant')::uuid, gen_random_uuid(), 1, gen_random_uuid(), '[]'::jsonb)$$, '42501');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5600000-0000-0000-0000-000000000001', true);
-- A choice that does not exist is not found, and a malformed request is refused before anything.
select pg_temp.expect_error($$select public.set_program_baseline_overlays(current_setting('test.tenant')::uuid, gen_random_uuid(), 1, gen_random_uuid(), '[]'::jsonb)$$, '23514');
select pg_temp.expect_error($$select public.set_program_baseline_overlays(current_setting('test.tenant')::uuid, gen_random_uuid(), 1, gen_random_uuid(), '["not an id"]'::jsonb)$$, '23514');
select pg_temp.expect_error($$select public.set_program_baseline_overlays(current_setting('test.tenant')::uuid, gen_random_uuid(), 1, gen_random_uuid(), '{}'::jsonb)$$, '23514');
select pg_temp.expect_error($$select public.set_program_baseline_overlays(current_setting('test.tenant')::uuid, null, 1, gen_random_uuid(), '[]'::jsonb)$$, '23514');

-- ---------------------------------------------------------------------------------------------
-- With the pinned references installed.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_base uuid; v_base_ids uuid[];
  v_add uuid[]; v_cut uuid[]; v_parameter public.parameters;
  v_a uuid; v_b uuid; v_c uuid; v_e uuid; v_same uuid; v_draft uuid; v_other uuid;
  v_choice uuid; v_bare uuid; v_moot uuid; v_system uuid; v_first_top uuid; v_a_layer uuid; v_b_layer uuid;
  v_ssp_published uuid; v_ssp_draft uuid; v_ssp_count integer; v_ir_count integer;
  v_request uuid; v_answer jsonb; v_again jsonb; v_profiles integer; v_revision bigint; v_top uuid; v_tailoring_revision uuid;
begin
  -- The smallest reference baseline on the newest published catalog edition.
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id and i.catalog_revision_id is not null
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published' and k.tenant_id is null
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
  order by k.created_at desc, (select count(*) from public.selected_controls s where s.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the checks of a changed stack were skipped';
    return;
  end if;
  select array_agg(s.control_id) into v_base_ids from public.selected_controls s where s.profile_resolution_id = v_base;
  -- Four active controls the baseline leaves out, and two it selects, from its end.
  select array_agg(c.id order by c.source_id) into v_add from (
    select c.id, c.source_id from public.controls c where c.catalog_revision_id = v_catalog and c.status = 'active' and not c.id = any(v_base_ids)
    order by c.source_id limit 4) c;
  select array_agg(c.id order by c.source_id desc) into v_cut from (
    select c.id, c.source_id from public.controls c where c.id = any(v_base_ids) order by c.source_id desc limit 2) c;
  -- A parameter with no choices on a selected control the overlays leave alone.
  select p.* into v_parameter from public.parameters p
  where p.catalog_revision_id = v_catalog and p.control_id = any(v_base_ids) and not p.control_id = any(v_cut) and not p.has_selection
  order by p.source_id limit 1;
  if cardinality(v_add) < 4 or cardinality(v_cut) < 2 or v_parameter.id is null then
    raise notice 'The reference baseline leaves no room for the test overlays: the checks of a changed stack were skipped';
    return;
  end if;

  -- The overlays: A adds a control and removes one; B adds another; C adds the control the
  -- program's tailoring adds; E removes the control whose parameter the tailoring sets; one that
  -- adds what A adds; a draft; and another workspace's.
  v_a := pg_temp.overlay(v_tenant, v_catalog, 'BO-A', jsonb_build_array(
    jsonb_build_object('controlId', v_add[1], 'action', 'include', 'rationale', 'A adds it.'),
    jsonb_build_object('controlId', v_cut[1], 'action', 'exclude', 'rationale', 'A removes it.')));
  v_b := pg_temp.overlay(v_tenant, v_catalog, 'BO-B', jsonb_build_array(
    jsonb_build_object('controlId', v_add[2], 'action', 'include', 'rationale', 'B adds it.')));
  v_c := pg_temp.overlay(v_tenant, v_catalog, 'BO-C', jsonb_build_array(
    jsonb_build_object('controlId', v_add[3], 'action', 'include', 'rationale', 'C adds what the tailoring adds.')));
  v_e := pg_temp.overlay(v_tenant, v_catalog, 'BO-E', jsonb_build_array(
    jsonb_build_object('controlId', v_parameter.control_id, 'action', 'exclude', 'rationale', 'E removes the control the tailoring sets.')));
  v_same := pg_temp.overlay(v_tenant, v_catalog, 'BO-SAME', jsonb_build_array(
    jsonb_build_object('controlId', v_add[1], 'action', 'include', 'rationale', 'It adds what A adds.')));
  v_draft := pg_temp.overlay(v_tenant, v_catalog, 'BO-DRAFT', jsonb_build_array(
    jsonb_build_object('controlId', v_add[4], 'action', 'include', 'rationale', 'A draft.')), false);
  perform set_config('request.jwt.claim.sub', 'a5600000-0000-0000-0000-000000000002', true);
  v_other := pg_temp.overlay(current_setting('test.other_tenant')::uuid, v_catalog, 'BO-OTHER', jsonb_build_array(
    jsonb_build_object('controlId', v_add[4], 'action', 'include', 'rationale', 'Another workspace''s.')));
  perform set_config('request.jwt.claim.sub', 'a5600000-0000-0000-0000-000000000001', true);

  -- A program set up with A and its own tailoring: it adds the control C adds, removes one, and
  -- sets a parameter.
  v_choice := pg_temp.program('BO-PROG', v_catalog, v_base, jsonb_build_array(v_a),
    jsonb_build_array(
      jsonb_build_object('controlId', v_add[3], 'action', 'include', 'rationale', 'The program adds it itself.'),
      jsonb_build_object('controlId', v_cut[2], 'action', 'exclude', 'rationale', 'The program removes it itself.')),
    jsonb_build_array(jsonb_build_object('parameterId', v_parameter.id, 'values', '["every week"]'::jsonb, 'rationale', 'The program sets it.')));
  if pg_temp.stack(v_choice) <> array['root', 'BO-A', 'tailoring'] then
    raise exception 'Program setup stacked %', pg_temp.stack(v_choice);
  end if;
  select c.profile_resolution_id into v_first_top from public.program_reference_choices c where c.id = v_choice;
  v_a_layer := pg_temp.layer(v_choice, 1);
  select s.id into v_system from public.systems s join public.program_reference_choices c on c.program_id = s.program_id
    where c.id = v_choice and s.is_authorization_boundary;
  -- Its SSP: the first revision published, and a draft after it, both written against the top.
  select r.id into v_ssp_published from public.ssp_revisions r where r.system_id = v_system and r.version_number = 1;
  update public.ssp_revisions set state = 'published', revision = revision + 1 where id = v_ssp_published;
  insert into public.ssp_revisions(tenant_id, system_id, profile_resolution_id, version_number, description)
    values (v_tenant, v_system, v_first_top, 2, 'The next draft.') returning id into v_ssp_draft;
  select count(*) into v_ir_count from public.implemented_requirements where ssp_revision_id = v_ssp_published;

  -- ---------------------------------------------------------------------------------------------
  -- An overlay added: A's layer stays, B is applied on it, and the tailoring is authored again last.
  -- ---------------------------------------------------------------------------------------------
  v_request := gen_random_uuid();
  v_answer := pg_temp.restack(v_choice, 1, v_request, array[v_a, v_b]);
  if pg_temp.stack(v_choice) <> array['root', 'BO-A', 'BO-B', 'tailoring'] then
    raise exception 'Adding B stacked %', pg_temp.stack(v_choice);
  end if;
  if pg_temp.layer(v_choice, 1) <> v_a_layer then raise exception 'Adding B did not keep A''s layer'; end if;
  select c.profile_resolution_id, c.revision into v_top, v_revision from public.program_reference_choices c where c.id = v_choice;
  if v_revision <> 2 or (v_answer->>'changed')::boolean is not true or (v_answer->>'revision')::bigint <> 2
    or (v_answer->>'profileResolutionId')::uuid <> v_top or (v_answer->>'previousProfileResolutionId')::uuid <> v_first_top then
    raise exception 'Adding B answered %', v_answer;
  end if;
  if not pg_temp.selects(v_top, v_add[1]) or not pg_temp.selects(v_top, v_add[2]) or not pg_temp.selects(v_top, v_add[3])
    or pg_temp.selects(v_top, v_cut[1]) or pg_temp.selects(v_top, v_cut[2]) then
    raise exception 'The stack with B selects the wrong controls';
  end if;
  if v_answer->'controls' <> jsonb_build_object('before', (select count(*) from public.selected_controls where profile_resolution_id = v_first_top),
      'after', (select count(*) from public.selected_controls where profile_resolution_id = v_top), 'added', 1, 'removed', 0) then
    raise exception 'Adding B counted %', v_answer->'controls';
  end if;
  -- The tailoring keeps both its decisions and its parameter, with their rationales.
  select r.profile_revision_id into v_tailoring_revision from public.profile_resolutions r where r.id = v_top;
  if (select count(*) from public.profile_rules r where r.profile_revision_id = v_tailoring_revision and r.kind in ('include', 'exclude')) <> 2
    or not exists (select 1 from public.profile_rules r where r.profile_revision_id = v_tailoring_revision and r.kind = 'include' and r.rationale = 'The program adds it itself.')
    or not exists (select 1 from public.profile_parameter_settings s join public.profile_parameter_values v on v.setting_id = s.id
      where s.profile_revision_id = v_tailoring_revision and s.parameter_id = v_parameter.id and v.value = 'every week' and s.rationale = 'The program sets it.') then
    raise exception 'The tailoring authored again lost a decision or its parameter';
  end if;
  if v_answer->'tailoring' <> '{"authored": true, "decisions": 2, "parameters": 1, "alreadySelected": [], "notInBaseline": [], "parametersDropped": []}'::jsonb then
    raise exception 'Adding B said of the tailoring %', v_answer->'tailoring';
  end if;
  -- The system that adopted the old top adopts the new one; the SSP revisions keep theirs.
  if (select s.adopted_profile_resolution_id from public.systems s where s.id = v_system) <> v_top
    or v_answer->'systems' <> jsonb_build_array(jsonb_build_object('id', v_system, 'code', 'BO-PROG-SYS')) then
    raise exception 'The system did not move to the new top: %', v_answer->'systems';
  end if;
  if exists (select 1 from public.ssp_revisions r where r.system_id = v_system and r.profile_resolution_id <> v_first_top)
    or (select r.state from public.ssp_revisions r where r.id = v_ssp_published) <> 'published'
    or (select count(*) from public.implemented_requirements where ssp_revision_id = v_ssp_published) <> v_ir_count
    or jsonb_array_length(v_answer->'ssps') <> 2
    or (v_answer->'ssps'->0->>'state') <> 'published' or (v_answer->'ssps'->1->>'state') <> 'draft' then
    raise exception 'An SSP revision changed, or the answer did not name them: %', v_answer->'ssps';
  end if;

  -- The same request sent again answers the same, and writes nothing.
  select count(*) into v_profiles from public.profiles where tenant_id = v_tenant;
  v_again := pg_temp.restack(v_choice, 1, v_request, array[v_a, v_b]);
  if v_again <> v_answer or (select count(*) from public.profiles where tenant_id = v_tenant) <> v_profiles
    or (select c.revision from public.program_reference_choices c where c.id = v_choice) <> 2 then
    raise exception 'The request sent again answered % or wrote something', v_again;
  end if;
  -- The same request id with another change is refused.
  perform pg_temp.expect_error(format('select pg_temp.restack(%L, 1, %L, array[%L, %L]::uuid[])', v_choice, v_request, v_b, v_a), 'PT409');
  -- Another request at the revision the reader saw before the change is refused, and writes nothing.
  perform pg_temp.expect_error(format('select pg_temp.restack(%L, 1, gen_random_uuid(), array[%L]::uuid[])', v_choice, v_b), 'PT409');
  -- The overlays the stack already holds, in its order: nothing is written, whatever revision.
  v_again := pg_temp.restack(v_choice, 1, gen_random_uuid(), array[v_a, v_b]);
  if (v_again->>'changed')::boolean or (select c.revision from public.program_reference_choices c where c.id = v_choice) <> 2
    or (select count(*) from public.profiles where tenant_id = v_tenant) <> v_profiles then
    raise exception 'The stack as it stands answered % or wrote something', v_again;
  end if;
  if (select count(*) from public.selected_controls s where s.profile_resolution_id = v_top) <> (v_again->'controls'->>'after')::integer then
    raise exception 'The stack as it stands counted %', v_again->'controls';
  end if;

  -- ---------------------------------------------------------------------------------------------
  -- Reordered: B first, then A, each applied to what is beneath it; the tailoring stays last.
  -- ---------------------------------------------------------------------------------------------
  v_answer := pg_temp.restack(v_choice, 2, gen_random_uuid(), array[v_b, v_a]);
  if pg_temp.stack(v_choice) <> array['root', 'BO-B', 'BO-A', 'tailoring'] then
    raise exception 'Reordering stacked %', pg_temp.stack(v_choice);
  end if;
  -- A and B decide on different controls, so the order changes no control.
  if v_answer->'controls'->>'added' <> '0' or v_answer->'controls'->>'removed' <> '0' then
    raise exception 'Reordering counted %', v_answer->'controls';
  end if;
  v_b_layer := pg_temp.layer(v_choice, 1);
  if (select r.base_profile_resolution_id from public.profile_resolutions r where r.id = v_b_layer) <> v_base then
    raise exception 'B was not applied on the reference baseline';
  end if;

  -- Removed: A goes, B's layer stays, and the tailoring is authored again on it.
  v_answer := pg_temp.restack(v_choice, 3, gen_random_uuid(), array[v_b]);
  if pg_temp.stack(v_choice) <> array['root', 'BO-B', 'tailoring'] or pg_temp.layer(v_choice, 1) <> v_b_layer then
    raise exception 'Removing A stacked %', pg_temp.stack(v_choice);
  end if;
  select c.profile_resolution_id into v_top from public.program_reference_choices c where c.id = v_choice;
  if pg_temp.selects(v_top, v_add[1]) or not pg_temp.selects(v_top, v_cut[1]) or pg_temp.selects(v_top, v_cut[2])
    or v_answer->'controls'->>'added' <> '1' or v_answer->'controls'->>'removed' <> '1' then
    raise exception 'Removing A selects the wrong controls: %', v_answer->'controls';
  end if;

  -- An overlay that adds what the tailoring adds, and one that removes the control whose
  -- parameter it sets: the tailoring keeps only what still changes something, and says what not.
  v_answer := pg_temp.restack(v_choice, 4, gen_random_uuid(), array[v_b, v_c, v_e]);
  if pg_temp.stack(v_choice) <> array['root', 'BO-B', 'BO-C', 'BO-E', 'tailoring'] then
    raise exception 'Adding C and E stacked %', pg_temp.stack(v_choice);
  end if;
  if v_answer->'tailoring' <> jsonb_build_object('authored', true, 'decisions', 1, 'parameters', 0,
      'alreadySelected', jsonb_build_array((select c.code from public.controls c where c.id = v_add[3])), 'notInBaseline', '[]'::jsonb,
      'parametersDropped', jsonb_build_array(v_parameter.source_id)) then
    raise exception 'Adding C and E said of the tailoring %', v_answer->'tailoring';
  end if;
  select c.profile_resolution_id into v_top from public.program_reference_choices c where c.id = v_choice;
  if not pg_temp.selects(v_top, v_add[3]) or pg_temp.selects(v_top, v_parameter.control_id) or pg_temp.selects(v_top, v_cut[2]) then
    raise exception 'The stack with C and E selects the wrong controls';
  end if;

  -- ---------------------------------------------------------------------------------------------
  -- What stops a change: nothing of it is written.
  -- ---------------------------------------------------------------------------------------------
  select count(*) into v_profiles from public.profiles where tenant_id = v_tenant;
  -- A draft overlay; another workspace's; one that changes nothing where it sits; one asked twice;
  -- more than six.
  perform pg_temp.expect_error(format('select pg_temp.restack(%L, 5, gen_random_uuid(), array[%L, %L]::uuid[])', v_choice, v_b, v_draft), '23514');
  perform pg_temp.expect_error(format('select pg_temp.restack(%L, 5, gen_random_uuid(), array[%L, %L]::uuid[])', v_choice, v_b, v_other), '23514');
  perform pg_temp.expect_error(format('select pg_temp.restack(%L, 5, gen_random_uuid(), array[%L, %L, %L]::uuid[])', v_choice, v_b, v_a, v_same), '23514');
  perform pg_temp.expect_error(format('select pg_temp.restack(%L, 5, gen_random_uuid(), array[%L, %L]::uuid[])', v_choice, v_b, v_b), '23514');
  perform pg_temp.expect_error(format('select pg_temp.restack(%L, 5, gen_random_uuid(), array[%L, %L, %L, %L, %L, %L, %L]::uuid[])',
    v_choice, v_a, v_b, v_c, v_e, v_same, v_draft, v_other), '23514');
  if (select c.revision from public.program_reference_choices c where c.id = v_choice) <> 5
    or (select count(*) from public.profiles where tenant_id = v_tenant) <> v_profiles then
    raise exception 'A refused change wrote something';
  end if;

  -- Every overlay removed: the tailoring is authored on the reference baseline itself.
  v_answer := pg_temp.restack(v_choice, 5, gen_random_uuid(), '{}'::uuid[]);
  if pg_temp.stack(v_choice) <> array['root', 'tailoring'] or pg_temp.layer(v_choice, 0) <> v_base then
    raise exception 'Removing every overlay stacked %', pg_temp.stack(v_choice);
  end if;
  -- The tailoring is carried as it stands now: what the last change left out of it (the add C
  -- made moot, the parameter of the control E removed) is not restored with C and E gone.
  select c.profile_resolution_id into v_top from public.program_reference_choices c where c.id = v_choice;
  if v_answer->'tailoring'->>'parameters' <> '0' or v_answer->'tailoring'->>'decisions' <> '1'
    or not pg_temp.selects(v_top, v_parameter.control_id) or pg_temp.selects(v_top, v_add[3]) or pg_temp.selects(v_top, v_cut[2]) then
    raise exception 'Removing every overlay said of the tailoring %', v_answer->'tailoring';
  end if;

  -- Through every change the SSP revisions kept the resolution they were written against.
  if exists (select 1 from public.ssp_revisions r where r.system_id = v_system and r.profile_resolution_id <> v_first_top)
    or (select count(*) from public.ssp_revisions r where r.system_id = v_system) <> 2
    or (select r.state from public.ssp_revisions r where r.id = v_ssp_published) <> 'published'
    or (select count(*) from public.implemented_requirements where ssp_revision_id = v_ssp_published) <> v_ir_count then
    raise exception 'An SSP revision changed';
  end if;
  -- The system followed the program profile all the way.
  if (select s.adopted_profile_resolution_id from public.systems s where s.id = v_system) <> v_top then
    raise exception 'The system did not follow the program profile';
  end if;

  -- ---------------------------------------------------------------------------------------------
  -- A program with no tailoring, and one whose tailoring a new overlay makes moot.
  -- ---------------------------------------------------------------------------------------------
  v_bare := pg_temp.program('BO-BARE', v_catalog, v_base, jsonb_build_array(v_a), '[]'::jsonb, '[]'::jsonb);
  v_answer := pg_temp.restack(v_bare, 1, gen_random_uuid(), '{}'::uuid[]);
  if pg_temp.stack(v_bare) <> array['root'] or (v_answer->>'profileResolutionId')::uuid <> v_base or v_answer->'tailoring' <> 'null'::jsonb then
    raise exception 'A program with no tailoring answered %, stacked %', v_answer, pg_temp.stack(v_bare);
  end if;
  v_answer := pg_temp.restack(v_bare, 2, gen_random_uuid(), array[v_b]);
  if pg_temp.stack(v_bare) <> array['root', 'BO-B'] then
    raise exception 'A program with no tailoring stacked %', pg_temp.stack(v_bare);
  end if;
  v_moot := pg_temp.program('BO-MOOT', v_catalog, v_base, '[]'::jsonb,
    jsonb_build_array(jsonb_build_object('controlId', v_add[2], 'action', 'include', 'rationale', 'The program adds what B adds.')), '[]'::jsonb);
  v_answer := pg_temp.restack(v_moot, 1, gen_random_uuid(), array[v_b]);
  if pg_temp.stack(v_moot) <> array['root', 'BO-B'] or (v_answer->'tailoring'->>'authored')::boolean
    or v_answer->'tailoring'->'alreadySelected' <> jsonb_build_array((select c.code from public.controls c where c.id = v_add[2])) then
    raise exception 'A tailoring with nothing left answered %, stacked %', v_answer->'tailoring', pg_temp.stack(v_moot);
  end if;
  perform set_config('test.choice', v_choice::text, true);
  perform set_config('test.overlay', v_b::text, true);
end $$;

-- A viewer reads the program and may not change its stack; someone outside the workspace may not
-- either, in either workspace's name.
reset role;
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'a5600000-0000-0000-0000-000000000003', 'viewer');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5600000-0000-0000-0000-000000000003', true);
select pg_temp.expect_error($$select public.set_program_baseline_overlays(current_setting('test.tenant')::uuid,
  nullif(current_setting('test.choice', true), '')::uuid, 6, gen_random_uuid(), '[]'::jsonb)$$, '42501');
select set_config('request.jwt.claim.sub', 'a5600000-0000-0000-0000-000000000002', true);
select pg_temp.expect_error($$select public.set_program_baseline_overlays(current_setting('test.tenant')::uuid,
  nullif(current_setting('test.choice', true), '')::uuid, 6, gen_random_uuid(), '[]'::jsonb)$$, '42501');
do $$ begin
  if nullif(current_setting('test.choice', true), '') is null then return; end if;
  perform pg_temp.expect_error(format('select public.set_program_baseline_overlays(%L::uuid, %L::uuid, 6, gen_random_uuid(), ''[]''::jsonb)',
    current_setting('test.other_tenant'), current_setting('test.choice')), '23514');
end $$;
reset role;
do $$ begin
  if nullif(current_setting('test.choice', true), '') is null then return; end if;
  if (select c.revision from public.program_reference_choices c where c.id = current_setting('test.choice')::uuid) <> 6 then
    raise exception 'A viewer or an outsider changed the stack';
  end if;
end $$;

rollback;
