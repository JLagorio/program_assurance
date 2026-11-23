import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto("file://" + SP + "/vanta/proto/out/prototype-v3r2.html#overview"); await page.waitForTimeout(700);
await page.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await page.waitForTimeout(450);
const routes = process.argv.slice(2);
for (const r of routes) {
  await page.evaluate((h) => { location.hash = h; }, r); await page.waitForTimeout(650);
  const o = await page.evaluate(() => {
    const vis = (e) => e.offsetParent !== null && e.getBoundingClientRect().width > 0;
    const main = document.querySelector("#main"); const t = document.body.innerText.replace(/\s+/g, " ");
    const el = (t.match(/.{0,30}\belements?\b.{0,20}/gi) || []).slice(0, 3);
    const oi = (t.match(/.{0,20}\bOpen in\b.{0,20}/g) || []).slice(0, 3);
    // vertical lists of categories: nav/aside/ul inside #main, left of content, taller than wide, with >=4 short clickable items
    const vert = [...main.querySelectorAll("nav, aside, [class*=rail], [class*=side], ul")].filter(vis).filter((e) => { const r = e.getBoundingClientRect(); const items = [...e.querySelectorAll("a,button")].filter(vis); if (items.length < 4) return false; const xs = new Set(items.map((i) => Math.round(i.getBoundingClientRect().left / 8))); return r.height > r.width * 1.2 && xs.size <= 2 && r.width < 360; }).map((e) => e.tagName.toLowerCase() + "." + String(e.className).slice(0, 30) + " " + Math.round(e.getBoundingClientRect().width) + "x" + Math.round(e.getBoundingClientRect().height) + " “" + e.innerText.replace(/\s+/g, " ").slice(0, 60) + "”").slice(0, 3);
    const nav = document.querySelector("#nav"); const rows = [...main.querySelectorAll("tbody tr")].filter(vis);
    const goRows = rows.filter((r) => r.dataset.go).length, panelRows = rows.filter((r) => !r.dataset.go && (r.dataset.panel || r.dataset.k3)).length, eye = rows.filter((r) => r.querySelector("[data-panel]")).length;
    const firstGo = (rows.find((r) => r.dataset.go) || { dataset: {} }).dataset.go;
    const tabs = [...main.querySelectorAll(".k3-tabs a, .k3-tabs button, .k3-rtabs a, .k3-rtabs button")].filter(vis).map((e) => e.innerText.replace(/\s+/g, " ")).join(" | ").slice(0, 200);
    return { hash: location.hash, h1: (main.querySelector("h1") || {}).innerText, navW: nav ? Math.round(nav.getBoundingClientRect().width) : null, tabs, rows: rows.length, goRows, panelRows, eye, firstGo, vert, el, oi, sideways: document.documentElement.scrollWidth > window.innerWidth + 1 };
  });
  console.log(JSON.stringify(o));
}
if (errs.length) console.log("pageerrors:", errs.slice(0, 5));
await b.close();
