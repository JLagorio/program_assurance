-- Run with psql -v ON_ERROR_STOP=1 after migrations and the pinned reference data
-- (npm run seed:reference). Every test row rolls back.
-- Publish assessment results (publish_assessment_results): what a publication writes and freezes,
-- what a request sent again answers, each refusal in the reader's words (results already
-- published, changed since they were read, holding no finding, not in the workspace), and who may
-- call it: an editor, admin or owner of the workspace, never a viewer, a member of another
-- workspace or an anonymous session. Its receipts stay private.
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
-- The same, and the refusal says the words the reader acts on.
create function pg_temp.expect_refusal(statement text, expected_state text, words text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_state and position(words in sqlerrm) > 0 then return; end if;
    raise exception 'Expected SQLSTATE % saying "%", got %: %', expected_state, words, sqlstate, sqlerrm;
  end;
  raise exception 'Statement unexpectedly succeeded: %', statement;
end;
$$;
grant execute on function pg_temp.expect_error(text, text) to authenticated, anon;
grant execute on function pg_temp.expect_refusal(text, text, text) to authenticated, anon;

-- ---------------------------------------------------------------------------------------------
-- Who may call what: a signed-in member calls the command; no client reads its receipts.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_command text := 'public.publish_assessment_results(uuid, uuid, bigint, integer, uuid)';
begin
  if has_function_privilege('anon', v_command, 'execute') or has_function_privilege('public', v_command, 'execute') then
    raise exception 'An anonymous session may execute %', v_command;
  end if;
  if not has_function_privilege('authenticated', v_command, 'execute') then
    raise exception 'A signed-in session may not execute %', v_command;
  end if;
  if has_table_privilege('authenticated', 'public.assessment_results_requests', 'select')
    or has_table_privilege('authenticated', 'public.assessment_results_requests', 'insert')
    or has_table_privilege('anon', 'public.assessment_results_requests', 'select') then
    raise exception 'A client may read or write the command''s receipts';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- The reference data the test reads: a published control baseline, a control it selects and a
-- part of that control an assessor can judge.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_resolution uuid; v_selection uuid; v_part uuid;
begin
  select r.id, sc.id, p.id into v_resolution, v_selection, v_part
  from public.profile_resolutions r
  join public.selected_controls sc on sc.profile_resolution_id = r.id
  join public.control_parts p on p.control_id = sc.control_id
  where r.tenant_id is null and r.state = 'published'
  order by r.id, sc.control_id, p.id
  limit 1;
  if v_part is null then
    raise exception 'The reference data is not loaded. Run npm run seed:reference first.';
  end if;
  perform set_config('test.resolution', v_resolution::text, true);
  perform set_config('test.selection', v_selection::text, true);
  perform set_config('test.part', v_part::text, true);
end $$;

-- ---------------------------------------------------------------------------------------------
-- A workspace: its owner, an editor with a party of their own and a viewer; and a member of
-- another workspace.
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email, raw_user_meta_data) values
  ('ae500000-0000-0000-0000-000000000001', 'results-publish-owner@example.test', '{"name":"Results publish owner"}'),
  ('ae500000-0000-0000-0000-000000000002', 'results-publish-editor@example.test', '{"name":"Results publish editor"}'),
  ('ae500000-0000-0000-0000-000000000003', 'results-publish-viewer@example.test', '{"name":"Results publish viewer"}'),
  ('ae500000-0000-0000-0000-000000000004', 'results-publish-outsider@example.test', '{"name":"Results publish outsider"}');
select set_config('request.jwt.claim.sub', 'ae500000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'ae500000-0000-0000-0000-000000000002', 'editor'),
  (current_setting('test.tenant')::uuid, 'ae500000-0000-0000-0000-000000000003', 'viewer');
insert into public.parties(id, tenant_id, party_type, name, auth_user_id) values
  ('ae510000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'person', 'Results publish editor', 'ae500000-0000-0000-0000-000000000002');

-- ---------------------------------------------------------------------------------------------
-- A program whose campaign's plan is published on a published SSP, with three results revisions
-- of that plan: a draft holding two findings, a draft holding none, and one already published.
-- ---------------------------------------------------------------------------------------------
insert into public.programs(id, tenant_id, code, name) values
  ('ae520000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'RESULTS-PUBLISH', 'Rollback results program');
insert into public.systems(id, tenant_id, program_id, code, name, system_type) values
  ('ae530000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'ae520000-0000-0000-0000-000000000001', 'SYS-RESULTS', 'Results system', 'information_system');
insert into public.ssp_revisions(id, tenant_id, system_id, profile_resolution_id, version_number) values
  ('ae540000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'ae530000-0000-0000-0000-000000000001', current_setting('test.resolution')::uuid, 1);
insert into public.implemented_requirements(tenant_id, ssp_revision_id, selected_control_id, description) values
  (current_setting('test.tenant')::uuid, 'ae540000-0000-0000-0000-000000000001', current_setting('test.selection')::uuid, 'The system runs signed builds only.');
update public.ssp_revisions set state = 'published', published_at = now(), revision = revision + 1
  where id = 'ae540000-0000-0000-0000-000000000001';
insert into public.assessment_campaigns(id, tenant_id, title, program_id) values
  ('ae550000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'Rollback results campaign', 'ae520000-0000-0000-0000-000000000001');
insert into public.assessment_plan_revisions(id, tenant_id, version_number, campaign_id, ssp_revision_id, title) values
  ('ae560000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 1, 'ae550000-0000-0000-0000-000000000001', 'ae540000-0000-0000-0000-000000000001', 'Rollback results plan');
update public.assessment_plan_revisions set state = 'published', published_at = now(), revision = revision + 1
  where id = 'ae560000-0000-0000-0000-000000000001';
insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title) values
  ('ae570000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 1, 'ae560000-0000-0000-0000-000000000001', 'Rollback published results'),
  ('ae570000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 2, 'ae560000-0000-0000-0000-000000000001', 'Rollback interim results'),
  ('ae570000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 3, 'ae560000-0000-0000-0000-000000000001', 'Rollback empty results');
insert into public.result_sets(id, tenant_id, assessment_results_revision_id, title) values
  ('ae580000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'ae570000-0000-0000-0000-000000000001', 'Rollback published set'),
  ('ae580000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'ae570000-0000-0000-0000-000000000002', 'Rollback interim set');
insert into public.assessment_findings(id, tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at) values
  ('ae590000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'ae570000-0000-0000-0000-000000000001', 'ae580000-0000-0000-0000-000000000001', current_setting('test.part')::uuid, 'Signed builds held last year', 'satisfied', now() - interval '1 year'),
  ('ae590000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'ae570000-0000-0000-0000-000000000002', 'ae580000-0000-0000-0000-000000000002', current_setting('test.part')::uuid, 'Signed builds hold', 'satisfied', now()),
  ('ae590000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'ae570000-0000-0000-0000-000000000002', 'ae580000-0000-0000-0000-000000000002', current_setting('test.part')::uuid, 'Unsigned builds are refused', 'partially_satisfied', now());
update public.assessment_results_revisions set state = 'published', published_at = now() - interval '1 day', revision = revision + 1
  where id = 'ae570000-0000-0000-0000-000000000001';
-- The interim results' title is edited once, so the revision a reader saw is the second.
update public.assessment_results_revisions set description = 'Increment 2 of the control set', revision = revision + 1
  where id = 'ae570000-0000-0000-0000-000000000002';

do $$ begin
  if (select array_agg(q.id order by q.id) from public.review_queue_rows q
      where q.tenant_id = current_setting('test.tenant')::uuid and q.kind = 'assessment_results')
    is distinct from array['ae570000-0000-0000-0000-000000000002']::uuid[] then
    raise exception 'The interim results are not the one row of results waiting in the queue';
  end if;
end $$;

-- =============================================================================================
-- What stops a publication, as the editor sends it, writing nothing.
-- =============================================================================================
select set_config('request.jwt.claim.sub', 'ae500000-0000-0000-0000-000000000002', true);
do $$
declare v_tenant text := current_setting('test.tenant');
begin
  -- Results holding no finding.
  perform pg_temp.expect_refusal(format($f$select public.publish_assessment_results(%L, 'ae570000-0000-0000-0000-000000000003', 1, 0, 'ae5a0000-0000-0000-0000-000000000001')$f$,
    v_tenant), '23514', 'Record a finding before publishing');
  -- Results changed since they were read: the reader saw the first revision.
  perform pg_temp.expect_refusal(format($f$select public.publish_assessment_results(%L, 'ae570000-0000-0000-0000-000000000002', 1, 2, 'ae5a0000-0000-0000-0000-000000000002')$f$,
    v_tenant), 'PT409', 'changed since you read them');
  -- Results that hold another number of findings than the reader was told: one more since.
  perform pg_temp.expect_refusal(format($f$select public.publish_assessment_results(%L, 'ae570000-0000-0000-0000-000000000002', 2, 1, 'ae5a0000-0000-0000-0000-000000000003')$f$,
    v_tenant), 'PT409', 'now hold 2 findings');
  -- Results already published.
  perform pg_temp.expect_refusal(format($f$select public.publish_assessment_results(%L, 'ae570000-0000-0000-0000-000000000001', 2, 1, 'ae5a0000-0000-0000-0000-000000000004')$f$,
    v_tenant), '23514', 'already published');
  -- Results the workspace does not hold.
  perform pg_temp.expect_refusal(format($f$select public.publish_assessment_results(%L, 'ae570000-0000-0000-0000-00000000dead', 1, 1, 'ae5a0000-0000-0000-0000-000000000005')$f$,
    v_tenant), 'PT404', 'no longer available');
  -- A request missing what it publishes.
  perform pg_temp.expect_error(format($f$select public.publish_assessment_results(%L, 'ae570000-0000-0000-0000-000000000002', null, 2, 'ae5a0000-0000-0000-0000-000000000006')$f$,
    v_tenant), '22023');
  perform pg_temp.expect_error(format($f$select public.publish_assessment_results(%L, 'ae570000-0000-0000-0000-000000000002', 2, 2, null)$f$,
    v_tenant), '22023');
  if (select state from public.assessment_results_revisions where id = 'ae570000-0000-0000-0000-000000000002') <> 'draft'
    or (select revision from public.assessment_results_revisions where id = 'ae570000-0000-0000-0000-000000000002') <> 2 then
    raise exception 'A refused publication changed the results';
  end if;
end $$;

-- =============================================================================================
-- The publication: the editor publishes the interim results at the revision they saw.
-- =============================================================================================
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_answer jsonb; v_again jsonb; v_results public.assessment_results_revisions;
begin
  v_answer := public.publish_assessment_results(v_tenant, 'ae570000-0000-0000-0000-000000000002', 2, 2,
    'ae5a0000-0000-0000-0000-000000000010');
  if v_answer->>'resultsRevisionId' <> 'ae570000-0000-0000-0000-000000000002'
    or v_answer->>'campaignId' <> 'ae550000-0000-0000-0000-000000000001'
    or v_answer->>'programId' <> 'ae520000-0000-0000-0000-000000000001'
    or (v_answer->>'versionNumber')::integer <> 2 or (v_answer->>'findings')::integer <> 2
    or (v_answer->>'publishedAt')::timestamptz <> now() then
    raise exception 'The publication did not answer with what it published: %', v_answer;
  end if;
  -- Published now, by the editor's party, at the next revision, its title and content as they were.
  select * into v_results from public.assessment_results_revisions where id = 'ae570000-0000-0000-0000-000000000002';
  if v_results.state <> 'published' or v_results.published_at <> now()
    or v_results.published_by_party_id is distinct from 'ae510000-0000-0000-0000-000000000002'
    or v_results.revision <> 3 or v_results.title <> 'Rollback interim results'
    or v_results.description <> 'Increment 2 of the control set'
    or v_results.updated_by <> 'ae500000-0000-0000-0000-000000000002' then
    raise exception 'The results were not published as the editor, now, at the next revision: %', to_jsonb(v_results);
  end if;
  if (select count(*) from public.assessment_findings where assessment_results_revision_id = v_results.id) <> 2 then
    raise exception 'The publication changed the findings it froze';
  end if;
  -- The other draft and the results published before are as they were.
  if (select state from public.assessment_results_revisions where id = 'ae570000-0000-0000-0000-000000000003') <> 'draft'
    or (select published_at from public.assessment_results_revisions where id = 'ae570000-0000-0000-0000-000000000001') <> now() - interval '1 day' then
    raise exception 'The publication changed other results';
  end if;

  -- The same request sent again answers as it first did and writes nothing.
  v_again := public.publish_assessment_results(v_tenant, 'ae570000-0000-0000-0000-000000000002', 2, 2,
    'ae5a0000-0000-0000-0000-000000000010');
  if v_again <> v_answer
    or (select revision from public.assessment_results_revisions where id = 'ae570000-0000-0000-0000-000000000002') <> 3 then
    raise exception 'The request sent again answered % and wrote again', v_again;
  end if;
  -- Sent again with what the reader would see now, it still answers as it first did.
  v_again := public.publish_assessment_results(v_tenant, 'ae570000-0000-0000-0000-000000000002', 3, 2,
    'ae5a0000-0000-0000-0000-000000000010');
  if v_again <> v_answer then
    raise exception 'The request sent again at the new revision answered %', v_again;
  end if;
  -- The same request id for other results is refused.
  perform pg_temp.expect_refusal(format($f$select public.publish_assessment_results(%L, 'ae570000-0000-0000-0000-000000000003', 1, 0, 'ae5a0000-0000-0000-0000-000000000010')$f$,
    v_tenant), 'PT409', 'already published other assessment results');
  -- Another request for the published results is refused: someone published them first.
  perform pg_temp.expect_refusal(format($f$select public.publish_assessment_results(%L, 'ae570000-0000-0000-0000-000000000002', 2, 2, 'ae5a0000-0000-0000-0000-000000000011')$f$,
    v_tenant), '23514', 'already published');
end $$;

-- The results and their findings are frozen, and they no longer wait in the queue.
do $$ begin
  perform pg_temp.expect_error($s$update public.assessment_results_revisions set title = 'Retitled', revision = revision + 1
    where id = 'ae570000-0000-0000-0000-000000000002'$s$, '23514');
  perform pg_temp.expect_error($s$update public.assessment_findings set determination = 'other_than_satisfied'
    where id = 'ae590000-0000-0000-0000-000000000003'$s$, '23514');
  perform pg_temp.expect_error($s$delete from public.assessment_findings where id = 'ae590000-0000-0000-0000-000000000002'$s$, '23514');
  perform pg_temp.expect_error(format($s$insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination)
    values (%L, 'ae570000-0000-0000-0000-000000000002', 'ae580000-0000-0000-0000-000000000002', %L, 'A finding after the publication', 'satisfied')$s$,
    current_setting('test.tenant'), current_setting('test.part')), '23514');
  if exists (select 1 from public.review_queue_rows q
      where q.tenant_id = current_setting('test.tenant')::uuid and q.kind = 'assessment_results') then
    raise exception 'Published results still wait in the queue';
  end if;
end $$;

-- =============================================================================================
-- Who may publish: a viewer of the workspace does not, nor does a member of another workspace in
-- this one's name or in its own, nor a session with no account. A third draft holding a finding
-- is the results each tries.
-- =============================================================================================
select set_config('request.jwt.claim.sub', 'ae500000-0000-0000-0000-000000000001', true);
insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title) values
  ('ae570000-0000-0000-0000-000000000004', current_setting('test.tenant')::uuid, 4, 'ae560000-0000-0000-0000-000000000001', 'Rollback final results');
insert into public.result_sets(id, tenant_id, assessment_results_revision_id, title) values
  ('ae580000-0000-0000-0000-000000000004', current_setting('test.tenant')::uuid, 'ae570000-0000-0000-0000-000000000004', 'Rollback final set');
insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at) values
  (current_setting('test.tenant')::uuid, 'ae570000-0000-0000-0000-000000000004', 'ae580000-0000-0000-0000-000000000004', current_setting('test.part')::uuid, 'Signed builds still hold', 'satisfied', now());

select set_config('request.jwt.claim.sub', 'ae500000-0000-0000-0000-000000000003', true);
do $$ begin
  perform pg_temp.expect_refusal(format($f$select public.publish_assessment_results(%L, 'ae570000-0000-0000-0000-000000000004', 1, 1, 'ae5a0000-0000-0000-0000-000000000020')$f$,
    current_setting('test.tenant')), '42501', 'An editor, admin, or owner can publish assessment results');
end $$;
select set_config('request.jwt.claim.sub', 'ae500000-0000-0000-0000-000000000004', true);
select public.ensure_personal_tenant() is not null as outsider_has_a_workspace;
do $$
declare v_own uuid := public.ensure_personal_tenant();
begin
  -- In this workspace's name.
  perform pg_temp.expect_error(format($f$select public.publish_assessment_results(%L, 'ae570000-0000-0000-0000-000000000004', 1, 1, 'ae5a0000-0000-0000-0000-000000000021')$f$,
    current_setting('test.tenant')), '42501');
  -- In its own workspace's name, the results are another workspace's.
  perform pg_temp.expect_refusal(format($f$select public.publish_assessment_results(%L, 'ae570000-0000-0000-0000-000000000004', 1, 1, 'ae5a0000-0000-0000-0000-000000000022')$f$,
    v_own), 'PT404', 'no longer available');
end $$;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  perform pg_temp.expect_error(format($f$select public.publish_assessment_results(%L, 'ae570000-0000-0000-0000-000000000004', 1, 1, 'ae5a0000-0000-0000-0000-000000000023')$f$,
    current_setting('test.tenant')), '42501');
end $$;
reset role;
set local role anon;
select pg_temp.expect_error(format($f$select public.publish_assessment_results(%L, 'ae570000-0000-0000-0000-000000000004', 1, 1, 'ae5a0000-0000-0000-0000-000000000024')$f$,
  current_setting('test.tenant')), '42501');
reset role;

-- None of them published it, and the one receipt is the editor's publication.
do $$ begin
  if (select state from public.assessment_results_revisions where id = 'ae570000-0000-0000-0000-000000000004') <> 'draft' then
    raise exception 'A caller who may not publish published the final results';
  end if;
  if (select array_agg(r.id) from public.assessment_results_requests r where r.tenant_id = current_setting('test.tenant')::uuid)
    is distinct from array['ae5a0000-0000-0000-0000-000000000010']::uuid[] then
    raise exception 'Expected one receipt, the editor''s publication; found %',
      (select array_agg(r.id) from public.assessment_results_requests r where r.tenant_id = current_setting('test.tenant')::uuid);
  end if;
end $$;

rollback;
select 'Publish assessment results: what it writes and freezes, a request sent again, each refusal and who may call it passed.' as result;
