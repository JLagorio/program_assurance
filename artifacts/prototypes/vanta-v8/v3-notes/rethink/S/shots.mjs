// The hand-back scenes: the published version (proto/out/prototype-v19.html, V3 on) beside the whole build with lane S's
// pass 2 (proto/out/v3r2-S.html), 1440×900, PNG.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta";
const b = await chromium.launch();
async function open(file) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on("pageerror", (e) => console.log("ERR", file.slice(-16), e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await p.goto("file://" + file + "#overview"); await p.waitForTimeout(700);
  await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
  return p;
}
// The build has no charset line: a byte-order mark keeps the browser from guessing Latin-1 for the copy it reads.
const fs = require("fs"), WAS = SP + "/v3r/S/was-prototype.html";
fs.writeFileSync(WAS, "\ufeff" + fs.readFileSync(SP + "/proto/out/prototype-v19.html", "utf8"));
const NOW = SP + "/v3r/S/now-build.html";
fs.writeFileSync(NOW, "\ufeff" + fs.readFileSync(SP + "/proto/out/v3r2-S.html", "utf8").replace(/^\ufeff/, ""));
const was = await open(WAS), now = await open(NOW);
const go = async (p, r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(600); };
const snap = async (p, id, kind) => { await p.evaluate(() => { const t = document.getElementById("v2-toast"); if (t) t.hidden = true; }); await p.screenshot({ path: `${SP}/v3r/S/shots/${id}-${kind}.png` }); };
// S-s1: Composition → the System list
await go(was, "composition"); await snap(was, "S-s1", "was");
await go(now, "system"); await snap(now, "S-s1", "now");
// S-s2: the read-only element page → the component's Controls tab, worked in place
await go(was, "rec--v7p-el--CN-109101"); await snap(was, "S-s2", "was");
await go(now, "component--CN-109101--controls"); await now.hover('#main tr[data-id="AC-2(7)@CN-109101"]'); await now.waitForTimeout(250); await snap(now, "S-s2", "now");
// S-s3: software and firmware as text → rows with Add
await was.evaluate(() => { const m = document.getElementById("main"); m.scrollTop = 0; });
await go(was, "composition"); await was.evaluate(() => { const r = document.querySelector('#main [data-panel="v7p-el"][data-id="CN-109101"]'); if (r) r.click(); }); await was.waitForTimeout(450); await snap(was, "S-s3", "was");
await go(now, "component--CN-109101--software"); await now.click("#main .k3-tools button.btn"); await now.waitForTimeout(350);
await now.selectOption("#k3f-kind", "Firmware"); await now.fill("#k3f-version", "5.0"); await now.fill("#k3f-name", "MC-FW"); await snap(now, "S-s3", "now");
await now.click("#modal [data-k3-close]");
// S-s4: Interconnections and Ports & protocols → one Connections table, a connection's panel
await go(was, "interconnections"); await snap(was, "S-s4", "was");
await go(now, "connection--IC-103"); await snap(now, "S-s4", "now");
// S-s5: Host & providers → the host's own page
await go(was, "hosts"); await snap(was, "S-s5", "was");
await go(now, "component--f16--offered"); await snap(now, "S-s5", "now");
// Extra looks (not part of the hand-back)
for (const [r, n] of [["system-boundary", "x-boundary"], ["system-providers", "x-providers"], ["system-connected", "x-connected"], ["system-connections", "x-connections"], ["component--CN-109001", "x-sub"], ["component--CN-109101--connections", "x-cconn"], ["component--EXT-104", "x-ext"], ["component--CN-109101--requirements", "x-reqs"], ["component--CN-109101--findings", "x-find"]]) { await go(now, r); await now.screenshot({ path: `${SP}/v3r/S/look/${n}.jpg`, type: "jpeg", quality: 60 }); }
await go(now, "system"); await now.selectOption('#main select[data-k3-input="k3s.sub"]', "CN-109005"); await now.waitForTimeout(300); await now.hover("#main .k3-table tbody tr:nth-child(3)"); await now.screenshot({ path: `${SP}/v3r/S/look/x-subfilter.jpg`, type: "jpeg", quality: 60 });
await go(now, "component--CN-109101"); await now.click("#main .k3s-add summary"); await now.waitForTimeout(200); await now.screenshot({ path: `${SP}/v3r/S/look/x-addmenu.jpg`, type: "jpeg", quality: 60 });
await b.close();
fs.unlinkSync(WAS); fs.unlinkSync(NOW);
