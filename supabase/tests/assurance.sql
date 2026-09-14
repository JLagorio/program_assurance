-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
begin;
create or replace function pg_temp.expect_error(statement text, expected_state text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_state then return; end if;
    raise exception 'Expected SQLSTATE %, got %: %', expected_state, sqlstate, sqlerrm;
  end;
  raise exception 'Statement unexpectedly succeeded: %', statement;
end;
$$;

insert into auth.users(id, email, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-000000000001', 'schema-owner@example.test', '{"name":"Schema test owner"}'),
  ('a0000000-0000-0000-0000-000000000002', 'schema-viewer@example.test', '{}'),
  ('a0000000-0000-0000-0000-000000000003', 'schema-outsider@example.test', '{}'),
  ('a0000000-0000-0000-0000-000000000004', 'schema-admin@example.test', '{}');
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
do $$ begin
  if public.ensure_personal_tenant() <> current_setting('test.tenant')::uuid then
    raise exception 'Personal tenant creation is not idempotent';
  end if;
  if (select count(*) from public.parties where tenant_id = current_setting('test.tenant')::uuid) <> 1 then
    raise exception 'Account identity party was not created exactly once';
  end if;
end $$;
insert into public.tenant_memberships(tenant_id, user_id, role) values
  (current_setting('test.tenant')::uuid, 'a0000000-0000-0000-0000-000000000002', 'viewer'),
  (current_setting('test.tenant')::uuid, 'a0000000-0000-0000-0000-000000000004', 'admin');
select pg_temp.expect_error(format('delete from public.tenant_memberships where tenant_id = %L and role = ''owner''', current_setting('test.tenant')), '23514');
insert into public.programs(id, tenant_id, code, name) values ('b0000000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'TEST-PROGRAM', 'Rollback test program');
select pg_temp.expect_error('update public.programs set name = ''Stale change'' where id = ''b0000000-0000-0000-0000-000000000001''', 'PT409');
update public.programs set name = 'Current change', revision = 2 where id = 'b0000000-0000-0000-0000-000000000001' and revision = 1;
select pg_temp.expect_error('update public.programs set name = ''Stale change'', revision = 2 where id = ''b0000000-0000-0000-0000-000000000001''', 'PT409');
do $$ begin
  if not exists (select 1 from public.programs where id = 'b0000000-0000-0000-0000-000000000001' and revision = 2 and created_by = auth.uid() and updated_by = auth.uid()) then
    raise exception 'CAS revision and audit actors were not preserved';
  end if;
end $$;
insert into public.systems(id,tenant_id,program_id,code,name,system_type) values
 ('c0000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'b0000000-0000-0000-0000-000000000001','TEST-SYSTEM','Rollback system','information_system');
insert into public.composition_nodes(id,tenant_id,system_id,code,name,node_type) values
 ('d0000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'c0000000-0000-0000-0000-000000000001','TEST-ROOT','Rollback root','subsystem');
insert into public.composition_nodes(id,tenant_id,system_id,parent_id,code,name,node_type) values
 ('d0000000-0000-0000-0000-000000000002',current_setting('test.tenant')::uuid,'c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','TEST-CHILD','Rollback child','software');
select pg_temp.expect_error('update public.composition_nodes set parent_id = ''d0000000-0000-0000-0000-000000000002'', revision = 2 where id = ''d0000000-0000-0000-0000-000000000001''', '23514');
insert into public.engineering_requirements(id,tenant_id,program_id,code) values
 ('e0000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'b0000000-0000-0000-0000-000000000001','TEST-REQ');
insert into public.requirement_revisions(id,tenant_id,engineering_requirement_id,version_number,title,statement,acceptance_criteria,requirement_type) values
 ('f0000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'e0000000-0000-0000-0000-000000000001',1,'Rollback requirement','An authored test statement','A test acceptance condition','security');
select pg_temp.expect_error(format('insert into public.requirement_allocations(tenant_id,requirement_revision_id) values (%L,''f0000000-0000-0000-0000-000000000001'')', current_setting('test.tenant')), '23514');
insert into public.requirement_allocations(id,tenant_id,requirement_revision_id,composition_node_id) values
 ('f1000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'f0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000002');
update public.requirement_revisions set state = 'published', revision = 2 where id = 'f0000000-0000-0000-0000-000000000001';
do $$ begin
  if (select published_at from public.requirement_revisions where id = 'f0000000-0000-0000-0000-000000000001') is null then
    raise exception 'Publication event time was not recorded';
  end if;
end $$;
-- Legacy requirement publication does not prevent direct edits or linking.
update public.requirement_revisions set statement = 'Changed', revision = 3 where id = 'f0000000-0000-0000-0000-000000000001';
do $$ begin
  if (select count(*) from public.requirement_revisions where engineering_requirement_id = 'e0000000-0000-0000-0000-000000000001') <> 1
    or not exists (select 1 from public.activity_events where requirement_revision_id = 'f0000000-0000-0000-0000-000000000001'
      and source_requirement_revision_id is null and event_type = 'updated'
      and changes->'statement' = '{"before":"An authored test statement","after":"Changed"}'::jsonb
      and actor_party_id = (select id from public.parties where tenant_id = current_setting('test.tenant')::uuid and auth_user_id = auth.uid())) then
    raise exception 'Requirement edit did not retain its record and actual edit history';
  end if;
end $$;
delete from public.requirement_allocations where id = 'f1000000-0000-0000-0000-000000000001';
insert into public.requirement_allocations(tenant_id,requirement_revision_id,composition_node_id)
  values (current_setting('test.tenant')::uuid,'f0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001');

-- With authoritative references installed, verify actual SSP/control relationships.
do $$
declare selected_id uuid; resolution_id uuid; source_control_id uuid; part_id uuid; other_selected_id uuid; other_part_id uuid;
begin
  select sc.id, sc.profile_resolution_id, sc.control_id, cp.id into selected_id, resolution_id, source_control_id, part_id
    from public.selected_controls sc join public.control_parts cp on cp.control_id = sc.control_id
    where sc.tenant_id is null and cp.name = 'statement' order by sc.id, cp.id limit 1;
  if selected_id is null then return; end if;
  insert into public.ssp_revisions(id,tenant_id,system_id,profile_resolution_id,version_number)
    values ('f2000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'c0000000-0000-0000-0000-000000000001',resolution_id,1);
  select id into other_selected_id from public.selected_controls where profile_resolution_id <> resolution_id limit 1;
  if other_selected_id is not null then
    perform pg_temp.expect_error(format('insert into public.implemented_requirements(tenant_id,ssp_revision_id,selected_control_id) values (%L,%L,%L)',current_setting('test.tenant'),'f2000000-0000-0000-0000-000000000001',other_selected_id),'23514');
  end if;
  insert into public.implemented_requirements(id,tenant_id,ssp_revision_id,selected_control_id,description)
    values ('f3000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'f2000000-0000-0000-0000-000000000001',selected_id,'Rollback implementation narrative');
  select cp.id into other_part_id from public.control_parts cp where cp.control_id <> source_control_id limit 1;
  perform pg_temp.expect_error(format('insert into public.implementation_statements(tenant_id,ssp_revision_id,implemented_requirement_id,control_part_id,description) values (%L,%L,%L,%L,''Wrong statement'')',current_setting('test.tenant'),'f2000000-0000-0000-0000-000000000001','f3000000-0000-0000-0000-000000000001',other_part_id),'23514');
  insert into public.implementation_statements(id,tenant_id,ssp_revision_id,implemented_requirement_id,control_part_id,description)
    values ('f4000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'f2000000-0000-0000-0000-000000000001','f3000000-0000-0000-0000-000000000001',part_id,'Rollback statement narrative');
  insert into public.system_components(id,tenant_id,system_id,code,name,component_type)
    values ('f5000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'c0000000-0000-0000-0000-000000000001','TEST-COMPONENT','Rollback component','software');
  insert into public.component_contributions(id,tenant_id,ssp_revision_id,implemented_requirement_id,implementation_statement_id,system_component_id,description)
    values ('f6000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'f2000000-0000-0000-0000-000000000001','f3000000-0000-0000-0000-000000000001','f4000000-0000-0000-0000-000000000001','f5000000-0000-0000-0000-000000000001','Rollback contribution');
  update public.ssp_revisions set state = 'published', revision = 2 where id = 'f2000000-0000-0000-0000-000000000001';
  perform pg_temp.expect_error('update public.implementation_statements set description = ''Must not change'', revision = 2 where id = ''f4000000-0000-0000-0000-000000000001''','23514');
end $$;

-- Viewers can read, cannot create records or promote themselves.
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);
do $$ begin
  if (select count(*) from public.programs where id = 'b0000000-0000-0000-0000-000000000001') <> 1 then raise exception 'Viewer cannot read tenant records'; end if;
end $$;
select pg_temp.expect_error(format('insert into public.programs(tenant_id,code,name) values (%L,''VIEWER-TEST'',''Must reject'')',current_setting('test.tenant')), '42501');
update public.tenant_memberships set role = 'owner' where tenant_id = current_setting('test.tenant')::uuid and user_id = auth.uid();
do $$ begin if public.can_write_tenant(current_setting('test.tenant')::uuid) then raise exception 'Viewer escalated membership'; end if; end $$;

-- Admins manage ordinary membership but cannot acquire ownership.
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', true);
select pg_temp.expect_error(format('insert into public.tenant_memberships(tenant_id,user_id,role) values (%L,''a0000000-0000-0000-0000-000000000003'',''owner'')',current_setting('test.tenant')), '42501');
update public.tenant_memberships set role = 'owner' where tenant_id = current_setting('test.tenant')::uuid and user_id = auth.uid();
do $$ begin if public.can_own_tenant(current_setting('test.tenant')::uuid) then raise exception 'Admin escalated to owner'; end if; end $$;

-- Outsiders see no rows. Even an owner of another tenant cannot cross-link IDs.
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000003', true);
do $$ begin if exists (select 1 from public.programs) then raise exception 'Outsider saw another tenant'; end if; end $$;
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
select pg_temp.expect_error(format('insert into public.systems(tenant_id,program_id,code,name,system_type) values (%L,''b0000000-0000-0000-0000-000000000001'',''CROSS-TENANT'',''Must reject'',''information_system'')',current_setting('test.other_tenant')), '23503');
reset role;
delete from public.tenants where id = current_setting('test.other_tenant')::uuid;
do $$ begin if exists (select 1 from public.tenant_memberships where tenant_id = current_setting('test.other_tenant')::uuid) then raise exception 'Tenant deletion did not cascade membership cleanup'; end if; end $$;
rollback;
select 'Assurance relational integrity, membership RLS, optimistic locking, and publication checks passed.' as result;
