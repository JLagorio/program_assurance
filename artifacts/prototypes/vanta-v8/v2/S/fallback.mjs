// Agent S: the Analysis sheet without WebAssembly (a page whose policy refuses it) must answer as IronCalc does.
// node fallback.mjs <build.html>
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = process.argv[2];
const b = await chromium.launch();
async function values(noWasm) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  if (noWasm) await p.addInitScript(() => { const fail = () => Promise.reject(new Error("WebAssembly refused by policy")); WebAssembly.instantiate = fail; WebAssembly.instantiateStreaming = fail; WebAssembly.compile = fail; });
  await p.goto("file://" + file + "#sctm-analysis"); await p.waitForSelector("#sx-body .sx-c"); await p.waitForTimeout(800);
  const r = await p.evaluate(() => { const st = window.PA.sctm.state; const out = {}; for (const [rid, cols] of Object.entries(st.calc.sheets.analysis)) for (const [cid, c] of Object.entries(cols)) out[rid + cid] = c.display; return { engine: st.engine, out, status: document.getElementById("sx-status").textContent }; });
  await p.close(); return { ...r, errs };
}
const a = await values(false), m = await values(true);
const keys = Object.keys(m.out), diff = keys.filter((k) => a.out[k] !== m.out[k]);
console.log("ironcalc engine:", a.engine, "| fallback engine:", m.engine, "|", m.status.split("·").pop().trim());
console.log(diff.length ? "FAIL " + diff.length + " cells differ: " + diff.slice(0, 8).map((k) => `${k} ${a.out[k]} vs ${m.out[k]}`).join("; ") : `PASS all ${keys.length} formula cells agree`);
console.log("errors", a.errs, m.errs);
await b.close();
