import { createRequire } from "node:module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); p.setDefaultTimeout(120000);
const heads = () => p.evaluate(() => { const t = document.querySelector("#main table"); return t ? [...t.querySelectorAll("thead th")].map((th) => th.innerText.trim()).filter(Boolean).join(" | ") : null; });
const statuses = () => p.evaluate(() => [...document.querySelectorAll("#main table tbody tr")].slice(0, 8).map((tr) => tr.innerText.replace(/\s+/g, " ").slice(0, 70)));
for (const [tag, html] of [["v1", process.argv[2]], ["v2", process.argv[3]]]) {
  await p.goto("file://" + html + "#evidence", { timeout: 180000 }); await p.waitForTimeout(1200);
  console.log(tag, "evidence All:", await heads());
  await p.locator("#main").getByText(/^Needs revision/).first().click().catch((e) => console.log("nr err")); await p.waitForTimeout(600);
  console.log(tag, "evidence Needs revision:", await heads(), "| rows:", (await statuses()).slice(0, 2).join(" ¦ "));
  await p.evaluate(() => { location.hash = "requirements"; }); await p.waitForTimeout(800);
  console.log(tag, "requirements:", await heads());
  await p.evaluate(() => { location.hash = "permissions"; }); await p.waitForTimeout(800);
  console.log(tag, "permissions first table:", await heads());
  await p.evaluate(() => { location.hash = "people"; }); await p.waitForTimeout(800);
  console.log(tag, "people:", await heads());
}
await b.close();
