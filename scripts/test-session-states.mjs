#!/usr/bin/env node
/**
 * Sign-in failure, the workspace's bootstrap states and the session's end on a disposable local
 * account, at a desktop and a touch phone (G7-14; the flows are in tests/session-flows.mjs).
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { localWorkspace } from "./tests/local-workspace.mjs";
import { checkSessionStates } from "./tests/session-flows.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("session-states");
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844, touch: true },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.touch ?? false,
      isMobile: viewport.touch ?? false,
    });
    context.setDefaultTimeout(30000);
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(`${viewport.width}px: ${error.message}`));
    try {
      await checkSessionStates(page, {
        origin,
        email: workspace.email,
        password: workspace.password,
        log: (line) => console.log(`${line} at ${viewport.width}px`),
      });
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(errors, [], "No uncaught browser errors");
  console.log("PASS session states");
} finally {
  try {
    await browser.close();
  } finally {
    await workspace.cleanup();
  }
}
