-- One status for each control of a program's control baseline, in one read.
--
-- A control's status is where the program stands on it, the furthest step it has reached:
--
--   no_requirement         no requirement of the program maps it
--   no_evidence            a requirement maps it, and none of them cites evidence
--   not_assessed           a requirement that maps it cites evidence, and no assessor has
--                          recorded a determination on it
--   other_than_satisfied   an assessor's latest determination on one of its parts
--   partially_satisfied    (the worst among its parts decides)
--   satisfied
--
-- Everything is counted as the reads beside it count it. A control stands in the baseline when a
-- control baseline the program adopted selects it (program_reference_choices, selected_controls,
-- as risk_threats reads it). Its requirements are the program's whose latest revision maps it, and
-- a requirement has evidence when that revision cites an evidence version (assurance_trace). A
-- determination is the latest an assessor recorded on a part of the control in a published results
-- revision of one of the program's assessment campaigns; a draft result decides nothing, and
-- `not_assessed` recorded by an assessor is no determination.
--
-- Security invoker: row-level security decides what the reader's session sees, and a program the
-- reader cannot read is refused, never answered as empty.
create function public.program_control_status(p_program_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare answer jsonb;
begin
  if auth.uid() is null or not exists (select 1 from public.programs p where p.id = p_program_id) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
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
        when n.evidenced > 0 then 'not_assessed'
        when n.requirements > 0 then 'no_evidence'
        else 'no_requirement'
      end as status
    from counted n
    join public.controls k on k.id = n.control_id
    left join public.catalog_groups g on g.id = k.group_id
    left join worst w on w.control_id = n.control_id
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
        'status', l.status, 'requirements', l.requirements, 'evidenced', l.evidenced
      ) order by l.family nulls last, l.code_order, l.id), '[]'::jsonb)
      from line l)
  ) into answer;
  return answer;
end; $$;

revoke all on function public.program_control_status(uuid) from public, anon;
grant execute on function public.program_control_status(uuid) to authenticated;
comment on function public.program_control_status(uuid) is 'One status for each control of a program''s control baseline: no requirement, no evidence, not assessed, or the worst of the latest determinations an assessor published on its parts, with the program''s requirements that map it and how many of them cite evidence. Security invoker: a program the reader cannot read is refused.';
