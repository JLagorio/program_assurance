// For each register's first table: columns whose visible cells all read the same, the count repeated above the table, and the clipped edge
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, ...routes] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(600);
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(400);
  const m = await p.evaluate(() => {
    const main = document.getElementById("main"); const f = main.querySelector(".frame"); if (!f) return null;
    const t = f.querySelector("table"); const heads = [...t.querySelectorAll("thead th")].map((th) => th.innerText.replace(/\s+/g, " ").trim());
    const rows = [...t.querySelectorAll("tbody tr")].filter((tr) => tr.children.length >= heads.length - 1).slice(0, 25);
    const same = [];
    heads.forEach((h, i) => { if (!h) return; const vals = rows.map((tr) => (tr.children[i] ? tr.children[i].innerText.replace(/\s+/g, " ").trim() : "")); const uniq = [...new Set(vals)]; if (rows.length >= 5 && uniq.length === 1) same.push(`${h} = "${uniq[0]}" (${rows.length} rows)`); });
    // text above the table
    const top = f.getBoundingClientRect().top; const above = [...main.querySelectorAll("*")].filter((e) => e.children.length === 0 && e.getBoundingClientRect().bottom < top && e.getBoundingClientRect().height > 0).map((e) => e.textContent.trim()).filter(Boolean).join(" | ");
    const clip = t.scrollWidth - f.clientWidth;
    return { heads: heads.filter(Boolean).length, rows: rows.length, same, clip, above: above.slice(0, 600) };
  });
  console.log("##", r, JSON.stringify(m));
}
await b.close();
