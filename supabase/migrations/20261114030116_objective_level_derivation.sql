-- Objective-level derivation: a requirement maps the assessment objectives of a control it meets.
--
-- A requirement mapped to a control said the whole control was met, though most controls ask
-- several things of a system. A mapping can now name the assessment objectives it meets instead,
-- one mapping an objective, so where a program stands on a control says how much of it the
-- program's requirements cover.
--
-- The objectives a control counts are its leaf assessment objectives: those with no objective under
-- them, the statements an assessor determines (AC-02a.[01], "account types allowed for use within
-- the system are defined"). SP 800-53 Rev 5 prints 2,776 over the 1,014 controls that have
-- objectives; AC-2 has 26. An objective above others is the heading they sit under (AC-02a. over
-- AC-02a.[01] and AC-02a.[02], AC-02 over them all), so mapping it maps every objective under it,
-- and mapping the root objective maps them all, as mapping the whole control does. Nine headings
-- print a sentence of their own besides the objectives under them (PM-24's "a Data Integrity Board
-- is established"); it is read with them.
--
-- What a mapping covers (requirement_control_links.control_part_id):
--   no part              the whole control: every objective, as before
--   an objective         it and every objective under it
--   a statement or item  the whole control, as these always counted: the part points into the
--                        control's text and says nothing of its objectives. So does an older
--                        mapping that names an assessment method, which the guard has refused
--                        since 20260913030000. Six mappings named a part before this migration:
--                        four assessment methods, a statement and an item.
--
-- How a control climbs the ladder (program_control_status_lines), its determinations unchanged:
--   no requirement   until the program's requirements (each at its latest revision) cover every
--                    objective of the control: a control mapped in part stays here
--   no evidence      until each objective is covered by such a requirement that cites evidence
--   not assessed     every objective covered by a requirement that cites evidence
-- A control the catalog gives no objective climbs as before, by its requirements. A whole-control
-- mapping covers every objective, so every status read before this migration reads the same after.
--
--   program_control_objective_cover   internal: each objective of the named controls with each of
--                                     the program's requirements whose mapping covers it, and
--                                     whether that requirement cites evidence. The counting and
--                                     the read of one control's objectives share it.
--   program_control_status_lines      counts each control's objectives, those mapped and those
--                                     with evidence, and climbs the ladder by them; the daily
--                                     posture snapshots count from it, so they count the same
--   program_control_status            answers the three counts with each control
--   program_control_objectives        one control's objectives, for its Map a requirement and its
--                                     next step: each with its label and text in reading order,
--                                     whether the program maps it and with evidence, and the
--                                     requirements that cover it
--
-- The guard on requirement_control_links takes an assessment objective of the mapped control as a
-- target, beside a statement or item; an objective of another control is refused, as another
-- control's statement was, and an assessment method or guidance still is.

-- ---------------------------------------------------------------------------------------------
-- What a mapping may name: the whole control, a statement or item of it, or one of its objectives.
-- ---------------------------------------------------------------------------------------------
create or replace function public.is_control_assessment_objective(p_part_id uuid, p_control_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.control_parts p
    where p.id = p_part_id and p.control_id = p_control_id and p.name = 'assessment-objective');
$$;
revoke all on function public.is_control_assessment_objective(uuid, uuid) from public, anon;
grant execute on function public.is_control_assessment_objective(uuid, uuid) to authenticated;
comment on function public.is_control_assessment_objective(uuid, uuid) is 'Whether a part is one of the control''s assessment objectives: a target a requirement''s control mapping may name, beside a statement or item of the control.';

create or replace function public.guard_requirement_control_target() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  part_control uuid;
  program_uuid uuid;
  selected_control uuid;
  target_changed boolean;
begin
  -- Older clients and archived seed code supply only a part ID. Derive its
  -- owning control while preventing contradictory explicit target references.
  if new.control_part_id is not null then
    select control_id into part_control from public.control_parts where id = new.control_part_id;
    if part_control is null then
      raise exception 'Choose a control, or one of its statements or assessment objectives' using errcode = '23514';
    end if;
    if new.control_id is null or (tg_op = 'UPDATE'
      and new.control_part_id is distinct from old.control_part_id
      and new.control_id is not distinct from old.control_id) then
      new.control_id := part_control;
    elsif new.control_id <> part_control then
      raise exception 'The statement or objective must belong to the mapped control' using errcode = '23514';
    end if;
  end if;
  if new.control_id is null then
    raise exception 'Choose a control' using errcode = '23514';
  end if;
  target_changed := tg_op = 'INSERT';
  if tg_op = 'UPDATE' then
    target_changed := (new.control_id, new.control_part_id, new.system_id, new.selected_control_id)
      is distinct from (old.control_id, old.control_part_id, old.system_id, old.selected_control_id);
    if new.requirement_revision_id is distinct from old.requirement_revision_id then
      raise exception 'A control mapping cannot be moved to another requirement' using errcode = '23514';
    end if;
  end if;
  if target_changed and new.control_part_id is not null
    and not public.is_requirement_control_statement(new.control_part_id, new.control_id)
    and not public.is_control_assessment_objective(new.control_part_id, new.control_id) then
    raise exception 'Map the whole control, one of its statements or one of its assessment objectives; assessment methods and guidance are not mapping targets'
      using errcode = '23514';
  end if;
  select r.program_id into program_uuid from public.requirement_revisions rr
    join public.engineering_requirements r on r.id = rr.engineering_requirement_id
    where rr.id = new.requirement_revision_id and rr.tenant_id = new.tenant_id;
  if program_uuid is null then
    raise exception 'Choose a requirement in this workspace' using errcode = '23514';
  end if;
  if new.system_id is not null then
    if not exists (select 1 from public.systems s where s.id = new.system_id
      and s.tenant_id = new.tenant_id and s.program_id = program_uuid) then
      raise exception 'The mapped system must belong to the requirement program' using errcode = '23514';
    end if;
    select control_id into selected_control from public.selected_controls
      where id = new.selected_control_id;
    if selected_control is distinct from new.control_id then
      raise exception 'The system selection must reference the mapped control' using errcode = '23514';
    end if;
    if target_changed then
      if not exists (select 1 from public.requirement_allocations a
        where a.tenant_id = new.tenant_id and a.requirement_revision_id = new.requirement_revision_id
          and a.system_id = new.system_id) then
        raise exception 'Allocate the requirement to this system before mapping its controls' using errcode = '23514';
      end if;
      if not exists (select 1 from public.system_effective_baselines b
        join public.selected_controls sc on sc.profile_resolution_id = b.profile_resolution_id
        where b.tenant_id = new.tenant_id and b.system_id = new.system_id
          and sc.id = new.selected_control_id and sc.control_id = new.control_id) then
        raise exception 'Choose a control from the system current effective profile' using errcode = '23514';
      end if;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_requirement_control_target() from public, anon, authenticated;

comment on column public.requirement_control_links.control_part_id is 'Optional: one of the control''s assessment objectives, which the mapping covers with every objective under it, or an authored statement or nested statement item, which points into the control''s text and covers the whole control. NULL represents the whole control.';

-- ---------------------------------------------------------------------------------------------
-- Which of the program's requirements cover each objective of the named controls.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_control_objective_cover(p_program_id uuid, p_control_ids uuid[])
returns table (control_id uuid, objective_id uuid, requirement_id uuid, evidenced boolean)
language plpgsql stable security invoker set search_path = '' as $$
#variable_conflict use_column
begin
  -- A program the caller cannot read is refused, never answered as covering nothing.
  if not exists (select 1 from public.programs p where p.id = p_program_id) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  return query
  with recursive
  objective as materialized (
    select cp.id, cp.control_id, cp.parent_part_id
    from public.control_parts cp
    where cp.name = 'assessment-objective' and cp.control_id = any(p_control_ids)
  ),
  -- The objectives a control counts: its leaves, with no objective under them.
  leaf as materialized (
    select o.id, o.control_id
    from objective o
    where not exists (select 1 from objective c where c.parent_part_id = o.id)
  ),
  -- Each leaf with itself and every objective above it, since a mapping that names any of them
  -- covers it. Sixteen levels bound a broken chain; the catalog nests four.
  reach as (
    select l.id as leaf_id, l.id as part_id, o.parent_part_id as parent_id, 1 as depth
    from leaf l
    join objective o on o.id = l.id
    union all
    select r.leaf_id, o.id, o.parent_part_id, r.depth + 1
    from reach r
    join objective o on o.id = r.parent_id
    where r.depth < 16
  ),
  -- The program's requirements whose latest revision maps one of the controls, and the objective
  -- each mapping names: none where it maps the whole control, or names a statement, an item or a
  -- part that is not one of the control's objectives, which cover the whole control.
  met as materialized (
    select distinct l.control_id, q.id as requirement_id, v.id as revision_id,
      case when cp.name = 'assessment-objective' and cp.control_id = l.control_id
        then l.control_part_id end as objective_id
    from public.requirement_control_links l
    join public.requirement_revisions v on v.tenant_id = l.tenant_id and v.id = l.requirement_revision_id
    join public.engineering_requirements q on q.tenant_id = v.tenant_id and q.id = v.engineering_requirement_id
    left join public.control_parts cp on cp.id = l.control_part_id
    where q.program_id = p_program_id
      and l.control_id = any(p_control_ids)
      and v.version_number = (select max(x.version_number) from public.requirement_revisions x
        where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)
  ),
  evidenced as materialized (
    select distinct m.requirement_id
    from met m
    join public.requirement_evidence re on re.requirement_revision_id = m.revision_id
    join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
  ),
  -- Which requirements cover each leaf: a mapping of the whole control covers every leaf of it,
  -- and one that names an objective the leaves at and under it. Two hash joins, never a test of
  -- every mapping against every objective.
  covered as materialized (
    select l.id as leaf_id, m.requirement_id
    from leaf l
    join met m on m.control_id = l.control_id and m.objective_id is null
    union
    select r.leaf_id, m.requirement_id
    from reach r
    join met m on m.objective_id = r.part_id
  )
  select l.control_id, l.id, c.requirement_id, e.requirement_id is not null
  from leaf l
  left join covered c on c.leaf_id = l.id
  left join evidenced e on e.requirement_id = c.requirement_id;
end; $$;
revoke all on function public.program_control_objective_cover(uuid, uuid[]) from public, anon;
grant execute on function public.program_control_objective_cover(uuid, uuid[]) to authenticated;
comment on function public.program_control_objective_cover(uuid, uuid[]) is 'Internal: each assessment objective the named controls count (a leaf, with no objective under it), once with each of the program''s requirements whose latest revision covers it and whether that requirement cites evidence, and once with no requirement where none covers it. A mapping covers the objective it names and every objective under it; one that names no part, a statement or an item covers the whole control. Security invoker: a program the caller cannot read is refused. program_control_status_lines and program_control_objectives read it.';

-- ---------------------------------------------------------------------------------------------
-- One line a control of a program's control baseline, as program_control_status counts it: the
-- body of 20261113223837_posture_snapshots, with the control's objectives counted and the ladder
-- climbed by them.
-- ---------------------------------------------------------------------------------------------
-- Its answer gains three columns, so it is dropped and created again; the functions that read it
-- are plpgsql and find it by name as they run.
drop function if exists public.program_control_status_lines(uuid);
create function public.program_control_status_lines(p_program_id uuid)
returns table (
  id uuid, code text, title text, parent_control_id uuid, code_order text,
  family text, family_title text, requirements bigint, evidenced bigint,
  status text, determined_by text, product_assessments jsonb,
  objectives bigint, objectives_mapped bigint, objectives_evidenced bigint
)
language plpgsql stable security invoker set search_path = '' as $$
#variable_conflict use_column
declare v_tenant uuid;
begin
  -- A program the caller cannot read is refused, never answered as empty. Row-level security
  -- decides: a member reads the programs of their workspace, and the snapshot job, as the
  -- database's owner, reads every one.
  select p.tenant_id into v_tenant from public.programs p where p.id = p_program_id;
  if v_tenant is null then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  return query
  with
  -- The controls a control baseline of the program selects: any of the baselines it adopted.
  selected as materialized (
    select distinct sc.control_id
    from public.program_reference_choices c
    join public.selected_controls sc on sc.profile_resolution_id = c.profile_resolution_id
    where c.program_id = p_program_id
  ),
  -- The program's requirements whose latest revision maps each control.
  met as materialized (
    select distinct l.control_id, q.id as requirement_id, v.id as revision_id
    from public.requirement_control_links l
    join public.requirement_revisions v on v.tenant_id = l.tenant_id and v.id = l.requirement_revision_id
    join public.engineering_requirements q on q.tenant_id = v.tenant_id and q.id = v.engineering_requirement_id
    where q.program_id = p_program_id
      and l.control_id in (select control_id from selected)
      and v.version_number = (select max(x.version_number) from public.requirement_revisions x
        where x.tenant_id = v.tenant_id and x.engineering_requirement_id = v.engineering_requirement_id)
  ),
  evidenced as materialized (
    select distinct m.requirement_id
    from met m
    join public.requirement_evidence re on re.requirement_revision_id = m.revision_id
    join public.evidence_versions ev on ev.tenant_id = re.tenant_id and ev.id = re.evidence_version_id
  ),
  -- Each control's objectives, how many the program's requirements cover, and how many are
  -- covered by one that cites evidence: one read of every control, never a read a control.
  coverage as materialized (
    select o.control_id,
      count(distinct o.objective_id) as objectives,
      count(distinct o.objective_id) filter (where o.requirement_id is not null) as mapped,
      count(distinct o.objective_id) filter (where o.evidenced) as evidenced
    from public.program_control_objective_cover(p_program_id, array(select s.control_id from selected s)) o
    group by o.control_id
  ),
  -- The latest determination on each part of a control, in a published results revision of one
  -- of the program's campaigns.
  judged as materialized (
    select distinct on (f.target_control_part_id) cp.control_id, f.determination
    from public.assessment_findings f
    join public.control_parts cp on cp.id = f.target_control_part_id
    join public.assessment_results_revisions r
      on r.tenant_id = f.tenant_id and r.id = f.assessment_results_revision_id
    join public.assessment_plan_revisions pl
      on pl.tenant_id = r.tenant_id and pl.id = r.assessment_plan_revision_id
    join public.assessment_campaigns g on g.tenant_id = pl.tenant_id and g.id = pl.campaign_id
    where g.program_id = p_program_id
      and r.state = 'published'
      and f.determination <> 'not_assessed'
      and cp.control_id in (select control_id from selected)
    order by f.target_control_part_id, f.determined_at desc nulls last, f.created_at desc, f.id desc
  ),
  worst as (
    select j.control_id,
      bool_or(j.determination = 'other_than_satisfied') as other_than,
      bool_or(j.determination = 'partially_satisfied') as partially,
      bool_or(j.determination = 'satisfied') as satisfied
    from judged j
    group by j.control_id
  ),
  -- The program's product variants (its boundary systems created from a product configuration),
  -- in the order the program took them, each read for its delta once, as the Product delta view
  -- reads it, so the two never disagree.
  variant as materialized (
    select s.id, row_number() over (order by s.created_at, s.code, s.id) as position,
      public.variant_control_delta_answer(s.tenant_id, s.id) as delta
    from public.systems s
    where s.tenant_id = v_tenant and s.program_id = p_program_id
      and s.is_authorization_boundary and s.product_configuration_id is not null
  ),
  -- A variant's word on a control it inherits from its product with a determination, and the
  -- product assessment the determination was read from.
  inherits as materialized (
    select (c->>'id')::uuid as control_id, v.id as variant_id, v.position,
      c->>'product_status' as determination,
      (v.delta->'assessment'->>'id')::uuid as assessment_id,
      v.delta->'assessment'->>'title' as assessment_title
    from variant v
    cross join lateral jsonb_array_elements(v.delta->'controls') c
    where c->>'delta' = 'inherited'
      and c->>'product_status' in ('satisfied', 'partially_satisfied', 'other_than_satisfied')
  ),
  -- The controls every variant of the program inherits with a determination.
  whole as (
    select i.control_id
    from inherits i
    group by i.control_id
    having count(distinct i.variant_id) = (select count(*) from variant)
  ),
  -- Each product assessment behind such a control, with its worst determination on it: two
  -- variants of one product version read one assessment.
  behind as (
    select i.control_id, i.assessment_id, min(i.assessment_title) as title, min(i.position) as position,
      case
        when bool_or(i.determination = 'other_than_satisfied') then 'other_than_satisfied'
        when bool_or(i.determination = 'partially_satisfied') then 'partially_satisfied'
        else 'satisfied'
      end as determination
    from inherits i
    where i.control_id in (select control_id from whole)
    group by i.control_id, i.assessment_id
  ),
  product as (
    select b.control_id,
      bool_or(b.determination = 'other_than_satisfied') as other_than,
      bool_or(b.determination = 'partially_satisfied') as partially,
      jsonb_agg(jsonb_build_object('id', b.assessment_id, 'title', b.title, 'determination', b.determination)
        order by case b.determination when 'other_than_satisfied' then 0 when 'partially_satisfied' then 1 else 2 end,
          b.position, b.assessment_id) as assessments
    from behind b
    group by b.control_id
  ),
  -- Joined and grouped, never asked once a control: the session's row-level security is checked
  -- on every row a subquery reads, and a subquery a control reads its tables 546 times over.
  counted as (
    select s.control_id,
      count(distinct m.requirement_id) as requirements,
      count(distinct m.requirement_id) filter (where e.requirement_id is not null) as evidenced
    from selected s
    left join met m on m.control_id = s.control_id
    left join evidenced e on e.requirement_id = m.requirement_id
    group by s.control_id
  ),
  line as (
    select k.id, k.code, k.title, k.parent_control_id,
      public.natural_sort_key(k.code) collate "C" as code_order,
      upper(g.source_id) as family, g.title as family_title,
      n.requirements, n.evidenced,
      case
        when w.other_than then 'other_than_satisfied'
        when w.partially then 'partially_satisfied'
        when w.satisfied then 'satisfied'
        when d.other_than then 'other_than_satisfied'
        when d.partially then 'partially_satisfied'
        when d.control_id is not null then 'satisfied'
        -- A control with objectives climbs by them: each covered by a requirement that cites
        -- evidence, each covered, or not every one covered.
        when coalesce(o.objectives, 0) > 0 then
          case
            when o.evidenced = o.objectives then 'not_assessed'
            when o.mapped = o.objectives then 'no_evidence'
            else 'no_requirement'
          end
        -- One the catalog gives no objective climbs by its requirements.
        when n.evidenced > 0 then 'not_assessed'
        when n.requirements > 0 then 'no_evidence'
        else 'no_requirement'
      end as status,
      case
        when w.control_id is not null then 'program'
        when d.control_id is not null then 'product'
      end as determined_by,
      case when w.control_id is null then d.assessments end as product_assessments,
      coalesce(o.objectives, 0) as objectives,
      coalesce(o.mapped, 0) as objectives_mapped,
      coalesce(o.evidenced, 0) as objectives_evidenced
    from counted n
    join public.controls k on k.id = n.control_id
    left join public.catalog_groups g on g.id = k.group_id
    left join worst w on w.control_id = n.control_id
    left join product d on d.control_id = n.control_id
    left join coverage o on o.control_id = n.control_id
  )
  select l.id, l.code, l.title, l.parent_control_id, l.code_order, l.family, l.family_title,
    l.requirements, l.evidenced, l.status, l.determined_by, l.product_assessments,
    l.objectives, l.objectives_mapped, l.objectives_evidenced
  from line l;
end; $$;
revoke all on function public.program_control_status_lines(uuid) from public, anon;
grant execute on function public.program_control_status_lines(uuid) to authenticated;
comment on function public.program_control_status_lines(uuid) is 'Internal: one line a control of a program''s control baseline, as program_control_status answers it (its status, the requirements that map it and how many cite evidence, its assessment objectives with how many the requirements cover and how many with evidence, whose determination and the product assessments behind a product''s), asking nothing of who calls but that row-level security lets them read the program. A control with objectives leaves no requirement once every objective is covered and no evidence once each is covered by a requirement that cites evidence (program_control_objective_cover). Security invoker. program_control_status and the posture snapshots count from it.';

create or replace function public.program_control_status(p_program_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare answer jsonb; v_tenant uuid;
begin
  select p.tenant_id into v_tenant from public.programs p where p.id = p_program_id;
  if auth.uid() is null or v_tenant is null then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  with line as materialized (
    select * from public.program_control_status_lines(p_program_id)
  )
  select jsonb_build_object(
    'program_id', p_program_id,
    -- Whether the program records a control baseline at all: without one there is nothing to
    -- stand on, which is not the same as every control standing nowhere.
    'baseline', exists (select 1 from public.program_reference_choices c where c.program_id = p_program_id),
    'totals', jsonb_build_object(
      'controls', (select count(*) from line),
      'satisfied', (select count(*) from line where status = 'satisfied'),
      'partially_satisfied', (select count(*) from line where status = 'partially_satisfied'),
      'other_than_satisfied', (select count(*) from line where status = 'other_than_satisfied'),
      'not_assessed', (select count(*) from line where status = 'not_assessed'),
      'no_evidence', (select count(*) from line where status = 'no_evidence'),
      'no_requirement', (select count(*) from line where status = 'no_requirement')
    ),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id, 'code', l.code, 'title', l.title,
        'parent_id', l.parent_control_id,
        'family', l.family, 'family_title', l.family_title,
        'status', l.status, 'requirements', l.requirements, 'evidenced', l.evidenced,
        'objectives', l.objectives, 'objectives_mapped', l.objectives_mapped,
        'objectives_evidenced', l.objectives_evidenced,
        'determined_by', l.determined_by,
        'product_assessments', coalesce(l.product_assessments, '[]'::jsonb)
      ) order by l.family nulls last, l.code_order collate "C", l.id), '[]'::jsonb)
      from line l)
  ) into answer;
  return answer;
end; $$;
revoke all on function public.program_control_status(uuid) from public, anon;
grant execute on function public.program_control_status(uuid) to authenticated;
comment on function public.program_control_status(uuid) is 'One status for each control of a program''s control baseline: the worst of the latest determinations an assessor of the program published on its parts; else, where every product variant of the program inherits the control with a determination, the worst of the product''s determinations; else not assessed, no evidence or no requirement, which a control with assessment objectives reaches by them: no requirement until the program''s requirements cover every objective, no evidence until each is covered by one that cites evidence. Each control says whose determination its status is (determined_by: program or product) and the product assessments behind a product''s, with the program''s requirements that map it and how many of them cite evidence, and its objectives (objectives), how many are covered (objectives_mapped) and how many by a requirement that cites evidence (objectives_evidenced). Security invoker: a program the reader cannot read is refused. The lines are program_control_status_lines''s, which the posture snapshots count too.';

-- ---------------------------------------------------------------------------------------------
-- One control's objectives, as a program stands on each.
-- ---------------------------------------------------------------------------------------------
create or replace function public.program_control_objectives(p_program_id uuid, p_control_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare answer jsonb;
begin
  if auth.uid() is null or p_control_id is null
    or not exists (select 1 from public.programs p where p.id = p_program_id) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  with recursive
  part as materialized (
    select cp.id, cp.parent_part_id, cp.ordinal, cp.prose,
      (select x->>'value' from jsonb_array_elements(cp.props) x where x->>'name' = 'label' limit 1) as label
    from public.control_parts cp
    where cp.control_id = p_control_id and cp.name = 'assessment-objective'
  ),
  -- Each objective's place in the catalog's reading order (its position under every objective
  -- above it) and the objectives above it, from the root down.
  place as (
    select p.id, array[p.ordinal] as path, array[]::uuid[] as ancestors, 1 as depth
    from part p
    where p.parent_part_id is null
    union all
    select c.id, pl.path || c.ordinal, pl.ancestors || pl.id, pl.depth + 1
    from part c
    join place pl on c.parent_part_id = pl.id
    where pl.depth < 16
  ),
  cover as materialized (
    select o.objective_id, o.requirement_id, o.evidenced
    from public.program_control_objective_cover(p_program_id, array[p_control_id]) o
  ),
  standing as (
    select c.objective_id,
      bool_or(c.requirement_id is not null) as mapped,
      bool_or(c.evidenced) as evidenced,
      coalesce(jsonb_agg(jsonb_build_object('id', q.id, 'code', q.code, 'evidenced', c.evidenced)
          order by public.natural_sort_key(q.code) collate "C", q.id)
        filter (where q.id is not null), '[]'::jsonb) as requirements
    from cover c
    left join public.engineering_requirements q on q.id = c.requirement_id
    group by c.objective_id
  )
  select jsonb_build_object(
    'program_id', p_program_id,
    'control_id', p_control_id,
    'objectives', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'label', p.label, 'prose', p.prose, 'ancestors', to_jsonb(pl.ancestors),
        'mapped', s.mapped, 'evidenced', s.evidenced, 'requirements', s.requirements
      ) order by pl.path, p.id)
      from standing s
      join part p on p.id = s.objective_id
      join place pl on pl.id = p.id), '[]'::jsonb)
  ) into answer;
  return answer;
end; $$;
revoke all on function public.program_control_objectives(uuid, uuid) from public, anon;
grant execute on function public.program_control_objectives(uuid, uuid) to authenticated;
comment on function public.program_control_objectives(uuid, uuid) is 'The assessment objectives one control counts (its leaf objectives), in the catalog''s reading order, each with its label (AC-02a.[01]), its text, the objectives above it, whether the program''s requirements cover it (mapped) and whether one that covers it cites evidence (evidenced), and the requirements that cover it by code. A control with no objective answers none. Counted as program_control_status counts (program_control_objective_cover). Security invoker: a program the reader cannot read is refused.';

notify pgrst, 'reload schema';
