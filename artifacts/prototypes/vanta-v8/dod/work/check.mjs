// Click through the v8 DoD screens: node check.mjs <built html>
import { createRequire } from "node:module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = "file://" + process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
const go = async (r) => { await page.goto(file + "#" + r); await page.waitForTimeout(250); };
const routes = ["stigs", "stigs-open", "stigs-benchmarks", "stigs-imports", "stigs-mission-computer-rhel9", "stigs-mission-computer-asd", "stigs-ethernet-switch-ndm", "stigs-ethernet-switch-l2s", "stigs-network-gateway-ndm", "stigs-network-gateway-rtr", "stigs-maintenance-laptop-win11", "stigs-maintenance-laptop-win11-comments", "stigs-ethernet-switch-ndm-activity", "sse", "sse-processes", "sse-csa", "control-si2"];
const wide = [];
for (const r of routes) {
  await go(r);
  const o = await page.evaluate(() => [...document.querySelectorAll("#main .tablebox")].map((t) => [t.scrollWidth, t.clientWidth, (t.querySelector("table") || {}).getAttribute?.("aria-label")]).filter(([s, c]) => s > c + 1));
  if (o.length) wide.push(r + " " + JSON.stringify(o));
}
console.log("tables wider than their frame at 1440:", wide.length ? wide.join(" || ") : "none");
const log = (...a) => console.log(...a);
const closeP = async () => { if (await page.evaluate(() => !document.getElementById("panel").hidden)) { await page.click("#closePanel"); await page.waitForTimeout(100); } };
const panelLabel = async () => page.evaluate(() => { const p = document.getElementById("panel"); return p && !p.hidden ? p.querySelector(".bar-top span").textContent + " | " + (p.querySelector(".ak-title") || {}).textContent : "closed"; });
const modalTitle = async () => page.evaluate(() => { const m = document.getElementById("modal"); return m && !m.hidden ? m.querySelector("#dlgTitle").textContent : "closed"; });
// Checklists: row panel, then open the checklist.
await go("stigs");
await page.click("#main tbody tr[data-panel]"); await page.waitForTimeout(150); log("checklist row ->", await panelLabel());
await page.click('#panel [data-go^="stigs-"]'); await page.waitForTimeout(250); log("open checklist ->", await page.evaluate(() => location.hash));
// Filters on the checklist page: status All, CAT II, next page.
await page.click('#main [data-v8g-q^="s:"][data-v8g-v="all"]'); await page.waitForTimeout(150);
await page.click('#main [data-v8g-q^="c:"][data-v8g-v="2"]'); await page.waitForTimeout(150);
log("all CAT II pager ->", await page.evaluate(() => document.querySelector("#main .pager .num").textContent));
await page.click('#main [data-v8g-page][data-v8g-dir="1"]'); await page.waitForTimeout(150);
log("next page ->", await page.evaluate(() => document.querySelector("#main .pager .num").textContent));
await page.click('#main [data-v8g-q^="s:"][data-v8g-v="O"]'); await page.waitForTimeout(150);
await page.click('#main [data-v8g-q^="c:"][data-v8g-v="all"]'); await page.waitForTimeout(150);
// Rule panel and Create POA&M item.
await page.click("#main tbody tr[data-panel]"); await page.waitForTimeout(150); log("rule row ->", await panelLabel());
log("rule panel sections ->", await page.evaluate(() => [...document.querySelectorAll("#panel .ak-sec h3")].map((h) => h.textContent.trim()).join(" / ")));
await page.click('#panel [data-modal="v8g-poam"]'); await page.waitForTimeout(150); log("poam ->", await modalTitle());
await page.fill('#modal [name="v8g-pt"]', ""); await page.click('#modal [data-v8g-submit="poam"]'); await page.waitForTimeout(100);
log("empty title error shown ->", await page.evaluate(() => !document.querySelector("#modal .v8g-err").hidden));
await page.fill('#modal [name="v8g-pt"]', "Enable FIPS mode on the Mission Computer"); await page.click('#modal [data-v8g-submit="poam"]'); await page.waitForTimeout(200);
log("after create ->", await modalTitle(), "| panel POA&M:", await page.evaluate(() => { const s = [...document.querySelectorAll("#panel .ak-sec")].find((x) => /POA&M item/.test(x.textContent)); return s ? s.textContent.replace(/\s+/g, " ").trim().slice(0, 90) : "none"; }));
// See what changed -> benchmark panel -> Move to V2R10.
await closeP();
await page.click('#main [data-panel="v8g-bench"]'); await page.waitForTimeout(150); log("see what changed ->", await panelLabel());
await page.click('#panel [data-modal="v8g-move"]'); await page.waitForTimeout(150); log("move ->", await modalTitle());
await page.click('#modal [data-v8g-submit="move"]'); await page.waitForTimeout(250);
log("after move title ->", await page.evaluate(() => document.querySelector("#main .ak-title").textContent), "| rules tab", await page.evaluate(() => document.querySelector("#main .ak-tab .ct").textContent));
// Import dialog: switch to the queued switch file, preview, apply.
await go("stigs-ethernet-switch-ndm");
await page.click('#main [data-modal="v8g-import"][data-id$="|q"]'); await page.waitForTimeout(150); log("review import ->", await modalTitle(), "| step 2:", await page.evaluate(() => !!document.querySelector("#modal .v8g-pgrp")));
log("preview groups ->", await page.evaluate(() => [...document.querySelectorAll("#modal .v8g-pgh")].map((x) => x.textContent.trim()).join(" / ")));
await page.click('#modal [data-v8g-imp="apply"]'); await page.waitForTimeout(250);
log("after apply ->", await modalTitle(), "| last import:", await page.evaluate(() => [...document.querySelectorAll("#main .ak-facts div")].map((d) => d.textContent).find((t) => t.startsWith("Last import"))));
// Import from the index, step 1 -> change checklist and format -> preview -> back.
await go("stigs");
await page.click('#main [data-modal="v8g-import"]'); await page.waitForTimeout(150);
await page.selectOption('#modal select[name="v8g-ck"]', "maintenance-laptop-win11"); await page.waitForTimeout(100);
log("file for laptop ->", await page.evaluate(() => document.querySelector("#modal .v8g-drop b").textContent));
await page.click('#modal [data-v8g-imp="next"]'); await page.waitForTimeout(150);
log("laptop preview strip ->", await page.evaluate(() => document.querySelector("#modal .v8g-strip").textContent.replace(/\s+/g, " ")));
await page.click('#modal [data-v8g-imp="back"]'); await page.waitForTimeout(100);
await page.check('#modal input[name="v8g-fmt"][value="CKL"]'); await page.waitForTimeout(100);
log("format change keeps step 1 ->", await page.evaluate(() => !!document.querySelector('#modal select[name="v8g-ck"]')));
await page.click("#modal [data-close-modal]"); await page.waitForTimeout(100);
// Open rules: CAT I chip, a row with POA&M link; imports panel; benchmarks panel.
await go("stigs-open");
await page.click('#main [data-v8g-q="open-cat"][data-v8g-v="1"]'); await page.waitForTimeout(150);
log("CAT I rows ->", await page.evaluate(() => document.querySelectorAll("#main tbody tr[data-panel]").length));
await go("stigs-imports"); await page.click("#main tbody tr[data-panel]"); await page.waitForTimeout(150); log("import row ->", await panelLabel());
await go("stigs-benchmarks"); await page.click("#main tbody tr[data-panel]"); await page.waitForTimeout(150); log("bench row ->", await panelLabel());
// SI-2 decoration.
await go("control-si2");
log("SI-2 STIG rows ->", await page.evaluate(() => { const d = document.querySelector(".v8g-si2"); return d ? d.querySelectorAll("tbody tr").length + " | " + d.querySelector("h4").textContent : "missing"; }));
await page.click(".v8g-si2 tbody tr"); await page.waitForTimeout(150); log("SI-2 row ->", await panelLabel());
// Security engineering: review card filter, outcome panel, picker add.
await go("sse");
await page.click('#main .v8g-rev[data-v8g-v="pdr"]'); await page.waitForTimeout(150);
log("PDR filter rows ->", await page.evaluate(() => document.querySelectorAll("#main tbody tr[data-panel]").length));
await page.click("#main tbody tr[data-panel]"); await page.waitForTimeout(150); log("outcome row ->", await panelLabel());
await closeP(); await page.click('#main .v8g-grph [data-panel="v8g-review"]'); await page.waitForTimeout(150); log("open review ->", await panelLabel());
await closeP(); await page.click('#main .v8g-grph [data-modal="v8g-outcomes"]'); await page.waitForTimeout(150); log("picker ->", await modalTitle());
await page.fill("#modal .v8g-pk-q", "traceability"); await page.waitForTimeout(100);
log("search traceability visible ->", await page.evaluate(() => [...document.querySelectorAll("#modal .v8g-pko")].filter((x) => !x.hidden).length));
await page.click('#modal .v8g-pko:not([hidden]) input:not(:disabled)'); await page.waitForTimeout(80);
log("count ->", await page.evaluate(() => document.querySelector("#modal .v8g-pkn").textContent));
await page.click('#modal [data-v8g-submit="outcomes"]'); await page.waitForTimeout(200);
log("after add PDR rows ->", await page.evaluate(() => document.querySelectorAll("#main tbody tr[data-panel]").length));
await go("sse-processes"); await page.click('#main [data-v8g-q="pg"][data-v8g-v="held"]'); await page.waitForTimeout(120);
log("held processes ->", await page.evaluate(() => document.querySelectorAll("#main tbody tr[data-panel]").length));
await page.click("#main tbody tr[data-panel]"); await page.waitForTimeout(150); log("process row ->", await panelLabel());
await go("sse-csa"); await page.click('#main [data-v8g-q="pil"][data-v8g-v="Mitigate"]'); await page.waitForTimeout(120);
log("mitigate rows ->", await page.evaluate(() => document.querySelectorAll("#main tbody tr[data-panel]").length));
await page.click("#main tbody tr[data-panel]"); await page.waitForTimeout(150); log("csa row ->", await panelLabel());
// Phone width.
await page.setViewportSize({ width: 390, height: 844 });
const over = [];
for (const r of routes) { await go(r); if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) over.push(r); }
await go("stigs-mission-computer-rhel9"); await page.click("#main tbody tr[data-panel]"); await page.waitForTimeout(150);
const pOver = await page.evaluate(() => { const p = document.querySelector("#panel .pbody"); return p ? p.scrollWidth > p.clientWidth + 1 : false; });
log("overflow at 390:", over.length ? over.join(", ") : "none", "| rule panel overflow:", pOver);
log("errors:", errors.length ? errors.join(" | ") : "none");
await browser.close();
