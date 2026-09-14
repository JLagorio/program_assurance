#!/usr/bin/env node
/** Explicit original demo import. Defaults to a read-only plan; never runs at app boot. */
import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { createContext, mapPeople, sha256 } from "./demo/context.mjs";
import { mapAssurance } from "./demo/map-assurance.mjs";
import { mapWorkflow } from "./demo/map-workflow.mjs";
import { applyPlan, loadReferences, targetTenant, queryJson } from "./demo/database.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export async function buildDemoPlan({ tenantId, refs, importedAt = new Date().toISOString() }) {
  const manifest = JSON.parse(await readFile(resolve(root, "supabase/demo/manifest.json"), "utf8"));
  const compressed = await readFile(resolve(root, "supabase/demo", manifest.fixture));
  if (sha256(compressed) !== manifest.fixture_sha256)
    throw new Error("Demo fixture compressed checksum does not match its manifest");
  const uncompressed = gunzipSync(compressed);
  if (sha256(uncompressed) !== manifest.sha256)
    throw new Error("Demo fixture JSON checksum does not match its manifest");
  const source = JSON.parse(uncompressed.toString("utf8"));
  const ctx = createContext({ source, refs, tenantId, importedAt, fixtureSha256: manifest.sha256 });
  mapPeople(ctx);
  await mapAssurance(ctx);
  mapWorkflow(ctx);
  const covered = new Set();
  for (let pointer of ctx.entries
    .map((entry) => entry.pointer)
    .concat(ctx.issues.map((issue) => issue.pointer))
    .filter(Boolean))
    while (pointer) {
      covered.add(pointer);
      pointer = pointer.slice(0, pointer.lastIndexOf("/"));
    }
  const auditList = (rows, prefix) =>
    rows.forEach((record, index) => {
      const pointer = `${prefix}/${index}`;
      if (!covered.has(pointer))
        ctx.report(
          pointer,
          "source_preserved_without_projection",
          `${record?.id ?? record?.uuid ?? pointer}: original source is archived intact; this legacy concept lacks a complete mapping to the current domain schema and is not replaced with guessed records.`,
        );
    });
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) auditList(value, `/${key}`);
    else if (value && typeof value === "object")
      for (const [name, rows] of Object.entries(value))
        if (Array.isArray(rows)) auditList(rows, `/${key}/${name}`);
  }
  return { ctx, manifest };
}
export function reportFor(ctx) {
  const tables = {};
  for (const entry of ctx.entries) tables[entry.table] = (tables[entry.table] ?? 0) + 1;
  const issueCounts = {};
  for (const issue of ctx.issues) issueCounts[issue.code] = (issueCounts[issue.code] ?? 0) + 1;
  return {
    tenantId: ctx.tenantId,
    fixtureSha256: ctx.fixtureSha256,
    plannedAt: ctx.importedAt,
    plannedRecords: ctx.entries.length,
    tables,
    issueCounts,
    issues: ctx.issues,
  };
}
async function main() {
  const args = process.argv.slice(2),
    options = {};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (["--tenant", "--account", "--report"].includes(arg)) {
      if (!args[index + 1] || args[index + 1].startsWith("--"))
        throw new Error(`${arg} needs a value`);
      options[arg.slice(2)] = args[++index];
    } else if (["--apply", "--check", "--help"].includes(arg)) options[arg.slice(2)] = true;
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (options.help) {
    console.log(
      "node scripts/seed-demo.mjs --tenant UUID --account EMAIL [--report PATH] [--check | --apply]\nDefault: read-only mapping audit. --check validates the complete transaction then rolls back. --apply explicitly commits inserts. Existing records are never overwritten.",
    );
    return;
  }
  if (!options.tenant || !options.account)
    throw new Error(
      "Supply --tenant UUID and --account EMAIL explicitly; no workspace is selected implicitly.",
    );
  if (options.check && options.apply) throw new Error("Choose --check or --apply, not both.");
  targetTenant(options.tenant, options.account);
  const { ctx, manifest } = await buildDemoPlan({
    tenantId: options.tenant,
    refs: loadReferences(),
  });
  const report = reportFor(ctx);
  if (options.report)
    await writeFile(resolve(options.report), JSON.stringify(report, null, 2) + "\n");
  console.log(
    JSON.stringify(
      {
        mode: options.apply ? "apply" : options.check ? "rollback check" : "read-only plan",
        ...report,
        issues: undefined,
      },
      null,
      2,
    ),
  );
  if (options.apply || options.check) {
    const exists = queryJson("select to_regclass('public.demo_import_batches') is not null;");
    if (options.apply && !exists)
      throw new Error("Apply the reviewed demo provenance migration before --apply.");
    const migration = exists
      ? null
      : await readFile(
          resolve(root, "supabase/migrations/20260912090000_demo_seed_provenance.sql"),
          "utf8",
        );
    const result = applyPlan(ctx, manifest, { commit: Boolean(options.apply), migration });
    console.log(JSON.stringify(result));
  }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  main().catch((error) => {
    console.error(error.stderr?.toString() || error.message);
    process.exitCode = 1;
  });
