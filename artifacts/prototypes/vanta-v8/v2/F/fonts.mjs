// node fonts.mjs <build> route… — the size/weight pairs above the fold in #main, with where each is used (the noise review's rule).
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const html = path.resolve(process.argv[2]); const routes = process.argv.slice(3);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + html + "#home"); await p.waitForTimeout(400);
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(600);
  const out = await p.evaluate(() => {
    const root = document.getElementById("main"), R = root.getBoundingClientRect(), vh = innerHeight;
    const m = new Map();
    for (const el of root.querySelectorAll("*")) {
      if (!el.getClientRects().length) continue;
      const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.nodeValue.trim()).length; if (!own) continue;
      const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      if (!(r.top < vh && r.bottom > Math.max(0, R.top))) continue;
      const k = `${parseFloat(cs.fontSize)}px/${cs.fontWeight}`;
      const e = m.get(k) || { n: 0, eg: new Set() }; e.n++; if (e.eg.size < 4) e.eg.add((el.className && typeof el.className === "string" ? el.className.split(" ")[0] : el.tagName.toLowerCase()) + ":" + el.textContent.trim().slice(0, 24)); m.set(k, e);
    }
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n).map(([k, v]) => `${k} ×${v.n}  ${[...v.eg].join(" | ")}`);
  });
  console.log(`\n${r}: ${out.length} pairs`); out.forEach((l) => console.log("  " + l));
}
await b.close();
