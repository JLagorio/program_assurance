import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const r of process.argv.slice(3)) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(500);
  const o = await p.evaluate(() => ({ hash: location.hash, title: (document.querySelector("#main h1, #main h2") || {}).innerText, qv: [...document.querySelectorAll('#main .qv, #main [role="tab"], #main .chip, #main .tab, #main .sectab, #main .k3-chip, #main .k3-tab')].map((x) => x.innerText.replace(/\s+/g, " ").trim()).slice(0, 30), rows: document.querySelectorAll("#main tbody tr").length, pager: (document.querySelector("#main .pager") || {}).innerText, btns: [...document.querySelectorAll("#main .btn")].map((x) => x.innerText.trim()).slice(0, 14) }));
  console.log(r, JSON.stringify(o));
}
console.log("errors", errs);
await b.close();
