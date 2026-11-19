// Print M[key](id) bodies: node mdump.mjs <html> key[:id] …
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, ...keys] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage();
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(400);
for (const k of keys) {
  const [key, id] = k.split(":");
  const o = await p.evaluate(([key, id]) => { const m = window.PA.M[key] && window.PA.M[key](id); return m ? { t: m.title, b: m.body, f: m.footer } : null; }, [key, id]);
  console.log("\n### " + k + " · " + (o && o.t)); console.log(o ? o.b.replace(/\s+/g, " ") : "none"); console.log("FOOT:", o && o.f);
}
await b.close();
