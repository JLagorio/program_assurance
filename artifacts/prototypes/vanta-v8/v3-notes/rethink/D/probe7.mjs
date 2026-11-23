// text probe: node probe7.mjs <build> <width> route[!eye] …  → toolbar controls, table heads, first rows (cut cells flagged with ✂)
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const build = path.resolve(process.argv[2]), W = +process.argv[3] || 1440;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: W > 600 ? 900 : 844 } });
p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const r0 of process.argv.slice(4)) {
  const [r, mod, arg] = r0.split("!");
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(400);
  if (mod === "eye") { await p.evaluate((n) => { const e = document.querySelectorAll("#main .k3-eye")[+n || 0]; if (e) e.click(); }, arg); await p.waitForTimeout(400); }
  if (mod === "js") { await p.evaluate(arg); await p.waitForTimeout(400); }
  const out = await p.evaluate((mod) => {
    const root = mod === "eye" ? document.querySelector("#panel") : document.querySelector("#main");
    const tx = (e) => e.textContent.replace(/\s+/g, " ").trim();
    const L = [];
    root.querySelectorAll(".k3-tb").forEach((t) => { const kids = [...t.children].flatMap((c) => (c.classList.contains("k3-fs") || c.classList.contains("k3-tools-r") ? [...c.children] : [c])).filter((e) => e.getClientRects().length); L.push("TOOLBAR[" + (t.getAttribute("data-k3-list") || "") + "] " + kids.map((e) => { const s = e.querySelector("select"); const i = e.querySelector("input"); return (s ? "‹" + s.selectedOptions[0].textContent.trim() + "›" : i ? "[" + i.placeholder + "]" : tx(e).slice(0, 40)) + "@" + Math.round(e.getBoundingClientRect().top); }).join(" | ")); });
    const tabs = [...root.querySelectorAll(".k3-tabs")].map(tx); if (tabs.length) L.push("TABS " + tabs.join(" || "));
    const facts = [...root.querySelectorAll(".k3-facts > div")].map((d) => tx(d.querySelector("dt")) + ": " + tx(d.querySelector("dd")).slice(0, 50)); if (facts.length) L.push("FACTS " + facts.join(" · "));
    root.querySelectorAll(".k3-sec, .k3-page > .frame, .k3-stack > .frame, .k3-aside-b > .frame").forEach((s) => {
      const h = s.querySelector(":scope > .k3-sec-h h2"); const t = s.matches(".frame") ? s.querySelector("table") : s.querySelector("table");
      let line = "SEC " + (h ? tx(h) : "(table)") + (s.querySelector(".k3-sec-a") ? "  actions: " + tx(s.querySelector(".k3-sec-a")) : "");
      if (!t) { L.push(line + "  » " + tx(s).slice(0, 160)); return; }
      L.push(line + "  cols: " + [...t.querySelectorAll("thead th")].map(tx).join(" | "));
      [...t.querySelectorAll("tbody tr")].slice(0, 4).forEach((tr) => L.push("   " + (tr.querySelector(".k3-eye") ? "👁 " : "   ") + (tr.getAttribute("data-go") || tr.getAttribute("data-panel") || tr.getAttribute("data-k3") || "-") + " h" + Math.round(tr.getBoundingClientRect().height) + " :: " + [...tr.children].map((td) => { const c = td.querySelector(".k3-nm") || td.querySelector(".k3-c1-b") || td; const cut = [...td.querySelectorAll("*")].concat([td]).some((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).textOverflow === "ellipsis"); return tx(td).slice(0, 90) + "(" + Math.round(td.getBoundingClientRect().width) + (cut ? "✂" : "") + ")"; }).join(" ¦ ")));
      const all = s.querySelector(".k3-pk-all"); if (all) L.push("   → " + tx(all) + " " + all.getAttribute("href"));
      const pg = s.querySelector(".pager"); if (pg) L.push("   foot: " + tx(pg));
    });
    return L.join("\n");
  }, mod);
  console.log("=== " + r0 + " @" + W + "\n" + out);
  await p.evaluate(() => { const c = document.getElementById("closePanel"); if (c) c.click(); });
}
await b.close();
