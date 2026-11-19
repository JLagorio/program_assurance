// Exploration helper: node x.mjs <build> <script.mjs> [width] — runs the script's default async fn(p, H) against a fresh page.
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const html = path.resolve(process.argv[2]); const scr = path.resolve(process.argv[3]); const W = +(process.argv[4] || 1440);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: W > 600 ? 900 : 844 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
await p.goto("file://" + html + "#home"); await p.waitForTimeout(400);
await p.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} }); await p.reload(); await p.waitForTimeout(500);
const H = {
  wait: (ms = 400) => p.waitForTimeout(ms),
  go: async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(500); },
  main: () => p.evaluate(() => document.getElementById("main").innerText.replace(/\s+/g, " ")),
  panel: () => p.evaluate(() => { const x = document.getElementById("panel"); return x.hidden ? "" : x.innerText.replace(/\s+/g, " "); }),
  modal: () => p.evaluate(() => { const x = document.getElementById("modal"); return x.hidden ? "" : x.innerText.replace(/\s+/g, " "); }),
  toast: () => p.evaluate(() => { const t = document.getElementById("v2-toast"); return t && !t.hidden ? t.innerText.replace(/\s+/g, " ") : ""; }),
  qvOn: () => p.$$eval("#main .qv.on, #main .qv[aria-pressed=true], #main [role=tab][aria-selected=true]", (q) => q.map((x) => x.textContent.replace(/\s+/g, " ").trim())),
  vis: () => p.$$eval("#main tbody tr", (t) => t.filter((r) => !r.hidden && r.offsetParent).map((r) => r.textContent.replace(/\s+/g, " ").trim())),
  errors,
};
const mod = await import(scr);
try { await mod.default(p, H); } catch (e) { console.log("SCRIPT ERROR", e); }
console.log("page errors:", errors.length ? [...new Set(errors)].join(" | ") : "none");
await b.close();
