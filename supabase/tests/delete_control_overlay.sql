-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Deleting a draft overlay: who may ask, what it deletes, a request sent again, a stale revision,
-- and what stops it: a published overlay, one a program's control baseline applies (with the
-- pinned references installed), a viewer, someone outside the workspace and a session with no
-- account.
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

do $$ begin
  if has_function_privilege('anon', 'public.delete_control_overlay(uuid, uuid, bigint)', 'execute')
    or has_function_privilege('public', 'public.delete_control_overlay(uuid, uuid, bigint)', 'execute') then
    raise exception 'An anonymous session may execute delete_control_overlay';
  end if;
  if not has_function_privilege('authenticated', 'public.delete_control_overlay(uuid, uuid, bigint)', 'execute') then
    raise exception 'A signed-in session may not execute delete_control_overlay';
  end if;
  -- It runs as the other overlay commands do: a member deletes no overlay row directly.
  if not (select p.prosecdef from pg_catalog.pg_proc p where p.oid = 'public.delete_control_overlay(uuid, uuid, bigint)'::regprocedure)
    or has_table_privilege('authenticated', 'public.control_overlays', 'delete')
    or has_table_privilege('authenticated', 'public.control_overlay_decisions', 'delete') then
    raise exception 'An overlay can be deleted around the command';
  end if;
end $$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('a5610000-0000-0000-0000-000000000001', 'delete-overlay-editor@example.test', '{"name":"Delete overlay test editor"}'),
  ('a5610000-0000-0000-0000-000000000002', 'delete-overlay-outsider@example.test', '{}'),
  ('a5610000-0000-0000-0000-000000000003', 'delete-overlay-viewer@example.test', '{}');
select set_config('request.jwt.claim.sub', 'a5610000-0000-0000-0000-000000000002', true);
set local role authenticated;
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
select set_config('request.jwt.claim.sub', 'a5610000-0000-0000-0000-000000000001', true);
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);

-- Three drafts and a published overlay, each deciding on one control of a published edition.
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_control uuid; v_overlay public.control_overlays; v_code text; v_id uuid;
begin
  select k.id into v_catalog from public.catalog_revisions k where k.state = 'published' and k.tenant_id is null order by k.created_at desc limit 1;
  if v_catalog is null then
    raise notice 'No catalog edition is installed: the checks of an overlay with decisions were skipped';
    return;
  end if;
  select c.id into v_control from public.controls c where c.catalog_revision_id = v_catalog and c.status = 'active' order by c.source_id limit 1;
  foreach v_code in array array['DEL-DRAFT', 'DEL-STALE', 'DEL-KEPT', 'DEL-PUBLISHED'] loop
    v_id := gen_random_uuid();
    v_overlay := public.save_control_overlay(v_tenant, v_id, null, jsonb_build_object('code', v_code, 'title', v_code || ' overlay',
      'description', '', 'catalogRevisionId', v_catalog));
    v_overlay := public.set_control_overlay_decisions(v_tenant, v_id, v_overlay.revision,
      jsonb_build_array(jsonb_build_object('controlId', v_control, 'action', 'include', 'rationale', 'A test decision.')), '[]'::jsonb);
    if v_code = 'DEL-PUBLISHED' then v_overlay := public.publish_control_overlay(v_tenant, v_id, v_overlay.revision); end if;
    perform set_config('test.' || lower(replace(v_code, '-', '_')), v_id::text, true);
  end loop;
end $$;

do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_draft uuid := nullif(current_setting('test.del_draft', true), '')::uuid;
  v_stale uuid := nullif(current_setting('test.del_stale', true), '')::uuid;
  v_published uuid := nullif(current_setting('test.del_published', true), '')::uuid;
  v_revision bigint;
begin
  if v_draft is null then return; end if;
  -- A draft at the revision the reader saw is deleted, with its decisions.
  select o.revision into v_revision from public.control_overlays o where o.id = v_draft;
  if public.delete_control_overlay(v_tenant, v_draft, v_revision) is not true then
    raise exception 'A draft overlay was not deleted';
  end if;
  if exists (select 1 from public.control_overlays where id = v_draft)
    or exists (select 1 from public.control_overlay_decisions where overlay_id = v_draft) then
    raise exception 'A deleted overlay left a row behind';
  end if;
  -- Sent again, it finds nothing to delete and fails nothing.
  if public.delete_control_overlay(v_tenant, v_draft, v_revision) is not false then
    raise exception 'A deletion sent again did not answer false';
  end if;

  -- A draft that changed since the reader saw it is kept.
  select o.revision into v_revision from public.control_overlays o where o.id = v_stale;
  perform pg_temp.expect_error(format('select public.delete_control_overlay(%L, %L, %s)', v_tenant, v_stale, v_revision - 1), 'PT409');
  if not exists (select 1 from public.control_overlays where id = v_stale) then
    raise exception 'A stale deletion deleted the overlay';
  end if;

  -- A published overlay is refused, and keeps its decisions.
  select o.revision into v_revision from public.control_overlays o where o.id = v_published;
  perform pg_temp.expect_error(format('select public.delete_control_overlay(%L, %L, %s)', v_tenant, v_published, v_revision), '23514');
  if not exists (select 1 from public.control_overlay_decisions where overlay_id = v_published) then
    raise exception 'A refused deletion removed a published overlay''s decision';
  end if;
end $$;

-- With the pinned references installed: an overlay a program's control baseline applies is
-- refused, whatever its state says.
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_catalog uuid; v_base uuid; v_control uuid; v_overlay public.control_overlays; v_id uuid := gen_random_uuid();
begin
  select r.id, i.catalog_revision_id into v_base, v_catalog
  from public.profile_resolutions r
  join public.profile_imports i on i.profile_revision_id = r.profile_revision_id and i.catalog_revision_id is not null
  join public.catalog_revisions k on k.id = i.catalog_revision_id and k.state = 'published' and k.tenant_id is null
  where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
  order by k.created_at desc, r.id limit 1;
  if v_base is null then
    raise notice 'The pinned references are not installed: the check of an applied overlay was skipped';
    return;
  end if;
  select c.id into v_control from public.controls c where c.catalog_revision_id = v_catalog and c.status = 'active'
    and not exists (select 1 from public.selected_controls s where s.profile_resolution_id = v_base and s.control_id = c.id)
  order by c.source_id limit 1;
  v_overlay := public.save_control_overlay(v_tenant, v_id, null, jsonb_build_object('code', 'DEL-APPLIED', 'title', 'Applied overlay',
    'description', '', 'catalogRevisionId', v_catalog));
  v_overlay := public.set_control_overlay_decisions(v_tenant, v_id, v_overlay.revision,
    jsonb_build_array(jsonb_build_object('controlId', v_control, 'action', 'include', 'rationale', 'The program needs it.')), '[]'::jsonb);
  v_overlay := public.publish_control_overlay(v_tenant, v_id, v_overlay.revision);
  perform public.create_program_wizard(v_tenant, jsonb_build_object(
    'requestId', gen_random_uuid(), 'code', 'DEL-PROG', 'name', 'Delete overlay test program', 'description', '',
    'sponsorPartyId', null, 'startsOn', null, 'endsOn', null, 'roles', '[]'::jsonb, 'catalogRevisionId', v_catalog,
    'profiles', jsonb_build_array(jsonb_build_object('key', '00000000-0000-4000-8000-000000000001', 'baseResolutionId', v_base,
      'overlayIds', jsonb_build_array(v_id), 'tailoring', '[]'::jsonb, 'parameters', '[]'::jsonb)),
    'systems', jsonb_build_array(jsonb_build_object('key', gen_random_uuid(), 'code', 'DEL-PROG-SYS', 'name', 'Delete overlay test system',
      'description', '', 'type', 'information_system', 'ownerPartyId', null, 'confidentiality', 'low', 'integrity', 'low',
      'availability', 'low', 'categorizationRationale', 'A rollback test.', 'profileKey', '00000000-0000-4000-8000-000000000001',
      'elements', '[]'::jsonb))));
  if not exists (select 1 from public.profile_overlay_applications a where a.overlay_id = v_id) then
    raise exception 'The program did not apply the overlay';
  end if;
  perform pg_temp.expect_error(format('select public.delete_control_overlay(%L, %L, %s)', v_tenant, v_id, v_overlay.revision), '23514');
  if not exists (select 1 from public.control_overlays where id = v_id) then
    raise exception 'An applied overlay was deleted';
  end if;
end $$;

-- A session with no account, a viewer and someone outside the workspace delete nothing.
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$select public.delete_control_overlay(current_setting('test.tenant')::uuid,
  nullif(current_setting('test.del_kept', true), '')::uuid, 2)$$, '42501');
reset role;
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'a5610000-0000-0000-0000-000000000003', 'viewer');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5610000-0000-0000-0000-000000000003', true);
select pg_temp.expect_error($$select public.delete_control_overlay(current_setting('test.tenant')::uuid,
  nullif(current_setting('test.del_kept', true), '')::uuid, 2)$$, '42501');
select set_config('request.jwt.claim.sub', 'a5610000-0000-0000-0000-000000000002', true);
-- In the workspace's name the outsider may not write; in their own, the overlay is not there.
select pg_temp.expect_error($$select public.delete_control_overlay(current_setting('test.tenant')::uuid,
  nullif(current_setting('test.del_kept', true), '')::uuid, 2)$$, '42501');
do $$ begin
  if nullif(current_setting('test.del_kept', true), '') is null then return; end if;
  perform pg_temp.expect_error(format('select public.delete_control_overlay(%L, %L, 2)',
    current_setting('test.other_tenant'), current_setting('test.del_kept')), '23514');
end $$;
reset role;
do $$ begin
  if nullif(current_setting('test.del_kept', true), '') is null then return; end if;
  if not exists (select 1 from public.control_overlays where id = current_setting('test.del_kept')::uuid) then
    raise exception 'Someone who may not write deleted the overlay';
  end if;
end $$;

rollback;
