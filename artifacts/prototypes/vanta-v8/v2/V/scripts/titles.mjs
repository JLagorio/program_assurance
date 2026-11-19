// The page title's size on every route with the layer off (raw), by the element that draws it.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [, , build] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + build + "#home"); await p.waitForTimeout(300);
const routes = await p.evaluate(() => Object.keys(PA.S).filter((k) => !k.startsWith("after-") && !/^(before-after|nav-options|study)/.test(k)));
const agg = {};
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(5);
  const k = await p.evaluate((r) => { const main = document.getElementById("main"); PA.v2clean.off = true; PA.v2clean.snap(false); main.innerHTML = PA.S[r](); const h = main.querySelector("h1, h2, h3"); const out = h ? `${getComputedStyle(h).fontSize} ${h.tagName}.${h.className}` : "none"; PA.v2clean.off = false; PA.v2clean.snap(true); return out; }, r);
  (agg[k] = agg[k] || []).push(r);
}
console.log(Object.entries(agg).sort((a, b) => b[1].length - a[1].length).map(([k, rs]) => `${rs.length} × ${k}  (${rs.slice(0, 4).join(", ")})`).join("\n"));
await b.close();
