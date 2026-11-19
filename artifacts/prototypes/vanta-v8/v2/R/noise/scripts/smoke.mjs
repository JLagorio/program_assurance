import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const lib = fs.readFileSync(new URL("./measure-lib.js", import.meta.url), "utf8");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs=[]; p.on("pageerror", e=>errs.push(String(e)));
await p.goto("file://" + path.resolve(process.argv[2]) + "#home"); await p.waitForTimeout(700); await p.evaluate(lib);
for (const r of process.argv.slice(3)) { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(500);
const m = await p.evaluate(() => window.__measure({ root: "#main", vh: 900 }));
console.log(r, JSON.stringify({ rect: m.rect, colours: m.colours, totals: m.totals, above: m.above, fonts: m.fonts.distinct, counts: m.counts, samples: m.samples, palette: m.palette.slice(0, 25) })); }
console.log("errs", errs); await b.close();
