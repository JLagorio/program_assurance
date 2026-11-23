// Worst case for the one row: every filter of a list set, at a width. node probe4.mjs <build> [width]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const build = path.resolve(process.argv[2]), W = +(process.argv[3] || 1440);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: 900 } });
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
const cases = [["findings-issues", { "fnd.view": { chip: "poam", sev: "moderate", comp: "__c", ctl: "__k", q: "audit" } }], ["findings-assessment", { "fnd.view": { chip: "noowner", sev: "high", comp: "__c", ctl: "__k" } }], ["assessments-checks", { "asm.view": { st: "On schedule", att: "ending" } }], ["risks", { "rsk.view": { chip: "accept", sev: "moderate", tech: "__t" } }], ["risks-threats", { "rsk.view": { tmx: "Enterprise", trs: "named" } }], ["assessment--exp--objectives", { "asmo.view": { exp: { ctl: "__o", chip: "short" } } }]];
for (const [r, sets] of cases) {
  await p.evaluate(([r, sets]) => { const K = PA.v3k, E = PA.v3e; const F = E.findings().filter(E.isOpen); const comps = {}; F.forEach((f) => f.components.forEach((c) => { const n = (PA.v3.fact("component", c) || {}).name || c; comps[c] = n.length; })); const longest = Object.keys(comps).sort((a, b) => comps[b] - comps[a])[0]; const ctl = (F.find((f) => /\(\d+\)/.test(f.control || "")) || {}).control; const t = (E.rsk.risks().find((x) => x.tech.length) || { tech: [[""]] }).tech[0][0]; const o = E.asm.ctlsOf("exp").sort((a, b) => b.length - a.length)[0];
    for (const k of Object.keys(sets)) { const v = JSON.parse(JSON.stringify(sets[k]).replace("__c", longest).replace("__k", ctl).replace("__t", t).replace("__o", o)); K.set(k, v); } location.hash = r; }, [r, sets]); await p.waitForTimeout(450);
  const s = await p.evaluate(() => [...document.querySelectorAll("#main .k3-tb")].map((t) => { const kids = [...t.children].flatMap((c) => (c.classList.contains("k3-fs") ? [...c.children] : [c])).filter((e) => e.getClientRects().length); return { rows: new Set(kids.map((e) => Math.round((e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2) / 10))).size, on: [...t.querySelectorAll(".k3-flt select")].map((x) => x.selectedOptions[0].textContent + ":" + Math.round(x.getBoundingClientRect().width)), search: Math.round((t.querySelector(".k3-search") || t).getBoundingClientRect().width), view: (t.querySelector(".k3-vbtn") || { textContent: "" }).textContent.trim(), n: document.querySelectorAll("#main tbody tr").length }; }));
  console.log(r, JSON.stringify(s));
}
await b.close();
