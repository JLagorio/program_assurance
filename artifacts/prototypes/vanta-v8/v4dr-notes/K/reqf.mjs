import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const B = (await import("path")).resolve(process.argv[2]);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const bad = []; p.on("requestfailed", (r) => { if (!/fonts\./.test(r.url())) bad.push(location + " " + r.url().slice(-90)); });
let location = "";
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await p.goto("file://" + B + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); });
for (const r of ["dr-components", "before-after-drata", "before-after"]) { location = r; await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(800); }
console.log(bad.slice(0, 6).join("\n") || "none"); await b.close();
