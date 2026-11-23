import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const build = SP + "/vanta/proto/out/v3r2-C.html", out = SP + "/vanta/v3r/C/shots";
const steps = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(500); };
for (const s of steps) {
  const [kind, a, b2] = s.split("::");
  if (kind === "go") await go(a);
  else if (kind === "click") { await p.click(a); await p.waitForTimeout(400); }
  else if (kind === "shot") { await p.waitForTimeout(2700); await p.screenshot({ path: `${out}/${a}.jpg`, type: "jpeg", quality: 60, fullPage: b2 === "full" }); }
  else if (kind === "eval") { console.log(JSON.stringify(await p.evaluate(a), null, 1)); }
  else if (kind === "size") { const [w, hh] = a.split("x").map(Number); await p.setViewportSize({ width: w, height: hh }); await p.waitForTimeout(300); }
  else if (kind === "wait") await p.waitForTimeout(+a);
}
console.log("errors", errs.slice(0, 8));
await b.close();
