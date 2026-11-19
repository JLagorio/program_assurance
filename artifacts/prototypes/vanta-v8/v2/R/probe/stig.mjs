import { createRequire } from "node:module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); p.setDefaultTimeout(120000);
for (const html of process.argv.slice(2)) {
  await p.goto("file://" + html + "#stigs-mission-computer-rhel9", { timeout: 180000 }); await p.waitForTimeout(1200);
  const rows = await p.evaluate(() => { const qv = [...document.querySelectorAll("#main .qv")].filter((e) => e.getBoundingClientRect().height > 0); const tops = [...new Set(qv.map((e) => Math.round(e.getBoundingClientRect().top)))]; return { quickViews: qv.map((e) => e.innerText.trim().replace(/\s+/g, " ")), rows: tops.length }; });
  await p.evaluate(() => { location.hash = "risks"; }); await p.waitForTimeout(800);
  await p.click("#main table tbody tr:first-child [role=checkbox], #main table tbody tr:first-child input[type=checkbox]").catch(() => {}); await p.waitForTimeout(400);
  const bar = await p.evaluate(() => { const t = document.getElementById("main").innerText.replace(/\s+/g, " "); const i = t.search(/\d+ selected/); return i >= 0 ? t.slice(i, i + 160) : null; });
  console.log(html.includes("v2") ? "v2" : "v1", JSON.stringify(rows), "| risks bar:", bar);
}
await b.close();
