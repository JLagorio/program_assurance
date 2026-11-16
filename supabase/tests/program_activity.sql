-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- When each program last saw activity (program_activity), which orders the Portfolio's Recently
-- updated programs: a program with nothing recorded stands at its own last edit; an activity event
-- places it, named for the program, for a task of it, or for a campaign of it and the program
-- beside it (as a publication of assessment results is recorded), and an older one never takes it
-- back; an event naming one operational issue, risk, remediation item, evidence artifact or
-- authorization package of it alone places it, the latest deciding, and one naming an artifact of
-- no program places none; an event naming a program beside another program's record, two records
-- or nothing is refused; a published assessment result places it at the moment it was published,
-- and a draft one does not; and a reader sees only the programs of the workspaces they belong to.
-- Every row written here carries the transaction's start as its own last change, so a moment after
-- it is what moves a program.
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
  ('ac710000-0000-0000-0000-000000000004', current_setting('test.tenant')::uuid, 'PUBLISHED', 'Program with a published result'),
  ('ac710000-0000-0000-0000-000000000005', current_setting('test.tenant')::uuid, 'CAMPAIGN-EVENT', 'Program whose campaign has an event');
insert into public.assessment_campaigns(id, tenant_id, program_id, title) values
  ('ac730000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'ac710000-0000-0000-0000-000000000005', 'Campaign with an event');
insert into public.tasks(id, tenant_id, program_id, title) values
  ('ac720000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'ac710000-0000-0000-0000-000000000002', 'Task with an event');
insert into public.activity_events(tenant_id, task_id, event_type, description, occurred_at) values
  (current_setting('test.tenant')::uuid, 'ac720000-0000-0000-0000-000000000001', 'updated', 'moved the task on', now() + interval '1 day');
insert into public.activity_events(tenant_id, program_id, event_type, description, occurred_at) values
  (current_setting('test.tenant')::uuid, 'ac710000-0000-0000-0000-000000000003', 'updated', 'edited the program', now() + interval '2 days'),
  -- An event older than the program's own last edit never takes the program back.
  (current_setting('test.tenant')::uuid, 'ac710000-0000-0000-0000-000000000001', 'created', 'recorded long ago', now() - interval '30 days');
-- An event naming a campaign and its program beside it, as publish_assessment_results records a
-- publication.
insert into public.activity_events(tenant_id, program_id, assessment_campaign_id, event_type, description, occurred_at) values
  (current_setting('test.tenant')::uuid, 'ac710000-0000-0000-0000-000000000005', 'ac730000-0000-0000-0000-000000000001',
    'published', E'published assessment results of Campaign with an event\nResults: 1 finding.', now() + interval '12 hours');

-- What an event may name: its program, one record of it, or that record and its own program. A
-- program beside another program's record, two records and nothing are refused, writing nothing.
do $$
declare v_tenant uuid := current_setting('test.tenant')::uuid;
begin
  begin
    insert into public.activity_events(tenant_id, program_id, assessment_campaign_id, event_type, occurred_at)
      values (v_tenant, 'ac710000-0000-0000-0000-000000000003', 'ac730000-0000-0000-0000-000000000001', 'published', now());
    raise exception 'An event named a program beside another program''s campaign';
  exception when check_violation then
    if position('the record''s own program' in sqlerrm) = 0 then raise; end if;
  end;
  begin
    insert into public.activity_events(tenant_id, task_id, assessment_campaign_id, event_type, occurred_at)
      values (v_tenant, 'ac720000-0000-0000-0000-000000000001', 'ac730000-0000-0000-0000-000000000001', 'updated', now());
    raise exception 'An event named two records';
  exception when check_violation then
    if position('activity_events_target' in sqlerrm) = 0 then raise; end if;
  end;
  begin
    insert into public.activity_events(tenant_id, event_type, occurred_at) values (v_tenant, 'updated', now());
    raise exception 'An event named nothing';
  exception when check_violation then
    if position('activity_events_target' in sqlerrm) = 0 then raise; end if;
  end;
  if (select count(*) from public.activity_events where tenant_id = v_tenant) <> 4 then
    raise exception 'A refused event was written';
  end if;
end $$;

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
  select * into v_program from public.program_activity where id = 'ac710000-0000-0000-0000-000000000005';
  if v_program.last_activity_at is distinct from now() + interval '12 hours' then
    raise exception 'An event naming a campaign of the program and the program places it, not %', v_program.last_activity_at;
  end if;
end $$;

-- An event naming one record alone places the record's program, whatever the record: an
-- operational issue, a risk, a remediation item, an evidence artifact or an authorization package,
-- the latest of a program's events deciding. An event naming an artifact of no program places
-- none. Each comes before the campaign's event, so the order read below holds.
insert into public.programs(id, tenant_id, code, name) values
  ('ac710000-0000-0000-0000-000000000006', current_setting('test.tenant')::uuid, 'ISSUE-EVENT', 'Program whose issue has events'),
  ('ac710000-0000-0000-0000-000000000007', current_setting('test.tenant')::uuid, 'RISK-EVENT', 'Program whose risk has an event'),
  ('ac710000-0000-0000-0000-000000000008', current_setting('test.tenant')::uuid, 'ITEM-EVENT', 'Program whose remediation item has an event'),
  ('ac710000-0000-0000-0000-000000000009', current_setting('test.tenant')::uuid, 'ARTIFACT-EVENT', 'Program whose evidence has an event'),
  ('ac710000-0000-0000-0000-00000000000a', current_setting('test.tenant')::uuid, 'PACKAGE-EVENT', 'Program whose package has an event');
insert into public.operational_issues(id, tenant_id, program_id, title) values
  ('ac740000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'ac710000-0000-0000-0000-000000000006', 'Issue with events');
insert into public.risks(id, tenant_id, program_id, title) values
  ('ac740000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, 'ac710000-0000-0000-0000-000000000007', 'Risk with an event');
insert into public.poam_documents(id, tenant_id, program_id, title) values
  ('ac740000-0000-0000-0000-000000000003', current_setting('test.tenant')::uuid, 'ac710000-0000-0000-0000-000000000008', 'Plan with an item');
insert into public.poam_items(id, tenant_id, poam_document_id, title) values
  ('ac740000-0000-0000-0000-000000000004', current_setting('test.tenant')::uuid, 'ac740000-0000-0000-0000-000000000003', 'Item with an event');
insert into public.evidence_artifacts(id, tenant_id, program_id, title, artifact_kind) values
  ('ac740000-0000-0000-0000-000000000005', current_setting('test.tenant')::uuid, 'ac710000-0000-0000-0000-000000000009', 'Evidence with an event', 'document'),
  ('ac740000-0000-0000-0000-000000000006', current_setting('test.tenant')::uuid, null, 'Evidence of no program', 'document');
insert into public.systems(id, tenant_id, program_id, code, name, system_type) values
  ('ac740000-0000-0000-0000-000000000007', current_setting('test.tenant')::uuid, 'ac710000-0000-0000-0000-00000000000a', 'PACKAGE-SYS', 'Package system', 'information_system');
insert into public.authorization_packages(id, tenant_id, program_id, system_id, title) values
  ('ac740000-0000-0000-0000-000000000008', current_setting('test.tenant')::uuid, 'ac710000-0000-0000-0000-00000000000a', 'ac740000-0000-0000-0000-000000000007', 'Package with an event');
insert into public.activity_events(tenant_id, issue_id, risk_id, poam_item_id, evidence_artifact_id, package_id, event_type, description, occurred_at) values
  (current_setting('test.tenant')::uuid, 'ac740000-0000-0000-0000-000000000001', null, null, null, null, 'updated', 'moved the issue on', now() + interval '6 hours'),
  (current_setting('test.tenant')::uuid, 'ac740000-0000-0000-0000-000000000001', null, null, null, null, 'updated', 'opened the issue', now() + interval '1 hour'),
  (current_setting('test.tenant')::uuid, null, 'ac740000-0000-0000-0000-000000000002', null, null, null, 'updated', 'moved the risk on', now() + interval '2 hours'),
  (current_setting('test.tenant')::uuid, null, null, 'ac740000-0000-0000-0000-000000000004', null, null, 'updated', 'moved the item on', now() + interval '3 hours'),
  (current_setting('test.tenant')::uuid, null, null, null, 'ac740000-0000-0000-0000-000000000005', null, 'updated', 'collected the evidence', now() + interval '4 hours'),
  (current_setting('test.tenant')::uuid, null, null, null, null, 'ac740000-0000-0000-0000-000000000008', 'updated', 'moved the package on', now() + interval '5 hours'),
  (current_setting('test.tenant')::uuid, null, null, null, 'ac740000-0000-0000-0000-000000000006', null, 'updated', 'collected evidence of no program', now() + interval '30 days');
do $$
declare v_moments jsonb;
begin
  select jsonb_object_agg(code, last_activity_at - now()) into v_moments from public.program_activity
  where id in ('ac710000-0000-0000-0000-000000000006', 'ac710000-0000-0000-0000-000000000007',
    'ac710000-0000-0000-0000-000000000008', 'ac710000-0000-0000-0000-000000000009',
    'ac710000-0000-0000-0000-00000000000a');
  if v_moments <> '{"ISSUE-EVENT": "06:00:00", "RISK-EVENT": "02:00:00", "ITEM-EVENT": "03:00:00", "ARTIFACT-EVENT": "04:00:00", "PACKAGE-EVENT": "05:00:00"}'::jsonb then
    raise exception 'An event naming one record placed the programs at %', v_moments;
  end if;
  if exists (select 1 from public.program_activity where last_activity_at = now() + interval '30 days') then
    raise exception 'An event naming an artifact of no program placed a program';
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
