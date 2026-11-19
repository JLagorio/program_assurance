// Every nav route plus the record pages: page errors, sideways page scroll at 390 and 1440, and visible controls. node phone.mjs <html> <out.json>
import { createRequire } from "node:module"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out] = process.argv.slice(2);
const b = await chromium.launch(); const res = {};
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } }); p.setDefaultTimeout(120000); p.setDefaultNavigationTimeout(180000);
  let errs = []; p.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
  await p.goto("file://" + html + "#home", { timeout: 180000 }); await p.waitForTimeout(1500);
  const nav = await p.evaluate(() => PA.navItems().map(([r]) => r).filter((r) => !["study", "before-after", "nav-options"].includes(r)));
  const extra = ["control-si2", "evidence-page-e1", "policy-page-ac-1", "campaign", "component-mc", "person-joel-barrantes", "check-scan", "stigs-mission-computer-rhel9", "data-calls-fisma", "frameworks-high", "plan-cp", "integration-emass", "campaign-conmon", "ssp-review", "program-start"];
  for (const r of [...nav, ...extra]) {
    errs = [];
    await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(350);
    const m = await p.evaluate(() => { const se = document.scrollingElement; const main = document.getElementById("main"); const vis = (e) => { const q = e.getBoundingClientRect(); return q.width > 0 && q.height > 0; }; return { pageX: se.scrollWidth - se.clientWidth, mainX: main ? main.scrollWidth - main.clientWidth : null, notDrawn: /Not drawn yet/.test(main.innerText), h1: ((main.querySelector("h1") || {}).innerText || "").slice(0, 60), controls: [...main.querySelectorAll("button, a[href], [data-go], [data-modal], [data-panel], .btn")].filter(vis).length, rows: main.querySelectorAll("table tbody tr").length, len: main.innerText.length }; });
    res[r] = res[r] || {}; res[r][w] = { ...m, errors: [...errs] };
  }
  await p.close();
}
fs.writeFileSync(out, JSON.stringify(res, null, 1)); await b.close();
const bad = Object.entries(res).filter(([, v]) => (v[390] && (v[390].pageX > 2 || v[390].errors.length)) || (v[1440] && (v[1440].pageX > 2 || v[1440].errors.length)));
console.log("routes", Object.keys(res).length, "| sideways or errors:", bad.map(([r, v]) => `${r} 390x=${v[390] && v[390].pageX} 1440x=${v[1440] && v[1440].pageX} err=${(v[390].errors.concat(v[1440].errors))[0] || ""}`).join(" ; "));
