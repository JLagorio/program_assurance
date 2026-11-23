import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
await p.evaluate(() => { location.hash = "dr-check--rhel9-mc"; }); await p.waitForTimeout(500);
await p.setViewportSize({ width: 390, height: 844 });
for (const r of ["dr-checks", "dr-check--rhel9-mc", "dr-check--rhel9-v2r10"]) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(500);
  console.log(r, JSON.stringify(await p.evaluate(() => { const s = document.querySelector(".drf-rl-t"); const chain = []; for (let e = s; e && e.id !== "main"; e = e.parentElement) chain.push(e.tagName + "." + String(e.className).slice(0, 30) + ":" + Math.round(e.getBoundingClientRect().width) + ":" + getComputedStyle(e).display); window.__c = chain; const m = document.getElementById("main"); return { chain: window.__c, sw: document.documentElement.scrollWidth, mw: m.scrollWidth + "/" + m.clientWidth, wide: [...m.querySelectorAll("*")].filter((el) => el.offsetParent && el.getBoundingClientRect().right > m.getBoundingClientRect().right + 2 && !el.closest(".drk-tabs")).slice(0, 4).map((el) => el.tagName + "." + el.className + ":" + Math.round(el.getBoundingClientRect().right) + ":" + el.textContent.slice(0, 30)) }; })));
}
await b.close();
