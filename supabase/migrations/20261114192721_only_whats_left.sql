-- Only what's left: a control its assessors have judged in part joins an assessment plan as the
-- objectives nobody has judged.
--
-- Add to assessment campaign and Plan an assessment write a control as the assessment objectives it
-- counts that the plan does not hold yet (20261114073741_plan_by_objective). A program's assessors
-- decide a control once they have judged every objective it counts
-- (20261114144036_not_assessed_until_all, 20261114165512_latest_per_objective), so a control judged
-- on some of its objectives waits on the rest; yet an assessment of it took every objective again:
-- AC-2 with 3 of its 26 objectives judged took all 26, and a plan holding the 23 left took the 3
-- judged ones it lacked. Both commands now write only what is left (Josef, 2026-11-14: "Only what's
-- left"):
--
--   a control judged in part        some of the objectives it counts judged by the plan's program's
--                                   assessors (program_control_objective_judgments) and not all:
--                                   the objectives nobody has judged that the plan does not hold
--                                   yet. AC-2 with 3 judged takes 23, and a plan that holds 5 of
--                                   them takes the other 18; one that holds all 23 takes nothing
--                                   (skipped)
--   a control nobody has judged     every objective it counts, or its statement for one that counts
--                                   none, as before
--   a control judged on every one   every objective it counts, as before: its next step never offers
--                                   an assessment, and one asked for all the same reassesses the
--                                   whole control
--
--   add_control_objectives   the helper both commands write through reads the judgments of the
--                            plan's program and leaves out the judged objectives of a control
--                            judged in part. Its answer gains `judged`, how many it left out, which
--                            the toasts say ("23 objectives of AC-2 nobody has judged added to
--                            Continuous monitoring FY2027"); a control counts as skipped once the
--                            plan holds everything it takes
--   plan_control_holdings    names the program whose campaigns it is asked about (p_program_id)
--                            and answers how many of the control's objectives that program's
--                            assessors have judged (objectives_assessed), and of each plan how many
--                            of the objectives its program has not judged it holds
--                            (unjudged_held), which Add to assessment campaign's picker says
--                            ("Holds 5 of 23 objectives nobody has judged"). Its arguments change,
--                            so it is dropped and created again; the program is optional, so a
--                            caller that names none reads what it read before
--
-- add_controls_to_assessment_plan and plan_control_assessment keep their bodies (their receipts,
-- their revision check, their refusals and their words): only the helper they share changes, and
-- what they say of themselves. A request sent again answers as it first did, so a receipt kept from
-- before this migration answers with no `judged`.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- The helper both commands write through: what is left of each chosen control that the plan does
-- not hold yet.
-- ---------------------------------------------------------------------------------------------
create or replace function public.add_control_objectives(
  p_tenant_id uuid, p_plan_revision_id uuid, p_profile_resolution_id uuid, p_control_ids uuid[]
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_program uuid; v_selected integer; v_assessable integer; v_counted integer; v_skipped integer;
  v_judged uuid[] := '{}'; v_added uuid[];
begin
  select count(distinct sc.control_id) into v_selected
    from public.selected_controls sc
    where sc.profile_resolution_id = p_profile_resolution_id and sc.control_id = any(p_control_ids);
  if v_selected <> cardinality(p_control_ids) then
    raise exception 'Add controls the control baseline of the plan''s SSP selects' using errcode = '23514';
  end if;
  -- Of each control the plan's program has judged in part (some of the objectives it counts, not
  -- all), the objectives its assessors have judged: they are left out, so the plan takes only the
  -- ones nobody has judged. A control judged on none of them, or on every one, leaves out nothing.
  select g.program_id into v_program
    from public.assessment_plan_revisions r
    join public.assessment_campaigns g on g.tenant_id = r.tenant_id and g.id = r.campaign_id
    where r.tenant_id = p_tenant_id and r.id = p_plan_revision_id;
  if v_program is not null then
    with
    counted as materialized (
      select a.control_id, a.part_id, count(*) over (partition by a.control_id) as objectives
      from public.control_assessment_parts(p_control_ids) a
      where a.objective
    ),
    judged as materialized (
      select c.part_id, c.objectives, count(*) over (partition by c.control_id) as assessed
      from public.program_control_objective_judgments(v_program, p_control_ids) j
      join counted c on c.control_id = j.control_id and c.part_id = j.objective_id
    )
    select coalesce(array_agg(j.part_id), '{}') into v_judged
      from judged j
      where j.assessed < j.objectives;
  end if;
  -- What the plan holds of each chosen control: the controls it can take, the objectives they count
  -- and how many controls it holds everything an assessment takes of already.
  select count(distinct h.control_id),
    count(*) filter (where h.objective),
    count(distinct h.control_id)
      - count(distinct h.control_id) filter (where not h.held and h.part_id <> all(v_judged))
    into v_assessable, v_counted, v_skipped
    from public.assessment_plan_control_parts(array[p_plan_revision_id], p_control_ids) h;
  if v_assessable <> cardinality(p_control_ids) then
    raise exception 'A control with no statement and no assessment objective has nothing for an assessor to judge'
      using errcode = '23514';
  end if;
  -- One objective a part an assessment takes that the plan does not hold yet, in the controls' code
  -- order and each control's reading order.
  with fresh as (
    select h.part_id, h.place, public.natural_sort_key(k.code) collate "C" as code_order,
      public.assessment_objective_title(h.part_id) as title
    from public.assessment_plan_control_parts(array[p_plan_revision_id], p_control_ids) h
    join public.controls k on k.id = h.control_id
    where not h.held and h.part_id <> all(v_judged)
  ), added as (
    insert into public.assessment_objectives (tenant_id, plan_revision_id, title, target_control_part_id)
    select p_tenant_id, p_plan_revision_id, f.title, f.part_id
    from fresh f
    order by f.code_order, f.place, f.part_id
    returning id, target_control_part_id
  )
  select coalesce(array_agg(a.id order by f.code_order, f.place, f.part_id), '{}') into v_added
    from added a
    join fresh f on f.part_id = a.target_control_part_id;
  return jsonb_build_object(
    'added', cardinality(v_added),
    'skipped', v_skipped,
    'counted', v_counted,
    'judged', cardinality(v_judged),
    'objectiveIds', to_jsonb(v_added));
end;
$$;
revoke all on function public.add_control_objectives(uuid, uuid, uuid, uuid[]) from public, anon, authenticated;
comment on function public.add_control_objectives(uuid, uuid, uuid, uuid[]) is 'Internal to add_controls_to_assessment_plan and plan_control_assessment: each chosen control takes one objective an assessment objective it counts that the plan does not hold yet (assessment_plan_control_parts), titled by the objective''s label and text and aimed at its part, or, for a control that counts none, one objective aimed at its statement, titled by its code and title. Of a control the plan''s program has judged in part (some of the objectives it counts, not all: program_control_objective_judgments), only the objectives nobody has judged are taken; a control judged on none or on every one takes them all. It answers the objectives it added, in the controls'' code order and each control''s reading order, how many chosen controls the plan held everything they take of already (skipped), how many objectives the chosen controls count (counted) and how many of those it left out as judged (judged). No client calls it.';

-- What the two commands say of themselves; their bodies are as 20261114051000 left them.
comment on function public.add_controls_to_assessment_plan(uuid, uuid, bigint, uuid, uuid[]) is 'Add the chosen controls to a draft assessment plan, at the plan revision the reader saw, in one transaction: each control as the assessment objectives it counts, one plan objective each, titled by its label and text and aimed at its part, and a control that counts none as one objective aimed at its statement. Of a control the program''s assessors have judged in part (some of its objectives, not all), only the objectives nobody has judged are added. A plan that holds some of what a control takes takes the rest; one that holds all of it, or the control''s statement, takes nothing (skipped). A control the plan''s SSP does not select is refused, and a completed or cancelled campaign takes none. The answer says the objectives added, the controls skipped, the objectives the chosen controls count (counted) and how many of those were left out as judged (judged). The request id is chosen once per choice: the same request sent again returns its first answer and adds nothing.';
comment on function public.plan_control_assessment(uuid, uuid, uuid, text, uuid, uuid[]) is 'Plan an assessment of the chosen controls, in one transaction: a planned assessment campaign of the program with the given title, a draft plan pinned to a published SSP of one of the program''s systems, and each control as the assessment objectives it counts, one plan objective each, titled by its label and text and aimed at its part, or, for a control that counts none, one objective aimed at its statement. Of a control the program''s assessors have judged in part (some of its objectives, not all), only the objectives nobody has judged are planned. A control the SSP does not select is refused. The answer says the objectives planned, the objectives the chosen controls count (counted) and how many of those were left out as judged (judged). The request id is chosen once per choice: the same request sent again returns its first answer and plans nothing more.';

-- ---------------------------------------------------------------------------------------------
-- What the named plans hold of one control, and what the named program's assessors have judged of
-- it: its next step and Add to assessment campaign's picker.
-- ---------------------------------------------------------------------------------------------
drop function if exists public.plan_control_holdings(uuid, uuid, uuid[]);
create or replace function public.plan_control_holdings(
  p_tenant_id uuid, p_control_id uuid, p_plan_revision_ids uuid[], p_program_id uuid default null
) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare answer jsonb;
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  if p_control_id is null then
    raise exception 'Name the control' using errcode = '22023';
  end if;
  if cardinality(coalesce(p_plan_revision_ids, '{}')) > 500 then
    raise exception 'Name at most 500 assessment plans' using errcode = '22023';
  end if;
  -- A program named that the reader does not read in the workspace is refused, never answered as
  -- judging nothing.
  if p_program_id is not null and not exists (
    select 1 from public.programs p where p.tenant_id = p_tenant_id and p.id = p_program_id
  ) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  with
  -- The plans named that the reader reads in the workspace, each with its campaign's program; any
  -- other is left out.
  plan as (
    select r.id, g.program_id
    from public.assessment_plan_revisions r
    join public.assessment_campaigns g on g.tenant_id = r.tenant_id and g.id = r.campaign_id
    where r.tenant_id = p_tenant_id and r.id = any(coalesce(p_plan_revision_ids, '{}'))
  ),
  holding as materialized (
    select h.plan_revision_id, h.part_id, h.objective, h.held
    from public.assessment_plan_control_parts(array(select p.id from plan p), array[p_control_id]) h
  ),
  -- The assessment objectives the control counts; none for a control a plan takes as its statement.
  counted as materialized (
    select a.part_id from public.control_assessment_parts(array[p_control_id]) a where a.objective
  ),
  -- What each plan's program, and the program named, has judged of the control: the objectives it
  -- counts that an assessor's latest published results judge, or the control itself (no objective)
  -- where it counts none.
  judged as materialized (
    select w.program_id, j.objective_id
    from (
      select p.program_id from plan p
      union
      select p_program_id where p_program_id is not null
    ) w
    cross join lateral public.program_control_objective_judgments(w.program_id, array[p_control_id]) j
  )
  select jsonb_build_object(
    'control_id', p_control_id,
    'objectives', (select count(*) from counted),
    -- How many of them the named program's assessors have judged; none is said while no program
    -- is named.
    'objectives_assessed', case when p_program_id is not null then
      (select count(*) from judged j join counted c on c.part_id = j.objective_id
        where j.program_id = p_program_id) end,
    'plans', coalesce((
      select jsonb_agg(jsonb_build_object(
        'plan_revision_id', p.id,
        'objectives_held', (select count(*) from holding h where h.plan_revision_id = p.id and h.objective and h.held),
        'holds', coalesce((select bool_and(h.held) from holding h where h.plan_revision_id = p.id), false),
        -- What is left to judge of the control: each part an assessment of it takes (an objective
        -- it counts, or its statement for one that counts none) that the plan's program has not
        -- judged. The plan holds all of it; nothing left is held.
        'holds_unjudged', coalesce((select bool_and(h.held) from holding h
          where h.plan_revision_id = p.id
            and not exists (select 1 from judged j
              where j.program_id = p.program_id
                and j.objective_id is not distinct from (case when h.objective then h.part_id end))), true),
        -- How many of the objectives the plan's program has not judged the plan holds.
        'unjudged_held', (select count(*) from holding h
          where h.plan_revision_id = p.id and h.objective and h.held
            and not exists (select 1 from judged j
              where j.program_id = p.program_id and j.objective_id = h.part_id))
      ) order by p.id)
      from plan p), '[]'::jsonb)
  ) into answer;
  return answer;
end; $$;
revoke all on function public.plan_control_holdings(uuid, uuid, uuid[], uuid) from public, anon;
grant execute on function public.plan_control_holdings(uuid, uuid, uuid[], uuid) to authenticated;
comment on function public.plan_control_holdings(uuid, uuid, uuid[], uuid) is 'What the named assessment plans hold of one control, for its next step and Add to assessment campaign''s picker: objectives (how many assessment objectives the control counts, none for a control written as its statement); objectives_assessed (how many of them the assessors of the program named have judged, program_control_objective_judgments; null while no program is named, and a program the reader does not read in the workspace is refused), which says whether an assessment takes only the objectives nobody has judged; and, for each plan named that the reader reads in the workspace, objectives_held (how many of the objectives the plan holds: an objective aimed at it, at an objective above it, or at the control''s statement), holds (the plan holds every one, or the statement, so the control takes nothing more), holds_unjudged (the plan holds every objective of the control its campaign''s program has not judged yet: the whole control while none is judged, and true once nothing is left), which the step of a control judged in part follows to the campaign whose plan holds the rest, and unjudged_held (how many of the objectives its program has not judged the plan holds). Security invoker.';

-- What the parts read says of who reads it.
comment on function public.control_assessment_parts(uuid[]) is 'Internal: the parts of each control an assessment plan takes as its objectives. Each assessment objective the control counts (a leaf, or a heading that prints a sentence of its own, as program_control_objective_cover counts them), with its place in the catalog''s reading order and the objectives above it; a control that counts none is taken as its statement (objective false). Every row names the control''s statement, which holds the whole control. Reference data only; security invoker. assessment_plan_control_parts, add_control_objectives, plan_control_holdings and delta_assessment_parts read it.';

notify pgrst, 'reload schema';
