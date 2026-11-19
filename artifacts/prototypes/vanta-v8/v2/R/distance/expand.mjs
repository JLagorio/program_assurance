import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(600);
for (const r of ["risks", "findings"]) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(400);
  const row = await p.$("#main table [data-panel]"); await row.click(); await p.waitForTimeout(400);
  const ex = await p.evaluate(() => { const a = document.querySelector("#panel a[href], #panel [data-go], #panel button[aria-label*='ull'], #panel [aria-label*='Open']"); return a ? { href: a.getAttribute("href"), go: a.getAttribute("data-go"), label: a.getAttribute("aria-label") || a.textContent.trim().slice(0, 30) } : null; });
  console.log(r, "expand:", JSON.stringify(ex));
  const btn = await p.$("#panel [aria-label=\"Open the full record\"]");
  if (btn) { await btn.click(); await p.waitForTimeout(500); }
  const st = await p.evaluate(() => ({ hash: location.hash, panel: !document.getElementById("panel").hidden, h1: (document.querySelector("#main h1, #main h3")||{}).textContent }));
  console.log(r, "after:", JSON.stringify(st));
  await p.screenshot({ path: `${out}/i-${r}-expanded.png` });
}
await b.close();
