// The verifier's five: one boundary text, Written agrees, the control knows its campaign, no "element", a gate passes with actions.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
const go = async (r, ms) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(ms || 700); };
const main = () => p.evaluate(() => document.getElementById("main").innerText.replace(/\s+/g, " "));
let ok = 0, bad = 0; const t = (n, c, x) => { c ? ok++ : bad++; console.log(c ? "ok  " : "FAIL", n, x === undefined || c ? "" : JSON.stringify(x).slice(0, 600)); };
// 1. boundary text, both ways
await go("system-boundary"); await p.click('#main [data-k3="k3s.bText"]'); await p.waitForTimeout(300);
const t0 = await p.inputValue("#k3f-text"); await p.fill("#k3f-text", t0 + " The spare unit in depot storage is outside the boundary."); await p.click("#modal [data-k3-submit]"); await p.waitForTimeout(500);
await go("ssp--s5", 2200);
const s5 = await p.evaluate(() => { const e = document.querySelector('#se-s-s5 .se-auth[data-key="s5"]'); return e ? e.innerText.replace(/\s+/g, " ") : null; });
t("System's boundary description is section 5's text", !!s5 && /spare unit in depot storage/.test(s5), (s5 || "").slice(-200));
await p.click('#se-s-s5 .se-auth[data-key="s5"] p:last-child'); await p.keyboard.press("End"); await p.keyboard.type(" Typed in the plan."); await p.waitForTimeout(900);
await go("system-boundary"); t("a sentence typed in section 5 shows on System", /Typed in the plan\./.test(await main()), (await main()).slice(0, 400));
// 4. words
await go("ssp", 2000); const w1 = await p.evaluate(() => (document.getElementById("main").innerText.match(/\b[Ee]lements?\b[^.]{0,40}/g) || []).slice(0, 5)); t('the SSP no longer prints "element"', w1.length === 0, w1);
await go("sctm", 2500); const w2 = await p.evaluate(() => (document.getElementById("main").innerText.match(/[^\n]{0,30}\b[Ee]lements?\b[^\n]{0,20}/g) || []).slice(0, 5)); t('the workbook no longer prints "element"', w2.length === 0, w2);
// 6. a record opened from the workbook leads back to it
await go("control--AC-2"); const back = await p.evaluate(() => (document.querySelector("#main .k3-back") || {}).innerText || null); t("a control opened from the workbook has a link back to it", /Workbook/.test(back || ""), back);
// 2. Written agrees
await go("system"); await go("component--CN-109101--controls");
const wr = await p.evaluate(() => { const r = [...document.querySelectorAll("#main tbody tr")].find((x) => /Written|Implemented|Partially/.test(x.innerText) && x.getAttribute("data-go") && !/AC-2@|AC-2%40/.test(x.getAttribute("data-go"))); return r ? { go: r.getAttribute("data-go"), text: r.innerText.replace(/\s+/g, " ").slice(0, 120) } : null; });
if (wr) { await go(decodeURIComponent(wr.go)); const m = await main(); t("a control the component's tab calls written shows its text on its page", !/Nothing is written yet/.test(m), [wr, m.slice(0, 300)]); await p.screenshot({ path: out + "/fix-written.jpg", type: "jpeg", quality: 55 }); } else console.log("   no written row found");
// 3. the control knows its campaign
const code = await p.evaluate(() => { const cs = (PA.SSP.controls || []).map((c) => c.c); return cs.find((c) => { const x = PA.v3.fact("campaignOf", c); const st = PA.v3.fact("status", c); return x && x.id === "exp" && (!st || !st.camp); }) || "AC-2(7)"; });
await go("controls"); await go("control--" + code); const cm = await main();
t(`${code}: the page names the campaign that holds it and does not offer to add it again`, /Expanded|campaign/i.test(cm) && !/Add to assessment campaign/.test(await p.evaluate(() => (document.querySelector("#main .k3-head-a") || {}).innerText || "")), [code, await p.evaluate(() => (document.querySelector("#main .k3-head-a") || {}).innerText), cm.slice(0, 260)]);
await p.screenshot({ path: out + "/fix-campaign.jpg", type: "jpeg", quality: 55 });
// 5. the gate passes with actions
await go("gate--pdr-2"); await p.click('#main .k3-head-a [data-k3="ov.decide"]'); await p.waitForTimeout(350);
await p.selectOption("#k3f-o", "cond"); await p.fill("#k3f-why", "Design is ready; two deliverables close before CDR."); await p.fill("#k3f-acts", "Map the 14 controls with no requirement"); await p.selectOption("#k3f-owner", { index: 1 }); await p.fill("#k3f-due", "2026-12-15"); await p.click("#modal [data-k3-submit]"); await p.waitForTimeout(700);
const gm = await main(); t("PDR passes with an action while a deliverable is open", !(await p.evaluate(() => !document.getElementById("modal").hidden)) && /Passed with|passed with|Pass with actions|1 action/i.test(gm), [await p.evaluate(() => document.getElementById("modal").innerText.slice(0, 300)), gm.slice(0, 300)]);
console.log(`${ok} ok, ${bad} failed; page errors`, JSON.stringify(errs).slice(0, 400)); await b.close();
