// Pass 3 check: every V3 page against Josef's five rules of 21 Nov. usage: node check.mjs <build.html> [lane letter] [out.json]
//  1 the page takes the width   2 one row of controls over a table (no strip of tabs or chips for kinds, filters, views or
//  actions; a list page's actions stand in that row)   3 a list with a search has views   4 rows are one compact line
//  5 a row that goes to a record has an eye, and the preview lists what the record's page lists
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path"); const fs = await import("fs");
const build = path.resolve(process.argv[2]); const ONLY = (process.argv[3] || "").toUpperCase(); const OUT = process.argv[4];
const laneOf = (r) => { const k = r.split("--")[0]; if (/^(overview|gate)/.test(k)) return "O"; if (/^(system|component|connection)/.test(k)) return "S"; if (/^control/.test(k)) return "C"; if (/^(requirement|evidence|document|artifact|ssp|sctm|rec$)/.test(k)) return "D"; return "E"; };
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1728, height: 964 } });
const errs = []; let cur = ""; p.on("pageerror", (e) => errs.push(cur + ": " + e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
const info = await p.evaluate(() => { const menu = PA.v3.menu.flatMap(([, items]) => items.map(([k]) => k)); const mine = Object.keys(PA.S).filter((k) => menu.some((m) => k === m || k.startsWith(m + "-")) && !/^(before-after|walkthrough|evidence-page-)/.test(k)); return { menu, mine }; });
const routes = [...new Set([...info.menu, ...info.mine])].filter((r) => !ONLY || laneOf(r) === ONLY);
const probs = []; const say = (r, m) => probs.push(`[${laneOf(r)}] ${r}: ${m}`);
const look = async (r) => {
  cur = r; await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(170);
  return p.evaluate(() => {
    const m = document.querySelector("#main > .main") || document.getElementById("main"); if (!m) return null;
    const q = (s, root) => [...(root || m).querySelectorAll(s)], vis = (e) => e.getClientRects().length > 0, tx = (e) => e.textContent.replace(/\s+/g, " ").trim();
    const name = (h) => { const c = h.cloneNode(true); c.querySelectorAll(".k3-ct").forEach((x) => x.remove()); return tx(c); };
    const tables = q("table").filter(vis).map((t) => { const fr = t.closest(".frame"); const wrap = !!(fr && fr.classList.contains("k3-wrap")); const rows = [...t.querySelectorAll("tbody tr")].filter(vis); const tall = rows.filter((r) => r.getBoundingClientRect().height > 44 && !r.querySelector("td.k3-cw")); const ex = tall[0]; let why = ""; if (ex) { const c = [...ex.children].sort((a, b) => b.scrollHeight - a.scrollHeight)[0]; why = `col "${tx(t.querySelectorAll("thead th")[[...ex.children].indexOf(c)] || { textContent: "" })}": ${tx(c).slice(0, 70)}`; }
      const sec = t.closest(".k3-sec"); return { title: sec ? name(sec.querySelector("h2") || { cloneNode: () => document.createElement("i") }) : "", rows: rows.length, tall: wrap ? 0 : tall.length, wrap, why, noEye: rows.filter((r) => /--/.test(r.getAttribute("data-go") || "") && !r.querySelector(".k3-eye")).length, noEyeEx: (rows.find((r) => /--/.test(r.getAttribute("data-go") || "") && !r.querySelector(".k3-eye")) || { getAttribute: () => "" }).getAttribute("data-go") }; });
    const bars = q(".k3-tb").filter(vis).map((t) => { const kids = [...t.children].flatMap((c) => (c.classList.contains("k3-fs") ? [...c.children] : [c])).filter(vis); const tops = kids.map((e) => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2)); return { list: t.getAttribute("data-k3-list") || "", search: !!t.querySelector("input[type=search]"), rowsOf: new Set(tops.map((y) => Math.round(y / 10))).size, fold: t.classList.contains("k3-fold"), labels: [...t.querySelectorAll(".k3-flt select")].map((s) => s.getAttribute("aria-label")), n: kids.length }; });
    const wr = document.getElementById("main").getBoundingClientRect(), inner = q(":scope > *").filter(vis).map((e) => e.getBoundingClientRect().right);
    return { full: document.getElementById("proto").classList.contains("fullwin"), old: !m.classList.contains("k3"), hash: location.hash.slice(1), strips: q(".k3-chips, .k3-rtabs").filter(vis).length, tabs: q(".k3-tabs").filter(vis).length, headA: q(".k3-head-a").filter(vis).length, bars, tables, gap: Math.round(wr.right - Math.max(...inner, 0)),
      secs: q(".k3-sec h2").filter(vis).map(name).concat(q(".k3-tabs .k3-tab").filter(vis).map(name)),
      go: [...m.querySelectorAll("tr[data-go]")].map((e) => e.getAttribute("data-go")).filter((g) => /--/.test(g)).slice(0, 60), eyes: [...m.querySelectorAll(".k3-eye")].slice(0, 80).map((e) => e.getAttribute("data-panel") + "::" + e.getAttribute("data-id")) };
  });
};
const judge = (r, st, isRec) => {
  if (st.full || st.old) return;
  if (st.gap > 48) say(r, `does not take the width (${st.gap}px free on the right)`);
  if (st.strips) say(r, `${st.strips} strip(s) of chips or kind tabs left`);
  if (st.tabs > 1) say(r, `${st.tabs} strips of tabs`);
  st.bars.forEach((t) => { if (t.fold) say(r, `a filter stands alone outside a toolbar (${t.labels.join(", ")})`); if (t.rowsOf > 1) say(r, `the toolbar takes ${t.rowsOf} rows at 1728 (${t.n} controls: ${t.labels.join(", ")})`); if (t.search && !t.list && !isRec) say(r, "a list with a search has no views (give K.toolbar an id)"); });
  if (!isRec && st.headA && st.bars.some((t) => !t.fold)) say(r, "actions left in the page header beside a toolbar");
  st.tables.forEach((t) => { if (t.tall) say(r, `${t.tall} of ${t.rows} rows are taller than one line${t.title ? ` in "${t.title}"` : ""} (${t.why})`); if (t.noEye) say(r, `${t.noEye} rows go to a record with no eye${t.title ? ` in "${t.title}"` : ""} (${t.noEyeEx})`); });
};
const pages = [], recs = {}, pv = {};
for (const r of routes) { const st = await look(r); if (!st) continue; pages.push(r); judge(r, st, false); for (const g of st.go) { const k = g.split("--")[0]; (recs[k] = recs[k] || new Set()).size < 2 && recs[k].add(g); } for (const e of st.eyes) { const [k, id] = e.split("::"); if (!pv[k]) pv[k] = { from: r, id }; } }
let nrec = 0;
for (const set of Object.values(recs)) for (const g of set) { if (ONLY && laneOf(g) !== ONLY) continue; const st = await look(g); if (st) { nrec++; judge(g, st, true); for (const e of st.eyes) { const [k, id] = e.split("::"); if (!pv[k]) pv[k] = { from: g, id }; } } }
// previews against their pages
const norm = (s) => s.toLowerCase().replace(/[^a-z]+/g, " ").trim(); let npv = 0;
for (const [k, v] of Object.entries(pv)) {
  await p.evaluate((r) => { location.hash = r; }, v.from); await p.waitForTimeout(170);
  const ok = await p.evaluate(([k, id]) => { const e = [...document.querySelectorAll("#main .k3-eye")].find((x) => x.getAttribute("data-panel") === k && x.getAttribute("data-id") === id); if (!e) return false; e.click(); return true; }, [k, v.id]); await p.waitForTimeout(260);
  if (!ok) continue;
  const pn = await p.evaluate(() => { const pn = document.querySelector("#panel .k3-pn"); if (!pn) return null; const tx = (e) => e.textContent.replace(/\s+/g, " ").trim(); const name = (h) => { const c = h.cloneNode(true); c.querySelectorAll(".k3-ct").forEach((x) => x.remove()); return tx(c); }; return { secs: [...pn.querySelectorAll(".k3-sec h2")].map(name), facts: [...pn.querySelectorAll(".k3-facts dt")].map(tx), full: pn.getAttribute("data-v2r-full") || "", wide: [...pn.querySelectorAll("table")].filter((t) => t.scrollWidth > t.parentElement.clientWidth + 2).length, tall: [...pn.querySelectorAll("tbody tr")].filter((r) => r.getBoundingClientRect().height > 44 && !r.closest(".k3-wrap") && !r.querySelector("td.k3-cw")).length }; });
  await p.evaluate(() => { const c = document.querySelector("#panel [data-close], #panel .bar-top button:last-child"); if (c) c.click(); }); await p.waitForTimeout(80);
  if (!pn || !pn.full) { say(v.from, `the preview of ${k} names no page`); continue; }
  if (ONLY && laneOf(pn.full) !== ONLY) continue;
  npv++; const st = await look(pn.full); if (!st) continue;
  const have = new Set(pn.secs.concat(pn.facts).map(norm)); const miss = [...new Set(st.secs)].filter((s) => !/^(overview|details|status|summary)$/i.test(s) && !have.has(norm(s)));
  if (miss.length) say(pn.full, `its preview lacks what the page lists: ${miss.join(" | ")}`);
  if (pn.wide) say(pn.full, `${pn.wide} table(s) in its preview scroll sideways`);
  if (pn.tall) say(pn.full, `${pn.tall} rows in its preview are taller than one line`);
}
errs.forEach((e) => probs.push("[!] page error " + e));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ build: path.basename(build), pages: pages.length, records: nrec, previews: npv, problems: probs }, null, 1));
console.log(`p3 check${ONLY ? " lane " + ONLY : ""}: ${pages.length} pages, ${nrec} record pages, ${npv} previews; problems ${probs.length}`);
probs.forEach((x) => console.log("  -", x));
await b.close();
