// The rethought V3, swept: every menu entry, every page a new lane registered, a sample of record pages, and every folded
// address, with V3 on, at 1440 and 390: no page error, not a placeholder, the program menu present with an entry marked, no
// sideways scroll. usage: node sweepr.mjs <build.html> [out.json]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path"); const fs = await import("fs");
const build = path.resolve(process.argv[2]); const OUT = process.argv[3];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; let cur = "";
p.on("pageerror", (e) => errs.push(cur + ": " + e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
const info = await p.evaluate(() => {
  const menu = PA.v3.menu.flatMap(([, items]) => items.map(([k]) => k));
  const mine = Object.keys(PA.S).filter((k) => menu.some((m) => k === m || k.startsWith(m + "-")) && !/^(before-after|walkthrough)/.test(k));
  const comps = (PA.v3.fact("components") || []).map((c) => c.code);
  const ctl = (PA.SSP.controls || []).map((c) => c.c);
  const pick = (a, n) => a.filter((_, i) => i % Math.max(1, Math.floor(a.length / n)) === 0).slice(0, n);
  const lazy = [...pick(comps, 8).flatMap((c) => ["component--" + c, "component--" + c + "--controls", "component--" + c + "--software"]), ...pick(ctl, 6).map((c) => "rec--a-tests-control--" + c)];
  return { menu, mine, lazy, folded: Object.keys(PA.v3.MERGED) };
});
// Record pages reached by a row (pass 2): up to five of each kind from every list, as the rows name them.
{
  const seen = {};
  for (const r of [...new Set([...info.menu, ...info.mine])]) {
    await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(120);
    const gos = await p.evaluate(() => [...document.querySelectorAll("#main [data-go]")].map((e) => e.getAttribute("data-go")).filter((g) => /--/.test(g)));
    for (const g of gos) { const k = g.split("--")[0] + (g.includes("@") ? "@" : ""); seen[k] = seen[k] || new Set(); if (seen[k].size < 5) seen[k].add(g); }
  }
  info.rows = Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, v.size]));
  info.lazy = [...new Set([...info.lazy, ...Object.values(seen).flatMap((v) => [...v])])];
}
const probs = [], landed = {};
const visit = async (r, w) => {
  cur = r + "@" + w;
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(90);
  return p.evaluate(() => { const m = document.getElementById("main"), nav = document.getElementById("nav"), full = document.getElementById("proto").classList.contains("fullwin"); return { hash: location.hash.slice(1), ph: /Not drawn yet|Part of V3/.test(m.textContent), len: (m.innerText || "").trim().length, menu: full || nav.querySelectorAll("a.item").length >= 10, on: full || !!nav.querySelector("a.item.on"), over: document.documentElement.scrollWidth > innerWidth + 1 || m.scrollWidth > m.clientWidth + 2, home: /^\s*Home\b/.test((m.querySelector("h1,h2,h3") || {}).innerText || "") }; });
};
for (const w of [1440, 390]) {
  await p.setViewportSize({ width: w, height: w === 390 ? 844 : 900 });
  for (const r of [...new Set([...info.menu, ...info.mine, ...info.lazy])]) {
    const st = await visit(r, w);
    if (st.ph) probs.push(`${r}@${w}: placeholder`); else if (st.len < 30) probs.push(`${r}@${w}: nearly empty`);
    if (!st.menu) probs.push(`${r}@${w}: the program menu is gone`); else if (!st.on && w === 1440) probs.push(`${r}@${w}: no menu entry marked`);
    if (st.over) probs.push(`${r}@${w}: sideways scroll`);
  }
}
await p.setViewportSize({ width: 1440, height: 900 });
for (const r of info.folded) { const st = await visit(r, 1440); landed[r] = st.hash; if (st.ph || st.len < 30 || st.home) probs.push(`${r}: folded address lands badly (${st.hash})`); if (!st.menu) probs.push(`${r} → ${st.hash}: the program menu is gone`); }
const out = { build: path.basename(build), menu: info.menu.length, pages: info.mine.length, records: info.lazy.length, kinds: info.rows, folded: landed, problems: probs, errors: errs };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`sweepr: ${info.menu.length} menu entries, ${info.mine.length} pages, ${info.lazy.length} record pages, ${info.folded.length} folded addresses; problems ${probs.length}; page errors ${errs.length}`);
probs.slice(0, 40).forEach((x) => console.log("  -", x)); errs.slice(0, 10).forEach((x) => console.log("  !", x));
console.log("folded →", JSON.stringify(landed));
await b.close();
