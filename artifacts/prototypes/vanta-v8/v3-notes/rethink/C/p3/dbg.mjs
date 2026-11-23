import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const build = path.resolve(process.argv[2]), W = +(process.argv[3] || 1728), route = process.argv[4], js = process.argv[5];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: +(process.env.H || 964) } });
p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
await p.evaluate((r) => { location.hash = r; }, route); await p.waitForTimeout(600);
const r = await p.evaluate(js); console.log(typeof r === "string" ? r : JSON.stringify(r, null, 1));
if (process.env.SHOT) { await p.waitForTimeout(300); await p.screenshot({ path: process.env.SHOT, type: "jpeg", quality: 60 }); }
await b.close();
