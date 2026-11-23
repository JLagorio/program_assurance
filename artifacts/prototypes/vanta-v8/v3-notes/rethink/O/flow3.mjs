import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
p.setDefaultTimeout(5000);
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
const shot = async (n) => { await p.evaluate(() => { const t = document.getElementById("v2-toast"); if (t) t.hidden = true; }); await p.screenshot({ path: `f3-${n}.jpg`, type: "jpeg", quality: 60 }); };
const T = (sel) => p.evaluate((sel) => { const e = document.querySelector(sel); return e ? e.innerText.replace(/\s+/g, " ").trim().slice(0, 500) : null; }, sel);
// boundary through its page
await p.click("#main .k3o-dl:nth-child(5) .btn"); await p.waitForTimeout(600);
console.log("btns:", await p.evaluate(() => [...document.querySelectorAll("#main .btn, #main [data-modal]")].map((x) => x.innerText.trim() + "→" + (x.getAttribute("data-modal") || "")).join(" | ")));
await p.click('#main [data-modal="v3g-bndreq"]'); await p.waitForTimeout(400); console.log("modal:", (await T("#modal")).slice(0, 300));
console.log("modal btns:", await p.evaluate(() => [...document.querySelectorAll("#modal button")].map((x) => x.innerText.trim()).join(" | ")));
