import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [, , build, outDir, width] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +width || 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("file://" + build + "#home"); await p.waitForTimeout(300);
for (const [r, label] of [["risks", "risk"], ["controls", "control"], ["findings", "issue"]]) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(250);
  const row = await p.$("#main tbody tr[data-panel], #main tbody tr [data-panel], #main [data-panel]");
  if (row) { await row.click({ position: { x: 60, y: 10 } }).catch(() => {}); await p.waitForTimeout(400); }
  const info = await p.evaluate(() => { const pn = document.getElementById("panel"); return { open: !pn.hidden, label: pn.querySelector(".bar-top span") && pn.querySelector(".bar-top span").textContent, inks: pn.querySelectorAll(".btn.ink").length, pills: pn.querySelectorAll(".pill").length }; });
  console.log(r, JSON.stringify(info));
  await p.screenshot({ path: `${outDir}/panel-${width || 1440}-${label}.png` });
}
console.log("errors", errs);
await b.close();
