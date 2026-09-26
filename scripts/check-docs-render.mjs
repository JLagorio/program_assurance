#!/usr/bin/env node
/**
 * Renders every MDX page of the design-system Storybook and fails on an error: a page error, a
 * console error, Storybook's error display, or a page that never shows its content. The story
 * run renders stories, not pages, so a broken import, a Canvas of a missing story or a throwing
 * block in a page reaches no other check.
 *
 * Against a running Storybook (`--url http://localhost:6007`, the default) or a built one
 * (`--static packages/design-system/storybook-static`), which this script serves itself. Pages
 * that fail on purpose would be listed in scripts/docs-render-allow.json with their reason; the
 * list may only shrink. A built Storybook runs React's production build, which drops React's
 * development warnings, so an allowed page for such a warning renders cleanly there: against a
 * built Storybook a clean allowed page is reported, and the run against the dev server is the one
 * that says it leaves the list.
 */
import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const argument = (name) => {
  const index = process.argv.indexOf(name);
  return index > 0 ? process.argv[index + 1] : undefined;
};
const allow = JSON.parse(
  await readFile(new URL("./docs-render-allow.json", import.meta.url), "utf8").catch(
    () => '{"pages":{}}',
  ),
);
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
};

/** A static server for a built Storybook, on a free local port. */
async function serve(root) {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(path.resolve(root))) return response.writeHead(403).end();
    const info = await stat(file).catch(() => null);
    if (info?.isDirectory()) file = path.join(file, "index.html");
    if (!(await stat(file).catch(() => null))) return response.writeHead(404).end();
    response.writeHead(200, {
      "content-type": types[path.extname(file)] ?? "application/octet-stream",
    });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return { url: `http://127.0.0.1:${port}`, close: () => server.close() };
}

const staticRoot = argument("--static");
const server = staticRoot ? await serve(path.resolve(staticRoot)) : undefined;
const base =
  server?.url ?? argument("--url") ?? process.env.STORYBOOK_URL ?? "http://localhost:6007";
const index = await (await fetch(`${base}/index.json`)).json();
const pages = Object.values(index.entries).filter((entry) => entry.type === "docs");
assert.ok(pages.length > 0, `${base} lists no docs pages`);
console.log(`Rendering ${pages.length} docs pages from ${base}`);

const browser = await chromium.launch();
const results = [];
let next = 0;
async function worker() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  while (next < pages.length) {
    const entry = pages[next++];
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(`page error: ${error.message.slice(0, 300)}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text().slice(0, 300)}`);
    });
    try {
      await page.goto(`${base}/iframe.html?id=${entry.id}&viewMode=docs`, {
        waitUntil: "load",
        timeout: 60000,
      });
      await page
        .waitForFunction(
          () =>
            document.body.classList.contains("sb-show-errordisplay") ||
            (document.querySelector("#storybook-docs")?.textContent ?? "").length > 40,
          null,
          { timeout: 45000 },
        )
        .catch(() => errors.push("the page showed no content in 45s"));
      await page.waitForTimeout(1000);
      const shown = await page.evaluate(() =>
        document.body.classList.contains("sb-show-errordisplay")
          ? (document.querySelector("#error-message")?.textContent ?? "error display")
          : "",
      );
      if (shown) errors.push(`Storybook error: ${shown.slice(0, 300)}`);
    } catch (error) {
      errors.push(`load: ${String(error).slice(0, 200)}`);
    }
    await page.close();
    const allowed = allow.pages?.[entry.id];
    const status = errors.length === 0 ? "PASS" : allowed ? "ALLOWED" : "FAIL";
    console.log(
      `${status} ${entry.id}${errors.length ? `\n  ${[...new Set(errors)].slice(0, 3).join("\n  ")}` : ""}`,
    );
    results.push({ id: entry.id, errors, allowed });
  }
  await context.close();
}
try {
  await Promise.all([worker(), worker(), worker(), worker()]);
} finally {
  await browser.close();
  server?.close();
}
const failed = results.filter((result) => result.errors.length > 0 && !result.allowed);
const stale = Object.keys(allow.pages ?? {}).filter(
  (id) => !results.some((result) => result.id === id && result.errors.length > 0),
);
console.log(`${results.length} pages, ${failed.length} failed`);
if (staticRoot)
  for (const id of stale)
    console.log(
      `NOTE ${id} is allowed and renders cleanly in the built Storybook; run against the dev server to see whether it leaves the list`,
    );
else
  assert.deepEqual(
    stale,
    [],
    "Allowed pages that now render cleanly leave scripts/docs-render-allow.json",
  );
assert.deepEqual(
  failed.map((result) => result.id),
  [],
  "Every docs page renders without an error",
);
