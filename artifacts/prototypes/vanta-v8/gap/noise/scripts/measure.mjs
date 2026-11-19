// node measure.mjs <prototype.html> <outDir>: measure every nav route, records, editors and two open panels at 1440x900, then the ten busiest at 390x844.
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out] = process.argv.slice(2);
const lib = fs.readFileSync(new URL("./measure-lib.js", import.meta.url), "utf8");
const file = "file://" + path.resolve(html);
fs.mkdirSync(`${out}/shots`, { recursive: true });
const RECORDS = ["control-si2", "evidence-page-e1", "policy-page-ac-1", "campaign", "component-mc", "person-joel-barrantes", "check-scan", "stigs-mission-computer-rhel9", "data-calls-fisma", "frameworks-high", "plan-cp", "integration-emass"];
const EDITORS = ["ssp", "policy-editor", "program-new"];
const PANELS = [["risks", "Risks register, first row"], ["controls", "Controls register, first row"], ["findings", "Findings register, first row"]];
const META = new Set(["study", "before-after", "nav-options"]);
const b = await chromium.launch();
const px = await b.newPage(); await px.goto("about:blank"); await px.evaluate(lib);
async function run(width, height, routes, tag) {
  const p = await b.newPage({ viewport: { width, height } }); const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
  await p.goto(file + "#home"); await p.waitForTimeout(700); await p.evaluate(lib);
  const nav = await p.evaluate(() => PA.navItems());
  const label = Object.fromEntries(nav);
  const res = {};
  const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(550); await p.evaluate(() => { scrollTo(0, 0); const m = document.getElementById("main"); if (m) m.scrollTop = 0; document.querySelectorAll("#main *").forEach((e) => { if (e.scrollTop) e.scrollTop = 0; }); }); await p.waitForTimeout(80); };
  const pix = async (rect) => { if (!rect || rect.w < 10 || rect.h < 10) return null; const buf = await p.screenshot({ clip: { x: rect.x, y: Math.max(0, rect.y), width: Math.min(rect.w, width - rect.x), height: Math.min(rect.h, height - Math.max(0, rect.y)) } }); return px.evaluate((u) => window.__pixels(u), "data:image/png;base64," + buf.toString("base64")); };
  for (const r of routes) {
    await go(r);
    const m = await p.evaluate((vh) => window.__measure({ root: "#main", vh }), height);
    const shot = `${out}/shots/${tag}-${r}.png`; await p.screenshot({ path: shot });
    const info = await p.evaluate(() => ({ title: (document.querySelector("#main h1, #main h2, #main h3") || {}).textContent || "", inprog: document.getElementById("shell").classList.contains("inprog"), full: document.getElementById("proto").classList.contains("fullwin"), moded: document.getElementById("proto").classList.contains("moded"), hash: location.hash }));
    res[r] = { route: r, label: label[r] || null, nav: await p.evaluate((r) => PA.navKey(r), r), ...info, meta: META.has(r), shot, pixels: m ? await pix(m.rect) : null, ...m };
    process.stdout.write(".");
  }
  // open side panels
  if (tag === "d") for (const [r, what] of PANELS) {
    await go(r);
    const ok = await p.evaluate(() => { const t = [...document.querySelectorAll("#main tr[data-panel]")].find((x) => x.dataset.panel); if (!t) return false; t.click(); return true; });
    await p.waitForTimeout(500);
    const pm = ok ? await p.evaluate((vh) => window.__measure({ root: "#panel", vh }), height) : null;
    const mm = await p.evaluate((vh) => window.__measure({ root: "#main", vh }), height);
    const shot = `${out}/shots/${tag}-panel-${r}.png`; await p.screenshot({ path: shot });
    res["panel:" + r] = { route: r, label: `Panel over ${label[r]} (${what})`, panelOpened: ok, shot, panel: pm, mainBehind: { colours: mm && mm.colours, above: mm && mm.above }, pixels: pm ? await pix(pm.rect) : null };
    await p.evaluate(() => { const c = document.getElementById("closePanel"); if (c) c.click(); });
  }
  await p.close(); return { res, errors: [...new Set(errors)].slice(0, 10), nav };
}
const t0 = Date.now();
const first = await (async () => { const p = await b.newPage(); await p.goto(file + "#home"); await p.waitForTimeout(600); const n = await p.evaluate(() => PA.navItems()); await p.close(); return n; })();
const desktopRoutes = [...first.map(([r]) => r), ...RECORDS, ...EDITORS];
const D = await run(1440, 900, desktopRoutes, "d");
fs.writeFileSync(`${out}/metrics-desktop.json`, JSON.stringify(D, null, 1));
// rank: mean percentile over above-the-fold measures (product pages only)
const KEYS = [["colours.above.togetherClustered", "distinct non-grey colours"], ["colours.above.hues.length", "hue families"], ["above.pills", "pills/chips/tags"], ["above.gadgets", "charts and meters"], ["above.cards", "cards"], ["above.banners", "banners"], ["above.buttons", "buttons"], ["above.icons", "icons and glyphs"], ["fonts.distinctAbove", "font size/weight pairs"], ["pixels.colourfulPct", "colourful pixels %"]];
const get = (o, k) => k.split(".").reduce((a, x) => (a == null ? a : x === "length" ? a.length : a[x]), o);
const prod = Object.values(D.res).filter((x) => x.colours && !x.meta);
for (const [k] of KEYS) { const vals = prod.map((x) => get(x, k) || 0).sort((a, b) => a - b); for (const x of prod) { const v = get(x, k) || 0; const below = vals.filter((y) => y < v).length, eq = vals.filter((y) => y === v).length; x.pct = x.pct || {}; x.pct[k] = +(((below + eq / 2) / vals.length) * 100).toFixed(1); } }
for (const x of prod) x.noise = +(Object.values(x.pct).reduce((a, v) => a + v, 0) / KEYS.length).toFixed(1);
const ranked = prod.slice().sort((a, b) => b.noise - a.noise);
const top10 = ranked.slice(0, 10).map((x) => x.route);
const P = await run(390, 844, top10, "m");
fs.writeFileSync(`${out}/metrics-phone.json`, JSON.stringify(P, null, 1));
console.log("\nranked:", ranked.slice(0, 15).map((x) => `${x.route}:${x.noise}`).join(" "), "\nerrors:", D.errors, P.errors, "secs", Math.round((Date.now() - t0) / 1000));
fs.writeFileSync(`${out}/rank.json`, JSON.stringify({ keys: KEYS, ranked: ranked.map((x) => ({ route: x.route, label: x.label, noise: x.noise, pct: x.pct })) }, null, 1));
await b.close();
