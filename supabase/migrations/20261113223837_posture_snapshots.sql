-- A program's control status, once a day: the posture trend.
--
-- The Overview says where a program stands on its control baseline now; nothing said where it
-- stood before. program_posture_snapshots keeps one row a program and day: how many controls of
-- its control baseline stood at each control status, in the ladder's order (no requirement, no
-- evidence, not assessed, other than satisfied, partially satisfied, satisfied), and their total,
-- as program_control_status counts them, with the moment they were counted. The trend starts on
-- the day the first snapshot is taken: nothing is backfilled, and a day nobody took is absent.
-- A day is the UTC calendar day.
--
--   take_program_posture_snapshots     takes today's snapshot of one program, or of every program
--                                      that records a control baseline. An upsert: a second run
--                                      the same day counts again and replaces the day's row, never
--                                      a second one. A program with no control baseline takes
--                                      none. Internal: the daily job and the command below call it.
--   ensure_program_posture_snapshots   the command a trend calls before it reads: takes today's
--                                      snapshot of each named program that has none yet, so a
--                                      workspace whose job has not run today, or a stack with no
--                                      job, still fills. It never counts a day again, and records
--                                      no business change, so any member may call it.
--   program_posture_trend              the read: the named programs' snapshots, by program and
--                                      then day, from a day on when one is given. Security
--                                      invoker: a program the reader cannot read is refused.
--
-- Once a day: pg_cron runs take_program_posture_snapshots() at 23:55 UTC under the job name
-- program-posture-snapshots, so a day keeps the counts it closed with. Where pg_cron is not
-- available or may not be created, nothing is scheduled and the trend fills on the days it is
-- read. The job is removed with: select cron.unschedule('program-posture-snapshots');
--
-- program_control_status refuses a caller with no identity, and so does variant_control_delta,
-- which it reads for a program's product variants; a scheduled job has none. Their bodies move,
-- unchanged, into two internal reads the snapshots share, and the public reads keep their checks
-- of who asks, then answer from them as before:
--
--   program_control_status_lines   one line a control of the baseline: its status, requirements,
--                                  evidenced, whose determination and the product assessments
--   variant_control_delta_answer   a variant's delta, as variant_control_delta answers it
--
-- Change the counting there, never in the public reads: the snapshots count what they read.

-- ---------------------------------------------------------------------------------------------
-- A variant's delta, asking nothing of who calls: row-level security decides what it reads, and a
-- system the caller cannot read is refused. variant_control_delta checks the caller first.
-- ---------------------------------------------------------------------------------------------
create function public.variant_control_delta_answer(p_tenant_id uuid, p_system_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  answer jsonb;
  v_system public.systems;
  v_revision public.product_revisions;
  v_product public.products;
  v_configuration public.product_configurations;
  v_assessment public.product_assessments;
  v_latest public.product_revisions;
begin
  select * into v_system from public.systems where tenant_id = p_tenant_id and id = p_system_id;
  if v_system.id is null then
    raise exception 'System access is required' using errcode = '42501';
  end if;
  -- A system that was not created from a product has no delta, which is not an empty one.
  if v_system.product_configuration_id is null then
    return jsonb_build_object('system_id', p_system_id, 'product', null);
  end if;
  select * into v_revision from public.product_revisions where tenant_id = p_tenant_id and id = v_system.product_revision_id;
  select * into v_product from public.products where tenant_id = p_tenant_id and id = v_revision.product_id;
  select * into v_configuration from public.product_configurations where tenant_id = p_tenant_id and id = v_system.product_configuration_id;
  select * into v_assessment from public.product_assessments a
    where a.tenant_id = p_tenant_id and a.product_revision_id = v_revision.id and a.state = 'published'
    order by a.published_at desc, a.id desc limit 1;
  select * into v_latest from public.product_revisions r
    where r.tenant_id = p_tenant_id and r.product_id = v_revision.product_id and r.state = 'published'
      and r.version_number > v_revision.version_number
    order by r.version_number desc limit 1;
  with
  inst as materialized (
    select s.id, s.code, s.name, s.product_element_id, s.product_change_kinds
    from public.systems s
    where s.tenant_id = p_tenant_id and s.boundary_system_id = v_system.id and not s.is_authorization_boundary
  ),
  -- One row an element of the configuration: what became of it in the variant.
  elem as materialized (
    select m.product_element_id, pe.code, pe.name, pe.defined_component_id, i.id as system_id,
      i.product_change_kinds as kinds,
      case when i.id is null then 'removed' when i.product_change_kinds is not null then 'modified' else 'inherited' end as change
    from public.product_configuration_elements m
    join public.product_elements pe on pe.tenant_id = m.tenant_id and pe.id = m.product_element_id
    left join inst i on i.product_element_id = m.product_element_id
    where m.tenant_id = p_tenant_id and m.product_revision_id = v_revision.id
      and m.product_configuration_id = v_configuration.id
  ),
  selected as materialized (
    select sc.control_id from public.selected_controls sc
    where sc.profile_resolution_id = v_system.adopted_profile_resolution_id
  ),
  claims as materialized (
    select e.product_element_id, i.control_id,
      bool_or(i.coverage <> 'full' or nullif(btrim(coalesce(i.consumer_responsibility, '')), '') is not null) as shared
    from elem e
    join public.defined_component_implementations i
      on i.tenant_id = p_tenant_id and i.defined_component_id = e.defined_component_id
    where i.control_id is not null
    group by e.product_element_id, i.control_id
  ),
  dets as materialized (
    select d.control_id, d.product_element_id, d.determination
    from public.product_determinations d
    where d.tenant_id = p_tenant_id and d.product_assessment_id = v_assessment.id
      and (d.product_element_id is null or d.product_element_id in (select product_element_id from elem))
  ),
  -- The product's basis for a control: one row an element (or the whole product) and control.
  basis as materialized (
    select coalesce(c.control_id, d.control_id) as control_id,
      coalesce(c.product_element_id, d.product_element_id) as product_element_id,
      coalesce(c.shared, false) as shared, d.determination
    from claims c
    full join dets d on d.control_id = c.control_id and d.product_element_id = c.product_element_id
  ),
  per as materialized (
    select s.control_id,
      count(b.control_id) as basis,
      count(b.control_id) filter (where b.product_element_id is null or e.change <> 'removed') as kept,
      count(*) filter (where e.change = 'modified') as modified,
      count(*) filter (where e.change = 'removed') as removed,
      coalesce(bool_or(b.shared) filter (where e.change = 'inherited'), false) as shared,
      bool_or(b.determination = 'other_than_satisfied') filter (where b.product_element_id is null or e.change <> 'removed') as other_than,
      bool_or(b.determination = 'partially_satisfied') filter (where b.product_element_id is null or e.change <> 'removed') as partially,
      bool_or(b.determination = 'satisfied') filter (where b.product_element_id is null or e.change <> 'removed') as satisfied,
      coalesce(jsonb_agg(jsonb_build_object(
        'product_element_id', e.product_element_id, 'system_id', e.system_id, 'code', e.code, 'name', e.name,
        'change', e.change, 'kinds', coalesce(to_jsonb(e.kinds), '[]'::jsonb)
      ) order by e.code) filter (where e.change in ('modified', 'removed')), '[]'::jsonb) as changed_elements
    from selected s
    left join basis b on b.control_id = s.control_id
    left join elem e on e.product_element_id = b.product_element_id
    group by s.control_id
  ),
  line as (
    select k.id, k.code, k.title, k.parent_control_id,
      public.natural_sort_key(k.code) collate "C" as code_order,
      upper(g.source_id) as family, g.title as family_title,
      case
        when p.kept = 0 then 'program_only'
        when p.modified > 0 or p.removed > 0 then 'changed_here'
        when p.shared then 'shared'
        else 'inherited'
      end as delta,
      case
        when p.kept = 0 then null
        when p.other_than then 'other_than_satisfied'
        when p.partially then 'partially_satisfied'
        when p.satisfied then 'satisfied'
        else 'not_assessed'
      end as product_status,
      p.changed_elements
    from per p
    join public.controls k on k.id = p.control_id
    left join public.catalog_groups g on g.id = k.group_id
  )
  select jsonb_build_object(
    'system_id', p_system_id,
    'program_id', v_system.program_id,
    'product', jsonb_build_object(
      'id', v_product.id, 'code', v_product.code, 'name', v_product.name,
      'revision_id', v_revision.id, 'version', v_revision.version_number,
      'configuration_id', v_configuration.id, 'configuration_code', v_configuration.code,
      'configuration', v_configuration.name),
    'assessment', case when v_assessment.id is null then null else jsonb_build_object(
      'id', v_assessment.id, 'title', v_assessment.title, 'published_at', v_assessment.published_at) end,
    'update_available', case when v_latest.id is null then null else jsonb_build_object(
      'revision_id', v_latest.id, 'version', v_latest.version_number) end,
    'elements', jsonb_build_object(
      'inherited', (select count(*) from elem where change = 'inherited'),
      'modified', (select count(*) from elem where change = 'modified'),
      'removed', (select count(*) from elem where change = 'removed'),
      'added', (select count(*) from inst where product_element_id is null)),
    'totals', jsonb_build_object(
      'controls', (select count(*) from line),
      'inherited', (select count(*) from line where delta = 'inherited'),
      'shared', (select count(*) from line where delta = 'shared'),
      'changed_here', (select count(*) from line where delta = 'changed_here'),
      'program_only', (select count(*) from line where delta = 'program_only')),
    'controls', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id, 'code', l.code, 'title', l.title, 'parent_id', l.parent_control_id,
        'family', l.family, 'family_title', l.family_title,
        'delta', l.delta, 'product_status', l.product_status, 'changed_elements', l.changed_elements
      ) order by l.family nulls last, l.code_order, l.id), '[]'::jsonb)
      from line l)
  ) into answer;
  return answer;
end;
$$;
revoke all on function public.variant_control_delta_answer(uuid, uuid) from public, anon;
grant execute on function public.variant_control_delta_answer(uuid, uuid) to authenticated;
comment on function public.variant_control_delta_answer(uuid, uuid) is 'Internal: variant_control_delta''s answer, asking nothing of who calls. Row-level security decides what it reads, and a system the caller cannot read is refused. Security invoker; program_control_status_lines reads it for the posture snapshots, which a scheduled job takes with no identity.';

create or replace function public.variant_control_delta(p_tenant_id uuid, p_system_id uuid)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
begin
  if auth.uid() is null or not public.can_read_tenant(p_tenant_id) then
    raise exception 'Workspace access is required' using errcode = '42501';
  end if;
  return public.variant_control_delta_answer(p_tenant_id, p_system_id);
end;
$$;
revoke all on function public.variant_control_delta(uuid, uuid) from public, anon;
grant execute on function public.variant_control_delta(uuid, uuid) to authenticated;
comment on function public.variant_control_delta(uuid, uuid) is 'For a system created from a product configuration: each control of its control baseline as inherited, shared, changed_here or program_only against what the product gives, with the product''s standing on it and the modified or removed elements behind a change. A system that was not created from a product answers no product. The answer is variant_control_delta_answer''s.';

-- ---------------------------------------------------------------------------------------------
-- One line a control of a program's control baseline, as program_control_status counts it.
-- ---------------------------------------------------------------------------------------------
create function public.program_control_status_lines(p_program_id uuid)
returns table (
  id uuid, code text, title text, parent_control_id uuid, code_order text,
  family text, family_title text, requirements bigint, evidenced bigint,
  status text, determined_by text, product_assessments jsonb
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
  select l.id, l.code, l.title, l.parent_control_id, l.code_order, l.family, l.family_title,
    l.requirements, l.evidenced, l.status, l.determined_by, l.product_assessments
  from line l;
end; $$;
revoke all on function public.program_control_status_lines(uuid) from public, anon;
grant execute on function public.program_control_status_lines(uuid) to authenticated;
comment on function public.program_control_status_lines(uuid) is 'Internal: one line a control of a program''s control baseline, as program_control_status answers it (its status, the requirements that map it and how many cite evidence, whose determination and the product assessments behind a product''s), asking nothing of who calls but that row-level security lets them read the program. Security invoker. program_control_status and the posture snapshots count from it.';

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
        'determined_by', l.determined_by,
        'product_assessments', coalesce(l.product_assessments, '[]'::jsonb)
      ) order by l.family nulls last, l.code_order collate "C", l.id), '[]'::jsonb)
      from line l)
  ) into answer;
  return answer;
end; $$;

revoke all on function public.program_control_status(uuid) from public, anon;
grant execute on function public.program_control_status(uuid) to authenticated;
comment on function public.program_control_status(uuid) is 'One status for each control of a program''s control baseline: the worst of the latest determinations an assessor of the program published on its parts; else, where every product variant of the program inherits the control with a determination, the worst of the product''s determinations; else not assessed, no evidence or no requirement. Each control says whose determination its status is (determined_by: program or product) and the product assessments behind a product''s, with the program''s requirements that map it and how many of them cite evidence. Security invoker: a program the reader cannot read is refused. The lines are program_control_status_lines''s, which the posture snapshots count too.';

-- ---------------------------------------------------------------------------------------------
-- A program's control status counts, one row a day. Written only by take_program_posture_snapshots.
-- ---------------------------------------------------------------------------------------------
create table public.program_posture_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  program_id uuid not null,
  taken_on date not null,
  taken_at timestamptz not null default now(),
  controls integer not null check (controls >= 0),
  no_requirement integer not null check (no_requirement >= 0),
  no_evidence integer not null check (no_evidence >= 0),
  not_assessed integer not null check (not_assessed >= 0),
  other_than_satisfied integer not null check (other_than_satisfied >= 0),
  partially_satisfied integer not null check (partially_satisfied >= 0),
  satisfied integer not null check (satisfied >= 0),
  unique (tenant_id, id),
  unique (program_id, taken_on),
  foreign key (tenant_id, program_id) references public.programs(tenant_id, id) on delete cascade,
  check (controls = no_requirement + no_evidence + not_assessed + other_than_satisfied + partially_satisfied + satisfied)
);
alter table public.program_posture_snapshots enable row level security;
revoke all on public.program_posture_snapshots from public, anon, authenticated;
grant select on public.program_posture_snapshots to authenticated;
create policy program_posture_snapshot_read on public.program_posture_snapshots for select to authenticated using (public.can_read_tenant(tenant_id));
create index program_posture_snapshots_tenant_idx on public.program_posture_snapshots(tenant_id);
comment on table public.program_posture_snapshots is 'A program''s control status, once a day: how many controls of its control baseline stood at each control status and their total, as program_control_status counts them. One row a program and UTC day; members read, and only take_program_posture_snapshots writes.';
comment on column public.program_posture_snapshots.taken_on is 'The UTC calendar day the counts belong to.';
comment on column public.program_posture_snapshots.taken_at is 'When the counts were last taken that day: a second run the same day counts again.';
comment on column public.program_posture_snapshots.controls is 'The controls the control baseline selected: the six statuses add up to it.';

-- ---------------------------------------------------------------------------------------------
-- Take today's snapshot of one program, or of every program that records a control baseline.
-- ---------------------------------------------------------------------------------------------
create function public.take_program_posture_snapshots(p_program_id uuid default null)
returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_at timestamptz := clock_timestamp();
  v_day date := (v_at at time zone 'utc')::date;
  v_program record;
  v_taken integer := 0;
begin
  for v_program in
    select p.id, p.tenant_id from public.programs p
    where (p_program_id is null or p.id = p_program_id)
      and exists (select 1 from public.program_reference_choices c where c.program_id = p.id)
    order by p.tenant_id, p.id
  loop
    begin
      insert into public.program_posture_snapshots(tenant_id, program_id, taken_on, taken_at, controls,
        no_requirement, no_evidence, not_assessed, other_than_satisfied, partially_satisfied, satisfied)
      select v_program.tenant_id, v_program.id, v_day, v_at, count(*),
        count(*) filter (where l.status = 'no_requirement'),
        count(*) filter (where l.status = 'no_evidence'),
        count(*) filter (where l.status = 'not_assessed'),
        count(*) filter (where l.status = 'other_than_satisfied'),
        count(*) filter (where l.status = 'partially_satisfied'),
        count(*) filter (where l.status = 'satisfied')
      from public.program_control_status_lines(v_program.id) l
      on conflict (program_id, taken_on) do update set
        taken_at = excluded.taken_at, controls = excluded.controls,
        no_requirement = excluded.no_requirement, no_evidence = excluded.no_evidence,
        not_assessed = excluded.not_assessed, other_than_satisfied = excluded.other_than_satisfied,
        partially_satisfied = excluded.partially_satisfied, satisfied = excluded.satisfied;
      v_taken := v_taken + 1;
    exception when others then
      -- One program's failure never costs the others their day: the job says it and goes on. Asked
      -- for one program, the failure is the caller's to see.
      if p_program_id is not null then raise; end if;
      raise warning 'Program % took no posture snapshot: % (%)', v_program.id, sqlerrm, sqlstate;
    end;
  end loop;
  return v_taken;
end; $$;
revoke all on function public.take_program_posture_snapshots(uuid) from public, anon, authenticated;
comment on function public.take_program_posture_snapshots(uuid) is 'Internal: take today''s (UTC) control status snapshot of one program, or of every program that records a control baseline, counted as program_control_status counts. An upsert: run again the same day, it counts again and replaces the day''s row. A program with no control baseline takes none. Returns how many programs it took. The daily job (pg_cron, program-posture-snapshots) and ensure_program_posture_snapshots call it.';

-- ---------------------------------------------------------------------------------------------
-- The command a trend calls before it reads: today's snapshot of each named program that has none.
-- ---------------------------------------------------------------------------------------------
create function public.ensure_program_posture_snapshots(p_program_ids uuid[])
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_day date := (clock_timestamp() at time zone 'utc')::date;
  v_id uuid;
  v_taken uuid[] := '{}';
begin
  if auth.uid() is null or p_program_ids is null
    or exists (select 1 from unnest(p_program_ids) n(id)
      where n.id is null or not exists (
        select 1 from public.programs p where p.id = n.id and public.can_read_tenant(p.tenant_id))) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  if cardinality(p_program_ids) > 100 then
    raise exception 'Ask for at most 100 programs at once' using errcode = '22023';
  end if;
  for v_id in
    select p.id from public.programs p
    where p.id = any(p_program_ids)
      and exists (select 1 from public.program_reference_choices c where c.program_id = p.id)
      and not exists (select 1 from public.program_posture_snapshots s where s.program_id = p.id and s.taken_on = v_day)
    order by p.id
  loop
    perform public.take_program_posture_snapshots(v_id);
    v_taken := v_taken || v_id;
  end loop;
  return jsonb_build_object('taken_on', v_day, 'taken', to_jsonb(v_taken));
end; $$;
revoke all on function public.ensure_program_posture_snapshots(uuid[]) from public, anon;
grant execute on function public.ensure_program_posture_snapshots(uuid[]) to authenticated;
comment on function public.ensure_program_posture_snapshots(uuid[]) is 'Take today''s (UTC) control status snapshot of each named program that records a control baseline and has none yet, so a trend fills where the daily job has not run. It never counts a day again. Every named program must be one the caller can read; any member may ask, since the counts are the server''s. Answers the day and the programs it took.';

-- ---------------------------------------------------------------------------------------------
-- The read: the named programs' snapshots, by program and then day.
-- ---------------------------------------------------------------------------------------------
create function public.program_posture_trend(p_program_ids uuid[], p_since date default null)
returns setof public.program_posture_snapshots
language plpgsql stable security invoker set search_path = '' as $$
begin
  if auth.uid() is null or p_program_ids is null
    or exists (select 1 from unnest(p_program_ids) n(id)
      where n.id is null or not exists (select 1 from public.programs p where p.id = n.id)) then
    raise exception 'Program access is required' using errcode = '42501';
  end if;
  return query
    select s.* from public.program_posture_snapshots s
    where s.program_id = any(p_program_ids) and (p_since is null or s.taken_on >= p_since)
    order by s.program_id, s.taken_on;
end; $$;
revoke all on function public.program_posture_trend(uuid[], date) from public, anon;
grant execute on function public.program_posture_trend(uuid[], date) to authenticated;
comment on function public.program_posture_trend(uuid[], date) is 'The control status snapshots of the named programs, by program and then UTC day, from p_since on when it is given. Security invoker: every named program must be one the reader can read.';

-- ---------------------------------------------------------------------------------------------
-- Once a day, at 23:55 UTC, so a day keeps the counts it closed with. Where pg_cron is not
-- available or may not be created here, nothing is scheduled and the trend fills as it is read.
-- ---------------------------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_catalog.pg_available_extensions where name = 'pg_cron') then
    raise notice 'pg_cron is not available: posture snapshots are taken as their trend is read';
    return;
  end if;
  begin
    create extension if not exists pg_cron with schema pg_catalog;
    perform cron.schedule('program-posture-snapshots', '55 23 * * *', 'select public.take_program_posture_snapshots()');
  exception when others then
    raise notice 'The daily posture snapshot job was not scheduled (% %): snapshots are taken as their trend is read', sqlstate, sqlerrm;
  end;
end $$;

notify pgrst, 'reload schema';
