-- One element, one shape, phases 2 and 3: the library is applied to elements through one validated
-- command, every application is traceable (version, applied at, by, rationale) and recorded as an
-- assignment with per-target rows, reusable requirements are adopted by reference, library evidence
-- is proposed as uses the consumer decides on, and a newer library version is taken through review.
-- See docs/guides/system-view-simplification.md and docs/guides/inheritance-model.md.

-- ---------------------------------------------------------------------------------------------
-- Library sources: three categories, conditions and responsibilities on a version.
-- ---------------------------------------------------------------------------------------------
alter table public.component_definitions
  add column category text not null default 'catalog_product'
    check (category in ('organizational_baseline','host_platform','catalog_product'));
comment on column public.component_definitions.category is 'Organizational baseline (policies, procedures), host platform or shared service, or catalog product.';

alter table public.component_definition_revisions
  add column effective_from date,
  add column review_due date,
  add column conditions text,
  add column consumer_responsibilities text;
comment on column public.component_definition_revisions.conditions is 'The configuration or context under which this version''s implementation content applies.';
comment on column public.component_definition_revisions.consumer_responsibilities is 'What a consuming program still has to do when it applies this version.';

-- ---------------------------------------------------------------------------------------------
-- Contributions and coverage: a bounded claim against a control, a statement or a requirement.
-- ---------------------------------------------------------------------------------------------
create table public.requirement_definitions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  code text not null check (length(btrim(code)) > 0),
  title text not null check (length(btrim(title)) > 0),
  description text,
  unique (tenant_id, id),
  unique (tenant_id, code)
);
comment on table public.requirement_definitions is 'A reusable requirement in the library, adopted by programs by reference to an exact revision.';
select public.apply_tenant_security('requirement_definitions');
select public.attach_record_lifecycle('requirement_definitions', false);

create table public.requirement_definition_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  requirement_definition_id uuid not null,
  version_number integer not null check (version_number > 0),
  state text not null default 'draft' check (state in ('draft','published')),
  published_at timestamptz,
  check ((state = 'published') = (published_at is not null)),
  statement text not null check (length(btrim(statement)) > 0),
  acceptance_criteria text not null check (length(btrim(acceptance_criteria)) > 0),
  requirement_type text not null check (requirement_type in ('functional','performance','interface','security','safety','design','operational','other')),
  rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, requirement_definition_id) references public.requirement_definitions(tenant_id, id),
  unique (tenant_id, requirement_definition_id, version_number)
);
comment on table public.requirement_definition_revisions is 'An immutable published version of a reusable requirement: statement, acceptance criteria and type.';
select public.apply_tenant_security('requirement_definition_revisions');
select public.attach_record_lifecycle('requirement_definition_revisions', true);
create trigger stable_context before update on public.requirement_definition_revisions for each row execute function public.guard_stable_assurance_context('requirement_definition_id');

alter table public.defined_component_implementations
  alter column control_id drop not null,
  add column requirement_definition_revision_id uuid,
  add column coverage text not null default 'full' check (coverage in ('full','partial','conditional')),
  add column coverage_rationale text,
  add column consumer_responsibility text,
  add constraint defined_component_implementation_target check (control_id is not null or requirement_definition_revision_id is not null),
  add constraint defined_component_implementation_requirement foreign key (tenant_id, requirement_definition_revision_id)
    references public.requirement_definition_revisions(tenant_id, id);
comment on column public.defined_component_implementations.coverage is 'How much of the obligation this contribution claims: full, partial, or conditional on the version''s conditions.';
comment on column public.defined_component_implementations.consumer_responsibility is 'What remains for the consuming program on this obligation.';

create table public.defined_component_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  component_definition_revision_id uuid not null,
  implementation_id uuid not null,
  evidence_version_id uuid not null,
  claim text,
  unique (tenant_id, id),
  foreign key (tenant_id, component_definition_revision_id) references public.component_definition_revisions(tenant_id, id),
  foreign key (tenant_id, implementation_id) references public.defined_component_implementations(tenant_id, id),
  foreign key (tenant_id, evidence_version_id) references public.evidence_versions(tenant_id, id),
  unique (tenant_id, implementation_id, evidence_version_id)
);
comment on table public.defined_component_evidence is 'Library evidence supporting a reusable contribution; proposed to a consumer as an evidence use when the contribution is applied.';
select public.apply_tenant_security('defined_component_evidence');
select public.attach_record_lifecycle('defined_component_evidence', false);
select public.attach_parent_immutability('defined_component_evidence', 'component_definition_revisions', 'component_definition_revision_id');

-- ---------------------------------------------------------------------------------------------
-- What an application leaves behind: the four facts on the component, the seed on each contribution.
-- ---------------------------------------------------------------------------------------------
alter table public.system_components
  add column applied_rationale text,
  add column applied_at timestamptz,
  add column applied_by uuid references auth.users(id) on delete set null,
  add column assignment_id uuid;
comment on column public.system_components.applied_rationale is 'Why this library item was applied here, recorded by the apply command.';

alter table public.component_contributions
  add column library_implementation_id uuid,
  add constraint component_contribution_library foreign key (tenant_id, library_implementation_id)
    references public.defined_component_implementations(tenant_id, id);
comment on column public.component_contributions.library_implementation_id is 'The library contribution this narrative was seeded from; a differing description is a local change.';

alter table public.engineering_requirements
  add column definition_revision_id uuid,
  add constraint engineering_requirement_definition foreign key (tenant_id, definition_revision_id)
    references public.requirement_definition_revisions(tenant_id, id);
comment on column public.engineering_requirements.definition_revision_id is 'The exact library requirement revision this program requirement was adopted from.';

-- ---------------------------------------------------------------------------------------------
-- Assignments: the exact expansion the reader confirmed, one row per target and obligation.
-- ---------------------------------------------------------------------------------------------
create table public.library_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  program_id uuid not null,
  system_id uuid not null,
  source_revision_id uuid,
  requirement_definition_revision_id uuid,
  include_descendants boolean not null default false,
  control_ids uuid[],
  rationale text,
  state text not null default 'accepted' check (state in ('accepted','superseded')),
  superseded_by_id uuid,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz not null default now(),
  request_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id),
  foreign key (tenant_id, system_id) references public.systems(tenant_id, id),
  foreign key (tenant_id, source_revision_id) references public.component_definition_revisions(tenant_id, id),
  foreign key (tenant_id, requirement_definition_revision_id) references public.requirement_definition_revisions(tenant_id, id),
  foreign key (tenant_id, superseded_by_id) references public.library_assignments(tenant_id, id),
  check (num_nonnulls(source_revision_id, requirement_definition_revision_id) = 1)
);
comment on table public.library_assignments is 'One confirmed application of a library version to a root element and, optionally, everything inside it. Superseded by the assignment that replaced it on update.';
select public.apply_tenant_security('library_assignments');
select public.attach_record_lifecycle('library_assignments', false);
revoke insert, update, delete on public.library_assignments from authenticated;

create table public.library_assignment_targets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  assignment_id uuid not null,
  system_id uuid not null,
  control_id uuid references public.controls(id),
  implementation_id uuid,
  system_component_id uuid,
  component_contribution_id uuid,
  requirement_revision_id uuid,
  state text not null check (state in ('accepted','excluded','not_in_baseline','no_ssp','already_applied','conflicting','proposed')),
  note text,
  unique (tenant_id, id),
  foreign key (tenant_id, assignment_id) references public.library_assignments(tenant_id, id),
  foreign key (tenant_id, system_id) references public.systems(tenant_id, id),
  foreign key (tenant_id, implementation_id) references public.defined_component_implementations(tenant_id, id),
  foreign key (tenant_id, system_component_id) references public.system_components(tenant_id, id),
  foreign key (tenant_id, component_contribution_id) references public.component_contributions(tenant_id, id),
  foreign key (tenant_id, requirement_revision_id) references public.requirement_revisions(tenant_id, id)
);
comment on table public.library_assignment_targets is 'The resolution of an assignment: for each element and obligation, what was written or why it was not.';
select public.apply_tenant_security('library_assignment_targets');
select public.attach_record_lifecycle('library_assignment_targets', false);
revoke insert, update, delete on public.library_assignment_targets from authenticated;
create index library_assignment_targets_assignment_idx on public.library_assignment_targets(tenant_id, assignment_id);

alter table public.system_components
  add constraint system_component_assignment foreign key (tenant_id, assignment_id) references public.library_assignments(tenant_id, id);

-- ---------------------------------------------------------------------------------------------
-- Evidence uses: one artifact version, many consumers, each with its own decision.
-- ---------------------------------------------------------------------------------------------
create table public.evidence_uses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  evidence_version_id uuid not null,
  program_id uuid not null,
  system_id uuid,
  component_contribution_id uuid,
  requirement_revision_id uuid,
  assignment_id uuid,
  claim text,
  decision text not null default 'pending' check (decision in ('pending','accepted','not_applicable')),
  rationale text,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, evidence_version_id) references public.evidence_versions(tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id),
  foreign key (tenant_id, system_id) references public.systems(tenant_id, id),
  foreign key (tenant_id, component_contribution_id) references public.component_contributions(tenant_id, id),
  foreign key (tenant_id, requirement_revision_id) references public.requirement_revisions(tenant_id, id),
  foreign key (tenant_id, assignment_id) references public.library_assignments(tenant_id, id),
  check (num_nonnulls(component_contribution_id, requirement_revision_id) = 1),
  check (decision = 'pending' or decided_at is not null),
  unique nulls not distinct (tenant_id, evidence_version_id, component_contribution_id, requirement_revision_id)
);
comment on table public.evidence_uses is 'A library evidence version proposed to a program by an applied contribution; the program accepts it (which links it as SSP support) or records it as not applicable.';
select public.apply_tenant_security('evidence_uses');
select public.attach_record_lifecycle('evidence_uses', false);
revoke insert, update, delete on public.evidence_uses from authenticated;

create table public.library_apply_requests (
  id uuid primary key, tenant_id uuid not null references public.tenants(id), program_id uuid not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'), result jsonb not null,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id)
);
alter table public.library_apply_requests enable row level security;
revoke all on public.library_apply_requests from public, anon, authenticated;
grant select on public.library_apply_requests to authenticated;
create policy library_apply_request_read on public.library_apply_requests for select to authenticated using (public.can_read_tenant(tenant_id));

-- Generic record edits cannot fake an application; the facts come from the command.
create function public.guard_library_application() returns trigger
language plpgsql security invoker set search_path='' as $$
declare after jsonb := to_jsonb(new); before jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
begin
  if current_user in ('authenticated','anon') then
    if tg_table_name = 'system_components' and (
      tg_op = 'INSERT' and (after->>'defined_component_id' is not null or after->>'assignment_id' is not null or after->>'applied_at' is not null)
      or tg_op = 'UPDATE' and (after->>'defined_component_id' is distinct from before->>'defined_component_id' or after->>'assignment_id' is distinct from before->>'assignment_id'
        or after->>'applied_at' is distinct from before->>'applied_at' or after->>'applied_by' is distinct from before->>'applied_by' or after->>'applied_rationale' is distinct from before->>'applied_rationale')) then
      raise exception 'Use Add from library to apply a component definition to an element' using errcode='23514';
    end if;
    if tg_table_name = 'engineering_requirements' and (
      tg_op = 'INSERT' and after->>'definition_revision_id' is not null
      or tg_op = 'UPDATE' and after->>'definition_revision_id' is distinct from before->>'definition_revision_id') then
      raise exception 'Use Add from library to adopt a requirement definition' using errcode='23514';
    end if;
    if tg_table_name = 'component_contributions' and (
      tg_op = 'INSERT' and after->>'library_implementation_id' is not null
      or tg_op = 'UPDATE' and after->>'library_implementation_id' is distinct from before->>'library_implementation_id') then
      raise exception 'A contribution''s library origin is recorded by the apply command' using errcode='23514';
    end if;
  end if;
  return new;
end; $$;
revoke all on function public.guard_library_application() from public, anon, authenticated;
create trigger a_library_application before insert or update on public.system_components for each row execute function public.guard_library_application();
create trigger a_library_application before insert or update on public.engineering_requirements for each row execute function public.guard_library_application();
create trigger a_library_application before insert or update on public.component_contributions for each row execute function public.guard_library_application();

-- ---------------------------------------------------------------------------------------------
-- Seeding one library contribution into one element: shared by apply and update.
-- Returns the target state and the contribution id it wrote, if any.
-- ---------------------------------------------------------------------------------------------
create function public.seed_library_contribution(
  p_tenant_id uuid, p_program_id uuid, p_assignment_id uuid, p_system_id uuid, p_system_component_id uuid,
  p_ssp_id uuid, p_ssp_resolution_id uuid, p_impl public.defined_component_implementations, p_excluded boolean, p_note text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  selected_id uuid; implemented_id uuid; statement_id uuid; contribution_id uuid; target_state text; evidence_row record;
begin
  if p_excluded then target_state := 'excluded';
  elsif p_ssp_id is null then target_state := 'no_ssp';
  else
    select id into selected_id from public.selected_controls where profile_resolution_id = p_ssp_resolution_id and control_id = p_impl.control_id;
    if selected_id is null then target_state := 'not_in_baseline';
    else
      select id into implemented_id from public.implemented_requirements where tenant_id = p_tenant_id and ssp_revision_id = p_ssp_id and selected_control_id = selected_id;
      if implemented_id is null then
        insert into public.implemented_requirements(tenant_id, ssp_revision_id, selected_control_id, implementation_status)
          values (p_tenant_id, p_ssp_id, selected_id, 'planned') returning id into implemented_id;
      end if;
      if p_impl.control_part_id is not null then
        select id into statement_id from public.implementation_statements where tenant_id = p_tenant_id and implemented_requirement_id = implemented_id and control_part_id = p_impl.control_part_id;
        if statement_id is null then
          insert into public.implementation_statements(tenant_id, ssp_revision_id, implemented_requirement_id, control_part_id, description)
            values (p_tenant_id, p_ssp_id, implemented_id, p_impl.control_part_id, p_impl.description) returning id into statement_id;
        end if;
      end if;
      insert into public.component_contributions(tenant_id, ssp_revision_id, implemented_requirement_id, implementation_statement_id, system_component_id, description, implementation_status, library_implementation_id)
        values (p_tenant_id, p_ssp_id, implemented_id, statement_id, p_system_component_id, p_impl.description, p_impl.implementation_status, p_impl.id)
        returning id into contribution_id;
      for evidence_row in select e.* from public.defined_component_evidence e join public.evidence_versions v on v.tenant_id = e.tenant_id and v.id = e.evidence_version_id
        where e.tenant_id = p_tenant_id and e.implementation_id = p_impl.id and v.state = 'published' loop
        insert into public.evidence_uses(tenant_id, evidence_version_id, program_id, system_id, component_contribution_id, assignment_id, claim)
          values (p_tenant_id, evidence_row.evidence_version_id, p_program_id, p_system_id, contribution_id, p_assignment_id, evidence_row.claim)
          on conflict do nothing;
      end loop;
      target_state := 'accepted';
    end if;
  end if;
  insert into public.library_assignment_targets(tenant_id, assignment_id, system_id, control_id, implementation_id, system_component_id, component_contribution_id, state, note)
    values (p_tenant_id, p_assignment_id, p_system_id, p_impl.control_id, p_impl.id, p_system_component_id, contribution_id, target_state, p_note);
  return jsonb_build_object('state', target_state, 'contributionId', contribution_id);
end; $$;
revoke all on function public.seed_library_contribution(uuid,uuid,uuid,uuid,uuid,uuid,uuid,public.defined_component_implementations,boolean,text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Apply a library source (a defined component of a published revision) to one or more elements.
-- ---------------------------------------------------------------------------------------------
create function public.apply_library_source(p_tenant_id uuid, p_program_id uuid, p_request_id uuid, p_selection jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
declare
  receipt public.library_apply_requests; payload_hash text; result jsonb; targets jsonb := '[]';
  revision_row public.component_definition_revisions; definition_row public.component_definitions; defined_row public.defined_components;
  target jsonb; target_system public.systems; boundary_id uuid; element_id uuid; component_id uuid; existing_id uuid;
  assignment_id uuid; control_filter uuid[]; excluded jsonb; rationale text; include_descendants boolean;
  ssp_row public.ssp_revisions; impl public.defined_component_implementations; seeded jsonb;
  accepted_count integer; excluded_count integer; not_in_baseline_count integer; no_ssp_count integer;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  if p_request_id is null or jsonb_typeof(p_selection) is distinct from 'object' or jsonb_typeof(p_selection->'targets') is distinct from 'array' then
    raise exception 'Choose a library item and at least one element' using errcode='23514';
  end if;
  perform 1 from public.programs where tenant_id = p_tenant_id and id = p_program_id for no key update;
  if not found then raise exception 'Program was not found in this workspace' using errcode='23514'; end if;
  payload_hash := encode(extensions.digest(jsonb_build_object('programId', p_program_id, 'selection', p_selection)::text, 'sha256'), 'hex');
  select * into receipt from public.library_apply_requests where id = p_request_id;
  if found then
    if receipt.tenant_id <> p_tenant_id or receipt.program_id <> p_program_id or receipt.payload_sha256 <> payload_hash then
      raise exception 'This apply request has already been used for different changes' using errcode='PT409';
    end if;
    return receipt.result;
  end if;
  select * into revision_row from public.component_definition_revisions where tenant_id = p_tenant_id and id = (p_selection->>'sourceRevisionId')::uuid;
  if revision_row.id is null then raise exception 'Library version was not found' using errcode='23514'; end if;
  if revision_row.state <> 'published' then raise exception 'Only a published library version can be applied' using errcode='23514'; end if;
  select * into definition_row from public.component_definitions where tenant_id = p_tenant_id and id = revision_row.component_definition_id;
  select * into defined_row from public.defined_components where tenant_id = p_tenant_id and id = (p_selection->>'definedComponentId')::uuid and component_definition_revision_id = revision_row.id;
  if defined_row.id is null then raise exception 'Choose a component of the selected library version' using errcode='23514'; end if;
  rationale := nullif(btrim(p_selection->>'rationale'), '');
  if rationale is null or length(rationale) > 10000 then raise exception 'Record why this library item applies here' using errcode='23514'; end if;
  include_descendants := coalesce((p_selection->>'includeDescendants')::boolean, false);
  if jsonb_typeof(p_selection->'controlIds') = 'array' then
    select coalesce(array_agg(distinct value::uuid), '{}') into control_filter from jsonb_array_elements_text(p_selection->'controlIds');
  end if;
  excluded := coalesce(p_selection->'excluded', '[]');
  if jsonb_array_length(p_selection->'targets') = 0 then raise exception 'Choose at least one element' using errcode='23514'; end if;
  insert into public.library_assignments(tenant_id, program_id, system_id, source_revision_id, include_descendants, control_ids, rationale, accepted_by, request_id)
    values (p_tenant_id, p_program_id, (p_selection->'targets'->0->>'systemId')::uuid, revision_row.id, include_descendants, control_filter, rationale, auth.uid(), p_request_id)
    returning id into assignment_id;
  for target in select value from jsonb_array_elements(p_selection->'targets') loop
    select * into target_system from public.systems where tenant_id = p_tenant_id and id = (target->>'systemId')::uuid for update;
    if target_system.id is null or target_system.program_id <> p_program_id then raise exception 'Element was not found in this program' using errcode='23514'; end if;
    if target_system.revision is distinct from (target->>'expectedRevision')::bigint then
      raise exception 'The element % changed; reload before applying', target_system.code using errcode='PT409';
    end if;
    boundary_id := target_system.boundary_system_id;
    element_id := case when target_system.is_authorization_boundary then null else target_system.id end;
    accepted_count := 0; excluded_count := 0; not_in_baseline_count := 0; no_ssp_count := 0;
    select c.id into existing_id from public.system_components c
      where c.tenant_id = p_tenant_id and c.system_id = boundary_id and c.system_element_id is not distinct from element_id and c.defined_component_id = defined_row.id;
    if existing_id is not null then
      insert into public.library_assignment_targets(tenant_id, assignment_id, system_id, system_component_id, state, note)
        values (p_tenant_id, assignment_id, target_system.id, existing_id, 'already_applied', 'This library component is already applied here');
      targets := targets || jsonb_build_object('systemId', target_system.id, 'systemComponentId', existing_id, 'state', 'already_applied');
      continue;
    end if;
    if exists (select 1 from public.system_components where tenant_id = p_tenant_id and system_id = boundary_id and code = btrim(target->>'code')) then
      raise exception 'Component code % is already used in this boundary', target->>'code' using errcode='23505';
    end if;
    insert into public.system_components(tenant_id, system_id, system_element_id, defined_component_id, code, name, component_type, status, version, description, applied_rationale, applied_at, applied_by, assignment_id)
      values (p_tenant_id, boundary_id, element_id, defined_row.id, btrim(target->>'code'), coalesce(nullif(btrim(target->>'name'), ''), defined_row.name), defined_row.component_type, 'planned', revision_row.version_number::text, defined_row.description, rationale, now(), auth.uid(), assignment_id)
      returning id into component_id;
    select * into ssp_row from public.ssp_revisions where tenant_id = p_tenant_id and system_id = boundary_id and state = 'draft' order by version_number desc limit 1;
    for impl in select * from public.defined_component_implementations i
      where i.tenant_id = p_tenant_id and i.defined_component_id = defined_row.id and i.control_id is not null
        and (control_filter is null or i.control_id = any(control_filter))
      order by i.id loop
      seeded := public.seed_library_contribution(p_tenant_id, p_program_id, assignment_id, target_system.id, component_id, ssp_row.id, ssp_row.profile_resolution_id, impl,
        exists (select 1 from jsonb_array_elements(excluded) e where (e->>'systemId')::uuid = target_system.id and (e->>'controlId')::uuid = impl.control_id), null);
      case seeded->>'state'
        when 'accepted' then accepted_count := accepted_count + 1;
        when 'excluded' then excluded_count := excluded_count + 1;
        when 'not_in_baseline' then not_in_baseline_count := not_in_baseline_count + 1;
        else no_ssp_count := no_ssp_count + 1;
      end case;
    end loop;
    update public.systems set revision = revision + 1 where tenant_id = p_tenant_id and id = target_system.id;
    targets := targets || jsonb_build_object('systemId', target_system.id, 'systemComponentId', component_id, 'state', 'accepted',
      'accepted', accepted_count, 'excluded', excluded_count, 'notInBaseline', not_in_baseline_count, 'noSsp', no_ssp_count);
  end loop;
  result := jsonb_build_object('assignmentId', assignment_id, 'sourceRevisionId', revision_row.id, 'definedComponentId', defined_row.id, 'targets', targets);
  insert into public.library_apply_requests(id, tenant_id, program_id, payload_sha256, result, created_by) values (p_request_id, p_tenant_id, p_program_id, payload_hash, result, auth.uid());
  return result;
end; $$;
revoke all on function public.apply_library_source(uuid,uuid,uuid,jsonb) from public, anon;
grant execute on function public.apply_library_source(uuid,uuid,uuid,jsonb) to authenticated;
comment on function public.apply_library_source(uuid,uuid,uuid,jsonb) is 'Apply one component of a published library version to one or more elements: a pinned component instance per element, contributions seeded into the boundary''s draft SSP for controls in its selection, library evidence proposed as uses, and an assignment recording every target and why. Same request retries reconcile; element CAS prevents lost updates.';

-- ---------------------------------------------------------------------------------------------
-- Adopt a reusable requirement by reference: one program requirement pinned to the exact revision,
-- allocated to the chosen elements. A second adoption of the same revision reuses the requirement.
-- ---------------------------------------------------------------------------------------------
create function public.adopt_requirement_definition(p_tenant_id uuid, p_program_id uuid, p_request_id uuid, p_selection jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
declare
  receipt public.library_apply_requests; payload_hash text; result jsonb;
  definition_revision public.requirement_definition_revisions; definition_row public.requirement_definitions;
  requirement_id uuid; revision_id uuid; created boolean := false; allocations integer := 0; target jsonb; target_system public.systems;
  assignment_id uuid; rationale text; requirement_code text;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  if p_request_id is null or jsonb_typeof(p_selection) is distinct from 'object' then raise exception 'Choose a requirement to adopt' using errcode='23514'; end if;
  perform 1 from public.programs where tenant_id = p_tenant_id and id = p_program_id for no key update;
  if not found then raise exception 'Program was not found in this workspace' using errcode='23514'; end if;
  payload_hash := encode(extensions.digest(jsonb_build_object('programId', p_program_id, 'selection', p_selection)::text, 'sha256'), 'hex');
  select * into receipt from public.library_apply_requests where id = p_request_id;
  if found then
    if receipt.tenant_id <> p_tenant_id or receipt.program_id <> p_program_id or receipt.payload_sha256 <> payload_hash then
      raise exception 'This adopt request has already been used for different changes' using errcode='PT409';
    end if;
    return receipt.result;
  end if;
  select * into definition_revision from public.requirement_definition_revisions where tenant_id = p_tenant_id and id = (p_selection->>'definitionRevisionId')::uuid;
  if definition_revision.id is null then raise exception 'Requirement definition was not found' using errcode='23514'; end if;
  if definition_revision.state <> 'published' then raise exception 'Only a published requirement definition can be adopted' using errcode='23514'; end if;
  select * into definition_row from public.requirement_definitions where tenant_id = p_tenant_id and id = definition_revision.requirement_definition_id;
  rationale := nullif(btrim(p_selection->>'rationale'), '');
  requirement_code := coalesce(nullif(btrim(p_selection->>'code'), ''), definition_row.code);
  select er.id into requirement_id from public.engineering_requirements er where er.tenant_id = p_tenant_id and er.program_id = p_program_id and er.definition_revision_id = definition_revision.id;
  if requirement_id is null then
    if exists (select 1 from public.engineering_requirements where tenant_id = p_tenant_id and program_id = p_program_id and code = requirement_code) then
      raise exception 'Requirement code % is already used in this program', requirement_code using errcode='23505';
    end if;
    insert into public.engineering_requirements(tenant_id, program_id, code, definition_revision_id) values (p_tenant_id, p_program_id, requirement_code, definition_revision.id) returning id into requirement_id;
    insert into public.requirement_revisions(tenant_id, engineering_requirement_id, version_number, state, title, statement, acceptance_criteria, requirement_type, rationale)
      values (p_tenant_id, requirement_id, 1, 'draft', definition_row.title, definition_revision.statement, definition_revision.acceptance_criteria, definition_revision.requirement_type, definition_revision.rationale)
      returning id into revision_id;
    created := true;
  else
    select id into revision_id from public.requirement_revisions where tenant_id = p_tenant_id and engineering_requirement_id = requirement_id order by version_number desc limit 1;
  end if;
  insert into public.library_assignments(tenant_id, program_id, system_id, requirement_definition_revision_id, rationale, accepted_by, request_id)
    values (p_tenant_id, p_program_id, coalesce((p_selection->'targets'->0->>'systemId')::uuid, (select id from public.systems where tenant_id = p_tenant_id and program_id = p_program_id and is_authorization_boundary order by code limit 1)), definition_revision.id, rationale, auth.uid(), p_request_id)
    returning id into assignment_id;
  if jsonb_typeof(p_selection->'targets') = 'array' then
    for target in select value from jsonb_array_elements(p_selection->'targets') loop
      select * into target_system from public.systems where tenant_id = p_tenant_id and id = (target->>'systemId')::uuid;
      if target_system.id is null or target_system.program_id <> p_program_id then raise exception 'Element was not found in this program' using errcode='23514'; end if;
      if not exists (select 1 from public.requirement_allocations where tenant_id = p_tenant_id and requirement_revision_id = revision_id and system_id = target_system.id) then
        insert into public.requirement_allocations(tenant_id, requirement_revision_id, system_id, rationale) values (p_tenant_id, revision_id, target_system.id, rationale);
        allocations := allocations + 1;
        insert into public.library_assignment_targets(tenant_id, assignment_id, system_id, requirement_revision_id, state) values (p_tenant_id, assignment_id, target_system.id, revision_id, 'accepted');
      else
        insert into public.library_assignment_targets(tenant_id, assignment_id, system_id, requirement_revision_id, state, note) values (p_tenant_id, assignment_id, target_system.id, revision_id, 'already_applied', 'Already allocated here');
      end if;
    end loop;
  end if;
  result := jsonb_build_object('assignmentId', assignment_id, 'requirementId', requirement_id, 'revisionId', revision_id, 'created', created, 'allocations', allocations);
  insert into public.library_apply_requests(id, tenant_id, program_id, payload_sha256, result, created_by) values (p_request_id, p_tenant_id, p_program_id, payload_hash, result, auth.uid());
  return result;
end; $$;
revoke all on function public.adopt_requirement_definition(uuid,uuid,uuid,jsonb) from public, anon;
grant execute on function public.adopt_requirement_definition(uuid,uuid,uuid,jsonb) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Decide an evidence use. Accepting links the exact version as SSP support for the contribution
-- (or as requirement evidence); not applicable records the reason.
-- ---------------------------------------------------------------------------------------------
create function public.decide_evidence_use(p_tenant_id uuid, p_use_id uuid, p_expected_revision bigint, p_decision text, p_rationale text)
returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
declare use_row public.evidence_uses; decision_rationale text;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  if p_decision not in ('accepted','not_applicable') then raise exception 'Accept the evidence or record it as not applicable' using errcode='23514'; end if;
  decision_rationale := nullif(btrim(p_rationale), '');
  if p_decision = 'not_applicable' and decision_rationale is null then raise exception 'Record why this evidence does not apply here' using errcode='23514'; end if;
  select * into use_row from public.evidence_uses where tenant_id = p_tenant_id and id = p_use_id for update;
  if use_row.id is null then raise exception 'Evidence use was not found' using errcode='23514'; end if;
  if use_row.revision is distinct from p_expected_revision then raise exception 'This evidence use changed; reload before deciding' using errcode='PT409'; end if;
  if use_row.decision <> 'pending' then raise exception 'This evidence use has already been decided' using errcode='23514'; end if;
  if p_decision = 'accepted' then
    if use_row.component_contribution_id is not null then
      insert into public.implementation_evidence(tenant_id, component_contribution_id, evidence_version_id, claim, applicability_rationale)
        values (p_tenant_id, use_row.component_contribution_id, use_row.evidence_version_id, use_row.claim, decision_rationale)
        on conflict (tenant_id, component_contribution_id, evidence_version_id) do nothing;
    else
      insert into public.requirement_evidence(tenant_id, requirement_revision_id, evidence_version_id, claim, applicability_rationale)
        values (p_tenant_id, use_row.requirement_revision_id, use_row.evidence_version_id, use_row.claim, decision_rationale)
        on conflict (tenant_id, requirement_revision_id, evidence_version_id) do nothing;
    end if;
  end if;
  update public.evidence_uses set decision = p_decision, rationale = decision_rationale, decided_by = auth.uid(), decided_at = now(), revision = p_expected_revision + 1
    where tenant_id = p_tenant_id and id = p_use_id returning * into use_row;
  return jsonb_build_object('id', use_row.id, 'decision', use_row.decision, 'revision', use_row.revision);
end; $$;
revoke all on function public.decide_evidence_use(uuid,uuid,bigint,text,text) from public, anon;
grant execute on function public.decide_evidence_use(uuid,uuid,bigint,text,text) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Take an assignment to a newer published version of the same definition. Component instances are
-- re-pinned by component name; contributions the program left as seeded take the new narrative,
-- contributions changed locally keep their text and are reported as conflicting; obligations the
-- new version covers for the first time are seeded; the old assignment is superseded.
-- ---------------------------------------------------------------------------------------------
create function public.update_library_assignment(p_tenant_id uuid, p_assignment_id uuid, p_new_revision_id uuid, p_request_id uuid, p_rationale text)
returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
declare
  receipt public.library_apply_requests; payload_hash text; result jsonb;
  old_assignment public.library_assignments; old_revision public.component_definition_revisions; new_revision public.component_definition_revisions;
  new_assignment_id uuid; component public.system_components; old_defined public.defined_components; new_defined public.defined_components;
  contribution public.component_contributions; old_impl public.defined_component_implementations; new_impl public.defined_component_implementations;
  ssp_row public.ssp_revisions; ssp_state text; seeded jsonb; rationale text; target_system public.systems;
  updated_count integer := 0; kept_count integer := 0; conflicting_count integer := 0; seeded_count integer := 0; repinned integer := 0;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then raise exception 'Workspace write access is required' using errcode='42501'; end if;
  select * into old_assignment from public.library_assignments where tenant_id = p_tenant_id and id = p_assignment_id for update;
  if old_assignment.id is null then raise exception 'Assignment was not found' using errcode='23514'; end if;
  if old_assignment.state <> 'accepted' then raise exception 'This assignment has already been superseded' using errcode='23514'; end if;
  if old_assignment.source_revision_id is null then raise exception 'Only a component definition assignment can be updated' using errcode='23514'; end if;
  perform 1 from public.programs where tenant_id = p_tenant_id and id = old_assignment.program_id for no key update;
  payload_hash := encode(extensions.digest(jsonb_build_object('assignmentId', p_assignment_id, 'newRevisionId', p_new_revision_id, 'rationale', p_rationale)::text, 'sha256'), 'hex');
  select * into receipt from public.library_apply_requests where id = p_request_id;
  if found then
    if receipt.tenant_id <> p_tenant_id or receipt.payload_sha256 <> payload_hash then raise exception 'This update request has already been used for different changes' using errcode='PT409'; end if;
    return receipt.result;
  end if;
  select * into old_revision from public.component_definition_revisions where tenant_id = p_tenant_id and id = old_assignment.source_revision_id;
  select * into new_revision from public.component_definition_revisions where tenant_id = p_tenant_id and id = p_new_revision_id;
  if new_revision.id is null or new_revision.component_definition_id <> old_revision.component_definition_id then raise exception 'Choose a version of the same library definition' using errcode='23514'; end if;
  if new_revision.state <> 'published' then raise exception 'Only a published version can be taken' using errcode='23514'; end if;
  if new_revision.version_number <= old_revision.version_number then raise exception 'Choose a newer version than the one in use' using errcode='23514'; end if;
  rationale := nullif(btrim(p_rationale), '');
  if rationale is null then raise exception 'Record why this update is taken' using errcode='23514'; end if;
  insert into public.library_assignments(tenant_id, program_id, system_id, source_revision_id, include_descendants, control_ids, rationale, accepted_by, request_id)
    values (p_tenant_id, old_assignment.program_id, old_assignment.system_id, new_revision.id, old_assignment.include_descendants, old_assignment.control_ids, rationale, auth.uid(), p_request_id)
    returning id into new_assignment_id;
  for component in select * from public.system_components c where c.tenant_id = p_tenant_id and c.assignment_id = old_assignment.id order by c.code loop
    select * into old_defined from public.defined_components where tenant_id = p_tenant_id and id = component.defined_component_id;
    select * into new_defined from public.defined_components where tenant_id = p_tenant_id and component_definition_revision_id = new_revision.id and name = old_defined.name order by id limit 1;
    select * into target_system from public.systems where tenant_id = p_tenant_id and id = coalesce(component.system_element_id, component.system_id) for update;
    if new_defined.id is null then
      insert into public.library_assignment_targets(tenant_id, assignment_id, system_id, system_component_id, state, note)
        values (p_tenant_id, new_assignment_id, target_system.id, component.id, 'conflicting', 'The new version has no component named ' || old_defined.name || '; the instance keeps version ' || old_revision.version_number);
      conflicting_count := conflicting_count + 1;
      continue;
    end if;
    update public.system_components set defined_component_id = new_defined.id, version = new_revision.version_number::text, applied_rationale = rationale, applied_at = now(), applied_by = auth.uid(), assignment_id = new_assignment_id, revision = revision + 1
      where tenant_id = p_tenant_id and id = component.id;
    repinned := repinned + 1;
    select * into ssp_row from public.ssp_revisions where tenant_id = p_tenant_id and system_id = component.system_id and state = 'draft' order by version_number desc limit 1;
    for contribution in select * from public.component_contributions cc where cc.tenant_id = p_tenant_id and cc.system_component_id = component.id and cc.library_implementation_id is not null loop
      select * into old_impl from public.defined_component_implementations where tenant_id = p_tenant_id and id = contribution.library_implementation_id;
      select * into new_impl from public.defined_component_implementations where tenant_id = p_tenant_id and defined_component_id = new_defined.id and control_id = old_impl.control_id and control_part_id is not distinct from old_impl.control_part_id order by id limit 1;
      select state into ssp_state from public.ssp_revisions where tenant_id = p_tenant_id and id = contribution.ssp_revision_id;
      if new_impl.id is null then
        insert into public.library_assignment_targets(tenant_id, assignment_id, system_id, control_id, implementation_id, system_component_id, component_contribution_id, state, note)
          values (p_tenant_id, new_assignment_id, target_system.id, old_impl.control_id, old_impl.id, component.id, contribution.id, 'conflicting', 'The new version no longer covers this control; the local narrative is kept');
        conflicting_count := conflicting_count + 1;
      elsif ssp_state = 'published' then
        insert into public.library_assignment_targets(tenant_id, assignment_id, system_id, control_id, implementation_id, system_component_id, component_contribution_id, state, note)
          values (p_tenant_id, new_assignment_id, target_system.id, new_impl.control_id, new_impl.id, component.id, contribution.id, 'conflicting', 'The narrative sits in a published SSP revision and cannot change');
        conflicting_count := conflicting_count + 1;
      elsif contribution.description = old_impl.description and contribution.implementation_status = old_impl.implementation_status then
        update public.component_contributions set description = new_impl.description, implementation_status = new_impl.implementation_status, library_implementation_id = new_impl.id, revision = revision + 1
          where tenant_id = p_tenant_id and id = contribution.id;
        insert into public.library_assignment_targets(tenant_id, assignment_id, system_id, control_id, implementation_id, system_component_id, component_contribution_id, state)
          values (p_tenant_id, new_assignment_id, target_system.id, new_impl.control_id, new_impl.id, component.id, contribution.id, 'accepted');
        updated_count := updated_count + 1;
      else
        update public.component_contributions set library_implementation_id = new_impl.id, revision = revision + 1 where tenant_id = p_tenant_id and id = contribution.id;
        insert into public.library_assignment_targets(tenant_id, assignment_id, system_id, control_id, implementation_id, system_component_id, component_contribution_id, state, note)
          values (p_tenant_id, new_assignment_id, target_system.id, new_impl.control_id, new_impl.id, component.id, contribution.id, 'conflicting', 'Changed here; the local narrative is kept and the new library narrative is available to compare');
        kept_count := kept_count + 1;
      end if;
    end loop;
    for new_impl in select * from public.defined_component_implementations i where i.tenant_id = p_tenant_id and i.defined_component_id = new_defined.id and i.control_id is not null
      and (old_assignment.control_ids is null or i.control_id = any(old_assignment.control_ids))
      and not exists (select 1 from public.component_contributions cc join public.defined_component_implementations li on li.tenant_id = cc.tenant_id and li.id = cc.library_implementation_id
        where cc.tenant_id = p_tenant_id and cc.system_component_id = component.id and li.control_id = i.control_id and li.control_part_id is not distinct from i.control_part_id)
      order by i.id loop
      seeded := public.seed_library_contribution(p_tenant_id, old_assignment.program_id, new_assignment_id, target_system.id, component.id, ssp_row.id, ssp_row.profile_resolution_id, new_impl, false, 'Covered for the first time by version ' || new_revision.version_number);
      if seeded->>'state' = 'accepted' then seeded_count := seeded_count + 1; end if;
    end loop;
    update public.systems set revision = revision + 1 where tenant_id = p_tenant_id and id = target_system.id;
  end loop;
  update public.library_assignments set state = 'superseded', superseded_by_id = new_assignment_id, revision = revision + 1 where tenant_id = p_tenant_id and id = old_assignment.id;
  result := jsonb_build_object('assignmentId', new_assignment_id, 'supersededAssignmentId', old_assignment.id, 'repinned', repinned, 'updated', updated_count, 'keptLocal', kept_count, 'conflicting', conflicting_count, 'seeded', seeded_count);
  insert into public.library_apply_requests(id, tenant_id, program_id, payload_sha256, result, created_by) values (p_request_id, p_tenant_id, old_assignment.program_id, payload_hash, result, auth.uid());
  return result;
end; $$;
revoke all on function public.update_library_assignment(uuid,uuid,uuid,uuid,text) from public, anon;
grant execute on function public.update_library_assignment(uuid,uuid,uuid,uuid,text) to authenticated;
