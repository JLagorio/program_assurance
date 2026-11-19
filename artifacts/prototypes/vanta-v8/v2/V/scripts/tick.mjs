// Registers open with nothing ticked and the filters showing; ticking a row brings the selection bar back.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [, , build] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("file://" + build + "#home"); await p.waitForTimeout(300);
for (const r of ["controls", "evidence", "findings", "risks", "poam", "checks", "people", "review-queue", "inventory", "schedule", "campaign", "requirements", "policies", "suppliers", "interconnections"]) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(150);
  const s0 = await p.evaluate(() => ({ bulk: !!document.querySelector("#main .ak-bulk"), on: document.querySelectorAll("#main .ak-cb.on, #main tr.sel, #main [aria-checked=true]").length, filters: document.querySelectorAll("#main .tools .flt").length }));
  // tick the first row's checkbox
  const cb = await p.$("#main tbody tr [role=checkbox], #main tbody tr .ak-cb, #main tbody tr input[type=checkbox]");
  let s1 = null;
  if (cb) { await cb.click().catch(() => {}); await p.waitForTimeout(150); s1 = await p.evaluate(() => ({ bulk: !!document.querySelector("#main .ak-bulk"), on: document.querySelectorAll("#main .ak-cb.on, #main tr.sel").length })); }
  console.log(r.padEnd(16), "open:", JSON.stringify(s0), "after tick:", JSON.stringify(s1));
}
console.log("errors", errs.length, errs.slice(0, 3));
await b.close();
