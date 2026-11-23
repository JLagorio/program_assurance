// usage: node p3probe.mjs <build> route[!eye[N]] …   prints each table: header, rows; a cell that is cut is marked ✂
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const build = path.resolve(process.argv[2]); const W = +(process.env.W || 1728), H = +(process.env.H || 964);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const r0 of process.argv.slice(3)) {
  const [r, mod] = r0.split("!");
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(350);
  if (mod && mod.startsWith("eye")) { const n = +(mod.slice(3) || 0); await p.evaluate((n) => { const e = document.querySelectorAll("#main .k3-eye")[n]; if (e) e.click(); }, n); await p.waitForTimeout(350); }
  const out = await p.evaluate((inPanel) => {
    const root = document.querySelector(inPanel ? "#panel" : "#main"); const tx = (e) => e.innerText.replace(/\s+/g, " ").trim();
    const cut = (td) => { const els = [td, ...td.querySelectorAll("*")]; return els.some((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== "visible"); };
    const res = [];
    res.push("H1: " + tx(root.querySelector("h1, h4") || root).slice(0, 120));
    res.push("secs: " + [...root.querySelectorAll(".k3-sec h2")].map(tx).join(" | "));
    res.push("toolbars: " + [...root.querySelectorAll(".k3-tb")].map((t) => `[${t.getAttribute("data-k3-list") || ""}${t.classList.contains("k3-fold") ? " FOLD" : ""}] ` + tx(t).slice(0, 200)).join(" || "));
    for (const t of root.querySelectorAll("table")) { if (!t.getClientRects().length) continue;
      res.push(`TABLE "${t.getAttribute("aria-label") || ""}" w=${Math.round(t.getBoundingClientRect().width)} parent=${t.parentElement.clientWidth} sw=${t.scrollWidth}`);
      res.push("  TH " + [...t.querySelectorAll("thead th")].map((th) => `${tx(th)}(${Math.round(th.getBoundingClientRect().width)})`).join(" | "));
      [...t.querySelectorAll("tbody tr")].slice(0, 30).forEach((tr) => res.push(`  ${Math.round(tr.getBoundingClientRect().height)} ` + [...tr.cells].map((td) => (cut(td) ? "✂" : "") + tx(td).slice(0, 90)).join(" | ") + (tr.querySelector(".k3-eye") ? " 👁" : "") + (tr.getAttribute("data-go") ? " →" + tr.getAttribute("data-go") : ""))); }
    return res.join("\n");
  }, !!mod);
  console.log("=== " + r0 + " @" + W + "\n" + out);
  await p.keyboard.press("Escape"); await p.evaluate(() => { const c = document.querySelector("#panel [data-close]"); if (c) c.click(); });
}
await b.close();
