-- When each program last saw activity, for the Portfolio's Recently updated programs: the latest
-- moment anything in the program was recorded or changed, not its own row's last edit, which a
-- program keeps for months while its assessments are published and its records worked.
--
-- The moments are what the workspace records of a program's activity:
--
--   * its activity events (requirement edits write them, and so does taking a product version),
--     each named for the program or for the one record of it the event is about (a task, an
--     operational issue, a risk, a remediation item, an assessment campaign, an evidence artifact
--     or an authorization package);
--   * its published assessment results, at the moment they were published, since publishing
--     writes no event;
--   * a change to its requirements, operational issues, risks and their assessments, tasks and
--     evidence artifacts, which the app saves without an event;
--
-- and the program's own last edit, which stands alone where nothing else is recorded.
--
-- Security invoker: row-level security on every table read decides what the reader sees, so a
-- moment the reader cannot read never places a program.
create view public.program_activity with (security_invoker = true) as
with moments (tenant_id, program_id, at) as (
  select e.tenant_id,
    coalesce(e.program_id, task.program_id, issue.program_id, risk.program_id, plan.program_id,
      campaign.program_id, artifact.program_id, package.program_id),
    e.occurred_at
  from public.activity_events e
  left join public.tasks task on task.id = e.task_id
  left join public.operational_issues issue on issue.id = e.issue_id
  left join public.risks risk on risk.id = e.risk_id
  left join public.poam_items item on item.id = e.poam_item_id
  left join public.poam_documents plan on plan.id = item.poam_document_id
  left join public.assessment_campaigns campaign on campaign.id = e.assessment_campaign_id
  left join public.evidence_artifacts artifact on artifact.id = e.evidence_artifact_id
  left join public.authorization_packages package on package.id = e.package_id
  union all
  select r.tenant_id, campaign.program_id, r.published_at
  from public.assessment_results_revisions r
  join public.assessment_plan_revisions plan on plan.id = r.assessment_plan_revision_id
  join public.assessment_campaigns campaign on campaign.id = plan.campaign_id
  where r.state = 'published' and r.published_at is not null
  union all
  select v.tenant_id, q.program_id, v.updated_at
  from public.requirement_revisions v
  join public.engineering_requirements q on q.id = v.engineering_requirement_id
  union all
  select i.tenant_id, i.program_id, i.updated_at from public.operational_issues i
  union all
  select k.tenant_id, k.program_id, k.updated_at from public.risks k
  union all
  select v.tenant_id, k.program_id, v.updated_at
  from public.risk_revisions v
  join public.risks k on k.id = v.risk_id
  union all
  select t.tenant_id, t.program_id, t.updated_at from public.tasks t
  union all
  select a.tenant_id, a.program_id, a.updated_at from public.evidence_artifacts a
),
latest as (
  select m.tenant_id, m.program_id, max(m.at) as at
  from moments m
  where m.program_id is not null
  group by m.tenant_id, m.program_id
)
select p.id, p.tenant_id, p.code, p.name, p.status, p.updated_at,
  greatest(p.updated_at, latest.at) as last_activity_at
from public.programs p
left join latest on latest.tenant_id = p.tenant_id and latest.program_id = p.id;
grant select on public.program_activity to authenticated;
revoke all on public.program_activity from public, anon;
comment on view public.program_activity is 'One row per program with the moment it last saw activity (last_activity_at): the latest of its activity events, its published assessment results, a change to its requirements, operational issues, risks and their assessments, tasks and evidence artifacts, and its own last edit.';
