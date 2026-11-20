import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, pre] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
const go = async (r, ms) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(ms || 700); };
const where = () => p.evaluate(() => { const e = document.querySelector("#se-c-AC-3"), r = e && e.getBoundingClientRect(); const sc = [...document.querySelectorAll("#main, #se-page, #se-app, #se-doc, .se-scroll")].map((x) => x.id + ":" + x.scrollTop); return { hash: location.hash, top: r && Math.round(r.top), focus: document.activeElement && (document.activeElement.getAttribute("aria-label") || document.activeElement.tagName), sc: sc.join(" "), panel: !document.getElementById("panel").hidden }; });
for (const r of (pre || "").split(",").filter(Boolean)) await go(r, 1500);
console.log("pre done", JSON.stringify(await where()));
await go("controls", 600); await p.evaluate(() => PA.v3k.openPanel("k3c-control", "AC-3")); await p.waitForTimeout(500);
await p.evaluate(() => { const b = [...document.querySelectorAll("#panel button, #panel a")].find((x) => /Open the SSP at AC-3/.test(x.innerText)); if (b) b.click(); });
for (const ms of [600, 1200, 2500]) { await p.waitForTimeout(ms === 600 ? 600 : ms === 1200 ? 600 : 1300); console.log(ms, JSON.stringify(await where())); }
await b.close();
