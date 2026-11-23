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
  const C3 = PA.v3c, V = PA.v2, out = { byStatus: {}, cands: [], params: [], keys: Object.keys(C3.rows()[0]) };
  const rows = C3.rows();
  for (const r of rows) {
    const v = (V.chain && V.chain.view(r.code)) || {};
    out.byStatus[r.status] = (out.byStatus[r.status] || 0) + 1;
    if ((v.ob || 0) === 5) out.cands.push([r.code, r.status, v.ob, v.om, r.oe, v.oa, C3.compsOf(r.code).length, C3.reqsOf(r.code).length, C3.evOf(r.code).length]);
  }
  out.viewKeys = Object.keys(V.chain.view(rows[0].code));
  out.judged = rows.map((r) => [r.code, PA.v3.fact ? (() => { try { return PA.v3.fact("judgedN", r.code); } catch (e) { return null; } })() : null]).filter((x) => x[1] && x[1].n).slice(0, 20);
  return out;
});
console.log(JSON.stringify({ byStatus: r.byStatus, keys: r.keys, viewKeys: r.viewKeys, judged: r.judged }, null, 0));
console.log("ob=5 count", r.cands.length);
for (const c of r.cands.slice(0, 60)) console.log(c.join(" "));
await b.close();
