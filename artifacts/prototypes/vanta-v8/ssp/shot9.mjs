// Screenshot routes of the prototype at one width: node shot9.mjs <html> <outDir> <width> route…
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out, w, ...routes] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +w > 600 ? 900 : 844 } });
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(500);
for (const r of routes) { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(450); await p.screenshot({ path: `${out}/s-${w}-${r}.png` }); }
await b.close(); console.log("shot", routes.length);
