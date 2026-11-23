import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
const shot = async (n) => { await p.evaluate(() => { const t = document.getElementById("v2-toast"); if (t) t.hidden = true; }); await p.screenshot({ path: `f1-${n}.jpg`, type: "jpeg", quality: 60 }); };
const info = () => p.evaluate(() => ({ hash: location.hash, bar: (document.getElementById("k3task") || {}).innerText, rows: [...document.querySelectorAll("#main tbody tr")].filter((r) => !r.hidden).length, kept: (document.querySelector(".v2-kept") || {}).innerText, full: document.getElementById("proto").classList.contains("fullwin") }));
for (const [i, name] of [[1, "conns"], [2, "boundary"], [0, "noreq"]]) {
  await p.evaluate(() => { location.hash = "overview"; }); await p.waitForTimeout(400);
  await p.click(`#main .k3o-dl:nth-child(${[2, 4, 5][i]}) .btn`); await p.waitForTimeout(700);
  console.log(name, JSON.stringify(await info())); await shot(name);
  const back = await p.$("#k3task .k3-task-b"); if (back) { await back.click(); await p.waitForTimeout(500); console.log(" back →", JSON.stringify(await info())); } else console.log(" NO BAR");
}
console.log("errors", errs);
await b.close();
