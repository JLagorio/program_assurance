-- Run with psql -v ON_ERROR_STOP=1 after migrations and the pinned reference data
-- (npm run seed:reference). Every test row rolls back.
-- A program's roles (program_role_assignments, migration 20261117125128_program_roles_held_to_acts):
-- who reads and writes them (a viewer reads, a member who may write writes, another workspace and
-- an anonymous session neither), the roles RMF names, one authorizing official and one lead
-- assessor at a time (days that overlap refused, a handover allowed), the two reads
-- (program_roles, a program's roles with today's holders by name; program_reader_roles, the
-- signed-in reader's own, through an organization too), and the two acts held to roles: only the
-- authorizing official records an authorization decision and names themselves as its decision
-- maker, and only the lead assessor publishes assessment results, by the command or by setting a
-- draft's state, and is named as their publisher; a session with no account (as the seeds write)
-- is held to the party it names. A program that records nobody in the role is left as before.
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
-- Who may call what: a signed-in session calls the two reads, nobody calls the guards, and an
-- anonymous session reads no assignment. The vocabulary is every role the table allows.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_read text; v_guard text; v_def text; v_allowed text[];
begin
  foreach v_read in array array['public.program_roles(uuid)', 'public.program_reader_roles(uuid)'] loop
    if has_function_privilege('anon', v_read, 'execute') or has_function_privilege('public', v_read, 'execute') then
      raise exception 'An anonymous session may execute %', v_read;
    end if;
    if not has_function_privilege('authenticated', v_read, 'execute') then
      raise exception 'A signed-in session may not execute %', v_read;
    end if;
  end loop;
  foreach v_guard in array array['public.guard_program_role_holder()', 'public.guard_authorization_decision_role()',
    'public.guard_results_publication_role()'] loop
    if has_function_privilege('authenticated', v_guard, 'execute') or has_function_privilege('anon', v_guard, 'execute') then
      raise exception 'A client may execute %', v_guard;
    end if;
  end loop;
  if has_table_privilege('anon', 'public.program_role_assignments', 'select') then
    raise exception 'An anonymous session may read program roles';
  end if;
  select pg_get_constraintdef(c.oid) into v_def from pg_catalog.pg_constraint c
    where c.conrelid = 'public.program_role_assignments'::regclass and c.conname = 'program_role_assignments_role_check';
  select array_agg(m[1] order by m[1]) into v_allowed from regexp_matches(v_def, '''([a-z_]+)''', 'g') m;
  if v_allowed is distinct from (select array_agg(v.role order by v.role) from public.program_role_vocabulary() v) then
    raise exception 'The role vocabulary is not the roles the table allows: %', v_allowed;
  end if;
  if (select array_agg(v.role order by v.role_rank) from public.program_role_vocabulary() v where v.one_holder)
    is distinct from array['authorizing_official', 'lead_assessor'] then
    raise exception 'The roles held one at a time are not the authorizing official and the lead assessor';
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
-- A workspace: its owner; an editor who will be the authorizing official; an assessment office
-- (an organization) and an editor who belongs to it; an editor who assesses; a viewer; an editor
-- with no party of their own; a person with no account; and a member of another workspace.
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email, raw_user_meta_data) values
  ('f0a10000-0000-0000-0000-000000000001', 'roles-owner@example.test', '{"name":"Roles owner"}'),
  ('f0a10000-0000-0000-0000-000000000002', 'roles-official@example.test', '{"name":"Roles official"}'),
  ('f0a10000-0000-0000-0000-000000000003', 'roles-office-assessor@example.test', '{"name":"Roles office assessor"}'),
  ('f0a10000-0000-0000-0000-000000000004', 'roles-assessor@example.test', '{"name":"Roles assessor"}'),
  ('f0a10000-0000-0000-0000-000000000005', 'roles-viewer@example.test', '{"name":"Roles viewer"}'),
  ('f0a10000-0000-0000-0000-000000000006', 'roles-outsider@example.test', '{"name":"Roles outsider"}'),
  ('f0a10000-0000-0000-0000-000000000007', 'roles-partyless@example.test', '{"name":"Roles partyless editor"}');
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'f0a10000-0000-0000-0000-000000000002', 'editor'),
  (current_setting('test.tenant')::uuid, 'f0a10000-0000-0000-0000-000000000003', 'editor'),
  (current_setting('test.tenant')::uuid, 'f0a10000-0000-0000-0000-000000000004', 'editor'),
  (current_setting('test.tenant')::uuid, 'f0a10000-0000-0000-0000-000000000005', 'viewer'),
  (current_setting('test.tenant')::uuid, 'f0a10000-0000-0000-0000-000000000007', 'editor');
insert into public.parties(id, tenant_id, party_type, name) values
  ('f0a11000-0000-0000-0000-000000000008', current_setting('test.tenant')::uuid, 'organization', 'Roles assessment office');
insert into public.parties(id, tenant_id, party_type, name, auth_user_id, organization_id) values
  ('f0a11000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'person', 'Roles official', 'f0a10000-0000-0000-0000-000000000002', null),
  ('f0a11000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'person', 'Roles office assessor', 'f0a10000-0000-0000-0000-000000000003', 'f0a11000-0000-0000-0000-000000000008'),
  ('f0a11000-0000-0000-0000-000000000004', current_setting('test.tenant')::uuid, 'person', 'Roles assessor', 'f0a10000-0000-0000-0000-000000000004', null),
  ('f0a11000-0000-0000-0000-000000000005', current_setting('test.tenant')::uuid, 'person', 'Roles viewer', 'f0a10000-0000-0000-0000-000000000005', null),
  ('f0a11000-0000-0000-0000-000000000006', current_setting('test.tenant')::uuid, 'person', 'Roles next official', null, null);

-- ---------------------------------------------------------------------------------------------
-- Two programs, each with a published SSP, a campaign whose published plan has draft results
-- holding a finding, and an authorization package with a published version: Rollback held
-- program will record its roles, Rollback open program none. A third program holds nothing.
-- ---------------------------------------------------------------------------------------------
insert into public.programs(id, tenant_id, code, name) values
  ('f0a12000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'ROLES-HELD', 'Rollback held program'),
  ('f0a12000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'ROLES-OPEN', 'Rollback open program'),
  ('f0a12000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'ROLES-OTHER', 'Rollback other program');
insert into public.systems(id, tenant_id, program_id, code, name, system_type) values
  ('f0a13000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'f0a12000-0000-0000-0000-000000000001', 'SYS-ROLES-HELD', 'Held system', 'information_system'),
  ('f0a13000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'f0a12000-0000-0000-0000-000000000002', 'SYS-ROLES-OPEN', 'Open system', 'information_system');
insert into public.ssp_revisions(id, tenant_id, system_id, profile_resolution_id, version_number) values
  ('f0a14000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'f0a13000-0000-0000-0000-000000000001', current_setting('test.resolution')::uuid, 1),
  ('f0a14000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'f0a13000-0000-0000-0000-000000000002', current_setting('test.resolution')::uuid, 1);
insert into public.implemented_requirements(tenant_id, ssp_revision_id, selected_control_id, description) values
  (current_setting('test.tenant')::uuid, 'f0a14000-0000-0000-0000-000000000001', current_setting('test.selection')::uuid, 'The held system runs signed builds only.'),
  (current_setting('test.tenant')::uuid, 'f0a14000-0000-0000-0000-000000000002', current_setting('test.selection')::uuid, 'The open system runs signed builds only.');
update public.ssp_revisions set state = 'published', published_at = now(), revision = revision + 1
  where id in ('f0a14000-0000-0000-0000-000000000001', 'f0a14000-0000-0000-0000-000000000002');
insert into public.assessment_campaigns(id, tenant_id, title, program_id) values
  ('f0a15000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'Held campaign', 'f0a12000-0000-0000-0000-000000000001'),
  ('f0a15000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'Open campaign', 'f0a12000-0000-0000-0000-000000000002');
insert into public.assessment_plan_revisions(id, tenant_id, version_number, campaign_id, ssp_revision_id, title) values
  ('f0a16000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 1, 'f0a15000-0000-0000-0000-000000000001', 'f0a14000-0000-0000-0000-000000000001', 'Held plan'),
  ('f0a16000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 1, 'f0a15000-0000-0000-0000-000000000002', 'f0a14000-0000-0000-0000-000000000002', 'Open plan');
update public.assessment_plan_revisions set state = 'published', published_at = now(), revision = revision + 1
  where id in ('f0a16000-0000-0000-0000-000000000001', 'f0a16000-0000-0000-0000-000000000002');
-- Draft results: three of the held program's (one the command publishes, two a direct update
-- tries) and one of the open program's.
insert into public.assessment_results_revisions(id, tenant_id, version_number, assessment_plan_revision_id, title) values
  ('f0a17000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 1, 'f0a16000-0000-0000-0000-000000000001', 'Held results'),
  ('f0a17000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 2, 'f0a16000-0000-0000-0000-000000000001', 'Held seeded results'),
  ('f0a17000-0000-0000-0000-000000000004', current_setting('test.tenant')::uuid, 3, 'f0a16000-0000-0000-0000-000000000001', 'Held updated results'),
  ('f0a17000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 1, 'f0a16000-0000-0000-0000-000000000002', 'Open results');
insert into public.result_sets(id, tenant_id, assessment_results_revision_id, title) values
  ('f0a18000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'f0a17000-0000-0000-0000-000000000001', 'Held set'),
  ('f0a18000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'f0a17000-0000-0000-0000-000000000003', 'Held seeded set'),
  ('f0a18000-0000-0000-0000-000000000004', current_setting('test.tenant')::uuid, 'f0a17000-0000-0000-0000-000000000004', 'Held updated set'),
  ('f0a18000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'f0a17000-0000-0000-0000-000000000002', 'Open set');
insert into public.assessment_findings(tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination, determined_at) values
  (current_setting('test.tenant')::uuid, 'f0a17000-0000-0000-0000-000000000001', 'f0a18000-0000-0000-0000-000000000001', current_setting('test.part')::uuid, 'Signed builds hold', 'satisfied', now()),
  (current_setting('test.tenant')::uuid, 'f0a17000-0000-0000-0000-000000000003', 'f0a18000-0000-0000-0000-000000000003', current_setting('test.part')::uuid, 'Signed builds still hold', 'satisfied', now()),
  (current_setting('test.tenant')::uuid, 'f0a17000-0000-0000-0000-000000000004', 'f0a18000-0000-0000-0000-000000000004', current_setting('test.part')::uuid, 'Signed builds hold again', 'satisfied', now()),
  (current_setting('test.tenant')::uuid, 'f0a17000-0000-0000-0000-000000000002', 'f0a18000-0000-0000-0000-000000000002', current_setting('test.part')::uuid, 'Open builds are signed', 'satisfied', now());
insert into public.authorization_packages(id, tenant_id, program_id, system_id, title) values
  ('f0a1a000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'f0a12000-0000-0000-0000-000000000001', 'f0a13000-0000-0000-0000-000000000001', 'Held package'),
  ('f0a1a000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'f0a12000-0000-0000-0000-000000000002', 'f0a13000-0000-0000-0000-000000000002', 'Open package');
insert into public.package_revisions(id, tenant_id, package_id, version_number, submitted_at) values
  ('f0a1b000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'f0a1a000-0000-0000-0000-000000000001', 1, now()),
  ('f0a1b000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'f0a1a000-0000-0000-0000-000000000002', 1, now());
update public.package_revisions set state = 'published', revision = revision + 1
  where id in ('f0a1b000-0000-0000-0000-000000000001', 'f0a1b000-0000-0000-0000-000000000002');

-- =============================================================================================
-- Who writes roles: a viewer does not; a member who may write does.
-- =============================================================================================
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000005', true);
select pg_temp.expect_error(format($s$insert into public.program_role_assignments(tenant_id, program_id, party_id, role)
  values (%L, 'f0a12000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000005', 'authorizing_official')$s$,
  current_setting('test.tenant')), '42501');
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000004', true);
insert into public.program_role_assignments(id, tenant_id, program_id, party_id, role) values
  ('f0a1c000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'f0a12000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000002', 'authorizing_official'),
  -- The lead assessor is the assessment office: whoever belongs to it acts for it.
  ('f0a1c000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'f0a12000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000008', 'lead_assessor'),
  -- Assessors are several.
  ('f0a1c000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'f0a12000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000004', 'assessor'),
  ('f0a1c000-0000-0000-0000-000000000004', current_setting('test.tenant')::uuid, 'f0a12000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000003', 'assessor'),
  ('f0a1c000-0000-0000-0000-000000000005', current_setting('test.tenant')::uuid, 'f0a12000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000004', 'security_officer'),
  -- The viewer was an ISSM until yesterday: recorded, not held today.
  ('f0a1c000-0000-0000-0000-000000000006', current_setting('test.tenant')::uuid, 'f0a12000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000005', 'security_manager');
update public.program_role_assignments set ends_on = current_date - 1, revision = revision + 1
  where id = 'f0a1c000-0000-0000-0000-000000000006';

-- =============================================================================================
-- One authorizing official and one lead assessor at a time.
-- =============================================================================================
do $$
declare v_tenant text := current_setting('test.tenant');
begin
  -- A second authorizing official on any of the first's days: from today, or from next month while
  -- the first holds it open-ended.
  perform pg_temp.expect_refusal(format($s$insert into public.program_role_assignments(tenant_id, program_id, party_id, role)
    values (%L, 'f0a12000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000006', 'authorizing_official')$s$,
    v_tenant), '23514', 'Roles official is already the authorizing official of Rollback held program on those days');
  perform pg_temp.expect_refusal(format($s$insert into public.program_role_assignments(tenant_id, program_id, party_id, role, starts_on)
    values (%L, 'f0a12000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000006', 'authorizing_official', current_date + 30)$s$,
    v_tenant), '23514', 'A program has one authorizing official at a time');
  -- A second lead assessor.
  perform pg_temp.expect_refusal(format($s$insert into public.program_role_assignments(tenant_id, program_id, party_id, role)
    values (%L, 'f0a12000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000004', 'lead_assessor')$s$,
    v_tenant), '23514', 'Roles assessment office is already the lead assessor');
  -- An assessor made the authorizing official in place.
  perform pg_temp.expect_refusal($s$update public.program_role_assignments set role = 'authorizing_official', revision = revision + 1
    where id = 'f0a1c000-0000-0000-0000-000000000003'$s$, '23514', 'already the authorizing official');
end $$;
-- A handover: the official's days end in four weeks, and the next one's start the day after.
update public.program_role_assignments set ends_on = current_date + 29, revision = revision + 1
  where id = 'f0a1c000-0000-0000-0000-000000000001';
insert into public.program_role_assignments(id, tenant_id, program_id, party_id, role, starts_on) values
  ('f0a1c000-0000-0000-0000-000000000007', current_setting('test.tenant')::uuid, 'f0a12000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000006', 'authorizing_official', current_date + 30),
  -- One at a time is a program's rule: the next official is another program's authorizing official
  -- already.
  ('f0a1c000-0000-0000-0000-000000000008', current_setting('test.tenant')::uuid, 'f0a12000-0000-0000-0000-000000000003', 'f0a11000-0000-0000-0000-000000000006', 'authorizing_official', null);
-- Moved back into the first's days, the next one is refused.
select pg_temp.expect_refusal($s$update public.program_role_assignments set starts_on = current_date + 10, revision = revision + 1
  where id = 'f0a1c000-0000-0000-0000-000000000007'$s$, '23514', 'already the authorizing official');

-- =============================================================================================
-- The two reads.
-- =============================================================================================
-- A program's roles, as the viewer reads them: every role in RMF's order, whether the program
-- records it and today's holders by name.
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000005', true);
do $$
declare v_rows jsonb;
begin
  select jsonb_agg(jsonb_build_object('role', r.role, 'rank', r.role_rank, 'one', r.one_holder, 'recorded', r.recorded,
      'holders', (select coalesce(jsonb_agg(h->>'name'), '[]'::jsonb) from jsonb_array_elements(r.holders) h)) order by r.role_rank)
    into v_rows from public.program_roles('f0a12000-0000-0000-0000-000000000001') r;
  if v_rows is distinct from '[
    {"role": "authorizing_official", "rank": 1, "one": true, "recorded": true, "holders": ["Roles official"]},
    {"role": "lead_assessor", "rank": 2, "one": true, "recorded": true, "holders": ["Roles assessment office"]},
    {"role": "assessor", "rank": 3, "one": false, "recorded": true, "holders": ["Roles assessor", "Roles office assessor"]},
    {"role": "security_manager", "rank": 4, "one": false, "recorded": true, "holders": []},
    {"role": "security_officer", "rank": 5, "one": false, "recorded": true, "holders": ["Roles assessor"]},
    {"role": "system_owner", "rank": 6, "one": false, "recorded": false, "holders": []},
    {"role": "program_manager", "rank": 7, "one": false, "recorded": false, "holders": []},
    {"role": "control_owner", "rank": 8, "one": false, "recorded": false, "holders": []},
    {"role": "reviewer", "rank": 9, "one": false, "recorded": false, "holders": []}
  ]'::jsonb then
    raise exception 'The held program''s roles read %', v_rows;
  end if;
  -- A holder says who it is and for which days.
  if (select r.holders->0 from public.program_roles('f0a12000-0000-0000-0000-000000000001') r where r.role = 'authorizing_official')
    is distinct from jsonb_build_object('assignment_id', 'f0a1c000-0000-0000-0000-000000000001', 'party_id', 'f0a11000-0000-0000-0000-000000000002',
      'name', 'Roles official', 'party_type', 'person', 'starts_on', null, 'ends_on', current_date + 29, 'revision', 2) then
    raise exception 'The authorizing official reads %', (select r.holders from public.program_roles('f0a12000-0000-0000-0000-000000000001') r where r.role = 'authorizing_official');
  end if;
  if (select r.holders->0->>'party_type' from public.program_roles('f0a12000-0000-0000-0000-000000000001') r where r.role = 'lead_assessor') <> 'organization' then
    raise exception 'The lead assessor is not read as an organization';
  end if;
  -- A program that records no role reads every role empty.
  if exists (select 1 from public.program_roles('f0a12000-0000-0000-0000-000000000002') r where r.recorded or r.holders <> '[]'::jsonb)
    or (select count(*) from public.program_roles('f0a12000-0000-0000-0000-000000000002')) <> 9 then
    raise exception 'The open program reads a role it does not record';
  end if;
  -- The viewer holds nothing today: their ISSM days ended yesterday.
  if exists (select 1 from public.program_reader_roles('f0a12000-0000-0000-0000-000000000001')) then
    raise exception 'The viewer reads a role whose days ended';
  end if;
end $$;
-- The reader's own roles: the official's, and the office assessor's, one through the office.
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000002', true);
do $$ begin
  if (select jsonb_agg(jsonb_build_object('role', r.role, 'party', r.party_id, 'holder', r.holder_party_id, 'assignment', r.assignment_id) order by r.role_rank)
      from public.program_reader_roles('f0a12000-0000-0000-0000-000000000001') r)
    is distinct from '[{"role": "authorizing_official", "party": "f0a11000-0000-0000-0000-000000000002", "holder": "f0a11000-0000-0000-0000-000000000002", "assignment": "f0a1c000-0000-0000-0000-000000000001"}]'::jsonb then
    raise exception 'The official reads their roles as %', (select jsonb_agg(to_jsonb(r)) from public.program_reader_roles('f0a12000-0000-0000-0000-000000000001') r);
  end if;
  if exists (select 1 from public.program_reader_roles('f0a12000-0000-0000-0000-000000000002')) then
    raise exception 'The official reads a role on a program that records none';
  end if;
end $$;
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000003', true);
do $$ begin
  if (select jsonb_agg(jsonb_build_object('role', r.role, 'rank', r.role_rank, 'party', r.party_id, 'holder', r.holder_party_id) order by r.role_rank)
      from public.program_reader_roles('f0a12000-0000-0000-0000-000000000001') r)
    is distinct from '[
      {"role": "lead_assessor", "rank": 2, "party": "f0a11000-0000-0000-0000-000000000003", "holder": "f0a11000-0000-0000-0000-000000000008"},
      {"role": "assessor", "rank": 3, "party": "f0a11000-0000-0000-0000-000000000003", "holder": "f0a11000-0000-0000-0000-000000000003"}
    ]'::jsonb then
    raise exception 'The office assessor reads their roles as %', (select jsonb_agg(to_jsonb(r)) from public.program_reader_roles('f0a12000-0000-0000-0000-000000000001') r);
  end if;
end $$;
-- An editor with no party in the workspace holds nothing.
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000007', true);
do $$ begin
  if exists (select 1 from public.program_reader_roles('f0a12000-0000-0000-0000-000000000001')) then
    raise exception 'An editor with no party reads a role';
  end if;
end $$;

-- =============================================================================================
-- Only the authorizing official records an authorization decision.
-- =============================================================================================
-- Where the program records none, any member who may write records one, naming anybody, as before.
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000004', true);
insert into public.authorization_decisions(tenant_id, package_revision_id, decision_maker_party_id, decision, rationale, decided_at) values
  (current_setting('test.tenant')::uuid, 'f0a1b000-0000-0000-0000-000000000002', 'f0a11000-0000-0000-0000-000000000004', 'authorized', 'Accepted for one year.', now());
do $$
declare v_tenant text := current_setting('test.tenant');
begin
  -- An assessor, naming the official.
  perform pg_temp.expect_refusal(format($s$insert into public.authorization_decisions(tenant_id, package_revision_id, decision_maker_party_id, decision, rationale, decided_at)
    values (%L, 'f0a1b000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000002', 'authorized', 'Accepted for one year.', now())$s$,
    v_tenant), '42501', 'Only Roles official, the authorizing official of Rollback held program, can record its authorization decisions.');
end $$;
-- An editor with no party of their own.
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000007', true);
select pg_temp.expect_refusal(format($s$insert into public.authorization_decisions(tenant_id, package_revision_id, decision_maker_party_id, decision, rationale, decided_at)
  values (%L, 'f0a1b000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000002', 'authorized', 'Accepted for one year.', now())$s$,
  current_setting('test.tenant')), '42501', 'Only Roles official');
-- The official, naming somebody else as the decision maker.
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000002', true);
select pg_temp.expect_refusal(format($s$insert into public.authorization_decisions(tenant_id, package_revision_id, decision_maker_party_id, decision, rationale, decided_at)
  values (%L, 'f0a1b000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000006', 'authorized', 'Accepted for one year.', now())$s$,
  current_setting('test.tenant')), '42501', 'An authorization decision on Rollback held program is its authorizing official''s: name Roles official as the decision maker.');
-- The official, naming themselves.
insert into public.authorization_decisions(id, tenant_id, package_revision_id, decision_maker_party_id, decision, rationale, decided_at, conditions) values
  ('f0a1d000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'f0a1b000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000002', 'authorized_with_conditions', 'Accepted with two conditions.', now(), 'Close the two open items by spring.');
-- A session with no account, as the seeds write, is held to the decision maker it names.
reset role;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_refusal(format($s$insert into public.authorization_decisions(tenant_id, package_revision_id, decision_maker_party_id, decision, rationale, decided_at)
  values (%L, 'f0a1b000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000004', 'denied', 'Seeded.', now())$s$,
  current_setting('test.tenant')), '42501', 'name Roles official as the decision maker');
insert into public.authorization_decisions(id, tenant_id, package_revision_id, decision_maker_party_id, decision, rationale, decided_at) values
  ('f0a1d000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'f0a1b000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000002', 'authorized', 'Seeded by the official.', now() - interval '1 year');
-- Once the official's days have ended and the next one's have not begun, nobody signs.
update public.program_role_assignments set ends_on = current_date - 1 where id = 'f0a1c000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000002', true);
select pg_temp.expect_refusal(format($s$insert into public.authorization_decisions(tenant_id, package_revision_id, decision_maker_party_id, decision, rationale, decided_at)
  values (%L, 'f0a1b000-0000-0000-0000-000000000001', 'f0a11000-0000-0000-0000-000000000002', 'revoked', 'Revoked.', now())$s$,
  current_setting('test.tenant')), '42501', 'Nobody is the authorizing official of Rollback held program today, so nobody can record its authorization decisions. Record who is.');
do $$ begin
  if (select array_agg(d.id order by d.id) from public.authorization_decisions d
      where d.package_revision_id = 'f0a1b000-0000-0000-0000-000000000001')
    is distinct from array['f0a1d000-0000-0000-0000-000000000001', 'f0a1d000-0000-0000-0000-000000000002']::uuid[] then
    raise exception 'The held package holds a decision somebody other than its official recorded';
  end if;
end $$;

-- =============================================================================================
-- Only the lead assessor publishes assessment results.
-- =============================================================================================
-- Where the program records none, any member who may write publishes, as before.
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000002', true);
do $$ begin
  perform public.publish_assessment_results(current_setting('test.tenant')::uuid, 'f0a17000-0000-0000-0000-000000000002', 1, 1,
    'f0a1e000-0000-0000-0000-000000000001');
  if (select state from public.assessment_results_revisions where id = 'f0a17000-0000-0000-0000-000000000002') <> 'published' then
    raise exception 'The open program''s results were not published';
  end if;
end $$;
-- Neither the official by the command, nor an assessor by setting the state.
do $$
declare v_tenant text := current_setting('test.tenant');
begin
  perform pg_temp.expect_refusal(format($f$select public.publish_assessment_results(%L, 'f0a17000-0000-0000-0000-000000000001', 1, 1, 'f0a1e000-0000-0000-0000-000000000002')$f$,
    v_tenant), '42501', 'Only Roles assessment office, the lead assessor of Rollback held program, can publish its assessment results.');
end $$;
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000004', true);
select pg_temp.expect_refusal($s$update public.assessment_results_revisions set state = 'published', published_by_party_id = 'f0a11000-0000-0000-0000-000000000004', revision = revision + 1
  where id = 'f0a17000-0000-0000-0000-000000000004'$s$, '42501', 'Only Roles assessment office');
do $$ begin
  if exists (select 1 from public.assessment_results_revisions where id in ('f0a17000-0000-0000-0000-000000000001', 'f0a17000-0000-0000-0000-000000000004') and state <> 'draft')
    or exists (select 1 from public.activity_events e where e.assessment_campaign_id = 'f0a15000-0000-0000-0000-000000000001') then
    raise exception 'A refused publication published results or recorded an event';
  end if;
end $$;
-- The office assessor publishes for the office, and is named as its publisher.
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000003', true);
do $$
declare v_answer jsonb;
begin
  v_answer := public.publish_assessment_results(current_setting('test.tenant')::uuid, 'f0a17000-0000-0000-0000-000000000001', 1, 1,
    'f0a1e000-0000-0000-0000-000000000003');
  if (v_answer->>'findings')::integer <> 1
    or (select published_by_party_id from public.assessment_results_revisions where id = 'f0a17000-0000-0000-0000-000000000001')
      is distinct from 'f0a11000-0000-0000-0000-000000000003' then
    raise exception 'The office assessor''s publication reads %', v_answer;
  end if;
end $$;
-- A session with no account is held to the publisher it names: an assessor, or nobody, is refused;
-- the office is not.
reset role;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_refusal($s$update public.assessment_results_revisions set state = 'published', published_at = now(), published_by_party_id = 'f0a11000-0000-0000-0000-000000000004'
  where id = 'f0a17000-0000-0000-0000-000000000003'$s$, '42501',
  'Assessment results of Rollback held program are published by its lead assessor: name Roles assessment office as their publisher.');
select pg_temp.expect_refusal($s$update public.assessment_results_revisions set state = 'published', published_at = now()
  where id = 'f0a17000-0000-0000-0000-000000000003'$s$, '42501', 'name Roles assessment office as their publisher');
update public.assessment_results_revisions set state = 'published', published_at = now(), published_by_party_id = 'f0a11000-0000-0000-0000-000000000008'
  where id = 'f0a17000-0000-0000-0000-000000000003';
-- With nobody the lead assessor today, nobody publishes.
update public.program_role_assignments set starts_on = current_date + 1 where id = 'f0a1c000-0000-0000-0000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000003', true);
select pg_temp.expect_refusal(format($f$select public.publish_assessment_results(%L, 'f0a17000-0000-0000-0000-000000000004', 1, 1, 'f0a1e000-0000-0000-0000-000000000004')$f$,
  current_setting('test.tenant')), '42501', 'Nobody is the lead assessor of Rollback held program today, so nobody can publish its assessment results. Record who is.');

-- =============================================================================================
-- Another workspace's member and a session with no account read none of it, and write none.
-- =============================================================================================
select set_config('request.jwt.claim.sub', 'f0a10000-0000-0000-0000-000000000006', true);
select public.ensure_personal_tenant() is not null as outsider_has_a_workspace;
do $$
declare v_tenant text := current_setting('test.tenant');
begin
  perform pg_temp.expect_refusal($s$select * from public.program_roles('f0a12000-0000-0000-0000-000000000001')$s$, '42501', 'Program access is required');
  perform pg_temp.expect_refusal($s$select * from public.program_reader_roles('f0a12000-0000-0000-0000-000000000001')$s$, '42501', 'Program access is required');
  if exists (select 1 from public.program_role_assignments a where a.tenant_id = v_tenant::uuid) then
    raise exception 'Another workspace''s member reads this workspace''s roles';
  end if;
  perform pg_temp.expect_error(format($s$insert into public.program_role_assignments(tenant_id, program_id, party_id, role)
    values (%L, 'f0a12000-0000-0000-0000-000000000002', 'f0a11000-0000-0000-0000-000000000004', 'authorizing_official')$s$,
    v_tenant), '42501');
end $$;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_refusal($s$select * from public.program_roles('f0a12000-0000-0000-0000-000000000001')$s$, '42501', 'Program access is required');
select pg_temp.expect_refusal($s$select * from public.program_reader_roles('f0a12000-0000-0000-0000-000000000001')$s$, '42501', 'Program access is required');
reset role;
set local role anon;
select pg_temp.expect_error($s$select * from public.program_roles('f0a12000-0000-0000-0000-000000000001')$s$, '42501');
select pg_temp.expect_error($s$select * from public.program_reader_roles('f0a12000-0000-0000-0000-000000000001')$s$, '42501');
select pg_temp.expect_error($s$select * from public.program_role_assignments$s$, '42501');
reset role;

rollback;
select 'Program roles: who reads and writes them, one authorizing official and one lead assessor at a time, both reads, the two acts held to roles with and without a recorded holder, and the tenant boundary passed.' as result;
