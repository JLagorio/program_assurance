import test from "node:test";
import assert from "node:assert/strict";
import { buildReferenceRows, referenceSql } from "../seed-reference.mjs";

const result = await buildReferenceRows();
const rows = (table) => result.tables.get(table) ?? [];

test("pinned source releases retain complete published catalog and CCI counts", () => {
  assert.equal(result.sources.length, 6);
  assert.equal(rows("controls").length, 1196);
  assert.equal(rows("control_parts").length, 12730);
  assert.equal(rows("parameters").length, 1600);
  assert.equal(rows("cci_items").length, 5100);
  assert.equal(rows("cci_references").length, 10183);
  assert.deepEqual(result.baselineCounts, { low: 149, moderate: 287, high: 370, privacy: 96 });
});

test("all OSCAL part identities, hierarchy and source prose survive normalization", () => {
  const document = rows("oscal_document_revisions").find((row) => row.original_content.catalog);
  const controls = new Map(rows("controls").map((row) => [row.id, row.source_id]));
  const parts = new Map(rows("control_parts").map((row) => [row.id, row]));
  for (const part of parts.values()) {
    const original = part.source_pointer
      .split("/")
      .slice(1)
      .reduce((value, key) => value[key], document.original_content);
    assert.equal(part.source_id, original.id ?? null);
    assert.equal(part.name, original.name);
    assert.equal(part.prose, original.prose ?? null);
    assert.deepEqual(part.props, original.props ?? []);
    if (part.control_id) assert.ok(controls.has(part.control_id));
    if (part.parent_part_id) {
      const parent = parts.get(part.parent_part_id);
      assert.equal(parent.control_id, part.control_id);
      assert.equal(parent.group_id, part.group_id);
      assert.ok(part.source_pointer.startsWith(`${parent.source_pointer}/parts/`));
    }
  }
});

test("CCI provenance, dual types, absent contributors and historical references remain explicit", () => {
  assert.equal(
    rows("ref_sources").find((row) => row.code === "disa-cci-list-2024-mirror").authoritative,
    false,
  );
  assert.ok(rows("cci_items").some((row) => row.contributor === null));
  assert.ok(rows("cci_item_types").length > rows("cci_items").length);
  assert.ok(
    rows("cci_references").some((row) => row.resolution_status === "unsupported-publication"),
  );
  assert.equal(result.unresolvedRev5References, 0);
  assert.ok(
    rows("cci_control_links").every(
      (row) => row.control_part_id === null && row.mapping_basis === "source-control-index",
    ),
  );
});

test("every baseline selection is pinned to its source document, import and original directive", () => {
  const selections = new Map(rows("selected_controls").map((row) => [row.id, row]));
  const controls = new Map(rows("controls").map((row) => [row.id, row.source_id]));
  const imports = new Map(rows("profile_imports").map((row) => [row.id, row]));
  const revisions = new Map(rows("profile_revisions").map((row) => [row.id, row]));
  const documents = new Map(
    rows("oscal_document_revisions").map((row) => [row.id, row.original_content]),
  );
  for (const provenance of rows("selection_provenance")) {
    const imported = imports.get(provenance.profile_import_id);
    const document = documents.get(
      revisions.get(imported.profile_revision_id).document_revision_id,
    );
    const originalId = provenance.source_pointer
      .split("/")
      .slice(1)
      .reduce((value, key) => value[key], document);
    assert.equal(
      controls.get(selections.get(provenance.selected_control_id).control_id),
      originalId,
    );
  }
  for (const resolution of rows("profile_resolutions")) {
    assert.equal(
      rows("profile_resolution_inputs").filter((row) => row.profile_resolution_id === resolution.id)
        .length,
      2,
    );
  }
});

test("import is deterministic, transactional and contains only reference tables", async () => {
  const repeated = await buildReferenceRows();
  assert.deepEqual([...result.tables], [...repeated.tables]);
  const sql = referenceSql(result);
  assert.ok(sql.startsWith("begin;"));
  assert.ok(sql.endsWith("commit;"));
  assert.ok(sql.includes("pg_advisory_xact_lock"));
  assert.ok(sql.includes("where not exists"));
  assert.doesNotMatch(
    sql,
    /insert into public\."(?:programs|systems|test_runs|risks|parties|workspace_snapshots)"/,
  );
});
