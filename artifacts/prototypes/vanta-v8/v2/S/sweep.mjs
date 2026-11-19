// Agent S: every route drawn once (page errors), and the routes S touched at 390 (no sideways page scroll). node sweep.mjs <build.html>
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; let cur = ""; p.on("pageerror", (e) => errs.push(cur + ": " + e.message));
await p.goto("file://" + file + "#home"); await p.waitForTimeout(500);
const routes = await p.evaluate(() => Object.keys(window.PA.S));
for (const r of routes) { cur = r; await p.evaluate((x) => { location.hash = x; }, r); await p.waitForTimeout(25); }
await p.waitForTimeout(300);
console.log(`${routes.length} routes drawn; page errors: ${errs.length}`); errs.slice(0, 10).forEach((e) => console.log("  " + e));
const q = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
const e2 = []; q.on("pageerror", (e) => e2.push(e.message));
for (const r of ["sctm", "sctm-controls", "sctm-requirements", "sctm-evidence", "sctm-findings", "sctm-risks", "sctm-analysis", "requirements", "controls", "ssp"]) {
  await q.goto("file://" + file + "#" + r); await q.waitForTimeout(500);
  const w = await q.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  console.log(`${w[0] <= w[1] + 1 ? "PASS" : "FAIL"} 390 ${r}: page ${w[0]} / ${w[1]} px`);
}
console.log("390 page errors:", e2.length, e2.slice(0, 5));
await b.close();
