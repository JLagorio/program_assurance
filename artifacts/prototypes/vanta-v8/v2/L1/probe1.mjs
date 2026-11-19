import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, route, sel] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(html) + "#" + route); await p.waitForTimeout(600);
console.log(await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return "none"; const cs = getComputedStyle(e); return e.outerHTML.slice(0, 300) + "\n" + cs.fontSize + " " + cs.lineHeight + " " + cs.fontWeight; }, sel));
await b.close();
