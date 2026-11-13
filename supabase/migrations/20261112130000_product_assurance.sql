-- Product assurance: a business line over its products, a product assessed once, and what a
-- program's variant changes.
--
-- A product (migration 20260916000000_products) is one element tree with configurations that pick
-- which elements are in. Until now nothing judged it: a library component's claims said what an
-- element was meant to do for a control, and an assessor's determination existed only inside a
-- program. This migration adds three things.
--
--   business_lines            the level above products (Air Defense holds the X800 Missile), which
--                             a program may also belong to
--   product_assessments       one assessment of a published product version against a control
--   product_determinations    baseline, with a determination for each element and control, or for
--                             the product as a whole
--   systems.product_change_*  what a program changed in an element it inherited from a product:
--                             software, firmware, hardware or data, and why
--
-- A determination is recorded where the product varies, on the element, so one assessment answers
-- for every configuration: a configuration's standing on a control is the worst determination on
-- the elements it includes. A variant inherits that standing while it leaves those elements as
-- they are. Marking an element as modified, or removing it, is what makes a control owe a new
-- assessment in the program.
--
-- Two reads answer the two questions, each in one request and as the caller, so row-level security
-- decides every row:
--
--   product_control_status    what a product version gives for each control: its core (the elements
--                             every configuration includes) and each configuration
--   variant_control_delta     for a system created from a configuration, each control of its
--                             control baseline as inherited, shared, changed_here or program_only
--
-- Every statement here can run again: this migration is also applied by hand.

-- ---------------------------------------------------------------------------------------------
-- Business lines.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.business_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  code text not null check (length(btrim(code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  description text,
  owner_party_id uuid,
  state text not null default 'active' check (state in ('active', 'retired')),
  unique (tenant_id, id),
  unique (tenant_id, code),
  foreign key (tenant_id, owner_party_id) references public.parties(tenant_id, id)
);
do $$
begin
  if not exists (select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'business_lines' and policyname = 'tenant_read') then
    perform public.apply_tenant_security('business_lines');
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.business_lines'::regclass and tgname = 'record_lifecycle' and not tgisinternal) then
    perform public.attach_record_lifecycle('business_lines', false);
  end if;
end $$;
comment on table public.business_lines is 'A line of business that owns products and runs programs (Air Defense). The level above a product.';
comment on column public.business_lines.code is 'Stable identifier, unique in the workspace.';
comment on column public.business_lines.owner_party_id is 'The person or organization accountable for the business line.';
comment on column public.business_lines.state is 'A retired business line keeps its products and programs and takes no new ones.';

alter table public.products add column if not exists business_line_id uuid;
alter table public.programs add column if not exists business_line_id uuid;
do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'products_business_line') then
    alter table public.products add constraint products_business_line
      foreign key (tenant_id, business_line_id) references public.business_lines(tenant_id, id);
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'programs_business_line') then
    alter table public.programs add constraint programs_business_line
      foreign key (tenant_id, business_line_id) references public.business_lines(tenant_id, id);
  end if;
end $$;
create index if not exists products_business_line_idx on public.products(tenant_id, business_line_id);
create index if not exists programs_business_line_idx on public.programs(tenant_id, business_line_id);
comment on column public.products.business_line_id is 'The business line the product belongs to; NULL for a product not yet placed in one.';
comment on column public.programs.business_line_id is 'The business line that runs the program; NULL when none is recorded.';

-- ---------------------------------------------------------------------------------------------
-- A product assessed: one assessment of a published version against a control baseline.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.product_assessments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  product_revision_id uuid not null,
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
  unique (tenant_id, id, product_revision_id),
  foreign key (tenant_id, product_revision_id) references public.product_revisions(tenant_id, id),
  foreign key (tenant_id, assessor_party_id) references public.parties(tenant_id, id)
);
create table if not exists public.product_determinations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  product_assessment_id uuid not null,
  product_revision_id uuid not null,
  product_element_id uuid,
  control_id uuid not null references public.controls(id),
  determination text not null check (determination in ('satisfied', 'partially_satisfied', 'other_than_satisfied')),
  rationale text,
  assessment_finding_id uuid,
  unique (tenant_id, id),
  foreign key (tenant_id, product_assessment_id, product_revision_id)
    references public.product_assessments(tenant_id, id, product_revision_id),
  foreign key (tenant_id, product_revision_id, product_element_id)
    references public.product_elements(tenant_id, product_revision_id, id),
  foreign key (tenant_id, assessment_finding_id) references public.assessment_findings(tenant_id, id),
  unique nulls not distinct (tenant_id, product_assessment_id, product_element_id, control_id)
);
create index if not exists product_assessments_revision_idx on public.product_assessments(tenant_id, product_revision_id);
create index if not exists product_determinations_assessment_idx on public.product_determinations(tenant_id, product_assessment_id);
create index if not exists product_determinations_control_idx on public.product_determinations(control_id);

-- What the foreign keys cannot say: an assessment judges a version that no longer changes, against
-- a published control baseline; a determination names a control of that baseline.
create or replace function public.guard_product_assessment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_state text;
begin
  select state into v_state from public.product_revisions where tenant_id = new.tenant_id and id = new.product_revision_id;
  if v_state is distinct from 'published' then
    raise exception 'Assess a published product version' using errcode = '23514';
  end if;
  select state into v_state from public.profile_resolutions where id = new.profile_resolution_id;
  if v_state is distinct from 'published' then
    raise exception 'Assess a product against a published control baseline' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_product_assessment() from public, anon, authenticated;

create or replace function public.guard_product_determination() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_resolution uuid;
begin
  select profile_resolution_id into v_resolution from public.product_assessments
    where tenant_id = new.tenant_id and id = new.product_assessment_id;
  if not exists (select 1 from public.selected_controls sc
    where sc.profile_resolution_id = v_resolution and sc.control_id = new.control_id) then
    raise exception 'A determination names a control of the assessment''s control baseline' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_product_determination() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'product_assessments' and policyname = 'tenant_read') then
    perform public.apply_tenant_security('product_assessments');
    perform public.apply_tenant_security('product_determinations');
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.product_assessments'::regclass and tgname = 'record_lifecycle' and not tgisinternal) then
    perform public.attach_record_lifecycle('product_assessments', true);
    perform public.attach_record_lifecycle('product_determinations', false);
    perform public.attach_parent_immutability('product_determinations', 'product_assessments', 'product_assessment_id');
    perform public.attach_reference_tenant_guard('product_assessments', 'profile_resolution_id', 'profile_resolutions');
    perform public.attach_reference_tenant_guard('product_determinations', 'control_id', 'controls');
  end if;
end $$;
create or replace trigger stable_context before update on public.product_assessments
  for each row execute function public.guard_stable_assurance_context('product_revision_id', 'profile_resolution_id');
create or replace trigger stable_context before update on public.product_determinations
  for each row execute function public.guard_stable_assurance_context('product_assessment_id', 'product_element_id', 'control_id');
create or replace trigger a_product_assessment before insert on public.product_assessments
  for each row execute function public.guard_product_assessment();
create or replace trigger a_product_determination before insert on public.product_determinations
  for each row execute function public.guard_product_determination();

comment on table public.product_assessments is 'One assessment of a published product version against a control baseline. Its determinations are recorded for each element and control, so one assessment answers for every configuration. A published assessment is immutable; the latest published one is what a product gives.';
comment on column public.product_assessments.profile_resolution_id is 'The control baseline the product was assessed against.';
comment on column public.product_assessments.assessor_party_id is 'The person or organization that made the determinations.';
comment on table public.product_determinations is 'An assessor''s determination on one control for one element of a product version, or for the product as a whole. A configuration''s standing on a control is the worst determination on the elements it includes.';
comment on column public.product_determinations.product_element_id is 'The element judged; NULL for a determination on the product as a whole, which stands in every configuration.';
comment on column public.product_determinations.assessment_finding_id is 'The assessment finding of a program''s campaign this determination was drawn from, when the work was done there.';

-- ---------------------------------------------------------------------------------------------
-- What a program changed in an element it inherited from a product.
-- ---------------------------------------------------------------------------------------------
alter table public.systems
  add column if not exists product_change_kinds text[],
  add column if not exists product_change_rationale text,
  add column if not exists product_changed_at timestamptz,
  add column if not exists product_changed_by uuid references auth.users(id) on delete set null;
do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'systems_product_change') then
    alter table public.systems add constraint systems_product_change check (
      (product_change_kinds is null and product_change_rationale is null and product_changed_at is null)
      or (product_element_id is not null
        and cardinality(product_change_kinds) > 0
        and product_change_kinds <@ array['software', 'firmware', 'hardware', 'data']
        and length(btrim(product_change_rationale)) > 0
        and product_changed_at is not null));
  end if;
end $$;
comment on column public.systems.product_change_kinds is 'What the program changed in this inherited product element: software, firmware, hardware or data. NULL while the element is as the product delivers it. Written only by declare_product_element_change.';
comment on column public.systems.product_change_rationale is 'Why the program changed the element.';
comment on column public.systems.product_changed_at is 'When the change was declared.';
comment on column public.systems.product_changed_by is 'Who declared the change.';

-- A generic record edit cannot declare or withdraw a change; the command does.
create or replace function public.guard_product_element_change() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and (
    tg_op = 'INSERT' and (new.product_change_kinds is not null or new.product_change_rationale is not null or new.product_changed_at is not null)
    or tg_op = 'UPDATE' and (new.product_change_kinds is distinct from old.product_change_kinds
      or new.product_change_rationale is distinct from old.product_change_rationale
      or new.product_changed_at is distinct from old.product_changed_at
      or new.product_changed_by is distinct from old.product_changed_by)) then
    raise exception 'Use Mark as modified to record what a program changed in a product element' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_product_element_change() from public, anon, authenticated;
create or replace trigger a_product_element_change before insert or update on public.systems
  for each row execute function public.guard_product_element_change();

-- Declare, change or withdraw what a program changed in an inherited element. An empty list of
-- kinds withdraws the declaration. The element is saved at the revision the reader saw; the same
-- declaration sent again changes nothing.
create or replace function public.declare_product_element_change(
  p_tenant_id uuid, p_system_id uuid, p_expected_revision bigint, p_kinds text[], p_rationale text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.systems;
  v_kinds text[];
  v_rationale text := nullif(btrim(coalesce(p_rationale, '')), '');
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can record a change to a product element' using errcode = '42501';
  end if;
  select coalesce(array_agg(distinct k order by k), '{}') into v_kinds
    from unnest(coalesce(p_kinds, '{}')) k where k is not null;
  if not v_kinds <@ array['software', 'firmware', 'hardware', 'data'] then
    raise exception 'A change is to software, firmware, hardware or data' using errcode = '22023';
  end if;
  select * into v_row from public.systems where tenant_id = p_tenant_id and id = p_system_id for update;
  if v_row.id is null then
    raise exception 'This element is no longer available; reload and try again' using errcode = 'P0002';
  end if;
  if v_row.product_element_id is null then
    raise exception 'Only an element inherited from a product can be marked as modified' using errcode = '23514';
  end if;
  if cardinality(v_kinds) > 0 and v_rationale is null then
    raise exception 'Say why the program changed this element' using errcode = '22023';
  end if;
  if cardinality(v_kinds) = 0 then v_kinds := null; v_rationale := null; end if;
  if v_row.product_change_kinds is not distinct from v_kinds and v_row.product_change_rationale is not distinct from v_rationale then
    return jsonb_build_object('systemId', v_row.id, 'revision', v_row.revision, 'kinds', coalesce(to_jsonb(v_kinds), '[]'::jsonb), 'changed', false);
  end if;
  if v_row.revision is distinct from p_expected_revision then
    raise exception 'Record revision conflict; reload before saving' using errcode = 'PT409';
  end if;
  update public.systems set
    product_change_kinds = v_kinds,
    product_change_rationale = v_rationale,
    product_changed_at = case when v_kinds is null then null else now() end,
    product_changed_by = case when v_kinds is null then null else auth.uid() end,
    revision = revision + 1
  where tenant_id = p_tenant_id and id = p_system_id
  returning * into v_row;
  return jsonb_build_object('systemId', v_row.id, 'revision', v_row.revision, 'kinds', coalesce(to_jsonb(v_kinds), '[]'::jsonb), 'changed', true);
end;
$$;
revoke all on function public.declare_product_element_change(uuid, uuid, bigint, text[], text) from public, anon;
grant execute on function public.declare_product_element_change(uuid, uuid, bigint, text[], text) to authenticated;
comment on function public.declare_product_element_change(uuid, uuid, bigint, text[], text) is 'Records what a program changed in an element it inherited from a product (software, firmware, hardware, data) and why, at the revision the reader saw. An empty list withdraws the declaration; the same declaration sent again changes nothing.';

-- ---------------------------------------------------------------------------------------------
-- What a product version gives for each control, for its core and for each configuration.
--
-- The assessment read is the latest published one of the version; its control baseline is the list
-- of controls. A version with no published assessment answers the controls its elements claim
-- through the library components they are pinned to, none of them assessed.
--
-- A scope is the core (the elements every active configuration includes) or one configuration. A
-- control's status in a scope is the worst determination on the scope's elements, with a
-- determination on the product as a whole standing in every scope:
--
--   other_than_satisfied, partially_satisfied, satisfied    the worst determination
--   not_assessed    an element of the scope claims the control and no determination is recorded
--   not_covered     nothing of the scope claims it: a program that takes the configuration owes it
-- ---------------------------------------------------------------------------------------------
create or replace function public.product_control_status(p_tenant_id uuid, p_product_revision_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_revision public.product_revisions;
  v_assessment public.product_assessments;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  select * into v_revision from public.product_revisions
    where tenant_id = p_tenant_id and id = p_product_revision_id;
  if v_revision.id is null then
    raise exception 'Product version access is required' using errcode = '42501';
  end if;
  select * into v_assessment from public.product_assessments a
    where a.tenant_id = p_tenant_id and a.product_revision_id = p_product_revision_id and a.state = 'published'
    order by a.published_at desc, a.id desc limit 1;
  with
  configs as materialized (
    select c.id, c.code, c.name
    from public.product_configurations c
    where c.tenant_id = p_tenant_id and c.product_id = v_revision.product_id and c.state = 'active'
  ),
  members as materialized (
    select m.product_configuration_id, m.product_element_id
    from public.product_configuration_elements m
    where m.tenant_id = p_tenant_id and m.product_revision_id = p_product_revision_id
      and m.product_configuration_id in (select id from configs)
  ),
  elements as materialized (
    select e.id, e.defined_component_id
    from public.product_elements e
    where e.tenant_id = p_tenant_id and e.product_revision_id = p_product_revision_id
  ),
  -- One row a scope and element. The core is what every active configuration includes.
  scope_elements as materialized (
    select 'core'::text as scope, m.product_element_id as element_id
    from members m
    group by m.product_element_id
    having count(*) = (select count(*) from configs)
    union all
    select m.product_configuration_id::text, m.product_element_id from members m
  ),
  scopes as materialized (
    select 'core'::text as scope union all select c.id::text from configs c
  ),
  claims as materialized (
    select distinct e.id as element_id, i.control_id
    from elements e
    join public.defined_component_implementations i
      on i.tenant_id = p_tenant_id and i.defined_component_id = e.defined_component_id
    where i.control_id is not null
  ),
  dets as materialized (
    select d.control_id, d.product_element_id, d.determination
    from public.product_determinations d
    where d.tenant_id = p_tenant_id and d.product_assessment_id = v_assessment.id
  ),
  selected as materialized (
    select sc.control_id from public.selected_controls sc
    where v_assessment.id is not null and sc.profile_resolution_id = v_assessment.profile_resolution_id
    union
    select c.control_id from claims c where v_assessment.id is null
  ),
  det_scope as (
    select d.control_id, se.scope, d.determination
    from dets d join scope_elements se on se.element_id = d.product_element_id
    union all
    select d.control_id, s.scope, d.determination
    from dets d cross join scopes s where d.product_element_id is null
  ),
  judged as (
    select ds.control_id, ds.scope,
      bool_or(ds.determination = 'other_than_satisfied') as other_than,
      bool_or(ds.determination = 'partially_satisfied') as partially
    from det_scope ds group by ds.control_id, ds.scope
  ),
  claimed as (
    select distinct c.control_id, se.scope
    from claims c join scope_elements se on se.element_id = c.element_id
  ),
  cell as materialized (
    select s.control_id, sc.scope,
      case
        when j.other_than then 'other_than_satisfied'
        when j.partially then 'partially_satisfied'
        when j.control_id is not null then 'satisfied'
        when c.control_id is not null then 'not_assessed'
        else 'not_covered'
      end as status
    from selected s
    cross join scopes sc
    left join judged j on j.control_id = s.control_id and j.scope = sc.scope
    left join claimed c on c.control_id = s.control_id and c.scope = sc.scope
  ),
  line as (
    select k.id, k.code, k.title, k.parent_control_id,
      public.natural_sort_key(k.code) collate "C" as code_order,
      upper(g.source_id) as family, g.title as family_title,
      (select x.status from cell x where x.control_id = k.id and x.scope = 'core') as core,
      (select coalesce(jsonb_object_agg(x.scope, x.status), '{}'::jsonb) from cell x
        where x.control_id = k.id and x.scope <> 'core') as by_configuration,
      (select count(distinct x.status) from cell x where x.control_id = k.id and x.scope <> 'core') as distinct_statuses,
      (select bool_and(x.status = 'satisfied') from cell x where x.control_id = k.id and x.scope <> 'core') as satisfied_everywhere
    from selected s
    join public.controls k on k.id = s.control_id
    left join public.catalog_groups g on g.id = k.group_id
  )
  select jsonb_build_object(
    'product_revision_id', p_product_revision_id,
    'assessment', case when v_assessment.id is null then null else jsonb_build_object(
      'id', v_assessment.id, 'title', v_assessment.title, 'published_at', v_assessment.published_at,
      'completed_on', v_assessment.completed_on, 'assessor_party_id', v_assessment.assessor_party_id,
      'profile_resolution_id', v_assessment.profile_resolution_id) end,
    'configurations', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'code', c.code, 'name', c.name,
        'elements', (select count(*) from members m where m.product_configuration_id = c.id)
      ) order by c.code, c.id), '[]'::jsonb) from configs c),
    'core_elements', (select count(*) from scope_elements se where se.scope = 'core'),
    'totals', jsonb_build_object(
      'controls', (select count(*) from line),
      'satisfied_everywhere', (select count(*) from line l where l.satisfied_everywhere),
      'differs', (select count(*) from line l where l.distinct_statuses > 1),
      'scopes', (
        select coalesce(jsonb_object_agg(t.scope, t.counts), '{}'::jsonb)
        from (
          select sc.scope, jsonb_build_object(
            'satisfied', count(*) filter (where x.status = 'satisfied'),
            'partially_satisfied', count(*) filter (where x.status = 'partially_satisfied'),
            'other_than_satisfied', count(*) filter (where x.status = 'other_than_satisfied'),
            'not_assessed', count(*) filter (where x.status = 'not_assessed'),
            'not_covered', count(*) filter (where x.status = 'not_covered')) as counts
          from scopes sc left join cell x on x.scope = sc.scope
          group by sc.scope
        ) t)
    ),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id, 'code', l.code, 'title', l.title, 'parent_id', l.parent_control_id,
        'family', l.family, 'family_title', l.family_title,
        'core', l.core, 'configurations', l.by_configuration,
        'differs', l.distinct_statuses > 1
      ) order by l.family nulls last, l.code_order, l.id), '[]'::jsonb)
      from line l)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.product_control_status(uuid, uuid) from public, anon;
grant execute on function public.product_control_status(uuid, uuid) to authenticated;
comment on function public.product_control_status(uuid, uuid) is 'What a product version gives for each control of the baseline it was last assessed against: the status of its core (the elements every active configuration includes) and of each configuration, as the worst determination on the elements in it. not_assessed where an element claims the control with no determination; not_covered where nothing claims it.';

-- ---------------------------------------------------------------------------------------------
-- A variant's delta: for a system created from a product configuration, where each control of its
-- control baseline stands against the product.
--
-- What the product gives for a control is its basis: the configuration's elements that claim the
-- control through their library component or carry a determination on it, and a determination on
-- the product as a whole. Each of those elements is, in the variant, inherited (as the product
-- delivers it), modified (declare_product_element_change) or removed (not created in the variant).
--
--   program_only    the product gives nothing for the control in this variant: nothing of the
--                   configuration claims it, or every element that did was removed
--   changed_here    an element behind it is modified or removed: the control owes a new assessment
--   shared          the product covers part and leaves the rest to its consumer (a claim's coverage
--                   is partial or conditional, or it names a consumer responsibility)
--   inherited       the product's standing holds as it is
--
-- product_status is the worst determination that still stands on what the variant kept, or
-- not_assessed where the product claims the control and nobody judged it. The change says whether
-- the program must assess; the product's status says what it inherits.
-- ---------------------------------------------------------------------------------------------
create or replace function public.variant_control_delta(p_tenant_id uuid, p_system_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_system public.systems;
  v_revision public.product_revisions;
  v_product public.products;
  v_configuration public.product_configurations;
  v_assessment public.product_assessments;
  v_latest public.product_revisions;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  select * into v_system from public.systems where tenant_id = p_tenant_id and id = p_system_id;
  if v_system.id is null then
    raise exception 'System access is required' using errcode = '42501';
  end if;
  -- A system that was not created from a product has no delta, which is not an empty one.
  if v_system.product_configuration_id is null then
    return jsonb_build_object('system_id', p_system_id, 'product', null);
  end if;
  select * into v_revision from public.product_revisions where tenant_id = p_tenant_id and id = v_system.product_revision_id;
  select * into v_product from public.products where tenant_id = p_tenant_id and id = v_revision.product_id;
  select * into v_configuration from public.product_configurations where tenant_id = p_tenant_id and id = v_system.product_configuration_id;
  select * into v_assessment from public.product_assessments a
    where a.tenant_id = p_tenant_id and a.product_revision_id = v_revision.id and a.state = 'published'
    order by a.published_at desc, a.id desc limit 1;
  select * into v_latest from public.product_revisions r
    where r.tenant_id = p_tenant_id and r.product_id = v_revision.product_id and r.state = 'published'
      and r.version_number > v_revision.version_number
    order by r.version_number desc limit 1;
  with
  inst as materialized (
    select s.id, s.code, s.name, s.product_element_id, s.product_change_kinds
    from public.systems s
    where s.tenant_id = p_tenant_id and s.boundary_system_id = v_system.id and not s.is_authorization_boundary
  ),
  -- One row an element of the configuration: what became of it in the variant.
  elem as materialized (
    select m.product_element_id, pe.code, pe.name, pe.defined_component_id, i.id as system_id,
      i.product_change_kinds as kinds,
      case when i.id is null then 'removed' when i.product_change_kinds is not null then 'modified' else 'inherited' end as change
    from public.product_configuration_elements m
    join public.product_elements pe on pe.tenant_id = m.tenant_id and pe.id = m.product_element_id
    left join inst i on i.product_element_id = m.product_element_id
    where m.tenant_id = p_tenant_id and m.product_revision_id = v_revision.id
      and m.product_configuration_id = v_configuration.id
  ),
  selected as materialized (
    select sc.control_id from public.selected_controls sc
    where sc.profile_resolution_id = v_system.adopted_profile_resolution_id
  ),
  claims as materialized (
    select e.product_element_id, i.control_id,
      bool_or(i.coverage <> 'full' or nullif(btrim(coalesce(i.consumer_responsibility, '')), '') is not null) as shared
    from elem e
    join public.defined_component_implementations i
      on i.tenant_id = p_tenant_id and i.defined_component_id = e.defined_component_id
    where i.control_id is not null
    group by e.product_element_id, i.control_id
  ),
  dets as materialized (
    select d.control_id, d.product_element_id, d.determination
    from public.product_determinations d
    where d.tenant_id = p_tenant_id and d.product_assessment_id = v_assessment.id
      and (d.product_element_id is null or d.product_element_id in (select product_element_id from elem))
  ),
  -- The product's basis for a control: one row an element (or the whole product) and control.
  basis as materialized (
    select coalesce(c.control_id, d.control_id) as control_id,
      coalesce(c.product_element_id, d.product_element_id) as product_element_id,
      coalesce(c.shared, false) as shared, d.determination
    from claims c
    full join dets d on d.control_id = c.control_id and d.product_element_id = c.product_element_id
  ),
  per as materialized (
    select s.control_id,
      count(b.control_id) as basis,
      count(b.control_id) filter (where b.product_element_id is null or e.change <> 'removed') as kept,
      count(*) filter (where e.change = 'modified') as modified,
      count(*) filter (where e.change = 'removed') as removed,
      coalesce(bool_or(b.shared) filter (where e.change = 'inherited'), false) as shared,
      bool_or(b.determination = 'other_than_satisfied') filter (where b.product_element_id is null or e.change <> 'removed') as other_than,
      bool_or(b.determination = 'partially_satisfied') filter (where b.product_element_id is null or e.change <> 'removed') as partially,
      bool_or(b.determination = 'satisfied') filter (where b.product_element_id is null or e.change <> 'removed') as satisfied,
      coalesce(jsonb_agg(jsonb_build_object(
        'product_element_id', e.product_element_id, 'system_id', e.system_id, 'code', e.code, 'name', e.name,
        'change', e.change, 'kinds', coalesce(to_jsonb(e.kinds), '[]'::jsonb)
      ) order by e.code) filter (where e.change in ('modified', 'removed')), '[]'::jsonb) as changed_elements
    from selected s
    left join basis b on b.control_id = s.control_id
    left join elem e on e.product_element_id = b.product_element_id
    group by s.control_id
  ),
  line as (
    select k.id, k.code, k.title, k.parent_control_id,
      public.natural_sort_key(k.code) collate "C" as code_order,
      upper(g.source_id) as family, g.title as family_title,
      case
        when p.kept = 0 then 'program_only'
        when p.modified > 0 or p.removed > 0 then 'changed_here'
        when p.shared then 'shared'
        else 'inherited'
      end as delta,
      case
        when p.kept = 0 then null
        when p.other_than then 'other_than_satisfied'
        when p.partially then 'partially_satisfied'
        when p.satisfied then 'satisfied'
        else 'not_assessed'
      end as product_status,
      p.changed_elements
    from per p
    join public.controls k on k.id = p.control_id
    left join public.catalog_groups g on g.id = k.group_id
  )
  select jsonb_build_object(
    'system_id', p_system_id,
    'program_id', v_system.program_id,
    'product', jsonb_build_object(
      'id', v_product.id, 'code', v_product.code, 'name', v_product.name,
      'revision_id', v_revision.id, 'version', v_revision.version_number,
      'configuration_id', v_configuration.id, 'configuration_code', v_configuration.code,
      'configuration', v_configuration.name),
    'assessment', case when v_assessment.id is null then null else jsonb_build_object(
      'id', v_assessment.id, 'title', v_assessment.title, 'published_at', v_assessment.published_at) end,
    'update_available', case when v_latest.id is null then null else jsonb_build_object(
      'revision_id', v_latest.id, 'version', v_latest.version_number) end,
    'elements', jsonb_build_object(
      'inherited', (select count(*) from elem where change = 'inherited'),
      'modified', (select count(*) from elem where change = 'modified'),
      'removed', (select count(*) from elem where change = 'removed'),
      'added', (select count(*) from inst where product_element_id is null)),
    'totals', jsonb_build_object(
      'controls', (select count(*) from line),
      'inherited', (select count(*) from line where delta = 'inherited'),
      'shared', (select count(*) from line where delta = 'shared'),
      'changed_here', (select count(*) from line where delta = 'changed_here'),
      'program_only', (select count(*) from line where delta = 'program_only')),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id, 'code', l.code, 'title', l.title, 'parent_id', l.parent_control_id,
        'family', l.family, 'family_title', l.family_title,
        'delta', l.delta, 'product_status', l.product_status, 'changed_elements', l.changed_elements
      ) order by l.family nulls last, l.code_order, l.id), '[]'::jsonb)
      from line l)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.variant_control_delta(uuid, uuid) from public, anon;
grant execute on function public.variant_control_delta(uuid, uuid) to authenticated;
comment on function public.variant_control_delta(uuid, uuid) is 'For a system created from a product configuration: each control of its control baseline as inherited, shared, changed_here or program_only against what the product gives, with the product''s standing on it and the modified or removed elements behind a change. A system that was not created from a product answers no product.';

-- ---------------------------------------------------------------------------------------------
-- Plan a variant's delta assessment: an assessment campaign of the variant's program whose draft
-- plan holds one objective for each control the program owes an assessment on, the controls that
-- are changed here and the ones that are the program's only. What the variant inherits as it is,
-- and what it shares, is left out: that is the work the product's own assessment saves.
--
-- A delta assessment's campaign names the variant it assesses, so the variant's delta can say
-- which campaigns already cover it. Only the command writes it.
alter table public.assessment_campaigns add column if not exists variant_system_id uuid;
do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'assessment_campaigns_variant_system') then
    alter table public.assessment_campaigns add constraint assessment_campaigns_variant_system
      foreign key (tenant_id, variant_system_id) references public.systems(tenant_id, id) on delete set null (variant_system_id);
  end if;
end $$;
create index if not exists assessment_campaigns_variant_system_idx
  on public.assessment_campaigns(tenant_id, variant_system_id) where variant_system_id is not null;
comment on column public.assessment_campaigns.variant_system_id is 'The product variant whose delta this campaign assesses; NULL for any other campaign. Written only by plan_delta_assessment.';

create or replace function public.guard_campaign_variant() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and (
    tg_op = 'INSERT' and new.variant_system_id is not null
    or tg_op = 'UPDATE' and new.variant_system_id is distinct from old.variant_system_id) then
    raise exception 'Use Plan delta assessment to plan a variant''s delta assessment' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_campaign_variant() from public, anon, authenticated;
create or replace trigger a_campaign_variant before insert or update on public.assessment_campaigns
  for each row execute function public.guard_campaign_variant();

-- A plan is pinned to a published SSP revision, as every assessment plan is, so the variant's SSP
-- is published first. The campaign takes the request's id: the same request sent again answers the
-- campaign it made and writes nothing.
-- ---------------------------------------------------------------------------------------------
create or replace function public.plan_delta_assessment(
  p_tenant_id uuid, p_system_id uuid, p_request_id uuid, p_title text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_system public.systems;
  v_delta jsonb;
  v_ssp public.ssp_revisions;
  v_campaign public.assessment_campaigns;
  v_plan uuid := gen_random_uuid();
  v_title text;
  v_objectives integer;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can plan an assessment' using errcode = '42501';
  end if;
  if p_request_id is null then
    raise exception 'The request identifier is missing' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || '/delta-assessment/' || p_request_id::text, 0));
  select * into v_campaign from public.assessment_campaigns where id = p_request_id;
  if found then
    if v_campaign.tenant_id <> p_tenant_id then
      raise exception 'This request was already used' using errcode = 'PT409';
    end if;
    return jsonb_build_object('campaignId', v_campaign.id, 'created', false,
      'planRevisionId', (select pr.id from public.assessment_plan_revisions pr
        where pr.tenant_id = p_tenant_id and pr.campaign_id = v_campaign.id order by pr.version_number limit 1),
      'objectives', (select count(*) from public.assessment_objectives o
        join public.assessment_plan_revisions pr on pr.tenant_id = o.tenant_id and pr.id = o.plan_revision_id
        where pr.tenant_id = p_tenant_id and pr.campaign_id = v_campaign.id));
  end if;
  select * into v_system from public.systems where tenant_id = p_tenant_id and id = p_system_id;
  if v_system.id is null then
    raise exception 'This system is no longer available; reload and try again' using errcode = 'P0002';
  end if;
  if v_system.product_configuration_id is null then
    raise exception 'A delta assessment is planned for a system created from a product' using errcode = '23514';
  end if;
  select * into v_ssp from public.ssp_revisions
    where tenant_id = p_tenant_id and system_id = p_system_id and state = 'published'
    order by version_number desc limit 1;
  if v_ssp.id is null then
    raise exception 'Publish this system''s SSP before planning its delta assessment' using errcode = '23514';
  end if;
  v_delta := public.variant_control_delta(p_tenant_id, p_system_id);
  if not exists (select 1 from jsonb_array_elements(v_delta->'controls') c where c->>'delta' in ('changed_here', 'program_only')) then
    raise exception 'This variant owes no assessment: every control is inherited or shared' using errcode = '23514';
  end if;
  v_title := coalesce(nullif(btrim(coalesce(p_title, '')), ''), v_system.name || ' delta assessment');
  insert into public.assessment_campaigns (id, tenant_id, title, description, program_id, status, variant_system_id)
    values (p_request_id, p_tenant_id, v_title,
      format('The controls %s owes an assessment on against %s version %s, %s: %s changed here and %s the program''s only. %s inherited and %s shared are left to the product''s assessment.',
        v_system.name, v_delta->'product'->>'name', v_delta->'product'->>'version', v_delta->'product'->>'configuration',
        v_delta->'totals'->>'changed_here', v_delta->'totals'->>'program_only',
        v_delta->'totals'->>'inherited', v_delta->'totals'->>'shared'),
      v_system.program_id, 'planned', p_system_id);
  insert into public.assessment_plan_revisions (id, tenant_id, version_number, campaign_id, ssp_revision_id, title, description)
    values (v_plan, p_tenant_id, 1, p_request_id, v_ssp.id, v_title,
      'One objective a control that is changed here or the program''s only.');
  insert into public.assessment_objectives (tenant_id, plan_revision_id, title, description, target_control_part_id)
  select p_tenant_id, v_plan, (c->>'code') || ' ' || (c->>'title'),
    case when c->>'delta' = 'program_only' then 'Program only: the product gives nothing for this control in this variant.'
      else 'Changed here: ' || coalesce((select string_agg(
          (e->>'name') || case when e->>'change' = 'removed' then ' (removed)'
            else ' (' || coalesce((select string_agg(k.value, ', ' order by k.value) from jsonb_array_elements_text(e->'kinds') k), 'modified') || ')' end,
          '; ' order by e->>'code') from jsonb_array_elements(c->'changed_elements') e), 'an element behind it changed') || '.'
    end,
    (select cp.id from public.control_parts cp
      where cp.control_id = (c->>'id')::uuid and cp.parent_part_id is null and cp.name = 'statement'
      order by cp.ordinal, cp.id limit 1)
  from jsonb_array_elements(v_delta->'controls') with ordinality x(c, position)
  where c->>'delta' in ('changed_here', 'program_only')
  order by x.position;
  get diagnostics v_objectives = row_count;
  return jsonb_build_object('campaignId', p_request_id, 'created', true, 'planRevisionId', v_plan,
    'sspRevisionId', v_ssp.id, 'objectives', v_objectives,
    'changedHere', (v_delta->'totals'->>'changed_here')::integer, 'programOnly', (v_delta->'totals'->>'program_only')::integer);
end;
$$;
revoke all on function public.plan_delta_assessment(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.plan_delta_assessment(uuid, uuid, uuid, text) to authenticated;
comment on function public.plan_delta_assessment(uuid, uuid, uuid, text) is 'Plans a variant''s delta assessment: an assessment campaign of its program with a draft plan on the variant''s published SSP and one objective a control that is changed here or the program''s only. The campaign takes the request''s id, so the same request sent again answers it and writes nothing.';

-- ---------------------------------------------------------------------------------------------
-- Authoring a product assessment.
--
-- An assessor works a draft assessment an element at a time: for the product as a whole or for
-- one element, each control of the assessment's control baseline with whether the element claims
-- it (through the library component it is pinned to) and the determination recorded so far.
-- product_assessment_sheet answers the whole sheet in one request, as the caller;
-- record_product_determinations records one determination for many controls of one element at
-- once, all of them or none, and clears them when no determination is given. Recording what is
-- already recorded changes nothing. A published assessment refuses both a record and a clear.
-- ---------------------------------------------------------------------------------------------
create or replace function public.product_assessment_sheet(p_tenant_id uuid, p_assessment_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_assessment public.product_assessments;
  answer jsonb;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  select * into v_assessment from public.product_assessments
    where tenant_id = p_tenant_id and id = p_assessment_id;
  -- An assessment that is gone, or that the reader cannot see, is none: the page says not found.
  if v_assessment.id is null then
    return null;
  end if;
  with
  selected as materialized (
    select sc.control_id from public.selected_controls sc
    where sc.profile_resolution_id = v_assessment.profile_resolution_id
  ),
  elements as materialized (
    select e.id, e.code, e.name, e.defined_component_id
    from public.product_elements e
    where e.tenant_id = p_tenant_id and e.product_revision_id = v_assessment.product_revision_id
  ),
  claims as materialized (
    select distinct e.id as element_id, i.control_id
    from elements e
    join public.defined_component_implementations i
      on i.tenant_id = p_tenant_id and i.defined_component_id = e.defined_component_id
    where i.control_id in (select s.control_id from selected s)
  ),
  dets as materialized (
    select d.product_element_id, d.control_id, d.determination, d.rationale
    from public.product_determinations d
    where d.tenant_id = p_tenant_id and d.product_assessment_id = v_assessment.id
  )
  select jsonb_build_object(
    'assessment', jsonb_build_object(
      'id', v_assessment.id, 'title', v_assessment.title, 'description', v_assessment.description,
      'state', v_assessment.state, 'revision', v_assessment.revision,
      'product_revision_id', v_assessment.product_revision_id,
      'profile_resolution_id', v_assessment.profile_resolution_id,
      'assessor_party_id', v_assessment.assessor_party_id,
      'started_on', v_assessment.started_on, 'completed_on', v_assessment.completed_on,
      'published_at', v_assessment.published_at),
    'elements', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', e.id, 'code', e.code, 'name', e.name,
        'claimed', (select count(*) from claims c where c.element_id = e.id),
        'determined', (select count(*) from dets d where d.product_element_id = e.id)
      ) order by public.natural_sort_key(e.code) collate "C", e.id), '[]'::jsonb) from elements e),
    'whole_determined', (select count(*) from dets d where d.product_element_id is null),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', k.id, 'code', k.code, 'title', k.title, 'parent_id', k.parent_control_id,
        'family', upper(g.source_id), 'family_title', g.title
      ) order by upper(g.source_id) nulls last, public.natural_sort_key(k.code) collate "C", k.id), '[]'::jsonb)
      from selected s
      join public.controls k on k.id = s.control_id
      left join public.catalog_groups g on g.id = k.group_id),
    'claims', (select coalesce(jsonb_agg(jsonb_build_array(c.element_id, c.control_id)), '[]'::jsonb) from claims c),
    'determinations', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'element_id', d.product_element_id, 'control_id', d.control_id,
        'determination', d.determination, 'rationale', d.rationale)), '[]'::jsonb) from dets d)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.product_assessment_sheet(uuid, uuid) from public, anon;
grant execute on function public.product_assessment_sheet(uuid, uuid) to authenticated;
comment on function public.product_assessment_sheet(uuid, uuid) is 'One product assessment as its author works it: the controls of its control baseline, the elements of the assessed version with how many controls each claims and has determined, every claim and every determination recorded. Read as the caller.';

create or replace function public.record_product_determinations(
  p_tenant_id uuid, p_assessment_id uuid, p_element_id uuid, p_control_ids uuid[], p_determination text, p_rationale text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_assessment public.product_assessments;
  v_controls uuid[];
  v_rationale text := nullif(btrim(coalesce(p_rationale, '')), '');
  v_updated integer := 0; v_inserted integer := 0; v_cleared integer := 0;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can record a determination' using errcode = '42501';
  end if;
  select * into v_assessment from public.product_assessments
    where tenant_id = p_tenant_id and id = p_assessment_id for update;
  if v_assessment.id is null then
    raise exception 'This product assessment is no longer available; reload and try again' using errcode = 'P0002';
  end if;
  if v_assessment.state <> 'draft' then
    raise exception 'A published product assessment cannot change' using errcode = '23514';
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
  if p_element_id is not null and not exists (select 1 from public.product_elements e
    where e.tenant_id = p_tenant_id and e.product_revision_id = v_assessment.product_revision_id and e.id = p_element_id) then
    raise exception 'This element is not part of the assessed product version' using errcode = '23514';
  end if;
  if exists (select 1 from unnest(v_controls) c where not exists (select 1 from public.selected_controls sc
    where sc.profile_resolution_id = v_assessment.profile_resolution_id and sc.control_id = c)) then
    raise exception 'A determination names a control of the assessment''s control baseline' using errcode = '23514';
  end if;
  if p_determination is null then
    delete from public.product_determinations d
      where d.tenant_id = p_tenant_id and d.product_assessment_id = p_assessment_id
        and d.product_element_id is not distinct from p_element_id and d.control_id = any(v_controls);
    get diagnostics v_cleared = row_count;
  else
    update public.product_determinations d
      set determination = p_determination, rationale = v_rationale, revision = d.revision + 1
      where d.tenant_id = p_tenant_id and d.product_assessment_id = p_assessment_id
        and d.product_element_id is not distinct from p_element_id and d.control_id = any(v_controls)
        and (d.determination, d.rationale) is distinct from (p_determination, v_rationale);
    get diagnostics v_updated = row_count;
    insert into public.product_determinations
        (tenant_id, product_assessment_id, product_revision_id, product_element_id, control_id, determination, rationale)
      select p_tenant_id, p_assessment_id, v_assessment.product_revision_id, p_element_id, c, p_determination, v_rationale
      from unnest(v_controls) c
      where not exists (select 1 from public.product_determinations d
        where d.tenant_id = p_tenant_id and d.product_assessment_id = p_assessment_id
          and d.product_element_id is not distinct from p_element_id and d.control_id = c);
    get diagnostics v_inserted = row_count;
  end if;
  return jsonb_build_object('assessmentId', p_assessment_id,
    'recorded', v_updated + v_inserted, 'cleared', v_cleared,
    'unchanged', case when p_determination is null then 0 else cardinality(v_controls) - v_updated - v_inserted end);
end;
$$;
revoke all on function public.record_product_determinations(uuid, uuid, uuid, uuid[], text, text) from public, anon;
grant execute on function public.record_product_determinations(uuid, uuid, uuid, uuid[], text, text) to authenticated;
comment on function public.record_product_determinations(uuid, uuid, uuid, uuid[], text, text) is 'Records one determination and its rationale for many controls of one element of a draft product assessment, or of the product as a whole when no element is named: all of them or none. No determination clears what was recorded. Recording what is already recorded changes nothing.';

-- ---------------------------------------------------------------------------------------------
-- Taking a newer version of the product into a variant.
--
-- A variant stays at the version it was created from until somebody takes a newer one. Elements
-- are followed across versions by their code, which copy_product_revision keeps:
--
--   kept            an inherited element the newer version's configuration still has: it follows
--                   the newer version's element, and what the program changed in it stays declared
--   added           an element new in the product, whose place in the structure the variant holds:
--                   it is created in the variant as the product delivers it
--   released        an inherited element the newer version's configuration no longer has: it stays
--                   in the variant as the program's own
--   stays_removed   an element the variant left out and the newer version still has
--   skipped         an element new in the product under an element the variant left out
--
-- The delta is then read against the newer version and its latest published product assessment,
-- which the answer names (assessment), or null where nobody assessed that version yet.
--
-- variant_version_changes says what taking a version would do and changes nothing;
-- take_product_version does it, at the revision of the variant the reader saw. The variant's own
-- names, codes and tree are the program's and stay as they are, and so do the library components
-- already applied: a kept element whose library pin differs in the newer version says so
-- (pin_changed) and is updated through the library's own Take version.
-- ---------------------------------------------------------------------------------------------
create or replace function public.variant_version_changes(p_tenant_id uuid, p_system_id uuid, p_product_revision_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_system public.systems;
  v_from public.product_revisions;
  v_to public.product_revisions;
  v_product public.products;
  v_configuration public.product_configurations;
  v_assessment public.product_assessments;
  v_prefix text;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  select * into v_system from public.systems where tenant_id = p_tenant_id and id = p_system_id;
  if v_system.id is null then
    raise exception 'System access is required' using errcode = '42501';
  end if;
  if v_system.product_configuration_id is null then
    raise exception 'Only a system created from a product takes a product version' using errcode = '23514';
  end if;
  select * into v_from from public.product_revisions where tenant_id = p_tenant_id and id = v_system.product_revision_id;
  select * into v_to from public.product_revisions where tenant_id = p_tenant_id and id = p_product_revision_id;
  if v_to.id is null then
    raise exception 'This product version is no longer available; reload and try again' using errcode = 'P0002';
  end if;
  if v_to.product_id <> v_from.product_id then
    raise exception 'Choose a version of the product this system was created from' using errcode = '23514';
  end if;
  select * into v_product from public.products where tenant_id = p_tenant_id and id = v_from.product_id;
  select * into v_configuration from public.product_configurations
    where tenant_id = p_tenant_id and id = v_system.product_configuration_id;
  select * into v_assessment from public.product_assessments a
    where a.tenant_id = p_tenant_id and a.product_revision_id = v_to.id and a.state = 'published'
    order by a.published_at desc, a.id desc limit 1;
  if v_to.id = v_from.id then
    return jsonb_build_object(
      'system_id', p_system_id, 'current', true,
      'product', jsonb_build_object('id', v_product.id, 'code', v_product.code, 'name', v_product.name),
      'configuration', jsonb_build_object('id', v_configuration.id, 'code', v_configuration.code, 'name', v_configuration.name),
      'from', jsonb_build_object('revision_id', v_from.id, 'version', v_from.version_number),
      'to', jsonb_build_object('revision_id', v_to.id, 'version', v_to.version_number),
      'assessment', case when v_assessment.id is null then null else jsonb_build_object(
        'id', v_assessment.id, 'title', v_assessment.title, 'published_at', v_assessment.published_at) end,
      'elements', '[]'::jsonb,
      'totals', jsonb_build_object('kept', 0, 'added', 0, 'released', 0, 'stays_removed', 0, 'skipped', 0, 'pin_changed', 0));
  end if;
  if v_to.state <> 'published' then
    raise exception 'Only a published product version can be taken' using errcode = '23514';
  end if;
  if v_to.version_number < v_from.version_number then
    raise exception 'Choose a newer version of the product' using errcode = '23514';
  end if;
  if v_configuration.state <> 'active' then
    raise exception 'This product configuration is retired' using errcode = '23514';
  end if;
  if not exists (select 1 from public.product_configuration_elements m
      where m.tenant_id = p_tenant_id and m.product_revision_id = v_to.id and m.product_configuration_id = v_configuration.id) then
    raise exception 'Version % of the product has no element in this configuration', v_to.version_number using errcode = '23514';
  end if;
  -- The variant's own prefix: what most of its inherited elements put before the product's code.
  select left(s.code, length(s.code) - length(pe.code)) into v_prefix
    from public.systems s
    join public.product_elements pe on pe.tenant_id = s.tenant_id and pe.id = s.product_element_id
    where s.tenant_id = p_tenant_id and s.boundary_system_id = v_system.id and not s.is_authorization_boundary
      and lower(right(s.code, length(pe.code))) = lower(pe.code)
    group by 1 order by count(*) desc, 1 limit 1;
  v_prefix := coalesce(v_prefix, '');
  with recursive
  inst as materialized (
    select s.id, s.code, s.name, s.system_type, s.product_change_kinds, pe.id as element_id, pe.code as element_code,
      pe.defined_component_id
    from public.systems s
    join public.product_elements pe on pe.tenant_id = s.tenant_id and pe.id = s.product_element_id
    where s.tenant_id = p_tenant_id and s.boundary_system_id = v_system.id and not s.is_authorization_boundary
  ),
  old_cfg as materialized (
    select lower(pe.code) as code
    from public.product_configuration_elements m
    join public.product_elements pe on pe.tenant_id = m.tenant_id and pe.id = m.product_element_id
    where m.tenant_id = p_tenant_id and m.product_revision_id = v_from.id and m.product_configuration_id = v_configuration.id
  ),
  new_cfg as materialized (
    select pe.id, pe.code, pe.name, pe.element_type, pe.defined_component_id, pe.position,
      parent.code as parent_code
    from public.product_configuration_elements m
    join public.product_elements pe on pe.tenant_id = m.tenant_id and pe.id = m.product_element_id
    left join public.product_elements parent on parent.tenant_id = pe.tenant_id and parent.id = pe.parent_element_id
    where m.tenant_id = p_tenant_id and m.product_revision_id = v_to.id and m.product_configuration_id = v_configuration.id
  ),
  -- Elements the variant holds, each kept or released.
  held as materialized (
    select i.id as system_id, i.code as system_code, i.name, i.system_type as element_type, i.element_id as from_element_id,
      n.id as to_element_id, coalesce(n.code, i.element_code) as code, n.parent_code,
      i.product_change_kinds is not null as modified,
      n.id is not null and n.defined_component_id is distinct from i.defined_component_id as pin_changed,
      case when n.id is null then 'released' else 'kept' end as change
    from inst i
    left join new_cfg n on lower(n.code) = lower(i.element_code)
  ),
  -- Elements of the newer configuration the variant does not hold.
  absent as materialized (
    select n.* from new_cfg n
    where not exists (select 1 from held h where h.to_element_id = n.id)
  ),
  fresh as materialized (
    select a.* from absent a where lower(a.code) not in (select code from old_cfg)
  ),
  -- A new element is added where the variant holds its place: at the top, under an element it
  -- kept, or under another element being added.
  added as (
    select f.id, 1 as depth from fresh f
    where f.parent_code is null
      or exists (select 1 from held h where h.change = 'kept' and lower(h.code) = lower(f.parent_code))
    union all
    select f.id, a.depth + 1
    from added a
    join fresh p on p.id = a.id
    join fresh f on lower(f.parent_code) = lower(p.code)
  ),
  line as (
    select h.code, h.name, h.element_type, h.change, h.system_id, h.system_code, h.from_element_id, h.to_element_id,
      h.parent_code, h.modified, h.pin_changed, 0 as depth, 0 as position
    from held h
    union all
    select a.code, a.name, a.element_type,
      case when a.id in (select id from added) then 'added'
        when lower(a.code) in (select code from old_cfg) then 'stays_removed'
        else 'skipped' end,
      null::uuid,
      case when a.id in (select id from added) then (
        select x.code from (
          select v_prefix || a.code as code, 1 as attempt
          union all
          select v_prefix || a.code || '-' || g, g from generate_series(2, 50) g
        ) x
        where not exists (select 1 from public.systems s
          where s.tenant_id = p_tenant_id and s.program_id = v_system.program_id and lower(s.code) = lower(x.code))
        order by x.attempt limit 1) end,
      null::uuid, a.id, a.parent_code, false, false,
      coalesce((select d.depth from added d where d.id = a.id), 0), a.position
    from absent a
  )
  select jsonb_build_object(
    'system_id', p_system_id, 'current', false,
    'product', jsonb_build_object('id', v_product.id, 'code', v_product.code, 'name', v_product.name),
    'configuration', jsonb_build_object('id', v_configuration.id, 'code', v_configuration.code, 'name', v_configuration.name),
    'from', jsonb_build_object('revision_id', v_from.id, 'version', v_from.version_number),
    'to', jsonb_build_object('revision_id', v_to.id, 'version', v_to.version_number),
    'assessment', case when v_assessment.id is null then null else jsonb_build_object(
      'id', v_assessment.id, 'title', v_assessment.title, 'published_at', v_assessment.published_at) end,
    'elements', coalesce((select jsonb_agg(jsonb_build_object(
        'code', l.code, 'name', l.name, 'element_type', l.element_type, 'change', l.change,
        'system_id', l.system_id, 'system_code', l.system_code,
        'from_element_id', l.from_element_id, 'to_element_id', l.to_element_id,
        'parent_code', l.parent_code, 'modified', l.modified, 'pin_changed', l.pin_changed, 'depth', l.depth
      ) order by case l.change when 'added' then 0 when 'released' then 1 when 'skipped' then 2 when 'stays_removed' then 3 else 4 end,
        l.depth, public.natural_sort_key(l.code) collate "C") from line l), '[]'::jsonb),
    'totals', jsonb_build_object(
      'kept', (select count(*) from line where change = 'kept'),
      'added', (select count(*) from line where change = 'added'),
      'released', (select count(*) from line where change = 'released'),
      'stays_removed', (select count(*) from line where change = 'stays_removed'),
      'skipped', (select count(*) from line where change = 'skipped'),
      'pin_changed', (select count(*) from line where pin_changed))
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.variant_version_changes(uuid, uuid, uuid) from public, anon;
grant execute on function public.variant_version_changes(uuid, uuid, uuid) to authenticated;
comment on function public.variant_version_changes(uuid, uuid, uuid) is 'What taking a newer published version of its product would do to a variant, element by element (kept, added, released, stays_removed, skipped), followed across versions by code. Changes nothing.';

create or replace function public.take_product_version(
  p_tenant_id uuid, p_system_id uuid, p_expected_revision bigint, p_product_revision_id uuid, p_request_id uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_system public.systems;
  v_plan jsonb;
  v_line jsonb;
  v_to uuid;
  v_systems jsonb := '{}'::jsonb;
  v_parent uuid;
  v_id uuid;
  v_pe public.product_elements;
  v_defined public.defined_components;
  v_library public.component_definition_revisions;
  v_row public.systems;
  v_assignment uuid;
  v_rationale text;
  v_added jsonb := '[]'::jsonb;
  v_revision bigint;
  v_actor uuid;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can take a product version' using errcode = '42501';
  end if;
  if p_request_id is null then
    raise exception 'A request id is required' using errcode = '22023';
  end if;
  select * into v_system from public.systems where tenant_id = p_tenant_id and id = p_system_id for update;
  if v_system.id is null then
    raise exception 'This system is no longer available; reload and try again' using errcode = 'P0002';
  end if;
  v_plan := public.variant_version_changes(p_tenant_id, p_system_id, p_product_revision_id);
  if (v_plan->>'current')::boolean then
    return jsonb_build_object('systemId', v_system.id, 'revision', v_system.revision, 'changed', false,
      'version', (v_plan->'to'->>'version')::integer,
      'kept', 0, 'added', 0, 'released', 0, 'staysRemoved', 0, 'skipped', 0, 'elements', '[]'::jsonb);
  end if;
  if v_system.revision is distinct from p_expected_revision then
    raise exception 'Record revision conflict; reload before saving' using errcode = 'PT409';
  end if;
  v_to := (v_plan->'to'->>'revision_id')::uuid;
  v_rationale := format('Inherited from %s v%s · %s', v_plan->'product'->>'name', v_plan->'to'->>'version', v_plan->'configuration'->>'name');
  -- Kept elements follow the newer version's element; what the program changed stays declared.
  update public.systems s set product_revision_id = v_to, product_element_id = (e.value->>'to_element_id')::uuid,
      revision = s.revision + 1
    from jsonb_array_elements(v_plan->'elements') e
    where e.value->>'change' = 'kept' and s.tenant_id = p_tenant_id and s.id = (e.value->>'system_id')::uuid;
  -- Released elements become the program's own.
  update public.systems s set product_revision_id = null, product_element_id = null,
      product_change_kinds = null, product_change_rationale = null, product_changed_at = null, product_changed_by = null,
      revision = s.revision + 1
    from jsonb_array_elements(v_plan->'elements') e
    where e.value->>'change' = 'released' and s.tenant_id = p_tenant_id and s.id = (e.value->>'system_id')::uuid;
  update public.systems set product_revision_id = v_to, revision = revision + 1
    where tenant_id = p_tenant_id and id = v_system.id
    returning revision into v_revision;
  select coalesce(jsonb_object_agg(lower(e.value->>'code'), e.value->>'system_id'), '{}'::jsonb) into v_systems
    from jsonb_array_elements(v_plan->'elements') e where e.value->>'change' = 'kept';
  -- Added elements, a parent before what it holds.
  for v_line in select e.value from jsonb_array_elements(v_plan->'elements') e
      where e.value->>'change' = 'added' order by (e.value->>'depth')::integer, e.value->>'code' loop
    select * into v_pe from public.product_elements where tenant_id = p_tenant_id and id = (v_line->>'to_element_id')::uuid;
    v_parent := case when v_line->>'parent_code' is null then v_system.id
      else (v_systems->>lower(v_line->>'parent_code'))::uuid end;
    if v_parent is null or v_line->>'system_code' is null then
      raise exception 'Element % could not be placed in this system', v_pe.code using errcode = '23514';
    end if;
    v_id := gen_random_uuid();
    insert into public.systems(id, tenant_id, program_id, parent_system_id, is_authorization_boundary, code, name, description, system_type, product_revision_id, product_element_id)
      values (v_id, p_tenant_id, v_system.program_id, v_parent, false, v_line->>'system_code', v_pe.name, v_pe.description, v_pe.element_type, v_to, v_pe.id);
    v_systems := v_systems || jsonb_build_object(lower(v_pe.code), v_id);
    if v_pe.defined_component_id is not null then
      select * into v_defined from public.defined_components where tenant_id = p_tenant_id and id = v_pe.defined_component_id;
      select * into v_library from public.component_definition_revisions
        where tenant_id = p_tenant_id and id = v_defined.component_definition_revision_id;
      if v_library.state <> 'published' then
        raise exception 'Only a published library version can be applied' using errcode = '23514';
      end if;
      select * into v_row from public.systems where id = v_id;
      insert into public.library_assignments(tenant_id, program_id, system_id, source_revision_id, include_descendants, control_ids, rationale, accepted_by, request_id)
        values (p_tenant_id, v_system.program_id, v_id, v_library.id, false, null, v_rationale, auth.uid(), p_request_id)
        returning id into v_assignment;
      perform public.apply_library_component(p_tenant_id, v_system.program_id, v_assignment, v_library, v_defined, v_row,
        v_row.code, v_row.name, null, '[]'::jsonb, v_rationale);
    end if;
    v_added := v_added || jsonb_build_object('systemId', v_id, 'code', v_line->>'system_code', 'name', v_pe.name);
  end loop;
  select id into v_actor from public.parties where tenant_id = p_tenant_id and auth_user_id = auth.uid();
  insert into public.activity_events (tenant_id, program_id, actor_party_id, event_type, description, occurred_at)
    values (p_tenant_id, v_system.program_id, v_actor, 'updated',
      format('%s: took version %s of %s.', v_system.code, v_plan->'to'->>'version', v_plan->'product'->>'name'),
      clock_timestamp());
  return jsonb_build_object('systemId', v_system.id, 'revision', v_revision, 'changed', true,
    'version', (v_plan->'to'->>'version')::integer,
    'kept', (v_plan->'totals'->>'kept')::integer, 'added', (v_plan->'totals'->>'added')::integer,
    'released', (v_plan->'totals'->>'released')::integer, 'staysRemoved', (v_plan->'totals'->>'stays_removed')::integer,
    'skipped', (v_plan->'totals'->>'skipped')::integer, 'elements', v_added);
end;
$$;
revoke all on function public.take_product_version(uuid, uuid, bigint, uuid, uuid) from public, anon;
grant execute on function public.take_product_version(uuid, uuid, bigint, uuid, uuid) to authenticated;
comment on function public.take_product_version(uuid, uuid, bigint, uuid, uuid) is 'Takes a newer published version of its product into a variant, at the revision the reader saw: kept elements follow the newer version, elements new in the product are created where the variant holds their place, elements the configuration no longer has become the program''s own. A variant already at that version is left as it is.';

notify pgrst, 'reload schema';
