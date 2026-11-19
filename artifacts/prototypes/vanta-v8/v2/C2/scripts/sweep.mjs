// node sweep.mjs <build.html> : every route C2 touched at 1440 and 390, with no page error and no sideways scroll; a created
// program's pages too (reached by a link, as a reader would).
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const html = path.resolve(process.argv[2]);
const ROUTES = ["home", "my-work", "my-work-mine", "my-work-approval", "review-queue", "review-queue-mine", "schedule", "getting-started", "people", "people-access", "inventory", "inventory-changes", "person-local-developer-onboarding", "person-victor-amsel-offboarding", "portfolio", "ssp-review", "ssp", "ssps", "authorization", "findings-vulns", "campaign", "campaign-findings", "campaign-controls", "component-mc-findings", "overview", "controls", "evidence"];
const MADE = ["program-start", "overview", "getting-started", "requirements", "sources", "ssp", "ssps", "assessments", "authorization", "controls", "evidence", "findings", "risks", "people", "baseline", "posture"];
const b = await chromium.launch();
let bad = 0;
const check = async (p, tag) => {
  const r = await p.evaluate(() => ({ doc: document.documentElement.scrollWidth > window.innerWidth + 1, main: (() => { const m = document.getElementById("main"); return m.scrollWidth > m.clientWidth + 1; })(), h: location.hash }));
  if (r.doc || r.main) { bad++; console.log("SIDEWAYS", tag, JSON.stringify(r)); }
};
for (const w of [1440, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: w > 600 ? 900 : 844 } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto("file://" + html + "#home"); await p.waitForTimeout(400);
  for (const r of ROUTES) { await p.evaluate((x) => { location.hash = x; }, r); await p.waitForTimeout(350); await check(p, `${w} ${r}`); }
  // a created program, then its pages by link
  await p.evaluate(() => { location.hash = "program-new"; }); await p.waitForTimeout(600);
  for (let i = 0; i < 8 && (await p.evaluate(() => location.hash)) !== "#program-new-review"; i++) { await p.click('[data-pn="next"]'); await p.waitForTimeout(400); }
  await p.click('[data-pn="create"]'); await p.waitForTimeout(3800);
  for (const r of MADE) {
    await p.evaluate((x) => { const a = document.createElement("a"); a.href = "#" + x; document.body.appendChild(a); a.click(); a.remove(); }, r); await p.waitForTimeout(350);
    const cur = await p.evaluate(() => window.PA.v2.get("prog.cur"));
    if (cur === "PRG-1090") { bad++; console.log("NOT CURRENT", w, r); }
    await check(p, `${w} made:${r}`);
  }
  console.log(w, "page errors:", errs.length ? errs.join(" | ") : "none");
  if (errs.length) bad++;
  await p.close();
}
await b.close();
console.log(bad ? `${bad} problems` : "sweep clean");
