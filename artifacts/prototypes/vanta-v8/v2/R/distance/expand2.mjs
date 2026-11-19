import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(600);
for (const r of ["risks", "findings", "controls", "evidence", "poam"]) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(400);
  const row = await p.$("#main table [data-panel]"); if (!row) { console.log(r, "no panel rows"); continue; }
  await row.click(); await p.waitForTimeout(350);
  const before = await p.evaluate(() => location.hash);
  const btn = await p.$('#panel [aria-label="Open the full record"]');
  const info = btn ? await btn.evaluate((e) => ({ tag: e.tagName, attrs: [...e.attributes].map((a) => a.name + "=" + a.value).join(" ").slice(0, 200) })) : null;
  if (btn) { await btn.click(); await p.waitForTimeout(500); }
  const after = await p.evaluate(() => ({ hash: location.hash, panel: !document.getElementById("panel").hidden, toast: (document.querySelector(".toast, [role=status]") || {}).textContent || null, h: (document.querySelector("#main h1, #main h3") || {}).textContent }));
  console.log(r, before, "->", JSON.stringify(after), JSON.stringify(info));
}
await b.close();
