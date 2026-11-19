// Every route through the router: page errors, sideways scroll, visible EXAMPLE marks. node sweep.mjs <html> <width> [routes-regex]
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, w = "1440", only] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +w > 600 ? 900 : 844 } });
let cur = ""; const errors = []; p.on("pageerror", (e) => errors.push(cur + ": " + String(e).slice(0, 200)));
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(600);
let routes = await p.evaluate(() => Object.keys(PA.S));
if (only) routes = routes.filter((r) => new RegExp(only).test(r));
const over = [], ex = [];
for (const r of routes) {
  cur = r;
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(r.startsWith("ssp") || r.startsWith("plan-") || r.startsWith("program-new") ? 400 : 120);
  const d = await p.evaluate(() => {
    const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
    const exs = [...document.querySelectorAll("#proto span.ex, #proto [class*='-ex']")].filter((e) => vis(e) && /^example$/i.test(e.textContent.trim())).length;
    let words = 0; const tw = document.createTreeWalker(document.getElementById("proto"), NodeFilter.SHOW_TEXT);
    for (let t = tw.nextNode(); t; t = tw.nextNode()) if (/\bExample\b(?! output)/.test(t.textContent) && t.parentElement && vis(t.parentElement) && !t.parentElement.closest("pre, code, .v2-pop[hidden]")) words++;
    const m = document.getElementById("main");
    return { exs, words, over: document.documentElement.scrollWidth > innerWidth + 1 || (m && m.scrollWidth > m.clientWidth + 2), real: location.hash.slice(1) };
  });
  if (d.over) over.push(r);
  if (d.exs || d.words) ex.push(`${r}(${d.exs}/${d.words})`);
}
console.log("routes", routes.length, "width", w);
console.log("sideways:", over.length, over.slice(0, 40).join(" "));
console.log("EXAMPLE visible:", ex.length, ex.slice(0, 40).join(" "));
console.log("errors:", errors.length, [...new Set(errors)].slice(0, 8).join("\n"));
await b.close();
