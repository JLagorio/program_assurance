import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, out, tag, ...routes] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
let i = 0;
for (const r of routes) {
  if (r.startsWith("click:")) { await p.click(r.slice(6)).catch((e) => console.log("click failed", r)); await p.waitForTimeout(500); }
  else { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(600); }
  await p.evaluate(() => { const t = document.getElementById("v2-toast"); if (t) t.remove(); });
  await p.screenshot({ path: `${out}/${tag}-${++i}.jpg`, type: "jpeg", quality: 62 });
  console.log(i, r, "→", await p.evaluate(() => location.hash));
}
console.log("errors", errs.slice(0, 4));
await b.close();
