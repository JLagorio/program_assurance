import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [, , build, ...routes] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("file://" + build + "#home");
await page.waitForTimeout(300);
const agg = {};
for (const r of routes) {
  await page.evaluate((r) => { location.hash = r; }, r);
  await page.waitForTimeout(60);
  const res = await page.evaluate(() => {
    const ok = new Set(["12px", "14px", "16px", "20px", "28px", "36px"]);
    const out = {};
    for (const el of document.querySelectorAll("#proto *")) {
      if (el.children.length || !el.textContent.trim()) continue;
      const cs = getComputedStyle(el); if (ok.has(cs.fontSize)) continue;
      if (!el.getBoundingClientRect().width) continue;
      const k = cs.fontSize + "/" + cs.fontWeight + " " + (el.className && el.className.baseVal === undefined ? el.className : el.tagName) + " <" + (el.parentElement && el.parentElement.className) + ">";
      out[k] = (out[k] || 0) + 1;
    }
    return out;
  });
  for (const [k, n] of Object.entries(res)) agg[k] = (agg[k] || 0) + n;
}
console.log(Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, n]) => n + " " + k).join("\n"));
await browser.close();
