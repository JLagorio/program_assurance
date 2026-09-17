/** Baseline inheritance and OSCAL authoring are verified in one rolled-back transaction. */
import assert from "node:assert/strict";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { quote, queryJson, sql } from "./demo/database.mjs";
const applied = queryJson(
  "select exists(select 1 from information_schema.columns where table_schema='public' and table_name='systems' and column_name='adopted_profile_resolution_id');",
);
const migration = applied
  ? ""
  : readFileSync("supabase/migrations/20260913025000_system_baselines.sql", "utf8");
const ids = Object.fromEntries(
  [
    "user",
    "viewer",
    "tenant",
    "foreign",
    "program",
    "root",
    "child",
    "grandchild",
    "nestedBoundary",
    "scope",
    "nestedScope",
    "party",
    "request",
    "tailorRequest",
    "resetRequest",
  ].map((k) => [k, randomUUID()]),
);
const q = (k) => `${quote(ids[k])}::uuid`;
const run = sql(`begin;
set local lock_timeout='5s'; set local statement_timeout='45s';
${migration}
create function pg_temp.expect(ok boolean,message text) returns void language plpgsql as $t$ begin if ok is not true then raise exception '%',message; end if; end; $t$;
create function pg_temp.reject(command text,code text) returns void language plpgsql as $t$
begin begin execute command; exception when others then if sqlstate=code then return; end if; raise exception 'Expected %, got %: %',code,sqlstate,sqlerrm; end; raise exception 'Unexpected success'; end; $t$;
insert into auth.users(id,email) values (${q("user")},'baseline-rollback-${ids.user}@example.invalid'),(${q("viewer")},'baseline-viewer-${ids.viewer}@example.invalid');
insert into public.tenants(id,name) values (${q("tenant")},'Rollback baselines'),(${q("foreign")},'Foreign rollback baseline');
insert into public.tenant_memberships(tenant_id,user_id,role) values (${q("tenant")},${q("user")},'owner'),(${q("tenant")},${q("viewer")},'viewer');
insert into public.parties(id,tenant_id,party_type,name,auth_user_id) values (${q("party")},${q("tenant")},'person','Rollback author',${q("user")});
insert into public.programs(id,tenant_id,code,name) values (${q("program")},${q("tenant")},'BASELINE','Rollback program');
insert into public.systems(id,tenant_id,program_id,code,name,system_type) values (${q("root")},${q("tenant")},${q("program")},'ROOT','Root','information_system');
insert into public.systems(id,tenant_id,program_id,parent_system_id,is_authorization_boundary,code,name,system_type) values
 (${q("child")},${q("tenant")},${q("program")},${q("root")},false,'CHILD','Child','hardware'),
 (${q("grandchild")},${q("tenant")},${q("program")},${q("child")},false,'GRANDCHILD','Grandchild','software'),
 (${q("nestedBoundary")},${q("tenant")},${q("program")},${q("root")},true,'BOUNDARY','Nested boundary','information_system');
create temporary table reference as select r.id resolution_id,i.catalog_revision_id catalog_id
 from public.profile_resolutions r join public.profile_revisions p on p.id=r.profile_revision_id join public.profile_imports i on i.profile_revision_id=p.id
 where r.state='published' and p.state='published' and p.title ilike '%Low%' and r.tenant_id is null and i.catalog_revision_id is not null limit 1;
select pg_temp.expect((select count(*)=1 from reference),'Published Low reference is required');
create temporary table selections as select jsonb_build_object('mode','adopt','catalogRevisionId',catalog_id,'profileResolutionId',resolution_id,'controlIds',(select jsonb_agg(control_id order by control_id) from public.selected_controls where profile_resolution_id=resolution_id),'rationale','Adopt the published Low baseline') payload from reference;
grant select on reference,selections to authenticated;
set local request.jwt.claim.sub=${quote(ids.user)}; set local role authenticated;
select public.adopt_system_baseline(${q("tenant")},${q("root")},1,${q("request")},(select payload from selections));
select pg_temp.expect((select e.profile_resolution_id=r.resolution_id and e.source_system_id=${q("root")} and e.inherited from public.system_effective_baselines e cross join reference r where e.system_id=${q("grandchild")}),'Descendants inherit the nearest explicit ancestor');
select pg_temp.expect((select profile_resolution_id is null from public.system_effective_baselines where system_id=${q("nestedBoundary")}),'Inheritance stops at a nested authorization boundary');
select public.adopt_system_baseline(${q("tenant")},${q("root")},1,${q("request")},(select payload from selections));
select pg_temp.expect((select revision=2 from public.systems where id=${q("root")}),'Exact retry does not increment revision');
select pg_temp.reject(${quote(`select public.adopt_system_baseline(${q("tenant")},${q("root")},1,'${randomUUID()}',(select payload from selections))`)},'PT409');
reset role;
create temporary table tailored as select payload||jsonb_build_object('controlIds',(
 select jsonb_agg(id order by id) from (
 select control_id as id from public.selected_controls where profile_resolution_id=(select resolution_id from reference) and control_id<>(select control_id from public.selected_controls where profile_resolution_id=(select resolution_id from reference) order by ordinal limit 1)
 union select id from (select c.id from public.controls c where catalog_revision_id=(select catalog_id from reference) and c.status='active' and not exists(select 1 from public.selected_controls sc where sc.profile_resolution_id=(select resolution_id from reference) and sc.control_id=c.id) order by c.ordinal limit 1) addition
 ) final),'rationale','Add one control and remove one based on the child system function') payload from selections;
grant select on reference,selections,tailored to authenticated;
set local role authenticated;
select public.adopt_system_baseline(${q("tenant")},${q("child")},1,${q("tailorRequest")},(select payload from tailored));
select pg_temp.expect((select e.source_system_id=${q("child")} and e.inherited and p.state='published' and p.resolver_name='program-assurance-layered-profile' and p.base_profile_resolution_id=(select resolution_id from reference) from public.system_effective_baselines e join public.profile_resolutions p on p.id=e.profile_resolution_id where e.system_id=${q("grandchild")}),'Tailored child baseline is explicit, published, layered on the reference and inherited by its descendants');
select pg_temp.expect((select (select jsonb_agg(sc.control_id order by sc.control_id) from public.selected_controls sc where sc.profile_resolution_id=e.profile_resolution_id)=(select payload->'controlIds' from tailored) from public.system_effective_baselines e where e.system_id=${q("child")}),'Authored resolution contains exactly the selected controls');
select pg_temp.expect((select count(*)=1 from public.profile_rules rules join public.profile_resolutions r on r.profile_revision_id=rules.profile_revision_id join public.systems s on s.adopted_profile_resolution_id=r.id where s.id=${q("child")} and rules.kind='exclude'),'Authored OSCAL records the actual exclusion');
select pg_temp.expect((select count(*)=1 from public.profile_imports i join public.profile_resolutions r on r.profile_revision_id=i.profile_revision_id join public.systems s on s.adopted_profile_resolution_id=r.id where s.id=${q("child")} and i.ordinal=0 and i.include_all and i.imported_profile_revision_id=(select profile_revision_id from public.profile_resolutions where id=(select resolution_id from reference))),'The tailored profile imports the reference profile with include-all');
select pg_temp.expect((select count(*)=1 from public.profile_rules rules join public.profile_resolutions r on r.profile_revision_id=rules.profile_revision_id join public.systems s on s.adopted_profile_resolution_id=r.id where s.id=${q("child")} and rules.kind='include' and rules.source_pointer='/profile/imports/1/include-controls/0'),'The addition is an explicit catalog import');
create temporary table child_layer as select adopted_profile_resolution_id as resolution_id from public.systems where id=${q("child")};
grant select on child_layer to authenticated;
select 'AUTHORED_PROFILE:'||d.original_content::text from public.systems s join public.profile_resolutions r on r.id=s.adopted_profile_resolution_id join public.profile_revisions p on p.id=r.profile_revision_id join public.oscal_document_revisions d on d.id=p.document_revision_id where s.id=${q("child")};
select pg_temp.expect((select count(*)=2 from public.system_baseline_requests where tenant_id=${q("tenant")}),'Only confirmed request receipts exist');
select public.adopt_system_baseline(${q("tenant")},${q("child")},2,${q("resetRequest")},'{"mode":"inherit"}');
select pg_temp.expect((select e.source_system_id=${q("root")} and e.inherited from public.system_effective_baselines e where e.system_id=${q("grandchild")}),'Clearing explicit adoption restores inheritance');
-- A second layer on the child's tailored profile: depth 2, still resolving to the reference catalog.
create temporary table layered as select jsonb_build_object('mode','adopt','catalogRevisionId',(select catalog_id from reference),'profileResolutionId',(select resolution_id from child_layer),'controlIds',(select jsonb_agg(sc.control_id order by sc.control_id) from public.selected_controls sc where sc.profile_resolution_id=(select resolution_id from child_layer) and sc.ordinal>0),'rationale','Drop the first control at the grandchild') payload;
grant select on layered to authenticated;
select public.adopt_system_baseline(${q("tenant")},${q("grandchild")},1,'${randomUUID()}',(select payload from layered));
select pg_temp.expect((select p.base_profile_resolution_id=(select resolution_id from child_layer) and v.depth=2 and v.layered and v.root_profile_resolution_id=(select resolution_id from reference) and v.catalog_revision_id=(select catalog_id from reference) and (select count(*) from public.profile_imports i where i.profile_revision_id=p.profile_revision_id)=1 from public.systems g join public.profile_resolutions p on p.id=g.adopted_profile_resolution_id join public.profile_resolution_catalogs v on v.profile_resolution_id=p.id where g.id=${q("grandchild")}),'A second layer records its base, imports only the layer below, and resolves to the reference catalog at depth 2');
set local request.jwt.claim.sub=${quote(ids.viewer)};
select pg_temp.reject(${quote(`select public.adopt_system_baseline(${q("tenant")},${q("root")},2,'${randomUUID()}','{"mode":"inherit"}')`)},'42501');
select pg_temp.expect((select count(*)=0 from public.system_effective_baselines where tenant_id=${q("foreign")}),'View respects tenant access');
reset role;
-- Existing scope and SSP pins are fallback only, never rewritten by adoption.
update public.systems set adopted_profile_resolution_id=null,baseline_rationale=null,revision=3 where id=${q("root")};
insert into public.scopes(id,tenant_id,system_id,composition_node_id,code,name) values
 (${q("scope")},${q("tenant")},${q("root")},null,'ROOT','Root scope'),(${q("nestedScope")},${q("tenant")},${q("root")},${q("child")},'NESTED','Nested scope');
insert into public.scope_baselines(tenant_id,scope_id,profile_resolution_id,adopted_at,adopted_by_party_id)
 select ${q("tenant")},${q("nestedScope")},resolution_id,now(),${q("party")} from reference;
select pg_temp.expect((select profile_resolution_id is null from public.system_effective_baselines where system_id=${q("child")}),'Nested scopes are not guessed as system baselines');
insert into public.scope_baselines(tenant_id,scope_id,profile_resolution_id,adopted_at,adopted_by_party_id)
 select ${q("tenant")},${q("scope")},resolution_id,now(),${q("party")} from reference;
select pg_temp.expect((select source_label='Authorization boundary scope adoption' from public.system_effective_baselines where system_id=${q("child")}),'Root scope supplies fallback');
insert into public.ssp_revisions(tenant_id,system_id,profile_resolution_id,version_number) select ${q("tenant")},${q("root")},resolution_id,1 from reference;
select pg_temp.expect((select source_label='Authorization boundary SSP' from public.system_effective_baselines where system_id=${q("child")}),'Latest boundary SSP takes precedence over root scope');
reset role;
-- Three layers on the reference resolve; a fourth is refused.
do $layers$ declare l3 uuid; base uuid; drop_one jsonb; begin
  select adopted_profile_resolution_id into base from public.systems where id=${q("grandchild")};
  select jsonb_build_array(jsonb_build_object('controlId',control_id,'action','exclude','rationale','Depth check')) into drop_one from public.selected_controls where profile_resolution_id=base order by ordinal limit 1;
  l3:=public.author_tailored_profile(${q("tenant")},(select catalog_id from reference),base,drop_one,'[]'::jsonb,'depth/3','Depth three','Third layer');
  if (select depth from public.profile_resolution_catalogs where profile_resolution_id=l3)<>3 then raise exception 'Third layer did not resolve at depth 3'; end if;
  select jsonb_build_array(jsonb_build_object('controlId',control_id,'action','exclude','rationale','Depth check')) into drop_one from public.selected_controls where profile_resolution_id=l3 order by ordinal limit 1;
  begin
    perform public.author_tailored_profile(${q("tenant")},(select catalog_id from reference),l3,drop_one,'[]'::jsonb,'depth/4','Depth four','Fourth layer');
    raise exception 'Unexpected success';
  exception when others then if sqlstate<>'23514' then raise; end if; end;
end $layers$;
rollback;`);
const document = JSON.parse(
  run
    .split("\n")
    .find((line) => line.startsWith("AUTHORED_PROFILE:"))
    .slice("AUTHORED_PROFILE:".length),
);
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
const validate = ajv.compile(
  JSON.parse(readFileSync("scripts/tests/fixtures/oscal-profile-1.2.2.schema.json", "utf8")),
);
assert.ok(validate(document), JSON.stringify(validate.errors));
assert.equal(
  document.profile.imports.length,
  2,
  "Base profile import plus the catalog import for the addition",
);
assert.deepEqual(document.profile.imports[0]["include-all"], {});
assert.equal(document.profile.imports[0]["exclude-controls"].length, 1);
assert.equal(document.profile.imports[1]["include-controls"][0]["with-ids"].length, 1);
console.log(
  "Baseline rollback passed: layered OSCAL authoring, inheritance/boundaries, CAS/retries, access, scope/SSP fallback and the layering depth limit.",
);
