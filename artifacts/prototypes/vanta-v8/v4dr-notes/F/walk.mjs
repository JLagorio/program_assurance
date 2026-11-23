// Lane F's walk: node walk.mjs <build.html> [--quick]
// Opens every lane F route with V3 on at 1440×900 and 390×844; fails on a console error, a page wider than the window, or a
// table cell taller than one line. Clicks every button and link once and fails if one does nothing. Then the lane's own walks:
// publish the draft and see it start counting, record a false-positive decision with a reason, open and close each docked
// pane (and add a note), and add a template to the program as a draft.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2], quick = process.argv.includes("--quick");
console.log("build:", build);
const FSW = "dr-finding--" + encodeURIComponent("stig:ethernet-switch-ndm|220604"), FMC = "dr-finding--" + encodeURIComponent("stig:mission-computer-rhel9|257789");
const ROUTES = ["dr-checks", "dr-check--rhel9-mc", "dr-check--rhel9-mc--findings", "dr-check--rhel9-mc--decisions", "dr-check--rhel9-mc--controls", "dr-check--rhel9-mc--history",
  "dr-check--rhel9-v2r10", "dr-check--sarif-tel", "dr-check--nessus-gw", "dr-check--poam-rev", "dr-check--acas-freq--findings", "dr-check--win11-lt--history",
  "dr-library", "dr-library--rhel9-v2r9", "dr-library--defender", FSW, "dr-finding--c0fdce4e", FMC,
  // version 24: the renewal check, the privileged account review (never run), and a SCAP check's rules
  "dr-check--ev-renewal", "dr-check--ev-renewal--findings", "dr-check--priv-review", "dr-check--priv-review--findings", "dr-check--win11-lt--findings"];
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
const keysOf = () => p.evaluate(() => [...document.querySelectorAll("#main button, #main a[href], #main summary")].filter((el) => el.offsetParent && el.getAttribute("aria-disabled") !== "true" && !el.disabled && el.getAttribute("aria-pressed") !== "true" && el.getAttribute("aria-checked") !== "true" && el.getAttribute("aria-current") !== "page" && !el.closest("details:not([open]) > div")).map((el) => [el.tagName, (el.innerText || "").trim().slice(0, 40), el.getAttribute("data-k3") || "", el.getAttribute("data-k3a") || "", el.getAttribute("href") || "", el.getAttribute("aria-label") || "", el.getAttribute("data-panel") || "", el.getAttribute("data-id") || "", el.getAttribute("data-go") || "", el.className].join("¦")));
const clickAll = async (route, prep) => {
  await go(route); if (prep) await prep();
  const keys = [...new Set(await keysOf())];
  const limit = quick ? 40 : 400;
  for (const key of keys.slice(0, limit)) {
    if (/Back to the Drata tab|See current/.test(key)) { counts.skipped++; continue; } // the lead's routes; checked by the lead
    await closeAll();
    await p.evaluate(() => { let ch = false; for (const k of ["dr.F.ck", "dr.F.lib", "dr.F.lsel"]) { const v = PA.v3k.get(k, null); if (v && (Array.isArray(v) ? v.length : Object.values(v).some((x) => x && (!Array.isArray(x) || x.length)))) { PA.v3k.set(k, Array.isArray(v) ? [] : {}); ch = true; } } if (ch) PA.v2.redraw(); });
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
  for (const key of ["notes", "tickets", "tasks"]) { await go(FSW); await p.evaluate((k) => { PA.v3k.set("dr.k.dock.drf-f", k); PA.v2.redraw(); }, key); await p.waitForTimeout(250); await checkPage(`${FSW} with ${key} docked @${vp.width}`); }
  await p.evaluate(() => { PA.v3k.set("dr.k.dock.drf-f", null); });
  await go("dr-checks"); await p.evaluate(() => { const e = document.querySelector("#main .k3-eye"); if (e) e.click(); }); await p.waitForTimeout(350);
  const pw = await p.evaluate(() => { const pn = document.getElementById("panel"); return pn ? pn.scrollWidth > pn.clientWidth + 2 : false; });
  if (pw) fail(`check preview @${vp.width}: wider than its panel`);
  await closeAll();
}
await p.setViewportSize({ width: 1440, height: 900 });

// ——— Every button and link once ———
for (const r of ROUTES) { await clickAll(r); await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(250); }
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);

const w = (t) => p.waitForTimeout(t);
const fill = async (vals) => p.evaluate((vals) => { for (const [k, v] of Object.entries(vals)) { const els = [...document.querySelectorAll(`#modal [name="${k}"]`)]; if (!els.length) continue; if (els[0].type === "checkbox") { els.forEach((e) => { e.checked = [].concat(v).includes(e.value); e.dispatchEvent(new Event("change", { bubbles: true })); }); } else { els[0].value = v; els[0].dispatchEvent(new Event("input", { bubbles: true })); els[0].dispatchEvent(new Event("change", { bubbles: true })); } } }, vals);
const submit = async () => { await p.evaluate(() => { const b = document.querySelector("#modal [data-k3-submit], #modal [data-k3-ok]") || [...document.querySelectorAll("#modal .dlg-f .btn.ink")].pop(); if (b) b.click(); }); await w(400); };
const clickText = async (sel, re) => p.evaluate(([sel, re]) => { const el = [...document.querySelectorAll(sel)].find((x) => new RegExp(re).test(x.innerText.trim())); if (el) { el.click(); return true; } return false; }, [sel, re]);
const regInfo = async () => { await go("dr-checks"); return p.evaluate(() => ({ line: (document.querySelector("#main .drf-line") || {}).innerText || "", tiles: [...document.querySelectorAll("#main .drk-stats > *")].map((t) => t.innerText.replace(/\s+/g, " ").trim()).join(" | "), rows: [...document.querySelectorAll("#main table.k3-table tbody tr")].map((tr) => tr.innerText.replace(/\s+/g, " ").trim()) })); };

// ——— 1. Publish the draft and see it start counting ———
const r0 = await regInfo();
const d0 = r0.rows.find((t) => /V2R10/.test(t)) || "";
await go("dr-check--rhel9-v2r10");
if (!(await clickText("#main .drk-head-a .btn", "^Publish$"))) fail("draft: no Publish in its header");
await w(300); await submit();
const st1 = await p.evaluate(() => (document.querySelector("#main .drk-facts") || {}).innerText || "");
const r1 = await regInfo();
const d1 = r1.rows.find((t) => /V2R10/.test(t)) || "", old1 = r1.rows.find((t) => /RHEL 9 V2R9 STIG/.test(t)) || "";
console.log("publish:", JSON.stringify({ before: d0.slice(-60), after: d1.slice(-60), replaced: old1.slice(-40), line0: r0.line.slice(0, 90), line1: r1.line.slice(0, 90), tiles0: r0.tiles, tiles1: r1.tiles }));
if (!/Draft/.test(d0) || !/Doesn't count/.test(d0)) fail("publish: the draft did not read Doesn't count yet before");
if (/Draft/.test(d1) || !/New/.test(d1)) fail("publish: the check did not start counting (state not New)");
if (!/Replaced/.test(old1)) fail("publish: the V2R9 check was not replaced");
if (r1.line) fail("publish: the drafts line still shows with no draft left");
if (!/New/.test(st1)) fail("publish: the record's state did not change");

// ——— 2. Record a false-positive decision with a reason ———
await go("dr-check--rhel9-mc--decisions");
const f0 = await p.evaluate(() => (document.querySelector("#main .drk-tabs") || {}).innerText.replace(/\s+/g, " "));
if (!(await clickText("#main .k3-tools-r .btn, #main .k3-tb .btn", "^Record decision$"))) fail("decision: no Record decision on the Decisions tab");
await w(350);
const formTxt = await p.evaluate(() => (document.querySelector("#modal") || {}).innerText || "");
await fill({ kind: "fp", reason: "The bootloader superuser is named in grub.cfg; the checklist read the default file." });
await submit();
const dec = await p.evaluate(() => ({ rows: [...document.querySelectorAll("#main table.k3-table tbody tr")].map((tr) => tr.innerText.replace(/\s+/g, " ").trim()), tabs: (document.querySelector("#main .drk-tabs") || {}).innerText.replace(/\s+/g, " ") }));
console.log("decision:", JSON.stringify({ tabs0: f0, tabs1: dec.tabs, row: (dec.rows[0] || "").slice(0, 160) }));
if (!/False positive/.test(formTxt) || !/Risk acceptance/.test(formTxt) || !/AO/.test(formTxt)) fail("decision: the form did not offer the three signed kinds");
if (!dec.rows.some((t) => /False positive/.test(t) && /Priya Raghavan/.test(t) && /grub/.test(t))) fail("decision: no signed false-positive row with its reason");
const fN = (t) => +((/Findings\s*(\d+)/.exec(t) || [])[1] || 0);
if (!(fN(dec.tabs) === fN(f0) - 1)) fail(`decision: the failing count did not drop by one (${fN(f0)} → ${fN(dec.tabs)})`);

// ——— 3. Open and close each docked pane (and add a note) ———
await go(FSW);
for (const key of ["Notes", "Tickets", "Tasks"]) {
  const before = await p.evaluate(() => (document.querySelector("#main .k3-page, #main > *") || document.getElementById("main")).getBoundingClientRect().width);
  const opened = await p.evaluate((key) => { const b = [...document.querySelectorAll(".drk-dk-i")].find((x) => x.title === key); if (!b) return false; b.click(); return true; }, key);
  await w(350);
  const o = await p.evaluate((key) => ({ pane: !!document.querySelector(`.drk-dk-pane[aria-label="${key}"]`), w: (document.querySelector(".drk-sunken") || {}).getBoundingClientRect ? document.querySelector(".drk-sunken").getBoundingClientRect().width : 0 }), key);
  if (key === "Notes" && o.pane) { await p.fill("#drf-note", "Asked Joel to confirm the grub superuser name on the next image."); await clickText(".drk-dk-pane .btn", "^Add note$"); await w(350); }
  const note = key === "Notes" ? await p.evaluate(() => (document.querySelector(".drk-dk-pane") || {}).innerText || "") : "";
  await p.evaluate((key) => { const b = [...document.querySelectorAll(".drk-dk-i")].find((x) => x.title === key); if (b) b.click(); }, key);
  await w(300);
  const closed = await p.evaluate(() => !document.querySelector(".drk-dk-pane"));
  console.log(`dock ${key}: opened ${opened && o.pane} · page ${Math.round(before)}→${Math.round(o.w)} · closed ${closed}${note ? " · note kept " + /grub superuser/.test(note) : ""}`);
  if (!opened || !o.pane) fail(`dock ${key}: did not open`);
  if (!closed) fail(`dock ${key}: did not close`);
  if (key === "Notes" && !/grub superuser/.test(note)) fail("dock Notes: the note was not added");
}

// ——— 4. Add a template to the program as a draft ———
await go("dr-library--defender");
const use0 = await p.evaluate(() => (document.querySelector("#main .drk-facts") || {}).innerText.replace(/\s+/g, " "));
if (!(await clickText("#main .drk-head-a .btn", "^Add to program$"))) fail("library: no Add to program on the template");
await w(350);
await fill({ comps: ["CN-109119"], status: "draft" });
await submit();
const use1 = await p.evaluate(() => ({ facts: (document.querySelector("#main .drk-facts") || {}).innerText.replace(/\s+/g, " "), using: [...document.querySelectorAll("#main table.k3-table tbody tr")].map((tr) => tr.innerText.replace(/\s+/g, " ").trim()) }));
const r4 = await regInfo();
console.log("library:", JSON.stringify({ before: use0.slice(-30), after: use1.facts.slice(-30), using: use1.using[0], reg: (r4.rows.find((t) => /Defender/.test(t)) || "").slice(0, 140), line: r4.line.slice(0, 90) }));
if (!/In use/.test(use1.facts) || !use1.using.some((t) => /Maintenance Laptop/.test(t) && /Draft/.test(t))) fail("library: the template's page does not list the new draft copy");
if (!r4.rows.some((t) => /Defender/.test(t) && /Draft/.test(t))) fail("library: the register does not show the added draft");

// ——— 5 (v24). What the check checks: the rule in the drawer, walkable, and V3's finding preview from it ———
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await w(300);
await go("dr-check--rhel9-mc");
const what = await p.evaluate(() => { const b = [...document.querySelectorAll("#main .drk-box")].find((x) => /What it checks/.test(x.innerText)); return b ? b.innerText.replace(/\s+/g, " ") : ""; });
if (!/445/.test(what) || !/Check and fix text/.test(what)) fail(`rules: the Overview does not say what the STIG check checks (${what.slice(0, 80)})`);
await p.evaluate(() => { const b = document.querySelector("#main .drf-rl-b"); if (b) b.click(); }); await w(400);
const dw0 = await p.evaluate(() => (document.getElementById("panel") || {}).innerText || "");
await closeAll();
await go("dr-check--rhel9-mc--findings");
await p.evaluate(() => { const e = document.querySelector("#main .k3-eye"); if (e) e.click(); }); await w(400);
const dw1 = await p.evaluate(() => (document.getElementById("panel") || {}).innerText.replace(/\s+/g, " "));
await p.evaluate(() => { const b = document.querySelector("#panel .drk-dw-b[data-drk-key='down']:not([aria-disabled])"); if (b) b.click(); }); await w(400);
const dw2 = await p.evaluate(() => (document.getElementById("panel") || {}).innerText.replace(/\s+/g, " "));
await p.evaluate(() => { const b = [...document.querySelectorAll("#panel .btn")].find((x) => /Finding preview/.test(x.innerText)); if (b) b.click(); }); await w(400);
const dw3 = await p.evaluate(() => (document.getElementById("panel") || {}).innerText.replace(/\s+/g, " "));
console.log("rules:", JSON.stringify({ overview: /Check text/.test(dw0) && /Fix text/.test(dw0), drawer: dw1.slice(0, 70), next: dw2.slice(0, 40), preview: dw3.slice(0, 40) }));
if (!/Check text/.test(dw0) || !/Fix text/.test(dw0)) fail("rules: a rule on the Overview did not open its check and fix text");
if (!/1 of \d+/.test(dw1) || !/Check text/.test(dw1) || !/Fix text/.test(dw1)) fail("rules: a finding row's eye did not open the rule in the drawer");
if (!/2 of \d+/.test(dw2) || !/Check text/.test(dw2)) fail("rules: the drawer did not walk to the next rule");
if (!/STIG rule/.test(dw3) || /Check text/.test(dw3)) fail("rules: Finding preview did not open V3's finding preview");
await closeAll();
await go("dr-check--acas-iava");
const one = await p.evaluate(() => { const b = [...document.querySelectorAll("#main .drk-box")].find((x) => /What it checks/.test(x.innerText)); return b ? b.innerText.replace(/\s+/g, " ") : ""; });
if (!/Rule/.test(one) || !/IAVA or IAVB/.test(one)) fail("rules: a scanner check does not give its rule in one line");
await go(FMC);
const fr = await p.evaluate(() => { const b = [...document.querySelectorAll("#main .drk-box")].find((x) => /The rule/.test(x.innerText)); return b ? b.innerText.replace(/\s+/g, " ") : ""; });
if (!/Check text/.test(fr) || !/Fix text/.test(fr)) fail("rules: the finding record does not show its rule's check and fix text");

// ——— 6 (v24). Evidence renewed before it expires: its count follows lane B's renewals ———
const evInfo = async () => { await go("dr-check--ev-renewal--findings"); return p.evaluate(() => ({ tabs: (document.querySelector("#main .drk-tabs") || {}).innerText.replace(/\s+/g, " "), first: [...document.querySelectorAll("#main table.k3-table tbody tr")].map((tr) => tr.getAttribute("data-go") || (tr.querySelector("[data-go]") || {}).getAttribute?.("data-go") || "").filter(Boolean), drB: !!(window.PA.drB && PA.drB.renewalCheck), n: window.PA.drB && PA.drB.renewalCheck ? PA.drB.renewalCheck().failing.length : null })); };
const e0 = await evInfo();
if (!(fN(e0.tabs) > 0)) fail(`renewal: the check shows no failing resources (${e0.tabs})`);
if (e0.drB && fN(e0.tabs) !== e0.n) fail(`renewal: the count (${fN(e0.tabs)}) is not lane B's (${e0.n})`);
let renewed = false;
if (e0.drB) {
  for (const r of e0.first.slice(0, 8)) {
    await go(r);
    const clicked = await clickText("#main .btn", "^(Renew|Add new artifact)$");
    if (!clicked) continue;
    await w(350); await submit(); renewed = true; break;
  }
}
const e1 = await evInfo();
console.log("renewal:", JSON.stringify({ drB: e0.drB, before: fN(e0.tabs), after: fN(e1.tabs), renewed }));
if (e0.drB && renewed && fN(e1.tabs) !== fN(e0.tabs) - 1) fail(`renewal: renewing on lane B's record did not lower the count (${fN(e0.tabs)} → ${fN(e1.tabs)})`);
if (e0.drB && !renewed) console.log("renewal: no Renew button found on lane B's first records; count followed lane B's read only");

// ——— 7 (v24). Privileged account review: never run, then Run now ———
await go("dr-check--priv-review");
const pv0 = await p.evaluate(() => (document.querySelector("#main .drk-facts") || {}).innerText.replace(/\s+/g, " "));
const pvTiles = await p.evaluate(() => document.querySelectorAll("#main .drk-num").length);
if (!(await clickText("#main .drk-head-a .btn", "^Run now$"))) fail("priv: a never-run check has no Run now in its header");
await w(400);
const pv1 = await p.evaluate(() => ({ facts: (document.querySelector("#main .drk-facts") || {}).innerText.replace(/\s+/g, " "), tabs: (document.querySelector("#main .drk-tabs") || {}).innerText.replace(/\s+/g, " ") }));
await go("dr-check--priv-review--findings");
const pv2 = await p.evaluate(() => [...document.querySelectorAll("#main table.k3-table tbody tr")].map((tr) => tr.innerText.replace(/\s+/g, " ").trim()));
await p.evaluate(() => { const e = document.querySelector("#main .k3-eye"); if (e) e.click(); }); await w(400);
const pv3 = await p.evaluate(() => (document.getElementById("panel") || {}).innerText.replace(/\s+/g, " "));
await closeAll();
const pr = await regInfo();
console.log("priv:", JSON.stringify({ before: pv0.slice(0, 40), after: pv1.facts.slice(0, 40), tabs: pv1.tabs, rows: pv2, drawer: pv3.slice(0, 90), reg: (pr.rows.find((t) => /Privileged/.test(t)) || "").slice(-50) }));
if (/Result|Last run/.test(pv0) || pvTiles !== 1) fail(`priv: a never-run check draws figures it never read (facts "${pv0.slice(0, 60)}", ${pvTiles} tiles)`);
if (!/Failed/.test(pv1.facts) || fN(pv1.tabs) !== 2) fail("priv: Run now did not fail it on two accounts");
if (!pv2.some((t) => /svc-maint-07/.test(t)) || !pv2.some((t) => /field-tech-03/.test(t))) fail("priv: the failing accounts are not listed");
if (!/Every privileged account/.test(pv3)) fail("priv: an account's drawer does not give the rule");
if (!pr.rows.some((t) => /Privileged/.test(t) && /Failed/.test(t))) fail("priv: the register does not show the run's result");

if (errs.length) fail(`console errors: ${errs.length}, first: ${errs[0]}`);
console.log(`pages checked ${counts.pages} · clicked ${counts.clicked} · skipped ${counts.skipped} · did nothing ${counts.dead} · failures ${fails.length}`);
await b.close();
process.exit(fails.length ? 1 : 0);
