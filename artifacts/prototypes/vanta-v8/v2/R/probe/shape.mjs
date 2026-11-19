// Page-shape facts for the distance and noise findings: node shape.mjs <html> <out.json>
import { createRequire } from "node:module"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.setDefaultTimeout(120000); p.setDefaultNavigationTimeout(180000);
const errs = []; p.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
await p.goto("file://" + html + "#home"); await p.waitForTimeout(1500);
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(500); };
const R = {};
const ev = (fn, arg) => p.evaluate(fn, arg);
// Overview (A1, N11)
await go("overview");
R.overview = await ev(() => { const m = document.getElementById("main"); const t = m.innerText.replace(/\s+/g, " "); const vis = (e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.top < innerHeight; }; return { h1pills: [...(m.querySelector("h1") || m).parentElement.querySelectorAll(".pill, .tag")].filter(vis).map((e) => e.innerText.trim()).slice(0, 6), cardsAbove: [...m.querySelectorAll(".card, .ak-card, [class*=card]")].filter((e) => vis(e) && !e.parentElement.closest(".card, .ak-card, [class*=card]")).length, hasTeam: /Team/.test(t), hasDetails: /Details/.test(t), hasActivity: /Recent activity/.test(t), hasMiniTiles: /Mapped 546|With evidence 313|Assessed 223/.test(t), lifecycle: /Lifecycle: Planned/.test(t), lanes: /Assessments timeline|Plan published Sep 8/.test(t), aside: !!m.querySelector("aside, [class*=rail], [class*=aside]"), height: m.scrollHeight, text: t.slice(0, 600) }; });
// SI-2 (A6, N15, N12)
await go("control-si2");
R.si2 = await ev(() => { const m = document.getElementById("main"); const vis = (e) => { const r = e.getBoundingClientRect(); return r.height > 0; }; const tabs = [...m.querySelectorAll("[role=tab], .tabs a, .tabs span, .ak-tabs > *")].filter(vis).map((e) => e.innerText.trim().replace(/\s+/g, " ")); const tabTop = (m.querySelector("[role=tablist], .tabs, .ak-tabs") || { getBoundingClientRect: () => ({ top: 0 }) }).getBoundingClientRect().top; const cardsBeforeTabs = [...m.querySelectorAll(".card, .ak-card")].filter((e) => vis(e) && e.getBoundingClientRect().bottom <= tabTop + 1).length; const ink = [...m.querySelectorAll(".btn.ink, button.ink, .btn.primary")].filter(vis).map((e) => e.innerText.trim()); const callouts = [...m.querySelectorAll(".ak-banner, .callout, [class*=callout]")].filter(vis).map((e) => e.className + ":" + e.innerText.slice(0, 60)); return { tabs, tabCount: tabs.length, cardsBeforeTabs, ink, callouts, text: m.innerText.replace(/\s+/g, " ").slice(0, 500) }; });
// Deadlines / Settings (A7)
await go("deadlines");
R.settings = await ev(() => { const m = document.getElementById("main"); const t = m.innerText.replace(/\s+/g, " "); return { leftList: !!document.querySelector("#main nav, #main [class*=v2-set], #main [class*=settings-nav], #main aside"), summaryCards: /Deadline status|Imports that set deadlines/.test(t), tabs: [...m.querySelectorAll("[role=tab]")].length, pills: [...m.querySelectorAll(".pill")].map((e) => e.innerText.trim()).slice(0, 12), stripVisible: [...document.querySelectorAll("#main .v9-area, #main [class*=area-tabs], #main .v7-strip")].some((e) => e.getBoundingClientRect().height > 0), text: t.slice(0, 500) }; });
// Shell (A8, A9, N17, N18)
await go("controls");
R.shell = await ev(() => { const cs = (e) => e ? (({ color, backgroundColor, borderColor }) => ({ color, backgroundColor, borderColor }))(getComputedStyle(e)) : null; const nav = document.getElementById("nav"); const groupsOpen = nav ? [...nav.querySelectorAll("[data-group]")].filter((g) => { const n = g.nextElementSibling; return n && n.getBoundingClientRect().height > 0; }).length : null; return { railOn: cs(document.querySelector("#rail a.ri.on")), navOn: cs(document.querySelector("#nav a.item.on")), switcher: cs(document.querySelector("#swBtn, #nav [class*=sw]")), navItemsVisible: nav ? [...nav.querySelectorAll("a.item")].filter((a) => a.getBoundingClientRect().height > 0).length : null, navIcons: nav ? [...nav.querySelectorAll("a.item svg, a.item .i, a.item i")].filter((a) => a.getBoundingClientRect().height > 0).length : null, navHeight: nav ? nav.scrollHeight : null, avatar: cs(document.querySelector("#main .avatar")) }; });
// Review queue (A11)
await go("review-queue");
R.queue = await ev(() => { const m = document.getElementById("main"); return { tables: m.querySelectorAll("table").length, height: m.scrollHeight, heads: [...m.querySelectorAll("thead th")].map((th) => th.innerText.trim()).filter(Boolean), ticked: [...m.querySelectorAll("input[type=checkbox]:checked, [role=checkbox][aria-checked=true]")].length }; });
// My work row (A12, N16)
await go("my-work");
R.mywork = await ev(() => { const el = [...document.querySelectorAll("#main *")].find((e) => e.children.length === 0 && /Resolve 1\d (more )?operational issues/.test(e.textContent)); if (!el) return null; const r = el.getBoundingClientRect(); const main = document.getElementById("main").getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), mainW: Math.round(main.width) }; });
// Campaign mode (A15)
await go("campaign");
R.campaign = await ev(() => { const nav = document.getElementById("nav"); const t = document.getElementById("main").innerText.replace(/\s+/g, " "); return { menu: nav ? [...nav.querySelectorAll("a")].filter((a) => a.getBoundingClientRect().height > 0).map((a) => a.innerText.trim().replace(/\s+/g, " ")).slice(0, 14) : null, tracker: (t.match(/Request tracker · (\d+)/) || [])[1], all: (t.match(/All (\d+)/) || [])[1] }; });
// ↗ pages (A22)
for (const r of ["rec--a-tests-control--AC-1", "rec--a-risk-risk--0a21dc94|overview", "rec--a-risk-poam--4be4ddde|overview", "rec--a-risk-issue--85973641", "rec--sys-asset--AST-109001"]) { await go(r); R["page:" + r] = await ev(() => { const m = document.getElementById("main"); return { h1: ((m.querySelector("h1") || {}).innerText || "").slice(0, 70), notDrawn: /Not drawn yet/.test(m.innerText), len: m.innerText.length, start: m.innerText.replace(/\s+/g, " ").slice(0, 160) }; }); }
// Panel action style (A18)
await go("controls");
await p.click('#main tr[data-id="SA-24"]').catch(() => {}); await p.waitForTimeout(500);
R.panel = await ev(() => { const pn = document.getElementById("panel"); if (pn.hidden) return null; const btns = [...pn.querySelectorAll(".btn, button")].filter((e) => e.getBoundingClientRect().height > 0).map((e) => ({ t: e.innerText.trim().slice(0, 30), ink: e.matches(".ink, .primary"), bg: getComputedStyle(e).backgroundColor })); return { btns: btns.slice(0, 8), text: pn.innerText.replace(/\s+/g, " ").slice(0, 300) }; });
// Pre-ticked registers (A2, B8)
R.preticked = {};
for (const r of ["controls", "evidence", "findings", "risks", "poam", "checks", "people", "review-queue", "inventory", "schedule", "campaign"]) { await go(r); R.preticked[r] = await ev(() => { const m = document.getElementById("main"); return { ticked: [...m.querySelectorAll("input[type=checkbox]:checked, [role=checkbox][aria-checked=true]")].length, bar: (m.innerText.match(/\d+ selected/) || [null])[0] }; }); }
// Tabs (N12), toolbar (N13)
R.tabs = {};
for (const r of ["component-mc", "deadlines", "event-log", "permissions", "control-si2", "integration-emass", "enclaves"]) { await go(r); R.tabs[r] = await ev(() => { const vis = (e) => e.getBoundingClientRect().height > 0; const strips = [...document.querySelectorAll("#main [role=tablist], #main .tabs, #main .ak-tabs")].filter(vis); return { strips: strips.length, tabs: strips.map((s) => [...s.querySelectorAll("[role=tab], a, span.tab, button")].filter(vis).length), first: strips.map((s) => s.innerText.replace(/\s+/g, " ").slice(0, 80)) }; }); }
await go("policies");
R.policiesToolbar = await ev(() => { const m = document.getElementById("main"); const vis = (e) => e.getBoundingClientRect().height > 0; return { quickViews: [...m.querySelectorAll(".qv, [class*=quick] button")].filter(vis).map((e) => e.innerText.trim().replace(/\s+/g, " ")), filters: [...m.querySelectorAll(".flt, [class*=filter] .chip, .ak-filter, .fchip")].filter(vis).map((e) => e.innerText.trim()).slice(0, 12) }; });
// Integrations IN THE APP (A21)
await go("integrations");
R.integrations = await ev(() => ({ inTheApp: (document.getElementById("main").innerText.match(/IN THE APP|In the app/g) || []).length }));
// Baseline colours (N07)
await go("baseline");
R.baseline = await ev(() => { const out = []; document.querySelectorAll("#main *").forEach((e) => { if (e.children.length) return; const t = (e.textContent || "").trim(); if (/^[+−-]\d+$/.test(t)) out.push(t + ":" + getComputedStyle(e).color); }); return out.slice(0, 8); });
// EXAMPLE tag colour (N06)
await go("itcsc");
R.example = await ev(() => { const e = [...document.querySelectorAll("#main *")].find((x) => x.children.length === 0 && /^example$/i.test((x.textContent || "").trim())); return e ? { text: e.textContent, color: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor, border: getComputedStyle(e).borderColor } : null; });
// Launcher question (A19)
await go("controls");
await p.keyboard.press("Meta+k"); await p.waitForTimeout(500); await p.keyboard.type("which controls lack evidence?"); await p.waitForTimeout(700);
R.launcher = await ev(() => { const d = [...document.querySelectorAll("[role=dialog]")].find((x) => x.querySelector("input")); return d ? d.innerText.replace(/\s+/g, " ").slice(0, 300) : null; });
await p.keyboard.press("Escape");
// SSP editor marks (N14, A16)
await go("ssp");
R.ssp = await ev(() => { const vis = (e) => e.getBoundingClientRect().height > 0; const t = document.body.innerText; return { rings: [...document.querySelectorAll(".gl.ring, [class*=ring]")].filter(vis).length, pills: [...document.querySelectorAll(".pill")].filter(vis).length, syncBars: (t.match(/Live · synced/g) || []).length, examples: (t.match(/\bExample\b|\bEXAMPLE\b/g) || []).length }; });
R.errors = errs;
fs.writeFileSync(out, JSON.stringify(R, null, 1)); await b.close(); console.log("ok");
