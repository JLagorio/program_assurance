import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const build = path.resolve(process.argv[2]);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const r of process.argv.slice(3)) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(300);
  console.log(r, JSON.stringify(await p.evaluate(() => { const out = []; const W = document.documentElement.clientWidth; document.querySelectorAll("body *").forEach((e) => { if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== "visible" && !e.closest(".tablebox, .k3-fs, svg") ) out.push((e.id || e.className.toString().slice(0, 40)) + " " + e.tagName + " sw" + e.scrollWidth + " cw" + e.clientWidth + " " + getComputedStyle(e).overflowX); }); return { docSW: document.documentElement.scrollWidth, W, out: out.slice(0, 10) }; })));
}
await b.close();
