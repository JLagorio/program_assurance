// node p2shot.mjs <width> <route> <out> [js]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const [w, route, out, js] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +w < 500 ? 800 : 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + SP + "/vanta/proto/out/v3r2-O.html#overview"); await p.waitForTimeout(800);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
await p.evaluate((r) => { location.hash = r; }, route); await p.waitForTimeout(600);
if (js) { const r = await p.evaluate((js) => eval(js), js); if (r !== undefined) console.log(JSON.stringify(r)); await p.waitForTimeout(600); }
await p.evaluate(() => { const t = document.getElementById("v2-toast"); if (t) t.hidden = true; });
await p.screenshot({ path: `tmp/${out}.jpg`, type: "jpeg", quality: 60 });
console.log("hash", await p.evaluate(() => location.hash), "sideways", await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1 || document.getElementById("main").scrollWidth > document.getElementById("main").clientWidth + 1), "errors", errs);
await b.close();
