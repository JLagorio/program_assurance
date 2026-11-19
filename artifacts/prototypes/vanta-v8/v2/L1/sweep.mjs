// node sweep.mjs <html> — every route L1 touched at 1440 and 390 (page errors, sideways scroll), then the interactions they keep.
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = "file://" + path.resolve(process.argv[2]);
const ROUTES = ["home", "my-work", "my-work-mine", "my-work-approval", "review-queue", "review-queue-mine", "overview", "baseline", "baseline-params", "portfolio",
  "deadlines", "deadlines-vuln", "deadlines-stig", "deadlines-findings", "deadlines-other", "notifications", "notifications-workspace",
  "event-log", "event-log-reviews", "event-log-imports", "event-log-decisions", "event-log-system", "enclaves", "common-controls",
  "permissions", "permissions-matrix", "permissions-members", "permissions-changes",
  "program-new", "program-new-details", "program-new-systems", "program-new-baseline", "program-new-team", "program-new-review"];
const b = await chromium.launch();
const res = []; const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${x ? " · " + x : ""}`);
for (const w of [1440, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: w > 600 ? 900 : 844 } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(file + "#home"); await p.waitForTimeout(400);
  const bad = [];
  for (const r of ROUTES) {
    errs.length = 0;
    await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(220);
    const m = await p.evaluate(() => ({ doc: document.documentElement.scrollWidth, vw: innerWidth, h: location.hash.slice(1), sec: !!document.querySelector("#main .sectabs") && getComputedStyle(document.querySelector("#main .sectabs")).display !== "none" }));
    if (errs.length) bad.push(`${r}: ${errs[0]}`);
    if (m.doc > m.vw + 1) bad.push(`${r}: sideways ${m.doc}>${m.vw}`);
    if (/^(deadlines|notifications|event-log|enclaves|common-controls|permissions)/.test(r) && m.sec) bad.push(`${r}: area tab strip visible`);
  }
  ok(`${w}: ${ROUTES.length} routes draw with no page error, no sideways scroll, no area strip on Settings`, !bad.length, bad.slice(0, 6).join(" | "));
  await p.close();
}
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
const go = async (r, t = 300) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(t); };
const q = (s) => p.evaluate((s) => !!document.querySelector(s), s);
const hash = () => p.evaluate(() => location.hash.slice(1));
const panelOpen = () => p.evaluate(() => !document.getElementById("panel").hidden);
const panelLabel = () => p.evaluate(() => (document.querySelector("#panel .bar-top span") || {}).textContent || "");
const modalOpen = () => p.evaluate(() => !document.getElementById("modal").hidden);
const esc = async () => { await p.keyboard.press("Escape"); await p.waitForTimeout(120); await p.evaluate(() => { const c = document.getElementById("closePanel"); if (c) c.click(); const m = document.querySelector("#modal [data-close-modal]"); if (m) m.click(); }); await p.waitForTimeout(120); };

// Home
await p.goto(file + "#home"); await p.waitForTimeout(500);
await go("home");
ok("Home: Create program in the header", await q('#main .ph [data-go="program-new"]'));
ok("Home: one callout", (await p.evaluate(() => document.querySelectorAll("#main .ak-banner").length)) === 1);
ok("Home: no pills", (await p.evaluate(() => document.querySelectorAll("#main .pill").length)) === 0);
await p.click('#main .ph [data-go="program-new"]'); await p.waitForTimeout(500);
ok("Home: Create program opens the wizard", (await hash()) === "program-new");
await go("home"); await p.click("#main .v2-home-other a.row"); await p.waitForTimeout(300);
ok("Home: an other program opens Programs", (await hash()) === "portfolio");
await go("home"); await p.click('#main a.pcard[href="#overview"], #main a.pcard[href="#after-home-overview"]'); await p.waitForTimeout(300);
ok("Home: WS-X90's card opens the Overview", (await hash()) === "overview");
// My work
await go("my-work");
const mw = await p.evaluate(() => { const rows = [...document.querySelectorAll("#main .a-work-mw")]; const r2 = rows[1]; const t = r2 && r2.querySelector(".a-work-mwtt"); return { rows: rows.length, w: t ? Math.round(t.getBoundingClientRect().width) : 0, h: r2 ? Math.round(r2.getBoundingClientRect().height) : 0, chips: document.querySelectorAll("#main .v8w-tkchip").length, keys: /WSX-409/.test(document.getElementById("main").innerText) }; });
ok("My work: second Urgent row on one line", mw.w > 300 && mw.h < 70, JSON.stringify(mw));
ok("My work: ticket key as grey text, no chip", mw.keys && !mw.chips);
await p.click("#main .a-work-mw"); await p.waitForTimeout(300);
ok("My work: a row keeps its link", (await hash()) === "findings");
// Review queue
await go("review-queue");
const rq = await p.evaluate(() => ({ tables: document.querySelectorAll("#main table").length, ticked: document.querySelectorAll('#main [aria-checked="true"]').length, kindCol: [...document.querySelectorAll("#main th")].some((t) => t.textContent.trim() === "Kind"), kindFilter: [...document.querySelectorAll("#main .tools summary")].some((s) => /Kind/.test(s.textContent)), rows: document.querySelectorAll("#main tbody tr").length }));
ok("Review queue: one table with a Kind column and filter", rq.tables === 1 && rq.kindCol && rq.kindFilter, JSON.stringify(rq));
ok("Review queue: nothing ticked on open", rq.ticked === 0);
await p.click('#main tbody tr [data-aw-sel="rq-all"]'); await p.waitForTimeout(250);
ok("Review queue: ticking a row shows the selection bar", await q("#main .a-work-selbar .ak-bulk"));
await p.click("#main [data-aw-desel]"); await p.waitForTimeout(250);
ok("Review queue: Deselect brings the filters back", !(await q("#main .a-work-selbar")) && (await q("#main .tools .flt")));
await p.click("#main tbody tr td.nm"); await p.waitForTimeout(300);
ok("Review queue: a row opens its preview", await panelOpen(), await panelLabel()); await esc();
// Overview
await go("overview");
const ov = await p.evaluate(() => ({ minis: document.querySelectorAll("#main .mini").length, strips: document.querySelectorAll("#main .stack").length, pills: document.querySelectorAll("#main .ak-title-row .ak-chip, #main .ak-title-row .pill").length, desc: !!document.querySelector("#main .ak-rh .ak-desc"), facts: !!document.querySelector("#main .ak-rh .ak-facts"), rail: !!document.querySelector("#main .ak-rail"), ssp: !!document.querySelector('#main [data-go="ssp"]'), bottom: Math.round(document.querySelector("#main .v2-ov-li:last-child") ? 0 : 0) }));
ok("Overview: no mini tiles, one strip, one status, no description or facts row, a Details rail", !ov.minis && ov.strips === 1 && ov.pills === 1 && !ov.desc && !ov.facts && ov.rail, JSON.stringify(ov));
ok("Overview: links to the SSP", ov.ssp);
const fold = await p.evaluate(() => { const w = [...document.querySelectorAll("#main .ak-sec")].find((s) => /Open work/.test(s.textContent)); return w ? Math.round(w.getBoundingClientRect().bottom) : 9999; });
ok("Overview: completion card and Open work above the fold", fold <= 900, `Open work ends at ${fold}px`);
await p.click('#main [data-go="ssp-history"]'); await p.waitForTimeout(700);
ok("Overview: Version history opens the history", (await hash()) === "ssp-history", await hash());
await go("overview"); await p.click('#main .v2-ov-li[data-go="risks"]'); await p.waitForTimeout(300);
ok("Overview: an Open work row opens its page", (await hash()) === "risks");
// Programs
await go("portfolio");
const pf = await p.evaluate(() => ({ rings: document.querySelectorAll("#main tbody .ak-donut").length, desc: !!document.querySelector("#main .ak-ih .ak-desc"), flags: document.querySelectorAll("#main tbody .ak-due svg, #main tbody .ak-due .ak-i").length, late: document.querySelectorAll("#main .v2-pf-gate.late").length, create: !!document.querySelector('#main [data-go="program-new"]') }));
ok("Programs: no rings, no subtitle, no flags; late dates marked", !pf.rings && !pf.desc && !pf.flags && pf.late === 6, JSON.stringify(pf));
ok("Programs: Create program", pf.create);
await p.click('#main tbody tr[data-panel="v7o-prog"] td.nm'); await p.waitForTimeout(300);
ok("Programs: a row opens its preview", await panelOpen(), await panelLabel()); await esc();
// Baseline
await go("baseline");
const bl = await p.evaluate(() => ({ strips: document.querySelectorAll("#main .stack").length, famStrips: document.querySelectorAll("#main .v7p-fam .stack").length, banner: document.querySelectorAll("#main .ak-banner").length, line: !!document.querySelector("#main .v2-bl-line"), green: document.querySelectorAll("#main tbody .v7p-ok, #main tbody .v7p-bad").length, sw: getComputedStyle(document.querySelector('#main .v7p-sw[aria-checked="true"]')).backgroundColor }));
ok("Baseline: one strip, none on the family cards, no banner, one header line, counts in ink", bl.strips === 1 && !bl.famStrips && !bl.banner && bl.line && !bl.green, JSON.stringify(bl));
await p.click('#main .v7p-sw[data-v7p-wi="mission"]'); await p.waitForTimeout(300);
ok("Baseline: a switch still reads the what-if", /What-if/.test(await p.evaluate(() => document.getElementById("main").innerText)));
await p.click("#main [data-v7p-wireset]"); await p.waitForTimeout(300);
ok("Baseline: Back to saved", !/What-if/.test(await p.evaluate(() => document.getElementById("main").innerText)));
// Settings
await go("deadlines");
const st = await p.evaluate(() => ({ nav: document.querySelectorAll("#main .v2-set-nav a").length, on: (document.querySelector("#main .v2-set-nav a.on") || {}).textContent, strip: getComputedStyle(document.querySelector("#main .sectabs")).display, tables: document.querySelectorAll("#main .v2-set-body table").length, cards: document.querySelectorAll("#main .v2-setcard").length, nonOnOff: [...document.querySelectorAll("#main .v2-set-body .pill")].filter((x) => !/^(On|Off)$/.test(x.textContent.trim())).length }));
ok("Settings: a left list of 7 sections, the area strip hidden", st.nav === 7 && st.on === "Deadlines" && st.strip === "none", JSON.stringify(st));
ok("Deadlines: setting cards, no register, On/Off the only pills", st.cards === 4 && !st.tables && !st.nonOnOff, JSON.stringify(st));
await p.click("#main .v2-rule[data-panel]"); await p.waitForTimeout(300);
ok("Deadlines: a rule opens its preview", await panelOpen(), await panelLabel());
const dis = await p.evaluate(() => !!document.querySelector('#panel [data-modal="ak-reason"]'));
ok("Deadlines: the preview offers Disable", dis); await esc();
await p.click('#main .v2-set-nav a[href="#notifications"]'); await p.waitForTimeout(300);
ok("Settings: the list opens My account › Notifications", (await hash()) === "notifications" && (await p.evaluate(() => (document.querySelector("#main .v2-set-nav a.on") || {}).getAttribute("href"))) === "#notifications");
const nt = await p.evaluate(() => ({ tabs: document.querySelectorAll("#main .ak-tabs").length, pills: [...document.querySelectorAll("#main .pill")].filter((x) => !/^(On|Off)$/.test(x.textContent.trim())).length }));
ok("Notifications: no tabs, On/Off the only pills", !nt.tabs && !nt.pills, JSON.stringify(nt));
await go("notifications-workspace");
ok("Workspace notifications: On/Off the only pills", (await p.evaluate(() => [...document.querySelectorAll("#main .pill")].filter((x) => !/^(On|Off)$/.test(x.textContent.trim())).length)) === 0);
await go("enclaves");
ok("Enclaves: On/Off the only pills", (await p.evaluate(() => [...document.querySelectorAll("#main .pill")].filter((x) => !/^(On|Off)$/.test(x.textContent.trim())).length)) === 0);
await p.click('#main .v2-rule[data-panel="v7o-enclave"]'); await p.waitForTimeout(300);
ok("Enclaves: a row opens its preview", await panelOpen(), await panelLabel()); await esc();
await go("common-controls");
ok("Providers: no pills, no bars, no banner", (await p.evaluate(() => document.querySelectorAll("#main .pill, #main .v7o-mbar, #main .ak-banner").length)) === 0);
await p.click('#main [data-panel="v7o-prog"]'); await p.waitForTimeout(300);
ok("Providers: Open program opens the program preview", (await panelLabel()) === "Program preview", await panelLabel()); await esc();
await p.click('#main .v2-rule[data-panel="v7o-ccp"] b'); await p.waitForTimeout(300);
ok("Providers: a row opens the provider preview", (await panelLabel()) === "Provider preview", await panelLabel()); await esc();
await go("permissions");
ok("Permissions: authorizing official named", /authorizing official/i.test(await p.evaluate(() => document.getElementById("main").innerText)));
await go("event-log");
ok("Event log: no coloured glyphs in actions", (await p.evaluate(() => document.querySelectorAll("#main tbody .v7o-act .gl").length)) === 0);
// Wizard
await go("program-new", 500);
const pn = await p.evaluate(() => ({ side: !!document.querySelector(".pn-side, .pn-mcard"), title: getComputedStyle(document.querySelector(".pn-ht")).fontSize }));
ok("Wizard: no summary column, bar title 16px", !pn.side && pn.title === "16px", JSON.stringify(pn));
await p.evaluate(() => { const r = document.querySelector('[data-pn="start"][data-v="blank"], [data-v="blank"]'); if (r) r.click(); }); await p.waitForTimeout(300);
ok("Wizard: Blank says categorization is in step 3", /in step 3, Systems/.test(await p.evaluate(() => document.getElementById("main").innerText)));
console.log(res.join("\n")); console.log("errors:", errs.length ? [...new Set(errs)].slice(0, 5).join(" | ") : "none");
await b.close();
