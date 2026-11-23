// Lane C's walk: with V3 on, through the UI, every flow of the brief; asserts what a person would see. node walk.mjs [build]
import { open, createSP70, SP } from "../../v3/P/lib.mjs";
const build = process.argv[2] || SP + "/vanta/proto/out/v3r-C.html";
const H = await open({ build, start: "overview" }), p = H.p;
p.setDefaultTimeout(6000);
setTimeout(() => { console.log("WATCHDOG: the walk ran over 5 minutes"); process.exit(2); }, 300000);
let fails = 0, n = 0;
const ok = (c, name, extra) => { n++; if (!c) fails++; console.log(c ? "ok  " : "FAIL", name, c || extra === undefined ? "" : JSON.stringify(extra)); };
const ev = (fn, a) => p.evaluate(fn, a);
const w = (ms = 350) => p.waitForTimeout(ms);
const num = (s) => +String(s || "").replace(/[^\d]/g, "");
const footTotal = () => ev(() => { const t = (document.querySelector("#main .pager .num") || {}).innerText || ""; const m = /of ([\d,]+)/.exec(t); return m ? +m[1].replace(/,/g, "") : document.querySelectorAll("#main .k3-empty").length ? 0 : -1; });
const rows = () => ev(() => [...document.querySelectorAll("#main .k3-table tbody tr")].map((tr) => ({ code: (tr.querySelector(".k3-nm-c") || {}).innerText || "", text: tr.innerText.replace(/\s+/g, " ") })));
const rail = () => ev(() => [...document.querySelectorAll("#main .k3-rail-i")].map((x) => ({ t: x.querySelector(".x").innerText.replace(/\s+/g, " "), n: +x.querySelector(".num").innerText.replace(/,/g, ""), on: x.classList.contains("on") })));
const chip = (label) => ev((l) => { const c = [...document.querySelectorAll("#main .k3-chip")].find((x) => x.innerText.startsWith(l)); return c ? +c.querySelector(".num").innerText.replace(/,/g, "") : -1; }, label);
const cards = () => ev(() => ({ comp: +(/([\d,]+) total/.exec((document.querySelector("#main .k3-comp-f") || {}).innerText || "") || [0, "0"])[1].replace(/,/g, ""), base: +((document.querySelector("#main .k3c-base-n .num") || {}).innerText || "0").replace(/,/g, ""), layers: [...document.querySelectorAll("#main .k3c-ly")].map((x) => x.innerText.replace(/\s+/g, " ").trim()) }));
const search = async (q) => { await p.fill("#main .k3-search input", q); await w(450); };
const clear = async () => { if (await ev(() => !!document.querySelector("#main .k3c-showing .k3-link, #main .k3-empty .btn"))) { await p.click("#main .k3c-showing .k3-link, #main .k3-empty .btn"); await w(); } };
const openRow = async (code) => { await clear(); await search(code); await ev((c) => { const tr = [...document.querySelectorAll("#main .k3-table tbody tr")].find((t) => (t.querySelector(".k3-nm-c") || {}).innerText === c); if (tr) tr.click(); }, code); await w(450); };
const panel = () => ev(() => { const e = document.querySelector("#panel"); return e && !e.hidden ? e.innerText.replace(/[ \t]+/g, " ") : ""; });
const pchip = () => ev(() => (document.querySelector("#panel .k3-pn-h .pill") || {}).innerText || "");
const submit = async () => { await p.click("#modal [data-k3-submit]"); await w(450); };
const modalOpen = () => ev(() => !document.getElementById("modal").hidden);
const fact = (name, ...a) => ev(([name, a]) => PA.v3.fact(name, ...a), [name, a]);
const sec = (title) => ev((t) => { const s = [...document.querySelectorAll("#panel .k3-sec")].find((x) => (x.querySelector("h2") || {}).innerText.startsWith(t)); return s ? { n: +((s.querySelector(".k3-ct") || {}).innerText || "0"), text: s.innerText.replace(/\s+/g, " ") } : null; }, title);

try {
// ——— 1. The list: all 560, a family is a filter on the same page ———
await H.go("controls");
const navOn = () => ev(() => [...document.querySelectorAll("#nav a.item")].filter((a) => a.classList.contains("on")).map((a) => a.innerText.trim()).join("|"));
ok((await ev(() => (document.querySelector("#main .k3-title") || {}).innerText)) === "Controls" && (await navOn()) === "Controls", "Controls is drawn and marked in the program menu", await navOn());
let R = await rail();
ok(R.length === 20 && R[0].n === 560, "rail: All controls 560, 18 families, Tailored out", R.length);
ok(R.slice(1, 19).reduce((a, x) => a + x.n, 0) === R[0].n, "the 18 families add up to All");
ok((await footTotal()) === 560 && (await rows()).length === 50, "the list draws 50 of 560");
ok(!(await ev(() => !!document.querySelector("#main .v7p-fam, #main .ak-codes, #main .pn-sq"))), "no tile or pill of controls on the page");
{ const seen = new Set((await rows()).map((r) => r.code)); let pages = 1;
  while (await ev(() => { const b = [...document.querySelectorAll("#main .k3c-pg .btn")].find((x) => x.innerText === "Next"); return b && b.getAttribute("aria-disabled") !== "true"; })) { await ev(() => [...document.querySelectorAll("#main .k3c-pg .btn")].find((x) => x.innerText === "Next").click()); await w(120); (await rows()).forEach((r) => seen.add(r.code)); pages++; }
  ok(seen.size === 560 && pages === 12, "the pager reaches every one of the 560 in 12 pages", [seen.size, pages]); }
await H.go("controls");
await p.click("#main .k3-rail button.k3-rail-i:nth-of-type(2)"); await w();
ok((await H.hash()) === "controls", "a family in the rail stays on Controls");
R = await rail();
ok(R[1].on && (await footTotal()) === R[1].n && (await rows()).every((r) => r.code.startsWith("AC-")), "Access Control: its count equals its rows, all AC", [R[1].n, await footTotal()]);

// ——— 2. Chips, search, a completion mini and a baseline layer line filter; Clear returns all ———
const ne = await chip("Needs evidence");
await ev(() => [...document.querySelectorAll("#main .k3-chip")].find((x) => x.innerText.startsWith("Needs evidence")).click()); await w();
ok(ne > 0 && (await footTotal()) === ne, "Needs evidence narrows the family to its count", [ne, await footTotal()]);
await search("account"); const afterQ = await footTotal();
ok(afterQ < ne && afterQ > 0 && (await ev(() => document.activeElement.matches(".k3-search input"))), "search narrows further and keeps the focus", afterQ);
await clear();
ok((await footTotal()) === 560 && (await ev(() => document.querySelector("#main .k3-search input").value)) === "", "Clear filters returns all 560");
const mini = await ev(() => { const m = [...document.querySelectorAll("#main .k3-mini")].find((x) => x.innerText.startsWith("With evidence")); const nn = +/([\d,]+)\//.exec(m.querySelector(".n").innerText)[1].replace(/,/g, ""); m.click(); return nn; }); await w();
ok((await footTotal()) === mini, "the With evidence bar filters to its controls", [mini, await footTotal()]);
await clear();
const want = await ev(() => { const m = PA.v3c.model(); return [...m.src.values()].filter((k) => k === "cnssi").length - [...m.src.entries()].filter(([c, k]) => k === "cnssi" && !m.set.has(c)).length + [...m.out.values()].filter((k) => k === "cnssi").length; });
await ev(() => [...document.querySelectorAll("#main .k3c-ly")].find((x) => x.innerText.startsWith("CNSSI 1253")).click()); await w();
ok((await footTotal()) === want && /CNSSI 1253 added or removed/.test(await H.main()), "the CNSSI 1253 line filters to what it added and removed", [want, await footTotal()]);
await clear();
ok((await footTotal()) === 560, "Clear returns all again");
let C = await cards();
ok(C.comp === 560 && C.base === 560 && C.layers.length === 6 && /^NIST SP 800-53 Rev 5 High 370$/.test(C.layers[0]) && /CNSSI 1253 \+201 −17 554/.test(C.layers[1]) && /Program tailoring \+14 560/.test(C.layers[5]), "the Baseline card: 560, six layers in order with what each added and removed", C.layers);

// ——— 3. Tailor a control in from the catalog, then one out, then restore it ———
const out0 = (await rail())[19].n;
await p.click("#main .k3-head-a details.k3-menu:last-of-type > summary"); await w(150);
await p.click("#main .k3-head-a details.k3-menu:last-of-type .k3-menu-i:first-child"); await w();
ok((await modalOpen()) && (await ev(() => document.querySelectorAll("#modal .k3-pick-i").length)) > 20, "Add control, From the catalog: the picker lists controls outside the baseline");
await p.fill("#modal [data-k3-pickq]", "SC-7(20)"); await w(200);
const added = await ev(() => { const it = document.querySelector("#modal .k3-pick-i:not(.held)"); const c = it.querySelector(".k3-nm-c").innerText; it.querySelector("input").click(); return c; }); await w(150);
await submit();
ok((await modalOpen()) && (await ev(() => document.querySelectorAll("#modal .k3-f.bad").length)) === 1, "a rationale is required");
await p.fill("#k3f-why", "The mission threat assessment names it."); await submit();
C = await cards();
ok(!(await modalOpen()) && C.comp === 561 && C.base === 561 && (await fact("controls", "PRG-1090")).total === 561, "the total reads one more on both cards and in fact(controls)", [C.comp, C.base]);
ok((await rows()).some((r) => r.code === added && /Program tailoring/.test(r.text)) && (await fact("control", added)).source === "Program tailoring", `${added} is in the list; its Source reads Program tailoring`);
ok(/\+15 561/.test((await cards()).layers[5]) && (await fact("baseline")).total === 561, "the Program tailoring line reads +15 and 561");
await openRow("AC-22");
ok(/Publicly Accessible Content/.test(await panel()), "AC-22 opens in its panel");
await p.click("#panel .k3-pn-a details.k3-menu > summary"); await w(150);
await ev(() => [...document.querySelectorAll("#panel .k3-menu-i")].find((x) => /Remove from the baseline/.test(x.innerText)).click()); await w();
await p.fill("#k3f-why", "Nothing of WS-X90 is publicly accessible."); await submit();
C = await cards(); R = await rail();
ok(C.base === 560 && C.comp === 560 && R[19].n === out0 + 1 && (await fact("controls", "PRG-1090")).total === 560 && (await fact("control", "AC-22")).inBaseline === false, "removed: the total is one less everywhere and Tailored out counts one more", [C.base, R[19].n]);
ok(/Tailored out/.test(await pchip()) && /Restore to the baseline/.test(await panel()), "its panel now says Tailored out and offers Restore");
await p.click("#closePanel"); await w(200); await clear();
await p.click("#main .k3-rail button.k3-rail-i:last-of-type"); await w();
ok((await rows()).some((r) => r.code === "AC-22" && /Program tailoring removed it/.test(r.text)) && (await footTotal()) === out0 + 1, "AC-22 is under Tailored out, removed by Program tailoring");
await ev(() => { const tr = [...document.querySelectorAll("#main .k3-table tbody tr")].find((t) => (t.querySelector(".k3-nm-c") || {}).innerText === "AC-22"); tr.querySelector(".btn").click(); }); await w();
await submit();
ok((await cards()).base === 561 && (await rail())[19].n === out0 && (await fact("control", "AC-22")).inBaseline, "restored: back in the baseline, Tailored out as before");
await clear();

// ——— 4. Edit baseline: switch an overlay off, read What changes, apply; then back ———
await p.click("#main .k3c-base .btn"); await w();
ok((await ev(() => document.querySelectorAll("#modal .k3c-eb-r").length)) === 6 && (await ev(() => document.querySelector("#modal [data-k3-submit]").getAttribute("aria-disabled"))) === "true", "Edit baseline lists the six layers; Apply waits for a change");
await p.click('#modal .k3c-sw[aria-label="Apply Mission Assurance Overlay"]'); await w(200);
let wc = await ev(() => document.querySelector("#modal .k3c-eb-w").innerText.replace(/\s+/g, " "));
ok(/561 now · 566 after/.test(wc) && /AC-18\b/.test(wc) && /open/.test(await H.modal()), "What changes: 561 now, 566 after, AC-18 and its four enhancements return; it says assessments are open", wc);
await submit();
C = await cards();
ok(C.base === 566 && C.comp === 566 && /Mission Assurance Overlay Not applied/.test(C.layers[2]) && (await footTotal()) === 566 && (await fact("baseline")).layers[2].on === false, "applied: the layer line, the total and the list follow", C.layers);
ok((await fact("controls", "PRG-1090")).total === 566 && (await fact("status", "AC-18")) === "no_requirement", "fact(controls) and fact(status) follow the restored controls");
await p.click("#main .k3c-base .btn"); await w();
await p.click('#modal .k3c-sw[aria-label="Apply Mission Assurance Overlay"]'); await w(200); await submit();
ok((await cards()).base === 561 && /Mission Assurance Overlay −5/.test((await cards()).layers[2]), "switched back: 561 again");

// ——— 5. A component's implementation of a control, written in the panel, kept ———
await openRow("AC-2");
ok(/Account Management/.test(await panel()) && (await sec("Implementation")) && /Mission Computer/.test((await sec("Implementation")).text), "AC-2's panel lists where it is implemented, Mission Computer among them");
await ev(() => [...document.querySelectorAll("#panel .k3-sec tr")].find((t) => /Mission Computer/.test(t.innerText)).click()); await w();
ok(/AC-2 on Mission Computer/.test(await H.modal()), "its row opens the implementation to write");
await p.selectOption("#k3f-status", "implemented"); await p.fill("#k3f-text", "The Mission Computer creates no local accounts: the maintenance role is bound to the directory group at build.");
await submit();
let im = await sec("Implementation");
ok(/creates no local accounts/.test(im.text) && /Implemented/.test(im.text), "the text and its status show on the row");
await p.click("#closePanel"); await w(200); await openRow("AC-2");
ok(/creates no local accounts/.test((await sec("Implementation")).text), "closed and reopened: kept");
await p.reload(); await w(900); await H.go("controls"); await openRow("AC-2");
const fi = await fact("impl", "AC-2", "CN-109101");
ok(/creates no local accounts/.test((await sec("Implementation")).text) && fi && fi.status === "implemented" && /creates no local accounts/.test(fi.text), "after a reload: kept, and fact(impl, AC-2, CN-109101) returns it", fi);
// opened from a component, the panel leads with that component
await ev(() => PA.v3k.openPanel("k3c-control", "AC-2@CN-109101")); await w(450);
ok(await ev(() => { const tr = document.querySelector("#panel #k3c-impl tbody tr"); return !!tr && /Mission Computer/.test(tr.innerText) && tr.classList.contains("k3c-lead"); }), "opened as AC-2@CN-109101 it leads with Mission Computer");
// the system's own narrative is the SSP's and the workbook's
await ev(() => [...document.querySelectorAll("#panel .k3-sec tr")].find((t) => /The system as a whole/.test(t.innerText)).click()); await w();
await p.fill("#k3f-text", "Accounts are managed in the corporate directory; WS-X90 maps its roles to groups."); await submit();
ok((await ev(() => PA.SSP.ctl("AC-2").n)) === "Accounts are managed in the corporate directory; WS-X90 maps its roles to groups." && (await ev(() => (PA.v2.get("sctm.ctl.AC-2") || {}).n)) === (await ev(() => PA.SSP.ctl("AC-2").n)), "the system's narrative is written to the SSP's record and the workbook's store");
// add a component, then remove it
const comps0 = (await sec("Implementation")).n;
await ev(() => [...document.querySelectorAll("#panel .k3-sec")].find((x) => x.querySelector("h2").innerText.startsWith("Implementation")).querySelector(".k3-sec-a .btn").click()); await w();
await ev(() => { const it = [...document.querySelectorAll("#modal .k3-pick-i:not(.held)")].find((x) => /Secure Boot Controller/.test(x.innerText)); it.querySelector("input").click(); }); await w(150); await submit();
ok((await sec("Implementation")).n === comps0 + 1 && /Secure Boot Controller/.test((await sec("Implementation")).text), "Add component: Secure Boot Controller now carries AC-2");
await ev(() => [...document.querySelectorAll("#panel .k3-sec tr")].find((t) => /Secure Boot Controller/.test(t.innerText)).querySelector(".btn").click()); await w(); await submit();
ok((await sec("Implementation")).n === comps0, "and Remove takes it off again");

// ——— 6. Requirements and evidence in the panel move the control along its ladder ———
const nr0 = await chip("No requirement");
await openRow("SA-24");
ok(/No requirement/.test(await pchip()) && /No requirement maps it yet/.test(await panel()), "SA-24 stands at No requirement; its next step is Add requirement");
await p.click("#panel .k3-next .btn"); await w();
ok((await ev(() => document.querySelectorAll("#modal .k3-pick-i").length)) > 50, "Add requirement: the picker over the program's requirements");
await p.click("#modal [data-k3-picknew]"); await w();
await p.fill("#k3f-title", "Mission functions continue through the loss of one partition"); await p.fill("#k3f-st", "WS-X90 shall keep its mission functions through the compromise of one partition."); await submit();
ok(/No evidence/.test(await pchip()) && (await sec("Requirements")).n === 1 && /REQ-644/.test((await sec("Requirements")).text) && (await fact("status", "SA-24")) === "no_evidence", "Create requirement: REQ-644 maps it, and SA-24 reads No evidence", await pchip());
await p.click("#closePanel"); await w(200); await clear();
ok((await chip("No requirement")) === nr0 - 1, "the No requirement chip counts one fewer", [nr0, await chip("No requirement")]);
await openRow("SA-24");
await p.click("#panel .k3-next .btn"); await w();
await p.click("#modal .k3-pick-i:not(.held) input"); await w(150); await submit();
ok(/Not assessed/.test(await pchip()) && (await sec("Evidence")).n === 1 && (await fact("status", "SA-24")) === "not_assessed", "Add evidence: SA-24 reads Not assessed and its Evidence card counts one", await pchip());
ok(/Add to assessment campaign|Plan an assessment|Open assessment campaign/.test(await ev(() => (document.querySelector("#panel .k3-next") || {}).innerText || "")), "its next step is now the assessment");
await ev(() => [...document.querySelectorAll("#panel .k3-sec")].find((x) => x.querySelector("h2").innerText.startsWith("Requirements")).querySelector("tbody .btn").click()); await w(); await submit();
ok(/No requirement/.test(await pchip()) && (await sec("Requirements")).n === 0, "Unmap: the requirement leaves and the status falls back");
await p.click("#closePanel"); await w(200);

// ——— 7. Responsibility: Inherited reads the provider's status ———
await clear(); const inh0 = await chip("Inherited");
await openRow("PE-3");
ok(/Hybrid with F-16 Block 70/.test(await panel()), "PE-3 is Hybrid with F-16 Block 70");
await ev(() => [...document.querySelectorAll("#panel .k3-facts .k3-link")].find((x) => x.innerText === "Change").click()); await w();
await p.selectOption("#k3f-kind", "Inherited"); await p.fill("#k3f-reason", "The aircraft controls every entry to the bay."); await submit();
const prov = await ev(() => PA.v2host.resp("PE-3").offer.st);
ok(/Inherited from F-16 Block 70/.test(await panel()) && (await fact("status", "PE-3")) === prov && (await ev(() => PA.v2host.resp("PE-3").kind)) === "Inherited", "changed to Inherited from F-16 Block 70; its status is the provider's", [await fact("status", "PE-3"), prov]);
await p.click("#closePanel"); await w(200); await clear();
ok((await chip("Inherited")) === inh0 + 1 && (await fact("controls", "PRG-1090")).inherited === inh0 + 1, "the Inherited chip counts one more", [inh0, await chip("Inherited")]);

// ——— 8. A parameter value, edited in the statement ———
await openRow("AC-11");
ok(/Statement/.test(await panel()) && (await ev(() => document.querySelectorAll("#panel .k3c-pv.unset").length)) === 1, "AC-11's statement prints its parameter as a placeholder");
await p.click("#panel .k3c-pv"); await w();
await p.fill("#k3f-value", "15 minutes"); await p.fill("#k3f-why", "The flightline lock interval in the squadron's operating instruction."); await submit();
ok(/device lock after 15 minutes of inactivity/.test(await panel()), "the statement prints 15 minutes in place");
await ev(() => PA.v3k.redraw()); await w();
ok(/device lock after 15 minutes of inactivity/.test(await panel()) && (await ev(() => document.querySelectorAll("#panel .k3c-pv.unset").length)) === 0, "and after a redraw");
await p.click("#closePanel"); await w(200); await clear();

// ——— 9. The workbook is one click from Controls and one click back ———
await p.click('#main .k3-head .k3-seg a[href="#sctm"]'); await w(1800);
ok((await H.hash()) === "sctm" && (await ev(() => !!document.querySelector("#sx-app .k3c-wb a[href='#controls']"))), "List to Workbook in one click; the workbook carries the same switch");
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
// a control opened from a row is this lane's panel over the workbook, with a way back
await ev(() => { const el = document.querySelector('#sx-app [data-panel="a-tests-control"]'); if (el) el.click(); }); await w(500);
ok(await ev(() => !!document.querySelector("#panel .k3-pn #k3c-impl")), "a control opened from a workbook row is the same panel, over the workbook");
await ev(() => { const a = document.querySelector('#panel .k3-pn-a a.btn[href^="#rec--"]'); if (a) a.click(); }); await w(700);
ok(/^rec--a-tests-control--/.test(await H.hash()) && /Back to the workbook/.test(await ev(() => (document.getElementById("k3task") || {}).innerText || "")), "Open control from there keeps a bar: Back to the workbook", await H.hash());
await p.click("#k3task .k3-task-b"); await w(1500);
ok((await H.hash()) === "sctm", "and it returns to the workbook");
await p.click("#sx-app .k3c-wb a[href='#controls']"); await w(600);
ok((await H.hash()) === "controls" && (await rows())[0].code === "AC-1" && /one signed baseline in the Configuration Repository, reviewed each block/.test((await rows())[0].text), "Workbook to List in one click; AC-1's row reads the text applied in the workbook");

// ——— 10. Folded addresses, and another program ———
for (const [from, to, see] of [["baseline", "controls", /Baseline/], ["baseline-params", "controls", /statement has parameters/], ["resiliency", "controls", /Clear filters/], ["resiliency-approaches", "controls", /Clear filters/], ["posture", "controls-coverage", /one row a component/], ["posture-risks", "controls-coverage", /one row a component/]]) {
  await H.go("overview"); await H.go(from, 700);
  ok((await H.hash()) === to && see.test(await H.main()) && (await navOn()) === "Controls", `${from} opens ${to}, under Controls in the menu`, await H.hash());
}
await H.go("baseline-params", 700);
ok((await footTotal()) === 9, "baseline-params: the nine controls whose statements have parameters", await footTotal());
await clear();
await H.go("resiliency", 700);
ok((await ev(() => document.querySelector('#main [data-k3-input="k3c.f.tech"]').value)) === "*" && (await footTotal()) > 100 && (await footTotal()) < 560, "resiliency: the Technique filter is on, showing the controls that support one", await footTotal());
await p.selectOption('#main [data-k3-input="k3c.f.tech"]', "segmentation"); await w();
ok((await footTotal()) > 0 && (await footTotal()) < 100, "choosing Segmentation narrows to its controls", await footTotal());
await clear();
await H.go("controls-coverage", 900);
ok(/Mission Computer/.test(await H.main()) && (await ev(() => !!document.querySelector('#main .k3-head .k3-seg .on'))) && /Coverage/.test(await ev(() => document.querySelector("#main .k3-head .k3-seg .on").innerText)), "Coverage draws the components by family under Controls' header");
// a created program: its own baseline, never WS-X90's
const seen = await createSP70(H, { nss: true });
await H.go("controls", 700);
const other = await H.main();
ok((await H.cur()) === seen.code && !/WS-X90/.test(other) && /Controls/.test(other) && (await footTotal()) > 0 && (await footTotal()) !== 561, "a created program's Controls lists its own baseline", [await H.cur(), await footTotal()]);
const t0 = await footTotal();
await H.click("Add control", "#main .k3-head", { exact: true });
await p.fill("#k3f-code", "SC-7(20)"); await p.fill("#k3f-why", "The pod's bus needs dynamic isolation."); await submit();
ok((await footTotal()) === t0 + 1 && !(await modalOpen()), "Add control works there too: one more", [t0, await footTotal()]);
await H.go("baseline", 700);
ok((await H.hash()) === "controls" && (await H.cur()) === seen.code && (await footTotal()) === t0 + 1, "its baseline address opens its own Controls too");
await ev(() => PA.v2hubs.setCur("PRG-1090")); await H.go("overview"); await H.go("controls", 700);
ok((await footTotal()) === 561, "back on WS-X90: its 561");

// ——— Widths, V3 off ———
for (const r of ["controls", "controls-coverage"]) for (const width of [1440, 390]) {
  await H.width(width); await H.go("overview"); await H.go(r, 700);
  const s = await ev(() => ({ side: document.documentElement.scrollWidth - document.documentElement.clientWidth, main: document.getElementById("main").scrollWidth - document.getElementById("main").clientWidth, nav: !!document.querySelector("#nav") }));
  ok(s.side <= 0 && s.main <= 1, `${r} at ${width}: no sideways scroll`, s);
}
await H.width(390); await H.go("controls"); await ev(() => document.querySelector("#main .k3-table tbody tr").click()); await w(500);
ok(await ev(() => !!document.querySelector("#panel .k3-pn") && document.documentElement.scrollWidth <= 390), "the panel opens at 390 without sideways scroll");
await H.width(1440);
await ev(() => PA.v3.set(false)); await w(400); await H.go("controls", 600);
ok(!(await ev(() => !!document.querySelector("#main .k3c"))) && /Controls/.test(await H.main()), "V3 off: Controls is v2's page");
} catch (e) { fails++; console.log("THREW:", String(e.message).split("\n").slice(0, 3).join(" | ")); }
console.log(`\n${n - fails} of ${n} passed`);
console.log("page errors", H.errs.slice(0, 8));
await H.b.close();
process.exit(fails || H.errs.length ? 1 : 0);
