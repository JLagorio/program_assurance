import io
P = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/v3r/C/walk.mjs"
L = io.open(P, encoding="utf-8").read().split("\n")
R = []
def line(n, pre, new): R.append((n, n, pre, new))
def sub(n, pre, old, new, cnt=1): R.append((n, n, pre, ("SUB", old, new, cnt)))

line(1, "// Lane C's walk, pass 2", "// Lane C's walk, pass 3 (the whole build): with V3 on, through the UI. One row over the list (search, views, five filters, the\n// list's actions), compact one-line rows, a row goes to the control's page and its eye opens a preview that lists what the page lists.")
line(2, "// control's page, the eye opens", "// node walk.mjs [build] [width]   (390 for a phone; walk.lane.mjs: pass 1, p3/walk-C.pass3-bak.mjs: pass 2)")
sub(4, "const build = process.argv[2]", "v3r2-C.html", "v3r3-C.html")
line(14, "const fams = ()", r'''// Pass 3: a folded filter is select[data-k3-fkey="<key>"], a classic one select[data-k3-input="<act>"]; an option reads "Label (n)",
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
const oneLine = (root) => ev((root) => [...document.querySelectorAll(`${root} .k3-table tbody tr`)].filter((r) => r.getClientRects().length && r.getBoundingClientRect().height > 44 && !r.querySelector("td.wrap")).length, root);''')
line(15, "const pickFam = ", "")
line(16, "const chip = ", "")
line(19, "const clear = ", r'''const clear = async () => { if (await ev(() => { const t = document.querySelector("#main .k3c-set button"); if (t) t.click(); return !!t; })) await w(); if (await ev(() => { const c = document.querySelector("#main .k3-tb .k3-clear, #main .k3-empty .btn"); if (c) c.click(); return !!c; })) await w(); };''')
line(43, "ok(F.length === 20", r'''ok(F.length === 18 && F.reduce((a, x) => a + x.n, 0) === 560, "the Family filter: 18 families that add up to the 560", [F.length]);''')
line(44, "ok(F.slice(1, 19)", r'''{ const T = await opts("family", "Resiliency technique"); ok(T.length === 15 && T[0].t === "Any technique" && T[0].n > 100 && T[0].n < 560, "the same filter offers the 14 resiliency techniques, one group under the families", [T.length, T[0]]); }''')
line(45, "ok((await ev(() => { const s = document.querySelector(\"#main .k3-rsel select\")", r'''ok(await ev(() => { const t = document.querySelector("#main .k3-tb[data-k3-list]"), kids = [...t.children].flatMap((c) => (c.classList.contains("k3-fs") ? [...c.children] : [c])); return [...t.querySelectorAll(".k3-flt select")].map((s) => s.getAttribute("aria-label")).join() === "Family,Status,Responsibility,Owner,Source" && kids[0].matches(".k3-search") && kids[1].matches(".k3-vmenu") && document.querySelectorAll("#main .k3-tb").length === 1 && !document.querySelector("#main .k3-chips, #main .k3-rtabs, #main nav.k3-rail, #main .k3c-showing, #main .k3-head-a") && [...t.querySelectorAll(".k3-tools-r summary")].map((s) => s.textContent.trim().replace(/\W+$/, "")).join() === "More,Add control"; }), "one row over the table: search, views, Family, Status, Responsibility, Owner, Source, then More and Add control; no strip, no line of filters, no header actions");''')
line(46, "if (wide) ok(await ev(() => { const t = [...document.querySelectorAll(\"#main .k3-tools > label\")]", r'''if (wide) ok(await ev(() => { const t = document.querySelector("#main .k3-tb[data-k3-list]"), kids = [...t.children].flatMap((c) => (c.classList.contains("k3-fs") ? [...c.children] : [c])).filter((e) => e.getClientRects().length), tops = kids.map((e) => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2)); return Math.max(...tops) - Math.min(...tops) < 6 && kids[kids.length - 1].getBoundingClientRect().right <= t.getBoundingClientRect().right + 1; }), `the row is one line at ${W}`);
ok((await oneLine("#main")) === 0, "every row of the list is one line");''')
line(53, "await pickFam(1);", r'''const ac = F[0].n; await pick("family", "^AC ·");''')
line(55, "ok((await H.hash()) === \"controls\" && F[1].on", r'''ok((await H.hash()) === "controls" && F[0].on && (await footTotal()) === ac && (await rows()).every((r) => r.code.startsWith("AC-")), "Access Control in the Family filter: the same page, its count equals its rows, all AC", [ac, await footTotal()]);''')
line(57, "// ——— 2. Chips", "// ——— 2. Status, search, a completion bar, a baseline layer line and a component's controls; Clear returns all ———")
line(58, "const ne = await chip(", r'''const ne = await stN("No evidence");''')
line(59, "await ev(() => [...document.querySelectorAll(\"#main .k3-chip\")]", r'''await pick("status", "^No evidence");''')
line(60, "ok(ne > 0 && (await footTotal()) === ne", r'''ok(ne > 0 && (await footTotal()) === ne && (await onFilters()).join(" + ") === "Family: AC · Access Control + Status: No evidence", "Status: No evidence narrows the family to its count", [ne, await footTotal(), await onFilters()]);''')
line(66, "ok((await footTotal()) === mini", r'''ok((await footTotal()) === mini && (await onFilters()).join() === "Status: With evidence", "the With evidence bar is the Status filter: With evidence", [mini, await footTotal(), await onFilters()]);''')
line(68, "const want = await ev(", r'''const want = await ev(() => { const m = PA.v3c.model(); return { add: [...m.src.entries()].filter(([c, k]) => k === "cnssi" && m.set.has(c)).length, rem: [...m.out.values()].filter((k) => k === "cnssi").length }; });''')
line(70, "ok((await footTotal()) === want", r'''ok((await footTotal()) === want.add && (await onFilters()).join() === "Source: CNSSI 1253", "the CNSSI 1253 line of the Baseline card is the Source filter: what it added", [want, await footTotal(), await onFilters()]);
await pick("status", "^Tailored out");
ok(want.rem > 0 && (await footTotal()) === want.rem && (await rows()).every((r) => /CNSSI 1253 removed it/.test(r.text)), "with Status: Tailored out, what it removed", [want.rem, await footTotal()]);''')
line(73, "{ const t = await footTotal(), all = await chip(", r'''{ const t = await footTotal(), S = await opts("status"); F = await fams();''')
line(74, "  ok(t > 0 && t < 560 && all === t", r'''  ok(t > 0 && t < 560 && F.reduce((a, x) => a + x.n, 0) === t && S.slice(1, 7).reduce((a, x) => a + x.n, 0) === t && /Carried by Mission Computer/.test(await ev(() => (document.querySelector("#main .k3-tb .k3c-set") || {}).innerText || "")), "a component's controls (ctl.view { comp }): a token in the row, and Family and Status count what Mission Computer carries", [t]);
  await ev(() => document.querySelector("#main .k3c-set button").click()); await w();
  ok((await footTotal()) === 560 && !(await ev(() => !!document.querySelector("#main .k3c-set"))), "the token's × shows every control again"); }
// ——— 2b. Views: a built-in one, then one saved, left and picked again ———
{ const n = await viewN("Needs evidence"); await viewPick("Needs evidence");
  ok(n > 0 && (await footTotal()) === n && (await viewName()) === "Needs evidence" && (await onFilters()).join() === "Status: No evidence", "the built-in view Needs evidence asks Status: No evidence and counts what it lists", [n, await footTotal(), await onFilters()]);
  await pick("family", "^AC ·"); const mine = (await rows()).map((r) => r.code).join(), mt = await footTotal();
  ok(/Edited/.test(await ev(() => document.querySelector("#main .k3-vbtn").textContent)), "a filter more: the view says Edited");
  await viewCmd("Save as new view"); await p.fill("#modal input[name=name]", "AC still to evidence"); await submit();
  ok((await viewName()) === "AC still to evidence" && !(await modalOpen()) && !/Edited/.test(await ev(() => document.querySelector("#main .k3-vbtn").textContent)), "saved under a name: it is the current view");
  await viewPick("All controls");
  ok((await footTotal()) === 560 && !(await onFilters()).length, "All controls leaves it: 560 again, nothing chosen");
  await viewPick("AC still to evidence");
  ok(mt > 0 && (await rows()).map((r) => r.code).join() === mine && (await footTotal()) === mt && (await viewName()) === "AC still to evidence", "picked again, the saved view lists the same rows", [mt, await footTotal()]);
  ok((await ev(() => [...document.querySelectorAll("#main .k3-vlist .k3-vi")].map((e) => e.textContent.replace(/\s+/g, " ").trim()))).some((t) => /^AC: needs evidence ?Shared ?\d+/.test(t)), "the menu starts with one saved view of the program's: AC: needs evidence, shared", await ev(() => [...document.querySelectorAll("#main .k3-vlist .k3-vi")].map((e) => e.textContent.replace(/\s+/g, " ").trim())));
  await viewPick("All controls"); }''')
line(85, "await ev(() => document.querySelector(\"#main .k3-head-a details.k3-menu > summary\").click()); await moreItem(\"Export controls\");", r'''await ev(() => document.querySelector("#main .k3-tb .k3-tools-r details.k3-menu > summary").click()); await moreItem("Export controls", "#main .k3-tb");''')
line(90, "const out0 = ", r'''const out0 = await stN("Tailored out");''')
sub(91, "await ev(() => document.querySelector(\"#main .k3-head-a details.k3-menu:last-of-type", "#main .k3-head-a details", "#main .k3-tb .k3-tools-r details")
sub(92, "await ev(() => document.querySelector(\"#main .k3-head-a details.k3-menu:last-of-type", "#main .k3-head-a details", "#main .k3-tb .k3-tools-r details")
line(108, "C = await cards(); F = await fams();", r'''await clear(); C = await cards();''')
sub(109, "ok((await H.hash()) === \"controls\" && C.base === 560", "F[19].n === out0 + 1", "(await stN(\"Tailored out\")) === out0 + 1")
sub(109, "ok((await H.hash()) === \"controls\" && C.base === 560", "[C.base, F[19].n]", "[C.base, await stN(\"Tailored out\")]")
line(110, "await clear(); await pickFam(19);", r'''await pick("status", "^Tailored out");''')
sub(115, "ok((await cards()).base === 561", "(await fams())[19].n === out0", "(await footTotal()) === out0")
line(170, "ok(await ev(() => { const tr = document.querySelector(\"#panel #k3c-impl tbody tr\")", r'''ok(await ev(() => { const s = document.querySelector("#panel #k3c-impl"), tr = s && s.querySelector("tbody tr"); return !!tr && /Mission Computer/.test(tr.innerText) && tr.classList.contains("k3c-lead") && /boot image rejects/.test(s.innerText) && [...s.querySelectorAll("tbody tr")].every((r) => r.getBoundingClientRect().height <= 44); }), "the row's eye previews it, leading with Mission Computer: its text, then one line a place");''')
sub(174, "await H.go(\"controls\"); await clear(); const nr0", "await chip(\"No requirement\")", "await stN(\"No requirement\")")
line(193, "ok((await chip(\"No requirement\")) === nr0 - 1", r'''ok((await stN("No requirement")) === nr0 - 1, "back on the list Status counts one fewer with No requirement", [nr0, await stN("No requirement")]);''')
sub(199, "await H.go(\"controls\"); await clear(); const inh0", "await chip(\"Inherited\")", "await viewN(\"Inherited\")")
line(207, "ok((await chip(\"Inherited\")) === inh0 + 1", r'''ok((await viewN("Inherited")) === inh0 + 1 && (await fact("controls", "PRG-1090")).inherited === inh0 + 1, "the built-in view Inherited counts one more", [inh0, await viewN("Inherited")]);''')
sub(219, "ok((await H.hash()) === \"controls\" && (await ev(() => !!document.querySelector(\"#panel .k3-pn #k3c-impl\")", "/boot image rejects/.test(await panel())", "/Accounts are managed in the corporate directory/.test(await ev(() => (document.querySelector(\"#panel #k3c-impl\") || {}).innerText || \"\"))")
line(229, "await ev(() => [...document.querySelectorAll(\"#main .k3-chip\")].find((x) => x.innerText.startsWith(\"No requirement\")).click()); await w();", r'''await pick("status", "^No requirement");''')
sub(241, "ok((await H.hash()) === \"controls\" && (await footTotal()) === todo - 1", "(await ev(() => document.querySelector(\"#main .k3-chip.on\").innerText.startsWith(\"No requirement\")))", "(await onFilters()).join() === \"Status: No requirement\"")
line(271, "ok((await H.hash()) === \"controls\" && (!wide || ((await rows())[0].code === \"AC-1\"", r'''ok((await H.hash()) === "controls" && (!wide || (await rows())[0].code === "AC-1"), "Workbook to List in one click");
if (wide) { await peek("AC-1"); ok(/one signed baseline in the Configuration Repository, reviewed each block/.test(await panel()), "AC-1's preview reads the text applied in the workbook"); await closePanel(); }''')
sub(274, "for (const [from, to, see] of [[\"baseline\"", "/Clear filters/", "/Baseline/", 2)
line(282, "ok((await ev(() => document.querySelector('#main [data-k3-input=\"k3c.f.tech\"]').value)) === \"*\"", r'''ok((await onFilters()).join() === "Technique: Any technique" && (await footTotal()) > 100 && (await footTotal()) < 560, "resiliency: the first filter reads Technique: Any technique, showing the controls that support one", [await onFilters(), await footTotal()]);''')
line(283, "await p.selectOption('#main [data-k3-input=\"k3c.f.tech\"]'", r'''await pick("family", "^Segmentation");''')
sub(299, "  await H.click(\"Add control\", \"#main .k3-head\"", "\"#main .k3-head\"", "\"#main .k3-tb\"")

seen = {}
R.sort(key=lambda x: -x[0])
for (a, b, pre, new) in R:
    assert L[a-1].startswith(pre), (a, L[a-1][:90])
    if isinstance(new, tuple):
        _, old, nw, cnt = new
        assert L[a-1].count(old) == cnt, (a, old, L[a-1].count(old))
        L[a-1] = L[a-1].replace(old, nw)
    else:
        L[a-1] = new
io.open(P, "w", encoding="utf-8").write("\n".join(L))
print("ok")
