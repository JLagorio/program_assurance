// node shots.mjs <build.html> <outDir> : screenshots of C2's changed screens and states.
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out] = [path.resolve(process.argv[2]), path.resolve(process.argv[3])];
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const go = async (p, r, w = 450) => { await p.evaluate((x) => { location.hash = x; }, r); await p.waitForTimeout(w); };
const shot = (p, n) => p.screenshot({ path: path.join(out, n + ".png") });
for (const w of [1440, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: w > 600 ? 900 : 844 } });
  await p.goto("file://" + html + "#home"); await p.waitForTimeout(500);
  await shot(p, `${w}-home`);
  await go(p, "my-work"); await shot(p, `${w}-my-work`);
  const r0 = await p.$("#main a.a-work-mw"); await r0.click(); await p.waitForTimeout(800); await shot(p, `${w}-landed-cve`);
  await go(p, "review-queue"); await shot(p, `${w}-review-queue`);
  await go(p, "people"); await shot(p, `${w}-people`);
  await p.click('#main [data-modal="v2c-add-person"]'); await p.waitForTimeout(300); await shot(p, `${w}-add-person`);
  await p.fill("#v2c-p-name", "Maya Chen"); await p.click('#modal [data-v2c-act="add-person"]'); await p.waitForTimeout(700); await shot(p, `${w}-onboarding`);
  await p.click("#main tbody tr[data-panel='v8d-ob']"); await p.waitForTimeout(400); await shot(p, `${w}-onboarding-task`);
  await go(p, "people-access");
  await p.click("#main tbody tr[data-panel='a-people-par']"); await p.waitForTimeout(400);
  await p.click("#panel [data-apcomplete]"); await p.waitForTimeout(400); await shot(p, `${w}-access-owed`);
  await go(p, "inventory"); await p.click('#main [data-modal="v2c-add-asset"]'); await p.waitForTimeout(300); await shot(p, `${w}-add-asset`);
  await go(p, "campaign"); if (w < 600) { await p.click("#menuBtn"); await p.waitForTimeout(300); } await shot(p, `${w}-campaign-menu`);
  if (w > 600) {
    await go(p, "program-new", 700);
    for (let i = 0; i < 8 && (await p.evaluate(() => location.hash)) !== "#program-new-review"; i++) { await p.click('[data-pn="next"]'); await p.waitForTimeout(400); }
    await p.click('[data-pn="create"]'); await p.waitForTimeout(3800);
    await shot(p, `${w}-program-start`);
    await p.click('#main .pn-trow [data-go="requirements"]'); await p.waitForTimeout(500); await shot(p, `${w}-new-requirements`);
    await p.click("#swBtn"); await p.waitForTimeout(200); await shot(p, `${w}-new-switcher`);
  }
  await p.close();
}
await b.close();
console.log("shots in", out);
