-- A control's next step, done from the control's own record: put it into an assessment.
--
-- A control of a program's control baseline whose requirements cite evidence, and which no assessor
-- has determined, reads Not assessed (program_control_status). What moves it on is an assessment
-- that holds it: an objective of the draft plan of one of the program's assessment campaigns, or,
-- where no campaign has a draft plan, a new campaign planned around it. Two commands do that, each
-- in one request:
--
--   add_controls_to_assessment_plan  adds the chosen controls to a campaign's draft plan, at the
--                                    plan revision the reader saw;
--   plan_control_assessment          plans a new campaign whose draft plan, pinned to a published
--                                    SSP of the program, holds the chosen controls.
--
-- A control is one objective of a plan, as Plan delta assessment writes it: titled by its code and
-- title, aimed at the control's statement, the part an assessor's finding judges. A plan assesses
-- its SSP, so a control the SSP's control baseline does not select is refused, and a control the
-- plan already holds is left as it is. Each request is answered once: its id keeps a private
-- receipt, so the same request sent again returns its first answer and writes nothing, and the id
-- sent with another choice is refused.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- Receipts: what each request first answered.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.assessment_plan_requests (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  campaign_id uuid not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  -- A receipt goes with its campaign, so it never keeps a campaign from being removed.
  foreign key (tenant_id, campaign_id) references public.assessment_campaigns(tenant_id, id) on delete cascade
);
create index if not exists assessment_plan_requests_campaign_idx
  on public.assessment_plan_requests (tenant_id, campaign_id);
alter table public.assessment_plan_requests enable row level security;
revoke all on public.assessment_plan_requests from public, anon, authenticated;
comment on table public.assessment_plan_requests is 'Private receipts of add_controls_to_assessment_plan and plan_control_assessment: a request sent again with the same choice returns what it first answered, and one sent with another choice conflicts. No client reads them.';

-- ---------------------------------------------------------------------------------------------
-- The controls a plan takes, as objectives: each chosen control once, the plan's SSP must select
-- it, and it is aimed at its statement. Shared by both commands; it answers the objectives it
-- added, in the controls' code order, and how many of the chosen controls the plan already held.
-- ---------------------------------------------------------------------------------------------
create or replace function public.add_control_objectives(
  p_tenant_id uuid, p_plan_revision_id uuid, p_profile_resolution_id uuid, p_control_ids uuid[]
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_selected integer; v_stated integer; v_added uuid[];
begin
  select count(distinct sc.control_id) into v_selected
    from public.selected_controls sc
    where sc.profile_resolution_id = p_profile_resolution_id and sc.control_id = any(p_control_ids);
  if v_selected <> cardinality(p_control_ids) then
    raise exception 'Add controls the control baseline of the plan''s SSP selects' using errcode = '23514';
  end if;
  select count(distinct cp.control_id) into v_stated
    from public.control_parts cp
    where cp.control_id = any(p_control_ids) and cp.parent_part_id is null and cp.name = 'statement';
  if v_stated <> cardinality(p_control_ids) then
    raise exception 'A control with no statement has nothing for an assessor to judge' using errcode = '23514';
  end if;
  with fresh as (
    select k.id, k.code, k.title,
      (select cp.id from public.control_parts cp
        where cp.control_id = k.id and cp.parent_part_id is null and cp.name = 'statement'
        order by cp.ordinal, cp.id limit 1) as part_id
    from public.controls k
    where k.id = any(p_control_ids)
      and not exists (
        select 1 from public.assessment_objectives o
        join public.control_parts held on held.id = o.target_control_part_id
        where o.tenant_id = p_tenant_id and o.plan_revision_id = p_plan_revision_id
          and held.control_id = k.id)
  ), added as (
    insert into public.assessment_objectives (tenant_id, plan_revision_id, title, target_control_part_id)
    select p_tenant_id, p_plan_revision_id, f.code || ' ' || f.title, f.part_id
    from fresh f
    order by public.natural_sort_key(f.code), f.id
    returning id
  )
  select coalesce(array_agg(a.id), '{}') into v_added from added a;
  -- The objectives in the controls' code order, whatever order the insert returned them in.
  select coalesce(array_agg(o.id order by public.natural_sort_key(o.title), o.id), '{}') into v_added
    from public.assessment_objectives o where o.id = any(v_added);
  return jsonb_build_object(
    'added', cardinality(v_added),
    'skipped', cardinality(p_control_ids) - cardinality(v_added),
    'objectiveIds', to_jsonb(v_added));
end;
$$;
revoke all on function public.add_control_objectives(uuid, uuid, uuid, uuid[]) from public, anon, authenticated;
comment on function public.add_control_objectives(uuid, uuid, uuid, uuid[]) is 'Internal to add_controls_to_assessment_plan and plan_control_assessment: one objective a chosen control the plan does not hold yet, aimed at its statement. No client calls it.';

-- The chosen controls in one spelling: each once, whatever order they were chosen in. Null when
-- the choice is empty, too long or names nothing.
create or replace function public.assessment_control_choice(p_control_ids uuid[]) returns uuid[]
language sql immutable set search_path = '' as $$
  select case
    when p_control_ids is null or cardinality(p_control_ids) not between 1 and 500
      or array_position(p_control_ids, null) is not null then null
    else (select array_agg(distinct chosen.control_id order by chosen.control_id)
      from unnest(p_control_ids) as chosen(control_id))
  end;
$$;
revoke all on function public.assessment_control_choice(uuid[]) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Add to assessment campaign: the chosen controls join a campaign's draft plan.
-- ---------------------------------------------------------------------------------------------
create or replace function public.add_controls_to_assessment_plan(
  p_tenant_id uuid,
  p_plan_revision_id uuid,
  p_expected_revision bigint,
  p_request_id uuid,
  p_control_ids uuid[]
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_ids uuid[] := public.assessment_control_choice(p_control_ids);
  v_receipt public.assessment_plan_requests;
  v_plan public.assessment_plan_revisions;
  v_campaign public.assessment_campaigns;
  v_resolution uuid;
  v_hash text;
  v_result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can add a control to an assessment plan' using errcode = '42501';
  end if;
  if p_plan_revision_id is null or p_request_id is null or v_ids is null then
    raise exception 'Choose between 1 and 500 controls to add to the assessment plan' using errcode = '23514';
  end if;
  -- One answer per request: the same request sent again answers as it first did, whatever has
  -- happened to the plan since.
  perform pg_advisory_xact_lock(hashtextextended('assessment-plan-controls/' || p_request_id::text, 0));
  v_hash := encode(extensions.digest(jsonb_build_object('command', 'add', 'planRevisionId', p_plan_revision_id,
    'controlIds', to_jsonb(v_ids))::text, 'sha256'), 'hex');
  select * into v_receipt from public.assessment_plan_requests r where r.id = p_request_id;
  if found then
    if v_receipt.tenant_id <> p_tenant_id or v_receipt.payload_sha256 <> v_hash then
      raise exception 'This request was already used for a different choice. Choose the campaign again.' using errcode = 'PT409';
    end if;
    return v_receipt.result;
  end if;
  -- One request at a time per plan, so a control is never added to it twice.
  select * into v_plan from public.assessment_plan_revisions
    where tenant_id = p_tenant_id and id = p_plan_revision_id for no key update;
  if v_plan.id is null then
    raise exception 'This assessment plan is no longer available; reload and try again' using errcode = 'P0002';
  end if;
  if v_plan.state <> 'draft' then
    raise exception 'This assessment plan is published: add the control to a campaign''s draft plan' using errcode = '23514';
  end if;
  if v_plan.revision is distinct from p_expected_revision then
    raise exception 'This assessment plan changed. Reload it before adding to it.' using errcode = 'PT409';
  end if;
  select * into v_campaign from public.assessment_campaigns
    where tenant_id = p_tenant_id and id = v_plan.campaign_id;
  if v_campaign.status in ('completed', 'cancelled') then
    raise exception 'This assessment campaign is %: add the control to one that is planned or active', v_campaign.status
      using errcode = '23514';
  end if;
  select r.profile_resolution_id into v_resolution from public.ssp_revisions r
    where r.tenant_id = p_tenant_id and r.id = v_plan.ssp_revision_id;
  v_result := jsonb_build_object('campaignId', v_campaign.id, 'planRevisionId', v_plan.id)
    || public.add_control_objectives(p_tenant_id, v_plan.id, v_resolution, v_ids);
  insert into public.assessment_plan_requests (id, tenant_id, campaign_id, payload_sha256, result, created_by)
    values (p_request_id, p_tenant_id, v_campaign.id, v_hash, v_result, auth.uid());
  return v_result;
end;
$$;
revoke all on function public.add_controls_to_assessment_plan(uuid, uuid, bigint, uuid, uuid[]) from public, anon;
grant execute on function public.add_controls_to_assessment_plan(uuid, uuid, bigint, uuid, uuid[]) to authenticated;
comment on function public.add_controls_to_assessment_plan(uuid, uuid, bigint, uuid, uuid[]) is 'Add the chosen controls to a draft assessment plan, at the plan revision the reader saw, in one transaction: one objective a control, titled by its code and title and aimed at its statement. A control the plan''s SSP does not select is refused, one the plan already holds is skipped, and a completed or cancelled campaign takes none. The request id is chosen once per choice: the same request sent again returns its first answer and adds nothing.';

-- ---------------------------------------------------------------------------------------------
-- Plan an assessment: a new campaign of the program, its draft plan pinned to a published SSP of
-- one of the program's systems, holding the chosen controls.
-- ---------------------------------------------------------------------------------------------
create or replace function public.plan_control_assessment(
  p_tenant_id uuid,
  p_program_id uuid,
  p_ssp_revision_id uuid,
  p_title text,
  p_request_id uuid,
  p_control_ids uuid[]
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_ids uuid[] := public.assessment_control_choice(p_control_ids);
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_receipt public.assessment_plan_requests;
  v_ssp public.ssp_revisions;
  v_campaign uuid := gen_random_uuid();
  v_plan uuid := gen_random_uuid();
  v_hash text;
  v_result jsonb;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can plan an assessment' using errcode = '42501';
  end if;
  if p_program_id is null or p_ssp_revision_id is null or p_request_id is null or v_ids is null then
    raise exception 'Choose between 1 and 500 controls to plan an assessment of' using errcode = '23514';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('assessment-plan-controls/' || p_request_id::text, 0));
  v_hash := encode(extensions.digest(jsonb_build_object('command', 'plan', 'programId', p_program_id,
    'sspRevisionId', p_ssp_revision_id, 'title', v_title, 'controlIds', to_jsonb(v_ids))::text, 'sha256'), 'hex');
  select * into v_receipt from public.assessment_plan_requests r where r.id = p_request_id;
  if found then
    if v_receipt.tenant_id <> p_tenant_id or v_receipt.payload_sha256 <> v_hash then
      raise exception 'This request was already used for a different choice. Plan the assessment again.' using errcode = 'PT409';
    end if;
    return v_receipt.result;
  end if;
  if v_title is null then
    raise exception 'Enter the assessment campaign''s title' using errcode = '23514';
  end if;
  if length(v_title) > 300 then
    raise exception 'Shorten the title to 300 characters or fewer' using errcode = '23514';
  end if;
  if not exists (select 1 from public.programs p where p.tenant_id = p_tenant_id and p.id = p_program_id) then
    raise exception 'This program is no longer available; reload and try again' using errcode = 'P0002';
  end if;
  select r.* into v_ssp from public.ssp_revisions r
    join public.systems s on s.tenant_id = r.tenant_id and s.id = r.system_id
    where r.tenant_id = p_tenant_id and r.id = p_ssp_revision_id and s.program_id = p_program_id;
  if v_ssp.id is null then
    raise exception 'Choose an SSP of one of this program''s systems' using errcode = '23514';
  end if;
  if v_ssp.state <> 'published' then
    raise exception 'Publish the SSP before planning an assessment of it' using errcode = '23514';
  end if;
  insert into public.assessment_campaigns (id, tenant_id, title, program_id, status)
    values (v_campaign, p_tenant_id, v_title, p_program_id, 'planned');
  insert into public.assessment_plan_revisions (id, tenant_id, version_number, campaign_id, ssp_revision_id, title)
    values (v_plan, p_tenant_id, 1, v_campaign, v_ssp.id, v_title);
  v_result := jsonb_build_object('campaignId', v_campaign, 'planRevisionId', v_plan)
    || public.add_control_objectives(p_tenant_id, v_plan, v_ssp.profile_resolution_id, v_ids);
  insert into public.assessment_plan_requests (id, tenant_id, campaign_id, payload_sha256, result, created_by)
    values (p_request_id, p_tenant_id, v_campaign, v_hash, v_result, auth.uid());
  return v_result;
end;
$$;
revoke all on function public.plan_control_assessment(uuid, uuid, uuid, text, uuid, uuid[]) from public, anon;
grant execute on function public.plan_control_assessment(uuid, uuid, uuid, text, uuid, uuid[]) to authenticated;
comment on function public.plan_control_assessment(uuid, uuid, uuid, text, uuid, uuid[]) is 'Plan an assessment of the chosen controls, in one transaction: a planned assessment campaign of the program with the given title, a draft plan pinned to a published SSP of one of the program''s systems, and one objective a control, titled by its code and title and aimed at its statement. A control the SSP does not select is refused. The request id is chosen once per choice: the same request sent again returns its first answer and plans nothing more.';

notify pgrst, 'reload schema';
