import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(600);
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(400); };
await go("my-work");
const mw = await p.evaluate(() => { const el = [...document.querySelectorAll("#main *")].find((e) => e.children.length === 0 && /Resolve 16 more/.test(e.textContent)); if (!el) return null; const r = el.getBoundingClientRect(); const row = el.closest("[class*=row], li, a, div"); return { w: Math.round(r.width), h: Math.round(r.height), cls: el.className, parent: el.parentElement.className, rowW: Math.round(el.parentElement.getBoundingClientRect().width) }; });
console.log("mywork", JSON.stringify(mw));
// shell colours: rail current, program switcher, nav current
await go("controls");
const sh = await p.evaluate(() => { const cs = (e) => e ? (({ color, backgroundColor, borderColor, borderWidth }) => ({ color, backgroundColor, borderColor, borderWidth }))(getComputedStyle(e)) : null; return { railOn: cs(document.querySelector("#rail a.ri.on")), navOn: cs(document.querySelector("#nav a.item.on")), switcher: cs(document.querySelector("#nav [class*=sw], #nav button, #nav .prog")), top: Math.round(document.querySelector(".top").getBoundingClientRect().height), railW: Math.round(document.getElementById("rail").getBoundingClientRect().width), navW: Math.round(document.getElementById("nav").getBoundingClientRect().width), mainX: (()=>{const e=document.querySelector("#main h1, #main h2, #main .pageh"); return e?Math.round(e.getBoundingClientRect().left):null;})(), search: (()=>{const e=document.querySelector(".top .search, .top [class*=search]"); return e?Math.round(e.getBoundingClientRect().width):null;})() }; });
console.log("shell", JSON.stringify(sh));
// bell / comments inbox / avatar menu presence
const tb = await p.evaluate(() => [...document.querySelectorAll(".top button, .top a, .top [role=button]")].map((e) => (e.getAttribute("aria-label") || e.textContent.trim()).slice(0, 40)));
console.log("topbar", JSON.stringify(tb));
// cmdk: does typing a question offer an AI answer?
await p.keyboard.press("Meta+k"); await p.waitForTimeout(300); await p.keyboard.type("which controls lack evidence?"); await p.waitForTimeout(400);
const ck = await p.evaluate(() => { const d = [...document.querySelectorAll("[role=dialog]")].find((x) => /Search controls, risks/.test(x.innerText) || x.querySelector("input")); return d ? d.innerText.replace(/\s+/g, " ").slice(0, 500) : null; });
console.log("cmdk-q", ck);
await b.close();
