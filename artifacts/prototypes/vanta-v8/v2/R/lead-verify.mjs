import { createRequire } from "node:module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const html = process.argv[2];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + html + "#home"); await p.waitForTimeout(600);
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(500); };
const chips = () => p.evaluate(() => [...document.querySelectorAll("#main .on, #main [aria-pressed=true]")].map((e) => e.textContent.trim().replace(/\s+/g, " ")).filter((t) => t && t.length < 40).slice(0, 4));
const out = {};
// 1. My work row → register: filtered?
await go("my-work"); await p.getByText("Treat 2 critical risks").first().click(); await p.waitForTimeout(600);
out.myworkRow = { hash: await p.evaluate(() => location.hash), activeChips: await chips(), rows: await p.locator("#main table tbody tr").count() };
// 2. Evidence: menu count vs list count
await go("evidence");
out.evidence = await p.evaluate(() => ({ menu: [...document.querySelectorAll("#nav a")].map((a) => a.textContent.trim().replace(/\s+/g, " ")).find((t) => /^Evidence\b/.test(t)), listChips: [...document.querySelectorAll("#main button, #main a")].map((e) => e.textContent.trim().replace(/\s+/g, " ")).filter((t) => /^All\s*\d/.test(t)).slice(0, 2) }));
// 3. Risks: open a preview, press the open-full-record control
await go("risks"); await p.locator("#main table tbody tr td:nth-child(2)").first().click(); await p.waitForTimeout(600);
const panelOpen = await p.evaluate(() => !document.getElementById("panel").hidden);
const opener = p.locator('#panel [title*="full record" i], #panel [aria-label*="full record" i], #panel :text-is("↗")').first();
const hasOpener = await opener.count();
const before = await p.evaluate(() => location.hash);
if (hasOpener) { await opener.click(); await p.waitForTimeout(600); }
out.riskPanel = { panelOpen, hasOpener, before, after: await p.evaluate(() => location.hash), panelStillOpen: await p.evaluate(() => !document.getElementById("panel").hidden) };
// 4. POA&M: Create POA&M item with the form left empty
await go("poam"); const btn = p.getByRole("button", { name: /Create POA&M item/i }).first();
out.poamCreate = { found: await btn.count() };
if (out.poamCreate.found) {
  await btn.click(); await p.waitForTimeout(400);
  out.poamCreate.modalOpen = await p.evaluate(() => !document.getElementById("modal").hidden);
  const rowsBefore = await p.locator("#main table tbody tr").count();
  const prim = p.locator("#modal .dlg-f button, #modal .dlg-f .btn").last(); out.poamCreate.primary = (await prim.textContent())?.trim();
  await prim.click(); await p.waitForTimeout(500);
  out.poamCreate.afterSubmit = { modalOpen: await p.evaluate(() => !document.getElementById("modal").hidden), toast: await p.evaluate(() => [...document.querySelectorAll(".ak-toast, .toast")].map((t) => t.textContent.trim()).join(" | ").slice(0, 160)), rowsBefore, rowsAfter: await p.locator("#main table tbody tr").count() };
}
console.log(JSON.stringify(out, null, 1)); await b.close();
