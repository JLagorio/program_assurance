/** Whole-control and optional-statement targets. Every fixture and optional migration rolls back. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { quote, sql } from "./demo/database.mjs";

const id = Object.fromEntries(
  [
    "tenant",
    "program",
    "otherProgram",
    "system",
    "otherSystem",
    "requirement",
    "content",
    "legacy",
  ].map((key) => [key, randomUUID()]),
);
const q = (key) => `${quote(id[key])}::uuid`;
const migrate = process.argv.includes("--with-migration")
  ? readFileSync(
      new URL(
        "../supabase/migrations/20260913030000_requirement_control_targets.sql",
        import.meta.url,
      ),
      "utf8",
    )
  : "";
const result = sql(`
  begin;
  set local lock_timeout = '5s';
  set local statement_timeout = '30s';
  create temporary table control_targets_before as select id, to_jsonb(l) record from public.requirement_control_links l;
  ${migrate}
  do $preserve$ begin
    if exists(select 1 from control_targets_before before join public.requirement_control_links after using(id)
      where to_jsonb(after) - 'control_id' - 'system_id' - 'selected_control_id'
        is distinct from before.record - 'control_id' - 'system_id' - 'selected_control_id') then
      raise exception 'Existing control mapping fields changed during migration';
    end if;
  end $preserve$;
  insert into public.tenants(id, name) values (${q("tenant")}, 'Rollback control target check');
  insert into public.programs(id, tenant_id, code, name) values
    (${q("program")}, ${q("tenant")}, 'CONTROL-CHECK', 'Rollback target check'),
    (${q("otherProgram")}, ${q("tenant")}, 'OTHER-CONTEXT', 'Other program');
  insert into public.systems(id, tenant_id, program_id, code, name, system_type) values
    (${q("system")}, ${q("tenant")}, ${q("program")}, 'TARGET-SYSTEM', 'Target system', 'information_system'),
    (${q("otherSystem")}, ${q("tenant")}, ${q("otherProgram")}, 'OTHER-SYSTEM', 'Other system', 'information_system');
  insert into public.engineering_requirements(id, tenant_id, program_id, code)
    values (${q("requirement")}, ${q("tenant")}, ${q("program")}, 'TARGET-REQ');
  insert into public.requirement_revisions(id, tenant_id, engineering_requirement_id,
    version_number, title, statement, acceptance_criteria, requirement_type)
    values (${q("content")}, ${q("tenant")}, ${q("requirement")}, 1,
      'Recorded requirement', 'A recorded engineering statement.', 'A recorded acceptance criterion.', 'security');
  do $check$
  declare control uuid; part uuid; method uuid; other_control uuid; selected uuid; wrong_selection uuid; mapping uuid; scoped_mapping uuid;
  begin
    select c.id into strict control from public.controls c where c.tenant_id is null and c.code = 'SI-7';
    select c.id into strict other_control from public.controls c where c.tenant_id is null and c.code = 'SC-12';
    select p.id into part from public.control_parts p where p.control_id = control
      and public.is_requirement_control_statement(p.id, control) order by p.source_id limit 1;
    select p.id into method from public.control_parts p where p.control_id = control and p.name = 'assessment-method' limit 1;
    select s.id into selected from public.selected_controls s where s.control_id = control and s.tenant_id is null limit 1;
    if part is null or method is null or selected is null then raise exception 'Pinned reference fixtures unavailable'; end if;
    insert into public.ssp_revisions(tenant_id, system_id, profile_resolution_id, version_number)
      select ${q("tenant")}, ${q("system")}, sc.profile_resolution_id, 1 from public.selected_controls sc where sc.id=selected;
    begin
      insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, system_id, selected_control_id, relationship_type)
        values (${q("tenant")}, ${q("content")}, control, ${q("system")}, selected, 'maps_to');
      raise exception 'System mapping accepted without allocation';
    exception when check_violation then null; end;
    insert into public.requirement_allocations(tenant_id, requirement_revision_id, system_id)
      values (${q("tenant")}, ${q("content")}, ${q("system")});
    insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, system_id, selected_control_id, relationship_type)
      values (${q("tenant")}, ${q("content")}, control, ${q("system")}, selected, 'maps_to') returning id into scoped_mapping;
    select sc.id into wrong_selection from public.selected_controls sc where sc.control_id=control and sc.tenant_id is null
      and sc.profile_resolution_id<>(select profile_resolution_id from public.selected_controls where id=selected) limit 1;
    if wrong_selection is null then raise exception 'Alternate reference profile unavailable'; end if;
    begin
      update public.requirement_control_links set selected_control_id=wrong_selection where id=scoped_mapping;
      raise exception 'Same control from the wrong effective profile accepted';
    exception when check_violation then null; end;

    insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type)
      values (${q("tenant")}, ${q("content")}, control, 'maps_to') returning id into mapping;
    if not exists (select 1 from public.requirement_control_links where id = mapping and control_part_id is null)
      then raise exception 'Whole-control mapping was not stored'; end if;
    begin
      insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, relationship_type)
        values (${q("tenant")}, ${q("content")}, control, 'maps_to');
      raise exception 'Duplicate whole-control mapping accepted';
    exception when unique_violation then null; end;

    -- Existing part-only clients remain compatible and obtain the exact parent control.
    insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_part_id, relationship_type)
      values (${q("tenant")}, ${q("content")}, part, 'derived_from');
    if not exists (select 1 from public.requirement_control_links where requirement_revision_id=${q("content")}
      and control_part_id=part and control_id=control) then raise exception 'Part-only compatibility failed'; end if;
    begin
      insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, control_part_id, relationship_type)
        values (${q("tenant")}, ${q("content")}, other_control, part, 'maps_to');
      raise exception 'Contradictory control and statement accepted';
    exception when check_violation then null; end;
    begin
      insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, control_part_id, relationship_type)
        values (${q("tenant")}, ${q("content")}, control, method, 'maps_to');
      raise exception 'Assessment method accepted as statement';
    exception when check_violation then null; end;
    begin
      insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, system_id, selected_control_id, relationship_type)
        values (${q("tenant")}, ${q("content")}, control, ${q("otherSystem")}, selected, 'maps_to');
      raise exception 'Cross-program mapping accepted';
    exception when check_violation then null; end;
    begin
      insert into public.requirement_control_links(tenant_id, requirement_revision_id, control_id, system_id, selected_control_id, relationship_type)
        values (${q("tenant")}, ${q("content")}, other_control, ${q("system")}, selected, 'maps_to');
      raise exception 'Selected control mismatch accepted';
    exception when check_violation then null; end;
    insert into public.ssp_revisions(tenant_id, system_id, profile_resolution_id, version_number)
      select ${q("tenant")}, ${q("system")}, sc.profile_resolution_id, 2 from public.selected_controls sc where sc.id=wrong_selection;
    update public.requirement_control_links set rationale='Clarified original selection' where id=scoped_mapping;
    if not exists(select 1 from public.requirement_control_links where id=scoped_mapping and selected_control_id=selected)
      then raise exception 'Metadata edit changed historical profile context'; end if;
    update public.requirement_control_links set control_part_id = part where id = mapping;
    if not exists(select 1 from public.requirement_control_links where id = mapping and control_part_id=part)
      then raise exception 'In-place precision change failed'; end if;
  end;
  $check$;
  rollback;
  select count(*) from public.tenants where id=${q("tenant")};
`);
assert.equal(result, "0");
console.log(
  "PASS: whole controls, optional statement precision, duplicate/context guards and legacy-client compatibility; all fixtures rolled back.",
);
