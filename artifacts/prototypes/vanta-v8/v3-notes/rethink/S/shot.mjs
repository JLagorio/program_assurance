// node shot.mjs <name> <route> [width] [js to run first] : one screenshot of the lane's build, V3 on
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta";
const [name, route, width, js, full] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +(width || 1440), height: +(width || 1440) < 500 ? 800 : 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
const fs = require("fs"), COPY = SP + "/v3r/S/.shot-build.html"; // a copy with a byte-order mark: the build has no charset line
fs.writeFileSync(COPY, "\ufeff" + fs.readFileSync(SP + "/proto/out/" + (process.env.B || "v3r2-S") + ".html", "utf8").replace(/^\ufeff/, ""));
await p.goto("file://" + COPY + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
await p.evaluate((r) => { location.hash = r; }, route); await p.waitForTimeout(500);
if (js) { const out = await p.evaluate(new Function("return (async () => {" + js + "})()")); if (out !== undefined) console.log(typeof out === "string" ? out : JSON.stringify(out)); await p.waitForTimeout(500); }
await p.evaluate(() => { const t = document.getElementById("v2-toast"); if (t) t.remove(); });
await p.screenshot({ path: `${SP}/v3r/S/look/${name}.jpg`, type: "jpeg", quality: 60, fullPage: full !== "0" });
console.log("hash", await p.evaluate(() => location.hash), "errors", errs.slice(0, 5));
await b.close(); fs.unlinkSync(COPY);
