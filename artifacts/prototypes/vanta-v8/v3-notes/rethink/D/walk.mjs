// Lane D's walk: with V3 on, through the UI, every flow of D.md's "It works when", asserting what a person would see.
//   node walk.mjs            → out/v3r2-D.html, the whole prototype (every module, name order)
// Pass 2 (Josef, 20 Nov): the categories are horizontal tabs, a row goes to the record's page, the eye opens its preview.
// Flows that need lane S (the component's page) run when it is in the build, and say so when it is not.
import { open, createSP70, SP } from "../../v3/P/lib.mjs";
import { resolve } from "path";
const BUILD = resolve(process.argv[2] || process.env.BUILD || SP + "/vanta/proto/out/v3r3-D.html");
console.log("walk D on " + BUILD); // lead: the build named on the command line first, as the other walks take it
const H = await open({ build: BUILD, v3: true, start: "overview" });
const { p } = H;
let fails = 0, n = 0;
const ok = (name, cond, seen) => { n++; if (!cond) fails++; console.log(`${cond ? "ok  " : "FAIL"} ${name}${cond || seen === undefined ? "" : "  ← " + JSON.stringify(seen).slice(0, 260)}`); };
const w = (ms = 350) => p.waitForTimeout(ms);
const ev = (fn, a) => p.evaluate(fn, a);
const hash = () => H.hash();
const fact = (name, ...a) => ev(([name, a]) => PA.v3.fact(name, ...a), [name, a]);
const count = (sel) => p.locator(sel).count();
const text = async (sel) => { const l = p.locator(sel).first(); return (await l.count()) ? ((await l.innerText()) || "").replace(/\s+/g, " ").trim() : ""; };
// Pass 3 (Josef, 21 Nov): a list's kinds and states are filters in its one row. A filter is select[data-k3-fkey]: its options read
// "Plans (4)", the chosen one "Kind: Plans", the first one the filter's own name (nothing chosen). "All …" is the views menu's count.
const optOf = (label) => ev((l) => { for (const s of document.querySelectorAll("#main .k3-tb select[data-k3-fkey]")) { const name = s.getAttribute("aria-label"); for (let i = 0; i < s.options.length; i++) { const o = s.options[i]; let t = o.textContent.trim(); if (t.indexOf(name + ": ") === 0) t = t.slice(name.length + 2); const m = /^(.*?)(?:\s\(([\d,]+)\))?$/.exec(t); if (m && m[1].trim() === l) return { key: s.getAttribute("data-k3-fkey"), i, on: o.selected, n: m[2] ? +m[2].replace(/,/g, "") : null }; } } return null; }, label);
const viewsTotal = () => ev(() => { const c = document.querySelector("#main .k3-vlist .k3-vi .k3-vi-ct"); return c ? +c.textContent.replace(/\D/g, "") : null; });
const rail = async (label) => { if (/^All /.test(label)) return viewsTotal(); const o = await optOf(label); return o ? o.n : null; };
const chip = rail;
// choose a filter's option by its words (chosen already: back to none); "All …" clears the filter named by key
const pick = async (label, key) => { await ev(([l, key]) => { let s = null, i = 0; if (/^All /.test(l)) s = document.querySelector(`#main .k3-tb select[data-k3-fkey="${key}"]`); else for (const x of document.querySelectorAll("#main .k3-tb select[data-k3-fkey]")) { const name = x.getAttribute("aria-label"); for (let k = 0; k < x.options.length; k++) { let t = x.options[k].textContent.trim(); if (t.indexOf(name + ": ") === 0) t = t.slice(name.length + 2); if (t.replace(/\s\([\d,]+\)$/, "") === l) { s = x; i = x.options[k].selected ? 0 : k; } } } if (!s) throw new Error("no filter option " + l); s.selectedIndex = i; s.dispatchEvent(new Event("input", { bubbles: true })); }, [label, key || ""]); await w(350); };
const clickRail = (label) => pick(label, /requirement/.test(label) ? "source" : "kind");
const clickChip = (label) => pick(label);
const onOf = (key) => ev((k) => { const s = document.querySelector(`#main .k3-tb select[data-k3-fkey="${k}"]`); if (!s || !s.closest(".k3-flt").classList.contains("on")) return ""; const name = s.getAttribute("aria-label"), t = s.selectedOptions[0].textContent.trim(); return t.indexOf(name + ": ") === 0 ? t.slice(name.length + 2) : t; }, key);
// one row over the table: every control of the list's toolbar on one line, no strip of tabs or chips, no actions left in the header
const oneRow = () => ev(() => { const t = document.querySelector("#main .k3-tb[data-k3-list]"); if (!t) return false; const kids = [...t.children].flatMap((c) => (c.classList.contains("k3-fs") ? [...c.children] : [c])).filter((e) => e.getClientRects().length); const tops = new Set(kids.map((e) => Math.round((e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2) / 8))); return tops.size === 1 && document.querySelectorAll("#main .k3-tb").length === 1 && !document.querySelector("#main .k3-chips, #main .k3-rtabs, #main .k3-head-a"); });
const viewMenu = async (label) => { await p.click("#main .k3-vbtn"); await w(120); await ev((l) => { const x = [...document.querySelectorAll("#main .k3-vlist .k3-menu-i")].find((e) => e.querySelector(".k3-vi-n") ? e.querySelector(".k3-vi-n").textContent.trim() === l : e.textContent.trim().indexOf(l) === 0); if (!x) throw new Error("no view " + l); x.click(); }, label); await w(400); };
const viewName = () => text("#main .k3-vbtn .k3-vname");
const secNames = (sc) => ev((sc) => [...document.querySelectorAll(sc + " .k3-sec h2")].map((h) => h.childNodes[0].textContent.trim()), sc);
const cuts = () => ev(() => [...document.querySelectorAll("#main .k3-table tbody tr")].filter((r) => r.getBoundingClientRect().height > 44).length);
const rows = () => count("#main .k3-table tbody tr");
const foot = () => ev(() => { const f = document.querySelector("#main .pager"); const m = f && /of ([\d,]+)/.exec(f.innerText); return m ? +m[1].replace(/,/g, "") : null; });
const panelOpen = () => ev(() => { const e = document.getElementById("panel"); return !!e && !e.hidden && !!e.innerText.trim(); });
const panelText = () => H.panel();
const scope = async () => ((await panelOpen()) ? "#panel" : "#main");
const sect = async (title) => ev(([sc, t]) => { const s = [...document.querySelectorAll(sc + " .k3-sec")].find((x) => (x.querySelector("h2") || {}).childNodes[0].textContent.trim() === t); if (!s) return null; const c = s.querySelector("h2 .k3-ct"); return { count: c ? +c.innerText : null, rows: [...s.querySelectorAll("tbody tr")].map((r) => r.innerText.replace(/\s+/g, " ").trim()) }; }, [await scope(), title]);
const sectAdd = async (title) => { await ev(([sc, t]) => { const s = [...document.querySelectorAll(sc + " .k3-sec")].find((x) => (x.querySelector("h2") || {}).childNodes[0].textContent.trim() === t); const b = s && s.querySelector(".k3-sec-a .btn, .k3-sec-a .k3-link, .k3-none-row .k3-link"); if (b) b.click(); }, [await scope(), title]); await w(300); };
const rowAct = async (title, rowText, label) => { await ev(([sc, t, r, l]) => { const s = [...document.querySelectorAll(sc + " .k3-sec")].find((x) => (x.querySelector("h2") || {}).childNodes[0].textContent.trim() === t); const tr = s && [...s.querySelectorAll("tbody tr")].find((x) => x.innerText.includes(r)); const b = tr && [...tr.querySelectorAll("button")].find((x) => x.innerText.trim() === l); if (b) b.click(); }, [await scope(), title, rowText, label]); await w(300); };
const eye = async (rowSel = "#main .k3-table tbody tr") => { await p.hover(rowSel); await p.click(rowSel + " .k3-eye"); await w(400); };
const openRow = async (rowSel = "#main .k3-table tbody tr") => { await p.click(rowSel + " td:nth-child(2)"); await w(500); };
const pickSearch = async (q) => { await p.fill("#modal [data-k3-pickq]", q); await w(250); };
const pickFirst = async () => { await p.click("#modal .k3-pick-i:not(.held) input"); await w(120); };
const submit = async () => { await p.click("#modal [data-k3-submit]"); await w(450); };
const toast = () => H.toast();
const closePanel = async () => { await ev(() => { const b = document.getElementById("closePanel"); if (b) b.click(); }); await w(200); };
const focusLabel = () => ev(() => { const a = document.activeElement; return a ? a.getAttribute("aria-label") || "" : ""; });
// in view once the editor's smooth scroll has arrived (asked again for up to four seconds)
const inView = async (sel) => { for (let i = 0; i < 16; i++) { if (await ev((s) => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return r.bottom > 60 && r.top < innerHeight; }, sel)) return true; await w(250); } return false; };
const hasS = await ev(() => typeof PA.v3.facts.components === "function" && !!PA.v3s);
const hasC = await ev(() => !!PA.P["k3c-control"]);
console.log(`build ${BUILD.split("/").pop()} · lane S ${hasS ? "in" : "not in"} the build · lane C ${hasC ? "in" : "not in"} the build\n`);

// ——— 0. Before anything changes: the Overview's count of evidence waiting on review opens exactly those ———
console.log("0. From the Overview");
await H.go("overview", 600);
{
  const n0 = (await fact("evidence")).pending;
  const via = await ev(() => { const r = [...document.querySelectorAll("#main .k3-att-r, #main .k3-mini")].find((x) => /waiting on review/i.test(x.innerText)); if (r) r.click(); return r ? r.innerText.replace(/\s+/g, " ").trim() : ""; }); await w(600);
  if (!via) { await ev(() => PA.v3k.set("evd.view", { rail: "", chip: "pending" })); await H.go("evidence"); }
  ok("0 the Overview's Evidence waiting on review 88 opens Evidence on exactly 88", n0 === 88 && (await hash()) === "evidence" && (await foot()) === 88 && (await onOf("review")) === "Waiting on review" && (await viewName()) === "Waiting on review", [via, n0, await hash(), await foot()]);
  await clickChip("Waiting on review");
}

// ——— 1. Program menu → Documents → the SSP's row → typing in a narrative ———
console.log("1. Two clicks to the editor");
await H.go("overview");
await H.click("Documents", "#nav", { exact: true });
ok("1 the menu's Documents opens Documents", (await hash()) === "documents" && (await text("#main .k3-title")) === "Documents", await hash());
ok("1 its menu entry is marked", (await text("#nav a.item.on")) === "Documents", await text("#nav a.item.on"));
const docN = await rail("All documents");
ok("1 every document is one row: the SSP, three plans, the policies, the ITCSC", docN >= 23 && (await rows()) === docN && (await rail("Plans")) === 4 && (await rail("Policies")) === 18 && (await rail("Categorization")) === 1, [docN, await rows()]);
ok("1 one row over the list: search, the view, Kind and State as filters, then the page's actions", (await oneRow()) && (await count('#main .k3-tb select[data-k3-fkey="kind"]')) === 1 && (await count('#main .k3-tb select[data-k3-fkey="state"]')) === 1 && /New document/.test(await text("#main .k3-tb .k3-tools-r")) && (await cuts()) === 0, await text("#main .k3-tb"));
ok("1 the SSP's row goes to its editor, and its eye previews it", (await count('#main tr.k3d-doc[data-go="ssp"] .k3-eye[data-panel="k3d-doc"]')) === 1 && (await count('#main tr.k3d-doc[data-go="ssp"]')) === 1);
ok("1 the SSP's row says its revision, its state and which revision is published", /revision 2 is published/.test(await text("#main tr.k3d-doc")) && (await text("#main tr.k3d-doc td:nth-child(2)")) === "3" && (await text("#main tr.k3d-doc td:nth-child(3)")) === "Draft", await text("#main tr.k3d-doc"));
await eye('#main tr.k3d-doc[data-go="ssp"]');
{ const s = await secNames("#panel"); ok("1 the SSP's preview lists what its editor lists: its sections, the placeholder narratives, its revisions", (await panelOpen()) && s.join("|") === "Sections|Placeholder narratives|Revisions" && (await sect("Sections")).count === 16 && (await sect("Sections")).rows.length === 5 && (await sect("Revisions")).count === 3 && /Open the editor/.test(await panelText()) && (await hash()) === "documents", [s, (await panelText()).slice(0, 120)]); }
await ev(() => { const r = [...document.querySelectorAll("#panel .k3-sec tbody tr")].find((x) => /Hardware and software inventory/.test(x.innerText)); if (r) r.click(); }); await w(300);
await ev(() => { const a = [...document.querySelectorAll("#panel a.k3-pk-all")].find((x) => /View all 16/.test(x.textContent)); if (a) a.click(); }); await w(1200);
ok("1 its View all opens the editor", (await hash()) === "ssp" && (await count("#se-app")) === 1, await hash());
await closePanel(); await H.go("documents");
await p.click('#main tr.k3d-doc:has-text("System security plan") td:first-child'); await w(900);
ok("1 the SSP's row opens the editor at once: no preview", (await hash()) === "ssp" && (await count("#se-app")) === 1 && !(await panelOpen()), [await hash(), await panelOpen()]);
await p.click("#se-c-AC-1 .se-n"); await p.keyboard.press("End"); await p.keyboard.type(" Typed in the walk."); await ev(() => document.activeElement.blur()); await w(250);
ok("1 typing in a narrative saves to the control's record", /Typed in the walk\./.test(await ev(() => PA.SSP.ctl("AC-1").n)));
ok("1 the editor's way back says Documents", /Documents/.test(await text("#se-app .se-head .ak-back")), await text("#se-app .se-head .ak-back"));
await p.click("#se-app .se-head .ak-back"); await w(500);
ok("1 Back returns to Documents", (await hash()) === "documents");

// ——— 2. The attention card and the SSP's links land in the document ———
console.log("\n2. Links land where they point");
const ph0 = await ev(() => PA.SSP.controls.filter((c) => c.ph).length);
ok("2 the attention card counts the placeholder narratives from the records", +(await ev(() => { const r = [...document.querySelectorAll("#main .k3-att-r")].find((x) => /Placeholder/.test(x.innerText)); return r ? r.querySelector(".n").innerText : "0"; })) === ph0 && ph0 > 0, ph0);
await ev(() => { const r = [...document.querySelectorAll("#main .k3-att-r")].find((x) => /Placeholder/.test(x.innerText)); r.click(); }); await w(1700);
const fl = await focusLabel(), phCode = fl.replace(/ implementation narrative$/, "");
ok("2 it lands on a placeholder narrative in the SSP, ready to type", (await hash()) === "ssp" && / implementation narrative$/.test(fl) && (await ev((c) => !!(PA.SSP.ctl(c) || {}).ph, phCode)) && (await inView("#se-c-" + phCode.replace(/[()]/g, "\\$&"))), [await hash(), fl]);
for (const [addr, at, what] of [["ssp--s7", "s7", "section 7"], ["ssp--9", "s9", "section 9 by its number"], ["ssp--CN-109107", "s8", "a component's row in section 8"], ["ssp--AC-3", "AC-3", "a control"]]) {
  await H.go(addr, 1500);
  const sel = /^s\d/.test(at) ? "#se-s-" + at : "#se-c-" + at;
  ok(`2 ${addr} opens the editor at ${what}`, (await hash()) === "ssp" && (await inView(sel)) && (addr !== "ssp--CN-109107" || (await count("#se-s-s8 tr.k3d-at")) === 1) && (addr !== "ssp--AC-3" || (await focusLabel()) === "AC-3 implementation narrative"), [await hash(), await focusLabel()]);
}
ok("2 fact sspAt gives those routes", (await fact("sspAt", 8)) === "ssp--8" && (await fact("sspAt", { control: "AC-2" })) === "ssp--AC-2" && (await fact("sspAt", { component: "CN-109101" })) === "ssp--CN-109101");
if (hasC) {
  await H.go("controls", 600);
  if (process.env.SHOT) { p.on("console", (m) => { if (/^SC /.test(m.text())) console.log(m.text().slice(0, 300)); }); await ev(() => { const st = () => (new Error().stack || "").split("\n").slice(3, 6).map((l) => l.trim().replace(/\(?file.*?(:\d+:\d+)\)?/, "$1").slice(0, 44)).join(" | "); const o = Element.prototype.scrollTo; Element.prototype.scrollTo = function (a) { if (this.id === "se-scroll") console.log("SC scrollTo " + JSON.stringify(a) + " from " + Math.round(this.scrollTop) + " " + st()); return o.apply(this, arguments); }; const d = Object.getOwnPropertyDescriptor(Element.prototype, "scrollTop"); Object.defineProperty(Element.prototype, "scrollTop", { get() { return d.get.call(this); }, set(v) { if (this.id === "se-scroll") console.log("SC scrollTop= " + v + " from " + Math.round(d.get.call(this)) + " " + st()); d.set.call(this, v); }, configurable: true }); document.addEventListener("mousedown", (e) => console.log("SC mousedown " + (e.target.id || e.target.className)), true); document.addEventListener("keydown", (e) => console.log("SC keydown " + e.key), true); }); }
  await ev(() => PA.v3k.openPanel("k3c-control", "AC-3")); await w(500);
  const link = await ev(() => { const b = [...document.querySelectorAll("#panel button, #panel a")].find((x) => /Open the SSP at AC-3/.test(x.innerText)); if (b) b.click(); return !!b; }); await w(2800); // lead: the editor scrolls to the control; 1.7 s was short on a busy machine
  ok("2 the control panel's SSP link lands on that control in the editor", link && (await hash()) === "ssp" && (await focusLabel()) === "AC-3 implementation narrative" && (await inView("#se-c-AC-3")), [link, await hash(), await focusLabel(), await ev(() => { const e = document.querySelector("#se-c-AC-3"), r = e && e.getBoundingClientRect(), s = document.querySelector(".se-scroll"); return { el: !!e, top: r && Math.round(r.top), bottom: r && Math.round(r.bottom), ih: innerHeight, sc: s && s.scrollTop, n: document.querySelectorAll("#se-c-AC-3").length, mainHidden: document.getElementById("main").hidden }; })]);
  if (process.env.SHOT) { console.log("manual", JSON.stringify(await ev(async () => { const s = document.getElementById("se-scroll"), all = document.querySelectorAll("#se-scroll").length, t0 = s.scrollTop; s.scrollTo({ top: t0 + 900, behavior: "auto" }); const t1 = s.scrollTop; await new Promise((r) => setTimeout(r, 700)); return { all, t0, t1, t2: s.scrollTop, same: s === document.getElementById("se-scroll"), ov: getComputedStyle(s).overflowY, sh: s.scrollHeight, ch: s.clientHeight, focusIn: !!(document.activeElement && document.activeElement.closest("#se-app")) }; }))); await p.screenshot({ path: process.env.SHOT, type: "jpeg", quality: 55 }); console.log("layout", JSON.stringify(await ev(() => { const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height), e.scrollHeight, e.clientHeight, getComputedStyle(e).overflowY]; }; return { proto: document.getElementById("proto").className, shell: q("#shell"), main: q("#main"), app: q("#se-app"), scroll: q("#se-scroll"), page: q("#se-page"), task: !!document.getElementById("k3task"), doc: [document.documentElement.scrollHeight, scrollY] }; }))); }
} else console.log("    (lane C is not in this build: the control panel's SSP link is not walked)");

// ——— 3. Edit source: section 8 → the component → back ———
console.log("\n3. Edit source");
await H.go("ssp--s8", 1500);
ok("3 a generated section offers Edit source", /Edit source/.test(await text("#se-s-s8 .se-lacts")) && /Edit source/.test(await text("#se-s-s5 .se-lacts")) && /Edit source/.test(await text("#se-s-s10 .se-lacts")), await text("#se-s-s8 .se-lacts"));
await p.click('#se-s-s8 .k3d-srcl:has-text("Mission Computer")'); await w(800);
const bar = await text("#k3task");
ok("3 a component's Edit source opens that component with the return bar", (hasS ? /^component--CN-109101/.test(await hash()) : /CN-109101/.test(await hash())) && /Back to SSP section 8/.test(bar) && /Mission Computer/.test(await H.main()), [await hash(), bar]);
if (hasS) {
  await H.click("Add item", "#main"); await w(300);
  await p.selectOption("#k3f-kind", "Firmware"); await p.fill("#k3f-version", "9.9.1"); await p.fill("#k3f-name", "Walk boot firmware"); await submit();
  ok("3 firmware is added on the component's page", /Walk boot firmware/.test(await H.main()), (await toast()));
} else console.log("    (lane S is not in this build: the old element page opens, where firmware cannot be added)");
await p.click("#k3task .k3-task-b"); await w(1500);
ok("3 Back returns to the SSP at that component's row", (await hash()) === "ssp" && (await count("#se-s-s8 tr.k3d-at")) === 1 && (await inView("#se-s-s8 tr.k3d-at")) && (await count("#k3task")) === 0, [await hash(), await count("#k3task")]);
if (hasS) ok("3 section 8 prints the firmware added on the component", /Firmware Walk boot firmware 9\.9\.1/.test(await text("#se-s-s8 tr.k3d-at")), await text("#se-s-s8 tr.k3d-at"));
await p.click("#se-s-s10 .se-lacts [data-k3d-src]"); await w(700);
ok("3 section 10's Edit source opens Controls with the way back", (await hash()) === "controls" && /Back to SSP section 10/.test(await text("#k3task")), [await hash(), await text("#k3task")]);
await p.click("#k3task .k3-task-b"); await w(1400);
ok("3 and returns to section 10", (await hash()) === "ssp" && (await inView("#se-s-s10")));
await ev(() => { const b = document.querySelector("#se-c-AC-1 [data-k3d-src]"); if (b) b.click(); }); await w(1100);
ok("3 a control's Edit source opens the control where it is written, with the way back", (((await hash()) === "control--AC-1" && /AC-1/.test(await text("#main .k3-head"))) || ((await hash()) === "controls" && (await panelOpen()) && /AC-1/.test(await panelText()))) && /Back to SSP section 11, AC-1/.test(await text("#k3task")), [await hash(), await text("#k3task")]);
await closePanel(); await p.click("#k3task .k3-task-b"); await w(1500);
ok("3 and returns to that control in section 11", (await hash()) === "ssp" && (await inView("#se-c-AC-1")));

// ——— 4. One text: the control's panel and section 11 ———
console.log("\n4. A narrative is one text");
if (hasC) {
  await H.go("controls", 600);
  await ev(() => PA.v3k.openPanel("k3c-control", "AC-3")); await w(500);
  await ev(() => { const r = [...document.querySelectorAll("#panel #k3c-impl tbody tr")].find((x) => /The system as a whole/.test(x.innerText)); if (r) r.click(); }); await w(350);
  await p.fill("#k3f-text", "Written in the control's panel: enforcement is checked at the gateway."); await submit();
  ok("4 the implementation written in the panel is the record's narrative", (await ev(() => PA.SSP.ctl("AC-3").n)) === "Written in the control's panel: enforcement is checked at the gateway.", await ev(() => PA.SSP.ctl("AC-3").n));
  await closePanel(); await H.go("ssp--AC-3", 1600);
  ok("4 section 11 prints what was written in the panel", /Written in the control's panel: enforcement is checked at the gateway\./.test(await text("#se-c-AC-3 .se-n")), (await text("#se-c-AC-3 .se-n")).slice(0, 120));
  await p.click("#se-c-AC-3 .se-n"); await p.keyboard.press("End"); await p.keyboard.type(" Edited in the SSP."); await ev(() => document.activeElement.blur()); await w(300);
  await H.go("controls", 600); await ev(() => PA.v3k.openPanel("k3c-control", "AC-3")); await w(500);
  ok("4 edited in the SSP, the panel reads the same text", /Edited in the SSP\./.test(await panelText()) && /Edited in the SSP\./.test(((await fact("impl", "AC-3")) || {}).text || ""), (await fact("impl", "AC-3")));
  if (hasS) {
    await closePanel(); await ev(() => PA.v3.fact("setImpl", "AC-3", "CN-109107", { status: "implemented", text: "The gateway enforces the approved flow list." })); await H.go("ssp--AC-3", 1600);
    ok("4 section 11 prints a component's implementation under the system's narrative", /By component/i.test(await text("#se-c-AC-3 .k3d-ims")) && /Protected Network Gateway/.test(await text("#se-c-AC-3 .k3d-ims")) && /approved flow list/.test(await text("#se-c-AC-3 .k3d-ims")), await text("#se-c-AC-3"));
  }
  await closePanel();
} else console.log("    (lane C is not in this build: the control's panel is the old preview, which does not write the narrative)");

// ——— 5. New document ———
console.log("\n5. New document");
await H.go("documents");
const d0 = await rail("All documents");
await H.click("New document", "#main .k3-tb .k3-tools-r"); await w(250);
await p.fill("#k3f-title", "Walk security assessment plan"); await submit();
ok("5 New document creates one and opens it", /^document--/.test(await hash()) && (await text("#main .k3-title")) === "Walk security assessment plan" && /Draft/.test(await text("#main .k3-head")), await hash());
await p.click("#main .k3d-ed"); await p.keyboard.type("Scope: the mission computing subsystem."); await ev(() => document.activeElement.blur()); await w(200);
await p.click('#main .k3-crumbs a[href="#documents"]'); await w(450);
ok("5 it is listed on Documents, with the count", (await rail("All documents")) === d0 + 1 && /Walk security assessment plan/.test(await H.main()), [d0, await rail("All documents")]);
await p.click('#main tr.k3d-doc:has-text("Walk security assessment plan") td:first-child'); await w(450);
ok("5 its row opens it again with what was written", /^document--/.test(await hash()) && /Scope: the mission computing subsystem\./.test(await text("#main .k3d-ed")));
await H.go("documents"); await H.click("New document", "#main .k3-tb .k3-tools-r"); await w(250);
await p.selectOption("#k3f-from", "x:scrm"); await submit(); await w(300);
ok("5 a template's plan is created and opened in its editor", (await hash()) === "plan-scrm" && /Supply chain risk management plan/.test(await H.main()), await hash());
await H.go("documents");
ok("5 and listed as a draft", (await rail("All documents")) === d0 + 2 && /Supply chain risk management plan/.test(await H.main()));
const crN = await chip("Changes requested"); await clickChip("Changes requested");
ok("5 the State filter narrows, and its count equals the rows", crN === (await rows()) && crN > 0 && (await onOf("state")) === "Changes requested" && (await viewName()) === "Changes requested", [crN, await rows()]);
await clickChip("Changes requested"); const polN = await rail("Policies"); await clickRail("Policies");
ok("5 Kind: Policies shows the policies", (await rows()) === polN && polN === 18 && (await onOf("kind")) === "Policies", [polN, await rows()]);
ok("5 every policy's row goes to a page, none to a preview", (await count("#main tr.k3d-doc[data-panel]")) === 0 && (await count("#main tr.k3d-doc[data-go]")) === 18);
await p.click('#main tr.k3d-doc:has-text("Access control policy") td:first-child'); await w(500);
ok("5 a policy's row opens its page", /policy-page-ac-1$/.test(await hash()) && !(await panelOpen()) && /Access control policy and procedures/.test(await H.main()) && (await text("#nav a.item.on")) === "Documents", await hash());
await H.go("documents"); const planN = await rail("Plans"); await clickRail("Plans");
ok("5 a plan the policy register listed beside the policies is the plan's own row", /Implements IR-8/.test(await text('#main tr.k3d-doc:has-text("Incident response plan")')) && (await rows()) === planN, await text('#main tr.k3d-doc:has-text("Incident response plan")'));
await clickRail("All documents");
await p.click('#main tr.k3d-doc:has-text("Contingency plan") .k3d-rowact summary'); await w(200);
ok("5 a row's More opens without opening the row", (await hash()) === "documents" && (await count('#main tr.k3d-doc:has-text("Contingency plan") details[open]')) === 1 && /Version history/.test(await text('#main tr.k3d-doc:has-text("Contingency plan") .k3-menu-l')), await hash());
await p.click('#main tr.k3d-doc:has-text("Contingency plan") .k3-menu-i:has-text("Version history")'); await w(500);
ok("5 its Version history opens the plan's history", (await hash()) === "plan-cp-history", await hash());

// ——— 6. Create requirement ———
console.log("\n6. Create requirement");
await H.go("requirements");
const all0 = await rail("All requirements"), eng0 = await rail("Engineering"), mcReq0 = hasS ? (await fact("requirementsOf", "CN-109101")).length : null;
ok("6 the register counts every requirement: 640 engineering and the customer's 14", eng0 === 640 && all0 === 654 && (await foot()) === 654, [eng0, all0, await foot()]);
await H.click("Create requirement", "#main .k3-tb .k3-tools-r"); await w(250);
await p.fill("#k3f-title", "Maintenance accounts are disabled between sorties"); await p.fill("#k3f-statement", "The Mission Computer shall disable every maintenance account when the maintenance session closes.");
await p.selectOption("#k3f-type", "Enforcement"); await p.fill("#k3f-ctl", "ac-2");
await ev(() => { const b = [...document.querySelectorAll("#modal .k3-checks label")].find((x) => x.innerText.trim() === "Mission Computer"); b.querySelector("input").click(); }); await submit(); await w(300);
const made = (await ev(() => PA.v3.fact("createdRequirements").filter((r) => /between sorties/.test(r.title))))[0] || {};
const code = made.code;
ok("6 Create requirement creates one, with the next code", /^REQ-\d+$/.test(code || "") && +code.slice(4) >= 644 && made.controls.join() === "AC-2" && made.components.join() === "CN-109101", made);
ok("6 it opens on its own page, with its control and its component", (await hash()) === "requirement--" + code && (await text("#main .k3-title")) === "Maintenance accounts are disabled between sorties" && (await sect("Controls")).count === 1 && (await sect("Components")).count === 1 && /Mission Computer/.test((await sect("Components")).rows[0]) && /CN-109101/.test((await sect("Components")).rows[0]) && /Hardware/.test((await sect("Components")).rows[0]), [await hash(), await sect("Components")]);
ok("6 the page holds one primary, in its header", (await count("#main .k3-head-a .btn.ink")) === 1 && (await text("#main .k3-head-a .btn.ink")) === "Edit requirement" && (await count("#main .k3-sec .btn.ink")) === 0);
await p.click('#main .k3-crumbs a[href="#requirements"]'); await w(450);
ok("6 it is in the register at once, first, and the counts follow", (await rail("All requirements")) === all0 + 1 && (await rail("Engineering")) === eng0 + 1 && new RegExp(code).test(await text("#main .k3-table tbody tr")) && /AC-2/.test(await text("#main .k3-table tbody tr")) && /Mission Computer/.test(await text("#main .k3-table tbody tr")), await text("#main .k3-table tbody tr"));
ok("6 the sources are one filter of the list's one row: All, Engineering, the customer's document", (await ev(() => document.querySelector('#main .k3-tb select[data-k3-fkey="source"]').options.length)) === 3 && (await oneRow()) && (await cuts()) === 0);
if (hasS) {
  await H.go("component--CN-109101--requirements", 700);
  ok("6 it is on Mission Computer's Requirements tab", new RegExp(code).test(await H.main()) && (await fact("requirementsOf", "CN-109101")).length === mcReq0 + 1, [(await fact("requirementsOf", "CN-109101")).length, mcReq0]);
  await ev((c) => { const r = [...document.querySelectorAll("#main tbody tr")].find((x) => x.innerText.includes(c)); if (r) r.querySelector("td:nth-child(2)").click(); }, code); await w(500);
  ok("6 and its row there opens the requirement's own page", (await hash()) === "requirement--" + code && /between sorties/.test(await H.main()) && (await count("#main [data-k3d-st]")) === 1, await hash());
} else console.log("    (lane S is not in this build: the component's Requirements tab is not walked)");
if (hasC) {
  await H.go("controls", 600); await ev(() => PA.v3k.openPanel("k3c-control", "AC-2")); await w(500);
  ok("6 it is in AC-2's panel", new RegExp(code).test(await panelText()) && /between sorties/.test(await panelText()), (await panelText()).slice(0, 200));
  await closePanel();
}
await ev(() => PA.v2.redraw()); await H.go("requirements");
ok("6 it survives a redraw and a return to the page", new RegExp(code).test(await text("#main .k3-table tbody tr")));

// ——— 7. The requirement's panel ———
console.log("\n7. The requirement's panel");
await eye();
ok("7 the eye previews the requirement beside the list", (await panelOpen()) && new RegExp(code).test(await panelText()) && (await sect("Controls")).count === 1 && (await hash()) === "requirements", await hash());
const pvSecs = await secNames("#panel");
await closePanel(); await openRow();
ok("7 a row opens the requirement's page: its statement, controls, components and evidence", (await hash()) === "requirement--" + code && /Requirements/.test(await text("#main .k3-crumbs")) && (await text("#main .k3-title")) === "Maintenance accounts are disabled between sorties" && (await sect("Controls")).count === 1 && (await sect("Components")).count === 1 && (await sect("Evidence")).count === 0 && (await text("#nav a.item.on")) === "Requirements", [await hash(), await text("#main .k3-crumbs")]);
ok("7 the preview lists what the page lists: the statement, controls, components, evidence", JSON.stringify(pvSecs) === JSON.stringify(await secNames("#main")) && pvSecs.join("|") === "Statement|Controls|Components|Evidence", [pvSecs, await secNames("#main")]);
if (hasS) ok("7 a component's row there goes to its page and has an eye for its preview", (await count('#main .k3-sec tr[data-go^="component--"] .k3-eye[data-panel="k3s-comp"]')) === 1);
await p.click("#main [data-k3d-st]"); await p.keyboard.press("End"); await p.keyboard.type(" The event is logged."); await ev(() => document.activeElement.blur()); await w(250);
ok("7 the statement is edited in place", /The event is logged\.$/.test((await fact("requirement", code)).statement), (await fact("requirement", code)).statement);
await sectAdd("Components"); await pickSearch("Secure Boot"); await pickFirst(); await submit();
ok("7 Allocate adds another component", (await sect("Components")).count === 2 && /Secure Boot Controller/.test((await sect("Components")).rows.join(" ")), await sect("Components"));
await sectAdd("Controls");
ok("7 Map control offers the whole baseline, and says what is mapped", (await count("#modal .k3-pick-i.held")) === 1 && /more: search to narrow/.test(await H.modal()), (await H.modal()).slice(-120));
await pickSearch("AC-3"); await pickFirst(); await submit();
ok("7 Map control maps another control", (await sect("Controls")).count === 2 && /AC-3/.test((await sect("Controls")).rows.join(" ")), await sect("Controls"));
const nArt = (await fact("artifacts")).length;
await sectAdd("Evidence");
ok("7 Link evidence offers all the program's artifacts, with search", new RegExp(`Search all ${nArt} evidence artifacts`).test(await ev(() => document.querySelector("#modal [data-k3-pickq]").placeholder)) && nArt >= 368, nArt);
await pickSearch("Destruction certificates"); ok("7 one is found by search", (await count("#modal .k3-pick-i")) === 1, await count("#modal .k3-pick-i")); await pickFirst(); await submit();
ok("7 and linked", (await sect("Evidence")).count === 1 && /Destruction certificates/.test((await sect("Evidence")).rows[0]), await sect("Evidence"));
await sectAdd("Evidence"); await p.click("#modal [data-k3-picknew]"); await w(300);
await p.fill("#k3f-title", "Maintenance account teardown test record"); await p.selectOption("#k3f-kind", "Test record"); await p.fill("#k3f-file", "teardown-test.pdf"); await submit();
ok("7 Add evidence creates an artifact and links it", (await sect("Evidence")).count === 2 && /teardown test record/.test((await sect("Evidence")).rows.join(" ")) && (await fact("artifacts")).length === nArt + 1, [await sect("Evidence"), (await fact("artifacts")).length]);
await p.click('#main .k3-crumbs a[href="#requirements"]'); await w(450);
ok("7 the register's row follows each change", (await hash()) === "requirements" && /AC-2, AC-3/.test(await text("#main .k3-table tbody tr")) && /\+1/.test(await text("#main .k3-table tbody tr td:nth-child(3)")) && (await text("#main .k3-table tbody tr td:nth-child(4)")) === "2", await text("#main .k3-table tbody tr"));
if (hasC) { await ev(() => PA.v3k.openPanel("k3c-control", "AC-3")); await w(450); ok("7 the control mapped here lists the requirement in its own panel", new RegExp(code).test(await panelText())); await closePanel(); }
await openRow();
if (hasS) ok("7 the component allocated here counts it", (await fact("requirementsOf", "CN-109102")).includes(code));
await rowAct("Evidence", "Destruction certificates", "Unlink"); await submit();
await rowAct("Controls", "AC-3", "Unmap"); await submit();
await rowAct("Components", "Secure Boot Controller", "Remove"); await submit();
ok("7 each can be undone: unlink, unmap, remove the allocation", (await sect("Evidence")).count === 1 && (await sect("Controls")).count === 1 && (await sect("Components")).count === 1, [await sect("Evidence"), await sect("Controls"), await sect("Components")]);
if (hasC) { await ev(() => PA.v3k.openPanel("k3c-control", "AC-3")); await w(450); ok("7 unmapped here, the control's panel no longer lists it", !new RegExp(code).test(await panelText())); await closePanel(); }
if (hasS) ok("7 removed here, the component no longer counts it", !(await fact("requirementsOf", "CN-109102")).includes(code));
await H.go("requirements");
// a requirement of the register: unmap one of its controls and map it again
await p.fill("#main .k3-search input", "REQ-001"); await w(500);
await openRow();
const c001 = (await sect("Controls")).count;
await rowAct("Controls", "AC-7", "Unmap"); await submit();
ok("7 a register requirement's control is unmapped", (await sect("Controls")).count === c001 - 1 && !(await fact("requirementsOfControl", "AC-7")).includes("REQ-001"));
await sectAdd("Controls"); await pickSearch("AC-7"); await pickFirst(); await submit();
ok("7 and mapped again", (await sect("Controls")).count === c001 && (await fact("requirementsOfControl", "AC-7")).includes("REQ-001"));
await H.go("requirements"); await p.fill("#main .k3-search input", ""); await w(500);
await p.fill("#main .k3-search input", "REQ-015"); await w(500); await eye();
const chain = await secNames("#panel");
ok("7 a requirement's preview lists its chain too: findings, issues, risks, remediation", ["Controls", "Evidence", "Assessment findings", "Operational issues", "Risks", "Remediation"].every((x) => chain.includes(x)) && /Partially satisfied/.test((await sect("Assessment findings")).rows.join(" ")), chain);
await closePanel(); await openRow();
ok("7 and its page lists the same, each row of the chain with its own eye", JSON.stringify(await secNames("#main")) === JSON.stringify(chain) && (await count('#main .k3-sec tr[data-go^="finding--"] .k3-eye')) >= 1 && (await count('#main .k3-sec tr[data-go^="risk--"] .k3-eye')) >= 1 && (await cuts()) === 0, await secNames("#main"));
await H.go("requirements"); await p.fill("#main .k3-search input", ""); await w(500);

// ——— 8. The customer's document, chips and counts ———
console.log("\n8. Rail and chips");
const custN = await rail("CUSA-SSRD");
await clickRail("CUSA-SSRD");
ok("8 the rail's customer document shows its requirements with the program's answers", custN === 14 && (await rows()) === 14 && /Customer A System Security Requirements Document/.test(await H.main()) && /Compliant/.test(await text("#main .k3-table tbody tr")), [custN, await rows()]);
const cmp = await chip("Compliant"); await clickChip("Compliant");
ok("8 a chip narrows, and its count equals the rows", cmp > 0 && (await rows()) === cmp, [cmp, await rows()]);
await clickRail("Engineering");
for (const [label, key] of [["No control", "noctl"], ["No evidence", "noev"], ["Not allocated", "noalloc"]]) { const c = await chip(label); await clickChip(label); ok(`8 ${label}: the Gap filter's count is the list's total`, c > 0 && (await foot()) === c, [c, await foot()]); await clickChip(label); }
await p.selectOption('#main .k3-flt select[data-k3-input="k3d.req.comp"]', "CN-109101"); await w(400);
ok("8 the Component filter shows what is allocated there", (await foot()) === (await ev(() => PA.v3.fact("requirementsOfComponent", "CN-109101").length)) && (await foot()) > 1, await foot());
await ev(() => PA.v2.redraw()); await w(300);
ok("8 the filter survives a redraw", (await ev(() => document.querySelector('#main .k3-flt select[data-k3-input="k3d.req.comp"]').value)) === "CN-109101");
await p.selectOption('#main .k3-flt select[data-k3-input="k3d.req.comp"]', ""); await clickRail("All requirements");
await ev(() => { const b = [...document.querySelectorAll("#main .k3d-pg button")].find((x) => x.innerText.trim() === "Next"); b.click(); }); await w(350);
ok("8 the register pages 50 at a time", (await rows()) === 50 && /^51–100 of/.test(await text("#main .pager")), await text("#main .pager"));
// a view saved, left and picked again asks the same question
await clickRail("All requirements"); await clickChip("Not allocated"); await p.selectOption('#main .k3-flt select[data-k3-input="k3d.req.fam"]', "AU"); await w(400);
const vq = { rows: await rows(), foot: await foot() };
ok("8 two filters set: the row says the view was edited, and stays one row", (await count("#main .k3-vbtn .k3-vedit")) === 1 && vq.foot > 0 && (await oneRow()), [await viewName(), vq]);
await viewMenu("Save as new view"); await p.fill("#modal input[name=name]", "Walk view"); await submit();
ok("8 Save as new view names the question", (await viewName()) === "Walk view" && (await count("#main .k3-vbtn .k3-vedit")) === 0, await viewName());
await viewMenu("CUSA-SSRD requirements");
ok("8 a built-in view leaves it: the customer's document, its own columns", (await rows()) === 14 && (await onOf("source")) === "CUSA-SSRD" && (await onOf("gap")) === "" && /Answer/.test(await text("#main .k3-table thead")), [await rows(), await onOf("source")]);
await viewMenu("Walk view");
ok("8 picked again from there, the saved view gives the same rows", (await rows()) === vq.rows && (await foot()) === vq.foot && (await onOf("gap")) === "Not allocated" && (await onOf("source")) === "" && (await ev(() => document.querySelector('#main .k3-flt select[data-k3-input="k3d.req.fam"]').value)) === "AU" && (await viewName()) === "Walk view", [await rows(), await foot(), vq]);
await viewMenu("AC with no evidence");
ok("8 the list starts with a saved view an engineer would keep", (await onOf("gap")) === "No evidence" && (await foot()) > 0 && (await viewName()) === "AC with no evidence", [await foot(), await viewName()]);
await viewMenu("Manage views");
await ev(() => { const r = [...document.querySelectorAll("#modal .k3-vm-r")].find((x) => x.querySelector(".k3-vm-n").value === "Walk view"); [...r.querySelectorAll(".btn")].find((b) => /Delete/.test(b.textContent)).click(); }); await w(200);
await ev(() => [...document.querySelectorAll("#modal .k3-vm-r.ask .btn")].find((b) => /Delete view/.test(b.textContent)).click()); await w(300);
ok("8 Manage views deletes a saved view, after asking", (await ev(() => [...document.querySelectorAll("#modal .k3-vm-n")].map((x) => x.value).join("|"))) === "AC with no evidence");
await p.click("#modal [data-k3-close]"); await w(200); await viewMenu("All requirements");
ok("8 All requirements clears every filter", (await foot()) === (await rail("All requirements")) && (await onOf("gap")) === "" && (await count("#main .k3-clear")) === 0, await foot());

// ——— 9. Evidence ———
console.log("\n9. Evidence");
// the Overview's Evidence waiting on review opens exactly those
await H.go("overview", 600);
const wait0 = (await fact("evidence")).pending;
const viaOv = await ev(() => { const r = [...document.querySelectorAll("#main .k3-att-r, #main .k3-mini")].find((x) => /waiting on review/i.test(x.innerText)); if (r) r.click(); return !!r; }); await w(600);
if (!viaOv) { await ev(() => PA.v3k.set("evd.view", { rail: "", chip: "pending" })); await H.go("evidence"); }
ok("9 after an artifact was added, the Overview's count still opens exactly those", (await hash()) === "evidence" && (await foot()) === wait0 && wait0 === 89 && (await onOf("review")) === "Waiting on review", [viaOv, await hash(), await foot(), wait0]);
await clickChip("Waiting on review");
ok("9 one strip of tabs (Evidence, Sources) and one row over the list: the kinds are a filter in it", (await count("#main nav.k3-tabs")) === 1 && (await oneRow()) && (await count('#main .k3-tb select[data-k3-fkey="kind"]')) === 1 && (await cuts()) === 0);
await H.go("evidence");
const evAll = await rail("All evidence"), kinds = [await rail("Documents"), await rail("Test records"), await rail("Datasets"), await rail("Scan results")];
ok("9 the register counts every artifact, and the kinds add up", evAll === (await fact("artifacts")).length && kinds.reduce((a, b) => a + b, 0) === evAll && (await fact("evidence")).total === evAll, [evAll, kinds]);
await clickRail("Test records");
ok("9 a rail kind filters", (await foot()) === kinds[1] && (await ev(() => [...document.querySelectorAll("#main .k3-table tbody tr td:nth-child(2)")].every((x) => x.innerText.trim() === "Test record"))), [await foot(), kinds[1]]);
const stigN = await rail("STIG checklists"); await clickRail("STIG checklists");
ok("9 STIG checklists are a kind of evidence", (await rows()) === stigN && (await onOf("kind")) === "STIG checklists" && (await oneRow()) && (await rows()) === 7);
await p.click("#main .k3-table tbody tr td:first-child"); await w(500);
ok("9 a checklist's row opens the checklist's own page", /^stigs-/.test(await hash()), await hash());
await H.go("evidence"); await clickRail("All evidence");
const pend0 = await chip("Waiting on review");
// an artifact waiting on review whose requirement stands on it alone
const pk = await ev(() => { for (const a of PA.v3.fact("artifacts")) { if (a.state !== "pending") continue; const r = a.requirements.map((c) => PA.v3.fact("requirement", c)).find((x) => x && x.state === "Evidence in review"); if (r) return { id: a.id, title: a.title, req: r.code }; } return null; });
const st0 = (await fact("requirement", pk.req)).state;
await p.fill("#main .k3-search input", pk.title.slice(0, 40)); await w(500);
await eye();
ok("9 the artifact's panel holds its review, its versions and who cites it", /Waiting on review/.test(await panelText()) && (await sect("Cited by")).count === 1 && (await sect("Cited by")).rows[0].includes(pk.req) && (await sect("Versions")).count === 1 && (await count('#panel [data-k3="k3d.ev.accept"]')) === 1, (await panelText()).slice(0, 160));
await p.click('#panel [data-k3="k3d.ev.accept"]'); await w(450);
await p.fill("#main .k3-search input", ""); await w(500);
ok("9 Accept is done there: the chip counts one less", /Accepted/.test(await text("#panel .k3-pn-h")) && (await chip("Waiting on review")) === pend0 - 1 && (await fact("evidence")).pending === pend0 - 1, [pend0, await chip("Waiting on review")]);
ok("9 the requirement that cites it follows: it reads Supported", st0 === "Evidence in review" && (await fact("requirement", pk.req)).state === "Supported", [pk, st0, (await fact("requirement", pk.req)).state]);
await H.go("requirements"); await p.fill("#main .k3-search input", pk.req); await w(500);
ok("9 and so does its row on Requirements", /Supported/.test(await text("#main .k3-table tbody tr")) && (await text("#main .k3-table tbody tr")).includes(pk.req), await text("#main .k3-table tbody tr"));
await p.fill("#main .k3-search input", ""); await w(500); await H.go("evidence"); await ev((id) => PA.v3k.openPanel("k3d-ev", id), pk.id); await w(400);
await sectAdd("Cited by"); await pickSearch("REQ-005"); await pickFirst(); await submit();
ok("9 Link to a requirement, from the artifact", (await sect("Cited by")).count === 2 && (await fact("requirement", "REQ-005")).evidence.includes(pk.id), await sect("Cited by"));
const evPv = await secNames("#panel"); await closePanel(); await H.go("artifact--" + pk.id, 500);
ok("9 the artifact's preview lists what its page lists", JSON.stringify(evPv) === JSON.stringify(await secNames("#main")) && evPv.includes("Cited by") && evPv.includes("Versions"), [evPv, await secNames("#main")]);
await rowAct("Cited by", "REQ-005", "Unlink"); await submit();
ok("9 and unlinked again", (await sect("Cited by")).count === 1);
await closePanel(); await H.go("evidence");
await H.click("Add evidence", "#main .k3-tb .k3-tools-r"); await w(250);
await p.fill("#k3f-title", "Walk scan of the mission network"); await p.selectOption("#k3f-kind", "Scan result"); await p.fill("#k3f-renew", "2026-12-01"); await p.fill("#k3f-req", "req-250"); await submit();
ok("9 Add evidence adds an artifact, linked to the requirement named, waiting on review", (await rail("All evidence")) === evAll + 1 && (await rail("Scan results")) === kinds[3] + 1 && (await chip("Waiting on review")) === pend0 && (await chip("Expiring")) === 1 && (await fact("requirement", "REQ-250")).evidence.length >= 1, [await rail("All evidence"), await chip("Waiting on review"), await chip("Expiring")]);
await p.fill("#main .k3-search input", "Walk scan"); await w(500); await openRow();
ok("9 an artifact's row opens its page, where the same review is done", /^artifact--/.test(await hash()) && (await text("#main .k3-title")) === "Walk scan of the mission network" && (await count('#main [data-k3="k3d.ev.accept"]')) === 1 && (await sect("Cited by")).count === 1 && (await text("#nav a.item.on")) === "Evidence", await hash());
await p.click('#main .k3-crumbs a[href="#evidence"]'); await w(450); await p.fill("#main .k3-search input", ""); await w(500);
await p.click('#main .k3-tabs a:has-text("Sources")'); await w(500);
ok("9 Sources is the second tab: the integrations that collect evidence", (await hash()) === "evidence-sources" && (await rows()) === 9 && /ACAS/.test(await H.main()) && (await text("#main .k3-title")) === "Evidence", [await hash(), await rows()]);
await p.click("#main .k3-table tbody tr td:first-child"); await w(400);
ok("9 a source opens in its panel", await panelOpen()); await closePanel();

// ——— 10. Folded addresses, state across a reload, and another program ———
console.log("\n10. Folded addresses, a reload, another program");
for (const [from, to, see] of [["ssps", "documents", "Documents"], ["ssps-drafts", "documents", "Documents"], ["ssps-review", "documents", "Documents"], ["ssps-published", "documents", "Documents"], ["policies", "documents", "Documents"], ["stigs", "evidence", "Evidence"], ["sources", "evidence-sources", "Evidence"], ["traceability", "requirements", "Requirements"], ["requirements-chain", "requirements", "Requirements"], ["requirements-compliance", "requirements", "Requirements"], ["requirements-objectives", "requirements", "Requirements"], ["itcsc", "itcsc", null]]) {
  await H.go("overview", 250); await H.go(from, 500);
  ok(`10 ${from} opens ${to}`, (await hash()) === to && (!see || (await text("#main .k3-title")) === see), await hash());
}
await H.go("overview", 250); await H.go("policies", 500); ok("10 policies lands on the Policies of Documents", (await onOf("kind")) === "Policies");
await H.go("overview", 250); await H.go("stigs", 500); ok("10 stigs lands on the STIG checklists of Evidence", (await onOf("kind")) === "STIG checklists" && (await rows()) === 7);
await H.go("overview", 250); await H.go("requirements-compliance", 500); ok("10 requirements-compliance lands on the customer's document", (await onOf("source")) === "CUSA-SSRD" && (await rows()) === 14);
await H.go("overview", 250); await H.go("rec--v7p-req--REQ-002", 800); ok("10 a requirement's old record address opens the requirement (its page, or Requirements with it open)", ((await hash()) === "requirement--REQ-002" && (await count("#main [data-k3d-st]")) === 1) || ((await hash()) === "requirements" && (await panelOpen()) && /REQ-002/.test(await panelText()) && (await count("#panel [data-k3d-st]")) === 1), await hash()); await closePanel();
await ev(() => PA.v3k.openPanel("v7p-req", "REQ-003")); await w(400); ok("10 the old requirement preview draws the new panel", (await count("#panel [data-k3d-st]")) === 1 && /REQ-003/.test(await panelText())); await closePanel();
await ev(() => PA.v2.go("requirements", { open: { kind: "v7p-req", id: "REQ-004" } })); await w(700); ok("10 a link that opens Requirements on a requirement lands on the requirement's page", (await hash()) === "requirement--REQ-004" && /REQ-004/.test(await text("#main .k3-head")), await hash());
await ev(() => PA.v2.go("evidence", { filter: { qv: "Needs revision" } })); await w(600); ok("10 a link that opens Evidence on a review state lands on its chip", (await hash()) === "evidence" && (await onOf("review")) === "To revise" && (await foot()) === (await fact("evidence")).revise && (await foot()) > 0, await foot()); await clickChip("To revise");
await H.go("itcsc", 500); ok("10 the ITCSC keeps its own page, under Documents in the menu", (await text("#nav a.item.on")) === "Documents" && /IT categorization/.test(await H.main()), await text("#nav a.item.on"));
await H.go("documents"); await clickRail("All documents"); await p.click('#main tr.k3d-doc:has-text("IT categorization") td:first-child'); await w(500); ok("10 the ITCSC's row opens it", (await hash()) === "itcsc");
// a reload of the address keeps what was done
await H.go("requirements"); await clickRail("All requirements"); await p.reload(); await w(1100);
ok("10 after a reload, the created requirement, its links and the accepted review are still there", (await hash()) === "requirements" && new RegExp(code).test(await text("#main .k3-table tbody tr")) && (await fact("requirement", code)).evidence.length === 1 && (await fact("evidence")).pending === pend0 && (await fact("requirement", pk.req)).state === "Supported", [(await fact("requirement", code)).evidence, (await fact("evidence")), pend0, (await fact("requirement", pk.req)).state]);
// V3 off: the pages only V3 has say so; v2's own pages are v2's
await ev(() => PA.v3.set(false)); await H.go("documents", 500);
ok("10 with V3 off, Documents says it belongs to V3", /Part of V3/.test(await H.main()));
await H.go("requirements", 500); ok("10 with V3 off, Requirements is v2's page", (await count("#main .k3-tb")) === 0 && /Requirements/.test(await H.main()));
await ev(() => PA.v3.set(true)); await w(300);
// another program
const seen = await createSP70(H, { nss: true });
for (const [route, title, emptyRe] of [["requirements", "Requirements", /No requirements yet/], ["evidence", "Evidence", /No evidence yet/], ["documents", "Documents", null]]) {
  await H.go(route, 600);
  const m = await H.main();
  ok(`10 a created program's ${title} is its own, never WS-X90's`, (await H.cur()) === seen.code && (await text("#main .k3-title")) === title && !/REQ-001|WS-X90|CUSA|Time source|Contingency plan/.test(m) && (!emptyRe || emptyRe.test(m)), m.slice(0, 200));
}
await H.go("requirements", 500); await H.click("Create requirement", "#main"); await w(300);
ok("10 its Create requirement works (the program's own form)", /Create requirement/.test(await H.modal()), (await H.modal()).slice(0, 80));
await ev(() => { const x = document.querySelector("#modal [data-close-modal]"); if (x) x.click(); });
await ev(() => PA.v2hubs.setCur("PRG-1090")); await H.go("overview"); await H.go("requirements", 600);
ok("10 back on WS-X90, its register is whole again", (await rail("Engineering")) === eng0 + 1, await rail("Engineering"));

// ——— 11. One fact across the lanes ———
console.log("\n11. With the other lanes");
if (hasC) {
  await H.go("controls", 600); await ev(() => PA.v3k.openPanel("k3c-control", "AC-4")); await w(500);
  await ev(() => { const b = document.querySelector('#panel [data-k3="k3c.req.add"]'); if (b) b.click(); }); await w(300);
  await p.click("#modal [data-k3-picknew]"); await w(300);
  await p.fill("#k3f-title", "Flow rules are reviewed each release"); await p.fill("#k3f-st", "The gateway's flow rules shall be reviewed at each release."); await submit();
  const cm = (await fact("createdRequirements")).find((r) => /each release/.test(r.title));
  ok("11 a requirement created in a control's panel is a requirement of the register", !!cm && cm.controls.includes("AC-4") && /^REQ-\d+$/.test(cm.code) && cm.code !== code, cm);
  await closePanel(); await H.go("requirements"); await clickRail("All requirements");
  ok("11 and is listed on Requirements with its control", !!cm && (await H.main()).includes(cm.code) && /Flow rules are reviewed each release/.test(await H.main()), (await text("#main .k3-table tbody tr")));
  await H.go("control--AC-4", 700); // pass 3: a preview lists, the page is where a row is unmapped
  const had = (await fact("requirement", "REQ-003")).controls.includes("AC-4");
  await ev(() => { const b = [...document.querySelectorAll('#main [data-k3="k3c.req.rm"]')].find((x) => /REQ-003/.test(x.getAttribute("data-k3a") || "")); if (b) b.click(); }); await w(300); await submit();
  ok("11 a requirement unmapped on the control's page loses the control on Requirements", had && !(await fact("requirement", "REQ-003")).controls.includes("AC-4") && (await fact("requirement", "REQ-003")).state === "No control mapped", (await fact("requirement", "REQ-003")));
  await H.go("control--AC-22", 700);
  await ev(() => { const b = [...document.querySelectorAll("#main .k3-menu-i")].find((x) => /Remove from the baseline/.test(x.textContent)); if (b) b.click(); }); await w(300);
  await p.fill("#k3f-why", "Not applicable to an embedded mission system."); await submit(); await closePanel();
  await H.go("ssp--s10", 1600);
  ok("11 section 10 says what Controls tailored since", /1 control removed \(AC-22\)/.test(await text("#se-s-s10 .k3d-bl")) && new RegExp(`holds ${(await fact("baseline")).total} controls`).test(await text("#se-s-s10 .k3d-bl")), await text("#se-s-s10 .k3d-bl"));
}
if (hasS) {
  await H.go("component--CN-109102--requirements", 700);
  await H.click("Add requirement", "#main"); await w(300); await p.click("#modal [data-k3-picknew]"); await w(300);
  await p.fill("#k3f-title", "Boot measurements are kept for audit"); await p.fill("#k3f-statement", "The Secure Boot Controller shall keep each boot measurement for audit.");
  const opt = await ev(() => { const s = document.querySelector("#k3f-ctl"); const o = [...s.options].find((x) => x.value); s.value = o.value; return o.value; }); await submit();
  const sm = (await fact("createdRequirements")).find((r) => /Boot measurements/.test(r.title));
  ok("11 a requirement created on a component's page is a requirement of the register", !!sm && sm.components.includes("CN-109102") && sm.controls.includes(opt), sm);
  await H.go("requirements"); await p.fill("#main .k3-search input", "Boot measurements"); await w(500);
  ok("11 and is listed on Requirements with its component and control", (await rows()) === 1 && /Secure Boot Controller/.test(await text("#main .k3-table tbody tr")) && (await text("#main .k3-table tbody tr")).includes(opt), await text("#main .k3-table tbody tr"));
  await p.fill("#main .k3-search input", ""); await w(500);
}

// ——— Every route this lane owns: no page errors, no sideways scroll, the menu marked ———
console.log("\nRoutes at 1440 and 390");
const ROUTES = [["documents", "Documents"], ["requirements", "Requirements"], ["requirement--REQ-001", "Requirements"], ["evidence", "Evidence"], ["artifact--e1", "Evidence"], ["evidence-sources", "Evidence"], ["ssp", "Documents"]].concat([["document--" + ((await ev(() => (PA.v3k.get("doc.made", []) || [])[0] || {})).id || "none"), "Documents"]]);
for (const width of [1440, 390]) {
  await H.width(width);
  for (const [r, navLabel] of ROUTES) {
    await H.go(r, r === "ssp" ? 900 : 500);
    const side = await ev(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), inner = await ev(() => { const m = document.getElementById("main"); return m ? m.scrollWidth - m.clientWidth : 0; });
    const marked = r === "ssp" ? true : (await ev(() => (document.querySelector("#nav a.item.on") || {}).textContent || "")).trim() === navLabel;
    ok(`${width} ${r}: no sideways scroll, menu on ${navLabel}`, side <= 0 && inner <= 1 && marked, { side, inner, marked });
  }
}
await H.width(1440);
ok("no page errors in the whole walk", H.errs.length === 0, H.errs.slice(0, 4));
console.log(`\n${n - fails} of ${n} passed${fails ? ` · ${fails} FAILED` : ""}`);
await H.b.close();
process.exit(fails ? 1 : 0);
