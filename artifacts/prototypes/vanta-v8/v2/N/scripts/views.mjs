// Quick views' markup on registers: node views.mjs <html> route...
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, ...routes] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(500);
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(350);
  const d = await p.evaluate(() => {
    const m = document.getElementById("main");
    const vs = m.querySelector(".views");
    const qv = vs ? vs.outerHTML.slice(0, 700) : null;
    const pagers = [...m.querySelectorAll("[class*='pager'], [class*='foot']")].map((x) => x.className + ": " + x.textContent.trim().replace(/\s+/g, " ").slice(0, 60)).slice(0, 4);
    return { qv, pagers, tables: m.querySelectorAll("table").length };
  });
  console.log(r, JSON.stringify(d));
}
await b.close();
