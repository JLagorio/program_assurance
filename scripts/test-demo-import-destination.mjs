/** Rollback-only migration check, then exact destination/tenant guard checks. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { localWorkspace } from "./tests/local-workspace.mjs";
import { buildDemoPlan } from "./seed-demo.mjs";
import { applyPlan, loadReferences, queryJson, quote, sql } from "./demo/database.mjs";

const migration = await readFile(
  "supabase/migrations/20260913050000_demo_composition_provenance.sql",
  "utf8",
);
const workspace = await localWorkspace("demo-destination");
let foreign;
const { client, tenantId } = workspace;
const data = async (query) => {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
};
try {
  const { ctx, manifest } = await buildDemoPlan({ tenantId, refs: loadReferences() });
  const checked = applyPlan(ctx, manifest, { migration, commit: false });
  assert.equal(checked.inserted, ctx.entries.length);
  assert.equal(checked.committed, false);
  assert.equal(
    queryJson(
      `select count(*) from public.demo_import_records where tenant_id=${quote(tenantId)};`,
    ),
    0,
  );
  assert.equal(
    queryJson(`select count(*) from public.systems where tenant_id=${quote(tenantId)};`),
    0,
  );
  console.log(
    `PASS full fresh import of ${ctx.entries.length} records with migration50000, entirely rolled back`,
  );

  const entry = ctx.entries.find((row) => row.table === "programs");
  const fixture = {
    ...ctx,
    source: {},
    entries: [entry],
    operations: [{ kind: "insert", entry }],
    issues: [],
  };
  applyPlan(fixture, manifest, { commit: true });
  const createElement = (actor, tenant, programId, code, parentId = null) =>
    data(
      actor
        .from("systems")
        .insert({
          tenant_id: tenant,
          program_id: programId,
          code,
          name: code,
          system_type: "service",
          parent_system_id: parentId,
          is_authorization_boundary: !parentId,
        })
        .select()
        .single(),
    );
  const root = await createElement(client, tenantId, entry.values.id, "ROOT");
  const child = await createElement(client, tenantId, entry.values.id, "CHILD", root.id);
  foreign = await localWorkspace("demo-destination-foreign");
  const foreignProgram = await data(
    foreign.client
      .from("programs")
      .insert({ tenant_id: foreign.tenantId, code: "FOREIGN", name: "Foreign program" })
      .select()
      .single(),
  );
  const foreignRoot = await createElement(
    foreign.client,
    foreign.tenantId,
    foreignProgram.id,
    "FOREIGN-ROOT",
  );
  const foreignChild = await createElement(
    foreign.client,
    foreign.tenantId,
    foreignProgram.id,
    "FOREIGN-CHILD",
    foreignRoot.id,
  );
  const receipt = queryJson(
    `select to_jsonb(id) from public.demo_import_records where tenant_id=${quote(tenantId)} limit 1;`,
  );
  // These updates exercise the trigger inside a rollback, not source-record recovery.
  sql(`begin;
    ${migration}
    update public.demo_import_records set destination_table='composition_nodes', destination_id=${quote(child.id)} where id=${quote(receipt)};
    do $test$
    begin
      begin
        update public.demo_import_records set destination_table='system_component_element_links' where id=${quote(receipt)};
        raise exception 'An unrelated view was accepted';
      exception when check_violation then
        if sqlerrm <> 'Unknown demo destination table' then raise; end if;
      end;
      begin
        update public.demo_import_records set destination_id=${quote(root.id)} where id=${quote(receipt)};
        raise exception 'A root outside the composition projection was accepted';
      exception when foreign_key_violation then
        if sqlerrm <> 'Demo provenance must refer to an existing record in the same tenant' then raise; end if;
      end;
      begin
        update public.demo_import_records set destination_id=${quote(foreignChild.id)} where id=${quote(receipt)};
        raise exception 'A foreign-tenant composition element was accepted';
      exception when foreign_key_violation then
        if sqlerrm <> 'Demo provenance must refer to an existing record in the same tenant' then raise; end if;
      end;
      begin
        update public.demo_import_records set destination_id=gen_random_uuid() where id=${quote(receipt)};
        raise exception 'A missing destination was accepted';
      exception when foreign_key_violation then
        if sqlerrm <> 'Demo provenance must refer to an existing record in the same tenant' then raise; end if;
      end;
    end;
    $test$;
    rollback;`);
  console.log(
    "PASS exact composition view only; missing, foreign-tenant and non-composition destinations rejected; rollback preserved receipt",
  );
  assert.equal(
    queryJson(
      `select to_jsonb(destination_table) from public.demo_import_records where id=${quote(receipt)};`,
    ),
    "programs",
  );
} finally {
  await workspace.cleanup();
  await foreign?.cleanup();
}
