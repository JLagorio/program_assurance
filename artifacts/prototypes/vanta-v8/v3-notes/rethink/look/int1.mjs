// Integration probe, first wave: Overview, System, Controls on one build. usage: node int1.mjs <build> <outdir>
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(600); };
const shot = (n) => p.screenshot({ path: `${out}/int-${n}.jpg`, type: "jpeg", quality: 60 });
const T = async (sel) => p.evaluate((s) => [...document.querySelectorAll(s)].map((e) => e.innerText.replace(/\s+/g, " ").trim()).filter(Boolean), sel);
const say = (k, v) => console.log(k.padEnd(28), typeof v === "string" ? v : JSON.stringify(v));

await go("overview"); await shot("overview");
say("overview cards", (await T("#main .k3-card, #main .k3-completion, #main .k3-attn")).map((s) => s.slice(0, 160)).slice(0, 4));
say("facts", await p.evaluate(() => ({ controls: PA.v3.fact("controls", "WS-X90") || PA.v3.fact("controls"), baseline: (PA.v3.fact("baseline") || {}).total, comps: (PA.v3.fact("components") || []).length, conns: (PA.v3.fact("connections") || []).length, facts: Object.keys(PA.v3.facts).sort().join(" ") })));

await go("controls"); await shot("controls");
say("controls head", (await T("#main .k3-head")).map((s) => s.slice(0, 200)));
say("controls cards", (await T("#main .k3-card")).map((s) => s.slice(0, 260)));
say("controls row1", (await T("#main table tbody tr")).slice(0, 2));
say("AC-2 comps (S)", await p.evaluate(() => PA.v3.fact("componentsOf", "AC-2")));

await go("system"); 
say("system rows", (await T("#main table tbody tr")).slice(0, 4));
await go("component--CN-109101--controls"); await shot("comp-controls");
say("comp tabs", await T("#main .k3-tabs a, #main .k3-tabs button"));
const first = await p.$("#main table tbody tr");
if (first) { await first.click(); await p.waitForTimeout(600); }
await shot("comp-control-panel");
say("panel kind", await p.evaluate(() => { const pn = document.querySelector(".panel .k3-pn"); return pn ? { full: pn.dataset.v2rFull, title: (document.querySelector(".panel .k3-pn h2, .panel .k3-pn .k3-pn-title") || {}).innerText, label: (document.querySelector(".panel .panel-head, .panel header") || {}).innerText } : "no kit panel"; }));
say("panel text", (await T(".panel .k3-pn")).map((s) => s.slice(0, 500)));
say("panel buttons", await T(".panel .k3-pn button, .panel .k3-pn summary"));

// counts one number: component page vs controls filtered by component
const compCount = await p.evaluate(() => (PA.v3.fact("controlsOf", "CN-109101") || []).length);
await p.evaluate(() => { PA.v3k.set("ctl.view", { comp: "CN-109101" }); }); await go("controls");
say("controls@MC", { fromS: compCount, page: (await T("#main .k3-toolbar, #main .k3-chips, #main .k3-foot, #main .k3-table-foot")).map((s) => s.slice(0, 200)) });
await shot("controls-on-mc");
console.log("errors", errs.slice(0, 6));
await b.close();
