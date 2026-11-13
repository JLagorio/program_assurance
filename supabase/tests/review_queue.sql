-- Run with psql -v ON_ERROR_STOP=1 after migrations and the pinned reference data
-- (npm run seed:reference). Every test row rolls back.
-- The Review queue (review_queue_rows): each kind of record joins the queue when the schema says it
-- waits on a reviewer, and leaves it once the reviewer acts; a draft its author is still writing
-- never joins. One workspace's queue is its own, a viewer reads it as a member does, and an
-- anonymous session reads none of it.
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
-- What the queue holds of the test workspace of one kind, as the session reads it.
create function pg_temp.queued(p_kind text) returns setof public.review_queue_rows language sql stable as $$
  select * from public.review_queue_rows q
  where q.tenant_id = current_setting('test.tenant')::uuid and q.kind = p_kind
  order by q.id
$$;
grant execute on function pg_temp.queued(text) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- The reference data the test reads: a published control baseline, a control it selects and a
-- part of that control an assessor can judge.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_resolution uuid; v_selection uuid; v_control uuid; v_part uuid;
begin
  select r.id, sc.id, sc.control_id, p.id into v_resolution, v_selection, v_control, v_part
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
  perform set_config('test.control', v_control::text, true);
  perform set_config('test.part', v_part::text, true);
end $$;

-- ---------------------------------------------------------------------------------------------
-- A workspace: its owner, an editor and a viewer; and a member of another workspace.
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email, raw_user_meta_data) values
  ('c9a00000-0000-0000-0000-000000000001', 'review-queue-owner@example.test', '{"name":"Review queue test owner"}'),
  ('c9a00000-0000-0000-0000-000000000002', 'review-queue-editor@example.test', '{"name":"Review queue test editor"}'),
  ('c9a00000-0000-0000-0000-000000000003', 'review-queue-viewer@example.test', '{"name":"Review queue test viewer"}'),
  ('c9a00000-0000-0000-0000-000000000004', 'review-queue-outsider@example.test', '{"name":"Review queue test outsider"}');
select set_config('request.jwt.claim.sub', 'c9a00000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'c9a00000-0000-0000-0000-000000000002', 'editor'),
  (current_setting('test.tenant')::uuid, 'c9a00000-0000-0000-0000-000000000003', 'viewer');

-- ---------------------------------------------------------------------------------------------
-- The people (a reviewer with no account, and the editor, who asks for reviews), and the program:
-- a system, a requirement a discussion is started on, and an evidence report the reviewer owns.
-- ---------------------------------------------------------------------------------------------
insert into public.parties(id, tenant_id, party_type, name, auth_user_id) values
  ('c9a10000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'person', 'Rollback reviewer', null),
  ('c9a10000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'person', 'Review queue test editor', 'c9a00000-0000-0000-0000-000000000002');
insert into public.programs(id, tenant_id, code, name) values
  ('c9a20000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'REVIEW-QUEUE', 'Rollback review queue program');
insert into public.systems(id, tenant_id, program_id, code, name, system_type) values
  ('c9a30000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c9a20000-0000-0000-0000-000000000001', 'SYS-QUEUE', 'Queue system', 'information_system');
insert into public.engineering_requirements(id, tenant_id, program_id, code) values
  ('c9a40000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c9a20000-0000-0000-0000-000000000001', 'REQ-QUEUE');
insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type) values
  ('c9a41000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c9a40000-0000-0000-0000-000000000001', 1, 'Signed builds', 'The system runs signed builds only.', 'An unsigned build is refused.', 'security');
insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind, program_id, owner_party_id) values
  ('c9a50000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'Rollback signature test report', 'document', 'c9a20000-0000-0000-0000-000000000001', 'c9a10000-0000-0000-0000-000000000001');

do $$ begin
  if exists (select 1 from public.review_queue_rows where tenant_id = current_setting('test.tenant')::uuid) then
    raise exception 'A workspace with nothing waiting has a queue';
  end if;
end $$;

-- =============================================================================================
-- Each kind joins the queue when the schema says it waits on a reviewer, and not before.
-- =============================================================================================
select set_config('request.jwt.claim.sub', 'c9a00000-0000-0000-0000-000000000002', true);

-- Evidence to accept: a published version nobody has asked to review waits on nobody. Once the
-- editor asks the reviewer, the version waits on them, since the review was asked for.
insert into public.evidence_versions(id, tenant_id, artifact_id, version_number, state, external_uri) values
  ('c9a51000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c9a50000-0000-0000-0000-000000000001', 1, 'published', 'https://example.test/evidence/review-queue-1');
do $$ begin
  if exists (select 1 from pg_temp.queued('evidence')) then
    raise exception 'Evidence nobody asked to review is in the queue';
  end if;
end $$;
insert into public.evidence_reviews(id, tenant_id, evidence_version_id, reviewer_party_id, decision) values
  ('c9a52000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c9a51000-0000-0000-0000-000000000001', 'c9a10000-0000-0000-0000-000000000001', 'pending');
do $$
declare q public.review_queue_rows;
begin
  if (select count(*) from pg_temp.queued('evidence')) <> 1 then
    raise exception 'A pending review queued % rows', (select count(*) from pg_temp.queued('evidence'));
  end if;
  select * into q from pg_temp.queued('evidence');
  if q.id <> 'c9a51000-0000-0000-0000-000000000001' or q.record_table <> 'evidence_versions'
    or q.parent_table <> 'evidence_artifacts' or q.parent_id <> 'c9a50000-0000-0000-0000-000000000001'
    or q.name <> 'Rollback signature test report' or q.version_number <> 1
    or q.program_id <> 'c9a20000-0000-0000-0000-000000000001' or q.program_name <> 'Rollback review queue program'
    or q.waiting_on_party_id <> 'c9a10000-0000-0000-0000-000000000001' or q.waiting_on_name <> 'Rollback reviewer'
    or q.requested_by_party_id <> 'c9a10000-0000-0000-0000-000000000002' or q.requested_by_name <> 'Review queue test editor'
    or q.owner_name <> 'Rollback reviewer' or q.kind_rank <> 1 or q.waiting_since <> now()
    or q.target is not null or q.determination_count is not null then
    raise exception 'Evidence to accept reads %', to_jsonb(q);
  end if;
end $$;
-- A newer version takes the artifact's place: the review asked of the version before no longer
-- counts, and the new one waits once a review of it is asked for.
insert into public.evidence_versions(id, tenant_id, artifact_id, version_number, state, external_uri) values
  ('c9a51000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'c9a50000-0000-0000-0000-000000000001', 2, 'published', 'https://example.test/evidence/review-queue-2');
do $$ begin
  if exists (select 1 from pg_temp.queued('evidence')) then
    raise exception 'A review of a version a newer one replaced is still in the queue';
  end if;
end $$;
insert into public.evidence_reviews(id, tenant_id, evidence_version_id, reviewer_party_id, decision) values
  ('c9a52000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'c9a51000-0000-0000-0000-000000000002', 'c9a10000-0000-0000-0000-000000000001', 'pending');
do $$ begin
  if array(select q.id from pg_temp.queued('evidence') q) <> array['c9a51000-0000-0000-0000-000000000002']::uuid[]
    or (select q.version_number from pg_temp.queued('evidence') q) <> 2 then
    raise exception 'The latest version''s pending review is not what the queue holds';
  end if;
end $$;

-- Discussion to resolve: a discussion started on the requirement waits from when it was opened,
-- asked by its author, in the requirement's program.
select set_config('test.thread', (public.command_assurance_review(current_setting('test.tenant')::uuid,
  'c9a60000-0000-0000-0000-000000000001', jsonb_build_object(
    'operation', 'create-thread',
    'target', jsonb_build_object('kind', 'requirement', 'recordId', 'c9a40000-0000-0000-0000-000000000001'),
    'subject', 'Which build does the report cover?',
    'body', 'The report names build 4.2; the requirement was written for 4.3.')))->>'threadId', true);
do $$
declare q public.review_queue_rows;
begin
  if (select count(*) from pg_temp.queued('discussion')) <> 1 then
    raise exception 'An open discussion queued % rows', (select count(*) from pg_temp.queued('discussion'));
  end if;
  select * into q from pg_temp.queued('discussion');
  if q.id <> current_setting('test.thread')::uuid or q.record_table <> 'assurance_review_threads'
    or q.name <> 'Which build does the report cover?'
    or q.program_id <> 'c9a20000-0000-0000-0000-000000000001'
    or q.target <> jsonb_build_object('kind', 'requirement', 'recordId', 'c9a40000-0000-0000-0000-000000000001')
    or q.requested_by_party_id <> 'c9a10000-0000-0000-0000-000000000002' or q.requested_by_name <> 'Review queue test editor'
    or q.waiting_on_party_id is not null or q.parent_id is not null or q.kind_rank <> 6 or q.waiting_since <> now() then
    raise exception 'Discussion to resolve reads %', to_jsonb(q);
  end if;
end $$;

-- Gate to decide: a gate not started waits on nobody; once in review it waits, with its due day.
insert into public.lifecycle_gates(id, tenant_id, program_id, title, status, due_on) values
  ('c9a70000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c9a20000-0000-0000-0000-000000000001', 'Rollback design review', 'not_started', '2026-12-01');
do $$ begin
  if exists (select 1 from pg_temp.queued('gate')) then
    raise exception 'A gate not started is in the queue';
  end if;
end $$;
update public.lifecycle_gates set status = 'in_review', revision = revision + 1
  where id = 'c9a70000-0000-0000-0000-000000000001';
do $$
declare q public.review_queue_rows;
begin
  select * into q from pg_temp.queued('gate');
  if q.id is distinct from 'c9a70000-0000-0000-0000-000000000001' or q.record_table <> 'lifecycle_gates'
    or q.name <> 'Rollback design review' or q.program_name <> 'Rollback review queue program'
    or q.due_on <> '2026-12-01' or q.kind_rank <> 4 or q.waiting_since <> now() then
    raise exception 'Gate to decide reads %', to_jsonb(q);
  end if;
end $$;

-- Assessment results to publish: a draft results revision holding no finding is its assessor's
-- still; once it holds one, its determinations wait to be published, in the campaign's program.
insert into public.ssp_revisions(id, tenant_id, system_id, profile_resolution_id, version_number) values
  ('c9a80000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c9a30000-0000-0000-0000-000000000001', current_setting('test.resolution')::uuid, 1);
insert into public.implemented_requirements(tenant_id, ssp_revision_id, selected_control_id, description) values
  (current_setting('test.tenant')::uuid, 'c9a80000-0000-0000-0000-000000000001', current_setting('test.selection')::uuid, 'The system runs signed builds only.');
update public.ssp_revisions set state = 'published', published_at = now(), revision = revision + 1
  where id = 'c9a80000-0000-0000-0000-000000000001';
insert into public.assessment_campaigns(id, tenant_id, title, program_id, owner_party_id) values
  ('c9a81000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'Rollback review campaign', 'c9a20000-0000-0000-0000-000000000001', 'c9a10000-0000-0000-0000-000000000001');
insert into public.assessment_plan_revisions(id, tenant_id, version_number, campaign_id, ssp_revision_id, title) values
  ('c9a82000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 1, 'c9a81000-0000-0000-0000-000000000001', 'c9a80000-0000-0000-0000-000000000001', 'Rollback review plan');
update public.assessment_plan_revisions set state = 'published', published_at = now(), revision = revision + 1
  where id = 'c9a82000-0000-0000-0000-000000000001';
insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title) values
  ('c9a83000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 1, 'c9a82000-0000-0000-0000-000000000001', 'Rollback review results');
do $$ begin
  if exists (select 1 from pg_temp.queued('assessment_results')) then
    raise exception 'Results holding no finding are in the queue';
  end if;
end $$;
insert into public.result_sets(id, tenant_id, assessment_results_revision_id, title) values
  ('c9a84000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c9a83000-0000-0000-0000-000000000001', 'Rollback review set');
insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at) values
  (current_setting('test.tenant')::uuid, 'c9a83000-0000-0000-0000-000000000001', 'c9a84000-0000-0000-0000-000000000001', current_setting('test.part')::uuid, 'Signed builds hold', 'satisfied', now()),
  (current_setting('test.tenant')::uuid, 'c9a83000-0000-0000-0000-000000000001', 'c9a84000-0000-0000-0000-000000000001', current_setting('test.part')::uuid, 'Unsigned builds are refused', 'partially_satisfied', now());
do $$
declare q public.review_queue_rows;
begin
  select * into q from pg_temp.queued('assessment_results');
  if q.id is distinct from 'c9a83000-0000-0000-0000-000000000001' or q.record_table <> 'assessment_results_revisions'
    or q.parent_table <> 'assessment_campaigns' or q.parent_id <> 'c9a81000-0000-0000-0000-000000000001'
    or q.parent_name <> 'Rollback review campaign' or q.name <> 'Rollback review results'
    or q.program_id <> 'c9a20000-0000-0000-0000-000000000001' or q.version_number <> 1
    or q.determination_count <> 2 or q.owner_name <> 'Rollback reviewer' or q.kind_rank <> 2
    or q.waiting_since <> now() then
    raise exception 'Assessment results to publish reads %', to_jsonb(q);
  end if;
end $$;

-- Product assessment to publish: a draft assessment of a published product version waits on its
-- assessor once it holds a determination. A product belongs to no program.
insert into public.products(id, tenant_id, code, name) values
  ('c9a90000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'RQ-PRODUCT', 'Rollback review product');
insert into public.product_revisions(id, tenant_id, product_id, version_number) values
  ('c9a91000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c9a90000-0000-0000-0000-000000000001', 1);
insert into public.product_elements(tenant_id, product_revision_id, code, name, element_type) values
  (current_setting('test.tenant')::uuid, 'c9a91000-0000-0000-0000-000000000001', 'CORE', 'Rollback core', 'software');
update public.product_revisions set state = 'published', revision = revision + 1
  where id = 'c9a91000-0000-0000-0000-000000000001';
insert into public.product_assessments(id, tenant_id, product_revision_id, profile_resolution_id, title, assessor_party_id) values
  ('c9a92000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c9a91000-0000-0000-0000-000000000001', current_setting('test.resolution')::uuid, 'Rollback product assessment', 'c9a10000-0000-0000-0000-000000000001');
do $$ begin
  if exists (select 1 from pg_temp.queued('product_assessment')) then
    raise exception 'A product assessment holding no determination is in the queue';
  end if;
end $$;
insert into public.product_determinations(tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination) values
  (current_setting('test.tenant')::uuid, 'c9a92000-0000-0000-0000-000000000001', 'c9a91000-0000-0000-0000-000000000001', null, current_setting('test.control')::uuid, 'satisfied');
do $$
declare q public.review_queue_rows;
begin
  select * into q from pg_temp.queued('product_assessment');
  if q.id is distinct from 'c9a92000-0000-0000-0000-000000000001' or q.record_table <> 'product_assessments'
    or q.parent_table <> 'products' or q.parent_id <> 'c9a90000-0000-0000-0000-000000000001'
    or q.parent_name <> 'Rollback review product' or q.name <> 'Rollback product assessment'
    or q.program_id is not null or q.program_name is not null or q.version_number <> 1
    or q.waiting_on_party_id <> 'c9a10000-0000-0000-0000-000000000001' or q.waiting_on_name <> 'Rollback reviewer'
    or q.determination_count <> 1 or q.kind_rank <> 3 or q.waiting_since <> now() then
    raise exception 'Product assessment to publish reads %', to_jsonb(q);
  end if;
end $$;

-- Package to decide: a version submitted while still a draft is the program's own; published, it
-- waits on its authorizing official from when it was submitted.
insert into public.authorization_packages(id, tenant_id, program_id, system_id, title, owner_party_id) values
  ('c9aa0000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c9a20000-0000-0000-0000-000000000001', 'c9a30000-0000-0000-0000-000000000001', 'Rollback authorization package', 'c9a10000-0000-0000-0000-000000000001');
insert into public.package_revisions(id, tenant_id, package_id, version_number, submitted_at) values
  ('c9aa1000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c9aa0000-0000-0000-0000-000000000001', 1, now() - interval '2 days');
do $$ begin
  if exists (select 1 from pg_temp.queued('package')) then
    raise exception 'A package version still a draft is in the queue';
  end if;
end $$;
update public.package_revisions set state = 'published', revision = revision + 1
  where id = 'c9aa1000-0000-0000-0000-000000000001';
do $$
declare q public.review_queue_rows;
begin
  select * into q from pg_temp.queued('package');
  if q.id is distinct from 'c9aa1000-0000-0000-0000-000000000001' or q.record_table <> 'package_revisions'
    or q.parent_table <> 'authorization_packages' or q.parent_id <> 'c9aa0000-0000-0000-0000-000000000001'
    or q.name <> 'Rollback authorization package' or q.program_id <> 'c9a20000-0000-0000-0000-000000000001'
    or q.version_number <> 1 or q.owner_name <> 'Rollback reviewer' or q.kind_rank <> 5
    or q.waiting_since <> now() - interval '2 days' then
    raise exception 'Package to decide reads %', to_jsonb(q);
  end if;
end $$;

-- A draft its author is still writing waits on nobody: a security plan, an assessment plan and a
-- risk assessment in draft add nothing to the queue.
insert into public.ssp_revisions(tenant_id, system_id, profile_resolution_id, version_number) values
  (current_setting('test.tenant')::uuid, 'c9a30000-0000-0000-0000-000000000001', current_setting('test.resolution')::uuid, 2);
insert into public.assessment_plan_revisions(tenant_id, version_number, campaign_id, ssp_revision_id, title) values
  (current_setting('test.tenant')::uuid, 2, 'c9a81000-0000-0000-0000-000000000001', 'c9a80000-0000-0000-0000-000000000001', 'Rollback plan in draft');
insert into public.risks(id, tenant_id, program_id, title) values
  ('c9ab0000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'c9a20000-0000-0000-0000-000000000001', 'Rollback unsigned build risk');
insert into public.risk_revisions(tenant_id, risk_id, version_number, severity) values
  (current_setting('test.tenant')::uuid, 'c9ab0000-0000-0000-0000-000000000001', 1, 'high');

-- =============================================================================================
-- The queue as each reader reads it: six records, one of each kind, in the vocabulary's order.
-- =============================================================================================
do $$ begin
  if array(select q.kind from public.review_queue_rows q
      where q.tenant_id = current_setting('test.tenant')::uuid order by q.kind_rank, q.id)
    <> array['evidence', 'assessment_results', 'product_assessment', 'gate', 'package', 'discussion'] then
    raise exception 'The editor''s queue holds %', array(select q.kind from public.review_queue_rows q
      where q.tenant_id = current_setting('test.tenant')::uuid order by q.kind_rank, q.id);
  end if;
end $$;
-- A viewer reads the same queue.
select set_config('request.jwt.claim.sub', 'c9a00000-0000-0000-0000-000000000003', true);
do $$ begin
  if (select count(*) from public.review_queue_rows where tenant_id = current_setting('test.tenant')::uuid) <> 6
    or exists (select 1 from public.review_queue_rows where tenant_id <> current_setting('test.tenant')::uuid) then
    raise exception 'A viewer does not read the workspace''s queue as a member does';
  end if;
end $$;
-- A member of another workspace reads none of it, from their own workspace or by naming this one.
select set_config('request.jwt.claim.sub', 'c9a00000-0000-0000-0000-000000000004', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
do $$ begin
  if exists (select 1 from public.review_queue_rows)
    or exists (select 1 from public.review_queue_rows where tenant_id = current_setting('test.tenant')::uuid) then
    raise exception 'A member of another workspace read this workspace''s queue';
  end if;
end $$;

-- =============================================================================================
-- Each kind leaves the queue as its reviewer acts.
-- =============================================================================================
select set_config('request.jwt.claim.sub', 'c9a00000-0000-0000-0000-000000000001', true);

-- The reviewer accepts the evidence: a decision after the review asked for is the latest.
insert into public.evidence_reviews(tenant_id, evidence_version_id, reviewer_party_id, decision, rationale, reviewed_at) values
  (current_setting('test.tenant')::uuid, 'c9a51000-0000-0000-0000-000000000002', 'c9a10000-0000-0000-0000-000000000001', 'accepted', 'The report covers build 4.3.', now() + interval '1 minute');
do $$ begin
  if exists (select 1 from pg_temp.queued('evidence')) then
    raise exception 'Accepted evidence is still in the queue';
  end if;
end $$;

-- The discussion is resolved, and leaves; reopened, it waits again; resolved once more, it leaves.
select public.command_assurance_review(current_setting('test.tenant')::uuid, 'c9a60000-0000-0000-0000-000000000002',
  jsonb_build_object('operation', 'set-status', 'threadId', current_setting('test.thread')::uuid,
    'expectedRevision', 1, 'status', 'resolved'));
do $$ begin
  if exists (select 1 from pg_temp.queued('discussion')) then
    raise exception 'A resolved discussion is still in the queue';
  end if;
end $$;
select public.command_assurance_review(current_setting('test.tenant')::uuid, 'c9a60000-0000-0000-0000-000000000003',
  jsonb_build_object('operation', 'set-status', 'threadId', current_setting('test.thread')::uuid,
    'expectedRevision', 2, 'status', 'open'));
do $$ begin
  if array(select q.id from pg_temp.queued('discussion') q) <> array[current_setting('test.thread')::uuid] then
    raise exception 'A reopened discussion is not back in the queue';
  end if;
end $$;
select public.command_assurance_review(current_setting('test.tenant')::uuid, 'c9a60000-0000-0000-0000-000000000004',
  jsonb_build_object('operation', 'set-status', 'threadId', current_setting('test.thread')::uuid,
    'expectedRevision', 3, 'status', 'resolved'));

-- The gate is decided.
update public.lifecycle_gates set status = 'passed', decided_at = now(), revision = revision + 1
  where id = 'c9a70000-0000-0000-0000-000000000001';
-- The results are published.
update public.assessment_results_revisions set state = 'published', published_at = now(), revision = revision + 1
  where id = 'c9a83000-0000-0000-0000-000000000001';
-- The product assessment is published.
update public.product_assessments set state = 'published', revision = revision + 1
  where id = 'c9a92000-0000-0000-0000-000000000001';
-- The authorizing official decides the package.
insert into public.authorization_decisions(tenant_id, package_revision_id, decision_maker_party_id, decision, rationale, decided_at) values
  (current_setting('test.tenant')::uuid, 'c9aa1000-0000-0000-0000-000000000001', 'c9a10000-0000-0000-0000-000000000001', 'authorized', 'Residual risk is accepted for one year.', now());
do $$ begin
  if exists (select 1 from public.review_queue_rows where tenant_id = current_setting('test.tenant')::uuid) then
    raise exception 'Records a reviewer acted on are still in the queue: %', array(
      select q.kind || ' ' || q.name from public.review_queue_rows q where q.tenant_id = current_setting('test.tenant')::uuid);
  end if;
end $$;

-- An anonymous session reads none of it.
set local role anon;
select pg_temp.expect_error('select count(*) from public.review_queue_rows', '42501');
reset role;
do $$ begin
  if has_table_privilege('anon', 'public.review_queue_rows', 'select')
    or not has_table_privilege('authenticated', 'public.review_queue_rows', 'select')
    or not exists (select 1 from pg_catalog.pg_class c
      where c.oid = 'public.review_queue_rows'::regclass and 'security_invoker=true' = any(c.reloptions)) then
    raise exception 'The queue is not a view read as the signed-in member';
  end if;
end $$;
rollback;
select 'The Review queue: each kind joining as it waits on a reviewer and leaving as the reviewer acts, drafts kept out, the workspace boundary and a viewer''s read passed.' as result;
