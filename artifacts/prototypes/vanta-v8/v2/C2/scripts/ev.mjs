// node ev.mjs <html> <route> <js-file-or-expression> : open the build at a route, run the async JS (it receives `page`), print what it returns.
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, route, code, w = "1440"] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("file://" + path.resolve(html) + "#" + route); await p.waitForTimeout(500);
const src = fs.existsSync(code) ? fs.readFileSync(code, "utf8") : code;
const fn = new Function("page", "return (async () => { " + src + " })()");
try { const r = await fn(p); console.log(typeof r === "string" ? r : JSON.stringify(r, null, 1)); } catch (e) { console.log("ERR", e.message); }
if (errs.length) console.log("PAGEERRORS", errs);
await b.close();
