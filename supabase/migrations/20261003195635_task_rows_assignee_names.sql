-- The task registers search a task by the people assigned to it as well as its title and program.
-- The search matches text by substring, so the view gives the people's names as one text column
-- beside the list the Assigned to column and filter read. The rest of the view is unchanged.

create or replace view public.task_rows with (security_invoker = true) as
select t.id, t.tenant_id, t.program_id, t.workstream_id, t.title, t.description, t.status,
  t.priority, t.due_on, t.completed_at, t.revision, t.created_at, t.updated_at, t.created_by,
  t.updated_by,
  program.name as program_name,
  coalesce(assigned.names, '{}'::text[]) as assignees,
  coalesce(assigned.mine, false) as assigned_to_me,
  case when assigned.mine then 'Assigned to you' else 'Other tasks' end as assignment,
  pg_catalog.array_position('{open,in_progress,waiting,blocked,done,cancelled}'::text[], t.status)
    as status_rank,
  pg_catalog.array_position('{low,normal,high,urgent}'::text[], t.priority) as priority_rank,
  pg_catalog.array_to_string(assigned.names, ', ') as assignee_names
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
comment on view public.task_rows is 'The task registers, one row per task: its program by name, the people assigned by name (assignees, and assignee_names in words for the search), whether the reader is assigned (assigned_to_me, and assignment in words), with the rank its status and priority sort by.';
