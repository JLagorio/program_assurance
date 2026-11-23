import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const B = (await import("path")).resolve(process.argv[2]);
const route = process.argv[3], W = +process.argv[4], H = +process.argv[5], prefix = process.argv[6], sels = process.argv.slice(7);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: W, height: H } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await p.goto("file://" + B + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); });
await p.waitForTimeout(300);
await p.evaluate((r) => { location.hash = r; }, route); await p.waitForTimeout(700);
let i = 0;
for (const s of sels) { await p.evaluate((s) => { const el = document.querySelector(s); if (el) el.scrollIntoView({ block: "start" }); }, s); await p.waitForTimeout(250); await p.screenshot({ path: `${prefix}${++i}.jpg`, type: "jpeg", quality: 60 }); }
console.log(errs);
await b.close();
