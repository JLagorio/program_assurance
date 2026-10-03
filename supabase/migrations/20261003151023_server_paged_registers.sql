-- The registers whose collections can hold thousands of rows read one page at a time: the server
-- pages, sorts, filters and searches, and counts the whole result. Each register whose shown
-- columns are not its table's own reads a view that carries them (a latest revision's fields, a
-- related record's name, an allocation state), so a sort or a filter on a derived column runs on
-- the server too. The views run as the reader (security_invoker), so row-level security on every
-- table they read still decides what the reader sees. A status's rank column orders its values as
-- the product's vocabulary does (src/lib/status.ts), where that order is not the values' own.

-- The lookups the views make for each row, by the column they look up through.
create index requirement_decompositions_child_idx
  on public.requirement_decompositions (tenant_id, child_requirement_revision_id);
create index evidence_reviews_version_idx
  on public.evidence_reviews (tenant_id, evidence_version_id);

-- Whether a control part is a statement a requirement can map to: a statement or one of its items
-- with prose, under a statement of the same control all the way up. As the Requirements register
-- has checked it on screen (isControlStatement in src/lib/requirement-control-mappings.ts).
create function public.is_control_statement(part uuid) returns boolean
language sql stable set search_path = '' as $$
  with recursive chain (id, parent_part_id, control_id, name, depth) as (
    select p.id, p.parent_part_id, p.control_id, p.name, 0
    from public.control_parts p
    where p.id = part and p.control_id is not null and p.name in ('statement', 'item')
      and coalesce(p.prose, '') ~ '[^[:space:]]'
    union all
    select q.id, q.parent_part_id, q.control_id, q.name, c.depth + 1
    from chain c join public.control_parts q on q.id = c.parent_part_id
    where c.depth < 16
  )
  select coalesce(
    bool_and(c.control_id = f.control_id and c.name in ('statement', 'item'))
      and bool_or(c.name = 'statement')
      and bool_or(c.parent_part_id is null),
    false)
  from chain c cross join (select control_id from chain where depth = 0) f
$$;
revoke all on function public.is_control_statement(uuid) from public, anon;
grant execute on function public.is_control_statement(uuid) to authenticated;
comment on function public.is_control_statement(uuid) is 'Whether a control part is a statement, or an item of one, with prose, under statements of the same control up to the top.';

-- One row per engineering requirement, for the program's Requirements tab: its latest revision's
-- fields, its owner's name, where it is allocated and which controls it is linked to (each as a
-- list and in words), its allocation and control-mapping states, and where it sits in the
-- requirement tree. The tree nests a requirement under its one recorded parent; one with several
-- parents, or in a cycle, stands on its own (unstructured). tree_order lists the codes from the
-- top of its tree down, in reading order, so ordering by it reads every tree top-down.
create view public.program_requirement_rows with (security_invoker = true) as
-- Each requirement's recorded parents, by identity: a decomposition links two revisions, and
-- names the requirements they are revisions of. Read once, as one map, for the walks below.
with parents as materialized (
  select pg_catalog.jsonb_object_agg(child::text, pg_catalog.jsonb_build_array(parent, parents)) as map
  from (
    select cr.engineering_requirement_id as child,
      (pg_catalog.array_agg(distinct pr.engineering_requirement_id))[1] as parent,
      count(distinct pr.engineering_requirement_id) as parents
    from public.requirement_decompositions d
    join public.requirement_revisions cr on cr.id = d.child_requirement_revision_id
    join public.requirement_revisions pr on pr.id = d.parent_requirement_revision_id
    group by cr.engineering_requirement_id
  ) links
)
select r.id, r.tenant_id, r.program_id, r.code,
  public.natural_sort_key(r.code) collate "C" as code_order,
  latest.id as revision_id, latest.version_number, latest.title, latest.statement,
  latest.requirement_type, latest.owner_party_id, owner.name as owner_name,
  case when latest.id is null then 'Details not recorded'
    when allocated.names is not null then 'Allocated'
    else 'Unallocated' end as allocation,
  case when latest.id is null then 'Details not recorded'
    when linked.needs_review then 'Needs review'
    when linked.labels is not null then 'Control linked'
    else 'No control linked' end as control_mapping,
  coalesce(allocated.list, '[]'::jsonb) as allocations,
  allocated.names as allocated_to,
  coalesce(linked.list, '[]'::jsonb) as control_sources,
  linked.labels as linked_controls,
  tree.parent_id, coalesce(tree.ancestors, '{}'::uuid[]) as ancestors,
  coalesce(pg_catalog.cardinality(tree.ancestors), 0) as depth,
  tree.tree_order, tree.unstructured
from public.engineering_requirements r
cross join parents
left join lateral (
  select v.id, v.version_number, v.title, v.statement, v.requirement_type, v.owner_party_id
  from public.requirement_revisions v
  where v.tenant_id = r.tenant_id and v.engineering_requirement_id = r.id
  order by v.version_number desc limit 1
) latest on true
left join public.parties owner on owner.id = latest.owner_party_id
left join lateral (
  select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', t.id, 'name', t.name, 'kind', t.kind, 'system_id', t.system_id, 'rationale', t.rationale
    ) order by t.name, t.id) as list,
    pg_catalog.string_agg(t.name, ', ' order by t.name, t.id) as names
  from (
    select a.id, a.rationale, s.id as system_id,
      case when s.id is not null then s.code || ' · ' || s.name
        when pc.id is not null then pc.code || ' · ' || pc.name
        when sp.id is not null then sp.code || ' · ' || sp.name
        else 'Target unavailable' end as name,
      case when a.system_id is not null then 'System element'
        when a.provider_capability_id is not null then 'Provider capability'
        else 'Security process' end as kind
    from public.requirement_allocations a
    left join public.systems s on s.id = a.system_id
    left join public.provider_capabilities pc on pc.id = a.provider_capability_id
    left join public.security_processes sp on sp.id = a.security_process_id
    where a.tenant_id = r.tenant_id and a.requirement_revision_id = latest.id
  ) t
) allocated on true
left join lateral (
  select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', t.id, 'label', t.label, 'relationship_type', t.relationship_type,
      'needs_review', t.needs_review, 'part_name', t.part_name
    ) order by t.label, t.id) as list,
    pg_catalog.string_agg(t.label, ', ' order by t.label, t.id) as labels,
    bool_or(t.needs_review) as needs_review
  from (
    select l.id, l.relationship_type, p.name as part_name,
      coalesce(c.code || ' · ' || c.title, 'Control unavailable') as label,
      l.control_part_id is not null and not public.is_control_statement(l.control_part_id)
        as needs_review
    from public.requirement_control_links l
    left join public.controls c on c.id = l.control_id
    left join public.control_parts p on p.id = l.control_part_id
    where l.tenant_id = r.tenant_id and l.requirement_revision_id = latest.id
  ) t
) linked on true
left join lateral (
  -- Up the recorded parents while each requirement has exactly one; a parent already on the way
  -- up closes a cycle, and the walk ends at the first requirement of the cycle.
  with recursive up (node, path, keys, closed) as (
    select r.id, array[r.id], array[public.natural_sort_key(r.code) collate "C"], false
    union all
    select step.parent, up.path || step.parent,
      up.keys || (select public.natural_sort_key(e.code) collate "C"
        from public.engineering_requirements e where e.id = step.parent),
      step.parent = any(up.path)
    from up
    cross join lateral (
      select (parents.map -> up.node::text ->> 0)::uuid as parent,
        (parents.map -> up.node::text ->> 1)::integer as count
    ) step
    where not up.closed and step.count = 1
  ),
  walk as (
    select path, keys, closed,
      case when closed then pg_catalog.array_position(path, path[pg_catalog.cardinality(path)])
        else pg_catalog.cardinality(path) end as length
    from up order by pg_catalog.cardinality(path) desc limit 1
  )
  -- A requirement with several parents, or in a cycle, has none here: it is listed on its own.
  select case when walk.length > 1 then walk.path[2] end as parent_id,
    (select pg_catalog.array_agg(u.node order by u.at desc)
      from pg_catalog.unnest(walk.path[2:walk.length]) with ordinality u(node, at)) as ancestors,
    (select pg_catalog.array_agg(u.key order by u.at desc)
      from pg_catalog.unnest(walk.keys[1:walk.length]) with ordinality u(key, at)) as tree_order,
    (walk.closed and walk.length = 1)
      or coalesce((parents.map -> r.id::text ->> 1)::integer, 0) > 1 as unstructured
  from walk
) tree on true;

grant select on public.program_requirement_rows to authenticated;
revoke all on public.program_requirement_rows from public, anon;
comment on view public.program_requirement_rows is 'The program Requirements register, one row per engineering requirement: its latest revision, owner, allocations, linked controls, their states, and its place in the requirement tree (parent_id, ancestors from the top, tree_order).';

-- One row per risk, for the risk register: its program's and owner's names and its latest
-- assessment's severity, likelihood and impact, each with its rank.
create view public.risk_rows with (security_invoker = true) as
select k.id, k.tenant_id, k.title, k.program_id, k.scope_id, k.owner_party_id, k.status,
  k.revision, k.created_at, k.updated_at, k.created_by, k.updated_by,
  program.name as program_name, owner.name as owner_name,
  latest.id as latest_revision_id, latest.severity, latest.likelihood, latest.impact,
  pg_catalog.array_position('{open,investigating,responding,accepted,closed}'::text[], k.status)
    as status_rank,
  pg_catalog.array_position('{low,moderate,high,critical}'::text[], latest.severity)
    as severity_rank,
  pg_catalog.array_position('{very_low,low,moderate,high,very_high}'::text[], latest.likelihood)
    as likelihood_rank,
  pg_catalog.array_position('{very_low,low,moderate,high,very_high}'::text[], latest.impact)
    as impact_rank
from public.risks k
left join public.programs program on program.id = k.program_id
left join public.parties owner on owner.id = k.owner_party_id
left join lateral (
  select v.id, v.severity, v.likelihood, v.impact
  from public.risk_revisions v
  where v.tenant_id = k.tenant_id and v.risk_id = k.id
  order by v.version_number desc limit 1
) latest on true;
grant select on public.risk_rows to authenticated;
revoke all on public.risk_rows from public, anon;
comment on view public.risk_rows is 'The risk register, one row per risk: its program and owner by name, and its latest assessment''s severity, likelihood and impact, with the rank each sorts by.';

-- One row per operational issue: its program's and owner's names, and its status's and
-- severity's ranks.
create view public.operational_issue_rows with (security_invoker = true) as
select i.id, i.tenant_id, i.title, i.description, i.program_id, i.scope_id, i.owner_party_id,
  i.status, i.severity, i.opened_at, i.closed_at, i.closure_rationale, i.revision, i.created_at,
  i.updated_at, i.created_by, i.updated_by,
  program.name as program_name, owner.name as owner_name,
  pg_catalog.array_position('{open,triaged,in_progress,resolved,closed}'::text[], i.status)
    as status_rank,
  pg_catalog.array_position('{low,moderate,high,critical}'::text[], i.severity) as severity_rank
from public.operational_issues i
left join public.programs program on program.id = i.program_id
left join public.parties owner on owner.id = i.owner_party_id;
grant select on public.operational_issue_rows to authenticated;
revoke all on public.operational_issue_rows from public, anon;
comment on view public.operational_issue_rows is 'The operational issues register, one row per issue: its program and owner by name, with the rank its status and its severity sort by.';

-- One row per assessment finding: its assessor's name, whether a risk assessment records it, and
-- its determination's rank.
create view public.assessment_finding_rows with (security_invoker = true) as
select f.id, f.tenant_id, f.assessment_results_revision_id, f.result_set_id,
  f.target_control_part_id, f.title, f.description, f.determination, f.assessor_party_id,
  f.determined_at, f.revision, f.created_at, f.updated_at, f.created_by, f.updated_by,
  assessor.name as assessor_name,
  exists (
    select 1 from public.finding_risks fr where fr.tenant_id = f.tenant_id and fr.finding_id = f.id
  ) as linked_to_risk,
  pg_catalog.array_position(
    '{satisfied,partially_satisfied,other_than_satisfied,not_assessed}'::text[], f.determination
  ) as determination_rank
from public.assessment_findings f
left join public.parties assessor on assessor.id = f.assessor_party_id;
grant select on public.assessment_finding_rows to authenticated;
revoke all on public.assessment_finding_rows from public, anon;
comment on view public.assessment_finding_rows is 'The assessment findings register, one row per finding: its assessor by name, whether a risk assessment records it (linked_to_risk), and the rank its determination sorts by.';

-- One row per evidence artifact: its program's and owner's names, its latest version's number and
-- collection time, and that version's latest review decision (not_reviewed where it has none).
create view public.evidence_artifact_rows with (security_invoker = true) as
select e.id, e.tenant_id, e.title, e.description, e.artifact_kind, e.program_id, e.scope_id,
  e.owner_party_id, e.source_uri, e.retention_until, e.revision, e.created_at, e.updated_at,
  e.created_by, e.updated_by,
  program.name as program_name, owner.name as owner_name,
  latest.id as latest_version_id, latest.version_number as latest_version_number,
  latest.collected_at,
  coalesce(review.decision, 'not_reviewed') as review,
  pg_catalog.array_position(
    '{not_reviewed,pending,accepted,needs_revision,rejected}'::text[],
    coalesce(review.decision, 'not_reviewed')
  ) as review_rank
from public.evidence_artifacts e
left join public.programs program on program.id = e.program_id
left join public.parties owner on owner.id = e.owner_party_id
left join lateral (
  select v.id, v.version_number, v.collected_at
  from public.evidence_versions v
  where v.tenant_id = e.tenant_id and v.artifact_id = e.id
  order by v.version_number desc limit 1
) latest on true
left join lateral (
  select r.decision
  from public.evidence_reviews r
  where r.tenant_id = e.tenant_id and r.evidence_version_id = latest.id
  order by coalesce(r.reviewed_at, r.created_at) desc, r.id desc limit 1
) review on true;
grant select on public.evidence_artifact_rows to authenticated;
revoke all on public.evidence_artifact_rows from public, anon;
comment on view public.evidence_artifact_rows is 'The evidence register, one row per artifact: its program and owner by name, its latest version, and that version''s latest review decision (not_reviewed without one), with the rank it sorts by.';

-- One row per task, for My work and the program and workstream task tables: its program's name,
-- the people assigned by name in the order they were assigned, and whether the reader is one of
-- them (assignment, in the words the register's Assignment column and filter use).
create view public.task_rows with (security_invoker = true) as
select t.id, t.tenant_id, t.program_id, t.workstream_id, t.title, t.description, t.status,
  t.priority, t.due_on, t.completed_at, t.revision, t.created_at, t.updated_at, t.created_by,
  t.updated_by,
  program.name as program_name,
  coalesce(assigned.names, '{}'::text[]) as assignees,
  coalesce(assigned.mine, false) as assigned_to_me,
  case when assigned.mine then 'Assigned to you' else 'Other tasks' end as assignment,
  pg_catalog.array_position('{open,in_progress,waiting,blocked,done,cancelled}'::text[], t.status)
    as status_rank,
  pg_catalog.array_position('{low,normal,high,urgent}'::text[], t.priority) as priority_rank
from public.tasks t
left join public.programs program on program.id = t.program_id
left join lateral (
  select pg_catalog.array_agg(p.name order by a.created_at, a.id) filter (where p.name is not null)
      as names,
    bool_or(p.auth_user_id = (select auth.uid())) as mine
  from public.task_assignments a
  left join public.parties p on p.id = a.party_id
  where a.tenant_id = t.tenant_id and a.task_id = t.id
) assigned on true;
grant select on public.task_rows to authenticated;
revoke all on public.task_rows from public, anon;
comment on view public.task_rows is 'The task registers, one row per task: its program by name, the people assigned by name, whether the reader is assigned (assigned_to_me, and assignment in words), with the rank its status and priority sort by.';
