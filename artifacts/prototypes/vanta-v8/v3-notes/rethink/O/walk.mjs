// Lane O's walk: with V3 on, through the UI, every flow of the brief, asserting what a person would see.
//   node walk.mjs [build]        (default: SP/vanta/proto/out/v3r-O.html)
import { open, createSP70, SP } from "../../v3/P/lib.mjs";
const BUILD = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : SP + "/vanta/proto/out/v3r3-O.html";
console.log("build: " + BUILD);
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

// Pass 3: a list's filters are selects in its one row. onFlt: the filters that are set; pick: choose one by its option's text.
const onFlt = () => ev(() => [...document.querySelectorAll("#main .k3-tb .k3-flt.on select")].map((s) => s.options[s.selectedIndex].text).join(" | "));
const viewName = () => T("#main .k3-tb .k3-vname");
const pick = async (key, text) => { const done = await ev(([key, text]) => { const s = document.querySelector(`#main .k3-tb select[data-k3-fkey="${key}"], #main .k3-tb select[data-k3-input="${key}"]`); if (!s) return "no select " + key; const i = [...s.options].findIndex((o) => o.text.replace(/\s*\(\d[\d,]*\)$/, "").trim() === text || (!text && o === s.options[0])); if (i < 0) return "no option " + text; s.selectedIndex = i; s.dispatchEvent(new Event("input", { bubbles: true })); s.dispatchEvent(new Event("change", { bubbles: true })); return ""; }, [key, text]); await H.wait(450); return done; };
const viewMenu = async (label) => { await p.click("#main .k3-vbtn"); await H.wait(100); await ev((l) => { const x = [...document.querySelectorAll("#main .k3-vlist .k3-menu-i")].find((e) => e.textContent.trim().startsWith(l)); if (!x) throw new Error("no view menu item " + l); x.click(); }, label); await H.wait(400); };
const oneRow = () => ev(() => { const t = document.querySelector("#main .k3-tb"); if (!t) return { bars: 0 }; const kids = [...t.children].flatMap((c) => (c.classList.contains("k3-fs") ? [...c.children] : [c])).filter((e) => e.getClientRects().length); return { bars: document.querySelectorAll("#main .k3-tb").length, lines: new Set(kids.map((e) => Math.round((e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2) / 10))).size, strips: document.querySelectorAll("#main .k3-chips, #main .k3-rtabs").length, headA: document.querySelectorAll("#main .k3-head-a .btn").length, tail: [...t.querySelectorAll(".k3-tools-r .btn, .k3-tools-r summary")].map((b) => b.innerText.replace(/[\s⌄]+/g, " ").trim()).join(","), list: t.getAttribute("data-k3-list") }; });
const tall = () => ev(() => [...document.querySelectorAll("#main table")].filter((t) => t.getClientRects().length).flatMap((t) => [...t.querySelectorAll("tbody tr")].filter((r) => r.getBoundingClientRect().height > 44 && !r.querySelector("td.k3-cw")).map((r) => (t.getAttribute("aria-label") || "") + ": " + r.innerText.replace(/\s+/g, " ").trim().slice(0, 60))));
const cutAway = (label, col) => ev(([label, col]) => { const t = document.querySelector(`#main table[aria-label="${label}"]`); if (!t) return ["no table " + label]; return [...t.querySelectorAll("tbody tr:not(.k3-grow)")].map((r) => r.cells[col]).filter((td) => td && [td, ...td.querySelectorAll("*")].some((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== "visible")).map((td) => td.innerText.trim().slice(0, 50)); }, [label, col]);

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
ok(c && !c.ok && /4 connections with no current agreement/.test(c.text) && c.btn === "Open 4 connections", "3 Connections says why it is not ready as a number, with one button", JSON.stringify(c));
ok(r && /14 controls with no requirement/.test(r.text) && bd && /1 SCA review to request/.test(bd.text), "3 Requirements and Boundary say theirs", JSON.stringify([r, bd]));
ok((await dl("PDR package")).ok && !(await dl("PDR package")).btn, "3 a ready deliverable is quiet: no button", JSON.stringify(await dl("PDR package")));
const notReady = await ev(() => document.querySelectorAll("#k3o-next .k3o-dl:not(.ok)").length);
const fg = await ev(() => ({ g: PA.v3.fact("gate", "pdr-2"), n: PA.v3.fact("nextGate") }));
ok(/^2\/5/.test(await ring()) && notReady === 3 && /2 of 5 ready/.test(await navLine()) && fg.g.ready === 2 && fg.g.total === 5 && fg.n.ready === 2 && fg.n.total === 5 && (await stepRows()).some((x) => /^PDR.*2\/5$/.test(x)),
  "3 one count of readiness: the card, its 3 open rows, the steps table, the line under the switcher and the facts all say 2 of 5", `${await ring()} | open ${notReady} | ${await navLine()} | ${JSON.stringify(fg)}`);
await dlBtn("Connections");
ok(["interconnections", "system-connections"].includes(await H.hash()) && (await rows()) === 4, "3 the button lands on exactly those records: 4 rows", `${await H.hash()} rows ${await rows()}`);
ok(/Back to PDR/.test(await T("#k3task")) && /4 connections with no current agreement/.test(await T("#k3task")), "3 with the return bar", await T("#k3task"));
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

// ——— 5. Pass 2: a gate is a page (its row opens it), its preview is the eye; the decision is refused, then recorded ———
const GP = "gate--pdr-2";
const onNav = () => ev(() => [...document.querySelectorAll("#nav a.item.on")].map((a) => a.innerText.trim()).join(","));
const headBtns = () => ev(() => [...document.querySelectorAll("#main .k3-head-a .btn")].map((b) => b.innerText.replace(/[\s⌄]+/g, " ").trim() + (b.classList.contains("ink") ? "*" : "")));
const rowOf = (table, text) => ev(([table, text]) => { const tr = [...document.querySelectorAll(`#main table[aria-label="${table}"] tbody tr`)].find((r) => r.innerText.includes(text)); return tr ? tr.innerText.replace(/\s+/g, " ").trim() : ""; }, [table, text]);
const critHead = () => T("#k3o-crit .k3-sec-h");
await p.click('#k3o-life tbody tr:has-text("PDR") td:nth-child(2)'); await H.wait(500);
let pg = flat(await H.main());
ok((await H.hash()) === GP && /Overview › PDR · Preliminary design review/.test(flat(await T("#main .k3-crumbs"))) && (await onNav()) === "Overview", "5 a step's row opens the gate's page, under Overview, with a breadcrumb back", `${await H.hash()} | ${await T("#main .k3-crumbs")} | ${await onNav()}`);
ok(/Deliverables 3 of 5 ready/.test(pg) && /Criteria 2 of 4 met/.test(pg) && (await ev(() => document.querySelectorAll('#main table[aria-label="Deliverables"] tbody tr').length)) === 5 && (await ev(() => document.querySelectorAll("#k3o-crit tbody tr").length)) === 4, "5 the page holds deliverables and criteria as tables", pg.slice(0, 300));
ok(/Decides MR Marcus Ryde · Chief engineer/.test(pg) && /Requested Nov 10 by Ray Colston/.test(pg) && /The allocated baseline is reviewed/.test(await T("#main .k3-head")), "5 a Decision card says who decides and who asked; the header says what the gate is", pg.slice(0, 400));
let hb = await headBtns();
ok(hb.filter((x) => x.endsWith("*")).length === 1 && hb.includes("Record as Marcus Ryde*") && !hb.some((x) => /^Record decision/.test(x)) && (await ev(() => document.querySelectorAll("#main .btn.ink").length)) === 1, "5 the decision is the header's one primary; the engineer signed in gets no Record decision of her own, only the prototype acting as Marcus Ryde", hb.join(" | "));
ok(/3 deliverables hold PDR back|2 deliverables hold PDR back/.test(pg) && /Start with Requirements: 14 controls with no requirement/.test(pg), "5 the page says what holds the gate back, with the button that opens it", pg.slice(0, 300));
await H.go("overview");
await p.hover('#k3o-life tbody tr:has-text("PDR")'); await p.click('#k3o-life tbody tr:has-text("PDR") .k3-eye'); await H.wait(450);
let pn = flat(await H.panel());
ok((await H.hash()) === "overview" && /Gate preview/.test(pn) && /PDR · Preliminary design review/.test(pn) && /Deliverables 3 of 5 ready/.test(pn), "5 the eye on the row opens the gate's preview, the Overview still under it", `${await H.hash()} ${pn.slice(0, 200)}`);
ok(await ev(() => !![...document.querySelectorAll("#panel a.btn")].find((a) => a.innerText.trim() === "Open gate" && a.getAttribute("href") === "#gate--pdr-2")), "5 the preview's Open gate goes to the page", pn.slice(0, 200));
await ev(() => document.getElementById("closePanel") && document.getElementById("closePanel").click());
await p.click("#k3o-next .k3o-gate-t"); await H.wait(450);
ok((await H.hash()) === GP && !(await H.panel()), "5 the next gate's name on the Overview goes to its page: no preview opens on a click", `${await H.hash()} ${(await H.panel()).slice(0, 80)}`);
await p.click('#main .k3-head-a [data-k3="ov.decide"]'); await H.wait(350);
ok(/The prototype is acting as Marcus Ryde/.test(await H.modal()), "5 the form says the prototype is acting as that person", (await H.modal()).slice(0, 300));
await form({ o: "yes", why: "The allocated baseline is ready for detailed design." });
const refusal = await T('#modal [data-k3-field="o"] .err');
ok(/Pass waits on Requirements and Connections: 14 controls with no requirement/.test(refusal) && /Pass with actions/.test(refusal), "5 a plain Pass is refused, naming the deliverables and the way on", refusal); // lead: only a plain Pass waits on every deliverable
await form({ o: "cond" });
ok(/Enter at least one action/.test(await T('#modal [data-k3-field="acts"] .err')), "5 Pass with actions is taken once it says what closes the open deliverables", await T('#modal [data-k3-field="acts"] .err'));
await p.click("#modal [data-k3-close]"); await H.wait(200);
// What blocks the gate is a row that goes to its records: the 14 controls. Each is worked on its own page; the bar brings the reader back.
await p.click('#main table[aria-label="Deliverables"] tr:has-text("Requirements") td:nth-child(3)'); await H.wait(700);
// On the whole build the 14 are Controls itself, filtered (lane C); alone, the Overview's stand-in list.
const INT = (await H.hash()) === "controls";
ok(((await H.hash()) === "k3o-noreq" || INT) && (await rows()) === 14 && /Back to PDR/.test(await T("#k3task")), "5 on the gate's page the Requirements row goes to its records: the same 14 controls, with the return bar", `${await H.hash()} ${await rows()}`);
for (let i = 0; i < 14; i++) {
  if (INT) { // a row opens the control's page (pass 2); Add requirement is its header's primary; the list is one step back
    await p.click("#main tbody tr td:nth-child(2)"); await H.wait(450);
    if (i === 0) ok(/^control--/.test(await H.hash()) && /Back to PDR/.test(await T("#k3task")), "5 a control's row opens the control's page, the return bar still on it", `${await H.hash()} | ${await T("#k3task")}`);
    await p.click("#main .k3-head-a .btn.ink"); await H.wait(350);
    await p.click("#modal .k3-pick-i:not(.held) input"); await H.wait(150);
    await p.click("#modal [data-k3-submit]"); await H.wait(350);
    await H.go("controls", 450);
    if (i === 0) ok((await rows()) === 13 && !(await H.modal()), "5 a requirement added on the control's page takes it off the list", `rows ${await rows()} modal ${(await H.modal()).slice(0, 120)}`);
    continue;
  }
  await p.click("#main tbody tr td", { position: { x: 12, y: 12 } }); await H.wait(300);
  await H.click("Map a requirement", "#panel", { wait: 250 });
  await ev(() => { const s = document.querySelector("#modal select"); if (s) { s.selectedIndex = Math.max(1, s.selectedIndex); s.dispatchEvent(new Event("change", { bubbles: true })); } });
  const ta = await p.$("#modal textarea"); if (ta) await ta.fill("Mapped for PDR.");
  await p.click("#modal .dlg-f .btn.ink"); await H.wait(300);
  if (i === 0) ok((await rows()) === 13 && !(await H.modal()), "5 mapping a requirement in a control's panel takes it off the list", `rows ${await rows()} modal ${(await H.modal()).slice(0, 120)}`);
}
ok((INT ? (await rows()) <= 1 && /No controls match/.test(await H.main()) : (await rows()) === 0 && /Every control has a requirement/.test(await H.main())), "5 the list empties as the controls are mapped", `rows ${await rows()}`);
await back();
ok((await H.hash()) === GP && /Deliverables 4 of 5 ready/.test(flat(await H.main())) && /Requirements Ready Every control has a requirement/.test(await rowOf("Deliverables", "Requirements")), "5 Back to PDR returns to the gate's page, and Requirements reads ready", `${await H.hash()} | ${await rowOf("Deliverables", "Requirements")}`);
// Connections are lane S's records (a connection's agreement is recorded on its page there): the walk signs the four in their data.
await ev(() => { for (const x of PA.v8bIC) if (x.agr && (x.agr.st === "Expired" || x.agr.st === "Draft")) Object.assign(x.agr, { st: "Signed", signed: "2026-11-17", exp: "2029-11-17" }); PA.v2.set("walk.touch", Date.now()); PA.v2.redraw(); });
await H.wait(400);
pg = flat(await H.main());
ok(/Deliverables 5 of 5 ready/.test(pg) && /5 of 5 ready/.test(await navLine()) && (await ev(() => PA.v3.fact("nextGate").ready)) === 5, "5 once their records are ready every deliverable reads ready: on the page, under the switcher, in the fact", pg.slice(0, 300) + " | " + (await navLine()));
ok(/Every deliverable is ready\. 2 criteria not met \(AR\.7, SR\.6\)/.test(pg), "5 the page's next step moves on to the criteria not met", pg.slice(0, 300));
await p.click('#main .k3-head-a [data-k3="ov.decide"]'); await H.wait(350);
await form({ o: "yes", why: "The allocated baseline is ready for detailed design." });
ok(/Pass waits on 2 criteria not met \(AR\.7, SR\.6\)/.test(await T('#modal [data-k3-field="o"] .err')), "5 Pass also waits on the criteria not met, naming them", await T('#modal [data-k3-field="o"] .err'));
await p.click("#modal [data-k3-close]"); await H.wait(200);
// Criteria are a table with its own Add: assess one, add one from NIST's outcomes, write one, remove both again.
await p.click('#k3o-crit tr:has-text("AR.7") [data-k3="ov.crit"]'); await H.wait(350);
await form({ s: "met", note: "Interfaces are defined in the Block 1.1 interface control document." });
ok(/Criteria 3 of 4 met/.test(await critHead()) && /Met Interfaces are defined in the Block 1\.1/.test(await rowOf("", "AR.7") || flat(await T("#k3o-crit"))) && (await ev(() => PA.v3.fact("outcome", "AR.7", 2).status)) === "met", "5 a criterion is assessed in its row, where lane G's outcome status lives: 3 of 4 met, with what meets it", await critHead());
await p.click('#k3o-crit [data-k3="ov.critadd"]'); await H.wait(400);
ok(/Add criteria/.test(await H.modal()) && /Write a criterion/.test(await H.modal()) && /AR\.1/.test(await H.modal()), "5 Add criterion offers the outcomes the gate does not hold yet, and Write a criterion as its first line", (await H.modal()).slice(0, 200));
await p.click("#modal .k3-pick-i:not(.held) input"); await p.click("#modal [data-k3-submit]"); await H.wait(450);
ok(/Criteria 3 of 5 met/.test(await critHead()) && /AR\.1/.test(await T("#k3o-crit")), "5 the outcome joins the gate's criteria, not assessed: 3 of 5", await critHead());
await p.click('#k3o-crit [data-k3="ov.critadd"]'); await H.wait(300); await p.click("#modal [data-k3-picknew]"); await H.wait(300);
await form({ text: "The PDR hazard log lists every cyber hazard with its mitigation.", proc: "Program test plan" });
ok(/Criteria 3 of 6 met/.test(await critHead()) && /hazard log/.test(await T("#k3o-crit")), "5 a criterion written here joins them: 3 of 6", await critHead());
await p.click('#k3o-crit tbody tr:last-child [data-k3="ov.critrm"]'); await H.wait(300); await p.click("#modal [data-k3-submit]"); await H.wait(400);
await p.click('#k3o-crit tr:has-text("AR.1") [data-k3="ov.critrm"]'); await H.wait(300); await p.click("#modal [data-k3-submit]"); await H.wait(400);
ok(/Criteria 3 of 4 met/.test(await critHead()), "5 and both can be removed again: 3 of 4", await critHead());
await p.click("#main .k3-head .k3-menu summary"); await p.click('#main .k3-head .k3-menu-i:has-text("Export the gate")'); await H.wait(450);
ok(/PRG-1090-pdr-2\.csv (downloaded|saved)/.test(await H.toast()) || /Copy PRG-1090-pdr-2\.csv/.test(await H.modal()), "5 Export the gate saves a file through the kit (K.save)", `${await H.toast()} ${(await H.modal()).slice(0, 80)}`);
if (await H.modal()) { await p.click("#modal [data-k3-close]"); await H.wait(200); }
await p.click('#main .k3-head-a [data-k3="ov.decide"]'); await H.wait(350);
await form({ o: "yes", why: "The allocated baseline is ready for detailed design." });
ok(/Pass waits on 1 criterion not met \(SR\.6\)/.test(await T('#modal [data-k3-field="o"] .err')), "5 and Pass then names only what is left", await T('#modal [data-k3-field="o"] .err'));
await form({ o: "cond", acts: "Close SR.6: trace the security constraints to stakeholder requirements", owner: "Ingrid Solberg", due: "2026-12-15" });
ok(!(await H.modal()), "5 Pass with actions is recorded", (await H.modal()).slice(0, 200));
pg = flat(await H.main()); hb = await headBtns();
ok((await H.hash()) === GP && /Passed with actions/.test(pg) && /Decided by MR Marcus Ryde/.test(pg) && /Actions 1/.test(pg) && /Close SR\.6/.test(pg) && !hb.some((x) => x.endsWith("*")), "5 the page reads decided, by Marcus Ryde, with its action tracked; no decision is left in the header", pg.slice(0, 500) + " | " + hb.join(","));
ok(/next: AO approval of the RMF strategy/.test(await H.toast()), "5 the toast names the next gate", await H.toast());
await p.click("#v2-toast .v2-toast-link"); await H.wait(500);
ok((await H.hash()) === "gate--strat-2" && /AO approval of the RMF strategy/.test(await T("#main .k3-title")), "5 and its link opens that gate's page", `${await H.hash()} ${await T("#main .k3-title")}`);
await H.click("Overview", "#main .k3-crumbs", { exact: true, sel: "a" });
sr = await stepRows();
ok((await H.hash()) === "overview" && sr.some((x) => /^PDR.*Decided Nov 17.*Passed with actions/.test(x)), "5 the breadcrumb goes back to the Overview, where the step reads decided", `${await H.hash()} ${sr.join(" | ")}`);
ok(/4 of 5 done/.test(await T("#k3o-life .k3o-ph.on")), "5 the strip moves on: TMRR 4 of 5 done", await T("#k3o-life .k3o-ph.on"));
ok(/Next gate AO approval of the RMF strategy/i.test(await T("#k3o-next")) && /next AO approval of the RMF strategy/.test(await navLine()), "5 the next gate's checklist takes its place, and the line under the switcher follows", (await T("#k3o-next")).slice(0, 200) + " | " + (await navLine()));

// ——— 6. Needs attention: a row opens its list on exactly those records ———
const att = await ev(() => [...document.querySelectorAll("#main .k3-att-r")].map((x) => x.innerText.replace(/\s+/g, " ").trim()));
ok(att.length === 4 && /Risks without an owner 40/.test(att.join("|")) && /Evidence waiting on review 88/.test(att.join("|")), "6 one needs-attention card, four rows", att.join(" | "));
await p.click('#main .k3-att-r:has-text("Risks without an owner")'); await H.wait(700);
// On the whole build Risks and Evidence are the new pages (lanes E and D): the count sets their chip; alone, v2's saved view.
if (await ev(() => typeof PA.v3.facts.findingCounts === "function")) ok((await H.hash()) === "risks" && /No owner/.test(await onFlt()) && (await rows()) === 40, "6 Risks without an owner opens Risks on its 40 records", `${await H.hash()} | ${await onFlt()} | rows ${await rows()}`);
else ok((await H.hash()) === "risks" && /No owner/.test(await T("#main .qv.on")) && /of 40/.test(await T("#main .pager")), "6 Risks without an owner opens Risks on its 40 records", `${await H.hash()} | ${await T("#main .qv.on")} | ${await T("#main .pager")}`);
await H.go("overview");
await p.click('#main .k3-att-r:has-text("Evidence waiting on review")'); await H.wait(700);
if (await ev(() => typeof PA.v3.facts.evPanel === "function")) ok((await H.hash()) === "evidence" && /review/i.test(await onFlt()) && /of 88/.test(await T("#main .pager") || await H.main()), "6 Evidence waiting on review opens Evidence on its 88", `${await H.hash()} | ${await onFlt()} | rows ${await rows()}`);
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
await phase("EMD"); await p.click('#k3o-life tbody tr:has-text("CDR") td:nth-child(2)'); await H.wait(450);
pg = flat(await H.main()); hb = await headBtns();
ok((await H.hash()) === "gate--cdr-2" && /Decides IS Ingrid Solberg · Chief engineer/.test(pg) && /You hold Chief engineer/.test(pg), "7 the gate's who decides follows: CDR is now hers to record", pg.slice(0, 400));
ok(hb.includes("Record decision*") && !hb.some((x) => /^Record as/.test(x)), "7 and the page's primary is her own Record decision", hb.join(" | "));
await H.go("overview");

// ——— 8. Old addresses land where the brief says ———
const land = async (r) => { await H.go("controls"); await H.go(r, 650); return { hash: await H.hash(), panel: flat(await H.panel()).slice(0, 60), on: await ev(() => [...document.querySelectorAll("#nav a.item.on")].map((a) => a.innerText.trim()).join(",")) }; };
let L = await land("lifecycle");
ok(L.hash === "overview" && L.on === "Overview" && flat(await T("#k3o-life .k3o-ph.on")).startsWith("TMRR"), "8 lifecycle opens the Overview with the current phase open", JSON.stringify(L));
L = await land("lifecycle-increment-1");
ok(L.hash === "overview" && (await ev(() => document.querySelector("#k3o-life select").value)) === "1", "8 lifecycle-increment-1 opens the Overview on Increment 1", JSON.stringify(L));
L = await land("lifecycle-outcomes");
ok(/^gate--/.test(L.hash) && L.on === "Overview" && /Criteria/.test(await T("#k3o-crit")), "8 lifecycle-outcomes opens the next gate's page, where its criteria are", JSON.stringify(L));
L = await land("sse");
ok(/^gate--/.test(L.hash) && /Criteria/.test(await T("#k3o-crit")), "8 sse opens the same", JSON.stringify(L));
L = await land("lifecycle-cdr-2");
ok(L.hash === "gate--cdr-2" && /CDR · Critical design review/.test(await T("#main .k3-title")) && L.on === "Overview", "8 a gate's old page opens the gate's page", JSON.stringify(L));
L = await land("rec--a-work-gate--pdr");
ok(L.hash === "gate--pdr-2" && /PDR · Preliminary design review/.test(await T("#main .k3-title")), "8 rec--a-work-gate--pdr opens PDR's page", JSON.stringify(L));
L = await land("lifecycle-ato-2");
ok(L.hash === "authorization", "8 an authorization step's old page opens Authorization", JSON.stringify(L));
L = await land("people");
ok(L.hash === "overview-team" && L.on === "Overview", "8 people opens the Team tab", JSON.stringify(L));
L = await land("activity");
ok(L.hash === "overview-activity" && L.on === "Overview" && (await rows()) >= 30, "8 activity opens the Activity tab", JSON.stringify(L) + " rows " + (await rows()));
ok(/Gate decided/.test(await H.main()) && /PDR-2 · Approved with conditions/.test(await H.main()), "8 the decision recorded above is the newest activity", (await T("#main tbody tr")).slice(0, 200));
const actAll = await rows();
const pk = await pick("kind", "Decisions and publications");
ok(!pk && (await H.hash()) === "overview-activity" && /Kind: Decisions and publications/.test(await onFlt()) && (await rows()) < actAll && (await viewName()) === "Decisions and publications", "8 Activity's Kind filters in place, in the row, and is one of its views", `${pk} ${await onFlt()} rows ${await rows()} of ${actAll} view ${await viewName()}`);
await pick("kind", "");
ok((await rows()) === actAll && (await viewName()) === "All activity", "8 Kind cleared: every event again", `${await rows()} ${await viewName()}`);
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
await p.click("#k3o-life tbody tr td:nth-child(2)"); await H.wait(450);
ok((await H.hash()) === "gate--asr-1" && /ASR · Alternative systems review/.test(await T("#main .k3-title")) && /1 deliverable of 1 not ready/.test(flat(await H.main())) && !/Every deliverable is ready/.test(await H.main()) && !/WS-X90|PDR package/.test(await H.main()), "9 its gate opens as its own page and reads its own readiness", flat(await H.main()).slice(0, 300));
await H.go("overview-team");
ok(/R\. Calloway/.test(await H.main()) && /Joel Barrantes/.test(await H.main()) && !/Capt\. T\. Abara/.test(await H.main()), "9 its Team is the wizard's roles", flat(await H.main()).slice(0, 300));
await H.go("overview-activity");
ok(/No activity yet/.test(await H.main()), "9 its Activity starts empty", flat(await H.main()).slice(0, 200));

// ——— Pass 3 (21 Nov): one row over a table with its views, one line a row, a preview that lists what the page lists ———
await ev(() => { PA.v2.reset(); PA.v3.set(true); }); await H.wait(400);
await H.go("overview-activity");
let bar = await oneRow();
ok(bar.bars === 1 && bar.lines === 1 && bar.strips === 0 && bar.headA === 0 && /More/.test(bar.tail) && bar.list === "activity", "P3 Activity: one row (search, view, Kind, Who, More at its end), no strip, no header actions", JSON.stringify(bar));
const actN = await rows();
await viewMenu("Evidence sent back");
let sent = await ev(() => [...document.querySelectorAll('#main table[aria-label="Activity"] tbody tr')].map((r) => r.cells[2].innerText.trim()));
ok(sent.length > 0 && sent.length < actN && sent.every((a) => a === "Evidence sent back") && /Kind: Evidence reviews/.test(await onFlt()) && (await ev(() => document.querySelector("#main .k3-tb input[type=search]").value)) === "sent back" && (await viewName()) === "Evidence sent back", "P3 Activity starts with a saved view, Evidence sent back: it sets Kind and the search", `${sent.length} of ${actN} | ${await onFlt()} | ${await viewName()}`);
await viewMenu("All activity");
ok((await rows()) === actN && !(await onFlt()), "P3 All activity clears the row", `${await rows()} | ${await onFlt()}`);
await pick("kind", "Evidence reviews"); await pick("ov.actwho", "Nadia Fournier");
const mineRows = await ev(() => [...document.querySelectorAll('#main table[aria-label="Activity"] tbody tr')].map((r) => r.innerText.replace(/\s+/g, " ").trim()));
ok(mineRows.length > 0 && mineRows.every((r) => /Nadia Fournier/.test(r)) && /Edited/.test(await T("#main .k3-vbtn")), "P3 Kind and Who narrow the log; the view says it was edited", `${mineRows.length} | ${await T("#main .k3-vbtn")}`);
await viewMenu("Save as new view"); await p.fill("#modal input[name=name]", "Nadia's reviews"); await p.click("#modal [data-k3-submit]"); await H.wait(400);
ok((await viewName()) === "Nadia's reviews" && !/Edited/.test(await T("#main .k3-vbtn")), "P3 the question is saved as a view and is the current one", await T("#main .k3-vbtn"));
await viewMenu("All activity"); await H.go("overview"); await H.go("overview-activity");
ok((await rows()) === actN && (await viewName()) === "All activity", "P3 left for All activity, and the page left and reopened", `${await rows()} ${await viewName()}`);
await viewMenu("Nadia's reviews");
const again = await ev(() => [...document.querySelectorAll('#main table[aria-label="Activity"] tbody tr')].map((r) => r.innerText.replace(/\s+/g, " ").trim()));
ok(again.length === mineRows.length && again.join("|") === mineRows.join("|") && /Kind: Evidence reviews \| Who: Nadia Fournier/.test(await onFlt()), "P3 picked again, the saved view gives the same rows", `${again.length} vs ${mineRows.length} | ${await onFlt()}`);
await p.fill("#main .k3-tb input[type=search]", "zzzz"); await H.wait(500);
ok((await rows()) === 0 && /No event matches/.test(await H.main()), "P3 a search nothing matches says so, with the row still there", (await H.main()).slice(-200));
await ev(() => { const c = document.querySelector("#main .k3-clear"); c && c.click(); }); await H.wait(400);
ok((await rows()) === actN, "P3 Clear asks for every event again", await rows());
const logW = await ev(() => { const t = document.querySelector('#main table[aria-label="Activity"]'); return { w: [...t.querySelectorAll("thead th")].map((th) => Math.round(th.getBoundingClientRect().width)), untitled: [...t.querySelectorAll("tbody tr")].flatMap((r) => [r.cells[3], r.cells[4]]).filter((td) => td.scrollWidth > td.clientWidth + 1 && (td.firstElementChild || {}).title !== td.innerText.trim()).length }; });
ok(logW.w[3] > logW.w[0] * 2 && logW.w[3] > logW.w[4] && logW.untitled === 0, "P3 an event's record takes the room (When no longer does); a cell that is cut says the whole on hover", JSON.stringify(logW));
await p.click('#main table[aria-label="Activity"] tbody tr:first-child td:nth-child(4)'); await H.wait(400);
ok(/Snapshot taken|Control status/.test(await H.panel()), "P3 an event's row still opens the event", (await H.panel()).slice(0, 120));
await ev(() => document.getElementById("closePanel") && document.getElementById("closePanel").click());
// rows: one line each on every table of the lane; what was a second line is a column
for (const rt of ["overview", "overview-team", "overview-activity", "gate--pdr-2", "gate--srr-2"]) { await H.go(rt); const t = await tall(); ok(t.length === 0, `P3 ${rt}: every row is one line (a criterion's sentence alone may wrap)`, t.join(" | ")); }
await H.go("overview-team");
const roleHead = await ev(() => [...document.querySelectorAll('#main table[aria-label="Roles"] thead th')].map((th) => th.innerText.trim()).join("|"));
ok(roleHead === "Role|Held by|Decides|" && /Chief engineer MR Marcus Ryde Engineering reviews: SRR, SFR, PDR, CDR/.test(await trOf("Chief engineer")) && (await cutAway("Roles", 0)).length === 0 && (await cutAway("Roles", 2)).length === 0, "P3 Team: what a role decides is a column, and nothing of a role is cut", `${roleHead} | ${await trOf("Chief engineer")} | ${(await cutAway("Roles", 2)).join(",")}`);
ok((await oneRow()).bars === 0 && (await ev(() => document.querySelectorAll("#main .k3-chips, #main .k3-rtabs").length)) === 0, "P3 Team and Overview have no table toolbar; their header keeps its More", "");
await H.go("gate--pdr-2");
const dlHead = await ev(() => [...document.querySelectorAll('#main table[aria-label="Deliverables"] thead th')].map((th) => th.innerText.trim()).join("|"));
ok(dlHead === "Deliverable|Status|What holds it back|Owner|" && (await cutAway("Deliverables", 2)).length === 0 && /Requirements Not ready 14 controls with no requirement IS Ingrid Solberg Open/.test(await rowOf("Deliverables", "Requirements")), "P3 the gate's deliverables: ready or not, what holds each back whole on its line, its owner, Open", `${dlHead} | ${await rowOf("Deliverables", "Requirements")} | cut ${(await cutAway("Deliverables", 2)).join(",")}`);
const crit = await ev(() => [...document.querySelectorAll("#k3o-crit tbody tr")].map((r) => ({ h: Math.round(r.getBoundingClientRect().height), wrap: !!r.querySelector("td.k3-cw"), cut: r.cells[0].scrollWidth > r.cells[0].clientWidth + 1, t: r.cells[0].innerText.trim().length })));
ok(crit.length === 4 && crit.every((c) => c.wrap && !c.cut && c.h <= 84), "P3 a criterion's sentence is read whole (the one cell that wraps), in three lines at most", JSON.stringify(crit));
// the preview lists what the page lists, short
const pageSecs = await ev(() => [...document.querySelectorAll("#main .k3-sec h2")].map((h) => { const c = h.cloneNode(true); c.querySelectorAll(".k3-ct").forEach((x) => x.remove()); return c.textContent.trim(); }));
await H.go("overview");
await p.hover('#k3o-life tbody tr:has-text("PDR")'); await p.click('#k3o-life tbody tr:has-text("PDR") .k3-eye'); await H.wait(450);
const pv = await ev(() => { const pn = document.querySelector("#panel .k3-pn"); if (!pn) return null; return { secs: [...pn.querySelectorAll(".k3-sec h2")].map((h) => { const c = h.cloneNode(true); c.querySelectorAll(".k3-ct").forEach((x) => x.remove()); return c.textContent.trim(); }), tables: pn.querySelectorAll("table").length, wide: [...pn.querySelectorAll("table")].filter((t) => t.scrollWidth > t.parentElement.clientWidth + 2).length, tall: [...pn.querySelectorAll("tbody tr")].filter((r) => r.getBoundingClientRect().height > 44).length, dl: [...pn.querySelectorAll('table[aria-label="Deliverables"] tbody tr')].map((r) => r.innerText.replace(/\s+/g, " ").trim()), cr: [...pn.querySelectorAll('table[aria-label="Criteria"] tbody tr')].map((r) => r.innerText.replace(/\s+/g, " ").trim()), next: (pn.querySelector(".k3-next") || {}).innerText || "" }; });
ok(pv && pageSecs.length >= 2 && pageSecs.every((x) => pv.secs.includes(x)) && pv.tables === pageSecs.length, "P3 the gate's preview lists every section its page lists (Deliverables, Criteria)", JSON.stringify([pageSecs, pv && pv.secs]));
ok(pv && pv.wide === 0 && pv.tall === 0 && pv.dl.length === 5 && pv.dl.some((r) => /^Requirements 14 controls with no requirement Not ready$/.test(r)) && pv.cr.length === 4 && pv.cr.some((r) => /^SR\.6 .* Not met$/.test(r)), "P3 its rows are one line: the name, why as a number, the status; nothing wider than the panel", JSON.stringify(pv && [pv.dl, pv.cr.map((r) => r.slice(0, 30) + "…" + r.slice(-10))]));
ok(pv && /Start with Requirements: 14 controls with no requirement/.test(pv.next), "P3 the preview says what holds the gate back, with its button", pv && pv.next);
await p.click('#panel table[aria-label="Deliverables"] tbody tr:has-text("Connections")'); await H.wait(700);
ok(/^system-connections|^interconnections/.test(await H.hash()) && /Back to PDR/.test(await T("#k3task")) && /4 connections with no current agreement/.test(await T("#k3task")), "P3 a deliverable's row in the preview opens exactly the records that hold it back, with the way back", `${await H.hash()} | ${await T("#k3task")}`);
await back();
ok((await H.hash()) === "gate--pdr-2", "P3 and Back returns to the gate's page", await H.hash());

// ——— Pass 2's three changes, on every page of this lane, at 1440 and at 390 ———
await ev(() => { PA.v2.reset(); PA.v3.set(true); }); await H.wait(400);
for (const w of [1440, 390]) {
  await H.width(w);
  for (const rt of ["overview", "overview-team", "overview-activity", "gate--pdr-2", "gate--cdr-2"]) {
    await H.go(rt);
    const s = await ev(() => ({ side: document.documentElement.scrollWidth - document.documentElement.clientWidth, main: document.getElementById("main").scrollWidth - document.getElementById("main").clientWidth, nav: !!document.querySelector("#nav a.item"), on: [...document.querySelectorAll("#nav a.item.on")].map((a) => a.innerText.trim() || a.textContent.trim()).join(","),
      rails: document.querySelectorAll("#main .k3-rail:not(.k3-rtabs)").length, places: [...document.querySelectorAll("#nav a.item")].map((a) => a.textContent.trim()).join("|"), rail: (() => { const r = document.getElementById("rail"); return !!(r && r.offsetParent && r.getBoundingClientRect().width > 0); })(),
      peek: [...document.querySelectorAll('#main [data-panel="k3o-gate"]')].filter((e) => !e.classList.contains("k3-eye")).length }));
    ok(s.side <= 1 && s.main <= 1 && s.nav && s.on === "Overview", `${rt} at ${w}: no sideways scroll, the menu present, Overview marked`, JSON.stringify(s));
    if (/^gate--/.test(rt)) { const g2 = await ev(() => { const b = document.querySelector("#main .k3-aside-b"), sd = document.querySelector("#main .k3-aside-s"); if (!b || !sd) return null; const rb = b.getBoundingClientRect(), rs = sd.getBoundingClientRect(); return { beside: rs.left >= rb.right - 1, under: rs.top >= rb.bottom - 1, bodyW: Math.round(rb.width) }; });
      ok(g2 && (w === 390 ? g2.under && g2.bodyW > 300 : g2.beside), `${rt} at ${w}: Details and Decision sit ${w === 390 ? "under the body, which keeps the width" : "beside the body"}`, JSON.stringify(g2)); }
    ok(s.rails === 0 && /Overview\|System\|Controls\|Requirements\|Evidence\|Documents\|Assessments\|Findings\|Risks\|Authorization/.test(s.places) && s.peek === 0, `${rt} at ${w}: one sidebar with the ten places, no side rail on the page, nothing but an eye opens a gate's preview`, JSON.stringify(s));
  }
  await H.go("overview");
  const eyes = await ev(() => ({ n: document.querySelectorAll("#k3o-life tbody tr .k3-eye").length, go: [...document.querySelectorAll("#k3o-life tbody tr[data-go]")].map((r) => r.getAttribute("data-go")).join(",") }));
  ok(eyes.n >= 4 && /gate--pdr-2/.test(eyes.go), `the steps table at ${w}: each row goes to its gate's page and carries an eye`, JSON.stringify(eyes));
  if (w === 390) { await ev(() => PA.v3k.openPanel("k3o-gate", "pdr-2")); await H.wait(400); const sd = await H.side(); ok(sd <= 1 && /PDR/.test(await H.panel()), "the gate's preview at 390: no sideways scroll", sd); await ev(() => document.getElementById("closePanel") && document.getElementById("closePanel").click()); }
}
await H.width(1440);
ok(H.errs.length === 0, "no page errors", H.errs.join(" | "));
console.log(`\n${pass} passed, ${fail} failed`);
await H.b.close();
process.exit(fail ? 1 : 0);
