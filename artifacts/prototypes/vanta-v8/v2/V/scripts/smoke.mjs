// Open every route of a build (and every preview and dialog reachable from it) with no page errors; report the cleanup's stats and timing.
// node smoke.mjs <build.html> <out.json> [routes-regex]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const fs = await import("fs");
const [, , build, out, only] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 400)));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 300)); });
await page.goto("file://" + build + "#home");
await page.waitForTimeout(300);
const routes = await page.evaluate((only) => Object.keys(window.PA.S).filter((k) => !k.startsWith("after-") && (!only || new RegExp(only).test(k))), only || "");
const perRoute = {};
for (const r of routes) {
  const n0 = errors.length;
  await page.evaluate((r) => { location.hash = r; }, r);
  await page.waitForTimeout(15);
  const info = await page.evaluate(() => {
    const main = document.getElementById("main");
    return { ms: (window.PA.v2clean && window.PA.v2clean.ms[(location.hash || "#home").slice(1)]) || null, overflow: document.documentElement.scrollWidth > window.innerWidth + 1 || main.scrollWidth > main.clientWidth + 1 };
  });
  perRoute[r] = { ...info, errors: errors.slice(n0) };
}
// previews and dialogs, by calling them as the router does
const pd = await page.evaluate(() => {
  const PA = window.PA, fails = [];
  const parse = (h) => { const t = document.createElement("template"); t.innerHTML = h || ""; return t.content; };
  const panels = new Map(), modals = new Map();
  for (const r of Object.keys(PA.S)) {
    if (r.startsWith("after-") || /^(before-after|nav-options|study)/.test(r)) continue;
    let f; try { f = parse(PA.S[r]()); } catch (e) { fails.push(["S", r, String(e)]); continue; }
    f.querySelectorAll("[data-panel]").forEach((el) => { const k = el.dataset.panel; if (!k) return; if (!panels.has(k)) panels.set(k, new Set()); panels.get(k).add(el.dataset.id || ""); });
    f.querySelectorAll("[data-modal]").forEach((el) => { const k = el.dataset.modal; if (!k) return; if (!modals.has(k)) modals.set(k, new Set()); modals.get(k).add(el.dataset.id || ""); });
  }
  let np = 0, nm = 0;
  for (const [k, ids] of panels) for (const id of ids) { try { PA.P[k] && PA.P[k](id); np++; } catch (e) { fails.push(["P", k, id, String(e)]); } }
  for (const [k, ids] of modals) for (const id of [...ids].slice(0, 12)) { try { PA.M[k] && PA.M[k](id); nm++; } catch (e) { fails.push(["M", k, id, String(e)]); } }
  return { np, nm, fails, stats: PA.v2clean ? PA.v2clean.stats : null, snapped: PA.v2clean && PA.v2clean.snapped };
});
const ms = Object.values(perRoute).map((x) => x.ms).filter((x) => x != null).sort((a, b) => a - b);
const res = { routes: routes.length, errors, slow: Object.entries(perRoute).filter(([, x]) => x.ms > 30).map(([r, x]) => [r, x.ms]), overflow: Object.entries(perRoute).filter(([, x]) => x.overflow).map(([r]) => r), median: ms[Math.floor(ms.length / 2)], max: ms[ms.length - 1], previewsCalled: pd.np, dialogsCalled: pd.nm, fails: pd.fails, snapped: pd.snapped, stats: pd.stats };
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log(`routes ${res.routes} · page errors ${errors.length} · fails ${pd.fails.length} · previews ${pd.np} dialogs ${pd.nm} · clean ms median ${res.median} max ${res.max} · slow ${res.slow.length} · page overflow ${res.overflow.length} · sheet rules snapped ${pd.snapped}`);
if (errors.length) console.log(errors.slice(0, 8).join("\n"));
if (pd.fails.length) console.log(JSON.stringify(pd.fails.slice(0, 8)));
await browser.close();
