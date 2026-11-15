-- Run with psql -v ON_ERROR_STOP=1 after migrations and the pinned reference data
-- (npm run seed:reference). Every test row rolls back.
-- Two reads that count on the server what a screen once read every row to count (Heavy reads
-- trimmed): procedure_rows (20261115214900_procedure_rows), a campaign record's Procedures, each
-- procedure with how many revisions it has; and system_component_changes
-- (20261115220200_system_component_changes), the program Library tab's Changed here, each system
-- component with how many of its contributions describe it otherwise than the library
-- implementation they started from. Another workspace's member and an anonymous session read
-- none of either.
begin;
insert into auth.users(id, email, raw_user_meta_data) values
  ('7e5d0000-0000-0000-0000-000000000001', 'trimmed-reads-owner@example.test', '{"name":"Trimmed reads test owner"}'),
  ('7e5d0000-0000-0000-0000-000000000002', 'trimmed-reads-outsider@example.test', '{"name":"Trimmed reads test outsider"}');
select set_config('request.jwt.claim.sub', '7e5d0000-0000-0000-0000-000000000002', true);
set local role authenticated;
select public.ensure_personal_tenant();
select set_config('request.jwt.claim.sub', '7e5d0000-0000-0000-0000-000000000001', true);
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
-- The records are written as the tables' owner: a contribution's library origin is recorded only
-- by the apply command for a reader.
reset role;

do $$
declare
  v_tenant uuid := current_setting('test.tenant')::uuid;
  v_resolution uuid; v_selection uuid; v_controls uuid[]; v_selections uuid[];
  v_program uuid := '7e5d1000-0000-0000-0000-000000000001';
  v_system uuid := '7e5d2000-0000-0000-0000-000000000001';
  v_ssp uuid := '7e5d3000-0000-0000-0000-000000000001';
  v_definition uuid := '7e5d5000-0000-0000-0000-000000000001';
  v_version uuid := '7e5d5100-0000-0000-0000-000000000001';
  v_defined uuid := '7e5d5200-0000-0000-0000-000000000001';
begin
  select sc.profile_resolution_id, sc.id into v_resolution, v_selection
  from public.selected_controls sc join public.profile_resolutions r on r.id = sc.profile_resolution_id
  where r.tenant_id is null and r.state = 'published' order by sc.id limit 1;
  if v_selection is null then
    raise exception 'The reference data is not loaded. Run npm run seed:reference first.';
  end if;
  -- Three controls of the catalog, one for each library implementation to claim.
  select array_agg(sc.control_id order by sc.control_id), array_agg(sc.id order by sc.control_id)
    into v_controls, v_selections
  from (select * from public.selected_controls where profile_resolution_id = v_resolution
    order by control_id limit 3) sc;
  insert into public.programs(id, tenant_id, code, name) values (v_program, v_tenant, 'TRIM', 'Trimmed reads test');

  -- Two procedures of the program: the first with two revisions, the second with none.
  insert into public.procedures(id, tenant_id, program_id, title, description) values
    ('7e5d6000-0000-0000-0000-000000000001', v_tenant, v_program, 'Account review', 'Review the accounts.'),
    ('7e5d6000-0000-0000-0000-000000000002', v_tenant, v_program, 'Boundary scan', null);
  insert into public.procedure_revisions(tenant_id, procedure_id, version_number, title, method) values
    (v_tenant, '7e5d6000-0000-0000-0000-000000000001', 1, 'Account review, first', 'examine'),
    (v_tenant, '7e5d6000-0000-0000-0000-000000000001', 2, 'Account review, second', 'test');

  -- A boundary, its SSP and three control implementations, and two components on it: the first
  -- applied from a library component, the second written here.
  insert into public.systems(id, tenant_id, program_id, code, name, system_type, is_authorization_boundary) values
    (v_system, v_tenant, v_program, 'TRIM-SYS', 'Trimmed reads system', 'information_system', true);
  insert into public.ssp_revisions(id, tenant_id, system_id, profile_resolution_id, version_number) values
    (v_ssp, v_tenant, v_system, v_resolution, 1);
  insert into public.implemented_requirements(id, tenant_id, ssp_revision_id, selected_control_id, description)
    select ('7e5d4000-0000-0000-0000-00000000000' || n)::uuid, v_tenant, v_ssp, v_selections[n],
      'The system meets the control.'
    from generate_series(1, 3) n;
  insert into public.component_definitions(id, tenant_id, code, name) values
    (v_definition, v_tenant, 'TRIM-LIB', 'Trimmed reads library component');
  insert into public.component_definition_revisions(id, tenant_id, component_definition_id, version_number) values
    (v_version, v_tenant, v_definition, 1);
  insert into public.defined_components(id, tenant_id, component_definition_revision_id, name, component_type) values
    (v_defined, v_tenant, v_version, 'Library component', 'software');
  insert into public.defined_component_implementations(id, tenant_id, component_definition_revision_id, defined_component_id, control_id, description, implementation_status) values
    ('7e5d5300-0000-0000-0000-000000000001', v_tenant, v_version, v_defined, v_controls[1], 'The library says one thing.', 'implemented'),
    ('7e5d5300-0000-0000-0000-000000000002', v_tenant, v_version, v_defined, v_controls[2], 'The library says another.', 'implemented'),
    ('7e5d5300-0000-0000-0000-000000000003', v_tenant, v_version, v_defined, v_controls[3], 'The library says a third.', 'implemented');
  insert into public.system_components(id, tenant_id, system_id, code, name, component_type, defined_component_id) values
    ('7e5d7000-0000-0000-0000-000000000001', v_tenant, v_system, 'TRIM-K1', 'Applied component', 'software', v_defined),
    ('7e5d7000-0000-0000-0000-000000000002', v_tenant, v_system, 'TRIM-K2', 'Local component', 'software', null);
  -- The applied component's three contributions: one as the library says it, one described
  -- otherwise, and one whose status alone differs; the local component's, with no library origin.
  insert into public.component_contributions(tenant_id, ssp_revision_id, implemented_requirement_id, system_component_id, description, implementation_status, library_implementation_id) values
    (v_tenant, v_ssp, '7e5d4000-0000-0000-0000-000000000001', '7e5d7000-0000-0000-0000-000000000001', 'The library says one thing.', 'implemented', '7e5d5300-0000-0000-0000-000000000001'),
    (v_tenant, v_ssp, '7e5d4000-0000-0000-0000-000000000002', '7e5d7000-0000-0000-0000-000000000001', 'Changed here.', 'implemented', '7e5d5300-0000-0000-0000-000000000002'),
    (v_tenant, v_ssp, '7e5d4000-0000-0000-0000-000000000003', '7e5d7000-0000-0000-0000-000000000001', 'The library says a third.', 'planned', '7e5d5300-0000-0000-0000-000000000003'),
    (v_tenant, v_ssp, '7e5d4000-0000-0000-0000-000000000001', '7e5d7000-0000-0000-0000-000000000002', 'Written here.', 'implemented', null);
end $$;

set local role authenticated;
do $$
declare v_row public.procedure_rows;
begin
  -- Each procedure with its own columns and how many revisions it has.
  select * into v_row from public.procedure_rows where id = '7e5d6000-0000-0000-0000-000000000001';
  if v_row.versions is distinct from 2 or v_row.title is distinct from 'Account review'
    or v_row.description is distinct from 'Review the accounts.'
    or v_row.program_id is distinct from '7e5d1000-0000-0000-0000-000000000001' then
    raise exception 'A procedure reads with its revisions counted: %', row_to_json(v_row);
  end if;
  if (select versions from public.procedure_rows where id = '7e5d6000-0000-0000-0000-000000000002') is distinct from 0 then
    raise exception 'A procedure with no revision counts none';
  end if;
  -- The applied component counts the one contribution described otherwise; a status alone is not
  -- a description changed here, and a component with no library origin has no row.
  if (select description_changed from public.system_component_changes
      where id = '7e5d7000-0000-0000-0000-000000000001') is distinct from 1 then
    raise exception 'The applied component counts its contributions described here: %',
      (select row_to_json(c) from public.system_component_changes c where c.id = '7e5d7000-0000-0000-0000-000000000001');
  end if;
  if exists (select 1 from public.system_component_changes where id = '7e5d7000-0000-0000-0000-000000000002') then
    raise exception 'A component with no library origin has no row';
  end if;
end $$;

-- Another workspace's member and an anonymous session read none of either.
select set_config('request.jwt.claim.sub', '7e5d0000-0000-0000-0000-000000000002', true);
do $$ begin
  if exists (select 1 from public.procedure_rows where program_id = '7e5d1000-0000-0000-0000-000000000001') then
    raise exception 'Another workspace reads the procedures';
  end if;
  if exists (select 1 from public.system_component_changes where id = '7e5d7000-0000-0000-0000-000000000001') then
    raise exception 'Another workspace reads the library changes';
  end if;
end $$;
set local role anon;
do $$ begin
  perform 1 from public.procedure_rows limit 1;
  raise exception 'An anonymous session reads the procedures';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform 1 from public.system_component_changes limit 1;
  raise exception 'An anonymous session reads the library changes';
exception when insufficient_privilege then null;
end $$;
reset role;
rollback;
