import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (/^SC /.test(m.text())) console.log(m.text().slice(0, 260)); });
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
const go = async (r, ms) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(ms || 700); };
const where = () => p.evaluate(() => { const e = document.querySelector("#se-c-AC-3"), r = e && e.getBoundingClientRect(), s = document.getElementById("se-scroll"); return { hash: location.hash, top: r && Math.round(r.top), sc: s && Math.round(s.scrollTop), side: !!document.querySelector("#se-app [class*=thread], #se-app .se-side:not([hidden])") }; });
await go("ssp", 1500);
const btn = await p.evaluate(() => { const bs = [...document.querySelectorAll("#se-app button")].filter((x) => /comment|thread|discussion/i.test((x.getAttribute("aria-label") || "") + " " + (x.title || ""))); if (bs[0]) bs[0].click(); return bs.map((x) => (x.getAttribute("aria-label") || x.title || x.innerText).slice(0, 40)); }); console.log("comment buttons:", btn); await p.waitForTimeout(600);
console.log("with side:", JSON.stringify(await where()));
await p.evaluate(() => { const o = Element.prototype.scrollTo; Element.prototype.scrollTo = function (a) { if (this.id === "se-scroll") console.log("SC scrollTo", JSON.stringify(a), "from", Math.round(this.scrollTop), (new Error().stack || "").split("\n").slice(2, 4).map((l) => l.trim().slice(0, 70)).join(" | ")); return o.apply(this, arguments); }; const oi = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function (a) { console.log("SC scrollIntoView", this.id || this.className, JSON.stringify(a)); return oi.apply(this, arguments); }; });
await go("controls", 600); await p.evaluate(() => PA.v3k.openPanel("k3c-control", "AC-3")); await p.waitForTimeout(500);
await p.evaluate(() => { const b = [...document.querySelectorAll("#panel button, #panel a")].find((x) => /Open the SSP at AC-3/.test(x.innerText)); if (b) b.click(); });
for (const ms of [700, 1500, 3200, 5000]) { await p.waitForTimeout(ms === 700 ? 700 : ms === 1500 ? 800 : ms === 3200 ? 1700 : 1800); console.log(ms, JSON.stringify(await where())); }
console.log(errs.slice(0, 3)); await b.close();
