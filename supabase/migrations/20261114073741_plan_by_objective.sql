-- Plan by objective: a control joins an assessment plan as the assessment objectives it counts.
--
-- Add to assessment campaign and Plan an assessment (20261113222212_control_assessment_commands)
-- wrote a control as one plan objective, titled by its code and title and aimed at its statement.
-- A control now counts assessment objectives (SP 800-53A): its leaves and each heading that prints a
-- sentence of its own (20261114030116_objective_level_derivation, 20261114051136_objective_headings_count;
-- 26 for AC-2, 9 for AC-8), and its status climbs by them. So both commands write a control as those
-- objectives (Josef, 2026-11-13: "Plan by objective"):
--
--   a control that counts objectives   one plan objective an objective it counts, in the catalog's
--                                      reading order, titled by its label and text ("AC-02a.[01]
--                                      account types allowed for use within the system are defined
--                                      and documented") and aimed at that objective's part
--   a control that counts none         one plan objective aimed at its statement, titled by its code
--                                      and title, as before (CP-10(3) and SC-19 in SP 800-53 Rev 5)
--
-- What a plan holds of a control (assessment_plan_control_parts): an objective the control counts
-- is held when one of the plan's objectives is aimed at it, at an objective above it (a heading, as
-- a requirement's mapping of a heading covers the objectives under it) or at the control's
-- statement, which holds the whole control: every plan written before this migration aimed at the
-- statement, so each holds every control it held. A plan that holds some of a control's objectives
-- takes only the rest; one that holds them all takes nothing, and the control counts as skipped.
--
--   control_parameter_placeholder   a parameter where control prose inserts it, as the catalog
--                                   prints it ("[Assignment: frequency]"), as the app's control
--                                   text prints it (library-controls.tsx)
--   control_prose_words             control prose with each insertion as its placeholder
--   assessment_objective_title      the title a plan objective takes for a part of a control
--   control_assessment_parts        the parts an assessment of each control takes: the objectives
--                                   it counts, each with its place and the objectives above it,
--                                   else its statement
--   assessment_plan_control_parts   for each plan and each of those parts, whether the plan holds it
--   add_control_objectives          the helper both commands write through: what each plan does
--                                   not hold yet, and its answer gains `counted`, the objectives
--                                   the chosen controls count (none for a control written as its
--                                   statement), which the toasts say
--   plan_control_holdings           the read behind a control's next step and the picker: how many
--                                   objectives the control counts and, for each plan named, how
--                                   many it holds and whether it holds the control
--
-- add_controls_to_assessment_plan and plan_control_assessment keep their bodies (their receipts,
-- their refusals, the PT404 of 20261114051000): only the helper they share changes, and what they
-- say of themselves. A finding judges the control of its part (program_control_status_lines,
-- assurance_findings), so a finding on an objective's part judges the control as one on its
-- statement did.
--
-- Every statement here can run again.

-- ---------------------------------------------------------------------------------------------
-- A control's prose in plain words, as the app prints it.
-- ---------------------------------------------------------------------------------------------
-- A parameter where control prose inserts it: the control's own parameter by its id or by the
-- alternative id it carries, else the catalog's parameter of that id. "[Assignment: <label>]", or
-- "[Selection (one or more): <choice>; <choice>]" with each choice's own insertions in place.
create or replace function public.control_parameter_placeholder(p_control_id uuid, p_parameter text, p_depth integer default 0)
returns text
language plpgsql stable security invoker set search_path = '' as $$
declare v_parameter public.parameters; v_choices text;
begin
  select p.* into v_parameter
  from public.controls k
  join public.parameters p on p.catalog_revision_id = k.catalog_revision_id
    and (p.source_id = p_parameter or p.control_id = k.id)
  where k.id = p_control_id
    and (p.source_id = p_parameter
      or exists (select 1 from jsonb_array_elements(p.props) x
        where x->>'name' = 'alt-identifier' and x->>'value' = p_parameter))
  order by (p.control_id is not distinct from k.id) desc, (p.source_id = p_parameter) desc, p.id
  limit 1;
  if v_parameter.id is null then
    return '[Assignment: ' || p_parameter || ']';
  end if;
  if v_parameter.has_selection then
    select string_agg(public.control_prose_words(p_control_id, c.value, p_depth + 1), '; ' order by c.ordinal)
      into v_choices
    from public.parameter_choices c
    where c.parameter_id = v_parameter.id;
    return '[Selection'
      || case when v_parameter.selection_count::text = 'one-or-more' then ' (one or more)' else '' end
      || ': ' || coalesce(nullif(v_choices, ''), 'no choices recorded') || ']';
  end if;
  return '[Assignment: ' || coalesce(v_parameter.label, p_parameter) || ']';
end; $$;
revoke all on function public.control_parameter_placeholder(uuid, text, integer) from public, anon, authenticated;
comment on function public.control_parameter_placeholder(uuid, text, integer) is 'Internal to assessment_objective_title: a parameter where a control''s prose inserts it, as the catalog prints it and the app''s control text prints it ("[Assignment: frequency]", "[Selection (one or more): ...]"). No client calls it.';

-- Control prose with each insertion as its placeholder; a choice nested more than three deep reads
-- "[Assignment]", as the app reads it.
create or replace function public.control_prose_words(p_control_id uuid, p_text text, p_depth integer default 0)
returns text
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_insert constant text := '\{\{\s*insert:\s*param,\s*([^\s}]+)\s*\}\}';
  v_words text;
begin
  if p_text is null or p_text !~ v_insert then
    return p_text;
  end if;
  -- The text between the insertions and the insertions themselves, interleaved in order.
  select string_agg(x.piece, '' order by x.n) into v_words
  from (
    select s.piece, s.n * 2 as n
    from unnest(regexp_split_to_array(p_text, v_insert)) with ordinality as s(piece, n)
    union all
    select case when p_depth <= 3 then public.control_parameter_placeholder(p_control_id, m.found[1], p_depth)
        else '[Assignment]' end, m.n * 2 + 1
    from regexp_matches(p_text, v_insert, 'g') with ordinality as m(found, n)
  ) x;
  return v_words;
end; $$;
revoke all on function public.control_prose_words(uuid, text, integer) from public, anon, authenticated;
comment on function public.control_prose_words(uuid, text, integer) is 'Internal to assessment_objective_title: a control''s prose with each parameter insertion as its placeholder (control_parameter_placeholder). No client calls it.';

-- The title a plan objective takes for a part of a control: an assessment objective by its label and
-- what the assessor determines, in one line ("AC-02a.[01] account types allowed for use within the
-- system are defined and documented"): SP 800-53A's lead-in "Determine if:" set aside, each
-- parameter as its placeholder, white space run together and the punctuation that closes it in the
-- catalog's list ("; and", "; or", ";", ".") left off. Any other part, the statement, by the
-- control's code and title, as before.
create or replace function public.assessment_objective_title(p_part_id uuid)
returns text
language sql stable security invoker set search_path = '' as $$
  select case
    when cp.name = 'assessment-objective' then btrim(
      coalesce((select x->>'value' from jsonb_array_elements(cp.props) x where x->>'name' = 'label' limit 1), k.code)
      || ' ' ||
      regexp_replace(
        btrim(regexp_replace(
          public.control_prose_words(k.id, regexp_replace(coalesce(cp.prose, ''), '^\s*determine if:', '', 'i')),
          '\s+', ' ', 'g')),
        '\s*(?:[;,]\s*(?:and|or)|[;,.:])$', '', 'i'))
    else k.code || ' ' || k.title
  end
  from public.control_parts cp
  join public.controls k on k.id = cp.control_id
  where cp.id = p_part_id;
$$;
revoke all on function public.assessment_objective_title(uuid) from public, anon, authenticated;
comment on function public.assessment_objective_title(uuid) is 'Internal to add_control_objectives: the title a plan objective takes for a part of a control. An assessment objective reads its label and what the assessor determines, in one line (AC-02a.[01] account types allowed for use within the system are defined and documented); a statement reads the control''s code and title. No client calls it.';

-- ---------------------------------------------------------------------------------------------
-- What an assessment of a control takes, and what a plan holds of it.
-- ---------------------------------------------------------------------------------------------
-- The parts of each control an assessment plan takes as its objectives: each assessment objective
-- the control counts (a leaf, with no objective under it, or a heading that prints a sentence of its
-- own, objective_prints_own_sentence, as program_control_objective_cover counts them), with its
-- place in the catalog's reading order and the objectives above it, as program_control_objectives
-- lists them; a control that counts none is taken as its statement. Each row names the control's
-- statement, which holds the whole control. A control with neither has no row.
create or replace function public.control_assessment_parts(p_control_ids uuid[])
returns table (control_id uuid, part_id uuid, objective boolean, place integer[], above uuid[], statement_id uuid)
language sql stable security invoker set search_path = '' as $$
  with recursive
  objective as materialized (
    select cp.id, cp.control_id, cp.parent_part_id, cp.ordinal, cp.prose
    from public.control_parts cp
    where cp.name = 'assessment-objective' and cp.control_id = any(p_control_ids)
  ),
  -- Each objective's place under every objective above it, from the root down. Sixteen levels
  -- bound a broken chain; the catalog nests four.
  placed as (
    select o.id, array[o.ordinal] as place, array[]::uuid[] as above, 1 as depth
    from objective o
    where o.parent_part_id is null
    union all
    select c.id, p.place || c.ordinal, p.above || p.id, p.depth + 1
    from objective c
    join placed p on c.parent_part_id = p.id
    where p.depth < 16
  ),
  counted as (
    select o.control_id, o.id, p.place, p.above
    from objective o
    join placed p on p.id = o.id
    where not exists (select 1 from objective c where c.parent_part_id = o.id)
      or public.objective_prints_own_sentence(o.prose)
  ),
  statement as (
    select distinct on (cp.control_id) cp.control_id, cp.id
    from public.control_parts cp
    where cp.control_id = any(p_control_ids) and cp.parent_part_id is null and cp.name = 'statement'
    order by cp.control_id, cp.ordinal, cp.id
  )
  select c.control_id, c.id, true, c.place, c.above, s.id
  from counted c
  left join statement s on s.control_id = c.control_id
  union all
  select s.control_id, s.id, false, array[]::integer[], array[]::uuid[], s.id
  from statement s
  where not exists (select 1 from counted c where c.control_id = s.control_id);
$$;
revoke all on function public.control_assessment_parts(uuid[]) from public, anon;
grant execute on function public.control_assessment_parts(uuid[]) to authenticated;
comment on function public.control_assessment_parts(uuid[]) is 'Internal: the parts of each control an assessment plan takes as its objectives. Each assessment objective the control counts (a leaf, or a heading that prints a sentence of its own, as program_control_objective_cover counts them), with its place in the catalog''s reading order and the objectives above it; a control that counts none is taken as its statement (objective false). Every row names the control''s statement, which holds the whole control. Reference data only; security invoker. assessment_plan_control_parts and plan_control_holdings read it.';

-- For each plan and each part an assessment of the controls takes, whether the plan holds it: one of
-- its objectives is aimed at the part, at an objective above it, or at the control's statement,
-- which holds the whole control. Security invoker: a plan the caller cannot read holds nothing.
create or replace function public.assessment_plan_control_parts(p_plan_revision_ids uuid[], p_control_ids uuid[])
returns table (plan_revision_id uuid, control_id uuid, part_id uuid, objective boolean, place integer[], held boolean)
language sql stable security invoker set search_path = '' as $$
  with
  part as materialized (
    select a.control_id, a.part_id, a.objective, a.place, a.above, a.statement_id
    from public.control_assessment_parts(p_control_ids) a
  ),
  -- Each part with the parts that hold it: itself, the objectives above it and the statement.
  holder as (
    select distinct p.part_id, h.holder_id
    from part p
    cross join lateral unnest(array[p.part_id, p.statement_id] || p.above) as h(holder_id)
    where h.holder_id is not null
  ),
  -- The parts of those controls each plan's objectives are aimed at.
  aimed as materialized (
    select distinct o.plan_revision_id, o.target_control_part_id as part_id
    from public.assessment_objectives o
    join public.control_parts cp on cp.id = o.target_control_part_id
    where o.plan_revision_id = any(p_plan_revision_ids) and cp.control_id = any(p_control_ids)
  ),
  held as (
    select distinct a.plan_revision_id, h.part_id
    from aimed a
    join holder h on h.holder_id = a.part_id
  ),
  plan as (
    select distinct w.id from unnest(p_plan_revision_ids) as w(id) where w.id is not null
  )
  select pl.id, p.control_id, p.part_id, p.objective, p.place, h.part_id is not null
  from plan pl
  cross join part p
  left join held h on h.plan_revision_id = pl.id and h.part_id = p.part_id;
$$;
revoke all on function public.assessment_plan_control_parts(uuid[], uuid[]) from public, anon;
grant execute on function public.assessment_plan_control_parts(uuid[], uuid[]) to authenticated;
comment on function public.assessment_plan_control_parts(uuid[], uuid[]) is 'Internal: for each assessment plan named and each part an assessment of the named controls takes (control_assessment_parts), whether the plan holds it: one of its objectives is aimed at the part, at an objective above it, or at the control''s statement, which holds the whole control. Security invoker: a plan the caller cannot read holds nothing. add_control_objectives and plan_control_holdings read it.';

-- ---------------------------------------------------------------------------------------------
-- The helper both commands write through: what the plan does not hold yet of each chosen control.
-- ---------------------------------------------------------------------------------------------
create or replace function public.add_control_objectives(
  p_tenant_id uuid, p_plan_revision_id uuid, p_profile_resolution_id uuid, p_control_ids uuid[]
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_selected integer; v_assessable integer; v_counted integer; v_skipped integer; v_added uuid[];
begin
  select count(distinct sc.control_id) into v_selected
    from public.selected_controls sc
    where sc.profile_resolution_id = p_profile_resolution_id and sc.control_id = any(p_control_ids);
  if v_selected <> cardinality(p_control_ids) then
    raise exception 'Add controls the control baseline of the plan''s SSP selects' using errcode = '23514';
  end if;
  -- What the plan holds of each chosen control: the controls it can take, the objectives they count
  -- and how many it holds whole already.
  select count(distinct h.control_id),
    count(*) filter (where h.objective),
    count(distinct h.control_id) - count(distinct h.control_id) filter (where not h.held)
    into v_assessable, v_counted, v_skipped
    from public.assessment_plan_control_parts(array[p_plan_revision_id], p_control_ids) h;
  if v_assessable <> cardinality(p_control_ids) then
    raise exception 'A control with no statement and no assessment objective has nothing for an assessor to judge'
      using errcode = '23514';
  end if;
  -- One objective a part the plan does not hold yet, in the controls' code order and each control's
  -- reading order.
  with fresh as (
    select h.part_id, h.place, public.natural_sort_key(k.code) collate "C" as code_order,
      public.assessment_objective_title(h.part_id) as title
    from public.assessment_plan_control_parts(array[p_plan_revision_id], p_control_ids) h
    join public.controls k on k.id = h.control_id
    where not h.held
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
    'objectiveIds', to_jsonb(v_added));
end;
$$;
revoke all on function public.add_control_objectives(uuid, uuid, uuid, uuid[]) from public, anon, authenticated;
comment on function public.add_control_objectives(uuid, uuid, uuid, uuid[]) is 'Internal to add_controls_to_assessment_plan and plan_control_assessment: each chosen control the plan does not hold whole yet takes one objective an assessment objective it counts and the plan does not hold (assessment_plan_control_parts), titled by the objective''s label and text and aimed at its part, or, for a control that counts none, one objective aimed at its statement, titled by its code and title. It answers the objectives it added, in the controls'' code order and each control''s reading order, how many chosen controls the plan held whole already (skipped), and how many objectives the chosen controls count (counted). No client calls it.';

-- What the two commands say of themselves; their bodies are as 20261114051000 left them.
comment on function public.add_controls_to_assessment_plan(uuid, uuid, bigint, uuid, uuid[]) is 'Add the chosen controls to a draft assessment plan, at the plan revision the reader saw, in one transaction: each control as the assessment objectives it counts, one plan objective each, titled by its label and text and aimed at its part, and a control that counts none as one objective aimed at its statement. A plan that holds some of a control''s objectives takes the rest; one that holds them all, or the control''s statement, takes nothing (skipped). A control the plan''s SSP does not select is refused, and a completed or cancelled campaign takes none. The answer says the objectives added, the controls skipped and the objectives the chosen controls count (counted). The request id is chosen once per choice: the same request sent again returns its first answer and adds nothing.';
comment on function public.plan_control_assessment(uuid, uuid, uuid, text, uuid, uuid[]) is 'Plan an assessment of the chosen controls, in one transaction: a planned assessment campaign of the program with the given title, a draft plan pinned to a published SSP of one of the program''s systems, and each control as the assessment objectives it counts, one plan objective each, titled by its label and text and aimed at its part, or, for a control that counts none, one objective aimed at its statement. A control the SSP does not select is refused. The request id is chosen once per choice: the same request sent again returns its first answer and plans nothing more.';

-- ---------------------------------------------------------------------------------------------
-- What the named plans hold of one control: its next step and Add to assessment campaign's picker.
-- ---------------------------------------------------------------------------------------------
create or replace function public.plan_control_holdings(p_tenant_id uuid, p_control_id uuid, p_plan_revision_ids uuid[])
returns jsonb
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
  with
  -- The plans named that the reader reads in the workspace; any other is left out.
  plan as (
    select r.id from public.assessment_plan_revisions r
    where r.tenant_id = p_tenant_id and r.id = any(coalesce(p_plan_revision_ids, '{}'))
  ),
  holding as materialized (
    select h.plan_revision_id, h.objective, h.held
    from public.assessment_plan_control_parts(array(select p.id from plan p), array[p_control_id]) h
  )
  select jsonb_build_object(
    'control_id', p_control_id,
    'objectives', (select count(*) from public.control_assessment_parts(array[p_control_id]) a where a.objective),
    'plans', coalesce((
      select jsonb_agg(jsonb_build_object(
        'plan_revision_id', p.id,
        'objectives_held', (select count(*) from holding h where h.plan_revision_id = p.id and h.objective and h.held),
        'holds', coalesce((select bool_and(h.held) from holding h where h.plan_revision_id = p.id), false)
      ) order by p.id)
      from plan p), '[]'::jsonb)
  ) into answer;
  return answer;
end; $$;
revoke all on function public.plan_control_holdings(uuid, uuid, uuid[]) from public, anon;
grant execute on function public.plan_control_holdings(uuid, uuid, uuid[]) to authenticated;
comment on function public.plan_control_holdings(uuid, uuid, uuid[]) is 'What the named assessment plans hold of one control, for its next step and Add to assessment campaign''s picker: objectives (how many assessment objectives the control counts, none for a control written as its statement) and, for each plan named that the reader reads in the workspace, objectives_held (how many of them the plan holds: an objective aimed at it, at an objective above it, or at the control''s statement) and holds (the plan holds every one, or the statement, so the control takes nothing more). Security invoker.';

notify pgrst, 'reload schema';
