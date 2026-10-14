-- Record-backed workbooks project canonical assurance records. Workbook documents hold the
-- reader's analysis, formulas and layout; applying canonical edits is a separate atomic command.
create view public.requirement_workbook_rows with (security_invoker = true) as
select r.*, r.revision_id as content_id, c.revision, c.acceptance_criteria, c.rationale,
  c.updated_at,
  (select count(*) from public.requirement_evidence e
    where e.tenant_id = r.tenant_id and e.requirement_revision_id = r.revision_id) as evidence_count,
  (select count(*) from public.requirement_verifications v
    where v.tenant_id = r.tenant_id and v.requirement_revision_id = r.revision_id) as verification_count
from public.program_requirement_rows r
left join public.requirement_revisions c on c.tenant_id = r.tenant_id and c.id = r.revision_id;

create view public.program_sctm_rows with (security_invoker = true) as
select l.id, l.tenant_id, r.program_id, l.revision, r.id as requirement_id,
  r.code as requirement_code, c.id as content_id, c.title as requirement_title,
  l.control_id, ctrl.catalog_revision_id, ctrl.code as control_code, ctrl.title as control_title,
  l.control_part_id, part.name as part_name, part.prose as control_part_prose,
  l.system_id, s.code as system_code, s.name as system_name, l.selected_control_id,
  l.relationship_type, l.rationale, l.updated_at,
  case when l.system_id is null then 'No explicit system context'
    when s.id is null then 'System unavailable' else s.code || ' · ' || s.name end as scope_label,
  b.profile_resolution_id, b.source_system_id as baseline_source_system_id,
  b.source_label as baseline_source, b.inherited as baseline_inherited,
  coalesce(l.control_part_id is not null and not public.is_control_statement(l.control_part_id), false)
    or (l.system_id is not null and (
      sc.id is null or sc.profile_resolution_id is distinct from b.profile_resolution_id
      or not exists (select 1 from public.requirement_allocations a
        where a.tenant_id = l.tenant_id and a.requirement_revision_id = l.requirement_revision_id
          and a.system_id = l.system_id))) as needs_review
from public.requirement_control_links l
join public.requirement_revisions c on c.tenant_id = l.tenant_id and c.id = l.requirement_revision_id
join public.engineering_requirements r on r.tenant_id = c.tenant_id and r.id = c.engineering_requirement_id
left join public.controls ctrl on ctrl.id = l.control_id
left join public.control_parts part on part.id = l.control_part_id
left join public.systems s on s.tenant_id = l.tenant_id and s.id = l.system_id
left join public.selected_controls sc on sc.id = l.selected_control_id
left join public.system_effective_baselines b on b.tenant_id = l.tenant_id and b.system_id = l.system_id
where not exists (select 1 from public.requirement_revisions newer
  where newer.tenant_id = c.tenant_id and newer.engineering_requirement_id = c.engineering_requirement_id
    and newer.version_number > c.version_number);

revoke all on public.requirement_workbook_rows, public.program_sctm_rows from public, anon;
grant select on public.requirement_workbook_rows, public.program_sctm_rows to authenticated;
comment on view public.program_sctm_rows is 'Current requirement-to-control mapping records. Missing system context never asserts applicability to every system. Mapping does not assert implementation or assessment success.';

create table public.assurance_workbooks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  program_id uuid not null,
  name text not null check (length(btrim(name)) between 1 and 200),
  document jsonb not null default '{}'::jsonb
    check (jsonb_typeof(document) = 'object' and octet_length(document::text) <= 5000000),
  schema_version integer not null default 1 check (schema_version = 1),
  unique (tenant_id, id),
  unique (tenant_id, program_id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id)
);
select public.apply_tenant_security('assurance_workbooks');
select public.attach_record_lifecycle('assurance_workbooks', false);
-- Compare-and-swap and request receipts belong to the command, including the first save.
revoke insert, update, delete on public.assurance_workbooks from authenticated;
comment on column public.assurance_workbooks.document is 'Versioned workbook layout, formulas, analysis sheets and source bindings. Canonical assurance fields remain in their domain tables. Any embedded source data is an explicitly captured read-only snapshot.';

create table public.assurance_workbook_requests (
  tenant_id uuid not null references public.tenants(id),
  id uuid not null,
  program_id uuid not null,
  operation text not null check (operation in ('apply', 'save')),
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  result jsonb not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id)
);
alter table public.assurance_workbook_requests enable row level security;
revoke all on public.assurance_workbook_requests from public, anon, authenticated;

-- All projected arrays are read under one database snapshot. Never hand a formula engine a
-- current page and call it the complete program. The cap refuses, never truncates, a sheet.
create function public.read_assurance_workbook(p_tenant_id uuid, p_program_id uuid, p_row_limit integer default 10000)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  result jsonb;
  sizes jsonb;
  sheets jsonb;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace read access is required' using errcode = '42501';
  end if;
  if p_row_limit is null or p_row_limit not between 1 and 10000 then
    raise exception 'Choose a workbook row limit between 1 and 10000' using errcode = '23514';
  end if;
  if not exists (select 1 from public.programs where tenant_id = p_tenant_id and id = p_program_id) then
    raise exception 'The program is unavailable in this workspace' using errcode = '23514';
  end if;
  -- Each array is capped at limit + 1 solely to detect overflow without allocating an unbounded
  -- document. An overflow raises below before any partial snapshot leaves the database.
  select jsonb_build_object(
    'requirements', coalesce((select jsonb_agg(to_jsonb(x) order by x.tree_order, x.id) from (
      select * from public.requirement_workbook_rows where tenant_id = p_tenant_id and program_id = p_program_id
      order by tree_order, id limit p_row_limit + 1) x), '[]'::jsonb),
    'mappings', coalesce((select jsonb_agg(to_jsonb(x) order by x.requirement_code, x.control_code, x.id) from (
      select * from public.program_sctm_rows where tenant_id = p_tenant_id and program_id = p_program_id
      order by requirement_code, control_code, id limit p_row_limit + 1) x), '[]'::jsonb),
    'allocations', coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from (
      select a.id, a.revision, r.id as requirement_id, r.code as requirement_code,
        r.content_id, a.system_id, s.code as system_code, s.name as system_name,
        a.provider_capability_id, a.security_process_id, a.rationale
      from public.requirement_allocations a
      join public.requirement_workbook_rows r on r.tenant_id = a.tenant_id and r.content_id = a.requirement_revision_id
      left join public.systems s on s.tenant_id = a.tenant_id and s.id = a.system_id
      where r.tenant_id = p_tenant_id and r.program_id = p_program_id
      order by a.id limit p_row_limit + 1) x), '[]'::jsonb),
    'evidence', coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from (
      select e.id, e.revision, r.id as requirement_id, r.code as requirement_code, r.content_id,
        e.evidence_version_id, e.claim, e.applicability_rationale, v.artifact_id,
        v.version_number, v.state, a.title as artifact_title
      from public.requirement_evidence e
      join public.requirement_workbook_rows r on r.tenant_id = e.tenant_id and r.content_id = e.requirement_revision_id
      join public.evidence_versions v on v.tenant_id = e.tenant_id and v.id = e.evidence_version_id
      join public.evidence_artifacts a on a.tenant_id = v.tenant_id and a.id = v.artifact_id
      where r.tenant_id = p_tenant_id and r.program_id = p_program_id
      order by e.id limit p_row_limit + 1) x), '[]'::jsonb),
    'systems', coalesce((select jsonb_agg(to_jsonb(x) order by x.code, x.id) from (
      select s.id, s.code, s.name, s.system_type, s.parent_system_id, b.profile_resolution_id,
        b.source_system_id, b.inherited, b.source_label
      from public.systems s
      left join public.system_effective_baselines b on b.tenant_id = s.tenant_id and b.system_id = s.id
      where s.tenant_id = p_tenant_id and s.program_id = p_program_id
      order by s.code, s.id limit p_row_limit + 1) x), '[]'::jsonb),
    'owners', coalesce((select jsonb_agg(to_jsonb(x) order by x.name, x.id) from (
      select id, name from public.parties where tenant_id = p_tenant_id order by name, id limit p_row_limit + 1) x), '[]'::jsonb),
    'selectedControls', coalesce((select jsonb_agg(to_jsonb(x) order by x.system_id, x.control_code, x.id) from (
      select sc.id, s.id as system_id, sc.control_id, sc.profile_resolution_id,
        c.code as control_code, c.title as control_title, c.catalog_revision_id
      from public.systems s
      join public.system_effective_baselines b on b.tenant_id = s.tenant_id and b.system_id = s.id
      join public.selected_controls sc on sc.profile_resolution_id = b.profile_resolution_id
      join public.controls c on c.id = sc.control_id
      where s.tenant_id = p_tenant_id and s.program_id = p_program_id
      order by s.id, c.code, sc.id limit p_row_limit + 1) x), '[]'::jsonb)
  ) into sheets;
  if exists (select 1 from jsonb_each(sheets) where jsonb_array_length(value) > p_row_limit) then
    raise exception 'This program exceeds the complete workbook limit of % rows per sheet. Use the paged registers or narrow the program before loading a workbook.', p_row_limit
      using errcode = '54000';
  end if;
  select jsonb_object_agg(key, jsonb_array_length(value)) into sizes from jsonb_each(sheets);
  result := sheets || jsonb_build_object('complete', true, 'programId', p_program_id,
    'capturedAt', statement_timestamp(), 'counts', sizes,
    'workbook', (select to_jsonb(w) from public.assurance_workbooks w
      where tenant_id = p_tenant_id and program_id = p_program_id));
  return result;
end;
$$;

create function public.apply_assurance_changes(
  p_tenant_id uuid, p_program_id uuid, p_request_id uuid,
  p_requirements jsonb default '[]'::jsonb, p_mappings jsonb default '[]'::jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  receipt public.assurance_workbook_requests;
  payload_hash text;
  change jsonb;
  patch jsonb;
  answer jsonb;
  requirement_results jsonb := '[]'::jsonb;
  mapping_results jsonb := '[]'::jsonb;
  mapping public.requirement_control_links;
  previous_mapping jsonb;
  content_id uuid;
  requirement_id uuid;
  mapping_id uuid;
  expected bigint;
  action text;
  relationship text;
  rationale_value text;
  changed boolean;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'Your workspace role cannot apply assurance changes' using errcode = '42501';
  end if;
  if p_request_id is null or p_program_id is null
    or jsonb_typeof(p_requirements) is distinct from 'array' or jsonb_typeof(p_mappings) is distinct from 'array' then
    raise exception 'Enter a valid assurance change set' using errcode = '23514';
  end if;
  if jsonb_array_length(p_requirements) + jsonb_array_length(p_mappings) not between 1 and 1000
    or octet_length(p_requirements::text) + octet_length(p_mappings::text) > 5000000 then
    raise exception 'Apply between 1 and 1000 records, no more than 5 MB, in one change set' using errcode = '23514';
  end if;
  if exists (select 1 from jsonb_array_elements(p_requirements) x group by x->>'requirementId' having count(*) > 1)
    or exists (select 1 from jsonb_array_elements(p_mappings) x group by x->>'id' having count(*) > 1) then
    raise exception 'Combine each record into one change before applying' using errcode = '23514';
  end if;
  payload_hash := encode(extensions.digest(jsonb_build_object('programId', p_program_id,
    'requirements', p_requirements, 'mappings', p_mappings)::text, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || '/assurance-workbook/' || p_request_id::text, 0));
  select * into receipt from public.assurance_workbook_requests where tenant_id = p_tenant_id and id = p_request_id;
  if found then
    if receipt.created_by <> auth.uid() or receipt.operation <> 'apply' or receipt.payload_sha256 <> payload_hash then
      raise exception 'This request already saved different changes. Review before applying again.' using errcode = 'PT409';
    end if;
    return receipt.result;
  end if;
  perform 1 from public.programs where tenant_id = p_tenant_id and id = p_program_id for no key update;
  if not found then raise exception 'The program is unavailable in this workspace' using errcode = '23514'; end if;
  -- Stable lock order; the existing requirement command takes the same program lock first.
  for change in select value from jsonb_array_elements(p_requirements) order by value->>'requirementId' loop
    if jsonb_typeof(change) is distinct from 'object'
      or (change - 'requirementId' - 'contentId' - 'expectedRevision' - 'patch') <> '{}'::jsonb
      or not (change ?& array['requirementId','contentId','expectedRevision','patch']) then
      raise exception 'Enter a requirement identity, current content, revision and authored patch' using errcode = '23514';
    end if;
    requirement_id := (change->>'requirementId')::uuid;
    if not exists (select 1 from public.engineering_requirements
      where tenant_id = p_tenant_id and id = requirement_id and program_id = p_program_id) then
      raise exception 'Every changed requirement must belong to this program' using errcode = '23514';
    end if;
    -- Child receipt IDs are internal to this outer idempotent transaction. A rollback removes all
    -- of them together; an exact outer retry returns the stored result without another edit.
    answer := public.edit_requirement(p_tenant_id, gen_random_uuid(), requirement_id,
      (change->>'contentId')::uuid, (change->>'expectedRevision')::bigint, change->'patch');
    requirement_results := requirement_results || jsonb_build_array(answer);
  end loop;
  for change in select value from jsonb_array_elements(p_mappings) order by value->>'id' loop
    if jsonb_typeof(change) is distinct from 'object' then
      raise exception 'Enter a valid control mapping change' using errcode = '23514';
    end if;
    mapping_id := (change->>'id')::uuid;
    action := change->>'operation';
    if mapping_id is null or action is null or action not in ('create','update','delete') then
      raise exception 'Choose create, update or delete and a stable mapping ID' using errcode = '23514';
    end if;
    previous_mapping := null;
    if action = 'create' then
      if (change - 'operation' - 'id' - 'contentId' - 'controlId' - 'controlPartId' - 'systemId' - 'selectedControlId' - 'relationshipType' - 'rationale') <> '{}'::jsonb
        or not (change ?& array['contentId','controlId','systemId','selectedControlId','relationshipType']) then
        raise exception 'A new mapping needs a requirement, allocated system and selected control' using errcode = '23514';
      end if;
      content_id := (change->>'contentId')::uuid;
      if content_id is null or nullif(change->>'systemId','') is null or nullif(change->>'selectedControlId','') is null then
        raise exception 'Choose an explicit allocated system and selected control for a new mapping' using errcode = '23514';
      end if;
    else
      if (change - 'operation' - 'id' - 'expectedRevision' - 'patch') <> '{}'::jsonb
        or not (change ? 'expectedRevision') then
        raise exception 'An existing mapping needs the revision you reviewed' using errcode = '23514';
      end if;
      expected := (change->>'expectedRevision')::bigint;
      select * into mapping from public.requirement_control_links
        where tenant_id = p_tenant_id and id = mapping_id for update;
      if not found or expected is null or mapping.revision <> expected then
        raise exception 'A control mapping changed in another session. Your changes were not applied.' using errcode = 'PT409';
      end if;
      content_id := mapping.requirement_revision_id;
      previous_mapping := to_jsonb(mapping);
    end if;
    if not exists (select 1 from public.requirement_revisions c
      join public.engineering_requirements r on r.tenant_id = c.tenant_id and r.id = c.engineering_requirement_id
      where c.tenant_id = p_tenant_id and c.id = content_id and r.program_id = p_program_id
        and not exists (select 1 from public.requirement_revisions newer
          where newer.tenant_id = c.tenant_id and newer.engineering_requirement_id = c.engineering_requirement_id
            and newer.version_number > c.version_number)) then
      raise exception 'Every mapping must belong to a current requirement in this program' using errcode = '23514';
    end if;
    if action = 'delete' then
      if change ? 'patch' then raise exception 'A removed mapping takes no patch' using errcode = '23514'; end if;
      delete from public.requirement_control_links where tenant_id = p_tenant_id and id = mapping_id;
      mapping_results := mapping_results || jsonb_build_array(jsonb_build_object(
        'id', mapping_id, 'operation', action, 'revision', null, 'changed', true,
        'before', previous_mapping, 'after', null));
      continue;
    end if;
    patch := case when action = 'create' then change else change->'patch' end;
    if action = 'update' and (jsonb_typeof(patch) is distinct from 'object'
      or (patch - 'relationshipType' - 'rationale') <> '{}'::jsonb) then
      raise exception 'Only the relationship and rationale change in a mapping patch' using errcode = '23514';
    end if;
    if patch ? 'relationshipType' and (jsonb_typeof(patch->'relationshipType') is distinct from 'string'
      or patch->>'relationshipType' not in ('derived_from','maps_to','satisfies')) then
      raise exception 'Choose an available mapping relationship' using errcode = '23514';
    end if;
    if patch ? 'rationale' and jsonb_typeof(patch->'rationale') not in ('string','null') then
      raise exception 'Enter a text rationale' using errcode = '23514';
    end if;
    relationship := case when patch ? 'relationshipType' then patch->>'relationshipType' else mapping.relationship_type end;
    rationale_value := case when patch ? 'rationale' then nullif(btrim(patch->>'rationale'),'')
      when action = 'create' then null else mapping.rationale end;
    if length(rationale_value) > 10000 then raise exception 'Keep a mapping rationale under 10000 characters' using errcode = '23514'; end if;
    changed := true;
    if action = 'create' then
      insert into public.requirement_control_links(id, tenant_id, requirement_revision_id, control_id,
        control_part_id, system_id, selected_control_id, relationship_type, rationale)
      values (mapping_id, p_tenant_id, content_id, (change->>'controlId')::uuid,
        (change->>'controlPartId')::uuid, (change->>'systemId')::uuid, (change->>'selectedControlId')::uuid,
        relationship, rationale_value) returning * into mapping;
    else
      changed := (mapping.relationship_type, mapping.rationale) is distinct from (relationship, rationale_value);
      if changed then
        update public.requirement_control_links set relationship_type = relationship, rationale = rationale_value,
          revision = mapping.revision + 1 where tenant_id = p_tenant_id and id = mapping_id returning * into mapping;
      end if;
    end if;
    mapping_results := mapping_results || jsonb_build_array(jsonb_build_object(
      'id', mapping.id, 'operation', action, 'revision', mapping.revision, 'changed', changed,
      'before', previous_mapping, 'after', to_jsonb(mapping)));
  end loop;
  answer := jsonb_build_object('requestId', p_request_id, 'requirements', requirement_results, 'mappings', mapping_results);
  insert into public.assurance_workbook_requests(tenant_id, id, program_id, operation, payload_sha256, result, created_by)
    values (p_tenant_id, p_request_id, p_program_id, 'apply', payload_hash, answer, auth.uid());
  return answer;
end;
$$;

create function public.save_assurance_workbook(
  p_tenant_id uuid, p_program_id uuid, p_request_id uuid, p_workbook_id uuid,
  p_expected_revision bigint, p_name text, p_document jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  receipt public.assurance_workbook_requests;
  workbook public.assurance_workbooks;
  payload_hash text;
  answer jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'Your workspace role cannot save a workbook' using errcode = '42501';
  end if;
  if p_request_id is null or p_workbook_id is null or p_program_id is null
    or p_expected_revision is null or p_expected_revision < 0
    or p_name is null or length(btrim(p_name)) not between 1 and 200
    or jsonb_typeof(p_document) is distinct from 'object' or octet_length(p_document::text) > 5000000 then
    raise exception 'Enter a workbook name and document under 5 MB with its expected revision' using errcode = '23514';
  end if;
  payload_hash := encode(extensions.digest(jsonb_build_object('programId', p_program_id,
    'workbookId', p_workbook_id, 'revision', p_expected_revision, 'name', btrim(p_name),
    'document', p_document)::text, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || '/assurance-workbook/' || p_request_id::text, 0));
  select * into receipt from public.assurance_workbook_requests where tenant_id = p_tenant_id and id = p_request_id;
  if found then
    if receipt.created_by <> auth.uid() or receipt.operation <> 'save' or receipt.payload_sha256 <> payload_hash then
      raise exception 'This request already saved a different workbook. Review before saving again.' using errcode = 'PT409';
    end if;
    return receipt.result;
  end if;
  perform 1 from public.programs where tenant_id = p_tenant_id and id = p_program_id for no key update;
  if not found then raise exception 'The program is unavailable in this workspace' using errcode = '23514'; end if;
  select * into workbook from public.assurance_workbooks
    where tenant_id = p_tenant_id and program_id = p_program_id for update;
  if found then
    if workbook.id <> p_workbook_id or workbook.revision <> p_expected_revision then
      raise exception 'This workbook changed in another session. Reload before saving your changes.' using errcode = 'PT409';
    end if;
    if (workbook.name, workbook.document) is distinct from (btrim(p_name), p_document) then
      update public.assurance_workbooks set name = btrim(p_name), document = p_document, revision = workbook.revision + 1
        where tenant_id = p_tenant_id and id = p_workbook_id returning * into workbook;
    end if;
  else
    if p_expected_revision <> 0 then raise exception 'The workbook no longer exists. Review before creating it again.' using errcode = 'PT409'; end if;
    insert into public.assurance_workbooks(id, tenant_id, program_id, name, document)
      values (p_workbook_id, p_tenant_id, p_program_id, btrim(p_name), p_document) returning * into workbook;
  end if;
  answer := jsonb_build_object('id', workbook.id, 'revision', workbook.revision, 'updatedAt', workbook.updated_at);
  insert into public.assurance_workbook_requests(tenant_id, id, program_id, operation, payload_sha256, result, created_by)
    values (p_tenant_id, p_request_id, p_program_id, 'save', payload_hash, answer, auth.uid());
  return answer;
end;
$$;

revoke all on function public.read_assurance_workbook(uuid, uuid, integer),
  public.apply_assurance_changes(uuid, uuid, uuid, jsonb, jsonb),
  public.save_assurance_workbook(uuid, uuid, uuid, uuid, bigint, text, jsonb) from public, anon;
grant execute on function public.read_assurance_workbook(uuid, uuid, integer),
  public.apply_assurance_changes(uuid, uuid, uuid, jsonb, jsonb),
  public.save_assurance_workbook(uuid, uuid, uuid, uuid, bigint, text, jsonb) to authenticated;
