import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, ...routes] = process.argv.slice(2);
const file = "file://" + path.resolve(html);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto(file + "#home"); await p.waitForTimeout(400);
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(300);
  const o = await p.evaluate(() => {
    const doc = document.documentElement, vw = doc.clientWidth;
    const wide = [...document.querySelectorAll("#main *")].filter((e) => { const rc = e.getBoundingClientRect(); return rc.right > vw + 1 && rc.width > 0; })
      .filter((e) => { for (let a = e.parentElement; a && a.id !== "main"; a = a.parentElement) { const s = getComputedStyle(a); if (/(auto|scroll|hidden)/.test(s.overflowX)) return false; } return true; })
      .filter((e) => ![...e.children].some((c) => c.getBoundingClientRect().right > document.documentElement.clientWidth + 1)).slice(0, 12).map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join(".")} right=${Math.round(e.getBoundingClientRect().right)} w=${Math.round(e.getBoundingClientRect().width)} :: ${e.textContent.trim().slice(0, 50)}`);
    return { scrollW: doc.scrollWidth, vw, mainScroll: document.getElementById("main").scrollWidth, mainW: document.getElementById("main").clientWidth, wide };
  });
  console.log(r, JSON.stringify(o, null, 1));
}
await b.close();
