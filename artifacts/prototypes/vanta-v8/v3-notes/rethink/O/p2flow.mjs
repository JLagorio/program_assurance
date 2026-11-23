import { open, SP } from "../../v3/P/lib.mjs";
const H = await open({ build: SP + "/vanta/proto/out/v3r2-O.html", v3: true, start: "overview" });
const p = H.p; p.setDefaultTimeout(6000);
const flat = (s) => String(s || "").replace(/\s+/g, " ").trim();
const T = (sel) => p.evaluate((sel) => { const e = document.querySelector(sel); return e ? e.innerText : ""; }, sel).then(flat);
const shot = async (n) => { await p.evaluate(() => { const t = document.getElementById("v2-toast"); if (t) t.hidden = true; }); await p.screenshot({ path: `tmp/pf-${n}.jpg`, type: "jpeg", quality: 60 }); };
const rows = () => p.evaluate(() => [...document.querySelectorAll("#main tbody tr")].filter((r) => !r.hidden && !r.classList.contains("k3-grow")).length);
// a) row → page; eye → preview
await p.click('#k3o-life tbody tr:has-text("PDR") td:nth-child(2)'); await H.wait(500);
console.log("a row →", await H.hash(), "| head:", (await T("#main .k3-head")).slice(0, 160));
await H.go("overview"); await p.hover('#k3o-life tbody tr:has-text("PDR")'); await p.click('#k3o-life tbody tr:has-text("PDR") .k3-eye'); await H.wait(500);
console.log("a eye →", await H.hash(), "| panel:", flat(await H.panel()).slice(0, 200)); await shot("eye");
console.log("  open gate link:", await p.evaluate(() => [...document.querySelectorAll("#panel a.btn")].map((a) => a.innerText + "→" + a.getAttribute("href")).join(" | ")));
// b) gate page: blocked row → records → a control's page → back
await H.go("gate--pdr-2"); await p.click('#main table[aria-label="Deliverables"] tr:has-text("Requirements") td:nth-child(3)'); await H.wait(700);
console.log("b row →", await H.hash(), "rows", await rows(), "| bar:", await T("#k3task"));
await p.click("#main tbody tr td:nth-child(2)"); await H.wait(600);
console.log("b control →", await H.hash(), "| bar:", await T("#k3task"), "| title:", await T("#main .k3-title")); await shot("control");
await p.click("#k3task .k3-task-b"); await H.wait(600);
console.log("b back →", await H.hash());
// c) criteria: add from outcomes, write one, assess, remove
await p.click('#k3o-crit [data-k3="ov.critadd"]'); await H.wait(400); await shot("pick");
console.log("c pick:", flat(await H.modal()).slice(0, 260));
await p.click('#modal .k3-pick-i:not(.held) input'); await p.click("#modal [data-k3-submit]"); await H.wait(500);
console.log("c after pick:", (await T("#k3o-crit .k3-sec-h")), "| rows", await p.evaluate(() => document.querySelectorAll("#k3o-crit tbody tr").length));
await p.click('#k3o-crit [data-k3="ov.critadd"]'); await H.wait(300); await p.click("#modal [data-k3-picknew]"); await H.wait(300);
await p.fill("#k3f-text", "The PDR hazard log lists every cyber hazard with its mitigation."); await p.fill("#k3f-proc", "Program test plan"); await p.click("#modal [data-k3-submit]"); await H.wait(500);
console.log("c after write:", (await T("#k3o-crit .k3-sec-h")), "| last row:", await p.evaluate(() => { const r = [...document.querySelectorAll("#k3o-crit tbody tr")].pop(); return r.innerText.replace(/\s+/g, " "); }));
await p.click('#k3o-crit tbody tr:last-child [data-k3="ov.crit"]'); await H.wait(300); await p.selectOption("#k3f-s", "met"); await p.fill("#k3f-note", "Hazard log revision C."); await p.click("#modal [data-k3-submit]"); await H.wait(500);
console.log("c after assess:", (await T("#k3o-crit .k3-sec-h")), "| last row:", await p.evaluate(() => { const r = [...document.querySelectorAll("#k3o-crit tbody tr")].pop(); return r.innerText.replace(/\s+/g, " "); }));
await shot("crit");
await p.click('#k3o-crit tbody tr:last-child [data-k3="ov.critrm"]'); await H.wait(300); await p.click("#modal [data-k3-submit]"); await H.wait(500);
console.log("c after remove:", (await T("#k3o-crit .k3-sec-h")));
// e) export
await p.click("#main .k3-head .k3-menu summary"); await p.click('#main .k3-head .k3-menu-i:has-text("Export the gate")'); await H.wait(500);
console.log("e export toast:", await H.toast());
// f) header actions and decision refusal on the page
console.log("f head actions:", await p.evaluate(() => [...document.querySelectorAll("#main .k3-head-a .btn")].map((b) => b.innerText.trim() + (b.classList.contains("ink") ? "*" : "")).join(" | ")));
await p.click('#main .k3-head-a [data-k3="ov.decide"]'); await H.wait(300); await p.selectOption("#k3f-o", "yes"); await p.fill("#k3f-why", "x"); await p.click("#modal [data-k3-submit]"); await H.wait(300);
console.log("f refusal:", await T('#modal [data-k3-field="o"] .err')); await p.click("#modal [data-k3-close]");
// g) old addresses
for (const r of ["lifecycle-pdr-2", "rec--a-work-gate--cdr", "sse", "lifecycle-outcomes", "lifecycle-ato-2", "gate--ato-2", "gate--nope-9"]) { await H.go("controls"); await H.go(r, 600); console.log("g", r, "→", await H.hash(), "|", (await T("#main .k3-title")).slice(0, 60), "| nav:", await p.evaluate(() => [...document.querySelectorAll("#nav a.item.on")].map((a) => a.innerText.trim()).join(","))); }
// h) your tasks
await H.go("overview"); await p.click('#main .k3-att-r:has-text("Your tasks")'); await H.wait(700); await shot("tasks"); console.log("h tasks →", await H.hash(), flat(await H.main()).slice(0, 200));
// i) details links
await H.go("overview"); await p.click('#main .k3-det .k3-link:has-text("560 controls")'); await H.wait(600); console.log("i baseline →", await H.hash(), "rows", await rows(), "|", (await T("#main .pager")).slice(0, 40), "| chip:", await T("#main .k3-chip.on"));
console.log("errs", H.errs);
await H.b.close();
