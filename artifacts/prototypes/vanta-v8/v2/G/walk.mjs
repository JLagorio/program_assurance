// Agent G's walk: node walk.mjs <build> — clicks through the lifecycle at 1440 and 390 and checks that recording PDR's decision moves
// Lifecycle, the line under the program switcher, the Overview's strip, the Review queue and My work. Prints one line a check.
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = "file://" + path.resolve(process.argv[2]);
const b = await chromium.launch();
let fails = 0;
const ok = (w, name, cond, extra = "") => { if (!cond) fails++; console.log(`${cond ? "PASS" : "FAIL"} ${w} ${name}${extra ? " · " + extra : ""}`); };
for (const w of [1440, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w > 600 ? 900 : 844 } });
  const p = await ctx.newPage();
  const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
  await p.goto(file + "#home"); await p.waitForTimeout(500);
  await p.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} });
  await p.goto(file + "#lifecycle"); await p.reload(); await p.waitForTimeout(600);
  const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(350); };
  const text = (sel) => p.evaluate((sel) => { const el = document.querySelector(sel); return el ? el.textContent.replace(/\s+/g, " ").trim() : null; }, sel);
  const sideways = () => p.evaluate(() => document.scrollingElement.scrollWidth > document.scrollingElement.clientWidth + 1 || document.getElementById("main").scrollWidth > document.getElementById("main").clientWidth + 1);
  const openMenu = async () => { if (w < 600) { const m = await p.$("#menuBtn"); if (m) { await m.click(); await p.waitForTimeout(200); } } };

  // Lifecycle: 19 steps a increment, five phases, the switch.
  await go("lifecycle");
  ok(w, "lifecycle draws 19 marks and 5 phases", (await p.$$(".v2g-strip .v2g-mk")).length === 19 && (await p.$$(".v2g-phase")).length === 5);
  ok(w, "lifecycle rows: 19 steps across the phases", (await p.$$(".v2g-row")).length === 19);
  ok(w, "the current phase is open (TMRR)", /TMRR/.test(await text(".v2g-phase[open] summary") || ""));
  ok(w, "no sideways scroll on Lifecycle", !(await sideways()));
  await p.click('[data-v2g-inc="1"]'); await p.waitForTimeout(250);
  ok(w, "Increment 1 shows the ATO decided Sep 18", /ATO · Authority to operate/.test(await text(".v2g-life") || "") && (await p.$$(".v2g-mk.done")).length === 19);
  await p.click('[data-v2g-inc="2"]'); await p.waitForTimeout(250);

  // The PDR row opens its preview; ↗ opens its page.
  await p.click('.v2g-row[data-id="pdr-2"] .v2g-nm'); await p.waitForTimeout(300);
  ok(w, "PDR's preview opens with its deliverables", /Lifecycle gate preview/.test(await text("#panel .bar-top") || "") && /3 of 5 ready/.test(await text("#panel") || ""));
  const full = await p.$('#panel .bar-top button[aria-label="Open the full record"]');
  ok(w, "the preview has ↗", !!full);
  if (full) { await full.click(); await p.waitForTimeout(350); }
  ok(w, "↗ opens the PDR page", (await p.evaluate(() => location.hash)) === "#lifecycle-pdr-2" && /Preliminary design review/.test(await text("#main .ak-title") || ""));
  ok(w, "no sideways scroll on the PDR page", !(await sideways()));
  // A deliverable opens its record.
  const dl = await p.$('#main .v2g-dls a.v2g-dl[href="#sctm"]');
  ok(w, "the SCTM workbook deliverable is a link", !!dl);
  // A review package is a document with a preview.
  await p.click('#main .v2g-dls button.v2g-dl[data-panel="v2g-doc"]'); await p.waitForTimeout(300);
  ok(w, "the PDR package opens its document preview", /Document preview/.test(await text("#panel .bar-top") || "") && /Contents/.test(await text("#panel") || ""));
  const x = await p.$("#closePanel"); if (x) { await x.click(); await p.waitForTimeout(150); }

  // Before: the header line, the Overview strip, the queue and My work.
  await go("overview"); await openMenu();
  const head0 = await text("#nav .v2g-head");
  ok(w, "the switcher line says the stage", /Increment 2 · TMRR · next PDR Nov 24 · \d of 5 ready/.test(head0 || ""), head0);
  if (w < 600) { await p.keyboard.press("Escape"); await go("overview"); }
  const strip0 = await text("#main .v2g-ovs");
  ok(w, "the Overview strip names the next gate", /Next: PDR in 7 days · \d deliverables? not ready/.test(strip0 || ""), strip0);
  ok(w, "the Overview's Lifecycle fact is gone", !(await p.evaluate(() => [...document.querySelectorAll("#main .ak-rail dt")].some((d) => d.textContent.trim() === "Lifecycle"))));
  await go("review-queue");
  const all0 = await text("#main .ak-tabs .ak-tab .ct");
  ok(w, "the queue lists PDR · Increment 2, opening the gate", !!(await p.$('#main tr[data-panel="a-work-gate"][data-id="pdr-2"]')));
  await p.click('#main tr[data-panel="a-work-gate"][data-id="pdr-2"] td.nm'); await p.waitForTimeout(300);
  ok(w, "the queue's gate row opens the gate with its deliverables", /Lifecycle gate preview/.test(await text("#panel .bar-top") || "") && /Deliverables/.test(await text("#panel") || ""));
  // Another program's gate row opens that program's gate.
  { const x0 = await p.$("#closePanel"); if (x0) { await x0.click(); await p.waitForTimeout(150); } }
  const g1 = await p.$('#main tr[data-panel="v2g-pgate"][data-id="PRG-0994:srr"] td.nm');
  if (g1) { await g1.click(); await p.waitForTimeout(300); }
  ok(w, "an archived program's gate row opens its gate", /System requirements review/i.test(await text("#panel") || ""));
  const xx = await p.$("#closePanel"); if (xx) { await xx.click(); await p.waitForTimeout(150); }
  await go("my-work");
  ok(w, "My work groups the PDR deliverables not ready", /Due for PDR · Nov 24/.test(await text("#main") || ""));

  // Record PDR's decision from its page.
  await go("lifecycle-pdr-2");
  await p.click('#main [data-modal="v2g-decide"]'); await p.waitForTimeout(300);
  ok(w, "Record decision opens its dialog", /Record decision/.test(await text("#modal #dlgTitle") || ""));
  await p.click('#modal .dlg-f [data-v2k="v2g-decide"]'); await p.waitForTimeout(200);
  ok(w, "the dialog asks for a decision first", /Decision is required/.test(await text("#modal") || ""));
  await p.check('#modal input[name="dec"][value="cond"]');
  await p.click('#modal .dlg-f [data-v2k="v2g-decide"]'); await p.waitForTimeout(200);
  ok(w, "with conditions, the dialog asks for them", /Conditions: say what must be done/.test(await text("#modal") || ""));
  await p.fill('#modal textarea[name="cond"]', "Close the SCA's boundary review and trace the 14 controls before CDR.");
  await p.click('#modal .dlg-f [data-v2k="v2g-decide"]'); await p.waitForTimeout(500);
  ok(w, "the dialog closes and the toast says the next step", (await p.evaluate(() => document.getElementById("modal").hidden)) && /PDR approved with conditions: next RMF strategy, Dec 15/.test(await text("#v2-toast") || ""));
  ok(w, "the PDR page reads Passed with its conditions", /Passed/.test(await text("#main .ak-rh") || "") && /Approved with conditions/.test(await text("#main") || ""));

  // After: everything follows.
  await go("lifecycle");
  ok(w, "Lifecycle marks PDR done and RMF strategy current", !!(await p.$('.v2g-mk.done[data-id="pdr-2"]')) && !!(await p.$('.v2g-mk.on[data-id="strat-2"]')));
  await go("overview"); await openMenu();
  const head1 = await text("#nav .v2g-head");
  ok(w, "the switcher line moves to RMF strategy", /next RMF strategy Dec 15 · 0 of 1 ready/.test(head1 || ""), head1);
  if (w < 600) { await p.keyboard.press("Escape"); await go("overview"); }
  ok(w, "the Overview strip moves to RMF strategy", /Next: RMF strategy in 28 days/.test(await text("#main .v2g-ovs") || ""));
  await go("review-queue");
  const all1 = await text("#main .ak-tabs .ak-tab .ct");
  ok(w, "the queue drops PDR and counts one fewer", !(await p.$('#main tr[data-id="pdr-2"]')) && +String(all1).replace(/\D/g, "") === +String(all0).replace(/\D/g, "") - 1, `${all0} → ${all1}`);
  const rail = await p.evaluate(() => { const b = document.querySelector('#rail a.ri[href="#review-queue"] .ri-b, #bottom a.ri[href="#review-queue"] .ri-b'); return b ? b.textContent.trim() : null; });
  ok(w, "the rail's Review count agrees", rail === all1, `${rail}`);
  await go("my-work");
  ok(w, "My work moves to the RMF strategy memo", /Due for RMF strategy · Dec 15/.test(await text("#main") || "") && !/Due for PDR/.test(await text("#main") || ""));
  const mwc = await p.evaluate(() => [...document.querySelectorAll("#main .a-work-mwg")].reduce((a, g) => a + g.querySelectorAll(".a-work-mw").length, 0));
  const mwb = await p.evaluate(() => { const b = document.querySelector('#rail a.ri[href="#my-work"] .ri-b, #bottom a.ri[href="#my-work"] .ri-b'); return b ? +b.textContent.trim() : null; });
  ok(w, "the rail's My work count agrees with its rows", mwc === mwb, `${mwc} rows, badge ${mwb}`);

  // Request decision on the next step: it joins the queue.
  await go("lifecycle-strat-2");
  await p.click('#main [data-modal="v2g-request"]'); await p.waitForTimeout(300);
  await p.click('#modal .dlg-f [data-v2k="v2g-request"]'); await p.waitForTimeout(500);
  ok(w, "Request decision puts RMF strategy in review", /In review/.test(await text("#main .ak-rh") || ""));
  await go("review-queue");
  ok(w, "the queue lists the RMF strategy, waiting on the ISSM", /AO approval of the RMF strategy · Increment 2/.test(await text("#main") || "") && /Joel Barrantes/.test(await text('#main tr[data-id="strat-2"]') || ""));
  // Programs and Home carry the stage.
  await go("portfolio");
  ok(w, "Programs: WS-X90's line has its stage and host", /Increment 2 · TMRR · next RMF strategy Dec 15/.test(await text("#main") || ""));
  ok(w, "Programs: an archived program shows its archive stage", /EMD · next CDR Dec 12, 2025/.test(await text("#main") || ""));
  ok(w, "no sideways scroll on Programs", !(await sideways()));
  await go("home");
  ok(w, "Home: WS-X90's card has its stage line", /Increment 2 · TMRR · next RMF strategy Dec 15/.test(await text("#main .grid3") || ""));
  await go("schedule");
  ok(w, "Schedule holds tasks only", !(await p.$("#main .a-work-gate")) && /Lifecycle/.test(await text("#main .a-work-lifeln") || ""));
  ok(w, "no page errors", !errors.length, errors.slice(0, 2).join(" | "));
  await ctx.close();
}
console.log(fails ? `${fails} checks failed` : "every check passed");
await b.close();
