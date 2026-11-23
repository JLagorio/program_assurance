// The before-and-after scenes (pass 2): the published version (out/prototype-v19.html, V3 on) beside lane E's whole build.
// node scenes.mjs [build]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const WAS = SP + "/vanta/proto/out/prototype-v19.html", NOW = process.argv[2] || SP + "/vanta/proto/out/v3r2-E.html", OUT = SP + "/vanta/v3r/E/shots";
const b = await chromium.launch();
async function open(file) { const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on("pageerror", (e) => errs.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort()); await p.goto("file://" + file + "#overview"); await p.waitForTimeout(700); await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300); return { p, errs, go: async (r, ms = 600) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(ms); }, quiet: async () => { await p.evaluate(() => { const t = document.getElementById("v2-toast"); if (t) t.hidden = true; }); } }; }
const A = await open(WAS), B = await open(NOW);
const shot = async (X, name) => { await X.quiet(); await X.p.screenshot({ path: `${OUT}/${name}.png` }); };
const row = (X, text) => X.p.evaluate((text) => { const tr = [...document.querySelectorAll("#main tbody tr")].find((t) => t.innerText.includes(text)); if (tr) tr.click(); return !!tr; }, text);
const eye = (X, text) => X.p.evaluate((text) => { const tr = [...document.querySelectorAll("#main tbody tr")].find((t) => t.innerText.includes(text)); const e = tr && tr.querySelector(".k3-eye"); if (e) e.click(); return !!e; }, text);
// s1: one list for everything found; its sources run across the page
await A.go("findings"); await shot(A, "E-s1-was");
await B.go("findings"); await shot(B, "E-s1-now");
// s2: an assessment finding is a record with its own page
await A.go("findings-assessment"); await row(A, "AU-4"); await A.p.waitForTimeout(500); await shot(A, "E-s2-was");
await B.go("findings-assessment"); await row(B, "Audit Log Storage Capacity"); await B.p.waitForTimeout(600); await shot(B, "E-s2-now");
// s3: judging one objective on the assessment's page, the program menu still there
await A.go("campaign"); await shot(A, "E-s3-was");
await B.go("assessment--exp--objectives"); await B.p.evaluate(() => { const s = document.querySelector("#main select[data-k3-railsel]"); const i = [...s.options].findIndex((o) => o.textContent.includes("AC-2(7)")); s.selectedIndex = i; s.dispatchEvent(new Event("input", { bubbles: true })); }); await B.p.waitForTimeout(450);
await B.p.evaluate(() => { const j = [...document.querySelectorAll("#main .k3-table button")].find((x) => x.innerText.trim() === "Judge"); if (j) j.click(); }); await B.p.waitForTimeout(400);
await B.p.selectOption("#k3f-det", "other_than_satisfied"); await B.p.fill("#k3f-note", "The role table lists two maintainer accounts with no assigned role; the administrator could not say who approved them."); await shot(B, "E-s3-now");
await B.p.click("#modal [data-k3-submit]"); await B.p.waitForTimeout(500);
// s4: the POA&M is a view of Findings; the row's eye previews the finding with its plan
await A.go("poam"); await shot(A, "E-s4-was");
await B.go("finding--" + encodeURIComponent("af:exp:AC-2(7):0"));
await B.p.evaluate(() => { const x = [...document.querySelectorAll("#main button")].find((y) => y.innerText.trim() === "Create plan"); if (x) x.click(); }); await B.p.waitForTimeout(400);
await B.p.fill("#k3f-resources", "40 engineering hours"); await B.p.fill("#k3f-ms", "Rework the privileged role table"); await B.p.click("#modal [data-k3-submit]"); await B.p.waitForTimeout(500);
await B.go("findings-poam"); await B.p.fill("#main .k3-search input", "AC-02"); await B.p.waitForTimeout(500); await eye(B, "AC-02(07)(a)"); await B.p.waitForTimeout(500); await shot(B, "E-s4-now");
await B.p.evaluate(() => { const c = document.querySelector("#closePanel"); if (c) c.click(); }); await B.p.fill("#main .k3-search input", ""); await B.p.waitForTimeout(450);
// s5: Assessments, one table for campaigns, cyber tests and checks
await A.go("assessments"); await shot(A, "E-s5-was");
await B.go("assessments"); await shot(B, "E-s5-now");
// s6: Authorization, the record the AO decides on
await A.go("authorization"); await shot(A, "E-s6-was");
await B.go("authorization"); await shot(B, "E-s6-now");
// s7: a finding's page: its plan and milestones, its risk, its control and components
await A.go("findings"); await row(A, "Payload arm"); await A.p.waitForTimeout(500); await shot(A, "E-s7-was");
await B.go("finding--1f680dd7"); await shot(B, "E-s7-now");
console.log("errors was", A.errs.slice(0, 3), "now", B.errs.slice(0, 3));
await b.close();
