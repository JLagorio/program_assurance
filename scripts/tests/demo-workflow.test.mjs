import assert from "node:assert/strict";
import test from "node:test";
import { buildReferenceRows } from "../seed-reference.mjs";
import { buildDemoPlan } from "../seed-demo.mjs";
const reference = await buildReferenceRows();
const refs = Object.fromEntries(
  [...reference.tables].map(([table, rows]) => [
    table,
    rows.map((row) => ({ ...row, state: "published" })),
  ]),
);
const { ctx } = await buildDemoPlan({
  tenantId: "71e1f800-a900-5100-8100-000000000001",
  refs,
  importedAt: "2026-09-12T20:00:00Z",
});
const byId = new Map(ctx.entries.map((entry) => [entry.values.id, entry]));

test("POA&M links require an explicit same-program source relationship", () => {
  const links = ctx.entries.filter((entry) => entry.table === "issue_poams");
  assert.equal(links.length, 57);
  for (const link of links) {
    const issue = byId.get(link.values.issue_id),
      item = byId.get(link.values.poam_item_id),
      document = byId.get(item.values.poam_document_id);
    assert.equal(issue.values.program_id, document.values.program_id);
    const finding = issue.source,
      sourceItem = item.source;
    assert.ok(
      (finding.poam && finding.poam === (sourceItem.id ?? sourceItem.poamId)) ||
        sourceItem.findingIds?.includes(finding.id),
    );
  }
  for (const entry of ctx.entries.filter((entry) => entry.table === "poam_item_observations")) {
    const item = byId.get(byId.get(entry.values.poam_item_revision_id).values.poam_item_id),
      document = byId.get(item.values.poam_document_id),
      observation = byId.get(entry.values.observation_id);
    assert.equal(observation.values.program_id, document.values.program_id);
  }
});
test("source state labels and missing execution/file facts stay truthful", () => {
  const rows = (table) =>
    ctx.entries.filter((entry) => entry.table === table).map((entry) => entry.values);
  assert.equal(rows("workstreams").filter((row) => row.status === "blocked").length, 2);
  assert.equal(rows("lifecycle_gates").filter((row) => row.status === "completed").length, 52);
  assert.equal(rows("lifecycle_gates").filter((row) => row.status === "passed").length, 0);
  assert.equal(rows("poam_items").filter((row) => row.status === "deferred").length, 1);
  assert.equal(rows("test_runs").length, 0);
  assert.equal(rows("authorization_decisions").length, 0);
  assert.ok(
    rows("evidence_versions")
      .filter((row) => row.state === "published")
      .every(
        (row) =>
          row.external_uri && row.published_at === ctx.importedAt && !row.storage_object_name,
      ),
  );
  assert.equal(rows("poam_items").length, 52);
});

test("adjacent risk joins do not match missing identifiers or cross programs", () => {
  for (const entry of ctx.entries.filter((entry) => entry.table === "risk_observations")) {
    const risk = byId.get(byId.get(entry.values.risk_revision_id).values.risk_id),
      observation = byId.get(entry.values.observation_id);
    assert.ok(risk.source.id);
    assert.equal(risk.values.program_id, observation.values.program_id);
  }
});
