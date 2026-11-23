// usage: node measure.mjs <build> <width> [js to run before measuring]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const build = path.resolve(process.argv[2]), W = +(process.argv[3] || 1440), pre = process.argv[4] || "";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: 900 } });
p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
await p.evaluate(() => { location.hash = "controls"; }); await p.waitForTimeout(500);
if (pre) { await p.evaluate(pre); await p.waitForTimeout(500); }
const r = await p.evaluate(() => { const t = document.querySelector("#main .k3-tb[data-k3-list]"); const kids = [...t.children].flatMap((c) => (c.classList.contains("k3-fs") ? [...c.children] : [c])).filter((e) => e.getClientRects().length);
  return { main: Math.round(t.getBoundingClientRect().width), kids: kids.map((e) => { const q = e.getBoundingClientRect(); return `${(e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 26) || e.className}@${Math.round(q.left)}+${Math.round(q.width)}y${Math.round(q.top)}`; }), cut: [...t.querySelectorAll("select")].filter((s) => s.scrollWidth > s.clientWidth + 1).map((s) => s.getAttribute("aria-label")),
    cols: [...document.querySelectorAll("#main table.k3-table thead th")].map((th) => `${th.textContent}:${Math.round(th.getBoundingClientRect().width)}`), rowH: [...new Set([...document.querySelectorAll("#main table.k3-table tbody tr")].map((tr) => Math.round(tr.getBoundingClientRect().height)))], foot: (document.querySelector("#main .pager .num") || {}).textContent, view: t.querySelector(".k3-vname").textContent, side: document.documentElement.scrollWidth - document.documentElement.clientWidth, mainScroll: document.getElementById("main").scrollWidth - document.getElementById("main").clientWidth }; });
console.log(JSON.stringify(r, null, 1));
await b.close();
