// Lane K's walk: the Drata kit and its gallery (dr-components). usage: node walk.mjs <build.html>
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const B = path.resolve(process.argv[2] || "");
console.log("build: " + B);
const ROUTES = ["dr-components"];
const fails = [], notes = [];
const fail = (m) => { fails.push(m); console.log("FAIL " + m); };
const b = await chromium.launch();

async function open(w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/ERR_FAILED|ERR_FILE_NOT_FOUND|fonts\./.test(m.text())) errs.push(m.text()); });
  // A missing file fails the walk, except the lead's Drata tab shots (out/dr/), which a K-only build does not have.
  p.on("requestfailed", (r) => { if (!/fonts\.|\/out\/dr\//.test(r.url())) errs.push("missing file " + r.url().slice(-80)); });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await p.goto("file://" + B + "#overview"); await p.waitForTimeout(700);
  await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); });
  await p.waitForTimeout(300);
  return { p, errs };
}
const go = async (p, r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(450); };
const layout = (p, label) => p.evaluate(() => {
  const out = [], m = document.getElementById("main");
  if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`page ${document.documentElement.scrollWidth}px wide in a ${window.innerWidth}px window`);
  if (m && m.scrollWidth > m.clientWidth + 1) out.push(`#main scrolls sideways (${m.scrollWidth} > ${m.clientWidth})`);
  for (const el of m.querySelectorAll("*")) { const r = el.getBoundingClientRect(); if (r.width && r.right > window.innerWidth + 1 && getComputedStyle(el).position !== "fixed" && !el.closest("[class*='-wrap'], .drk-tabs, .k3-tabs, .drk-sel")) { out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} runs past the window (${Math.round(r.right)})`); break; } }
  const tall = [...m.querySelectorAll("td")].filter((td) => td.offsetHeight > 46 && !td.closest(".k3-wrap, table.wrap"));
  if (tall.length) out.push(`${tall.length} table cells taller than one line, first: «${tall[0].textContent.trim().slice(0, 40)}» ${tall[0].offsetHeight}px`);
  return out;
}).then((l) => l.forEach((x) => fail(`${label}: ${x}`)));

// 1. Every route at both widths, opened with V3 on, and opened with V3 off (it must switch V3 on with WS-X90).
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const { p, errs } = await open(w, h);
  for (const r of ROUTES) {
    await go(p, r);
    const h1 = await p.evaluate(() => (document.querySelector("#main h1") || {}).textContent || "");
    if (!h1) fail(`${r} @${w}: no title`);
    await layout(p, `${r} @${w}`);
    await p.screenshot({ path: path.join(path.dirname(new URL(import.meta.url).pathname), `walk-${r}-${w}.jpg`), type: "jpeg", quality: 60 });
  }
  // V3 off: a dr- route switches V3 on with WS-X90
  await p.evaluate(() => { PA.v3.set(false); location.hash = "overview"; }); await p.waitForTimeout(400);
  await p.evaluate(() => { location.hash = "dr-components"; }); await p.waitForTimeout(700);
  const st = await p.evaluate(() => ({ on: PA.v3.on(), prog: PA.v2hubs ? PA.v2hubs.cur() : "", h1: (document.querySelector("#main h1") || {}).textContent || "" }));
  if (!st.on || st.prog !== "PRG-1090" || st.h1 !== "New components") fail(`@${w} V3 off → dr-components: ${JSON.stringify(st)}`);
  // routeLike and the no-body dock, on a throwaway route registered here (not shipped)
  await p.evaluate(() => {
    const D = PA.drk, K = PA.v3k;
    D.routeLike("dr-ktest", (id) => K.page({ cls: "k3-rec", head: D.head({ crumbs: [["Findings", "findings"], [id]], id: { code: id, tone: "bad" }, title: "Test " + id, facts: [["Status", "Open"]], tabs: D.tabs([{ label: "Overview", on: true, route: "dr-ktest--" + id }, { label: "Items", problem: 3, route: "dr-ktest--" + id }]) }), body: [D.sunken([D.box("Body", "<p>Body text that should narrow.</p>")]), D.dock({ id: "ktest", items: [{ key: "notes", icon: "chat", label: "Notes", count: 2, pane: () => "<p>Pane</p>" }, { key: "tasks", icon: "task", label: "Tasks", pane: () => "<p>Tasks</p>" }] })] }), { nav: "findings" });
    PA.v3.set(false); location.hash = "overview";
  });
  await p.waitForTimeout(400);
  await go(p, "dr-ktest--AC-2"); await p.waitForTimeout(400);
  const lk = await p.evaluate(() => ({ on: PA.v3.on(), h1: (document.querySelector("#main h1") || {}).textContent || "", nav: (document.querySelector('#nav [aria-current="page"]') || {}).textContent || "" }));
  if (!lk.on || lk.h1 !== "Test AC-2") fail(`@${w} routeLike with V3 off: ${JSON.stringify(lk)}`);
  if (!/Findings/.test(lk.nav)) notes.push(`@${w} routeLike nav highlight: «${lk.nav.trim()}»`);
  const box0 = await p.evaluate(() => document.querySelector(".drk-sunken").getBoundingClientRect().width);
  await p.click(".drk-dk-i >> nth=0"); await p.waitForTimeout(300);
  const d1 = await p.evaluate(() => ({ pane: !!document.querySelector(".drk-dk-pane"), w: document.querySelector(".drk-sunken").getBoundingClientRect().width, kept: PA.v3k.get("dr.k.dock.ktest", null) }));
  if (!d1.pane || d1.kept !== "notes") fail(`@${w} dock: the pane did not open (${JSON.stringify(d1)})`);
  if (w > 900 && !(d1.w < box0 - 300)) fail(`@${w} dock: the page did not narrow (${box0} → ${d1.w})`);
  await layout(p, `dock open @${w}`);
  await p.screenshot({ path: path.join(path.dirname(new URL(import.meta.url).pathname), `walk-dock-${w}.jpg`), type: "jpeg", quality: 60 });
  await p.click(".drk-dk-pane .drk-dw-x"); await p.waitForTimeout(300);
  if (await p.evaluate(() => !!document.querySelector(".drk-dk-pane"))) fail(`@${w} dock: ✕ did not close the pane`);
  if (errs.length) fail(`@${w} console: ${errs.slice(0, 3).join(" | ")}`);
  await p.close();
}

// 2. The named checks, on the gallery at 1440
{
  const { p, errs } = await open(1440, 900);
  await go(p, "dr-components");
  const snap = () => p.evaluate(() => document.getElementById("main").innerHTML.length + "|" + document.getElementById("main").innerHTML.slice(0, 0));
  const html = (sel) => p.evaluate((s) => { const e = document.querySelector(s); return e ? e.innerHTML : null; }, sel);
  const click = async (sel, label) => { const el = await p.$(sel); if (!el) { fail(`missing: ${label} (${sel})`); return false; } await el.scrollIntoViewIfNeeded(); await el.click(); await p.waitForTimeout(300); return true; };
  // selection bar
  let before = await html('[data-drk-demo="selbar"]');
  await click('[data-drk-demo="selbar"] .drk-sel-c', "selbar Clear");
  if ((await html('[data-drk-demo="selbar"] .drk-sel')) !== null) fail("selbar: Clear left the bar up");
  await click('[data-drk-demo="selbar"] tr:nth-child(3) button[role=checkbox]', "selbar row");
  if ((await html('[data-drk-demo="selbar"] .drk-sel')) === null) fail("selbar: choosing a row drew no bar");
  await click('[data-drk-demo="selbar"] .drk-sel-b:not(.drk-sel-c)', "selbar Select all");
  if (!/10<\/b> selected/.test((await html('[data-drk-demo="selbar"] .drk-sel')) || "")) fail("selbar: Select all did not choose all");
  // drawer: next, previous, close, the real panel
  const pos = () => p.evaluate(() => (document.querySelector('[data-drk-demo="drawer"] .drk-dw-pos') || {}).textContent || "");
  const p0 = await pos();
  await click('[data-drk-demo="drawer"] .drk-dw-b[data-drk-key="down"]', "drawer Next");
  const p1 = await pos();
  await click('[data-drk-demo="drawer"] .drk-dw-b[data-drk-key="up"]', "drawer Previous");
  const p2 = await pos();
  if (p0 === p1 || p1 === p2 || p0 !== p2) fail(`drawer: walk ${p0} → ${p1} → ${p2}`);
  await click('[data-drk-demo="drawer"] .drk-demo-panel .btn', "drawer Open in the side panel");
  const pan = () => p.evaluate(() => { const x = document.getElementById("panel"); return x && !x.hidden && x.querySelector(".drk-dw") ? (x.querySelector(".drk-dw-pos").textContent + " " + x.querySelector(".drk-id-c").textContent) : null; });
  const q0 = await pan();
  if (!q0) fail("drawer: the real panel did not open");
  await p.screenshot({ path: path.join(path.dirname(new URL(import.meta.url).pathname), "walk-panel.jpg"), type: "jpeg", quality: 60 });
  await click("#panel .drk-dw-b[data-drk-key='down']", "panel Next");
  const q1 = await pan();
  await p.keyboard.press("ArrowUp"); await p.waitForTimeout(300);
  const q2 = await pan();
  if (!q0 || q0 === q1 || q2 !== q0) fail(`panel walk: ${q0} → ${q1} → (↑) ${q2}`);
  await click("#panel .drk-dw-x", "panel ✕");
  if (await p.evaluate(() => !document.getElementById("panel").hidden)) fail("panel: ✕ did not close it");
  await click('[data-drk-demo="drawer"] .drk-demo-panel .drk-dw-x', "drawer ✕ in the demo");
  if ((await html('[data-drk-demo="drawer"] .drk-demo-panel')) !== null) fail("drawer demo: ✕ did not close it");
  // dock (the body form)
  await click('[data-drk-demo="dock"] .drk-dk-i', "dock icon");
  if ((await html('[data-drk-demo="dock"] .drk-dk-pane')) === null) fail("dock demo: no pane");
  await click('[data-drk-demo="dock"] .drk-dk-i.on', "dock icon again");
  if ((await html('[data-drk-demo="dock"] .drk-dk-pane')) !== null) fail("dock demo: the pane did not close");
  // card: Edit, Cancel, Edit, change, Save
  await click('[data-drk-demo="card"] .drk-edit', "card Edit");
  if ((await html('[data-drk-demo="card"] .drk-cfs')) === null) fail("card: Edit drew no inputs");
  await click('[data-drk-demo="card"] .drk-cfa .btn:not(.ink)', "card Cancel");
  if ((await html('[data-drk-demo="card"] .drk-cfs')) !== null) fail("card: Cancel kept the inputs");
  await click('[data-drk-demo="card"] .drk-edit', "card Edit again");
  await p.selectOption('[data-drk-demo="card"] select[data-drk-cf="freq"]', "Quarterly");
  await click('[data-drk-demo="card"] .drk-cfa .btn.ink', "card Save");
  if (!/Quarterly/.test((await html('[data-drk-demo="card"]')) || "")) fail("card: Save did not keep the value");
  // facets: toggle closes and opens; a choice filters
  await click('[data-drk-demo="facets"] .drk-ftog', "facet toggle");
  const closed = await p.evaluate(() => !document.querySelector('[data-drk-demo="facets"] .drk-wf').classList.contains("open"));
  await click('[data-drk-demo="facets"] .drk-ftog', "facet toggle again");
  const opened = await p.evaluate(() => document.querySelector('[data-drk-demo="facets"] .drk-wf').classList.contains("open"));
  if (!closed || !opened) fail(`facets: toggle closed=${closed} opened=${opened}`);
  const n0 = await p.evaluate(() => document.querySelectorAll('[data-drk-demo="facets"] .drk-wf-b tr').length);
  await click('[data-drk-demo="facets"] .drk-fo:nth-child(2) input', "facet radio");
  const n1 = await p.evaluate(() => document.querySelectorAll('[data-drk-demo="facets"] .drk-wf-b tr').length);
  if (!(n1 < n0)) fail(`facets: a choice did not filter (${n0} → ${n1})`);
  await click('[data-drk-demo="facets"] .drk-fg-h', "facet group collapse");
  if (!(await p.evaluate(() => document.querySelector('[data-drk-demo="facets"] .drk-fg').classList.contains("closed")))) fail("facets: the group did not collapse");
  // sheet
  for (const [i, n] of [[2, 2], [1, 4], [0, 6]]) {
    await click(`[data-drk-demo="sheet"] .drk-seg button:nth-child(${i + 1})`, "sheet segment " + i);
    const rows = await p.evaluate(() => document.querySelectorAll('[data-drk-demo="sheet"] tbody tr').length);
    if (rows !== n) fail(`sheet: segment ${i} shows ${rows} rows, expected ${n}`);
  }
  // compare: Apply, Reject, Apply all, Confirm
  await click('[data-drk-demo="compare"] .btn', "compare open");
  if (!(await p.evaluate(() => !!document.querySelector("#modal .drk-cmp")))) fail("compare: no dialog");
  const pressed = () => p.evaluate(() => [...document.querySelectorAll("#modal .drk-cmp-seg")].map((g) => g.querySelector('[aria-pressed="true"]').textContent).join(","));
  if ((await pressed()) !== "Keep current,Keep current,Keep current") fail(`compare: default is not Keep current (${await pressed()})`);
  if (await p.evaluate(() => !!document.querySelector("#modal select, #modal .drk-cmp-b"))) fail("compare: a select or Apply/Reject buttons are still drawn");
  await click('#modal [data-drk-cmp="apply"][data-i="0"]', "compare Use template");
  if (!(await pressed()).startsWith("Use template,Keep current")) fail(`compare: Use template did not switch the first field (${await pressed()})`);
  await click('#modal [data-drk-cmp="reject"][data-i="0"]', "compare Keep current");
  if (!(await pressed()).startsWith("Keep current")) fail("compare: Keep current did not switch back");
  await click('#modal [data-drk-cmp="all"]', "compare Use template for all");
  if ((await pressed()) !== "Use template,Use template,Use template") fail(`compare: Use template for all (${await pressed()})`);
  if (!(await p.evaluate(() => /Keep current for all/.test(document.querySelector("#modal .drk-cmp-bar").textContent)))) fail("compare: the top link did not turn to Keep current for all");
  await p.screenshot({ path: path.join(path.dirname(new URL(import.meta.url).pathname), "walk-compare.jpg"), type: "jpeg", quality: 60 });
  await click("#modal [data-k3-submit]", "compare Confirm");
  if (!/3<\/span> taken/.test((await html('[data-drk-demo="compare"]')) || "")) fail("compare: Confirm did not report the selections");
  // proposal: Approve a secondary, Decline quiet, both act
  const pb = await p.evaluate(() => [...document.querySelectorAll('[data-drk-demo="proposal"] .drk-sug-a .btn')].map((x) => x.className + ":" + x.textContent).join(" | "));
  if (!/^btn sm:Approve \| btn sm k3-quiet:Decline$/.test(pb)) fail(`proposal buttons: ${pb}`);
  await click('[data-drk-demo="proposal"] .drk-sug-a .btn', "proposal Approve");
  if (!/Approved/.test((await html('[data-drk-demo="proposal"]')) || "")) fail("proposal: Approve did nothing");
  // steps
  await click('[data-drk-demo="steps"] .drk-sf .btn.ink', "steps Continue");
  const at = await p.evaluate(() => document.querySelector('[data-drk-demo="steps"] .drk-stp-i.cur .drk-stp-l').textContent);
  if (at !== "Map values") fail(`steps: Continue landed on ${at}`);
  if (errs.length) fail(`named checks console: ${errs.slice(0, 3).join(" | ")}`);
  await p.close();
}

// 3. Every button and link on the gallery, once each, from a fresh state: each must do something.
{
  const { p, errs } = await open(1440, 900);
  await go(p, "dr-components");
  const sigs = await p.evaluate(() => {
    const m = document.getElementById("main"), seen = {};
    return [...m.querySelectorAll("button, a[href], summary")].filter((el) => { const d = el.closest("details"); return !(d && !d.open && el.tagName !== "SUMMARY"); }).filter((el) => el.offsetParent !== null || el.getClientRects().length).map((el) => {
      const sec = (el.closest("[data-drk-demo]") || el.closest("section, header, nav") || m);
      const key = `${sec.getAttribute("data-drk-demo") || sec.id || sec.className}|${el.tagName}|${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40)}`;
      seen[key] = (seen[key] || 0) + 1;
      return { key, n: seen[key] - 1 };
    });
  });
  let clicked = 0, gone = 0;
  const dead = [];
  for (const s of sigs) {
    await p.evaluate(() => { if (PA.v3k) PA.v3k.close(); const c = document.getElementById("closePanel"); if (c && !document.getElementById("panel").hidden) c.click(); sessionStorage.removeItem("x"); });
    if (await p.evaluate(() => (location.hash || "").slice(1) !== "dr-components")) await go(p, "dr-components");
    await p.evaluate(() => { PA.v2.reset(); const t = document.getElementById("v2-toast"); if (t) t.remove(); document.getElementById("main").scrollTop = 0; }); await p.waitForTimeout(120);
    const handle = await p.evaluateHandle(({ key, n }) => {
      const m = document.getElementById("main"), seen = {};
      for (const el of m.querySelectorAll("button, a[href], summary")) {
        const dd = el.closest("details"); if (dd && !dd.open && el.tagName !== "SUMMARY") continue;
        if (!(el.offsetParent !== null || el.getClientRects().length)) continue;
        const sec = (el.closest("[data-drk-demo]") || el.closest("section, header, nav") || m);
        const k = `${sec.getAttribute("data-drk-demo") || sec.id || sec.className}|${el.tagName}|${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40)}`;
        seen[k] = (seen[k] || 0) + 1;
        if (k === key && seen[k] - 1 === n) return el;
      }
      return null;
    }, s);
    const el = handle.asElement();
    if (!el) { gone++; continue; }
    await el.scrollIntoViewIfNeeded().catch(() => {});
    const state = () => p.evaluate(() => [location.hash, document.getElementById("main").innerHTML, document.getElementById("panel").hidden ? "" : document.getElementById("panel").innerHTML, document.getElementById("modal").hidden ? "" : document.getElementById("modal").innerHTML, Math.round(document.getElementById("main").scrollTop), (document.getElementById("v2-toast") || {}).textContent || "", [...document.querySelectorAll("details[open]")].length].join("§"));
    const a = await state();
    await el.click({ timeout: 2000 }).catch((e) => dead.push(`${s.key} (could not click: ${e.message.split("\n")[0]})`));
    await p.waitForTimeout(450);
    const z = await state();
    clicked++;
    if (a === z) dead.push(s.key);
  }
  if (dead.length) fail(`${dead.length} of ${clicked} controls did nothing: ${dead.slice(0, 6).join(" ; ")}`);
  console.log(`clicked ${clicked} controls on dr-components (${gone} not present after a reset)`);
  if (errs.length) fail(`click-all console: ${errs.slice(0, 3).join(" | ")}`);
  await p.close();
}

// 4. Version 24: the dock in the address, and every drawer walks.
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const { p, errs } = await open(w, h);
  const st = () => p.evaluate(() => ({ hash: location.hash.slice(1), pane: (document.querySelector(".drk-dock .drk-dk-pane h3") || {}).textContent || "", h1: (document.querySelector("#main h1") || {}).textContent || "", hl: history.length }));
  // (a) a throwaway record route with a page dock (not shipped)
  await p.evaluate(() => {
    const D = PA.drk, K = PA.v3k;
    D.routeLike("dr-kdock", (id) => K.page({ cls: "k3-rec", head: D.head({ crumbs: [["Findings", "findings"], [id]], id: { code: id, tone: "bad" }, title: "Dock " + id, facts: [["Status", "Open"]] }), body: [D.sunken(D.box("Body", "<p>The page.</p>")), D.dock({ id: "kdock", items: [{ key: "notes", icon: "chat", label: "Notes", pane: () => "<p>Notes pane</p>" }, { key: "tasks", icon: "task", label: "Tasks", pane: () => "<p>Tasks pane</p>" }] })] }), { nav: "findings" });
  });
  await go(p, "dr-kdock--F-1");
  const a0 = await st();
  if (a0.hash !== "dr-kdock--F-1" || a0.pane) fail(`@${w} dock address: start ${JSON.stringify(a0)}`);
  await p.click(".drk-dk-i[data-drk-dk=notes]"); await p.waitForTimeout(250);
  const a1 = await st();
  if (a1.hash !== "dr-kdock--F-1--dock-notes" || a1.pane !== "Notes" || a1.hl !== a0.hl) fail(`@${w} dock address: opening Notes ${JSON.stringify(a1)} (history ${a0.hl})`);
  await p.evaluate(() => PA.v3k.redraw()); await p.waitForTimeout(200);
  const a2 = await st();
  if (a2.hash !== a1.hash || a2.h1 !== "Dock F-1" || a2.pane !== "Notes") fail(`@${w} dock address: a redraw with the suffix ${JSON.stringify(a2)}`);
  await p.click(".drk-dk-i[data-drk-dk=tasks]"); await p.waitForTimeout(250);
  if ((await st()).hash !== "dr-kdock--F-1--dock-tasks") fail(`@${w} dock address: switching to Tasks ${JSON.stringify(await st())}`);
  await p.click(".drk-dk-pane .drk-dw-x"); await p.waitForTimeout(250);
  const a3 = await st();
  if (a3.hash !== "dr-kdock--F-1" || a3.pane || a3.hl !== a0.hl) fail(`@${w} dock address: closing ${JSON.stringify(a3)}`);
  await p.evaluate(() => { PA.v3k.set("dr.k.dock.kdock", null); }); await go(p, "dr-kdock--F-2--dock-tasks");
  const a4 = await st();
  if (a4.hash !== "dr-kdock--F-2--dock-tasks" || a4.pane !== "Tasks" || a4.h1 !== "Dock F-2") fail(`@${w} dock address: arriving with the suffix ${JSON.stringify(a4)}`);
  await go(p, "dr-kdock--F-2--dock-nothing");
  const a5 = await st();
  if (a5.hash !== "dr-kdock--F-2--dock-tasks") fail(`@${w} dock address: an unknown pane should leave the open one in the address ${JSON.stringify(a5)}`);
  await go(p, "controls--dock-notes");
  if ((await st()).hash !== "controls--dock-notes") fail(`@${w} dock address: a non-Drata address was rewritten`);
  await layout(p, `dock address @${w}`);
  // (b) a drawer whose lane never called D.walkable walks the list it was opened from (two tables, not shipped)
  await p.evaluate(() => {
    const D = PA.drk, K = PA.v3k;
    D.panel("kwalk", (id) => ({ label: "Row preview", title: "Row " + id, facts: [["Id", id]] }));
    const tb = (ids, label) => K.table({ label, cols: [{ label: "Row" }], rows: ids.map((id) => ({ go: "dr-components", peek: { panel: "kwalk", id }, cells: ["Row " + id] })) });
    D.route("dr-kwalk", () => K.page({ head: K.head({ title: "Walk test" }), body: [tb(["a1", "a2", "a3", "a4"], "First"), tb(["b1", "b2", "b3"], "Second")] }));
  });
  await go(p, "dr-kwalk");
  const pos = () => p.evaluate(() => (document.querySelector("#panel .drk-dw-pos") || {}).textContent || "");
  await p.click('#main [data-panel=kwalk][data-id=a2]', { force: true }); await p.waitForTimeout(250);
  const w0 = await pos();
  await p.click("#panel .drk-dw-b[data-drk-key=down]"); await p.waitForTimeout(250);
  const w1 = await pos();
  await p.keyboard.press("ArrowDown"); await p.waitForTimeout(250);
  const w2 = await pos(), lastOff = await p.evaluate(() => (document.querySelector('#panel .drk-dw-b[data-drk-key="down"]') || {}).getAttribute("aria-disabled"));
  if (w0 !== "2 of 4" || w1 !== "3 of 4" || w2 !== "4 of 4" || lastOff !== "true") fail(`@${w} walk without D.walkable: ${w0} → ${w1} → ${w2} (Next at the end: ${lastOff})`);
  await p.evaluate(() => document.getElementById("closePanel").click()); await p.waitForTimeout(150);
  await p.click('#main [data-panel=kwalk][data-id=b1]', { force: true }); await p.waitForTimeout(250);
  if ((await pos()) !== "1 of 3") fail(`@${w} walk without D.walkable: the second table's first row reads ${await pos()}`);
  await p.evaluate(() => document.getElementById("closePanel").click()); await p.waitForTimeout(150);
  // (c) the lanes' drawers: their D.walkable lists still lead on their own registers
  if (w === 1440) for (const [r, kind] of [["dr-evidence", "drb-ev"], ["dr-sources", "drc-src"], ["dr-checks", "drf-chk"]]) {
    await go(p, r);
    const eye = await p.$(`#main [data-panel="${kind}"]`); if (!eye) { notes.push(`${r}: no ${kind} eye drawn`); continue; }
    const n0 = errs.length;
    await eye.click({ force: true }); await p.waitForTimeout(300);
    const x = await p.evaluate((kind) => { const pp = document.getElementById("panel"), id = document.querySelector(`#main [data-panel="${kind}"]`).getAttribute("data-id"); return { pos: (pp.querySelector(".drk-dw-pos") || {}).textContent || "", want: (PA.drk.walkOf(kind, id) || []).length }; }, kind);
    if (errs.length > n0) { notes.push(`${r}: its preview threw (${errs.slice(n0).join(" | ").slice(0, 120)}), the lane's own code`); errs.length = n0; }
    else if (x.pos !== `1 of ${x.want}`) fail(`${r}: the drawer reads «${x.pos}», the lane's list has ${x.want}`);
    await p.evaluate(() => { const c = document.getElementById("closePanel"); if (c) c.click(); });
  }
  if (errs.length) fail(`v24 @${w} console: ${errs.slice(0, 3).join(" | ")}`);
  await p.close();
}
// (d) a fresh load of a real Drata record with the suffix, V3 off: the pane it names opens (lane F's finding record)
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await p.goto("file://" + B + "#dr-finding--c0fdce4e--dock-notes"); await p.waitForTimeout(1300);
  const x = await p.evaluate(() => ({ hash: location.hash.slice(1), dock: !!document.querySelector(".drk-dock"), pane: (document.querySelector(".drk-dock .drk-dk-pane h3") || {}).textContent || "", v3: PA.v3.on() }));
  if (!x.dock) notes.push(`fresh load: lane F's finding record drew no dock (${JSON.stringify(x)})`);
  else if (x.pane !== "Notes" || x.hash !== "dr-finding--c0fdce4e--dock-notes" || !x.v3) fail(`fresh load with --dock-notes: ${JSON.stringify(x)}`);
  await p.close();
}
await b.close();
notes.forEach((n) => console.log("note: " + n));
console.log(fails.length ? `${fails.length} failures` : "walk passed");
process.exit(fails.length ? 1 : 0);
