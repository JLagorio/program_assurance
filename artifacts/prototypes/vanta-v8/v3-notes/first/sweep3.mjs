// Every screen with V3 on: drawn with no page error, not the router's placeholder, and no sideways scroll at 1440 and 390 on the
// menu's pages (V3's menu). usage: node SP/vanta/v3/sweep3.mjs <build.html> [out.json]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path"); const fs = await import("fs");
const build = path.resolve(process.argv[2]); const OUT = process.argv[3];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; let cur = "";
p.on("pageerror", (e) => errs.push(cur + ": " + e.message));
await p.goto("file://" + build + "#home"); await p.waitForTimeout(600);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); });
const routes = await p.evaluate(() => Object.keys(PA.S).filter((k) => !/^(before-after|walkthrough|study|nav-options)/.test(k)));
const menu = await p.evaluate(() => PA.navItems().map(([k]) => k));
const probs = [];
for (const r of routes) {
  cur = r;
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(40);
  const st = await p.evaluate(() => { const m = document.getElementById("main"); return { ph: /Not drawn yet|Part of V3/.test(m.textContent), len: (m.innerText || "").trim().length }; });
  if (st.ph) probs.push(`${r}: placeholder`); else if (st.len < 30) probs.push(`${r}: nearly empty`);
}
for (const w of [1440, 390]) {
  await p.setViewportSize({ width: w, height: w === 390 ? 844 : 900 });
  for (const r of menu) {
    cur = r + "@" + w;
    await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(60);
    const o = await p.evaluate(() => { const m = document.getElementById("main"); return document.documentElement.scrollWidth > innerWidth + 1 || m.scrollWidth > m.clientWidth + 2; });
    if (o) probs.push(`${r}: sideways scroll at ${w}`);
  }
}
const res = { build, routes: routes.length, menu: menu.length, problems: probs, errors: [...new Set(errs)] };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
console.log(`sweep3 (V3 on): ${routes.length} screens, ${menu.length} menu pages at 1440 and 390; problems ${probs.length}; page errors ${res.errors.length}`);
for (const x of probs.slice(0, 20)) console.log(" -", x);
for (const x of res.errors.slice(0, 10)) console.log(" ! ", x.slice(0, 300));
await b.close();
