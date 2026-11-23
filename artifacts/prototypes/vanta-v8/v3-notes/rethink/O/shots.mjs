// Pass 2 scenes: the published V3 (out/prototype-v19.html, V3 on) beside the whole build with this lane's pass 2 (out/v3r2-O.html). PNG 1440×900.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const WAS = SP + "/vanta/proto/out/prototype-v19.html", NOW = SP + "/vanta/proto/out/v3r2-O.html", OUT = SP + "/vanta/v3r/O/shots";
const b = await chromium.launch();
async function page(build) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.setDefaultTimeout(8000);
  await p.goto("file://" + build + "#overview"); await p.waitForTimeout(800);
  await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
  p.go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(600); };
  p.shot = async (name) => { await p.evaluate(() => { const t = document.getElementById("v2-toast"); if (t) t.hidden = true; }); await p.waitForTimeout(120); await p.screenshot({ path: `${OUT}/${name}.png` }); console.log(name); };
  return p;
}
const w = await page(WAS), n = await page(NOW);
// s1: the Overview
await w.go("overview"); await w.shot("O-s1-was");
await n.go("overview"); await n.shot("O-s1-now");
// s2: the lifecycle: a page of its own, then in place
await w.go("lifecycle"); await w.shot("O-s2-was");
await n.go("overview"); await n.click('#k3o-life .k3o-ph:has(.k3o-ph-c:text-is("EMD"))'); await n.waitForTimeout(300); await n.shot("O-s2-now");
// s3: the next gate on the Overview
await w.go("lifecycle-pdr-2"); await w.shot("O-s3-was");
await n.evaluate(() => PA.v3k.set("ov.view", null)); await n.go("controls"); await n.go("overview"); await n.evaluate(() => { document.getElementById("main").scrollTop = 470; }); await n.shot("O-s3-now");
// s4: a deliverable that is not ready: the workbook, then the records with the way back
await w.go("lifecycle-pdr-2"); await w.click('.v2g-dls a[href="#sctm"]'); await w.waitForTimeout(900); await w.shot("O-s4-was");
await n.click('#main .k3o-dl:has(.k3o-dl-n:has-text("Requirements")) .btn'); await n.waitForTimeout(800); await n.shot("O-s4-now");
await n.click("#k3task .k3-task-b"); await n.waitForTimeout(500);
// s5: the gate: a decision anyone could record, then the gate's own page
await w.go("lifecycle-pdr-2"); await w.click('[data-modal="v2g-decide"]'); await w.waitForTimeout(500); await w.shot("O-s5-was");
await n.go("gate--pdr-2"); await n.shot("O-s5-now");
await b.close();
