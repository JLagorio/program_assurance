import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, r] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(400);
await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(400);
console.log(await p.evaluate(() => { const bn = document.querySelector("#main .ak-banner"); return { html: bn.outerHTML.slice(0, 600), kids: [...bn.children].map((k) => `${k.tagName}.${k.className} w=${Math.round(k.getBoundingClientRect().width)} ws=${getComputedStyle(k).whiteSpace} shrink=${getComputedStyle(k).flexShrink}`) }; }));
await b.close();
