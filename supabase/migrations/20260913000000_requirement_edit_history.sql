-- Requirement content is edited in place. Existing compatibility rows and old
-- activity remain intact; no edit creates or copies a requirement revision.
revoke all on function public.revise_requirement(uuid, uuid, uuid, integer, jsonb, boolean) from public, anon, authenticated;
comment on function public.revise_requirement(uuid, uuid, uuid, integer, jsonb, boolean) is 'Retired. Applications edit the current requirement through edit_requirement.';

drop trigger record_lifecycle on public.requirement_revisions;
create trigger record_lifecycle before insert or update or delete on public.requirement_revisions
  for each row execute function public.stamp_record_lifecycle('false');

create or replace function public.guard_requirement_revision_history() returns trigger
language plpgsql security definer set search_path = '' as $$
declare program_uuid uuid;
begin
  if tg_op = 'INSERT' then
    select program_id into program_uuid from public.engineering_requirements
      where tenant_id = new.tenant_id and id = new.engineering_requirement_id;
    perform 1 from public.programs where tenant_id = new.tenant_id and id = program_uuid for no key update;
    perform 1 from public.engineering_requirements where tenant_id = new.tenant_id and id = new.engineering_requirement_id for update;
    if exists (select 1 from public.requirement_revisions where tenant_id = new.tenant_id
      and engineering_requirement_id = new.engineering_requirement_id) then
      raise exception 'This requirement already has details. Edit the existing record.' using errcode = '23514';
    end if;
    if new.version_number <> 1 then
      raise exception 'Initial requirement content must use its initial storage identifier' using errcode = '23514';
    end if;
    return new;
  end if;
  if exists (select 1 from public.requirement_revisions where tenant_id = old.tenant_id
    and engineering_requirement_id = old.engineering_requirement_id and version_number > old.version_number) then
    raise exception 'This is an archived requirement record. Open the current requirement to edit it.' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  if new.version_number is distinct from old.version_number then
    raise exception 'The requirement storage identifier cannot change' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- Current requirement relationships remain editable regardless of legacy state.
-- Exact publication guards on evidence/procedure targets are not changed.
drop trigger immutable_parent_requirement_revision_id on public.requirement_decompositions;
drop trigger immutable_requirement_revision_id on public.requirement_control_links;
drop trigger immutable_requirement_revision_id on public.requirement_allocations;
drop trigger immutable_requirement_revision_id on public.requirement_evidence;
drop trigger immutable_requirement_revision_id on public.requirement_verifications;

alter table public.activity_events drop constraint requirement_activity_pins;
alter table public.activity_events add constraint requirement_activity_pins check (
  (requirement_revision_id is null and source_requirement_revision_id is null and changes is null)
  or (requirement_revision_id is not null and program_id is not null
    and changes is not null and jsonb_typeof(changes) = 'object'
    and (source_requirement_revision_id is null or source_requirement_revision_id <> requirement_revision_id))
);
comment on column public.activity_events.changes is 'Actual before/after authored requirement values, keyed by product field name. Existing legacy revision events retain their original changes.';
create or replace function public.guard_requirement_activity_context() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.requirement_revision_id is not null then
    if not exists (select 1 from public.requirement_revisions current_record
      join public.engineering_requirements er on er.tenant_id = current_record.tenant_id and er.id = current_record.engineering_requirement_id
      where current_record.tenant_id = new.tenant_id and current_record.id = new.requirement_revision_id
        and er.program_id = new.program_id) then
      raise exception 'Requirement activity must belong to its requirement program' using errcode = '23514';
    end if;
    if new.source_requirement_revision_id is not null and not exists (
      select 1 from public.requirement_revisions destination
      join public.requirement_revisions source on source.tenant_id = destination.tenant_id
        and source.engineering_requirement_id = destination.engineering_requirement_id
      where destination.tenant_id = new.tenant_id and destination.id = new.requirement_revision_id
        and source.id = new.source_requirement_revision_id and destination.version_number = source.version_number + 1
    ) then
      raise exception 'Legacy requirement activity must retain its original consecutive content pins' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

-- Audit authenticated product and schema CRUD edits equally. Import/maintenance
-- sessions without an authenticated user retain their existing import history.
create function public.audit_requirement_edit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  before_values jsonb := '{}'::jsonb;
  after_values jsonb;
  changed_values jsonb := '{}'::jsonb;
  field_name text;
  requirement public.engineering_requirements;
  actor_id uuid;
  event_id uuid;
begin
  if auth.uid() is null then return new; end if;
  if not public.can_write_tenant(new.tenant_id) then
    raise exception 'Your workspace role cannot edit requirements' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    before_values := jsonb_build_object('title', old.title, 'statement', old.statement,
      'acceptanceCriteria', old.acceptance_criteria, 'rationale', old.rationale,
      'requirementType', old.requirement_type, 'ownerPartyId', old.owner_party_id);
  end if;
  after_values := jsonb_build_object('title', new.title, 'statement', new.statement,
    'acceptanceCriteria', new.acceptance_criteria, 'rationale', new.rationale,
    'requirementType', new.requirement_type, 'ownerPartyId', new.owner_party_id);
  for field_name in select key from jsonb_each(after_values) loop
    if before_values->field_name is distinct from after_values->field_name then
      changed_values := changed_values || jsonb_build_object(field_name,
        jsonb_build_object('before', before_values->field_name, 'after', after_values->field_name));
    end if;
  end loop;
  if changed_values = '{}'::jsonb then return new; end if;
  select * into requirement from public.engineering_requirements where tenant_id = new.tenant_id and id = new.engineering_requirement_id;
  select id into actor_id from public.parties where tenant_id = new.tenant_id and auth_user_id = auth.uid();
  insert into public.activity_events (tenant_id, program_id, actor_party_id, event_type, description, occurred_at,
    requirement_revision_id, source_requirement_revision_id, changes)
  values (new.tenant_id, requirement.program_id, actor_id,
    case when tg_op = 'INSERT' then 'created' else 'updated' end,
    case when tg_op = 'INSERT' then format('%s: added requirement details.', requirement.code)
      else format('%s: edited %s.', requirement.code,
        (select string_agg(case key when 'title' then 'Title' when 'statement' then 'Statement'
          when 'acceptanceCriteria' then 'Acceptance criteria' when 'rationale' then 'Rationale'
          when 'requirementType' then 'Requirement type' when 'ownerPartyId' then 'Owner' end,
          ', ' order by key) from jsonb_each(changed_values))) end,
    clock_timestamp(), new.id, null, changed_values) returning id into event_id;
  perform set_config('app.requirement_edit_event_id', event_id::text, true);
  return new;
end;
$$;
revoke all on function public.audit_requirement_edit() from public, anon, authenticated;
create trigger requirement_edit_audit after insert or update on public.requirement_revisions
  for each row execute function public.audit_requirement_edit();

create table public.requirement_edit_requests (
  id uuid not null,
  tenant_id uuid not null references public.tenants(id),
  content_id uuid,
  activity_event_id uuid,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (tenant_id, id),
  foreign key (tenant_id, content_id) references public.requirement_revisions(tenant_id, id) on delete set null (content_id),
  foreign key (tenant_id, activity_event_id) references public.activity_events(tenant_id, id)
);
alter table public.requirement_edit_requests enable row level security;
revoke all on public.requirement_edit_requests from public, anon, authenticated;

create function public.edit_requirement(
  p_tenant_id uuid, p_request_id uuid, p_requirement_id uuid,
  p_content_id uuid, p_expected_revision bigint, p_patch jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  current_record public.requirement_revisions;
  requirement public.engineering_requirements;
  receipt public.requirement_edit_requests;
  old_values jsonb;
  next_values jsonb;
  normalized_patch jsonb := '{}'::jsonb;
  input_hash text;
  field_name text;
  field_value jsonb;
  owner_id uuid;
  event_id uuid;
  response jsonb;
  next_counter bigint;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'Your workspace role cannot edit requirements' using errcode = '42501';
  end if;
  if p_request_id is null or p_requirement_id is null or p_content_id is null
    or p_expected_revision is null or p_expected_revision < 1
    or jsonb_typeof(p_patch) is distinct from 'object' or octet_length(p_patch::text) > 500000 then
    raise exception 'Invalid requirement edit request' using errcode = '23514';
  end if;
  if (p_patch - 'title' - 'statement' - 'acceptanceCriteria' - 'rationale' - 'requirementType' - 'ownerPartyId') <> '{}'::jsonb then
    raise exception 'Only authored requirement fields can be edited' using errcode = '23514';
  end if;
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
  input_hash := encode(extensions.digest(jsonb_build_object('requirementId', p_requirement_id,
    'contentId', p_content_id, 'expectedRevision', p_expected_revision, 'patch', normalized_patch)::text, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || '/requirement-edit/' || p_request_id::text, 0));
  select * into receipt from public.requirement_edit_requests where tenant_id = p_tenant_id and id = p_request_id;
  if found then
    if receipt.created_by <> auth.uid() or receipt.payload_sha256 <> input_hash then
      raise exception 'This request already saved different requirement details. Reload the requirement before retrying.' using errcode = 'PT409';
    end if;
    if receipt.content_id is null then
      raise exception 'The requirement from this request was deleted. Reload before saving.' using errcode = 'PT409';
    end if;
    return receipt.result;
  end if;
  select * into requirement from public.engineering_requirements where tenant_id = p_tenant_id and id = p_requirement_id;
  if not found then raise exception 'This requirement is unavailable in your workspace' using errcode = '23514'; end if;
  perform 1 from public.programs where tenant_id = p_tenant_id and id = requirement.program_id for no key update;
  perform 1 from public.engineering_requirements where tenant_id = p_tenant_id and id = p_requirement_id for share;
  select * into current_record from public.requirement_revisions
    where tenant_id = p_tenant_id and id = p_content_id and engineering_requirement_id = p_requirement_id for update;
  if not found then raise exception 'This requirement content is unavailable' using errcode = '23514'; end if;
  if current_record.revision <> p_expected_revision or p_content_id is distinct from (
    select id from public.requirement_revisions where tenant_id = p_tenant_id and engineering_requirement_id = p_requirement_id
    order by version_number desc limit 1
  ) then
    raise exception 'This requirement changed in another session. Your edits are retained; reload the current record before saving.' using errcode = 'PT409';
  end if;
  old_values := jsonb_build_object('title', current_record.title, 'statement', current_record.statement,
    'acceptanceCriteria', current_record.acceptance_criteria, 'rationale', current_record.rationale,
    'requirementType', current_record.requirement_type, 'ownerPartyId', current_record.owner_party_id);
  next_values := old_values || normalized_patch;
  owner_id := (next_values->>'ownerPartyId')::uuid;
  if owner_id is not null and not exists (select 1 from public.parties where tenant_id = p_tenant_id and id = owner_id) then
    raise exception 'Choose an owner in this workspace' using errcode = '23514';
  end if;
  next_counter := current_record.revision;
  if next_values is distinct from old_values then
    perform set_config('app.requirement_edit_event_id', '', true);
    update public.requirement_revisions set title = next_values->>'title', statement = next_values->>'statement',
      acceptance_criteria = next_values->>'acceptanceCriteria', rationale = next_values->>'rationale',
      requirement_type = next_values->>'requirementType', owner_party_id = owner_id, revision = current_record.revision + 1
      where tenant_id = p_tenant_id and id = p_content_id returning revision into next_counter;
    event_id := nullif(current_setting('app.requirement_edit_event_id', true), '')::uuid;
    if event_id is null then raise exception 'Requirement edit audit was not recorded' using errcode = '23514'; end if;
  end if;
  response := jsonb_build_object('requirementId', p_requirement_id, 'contentId', p_content_id,
    'revision', next_counter, 'activityEventId', event_id, 'changed', next_values is distinct from old_values);
  insert into public.requirement_edit_requests (id, tenant_id, content_id, activity_event_id, payload_sha256, result, created_by)
    values (p_request_id, p_tenant_id, p_content_id, event_id, input_hash, response, auth.uid());
  return response;
end;
$$;
revoke all on function public.edit_requirement(uuid, uuid, uuid, uuid, bigint, jsonb) from public, anon;
grant execute on function public.edit_requirement(uuid, uuid, uuid, uuid, bigint, jsonb) to authenticated;

-- Program serialization must remain compatible with the audit event's program FK.
create or replace function public.lock_requirement_decomposition_context() returns trigger
language plpgsql security definer set search_path = '' as $$
declare parents uuid[] := '{}'::uuid[];
begin
  if tg_op <> 'INSERT' then parents := array_append(parents, old.parent_requirement_revision_id); end if;
  if tg_op <> 'DELETE' then parents := array_append(parents, new.parent_requirement_revision_id); end if;
  perform p.id from public.programs p where p.id in (
    select er.program_id from public.requirement_revisions rr
    join public.engineering_requirements er on er.tenant_id = rr.tenant_id and er.id = rr.engineering_requirement_id
    where rr.id = any(parents)
  ) order by p.id for no key update;
  perform er.id from public.engineering_requirements er where er.id in (
    select engineering_requirement_id from public.requirement_revisions where id = any(parents)
  ) order by er.id for share;
  perform id from public.requirement_revisions where id = any(parents) order by id for share;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function public.guard_requirement_context() returns trigger
language plpgsql security definer set search_path = '' as $$
declare expected_program uuid; actual_program uuid;
begin
  if tg_table_name = 'requirement_decompositions' then
    select er.program_id into expected_program from public.requirement_revisions rr join public.engineering_requirements er on er.id = rr.engineering_requirement_id where rr.id = new.parent_requirement_revision_id;
    select er.program_id into actual_program from public.requirement_revisions rr join public.engineering_requirements er on er.id = rr.engineering_requirement_id where rr.id = new.child_requirement_revision_id;
    if expected_program is distinct from actual_program then
      raise exception 'Requirement decomposition must stay within one program' using errcode = '23514';
    end if;
    perform 1 from public.programs where id = expected_program for no key update;
    if exists (
      with recursive descendants as (
        select child_requirement_revision_id from public.requirement_decompositions where parent_requirement_revision_id = new.child_requirement_revision_id and id <> new.id
        union
        select d.child_requirement_revision_id from public.requirement_decompositions d join descendants p on d.parent_requirement_revision_id = p.child_requirement_revision_id where d.id <> new.id
      ) select 1 from descendants where child_requirement_revision_id = new.parent_requirement_revision_id
    ) then raise exception 'Requirement decomposition cannot contain a cycle' using errcode = '23514'; end if;
    return new;
  end if;
  select er.program_id into expected_program from public.requirement_revisions rr join public.engineering_requirements er on er.id = rr.engineering_requirement_id where rr.id = new.requirement_revision_id;
  if tg_table_name = 'requirement_allocations' then
    if new.composition_node_id is not null then
      select s.program_id into actual_program from public.composition_nodes n join public.systems s on s.id = n.system_id where n.id = new.composition_node_id;
    elsif new.security_process_id is not null then
      select program_id into actual_program from public.security_processes where id = new.security_process_id;
    else
      return new; -- Providers can deliberately offer capability across programs.
    end if;
  elsif tg_table_name = 'requirement_applicability' then
    select s.program_id into actual_program from public.scopes sc join public.systems s on s.id = sc.system_id where sc.id = new.scope_id;
  elsif tg_table_name = 'requirement_implementations' then
    select s.program_id into actual_program from public.component_contributions c
      join public.ssp_revisions sr on sr.id = c.ssp_revision_id join public.systems s on s.id = sr.system_id where c.id = new.component_contribution_id;
  end if;
  if expected_program is distinct from actual_program then
    raise exception 'Requirement target must belong to the requirement program' using errcode = '23514';
  end if;
  return new;
end;
$$;


create or replace function public.link_requirement_evidence(
  p_tenant_id uuid,
  p_program_id uuid,
  p_requirement_revision_id uuid,
  p_evidence_version_ids uuid[]
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  requirement_identity uuid;
  actual_program uuid;
  requested_ids uuid[];
  checked_count integer;
  result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'Your workspace role cannot link evidence' using errcode = '42501';
  end if;
  if p_requirement_revision_id is null or p_program_id is null
    or p_evidence_version_ids is null
    or cardinality(p_evidence_version_ids) not between 1 and 500
    or array_position(p_evidence_version_ids, null) is not null then
    raise exception 'Select between 1 and 500 published evidence versions' using errcode = '23514';
  end if;
  select array_agg(distinct version_id order by version_id) into requested_ids
    from unnest(p_evidence_version_ids) as selected(version_id);
  perform 1 from public.programs where tenant_id = p_tenant_id and id = p_program_id for no key update;
  select er.id, er.program_id into requirement_identity, actual_program
    from public.engineering_requirements er
    where er.tenant_id = p_tenant_id and er.id = (
      select engineering_requirement_id from public.requirement_revisions
      where tenant_id = p_tenant_id and id = p_requirement_revision_id
    ) for share;
  if not found or actual_program is distinct from p_program_id then
    raise exception 'Choose a requirement in this program' using errcode = '23514';
  end if;
  perform id from public.requirement_revisions
    where tenant_id = p_tenant_id and id = p_requirement_revision_id for update;
  if p_requirement_revision_id is distinct from (
    select id from public.requirement_revisions where tenant_id = p_tenant_id
      and engineering_requirement_id = requirement_identity order by version_number desc limit 1
  ) then
    raise exception 'This is an archived requirement record. Open the current requirement to link evidence.' using errcode = '23514';
  end if;
  perform ev.id
    from public.evidence_versions ev
    join public.evidence_artifacts ea on ea.tenant_id = ev.tenant_id and ea.id = ev.artifact_id
    where ev.tenant_id = p_tenant_id and ev.id = any(requested_ids)
      and ev.state = 'published' and (ea.program_id is null or ea.program_id = p_program_id)
    order by ev.id for share of ev, ea;
  get diagnostics checked_count = row_count;
  if checked_count <> cardinality(requested_ids) then
    raise exception 'Every selection must be a published evidence version in this program or an unscoped workspace artifact. Reload the browser and review your selection.' using errcode = '23514';
  end if;
  insert into public.requirement_evidence (tenant_id, requirement_revision_id, evidence_version_id)
    select p_tenant_id, p_requirement_revision_id, version_id from unnest(requested_ids) as selected(version_id)
    on conflict (tenant_id, requirement_revision_id, evidence_version_id) do nothing;
  select jsonb_build_object('linkIds', jsonb_agg(re.id order by re.evidence_version_id)) into result
    from public.requirement_evidence re
    where re.tenant_id = p_tenant_id and re.requirement_revision_id = p_requirement_revision_id
      and re.evidence_version_id = any(requested_ids);
  return result;
end;
$$;
