import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const B = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on("pageerror", (e) => console.log("ERR", e.message));
p.on("console", (m) => { if (m.type() === "error") console.log("CERR", m.text()); });
// fresh load with the suffix, V3 off
await p.goto("file://" + B + "#dr-finding--c0fdce4e--dock-notes"); await p.waitForTimeout(1200);
const s = () => p.evaluate(() => ({ hash: location.hash, pane: !!document.querySelector(".drk-dk-pane"), on: (document.querySelector(".drk-dk-i.on") || {}).title || "", h1: (document.querySelector("#main h1") || {}).textContent || "", hl: history.length, v3: PA.v3.on() }));
console.log("load", JSON.stringify(await s()));
await p.click(".drk-dk-i[data-drk-dk=tasks]"); await p.waitForTimeout(300); console.log("tasks", JSON.stringify(await s()));
await p.evaluate(() => PA.v3k.redraw()); await p.waitForTimeout(200); console.log("redraw", JSON.stringify(await s()));
await p.click(".drk-dk-pane .drk-dw-x"); await p.waitForTimeout(300); console.log("closed", JSON.stringify(await s()));
await p.evaluate(() => { location.hash = "dr-finding--c0fdce4e--dock-tickets"; }); await p.waitForTimeout(500); console.log("typed", JSON.stringify(await s()));
await p.evaluate(() => { location.hash = "dr-checks"; }); await p.waitForTimeout(500); console.log("away", JSON.stringify(await s()));
await p.goBack(); await p.waitForTimeout(600); console.log("back", JSON.stringify(await s()));
// drawers
for (const r of ["dr-evidence", "dr-sources", "dr-checks"]) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(500);
  const eye = await p.$("#main [data-panel]:not(tr)") || await p.$("#main tr[data-panel]");
  if (!eye) { console.log(r, "no eye"); continue; }
  await eye.click(); await p.waitForTimeout(300);
  const a = await p.evaluate(() => (document.querySelector("#panel .drk-dw-pos") || {}).textContent || "none");
  await p.click("#panel .drk-dw-b[data-drk-key=down]").catch(() => {}); await p.waitForTimeout(300);
  const c = await p.evaluate(() => (document.querySelector("#panel .drk-dw-pos") || {}).textContent || "none");
  console.log(r, a, "→", c);
  await p.evaluate(() => { const c = document.getElementById("closePanel"); if (c) c.click(); });
}
await b.close();
