-- Run with psql -v ON_ERROR_STOP=1 after migrations and the pinned reference data
-- (npm run seed:reference). Every test row rolls back.
-- The Assessment campaigns page's Objectives register reads assessment_objective_rows a page at a
-- time (20261114170710_ssp_assembly_and_objective_register_reads): each objective with its
-- campaign's and plan's titles and its plan's version, and sort keys in a reader's order
-- (natural_order: numbers by their value, punctuation before letters, as the screens' Intl.Collator
-- orders titles). The register's own order, campaign_order, plan_version descending,
-- plan_revision_id, reading_order and title_order, is the order the page gave on the client: each
-- campaign's objectives together, the newest plan first, each plan's in the catalog's reading order
-- and then by title. Another workspace's member and an anonymous session read none of it.
begin;
insert into auth.users(id, email, raw_user_meta_data) values
  ('0b500000-0000-0000-0000-000000000001', 'objective-register-owner@example.test', '{"name":"Objective register test owner"}'),
  ('0b500000-0000-0000-0000-000000000002', 'objective-register-outsider@example.test', '{"name":"Objective register test outsider"}');
select set_config('request.jwt.claim.sub', '0b500000-0000-0000-0000-000000000002', true);
set local role authenticated;
select public.ensure_personal_tenant();
select set_config('request.jwt.claim.sub', '0b500000-0000-0000-0000-000000000001', true);
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);

do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_resolution uuid; v_control uuid; v_first uuid; v_second uuid;
  v_program uuid := '0b510000-0000-0000-0000-000000000001';
  v_system uuid := '0b520000-0000-0000-0000-000000000001';
  v_ssp uuid := '0b530000-0000-0000-0000-000000000001';
begin
  -- A reference control with two assessment objectives, the first before the second as the
  -- catalog reads them.
  select sc.profile_resolution_id, sc.control_id into v_resolution, v_control
  from public.selected_controls sc join public.profile_resolutions r on r.id = sc.profile_resolution_id
  where r.tenant_id is null and r.state = 'published'
    and (select count(*) from public.control_parts o where o.control_id = sc.control_id
      and o.name = 'assessment-objective' and o.parent_part_id is not null) >= 2
  order by sc.id limit 1;
  if v_control is null then
    raise exception 'The reference data is not loaded. Run npm run seed:reference first.';
  end if;
  select o.id into v_first from public.control_parts o
    where o.control_id = v_control and o.name = 'assessment-objective' and o.parent_part_id is not null
    order by o.parent_part_id, o.ordinal, o.id limit 1;
  select o.id into v_second from public.control_parts o
    where o.control_id = v_control and o.name = 'assessment-objective' and o.parent_part_id is not null
      and o.parent_part_id = (select parent_part_id from public.control_parts where id = v_first) and o.id <> v_first
    order by o.ordinal, o.id limit 1;
  if v_second is null then
    select o.id into v_second from public.control_parts o
      where o.control_id = v_control and o.name = 'assessment-objective' and o.parent_part_id is not null and o.id <> v_first
      order by o.ordinal, o.id limit 1;
  end if;
  perform set_config('test.first', v_first::text, true);
  perform set_config('test.second', v_second::text, true);
  insert into public.programs(id, tenant_id, code, name) values (v_program, v_tenant, 'OBJ-REG', 'Objective register test');
  insert into public.systems(id, tenant_id, program_id, code, name, system_type, is_authorization_boundary) values
    (v_system, v_tenant, v_program, 'OBJ-SYS', 'Objective register system', 'information_system', true);
  insert into public.ssp_revisions(id, tenant_id, system_id, profile_resolution_id, version_number) values
    (v_ssp, v_tenant, v_system, v_resolution, 1);
  -- A plan assesses a published SSP, which holds a control implementation.
  insert into public.implemented_requirements(tenant_id, ssp_revision_id, selected_control_id, description)
    select v_tenant, v_ssp, sc.id, 'Objective register test narrative.' from public.selected_controls sc
    where sc.profile_resolution_id = v_resolution and sc.control_id = v_control;
  update public.ssp_revisions set state = 'published', revision = revision + 1 where id = v_ssp;
  -- Three campaigns whose titles read in a reader's order: punctuation before letters, and 2
  -- before 10.
  insert into public.assessment_campaigns(id, tenant_id, program_id, title) values
    ('0b540000-0000-0000-0000-000000000001', v_tenant, v_program, 'Witnessing 10'),
    ('0b540000-0000-0000-0000-000000000002', v_tenant, v_program, 'Witnessing 2'),
    ('0b540000-0000-0000-0000-000000000003', v_tenant, v_program, 'Witnessing · prior');
  -- Two plans of the second campaign: the newer one's objectives come first.
  insert into public.assessment_plan_revisions(id, tenant_id, campaign_id, ssp_revision_id, version_number, title) values
    ('0b550000-0000-0000-0000-000000000001', v_tenant, '0b540000-0000-0000-0000-000000000001', v_ssp, 1, 'Plan of ten'),
    ('0b550000-0000-0000-0000-000000000002', v_tenant, '0b540000-0000-0000-0000-000000000002', v_ssp, 1, 'First plan of two'),
    ('0b550000-0000-0000-0000-000000000003', v_tenant, '0b540000-0000-0000-0000-000000000002', v_ssp, 2, 'Second plan of two'),
    ('0b550000-0000-0000-0000-000000000004', v_tenant, '0b540000-0000-0000-0000-000000000003', v_ssp, 1, 'Prior plan');
  insert into public.assessment_objectives(id, tenant_id, plan_revision_id, title, target_control_part_id) values
    -- The newest plan of the second campaign: the control's objectives in the catalog's order,
    -- whatever their titles, then the ones aimed at nothing by title, Step 2 before Step 10.
    ('0b560000-0000-0000-0000-000000000001', v_tenant, '0b550000-0000-0000-0000-000000000003', 'Step 10', null),
    ('0b560000-0000-0000-0000-000000000002', v_tenant, '0b550000-0000-0000-0000-000000000003', 'Step 2', null),
    ('0b560000-0000-0000-0000-000000000003', v_tenant, '0b550000-0000-0000-0000-000000000003', 'Z objective first in the catalog', v_first),
    ('0b560000-0000-0000-0000-000000000004', v_tenant, '0b550000-0000-0000-0000-000000000003', 'A objective second in the catalog', v_second),
    ('0b560000-0000-0000-0000-000000000005', v_tenant, '0b550000-0000-0000-0000-000000000002', 'Older plan''s objective', null),
    ('0b560000-0000-0000-0000-000000000006', v_tenant, '0b550000-0000-0000-0000-000000000001', 'Ten''s objective', null),
    ('0b560000-0000-0000-0000-000000000007', v_tenant, '0b550000-0000-0000-0000-000000000004', 'Prior objective', null);
end $$;

do $$
declare v_order uuid[]; v_row public.assessment_objective_rows;
begin
  select * into v_row from public.assessment_objective_rows where id = '0b560000-0000-0000-0000-000000000005';
  if v_row.campaign_title <> 'Witnessing 2' or v_row.plan_title <> 'First plan of two' or v_row.plan_version <> 1
    or v_row.campaign_id <> '0b540000-0000-0000-0000-000000000002' or v_row.program_id <> '0b510000-0000-0000-0000-000000000001' then
    raise exception 'An objective names its campaign and plan: %', row_to_json(v_row);
  end if;
  v_order := array(
    select o.id from public.assessment_objective_rows o
    where o.program_id = '0b510000-0000-0000-0000-000000000001'
    order by o.campaign_order, o.plan_version desc, o.plan_revision_id, o.reading_order, o.title_order, o.id);
  if v_order <> array[
    '0b560000-0000-0000-0000-000000000007', -- Witnessing · prior
    '0b560000-0000-0000-0000-000000000003', -- Witnessing 2, its second plan: the catalog's first objective,
    '0b560000-0000-0000-0000-000000000004', -- then its second,
    '0b560000-0000-0000-0000-000000000002', -- then Step 2,
    '0b560000-0000-0000-0000-000000000001', -- then Step 10;
    '0b560000-0000-0000-0000-000000000005', -- its first plan;
    '0b560000-0000-0000-0000-000000000006'  -- Witnessing 10.
  ]::uuid[] then
    raise exception 'The register does not read in the campaigns'', plans'' and catalog''s order: %', v_order;
  end if;
  -- Each sort key reads its title in a reader's order.
  if (select array_agg(o.plan_title order by o.plan_order, o.id) from public.assessment_objective_rows o
      where o.campaign_id = '0b540000-0000-0000-0000-000000000002')
    <> array['First plan of two', 'Second plan of two', 'Second plan of two', 'Second plan of two', 'Second plan of two'] then
    raise exception 'The plans do not sort by their titles';
  end if;
end $$;

-- Another workspace's member and an anonymous session read none of it.
select set_config('request.jwt.claim.sub', '0b500000-0000-0000-0000-000000000002', true);
do $$ begin
  if exists (select 1 from public.assessment_objective_rows where program_id = '0b510000-0000-0000-0000-000000000001') then
    raise exception 'Another workspace reads the objectives';
  end if;
end $$;
set local role anon;
do $$ begin
  perform 1 from public.assessment_objective_rows limit 1;
  raise exception 'An anonymous session reads the objectives';
exception when insufficient_privilege then null;
end $$;
reset role;
rollback;
