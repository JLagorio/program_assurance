// C1's walk: the assurance chain from SA-24 with nothing to the authorizing official's decision, the dialog guard, the record
// pages behind ↗, the preview actions and the counts. node walk.mjs <build.html> [width]  →  prints PASS/FAIL lines; writes walk-log.json
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const html = process.argv[2], W = +(process.argv[3] || 1440);
const file = "file://" + path.resolve(html);
const here = path.dirname(new URL(import.meta.url).pathname);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: W > 600 ? 900 : 844 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
const log = []; const ok = (name, cond, extra = "") => { log.push({ name, pass: !!cond, extra: String(extra).slice(0, 300) }); console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " · " + String(extra).slice(0, 200) : ""}`); };
const wait = (ms = 350) => p.waitForTimeout(ms);
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await wait(450); };
const mainText = () => p.evaluate(() => document.getElementById("main").innerText.replace(/\s+/g, " "));
const panelText = () => p.evaluate(() => { const x = document.getElementById("panel"); return x.hidden ? "" : x.innerText.replace(/\s+/g, " "); });
const modalOpen = () => p.evaluate(() => !document.getElementById("modal").hidden);
const toast = () => p.evaluate(() => { const t = document.getElementById("v2-toast"); return t && !t.hidden ? t.innerText.replace(/\s+/g, " ") : ""; });
const row = (code) => p.evaluate((c) => { const tr = document.querySelector(`#main tr[data-id="${c}"]`); return tr ? tr.innerText.replace(/\s+/g, " ") : ""; }, code);
const qv = () => p.evaluate(() => [...document.querySelectorAll("#main .qv")].map((e) => e.innerText.replace(/\s+/g, " ").trim()).join(" | "));
const clickIn = async (where, text) => { const loc = p.locator(`${where} :is(button, .btn, [role=button], [role=link], .ak-link)`, { hasText: text }).first(); await loc.scrollIntoViewIfNeeded().catch(() => {}); await loc.click(); await wait(); };
const primary = async (key) => { await p.click(`#modal [data-v2k="${key}"]`); await wait(450); };
const ovRow = (label) => p.evaluate((l) => { const r = [...document.querySelectorAll("#main .v2-ov-li")].find((x) => x.innerText.includes(l)); return r ? r.innerText.replace(/\s+/g, " ") : ""; }, label);
const hide = async () => { await p.evaluate(() => { const t = document.getElementById("v2-toast"); if (t) t.hidden = true; }); };

await p.goto(file + "#home"); await wait(600);
await p.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} });
await p.goto(file + "#controls"); await wait(600);

// ——— 1. SA-24 starts with nothing ———
ok("Controls: SA-24 reads No requirement, next Map a requirement", /No requirement .*Map a requirement/.test(await row("SA-24")), await row("SA-24"));
const qv0 = await qv();
ok("Controls: quick views count the baseline", /Needs evidence 185/.test(qv0) && /Not assessed 86/.test(qv0), qv0);
// The header's Map a requirement asks which control
await clickIn("#main .ph", "Map a requirement");
ok("Header Map a requirement opens its dialog with a Control choice", (await modalOpen()) && (await p.$('#modal select[name="ctl"]')) !== null);
await primary("map");
ok("Empty required fields block the primary and are named", (await modalOpen()) && /Control is required/.test(await p.evaluate(() => document.getElementById("modal").innerText)), await p.evaluate(() => [...document.querySelectorAll("#modal .v2k-err")].map((e) => e.textContent).join(" ")));
await p.click("#modal .dlg-h [data-close-modal]"); await wait();

// ——— 2. Map a requirement from SA-24's preview ———
await p.click('#main tr[data-id="SA-24"]'); await wait();
const pv0 = await panelText();
ok("SA-24 preview lists Requirements, Evidence, Findings and risks, each with its add", /Requirements/.test(pv0) && /Evidence/.test(pv0) && /Findings/.test(pv0) && /Map a requirement/.test(pv0), pv0.slice(0, 200));
await p.click('#panel [data-modal="v2k-map"]'); await wait();
await p.selectOption('#modal select[name="req"]', "REQ-641");
await p.fill('#modal textarea[name="note"]', "REQ-641 is the program's resiliency requirement.");
await primary("map");
ok("Map a requirement closes and says what changed", !(await modalOpen()) && /REQ-641 maps SA-24/.test(await toast()), await toast());
ok("Controls: SA-24 reads No evidence, next Link evidence to REQ-641", /No evidence .*Link evidence to REQ-641/.test(await row("SA-24")), await row("SA-24"));
ok("Controls: Needs evidence counts it", /Needs evidence 186/.test(await qv()), await qv());

// ——— 3. Link evidence ———
await hide();
await p.click('#main tr[data-id="SA-24"]'); await wait();
await p.click('#panel [data-modal="v2k-link"]'); await wait();
await p.selectOption('#modal select[name="ev"]', "ev-crdr");
await primary("link");
ok("Link evidence: SA-24 reads Not assessed, next Add to assessment campaign", /Not assessed .*Add to assessment campaign/.test(await row("SA-24")), await row("SA-24"));
ok("Controls: Not assessed 87", /Not assessed 87/.test(await qv()), await qv());

// ——— 4. Add to assessment campaign ———
await hide();
await p.click('#main tr[data-id="SA-24"]'); await wait();
ok("Preview's primary is the next step: Add to assessment campaign", /Add to assessment campaign/.test(await panelText()));
await p.click('#panel [data-modal="v2k-addcamp"]'); await wait();
await primary("addcamp");
ok("Add to assessment campaign wants a campaign", await modalOpen());
await p.check('#modal input[name="camp"][value="conmon"]'); await primary("addcamp");
ok("Added: the toast names the campaign", /10 objectives of SA-24 added to WS-X90 continuous monitoring/.test(await toast()), await toast());
ok("Controls: SA-24's next step is in the campaign", /Set Ready in the campaign/.test(await row("SA-24")), await row("SA-24"));

// ——— 5. The campaign: Set Ready, Record determination, Publish ———
await go("assessments");
ok("Assessments: the continuous monitoring card counts its request", /Request tracker · 1/.test(await mainText()));
await p.click('#main .btn[data-go="campaign-conmon"]'); await wait(500);
ok("Open campaign opens the continuous monitoring campaign", (await p.evaluate(() => location.hash)) === "#campaign-conmon" && /Evidence for SA-24/.test(await mainText()), await p.evaluate(() => location.hash));
await p.click('#main [data-modal="v2k-ready"][data-id="SA-24"]'); await wait();
await primary("ready");
ok("Set Ready: the request reads Ready", /Evidence for SA-24 .*Ready/.test(await mainText()));
await p.click('#main [data-modal="v2k-det"][data-id="SA-24"]'); await wait();
await p.check('#modal input[name="det"][value="other_than_satisfied"]'); await primary("det");
ok("A determination short of satisfied needs its rationale", (await modalOpen()) && /Rationale is required/.test(await p.evaluate(() => document.getElementById("modal").innerText)));
await p.fill('#modal textarea[name="note"]', "The design review record covers two of the five techniques the parameter names.");
await primary("det");
ok("Determination recorded in the draft", /Judged · draft/.test(await mainText()) && /Other than satisfied/.test(await mainText()));
await go("controls");
ok("A draft decides nothing: SA-24 still Not assessed, next Publish", /Not assessed .*Publish assessment results/.test(await row("SA-24")), await row("SA-24"));
await go("campaign-conmon");
await clickIn("#main .ak-rh", "Publish assessment results");
await primary("publish");
ok("Publish: an operational issue opened", /published: 1 determination, 1 operational issue opened/.test(await toast()), await toast());

// ——— 6. Where the published determination shows ———
await go("controls");
ok("Controls: SA-24 Other than satisfied, next Create POA&M item", /Other than satisfied .*Create POA&M item/.test(await row("SA-24")), await row("SA-24"));
ok("Controls: Short of satisfied 49 and Not assessed 86", /Short of satisfied 49/.test(await qv()) && /Not assessed 86/.test(await qv()), await qv());
await go("findings");
const ftxt = await mainText();
ok("Findings: By issue 45, the SA-24 issue listed first", /By issue 45/.test(ftxt) && /SA-24 Design For Cyber Resiliency judged other than satisfied/.test(ftxt), ftxt.slice(0, 160));
await go("findings-assessment");
ok("Findings › Assessment findings: 314 with SA-24's", /Assessment findings 314/.test(await mainText()) && /SA-24/.test(await mainText()));
await go("overview");
ok("Overview: Operational issues 45", /Operational issues.* 45$/.test(await ovRow("Operational issues")), await ovRow("Operational issues"));

// ——— 7. Create POA&M item from the issue ———
await go("findings");
await p.click('#main tr[data-id="v2k-iss-sa-24"]'); await wait();
ok("Issue preview offers Create POA&M item", /Create POA&M item/.test(await panelText()));
await p.click('#panel [data-modal="v2k-poam"]'); await wait();
await primary("poam");
ok("Create POA&M item: Title is required", (await modalOpen()) && /Title is required/.test(await p.evaluate(() => document.getElementById("modal").innerText)));
await p.fill('#modal input[name="title"]', "Complete the SA-24 design review for the remaining techniques");
await p.selectOption('#modal select[name="owner"]', "Priya Raghavan");
await primary("poam");
ok("POA&M item created, toast links to it", /POA&M item created/.test(await toast()), await toast());
await go("findings");
await p.click('#main tr[data-id="v2k-iss-sa-24"]'); await wait();
ok("Issue preview now offers Open POA&M item instead of Create", /Open POA&M item/.test(await panelText()) && !/Create POA&M item/.test(await panelText()), (await panelText()).slice(0, 220));
await go("poam");
ok("POA&M: Items 42 with the new item", /Items 42/.test(await mainText()) && /Complete the SA-24 design review/.test(await mainText()));

// ——— 8. Create risk from the POA&M item ———
await p.click('#main tr[data-id^="v2k-poam-1"]'); await wait();
ok("POA&M preview shows the risk it carries (none yet) with Create risk", /Risk it carries/.test(await panelText()) && /Create risk/.test(await panelText()), (await panelText()).slice(0, 300));
await p.click('#panel [data-modal="v2k-risk"]'); await wait();
await p.fill('#modal input[name="title"]', "A compromised element takes down the mission because two resiliency techniques are not designed in");
await p.selectOption('#modal select[name="lik"]', "moderate"); await p.selectOption('#modal select[name="imp"]', "high");
await primary("risk");
ok("Risk created", /Risk created/.test(await toast()), await toast());
await go("risks");
ok("Risks: Register 41 with the new risk", /Register 41/.test(await mainText()) && /A compromised element takes down the mission/.test(await mainText()));
await go("poam");
await p.click('#main tr[data-id^="v2k-poam-1"]'); await wait();
ok("POA&M preview names its risk", /A compromised element takes down the mission/.test(await panelText()));

// ——— 9. Request acceptance, the decisions, the AO's decision on the package ———
await go("risks");
await p.click('#main tr[data-id^="v2k-risk-1"]'); await wait();
await p.click('#panel [data-modal="v2k-accept"]'); await wait();
await primary("accept");
ok("Request acceptance: Why accept it is required", (await modalOpen()) && /Why accept it is required/.test(await p.evaluate(() => document.getElementById("modal").innerText)));
await p.fill('#modal textarea[name="reason"]', "Block 1.1 designs the two techniques in; until then the mission accepts the moderate residual risk.");
await primary("accept");
ok("Acceptance requested: step 1 waits on the ISSO", /step 1 waits on Priya Raghavan/.test(await toast()), await toast());
await go("risks");
ok("Risks: Awaiting acceptance 1", /Awaiting acceptance 1/.test(await qv()), await qv());
await go("authorization");
ok("Authorization lists the acceptance at step 1", /Risk acceptances in version 2/.test(await mainText()) && /Step 1 of 3/.test(await mainText()));
for (const step of [1, 2]) {
  await p.click('#main [data-modal="v2k-decide"]'); await wait();
  await p.check('#modal input[name="dec"][value="approve"]'); await primary("decide");
}
ok("Two approvals later the acceptance waits on the AO", /Step 3 of 3/.test(await mainText()), (await mainText()).match(/Step \d of 3[^·]*/)?.[0]);
await p.click('#main [data-modal="v2k-decide"]'); await wait();
ok("The last step is the authorizing official's decision", /authorizing official's decision/i.test(await p.evaluate(() => document.getElementById("dlgTitle").textContent)));
await p.check('#modal input[name="dec"][value="accept"]'); await primary("decide");
ok("The AO accepted: Authorization says so", /Accepted by R\. Calloway/.test(await mainText()), (await mainText()).match(/Accepted by[^.]*/)?.[0]);
ok("Residual risk: Open risks 41, Accepted 1", /Open risks 41/.test(await mainText()) && /Accepted 1/.test(await mainText()));
await go("risks");
ok("Risks: the risk reads Accepted", /A compromised element[^|]*Accepted/.test(await mainText()));
await go("overview");
ok("Overview: Open risks 41 · 1 accepted", /1 accepted 41$/.test(await ovRow("Open risks")), await ovRow("Open risks"));
await go("controls");
await p.click('#main tr[data-id="SA-24"]'); await wait();
const pvEnd = await panelText();
ok("SA-24's preview lists its requirement, evidence, finding, issue, POA&M item and risk", /REQ-641/.test(pvEnd) && /Cyber resiliency design review record/.test(pvEnd) && /Operational issue/.test(pvEnd) && /POA&M item/.test(pvEnd) && /A compromised element/.test(pvEnd), pvEnd.slice(0, 400));

// ——— 10. The package decision: increment 2, SSP 3, Submit, ISSM, AO ———
await go("campaign");
await clickIn("#main .ak-rh", "Publish results");
await primary("inc2");
ok("Increment 2 published from the campaign", /Increment 2 published/.test(await toast()), await toast());
await go("authorization");
await clickIn("#main .ak-rh", "Submit for approval");
ok("Submit waits on SSP 3's approval (C2's state), saying so", /Waits on SSP 3/.test(await p.evaluate(() => document.getElementById("modal").innerText)));
await p.click("#modal .dlg-h [data-close-modal]"); await wait();
await p.evaluate(() => window.PA.v2.set("ssp.rev3.state", "approved")); await go("overview"); await go("authorization");
await clickIn("#main .ak-rh", "Submit for approval");
await primary("submit");
ok("Package version 2 submitted", /submitted/.test(await toast()), await toast());
await clickIn("#main .ak-rh", "Record the ISSM review");
await p.check('#modal input[name="dec"][value="approve"]'); await primary("pkgdecide");
await clickIn("#main .ak-rh", "Record the AO's decision");
await p.check('#modal input[name="dec"][value="atoc"]'); await p.fill('#modal textarea[name="note"]', "Residual risk accepted with the Block 1.1 resiliency commitment."); await primary("pkgdecide");
ok("The AO signed version 2", /signed ATO with conditions on package version 2/.test(await toast()) && /Package version 2 holds the decision in force/.test(await mainText()), await toast());

// ——— 11. The guard on a dialog nobody wired ———
// (Updated by agent F: POA&M's own Create POA&M item is wired now, as the issue preview's is; the guard is walked on Findings'
// Create operational issue, which nobody wired.)
await go("findings");
await p.click('#main .ph [data-modal="v2k-create-issue"]'); await wait();
await p.click("#modal .dlg-f .btn.ink"); await wait();
ok("Unwired Create operational issue: Title blocks the primary", (await modalOpen()) && /Title is required/.test(await p.evaluate(() => document.getElementById("modal").innerText)));
await p.fill("#modal .dlg-b input.v2k-in", "Anything"); await p.click("#modal .dlg-f .btn.ink"); await wait(400);
ok("…then closes with Not saved", !(await modalOpen()) && /Not saved: Create operational issue isn't wired/.test(await toast()), await toast());

// ——— 12. SI-2's Open assessment campaign ———
await go("control-si2");
await clickIn("#main", "Open assessment campaign");
ok("SI-2's Open assessment campaign opens the campaign it names", (await p.evaluate(() => location.hash)) === "#campaign-conmon");

// ——— 13. ↗ opens the record's page ———
await go("controls");
await p.click('#main tr[data-id="AC-1"]'); await wait();
await p.click('#panel .bar-top button[aria-label="Open the full record"]'); await wait(500);
ok("↗ on AC-1's preview opens AC-1's page, in SI-2's shape", (await p.evaluate(() => location.hash)) === "#rec--a-tests-control--AC-1" && /Implementation/.test(await mainText()) && /Where it stands/.test(await mainText()), await p.evaluate(() => location.hash));
await p.locator("#main .ak-tabs [role=tab]", { hasText: "Requirements" }).first().click(); await wait(450);
ok("The control page's tabs are pages: Requirements lists REQ-436", /REQ-436/.test(await mainText()) && /AC-1%7Crequirements/.test(await p.evaluate(() => location.hash)));
await go("risks");
await p.click('#main tr[data-id^="0a21dc94"]'); await wait();
await p.click('#panel .bar-top button[aria-label="Open the full record"]'); await wait(500);
ok("↗ on a risk opens its page with a Details rail", /^#rec--a-risk-risk--0a21dc94/.test(await p.evaluate(() => location.hash)) && /Risk details/.test(await mainText()), await p.evaluate(() => location.hash));
await go("evidence");
await p.click('#main [data-panel="a-docs-ev"]'); await wait();
await p.click('#panel .bar-top button[aria-label="Open the full record"]'); await wait(500);
ok("↗ on evidence still opens its own page (kept)", /^#evidence-page-/.test(await p.evaluate(() => location.hash)), await p.evaluate(() => location.hash));

// ——— 14. Header actions and counts in C1's files ———
await go("checks");
ok("Checks: All counts the checks it lists (7)", /All\s*7/.test(await p.evaluate(() => document.querySelector("#main .a-tests-rail").innerText.replace(/\s+/g, " "))));
await clickIn("#main .ph", "Run all now");
ok("Run all now runs the checks and says what they found", /7 checks ran: 5 still need attention/.test(await toast()), await toast());
await go("check-scan");
ok("A check's Ran says when it ran", /Just now/.test(await mainText()));
await go("frameworks");
await clickIn("#main .ph", "Create overlay");
ok("Frameworks: Create overlay opens its dialog", (await modalOpen()) && /Create overlay/.test(await p.evaluate(() => document.getElementById("dlgTitle").textContent)));
await p.click("#modal .dlg-f .btn.ink"); await wait();
ok("…its Name blocks the primary", (await modalOpen()) && /Name is required/.test(await p.evaluate(() => document.getElementById("modal").innerText)));
await p.fill("#modal .dlg-b input.v2k-in", "Rail integration overlay"); await p.click("#modal .dlg-f .btn.ink"); await wait(400);
ok("…then says it is not wired", /Not saved: Create overlay isn't wired/.test(await toast()), await toast());
await go("composition");
await clickIn("#main", "Export");
ok("A toast-only Export outside a dialog says it is not wired", /Not saved: Export isn't wired/.test(await toast()), await toast());
await go("findings-vulns");
ok("Findings: Vulnerabilities and Open CVEs count the 4 listed", /Vulnerabilities 4/.test(await mainText()));
await go("assessments");
ok("Assessments: the head counts what the tabs hold", /2 running/.test(await p.evaluate(() => document.querySelector("#main .ph").innerText)) || !(await p.$("#main .ph .facts")));

// ——— 15. A hub that asks the campaign for a quick view ———
await p.evaluate(() => window.PA.v2.go("campaign", { filter: { qv: "Ready" } })); await wait(700);
// (Filtered to one status, the visual layer drops the Status column, as on the STIG lists: no row may read Flagged or Accepted.)
ok("PA.v2.go(campaign, Ready) chooses the Ready quick view and keeps its rows", await p.evaluate(() => { const on = document.querySelector("#main .qv.on"); const rows = [...document.querySelectorAll("#main tbody tr")]; return !!on && /^Ready/.test(on.textContent.trim()) && rows.length > 0 && rows.every((tr) => !/Flagged|Accepted/.test(tr.innerText)); }));
await p.click('#main [data-atqv="flagged"]'); await wait();
ok("Flagged keeps only flagged requests", await p.evaluate(() => [...document.querySelectorAll("#main tbody tr")].every((tr) => /Flagged/.test(tr.innerText))));

// ——— 16. C2's SSP state on Authorization ———
await p.evaluate(() => window.PA.v2.set("ssp.rev3.state", "submitted")); await go("overview"); await go("authorization");
ok("Authorization reads SSP 3 In review from C2's state, one copy", /In review/.test(await p.evaluate(() => { const tr = [...document.querySelectorAll("#main tbody tr")].find((x) => /Revision 3/.test(x.innerText)); return tr ? tr.innerText : ""; })));

console.log("errors:", errors.length ? [...new Set(errors)].join(" | ") : "none");
fs.writeFileSync(path.join(here, `walk-log${W < 600 ? "-390" : ""}.json`), JSON.stringify({ width: W, build: html, results: log, errors }, null, 1));
await b.close();
