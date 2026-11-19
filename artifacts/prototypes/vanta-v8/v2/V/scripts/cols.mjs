// Every column rule 7 cuts, by route, so the cuts can be read and judged.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [, , build] = process.argv;
const b = await chromium.launch(); const p = await b.newPage();
await p.goto("file://" + build + "#home"); await p.waitForTimeout(300);
console.log(await p.evaluate(() => {
  const PA = window.PA, out = [];
  const heads = (html) => { const t = document.createElement("template"); t.innerHTML = html; return [...t.content.querySelectorAll("table")].map((tb) => [...tb.querySelectorAll("thead th")].map((x) => x.textContent.replace(/\s+/g, " ").trim())); };
  for (const r of Object.keys(PA.S)) {
    if (r.startsWith("after-") || /^(before-after|nav-options|study)/.test(r)) continue;
    PA.v2clean.off = true; let raw; try { raw = heads(PA.S[r]()); } catch (e) { continue; } PA.v2clean.off = false;
    const cl = heads(PA.S[r]());
    raw.forEach((h, i) => { const c = cl[i] || []; const gone = h.filter((x) => !c.includes(x)); if (gone.length && h.length !== c.length) out.push(`${r}: ${gone.join(", ")}`); });
  }
  PA.v2clean.off = false;
  return out.join("\n");
}));
await b.close();
