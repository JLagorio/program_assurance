// node errs.mjs <html> : open every route my files draw (and their tabs) at 1440 and 390; report page errors, empty screens and sideways scroll at 390.
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = "file://" + path.resolve(process.argv[2]);
const b = await chromium.launch();
for (const w of [1440, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: w > 600 ? 900 : 844 } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(file + "#home"); await p.waitForTimeout(500);
  const routes = await p.evaluate(() => Object.keys(window.PA.S).filter((r) => /^(campaign|controls$|control-si2|checks$|check-|policies$|ppsm|stigs-|ssp$|suppliers)/.test(r)));
  const bad = [];
  for (const r of routes) {
    const n = errs.length;
    await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(r === "ssp" ? 1100 : 120);
    const o = await p.evaluate(() => ({ h: location.hash.slice(1), doc: document.documentElement.scrollWidth > innerWidth + 1, len: document.getElementById("main").innerText.length, nd: /Not drawn yet/.test(document.getElementById("main").innerText) }));
    if (errs.length > n || o.nd || o.len < 50 || (w < 600 && o.doc)) bad.push(`${r}: ${errs.slice(n).join(" | ")} ${o.nd ? "not drawn" : ""} ${o.len < 50 ? "empty" : ""} ${w < 600 && o.doc ? "sideways scroll" : ""}`);
  }
  console.log(`${w}: ${routes.length} routes, ${bad.length} problems`); bad.forEach((x) => console.log("  " + x));
  await p.close();
}
await b.close();
