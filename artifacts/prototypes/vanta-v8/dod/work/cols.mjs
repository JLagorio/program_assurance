import { createRequire } from "node:module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + process.argv[2] + "#" + process.argv[3]); await p.waitForTimeout(300);
console.log(await p.evaluate(() => [...document.querySelectorAll("#main thead th")].map((t) => t.textContent + ":" + Math.round(t.getBoundingClientRect().width)).join("  ")));
await b.close();
