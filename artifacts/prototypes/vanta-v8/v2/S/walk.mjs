// Agent S: the SCTM workbook's walk. node walk.mjs <build.html> [outDir]
// At 1440: open from the program, select (cell, range, row, column), move by keyboard, sort, filter, a filter view, find,
// edit a choice, a narrative and a requirement title, undo and redo, a live Analysis formula and one typed in, Review changes
// and Apply, then the change in the SSP editor, the requirement preview and the Requirements register; every record kind in a
// cell opens its preview (and every record any cell holds renders a preview), context menus, resize and fit.
// At 390: no sideways page scroll, the grid and the tabs scroll in their frames, a record opens as a sheet, an edit through
// the formula bar. Prints PASS/FAIL lines and exits 1 on any failure.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = process.argv[2];
const out = process.argv[3] || "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/v2/S/shots";
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const browser = await chromium.launch();

async function open(w) {
  const mobile = w < 500;
  // The published page gets a viewport meta; file:// does not, so the phone is a 390 px viewport with touch, not isMobile.
  const ctx = await browser.newContext({ viewport: { width: w, height: mobile ? 844 : 900 }, hasTouch: mobile, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto("file://" + file + "#overview");
  await page.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} });
  await page.goto("file://" + file + "#overview");
  await page.waitForTimeout(400);
  return { ctx, page, errs };
}
const name = (p) => p.$eval("#sx-name", (e) => e.value);
const staged = (p) => p.evaluate(() => window.PA.sctm.staged().length);
const panelOpen = (p) => p.evaluate(() => { const el = document.getElementById("panel"); return !!el && !el.hidden && !!el.querySelector(".pbody") && el.querySelector(".pbody").textContent.trim().length > 20 ? el.querySelector(".bar-top span").textContent : ""; });
const closePanel = async (p) => { const b = await p.$("#closePanel"); if (b) await b.click(); await p.waitForTimeout(80); };
const cellSel = (sid, ri, ci) => `#sx-${sid}-${ri}-${ci}`;
async function colIndex(p, label) { return p.evaluate((l) => [...document.querySelectorAll("#sx-grid .sx-h")].findIndex((h) => h.querySelector(".sx-hn").textContent === l), label); }
async function cellOf(p, rowText, colLabel) {
  // The rendered cell in the row whose first cell reads rowText, in the column labelled colLabel.
  return p.evaluate(([rt, cl]) => {
    const ci = [...document.querySelectorAll("#sx-grid .sx-h")].findIndex((h) => h.querySelector(".sx-hn").textContent === cl);
    const row = [...document.querySelectorAll("#sx-body .sx-row")].find((r) => r.children[1] && r.children[1].textContent.trim() === rt);
    return row && ci >= 0 ? row.children[ci + 1].id : null;
  }, [rowText, colLabel]);
}

// ════════════════ 1440 ════════════════
{
  const { ctx, page: p, errs } = await open(1440);
  // The way in: the program menu (agent N adds it), else the Requirements page's More menu (this module adds it).
  let via = "";
  let menuLink = await p.$('#nav a[href="#sctm"], #nav [data-go="sctm"]');
  if (menuLink && !(await menuLink.isVisible())) { const g = await p.$('#nav [data-group="Compliance"]'); if (g) { await g.click(); await p.waitForTimeout(100); } menuLink = await p.$('#nav a[href="#sctm"], #nav [data-go="sctm"]'); }
  if (menuLink && (await menuLink.isVisible())) { await menuLink.click(); via = "program menu"; }
  else { await p.goto("file://" + file + "#requirements"); await p.waitForTimeout(300); const more = await p.$(".sx-wayin summary, .a-tests-more summary"); if (more) { await more.click(); const it = await p.$('[data-go="sctm"]'); if (it) { await it.click(); via = "Requirements › More"; } } }
  if (!via) { await p.goto("file://" + file + "#sctm"); via = "address"; }
  await p.waitForSelector("#sx-body .sx-c", { timeout: 8000 });
  ok(true, `workbook opens (via ${via})`);
  ok(await p.evaluate(() => document.getElementById("proto").classList.contains("fullwin")), "full window: the shell's top bar and navigation step aside");
  const tabs = await p.$$eval(".sx-tab", (t) => t.map((x) => x.textContent.replace(/\d[\d,]*/g, "").trim()));
  ok(tabs.join(",") === "SCTM,Controls,Requirements,Evidence,Findings,Risks,Analysis", "seven sheets as tabs: " + tabs.join(", "));
  const rows = await p.evaluate(() => window.PA.sctm.state.sheets.find((s) => s.id === "sctm").rows.length);
  ok(rows === 560, `SCTM has one row a control (${rows})`);
  await p.screenshot({ path: `${out}/walk-1440-open.png` });
  // A control walked elsewhere reads the same here: SA-24 mapped to REQ-641 (the chain's state, as Map a requirement writes it),
  // and AC-3 mapped from the Requirements page (agent F's reqx.map).
  await p.goto("file://" + file + "#overview"); await p.waitForTimeout(200);
  await p.evaluate(() => { const V = window.PA.v2; V.set("chain.ctl.SA-24", { req: "REQ-641", reqTitle: "Mission functions continue through the compromise of one element", rel: "Satisfies", mapAt: "2026-11-17" }); V.set("reqx.map", [{ req: "REQ-001", ctl: "AC-3", rel: "Satisfies", note: "", at: "2026-11-17" }]); });
  await p.goto("file://" + file + "#sctm"); await p.waitForSelector("#sx-body .sx-c");
  const walked = await p.evaluate(() => { const sh = window.PA.sctm.state.sheets.find((s) => s.id === "sctm"); const sa = sh.rows.find((r) => r.recId === "SA-24"), ac = sh.rows.find((r) => r.recId === "AC-3"); return { saStatus: sa.v.cs, saReqs: sa.v.reqs, saPreview: window.PA.v2.chain.view("SA-24").status, acReqs: ac.v.reqs }; });
  ok(walked.saStatus === "No evidence" && walked.saPreview === "no_evidence" && /REQ-641/.test(walked.saReqs), `a control walked elsewhere reads the same here (SA-24: ${walked.saStatus}, mapped by ${walked.saReqs})`);
  ok(/REQ-001/.test(walked.acReqs), `a mapping made on the Requirements page shows (AC-3 mapped by ${walked.acReqs})`);

  // Selection: a cell, a range, a row, a column, keyboard.
  await p.click(cellSel("sctm", 0, 1)); ok((await name(p)) === "B1", "a click selects a cell (name box B1)");
  await p.click(cellSel("sctm", 3, 3), { modifiers: ["Shift"] }); ok((await name(p)) === "B1:D4", "shift-click selects a range (B1:D4)");
  ok(/Count/.test(await p.$eval("#sx-status", (e) => e.textContent)), "the status bar counts the range");
  await p.keyboard.press("Escape"); await p.keyboard.press("ArrowDown"); await p.keyboard.press("ArrowDown"); await p.keyboard.press("ArrowRight");
  ok((await name(p)) === "C3", "arrow keys move the active cell (C3)");
  await p.keyboard.press("Shift+ArrowDown"); await p.keyboard.press("Shift+ArrowRight"); ok((await name(p)) === "C3:D4", "shift+arrows extend (C3:D4)");
  await p.keyboard.press("Control+ArrowDown"); ok((await name(p)) === "C560", "ctrl+down jumps to the last row (C560)");
  await p.keyboard.press("Control+Home"); ok((await name(p)) === "A1", "ctrl+home returns to A1");
  await p.click('#sx-body .sx-rh[data-vr="2"]');
  ok((await p.$$eval("#sx-body .sx-row[data-vr='2'] .sx-sel", (x) => x.length)) >= 17, "a row header selects the row");
  const famI = await colIndex(p, "Family");
  await p.click(`#sx-h-${famI}`); ok((await name(p)) === "C1:C560", "a column header selects the column (C1:C560)");

  // Sort from the header menu.
  const csI = await colIndex(p, "Control status");
  await p.click(`[data-sx-hm="${csI}"]`); await p.waitForSelector("#sx-menu:not([hidden])");
  await p.click('#sx-menu .sx-mi:has-text("Sort Z to A")');
  ok((await p.$eval(`#sx-h-${csI}`, (e) => e.getAttribute("aria-sort"))) === "descending", "Sort Z to A from the column menu (aria-sort descending)");
  const firstStatus = await p.$eval(`#sx-body .sx-row[data-vr="0"] .sxc-${csI}`, (e) => e.textContent.trim());
  ok(firstStatus.length > 0, `the sorted column leads with ${firstStatus}`);
  const rn = await p.$eval('#sx-body .sx-row[data-vr="0"] .sx-rh', (e) => e.textContent);
  ok(rn !== "1", `row numbers keep their places after a sort (first row is row ${rn})`);
  await p.click(`[data-sx-hm="${csI}"]`); await p.click('#sx-menu .sx-mi:has-text("Back to row order")');

  // Filter: Family = AC through the filter popover.
  await p.click(`[data-sx-hm="${famI}"]`); await p.click('#sx-menu .sx-mi:has-text("Filter")');
  await p.waitForSelector(".sx-filter");
  await p.click('.sx-filter [data-f="none"]');
  await p.check('.sx-filter input[data-v="AC"]');
  await p.click('.sx-filter [data-f="apply"]');
  const famVals = await p.$$eval(`#sx-body .sxc-${famI}`, (x) => [...new Set(x.map((e) => e.textContent.trim()))]);
  const shownN = await p.evaluate(() => { const st = window.PA.sctm.state; return st.view.sctm.filters.fam ? [...st.view.sctm.filters.fam].join(",") : ""; });
  ok(famVals.length === 1 && famVals[0] === "AC" && shownN === "AC", "Filter… keeps only family AC");
  ok(/Showing/.test(await p.$eval("#sx-status", (e) => e.textContent)), "the status bar says how many rows the filter shows");
  ok(await p.$eval(`[data-sx-hm="${famI}"]`, (e) => e.classList.contains("on") && /filtered/.test(e.getAttribute("aria-label"))), "the filtered column's header says it is filtered");
  await p.click('[data-sx="clear"]');
  // A filter view.
  await p.selectOption('select[data-sx-chg="view"]', "noev");
  const evVals = await p.$$eval(`#sx-body .sxc-${csI}`, (x) => [...new Set(x.map((e) => e.textContent.trim()))]);
  ok(evVals.length === 1 && evVals[0] === "No evidence", "the No evidence view keeps controls with no evidence");
  await p.selectOption('select[data-sx-chg="view"]', "all");

  // Find.
  await p.click(cellSel("sctm", 0, 0));
  await p.keyboard.press("Control+f");
  await p.waitForSelector("#sx-find:not([hidden])");
  await p.fill("#sx-findq", "REQ-439");
  await p.waitForTimeout(150);
  const fc = await p.$eval("#sx-findn", (e) => e.textContent);
  ok(/\d+ match/.test(fc), `find counts matches (${fc})`);
  await p.keyboard.press("Enter");
  const nm = await name(p);
  ok(/^H\d+$/.test(nm), `Enter in find moves to the first match (${nm})`);
  await p.check("#sx-findall"); await p.waitForTimeout(100);
  const fcAll = await p.$eval("#sx-findn", (e) => e.textContent);
  ok(fcAll !== fc, `All sheets finds more (${fcAll})`);
  await p.keyboard.press("Escape").catch(() => {});
  await p.click('[data-sx="find-close"]');

  // Edit a choice: AC-2(5)'s implementation.
  const implI = await colIndex(p, "Implementation"), narrI = await colIndex(p, "Narrative");
  await p.click('#sx-name'); await p.fill("#sx-name", "AC-2(5)"); await p.keyboard.press("Enter");
  ok((await name(p)) === "A7", "the name box takes a record code (AC-2(5) → A7)");
  const ri = await p.evaluate(() => window.PA.SSP.controls.findIndex((c) => c.c === "AC-2(5)"));
  await p.click(cellSel("sctm", ri, implI));
  const before = await p.$eval(cellSel("sctm", ri, implI), (e) => e.textContent.trim());
  await p.keyboard.press("Enter");
  await p.waitForSelector(".sx-choice");
  await p.click('.sx-choice [data-v="Implemented"]');
  ok((await p.$eval(cellSel("sctm", ri, implI), (e) => e.textContent.trim())) === "Implemented" && before !== "Implemented", `a choice edit stages (${before} → Implemented)`);
  ok(await p.$eval(cellSel("sctm", ri, implI), (e) => e.classList.contains("sx-chg")), "the staged cell is marked");
  ok((await staged(p)) === 1 && /1 change staged/.test(await p.$eval("#sx-save", (e) => e.textContent)), "the header says 1 change staged");
  // A read-only cell refuses.
  await p.click(cellSel("sctm", ri, 1)); await p.keyboard.press("F2");
  ok(!(await p.$("#sx-ed:not([hidden])")) && /read only/i.test(await p.$eval("#sx-status", (e) => e.textContent)), "a derived cell stays read only and says so");
  // Edit a narrative: type over AC-1's.
  const NEW = "SCTM walk: the access control policy and its procedures are reissued for the 546-control set and signed.";
  await p.click(cellSel("sctm", 0, narrI)); await p.keyboard.press("F2");
  await p.waitForSelector("#sx-edi");
  await p.fill("#sx-edi", NEW); await p.keyboard.press("Enter");
  ok((await staged(p)) === 2, "a narrative edit stages (2 changes)");
  // Analysis follows staged edits: Implementation planned or not implemented.
  await p.click("#sx-tab-analysis"); await p.waitForTimeout(250);
  const anVal = async () => p.evaluate(() => { const rows = [...document.querySelectorAll("#sx-body .sx-row")]; const r = rows.find((x) => x.children[1].textContent === "Controls with no evidence"); return r ? r.children[2].textContent : null; });
  const planRow = async () => p.evaluate(() => { const rows = [...document.querySelectorAll("#sx-body .sx-row")]; const r = rows.find((x) => x.children[1].textContent === "Implementation planned or not implemented"); return r ? r.children[2].textContent : null; });
  const ev0 = await anVal(), pl1 = await planRow();
  ok(ev0 && /^\d+$/.test(ev0.replace(/,/g, "")), `Analysis calculates (controls with no evidence: ${ev0})`);
  const famRow = await p.evaluate(() => { const r = [...document.querySelectorAll("#sx-body .sx-row")].find((x) => x.children[1].textContent === "AC"); return r ? [...r.children].slice(2).map((c) => c.textContent) : null; });
  ok(famRow && famRow[0] && /%/.test(famRow[6] || ""), `coverage by family reads (AC: ${famRow && famRow.join(" | ")})`);
  // Type a formula into an empty cell.
  await p.click("#sx-name"); await p.fill("#sx-name", "B45"); await p.keyboard.press("Enter");
  await p.keyboard.type("=COUNTIF(SCTM!D:D,\"Implemented\")"); await p.keyboard.press("Enter");
  await p.waitForTimeout(200);
  const typed = await p.evaluate(() => { const st = window.PA.sctm.state; const c = st.calc && st.calc.sheets.analysis && st.calc.sheets.analysis.a45 && st.calc.sheets.analysis.a45.B; return c ? c.display : null; });
  const implCount = await p.evaluate(() => window.PA.SSP.controls.filter((c) => c.s === "implemented").length);
  ok(typed && Number(typed) === implCount + 1, `a typed formula calculates over the staged sheet (${typed} = ${implCount} implemented + 1 staged)`);
  const eng = await p.$eval("#sx-status", (e) => e.textContent);
  ok(/IronCalc/.test(eng), "formulas run on IronCalc 0.8.4 (" + eng.split("·").pop().trim() + ")");
  // Requirements: edit REQ-001's title.
  await p.click("#sx-tab-reqs"); await p.waitForTimeout(150);
  const tI = await colIndex(p, "Title");
  const reqRi = await p.evaluate(() => window.PA.sctm.state.sheets.find((s) => s.id === "reqs").rows.findIndex((r) => r.recId === "REQ-001"));
  await p.click(cellSel("reqs", reqRi, tI));
  const NEWT = "AC enforcement requirement 001, as the SCTM walk reworded it";
  await p.keyboard.type(NEWT); await p.keyboard.press("Enter");
  ok((await staged(p)) === 3, "a requirement title edit stages (3 changes)");
  // Undo and redo.
  await p.keyboard.press("Control+z"); ok((await staged(p)) === 2, "ctrl+z undoes the last edit (2)");
  await p.keyboard.press("Control+y"); ok((await staged(p)) === 3, "ctrl+y redoes it (3)");
  // The draft survives a visit elsewhere and a reload in the same tab.
  await p.goto("file://" + file + "#overview"); await p.waitForTimeout(250);
  await p.goto("file://" + file + "#sctm-requirements"); await p.waitForSelector("#sx-body .sx-c");
  ok((await staged(p)) === 3 && (await p.evaluate(() => document.querySelector(".sx-tab.on").textContent.startsWith("Requirements"))), "staged edits survive leaving the workbook; sctm-requirements opens that sheet");
  await p.reload(); await p.waitForSelector("#sx-body .sx-c");
  ok((await staged(p)) === 3, "staged edits survive a reload in the same tab");

  // Review changes and apply.
  await p.click(".sx-review");
  await p.waitForSelector("#modal:not([hidden]) .dlg");
  const rv = await p.$eval("#modal .dlg", (e) => e.textContent);
  ok(/3 changes to 3 records/.test(rv) && /AC-2\(5\)/.test(rv) && /REQ-001/.test(rv), "Review changes names every record and field");
  await p.screenshot({ path: `${out}/walk-1440-review.png` });
  await p.click("#modal [data-sctm-apply]");
  await p.waitForTimeout(250);
  ok((await staged(p)) === 0 && /No changes staged/.test(await p.$eval("#sx-save", (e) => e.textContent)), "Apply clears the staged changes");
  ok(await p.evaluate(() => window.PA.SSP.ctl("AC-2(5)").s === "implemented" && window.PA.v2.get("sctm.ctl.AC-2(5)").s === "implemented"), "the change is in PA.v2.state and WS-X90's records");
  ok(await p.evaluate(() => /applied/.test((document.getElementById("v2-toast") || {}).textContent || "")), "a toast says the changes were applied");
  // Shows elsewhere: the requirement preview, the Requirements register, the SSP editor.
  await p.click("#sx-tab-sctm"); await p.waitForTimeout(150);
  const reqChip = await p.$('#sx-body .sx-rec[data-panel="v7p-req"][data-id="REQ-001"]');
  if (reqChip) { await reqChip.click(); await p.waitForTimeout(150); ok(await p.evaluate((t) => document.getElementById("panel").textContent.includes(t), NEWT), "the requirement preview shows the edited title"); await closePanel(p); }
  else ok(false, "REQ-001 chip in the SCTM");
  await p.goto("file://" + file + "#requirements"); await p.waitForTimeout(300);
  const regHas = await p.evaluate((t) => document.getElementById("main").textContent.includes(t), NEWT);
  ok(regHas, "the Requirements register shows the edited title");
  await p.goto("file://" + file + "#ssp"); await p.waitForTimeout(900);
  ok(await p.evaluate((t) => document.getElementById("main").textContent.includes(t), NEW), "the SSP editor shows AC-1's new narrative");
  await p.goto("file://" + file + "#sctm"); await p.waitForSelector("#sx-body .sx-c");

  // Every record any cell holds renders a preview; one of each kind opens from its cell.
  const allRecs = await p.evaluate(() => {
    const out = []; const seen = new Set();
    for (const sh of window.PA.sctm.state.sheets) for (const r of sh.rows) for (const list of Object.values(r.recs || {})) for (const x of list) { const k = x.p + "|" + x.id; if (!seen.has(k)) { seen.add(k); out.push([x.p, x.id, sh.id]); } }
    let bad = [];
    for (const [p, id] of out) { try { const o = window.PA.P[p](id); if (!o || !o.body || !o.label) bad.push(p + " " + id); } catch (e) { bad.push(p + " " + id + ": " + e.message); } }
    return { n: out.length, kinds: [...new Set(out.map((x) => x[0]))], bad: bad.slice(0, 8), nb: bad.length };
  });
  ok(allRecs.nb === 0, `every record in a cell renders its preview (${allRecs.n} records, kinds ${allRecs.kinds.join(", ")})${allRecs.nb ? ": " + allRecs.bad.join("; ") : ""}`);
  const perKind = { "a-tests-control": "sctm", "v7p-req": "sctm", "v7p-el": "sctm", "a-risk-issue": "sctm", "a-risk-poam": "sctm", "a-risk-risk": "sctm", "a-docs-ev": "ev" };
  for (const [kind, sid] of Object.entries(perKind)) {
    await p.click("#sx-tab-" + sid); await p.waitForTimeout(100);
    if (kind !== "a-tests-control" && sid === "sctm") { await p.selectOption('select[data-sx-chg="view"]', kind.startsWith("a-risk") ? "risk" : "all"); await p.waitForTimeout(80); }
    const chip = await p.$(`#sx-body .sx-rec[data-panel="${kind}"]`);
    if (!chip) { ok(false, `a ${kind} record in a cell`); continue; }
    await chip.scrollIntoViewIfNeeded(); await chip.click(); await p.waitForTimeout(150);
    const lab = await panelOpen(p);
    ok(!!lab, `a ${kind} record opens its preview beside the grid (${lab})`);
    if (kind === "a-risk-risk") { const pr = await p.evaluate(() => { const a = document.getElementById("sx-app"), pn = document.getElementById("panel"); return [a.classList.contains("sx-pan"), a.querySelector(".sx-frame").getBoundingClientRect().right <= pn.getBoundingClientRect().left + 2]; }); ok(pr[0] && pr[1], "the grid narrows beside the open preview"); await p.screenshot({ path: `${out}/walk-1440-preview.png` }); }
    await closePanel(p);
  }
  await p.click("#sx-tab-sctm"); await p.selectOption('select[data-sx-chg="view"]', "all");
  // Enter on a record cell opens it; context menus open the row's control preview and page.
  await p.click(cellSel("sctm", 0, 0)); await p.keyboard.press("Enter"); await p.waitForTimeout(120);
  ok(/Control preview/.test(await panelOpen(p)), "Enter on a control cell opens its preview");
  await closePanel(p);
  await p.click(cellSel("sctm", 1, 1), { button: "right" });
  await p.waitForSelector("#sx-menu:not([hidden])");
  const items = await p.$$eval("#sx-menu .sx-mi", (x) => x.map((e) => e.textContent));
  ok(items.some((t) => /Open AC-2 control preview/.test(t)) && items.some((t) => /control page/.test(t)), "a cell's context menu offers the row's control preview and page");
  await p.click('#sx-menu .sx-mi:has-text("Open AC-2 control preview")'); await p.waitForTimeout(120);
  ok(/Control preview/.test(await panelOpen(p)), "the context menu opens the control's preview");
  await closePanel(p);
  await p.click('#sx-body .sx-rh[data-vr="1"]', { button: "right" }); await p.waitForSelector("#sx-menu:not([hidden])");
  await p.click('#sx-menu .sx-mi:has-text("control page")'); await p.waitForTimeout(400);
  ok(/rec--a-tests-control--AC-2|control-si2/.test(await p.evaluate(() => location.hash)), "a row's context menu opens its control's page (" + (await p.evaluate(() => location.hash)) + ")");
  await p.goto("file://" + file + "#sctm"); await p.waitForSelector("#sx-body .sx-c");
  const hm = await p.$eval(`#sx-h-1`, (e) => e.getBoundingClientRect().width);
  const rz = await p.$(`[data-sx-rsz="1"]`); const bb = await rz.boundingBox();
  await p.mouse.move(bb.x + 4, bb.y + 10); await p.mouse.down(); await p.mouse.move(bb.x + 84, bb.y + 10, { steps: 5 }); await p.mouse.up();
  const hm2 = await p.$eval(`#sx-h-1`, (e) => e.getBoundingClientRect().width);
  ok(Math.abs(hm2 - hm - 80) < 3, `a column resizes by dragging its edge (${Math.round(hm)} → ${Math.round(hm2)} px)`);
  await p.click(`[data-sx-hm="1"]`); await p.click('#sx-menu .sx-mi:has-text("Fit to contents")');
  ok((await p.$eval(`#sx-h-1`, (e) => e.getBoundingClientRect().width)) !== hm2, "Fit to contents sizes the column");
  // Frozen header row and first column.
  await p.$eval("#sx-scroll", (e) => { e.scrollTop = 4000; e.scrollLeft = 900; }); await p.waitForTimeout(120);
  const fz = await p.evaluate(() => { const sc = document.getElementById("sx-scroll").getBoundingClientRect(); const h = document.querySelector(".sx-hrow").getBoundingClientRect(); const c = document.querySelector("#sx-body .sx-row:nth-child(20) .sxf-0"); const cr = c.getBoundingClientRect(); return [Math.abs(h.top - sc.top) < 2, cr.left - sc.left < 60]; });
  ok(fz[0] && fz[1], "the header row and the first column stay in view while the grid scrolls");
  await p.screenshot({ path: `${out}/walk-1440-scrolled.png` });
  // Paste two statuses down the Implementation column, then discard them from the More menu.
  await p.$eval("#sx-scroll", (e) => { e.scrollTop = 0; e.scrollLeft = 0; }); await p.waitForTimeout(80);
  const implI2 = await colIndex(p, "Implementation");
  await p.click(cellSel("sctm", 8, implI2));
  await p.evaluate(() => { const dt = new DataTransfer(); dt.setData("text/plain", "Planned\nNot implemented\n"); document.getElementById("sx-grid").dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true })); });
  ok((await staged(p)) === 2 && /Pasted 2 cells/.test(await p.$eval("#sx-status", (e) => e.textContent)), "Ctrl+V pastes tab-separated values into editable cells (2 staged)");
  await p.evaluate(() => { const dt = new DataTransfer(); dt.setData("text/plain", "Maybe"); document.getElementById("sx-grid").dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true })); });
  ok((await staged(p)) === 2 && /Nothing pasted/.test(await p.$eval("#sx-status", (e) => e.textContent)), "a pasted value a choice does not hold is refused, in words");
  await p.click('[data-sx="more"]'); await p.click('#sx-menu .sx-mi:has-text("Discard staged changes")');
  ok((await staged(p)) === 0, "Discard staged changes clears the draft");
  // Freeze up to the Title column; the shortcuts dialog.
  await p.click(`[data-sx-hm="1"]`); await p.click('#sx-menu .sx-mi:has-text("Freeze up to Title")');
  await p.$eval("#sx-scroll", (e) => { e.scrollLeft = 1200; }); await p.waitForTimeout(80);
  ok(await p.evaluate(() => { const sc = document.getElementById("sx-scroll").getBoundingClientRect(); const c = document.querySelector("#sx-body .sx-row .sxf-1"); return !!c && c.getBoundingClientRect().left - sc.left < 220; }), "Freeze up to Title keeps the first two columns in view");
  await p.click('[data-sx="more"]'); await p.click('#sx-menu .sx-mi:has-text("Keyboard shortcuts")'); await p.waitForTimeout(120);
  ok(/Keyboard shortcuts/.test(await p.evaluate(() => (document.querySelector("#modal:not([hidden]) .dlg") || {}).textContent || "")), "More › Keyboard shortcuts lists the keys");
  await p.click("#modal [data-close-modal]");
  ok(errs.length === 0, "no page errors at 1440" + (errs.length ? ": " + errs.slice(0, 3).join(" | ") : ""));
  await ctx.close();
}

// ════════════════ 390 ════════════════
{
  const { ctx, page: p, errs } = await open(390);
  await p.goto("file://" + file + "#sctm"); await p.waitForSelector("#sx-body .sx-c", { timeout: 8000 });
  const m = await p.evaluate(() => ({ page: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1, grid: (() => { const s = document.getElementById("sx-scroll"); return s.scrollWidth > s.clientWidth; })(), tabs: (() => { const s = document.querySelector(".sx-tabscroll"); return s.scrollWidth > s.clientWidth; })() }));
  ok(m.page, "390: the page never scrolls sideways");
  ok(m.grid, "390: the grid scrolls inside its frame");
  ok(m.tabs, "390: the sheet tabs scroll");
  await p.screenshot({ path: `${out}/walk-390-open.png` });
  await p.$eval("#sx-scroll", (e) => { e.scrollLeft = 1200; }); await p.waitForTimeout(80);
  const chip = await p.$('#sx-body .sx-rec[data-panel="v7p-req"]');
  if (chip) { await chip.scrollIntoViewIfNeeded(); await chip.tap(); await p.waitForTimeout(200); const r = await p.evaluate(() => { const pn = document.getElementById("panel"); const b = pn.getBoundingClientRect(); return { open: !pn.hidden, top: b.top, bottom: b.bottom, w: b.width, vw: Math.round(document.getElementById("shell").getBoundingClientRect().width), vh: Math.round(document.getElementById("shell").getBoundingClientRect().bottom) }; }); ok(r.open && r.top > 120 && Math.abs(r.bottom - r.vh) < 2 && Math.abs(r.w - r.vw) < 2, `390: a record opens as a sheet from the bottom (top ${Math.round(r.top)} px, ${Math.round(r.w)} of the shell's ${r.vw} px)`); await p.screenshot({ path: `${out}/walk-390-sheet.png` }); await closePanel(p); }
  else ok(false, "390: a requirement chip");
  // Edit through the formula bar.
  await p.$eval("#sx-scroll", (e) => { e.scrollLeft = 0; }); await p.waitForTimeout(60);
  const narrI = await colIndex(p, "Narrative");
  await p.evaluate((ci) => window.PA.sctm.select("sctm", 4, ci), narrI);
  await p.tap("#sx-formula"); await p.fill("#sx-formula", "Narrative edited on a phone through the formula bar."); await p.keyboard.press("Enter");
  ok((await staged(p)) === 1, "390: an edit through the formula bar stages");
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), "390: still no sideways page scroll after editing");
  await p.tap(".sx-review"); await p.waitForSelector("#modal:not([hidden]) .dlg");
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), "390: Review changes fits the phone");
  await p.screenshot({ path: `${out}/walk-390-review.png` });
  await p.tap("#modal [data-close-modal]");
  ok(errs.length === 0, "no page errors at 390" + (errs.length ? ": " + errs.slice(0, 3).join(" | ") : ""));
  await ctx.close();
}
await browser.close();
console.log(fails ? `${fails} FAILED` : "ALL PASS");
process.exit(fails ? 1 : 0);
