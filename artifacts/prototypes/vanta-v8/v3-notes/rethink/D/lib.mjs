import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
export const { chromium } = require("playwright");
export const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
export const BUILD = process.env.BUILD || SP + "/vanta/proto/out/v3r2-D.html";
export async function open(opts = {}) {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: opts.w || 1440, height: opts.h || 900 } });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + (opts.build || BUILD) + "#overview"); await p.waitForTimeout(700);
  await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
  const go = async (r, ms) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(ms || 450); };
  const shot = async (name, full) => p.screenshot({ path: `${SP}/vanta/v3r/D/${name}.jpg`, type: "jpeg", quality: 60, fullPage: !!full });
  return { b, p, errs, go, shot };
}
