-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- One owner for many records in one request: who may ask, what it assigns and leaves as it is, a
-- request sent again, each collection it names, and what stops the whole request: a collection it
-- does not name, nothing chosen, an owner or a record of another workspace, a record that is gone
-- and a session that may not write.
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
  if has_function_privilege('anon', 'public.assign_record_owner(text, uuid[], uuid)', 'execute')
    or has_function_privilege('public', 'public.assign_record_owner(text, uuid[], uuid)', 'execute') then
    raise exception 'An anonymous session may execute assign_record_owner';
  end if;
  if not has_function_privilege('authenticated', 'public.assign_record_owner(text, uuid[], uuid)', 'execute') then
    raise exception 'A signed-in session may not execute assign_record_owner';
  end if;
  if (select p.prosecdef from pg_catalog.pg_proc p where p.oid = 'public.assign_record_owner(text, uuid[], uuid)'::regprocedure) then
    raise exception 'assign_record_owner does not run as its caller';
  end if;
end $$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('a5500000-0000-0000-0000-000000000001', 'assign-owner-editor@example.test', '{"name":"Assign owner test editor"}'),
  ('a5500000-0000-0000-0000-000000000002', 'assign-owner-outsider@example.test', '{}'),
  ('a5500000-0000-0000-0000-000000000003', 'assign-owner-viewer@example.test', '{}');

-- Another workspace, with a party and a risk of its own.
select set_config('request.jwt.claim.sub', 'a5500000-0000-0000-0000-000000000002', true);
set local role authenticated;
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
insert into public.programs(id, tenant_id, code, name) values
  ('a5510000-0000-0000-0000-0000000000ff', current_setting('test.other_tenant')::uuid, 'OWNER-OTHER', 'Another workspace''s program');
insert into public.parties(id, tenant_id, party_type, name) values
  ('a5520000-0000-0000-0000-0000000000ff', current_setting('test.other_tenant')::uuid, 'person', 'Another workspace''s person');
insert into public.risks(id, tenant_id, title, program_id) values
  ('a5530000-0000-0000-0000-0000000000ff', current_setting('test.other_tenant')::uuid, 'Another workspace''s risk', 'a5510000-0000-0000-0000-0000000000ff');

-- The workspace under test: a program, two parties, three risks (one already owned by the first
-- party), and one record of each other collection.
select set_config('request.jwt.claim.sub', 'a5500000-0000-0000-0000-000000000001', true);
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.programs(id, tenant_id, code, name) values
  ('a5510000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'OWNER-TEST', 'Assign owner test program');
insert into public.parties(id, tenant_id, party_type, name) values
  ('a5520000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'person', 'Priya Raghavan'),
  ('a5520000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'organization', 'Platform engineering');
insert into public.risks(id, tenant_id, title, program_id, owner_party_id) values
  ('a5530000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'Risk with no owner', 'a5510000-0000-0000-0000-000000000001', null),
  ('a5530000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'Risk another party owns', 'a5510000-0000-0000-0000-000000000001', 'a5520000-0000-0000-0000-000000000002'),
  ('a5530000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'Risk the owner already holds', 'a5510000-0000-0000-0000-000000000001', 'a5520000-0000-0000-0000-000000000001'),
  ('a5530000-0000-0000-0000-000000000004', current_setting('test.tenant')::uuid, 'Risk nobody chose', 'a5510000-0000-0000-0000-000000000001', null);
insert into public.operational_issues(id, tenant_id, title, program_id) values
  ('a5540000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'Issue with no owner', 'a5510000-0000-0000-0000-000000000001');
insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind) values
  ('a5550000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'Evidence with no owner', 'document');
insert into public.poam_documents(id, tenant_id, title, program_id) values
  ('a5560000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'Assign owner test plan', 'a5510000-0000-0000-0000-000000000001');
insert into public.poam_items(id, tenant_id, poam_document_id, title) values
  ('a5570000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'a5560000-0000-0000-0000-000000000001', 'Remediation item with no owner');

-- ---------------------------------------------------------------------------------------------
-- What it assigns, and what it leaves as it is.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_answer jsonb;
  v_owner constant uuid := 'a5520000-0000-0000-0000-000000000001';
  v_chosen constant uuid[] := array[
    'a5530000-0000-0000-0000-000000000001', 'a5530000-0000-0000-0000-000000000002',
    'a5530000-0000-0000-0000-000000000003',
    -- An id sent twice, and an empty one, are one record and none.
    'a5530000-0000-0000-0000-000000000001', null]::uuid[];
begin
  v_answer := public.assign_record_owner('risks', v_chosen, v_owner);
  if v_answer <> '{"assigned": 2, "unchanged": 1}'::jsonb then
    raise exception 'The first request answered %', v_answer;
  end if;
  if exists (select 1 from public.risks r where r.id = any(v_chosen) and r.owner_party_id is distinct from v_owner) then
    raise exception 'A chosen risk did not take the owner';
  end if;
  -- A record that takes the owner moves to its next revision; one that held it keeps its own.
  if (select array_agg(r.revision order by r.id) from public.risks r where r.id = any(v_chosen)) <> array[2, 2, 1]::bigint[] then
    raise exception 'Revisions after the first request: %', (select array_agg(r.revision order by r.id) from public.risks r where r.id = any(v_chosen));
  end if;
  if (select r.owner_party_id from public.risks r where r.id = 'a5530000-0000-0000-0000-000000000004') is not null then
    raise exception 'A risk nobody chose took the owner';
  end if;

  -- The same request sent again changes nothing.
  v_answer := public.assign_record_owner('risks', v_chosen, v_owner);
  if v_answer <> '{"assigned": 0, "unchanged": 3}'::jsonb then
    raise exception 'The request sent again answered %', v_answer;
  end if;
  if (select array_agg(r.revision order by r.id) from public.risks r where r.id = any(v_chosen)) <> array[2, 2, 1]::bigint[] then
    raise exception 'A request sent again moved a revision';
  end if;

  -- An organization owns records as a person does, and each collection takes the command.
  v_answer := public.assign_record_owner('operational_issues', array['a5540000-0000-0000-0000-000000000001']::uuid[], 'a5520000-0000-0000-0000-000000000002');
  if v_answer <> '{"assigned": 1, "unchanged": 0}'::jsonb
    or (select i.owner_party_id from public.operational_issues i where i.id = 'a5540000-0000-0000-0000-000000000001') <> 'a5520000-0000-0000-0000-000000000002' then
    raise exception 'An operational issue did not take the owner: %', v_answer;
  end if;
  v_answer := public.assign_record_owner('evidence_artifacts', array['a5550000-0000-0000-0000-000000000001']::uuid[], v_owner);
  if v_answer <> '{"assigned": 1, "unchanged": 0}'::jsonb
    or (select e.owner_party_id from public.evidence_artifacts e where e.id = 'a5550000-0000-0000-0000-000000000001') <> v_owner then
    raise exception 'An evidence artifact did not take the owner: %', v_answer;
  end if;
  v_answer := public.assign_record_owner('poam_items', array['a5570000-0000-0000-0000-000000000001']::uuid[], v_owner);
  if v_answer <> '{"assigned": 1, "unchanged": 0}'::jsonb
    or (select i.owner_party_id from public.poam_items i where i.id = 'a5570000-0000-0000-0000-000000000001') <> v_owner then
    raise exception 'A remediation item did not take the owner: %', v_answer;
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- What stops the whole request.
-- ---------------------------------------------------------------------------------------------
-- A collection the command does not name, a table that is not one, and none.
select pg_temp.expect_error($$select public.assign_record_owner('programs', array['a5510000-0000-0000-0000-000000000001']::uuid[], 'a5520000-0000-0000-0000-000000000001')$$, '22023');
select pg_temp.expect_error($$select public.assign_record_owner('risks; drop table public.risks', array['a5530000-0000-0000-0000-000000000001']::uuid[], 'a5520000-0000-0000-0000-000000000001')$$, '22023');
select pg_temp.expect_error($$select public.assign_record_owner(null, array['a5530000-0000-0000-0000-000000000001']::uuid[], 'a5520000-0000-0000-0000-000000000001')$$, '22023');
-- Nothing chosen.
select pg_temp.expect_error($$select public.assign_record_owner('risks', '{}'::uuid[], 'a5520000-0000-0000-0000-000000000001')$$, '22023');
select pg_temp.expect_error($$select public.assign_record_owner('risks', null, 'a5520000-0000-0000-0000-000000000001')$$, '22023');
select pg_temp.expect_error($$select public.assign_record_owner('risks', array[null]::uuid[], 'a5520000-0000-0000-0000-000000000001')$$, '22023');
-- No owner, an owner that does not exist, and another workspace's party.
select pg_temp.expect_error($$select public.assign_record_owner('risks', array['a5530000-0000-0000-0000-000000000004']::uuid[], null)$$, '22023');
select pg_temp.expect_error($$select public.assign_record_owner('risks', array['a5530000-0000-0000-0000-000000000004']::uuid[], 'a5520000-0000-0000-0000-00000000dead')$$, '22023');
select pg_temp.expect_error($$select public.assign_record_owner('risks', array['a5530000-0000-0000-0000-000000000004']::uuid[], 'a5520000-0000-0000-0000-0000000000ff')$$, '22023');
-- A record that is gone, and another workspace's record: none of the request is applied.
select pg_temp.expect_error($$select public.assign_record_owner('risks', array['a5530000-0000-0000-0000-000000000004', 'a5530000-0000-0000-0000-00000000dead']::uuid[], 'a5520000-0000-0000-0000-000000000001')$$, 'P0002');
select pg_temp.expect_error($$select public.assign_record_owner('risks', array['a5530000-0000-0000-0000-000000000004', 'a5530000-0000-0000-0000-0000000000ff']::uuid[], 'a5520000-0000-0000-0000-000000000001')$$, 'P0002');
do $$ begin
  if (select r.owner_party_id from public.risks r where r.id = 'a5530000-0000-0000-0000-000000000004') is not null then
    raise exception 'A refused request assigned an owner';
  end if;
end $$;

-- A session with no account, and an anonymous one.
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($$select public.assign_record_owner('risks', array['a5530000-0000-0000-0000-000000000004']::uuid[], 'a5520000-0000-0000-0000-000000000001')$$, '42501');
set local role anon;
select pg_temp.expect_error($$select public.assign_record_owner('risks', array['a5530000-0000-0000-0000-000000000004']::uuid[], 'a5520000-0000-0000-0000-000000000001')$$, '42501');

-- Someone outside the workspace reads neither the owner nor the record.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5500000-0000-0000-0000-000000000002', true);
select pg_temp.expect_error($$select public.assign_record_owner('risks', array['a5530000-0000-0000-0000-000000000004']::uuid[], 'a5520000-0000-0000-0000-000000000001')$$, '22023');
-- Their own party owns nothing in a workspace they are no member of.
select pg_temp.expect_error($$select public.assign_record_owner('risks', array['a5530000-0000-0000-0000-000000000004']::uuid[], 'a5520000-0000-0000-0000-0000000000ff')$$, 'P0002');

-- A viewer reads the records and the owner, and may not write: nothing is assigned, and the
-- request says who can. A record that already holds the owner asks nothing of the viewer.
reset role;
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'a5500000-0000-0000-0000-000000000003', 'viewer');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5500000-0000-0000-0000-000000000003', true);
select pg_temp.expect_error($$select public.assign_record_owner('risks', array['a5530000-0000-0000-0000-000000000004', 'a5530000-0000-0000-0000-000000000003']::uuid[], 'a5520000-0000-0000-0000-000000000001')$$, '42501');
do $$
declare v_answer jsonb;
begin
  if (select r.owner_party_id from public.risks r where r.id = 'a5530000-0000-0000-0000-000000000004') is not null then
    raise exception 'A viewer assigned an owner';
  end if;
  v_answer := public.assign_record_owner('risks', array['a5530000-0000-0000-0000-000000000003']::uuid[], 'a5520000-0000-0000-0000-000000000001');
  if v_answer <> '{"assigned": 0, "unchanged": 1}'::jsonb then
    raise exception 'A viewer asking for nothing new answered %', v_answer;
  end if;
end $$;

rollback;
