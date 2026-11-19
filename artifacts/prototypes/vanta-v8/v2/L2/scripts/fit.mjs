// node fit.mjs <html> <width> route… : for each route, every table frame's overflow (scrollWidth - clientWidth) and the toolbar rows.
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, w, ...routes] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(400);
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(r === "ssp" ? 1200 : 400);
  const o = await p.evaluate(() => {
    const boxes = [...document.querySelectorAll("#main .tablebox")].map((t) => t.scrollWidth - t.clientWidth);
    const tools = [...document.querySelectorAll("#main .tools")].map((t) => { const kids = [...t.children].filter((k) => k.offsetParent); const tops = new Set(kids.map((k) => Math.round(k.getBoundingClientRect().top))); return tops.size; });
    const qv = [...document.querySelectorAll("#main .views")].map((v) => v.querySelectorAll(".qv").length);
    const pills = document.querySelectorAll("#main .pill").length;
    const firstRow = document.querySelector("#main tbody tr"); const y = firstRow ? Math.round(firstRow.getBoundingClientRect().top) : -1;
    return { boxes, tools, qv, pills, firstRowY: y };
  });
  console.log(r, JSON.stringify(o));
}
console.log("errors:", errs.length ? [...new Set(errs)].join(" | ") : "none");
await b.close();
