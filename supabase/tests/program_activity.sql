-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- When each program last saw activity (program_activity), which orders the Portfolio's Recently
-- updated programs: a program with nothing recorded stands at its own last edit; an activity event
-- places it, named for the program or for a task of it, and an older one never takes it back; a
-- published assessment result places it at the moment it was published, and a draft one does not;
-- and a reader sees only the programs of the workspaces they belong to. Every row written here
-- carries the transaction's start as its own last change, so a moment after it is what moves a
-- program.
begin;

-- Who may read: a signed-in member, as themselves.
do $$ begin
  if has_table_privilege('anon', 'public.program_activity', 'select')
    or has_table_privilege('public', 'public.program_activity', 'select') then
    raise exception 'An anonymous session may read program_activity';
  end if;
  if not has_table_privilege('authenticated', 'public.program_activity', 'select') then
    raise exception 'A signed-in session may not read program_activity';
  end if;
  if not exists (select 1 from pg_catalog.pg_class c where c.oid = 'public.program_activity'::regclass
      and 'security_invoker=true' = any(c.reloptions)) then
    raise exception 'program_activity does not run as its reader';
  end if;
end $$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('ac700000-0000-0000-0000-000000000001', 'program-activity-owner@example.test', '{"name":"Program activity owner"}'),
  ('ac700000-0000-0000-0000-000000000002', 'program-activity-outsider@example.test', '{}');
select set_config('request.jwt.claim.sub', 'ac700000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.programs(id, tenant_id, code, name) values
  ('ac710000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'QUIET', 'Program with nothing recorded'),
  ('ac710000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'EVENTS', 'Program whose task has an event'),
  ('ac710000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'PROGRAM-EVENT', 'Program named by an event'),
  ('ac710000-0000-0000-0000-000000000004', current_setting('test.tenant')::uuid, 'PUBLISHED', 'Program with a published result');
insert into public.tasks(id, tenant_id, program_id, title) values
  ('ac720000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'ac710000-0000-0000-0000-000000000002', 'Task with an event');
insert into public.activity_events(tenant_id, task_id, event_type, description, occurred_at) values
  (current_setting('test.tenant')::uuid, 'ac720000-0000-0000-0000-000000000001', 'updated', 'moved the task on', now() + interval '1 day');
insert into public.activity_events(tenant_id, program_id, event_type, description, occurred_at) values
  (current_setting('test.tenant')::uuid, 'ac710000-0000-0000-0000-000000000003', 'updated', 'edited the program', now() + interval '2 days'),
  -- An event older than the program's own last edit never takes the program back.
  (current_setting('test.tenant')::uuid, 'ac710000-0000-0000-0000-000000000001', 'created', 'recorded long ago', now() - interval '30 days');

do $$
declare v_program record;
begin
  select * into v_program from public.program_activity where id = 'ac710000-0000-0000-0000-000000000001';
  if v_program.last_activity_at is distinct from v_program.updated_at then
    raise exception 'A program with nothing newer stands at its own last edit, not %', v_program.last_activity_at;
  end if;
  select * into v_program from public.program_activity where id = 'ac710000-0000-0000-0000-000000000002';
  if v_program.last_activity_at is distinct from now() + interval '1 day' then
    raise exception 'An event on a task of the program places it, not %', v_program.last_activity_at;
  end if;
  select * into v_program from public.program_activity where id = 'ac710000-0000-0000-0000-000000000003';
  if v_program.last_activity_at is distinct from now() + interval '2 days' then
    raise exception 'An event naming the program places it, not %', v_program.last_activity_at;
  end if;
end $$;

-- A published assessment result places its program at the moment it was published; a draft one
-- does not. With the pinned reference baseline installed, the program's system adopts it.
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_program uuid := 'ac710000-0000-0000-0000-000000000004';
  v_resolution uuid;
  v_system uuid;
  v_ssp record;
  v_campaign uuid;
  v_plan record;
  v_draft record;
  v_result record;
  v_moment timestamptz;
begin
  select id into v_resolution from public.profile_resolutions
    where tenant_id is null and state = 'published' order by id limit 1;
  if v_resolution is null then
    raise notice 'No reference baseline is installed: the published-result moment is not checked';
    return;
  end if;
  insert into public.systems(tenant_id, program_id, code, name, system_type)
    values (v_tenant, v_program, 'PUBLISHED-SYS', 'Published result system', 'information_system')
    returning id into v_system;
  insert into public.ssp_revisions(tenant_id, system_id, profile_resolution_id, version_number)
    values (v_tenant, v_system, v_resolution, 1) returning * into v_ssp;
  -- An SSP is published with a control implementation in it.
  insert into public.implemented_requirements(tenant_id, ssp_revision_id, selected_control_id, description)
    select v_tenant, v_ssp.id, sc.id, 'Published result implementation narrative.'
    from public.selected_controls sc where sc.profile_resolution_id = v_resolution
    order by sc.ordinal limit 1;
  update public.ssp_revisions set state = 'published', published_at = now(), revision = v_ssp.revision + 1
    where id = v_ssp.id;
  insert into public.assessment_campaigns(tenant_id, program_id, title)
    values (v_tenant, v_program, 'Published result campaign') returning id into v_campaign;
  insert into public.assessment_plan_revisions(tenant_id, campaign_id, ssp_revision_id, version_number, title)
    values (v_tenant, v_campaign, v_ssp.id, 1, 'Published result plan') returning * into v_plan;
  update public.assessment_plan_revisions set state = 'published', published_at = now(), revision = v_plan.revision + 1
    where id = v_plan.id;
  -- A draft result, however recent, places nothing.
  insert into public.assessment_results_revisions(tenant_id, assessment_plan_revision_id, version_number, title)
    values (v_tenant, v_plan.id, 1, 'Draft result') returning * into v_draft;
  select last_activity_at into v_moment from public.program_activity where id = v_program;
  if v_moment is distinct from now() then
    raise exception 'A draft result moved its program to %', v_moment;
  end if;
  insert into public.assessment_results_revisions(tenant_id, assessment_plan_revision_id, version_number, title)
    values (v_tenant, v_plan.id, 2, 'Published result') returning * into v_result;
  update public.assessment_results_revisions
    set state = 'published', published_at = now() + interval '3 days', revision = v_result.revision + 1
    where id = v_result.id;
  select last_activity_at into v_moment from public.program_activity where id = v_program;
  if v_moment is distinct from now() + interval '3 days' then
    raise exception 'A published result places its program at its publication, not %', v_moment;
  end if;
end $$;

-- Ordered by it, the programs read as the widget lists them: the latest activity first.
do $$
declare v_codes text[];
begin
  select pg_catalog.array_agg(code order by last_activity_at desc, id) into v_codes
    from public.program_activity where tenant_id = current_setting('test.tenant')::uuid;
  if v_codes[1:2] <> array['PROGRAM-EVENT', 'EVENTS'] and v_codes[1:3] <> array['PUBLISHED', 'PROGRAM-EVENT', 'EVENTS'] then
    raise exception 'The programs read in the order %', v_codes;
  end if;
end $$;

-- Another workspace's reader sees none of these programs.
select set_config('request.jwt.claim.sub', 'ac700000-0000-0000-0000-000000000002', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
do $$ begin
  if exists (select 1 from public.program_activity where tenant_id = current_setting('test.tenant')::uuid) then
    raise exception 'A reader outside the workspace sees its programs';
  end if;
end $$;

rollback;
