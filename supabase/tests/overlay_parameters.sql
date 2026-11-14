-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Parameter values in an overlay: who may write them, what a value may be (a parameter of a
-- control of the overlay's edition, a published choice, one value where the parameter takes one,
-- text with a rationale), a save sent again, a stale revision, a removal, publishing with values
-- alone, a published overlay's values held, a draft's values deleted with it, and, with the pinned
-- references installed, what applying an overlay writes: the layer's own settings for the
-- controls it selects, a value for a control it leaves out recorded beside the layer, an overlay
-- whose values all set nothing refused, the nearest layer's value winning, and the values read back
-- through program_control_parameters and program_resiliency_choice.
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
-- A draft overlay with the decisions given, written through the overlay commands; its id.
create function pg_temp.overlay(p_tenant uuid, p_catalog uuid, p_code text, p_decisions jsonb, p_parameters jsonb, p_publish boolean default true) returns uuid language plpgsql as $$
declare v_id uuid := gen_random_uuid(); v_overlay public.control_overlays;
begin
  v_overlay := public.save_control_overlay(p_tenant, v_id, null, jsonb_build_object('code', p_code, 'title', p_code || ' test overlay',
    'description', 'A test overlay.', 'catalogRevisionId', p_catalog));
  if jsonb_array_length(p_decisions) > 0 then
    v_overlay := public.set_control_overlay_decisions(p_tenant, v_id, v_overlay.revision, p_decisions, '[]'::jsonb);
  end if;
  if jsonb_array_length(p_parameters) > 0 then
    v_overlay := public.set_control_overlay_parameters(p_tenant, v_id, v_overlay.revision, p_parameters, '[]'::jsonb);
  end if;
  if p_publish then v_overlay := public.publish_control_overlay(p_tenant, v_id, v_overlay.revision); end if;
  return v_id;
end;
$$;
-- A program with one program profile stacking the overlays given; the program's id.
create function pg_temp.program(p_code text, p_catalog uuid, p_base uuid, p_overlays jsonb) returns uuid language plpgsql as $$
declare v_created jsonb; v_key uuid := gen_random_uuid();
begin
  v_created := public.create_program_wizard(current_setting('test.tenant')::uuid, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', p_code, 'name', p_code || ' overlay parameters test', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb, 'catalogRevisionId', p_catalog,
    'profiles', jsonb_build_array(jsonb_build_object('key', v_key, 'baseResolutionId', p_base, 'overlayIds', p_overlays,
      'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)),
    'systems', jsonb_build_array(jsonb_build_object(
      'key', gen_random_uuid(), 'code', p_code || '-SYS', 'name', p_code || ' system', 'description', '',
      'type', 'information_system', 'ownerPartyId', null, 'confidentiality', 'low', 'integrity', 'low', 'availability', 'low',
      'categorizationRationale', 'A limited impact boundary for a rollback test.', 'profileKey', v_key, 'elements', '[]'::jsonb))));
  return (v_created->>'programId')::uuid;
end;
$$;
-- The resolution n layers above the root of a program's one stack (0 is the root).
create function pg_temp.layer(p_program uuid, p_index integer) returns uuid language plpgsql stable as $$
declare v_cursor uuid; v_hops uuid[] := '{}';
begin
  select c.profile_resolution_id into v_cursor from public.program_reference_choices c where c.program_id = p_program;
  while v_cursor is not null loop
    v_hops := array_prepend(v_cursor, v_hops);
    select r.base_profile_resolution_id into v_cursor from public.profile_resolutions r where r.id = v_cursor;
  end loop;
  return v_hops[p_index + 1];
end;
$$;
-- The values a layer's own setting gives a parameter, or null when the layer sets none.
create function pg_temp.setting(p_resolution uuid, p_parameter uuid) returns text[] language sql stable as $$
  select array_agg(v.value order by v.ordinal)
  from public.profile_resolutions r
  join public.profile_parameter_settings s on s.profile_revision_id = r.profile_revision_id and s.parameter_id = p_parameter
  join public.profile_parameter_values v on v.setting_id = s.id
  where r.id = p_resolution;
$$;
grant execute on function pg_temp.expect_error(text, text), pg_temp.overlay(uuid, uuid, text, jsonb, jsonb, boolean),
  pg_temp.program(text, uuid, uuid, jsonb), pg_temp.layer(uuid, integer), pg_temp.setting(uuid, uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------------------------
-- Who may write: a signed-in member, through the command, which runs as its owner as the other
-- overlay commands do; no member writes a value row directly.
-- ---------------------------------------------------------------------------------------------
do $$ begin
  if has_function_privilege('anon', 'public.set_control_overlay_parameters(uuid, uuid, bigint, jsonb, jsonb)', 'execute')
    or has_function_privilege('public', 'public.set_control_overlay_parameters(uuid, uuid, bigint, jsonb, jsonb)', 'execute') then
    raise exception 'An anonymous session may execute set_control_overlay_parameters';
  end if;
  if not has_function_privilege('authenticated', 'public.set_control_overlay_parameters(uuid, uuid, bigint, jsonb, jsonb)', 'execute') then
    raise exception 'A signed-in session may not execute set_control_overlay_parameters';
  end if;
  if not (select p.prosecdef from pg_catalog.pg_proc p where p.oid = 'public.set_control_overlay_parameters(uuid, uuid, bigint, jsonb, jsonb)'::regprocedure)
    or has_table_privilege('authenticated', 'public.control_overlay_parameters', 'insert')
    or has_table_privilege('authenticated', 'public.control_overlay_parameters', 'update')
    or has_table_privilege('authenticated', 'public.control_overlay_parameters', 'delete') then
    raise exception 'An overlay''s values can be written around the command';
  end if;
  if has_function_privilege('authenticated', 'public.overlay_parameter_values(public.parameters, jsonb)', 'execute') then
    raise exception 'A member may call the internal value check';
  end if;
  if not has_table_privilege('authenticated', 'public.control_overlay_parameters', 'select') then
    raise exception 'A member may not read an overlay''s values';
  end if;
end $$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('a5620000-0000-0000-0000-000000000001', 'overlay-parameters-editor@example.test', '{"name":"Overlay parameters test editor"}'),
  ('a5620000-0000-0000-0000-000000000002', 'overlay-parameters-outsider@example.test', '{}'),
  ('a5620000-0000-0000-0000-000000000003', 'overlay-parameters-viewer@example.test', '{}');
select set_config('request.jwt.claim.sub', 'a5620000-0000-0000-0000-000000000002', true);
set local role authenticated;
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
select set_config('request.jwt.claim.sub', 'a5620000-0000-0000-0000-000000000001', true);
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);

-- With no account, nothing is written.
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$select public.set_control_overlay_parameters(current_setting('test.tenant')::uuid, gen_random_uuid(), 1, '[]'::jsonb, '[]'::jsonb)$$, '42501');
select set_config('request.jwt.claim.sub', 'a5620000-0000-0000-0000-000000000001', true);
-- An empty or malformed request is refused before anything is read.
select pg_temp.expect_error($$select public.set_control_overlay_parameters(current_setting('test.tenant')::uuid, gen_random_uuid(), 1, '[]'::jsonb, '[]'::jsonb)$$, '23514');
select pg_temp.expect_error($$select public.set_control_overlay_parameters(current_setting('test.tenant')::uuid, gen_random_uuid(), 1, '[{"parameterId":"not an id"}]'::jsonb, '[]'::jsonb)$$, '23514');
select pg_temp.expect_error($$select public.set_control_overlay_parameters(current_setting('test.tenant')::uuid, gen_random_uuid(), 1, '{}'::jsonb, '[]'::jsonb)$$, '23514');

-- ---------------------------------------------------------------------------------------------
-- Authoring a draft's values, with a catalog edition installed.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_text public.parameters; v_one public.parameters; v_choice text; v_other_choice text;
  v_id uuid := gen_random_uuid(); v_overlay public.control_overlays; v_again public.control_overlays; v_revision bigint;
  v_published uuid; v_doomed uuid; v_row public.control_overlay_parameters;
begin
  select k.id into v_catalog from public.catalog_revisions k where k.state = 'published' and k.tenant_id is null order by k.created_at desc limit 1;
  if v_catalog is null then
    raise notice 'No catalog edition is installed: the checks of an overlay''s values were skipped';
    return;
  end if;
  -- A parameter that takes free text, and one that takes exactly one published choice.
  select p.* into v_text from public.parameters p join public.controls c on c.id = p.control_id and c.status = 'active'
    where p.catalog_revision_id = v_catalog and not p.has_selection order by p.source_id limit 1;
  select p.* into v_one from public.parameters p join public.controls c on c.id = p.control_id and c.status = 'active'
    where p.catalog_revision_id = v_catalog and p.has_selection and coalesce(p.selection_count::text, 'one') = 'one'
      and (select count(*) from public.parameter_choices x where x.parameter_id = p.id) >= 2
      and not exists (select 1 from public.parameter_choices x where x.parameter_id = p.id and x.value ~ '(\{\{|<[^>]+>)')
    order by p.source_id limit 1;
  select x.value into v_choice from public.parameter_choices x where x.parameter_id = v_one.id order by x.ordinal limit 1;
  select x.value into v_other_choice from public.parameter_choices x where x.parameter_id = v_one.id order by x.ordinal offset 1 limit 1;
  if v_text.id is null or v_one.id is null then
    raise notice 'The edition has no text and choice parameters to set: the checks of an overlay''s values were skipped';
    return;
  end if;

  v_overlay := public.save_control_overlay(v_tenant, v_id, null, jsonb_build_object('code', 'OP-DRAFT', 'title', 'Values test overlay',
    'description', '', 'catalogRevisionId', v_catalog));
  v_revision := v_overlay.revision;
  -- Values are trimmed and kept in order, with the rationale, at the next revision.
  v_overlay := public.set_control_overlay_parameters(v_tenant, v_id, v_revision, jsonb_build_array(
    jsonb_build_object('parameterId', v_text.id, 'values', jsonb_build_array(' every week ', 'on change'), 'rationale', ' Fielded systems change weekly. '),
    jsonb_build_object('parameterId', v_one.id, 'values', jsonb_build_array(v_choice), 'rationale', 'One published choice.')), '[]'::jsonb);
  if v_overlay.revision <> v_revision + 1 then raise exception 'Setting values did not move the overlay to its next revision'; end if;
  select * into v_row from public.control_overlay_parameters where overlay_id = v_id and parameter_id = v_text.id;
  if v_row.parameter_values is distinct from array['every week', 'on change'] or v_row.rationale <> 'Fielded systems change weekly.' then
    raise exception 'The values were not kept trimmed and in order: % %', v_row.parameter_values, v_row.rationale;
  end if;
  -- Sent again at the revision it was sent at, it changes nothing.
  v_again := public.set_control_overlay_parameters(v_tenant, v_id, v_revision, jsonb_build_array(
    jsonb_build_object('parameterId', v_text.id, 'values', jsonb_build_array('every week', 'on change'), 'rationale', 'Fielded systems change weekly.'),
    jsonb_build_object('parameterId', v_one.id, 'values', jsonb_build_array(v_choice), 'rationale', 'One published choice.')), '[]'::jsonb);
  if v_again.revision <> v_overlay.revision then raise exception 'A save sent again wrote again'; end if;
  -- Another change at a revision another session moved on is refused.
  perform pg_temp.expect_error(format('select public.set_control_overlay_parameters(%L, %L, %s, %L::jsonb, ''[]''::jsonb)', v_tenant, v_id, v_revision,
    jsonb_build_array(jsonb_build_object('parameterId', v_text.id, 'values', jsonb_build_array('daily'), 'rationale', 'Stale.'))), 'PT409');
  -- What a value may be: a published choice, one of them where the parameter takes one, text, a
  -- rationale; a parameter of the overlay's edition, each once.
  perform pg_temp.expect_error(format('select public.set_control_overlay_parameters(%L, %L, %s, %L::jsonb, ''[]''::jsonb)', v_tenant, v_id, v_overlay.revision,
    jsonb_build_array(jsonb_build_object('parameterId', v_one.id, 'values', jsonb_build_array('not a published choice'), 'rationale', 'A guess.'))), '23514');
  perform pg_temp.expect_error(format('select public.set_control_overlay_parameters(%L, %L, %s, %L::jsonb, ''[]''::jsonb)', v_tenant, v_id, v_overlay.revision,
    jsonb_build_array(jsonb_build_object('parameterId', v_one.id, 'values', jsonb_build_array(v_choice, v_other_choice), 'rationale', 'Two of one.'))), '23514');
  perform pg_temp.expect_error(format('select public.set_control_overlay_parameters(%L, %L, %s, %L::jsonb, ''[]''::jsonb)', v_tenant, v_id, v_overlay.revision,
    jsonb_build_array(jsonb_build_object('parameterId', v_text.id, 'values', '[]'::jsonb, 'rationale', 'Nothing.'))), '23514');
  perform pg_temp.expect_error(format('select public.set_control_overlay_parameters(%L, %L, %s, %L::jsonb, ''[]''::jsonb)', v_tenant, v_id, v_overlay.revision,
    jsonb_build_array(jsonb_build_object('parameterId', v_text.id, 'values', jsonb_build_array('   '), 'rationale', 'Blank.'))), '23514');
  perform pg_temp.expect_error(format('select public.set_control_overlay_parameters(%L, %L, %s, %L::jsonb, ''[]''::jsonb)', v_tenant, v_id, v_overlay.revision,
    jsonb_build_array(jsonb_build_object('parameterId', v_text.id, 'values', jsonb_build_array(7), 'rationale', 'A number.'))), '23514');
  perform pg_temp.expect_error(format('select public.set_control_overlay_parameters(%L, %L, %s, %L::jsonb, ''[]''::jsonb)', v_tenant, v_id, v_overlay.revision,
    jsonb_build_array(jsonb_build_object('parameterId', v_text.id, 'values', jsonb_build_array('daily'), 'rationale', ' '))), '23514');
  perform pg_temp.expect_error(format('select public.set_control_overlay_parameters(%L, %L, %s, %L::jsonb, ''[]''::jsonb)', v_tenant, v_id, v_overlay.revision,
    jsonb_build_array(jsonb_build_object('parameterId', gen_random_uuid(), 'values', jsonb_build_array('daily'), 'rationale', 'No such parameter.'))), '23514');
  perform pg_temp.expect_error(format('select public.set_control_overlay_parameters(%L, %L, %s, %L::jsonb, ''[]''::jsonb)', v_tenant, v_id, v_overlay.revision,
    jsonb_build_array(jsonb_build_object('parameterId', v_text.id, 'values', jsonb_build_array('daily'), 'rationale', 'Once.'),
      jsonb_build_object('parameterId', v_text.id, 'values', jsonb_build_array('weekly'), 'rationale', 'Twice.'))), '23514');
  -- A removal takes its value set and nothing else.
  v_overlay := public.set_control_overlay_parameters(v_tenant, v_id, v_overlay.revision, '[]'::jsonb, jsonb_build_array(v_one.id));
  if exists (select 1 from public.control_overlay_parameters where overlay_id = v_id and parameter_id = v_one.id)
    or not exists (select 1 from public.control_overlay_parameters where overlay_id = v_id and parameter_id = v_text.id) then
    raise exception 'A removal took the wrong value set';
  end if;
  -- The register counts them.
  if (select r.parameter_count from public.control_overlay_rows r where r.id = v_id) <> 1 then
    raise exception 'The register does not count the overlay''s values';
  end if;
  -- An overlay with values alone, no decision, may be published; then its values are held.
  v_overlay := public.publish_control_overlay(v_tenant, v_id, v_overlay.revision);
  if v_overlay.state <> 'published' then raise exception 'An overlay with values alone was not published'; end if;
  perform pg_temp.expect_error(format('select public.set_control_overlay_parameters(%L, %L, %s, %L::jsonb, ''[]''::jsonb)', v_tenant, v_id, v_overlay.revision,
    jsonb_build_array(jsonb_build_object('parameterId', v_text.id, 'values', jsonb_build_array('daily'), 'rationale', 'After publishing.'))), '23514');
  perform pg_temp.expect_error(format('select public.set_control_overlay_parameters(%L, %L, %s, ''[]''::jsonb, %L::jsonb)', v_tenant, v_id, v_overlay.revision,
    jsonb_build_array(v_text.id)), '23514');
  perform set_config('test.published_overlay', v_id::text, true);
  perform set_config('test.text_parameter', v_text.id::text, true);

  -- An overlay with neither a decision nor a value is not published.
  v_published := gen_random_uuid();
  v_overlay := public.save_control_overlay(v_tenant, v_published, null, jsonb_build_object('code', 'OP-EMPTY', 'title', 'Empty overlay',
    'description', '', 'catalogRevisionId', v_catalog));
  perform pg_temp.expect_error(format('select public.publish_control_overlay(%L, %L, %s)', v_tenant, v_published, v_overlay.revision), '23514');

  -- Deleting a draft deletes its values with it.
  v_doomed := pg_temp.overlay(v_tenant, v_catalog, 'OP-DOOMED', '[]'::jsonb, jsonb_build_array(
    jsonb_build_object('parameterId', v_text.id, 'values', jsonb_build_array('daily'), 'rationale', 'Going.')), false);
  select o.revision into v_revision from public.control_overlays o where o.id = v_doomed;
  if public.delete_control_overlay(v_tenant, v_doomed, v_revision) is not true then
    raise exception 'A draft with values was not deleted';
  end if;
  if exists (select 1 from public.control_overlay_parameters where overlay_id = v_doomed) then
    raise exception 'A deleted draft left its values behind';
  end if;
end $$;

-- A published overlay's values are held even for a statement that skips the command.
reset role;
do $$ begin
  if current_setting('test.published_overlay', true) is null or current_setting('test.published_overlay', true) = '' then return; end if;
  perform pg_temp.expect_error(format('update public.control_overlay_parameters set parameter_values = array[''changed''] where overlay_id = %L',
    current_setting('test.published_overlay')), '23514');
  perform pg_temp.expect_error(format('delete from public.control_overlay_parameters where overlay_id = %L', current_setting('test.published_overlay')), '23514');
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5620000-0000-0000-0000-000000000001', true);

-- ---------------------------------------------------------------------------------------------
-- Applying, with the pinned references installed (a catalog edition and a reference baseline).
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_base uuid; v_base_ids uuid[];
  v_kept public.parameters; v_added public.parameters; v_cut public.parameters;
  v_mix uuid; v_values uuid; v_moot uuid; v_program uuid; v_layer1 uuid; v_layer2 uuid; v_read jsonb; v_entry jsonb;
  v_sa24 uuid; v_sa24_parameter uuid; v_techniques text[]; v_codes text[]; v_choice uuid; v_revision bigint; v_answer jsonb;
begin
  -- The smallest reference baseline on the newest published catalog edition.
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id and i.catalog_revision_id is not null
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published' and k.tenant_id is null
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
  order by k.created_at desc, (select count(*) from public.selected_controls s where s.profile_resolution_id = r.id), r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the checks of an applied overlay''s values were skipped';
    return;
  end if;
  select array_agg(s.control_id) into v_base_ids from public.selected_controls s where s.profile_resolution_id = v_base;
  -- A text parameter of a control the base selects and keeps; one of a control the base leaves out,
  -- which the overlay adds; and one of a control the base selects, which the overlay removes.
  select p.* into v_kept from public.parameters p where p.catalog_revision_id = v_catalog and p.control_id = any(v_base_ids) and not p.has_selection
    order by p.source_id limit 1;
  select p.* into v_cut from public.parameters p where p.catalog_revision_id = v_catalog and p.control_id = any(v_base_ids) and not p.has_selection
    and p.control_id <> v_kept.control_id order by p.source_id desc limit 1;
  select p.* into v_added from public.parameters p join public.controls c on c.id = p.control_id and c.status = 'active'
    where p.catalog_revision_id = v_catalog and not p.control_id = any(v_base_ids) and not p.has_selection
      and c.source_id <> 'sa-24' order by p.source_id limit 1;
  if v_kept.id is null or v_cut.id is null or v_added.id is null then
    raise notice 'The reference baseline leaves no room for the test values: the checks of an applied overlay''s values were skipped';
    return;
  end if;

  -- OP-MIX adds a control and removes one, and sets a value for each and for one the base keeps;
  -- OP-VALUES only sets the kept parameter again; OP-MOOT only sets the removed control's.
  v_mix := pg_temp.overlay(v_tenant, v_catalog, 'OP-MIX', jsonb_build_array(
      jsonb_build_object('controlId', v_added.control_id, 'action', 'include', 'rationale', 'Mix adds it.'),
      jsonb_build_object('controlId', v_cut.control_id, 'action', 'exclude', 'rationale', 'Mix removes it.')),
    jsonb_build_array(
      jsonb_build_object('parameterId', v_kept.id, 'values', jsonb_build_array('quarterly'), 'rationale', 'Mix sets the kept one.'),
      jsonb_build_object('parameterId', v_added.id, 'values', jsonb_build_array('annually'), 'rationale', 'Mix sets the added one.'),
      jsonb_build_object('parameterId', v_cut.id, 'values', jsonb_build_array('never'), 'rationale', 'Mix sets the removed one.')));
  v_values := pg_temp.overlay(v_tenant, v_catalog, 'OP-VALUES', '[]'::jsonb, jsonb_build_array(
    jsonb_build_object('parameterId', v_kept.id, 'values', jsonb_build_array('monthly'), 'rationale', 'Values sets it again.')));
  v_moot := pg_temp.overlay(v_tenant, v_catalog, 'OP-MOOT', '[]'::jsonb, jsonb_build_array(
    jsonb_build_object('parameterId', v_cut.id, 'values', jsonb_build_array('weekly'), 'rationale', 'Moot sets a removed control''s.')));

  v_program := pg_temp.program('OP-PROG', v_catalog, v_base, jsonb_build_array(v_mix, v_values));
  v_layer1 := pg_temp.layer(v_program, 1);
  v_layer2 := pg_temp.layer(v_program, 2);
  -- The mix layer sets the values of the controls it selects, and records the one it cannot set.
  if pg_temp.setting(v_layer1, v_kept.id) is distinct from array['quarterly'] or pg_temp.setting(v_layer1, v_added.id) is distinct from array['annually'] then
    raise exception 'The overlay''s values for the controls its layer selects were not set on the layer';
  end if;
  if pg_temp.setting(v_layer1, v_cut.id) is not null then raise exception 'A value was set for a control the layer removes'; end if;
  if (select a.not_applicable_parameter_ids from public.profile_overlay_applications a where a.profile_resolution_id = v_layer1) is distinct from array[v_cut.id] then
    raise exception 'The value that set nothing is not recorded beside the layer';
  end if;
  if (select s.rationale from public.profile_parameter_settings s join public.profile_resolutions r on r.profile_revision_id = s.profile_revision_id
      where r.id = v_layer1 and s.parameter_id = v_added.id) <> 'Mix sets the added one.' then
    raise exception 'The layer''s setting does not carry the overlay''s rationale';
  end if;
  -- A values-only overlay is a layer of its own, and the nearest layer's value is the program's.
  if pg_temp.setting(v_layer2, v_kept.id) is distinct from array['monthly'] then raise exception 'A values-only overlay made no layer'; end if;
  if exists (select 1 from public.selected_controls a where a.profile_resolution_id = v_layer2
      and not exists (select 1 from public.selected_controls b where b.profile_resolution_id = v_layer1 and b.control_id = a.control_id)) then
    raise exception 'A values-only layer changed the selection';
  end if;
  v_read := public.program_control_parameters(v_program, v_kept.control_id);
  select e into v_entry from jsonb_array_elements(v_read->'stacks'->0->'parameters') e where (e->>'parameter_id')::uuid = v_kept.id;
  if v_entry->'values' is distinct from '["monthly"]'::jsonb or v_entry->'source'->>'kind' <> 'overlay'
    or v_entry->'source'->>'title' <> 'OP-VALUES test overlay' or (v_entry->'source'->>'resolution_id')::uuid <> v_layer2 then
    raise exception 'program_control_parameters does not read the nearest overlay''s value: %', v_entry;
  end if;
  v_read := public.program_control_parameters(v_program, v_added.control_id);
  select e into v_entry from jsonb_array_elements(v_read->'stacks'->0->'parameters') e where (e->>'parameter_id')::uuid = v_added.id;
  if v_entry->'values' is distinct from '["annually"]'::jsonb or v_entry->'source'->>'title' <> 'OP-MIX test overlay' then
    raise exception 'program_control_parameters does not read the overlay''s value of the control it adds: %', v_entry;
  end if;
  -- The removed control is not in the program's baseline, so nothing is read for it.
  if (public.program_control_parameters(v_program, v_cut.control_id)->>'selected')::boolean then
    raise exception 'A control the overlay removes reads as selected';
  end if;

  -- An overlay whose values all set nothing where it sits changes nothing, and is refused.
  perform pg_temp.expect_error(format('select pg_temp.program(%L, %L, %L, %L::jsonb)', 'OP-MOOT-PROG', v_catalog, v_base,
    jsonb_build_array(v_mix, v_moot)), '23514');
  -- The same values flow through a change of the stack: the values-only overlay alone.
  select c.id, c.revision into v_choice, v_revision from public.program_reference_choices c where c.program_id = v_program;
  v_answer := public.set_program_baseline_overlays(v_tenant, v_choice, v_revision, gen_random_uuid(), jsonb_build_array(v_values));
  if pg_temp.setting(pg_temp.layer(v_program, 1), v_kept.id) is distinct from array['monthly'] or pg_temp.layer(v_program, 2) is not null then
    raise exception 'A changed stack did not apply the overlay''s values: %', v_answer;
  end if;

  -- SA-24's techniques set by an overlay are the program's resiliency choice.
  select p.id into v_sa24_parameter from public.parameters p join public.controls c on c.id = p.control_id
    where p.catalog_revision_id = v_catalog and c.source_id = 'sa-24' and p.source_id = 'sa-24_odp.03';
  select array_agg(i.title order by i.ordinal), array_agg(i.code order by i.ordinal) into v_techniques, v_codes from (
    select i.title, i.code, i.ordinal from public.framework_items i
    join public.framework_revisions r on r.id = i.framework_revision_id
    join public.frameworks f on f.id = r.framework_id and f.code = 'nist-sp800-160v2r1-cref'
    where i.kind = 'technique' order by r.created_at desc, i.ordinal limit 2) i;
  if v_sa24_parameter is null or cardinality(v_techniques) < 2 or (select c.id from public.controls c where c.catalog_revision_id = v_catalog and c.source_id = 'sa-24') = any(v_base_ids) then
    raise notice 'The cyber resiliency framework is not installed: the check of SA-24 set by an overlay was skipped';
    return;
  end if;
  v_sa24 := pg_temp.overlay(v_tenant, v_catalog, 'OP-SA24', jsonb_build_array(
      jsonb_build_object('controlId', (select c.id from public.controls c where c.catalog_revision_id = v_catalog and c.source_id = 'sa-24'),
        'action', 'include', 'rationale', 'Design for cyber resiliency.')),
    jsonb_build_array(jsonb_build_object('parameterId', v_sa24_parameter, 'values', to_jsonb(v_techniques), 'rationale', 'The techniques the program applies.')));
  v_program := pg_temp.program('OP-SA24-PROG', v_catalog, v_base, jsonb_build_array(v_sa24));
  v_read := public.program_resiliency_choice(v_program);
  if not (v_read->>'selected')::boolean or v_read->'techniques' is distinct from to_jsonb(v_codes) then
    raise exception 'program_resiliency_choice does not read SA-24''s techniques from the overlay: %', v_read;
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- A viewer reads the values and may not write them; someone outside the workspace may do neither.
-- ---------------------------------------------------------------------------------------------
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'a5620000-0000-0000-0000-000000000003', 'viewer');
select set_config('request.jwt.claim.sub', 'a5620000-0000-0000-0000-000000000003', true);
do $$ begin
  if current_setting('test.published_overlay', true) is null or current_setting('test.published_overlay', true) = '' then return; end if;
  if not exists (select 1 from public.control_overlay_parameters where overlay_id = current_setting('test.published_overlay')::uuid) then
    raise exception 'A viewer cannot read an overlay''s values';
  end if;
  perform pg_temp.expect_error(format('select public.set_control_overlay_parameters(%L, %L, 1, %L::jsonb, ''[]''::jsonb)',
    current_setting('test.tenant'), current_setting('test.published_overlay'),
    jsonb_build_array(jsonb_build_object('parameterId', current_setting('test.text_parameter'), 'values', jsonb_build_array('daily'), 'rationale', 'A viewer.'))), '42501');
end $$;
select set_config('request.jwt.claim.sub', 'a5620000-0000-0000-0000-000000000002', true);
do $$ begin
  if current_setting('test.published_overlay', true) is null or current_setting('test.published_overlay', true) = '' then return; end if;
  if exists (select 1 from public.control_overlay_parameters where overlay_id = current_setting('test.published_overlay')::uuid) then
    raise exception 'Someone outside the workspace reads its overlay''s values';
  end if;
  perform pg_temp.expect_error(format('select public.set_control_overlay_parameters(%L, %L, 1, %L::jsonb, ''[]''::jsonb)',
    current_setting('test.tenant'), current_setting('test.published_overlay'),
    jsonb_build_array(jsonb_build_object('parameterId', current_setting('test.text_parameter'), 'values', jsonb_build_array('daily'), 'rationale', 'An outsider.'))), '42501');
end $$;

rollback;
