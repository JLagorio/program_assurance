// Pass 3 audit: every V3 list page: how many strips sit over its tables, where its actions are, how tall its rows are.
// usage: node audit.mjs <build.html> [out.json]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path"); const fs = await import("fs");
const build = path.resolve(process.argv[2]); const OUT = process.argv[3];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1728, height: 964 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
const info = await p.evaluate(() => { const menu = PA.v3.menu.flatMap(([, items]) => items.map(([k]) => k)); const mine = Object.keys(PA.S).filter((k) => menu.some((m) => k === m || k.startsWith(m + "-")) && !/^(before-after|walkthrough)/.test(k)); return { menu, mine }; });
const routes = [...new Set([...info.menu, ...info.mine])];
const recs = {};
const out = [];
const look = async (r) => {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(160);
  return p.evaluate(() => {
    const m = document.querySelector("#main > .main") || document.getElementById("main"); if (!m) return null;
    const q = (s) => [...m.querySelectorAll(s)];
    const vis = (e) => e.getClientRects().length > 0;
    const tx = (e) => e.textContent.replace(/\s+/g, " ").trim();
    const tables = q("table.k3-table, table").filter(vis).map((t) => { const rows = [...t.querySelectorAll("tbody tr")].filter(vis); const hs = rows.map((r) => Math.round(r.getBoundingClientRect().height)); return { cols: [...t.querySelectorAll("thead th")].map(tx).join("|").slice(0, 120), rows: rows.length, maxH: Math.max(0, ...hs), tall: hs.filter((h) => h > 46).length, k3: t.classList.contains("k3-table") }; });
    const mr = m.getBoundingClientRect(), wr = document.getElementById("main").getBoundingClientRect();
    const inner = q(":scope > *").filter(vis).map((e) => e.getBoundingClientRect().right); 
    return { full: document.getElementById("proto").classList.contains("fullwin"), hash: location.hash.slice(1), h1: (m.querySelector("h1") || {}).textContent || "",
      tabs: q(".k3-tabs").filter(vis).map((n) => [...n.querySelectorAll(".k3-tab")].map(tx).join(" · ").slice(0, 140)),
      rtabs: q(".k3-rtabs").filter(vis).map((n) => [...n.querySelectorAll(".k3-tab")].map(tx).join(" · ").slice(0, 140)),
      seg: q(".k3-seg").filter(vis).map((n) => tx(n).slice(0, 80)),
      chips: q(".k3-chips").filter(vis).map((n) => [...n.querySelectorAll(".k3-chip")].map(tx).join(" · ").slice(0, 160)),
      tools: q(".k3-tools").filter(vis).map((n) => [...n.querySelectorAll("input, select, button, a.btn")].map((e) => e.matches("input") ? "[search]" : e.matches("select") ? "<" + (e.getAttribute("aria-label") || (e.options[0] || {}).text || "") + ">" : tx(e)).join(" ").slice(0, 160)),
      headA: q(".k3-head-a").filter(vis).map((n) => [...n.querySelectorAll("button, a.btn, summary")].map(tx).join(" | ").slice(0, 140)),
      secA: q(".k3-sec-a").filter(vis).length, tables, gapRight: Math.round(wr.right - Math.max(...inner, 0)), mainW: Math.round(mr.width), oldPage: !m.classList.contains("k3"),
      go: [...m.querySelectorAll("tr[data-go]")].map((e) => e.getAttribute("data-go")).filter((g) => /--/.test(g)).slice(0, 40), eyes: [...m.querySelectorAll(".k3-eye")].slice(0, 60).map((e) => e.getAttribute("data-panel") + "::" + e.getAttribute("data-id")) };
  });
};
for (const r of routes) { const st = await look(r); if (!st) continue; out.push(Object.assign({ route: r }, st)); for (const g of st.go) { const k = g.split("--")[0]; (recs[k] = recs[k] || new Set()).size < 2 && recs[k].add(g); } }
const recOut = [];
for (const [k, set] of Object.entries(recs)) for (const g of set) { const st = await look(g); if (st) recOut.push(Object.assign({ route: g, kind: k }, st)); }
// previews: one eye per kind: what the panel holds beside facts
const pv = {}; for (const o of out) for (const e of o.eyes) { const k = e.split("::")[0]; if (!pv[k]) pv[k] = { from: o.route, id: e.split("::")[1] }; }
for (const [k, v] of Object.entries(pv)) {
  await p.evaluate((r) => { location.hash = r; }, v.from); await p.waitForTimeout(160);
  const ok = await p.evaluate(([k, id]) => { const e = [...document.querySelectorAll(".k3-eye")].find((x) => x.getAttribute("data-panel") === k && x.getAttribute("data-id") === id); if (!e) return false; e.click(); return true; }, [k, v.id]); await p.waitForTimeout(200);
  v.panel = ok ? await p.evaluate(() => { const pn = document.querySelector("#panel .k3-pn") || document.getElementById("panel"); if (!pn) return null; const tx = (e) => e.textContent.replace(/\s+/g, " ").trim(); return { facts: [...pn.querySelectorAll(".k3-facts > div")].map((d) => tx(d.querySelector("dt"))).join(", "), secs: [...pn.querySelectorAll(".k3-sec h2, h5, h3")].map(tx).join(" | ").slice(0, 300), tables: pn.querySelectorAll("table").length, len: tx(pn).length, full: (pn.getAttribute("data-v2r-full") || "") }; }) : null;
  if (v.panel && v.panel.full) { const st = await look(v.panel.full); v.page = st ? { secs: await p.evaluate(() => [...document.querySelectorAll("#main .k3-sec h2, #main .k3-tabs .k3-tab")].map((e) => e.textContent.replace(/\s+/g, " ").trim()).join(" | ").slice(0, 400)) } : null; }
  await p.evaluate(() => { const c = document.querySelector("#panel [data-close], #panel .bar-top button:last-child"); if (c) c.click(); });
}
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ pages: out, records: recOut, previews: pv, errs }, null, 1));
const line = (o) => `${o.route}${o.hash !== o.route ? " → " + o.hash : ""}${o.full ? " [full window]" : ""}${o.oldPage ? " [v2 page]" : ""} | w ${o.mainW} gap ${o.gapRight} | tabs ${o.tabs.length} rtabs ${o.rtabs.length} seg ${o.seg.length} chips ${o.chips.length} tools ${o.tools.length} headA ${o.headA.length ? "«" + o.headA.join("» «") + "»" : 0} | tables ${o.tables.map((t) => `${t.rows}r max${t.maxH}${t.tall ? " tall" + t.tall : ""}`).join(", ")}`;
console.log("PAGES"); out.forEach((o) => console.log(line(o)));
console.log("RECORDS"); recOut.forEach((o) => console.log(line(o)));
console.log("PREVIEWS"); Object.entries(pv).forEach(([k, v]) => console.log(k, v.id, "| panel:", v.panel ? `facts[${v.panel.facts}] secs[${v.panel.secs}] tables ${v.panel.tables}` : "none", "| page:", v.page ? v.page.secs : "-"));
console.log("errors", errs.length, errs.slice(0, 5));
await b.close();
