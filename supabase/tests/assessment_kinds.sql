-- Run with psql -v ON_ERROR_STOP=1 after migrations and the pinned reference data
-- (npm run seed:reference). Every test row rolls back.
-- An assessment's kind (20261115090429_sboms_vulnerabilities_and_cyber_tests): a campaign written
-- as before is a control assessment with no phase; a cyber test names one of the four Cyber T&E
-- phases and nothing else names one; a component assessment takes the same two kinds; the
-- objectives register says its campaign's kind in its last column; a cyber test's findings are
-- assessment findings like any other; and a viewer, another workspace and an anonymous session are
-- where they were.
begin;
create function pg_temp.expect_error(statement text, expected_state text, expected_words text default null) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_state and (expected_words is null or sqlerrm like '%' || expected_words || '%') then return; end if;
    raise exception 'Expected SQLSTATE % saying "%", got %: %', expected_state, expected_words, sqlstate, sqlerrm;
  end;
  raise exception 'Statement unexpectedly succeeded: %', statement;
end;
$$;
grant execute on function pg_temp.expect_error(text, text, text) to authenticated, anon;

-- What the columns are: a kind that says control assessment unless told otherwise, a phase that
-- says nothing, and campaign_kind as the objectives register's last column.
do $$
begin
  if (select pg_get_expr(d.adbin, d.adrelid) from pg_catalog.pg_attrdef d
      join pg_catalog.pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
      where d.adrelid = 'public.assessment_campaigns'::regclass and a.attname = 'kind') <> '''control_assessment''::text'
    or (select pg_get_expr(d.adbin, d.adrelid) from pg_catalog.pg_attrdef d
      join pg_catalog.pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
      where d.adrelid = 'public.component_assessments'::regclass and a.attname = 'kind') <> '''control_assessment''::text'
    or exists (select 1 from pg_catalog.pg_attrdef d
      join pg_catalog.pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
      where d.adrelid = 'public.assessment_campaigns'::regclass and a.attname = 'cyber_test_phase') then
    raise exception 'An assessment written as before is not a control assessment';
  end if;
  if (select a.attname from pg_catalog.pg_attribute a where a.attrelid = 'public.assessment_objective_rows'::regclass
      and a.attnum > 0 and not a.attisdropped order by a.attnum desc limit 1) <> 'campaign_kind' then
    raise exception 'campaign_kind is not the last column of assessment_objective_rows';
  end if;
  if not exists (select 1 from pg_catalog.pg_class c where c.oid = 'public.assessment_objective_rows'::regclass
      and c.reloptions @> array['security_invoker=true'])
    or has_table_privilege('anon', 'public.assessment_objective_rows', 'select')
    or not has_table_privilege('authenticated', 'public.assessment_objective_rows', 'select') then
    raise exception 'assessment_objective_rows does not read as a signed-in caller';
  end if;
end $$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('c7be0000-0000-0000-0000-000000000001', 'assessment-kind-owner@example.test', '{"name":"Assessment kind test owner"}'),
  ('c7be0000-0000-0000-0000-000000000002', 'assessment-kind-outsider@example.test', '{}'),
  ('c7be0000-0000-0000-0000-000000000003', 'assessment-kind-viewer@example.test', '{}');
select set_config('request.jwt.claim.sub', 'c7be0000-0000-0000-0000-000000000002', true);
set local role authenticated;
select public.ensure_personal_tenant();
select set_config('request.jwt.claim.sub', 'c7be0000-0000-0000-0000-000000000001', true);
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'c7be0000-0000-0000-0000-000000000003', 'viewer');
insert into public.programs(id, tenant_id, code, name) values
  ('c7be1000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'KIND-TEST', 'Assessment kind test');

do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_program uuid := 'c7be1000-0000-0000-0000-000000000001';
  v_viewer uuid := 'c7be0000-0000-0000-0000-000000000003';
  v_outsider uuid := 'c7be0000-0000-0000-0000-000000000002';
  v_owner_user uuid := 'c7be0000-0000-0000-0000-000000000001';
  v_plain uuid := gen_random_uuid(); v_cyber uuid := gen_random_uuid(); v_phase text;
  v_campaign public.assessment_campaigns;
begin
  -- Written as before, a campaign is a control assessment and names no phase.
  insert into public.assessment_campaigns(id, tenant_id, title, program_id) values (v_plain, v_tenant, 'A control assessment', v_program);
  select * into v_campaign from public.assessment_campaigns where id = v_plain;
  if v_campaign.kind <> 'control_assessment' or v_campaign.cyber_test_phase is not null then
    raise exception 'A campaign written as before read %', to_jsonb(v_campaign);
  end if;
  -- A cyber test names its phase, and nothing else does.
  perform pg_temp.expect_error(format($q$insert into public.assessment_campaigns(tenant_id, title, program_id, kind) values (%L, 'No phase', %L, 'cyber_test')$q$, v_tenant, v_program), '23514', 'Choose the Cyber T&E phase of a Cyber T&E campaign');
  perform pg_temp.expect_error(format($q$insert into public.assessment_campaigns(tenant_id, title, program_id, cyber_test_phase) values (%L, 'A phase alone', %L, 'cvi')$q$, v_tenant, v_program), '23514', 'Only a Cyber T&E campaign names a Cyber T&E phase');
  perform pg_temp.expect_error(format($q$insert into public.assessment_campaigns(tenant_id, title, program_id, kind, cyber_test_phase) values (%L, 'A phase alone', %L, 'control_assessment', 'cvi')$q$, v_tenant, v_program), '23514', 'Only a Cyber T&E campaign names a Cyber T&E phase');
  perform pg_temp.expect_error(format($q$insert into public.assessment_campaigns(tenant_id, title, program_id, kind, cyber_test_phase) values (%L, 'Another phase', %L, 'cyber_test', 'pentest')$q$, v_tenant, v_program), '23514', 'assessment_campaigns_cyber_test_phase');
  perform pg_temp.expect_error(format($q$insert into public.assessment_campaigns(tenant_id, title, program_id, kind) values (%L, 'Another kind', %L, 'audit')$q$, v_tenant, v_program), '23514', 'assessment_campaigns_kind');
  perform pg_temp.expect_error(format($q$update public.assessment_campaigns set kind = 'cyber_test', revision = revision + 1 where id = %L$q$, v_plain), '23514', 'Choose the Cyber T&E phase of a Cyber T&E campaign');
  -- Each of the four phases, in turn, on one campaign.
  insert into public.assessment_campaigns(id, tenant_id, title, program_id, kind, cyber_test_phase, status, starts_at, ends_at)
    values (v_cyber, v_tenant, 'A cyber test', v_program, 'cyber_test', 'cvi', 'planned', '2027-01-11T00:00:00Z', '2027-02-05T00:00:00Z');
  foreach v_phase in array array['acd', 'cvpa', 'aa', 'cvi'] loop
    update public.assessment_campaigns set cyber_test_phase = v_phase, revision = revision + 1 where id = v_cyber;
  end loop;
  perform pg_temp.expect_error(format($q$update public.assessment_campaigns set kind = 'control_assessment', revision = revision + 1 where id = %L$q$, v_cyber), '23514', 'Only a Cyber T&E campaign names a Cyber T&E phase');
  perform pg_temp.expect_error(format($q$update public.assessment_campaigns set cyber_test_phase = null, revision = revision + 1 where id = %L$q$, v_cyber), '23514', 'Choose the Cyber T&E phase of a Cyber T&E campaign');
  select * into v_campaign from public.assessment_campaigns where id = v_cyber;
  if v_campaign.kind <> 'cyber_test' or v_campaign.cyber_test_phase <> 'cvi' or v_campaign.status <> 'planned' then
    raise exception 'A cyber test read %', to_jsonb(v_campaign);
  end if;
  -- A viewer reads it and writes none; another workspace reads none.
  perform set_config('request.jwt.claim.sub', v_viewer::text, true);
  if (select count(*) from public.assessment_campaigns c where c.kind = 'cyber_test') <> 1 then
    raise exception 'A viewer does not read the cyber test a member reads';
  end if;
  perform pg_temp.expect_error(format($q$insert into public.assessment_campaigns(tenant_id, title, program_id, kind, cyber_test_phase) values (%L, 'A viewer''s', %L, 'cyber_test', 'aa')$q$, v_tenant, v_program), '42501');
  perform set_config('request.jwt.claim.sub', v_outsider::text, true);
  if exists (select 1 from public.assessment_campaigns) or exists (select 1 from public.assessment_objective_rows) then
    raise exception 'Another workspace reads a campaign';
  end if;
  perform set_config('request.jwt.claim.sub', v_owner_user::text, true);
  perform set_config('test.plain', v_plain::text, true);
  perform set_config('test.cyber', v_cyber::text, true);
end $$;

-- With the pinned references installed: a cyber test's plan, objectives, results and findings are
-- the records every assessment has, and a component assessment takes the same two kinds.
do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_program uuid := 'c7be1000-0000-0000-0000-000000000001';
  v_plain uuid := current_setting('test.plain')::uuid; v_cyber uuid := current_setting('test.cyber')::uuid;
  v_resolution uuid; v_control uuid; v_part uuid;
  v_system uuid := gen_random_uuid(); v_ssp uuid := gen_random_uuid();
  v_plan_plain uuid := gen_random_uuid(); v_plan_cyber uuid := gen_random_uuid();
  v_results uuid := gen_random_uuid(); v_set uuid := gen_random_uuid(); v_finding uuid := gen_random_uuid();
  v_definition uuid := gen_random_uuid(); v_revision uuid := gen_random_uuid(); v_component uuid := gen_random_uuid();
  v_assessment public.component_assessments; v_test uuid := gen_random_uuid();
begin
  select sc.profile_resolution_id, sc.control_id into v_resolution, v_control
  from public.selected_controls sc join public.profile_resolutions r on r.id = sc.profile_resolution_id
  where r.tenant_id is null and r.state = 'published'
    and exists (select 1 from public.control_parts p where p.control_id = sc.control_id and p.name = 'statement' and p.parent_part_id is null)
  order by sc.id limit 1;
  if v_control is null then
    raise notice 'The pinned references are not installed: the checks of a cyber test''s records were skipped';
    return;
  end if;
  select p.id into v_part from public.control_parts p
    where p.control_id = v_control and p.name = 'statement' and p.parent_part_id is null order by p.ordinal, p.id limit 1;
  insert into public.systems(id, tenant_id, program_id, code, name, system_type, is_authorization_boundary) values
    (v_system, v_tenant, v_program, 'KIND-SYS', 'Assessment kind system', 'information_system', true);
  insert into public.ssp_revisions(id, tenant_id, system_id, profile_resolution_id, version_number) values
    (v_ssp, v_tenant, v_system, v_resolution, 1);
  insert into public.implemented_requirements(tenant_id, ssp_revision_id, selected_control_id, description)
    select v_tenant, v_ssp, sc.id, 'Assessment kind test narrative.' from public.selected_controls sc
    where sc.profile_resolution_id = v_resolution and sc.control_id = v_control;
  update public.ssp_revisions set state = 'published', revision = revision + 1 where id = v_ssp;
  insert into public.assessment_plan_revisions(id, tenant_id, campaign_id, ssp_revision_id, version_number, title) values
    (v_plan_plain, v_tenant, v_plain, v_ssp, 1, 'Control assessment plan'),
    (v_plan_cyber, v_tenant, v_cyber, v_ssp, 1, 'Cyber test plan');
  insert into public.assessment_objectives(tenant_id, plan_revision_id, title, target_control_part_id) values
    (v_tenant, v_plan_plain, 'Examine the control', v_part),
    (v_tenant, v_plan_cyber, 'Scan the maintenance interface', null),
    (v_tenant, v_plan_cyber, 'Exercise the control from the network', v_part);
  -- The objectives register says each objective's campaign's kind.
  if (select count(*) from public.assessment_objective_rows r where r.campaign_id = v_cyber and r.campaign_kind = 'cyber_test') <> 2
    or (select count(*) from public.assessment_objective_rows r where r.campaign_id = v_plain and r.campaign_kind = 'control_assessment') <> 1
    or (select count(*) from public.assessment_objective_rows r where r.campaign_kind is null) <> 0 then
    raise exception 'The objectives register says the kinds %',
      (select jsonb_agg(jsonb_build_object('title', r.title, 'kind', r.campaign_kind)) from public.assessment_objective_rows r);
  end if;
  -- A cyber test's finding is an assessment finding like any other: it judges the control of its
  -- part, and the findings register lists it.
  update public.assessment_plan_revisions set state = 'published', revision = revision + 1 where id = v_plan_cyber;
  insert into public.assessment_results_revisions(id, tenant_id, assessment_plan_revision_id, version_number, title)
    values (v_results, v_tenant, v_plan_cyber, 1, 'Cyber test results');
  insert into public.result_sets(id, tenant_id, assessment_results_revision_id, title) values (v_set, v_tenant, v_results, 'Cyber test result set');
  insert into public.assessment_findings(id, tenant_id, assessment_results_revision_id, result_set_id, target_control_part_id, title, determination)
    values (v_finding, v_tenant, v_results, v_set, v_part, 'The control held against the scan', 'satisfied');
  if (select r.control_id from public.assessment_finding_rows r where r.id = v_finding) is distinct from v_control then
    raise exception 'A cyber test''s finding does not read as an assessment finding';
  end if;

  -- A component assessment: a control assessment unless it says cyber test, and nothing else.
  insert into public.component_definitions(id, tenant_id, code, name) values (v_definition, v_tenant, 'kind-units', 'Assessment kind units');
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values (v_revision, v_tenant, v_definition, 1);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values (v_component, v_tenant, v_revision, 'A unit', 'software');
  update public.component_definition_revisions set state = 'published', revision = revision + 1 where id = v_revision;
  insert into public.component_assessments(tenant_id, component_definition_revision_id, profile_resolution_id, title)
    values (v_tenant, v_revision, v_resolution, 'A unit, assessed') returning * into v_assessment;
  if v_assessment.kind <> 'control_assessment' then
    raise exception 'A component assessment written as before read %', to_jsonb(v_assessment);
  end if;
  insert into public.component_assessments(id, tenant_id, component_definition_revision_id, profile_resolution_id, title, kind)
    values (v_test, v_tenant, v_revision, v_resolution, 'A unit, cyber tested', 'cyber_test');
  perform pg_temp.expect_error(format($q$insert into public.component_assessments(tenant_id, component_definition_revision_id, profile_resolution_id, title, kind) values (%L, %L, %L, 'A unit, audited', 'audit')$q$, v_tenant, v_revision, v_resolution), '23514', 'component_assessments_kind');
  -- Its determinations stand as any component assessment's do.
  insert into public.component_determinations(tenant_id, component_assessment_id, component_definition_revision_id, defined_component_id, control_id, determination)
    values (v_tenant, v_test, v_revision, v_component, v_control, 'other_than_satisfied');
  update public.component_assessments set state = 'published', published_at = now(), revision = revision + 1 where id = v_test;
  if (public.component_control_status(v_component)->'totals'->>'other_than_satisfied')::integer <> 1 then
    raise exception 'A component''s cyber test does not stand: %', public.component_control_status(v_component)->'totals';
  end if;
end $$;

-- An anonymous session reads none of it.
reset role;
set local role anon;
select pg_temp.expect_error('select count(*) from public.assessment_campaigns', '42501');
select pg_temp.expect_error('select count(*) from public.assessment_objective_rows', '42501');
rollback;
