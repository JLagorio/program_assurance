// node sweep.mjs <build> — every route F touched at 1440 and 390: page errors and sideways scroll; every dialog F wired opens.
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const html = path.resolve(process.argv[2]);
const ROUTES = ["requirements", "requirements-objectives", "controls", "control-si2", "control-si2-evidence", "control-si2-history", "assessments", "campaign-conmon", "traceability", "traceability-noev",
  "evidence", "poam", "risks", "findings", "suppliers", "schedule", "my-work", "review-queue", "reports", "products", "components", "inventory", "inheritance", "itcsc", "plan-cp", "checks", "overview",
  "program-start", "home", "rec--a-tests-control--AC-1", "rec--v7p-req--REQ-001"];
const DIALOGS = [["requirements", "v7p-map", "REQ-001"], ["requirements", "v7p-map", ""], ["requirements", "v7p-link-ev", "REQ-001"], ["traceability", "v7a-link-ev", ""], ["evidence", "a-docs-review", "e1|accept"], ["evidence", "a-docs-upload", "upload|"], ["evidence", "a-docs-upload", "link|"], ["evidence", "a-docs-upload", "upload|e1"],
  ["poam", "a-risk-poam-new", ""], ["risks", "a-risk-new-risk", ""], ["schedule", "a-work-task-new", ""], ["schedule", "v2f-outcomes", "cdr"], ["control-si2", "a-tests-addev", "SI-2"], ["assessments", "a-tests-plan", ""], ["inventory", "v2f-asset", "AST-109001"], ["requirements-objectives", "v7p-map", "SI-4(13)"]];
const b = await chromium.launch(); const out = []; let bad = 0;
for (const W of [1440, 390]) {
  const p = await b.newPage({ viewport: { width: W, height: W > 600 ? 900 : 844 } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto("file://" + html + "#home"); await p.waitForTimeout(500);
  for (const r of ROUTES) {
    const n0 = errs.length;
    await p.evaluate(() => { location.hash = "home"; }); await p.waitForTimeout(120);
    await p.evaluate((x) => { location.hash = x; }, r); await p.waitForTimeout(450);
    const side = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    const ok = errs.length === n0 && !side; if (!ok) bad++;
    out.push(`${ok ? "PASS" : "FAIL"} ${W} ${r}${side ? " · sideways scroll" : ""}${errs.length > n0 ? " · " + errs.slice(n0).join(" | ") : ""}`);
  }
  for (const [r, key, id] of DIALOGS) {
    const n0 = errs.length;
    await p.evaluate(() => { location.hash = "home"; }); await p.waitForTimeout(120);
    await p.evaluate((x) => { location.hash = x; }, r); await p.waitForTimeout(400);
    await p.evaluate(([k, i]) => { const el = document.createElement("span"); el.hidden = true; el.dataset.modal = k; el.dataset.id = i; document.getElementById("main").appendChild(el); el.click(); }, [key, id]); await p.waitForTimeout(300);
    const open = await p.evaluate(() => !document.getElementById("modal").hidden && document.getElementById("modal").innerText.length > 20);
    const side = await p.evaluate(() => { const d = document.querySelector("#modal .dlg"); return d ? d.scrollWidth > d.clientWidth + 1 : false; });
    const ok = open && errs.length === n0 && !side; if (!ok) bad++;
    out.push(`${ok ? "PASS" : "FAIL"} ${W} dialog ${key}(${id}) on ${r}${open ? "" : " · did not open"}${side ? " · dialog scrolls sideways" : ""}${errs.length > n0 ? " · " + errs.slice(n0).join(" | ") : ""}`);
    await p.evaluate(() => { const x = document.querySelector("#modal [data-close-modal]"); if (x) x.click(); });
  }
  await p.close();
}
await b.close();
out.unshift(`F sweep · ${out.length} checks, ${bad} failed`);
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "sweep.log"), out.join("\n") + "\n");
console.log(out.join("\n"));
