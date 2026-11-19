// Text the visual layer makes larger: each route drawn with the layer off and on; any text whose size grew by more than 1px.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [, , build] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + build + "#home"); await p.waitForTimeout(300);
const routes = await p.evaluate(() => Object.keys(PA.S).filter((k) => !k.startsWith("after-") && !/^(before-after|nav-options|study)/.test(k)));
const grew = {};
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(10);
  const res = await p.evaluate((r) => {
    const main = document.getElementById("main");
    const sizes = () => { const m = new Map(); for (const el of main.querySelectorAll("*")) { if (el.children.length) continue; const t = el.textContent.trim().slice(0, 40); if (!t) continue; const k = el.tagName + "|" + t; if (!m.has(k)) m.set(k, [parseFloat(getComputedStyle(el).fontSize), (el.className && el.className.baseVal === undefined ? el.className : "")]); } return m; };
    PA.v2clean.off = true; PA.v2clean.snap(false); main.innerHTML = PA.S[r](); const a = sizes();
    PA.v2clean.off = false; PA.v2clean.snap(true); main.innerHTML = PA.S[r](); const b2 = sizes();
    const out = [];
    for (const [k, [v, c]] of b2) { const o = a.get(k); if (o && v - o[0] > 1.01) out.push(`${o[0]}→${v} ${c} «${k.split("|")[1]}»`); }
    return out;
  }, r);
  if (res.length) grew[r] = res;
}
const all = Object.entries(grew);
console.log(all.length + " routes with text grown by more than 1px");
const agg = {};
for (const [r, list] of all) for (const x of list) { const k = x.replace(/«.*»/, "").trim(); (agg[k] = agg[k] || []).push(r); }
console.log(Object.entries(agg).sort((a, b) => b[1].length - a[1].length).slice(0, 30).map(([k, rs]) => `${rs.length} × ${k}  (${rs.slice(0, 3).join(", ")})`).join("\n"));
await b.close();
