// F's walk of prototype v2: node walk.mjs <build.html> — the requirement's chain on the Requirements page, and each fix of the
// re-review (v2/R/review.json). Each step asserts what a reader would see. Writes walk.log beside this file.
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const html = path.resolve(process.argv[2] || "out/v2-F.html");
const here = path.dirname(new URL(import.meta.url).pathname);
const lines = []; let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { lines.push(`${cond ? "PASS" : "FAIL"}  ${label}${detail ? "  · " + String(detail).replace(/\s+/g, " ").slice(0, 220) : ""}`); cond ? pass++ : fail++; };
const b = await chromium.launch();

async function session(width) {
  const p = await b.newPage({ viewport: { width, height: width > 600 ? 900 : 844 } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto("file://" + html + "#home"); await p.waitForTimeout(500);
  await p.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} });
  await p.reload(); await p.waitForTimeout(500);
  const H = {
    wait: (ms = 400) => p.waitForTimeout(ms),
    go: async (r) => { await p.evaluate((x) => { location.hash = x; }, r); await p.waitForTimeout(500); },
    fresh: async (r) => { await p.evaluate(() => { location.hash = "home"; }); await p.waitForTimeout(250); await p.evaluate((x) => { location.hash = x; }, r); await p.waitForTimeout(550); },
    hash: () => p.evaluate(() => location.hash.slice(1)),
    main: () => p.evaluate(() => document.getElementById("main").innerText.replace(/\s+/g, " ")),
    panel: () => p.evaluate(() => { const x = document.getElementById("panel"); return x.hidden ? "" : x.innerText.replace(/\s+/g, " "); }),
    modal: () => p.evaluate(() => { const x = document.getElementById("modal"); return x.hidden ? "" : x.innerText.replace(/\s+/g, " "); }),
    toast: () => p.evaluate(() => { const t = document.getElementById("v2-toast"); return t && !t.hidden ? t.innerText.replace(/\s+/g, " ") : ""; }),
    errs: () => p.evaluate(() => [...document.querySelectorAll("#modal .v2k-err")].map((e) => e.textContent).join(" | ")),
    qv: () => p.$$eval("#main .qv", (q) => q.map((x) => x.textContent.replace(/\s+/g, " ").trim()).join(" | ")),
    qvOn: () => p.$$eval("#main .qv.on, #main .qv[aria-pressed=true]", (q) => q.map((x) => x.textContent.replace(/\s+/g, " ").trim()).join(" | ")),
    vis: () => p.$$eval("#main tbody tr", (t) => t.filter((r) => !r.hidden && r.offsetParent).map((r) => r.textContent.replace(/\s+/g, " ").trim())),
    prim: async () => { await p.click("#modal .dlg-f .btn.ink"); await p.waitForTimeout(450); },
    sideways: () => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 || document.getElementById("main").scrollWidth > document.getElementById("main").clientWidth + 1),
    arrow: () => p.evaluate(() => !!document.querySelector('#panel:not([hidden]) .bar-top button[aria-label="Open the full record"]')),
  };
  return { p, errs, H };
}
const row = async (p, H, route, id) => { await H.fresh(route); await p.click(`#main tr[data-id="${id}"]`); await H.wait(450); };

// ════════ 1440 ════════
lines.push("=== 1440px ===");
{
  const { p, errs, H } = await session(1440);
  // ——— The requirement's chain is a component of its preview ———
  await row(p, H, "requirements", "REQ-008");
  let pv = await H.panel();
  ok("Requirement preview carries one Chain card with six counted stages", /Chain/.test(pv) && /Controls mapped 2/.test(pv) && /Allocated to 2/.test(pv) && /Evidence 0/.test(pv) && /Findings 1/.test(pv) && /Risks 1/.test(pv) && /Remediation 1/.test(pv), pv.slice(0, 200));
  ok("No ↗ on a requirement's preview", !(await H.arrow()));
  ok("Map control and Link evidence stay in its header", (await p.$('#panel .ak-rh [data-modal="v7p-map"]')) !== null && (await p.$('#panel .ak-rh [data-modal="v7p-link-ev"]')) !== null);
  await p.click('#panel .v2f-li[data-panel="a-risk-risk"]'); await H.wait(400);
  ok("A risk in the chain opens the risk's own preview", /Risk preview/.test(await H.panel()) && /Risk arising from REQ-008/.test(await H.panel()), (await H.panel()).slice(0, 80));
  await row(p, H, "requirements", "REQ-008");
  await p.click('#panel .v2f-li[data-panel="a-tests-control"]'); await H.wait(400);
  ok("A control in the chain opens the control's preview", /Control preview/.test(await H.panel()) && /AC-11/.test(await H.panel()));
  await row(p, H, "requirements", "REQ-599");
  await p.click('#panel .v2f-li[data-panel="a-docs-ev"]'); await H.wait(400);
  ok("Evidence the register lists opens its own preview (REQ-599's, Needs revision)", /Non-privileged authentication method inventory/.test(await H.panel()) && /Needs revision/.test(await H.panel()));
  await H.go("rec--v7p-req--REQ-439"); await H.wait(400);
  ok("The old requirement page's address opens the Requirements page with the preview open", (await H.hash()) === "requirements" && /Requirement preview/.test(await H.panel()) && /REQ-439/.test(await H.panel()), await H.hash());
  // ——— Map control and Link evidence, wired ———
  await row(p, H, "requirements", "REQ-004");
  await p.click('#panel [data-modal="v7p-map"]'); await H.wait(300);
  await H.prim();
  ok("Map control names its missing Control", /Control is required/.test(await H.errs()), await H.errs());
  await p.selectOption('#modal select[name="ctl"]', "AC-4(21)"); await H.prim();
  ok("Map control maps it: the toast says what moved", /REQ-004 maps AC-4\(21\)/.test(await H.toast()) && /No evidence now/.test(await H.toast()), await H.toast());
  ok("…the chain lists AC-4(21), mapped today", /AC-4\(21\) Physical or Logical Separation of Information Flows No evidence · mapped today/.test(await H.panel()), (await H.panel()).match(/Controls mapped[^A]*A[^·]*/)?.[0]);
  ok("…and the register's row lists it", /AC-5 AC-4\(21\)/.test(await p.$eval('#main tr[data-id="REQ-004"]', (t) => t.innerText.replace(/\s+/g, " "))));
  const noev0 = (await H.qv()).match(/Cite no evidence (\d+)/)?.[1];
  await p.click('#panel [data-modal="v7p-link-ev"]'); await H.wait(300);
  await p.selectOption('#modal select[name="ev"]', "ev-crdr"); await H.prim();
  ok("Link evidence links it; AC-4(21) waits on an assessor", /Evidence linked to REQ-004: AC-4\(21\) waits on an assessor/.test(await H.toast()), await H.toast());
  ok("…Cite no evidence drops by one", +((await H.qv()).match(/Cite no evidence (\d+)/)?.[1]) === +noev0 - 1, `${noev0} → ${(await H.qv()).match(/Cite no evidence (\d+)/)?.[1]}`);
  ok("…the chain's Evidence stage lists it, pending review", /Evidence 1 Cyber resiliency design review record, Block 1 Pending review/.test(await H.panel()));
  await H.fresh("controls");
  await p.evaluate(() => { const el = document.createElement("span"); el.hidden = true; el.dataset.panel = "a-tests-control"; el.dataset.id = "AC-4(21)"; document.getElementById("main").appendChild(el); el.click(); }); await H.wait(400);
  ok("AC-4(21)'s own preview lists REQ-004 (one source for the mapping)", /REQ-004/.test(await H.panel()) && /Not assessed/.test(await H.panel()), (await H.panel()).slice(0, 160));
  await H.fresh("traceability-noev");
  ok("Traceability's No evidence counts it too", new RegExp(`No evidence\\s*${+noev0 - 1}`).test(await H.main()), (await H.main()).match(/No evidence\s*\d+/)?.[0]);
  // ——— Evidence: accept, send back, upload ———
  await H.fresh("evidence");
  await p.click('#main tr[data-panel="a-docs-ev"]'); await H.wait(400);
  await p.locator('#panel [data-modal="a-docs-review"]', { hasText: "Accept" }).first().click(); await H.wait(300);
  await H.prim();
  ok("Accept saves the review (no wrongly required field)", /^Accepted: /.test(await H.toast()) && !(await H.modal()), await H.toast());
  ok("…Pending review 87, Accepted 227", /Pending review 87/.test(await H.qv()) && /Accepted 227/.test(await H.qv()), await H.qv());
  await H.fresh("evidence");
  await p.locator('#main tr[data-panel="a-docs-ev"]').nth(1).click(); await H.wait(400);
  await p.locator('#panel [data-modal="a-docs-review"]', { hasText: "Send back" }).first().click(); await H.wait(300);
  await H.prim();
  ok("Send back requires What to revise, and only then", /What to revise is required/.test(await H.errs()), await H.errs());
  await p.fill('#modal textarea[name="why"]', "Add the alert log for the injected offset."); await H.prim();
  ok("…then Needs revision 55", /Needs revision 55/.test(await H.qv()), await H.qv());
  await H.fresh("evidence");
  await p.locator("#main .ph button", { hasText: "Add evidence" }).first().click(); await H.wait(200);
  await p.locator("[role=menuitem][data-modal='a-docs-upload'][data-id='upload|']:visible").first().click(); await H.wait(300);
  await H.prim();
  ok("Upload with no file says File is required and stays open", /File is required/.test(await H.errs()) && !!(await H.modal()), await H.errs());
  await p.setInputFiles("#modal input[type=file]", { name: "alert-log-export.csv", mimeType: "text/csv", buffer: Buffer.from("a,b\n1,2\n") });
  await H.prim();
  ok("With a file it is added, pending review: All 369", /Added, pending review: alert log export/.test(await H.toast()) && /All 369/.test(await H.qv()), await H.qv());
  // ——— The registers' own create verbs ———
  await H.fresh("poam");
  await p.click('#main .ph [data-modal="a-risk-poam-new"]'); await H.wait(300);
  await H.prim();
  ok("POA&M's Create POA&M item names Answers and Title", /Answers is required/.test(await H.errs()) && /Title is required/.test(await H.errs()), await H.errs());
  const iss = await p.$eval('#modal select[name="issue"] option:nth-child(2)', (o) => o.value);
  await p.selectOption('#modal select[name="issue"]', iss); await p.fill('#modal input[name="title"]', "Close the gap the issue names"); await H.prim();
  ok("…creates the item: Items 42", /POA&M item created/.test(await H.toast()) && /Items 42/.test(await H.main()), await H.toast());
  await H.fresh("risks");
  await p.click('#main .ph [data-modal="a-risk-new-risk"]'); await H.wait(300);
  await p.fill('#modal input[name="title"]', "Unsigned firmware reaches a fielded unit"); await H.prim();
  ok("Risks' Create risk creates it: Register 41", /Risk created/.test(await H.toast()) && /Register\s*41/.test(await H.main()), await H.toast());
  await H.fresh("schedule");
  await p.click('#main .ph [data-modal="a-work-task-new"]'); await H.wait(300);
  await p.fill('#modal input[name="title"]', "Collect the alert log export"); await H.prim();
  ok("Schedule's Create task creates it: All 15, Open 11", /Task created/.test(await H.toast()) && /All 15/.test(await H.main()) && /Open 11/.test(await H.main()), await H.toast());
  await H.fresh("control-si2");
  await p.click('#main [data-modal="a-tests-addev"]'); await H.wait(300);
  await H.prim();
  ok("SI-2's Add evidence needs a file", /File is required/.test(await H.errs()), await H.errs());
  await p.setInputFiles("#modal input[type=file]", { name: "openssh-9.8p1-update.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
  await H.prim();
  await H.fresh("control-si2-evidence");
  ok("…then its Evidence tab lists 2, the new one pending review", (await H.vis()).length === 2 && /Evidence\s*2/.test(await p.$eval("#main [role=tablist]", (t) => t.innerText)), (await H.vis()).length);
  await row(p, H, "requirements", "REQ-064");
  ok("…and REQ-064's chain lists the same version (one source)", /openssh-server 9.8p1 update record/.test(await H.panel()));
  await H.fresh("assessments");
  await p.click('#main [data-modal="a-tests-plan"]'); await H.wait(300);
  await H.prim();
  ok("The CVI card's Plan an assessment gives it its first plan", /has its first plan/.test(await H.toast()), await H.toast());
  ok("…and the card now opens its campaign", (await p.$('#main .a-tests-camp [data-go^="campaign-new-"]')) !== null);
  // ——— My work's Treat 2 critical risks ———
  await H.fresh("my-work");
  for (const r of await p.$$("#main a.a-work-mw")) if ((await r.textContent()).includes("Treat 2 critical")) { await r.click(); break; }
  await H.wait(800);
  const tr2 = await H.vis();
  ok("Treat 2 critical risks lands on exactly the 2 critical risks, with the filter shown", (await H.hash()) === "risks" && tr2.length === 2 && tr2.every((x) => /Critical/.test(x)) && /Severity: Critical/.test(await p.$eval("#main .a-risk-tools", (t) => t.innerText)), tr2.length);
  ok("…the pager counts them", /1–2 of 2/.test(await p.$eval("#main .pager", (x) => x.innerText)));
  await p.click("#main [data-arsevclr]"); await H.wait(300);
  ok("…and removing the chip lists the register again", (await H.vis()).length > 2);
  // ——— Preview actions that did nothing ———
  await H.fresh("lifecycle");
  await p.click('#main .v2g-row [data-panel="a-work-gate"][data-id="pdr-2"]'); await H.wait(400);
  await p.click('#panel [data-modal="v2f-outcomes"]'); await H.wait(300);
  await p.check('#modal input[name="oc-AR.1"]'); await H.prim();
  ok("Add security outcomes adds AR.1 to PDR's criteria (5), from Lifecycle", /Criteria\s*2 of 5 met/.test(await H.panel()) && /AR\.1/.test(await H.panel()), (await H.panel()).match(/Criteria\s*\d+ of \d+ met/)?.[0]);
  await H.fresh("inheritance");
  await p.click('#main tr[data-panel="v7a-src"]'); await H.wait(400);
  await p.click("#panel [data-v2f-ask]"); await H.wait(400);
  ok("Ask Priya Raghavan records the ask", /Asked on Nov 17/.test(await H.panel()) && /Priya Raghavan/.test(await H.toast()));
  await H.fresh("inventory");
  await p.click('#main tr[data-panel="sys-asset"]'); await H.wait(400);
  await p.click('#panel [data-modal="v2f-asset"]'); await H.wait(300);
  await p.fill('#modal input[name="serial"]', "SN-4471-A"); await H.prim();
  ok("Edit asset saves the serial number into the preview", /Serial number SN-4471-A/.test(await H.panel()));
  await H.fresh("program-start");
  await p.click('#main [data-modal="pn-invite"]'); await H.wait(300);
  await p.fill("#pn-iv-mail", "ana@customer-d.mil"); await p.click('#modal [data-pn="iv-ok"]'); await H.wait(400);
  ok("Invite people on the example page says nothing is kept", /Not saved: invitations are kept for a program created in this session/.test(await H.toast()), await H.toast());
  // ——— The launcher ———
  await p.keyboard.press("Meta+k"); await H.wait(300);
  await p.fill("#v8w-k-q", "which controls lack evidence?"); await H.wait(300);
  const kAns = await p.$eval(".v8w-k-list", (l) => l.innerText.replace(/\s+/g, " ")), kN = (kAns.match(/Answer 1 (\d+) controls have no evidence yet/) || [])[1];
  ok("The launcher answers which controls lack evidence", !!kN, kAns.slice(0, 120));
  await p.keyboard.press("Enter"); await H.wait(700);
  ok("…and its answer opens Controls on Needs evidence", (await H.hash()) === "controls" && /^Needs evidence/.test(await H.qvOn()), await H.qvOn());
  ok("…which counts the same number", !!kN && new RegExp("Needs evidence\\D*" + kN + "\\b").test(await H.qvOn()), (await H.qvOn()) + " vs " + kN);
  ok("…whose rows all read No evidence", (await H.vis()).every((x) => /No evidence/.test(x)));
  await p.keyboard.press("Meta+k"); await H.wait(300);
  await p.fill("#v8w-k-q", "why is the boundary drawn this way?"); await H.wait(300);
  ok("A question it cannot answer points at AI agents", /Ask AI agents/.test(await p.$eval(".v8w-k-list", (l) => l.innerText)));
  await p.keyboard.press("Escape"); await H.wait(200);
  // ——— Gadgets, type, tone ———
  const bars = async (r, sel) => { await H.fresh(r); return p.$$eval(`#main tbody ${sel}`, (x) => x.length); };
  ok("Components rows carry no mini bars", (await bars("components", ".v7o-mbar, .ak-donut")) === 0);
  ok("POA&M rows carry no bars", (await bars("poam", ".bar, .a-risk-prog, .ak-donut")) === 0);
  ok("Suppliers rows carry no rings", (await bars("suppliers", ".ak-donut, .ak-prog")) === 0);
  for (const r of ["plan-cp", "checks", "overview"]) {
    await H.fresh(r);
    const n = await p.evaluate(() => { const root = document.getElementById("main"), R = root.getBoundingClientRect(), s = new Set(); for (const el of root.querySelectorAll("*")) { if (!el.getClientRects().length || ![...el.childNodes].some((x) => x.nodeType === 3 && x.nodeValue.trim())) continue; const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue; const b = el.getBoundingClientRect(); if (!b.width || !b.height || !(b.top < innerHeight && b.bottom > Math.max(0, R.top))) continue; s.add(`${parseFloat(cs.fontSize)}/${cs.fontWeight}`); } return s.size; });
    ok(`${r}: 8 or fewer type pairs above the fold`, n <= 8, n);
  }
  await H.fresh("itcsc");
  ok("ITCSC prints no red sentence", await p.evaluate(() => [...document.querySelectorAll("#main .v8b-flag")].every((x) => getComputedStyle(x).color !== getComputedStyle(document.querySelector(".pill.bad, .bad") || document.body).color)));
  ok("1440 no page errors", !errs.length, errs.join(" | "));
  await p.close();
}

// ════════ 390 ════════
lines.push("\n=== 390px ===");
{
  const { p, errs, H } = await session(390);
  await H.go("requirements");
  ok("390 Requirements has no sideways scroll", !(await H.sideways()));
  await p.click('#main tr[data-id="REQ-599"]'); await H.wait(500);
  ok("390 the requirement preview holds its chain", /Chain/.test(await H.panel()) && /Controls mapped 1/.test(await H.panel()));
  ok("390 the chain fits the panel (no sideways scroll inside it)", await p.evaluate(() => { const c = document.querySelector("#panel .v2f-chain"); return !!c && c.scrollWidth <= c.clientWidth + 1; }));
  await H.go("rec--v7p-req--REQ-001"); await H.wait(500);
  ok("390 the old address opens the preview on Requirements", (await H.hash()) === "requirements" && /REQ-001/.test(await H.panel()));
  for (const r of ["evidence", "poam", "risks", "schedule", "components", "suppliers", "controls", "control-si2-evidence", "assessments", "itcsc", "traceability", "checks", "overview"]) {
    await H.fresh(r);
    ok(`390 ${r} has no sideways scroll`, !(await H.sideways()));
  }
  await H.fresh("my-work");
  for (const r of await p.$$("#main a.a-work-mw")) if ((await r.textContent()).includes("Treat 2 critical")) { await r.click(); break; }
  await H.wait(800);
  ok("390 Treat 2 critical risks keeps the 2, with the chip", (await H.vis()).length === 2 && /Severity: Critical/.test(await H.main()));
  ok("390 no page errors", !errs.length, errs.join(" | "));
  await p.close();
}
await b.close();
lines.unshift(`F walk · ${new Date().toISOString()} · ${html}\n${pass} passed, ${fail} failed`);
fs.writeFileSync(path.join(here, "walk.log"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
