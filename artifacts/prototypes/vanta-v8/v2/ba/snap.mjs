import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, route, out, w = "1440", h = "1600"] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto("file://" + path.resolve(html) + "#" + route); await p.waitForTimeout(900);
await p.screenshot({ path: out }); await b.close();
