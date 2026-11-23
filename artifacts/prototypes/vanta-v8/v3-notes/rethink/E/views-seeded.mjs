// Lane E's copy of p3/views.mjs for a list that starts with saved views (views.seed): the lead's test counts exactly one saved
// view in Manage views and deletes the first row, which is the seed. This copy counts the seeds first and works on the row it saved.
// Saved views on a list, end to end. usage: node views.mjs <build> [route] [list id]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const build = path.resolve(process.argv[2]), route = process.argv[3] || "requirements";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1728, height: 964 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
await p.evaluate((r) => { location.hash = r; }, route); await p.waitForTimeout(400);
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : (fail++, console.log("  FAIL", m)); };
const st = () => p.evaluate(() => { const t = document.querySelector("#main .k3-tb[data-k3-list]"); if (!t) return null; return { bars: document.querySelectorAll("#main .k3-tb").length, top: [...document.querySelectorAll("#main .k3-tb[data-k3-list] > *")].flatMap((c) => (c.classList.contains("k3-fs") ? [...c.children] : [c])).filter((e) => e.getClientRects().length).map((e) => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2)), view: t.querySelector(".k3-vname").textContent, edited: !!t.querySelector(".k3-vedit"), rows: document.querySelectorAll("#main table.k3-table tbody tr").length, pager: (document.querySelector("#main .pager") || {}).textContent || "", on: [...t.querySelectorAll(".k3-flt.on select")].map((s) => s.selectedOptions[0].textContent), q: (t.querySelector("input[type=search]") || {}).value, acts: [...t.querySelectorAll(".k3-tools-r .btn, .k3-tools-r summary")].map((e) => e.textContent.trim()), headA: document.querySelectorAll("#main .k3-head-a").length, chips: document.querySelectorAll("#main .k3-chips, #main .k3-rtabs").length }; });
const menu = async (label) => { await p.click("#main .k3-vbtn"); await p.waitForTimeout(80); await p.evaluate((l) => { const x = [...document.querySelectorAll("#main .k3-vlist .k3-menu-i")].find((e) => e.textContent.trim().startsWith(l)); if (!x) throw new Error("no menu item " + l); x.click(); }, label); await p.waitForTimeout(350); };
const s0 = await st(); console.log("start", JSON.stringify(s0));
const seeds = await p.evaluate(() => { let n = 0, on = false; for (const e of document.querySelectorAll("#main .k3-vlist > *")) { if (e.classList.contains("k3-vg")) on = /Saved/.test(e.textContent); else if (on && e.classList.contains("k3-vi")) n++; } return n; }); console.log("seeded saved views", seeds);
const mine = (name) => `[...document.querySelectorAll("#modal .k3-vm-r")].find((r) => (r.querySelector(".k3-vm-n") || {}).value === ${JSON.stringify(name)})`;
ok(s0 && s0.bars === 1, "one toolbar"); ok(s0 && new Set(s0.top.map((t) => Math.round(t / 6))).size === 1, "one row: tops " + (s0 && s0.top)); ok(s0 && !s0.headA && !s0.chips, "no header actions, no strips"); ok(s0 && s0.acts.length > 0, "the list's actions stand at the row's end"); ok(s0 && !s0.edited, "starts on a view");
// a filter: the last select in the row, its second option
const picked = await p.evaluate(() => { const ss = [...document.querySelectorAll("#main .k3-tb[data-k3-list] .k3-flt select")]; const s = ss[ss.length - 1]; s.selectedIndex = Math.min(2, s.options.length - 1); s.dispatchEvent(new Event("input", { bubbles: true })); return s.getAttribute("aria-label"); }); await p.waitForTimeout(350);
const s1 = await st(); console.log("filtered by", picked, JSON.stringify(s1));
ok(s1.on.length >= 1, "a filter shows as on"); ok(s1.edited || s1.view !== s0.view, "the view says it was edited (or is another view)");
await p.fill("#main .k3-tb input[type=search]", "a"); await p.waitForTimeout(500);
await menu("Save as new view"); await p.fill("#modal input[name=name]", "My saved view"); await p.selectOption("#modal select[name=shared]", "team"); await p.click("#modal [data-k3-submit]"); await p.waitForTimeout(350);
const s2 = await st(); console.log("saved", JSON.stringify(s2)); ok(s2.view === "My saved view" && !s2.edited, "the saved view is the current one");
await menu("All "); const s3 = await st(); ok(!s3.on.length && !s3.q && !s3.edited, "All clears every filter: " + JSON.stringify(s3)); ok(s3.rows >= s2.rows, "all rows back");
await menu("My saved view"); const s4 = await st(); ok(s4.view === "My saved view" && !s4.edited && s4.q === "a" && s4.on.length === s2.on.length && s4.rows === s2.rows, "picking the saved view asks its question again: " + JSON.stringify(s4));
await p.evaluate(() => { const c = document.querySelector("#main .k3-clear"); c && c.click(); }); await p.waitForTimeout(350); const s5 = await st(); ok(!s5.on.length && !s5.q, "Clear clears");
await menu("Manage views"); 
ok(await p.evaluate(() => document.querySelectorAll("#modal .k3-vm-r").length) === seeds + 1 && await p.evaluate(`!!${mine("My saved view")}`), "manage lists the saved view beside the seeded ones");
await p.evaluate(`(() => { const i = ${mine("My saved view")}.querySelector(".k3-vm-n"); i.value = "Renamed view"; i.dispatchEvent(new Event("change", { bubbles: true })); })()`); await p.waitForTimeout(250);
await p.evaluate(`[...${mine("Renamed view")}.querySelectorAll(".btn")].find((b) => /Delete/.test(b.textContent)).click()`); await p.waitForTimeout(150);
ok(await p.evaluate(() => !!document.querySelector("#modal .k3-vm-r.ask")), "delete asks first");
await p.evaluate(() => [...document.querySelectorAll("#modal .k3-vm-r.ask .btn")].find((b) => /Keep/.test(b.textContent)).click()); await p.waitForTimeout(150);
ok(await p.evaluate(`!!${mine("Renamed view")}`), "rename kept; Keep keeps the view");
await p.evaluate(`[...${mine("Renamed view")}.querySelectorAll(".btn")].find((b) => /Delete/.test(b.textContent)).click()`); await p.waitForTimeout(150);
await p.evaluate(() => [...document.querySelectorAll("#modal .k3-vm-r.ask .btn")].find((b) => /Delete view/.test(b.textContent)).click()); await p.waitForTimeout(250);
ok(await p.evaluate(() => document.querySelectorAll("#modal .k3-vm-r").length) === seeds && !(await p.evaluate(`!!${mine("Renamed view")}`)), "deleted; the seeded views stay");
await p.click("#modal [data-k3-close]"); await p.waitForTimeout(150);
await p.click("#main .k3-vbtn"); ok(await p.evaluate(() => ![...document.querySelectorAll("#main .k3-vlist .k3-vi")].some((e) => /Renamed|My saved/.test(e.textContent))), "the menu no longer lists it");
console.log(`views on ${route}: ${pass} passed, ${fail} failed; page errors ${errs.length}`, errs.slice(0, 3));
await b.close();
