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
  const C3 = PA.v3c, V3 = PA.v3, S3 = PA.v3s, out = { set: [], withLibAndParams: [], facts: Object.keys(V3.facts || {}) };
  const libOf = (comp) => { const c = S3 && S3.component ? S3.component(comp) : null; return c && c.lib ? c.lib : null; };
  for (const r of C3.rows()) {
    if (!r.hasParams) continue;
    const pp = PA.P["k3c-control"] && V3.force(true, () => PA.P["k3c-control"](r.code));
    const t = document.createElement("template"); t.innerHTML = pp ? String(pp.body || "") : "";
    const ps = [...t.content.querySelectorAll(".k3c-pv")].map((el) => ({ title: el.getAttribute("title"), unset: el.classList.contains("unset"), v: el.textContent.trim() }));
    const setN = ps.filter((x) => !x.unset).length;
    const libC = C3.compsOf(r.code).filter((c) => libOf(c));
    if (setN) out.set.push([r.code, r.status, setN, ps.length, libC.length, JSON.stringify(ps.slice(0, 2))]);
    if (libC.length && ps.length) out.withLibAndParams.push([r.code, r.status, ps.length, setN, libC.join(","), !!(PA.SSP.ctl(r.code) || {}).n]);
  }
  out.hasParamsN = C3.rows().filter((r) => r.hasParams).length;
  const ss = PA.SSP; out.sspKeys = Object.keys(ss).slice(0, 60);
  out.au14 = { camp: V3.fact("campaignOf", "AU-14"), objs: (PA.v3r && PA.v3r.objectivesOf ? PA.v3r.objectivesOf("AU-14") : []).map((o) => o.label + " " + (o.methods || []).join("/")), ctl: PA.SSP.ctl("AU-14") };
  return out;
});
console.log("hasParams", r.hasParamsN, "set", r.set.length); for (const x of r.set.slice(0, 30)) console.log("SET", x.join(" | "));
console.log("lib+params", r.withLibAndParams.length); for (const x of r.withLibAndParams.slice(0, 30)) console.log("LP", x.join(" | "));
console.log("facts", r.facts.join(" ")); console.log("sspKeys", r.sspKeys.join(" "));
console.log(JSON.stringify(r.au14).slice(0, 1500));
await b.close();
