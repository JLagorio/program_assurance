// node shot.mjs <build> <outprefix> <width> <route> [js-before-shot]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, out, w, route, js] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +w < 500 ? 800 : 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 300)); });
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
await p.evaluate((r) => { location.hash = r; }, route); await p.waitForTimeout(500);
if (js) { const r = await p.evaluate((js) => eval(js), js); if (r !== undefined) console.log(JSON.stringify(r)); await p.waitForTimeout(500); }
await p.evaluate(() => { const t = document.getElementById("v2-toast"); if (t) t.hidden = true; });
await p.screenshot({ path: out + ".jpg", type: "jpeg", quality: 60 });
await p.screenshot({ path: out + "-full.jpg", type: "jpeg", quality: 55, fullPage: true });
console.log("hash", await p.evaluate(() => location.hash), "sideways", await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1 || [...document.querySelectorAll("#main")].some((m) => m.scrollWidth > m.clientWidth + 1)), "errors", errs);
await b.close();
