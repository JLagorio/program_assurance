/** Read-only demo sizing: stage a local edit, never send it to the database. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import { localDockerEnv } from "./local-docker-env.mjs";

const origin = process.env.APP_TEST_URL ?? "http://localhost:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const status = JSON.parse(
  execFileSync("supabase", ["status", "--output", "json"], {
    env: localDockerEnv(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
assert.equal(new URL(status.API_URL).hostname, "127.0.0.1");
assert.equal(new URL(status.API_URL).port, "54321");
const client = createClient(status.API_URL, status.ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const login = await client.auth.signInWithPassword({
  email: "developer@program-assurance.local",
  password: "local-program-assurance",
});
assert.ifError(login.error);
async function data(query) {
  const response = await query;
  assert.ifError(response.error);
  return response.data;
}
const tenant = await data(
  client.from("tenants").select("id").eq("personal_owner_id", login.data.user.id).single(),
);
const programs = await data(client.from("programs").select("id,code").eq("tenant_id", tenant.id));
const requestedProgram = process.env.WORKBOOK_TEST_PROGRAM_ID;
if (requestedProgram) assert.match(requestedProgram, /^[0-9a-f-]{36}$/);
const program = programs.find((row) =>
  requestedProgram ? row.id === requestedProgram : row.code === "PRG-1090",
);
assert.ok(program, "The expected demo program must already exist");
const snapshot = await data(
  client.rpc("read_assurance_workbook", {
    p_tenant_id: tenant.id,
    p_program_id: program.id,
    p_row_limit: 10000,
  }),
);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.route("**/__workbook_scale_check", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><title>Read-only workbook scale check</title>
        <script type="module">
          import RefreshRuntime from "/@react-refresh";
          RefreshRuntime.injectIntoGlobalHook(window);
          window.$RefreshReg$ = () => {};
          window.$RefreshSig$ = () => type => type;
          window.__vite_plugin_react_preamble_installed__ = true;
        </script>`,
    }),
  );
  await page.goto(`${origin}/__workbook_scale_check`);
  await page.waitForFunction(() => window.__vite_plugin_react_preamble_installed__);
  const result = await page.evaluate(async (baseline) => {
    const { projectWorkbook, proposeWorkbookChanges, workbookDocument } =
      await import("/src/lib/workbook-projection.ts");
    const { applyEdits } = await import("/packages/spreadsheet-core/src/index.ts");
    const { readWorkbenchDraft, writeWorkbenchDraft } =
      await import("/src/components/prototype/use-assurance-workbench.ts");
    const initial = projectWorkbook(baseline);
    const requirement = baseline.requirements.find(
      (record) => record.content_id && record.revision,
    );
    const workbook = applyEdits(initial, "requirements", [
      { rowId: requirement.id, columnId: "title", value: `${requirement.title} sizing only` },
    ]);
    const attempt = {
      ...proposeWorkbookChanges(baseline, workbook).request,
      requestId: crypto.randomUUID(),
    };
    const draft = {
      baseline,
      workbook,
      mappings: [],
      applyAttempt: attempt,
      savedId: baseline.workbook?.id ?? crypto.randomUUID(),
      savedRevision: baseline.workbook?.revision ?? 0,
      savedDocument: JSON.stringify(workbookDocument(initial)),
    };
    const bytes = (value) =>
      new TextEncoder().encode(typeof value === "string" ? value : JSON.stringify(value))
        .byteLength;
    const json = JSON.stringify(draft);
    let guarded = "stored";
    let raw = "stored";
    let persistedBytes;
    let persistedCharacters;
    let restoredAttempt;
    let restoredProposal;
    const originalProposal = proposeWorkbookChanges(baseline, workbook).request;
    try {
      writeWorkbenchDraft(sessionStorage, "sizing-only", draft);
      const persisted = sessionStorage.getItem("sizing-only");
      persistedBytes = bytes(persisted);
      persistedCharacters = persisted.length;
      const restored = readWorkbenchDraft(persisted, baseline.programId);
      restoredAttempt = restored.applyAttempt;
      restoredProposal = proposeWorkbookChanges(restored.baseline, restored.workbook).request;
    } catch (error) {
      guarded = `${error.name}: ${error.message}`;
    } finally {
      sessionStorage.removeItem("sizing-only");
    }
    try {
      sessionStorage.setItem("sizing-only", json);
    } catch (error) {
      raw = `${error.name}: ${error.message}`;
    } finally {
      sessionStorage.removeItem("sizing-only");
    }
    return {
      counts: baseline.counts,
      baselineBytes: bytes(baseline),
      workbookBytes: bytes(workbook),
      draftBytes: bytes(json),
      draftCharacters: json.length,
      attemptBytes: bytes(attempt),
      guardedStorage: guarded,
      ...(persistedBytes !== undefined ? { persistedBytes, persistedCharacters } : {}),
      uncompressedSessionStorage: raw,
      originalAttempt: attempt,
      originalProposal,
      restoredAttempt,
      restoredProposal,
      sheets: workbook.sheets.map((sheet) => ({
        name: sheet.name,
        rows: sheet.rows.length,
        columns: sheet.columns.length,
        bytes: bytes(sheet),
      })),
    };
  }, snapshot);
  assert.equal(
    result.guardedStorage,
    "stored",
    "The compact draft must fit actual browser storage",
  );
  assert.ok(result.persistedBytes < 5_000_000);
  assert.deepEqual(
    result.restoredAttempt,
    result.originalAttempt,
    "Recovery must retain the exact original request",
  );
  assert.deepEqual(
    result.restoredProposal,
    result.originalProposal,
    "Recovery must retain the same authored proposal",
  );
  const after = await data(
    client.rpc("read_assurance_workbook", {
      p_tenant_id: tenant.id,
      p_program_id: program.id,
      p_row_limit: 10000,
    }),
  );
  for (const key of [
    "requirements",
    "mappings",
    "allocations",
    "evidence",
    "systems",
    "owners",
    "selectedControls",
    "workbook",
  ])
    assert.deepEqual(after[key], snapshot[key], `${key} must remain unchanged`);
  const {
    originalAttempt: _attempt,
    originalProposal: _proposal,
    restoredAttempt: _restoredAttempt,
    restoredProposal: _restoredProposal,
    ...sizes
  } = result;
  console.log(
    JSON.stringify(
      { ...sizes, exactReceiptAndProposalRestored: true, databaseUnchanged: true },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
