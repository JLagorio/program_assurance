import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, out, w, ...routes] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w || 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const r0 of routes) {
  const [r, sel] = r0.split("!");
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(500);
  if (sel) { await p.click(sel); await p.waitForTimeout(400); }
  const info = await p.evaluate(() => ({ hash: location.hash, h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, title: (document.querySelector("#main h1") || {}).innerText }));
  await p.screenshot({ path: `${out}/${r.replace(/[^a-z0-9-]/gi, "_")}${sel ? "_c" : ""}-${w}.jpg`, type: "jpeg", quality: 60, fullPage: false });
  console.log(r0, "->", JSON.stringify(info));
}
console.log("errors", errs.slice(0, 8));
await b.close();
