-- Pickers read less. The requirement Evidence picker reads the evidence a requirement can link a
-- page at a time from a view (evidence_version_rows), where it read every version of the program
-- and of the workspace as it opened; and the system tree counts each element of a program and
-- what is inside it on the server (program_system_counts), where the system record read every
-- allocation of the program and every control its baselines select to count them.

-- One row per evidence version, with what a list of versions draws of its artifact: its title,
-- kind, program and owner by name. `context` says whether the artifact belongs to a program or to
-- the workspace alone, and `source_recorded` whether the version records where its content is (a
-- file or an external reference), which a draft needs before it is published.
create view public.evidence_version_rows with (security_invoker = true) as
select v.id, v.tenant_id, v.artifact_id, v.version_number, v.state, v.collected_at,
  (nullif(v.external_uri, '') is not null or v.storage_object_id is not null) as source_recorded,
  a.title, a.artifact_kind, a.program_id, a.owner_party_id,
  case when a.program_id is null then 'workspace' else 'program' end as context,
  owner.name as owner_name
from public.evidence_versions v
join public.evidence_artifacts a on a.tenant_id = v.tenant_id and a.id = v.artifact_id
left join public.parties owner on owner.id = a.owner_party_id;

grant select on public.evidence_version_rows to authenticated;
revoke all on public.evidence_version_rows from public, anon;
comment on view public.evidence_version_rows is 'One row per evidence version: its artifact''s title, kind, program and owner by name (owner_name), whether the artifact belongs to a program or to the workspace alone (context), and whether the version records a file or an external reference (source_recorded). The requirement Evidence picker reads it a page at a time.';

-- Each element of a program with what the system tree counts of it and of everything inside it
-- within its authorization boundary (a nested boundary and what is inside it count apart): the
-- controls its control baseline selects, those of everything inside it each once, the ones
-- something inside it selects that it does not, how many elements inside it have no control
-- baseline, and the requirement revisions allocated to it and to anything inside it, each once.
-- As the reader may read the elements, their baselines' selections and their allocations.
create function public.program_system_counts(p_program_id uuid)
returns table (
  system_id uuid,
  control_count integer,
  subtree_control_count integer,
  additional_child_control_count integer,
  unresolved_descendant_count integer,
  requirement_count integer,
  subtree_requirement_count integer
)
language sql stable security invoker set search_path = ''
as $$
  with recursive elements as materialized (
    select s.id, s.tenant_id, s.parent_system_id, s.boundary_system_id
    from public.systems s
    where s.program_id = p_program_id
  ),
  -- Each element with itself and everything inside it, down to a nested authorization boundary.
  inside (root_id, member_id) as (
    select e.id, e.id from elements e
    union all
    select i.root_id, c.id
    from inside i
    join elements m on m.id = i.member_id
    join elements c on c.parent_system_id = m.id and c.boundary_system_id = m.boundary_system_id
  ),
  baselines as materialized (
    select e.id as system_id, b.profile_resolution_id
    from elements e
    left join public.system_effective_baselines b
      on b.system_id = e.id and b.tenant_id = e.tenant_id
        and b.boundary_system_id = e.boundary_system_id
  ),
  -- What the baselines select, each row read once: a resolution selects a control once.
  selections as materialized (
    select sc.profile_resolution_id, sc.control_id
    from public.selected_controls sc
    where sc.profile_resolution_id in (
      select b.profile_resolution_id from baselines b where b.profile_resolution_id is not null
    )
  ),
  allocations as materialized (
    select distinct a.system_id, a.requirement_revision_id
    from public.requirement_allocations a
    where a.system_id in (select e.id from elements e)
  ),
  own_controls as (
    select b.system_id, count(*)::integer as controls
    from baselines b
    join selections s on s.profile_resolution_id = b.profile_resolution_id
    group by b.system_id
  ),
  subtree_resolutions as (
    select distinct i.root_id, b.profile_resolution_id
    from inside i
    join baselines b on b.system_id = i.member_id
    where b.profile_resolution_id is not null
  ),
  subtree_controls as (
    select r.root_id, count(distinct s.control_id)::integer as controls
    from subtree_resolutions r
    join selections s on s.profile_resolution_id = r.profile_resolution_id
    group by r.root_id
  ),
  unresolved as (
    select i.root_id, count(*)::integer as members
    from inside i
    join baselines b on b.system_id = i.member_id
    where i.member_id <> i.root_id and b.profile_resolution_id is null
    group by i.root_id
  ),
  own_requirements as (
    select a.system_id, count(*)::integer as revisions
    from allocations a
    group by a.system_id
  ),
  subtree_requirements as (
    select i.root_id, count(distinct a.requirement_revision_id)::integer as revisions
    from inside i
    join allocations a on a.system_id = i.member_id
    group by i.root_id
  )
  select e.id,
    case when b.profile_resolution_id is not null then coalesce(oc.controls, 0) end,
    case when exists (select 1 from subtree_resolutions r where r.root_id = e.id)
      then coalesce(stc.controls, 0) end,
    coalesce(stc.controls, 0) - coalesce(oc.controls, 0),
    coalesce(u.members, 0),
    coalesce(orq.revisions, 0),
    coalesce(srq.revisions, 0)
  from elements e
  join baselines b on b.system_id = e.id
  left join own_controls oc on oc.system_id = e.id
  left join subtree_controls stc on stc.root_id = e.id
  left join unresolved u on u.root_id = e.id
  left join own_requirements orq on orq.system_id = e.id
  left join subtree_requirements srq on srq.root_id = e.id
  order by e.id;
$$;

revoke all on function public.program_system_counts(uuid) from public, anon;
grant execute on function public.program_system_counts(uuid) to authenticated;
comment on function public.program_system_counts(uuid) is 'Each element of a program (system_id) with what the system tree counts: the controls its control baseline selects (control_count, null without one), those it and everything inside it within its authorization boundary select, each once (subtree_control_count, null where none has a baseline), those something inside it selects that it does not (additional_child_control_count), the elements inside it with no baseline (unresolved_descendant_count), and the requirement revisions allocated to it (requirement_count) and to it or anything inside it (subtree_requirement_count), each once. As the reader may read them; a program the reader cannot read has no elements.';
