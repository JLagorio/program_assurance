// usage: node ev.mjs <build.html> <route> "<js expression>"   evaluates in the page with V3 on
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +(process.env.W || 1440), height: 900 } });
p.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
await p.goto("file://" + path.resolve(process.argv[2]) + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
await p.evaluate((r) => { location.hash = r; }, process.argv[3]); await p.waitForTimeout(350);
const out = await p.evaluate(process.argv[4]); console.log(typeof out === "string" ? out : JSON.stringify(out, null, 1));
await b.close();
