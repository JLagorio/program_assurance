import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const r of ["requirements", "findings", "evidence", "risks", "assessments", "documents", "system", "controls"]) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(600);
  const inner = await p.evaluate(() => { const rows = [...document.querySelectorAll("#main tr[data-panel], #main tr[data-go], #main tr[data-k3]")]; const out = {}; for (const tr of rows) for (const e of tr.querySelectorAll("a[href], button, [data-panel], [data-go], [data-k3]")) { const k = e.tagName + (e.getAttribute("data-panel") ? "[panel=" + e.getAttribute("data-panel") + "]" : e.getAttribute("href") ? "[href]" : e.getAttribute("data-k3") ? "[k3=" + e.getAttribute("data-k3") + "]" : ""); out[k] = (out[k] || 0) + 1; } return { rows: rows.length, out }; });
  console.log(r, JSON.stringify(inner));
  const a = await p.$("#main tr[data-panel] a[href^='#'], #main tr[data-go] a[href^='#']");
  if (a) { await a.click(); await p.waitForTimeout(600); console.log("   link click →", await p.evaluate(() => ({ hash: location.hash, panelOpen: !!document.querySelector("#proto.has-panel, .panel.open, #panel:not([hidden])") && !!document.querySelector("#panel .k3-pn"), title: (document.querySelector("#panel .k3-pn h4") || {}).innerText }))); }
}
console.log("errors", errs.slice(0, 3));
await b.close();
