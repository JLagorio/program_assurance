// Lane O's walk: with V3 on, through the UI, every flow of the brief, asserting what a person would see.
//   node walk.mjs [build]        (default: SP/vanta/proto/out/v3r-O.html)
import { open, createSP70, SP } from "../../v3/P/lib.mjs";
const BUILD = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : SP + "/vanta/proto/out/v3r-O.html";
const H = await open({ build: BUILD, v3: true, start: "overview" });
const p = H.p;
p.setDefaultTimeout(6000);
let pass = 0, fail = 0;
const ok = (cond, what, got) => { if (cond) pass++; else fail++; console.log(`${cond ? "PASS" : "FAIL"} ${what}${cond ? "" : " · got: " + String(got).slice(0, 260)}`); };
const flat = (s) => String(s || "").replace(/\s+/g, " ").trim();
const T = (sel) => p.evaluate((sel) => { const e = document.querySelector(sel); return e && !e.closest("[hidden]") ? e.innerText : ""; }, sel).then(flat);
const ev = (fn, a) => p.evaluate(fn, a);
const trOf = (text) => ev((text) => { const tr = [...document.querySelectorAll("#main tbody tr")].find((r) => r.innerText.includes(text)); return tr ? tr.innerText.replace(/\s+/g, " ").trim() : ""; }, text);
const rows = () => ev(() => [...document.querySelectorAll("#main tbody tr")].filter((r) => !r.hidden).length);
const stepRows = () => ev(() => [...document.querySelectorAll("#k3o-life tbody tr")].map((r) => r.innerText.replace(/\s+/g, " ").trim()));
const phase = (code) => p.click(`#k3o-life .k3o-ph:has(.k3o-ph-c:text-is("${code}"))`).then(() => H.wait(300));
const navLine = () => T("#nav .v2g-head");
const dl = (name) => ev((name) => { const li = [...document.querySelectorAll("#main .k3o-dl")].find((x) => x.querySelector(".k3o-dl-n").innerText.replace(/\s+/g, " ").includes(name)); return li ? { ok: li.classList.contains("ok"), text: li.innerText.replace(/\s+/g, " ").trim(), btn: (li.querySelector(".btn") || {}).innerText || "" } : null; }, name);
const dlBtn = (name) => p.click(`#main .k3o-dl:has(.k3o-dl-n:has-text("${name}")) .btn`).then(() => H.wait(650));
const ring = () => T("#k3o-next .k3o-gate-r");
const back = () => p.click("#k3task .k3-task-b").then(() => H.wait(550));
const form = async (vals, submit = true) => { for (const [k, v] of Object.entries(vals)) { const tag = await ev((k) => { const e = document.getElementById("k3f-" + k); return e ? e.tagName : ""; }, k); if (tag === "SELECT") await p.selectOption("#k3f-" + k, v); else await p.fill("#k3f-" + k, v); } if (submit) { await p.click("#modal [data-k3-submit]"); await H.wait(450); } };

// ——— 1. The strip opens in place ———
ok((await H.hash()) === "overview", "starts on the Overview", await H.hash());
ok(!(await T("#nav")).includes("Lifecycle"), "the program menu has no Lifecycle entry", (await T("#nav")).slice(0, 200));
ok(flat(await T("#k3o-life .k3o-ph.on")).startsWith("TMRR"), "1 the current phase (TMRR) is open on arrival", await T("#k3o-life .k3o-ph.on"));
let sr = await stepRows();
ok(sr.length === 5 && sr.some((r) => r.startsWith("PDR")) && sr.some((r) => /SRR.*Decided Sep 22.*Passed/.test(r)), "1 its five steps are listed under the strip, with kind, date, status and ready", sr.join(" | "));
await phase("EMD"); sr = await stepRows();
ok(sr.length === 3 && sr.some((r) => r.startsWith("CDR")) && (await H.hash()) === "overview", "1 choosing EMD lists its steps on this page, the address unchanged", (await H.hash()) + " " + sr.join(" | "));
await phase("Test"); sr = await stepRows();
ok(sr.some((r) => r.startsWith("TRR")) && sr.some((r) => /PRR.*Not required/.test(r)), "1 choosing Test lists its own steps", sr.join(" | "));
await ev(() => PA.v2.redraw()); await H.wait(250);
ok(flat(await T("#k3o-life .k3o-ph.on")).startsWith("Test"), "1 the open phase survives a redraw", await T("#k3o-life .k3o-ph.on"));

// ——— 2. Increments ———
await p.selectOption("#k3o-life select", "1"); await H.wait(350);
await phase("Ops"); sr = await stepRows();
ok(sr.some((r) => /ATO.*Decided Sep 18.*Passed with actions/.test(r)) && sr.every((r) => /Decided|Not required/.test(r)), "2 Increment 1 shows its own steps and decisions", sr.join(" | "));
ok(/fielded under the ATO with conditions of Sep 18, 2026/.test(await T("#k3o-life")), "2 Increment 1 says it is fielded under the Sep 18, 2026 ATO", (await T("#k3o-life")).slice(0, 300));
await H.go("controls"); await H.go("overview");
ok((await ev(() => document.querySelector("#k3o-life select").value)) === "1", "2 the chosen increment survives leaving and coming back", "");
await p.selectOption("#k3o-life select", "2"); await H.wait(350);
ok(flat(await T("#k3o-life .k3o-ph.on")).startsWith("TMRR") && (await stepRows()).some((r) => /PDR.*Due Nov 24 · in 7 days.*In review/.test(r)), "2 Increment 2 returns on its current phase", (await stepRows()).join(" | "));

// ——— 3. The next gate's checklist: a number, a button, the records, the way back ———
const card0 = await T("#k3o-next");
ok(/Next gate PDR · Preliminary design review/i.test(card0) && /Marcus Ryde decides/.test(card0), "3 the next gate is opened up under the strip", card0.slice(0, 200));
let c = await dl("Connections"), r = await dl("Requirements"), bd = await dl("Boundary");
ok(c && !c.ok && /4 connections without a current agreement/.test(c.text) && c.btn === "Open 4 connections", "3 Connections says why it is not ready as a number, with one button", JSON.stringify(c));
ok(r && /14 controls with no requirement/.test(r.text) && bd && /1 SCA review to request/.test(bd.text), "3 Requirements and Boundary say theirs", JSON.stringify([r, bd]));
ok((await dl("PDR package")).ok && !(await dl("PDR package")).btn, "3 a ready deliverable is quiet: no button", JSON.stringify(await dl("PDR package")));
const notReady = await ev(() => document.querySelectorAll("#k3o-next .k3o-dl:not(.ok)").length);
const fg = await ev(() => ({ g: PA.v3.fact("gate", "pdr-2"), n: PA.v3.fact("nextGate") }));
ok(/^2\/5/.test(await ring()) && notReady === 3 && /2 of 5 ready/.test(await navLine()) && fg.g.ready === 2 && fg.g.total === 5 && fg.n.ready === 2 && fg.n.total === 5 && (await stepRows()).some((x) => /^PDR.*2\/5$/.test(x)),
  "3 one count of readiness: the card, its 3 open rows, the steps table, the line under the switcher and the facts all say 2 of 5", `${await ring()} | open ${notReady} | ${await navLine()} | ${JSON.stringify(fg)}`);
await dlBtn("Connections");
ok(["interconnections", "system-connections"].includes(await H.hash()) && (await rows()) === 4, "3 the button lands on exactly those records: 4 rows", `${await H.hash()} rows ${await rows()}`);
ok(/Back to PDR/.test(await T("#k3task")) && /4 connections without a current agreement/.test(await T("#k3task")), "3 with the return bar", await T("#k3task"));
await back();
ok((await H.hash()) === "overview" && !(await ev(() => !!document.getElementById("k3task"))) && (await T("#k3o-next")) === card0, "3 Back returns to the Overview with the checklist as it was", (await H.hash()) + " " + (await T("#k3o-next")).slice(0, 160));
await dlBtn("Requirements");
ok((await rows()) === 14 && /Back to PDR/.test(await T("#k3task")), "3 Requirements' button lands on the 14 controls with no requirement, not a spreadsheet", `${await H.hash()} rows ${await rows()}`);
ok(!(await ev(() => document.getElementById("proto").classList.contains("fullwin"))), "3 it is a list, not the full-window workbook", await H.hash());
await back();

// ——— 4. Fix what holds a deliverable back on the page it lives on, and return ———
await dlBtn("Boundary");
const bRoute = await H.hash();
ok(/Back to PDR/.test(await T("#k3task")), "4 the boundary opens with the return bar", `${bRoute} ${await T("#k3task")}`);
await H.click("Request the SCA's review", "#main"); await p.fill('#modal input[type="date"]', "2026-11-21"); await H.click("Request review", "#modal", { exact: true, sel: "button" });
await H.go("overview");
bd = await dl("Boundary");
ok(bd && !bd.ok && /1 SCA review waiting on D. Okafor/.test(bd.text) && /^2\/5/.test(await ring()), "4 requested but not reviewed: still not ready, and the words follow", JSON.stringify(bd));
await dlBtn("Boundary");
await H.click("Record the review", "#main", { exact: true, sel: "button" });
await p.check('#modal input[type="radio"][value="accepted"]');
await H.click("Record review", "#modal", { exact: true, sel: "button" });
await back();
bd = await dl("Boundary");
const fg2 = await ev(() => PA.v3.fact("gate", "pdr-2"));
ok(bd && bd.ok && !bd.btn, "4 back on the Overview the Boundary deliverable reads ready, without anyone ticking it", JSON.stringify(bd));
ok(/^3\/5/.test(await ring()) && /3 of 5 ready/.test(await navLine()) && fg2.ready === 3 && (await stepRows()).some((x) => /^PDR.*3\/5$/.test(x)), "4 Ready counts one more everywhere it is shown", `${await ring()} | ${await navLine()} | ${JSON.stringify(fg2)}`);

// ——— 5. The gate's panel: the decision is refused, then recorded ———
await p.click('#k3o-life tbody tr:has-text("PDR")'); await H.wait(450);
let pn = await H.panel();
ok(/PDR · Preliminary design review/.test(pn) && /Deliverables 3 of 5 ready/.test(flat(pn)) && /Criteria 2 of 4 met/.test(flat(pn)), "5 a step opens its gate in a panel: deliverables and criteria", flat(pn).slice(0, 300));
ok((await H.hash()) === "overview" && /Decides MR Marcus Ryde · Chief engineer/.test(flat(pn)) && /Requested Nov 10 by Ray Colston/.test(flat(pn)), "5 it says who decides and who asked, on the Overview's address", flat(pn).slice(0, 400));
ok(!(await ev(() => !![...document.querySelectorAll("#panel .btn")].find((b) => b.innerText.trim() === "Record decision"))) && /Record as Marcus Ryde/.test(pn), "5 the engineer signed in does not hold the deciding role: no Record decision of her own, only the prototype acting as Marcus Ryde, said plainly", flat(pn).slice(-300));
await H.click("Record as Marcus Ryde", "#panel", { exact: true, sel: "button" });
ok(/The prototype is acting as Marcus Ryde/.test(await H.modal()), "5 the form says the prototype is acting as that person", (await H.modal()).slice(0, 300));
await form({ o: "yes", why: "The allocated baseline is ready for detailed design." });
const refusal = await T('#modal [data-k3-field="o"] .err');
ok(/PDR cannot pass while Requirements and Connections are not ready: 14 controls with no requirement/.test(refusal), "5 Record decision is refused, naming the deliverables", refusal);
await form({ o: "cond" });
ok(/PDR cannot pass while Requirements and Connections are not ready/.test(await T('#modal [data-k3-field="o"] .err')), "5 Pass with actions is refused the same way", await T('#modal [data-k3-field="o"] .err'));
await p.click("#modal [data-k3-close]"); await H.wait(200);
// Requirements, through the panel's own button: the 14 controls, each mapped in its panel; Back reopens the gate's panel.
await p.click('#panel .k3o-dl:has(.k3o-dl-n:has-text("Requirements")) .btn'); await H.wait(650);
// On the whole build the 14 are Controls itself, filtered (lane C); alone, the Overview's stand-in list.
const INT = (await H.hash()) === "controls";
ok(((await H.hash()) === "k3o-noreq" || INT) && (await rows()) === 14 && /Back to PDR/.test(await T("#k3task")), "5 from the panel, Requirements opens the same 14 controls with the return bar", `${await H.hash()} ${await rows()}`);
for (let i = 0; i < 14; i++) {
  await p.click("#main tbody tr td", { position: { x: 12, y: 12 } }); await H.wait(300); // the row's left edge: the open panel covers its middle
  if (INT) { // the control's own panel: Add requirement, pick one, Add
    await p.click("#panel .k3-next .btn"); await H.wait(300);
    await p.click("#modal .k3-pick-i:not(.held) input"); await H.wait(150);
    await p.click("#modal [data-k3-submit]"); await H.wait(350);
    if (i === 0) ok((await rows()) === 13 && !(await H.modal()), "5 adding a requirement in a control's panel takes it off the list", `rows ${await rows()} modal ${(await H.modal()).slice(0, 120)}`);
    continue;
  }
  await H.click("Map a requirement", "#panel", { wait: 250 });
  await ev(() => { const s = document.querySelector("#modal select"); if (s) { s.selectedIndex = Math.max(1, s.selectedIndex); s.dispatchEvent(new Event("change", { bubbles: true })); } });
  const ta = await p.$("#modal textarea"); if (ta) await ta.fill("Mapped for PDR.");
  await p.click("#modal .dlg-f .btn.ink"); await H.wait(300);
  if (i === 0) ok((await rows()) === 13 && !(await H.modal()), "5 mapping a requirement in a control's panel takes it off the list", `rows ${await rows()} modal ${(await H.modal()).slice(0, 120)}`);
}
ok((INT ? (await rows()) <= 1 && /No controls match/.test(await H.main()) : (await rows()) === 0 && /Every control has a requirement/.test(await H.main())), "5 the list empties as the controls are mapped", `rows ${await rows()}`);
await back();
pn = flat(await H.panel());
ok((await H.hash()) === "overview" && /PDR · Preliminary design review/.test(pn) && /Deliverables 4 of 5 ready/.test(pn) && /Ready: Requirements Every control has a requirement/.test(pn), "5 Back returns to the Overview with the gate's panel open again, and Requirements reads ready", pn.slice(0, 400));
// Connections are lane S's records (a connection's agreement is recorded on its panel there): the walk signs the four in their data.
await ev(() => { for (const x of PA.v8bIC) if (x.agr && (x.agr.st === "Expired" || x.agr.st === "Draft")) Object.assign(x.agr, { st: "Signed", signed: "2026-11-17", exp: "2029-11-17" }); PA.v2.set("walk.touch", Date.now()); PA.v2.redraw(); });
await H.wait(400);
pn = flat(await H.panel());
ok(/Deliverables 5 of 5 ready/.test(pn) && /^5\/5/.test(await ring()) && /5 of 5 ready/.test(await navLine()), "5 once their records are ready every deliverable reads ready, in the panel, on the card and under the switcher", pn.slice(0, 300) + " | " + (await ring()) + " | " + (await navLine()));
await H.click("Record as Marcus Ryde", "#panel", { exact: true, sel: "button" });
await form({ o: "yes", why: "The allocated baseline is ready for detailed design." });
ok(/Pass waits on 2 criteria not met \(AR\.7, SR\.6\)/.test(await T('#modal [data-k3-field="o"] .err')), "5 Pass also waits on the criteria not met, naming them", await T('#modal [data-k3-field="o"] .err'));
await p.click("#modal [data-k3-close]"); await H.wait(200);
await p.click('#panel .k3o-cr:has-text("AR.7") [data-k3="ov.crit"]'); await H.wait(350);
await form({ s: "met", note: "Interfaces are defined in the Block 1.1 interface control document." });
pn = flat(await H.panel());
ok(/Criteria 3 of 4 met/.test(pn) && (await ev(() => PA.v3.fact("outcome", "AR.7", 2).status)) === "met", "5 a criterion is assessed in the panel, where lane G's outcome status lives: 3 of 4 met", pn.slice(pn.indexOf("Criteria"), pn.indexOf("Criteria") + 60));
await H.click("Record as Marcus Ryde", "#panel", { exact: true, sel: "button" });
await form({ o: "yes", why: "The allocated baseline is ready for detailed design." });
ok(/Pass waits on 1 criterion not met \(SR\.6\)/.test(await T('#modal [data-k3-field="o"] .err')), "5 and Pass then names only what is left", await T('#modal [data-k3-field="o"] .err'));
await form({ o: "cond", acts: "Close SR.6: trace the security constraints to stakeholder requirements", owner: "Ingrid Solberg", due: "2026-12-15" });
ok(!(await H.modal()), "5 Pass with actions is recorded", (await H.modal()).slice(0, 200));
pn = flat(await H.panel());
ok(/Passed with actions/.test(pn) && /Decided by MR Marcus Ryde/.test(pn) && /Actions 1/.test(pn) && /Close SR\.6/.test(pn), "5 the panel reads decided, by Marcus Ryde, with its action tracked", pn.slice(0, 500));
sr = await stepRows();
ok(sr.some((x) => /^PDR.*Decided Nov 17.*Passed with actions/.test(x)), "5 the step reads decided in the phase's list", sr.join(" | "));
ok(/4 of 5 done/.test(await T("#k3o-life .k3o-ph.on")), "5 the strip moves on: TMRR 4 of 5 done", await T("#k3o-life .k3o-ph.on"));
ok(/Next gate AO approval of the RMF strategy/i.test(await T("#k3o-next")) && /next AO approval of the RMF strategy/.test(await navLine()), "5 the next gate's checklist takes its place, and the line under the switcher follows", (await T("#k3o-next")).slice(0, 200) + " | " + (await navLine()));
await ev(() => document.getElementById("closePanel") && document.getElementById("closePanel").click());

// ——— 6. Needs attention: a row opens its list on exactly those records ———
const att = await ev(() => [...document.querySelectorAll("#main .k3-att-r")].map((x) => x.innerText.replace(/\s+/g, " ").trim()));
ok(att.length === 4 && /Risks without an owner 40/.test(att.join("|")) && /Evidence waiting on review 88/.test(att.join("|")), "6 one needs-attention card, four rows", att.join(" | "));
await p.click('#main .k3-att-r:has-text("Risks without an owner")'); await H.wait(700);
// On the whole build Risks and Evidence are the new pages (lanes E and D): the count sets their chip; alone, v2's saved view.
if (await ev(() => typeof PA.v3.facts.findingCounts === "function")) ok((await H.hash()) === "risks" && /No owner/.test(await T("#main .k3-chip.on")) && (await rows()) === 40, "6 Risks without an owner opens Risks on its 40 records", `${await H.hash()} | ${await T("#main .k3-chip.on")} | rows ${await rows()}`);
else ok((await H.hash()) === "risks" && /No owner/.test(await T("#main .qv.on")) && /of 40/.test(await T("#main .pager")), "6 Risks without an owner opens Risks on its 40 records", `${await H.hash()} | ${await T("#main .qv.on")} | ${await T("#main .pager")}`);
await H.go("overview");
await p.click('#main .k3-att-r:has-text("Evidence waiting on review")'); await H.wait(700);
if (await ev(() => typeof PA.v3.facts.evPanel === "function")) ok((await H.hash()) === "evidence" && /review/i.test(await T("#main .k3-chip.on")) && /of 88/.test(await T("#main .k3-table-foot, #main .k3-foot, #main tfoot, #main .k3d-foot") || await H.main()), "6 Evidence waiting on review opens Evidence on its 88", `${await H.hash()} | ${await T("#main .k3-chip.on")} | rows ${await rows()}`);
else ok((await H.hash()) === "evidence" && /Pending review/.test(await T("#main .qv.on")) && /of 88/.test(await T("#main .pager")), "6 Evidence waiting on review opens Evidence on its 88", `${await H.hash()} | ${await T("#main .qv.on")} | ${await T("#main .pager")}`);
await H.go("overview");
ok((await ev(() => document.querySelectorAll("#main .k3-comp").length)) === 1 && /Controls satisfied\s*↗?\s*41%/.test(await T("#main .k3-comp")) && !/Plans, assessments and setup/.test(await H.main()), "6 one completion card; nothing that only repeats the menu", (await T("#main .k3-comp")).slice(0, 100));
if (await ev(() => typeof PA.v3.facts.baseline === "function")) {
  await p.click("#main .k3-comp .k3-comp-go"); await H.wait(600);
  const sat = await ev(() => (PA.v3.fact("controls", PA.v3.WSX) || PA.v3.fact("controls") || {}).satisfied);
  ok((await H.hash()) === "controls" && new RegExp("of " + sat + "\\b").test(await H.main()), "6 Controls satisfied opens Controls on exactly the satisfied ones", `${await H.hash()} sat ${sat}`);
  await ev(() => PA.v3k.set("ctl.view", {})); await H.go("overview");
}

// ——— 7. Team: assign a role; the Overview's Team and the gate's "who decides" follow ———
await H.click("Manage", "#main", { exact: true, sel: "a" });
ok((await H.hash()) === "overview-team" && /Team 15/.test(await T("#main .k3-tabs")) && /Authorizing official/.test(await H.main()), "7 Manage opens the Team tab: roles and people", (await H.main()).slice(0, 200));
await p.click('#main tr:has-text("Chief engineer") [data-k3="ov.assign"]'); await H.wait(350);
await form({ who: "Ingrid Solberg" });
ok(/Chief engineer.*Ingrid Solberg/.test(await trOf("Chief engineer")), "7 the role is assigned in place", await trOf("Chief engineer"));
await p.click('#main table[aria-label="People"] tr:has-text("R. Calloway")'); await H.wait(400);
ok(/R\. Calloway/.test(await H.panel()), "7 a person opens their existing panel", (await H.panel()).slice(0, 120));
await H.click("Add a person", "#main", { exact: true, sel: "button" });
await form({ name: "Dana Whitlock", org: "Program office" });
ok(/Team 16/.test(await T("#main .k3-tabs")) && /Dana Whitlock/.test(await T('#main table[aria-label="People"]')), "7 Add a person adds the row and the tab's count", await T("#main .k3-tabs"));
await H.go("overview");
ok(/Chief engineer IS Ingrid Solberg/.test(flat(await T("#main .k3-aside-s"))), "7 the Overview's Team follows", flat(await T("#main .k3-aside-s")).slice(-300));
ok(/Ingrid Solberg decides/.test(await T("#k3o-next")) || !/Engineering review/.test(await T("#k3o-next")), "7 (the next gate names its own decider)", (await T("#k3o-next")).slice(0, 200));
await phase("EMD"); await p.click('#k3o-life tbody tr:has-text("CDR")'); await H.wait(450);
pn = flat(await H.panel());
ok(/Decides IS Ingrid Solberg · Chief engineer/.test(pn) && /You hold Chief engineer/.test(pn), "7 the gate's who decides follows: CDR is now hers to record", pn.slice(0, 400));
ok(await ev(() => !![...document.querySelectorAll("#panel .btn")].find((b) => b.innerText.trim() === "Request decision" || b.innerText.trim() === "Record decision")), "7 and the panel offers her the decision", pn.slice(-200));
await ev(() => document.getElementById("closePanel") && document.getElementById("closePanel").click());

// ——— 8. Old addresses land where the brief says ———
const land = async (r) => { await H.go("controls"); await H.go(r, 650); return { hash: await H.hash(), panel: flat(await H.panel()).slice(0, 60), on: await ev(() => [...document.querySelectorAll("#nav a.item.on")].map((a) => a.innerText.trim()).join(",")) }; };
let L = await land("lifecycle");
ok(L.hash === "overview" && L.on === "Overview" && flat(await T("#k3o-life .k3o-ph.on")).startsWith("TMRR"), "8 lifecycle opens the Overview with the current phase open", JSON.stringify(L));
L = await land("lifecycle-increment-1");
ok(L.hash === "overview" && (await ev(() => document.querySelector("#k3o-life select").value)) === "1", "8 lifecycle-increment-1 opens the Overview on Increment 1", JSON.stringify(L));
L = await land("lifecycle-outcomes");
ok(L.hash === "overview" && /Gate/.test(L.panel) && /Criteria/.test(await H.panel()), "8 lifecycle-outcomes opens the next gate's panel, where its criteria are", JSON.stringify(L));
L = await land("sse");
ok(L.hash === "overview" && /Gate/.test(L.panel), "8 sse opens the same", JSON.stringify(L));
L = await land("lifecycle-cdr-2");
ok(L.hash === "overview" && /CDR/.test(await H.panel()) && flat(await T("#k3o-life .k3o-ph.on")).startsWith("EMD"), "8 a gate's old page opens the Overview on its phase with its panel open", JSON.stringify(L));
L = await land("rec--a-work-gate--pdr");
ok(L.hash === "overview" && /PDR · Preliminary design review/.test(await H.panel()), "8 rec--a-work-gate--pdr opens PDR's panel", JSON.stringify(L));
L = await land("lifecycle-ato-2");
ok(L.hash === "authorization", "8 an authorization step's old page opens Authorization", JSON.stringify(L));
L = await land("people");
ok(L.hash === "overview-team" && L.on === "Overview", "8 people opens the Team tab", JSON.stringify(L));
L = await land("activity");
ok(L.hash === "overview-activity" && L.on === "Overview" && (await rows()) >= 30, "8 activity opens the Activity tab", JSON.stringify(L) + " rows " + (await rows()));
ok(/Gate decided/.test(await H.main()) && /PDR-2 · Approved with conditions/.test(await H.main()), "8 the decision recorded above is the newest activity", (await T("#main tbody tr")).slice(0, 200));
const actAll = await rows();
await p.click('#main .k3-chip:has-text("Decisions and publications")'); await H.wait(350);
ok((await H.hash()) === "overview-activity" && /Decisions and publications/.test(await T("#main .k3-chip.on")) && (await rows()) < actAll, "8 Activity's chips filter in place", `${await T("#main .k3-chip.on")} rows ${await rows()} of ${actAll}`);
L = await land("getting-started");
ok(L.hash === "overview" && L.on === "Overview", "8 getting-started opens the Overview", JSON.stringify(L));
await p.click("#nav .v2g-head"); await H.wait(500);
ok((await H.hash()) === "overview" && flat(await T("#k3o-life .k3o-ph.on")).startsWith("TMRR") && (await ev(() => document.querySelector("#k3o-life select").value)) === "2", "8 the stage line under the program switcher opens the Overview on the current phase", await T("#k3o-life .k3o-ph.on"));

// ——— State survives a reload of the address ———
await p.reload(); await H.wait(900);
ok((await H.hash()) === "overview" && /Next gate AO approval of the RMF strategy/i.test(await T("#k3o-next")) && /Chief engineer IS Ingrid Solberg/.test(flat(await T("#main .k3-aside-s"))), "a reload keeps the decision and the assignment", (await T("#k3o-next")).slice(0, 120));

// ——— 9. A created program: its own Overview ———
await ev(() => { PA.v2.reset(); PA.v3.set(true); }); await H.wait(400);
const seen = await createSP70(H, { nss: true });
const m9 = await H.main();
ok((await H.hash()) === "overview" && /SP-70 Precision Strike Pod/.test(m9) && /PRG-2301/.test(m9) && !/WS-X90|Sentinel|PDR package|SYS-WSX90/.test(m9), "9 a created program's Overview is its own, never WS-X90's", seen.code + " " + flat(m9).slice(0, 200));
ok(/Set up the program/.test(m9) && /Sign the ITCSC/.test(m9) && /Open ITCSC/.test(m9) && /Not authorized/.test(m9), "9 its next step is lane P's setup guide, with the button that does it", flat(m9).slice(200, 600));
ok(flat(await T("#k3o-life .k3o-ph.on")).startsWith("MSA") && (await stepRows()).some((x) => /^ASR.*Due Dec 1/.test(x)), "9 its own lifecycle: Increment 1 planned, MSA open", (await stepRows()).join(" | "));
await p.click("#k3o-life tbody tr"); await H.wait(450);
ok(/ASR · Alternative systems review/.test(await H.panel()) && /1 deliverable of 1 not ready/.test(flat(await H.panel())) && !/Every deliverable is ready/.test(await H.panel()), "9 its gate opens in the panel and reads its own readiness", flat(await H.panel()).slice(0, 300));
await ev(() => document.getElementById("closePanel") && document.getElementById("closePanel").click());
await H.go("overview-team");
ok(/R\. Calloway/.test(await H.main()) && /Joel Barrantes/.test(await H.main()) && !/Capt\. T\. Abara/.test(await H.main()), "9 its Team is the wizard's roles", flat(await H.main()).slice(0, 300));
await H.go("overview-activity");
ok(/No activity yet/.test(await H.main()), "9 its Activity starts empty", flat(await H.main()).slice(0, 200));

// ——— Every route at 1440 and 390: no sideways scroll, the menu present, its entry marked ———
await ev(() => { PA.v2.reset(); PA.v3.set(true); }); await H.wait(400);
for (const w of [1440, 390]) {
  await H.width(w);
  for (const rt of ["overview", "overview-team", "overview-activity", "k3o-noreq"]) {
    await H.go(rt);
    const s = await ev(() => ({ side: document.documentElement.scrollWidth - document.documentElement.clientWidth, main: document.getElementById("main").scrollWidth - document.getElementById("main").clientWidth, nav: !!document.querySelector("#nav a.item"), on: [...document.querySelectorAll("#nav a.item.on")].map((a) => a.innerText.trim()).join(",") }));
    ok(s.side <= 1 && s.main <= 1 && s.nav && (s.on === (rt === "k3o-noreq" ? "Controls" : "Overview")), `${rt} at ${w}: no sideways scroll, the menu present, its entry marked`, JSON.stringify(s));
  }
  if (w === 390) { await H.go("overview"); await ev(() => PA.v3k.openPanel("k3o-gate", "pdr-2")); await H.wait(400); const s = await H.side(); ok(s <= 1 && /PDR/.test(await H.panel()), "the gate's panel at 390: no sideways scroll", s); }
}
ok(H.errs.length === 0, "no page errors", H.errs.join(" | "));
console.log(`\n${pass} passed, ${fail} failed`);
await H.b.close();
process.exit(fail ? 1 : 0);
