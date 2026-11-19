import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, r] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(400);
await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(500);
console.log((await p.evaluate(() => document.getElementById("main").innerText)).slice(0, 1500));
await b.close();
