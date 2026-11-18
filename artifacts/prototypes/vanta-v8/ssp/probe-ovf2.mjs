import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, r] = process.argv.slice(2);
const file = "file://" + path.resolve(html);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: Number(process.env.W || 390), height: 844 } });
await p.goto(file + "#home"); await p.waitForTimeout(400);
await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(400);
const out = await p.evaluate(() => {
  const main = document.getElementById("main"), base = () => main.scrollWidth > main.clientWidth + 1;
  const path = []; let node = main;
  for (let depth = 0; depth < 14; depth++) {
    const kids = [...node.children]; let culprit = null;
    for (const k of kids) { const d = k.style.display; k.style.display = "none"; const fixed = !base(); k.style.display = d; if (fixed) { culprit = k; break; } }
    if (!culprit) break;
    const cs = getComputedStyle(culprit);
    path.push(`${culprit.tagName.toLowerCase()}.${[...culprit.classList].join(".")} w=${Math.round(culprit.getBoundingClientRect().width)} disp=${cs.display} gtc=${cs.gridTemplateColumns.slice(0, 60)} minw=${cs.minWidth} ws=${cs.whiteSpace} :: ${culprit.textContent.trim().replace(/\s+/g, " ").slice(0, 60)}`);
    node = culprit;
  }
  return path;
});
console.log(out.join("\n"));
await b.close();
