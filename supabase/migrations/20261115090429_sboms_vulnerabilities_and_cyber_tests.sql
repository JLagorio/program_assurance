-- SBOMs, CVE records and Cyber T&E: what a shared component is made of, what is known to be wrong
-- with it, and the assessments that test it, each recorded once and read by everything built from it.
--
-- Slice 1 (20261115070043_component_assessments) let a component version be assessed once and
-- slice 2 (20261115082948_component_offers) let a program's finding flow up to the component's
-- owner. Until now nothing recorded what a component is made of, a vulnerability had no record of
-- its own (an operational issue only named one in its title), and every assessment campaign was a
-- control assessment. This migration adds, and no existing read answers differently for the data
-- that was there:
--
--   sboms                           one software bill of materials of one subject: a library
--   sbom_components                 component version or an asset, and the components it lists
--   vulnerabilities                 one record a CVE in a workspace
--   sbom_component_vulnerabilities  a CVE on an SBOM component, with its state in VEX's words
--   vulnerability_controls          the controls a CVE bears on
--   issue_vulnerabilities           the operational issue that is a program's row for a CVE
--
-- A subject's standing SBOM is its latest by the day it was generated. import_sbom writes an SBOM
-- and its components in one transaction, all or none, one answer a request; the other tables are
-- written as their neighbours are, by any member who may write, row-level security deciding.
--
-- Reads: vulnerability_rows is the CVEs' register and sbom_component_rows the components of every
-- standing SBOM; component_vulnerabilities answers, for one component version, the CVEs that affect
-- it through its standing SBOM and, for each, every program built from that version with the
-- operational issue it holds for the CVE, or none. component_consumers, system_upstream and
-- component_rows gain how many CVEs affect each component version (vulnerabilities_open), as new
-- keys and a last column. review_component_offer, when it opens a consumer's issue for an accepted
-- finding, gives it the source issue's CVEs, so the CVE's row shows in every consumer at once.
--
-- An assessment campaign and a component assessment gain a kind: a control assessment, as every
-- one was, or a cyber test, which for a campaign names its Cyber T&E phase. A cyber test's findings
-- are assessment findings like any other, on the same chain. assessment_objective_rows gains the
-- campaign's kind as its last column.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- A software bill of materials: one document, of exactly one subject.
--
-- The subject is a library component version (a defined component, which every system built from
-- it shares) or an asset (an inventory item of one system). A subject may hold several SBOMs over
-- time; the one that stands is its latest by the day it was generated (standing_sboms).
-- ---------------------------------------------------------------------------------------------
create table if not exists public.sboms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  defined_component_id uuid,
  inventory_item_id uuid,
  title text not null check (length(btrim(title)) > 0),
  format text not null check (format in ('cyclonedx', 'spdx', 'other')),
  spec_version text,
  serial text,
  generated_on date not null,
  evidence_artifact_id uuid,
  -- One or the other. The subject is chosen when the SBOM is imported and never changes, so it is
  -- no target group of the generic forms.
  constraint sboms_subject check ((defined_component_id is null) <> (inventory_item_id is null)),
  unique (tenant_id, id),
  foreign key (tenant_id, defined_component_id) references public.defined_components(tenant_id, id),
  foreign key (tenant_id, inventory_item_id) references public.inventory_items(tenant_id, id),
  foreign key (tenant_id, evidence_artifact_id) references public.evidence_artifacts(tenant_id, id)
);
-- One row a component the SBOM lists. A component may sit inside another of the same SBOM.
create table if not exists public.sbom_components (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  sbom_id uuid not null,
  parent_component_id uuid,
  name text not null check (length(btrim(name)) > 0),
  version text,
  kind text not null default 'library'
    check (kind in ('library', 'application', 'operating-system', 'firmware', 'container', 'device', 'file')),
  supplier text,
  purl text,
  cpe text,
  license text,
  hash text,
  constraint sbom_components_parent check (parent_component_id is null or parent_component_id <> id),
  unique (tenant_id, id),
  unique (tenant_id, sbom_id, id),
  foreign key (tenant_id, sbom_id) references public.sboms(tenant_id, id) on delete cascade,
  -- The parent is a component of the same SBOM.
  foreign key (tenant_id, sbom_id, parent_component_id) references public.sbom_components(tenant_id, sbom_id, id)
);
create index if not exists sboms_component_idx
  on public.sboms(tenant_id, defined_component_id, generated_on desc) where defined_component_id is not null;
create index if not exists sboms_inventory_item_idx
  on public.sboms(tenant_id, inventory_item_id, generated_on desc) where inventory_item_id is not null;
create index if not exists sboms_evidence_idx
  on public.sboms(tenant_id, evidence_artifact_id) where evidence_artifact_id is not null;
create index if not exists sbom_components_sbom_idx on public.sbom_components(tenant_id, sbom_id);
create index if not exists sbom_components_parent_idx
  on public.sbom_components(tenant_id, parent_component_id) where parent_component_id is not null;
-- A name and version is listed once in an SBOM.
create unique index if not exists sbom_components_name_version_key
  on public.sbom_components(tenant_id, sbom_id, name, coalesce(version, ''));

-- What the foreign keys cannot say of a component: it does not sit inside itself, however far up.
-- The guard walks up from the parent, one component at a time by its id, and refuses the row when
-- it reaches the component again.
create or replace function public.guard_sbom_component() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_above uuid := new.parent_component_id;
  v_next uuid;
  v_steps integer := 0;
begin
  while v_above is not null loop
    -- No list of components is this deep: a walk that does not end is a loop.
    if v_above = new.id or v_steps > 10000 then
      raise exception 'A component of an SBOM cannot sit inside itself' using errcode = '23514';
    end if;
    select c.parent_component_id into v_next from public.sbom_components c
      where c.tenant_id = new.tenant_id and c.id = v_above;
    if not found then exit; end if;
    v_above := v_next;
    v_steps := v_steps + 1;
  end loop;
  return new;
end;
$$;
revoke all on function public.guard_sbom_component() from public, anon, authenticated;

do $$
declare v_table text;
begin
  foreach v_table in array array['sboms', 'sbom_components'] loop
    if not exists (select 1 from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = v_table and policyname = 'tenant_read') then
      perform public.apply_tenant_security(v_table);
    end if;
    if not exists (select 1 from pg_catalog.pg_trigger
      where tgrelid = ('public.' || v_table)::regclass and tgname = 'record_lifecycle' and not tgisinternal) then
      perform public.attach_record_lifecycle(v_table, false);
    end if;
  end loop;
end $$;
create or replace trigger stable_context before update on public.sboms
  for each row execute function public.guard_stable_assurance_context('defined_component_id', 'inventory_item_id');
create or replace trigger stable_context before update on public.sbom_components
  for each row execute function public.guard_stable_assurance_context('sbom_id');
create or replace trigger a_sbom_component before insert or update of parent_component_id on public.sbom_components
  for each row execute function public.guard_sbom_component();

comment on table public.sboms is 'One software bill of materials of exactly one subject: a library component version (a defined component, shared by every system built from it) or an asset (an inventory item). A subject may hold several over time; its standing SBOM is its latest by the day it was generated. Written by import_sbom, with its components, or by any member who may write.';
comment on column public.sboms.defined_component_id is 'The subject, when it is a library component version; else NULL.';
comment on column public.sboms.inventory_item_id is 'The subject, when it is an asset; else NULL.';
comment on column public.sboms.format is 'The document''s format: cyclonedx, spdx or other.';
comment on column public.sboms.spec_version is 'The version of the format''s specification the document follows, as it says it (1.5).';
comment on column public.sboms.serial is 'The document''s own identifier: a CycloneDX serial number, an SPDX document namespace.';
comment on column public.sboms.generated_on is 'The day the SBOM was generated. A subject''s latest by this day stands; of two generated the same day, the one recorded last.';
comment on column public.sboms.evidence_artifact_id is 'The evidence artifact that holds the document, when it was captured as evidence.';
comment on table public.sbom_components is 'One component an SBOM lists: its name and version (once each pair in an SBOM), what kind of thing it is, its supplier, package URL, CPE, license and hash as the document gives them, and the component of the same SBOM it sits inside, if any.';
comment on column public.sbom_components.parent_component_id is 'The component of the same SBOM this one sits inside; NULL for one at the top.';
comment on column public.sbom_components.kind is 'What the component is, in CycloneDX''s words: library, application, operating-system, firmware, container, device or file.';
comment on column public.sbom_components.purl is 'The component''s package URL.';
comment on column public.sbom_components.cpe is 'The component''s Common Platform Enumeration name.';
comment on column public.sbom_components.license is 'The component''s license, as an SPDX expression where the document gives one.';
comment on column public.sbom_components.hash is 'A digest of the component, with its algorithm, as the document gives it.';

-- Internal: each subject's standing SBOM, its latest by the day it was generated; of two generated
-- the same day, the one recorded last.
create or replace function public.standing_sboms()
returns table (sbom_id uuid, defined_component_id uuid, inventory_item_id uuid)
language sql stable security invoker set search_path = '' as $$
  select s.id, s.defined_component_id, s.inventory_item_id
  from public.sboms s
  where not exists (select 1 from public.sboms n
    where n.tenant_id = s.tenant_id
      and n.defined_component_id is not distinct from s.defined_component_id
      and n.inventory_item_id is not distinct from s.inventory_item_id
      and (n.generated_on, n.created_at, n.id) > (s.generated_on, s.created_at, s.id))
$$;
revoke all on function public.standing_sboms() from public, anon;
grant execute on function public.standing_sboms() to authenticated;
comment on function public.standing_sboms() is 'Internal: the standing SBOM of each subject the caller can read, a library component version or an asset: its latest by the day it was generated, and of two generated the same day the one recorded last. Security invoker.';

-- ---------------------------------------------------------------------------------------------
-- Receipts: what each import first answered.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.sbom_import_requests (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sbom_id uuid not null,
  request jsonb not null check (jsonb_typeof(request) = 'object'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  -- A receipt goes with its SBOM, so it never keeps one from being removed.
  foreign key (tenant_id, sbom_id) references public.sboms(tenant_id, id) on delete cascade
);
create index if not exists sbom_import_requests_sbom_idx on public.sbom_import_requests(tenant_id, sbom_id);
alter table public.sbom_import_requests enable row level security;
revoke all on public.sbom_import_requests from public, anon, authenticated;
comment on table public.sbom_import_requests is 'Private receipts of import_sbom: a request sent again returns what it first answered, and one sent with another choice conflicts. No client reads them.';

-- ---------------------------------------------------------------------------------------------
-- Import an SBOM: the document and every component it lists, all of them or none.
--
-- The subject is a library component version or an asset of the workspace. p_components is a list
-- of objects, each with a name and, where the document gives them, version, kind (library when
-- none is given), supplier, purl, cpe, license and hash; a component that sits inside another
-- gives the other's ref as its parent, where ref is the document's own reference for a component
-- (a CycloneDX bom-ref, an SPDX identifier). Refused: a subject or an evidence artifact that is not
-- in the workspace, a component with no name or of an unknown kind, a name and version given
-- twice, a ref given twice, a parent that names no component of the document, and a component
-- that sits inside itself. Each request is answered once: the same request sent again returns its
-- first answer and writes nothing, and its id sent with another choice is refused.
-- ---------------------------------------------------------------------------------------------
create or replace function public.import_sbom(
  p_tenant_id uuid,
  p_defined_component_id uuid,
  p_inventory_item_id uuid,
  p_title text,
  p_format text,
  p_spec_version text,
  p_serial text,
  p_generated_on date,
  p_evidence_artifact_id uuid,
  p_components jsonb,
  p_request_id uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_receipt public.sbom_import_requests;
  v_request jsonb;
  v_title text := nullif(regexp_replace(btrim(coalesce(p_title, '')), '\s+', ' ', 'g'), '');
  v_spec text := nullif(btrim(coalesce(p_spec_version, '')), '');
  v_serial text := nullif(btrim(coalesce(p_serial, '')), '');
  v_items jsonb;
  v_count integer;
  v_words text;
  v_sbom public.sboms;
  v_result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can import an SBOM' using errcode = '42501';
  end if;
  if p_request_id is null or (p_defined_component_id is null) = (p_inventory_item_id is null) then
    raise exception 'Name the SBOM''s one subject: a library component version or an asset' using errcode = '22023';
  end if;
  if v_title is null or p_generated_on is null then
    raise exception 'An SBOM needs a title and the day it was generated' using errcode = '22023';
  end if;
  if p_format is null or p_format not in ('cyclonedx', 'spdx', 'other') then
    raise exception 'An SBOM''s format is CycloneDX, SPDX or other' using errcode = '22023';
  end if;
  if p_components is null or jsonb_typeof(p_components) <> 'array'
    or jsonb_array_length(p_components) not between 1 and 5000 then
    raise exception 'Import between 1 and 5,000 components at a time' using errcode = '22023';
  end if;
  v_request := jsonb_build_object(
    'definedComponentId', p_defined_component_id, 'inventoryItemId', p_inventory_item_id,
    'title', v_title, 'format', p_format, 'specVersion', v_spec, 'serial', v_serial,
    'generatedOn', p_generated_on, 'evidenceArtifactId', p_evidence_artifact_id,
    'components', jsonb_array_length(p_components), 'digest', md5(p_components::text));
  -- One answer per request: the same request sent again answers as it first did.
  perform pg_advisory_xact_lock(hashtextextended('sbom-import/' || p_request_id::text, 0));
  select * into v_receipt from public.sbom_import_requests r where r.id = p_request_id;
  if found then
    if v_receipt.tenant_id <> p_tenant_id or v_receipt.request <> v_request then
      raise exception 'This import request was already used with different details' using errcode = 'PT409';
    end if;
    return v_receipt.result;
  end if;
  if p_defined_component_id is not null and not exists (select 1 from public.defined_components c
    where c.tenant_id = p_tenant_id and c.id = p_defined_component_id) then
    raise exception 'This library component is not in the workspace; reload and try again' using errcode = 'PT404';
  end if;
  if p_inventory_item_id is not null and not exists (select 1 from public.inventory_items i
    where i.tenant_id = p_tenant_id and i.id = p_inventory_item_id) then
    raise exception 'This asset is not in the workspace; reload and try again' using errcode = 'PT404';
  end if;
  if p_evidence_artifact_id is not null and not exists (select 1 from public.evidence_artifacts a
    where a.tenant_id = p_tenant_id and a.id = p_evidence_artifact_id) then
    raise exception 'This evidence artifact is not in the workspace; reload and try again' using errcode = 'PT404';
  end if;
  -- The components as they will be written, each with the id it takes.
  select jsonb_agg(jsonb_build_object(
      'id', gen_random_uuid(), 'position', e.position,
      'name', case when jsonb_typeof(e.item) = 'object' then nullif(btrim(e.item->>'name'), '') end,
      'version', nullif(btrim(e.item->>'version'), ''),
      'kind', coalesce(nullif(btrim(e.item->>'kind'), ''), 'library'),
      'supplier', nullif(btrim(e.item->>'supplier'), ''), 'purl', nullif(btrim(e.item->>'purl'), ''),
      'cpe', nullif(btrim(e.item->>'cpe'), ''), 'license', nullif(btrim(e.item->>'license'), ''),
      'hash', nullif(btrim(e.item->>'hash'), ''),
      'ref', nullif(btrim(e.item->>'ref'), ''), 'parent', nullif(btrim(e.item->>'parent'), '')
    ) order by e.position)
    into v_items
    from jsonb_array_elements(p_components) with ordinality e(item, position);
  select count(*) into v_count from jsonb_array_elements(v_items) i where i->>'name' is null;
  if v_count > 0 then
    raise exception 'Every component needs a name; % of this SBOM''s % none', v_count,
      case when v_count = 1 then 'has' else 'have' end using errcode = '22023';
  end if;
  select i->>'name' into v_words from jsonb_array_elements(v_items) i
    where i->>'kind' not in ('library', 'application', 'operating-system', 'firmware', 'container', 'device', 'file')
    order by (i->>'position')::integer limit 1;
  if v_words is not null then
    raise exception 'Component % has an unknown kind', v_words using errcode = '22023';
  end if;
  select concat_ws(' ', i->>'name', i->>'version') into v_words from jsonb_array_elements(v_items) i
    group by i->>'name', i->>'version' having count(*) > 1
    order by min((i->>'position')::integer) limit 1;
  if v_words is not null then
    raise exception '% is listed more than once. List each component and version once.', v_words using errcode = '22023';
  end if;
  select i->>'ref' into v_words from jsonb_array_elements(v_items) i
    where i->>'ref' is not null
    group by i->>'ref' having count(*) > 1
    order by min((i->>'position')::integer) limit 1;
  if v_words is not null then
    raise exception 'The reference % names more than one component', v_words using errcode = '22023';
  end if;
  select format('%s names a parent, %s, that is not a component of this SBOM', i->>'name', i->>'parent') into v_words
    from jsonb_array_elements(v_items) i
    where i->>'parent' is not null
      and not exists (select 1 from jsonb_array_elements(v_items) p where p->>'ref' = i->>'parent')
    order by (i->>'position')::integer limit 1;
  if v_words is not null then
    raise exception '%', v_words using errcode = '22023';
  end if;

  insert into public.sboms (tenant_id, defined_component_id, inventory_item_id, title, format, spec_version, serial,
      generated_on, evidence_artifact_id)
    values (p_tenant_id, p_defined_component_id, p_inventory_item_id, v_title, p_format, v_spec, v_serial,
      p_generated_on, p_evidence_artifact_id)
    returning * into v_sbom;
  -- The guard refuses a component that sits inside itself, however far up.
  with listed as materialized (
    select (i->>'id')::uuid as id, (i->>'position')::integer as position, i->>'ref' as ref, i->>'parent' as parent,
      i->>'name' as name, i->>'version' as version, i->>'kind' as kind, i->>'supplier' as supplier,
      i->>'purl' as purl, i->>'cpe' as cpe, i->>'license' as license, i->>'hash' as hash
    from jsonb_array_elements(v_items) i
  )
  insert into public.sbom_components (id, tenant_id, sbom_id, parent_component_id, name, version, kind, supplier,
      purl, cpe, license, hash)
    select c.id, p_tenant_id, v_sbom.id, p.id, c.name, c.version, c.kind, c.supplier, c.purl, c.cpe, c.license, c.hash
    from listed c
    left join listed p on p.ref = c.parent
    order by c.position;
  get diagnostics v_count = row_count;
  v_result := jsonb_build_object(
    'sbomId', v_sbom.id,
    'definedComponentId', v_sbom.defined_component_id,
    'inventoryItemId', v_sbom.inventory_item_id,
    'title', v_sbom.title,
    'format', v_sbom.format,
    'generatedOn', v_sbom.generated_on,
    'components', v_count,
    -- Whether it is now the subject's standing SBOM: not when a later one was already recorded.
    'standing', not exists (select 1 from public.sboms n
      where n.tenant_id = p_tenant_id
        and n.defined_component_id is not distinct from v_sbom.defined_component_id
        and n.inventory_item_id is not distinct from v_sbom.inventory_item_id
        and (n.generated_on, n.created_at, n.id) > (v_sbom.generated_on, v_sbom.created_at, v_sbom.id)),
    'revision', v_sbom.revision);
  insert into public.sbom_import_requests (id, tenant_id, sbom_id, request, result, created_by)
    values (p_request_id, p_tenant_id, v_sbom.id, v_request, v_result, auth.uid());
  return v_result;
end;
$$;
revoke all on function public.import_sbom(uuid, uuid, uuid, text, text, text, text, date, uuid, jsonb, uuid) from public, anon;
grant execute on function public.import_sbom(uuid, uuid, uuid, text, text, text, text, date, uuid, jsonb, uuid) to authenticated;
comment on function public.import_sbom(uuid, uuid, uuid, text, text, text, text, date, uuid, jsonb, uuid) is 'Import a software bill of materials of one subject, a library component version or an asset, in one transaction: the SBOM and every component it lists (between 1 and 5,000, each a name with its version, kind, supplier, purl, cpe, license and hash, and the ref of the component it sits inside as its parent), all of them or none. Refused: a subject or an evidence artifact that is not in the workspace, a component with no name or of an unknown kind, a name and version given twice, a ref given twice, a parent that names no component of the document, a component that sits inside itself, and a caller who may not write to the workspace. It answers whether the SBOM now stands for its subject (its latest by the day it was generated). The request id is chosen once per import: the same request sent again returns its first answer, and its id sent with another choice is refused.';

-- ---------------------------------------------------------------------------------------------
-- A CVE is a record: one a workspace, tied to the SBOM components it is found in (and through
-- them to the library components and assets those SBOMs describe), to the controls it bears on,
-- and to the operational issue each program holds for it, which its POA&M item answers as today.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.vulnerabilities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  cve_id text not null check (cve_id ~ '^CVE-[0-9]{4}-[0-9]{4,}$'),
  title text not null check (length(btrim(title)) > 0),
  description text,
  severity text check (severity in ('low', 'moderate', 'high', 'critical')),
  cvss_score numeric(3, 1) check (cvss_score >= 0 and cvss_score <= 10),
  cvss_vector text,
  published_on date,
  fixed_in text,
  source_uri text,
  known_exploited boolean not null default false,
  unique (tenant_id, id),
  unique (tenant_id, cve_id)
);
-- A CVE on a component of an SBOM, with its state in VEX's words.
create table if not exists public.sbom_component_vulnerabilities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  sbom_component_id uuid not null,
  vulnerability_id uuid not null,
  state text not null default 'affected'
    check (state in ('affected', 'not_affected', 'fixed', 'under_investigation')),
  note text,
  unique (tenant_id, id),
  unique (tenant_id, sbom_component_id, vulnerability_id),
  foreign key (tenant_id, sbom_component_id) references public.sbom_components(tenant_id, id) on delete cascade,
  foreign key (tenant_id, vulnerability_id) references public.vulnerabilities(tenant_id, id)
);
-- The controls a CVE bears on.
create table if not exists public.vulnerability_controls (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  vulnerability_id uuid not null,
  control_id uuid not null references public.controls(id),
  unique (tenant_id, id),
  unique (tenant_id, vulnerability_id, control_id),
  foreign key (tenant_id, vulnerability_id) references public.vulnerabilities(tenant_id, id) on delete cascade
);
-- The operational issue that is a program's row for a CVE: issue and CVE, once each pair.
create table if not exists public.issue_vulnerabilities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  issue_id uuid not null,
  vulnerability_id uuid not null,
  unique (tenant_id, id),
  unique (tenant_id, issue_id, vulnerability_id),
  foreign key (tenant_id, issue_id) references public.operational_issues(tenant_id, id),
  foreign key (tenant_id, vulnerability_id) references public.vulnerabilities(tenant_id, id)
);
create index if not exists sbom_component_vulnerabilities_component_idx
  on public.sbom_component_vulnerabilities(tenant_id, sbom_component_id);
create index if not exists sbom_component_vulnerabilities_vulnerability_idx
  on public.sbom_component_vulnerabilities(tenant_id, vulnerability_id, state);
create index if not exists vulnerability_controls_vulnerability_idx
  on public.vulnerability_controls(tenant_id, vulnerability_id);
create index if not exists vulnerability_controls_control_idx on public.vulnerability_controls(control_id);
create index if not exists issue_vulnerabilities_issue_idx on public.issue_vulnerabilities(tenant_id, issue_id);
create index if not exists issue_vulnerabilities_vulnerability_idx
  on public.issue_vulnerabilities(tenant_id, vulnerability_id);

do $$
declare v_table text;
begin
  foreach v_table in array array[
    'vulnerabilities', 'sbom_component_vulnerabilities', 'vulnerability_controls', 'issue_vulnerabilities'] loop
    if not exists (select 1 from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = v_table and policyname = 'tenant_read') then
      perform public.apply_tenant_security(v_table);
    end if;
    if not exists (select 1 from pg_catalog.pg_trigger
      where tgrelid = ('public.' || v_table)::regclass and tgname = 'record_lifecycle' and not tgisinternal) then
      perform public.attach_record_lifecycle(v_table, false);
    end if;
  end loop;
  -- A control is a shared reference record: the guard says what its foreign key cannot.
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.vulnerability_controls'::regclass and tgname = 'reference_tenant_control_id' and not tgisinternal) then
    perform public.attach_reference_tenant_guard('vulnerability_controls', 'control_id', 'controls');
  end if;
end $$;
create or replace trigger stable_context before update on public.vulnerabilities
  for each row execute function public.guard_stable_assurance_context('cve_id');
create or replace trigger stable_context before update on public.sbom_component_vulnerabilities
  for each row execute function public.guard_stable_assurance_context('sbom_component_id', 'vulnerability_id');
create or replace trigger stable_context before update on public.vulnerability_controls
  for each row execute function public.guard_stable_assurance_context('vulnerability_id', 'control_id');
create or replace trigger stable_context before update on public.issue_vulnerabilities
  for each row execute function public.guard_stable_assurance_context('issue_id', 'vulnerability_id');

comment on table public.vulnerabilities is 'One record a CVE in a workspace: its identifier, what it is, its severity in the product''s levels beside its CVSS score and vector, the day it was published, what fixes it, where it is described and whether it is known to be exploited. It is tied to the SBOM components it is found in (sbom_component_vulnerabilities), the controls it bears on (vulnerability_controls) and the operational issue each program holds for it (issue_vulnerabilities).';
comment on column public.vulnerabilities.cve_id is 'The CVE identifier, CVE-YYYY-N…, once in a workspace.';
comment on column public.vulnerabilities.severity is 'The CVE''s severity in the product''s levels: low, moderate, high or critical; NULL while nobody has rated it.';
comment on column public.vulnerabilities.cvss_score is 'The CVSS base score, 0.0 to 10.0.';
comment on column public.vulnerabilities.cvss_vector is 'The CVSS vector string the score was computed from.';
comment on column public.vulnerabilities.published_on is 'The day the CVE was published.';
comment on column public.vulnerabilities.fixed_in is 'What fixes it: the version, patch or change that removes the vulnerability.';
comment on column public.vulnerabilities.source_uri is 'Where the CVE is described: its record in a vulnerability database, or the supplier''s advisory.';
comment on column public.vulnerabilities.known_exploited is 'Whether the CVE is known to be exploited, as a known exploited vulnerabilities catalog lists it.';
comment on table public.sbom_component_vulnerabilities is 'A CVE on a component of an SBOM, once each pair, with its state in VEX''s words: affected, not_affected, fixed or under_investigation. A CVE affects a library component version or an asset where its standing SBOM holds a component in the state affected.';
comment on column public.sbom_component_vulnerabilities.state is 'affected: the component carries the vulnerability; not_affected: it does not, as the note says why; fixed: this version holds the fix; under_investigation: not yet known.';
comment on column public.sbom_component_vulnerabilities.note is 'Why the state is what it is: the affected range, the justification of not affected, the fix taken.';
comment on table public.vulnerability_controls is 'A control a CVE bears on, once each pair: the control whose implementation the vulnerability puts in question or whose practice answers it.';
comment on table public.issue_vulnerabilities is 'The operational issue that is a program''s row for a CVE, once each pair. Each program answers its own issue, with its own POA&M item (issue_poams); review_component_offer gives the issue it opens in a consumer the CVEs of the finding it was opened from.';

-- ---------------------------------------------------------------------------------------------
-- Reads.
-- ---------------------------------------------------------------------------------------------
-- Internal: the CVEs that affect a library component version, each once: those a component of its
-- standing SBOM carries in the state affected. One definition of what vulnerabilities_open counts,
-- for every read that says it.
create or replace function public.component_open_vulnerabilities(p_defined_component_ids uuid[])
returns table (defined_component_id uuid, vulnerability_id uuid)
language sql stable security invoker set search_path = '' as $$
  select distinct s.defined_component_id, x.vulnerability_id
  from public.standing_sboms() s
  join public.sbom_components c on c.sbom_id = s.sbom_id
  join public.sbom_component_vulnerabilities x on x.sbom_component_id = c.id and x.state = 'affected'
  where s.defined_component_id is not null
    and (p_defined_component_ids is null or s.defined_component_id = any(p_defined_component_ids))
$$;
revoke all on function public.component_open_vulnerabilities(uuid[]) from public, anon;
grant execute on function public.component_open_vulnerabilities(uuid[]) to authenticated;
comment on function public.component_open_vulnerabilities(uuid[]) is 'Internal: one row a library component version and CVE that affects it, the CVEs a component of the version''s standing SBOM carries in the state affected, for the versions named or, with none named, every version the caller can read. Security invoker.';

-- The CVEs' register: one row a CVE, with where it stands across the workspace. It affects an SBOM
-- component where the component carries it in the state affected and its SBOM is its subject's
-- standing one; those components belong to library component versions and to assets. A program
-- answers a CVE with an operational issue of its own, open until it is resolved or closed.
create or replace view public.vulnerability_rows with (security_invoker = true) as
with
affected as (
  select x.vulnerability_id, c.id as sbom_component_id, s.defined_component_id, s.inventory_item_id
  from public.standing_sboms() s
  join public.sbom_components c on c.sbom_id = s.sbom_id
  join public.sbom_component_vulnerabilities x on x.sbom_component_id = c.id and x.state = 'affected'
),
exposure as (
  select a.vulnerability_id, count(*) as sbom_components,
    count(distinct a.defined_component_id) as components, count(distinct a.inventory_item_id) as assets
  from affected a
  group by a.vulnerability_id
),
held as (
  select l.vulnerability_id, count(distinct i.program_id) as programs, count(*) as issues
  from public.issue_vulnerabilities l
  join public.operational_issues i on i.tenant_id = l.tenant_id and i.id = l.issue_id
  where i.status not in ('resolved', 'closed')
  group by l.vulnerability_id
)
select v.*,
  pg_catalog.array_position('{low,moderate,high,critical}'::text[], v.severity) as severity_rank,
  public.natural_sort_key(v.cve_id) collate "C" as cve_order,
  coalesce(e.sbom_components, 0) as sbom_components_affected,
  coalesce(e.components, 0) as components_affected,
  coalesce(e.assets, 0) as assets_affected,
  coalesce(h.programs, 0) as programs_open,
  coalesce(h.issues, 0) as issues_open,
  (select count(*) from public.vulnerability_controls k where k.vulnerability_id = v.id) as controls
from public.vulnerabilities v
left join exposure e on e.vulnerability_id = v.id
left join held h on h.vulnerability_id = v.id;
grant select on public.vulnerability_rows to authenticated;
revoke all on public.vulnerability_rows from public, anon;
comment on view public.vulnerability_rows is 'The CVEs'' register, one row a CVE: every column of the record, its severity''s rank in the product''s order (severity_rank), its identifier''s sort key with numbers by their value (cve_order), how many components of standing SBOMs it affects (sbom_components_affected: the state affected in the latest SBOM of its subject), how many library component versions (components_affected) and how many assets (assets_affected) those SBOMs describe, how many programs hold an open operational issue for it (programs_open) and how many such issues are open (issues_open: neither resolved nor closed), and how many controls it bears on (controls). Security invoker.';

-- The components of every standing SBOM: one row a component, with the subject its SBOM describes
-- by name and how many CVEs affect it. A component of an SBOM a later one replaced is not listed.
create or replace view public.sbom_component_rows with (security_invoker = true) as
select c.*,
  s.title as sbom_title, s.format as sbom_format, s.spec_version as sbom_spec_version,
  s.generated_on as sbom_generated_on,
  case when s.defined_component_id is not null then 'component' else 'asset' end as subject_kind,
  s.defined_component_id, s.inventory_item_id,
  coalesce(dc.name, item.name) as subject_name,
  r.version_number as subject_version,
  coalesce(d.code, item.asset_id) as subject_code,
  item.system_id, boundary.program_id,
  parent.name as parent_name,
  coalesce(w.vulnerabilities, 0) as vulnerabilities,
  w.worst_severity,
  pg_catalog.array_position('{low,moderate,high,critical}'::text[], w.worst_severity) as worst_severity_rank
from public.standing_sboms() standing
join public.sboms s on s.id = standing.sbom_id
join public.sbom_components c on c.tenant_id = s.tenant_id and c.sbom_id = s.id
left join public.defined_components dc on dc.id = s.defined_component_id
left join public.component_definition_revisions r on r.id = dc.component_definition_revision_id
left join public.component_definitions d on d.id = r.component_definition_id
left join public.inventory_items item on item.id = s.inventory_item_id
left join public.systems boundary on boundary.id = item.system_id
left join public.sbom_components parent on parent.id = c.parent_component_id
left join lateral (
  select count(*) as vulnerabilities,
    (array_agg(v.severity order by
      pg_catalog.array_position('{low,moderate,high,critical}'::text[], v.severity) desc nulls last))[1] as worst_severity
  from public.sbom_component_vulnerabilities x
  join public.vulnerabilities v on v.id = x.vulnerability_id
  where x.sbom_component_id = c.id and x.state = 'affected'
) w on true;
grant select on public.sbom_component_rows to authenticated;
revoke all on public.sbom_component_rows from public, anon;
comment on view public.sbom_component_rows is 'The components of every standing SBOM, one row a component: every column of the component, its SBOM''s title, format, specification version and the day it was generated, the subject the SBOM describes (subject_kind component or asset, with defined_component_id or inventory_item_id; subject_name, the library component''s or the asset''s; subject_version, the component set''s version for a library component; subject_code, the component set''s code or the asset''s id; an asset''s system_id and program_id), the component it sits inside by name (parent_name), how many CVEs affect it (vulnerabilities: the state affected) and the worst severity among them with its rank in the product''s order (worst_severity, worst_severity_rank). A component of an SBOM a later one replaced is not listed. Security invoker.';

-- ---------------------------------------------------------------------------------------------
-- The CVEs on one component version, and who has answered them.
--
-- The CVEs are those a component of the version's standing SBOM carries in the state affected,
-- the worst first, each with the SBOM components affected and the controls it bears on. Every
-- program that holds a system component built from this version is exposed to each of them, and
-- is listed under each with the operational issue it holds for the CVE (its open one first, else
-- its latest) and that issue's status and POA&M items, or none: a program that holds none has not
-- answered. The totals count the CVEs, the programs, and the answers still owed.
-- ---------------------------------------------------------------------------------------------
create or replace function public.component_vulnerabilities(p_defined_component_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_component public.defined_components;
  v_revision public.component_definition_revisions;
  v_definition public.component_definitions;
  v_sbom public.sboms;
  v_tenant uuid;
begin
  select * into v_component from public.defined_components where id = p_defined_component_id;
  if auth.uid() is null or v_component.id is null then
    raise exception 'Component access is required' using errcode = '42501';
  end if;
  v_tenant := v_component.tenant_id;
  select * into v_revision from public.component_definition_revisions
    where tenant_id = v_tenant and id = v_component.component_definition_revision_id;
  select * into v_definition from public.component_definitions
    where tenant_id = v_tenant and id = v_revision.component_definition_id;
  select s.* into v_sbom from public.standing_sboms() standing
    join public.sboms s on s.id = standing.sbom_id
    where standing.defined_component_id = p_defined_component_id;
  with
  -- The components of the standing SBOM that carry a CVE in the state affected.
  affected as materialized (
    select x.vulnerability_id, c.id as sbom_component_id, c.name, c.version, c.kind, c.purl, c.cpe, x.note
    from public.sbom_components c
    join public.sbom_component_vulnerabilities x
      on x.tenant_id = v_tenant and x.sbom_component_id = c.id and x.state = 'affected'
    where c.tenant_id = v_tenant and c.sbom_id = v_sbom.id
  ),
  cves as materialized (
    select v.*, pg_catalog.array_position('{low,moderate,high,critical}'::text[], v.severity) as severity_rank
    from public.vulnerabilities v
    where v.tenant_id = v_tenant and v.id in (select a.vulnerability_id from affected a)
  ),
  -- Every program that holds a system component built from this component version, each once.
  consumers as materialized (
    select g.id as program_id, g.code as program_code, g.name as program_name, g.business_line_id,
      jsonb_agg(jsonb_build_object(
        'system_id', b.id, 'system_code', b.code, 'system_name', b.name,
        'system_component_id', sc.id, 'component_code', sc.code, 'component_name', sc.name
      ) order by b.code, public.natural_sort_key(sc.code) collate "C", sc.id) as system_components
    from public.system_components sc
    join public.systems b on b.tenant_id = v_tenant and b.id = sc.system_id
    join public.programs g on g.tenant_id = v_tenant and g.id = b.program_id
    where sc.tenant_id = v_tenant and sc.defined_component_id = p_defined_component_id
    group by g.id, g.code, g.name, g.business_line_id
  ),
  -- Each of those programs' own issues for each of those CVEs.
  held as materialized (
    select l.vulnerability_id, i.program_id, i.id as issue_id, i.title, i.severity, i.status, i.opened_at,
      i.owner_party_id, i.status not in ('resolved', 'closed') as open,
      (select count(*) from public.issue_poams ip where ip.tenant_id = v_tenant and ip.issue_id = i.id) as poam_items
    from public.issue_vulnerabilities l
    join public.operational_issues i on i.tenant_id = v_tenant and i.id = l.issue_id
    where l.tenant_id = v_tenant
      and l.vulnerability_id in (select v.id from cves v)
      and i.program_id in (select c.program_id from consumers c)
  )
  select jsonb_build_object(
    'defined_component_id', p_defined_component_id,
    'component', jsonb_build_object(
      'id', v_component.id, 'name', v_component.name, 'component_type', v_component.component_type,
      'definition_id', v_definition.id, 'definition_code', v_definition.code, 'definition_name', v_definition.name,
      'revision_id', v_revision.id, 'version', v_revision.version_number, 'state', v_revision.state,
      'owner_party_id', public.component_owner_party(p_defined_component_id)),
    -- The version's standing SBOM; none while no SBOM of it is recorded.
    'sbom', case when v_sbom.id is null then null else jsonb_build_object(
      'id', v_sbom.id, 'title', v_sbom.title, 'format', v_sbom.format, 'spec_version', v_sbom.spec_version,
      'serial', v_sbom.serial, 'generated_on', v_sbom.generated_on,
      'evidence_artifact_id', v_sbom.evidence_artifact_id,
      'components', (select count(*) from public.sbom_components c
        where c.tenant_id = v_tenant and c.sbom_id = v_sbom.id)) end,
    'vulnerabilities', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'vulnerability_id', v.id, 'cve_id', v.cve_id, 'title', v.title,
        'severity', v.severity, 'cvss_score', v.cvss_score, 'cvss_vector', v.cvss_vector,
        'published_on', v.published_on, 'fixed_in', v.fixed_in, 'source_uri', v.source_uri,
        'known_exploited', v.known_exploited,
        'components', (select jsonb_agg(jsonb_build_object(
            'sbom_component_id', a.sbom_component_id, 'name', a.name, 'version', a.version, 'kind', a.kind,
            'purl', a.purl, 'cpe', a.cpe, 'note', a.note
          ) order by a.name, a.version nulls first, a.sbom_component_id)
          from affected a where a.vulnerability_id = v.id),
        'controls', (select coalesce(jsonb_agg(jsonb_build_object(
            'control_id', k.id, 'code', k.code, 'title', k.title
          ) order by public.natural_sort_key(k.code) collate "C", k.id), '[]'::jsonb)
          from public.vulnerability_controls vc
          join public.controls k on k.id = vc.control_id
          where vc.tenant_id = v_tenant and vc.vulnerability_id = v.id),
        'consumers', (select coalesce(jsonb_agg(jsonb_build_object(
            'program_id', c.program_id, 'program_code', c.program_code, 'program_name', c.program_name,
            'business_line_id', c.business_line_id, 'system_components', c.system_components,
            'answered', exists (select 1 from held h
              where h.vulnerability_id = v.id and h.program_id = c.program_id),
            'issues', (select count(*) from held h
              where h.vulnerability_id = v.id and h.program_id = c.program_id),
            -- The program's issue for the CVE: its open one first, else its latest.
            'issue', (select jsonb_build_object(
                'issue_id', h.issue_id, 'title', h.title, 'severity', h.severity, 'status', h.status,
                'open', h.open, 'opened_at', h.opened_at, 'owner_party_id', h.owner_party_id,
                'poam_items', h.poam_items)
              from held h
              where h.vulnerability_id = v.id and h.program_id = c.program_id
              order by h.open desc, h.opened_at desc nulls last, h.issue_id limit 1)
          ) order by c.program_code, c.program_id), '[]'::jsonb)
          from consumers c),
        'programs', (select count(*) from consumers),
        'programs_answered', (select count(distinct h.program_id) from held h where h.vulnerability_id = v.id),
        'programs_open', (select count(distinct h.program_id) from held h where h.vulnerability_id = v.id and h.open)
      ) order by v.severity_rank desc nulls last, v.cvss_score desc nulls last,
        public.natural_sort_key(v.cve_id) collate "C", v.id), '[]'::jsonb)
      from cves v),
    'totals', jsonb_build_object(
      'vulnerabilities', (select count(*) from cves),
      'sbom_components', (select count(distinct a.sbom_component_id) from affected a),
      'programs', (select count(*) from consumers),
      -- The answers still owed: a CVE and a program that holds no issue for it.
      'unanswered', (select count(*) from cves v cross join consumers c
        where not exists (select 1 from held h where h.vulnerability_id = v.id and h.program_id = c.program_id)),
      'programs_unanswered', (select count(*) from consumers c
        where exists (select 1 from cves v
          where not exists (select 1 from held h where h.vulnerability_id = v.id and h.program_id = c.program_id))))
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.component_vulnerabilities(uuid) from public, anon;
grant execute on function public.component_vulnerabilities(uuid) to authenticated;
comment on function public.component_vulnerabilities(uuid) is 'The CVEs on one library component version, and who has answered them: the version''s standing SBOM (none while no SBOM of it is recorded), each CVE a component of that SBOM carries in the state affected, the worst first, with the SBOM components affected and the controls it bears on, and under each CVE every program that holds a system component built from this version, with whether it has answered, how many operational issues it holds for the CVE and the one to read (its open one first, else its latest, with its status and how many POA&M items answer it), or none: a program that holds none is exposed and has not answered. The totals count the CVEs, the SBOM components affected, the programs, the answers still owed (a CVE and a program with no issue for it) and the programs that owe one. Security invoker: a component the reader cannot read is refused.';

-- ---------------------------------------------------------------------------------------------
-- A CVE's row in every consumer at once.
--
-- review_component_offer, redefined from its body in 20261115082948_component_offers with one
-- thing added: when it opens a consumer's operational issue for an accepted finding, the new issue
-- takes the offered issue's CVEs (issue_vulnerabilities). So a CVE found in one program and
-- accepted on the component version has a row of its own in every program built from that
-- version, each answered there with its own POA&M item. Nothing else of the review changes, and
-- its answer is the same, key for key.
-- ---------------------------------------------------------------------------------------------
create or replace function public.review_component_offer(
  p_tenant_id uuid,
  p_offer_id uuid,
  p_expected_revision bigint,
  p_decision text,
  p_note text,
  p_request_id uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_receipt public.component_offer_requests;
  v_request jsonb;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_offer public.component_offers;
  v_defined record;
  v_source record;
  v_party uuid;
  v_now timestamptz := now();
  v_items bigint;
  v_consumer record; v_item record;
  v_issue uuid; v_first uuid; v_opened integer;
  v_issues jsonb := '[]'; v_programs integer := 0; v_skipped integer := 0;
  v_baseline uuid; v_outside text[]; v_assessment uuid; v_determinations integer := 0;
  v_event uuid;
  v_result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can review an offer' using errcode = '42501';
  end if;
  if p_offer_id is null or p_request_id is null or p_expected_revision is null then
    raise exception 'Choose the offer to review, at the revision you read' using errcode = '22023';
  end if;
  if p_decision is null or p_decision not in ('accepted', 'returned') then
    raise exception 'Accept the offer or return it' using errcode = '22023';
  end if;
  if p_decision = 'returned' and v_note is null then
    raise exception 'Say why the offer is returned' using errcode = '22023';
  end if;
  v_request := jsonb_build_object('offerId', p_offer_id, 'decision', p_decision);
  perform pg_advisory_xact_lock(hashtextextended('component-offer/' || p_request_id::text, 0));
  select * into v_receipt from public.component_offer_requests r where r.id = p_request_id;
  if found then
    if v_receipt.tenant_id <> p_tenant_id or v_receipt.command <> 'review' or v_receipt.request <> v_request then
      raise exception 'This request already answered another offer. Review this offer again.' using errcode = 'PT409';
    end if;
    return v_receipt.result;
  end if;
  select * into v_offer from public.component_offers o
    where o.tenant_id = p_tenant_id and o.id = p_offer_id for update;
  if v_offer.id is null then
    raise exception 'This offer is no longer available; reload and try again' using errcode = 'PT404';
  end if;
  if v_offer.state <> 'offered' then
    raise exception 'This offer was already %. Reload to see it.', v_offer.state using errcode = '23514';
  end if;
  if v_offer.revision is distinct from p_expected_revision then
    raise exception 'This offer changed since you read it. Reload it before reviewing.' using errcode = 'PT409';
  end if;
  select regexp_replace(btrim(c.name), '\s+', ' ', 'g') as name, c.component_definition_revision_id as revision_id,
      r.version_number
    into v_defined
    from public.defined_components c
    join public.component_definition_revisions r
      on r.tenant_id = c.tenant_id and r.id = c.component_definition_revision_id
    where c.tenant_id = p_tenant_id and c.id = v_offer.defined_component_id;
  select g.code as program_code, s.code as system_code into v_source
    from public.systems s join public.programs g on g.tenant_id = s.tenant_id and g.id = s.program_id
    where s.tenant_id = p_tenant_id and s.id = v_offer.system_id;
  select p.id into v_party from public.parties p
    where p.tenant_id = p_tenant_id and p.auth_user_id = auth.uid();
  select count(*) into v_items from public.component_offer_items i
    where i.tenant_id = p_tenant_id and i.component_offer_id = v_offer.id;

  if p_decision = 'accepted' and v_offer.kind = 'finding' then
    -- The offering program's issues are the source of what now stands on the component version.
    insert into public.component_offer_issues (tenant_id, component_offer_id, component_offer_item_id, program_id,
        issue_id, system_component_id, source)
      select p_tenant_id, v_offer.id, i.id, v_offer.program_id, i.issue_id, v_offer.system_component_id, true
      from public.component_offer_items i
      where i.tenant_id = p_tenant_id and i.component_offer_id = v_offer.id
      on conflict do nothing;
    -- Every program that holds a system component built from the same component version, each
    -- once, with its first such component by code.
    for v_consumer in
      select b.program_id,
        (array_agg(c.id order by public.natural_sort_key(c.code) collate "C", c.id))[1] as system_component_id
      from public.system_components c
      join public.systems b on b.tenant_id = c.tenant_id and b.id = c.system_id
      where c.tenant_id = p_tenant_id and c.defined_component_id = v_offer.defined_component_id
      group by b.program_id
      order by b.program_id
    loop
      v_first := null; v_opened := 0;
      for v_item in
        select i.id, i.issue_id, o.title, o.description, o.severity
        from public.component_offer_items i
        join public.operational_issues o on o.tenant_id = i.tenant_id and o.id = i.issue_id
        where i.tenant_id = p_tenant_id and i.component_offer_id = v_offer.id
        order by o.opened_at nulls last, o.title, i.id
      loop
        -- A program that already holds an issue for this item (the offering program does) keeps it.
        if exists (select 1 from public.component_offer_issues k
          where k.tenant_id = p_tenant_id and k.component_offer_item_id = v_item.id and k.program_id = v_consumer.program_id) then
          v_skipped := v_skipped + 1;
          continue;
        end if;
        insert into public.operational_issues (tenant_id, program_id, title, description, severity, status, opened_at)
          values (p_tenant_id, v_consumer.program_id, v_item.title, v_item.description, v_item.severity, 'open', v_now)
          returning id into v_issue;
        insert into public.component_offer_issues (tenant_id, component_offer_id, component_offer_item_id, program_id,
            issue_id, system_component_id, source)
          values (p_tenant_id, v_offer.id, v_item.id, v_consumer.program_id, v_issue, v_consumer.system_component_id, false);
        -- The new issue is the program's row for every CVE the source issue is the row for.
        insert into public.issue_vulnerabilities (tenant_id, issue_id, vulnerability_id)
          select p_tenant_id, v_issue, l.vulnerability_id
          from public.issue_vulnerabilities l
          where l.tenant_id = p_tenant_id and l.issue_id = v_item.issue_id;
        v_issues := v_issues || jsonb_build_object('programId', v_consumer.program_id, 'issueId', v_issue);
        v_first := coalesce(v_first, v_issue);
        v_opened := v_opened + 1;
      end loop;
      if v_opened > 0 then
        v_programs := v_programs + 1;
        insert into public.activity_events (tenant_id, program_id, issue_id, actor_party_id, event_type, description, occurred_at)
          values (p_tenant_id, v_consumer.program_id, v_first, v_party, 'created',
            format(E'opened %s from %s accepted on %s\n%s: found in %s %s, and standing on version %s for every program built from it.',
              case when v_opened = 1 then 'an operational issue' else v_opened::text || ' operational issues' end,
              public.component_offer_words('finding', v_opened), v_defined.name,
              v_offer.title, v_source.program_code, v_source.system_code, v_defined.version_number),
            v_now);
      end if;
    end loop;
  elsif p_decision = 'accepted' then
    -- Reviewed once, then the standing for every consumer: one published component assessment of
    -- the component version, against the offering system's control baseline.
    select b.profile_resolution_id into v_baseline from public.system_effective_baselines b
      where b.tenant_id = p_tenant_id and b.system_id = v_offer.system_id;
    if v_baseline is null then
      raise exception 'The offering system records no control baseline to publish these determinations against' using errcode = '23514';
    end if;
    if (select r.state from public.profile_resolutions r where r.id = v_baseline) is distinct from 'published' then
      raise exception 'The offering system''s control baseline is still a draft. Publish it before accepting these determinations.' using errcode = '23514';
    end if;
    select array_agg(k.code order by public.natural_sort_key(k.code) collate "C", k.id) into v_outside
      from public.component_offer_items i
      join public.controls k on k.id = i.control_id
      where i.tenant_id = p_tenant_id and i.component_offer_id = v_offer.id
        and not exists (select 1 from public.selected_controls sc
          where sc.profile_resolution_id = v_baseline and sc.control_id = i.control_id);
    if v_outside is not null then
      raise exception '% outside the offering system''s control baseline, so nothing was published: %',
        case when cardinality(v_outside) = 1 then '1 offered control is' else cardinality(v_outside)::text || ' offered controls are' end,
        array_to_string(v_outside[1:5], ', ') || case when cardinality(v_outside) > 5 then ', …' else '' end
        using errcode = '23514';
    end if;
    insert into public.component_assessments (tenant_id, component_definition_revision_id, profile_resolution_id,
        title, description, assessor_party_id, started_on, completed_on)
      select p_tenant_id, v_defined.revision_id, v_baseline, v_offer.title,
        concat_ws(E'\n', format('Offered by %s from the published assessment results of %s, and accepted for %s version %s.',
          v_source.program_code, v_source.system_code, v_defined.name, v_defined.version_number), v_offer.note),
        -- The assessor, where one made every determination.
        case when count(distinct f.assessor_party_id) = 1 and count(f.assessor_party_id) = count(*)
          then min(f.assessor_party_id::text)::uuid end,
        (min(f.determined_at) at time zone 'UTC')::date, (max(f.determined_at) at time zone 'UTC')::date
      from public.component_offer_items i
      join public.assessment_findings f on f.tenant_id = i.tenant_id and f.id = i.assessment_finding_id
      where i.tenant_id = p_tenant_id and i.component_offer_id = v_offer.id
      returning id into v_assessment;
    insert into public.component_determinations (tenant_id, component_assessment_id, component_definition_revision_id,
        defined_component_id, control_id, determination, rationale, assessment_finding_id)
      select p_tenant_id, v_assessment, v_defined.revision_id, v_offer.defined_component_id, i.control_id,
        f.determination, nullif(btrim(coalesce(f.description, '')), ''), f.id
      from public.component_offer_items i
      join public.assessment_findings f on f.tenant_id = i.tenant_id and f.id = i.assessment_finding_id
      where i.tenant_id = p_tenant_id and i.component_offer_id = v_offer.id;
    get diagnostics v_determinations = row_count;
    update public.component_assessments
      set state = 'published', published_at = v_now, revision = revision + 1
      where tenant_id = p_tenant_id and id = v_assessment;
  end if;

  update public.component_offers
    set state = p_decision, reviewed_by_party_id = v_party, reviewed_at = v_now, review_note = v_note,
      component_assessment_id = v_assessment, revision = revision + 1
    where tenant_id = p_tenant_id and id = p_offer_id
    returning * into v_offer;
  v_event := public.record_component_offer_event(v_offer, v_party, 'reviewed',
    case
      when p_decision = 'returned' then
        format('returned the offer of %s on %s', public.component_offer_words(v_offer.kind, v_items), v_defined.name)
      when v_offer.kind = 'finding' then
        format('accepted the offer of %s on %s', public.component_offer_words(v_offer.kind, v_items), v_defined.name)
      else format('accepted %s offered on %s', public.component_offer_words(v_offer.kind, v_items), v_defined.name)
    end,
    case
      when p_decision = 'returned' then format('%s: %s', v_offer.title, v_note)
      when v_offer.kind = 'finding' then
        format('%s: stands on version %s for every program built from it; opened in %s.', v_offer.title,
          v_defined.version_number,
          case when v_programs = 1 then '1 other program' else v_programs::text || ' other programs' end)
      else format('%s: published as the standing of version %s for every program built from it.', v_offer.title,
        v_defined.version_number)
    end,
    v_now);
  v_result := jsonb_build_object(
    'offerId', v_offer.id,
    'kind', v_offer.kind,
    'state', v_offer.state,
    'revision', v_offer.revision,
    'reviewedAt', v_offer.reviewed_at,
    'programs', v_programs,
    'issues', v_issues,
    'skipped', v_skipped,
    'componentAssessmentId', v_assessment,
    'determinations', v_determinations,
    'activityEventId', v_event);
  insert into public.component_offer_requests (id, tenant_id, component_offer_id, command, request, result, created_by)
    values (p_request_id, p_tenant_id, v_offer.id, 'review', v_request, v_result, auth.uid());
  return v_result;
end;
$$;
revoke all on function public.review_component_offer(uuid, uuid, bigint, text, text, uuid) from public, anon;
grant execute on function public.review_component_offer(uuid, uuid, bigint, text, text, uuid) to authenticated;
comment on function public.review_component_offer(uuid, uuid, bigint, text, text, uuid) is 'Review an offer that waits on a component''s owner, at the revision the reader saw, in one transaction: accepted or returned (a note is required to return). An accepted finding stands on the component version: every other program that holds a system component built from it gets one open operational issue of its own for each issue offered, linked in component_offer_issues beside the offering program''s as the source, with one activity event a program, and the new issue takes the CVEs the offered issue is the row for (issue_vulnerabilities), so each consumer holds its own row for them; a program that already holds one is passed over. Accepted determinations are published as one component assessment of the component version against the offering system''s control baseline, each determination citing its assessment finding; a control outside that baseline refuses the review. The offering program''s activity says the offer was reviewed. An offer already reviewed or withdrawn, changed since it was read or not in the workspace is refused, as is a caller who may not write to the workspace. The same request sent again returns its first answer.';

-- ---------------------------------------------------------------------------------------------
-- Where a component is used, with the CVEs on each version taken.
--
-- Redefined from its body in 20261115082948_component_offers with new keys only: each product
-- line and each system line says how many CVEs affect the version it took (vulnerabilities_open:
-- the CVEs a component of that version's standing SBOM carries in the state affected; none on a
-- line a variant removed), and the answer says the same of the version asked for. Every other key
-- answers as it did.
-- ---------------------------------------------------------------------------------------------
create or replace function public.component_consumers(p_defined_component_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_component public.defined_components;
  v_revision public.component_definition_revisions;
  v_definition public.component_definitions;
  v_latest public.component_definition_revisions;
  v_tenant uuid;
begin
  select * into v_component from public.defined_components where id = p_defined_component_id;
  if auth.uid() is null or v_component.id is null then
    raise exception 'Component access is required' using errcode = '42501';
  end if;
  v_tenant := v_component.tenant_id;
  select * into v_revision from public.component_definition_revisions
    where tenant_id = v_tenant and id = v_component.component_definition_revision_id;
  select * into v_definition from public.component_definitions
    where tenant_id = v_tenant and id = v_revision.component_definition_id;
  select * into v_latest from public.component_definition_revisions r
    where r.tenant_id = v_tenant and r.component_definition_id = v_definition.id and r.state = 'published'
    order by r.version_number desc limit 1;
  with
  lineage as materialized (
    select * from public.component_lineage(p_defined_component_id)
  ),
  product_rows as materialized (
    select pe.id as element_id, pe.code as element_code, pe.name as element_name,
      pr.id as product_revision_id, pr.version_number as product_version, pr.state as product_state,
      p.id as product_id, p.code as product_code, p.name as product_name, p.business_line_id,
      l.defined_component_id, l.version_number as version, l.behind,
      pr.id = (select c.id from public.product_revisions c
        where c.tenant_id = v_tenant and c.product_id = p.id
        order by (c.state = 'published') desc, c.version_number desc limit 1) as is_current,
      (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'code', c.code, 'name', c.name) order by c.code, c.id), '[]'::jsonb)
        from public.product_configuration_elements m
        join public.product_configurations c on c.tenant_id = m.tenant_id and c.id = m.product_configuration_id
        where m.tenant_id = v_tenant and m.product_revision_id = pr.id and m.product_element_id = pe.id) as configurations
    from lineage l
    join public.product_elements pe on pe.tenant_id = v_tenant and pe.defined_component_id = l.defined_component_id
    join public.product_revisions pr on pr.tenant_id = v_tenant and pr.id = pe.product_revision_id
    join public.products p on p.tenant_id = v_tenant and p.id = pr.product_id
  ),
  system_rows as materialized (
    select sc.id as system_component_id, sc.code as component_code, sc.name as component_name,
      sc.version as component_version,
      b.id as system_id, b.code as system_code, b.name as system_name,
      e.id as element_id, e.code as element_code, e.name as element_name,
      g.id as program_id, g.code as program_code, g.name as program_name, g.business_line_id,
      l.defined_component_id, l.version_number as version, l.behind,
      e.product_element_id,
      case
        when e.product_change_kinds is not null then 'modified'
        when e.product_element_id is not null then 'inherited'
      end as change,
      e.product_change_kinds as change_kinds, e.product_change_rationale as change_rationale,
      pin.pin
    from lineage l
    join public.system_components sc on sc.tenant_id = v_tenant and sc.defined_component_id = l.defined_component_id
    join public.systems b on b.tenant_id = v_tenant and b.id = sc.system_id
    -- The element a component sits on is the one it names or, where it names none, the one a
    -- single inventory relationship gives it (system_component_element_links); else its system.
    left join public.system_component_element_links k on k.tenant_id = v_tenant and k.id = sc.id
    join public.systems e on e.tenant_id = v_tenant and e.id = coalesce(k.system_element_id, sc.system_id)
    join public.programs g on g.tenant_id = v_tenant and g.id = b.program_id
    left join lateral (
      select jsonb_build_object(
        'configuration_baseline_id', cb.id, 'name', cb.name, 'baseline_version', cb.version_number,
        'state', cb.state, 'version', cp.version) as pin
      from public.component_pins cp
      join public.configuration_baselines cb on cb.tenant_id = cp.tenant_id and cb.id = cp.configuration_baseline_id
      where cp.tenant_id = v_tenant and cp.system_component_id = sc.id
      order by (cb.state = 'published') desc, cb.version_number desc, cb.id limit 1
    ) pin on true
  ),
  -- A variant whose configuration includes an element built from the component and that holds no
  -- element for it: the program left it out.
  removed_rows as materialized (
    select b.id as system_id, b.code as system_code, b.name as system_name,
      g.id as program_id, g.code as program_code, g.name as program_name, g.business_line_id,
      pe.id as product_element_id, pe.code as element_code, pe.name as element_name,
      l.defined_component_id, l.version_number as version, l.behind
    from lineage l
    join public.product_elements pe on pe.tenant_id = v_tenant and pe.defined_component_id = l.defined_component_id
    join public.product_configuration_elements m
      on m.tenant_id = v_tenant and m.product_revision_id = pe.product_revision_id and m.product_element_id = pe.id
    join public.systems b
      on b.tenant_id = v_tenant and b.product_revision_id = m.product_revision_id
      and b.product_configuration_id = m.product_configuration_id and b.is_authorization_boundary
    join public.programs g on g.tenant_id = v_tenant and g.id = b.program_id
    where not exists (select 1 from public.systems s
      where s.tenant_id = v_tenant and s.boundary_system_id = b.id and s.product_element_id = pe.id)
  ),
  -- The findings that stand on a version of the component: each issue of an accepted offer.
  found as materialized (
    select o.id as offer_id, i.id as item_id, o.defined_component_id, l.version_number as version,
      o.reviewed_at as accepted_at, o.program_id as source_program_id, i.issue_id as source_issue_id,
      src.title, src.severity
    from lineage l
    join public.component_offers o
      on o.tenant_id = v_tenant and o.defined_component_id = l.defined_component_id
      and o.kind = 'finding' and o.state = 'accepted'
    join public.component_offer_items i on i.tenant_id = v_tenant and i.component_offer_id = o.id
    join public.operational_issues src on src.tenant_id = v_tenant and src.id = i.issue_id
  ),
  -- Each program's own issue for a finding that stands, and whether it is still open.
  held as materialized (
    select f.offer_id, f.item_id, f.defined_component_id, k.program_id, k.issue_id, k.source,
      x.title, x.severity, x.status, x.opened_at, x.status not in ('resolved', 'closed') as open
    from found f
    join public.component_offer_issues k on k.tenant_id = v_tenant and k.component_offer_item_id = f.item_id
    join public.operational_issues x on x.tenant_id = v_tenant and x.id = k.issue_id
  ),
  -- How many CVEs affect each version of the component, through its standing SBOM.
  exposure as materialized (
    select x.defined_component_id, count(*) as vulnerabilities
    from public.component_open_vulnerabilities(array(select l.defined_component_id from lineage l)) x
    group by x.defined_component_id
  )
  select jsonb_build_object(
    'defined_component_id', p_defined_component_id,
    'component', jsonb_build_object(
      'id', v_component.id, 'name', v_component.name, 'component_type', v_component.component_type,
      'definition_id', v_definition.id, 'definition_code', v_definition.code, 'definition_name', v_definition.name,
      'revision_id', v_revision.id, 'version', v_revision.version_number, 'state', v_revision.state,
      'owner_party_id', public.component_owner_party(p_defined_component_id),
      'definition_owner_party_id', v_definition.owner_party_id, 'business_line_id', v_definition.business_line_id),
    -- The definition's latest published version, and the component of this name in it.
    'latest', case when v_latest.id is null then null else jsonb_build_object(
      'revision_id', v_latest.id, 'version', v_latest.version_number,
      'defined_component_id', (select l.defined_component_id from lineage l
        where l.component_definition_revision_id = v_latest.id order by l.defined_component_id limit 1)) end,
    'products', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'product_id', r.product_id, 'product_code', r.product_code, 'product_name', r.product_name,
        'business_line_id', r.business_line_id,
        'product_revision_id', r.product_revision_id, 'product_version', r.product_version,
        'product_state', r.product_state, 'current', r.is_current,
        'element_id', r.element_id, 'element_code', r.element_code, 'element_name', r.element_name,
        'configurations', r.configurations,
        'defined_component_id', r.defined_component_id, 'version', r.version, 'behind', r.behind,
        'vulnerabilities_open', coalesce((select e.vulnerabilities from exposure e
          where e.defined_component_id = r.defined_component_id), 0)
      ) order by r.product_code, r.product_version desc, r.element_code, r.element_id), '[]'::jsonb)
      from product_rows r),
    'systems', (
      select coalesce(jsonb_agg(x.line order by x.program_code, x.system_code, x.element_code, x.id), '[]'::jsonb)
      from (
        select r.program_code, r.system_code, r.element_code, r.system_component_id as id, jsonb_build_object(
          'program_id', r.program_id, 'program_code', r.program_code, 'program_name', r.program_name,
          'business_line_id', r.business_line_id,
          'system_id', r.system_id, 'system_code', r.system_code, 'system_name', r.system_name,
          'element_id', r.element_id, 'element_code', r.element_code, 'element_name', r.element_name,
          'system_component_id', r.system_component_id, 'component_code', r.component_code,
          'component_name', r.component_name, 'component_version', r.component_version,
          'product_element_id', r.product_element_id,
          'defined_component_id', r.defined_component_id, 'version', r.version, 'behind', r.behind,
          'pin', r.pin,
          'change', r.change, 'change_kinds', coalesce(to_jsonb(r.change_kinds), '[]'::jsonb),
          'change_rationale', r.change_rationale,
          -- The program's own open issues for the findings that stand on the version it took.
          'findings', (select coalesce(jsonb_agg(jsonb_build_object(
              'offer_id', h.offer_id, 'issue_id', h.issue_id, 'title', h.title, 'severity', h.severity,
              'status', h.status, 'opened_at', h.opened_at, 'source', h.source
            ) order by h.opened_at nulls last, h.issue_id), '[]'::jsonb)
            from held h
            where h.program_id = r.program_id and h.defined_component_id = r.defined_component_id and h.open),
          'findings_open', (select count(*) from held h
            where h.program_id = r.program_id and h.defined_component_id = r.defined_component_id and h.open),
          -- The CVEs that affect the version it took.
          'vulnerabilities_open', coalesce((select e.vulnerabilities from exposure e
            where e.defined_component_id = r.defined_component_id), 0)) as line
        from system_rows r
        union all
        select r.program_code, r.system_code, r.element_code, r.product_element_id, jsonb_build_object(
          'program_id', r.program_id, 'program_code', r.program_code, 'program_name', r.program_name,
          'business_line_id', r.business_line_id,
          'system_id', r.system_id, 'system_code', r.system_code, 'system_name', r.system_name,
          'element_id', null, 'element_code', r.element_code, 'element_name', r.element_name,
          'system_component_id', null, 'component_code', null,
          'component_name', null, 'component_version', null,
          'product_element_id', r.product_element_id,
          'defined_component_id', r.defined_component_id, 'version', r.version, 'behind', r.behind,
          'pin', null,
          'change', 'removed', 'change_kinds', '[]'::jsonb, 'change_rationale', null,
          'findings', '[]'::jsonb, 'findings_open', 0, 'vulnerabilities_open', 0)
        from removed_rows r
      ) x),
    -- The findings that stand on a version of the component, the newest first.
    'findings', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'offer_id', f.offer_id, 'item_id', f.item_id, 'title', f.title, 'severity', f.severity,
        'defined_component_id', f.defined_component_id, 'version', f.version, 'accepted_at', f.accepted_at,
        'source_program_id', f.source_program_id, 'source_issue_id', f.source_issue_id,
        'programs', (select count(*) from held h where h.item_id = f.item_id),
        'programs_open', (select count(*) from held h where h.item_id = f.item_id and h.open)
      ) order by f.accepted_at desc, f.item_id), '[]'::jsonb)
      from found f),
    'totals', jsonb_build_object(
      'products', (select count(distinct r.product_id) from product_rows r where r.is_current),
      'product_elements', (select count(*) from product_rows),
      'programs', (select count(distinct r.program_id) from system_rows r),
      'systems', (select count(distinct r.system_id) from system_rows r),
      'system_components', (select count(*) from system_rows),
      'behind', (select count(*) from product_rows r where r.is_current and r.behind > 0)
        + (select count(*) from system_rows r where r.behind > 0),
      'modified', (select count(*) from system_rows r where r.change = 'modified'),
      'removed', (select count(*) from removed_rows)),
    -- How many of those findings some program still holds open, and how many offers wait on the
    -- component's owner, for any of its versions.
    'findings_open', (select count(*) from found f
      where exists (select 1 from held h where h.item_id = f.item_id and h.open)),
    'offers_open', (select count(*) from lineage l
      join public.component_offers o
        on o.tenant_id = v_tenant and o.defined_component_id = l.defined_component_id and o.state = 'offered'),
    -- How many CVEs affect the version asked for.
    'vulnerabilities_open', coalesce((select e.vulnerabilities from exposure e
      where e.defined_component_id = p_defined_component_id), 0)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.component_consumers(uuid) from public, anon;
grant execute on function public.component_consumers(uuid) to authenticated;
comment on function public.component_consumers(uuid) is 'Where a library component is used, followed by its name through every version of its definition: each product element pinned to it (its product and version, whether that is the product''s current version, the configurations that include it) and each system component built from it (its program, system and element, its pin in the system''s latest configuration baseline, whether the program declared the inherited element modified), each with the version taken and how many published versions of the definition are newer (behind); a variant that left the element out is listed as removed. Totals count a product by its current version. The component''s owner_party_id is its effective owner, its own (component_owners) else its set''s. The findings that stand on a version of the component (the issues of accepted offers) are listed with how many programs still hold their own issue open, each system line carries the program''s own open issues for the findings on the version it took, and findings_open and offers_open count the findings still open somewhere and the offers that wait on the owner. vulnerabilities_open says how many CVEs affect a component version, those a component of its standing SBOM carries in the state affected: of the version asked for, and on each product and system line of the version it took. Security invoker: a component the reader cannot read is refused.';

-- ---------------------------------------------------------------------------------------------
-- What a system takes from above, with the CVEs on each version taken.
--
-- Redefined from its body in 20261115082948_component_offers with new keys only: each component
-- says how many CVEs affect the version taken (vulnerabilities_open), and the answer counts the
-- CVEs that affect what the system takes, each once. Every other key answers as it did.
-- ---------------------------------------------------------------------------------------------
create or replace function public.system_upstream(p_system_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_system public.systems;
  v_boundary public.systems;
  v_tenant uuid;
  v_revision public.product_revisions;
  v_product public.products;
  v_configuration public.product_configurations;
  v_latest public.product_revisions;
begin
  select * into v_system from public.systems where id = p_system_id;
  if auth.uid() is null or v_system.id is null then
    raise exception 'System access is required' using errcode = '42501';
  end if;
  v_tenant := v_system.tenant_id;
  select * into v_boundary from public.systems where tenant_id = v_tenant and id = v_system.boundary_system_id;
  if v_boundary.product_configuration_id is not null then
    select * into v_revision from public.product_revisions where tenant_id = v_tenant and id = v_boundary.product_revision_id;
    select * into v_product from public.products where tenant_id = v_tenant and id = v_revision.product_id;
    select * into v_configuration from public.product_configurations where tenant_id = v_tenant and id = v_boundary.product_configuration_id;
    select * into v_latest from public.product_revisions r
      where r.tenant_id = v_tenant and r.product_id = v_revision.product_id and r.state = 'published'
      order by r.version_number desc limit 1;
  end if;
  with recursive
  -- The elements the answer covers: the whole boundary, or one element and what is inside it.
  scope as (
    select s.id from public.systems s where s.tenant_id = v_tenant and s.id = p_system_id
    union all
    select s.id from public.systems s join scope p on s.parent_system_id = p.id where s.tenant_id = v_tenant
  ),
  used as materialized (
    select sc.id as system_component_id, sc.code, sc.name, sc.version as component_version,
      e.id as element_id, e.code as element_code, e.name as element_name, e.product_element_id,
      case
        when e.product_change_kinds is not null then 'modified'
        when e.product_element_id is not null then 'inherited'
      end as change,
      e.product_change_kinds as change_kinds,
      dc.id as defined_component_id, dc.name as component_name, dc.component_type,
      r.id as revision_id, r.version_number as version,
      d.id as definition_id, d.code as definition_code, d.name as definition_name,
      coalesce(named.owner_party_id, d.owner_party_id) as owner_party_id,
      d.owner_party_id as definition_owner_party_id, d.business_line_id,
      newest.id as latest_revision_id, newest.version_number as latest_version,
      (select count(*) from public.component_definition_revisions n
        where n.tenant_id = v_tenant and n.component_definition_id = d.id
          and n.state = 'published' and n.version_number > r.version_number) as behind,
      pin.pin
    from public.system_components sc
    -- The element a component sits on: the one it names, else the one a single inventory
    -- relationship gives it (system_component_element_links), else its system.
    left join public.system_component_element_links k on k.tenant_id = v_tenant and k.id = sc.id
    join public.systems e on e.tenant_id = v_tenant and e.id = coalesce(k.system_element_id, sc.system_id)
    join public.defined_components dc on dc.tenant_id = v_tenant and dc.id = sc.defined_component_id
    join public.component_definition_revisions r on r.tenant_id = v_tenant and r.id = dc.component_definition_revision_id
    join public.component_definitions d on d.tenant_id = v_tenant and d.id = r.component_definition_id
    -- The component's own owner, where one is named over its set's.
    left join public.component_owners named
      on named.tenant_id = v_tenant and named.component_definition_id = d.id and named.component_name = dc.name
    left join lateral (
      select n.id, n.version_number from public.component_definition_revisions n
      where n.tenant_id = v_tenant and n.component_definition_id = d.id and n.state = 'published'
      order by n.version_number desc limit 1
    ) newest on true
    left join lateral (
      select jsonb_build_object(
        'configuration_baseline_id', cb.id, 'name', cb.name, 'baseline_version', cb.version_number,
        'state', cb.state, 'version', cp.version) as pin
      from public.component_pins cp
      join public.configuration_baselines cb on cb.tenant_id = cp.tenant_id and cb.id = cp.configuration_baseline_id
      where cp.tenant_id = v_tenant and cp.system_component_id = sc.id
      order by (cb.state = 'published') desc, cb.version_number desc, cb.id limit 1
    ) pin on true
    where sc.tenant_id = v_tenant and sc.system_id = v_boundary.id
      and e.id in (select id from scope)
  ),
  standing as materialized (
    select l.defined_component_id,
      count(*) as controls,
      count(*) filter (where l.status = 'satisfied') as satisfied,
      count(*) filter (where l.status = 'partially_satisfied') as partially_satisfied,
      count(*) filter (where l.status = 'other_than_satisfied') as other_than_satisfied,
      count(*) filter (where l.status = 'not_assessed') as not_assessed
    from public.component_standing_lines(array(select distinct u.defined_component_id from used u)) l
    group by l.defined_component_id
  ),
  -- The program's own open issues for the findings that stand on the versions it took.
  held as materialized (
    select o.defined_component_id, o.id as offer_id, k.issue_id, k.source,
      x.title, x.severity, x.status, x.opened_at
    from public.component_offers o
    join public.component_offer_issues k
      on k.tenant_id = v_tenant and k.component_offer_id = o.id and k.program_id = v_system.program_id
    join public.operational_issues x on x.tenant_id = v_tenant and x.id = k.issue_id
    where o.tenant_id = v_tenant and o.kind = 'finding' and o.state = 'accepted'
      and o.defined_component_id in (select u.defined_component_id from used u)
      and x.status not in ('resolved', 'closed')
  ),
  -- The offers that wait on the owner of each version taken, whoever made them.
  waiting as materialized (
    select o.defined_component_id, count(*) as offers
    from public.component_offers o
    where o.tenant_id = v_tenant and o.state = 'offered'
      and o.defined_component_id in (select u.defined_component_id from used u)
    group by o.defined_component_id
  ),
  -- The CVEs that affect each version taken, through its standing SBOM.
  exposure as materialized (
    select x.defined_component_id, x.vulnerability_id
    from public.component_open_vulnerabilities(array(select distinct u.defined_component_id from used u)) x
  )
  select jsonb_build_object(
    'system_id', p_system_id,
    'boundary_system_id', v_boundary.id,
    'program_id', v_system.program_id,
    'product', case when v_boundary.product_configuration_id is null then null else jsonb_build_object(
      'id', v_product.id, 'code', v_product.code, 'name', v_product.name,
      'business_line_id', v_product.business_line_id,
      'revision_id', v_revision.id, 'version', v_revision.version_number,
      'configuration_id', v_configuration.id, 'configuration_code', v_configuration.code,
      'configuration', v_configuration.name,
      'latest_revision_id', v_latest.id, 'latest_version', v_latest.version_number,
      'behind', (select count(*) from public.product_revisions r
        where r.tenant_id = v_tenant and r.product_id = v_revision.product_id and r.state = 'published'
          and r.version_number > v_revision.version_number)) end,
    'components', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'system_component_id', u.system_component_id, 'code', u.code, 'name', u.name,
        'component_version', u.component_version,
        'element_id', u.element_id, 'element_code', u.element_code, 'element_name', u.element_name,
        'product_element_id', u.product_element_id,
        'change', u.change, 'change_kinds', coalesce(to_jsonb(u.change_kinds), '[]'::jsonb),
        'defined_component_id', u.defined_component_id, 'component_name', u.component_name,
        'component_type', u.component_type,
        'definition_id', u.definition_id, 'definition_code', u.definition_code, 'definition_name', u.definition_name,
        'owner_party_id', u.owner_party_id, 'definition_owner_party_id', u.definition_owner_party_id,
        'business_line_id', u.business_line_id,
        'revision_id', u.revision_id, 'version', u.version,
        'latest_revision_id', u.latest_revision_id, 'latest_version', u.latest_version,
        'behind', u.behind, 'pin', u.pin,
        'standing', jsonb_build_object(
          'controls', coalesce(s.controls, 0), 'satisfied', coalesce(s.satisfied, 0),
          'partially_satisfied', coalesce(s.partially_satisfied, 0),
          'other_than_satisfied', coalesce(s.other_than_satisfied, 0),
          'not_assessed', coalesce(s.not_assessed, 0)),
        'findings', (select coalesce(jsonb_agg(jsonb_build_object(
            'offer_id', h.offer_id, 'issue_id', h.issue_id, 'title', h.title, 'severity', h.severity,
            'status', h.status, 'opened_at', h.opened_at, 'source', h.source
          ) order by h.opened_at nulls last, h.issue_id), '[]'::jsonb)
          from held h where h.defined_component_id = u.defined_component_id),
        'findings_open', (select count(*) from held h where h.defined_component_id = u.defined_component_id),
        'offers_open', coalesce((select w.offers from waiting w where w.defined_component_id = u.defined_component_id), 0),
        'vulnerabilities_open', (select count(*) from exposure e where e.defined_component_id = u.defined_component_id)
      ) order by public.natural_sort_key(u.element_code) collate "C", public.natural_sort_key(u.code) collate "C", u.system_component_id), '[]'::jsonb)
      from used u left join standing s on s.defined_component_id = u.defined_component_id),
    'totals', jsonb_build_object(
      'components', (select count(*) from used),
      'behind', (select count(*) from used u where u.behind > 0),
      'modified', (select count(*) from used u where u.change = 'modified'),
      'assessed', (select count(*) from used u join standing s on s.defined_component_id = u.defined_component_id
        where s.controls > s.not_assessed)),
    -- The program's open issues for findings that stand on what the system takes, each once, and
    -- the offers that wait on the owners of those versions.
    'findings_open', (select count(distinct h.issue_id) from held h),
    'offers_open', (select coalesce(sum(w.offers), 0) from waiting w),
    -- The CVEs that affect what the system takes, each once.
    'vulnerabilities_open', (select count(distinct e.vulnerability_id) from exposure e)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.system_upstream(uuid) from public, anon;
grant execute on function public.system_upstream(uuid) to authenticated;
comment on function public.system_upstream(uuid) is 'What a system takes from above: for a system created from a product, the product, the version and configuration it was created from and the newest published version; and each library component the system (an authorization boundary whole, or one element and what is inside it) is built from, with the version taken, the latest published version of its definition, how many published versions it is behind, whether the program declared the inherited element modified, its pin in the latest configuration baseline, the component''s standing as component_control_status counts it, its effective owner (its own, else its set''s), the program''s own open issues for the findings that stand on the version taken (the issues of accepted offers) how many offers wait on that version''s owner and how many CVEs affect the version taken (vulnerabilities_open: those a component of its standing SBOM carries in the state affected), which the answer also counts across what the system takes, each CVE once. Security invoker: a system the reader cannot read is refused.';

-- ---------------------------------------------------------------------------------------------
-- The components register, with the CVEs on each component.
--
-- Redefined from its definition in 20261115082948_component_offers with the same columns first;
-- vulnerabilities_open, its last column, counts the CVEs that affect the version the row lists.
-- ---------------------------------------------------------------------------------------------
create or replace view public.component_rows with (security_invoker = true) as
with
head as (
  select distinct on (r.tenant_id, r.component_definition_id)
    r.tenant_id, r.component_definition_id, r.id, r.version_number, r.state, r.published_at
  from public.component_definition_revisions r
  order by r.tenant_id, r.component_definition_id, (r.state = 'published') desc, r.version_number desc
),
versions as (
  select r.tenant_id, r.id, r.component_definition_id,
    (select count(*) from public.component_definition_revisions n
      where n.tenant_id = r.tenant_id and n.component_definition_id = r.component_definition_id
        and n.state = 'published' and n.version_number > r.version_number) as behind
  from public.component_definition_revisions r
),
-- Every version of each listed component: the components of its name in its definition.
member as (
  select c.id as head_id, o.id as defined_component_id, v.behind
  from head h
  join public.defined_components c on c.tenant_id = h.tenant_id and c.component_definition_revision_id = h.id
  join versions v on v.tenant_id = h.tenant_id and v.component_definition_id = h.component_definition_id
  join public.defined_components o
    on o.tenant_id = v.tenant_id and o.component_definition_revision_id = v.id and o.name = c.name
),
product_use as (
  select m.head_id, count(distinct pr.product_id) as products,
    count(*) filter (where m.behind > 0) as behind
  from member m
  join public.product_elements pe on pe.defined_component_id = m.defined_component_id
  join public.product_revisions pr on pr.tenant_id = pe.tenant_id and pr.id = pe.product_revision_id
  where pr.id = (select c.id from public.product_revisions c
    where c.tenant_id = pr.tenant_id and c.product_id = pr.product_id
    order by (c.state = 'published') desc, c.version_number desc limit 1)
  group by m.head_id
),
system_use as (
  select m.head_id, count(distinct b.program_id) as programs,
    count(*) filter (where m.behind > 0) as behind,
    count(*) filter (where e.product_change_kinds is not null) as modified
  from member m
  join public.system_components sc on sc.defined_component_id = m.defined_component_id
  join public.systems b on b.tenant_id = sc.tenant_id and b.id = sc.system_id
  left join public.system_component_element_links k on k.tenant_id = sc.tenant_id and k.id = sc.id
  join public.systems e on e.tenant_id = sc.tenant_id and e.id = coalesce(k.system_element_id, sc.system_id)
  group by m.head_id
),
judged as (
  select distinct on (d.defined_component_id, d.control_id)
    d.defined_component_id, d.control_id, d.determination, d.component_assessment_id, a.published_at
  from public.component_determinations d
  join public.component_assessments a
    on a.tenant_id = d.tenant_id and a.id = d.component_assessment_id and a.state = 'published'
  order by d.defined_component_id, d.control_id, a.published_at desc, a.id desc
),
standing as (
  select j.defined_component_id, count(*) as determined,
    count(*) filter (where j.determination = 'satisfied') as satisfied,
    count(*) filter (where j.determination = 'partially_satisfied') as partially_satisfied,
    count(*) filter (where j.determination = 'other_than_satisfied') as other_than_satisfied,
    (array_agg(j.component_assessment_id order by j.published_at desc, j.component_assessment_id desc))[1] as assessment_id
  from judged j
  group by j.defined_component_id
),
claimed as (
  select i.defined_component_id, count(distinct i.control_id) as controls
  from public.defined_component_implementations i
  where i.control_id is not null
  group by i.defined_component_id
),
waiting as (
  select m.head_id, count(*) as offers
  from member m
  join public.component_offers o on o.defined_component_id = m.defined_component_id and o.state = 'offered'
  group by m.head_id
),
exposure as (
  select x.defined_component_id, count(*) as vulnerabilities
  from public.component_open_vulnerabilities(null) x
  group by x.defined_component_id
)
select c.id, c.tenant_id, c.name, c.component_type, c.description, c.supplier_party_id,
  d.id as component_definition_id, d.code as definition_code, d.name as definition_name, d.category,
  h.id as component_definition_revision_id, h.version_number as version, h.state, h.published_at,
  coalesce(named.owner_party_id, d.owner_party_id) as owner_party_id, owner.name as owner_name,
  d.business_line_id, line.code as business_line_code, line.name as business_line_name,
  coalesce(pu.products, 0) as products,
  coalesce(su.programs, 0) as programs,
  coalesce(pu.behind, 0) + coalesce(su.behind, 0) as consumers_behind,
  coalesce(su.modified, 0) as consumers_modified,
  st.assessment_id, a.title as assessment_title, a.completed_on as assessed_on,
  a.published_at as assessment_published_at,
  coalesce(cl.controls, 0) as controls_claimed,
  coalesce(st.determined, 0) as controls_determined,
  coalesce(st.satisfied, 0) as controls_satisfied,
  coalesce(st.partially_satisfied, 0) as controls_partially_satisfied,
  coalesce(st.other_than_satisfied, 0) as controls_other_than_satisfied,
  c.revision, c.created_at, c.updated_at, c.created_by, c.updated_by,
  coalesce(wt.offers, 0) as offers_open,
  coalesce(ex.vulnerabilities, 0) as vulnerabilities_open
from head h
join public.component_definitions d on d.tenant_id = h.tenant_id and d.id = h.component_definition_id
join public.defined_components c on c.tenant_id = h.tenant_id and c.component_definition_revision_id = h.id
left join public.component_owners named
  on named.tenant_id = d.tenant_id and named.component_definition_id = d.id and named.component_name = c.name
left join public.parties owner on owner.id = coalesce(named.owner_party_id, d.owner_party_id)
left join public.business_lines line on line.id = d.business_line_id
left join product_use pu on pu.head_id = c.id
left join system_use su on su.head_id = c.id
left join standing st on st.defined_component_id = c.id
left join public.component_assessments a on a.id = st.assessment_id
left join claimed cl on cl.defined_component_id = c.id
left join waiting wt on wt.head_id = c.id
left join exposure ex on ex.defined_component_id = c.id;
grant select on public.component_rows to authenticated;
revoke all on public.component_rows from public, anon;
comment on view public.component_rows is 'The components register, one row a component of each component definition''s latest published version (else its latest): its definition by code and name, its type, version and state, its effective owner (its own, else its set''s) and business line by name, how many products (by their current version) and programs use it in any version, how many of those consumers took an older version than the latest published one (consumers_behind) or sit on an inherited element the program declared modified (consumers_modified), and this version''s standing: the controls it claims, how many carry a published determination and how many of those are satisfied, with the newest published assessment one was taken from, how many offers wait on its owner for any of its versions (offers_open), and how many CVEs affect this version (vulnerabilities_open: those a component of its standing SBOM carries in the state affected).';

-- ---------------------------------------------------------------------------------------------
-- An assessment's kind: a control assessment, as every one was, or a cyber test.
--
-- Cyber T&E is a kind of assessment, not another record: a cyber test is an assessment campaign
-- with its plan, its objectives and its results, and its findings are assessment findings on the
-- same chain. A campaign that is a cyber test names its phase: cooperative vulnerability
-- identification (cvi), adversarial cybersecurity DT&E (acd), cooperative vulnerability and
-- penetration assessment (cvpa) or adversarial assessment (aa). A component assessment takes the
-- same two kinds, so a component's Cyber T&E is recorded once for everything built from it. Every
-- campaign and component assessment that was there is a control assessment, and every command
-- that writes one keeps that default.
-- ---------------------------------------------------------------------------------------------
alter table public.assessment_campaigns
  add column if not exists kind text not null default 'control_assessment',
  add column if not exists cyber_test_phase text;
alter table public.component_assessments
  add column if not exists kind text not null default 'control_assessment';
do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'assessment_campaigns_kind') then
    alter table public.assessment_campaigns add constraint assessment_campaigns_kind
      check (kind in ('control_assessment', 'cyber_test'));
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'assessment_campaigns_cyber_test_phase') then
    alter table public.assessment_campaigns add constraint assessment_campaigns_cyber_test_phase
      check (cyber_test_phase is null or cyber_test_phase in ('cvi', 'acd', 'cvpa', 'aa'));
  end if;
  -- A cyber test names its phase, and nothing else does.
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'assessment_campaigns_cyber_test') then
    alter table public.assessment_campaigns add constraint assessment_campaigns_cyber_test
      check ((kind = 'cyber_test') = (cyber_test_phase is not null));
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'component_assessments_kind') then
    alter table public.component_assessments add constraint component_assessments_kind
      check (kind in ('control_assessment', 'cyber_test'));
  end if;
end $$;
create index if not exists assessment_campaigns_kind_idx
  on public.assessment_campaigns(tenant_id, kind) where kind <> 'control_assessment';
comment on column public.assessment_campaigns.kind is 'What kind of assessment the campaign is: control_assessment, as a campaign is unless it says otherwise, or cyber_test (Cyber T&E), whose findings are assessment findings like any other.';
comment on column public.assessment_campaigns.cyber_test_phase is 'The Cyber T&E phase of a cyber test: cvi (cooperative vulnerability identification), acd (adversarial cybersecurity DT&E), cvpa (cooperative vulnerability and penetration assessment) or aa (adversarial assessment); NULL for a control assessment.';
comment on column public.component_assessments.kind is 'What kind of assessment this is: control_assessment, or cyber_test for a component''s Cyber T&E, recorded once for everything built from the component version.';

-- The objectives register says its campaign's kind. Redefined from its definition in
-- 20261114170710_ssp_assembly_and_objective_register_reads with the same columns first;
-- campaign_kind is its last.
create or replace view public.assessment_objective_rows with (security_invoker = true) as
select o.*,
  pr.campaign_id,
  c.program_id,
  cp.name as target_kind,
  case when cp.name = 'assessment-objective' then coalesce(
    (select x->>'value' from jsonb_array_elements(cp.props) x where x->>'name' = 'label' limit 1), k.code)
  end as target_label,
  case when k.id is not null then (public.natural_sort_key(k.code) || ' ' || concat_ws('.',
    lpad(p6.ordinal::text, 6, '0'), lpad(p5.ordinal::text, 6, '0'), lpad(p4.ordinal::text, 6, '0'),
    lpad(p3.ordinal::text, 6, '0'), lpad(p2.ordinal::text, 6, '0'), lpad(p1.ordinal::text, 6, '0'),
    lpad(cp.ordinal::text, 6, '0'))) collate "C"
  end as reading_order,
  c.title as campaign_title,
  c.title collate public.natural_order as campaign_order,
  pr.title as plan_title,
  pr.version_number as plan_version,
  pr.title collate public.natural_order as plan_order,
  o.title collate public.natural_order as title_order,
  c.kind as campaign_kind
from public.assessment_objectives o
join public.assessment_plan_revisions pr on pr.tenant_id = o.tenant_id and pr.id = o.plan_revision_id
join public.assessment_campaigns c on c.tenant_id = pr.tenant_id and c.id = pr.campaign_id
left join public.control_parts cp on cp.id = o.target_control_part_id
left join public.controls k on k.id = cp.control_id
left join public.control_parts p1 on p1.id = cp.parent_part_id
left join public.control_parts p2 on p2.id = p1.parent_part_id
left join public.control_parts p3 on p3.id = p2.parent_part_id
left join public.control_parts p4 on p4.id = p3.parent_part_id
left join public.control_parts p5 on p5.id = p4.parent_part_id
left join public.control_parts p6 on p6.id = p5.parent_part_id;
revoke all on public.assessment_objective_rows from public, anon;
grant select on public.assessment_objective_rows to authenticated;
comment on view public.assessment_objective_rows is 'A campaign''s objectives as its Objectives collections read them, each a page at a time: the Assessment campaigns page''s register, a program''s tab and a campaign record''s Execution tab. Every column of the objective, its plan''s campaign_id and that campaign''s program_id, target_kind (the kind of control part it is aimed at: assessment-objective, statement), target_label (an assessment objective''s label as SP 800-53A prints it, AC-08a.01), reading_order (the target''s place in the catalog''s reading order, compared character by character: the control''s code in natural order, then the part''s ordinal under each part above it; none without a control part), campaign_title, plan_title and plan_version, and sort keys in a reader''s order (campaign_order, plan_order, title_order: the titles in the natural_order collation, numbers by their value), and campaign_kind, its last column: control_assessment, or cyber_test for an objective of a Cyber T&E campaign. The register''s own order: campaign_order, plan_version descending, plan_revision_id, reading_order, title_order; a campaign record''s, the same within its campaign. Security invoker.';

notify pgrst, 'reload schema';
