// Evaluate an expression in a build: node ev.mjs <html> "<js expr>" [route]
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, expr, route = "home"] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
await p.goto("file://" + path.resolve(html) + "#" + route); await p.waitForTimeout(500);
const out = await p.evaluate((expr) => { try { const v = eval(expr); return typeof v === "string" ? v : JSON.stringify(v, null, 1); } catch (e) { return "ERR " + e; } }, expr);
console.log(out); if (errors.length) console.log("pageerrors", errors);
await b.close();
