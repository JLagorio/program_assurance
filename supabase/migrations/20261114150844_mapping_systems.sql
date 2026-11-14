-- Requirement mappings name their systems, and the old ones are filled in from their requirements'
-- allocations (Josef, 2026-11-14: "Name systems, fill old").
--
-- Since 20261114072913_every_system_counts a control is covered only once it is covered on every
-- authorization boundary of the program whose control baseline selects it: a mapping counts on the
-- boundary of the system it names, an element's on its boundary, and a mapping that names no system
-- on every system. Map a requirement writes one mapping on each system the requirement is allocated
-- to whose control baseline selects the control, but the demo seeds and the September catalog
-- references wrote none (661 of WS-X90's 667 mappings named no system), so for them every system
-- counted the same as before.
--
-- name_requirement_mapping_systems places a mapping that names no system as Map a requirement
-- places one: on each system its requirement's latest revision is allocated to (a boundary, or an
-- element inside one, which counts on its boundary) whose effective control baseline selects the
-- control, by the selection that baseline records (system_effective_baselines, the guard's own
-- test). The mapping itself takes the first such system in code order, and each other system takes
-- a new mapping with the same requirement revision, control, part, relationship and rationale; a
-- system that holds the same mapping already is passed over. No mapping is deleted. A mapping it
-- cannot place keeps no system, and so still counts on every system, and is counted by why:
--
--   historical    on a requirement revision a newer one replaced, whose content cannot change
--   notATarget    it names a part that is neither a statement nor an objective of the control (an
--                 assessment method, recorded before the guard), which the guard refuses to move
--   unallocated   its requirement is allocated to nothing
--   processOnly   its requirement is allocated only to security processes or provider capabilities
--   notSelected   its requirement is allocated to systems none of whose baselines selects the
--                 control: a mapping names a system only by the selection that system's baseline
--                 records, and none records one
--   held          every system it could name holds the same mapping already
--
-- A mapping a seed wrote (demo_import_records) takes its new rows into the seed's batch: each listed
-- from the same source and pointer, keyed by the mapping's key and the system, and the batch's
-- summary counts the mappings the batch lists (tables.requirement_control_links) and what was named
-- (systemsNamed), so whatever removes the batch's records removes them too. The seeds call it at the
-- end of their transaction (scripts/demo/database.mjs for seed:demo, scripts/seed-demo-products.mjs),
-- so a fresh seed's mappings name their systems. It is internal: no client may call it.
--
-- The migration runs it once over every workspace; a further run changes nothing.

create or replace function public.name_requirement_mapping_systems(
  p_tenant_id uuid default null,
  p_mapping_ids uuid[] default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_answer jsonb;
begin
  create temporary table mapping_system_candidates (
    mapping_id uuid primary key,
    tenant_id uuid not null,
    requirement_revision_id uuid not null,
    control_id uuid not null,
    control_part_id uuid,
    relationship_type text not null,
    rationale text,
    latest boolean not null,
    target boolean not null,
    allocated integer not null,
    elsewhere integer not null,
    selecting integer not null,
    open integer not null
  ) on commit drop;
  create temporary table mapping_system_targets (
    mapping_id uuid not null,
    tenant_id uuid not null,
    system_id uuid not null,
    selected_control_id uuid not null,
    position integer not null,
    new_id uuid not null,
    primary key (mapping_id, system_id)
  ) on commit drop;

  insert into pg_temp.mapping_system_candidates
  select l.id, l.tenant_id, l.requirement_revision_id, l.control_id, l.control_part_id,
    l.relationship_type, l.rationale,
    not exists (select 1 from public.requirement_revisions n
      where n.tenant_id = v.tenant_id and n.engineering_requirement_id = v.engineering_requirement_id
        and n.version_number > v.version_number),
    l.control_part_id is null
      or public.is_requirement_control_statement(l.control_part_id, l.control_id)
      or public.is_control_assessment_objective(l.control_part_id, l.control_id),
    0, 0, 0, 0
  from public.requirement_control_links l
  join public.requirement_revisions v on v.tenant_id = l.tenant_id and v.id = l.requirement_revision_id
  where l.system_id is null
    and (p_tenant_id is null or l.tenant_id = p_tenant_id)
    and (p_mapping_ids is null or l.id = any(p_mapping_ids));

  -- Each system the requirement's revision is allocated to whose control baseline selects the
  -- control, by the selection that baseline records, and whether the same mapping is there already.
  with eligible as (
    select c.mapping_id, c.tenant_id, s.id as system_id, s.code, sc.id as selected_control_id,
      exists (select 1 from public.requirement_control_links x
        where x.tenant_id = c.tenant_id and x.requirement_revision_id = c.requirement_revision_id
          and x.control_id = c.control_id and x.control_part_id is not distinct from c.control_part_id
          and x.system_id = s.id and x.relationship_type = c.relationship_type) as held
    from pg_temp.mapping_system_candidates c
    join public.requirement_revisions v on v.tenant_id = c.tenant_id and v.id = c.requirement_revision_id
    join public.engineering_requirements q on q.tenant_id = v.tenant_id and q.id = v.engineering_requirement_id
    join public.requirement_allocations a on a.tenant_id = c.tenant_id and a.requirement_revision_id = c.requirement_revision_id
    join public.systems s on s.tenant_id = a.tenant_id and s.id = a.system_id and s.program_id = q.program_id
    join public.system_effective_baselines b on b.tenant_id = s.tenant_id and b.system_id = s.id
    join public.selected_controls sc on sc.profile_resolution_id = b.profile_resolution_id and sc.control_id = c.control_id
    where c.latest and c.target
  )
  insert into pg_temp.mapping_system_targets
  select e.mapping_id, e.tenant_id, e.system_id, e.selected_control_id,
    row_number() over (partition by e.mapping_id order by e.code collate "C", e.system_id)::integer,
    md5('requirement_control_links/' || e.mapping_id || '/' || e.system_id)::uuid
  from eligible e
  where not e.held;

  update pg_temp.mapping_system_candidates c set
    allocated = (select count(*) from public.requirement_allocations a
      where a.tenant_id = c.tenant_id and a.requirement_revision_id = c.requirement_revision_id and a.system_id is not null),
    elsewhere = (select count(*) from public.requirement_allocations a
      where a.tenant_id = c.tenant_id and a.requirement_revision_id = c.requirement_revision_id and a.system_id is null),
    selecting = (select count(*) from public.requirement_allocations a
      join public.system_effective_baselines b on b.tenant_id = a.tenant_id and b.system_id = a.system_id
      join public.selected_controls sc on sc.profile_resolution_id = b.profile_resolution_id and sc.control_id = c.control_id
      where a.tenant_id = c.tenant_id and a.requirement_revision_id = c.requirement_revision_id),
    open = (select count(*) from pg_temp.mapping_system_targets t where t.mapping_id = c.mapping_id);

  -- The mapping takes the first system; each other system takes a mapping of its own.
  update public.requirement_control_links l
    set system_id = t.system_id, selected_control_id = t.selected_control_id, revision = l.revision + 1
  from pg_temp.mapping_system_targets t
  where t.position = 1 and l.tenant_id = t.tenant_id and l.id = t.mapping_id;

  insert into public.requirement_control_links (id, tenant_id, requirement_revision_id, control_id,
    control_part_id, system_id, selected_control_id, relationship_type, rationale)
  select t.new_id, c.tenant_id, c.requirement_revision_id, c.control_id, c.control_part_id,
    t.system_id, t.selected_control_id, c.relationship_type, c.rationale
  from pg_temp.mapping_system_targets t
  join pg_temp.mapping_system_candidates c on c.mapping_id = t.mapping_id
  where t.position > 1;

  -- A seeded mapping's new rows are the seed's too: listed under its batch, from its source.
  insert into public.demo_import_records (id, tenant_id, import_batch_id, dataset_id, destination_table,
    destination_id, source_key, source_pointer, source_sha256, source_record_id, mapped_values)
  select md5('demo_import_records/requirement_control_links/' || t.new_id)::uuid, r.tenant_id,
    r.import_batch_id, r.dataset_id, 'requirement_control_links', t.new_id,
    r.source_key || '/' || t.system_id, r.source_pointer, r.source_sha256, r.source_record_id,
    r.mapped_values
      || case when r.mapped_values ? 'id' then jsonb_build_object('id', t.new_id) else '{}'::jsonb end
      || jsonb_build_object('system_id', t.system_id, 'selected_control_id', t.selected_control_id)
  from pg_temp.mapping_system_targets t
  join public.demo_import_records r on r.tenant_id = t.tenant_id
    and r.destination_table = 'requirement_control_links' and r.destination_id = t.mapping_id
  where t.position > 1;

  update public.demo_import_batches b set summary = b.summary
    || jsonb_build_object('tables', coalesce(b.summary->'tables', '{}'::jsonb)
      || jsonb_build_object('requirement_control_links', (select count(*) from public.demo_import_records r
        where r.tenant_id = b.tenant_id and r.import_batch_id = b.id and r.destination_table = 'requirement_control_links')))
    || jsonb_build_object('systemsNamed', jsonb_build_object(
      'named', coalesce((b.summary->'systemsNamed'->>'named')::integer, 0) + n.named,
      'added', coalesce((b.summary->'systemsNamed'->>'added')::integer, 0) + n.added))
  from (
    select r.tenant_id, r.import_batch_id,
      count(*) filter (where t.position = 1) as named,
      count(*) filter (where t.position > 1) as added
    from pg_temp.mapping_system_targets t
    join public.demo_import_records r on r.tenant_id = t.tenant_id
      and r.destination_table = 'requirement_control_links' and r.destination_id = t.mapping_id
    group by r.tenant_id, r.import_batch_id
  ) n
  where b.tenant_id = n.tenant_id and b.id = n.import_batch_id;

  select jsonb_build_object(
    'named', count(*) filter (where c.open > 0),
    'added', coalesce(sum(greatest(c.open - 1, 0)), 0),
    'historical', count(*) filter (where not c.latest),
    'notATarget', count(*) filter (where c.latest and not c.target),
    'unallocated', count(*) filter (where c.latest and c.target and c.allocated = 0 and c.elsewhere = 0),
    'processOnly', count(*) filter (where c.latest and c.target and c.allocated = 0 and c.elsewhere > 0),
    'notSelected', count(*) filter (where c.latest and c.target and c.allocated > 0 and c.selecting = 0),
    'held', count(*) filter (where c.latest and c.target and c.selecting > 0 and c.open = 0)
  ) into v_answer
  from pg_temp.mapping_system_candidates c;
  drop table pg_temp.mapping_system_targets;
  drop table pg_temp.mapping_system_candidates;
  return v_answer;
end;
$$;

revoke all on function public.name_requirement_mapping_systems(uuid, uuid[]) from public, anon, authenticated;
comment on function public.name_requirement_mapping_systems(uuid, uuid[]) is 'Internal, for the migration and the demo seeds: places each mapping that names no system (of the workspace named, or of every workspace; of the mappings named, or of all) on each system its requirement''s latest revision is allocated to whose effective control baseline selects the control, by that baseline''s selection, as Map a requirement places one: the mapping takes the first such system in code order and each other system a new mapping with the same requirement revision, control, part, relationship and rationale, a system that holds the same mapping already passed over. A seeded mapping''s new rows are listed under its batch, from its source, and the batch''s summary counts them. A mapping it cannot place keeps no system. Answers how many it named (named), the mappings it added (added) and how many it left, by why: historical, notATarget, unallocated, processOnly, notSelected, held. Never deletes a mapping; a further run changes nothing.';

do $$
declare v_answer jsonb := public.name_requirement_mapping_systems();
begin
  raise notice 'Requirement mappings named their systems: %', v_answer;
end $$;
