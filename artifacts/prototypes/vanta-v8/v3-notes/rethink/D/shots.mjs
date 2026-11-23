// The scenes for notes.json: the published version (out/prototype-v19.html, V3 on) beside the whole build (out/v3r2-D.html), 1440×900, PNG.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const OUT = SP + "/vanta/v3r/D/shots";
const b = await chromium.launch();
async function open(file) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await p.goto("file://" + file + "#overview"); await p.waitForTimeout(700);
  await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
  const go = async (r, ms = 500) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(ms); };
  const quiet = async () => { await p.evaluate(() => { const t = document.getElementById("v2-toast"); if (t) t.hidden = true; document.querySelectorAll(".toast").forEach((x) => x.remove()); }); };
  const shot = async (name) => { await quiet(); await p.waitForTimeout(150); await p.screenshot({ path: `${OUT}/${name}.png` }); console.log(name); };
  return { p, errs, go, shot };
}
const W = await open(SP + "/vanta/proto/out/prototype-v19.html"), N = await open(SP + "/vanta/proto/out/v3r2-D.html");
// s1: Documents
await W.go("ssps"); await W.shot("D-s1-was");
await N.go("documents"); await N.shot("D-s1-now");
// s2: the SSP from its row
await W.go("ssps"); await W.p.click('#main tr[data-panel="ssp"] td:first-child'); await W.p.waitForTimeout(500); await W.shot("D-s2-was");
await N.go("documents"); await N.p.click('#main tr.k3d-doc:has-text("System security plan") td:first-child'); await N.p.waitForTimeout(900);
await N.go("ssp--CN-109101", 1500); await N.shot("D-s2-now");
// s3: a requirement
await W.go("requirements"); await W.p.click("#main table tbody tr td:nth-child(2)"); await W.p.waitForTimeout(500); await W.shot("D-s3-was");
await N.go("requirements"); await N.p.click("#main .k3-table tbody tr td:nth-child(2)"); await N.p.waitForTimeout(600); await N.shot("D-s3-now");
// s4: Link evidence
const link = await W.p.evaluate(() => { const b = [...document.querySelectorAll("#panel button, #panel [data-modal]")].find((x) => /Link evidence/.test(x.innerText)); if (b) b.click(); return !!b; }); await W.p.waitForTimeout(400);
if (link) await W.p.evaluate(() => { const s = [...document.querySelectorAll("#modal select")].pop(); if (s) { s.focus(); s.size = Math.min(8, s.options.length); } }); await W.p.waitForTimeout(200); await W.shot("D-s4-was");
await W.p.evaluate(() => { const x = document.querySelector("#modal [data-close-modal]"); if (x) x.click(); });
await N.p.click('#main [data-k3="k3d.req.link"]'); await N.p.waitForTimeout(400); await N.shot("D-s4-now"); await N.p.keyboard.press("Escape");
// s5: Evidence and its review
await W.go("evidence"); await W.p.click("#main table tbody tr td:nth-child(2)"); await W.p.waitForTimeout(500); await W.shot("D-s5-was");
await N.go("evidence"); await N.p.hover("#main .k3-table tbody tr"); await N.p.click("#main .k3-table tbody tr .k3-eye"); await N.p.waitForTimeout(500); await N.shot("D-s5-now");
console.log("errors", W.errs.slice(0, 3), N.errs.slice(0, 3));
await b.close();
