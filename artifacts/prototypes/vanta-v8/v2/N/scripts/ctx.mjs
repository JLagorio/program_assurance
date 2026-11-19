import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, r, needle] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(500);
const out = await p.evaluate(([r, n]) => { const s = PA.S[r](); const out = []; let i = -1; while ((i = s.indexOf(n, i + 1)) >= 0 && out.length < 4) out.push(s.slice(Math.max(0, i - 300), i + 120)); return out; }, [r, needle]);
console.log(out.join("\n-----\n"));
await b.close();
