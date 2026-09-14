import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import test from "node:test";
import ts from "typescript";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { buildReferenceRows } from "../seed-reference.mjs";
import { createContext, mapPeople } from "../demo/context.mjs";
import { mapAssurance } from "../demo/map-assurance.mjs";
import { selectRecoveryPlan } from "../restore-requirement-control-mappings.mjs";

const bytes = await readFile("supabase/demo/original-poc.json.gz");
const unpacked = gunzipSync(bytes);
const source = JSON.parse(unpacked);
const manifest = JSON.parse(await readFile("supabase/demo/manifest.json", "utf8"));
const reference = await buildReferenceRows();
const refs = Object.fromEntries(
  [...reference.tables].map(([table, rows]) => [
    table,
    rows.map((row) => ({ ...row, state: "published" })),
  ]),
);
const build = () => {
  const ctx = createContext({
    source,
    refs,
    tenantId: "70e1f800-a900-5100-8100-000000000001",
    importedAt: "2026-09-12T20:00:00Z",
    fixtureSha256: manifest.sha256,
  });
  mapPeople(ctx);
  mapAssurance(ctx);
  return ctx;
};

test("demo fixture pins its actual archived files and has no asserted image/evidence association", async () => {
  const digest = (value) => createHash("sha256").update(value).digest("hex");
  assert.equal(digest(bytes), manifest.fixture_sha256);
  assert.equal(digest(unpacked), manifest.sha256);
  for (const file of [...manifest.sources, ...manifest.assets, manifest.extractor])
    assert.equal(digest(await readFile(file.path)), file.sha256, file.path);
  assert.equal(source.platform.requirements.length, 640);
  assert.equal(source.platform.control_implementations.length, 546);
  assert.equal(source.controlWork.length, 1863);
  assert.equal(source.vendors.length, 6);
  assert.ok(manifest.assets.every((asset) => asset.evidence_ids.length === 0));
});

test("assurance projection uses actual table columns and resolves every own hierarchy edge", async () => {
  const ctx = build();
  const body = await readFile("src/lib/database.types.ts", "utf8");
  const syntax = ts.createSourceFile("database.types.ts", body, ts.ScriptTarget.Latest, true);
  const database = syntax.statements.find(
    (item) => ts.isTypeAliasDeclaration(item) && item.name.text === "Database",
  ).type;
  const field = (type, name) =>
    type.members.find((item) => item.name?.getText(syntax).replaceAll('"', "") === name).type;
  const schema = field(database, "public");
  const tables = {
    members: [...field(schema, "Tables").members, ...field(schema, "Views").members],
  };
  const byId = new Map(ctx.entries.map((entry) => [entry.values.id, entry]));
  for (const entry of ctx.entries) {
    const row = field(field(tables, entry.table), "Row");
    const allowed = new Set(
      row.members.map((item) => item.name.getText(syntax).replaceAll('"', "")),
    );
    for (const [name, value] of Object.entries(entry.values)) {
      assert.ok(allowed.has(name), `${entry.table}.${name}`);
      assert.notEqual(value, undefined, `${entry.table}.${name}`);
    }
    assert.notEqual(ctx.sourceAt(entry.pointer), null, entry.pointer);
    if (entry.table === "composition_nodes" && entry.values.parent_id)
      assert.equal(byId.get(entry.values.parent_id).values.system_id, entry.values.system_id);
  }
  assert.equal(
    ctx.entries.filter((entry) => entry.table === "engineering_requirements").length,
    source.requirements.length,
  );
  assert.equal(
    ctx.entries.filter((entry) => entry.table === "component_contributions").length,
    source.platform.control_implementations.reduce((sum, row) => sum + row.by_component.length, 0),
  );
  assert.equal(ctx.issues.filter((issue) => issue.code === "unresolved_control").length, 0);
  assert.equal(
    ctx.entries.filter(
      (entry) => entry.table === "parties" && entry.values.party_type === "organization",
    ).length,
    6,
  );
  assert.equal(
    ctx.entries.filter(
      (entry) =>
        entry.table === "implemented_requirements" &&
        entry.values.implementation_status === "not_implemented",
    ).length,
    38,
  );
  assert.equal(
    ctx.issues.filter((issue) => issue.code === "unresolved_allocation_target").length,
    2,
  );
});

test("demo profiles reproduce exact source selections and validate as actual OSCAL profiles", async () => {
  const ctx = build();
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(
    JSON.parse(await readFile("scripts/tests/fixtures/oscal-profile-1.2.2.schema.json", "utf8")),
  );
  for (const entry of ctx.entries.filter((row) => row.table === "oscal_document_revisions"))
    assert.ok(validate(entry.values.original_content), JSON.stringify(validate.errors));
  for (const selection of source.scopeSelections)
    assert.equal(ctx.maps.scopeSelected.get(selection.scopeId).size, selection.controls.length);
  assert.equal(ctx.maps.scopeSelected.get("SYS-1090").size, 546);
  assert.equal(
    ctx.entries.filter((row) => row.table === "scope_baselines").length,
    0,
    "no adoption actor/time exists in the source",
  );
  assert.equal(
    ctx.entries.filter((row) => row.table === "implementation_statements").length,
    0,
    "whole-control source narrative cannot invent a particular statement link",
  );
  assert.ok(
    ctx.entries
      .filter((row) => row.table === "component_contributions")
      .every((row) => row.values.implementation_status === "planned"),
    "component implementation was unrecorded in the source",
  );
  assert.equal(ctx.issues.filter((row) => row.code === "parameter_id_not_identified").length, 147);
});

test("repeated projection has stable identities and never mutates the extracted source", () => {
  const before = JSON.stringify(source);
  const first = build();
  const second = build();
  assert.equal(JSON.stringify(first.entries), JSON.stringify(second.entries));
  assert.equal(JSON.stringify(source), before);
  assert.equal(new Set(first.entries.map((row) => row.values.id)).size, first.entries.length);
});

test("archived control derivations use exact whole controls without inventing statement or system context", () => {
  const ctx = build();
  const links = ctx.entries.filter((entry) => entry.table === "requirement_control_links");
  assert.equal(links.length, 665);
  for (const link of links) {
    const derivation = ctx.sourceAt(link.pointer);
    const control = refs.controls.find((row) => row.id === link.values.control_id);
    assert.equal(derivation.sourceType, "Control statement");
    assert.ok(
      [control.code.toUpperCase(), control.source_id.toUpperCase()].includes(
        derivation.sourceId.toUpperCase(),
      ),
    );
    assert.equal(link.values.rationale, derivation.rationale);
    assert.equal(link.values.relationship_type, "derived_from");
    for (const key of ["control_part_id", "system_id", "selected_control_id"])
      assert.equal(link.values[key], null);
  }
  assert.equal(
    ctx.issues.filter((issue) => issue.code === "requirement_derivation_scope").length,
    8,
  );
});

test("targeted recovery resolves import identities to current content and preserves authored conflicts", () => {
  const ctx = build();
  const identity = ctx.entries.find(
    (entry) => entry.table === "engineering_requirements" && entry.key === "REQ-0042",
  );
  const link = ctx.entries.find(
    (entry) =>
      entry.table === "requirement_control_links" && entry.key === "REQ-0042:SI-7:derived_from",
  );
  const current = {
    id: "current-content",
    engineering_requirement_id: identity.values.id,
    version_number: 9,
  };
  const snapshot = {
    imports: [
      {
        destination_table: "engineering_requirements",
        source_key: identity.key,
        destination_id: identity.values.id,
      },
    ],
    requirements: [identity.values],
    contents: [
      ctx.entries.find(
        (entry) =>
          entry.table === "requirement_revisions" &&
          entry.values.engineering_requirement_id === identity.values.id,
      ).values,
      current,
    ],
    links: [],
  };
  const recovered = selectRecoveryPlan(ctx, snapshot);
  assert.equal(recovered.ctx.entries.length, 1);
  assert.equal(recovered.ctx.entries[0].values.requirement_revision_id, current.id);
  assert.deepEqual(recovered.ctx.issues, []);
  assert.deepEqual(recovered.ctx.source, {});
  assert.ok(
    recovered.ctx.operations.every(
      (operation) =>
        operation.kind === "insert" && operation.entry.table === "requirement_control_links",
    ),
  );
  assert.notEqual(
    link.values.requirement_revision_id,
    current.id,
    "The full source plan remains intact",
  );
  snapshot.links.push({
    ...link.values,
    id: "user-authored",
    requirement_revision_id: current.id,
    rationale: "My deliberate rationale",
  });
  const conflicted = selectRecoveryPlan(ctx, snapshot);
  assert.equal(conflicted.ctx.entries.length, 0);
  assert.equal(
    conflicted.report.skipped.find((skip) => skip.existingId === "user-authored").sourceKey,
    link.key,
  );
  snapshot.imports.push({
    destination_table: "requirement_control_links",
    source_key: link.key,
    destination_id: link.values.id,
  });
  assert.equal(
    selectRecoveryPlan(ctx, snapshot).report.preservedImports,
    1,
    "An existing source receipt remains authoritative after user edits",
  );
});
