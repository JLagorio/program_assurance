import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
p.setDefaultTimeout(5000);
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
const shot = async (n) => { await p.evaluate(() => { const t = document.getElementById("v2-toast"); if (t) t.hidden = true; }); await p.screenshot({ path: `f2-${n}.jpg`, type: "jpeg", quality: 60 }); };
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(450); };
const T = (sel) => p.evaluate((sel) => { const e = document.querySelector(sel); return e ? e.innerText.replace(/\s+/g, " ").trim().slice(0, 400) : null; }, sel);
// noreq
await p.click("#main .k3o-dl:nth-child(2) .btn"); await p.waitForTimeout(600);
console.log("noreq", await p.evaluate(() => location.hash), await T("#k3task"), await p.evaluate(() => document.querySelectorAll("#main tbody tr").length)); await shot("noreq");
await p.click("#main tbody tr"); await p.waitForTimeout(500); console.log("ctl panel:", await T("#panel")); await shot("noreq-panel");
await p.click("#k3task .k3-task-b"); await p.waitForTimeout(500);
// panel decide
await p.evaluate(() => PA.v3k.openPanel("k3o-gate", "pdr-2")); await p.waitForTimeout(400);
await p.evaluate(() => { document.querySelector("#panel .pbody, #panel").scrollTop = 900; });
await shot("panel-bottom");
console.log("panel:", (await T("#panel")).slice(-330));
await p.click('#panel [data-k3="ov.decide"]'); await p.waitForTimeout(400); await shot("decide");
await p.selectOption("#k3f-o", "cond"); await p.fill("#k3f-why", "Design is mature"); await p.click("#modal [data-k3-submit]"); await p.waitForTimeout(300);
console.log("refusal:", await T('#modal [data-k3-field="o"] .err')); await shot("refused");
await p.click("#modal [data-k3-close]");
// team
await go("overview-team"); await shot("team"); console.log("team:", (await T("#main")).slice(0, 300));
await go("overview-activity"); await shot("activity"); console.log("activity rows", await p.evaluate(() => document.querySelectorAll("#main tbody tr").length), await T("#main .k3-chips"));
for (const r of ["lifecycle", "lifecycle-increment-1", "lifecycle-outcomes", "sse", "lifecycle-pdr-2", "lifecycle-ato-2", "rec--a-work-gate--pdr", "people", "people-roles", "activity", "activity-decisions", "getting-started"]) {
  await go("controls"); await go(r); await p.waitForTimeout(300);
  console.log(r, "→", await p.evaluate(() => location.hash), "| panel:", await p.evaluate(() => { const pn = document.getElementById("panel"); return pn && !pn.hidden ? (pn.querySelector("h4") || {}).innerText : null; }), "| menu:", await p.evaluate(() => [...document.querySelectorAll("#nav a.item.on")].map((a) => a.innerText.trim()).join(",")), "| inc:", await p.evaluate(() => (document.querySelector("#k3o-life select") || {}).value), "| chip:", await T("#main .k3-chip.on"));
}
console.log("S keys:", await p.evaluate(() => Object.keys(PA.S).filter((k) => /^(people|activity|lifecycle|sse|getting)/.test(k)).join(" ")));
console.log("errors", errs);
await b.close();
