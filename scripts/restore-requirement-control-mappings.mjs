#!/usr/bin/env node
/** Recover exact archived control references only; never replay the full demo import. */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildDemoPlan } from "./seed-demo.mjs";
import { datasetId } from "./demo/context.mjs";
import { applyPlan, loadReferences, queryJson, quote, targetTenant } from "./demo/database.mjs";

export function recoverySnapshot(tenantId) {
  return queryJson(`select jsonb_build_object(
    'imports',(select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from public.demo_import_records r
      where tenant_id=${quote(tenantId)} and dataset_id=${quote(datasetId)}
        and destination_table in ('engineering_requirements','requirement_control_links')),
    'requirements',(select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from public.engineering_requirements r where tenant_id=${quote(tenantId)}),
    'contents',(select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from public.requirement_revisions r where tenant_id=${quote(tenantId)}),
    'links',(select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from public.requirement_control_links r where tenant_id=${quote(tenantId)}));`);
}

/** Use import identity, not a code/name match. Existing authored mappings and source receipts win. */
export function selectRecoveryPlan(ctx, snapshot) {
  const imports = new Map(
    snapshot.imports.map((row) => [`${row.destination_table}/${row.source_key}`, row]),
  );
  const identities = new Map(snapshot.requirements.map((row) => [row.id, row]));
  const plannedContent = new Map(
    ctx.entries
      .filter((entry) => entry.table === "requirement_revisions")
      .map((entry) => [entry.values.id, entry.values]),
  );
  const latest = new Map();
  for (const content of snapshot.contents) {
    const previous = latest.get(content.engineering_requirement_id);
    if (!previous || previous.version_number < content.version_number)
      latest.set(content.engineering_requirement_id, content);
  }
  const entries = [];
  const skipped = [];
  let preserved = 0;
  for (const entry of ctx.entries.filter((item) => item.table === "requirement_control_links")) {
    const requirementId = plannedContent.get(
      entry.values.requirement_revision_id,
    )?.engineering_requirement_id;
    const sourceRequirement = ctx.entries.find(
      (item) => item.table === "engineering_requirements" && item.values.id === requirementId,
    );
    const imported =
      sourceRequirement && imports.get(`engineering_requirements/${sourceRequirement.key}`);
    const identity = imported && identities.get(imported.destination_id);
    const current = identity && latest.get(identity.id);
    if (
      !sourceRequirement ||
      !imported ||
      imported.destination_id !== requirementId ||
      !identity ||
      !current
    ) {
      skipped.push({
        sourceKey: entry.key,
        reason: "Imported requirement identity or current details are unavailable.",
      });
      continue;
    }
    const receipt = imports.get(`requirement_control_links/${entry.key}`);
    if (receipt) {
      // applyPlan validates the source receipt and destination presence without overwriting any edit.
      entries.push({ ...entry, values: { ...entry.values, requirement_revision_id: current.id } });
      preserved += 1;
      continue;
    }
    const existing = snapshot.links.find(
      (link) =>
        link.requirement_revision_id === current.id &&
        link.control_id === entry.values.control_id &&
        link.control_part_id === null &&
        link.system_id === null &&
        link.relationship_type === "derived_from",
    );
    if (existing) {
      skipped.push({
        sourceKey: entry.key,
        reason:
          "An authored whole-control derivation already occupies this relationship; it is preserved without attributing it to the import.",
        existingId: existing.id,
      });
      continue;
    }
    entries.push({ ...entry, values: { ...entry.values, requirement_revision_id: current.id } });
  }
  return {
    ctx: {
      ...ctx,
      source: {},
      entries,
      operations: entries.map((entry) => ({ kind: "insert", entry })),
      issues: [],
    },
    report: {
      tenantId: ctx.tenantId,
      fixtureSha256: ctx.fixtureSha256,
      exactSourceMappings: ctx.entries.filter(
        (entry) => entry.table === "requirement_control_links",
      ).length,
      plannedInserts: entries.length - preserved,
      preservedImports: preserved,
      skipped,
    },
  };
}

export async function buildRecoveryPlan({
  tenantId,
  refs = loadReferences(),
  snapshot = recoverySnapshot(tenantId),
}) {
  const { ctx, manifest } = await buildDemoPlan({ tenantId, refs });
  return { ...selectRecoveryPlan(ctx, snapshot), manifest };
}

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (["--tenant", "--account", "--report"].includes(arg)) {
      if (!args[index + 1] || args[index + 1].startsWith("--"))
        throw new Error(`${arg} needs a value`);
      options[arg.slice(2)] = args[++index];
    } else if (["--check", "--apply", "--help"].includes(arg)) options[arg.slice(2)] = true;
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (options.help) {
    console.log(
      "node scripts/restore-requirement-control-mappings.mjs --tenant UUID --account EMAIL [--report PATH] [--check | --apply]\nDefault: read-only plan. --check validates and rolls back. --apply inserts only exact archived whole-control mappings and their provenance. Current requirement text, existing relationships, and import issues are preserved.",
    );
    return;
  }
  if (!options.tenant || !options.account)
    throw new Error("Supply --tenant UUID and --account EMAIL explicitly.");
  if (options.check && options.apply) throw new Error("Choose --check or --apply, not both.");
  targetTenant(options.tenant, options.account);
  const { ctx, manifest, report } = await buildRecoveryPlan({ tenantId: options.tenant });
  if (options.report)
    await writeFile(resolve(options.report), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  if (options.check || options.apply)
    console.log(JSON.stringify(applyPlan(ctx, manifest, { commit: !!options.apply }), null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
