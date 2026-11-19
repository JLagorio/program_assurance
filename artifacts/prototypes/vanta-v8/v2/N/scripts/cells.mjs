// Print a register's head and first row cells' markup: node cells.mjs <html> route [colIndex...]
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, r, ...cols] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(500);
await p.evaluate(() => { PA.v2clean.off = true; });
await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(400);
const d = await p.evaluate((cols) => {
  const t = document.querySelector("#main table");
  const head = t.tHead.rows[0], row = t.tBodies[0].rows[0], row2 = t.tBodies[0].rows[1];
  const views = [...document.querySelectorAll("#main .qv, #main .ak-tab, #main [role=tab]")].map((x) => x.textContent.trim().replace(/\s+/g, " "));
  return { views, head: head.outerHTML.slice(0, 1500), cells: (cols.length ? cols.map(Number) : [...row.cells].map((_, i) => i)).map((i) => `[${i}] ${row.cells[i].outerHTML.slice(0, 700)}`), tr: row.outerHTML.slice(0, 300), pager: (t.closest(".frame, [class*='tbl'], [class*='table']") || t.parentElement).parentElement.innerHTML.match(/<div class="[^"]*pager[^"]*"[\s\S]{0,300}/)?.[0] };
}, cols);
console.log(JSON.stringify(d, null, 1));
await b.close();
