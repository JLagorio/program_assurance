-- When each program last saw activity, asked program by program (Josef, 2026-11-15: "Portfolio reads
-- scoped", program_activity's index).
--
-- program_activity (20261113211631_program_activity) gathered every moment of every program the
-- reader can read into one list (each activity event, published assessment result, requirement
-- revision, operational issue, risk and risk assessment, task and evidence artifact), grouped it by
-- program and only then joined the programs: on each Portfolio load, every row of those tables,
-- each asked of row-level security, to order a handful of programs. Nothing indexed a program's
-- records by the moment they last changed.
--
-- The view now asks each program for its own latest moments:
--
--   * the activity events naming it, its operational issues, risks, tasks and evidence artifacts,
--     each the last entry of an index of the program's records by that moment;
--   * its requirement revisions, risk assessments and published assessment results, through the
--     requirements, risks and campaigns of the program that hold them, by the indexes that
--     already exist;
--   * an event that names one record of the program and not the program itself, which an event may
--     do, through its record, from the events that name no program, read once by an index of
--     those events alone (the commands and the seeds name the program).
--
-- The answer is the same for every program: the same moments, the latest of them, else the
-- program's own last edit. Each condition on a record's workspace that the old view did not state
-- follows from the foreign keys, which tie every record to its program's workspace. The count
-- PostgREST asks beside a page reads the programs alone, as before.
--
-- The view is redefined from its text in 20261113211631_program_activity, the live definition (no
-- later migration redefines it), with the same columns.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- A program's records by the moment they last changed.
-- ---------------------------------------------------------------------------------------------
create index if not exists activity_events_program_moment_idx
  on public.activity_events (tenant_id, program_id, occurred_at) where program_id is not null;
create index if not exists activity_events_without_program_idx
  on public.activity_events (tenant_id) where program_id is null;
create index if not exists operational_issues_program_updated_idx
  on public.operational_issues (tenant_id, program_id, updated_at);
create index if not exists risks_program_updated_idx
  on public.risks (tenant_id, program_id, updated_at);
create index if not exists tasks_program_updated_idx
  on public.tasks (tenant_id, program_id, updated_at);
create index if not exists evidence_artifacts_program_updated_idx
  on public.evidence_artifacts (tenant_id, program_id, updated_at) where program_id is not null;
create index if not exists assessment_campaigns_program_idx
  on public.assessment_campaigns (tenant_id, program_id);

-- ---------------------------------------------------------------------------------------------
-- When each program last saw activity, program by program.
-- ---------------------------------------------------------------------------------------------
create or replace view public.program_activity with (security_invoker = true) as
select p.id, p.tenant_id, p.code, p.name, p.status, p.updated_at,
  greatest(
    p.updated_at,
    -- Its activity events: those naming the program,
    (select max(e.occurred_at) from public.activity_events e
      where e.tenant_id = p.tenant_id and e.program_id = p.id),
    -- and those naming one record of it alone.
    recordless.at,
    -- Its published assessment results, at the moment they were published.
    (select max(r.published_at)
      from public.assessment_campaigns campaign
      join public.assessment_plan_revisions plan
        on plan.tenant_id = campaign.tenant_id and plan.campaign_id = campaign.id
      join public.assessment_results_revisions r
        on r.tenant_id = plan.tenant_id and r.assessment_plan_revision_id = plan.id
      where campaign.tenant_id = p.tenant_id and campaign.program_id = p.id
        and r.state = 'published' and r.published_at is not null),
    -- A change to its requirements, operational issues, risks and their assessments, tasks and
    -- evidence artifacts.
    (select max(v.updated_at)
      from public.engineering_requirements q
      join public.requirement_revisions v
        on v.tenant_id = q.tenant_id and v.engineering_requirement_id = q.id
      where q.tenant_id = p.tenant_id and q.program_id = p.id),
    (select max(i.updated_at) from public.operational_issues i
      where i.tenant_id = p.tenant_id and i.program_id = p.id),
    (select max(k.updated_at) from public.risks k
      where k.tenant_id = p.tenant_id and k.program_id = p.id),
    (select max(v.updated_at)
      from public.risks k
      join public.risk_revisions v on v.tenant_id = k.tenant_id and v.risk_id = k.id
      where k.tenant_id = p.tenant_id and k.program_id = p.id),
    (select max(t.updated_at) from public.tasks t
      where t.tenant_id = p.tenant_id and t.program_id = p.id),
    (select max(a.updated_at) from public.evidence_artifacts a
      where a.tenant_id = p.tenant_id and a.program_id = p.id)
  ) as last_activity_at
from public.programs p
-- An event that names one record of a program and not the program stands for the record's
-- program: the events that name no program, read once.
left join (
  select e.tenant_id,
    coalesce(task.program_id, issue.program_id, risk.program_id, plan.program_id,
      campaign.program_id, artifact.program_id, package.program_id) as program_id,
    max(e.occurred_at) as at
  from public.activity_events e
  left join public.tasks task on task.id = e.task_id
  left join public.operational_issues issue on issue.id = e.issue_id
  left join public.risks risk on risk.id = e.risk_id
  left join public.poam_items item on item.id = e.poam_item_id
  left join public.poam_documents plan on plan.id = item.poam_document_id
  left join public.assessment_campaigns campaign on campaign.id = e.assessment_campaign_id
  left join public.evidence_artifacts artifact on artifact.id = e.evidence_artifact_id
  left join public.authorization_packages package on package.id = e.package_id
  where e.program_id is null
  group by 1, 2
) recordless on recordless.tenant_id = p.tenant_id and recordless.program_id = p.id;
grant select on public.program_activity to authenticated;
revoke all on public.program_activity from public, anon;
comment on view public.program_activity is 'One row per program with the moment it last saw activity (last_activity_at): the latest of its activity events, its published assessment results, a change to its requirements, operational issues, risks and their assessments, tasks and evidence artifacts, and its own last edit. Asked program by program, each moment by an index of the program''s records.';

notify pgrst, 'reload schema';
