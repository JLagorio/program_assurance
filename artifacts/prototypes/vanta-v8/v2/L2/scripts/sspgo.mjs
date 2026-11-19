// node sspgo.mjs <html> <out.png> <width> <data-at> : open the SSP editor, jump to a section through Contents, screenshot.
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out, w, at] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("file://" + path.resolve(html) + "#ssp"); await p.waitForTimeout(1300);
await p.evaluate((at) => { const el = document.querySelector(`[data-act="goto"][data-at="${at}"]`); if (el) el.click(); else { const h = document.getElementById("se-c-" + at) || document.getElementById("se-h-" + at); if (h) h.scrollIntoView(); } }, at);
await p.waitForTimeout(900);
await p.screenshot({ path: out });
console.log("errors:", errs.length ? errs.join(" | ") : "none");
await b.close();
