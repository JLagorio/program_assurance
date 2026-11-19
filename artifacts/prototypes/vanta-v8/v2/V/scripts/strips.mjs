// Every tab strip stays on one line at 390 and 1440 (rule 11), and no page scrolls sideways.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [, , build] = process.argv;
const b = await chromium.launch();
for (const w of [390, 1440]) {
  const p = await b.newPage({ viewport: { width: w, height: w > 600 ? 900 : 844 } });
  await p.goto("file://" + build + "#home"); await p.waitForTimeout(300);
  const routes = await p.evaluate(() => Object.keys(PA.S).filter((k) => !k.startsWith("after-") && !/^(before-after|nav-options|study)/.test(k)));
  const bad = [];
  for (const r of routes) {
    await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(5);
    const res = await p.evaluate(() => {
      const out = [];
      document.querySelectorAll("#main .ak-tabs, #main .tabsx, #main [role=tablist], #main .sectabs").forEach((s) => {
        const kids = [...s.querySelectorAll(":scope > *, :scope > .v2-tabmore > .v2-pop > *")].filter((k) => k.getClientRects().length && !k.classList.contains("v2-tabmore") && !k.classList.contains("v2-pop"));
        const tops = new Set(kids.map((k) => Math.round(k.getBoundingClientRect().top)));
        if (tops.size > 1) out.push((s.className || s.getAttribute("role")) + " lines=" + tops.size);
      });
      const page = document.documentElement.scrollWidth > innerWidth + 1 || document.getElementById("main").scrollWidth > document.getElementById("main").clientWidth + 1;
      return { out, page };
    });
    if (res.out.length || res.page) bad.push(r + " " + res.out.join(";") + (res.page ? " PAGE-SCROLL" : ""));
  }
  console.log(`${w}px: ${bad.length} routes with a wrapped strip or sideways scroll`); if (bad.length) console.log(bad.slice(0, 15).join("\n"));
  await p.close();
}
await b.close();
