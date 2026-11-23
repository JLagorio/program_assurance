import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); });
for (const [r, f, y] of [["dr-components", "gal1", 0], ["dr-components", "gal2", 900], ["dr-components", "gal3", 1800], ["dr-components", "gal4", 2700], ["before-after-drata", "tab1", 0], ["before-after-drata", "tab2", 1100]]) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(600);
  await p.evaluate((y) => window.scrollTo(0, y), y); await p.evaluate((y) => { const m = document.getElementById("main"); if (m) m.scrollTop = y; }, y); await p.waitForTimeout(200);
  await p.screenshot({ path: `${out}/${f}.jpg`, type: "jpeg", quality: 60 });
}
console.log("errors", errs.length, errs.slice(0, 2));
await b.close();
