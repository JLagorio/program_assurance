import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [, , build] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("file://" + build + "#home");
await page.waitForTimeout(300);
console.log(await page.evaluate(() => {
  const out = {};
  for (const r of Object.keys(PA.S)) { if (r.startsWith("after-") || /^(before-after|nav-options|study)/.test(r)) continue;
    const t = document.createElement("template"); t.innerHTML = PA.S[r]();
    for (const sel of [".v7o-ring", ".a-risk-prog", ".v7a-tally", ".v7o-stack", ".a-tests-prog"]) {
      const el = t.content.querySelector(sel); if (!el || out[sel]) continue;
      const cell = el.closest("td, li, [class*=row]");
      out[sel] = r + " :: " + (cell ? cell.outerHTML : el.outerHTML).slice(0, 700);
    } }
  return Object.values(out).join("\n\n");
}));
await browser.close();
