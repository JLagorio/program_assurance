import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const B = (await import("path")).resolve(process.argv[2]);
const route = process.argv[3] || "dr-components", W = +(process.argv[4] || 1440), out = process.argv[5] || "shot.jpg", full = process.argv[6] === "full";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: W, height: W < 600 ? 844 : 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await p.goto("file://" + B + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); });
await p.waitForTimeout(300);
await p.evaluate((r) => { location.hash = r; }, route); await p.waitForTimeout(600);
if (process.argv[7]) { await p.evaluate((s) => { const el = document.querySelector(s); if (el) el.scrollIntoView(); }, process.argv[7]); await p.waitForTimeout(200); }
await p.screenshot({ path: out, type: "jpeg", quality: 60, fullPage: full });
const info = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, mw: document.getElementById("main").scrollWidth, cw: document.getElementById("main").clientWidth, h1: (document.querySelector("#main h1") || {}).textContent }));
console.log(JSON.stringify(info), errs);
await b.close();
