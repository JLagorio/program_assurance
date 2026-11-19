// node shots.mjs <html> <outDir> <width> route… : screenshot each route, report page errors and sideways overflow.
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out, w, ...routes] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +w > 600 ? 900 : 844 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(500);
const full = process.env.FULL === "1";
for (const r of routes) {
  const before = errs.length;
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(r === "ssp" ? 1200 : 450);
  const o = await p.evaluate(() => { const m = document.getElementById("main"); const wide = [...document.querySelectorAll("#main *")].filter((e) => { const b = e.getBoundingClientRect(); return b.right > innerWidth + 1 && b.width > 0 && getComputedStyle(e).position !== "fixed"; }).slice(0, 3).map((e) => e.tagName + "." + (e.className && e.className.baseVal === undefined ? String(e.className).slice(0, 40) : "")); return { doc: document.documentElement.scrollWidth > innerWidth + 1, main: m.scrollWidth > m.clientWidth + 2, hash: location.hash, wide }; });
  await p.screenshot({ path: `${out}/s-${w}-${r}.png`, fullPage: full });
  console.log(r, JSON.stringify(o), errs.length > before ? "ERR " + errs.slice(before).join(" | ") : "");
}
await b.close();
