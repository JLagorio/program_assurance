import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, ...routes] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(450);
  console.log(r.padEnd(26), JSON.stringify(await p.evaluate(() => { const nav = document.getElementById("nav"), full = document.getElementById("proto").classList.contains("fullwin"); const on = nav.querySelector("a.item.on"); const m = document.getElementById("main"); return { hash: location.hash.slice(1), full, menu: !!nav.querySelector("a.item[href='#system']"), on: on ? on.innerText.trim() : null, h1: (m.querySelector("h1") || {}).innerText, tabs: [...m.querySelectorAll(".tabs a, .a-tabs a, .ak-tabs a, [role=tablist] a")].slice(0, 8).map((a) => a.innerText.trim()).join(" | ").slice(0, 120), back: (document.querySelector(".fw-back, [data-fw-back], .ssp-back, .ed-back") || {}).innerText }; })));
}
console.log("errors", errs.slice(0, 3));
await b.close();
