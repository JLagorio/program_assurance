-- A program's control status counts its product's determinations.
--
-- Until now program_control_status (migration 20261111150000_program_control_status) read only the
-- program's own assessors, so a control a product variant inherits unchanged from a product its
-- product assessment found satisfied read "no requirement" on the program while the Product delta
-- view said it was inherited. The two now agree. A control's status is, in this order:
--
--   1. the worst of the latest determinations an assessor of the program's own campaigns published
--      on its parts: the latest judgment of this system still wins;
--   2. otherwise, where the program holds product variants and every one of them inherits the
--      control with a determination (its delta is inherited and the product's status on what the
--      variant kept is satisfied, partially satisfied or other than satisfied, as
--      variant_control_delta reads it), the worst of those determinations;
--   3. otherwise the program's own ladder: not assessed, no evidence, no requirement.
--
-- A variant inherits a control only where its own control baseline selects it, since that is the
-- list its delta reads. A control that is shared, changed here or program only in any variant, or
-- that a variant does not select, keeps the program's own ladder; so does every control of a
-- program with no variant. A draft product assessment decides nothing, as variant_control_delta
-- reads only the latest published assessment of the variant's version.
--
-- Each control also says whose determination its status is (determined_by: program, product, or
-- null while nobody has determined it) and, where the product determined it, the product
-- assessments it was taken from (product_assessments: id, title and that assessment's worst
-- determination on the control, the deciding one first). Nothing else of the answer changes.
create or replace function public.program_control_status(p_program_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare answer jsonb; v_tenant uuid;
begin
  select p.tenant_id into v_tenant from public.programs p where p.id = p_program_id;
  if auth.uid() is null or v_tenant is null then
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
  -- The program's product variants (its boundary systems created from a product configuration),
  -- in the order the program took them, each read for its delta once, as the Product delta view
  -- reads it, so the two never disagree.
  variant as materialized (
    select s.id, row_number() over (order by s.created_at, s.code, s.id) as position,
      public.variant_control_delta(s.tenant_id, s.id) as delta
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
        when n.evidenced > 0 then 'not_assessed'
        when n.requirements > 0 then 'no_evidence'
        else 'no_requirement'
      end as status,
      case
        when w.control_id is not null then 'program'
        when d.control_id is not null then 'product'
      end as determined_by,
      case when w.control_id is null then d.assessments end as product_assessments
    from counted n
    join public.controls k on k.id = n.control_id
    left join public.catalog_groups g on g.id = k.group_id
    left join worst w on w.control_id = n.control_id
    left join product d on d.control_id = n.control_id
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
        'determined_by', l.determined_by,
        'product_assessments', coalesce(l.product_assessments, '[]'::jsonb)
      ) order by l.family nulls last, l.code_order, l.id), '[]'::jsonb)
      from line l)
  ) into answer;
  return answer;
end; $$;

revoke all on function public.program_control_status(uuid) from public, anon;
grant execute on function public.program_control_status(uuid) to authenticated;
comment on function public.program_control_status(uuid) is 'One status for each control of a program''s control baseline: the worst of the latest determinations an assessor of the program published on its parts; else, where every product variant of the program inherits the control with a determination, the worst of the product''s determinations; else not assessed, no evidence or no requirement. Each control says whose determination its status is (determined_by: program or product) and the product assessments behind a product''s, with the program''s requirements that map it and how many of them cite evidence. Security invoker: a program the reader cannot read is refused.';

notify pgrst, 'reload schema';
