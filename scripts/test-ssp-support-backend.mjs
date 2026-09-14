/** Expanded SSP support links, authenticated guards and rollback-only fixtures. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { quote, queryJson, sql } from "./demo/database.mjs";

const applied =
  queryJson(`select exists(select 1 from information_schema.columns where table_schema='public'
  and table_name='implementation_evidence' and column_name='implemented_requirement_id')`);
const migration = applied
  ? ""
  : readFileSync("supabase/migrations/20260913040000_ssp_support_links.sql", "utf8");
const ids = Object.fromEntries(
  [
    "user",
    "tenant",
    "program",
    "otherProgram",
    "system",
    "otherSystem",
    "requirement",
    "otherRequirement",
    "content",
    "otherContent",
    "ssp",
    "implementation",
    "statement",
    "component",
    "contribution",
    "artifact",
    "otherArtifact",
    "workspaceArtifact",
    "version",
    "otherVersion",
    "workspaceVersion",
    "draftVersion",
  ].map((key) => [key, randomUUID()]),
);
const q = (key) => `${quote(ids[key])}::uuid`;
const reject = (command, code = "23514") =>
  `select pg_temp.reject(${quote(command)},${quote(code)});`;
const evidence = (
  target,
  version = "version",
  extra = "",
) => `insert into public.implementation_evidence
  (tenant_id,${target},evidence_version_id${extra ? ",component_contribution_id" : ""})
  values (${q("tenant")},${q(target === "implemented_requirement_id" ? "implementation" : target === "implementation_statement_id" ? "statement" : "contribution")},${q(version)}${extra ? `,${q(extra)}` : ""})`;

const output = sql(`begin;
set local lock_timeout='5s'; set local statement_timeout='20s';
create function pg_temp.reject(command text,code text) returns void language plpgsql as $test$
begin
  begin execute command;
  exception when others then if sqlstate=code then return; end if; raise; end;
  raise exception 'Expected % but operation succeeded: %',code,command;
end; $test$;
create temp table before_ssp_links as select 'requirements' as kind,id,to_jsonb(r) as record from public.requirement_implementations r
  union all select 'evidence',id,to_jsonb(r) from public.implementation_evidence r;
${migration}
do $test$ begin
  if exists(select 1 from before_ssp_links b left join public.requirement_implementations r on r.id=b.id
    where b.kind='requirements' and (r.id is null or not to_jsonb(r) @> b.record))
    or exists(select 1 from before_ssp_links b left join public.implementation_evidence e on e.id=b.id
    where b.kind='evidence' and (e.id is null or not to_jsonb(e) @> b.record)) then
    raise exception 'Migration changed an existing SSP support link';
  end if;
end; $test$;
insert into auth.users(id,email) values(${q("user")},${quote(`ssp-support-${ids.user}@example.invalid`)});
insert into public.tenants(id,name) values(${q("tenant")},'Rollback SSP support');
insert into public.tenant_memberships(tenant_id,user_id,role) values(${q("tenant")},${q("user")},'owner');
insert into public.programs(id,tenant_id,code,name) values
  (${q("program")},${q("tenant")},'SSP-SUPPORT','Rollback SSP'),(${q("otherProgram")},${q("tenant")},'OTHER-SSP','Other rollback SSP');
insert into public.systems(id,tenant_id,program_id,code,name,system_type) values
  (${q("system")},${q("tenant")},${q("program")},'SSP-BOUNDARY','Rollback boundary','information_system'),
  (${q("otherSystem")},${q("tenant")},${q("otherProgram")},'OTHER-BOUNDARY','Other boundary','information_system');
insert into public.engineering_requirements(id,tenant_id,program_id,code) values
  (${q("requirement")},${q("tenant")},${q("program")},'REQ-SSP'),(${q("otherRequirement")},${q("tenant")},${q("otherProgram")},'REQ-OTHER');
insert into public.requirement_revisions(id,tenant_id,engineering_requirement_id,version_number,title,statement,acceptance_criteria,requirement_type) values
  (${q("content")},${q("tenant")},${q("requirement")},1,'Rollback requirement','Real test statement','Recorded criteria','security'),
  (${q("otherContent")},${q("tenant")},${q("otherRequirement")},1,'Other requirement','Other test statement','Recorded criteria','security');
do $test$ declare selection public.selected_controls; part uuid; begin
  select sc.* into selection from public.selected_controls sc join public.profile_resolutions pr on pr.id=sc.profile_resolution_id
    where pr.tenant_id is null and pr.state='published' and exists(select 1 from public.control_parts cp where cp.control_id=sc.control_id and cp.name='statement')
    order by sc.id limit 1;
  if selection.id is null then raise exception 'Install published reference controls before this test'; end if;
  select id into part from public.control_parts where control_id=selection.control_id and name='statement' order by id limit 1;
  insert into public.ssp_revisions(id,tenant_id,system_id,profile_resolution_id,version_number)
    values(${q("ssp")},${q("tenant")},${q("system")},selection.profile_resolution_id,1);
  insert into public.implemented_requirements(id,tenant_id,ssp_revision_id,selected_control_id,description)
    values(${q("implementation")},${q("tenant")},${q("ssp")},selection.id,'Authored control narrative');
  insert into public.implementation_statements(id,tenant_id,ssp_revision_id,implemented_requirement_id,control_part_id,description)
    values(${q("statement")},${q("tenant")},${q("ssp")},${q("implementation")},part,'Authored statement narrative');
end; $test$;
insert into public.system_components(id,tenant_id,system_id,code,name,component_type)
  values(${q("component")},${q("tenant")},${q("system")},'SSP-COMPONENT','Rollback component','software');
insert into public.component_contributions(id,tenant_id,ssp_revision_id,implemented_requirement_id,system_component_id,description)
  values(${q("contribution")},${q("tenant")},${q("ssp")},${q("implementation")},${q("component")},'Authored component narrative');
insert into public.evidence_artifacts(id,tenant_id,program_id,title,artifact_kind) values
  (${q("artifact")},${q("tenant")},${q("program")},'Rollback evidence','document'),
  (${q("otherArtifact")},${q("tenant")},${q("otherProgram")},'Other program evidence','document'),
  (${q("workspaceArtifact")},${q("tenant")},null,'Workspace evidence','document');
insert into public.evidence_versions(id,tenant_id,artifact_id,version_number,state,published_at,external_uri) values
  (${q("version")},${q("tenant")},${q("artifact")},1,'published',now(),'https://example.invalid/ssp-evidence'),
  (${q("otherVersion")},${q("tenant")},${q("otherArtifact")},1,'published',now(),'https://example.invalid/other-evidence'),
  (${q("workspaceVersion")},${q("tenant")},${q("workspaceArtifact")},1,'published',now(),'https://example.invalid/workspace-evidence');
insert into public.evidence_versions(id,tenant_id,artifact_id,version_number) values(${q("draftVersion")},${q("tenant")},${q("artifact")},2);
set local role authenticated; set local request.jwt.claim.sub=${quote(ids.user)};
insert into public.requirement_implementations(tenant_id,requirement_revision_id,implemented_requirement_id,rationale)
  values(${q("tenant")},${q("content")},${q("implementation")},'Explicit control support');
insert into public.requirement_implementations(tenant_id,requirement_revision_id,component_contribution_id,rationale)
  values(${q("tenant")},${q("content")},${q("contribution")},'Explicit component support');
${reject(`insert into public.requirement_implementations(tenant_id,requirement_revision_id,implemented_requirement_id) values(${q("tenant")},${q("otherContent")},${q("implementation")})`)}
${reject(`insert into public.requirement_implementations(tenant_id,requirement_revision_id,implemented_requirement_id,component_contribution_id) values(${q("tenant")},${q("content")},${q("implementation")},${q("contribution")})`)}
${reject(`insert into public.requirement_implementations(tenant_id,requirement_revision_id) values(${q("tenant")},${q("content")})`)}
${reject(`insert into public.requirement_implementations(tenant_id,requirement_revision_id,implemented_requirement_id) values(${q("tenant")},${q("content")},${q("implementation")})`, "23505")}
${evidence("implemented_requirement_id")};
${evidence("implementation_statement_id")};
${evidence("component_contribution_id")};
${evidence("implemented_requirement_id", "workspaceVersion")};
${reject(evidence("implemented_requirement_id", "otherVersion"))}
${reject(evidence("implemented_requirement_id", "draftVersion"))}
${reject(evidence("implemented_requirement_id", "version", "contribution"))}
${reject(evidence("implemented_requirement_id"), "23505")}
update public.ssp_revisions set state='published',revision=2 where id=${q("ssp")};
${reject(`delete from public.implementation_evidence where implemented_requirement_id=${q("implementation")}`)}
${reject(`update public.implementation_evidence set claim='Rewrite',revision=2 where implementation_statement_id=${q("statement")}`)}
${reject(`delete from public.requirement_implementations where implemented_requirement_id=${q("implementation")}`)}
${reject(`update public.requirement_implementations set rationale='Rewrite',revision=2 where component_contribution_id=${q("contribution")}`)}
${reject(evidence("component_contribution_id", "workspaceVersion"))}
do $test$ begin
  if (select count(*) from public.implementation_evidence where tenant_id=${q("tenant")})<>4
    or (select count(*) from public.requirement_implementations where tenant_id=${q("tenant")})<>2 then
    raise exception 'Failed support operations left partial changes';
  end if;
end; $test$;
rollback;
select jsonb_build_object('users',(select count(*) from auth.users where id=${q("user")}),'tenants',(select count(*) from public.tenants where id=${q("tenant")}));`);
assert.deepEqual(JSON.parse(output.split("\n").at(-1)), { users: 0, tenants: 0 });
console.log(
  "PASS SSP support migration preserves existing links; control/statement/component targets, exact publication, program context, uniqueness and published-parent guards; all fixtures rolled back",
);
