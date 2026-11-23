// Lane C's walk, pass 3 (the whole build): with V3 on, through the UI. One row over the list (search, views, five filters, the
// list's actions), compact one-line rows, a row goes to the control's page and its eye opens a preview that lists what the page lists.
// node walk.mjs [build] [width]   (390 for a phone; walk.lane.mjs: pass 1, p3/walk-C.pass3-bak.mjs: pass 2)
import { open, createSP70, SP } from "../../v3/P/lib.mjs";
import path from "path";
const build = path.resolve(process.argv[2] || SP + "/vanta/proto/out/v3r3-C.html"), W = +(process.argv[3] || 1440), wide = W >= 1280;
console.log(`lane C walk, pass 3: ${build} at ${W}`);
const H = await open({ build, start: "overview", width: W }), p = H.p;
p.setDefaultTimeout(6000);
setTimeout(() => { console.log("WATCHDOG: the walk ran over 6 minutes"); process.exit(2); }, 360000);
let fails = 0, n = 0;
const ok = (c, name, extra) => { n++; if (!c) fails++; console.log(c ? "ok  " : "FAIL", name, c || extra === undefined ? "" : JSON.stringify(extra)); };
const ev = (fn, a) => p.evaluate(fn, a);
const w = (ms = 350) => p.waitForTimeout(ms);
const footTotal = () => ev(() => { const t = (document.querySelector("#main .pager .num") || {}).innerText || ""; const m = /of ([\d,]+)/.exec(t); return m ? +m[1].replace(/,/g, "") : document.querySelectorAll("#main .k3-empty").length ? 0 : -1; });
const rows = () => ev(() => [...document.querySelectorAll("#main .k3-table tbody tr")].map((tr) => ({ code: (tr.querySelector(".k3-nm-c") || {}).innerText || "", text: tr.innerText.replace(/\s+/g, " ") })));
// Pass 3: a folded filter is select[data-k3-fkey="<key>"], a classic one select[data-k3-input="<act>"]; an option reads "Label (n)",
// and the chosen one "Filter: Label".
const opts = (key, group) => ev(([key, group]) => [...document.querySelectorAll(`#main select[data-k3-fkey="${key}"] ${group ? `optgroup[label="${group}"] ` : ""}option`)].map((o) => { const t = o.textContent.trim().replace(/^(Family|Technique|Status): /, ""), m = /^(.*) \(([\d,]+)\)$/.exec(t) || [0, t, "-1"]; return { t: m[1], n: +m[2].replace(/,/g, ""), on: o.selected }; }), [key, group || ""]);
const fams = () => opts("family", "Control family");
const pick = async (key, re) => { const done = await ev(([key, re]) => { const s = document.querySelector(`#main select[data-k3-fkey="${key}"], #main select[data-k3-input="${key}"]`); if (!s) return false; const i = [...s.options].findIndex((o) => new RegExp(re).test(o.textContent.trim())); if (i < 0) return false; s.selectedIndex = i; s.dispatchEvent(new Event("input", { bubbles: true })); return true; }, [key, re]); await w(); return done; };
const stN = async (label) => ((await opts("status")).find((o) => o.t === label) || { n: -1 }).n;
const onFilters = () => ev(() => [...document.querySelectorAll("#main .k3-tb .k3-flt.on select")].map((s) => s.selectedOptions[0].textContent.trim()));
const viewN = (label) => ev((l) => { const x = [...document.querySelectorAll("#main .k3-vlist .k3-vi")].find((e) => e.querySelector(".k3-vi-n").textContent.trim() === l), c = x && x.querySelector(".k3-vi-ct"); return c ? +c.textContent.replace(/,/g, "") : -1; }, label);
const viewName = () => ev(() => (document.querySelector("#main .k3-vname") || {}).textContent || "");
const viewPick = async (label) => { await ev((l) => { const x = [...document.querySelectorAll("#main .k3-vlist .k3-vi")].find((e) => e.querySelector(".k3-vi-n").textContent.trim() === l); if (x) x.click(); }, label); await w(); };
const viewCmd = async (label) => { await ev((l) => { const x = [...document.querySelectorAll("#main .k3-vlist .k3-vcmd")].find((e) => e.textContent.trim().startsWith(l)); if (x) x.click(); }, label); await w(); };
const oneLine = (root) => ev((root) => [...document.querySelectorAll(`${root} .k3-table tbody tr`)].filter((r) => r.getClientRects().length && r.getBoundingClientRect().height > 44 && !r.querySelector("td.k3-cw")).length, root);


const cards = () => ev(() => ({ comp: +(/([\d,]+) total/.exec((document.querySelector("#main .k3-comp-f") || {}).innerText || "") || [0, "0"])[1].replace(/,/g, ""), base: +((document.querySelector("#main .k3c-base-n .num") || {}).innerText || "0").replace(/,/g, ""), layers: [...document.querySelectorAll("#main .k3c-ly")].map((x) => x.innerText.replace(/\s+/g, " ").trim()) }));
const search = async (q) => { await p.fill("#main .k3-search input", q); await w(450); };
const clear = async () => { if (await ev(() => { const t = document.querySelector("#main .k3c-setrow .k3-link"); if (t) t.click(); return !!t; })) await w(); if (await ev(() => { const c = document.querySelector("#main .k3-tb .k3-clear, #main .k3-empty .btn"); if (c) c.click(); return !!c; })) await w(); };
const find = async (code) => { if ((await H.hash()) !== "controls") await H.go("controls"); await clear(); await search(code); };
const toPage = async (code) => { await find(code); await ev((c) => { const tr = [...document.querySelectorAll("#main .k3-table tbody tr")].find((t) => (t.querySelector(".k3-nm-c") || {}).innerText === c); if (tr) tr.click(); }, code); await w(500); };
const peek = async (code) => { await find(code); await ev((c) => { const tr = [...document.querySelectorAll("#main .k3-table tbody tr")].find((t) => (t.querySelector(".k3-nm-c") || {}).innerText === c); const e = tr && tr.querySelector(".k3-eye"); if (e) e.click(); }, code); await w(500); };
const panel = () => ev(() => { const e = document.querySelector("#panel"); return e && !e.hidden ? e.innerText.replace(/[ \t]+/g, " ") : ""; });
const closePanel = async () => { await ev(() => { const c = document.getElementById("closePanel"); if (c) c.click(); }); await w(250); };
const pageChip = () => ev(() => (document.querySelector("#main .k3-head .pill") || {}).innerText || "");
const primary = () => ev(() => [...document.querySelectorAll("#main .k3-head-a .btn.ink")].map((b) => b.innerText.trim()));
const submit = async () => { await p.click("#modal [data-k3-submit]"); await w(450); };
const modalOpen = () => ev(() => !document.getElementById("modal").hidden);
const fact = (name, ...a) => ev(([name, a]) => PA.v3.fact(name, ...a), [name, a]);
const sec = (id, root = "#main") => ev(([id, root]) => { const s = document.querySelector(`${root} #${id}`); return s ? { n: +((s.querySelector(".k3-ct") || {}).innerText || "0"), text: s.innerText.replace(/\s+/g, " "), rows: s.querySelectorAll("tbody tr").length } : null; }, [id, root]);
const inSec = (id, re, what, root = "#main") => ev(([id, re, what, root]) => { const tr = [...document.querySelectorAll(`${root} #${id} tbody tr`)].find((t) => new RegExp(re).test(t.innerText)); const el = !tr ? null : what === "row" ? tr : what === "eye" ? tr.querySelector(".k3-eye") : tr.querySelector("td:last-child .btn"); if (el) el.click(); return !!el; }, [id, re, what, root]);
const addIn = (id, root = "#main") => ev(([id, root]) => { const b = document.querySelector(`${root} #${id} .k3-sec-a .btn`); if (b) b.click(); return !!b; }, [id, root]);
const navOn = () => ev(() => [...document.querySelectorAll("#nav a.item")].filter((a) => a.classList.contains("on")).map((a) => a.innerText.trim()).join("|"));
const crumbs = () => ev(() => [...document.querySelectorAll("#main .k3-crumbs a, #main .k3-crumbs span:not(.sep)")].map((x) => x.innerText.trim() + (x.getAttribute("href") ? "→" + x.getAttribute("href").slice(1) : "")));
const moreItem = async (re, root = "#main .k3-head-a") => { await ev(([re, root]) => { const it = [...document.querySelectorAll(`${root} .k3-menu-i`)].find((x) => new RegExp(re).test(x.innerText)); if (it) it.click(); }, [re, root]); await w(); };
const noPreviewOnName = (root) => ev((root) => document.querySelectorAll(`${root} [data-panel]:not(.k3-eye):not(tr)`).length, root);

try {
// ——— 1. The list: all 560; families are a dropdown beside the search, never a list down the side ———
await H.go("controls");
ok((await ev(() => (document.querySelector("#main .k3-title") || {}).innerText)) === "Controls" && (await navOn()) === "Controls", "Controls is drawn and marked in the sidebar", await navOn());
let F = await fams();
ok(F.length === 18 && F.reduce((a, x) => a + x.n, 0) === 560, "the Family filter: 18 families that add up to the 560", [F.length]);
{ const T = await opts("family", "Resiliency technique"); ok(T.length === 15 && T[0].t === "Any technique" && T[0].n > 100 && T[0].n < 560, "the same filter offers the 14 resiliency techniques, one group under the families", [T.length, T[0]]); }
ok(await ev(() => { const t = document.querySelector("#main .k3-tb[data-k3-list]"), kids = [...t.children].flatMap((c) => (c.classList.contains("k3-fs") ? [...c.children] : [c])); return [...t.querySelectorAll(".k3-flt select")].map((s) => s.getAttribute("aria-label")).join() === "Family,Status,Responsibility,Owner,Source" && kids[0].matches(".k3-search") && kids[1].matches(".k3-vmenu") && document.querySelectorAll("#main .k3-tb").length === 1 && !document.querySelector("#main .k3-chips, #main .k3-rtabs, #main nav.k3-rail, #main .k3c-showing, #main .k3-head-a") && [...t.querySelectorAll(".k3-tools-r summary")].map((s) => s.textContent.trim().replace(/\W+$/, "")).join() === "More,Add control"; }), "one row over the table: search, views, Family, Status, Responsibility, Owner, Source, then More and Add control; no strip, no line of filters, no header actions");
if (wide) ok(await ev(() => { const t = document.querySelector("#main .k3-tb[data-k3-list]"), kids = [...t.children].flatMap((c) => (c.classList.contains("k3-fs") ? [...c.children] : [c])).filter((e) => e.getClientRects().length), tops = kids.map((e) => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2)); return Math.max(...tops) - Math.min(...tops) < 6 && kids[kids.length - 1].getBoundingClientRect().right <= t.getBoundingClientRect().right + 1; }), `the row is one line at ${W}`);
ok((await oneLine("#main")) === 0, "every row of the list is one line");
ok((await footTotal()) === 560 && (await rows()).length === 50, "the list draws 50 of 560");
ok(!(await ev(() => !!document.querySelector("#main .v7p-fam, #main .ak-codes, #main .pn-sq"))), "no tile or pill of controls on the page");
{ const seen = new Set((await rows()).map((r) => r.code)); let pages = 1;
  while (await ev(() => { const b = [...document.querySelectorAll("#main .k3c-pg .btn")].find((x) => x.innerText === "Next"); return b && b.getAttribute("aria-disabled") !== "true"; })) { await ev(() => [...document.querySelectorAll("#main .k3c-pg .btn")].find((x) => x.innerText === "Next").click()); await w(120); (await rows()).forEach((r) => seen.add(r.code)); pages++; }
  ok(seen.size === 560 && pages === 12, "the pager reaches every one of the 560 in 12 pages", [seen.size, pages]); }
await H.go("controls");
const ac = F[0].n; await pick("family", "^AC ·");
F = await fams();
ok((await H.hash()) === "controls" && F[0].on && (await footTotal()) === ac && (await rows()).every((r) => r.code.startsWith("AC-")), "Access Control in the Family filter: the same page, its count equals its rows, all AC", [ac, await footTotal()]);

// ——— 2. Status, search, a completion bar, a baseline layer line and a component's controls; Clear returns all ———
const ne = await stN("No evidence");
await pick("status", "^No evidence");
ok(ne > 0 && (await footTotal()) === ne && (await onFilters()).join(" + ") === "Family: AC + Status: No evidence", "Status: No evidence narrows the family to its count", [ne, await footTotal(), await onFilters()]);
await search("account"); const afterQ = await footTotal();
ok(afterQ < ne && afterQ > 0 && (await ev(() => document.activeElement.matches(".k3-search input"))), "search narrows further and keeps the focus", afterQ);
await clear();
ok((await footTotal()) === 560 && (await ev(() => document.querySelector("#main .k3-search input").value)) === "", "Clear filters returns all 560");
const mini = await ev(() => { const m = [...document.querySelectorAll("#main .k3-mini")].find((x) => x.innerText.startsWith("With evidence")); const nn = +/([\d,]+)\//.exec(m.querySelector(".n").innerText)[1].replace(/,/g, ""); m.click(); return nn; }); await w();
ok((await footTotal()) === mini && (await onFilters()).join() === "Status: With evidence", "the With evidence bar is the Status filter: With evidence", [mini, await footTotal(), await onFilters()]);
await clear();
const want = await ev(() => { const m = PA.v3c.model(); return { add: [...m.src.entries()].filter(([c, k]) => k === "cnssi" && m.set.has(c)).length, rem: [...m.out.values()].filter((k) => k === "cnssi").length }; });
await ev(() => [...document.querySelectorAll("#main .k3c-ly")].find((x) => x.innerText.startsWith("CNSSI 1253")).click()); await w();
ok((await footTotal()) === want.add && (await onFilters()).join() === "Source: CNSSI 1253", "the CNSSI 1253 line of the Baseline card is the Source filter: what it added", [want, await footTotal(), await onFilters()]);
await pick("status", "^Tailored out");
ok(want.rem > 0 && (await footTotal()) === want.rem && (await rows()).every((r) => /CNSSI 1253 removed it/.test(r.text)), "with Status: Tailored out, what it removed", [want.rem, await footTotal()]);
await clear();
await ev(() => { PA.v3k.set("ctl.view", { comp: "CN-109101" }); PA.v3k.redraw(); }); await w();
{ const t = await footTotal(), S = await opts("status"); F = await fams();
  ok(t > 0 && t < 560 && F.reduce((a, x) => a + x.n, 0) === t && S.slice(1, 7).reduce((a, x) => a + x.n, 0) === t && /Carried by Mission Computer/.test(await ev(() => (document.querySelector("#main .k3-table tr.k3-grow") || {}).innerText || "")) && (await ev(() => document.querySelectorAll("#main .k3-tb").length)) === 1, "a component's controls (ctl.view { comp }): one band heads the table, the row over it is unchanged, and Family and Status count what Mission Computer carries", [t]);
  await ev(() => document.querySelector("#main .k3c-setrow .k3-link").click()); await w();
  ok((await footTotal()) === 560 && !(await ev(() => !!document.querySelector("#main .k3c-setrow"))), "its Show every control lists all 560 again"); }
// ——— 2b. Views: a built-in one, then one saved, left and picked again ———
{ const n = await viewN("Needs evidence"); await viewPick("Needs evidence");
  ok(n > 0 && (await footTotal()) === n && (await viewName()) === "Needs evidence" && (await onFilters()).join() === "Status: No evidence", "the built-in view Needs evidence asks Status: No evidence and counts what it lists", [n, await footTotal(), await onFilters()]);
  const fam = (await fams()).find((x) => x.n > 0 && !/^AC /.test(x.t)); // not AC: the list's seeded view asks AC with No evidence
  await pick("family", "^" + fam.t.slice(0, 2) + " ·"); const mine = (await rows()).map((r) => r.code).join(), mt = await footTotal();
  ok(/Edited/.test(await ev(() => document.querySelector("#main .k3-vbtn").textContent)), "a filter more: the view says Edited");
  await viewCmd("Save as new view"); await p.fill("#modal input[name=name]", "Still to evidence"); await submit();
  ok((await viewName()) === "Still to evidence" && !(await modalOpen()) && !/Edited/.test(await ev(() => document.querySelector("#main .k3-vbtn").textContent)), "saved under a name: it is the current view");
  await viewPick("All controls");
  ok((await footTotal()) === 560 && !(await onFilters()).length, "All controls leaves it: 560 again, nothing chosen");
  await viewPick("Still to evidence");
  ok(mt > 0 && (await rows()).map((r) => r.code).join() === mine && (await footTotal()) === mt && (await viewName()) === "Still to evidence", "picked again, the saved view lists the same rows", [mt, await footTotal()]);
  ok((await ev(() => [...document.querySelectorAll("#main .k3-vlist .k3-vi")].map((e) => e.textContent.replace(/\s+/g, " ").trim()))).some((t) => /^AC: needs evidence ?Shared ?\d+/.test(t)), "the menu starts with one saved view of the program's: AC: needs evidence, shared", await ev(() => [...document.querySelectorAll("#main .k3-vlist .k3-vi")].map((e) => e.textContent.replace(/\s+/g, " ").trim())));
  await viewPick("All controls"); }
await clear();
let C = await cards();
ok((await footTotal()) === 560 && C.comp === 560 && C.base === 560 && C.layers.length === 6 && /^NIST SP 800-53 Rev 5 High 370$/.test(C.layers[0]) && /CNSSI 1253 \+201 −17 554/.test(C.layers[1]) && /Program tailoring \+14 560/.test(C.layers[5]), "the Baseline card: 560, six layers in order with what each added and removed", C.layers);
// a lane that wraps fact("status") after this one (lane E, once a result is published) is seen by the list at draw time
{ const sat0 = (await fact("controls", "PRG-1090")).satisfied;
  await ev(() => { const prev = PA.v3.facts.status; window.__st = prev; PA.v3.facts.status = (c) => (c === "AC-1" ? "satisfied" : prev(c)); PA.v2.set("v3r.walktick", 1); PA.v3k.redraw(); }); await w();
  const r0 = (await rows())[0], done = await ev(() => +/([\d,]+) controls/.exec(document.querySelector("#main .k3-comp-f").innerText)[1].replace(/,/g, ""));
  ok(r0.code === "AC-1" && /Satisfied/.test(r0.text) && !/Partially/.test(r0.text) && done === sat0 + 1 && (await fact("controls", "PRG-1090")).satisfied === sat0 + 1, "a status another lane publishes later (a wrapper of fact(status)) shows in the row, the Completion card and fact(controls)", [r0.text.slice(0, 60), done, sat0]);
  await ev(() => { PA.v3.facts.status = window.__st; PA.v2.set("v3r.walktick", 2); PA.v3k.redraw(); }); await w();
  ok(/Partially satisfied/.test((await rows())[0].text) && (await fact("controls", "PRG-1090")).satisfied === sat0, "and it goes when the wrapper does"); }
await ev(() => document.querySelector("#main .k3-tb .k3-tools-r details.k3-menu > summary").click()); await moreItem("Export controls", "#main .k3-tb");
ok(/controls\.csv/.test(await H.toast()) || /controls\.csv/.test(await H.modal()), "Export controls saves the CSV through the kit", await H.toast());
if (await modalOpen()) { await p.keyboard.press("Escape"); await w(200); }

// ——— 3. Tailor a control in from the catalog, then one out on its page, then restore it ———
const out0 = await stN("Tailored out");
await ev(() => document.querySelector("#main .k3-tb .k3-tools-r details.k3-menu:last-of-type > summary").click()); await w(150);
await ev(() => document.querySelector("#main .k3-tb .k3-tools-r details.k3-menu:last-of-type .k3-menu-i").click()); await w();
ok((await modalOpen()) && (await ev(() => document.querySelectorAll("#modal .k3-pick-i").length)) > 20, "Add control, From the catalog: the picker lists controls outside the baseline");
await p.fill("#modal [data-k3-pickq]", "SC-7(20)"); await w(200);
const added = await ev(() => { const it = document.querySelector("#modal .k3-pick-i:not(.held)"); const c = it.querySelector(".k3-nm-c").innerText; it.querySelector("input").click(); return c; }); await w(150);
await submit();
ok((await modalOpen()) && (await ev(() => document.querySelectorAll("#modal .k3-f.bad").length)) === 1, "a rationale is required");
await p.fill("#k3f-why", "The mission threat assessment names it."); await submit();
C = await cards();
ok(!(await modalOpen()) && C.comp === 561 && C.base === 561 && (await fact("controls", "PRG-1090")).total === 561, "the total reads one more on both cards and in fact(controls)", [C.comp, C.base]);
ok((await rows()).some((r) => r.code === added && /Program tailoring/.test(r.text)) && (await fact("control", added)).source === "Program tailoring" && /\+15 561/.test((await cards()).layers[5]), `${added} is in the list, Source Program tailoring; the line reads +15 and 561`);
await toPage("AC-22");
ok((await H.hash()) === "control--AC-22" && /Publicly Accessible Content/.test(await H.main()), "AC-22's row goes to its page, control--AC-22", await H.hash());
await ev(() => document.querySelector("#main .k3-head-a details.k3-menu > summary").click()); await moreItem("Remove from the baseline");
await p.fill("#k3f-why", "Nothing of WS-X90 is publicly accessible."); await submit();
ok(/Tailored out/.test(await pageChip()) && (await primary()).join() === "Restore to the baseline" && (await fact("control", "AC-22")).inBaseline === false, "removed on its page: it says Tailored out and its one primary is Restore to the baseline", await primary());
await ev(() => document.querySelector("#main .k3-crumbs a").click()); await w(500);
await clear(); C = await cards();
ok((await H.hash()) === "controls" && C.base === 560 && C.comp === 560 && (await stN("Tailored out")) === out0 + 1 && (await fact("controls", "PRG-1090")).total === 560, "back by the breadcrumb: the total is one less everywhere, Tailored out counts one more", [C.base, await stN("Tailored out")]);
await pick("status", "^Tailored out");
ok((await rows()).some((r) => r.code === "AC-22" && /Program tailoring removed it/.test(r.text)) && (await footTotal()) === out0 + 1, "AC-22 is under Tailored out, removed by Program tailoring");
await ev(() => { const tr = [...document.querySelectorAll("#main .k3-table tbody tr")].find((t) => (t.querySelector(".k3-nm-c") || {}).innerText === "AC-22"); tr.querySelector("td:last-child .btn").click(); }); await w();
ok((await H.hash()) === "controls" && (await modalOpen()), "Restore in the row acts alone: the row is not followed");
await submit();
ok((await cards()).base === 561 && (await footTotal()) === out0 && (await fact("control", "AC-22")).inBaseline, "restored: back in the baseline, Tailored out as before");
await clear();

// ——— 4. Edit baseline: switch an overlay off, read What changes, apply; then back ———
await ev(() => document.querySelector("#main .k3c-base .btn").click()); await w();
ok((await ev(() => document.querySelectorAll("#modal .k3c-eb-r").length)) === 6 && (await ev(() => document.querySelector("#modal [data-k3-submit]").getAttribute("aria-disabled"))) === "true", "Edit baseline lists the six layers; Apply waits for a change");
await ev(() => document.querySelector('#modal .k3c-sw[aria-label="Apply Mission Assurance Overlay"]').click()); await w(200);
let wc = await ev(() => document.querySelector("#modal .k3c-eb-w").innerText.replace(/\s+/g, " "));
ok(/561 now · 566 after/.test(wc) && /AC-18\b/.test(wc) && /open/.test(await H.modal()), "What changes: 561 now, 566 after, AC-18 and its four enhancements return; it says assessments are open", wc);
await submit();
C = await cards();
ok(C.base === 566 && C.comp === 566 && /Mission Assurance Overlay Not applied/.test(C.layers[2]) && (await footTotal()) === 566 && (await fact("baseline")).layers[2].on === false && (await fact("controls", "PRG-1090")).total === 566 && (await fact("status", "AC-18")) === "no_requirement", "applied: the layer line, the totals, the list and the facts follow", C.layers);
await ev(() => document.querySelector("#main .k3c-base .btn").click()); await w();
await ev(() => document.querySelector('#modal .k3c-sw[aria-label="Apply Mission Assurance Overlay"]').click()); await w(200); await submit();
ok((await cards()).base === 561 && /Mission Assurance Overlay −5/.test((await cards()).layers[2]), "switched back: 561 again");

// ——— 5. The control's page: a page, not a stretched panel; the work is done on it ———
await toPage("AC-2");
ok((await H.hash()) === "control--AC-2" && (await navOn()) === "Controls" && (await crumbs()).join(" › ") === "Controls→controls › AC-2", "a row goes to the control's page: control--AC-2, Controls › AC-2", await crumbs());
ok((await ev(() => [...document.querySelectorAll("#main .k3-aside-b > .k3-sec")].map((s) => s.id))).join() === "k3c-status,k3c-impl,k3c-reqs,k3c-evs,k3c-objs,k3c-fnd", "its order: Status, Implementation, Requirements, Evidence, Objectives, Findings and risks", await ev(() => [...document.querySelectorAll("#main .k3-aside-b > .k3-sec")].map((s) => s.id)));
ok((await oneLine("#main")) === 0 && (await ev(() => document.querySelectorAll("#main #k3c-impl td.k3-cw").length)) > 0, "every row on the page is one line; only the implementation statement's column may wrap");
ok((await primary()).length === 1 && (await ev(() => ["k3c-impl", "k3c-reqs", "k3c-evs"].every((id) => !!document.querySelector(`#main #${id} .k3-sec-a .btn`)))) && (await ev(() => !!document.querySelector("#main .k3-aside-s .k3-det"))), "one primary in the header; Implementation, Requirements and Evidence each have their own Add; Details at the side", await primary());
ok(/Allocated to/.test((await sec("k3c-reqs")).text) && /Cited by/.test((await sec("k3c-evs")).text) && (await sec("k3c-objs")).rows === 26 && /An assessor determines that/.test((await sec("k3c-objs")).text) && /Shared with a provider/.test(await H.main()), "wider tables than the preview: Allocated to, Cited by, the 26 objectives; the provider's part in a side card");
ok((await noPreviewOnName("#main")) === 0 && (await ev(() => { const tr = document.querySelector("#main #k3c-reqs tbody tr"); return !!tr && /^requirement--/.test(tr.getAttribute("data-go") || "") && !!tr.querySelector(".k3-eye"); })), "no name opens a preview: a requirement row goes to its page and carries an eye");
ok(/^1 of \d+ in Controls: "AC-2" Next: AC-2\(1\)/.test(await ev(() => (document.querySelector("#main .k3-sub") || {}).innerText.replace(/\s+/g, " "))), "it says where it stands in the list as it was searched, and the next", await ev(() => (document.querySelector("#main .k3-sub") || {}).innerText));
await inSec("k3c-impl", "Mission Computer", "row"); await w();
ok(/AC-2 on Mission Computer/.test(await H.modal()), "Mission Computer's row opens its implementation to write");
await p.selectOption("#k3f-status", "implemented"); await p.fill("#k3f-text", "The Mission Computer creates no local accounts: the maintenance role is bound to the directory group at build.");
await submit();
ok(/creates no local accounts/.test((await sec("k3c-impl")).text) && /Implemented/.test((await sec("k3c-impl")).text) && (await H.hash()) === "control--AC-2", "the text and its status show on the row, on the same page");
await p.reload(); await w(1100);
const fi = await fact("impl", "AC-2", "CN-109101");
ok((await H.hash()) === "control--AC-2" && /creates no local accounts/.test((await sec("k3c-impl")).text) && fi && fi.status === "implemented" && /creates no local accounts/.test(fi.text), "after a reload of the page: kept, and fact(impl, AC-2, CN-109101) returns it", fi);
await inSec("k3c-impl", "The system as a whole", "row"); await w();
await p.selectOption("#k3f-status", "partial"); await p.fill("#k3f-text", "Accounts are managed in the corporate directory; WS-X90 maps its roles to groups."); await submit();
ok((await ev(() => PA.SSP.ctl("AC-2").n)) === "Accounts are managed in the corporate directory; WS-X90 maps its roles to groups." && (await ev(() => (PA.v2.get("sctm.ctl.AC-2") || {}).n)) === (await ev(() => PA.SSP.ctl("AC-2").n)), "the system's narrative is written to the SSP's record and the workbook's store");
const comps0 = (await sec("k3c-impl")).rows;
await addIn("k3c-impl"); await w();
await ev(() => { const it = [...document.querySelectorAll("#modal .k3-pick-i:not(.held)")].find((x) => /Secure Boot Controller/.test(x.innerText)); it.querySelector("input").click(); }); await w(150); await submit();
ok((await sec("k3c-impl")).rows === comps0 + 1 && /Secure Boot Controller/.test((await sec("k3c-impl")).text), "Add component: Secure Boot Controller now carries AC-2");
await inSec("k3c-impl", "Secure Boot Controller", "btn"); await w(); await submit();
ok((await sec("k3c-impl")).rows === comps0 && (await H.hash()) === "control--AC-2", "and Remove takes it off again, without leaving the page");

// ——— 5b. A control on a component: the crumbs lead back to the component, and the page says whose implementation it is ———
await H.go("component--CN-109101--controls", 700);
await ev(() => { const tr = [...document.querySelectorAll("#main .k3-table tbody tr")].find((t) => (t.querySelector(".k3-nm-c") || {}).innerText === "AC-2"); if (tr) tr.click(); }); await w(600);
ok(decodeURIComponent(await H.hash()) === "control--AC-2@CN-109101", "from Mission Computer's Controls tab, AC-2's row goes to control--AC-2@CN-109101", await H.hash());
{ const c = await crumbs();
  ok(c[0] === "System→system" && c.includes("Mission Computer→component--CN-109101--controls") && c[c.length - 1] === "AC-2" && (await navOn()) === "System", "crumbs: System › … › Mission Computer › AC-2; the sidebar marks System", c); }
ok(/How Mission Computer implements this control/.test(await ev(() => document.querySelector("#main .k3-sub").innerText)) && (await ev(() => (document.querySelector("#main .k3-aside-b > .k3-sec h2") || {}).innerText)) === "Mission Computer's implementation" && /creates no local accounts/.test((await sec("k3c-impl-lead")).text) && (await primary()).join() === "Edit implementation", "it says whose implementation it is, leads with it in full, and its primary edits it", await primary());
await ev(() => document.querySelector("#main .k3-head-a .btn.ink").click()); await w();
await p.fill("#k3f-text", "The Mission Computer creates no local accounts; its boot image rejects any account the build manifest does not name."); await submit();
ok(/boot image rejects/.test((await sec("k3c-impl-lead")).text) && /boot image rejects/.test((await fact("impl", "AC-2", "CN-109101")).text), "edited there: the same record the control's own page shows");
await ev(() => [...document.querySelectorAll("#main .k3-crumbs a")].find((a) => a.innerText.trim() === "Mission Computer").click()); await w(600);
ok((await H.hash()) === "component--CN-109101--controls", "the breadcrumb leads back to the component's Controls");
await ev(() => { const tr = [...document.querySelectorAll("#main .k3-table tbody tr")].find((t) => (t.querySelector(".k3-nm-c") || {}).innerText === "AC-2"); const e = tr && tr.querySelector(".k3-eye"); if (e) e.click(); }); await w(500);
ok(await ev(() => { const s = document.querySelector("#panel #k3c-impl"), tr = s && s.querySelector("tbody tr"); return !!tr && /Mission Computer/.test(tr.innerText) && tr.classList.contains("k3c-lead") && /boot image rejects/.test(s.innerText) && [...s.querySelectorAll("tbody tr")].every((r) => r.getBoundingClientRect().height <= 44); }), "the row's eye previews it, leading with Mission Computer: its text, then one line a place");
await closePanel();

// ——— 6. Requirements and evidence on the page move the control along its ladder ———
await H.go("controls"); await clear(); const nr0 = await stN("No requirement");
await toPage("SA-24");
ok(/No requirement/.test(await pageChip()) && (await primary()).join() === "Add requirement" && /No requirement maps it yet/.test((await sec("k3c-status")).text) && (await ev(() => (document.querySelector("#main .k3-aside-b > .k3-sec") || {}).id)) === "k3c-stmt", "SA-24 stands at No requirement; its statement leads, and its one primary is Add requirement", await primary());
await ev(() => document.querySelector("#main .k3-head-a .btn.ink").click()); await w();
ok((await ev(() => document.querySelectorAll("#modal .k3-pick-i").length)) > 50, "Add requirement: the picker over the program's requirements");
await p.click("#modal [data-k3-picknew]"); await w();
await p.fill("#k3f-title", "Mission functions continue through the loss of one partition"); await p.fill("#k3f-st", "WS-X90 shall keep its mission functions through the compromise of one partition."); await submit();
const madeReq = await ev(() => (/REQ-\d+/.exec((document.querySelector("#main #k3c-reqs tbody") || {}).innerText || "") || [""])[0]);
ok(/No evidence/.test(await pageChip()) && (await sec("k3c-reqs")).rows === 1 && !!madeReq && (await fact("status", "SA-24")) === "no_evidence" && (await primary()).join() === "Add evidence", `Create requirement: ${madeReq} maps it, SA-24 reads No evidence, and the primary becomes Add evidence`, [await pageChip(), await primary()]);
await inSec("k3c-reqs", madeReq, "row"); await w(500);
ok(decodeURIComponent(await H.hash()) === "requirement--" + madeReq, "the requirement's row goes to its page", await H.hash());
await p.goBack(); await w(600);
await inSec("k3c-reqs", madeReq, "eye"); await w(500);
ok((await H.hash()) === "control--SA-24" && new RegExp(madeReq).test(await panel()), "its eye previews the requirement beside the control's page");
await closePanel();
await ev(() => document.querySelector("#main .k3-head-a .btn.ink").click()); await w();
await ev(() => document.querySelector("#modal .k3-pick-i:not(.held) input").click()); await w(150); await submit();
ok(/Not assessed/.test(await pageChip()) && (await sec("k3c-evs")).rows === 1 && (await fact("status", "SA-24")) === "not_assessed" && (await primary()).length === 1 && !/Add evidence|Add requirement/.test((await primary()).join()), "Add evidence: SA-24 reads Not assessed; the primary is now the assessment step", [await pageChip(), await primary()]);
await ev(() => document.querySelector("#main .k3-crumbs a").click()); await w(500); await clear();
ok((await stN("No requirement")) === nr0 - 1, "back on the list Status counts one fewer with No requirement", [nr0, await stN("No requirement")]);
await toPage("SA-24");
await inSec("k3c-reqs", madeReq, "btn"); await w(); await submit();
ok(/No requirement/.test(await pageChip()) && (await sec("k3c-reqs")).rows === 0 && (await H.hash()) === "control--SA-24", "Unmap: the requirement leaves and the status falls back");

// ——— 7. Responsibility: Inherited reads the provider's status ———
await H.go("controls"); await clear(); const inh0 = await viewN("Inherited");
await toPage("PE-3");
ok(/Hybrid with F-16 Block 70/.test(await H.main()), "PE-3 is Hybrid with F-16 Block 70");
await ev(() => [...document.querySelectorAll("#main .k3-facts .k3-link")].find((x) => x.innerText === "Change").click()); await w();
await p.selectOption("#k3f-kind", "Inherited"); await p.fill("#k3f-reason", "The aircraft controls every entry to the bay."); await submit();
const prov = await ev(() => PA.v2host.resp("PE-3").offer.st);
ok(/Inherited from F-16 Block 70/.test(await H.main()) && /Inherited from a provider/.test(await H.main()) && (await fact("status", "PE-3")) === prov && (await ev(() => PA.v2host.resp("PE-3").kind)) === "Inherited", "changed to Inherited from F-16 Block 70; its status is the provider's", [await fact("status", "PE-3"), prov]);
await ev(() => document.querySelector("#main .k3-crumbs a").click()); await w(500); await clear();
ok((await viewN("Inherited")) === inh0 + 1 && (await fact("controls", "PRG-1090")).inherited === inh0 + 1, "the built-in view Inherited counts one more", [inh0, await viewN("Inherited")]);

// ——— 8. A parameter value, edited in the statement ———
await toPage("AC-11");
ok((await ev(() => document.querySelectorAll("#main #k3c-stmt .k3c-pv.unset").length)) === 1, "AC-11's statement prints its parameter as a placeholder");
await ev(() => document.querySelector("#main .k3c-pv").click()); await w();
await p.fill("#k3f-value", "15 minutes"); await p.fill("#k3f-why", "The flightline lock interval in the squadron's operating instruction."); await submit();
await ev(() => PA.v3k.redraw()); await w();
ok(/device lock after 15 minutes of inactivity/.test(await H.main()) && (await ev(() => document.querySelectorAll("#main .k3c-pv.unset").length)) === 0, "the statement prints 15 minutes in place, and after a redraw");

// ——— 9. The preview is the eye: the same record, the same work, and its rows follow the rule ———
await peek("AC-2");
ok((await H.hash()) === "controls" && (await ev(() => !!document.querySelector("#panel .k3-pn #k3c-impl") && !!document.querySelector("#panel #k3c-reqs") && !!document.querySelector("#panel #k3c-evs"))) && /Accounts are managed in the corporate directory/.test(await ev(() => (document.querySelector("#panel #k3c-impl") || {}).innerText || "")), "the row's eye opens the preview over the list, with what was written on the page");
{ const P9 = await ev(() => { const pn = document.querySelector("#panel .k3-pn"); return { secs: [...pn.querySelectorAll(".k3-sec h2")].map((h) => { const c = h.cloneNode(true); c.querySelectorAll(".k3-ct").forEach((x) => x.remove()); return c.textContent.trim(); }), tall: [...pn.querySelectorAll("tbody tr")].filter((r) => r.getBoundingClientRect().height > 44).length, wide: [...pn.querySelectorAll(".tablebox")].filter((t) => t.scrollWidth > t.clientWidth + 1).length, all: [...pn.querySelectorAll(".k3-pk-all")].map((x) => x.textContent.trim() + "→" + x.getAttribute("href")), objs: pn.querySelectorAll("#k3c-objs tbody tr").length, facts: [...pn.querySelectorAll(":scope > .k3-facts dt")].map((d) => d.textContent.trim()).join() }; });
  ok(["Implementation", "Requirements", "Evidence", "Objectives", "Findings and risks"].every((x) => P9.secs.includes(x)) && P9.facts === "Source,Responsibility,Owner,Family" && !P9.tall && !P9.wide && P9.objs === 5 && P9.all.includes("View all 26→#control--AC-2"), "the preview lists what the page lists after its facts (Implementation, Requirements, Evidence, Objectives, Findings and risks): one line a row, five objectives, then View all 26", P9); }
ok((await noPreviewOnName("#panel .k3-pn")) === 0 && (await ev(() => !document.querySelector("#panel .k3c-rq") && [...document.querySelectorAll("#panel #k3c-reqs tbody tr")].every((tr) => /^requirement--/.test(tr.getAttribute("data-go") || "") && !!tr.querySelector(".k3-eye")))), "in the preview too, a requirement's name goes to its page and the eye previews it");
await ev(() => document.querySelector("#panel .k3-pn-a details.k3-menu > summary").click()); await moreItem("Assign owner", "#panel");
await p.selectOption("#k3f-owner", { index: 1 }); await submit();
ok(!/Unassigned/.test(await ev(() => document.querySelector("#panel .k3-facts").innerText)), "work is doable in the preview: an owner assigned there shows");
await ev(() => document.querySelector('#panel .bar-top button[aria-label="Open the full record"]').click()); await w(500);
ok((await H.hash()) === "control--AC-2", "the preview's ↗ goes to the control's page");

// ——— 10. Working through a list reads well with pages: land on the page, do the work, go on or come back ———
await H.go("controls"); await clear();
await pick("status", "^No requirement");
const todo = await footTotal(), first = (await rows())[0].code, second = (await rows())[1].code;
await ev(() => document.querySelector("#main .k3-table tbody tr").click()); await w(500);
let sub = await ev(() => document.querySelector("#main .k3-sub").innerText.replace(/\s+/g, " "));
ok(decodeURIComponent(await H.hash()) === "control--" + first && new RegExp(`^1 of ${todo} in Controls: No requirement`).test(sub) && new RegExp(`Next: ${second.replace(/[()]/g, "\\$&")}`).test(sub), `the first of the ${todo} without a requirement: its page says 1 of ${todo} in Controls: No requirement, and the next`, sub);
await ev(() => document.querySelector("#main .k3-head-a .btn.ink").click()); await w();
await ev(() => document.querySelector("#modal .k3-pick-i:not(.held) input").click()); await w(150); await submit();
sub = await ev(() => document.querySelector("#main .k3-sub").innerText.replace(/\s+/g, " "));
ok(/No evidence/.test(await pageChip()) && new RegExp(`No longer among the ${todo - 1} in Controls: No requirement`).test(sub), "the work done, the page says it left the list and offers the next", sub);
await ev(() => [...document.querySelectorAll("#main .k3-sub a")].find((a) => /^Next/.test(a.innerText)).click()); await w(500);
ok(decodeURIComponent(await H.hash()) === "control--" + second && new RegExp(`^1 of ${todo - 1} in Controls`).test(await ev(() => document.querySelector("#main .k3-sub").innerText.replace(/\s+/g, " "))), "Next lands on the next control's page");
await ev(() => document.querySelector("#main .k3-crumbs a").click()); await w(500);
ok((await H.hash()) === "controls" && (await footTotal()) === todo - 1 && (await onFilters()).join() === "Status: No requirement", "the breadcrumb returns to the list as it was filtered, one fewer");
await ev(() => PA.v3k.task.start({ from: { label: "PDR", route: "overview" }, what: "Controls without a requirement", steps: [{ label: "Controls without a requirement", route: "controls" }] })); await w(600);
await ev(() => document.querySelector("#main .k3-table tbody tr").click()); await w(600);
ok(/^control--/.test(await H.hash()) && /Back to PDR/.test(await ev(() => (document.getElementById("k3task") || {}).innerText || "")), "from a gate's task, the return bar stays on the control's page: Back to PDR");
await ev(() => document.querySelector("#k3task .k3-task-b").click()); await w(700);
ok((await H.hash()) === "overview" && !(await ev(() => !!document.getElementById("k3task"))), "and it returns to the gate's page");
await H.go("controls"); await clear();

// ——— 11. The workbook is one click from Controls and one click back ———
await ev(() => document.querySelector('#main .k3-head .k3-seg a[href="#sctm"]').click()); await w(1800);
ok((await H.hash()) === "sctm" && (await ev(() => !!document.querySelector("#sx-app .k3c-wb a[href='#controls']"))), "List to Workbook in one click; the workbook carries the same switch");
if (wide) {
  ok(/controls/.test(await ev(() => (document.querySelector("#sx-app .k3c-wb-n") || {}).innerText || "")), "it says how its rows relate to the list", await ev(() => (document.querySelector("#sx-app .k3c-wb-n") || {}).innerText));
  const cellId = await ev(() => { const ST = PA.sctm.state, sh = ST.sheets.find((s) => s.id === ST.sid), ci = sh.cols.findIndex((c) => c.name === "Narrative"); return `sx-${sh.id}-0-${ci}`; });
  await ev((id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ block: "center", inline: "center" }); }, cellId); await w(300);
  await p.dblclick("#" + cellId); await w(300);
  await p.fill("#sx-edi", "The access control policy is one signed baseline in the Configuration Repository, reviewed each block."); await p.keyboard.press("Control+Enter"); await w(300);
  if (!(await ev(() => PA.sctm.staged().length))) { await p.keyboard.press("Enter"); await w(300); }
  ok((await ev(() => PA.sctm.staged().length)) === 1, "a Narrative cell edited: 1 change staged");
  await p.click("#sx-app .sx-review"); await w(400);
  await p.click("[data-sctm-apply]"); await w(600);
  ok((await ev(() => PA.SSP.ctl("AC-1").n)) === "The access control policy is one signed baseline in the Configuration Repository, reviewed each block.", "Review changes, Apply: the record holds the text");
}
await ev(() => { const el = document.querySelector('#sx-app [data-panel="a-tests-control"]'); if (el) el.click(); }); await w(500);
ok((await ev(() => !!document.querySelector("#panel .k3-pn #k3c-impl"))) && (await H.hash()) === "sctm" && !(await ev(() => !!document.querySelector('#panel .k3-pn-a a.btn[href^="#rec--"]'))), "a control named in a workbook row opens as the same preview over the workbook");
await ev(() => document.querySelector('#panel .bar-top button[aria-label="Open the full record"]').click()); await w(700);
ok(/^control--/.test(await H.hash()) && /Back to the workbook/.test(await ev(() => (document.getElementById("k3task") || {}).innerText || "")), "its ↗ goes to the control's page with a bar: Back to the workbook", await H.hash());
await ev(() => document.querySelector("#k3task .k3-task-b").click()); await w(1500);
ok((await H.hash()) === "sctm", "and the bar returns to the workbook");
await ev(() => document.querySelector("#sx-app .k3c-wb a[href='#controls']").click()); await w(700);
ok((await H.hash()) === "controls" && (!wide || (await rows())[0].code === "AC-1"), "Workbook to List in one click");
if (wide) { await peek("AC-1"); ok(/one signed baseline in the Configuration Repository, reviewed each block/.test(await panel()), "AC-1's preview reads the text applied in the workbook"); await closePanel(); }

// ——— 12. Folded addresses, old control addresses, and another program ———
for (const [from, to, see] of [["baseline", "controls", /Baseline/], ["baseline-params", "controls", /statement has parameters/], ["resiliency", "controls", /Baseline/], ["resiliency-approaches", "controls", /Baseline/], ["posture", "controls-coverage", /one row a component/], ["posture-risks", "controls-coverage", /one row a component/], ["rec--a-tests-control--AC-2", "control--AC-2", /Account Management/], ["control-si2", "control--SI-2", /Flaw Remediation/]]) {
  await H.go("overview"); await H.go(from, 700);
  ok((await H.hash()) === to && see.test(await H.main()) && (await navOn()) === "Controls", `${from} opens ${to}, under Controls in the sidebar`, await H.hash());
}
await H.go("baseline-params", 700);
ok((await footTotal()) === 9, "baseline-params: the nine controls whose statements have parameters", await footTotal());
await clear();
await H.go("resiliency", 700);
ok((await onFilters()).join() === "Technique: Any technique" && (await footTotal()) > 100 && (await footTotal()) < 560, "resiliency: the first filter reads Technique: Any technique, showing the controls that support one", [await onFilters(), await footTotal()]);
await pick("family", "^Segmentation");
ok((await footTotal()) > 0 && (await footTotal()) < 100, "choosing Segmentation narrows to its controls", await footTotal());
await clear();
await H.go("controls-coverage", 900);
ok(/Mission Computer/.test(await H.main()) && /Coverage/.test(await ev(() => (document.querySelector("#main .k3-head .k3-seg .on") || {}).innerText || "")), "Coverage draws the components by family under Controls' header");
for (const r of ["controls", "controls-coverage", "control--AC-2", "control--AC-2@CN-109101", "control--SA-24"]) {
  await H.go("overview"); await H.go(r, 700);
  const s = await ev(() => ({ side: document.documentElement.scrollWidth - document.documentElement.clientWidth, main: document.getElementById("main").scrollWidth - document.getElementById("main").clientWidth, title: !!document.querySelector("#main .k3-title") }));
  ok(s.side <= 0 && s.main <= 1 && s.title, `${r} at ${W}: drawn, no sideways scroll`, s);
}
if (wide) {
  const seen = await createSP70(H, { nss: true });
  await H.go("controls", 700);
  const other = await H.main();
  ok((await H.cur()) === seen.code && !/WS-X90/.test(other) && /Controls/.test(other) && (await footTotal()) > 0 && (await footTotal()) !== 561, "a created program's Controls lists its own baseline", [await H.cur(), await footTotal()]);
  const t0 = await footTotal();
  await H.click("Add control", "#main .k3-tb", { exact: true });
  await p.fill("#k3f-code", "SC-7(20)"); await p.fill("#k3f-why", "The pod's bus needs dynamic isolation."); await submit();
  ok((await footTotal()) === t0 + 1 && !(await modalOpen()), "Add control works there too: one more", [t0, await footTotal()]);
  await H.go("baseline", 700);
  ok((await H.hash()) === "controls" && (await H.cur()) === seen.code && (await footTotal()) === t0 + 1, "its baseline address opens its own Controls too");
  await ev(() => PA.v2hubs.setCur("PRG-1090")); await H.go("overview"); await H.go("controls", 700);
  ok((await footTotal()) === 561, "back on WS-X90: its 561");
}
await ev(() => PA.v3.set(false)); await w(400); await H.go("controls", 600);
ok(!(await ev(() => !!document.querySelector("#main .k3c"))) && /Controls/.test(await H.main()), "V3 off: Controls is v2's page");
} catch (e) { fails++; console.log("THREW:", String(e.message).split("\n").slice(0, 3).join(" | ")); }
console.log(`\n${n - fails} of ${n} passed at ${W}`);
console.log("page errors", H.errs.slice(0, 8));
await H.b.close();
process.exit(fails || H.errs.length ? 1 : 0);
