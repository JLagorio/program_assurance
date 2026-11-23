import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const build = path.resolve(process.argv[2]);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1728, height: 964 } });
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
await p.evaluate(() => { const a = [...document.querySelectorAll("#nav a, #nav button")].find((x) => /Workspace/.test(x.textContent)); a && a.click(); }); await p.waitForTimeout(300);
const links = await p.evaluate(() => [...document.querySelectorAll("#nav a.item")].map((a) => [a.textContent.trim().slice(0, 30), a.getAttribute("href") || a.getAttribute("data-go") || ""]));
console.log(JSON.stringify(links));
for (const [, h] of links) { const r = (h || "").replace(/^#/, ""); if (!r) continue; await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(250);
  console.log(r, JSON.stringify(await p.evaluate(() => { const m = document.querySelector("#main > .main") || document.getElementById("main"); const wr = document.getElementById("main").getBoundingClientRect(); const inner = [...m.children].filter((e) => e.getClientRects().length).map((e) => e.getBoundingClientRect().right); const rows = [...m.querySelectorAll("tbody tr")].filter((e) => e.getClientRects().length).map((r) => Math.round(r.getBoundingClientRect().height)); return { k3: m.classList.contains("k3"), cls: m.className.slice(0, 40), gap: Math.round(wr.right - Math.max(...inner, 0)), tables: m.querySelectorAll("table").length, maxRow: Math.max(0, ...rows), tabs: m.querySelectorAll(".sectabs, .tabs, [role=tablist]").length, chips: m.querySelectorAll(".chips, .chip").length }; }))); }
await b.close();
