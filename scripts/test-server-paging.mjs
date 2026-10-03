#!/usr/bin/env node
/**
 * Server-paged registers: the catalog's CCIs and Controls, a program's Requirements tab, the risk
 * register, operational issues, assessment findings, evidence and My work read one page at a time
 * from the server, which pages, sorts (a derived column too), filters, searches and counts the whole
 * result; the question lives in the address, where the Portfolio's tiles ask it; saved views count
 * the whole register; and a preview counts the whole result and steps across a page edge. Every
 * register's records are seeded in the run's own disposable workspace.
 */
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { expect as playwrightExpect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";
import { expectPreviewHeader } from "./tests/preview-header.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const expect = playwrightExpect.configure({ timeout: 30000 });
const workspace = await localWorkspace("server-paging");
const screenshots =
  process.env.PATTERN_ARTIFACT_DIR || (await mkdtemp(join(tmpdir(), "server-paging-")));
await mkdir(screenshots, { recursive: true });
const errors = [];
let browser;
let page;
const PAGE = 25;
const number = (value) => value.toLocaleString("en-US");

async function data(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
async function count(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.count;
}
const panel = () => page.locator('[data-shell-area="panel"]');
const header = () => panel().locator('[data-slot="shell-panel-header"]');
const status = () => header().locator('[data-slot="preview-navigation"] [role="status"]');
const step = (name) => header().getByRole("button", { name, exact: true });
const rows = (table) => table.locator("tbody tr[data-row-id]");
const rowIds = (table) =>
  rows(table).evaluateAll((elements) => elements.map((row) => row.getAttribute("data-row-id")));
const rowHeaders = (table) =>
  table
    .locator("tbody tr[data-row-id] th")
    .evaluateAll((cells) => cells.map((cell) => cell.textContent?.trim()));
const pager = (label) => page.getByRole("navigation", { name: `${label} pagination` });
/** The table's own result line: "26–50 of 5,100". */
const range = (label) => pager(label).locator("xpath=..");
const question = () => new URL(page.url()).searchParams;
const eye = (table, id) =>
  table.locator(`tbody tr[data-row-id="${id}"]`).getByRole("button", { name: /^Preview / });
/** Every read of a register's source asks for one page: a limit no larger than the page. A count
 * alone (a saved view's) is a HEAD request with no rows, kept apart. */
const reads = [];
const counts = [];
function expectPagedReads(source) {
  const own = reads.filter((url) => url.pathname.endsWith(`/rest/v1/${source}`));
  assert.ok(own.length > 0, `${source} was read`);
  for (const url of own) {
    const limit = Number(url.searchParams.get("limit"));
    assert.ok(limit > 0 && limit <= PAGE, `${source} reads one page at a time: ${url.search}`);
  }
}
/** A register reached with no question asks the one this tab last asked: start from none. */
async function fresh(path) {
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(`${origin}${path}`);
}
/** Escape ends the preview; a tooltip open on the focused control takes the first press. */
async function escapePreview() {
  await expect
    .poll(
      async () => {
        if (await panel().count()) await page.keyboard.press("Escape");
        return panel().count();
      },
      { intervals: [300], message: "Escape closes the whole preview" },
    )
    .toBe(0);
}

try {
  const client = workspace.client;
  // The reference data the disposable workspace reads: shared rows, counted as the server counts.
  const cciTotal = await count(
    client.from("cci_item_rows").select("id", { count: "exact", head: true }),
  );
  assert.ok(cciTotal > 2 * PAGE, "The pinned CCI release fills several pages");
  const ccis = await data(
    client
      .from("cci_item_rows")
      .select("id,code")
      .order("code")
      .order("id")
      .range(0, 2 * PAGE - 1),
  );
  const lastCci = await data(
    client.from("cci_item_rows").select("id,code").order("code", { ascending: false }).limit(1),
  );
  const technical = await count(
    client
      .from("cci_item_rows")
      .select("id", { count: "exact", head: true })
      .overlaps("types", ["technical"]),
  );
  const searchTerm = "AC-2(1";
  const searched = await count(
    client
      .from("cci_item_rows")
      .select("id", { count: "exact", head: true })
      .or(
        `code.ilike."*${searchTerm}*",definition.ilike."*${searchTerm}*",controls.ilike."*${searchTerm}*"`,
      ),
  );
  assert.ok(searched > 0 && searched < cciTotal, `The search "${searchTerm}" narrows the CCIs`);
  const edition = await data(
    client
      .from("catalog_revisions")
      .select("id")
      .eq("state", "published")
      .order("version", { ascending: false })
      .limit(1)
      .single(),
  );
  const controls = await data(
    client
      .from("catalog_control_rows")
      .select("id,code,title")
      .eq("catalog_revision_id", edition.id)
      .order("code_order")
      .order("id")
      .range(0, 2 * PAGE - 1),
  );
  const controlTotal = await count(
    client
      .from("catalog_control_rows")
      .select("id", { count: "exact", head: true })
      .eq("catalog_revision_id", edition.id),
  );
  const unselected = await count(
    client
      .from("catalog_control_rows")
      .select("id", { count: "exact", head: true })
      .eq("catalog_revision_id", edition.id)
      .eq("selected_by", "{}"),
  );

  // ——— A program with more than a page of requirements and of risks, in this run's workspace ———
  const insert = (table, values) =>
    data(
      client
        .from(table)
        .insert(
          Array.isArray(values)
            ? values.map((value) => ({ tenant_id: workspace.tenantId, ...value }))
            : { tenant_id: workspace.tenantId, ...values },
        )
        .select(),
    );
  const [program] = await insert("programs", { code: "PAGING", name: "Server paging program" });
  const owners = await insert("parties", [
    { party_type: "person", name: "Avery Paging" },
    { party_type: "person", name: "Morgan Paging" },
  ]);
  const [securityProcess] = await insert("security_processes", {
    program_id: program.id,
    code: "PAGING-PROC",
    name: "Paging process",
  });
  // REQ-001 to REQ-030, and five parts of REQ-022 (REQ-022.1 to REQ-022.5): read top-down, the
  // first page ends inside REQ-022's tree, at its third part.
  const codes = [
    ...Array.from({ length: 30 }, (_, index) => `REQ-${String(index + 1).padStart(3, "0")}`),
    ...Array.from({ length: 5 }, (_, index) => `REQ-022.${index + 1}`),
  ];
  const identities = await insert(
    "engineering_requirements",
    codes.map((code) => ({ program_id: program.id, code })),
  );
  const revisions = await insert(
    "requirement_revisions",
    identities.map((identity, index) => ({
      engineering_requirement_id: identity.id,
      version_number: 1,
      title: `Paging requirement ${identity.code}`,
      statement: `${identity.code} shall be read a page at a time.`,
      acceptance_criteria: "The register pages on the server.",
      requirement_type: "functional",
      // Every third requirement has no owner; the rest are Avery's or Morgan's in turn.
      owner_party_id: index % 3 === 2 ? null : owners[index % 2].id,
    })),
  );
  const revisionOf = new Map(revisions.map((row) => [row.engineering_requirement_id, row]));
  const byCode = new Map(identities.map((row) => [row.code, row]));
  await insert(
    "requirement_decompositions",
    codes
      .filter((code) => code.startsWith("REQ-022."))
      .map((code) => ({
        parent_requirement_revision_id: revisionOf.get(byCode.get("REQ-022").id).id,
        child_requirement_revision_id: revisionOf.get(byCode.get(code).id).id,
      })),
  );
  // Every even-numbered requirement is allocated to the process; the rest are not.
  await insert(
    "requirement_allocations",
    identities
      .filter((identity) => Number(identity.code.slice(4, 7)) % 2 === 0)
      .map((identity) => ({
        requirement_revision_id: revisionOf.get(identity.id).id,
        security_process_id: securityProcess.id,
      })),
  );
  const requirementRows = (query) =>
    query.from("program_requirement_rows").select("id,code,title,allocation,owner_name");
  const requirementOrder = await data(
    requirementRows(client).eq("program_id", program.id).order("tree_order").order("id"),
  );
  assert.equal(requirementOrder.length, codes.length);
  assert.equal(requirementOrder[PAGE - 1].code, "REQ-022.3", "The first page ends inside a tree");
  const unallocated = requirementOrder.filter((row) => row.allocation === "Unallocated").length;
  const byOwner = await data(
    requirementRows(client)
      .eq("program_id", program.id)
      .order("owner_name", { ascending: true, nullsFirst: false })
      .order("id"),
  );
  // Thirty risks, the first twenty-six assessed; the first one twice, its latest critical.
  const levels = ["low", "moderate", "high", "critical"];
  const risks = await insert(
    "risks",
    Array.from({ length: 30 }, (_, index) => ({
      program_id: program.id,
      title: `Paging risk ${String(index + 1).padStart(2, "0")}`,
    })),
  );
  await insert("risk_revisions", [
    ...risks.slice(0, 26).map((risk, index) => ({
      risk_id: risk.id,
      version_number: 1,
      severity: levels[index % 4],
      likelihood: "moderate",
      impact: "high",
    })),
    {
      risk_id: risks[0].id,
      version_number: 2,
      severity: "critical",
      likelihood: "high",
      impact: "very_high",
    },
  ]);
  const riskTotal = risks.length;
  const bySeverity = await data(
    client
      .from("risk_rows")
      .select("id,title,severity")
      .order("severity_rank", { ascending: true, nullsFirst: false })
      .order("id"),
  );
  assert.equal(bySeverity.length, riskTotal);
  assert.equal(bySeverity.at(-1).severity, null, "Unassessed risks sort last");
  const critical = bySeverity.filter((row) => row.severity === "critical").length;
  assert.equal(
    bySeverity.find((row) => row.id === risks[0].id).severity,
    "critical",
    "A risk's severity is its latest assessment's",
  );

  // ——— Operational issues, assessment findings, evidence and tasks: more than a page each ———
  const severities = ["low", "moderate", "high", "critical"];
  const issueStatuses = ["open", "triaged", "in_progress", "resolved", "closed"];
  // Fifty issues, thirty of them open, triaged or in progress: the Portfolio's open issues.
  const issues = await insert(
    "operational_issues",
    Array.from({ length: 50 }, (_, index) => ({
      program_id: program.id,
      title: `Paging issue ${String(index + 1).padStart(2, "0")}`,
      status: issueStatuses[index % 5],
      severity: severities[index % 4],
    })),
  );
  const openIssues = issues.filter((issue) =>
    ["open", "triaged", "in_progress"].includes(issue.status),
  ).length;
  assert.ok(openIssues > PAGE, "The open issues fill more than a page");
  // Sixty findings in one assessment's results, thirty of them short of satisfied.
  const resolution = await data(
    client
      .from("profile_resolutions")
      .select("id")
      .is("tenant_id", null)
      .eq("state", "published")
      .limit(1)
      .single(),
  );
  const selection = await data(
    client
      .from("selected_controls")
      .select("id,control_id")
      .eq("profile_resolution_id", resolution.id)
      .order("ordinal")
      .limit(1)
      .single(),
  );
  const part = await data(
    client
      .from("control_parts")
      .select("id")
      .eq("control_id", selection.control_id)
      .limit(1)
      .single(),
  );
  const publish = async (table, row) =>
    (
      await data(
        client
          .from(table)
          .update({
            state: "published",
            published_at: new Date().toISOString(),
            revision: row.revision + 1,
          })
          .eq("id", row.id)
          .select(),
      )
    )[0];
  const [system] = await insert("systems", {
    program_id: program.id,
    code: "PAGING-SYS",
    name: "Paging system",
    system_type: "information_system",
  });
  const [ssp] = await insert("ssp_revisions", {
    system_id: system.id,
    profile_resolution_id: resolution.id,
    version_number: 1,
  });
  await insert("implemented_requirements", {
    ssp_revision_id: ssp.id,
    selected_control_id: selection.id,
    description: "Paging implementation narrative.",
  });
  await publish("ssp_revisions", ssp);
  const [campaign] = await insert("assessment_campaigns", {
    program_id: program.id,
    title: "Paging campaign",
  });
  const [plan] = await insert("assessment_plan_revisions", {
    campaign_id: campaign.id,
    ssp_revision_id: ssp.id,
    version_number: 1,
    title: "Paging plan",
  });
  await publish("assessment_plan_revisions", plan);
  const [results] = await insert("assessment_results_revisions", {
    assessment_plan_revision_id: plan.id,
    version_number: 1,
    title: "Paging results",
  });
  const [resultSet] = await insert("result_sets", {
    assessment_results_revision_id: results.id,
    title: "Paging result set",
  });
  const determinationOrder = [
    "satisfied",
    "partially_satisfied",
    "other_than_satisfied",
    "not_assessed",
  ];
  const findings = await insert(
    "assessment_findings",
    Array.from({ length: 60 }, (_, index) => ({
      assessment_results_revision_id: results.id,
      result_set_id: resultSet.id,
      target_control_part_id: part.id,
      title: `Paging finding ${String(index + 1).padStart(2, "0")}`,
      determination: determinationOrder[index % 4],
    })),
  );
  const unsatisfied = findings.filter((finding) =>
    ["partially_satisfied", "other_than_satisfied"].includes(finding.determination),
  ).length;
  assert.ok(unsatisfied > PAGE, "The unsatisfied findings fill more than a page");
  // Thirty artifacts of three kinds, the first twenty-seven with a version; of those, five
  // accepted and five sent back for revision.
  const kinds = ["document", "dataset", "log"];
  const artifacts = await insert(
    "evidence_artifacts",
    Array.from({ length: 30 }, (_, index) => ({
      program_id: program.id,
      title: `Paging evidence ${String(index + 1).padStart(2, "0")}`,
      artifact_kind: kinds[index % 3],
    })),
  );
  const versions = await insert(
    "evidence_versions",
    artifacts.slice(0, 27).map((artifact, index) => ({
      artifact_id: artifact.id,
      version_number: 1,
      collected_at: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
      external_uri: `https://example.test/paging/${index + 1}`,
    })),
  );
  await insert(
    "evidence_reviews",
    versions.slice(0, 10).map((version, index) => ({
      evidence_version_id: version.id,
      reviewer_party_id: owners[1].id,
      decision: index < 5 ? "accepted" : "needs_revision",
      rationale: "Reviewed for the paging suite.",
      reviewed_at: new Date().toISOString(),
    })),
  );
  const datasets = artifacts.filter((artifact) => artifact.artifact_kind === "dataset").length;
  const byReview = await data(
    client
      .from("evidence_artifact_rows")
      .select("id,review")
      .order("review_rank", { ascending: true, nullsFirst: false })
      .order("id"),
  );
  assert.equal(byReview.length, artifacts.length);
  // Thirty tasks: the reader holds the first twenty-eight, Avery also the first three, and the
  // last two nobody holds.
  const reader = await data(
    client.from("parties").select("id,name").eq("auth_user_id", workspace.userId).single(),
  );
  const tasks = await insert(
    "tasks",
    Array.from({ length: 30 }, (_, index) => ({
      program_id: program.id,
      title: `Paging task ${String(index + 1).padStart(2, "0")}`,
    })),
  );
  await insert("task_assignments", [
    ...tasks.slice(0, 28).map((task) => ({
      task_id: task.id,
      party_id: reader.id,
      assignment_role: "responsible",
    })),
    ...tasks.slice(0, 3).map((task) => ({
      task_id: task.id,
      party_id: owners[0].id,
      assignment_role: "accountable",
    })),
  ]);

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  context.setDefaultTimeout(30000);
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => {
    errors.push(`Unexpected native ${dialog.type()} dialog: ${dialog.message()}`);
    void dialog.dismiss();
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!url.pathname.includes("/rest/v1/")) return;
    (request.method() === "HEAD" ? counts : reads).push(url);
  });
  await page.goto(`${origin}/catalog?tab=CCIs`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  // ——— The CCIs: one page, the whole count ———————————————————————————————————————————————
  const cciLabel = "Control correlation identifiers";
  const cciTable = page.getByRole("table", { name: cciLabel, exact: true });
  await expect(rows(cciTable)).toHaveCount(PAGE);
  await expect(range(cciLabel)).toContainText(`1–${PAGE} of ${number(cciTotal)}`);
  assert.deepEqual(
    await rowIds(cciTable),
    ccis.slice(0, PAGE).map((row) => row.id),
  );
  expectPagedReads("cci_item_rows");
  assert.equal(
    reads.filter((url) =>
      /\/rest\/v1\/(cci_items|cci_references|cci_control_links)$/.test(url.pathname),
    ).length,
    0,
    "The register reads its view, not the tables behind it",
  );
  console.log(`PASS CCIs read one page of ${PAGE} with the whole count (${cciTotal})`);

  await pager(cciLabel).getByRole("button", { name: "Next page", exact: true }).click();
  await expect
    .poll(() => rowIds(cciTable))
    .toEqual(ccis.slice(PAGE, 2 * PAGE).map((row) => row.id));
  await expect(range(cciLabel)).toContainText(`${PAGE + 1}–${2 * PAGE} of ${number(cciTotal)}`);
  await expect.poll(() => question().get("live-catalog-ccis.page")).toBe("2");
  expectPagedReads("cci_item_rows");
  console.log("PASS CCIs turn to the next page from the server, and the address keeps the page");

  // A sort is the server's, over every row, and starts again from the first page.
  const codeHeader = cciTable.getByRole("columnheader").filter({
    has: page.getByRole("button", { name: "CCI", exact: true }),
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    if ((await codeHeader.getAttribute("aria-sort")) === "descending") break;
    await codeHeader.getByRole("button", { name: "CCI", exact: true }).click();
    await page.waitForTimeout(300);
  }
  await expect(codeHeader).toHaveAttribute("aria-sort", "descending");
  await expect.poll(async () => (await rowHeaders(cciTable))[0]).toBe(lastCci[0].code);
  await expect.poll(() => question().get("live-catalog-ccis.sort")).toBe("-code");
  await expect.poll(() => question().get("live-catalog-ccis.page")).toBeNull();
  console.log("PASS CCIs sort on the server across every page and return to the first page");

  // A filter is the server's: its count is the whole result's.
  await fresh("/catalog?tab=CCIs");
  await expect(rows(cciTable)).toHaveCount(PAGE);
  await page.getByRole("button", { name: /^Type/ }).first().click();
  await page.getByRole("checkbox", { name: "Technical", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(range(cciLabel)).toContainText(`of ${number(technical)}`);
  const types = await cciTable
    .locator("tbody tr[data-row-id]")
    .evaluateAll((elements) => elements.map((row) => row.textContent ?? ""));
  assert.ok(
    types.every((text) => text.includes("Technical")),
    "Every row is a technical CCI",
  );
  await expect.poll(() => question().get("live-catalog-ccis.filters")).toContain("technical");
  console.log(`PASS CCIs filter by type on the server (${technical} technical)`);

  // The search is the server's, over the code, the definition and the mapped controls.
  await fresh("/catalog?tab=CCIs");
  await expect(rows(cciTable)).toHaveCount(PAGE);
  await page.getByPlaceholder("Find a CCI").fill(searchTerm);
  await expect(searched > PAGE ? range(cciLabel) : page.locator("body")).toContainText(
    searched > PAGE ? `of ${number(searched)}` : "",
  );
  await expect(rows(cciTable)).toHaveCount(Math.min(searched, PAGE));
  await expect.poll(() => question().get("live-catalog-ccis.q")).toBe(searchTerm);
  // A reload asks the address's question again, in the first read.
  const before = reads.length;
  await page.reload();
  await expect(rows(cciTable)).toHaveCount(Math.min(searched, PAGE));
  await expect(page.getByPlaceholder("Find a CCI")).toHaveValue(searchTerm);
  const reloaded = reads.slice(before).filter((url) => url.pathname.endsWith("/cci_item_rows"));
  assert.ok(reloaded.length >= 1, "The reload reads the CCIs");
  assert.ok(
    reloaded.every((url) => url.searchParams.getAll("or").some((tree) => tree.includes("ilike"))),
    "Every read after the reload already asks the address's search",
  );
  console.log(
    `PASS CCIs search on the server (${searched} for "${searchTerm}") and a reload asks it again`,
  );

  // Nothing found is the filtered empty, whose Clear filters asks the whole register again.
  await page.getByPlaceholder("Find a CCI").fill("no-such-cci-anywhere");
  const filteredEmpty = page.getByRole("main").locator('[data-slot="empty"]');
  await expect(filteredEmpty).toBeVisible();
  await expect(filteredEmpty).toContainText("Nothing matches");
  await filteredEmpty.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(rows(cciTable)).toHaveCount(PAGE);
  await expect(range(cciLabel)).toContainText(`1–${PAGE} of ${number(cciTotal)}`);
  console.log("PASS CCIs say nothing matches a search, and Clear filters asks every row again");

  // A page that fails to load keeps the page before it under one alert, whose Retry loads it.
  await fresh("/catalog?tab=CCIs");
  await expect(rows(cciTable)).toHaveCount(PAGE);
  const failing = (route) =>
    new URL(route.request().url()).searchParams.get("offset") === String(PAGE)
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ message: "Service unavailable" }),
        })
      : route.fallback();
  await page.route("**/rest/v1/cci_item_rows*", failing);
  await pager(cciLabel).getByRole("button", { name: "Next page", exact: true }).click();
  const alert = page.getByRole("main").getByRole("alert");
  await expect(alert).toBeVisible();
  await expect(rows(cciTable)).toHaveCount(PAGE);
  assert.deepEqual(
    await rowIds(cciTable),
    ccis.slice(0, PAGE).map((row) => row.id),
    "The page before the failure stays on screen",
  );
  await page.unroute("**/rest/v1/cci_item_rows*", failing);
  await alert.getByRole("button", { name: "Retry loading", exact: true }).click();
  await expect(alert).toHaveCount(0);
  await expect
    .poll(() => rowIds(cciTable))
    .toEqual(ccis.slice(PAGE, 2 * PAGE).map((row) => row.id));
  console.log("PASS a CCI page that fails keeps the last page under one alert, and Retry loads it");

  // ——— A preview counts the whole result and steps across the page edge ————————————————
  await fresh("/catalog?tab=CCIs");
  await expect(rows(cciTable)).toHaveCount(PAGE);
  const lastOnPage = ccis[PAGE - 1];
  const firstOnNext = ccis[PAGE];
  await eye(cciTable, lastOnPage.id).click();
  await expectPreviewHeader(page, { title: lastOnPage.code });
  await expect(status()).toHaveText(`${lastOnPage.code}, ${PAGE} of ${number(cciTotal)} records`);
  await step("Next record").click();
  await expect(panel().getByRole("heading", { name: firstOnNext.code, exact: true })).toBeVisible();
  await expect(status()).toHaveText(
    `${firstOnNext.code}, ${PAGE + 1} of ${number(cciTotal)} records`,
  );
  await expect.poll(() => question().get("live-catalog-ccis.page")).toBe("2");
  await expect(range(cciLabel)).toContainText(`${PAGE + 1}–${2 * PAGE} of ${number(cciTotal)}`);
  await expect(eye(cciTable, firstOnNext.id)).toHaveAttribute("aria-pressed", "true");
  await expect(step("Next record")).toBeFocused();
  await step("Previous record").click();
  await expect(panel().getByRole("heading", { name: lastOnPage.code, exact: true })).toBeVisible();
  await expect(status()).toHaveText(`${lastOnPage.code}, ${PAGE} of ${number(cciTotal)} records`);
  await expect.poll(() => question().get("live-catalog-ccis.page")).toBeNull();
  await expect(eye(cciTable, lastOnPage.id)).toHaveAttribute("aria-pressed", "true");
  await expect(step("Previous record")).toBeFocused();
  await escapePreview();
  console.log("PASS CCI preview counts the whole result and steps across the page edge both ways");

  // The last record of the result is the end: the server's count, not the page's.
  const lastPage = Math.ceil(cciTotal / PAGE);
  await fresh(`/catalog?tab=CCIs&live-catalog-ccis.page=${lastPage}`);
  await expect(range(cciLabel)).toContainText(`of ${number(cciTotal)}`);
  await expect(rows(cciTable)).toHaveCount(cciTotal - (lastPage - 1) * PAGE);
  await eye(cciTable, lastCci[0].id).click();
  await expect(status()).toHaveText(
    `${lastCci[0].code}, ${number(cciTotal)} of ${number(cciTotal)} records`,
  );
  await expect(step("Next record")).toHaveAttribute("aria-disabled", "true");
  await escapePreview();
  console.log("PASS CCI preview ends at the server's count");

  // Turning the page by hand leaves the preview where it is; its next step brings its row back.
  await fresh("/catalog?tab=CCIs");
  await expect(rows(cciTable)).toHaveCount(PAGE);
  await eye(cciTable, ccis[2].id).click();
  await expect(status()).toHaveText(`${ccis[2].code}, 3 of ${number(cciTotal)} records`);
  await pager(cciLabel).getByRole("button", { name: "Next page", exact: true }).click();
  await expect
    .poll(() => rowIds(cciTable))
    .toEqual(ccis.slice(PAGE, 2 * PAGE).map((row) => row.id));
  await expect(panel().getByRole("heading", { name: ccis[2].code, exact: true })).toBeVisible();
  await expect(status()).toHaveText(`${ccis[2].code}, 3 of ${number(cciTotal)} records`);
  await step("Next record").click();
  await expect(status()).toHaveText(`${ccis[3].code}, 4 of ${number(cciTotal)} records`);
  await expect.poll(() => rowIds(cciTable)).toEqual(ccis.slice(0, PAGE).map((row) => row.id));
  await expect(eye(cciTable, ccis[3].id)).toHaveAttribute("aria-pressed", "true");
  await escapePreview();
  console.log("PASS a page turned by hand keeps the preview's place, and its step turns back");

  // ——— The Controls: reading order, a derived filter, and the same preview rule —————————————
  const controlLabel = "Catalog controls";
  await fresh(`/catalog?edition=${edition.id}`);
  const controlTable = page.getByRole("table", { name: controlLabel, exact: true });
  await expect(rows(controlTable)).toHaveCount(Math.min(PAGE, controlTotal));
  // AC-2 before AC-10, AC-2(1) right after AC-2: the server's reading order.
  assert.deepEqual(
    await rowIds(controlTable),
    controls.slice(0, PAGE).map((row) => row.id),
  );
  await expect(range(controlLabel)).toContainText(`of ${number(controlTotal)}`);
  expectPagedReads("catalog_control_rows");
  assert.equal(
    reads.filter((url) => /\/rest\/v1\/(controls|selected_controls)$/.test(url.pathname)).length,
    0,
    "The Controls register reads its view, not the controls and their selections",
  );
  console.log(
    `PASS Controls read one page in reading order with the whole count (${controlTotal})`,
  );

  await page
    .getByRole("button", { name: /^Selected by/ })
    .first()
    .click();
  await page.getByRole("checkbox", { name: "No published profile", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(range(controlLabel)).toContainText(`of ${number(unselected)}`);
  await expect(controlTable.locator("tbody tr[data-row-id]").first()).toContainText(
    "No published profile",
  );
  console.log(`PASS Controls filter by a derived column on the server (${unselected} unselected)`);

  await fresh(`/catalog?edition=${edition.id}`);
  await expect(rows(controlTable)).toHaveCount(Math.min(PAGE, controlTotal));
  if (controlTotal > PAGE) {
    await eye(controlTable, controls[PAGE - 1].id).click();
    await expect(status()).toHaveText(
      `${controls[PAGE - 1].title}, ${PAGE} of ${number(controlTotal)} records`,
    );
    await step("Next record").click();
    await expect(status()).toHaveText(
      `${controls[PAGE].title}, ${PAGE + 1} of ${number(controlTotal)} records`,
    );
    await expect(eye(controlTable, controls[PAGE].id)).toHaveAttribute("aria-pressed", "true");
    await escapePreview();
    console.log("PASS Control preview steps across the page edge");
  }

  // ——— A program's Requirements: the tree top-down, a page at a time —————————————————————
  const requirementLabel = "Engineering requirements";
  const requirementsPath = `/programs/${program.id}?tab=Requirements`;
  const requirementTable = page.getByRole("treegrid", { name: requirementLabel, exact: true });
  const requirementIds = requirementOrder.map((row) => row.id);
  const requirementQuestion = "live-requirements-workspace";
  reads.length = 0;
  await fresh(requirementsPath);
  await expect(rows(requirementTable)).toHaveCount(PAGE);
  await expect(range(requirementLabel)).toContainText(`1–${PAGE} of ${number(codes.length)}`);
  assert.deepEqual(await rowIds(requirementTable), requirementIds.slice(0, PAGE));
  expectPagedReads("program_requirement_rows");
  assert.equal(
    reads.filter((url) =>
      /\/rest\/v1\/(requirement_revisions|requirement_allocations|requirement_control_links|requirement_decompositions|controls|control_parts)$/.test(
        url.pathname,
      ),
    ).length,
    0,
    "The tab reads its view, not the tables behind it",
  );
  // REQ-022's parts nest under it; the saved views count the whole register, not the page.
  const parent = requirementTable.locator(`tr[data-row-id="${byCode.get("REQ-022").id}"]`);
  await expect(parent).toHaveAttribute("aria-expanded", "true");
  await expect(
    requirementTable.locator(`tr[data-row-id="${byCode.get("REQ-022.1").id}"]`),
  ).toHaveAttribute("aria-level", "2");
  await expect(page.getByRole("button", { name: /^All requirements/ })).toContainText(
    number(codes.length),
  );
  console.log(
    `PASS Requirements read one page of the tree top-down with the whole count (${codes.length})`,
  );

  // The next page carries on inside REQ-022's tree: its remaining parts lead it, on their own.
  await pager(requirementLabel).getByRole("button", { name: "Next page", exact: true }).click();
  await expect.poll(() => rowIds(requirementTable)).toEqual(requirementIds.slice(PAGE));
  await expect(
    requirementTable.locator(`tr[data-row-id="${byCode.get("REQ-022.4").id}"]`),
  ).toHaveAttribute("aria-level", "1");
  await expect.poll(() => question().get(`${requirementQuestion}.page`)).toBe("2");
  console.log("PASS Requirements turn to the next page, which carries on inside a tree");

  // The preview counts the whole result and steps from the first page's last part to the next.
  await fresh(requirementsPath);
  await expect(rows(requirementTable)).toHaveCount(PAGE);
  const edge = requirementOrder[PAGE - 1];
  const beyond = requirementOrder[PAGE];
  await eye(requirementTable, edge.id).click();
  await expect(status()).toHaveText(`${edge.title}, ${PAGE} of ${codes.length} records`);
  await step("Next record").click();
  await expect(status()).toHaveText(`${beyond.title}, ${PAGE + 1} of ${codes.length} records`);
  await expect.poll(() => question().get("requirementId")).toBe(beyond.id);
  await expect.poll(() => question().get(`${requirementQuestion}.page`)).toBe("2");
  await expect(eye(requirementTable, beyond.id)).toHaveAttribute("aria-pressed", "true");
  await expect(step("Next record")).toBeFocused();
  await step("Previous record").click();
  await expect(status()).toHaveText(`${edge.title}, ${PAGE} of ${codes.length} records`);
  await expect.poll(() => question().get(`${requirementQuestion}.page`)).toBeNull();
  await escapePreview();
  console.log("PASS Requirement preview steps across the page edge, inside a tree, both ways");

  // A filter on a derived state is the server's: its count is the whole result's.
  await fresh(requirementsPath);
  await expect(rows(requirementTable)).toHaveCount(PAGE);
  await page
    .getByRole("button", { name: /^Allocation/ })
    .first()
    .click();
  await page.getByRole("checkbox", { name: "Unallocated", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(range(requirementLabel)).toContainText(`of ${number(unallocated)}`);
  const allocations = await rows(requirementTable).evaluateAll((elements) =>
    elements.map((row) => row.textContent ?? ""),
  );
  assert.ok(
    allocations.every((text) => text.includes("Unallocated")),
    "Every requirement shown is unallocated",
  );
  await expect
    .poll(() => question().get(`${requirementQuestion}.filters`))
    .toContain("Unallocated");
  console.log(`PASS Requirements filter by allocation on the server (${unallocated} unallocated)`);

  // A sort on a derived column (the owner's name) is the server's, and lists every requirement on
  // its own row, in that order.
  await fresh(`${requirementsPath}&${requirementQuestion}.sort=owner`);
  await expect(rows(requirementTable)).toHaveCount(PAGE);
  assert.deepEqual(
    await rowIds(requirementTable),
    byOwner.slice(0, PAGE).map((row) => row.id),
  );
  assert.equal(
    await requirementTable.locator('tbody tr[data-row-id][aria-level="2"]').count(),
    0,
    "An order the reader chose lists each requirement on its own row",
  );
  console.log("PASS Requirements sort by their owner's name on the server across every page");

  // ——— The risk register: the latest assessment, sorted and filtered on the server —————————
  const riskLabel = "Risks";
  const riskTable = page.getByRole("table", { name: riskLabel, exact: true });
  reads.length = 0;
  await fresh("/risks");
  await expect(rows(riskTable)).toHaveCount(PAGE);
  await expect(range(riskLabel)).toContainText(`1–${PAGE} of ${number(riskTotal)}`);
  expectPagedReads("risk_rows");
  assert.equal(
    reads.filter((url) => /\/rest\/v1\/(risks|risk_revisions)$/.test(url.pathname)).length,
    0,
    "The register reads its view, not the risks and their assessments",
  );
  console.log(`PASS Risks read one page with the whole count (${riskTotal})`);

  // Latest severity is derived from each risk's latest assessment; its sort is the server's, by
  // the severity's rank, with the risks no one has assessed last.
  const severityHeader = riskTable.getByRole("columnheader").filter({
    has: page.getByRole("button", { name: "Latest severity", exact: true }),
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    if ((await severityHeader.getAttribute("aria-sort")) === "ascending") break;
    await severityHeader.getByRole("button", { name: "Latest severity", exact: true }).click();
    await page.waitForTimeout(300);
  }
  await expect(severityHeader).toHaveAttribute("aria-sort", "ascending");
  await expect.poll(() => rowIds(riskTable)).toEqual(bySeverity.slice(0, PAGE).map((r) => r.id));
  await expect.poll(() => question().get("risk-register.sort")).toBe("severity");
  await pager(riskLabel).getByRole("button", { name: "Next page", exact: true }).click();
  await expect.poll(() => rowIds(riskTable)).toEqual(bySeverity.slice(PAGE).map((r) => r.id));
  console.log("PASS Risks sort by their latest severity on the server across every page");

  // A severity filter counts the whole register.
  await fresh("/risks");
  await expect(rows(riskTable)).toHaveCount(PAGE);
  await page
    .getByRole("button", { name: /^Latest severity/ })
    .first()
    .click();
  await page.getByRole("checkbox", { name: "Critical", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(rows(riskTable)).toHaveCount(critical);
  await expect.poll(() => question().get("risk-register.filters")).toContain("critical");
  console.log(`PASS Risks filter by their latest severity on the server (${critical} critical)`);

  // The preview steps from the first page's last risk to the next page's first.
  await fresh("/risks");
  await expect(rows(riskTable)).toHaveCount(PAGE);
  const shown = await rowIds(riskTable);
  const titleOf = new Map(risks.map((risk) => [risk.id, risk.title]));
  await eye(riskTable, shown[PAGE - 1]).click();
  await expect(status()).toHaveText(
    `${titleOf.get(shown[PAGE - 1])}, ${PAGE} of ${riskTotal} records`,
  );
  await step("Next record").click();
  await expect(status()).toContainText(`, ${PAGE + 1} of ${riskTotal} records`);
  await expect.poll(() => question().get("risk-register.page")).toBe("2");
  await expect(step("Next record")).toBeFocused();
  await step("Previous record").click();
  await expect(status()).toHaveText(
    `${titleOf.get(shown[PAGE - 1])}, ${PAGE} of ${riskTotal} records`,
  );
  await escapePreview();
  console.log("PASS Risk preview counts the whole register and steps across the page edge");

  // Export writes every risk of the result, not the page.
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Collection actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Export risks", exact: true }).click();
  const exported = JSON.parse(await readFile(await (await download).path(), "utf8"));
  assert.equal(exported.length, riskTotal, "The export holds the whole result");
  console.log(`PASS Export writes every risk of the result (${riskTotal})`);

  /** Sorts a column by its header's button until it reads `direction`. */
  async function sortBy(table, label, direction) {
    const columnHeader = table.getByRole("columnheader").filter({
      has: page.getByRole("button", { name: label, exact: true }),
    });
    for (let attempt = 0; attempt < 3; attempt++) {
      if ((await columnHeader.getAttribute("aria-sort")) === direction) break;
      await columnHeader.getByRole("button", { name: label, exact: true }).click();
      await page.waitForTimeout(300);
    }
    await expect(columnHeader).toHaveAttribute("aria-sort", direction);
  }
  /** No read of the tables a register's view is drawn from. */
  function expectNoBaseReads(tables, message) {
    const pattern = new RegExp(`/rest/v1/(${tables.join("|")})$`);
    assert.equal(reads.filter((url) => pattern.test(url.pathname)).length, 0, message);
  }

  // ——— Operational issues: the Portfolio's tile asks the register's question of the server ————
  const issueLabel = "Operational issues";
  const issueTable = page.getByRole("table", { name: issueLabel, exact: true });
  await fresh("/");
  await page.getByRole("link", { name: /^Open operational issues/ }).click();
  await expect(range(issueLabel)).toContainText(`1–${PAGE} of ${number(openIssues)}`);
  await expect(rows(issueTable)).toHaveCount(PAGE);
  await expect.poll(() => question().get("operational-issues.filters")).toContain("triaged");
  reads.length = 0;
  await page.reload();
  await expect(range(issueLabel)).toContainText(`1–${PAGE} of ${number(openIssues)}`);
  expectPagedReads("operational_issue_rows");
  // The other tabs' registers read nothing until their tab is first shown.
  assert.equal(
    reads.filter((url) =>
      /\/rest\/v1\/(assessment_finding_rows|observations|inventory_items)$/.test(url.pathname),
    ).length,
    0,
    "The hidden tabs' registers read nothing",
  );
  expectNoBaseReads(
    ["operational_issues", "assessment_findings"],
    "The registers read their views, not the issues and findings",
  );
  console.log(`PASS Open operational issues opens one page of the server's ${openIssues}`);

  // The preview counts the tile's whole result and steps across the page edge.
  const issueTitle = new Map(issues.map((issue) => [issue.id, issue.title]));
  const shownIssues = await rowIds(issueTable);
  await eye(issueTable, shownIssues[PAGE - 1]).click();
  await expect(status()).toHaveText(
    `${issueTitle.get(shownIssues[PAGE - 1])}, ${PAGE} of ${openIssues} records`,
  );
  await expectPreviewHeader(page, {
    title: issueTitle.get(shownIssues[PAGE - 1]),
    recordActions: ["Edit operational issue"],
  });
  await step("Next record").click();
  await expect(status()).toContainText(`, ${PAGE + 1} of ${openIssues} records`);
  await expect.poll(() => question().get("operational-issues.page")).toBe("2");
  await expect(step("Next record")).toBeFocused();
  console.log("PASS Operational issue preview steps across the page edge of the tile's result");

  // An edit in the preview moves its record to the top of the newest-first order, onto the first
  // page: the preview counts it there, and its next step turns to that page.
  const movedId = (await rowIds(issueTable))[0];
  await expect(status()).toHaveText(
    `${issueTitle.get(movedId)}, ${PAGE + 1} of ${openIssues} records`,
  );
  await panel().getByRole("button", { name: "Edit operational issue", exact: true }).click();
  const issueDialog = page.getByRole("dialog", { name: "Edit operational issue" });
  const issueTitleField = issueDialog.getByRole("textbox", { name: /^Title/ });
  await issueTitleField.fill(`${issueTitle.get(movedId)} edited`);
  await issueDialog.getByRole("button", { name: "Edit operational issue", exact: true }).click();
  await expect(issueDialog).toHaveCount(0);
  await expect(status()).toHaveText(
    `${issueTitle.get(movedId)} edited, 1 of ${openIssues} records`,
  );
  assert.equal(question().get("operational-issues.page"), "2", "The table stays on its page");
  await step("Next record").click();
  await expect(status()).toContainText(`, 2 of ${openIssues} records`);
  await expect.poll(() => question().get("operational-issues.page")).toBeNull();
  // An edit that takes the record out of the question leaves it outside the results.
  await step("Previous record").click();
  await expect(status()).toHaveText(
    `${issueTitle.get(movedId)} edited, 1 of ${openIssues} records`,
  );
  await panel().getByRole("button", { name: "Edit operational issue", exact: true }).click();
  await issueDialog.getByRole("combobox", { name: /^Status/ }).click();
  await page.getByRole("option", { name: "Closed", exact: true }).click();
  await issueDialog.getByRole("button", { name: "Edit operational issue", exact: true }).click();
  await expect(issueDialog).toHaveCount(0);
  await expect(status()).toHaveText(
    `${issueTitle.get(movedId)} edited, outside the current results`,
  );
  await expect(step("Next record")).toHaveAttribute("aria-disabled", "true");
  console.log(
    "PASS an edit that moves a previewed issue keeps its place in the result, and one that closes it leaves it",
  );

  // A preview belongs to its tab: choosing another tab ends it, and the register comes back as it was.
  await page.getByRole("tab", { name: "Assessment findings", exact: true }).click();
  await expect(panel()).toHaveCount(0);
  await page.getByRole("tab", { name: issueLabel, exact: true }).click();
  await expect(panel()).toHaveCount(0);
  await expect(rows(issueTable)).toHaveCount(PAGE);
  console.log("PASS another Findings tab ends the issue preview");

  // ——— Assessment findings: the Unsatisfied tile, and a sort by determination across pages ————
  const findingLabel = "Assessment findings";
  const findingTable = page.getByRole("table", { name: findingLabel, exact: true });
  const byDetermination = await data(
    client
      .from("assessment_finding_rows")
      .select("id")
      .in("determination", ["partially_satisfied", "other_than_satisfied"])
      .order("determination_rank", { ascending: true, nullsFirst: false })
      .order("id"),
  );
  assert.equal(byDetermination.length, unsatisfied);
  await fresh("/");
  await page.getByRole("link", { name: /^Unsatisfied assessment findings/ }).click();
  await expect(page.getByRole("tab", { name: findingLabel, exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(range(findingLabel)).toContainText(`1–${PAGE} of ${number(unsatisfied)}`);
  await sortBy(findingTable, "Determination", "ascending");
  await expect
    .poll(() => rowIds(findingTable))
    .toEqual(byDetermination.slice(0, PAGE).map((row) => row.id));
  await pager(findingLabel).getByRole("button", { name: "Next page", exact: true }).click();
  await expect
    .poll(() => rowIds(findingTable))
    .toEqual(byDetermination.slice(PAGE).map((row) => row.id));
  await expect.poll(() => question().get("assessment-findings.page")).toBe("2");
  console.log(
    `PASS Unsatisfied assessment findings opens the server's ${unsatisfied}, sorted by rank across pages`,
  );

  // ——— Evidence: saved views counted, a kind filtered and a review sorted on the server ————————
  const evidenceLabel = "Evidence";
  const evidenceTable = page.getByRole("table", { name: evidenceLabel, exact: true });
  reads.length = 0;
  await fresh("/evidence");
  await expect(rows(evidenceTable)).toHaveCount(PAGE);
  await expect(range(evidenceLabel)).toContainText(`1–${PAGE} of ${number(artifacts.length)}`);
  expectPagedReads("evidence_artifact_rows");
  expectNoBaseReads(
    ["evidence_artifacts", "evidence_versions", "evidence_reviews"],
    "The register reads its view, not the artifacts, versions and reviews",
  );
  await page.getByRole("button", { name: /^All evidence/ }).click();
  const needsRevision = page.getByRole("menuitemradio", { name: /^Needs revision/ });
  await expect(needsRevision).toContainText("5");
  await needsRevision.click();
  await expect(rows(evidenceTable)).toHaveCount(5);
  console.log("PASS Evidence reads one page, and its saved views count the whole register");

  await fresh("/evidence");
  await expect(rows(evidenceTable)).toHaveCount(PAGE);
  await page.getByRole("button", { name: /^Kind/ }).first().click();
  await page.getByRole("checkbox", { name: "Dataset", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(rows(evidenceTable)).toHaveCount(datasets);
  await expect.poll(() => question().get("evidence-all.filters")).toContain("dataset");
  console.log(`PASS Evidence filters by kind on the server (${datasets} datasets)`);

  await fresh("/evidence");
  await expect(rows(evidenceTable)).toHaveCount(PAGE);
  await sortBy(evidenceTable, "Latest review", "ascending");
  await expect
    .poll(() => rowIds(evidenceTable))
    .toEqual(byReview.slice(0, PAGE).map((row) => row.id));
  const evidenceTitle = new Map(artifacts.map((artifact) => [artifact.id, artifact.title]));
  const lastArtifact = byReview[PAGE - 1].id;
  await eye(evidenceTable, lastArtifact).click();
  await expect(status()).toHaveText(
    `${evidenceTitle.get(lastArtifact)}, ${PAGE} of ${artifacts.length} records`,
  );
  await step("Next record").click();
  await expect(status()).toHaveText(
    `${evidenceTitle.get(byReview[PAGE].id)}, ${PAGE + 1} of ${artifacts.length} records`,
  );
  await expect.poll(() => question().get("evidence-all.page")).toBe("2");
  await expect(eye(evidenceTable, byReview[PAGE].id)).toHaveAttribute("aria-pressed", "true");
  await escapePreview();
  console.log("PASS Evidence sorts by its latest review on the server, and its preview pages");

  // ——— My work: the reader's tasks, everyone's, nobody's and Avery's, from the server ————————
  const taskLabel = "Tasks";
  const taskTable = page.getByRole("table", { name: taskLabel, exact: true });
  reads.length = 0;
  await fresh("/work");
  await expect(rows(taskTable)).toHaveCount(PAGE);
  await expect(range(taskLabel)).toContainText(`1–${PAGE} of 28`);
  expectPagedReads("task_rows");
  expectNoBaseReads(
    ["tasks", "task_assignments"],
    "The register reads its view, not the tasks and their assignments",
  );
  const views = page.getByRole("button", { name: /^Assigned to you/ });
  await expect(views).toContainText("28");
  await views.click();
  await page.getByRole("menuitemradio", { name: /^All tasks/ }).click();
  await expect(range(taskLabel)).toContainText(`of ${number(tasks.length)}`);
  await page.locator('[data-slot="filter-chip"]').filter({ hasText: "Assigned to" }).click();
  await page.getByRole("checkbox", { name: "Unassigned", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(rows(taskTable)).toHaveCount(2);
  console.log("PASS My work counts the reader's tasks, and finds the unassigned on the server");

  await fresh("/work");
  await expect(rows(taskTable)).toHaveCount(PAGE);
  await page.getByRole("searchbox", { name: "Find tasks", exact: true }).fill("Avery");
  await expect(rows(taskTable)).toHaveCount(3);
  console.log("PASS My work finds a task by a person assigned to it");

  await fresh("/work");
  await expect(rows(taskTable)).toHaveCount(PAGE);
  const shownTasks = await rowIds(taskTable);
  const taskTitle = new Map(tasks.map((task) => [task.id, task.title]));
  await eye(taskTable, shownTasks[PAGE - 1]).click();
  await expect(status()).toHaveText(
    `${taskTitle.get(shownTasks[PAGE - 1])}, ${PAGE} of 28 records`,
  );
  await step("Next record").click();
  await expect(status()).toContainText(`, ${PAGE + 1} of 28 records`);
  await expect.poll(() => question().get("tasks-my-work.page")).toBe("2");
  await expect(step("Next record")).toBeFocused();
  await step("Previous record").click();
  await expect(status()).toHaveText(
    `${taskTitle.get(shownTasks[PAGE - 1])}, ${PAGE} of 28 records`,
  );
  await escapePreview();
  console.log("PASS Task preview counts the reader's tasks and steps across the page edge");

  assert.deepEqual(errors, [], "Browser has no uncaught errors or native dialogs");
  console.log(`Server paging screenshots: ${screenshots}`);
} catch (error) {
  if (page) {
    console.error((await page.locator("body").innerText()).slice(-6000));
    await page
      .screenshot({ path: join(screenshots, "failure.png"), fullPage: true })
      .catch(() => {});
    console.error(`Failure screenshot: ${join(screenshots, "failure.png")}`);
  }
  throw error;
} finally {
  await browser?.close();
  await workspace.cleanup();
}
