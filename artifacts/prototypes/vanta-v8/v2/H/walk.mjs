// Agent H's walk: node walk.mjs <build.html> — clicks through the host systems, providers and boundary work at 1440 and 390.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2];
if (!build) { console.error("usage: node walk.mjs <build.html>"); process.exit(2); }
const results = [];
const ok = (name, cond, info = "") => { results.push([cond ? "PASS" : "FAIL", name, info]); };
const b = await chromium.launch();
for (const W of [1440, 390]) {
  const p = await b.newPage({ viewport: { width: W, height: W > 600 ? 900 : 844 } });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(450); };
  const txt = (sel) => p.evaluate((s) => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, " ").trim() : ""; }, sel);
  const side = () => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const panelLabel = () => p.evaluate(() => { const x = document.querySelector("#panel:not([hidden]) .bar-top span"); return x ? x.textContent : ""; });
  const closePanel = async () => { const x = await p.$("#closePanel"); if (x) { await x.click(); await p.waitForTimeout(200); } };
  await p.goto("file://" + build + "#home"); await p.waitForTimeout(700);
  await p.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} PA.v2.reset(); });
  await p.waitForTimeout(300);
  const T = (n) => `${W} ${n}`;

  // ——— Boundary ———
  await go("boundary");
  ok(T("boundary: bubble drawn"), !!(await p.$(".v2h-bd .v2h-bub")));
  ok(T("boundary: six subsystems inside"), (await p.$$(".v2h-el")).length === 6);
  ok(T("boundary: ATO caption"), /ATO · Increment 1 · Block 1/.test(await txt(".v2h-cap")) && /Sep 18, 2026/.test(await txt(".v2h-cap")));
  ok(T("boundary: host and facility outside"), /F-16 Block 70/.test(await txt(".v2h-bd")) && /Squadron operations facility/.test(await txt(".v2h-bd")));
  ok(T("boundary: interconnections outside"), (await p.$$(".v2h-ic")).length >= 9, String((await p.$$(".v2h-ic")).length));
  ok(T("boundary: no sideways scroll"), (await side()) <= 0);
  await p.click(".v2h-el[data-id='CN-109004']"); await p.waitForTimeout(300);
  ok(T("boundary: subsystem opens the element preview"), /Element preview/.test(await panelLabel()), await panelLabel());
  await closePanel();
  await p.click(".v2h-lb[data-id='f16']"); await p.waitForTimeout(300);
  ok(T("boundary: host opens its preview"), /Host system preview/.test(await panelLabel()), await panelLabel());
  await p.click('#panel button[aria-label="Open the full record"]'); await p.waitForTimeout(500);
  ok(T("host preview ↗ opens F-16 Block 70's page"), (await p.evaluate(() => location.hash)) === "#rec--v2h-prov--f16" && /F-16 Block 70/.test(await txt(".ak-title")));
  ok(T("F-16 page: offered controls 16, carries 2"), /Offered controls\s*16/.test(await txt(".ak-tabs")) && /Carries\s*2/.test(await txt(".ak-tabs")), await txt(".ak-tabs"));
  await go("rec--v2h-prov--f16|carries");
  ok(T("F-16 page: carries WS-X90 and Customer A"), /WS-X90 Sentinel Mission System/.test(await txt("#main")) && /Customer A · X800 Rail Integration/.test(await txt("#main")));
  await go("boundary");
  await p.click("[data-v2h-auth='iatt']"); await p.waitForTimeout(350);
  ok(T("boundary: IATT shows the test configuration"), /IATT · Increment 2 test configuration/.test(await txt(".v2h-cap")) && !!(await p.$(".v2h-el[data-id='fti']")) && !!(await p.$(".v2h-ic[data-id='range']")));
  ok(T("boundary: IATT counts Block 1.1 changes"), /change in Block 1.1/.test(await txt(".v2h-bd")));
  await p.click(".v2h-el[data-id='fti']"); await p.waitForTimeout(300);
  ok(T("boundary: flight test instrumentation opens its preview"), /Boundary preview/.test(await panelLabel()));
  await closePanel();
  await p.click("[data-v2h-auth='ato']"); await p.waitForTimeout(300);

  // ——— Host & providers, and one number everywhere ———
  await go("hosts");
  ok(T("hosts: three providers"), (await p.$$(".v2h-provs tbody tr")).length === 3);
  ok(T("hosts: Inherited 52 · Hybrid 24"), /Inherited\s*52/.test(await txt(".views")) && /Hybrid\s*24/.test(await txt(".views")), await txt(".views"));
  ok(T("hosts: no sideways scroll"), (await side()) <= 0);
  const satOf = async () => { await go("overview"); const t = await txt(".v2-ov-comp"); const m = t.match(/(\d+) of 560 controls/); return m ? +m[1] : null; };
  ok(T("overview: 227 of 560 · 52 inherited"), (await satOf()) === 227 && /52 inherited/.test(await txt(".v2-ov-comp")));
  ok(T("overview: Host system fact"), /Host system\s*F-16 Block 70/.test(await txt(".v2-ov-rail")));
  await go("hosts");
  await p.click("tr[data-id='PE-13'] [data-v2h-sel]"); await p.waitForTimeout(250);
  ok(T("hosts: choosing a row shows the selection bar"), /1 chosen/.test(await txt(".v2h-bulk")));
  await p.click(".v2h-bulk [data-modal='v2h-resp']"); await p.waitForTimeout(300);
  ok(T("Change responsibility opens"), /Change responsibility of PE-13/.test(await txt("#modal .dlg-h")));
  await p.click("#modal input[name='kind'][value='System-specific']"); await p.waitForTimeout(100);
  ok(T("dialog says what changes"), /PE-13 reads No evidence/.test(await txt("#modal .v2h-what")) && /226/.test(await txt("#modal .v2h-what")), await txt("#modal .v2h-what"));
  await p.click('#modal [data-v2k="v2h-resp"]'); await p.waitForTimeout(250);
  ok(T("reason is required"), /Reason is required/.test(await txt("#modal")));
  await p.fill("#modal textarea[name='reason']", "Fire protection of the pod bay is ours in the Block 1.1 design.");
  await p.click('#modal [data-v2k="v2h-resp"]'); await p.waitForTimeout(500);
  ok(T("change applied: toast"), /PE-13 is now system-specific/.test(await txt("#v2-toast")), await txt("#v2-toast"));
  ok(T("hosts: Taken back 1"), /Taken back\s*1/.test(await txt(".views")) && /Inherited\s*51/.test(await txt(".views")));
  ok(T("overview follows: 226"), (await satOf()) === 226);
  await go("controls");
  ok(T("controls follow: 226 satisfied, 51 inherited"), /226 controls satisfied/.test(await txt(".a-tests-cards")) && /51 inherited/.test(await txt(".a-tests-cards")), await txt(".a-tests-cards"));
  await go("home");
  ok(T("home follows: 226 of 560"), /226 of 560 controls satisfied/.test(await txt("#main")));
  await go("portfolio");
  ok(T("Programs follows: 226 of 560"), /226 of 560/.test(await txt("#main")));
  await go("rec--a-tests-control--PE-13");
  ok(T("PE-13's page: System-specific, No evidence"), /System-specific/.test(await txt(".ak-facts")) && /No evidence/.test(await txt(".ak-facts")), await txt(".ak-facts"));
  // Back to inherited from its ⋯
  await p.click(".v2r-more summary"); await p.waitForTimeout(150);
  await p.click(".v2r-menu [data-modal='v2h-resp']"); await p.waitForTimeout(300);
  await p.click("#modal input[name='kind'][value='Inherited']"); await p.fill("#modal textarea[name='reason']", "Back to the host's offer.");
  await p.click('#modal [data-v2k="v2h-resp"]'); await p.waitForTimeout(500);
  ok(T("PE-13 inherited again"), /Inherited from/.test(await txt(".ak-facts")) && /Satisfied/.test(await txt(".ak-facts")));
  ok(T("overview back to 227"), (await satOf()) === 227);

  // ——— Controls: Responsibility column and filter, the preview ———
  await go("controls");
  ok(T("controls: Responsibility column"), /Responsibility/.test(await txt("#main thead")));
  await p.click(".a-tests-respf summary"); await p.waitForTimeout(150);
  await p.click("[data-atresp='inh']"); await p.waitForTimeout(350);
  ok(T("controls: Inherited filter lists 52"), /1–25 of 52/.test(await txt("#main .pager")), await txt("#main .pager"));
  await p.click("#main tbody tr[data-id='AT-2']"); await p.waitForTimeout(300);
  ok(T("control preview: Inherited from the facility"), /Inherited from\s*Squadron operations facility/.test(await txt("#panel")), (await txt("#panel")).slice(0, 200));
  await closePanel();
  await p.click(".a-tests-respf summary"); await p.waitForTimeout(150);
  await p.click("[data-atresp='all']"); await p.waitForTimeout(300);

  // ——— Add provider ———
  await go("hosts");
  await p.click("[data-modal='v2h-add']"); await p.waitForTimeout(300);
  ok(T("Add provider opens"), /Add provider/.test(await txt("#modal .dlg-h")));
  await p.click("#modal input[name='prov'][value='cssp']"); await p.waitForTimeout(150);
  ok(T("Add provider says what it offers"), /inherited by default/.test(await txt("#modal .v2h-addbox")));
  await p.click('#modal [data-v2k="v2h-add"]'); await p.waitForTimeout(500);
  ok(T("CSSP added"), /Cybersecurity service provider \(CSSP\) added/.test(await txt("#v2-toast")) && (await p.$$(".v2h-provs tbody tr")).length === 4, await txt("#v2-toast"));
  ok(T("overview: AU-6 inherited from the CSSP lifts it to 228"), (await satOf()) === 228);

  // ——— SSP editor, SCTM, Authorization, Inheritance, Settings ———
  await go("authorization");
  ok(T("authorization: what it covers"), /What it covers/.test(await txt("#main")) && !!(await p.$("#main [data-go='boundary']")));
  await go("inheritance");
  ok(T("inheritance: the host is a source"), /F-16 Block 70/.test(await txt("#main tbody")));
  await go("common-controls");
  ok(T("settings: host systems listed"), /F-16 Block 70/.test(await txt("#main")) && /C-130J/.test(await txt("#main")));
  // A program created with a host: its Boundary and Host & providers
  await p.evaluate(() => { PA.v2.set("prog.made", [{ code: "PRG-2301", name: "Customer D · X800 Palletized Launch Integration", host: "c130j", hostTake: { offered: 8, inherited: 6, hybrid: 2 }, systems: [{ code: "X800-C-CUSD", name: "X800 Missile · Palletized Launch · Customer D" }], total: 370, start: "product" }]); PA.v2.set("prog.cur", "PRG-2301"); });
  await go("boundary");
  ok(T("created program: Boundary shows its host"), /C-130J/.test(await txt("#main")) && /X800 Missile · Palletized Launch · Customer D/.test(await txt("#main")));
  await go("hosts");
  ok(T("created program: Host & providers shows C-130J"), /C-130J/.test(await txt("#main")) && /Inherited/.test(await txt("#main")));
  await p.evaluate(() => { PA.v2.reset(); });
  await go("program-new-systems");
  ok(T("Create program: host asked"), /Host system/.test(await txt("#main")) && /offers \d+ controls/.test(await txt("#main")));
  ok(T("no page errors"), errs.length === 0, errs.slice(0, 3).join(" | "));
  await p.close();
}
await b.close();
const fails = results.filter((r) => r[0] === "FAIL");
for (const r of results) console.log(r.join(" · "));
console.log(`\n${results.length - fails.length}/${results.length} passed`);
process.exit(fails.length ? 1 : 0);
