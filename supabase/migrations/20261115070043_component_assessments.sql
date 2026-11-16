-- Component assessments: a shared library component is assessed once, has a named owner, and
-- everything built from it can see what it took and whether it is behind.
--
-- A component of the library lives in one version of its definition (defined_components in a
-- component_definition_revisions row), so a defined component is a component version. Until now a
-- determination existed only on a product's element (product_determinations) or inside a program,
-- and nothing answered who uses a component. This migration adds, and changes nothing that was
-- there:
--
--   component_definitions.owner_party_id   who answers for the component, a person or an organization,
--   component_definitions.business_line_id and the business line it belongs to
--   component_assessments        one assessment of a published component version against a control
--   component_determinations     baseline, with a determination for each component and control
--
-- Two commands write them, as the product's do: record_component_determinations records one
-- determination for many controls of one component of a draft assessment, or clears them, and
-- publish_component_assessment freezes a draft at the revision the reader saw, one answer a request.
--
-- Four reads answer in one request each, as the caller, so row-level security decides every row:
--
--   component_assessment_sheet   one assessment as its author works it
--   component_control_status     where a component version stands on each control
--   component_consumers          where a component is used: the products and the systems built from
--                                it, the version each took and how far behind it is
--   system_upstream              what a system takes from above: its product, and each library
--                                component with the version taken and the component's standing
--
-- and component_rows is the register's view, one row a component.
--
-- A component has no identity of its own across the versions of its definition. It is followed by
-- its name, as update_library_assignment follows it when a program takes a newer version: the
-- versions of a component are the components of that name in the revisions of its definition. A
-- consumer is behind by the published versions of the definition that are newer than the one it
-- took.
--
-- Nothing here changes what product_control_status or program_control_status answer: a component's
-- determinations are read by the reads of this migration only.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- A shared component has a named owner and may belong to a business line.
-- ---------------------------------------------------------------------------------------------
alter table public.component_definitions
  add column if not exists owner_party_id uuid,
  add column if not exists business_line_id uuid;
do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'component_definitions_owner') then
    alter table public.component_definitions add constraint component_definitions_owner
      foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id);
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'component_definitions_business_line') then
    alter table public.component_definitions add constraint component_definitions_business_line
      foreign key (tenant_id, business_line_id) references public.business_lines(tenant_id, id);
  end if;
end $$;
create index if not exists component_definitions_owner_idx on public.component_definitions(tenant_id, owner_party_id);
create index if not exists component_definitions_business_line_idx on public.component_definitions(tenant_id, business_line_id);
comment on column public.component_definitions.owner_party_id is 'The person or organization that answers for the component across everything built from it; NULL while nobody is named.';
comment on column public.component_definitions.business_line_id is 'The business line the component belongs to; NULL for a component not placed in one.';

-- ---------------------------------------------------------------------------------------------
-- A component assessed: one assessment of a published component version against a control baseline.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.component_assessments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  component_definition_revision_id uuid not null,
  profile_resolution_id uuid not null references public.profile_resolutions(id),
  title text not null check (length(btrim(title)) > 0),
  description text,
  assessor_party_id uuid,
  state text not null default 'draft' check (state in ('draft', 'published')),
  published_at timestamptz,
  check ((state = 'published') = (published_at is not null)),
  started_on date,
  completed_on date,
  check (completed_on is null or started_on is null or completed_on >= started_on),
  unique (tenant_id, id),
  unique (tenant_id, id, component_definition_revision_id),
  foreign key (tenant_id, component_definition_revision_id)
    references public.component_definition_revisions(tenant_id, id),
  foreign key (tenant_id, assessor_party_id) references public.parties(tenant_id, id)
);
-- The component a determination judges belongs to the version the assessment judges: both keys
-- carry the version.
create table if not exists public.component_determinations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  component_assessment_id uuid not null,
  component_definition_revision_id uuid not null,
  defined_component_id uuid not null,
  control_id uuid not null references public.controls(id),
  determination text not null check (determination in ('satisfied', 'partially_satisfied', 'other_than_satisfied')),
  rationale text,
  assessment_finding_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, component_assessment_id, component_definition_revision_id)
    references public.component_assessments(tenant_id, id, component_definition_revision_id),
  foreign key (tenant_id, component_definition_revision_id, defined_component_id)
    references public.defined_components(tenant_id, component_definition_revision_id, id),
  foreign key (tenant_id, assessment_finding_id) references public.assessment_findings(tenant_id, id),
  unique (tenant_id, component_assessment_id, defined_component_id, control_id)
);
create index if not exists component_assessments_revision_idx
  on public.component_assessments(tenant_id, component_definition_revision_id);
create index if not exists component_determinations_assessment_idx
  on public.component_determinations(tenant_id, component_assessment_id);
create index if not exists component_determinations_component_idx
  on public.component_determinations(tenant_id, defined_component_id);
create index if not exists component_determinations_control_idx on public.component_determinations(control_id);

-- What the foreign keys cannot say: an assessment judges a version that no longer changes, against
-- a published control baseline; a determination names a control of that baseline.
create or replace function public.guard_component_assessment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_state text;
begin
  select state into v_state from public.component_definition_revisions
    where tenant_id = new.tenant_id and id = new.component_definition_revision_id;
  if v_state is distinct from 'published' then
    raise exception 'Assess a published component version' using errcode = '23514';
  end if;
  select state into v_state from public.profile_resolutions where id = new.profile_resolution_id;
  if v_state is distinct from 'published' then
    raise exception 'Assess a component against a published control baseline' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_component_assessment() from public, anon, authenticated;

create or replace function public.guard_component_determination() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_resolution uuid;
begin
  select profile_resolution_id into v_resolution from public.component_assessments
    where tenant_id = new.tenant_id and id = new.component_assessment_id;
  if not exists (select 1 from public.selected_controls sc
    where sc.profile_resolution_id = v_resolution and sc.control_id = new.control_id) then
    raise exception 'A determination names a control of the assessment''s control baseline' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_component_determination() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'component_assessments' and policyname = 'tenant_read') then
    perform public.apply_tenant_security('component_assessments');
    perform public.apply_tenant_security('component_determinations');
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.component_assessments'::regclass and tgname = 'record_lifecycle' and not tgisinternal) then
    perform public.attach_record_lifecycle('component_assessments', true);
    perform public.attach_record_lifecycle('component_determinations', false);
    perform public.attach_parent_immutability('component_determinations', 'component_assessments', 'component_assessment_id');
    perform public.attach_reference_tenant_guard('component_assessments', 'profile_resolution_id', 'profile_resolutions');
    perform public.attach_reference_tenant_guard('component_determinations', 'control_id', 'controls');
  end if;
end $$;
create or replace trigger stable_context before update on public.component_assessments
  for each row execute function public.guard_stable_assurance_context('component_definition_revision_id', 'profile_resolution_id');
create or replace trigger stable_context before update on public.component_determinations
  for each row execute function public.guard_stable_assurance_context('component_assessment_id', 'defined_component_id', 'control_id');
create or replace trigger a_component_assessment before insert on public.component_assessments
  for each row execute function public.guard_component_assessment();
create or replace trigger a_component_determination before insert on public.component_determinations
  for each row execute function public.guard_component_determination();

comment on table public.component_assessments is 'One assessment of a published component version (a revision of a component definition) against a control baseline. Its determinations are recorded for each component of that version and control, so a component is assessed once for everything built from it. A published assessment is immutable.';
comment on column public.component_assessments.component_definition_revision_id is 'The component version assessed: a published revision of a component definition.';
comment on column public.component_assessments.profile_resolution_id is 'The control baseline the component was assessed against.';
comment on column public.component_assessments.assessor_party_id is 'The person or organization that made the determinations.';
comment on table public.component_determinations is 'An assessor''s determination on one control for one component of the assessed component version. Where published assessments judge a component on a control more than once, the latest published one stands.';
comment on column public.component_determinations.defined_component_id is 'The component judged, one of the assessed version''s.';
comment on column public.component_determinations.assessment_finding_id is 'The assessment finding of a program''s campaign this determination was drawn from, when the work was done there.';

-- ---------------------------------------------------------------------------------------------
-- Receipts: what each publication first answered. An assessment is published once, so it has at
-- most one receipt.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.component_assessment_requests (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  component_assessment_id uuid not null unique,
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  -- A receipt goes with its assessment, so it never keeps one from being removed.
  foreign key (tenant_id, component_assessment_id)
    references public.component_assessments(tenant_id, id) on delete cascade
);
alter table public.component_assessment_requests enable row level security;
revoke all on public.component_assessment_requests from public, anon, authenticated;
comment on table public.component_assessment_requests is 'Private receipts of publish_component_assessment: a request sent again returns what it first answered, and one sent for another component assessment conflicts. No client reads them.';

-- ---------------------------------------------------------------------------------------------
-- Authoring a component assessment.
--
-- An assessor works a draft a component at a time. record_component_determinations records one
-- determination for many controls of one component at once, all of them or none, and clears them
-- when no determination is given. Recording what is already recorded changes nothing, so the same
-- record sent again is safe. A published assessment refuses both a record and a clear.
-- ---------------------------------------------------------------------------------------------
create or replace function public.record_component_determinations(
  p_tenant_id uuid, p_assessment_id uuid, p_defined_component_id uuid, p_control_ids uuid[], p_determination text, p_rationale text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_assessment public.component_assessments;
  v_controls uuid[];
  v_rationale text := nullif(btrim(coalesce(p_rationale, '')), '');
  v_updated integer := 0; v_inserted integer := 0; v_cleared integer := 0;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can record a determination' using errcode = '42501';
  end if;
  select * into v_assessment from public.component_assessments
    where tenant_id = p_tenant_id and id = p_assessment_id for update;
  if v_assessment.id is null then
    raise exception 'This component assessment is no longer available; reload and try again' using errcode = 'PT404';
  end if;
  if v_assessment.state <> 'draft' then
    raise exception 'A published component assessment cannot change' using errcode = '23514';
  end if;
  if p_determination is not null
    and p_determination not in ('satisfied', 'partially_satisfied', 'other_than_satisfied') then
    raise exception 'A determination is satisfied, partially satisfied or other than satisfied' using errcode = '22023';
  end if;
  select coalesce(array_agg(distinct c), '{}') into v_controls
    from unnest(coalesce(p_control_ids, '{}')) c where c is not null;
  if cardinality(v_controls) not between 1 and 2000 then
    raise exception 'Choose between 1 and 2,000 controls' using errcode = '22023';
  end if;
  if p_defined_component_id is null or not exists (select 1 from public.defined_components c
    where c.tenant_id = p_tenant_id
      and c.component_definition_revision_id = v_assessment.component_definition_revision_id
      and c.id = p_defined_component_id) then
    raise exception 'This component is not part of the assessed component version' using errcode = '23514';
  end if;
  if exists (select 1 from unnest(v_controls) c where not exists (select 1 from public.selected_controls sc
    where sc.profile_resolution_id = v_assessment.profile_resolution_id and sc.control_id = c)) then
    raise exception 'A determination names a control of the assessment''s control baseline' using errcode = '23514';
  end if;
  if p_determination is null then
    delete from public.component_determinations d
      where d.tenant_id = p_tenant_id and d.component_assessment_id = p_assessment_id
        and d.defined_component_id = p_defined_component_id and d.control_id = any(v_controls);
    get diagnostics v_cleared = row_count;
  else
    update public.component_determinations d
      set determination = p_determination, rationale = v_rationale, revision = d.revision + 1
      where d.tenant_id = p_tenant_id and d.component_assessment_id = p_assessment_id
        and d.defined_component_id = p_defined_component_id and d.control_id = any(v_controls)
        and (d.determination, d.rationale) is distinct from (p_determination, v_rationale);
    get diagnostics v_updated = row_count;
    insert into public.component_determinations
        (tenant_id, component_assessment_id, component_definition_revision_id, defined_component_id, control_id, determination, rationale)
      select p_tenant_id, p_assessment_id, v_assessment.component_definition_revision_id, p_defined_component_id, c, p_determination, v_rationale
      from unnest(v_controls) c
      where not exists (select 1 from public.component_determinations d
        where d.tenant_id = p_tenant_id and d.component_assessment_id = p_assessment_id
          and d.defined_component_id = p_defined_component_id and d.control_id = c);
    get diagnostics v_inserted = row_count;
  end if;
  return jsonb_build_object('assessmentId', p_assessment_id,
    'recorded', v_updated + v_inserted, 'cleared', v_cleared,
    'unchanged', case when p_determination is null then 0 else cardinality(v_controls) - v_updated - v_inserted end);
end;
$$;
revoke all on function public.record_component_determinations(uuid, uuid, uuid, uuid[], text, text) from public, anon;
grant execute on function public.record_component_determinations(uuid, uuid, uuid, uuid[], text, text) to authenticated;
comment on function public.record_component_determinations(uuid, uuid, uuid, uuid[], text, text) is 'Records one determination and its rationale for many controls of one component of a draft component assessment: all of them or none. No determination clears what was recorded. Recording what is already recorded changes nothing.';

-- Publish a draft component assessment, at the revision the reader saw and holding the
-- determinations the reader was told, so an assessment that changed since it was read is refused
-- rather than frozen unseen. Each request is answered once: its id keeps a private receipt, so the
-- same request sent again returns its first answer and writes nothing, and the id sent for another
-- assessment is refused. A direct update of the assessment's state still publishes, as a product
-- assessment's does.
create or replace function public.publish_component_assessment(
  p_tenant_id uuid,
  p_assessment_id uuid,
  p_expected_revision bigint,
  p_expected_determinations integer,
  p_request_id uuid,
  p_completed_on date default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_receipt public.component_assessment_requests;
  v_assessment public.component_assessments;
  v_determinations integer;
  v_components integer;
  v_result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can publish a component assessment' using errcode = '42501';
  end if;
  if p_assessment_id is null or p_request_id is null or p_expected_revision is null
    or p_expected_determinations is null then
    raise exception 'Choose the component assessment to publish, at the revision you read' using errcode = '22023';
  end if;
  -- One answer per request: the same request sent again answers as it first did.
  perform pg_advisory_xact_lock(hashtextextended('component-assessment-publish/' || p_request_id::text, 0));
  select * into v_receipt from public.component_assessment_requests r where r.id = p_request_id;
  if found then
    if v_receipt.tenant_id <> p_tenant_id or v_receipt.component_assessment_id <> p_assessment_id then
      raise exception 'This request already published another component assessment. Publish this one again.' using errcode = 'PT409';
    end if;
    return v_receipt.result;
  end if;
  -- The assessment, held until the transaction ends: a determination recorded, changed or cleared
  -- in the meantime waits for the publication (guard_published_parent reads the assessment for
  -- share), and is then refused, since the assessment is published.
  select * into v_assessment from public.component_assessments
    where tenant_id = p_tenant_id and id = p_assessment_id for no key update;
  if v_assessment.id is null then
    raise exception 'This component assessment is no longer available; reload and try again' using errcode = 'PT404';
  end if;
  if v_assessment.state = 'published' then
    raise exception 'This component assessment was already published. Reload to see it.' using errcode = '23514';
  end if;
  if v_assessment.revision is distinct from p_expected_revision then
    raise exception 'This component assessment changed since you read it. Reload it before publishing.' using errcode = 'PT409';
  end if;
  select count(*), count(distinct d.defined_component_id) into v_determinations, v_components
    from public.component_determinations d
    where d.tenant_id = p_tenant_id and d.component_assessment_id = p_assessment_id;
  if v_determinations = 0 then
    raise exception 'Record a determination before publishing this component assessment' using errcode = '23514';
  end if;
  if v_determinations <> p_expected_determinations then
    raise exception 'This component assessment now holds % determinations. Reload it before publishing.', v_determinations
      using errcode = 'PT409';
  end if;
  if p_completed_on is not null and v_assessment.started_on is not null and p_completed_on < v_assessment.started_on then
    raise exception 'A component assessment is completed on or after the day it started' using errcode = '22023';
  end if;
  update public.component_assessments
    set state = 'published', published_at = now(),
      completed_on = coalesce(p_completed_on, completed_on), revision = revision + 1
    where tenant_id = p_tenant_id and id = p_assessment_id
    returning * into v_assessment;
  v_result := jsonb_build_object(
    'assessmentId', v_assessment.id,
    'componentDefinitionRevisionId', v_assessment.component_definition_revision_id,
    'determinations', v_determinations,
    'components', v_components,
    'publishedAt', v_assessment.published_at,
    'completedOn', v_assessment.completed_on);
  insert into public.component_assessment_requests (id, tenant_id, component_assessment_id, result, created_by)
    values (p_request_id, p_tenant_id, v_assessment.id, v_result, auth.uid());
  return v_result;
end;
$$;
revoke all on function public.publish_component_assessment(uuid, uuid, bigint, integer, uuid, date) from public, anon;
grant execute on function public.publish_component_assessment(uuid, uuid, bigint, integer, uuid, date) to authenticated;
comment on function public.publish_component_assessment(uuid, uuid, bigint, integer, uuid, date) is 'Publish a draft component assessment, at the revision the reader saw and holding the number of determinations the reader was told, in one transaction: its determinations then stand for every consumer of the component version and no longer change. An assessment already published, changed since it was read, holding no determination or not in the workspace is refused, as is a caller who may not write to the workspace. The request id is chosen once per publication: the same request sent again returns its first answer.';

-- ---------------------------------------------------------------------------------------------
-- Internal: the versions of one component, and where a component stands on each control.
-- ---------------------------------------------------------------------------------------------
-- A component is followed across the versions of its definition by its name.
create or replace function public.component_lineage(p_defined_component_id uuid)
returns table (
  defined_component_id uuid, component_definition_revision_id uuid, version_number integer,
  state text, behind bigint
)
language sql stable security invoker set search_path = '' as $$
  select c.id, r.id, r.version_number, r.state,
    (select count(*) from public.component_definition_revisions n
      where n.tenant_id = r.tenant_id and n.component_definition_id = r.component_definition_id
        and n.state = 'published' and n.version_number > r.version_number)
  from public.defined_components o
  join public.component_definition_revisions own
    on own.tenant_id = o.tenant_id and own.id = o.component_definition_revision_id
  join public.component_definition_revisions r
    on r.tenant_id = own.tenant_id and r.component_definition_id = own.component_definition_id
  join public.defined_components c
    on c.tenant_id = r.tenant_id and c.component_definition_revision_id = r.id and c.name = o.name
  where o.id = p_defined_component_id
$$;
revoke all on function public.component_lineage(uuid) from public, anon;
grant execute on function public.component_lineage(uuid) to authenticated;
comment on function public.component_lineage(uuid) is 'Internal: every version of one library component, the components of its name in the revisions of its definition, each with how many published versions of the definition are newer (behind). Security invoker.';

-- One line a component and control: a control the component claims through its library
-- implementations, or one a published assessment judged it on. The latest published determination
-- stands; a claimed control nobody judged is not assessed. A draft assessment decides nothing.
create or replace function public.component_standing_lines(p_defined_component_ids uuid[])
returns table (
  defined_component_id uuid, control_id uuid, status text, claimed boolean,
  component_assessment_id uuid, rationale text
)
language sql stable security invoker set search_path = '' as $$
  with claims as (
    select distinct i.defined_component_id, i.control_id
    from public.defined_component_implementations i
    where i.defined_component_id = any(coalesce(p_defined_component_ids, '{}')) and i.control_id is not null
  ),
  judged as (
    select distinct on (d.defined_component_id, d.control_id)
      d.defined_component_id, d.control_id, d.determination, d.rationale, d.component_assessment_id
    from public.component_determinations d
    join public.component_assessments a
      on a.tenant_id = d.tenant_id and a.id = d.component_assessment_id and a.state = 'published'
    where d.defined_component_id = any(coalesce(p_defined_component_ids, '{}'))
    order by d.defined_component_id, d.control_id, a.published_at desc, a.id desc
  )
  select coalesce(j.defined_component_id, c.defined_component_id), coalesce(j.control_id, c.control_id),
    coalesce(j.determination, 'not_assessed'), c.control_id is not null,
    j.component_assessment_id, j.rationale
  from claims c
  full join judged j on j.defined_component_id = c.defined_component_id and j.control_id = c.control_id
$$;
revoke all on function public.component_standing_lines(uuid[]) from public, anon;
grant execute on function public.component_standing_lines(uuid[]) to authenticated;
comment on function public.component_standing_lines(uuid[]) is 'Internal: where each component named stands on each control it claims or was judged on: the latest published determination on that component version (satisfied, partially_satisfied, other_than_satisfied), or not_assessed for a claimed control nobody judged, with the assessment that decided it. Security invoker. component_control_status and system_upstream count from it.';

-- ---------------------------------------------------------------------------------------------
-- One component assessment as its author works it.
-- ---------------------------------------------------------------------------------------------
create or replace function public.component_assessment_sheet(p_assessment_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_assessment public.component_assessments;
  v_revision public.component_definition_revisions;
  v_definition public.component_definitions;
  answer jsonb;
begin
  if auth.uid() is null then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  select * into v_assessment from public.component_assessments where id = p_assessment_id;
  -- An assessment that is gone, or that the reader cannot see, is none: the page says not found.
  if v_assessment.id is null then
    return null;
  end if;
  select * into v_revision from public.component_definition_revisions
    where tenant_id = v_assessment.tenant_id and id = v_assessment.component_definition_revision_id;
  select * into v_definition from public.component_definitions
    where tenant_id = v_assessment.tenant_id and id = v_revision.component_definition_id;
  with
  selected as materialized (
    select sc.control_id from public.selected_controls sc
    where sc.profile_resolution_id = v_assessment.profile_resolution_id
  ),
  components as materialized (
    select c.id, c.name, c.component_type
    from public.defined_components c
    where c.tenant_id = v_assessment.tenant_id
      and c.component_definition_revision_id = v_assessment.component_definition_revision_id
  ),
  claims as materialized (
    select distinct c.id as component_id, i.control_id
    from components c
    join public.defined_component_implementations i
      on i.tenant_id = v_assessment.tenant_id and i.defined_component_id = c.id
    where i.control_id in (select s.control_id from selected s)
  ),
  dets as materialized (
    select d.defined_component_id, d.control_id, d.determination, d.rationale
    from public.component_determinations d
    where d.tenant_id = v_assessment.tenant_id and d.component_assessment_id = v_assessment.id
  )
  select jsonb_build_object(
    'assessment', jsonb_build_object(
      'id', v_assessment.id, 'title', v_assessment.title, 'description', v_assessment.description,
      'state', v_assessment.state, 'revision', v_assessment.revision,
      'component_definition_revision_id', v_assessment.component_definition_revision_id,
      'profile_resolution_id', v_assessment.profile_resolution_id,
      'assessor_party_id', v_assessment.assessor_party_id,
      'started_on', v_assessment.started_on, 'completed_on', v_assessment.completed_on,
      'published_at', v_assessment.published_at),
    'definition', jsonb_build_object(
      'id', v_definition.id, 'code', v_definition.code, 'name', v_definition.name,
      'version', v_revision.version_number,
      'owner_party_id', v_definition.owner_party_id, 'business_line_id', v_definition.business_line_id),
    'components', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'component_type', c.component_type,
        'claimed', (select count(*) from claims x where x.component_id = c.id),
        'determined', (select count(*) from dets d where d.defined_component_id = c.id)
      ) order by c.name, c.id), '[]'::jsonb) from components c),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', k.id, 'code', k.code, 'title', k.title, 'parent_id', k.parent_control_id,
        'family', upper(g.source_id), 'family_title', g.title
      ) order by upper(g.source_id) nulls last, public.natural_sort_key(k.code) collate "C", k.id), '[]'::jsonb)
      from selected s
      join public.controls k on k.id = s.control_id
      left join public.catalog_groups g on g.id = k.group_id),
    'claims', (select coalesce(jsonb_agg(jsonb_build_array(c.component_id, c.control_id)), '[]'::jsonb) from claims c),
    'determinations', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'component_id', d.defined_component_id, 'control_id', d.control_id,
        'determination', d.determination, 'rationale', d.rationale)), '[]'::jsonb) from dets d)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.component_assessment_sheet(uuid) from public, anon;
grant execute on function public.component_assessment_sheet(uuid) to authenticated;
comment on function public.component_assessment_sheet(uuid) is 'One component assessment as its author works it: the component definition and version it judges, the controls of its control baseline, the components of the assessed version with how many controls each claims and has determined, every claim and every determination recorded. Read as the caller; an assessment the caller cannot read answers null.';

-- ---------------------------------------------------------------------------------------------
-- Where a component version stands on each control.
-- ---------------------------------------------------------------------------------------------
create or replace function public.component_control_status(p_defined_component_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_component public.defined_components;
  v_revision public.component_definition_revisions;
  v_definition public.component_definitions;
begin
  select * into v_component from public.defined_components where id = p_defined_component_id;
  if auth.uid() is null or v_component.id is null then
    raise exception 'Component access is required' using errcode = '42501';
  end if;
  select * into v_revision from public.component_definition_revisions
    where tenant_id = v_component.tenant_id and id = v_component.component_definition_revision_id;
  select * into v_definition from public.component_definitions
    where tenant_id = v_component.tenant_id and id = v_revision.component_definition_id;
  with
  line as materialized (
    select l.control_id, l.status, l.claimed, l.component_assessment_id, l.rationale,
      k.code, k.title, k.parent_control_id,
      public.natural_sort_key(k.code) collate "C" as code_order,
      upper(g.source_id) as family, g.title as family_title
    from public.component_standing_lines(array[p_defined_component_id]) l
    join public.controls k on k.id = l.control_id
    left join public.catalog_groups g on g.id = k.group_id
  ),
  deciding as (
    select a.id, a.title, a.published_at, a.completed_on, a.assessor_party_id, a.profile_resolution_id,
      count(*) as determinations
    from line l
    join public.component_assessments a on a.id = l.component_assessment_id
    group by a.id, a.title, a.published_at, a.completed_on, a.assessor_party_id, a.profile_resolution_id
  )
  select jsonb_build_object(
    'defined_component_id', p_defined_component_id,
    'component', jsonb_build_object(
      'id', v_component.id, 'name', v_component.name, 'component_type', v_component.component_type,
      'definition_id', v_definition.id, 'definition_code', v_definition.code, 'definition_name', v_definition.name,
      'revision_id', v_revision.id, 'version', v_revision.version_number, 'state', v_revision.state,
      'owner_party_id', v_definition.owner_party_id, 'business_line_id', v_definition.business_line_id),
    -- The published assessments a determination that stands was taken from, the newest first.
    'assessments', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', d.id, 'title', d.title, 'published_at', d.published_at, 'completed_on', d.completed_on,
        'assessor_party_id', d.assessor_party_id, 'profile_resolution_id', d.profile_resolution_id,
        'determinations', d.determinations
      ) order by d.published_at desc, d.id desc), '[]'::jsonb) from deciding d),
    'totals', jsonb_build_object(
      'controls', (select count(*) from line),
      'satisfied', (select count(*) from line where status = 'satisfied'),
      'partially_satisfied', (select count(*) from line where status = 'partially_satisfied'),
      'other_than_satisfied', (select count(*) from line where status = 'other_than_satisfied'),
      'not_assessed', (select count(*) from line where status = 'not_assessed')),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.control_id, 'code', l.code, 'title', l.title, 'parent_id', l.parent_control_id,
        'family', l.family, 'family_title', l.family_title,
        'status', l.status, 'claimed', l.claimed,
        'assessment_id', l.component_assessment_id, 'rationale', l.rationale
      ) order by l.family nulls last, l.code_order, l.control_id), '[]'::jsonb)
      from line l)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.component_control_status(uuid) from public, anon;
grant execute on function public.component_control_status(uuid) to authenticated;
comment on function public.component_control_status(uuid) is 'Where one component version stands on each control it claims through its library implementations or was judged on: the latest published determination on that component version (satisfied, partially_satisfied, other_than_satisfied), or not_assessed for a claimed control nobody judged, with the totals and the published assessments those determinations were taken from. A draft assessment decides nothing. Security invoker: a component the reader cannot read is refused.';

-- ---------------------------------------------------------------------------------------------
-- Where a component is used.
--
-- The answer follows the component through every version of its definition, so a consumer built
-- from an older version is listed too, with the version it took and how many published versions
-- it is behind. A product uses a component where an element of one of its versions is pinned to
-- it; each such element is listed with its version's state, whether that is the product's current
-- version (its latest published one, else its latest) and the configurations that include it. A
-- system uses it where one of its components is built from it; each is listed with its program,
-- the element it sits on (the one the component names, else the one a single inventory
-- relationship gives it, else its system), its pin in the system's latest configuration baseline (the latest
-- published, else the latest) and, where the element was inherited from a product, whether the
-- program declared it modified. A product variant whose configuration includes such an element
-- and that holds no element for it removed it, and is listed as removed.
--
-- The totals count a product by its current version, so a version nobody can change any more is
-- not counted as behind for ever: behind is the current product elements and the system
-- components built from an older version than the latest published one.
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
  )
  select jsonb_build_object(
    'defined_component_id', p_defined_component_id,
    'component', jsonb_build_object(
      'id', v_component.id, 'name', v_component.name, 'component_type', v_component.component_type,
      'definition_id', v_definition.id, 'definition_code', v_definition.code, 'definition_name', v_definition.name,
      'revision_id', v_revision.id, 'version', v_revision.version_number, 'state', v_revision.state,
      'owner_party_id', v_definition.owner_party_id, 'business_line_id', v_definition.business_line_id),
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
        'defined_component_id', r.defined_component_id, 'version', r.version, 'behind', r.behind
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
          'change_rationale', r.change_rationale) as line
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
          'change', 'removed', 'change_kinds', '[]'::jsonb, 'change_rationale', null)
        from removed_rows r
      ) x),
    'totals', jsonb_build_object(
      'products', (select count(distinct r.product_id) from product_rows r where r.is_current),
      'product_elements', (select count(*) from product_rows),
      'programs', (select count(distinct r.program_id) from system_rows r),
      'systems', (select count(distinct r.system_id) from system_rows r),
      'system_components', (select count(*) from system_rows),
      'behind', (select count(*) from product_rows r where r.is_current and r.behind > 0)
        + (select count(*) from system_rows r where r.behind > 0),
      'modified', (select count(*) from system_rows r where r.change = 'modified'),
      'removed', (select count(*) from removed_rows))
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.component_consumers(uuid) from public, anon;
grant execute on function public.component_consumers(uuid) to authenticated;
comment on function public.component_consumers(uuid) is 'Where a library component is used, followed by its name through every version of its definition: each product element pinned to it (its product and version, whether that is the product''s current version, the configurations that include it) and each system component built from it (its program, system and element, its pin in the system''s latest configuration baseline, whether the program declared the inherited element modified), each with the version taken and how many published versions of the definition are newer (behind); a variant that left the element out is listed as removed. Totals count a product by its current version. Security invoker: a component the reader cannot read is refused.';

-- ---------------------------------------------------------------------------------------------
-- What a system takes from above.
--
-- For an authorization boundary, every library component of the boundary; for an element inside
-- one, the components on that element and on the elements inside it. A system created from a
-- product names the product, the version it was created from and the newest published one. Each
-- library component says the version taken, the latest published version of its definition, how
-- many published versions it is behind, whether the program declared its inherited element
-- modified, and the component's standing as component_control_status counts it.
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
      d.owner_party_id, d.business_line_id,
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
        'owner_party_id', u.owner_party_id, 'business_line_id', u.business_line_id,
        'revision_id', u.revision_id, 'version', u.version,
        'latest_revision_id', u.latest_revision_id, 'latest_version', u.latest_version,
        'behind', u.behind, 'pin', u.pin,
        'standing', jsonb_build_object(
          'controls', coalesce(s.controls, 0), 'satisfied', coalesce(s.satisfied, 0),
          'partially_satisfied', coalesce(s.partially_satisfied, 0),
          'other_than_satisfied', coalesce(s.other_than_satisfied, 0),
          'not_assessed', coalesce(s.not_assessed, 0))
      ) order by public.natural_sort_key(u.element_code) collate "C", public.natural_sort_key(u.code) collate "C", u.system_component_id), '[]'::jsonb)
      from used u left join standing s on s.defined_component_id = u.defined_component_id),
    'totals', jsonb_build_object(
      'components', (select count(*) from used),
      'behind', (select count(*) from used u where u.behind > 0),
      'modified', (select count(*) from used u where u.change = 'modified'),
      'assessed', (select count(*) from used u join standing s on s.defined_component_id = u.defined_component_id
        where s.controls > s.not_assessed))
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.system_upstream(uuid) from public, anon;
grant execute on function public.system_upstream(uuid) to authenticated;
comment on function public.system_upstream(uuid) is 'What a system takes from above: for a system created from a product, the product, the version and configuration it was created from and the newest published version; and each library component the system (an authorization boundary whole, or one element and what is inside it) is built from, with the version taken, the latest published version of its definition, how many published versions it is behind, whether the program declared the inherited element modified, its pin in the latest configuration baseline, and the component''s standing as component_control_status counts it. Security invoker: a system the reader cannot read is refused.';

-- ---------------------------------------------------------------------------------------------
-- The components register: one row a component of each definition's latest published version,
-- else of its latest version.
--
-- A component is counted through every version of its definition, by its name: the products whose
-- current version (latest published, else latest) pins an element to it, the programs that hold a
-- system component built from it, how many of those consumers took an older version than the
-- latest published one (consumers_behind) and how many sit on an inherited element the program
-- declared modified (consumers_modified). Its standing is this version's: the latest published
-- determination on each control, and the newest assessment one of them was taken from.
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
)
select c.id, c.tenant_id, c.name, c.component_type, c.description, c.supplier_party_id,
  d.id as component_definition_id, d.code as definition_code, d.name as definition_name, d.category,
  h.id as component_definition_revision_id, h.version_number as version, h.state, h.published_at,
  d.owner_party_id, owner.name as owner_name,
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
  c.revision, c.created_at, c.updated_at, c.created_by, c.updated_by
from head h
join public.component_definitions d on d.tenant_id = h.tenant_id and d.id = h.component_definition_id
join public.defined_components c on c.tenant_id = h.tenant_id and c.component_definition_revision_id = h.id
left join public.parties owner on owner.id = d.owner_party_id
left join public.business_lines line on line.id = d.business_line_id
left join product_use pu on pu.head_id = c.id
left join system_use su on su.head_id = c.id
left join standing st on st.defined_component_id = c.id
left join public.component_assessments a on a.id = st.assessment_id
left join claimed cl on cl.defined_component_id = c.id;
grant select on public.component_rows to authenticated;
revoke all on public.component_rows from public, anon;
comment on view public.component_rows is 'The components register, one row a component of each component definition''s latest published version (else its latest): its definition by code and name, its type, version and state, its owner and business line by name, how many products (by their current version) and programs use it in any version, how many of those consumers took an older version than the latest published one (consumers_behind) or sit on an inherited element the program declared modified (consumers_modified), and this version''s standing: the controls it claims, how many carry a published determination and how many of those are satisfied, with the newest published assessment one was taken from.';
