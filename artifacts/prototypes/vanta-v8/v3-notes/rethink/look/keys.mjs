import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage();
await p.goto("file://" + process.argv[2] + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
const out = await p.evaluate(() => {
  const sh = (v) => (Array.isArray(v) ? `[${v.length}]` + (v[0] && typeof v[0] === "object" ? " of {" + Object.keys(v[0]).slice(0, 12).join(",") + "}" : "") : typeof v === "function" ? "fn" : v && typeof v === "object" ? "{" + Object.keys(v).slice(0, 14).join(",") + "}" : typeof v);
  const o = {};
  for (const k of ["v7p", "SSP", "v2host", "v2life", "v8bIC", "v3f", "v2reqs", "sctm", "v2hubs", "v8people"]) { const x = PA[k]; o[k] = x ? Object.fromEntries(Object.keys(x).slice(0, 40).map((kk) => [kk, sh(x[kk])])) : null; }
  o.facts = Object.keys(PA.v3.facts);
  o.v2chain = PA.v2.chain ? Object.keys(PA.v2.chain) : null;
  o.Pkinds = Object.keys(PA.P).join(" ");
  o.Mkeys = Object.keys(PA.M).length;
  return o;
});
console.log(JSON.stringify(out, null, 1));
await b.close();
