// DOM survey of every nav route at 1440: cards, banners, quick views, tabs, tables, overflow, pre-selected rows, pills, ink buttons
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, outFile] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(600);
const items = await p.evaluate(() => window.PA.navItems());
const extra = ["control-si2", "campaign", "ssp", "program-new", "evidence-page", "check", "component-mc", "products", "components"];
const routes = [...items.map(([r]) => r), ...extra.filter((r) => !items.some(([x]) => x === r))];
const res = [];
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(350);
  const m = await p.evaluate((r) => {
    const main = document.getElementById("main"); const q = (s) => [...main.querySelectorAll(s)];
    const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    const h1 = main.querySelector("h1, .ph h1, .header h1, h2");
    const frames = q(".frame, table").filter(vis);
    let overflow = 0; for (const f of q(".frame")) { const t = f.querySelector("table"); if (t && t.scrollWidth > f.clientWidth + 2) overflow++; }
    const pills = q(".pill").filter(vis); const tone = {}; for (const pl of pills) { const k = [...pl.classList].filter((c) => c !== "pill").join(".") || "plain"; tone[k] = (tone[k] || 0) + 1; }
    const tabs = q(".tabsx span, .sectab, [role=tab], .ak-tabs a, .ak-tabs button, .ak-tab").filter(vis).length;
    const areaTabs = !!main.querySelector(".sectabs");
    const sel = q("tr.sel, tbody input[type=checkbox]:checked").length;
    const selbar = q("*").some((e) => e.children.length < 6 && /\bselected\b/.test(e.textContent || "") && /Deselect/.test(e.textContent || "") && e.textContent.length < 200);
    const above = (() => { const t = main.querySelector(".frame, table"); return t ? Math.round(t.getBoundingClientRect().top + main.scrollTop) : null; })();
    return {
      r, title: h1 ? h1.textContent.trim().slice(0, 60) : "", h: main.scrollHeight,
      pairs: q(".pair").filter(vis).length, cards: q(".card").filter(vis).length,
      banners: q(".ak-banner").filter(vis).length, qv: q(".qv").filter(vis).length, tabs, areaTabs,
      tables: frames.length, overflow, preselected: sel, selbar,
      pills: pills.length, tone, ex: q(".ex").filter(vis).length, ink: q(".btn.ink").filter(vis).length,
      tableTop: above,
      moded: document.getElementById("proto").classList.contains("moded"), full: document.getElementById("proto").classList.contains("fullwin"),
      inprog: document.getElementById("shell").classList.contains("inprog"),
    };
  }, r);
  res.push(m);
}
fs.writeFileSync(outFile, JSON.stringify(res, null, 1));
for (const x of res) console.log([x.r.padEnd(18), ("h" + x.h).padEnd(6), "pair" + x.pairs, "card" + x.cards, "ban" + x.banners, "qv" + x.qv, "tab" + x.tabs, x.areaTabs ? "AREA" : "    ", "tbl" + x.tables, "ovf" + x.overflow, "sel" + x.preselected, "pill" + x.pills, "ex" + x.ex, "ink" + x.ink, "top" + x.tableTop, x.moded ? "MODE" : "", x.full ? "FULL" : "", x.inprog ? "prog" : "ws"].join(" "));
console.log("ERR", errors.join("\n"));
await b.close();
