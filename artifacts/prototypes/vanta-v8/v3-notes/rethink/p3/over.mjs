import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const build = path.resolve(process.argv[2]);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const r of process.argv.slice(3)) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(300);
  console.log(r, JSON.stringify(await p.evaluate(() => { const m = document.getElementById("main"); const out = []; m.querySelectorAll("*").forEach((e) => { const r = e.getBoundingClientRect(); if (r.width && r.right > innerWidth + 1 && !e.closest(".tablebox, .k3-fs, svg")) out.push((e.className && e.className.toString().slice(0, 40)) + " " + e.tagName + " r" + Math.round(r.right) + " w" + Math.round(r.width)); }); return { sw: m.scrollWidth, cw: m.clientWidth, out: out.slice(0, 8) }; })));
}
await b.close();
