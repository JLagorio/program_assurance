-- Plan delta by objective, and a campaign's objectives in the catalog's reading order.
--
-- Plan delta assessment (plan_delta_assessment, 20261112130000_product_assurance; its "no longer
-- available" refusal is PT404 since 20261114051000) wrote each control a variant owes as one plan
-- objective, titled by its code and title and aimed at its statement. Add to assessment campaign
-- and Plan an assessment write a control as the assessment objectives it counts since
-- 20261114073741_plan_by_objective, and the delta now does too (Josef, 2026-11-14: "Plan delta by
-- objective"):
--
--   a control the variant owes that counts      one plan objective an objective it counts, in the
--   objectives                                  catalog's reading order, titled by its label and
--                                               text and aimed at its part (assessment_objective_title)
--   one that counts none                        one plan objective aimed at its statement, titled by
--                                               its code and title, as before
--   one with neither (none in SP 800-53 Rev 5)  one plan objective aimed at nothing, titled by its
--                                               code and title, as before
--
-- Every objective of a control still says why the control is owed ("Changed here: Core element
-- (software).", "Program only: the product gives nothing for this control in this variant."). The
-- parts are control_assessment_parts', the list add_control_objectives writes through for the other
-- two commands; the plan is new, so it holds none of them yet, and the controls owed are the ones
-- variant_control_delta reads from the variant's adopted baseline, as before (no control is refused
-- for its SSP's). The command keeps its checks, its PT404 refusal, its advisory lock and its receipt
-- (the campaign's id is the request's, so the same request sent again plans nothing more); its
-- answer gains `controls`, and a request sent again counts the objectives of the plan it made.
--
--   delta_assessment_parts        what a delta assessment of a variant takes: each control it owes,
--                                 why, and the parts an assessment of the control takes
--   delta_assessment_objectives   the read behind Plan delta assessment's Dialog: how many controls
--                                 the variant owes and how many objectives the plan will hold
--
-- A campaign's Objectives, on its record and on the Assessment campaigns page, are read from
-- assessment_objective_rows (Josef, 2026-11-14: "Objectives in reading order"): each objective with
-- its campaign and program, what it is aimed at (target_kind, the control part's kind, and
-- target_label, an assessment objective's label as SP 800-53A prints it, AC-08a.01) and its place in
-- the catalog's reading order (reading_order: the control's code in natural order, AC-2 before
-- AC-10, then the part's ordinal under each part above it, so a heading comes before the objectives
-- under it and a control's statement before its objectives). Neither screen pages on the server, so
-- they order on the client by it.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- What a delta assessment of a variant takes.
-- ---------------------------------------------------------------------------------------------
-- One row a part an assessment of each control the variant owes takes (control_assessment_parts:
-- each objective the control counts, with its place in the catalog's reading order, else its
-- statement), with the control's code, title, delta and the changed elements behind it, from a
-- variant_control_delta answer. A control with neither an objective nor a statement has one row
-- with no part. An answer with no controls (a system not created from a product) has no row.
create or replace function public.delta_assessment_parts(p_delta jsonb)
returns table (control_id uuid, code text, title text, delta text, changed_elements jsonb,
  part_id uuid, objective boolean, place integer[])
language sql stable security invoker set search_path = '' as $$
  with
  owed as materialized (
    select (c->>'id')::uuid as control_id, c->>'code' as code, c->>'title' as title, c->>'delta' as delta,
      coalesce(c->'changed_elements', '[]'::jsonb) as changed_elements
    from jsonb_array_elements(coalesce(p_delta->'controls', '[]'::jsonb)) c
    where c->>'delta' in ('changed_here', 'program_only')
  ),
  part as materialized (
    select a.control_id, a.part_id, a.objective, a.place
    from public.control_assessment_parts(array(select o.control_id from owed o)) a
  )
  select o.control_id, o.code, o.title, o.delta, o.changed_elements,
    p.part_id, coalesce(p.objective, false), coalesce(p.place, array[]::integer[])
  from owed o
  left join part p on p.control_id = o.control_id;
$$;
revoke all on function public.delta_assessment_parts(jsonb) from public, anon;
grant execute on function public.delta_assessment_parts(jsonb) to authenticated;
comment on function public.delta_assessment_parts(jsonb) is 'Internal: what a delta assessment of a variant takes, from a variant_control_delta answer. One row a part an assessment of each control the variant owes (changed here or the program''s only) takes, as control_assessment_parts lists them: each assessment objective the control counts, with its place in the catalog''s reading order, else its statement; a control with neither has one row with no part. Each row carries the control''s code, title, delta and the changed elements behind it. Reference data only; security invoker. plan_delta_assessment and delta_assessment_objectives read it.';

-- How many controls the variant owes and how many objectives a delta assessment planned now would
-- hold: the count Plan delta assessment's Dialog says before the command runs.
create or replace function public.delta_assessment_objectives(p_tenant_id uuid, p_system_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare answer jsonb;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'system_id', p_system_id,
    'controls', count(distinct d.control_id),
    'objectives', count(*)
  ) into answer
  from public.delta_assessment_parts(public.variant_control_delta_answer(p_tenant_id, p_system_id)) d;
  return answer;
end; $$;
revoke all on function public.delta_assessment_objectives(uuid, uuid) from public, anon;
grant execute on function public.delta_assessment_objectives(uuid, uuid) to authenticated;
comment on function public.delta_assessment_objectives(uuid, uuid) is 'What a delta assessment of a variant planned now would hold, for Plan delta assessment''s Dialog: controls (how many the variant owes an assessment on, changed here or the program''s only) and objectives (how many plan objectives they make: each assessment objective a control counts, or one for a control that counts none). A system not created from a product owes nothing (0 and 0); a system the reader cannot read is refused as variant_control_delta refuses it. Security invoker.';

-- ---------------------------------------------------------------------------------------------
-- The command: each control the variant owes as the assessment objectives it counts.
-- ---------------------------------------------------------------------------------------------
-- Redefined from its definition as 20261114051000 left it: the same checks, refusals (PT404 for a
-- system that is gone), advisory lock, receipt and campaign; only the objectives it writes, the
-- plan's description and the answer change.
create or replace function public.plan_delta_assessment(p_tenant_id uuid, p_system_id uuid, p_request_id uuid, p_title text default null::text)
returns jsonb
language plpgsql security definer set search_path to '' as $function$
declare
  v_system public.systems;
  v_delta jsonb;
  v_ssp public.ssp_revisions;
  v_campaign public.assessment_campaigns;
  v_plan uuid := gen_random_uuid();
  v_title text;
  v_objectives integer;
begin
  if auth.uid() is null or not public.can_write_tenant(p_tenant_id) then
    raise exception 'An editor, admin, or owner can plan an assessment' using errcode = '42501';
  end if;
  if p_request_id is null then
    raise exception 'The request identifier is missing' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || '/delta-assessment/' || p_request_id::text, 0));
  select * into v_campaign from public.assessment_campaigns where id = p_request_id;
  if found then
    if v_campaign.tenant_id <> p_tenant_id then
      raise exception 'This request was already used' using errcode = 'PT409';
    end if;
    -- The same request again answers the plan it made and what that plan holds, and writes nothing.
    select pr.id into v_plan from public.assessment_plan_revisions pr
      where pr.tenant_id = p_tenant_id and pr.campaign_id = v_campaign.id order by pr.version_number limit 1;
    return jsonb_build_object('campaignId', v_campaign.id, 'created', false, 'planRevisionId', v_plan,
      'objectives', (select count(*) from public.assessment_objectives o
        where o.tenant_id = p_tenant_id and o.plan_revision_id = v_plan),
      'controls', (select count(distinct coalesce(cp.control_id, o.id)) from public.assessment_objectives o
        left join public.control_parts cp on cp.id = o.target_control_part_id
        where o.tenant_id = p_tenant_id and o.plan_revision_id = v_plan));
  end if;
  select * into v_system from public.systems where tenant_id = p_tenant_id and id = p_system_id;
  if v_system.id is null then
    raise exception 'This system is no longer available; reload and try again' using errcode = 'PT404';
  end if;
  if v_system.product_configuration_id is null then
    raise exception 'A delta assessment is planned for a system created from a product' using errcode = '23514';
  end if;
  select * into v_ssp from public.ssp_revisions
    where tenant_id = p_tenant_id and system_id = p_system_id and state = 'published'
    order by version_number desc limit 1;
  if v_ssp.id is null then
    raise exception 'Publish this system''s SSP before planning its delta assessment' using errcode = '23514';
  end if;
  v_delta := public.variant_control_delta(p_tenant_id, p_system_id);
  if not exists (select 1 from jsonb_array_elements(v_delta->'controls') c where c->>'delta' in ('changed_here', 'program_only')) then
    raise exception 'This variant owes no assessment: every control is inherited or shared' using errcode = '23514';
  end if;
  v_title := coalesce(nullif(btrim(coalesce(p_title, '')), ''), v_system.name || ' delta assessment');
  insert into public.assessment_campaigns (id, tenant_id, title, description, program_id, status, variant_system_id)
    values (p_request_id, p_tenant_id, v_title,
      format('The controls %s owes an assessment on against %s version %s, %s: %s changed here and %s the program''s only. %s inherited and %s shared are left to the product''s assessment.',
        v_system.name, v_delta->'product'->>'name', v_delta->'product'->>'version', v_delta->'product'->>'configuration',
        v_delta->'totals'->>'changed_here', v_delta->'totals'->>'program_only',
        v_delta->'totals'->>'inherited', v_delta->'totals'->>'shared'),
      v_system.program_id, 'planned', p_system_id);
  insert into public.assessment_plan_revisions (id, tenant_id, version_number, campaign_id, ssp_revision_id, title, description)
    values (v_plan, p_tenant_id, 1, p_request_id, v_ssp.id, v_title,
      'Each control that is changed here or the program''s only, as the assessment objectives it counts.');
  -- One objective a part an assessment of each owed control takes, in the controls' code order and
  -- each control's reading order, each saying why its control is owed.
  insert into public.assessment_objectives (tenant_id, plan_revision_id, title, description, target_control_part_id)
  select p_tenant_id, v_plan,
    case when d.part_id is null then d.code || ' ' || d.title else public.assessment_objective_title(d.part_id) end,
    case when d.delta = 'program_only' then 'Program only: the product gives nothing for this control in this variant.'
      else 'Changed here: ' || coalesce((select string_agg(
          (e->>'name') || case when e->>'change' = 'removed' then ' (removed)'
            else ' (' || coalesce((select string_agg(k.value, ', ' order by k.value) from jsonb_array_elements_text(e->'kinds') k), 'modified') || ')' end,
          '; ' order by e->>'code') from jsonb_array_elements(d.changed_elements) e), 'an element behind it changed') || '.'
    end,
    d.part_id
  from public.delta_assessment_parts(v_delta) d
  order by public.natural_sort_key(d.code) collate "C", d.place, d.part_id;
  get diagnostics v_objectives = row_count;
  return jsonb_build_object('campaignId', p_request_id, 'created', true, 'planRevisionId', v_plan,
    'sspRevisionId', v_ssp.id, 'objectives', v_objectives,
    'controls', (v_delta->'totals'->>'changed_here')::integer + (v_delta->'totals'->>'program_only')::integer,
    'changedHere', (v_delta->'totals'->>'changed_here')::integer, 'programOnly', (v_delta->'totals'->>'program_only')::integer);
end;
$function$;
revoke all on function public.plan_delta_assessment(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.plan_delta_assessment(uuid, uuid, uuid, text) to authenticated;
comment on function public.plan_delta_assessment(uuid, uuid, uuid, text) is 'Plan the delta assessment of a product variant, in one transaction: a planned assessment campaign of its program that names the variant, a draft plan pinned to the variant''s latest published SSP, and each control the variant owes an assessment on (changed here or the program''s only, variant_control_delta) as the assessment objectives it counts, one plan objective each, titled by its label and text and aimed at its part, or, for a control that counts none, one objective aimed at its statement, titled by its code and title; each objective says why its control is owed. The request id becomes the campaign''s id: the same request sent again answers the plan it made and plans nothing more. Refused: a system that is gone (PT404), one not created from a product, one whose SSP is not published, one that owes nothing. The answer says the objectives written, the controls owed and how many are changed here and the program''s only.';

-- ---------------------------------------------------------------------------------------------
-- A campaign's objectives, in the catalog's reading order.
-- ---------------------------------------------------------------------------------------------
-- The objectives of the reader's campaigns: every column of the objective, the campaign and the
-- program its plan belongs to (what the screens scope by), what it is aimed at and its place in the
-- catalog's reading order. An objective aimed at a requirement revision, or at nothing, has no
-- target kind and no place.
--
-- The place is compared character by character: the control's code in natural order
-- (natural_sort_key: AC-2 before AC-10, AC-2 before AC-2(1)), a space, then the part's ordinal under
-- each part above it from the control's top, six digits each. A part comes right after the part that
-- holds it, so a heading comes before the objectives under it, and a control's top parts keep the
-- catalog's order: its statement before its objectives. The parts above are joined level by level
-- (the catalog nests five; seven are read), which reads the developer workspace's 1,232 objectives
-- in about a tenth of the time a recursive walk a row took.
create or replace view public.assessment_objective_rows with (security_invoker = true) as
select o.*,
  pr.campaign_id,
  c.program_id,
  cp.name as target_kind,
  case when cp.name = 'assessment-objective' then coalesce(
    (select x->>'value' from jsonb_array_elements(cp.props) x where x->>'name' = 'label' limit 1), k.code)
  end as target_label,
  case when k.id is not null then (public.natural_sort_key(k.code) || ' ' || concat_ws('.',
    lpad(p6.ordinal::text, 6, '0'), lpad(p5.ordinal::text, 6, '0'), lpad(p4.ordinal::text, 6, '0'),
    lpad(p3.ordinal::text, 6, '0'), lpad(p2.ordinal::text, 6, '0'), lpad(p1.ordinal::text, 6, '0'),
    lpad(cp.ordinal::text, 6, '0'))) collate "C"
  end as reading_order
from public.assessment_objectives o
join public.assessment_plan_revisions pr on pr.tenant_id = o.tenant_id and pr.id = o.plan_revision_id
join public.assessment_campaigns c on c.tenant_id = pr.tenant_id and c.id = pr.campaign_id
left join public.control_parts cp on cp.id = o.target_control_part_id
left join public.controls k on k.id = cp.control_id
left join public.control_parts p1 on p1.id = cp.parent_part_id
left join public.control_parts p2 on p2.id = p1.parent_part_id
left join public.control_parts p3 on p3.id = p2.parent_part_id
left join public.control_parts p4 on p4.id = p3.parent_part_id
left join public.control_parts p5 on p5.id = p4.parent_part_id
left join public.control_parts p6 on p6.id = p5.parent_part_id;
revoke all on public.assessment_objective_rows from public, anon;
grant select on public.assessment_objective_rows to authenticated;
comment on view public.assessment_objective_rows is 'A campaign''s objectives as its Objectives collections read them, on the campaign record and the Assessment campaigns page: every column of the objective, its plan''s campaign_id and that campaign''s program_id, target_kind (the kind of control part it is aimed at: assessment-objective, statement), target_label (an assessment objective''s label as SP 800-53A prints it, AC-08a.01) and reading_order (the target''s place in the catalog''s reading order, compared character by character: the control''s code in natural order, then the part''s ordinal under each part above it; none without a control part). Security invoker.';

notify pgrst, 'reload schema';
