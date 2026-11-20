// V3 off must be v2: every screen, a sample of previews per screen, every dialog, the menu on every menu page and the search's page
// list, drawn by the frozen v2 build (proto/out/prototype-v2.html) and by a V3 build with V3 off, must match.
// usage: node SP/vanta/v3/offcheck.mjs <v3 build.html> [outJson]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const V2 = SP + "/vanta/proto/out/prototype-v2.html";
const CAND = process.argv[2] && (await import("path")).resolve(process.argv[2]);
const OUT = process.argv[3] || null;
if (!CAND) { console.error("usage: node offcheck.mjs <build.html> [out.json]"); process.exit(2); }
// Pages whose difference is intended: the Before & after page gains its V3 tab, the findings page its V3 links.
const ALLOW = /^(before-after|walkthrough)/;
const b = await chromium.launch();
async function open(file) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await p.goto("file://" + file + "#home"); await p.waitForTimeout(600);
  await p.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} if (window.PA.v3 && window.PA.v3.on()) window.PA.v3.set(false); window.PA.v2.reset(); });
  await p.waitForTimeout(200);
  return { p, errs };
}
const A = await open(V2), B = await open(CAND);
const dump = (page) => page.evaluate((ALLOWS) => {
  const ALLOW = new RegExp(ALLOWS);
  const PA = window.PA, out = { S: {}, P: {}, M: {}, nav: PA.navItems().map((x) => x.join("|")).join(";") };
  const keys = Object.keys(PA.S).filter((k) => !ALLOW.test(k) && !(PA.S[k] && PA.S[k].__v3only)).sort();
  const tpl = document.createElement("template");
  for (const k of keys) {
    let html; try { html = String(PA.S[k]()); } catch (e) { html = "ERR " + e.message; }
    out.S[k] = html;
    tpl.innerHTML = html;
    const seen = new Set();
    for (const el of tpl.content.querySelectorAll("[data-panel]")) {
      const id = el.getAttribute("data-panel") + "|" + (el.getAttribute("data-id") || "");
      if (seen.has(id) || seen.size >= 3) continue; seen.add(id);
      if (out.P[id] !== undefined) continue;
      const [kind, pid] = id.split("|"); const f = PA.P[kind];
      try { const o = f ? f(pid) : null; out.P[id] = o ? (o.label || "") + "\n" + (o.body || "") : "NULL"; } catch (e) { out.P[id] = "ERR " + e.message; }
    }
  }
  for (const k of Object.keys(PA.M).sort()) { try { const o = PA.M[k](); out.M[k] = o ? [o.title, o.body, o.footer].join("\n") : "NULL"; } catch (e) { out.M[k] = "ERR " + e.message; } }
  return out;
}, ALLOW.source);
const da = await dump(A.p), db = await dump(B.p);
const diffs = [];
for (const part of ["S", "P", "M"]) {
  for (const k of Object.keys(da[part])) {
    if (!(k in db[part])) { diffs.push([part, k, "missing in the V3 build"]); continue; }
    if (da[part][k] !== db[part][k]) {
      const x = da[part][k], y = db[part][k]; let i = 0; while (i < x.length && x[i] === y[i]) i++;
      diffs.push([part, k, `first difference at ${i}: v2 «${x.slice(Math.max(0, i - 40), i + 60)}» V3-off «${y.slice(Math.max(0, i - 40), i + 60)}»`]);
    }
  }
}
if (da.nav !== db.nav) diffs.push(["nav", "navItems", "the menu's page list differs"]);
// The menu as drawn, on every menu page.
const routes = await A.p.evaluate(() => window.PA.navItems().map(([k]) => k));
for (const r of routes) {
  if (ALLOW.test(r)) continue;
  const get = async (pg) => { await pg.evaluate((r) => { location.hash = r; }, r); await pg.waitForTimeout(60); return pg.evaluate(() => [document.getElementById("rail").innerHTML, document.getElementById("nav").innerHTML, document.getElementById("main").innerHTML.length].join("\n§\n")); };
  const x = await get(A.p), y = await get(B.p);
  if (x !== y) diffs.push(["drawn", r, "the menu or the page drawn by the router differs"]);
}
const res = { v2: V2, build: CAND, screens: Object.keys(da.S).length, previews: Object.keys(da.P).length, dialogs: Object.keys(da.M).length, menuPages: routes.length, diffs: diffs.length, errors: { v2: A.errs, build: B.errs }, list: diffs.slice(0, 200) };
if (OUT) { const fs = await import("fs"); fs.writeFileSync(OUT, JSON.stringify(res, null, 1)); }
console.log(`offcheck: ${res.screens} screens, ${res.previews} previews, ${res.dialogs} dialogs, ${res.menuPages} menu pages; differences ${res.diffs}; page errors v2 ${A.errs.length}, build ${B.errs.length}`);
for (const d of diffs.slice(0, 25)) console.log(" -", d.join(" | ").slice(0, 400));
await b.close();
process.exit(diffs.length || B.errs.length ? 1 : 0);
