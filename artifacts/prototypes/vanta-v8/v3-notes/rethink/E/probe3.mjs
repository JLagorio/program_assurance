// Lane E, pass 3: measure every page without looking at pictures. node probe3.mjs <build> [width]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const build = path.resolve(process.argv[2]), W = +(process.argv[3] || 1440);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: W < 700 ? 844 : 900 }, hasTouch: W < 700 });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
const routes = (process.argv[4] ? process.argv.slice(4) : ["findings", "findings-issues", "findings-assessment", "findings-vulns", "findings-stig", "findings-poam", "assessments", "assessments-control", "assessments-cyber", "assessments-checks", "assessment--exp", "assessment--exp--objectives", "assessment--exp--requests", "assessment--exp--results", "assessment--exp--findings", "assessment--init", "assessment--conmon", "assessment--chk-vuln", "assessment--chk-vuln--runs", "assessment--chk-vuln--findings", "risks", "risks-threats", "authorization", "authorization-decisions", "authorization-conditions", "authorization-monitoring", "authorization-sharing"]);
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(380);
  const s = await p.evaluate(() => {
    const m = document.querySelector("#main"); const vis = (e) => e.getClientRects().length > 0, tx = (e) => e.textContent.replace(/\s+/g, " ").trim();
    const bars = [...m.querySelectorAll(".k3-tb")].filter(vis).map((t) => { const kids = [...t.children].flatMap((c) => (c.classList.contains("k3-fs") ? [...c.children] : [c])).filter(vis); const tops = new Set(kids.map((e) => Math.round((e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2) / 10))); return `${tops.size}row/${[...t.querySelectorAll("select")].map((x) => x.getAttribute("aria-label")).join(",")}/w${Math.round(kids.reduce((n, e) => n + e.getBoundingClientRect().width + 8, 0))}of${Math.round(t.getBoundingClientRect().width)}`; });
    const tables = [...m.querySelectorAll("table")].filter(vis).map((t) => { const rows = [...t.querySelectorAll("tbody tr")].filter(vis); const box = t.closest(".tablebox") || t.parentElement; const cut = {}; rows.slice(0, 40).forEach((tr) => [...tr.children].forEach((td, i) => { const inner = td.querySelector(".k3-nm-t") || td; if (inner.scrollWidth > inner.clientWidth + 1) cut[i] = (cut[i] || 0) + 1; })); const ths = [...t.querySelectorAll("thead th")].map((th) => `${tx(th) || "·"}:${Math.round(th.getBoundingClientRect().width)}${th.getBoundingClientRect().height > 38 ? "!TALLTH" : ""}`); return `${rows.length}r tall${rows.filter((x) => x.getBoundingClientRect().height > 44).length} side${Math.max(0, t.scrollWidth - box.clientWidth)} cut${JSON.stringify(cut)} [${ths.join(" | ")}]`; });
    return { bars, tables, pageSide: document.documentElement.scrollWidth - document.documentElement.clientWidth, h1: tx(m.querySelector("h1") || { textContent: "" }).slice(0, 40) };
  });
  console.log(`\n${r}  (${s.h1}) pageSide ${s.pageSide}\n  bars: ${s.bars.join("  ")}\n  ${s.tables.join("\n  ")}`);
}
console.log("\npage errors", errs.length, errs.slice(0, 3));
await b.close();
