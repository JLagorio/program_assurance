-- OSCAL reference and document layer. Source identifiers are never primary keys.
-- A NULL tenant owns a shared reference release; only the importer can write it.
create type public.oscal_model as enum ('catalog', 'profile', 'component-definition', 'system-security-plan', 'assessment-plan', 'assessment-results', 'plan-of-action-and-milestones', 'mapping-collection');
create type public.reference_revision_state as enum ('draft', 'published');
create type public.control_publication_status as enum ('active', 'withdrawn');
create type public.parameter_selection_count as enum ('one', 'one-or-more');
create type public.profile_rule_kind as enum ('include', 'exclude', 'merge', 'set-parameter', 'alter');
create type public.mapping_relationship as enum ('equivalent-to', 'subset-of', 'superset-of', 'intersects-with', 'no-relationship');
create type public.mapping_endpoint_side as enum ('source', 'target');
create type public.cci_status as enum ('draft', 'active', 'deprecated');
create type public.cci_type as enum ('policy', 'technical');
create type public.reference_resolution_status as enum ('resolved', 'unresolved', 'unsupported-publication');

create table public.ref_sources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  code text not null check (btrim(code) <> ''),
  title text not null check (btrim(title) <> ''),
  authority text not null check (btrim(authority) <> ''),
  source_uri text not null check (btrim(source_uri) <> ''),
  authoritative boolean not null,
  rights text,
  notes text,
  unique nulls not distinct (tenant_id, code)
);

create table public.oscal_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  source_id uuid references public.ref_sources(id),
  model public.oscal_model not null,
  title text not null check (btrim(title) <> ''),
  code text not null check (btrim(code) <> ''),
  unique nulls not distinct (tenant_id, code)
);

create table public.oscal_document_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  document_id uuid not null references public.oscal_documents(id),
  source_uuid uuid not null,
  document_version text not null check (btrim(document_version) <> ''),
  oscal_version text not null check (oscal_version ~ '^\d+\.\d+\.\d+([+-].*)?$'),
  title text not null check (btrim(title) <> ''),
  last_modified timestamptz not null,
  original_uri text,
  content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  original_content jsonb not null check (jsonb_typeof(original_content) = 'object'),
  metadata jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object'),
  state public.reference_revision_state not null default 'draft',
  published_at timestamptz,
  check ((state = 'published') = (published_at is not null)),
  unique (document_id, content_sha256)
);

create table public.oscal_document_imports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  document_revision_id uuid not null references public.oscal_document_revisions(id),
  referenced_revision_id uuid references public.oscal_document_revisions(id),
  href text not null check (btrim(href) <> ''),
  resolved_uri text,
  resolution_status public.reference_resolution_status not null,
  ordinal integer not null check (ordinal >= 0),
  check (document_revision_id is distinct from referenced_revision_id),
  check ((resolution_status = 'resolved') = (referenced_revision_id is not null)),
  unique (document_revision_id, ordinal)
);

create table public.oscal_document_resources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  document_revision_id uuid not null references public.oscal_document_revisions(id),
  source_uuid uuid not null,
  title text,
  description text,
  citation text,
  source_content jsonb not null check (jsonb_typeof(source_content) = 'object'),
  unique (document_revision_id, source_uuid)
);

create table public.catalogs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  source_id uuid not null references public.ref_sources(id),
  code text not null check (btrim(code) <> ''),
  title text not null check (btrim(title) <> ''),
  unique nulls not distinct (tenant_id, code)
);

create table public.catalog_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  catalog_id uuid not null references public.catalogs(id),
  document_revision_id uuid not null unique references public.oscal_document_revisions(id),
  version text not null check (btrim(version) <> ''),
  title text not null check (btrim(title) <> ''),
  state public.reference_revision_state not null default 'draft'
);

create table public.catalog_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  catalog_revision_id uuid not null references public.catalog_revisions(id),
  parent_group_id uuid,
  source_id text,
  source_pointer text not null,
  class text,
  title text,
  ordinal integer not null check (ordinal >= 0),
  props jsonb not null default '[]' check (jsonb_typeof(props) = 'array'),
  links jsonb not null default '[]' check (jsonb_typeof(links) = 'array'),
  unique (id, catalog_revision_id),
  unique (catalog_revision_id, source_id),
  unique (catalog_revision_id, source_pointer),
  foreign key (parent_group_id, catalog_revision_id) references public.catalog_groups(id, catalog_revision_id),
  check (id is distinct from parent_group_id)
);

create table public.controls (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  catalog_revision_id uuid not null references public.catalog_revisions(id),
  group_id uuid,
  parent_control_id uuid,
  source_id text not null check (btrim(source_id) <> ''),
  code text not null check (btrim(code) <> ''),
  title text not null check (btrim(title) <> ''),
  class text,
  status public.control_publication_status not null default 'active',
  ordinal integer not null check (ordinal >= 0),
  props jsonb not null default '[]' check (jsonb_typeof(props) = 'array'),
  unique (id, catalog_revision_id),
  unique (catalog_revision_id, source_id),
  unique (catalog_revision_id, code),
  foreign key (group_id, catalog_revision_id) references public.catalog_groups(id, catalog_revision_id),
  foreign key (parent_control_id, catalog_revision_id) references public.controls(id, catalog_revision_id),
  check (id is distinct from parent_control_id)
);

create table public.control_parts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  catalog_revision_id uuid not null references public.catalog_revisions(id),
  control_id uuid,
  group_id uuid,
  parent_part_id uuid,
  source_id text,
  source_pointer text not null,
  name text not null check (btrim(name) <> ''),
  namespace text,
  class text,
  title text,
  prose text,
  ordinal integer not null check (ordinal >= 0),
  props jsonb not null default '[]' check (jsonb_typeof(props) = 'array'),
  links jsonb not null default '[]' check (jsonb_typeof(links) = 'array'),
  unique (id, catalog_revision_id),
  unique (catalog_revision_id, source_id),
  unique (catalog_revision_id, source_pointer),
  foreign key (control_id, catalog_revision_id) references public.controls(id, catalog_revision_id),
  foreign key (group_id, catalog_revision_id) references public.catalog_groups(id, catalog_revision_id),
  foreign key (parent_part_id, catalog_revision_id) references public.control_parts(id, catalog_revision_id),
  check (num_nonnulls(control_id, group_id) <= 1),
  check (id is distinct from parent_part_id)
);

create table public.parameters (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  catalog_revision_id uuid not null references public.catalog_revisions(id),
  control_id uuid,
  group_id uuid,
  source_id text not null check (btrim(source_id) <> ''),
  class text,
  label text,
  usage text,
  depends_on text,
  selection_count public.parameter_selection_count,
  has_selection boolean not null default false,
  ordinal integer not null check (ordinal >= 0),
  props jsonb not null default '[]' check (jsonb_typeof(props) = 'array'),
  links jsonb not null default '[]' check (jsonb_typeof(links) = 'array'),
  remarks text,
  unique (catalog_revision_id, source_id),
  foreign key (control_id, catalog_revision_id) references public.controls(id, catalog_revision_id),
  foreign key (group_id, catalog_revision_id) references public.catalog_groups(id, catalog_revision_id),
  check (num_nonnulls(control_id, group_id) <= 1),
  check (has_selection or selection_count is null)
);

create table public.parameter_values (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  parameter_id uuid not null references public.parameters(id),
  ordinal integer not null check (ordinal >= 0), value text not null,
  unique (parameter_id, ordinal)
);
create table public.parameter_choices (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  parameter_id uuid not null references public.parameters(id),
  ordinal integer not null check (ordinal >= 0), value text not null,
  unique (parameter_id, ordinal)
);
create table public.parameter_constraints (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  parameter_id uuid not null references public.parameters(id),
  ordinal integer not null check (ordinal >= 0), description text,
  tests jsonb not null default '[]' check (jsonb_typeof(tests) = 'array'),
  unique (parameter_id, ordinal)
);
create table public.parameter_guidelines (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  parameter_id uuid not null references public.parameters(id),
  ordinal integer not null check (ordinal >= 0), prose text not null,
  unique (parameter_id, ordinal)
);

create table public.control_links (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  control_id uuid not null references public.controls(id),
  ordinal integer not null check (ordinal >= 0),
  href text not null check (btrim(href) <> ''), relation text, text text, media_type text,
  target_control_id uuid references public.controls(id),
  target_part_id uuid references public.control_parts(id),
  target_group_id uuid references public.catalog_groups(id),
  resource_id uuid references public.oscal_document_resources(id),
  check (num_nonnulls(target_control_id, target_part_id, target_group_id, resource_id) <= 1),
  unique (control_id, ordinal)
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  source_id uuid references public.ref_sources(id),
  code text not null check (btrim(code) <> ''),
  title text not null check (btrim(title) <> ''),
  unique nulls not distinct (tenant_id, code)
);
create table public.profile_revisions (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  profile_id uuid not null references public.profiles(id),
  document_revision_id uuid not null unique references public.oscal_document_revisions(id),
  version text not null check (btrim(version) <> ''),
  title text not null check (btrim(title) <> ''),
  state public.reference_revision_state not null default 'draft'
);
create table public.profile_imports (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  profile_revision_id uuid not null references public.profile_revisions(id),
  catalog_revision_id uuid references public.catalog_revisions(id),
  imported_profile_revision_id uuid references public.profile_revisions(id),
  document_import_id uuid references public.oscal_document_imports(id),
  href text not null check (btrim(href) <> ''),
  ordinal integer not null check (ordinal >= 0),
  include_all boolean not null default false,
  check (num_nonnulls(catalog_revision_id, imported_profile_revision_id) = 1),
  check (profile_revision_id is distinct from imported_profile_revision_id),
  unique (id, profile_revision_id),
  unique (profile_revision_id, ordinal)
);
create table public.profile_rules (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  profile_revision_id uuid not null references public.profile_revisions(id),
  profile_import_id uuid,
  kind public.profile_rule_kind not null,
  ordinal integer not null check (ordinal >= 0),
  source_pointer text not null,
  definition jsonb not null check (jsonb_typeof(definition) = 'object'),
  rationale text,
  foreign key (profile_import_id, profile_revision_id) references public.profile_imports(id, profile_revision_id),
  check ((kind in ('include', 'exclude')) = (profile_import_id is not null)),
  unique (profile_revision_id, source_pointer)
);
create table public.profile_parameter_settings (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  profile_revision_id uuid not null references public.profile_revisions(id),
  parameter_id uuid references public.parameters(id),
  parameter_source_id text not null check (btrim(parameter_source_id) <> ''),
  label text, usage text, rationale text,
  unique (profile_revision_id, parameter_source_id)
);
create table public.profile_parameter_values (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  setting_id uuid not null references public.profile_parameter_settings(id),
  ordinal integer not null check (ordinal >= 0), value text not null,
  unique (setting_id, ordinal)
);
create table public.profile_resolutions (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  profile_revision_id uuid not null references public.profile_revisions(id),
  resolver_name text not null check (btrim(resolver_name) <> ''),
  resolver_version text not null check (btrim(resolver_version) <> ''),
  input_sha256 text not null check (input_sha256 ~ '^[a-f0-9]{64}$'),
  output_sha256 text not null check (output_sha256 ~ '^[a-f0-9]{64}$'),
  resolved_at timestamptz not null default now(),
  state public.reference_revision_state not null default 'draft',
  unique (profile_revision_id, input_sha256, resolver_name, resolver_version)
);
create table public.profile_resolution_inputs (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  profile_resolution_id uuid not null references public.profile_resolutions(id),
  document_revision_id uuid not null references public.oscal_document_revisions(id),
  ordinal integer not null check (ordinal >= 0),
  unique (profile_resolution_id, document_revision_id),
  unique (profile_resolution_id, ordinal)
);
create table public.selected_controls (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  profile_resolution_id uuid not null references public.profile_resolutions(id),
  control_id uuid not null references public.controls(id),
  ordinal integer not null check (ordinal >= 0),
  unique (profile_resolution_id, control_id),
  unique (profile_resolution_id, ordinal)
);
create table public.selection_provenance (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  selected_control_id uuid not null references public.selected_controls(id),
  profile_import_id uuid not null references public.profile_imports(id),
  profile_rule_id uuid references public.profile_rules(id),
  source_pointer text not null,
  rationale text,
  unique (selected_control_id, profile_import_id, source_pointer)
);

create table public.mapping_collections (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  source_id uuid references public.ref_sources(id),
  document_revision_id uuid references public.oscal_document_revisions(id),
  code text not null check (btrim(code) <> ''), title text not null check (btrim(title) <> ''),
  version text not null check (btrim(version) <> ''),
  state public.reference_revision_state not null default 'draft',
  unique nulls not distinct (tenant_id, code, version)
);
create table public.control_mappings (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  mapping_collection_id uuid not null references public.mapping_collections(id),
  relationship public.mapping_relationship not null,
  description text, rationale text,
  source_identifier text,
  unique (mapping_collection_id, source_identifier)
);
create table public.mapping_endpoints (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  control_mapping_id uuid not null references public.control_mappings(id),
  side public.mapping_endpoint_side not null,
  control_id uuid references public.controls(id),
  control_part_id uuid references public.control_parts(id),
  check (num_nonnulls(control_id, control_part_id) = 1),
  unique nulls not distinct (control_mapping_id, side, control_id, control_part_id)
);

create table public.cci_revisions (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  source_id uuid not null references public.ref_sources(id),
  version text not null check (btrim(version) <> ''),
  published_on date not null,
  content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  original_content text not null check (btrim(original_content) <> ''),
  state public.reference_revision_state not null default 'draft',
  unique (source_id, content_sha256)
);
create table public.cci_items (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  cci_revision_id uuid not null references public.cci_revisions(id),
  code text not null check (code ~ '^CCI-[0-9]{6}$'),
  status public.cci_status not null,
  published_on date not null,
  contributor text check (btrim(contributor) <> ''),
  definition text not null check (btrim(definition) <> ''),
  parameters text[] not null default '{}',
  notes text[] not null default '{}',
  unique (cci_revision_id, code)
);
create table public.cci_item_types (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  cci_item_id uuid not null references public.cci_items(id),
  type public.cci_type not null,
  unique (cci_item_id, type)
);
create table public.cci_references (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  cci_item_id uuid not null references public.cci_items(id),
  creator text not null, publication_title text not null, publication_version text not null,
  location text not null, source_index text not null,
  ordinal integer not null check (ordinal >= 0),
  resolution_status public.reference_resolution_status not null,
  unique (cci_item_id, ordinal)
);
create table public.cci_control_links (
  id uuid primary key default gen_random_uuid(), tenant_id uuid references public.tenants(id),
  cci_reference_id uuid not null references public.cci_references(id),
  control_id uuid not null references public.controls(id),
  control_part_id uuid references public.control_parts(id),
  mapping_basis text not null check (mapping_basis in ('source-control-index', 'exact-source-part-identifier')),
  check ((mapping_basis = 'exact-source-part-identifier') = (control_part_id is not null)),
  unique nulls not distinct (cci_reference_id, control_id, control_part_id)
);

-- A reference child's ownership follows its source revision. This also freezes
-- *inserts* below a published revision, including nested parts and parameters.
create function public.reference_owner(table_name text)
returns text[] language sql immutable set search_path = '' as $$
  select case table_name
    when 'oscal_document_revisions' then array['oscal_documents','document_id']
    when 'oscal_document_imports' then array['oscal_document_revisions','document_revision_id']
    when 'oscal_document_resources' then array['oscal_document_revisions','document_revision_id']
    when 'catalog_revisions' then array['catalogs','catalog_id']
    when 'catalog_groups' then array['catalog_revisions','catalog_revision_id']
    when 'controls' then array['catalog_revisions','catalog_revision_id']
    when 'control_parts' then array['catalog_revisions','catalog_revision_id']
    when 'parameters' then array['catalog_revisions','catalog_revision_id']
    when 'parameter_values' then array['parameters','parameter_id']
    when 'parameter_choices' then array['parameters','parameter_id']
    when 'parameter_constraints' then array['parameters','parameter_id']
    when 'parameter_guidelines' then array['parameters','parameter_id']
    when 'control_links' then array['controls','control_id']
    when 'profile_revisions' then array['profiles','profile_id']
    when 'profile_imports' then array['profile_revisions','profile_revision_id']
    when 'profile_rules' then array['profile_revisions','profile_revision_id']
    when 'profile_parameter_settings' then array['profile_revisions','profile_revision_id']
    when 'profile_parameter_values' then array['profile_parameter_settings','setting_id']
    when 'profile_resolution_inputs' then array['profile_resolutions','profile_resolution_id']
    when 'selected_controls' then array['profile_resolutions','profile_resolution_id']
    when 'selection_provenance' then array['selected_controls','selected_control_id']
    when 'control_mappings' then array['mapping_collections','mapping_collection_id']
    when 'mapping_endpoints' then array['control_mappings','control_mapping_id']
    when 'cci_items' then array['cci_revisions','cci_revision_id']
    when 'cci_item_types' then array['cci_items','cci_item_id']
    when 'cci_references' then array['cci_items','cci_item_id']
    when 'cci_control_links' then array['cci_references','cci_reference_id']
    else null end;
$$;

create function public.reference_ancestor_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  candidate jsonb; parent jsonb; owner_path text[]; current_table text;
  new_candidate jsonb; fk record; target_tenant uuid;
begin
  candidate := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  new_candidate := candidate;
  if tg_op = 'UPDATE' then
    if old.id is distinct from new.id or old.tenant_id is distinct from new.tenant_id then
      raise exception 'Record identity and tenant ownership are immutable' using errcode = '23514';
    end if;
    if to_jsonb(old)->>'state' = 'published' then
      raise exception 'Published reference revisions are immutable' using errcode = '23514';
    end if;
  elsif tg_op = 'DELETE' and to_jsonb(old)->>'state' = 'published' then
    raise exception 'Published reference revisions are immutable' using errcode = '23514';
  end if;

  current_table := tg_table_name;
  loop
    owner_path := public.reference_owner(current_table);
    exit when owner_path is null;
    execute format('select to_jsonb(p) from public.%I p where id = $1 for share', owner_path[1])
      into parent using (candidate->>owner_path[2])::uuid;
    if parent is null then raise exception 'Missing reference owner' using errcode = '23503'; end if;
    if parent->>'tenant_id' is distinct from candidate->>'tenant_id' then
      raise exception 'Reference ownership must match its parent' using errcode = '23514';
    end if;
    if parent->>'state' = 'published' then
      raise exception 'Published reference revision contents are immutable' using errcode = '23514';
    end if;
    candidate := parent;
    current_table := owner_path[1];
  end loop;

  -- A reparenting update must not remove content from a published old parent.
  if tg_op = 'UPDATE' then
    candidate := to_jsonb(old); current_table := tg_table_name;
    loop
      owner_path := public.reference_owner(current_table); exit when owner_path is null;
      execute format('select to_jsonb(p) from public.%I p where id = $1 for share', owner_path[1])
        into parent using (candidate->>owner_path[2])::uuid;
      if parent->>'state' = 'published' then
        raise exception 'Published reference revision contents are immutable' using errcode = '23514';
      end if;
      candidate := parent; current_table := owner_path[1];
    end loop;
  end if;

  -- Validate every reference edge as well as ownership: a tenant can reference
  -- a shared release or its own draft, never another tenant's document.
  if tg_op <> 'DELETE' then
    for fk in
      select a.attname as col, rc.relname as target_table
      from pg_catalog.pg_constraint c
      join pg_catalog.pg_class rc on rc.oid = c.confrelid
      join pg_catalog.pg_namespace rn on rn.oid = rc.relnamespace
      join pg_catalog.pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
      where c.conrelid = tg_relid and c.contype = 'f' and array_length(c.conkey, 1) = 1
      and rn.nspname = 'public' and rc.relname <> 'tenants'
    loop
      if new_candidate->>fk.col is null then continue; end if;
      execute format('select tenant_id from public.%I where id = $1', fk.target_table)
        into target_tenant using (new_candidate->>fk.col)::uuid;
      if target_tenant is not null and target_tenant is distinct from (new_candidate->>'tenant_id')::uuid then
        raise exception 'Cross-tenant reference is forbidden' using errcode = '23514';
      end if;
    end loop;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- Shared rows are read-only to authenticated clients. Draft tenant references
-- are editable by tenant writers; anonymous sessions cannot read or write them.
do $$
declare t text;
begin
  foreach t in array array[
    'ref_sources','oscal_documents','oscal_document_revisions','oscal_document_imports','oscal_document_resources',
    'catalogs','catalog_revisions','catalog_groups','controls','control_parts','parameters','parameter_values',
    'parameter_choices','parameter_constraints','parameter_guidelines','control_links','profiles','profile_revisions',
    'profile_imports','profile_rules','profile_parameter_settings','profile_parameter_values','profile_resolutions',
    'profile_resolution_inputs','selected_controls','selection_provenance','mapping_collections','control_mappings',
    'mapping_endpoints','cci_revisions','cci_items','cci_item_types','cci_references','cci_control_links'
  ] loop
    execute format('alter table public.%I add unique (tenant_id, id)', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy reference_read on public.%I for select to authenticated using (tenant_id is null or public.can_read_tenant(tenant_id))', t);
    execute format('create policy reference_insert on public.%I for insert to authenticated with check (tenant_id is not null and public.can_write_tenant(tenant_id))', t);
    execute format('create policy reference_update on public.%I for update to authenticated using (tenant_id is not null and public.can_write_tenant(tenant_id)) with check (tenant_id is not null and public.can_write_tenant(tenant_id))', t);
    execute format('create policy reference_delete on public.%I for delete to authenticated using (tenant_id is not null and public.can_write_tenant(tenant_id))', t);
    perform public.attach_record_lifecycle(t, false);
    execute format('create trigger reference_ancestor_guard before insert or update or delete on public.%I for each row execute function public.reference_ancestor_guard()', t);
  end loop;
end;
$$;

revoke all on function public.reference_owner(text) from public, anon, authenticated;
revoke all on function public.reference_ancestor_guard() from public, anon, authenticated;

create index controls_catalog_group_idx on public.controls(catalog_revision_id, group_id);
create index control_parts_control_idx on public.control_parts(control_id, name);
create index control_parts_parent_idx on public.control_parts(parent_part_id);
create index parameters_control_idx on public.parameters(control_id);
create index selected_controls_control_idx on public.selected_controls(control_id);
create index cci_control_links_control_idx on public.cci_control_links(control_id);
create index cci_references_item_idx on public.cci_references(cci_item_id);

create function public.reference_hierarchy_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare candidate jsonb := to_jsonb(new); parent jsonb; cyclic boolean;
begin
  if candidate->>tg_argv[0] is null then return new; end if;
  execute format('select to_jsonb(p) from public.%I p where id = $1 for share', tg_table_name)
    into parent using (candidate->>tg_argv[0])::uuid;
  if tg_table_name = 'control_parts' and
    (parent->>'control_id' is distinct from candidate->>'control_id' or parent->>'group_id' is distinct from candidate->>'group_id') then
    raise exception 'Nested control parts must have the same owning control or group' using errcode = '23514';
  end if;
  execute format('with recursive ancestors as (
    select id, %1$I as parent_id, array[id] as path from public.%2$I where id = $1
    union all select p.id, p.%1$I, a.path || p.id from public.%2$I p join ancestors a on p.id = a.parent_id where not p.id = any(a.path)
  ) select exists(select 1 from ancestors where id = $2)', tg_argv[0], tg_table_name)
    into cyclic using (candidate->>tg_argv[0])::uuid, new.id;
  if cyclic then raise exception 'Reference hierarchies cannot contain cycles' using errcode = '23514'; end if;
  return new;
end;
$$;
-- AFTER statement row events can see every parent inserted by the same bulk
-- statement; validating in BEFORE would falsely reject valid nested imports.
create trigger reference_hierarchy_guard after insert or update on public.catalog_groups for each row execute function public.reference_hierarchy_guard('parent_group_id');
create trigger reference_hierarchy_guard after insert or update on public.controls for each row execute function public.reference_hierarchy_guard('parent_control_id');
create trigger reference_hierarchy_guard after insert or update on public.control_parts for each row execute function public.reference_hierarchy_guard('parent_part_id');

create function public.reference_semantics_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare source_model public.oscal_model; target_model public.oscal_model; expected_profile uuid; imported_profile uuid; expected_import uuid;
begin
  if tg_table_name in ('catalog_revisions', 'profile_revisions') then
    select d.model into source_model from public.oscal_document_revisions r join public.oscal_documents d on d.id = r.document_id where r.id = new.document_revision_id;
    if (tg_table_name = 'catalog_revisions' and source_model <> 'catalog') or
      (tg_table_name = 'profile_revisions' and source_model <> 'profile') then
      raise exception 'OSCAL document model does not match the revision type' using errcode = '23514';
    end if;
  elsif tg_table_name = 'oscal_document_revisions' then
    select model into source_model from public.oscal_documents where id = new.document_id;
    if not new.original_content ? source_model::text or new.original_content->source_model::text->>'uuid' is distinct from new.source_uuid::text then
      raise exception 'Original OSCAL content must match its document model and source UUID' using errcode = '23514';
    end if;
  elsif tg_table_name = 'oscal_document_imports' then
    if new.referenced_revision_id is null then return new; end if;
    select d.model into source_model from public.oscal_document_revisions r join public.oscal_documents d on d.id = r.document_id where r.id = new.document_revision_id;
    select d.model into target_model from public.oscal_document_revisions r join public.oscal_documents d on d.id = r.document_id where r.id = new.referenced_revision_id;
    if (source_model = 'profile' and target_model not in ('catalog','profile')) or
      (source_model = 'system-security-plan' and target_model <> 'profile') or
      (source_model in ('assessment-plan','plan-of-action-and-milestones') and target_model <> 'system-security-plan') or
      (source_model = 'assessment-results' and target_model <> 'assessment-plan') then
      raise exception 'OSCAL import target has the wrong model' using errcode = '23514';
    end if;
  elsif tg_table_name = 'selection_provenance' then
    select r.profile_revision_id into expected_profile from public.selected_controls s join public.profile_resolutions r on r.id = s.profile_resolution_id where s.id = new.selected_control_id;
    select profile_revision_id into imported_profile from public.profile_imports where id = new.profile_import_id;
    if expected_profile is distinct from imported_profile then
      raise exception 'Selection provenance must belong to the resolved profile' using errcode = '23514';
    end if;
    if exists (
      select 1 from public.selected_controls s join public.controls c on c.id = s.control_id
      join public.profile_imports i on i.id = new.profile_import_id
      where s.id = new.selected_control_id and i.catalog_revision_id is not null and i.catalog_revision_id <> c.catalog_revision_id
    ) then
      raise exception 'Selected control revision must match the exact imported catalog revision' using errcode = '23514';
    end if;
    if new.profile_rule_id is not null then
      select profile_import_id into expected_import from public.profile_rules where id = new.profile_rule_id;
      if expected_import is distinct from new.profile_import_id then
        raise exception 'Selection provenance must cite a rule from its import' using errcode = '23514';
      end if;
    end if;
  elsif tg_table_name = 'selected_controls' then
    if not exists (
      select 1 from public.controls c join public.catalog_revisions r on r.id = c.catalog_revision_id
      join public.profile_resolution_inputs i on i.document_revision_id = r.document_revision_id
      where c.id = new.control_id and i.profile_resolution_id = new.profile_resolution_id
    ) then
      raise exception 'Selected control must come from a pinned resolution input' using errcode = '23514';
    end if;
  elsif tg_table_name = 'oscal_documents' then
    if tg_op = 'UPDATE' then
      if (new.model is distinct from old.model or new.source_id is distinct from old.source_id or new.code is distinct from old.code)
        and exists (select 1 from public.oscal_document_revisions where document_id = old.id) then
        raise exception 'A versioned document identity cannot change' using errcode = '23514';
      end if;
    end if;
  elsif tg_table_name = 'cci_control_links' then
    if new.control_part_id is null then return new; end if;
    if not exists (select 1 from public.control_parts where id = new.control_part_id and control_id = new.control_id) then
      raise exception 'CCI part link must belong to its control' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
do $$ declare t text; begin
  foreach t in array array['catalog_revisions','profile_revisions','oscal_documents','oscal_document_revisions','oscal_document_imports','selected_controls','selection_provenance','cci_control_links'] loop
    execute format('create trigger reference_semantics_guard before insert or update on public.%I for each row execute function public.reference_semantics_guard()', t);
  end loop;
end; $$;
revoke all on function public.reference_hierarchy_guard() from public, anon, authenticated;
revoke all on function public.reference_semantics_guard() from public, anon, authenticated;

comment on table public.control_parts is 'Verbatim OSCAL parts, including statements, objectives, methods and nested containers. Source IDs and JSON pointers preserve exact identity; no invented objective mappings.';
comment on table public.profile_rules is 'Ordered OSCAL import/merge/modify directives. Definition retains the original directive; resolved selections live in selected_controls.';
comment on table public.profile_resolutions is 'An immutable resolution with pinned input document revisions and deterministic input/output hashes. A new resolution may be added for an already published profile.';
comment on table public.cci_control_links is 'Only source-supported cross-references. A control index does not imply a verified assessment-objective mapping.';
