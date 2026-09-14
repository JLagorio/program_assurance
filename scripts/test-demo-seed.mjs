/** Live, isolated demo import: complete transaction, rerun preservation, and rollback. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localWorkspace } from "./tests/local-workspace.mjs";
import { buildDemoPlan } from "./seed-demo.mjs";
import { buildRecoveryPlan } from "./restore-requirement-control-mappings.mjs";
import { applyPlan, loadReferences, queryJson, quote } from "./demo/database.mjs";

const refs = loadReferences();
const workspace = await localWorkspace("demo-import");
let collision;
const data = async (query) => {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
};
const count = (table, tenant = workspace.tenantId) =>
  queryJson(`select count(*)::integer from public.${table} where tenant_id=${quote(tenant)};`);
try {
  const original = await data(
    workspace.client
      .from("programs")
      .insert({ tenant_id: workspace.tenantId, code: "USER-PRESERVED", name: "My own program" })
      .select()
      .single(),
  );
  const { ctx, manifest } = await buildDemoPlan({ tenantId: workspace.tenantId, refs });
  console.log(`Importing ${ctx.entries.length} original demo records into a disposable workspace.`);
  const first = applyPlan(ctx, manifest, { commit: true });
  assert.equal(first.inserted, ctx.entries.length);
  assert.equal(first.preserved, 0);
  assert.equal(count("programs"), 7);
  assert.equal(count("demo_import_records"), ctx.entries.length);
  assert.equal(count("evidence_artifacts"), 390);
  assert.equal(count("engineering_requirements"), 646);
  assert.equal(count("requirement_control_links"), 665);
  const compositionCount = ctx.entries.filter(
    (entry) => entry.table === "composition_nodes",
  ).length;
  assert.equal(count("composition_nodes"), compositionCount);
  assert.equal(
    queryJson(`select count(*) from public.demo_import_records r
    join public.composition_nodes n on n.id=r.destination_id and n.tenant_id=r.tenant_id
    join public.systems s on s.id=n.id and s.tenant_id=n.tenant_id
    where r.tenant_id=${quote(workspace.tenantId)} and r.destination_table='composition_nodes';`),
    compositionCount,
    "Composition source receipts resolve through the exact view to canonical systems",
  );
  assert.equal(count("system_components"), 20);
  assert.equal(count("operational_issues"), 62);
  assert.equal(count("poam_items"), 52);
  assert.equal(
    queryJson(
      `select count(*)::integer from public.issue_poams l join public.operational_issues i on i.id=l.issue_id join public.poam_items p on p.id=l.poam_item_id join public.poam_documents d on d.id=p.poam_document_id where l.tenant_id=${quote(workspace.tenantId)} and i.program_id<>d.program_id;`,
    ),
    0,
    "POA&M issue links must retain their source program",
  );
  assert.equal(
    queryJson(
      `select count(*)::integer from public.poam_item_observations l join public.observations o on o.id=l.observation_id join public.poam_item_revisions r on r.id=l.poam_item_revision_id join public.poam_documents d on d.id=r.poam_document_id where l.tenant_id=${quote(workspace.tenantId)} and o.program_id is distinct from d.program_id;`,
    ),
    0,
    "POA&M observation links must retain their source program",
  );

  assert.equal(count("test_runs"), 0, "No configuration-pinned execution may be invented");
  assert.equal(count("authorization_decisions"), 0, "No authorization may be fabricated");
  assert.equal(
    queryJson(
      `select count(*)::integer from public.evidence_versions where tenant_id=${quote(workspace.tenantId)} and storage_object_id is not null;`,
    ),
    0,
  );
  assert.equal(
    queryJson(
      `select count(*)::integer from public.evidence_versions where tenant_id=${quote(workspace.tenantId)} and state='published' and external_uri is not null;`,
    ),
    368,
  );
  assert.equal(
    queryJson(
      `select count(*)::integer from public.parties where tenant_id=${quote(workspace.tenantId)} and party_type='organization';`,
    ),
    6,
  );
  assert.equal(
    queryJson(
      `select count(*)::integer from public.implemented_requirements where tenant_id=${quote(workspace.tenantId)} and implementation_status='not_implemented';`,
    ),
    38,
  );
  assert.equal(
    queryJson(
      `select count(*)::integer from public.workstreams where tenant_id=${quote(workspace.tenantId)} and status='blocked';`,
    ),
    2,
  );
  assert.equal(
    queryJson(
      `select count(*)::integer from public.lifecycle_gates where tenant_id=${quote(workspace.tenantId)} and status='completed';`,
    ),
    52,
  );
  assert.equal(
    queryJson(
      `select count(*)::integer from public.lifecycle_gates where tenant_id=${quote(workspace.tenantId)} and status='passed';`,
    ),
    0,
  );
  console.log("Full import, exact states, and absence of fabricated runs/files/decisions passed.");
  const importedProgram = await data(
    workspace.client
      .from("programs")
      .select("*")
      .eq("tenant_id", workspace.tenantId)
      .eq("code", "PRG-1090")
      .single(),
  );
  await data(
    workspace.client
      .from("programs")
      .update({ name: "My edit to the imported demo", revision: importedProgram.revision + 1 })
      .eq("id", importedProgram.id)
      .eq("revision", importedProgram.revision),
  );
  const beforeRecords = count("demo_import_records"),
    beforeIssues = count("import_issues");
  const recovery = await buildRecoveryPlan({ tenantId: workspace.tenantId, refs });
  assert.equal(recovery.report.plannedInserts, 0);
  assert.equal(recovery.report.preservedImports, 665);
  const recovered = applyPlan(recovery.ctx, recovery.manifest, { commit: true });
  assert.equal(
    recovered.inserted,
    0,
    "Fresh source mappings do not duplicate on targeted recovery",
  );
  assert.equal(count("demo_import_records"), beforeRecords);
  assert.equal(count("import_issues"), beforeIssues);
  const repeated = await buildDemoPlan({ tenantId: workspace.tenantId, refs });
  const second = applyPlan(repeated.ctx, repeated.manifest, { commit: true });
  assert.equal(second.inserted, 0);
  assert.equal(second.preserved, ctx.entries.length);
  assert.equal(count("demo_import_records"), beforeRecords);
  assert.equal(count("import_issues"), beforeIssues);
  assert.equal(
    (
      await data(
        workspace.client
          .from("programs")
          .select("name,revision")
          .eq("id", importedProgram.id)
          .single(),
      )
    ).name,
    "My edit to the imported demo",
  );
  assert.equal(
    (await data(workspace.client.from("programs").select("name").eq("id", original.id).single()))
      .name,
    "My own program",
  );
  assert.equal(
    queryJson(
      `select bool_and(completed_at>=started_at and status='completed') from public.ingestion_jobs where tenant_id=${quote(workspace.tenantId)};`,
    ),
    true,
  );
  for (const key of Object.keys(ctx.source))
    assert.equal(
      queryJson(
        `select count(*)::integer from public.demo_import_sources where tenant_id=${quote(workspace.tenantId)} and source_pointer=${quote(`/${key}`)};`,
      ),
      1,
      `Source section ${key} must be archived intact`,
    );
  console.log(
    "Idempotent rerun preserved user-owned records and edits to imported records; complete source archive verified.",
  );
  const changed = await buildDemoPlan({ tenantId: workspace.tenantId, refs });
  changed.ctx.entries[0].source = { ...changed.ctx.entries[0].source, testChangedSource: true };
  assert.throws(
    () => applyPlan(changed.ctx, changed.manifest, { commit: true }),
    (error) => error.stderr?.toString().includes("Existing demo source changed"),
  );
  assert.equal(count("demo_import_records"), beforeRecords);
  const invalid = await buildDemoPlan({ tenantId: workspace.tenantId, refs });
  invalid.ctx.add("tasks", "test-invalid-parent", null, {
    program_id: randomUUID(),
    title: "This must roll back",
    status: "open",
  });
  assert.throws(
    () => applyPlan(invalid.ctx, invalid.manifest, { commit: true }),
    (error) => error.stderr?.toString().includes("foreign key constraint"),
  );
  assert.equal(count("tasks"), 10);
  assert.equal(count("demo_import_records"), beforeRecords);
  collision = await localWorkspace("demo-collision");
  await data(
    collision.client.from("programs").insert({
      tenant_id: collision.tenantId,
      code: "PRG-1090",
      name: "Existing same-code user program",
    }),
  );
  const conflicting = await buildDemoPlan({ tenantId: collision.tenantId, refs });
  assert.throws(
    () => applyPlan(conflicting.ctx, conflicting.manifest, { commit: true }),
    (error) => error.stderr?.toString().includes("duplicate key value"),
  );
  assert.equal(count("programs", collision.tenantId), 1);
  assert.equal(count("demo_import_records", collision.tenantId), 0);
  assert.equal(count("demo_import_batches", collision.tenantId), 0);
  assert.equal(count("demo_import_sources", collision.tenantId), 0);
  assert.equal(count("ingestion_jobs", collision.tenantId), 0);
  console.log(
    "Demo import passed: full real-schema import, source archival, exact states, idempotency, preservation of user edits, source-change rejection, late foreign-key rollback, and existing-code collision rollback.",
  );
} finally {
  if (collision) await collision.cleanup();
  await workspace.cleanup();
  console.log("Disposable demo test accounts and all tenant records cleaned.");
}
