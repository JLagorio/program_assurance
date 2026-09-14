-- Rollback-only schema checks: never reset or retain operational test records.
begin;
create function pg_temp.expect_error(statement text, expected_state text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if sqlstate = expected_state then return; end if;
    raise exception 'Expected SQLSTATE %, got %: %', expected_state, sqlstate, sqlerrm;
  end;
  raise exception 'Statement unexpectedly succeeded: %', statement;
end;
$$;
insert into auth.users(id,email) values
 ('aa000000-0000-0000-0000-000000000001','workflow-owner@example.test'),
 ('aa000000-0000-0000-0000-000000000002','workflow-outsider@example.test');
select set_config('request.jwt.claim.sub','aa000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select set_config('test.tenant',public.ensure_personal_tenant()::text,true);
insert into public.programs(id,tenant_id,code,name) values
 ('bb000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'WORKFLOW-TEST','Rollback workflow program');
insert into public.tasks(id,tenant_id,program_id,title) values
 ('cc000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'bb000000-0000-0000-0000-000000000001','Rollback task');
do $$ begin
 if (select due_at is not null or completed_at is not null from public.tasks where id='cc000000-0000-0000-0000-000000000001') then raise exception 'Unknown business dates were fabricated'; end if;
end $$;
select pg_temp.expect_error('update public.tasks set title=''Stale'' where id=''cc000000-0000-0000-0000-000000000001''','PT409');
update public.tasks set title='Saved revision',revision=2 where id='cc000000-0000-0000-0000-000000000001';
select pg_temp.expect_error(format('insert into public.comments(tenant_id,author_party_id,body) select %L,id,''Missing typed target'' from public.parties where tenant_id=%L limit 1',current_setting('test.tenant'),current_setting('test.tenant')),'23514');

-- Evidence storage access comes from tenant membership and a reserved draft path.
insert into public.evidence_artifacts(id,tenant_id,title,artifact_kind) values
 ('dd000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'Rollback evidence','document');
select set_config('test.object_name',current_setting('test.tenant')||'/dd000000-0000-0000-0000-000000000001/ee000000-0000-0000-0000-000000000001/test.txt',true);
insert into public.evidence_versions(id,tenant_id,artifact_id,version_number,storage_object_name) values
 ('ee000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'dd000000-0000-0000-0000-000000000001',1,current_setting('test.object_name'));
do $$ begin
 if not public.can_access_evidence_object(current_setting('test.object_name'),true) then raise exception 'Owner cannot upload to draft evidence'; end if;
 if public.can_access_evidence_object('another-tenant/unreserved-object',true) then raise exception 'Unreserved upload was allowed'; end if;
end $$;
select pg_temp.expect_error('update public.evidence_versions set state=''published'',revision=2 where id=''ee000000-0000-0000-0000-000000000001''','23514');
select pg_temp.expect_error('update public.evidence_versions set state=''published'',external_uri=''https://example.test/reference'',revision=2 where id=''ee000000-0000-0000-0000-000000000001''','23514');
-- Metadata rows below are temporary SQL fixtures, not fabricated file contents.
insert into storage.objects(id,bucket_id,name) values ('ef000000-0000-0000-0000-000000000001','evidence',current_setting('test.object_name'));
update public.evidence_versions set storage_object_id='ef000000-0000-0000-0000-000000000001',revision=2 where id='ee000000-0000-0000-0000-000000000001';
update public.evidence_versions set state='published',revision=3 where id='ee000000-0000-0000-0000-000000000001';
do $$ begin
 if public.can_access_evidence_object(current_setting('test.object_name'),true) then raise exception 'Published evidence permits object writes'; end if;
 if not public.can_access_evidence_object(current_setting('test.object_name'),false) then raise exception 'Owner cannot read published evidence'; end if;
end $$;
select pg_temp.expect_error('update public.evidence_versions set external_uri=''https://example.test/changed'',revision=4 where id=''ee000000-0000-0000-0000-000000000001''','23514');
insert into public.task_evidence(tenant_id,task_id,evidence_version_id) values
 (current_setting('test.tenant')::uuid,'cc000000-0000-0000-0000-000000000001','ee000000-0000-0000-0000-000000000001');

-- Published risk interpretations freeze observations and their evidence links.
insert into public.observations(id,tenant_id,title,method) values
 ('fa000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'Rollback observation','test');
insert into public.risks(id,tenant_id,program_id,title) values
 ('fb000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'bb000000-0000-0000-0000-000000000001','Rollback risk');
insert into public.risk_revisions(id,tenant_id,risk_id,version_number) values
 ('fc000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'fb000000-0000-0000-0000-000000000001',1);
insert into public.risk_observations(tenant_id,risk_revision_id,observation_id) values
 (current_setting('test.tenant')::uuid,'fc000000-0000-0000-0000-000000000001','fa000000-0000-0000-0000-000000000001');
update public.risk_revisions set state='published',revision=2 where id='fc000000-0000-0000-0000-000000000001';
select pg_temp.expect_error('update public.observations set description=''Changed after publication'',revision=2 where id=''fa000000-0000-0000-0000-000000000001''','23514');
select pg_temp.expect_error(format('insert into public.observation_evidence(tenant_id,observation_id,evidence_version_id) values (%L,''fa000000-0000-0000-0000-000000000001'',''ee000000-0000-0000-0000-000000000001'')',current_setting('test.tenant')),'23514');

-- Published procedures freeze their steps; completed execution records are immutable.
insert into public.procedures(id,tenant_id,title) values
 ('a1000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'Rollback procedure');
insert into public.procedure_revisions(id,tenant_id,procedure_id,version_number,title,method) values
 ('a2000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'a1000000-0000-0000-0000-000000000001',1,'Rollback procedure v1','test');
insert into public.procedure_steps(id,tenant_id,procedure_revision_id,sequence_number,instruction) values
 ('a3000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'a2000000-0000-0000-0000-000000000001',1,'Record observed behavior');
update public.procedure_revisions set state='published',revision=2 where id='a2000000-0000-0000-0000-000000000001';
select pg_temp.expect_error('update public.procedure_steps set instruction=''Changed'',revision=2 where id=''a3000000-0000-0000-0000-000000000001''','23514');
insert into public.systems(id,tenant_id,program_id,code,name,system_type) values
 ('a4000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'bb000000-0000-0000-0000-000000000001','WORKFLOW-SYSTEM','Rollback system','information_system');
insert into public.configuration_baselines(id,tenant_id,system_id,version_number,name,state) values
 ('a5000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'a4000000-0000-0000-0000-000000000001',1,'Rollback configuration','draft');
insert into public.system_components(id,tenant_id,system_id,code,name,component_type) values
 ('a8000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'a4000000-0000-0000-0000-000000000001','ROLLBACK-COMPONENT','Rollback test component','software');
insert into public.component_pins(tenant_id,system_id,configuration_baseline_id,system_component_id) values
 (current_setting('test.tenant')::uuid,'a4000000-0000-0000-0000-000000000001','a5000000-0000-0000-0000-000000000001','a8000000-0000-0000-0000-000000000001');
update public.configuration_baselines set state='published',revision=2 where id='a5000000-0000-0000-0000-000000000001';
insert into public.test_runs(id,tenant_id,title,procedure_revision_id,configuration_baseline_id,status,started_at) values
 ('a6000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'Rollback run','a2000000-0000-0000-0000-000000000001','a5000000-0000-0000-0000-000000000001','in_progress',now());
insert into public.step_results(id,tenant_id,test_run_id,procedure_revision_id,procedure_step_id,determination) values
 ('a7000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'a6000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000001','not_met');
update public.test_runs set status='completed',completed_at=now(),revision=2 where id='a6000000-0000-0000-0000-000000000001';
select pg_temp.expect_error('update public.step_results set determination=''met'',revision=2 where id=''a7000000-0000-0000-0000-000000000001''','23514');
select pg_temp.expect_error('update public.test_runs set status=''in_progress'',revision=3 where id=''a6000000-0000-0000-0000-000000000001''','23514');

-- A POA&M publication can reuse the same frozen item version in later documents.
insert into public.poam_documents(id,tenant_id,program_id,title) values
 ('b1000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'bb000000-0000-0000-0000-000000000001','Rollback POAM');
insert into public.poam_items(id,tenant_id,poam_document_id,title) values
 ('b2000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'b1000000-0000-0000-0000-000000000001','Rollback commitment');
insert into public.poam_item_revisions(id,tenant_id,poam_document_id,poam_item_id,version_number) values
 ('b3000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'b1000000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000001',1);
insert into public.poam_milestones(id,tenant_id,poam_item_revision_id,title) values
 ('b4000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'b3000000-0000-0000-0000-000000000001','Unscheduled milestone');
update public.poam_item_revisions set state='published',revision=2 where id='b3000000-0000-0000-0000-000000000001';
select pg_temp.expect_error('update public.poam_milestones set planned_date=current_date,revision=2 where id=''b4000000-0000-0000-0000-000000000001''','23514');
insert into public.poam_revisions(id,tenant_id,poam_document_id,version_number) values
 ('b5000000-0000-0000-0000-000000000001',current_setting('test.tenant')::uuid,'b1000000-0000-0000-0000-000000000001',1),
 ('b5000000-0000-0000-0000-000000000002',current_setting('test.tenant')::uuid,'b1000000-0000-0000-0000-000000000001',2);
insert into public.poam_revision_items(tenant_id,poam_document_id,poam_revision_id,poam_item_revision_id) values
 (current_setting('test.tenant')::uuid,'b1000000-0000-0000-0000-000000000001','b5000000-0000-0000-0000-000000000001','b3000000-0000-0000-0000-000000000001'),
 (current_setting('test.tenant')::uuid,'b1000000-0000-0000-0000-000000000001','b5000000-0000-0000-0000-000000000002','b3000000-0000-0000-0000-000000000001');
update public.poam_revisions set state='published',revision=2 where id='b5000000-0000-0000-0000-000000000001';
select pg_temp.expect_error('delete from public.poam_revision_items where poam_revision_id=''b5000000-0000-0000-0000-000000000001''','23514');

-- Other authenticated tenants see neither records nor evidence objects.
select set_config('request.jwt.claim.sub','aa000000-0000-0000-0000-000000000002',true);
do $$ begin
 if exists (select 1 from public.tasks) then raise exception 'Outsider read another tenant task'; end if;
 if public.can_access_evidence_object(current_setting('test.object_name'),false) then raise exception 'Outsider read another tenant evidence'; end if;
end $$;
select set_config('test.other_tenant',public.ensure_personal_tenant()::text,true);
select pg_temp.expect_error(format('insert into public.tasks(tenant_id,program_id,title) values (%L,''bb000000-0000-0000-0000-000000000001'',''Cross-tenant task'')',current_setting('test.other_tenant')),'23503');
reset role;
rollback;
select 'Workflow tenant isolation, CAS, evidence policies, immutable executions/publications and POAM version pins passed.' as result;
