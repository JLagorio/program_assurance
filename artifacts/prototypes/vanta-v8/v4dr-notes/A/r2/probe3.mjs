import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on("pageerror", (e) => console.log("ERR", e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
await p.evaluate(() => { location.hash = "dr-controls"; }); await p.waitForTimeout(500);
const r = await p.evaluate(() => {
  const C3 = PA.v3c, V3 = PA.v3, out = [];
  for (const code of ["SA-24", "AC-7", "AU-11", "CA-7", "AC-2(3)", "RA-5"]) {
    const pp = PA.P["k3c-control"] && V3.force(true, () => PA.P["k3c-control"](code));
    const t = document.createElement("template"); t.innerHTML = pp ? String(pp.body || "") : "";
    const ps = [...t.content.querySelectorAll(".k3c-pv")].map((el) => ({ title: el.getAttribute("title"), cls: el.className, v: el.textContent.trim() }));
    const stmt = (t.content.querySelector(".k3c-stmt, .k3c-text") || {}).textContent || "";
    out.push({ code, comps: C3.compsOf(code), ps, n: (PA.SSP.ctl(code) || {}).n, cmp: PA.dra.compareRows ? (C3.compsOf(code)[0] ? PA.dra.compareRows(code, C3.compsOf(code)[0]) : null) : null, changed: C3.compsOf(code).map((c) => PA.dra.changedFromLib(code, c)) });
  }
  return out;
});
for (const x of r) console.log(JSON.stringify(x, null, 0).slice(0, 2500), "\n");
await b.close();
