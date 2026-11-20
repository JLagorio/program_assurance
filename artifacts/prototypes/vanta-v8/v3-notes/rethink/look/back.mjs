// A record opened from another record leads back to it. usage: node back.mjs <build> <outdir>
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(700); };
const st = () => p.evaluate(() => ({ hash: decodeURIComponent(location.hash.slice(1)), h1: (document.querySelector("#main h1") || {}).innerText, back: (document.querySelector("#main .k3-back") || {}).innerText || null, crumbs: (document.querySelector("#main .k3-crumbs") || {}).innerText, trail: PA.v3k.trail().slice(-4) }));
let ok = 0, bad = 0; const t = (n, c, x) => { c ? ok++ : bad++; console.log(c ? "ok  " : "FAIL", n, x === undefined || c ? "" : JSON.stringify(x).slice(0, 600)); };
// from the list: no back link
await go("requirements"); await p.click("#main tbody tr[data-go] td:nth-child(2)"); await p.waitForTimeout(600);
let s = await st(); t("from its list: crumbs only", /^requirement--/.test(s.hash) && !s.back, s);
// from a component's Requirements tab: back to the component
const comp = await p.evaluate(() => { const cs = PA.v3.fact("components") || []; const c = cs.find((c) => (PA.v3.fact("requirementsOf", c.code) || []).length) || cs[0]; return c.code; });
await go("system"); await go("component--" + comp + "--requirements"); const row = "#main tbody tr[data-go]"; const cname = (await st()).h1;
if (await p.$(row)) { await p.click(row + " td:nth-child(2)").catch(() => p.click(row)); await p.waitForTimeout(600); s = await st(); t("from a component: a link back to it", /^requirement--/.test(s.hash) && !!s.back && s.back.trim() === (cname || "").trim(), [s, cname]); await p.screenshot({ path: out + "/back-req.jpg", type: "jpeg", quality: 60, clip: { x: 220, y: 60, width: 1220, height: 200 } });
  if (s.back) await p.click("#main .k3-back"); await p.waitForTimeout(600); s = await st(); t("the link returns to the component's tab", s.hash === "component--" + comp + "--requirements" && !s.back, s); }
else console.log("   no requirement rows on", comp);
// control → requirement → back → no reverse link
await go("controls"); await go("control--AC-2"); const rq = await p.evaluate(() => { const e = document.querySelector('#main [data-go^="requirement--"]'); return e && e.getAttribute("data-go"); });
if (rq) { await p.evaluate((sel) => document.querySelector(`#main [data-go="${sel}"]`).click(), rq); await p.waitForTimeout(600); s = await st(); t("control → requirement: back to the control", !!s.back && /Account Management/.test(s.back), s); if (s.back) await p.click("#main .k3-back"); await p.waitForTimeout(600); s = await st(); t("back on the control: no reverse link", s.hash === "control--AC-2" && !s.back, s); }
else console.log("   control--AC-2 has no requirement link yet (lane C pass 2)");
// control on a component: its own crumbs lead back, no second link
await go("component--" + comp + "--controls"); if (await p.$(row)) { await p.click(row + " td:nth-child(2)").catch(() => p.click(row)); await p.waitForTimeout(600); s = await st(); console.log("   control on component:", JSON.stringify(s).slice(0, 300)); }
await p.setViewportSize({ width: 390, height: 844 }); await go("component--" + comp + "--requirements"); if (await p.$(row)) { await p.click(row); await p.waitForTimeout(600); const over = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); t("phone: the back link fits", !over); await p.screenshot({ path: out + "/back-phone.jpg", type: "jpeg", quality: 60 }); }
console.log(`${ok} ok, ${bad} failed; page errors`, JSON.stringify(errs).slice(0, 300)); await b.close();
