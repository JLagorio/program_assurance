-- Component versions: what a new version of a component changes, what carries forward, and a
-- program taking the newer version. Slice 5 of "assess once, use everywhere".
--
-- Slices 1 to 4 let a component version be assessed once and everything built from it, unmodified,
-- inherit what it was judged on. A component is followed across the versions of its set by its
-- name, and until now each version stood alone: a new version read not assessed on every control,
-- and a program on the older one had no way to move. From here on, under three rules:
--
--   1. A consumer stays on the version it took. Nothing moves for it when a newer version is
--      drafted or published; it reads as behind, and no more.
--   2. A new version carries forward every determination of the version before, except on the
--      controls its owner lists as affected by what it changes. Those read not assessed, marked
--      for review, until the new version is judged on them. A determination of the version's own
--      always stands over a carried one.
--   3. Take version reviews before it writes. A program moves one of its components to a newer
--      published version at the revision the reader saw, and what it inherits follows from the
--      reads: what carried is still inherited, an affected control is not until it is re-judged.
--
-- What it adds, and changes nothing that was there:
--
--   component_version_changes          what one component of a version of its set changes against
--                                      the version before: which kinds, and a summary
--   component_version_change_controls  the controls that change affects
--
-- written while the version is a draft and frozen once it is published, as its components and
-- their claims are. The second rule lives in one internal read, component_standing_lines, which
-- every read of a component's standing counts from: a version's own latest published determination;
-- else the determination of the same component in the nearest earlier published version judged on
-- the control, carried forward, unless this version or a published version in between lists the
-- control as affected. A carried line keeps the determination and the component assessment it came
-- from and says the version it was carried from. product_element_standing and
-- program_element_inheritance take the lines that hold a determination, so a product element and
-- a program's element built from the new version inherit what carried and stop inheriting an
-- affected control, with nothing to do. program_element_inheritance is redefined only so that its
-- first question, whether anything the program takes from the library was ever judged, follows a
-- component through its earlier versions.
--
-- The reads: component_control_status says of each control whether it is carried and from which
-- version, or is to review, and counts both; system_upstream counts both in each component's
-- standing; component_rows gains controls_to_review, its last column, and counts a carried
-- determination among those that stand. component_version_review is what Take version shows before
-- it writes, in one request; take_component_version is the command.
--
-- Nothing moves while no set holds a second published version: a component with no earlier
-- published version carries nothing, and every answer keeps the keys it had.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- What a version of a component changes against the version before.
-- ---------------------------------------------------------------------------------------------
-- A component version is a component of one version of its set (defined_components in a
-- component_definition_revisions row), so a change names both and belongs to the version: both
-- keys carry it. One change a component version.
create table if not exists public.component_version_changes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  component_definition_revision_id uuid not null,
  defined_component_id uuid not null,
  change_kinds text[] not null,
  summary text not null check (length(btrim(summary)) > 0),
  constraint component_version_changes_kinds check (
    cardinality(change_kinds) > 0 and change_kinds <@ array['software', 'firmware', 'hardware', 'data']),
  unique (tenant_id, id),
  unique (tenant_id, component_definition_revision_id, id),
  unique (tenant_id, defined_component_id),
  foreign key (tenant_id, component_definition_revision_id, defined_component_id)
    references public.defined_components(tenant_id, component_definition_revision_id, id)
);
-- A control the change affects, once each change.
create table if not exists public.component_version_change_controls (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  component_definition_revision_id uuid not null,
  component_version_change_id uuid not null,
  control_id uuid not null references public.controls(id),
  unique (tenant_id, id),
  unique (tenant_id, component_version_change_id, control_id),
  foreign key (tenant_id, component_definition_revision_id, component_version_change_id)
    references public.component_version_changes(tenant_id, component_definition_revision_id, id) on delete cascade
);
create index if not exists component_version_changes_revision_idx
  on public.component_version_changes(tenant_id, component_definition_revision_id);
create index if not exists component_version_change_controls_change_idx
  on public.component_version_change_controls(tenant_id, component_version_change_id);
create index if not exists component_version_change_controls_control_idx
  on public.component_version_change_controls(control_id);

-- What the foreign keys cannot say: a change is recorded against the version before, so the
-- component has one. A component a version holds for the first time changes nothing.
create or replace function public.guard_component_version_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_name text; v_definition uuid; v_version integer;
begin
  select c.name, r.component_definition_id, r.version_number into v_name, v_definition, v_version
    from public.defined_components c
    join public.component_definition_revisions r
      on r.tenant_id = c.tenant_id and r.id = c.component_definition_revision_id
    where c.tenant_id = new.tenant_id and c.id = new.defined_component_id;
  -- A component that is not the workspace's is the foreign key's to refuse.
  if v_name is null then
    return new;
  end if;
  if not exists (
    select 1
    from public.component_definition_revisions e
    join public.defined_components x
      on x.tenant_id = e.tenant_id and x.component_definition_revision_id = e.id and x.name = v_name
    where e.tenant_id = new.tenant_id and e.component_definition_id = v_definition
      and e.version_number < v_version) then
    raise exception 'A change is recorded against the version before, and this component has no earlier version'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_component_version_change() from public, anon, authenticated;

-- A change and its controls are content of their version: written while it is a draft, and frozen
-- with it, as its components and their claims are (guard_published_parent). The control is the
-- catalog's or the workspace's own, never another workspace's (guard_reference_tenant).
do $$
declare v_table text;
begin
  foreach v_table in array array['component_version_changes', 'component_version_change_controls'] loop
    if not exists (select 1 from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = v_table and policyname = 'tenant_read') then
      perform public.apply_tenant_security(v_table);
    end if;
    if not exists (select 1 from pg_catalog.pg_trigger
      where tgrelid = ('public.' || v_table)::regclass and tgname = 'record_lifecycle' and not tgisinternal) then
      perform public.attach_record_lifecycle(v_table, false);
    end if;
  end loop;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.component_version_change_controls'::regclass
      and tgname = 'reference_tenant_control_id' and not tgisinternal) then
    perform public.attach_reference_tenant_guard('component_version_change_controls', 'control_id', 'controls');
  end if;
end $$;
create or replace trigger immutable_component_definition_revision_id
  before insert or update or delete on public.component_version_changes
  for each row execute function public.guard_published_parent('component_definition_revisions', 'component_definition_revision_id');
create or replace trigger immutable_component_definition_revision_id
  before insert or update or delete on public.component_version_change_controls
  for each row execute function public.guard_published_parent('component_definition_revisions', 'component_definition_revision_id');
create or replace trigger stable_context before update on public.component_version_changes
  for each row execute function public.guard_stable_assurance_context('component_definition_revision_id', 'defined_component_id');
create or replace trigger stable_context before update on public.component_version_change_controls
  for each row execute function public.guard_stable_assurance_context('component_definition_revision_id', 'component_version_change_id', 'control_id');
create or replace trigger a_component_version_change before insert on public.component_version_changes
  for each row execute function public.guard_component_version_change();

-- A generic record form prints a column's comment under its field, so each is the reader's copy.
comment on table public.component_version_changes is 'What one component of a version of its set changes against the version before: which kinds of thing changed (software, firmware, hardware, data) and a summary, once a component version. The controls the change affects are component_version_change_controls. Written while the version is a draft and frozen once it is published. A component a version holds for the first time records no change.';
comment on column public.component_version_changes.component_definition_revision_id is 'The version of the component set the change belongs to.';
comment on column public.component_version_changes.defined_component_id is 'The component this version changes.';
comment on column public.component_version_changes.change_kinds is 'What changed in the component since the version before: its software, firmware, hardware or data.';
comment on column public.component_version_changes.summary is 'What changed, in a sentence or two, for the people who build from the component.';
comment on table public.component_version_change_controls is 'A control a component version''s change affects, once each change. What an earlier version was judged on such a control is not carried forward: the control reads not assessed, marked for review, until this version is judged on it.';
comment on column public.component_version_change_controls.component_definition_revision_id is 'The version of the component set the change belongs to.';
comment on column public.component_version_change_controls.component_version_change_id is 'The change that affects the control.';
comment on column public.component_version_change_controls.control_id is 'A control the change affects. What earlier versions were judged on it is not carried forward to this version.';

-- ---------------------------------------------------------------------------------------------
-- Receipts: what each Take version first answered.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.component_version_requests (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  system_component_id uuid not null,
  request jsonb not null check (jsonb_typeof(request) = 'object'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  -- A receipt goes with its component, so it never keeps one from being removed.
  foreign key (tenant_id, system_component_id) references public.system_components(tenant_id, id) on delete cascade
);
create index if not exists component_version_requests_component_idx
  on public.component_version_requests(tenant_id, system_component_id);
alter table public.component_version_requests enable row level security;
revoke all on public.component_version_requests from public, anon, authenticated;
comment on table public.component_version_requests is 'Private receipts of take_component_version: a request sent again returns what it first answered, and one sent with another choice conflicts. No client reads them.';

-- ---------------------------------------------------------------------------------------------
-- Internal: where a component version stands on each control, with what carries forward.
-- ---------------------------------------------------------------------------------------------
-- The one place the carry-forward rule lives. A line a component and control:
--
--   its own      the latest published determination on that component version;
--   carried      else the determination of the same component (by its name) in the nearest
--                earlier published version of its set that was judged on the control, with the
--                component assessment it came from and the version it was carried from;
--   to review    unless the version asked about, whatever its state, or a published version
--                between the two lists the control as affected for the component: then the line
--                reads not_assessed, holds no assessment, and says which version's change stopped
--                it and what the earlier version read;
--   not_assessed for a control the version claims that neither it nor an earlier version was
--                judged on.
--
-- A draft version reads what it would carry, so its owner sees what its change leaves to review
-- before publishing; nothing is built from a draft version, so that hands nobody anything. A
-- published version's standing rests on published things only: its own and earlier published
-- versions' assessments and change lists.
--
-- The answer gains columns, so the function is dropped once and created again. component_rows
-- reads it: a later change to its answer drops that view first.
do $$
begin
  if exists (select 1 from pg_catalog.pg_proc p
    where p.oid = to_regprocedure('public.component_standing_lines(uuid[])')
      and pg_catalog.pg_get_function_result(p.oid) not like '%carried_from_version%') then
    drop function public.component_standing_lines(uuid[]);
  end if;
end $$;
create or replace function public.component_standing_lines(p_defined_component_ids uuid[])
returns table (
  defined_component_id uuid, control_id uuid, status text, claimed boolean,
  component_assessment_id uuid, rationale text,
  carried_from_component_id uuid, carried_from_version integer,
  to_review boolean, affected_in_version integer, earlier_version integer, earlier_determination text
)
language sql stable security invoker set search_path = '' as $$
  with
  asked as materialized (
    select c.id as defined_component_id, c.tenant_id, c.name, r.component_definition_id, r.version_number
    from public.defined_components c
    join public.component_definition_revisions r
      on r.tenant_id = c.tenant_id and r.id = c.component_definition_revision_id
    where c.id = any(coalesce(p_defined_component_ids, '{}'))
  ),
  -- The same component in the earlier published versions of its set, by its name.
  earlier as materialized (
    select a.defined_component_id, a.tenant_id, e.id as earlier_component_id, er.version_number
    from asked a
    join public.component_definition_revisions er
      on er.tenant_id = a.tenant_id and er.component_definition_id = a.component_definition_id
      and er.state = 'published' and er.version_number < a.version_number
    join public.defined_components e
      on e.tenant_id = er.tenant_id and e.component_definition_revision_id = er.id and e.name = a.name
  ),
  claims as (
    select distinct i.defined_component_id, i.control_id
    from public.defined_component_implementations i
    where i.defined_component_id = any(coalesce(p_defined_component_ids, '{}')) and i.control_id is not null
  ),
  wanted as (
    select a.tenant_id, a.defined_component_id as id from asked a
    union
    select e.tenant_id, e.earlier_component_id from earlier e
  ),
  -- The latest published determination on each of those component versions and each control.
  judged as materialized (
    select distinct on (d.defined_component_id, d.control_id)
      d.defined_component_id, d.control_id, d.determination, d.rationale, d.component_assessment_id
    from wanted w
    join public.component_determinations d on d.tenant_id = w.tenant_id and d.defined_component_id = w.id
    join public.component_assessments a
      on a.tenant_id = d.tenant_id and a.id = d.component_assessment_id and a.state = 'published'
    order by d.defined_component_id, d.control_id, a.published_at desc, a.id desc
  ),
  own as (
    select j.defined_component_id, j.control_id, j.determination, j.rationale, j.component_assessment_id
    from judged j
    where j.defined_component_id in (select a.defined_component_id from asked a)
  ),
  -- For each component asked about and control, the nearest earlier published version judged on it.
  source as materialized (
    select distinct on (e.defined_component_id, j.control_id)
      e.defined_component_id, j.control_id, e.earlier_component_id, e.version_number,
      j.determination, j.rationale, j.component_assessment_id
    from earlier e
    join judged j on j.defined_component_id = e.earlier_component_id
    order by e.defined_component_id, j.control_id, e.version_number desc, e.earlier_component_id
  ),
  -- The versions whose change lists a control as affected for the component: the version asked
  -- about itself, and the published versions before it.
  affected as materialized (
    select a.defined_component_id, k.control_id, vr.version_number
    from asked a
    join public.component_definition_revisions vr
      on vr.tenant_id = a.tenant_id and vr.component_definition_id = a.component_definition_id
      and vr.version_number <= a.version_number
    join public.defined_components vc
      on vc.tenant_id = vr.tenant_id and vc.component_definition_revision_id = vr.id and vc.name = a.name
      and (vc.id = a.defined_component_id or (vr.version_number < a.version_number and vr.state = 'published'))
    join public.component_version_changes ch on ch.tenant_id = vc.tenant_id and ch.defined_component_id = vc.id
    join public.component_version_change_controls k
      on k.tenant_id = ch.tenant_id and k.component_version_change_id = ch.id
  ),
  -- What an earlier version hands a version that holds no determination of its own on the control,
  -- and the latest version after that earlier one whose change stops it, if any.
  handed as materialized (
    select s.defined_component_id, s.control_id, s.earlier_component_id, s.version_number,
      s.determination, s.rationale, s.component_assessment_id,
      (select max(f.version_number) from affected f
        where f.defined_component_id = s.defined_component_id and f.control_id = s.control_id
          and f.version_number > s.version_number) as affected_in
    from source s
    where not exists (select 1 from own o
      where o.defined_component_id = s.defined_component_id and o.control_id = s.control_id)
  ),
  line as (
    select c.defined_component_id, c.control_id from claims c
    union
    select o.defined_component_id, o.control_id from own o
    union
    select h.defined_component_id, h.control_id from handed h
  )
  select l.defined_component_id, l.control_id,
    coalesce(o.determination, case when h.affected_in is null then h.determination end, 'not_assessed'),
    c.control_id is not null,
    coalesce(o.component_assessment_id, case when h.affected_in is null then h.component_assessment_id end),
    case when o.control_id is not null then o.rationale when h.affected_in is null then h.rationale end,
    case when h.affected_in is null then h.earlier_component_id end,
    case when h.affected_in is null then h.version_number end,
    h.affected_in is not null,
    h.affected_in,
    case when h.affected_in is not null then h.version_number end,
    case when h.affected_in is not null then h.determination end
  from line l
  left join claims c on c.defined_component_id = l.defined_component_id and c.control_id = l.control_id
  left join own o on o.defined_component_id = l.defined_component_id and o.control_id = l.control_id
  left join handed h on h.defined_component_id = l.defined_component_id and h.control_id = l.control_id
$$;
revoke all on function public.component_standing_lines(uuid[]) from public, anon;
grant execute on function public.component_standing_lines(uuid[]) to authenticated;
comment on function public.component_standing_lines(uuid[]) is 'Internal: where each component named stands on each control it claims, was judged on or an earlier version was judged on. Its own latest published determination (satisfied, partially_satisfied, other_than_satisfied) with the assessment that decided it; else the determination of the same component, by its name, in the nearest earlier published version of its set judged on the control, carried forward with that assessment and the version it was carried from (carried_from_component_id, carried_from_version); unless the version asked about, whatever its state, or a published version between the two lists the control as affected for the component (component_version_change_controls): then not_assessed with no assessment, to_review true, the version whose change stopped it (affected_in_version) and what the earlier version read (earlier_version, earlier_determination); else not_assessed for a claimed control nobody judged. A draft assessment decides nothing. Security invoker. component_control_status, component_rows, component_consumers, system_upstream, component_version_review, product_element_standing and program_element_inheritance count from it, the last two taking the lines that hold an assessment.';

-- ---------------------------------------------------------------------------------------------
-- Internal: the elements of a program that inherit a control.
--
-- Redefined from its body in 20261115140023_component_inheritance with its first question alone
-- changed: whether anything the program takes from the library was ever judged follows each
-- component through the earlier versions of its set, since a version nobody judged may stand on
-- what was carried forward. Its rows are component_standing_lines', as before.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_element_inheritance(p_program_id uuid, p_control_ids uuid[])
returns table (element_id uuid, control_id uuid, determination text, component_assessment_id uuid)
language plpgsql stable security invoker set search_path = '' as $$
#variable_conflict use_column
begin
  -- A program the caller cannot read is refused, never answered as inheriting nothing.
  if not exists (select 1 from public.programs p where p.id = p_program_id) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  -- Nothing is inherited where no system component of the program is built from a library
  -- component a published assessment judged on one of the controls, in the version taken or an
  -- earlier one of the same component. Asked first and by the components, so a program that takes
  -- nothing judged from the library reads nothing more.
  if not exists (
    select 1
    from public.systems b
    join public.system_components c on c.tenant_id = b.tenant_id and c.system_id = b.id
    join public.defined_components taken on taken.tenant_id = c.tenant_id and taken.id = c.defined_component_id
    join public.component_definition_revisions took
      on took.tenant_id = taken.tenant_id and took.id = taken.component_definition_revision_id
    join public.component_definition_revisions r
      on r.tenant_id = took.tenant_id and r.component_definition_id = took.component_definition_id
      and r.version_number <= took.version_number
    join public.defined_components v
      on v.tenant_id = r.tenant_id and v.component_definition_revision_id = r.id and v.name = taken.name
    join public.component_determinations d
      on d.tenant_id = v.tenant_id and d.defined_component_id = v.id
    join public.component_assessments a
      on a.tenant_id = d.tenant_id and a.id = d.component_assessment_id and a.state = 'published'
    where b.program_id = p_program_id
      and (p_control_ids is null or d.control_id = any(p_control_ids))
  ) then
    return;
  end if;
  return query
  with
  -- Each system component of the program on the element it sits on: the one it names, else the one
  -- a single inventory relationship gives it (system_component_element_links), else its system, as
  -- component_consumers and system_upstream place it.
  component as materialized (
    select coalesce(k.system_element_id, c.system_id) as element_id, c.id, c.defined_component_id
    from public.systems b
    join public.system_components c on c.tenant_id = b.tenant_id and c.system_id = b.id
    left join public.system_component_element_links k on k.tenant_id = c.tenant_id and k.id = c.id
    where b.program_id = p_program_id
  ),
  -- Where the library component versions among them stand: a determination, the version's own or
  -- one carried forward, never a claim nobody judged or a control left to review.
  stands as materialized (
    select l.defined_component_id, l.control_id, l.status, l.component_assessment_id
    from public.component_standing_lines(array(
      select distinct c.defined_component_id from component c where c.defined_component_id is not null)) l
    where l.component_assessment_id is not null
      and (p_control_ids is null or l.control_id = any(p_control_ids))
  ),
  held as materialized (
    select c.element_id, c.id as system_component_id, s.control_id, s.status, s.component_assessment_id
    from component c
    join stands s on s.defined_component_id = c.defined_component_id
  ),
  -- An element inherits a control once every system component on it holds a determination on it:
  -- one that is not from the library, or whose version nobody judged on the control, leaves the
  -- control with the program's assessor. So does an element the program declared modified.
  inherited as (
    select h.element_id, h.control_id
    from held h
    join public.systems e on e.id = h.element_id and e.product_change_kinds is null
    group by h.element_id, h.control_id
    having count(*) = (select count(*) from component c where c.element_id = h.element_id)
  )
  select h.element_id, h.control_id,
    (array['other_than_satisfied', 'partially_satisfied', 'satisfied'])[
      min(case h.status when 'other_than_satisfied' then 0 when 'partially_satisfied' then 1 else 2 end) + 1],
    h.component_assessment_id
  from held h
  join inherited i on i.element_id = h.element_id and i.control_id = h.control_id
  group by h.element_id, h.control_id, h.component_assessment_id;
end;
$$;
revoke all on function public.program_element_inheritance(uuid, uuid[]) from public, anon;
grant execute on function public.program_element_inheritance(uuid, uuid[]) to authenticated;
comment on function public.program_element_inheritance(uuid, uuid[]) is 'Internal: the elements of a program that inherit one of the controls named (every control where p_control_ids is null). An element inherits a control when at least one system component sits on it (the element it names, else the one its single inventory relationship gives it, else its system), every system component on it is built from a library component version whose standing holds a determination on the control (component_standing_lines: the version''s own, or one carried forward from an earlier version, never a control its change left to review), and the program has not declared the element modified (systems.product_change_kinds). One row an element, control and component assessment behind it, with the worst that assessment determined among the element''s components; the element''s determination is the worst of its rows. A draft component assessment decides nothing. Security invoker, asking nothing of who calls but that row-level security lets them read the program: one they cannot read is refused. program_objective_inheritance, component_consumers, system_upstream and component_version_review read it.';

-- ---------------------------------------------------------------------------------------------
-- Where a component version stands on each control.
--
-- Redefined from its body in 20261115082948_component_offers with new keys only: each control says
-- whether its determination is carried and from which version (carried, carried_from) or is to
-- review (to_review, review), the totals count both, each assessment says the version it judged,
-- and change is what this version changes against the version before.
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
      l.carried_from_component_id, l.carried_from_version,
      l.to_review, l.affected_in_version, l.earlier_version, l.earlier_determination,
      k.code, k.title, k.parent_control_id,
      public.natural_sort_key(k.code) collate "C" as code_order,
      upper(g.source_id) as family, g.title as family_title
    from public.component_standing_lines(array[p_defined_component_id]) l
    join public.controls k on k.id = l.control_id
    left join public.catalog_groups g on g.id = k.group_id
  ),
  deciding as (
    select a.id, a.title, a.published_at, a.completed_on, a.assessor_party_id, a.profile_resolution_id,
      r.version_number as version, count(*) as determinations
    from line l
    join public.component_assessments a on a.id = l.component_assessment_id
    join public.component_definition_revisions r
      on r.tenant_id = a.tenant_id and r.id = a.component_definition_revision_id
    group by a.id, a.title, a.published_at, a.completed_on, a.assessor_party_id, a.profile_resolution_id,
      r.version_number
  )
  select jsonb_build_object(
    'defined_component_id', p_defined_component_id,
    'component', jsonb_build_object(
      'id', v_component.id, 'name', v_component.name, 'component_type', v_component.component_type,
      'definition_id', v_definition.id, 'definition_code', v_definition.code, 'definition_name', v_definition.name,
      'revision_id', v_revision.id, 'version', v_revision.version_number, 'state', v_revision.state,
      'owner_party_id', public.component_owner_party(p_defined_component_id),
      'definition_owner_party_id', v_definition.owner_party_id, 'business_line_id', v_definition.business_line_id),
    -- What this version changes against the version before, and the controls that affects.
    'change', (
      select jsonb_build_object(
        'id', ch.id, 'kinds', to_jsonb(ch.change_kinds), 'summary', ch.summary,
        'controls', (select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'code', k.code, 'title', k.title)
            order by public.natural_sort_key(k.code) collate "C", k.id), '[]'::jsonb)
          from public.component_version_change_controls x
          join public.controls k on k.id = x.control_id
          where x.tenant_id = ch.tenant_id and x.component_version_change_id = ch.id))
      from public.component_version_changes ch
      where ch.tenant_id = v_component.tenant_id and ch.defined_component_id = p_defined_component_id),
    -- The published assessments a determination that stands was taken from, the newest first, each
    -- with the version it judged: this one, or an earlier one whose determinations carried.
    'assessments', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', d.id, 'title', d.title, 'published_at', d.published_at, 'completed_on', d.completed_on,
        'assessor_party_id', d.assessor_party_id, 'profile_resolution_id', d.profile_resolution_id,
        'determinations', d.determinations, 'version', d.version
      ) order by d.published_at desc, d.id desc), '[]'::jsonb) from deciding d),
    'totals', jsonb_build_object(
      'controls', (select count(*) from line),
      'satisfied', (select count(*) from line where status = 'satisfied'),
      'partially_satisfied', (select count(*) from line where status = 'partially_satisfied'),
      'other_than_satisfied', (select count(*) from line where status = 'other_than_satisfied'),
      'not_assessed', (select count(*) from line where status = 'not_assessed'),
      -- Of the determinations that stand, those carried forward; of the controls not assessed,
      -- those an earlier version was judged on and a change left to review.
      'carried', (select count(*) from line where carried_from_version is not null),
      'to_review', (select count(*) from line where to_review)),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.control_id, 'code', l.code, 'title', l.title, 'parent_id', l.parent_control_id,
        'family', l.family, 'family_title', l.family_title,
        'status', l.status, 'claimed', l.claimed,
        'assessment_id', l.component_assessment_id, 'rationale', l.rationale,
        'carried', l.carried_from_version is not null,
        'carried_from', case when l.carried_from_version is not null then jsonb_build_object(
          'defined_component_id', l.carried_from_component_id, 'version', l.carried_from_version) end,
        'to_review', l.to_review,
        'review', case when l.to_review then jsonb_build_object(
          'affected_in_version', l.affected_in_version,
          'earlier_version', l.earlier_version, 'earlier_determination', l.earlier_determination) end
      ) order by l.family nulls last, l.code_order, l.control_id), '[]'::jsonb)
      from line l)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.component_control_status(uuid) from public, anon;
grant execute on function public.component_control_status(uuid) to authenticated;
comment on function public.component_control_status(uuid) is 'Where one component version stands on each control it claims through its library implementations, was judged on or an earlier version was judged on (component_standing_lines): its own latest published determination (satisfied, partially_satisfied, other_than_satisfied); else the determination of the same component in the nearest earlier published version judged on the control, carried forward (carried true, carried_from the version and its component); else not_assessed, to_review true where this version''s change, or a published one between, lists the control as affected and an earlier version was judged on it (review: the version whose change stopped it, and the earlier version and what it read). The totals count the five statuses and, among them, the determinations carried and the controls to review; assessments are the published assessments those determinations were taken from, each with the version it judged; change is what this version changes against the version before (its kinds, its summary and the controls it affects), null where it records none. A draft assessment decides nothing, and a draft version reads what it would carry. The component''s owner_party_id is its effective owner, its own (component_owners) else its set''s. Security invoker: a component the reader cannot read is refused.';

-- ---------------------------------------------------------------------------------------------
-- Upstream: what each component taken carries and what its change left to review.
--
-- Redefined from its body in 20261115140023_component_inheritance with two keys added to each
-- component's standing, carried and to_review, as component_control_status counts them. Where used
-- (component_consumers) keeps its body: the controls a version is judged on are the lines that
-- hold an assessment, so a carried determination counts there by itself.
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
  stands as materialized (
    select l.defined_component_id, l.control_id, l.status, l.component_assessment_id,
      l.carried_from_version, l.to_review
    from public.component_standing_lines(array(select distinct u.defined_component_id from used u)) l
  ),
  standing as materialized (
    select l.defined_component_id,
      count(*) as controls,
      count(*) filter (where l.status = 'satisfied') as satisfied,
      count(*) filter (where l.status = 'partially_satisfied') as partially_satisfied,
      count(*) filter (where l.status = 'other_than_satisfied') as other_than_satisfied,
      count(*) filter (where l.status = 'not_assessed') as not_assessed,
      count(*) filter (where l.carried_from_version is not null) as carried,
      count(*) filter (where l.to_review) as to_review
    from stands l
    group by l.defined_component_id
  ),
  -- The controls each version taken is judged on, by its own assessment or one carried forward.
  judged as materialized (
    select l.defined_component_id, l.control_id from stands l where l.component_assessment_id is not null
  ),
  -- Of those, the ones each element inherits from what sits on it (program_element_inheritance)
  -- and its control baseline selects.
  inherit as materialized (
    select distinct i.element_id, i.control_id
    from public.program_element_inheritance(
      v_system.program_id, array(select distinct j.control_id from judged j)) i
    where i.element_id in (select u.element_id from used u)
      and exists (select 1 from public.system_effective_baselines b
        join public.selected_controls sc on sc.profile_resolution_id = b.profile_resolution_id
        where b.tenant_id = v_tenant and b.system_id = i.element_id and sc.control_id = i.control_id)
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
          'not_assessed', coalesce(s.not_assessed, 0),
          -- Of the determinations that stand, those carried forward from an earlier version; of
          -- the controls not assessed, those a change left to review.
          'carried', coalesce(s.carried, 0), 'to_review', coalesce(s.to_review, 0)),
        -- How many controls the version taken is judged on, and how many of them its element
        -- inherits: those its control baseline selects, on an element the program did not declare
        -- modified and that holds nothing but judged library components.
        'controls_judged', (select count(*) from judged j where j.defined_component_id = u.defined_component_id),
        'controls_inherited', (select count(*) from judged j
          join inherit i on i.element_id = u.element_id and i.control_id = j.control_id
          where j.defined_component_id = u.defined_component_id),
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
        where s.controls > s.not_assessed),
      -- Each control once: those some version taken is judged on, and those some element inherits.
      'controls_judged', (select count(distinct j.control_id) from judged j),
      'controls_inherited', (select count(distinct i.control_id) from inherit i)),
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
comment on function public.system_upstream(uuid) is 'What a system takes from above: for a system created from a product, the product, the version and configuration it was created from and the newest published version; and each library component the system (an authorization boundary whole, or one element and what is inside it) is built from, with the version taken, the latest published version of its definition, how many published versions it is behind, whether the program declared the inherited element modified, its pin in the latest configuration baseline, the component''s standing as component_control_status counts it (the five statuses and, among them, the determinations carried forward from an earlier version and the controls a change left to review), its effective owner (its own, else its set''s), the program''s own open issues for the findings that stand on the version taken (the issues of accepted offers) how many offers wait on that version''s owner and how many CVEs affect the version taken (vulnerabilities_open: those a component of its standing SBOM carries in the state affected), which the answer also counts across what the system takes, each CVE once. Each component says how many controls the version taken is judged on, by its own assessment or one carried forward (controls_judged) and how many of them its element inherits (controls_inherited: those the element''s control baseline selects, where the element inherits the control as program_element_inheritance says), and the totals count each such control once. Security invoker: a system the reader cannot read is refused.';

-- ---------------------------------------------------------------------------------------------
-- The components register, with what each component's change left to review.
--
-- Redefined from its definition in 20261115090429_sboms_vulnerabilities_and_cyber_tests with the
-- same columns first. Its standing is component_standing_lines' from here on, so a version that
-- carries an earlier one's determinations counts them, and names its own newest assessment before
-- one a carried determination came from; controls_to_review, its last column, counts the controls
-- an earlier version was judged on that a change left to review.
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
-- Where each listed component stands (component_standing_lines): a determination carried forward
-- from an earlier version counts among those that stand, and a control a change left to review is
-- counted apart. The assessment named is the version's own newest, else the newest one a carried
-- determination came from.
lines as (
  select l.defined_component_id, l.status, l.component_assessment_id, l.to_review, l.carried_from_version
  from public.component_standing_lines(array(
    select c.id from head h
    join public.defined_components c
      on c.tenant_id = h.tenant_id and c.component_definition_revision_id = h.id)) l
),
standing as (
  select l.defined_component_id,
    count(*) filter (where l.component_assessment_id is not null) as determined,
    count(*) filter (where l.status = 'satisfied') as satisfied,
    count(*) filter (where l.status = 'partially_satisfied') as partially_satisfied,
    count(*) filter (where l.status = 'other_than_satisfied') as other_than_satisfied,
    count(*) filter (where l.to_review) as to_review,
    (array_agg(l.component_assessment_id
        order by (l.carried_from_version is null) desc, a.published_at desc, l.component_assessment_id desc)
      filter (where l.component_assessment_id is not null))[1] as assessment_id
  from lines l
  left join public.component_assessments a on a.id = l.component_assessment_id
  group by l.defined_component_id
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
  coalesce(ex.vulnerabilities, 0) as vulnerabilities_open,
  coalesce(st.to_review, 0) as controls_to_review
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
comment on view public.component_rows is 'The components register, one row a component of each component definition''s latest published version (else its latest): its definition by code and name, its type, version and state, its effective owner (its own, else its set''s) and business line by name, how many products (by their current version) and programs use it in any version, how many of those consumers took an older version than the latest published one (consumers_behind) or sit on an inherited element the program declared modified (consumers_modified), and this version''s standing as component_standing_lines counts it: the controls it claims, how many hold a published determination, its own or one carried forward from an earlier version, and how many of those are satisfied, with the published assessment they were taken from (the version''s own newest, else the newest one a carried determination came from), how many offers wait on its owner for any of its versions (offers_open), and how many CVEs affect this version (vulnerabilities_open: those a component of its standing SBOM carries in the state affected), and how many controls an earlier version was judged on that a change left to review in this one (controls_to_review).';

-- ---------------------------------------------------------------------------------------------
-- Take version: the review, and the command.
-- ---------------------------------------------------------------------------------------------
-- Why a system component cannot take a newer version, in the reader's words: the review says it
-- before the reader tries, and the command refuses in the same words.
create or replace function public.component_version_refusal(p_code text) returns text
language sql immutable set search_path = '' as $$
  select case p_code
    when 'not_library' then 'This component is built from no library component, so it has no version to take'
    when 'latest' then 'This component is built from the latest published version'
    when 'assignment' then 'This component came through a library assignment. Take the newer version from the program''s Library tab, which moves its claims with it.'
    when 'product' then 'This element is inherited from a product. A variant takes a newer component version through its product.'
  end
$$;
revoke all on function public.component_version_refusal(text) from public, anon;
grant execute on function public.component_version_refusal(text) to authenticated;
comment on function public.component_version_refusal(text) is 'Internal: why a system component cannot take a newer version of the library component it is built from, in the reader''s words, by its code (not_library, latest, assignment, product). component_version_review answers it and take_component_version refuses with it.';

-- What Take version shows before it writes, in one request: the version the system component is
-- built from and the latest published version of the same component, what each published version
-- after the one taken changes, the controls those changes affect with where the program stands on
-- each and whether the element inherits it today, how many determinations stand on the newer
-- version carried forward, the CVEs the newer version fixes with the program's issue for each,
-- and why the version cannot be taken where it cannot.
create or replace function public.component_version_review(p_system_component_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_sc public.system_components;
  v_tenant uuid;
  v_system public.systems;
  v_element public.systems;
  v_program public.programs;
  v_taken public.defined_components;
  v_taken_revision public.component_definition_revisions;
  v_definition public.component_definitions;
  v_latest public.defined_components;
  v_latest_revision public.component_definition_revisions;
  v_head jsonb;
  v_code text;
  v_affected uuid[];
  v_status jsonb := '{}';
  v_inherited uuid[] := '{}';
begin
  select * into v_sc from public.system_components where id = p_system_component_id;
  if auth.uid() is null or v_sc.id is null then
    raise exception 'Component access is required' using errcode = '42501';
  end if;
  v_tenant := v_sc.tenant_id;
  select * into v_system from public.systems where tenant_id = v_tenant and id = v_sc.system_id;
  -- The element the component sits on: the one it names, else the one a single inventory
  -- relationship gives it (system_component_element_links), else its system.
  select e.* into v_element from public.systems e
    where e.tenant_id = v_tenant and e.id = coalesce(
      (select k.system_element_id from public.system_component_element_links k
        where k.tenant_id = v_tenant and k.id = v_sc.id), v_sc.system_id);
  select * into v_program from public.programs where tenant_id = v_tenant and id = v_system.program_id;
  v_head := jsonb_build_object(
    'system_component_id', v_sc.id,
    'system_component', jsonb_build_object(
      'id', v_sc.id, 'code', v_sc.code, 'name', v_sc.name, 'version', v_sc.version, 'revision', v_sc.revision,
      'assignment_id', v_sc.assignment_id, 'applied_at', v_sc.applied_at),
    'program', jsonb_build_object('id', v_program.id, 'code', v_program.code, 'name', v_program.name),
    'system', jsonb_build_object('id', v_system.id, 'code', v_system.code, 'name', v_system.name),
    'element', jsonb_build_object(
      'id', v_element.id, 'code', v_element.code, 'name', v_element.name,
      'product_element_id', v_element.product_element_id,
      'modified', v_element.product_change_kinds is not null));
  if v_sc.defined_component_id is null then
    return v_head || jsonb_build_object(
      'component', null, 'taken', null, 'latest', null, 'behind', 0, 'newer_drafts', 0,
      'versions', '[]'::jsonb, 'affected_controls', '[]'::jsonb, 'determinations', null,
      'vulnerabilities_fixed', '[]'::jsonb, 'vulnerabilities_open', null,
      'blocked', jsonb_build_object('code', 'not_library', 'message', public.component_version_refusal('not_library')));
  end if;
  select * into v_taken from public.defined_components where tenant_id = v_tenant and id = v_sc.defined_component_id;
  select * into v_taken_revision from public.component_definition_revisions
    where tenant_id = v_tenant and id = v_taken.component_definition_revision_id;
  select * into v_definition from public.component_definitions
    where tenant_id = v_tenant and id = v_taken_revision.component_definition_id;
  -- The latest published version of the same component: the component of its name in the newest
  -- published version of its set that holds one.
  select c.* into v_latest
    from public.component_lineage(v_taken.id) l
    join public.defined_components c on c.tenant_id = v_tenant and c.id = l.defined_component_id
    where l.state = 'published' and l.version_number > v_taken_revision.version_number
    order by l.version_number desc, l.defined_component_id limit 1;
  if v_latest.id is not null then
    select * into v_latest_revision from public.component_definition_revisions
      where tenant_id = v_tenant and id = v_latest.component_definition_revision_id;
  end if;
  v_code := case
    when v_latest.id is null then 'latest'
    when v_sc.assignment_id is not null then 'assignment'
    when v_element.product_element_id is not null then 'product' end;
  -- The controls the changes of the versions after the one taken affect.
  select array_agg(distinct x.control_id) into v_affected
    from public.component_lineage(v_taken.id) l
    join public.component_version_changes ch on ch.tenant_id = v_tenant and ch.defined_component_id = l.defined_component_id
    join public.component_version_change_controls x on x.tenant_id = v_tenant and x.component_version_change_id = ch.id
    where l.state = 'published' and l.version_number > v_taken_revision.version_number;
  if coalesce(cardinality(v_affected), 0) > 0 then
    -- Where the program stands on each, as its control status counts it, and which of them the
    -- element inherits today.
    select coalesce(jsonb_object_agg(s.id, jsonb_build_object('status', s.status, 'determined_by', s.determined_by)), '{}'::jsonb)
      into v_status
      from public.program_control_standing_lines(v_program.id) s where s.id = any(v_affected);
    select coalesce(array_agg(distinct i.control_id), '{}') into v_inherited
      from public.program_element_inheritance(v_program.id, v_affected) i where i.element_id = v_element.id;
  end if;
  with
  stand as materialized (
    select l.defined_component_id, l.control_id, l.status, l.component_assessment_id,
      l.carried_from_version, l.to_review
    from public.component_standing_lines(array_remove(array[v_taken.id, v_latest.id], null)) l
  ),
  -- The published versions after the one taken that hold the component, the oldest first.
  newer as materialized (
    select l.defined_component_id, l.component_definition_revision_id as revision_id,
      l.version_number as version, r.published_at
    from public.component_lineage(v_taken.id) l
    join public.component_definition_revisions r
      on r.tenant_id = v_tenant and r.id = l.component_definition_revision_id
    where l.state = 'published' and l.version_number > v_taken_revision.version_number
  ),
  listed as materialized (
    select n.version, x.control_id
    from newer n
    join public.component_version_changes ch on ch.tenant_id = v_tenant and ch.defined_component_id = n.defined_component_id
    join public.component_version_change_controls x on x.tenant_id = v_tenant and x.component_version_change_id = ch.id
  ),
  open_taken as materialized (
    select o.vulnerability_id from public.component_open_vulnerabilities(array[v_taken.id]) o
  ),
  open_latest as materialized (
    select o.vulnerability_id from public.component_open_vulnerabilities(array[v_latest.id]) o
    where v_latest.id is not null
  ),
  latest_sbom as materialized (
    select s.sbom_id from public.standing_sboms() s where s.defined_component_id = v_latest.id
  )
  select v_head || jsonb_build_object(
    'component', jsonb_build_object(
      'name', v_taken.name, 'component_type', v_taken.component_type,
      'definition_id', v_definition.id, 'definition_code', v_definition.code, 'definition_name', v_definition.name,
      'owner_party_id', public.component_owner_party(v_taken.id)),
    'taken', jsonb_build_object(
      'defined_component_id', v_taken.id, 'revision_id', v_taken_revision.id,
      'version', v_taken_revision.version_number, 'state', v_taken_revision.state,
      'published_at', v_taken_revision.published_at),
    'latest', case when v_latest.id is null then null else jsonb_build_object(
      'defined_component_id', v_latest.id, 'revision_id', v_latest_revision.id,
      'version', v_latest_revision.version_number, 'published_at', v_latest_revision.published_at) end,
    'behind', (select count(*) from newer),
    -- Newer versions of the set still being drafted: nothing to take yet.
    'newer_drafts', (select count(*) from public.component_lineage(v_taken.id) l
      where l.state = 'draft' and l.version_number > v_taken_revision.version_number),
    'versions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'revision_id', n.revision_id, 'version', n.version, 'published_at', n.published_at,
        'defined_component_id', n.defined_component_id,
        'change', (select jsonb_build_object(
            'id', ch.id, 'kinds', to_jsonb(ch.change_kinds), 'summary', ch.summary,
            'controls', (select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'code', k.code, 'title', k.title)
                order by public.natural_sort_key(k.code) collate "C", k.id), '[]'::jsonb)
              from public.component_version_change_controls x
              join public.controls k on k.id = x.control_id
              where x.tenant_id = v_tenant and x.component_version_change_id = ch.id))
          from public.component_version_changes ch
          where ch.tenant_id = v_tenant and ch.defined_component_id = n.defined_component_id)
      ) order by n.version, n.defined_component_id), '[]'::jsonb)
      from newer n),
    'affected_controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', k.id, 'code', k.code, 'title', k.title,
        -- The versions whose change lists it.
        'versions', a.versions,
        -- What the version taken and the latest read on it; to review where the latest holds
        -- nothing of its own and an earlier version was judged on it.
        'taken_status', (select s.status from stand s
          where s.defined_component_id = v_taken.id and s.control_id = k.id),
        'latest_status', (select s.status from stand s
          where s.defined_component_id = v_latest.id and s.control_id = k.id),
        'to_review', coalesce((select s.to_review from stand s
          where s.defined_component_id = v_latest.id and s.control_id = k.id), false),
        -- The program's control status on it; null for a control outside its control baseline.
        'control_status', v_status->(k.id::text)->>'status',
        'determined_by', v_status->(k.id::text)->>'determined_by',
        'inherited', k.id = any(v_inherited)
      ) order by public.natural_sort_key(k.code) collate "C", k.id), '[]'::jsonb)
      from (select l.control_id, jsonb_agg(l.version order by l.version) as versions
        from listed l group by l.control_id) a
      join public.controls k on k.id = a.control_id),
    -- The determinations that stand on the version taken, and on the latest: carried forward from
    -- an earlier version, its own, and the controls left to review.
    'determinations', jsonb_build_object(
      'taken', (select count(*) from stand s
        where s.defined_component_id = v_taken.id and s.component_assessment_id is not null),
      'carried', (select count(*) from stand s
        where s.defined_component_id = v_latest.id and s.carried_from_version is not null),
      'judged', (select count(*) from stand s
        where s.defined_component_id = v_latest.id and s.component_assessment_id is not null
          and s.carried_from_version is null),
      'to_review', (select count(*) from stand s
        where s.defined_component_id = v_latest.id and s.to_review)),
    -- The CVEs the latest version fixes: those that affect the version taken, through its standing
    -- SBOM, and not the latest, whose standing SBOM says so. Each with the program's issue for it,
    -- its open one first.
    'vulnerabilities_fixed', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', v.id, 'cve_id', v.cve_id, 'title', v.title, 'severity', v.severity, 'fixed_in', v.fixed_in,
        'latest_state', (select x.state
          from latest_sbom ls
          join public.sbom_components c on c.tenant_id = v_tenant and c.sbom_id = ls.sbom_id
          join public.sbom_component_vulnerabilities x
            on x.tenant_id = v_tenant and x.sbom_component_id = c.id and x.vulnerability_id = v.id
          order by c.name, c.id limit 1),
        'issue', (select jsonb_build_object('id', i.id, 'title', i.title, 'status', i.status, 'severity', i.severity)
          from public.issue_vulnerabilities iv
          join public.operational_issues i on i.tenant_id = iv.tenant_id and i.id = iv.issue_id
          where iv.tenant_id = v_tenant and iv.vulnerability_id = v.id and i.program_id = v_program.id
          order by (i.status not in ('resolved', 'closed')) desc, i.opened_at desc nulls last, i.id limit 1)
      ) order by v.cve_id, v.id), '[]'::jsonb)
      from open_taken o
      join public.vulnerabilities v on v.tenant_id = v_tenant and v.id = o.vulnerability_id
      where exists (select 1 from latest_sbom)
        and not exists (select 1 from open_latest n where n.vulnerability_id = o.vulnerability_id)),
    'vulnerabilities_open', jsonb_build_object(
      'taken', (select count(*) from open_taken),
      'latest', case when exists (select 1 from latest_sbom) then (select count(*) from open_latest) end),
    'blocked', case when v_code is not null then jsonb_build_object(
      'code', v_code, 'message', public.component_version_refusal(v_code)) end
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.component_version_review(uuid) from public, anon;
grant execute on function public.component_version_review(uuid) to authenticated;
comment on function public.component_version_review(uuid) is 'What Take version shows before it writes, for one system component: the component with its program, system and element, at the revision the command is sent with; the version it is built from (taken) and the latest published version of the same component, by its name (latest, null where none is newer), how many published versions it is behind and how many newer ones are still drafts; each published version after the one taken with what it changes (its kinds, its summary and the controls it affects); those controls, each with the versions that list it, what the version taken and the latest read on it (to_review where the latest holds nothing of its own and an earlier version was judged on it), the program''s control status on it (null outside its control baseline) and whether the element inherits it today; how many determinations stand on the version taken and on the latest (carried forward, its own, and the controls to review); the CVEs the latest fixes, those that affect the version taken through its standing SBOM and not the latest, whose standing SBOM says so, each with the state the latest records and the program''s issue for it; and blocked, why the version cannot be taken, by code and in words (the component is built from no library component, is already on the latest published version, came through a library assignment, or sits on an element inherited from a product), null where it can. Security invoker: a component the reader cannot read is refused.';

-- Take a newer version of the library component a system component is built from, at the revision
-- the reader saw. It moves the one pin and records who and when; what the program inherits
-- follows from the reads. Each request is answered once: the same request sent again returns its
-- first answer and writes nothing, and its id sent with another choice is refused.
create or replace function public.take_component_version(
  p_tenant_id uuid,
  p_system_component_id uuid,
  p_defined_component_id uuid,
  p_expected_revision bigint,
  p_request_id uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_receipt public.component_version_requests;
  v_request jsonb;
  v_sc public.system_components;
  v_system public.systems;
  v_element public.systems;
  v_taken public.defined_components;
  v_taken_revision public.component_definition_revisions;
  v_target public.defined_components;
  v_target_revision public.component_definition_revisions;
  v_definition public.component_definitions;
  v_party uuid;
  v_now timestamptz := now();
  v_carried integer; v_judged integer; v_review integer; v_codes text;
  v_event uuid;
  v_result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can take a component version' using errcode = '42501';
  end if;
  if p_system_component_id is null or p_defined_component_id is null or p_expected_revision is null
    or p_request_id is null then
    raise exception 'Choose the component and the version to take, at the revision you read' using errcode = '22023';
  end if;
  v_request := jsonb_build_object('systemComponentId', p_system_component_id,
    'definedComponentId', p_defined_component_id, 'expectedRevision', p_expected_revision);
  perform pg_advisory_xact_lock(hashtextextended('component-version/' || p_request_id::text, 0));
  select * into v_receipt from public.component_version_requests r where r.id = p_request_id;
  if found then
    if v_receipt.tenant_id <> p_tenant_id or v_receipt.request <> v_request then
      raise exception 'This request already answered another choice. Review the version again.' using errcode = 'PT409';
    end if;
    return v_receipt.result;
  end if;
  select * into v_sc from public.system_components c
    where c.tenant_id = p_tenant_id and c.id = p_system_component_id for update;
  if v_sc.id is null then
    raise exception 'This component is no longer available; reload and try again' using errcode = 'PT404';
  end if;
  if v_sc.revision <> p_expected_revision then
    raise exception 'This component changed since you reviewed the version. Review it again.' using errcode = 'PT409';
  end if;
  if v_sc.defined_component_id is null then
    raise exception '%', public.component_version_refusal('not_library') using errcode = '23514';
  end if;
  -- A component that came through a library assignment moves with its claims, through the
  -- Library tab's own Take version (update_library_assignment).
  if v_sc.assignment_id is not null then
    raise exception '%', public.component_version_refusal('assignment') using errcode = '23514';
  end if;
  select * into v_system from public.systems where tenant_id = p_tenant_id and id = v_sc.system_id;
  select e.* into v_element from public.systems e
    where e.tenant_id = p_tenant_id and e.id = coalesce(
      (select k.system_element_id from public.system_component_element_links k
        where k.tenant_id = p_tenant_id and k.id = v_sc.id), v_sc.system_id);
  -- A variant takes versions through its product.
  if v_element.product_element_id is not null then
    raise exception '%', public.component_version_refusal('product') using errcode = '23514';
  end if;
  select * into v_taken from public.defined_components
    where tenant_id = p_tenant_id and id = v_sc.defined_component_id;
  select * into v_taken_revision from public.component_definition_revisions
    where tenant_id = p_tenant_id and id = v_taken.component_definition_revision_id;
  select * into v_target from public.defined_components
    where tenant_id = p_tenant_id and id = p_defined_component_id;
  select * into v_target_revision from public.component_definition_revisions
    where tenant_id = p_tenant_id and id = v_target.component_definition_revision_id;
  -- The same component is the one of its name in a version of the same set.
  if v_target.id is null or v_target_revision.component_definition_id <> v_taken_revision.component_definition_id
    or v_target.name <> v_taken.name then
    raise exception 'Choose a version of the same component' using errcode = '23514';
  end if;
  if v_target_revision.state <> 'published' then
    raise exception 'Only a published version can be taken' using errcode = '23514';
  end if;
  if v_target_revision.version_number <= v_taken_revision.version_number then
    raise exception 'Choose a newer version than the one in use' using errcode = '23514';
  end if;
  select * into v_definition from public.component_definitions
    where tenant_id = p_tenant_id and id = v_taken_revision.component_definition_id;
  select p.id into v_party from public.parties p
    where p.tenant_id = p_tenant_id and p.auth_user_id = auth.uid();

  update public.system_components
    set defined_component_id = v_target.id, version = v_target_revision.version_number::text,
      applied_at = v_now, applied_by = auth.uid(), revision = revision + 1
    where tenant_id = p_tenant_id and id = v_sc.id;

  -- What the version taken stands on, for the event and the answer: what carried forward, what it
  -- was judged on itself, and the controls its changes left to review.
  select count(*) filter (where l.carried_from_version is not null),
      count(*) filter (where l.component_assessment_id is not null and l.carried_from_version is null),
      count(*) filter (where l.to_review),
      string_agg(k.code, ', ' order by public.natural_sort_key(k.code) collate "C", k.id) filter (where l.to_review)
    into v_carried, v_judged, v_review, v_codes
    from public.component_standing_lines(array[v_target.id]) l
    join public.controls k on k.id = l.control_id;
  -- One activity event of the program, in the feeds' shape: the deed after the person, then what
  -- was said.
  insert into public.activity_events (tenant_id, program_id, actor_party_id, event_type, description, occurred_at)
    values (p_tenant_id, v_system.program_id, v_party, 'updated',
      format(E'took version %s of %s for %s\n%s, version %s before. %s carried forward%s.',
        v_target_revision.version_number, regexp_replace(btrim(v_target.name), '\s+', ' ', 'g'), v_sc.code,
        v_definition.name, v_taken_revision.version_number,
        case when v_carried = 1 then '1 determination' else v_carried::text || ' determinations' end,
        case when v_review = 0 then ''
          else format('; %s to review (%s)',
            case when v_review = 1 then '1 control' else v_review::text || ' controls' end, v_codes) end),
      v_now)
    returning id into v_event;

  v_result := jsonb_build_object(
    'systemComponentId', v_sc.id,
    'programId', v_system.program_id,
    'definedComponentId', v_target.id,
    'previousDefinedComponentId', v_taken.id,
    'version', v_target_revision.version_number,
    'previousVersion', v_taken_revision.version_number,
    'revision', v_sc.revision + 1,
    'appliedAt', v_now,
    'carried', v_carried, 'judged', v_judged, 'toReview', v_review,
    'activityEventId', v_event);
  insert into public.component_version_requests (id, tenant_id, system_component_id, request, result, created_by)
    values (p_request_id, p_tenant_id, v_sc.id, v_request, v_result, auth.uid());
  return v_result;
end;
$$;
revoke all on function public.take_component_version(uuid, uuid, uuid, bigint, uuid) from public, anon;
grant execute on function public.take_component_version(uuid, uuid, uuid, bigint, uuid) to authenticated;
comment on function public.take_component_version(uuid, uuid, uuid, bigint, uuid) is 'Take a newer version of the library component a system component is built from, at the revision the reader saw, in one transaction: the system component is built from the component of the same name in the published version chosen, its version text says that version, and who took it and when are recorded (applied_by, applied_at), with one activity event of the program that says the version taken, the one before and how much carried forward. Nothing else is written: what the program inherits follows from the reads, so its element keeps inheriting what the newer version carried forward or was judged on and stops inheriting a control its change left to review. It answers the versions, the component''s next revision and how many determinations carried, are the version''s own and are to review. Refused: a target that is not the same component, is not published or is not newer; a component built from no library component; one that came through a library assignment, which the Library tab''s Take version moves with its claims (update_library_assignment); one on an element inherited from a product, since a variant takes versions through its product; a component changed since it was read or no longer in the workspace; and a caller who may not write to the workspace. The request id is chosen once per review: the same request sent again returns its first answer, and its id sent with another choice is refused.';
