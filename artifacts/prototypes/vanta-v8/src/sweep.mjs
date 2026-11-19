import { createRequire } from "node:module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = "file://" + new URL("./out/prototype.html", import.meta.url).pathname;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(file + "#home"); await page.waitForTimeout(800);
const routes = await page.evaluate(() => Object.keys(window.PA.S));
const navRoutes = await page.evaluate(() => [...document.querySelectorAll("#nav a.item")].map((a) => a.getAttribute("href").slice(1)));
const problems = [];
for (const w of [1440, 390]) {
  await page.setViewportSize({ width: w, height: w === 390 ? 844 : 900 });
  for (const r of routes) {
    await page.goto(file + "#" + r); await page.waitForTimeout(120);
    const st = await page.evaluate(() => ({ ph: /Not drawn yet/.test(document.getElementById("main").textContent), over: document.documentElement.scrollWidth > innerWidth, mainOver: (() => { const m = document.getElementById("main"); return m.scrollWidth > m.clientWidth + 2; })() }));
    if (st.ph) problems.push(`${r}: placeholder`);
    if (st.over || st.mainOver) problems.push(`${r}: overflows at ${w}px`);
  }
}
// panel close works
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(file + "#risks"); await page.waitForTimeout(300);
await page.locator("[data-panel]").first().click(); await page.waitForTimeout(200);
const opened = await page.evaluate(() => !document.getElementById("panel").hidden);
await page.click("#closePanel"); await page.waitForTimeout(200);
const closed = await page.evaluate(() => document.getElementById("panel").hidden);
console.log("routes:", routes.length, "| nav routes without a screen:", navRoutes.filter((r) => !routes.includes(r)).join(", ") || "none");
console.log("panel opens:", opened, "closes:", closed);
console.log("problems:", problems.length ? problems.join(" | ") : "none");
console.log("errors:", errors.length ? [...new Set(errors)].join(" | ") : "none");
await browser.close();
