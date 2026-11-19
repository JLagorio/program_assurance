// node look.mjs <html> <outDir> <width> route[@mode] …  — screenshots with page errors reported
import { createRequire } from "module"; import fs from "fs"; import path from "path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out, w, ...routes] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +w > 600 ? 1000 : 844 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e).slice(0, 300)));
await p.goto("file://" + html + "#home", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(400);
for (const r0 of routes) {
  const [r, click] = r0.split("@");
  await p.evaluate((r) => { location.hash = "#" + r; }, r); await p.waitForTimeout(500);
  if (click) { const el = await p.$(click); if (el) { await el.click(); await p.waitForTimeout(300); } else errs.push("no " + click); }
  const ov = await p.evaluate(() => ({ doc: document.documentElement.scrollWidth > innerWidth + 1, main: (() => { const m = document.getElementById("main"); return m ? m.scrollWidth > m.clientWidth + 1 : null; })() }));
  await p.screenshot({ path: path.join(out, (r + (click ? "-click" : "")).replace(/[^a-z0-9-]/gi, "_") + "-" + w + ".png") });
  console.log(r0, JSON.stringify(ov));
}
console.log("errors:", errs.length ? errs : "none");
await b.close();
