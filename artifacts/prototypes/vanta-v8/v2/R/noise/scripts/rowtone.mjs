// Toned cells per table row (first table on each page, first 8 body rows): cells that paint any non-grey colour, avatars and checkboxes aside.
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(process.argv[2]) + "#home"); await p.waitForTimeout(600);
const nav = await p.evaluate(() => PA.navItems().map(([r]) => r).filter((r) => !["study", "before-after", "nav-options"].includes(r)));
const res = {};
for (const r of [...nav, "campaign", "control-si2", "component-mc", "stigs-mission-computer-rhel9"]) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(400);
  res[r] = await p.evaluate(() => {
    const grey = (s) => { const m = s.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?/); if (!m) return true; const a = m[4] === undefined ? 1 : +m[4]; if (a < 0.05) return true; const v = [+m[1], +m[2], +m[3]]; return Math.max(...v) - Math.min(...v) < 24; };
    const t = [...document.querySelectorAll("#main table")].find((x) => x.querySelector("tbody tr") && x.getBoundingClientRect().height > 0);
    if (!t) return null;
    const rows = [...t.querySelectorAll("tbody tr")].filter((x) => x.getBoundingClientRect().height > 0).slice(0, 8);
    const per = rows.map((tr) => [...tr.children].filter((td) => [td, ...td.querySelectorAll("*")].some((e) => { if (e.closest(".avatar,input,[type=checkbox]") || e.matches(".avatar")) return false; const cs = getComputedStyle(e); const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim()); return (own && !grey(cs.color)) || !grey(cs.backgroundColor) || (e instanceof SVGElement && cs.stroke !== "none" && !grey(cs.stroke)) || (parseFloat(cs.borderTopWidth) > 0 && !grey(cs.borderTopColor) && e.getBoundingClientRect().width < 40); })).length);
    const cols = t.querySelectorAll("thead th").length;
    per.sort((a, b) => a - b);
    return { cols, rows: per.length, median: per[Math.floor(per.length / 2)], max: per[per.length - 1] };
  });
}
fs.writeFileSync(process.argv[3], JSON.stringify(res, null, 1));
for (const [r, v] of Object.entries(res).filter(([, v]) => v).sort((a, b) => b[1].median - a[1].median || b[1].max - a[1].max)) console.log(r.padEnd(30), "toned cells/row median", v.median, "max", v.max, "of", v.cols, "columns");
await b.close();
