-- Run with psql -v ON_ERROR_STOP=1 after migrations and the pinned reference data
-- (npm run seed:reference). Every test row rolls back.
-- What the system tree counts on the server (program_system_counts, migration
-- 20261116044427_pickers_read_less): each element's controls (those its control baseline selects)
-- and requirements (the revisions allocated to it), and those of everything inside it within its
-- authorization boundary, each once; and the requirement Evidence picker's view of the versions it
-- offers (evidence_version_rows). Another workspace's member and an anonymous session read none of
-- either.
begin;

-- ---------------------------------------------------------------------------------------------
-- Three published reference baselines, the smallest first, whose controls the elements select.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_baselines uuid[];
begin
  select array_agg(id order by controls, id) into v_baselines from (
    select r.id, (select count(*) from public.selected_controls sc where sc.profile_resolution_id = r.id) as controls
    from public.profile_resolutions r
    where r.tenant_id is null and r.state = 'published' and r.base_profile_resolution_id is null
      and exists (select 1 from public.selected_controls sc where sc.profile_resolution_id = r.id)
    order by controls, r.id limit 3
  ) chosen;
  if coalesce(cardinality(v_baselines), 0) < 3 then
    raise exception 'The reference data is not loaded. Run npm run seed:reference first.';
  end if;
  perform set_config('test.small', v_baselines[1]::text, true);
  perform set_config('test.medium', v_baselines[2]::text, true);
  perform set_config('test.large', v_baselines[3]::text, true);
end $$;

-- ---------------------------------------------------------------------------------------------
-- A workspace and its owner, and a member of another workspace.
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email, raw_user_meta_data) values
  ('5c000000-0000-0000-0000-000000000001', 'system-counts-owner@example.test', '{"name":"System counts test owner"}'),
  ('5c000000-0000-0000-0000-000000000002', 'system-counts-outsider@example.test', '{"name":"System counts test outsider"}');
select set_config('request.jwt.claim.sub', '5c000000-0000-0000-0000-000000000002', true);
set local role authenticated;
select public.ensure_personal_tenant();
select set_config('request.jwt.claim.sub', '5c000000-0000-0000-0000-000000000001', true);
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);

-- ---------------------------------------------------------------------------------------------
-- The program's elements. B is an authorization boundary with no baseline of its own (no SSP, no
-- scope adoption, no adoption). Inside it E1 adopts the small baseline and E2, inside E1, inherits
-- it; E3 adopts the medium one; E4 has none. N is an authorization boundary nested in B: it adopts
-- the large baseline and N1 inherits it, and neither counts toward B.
--   B ─┬─ E1 ─── E2
--      ├─ E3
--      ├─ E4
--      └─ N (boundary) ─── N1
-- Requirements: R1 on B and on N; R2 on E1 and on E2; R3 on E2; R4 on a security process.
-- ---------------------------------------------------------------------------------------------
insert into public.programs(id, tenant_id, code, name) values
  ('5c100000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'SYS-COUNTS', 'Rollback system counts program');
insert into public.systems(id, tenant_id, program_id, code, name, system_type) values
  ('5c200000-0000-0000-0000-00000000000b', current_setting('test.tenant')::uuid, '5c100000-0000-0000-0000-000000000001', 'B', 'Boundary', 'information_system');
insert into public.systems(id, tenant_id, program_id, code, name, system_type, parent_system_id, is_authorization_boundary) values
  ('5c200000-0000-0000-0000-0000000000e1', current_setting('test.tenant')::uuid, '5c100000-0000-0000-0000-000000000001', 'E1', 'First element', 'software', '5c200000-0000-0000-0000-00000000000b', false),
  ('5c200000-0000-0000-0000-0000000000e3', current_setting('test.tenant')::uuid, '5c100000-0000-0000-0000-000000000001', 'E3', 'Third element', 'software', '5c200000-0000-0000-0000-00000000000b', false),
  ('5c200000-0000-0000-0000-0000000000e4', current_setting('test.tenant')::uuid, '5c100000-0000-0000-0000-000000000001', 'E4', 'Fourth element', 'software', '5c200000-0000-0000-0000-00000000000b', false),
  ('5c200000-0000-0000-0000-00000000000a', current_setting('test.tenant')::uuid, '5c100000-0000-0000-0000-000000000001', 'N', 'Nested boundary', 'information_system', '5c200000-0000-0000-0000-00000000000b', true);
insert into public.systems(id, tenant_id, program_id, code, name, system_type, parent_system_id, is_authorization_boundary) values
  ('5c200000-0000-0000-0000-0000000000e2', current_setting('test.tenant')::uuid, '5c100000-0000-0000-0000-000000000001', 'E2', 'Second element', 'software', '5c200000-0000-0000-0000-0000000000e1', false),
  ('5c200000-0000-0000-0000-0000000000a1', current_setting('test.tenant')::uuid, '5c100000-0000-0000-0000-000000000001', 'N1', 'Nested element', 'software', '5c200000-0000-0000-0000-00000000000a', false);
-- The elements adopt their baselines as the baseline dialog would; a guard keeps the column to
-- that command, so the test sets it as the database's owner.
reset role;
update public.systems set adopted_profile_resolution_id = current_setting('test.small')::uuid, revision = revision + 1
  where id = '5c200000-0000-0000-0000-0000000000e1';
update public.systems set adopted_profile_resolution_id = current_setting('test.medium')::uuid, revision = revision + 1
  where id = '5c200000-0000-0000-0000-0000000000e3';
update public.systems set adopted_profile_resolution_id = current_setting('test.large')::uuid, revision = revision + 1
  where id = '5c200000-0000-0000-0000-00000000000a';
set local role authenticated;
insert into public.engineering_requirements(id, tenant_id, program_id, code)
  select ('5c300000-0000-0000-0000-00000000000' || n)::uuid, current_setting('test.tenant')::uuid,
    '5c100000-0000-0000-0000-000000000001', 'R' || n
  from generate_series(1, 4) n;
insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type)
  select ('5c400000-0000-0000-0000-00000000000' || n)::uuid, current_setting('test.tenant')::uuid,
    ('5c300000-0000-0000-0000-00000000000' || n)::uuid, 1, 'Requirement ' || n,
    'The element does what it must.', 'It is recorded.', 'security'
  from generate_series(1, 4) n;
insert into public.security_processes(id, tenant_id, program_id, code, name)
  values ('5c500000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid,
    '5c100000-0000-0000-0000-000000000001', 'PROC', 'Configuration management');
insert into public.requirement_allocations(tenant_id, requirement_revision_id, system_id) values
  (current_setting('test.tenant')::uuid, '5c400000-0000-0000-0000-000000000001', '5c200000-0000-0000-0000-00000000000b'),
  (current_setting('test.tenant')::uuid, '5c400000-0000-0000-0000-000000000001', '5c200000-0000-0000-0000-00000000000a'),
  (current_setting('test.tenant')::uuid, '5c400000-0000-0000-0000-000000000002', '5c200000-0000-0000-0000-0000000000e1'),
  (current_setting('test.tenant')::uuid, '5c400000-0000-0000-0000-000000000002', '5c200000-0000-0000-0000-0000000000e2'),
  (current_setting('test.tenant')::uuid, '5c400000-0000-0000-0000-000000000003', '5c200000-0000-0000-0000-0000000000e2');
insert into public.requirement_allocations(tenant_id, requirement_revision_id, security_process_id) values
  (current_setting('test.tenant')::uuid, '5c400000-0000-0000-0000-000000000004', '5c500000-0000-0000-0000-000000000001');

-- ---------------------------------------------------------------------------------------------
-- Each element's counts, against the baselines' own selections.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  v_small integer; v_medium integer; v_large integer; v_union integer;
  v_got jsonb; v_want jsonb;
begin
  select count(*) into v_small from public.selected_controls where profile_resolution_id = current_setting('test.small')::uuid;
  select count(*) into v_medium from public.selected_controls where profile_resolution_id = current_setting('test.medium')::uuid;
  select count(*) into v_large from public.selected_controls where profile_resolution_id = current_setting('test.large')::uuid;
  select count(distinct control_id) into v_union from public.selected_controls
    where profile_resolution_id in (current_setting('test.small')::uuid, current_setting('test.medium')::uuid);
  select jsonb_object_agg(s.code, jsonb_build_array(c.control_count, c.subtree_control_count,
      c.additional_child_control_count, c.unresolved_descendant_count, c.requirement_count,
      c.subtree_requirement_count))
    into v_got
  from public.program_system_counts('5c100000-0000-0000-0000-000000000001') c
  join public.systems s on s.id = c.system_id;
  -- [controls, inside, more inside, inside without a baseline, requirements, inside]
  v_want := jsonb_build_object(
    -- B has no baseline; inside it E1, E2 and E3 select the small and medium baselines' controls,
    -- each once, and E4 has none. N and N1 are another boundary's. R1, R2 and R3, each once.
    'B', jsonb_build_array(null, v_union, v_union, 1, 1, 3),
    'E1', jsonb_build_array(v_small, v_small, 0, 0, 1, 2),
    'E2', jsonb_build_array(v_small, v_small, 0, 0, 2, 2),
    'E3', jsonb_build_array(v_medium, v_medium, 0, 0, 0, 0),
    -- No baseline here nor inside: nothing counted, not zero.
    'E4', jsonb_build_array(null, null, 0, 0, 0, 0),
    'N', jsonb_build_array(v_large, v_large, 0, 0, 1, 1),
    'N1', jsonb_build_array(v_large, v_large, 0, 0, 0, 0));
  if v_got is distinct from v_want then
    raise exception 'The counts: %, expected %', v_got, v_want;
  end if;
end $$;

-- R3, held by E2 already, and a fifth requirement on E3: each counts on E3, and B counts R3 once.
insert into public.engineering_requirements(id, tenant_id, program_id, code) values
  ('5c300000-0000-0000-0000-000000000005', current_setting('test.tenant')::uuid, '5c100000-0000-0000-0000-000000000001', 'R5');
insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type)
  values ('5c400000-0000-0000-0000-000000000005', current_setting('test.tenant')::uuid,
    '5c300000-0000-0000-0000-000000000005', 1, 'Requirement 5',
    'The element does what it must.', 'It is recorded.', 'security');
insert into public.requirement_allocations(tenant_id, requirement_revision_id, system_id) values
  (current_setting('test.tenant')::uuid, '5c400000-0000-0000-0000-000000000005', '5c200000-0000-0000-0000-0000000000e3'),
  (current_setting('test.tenant')::uuid, '5c400000-0000-0000-0000-000000000003', '5c200000-0000-0000-0000-0000000000e3');
do $$ begin
  if (select row(c.requirement_count, c.subtree_requirement_count)::text
      from public.program_system_counts('5c100000-0000-0000-0000-000000000001') c
      where c.system_id = '5c200000-0000-0000-0000-0000000000e3') is distinct from '(2,2)' then
    raise exception 'E3 counts its two requirements';
  end if;
  -- B: R1, R2, R3 and R5, each once however many elements inside hold it.
  if (select c.subtree_requirement_count from public.program_system_counts('5c100000-0000-0000-0000-000000000001') c
      where c.system_id = '5c200000-0000-0000-0000-00000000000b') is distinct from 4 then
    raise exception 'B counts every revision inside it once';
  end if;
  -- A program with no elements, or none the reader can read, has none.
  if exists (select 1 from public.program_system_counts('5c100000-0000-0000-0000-0000000000ff')) then
    raise exception 'A program that does not exist has elements';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- The Evidence picker's view: a version with its artifact's title, kind, program and owner, where
-- the artifact belongs, and whether the version records where its content is.
-- ---------------------------------------------------------------------------------------------
insert into public.parties(id, tenant_id, party_type, name) values
  ('5c600000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'person', 'Rollback evidence owner');
insert into public.evidence_artifacts(id, tenant_id, title, artifact_kind, program_id, owner_party_id) values
  ('5c700000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'Rollback program report', 'test_record', '5c100000-0000-0000-0000-000000000001', '5c600000-0000-0000-0000-000000000001'),
  ('5c700000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'Rollback workspace policy', 'document', null, null);
insert into public.evidence_versions(id, tenant_id, artifact_id, version_number, state, external_uri, collected_at) values
  ('5c800000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, '5c700000-0000-0000-0000-000000000001', 1, 'published', 'https://example.test/evidence/report', '2026-11-01T00:00:00Z'),
  ('5c800000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, '5c700000-0000-0000-0000-000000000002', 1, 'draft', null, null),
  ('5c800000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, '5c700000-0000-0000-0000-000000000002', 2, 'draft', '', null);
do $$
declare v_rows jsonb;
begin
  select jsonb_object_agg(v.id, jsonb_build_array(v.artifact_id, v.title, v.artifact_kind, v.program_id,
      v.owner_party_id, v.owner_name, v.version_number, v.state, v.collected_at, v.context, v.source_recorded))
    into v_rows
  from public.evidence_version_rows v
  where v.tenant_id = current_setting('test.tenant')::uuid;
  if v_rows is distinct from jsonb_build_object(
    '5c800000-0000-0000-0000-000000000001', jsonb_build_array('5c700000-0000-0000-0000-000000000001',
      'Rollback program report', 'test_record', '5c100000-0000-0000-0000-000000000001',
      '5c600000-0000-0000-0000-000000000001', 'Rollback evidence owner', 1, 'published',
      '2026-11-01T00:00:00Z'::timestamptz, 'program', true),
    '5c800000-0000-0000-0000-000000000002', jsonb_build_array('5c700000-0000-0000-0000-000000000002',
      'Rollback workspace policy', 'document', null, null, null, 1, 'draft', null, 'workspace', false),
    -- An empty reference records no source, as the picker's empty state counted it on screen.
    '5c800000-0000-0000-0000-000000000003', jsonb_build_array('5c700000-0000-0000-0000-000000000002',
      'Rollback workspace policy', 'document', null, null, null, 2, 'draft', null, 'workspace', false)) then
    raise exception 'The versions read: %', v_rows;
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Another workspace's member and an anonymous session read none of either.
-- ---------------------------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '5c000000-0000-0000-0000-000000000002', true);
do $$ begin
  if exists (select 1 from public.program_system_counts('5c100000-0000-0000-0000-000000000001')) then
    raise exception 'Another workspace reads the counts';
  end if;
  if exists (select 1 from public.evidence_version_rows where tenant_id = current_setting('test.tenant')::uuid) then
    raise exception 'Another workspace reads the versions';
  end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform public.program_system_counts('5c100000-0000-0000-0000-000000000001');
    raise exception 'An anonymous session read the counts';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.evidence_version_rows;
    raise exception 'An anonymous session read the versions';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

rollback;
