-- A task's due and a scheduled assessment task's due are calendar days. Work is due on a day,
-- which reads the same day in every reader's zone; no time of day is recorded. A due moment
-- already stored becomes its day in UTC. A risk response's due stays an instant.
--
-- The type change rewrites each table without firing row triggers, so a record's revision,
-- updated_at and updated_by stay as they were.

-- A scheduled assessment task is due no earlier than the day it starts.
alter table public.scheduled_assessment_tasks drop constraint scheduled_assessment_tasks_check;
alter table public.scheduled_assessment_tasks
  alter column due_at type date using (due_at at time zone 'UTC')::date;
alter table public.scheduled_assessment_tasks rename column due_at to due_on;
alter table public.scheduled_assessment_tasks
  add constraint scheduled_assessment_tasks_due_on_check
  check (due_on is null or starts_at is null or due_on >= (starts_at at time zone 'UTC')::date);
comment on column public.scheduled_assessment_tasks.due_on is
  'The day the scheduled assessment task is due: a calendar day, no earlier than the day (UTC) it starts.';

alter table public.tasks alter column due_at type date using (due_at at time zone 'UTC')::date;
alter table public.tasks rename column due_at to due_on;
comment on column public.tasks.due_on is 'The day the task is due: a calendar day, with no time or zone.';

-- The create command takes the due day as `dueOn`, an ISO day ("2026-10-14").
create or replace function public.create_task_with_assignment(p_tenant_id uuid, p_request_id uuid, p_task jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  receipt public.task_create_requests;
  input_hash text;
  chosen_program uuid;
  chosen_workstream uuid;
  chosen_assignee uuid;
  task_title text;
  task_description text;
  task_priority text;
  task_due date;
  new_task_id uuid;
  new_assignment_id uuid;
  field_name text;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'Your workspace role cannot create tasks' using errcode = '42501';
  end if;
  if p_request_id is null or jsonb_typeof(p_task) is distinct from 'object' or octet_length(p_task::text) > 30000 then
    raise exception 'Invalid task creation request' using errcode = '23514';
  end if;
  if (p_task - 'programId' - 'workstreamId' - 'title' - 'description' - 'assigneePartyId' - 'dueOn' - 'priority') <> '{}'::jsonb then
    raise exception 'The task request contains unsupported fields' using errcode = '23514';
  end if;
  input_hash := encode(extensions.digest(p_task::text, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || '/task-create/' || p_request_id::text, 0));
  select * into receipt from public.task_create_requests where tenant_id = p_tenant_id and id = p_request_id;
  if found then
    if receipt.created_by <> auth.uid() or receipt.payload_sha256 <> input_hash then
      raise exception 'This request already created a task with different details. Open the saved task before starting another creation request.' using errcode = 'PT409';
    end if;
    if receipt.task_id is null then raise exception 'The task from this creation request was deleted. Start a new request to create another task.' using errcode = 'PT409'; end if;
    return jsonb_build_object('taskId', receipt.task_id, 'assignmentId', receipt.assignment_id);
  end if;
  if jsonb_typeof(p_task->'title') is distinct from 'string' or length(btrim(p_task->>'title')) not between 1 and 1000 then
    raise exception 'Enter a task title of 1 to 1000 characters' using errcode = '23514';
  end if;
  if jsonb_typeof(p_task->'programId') is distinct from 'string' then
    raise exception 'Choose a program for the task' using errcode = '23514';
  end if;
  foreach field_name in array array['workstreamId','description','assigneePartyId','dueOn','priority'] loop
    if p_task ? field_name and jsonb_typeof(p_task->field_name) not in ('string','null') then
      raise exception 'Invalid value for %', field_name using errcode = '23514';
    end if;
  end loop;
  if length(coalesce(p_task->>'description','')) > 10000 then
    raise exception 'Task description must be at most 10000 characters' using errcode = '23514';
  end if;
  begin
    chosen_program := (p_task->>'programId')::uuid;
    chosen_workstream := nullif(p_task->>'workstreamId','')::uuid;
    chosen_assignee := nullif(p_task->>'assigneePartyId','')::uuid;
  exception when invalid_text_representation then
    raise exception 'Choose existing program, workstream, and assignee records' using errcode = '23514';
  end;
  task_title := btrim(p_task->>'title');
  task_description := nullif(btrim(p_task->>'description'),'');
  task_priority := nullif(p_task->>'priority','');
  if task_priority is not null and task_priority not in ('low','normal','high','urgent') then
    raise exception 'Choose an available task priority' using errcode = '23514';
  end if;
  -- A day, never a moment: "2026-10-14", which every zone reads as the same day.
  if nullif(p_task->>'dueOn','') is not null then
    if (p_task->>'dueOn') !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'Enter the due date as a day, such as 2026-10-14' using errcode = '23514';
    end if;
    -- An ISO day reads the same under every DateStyle; a day past its month's end is refused.
    begin task_due := (p_task->>'dueOn')::date;
    exception when invalid_datetime_format or datetime_field_overflow then
      raise exception 'Enter a valid due date' using errcode = '23514';
    end;
  end if;
  perform 1 from public.programs where tenant_id = p_tenant_id and id = chosen_program for share;
  if not found then raise exception 'Choose a program in this workspace' using errcode = '23514'; end if;
  if chosen_workstream is not null then
    perform 1 from public.workstreams where tenant_id = p_tenant_id and id = chosen_workstream and program_id = chosen_program for share;
    if not found then raise exception 'Choose a workstream belonging to the selected program' using errcode = '23514'; end if;
  end if;
  if chosen_assignee is not null then
    perform 1 from public.parties where tenant_id = p_tenant_id and id = chosen_assignee for share;
    if not found then raise exception 'Choose an assignee in this workspace' using errcode = '23514'; end if;
  end if;
  insert into public.tasks (tenant_id, program_id, workstream_id, title, description, priority, due_on)
  values (p_tenant_id, chosen_program, chosen_workstream, task_title, task_description, task_priority, task_due)
  returning id into new_task_id;
  if chosen_assignee is not null then
    insert into public.task_assignments (tenant_id, task_id, party_id, assignment_role)
    values (p_tenant_id, new_task_id, chosen_assignee, 'responsible') returning id into new_assignment_id;
  end if;
  insert into public.task_create_requests (id, tenant_id, task_id, assignment_id, payload_sha256, created_by)
  values (p_request_id, p_tenant_id, new_task_id, new_assignment_id, input_hash, auth.uid());
  return jsonb_build_object('taskId', new_task_id, 'assignmentId', new_assignment_id);
end;
$$;
revoke all on function public.create_task_with_assignment(uuid,uuid,jsonb) from public, anon;
grant execute on function public.create_task_with_assignment(uuid,uuid,jsonb) to authenticated;
comment on function public.create_task_with_assignment(uuid,uuid,jsonb) is 'Creates a task and optional responsible assignment atomically after validating the program, workstream, party, due day, and current tenant membership. Identical request IDs are safe to retry.';
