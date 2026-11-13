-- Customer requirements: the document a program's requirements come from, the answer the program
-- gives to each, and what meets it.
--
-- A program that takes a product is handed its customer's requirements. Until now a requirement
-- said nothing of where it came from, and nothing recorded the program's answer to it.
--
--   requirement_sources        a document a program's requirements were taken from (a customer's
--                              security requirements document, at a named revision)
--   engineering_requirements   source_id and source_reference: the document and the paragraph in it
--   requirement_compliance     the program's answer to one requirement: compliant, partially
--                              compliant, non-compliant or not applicable, how it is verified
--                              (inspection, analysis, demonstration, test or similarity) and the
--                              statement given to the customer
--
-- import_customer_requirements writes a document's requirements in one request: all of them or
-- none, and a request sent again adds only what is not there yet. requirement_source_compliance
-- reads a document back as a compliance matrix, each requirement with what meets it: the product
-- as it is delivered, a change the program made to it, or the program's own elements.
--
-- Every statement here can run again: this migration is also applied by hand.

create table if not exists public.requirement_sources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  program_id uuid not null,
  code text not null check (length(btrim(code)) > 0),
  title text not null check (length(btrim(title)) > 0),
  issuer_party_id uuid,
  document_reference text,
  version_label text,
  received_on date,
  description text,
  unique (tenant_id, id),
  unique (tenant_id, program_id, id),
  unique (tenant_id, program_id, code),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id),
  foreign key (tenant_id, issuer_party_id) references public.parties(tenant_id, id)
);
create table if not exists public.requirement_compliance (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  engineering_requirement_id uuid not null,
  status text not null check (status in ('compliant', 'partially_compliant', 'non_compliant', 'not_applicable')),
  verification_method text check (verification_method in ('inspection', 'analysis', 'demonstration', 'test', 'similarity')),
  statement text,
  unique (tenant_id, id),
  unique (tenant_id, engineering_requirement_id),
  foreign key (tenant_id, engineering_requirement_id) references public.engineering_requirements(tenant_id, id)
);
create table if not exists public.requirement_import_requests (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  program_id uuid not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  result jsonb not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id)
);
do $$
begin
  if not exists (select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'requirement_sources' and policyname = 'tenant_read') then
    perform public.apply_tenant_security('requirement_sources');
    perform public.apply_tenant_security('requirement_compliance');
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.requirement_sources'::regclass and tgname = 'record_lifecycle' and not tgisinternal) then
    perform public.attach_record_lifecycle('requirement_sources', false);
    perform public.attach_record_lifecycle('requirement_compliance', false);
  end if;
  if not exists (select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'requirement_import_requests' and policyname = 'requirement_import_request_read') then
    alter table public.requirement_import_requests enable row level security;
    revoke all on public.requirement_import_requests from public, anon, authenticated;
    grant select on public.requirement_import_requests to authenticated;
    create policy requirement_import_request_read on public.requirement_import_requests
      for select to authenticated using (public.can_read_tenant(tenant_id));
  end if;
end $$;
create or replace trigger stable_context before update on public.requirement_sources
  for each row execute function public.guard_stable_assurance_context('program_id');
create or replace trigger stable_context before update on public.requirement_compliance
  for each row execute function public.guard_stable_assurance_context('engineering_requirement_id');

alter table public.engineering_requirements
  add column if not exists source_id uuid,
  add column if not exists source_reference text;
do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'engineering_requirement_source') then
    alter table public.engineering_requirements
      add constraint engineering_requirement_source
        foreign key (tenant_id, program_id, source_id) references public.requirement_sources(tenant_id, program_id, id),
      add constraint engineering_requirement_source_reference
        check (source_reference is null or (source_id is not null and length(btrim(source_reference)) > 0));
  end if;
end $$;
create unique index if not exists engineering_requirements_source_reference_key
  on public.engineering_requirements(tenant_id, source_id, source_reference) where source_reference is not null;
create index if not exists engineering_requirements_source_idx on public.engineering_requirements(tenant_id, source_id) where source_id is not null;

comment on table public.requirement_sources is 'A document a program''s requirements were taken from: a customer''s requirements document at a named revision. A requirement names its source and its paragraph in it.';
comment on column public.requirement_sources.code is 'Short identifier of the document, unique in the program.';
comment on column public.requirement_sources.issuer_party_id is 'The organization that issued the document.';
comment on column public.requirement_sources.document_reference is 'The issuer''s own number for the document.';
comment on column public.requirement_sources.version_label is 'The revision of the document the requirements were taken from.';
comment on column public.requirement_sources.received_on is 'The day the program received the document.';
comment on column public.engineering_requirements.source_id is 'The document this requirement was taken from; NULL for a requirement the program wrote.';
comment on column public.engineering_requirements.source_reference is 'The paragraph or identifier of this requirement in its source document, unique in the document.';
comment on table public.requirement_compliance is 'The program''s answer to one requirement: whether it complies, how that is verified and the statement given to whoever issued the requirement.';
comment on column public.requirement_compliance.verification_method is 'How compliance is shown: inspection, analysis, demonstration, test, or similarity to an article already verified.';
comment on column public.requirement_compliance.statement is 'The compliance statement as it is given to the issuer.';
comment on table public.requirement_import_requests is 'The receipt of one import of a source document''s requirements, so the same request sent again answers what it answered.';

-- ---------------------------------------------------------------------------------------------
-- Import a document's requirements. The document is found by its code in the program, or made.
-- A requirement is one paragraph of the document: a reference that is already there is passed
-- over, so a request sent again, or a later one that carries more paragraphs, adds only the rest.
-- Everything is written or nothing is.
-- ---------------------------------------------------------------------------------------------
create or replace function public.import_customer_requirements(
  p_tenant_id uuid, p_program_id uuid, p_request_id uuid, p_source jsonb, p_requirements jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_receipt public.requirement_import_requests;
  v_hash text;
  v_source public.requirement_sources;
  v_source_created boolean := false;
  v_code text := nullif(btrim(coalesce(p_source->>'code', '')), '');
  v_title text := nullif(btrim(coalesce(p_source->>'title', '')), '');
  v_item jsonb; v_reference text; v_statement text; v_requirement_code text; v_type text;
  v_requirement uuid; v_created integer := 0; v_skipped integer := 0; v_ids jsonb := '[]'; v_result jsonb;
  v_revision uuid; v_element text; v_system uuid; v_allocated integer := 0;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can import requirements' using errcode = '42501';
  end if;
  if p_request_id is null or jsonb_typeof(p_source) is distinct from 'object'
    or jsonb_typeof(p_requirements) is distinct from 'array' then
    raise exception 'Name the document and its requirements' using errcode = '22023';
  end if;
  if jsonb_array_length(p_requirements) not between 1 and 2000 then
    raise exception 'Import between 1 and 2,000 requirements at a time' using errcode = '22023';
  end if;
  if v_code is null or v_title is null then
    raise exception 'A requirements document needs a code and a title' using errcode = '22023';
  end if;
  v_hash := encode(extensions.digest(jsonb_build_object('program', p_program_id, 'source', p_source, 'requirements', p_requirements)::text, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || '/requirement-import/' || p_program_id::text, 0));
  select * into v_receipt from public.requirement_import_requests where id = p_request_id;
  if found then
    if v_receipt.tenant_id <> p_tenant_id or v_receipt.created_by <> auth.uid() or v_receipt.payload_sha256 <> v_hash then
      raise exception 'This import request was already used with different details' using errcode = 'PT409';
    end if;
    return v_receipt.result;
  end if;
  if not exists (select 1 from public.programs where tenant_id = p_tenant_id and id = p_program_id) then
    raise exception 'This program is no longer available; reload and try again' using errcode = 'P0002';
  end if;
  if exists (select 1 from jsonb_array_elements(p_requirements) r
    where nullif(btrim(coalesce(r->>'reference', '')), '') is null or nullif(btrim(coalesce(r->>'statement', '')), '') is null) then
    raise exception 'Every requirement needs its reference in the document and its statement' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(p_requirements) r group by btrim(r->>'reference') having count(*) > 1) then
    raise exception 'A reference appears twice in this import' using errcode = '22023';
  end if;
  select * into v_source from public.requirement_sources
    where tenant_id = p_tenant_id and program_id = p_program_id and code = v_code;
  if v_source.id is null then
    if nullif(p_source->>'issuerPartyId', '') is not null and not exists (select 1 from public.parties
      where tenant_id = p_tenant_id and id = (p_source->>'issuerPartyId')::uuid) then
      raise exception 'Choose an issuer from this workspace' using errcode = '22023';
    end if;
    insert into public.requirement_sources (tenant_id, program_id, code, title, issuer_party_id, document_reference, version_label, received_on, description)
      values (p_tenant_id, p_program_id, v_code, v_title, nullif(p_source->>'issuerPartyId', '')::uuid,
        nullif(btrim(coalesce(p_source->>'documentReference', '')), ''), nullif(btrim(coalesce(p_source->>'versionLabel', '')), ''),
        nullif(p_source->>'receivedOn', '')::date, nullif(btrim(coalesce(p_source->>'description', '')), ''))
      returning * into v_source;
    v_source_created := true;
  end if;
  for v_item in select value from jsonb_array_elements(p_requirements) loop
    v_reference := btrim(v_item->>'reference');
    v_statement := btrim(v_item->>'statement');
    if exists (select 1 from public.engineering_requirements
      where tenant_id = p_tenant_id and source_id = v_source.id and source_reference = v_reference) then
      v_skipped := v_skipped + 1;
      continue;
    end if;
    v_requirement_code := coalesce(nullif(btrim(coalesce(v_item->>'code', '')), ''), v_source.code || '-' || v_reference);
    if exists (select 1 from public.engineering_requirements
      where tenant_id = p_tenant_id and program_id = p_program_id and code = v_requirement_code) then
      raise exception 'A requirement coded % is already in this program', v_requirement_code using errcode = '23505';
    end if;
    v_type := coalesce(nullif(v_item->>'type', ''), 'security');
    if v_type not in ('functional', 'performance', 'interface', 'security', 'safety', 'design', 'operational', 'other') then
      raise exception 'Requirement % has an unknown type', v_reference using errcode = '22023';
    end if;
    insert into public.engineering_requirements (tenant_id, program_id, code, source_id, source_reference)
      values (p_tenant_id, p_program_id, v_requirement_code, v_source.id, v_reference)
      returning id into v_requirement;
    insert into public.requirement_revisions (tenant_id, engineering_requirement_id, version_number, title, statement, acceptance_criteria, requirement_type, rationale)
      values (p_tenant_id, v_requirement, 1,
        coalesce(nullif(btrim(coalesce(v_item->>'title', '')), ''), left(v_statement, 120)),
        v_statement,
        coalesce(nullif(btrim(coalesce(v_item->>'acceptanceCriteria', '')), ''), 'Not stated in the source document.'),
        v_type, nullif(btrim(coalesce(v_item->>'rationale', '')), ''))
      returning id into v_revision;
    -- The elements the document names for the requirement, by their code in this program: an
    -- allocation each. A code the program does not hold stops the whole import, by name.
    if jsonb_typeof(v_item->'elements') = 'array' then
      for v_element in select min(btrim(e.value)) from jsonb_array_elements_text(v_item->'elements') e
          where btrim(e.value) <> '' group by lower(btrim(e.value)) loop
        select s.id into v_system from public.systems s
          where s.tenant_id = p_tenant_id and s.program_id = p_program_id and lower(s.code) = lower(v_element);
        if v_system is null then
          raise exception 'Requirement % names element %, which is not in this program', v_reference, v_element using errcode = '22023';
        end if;
        insert into public.requirement_allocations (tenant_id, requirement_revision_id, system_id, rationale)
          values (p_tenant_id, v_revision, v_system, 'Allocated as the source document names it.');
        v_allocated := v_allocated + 1;
      end loop;
    end if;
    v_created := v_created + 1;
    v_ids := v_ids || to_jsonb(v_requirement);
  end loop;
  v_result := jsonb_build_object('sourceId', v_source.id, 'sourceCreated', v_source_created,
    'created', v_created, 'skipped', v_skipped, 'allocated', v_allocated, 'requirementIds', v_ids);
  insert into public.requirement_import_requests (id, tenant_id, program_id, payload_sha256, result, created_by)
    values (p_request_id, p_tenant_id, p_program_id, v_hash, v_result, auth.uid());
  return v_result;
end;
$$;
revoke all on function public.import_customer_requirements(uuid, uuid, uuid, jsonb, jsonb) from public, anon;
grant execute on function public.import_customer_requirements(uuid, uuid, uuid, jsonb, jsonb) to authenticated;
comment on function public.import_customer_requirements(uuid, uuid, uuid, jsonb, jsonb) is 'Imports the requirements of one source document into a program, each with its reference in the document and allocated to the elements the document names by code: all written or none, a reference already there passed over, and the same request sent again answering what it answered.';

-- ---------------------------------------------------------------------------------------------
-- A source document as a compliance matrix: each of its requirements with the program's answer,
-- what it rests on and what meets it.
--
-- What meets a requirement is read from the elements it is allocated to:
--
--   variant_change   one of them is an inherited product element the program modified
--   program          none is modified and one is the program's own, with no product behind it
--   product          all are product elements as the product delivers them, or the variant itself
--   unallocated      it is allocated to no element
--
-- A requirement nobody has answered has no compliance, which is not non-compliance: it is counted
-- apart as unanswered.
-- ---------------------------------------------------------------------------------------------
create or replace function public.requirement_source_compliance(p_tenant_id uuid, p_source_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_source public.requirement_sources;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  select * into v_source from public.requirement_sources where tenant_id = p_tenant_id and id = p_source_id;
  if v_source.id is null then
    raise exception 'Requirements document access is required' using errcode = '42501';
  end if;
  with
  reqs as materialized (
    select q.id, q.code, q.source_reference, v.id as revision_id, v.title, v.statement, v.requirement_type
    from public.engineering_requirements q
    join public.requirement_revisions v on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
    where q.tenant_id = p_tenant_id and q.source_id = p_source_id
      and v.version_number = (select max(x.version_number) from public.requirement_revisions x
        where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)
  ),
  allocated as materialized (
    select r.id as requirement_id, s.id as system_id, s.code, s.name,
      case
        when s.product_change_kinds is not null then 'modified'
        when s.product_element_id is not null or s.product_configuration_id is not null then 'inherited'
        else 'own'
      end as standing
    from reqs r
    join public.requirement_allocations a on a.tenant_id = p_tenant_id and a.requirement_revision_id = r.revision_id
    join public.systems s on s.tenant_id = a.tenant_id and s.id = a.system_id
  ),
  met as (
    select r.id as requirement_id,
      case
        when count(a.system_id) = 0 then 'unallocated'
        when bool_or(a.standing = 'modified') then 'variant_change'
        when bool_or(a.standing = 'own') then 'program'
        else 'product'
      end as met_by,
      coalesce(jsonb_agg(jsonb_build_object('system_id', a.system_id, 'code', a.code, 'name', a.name, 'standing', a.standing)
        order by a.code) filter (where a.system_id is not null), '[]'::jsonb) as elements
    from reqs r left join allocated a on a.requirement_id = r.id
    group by r.id
  ),
  mapped as (
    select r.id as requirement_id, count(distinct l.control_id) as controls
    from reqs r join public.requirement_control_links l on l.tenant_id = p_tenant_id and l.requirement_revision_id = r.revision_id
    group by r.id
  ),
  cited as (
    select r.id as requirement_id, count(distinct e.evidence_version_id) as evidence
    from reqs r join public.requirement_evidence e on e.tenant_id = p_tenant_id and e.requirement_revision_id = r.revision_id
    group by r.id
  ),
  line as materialized (
    select r.id, r.code, r.source_reference, r.revision_id, r.title, r.statement, r.requirement_type,
      public.natural_sort_key(r.source_reference) collate "C" as reference_order,
      c.status, c.verification_method, c.statement as compliance_statement,
      m.met_by, m.elements, coalesce(k.controls, 0) as controls, coalesce(e.evidence, 0) as evidence
    from reqs r
    join met m on m.requirement_id = r.id
    left join public.requirement_compliance c on c.tenant_id = p_tenant_id and c.engineering_requirement_id = r.id
    left join mapped k on k.requirement_id = r.id
    left join cited e on e.requirement_id = r.id
  )
  select jsonb_build_object(
    'source', jsonb_build_object(
      'id', v_source.id, 'program_id', v_source.program_id, 'code', v_source.code, 'title', v_source.title,
      'issuer_party_id', v_source.issuer_party_id, 'document_reference', v_source.document_reference,
      'version_label', v_source.version_label, 'received_on', v_source.received_on),
    'totals', jsonb_build_object(
      'requirements', (select count(*) from line),
      'compliant', (select count(*) from line where status = 'compliant'),
      'partially_compliant', (select count(*) from line where status = 'partially_compliant'),
      'non_compliant', (select count(*) from line where status = 'non_compliant'),
      'not_applicable', (select count(*) from line where status = 'not_applicable'),
      'unanswered', (select count(*) from line where status is null),
      'met_by', jsonb_build_object(
        'product', (select count(*) from line where met_by = 'product'),
        'variant_change', (select count(*) from line where met_by = 'variant_change'),
        'program', (select count(*) from line where met_by = 'program'),
        'unallocated', (select count(*) from line where met_by = 'unallocated'))),
    'requirements', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id, 'code', l.code, 'reference', l.source_reference, 'revision_id', l.revision_id,
        'title', l.title, 'statement', l.statement, 'type', l.requirement_type,
        'status', l.status, 'verification_method', l.verification_method, 'compliance_statement', l.compliance_statement,
        'met_by', l.met_by, 'elements', l.elements, 'controls', l.controls, 'evidence', l.evidence
      ) order by l.reference_order, l.code), '[]'::jsonb)
      from line l)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.requirement_source_compliance(uuid, uuid) from public, anon;
grant execute on function public.requirement_source_compliance(uuid, uuid) to authenticated;
comment on function public.requirement_source_compliance(uuid, uuid) is 'A source document as a compliance matrix: each requirement with the program''s answer, how it is verified, the controls it maps and evidence it cites, and what meets it (the product as delivered, a change the program made to it, the program''s own elements, or nothing allocated). An unanswered requirement is counted apart, never as non-compliant.';

notify pgrst, 'reload schema';
