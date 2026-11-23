// usage: node dump.mjs <build> <width> <route> [eye code]   prints each table of the page (or of the preview) as text
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const build = path.resolve(process.argv[2]), W = +(process.argv[3] || 1728), route = process.argv[4], eye = process.argv[5] || "";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: 964 } });
p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
await p.evaluate((r) => { location.hash = r; }, route); await p.waitForTimeout(600);
if (eye) { await p.evaluate((c) => { const tr = [...document.querySelectorAll("#main .k3-table tbody tr")].find((t) => (t.querySelector(".k3-nm-c") || {}).innerText === c); const e = tr && tr.querySelector(".k3-eye"); if (e) e.click(); }, eye); await p.waitForTimeout(500); }
const out = await p.evaluate((root) => { const R = document.querySelector(root); if (!R) return "no root";
  const tx = (e) => e.innerText.replace(/\s+/g, " ").trim();
  const lines = [];
  if (root !== "#main") lines.push("FACTS " + [...R.querySelectorAll(".k3-pn > .k3-facts > div")].map(tx).join(" | "));
  for (const s of R.querySelectorAll(".k3-sec")) { const h = s.querySelector("h2"); lines.push("## " + tx(h) + "  [" + [...s.querySelectorAll(".k3-sec-a > *")].map(tx).join(",") + "]");
    for (const pp of s.querySelectorAll(":scope > p, :scope > .k3-facts")) lines.push("   p: " + tx(pp).slice(0, 200));
    const t = s.querySelector("table"); if (!t) continue; lines.push("   cols: " + [...t.querySelectorAll("thead th")].map((th) => tx(th) + ":" + Math.round(th.getBoundingClientRect().width)).join(" | ") + "  tableW " + Math.round(t.getBoundingClientRect().width) + " of " + Math.round(s.getBoundingClientRect().width));
    [...t.querySelectorAll("tbody tr")].slice(0, 4).forEach((tr) => lines.push("   " + Math.round(tr.getBoundingClientRect().height) + "px " + [...tr.children].map((td) => tx(td).slice(0, 70) + (td.scrollWidth > td.clientWidth + 1 || [...td.querySelectorAll("*")].some((x) => x.scrollWidth > x.clientWidth + 1) ? "…CUT" : "")).join(" | ")));
    const all = s.querySelector(".k3-pk-all"); if (all) lines.push("   " + tx(all) + " -> " + all.getAttribute("href")); }
  return lines.join("\n"); }, eye ? "#panel .k3-pn" : "#main");
console.log(out);
await b.close();
