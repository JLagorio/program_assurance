import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(process.argv[2]) + "#home"); await p.waitForTimeout(500);
await p.keyboard.press("Meta+k"); await p.waitForTimeout(300); await p.keyboard.type("AC-2"); await p.waitForTimeout(400);
await p.screenshot({ path: process.argv[3] });
await b.close();
