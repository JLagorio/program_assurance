-- Reference frameworks: publications the product reads beside the control catalog that are not
-- OSCAL catalogs. NIST SP 800-160 is the first: the cyber resiliency constructs of Volume 2 and
-- the controls that support them (Table E-1), the ATT&CK techniques of its Appendix F with the
-- approaches and controls that counter them, and the life cycle processes of Volume 1 with their
-- security outcomes. NIST publishes none of it in machine-readable form, so each revision is a
-- transcription this project pins by its SHA-256 (docs/reference-seeding.md).
--
-- The tables follow the reference schema as the CCI list does: a NULL tenant owns a shared row that
-- only the importer writes, a published revision and everything under it reject change, and a
-- control is named by its row in one catalog revision. A vocabulary does not go into catalogs or
-- controls, where every reader would have to tell a technique from a control, and its links do not
-- go into mapping_collections, whose endpoints are controls and their parts.
--
-- Every statement here can run again: this migration is also applied by hand.

-- ---------------------------------------------------------------------------------------------
-- The framework, its revisions and what a revision holds.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.frameworks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  source_id uuid not null references public.ref_sources(id),
  code text not null check (code ~ '^[a-z0-9][a-z0-9-]*$'),
  title text not null check (btrim(title) <> ''),
  current_revision_id uuid,
  unique nulls not distinct (tenant_id, code),
  unique (tenant_id, id)
);

create table if not exists public.framework_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  framework_id uuid not null references public.frameworks(id),
  version text not null check (btrim(version) <> ''),
  title text not null check (btrim(title) <> ''),
  format text not null check (btrim(format) <> ''),
  content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  input_sha256 text not null check (input_sha256 ~ '^[a-f0-9]{64}$'),
  catalog_revision_id uuid references public.catalog_revisions(id),
  source_document jsonb not null check (jsonb_typeof(source_document) = 'object'),
  method jsonb not null default '{}' check (jsonb_typeof(method) = 'object'),
  corrections jsonb not null default '[]' check (jsonb_typeof(corrections) = 'array'),
  state public.reference_revision_state not null default 'draft',
  unique (framework_id, input_sha256),
  unique (tenant_id, id)
);

do $$ begin
  if not exists (select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.frameworks'::regclass and conname = 'frameworks_current_revision_id_fkey') then
    alter table public.frameworks add constraint frameworks_current_revision_id_fkey
      foreign key (current_revision_id) references public.framework_revisions(id);
  end if;
end $$;

create table if not exists public.framework_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  framework_revision_id uuid not null references public.framework_revisions(id),
  parent_item_id uuid,
  kind text not null check (btrim(kind) <> ''),
  code text not null check (code ~ '^[A-Za-z0-9][A-Za-z0-9._()-]*$'),
  title text not null check (btrim(title) <> ''),
  prose text check (btrim(prose) <> ''),
  ordinal integer not null check (ordinal > 0),
  props jsonb not null default '{}' check (jsonb_typeof(props) = 'object'),
  printed_in text not null check (btrim(printed_in) <> ''),
  unique (id, framework_revision_id),
  unique (framework_revision_id, code),
  unique (tenant_id, id),
  foreign key (parent_item_id, framework_revision_id) references public.framework_items(id, framework_revision_id),
  check (id is distinct from parent_item_id)
);

create table if not exists public.framework_item_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  framework_revision_id uuid not null references public.framework_revisions(id),
  source_item_id uuid not null references public.framework_items(id),
  target_item_id uuid not null references public.framework_items(id),
  relation text not null check (btrim(relation) <> ''),
  ordinal integer check (ordinal > 0),
  props jsonb not null default '{}' check (jsonb_typeof(props) = 'object'),
  source_identifier text not null check (btrim(source_identifier) <> ''),
  printed_in text not null check (btrim(printed_in) <> ''),
  unique (framework_revision_id, source_identifier),
  unique (tenant_id, id)
);

create table if not exists public.framework_control_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  framework_revision_id uuid not null references public.framework_revisions(id),
  item_id uuid not null references public.framework_items(id),
  control_label text not null check (control_label ~ '^[A-Z]{2}-[1-9][0-9]*(\([1-9][0-9]*\))?$'),
  control_id uuid,
  catalog_revision_id uuid references public.catalog_revisions(id),
  resolution_status public.reference_resolution_status not null,
  relation text not null check (btrim(relation) <> ''),
  ordinal integer check (ordinal > 0),
  props jsonb not null default '{}' check (jsonb_typeof(props) = 'object'),
  source_identifier text not null check (btrim(source_identifier) <> ''),
  printed_in text not null check (btrim(printed_in) <> ''),
  unique (framework_revision_id, source_identifier),
  unique (tenant_id, id),
  foreign key (control_id, catalog_revision_id) references public.controls(id, catalog_revision_id),
  check ((resolution_status = 'resolved') = (control_id is not null)),
  check ((control_id is null) = (catalog_revision_id is null))
);

-- ---------------------------------------------------------------------------------------------
-- Ownership. reference_ancestor_guard walks reference_owner from a row to its revision, so a
-- published revision freezes its items and links, and a child keeps its parent's tenant. The
-- function is rewritten from its stored definition, so the tables other migrations name stay.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_old text; v_new text;
begin
  v_old := pg_catalog.pg_get_functiondef('public.reference_owner(text)'::regprocedure);
  if position('''framework_control_links''' in v_old) > 0 then return; end if;
  v_new := replace(v_old, 'else null end',
    'when ''framework_revisions'' then array[''frameworks'',''framework_id'']
    when ''framework_items'' then array[''framework_revisions'',''framework_revision_id'']
    when ''framework_item_links'' then array[''framework_revisions'',''framework_revision_id'']
    when ''framework_control_links'' then array[''framework_revisions'',''framework_revision_id'']
    else null end');
  if v_new = v_old then raise exception 'reference_owner no longer ends its list with "else null end"'; end if;
  execute v_new;
end $$;

-- What the foreign keys cannot say.
create or replace function public.framework_semantics_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare pinned_catalog uuid; label text;
begin
  if tg_table_name = 'frameworks' then
    if new.current_revision_id is not null and not exists (
      select 1 from public.framework_revisions r
      where r.id = new.current_revision_id and r.framework_id = new.id and r.state = 'published'
    ) then
      raise exception 'A framework''s current revision is one of its own published revisions' using errcode = '23514';
    end if;
  elsif tg_table_name = 'framework_revisions' then
    if tg_op = 'UPDATE' and new.catalog_revision_id is distinct from old.catalog_revision_id and exists (
      select 1 from public.framework_control_links l where l.framework_revision_id = new.id and l.control_id is not null
    ) then
      raise exception 'A framework revision with resolved control links keeps its catalog revision' using errcode = '23514';
    end if;
    if new.state = 'published' and (tg_op = 'INSERT' or old.state is distinct from new.state) then
      if new.catalog_revision_id is not null and not exists (
        select 1 from public.catalog_revisions c where c.id = new.catalog_revision_id and c.state = 'published'
      ) then
        raise exception 'A published framework revision resolves its controls against a published catalog revision' using errcode = '23514';
      end if;
      -- A link may name an item of another revision (an ATT&CK technique and the approach that
      -- affects it). That revision is published first, so the item can no longer change.
      if exists (
        select 1 from public.framework_item_links l
        join public.framework_items i on i.id in (l.source_item_id, l.target_item_id)
        join public.framework_revisions r on r.id = i.framework_revision_id
        where l.framework_revision_id = new.id and r.id <> new.id and r.state <> 'published'
      ) or exists (
        select 1 from public.framework_control_links l
        join public.framework_items i on i.id = l.item_id
        join public.framework_revisions r on r.id = i.framework_revision_id
        where l.framework_revision_id = new.id and r.id <> new.id and r.state <> 'published'
      ) then
        raise exception 'A published framework revision links its own items and those of published revisions' using errcode = '23514';
      end if;
    end if;
  elsif tg_table_name = 'framework_control_links' then
    if new.control_id is null then return new; end if;
    select r.catalog_revision_id into pinned_catalog from public.framework_revisions r where r.id = new.framework_revision_id;
    if pinned_catalog is distinct from new.catalog_revision_id then
      raise exception 'A framework control link resolves against the catalog revision its framework revision names' using errcode = '23514';
    end if;
    select c.code into label from public.controls c where c.id = new.control_id;
    if label is distinct from new.control_label then
      raise exception 'A resolved framework control link names its control as the catalog labels it' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.framework_semantics_guard() from public, anon, authenticated;

-- Shared rows are read-only to authenticated clients; a tenant writer may author its own. The
-- same grants, policies and triggers the reference schema gives its tables.
do $$
declare t text;
begin
  foreach t in array array['frameworks','framework_revisions','framework_items','framework_item_links','framework_control_links'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists reference_read on public.%I', t);
    execute format('create policy reference_read on public.%I for select to authenticated using (tenant_id is null or public.can_read_tenant(tenant_id))', t);
    execute format('drop policy if exists reference_insert on public.%I', t);
    execute format('create policy reference_insert on public.%I for insert to authenticated with check (tenant_id is not null and public.can_write_tenant(tenant_id))', t);
    execute format('drop policy if exists reference_update on public.%I', t);
    execute format('create policy reference_update on public.%I for update to authenticated using (tenant_id is not null and public.can_write_tenant(tenant_id)) with check (tenant_id is not null and public.can_write_tenant(tenant_id))', t);
    execute format('drop policy if exists reference_delete on public.%I', t);
    execute format('create policy reference_delete on public.%I for delete to authenticated using (tenant_id is not null and public.can_write_tenant(tenant_id))', t);
    if not exists (select 1 from pg_catalog.pg_trigger
      where tgrelid = format('public.%I', t)::regclass and tgname = 'record_lifecycle' and not tgisinternal) then
      perform public.attach_record_lifecycle(t, false);
    end if;
    execute format('create or replace trigger reference_ancestor_guard before insert or update or delete on public.%I for each row execute function public.reference_ancestor_guard()', t);
  end loop;
  foreach t in array array['frameworks','framework_revisions','framework_control_links'] loop
    execute format('create or replace trigger framework_semantics_guard before insert or update on public.%I for each row execute function public.framework_semantics_guard()', t);
  end loop;
end;
$$;
-- After the statement's rows are in, as the catalog's hierarchies are checked.
create or replace trigger reference_hierarchy_guard after insert or update on public.framework_items
  for each row execute function public.reference_hierarchy_guard('parent_item_id');

create index if not exists framework_revisions_framework_idx on public.framework_revisions(framework_id, state);
create index if not exists framework_revisions_catalog_idx on public.framework_revisions(catalog_revision_id);
create index if not exists framework_items_kind_idx on public.framework_items(framework_revision_id, kind);
create index if not exists framework_items_parent_idx on public.framework_items(parent_item_id);
create index if not exists framework_items_code_idx on public.framework_items(code);
create index if not exists framework_item_links_relation_idx on public.framework_item_links(framework_revision_id, relation);
create index if not exists framework_item_links_source_idx on public.framework_item_links(source_item_id);
create index if not exists framework_item_links_target_idx on public.framework_item_links(target_item_id);
create index if not exists framework_control_links_item_idx on public.framework_control_links(item_id);
create index if not exists framework_control_links_control_idx on public.framework_control_links(control_id);
create index if not exists framework_control_links_catalog_idx on public.framework_control_links(catalog_revision_id, framework_revision_id);
create index if not exists framework_control_links_technique_idx on public.framework_control_links(framework_revision_id, (props->>'technique'));

comment on table public.frameworks is 'A reference publication that is not an OSCAL catalog, such as the cyber resiliency constructs of NIST SP 800-160 Vol. 2. Its revisions hold its items and links.';
comment on column public.frameworks.code is 'The framework''s stable name, such as nist-sp800-160v2r1-cref. An item of another framework is named <framework code>:<item code>.';
comment on column public.frameworks.title is 'The name the product shows. The importer keeps it the title of the current revision.';
comment on column public.frameworks.current_revision_id is 'The published revision the product reads: the one the last import of the pinned sources named. Empty until one is named, when the views read the published revision recorded last.';
comment on table public.framework_revisions is 'One reading of a framework: a pinned transcription with the catalog revision and the other frameworks its links were resolved against. A published revision and its items and links are immutable.';
comment on column public.framework_revisions.format is 'The format the transcription was written in, such as reference-framework/1.';
comment on column public.framework_revisions.content_sha256 is 'The SHA-256 of the transcription''s decompressed bytes, as the reference manifest pins it.';
comment on column public.framework_revisions.input_sha256 is 'A digest of everything the revision was built from: the transcription, the catalog its control labels were resolved against and the framework revisions its links name. A change to any of them is a new revision.';
comment on column public.framework_revisions.catalog_revision_id is 'The catalog revision the revision''s control labels were resolved against; empty for a framework that links no control.';
comment on column public.framework_revisions.source_document is 'The publication the revision was transcribed from: its title, authority, URL, DOI, SHA-256, byte count, page count, publication date and rights statement.';
comment on column public.framework_revisions.method is 'How the transcription was made: the tool, its version and the script.';
comment on column public.framework_revisions.corrections is 'Every place the transcription departs from the printed text: where, what is printed, what was transcribed and why.';
comment on table public.framework_items is 'One named thing a framework defines: a goal, a technique, an approach, an ATT&CK technique, a process, an outcome. Its kind says which, and its parent the item that holds it.';
comment on column public.framework_items.code is 'The item''s code, unique in its revision and the same in every revision of the framework.';
comment on column public.framework_items.printed_in is 'Where the publication prints the item: its table or section and page.';
comment on table public.framework_item_links is 'A relation the publication prints between two items: a technique supports an objective, an ATT&CK technique belongs to a tactic. The target may be an item of another framework.';
comment on column public.framework_item_links.source_identifier is 'The link''s place in the publication, unique in its revision.';
comment on table public.framework_control_links is 'A relation the publication prints between a control and an item: a control supports an approach, a control mitigates an ATT&CK technique. Only what the source prints; nothing is inferred.';
comment on column public.framework_control_links.control_label is 'The control as the publication prints it, such as AC-2(6).';
comment on column public.framework_control_links.control_id is 'The control the label names in the revision''s catalog revision; empty while the label is unresolved.';
comment on column public.framework_control_links.ordinal is 'The link''s place where the publication orders it: in Table E-1 the place of its technique group in the control''s row (1 is the technique the control supports most strongly), in Appendix F the place of its row under its technique and mitigation.';
comment on column public.framework_control_links.props is 'What the publication prints with the link. A technique is the code of the item the link is printed under, in the same revision; framework_control_link_rows reads it as technique_code.';

-- ---------------------------------------------------------------------------------------------
-- Reads. The views run as the reader (security_invoker), so row-level security on every table
-- they read decides what the reader sees. They answer for the revision the product reads: the one
-- its framework names as current, else the published revision recorded last.
-- ---------------------------------------------------------------------------------------------

-- One row per framework that has a published revision: the revision the product reads, what it
-- was transcribed from and what the reference source says of the copy.
create or replace view public.framework_rows with (security_invoker = true) as
select f.id, f.tenant_id, f.code, f.title,
  r.id as framework_revision_id, r.version, r.format, r.content_sha256, r.input_sha256,
  r.catalog_revision_id, r.source_document, r.method, r.corrections, r.created_at as recorded_at,
  s.authority, s.authoritative, s.rights, s.notes
from public.frameworks f
join public.ref_sources s on s.id = f.source_id
join (
  select distinct on (x.framework_id) x.*
  from public.framework_revisions x
  join public.frameworks xf on xf.id = x.framework_id
  where x.state = 'published'
  order by x.framework_id, (x.id = xf.current_revision_id) desc nulls last, x.created_at desc, x.id desc
) r on r.framework_id = f.id;
revoke all on public.framework_rows from public, anon, authenticated;
grant select on public.framework_rows to authenticated;
comment on view public.framework_rows is 'The frameworks the product reads, one row a framework: its current revision with the document it was transcribed from, the method, the corrections, the catalog revision its control labels name, and the authority and rights its reference source records.';

-- One row per item of each framework's current revision, with its parent.
create or replace view public.framework_item_rows with (security_invoker = true) as
select i.id, i.tenant_id, f.id as framework_id, f.code as framework_code,
  i.framework_revision_id, r.version as revision_version,
  i.kind, i.code, public.natural_sort_key(i.code) collate "C" as code_order,
  i.title, i.prose, i.ordinal, i.props, i.printed_in,
  i.parent_item_id, p.code as parent_code, p.kind as parent_kind, p.title as parent_title
from public.framework_items i
join public.framework_revisions r on r.id = i.framework_revision_id
join public.frameworks f on f.id = r.framework_id
join (
  select distinct on (x.framework_id) x.id
  from public.framework_revisions x
  join public.frameworks xf on xf.id = x.framework_id
  where x.state = 'published'
  order by x.framework_id, (x.id = xf.current_revision_id) desc nulls last, x.created_at desc, x.id desc
) shown on shown.id = r.id
left join public.framework_items p on p.id = i.parent_item_id;
revoke all on public.framework_item_rows from public, anon, authenticated;
grant select on public.framework_item_rows to authenticated;
comment on view public.framework_item_rows is 'The items of each framework''s current revision, one row an item: its framework''s code, its kind, its code in reading order (code_order) and its parent''s code, kind and title.';

-- One row per item link of each framework's current revision, with both items.
create or replace view public.framework_item_link_rows with (security_invoker = true) as
select l.id, l.tenant_id, f.id as framework_id, f.code as framework_code,
  l.framework_revision_id, l.relation, l.ordinal, l.props, l.source_identifier, l.printed_in,
  l.source_item_id, s.code as source_code, s.kind as source_kind, s.title as source_title,
  sf.code as source_framework_code,
  l.target_item_id, t.code as target_code, t.kind as target_kind, t.title as target_title,
  tf.code as target_framework_code
from public.framework_item_links l
join public.framework_revisions r on r.id = l.framework_revision_id
join public.frameworks f on f.id = r.framework_id
join (
  select distinct on (x.framework_id) x.id
  from public.framework_revisions x
  join public.frameworks xf on xf.id = x.framework_id
  where x.state = 'published'
  order by x.framework_id, (x.id = xf.current_revision_id) desc nulls last, x.created_at desc, x.id desc
) shown on shown.id = r.id
join public.framework_items s on s.id = l.source_item_id
join public.framework_revisions sr on sr.id = s.framework_revision_id
join public.frameworks sf on sf.id = sr.framework_id
join public.framework_items t on t.id = l.target_item_id
join public.framework_revisions tr on tr.id = t.framework_revision_id
join public.frameworks tf on tf.id = tr.framework_id;
revoke all on public.framework_item_link_rows from public, anon, authenticated;
grant select on public.framework_item_link_rows to authenticated;
comment on view public.framework_item_link_rows is 'The item links of each framework''s current revision, one row a link: its relation and both items by code, kind, title and framework.';

-- One row per control link, with its item, the item's parent and the control. A revision resolves
-- its labels against one catalog revision, so the rows are those of the revision the product reads
-- for each catalog revision: a program on an earlier edition keeps the links to its own controls.
--
-- A link may be printed inside a group its item does not belong to by definition: Table E-1 lists
-- the approach Self-Challenge, which Table D-4 holds under Coordinated Protection, in a Deception
-- group for SR-7. The link keeps the group it is printed in as props.technique, and the technique_
-- columns are that item of the same revision. They are empty for a link that names none.
create or replace view public.framework_control_link_rows with (security_invoker = true) as
select l.id, l.tenant_id, f.id as framework_id, f.code as framework_code,
  l.framework_revision_id, l.relation, l.ordinal, l.props, l.source_identifier, l.printed_in,
  l.item_id, i.code as item_code, i.kind as item_kind, i.title as item_title,
  i.parent_item_id, p.code as parent_item_code, p.kind as parent_item_kind, p.title as parent_item_title,
  l.control_label, public.natural_sort_key(l.control_label) collate "C" as control_order,
  l.resolution_status, l.control_id, c.code as control_code, c.title as control_title,
  l.catalog_revision_id,
  t.id as technique_item_id, t.code as technique_code, t.title as technique_title
from public.framework_control_links l
join public.framework_revisions r on r.id = l.framework_revision_id
join public.frameworks f on f.id = r.framework_id
join (
  select distinct on (x.framework_id, x.catalog_revision_id) x.id
  from public.framework_revisions x
  join public.frameworks xf on xf.id = x.framework_id
  where x.state = 'published'
  order by x.framework_id, x.catalog_revision_id,
    (x.id = xf.current_revision_id) desc nulls last, x.created_at desc, x.id desc
) shown on shown.id = r.id
join public.framework_items i on i.id = l.item_id
left join public.framework_items p on p.id = i.parent_item_id
left join public.controls c on c.id = l.control_id
left join public.framework_items t on t.framework_revision_id = l.framework_revision_id and t.code = l.props->>'technique';
revoke all on public.framework_control_link_rows from public, anon, authenticated;
grant select on public.framework_control_link_rows to authenticated;
comment on view public.framework_control_link_rows is 'The control links a framework''s current revision prints, one row a link: its relation, its place and its properties, the item with its parent, the control with its label in reading order (control_order) and its catalog revision, and the technique the link is printed under (technique_item_id, technique_code, technique_title), which is not always the item''s parent.';
