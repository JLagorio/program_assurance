import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, out, ...routes] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const spec of routes) {
  const [r, act] = spec.split("@");
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(500);
  if (act === "eye") { await p.evaluate(() => document.querySelector("#main .k3-eye").click()); await p.waitForTimeout(400); }
  if (act && act.startsWith("imp")) { await p.evaluate((at) => { PA.v3k.set("dr.B.imp", { file: "WS-X90 SCTM.xlsx", at: +at }); PA.v2.redraw(); }, act.slice(3)); await p.waitForTimeout(400); }
  await p.screenshot({ path: `${out}/${(r + (act ? "_" + act : "")).replace(/[^a-z0-9-_]/gi, "_")}.jpg`, type: "jpeg", quality: 60 });
  console.log(spec);
}
console.log("errors", errs.slice(0, 5));
await b.close();
