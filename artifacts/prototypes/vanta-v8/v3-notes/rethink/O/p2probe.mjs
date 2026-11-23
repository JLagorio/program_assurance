import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(800);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(550); };
console.log(JSON.stringify(await p.evaluate(() => ({ fc: PA.v3.fact("findingCounts"), issues: PA.v3.fact("issues", "PRG-1090"), base: (() => { const b = PA.v3.fact("baseline"); return b && { total: b.total }; })(), ctl: PA.v3.fact("controls", "PRG-1090"), risks: PA.v3.fact("risks", "PRG-1090"), ev: PA.v3.fact("evidence", "PRG-1090"), next: PA.v3.fact("nextGate"), facts: Object.keys(PA.v3.facts).join(" "), head: (document.querySelector("#nav .v2g-head") || {}).outerHTML }))));
const rows = () => p.evaluate(() => ({ hash: location.hash, rows: [...document.querySelectorAll("#main tbody tr")].filter((r) => !r.hidden && !r.classList.contains("k3-grow")).length, chip: (document.querySelector("#main .k3-chip.on") || {}).innerText, tab: (document.querySelector("#main .k3-tab.on") || {}).innerText, foot: (document.querySelector("#main .pager") || {}).innerText, bar: (document.getElementById("k3task") || {}).innerText }));
for (const lab of ["Operational issues", "Risks without an owner", "Evidence waiting on review", "Your tasks"]) { await go("overview"); await p.click(`#main .k3-att-r:has-text("${lab}")`); await p.waitForTimeout(700); console.log(lab, JSON.stringify(await rows())); }
for (const name of ["Requirements", "Connections", "Boundary"]) { await go("overview"); await p.click(`#main .k3o-dl:has(.k3o-dl-n:has-text("${name}")) .btn`); await p.waitForTimeout(800); console.log(name, JSON.stringify(await rows())); await p.screenshot({ path: `tmp/p2-${name}.jpg`, type: "jpeg", quality: 55 }); await p.click("#k3task .k3-task-b").catch(() => {}); await p.waitForTimeout(400); }
await go("overview"); await p.screenshot({ path: "tmp/p2-ov.jpg", type: "jpeg", quality: 55 });
await go("gate--pdr-2"); await p.screenshot({ path: "tmp/p2-gate.jpg", type: "jpeg", quality: 55 });
for (const [l, r] of [["sys", "system"], ["host", "component--f16"], ["itcsc", "itcsc"], ["ctl", "controls"]]) { await go(r); console.log(l, JSON.stringify(await rows())); }
console.log("errors", errs);
await b.close();
