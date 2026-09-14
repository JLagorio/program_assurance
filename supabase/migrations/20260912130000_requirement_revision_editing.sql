-- Requirement edits create an authored successor; activity stays visible in the
-- program stream while retaining exact source/destination revision pins.
alter table public.activity_events
  add column requirement_revision_id uuid,
  add column source_requirement_revision_id uuid,
  add column changes jsonb,
  add foreign key (tenant_id, requirement_revision_id) references public.requirement_revisions(tenant_id, id),
  add foreign key (tenant_id, source_requirement_revision_id) references public.requirement_revisions(tenant_id, id),
  add constraint requirement_activity_pins check (
    (requirement_revision_id is null and source_requirement_revision_id is null and changes is null)
    or (requirement_revision_id is not null and source_requirement_revision_id is not null
      and requirement_revision_id <> source_requirement_revision_id and program_id is not null
      and changes is not null and jsonb_typeof(changes) = 'object')
  );
comment on column public.activity_events.changes is 'Actual before/after authored values for a requirement revision edit, keyed by product field name. Empty object denotes an explicit unchanged draft clone.';

create function public.guard_requirement_activity_context() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.requirement_revision_id is not null and not exists (
    select 1 from public.requirement_revisions destination
    join public.requirement_revisions source on source.tenant_id = destination.tenant_id
      and source.engineering_requirement_id = destination.engineering_requirement_id
    join public.engineering_requirements er on er.tenant_id = destination.tenant_id and er.id = destination.engineering_requirement_id
    where destination.tenant_id = new.tenant_id and destination.id = new.requirement_revision_id
      and source.id = new.source_requirement_revision_id and er.program_id = new.program_id
      and destination.version_number = source.version_number + 1
  ) then
    raise exception 'Requirement activity must pin consecutive revisions of one requirement in its program' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_requirement_activity_context() from public, anon, authenticated;
create trigger requirement_context before insert on public.activity_events
  for each row execute function public.guard_requirement_activity_context();
-- Typed requirement audit entries are produced by the security-definer revision
-- RPC. Ordinary event writers cannot forge its actor, values or timestamps.
alter policy tenant_insert on public.activity_events with check (
  public.can_write_tenant(tenant_id) and requirement_revision_id is null
);

create table public.requirement_revision_requests (
  id uuid not null,
  tenant_id uuid not null references public.tenants(id),
  source_revision_id uuid,
  result_revision_id uuid,
  activity_event_id uuid,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (tenant_id, id),
  foreign key (tenant_id, source_revision_id) references public.requirement_revisions(tenant_id, id) on delete set null (source_revision_id),
  foreign key (tenant_id, result_revision_id) references public.requirement_revisions(tenant_id, id) on delete set null (result_revision_id),
  foreign key (tenant_id, activity_event_id) references public.activity_events(tenant_id, id)
);
alter table public.requirement_revision_requests enable row level security;
revoke all on public.requirement_revision_requests from public, anon, authenticated;
comment on table public.requirement_revision_requests is 'Private exact-retry receipts for authored requirement edits and explicit draft clones.';

-- Even a superseded draft is a historical snapshot. Keep generic record editing
-- and relationship endpoints from changing it after a successor exists.
create function public.guard_requirement_revision_history() returns trigger
language plpgsql security definer set search_path = '' as $$
declare program_uuid uuid;
begin
  if tg_op = 'INSERT' then
    select program_id into program_uuid from public.engineering_requirements
      where tenant_id = new.tenant_id and id = new.engineering_requirement_id;
    perform 1 from public.programs where tenant_id = new.tenant_id and id = program_uuid for update;
    perform 1 from public.engineering_requirements where tenant_id = new.tenant_id and id = new.engineering_requirement_id for update;
    return new;
  end if;
  if exists (select 1 from public.requirement_revisions where tenant_id = old.tenant_id
    and engineering_requirement_id = old.engineering_requirement_id and version_number > old.version_number) then
    raise exception 'Historical requirement revisions are immutable. Open the latest revision to make a new edit.' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.guard_requirement_revision_history() from public, anon, authenticated;
create trigger requirement_history before insert or update or delete on public.requirement_revisions
  for each row execute function public.guard_requirement_revision_history();

create function public.guard_requirement_content_history() returns trigger
language plpgsql security definer set search_path = '' as $$
declare parent_id uuid; parent public.requirement_revisions;
begin
  if tg_op <> 'INSERT' then
    parent_id := (to_jsonb(old)->>tg_argv[0])::uuid;
    select * into parent from public.requirement_revisions where id = parent_id for share;
    if exists (select 1 from public.requirement_revisions where tenant_id = parent.tenant_id
      and engineering_requirement_id = parent.engineering_requirement_id and version_number > parent.version_number) then
      raise exception 'Content of a historical requirement revision cannot change' using errcode = '23514';
    end if;
  end if;
  if tg_op <> 'DELETE' then
    parent_id := (to_jsonb(new)->>tg_argv[0])::uuid;
    select * into parent from public.requirement_revisions where id = parent_id for share;
    if exists (select 1 from public.requirement_revisions where tenant_id = parent.tenant_id
      and engineering_requirement_id = parent.engineering_requirement_id and version_number > parent.version_number) then
      raise exception 'Content cannot be attached to a historical requirement revision' using errcode = '23514';
    end if;
    return new;
  end if;
  return old;
end;
$$;
revoke all on function public.guard_requirement_content_history() from public, anon, authenticated;
create trigger requirement_history before insert or update or delete on public.requirement_decompositions for each row execute function public.guard_requirement_content_history('parent_requirement_revision_id');
create trigger requirement_history before insert or update or delete on public.requirement_control_links for each row execute function public.guard_requirement_content_history('requirement_revision_id');
create trigger requirement_history before insert or update or delete on public.requirement_allocations for each row execute function public.guard_requirement_content_history('requirement_revision_id');
create trigger requirement_history before insert or update or delete on public.requirement_implementations for each row execute function public.guard_requirement_content_history('requirement_revision_id');
create trigger requirement_history before insert or update or delete on public.requirement_evidence for each row execute function public.guard_requirement_content_history('requirement_revision_id');
create trigger requirement_history before insert or update or delete on public.requirement_verifications for each row execute function public.guard_requirement_content_history('requirement_revision_id');

create function public.revise_requirement(
  p_tenant_id uuid,
  p_request_id uuid,
  p_source_revision_id uuid,
  p_expected_revision integer,
  p_patch jsonb,
  p_force_new boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  source public.requirement_revisions;
  identity public.engineering_requirements;
  receipt public.requirement_revision_requests;
  next_values jsonb;
  old_values jsonb;
  actual_changes jsonb := '{}'::jsonb;
  normalized_patch jsonb := '{}'::jsonb;
  input_hash text;
  field_name text;
  field_value jsonb;
  owner_id uuid;
  actor_id uuid;
  destination_id uuid;
  event_id uuid;
  response jsonb;
  latest_id uuid;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'Your workspace role cannot revise requirements' using errcode = '42501';
  end if;
  if p_request_id is null or p_source_revision_id is null or p_expected_revision is null
    or p_expected_revision < 1 or p_force_new is null
    or jsonb_typeof(p_patch) is distinct from 'object' or octet_length(p_patch::text) > 500000 then
    raise exception 'Invalid requirement revision request' using errcode = '23514';
  end if;
  if (p_patch - 'title' - 'statement' - 'acceptanceCriteria' - 'rationale' - 'requirementType' - 'ownerPartyId') <> '{}'::jsonb then
    raise exception 'Only authored requirement fields can be revised' using errcode = '23514';
  end if;
  -- Normalize only authored whitespace. Null/blank optional prose has one value.
  for field_name, field_value in select key, value from jsonb_each(p_patch) loop
    if field_name in ('rationale','ownerPartyId') and field_value = 'null'::jsonb then
      normalized_patch := normalized_patch || jsonb_build_object(field_name, null);
    elsif jsonb_typeof(field_value) = 'string' then
      if field_name = 'ownerPartyId' then
        begin owner_id := (field_value #>> '{}')::uuid;
        exception when invalid_text_representation then
          raise exception 'Choose an existing requirement owner' using errcode = '23514';
        end;
        normalized_patch := normalized_patch || jsonb_build_object(field_name, owner_id);
      elsif field_name = 'rationale' then
        normalized_patch := normalized_patch || jsonb_build_object(field_name, nullif(btrim(field_value #>> '{}'), ''));
      else
        if length(btrim(field_value #>> '{}')) = 0 then
          raise exception 'Requirement % cannot be blank', field_name using errcode = '23514';
        end if;
        normalized_patch := normalized_patch || jsonb_build_object(field_name, btrim(field_value #>> '{}'));
      end if;
    else
      raise exception 'Invalid value for requirement %', field_name using errcode = '23514';
    end if;
  end loop;
  if normalized_patch ? 'requirementType' and normalized_patch->>'requirementType' not in
    ('functional','performance','interface','security','safety','design','operational','other') then
    raise exception 'Choose an available requirement type' using errcode = '23514';
  end if;
  input_hash := encode(extensions.digest(jsonb_build_object('sourceRevisionId', p_source_revision_id,
    'expectedRevision', p_expected_revision, 'patch', normalized_patch, 'forceNew', p_force_new)::text, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || '/requirement-revision/' || p_request_id::text, 0));
  select * into receipt from public.requirement_revision_requests where tenant_id = p_tenant_id and id = p_request_id;
  if found then
    if receipt.created_by <> auth.uid() or receipt.payload_sha256 <> input_hash then
      raise exception 'This request already saved different requirement details. Open the saved revision before retrying.' using errcode = 'PT409';
    end if;
    if receipt.source_revision_id is null or receipt.result_revision_id is null then
      raise exception 'A revision from this request was deleted. Reload the requirement before saving.' using errcode = 'PT409';
    end if;
    return receipt.result;
  end if;
  select er.* into identity from public.engineering_requirements er
    join public.requirement_revisions rr on rr.tenant_id = er.tenant_id and rr.engineering_requirement_id = er.id
    where er.tenant_id = p_tenant_id and rr.id = p_source_revision_id;
  if not found then
    raise exception 'This requirement revision is unavailable in your workspace' using errcode = '23514';
  end if;
  -- Program first matches the decomposition cycle guard's locking scope.
  perform 1 from public.programs where tenant_id = p_tenant_id and id = identity.program_id for update;
  select * into identity from public.engineering_requirements where tenant_id = p_tenant_id and id = identity.id for update;
  select * into source from public.requirement_revisions where tenant_id = p_tenant_id and id = p_source_revision_id for update;
  select id into latest_id from public.requirement_revisions
    where tenant_id = p_tenant_id and engineering_requirement_id = identity.id order by version_number desc limit 1;
  if latest_id is distinct from source.id or source.revision <> p_expected_revision then
    raise exception 'This requirement changed in another session or a newer revision exists. Your edits are retained; reload the latest revision before saving.' using errcode = 'PT409';
  end if;
  old_values := jsonb_build_object('title', source.title, 'statement', source.statement,
    'acceptanceCriteria', source.acceptance_criteria, 'rationale', source.rationale,
    'requirementType', source.requirement_type, 'ownerPartyId', source.owner_party_id);
  next_values := old_values || normalized_patch;
  owner_id := (next_values->>'ownerPartyId')::uuid;
  if owner_id is not null and not exists (select 1 from public.parties where tenant_id = p_tenant_id and id = owner_id) then
    raise exception 'Choose an owner in this workspace' using errcode = '23514';
  end if;
  for field_name in select key from jsonb_each(normalized_patch) loop
    if old_values->field_name is distinct from next_values->field_name then
      actual_changes := actual_changes || jsonb_build_object(field_name,
        jsonb_build_object('before', old_values->field_name, 'after', next_values->field_name));
    end if;
  end loop;
  if actual_changes = '{}'::jsonb and not p_force_new then
    response := jsonb_build_object('requirementId', identity.id, 'revisionId', source.id,
      'versionNumber', source.version_number, 'activityEventId', null, 'changed', false);
  else
    insert into public.requirement_revisions (tenant_id, engineering_requirement_id, version_number,
      title, statement, acceptance_criteria, rationale, requirement_type, owner_party_id)
    values (p_tenant_id, identity.id, source.version_number + 1,
      next_values->>'title', next_values->>'statement', next_values->>'acceptanceCriteria',
      next_values->>'rationale', next_values->>'requirementType', owner_id) returning id into destination_id;

    -- Copy authored outgoing content with exact target pins and authored prose.
    -- Incoming decomposition/task/assessment/change-request pins and applicability
    -- decisions remain on the revision that was actually targeted or decided.
    insert into public.requirement_decompositions (tenant_id, parent_requirement_revision_id, child_requirement_revision_id, rationale)
      select p_tenant_id, destination_id, child_requirement_revision_id, rationale from public.requirement_decompositions
      where tenant_id = p_tenant_id and parent_requirement_revision_id = source.id;
    insert into public.requirement_control_links (tenant_id, requirement_revision_id, control_part_id, relationship_type, rationale)
      select p_tenant_id, destination_id, control_part_id, relationship_type, rationale from public.requirement_control_links
      where tenant_id = p_tenant_id and requirement_revision_id = source.id;
    insert into public.requirement_allocations (tenant_id, requirement_revision_id, composition_node_id, provider_capability_id, security_process_id, rationale)
      select p_tenant_id, destination_id, composition_node_id, provider_capability_id, security_process_id, rationale from public.requirement_allocations
      where tenant_id = p_tenant_id and requirement_revision_id = source.id;
    insert into public.requirement_implementations (tenant_id, requirement_revision_id, component_contribution_id, rationale)
      select p_tenant_id, destination_id, component_contribution_id, rationale from public.requirement_implementations
      where tenant_id = p_tenant_id and requirement_revision_id = source.id;
    insert into public.requirement_evidence (tenant_id, requirement_revision_id, evidence_version_id, claim, applicability_rationale)
      select p_tenant_id, destination_id, evidence_version_id, claim, applicability_rationale from public.requirement_evidence
      where tenant_id = p_tenant_id and requirement_revision_id = source.id;
    insert into public.requirement_verifications (tenant_id, requirement_revision_id, procedure_revision_id, rationale)
      select p_tenant_id, destination_id, procedure_revision_id, rationale from public.requirement_verifications
      where tenant_id = p_tenant_id and requirement_revision_id = source.id;

    select id into actor_id from public.parties where tenant_id = p_tenant_id and auth_user_id = auth.uid();
    insert into public.activity_events (tenant_id, program_id, actor_party_id, event_type, description, occurred_at,
      requirement_revision_id, source_requirement_revision_id, changes)
    values (p_tenant_id, identity.program_id, actor_id, 'updated',
      format('%s: created revision %s from revision %s%s', identity.code, source.version_number + 1, source.version_number,
        case when actual_changes = '{}'::jsonb then ' as an explicit draft copy.'
          else '; changed ' || (select string_agg(case key
            when 'title' then 'Title' when 'statement' then 'Statement'
            when 'acceptanceCriteria' then 'Acceptance criteria' when 'rationale' then 'Rationale'
            when 'requirementType' then 'Requirement type' when 'ownerPartyId' then 'Owner'
            end, ', ' order by key) from jsonb_each(actual_changes)) || '.' end),
      clock_timestamp(), destination_id, source.id, actual_changes) returning id into event_id;
    response := jsonb_build_object('requirementId', identity.id, 'revisionId', destination_id,
      'versionNumber', source.version_number + 1, 'activityEventId', event_id, 'changed', true);
  end if;
  insert into public.requirement_revision_requests (id, tenant_id, source_revision_id, result_revision_id,
    activity_event_id, payload_sha256, result, created_by)
  values (p_request_id, p_tenant_id, source.id, coalesce(destination_id, source.id), event_id, input_hash, response, auth.uid());
  return response;
end;
$$;
revoke all on function public.revise_requirement(uuid, uuid, uuid, integer, jsonb, boolean) from public, anon;
grant execute on function public.revise_requirement(uuid, uuid, uuid, integer, jsonb, boolean) to authenticated;
