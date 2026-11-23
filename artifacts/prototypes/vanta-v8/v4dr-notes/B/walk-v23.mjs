// Lane B's walk: node walk.mjs <build.html> [--quick]
// Opens every lane B route with V3 on at 1440×900 and 390×844; fails on a console error, a page wider than the window, or a
// table cell taller than one line. Clicks every button and link once and fails if one does nothing. Then the lane's own walks:
// each stat tile filters the list, the drawer walks Next three times, the picker hides what is out of period until "Show
// them", and the import clears every red cell and submits.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2], quick = process.argv.includes("--quick");
console.log("build:", build);
const ROUTES = ["dr-evidence", "dr-evidence--v3x-ev-270", "dr-evidence--v3x-ev-95", "dr-evidence-pick", "dr-import", "dr-import--review"];
const fails = [], counts = { pages: 0, clicked: 0, skipped: 0, dead: 0, cells: 0 };
const fail = (m) => { fails.push(m); console.log("FAIL", m); };
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
const go = async (r) => { await p.evaluate((r) => { if (location.hash.slice(1) === r) PA.v2.redraw(); else location.hash = r; }, r); await p.waitForTimeout(450); };
const closeAll = async () => { await p.evaluate(() => { const m = document.querySelector("#modal"); if (m && m.open !== false && m.innerHTML && getComputedStyle(m).display !== "none") document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); }); await p.keyboard.press("Escape"); await p.waitForTimeout(120); await p.evaluate(() => { const pn = document.getElementById("panel"); if (pn && !pn.hidden) { const x = pn.querySelector("#closePanel, [aria-label^='Close']"); if (x) x.click(); else { pn.hidden = true; pn.innerHTML = ""; } } document.querySelectorAll("details[open]").forEach((d) => { d.open = false; }); }); await p.waitForTimeout(80); };
const checkPage = async (label) => {
  counts.pages++;
  const r = await p.evaluate(() => {
    const m = document.getElementById("main"), out = { wide: document.documentElement.scrollWidth > innerWidth + 1 || m.scrollWidth > m.clientWidth + 2, tall: [] };
    for (const td of m.querySelectorAll("table td")) {
      if (td.closest(".k3-cw") || td.classList.contains("k3-cw") || td.closest(".k3-grow") || !td.offsetParent) continue;
      const lh = parseFloat(getComputedStyle(td).lineHeight) || 20, kids = [...td.querySelectorAll("*")].filter((x) => x.children.length === 0 && x.textContent.trim());
      const rng = document.createRange(); rng.selectNodeContents(td); const rects = [...rng.getClientRects()].filter((x) => x.width > 1 && x.height > 1);
      const tops = [...new Set(rects.map((x) => Math.round(x.top / 6)))];
      if (tops.length > 2 || td.getBoundingClientRect().height > Math.max(56, lh * 2.4)) out.tall.push(td.innerText.slice(0, 60));
      void kids;
    }
    return out;
  });
  counts.cells++;
  if (r.wide) fail(`${label}: page wider than the window`);
  if (r.tall.length) fail(`${label}: ${r.tall.length} cell(s) taller than one line, e.g. "${r.tall[0]}"`);
};
const snap = () => p.evaluate(() => {
  const m = document.getElementById("main"), modal = document.getElementById("modal"), panel = document.getElementById("panel"), toast = document.querySelector(".toast, #toast, [role='status'].show, .v2-toast");
  let hsh = 0; const s = (m ? m.innerHTML : "") + "|" + (modal ? modal.innerHTML.length + (modal.open ? "o" : "") + getComputedStyle(modal).display : "") + "|" + (panel ? panel.innerHTML.length + panel.className : "") + "|" + document.body.className + "|" + [...document.querySelectorAll("details[open]")].length + "|" + (toast ? toast.textContent : "") + "|" + document.querySelectorAll("[role=tooltip]:not([hidden])").length;
  for (let i = 0; i < s.length; i++) hsh = (hsh * 31 + s.charCodeAt(i)) | 0;
  return { h: hsh, hash: location.hash, toasts: document.body.innerText.length };
});
const keysOf = () => p.evaluate(() => [...document.querySelectorAll("#main button, #main a[href], #main summary")].filter((el) => el.offsetParent && el.getAttribute("aria-disabled") !== "true" && !el.disabled && el.getAttribute("aria-pressed") !== "true" && el.getAttribute("aria-checked") !== "true" && !el.closest("details:not([open]) > div")).map((el) => [el.tagName, (el.innerText || "").trim().slice(0, 40), el.getAttribute("data-k3") || "", el.getAttribute("data-k3a") || "", el.getAttribute("href") || "", el.getAttribute("aria-label") || "", el.getAttribute("data-panel") || "", el.getAttribute("data-id") || "", el.getAttribute("data-go") || "", el.className].join("¦")));
const clickAll = async (route, prep) => {
  await go(route); if (prep) await prep();
  const keys = [...new Set(await keysOf())];
  const limit = quick ? 40 : 400;
  for (const key of keys.slice(0, limit)) {
    if (/Back to the Drata tab|See current/.test(key)) { counts.skipped++; continue; } // the lead's routes; checked by the lead
    await closeAll();
    if (route === "dr-evidence") await p.evaluate(() => { const v = PA.v3k.get("dr.B.ev", {}) || {}; if (v.status || v.source || v.owner || v.fam || v.q || v.page) { PA.v3k.set("dr.B.ev", {}); PA.v2.redraw(); } });
    if (!(await p.evaluate(() => location.hash)).endsWith(route)) { await go(route); if (prep) await prep(); }
    const ix = await p.evaluate((key) => [...document.querySelectorAll("#main button, #main a[href], #main summary")].findIndex((el) => el.offsetParent && [el.tagName, (el.innerText || "").trim().slice(0, 40), el.getAttribute("data-k3") || "", el.getAttribute("data-k3a") || "", el.getAttribute("href") || "", el.getAttribute("aria-label") || "", el.getAttribute("data-panel") || "", el.getAttribute("data-id") || "", el.getAttribute("data-go") || "", el.className].join("¦") === key), key);
    if (ix < 0) { counts.skipped++; continue; }
    const before = await snap();
    await p.evaluate((ix) => { const el = [...document.querySelectorAll("#main button, #main a[href], #main summary")][ix]; el.scrollIntoView({ block: "center" }); el.click(); }, ix);
    await p.waitForTimeout(260);
    const after = await snap();
    counts.clicked++;
    if (after.h === before.h && after.hash === before.hash) { counts.dead++; fail(`${route}: a click did nothing: ${key.split("¦").join(" ¦ ").slice(0, 300)}`); }
    if (after.hash !== before.hash) await go(route);
  }
  await closeAll();
};

for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  await p.setViewportSize(vp);
  for (const r of ROUTES) { await go(r); await checkPage(`${r} @${vp.width}`); }
  for (const at of [1, 2, 3, 4]) { await go("dr-import"); await p.evaluate((at) => { PA.v3k.set("dr.B.imp", Object.assign({ file: "WS-X90 SCTM.xlsx" }, PA.v3k.get("dr.B.imp", {}) || {}, { at })); PA.v2.redraw(); }, at); await p.waitForTimeout(300); await checkPage(`dr-import step ${at + 1} @${vp.width}`); }
  await p.evaluate(() => PA.v3k.set("dr.B.imp", {}));
  // the drawer at this width
  await go("dr-evidence"); await p.evaluate(() => { const e = document.querySelector("#main .k3-eye"); if (e) e.click(); }); await p.waitForTimeout(350);
  const pw = await p.evaluate(() => { const pn = document.getElementById("panel"); return pn ? pn.scrollWidth > pn.clientWidth + 2 : false; });
  if (pw) fail(`drawer @${vp.width}: wider than its panel`);
  await closeAll();
}
await p.setViewportSize({ width: 1440, height: 900 });

// ——— Every button and link once ———
for (const r of ROUTES) await clickAll(r);
for (const at of [1, 2, 3, 4]) await clickAll("dr-import", async () => { await p.evaluate((at) => { PA.v3k.set("dr.B.imp", { file: "WS-X90 SCTM.xlsx", at }); PA.v2.redraw(); }, at); await p.waitForTimeout(300); });
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);

// ——— The register hides Error until Show them; the review address opens at Review with red and amber cells ———
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
await go("dr-evidence");
const er = await p.evaluate(async () => { const words = () => [...document.querySelectorAll("#main table.k3-table tbody tr")].map((tr) => ((tr.children[1] || {}).innerText || "").trim()); const e0 = words().filter((w) => w === "Error").length, first = words()[0]; const b = [...document.querySelectorAll("#main .drb-hid button")].find((x) => /Show them/.test(x.innerText)); if (b) b.click(); await new Promise((r) => setTimeout(r, 350)); const w1 = words(); PA.v3k.set("dr.B.ev", {}); return { e0, first, e1: w1.filter((w) => w === "Error").length, n1: w1.length }; });
console.log("error rows:", JSON.stringify(er));
if (er.e0 || er.first !== "Needs artifact" || !er.e1 || er.e1 !== er.n1) fail("register: Error rows not hidden by default, or Show them did not show them alone");
await go("dr-evidence"); await go("dr-import--review");
const rv = await p.evaluate(() => ({ err: document.querySelectorAll("#main .drk-sheet td.err").length, warn: document.querySelectorAll("#main .drk-sheet td.warn").length, step: ((document.querySelector("#main") || {}).innerText.match(/All \d+/) || [""])[0] }));
console.log("review address:", JSON.stringify(rv));
if (!rv.err || !rv.warn) fail("dr-import--review: no red or amber cells");

// ——— Each stat tile filters the list ———
await go("dr-evidence");
const tiles = await p.evaluate(() => [...document.querySelectorAll("#main .drk-stats > *")].map((t) => t.innerText.replace(/\s+/g, " ").trim()));
for (let i = 0; i < tiles.length; i++) {
  await go("dr-evidence");
  const r = await p.evaluate(async (i) => {
    const t = document.querySelectorAll("#main .drk-stats > *")[i], want = +t.innerText.replace(/[^\d]/g, ""), label = t.innerText.replace(/[\d,]/g, "").trim();
    t.click(); await new Promise((r) => setTimeout(r, 350));
    const rows = [...document.querySelectorAll("#main table.k3-table tbody tr:not(.k3-grow)")], words = rows.map((tr) => (tr.children[1] || {}).innerText || "");
    const foot = (document.querySelector("#main .k3-frame .pager") || {}).innerText || "";
    return { label, want, n: rows.length, allMatch: words.every((w) => w.trim() === label), foot };
  }, i);
  if (!r.allMatch || (r.want && !r.n)) fail(`tile ${tiles[i]}: the list did not filter (${r.n} rows, foot "${r.foot}")`);
  else console.log(`tile "${r.label}" → ${r.n} rows shown, foot "${r.foot.replace(/\s+/g, " ")}"`);
  await p.evaluate(() => PA.v3k.set("dr.B.ev", {}));
}

// ——— The drawer walks Next three times ———
await go("dr-evidence");
await p.evaluate(() => document.querySelector("#main .k3-eye").click()); await p.waitForTimeout(400);
const titles = [await p.evaluate(() => (document.querySelector("#panel h2, #panel h3, #panel h4, #panel .drk-dw-t") || {}).innerText || "")];
for (let i = 0; i < 3; i++) {
  const ok = await p.evaluate(() => { const nx = [...document.querySelectorAll("#panel button, #panel a")].find((x) => /next/i.test((x.getAttribute("aria-label") || "") + " " + x.innerText + " " + (x.title || ""))); if (!nx) return false; nx.click(); return true; });
  await p.waitForTimeout(350);
  if (!ok) { fail("drawer: no Next button"); break; }
  titles.push(await p.evaluate(() => (document.querySelector("#panel h2, #panel h3, #panel h4, #panel .drk-dw-t") || {}).innerText || ""));
}
const pos = await p.evaluate(() => (document.getElementById("panel") || {}).innerText.match(/\d+ of \d+/) || [""]);
console.log("drawer walk:", titles.map((t) => t.slice(0, 50)).join(" → "), "|", pos[0]);
if (new Set(titles).size !== titles.length) fail("drawer: Next did not change the record each time");
await closeAll();

// ——— The picker: only current evidence until "Show them" ———
await go("dr-evidence-pick");
const pk = await p.evaluate(async () => {
  const rows = () => [...document.querySelectorAll("#main table.k3-table tbody tr:not(.k3-grow)")];
  const off0 = rows().filter((tr) => tr.classList.contains("drb-off")).length, n0 = rows().length;
  const line = (document.querySelector("#main .drb-hid") || {}).innerText || "";
  const show = [...document.querySelectorAll("#main .drb-hid button")].find((b) => /Show them/.test(b.innerText)); if (show) show.click();
  await new Promise((r) => setTimeout(r, 350));
  const off1 = rows().filter((tr) => tr.classList.contains("drb-off")).length;
  const cb = document.querySelector("#main input[data-drb-pick]"); if (cb) { cb.click(); }
  await new Promise((r) => setTimeout(r, 350));
  const btn = [...document.querySelectorAll("#main .drb-pkbar button")].find((b) => /^Link \d/.test(b.innerText)); const label = btn ? btn.innerText : "";
  if (btn) btn.click(); await new Promise((r) => setTimeout(r, 350));
  const linked = [...document.querySelectorAll("#main .k3-sec h2")].map((h) => h.innerText).join(" | ");
  return { off0, n0, off1, line, label, linked };
});
console.log("picker:", JSON.stringify(pk));
if (pk.off0 !== 0) fail("picker: out-of-period rows shown before Show them");
if (!(pk.off1 > 0)) fail("picker: Show them showed nothing out of period");
if (!/Linked to/.test(pk.linked)) fail("picker: linking did not list the evidence on the objective");

// ——— The import: clear every red cell and submit ———
await p.evaluate(() => PA.v3k.set("dr.B.imp", {}));
await go("dr-import");
const imp = await p.evaluate(async () => {
  const w = (t) => new Promise((r) => setTimeout(r, t)), next = () => { const b = [...document.querySelectorAll("#main button")].filter((x) => /^(Next|Fix|Import)/.test(x.innerText.trim())).pop(); return b; };
  const sample = [...document.querySelectorAll("#main button")].find((x) => /Use the sample/.test(x.innerText)); sample.click(); await w(350);
  for (let i = 0; i < 3; i++) { next().click(); await w(350); }
  const fixes = () => [...document.querySelectorAll("#main .drb-fixes button")];
  const red0 = fixes().length, dis0 = next().getAttribute("aria-disabled") === "true" || next().disabled;
  let guard = 0;
  while (fixes().length && guard++ < 20) {
    fixes()[0].click(); await w(300);
    const s = document.querySelector("#modal select"); if (s && !s.value) { s.selectedIndex = 1; s.dispatchEvent(new Event("change", { bubbles: true })); }
    const ok = document.querySelector("#modal [data-k3-submit]"); if (ok) ok.click(); await w(350);
  }
  const red1 = fixes().length, b = next(), dis1 = b.getAttribute("aria-disabled") === "true" || b.disabled;
  b.click(); await w(350);
  const confirm = (document.querySelector("#main .drk-mv") || {}).innerText || "";
  next().click(); await w(350);
  const done = (document.querySelector("#main .drb-done") || {}).innerText || "";
  return { red0, dis0, red1, dis1, confirm: confirm.replace(/\s+/g, " ").slice(0, 160), done: done.replace(/\s+/g, " ").slice(0, 160) };
});
console.log("import:", JSON.stringify(imp));
if (!imp.red0 || !imp.dis0) fail("import: no red cells, or submit not disabled while red remains");
if (imp.red1 || imp.dis1) fail("import: red cells left or submit still disabled after fixing");
if (!/saved/i.test(imp.done)) fail("import: the last step did not finish");

if (errs.length) fail(`console errors: ${errs.length}, first: ${errs[0]}`);
console.log(`pages checked ${counts.pages} · clicked ${counts.clicked} · skipped ${counts.skipped} · did nothing ${counts.dead} · failures ${fails.length}`);
await b.close();
process.exit(fails.length ? 1 : 0);
