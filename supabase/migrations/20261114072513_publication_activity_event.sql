-- A publication of assessment results is recorded in its program's activity.
--
-- publish_assessment_results freezes a draft results revision and records who published it
-- (published_by_party_id), but wrote no activity event, so the Portfolio's Recent activity and a
-- program's Activity never said who published. It now writes one event in the same transaction:
--
--   actor_party_id          the caller's party in the workspace, as published_by_party_id
--   program_id              the program the campaign belongs to
--   assessment_campaign_id  the campaign whose plan the results revision belongs to (a results
--                           revision has no page of its own; the campaign record lists it)
--   event_type              'published'
--   description             "published assessment results of <campaign>", then on a second line
--                           "<results>: <n> findings.", the words the feeds draw after the person
--                           ("Priya Raghavan published assessment results of …")
--   occurred_at             the publication's moment (published_at), where program_activity
--                           places the program
--
-- An event named its program or the one record of it the event is about, never both
-- (num_nonnulls(...) = 1). It may now name a record's program beside the record, so the program's
-- Activity (events naming the program) and the feeds' program read the publication, while its link
-- leads to the campaign. The program named beside a record must be that record's own program,
-- which a trigger checks as requirement_context checks a requirement's. Every event written before
-- names one target, as before.
--
-- The answer names the event (activityEventId), and the receipt keeps it: the same request sent
-- again answers as it first did and writes no second event. A refused publication writes none. A
-- direct update of a revision's state, as the seeds and the tests publish, writes no event, and
-- results published before this migration get none: nothing is backfilled.
--
-- The function is redefined from its definition as the migrations before this one left it
-- (20261114051000 raises PT404 where 20261114025500 raised P0002), with only the event added.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- The program named beside a record is that record's own program.
-- ---------------------------------------------------------------------------------------------
create or replace function public.guard_activity_event_program() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_program uuid;
begin
  if new.program_id is null
    or coalesce(new.task_id, new.issue_id, new.risk_id, new.poam_item_id, new.assessment_campaign_id,
      new.evidence_artifact_id, new.package_id) is null then
    return new;
  end if;
  select coalesce(
    (select t.program_id from public.tasks t where t.tenant_id = new.tenant_id and t.id = new.task_id),
    (select i.program_id from public.operational_issues i
      where i.tenant_id = new.tenant_id and i.id = new.issue_id),
    (select r.program_id from public.risks r where r.tenant_id = new.tenant_id and r.id = new.risk_id),
    (select d.program_id from public.poam_items p
      join public.poam_documents d on d.tenant_id = p.tenant_id and d.id = p.poam_document_id
      where p.tenant_id = new.tenant_id and p.id = new.poam_item_id),
    (select c.program_id from public.assessment_campaigns c
      where c.tenant_id = new.tenant_id and c.id = new.assessment_campaign_id),
    (select a.program_id from public.evidence_artifacts a
      where a.tenant_id = new.tenant_id and a.id = new.evidence_artifact_id),
    (select k.program_id from public.authorization_packages k
      where k.tenant_id = new.tenant_id and k.id = new.package_id))
  into v_program;
  if v_program is distinct from new.program_id then
    raise exception 'An activity event that names a record''s program beside it names the record''s own program'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_activity_event_program() from public, anon, authenticated;
comment on function public.guard_activity_event_program() is 'Refuses an activity event that names a program beside a record (a task, an operational issue, a risk, a remediation item, an assessment campaign, an evidence artifact or an authorization package) of another program, or of none.';

-- ---------------------------------------------------------------------------------------------
-- An event names its program, one record of it, or that record and its program.
-- ---------------------------------------------------------------------------------------------
alter table public.activity_events drop constraint if exists activity_events_check;
alter table public.activity_events drop constraint if exists activity_events_target;
alter table public.activity_events add constraint activity_events_target check (
  num_nonnulls(task_id, issue_id, risk_id, poam_item_id, assessment_campaign_id, evidence_artifact_id, package_id) <= 1
  and num_nonnulls(program_id, task_id, issue_id, risk_id, poam_item_id, assessment_campaign_id, evidence_artifact_id, package_id) >= 1
);
comment on constraint activity_events_target on public.activity_events is 'An event names its program, or the one record of the program it is about, or that record and its program (which guard_activity_event_program keeps the record''s own).';

drop trigger if exists activity_program on public.activity_events;
create trigger activity_program before insert on public.activity_events
  for each row execute function public.guard_activity_event_program();

-- ---------------------------------------------------------------------------------------------
-- Publish assessment results, and record the publication in the program's activity.
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
  v_event uuid;
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
    raise exception 'These assessment results are no longer available; reload and try again' using errcode = 'PT404';
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
  -- The publication in the program's activity: who published, the campaign the entry links to, and
  -- what was frozen, in the words the feeds draw after the person.
  insert into public.activity_events (tenant_id, program_id, assessment_campaign_id, actor_party_id,
      event_type, description, occurred_at)
    values (p_tenant_id, v_campaign.program_id, v_campaign.id, v_party, 'published',
      format(E'published assessment results of %s\n%s: %s.',
        regexp_replace(btrim(v_campaign.title), '\s+', ' ', 'g'),
        regexp_replace(btrim(v_results.title), '\s+', ' ', 'g'),
        case when v_findings = 1 then '1 finding' else v_findings::text || ' findings' end),
      v_results.published_at)
    returning id into v_event;
  v_result := jsonb_build_object(
    'resultsRevisionId', v_results.id,
    'campaignId', v_campaign.id,
    'programId', v_campaign.program_id,
    'versionNumber', v_results.version_number,
    'findings', v_findings,
    'publishedAt', v_results.published_at,
    'activityEventId', v_event);
  insert into public.assessment_results_requests (id, tenant_id, results_revision_id, result, created_by)
    values (p_request_id, p_tenant_id, v_results.id, v_result, auth.uid());
  return v_result;
end;
$$;
revoke all on function public.publish_assessment_results(uuid, uuid, bigint, integer, uuid) from public, anon;
grant execute on function public.publish_assessment_results(uuid, uuid, bigint, integer, uuid) to authenticated;
comment on function public.publish_assessment_results(uuid, uuid, bigint, integer, uuid) is 'Publish a draft assessment results revision, at the revision the reader saw and holding the number of findings the reader was told, in one transaction: its findings then count toward the program''s control status, traces and posture, and no longer change, and one activity event names who published, the program and the campaign. Results already published, changed since they were read, holding no finding or not in the workspace are refused, as is a caller who may not write to the workspace. The request id is chosen once per publication: the same request sent again returns its first answer.';

notify pgrst, 'reload schema';
