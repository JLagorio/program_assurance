// Lane D's walk: with V3 on, through the UI, every flow of D.md's "It works when", asserting what a person would see.
//   node walk.mjs            → out/v3r-D.html (the kit, the shell, lanes C and O, lane D)
//   BUILD=…/v3r-D-all.html node walk.mjs   → every rethought lane but E
// Flows that need lane S (the component's page) run when it is in the build, and say so when it is not.
import { open, createSP70, SP } from "../../v3/P/lib.mjs";
const BUILD = process.env.BUILD || SP + "/vanta/proto/out/v3r-D.html";
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
const rail = (label) => ev((l) => { const b = [...document.querySelectorAll("#main .k3-rail-i")].find((x) => x.querySelector(".x").innerText.trim() === l); return b ? +b.querySelector(".num").innerText.replace(/\D/g, "") : null; }, label);
const chip = (label) => ev((l) => { const b = [...document.querySelectorAll("#main .k3-chip")].find((x) => x.childNodes[0].textContent.trim() === l); return b ? +b.querySelector(".num").innerText.replace(/\D/g, "") : null; }, label);
const clickRail = async (label) => { await ev((l) => { const b = [...document.querySelectorAll("#main .k3-rail-i")].find((x) => x.querySelector(".x").innerText.trim() === l); if (b) b.click(); }, label); await w(300); };
const clickChip = async (label) => { await ev((l) => { const b = [...document.querySelectorAll("#main .k3-chip")].find((x) => x.childNodes[0].textContent.trim() === l); if (b) b.click(); }, label); await w(300); };
const rows = () => count("#main .k3-table tbody tr");
const foot = () => ev(() => { const f = document.querySelector("#main .pager"); const m = f && /of ([\d,]+)/.exec(f.innerText); return m ? +m[1].replace(/,/g, "") : null; });
const panelOpen = () => ev(() => { const e = document.getElementById("panel"); return !!e && !e.hidden && !!e.innerText.trim(); });
const panelText = () => H.panel();
const sect = (title) => ev((t) => { const s = [...document.querySelectorAll("#panel .k3-sec")].find((x) => (x.querySelector("h2") || {}).childNodes[0].textContent.trim() === t); if (!s) return null; const c = s.querySelector("h2 .k3-ct"); return { count: c ? +c.innerText : null, rows: [...s.querySelectorAll("tbody tr")].map((r) => r.innerText.replace(/\s+/g, " ").trim()) }; }, title);
const sectAdd = async (title) => { await ev((t) => { const s = [...document.querySelectorAll("#panel .k3-sec")].find((x) => (x.querySelector("h2") || {}).childNodes[0].textContent.trim() === t); const b = s && s.querySelector(".k3-sec-a .btn, .k3-none-row .k3-link"); if (b) b.click(); }, title); await w(300); };
const rowAct = async (title, rowText, label) => { await ev(([t, r, l]) => { const s = [...document.querySelectorAll("#panel .k3-sec")].find((x) => (x.querySelector("h2") || {}).childNodes[0].textContent.trim() === t); const tr = s && [...s.querySelectorAll("tbody tr")].find((x) => x.innerText.includes(r)); const b = tr && [...tr.querySelectorAll("button")].find((x) => x.innerText.trim() === l); if (b) b.click(); }, [title, rowText, label]); await w(300); };
const pickSearch = async (q) => { await p.fill("#modal [data-k3-pickq]", q); await w(250); };
const pickFirst = async () => { await p.click("#modal .k3-pick-i:not(.held) input"); await w(120); };
const submit = async () => { await p.click("#modal [data-k3-submit]"); await w(450); };
const toast = () => H.toast();
const closePanel = async () => { await ev(() => { const b = document.getElementById("closePanel"); if (b) b.click(); }); await w(200); };
const focusLabel = () => ev(() => { const a = document.activeElement; return a ? a.getAttribute("aria-label") || "" : ""; });
const inView = (sel) => ev((s) => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return r.bottom > 60 && r.top < innerHeight; }, sel);
const hasS = await ev(() => typeof PA.v3.facts.components === "function" && !!PA.v3s);
const hasC = await ev(() => !!PA.P["k3c-control"]);
console.log(`build ${BUILD.split("/").pop()} · lane S ${hasS ? "in" : "not in"} the build · lane C ${hasC ? "in" : "not in"} the build\n`);

// ——— 1. Program menu → Documents → the SSP's row → typing in a narrative ———
console.log("1. Two clicks to the editor");
await H.go("overview");
await H.click("Documents", "#nav", { exact: true });
ok("1 the menu's Documents opens Documents", (await hash()) === "documents" && (await text("#main .k3-title")) === "Documents", await hash());
ok("1 its menu entry is marked", (await text("#nav a.item.on")) === "Documents", await text("#nav a.item.on"));
const docN = await rail("All documents");
ok("1 every document is one row: the SSP, three plans, the policies, the ITCSC", docN >= 26 && (await rows()) === docN && (await rail("Plans")) === 4 && (await rail("Policies")) === 21 && (await rail("Categorization")) === 1, [docN, await rows()]);
ok("1 the SSP's row says which revision is the draft", /revision 3 is the draft/.test(await text("#main tr.k3d-doc")), await text("#main tr.k3d-doc"));
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
  await ev(() => PA.v3k.openPanel("k3c-control", "AC-3")); await w(500);
  const link = await ev(() => { const b = [...document.querySelectorAll("#panel button, #panel a")].find((x) => /Open the SSP at AC-3/.test(x.innerText)); if (b) b.click(); return !!b; }); await w(1700);
  ok("2 the control panel's SSP link lands on that control in the editor", link && (await hash()) === "ssp" && (await focusLabel()) === "AC-3 implementation narrative" && (await inView("#se-c-AC-3")), [link, await hash(), await focusLabel()]);
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
ok("3 a control's Edit source opens its panel on Controls with the way back", (await hash()) === "controls" && (await panelOpen()) && /AC-1/.test(await panelText()) && /Back to SSP section 11, AC-1/.test(await text("#k3task")), [await hash(), (await panelText()).slice(0, 80), await text("#k3task")]);
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
await H.click("New document", "#main .k3-head-a"); await w(250);
await p.fill("#k3f-title", "Walk security assessment plan"); await submit();
ok("5 New document creates one and opens it", /^document--/.test(await hash()) && (await text("#main .k3-title")) === "Walk security assessment plan" && /Draft/.test(await text("#main .k3-head")), await hash());
await p.click("#main .k3d-ed"); await p.keyboard.type("Scope: the mission computing subsystem."); await ev(() => document.activeElement.blur()); await w(200);
await p.click('#main .k3-crumbs a[href="#documents"]'); await w(450);
ok("5 it is listed on Documents, with the count", (await rail("All documents")) === d0 + 1 && /Walk security assessment plan/.test(await H.main()), [d0, await rail("All documents")]);
await p.click('#main tr.k3d-doc:has-text("Walk security assessment plan") td:first-child'); await w(450);
ok("5 its row opens it again with what was written", /^document--/.test(await hash()) && /Scope: the mission computing subsystem\./.test(await text("#main .k3d-ed")));
await H.go("documents"); await H.click("New document", "#main .k3-head-a"); await w(250);
await p.selectOption("#k3f-from", "x:scrm"); await submit(); await w(300);
ok("5 a template's plan is created and opened in its editor", (await hash()) === "plan-scrm" && /Supply chain risk management plan/.test(await H.main()), await hash());
await H.go("documents");
ok("5 and listed as a draft", (await rail("All documents")) === d0 + 2 && /Supply chain risk management plan/.test(await H.main()));
await clickChip("Changes requested");
ok("5 a state chip narrows, and its count equals the rows", (await chip("Changes requested")) === (await rows()) && (await rows()) > 0, [await chip("Changes requested"), await rows()]);
await clickChip("Changes requested"); await clickRail("Policies");
ok("5 the rail's Policies shows the policies", (await rows()) === (await rail("Policies")) && (await rail("Policies")) === 21);
await p.click('#main tr.k3d-doc:has-text("Access control policy") td:first-child'); await w(500);
ok("5 a policy's row opens its page", /policy-page-ac-1$/.test(await hash()) && !(await panelOpen()) && /Access control policy and procedures/.test(await H.main()) && (await text("#nav a.item.on")) === "Documents", await hash());
await H.go("documents"); await clickRail("All documents");
await p.click('#main tr.k3d-doc:has-text("Contingency plan") .k3d-rowact summary'); await w(200);
ok("5 a row's More opens without opening the row", (await hash()) === "documents" && (await count('#main tr.k3d-doc:has-text("Contingency plan") details[open]')) === 1 && /Version history/.test(await text('#main tr.k3d-doc:has-text("Contingency plan") .k3-menu-l')), await hash());
await p.click('#main tr.k3d-doc:has-text("Contingency plan") .k3-menu-i:has-text("Version history")'); await w(500);
ok("5 its Version history opens the plan's history", (await hash()) === "plan-cp-history", await hash());

// ——— 6. Create requirement ———
console.log("\n6. Create requirement");
await H.go("requirements");
const all0 = await rail("All requirements"), eng0 = await rail("Engineering requirements"), mcReq0 = hasS ? (await fact("requirementsOf", "CN-109101")).length : null;
ok("6 the register counts every requirement: 640 engineering and the customer's 14", eng0 === 640 && all0 === 654 && (await foot()) === 654, [eng0, all0, await foot()]);
await H.click("Create requirement", "#main .k3-head-a"); await w(250);
await p.fill("#k3f-title", "Maintenance accounts are disabled between sorties"); await p.fill("#k3f-statement", "The Mission Computer shall disable every maintenance account when the maintenance session closes.");
await p.selectOption("#k3f-type", "Enforcement"); await p.fill("#k3f-ctl", "ac-2");
await ev(() => { const b = [...document.querySelectorAll("#modal .k3-checks label")].find((x) => x.innerText.trim() === "Mission Computer"); b.querySelector("input").click(); }); await submit(); await w(300);
const made = (await ev(() => PA.v3.fact("createdRequirements").filter((r) => /between sorties/.test(r.title))))[0] || {};
const code = made.code;
ok("6 Create requirement creates one, with the next code", /^REQ-\d+$/.test(code || "") && +code.slice(4) >= 644 && made.controls.join() === "AC-2" && made.components.join() === "CN-109101", made);
ok("6 it is in the register at once, first, and the counts follow", (await rail("All requirements")) === all0 + 1 && (await rail("Engineering requirements")) === eng0 + 1 && new RegExp(code).test(await text("#main .k3-table tbody tr")) && /AC-2/.test(await text("#main .k3-table tbody tr")) && /Mission Computer/.test(await text("#main .k3-table tbody tr")), await text("#main .k3-table tbody tr"));
ok("6 its panel opens with its control and its component", (await panelOpen()) && new RegExp(code).test(await panelText()) && (await sect("Controls")).count === 1 && (await sect("Components")).count === 1 && /Mission Computer/.test((await sect("Components")).rows[0]) && /CN-109101/.test((await sect("Components")).rows[0]), await sect("Components"));
await closePanel();
if (hasS) {
  await H.go("component--CN-109101--requirements", 700);
  ok("6 it is on Mission Computer's Requirements tab", new RegExp(code).test(await H.main()) && (await fact("requirementsOf", "CN-109101")).length === mcReq0 + 1, [(await fact("requirementsOf", "CN-109101")).length, mcReq0]);
  await ev((c) => { const r = [...document.querySelectorAll("#main tbody tr")].find((x) => x.innerText.includes(c)); if (r) r.click(); }, code); await w(450);
  ok("6 and opens there as the same panel", (await panelOpen()) && /between sorties/.test(await panelText()) && (await count("#panel [data-k3d-st]")) === 1);
  await closePanel();
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
await p.click("#main .k3-table tbody tr td:first-child"); await w(400);
await p.click("#panel [data-k3d-st]"); await p.keyboard.press("End"); await p.keyboard.type(" The event is logged."); await ev(() => document.activeElement.blur()); await w(250);
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
ok("7 the register's row follows each change", /AC-2, AC-3/.test(await text("#main .k3-table tbody tr")) && /\+1/.test(await text("#main .k3-table tbody tr td:nth-child(3)")) && (await text("#main .k3-table tbody tr td:nth-child(4)")) === "2", await text("#main .k3-table tbody tr"));
if (hasC) { await ev(() => PA.v3k.openPanel("k3c-control", "AC-3")); await w(450); ok("7 the control mapped here lists the requirement in its own panel", new RegExp(code).test(await panelText())); await ev((c) => PA.v3k.openPanel("k3d-req", c), code); await w(400); }
if (hasS) ok("7 the component allocated here counts it", (await fact("requirementsOf", "CN-109102")).includes(code));
await rowAct("Evidence", "Destruction certificates", "Unlink"); if (process.env.DBG) console.log("DBG", await ev(() => document.getElementById("modal").innerHTML.slice(0, 900))); await submit();
await rowAct("Controls", "AC-3", "Unmap"); await submit();
await rowAct("Components", "Secure Boot Controller", "Remove"); await submit();
ok("7 each can be undone: unlink, unmap, remove the allocation", (await sect("Evidence")).count === 1 && (await sect("Controls")).count === 1 && (await sect("Components")).count === 1, [await sect("Evidence"), await sect("Controls"), await sect("Components")]);
if (hasC) { await ev(() => PA.v3k.openPanel("k3c-control", "AC-3")); await w(450); ok("7 unmapped here, the control's panel no longer lists it", !new RegExp(code).test(await panelText())); }
if (hasS) ok("7 removed here, the component no longer counts it", !(await fact("requirementsOf", "CN-109102")).includes(code));
await closePanel();
// a requirement of the register: unmap one of its controls and map it again
await p.fill("#main .k3-search input", "REQ-001"); await w(500);
await p.click("#main .k3-table tbody tr td:first-child"); await w(400);
const c001 = (await sect("Controls")).count;
await rowAct("Controls", "AC-7", "Unmap"); await submit();
ok("7 a register requirement's control is unmapped", (await sect("Controls")).count === c001 - 1 && !(await fact("requirementsOfControl", "AC-7")).includes("REQ-001"));
await sectAdd("Controls"); await pickSearch("AC-7"); await pickFirst(); await submit();
ok("7 and mapped again", (await sect("Controls")).count === c001 && (await fact("requirementsOfControl", "AC-7")).includes("REQ-001"));
await closePanel(); await p.fill("#main .k3-search input", ""); await w(500);

// ——— 8. The customer's document, chips and counts ———
console.log("\n8. Rail and chips");
const custN = await rail("CUSA-SSRD");
await clickRail("CUSA-SSRD");
ok("8 the rail's customer document shows its requirements with the program's answers", custN === 14 && (await rows()) === 14 && /Customer A System Security Requirements Document/.test(await H.main()) && /Compliant/.test(await text("#main .k3-table tbody tr")), [custN, await rows()]);
const cmp = await chip("Compliant"); await clickChip("Compliant");
ok("8 a chip narrows, and its count equals the rows", cmp > 0 && (await rows()) === cmp, [cmp, await rows()]);
await clickRail("Engineering requirements");
for (const [label, key] of [["No control mapped", "noctl"], ["Cites no evidence", "noev"], ["Not allocated", "noalloc"]]) { const c = await chip(label); await clickChip(label); ok(`8 ${label}: the chip's count is the list's total`, c > 0 && (await foot()) === c, [c, await foot()]); await clickChip(label); }
await p.selectOption('#main .k3-flt select[data-k3-input="k3d.req.comp"]', "CN-109101"); await w(400);
ok("8 the Component filter shows what is allocated there", (await foot()) === (await ev(() => PA.v3.fact("requirementsOfComponent", "CN-109101").length)) && (await foot()) > 1, await foot());
await ev(() => PA.v2.redraw()); await w(300);
ok("8 the filter survives a redraw", (await ev(() => document.querySelector('#main .k3-flt select[data-k3-input="k3d.req.comp"]').value)) === "CN-109101");
await p.selectOption('#main .k3-flt select[data-k3-input="k3d.req.comp"]', ""); await clickRail("All requirements");
await ev(() => { const b = [...document.querySelectorAll("#main .k3d-pg button")].find((x) => x.innerText.trim() === "Next"); b.click(); }); await w(350);
ok("8 the register pages 50 at a time", (await rows()) === 50 && /^51–100 of/.test(await text("#main .pager")), await text("#main .pager"));

// ——— 9. Evidence ———
console.log("\n9. Evidence");
await H.go("evidence");
const evAll = await rail("All evidence"), kinds = [await rail("Documents"), await rail("Test records"), await rail("Datasets"), await rail("Scan results")];
ok("9 the register counts every artifact, and the kinds add up", evAll === (await fact("artifacts")).length && kinds.reduce((a, b) => a + b, 0) === evAll && (await fact("evidence")).total === evAll, [evAll, kinds]);
await clickRail("Test records");
ok("9 a rail kind filters", (await foot()) === kinds[1] && (await ev(() => [...document.querySelectorAll("#main .k3-table tbody tr td:nth-child(2)")].every((x) => x.innerText.trim() === "Test record"))), [await foot(), kinds[1]]);
await clickRail("STIG checklists");
ok("9 STIG checklists are a kind of evidence", (await rows()) === (await rail("STIG checklists")) && (await rows()) === 7);
await p.click("#main .k3-table tbody tr td:first-child"); await w(500);
ok("9 a checklist's row opens the checklist's own page", /^stigs-/.test(await hash()), await hash());
await H.go("evidence"); await clickRail("All evidence");
const pend0 = await chip("Waiting on review"), st0 = (await fact("requirement", "REQ-248")).state;
await p.fill("#main .k3-search input", "Time source comparison"); await w(500);
await p.click("#main .k3-table tbody tr td:first-child"); await w(400);
ok("9 the artifact's panel holds its review, its versions and who cites it", /Waiting on review/.test(await panelText()) && (await sect("Cited by")).count === 1 && /REQ-248/.test((await sect("Cited by")).rows[0]) && (await sect("Versions")).count === 1 && (await count('#panel [data-k3="k3d.ev.accept"]')) === 1, (await panelText()).slice(0, 160));
await p.click('#panel [data-k3="k3d.ev.accept"]'); await w(450);
await p.fill("#main .k3-search input", ""); await w(500);
ok("9 Accept is done there: the chip counts one less", /Accepted/.test(await text("#panel .k3-pn-h")) && (await chip("Waiting on review")) === pend0 - 1 && (await fact("evidence")).pending === pend0 - 1, [pend0, await chip("Waiting on review")]);
ok("9 the requirement that cites it follows", st0 === "Evidence in review" && (await fact("requirement", "REQ-248")).state === "Supported", [st0, (await fact("requirement", "REQ-248")).state]);
await sectAdd("Cited by"); await pickSearch("REQ-249"); await pickFirst(); await submit();
ok("9 Link to a requirement, from the artifact", (await sect("Cited by")).count === 2 && (await fact("requirement", "REQ-249")).evidence.length >= 1, await sect("Cited by"));
await rowAct("Cited by", "REQ-249", "Unlink"); await submit();
ok("9 and unlinked again", (await sect("Cited by")).count === 1);
await closePanel();
await H.click("Add evidence", "#main .k3-head-a"); await w(250);
await p.fill("#k3f-title", "Walk scan of the mission network"); await p.selectOption("#k3f-kind", "Scan result"); await p.fill("#k3f-renew", "2026-12-01"); await p.fill("#k3f-req", "req-250"); await submit();
ok("9 Add evidence adds an artifact, linked to the requirement named, waiting on review", (await rail("All evidence")) === evAll + 1 && (await rail("Scan results")) === kinds[3] + 1 && (await chip("Waiting on review")) === pend0 && (await chip("Expiring")) === 1 && (await fact("requirement", "REQ-250")).evidence.length >= 1, [await rail("All evidence"), await chip("Waiting on review"), await chip("Expiring")]);
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
await H.go("overview", 250); await H.go("policies", 500); ok("10 policies lands on the Policies of Documents", (await ev(() => (document.querySelector("#main .k3-rail-i.on .x") || {}).innerText)) === "Policies");
await H.go("overview", 250); await H.go("stigs", 500); ok("10 stigs lands on the STIG checklists of Evidence", (await ev(() => (document.querySelector("#main .k3-rail-i.on .x") || {}).innerText)) === "STIG checklists" && (await rows()) === 7);
await H.go("overview", 250); await H.go("requirements-compliance", 500); ok("10 requirements-compliance lands on the customer's document", (await ev(() => (document.querySelector("#main .k3-rail-i.on .x") || {}).innerText)) === "CUSA-SSRD" && (await rows()) === 14);
await H.go("overview", 250); await H.go("rec--v7p-req--REQ-002", 800); ok("10 a requirement's old record address opens its panel on Requirements", (await hash()) === "requirements" && (await panelOpen()) && /REQ-002/.test(await panelText()), await hash()); await closePanel();
await ev(() => PA.v3k.openPanel("v7p-req", "REQ-003")); await w(400); ok("10 the old requirement preview draws the new panel", (await count("#panel [data-k3d-st]")) === 1 && /REQ-003/.test(await panelText())); await closePanel();
await H.go("itcsc", 500); ok("10 the ITCSC keeps its own page, under Documents in the menu", (await text("#nav a.item.on")) === "Documents" && /IT categorization/.test(await H.main()), await text("#nav a.item.on"));
await H.go("documents"); await clickRail("All documents"); await p.click('#main tr.k3d-doc:has-text("IT categorization") td:first-child'); await w(500); ok("10 the ITCSC's row opens it", (await hash()) === "itcsc");
// a reload of the address keeps what was done
await H.go("requirements"); await p.reload(); await w(900);
ok("10 after a reload, the created requirement, its links and the accepted review are still there", (await hash()) === "requirements" && new RegExp(code).test(await text("#main .k3-table tbody tr")) && (await fact("requirement", code)).evidence.length === 1 && (await fact("evidence")).pending === pend0 && (await fact("requirement", "REQ-248")).state === "Supported", [(await fact("requirement", code)), (await fact("evidence"))]);
// V3 off: the pages only V3 has say so; v2's own pages are v2's
await ev(() => PA.v3.set(false)); await H.go("documents", 500);
ok("10 with V3 off, Documents says it belongs to V3", /Part of V3/.test(await H.main()));
await H.go("requirements", 500); ok("10 with V3 off, Requirements is v2's page", (await count("#main .k3-rail")) === 0 && /Requirements/.test(await H.main()));
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
ok("10 back on WS-X90, its register is whole again", (await rail("Engineering requirements")) === eng0 + 1, await rail("Engineering requirements"));

// ——— Every route this lane owns: no page errors, no sideways scroll, the menu marked ———
console.log("\nRoutes at 1440 and 390");
const ROUTES = [["documents", "Documents"], ["requirements", "Requirements"], ["evidence", "Evidence"], ["evidence-sources", "Evidence"], ["ssp", "Documents"]].concat([["document--" + ((await ev(() => (PA.v3k.get("doc.made", []) || [])[0] || {})).id || "none"), "Documents"]]);
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
