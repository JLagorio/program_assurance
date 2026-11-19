// Render routes of a built prototype and report script errors: node look.mjs <out-name> <route> [<route> ...]
import { createRequire } from "node:module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [name, ...routes] = process.argv.slice(2);
const file = "file://" + new URL(`./out/${name}.html`, import.meta.url).pathname;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
for (const r of routes) {
  await page.goto(file + "#" + r); await page.waitForTimeout(700);
  await page.screenshot({ path: new URL(`./out/${name}-${r}.png`, import.meta.url).pathname });
  const blank = await page.evaluate(() => /Not drawn yet/.test(document.getElementById("main").textContent));
  console.log(r, blank ? "PLACEHOLDER" : "drawn");
}
await page.setViewportSize({ width: 390, height: 844 });
for (const r of routes) { await page.goto(file + "#" + r); await page.waitForTimeout(300); if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) console.log(r, "OVERFLOWS AT 390px"); }
console.log("errors:", errors.length ? errors.join(" | ") : "none");
await browser.close();
