// Every route C1 touched, at 1440 and 390, empty and after the walk's state: page errors and sideways scroll. node widths.mjs <html>
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const html = process.argv[2]; const file = "file://" + path.resolve(html);
const here = path.dirname(new URL(import.meta.url).pathname);
const routes = ["controls", "control-si2", "control-si2-assessment", "checks", "check-scan", "frameworks", "assessments", "assessments-assessor", "campaign", "campaign-findings", "campaign-conmon", "findings", "findings-vulns", "findings-assessment", "poam", "risks", "authorization", "overview", "package-room", "data-calls", "suppliers", "evidence", "policies", "integrations", "sources", "requirements", "baseline", "conmon",
  ...JSON.parse(fs.readFileSync(path.join(here, "newscreens.json"), "utf8")).map((x) => x.route), "rec--a-tests-control--SA-24%7Cfindings", "rec--a-tests-control--SA-24%7Cactivity", "rec--a-tests-control--SA-24%7Crequirements", "rec--a-risk-risk--0a21dc94%7Ctreatment", "campaign-new-1"];
const STATE = { chain: { ctl: { "SA-24": { req: "REQ-641", reqTitle: "Mission functions continue through the compromise of one element", rel: "maps", mapAt: "2026-11-17", ev: "ev-crdr", evTitle: "Cyber resiliency design review record, Block 1", evAt: "2026-11-17", camp: "conmon", campAt: "2026-11-17", ready: true, readyAt: "2026-11-17", det: "other_than_satisfied", detNote: "x", detBy: "Nadia Fournier", detAt: "2026-11-17", published: true, pubAt: "2026-11-17" }, "SC-29": { req: "REQ-642", reqTitle: "Cyber resiliency goals", camp: "new1", ev: "ev-0", evTitle: "Time source", mapAt: "2026-11-17", evAt: "2026-11-17", campAt: "2026-11-17" } },
  issues: [{ id: "v2k-iss-sa-24", ctl: "SA-24", sev: "high", opened: "2026-11-17", camp: "conmon", title: "SA-24 Design For Cyber Resiliency judged other than satisfied (Continuous monitoring FY2027)" }],
  poams: [{ id: "v2k-poam-1", title: "Complete the SA-24 design review", issue: "v2k-iss-sa-24", owner: "Priya Raghavan", planned: "2026-12-17", created: "2026-11-17" }],
  risks: [{ id: "v2k-risk-1", title: "A compromised element takes down the mission", issue: "v2k-iss-sa-24", poam: "v2k-poam-1", lik: "moderate", imp: "high", sev: "high", owner: "", threat: "", created: "2026-11-17" }],
  acc: { "v2k-risk-1": { step: 3, state: "requested", reason: "Block 1.1", until: "2027-11-17", log: [["Ingrid Solberg", "requested", "2026-11-17"], ["Priya Raghavan", "approved step 1", "2026-11-17"], ["Joel Barrantes", "approved step 2", "2026-11-17"]] } },
  camps: [{ id: "new1", n: 1, title: "SC-29 assessment", ssp: "SSP 2", from: "2026-12-01", to: "2027-01-01", ctl: "SC-29" }],
  results: { conmon: { title: "Continuous monitoring FY2027 results — first set", at: "2026-11-17", by: "D. Okafor", n: 1 } }, inc2: { title: "SAR inc 2", at: "2026-11-17", by: "D. Okafor" }, pkg: { submitted: true, step: 3, decision: "atoc", atd: "2029-09-17", note: "ok", at: "2026-11-17" } } };
const b = await chromium.launch(); const out = [];
for (const W of [1440, 390]) for (const seeded of [false, true]) {
  const p = await b.newPage({ viewport: { width: W, height: W > 600 ? 900 : 844 } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(file + "#home"); await p.waitForTimeout(400);
  await p.evaluate(([seeded, STATE]) => { try { sessionStorage.setItem("pa-v2-state", seeded ? JSON.stringify(STATE) : "{}"); } catch (e) {} }, [seeded, STATE]);
  await p.goto("about:blank"); await p.goto(file + "#home"); await p.waitForTimeout(400);
  for (const r of routes) {
    errs.length = 0;
    await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(260);
    const o = await p.evaluate(() => { const m = document.getElementById("main"); return { hash: location.hash.slice(1), doc: document.documentElement.scrollWidth > window.innerWidth + 1, main: m.scrollWidth > m.clientWidth + 2, blank: m.innerText.trim().length < 40, notDrawn: /Not drawn yet|not in the prototype/.test(m.innerText) }; });
    const bad = o.doc || o.main || o.blank || o.notDrawn || errs.length || (o.hash !== r && !r.startsWith("campaign-new"));
    out.push({ W, seeded, r, ...o, errs: [...errs] });
    if (bad) console.log(`BAD ${W} ${seeded ? "seeded" : "empty"} ${r} → ${JSON.stringify(o)} ${errs[0] || ""}`);
  }
  await p.close();
}
fs.writeFileSync(path.join(here, "widths-log.json"), JSON.stringify(out, null, 1)); await b.close();
console.log("checked", out.length, "bad", out.filter((x) => x.doc || x.main || x.blank || x.notDrawn || x.errs.length).length);
