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
  const V3 = PA.v3, C3 = PA.v3c, V = PA.v2;
  const t0 = performance.now(); let n = 0; for (const r of C3.rows()) { const v = V.chain.view(r.code); n += v.oa || 0; } const t1 = performance.now();
  const sspOa = C3.rows().filter((r) => (PA.SSP.ctl(r.code) || {}).oa !== (V.chain.view(r.code) || {}).oa).length;
  const a = V3.fact("assessments"); const res = V3.fact("results");
  return { ms: t1 - t0, n, sspOa, ring: PA.v3k.ring(3, 5, "objectives judged"), assessments: JSON.stringify(a).slice(0, 1500), results: JSON.stringify(res).slice(0, 800), campAu: V3.fact("campaignOf", "AU-14"), objs: JSON.stringify((PA.v3r.objectivesOf("AU-14") || []).slice(0, 2)).slice(0, 600) };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
