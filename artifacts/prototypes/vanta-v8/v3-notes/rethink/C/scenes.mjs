// Lane C's scenes: the last V3 (out/prototype.html, V3 on) beside this lane's build, 1440×900, PNG. node scenes.mjs
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const out = SP + "/vanta/v3r/C/shots";
async function open(build) {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
  await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(3200);
  const go = async (r, ms = 600) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(ms); };
  return { b, p, go, shot: (id) => p.screenshot({ path: `${out}/${id}.png` }), w: (ms = 400) => p.waitForTimeout(ms) };
}
const was = await open(SP + "/vanta/proto/out/prototype-v19.html");
await was.go("baseline"); await was.shot("C-s1-was");
await was.go("controls"); await was.shot("C-s2-was");
await was.p.evaluate(() => { const t = [...document.querySelectorAll("#main tbody tr")].find((x) => /AC-2 /.test(x.innerText)); if (t) (t.querySelector("[data-panel]") || t).click(); }); await was.w(600); await was.shot("C-s3-was");
await was.go("rec--v7p-layer--tailor"); await was.shot("C-s4-was");
await was.go("sctm", 2200); await was.shot("C-s5-was");
await was.b.close();

const now = await open(SP + "/vanta/proto/out/v3r2-C.html");
await now.go("controls"); await now.shot("C-s1-now");
await now.p.evaluate(() => { const s = document.querySelector('#main .k3-tb select[aria-label="Family"]') || document.querySelector("#main .k3-tb .k3-flt select"); if (s) { s.selectedIndex = 1; s.dispatchEvent(new Event("input", { bubbles: true })); } }); await now.w();
await now.p.click("#main .k3-vbtn"); await now.w(200); await now.shot("C-s2-now"); await now.p.evaluate(() => document.querySelectorAll("details[open]").forEach((d) => (d.open = false)));
await now.p.evaluate(() => { PA.v3.fact("setImpl", "AC-2", "CN-109101", { status: "implemented", text: "The Mission Computer creates no local accounts: the maintenance role is bound to the directory group at build, and the boot image rejects any account the build manifest does not name." }); }); await now.w(300);
await now.go("control--AC-2@CN-109101", 800); await now.shot("C-s3-now");
await now.go("controls"); await now.p.evaluate(() => [...document.querySelectorAll("#main .k3c-showing .k3-link")].forEach((x) => x.click())); await now.w();
await now.p.click("#main .k3c-base .btn"); await now.w();
await now.p.click('#modal .k3c-sw[aria-label="Apply Mission Assurance Overlay"]'); await now.w(300); await now.shot("C-s4-now");
await now.p.keyboard.press("Escape"); await now.w(200);
await now.go("sctm", 2200); await now.shot("C-s5-now");
await now.b.close();
console.log("scenes written");
