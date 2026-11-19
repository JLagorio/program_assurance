// Table headings of every screen in two builds: node coldiff.mjs <base.html> <new.html> <out.json>
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [baseF, newF, outF] = process.argv.slice(2);
const b = await chromium.launch();
async function heads(file) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("file://" + path.resolve(file) + "#home"); await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    const out = {};
    for (const k of Object.keys(PA.S)) {
      if (k.startsWith("after-")) continue;
      let h = ""; try { h = PA.S[k](); } catch (e) { continue; }
      if (typeof h !== "string") continue;
      const t = document.createElement("template"); t.innerHTML = h;
      const tabs = [...t.content.querySelectorAll("table")].map((tb) => tb.tHead && tb.tHead.rows[0] ? [...tb.tHead.rows[0].cells].map((c) => { const x = c.cloneNode(true); x.querySelectorAll(".ak-co,[aria-hidden='true'],.ex").forEach((y) => y.remove()); return x.textContent.trim(); }) : null).filter(Boolean);
      if (tabs.length) out[k] = tabs;
    }
    return out;
  });
  await p.close(); return r;
}
const A = await heads(baseF), B = await heads(newF);
const diff = [];
for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
  const a = A[k] || [], bb = B[k] || [];
  for (let i = 0; i < Math.max(a.length, bb.length); i++) {
    const x = a[i] || [], y = bb[i] || [];
    const gone = x.filter((h) => h && !y.includes(h)), came = y.filter((h) => h && !x.includes(h));
    if (gone.length || came.length) diff.push({ route: k, table: i, kept_now: came, cut_now: gone });
  }
}
fs.writeFileSync(outF, JSON.stringify(diff, null, 1));
for (const d of diff) console.log(d.route.padEnd(34), "t" + d.table, d.kept_now.length ? "now kept: " + d.kept_now.join(", ") : "", d.cut_now.length ? "now cut: " + d.cut_now.join(", ") : "");
console.log("routes with a difference:", new Set(diff.map((d) => d.route)).size);
await b.close();
