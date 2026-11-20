import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(700); };
await go("authorization-decisions");
console.log(JSON.stringify(await p.evaluate(() => [...document.querySelectorAll("#main tbody tr")].map((r) => ({ go: r.getAttribute("data-go"), k3: r.getAttribute("data-k3"), t: r.innerText.replace(/\s+/g, " ").slice(0, 90), btn: [...r.querySelectorAll("button")].map((b) => b.innerText.trim() + ":" + (b.getAttribute("data-k3") || b.getAttribute("data-go") || "")).join(",") }))), null, 0).slice(0, 1500));
const btn = await p.$('#main .k3-table button:has-text("Record decision"), #main .k3-table a:has-text("Record decision")');
if (btn) { await btn.click(); await p.waitForTimeout(800); console.log("after click:", await p.evaluate(() => ({ hash: location.hash, h1: (document.querySelector("#main h1") || {}).innerText, modal: !document.getElementById("modal").hidden }))); }
// D: the control panel's SSP link
await go("controls"); await p.evaluate(() => PA.v3k.openPanel("k3c-control", "AC-3")); await p.waitForTimeout(500);
const link = await p.evaluate(() => { const b = [...document.querySelectorAll("#panel button, #panel a")].find((x) => /Open the SSP at AC-3/.test(x.innerText)); if (b) b.click(); return b ? b.outerHTML.slice(0, 200) : null; });
for (const ms of [800, 1700, 3000]) { await p.waitForTimeout(ms === 800 ? 800 : ms - (ms === 1700 ? 800 : 1700)); console.log("ssp link", ms, JSON.stringify(await p.evaluate(() => { const e = document.querySelector("#se-c-AC-3"), r = e && e.getBoundingClientRect(); return { hash: location.hash, el: !!e, top: r && Math.round(r.top), h: innerHeight, focus: document.activeElement && (document.activeElement.getAttribute("aria-label") || document.activeElement.tagName) }; }))); }
console.log(link, "errors", JSON.stringify(errs).slice(0, 300)); await b.close();
