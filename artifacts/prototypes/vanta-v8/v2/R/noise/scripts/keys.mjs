import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(process.argv[2]) + "#home"); await p.waitForTimeout(600);
const r = await p.evaluate(() => ({ nav: PA.navItems(), S: Object.keys(PA.S), P: Object.keys(PA.P || {}), M: Object.keys(PA.M || {}), MODED: [...(PA.MODED || [])] }));
console.log(JSON.stringify(r));
await b.close();
