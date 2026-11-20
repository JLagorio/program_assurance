// The paths Josef will try first, on the whole build with the three changes. usage: node sane.mjs <build> <outdir>
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(650); await p.evaluate(() => { const t = document.getElementById("v2-toast"); if (t) t.remove(); }); };
const hash = () => p.evaluate(() => decodeURIComponent(location.hash.slice(1)));
const main = () => p.evaluate(() => document.getElementById("main").innerText.replace(/\s+/g, " "));
const panel = () => p.evaluate(() => { const e = document.getElementById("panel"); return e && !e.hidden ? e.innerText.replace(/\s+/g, " ") : ""; });
const modal = () => p.evaluate(() => { const e = document.getElementById("modal"); return e && !e.hidden ? e.innerText.replace(/\s+/g, " ") : ""; });
const shot = (n) => p.screenshot({ path: `${out}/sane-${n}.jpg`, type: "jpeg", quality: 60 });
let ok = 0, bad = 0; const t = (name, cond, extra) => { cond ? ok++ : bad++; console.log(cond ? "ok  " : "FAIL", name, extra === undefined || cond ? "" : JSON.stringify(extra).slice(0, 500)); };
const rowCell = (sel) => p.click(`${sel} td:nth-child(2)`).catch(() => p.click(sel));

// 1. The SSP opens in its editor from Documents, one click
await go("documents"); await rowCell('#main tbody tr:has-text("System security plan")'); await p.waitForTimeout(800);
t("Documents: the System security plan row opens the editor", (await hash()) === "ssp" && /System Security Plan/i.test(await main()), [await hash(), (await main()).slice(0, 120)]); await shot("ssp");
// 2. The workbook is one click from Controls
await go("controls"); await p.click('#main .k3-head a:has-text("Workbook"), #main .k3-head button:has-text("Workbook")'); await p.waitForTimeout(900);
t("Controls: Workbook is one click", (await hash()) === "sctm", await hash());
// 3. A control row goes to the control's page; the eye opens its preview
await go("controls"); const row = '#main tbody tr[data-id="AC-2"]';
await p.hover(row); await p.waitForTimeout(150);
t("a row shows its eye on hover", await p.evaluate((r) => { const e = document.querySelector(r + " .k3-eye"); return !!e && getComputedStyle(e).opacity === "1"; }, row));
await p.click(row + " .k3-eye"); await p.waitForTimeout(500);
t("the eye opens the preview over the list", (await hash()) === "controls" && /Account Management/.test(await panel()), [await hash(), (await panel()).slice(0, 100)]); await shot("eye");
t("the preview's ↗ goes to the control's page", await p.evaluate(() => { const pn = document.querySelector("#panel .k3-pn"); return pn && pn.getAttribute("data-v2r-full") === "control--AC-2"; }));
await p.keyboard.press("Escape"); await p.waitForTimeout(250);
if (await panel()) { await p.evaluate(() => { const c = document.getElementById("closePanel"); if (c) c.click(); }); await p.waitForTimeout(250); }
await rowCell(row); await p.waitForTimeout(600);
t("clicking the row goes to the control's page", (await hash()) === "control--AC-2" && /Implementation/.test(await main()) && /Details/.test(await main()), await hash()); await shot("control");
t("the program menu stays, Controls marked", await p.evaluate(() => { const on = document.querySelector("#nav a.item.on"); return !!on && /Controls/.test(on.innerText); }));
// 4. Work on the control's page: add a requirement there
await p.click('#main button:has-text("Add requirement")'); await p.waitForTimeout(400);
t("Add requirement opens the picker on the page", /Add requirements to AC-2/.test(await modal()), (await modal()).slice(0, 80));
await p.click("#modal .k3-pick-i:not(.held) input"); await p.waitForTimeout(150); await p.click("#modal [data-k3-submit]"); await p.waitForTimeout(500);
t("the requirement is listed on the page: 3", /Requirements 3/.test(await main()), (await main()).slice(0, 400));
// 5. A requirement row on the control's page goes to the requirement's page, which lists the control
const rq = await p.evaluate(() => { const r = [...document.querySelectorAll('#main [data-rec="k3d-req"], #main tr[data-go^="requirement--"]')][0]; return r ? r.getAttribute("data-id") : null; });
console.log("    requirement row on the control page:", rq, await p.evaluate(() => [...document.querySelectorAll("#main .k3c-rq")].length + " name buttons"));
// 6. Overview: a step row goes to the gate's page, its eye opens the preview
await go("overview"); const pdr = '#main tbody tr:has-text("PDR")';
await p.hover(pdr); await p.click(pdr + " .k3-eye").catch(() => {}); await p.waitForTimeout(500);
t("Overview: the gate's eye opens its preview", /Preliminary design review/.test(await panel()), (await panel()).slice(0, 80));
await p.evaluate(() => { const c = document.getElementById("closePanel"); if (c) c.click(); }); await p.waitForTimeout(250);
await rowCell(pdr); await p.waitForTimeout(600);
t("Overview: the gate's row goes to its page", /^gate--/.test(await hash()) && /Deliverables/.test(await main()), [await hash(), (await main()).slice(0, 160)]); await shot("gate");
// 7. Component: its controls, requirements and findings rows go to those records' pages
await go("component--CN-109101--controls"); await rowCell("#main tbody tr"); await p.waitForTimeout(600);
t("component › Controls: a row goes to the control on that component", /^control--.+@CN-109101$/.test(await hash()) && /Mission Computer/.test(await main()), await hash()); await shot("comp-control");
await go("component--CN-109101--findings"); await rowCell("#main tbody tr"); await p.waitForTimeout(600);
t("component › Findings: a row goes to the finding's page", /^finding--/.test(await hash()), await hash());
await go("component--CN-109101--requirements"); await rowCell("#main tbody tr"); await p.waitForTimeout(600);
t("component › Requirements: a row goes to the requirement's page", /^requirement--/.test(await hash()), await hash()); await shot("requirement");
// 8. Findings, Risks, Evidence, System connections
for (const [r, re] of [["findings", /^finding--/], ["risks", /^risk--/], ["evidence", /^artifact--/], ["requirements", /^requirement--/], ["system-connections", /^connection--/], ["system", /^component--/], ["assessments", /^assessment--/]]) {
  await go(r); await rowCell("#main tbody tr"); await p.waitForTimeout(600);
  t(`${r}: a row goes to the record's page`, re.test(await hash()) && (await main()).length > 200, await hash());
  if (r === "evidence") await shot("artifact"); if (r === "system-connections") await shot("connection");
}
// 9. No list down the side anywhere
const rails = [];
for (const r of ["overview", "system", "system-connections", "controls", "requirements", "evidence", "documents", "assessments", "findings", "risks", "authorization", "component--CN-109101--controls"]) { await go(r); const n = await p.evaluate(() => [...document.querySelectorAll("#main .k3-rail:not(.k3-rtabs), #main .k3-split")].length); if (n) rails.push(r); }
t("no list of categories down the side on any of the ten places", !rails.length, rails);
console.log(ok, "ok,", bad, "failed; page errors", errs.slice(0, 5));
await b.close();
