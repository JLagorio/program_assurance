import { createRequire } from "node:module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch();
for (const [tag, html] of [["v2", process.argv[2]], ["v1", process.argv[3]]]) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); p.setDefaultTimeout(4000);
  await p.goto("file://" + html + "#people-access"); await p.waitForTimeout(600);
  await p.locator("#main").getByText("Quarterly privileged account review (AC-2, AC-6)").first().click(); await p.waitForTimeout(500);
  const dec = async () => (await p.evaluate(() => document.getElementById("panel").innerText.replace(/\s+/g, " ").match(/Keep, revoke or change each account\s*(\d+ of \d+)/) || []))[1];
  const showAll = await p.locator("#panel").getByText(/Show all/).count();
  if (showAll) { await p.locator("#panel").getByText(/Show all/).first().click(); await p.waitForTimeout(400); }
  const und = await p.evaluate(() => { const ids = [...new Set([...document.querySelectorAll("#panel [data-apdec]")].map((e) => e.dataset.apdec))]; return ids.filter((id) => ![...document.querySelectorAll(`#panel [data-apdec="${id}"]`)].some((e) => e.getAttribute("aria-checked") === "true")); });
  console.log(tag, "showAll control:", showAll, "| accounts listed:", await p.evaluate(() => new Set([...document.querySelectorAll("#panel [data-apdec]")].map((e) => e.dataset.apdec)).size), "| undecided:", und.length, und.slice(0, 3).join(","), "| before", await dec());
  if (und[0]) { await p.click(`#panel [data-apdec="${und[0]}"][data-apk="keep"]`); await p.waitForTimeout(400); console.log(tag, "after keep", und[0], await dec()); }
  await p.close();
}
await b.close();
