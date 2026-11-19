// Do columns come and go as a register's quick views change? node comego.mjs <html> route...
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, ...routes] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(600);
const heads = () => p.evaluate(() => { const t = document.querySelector("#main table"); if (!t || !t.tHead) return null; return [...t.tHead.rows[0].cells].map((c) => { const x = c.cloneNode(true); x.querySelectorAll(".ak-co,[aria-hidden='true']").forEach((y) => y.remove()); return x.textContent.trim(); }).filter(Boolean); });
let flagged = 0;
for (const r of routes) {
  await p.evaluate(() => { location.hash = "home"; }); await p.waitForTimeout(120);
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(350);
  const n = await p.evaluate(() => document.querySelectorAll("#main .views .qv, #main .views .v2-pop .qv").length);
  const seen = []; const first = await heads(); if (!first) { console.log("—", r, "no table"); continue; }
  seen.push(["(open)", first]);
  for (let i = 0; i < n; i++) {
    const label = await p.evaluate((i) => { const q = [...document.querySelectorAll("#main .views .qv, #main .views .v2-pop .qv")][i]; if (!q) return null; const more = q.closest("details"); if (more) more.open = true; const l = q.textContent.trim().replace(/\s+/g, " "); q.click(); return l; }, i);
    await p.waitForTimeout(250);
    if (label == null) continue;
    const h = await heads(); if (h) seen.push([label, h]);
  }
  const all = [...new Set(seen.flatMap(([, h]) => h))];
  const varying = all.filter((h) => seen.some(([, x]) => !x.includes(h)) && seen.some(([, x]) => x.includes(h)));
  if (varying.length) flagged++;
  console.log(varying.length ? "COMEGO" : "ok    ", r.padEnd(18), `${seen.length} views`, varying.length ? JSON.stringify(varying.map((h) => [h, seen.filter(([, x]) => !x.includes(h)).map(([l]) => l).slice(0, 4)])) : "");
}
console.log("flagged", flagged, "errors:", errors.length ? [...new Set(errors)].slice(0, 4).join("\n") : "none");
await b.close();
