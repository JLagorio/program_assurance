// node shot.mjs <name> <route> [js to run after] [width]   → shots/<name>.jpg (1440×900, or the width given)
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const build = SP + "/vanta/proto/out/" + (process.env.BUILD || "v3r2-E") + ".html";
const [name, route, js, w] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +(w || 1440), height: w ? 800 : 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
await p.evaluate((r) => { location.hash = r; }, route); await p.waitForTimeout(600);
if (js) { const r = await p.evaluate(new Function("return (async () => {" + js + "})()")); await p.waitForTimeout(500); if (r !== undefined) console.log(typeof r === "string" ? r : JSON.stringify(r)); }
await p.screenshot({ path: `${SP}/vanta/v3r/E/shots/${name}.jpg`, type: "jpeg", quality: 60 });
console.log("main:", (await p.evaluate(() => document.getElementById("main").innerText.replace(/\n+/g, " | ").slice(0, 500))));
if (errs.length) console.log("ERRORS", errs.slice(0, 6));
await b.close();
