// node dom.mjs <html> <route> <selector> : print outerHTML (trimmed) of matches.
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, r, sel] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(html) + "#" + r); await p.waitForTimeout(700);
const out = await p.evaluate((s) => [...document.querySelectorAll(s)].map((e) => e.outerHTML.slice(0, 1500)), sel);
console.log(out.join("\n----\n"));
await b.close();
