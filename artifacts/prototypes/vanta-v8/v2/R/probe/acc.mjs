import { createRequire } from "node:module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch();
for (const [tag, html] of [["v2", process.argv[2]], ["v1", process.argv[3]]]) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); p.setDefaultTimeout(4000);
  await p.goto("file://" + html + "#people-access"); await p.waitForTimeout(600);
  await p.locator("#main").getByText("Quarterly privileged account review (AC-2, AC-6)").first().click(); await p.waitForTimeout(500);
  const dec = async () => (await p.evaluate(() => document.getElementById("panel").innerText.replace(/\s+/g, " ").match(/Keep, revoke or change each account\s*(\d+ of \d+)/) || []))[1];
  const st = async (id) => p.evaluate((id) => [...document.querySelectorAll(`#panel [data-apdec="${id}"]`)].map((e) => e.dataset.apk + "=" + e.getAttribute("aria-checked")).join(","), id);
  console.log(tag, "before", await dec(), "| svc-maint-07", await st("svc-maint-07"), "| field-tech-03", await st("field-tech-03"));
  await p.click('#panel [data-apdec="svc-maint-07"][data-apk="keep"]').catch((e) => console.log("click err", String(e).slice(0, 100))); await p.waitForTimeout(500);
  console.log(tag, "after keep svc-maint-07", await dec(), "|", await st("svc-maint-07"));
  await p.click('#panel [data-apdec="field-tech-03"][data-apk="revoke"]').catch((e) => console.log("click err", String(e).slice(0, 100))); await p.waitForTimeout(500);
  console.log(tag, "after revoke field-tech-03", await dec(), "|", await st("field-tech-03"));
  await p.close();
}
await b.close();
