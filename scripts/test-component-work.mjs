#!/usr/bin/env node
/**
 * A shared component's Findings, SBOM and Versions tabs, end to end in the run's own disposable
 * workspace. A component set has a Shared unit in versions 1 and 2, version 2 recording a software
 * change that affects one control; two programs are built from version 1, and the first offers two
 * operational issues to the component's owner. Version 1's SBOM lists an OpenSSH server that
 * CVE-2024-6387 affects.
 *
 * Findings lists both offers. One's preview says what accepting it opens (an operational issue in
 * the other program; the offering program keeps its own); Accept confirms with the same words, the
 * offer is accepted, the other program holds its own issue, and the preview lists it under Opened
 * with Accept keeping its place and saying why it no longer runs. The other offer's Return asks why
 * and refuses an empty reason on its field, then returns it. An address that names an offer opens
 * its preview. SBOM lists the components with the CVE Affected, and the two programs with No
 * issue; Open operational issues opens one in each. Import SBOM reads a CycloneDX file and imports
 * it, and its components stand. Versions lists both versions, and version 2's change with the
 * control it affects.
 *
 * The panels are found by their headings and their tables' names, wherever the record mounts them:
 * `componentTab` alone says where a component version's tab is.
 */
import assert from "node:assert/strict";
import { mkdir, mkdtemp } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { expect as playwrightExpect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const expect = playwrightExpect.configure({ timeout: 30000 });

/** Where a component version's tab is drawn: the component's record, at that version. */
const componentTab = ({ componentId }, tab, search = "") =>
  `/library/components/${componentId}?tab=${encodeURIComponent(
    { findings: "Findings", sbom: "SBOM", versions: "Versions" }[tab],
  )}${search}`;

const workspace = await localWorkspace("component-work");
const screenshots =
  process.env.PATTERN_ARTIFACT_DIR || (await mkdtemp(join(tmpdir(), "component-work-")));
await mkdir(screenshots, { recursive: true });
const errors = [];
let browser;
let page;
const { client, tenantId } = workspace;

async function data(query, what) {
  const result = await query;
  assert.ifError(result.error, what);
  return result.data;
}
const insert = (model, values) =>
  data(
    client
      .from(model)
      .insert({ ...values, tenant_id: tenantId })
      .select()
      .single(),
    `insert ${model}`,
  );
const publish = (revision) =>
  data(
    client
      .from("component_definition_revisions")
      .update({ state: "published", revision: revision.revision + 1 })
      .eq("id", revision.id)
      .eq("revision", revision.revision)
      .select()
      .single(),
    "publish a version",
  );
const panel = () => page.locator('[data-shell-area="panel"]');
const recordHeader = () => panel().locator("[data-record-preview-header]:visible");
const toast = (text) => page.locator('[data-slot="toast"]').filter({ hasText: text });

/** A program with one system whose one element takes the library component's version. */
async function program(code, catalogRevisionId, baseResolutionId, pin) {
  const profile = randomUUID();
  await data(
    client.rpc("create_program_wizard", {
      p_tenant_id: tenantId,
      p_draft: {
        requestId: randomUUID(),
        code,
        name: `${code} component work`,
        description: "",
        sponsorPartyId: null,
        startsOn: null,
        endsOn: null,
        roles: [],
        catalogRevisionId,
        profiles: [
          { key: profile, baseResolutionId, tailoring: [], parameters: [], overlayIds: [] },
        ],
        systems: [
          {
            key: randomUUID(),
            code: `${code}-SYS`,
            name: `${code} system`,
            description: "",
            type: "platform",
            ownerPartyId: null,
            confidentiality: "low",
            integrity: "low",
            availability: "low",
            categorizationRationale: "A limited impact boundary for a disposable test.",
            profileKey: profile,
            elements: [
              {
                key: randomUUID(),
                parentKey: null,
                code: `${code}-SHR`,
                name: "Shared unit",
                description: "",
                type: null,
                library: pin,
                productElementId: null,
              },
            ],
          },
        ],
      },
    }),
    `create ${code}`,
  );
  const created = await data(
    client.from("programs").select("id,name").eq("code", code).single(),
    `read ${code}`,
  );
  const system = await data(
    client
      .from("systems")
      .select("id")
      .eq("program_id", created.id)
      .eq("code", `${code}-SYS`)
      .single(),
    `read ${code}'s system`,
  );
  const component = await data(
    client.from("system_components").select("id").eq("system_id", system.id).single(),
    `read ${code}'s component`,
  );
  return { ...created, systemComponentId: component.id };
}

try {
  // ——— The pinned references: the smallest reference baseline on the newest catalog ————————————
  const [catalog] = await data(
    client
      .from("catalog_revisions")
      .select("id")
      .is("tenant_id", null)
      .eq("state", "published")
      .order("created_at", { ascending: false })
      .limit(1),
    "read the catalog editions",
  );
  assert.ok(catalog, "No catalog edition is installed: run npm run local:start");
  const roots = await data(
    client
      .from("profile_resolutions")
      .select("id,profile_revision_id")
      .is("tenant_id", null)
      .is("base_profile_resolution_id", null)
      .eq("state", "published"),
    "read the reference baselines",
  );
  const imports = await data(
    client
      .from("profile_imports")
      .select("profile_revision_id")
      .eq("catalog_revision_id", catalog.id)
      .in(
        "profile_revision_id",
        roots.map((row) => row.profile_revision_id),
      ),
    "read the baselines' catalogs",
  );
  const base = roots.find((row) =>
    imports.some((item) => item.profile_revision_id === row.profile_revision_id),
  );
  assert.ok(base, "No reference baseline is installed on the newest catalog edition");
  const selected = await data(
    client
      .from("selected_controls")
      .select("control_id,controls!inner(code,title)")
      .eq("profile_resolution_id", base.id)
      .order("ordinal")
      .limit(2),
    "read two controls of the baseline",
  );
  const [a, b] = selected;
  assert.ok(a && b, "The reference baseline selects too few controls");

  // ——— The component set: a Shared unit in version 1 and in version 2, which changes it ——————
  const owner = await data(
    client.from("parties").select("id,name").eq("auth_user_id", workspace.userId).single(),
    "read the account's party",
  );
  const definition = await insert("component_definitions", {
    code: "CW-SET",
    name: "Component work set",
    owner_party_id: owner.id,
  });
  const version = async (number) => {
    const revision = await insert("component_definition_revisions", {
      component_definition_id: definition.id,
      version_number: number,
    });
    const unit = await insert("defined_components", {
      component_definition_revision_id: revision.id,
      name: "Shared unit",
      component_type: "software",
    });
    for (const claim of [a, b])
      await insert("defined_component_implementations", {
        component_definition_revision_id: revision.id,
        defined_component_id: unit.id,
        control_id: claim.control_id,
        description: "The shared unit enforces it.",
        implementation_status: "implemented",
      });
    return { revision, unit };
  };
  const v1 = await version(1);
  await publish(v1.revision);
  const v2 = await version(2);
  const change = await insert("component_version_changes", {
    component_definition_revision_id: v2.revision.id,
    defined_component_id: v2.unit.id,
    change_kinds: ["software"],
    summary: "The unit carries OpenSSH server 9.8p1 in place of 9.6p1.",
  });
  await insert("component_version_change_controls", {
    component_definition_revision_id: v2.revision.id,
    component_version_change_id: change.id,
    control_id: a.control_id,
  });
  await publish(v2.revision);
  const first = { componentId: v1.unit.id };
  const second = { componentId: v2.unit.id };

  // ——— Two programs built from version 1; the first offers two issues ————————————————————————
  const pin = {
    revisionId: v1.revision.id,
    definedComponentId: v1.unit.id,
    rationale: "Taken from the library.",
  };
  const offering = await program("CW-ONE", catalog.id, base.id, pin);
  const other = await program("CW-TWO", catalog.id, base.id, pin);
  const offer = async (title) => {
    const issue = await insert("operational_issues", {
      program_id: offering.id,
      title,
      severity: "high",
      opened_at: "2026-10-10T15:00:00Z",
    });
    const answer = await data(
      client.rpc("offer_to_component", {
        p_tenant_id: tenantId,
        p_system_component_id: offering.systemComponentId,
        p_kind: "finding",
        p_item_ids: [issue.id],
        p_title: title,
        p_note: "Found on the first program's unit.",
        p_request_id: randomUUID(),
      }),
      `offer ${title}`,
    );
    return { id: answer.offerId, title, issueId: issue.id };
  };
  const accepted = await offer("Remote code execution in the shared unit");
  const returned = await offer("Weak cipher offered by the shared unit");

  // ——— Version 1's SBOM: an OpenSSH server that a CVE affects ——————————————————————————————————
  const sbom = await data(
    client.rpc("import_sbom", {
      p_tenant_id: tenantId,
      p_defined_component_id: v1.unit.id,
      p_inventory_item_id: null,
      p_title: "Shared unit image SBOM",
      p_format: "cyclonedx",
      p_spec_version: "1.5",
      p_serial: null,
      p_generated_on: "2026-10-08",
      p_evidence_artifact_id: null,
      p_components: [
        { name: "openssh-server", version: "9.6p1", kind: "application" },
        { name: "zlib", version: "1.3.1", kind: "library" },
      ],
      p_request_id: randomUUID(),
    }),
    "import version 1's SBOM",
  );
  const ssh = await data(
    client
      .from("sbom_components")
      .select("id")
      .eq("sbom_id", sbom.sbomId)
      .eq("name", "openssh-server")
      .single(),
    "read the OpenSSH server",
  );
  const cve = await insert("vulnerabilities", {
    cve_id: "CVE-2024-6387",
    title: "regreSSHion",
    severity: "high",
    cvss_score: 8.1,
    fixed_in: "OpenSSH 9.8p1",
  });
  await insert("sbom_component_vulnerabilities", {
    sbom_component_id: ssh.id,
    vulnerability_id: cve.id,
    state: "affected",
    note: "9.6p1 is inside the affected range.",
  });

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  context.setDefaultTimeout(30000);
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => {
    errors.push(`Unexpected native ${dialog.type()} dialog: ${dialog.message()}`);
    void dialog.dismiss();
  });
  await page.goto(`${origin}${componentTab(first, "findings")}`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  // ——— Findings: the offers, and what accepting one opens ——————————————————————————————————————
  const offers = page.getByRole("table", { name: "Offers", exact: true });
  await expect(offers.locator("tbody tr")).toHaveCount(2);
  await offers.getByRole("button", { name: accepted.title, exact: true }).click();
  await expect(recordHeader().getByRole("heading", { name: accepted.title })).toBeVisible();
  await expect(recordHeader().getByRole("button", { name: "Accept", exact: true })).toBeVisible();
  const opens = panel().getByLabel("Accepting opens");
  await expect(opens.getByRole("listitem").filter({ hasText: other.name })).toContainText(
    "1 operational issue",
  );
  await expect(opens.getByRole("listitem").filter({ hasText: offering.name })).toContainText(
    "Keeps its own",
  );
  console.log("PASS an offer's preview says what accepting it opens in each program");

  await recordHeader().getByRole("button", { name: "Accept", exact: true }).click();
  const prompt = page.getByRole("alertdialog", { name: "Accept offer?" });
  await expect(prompt).toContainText(other.name);
  await expect(prompt).toContainText(`${offering.name} keeps its own`);
  await prompt.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(toast("Offer accepted")).toContainText("1 operational issue opened.");
  await expect(prompt).toHaveCount(0);
  const acceptButton = recordHeader().getByRole("button", { name: "Accept", exact: true });
  await expect(acceptButton).toHaveAttribute("aria-disabled", "true");
  const links = await data(
    client
      .from("component_offer_issues")
      .select("program_id,issue_id,source,component_offer_items!inner(component_offer_id)")
      .eq("component_offer_items.component_offer_id", accepted.id),
    "read the accepted offer's issues",
  );
  const opened = links.find((link) => !link.source);
  assert.equal(opened?.program_id, other.id, "Accepting opened an issue in the other program");
  const openedList = panel().getByLabel("Opened");
  await expect(openedList.getByRole("listitem").filter({ hasText: other.name })).toContainText(
    accepted.title,
  );
  await expect(openedList.getByRole("listitem").filter({ hasText: offering.name })).toContainText(
    "Keeps its own",
  );
  console.log("PASS Accept confirms, opens the other program's issue and keeps its place");

  // ——— Return asks why ———————————————————————————————————————————————————————————————————————
  await offers.getByRole("button", { name: returned.title, exact: true }).click();
  await expect(recordHeader().getByRole("heading", { name: returned.title })).toBeVisible();
  await recordHeader().getByRole("button", { name: "More actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Return offer" }).click();
  const dialog = page.getByRole("dialog", { name: "Return offer" });
  await dialog.getByRole("button", { name: "Return offer", exact: true }).click();
  await expect(dialog).toContainText("Say why the offer is returned.");
  await dialog.getByLabel("Why it is returned").fill("The cipher is not offered by the unit.");
  await dialog.getByRole("button", { name: "Return offer", exact: true }).click();
  await expect(toast("Offer returned")).toBeVisible();
  await expect(dialog).toHaveCount(0);
  const reviewed = await data(
    client.from("component_offers").select("state,review_note").eq("id", returned.id).single(),
    "read the returned offer",
  );
  assert.deepEqual(reviewed, {
    state: "returned",
    review_note: "The cipher is not offered by the unit.",
  });
  console.log("PASS Return refuses an empty reason, then returns the offer with it");

  // ——— An address that names an offer opens its preview ————————————————————————————————————
  await page.goto(`${origin}${componentTab(first, "findings", `&offer=${accepted.id}`)}`);
  await expect(recordHeader().getByRole("heading", { name: accepted.title })).toBeVisible();
  console.log("PASS an address that names an offer opens its preview");

  // ——— SBOM: the components with their CVEs, and who has answered ——————————————————————————————
  await page.goto(`${origin}${componentTab(first, "sbom")}`);
  await expect(page.getByRole("heading", { name: "Shared unit image SBOM" })).toBeVisible();
  const components = page.getByRole("table", { name: "SBOM components", exact: true });
  const sshRow = components.locator("tbody tr").filter({ hasText: "openssh-server" });
  await expect(sshRow).toContainText("CVE-2024-6387");
  await expect(sshRow).toContainText("Affected");
  await expect(page.getByRole("heading", { name: /^Programs on version 1/ })).toBeVisible();
  const answers = page.getByRole("table", { name: "Programs on this version", exact: true });
  await expect(answers.locator("tbody tr")).toHaveCount(2);
  await expect(answers.getByText("No issue", { exact: true })).toHaveCount(2);
  await page.getByRole("button", { name: "Open operational issues", exact: true }).click();
  const openPrompt = page.getByRole("alertdialog", { name: "Open operational issues?" });
  await expect(openPrompt).toContainText("CVE-2024-6387");
  await openPrompt.getByRole("button", { name: "Open operational issues", exact: true }).click();
  await expect(toast("Operational issues opened")).toContainText("2 programs now hold one.");
  await expect(answers.getByText("No issue", { exact: true })).toHaveCount(0);
  console.log("PASS SBOM lists the CVE as affected, and opens an issue in each program owed one");

  await page.getByRole("button", { name: "Import SBOM", exact: true }).first().click();
  const importing = page.getByRole("dialog", { name: "Import SBOM" });
  await importing.locator('input[type="file"]').setInputFiles({
    name: "shared-unit.cdx.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        bomFormat: "CycloneDX",
        specVersion: "1.5",
        metadata: {
          timestamp: "2026-11-12T08:00:00Z",
          component: { name: "Shared unit image", version: "1.1" },
        },
        components: [
          { type: "application", name: "openssh-server", version: "9.8p1" },
          { type: "library", name: "zlib", version: "1.3.1" },
          { type: "application", name: "busybox", version: "1.36.1" },
        ],
      }),
    ),
  });
  // The document describes a component of its own, which it lists first.
  await expect(importing.getByRole("status")).toContainText("4 components read");
  await expect(importing.getByLabel("Title")).toHaveValue("Shared unit image 1.1");
  await importing.getByRole("button", { name: "Import SBOM", exact: true }).click();
  await expect(toast("SBOM imported")).toContainText("It now stands for version 1.");
  await expect(page.getByRole("heading", { name: "Shared unit image 1.1" })).toBeVisible();
  await expect(components.locator("tbody tr").filter({ hasText: "busybox" })).toHaveCount(1);
  console.log("PASS Import SBOM reads a CycloneDX file and its components stand");

  // ——— Versions: the versions and what version 2 changes ————————————————————————————————————
  await page.goto(`${origin}${componentTab(second, "versions")}`);
  const versions = page.getByRole("table", { name: "Versions of this component", exact: true });
  await expect(versions.locator("tbody tr")).toHaveCount(2);
  await expect(versions.locator("tbody tr").first()).toContainText("Version 2");
  await expect(page.getByRole("heading", { name: "What version 2 changes" })).toBeVisible();
  await expect(page.getByText("The unit carries OpenSSH server 9.8p1")).toBeVisible();
  const affected = page.getByRole("table", { name: "Affected controls", exact: true });
  await expect(affected.locator("tbody tr")).toHaveCount(1);
  await expect(affected).toContainText(a.controls.code);
  console.log("PASS Versions lists both versions and the control version 2's change affects");

  assert.deepEqual(errors, [], "Browser has no uncaught errors or native dialogs");
} catch (error) {
  if (page) {
    console.error((await page.locator("body").innerText()).slice(-6000));
    const shot = join(screenshots, "component-work-failure.png");
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
    console.error(`Failure screenshot: ${shot}`);
  }
  throw error;
} finally {
  await browser?.close();
  await workspace.cleanup();
}
