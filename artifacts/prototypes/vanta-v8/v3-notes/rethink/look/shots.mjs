import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, out, ...routes] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(450);
  const info = await p.evaluate(() => ({ hash: location.hash, h: document.documentElement.scrollHeight, title: (document.querySelector("#main h1") || {}).innerText }));
  await p.screenshot({ path: `${out}/${r.replace(/[^a-z0-9-]/gi, "_")}.jpg`, type: "jpeg", quality: 60, fullPage: false });
  console.log(r, "->", JSON.stringify(info));
}
console.log("errors", errs.slice(0, 5));
await b.close();
