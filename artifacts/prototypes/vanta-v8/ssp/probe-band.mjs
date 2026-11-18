import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(process.argv[2]) + "#home"); await p.waitForTimeout(500);
for (const r of ["campaign", "campaign-findings", "campaign-r1", "campaign-r3-comments", "assessments", "after-audit-record-r2", "home"]) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(250);
  console.log(r.padEnd(24), "→", (await p.evaluate(() => location.hash)).padEnd(24), "band:", await p.evaluate(() => document.getElementById("proto").classList.contains("moded")));
}
await p.evaluate(() => { location.hash = "campaign"; }); await p.waitForTimeout(300);
await p.screenshot({ path: process.argv[3] });
await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
console.log("390 overflow on campaign:", await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth || document.getElementById("main").scrollWidth > document.getElementById("main").clientWidth + 1));
await b.close();
