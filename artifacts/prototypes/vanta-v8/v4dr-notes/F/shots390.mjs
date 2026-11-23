import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, outDir, ...routes] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const r of routes) {
  const [route, click] = r.split("@@");
  await p.evaluate((x) => { location.hash = x; }, route); await p.waitForTimeout(600);
  if (click) { await p.click(click).catch((e) => errs.push("click " + e.message)); await p.waitForTimeout(400); }
  const name = route.replace(/[^\w-]+/g, "_").slice(0, 60) + (click ? "_c" : "");
  await p.screenshot({ path: `${outDir}/${name}.jpg`, type: "jpeg", quality: 60 });
  const info = await p.evaluate(() => ({ w: document.documentElement.scrollWidth, h1: (document.querySelector("h1") || {}).textContent, err: (document.querySelector(".k3-note.warn") || {}).textContent }));
  console.log(route, JSON.stringify(info));
}
console.log("errors", errs.slice(0, 10));
await b.close();
