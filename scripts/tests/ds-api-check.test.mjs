import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { extractApi, compareApi, readBaselineAtRef } from "../ds-api-check.mjs";

test("API baseline detects compatibility changes and ignores implementation/comments", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-api-contract-"));
  const source = path.join(root, "src/index.ts");
  fs.mkdirSync(path.dirname(source), { recursive: true });
  const dependencyRoot = path.join(root, "node_modules/adapter");
  fs.mkdirSync(dependencyRoot, { recursive: true });
  fs.writeFileSync(
    path.join(dependencyRoot, "package.json"),
    JSON.stringify({ name: "adapter", types: "index.d.ts" }),
  );
  const adapter = (optional = "?", unusedType = "string") =>
    fs.writeFileSync(
      path.join(dependencyRoot, "index.d.ts"),
      `export interface AdapterOptions { retry${optional}: number }\nexport declare function adapter(options: AdapterOptions): string;\nexport interface UnusedOptions { unrelated: ${unusedType} }`,
    );
  adapter();
  const fixture = (changes = {}) => `
    import { adapter } from "adapter";
    type InternalOptions = { nested: { enabled${changes.nestedRequired ? "" : "?"}: boolean } };
    export interface Props { label${changes.required ? "" : "?"}: ${changes.number ? "number" : "string"}; options?: InternalOptions }
    export function Widget(props: Props): string { ${changes.body ?? 'return "original";'} }
    export { Widget as ${changes.alias ?? "Alias"} };
    export function convert(value: string): string;
    ${changes.overload ? "" : "export function convert(value: number): number;"}
    export function convert(value: string | number): string | number { return value; }
    export const Compound = Object.assign(Widget, { ${changes.part ?? "Part"}: Widget });
    export const toast: typeof adapter = adapter;
    ${changes.removed ? "" : "export type Status = 'open' | 'closed';"}
    ${changes.comment ? "/** A documentation comment. */" : ""}
    ${changes.added ? "export type Added = boolean;" : ""}
  `;
  const extract = (text) => {
    fs.writeFileSync(source, text);
    return extractApi({
      packageRoot: root,
      entries: { ".": "src/index.ts", "./cn": "src/index.ts" },
    });
  };
  try {
    const baseline = extract(fixture());
    assert.ok(baseline.exports["./cn#Widget"], "subpath exports are recorded");
    assert.equal(baseline.exports[".#Alias"].target, baseline.exports[".#Widget"].target);
    assert.ok(
      Object.values(baseline.declarations)
        .flat()
        .some((record) => record.declaration.includes("type InternalOptions =")),
      "reachable private types remain reviewable",
    );
    assert.ok(
      Object.values(baseline.declarations)
        .flat()
        .every((record) => !record.source.startsWith("node_modules/")),
      "dependency declaration bodies are not copied into the snapshot",
    );
    assert.deepEqual(Object.keys(baseline.dependencyContracts), ["adapter"]);
    assert.equal("ambientDependencies" in baseline, false);
    assert.deepEqual(
      compareApi(baseline, extract(fixture({ body: 'return "changed";', comment: true }))),
      [],
    );
    for (const change of [
      { required: true },
      { number: true },
      { part: "Replacement" },
      { overload: true },
      { nestedRequired: true },
    ]) {
      assert.ok(
        compareApi(baseline, extract(fixture(change))).some(
          (entry) => entry.section === "declarations",
        ),
        `must detect ${JSON.stringify(change)}`,
      );
    }
    assert.ok(
      compareApi(baseline, extract(fixture({ alias: "ReplacementAlias" }))).some(
        (entry) => entry.kind === "removed" && entry.name === ".#Alias",
      ),
      "export aliases remain protected",
    );
    assert.ok(
      compareApi(baseline, extract(fixture({ removed: true }))).some(
        (entry) => entry.kind === "removed" && entry.name === ".#Status",
      ),
    );
    assert.ok(
      compareApi(baseline, extract(fixture({ added: true }))).some(
        (entry) => entry.kind === "added" && entry.name === ".#Added",
      ),
    );
    adapter("");
    assert.deepEqual(
      compareApi(baseline, extract(fixture())),
      [{ section: "dependencyContracts", kind: "changed", name: "adapter" }],
      "a referenced dependency prop change must be detected without a local source edit",
    );
    adapter("?", "number");
    assert.deepEqual(
      compareApi(baseline, extract(fixture())),
      [],
      "unexposed dependency declarations do not churn the fingerprint",
    );
    const reordered = fixture().replace("export type Status = 'open' | 'closed';", "");
    adapter();
    assert.deepEqual(
      compareApi(baseline, extract(`export type Status = 'open' | 'closed';\n${reordered}`)),
      [],
      "source declaration movement does not change the snapshot",
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a snapshot format migration reports exports without comparing incompatible declaration formats", () => {
  const before = {
    schemaVersion: 1,
    exports: { ".#Removed": { kind: "value", target: "Old" } },
    declarations: { Old: [{ declaration: "old representation" }] },
    ambientDependencies: { "node_modules/typescript/lib/lib.dom.d.ts": "old ambient hash" },
  };
  const after = {
    schemaVersion: 2,
    exports: {},
    declarations: { New: [{ declaration: "new representation" }] },
    dependencyContracts: { adapter: "new contract hash" },
  };
  assert.deepEqual(compareApi(before, after), [
    { section: "schema", kind: "changed", name: "1 → 2" },
    { section: "exports", kind: "removed", name: ".#Removed" },
  ]);
});

test("base revision comparison reads snapshots larger than 1 MiB and rejects invalid revisions", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-api-git-"));
  const git = (...args) => execFileSync("git", args, { cwd: root, stdio: "ignore" });
  try {
    git("init", "-q");
    const snapshot = JSON.stringify({ declaration: "x".repeat(2 * 1024 * 1024) });
    fs.writeFileSync(path.join(root, "baseline.json"), snapshot);
    git("add", "baseline.json");
    git(
      "-c",
      "user.name=API fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "-c",
      "commit.gpgSign=false",
      "commit",
      "-qm",
      "fixture",
    );
    assert.equal(readBaselineAtRef(root, "HEAD", "baseline.json"), snapshot);
    assert.equal(readBaselineAtRef(root, "HEAD", "not-yet-added.json"), null);
    assert.throws(() => readBaselineAtRef(root, "missing-revision", "baseline.json"));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
