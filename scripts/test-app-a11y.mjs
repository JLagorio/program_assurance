#!/usr/bin/env node
/**
 * An axe and console sweep over every route in docs/guides/screen-inventory.json, at 1440px and
 * at a 390px touch phone, plus the signed-out sign-in screen, an open create Dialog and an open
 * collection preview (audit TOO-10, G2-18, A11-12). The Storybook gate covers the kit's stories;
 * this covers the screens the kit is composed into.
 *
 * Axe runs the WCAG 2.0 to 2.2 A and AA rules and best practice, with target-size on. Two Base UI
 * mechanisms are left out, as the audit found: its focus guards (aria-hidden-focus), and popups it
 * portals outside the landmarks on purpose (region). The console sweep counts page errors,
 * console errors and Base UI warnings.
 *
 * Needs the local stack and the app (APP_TEST_URL, default http://127.0.0.1:8080). By default it
 * signs in a disposable @example.test workspace with a few named records and removes it after;
 * `--seeded` signs in the seeded developer account instead and aborts every write it would make.
 * Known problems are counted per screen in scripts/app-a11y-allow.json, which may only shrink
 * (scripts/check-allow-lists.mjs); a screen fails when it has more than its allowance, and
 * `--record` rewrites the file from this run.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import { localWorkspace } from "./tests/local-workspace.mjs";

const require = createRequire(import.meta.url);
const axeSource = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");
const inventory = JSON.parse(
  await readFile(new URL("../docs/guides/screen-inventory.json", import.meta.url), "utf8"),
);
const allowPath = new URL("./app-a11y-allow.json", import.meta.url);
const allow = JSON.parse(await readFile(allowPath, "utf8").catch(() => '{"screens":{}}'));
const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const seeded = process.argv.includes("--seeded");
const record = process.argv.includes("--record");
const missing = randomUUID();
const READ_RPCS = new Set(["ensure_personal_tenant", "app_schema", "product_component_definition"]);

/* ---------- the account and its records ---------- */

let workspace;
let supabaseOrigin = "http://127.0.0.1:54321";
const fixtures = {};
async function seededAccount() {
  // .env.local quotes its values (VITE_SUPABASE_URL="http://…").
  const env = Object.fromEntries(
    (await readFile(new URL("../.env.local", import.meta.url), "utf8"))
      .split("\n")
      .map((line) => line.match(/^([A-Z_]+)=(.*)$/)?.slice(1))
      .filter(Boolean)
      .map(([key, value]) => [key, value.trim().replace(/^(["'])(.*)\1$/, "$2")]),
  );
  supabaseOrigin = new URL(env.VITE_SUPABASE_URL).origin;
  assert.ok(["127.0.0.1", "localhost"].includes(new URL(supabaseOrigin).hostname));
  const email = "developer@program-assurance.local";
  const password = "local-program-assurance";
  const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signedIn = await client.auth.signInWithPassword({ email, password });
  assert.ifError(signedIn.error);
  // Reads only: the first record of each model the inventory names.
  const program = await client.from("programs").select("*").eq("code", "WS-X90").limit(1);
  fixtures.programs = program.data?.length ? program.data : [];
  for (const model of new Set(inventory.map((screen) => screen.model).filter(Boolean))) {
    if (model === "programs" && fixtures.programs.length) continue;
    const rows = await client.from(model).select("*").limit(1);
    if (!rows.error) fixtures[model] = rows.data;
  }
  return { email, password, cleanup: async () => {} };
}

async function disposableAccount() {
  workspace = await localWorkspace("app-accessibility");
  const insert = async (model, values) => {
    const result = await workspace.client
      .from(model)
      .insert({ ...values, tenant_id: workspace.tenantId })
      .select()
      .single();
    assert.ifError(result.error);
    (fixtures[model] ??= []).push(result.data);
    return result.data;
  };
  const program = await insert("programs", { code: "A11Y-1", name: "Accessibility program" });
  const system = await insert("systems", {
    program_id: program.id,
    code: "SYS-A11Y",
    name: "Accessibility system",
    system_type: "information_system",
  });
  const person = (
    await workspace.client.from("parties").select("*").eq("auth_user_id", workspace.userId).single()
  ).data;
  const task = await insert("tasks", { program_id: program.id, title: "Accessibility task" });
  await insert("task_assignments", {
    task_id: task.id,
    party_id: person.id,
    assignment_role: "responsible",
  });
  await insert("risks", { program_id: program.id, title: "Accessibility risk" });
  await insert("assessment_campaigns", { program_id: program.id, title: "Accessibility campaign" });
  await insert("operational_issues", { program_id: program.id, title: "Accessibility issue" });
  await insert("workstreams", { program_id: program.id, title: "Accessibility workstream" });
  const document = await insert("poam_documents", {
    program_id: program.id,
    title: "Accessibility remediation plan",
  });
  await insert("poam_items", { poam_document_id: document.id, title: "Accessibility item" });
  await insert("authorization_packages", {
    program_id: program.id,
    system_id: system.id,
    title: "Accessibility package",
  });
  await insert("parties", { party_type: "organization", name: "Accessibility supplier" });
  await insert("evidence_artifacts", {
    program_id: program.id,
    title: "Accessibility evidence",
    artifact_kind: "document",
  });
  for (const model of ["profiles", "controls"]) {
    const rows = await workspace.client.from(model).select("*").limit(1);
    assert.ifError(rows.error);
    fixtures[model] = rows.data;
  }
  return workspace;
}

function routePath(screen, path = screen.path) {
  return path.replace(/\$(\w+)/g, (_, parameter) => {
    if (parameter === "collection") return "parties";
    if (parameter === "programId") return fixtures.programs?.[0]?.id ?? missing;
    return fixtures[screen.model]?.[0]?.id ?? missing;
  });
}

/* ---------- one screen ---------- */

async function settle(page) {
  await page.waitForTimeout(600);
  for (let i = 0; i < 40; i++) {
    const busy = await page
      .evaluate(
        () =>
          document.querySelectorAll('[aria-busy="true"], [data-slot="skeleton"]').length +
          (/Loading workspace/.test(document.body?.innerText ?? "") ? 1 : 0),
      )
      .catch(() => 1);
    if (!busy) break;
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(300);
}

async function axe(page) {
  if (!(await page.evaluate(() => typeof window.axe !== "undefined")))
    await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    const { violations } = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
      },
      rules: { "target-size": { enabled: true } },
      resultTypes: ["violations"],
    });
    const element = (target) => {
      try {
        return document.querySelector(target.at(-1));
      } catch {
        return null;
      }
    };
    const popup =
      '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"], [data-slot$="-popup"], [data-slot$="-content"], [data-slot="toaster"], [data-slot="toast-viewport"]';
    return violations
      .map((violation) => ({
        id: violation.id,
        help: violation.help,
        nodes: violation.nodes
          .filter((node) => {
            const el = element(node.target);
            // Base UI's focus guards are hidden and focusable by design; its portalled popups sit
            // outside the landmarks on purpose.
            if (violation.id === "aria-hidden-focus" && el?.closest("[data-base-ui-focus-guard]"))
              return false;
            if (
              violation.id === "aria-hidden-focus" &&
              el?.querySelector("[data-base-ui-focus-guard]")
            )
              return false;
            if (violation.id === "region" && el?.closest(popup)) return false;
            return true;
          })
          .map((node) => node.target.join(" ")),
      }))
      .filter((violation) => violation.nodes.length > 0);
  });
}

const results = {};
const failures = [];
async function check(page, key, log) {
  await settle(page);
  const violations = await axe(page);
  const found = Object.fromEntries(violations.map((v) => [v.id, v.nodes.length]));
  const messages = log.splice(0);
  if (messages.length) found.console = messages.length;
  results[key] = found;
  const allowed = allow.screens?.[key] ?? {};
  const over = Object.entries(found).filter(([id, count]) => count > (allowed[id] ?? 0));
  if (over.length && !record) {
    failures.push(key);
    console.log(`FAIL ${key}`);
    for (const [id, count] of over) {
      const detail =
        id === "console"
          ? messages.slice(0, 3).join(" | ")
          : `${violations.find((v) => v.id === id)?.help}: ${violations
              .find((v) => v.id === id)
              ?.nodes.slice(0, 3)
              .join(", ")}`;
      console.log(`  ${id} ${count} (allowed ${allowed[id] ?? 0}) ${detail}`);
    }
  } else
    console.log(
      `PASS ${key}${Object.keys(found).length ? ` (allowed: ${JSON.stringify(found)})` : ""}`,
    );
}

let browser;
let account;
try {
  account = seeded ? await seededAccount() : await disposableAccount();
  browser = await chromium.launch({ headless: true });
  for (const width of [1440, 390]) {
    const phone = width === 390;
    const context = await browser.newContext({
      viewport: { width, height: phone ? 844 : 900 },
      hasTouch: phone,
      isMobile: phone,
      reducedMotion: "reduce",
    });
    // The seeded workspace is never written: every write to the local Supabase (REST, RPC,
    // Storage) is aborted, except signing in and the RPCs that only read.
    if (seeded)
      await context.route(`${supabaseOrigin}/**`, (route) => {
        const request = route.request();
        const { pathname } = new URL(request.url());
        const rpc = pathname.match(/\/rest\/v1\/rpc\/(\w+)$/)?.[1];
        if (["GET", "HEAD", "OPTIONS"].includes(request.method())) return route.continue();
        if (pathname === "/auth/v1/token") return route.continue();
        if (rpc && READ_RPCS.has(rpc)) return route.continue();
        return route.abort("blockedbyclient");
      });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    const log = [];
    page.on("pageerror", (error) => log.push(`pageerror: ${error.message.slice(0, 200)}`));
    page.on("console", (message) => {
      const text = message.text();
      if (message.type() === "error" && !/Failed to load resource|blockedbyclient/.test(text))
        log.push(`console.error: ${text.slice(0, 200)}`);
      if (message.type() === "warning" && /^Base UI:/.test(text))
        log.push(`Base UI: ${text.slice(0, 200)}`);
    });
    await page.goto(`${origin}/work`);
    await page.getByLabel("Email", { exact: true }).waitFor();
    await check(page, `${width} sign-in`, log);
    await page.getByLabel("Email", { exact: true }).fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(account.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("heading", { level: 1, name: "My work" }).waitFor();
    for (const screen of inventory) {
      if (screen.family === "exception") continue;
      await page.goto(`${origin}${routePath(screen)}`);
      await page.getByRole("heading", { level: 1 }).first().waitFor();
      await check(page, `${width} ${screen.path}`, log);
    }
    // An open create Dialog, and an open collection preview.
    await page.goto(`${origin}/work`);
    await page.getByRole("heading", { level: 1, name: "My work" }).waitFor();
    await settle(page);
    const create = page.getByRole("button", { name: "Create task", exact: true }).first();
    if (await create.count()) {
      await create.click();
      await page.getByRole("dialog").waitFor();
      await check(page, `${width} /work Create task dialog`, log);
      await page.keyboard.press("Escape");
    }
    await page.goto(`${origin}/programs`);
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await settle(page);
    const eye = page.getByRole("button", { name: /Preview/ }).first();
    if (await eye.count()) {
      await eye.click();
      await page.getByRole("button", { name: "Close details", exact: true }).waitFor();
      await check(page, `${width} /programs preview`, log);
    }
    await context.close();
  }
  if (record) {
    await writeFile(
      allowPath,
      `${JSON.stringify(
        {
          about:
            "Known axe violations and console messages per screen when the sweep landed, counted by rule. The counts may only shrink: fix the screen and lower its entry (scripts/check-allow-lists.mjs compares with the base branch).",
          screens: Object.fromEntries(
            Object.entries(results).filter(([, found]) => Object.keys(found).length > 0),
          ),
        },
        null,
        2,
      )}\n`,
    );
    console.log(`Recorded ${Object.keys(results).length} screens in scripts/app-a11y-allow.json`);
  }
  assert.deepEqual(failures, [], "Every screen stays within its axe and console allowance");
} finally {
  await browser?.close();
  // The disposable workspace goes even when a fixture insert failed before `account` was set.
  await (account ?? workspace)?.cleanup?.();
}
