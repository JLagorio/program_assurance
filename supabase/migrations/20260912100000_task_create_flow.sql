-- A task and its optional responsible assignment are one user-confirmed command.
-- Receipts make retries safe after an interrupted response; domain data stays relational.
create table public.task_create_requests (
  id uuid not null,
  tenant_id uuid not null references public.tenants(id),
  task_id uuid,
  assignment_id uuid,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (tenant_id, id),
  unique (tenant_id, task_id),
  foreign key (tenant_id, task_id) references public.tasks(tenant_id, id) on delete set null (task_id),
  foreign key (tenant_id, assignment_id) references public.task_assignments(tenant_id, id) on delete set null (assignment_id)
);
alter table public.task_create_requests enable row level security;
revoke all on public.task_create_requests from public, anon, authenticated;
comment on table public.task_create_requests is 'Private task-creation receipts. An identical retry by the same actor returns the previously created task and assignment.';

create function public.create_task_with_assignment(p_tenant_id uuid, p_request_id uuid, p_task jsonb)
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
  task_due timestamptz;
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
  if (p_task - 'programId' - 'workstreamId' - 'title' - 'description' - 'assigneePartyId' - 'dueAt' - 'priority') <> '{}'::jsonb then
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
  foreach field_name in array array['workstreamId','description','assigneePartyId','dueAt','priority'] loop
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
  if nullif(p_task->>'dueAt','') is not null then
    if (p_task->>'dueAt') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$' then
      raise exception 'Enter a due date and time with its timezone' using errcode = '23514';
    end if;
    begin task_due := (p_task->>'dueAt')::timestamptz;
    exception when invalid_datetime_format or datetime_field_overflow or sqlstate '22009' then
      raise exception 'Enter a valid due date and time' using errcode = '23514';
    end;
    if not isfinite(task_due) then raise exception 'Enter a finite due date and time' using errcode = '23514'; end if;
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
  insert into public.tasks (tenant_id, program_id, workstream_id, title, description, priority, due_at)
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
comment on function public.create_task_with_assignment(uuid,uuid,jsonb) is 'Creates a task and optional responsible assignment atomically after validating the program, workstream, party, and current tenant membership. Identical request IDs are safe to retry.';
