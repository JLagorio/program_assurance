/**
 * The control's work on its program record, in a disposable local workspace: its Implementation
 * part by part (the narrative, a contribution, Write narrative on a part), its Requirements (what a
 * requirement covers and on which system) and its Evidence, where Add evidence links a published
 * version to the requirement that owes it and the control climbs from No evidence to Not assessed.
 * The parts are found by their tabs' and buttons' names, wherever the record draws them.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("control-work");
const { client, tenantId } = workspace;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(30000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", (dialog) => {
  errors.push(`Unexpected native ${dialog.type()}: ${dialog.message()}`);
  void dialog.dismiss();
});
async function data(query) {
  const response = await query;
  assert.ifError(response.error);
  return response.data;
}
async function insert(table, values) {
  return data(
    client
      .from(table)
      .insert({ tenant_id: tenantId, ...values })
      .select()
      .single(),
  );
}
/** The record's tab by its name, which may carry a count after it. */
const tab = (name) => page.getByRole("tab", { name: new RegExp(`^${name}`) });
const panel = () => page.getByRole("tabpanel").filter({ visible: true }).first();
try {
  // A published reference baseline that selects SI-2.
  const flaws = await data(
    client.from("controls").select("id, code, title, catalog_revision_id").eq("code", "SI-2"),
  );
  const resolutions = await data(
    client.from("profile_resolutions").select("id").is("tenant_id", null).eq("state", "published"),
  );
  const [chosen] = await data(
    client
      .from("selected_controls")
      .select("profile_resolution_id, control_id")
      .in(
        "control_id",
        flaws.map((control) => control.id),
      )
      .in(
        "profile_resolution_id",
        resolutions.map((row) => row.id),
      )
      .limit(1),
  );
  assert.ok(chosen, "A published reference baseline selects SI-2");
  const control = flaws.find((row) => row.id === chosen.control_id);
  const profileKey = randomUUID();
  const created = await data(
    client.rpc("create_program_wizard", {
      p_tenant_id: tenantId,
      p_draft: {
        requestId: randomUUID(),
        code: "FLAWS",
        name: "Flaw remediation",
        description: "",
        sponsorPartyId: null,
        startsOn: null,
        endsOn: null,
        roles: [],
        catalogRevisionId: control.catalog_revision_id,
        profiles: [
          {
            key: profileKey,
            baseResolutionId: chosen.profile_resolution_id,
            tailoring: [],
            parameters: [],
          },
        ],
        systems: [
          {
            key: randomUUID(),
            code: "SYS-ONE",
            name: "System one",
            description: "",
            type: "information_system",
            ownerPartyId: null,
            confidentiality: "low",
            integrity: "low",
            availability: "low",
            categorizationRationale: "A limited impact boundary for a disposable check.",
            profileKey,
            elements: [],
          },
        ],
      },
    }),
  );
  const programId = created.programId;
  const [system] = await data(client.from("systems").select("id").eq("program_id", programId));
  const [baseline] = await data(
    client
      .from("system_effective_baselines")
      .select("profile_resolution_id")
      .eq("system_id", system.id),
  );
  const [selection] = await data(
    client
      .from("selected_controls")
      .select("id")
      .eq("profile_resolution_id", baseline.profile_resolution_id)
      .eq("control_id", control.id),
  );
  // The SSP says how the control is met as a whole; no part has a narrative yet.
  // Program setup records the system's first SSP, a draft on its baseline.
  const [ssp] = await data(
    client.from("ssp_revisions").select("id, state").eq("system_id", system.id),
  );
  assert.equal(ssp?.state, "draft");
  const narrative = "Flaws are found by monthly scans and corrected by signed updates.";
  // Setup records an implementation of each control the SSP selects; this one gets its narrative.
  const [recorded] = await data(
    client
      .from("implemented_requirements")
      .select("id, revision")
      .eq("ssp_revision_id", ssp.id)
      .eq("selected_control_id", selection.id),
  );
  const implementation = await data(
    client
      .from("implemented_requirements")
      .update({
        implementation_status: "partial",
        description: narrative,
        revision: recorded.revision + 1,
      })
      .eq("id", recorded.id)
      .select()
      .single(),
  );
  // One requirement maps the whole control on the system and cites no evidence.
  const requirement = await insert("engineering_requirements", {
    program_id: programId,
    code: "REQ-FLAW",
  });
  const revision = await insert("requirement_revisions", {
    engineering_requirement_id: requirement.id,
    version_number: 1,
    title: "Remediate flaws",
    statement: "The system shall remediate flaws within the agreed period.",
    acceptance_criteria: "The recorded test demonstrates it.",
    requirement_type: "security",
  });
  await insert("requirement_allocations", {
    requirement_revision_id: revision.id,
    system_id: system.id,
  });
  await insert("requirement_control_links", {
    requirement_revision_id: revision.id,
    control_id: control.id,
    system_id: system.id,
    selected_control_id: selection.id,
    relationship_type: "maps_to",
  });
  const artifact = await insert("evidence_artifacts", {
    title: "Patch test report",
    artifact_kind: "document",
    program_id: programId,
  });
  const version = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 1,
    state: "published",
    external_uri: `https://example.test/evidence/${artifact.id}`,
  });

  await page.goto(`${origin}/programs/${programId}/controls/${control.id}`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByText("No evidence", { exact: true }).first().waitFor();

  // Implementation: the Summary's narrative, then each part of the statement with none yet.
  await tab("Implementation").click();
  await panel().getByText(narrative, { exact: true }).waitFor();
  await panel().getByText("SSP 1 · Draft", { exact: true }).waitFor();
  const parts = await data(
    client
      .from("control_parts")
      .select("id, parent_part_id, name")
      .eq("control_id", control.id)
      .eq("name", "item"),
  );
  const writes = panel().getByRole("button", { name: "Write narrative", exact: true });
  assert.equal(
    await writes.count(),
    parts.length,
    "Every part of the statement offers Write narrative",
  );
  await writes.first().click();
  const form = page.getByRole("dialog", { name: "Write narrative", exact: true });
  await form.getByRole("textbox").first().fill("Scans identify, report and correct flaws monthly.");
  await form.getByRole("button", { name: "Write narrative", exact: true }).click();
  await form.waitFor({ state: "hidden" });
  await panel()
    .getByText("Scans identify, report and correct flaws monthly.", { exact: true })
    .waitFor();
  const statements = await data(
    client
      .from("implementation_statements")
      .select("control_part_id, implemented_requirement_id")
      .eq("implemented_requirement_id", implementation.id),
  );
  assert.equal(statements.length, 1, "Write narrative records one implementation statement");
  assert.ok(parts.some((part) => part.id === statements[0].control_part_id));
  await panel().getByRole("button", { name: "Edit narrative", exact: true }).nth(1).waitFor();

  // Requirements: the requirement, what it covers and on which system.
  await tab("Requirements").click();
  const requirements = panel().getByRole("table");
  await requirements.getByRole("link", { name: "REQ-FLAW Remediate flaws", exact: true }).waitFor();
  await requirements.getByText("Whole control", { exact: true }).waitFor();
  await requirements.getByText("SYS-ONE", { exact: true }).waitFor();
  await panel().getByRole("button", { name: "Map a requirement", exact: true }).waitFor();

  // Evidence: none cited, then Add evidence on the control links the version to REQ-FLAW.
  await tab("Evidence").click();
  await panel().getByText("No evidence cited", { exact: true }).waitFor();
  await panel().getByRole("button", { name: "Add evidence", exact: true }).first().click();
  const browse = page.getByRole("dialog", { name: "Add evidence", exact: true });
  await browse.getByText(`REQ-FLAW · ${control.code} ${control.title}`, { exact: true }).waitFor();
  await browse.getByText("Covers", { exact: true }).waitFor();
  await browse.getByPlaceholder("Find evidence to link", { exact: true }).fill("Patch test");
  await browse
    .getByRole("checkbox", { name: /Patch test report/ })
    .first()
    .click();
  await browse.getByRole("button", { name: "Add evidence (1)", exact: true }).click();
  await browse.waitFor({ state: "hidden" });
  const links = await data(
    client
      .from("requirement_evidence")
      .select("evidence_version_id")
      .eq("requirement_revision_id", revision.id),
  );
  assert.deepEqual(
    links.map((row) => row.evidence_version_id),
    [version.id],
    "Add evidence links the version to the requirement that owed it",
  );
  const cited = panel().getByRole("table");
  await cited.getByRole("link", { name: "Patch test report", exact: true }).waitFor();
  await cited.getByText("Not reviewed", { exact: true }).waitFor();
  await cited.getByText("No reviewer", { exact: true }).waitFor();
  // The record reads the new standing: the control climbs to Not assessed.
  await page.getByText("Not assessed", { exact: true }).first().waitFor();

  assert.deepEqual(errors, []);
  console.log(
    "PASS control work: Implementation by part with Write narrative, Requirements covering the whole control on SYS-ONE, Add evidence on the control linking REQ-FLAW's evidence and the control climbing to Not assessed; disposable workspace cleaned",
  );
} catch (error) {
  await page.screenshot({ path: "/tmp/control-work-failure.png", animations: "disabled" });
  throw error;
} finally {
  await browser.close();
  await workspace.cleanup();
}
