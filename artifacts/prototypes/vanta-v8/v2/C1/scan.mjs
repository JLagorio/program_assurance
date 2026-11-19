// For each route: panels, modals, go-links and buttons with no wiring. node scan.mjs <html> route…
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, ...routes] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(500);
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(400);
  const o = await p.evaluate(() => {
    const m = document.getElementById("main");
    const uniq = (a) => [...new Set(a)];
    const panels = uniq([...m.querySelectorAll("[data-panel]")].map((e) => e.dataset.panel + ":" + (e.dataset.id || "")).slice(0, 400));
    const kinds = {}; panels.forEach((x) => { const k = x.split(":")[0]; kinds[k] = (kinds[k] || 0) + 1; });
    const modals = uniq([...m.querySelectorAll("[data-modal]")].map((e) => e.dataset.modal + (e.dataset.id ? ":" + e.dataset.id : "") + " «" + e.textContent.trim().slice(0, 30) + "»"));
    const h = m.querySelector(".ph, .ak-ih, .ak-rh");
    const head = h ? [...h.querySelectorAll("button, .btn, a")].map((e) => e.textContent.trim().slice(0, 30) + (e.getAttribute("data-modal") ? "[M:" + e.getAttribute("data-modal") + "]" : "") + (e.getAttribute("data-go") ? "[G:" + e.getAttribute("data-go") + "]" : "") + ([...e.attributes].filter((a) => /^data-/.test(a.name) && !/data-(modal|go)$/.test(a.name)).map((a) => "[" + a.name + "]").join(""))) : [];
    return { title: (m.querySelector("h1,h2,h3") || {}).textContent, kinds, modals, head };
  });
  console.log("\n## " + r + " · " + (o.title || "").trim().slice(0, 60));
  console.log("panels:", JSON.stringify(o.kinds));
  console.log("modals:", o.modals.join(" | "));
  console.log("head:", o.head.join(" | "));
}
console.log("\nerrors", errors);
await b.close();
