/** Exact source-control recovery is additive, retry-safe, and isolated from existing records. */
import assert from "node:assert/strict";
import { localWorkspace } from "./tests/local-workspace.mjs";
import { buildDemoPlan } from "./seed-demo.mjs";
import { buildRecoveryPlan } from "./restore-requirement-control-mappings.mjs";
import { applyPlan, loadReferences, queryJson, quote } from "./demo/database.mjs";

const workspace = await localWorkspace("requirement-control-recovery");
const { tenantId, client } = workspace;
const refs = loadReferences();
const data = async (query) => {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
};
const snapshot = (table) =>
  queryJson(
    `select coalesce(jsonb_agg(to_jsonb(r) order by id),'[]'::jsonb) from public.${table} r where tenant_id=${quote(tenantId)};`,
  );
try {
  const { ctx, manifest } = await buildDemoPlan({ tenantId, refs });
  const tables = new Set([
    "parties",
    "programs",
    "engineering_requirements",
    "requirement_revisions",
  ]);
  const entries = ctx.entries.filter((entry) => tables.has(entry.table));
  const fixture = {
    ...ctx,
    source: {},
    entries,
    operations: ctx.operations.filter((operation) => tables.has(operation.entry.table)),
    issues: ctx.issues.slice(0, 2),
  };
  applyPlan(fixture, manifest, { commit: true });
  const sourceLink = ctx.entries.find(
    (entry) =>
      entry.table === "requirement_control_links" && entry.key === "REQ-0042:SI-7:derived_from",
  );
  const authored = await data(
    client
      .from("requirement_control_links")
      .insert({
        ...sourceLink.values,
        id: crypto.randomUUID(),
        rationale: "My deliberate whole-control rationale.",
      })
      .select()
      .single(),
  );
  const original = await data(
    client
      .from("requirement_revisions")
      .select()
      .eq("id", sourceLink.values.requirement_revision_id)
      .single(),
  );
  await data(
    client
      .from("requirement_revisions")
      .update({ title: "My edited requirement title", revision: original.revision + 1 })
      .eq("id", original.id),
  );
  const contentsBefore = snapshot("requirement_revisions");
  const issuesBefore = snapshot("import_issues");
  const activityBefore = snapshot("activity_events");
  const importsBefore = snapshot("demo_import_records");
  const first = await buildRecoveryPlan({ tenantId, refs });
  assert.equal(first.report.exactSourceMappings, 665);
  assert.equal(first.report.plannedInserts, 664);
  assert.equal(first.report.skipped.length, 1);
  assert.equal(first.report.skipped[0].existingId, authored.id);
  const checked = applyPlan(first.ctx, first.manifest);
  assert.equal(checked.inserted, 664);
  assert.equal(checked.committed, false);
  assert.equal(snapshot("requirement_control_links").length, 1);
  assert.deepEqual(
    snapshot("demo_import_records"),
    importsBefore,
    "A check leaves no provenance receipts behind",
  );
  assert.deepEqual(snapshot("import_issues"), issuesBefore);
  const applied = applyPlan(first.ctx, first.manifest, { commit: true });
  assert.equal(applied.inserted, 664);
  assert.equal(snapshot("requirement_control_links").length, 665);
  assert.deepEqual(
    snapshot("requirement_revisions"),
    contentsBefore,
    "No requirement content is overwritten",
  );
  assert.deepEqual(
    snapshot("activity_events"),
    activityBefore,
    "No authored requirement edit is invented",
  );
  assert.deepEqual(
    snapshot("import_issues"),
    issuesBefore,
    "Old positional issue IDs and all content remain unchanged",
  );
  assert.deepEqual(
    await data(client.from("requirement_control_links").select().eq("id", authored.id).single()),
    authored,
  );
  const imported = snapshot("requirement_control_links").find((row) => row.id !== authored.id);
  await data(
    client
      .from("requirement_control_links")
      .update({ rationale: "User-corrected imported rationale", revision: imported.revision + 1 })
      .eq("id", imported.id),
  );
  const linksBeforeRetry = snapshot("requirement_control_links");
  const retry = await buildRecoveryPlan({ tenantId, refs });
  assert.equal(retry.report.plannedInserts, 0);
  assert.equal(retry.report.preservedImports, 664);
  const reapplied = applyPlan(retry.ctx, retry.manifest, { commit: true });
  assert.equal(reapplied.inserted, 0);
  assert.equal(reapplied.preserved, 664);
  assert.deepEqual(
    snapshot("requirement_control_links"),
    linksBeforeRetry,
    "Reruns preserve edited imported and authored mappings byte-for-byte",
  );
  assert.deepEqual(snapshot("import_issues"), issuesBefore);
  console.log(
    "PASS665exactsource references; dry-run rollback;664targeted inserts +1authored conflict preserved; idempotency; requirement edits/import issues/activity unchanged",
  );
} finally {
  await workspace.cleanup();
}
