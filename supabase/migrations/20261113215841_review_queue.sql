-- The Review queue reads one page at a time: everything in the workspace waiting on a reviewer,
-- across programs and whoever is meant to act, one row a record. My work's Attention stays the
-- reader's own inbox; this is the workspace's register of what waits. A row is a state the schema
-- records that a reviewer moves, never a draft its author is still writing:
--   evidence            an evidence artifact's latest version whose latest review is pending, waiting
--                       on the reviewer it names (Evidence to accept);
--   assessment_results  a draft assessment results revision holding findings, which a program's
--                       control status reads only once they are published (Assessment results to
--                       publish);
--   product_assessment  a draft product assessment holding determinations, waiting on its assessor
--                       (Product assessment to publish);
--   gate                a lifecycle gate in review (Gate to decide);
--   package             an authorization package's latest version published and submitted, with no
--                       authorization decision (Package to decide);
--   discussion          an open review discussion (Discussion to resolve).
-- A draft SSP, profile, assessment plan or risk assessment is not here: nothing records that its
-- author put it up for review. The view runs as the reader (security_invoker), so row-level
-- security on every table it reads still decides what the reader sees. kind_rank orders the kinds
-- as the product's vocabulary does (reviewQueueKinds in src/lib/status.ts).

-- One row per record waiting, by the record's own id: the evidence version, the results revision,
-- the product assessment, the gate, the package version or the discussion (record_table says
-- which). The record it belongs to (parent_table, parent_id, parent_name) is the evidence artifact,
-- the assessment campaign, the product or the authorization package; a discussion's target is
-- where it was started. waiting_since is when the record began to wait: the review asked for, the
-- first finding or determination recorded, the gate's last change, the version submitted, the
-- discussion opened. waiting_on names who the schema says acts (the evidence's reviewer, the
-- product assessment's assessor), requested_by who asked (the discussion's author, whoever asked
-- for the evidence review), and owner_name the record's owner (the artifact's, the campaign's,
-- the package's). determination_count is how many determinations a publication would make.
create view public.review_queue_rows with (security_invoker = true) as
with items as (
  select v.id, r.tenant_id, 'evidence'::text as kind, 'evidence_versions'::text as record_table,
    'evidence_artifacts'::text as parent_table, a.id as parent_id, a.title as parent_name,
    null::jsonb as target, v.version_number, a.title as name, a.program_id,
    r.created_at as waiting_since, r.reviewer_party_id as waiting_on_party_id,
    r.created_by as requested_by_user, null::text as requested_by_label,
    a.owner_party_id, null::date as due_on, null::bigint as determination_count
  from public.evidence_reviews r
  join public.evidence_versions v on v.tenant_id = r.tenant_id and v.id = r.evidence_version_id
  join public.evidence_artifacts a on a.tenant_id = v.tenant_id and a.id = v.artifact_id
  where r.decision = 'pending'
    -- The artifact's latest version, and that version's latest review, as the evidence register
    -- reads its Latest review.
    and not exists (
      select 1 from public.evidence_versions newer
      where newer.tenant_id = v.tenant_id and newer.artifact_id = v.artifact_id
        and newer.version_number > v.version_number)
    and not exists (
      select 1 from public.evidence_reviews later
      where later.tenant_id = r.tenant_id and later.evidence_version_id = r.evidence_version_id
        and (coalesce(later.reviewed_at, later.created_at), later.id)
          > (coalesce(r.reviewed_at, r.created_at), r.id))
  union all
  select ar.id, ar.tenant_id, 'assessment_results', 'assessment_results_revisions',
    'assessment_campaigns', campaign.id, campaign.title, null::jsonb, ar.version_number, ar.title,
    campaign.program_id, recorded.first_at, null::uuid, null::uuid, null::text,
    campaign.owner_party_id, null::date, recorded.held
  from public.assessment_results_revisions ar
  join public.assessment_plan_revisions plan
    on plan.tenant_id = ar.tenant_id and plan.id = ar.assessment_plan_revision_id
  join public.assessment_campaigns campaign
    on campaign.tenant_id = plan.tenant_id and campaign.id = plan.campaign_id
  cross join lateral (
    select min(f.created_at) as first_at, count(*) as held
    from public.assessment_findings f
    where f.tenant_id = ar.tenant_id and f.assessment_results_revision_id = ar.id
  ) recorded
  where ar.state = 'draft' and recorded.held > 0
  union all
  select pa.id, pa.tenant_id, 'product_assessment', 'product_assessments', 'products',
    product.id, product.name, null::jsonb, product_version.version_number, pa.title, null::uuid,
    determined.first_at, pa.assessor_party_id, null::uuid, null::text, null::uuid, null::date,
    determined.held
  from public.product_assessments pa
  join public.product_revisions product_version
    on product_version.tenant_id = pa.tenant_id and product_version.id = pa.product_revision_id
  join public.products product
    on product.tenant_id = product_version.tenant_id
      and product.id = product_version.product_id
  cross join lateral (
    select min(d.created_at) as first_at, count(*) as held
    from public.product_determinations d
    where d.tenant_id = pa.tenant_id and d.product_assessment_id = pa.id
  ) determined
  where pa.state = 'draft' and determined.held > 0
  union all
  select g.id, g.tenant_id, 'gate', 'lifecycle_gates', null::text, null::uuid, null::text,
    null::jsonb, null::integer, g.title, g.program_id, g.updated_at, null::uuid, null::uuid,
    null::text, null::uuid, g.due_on, null::bigint
  from public.lifecycle_gates g
  where g.status = 'in_review'
  union all
  select pv.id, pv.tenant_id, 'package', 'package_revisions', 'authorization_packages', p.id,
    p.title, null::jsonb, pv.version_number, p.title, p.program_id, pv.submitted_at, null::uuid,
    null::uuid, null::text, p.owner_party_id, null::date, null::bigint
  from public.package_revisions pv
  join public.authorization_packages p on p.tenant_id = pv.tenant_id and p.id = pv.package_id
  -- An authorization decision is recorded on a published version: a draft is the program's still.
  where pv.state = 'published' and pv.submitted_at is not null
    and not exists (
      select 1 from public.package_revisions newer
      where newer.tenant_id = pv.tenant_id and newer.package_id = pv.package_id
        and newer.state = 'published' and newer.submitted_at is not null
        and newer.version_number > pv.version_number)
    and not exists (
      select 1 from public.authorization_decisions decision
      where decision.tenant_id = pv.tenant_id and decision.package_revision_id = pv.id)
  union all
  select t.id, t.tenant_id, 'discussion', 'assurance_review_threads', null::text, null::uuid,
    null::text, t.target, null::integer, t.subject, t.program_id, t.created_at, null::uuid,
    t.created_by, t.author_name, null::uuid, null::date, null::bigint
  from public.assurance_review_threads t
  where t.status = 'open'
)
select i.id, i.tenant_id, i.kind,
  pg_catalog.array_position(
    '{evidence,assessment_results,product_assessment,gate,package,discussion}'::text[], i.kind
  ) as kind_rank,
  i.record_table, i.parent_table, i.parent_id, i.parent_name, i.target, i.version_number, i.name,
  i.program_id, program.name as program_name, i.waiting_since,
  i.waiting_on_party_id, waiting_on.name as waiting_on_name,
  requester.id as requested_by_party_id,
  coalesce(requester.name, i.requested_by_label) as requested_by_name,
  i.owner_party_id, owner.name as owner_name, i.due_on, i.determination_count
from items i
left join public.programs program on program.id = i.program_id
left join public.parties waiting_on on waiting_on.id = i.waiting_on_party_id
left join public.parties owner on owner.id = i.owner_party_id
left join lateral (
  select p.id, p.name
  from public.parties p
  where p.tenant_id = i.tenant_id and p.auth_user_id = i.requested_by_user
  order by p.id
  limit 1
) requester on true;
grant select on public.review_queue_rows to authenticated;
revoke all on public.review_queue_rows from public, anon;
comment on view public.review_queue_rows is 'The Review queue, one row per record waiting on a reviewer across the workspace (evidence to accept, assessment results and product assessments to publish, gates and packages to decide, discussions to resolve): its kind with the rank it sorts by, its program, who it waits on, who asked, its owner, and when it began to wait.';
