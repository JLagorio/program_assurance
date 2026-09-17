/** Canonical system migration and compatibility writes; all records and DDL roll back. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { quote, queryJson, sql } from "./demo/database.mjs";

const migrationPath = "supabase/migrations/20260913020000_canonical_systems.sql";
const applied = queryJson(`select exists (select 1 from information_schema.columns
  where table_schema='public' and table_name='systems' and column_name='boundary_system_id');`);
const migration = applied ? "" : readFileSync(migrationPath, "utf8");
const ids = Object.fromEntries(
  [
    "user",
    "tenant",
    "foreignTenant",
    "program",
    "otherProgram",
    "foreignProgram",
    "root",
    "secondRoot",
    "otherRoot",
    "foreignRoot",
    "node",
    "child",
    "sibling",
    "component",
    "ambiguousComponent",
    "inventory",
    "childInventory",
    "scope",
    "requirement",
    "content",
    "allocation",
    "newChild",
    "compatChild",
    "seedChild",
    "process",
  ].map((name) => [name, randomUUID()]),
);
const q = (name) => `${quote(ids[name])}::uuid`;
const check = (condition, message) => `select pg_temp.expect(${condition}, ${quote(message)});`;
const reject = (statement, codes = ["23514"]) =>
  `select pg_temp.expect_error(${quote(statement)}, array[${codes.map(quote).join(",")}]);`;
const root = (name, program = "program", tenant = "tenant") => `
  insert into public.systems (id,tenant_id,program_id,code,name,system_type)
  values (${q(name)},${q(tenant)},${q(program)},${quote(name)},'Rollback boundary','information_system');`;
const node = (name, parent = null) => `
  insert into public.composition_nodes (id,tenant_id,system_id,parent_id,code,name,node_type,description)
  values (${q(name)},${q("tenant")},${q("root")},${parent ? q(parent) : "null"},${quote(name)},'Rollback element','hardware','Preserve the original node description');`;
const canonicalChild = (id, values = {}) => `
  insert into public.systems (id,tenant_id,program_id,parent_system_id,is_authorization_boundary,code,name,system_type)
  values (${quote(id)}::uuid,${q("tenant")},${q(values.program ?? "program")},${q(values.parent ?? "root")},false,
    ${quote(id)},'New canonical child','hardware')`;
const allocate = (target, values = {}) => `
  insert into public.requirement_allocations (tenant_id,requirement_revision_id,system_id,composition_node_id,security_process_id)
  values (${q("tenant")},${q("content")},${target ? q(target) : "null"},${values.alias ? q(values.alias) : "null"},${values.process ? q("process") : "null"})`;

const output = sql(`
begin;
set local lock_timeout='5s';
set local statement_timeout='45s';
set local request.jwt.claim.sub='';
set local request.jwt.claims='{}';
create function pg_temp.expect(ok boolean, message text) returns void language plpgsql as $test$
begin if ok is not true then raise exception '%',message; end if; end; $test$;
create function pg_temp.expect_error(command text, codes text[]) returns void language plpgsql as $test$
begin
  begin execute command;
  exception when others then
    if sqlstate=any(codes) then return; end if;
    raise exception 'Expected SQLSTATE %, got %: %',codes,sqlstate,sqlerrm;
  end;
  raise exception 'Operation unexpectedly succeeded: %',command;
end; $test$;

insert into auth.users (id,email) values (${q("user")},${quote(`canonical-systems-${ids.user}@example.invalid`)});
insert into public.tenants (id,name) values (${q("tenant")},'Rollback systems'),(${q("foreignTenant")},'Rollback foreign systems');
insert into public.tenant_memberships (tenant_id,user_id,role) values (${q("tenant")},${q("user")},'owner');
insert into public.parties (tenant_id,party_type,name,auth_user_id)
  values (${q("tenant")},'person','Rollback system author',${q("user")});
insert into public.programs (id,tenant_id,code,name) values
  (${q("program")},${q("tenant")},'SYSTEM-TEST','Rollback systems'),
  (${q("otherProgram")},${q("tenant")},'OTHER-SYSTEM-TEST','Rollback other program'),
  (${q("foreignProgram")},${q("foreignTenant")},'FOREIGN-SYSTEM-TEST','Rollback foreign program');
${root("root")}
${root("secondRoot")}
${root("otherRoot", "otherProgram")}
${root("foreignRoot", "foreignProgram", "foreignTenant")}
${node("node")}
${node("child", "node")}
${node("sibling")}
insert into public.composition_nodes (tenant_id,system_id,code,name,node_type) values
  (${q("tenant")},${q("secondRoot")},'node','Repeated code in another boundary','hardware'),
  (${q("tenant")},${q("root")},'root','Node sharing the boundary code','subsystem');
insert into public.scopes (id,tenant_id,system_id,composition_node_id,code,name)
  values (${q("scope")},${q("tenant")},${q("root")},${q("node")},'SCOPE-TEST','Rollback scope');
insert into public.component_relationships (tenant_id,system_id,source_node_id,target_node_id,relationship_type)
  values (${q("tenant")},${q("root")},${q("node")},${q("child")},'depends_on');
insert into public.system_components (id,tenant_id,system_id,code,name,component_type) values
  (${q("component")},${q("tenant")},${q("root")},'COMPONENT','Rollback component','hardware'),
  (${q("ambiguousComponent")},${q("tenant")},${q("root")},'AMBIGUOUS','Rollback ambiguous component','hardware');
insert into public.inventory_items (id,tenant_id,system_id,composition_node_id,asset_id,name) values
  (${q("inventory")},${q("tenant")},${q("root")},${q("node")},'ASSET-1','Rollback inventory'),
  (${q("childInventory")},${q("tenant")},${q("root")},${q("child")},'ASSET-2','Rollback child inventory');
insert into public.inventory_components (tenant_id,system_id,inventory_item_id,system_component_id) values
  (${q("tenant")},${q("root")},${q("inventory")},${q("component")}),
  (${q("tenant")},${q("root")},${q("inventory")},${q("ambiguousComponent")}),
  (${q("tenant")},${q("root")},${q("childInventory")},${q("ambiguousComponent")});
insert into public.engineering_requirements (id,tenant_id,program_id,code)
  values (${q("requirement")},${q("tenant")},${q("program")},'REQ-SYSTEM-TEST');
insert into public.requirement_revisions
  (id,tenant_id,engineering_requirement_id,version_number,title,statement,acceptance_criteria,requirement_type)
  values (${q("content")},${q("tenant")},${q("requirement")},2,'Rollback requirement','Verify canonical allocation.','The exact target is retained.','security');
insert into public.requirement_allocations (id,tenant_id,requirement_revision_id,composition_node_id,rationale)
  values (${q("allocation")},${q("tenant")},${q("content")},${q("node")},'Preserve authored allocation');
insert into public.security_processes (id,tenant_id,program_id,code,name)
  values (${q("process")},${q("tenant")},${q("program")},'PROCESS','Rollback process');

-- Capture actual records, including this isolated legacy fixture, before DDL.
-- Compare every original field; new canonical columns may be added intentionally.
create temporary table canonical_before (table_name text,id uuid,data jsonb) on commit drop;
do $test$ declare table_name text; begin
  foreach table_name in array array['systems','composition_nodes','system_components','inventory_items','inventory_components',
    'component_relationships','scopes','requirement_allocations','requirement_revisions','requirement_implementations',
    'requirement_evidence','ssp_revisions','implemented_requirements','component_contributions','evidence_versions','activity_events','demo_import_records']
  loop
    execute format('insert into canonical_before select %L,id,to_jsonb(r) from public.%I r',table_name,table_name);
  end loop;
end; $test$;

${migration}

do $test$ declare table_name text; lost integer; begin
  for table_name in select distinct b.table_name from canonical_before b loop
    execute format('select count(*) from canonical_before b left join public.%I r on r.id=b.id where b.table_name=%L and (r.id is null or not to_jsonb(r) @> b.data)',table_name,table_name) into lost;
    if lost<>0 then raise exception 'Migration changed % existing records in %',lost,table_name; end if;
  end loop;
end; $test$;
${check("(select relkind='v' from pg_class where oid='public.composition_nodes'::regclass)", "Composition must be a compatibility view")}
${check(`(select boundary_system_id=id and is_authorization_boundary and parent_system_id is null from public.systems where id=${q("root")})`, "Legacy root must retain its boundary identity")}
${check(`(select parent_system_id=${q("root")} and boundary_system_id=${q("root")} and not is_authorization_boundary and lifecycle_status is null and authorization_status is null from public.systems where id=${q("node")})`, "Promoted node must retain its ID and not gain invented lifecycle values")}
${check(`(select parent_system_id=${q("node")} and boundary_system_id=${q("root")} from public.systems where id=${q("child")})`, "Nested parent and boundary were not preserved")}
${check(`(select system_id=${q("node")} and composition_node_id=${q("node")} from public.requirement_allocations where id=${q("allocation")})`, "Existing allocation did not gain its exact canonical target")}
${!applied ? check(`(select system_element_id=${q("node")} from public.system_components where id=${q("component")})`, "Unambiguous inventory bridge was not preserved") : ""}
${check(`(select system_element_id is null from public.system_components where id=${q("ambiguousComponent")})`, "Ambiguous inventory must not invent a component identity")}

-- Normal authenticated authoring uses the same canonical record and CAS stamps.
set local role authenticated;
set local request.jwt.claim.sub=${quote(ids.user)};
${check(`exists(select 1 from jsonb_array_elements(public.app_schema()) model where model->>'name'='composition_nodes' and (model->>'can_insert')::boolean and (model->>'can_update')::boolean)`, "Schema inspector must recognize the writable compatibility view")}
${check(`not exists(select 1 from jsonb_array_elements(public.app_schema()) model where model->>'name'='composition_nodes_archive_20260913')`, "Recovery archive must not become an application model")}
${check(`(select system_element_id=${q("node")} and inventory_element_count=1 and link_source in ('explicit','inventory') from public.system_component_element_links where id=${q("component")})`, "Component resolver must preserve a unique inventory target after migration or fresh legacy import")}
${check(`(select system_element_id is null and inventory_element_count=2 and link_source='ambiguous' from public.system_component_element_links where id=${q("ambiguousComponent")})`, "Component resolver must expose ambiguity without choosing a target")}
${reject(`select * from public.composition_nodes_archive_20260913`, ["42501"])}
${canonicalChild(ids.newChild)};
${check(`(select parent_system_id=${q("root")} and boundary_system_id=${q("root")} and revision=1 and created_by=${q("user")} from public.systems where id=${q("newChild")})`, "Canonical child create did not derive boundary and actor")}
update public.systems set name='Edited canonical child',revision=2 where id=${q("newChild")};
${check(`(select name='Edited canonical child' and revision=2 and updated_by=${q("user")} from public.systems where id=${q("newChild")})`, "Canonical child edit did not preserve CAS and actor")}
${reject(`update public.systems set name='Stale edit',revision=2 where id=${q("newChild")}`, ["PT409"])}
${reject(canonicalChild(randomUUID(), { parent: "otherRoot" }), ["23514", "23503"])}
${reject(canonicalChild(randomUUID(), { parent: "foreignRoot" }), ["23514", "23503"])}
${reject(`update public.systems set parent_system_id=id,revision=3 where id=${q("newChild")}`)}
${reject(`update public.systems set parent_system_id=${q("child")},revision=2 where id=${q("node")}`)}
${reject(`update public.systems set parent_system_id=${q("secondRoot")},revision=3 where id=${q("newChild")}`)}
${reject(`update public.systems set boundary_system_id=${q("secondRoot")},revision=3 where id=${q("newChild")}`)}
${reject(`update public.systems set is_authorization_boundary=true,revision=3 where id=${q("newChild")}`)}
${reject(`update public.systems set program_id=${q("otherProgram")},revision=3 where id=${q("newChild")}`)}
update public.systems set parent_system_id=${q("sibling")},revision=3 where id=${q("newChild")};
${check(`(select parent_system_id=${q("sibling")} and boundary_system_id=${q("root")} from public.systems where id=${q("newChild")})`, "Same-boundary reparent should preserve identity")}

-- The legacy wizard surface forwards INSERT/RETURNING and CAS UPDATE.
${node("compatChild", "sibling")}
${check(`(select id=${q("compatChild")} and parent_system_id=${q("sibling")} and revision=1 from public.systems where id=${q("compatChild")})`, "Legacy INSERT did not create the same canonical ID")}
update public.composition_nodes set name='Edited through compatibility',revision=2 where id=${q("compatChild")};
${check(`(select name='Edited through compatibility' and revision=2 from public.systems where id=${q("compatChild")})`, "Legacy UPDATE must change the canonical row once")}
${reject(`update public.composition_nodes set name='Stale alias edit',revision=2 where id=${q("compatChild")}`, ["PT409"])}

${allocate("root")};
${allocate("newChild")};
${allocate("secondRoot")};
${allocate(null, { alias: "compatChild" })};
${check(`exists(select 1 from public.requirement_allocations where requirement_revision_id=${q("content")} and system_id=${q("root")} and composition_node_id is null)`, "Requirement must allocate directly to a boundary")}
${check(`exists(select 1 from public.requirement_allocations where requirement_revision_id=${q("content")} and system_id=${q("newChild")} and composition_node_id=${q("newChild")})`, "Child allocation alias must identify the same canonical target")}
${check(`exists(select 1 from public.requirement_allocations where requirement_revision_id=${q("content")} and system_id=${q("compatChild")} and composition_node_id=${q("compatChild")})`, "Legacy allocation must resolve to its exact canonical target")}
${reject(allocate("otherRoot"), ["23514", "23503"])}
${reject(allocate("foreignRoot"), ["23514", "23503"])}
${reject(allocate("newChild", { alias: "compatChild" }))}
${reject(allocate("newChild", { process: true }))}
${reject(allocate(null))}
${reject(`update public.system_components set system_element_id=${q("secondRoot")},revision=2 where id=${q("component")}`, ["23514", "23503"])}
${reject(`insert into public.scopes (tenant_id,system_id,composition_node_id,code,name) values (${q("tenant")},${q("secondRoot")},${q("node")},'BAD-BOUNDARY','Must reject')`, ["23514", "23503"])}
${check(`not exists(select 1 from public.systems where tenant_id=${q("foreignTenant")})`, "Canonical systems must retain tenant RLS")}
${check(`not exists(select 1 from public.composition_nodes where tenant_id=${q("foreignTenant")})`, "Compatibility view must retain tenant RLS")}

-- Execute the existing wizard RPC itself, including its out-of-order nested
-- legacy INSERTs, rather than only approximating its table writes.
do $test$
declare resolution_id uuid; catalog_id uuid; result jsonb; boundary_id uuid;
  parent_key uuid:=gen_random_uuid(); child_key uuid:=gen_random_uuid(); profile_key uuid:=gen_random_uuid();
begin
  select r.id,i.catalog_revision_id into resolution_id,catalog_id
    from public.profile_resolutions r join public.profile_revisions p on p.id=r.profile_revision_id
    join public.profile_imports i on i.profile_revision_id=p.id
    where r.tenant_id is null and r.state='published' and p.title ilike '%Low%'
      and i.catalog_revision_id is not null order by r.id limit 1;
  if resolution_id is null then raise exception 'Install the actual Low baseline before this integration test'; end if;
  result:=public.create_program_wizard(${q("tenant")},jsonb_build_object(
    'requestId',gen_random_uuid(),'code','CANONICAL-WIZARD','name','Rollback canonical wizard',
    'description','','roles','[]'::jsonb,'catalogRevisionId',catalog_id,
    'profiles',jsonb_build_array(jsonb_build_object('key',profile_key,'baseResolutionId',resolution_id,'tailoring','[]'::jsonb,'parameters','[]'::jsonb)),
    'systems',jsonb_build_array(jsonb_build_object(
      'key',gen_random_uuid(),'code','WIZARD-BOUNDARY','name','Rollback wizard boundary',
      'type','information_system','description','','ownerPartyId',null,
      'confidentiality','low','integrity','low','availability','low',
      'categorizationRationale','Explicit rollback test categorization.',
      'profileKey',profile_key,
      'elements',jsonb_build_array(
        jsonb_build_object('key',child_key,'parentKey',parent_key,'code','WIZARD-CHILD','name','Rollback wizard child','type','hardware','description',''),
        jsonb_build_object('key',parent_key,'parentKey',null,'code','WIZARD-PARENT','name','Rollback wizard parent','type','subsystem','description','')
      )
    ))
  ));
  boundary_id:=(result->'systemIds'->>0)::uuid;
  if (select count(*) from public.systems where program_id=(result->>'programId')::uuid)<>3
    or (select count(*) from public.composition_nodes where system_id=boundary_id)<>2
    or not exists(select 1 from public.systems child join public.systems parent on parent.id=child.parent_system_id
      where child.boundary_system_id=boundary_id and child.code='WIZARD-CHILD'
        and parent.code='WIZARD-PARENT' and parent.parent_system_id=boundary_id)
    or not exists(select 1 from public.ssp_revisions where system_id=boundary_id) then
    raise exception 'The existing wizard did not create a canonical nested tree and boundary SSP';
  end if;
end; $test$;

-- The source importer populates composite rows with explicit mapped columns.
reset role;
set local request.jwt.claim.sub='';
insert into public.composition_nodes (id,tenant_id,system_id,parent_id,code,name,node_type,description)
select id,tenant_id,system_id,parent_id,code,name,node_type,description from jsonb_populate_record(null::public.composition_nodes,
  jsonb_build_object('id',${q("seedChild")},'tenant_id',${q("tenant")},'system_id',${q("root")},
    'parent_id',${q("node")},'code','SEED-COMPAT','name','Imported compatible element','node_type','software','description','Exact source description'));
${check(`(select id=${q("seedChild")} and parent_system_id=${q("node")} and description='Exact source description' and created_by is null from public.systems where id=${q("seedChild")})`, "Fresh authless source import must retain the exact ID and source fields")}

rollback;
select jsonb_build_object('users',(select count(*) from auth.users where id=${q("user")}),
  'tenants',(select count(*) from public.tenants where id in (${q("tenant")},${q("foreignTenant")})),
  'systems',(select count(*) from public.systems where tenant_id in (${q("tenant")},${q("foreignTenant")})));
`);
assert.deepEqual(JSON.parse(output.split("\n").at(-1)), { users: 0, tenants: 0, systems: 0 });
console.log(
  `PASS canonical system ${applied ? "installed-schema" : "migration replay"} verification: IDs/content preserved; legacy writes, canonical CAS, allocations, tenant/boundary/cycle guards; every fixture and pre-apply DDL rolled back`,
);
