-- The program roles seed's transaction body, loaded by scripts/seed-demo-roles.mjs. It defines
-- temporary objects only; the script calls pg_temp.seed_roles(payload), or
-- pg_temp.revert_roles(payload), inside its own transaction and commits (--apply) or rolls back.
--
-- The seed adds one kind of thing: a person in a role on a program (program_role_assignments),
-- listed in demo_import_records under the dataset `program-roles-v1`. It changes no record another
-- step wrote. An assignment the program already records (the same person in the same role) is
-- passed over and not listed, so the revert leaves it; a program that holds another authorizing
-- official or lead assessor stops the run (the one-holder guard says who), as does a person the
-- workspace does not hold exactly once. It runs once a workspace: a workspace that already holds
-- the dataset's batch changes nothing.

create temp table roles_tracked (
  destination_table text not null, destination_id uuid not null, source_key text not null, section text not null
) on commit drop;

-- A stable identity for a scenario record: the same workspace and key give the same id.
create function pg_temp.roles_id(p_tenant uuid, p_key text) returns uuid language sql immutable as $$
  select md5(p_tenant::text || '/program-roles-v1/' || p_key)::uuid
$$;

-- What program_roles answers for each program the scenario names, as the account: each role's
-- holders today by name, and whether the program records it.
create function pg_temp.roles_reads(p jsonb) returns jsonb language plpgsql as $$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_out jsonb := '{}'; v_code text; v_program uuid;
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p->>'accountUserId', 'role', 'authenticated')::text, true);
  for v_code in select value from jsonb_array_elements_text(p->'watchedPrograms') loop
    select g.id into v_program from public.programs g where g.tenant_id = t and g.code = v_code;
    if v_program is null then continue; end if;
    v_out := v_out || jsonb_build_object(v_code, (
      select coalesce(jsonb_object_agg(r.role, (select jsonb_agg(h->>'name') from jsonb_array_elements(r.holders) h)), '{}'::jsonb)
      from public.program_roles(v_program) r where r.recorded));
    v_out := v_out || jsonb_build_object(v_code || ' (the account)', (
      select coalesce(jsonb_agg(r.role order by r.role_rank), '[]'::jsonb) from public.program_reader_roles(v_program) r));
  end loop;
  perform set_config('request.jwt.claims', '', true);
  return v_out;
end $$;

create function pg_temp.seed_roles(p jsonb) returns jsonb language plpgsql as $seed$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_entry jsonb; v_program uuid; v_party uuid; v_count integer; v_id uuid; v_code text;
  v_written jsonb := '[]'; v_passed jsonb := '[]'; v_before jsonb; v_job uuid; v_batch uuid; v_tables jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(t::text || '/demo-roles', 0));
  if exists (select 1 from public.demo_import_batches where tenant_id = t and dataset_id = p->>'datasetId') then
    return jsonb_build_object('changed', false, 'reason', 'This workspace already holds the program roles scenario.');
  end if;
  v_before := pg_temp.roles_reads(p);
  for v_entry in select value from jsonb_array_elements(p->'assignments') loop
    select g.id into v_program from public.programs g where g.tenant_id = t and g.code = v_entry->>'program';
    if v_program is null then
      raise exception 'The program % is not in this workspace. Run npm run seed:demo first.', v_entry->>'program';
    end if;
    if coalesce((v_entry->>'account')::boolean, false) then
      select a.id into v_party from public.parties a where a.tenant_id = t and a.auth_user_id = (p->>'accountUserId')::uuid;
      if v_party is null then
        raise exception 'The account has no person in this workspace.';
      end if;
    else
      select count(*), min(a.id::text)::uuid into v_count, v_party from public.parties a
        where a.tenant_id = t and a.party_type = 'person' and a.name = v_entry->>'person';
      if v_count <> 1 then
        raise exception 'Expected one person named % in this workspace, found %.', v_entry->>'person', v_count;
      end if;
    end if;
    if exists (select 1 from public.program_role_assignments a
      where a.tenant_id = t and a.program_id = v_program and a.party_id = v_party and a.role = v_entry->>'role') then
      v_passed := v_passed || jsonb_build_array(v_entry->>'key');
      continue;
    end if;
    v_id := pg_temp.roles_id(t, 'program_role_assignments/' || (v_entry->>'key'));
    insert into public.program_role_assignments (id, tenant_id, program_id, party_id, role)
      values (v_id, t, v_program, v_party, v_entry->>'role');
    insert into roles_tracked values ('program_role_assignments', v_id, v_entry->>'key', 'programRoles');
    v_written := v_written || jsonb_build_array(v_entry->>'key');
  end loop;
  -- The program left with no role still has none.
  for v_code in select value from jsonb_array_elements_text(p->'leftEmpty') loop
    if exists (select 1 from public.program_role_assignments a join public.programs g on g.id = a.program_id
      where g.tenant_id = t and g.code = v_code) then
      raise exception 'The program % records a role, so no program would show one that records none.', v_code;
    end if;
  end loop;
  if not exists (select 1 from roles_tracked) then
    return jsonb_build_object('changed', false, 'reason', 'Every role the scenario names is recorded already; nothing was written.',
      'passedOver', v_passed);
  end if;

  v_job := pg_temp.roles_id(t, 'ingestion_jobs');
  insert into public.ingestion_jobs (id, tenant_id, title, source_uri, status, started_at, completed_at, summary)
    values (v_job, t, 'Program roles demo seed', 'urn:program-assurance:demo:' || (p->>'datasetId'), 'completed', now(), now(),
      'Authored program roles scenario: who holds RMF''s roles on the demo programs, by the names the demo data already uses (scripts/demo/roles-scenario.mjs).');
  select jsonb_object_agg(destination_table, n) into v_tables
    from (select destination_table, count(*) as n from roles_tracked group by destination_table) c;
  v_batch := pg_temp.roles_id(t, 'demo_import_batches');
  insert into public.demo_import_batches (id, tenant_id, ingestion_job_id, dataset_id, fixture_sha256, imported_at, source_manifest, summary)
    values (v_batch, t, v_job, p->>'datasetId', p->>'scenarioSha256', now(),
      jsonb_build_object('scenario', 'scripts/demo/roles-scenario.mjs'),
      jsonb_build_object('tables', v_tables, 'written', v_written, 'passedOver', v_passed));
  insert into public.demo_import_sources (id, tenant_id, import_batch_id, source_pointer, source_sha256, source_record)
    values (pg_temp.roles_id(t, 'demo_import_sources/programRoles'), t, v_batch, '/programRoles',
      encode(extensions.digest((p->'programRoles')::text, 'sha256'), 'hex'), p->'programRoles');
  insert into public.demo_import_records (id, tenant_id, import_batch_id, dataset_id, destination_table, destination_id, source_key, source_pointer, source_sha256, source_record_id, mapped_values)
  select pg_temp.roles_id(t, 'demo_import_records/' || k.destination_table || '/' || k.destination_id), t, v_batch, p->>'datasetId',
    k.destination_table, k.destination_id, k.source_key, '/' || k.section, s.source_sha256, s.id, jsonb_build_object('section', k.section)
  from roles_tracked k
  join public.demo_import_sources s on s.tenant_id = t and s.import_batch_id = v_batch and s.source_pointer = '/' || k.section;

  return jsonb_build_object(
    'changed', true,
    'tables', v_tables,
    'records', (select count(*) from roles_tracked),
    'written', v_written,
    'passedOver', v_passed,
    'reads', jsonb_build_object('before', v_before, 'after', pg_temp.roles_reads(p)));
end;
$seed$;

-- Undo the seed: remove the assignments it wrote and its provenance. An assignment of the seed's
-- that somebody changed since (another person, role or days) stops the revert, so nobody's later
-- edit is removed with it.
create function pg_temp.revert_roles(p jsonb) returns jsonb language plpgsql as $revert$
declare
  t uuid := (p->>'tenantId')::uuid;
  v_batch public.demo_import_batches; v_changed text; v_before jsonb; v_removed integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(t::text || '/demo-roles', 0));
  select * into v_batch from public.demo_import_batches where tenant_id = t and dataset_id = p->>'datasetId';
  if v_batch.id is null then
    return jsonb_build_object('changed', false, 'reason', 'This workspace does not hold the program roles scenario.');
  end if;
  v_before := pg_temp.roles_reads(p);
  select r.source_key into v_changed from public.demo_import_records r
    join public.program_role_assignments a on a.tenant_id = r.tenant_id and a.id = r.destination_id
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'program_role_assignments'
      and a.revision > 1
    order by r.source_key limit 1;
  if v_changed is not null then
    raise exception 'The role % changed since the seed wrote it; nothing was reverted.', v_changed;
  end if;
  delete from public.program_role_assignments a where a.tenant_id = t and a.id in (
    select r.destination_id from public.demo_import_records r
    where r.tenant_id = t and r.import_batch_id = v_batch.id and r.destination_table = 'program_role_assignments');
  get diagnostics v_removed = row_count;
  delete from public.demo_import_records r where r.tenant_id = t and r.import_batch_id = v_batch.id;
  delete from public.demo_import_sources s where s.tenant_id = t and s.import_batch_id = v_batch.id;
  delete from public.demo_import_batches b where b.id = v_batch.id;
  delete from public.ingestion_jobs j where j.tenant_id = t and j.id = v_batch.ingestion_job_id;
  return jsonb_build_object('changed', true, 'removed', v_removed,
    'reads', jsonb_build_object('before', v_before, 'after', pg_temp.roles_reads(p)));
end;
$revert$;
