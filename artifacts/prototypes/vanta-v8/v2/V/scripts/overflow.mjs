import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [, , build, width] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +width || 1440, height: 900 } });
const errs = []; page.on("pageerror", (e) => errs.push(String(e))); let curR = ""; page.on("pageerror", (e) => console.log("PAGEERROR on", curR, String(e).slice(0, 300)));
await page.goto("file://" + build + "#home");
await page.waitForTimeout(300);
const routes = await page.evaluate(() => Object.keys(PA.S).filter((k) => !k.startsWith("after-") && !/^(before-after|nav-options|study)/.test(k)));
const out = [];
for (const r of routes) {
  curR = r; await page.evaluate((r) => { location.hash = r; }, r);
  await page.waitForTimeout(10);
  const o = await page.evaluate(() => {
    const main = document.getElementById("main");
    const frames = [...main.querySelectorAll(".tablebox")].filter((f) => f.offsetParent && f.scrollWidth > f.clientWidth + 2).map((f) => f.scrollWidth - f.clientWidth);
    const page = document.documentElement.scrollWidth > innerWidth + 1 || main.scrollWidth > main.clientWidth + 1;
    return { frames, page };
  });
  if (o.frames.length || o.page) out.push([r, o.page ? "PAGE" : "", o.frames.join(",")]);
}
console.log(out.length + " routes overflow at " + (width || 1440) + (errs.length ? " · errors " + errs.length : ""));
console.log(out.map((x) => x.join(" ")).join("\n"));
await browser.close();
