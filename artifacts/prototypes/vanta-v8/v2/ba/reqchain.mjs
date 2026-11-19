// Which requirement's preview shows the fullest chain? node reqchain.mjs <html>
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto("file://" + path.resolve(process.argv[2]) + "#requirements"); await p.waitForTimeout(900);
const ids = await p.$$eval('#main [data-panel="v7p-req"]', (els) => [...new Set(els.map((e) => e.dataset.id))]);
console.log("requirements listed:", ids.length);
const res = [];
for (const id of ids.slice(0, 30)) {
  await p.evaluate((id) => { const el = document.querySelector(`#main [data-panel="v7p-req"][data-id="${CSS.escape(id)}"]`); el && el.click(); }, id);
  await p.waitForTimeout(250);
  const r = await p.evaluate(() => { const c = document.querySelector("#panel .v2f-chain"); if (!c) return null; return [...c.querySelectorAll("li")].map((li) => li.textContent.replace(/\s+/g, " ").trim().slice(0, 60)); });
  res.push([id, r]);
}
for (const [id, r] of res) console.log(id, "|", r ? r.join(" || ") : "no chain card");
await b.close();
