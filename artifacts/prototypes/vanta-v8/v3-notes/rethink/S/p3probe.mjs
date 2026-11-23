// usage: node p3probe.mjs <build.html> <width> <route[!eye]> ...   prints each table's head and first rows; ✂ marks a cut cell
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const build = path.resolve(process.argv[2]), W = +process.argv[3] || 1440, routes = process.argv.slice(4);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: 900 } });
p.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const r0 of routes) {
  const [r, mode] = r0.split("!");
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(300);
  if (mode === "eye") { await p.evaluate(() => { const e = document.querySelector("#main .k3-eye"); if (e) e.click(); }); await p.waitForTimeout(300); }
  const out = await p.evaluate((mode) => {
    const root = mode === "eye" ? document.querySelector("#panel") : document.querySelector("#main");
    const tx = (e) => e.textContent.replace(/\s+/g, " ").trim(); const L = [];
    root.querySelectorAll(".k3-tb").forEach((t) => { const kids = [...t.children].flatMap((c) => (c.classList.contains("k3-fs") ? [...c.children] : [c])).filter((e) => e.getClientRects().length); L.push(`TOOLBAR list=${t.getAttribute("data-k3-list") || "-"} rows=${new Set(kids.map((e) => Math.round((e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2) / 10))).size} w=${Math.round(t.getBoundingClientRect().width)} :: ${[...t.querySelectorAll("input[type=search]")].map((i) => "[" + i.placeholder + "]").join("")} view=${tx(t.querySelector(".k3-vname") || { textContent: "-" })} ${[...t.querySelectorAll(".k3-flt select")].map((s) => `{${s.getAttribute("aria-label")}:${s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : ""}|${s.options.length}}`).join(" ")} R: ${tx(t.querySelector(".k3-tools-r") || { textContent: "" })}`); });
    if (mode === "eye") { L.push("FACTS " + [...root.querySelectorAll(".k3-facts > div")].map((d) => tx(d.querySelector("dt")) + "=" + tx(d.querySelector("dd")).slice(0, 40)).join(" | ")); root.querySelectorAll(".k3-sec").forEach((s) => { L.push("SEC " + tx(s.querySelector("h2")) + " :: all=" + tx(s.querySelector(".k3-pk-all") || { textContent: "-" }) + " -> " + ((s.querySelector(".k3-pk-all") || { getAttribute: () => "" }).getAttribute("href"))); }); }
    root.querySelectorAll("table").forEach((t) => {
      if (!t.getClientRects().length) return;
      const ths = [...t.querySelectorAll("thead th")].map(tx); const rows = [...t.querySelectorAll("tbody tr")];
      L.push(`TABLE "${t.getAttribute("aria-label") || ""}" ${rows.length} rows, w=${Math.round(t.getBoundingClientRect().width)}/${Math.round(t.parentElement.clientWidth)} maxRowH=${Math.max(0, ...rows.map((r) => Math.round(r.getBoundingClientRect().height)))} :: ${ths.join(" | ")}`);
      const cut = (td) => { const over = (e) => e.scrollWidth > e.clientWidth + 1; const d = td.querySelector(".k3-nm-d"), t = td.querySelector(".k3-nm-t"); if (t ? over(t) : (over(td) || [...td.querySelectorAll(".k3-c1-b")].some(over))) return "✂"; return d && over(d) ? "~" : ""; };
      rows.slice(0, mode === "eye" ? 3 : 4).forEach((r) => L.push("   " + [...r.children].map((td) => `${cut(td)}${tx(td).slice(0, 46)}〔${Math.round(td.getBoundingClientRect().width)}〕`).join(" | ")));
      const nCut = rows.reduce((n, r) => n + [...r.children].filter((td) => cut(td) === "✂").length, 0); const byCol = ths.map((h, i) => rows.filter((r) => r.children[i] && cut(r.children[i]) === "✂").length); L.push(`   cut cells: ${nCut} by col: ${byCol.join(",")}`);
    });
    return L.join("\n");
  }, mode);
  console.log(`\n=== ${r0} @${W}\n${out}`);
  if (mode === "eye") { await p.evaluate(() => { const c = document.querySelector("#panel [data-close], #panel .bar-top button:last-child"); if (c) c.click(); }); await p.waitForTimeout(100); }
}
await b.close();
