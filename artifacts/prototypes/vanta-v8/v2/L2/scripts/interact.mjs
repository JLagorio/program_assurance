// node interact.mjs <html> : click through the controls my pages changed.
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = "file://" + path.resolve(process.argv[2]);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
const res = []; const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${x ? " · " + x : ""}`);
const go = async (r, w = 450) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(w); };
const rows = () => p.evaluate(() => [...document.querySelectorAll("#main tbody tr")].filter((t) => !t.hidden).length);
await p.goto(file + "#home"); await p.waitForTimeout(500);
// Policies: No approver view, its Assign approvers, the menu item
await go("policies");
await p.click('#main [data-adq="pol"][data-adv="noappr"]'); await p.waitForTimeout(300);
ok("Policies: No approver lists 12", (await rows()) === 12, String(await rows()));
ok("Policies: Assign approvers beside the filters", await p.evaluate(() => !!document.querySelector('#main .tools [data-modal="a-docs-approvers"]')));
await p.click('#main .tools [data-modal="a-docs-approvers"]'); await p.waitForTimeout(300);
ok("Policies: Assign approvers opens its dialog", await p.evaluate(() => !document.getElementById("modal").hidden));
await p.keyboard.press("Escape"); await p.evaluate(() => { const m = document.getElementById("modal"); if (!m.hidden) m.querySelector("[data-close-modal]").click(); });
// Checks: no pre-ticked row, the row menu's Preview opens the check preview
await go("checks");
ok("Checks: nothing ticked", await p.evaluate(() => !document.querySelector('#main [role="checkbox"][aria-checked="true"]')));
await p.click('#main tbody tr:first-child .a-tests-rowmore summary'); await p.waitForTimeout(200);
await p.click('#main tbody tr:first-child .a-tests-rowmore [data-panel="a-tests-check"]'); await p.waitForTimeout(400);
ok("Checks: row menu Preview opens the check", await p.evaluate(() => !document.getElementById("panel").hidden && /Check preview/.test(document.getElementById("panel").innerText)), await p.evaluate(() => location.hash));
// Campaign: ticking a row shows the selection bar
await go("campaign");
ok("Campaign: nothing ticked", await p.evaluate(() => !document.querySelector('#main [role="checkbox"][aria-checked="true"]')));
await p.click('#main tbody tr:nth-child(2) [role="checkbox"]'); await p.waitForTimeout(300);
ok("Campaign: ticking shows the selection bar", await p.evaluate(() => /1 selected/.test(document.getElementById("main").innerText)));
ok("Campaign: chips count 368", await p.evaluate(() => /All\s*368/.test(document.querySelector("#main .views").innerText)));
// Controls: chips and no donut
await go("controls");
ok("Controls: no donut", await p.evaluate(() => !document.querySelector("#main .a-tests-donut")));
ok("Controls: No owner quick view", await p.evaluate(() => /No owner\s*560/.test(document.querySelector("#main .views").innerText)));
// SI-2: nothing between facts and tabs; rail on the first tab; one ink button
await go("control-si2");
ok("SI-2: tabs right after the head", await p.evaluate(() => { const t = document.querySelector("#main .ak-tabs"); const prev = t && t.previousElementSibling; return !!prev && prev.classList.contains("ak-rh"); }), await p.evaluate(() => { const t = document.querySelector("#main .ak-tabs"); return t && t.previousElementSibling ? t.previousElementSibling.className : "none"; }));
ok("SI-2: Details rail with Where it stands and Next step", await p.evaluate(() => /Where it stands/.test((document.querySelector("#main .ak-rail") || {}).innerText || "") && /Next step/.test(document.querySelector("#main .ak-rail").innerText)));
ok("SI-2: one ink button", await p.evaluate(() => document.querySelectorAll("#main .btn.ink").length === 1), String(await p.evaluate(() => document.querySelectorAll("#main .btn.ink").length)));
ok("SI-2: seven tabs", await p.evaluate(() => document.querySelectorAll("#main .ak-tabs [role=tab]").length === 7), String(await p.evaluate(() => document.querySelectorAll("#main .ak-tabs [role=tab]").length)));
ok("SI-2: STIG rules section still added", await p.evaluate(() => /STIG rules mapped to SI-2/.test(document.getElementById("main").innerText)));
await go("control-si2-comments");
ok("SI-2: the comments address opens Activity", await p.evaluate(() => /Comments/.test(document.getElementById("main").innerText) && /Activity/.test(document.querySelector('#main .ak-tab.on, #main [role=tab][aria-selected="true"]').innerText)));
// STIG record: CAT filter
await go("stigs-mission-computer-rhel9");
ok("STIG: one chip row", await p.evaluate(() => document.querySelectorAll("#main .views").length === 1));
ok("STIG: no Status column while filtered to Open", await p.evaluate(() => ![...document.querySelectorAll("#main thead th")].some((th) => th.textContent.trim() === "Status")));
const before = await rows();
await p.click("#main .v2l-flt > summary"); await p.waitForTimeout(150);
await p.click('#main .v2l-mi[data-v8g-v="1"]'); await p.waitForTimeout(400);
ok("STIG: CAT I filter narrows the rows", (await rows()) < before && (await rows()) > 0, `${before} → ${await rows()}`);
ok("STIG: filter says CAT I", await p.evaluate(() => /CAT I\b/.test(document.querySelector("#main .v2l-flt > summary").textContent)));
await p.click('#main [data-v8g-q^="s:"][data-v8g-v="all"]'); await p.waitForTimeout(400);
ok("STIG: All shows the Status column again", await p.evaluate(() => [...document.querySelectorAll("#main thead th")].some((th) => th.textContent.trim() === "Status")));
ok("STIG: release line links its panel", await p.evaluate(() => !!document.querySelector('#main .ak-desc [data-panel="v8g-bench"]')));
// Suppliers: Found in SBOMs and back to Tier 1
await go("suppliers");
await p.click('#main .views [data-go="suppliers-sbom"]'); await p.waitForTimeout(450);
ok("Suppliers: Found in SBOMs opens its list", (await p.evaluate(() => location.hash)) === "#suppliers-sbom");
await p.click('#main .views [data-arqgo="sup|t1|suppliers"]'); await p.waitForTimeout(450);
ok("Suppliers: Tier 1 from the SBOM list lands filtered", (await p.evaluate(() => location.hash)) === "#suppliers" && (await rows()) === 3, `${await p.evaluate(() => location.hash)} ${await rows()} rows`);
// PPSM: no blue Not required pill
await go("ppsm");
ok("PPSM: Not required is a word", await p.evaluate(() => ![...document.querySelectorAll("#main .pill")].some((x) => /Not required|Not applicable/.test(x.textContent))));
// Request page facts
await go("campaign-r2");
ok("Request page: one pill in the facts", await p.evaluate(() => document.querySelectorAll("#main .ak-facts .pill").length === 1), String(await p.evaluate(() => document.querySelectorAll("#main .ak-facts .pill").length)));
for (const r of res) console.log(r);
console.log("errors:", errs.length ? [...new Set(errs)].join(" | ") : "none");
await b.close();
