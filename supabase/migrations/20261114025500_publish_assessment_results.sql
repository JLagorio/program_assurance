-- Publish assessment results: an assessor's findings decide nothing until the draft results
-- revision that holds them is published. A program's control status, its traces and its posture
-- read the findings of published results only, and a published revision, with its findings, no
-- longer changes (attach_record_lifecycle and attach_parent_immutability in the workflow schema).
-- A draft holding findings waits in the Review queue as Assessment results to publish.
--
-- One command publishes one draft results revision, in one request:
--
--   publish_assessment_results  at the revision the reader saw, and with the findings the reader
--                               was told it holds, so results that changed since they were read
--                               are refused rather than frozen unseen. It records when and by whom
--                               (published_by_party_id, the caller's party in the workspace).
--
-- It refuses, in words a reader can act on, results already published, results that changed since
-- they were read (another revision, or another number of findings), results with no finding,
-- results the workspace does not hold, and a caller who may not write to the workspace. Each
-- request is answered once: its id keeps a private receipt, so the same request sent again returns
-- its first answer and writes nothing, and the id sent for other results is refused. A direct
-- update of the revision's state stays possible, as before, for the seeds and the tests that
-- publish that way.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- Receipts: what each publication first answered. A revision is published once, so it has at most
-- one receipt.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.assessment_results_requests (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  results_revision_id uuid not null unique,
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  -- A receipt goes with its results revision, so it never keeps one from being removed.
  foreign key (tenant_id, results_revision_id)
    references public.assessment_results_revisions(tenant_id, id) on delete cascade
);
alter table public.assessment_results_requests enable row level security;
revoke all on public.assessment_results_requests from public, anon, authenticated;
comment on table public.assessment_results_requests is 'Private receipts of publish_assessment_results: a request sent again returns what it first answered, and one sent for other assessment results conflicts. No client reads them.';

-- ---------------------------------------------------------------------------------------------
-- Publish assessment results.
-- ---------------------------------------------------------------------------------------------
create or replace function public.publish_assessment_results(
  p_tenant_id uuid,
  p_results_revision_id uuid,
  p_expected_revision bigint,
  p_expected_findings integer,
  p_request_id uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_receipt public.assessment_results_requests;
  v_results public.assessment_results_revisions;
  v_campaign public.assessment_campaigns;
  v_findings integer;
  v_party uuid;
  v_result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can publish assessment results' using errcode = '42501';
  end if;
  if p_results_revision_id is null or p_request_id is null or p_expected_revision is null
    or p_expected_findings is null then
    raise exception 'Choose the assessment results to publish, at the revision you read' using errcode = '22023';
  end if;
  -- One answer per request: the same request sent again answers as it first did, whatever has
  -- happened to the results since.
  perform pg_advisory_xact_lock(hashtextextended('assessment-results-publish/' || p_request_id::text, 0));
  select * into v_receipt from public.assessment_results_requests r where r.id = p_request_id;
  if found then
    if v_receipt.tenant_id <> p_tenant_id or v_receipt.results_revision_id <> p_results_revision_id then
      raise exception 'This request already published other assessment results. Publish these again.' using errcode = 'PT409';
    end if;
    return v_receipt.result;
  end if;
  -- The revision, held until the transaction ends: a finding recorded, changed or removed in the
  -- meantime waits for the publication (guard_published_parent reads the revision for share), and
  -- is then refused, since the revision is published.
  select * into v_results from public.assessment_results_revisions
    where tenant_id = p_tenant_id and id = p_results_revision_id for no key update;
  if v_results.id is null then
    raise exception 'These assessment results are no longer available; reload and try again' using errcode = 'P0002';
  end if;
  if v_results.state = 'published' then
    raise exception 'These assessment results were already published. Reload to see them.' using errcode = '23514';
  end if;
  if v_results.revision is distinct from p_expected_revision then
    raise exception 'These assessment results changed since you read them. Reload them before publishing.' using errcode = 'PT409';
  end if;
  select count(*) into v_findings from public.assessment_findings f
    where f.tenant_id = p_tenant_id and f.assessment_results_revision_id = p_results_revision_id;
  if v_findings = 0 then
    raise exception 'Record a finding before publishing these assessment results' using errcode = '23514';
  end if;
  if v_findings <> p_expected_findings then
    raise exception 'These assessment results now hold % findings. Reload them before publishing.', v_findings
      using errcode = 'PT409';
  end if;
  select p.id into v_party from public.parties p
    where p.tenant_id = p_tenant_id and p.auth_user_id = auth.uid();
  update public.assessment_results_revisions
    set state = 'published', published_at = now(), published_by_party_id = v_party,
      revision = revision + 1
    where tenant_id = p_tenant_id and id = p_results_revision_id
    returning * into v_results;
  select g.* into v_campaign from public.assessment_plan_revisions pl
    join public.assessment_campaigns g on g.tenant_id = pl.tenant_id and g.id = pl.campaign_id
    where pl.tenant_id = p_tenant_id and pl.id = v_results.assessment_plan_revision_id;
  v_result := jsonb_build_object(
    'resultsRevisionId', v_results.id,
    'campaignId', v_campaign.id,
    'programId', v_campaign.program_id,
    'versionNumber', v_results.version_number,
    'findings', v_findings,
    'publishedAt', v_results.published_at);
  insert into public.assessment_results_requests (id, tenant_id, results_revision_id, result, created_by)
    values (p_request_id, p_tenant_id, v_results.id, v_result, auth.uid());
  return v_result;
end;
$$;
revoke all on function public.publish_assessment_results(uuid, uuid, bigint, integer, uuid) from public, anon;
grant execute on function public.publish_assessment_results(uuid, uuid, bigint, integer, uuid) to authenticated;
comment on function public.publish_assessment_results(uuid, uuid, bigint, integer, uuid) is 'Publish a draft assessment results revision, at the revision the reader saw and holding the number of findings the reader was told, in one transaction: its findings then count toward the program''s control status, traces and posture, and no longer change. Results already published, changed since they were read, holding no finding or not in the workspace are refused, as is a caller who may not write to the workspace. The request id is chosen once per publication: the same request sent again returns its first answer.';
