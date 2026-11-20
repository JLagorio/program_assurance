import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2], out = process.argv[3];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(450); };
const shot = (n) => p.screenshot({ path: `${out}/${n}.jpg`, type: "jpeg", quality: 60 });
const txt = (s) => p.evaluate((s) => ((document.querySelector(s) || {}).innerText || "").replace(/\s+/g, " ").slice(0, 600), s);
// 1 element page
await go("composition");
await p.evaluate(() => { const r = [...document.querySelectorAll("#main *")].find((e) => e.children.length === 0 && /^Mission Computer$/.test(e.textContent.trim())); r && r.click(); });
await p.waitForTimeout(500);
console.log("after click LRU-001: hash", await p.evaluate(() => location.hash), "| panel:", await txt("#panel"));
await shot("el-preview");
// follow the panel's open link
const opened = await p.evaluate(() => { const a = [...document.querySelectorAll("#panel a, #panel button")].find((e) => /↗|open|full/i.test(e.textContent + (e.getAttribute("aria-label") || "") + (e.title || ""))); if (a) { a.click(); return a.outerHTML.slice(0, 200); } return null; });
await p.waitForTimeout(500);
console.log("opened via:", opened, "| hash", await p.evaluate(() => location.hash));
await shot("el-page");
console.log("el page text:", await txt("#main"));
console.log("el page buttons:", await p.evaluate(() => [...document.querySelectorAll("#main button, #main a.btn, #main [role=tab]")].map((e) => e.innerText.trim().replace(/\s+/g, " ")).filter(Boolean).slice(0, 60).join(" | ")));
// 2 overview strip click
await go("overview");
const strip = await p.evaluate(() => { const e = document.querySelector("#main [data-go*='life'], #main a[href*='life'], #main [class*='life'] [data-go], #main [class*='strip'] *"); return e ? e.outerHTML.slice(0, 300) : null; });
console.log("strip el:", strip);
// 3 SSP: plans -> click SSP row
await go("ssps");
await p.evaluate(() => { const r = [...document.querySelectorAll("#main *")].find((e) => e.children.length === 0 && /^System security plan$/.test(e.textContent.trim())); r && r.click(); });
await p.waitForTimeout(600);
console.log("after SSP click: hash", await p.evaluate(() => location.hash), "| panel:", (await txt("#panel")).slice(0, 300));
await shot("ssp-after-click");
await go("ssp"); await p.waitForTimeout(500);
console.log("ssp editables:", await p.evaluate(() => ({ ce: document.querySelectorAll("[contenteditable='true']").length, ta: document.querySelectorAll("textarea").length, btns: [...document.querySelectorAll("button")].map((e) => e.innerText.trim()).filter(Boolean).slice(0, 40).join(" | ") })));
await shot("ssp-editor");
// 4 sctm
await go("sctm"); await p.waitForTimeout(800);
await shot("sctm");
console.log("sctm:", (await txt("#main")).slice(0, 200), "| body class", await p.evaluate(() => document.getElementById("proto").className));
// 5 control row click
await go("controls");
await p.evaluate(() => { const r = [...document.querySelectorAll("#main *")].find((e) => e.children.length === 0 && /^AC-2 Account Management$/.test(e.textContent.trim())); r && r.click(); });
await p.waitForTimeout(500);
await shot("control-preview");
console.log("control panel:", await txt("#panel"));
console.log("errors", errs.slice(0, 5));
await b.close();
