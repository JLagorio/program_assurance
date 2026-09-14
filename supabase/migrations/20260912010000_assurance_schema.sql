-- Operational assurance records start empty. All relationships are foreign keys.

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  code text not null check (code is null or length(btrim(code)) > 0),
  name text not null check (name is null or length(btrim(name)) > 0),
  description text,
  status text not null default 'planned' check (status in ('planned', 'active', 'suspended', 'closed')),
  sponsor_party_id uuid,
  starts_on date,
  ends_on date,
  unique (tenant_id, id),
  unique (tenant_id, code),
  foreign key (tenant_id, sponsor_party_id) references public.parties(tenant_id, id),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

comment on table public.programs is 'An actual organizational program governing one or more system boundaries.';

select public.apply_tenant_security('programs');
select public.attach_record_lifecycle('programs', false);

create table public.program_role_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  program_id uuid not null,
  party_id uuid not null,
  role text not null check (role in ('program_manager', 'system_owner', 'security_officer', 'control_owner', 'assessor', 'reviewer', 'authorizing_official')),
  starts_on date,
  ends_on date,
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id),
  foreign key (tenant_id, party_id) references public.parties(tenant_id, id),
  unique (tenant_id, program_id, party_id, role),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

comment on table public.program_role_assignments is 'Named people or organizations responsible for an assurance role within a program.';

select public.apply_tenant_security('program_role_assignments');
select public.attach_record_lifecycle('program_role_assignments', false);

create table public.systems (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  program_id uuid not null,
  code text not null check (code is null or length(btrim(code)) > 0),
  name text not null check (name is null or length(btrim(name)) > 0),
  description text,
  system_type text not null check (system_type in ('information_system', 'industrial_control_system', 'platform', 'service')),
  lifecycle_status text not null default 'planned' check (lifecycle_status in ('planned', 'development', 'operational', 'retired')),
  authorization_status text not null default 'not_assessed' check (authorization_status in ('not_assessed', 'in_progress', 'authorized', 'denied', 'expired')),
  system_owner_party_id uuid,
  confidentiality_impact text check (confidentiality_impact in ('low', 'moderate', 'high')),
  integrity_impact text check (integrity_impact in ('low', 'moderate', 'high')),
  availability_impact text check (availability_impact in ('low', 'moderate', 'high')),
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id),
  foreign key (tenant_id, system_owner_party_id) references public.parties(tenant_id, id),
  unique (tenant_id, code),
  unique (tenant_id, program_id, id)
);

comment on table public.systems is 'A system or authorization boundary belonging to a program.';

select public.apply_tenant_security('systems');
select public.attach_record_lifecycle('systems', false);

create table public.composition_nodes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  system_id uuid not null,
  parent_id uuid,
  code text not null check (code is null or length(btrim(code)) > 0),
  name text not null check (name is null or length(btrim(name)) > 0),
  node_type text not null check (node_type in ('subsystem', 'hardware', 'software', 'network', 'service', 'facility', 'data', 'other')),
  description text,
  unique (tenant_id, id),
  foreign key (tenant_id, system_id) references public.systems(tenant_id, id),
  unique (tenant_id, system_id, id),
  unique (tenant_id, system_id, code),
  foreign key (tenant_id, system_id, parent_id) references public.composition_nodes(tenant_id, system_id, id),
  check (parent_id is null or parent_id <> id)
);

comment on table public.composition_nodes is 'Hierarchical system composition. Each node has at most one parent in the same system.';

select public.apply_tenant_security('composition_nodes');
select public.attach_record_lifecycle('composition_nodes', false);

create function public.guard_composition_tree() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- Serialize structural changes per system so two concurrent edits cannot form a cycle.
  perform 1 from public.systems where id = new.system_id and tenant_id = new.tenant_id for update;
  if new.parent_id is not null and exists (
    with recursive ancestors as (
      select id, parent_id from public.composition_nodes where id = new.parent_id and tenant_id = new.tenant_id and system_id = new.system_id
      union
      select n.id, n.parent_id from public.composition_nodes n join ancestors a on n.id = a.parent_id
        where n.tenant_id = new.tenant_id and n.system_id = new.system_id
    ) select 1 from ancestors where id = new.id
  ) then raise exception 'System composition must be acyclic' using errcode = '23514'; end if;
  return new;
end;
$$;
revoke all on function public.guard_composition_tree() from public, anon, authenticated;
create trigger composition_tree before insert or update of parent_id, system_id on public.composition_nodes for each row execute function public.guard_composition_tree();

create table public.component_relationships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  system_id uuid not null,
  source_node_id uuid not null,
  target_node_id uuid not null,
  relationship_type text not null check (relationship_type in ('depends_on', 'connects_to', 'sends_data_to', 'trusts', 'hosts')),
  description text,
  protocol text,
  port integer check (port between 1 and 65535),
  unique (tenant_id, id),
  foreign key (tenant_id, system_id) references public.systems(tenant_id, id),
  foreign key (tenant_id, system_id, source_node_id) references public.composition_nodes(tenant_id, system_id, id),
  foreign key (tenant_id, system_id, target_node_id) references public.composition_nodes(tenant_id, system_id, id),
  check (source_node_id <> target_node_id),
  unique (tenant_id, source_node_id, target_node_id, relationship_type)
);

comment on table public.component_relationships is 'Non-containment dependencies, connections, and data flows between system composition nodes.';

select public.apply_tenant_security('component_relationships');
select public.attach_record_lifecycle('component_relationships', false);

create table public.scopes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  system_id uuid not null,
  composition_node_id uuid,
  code text not null check (code is null or length(btrim(code)) > 0),
  name text not null check (name is null or length(btrim(name)) > 0),
  description text,
  confidentiality_impact text check (confidentiality_impact in ('low', 'moderate', 'high')),
  integrity_impact text check (integrity_impact in ('low', 'moderate', 'high')),
  availability_impact text check (availability_impact in ('low', 'moderate', 'high')),
  unique (tenant_id, id),
  foreign key (tenant_id, system_id) references public.systems(tenant_id, id),
  unique (tenant_id, system_id, id),
  unique (tenant_id, system_id, code),
  foreign key (tenant_id, system_id, composition_node_id) references public.composition_nodes(tenant_id, system_id, id)
);

comment on table public.scopes is 'A categorized subset of a system used for implementation or assessment scoping.';

select public.apply_tenant_security('scopes');
select public.attach_record_lifecycle('scopes', false);

create table public.scope_baselines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  scope_id uuid not null,
  profile_resolution_id uuid not null references public.profile_resolutions(id),
  adopted_at timestamptz not null,
  adopted_by_party_id uuid not null,
  rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, scope_id) references public.scopes(tenant_id, id),
  foreign key (tenant_id, adopted_by_party_id) references public.parties(tenant_id, id),
  unique (tenant_id, scope_id, profile_resolution_id)
);

comment on table public.scope_baselines is 'The resolved control baseline adopted by a particular scope, with actual adoption provenance.';

select public.apply_tenant_security('scope_baselines');
select public.attach_record_lifecycle('scope_baselines', false);

create table public.component_definitions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  code text not null check (code is null or length(btrim(code)) > 0),
  name text not null check (name is null or length(btrim(name)) > 0),
  description text,
  unique (tenant_id, id),
  unique (tenant_id, code)
);

comment on table public.component_definitions is 'Reusable implementation content with independent, publishable revisions.';

select public.apply_tenant_security('component_definitions');
select public.attach_record_lifecycle('component_definitions', false);

create table public.component_definition_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  component_definition_id uuid not null,
  version_number integer not null check (version_number > 0),
  state text not null default 'draft' check (state in ('draft', 'published')),
  published_at timestamptz,
  check ((state = 'published') = (published_at is not null)),
  oscal_uuid uuid,
  remarks text,
  unique (tenant_id, id),
  foreign key (tenant_id, component_definition_id) references public.component_definitions(tenant_id, id),
  unique (tenant_id, component_definition_id, version_number)
);

comment on table public.component_definition_revisions is 'An immutable published version of a reusable OSCAL-aligned component definition.';

select public.apply_tenant_security('component_definition_revisions');
select public.attach_record_lifecycle('component_definition_revisions', true);

create table public.defined_components (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  component_definition_revision_id uuid not null,
  name text not null check (name is null or length(btrim(name)) > 0),
  component_type text not null check (component_type in ('software', 'hardware', 'service', 'policy', 'process', 'validation', 'interconnection')),
  description text,
  oscal_uuid uuid,
  supplier_party_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, component_definition_revision_id) references public.component_definition_revisions(tenant_id, id),
  foreign key (tenant_id, supplier_party_id) references public.parties(tenant_id, id),
  unique (tenant_id, component_definition_revision_id, id)
);

comment on table public.defined_components is 'Reusable software, hardware, service, policy, process, or validation components in a definition revision.';

select public.apply_tenant_security('defined_components');
select public.attach_record_lifecycle('defined_components', false);

create table public.system_components (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  system_id uuid not null,
  defined_component_id uuid,
  code text not null check (code is null or length(btrim(code)) > 0),
  name text not null check (name is null or length(btrim(name)) > 0),
  component_type text not null check (component_type in ('software', 'hardware', 'service', 'policy', 'process', 'validation', 'interconnection')),
  status text not null default 'planned' check (status in ('planned', 'under_development', 'operational', 'disposition', 'other')),
  description text,
  version text,
  unique (tenant_id, id),
  foreign key (tenant_id, system_id) references public.systems(tenant_id, id),
  foreign key (tenant_id, defined_component_id) references public.defined_components(tenant_id, id),
  unique (tenant_id, system_id, id),
  unique (tenant_id, system_id, code)
);

comment on table public.system_components is 'A component used in a real system, optionally derived from a reusable definition.';

select public.apply_tenant_security('system_components');
select public.attach_record_lifecycle('system_components', false);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  system_id uuid not null,
  composition_node_id uuid not null,
  asset_id text not null check (asset_id is null or length(btrim(asset_id)) > 0),
  name text not null check (name is null or length(btrim(name)) > 0),
  description text,
  serial_number text,
  manufacturer text,
  model text,
  asset_owner_party_id uuid,
  installed_on date,
  retired_on date,
  unique (tenant_id, id),
  foreign key (tenant_id, system_id) references public.systems(tenant_id, id),
  foreign key (tenant_id, asset_owner_party_id) references public.parties(tenant_id, id),
  foreign key (tenant_id, system_id, composition_node_id) references public.composition_nodes(tenant_id, system_id, id),
  unique (tenant_id, system_id, id),
  unique (tenant_id, composition_node_id),
  unique (tenant_id, system_id, asset_id),
  check (retired_on is null or installed_on is null or retired_on >= installed_on)
);

comment on table public.inventory_items is 'A tracked deployed instance in system composition. Unknown asset fields remain null.';

select public.apply_tenant_security('inventory_items');
select public.attach_record_lifecycle('inventory_items', false);

create table public.inventory_components (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  system_id uuid not null,
  inventory_item_id uuid not null,
  system_component_id uuid not null,
  unique (tenant_id, id),
  foreign key (tenant_id, system_id) references public.systems(tenant_id, id),
  foreign key (tenant_id, system_id, inventory_item_id) references public.inventory_items(tenant_id, system_id, id),
  foreign key (tenant_id, system_id, system_component_id) references public.system_components(tenant_id, system_id, id),
  unique (tenant_id, inventory_item_id, system_component_id)
);

comment on table public.inventory_components is 'Components implemented by a particular deployed inventory item.';

select public.apply_tenant_security('inventory_components');
select public.attach_record_lifecycle('inventory_components', false);

create table public.security_processes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  program_id uuid not null,
  code text not null check (code is null or length(btrim(code)) > 0),
  name text not null check (name is null or length(btrim(name)) > 0),
  description text,
  owner_party_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id),
  foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id),
  unique (tenant_id, code)
);

comment on table public.security_processes is 'An actual repeatable security process that can receive requirement allocations.';

select public.apply_tenant_security('security_processes');
select public.attach_record_lifecycle('security_processes', false);

create table public.provider_capabilities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  code text not null check (code is null or length(btrim(code)) > 0),
  name text not null check (name is null or length(btrim(name)) > 0),
  description text,
  providing_system_id uuid,
  provider_party_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, providing_system_id) references public.systems(tenant_id, id),
  foreign key (tenant_id, provider_party_id) references public.parties(tenant_id, id),
  check (providing_system_id is not null or provider_party_id is not null),
  unique (tenant_id, code)
);

comment on table public.provider_capabilities is 'A named inherited capability provided by an actual system or organization.';

select public.apply_tenant_security('provider_capabilities');
select public.attach_record_lifecycle('provider_capabilities', false);

create table public.configuration_baselines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  system_id uuid not null,
  version_number integer not null check (version_number > 0),
  state text not null default 'draft' check (state in ('draft', 'published')),
  published_at timestamptz,
  check ((state = 'published') = (published_at is not null)),
  name text not null check (name is null or length(btrim(name)) > 0),
  description text,
  unique (tenant_id, id),
  foreign key (tenant_id, system_id) references public.systems(tenant_id, id),
  unique (tenant_id, system_id, id),
  unique (tenant_id, system_id, version_number)
);

comment on table public.configuration_baselines is 'A versioned system configuration frozen when published for reproducible assessment.';

select public.apply_tenant_security('configuration_baselines');
select public.attach_record_lifecycle('configuration_baselines', true);

create table public.component_pins (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  system_id uuid not null,
  configuration_baseline_id uuid not null,
  system_component_id uuid not null,
  defined_component_id uuid,
  version text,
  configuration_description text,
  content_sha256 text check (content_sha256 ~ '^[a-f0-9]{64}$'),
  unique (tenant_id, id),
  foreign key (tenant_id, defined_component_id) references public.defined_components(tenant_id, id),
  foreign key (tenant_id, system_id, configuration_baseline_id) references public.configuration_baselines(tenant_id, system_id, id),
  foreign key (tenant_id, system_id, system_component_id) references public.system_components(tenant_id, system_id, id),
  unique (tenant_id, configuration_baseline_id, system_component_id)
);

comment on table public.component_pins is 'The exact component version included in a configuration baseline.';

select public.apply_tenant_security('component_pins');
select public.attach_record_lifecycle('component_pins', false);

create table public.parameter_pins (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  configuration_baseline_id uuid not null,
  parameter_id uuid not null references public.parameters(id),
  value_ordinal integer not null check (value_ordinal > 0),
  value text not null check (value is null or length(btrim(value)) > 0),
  rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, configuration_baseline_id) references public.configuration_baselines(tenant_id, id),
  unique (tenant_id, configuration_baseline_id, parameter_id, value_ordinal)
);

comment on table public.parameter_pins is 'A recorded value for an OSCAL parameter at a frozen system configuration.';

select public.apply_tenant_security('parameter_pins');
select public.attach_record_lifecycle('parameter_pins', false);

create table public.ssp_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  system_id uuid not null,
  profile_resolution_id uuid not null references public.profile_resolutions(id),
  version_number integer not null check (version_number > 0),
  state text not null default 'draft' check (state in ('draft', 'published')),
  published_at timestamptz,
  check ((state = 'published') = (published_at is not null)),
  oscal_uuid uuid,
  description text,
  configuration_baseline_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, system_id) references public.systems(tenant_id, id),
  foreign key (tenant_id, system_id, configuration_baseline_id) references public.configuration_baselines(tenant_id, system_id, id),
  unique (tenant_id, system_id, id),
  unique (tenant_id, system_id, version_number)
);

comment on table public.ssp_revisions is 'A system security plan version bound to the exact resolved profile it implements.';

select public.apply_tenant_security('ssp_revisions');
select public.attach_record_lifecycle('ssp_revisions', true);

create table public.implemented_requirements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  ssp_revision_id uuid not null,
  selected_control_id uuid not null references public.selected_controls(id),
  implementation_status text not null default 'planned' check (implementation_status in ('planned', 'partial', 'implemented', 'alternative', 'not_applicable')),
  description text,
  responsible_party_id uuid,
  not_applicable_rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, ssp_revision_id) references public.ssp_revisions(tenant_id, id),
  foreign key (tenant_id, responsible_party_id) references public.parties(tenant_id, id),
  unique (tenant_id, ssp_revision_id, id),
  unique (tenant_id, ssp_revision_id, selected_control_id),
  check (implementation_status <> 'not_applicable' or (not_applicable_rationale is not null and length(btrim(not_applicable_rationale)) > 0))
);

comment on table public.implemented_requirements is 'An SSP implementation claim for exactly one selected control.';

select public.apply_tenant_security('implemented_requirements');
select public.attach_record_lifecycle('implemented_requirements', false);

create table public.implementation_statements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  ssp_revision_id uuid not null,
  implemented_requirement_id uuid not null,
  control_part_id uuid not null references public.control_parts(id),
  description text not null check (description is null or length(btrim(description)) > 0),
  unique (tenant_id, id),
  foreign key (tenant_id, ssp_revision_id, implemented_requirement_id) references public.implemented_requirements(tenant_id, ssp_revision_id, id),
  unique (tenant_id, implemented_requirement_id, id),
  unique (tenant_id, implemented_requirement_id, control_part_id)
);

comment on table public.implementation_statements is 'Statement-level implementation narrative beneath an SSP implemented requirement.';

select public.apply_tenant_security('implementation_statements');
select public.attach_record_lifecycle('implementation_statements', false);

create table public.component_contributions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  ssp_revision_id uuid not null,
  implemented_requirement_id uuid not null,
  implementation_statement_id uuid,
  system_component_id uuid not null,
  description text not null check (description is null or length(btrim(description)) > 0),
  implementation_status text not null default 'planned' check (implementation_status in ('planned', 'partial', 'implemented', 'alternative', 'not_applicable')),
  responsible_party_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, ssp_revision_id, implemented_requirement_id) references public.implemented_requirements(tenant_id, ssp_revision_id, id),
  foreign key (tenant_id, implemented_requirement_id, implementation_statement_id) references public.implementation_statements(tenant_id, implemented_requirement_id, id),
  foreign key (tenant_id, system_component_id) references public.system_components(tenant_id, id),
  foreign key (tenant_id, responsible_party_id) references public.parties(tenant_id, id),
  unique (tenant_id, ssp_revision_id, id)
);

comment on table public.component_contributions is 'A system component contribution to a control implementation or one of its statements.';

select public.apply_tenant_security('component_contributions');
select public.attach_record_lifecycle('component_contributions', false);

create table public.offered_implementations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  provider_capability_id uuid not null,
  ssp_revision_id uuid not null,
  component_contribution_id uuid not null,
  name text not null check (name is null or length(btrim(name)) > 0),
  description text,
  consumer_responsibility text,
  unique (tenant_id, id),
  foreign key (tenant_id, provider_capability_id) references public.provider_capabilities(tenant_id, id),
  foreign key (tenant_id, ssp_revision_id, component_contribution_id) references public.component_contributions(tenant_id, ssp_revision_id, id),
  unique (tenant_id, provider_capability_id, component_contribution_id)
);

comment on table public.offered_implementations is 'A provider implementation offered for inheritance, pinned to a published SSP contribution.';

select public.apply_tenant_security('offered_implementations');
select public.attach_record_lifecycle('offered_implementations', false);

create table public.inheritance_acceptances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  ssp_revision_id uuid not null,
  implemented_requirement_id uuid not null,
  offered_implementation_id uuid not null,
  accepted_by_party_id uuid not null,
  accepted_at timestamptz not null,
  rationale text not null check (rationale is null or length(btrim(rationale)) > 0),
  consumer_responsibility text,
  unique (tenant_id, id),
  foreign key (tenant_id, ssp_revision_id, implemented_requirement_id) references public.implemented_requirements(tenant_id, ssp_revision_id, id),
  foreign key (tenant_id, offered_implementation_id) references public.offered_implementations(tenant_id, id),
  foreign key (tenant_id, accepted_by_party_id) references public.parties(tenant_id, id),
  unique (tenant_id, implemented_requirement_id, offered_implementation_id)
);

comment on table public.inheritance_acceptances is 'A consumer acceptance of a specific offered implementation with recorded responsibility and approver.';

select public.apply_tenant_security('inheritance_acceptances');
select public.attach_record_lifecycle('inheritance_acceptances', false);

create table public.engineering_requirements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  program_id uuid not null,
  code text not null check (code is null or length(btrim(code)) > 0),
  unique (tenant_id, id),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id),
  unique (tenant_id, program_id, code),
  unique (tenant_id, program_id, id)
);

comment on table public.engineering_requirements is 'Stable identities of authored engineering requirements, independent from control mappings.';

select public.apply_tenant_security('engineering_requirements');
select public.attach_record_lifecycle('engineering_requirements', false);

create table public.requirement_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  engineering_requirement_id uuid not null,
  version_number integer not null check (version_number > 0),
  state text not null default 'draft' check (state in ('draft', 'published')),
  published_at timestamptz,
  check ((state = 'published') = (published_at is not null)),
  title text not null check (title is null or length(btrim(title)) > 0),
  statement text not null check (statement is null or length(btrim(statement)) > 0),
  rationale text,
  acceptance_criteria text not null check (acceptance_criteria is null or length(btrim(acceptance_criteria)) > 0),
  requirement_type text not null check (requirement_type in ('functional', 'performance', 'interface', 'security', 'safety', 'design', 'operational', 'other')),
  owner_party_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, engineering_requirement_id) references public.engineering_requirements(tenant_id, id),
  foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id),
  unique (tenant_id, engineering_requirement_id, version_number)
);

comment on table public.requirement_revisions is 'A version of an authored requirement with explicit acceptance criteria and lifecycle.';

select public.apply_tenant_security('requirement_revisions');
select public.attach_record_lifecycle('requirement_revisions', true);

create table public.requirement_decompositions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  parent_requirement_revision_id uuid not null,
  child_requirement_revision_id uuid not null,
  rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, parent_requirement_revision_id) references public.requirement_revisions(tenant_id, id),
  foreign key (tenant_id, child_requirement_revision_id) references public.requirement_revisions(tenant_id, id),
  check (parent_requirement_revision_id <> child_requirement_revision_id),
  unique (tenant_id, parent_requirement_revision_id, child_requirement_revision_id)
);

comment on table public.requirement_decompositions is 'Parent-child derivation of versioned engineering requirements.';

select public.apply_tenant_security('requirement_decompositions');
select public.attach_record_lifecycle('requirement_decompositions', false);

create table public.requirement_control_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  requirement_revision_id uuid not null,
  control_part_id uuid not null references public.control_parts(id),
  relationship_type text not null check (relationship_type in ('derived_from', 'maps_to', 'satisfies')),
  rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, requirement_revision_id) references public.requirement_revisions(tenant_id, id),
  unique (tenant_id, requirement_revision_id, control_part_id, relationship_type)
);

comment on table public.requirement_control_links is 'Explicit derivation, mapping, or satisfaction claims from requirements to reference control parts.';

select public.apply_tenant_security('requirement_control_links');
select public.attach_record_lifecycle('requirement_control_links', false);

create table public.requirement_allocations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  requirement_revision_id uuid not null,
  composition_node_id uuid,
  provider_capability_id uuid,
  security_process_id uuid,
  rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, requirement_revision_id) references public.requirement_revisions(tenant_id, id),
  foreign key (tenant_id, composition_node_id) references public.composition_nodes(tenant_id, id),
  foreign key (tenant_id, provider_capability_id) references public.provider_capabilities(tenant_id, id),
  foreign key (tenant_id, security_process_id) references public.security_processes(tenant_id, id),
  check (num_nonnulls(composition_node_id, provider_capability_id, security_process_id) = 1)
);

comment on table public.requirement_allocations is 'Allocation of a requirement revision to exactly one composition node, provider capability, or security process.';

select public.apply_tenant_security('requirement_allocations');
select public.attach_record_lifecycle('requirement_allocations', false);

create table public.requirement_applicability (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  requirement_revision_id uuid not null,
  scope_id uuid not null,
  decision text not null check (decision in ('applicable', 'not_applicable', 'conditionally_applicable')),
  rationale text not null check (rationale is null or length(btrim(rationale)) > 0),
  decided_by_party_id uuid not null,
  decided_at timestamptz not null,
  unique (tenant_id, id),
  foreign key (tenant_id, requirement_revision_id) references public.requirement_revisions(tenant_id, id),
  foreign key (tenant_id, scope_id) references public.scopes(tenant_id, id),
  foreign key (tenant_id, decided_by_party_id) references public.parties(tenant_id, id),
  unique (tenant_id, requirement_revision_id, scope_id)
);

comment on table public.requirement_applicability is 'An explicit decision about whether a requirement applies to a particular system scope.';

select public.apply_tenant_security('requirement_applicability');
select public.attach_record_lifecycle('requirement_applicability', false);

create table public.requirement_implementations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  requirement_revision_id uuid not null,
  component_contribution_id uuid not null,
  rationale text,
  unique (tenant_id, id),
  foreign key (tenant_id, requirement_revision_id) references public.requirement_revisions(tenant_id, id),
  foreign key (tenant_id, component_contribution_id) references public.component_contributions(tenant_id, id),
  unique (tenant_id, requirement_revision_id, component_contribution_id)
);

comment on table public.requirement_implementations is 'Traceability from an authored requirement revision to its actual SSP component contribution.';

select public.apply_tenant_security('requirement_implementations');
select public.attach_record_lifecycle('requirement_implementations', false);

select public.attach_parent_immutability('defined_components', 'component_definition_revisions', 'component_definition_revision_id');

select public.attach_parent_immutability('component_pins', 'configuration_baselines', 'configuration_baseline_id');

select public.attach_parent_immutability('parameter_pins', 'configuration_baselines', 'configuration_baseline_id');

select public.attach_parent_immutability('implemented_requirements', 'ssp_revisions', 'ssp_revision_id');

select public.attach_parent_immutability('implementation_statements', 'ssp_revisions', 'ssp_revision_id');

select public.attach_parent_immutability('component_contributions', 'ssp_revisions', 'ssp_revision_id');

select public.attach_parent_immutability('inheritance_acceptances', 'ssp_revisions', 'ssp_revision_id');

select public.attach_parent_immutability('requirement_decompositions', 'requirement_revisions', 'parent_requirement_revision_id');

select public.attach_parent_immutability('requirement_control_links', 'requirement_revisions', 'requirement_revision_id');

select public.attach_parent_immutability('requirement_allocations', 'requirement_revisions', 'requirement_revision_id');

select public.attach_reference_tenant_guard('scope_baselines', 'profile_resolution_id', 'profile_resolutions');

select public.attach_reference_tenant_guard('parameter_pins', 'parameter_id', 'parameters');

select public.attach_reference_tenant_guard('ssp_revisions', 'profile_resolution_id', 'profile_resolutions');

select public.attach_reference_tenant_guard('implemented_requirements', 'selected_control_id', 'selected_controls');

select public.attach_reference_tenant_guard('implementation_statements', 'control_part_id', 'control_parts');

select public.attach_reference_tenant_guard('requirement_control_links', 'control_part_id', 'control_parts');

-- Reusable components retain their own implementation content before system adoption.
create table public.defined_component_implementations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  component_definition_revision_id uuid not null,
  defined_component_id uuid not null,
  control_id uuid not null references public.controls(id),
  control_part_id uuid references public.control_parts(id),
  description text not null check (length(btrim(description)) > 0),
  implementation_status text not null check (implementation_status in ('planned', 'partial', 'implemented', 'alternative', 'not_applicable')),
  unique (tenant_id, id),
  foreign key (tenant_id, component_definition_revision_id, defined_component_id)
    references public.defined_components(tenant_id, component_definition_revision_id, id)
);
comment on table public.defined_component_implementations is 'Reusable implementation narrative for a control or statement in a component definition revision.';
select public.apply_tenant_security('defined_component_implementations');
select public.attach_record_lifecycle('defined_component_implementations');
select public.attach_parent_immutability('defined_component_implementations', 'component_definition_revisions', 'component_definition_revision_id');
select public.attach_reference_tenant_guard('defined_component_implementations', 'control_id', 'controls');
select public.attach_reference_tenant_guard('defined_component_implementations', 'control_part_id', 'control_parts');

alter table public.offered_implementations
  add column state text not null default 'draft' check (state in ('draft', 'published')),
  add column published_at timestamptz,
  add constraint offered_implementation_publication check ((state = 'published') = (published_at is not null));
drop trigger record_lifecycle on public.offered_implementations;
select public.attach_record_lifecycle('offered_implementations', true);

alter table public.ssp_revisions add column oscal_document_revision_id uuid references public.oscal_document_revisions(id);
alter table public.component_definition_revisions add column oscal_document_revision_id uuid references public.oscal_document_revisions(id);
select public.attach_reference_tenant_guard('ssp_revisions', 'oscal_document_revision_id', 'oscal_document_revisions');
select public.attach_reference_tenant_guard('component_definition_revisions', 'oscal_document_revision_id', 'oscal_document_revisions');

-- Context checks complement tenant FKs: a valid UUID from the wrong control or
-- system is still not a valid implementation relationship.
create function public.guard_assurance_context() returns trigger
language plpgsql security definer set search_path = '' as $$
declare expected_id uuid; actual_id uuid; expected_state text;
begin
  if tg_table_name = 'implemented_requirements' then
    select profile_resolution_id into expected_id from public.ssp_revisions where id = new.ssp_revision_id;
    select profile_resolution_id into actual_id from public.selected_controls where id = new.selected_control_id;
    if expected_id is distinct from actual_id then
      raise exception 'Selected control must belong to the SSP profile resolution' using errcode = '23514';
    end if;
  elsif tg_table_name = 'implementation_statements' then
    select sc.control_id into expected_id from public.implemented_requirements ir
      join public.selected_controls sc on sc.id = ir.selected_control_id where ir.id = new.implemented_requirement_id;
    select control_id into actual_id from public.control_parts where id = new.control_part_id;
    if expected_id is distinct from actual_id then
      raise exception 'Statement must belong to the implemented control' using errcode = '23514';
    end if;
  elsif tg_table_name = 'component_contributions' then
    select system_id into expected_id from public.ssp_revisions where id = new.ssp_revision_id;
    select system_id into actual_id from public.system_components where id = new.system_component_id;
    if expected_id is distinct from actual_id then
      raise exception 'Contributing component must belong to the SSP system' using errcode = '23514';
    end if;
  elsif tg_table_name = 'defined_component_implementations' and to_jsonb(new)->>'control_part_id' is not null then
    select control_id into expected_id from public.control_parts where id = new.control_part_id;
    if expected_id is distinct from new.control_id then
      raise exception 'Component statement must belong to its control' using errcode = '23514';
    end if;
  elsif tg_table_name = 'ssp_revisions' and to_jsonb(new)->>'state' = 'published' then
    if not exists (select 1 from public.implemented_requirements where ssp_revision_id = new.id) then
      raise exception 'An SSP must contain control implementations before publication' using errcode = '23514';
    end if;
    select state::text into expected_state from public.profile_resolutions where id = new.profile_resolution_id for share;
    if expected_state is distinct from 'published' then
      raise exception 'Publish the resolved profile before publishing the SSP' using errcode = '23514';
    end if;
    if new.configuration_baseline_id is not null then
      select state into expected_state from public.configuration_baselines where id = new.configuration_baseline_id for share;
      if expected_state is distinct from 'published' then
        raise exception 'An SSP must pin a published configuration baseline' using errcode = '23514';
      end if;
    end if;
  elsif tg_table_name = 'offered_implementations' and to_jsonb(new)->>'state' = 'published' then
    select state into expected_state from public.ssp_revisions where id = new.ssp_revision_id for share;
    if expected_state is distinct from 'published' then
      raise exception 'An inheritance offering must pin a published provider SSP' using errcode = '23514';
    end if;
  elsif tg_table_name = 'inheritance_acceptances' then
    select state into expected_state from public.offered_implementations where id = new.offered_implementation_id for share;
    if expected_state is distinct from 'published' then
      raise exception 'Only published provider offerings can be accepted' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_assurance_context() from public, anon, authenticated;
do $$ declare t text; begin
  foreach t in array array['implemented_requirements', 'implementation_statements', 'component_contributions', 'defined_component_implementations', 'ssp_revisions', 'offered_implementations', 'inheritance_acceptances'] loop
    execute format('create trigger assurance_context before insert or update on public.%I for each row execute function public.guard_assurance_context()', t);
  end loop;
end $$;

comment on column public.programs.code is 'User-assigned program identifier; unique in this workspace.';
comment on column public.systems.code is 'User-assigned system identifier; unique in this workspace.';
comment on column public.systems.authorization_status is 'Recorded authorization state; never inferred from readiness or evidence counts.';
comment on column public.systems.confidentiality_impact is 'Determined confidentiality impact; null until categorized.';
comment on column public.systems.integrity_impact is 'Determined integrity impact; null until categorized.';
comment on column public.systems.availability_impact is 'Determined availability impact; null until categorized.';
comment on column public.composition_nodes.parent_id is 'Optional parent within the same system. Cycles are rejected.';
comment on column public.ssp_revisions.profile_resolution_id is 'Exact resolved control baseline implemented by this SSP version.';
comment on column public.implemented_requirements.implementation_status is 'Implementation claim, separate from assessment determination and risk acceptance.';
comment on column public.requirement_revisions.acceptance_criteria is 'Objective, authored conditions under which the requirement is met.';
comment on column public.requirement_allocations.composition_node_id is 'Set exactly one allocation target: composition node, provider capability, or security process.';
comment on column public.component_pins.version is 'Actual version observed or selected for this baseline; null if not recorded.';

create function public.guard_assurance_publication() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.state <> 'published' then return new; end if;
  if tg_table_name = 'component_definition_revisions' then
    if not exists (select 1 from public.defined_components where component_definition_revision_id = new.id) then
      raise exception 'A component definition must contain components before publication' using errcode = '23514';
    end if;
  elsif tg_table_name = 'configuration_baselines' then
    if not exists (select 1 from public.component_pins where configuration_baseline_id = new.id) then
      raise exception 'A configuration baseline must pin components before publication' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_assurance_publication() from public, anon, authenticated;
create trigger assurance_publication before insert or update on public.component_definition_revisions for each row execute function public.guard_assurance_publication();
create trigger assurance_publication before insert or update on public.configuration_baselines for each row execute function public.guard_assurance_publication();

-- Identity-defining context is stable even while narrative fields are draft.
-- This prevents edits to a parent from silently invalidating existing children.
create function public.guard_stable_assurance_context() returns trigger
language plpgsql set search_path = '' as $$
declare column_name text;
begin
  foreach column_name in array tg_argv loop
    if to_jsonb(new)->column_name is distinct from to_jsonb(old)->column_name then
      raise exception 'The % context cannot change; create a new record or revision', column_name using errcode = '23514';
    end if;
  end loop;
  return new;
end;
$$;
revoke all on function public.guard_stable_assurance_context() from public, anon, authenticated;
create trigger stable_context before update on public.systems for each row execute function public.guard_stable_assurance_context('program_id');
create trigger stable_context before update on public.composition_nodes for each row execute function public.guard_stable_assurance_context('system_id');
create trigger stable_context before update on public.scopes for each row execute function public.guard_stable_assurance_context('system_id');
create trigger stable_context before update on public.system_components for each row execute function public.guard_stable_assurance_context('system_id');
create trigger stable_context before update on public.configuration_baselines for each row execute function public.guard_stable_assurance_context('system_id');
create trigger stable_context before update on public.ssp_revisions for each row execute function public.guard_stable_assurance_context('system_id', 'profile_resolution_id');
create trigger stable_context before update on public.implemented_requirements for each row execute function public.guard_stable_assurance_context('ssp_revision_id', 'selected_control_id');
create trigger stable_context before update on public.implementation_statements for each row execute function public.guard_stable_assurance_context('ssp_revision_id', 'implemented_requirement_id', 'control_part_id');
create trigger stable_context before update on public.component_contributions for each row execute function public.guard_stable_assurance_context('ssp_revision_id', 'implemented_requirement_id', 'implementation_statement_id', 'system_component_id');
create trigger stable_context before update on public.component_definition_revisions for each row execute function public.guard_stable_assurance_context('component_definition_id');
create trigger stable_context before update on public.defined_components for each row execute function public.guard_stable_assurance_context('component_definition_revision_id');
create trigger stable_context before update on public.engineering_requirements for each row execute function public.guard_stable_assurance_context('program_id');
create trigger stable_context before update on public.requirement_revisions for each row execute function public.guard_stable_assurance_context('engineering_requirement_id');

create function public.guard_requirement_context() returns trigger
language plpgsql security definer set search_path = '' as $$
declare expected_program uuid; actual_program uuid;
begin
  if tg_table_name = 'requirement_decompositions' then
    select er.program_id into expected_program from public.requirement_revisions rr join public.engineering_requirements er on er.id = rr.engineering_requirement_id where rr.id = new.parent_requirement_revision_id;
    select er.program_id into actual_program from public.requirement_revisions rr join public.engineering_requirements er on er.id = rr.engineering_requirement_id where rr.id = new.child_requirement_revision_id;
    if expected_program is distinct from actual_program then
      raise exception 'Requirement decomposition must stay within one program' using errcode = '23514';
    end if;
    perform 1 from public.programs where id = expected_program for update;
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
revoke all on function public.guard_requirement_context() from public, anon, authenticated;
create trigger requirement_context before insert or update on public.requirement_decompositions for each row execute function public.guard_requirement_context();
create trigger requirement_context before insert or update on public.requirement_allocations for each row execute function public.guard_requirement_context();
create trigger requirement_context before insert or update on public.requirement_applicability for each row execute function public.guard_requirement_context();
create trigger requirement_context before insert or update on public.requirement_implementations for each row execute function public.guard_requirement_context();

alter table public.requirement_allocations add constraint requirement_allocation_target_unique
  unique nulls not distinct (tenant_id, requirement_revision_id, composition_node_id, provider_capability_id, security_process_id);
alter table public.component_contributions add constraint component_contribution_context_unique
  unique nulls not distinct (tenant_id, implemented_requirement_id, implementation_statement_id, system_component_id);
alter table public.defined_component_implementations add constraint defined_component_implementation_target_unique
  unique nulls not distinct (tenant_id, defined_component_id, control_id, control_part_id);
