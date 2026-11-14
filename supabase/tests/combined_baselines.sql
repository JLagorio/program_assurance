-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Two reference baselines in one stack: who may write the layer that combines them, and, with the
-- pinned references installed (a catalog edition and its reference baselines), what a program set
-- up through create_program_wizard with a second baseline holds (the union as the layer right above
-- the first baseline, recorded as a combination, each control it adds with the second's name as its
-- rationale, then an overlay and the tailoring), what every read that walks the stack answers of it
-- (profile_resolution_catalogs, program_control_status, program_resiliency_choice,
-- program_control_parameters), that set_program_baseline_overlays keeps the combined root, and what
-- stops a combination (the same baseline twice, a second that adds nothing, a second that is no
-- reference baseline, the same combination chosen twice untailored).
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
-- A program set up through the wizard with the program profiles given (each a jsonb object with
-- its base, its second baseline, its overlays, its tailoring and its parameters); its id.
create function pg_temp.program(p_code text, p_catalog uuid, p_profiles jsonb) returns uuid language plpgsql as $$
declare v_created jsonb; v_profiles jsonb := '[]'::jsonb; v_profile jsonb; v_key uuid; v_first uuid;
begin
  for v_profile in select value from jsonb_array_elements(p_profiles) loop
    v_key := gen_random_uuid();
    v_first := coalesce(v_first, v_key);
    v_profiles := v_profiles || jsonb_build_array(jsonb_build_object('key', v_key, 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb,
      'overlayIds', '[]'::jsonb) || v_profile);
  end loop;
  v_created := public.create_program_wizard(current_setting('test.tenant')::uuid, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', p_code, 'name', p_code || ' combined baselines test', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb, 'catalogRevisionId', p_catalog,
    'profiles', v_profiles,
    'systems', jsonb_build_array(jsonb_build_object(
      'key', gen_random_uuid(), 'code', p_code || '-SYS', 'name', p_code || ' system', 'description', '',
      'type', 'information_system', 'ownerPartyId', null, 'confidentiality', 'low', 'integrity', 'low', 'availability', 'low',
      'categorizationRationale', 'A limited impact boundary for a rollback test.', 'profileKey', v_first, 'elements', '[]'::jsonb))));
  return (v_created->>'programId')::uuid;
end;
$$;
-- A program profile's stack bottom up: root, the second baseline, each overlay by its code, tailoring.
create function pg_temp.stack(p_choice uuid) returns text[] language plpgsql stable as $$
declare v_cursor uuid; v_base uuid; v_code text; v_out text[] := '{}'; v_combined boolean;
begin
  select c.profile_resolution_id into v_cursor from public.program_reference_choices c where c.id = p_choice;
  while v_cursor is not null loop
    select o.code into v_code from public.profile_overlay_applications a join public.control_overlays o on o.id = a.overlay_id
      where a.profile_resolution_id = v_cursor;
    select exists (select 1 from public.profile_baseline_combinations b where b.profile_resolution_id = v_cursor) into v_combined;
    select r.base_profile_resolution_id into v_base from public.profile_resolutions r where r.id = v_cursor;
    v_out := array_prepend(coalesce(v_code, case when v_base is null then 'root' when v_combined then 'baseline' else 'tailoring' end), v_out);
    v_code := null;
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
grant execute on function pg_temp.expect_error(text, text), pg_temp.program(text, uuid, jsonb), pg_temp.stack(uuid), pg_temp.layer(uuid, integer)
  to authenticated, anon;

-- ---------------------------------------------------------------------------------------------
-- Who may write a combination: only the wizard and the commands, through the internal function.
-- ---------------------------------------------------------------------------------------------
do $$ begin
  if has_function_privilege('authenticated', 'public.combine_reference_baselines(uuid, uuid, uuid, uuid, text, text)', 'execute')
    or has_function_privilege('anon', 'public.combine_reference_baselines(uuid, uuid, uuid, uuid, text, text)', 'execute') then
    raise exception 'A session may call the internal combination directly';
  end if;
  if has_table_privilege('authenticated', 'public.profile_baseline_combinations', 'insert')
    or has_table_privilege('authenticated', 'public.profile_baseline_combinations', 'update')
    or has_table_privilege('authenticated', 'public.profile_baseline_combinations', 'delete') then
    raise exception 'A member may write a combination directly';
  end if;
  if not has_table_privilege('authenticated', 'public.profile_baseline_combinations', 'select') then
    raise exception 'A member may not read a combination';
  end if;
end $$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('a5640000-0000-0000-0000-000000000001', 'combined-baselines-editor@example.test', '{"name":"Combined baselines test editor"}'),
  ('a5640000-0000-0000-0000-000000000002', 'combined-baselines-outsider@example.test', '{}');
select set_config('request.jwt.claim.sub', 'a5640000-0000-0000-0000-000000000002', true);
set local role authenticated;
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
select set_config('request.jwt.claim.sub', 'a5640000-0000-0000-0000-000000000001', true);
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);

do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_first uuid; v_second uuid; v_subset uuid; v_first_ids uuid[]; v_second_ids uuid[];
  v_union integer; v_added integer; v_second_title text; v_only uuid; v_kept uuid; v_overlay uuid; v_overlay_row public.control_overlays;
  v_program uuid; v_choice uuid; v_revision bigint; v_layer uuid; v_top uuid; v_answer jsonb; v_read jsonb; v_parameter public.parameters;
  v_sa24 uuid; v_sa24_parameter uuid; v_techniques text[]; v_codes text[]; v_tailored uuid; v_layered uuid;
begin
  -- The newest published catalog edition and its reference baselines: the largest as the first,
  -- and as the second the smallest that adds a control the largest does not select.
  select k.id into v_catalog from public.catalog_revisions k where k.state = 'published' and k.tenant_id is null order by k.created_at desc limit 1;
  select r.id into v_first from public.profile_resolutions r
    join public.profile_imports i on i.profile_revision_id = r.profile_revision_id and i.catalog_revision_id = v_catalog
    where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
    order by (select count(*) from public.selected_controls s where s.profile_resolution_id = r.id) desc, r.id limit 1;
  select array_agg(s.control_id) into v_first_ids from public.selected_controls s where s.profile_resolution_id = v_first;
  select r.id into v_second from public.profile_resolutions r
    join public.profile_imports i on i.profile_revision_id = r.profile_revision_id and i.catalog_revision_id = v_catalog
    where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null and r.id <> v_first
      and exists (select 1 from public.selected_controls s where s.profile_resolution_id = r.id and not s.control_id = any(v_first_ids))
    order by (select count(*) from public.selected_controls s where s.profile_resolution_id = r.id), r.id limit 1;
  -- A reference baseline the first already holds whole.
  select r.id into v_subset from public.profile_resolutions r
    join public.profile_imports i on i.profile_revision_id = r.profile_revision_id and i.catalog_revision_id = v_catalog
    where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null and r.id <> v_first
      and not exists (select 1 from public.selected_controls s where s.profile_resolution_id = r.id and not s.control_id = any(v_first_ids))
    limit 1;
  if v_second is null then
    raise notice 'The pinned references hold no two baselines to combine: the checks of a combined stack were skipped';
    return;
  end if;
  select array_agg(s.control_id) into v_second_ids from public.selected_controls s where s.profile_resolution_id = v_second;
  select count(*) into v_union from (select unnest(v_first_ids) union select unnest(v_second_ids)) u;
  v_added := v_union - cardinality(v_first_ids);
  select coalesce(f.title, v.title) into v_second_title from public.profile_resolutions r join public.profile_revisions v on v.id = r.profile_revision_id
    left join public.profiles f on f.id = v.profile_id where r.id = v_second;
  -- A control only the second selects, and a text parameter of a control the first keeps.
  select c into v_only from unnest(v_second_ids) c where not c = any(v_first_ids) limit 1;
  select p.* into v_parameter from public.parameters p where p.catalog_revision_id = v_catalog and p.control_id = v_only and not p.has_selection limit 1;
  select p.control_id into v_kept from public.parameters p where p.catalog_revision_id = v_catalog and p.control_id = any(v_first_ids)
    and not p.has_selection order by p.source_id limit 1;

  -- An overlay that removes the control only the second selects, published.
  v_overlay := gen_random_uuid();
  v_overlay_row := public.save_control_overlay(v_tenant, v_overlay, null, jsonb_build_object('code', 'CB-OVL', 'title', 'Combined test overlay',
    'description', '', 'catalogRevisionId', v_catalog));
  v_overlay_row := public.set_control_overlay_decisions(v_tenant, v_overlay, v_overlay_row.revision,
    jsonb_build_array(jsonb_build_object('controlId', v_kept, 'action', 'exclude', 'rationale', 'The overlay removes it.')), '[]'::jsonb);
  v_overlay_row := public.publish_control_overlay(v_tenant, v_overlay, v_overlay_row.revision);

  -- The program: the first combined with the second, the overlay, and a tailoring that sets a value.
  v_program := pg_temp.program('CB-PROG', v_catalog, jsonb_build_array(jsonb_build_object('baseResolutionId', v_first,
    'combinedResolutionId', v_second, 'overlayIds', jsonb_build_array(v_overlay),
    'parameters', case when v_parameter.id is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object('parameterId', v_parameter.id,
      'values', jsonb_build_array('as the second baseline asks'), 'rationale', 'The program sets it.')) end)));
  select c.id, c.revision, c.profile_resolution_id into v_choice, v_revision, v_top from public.program_reference_choices c where c.program_id = v_program;
  if pg_temp.stack(v_choice) is distinct from (case when v_parameter.id is null then array['root', 'baseline', 'CB-OVL'] else array['root', 'baseline', 'CB-OVL', 'tailoring'] end) then
    raise exception 'The combined stack is not the first, the second, the overlay and the tailoring: %', pg_temp.stack(v_choice);
  end if;
  -- The second baseline's layer: the union, recorded as a combination, each added control the second's.
  v_layer := pg_temp.layer(v_choice, 1);
  if (select b.combined_resolution_id from public.profile_baseline_combinations b where b.profile_resolution_id = v_layer) <> v_second then
    raise exception 'The layer above the first baseline is not recorded as the second';
  end if;
  if (select count(*) from public.selected_controls s where s.profile_resolution_id = v_layer) <> v_union then
    raise exception 'The combined layer does not select the union: % of %', (select count(*) from public.selected_controls s where s.profile_resolution_id = v_layer), v_union;
  end if;
  if (select count(*) from public.selection_provenance p join public.selected_controls s on s.id = p.selected_control_id
      where s.profile_resolution_id = v_layer and p.rationale = 'Selected by ' || v_second_title || '.') <> v_added then
    raise exception 'The controls the second adds do not name it as their reason';
  end if;
  -- The catalog view follows the chain through the combination.
  if (select c.catalog_revision_id from public.profile_resolution_catalogs c where c.profile_resolution_id = v_top) <> v_catalog
    or (select c.root_profile_resolution_id from public.profile_resolution_catalogs c where c.profile_resolution_id = v_top) <> v_first then
    raise exception 'profile_resolution_catalogs does not reach the catalog through a combined stack';
  end if;
  -- program_control_status counts the union, less what the overlay removes, every control once.
  v_read := public.program_control_status(v_program);
  if (v_read->'totals'->>'controls')::integer <> (select count(*) from public.selected_controls s where s.profile_resolution_id = v_top)
    or (v_read->'totals'->>'controls')::integer <> v_union - 1
    or (v_read->'totals'->>'no_requirement')::integer <> v_union - 1 then
    raise exception 'program_control_status does not count the combined baseline: %', v_read->'totals';
  end if;
  -- program_control_parameters reads the tailoring's value of a control only the second brings.
  if v_parameter.id is not null then
    v_read := public.program_control_parameters(v_program, v_only);
    if not (v_read->>'selected')::boolean or not exists (select 1 from jsonb_array_elements(v_read->'stacks'->0->'parameters') e
        where (e->>'parameter_id')::uuid = v_parameter.id and e->'values' = '["as the second baseline asks"]'::jsonb and e->'source'->>'kind' = 'tailoring') then
      raise exception 'program_control_parameters does not read a combined stack: %', v_read;
    end if;
  end if;

  -- Changing the overlays keeps the combined root: without the overlay, the tailoring sits on it.
  v_answer := public.set_program_baseline_overlays(v_tenant, v_choice, v_revision, gen_random_uuid(), '[]'::jsonb);
  if pg_temp.stack(v_choice) is distinct from (case when v_parameter.id is null then array['root', 'baseline'] else array['root', 'baseline', 'tailoring'] end)
    or pg_temp.layer(v_choice, 1) <> v_layer then
    raise exception 'A change of the overlays did not keep the combined root: %, %', pg_temp.stack(v_choice), v_answer;
  end if;
  if (v_answer->'controls'->>'after')::integer <> v_union then raise exception 'The stack without the overlay is not the union: %', v_answer; end if;
  select c.revision into v_revision from public.program_reference_choices c where c.id = v_choice;
  v_answer := public.set_program_baseline_overlays(v_tenant, v_choice, v_revision, gen_random_uuid(), jsonb_build_array(v_overlay));
  if pg_temp.layer(v_choice, 1) <> v_layer or (pg_temp.stack(v_choice))[3] <> 'CB-OVL' then
    raise exception 'The overlay was not applied again on the combined root: %', pg_temp.stack(v_choice);
  end if;

  -- program_resiliency_choice reads SA-24 tailored into a combined stack.
  select c.id into v_sa24 from public.controls c where c.catalog_revision_id = v_catalog and c.source_id = 'sa-24';
  select p.id into v_sa24_parameter from public.parameters p where p.control_id = v_sa24 and p.source_id = 'sa-24_odp.03';
  select array_agg(i.title order by i.ordinal), array_agg(i.code order by i.ordinal) into v_techniques, v_codes from (
    select i.title, i.code, i.ordinal from public.framework_items i
    join public.framework_revisions r on r.id = i.framework_revision_id
    join public.frameworks f on f.id = r.framework_id and f.code = 'nist-sp800-160v2r1-cref'
    where i.kind = 'technique' order by r.created_at desc, i.ordinal limit 2) i;
  if v_sa24_parameter is not null and cardinality(v_techniques) = 2 and not v_sa24 = any(v_first_ids) and not v_sa24 = any(v_second_ids) then
    v_program := pg_temp.program('CB-SA24', v_catalog, jsonb_build_array(jsonb_build_object('baseResolutionId', v_first, 'combinedResolutionId', v_second,
      'tailoring', jsonb_build_array(jsonb_build_object('controlId', v_sa24, 'action', 'include', 'rationale', 'Design for cyber resiliency.')),
      'parameters', jsonb_build_array(jsonb_build_object('parameterId', v_sa24_parameter, 'values', to_jsonb(v_techniques), 'rationale', 'The techniques.')))));
    v_read := public.program_resiliency_choice(v_program);
    if not (v_read->>'selected')::boolean or v_read->'techniques' is distinct from to_jsonb(v_codes) then
      raise exception 'program_resiliency_choice does not read a combined stack: %', v_read;
    end if;
  else
    raise notice 'The cyber resiliency framework is not installed: the check of a combined stack''s resiliency choice was skipped';
  end if;

  -- What stops a combination: the same baseline twice, a second the first holds whole, a second
  -- that is no reference baseline, and the same combination chosen twice untailored.
  perform pg_temp.expect_error(format('select pg_temp.program(%L, %L, %L::jsonb)', 'CB-SAME', v_catalog,
    jsonb_build_array(jsonb_build_object('baseResolutionId', v_first, 'combinedResolutionId', v_first))), '23514');
  if v_subset is not null then
    perform pg_temp.expect_error(format('select pg_temp.program(%L, %L, %L::jsonb)', 'CB-SUBSET', v_catalog,
      jsonb_build_array(jsonb_build_object('baseResolutionId', v_first, 'combinedResolutionId', v_subset))), '23514');
  end if;
  perform pg_temp.expect_error(format('select pg_temp.program(%L, %L, %L::jsonb)', 'CB-LAYER', v_catalog,
    jsonb_build_array(jsonb_build_object('baseResolutionId', v_first, 'combinedResolutionId', v_layer))), '23514');
  perform pg_temp.expect_error(format('select pg_temp.program(%L, %L, %L::jsonb)', 'CB-TWICE', v_catalog,
    jsonb_build_array(jsonb_build_object('baseResolutionId', v_first, 'combinedResolutionId', v_second),
      jsonb_build_object('baseResolutionId', v_first, 'combinedResolutionId', v_second))), '23514');
  -- The first alone and the first with the second are two program profiles of one program.
  v_program := pg_temp.program('CB-BOTH', v_catalog, jsonb_build_array(jsonb_build_object('baseResolutionId', v_first),
    jsonb_build_object('baseResolutionId', v_first, 'combinedResolutionId', v_second)));
  if (select count(*) from public.program_reference_choices c where c.program_id = v_program) <> 2 then
    raise exception 'The first alone and combined were not two program profiles';
  end if;
  perform set_config('test.combined_layer', v_layer::text, true);
end $$;

-- Someone outside the workspace reads none of its combinations.
select set_config('request.jwt.claim.sub', 'a5640000-0000-0000-0000-000000000002', true);
do $$ begin
  if coalesce(current_setting('test.combined_layer', true), '') = '' then return; end if;
  if exists (select 1 from public.profile_baseline_combinations b where b.profile_resolution_id = current_setting('test.combined_layer')::uuid) then
    raise exception 'Someone outside the workspace reads its combination';
  end if;
end $$;

rollback;
