// Lane S's walk: with V3 on, through the UI, every flow of S.md's "It works when", asserting what a person would see.
// usage: node walk.mjs [build.html] [width]   (default: proto/out/v3r3-S.html at 1440)
// Pass 3: one row over every table. A list's actions stand at the end of that row (TB), a filter is a select in it
// (a classic one by its action, a folded one by its key), and the Boundary's authorization is such a filter.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta";
const fs = require("fs");
// The build carries no charset line and the browser sometimes guesses Latin-1: the walk reads a copy with a byte-order mark.
const build = SP + "/v3r/S/.walk-build.html";
fs.writeFileSync(build, "\ufeff" + fs.readFileSync(process.argv[2] || SP + "/proto/out/v3r3-S.html", "utf8").replace(/^\ufeff/, ""));
// usage: node walk.mjs [build.html] [width]   (width 1440 by default; 390 walks the same steps on a phone)
const W = +(process.argv[3] || 1440), VP = { width: W, height: W > 600 ? 900 : 800 };
console.log(`walk S on ${process.argv[2] || SP + "/proto/out/v3r3-S.html"} at ${W}px`);
const b = await chromium.launch(); const p = await b.newPage({ viewport: VP, hasTouch: W < 600 });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/ERR_FAILED|fonts/.test(m.text())) errs.push("console: " + m.text()); });
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) pass++; else fail++; console.log(c ? "ok  " : "FAIL", n, c ? "" : d === undefined ? "" : JSON.stringify(d)); };
const wait = (ms = 350) => p.waitForTimeout(ms);
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await wait(450); };
const hash = () => p.evaluate(() => location.hash.slice(1));
const main = () => p.evaluate(() => document.getElementById("main").innerText.replace(/\s+/g, " "));
const panel = () => p.evaluate(() => { const e = document.getElementById("panel"); return e && !e.hidden ? e.innerText.replace(/\s+/g, " ") : ""; });
const modal = () => p.evaluate(() => { const e = document.getElementById("modal"); return e && !e.hidden ? e.innerText.replace(/\s+/g, " ") : ""; });
const toast = () => p.evaluate(() => (document.getElementById("v2-toast") || {}).innerText || "");
const rows = (i = 0) => p.evaluate((i) => { const t = document.querySelectorAll("#main .k3-table")[i]; return t ? [...t.querySelectorAll("tbody tr:not(.k3-grow)")].map((r) => r.innerText.replace(/\s+/g, " ").trim()) : []; }, i);
const tabCount = (label) => p.evaluate((l) => { const a = [...document.querySelectorAll("#main .k3-tabs a")].find((x) => x.textContent.trim().startsWith(l)); const c = a && a.querySelector(".k3-ct"); return c ? +c.textContent.replace(/,/g, "") : null; }, label);
// The Subsystem filter beside the search (it was a rail down the side): its options carry their counts.
const SUB = '#main select[data-k3-input="k3s.sub"]';
const pickSub = async (code) => { await p.selectOption(SUB, code); await wait(450); };
const TB = "#main .k3-tb .k3-tools-r";
// A filter of the row: by its action (a classic one) or its key (a folded one), chosen by the option's text; "" clears it.
const pickFilter = async (which, text) => { const r = await p.evaluate(([which, text]) => { const s = document.querySelector(`#main .k3-tb select[data-k3-input="${which}"], #main .k3-tb select[data-k3-fkey="${which}"]`); if (!s) return "no filter " + which; const i = text === "" ? 0 : [...s.options].findIndex((o) => o.textContent.trim().replace(/ \(\d[\d,]*\)$/, "").replace(/^[^:]+: /, "") === text); if (i < 0) return "no option " + text + " in " + [...s.options].map((o) => o.textContent).join(" | "); s.selectedIndex = i; s.dispatchEvent(new Event("input", { bubbles: true })); s.dispatchEvent(new Event("change", { bubbles: true })); return ""; }, [which, text]); if (r) console.log("     pickFilter: " + r); await wait(450); };
const toolbar = () => p.evaluate(() => { const t = document.querySelector("#main .k3-tb"); if (!t) return null; const kids = [...t.children].flatMap((c) => (c.classList.contains("k3-fs") ? [...c.children] : [c])).filter((e) => e.getClientRects().length); return { list: t.getAttribute("data-k3-list") || "", lines: new Set(kids.map((e) => Math.round((e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2) / 10))).size, view: (t.querySelector(".k3-vname") || { textContent: "" }).textContent, edited: !!t.querySelector(".k3-vedit"), filters: [...t.querySelectorAll(".k3-flt select")].map((x) => x.getAttribute("aria-label")), on: [...t.querySelectorAll(".k3-flt.on select")].map((x) => x.options[x.selectedIndex].textContent), acts: [...t.querySelectorAll(".k3-tools-r .btn, .k3-tools-r summary, .k3-tools-r .k3-seg > *")].map((e) => e.textContent.trim()), q: (t.querySelector("input[type=search]") || {}).value || "" }; });
const viewMenu = async (label) => { await p.click("#main .k3-vbtn"); await wait(120); const r = await p.evaluate((l) => { const x = [...document.querySelectorAll("#main .k3-vlist .k3-menu-i")].find((e) => e.textContent.trim().startsWith(l)); if (!x) return [...document.querySelectorAll("#main .k3-vlist .k3-menu-i")].map((e) => e.textContent.trim()).join(" | "); x.click(); return ""; }, label); if (r) console.log("     viewMenu: no " + label + " in " + r); await wait(450); };
const panelSecs = () => p.evaluate(() => [...document.querySelectorAll("#panel .k3-pn .k3-sec")].map((s) => { const h = s.querySelector("h2").cloneNode(true), ct = h.querySelector(".k3-ct"), n = ct ? +ct.textContent.replace(/,/g, "") : null; if (ct) ct.remove(); const a = s.querySelector(".k3-pk-all"); return { title: h.textContent.trim(), n, rows: s.querySelectorAll("tbody tr").length, all: a ? a.getAttribute("href").slice(1) : "", tall: [...s.querySelectorAll("tbody tr")].filter((r) => r.getBoundingClientRect().height > 44).length }; }));
const subCount = async (code) => { const was = await p.evaluate((s) => (document.querySelector(s) || {}).value || "", SUB); if (was === code) await pickSub(""); const n = await p.evaluate(([s, c]) => { const o = [...document.querySelectorAll(s + " option")].find((x) => x.value === c); const m = o && /\((\d+)\)/.exec(o.textContent); return m ? +m[1] : null; }, [SUB, code]); if (was === code) await pickSub(code); return n; };
// Click the first visible thing in scope whose text matches (shortest first).
const click = async (text, scope = "#main", o = {}) => {
  const r = await p.evaluate(([text, scope, exact, sel]) => {
    const root = document.querySelector(scope); if (!root) return "no scope";
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest("[hidden]"); };
    const m = [...root.querySelectorAll(sel || "a,button,summary,tr[tabindex],label,[role=button]")].filter(vis).filter((e) => { const t = norm(e.innerText), al = norm(e.getAttribute("aria-label")); return exact ? t === text || al === text : t.toLowerCase().includes(text.toLowerCase()) || al.toLowerCase().includes(text.toLowerCase()); });
    m.sort((a, b) => norm(a.innerText).length - norm(b.innerText).length);
    if (!m[0]) return "NOT FOUND: " + text;
    m[0].scrollIntoView({ block: "center" }); m[0].setAttribute("data-w", "1"); return "ok";
  }, [text, scope, !!o.exact, o.sel || null]);
  if (r !== "ok") { console.log("     click:", r); return false; }
  // A row is clicked on its name, never on its eye (which sits at the end of the first value and opens the preview).
  const isRow = await p.evaluate(() => document.querySelector("[data-w='1']").tagName === "TR");
  await p.click("[data-w='1']", isRow ? { timeout: 2500, position: { x: 30, y: 16 } } : { timeout: 2500 }).catch(() => p.evaluate(() => { const e = document.querySelector("[data-w='1']"); (e.tagName === "TR" ? e.querySelector("td") : e).click(); }));
  await p.evaluate(() => { const x = document.querySelector("[data-w='1']"); if (x) x.removeAttribute("data-w"); });
  await wait(o.wait || 400); return true;
};
const menu = async (label, item, scope = "#main") => { await click(label, scope, { sel: "summary", exact: false }); return click(item, scope, { sel: ".k3-menu-i", exact: true }); };
const tab = (label) => click(label, "#main .k3-tabs", { sel: "a" });
const fill = async (key, v) => { await p.fill("#k3f-" + key, v); };
const choose = async (key, v) => { await p.selectOption("#k3f-" + key, v); };
const submit = async () => { await p.click("#modal [data-k3-submit]"); await wait(450); };
const closePanel = async () => { await p.evaluate(() => { const b = document.getElementById("closePanel"); if (b && !document.getElementById("panel").hidden) b.click(); }); await wait(250); };
// A row goes to the record's page; its eye opens the preview. openRow is the preview (the eye), gotoRow the page (the row).
const openRow = async (id) => { const ok2 = await p.evaluate((id) => { const tr = [...document.querySelectorAll("#main .k3-table tr[data-id]")].find((r) => r.getAttribute("data-id") === id); if (!tr) return false; const eye = tr.querySelector(".k3-eye"); tr.scrollIntoView({ block: "center" }); (eye || tr).click(); return true; }, id); if (!ok2) console.log("     openRow: no row " + id); await wait(450); };
const gotoRow = async (id) => { await p.click(`#main .k3-table tr[data-id="${id}"]`, { timeout: 3000, position: { x: 30, y: 16 } }).catch((e) => console.log("     gotoRow: no row " + id)); await wait(500); };
const eyeOf = async (text) => { const ok2 = await p.evaluate((text) => { const tr = [...document.querySelectorAll("#main .k3-table tbody tr")].find((r) => r.innerText.includes(text)); const eye = tr && tr.querySelector(".k3-eye"); if (!eye) return false; tr.scrollIntoView({ block: "center" }); eye.click(); return true; }, text); if (!ok2) console.log("     eyeOf: no eye on " + text); await wait(450); };
const back = async () => { await p.evaluate(() => history.back()); await wait(500); };
const fact = (name, ...a) => p.evaluate(([n, a]) => PA.v3.fact(n, ...a), [name, a]);
const MC = "component--CN-109101";

// ——— 1. System → a subsystem in the filter → Mission Computer's row → its page ———
console.log("\n1. The list, the filter and the record");
if (W > 600) await click("System", "#nav", { sel: "a.item", exact: true }); else await go("system");
ok("System opens from the program menu and is marked", (await hash()) === "system" && (await p.evaluate(() => /System/.test((document.querySelector("#nav a.item.on") || {}).innerText || ""))));
const all0 = await tabCount("Components");
ok("nothing runs down the side: System's kinds are its tabs, the subsystem a filter beside the search", !(await p.$("#main .k3-rail:not(.k3-rtabs)")) && !(await p.$("#main .k3-split")) && (await p.evaluate(() => [...document.querySelectorAll("#main .k3-tabs a")].map((a) => a.childNodes[0].textContent.trim()).join(" | "))) === "Components | Host and providers | Connected systems | Connections" && !!(await p.$(SUB)), await p.evaluate(() => [...document.querySelectorAll("#main .k3-tabs a")].map((a) => a.innerText).join(" | ")));
ok("Components lists every component inside the boundary (27)", all0 === 27 && (await rows()).length === 27, [all0, (await rows()).length]);
const subN = await subCount("CN-109001"); await pickSub("CN-109001");
ok("the Subsystem filter narrows in place to its 3 components", (await hash()) === "system" && (await rows()).length === 3 && subN === 3 && (await rows()).every((r) => /Mission Computer|Secure Boot|Cryptographic/.test(r)), await rows());
await eyeOf("Mission Computer");
ok("a row's eye opens the component's preview over the list", (await hash()) === "system" && /^Component /.test(await panel()) && /Mission Computer/.test(await panel()) && /Open component/.test(await panel()), (await panel()).slice(0, 160));
await closePanel();
await click("Mission Computer", "#main .k3-table", { sel: "tbody tr[tabindex]" });
ok("one click opens Mission Computer's page", (await hash()) === MC && /Mission Computer/.test(await p.evaluate(() => document.querySelector("#main .k3-title").innerText)));
ok("the program menu is still there, System marked", await p.evaluate(() => /System/.test((document.querySelector("#nav a.item.on") || {}).innerText || "") && document.querySelectorAll("#nav a.item").length >= 10));
ok("breadcrumb System › Mission Computing Subsystem › Mission Computer", /System › Mission Computing Subsystem › Mission Computer/.test((await p.evaluate(() => document.querySelector("#main .k3-crumbs").innerText)).replace(/\s+/g, " ")));
ok("the page says component, never element, and has no 'Open in' link", !/element/i.test(await main()) && !/Open in /i.test(await main()));
await p.evaluate(() => history.back()); await wait(500);
ok("Back returns to System with the subsystem still chosen", (await hash()) === "system" && (await rows()).length === 3 && (await p.evaluate((s) => document.querySelector(s).value, SUB)) === "CN-109001");
await p.screenshot({ path: `${SP}/v3r/S/look/w1-list.jpg`, type: "jpeg", quality: 60 });

// One number everywhere this lane draws: the row, the tabs, the panel and the facts are the lengths of the same lists.
await pickSub("");
const mcRow = (await rows()).find((r) => /^Mission Computer /.test(r));
const cc = await fact("componentCounts", "CN-109101");
ok("System's row for Mission Computer reads the lists' own lengths", new RegExp(` ${cc.controls} ${cc.requirements} ${cc.findings} `).test(mcRow + " "), [mcRow, cc]);
await go(MC);
ok("its tabs read the same", (await tabCount("Controls")) === cc.controls && (await tabCount("Requirements")) === cc.requirements && (await tabCount("Findings")) === cc.findings && (await tabCount("Software & firmware")) === cc.items, cc);
for (const [t, n] of [["Controls", cc.controls], ["Requirements", cc.requirements], ["Findings", cc.findings]]) { await tab(t); ok(`${t}: ${n} rows behind the count`, (await rows()).length === n, (await rows()).length); }
await tab("Controls");
ok("and each control's row says why it stands here", (await p.evaluate(() => { const t = document.querySelectorAll("#main .k3-table")[0]; return [...t.querySelectorAll("tbody tr")].every((r) => /Mapped by REQ-\d+|Named in implementation|Placed here/.test(r.innerText)); })));
await go("requirements"); await p.evaluate(() => PA.v3k.openPanel("v7p-el", "CN-109101")); await wait(400);
ok("the component's panel on another page reads the same", new RegExp(`Controls ${cc.controls}\\b.* Requirements ${cc.requirements}\\b.* Findings ${cc.findings}\\b`).test(await panel()), (await panel()).slice(0, 300));
await closePanel();
ok("the old counts with no rows behind them (98 controls, 102 requirements) are drawn nowhere here", cc.controls !== 98 && !/\b98\b/.test(mcRow) && !/\b102\b/.test(mcRow));

// ——— 2. Software & firmware: add, edit, remove ———
console.log("\n2. Software and firmware on the component");
await go(MC); await tab("Software & firmware");
const sw0 = await tabCount("Software & firmware");
ok("the tab lists the component's items (firmware pins, the image with its SBOM, the unit)", sw0 === 4 && (await rows()).some((r) => /MC-FW.*4\.2\.1/.test(r)) && (await rows()).some((r) => /13 parts/.test(r)), [sw0, await rows()]);
await click("Add item", "#main .k3-tools");
ok("Add item opens a form on this page", /Add software or firmware/.test(await modal()) && (await hash()) === MC + "--software");
await submit();
ok("required fields are refused", (await p.evaluate(() => document.querySelectorAll("#modal .k3-f.bad").length)) >= 3);
await choose("kind", "Firmware"); await fill("version", "5.0"); await fill("name", "MC-FW"); await submit();
ok("the row is there", (await rows()).some((r) => /MC-FW/.test(r) && /5\.0/.test(r) && /Firmware/.test(r)), await rows());
ok("the tab's count follows", (await tabCount("Software & firmware")) === sw0 + 1);
await go("system");
ok("System's row follows", (await rows()).some((r) => /Mission Computer/.test(r) && /\+2/.test(r)), (await rows()).filter((r) => /Mission Computer /.test(r)));
await go(MC + "--software");
await click("5.0", "#main .k3-table", { sel: "tbody tr" });
ok("the row opens its edit form", /Edit item/.test(await modal()));
await fill("version", "5.1"); await submit();
ok("its version is edited", (await rows()).some((r) => /MC-FW/.test(r) && /5\.1/.test(r)) && !(await rows()).some((r) => /5\.0/.test(r)));
await p.evaluate(() => PA.v2.redraw()); await wait(300);
ok("it survives a redraw", (await rows()).some((r) => /5\.1/.test(r)));
const its = await fact("items", "CN-109101");
ok("fact items(component) gives its rows by kind, the reader's own marked", its.firmware.some((x) => x.name === "MC-FW" && x.version === "5.1" && x.added) && its.firmware.filter((x) => !x.added).length === 2 && its.software.length === 1 && its.hardware.length === 1, its);
await p.evaluate(() => { const r = [...document.querySelectorAll("#main .k3-table tbody tr")].find((x) => /5\.1/.test(x.innerText)); r.querySelector(".k3s-x").click(); }); await wait(350);
ok("Remove asks first, naming what it touches", /leaves Mission Computer/.test(await modal()));
await submit();
ok("removed: the row is gone and the count is back", !(await rows()).some((r) => /5\.1/.test(r)) && (await tabCount("Software & firmware")) === sw0);

// ——— 3. Controls: add two, write one's implementation, remove one ———
console.log("\n3. Controls on the component");
await tab("Controls");
const c0 = await tabCount("Controls");
ok("every control placed here is listed, not a sample", c0 > 12 && (await p.evaluate(() => /(\d+) of (\d+) controls/.exec(document.querySelector("#main .pager").innerText).slice(1, 3).join("=") )) === `${c0}=${c0}` && (await rows()).length === c0, [c0, (await rows()).length]);
await click("Add controls", "#main .k3-tools");
ok("Add controls opens the picker over the baseline, held ones marked", /Add controls to Mission Computer/.test(await modal()) && (await p.evaluate(() => document.querySelectorAll("#modal .k3-pick-i.held").length)) > 0);
const picked = await p.evaluate(() => { const l = [...document.querySelectorAll("#modal .k3-pick-i:not(.held) input")].slice(0, 2); l.forEach((i) => i.click()); return l.map((i) => i.value); });
await wait(200);
ok("the button counts the choice", /Add 2 controls/.test(await p.evaluate(() => document.querySelector("#modal [data-k3-submit]").innerText)));
await submit();
await p.fill("#main .k3-search input", picked[0]); await wait(500);
ok(`${picked[0]} is in the tab`, (await rows()).some((r) => r.startsWith(picked[0] + " ")), await rows());
await p.fill("#main .k3-search input", ""); await wait(500);
ok("the count follows (+2)", (await tabCount("Controls")) === c0 + 2, await tabCount("Controls"));
ok(`fact componentsOf(${picked[0]}) includes this component`, (await fact("componentsOf", picked[0])).includes("CN-109101"));
ok("fact controlsOf(component) includes both", picked.every((k) => true) && (await fact("controlsOf", "CN-109101")).filter((k) => picked.includes(k)).length === 2);
await p.fill("#main .k3-search input", picked[0]); await wait(500);
await gotoRow(picked[0] + "@CN-109101");
ok("a control's row goes to the control's page, which names this component", new RegExp("^control--" + picked[0].replace(/[()]/g, "\\$&") + "(%40|@)CN-109101$").test(await hash()) && /Mission Computer/.test(await main()) && !!(await p.$("#main .k3-title")), await hash());
ok("the way back from it is on the page: the component in its breadcrumb or its first row, and Back", (await p.evaluate(() => !!document.querySelector('#main a[href="#component--CN-109101"], #main a[href^="#component--CN-109101--"]'))), await p.evaluate(() => (document.querySelector("#main .k3-crumbs") || {}).innerText));
await back();
ok("Back returns to the component's Controls tab, the search kept", (await hash()) === MC + "--controls" && (await p.evaluate(() => document.querySelector("#main .k3-search input").value)) === picked[0]);
await openRow(picked[0] + "@CN-109101");
ok("the row's eye opens the control's preview on this component", new RegExp(picked[0]).test(await panel()) && /Mission Computer/.test(await panel()), (await panel()).slice(0, 200));
// On the whole build the panel is Controls' own (lane C): the component's row there opens the same form.
if (await p.$("#panel tr.k3c-lead")) { await p.click("#panel tr.k3c-lead td:nth-child(2)"); await wait(400); } else await click("Write implementation", "#panel", { sel: "button.btn" });
if (await p.evaluate(() => { const e = document.getElementById("k3f-status"); return !!e && !e.value; })) await p.selectOption("#k3f-status", { index: 1 });
ok("its implementation is written here, in a form", (await modal()).startsWith(`${picked[0]} on Mission Computer`), (await modal()).slice(0, 80));
await fill("text", "The Mission Computer enforces this in its separation kernel; the walk wrote this line."); await submit();
ok("the panel shows what was written", /the walk wrote this line/.test(await panel()), (await panel()).slice(0, 300));
await closePanel();
ok("the row reads Written", (await rows()).some((r) => r.startsWith(picked[0] + " ") && / Written /.test(r)), await rows());
await openRow(picked[0] + "@CN-109101");
ok("closed and reopened, it is kept", /the walk wrote this line/.test(await panel()));
await closePanel();
await go(MC + "--controls"); await wait(200);
ok("it survives leaving and returning (the search is kept too)", (await p.evaluate(() => document.querySelector("#main .k3-search input").value)) === picked[0] && (await rows()).some((r) => r.startsWith(picked[0] + " ") && / Written /.test(r)));
await p.fill("#main .k3-search input", picked[1]); await wait(500);
await p.evaluate((id) => document.querySelector(`#main .k3-table tr[data-id="${id}"] .k3s-x`).click(), picked[1] + "@CN-109101"); await wait(350);
ok("Remove asks first and says where the control stays", /stays in the baseline/.test(await modal()), await modal());
await submit(); await p.fill("#main .k3-search input", ""); await wait(500);
ok("removed: the count follows and the fact no longer lists it", (await tabCount("Controls")) === c0 + 1 && !(await fact("componentsOf", picked[1])).includes("CN-109101"));

// ——— 4. Requirements: create one here, mapped to a control of this component ———
console.log("\n4. Requirements on the component");
await tab("Requirements");
const r0 = await tabCount("Requirements");
ok("the tab lists the requirements allocated here", r0 > 0 && (await rows()).length === r0, [r0, (await rows()).length]);
await click("Add requirement", "#main .k3-tools");
ok("the picker's first line is Create requirement; allocated ones are marked", /Create requirement/.test(await modal()) && (await p.evaluate(() => document.querySelectorAll("#modal .k3-pick-i.held").length)) === r0);
await p.click("#modal [data-k3-picknew]"); await wait(350);
ok("Create requirement opens its form", /Create requirement/.test(await modal()) && !!(await p.$("#k3f-ctl")));
await fill("title", "Mission Computer partitions are measured at boot"); await fill("statement", "The Mission Computer shall measure every partition before it runs."); await choose("ctl", picked[0]); await submit();
const made = (await rows()).find((r) => /partitions are measured at boot/.test(r));
ok("it is in the tab, mapped to the control chosen", !!made && made.includes(picked[0]), await rows());
ok("the count follows", (await tabCount("Requirements")) === r0 + 1);
const mr = await fact("madeRequirements");
ok("fact madeRequirements carries it with its control and component", mr.length === 1 && mr[0].controls.includes(picked[0]) && mr[0].components.includes("CN-109101"), mr);
await click("partitions are measured", "#main .k3-table", { sel: "tbody tr[tabindex]" });
ok("a requirement's row goes to the requirement's page, which lists this component", /^requirement--REQ-\d+$/.test(await hash()) && /shall measure every partition/.test(await main()) && /Mission Computer/.test(await main()), [await hash(), (await main()).slice(0, 160)]);
await back();
await eyeOf("partitions are measured");
ok("its panel shows the statement, the control and the component", /shall measure every partition/.test(await panel()) && new RegExp(picked[0].replace(/[()]/g, "\\$&")).test(await panel()) && /Mission Computer/.test(await panel()), (await panel()).slice(0, 300));
await closePanel();
await tab("Controls"); await p.fill("#main .k3-search input", picked[0]); await wait(500);
await openRow(picked[0] + "@CN-109101");
ok("the control's panel lists the new requirement under this component", /partitions are measured at boot/.test(await panel()));
await closePanel(); await p.fill("#main .k3-search input", ""); await wait(450);

// ——— 5. Connections: between two components, and to an outside system ———
console.log("\n5. Connections");
await tab("Connections");
const x0 = await tabCount("Connections");
await click("Add connection", "#main .k3-tools");
ok("Add connection: the other end is chosen from components and outside systems", (await p.evaluate(() => { const o = [...document.querySelectorAll("#k3f-to option")].map((x) => x.textContent); return o.some((t) => /Navigation Processor/.test(t)) && o.some((t) => /GPS/.test(t)) && document.querySelector("#k3f-from").value === "CN-109101"; })));
await fill("name", "Navigation data bus"); await choose("to", "CN-109104"); await fill("iface", "MIL-STD-1553B"); await fill("protocol", "MIL-STD-1553B messages"); await fill("port", "RT 12"); await submit(); await wait(300);
ok("the reader stays on the tab; the toast offers the connection's page", (await hash()) === MC + "--connections" && /Connection added: Mission Computer to Navigation Processor/.test(await toast()) && /Open connection/.test(await toast()) && !(await panel()), await toast());
ok("it shows on this component", (await rows()).some((r) => /Navigation data bus/.test(r) && /Navigation Processor/.test(r) && /RT 12/.test(r)) && (await tabCount("Connections")) === x0 + 1, await rows());
await click("Navigation data bus", "#main .k3-table", { sel: "tbody tr[tabindex]" });
ok("a connection's row goes to the connection's page: System › Connections › it", /^connection--CX-\d+$/.test(await hash()) && /System › Connections › Navigation data bus/.test((await p.evaluate(() => document.querySelector("#main .k3-crumbs").innerText)).replace(/\s+/g, " ")) && (W < 600 || (await p.evaluate(() => /System/.test((document.querySelector("#nav a.item.on") || {}).innerText || "")))), await hash());
ok("the page holds its ports with Add port, its agreement, and the components it joins", /Ports and protocols 1/.test(await main()) && /RT 12/.test(await main()) && /Add port/.test(await main()) && /Agreement/.test(await main()) && /Components it joins 2/.test(await main()) && /Both ends are inside the boundary/.test(await main()), (await main()).slice(0, 400));
await click("Add port", "#main .k3-head", { sel: "button.btn" }); await fill("protocol", "Discrete"); await fill("port", "J2-14"); await submit();
ok("Add port on the page: the row is there and the count follows", /Ports and protocols 2/.test(await main()) && /J2-14/.test(await main()));
await click("Navigation Processor", "#main", { sel: "tbody tr[tabindex]" });
ok("a component it joins goes to that component", (await hash()) === "component--CN-109104", await hash());
await back(); await back();
ok("Back, twice, returns to Mission Computer's Connections", (await hash()) === MC + "--connections" && (await rows()).some((r) => /Navigation data bus/.test(r) && /J2-14|\+1/.test(r)), [await hash(), await rows()]);
await go("component--CN-109104--connections");
ok("and on the other component", (await rows()).some((r) => /Navigation data bus/.test(r) && /Mission Computer/.test(r)), await rows());
await go("system-connections");
const xs0 = (await rows()).length;
ok("and on System's Connections tab, as one that stays inside", (await rows()).some((r) => /Navigation data bus/.test(r) && / Inside /.test(r)), (await rows()).filter((r) => /Navigation data/.test(r)));
await go("system-boundary");
ok("and in the Boundary view", /Mission Computer ↔ Navigation Processor/.test(await main()));
await p.screenshot({ path: `${SP}/v3r/S/look/w5-boundary.jpg`, type: "jpeg", quality: 60, fullPage: true });
await go("system");
const att0 = await p.evaluate(() => +[...document.querySelectorAll("#main .k3-att-r")].find((x) => /without an agreement/i.test(x.innerText)).querySelector(".n").textContent);
await go(MC + "--connections"); await click("Add connection", "#main .k3-tools");
await fill("name", "Range safety uplink"); await choose("to", "EXT-108"); await fill("iface", "RF"); await submit(); await wait(300);
ok("a connection to an outside system says it has no agreement", (await rows()).some((r) => /Range safety uplink/.test(r) && /No agreement/.test(r)) && /needs an agreement/.test(await toast()), await rows());
await go("system");
const att1 = await p.evaluate(() => +[...document.querySelectorAll("#main .k3-att-r")].find((x) => /without an agreement/i.test(x.innerText)).querySelector(".n").textContent);
ok("it is counted under needs attention", att1 === att0 + 1, [att0, att1]);
await click("Connections without an agreement", "#main .k3-att");
ok("the count is a filter: it opens exactly those connections", (await hash()) === "system-connections" && (await rows()).length === att1 && (await rows()).some((r) => /Range safety uplink/.test(r)), [(await rows()).length, att1]);
await click("Range safety uplink", "#main .k3-table", { sel: "tbody tr[tabindex]" });
ok("the row goes to the connection's page, which says No agreement and offers Link agreement", /^connection--/.test(await hash()) && /No agreement covers this connection yet/.test(await main()) && /Link agreement/.test(await main()));
await click("Link agreement", "#main", { sel: "button.btn", exact: true });
ok("Link agreement is done on the connection's page", /Link agreement/.test(await modal()));
await fill("ref", "ISA-WSX90-RSU"); await submit();
ok("the page reads signed", /Agreement signed/.test(await main()) && /ISA-WSX90-RSU/.test(await main()), (await main()).slice(0, 200));
await go("system");
const att2 = await p.evaluate(() => +[...document.querySelectorAll("#main .k3-att-r")].find((x) => /without an agreement/i.test(x.innerText)).querySelector(".n").textContent);
ok("linking the agreement clears it", att2 === att0, [att0, att2]);
await go("system-connections"); await p.evaluate(() => PA.v3k.set("sys.cview", { q: "", f: "" })); await p.evaluate(() => PA.v2.redraw()); await wait(300);
await eyeOf("Ground data link");
await click("Add port", "#panel", { sel: "button.btn" });
await fill("protocol", "Link 16"); await fill("port", "J-series"); await submit();
ok("a port is added from the connection's preview too (the eye)", (await hash()) === "system-connections" && /Link 16/.test(await panel()) && /J-series/.test(await panel()));
await closePanel();
ok("and counts in the table's Ports: the first port, then how many more", (await rows()).some((r) => /Ground data link/.test(r) && /Link protocol n\/a \+1/.test(r)), (await rows()).filter((r) => /Ground data link/.test(r)));
ok("interconnections and ports are one table (9 outside connections with their ports)", (await rows()).filter((r) => / Crosses /.test(r)).length >= 14 && (await rows()).some((r) => /Mission planning network/.test(r) && /443\/tcp/.test(r)));

// ——— 6. Add a component inside a subsystem ———
console.log("\n6. Add a component");
await go("system"); await pickSub("CN-109001");
await click("Add component", TB);
ok("Add component is a form whose kind and place are chosen (the subsystem in the filter is preselected)", (await p.evaluate(() => document.querySelector("#k3f-parent").value === "CN-109001" && document.querySelectorAll("#k3f-kind option").length >= 3 && document.querySelectorAll("#k3f-parent option").length >= 7)));
await fill("name", "Health Monitor"); await choose("kind", "Software"); await submit();
const nh = await hash();
ok("its page opens", /^component--CN-1091\d\d$/.test(nh) && /Health Monitor/.test(await main()), nh);
ok("empty: every count is zero", (await p.evaluate(() => [...document.querySelectorAll("#main .k3-tabs .k3-ct")].every((c) => c.textContent === "0"))));
for (const [t, add] of [["Software & firmware", "Add item"], ["Connections", "Add connection"], ["Controls", "Add controls"], ["Requirements", "Add requirement"]]) { await tab(t); ok(`${t}: empty, offering ${add}`, (await p.evaluate((a) => [...document.querySelectorAll("#main .k3-empty button, #main .k3-tools button")].some((x) => x.innerText.trim() === a), add))); }
await go("system");
ok("it is in the filter's count, the tab's count and the list", (await subCount("CN-109001")) === 4 && (await tabCount("Components")) === all0 + 1 && (await rows()).some((r) => /Health Monitor/.test(r)), [await subCount("CN-109001"), await tabCount("Components")]);
await go("system-boundary");
ok("and in the Boundary view (Mission Computing Subsystem holds 4)", /Mission Computing Subsystem 4 components/.test(await main()));
await go(nh); await menu("More", "Edit component");
ok("Edit component is a real form", /Edit component/.test(await modal()) && (await p.evaluate(() => document.querySelector("#k3f-name").value)) === "Health Monitor");
await fill("name", "Health and Usage Monitor"); await choose("parent", "CN-109005"); await submit();
ok("renamed and moved: the title and the breadcrumb follow", /System › Platform Management Subsystem › Health and Usage Monitor/.test((await p.evaluate(() => document.querySelector("#main .k3-crumbs").innerText)).replace(/\s+/g, " ")));
ok("fact components() carries it", (await fact("components")).some((c) => c.name === "Health and Usage Monitor" && c.parent === "CN-109005" && c.boundary === "inside"));

await go("system"); await menu("More", "Export components", TB);
ok("Export goes through the kit's save (a download from disk; the viewer's Save prompt once published)", /system-components\.csv (downloaded|saved)/.test(await toast()) || /Copy system-components\.csv/.test(await modal()), [await toast(), (await modal()).slice(0, 60)]);
if (await modal()) { await p.click("#modal [data-k3-close]"); await wait(200); }

// ——— 7. The host's page: what it offers, what WS-X90 takes; change one in place ———
console.log("\n7. The host system");
await go("system"); await tab("Host and providers");
ok("Host and providers is a tab of System: the host first, with what is taken", (await hash()) === "system-providers" && (await rows()).length === 3 && /F-16 Block 70/.test((await rows())[0]) && /Host system Authorized Mar 3, 2028 12 4 4 /.test((await rows())[0]), await rows());
await eyeOf("F-16 Block 70");
ok("its eye previews it; its row goes to its page", /^Component /.test(await panel()) && /F-16 Block 70/.test(await panel()));
await closePanel();
await click("F-16 Block 70", "#main .k3-table", { sel: "tbody tr[tabindex]" });
ok("its page: a component outside the boundary, with its own authorization", (await hash()) === "component--f16" && /Host system/.test(await main()) && /Authorized Mar 4, 2025/.test(await main()) && /Mar 3, 2028/.test(await main()));
await tab("Controls offered");
ok("Controls offered lists its 16 controls and how each is taken", (await rows()).length === 16 && (await tabCount("Controls offered")) === 16);
const inh = await p.evaluate(() => { const mc = PA.v3.fact("controlsOf", "CN-109101"); const f = PA.v2host.takes("f16").rows.filter((r) => r.kind === "Inherited").map((r) => r.code); return f.find((c) => mc.includes(c)) || f[0]; });
await p.evaluate((c) => PA.v3.fact("place", "CN-109101", c), inh);
await p.fill("#main .k3-search input", inh); await wait(500);
// On the whole build the row opens Controls' own panel (lane C), so its id is the control alone.
const inhId = (await p.$(`#main .k3-table tr[data-id="${inh}@f16"]`)) ? inh + "@f16" : inh;
const inhRow = async () => p.evaluate((id) => { const r = document.querySelector(`#main .k3-table tr[data-id="${id}"]`); return r ? r.innerText.replace(/\s+/g, " ") : ""; }, inhId);
ok(`${inh} is inherited`, / Inherited Inherited /.test(await inhRow()), await inhRow());
await p.evaluate((id) => document.querySelector(`#main .k3-table tr[data-id="${id}"] .k3s-x`).click(), inhId); await wait(350);
ok("Change opens here", new RegExp(`Change responsibility of ${inh.replace(/[()]/g, "\\$&")}`).test(await modal()));
await choose("kind", "Hybrid"); await fill("part", "WS-X90 checks the bay's seal at every sortie."); await fill("reason", "The walk: WS-X90 keeps a part."); await submit();
ok("the row reads Hybrid with this system's part", /WS-X90 checks the bay's seal at every sortie\. Inherited Hybrid /.test(await inhRow()), await inhRow());
await go(MC + "--controls"); await p.fill("#main .k3-search input", inh); await wait(500);
ok("the component's Controls tab reads the same", / Hybrid · F-16 Block 70 /.test((await rows()).find((r) => r.startsWith(inh + " ")) || ""), await rows());
ok("the program's count of inherited controls follows", (await fact("controls")).inherited === 51 && (await fact("controls")).hybrid === 25, await fact("controls"));
await p.fill("#main .k3-search input", ""); await wait(450);
await go("component--idp");
ok("a provider with no authorization says so once on its page", ((await main()).match(/has no authorization of its own/g) || []).length === 1);
await go(MC + "--controls"); await p.fill("#main .k3-search input", "AC-2"); await wait(500);
ok("and on a control that leans on it", / Provider has no ATO /.test((await rows()).find((r) => r.startsWith("AC-2 ")) || ""), (await rows())[0]);
await p.fill("#main .k3-search input", ""); await wait(450);

// ——— 8. Take version 2 on the component's own page ———
console.log("\n8. Take version 2 here");
await go(MC);
const f0 = await tabCount("Findings");
ok("the next step is on the component: Take version 2", /Version 2 of Mission Computer is published and fixes CVE-2024-6387/.test(await main()) && /1 version behind/.test(await main()));
await click("Take version 2", "#main .k3-next");
ok("the command opens here", /Take version 2 of Mission Computer/.test(await modal()) && (await hash()) === MC);
await p.fill("#v3w-take-note", "Checked the image hash and the SBOM against the supplier's release note."); await p.click("#modal [data-v3w-take]"); await wait(600);
ok("taken: still on the component, which now runs version 2", (await hash()) === MC && /version 2/.test(await p.evaluate(() => document.querySelector("#main .k3-sub").innerText)) && !/version behind/.test(await main()), (await p.evaluate(() => document.querySelector("#main .k3-sub").innerText)));
ok("fact cveFixed says the component now runs a version that fixes the CVE", (await fact("cveFixed", "CVE-2024-6387", "CN-109101")) === true && (await fact("cveFixed", "CVE-2024-6387", "CN-109102")) === false);
// The component's findings are lane E's list when E is in the build. E does not read cveFixed yet, so there the CVE stays:
// the step is asserted only where this lane keeps the list, and otherwise reported.
if (await p.evaluate(() => typeof PA.v3.facts.findingsOn !== "function")) ok("the CVE leaves its findings", (await tabCount("Findings")) === f0 - 1, [f0, await tabCount("Findings")]);
else if ((await tabCount("Findings")) === f0 - 1) ok("the CVE leaves its findings (lane E reads cveFixed)", true);
else console.log("note the CVE is still in the component's findings: lane E's findingsOn does not read cveFixed yet", [f0, await tabCount("Findings")]);
ok("lane W's fact agrees", (await fact("mc2")).taken === true);
await go("system");
ok("System no longer counts a component behind", (await p.evaluate(() => [...document.querySelectorAll("#main .k3-att-r")].find((x) => /Behind its library/.test(x.innerText)).classList.contains("z"))));

// ——— 9. Folded addresses ———
console.log("\n9. Old addresses");
for (const [from, to] of [["boundary", "system-boundary"], ["boundary-iatt", "system-boundary--iatt"], ["interconnections", "system-connections"], ["ppsm", "system-connections"], ["composition", "system"], ["composition-list", "system"], ["composition-assets", "system"], ["hosts", "system"], ["inheritance", "system"], ["inventory", "system"], ["rec--v7p-el--CN-109101", MC], ["rec--v2h-prov--f16", "component--f16"], ["rec--sys-asset--AST-109001", MC + "--software"]]) {
  await go(from); const hsh = await hash();
  ok(`${from} → ${to}`, hsh === to && !!(await p.$("#main .k3-title")) && (await p.evaluate(() => /System/.test((document.querySelector("#nav a.item.on") || {}).innerText || ""))), hsh);
}
await go("rec--v8b-ic--IC-103"); await wait(400);
ok("rec--v8b-ic--IC-103 → that connection's page", (await hash()) === "connection--IC-103" && /Depot maintenance enclave/.test(await main()) && /Ports and protocols 2/.test(await main()), [await hash(), (await main()).slice(0, 80)]);
await go("system-boundary--iatt");
ok("the Boundary keeps its authorization choice: the IATT's test configuration", /IATT · Increment 2 test configuration/.test(await main()) && /Flight test instrumentation/.test(await main()) && /Not in the test configuration/.test(await main()));
await pickFilter("authorization", "Block 1.1");
ok("Block 1.1: the design boundary, its changes and the SCA's review, asked for here", (await hash()) === "system-boundary--blk" && /changed in Block 1.1/.test(await main()) && /Request the SCA's review/.test(await main()));
await pickFilter("authorization", "ATO");
ok("the Boundary view has its description, editable", /The boundary is SYS-WSX90 and everything inside it/.test(await main()) && !/elements/.test(await main()));
await click("Edit description");
await p.fill("#k3f-text", "The boundary is WS-X90 and everything inside it. The walk edited this sentence."); await submit();
ok("the edit is kept here and written to section 5 of the SSP", /The walk edited this sentence/.test(await main()) && (await p.evaluate(() => PA.SSP.sec("s5").text.join(" "))).includes("The walk edited this sentence"));
await click("Mission Computing Subsystem", "#main .k3s-bd", { sel: "a.k3s-box" });
ok("a box opens its component", (await hash()) === "component--CN-109001");
await tab("Components");
ok("a subsystem has Components: what is inside it, with Add component", (await rows()).length === 3 && !!(await p.evaluate(() => [...document.querySelectorAll("#main .k3-tools button")].some((x) => /Add component/.test(x.innerText)))), await rows());
await go("system-boundary"); await p.click('#main .k3s-wire[data-conn="IC-102"]'); await wait(450);
ok("a line goes to its connection's page (one rule in the bubble: a click opens the record's page)", (await hash()) === "connection--IC-102" && /Mission planning network/.test(await main()) && /Ports and protocols/.test(await main()), await hash());
await back();
ok("Back returns to the Boundary view", (await hash()) === "system-boundary" && !!(await p.$("#main .k3s-bub")));

// ——— A component named on another page opens its panel, and from there its page ———
await go("requirements");
// On the whole build the register and its panel are lane D's; alone, v2's preview.
await p.evaluate(() => { const tr = document.querySelector('#main tr[data-rec="k3d-req"], #main tr[data-panel="v7p-req"]'); const eye = tr && tr.querySelector(".k3-eye"); (eye || tr.querySelector("td")).click(); }); await wait(450);
// The requirement's panel names its components: lane D's rows go to the component's page; v2's preview opened the component's panel.
const named = await p.evaluate(() => { const el = document.querySelector('#panel [data-panel="v7p-el"], #panel [data-panel="k3s-comp"]:not(.k3-eye), #panel a[href^="#component--"], #panel tr[data-go^="component--"]'); if (!el) return null; el.scrollIntoView({ block: "center" }); const id = el.getAttribute("data-id") || (el.getAttribute("href") || "#" + el.getAttribute("data-go")).replace("#component--", ""); (el.tagName === "TR" ? el.querySelector("td") : el).click(); return id; }); await wait(450);
if (/^component--/.test(await hash())) ok("in a requirement's panel, a component's name opens the component's page", (await hash()) === "component--" + named, [named, await hash()]);
else {
  ok("in a requirement's panel, a component's name opens the component's panel (no element preview, no 'Open in')", !!named && /^Component /.test(await panel()) && !/Open in |Element/.test(await panel()), [named, (await panel()).slice(0, 120)]);
  await click("Open component", "#panel", { sel: "a.btn" });
  ok("its Open goes to the component's page", (await hash()) === "component--" + named, await hash());
}
await p.evaluate(() => PA.v2.go("composition", { open: { kind: "v7p-el", id: "CN-109107" } })); await wait(700);
ok("a question left for a folded page is answered at its new home", (await hash()) === "component--CN-109107", await hash());
await p.evaluate(() => PA.v2.go("interconnections", { rows: ["Mission data loads", "Depot maintenance laptop", "SIPRNet reachback", "Ground support telemetry"], note: "Showing the agreements PDR waits on" })); await wait(800);
ok("PDR's Interconnections deliverable (lane G) lands on Connections showing only what it waits on", (await hash()) === "system-connections" && (await p.evaluate(() => [...document.querySelectorAll("#main .k3-table tbody tr")].filter((r) => !r.hidden).length)) === 4 && /Showing the agreements PDR waits on/.test(await main()));
if (W >= 1100) { // the comparison drawer needs a wide window
  await go("system"); await p.evaluate(() => PA.v3.compare(true)); await wait(400);
  ok("Compare with v2 draws the page this one replaced", /Composition/.test(await p.evaluate(() => (document.getElementById("v3cmp") || {}).innerText || "")));
  await p.evaluate(() => PA.v3.compare(false)); await wait(200);
}

// ——— The other actions on these pages ———
console.log("\nOther actions");
await go(MC); await click("Assign owner", "#main .k3-head"); await choose("owner", "Priya Raghavan"); await submit();
ok("Assign owner, on the component's fact line", /Priya Raghavan/.test(await p.evaluate(() => document.querySelector("#main .k3-sub").innerText)));
await go("system"); await pickSub("");
ok("the owner shows on System's row", (await rows()).some((r) => /Mission Computer /.test(r) && /Priya Raghavan/.test(r)));
await tab("Connected systems");
ok("Connected systems is a tab of System, with its own Add", (await hash()) === "system-connected" && (await rows()).length === 8 && /Add connected system/.test(await p.evaluate(() => document.querySelector("#main .k3-tb .k3-tools-r").innerText)) && !(await p.$("#main .k3-head-a")));
await click("Add connected system", TB);
await fill("name", "Test range ground station"); await fill("org", "Test range"); await submit();
const ext = await hash();
ok("Add connected system: its page opens, outside the boundary", /^component--EXT-2\d\d$/.test(ext) && /Connected system/.test(await main()), ext);
await click("Add connection", "#main .k3-head"); await fill("name", "Telemetry downlink"); await choose("to", "CN-109112"); await fill("iface", "RF telemetry"); await submit(); await wait(300);
await tab("Connections"); await click("Telemetry downlink", "#main .k3-table", { sel: "tbody tr[tabindex]" });
await menu("More", "No agreement needed", "#main .k3-head");
await fill("why", "Receive-only on the range's side; covered by the test range support agreement."); await submit();
ok("No agreement needed, with its reason, is recorded on the connection's page", /No agreement needed/.test(await main()) && /Receive-only on the range/.test(await main()), (await main()).slice(0, 200));
await menu("More", "Remove connection", "#main .k3-head");
ok("Remove connection names what goes with it", /leaves Test range ground station and Payload Telemetry Unit/.test(await modal()), await modal());
await submit(); await wait(400);
ok("removed from its page: the reader lands on Connections, without it", (await hash()) === "system-connections" && !(await rows()).some((r) => /Telemetry downlink/.test(r)));
await go(ext);
ok("removed: the connected system has no connection again", (await tabCount("Connections")) === 0, await tabCount("Connections"));
await menu("More", "Remove component");
ok("Remove component asks first", /Test range ground station leaves the system/.test(await modal()));
await submit();
ok("removed: back on System, and the fact no longer lists it", /^system/.test(await hash()) && !(await fact("components")).some((c) => c.name === "Test range ground station"), await hash());
await go("system-providers"); await click("Add provider", TB);
ok("Add provider picks from the systems that offer controls; this system's own are marked", (await p.evaluate(() => document.querySelectorAll("#modal .k3-pick-i").length)) >= 5 && (await p.evaluate(() => document.querySelectorAll("#modal .k3-pick-i.held").length)) >= 3);
const prov = await p.evaluate(() => { const i = document.querySelector("#modal .k3-pick-i:not(.held) input"); i.click(); return i.value; }); await wait(150); await submit();
ok("the provider's page opens with what it offers", (await hash()) === "component--" + prov && /Controls offered/.test(await main()) && (await fact("components")).some((c) => c.code === prov && c.boundary === "provider"), await hash());
// A requirement's panel: lane D's on the whole build (its own walk maps and unmaps there); this lane's stand-in alone.
if ((await fact("reqPanel")) === "k3d-req") {
  await go(MC + "--requirements"); await openRow("REQ-005");
  ok("a requirement on the component opens the Requirements panel, with Map control and Allocate in it", /Map control/.test(await panel()) && /Allocate/.test(await panel()) && /Mission Computer/.test(await panel()), (await panel()).slice(0, 200));
  await closePanel();
} else {
await go(MC + "--requirements"); await openRow("REQ-005@CN-109101");
await click("Map control", "#panel", { sel: "button.btn" });
const mapped = await p.evaluate(() => { const i = document.querySelector("#modal .k3-pick-i:not(.held) input"); i.click(); return i.value; }); await wait(150); await submit();
ok("a requirement's panel maps a control in place", new RegExp(mapped.replace(/[()]/g, "\\$&") + " ").test(await panel()) && /Controls it maps 2/.test(await panel()), [mapped, (await panel()).slice(0, 260)]);
await p.evaluate(() => document.querySelector("#panel .k3s-x").click()); await wait(300); await submit();
ok("and removes a mapping in place", /Controls it maps 1/.test(await panel()), (await panel()).slice(0, 260));
await closePanel();
}
await go("system-boundary--blk"); await click("Request the SCA's review", "#main .k3-next");
ok("the SCA's boundary review (lane G's) is requested from the Boundary view", /Request the SCA's boundary review/.test(await modal()));
await p.evaluate(() => { const b = [...document.querySelectorAll("#modal button")].find((x) => /Request review/.test(x.innerText)); if (b) b.click(); }); await wait(500);
ok("requested: the view says it waits on the assessor", /waits on D\. Okafor/.test(await main()), (await main()).slice(300, 600));

// ——— State survives a reload of the address ———
await go(MC + "--requirements"); await p.reload(); await wait(900);
ok("after a reload: V3, the page, and what was added are kept", (await hash()) === MC + "--requirements" && (await rows()).some((r) => /partitions are measured at boot/.test(r)), (await rows()).slice(0, 2));
await go("system-connections");
ok("after a reload: the added connections are kept", (await rows()).some((r) => /Navigation data bus/.test(r)) && (await rows()).some((r) => /Range safety uplink/.test(r)));

// ——— Words, hops and overflow on every page of the lane ———
console.log("\nEvery page");
const ROUTES = ["system", "system-providers", "system-connected", "system-boundary", "system-boundary--blk", "system-boundary--iatt", "system-connections", "connection--IC-103", "connection--IC-108", "connection--IF-f16-1553", MC, MC + "--software", MC + "--connections", MC + "--controls", MC + "--requirements", MC + "--findings", "component--CN-109001", "component--CN-109001--components", "component--CN-109001--controls", "component--CN-109000", "component--f16", "component--f16--offered", "component--f16--connections", "component--idp", "component--sqops", "component--EXT-101", "component--EXT-101--connections"];
for (const w of [1440, 390]) {
  await p.setViewportSize({ width: w, height: w > 600 ? 900 : 800 }); await wait(300);
  const bad = [];
  for (const r of ROUTES) {
    await go(r); const t = await main();
    const side = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const marked = await p.evaluate(() => { const on = document.querySelector("#nav a.item.on"); return !!on && /System/.test(on.innerText) ; });
    // The product's own words: everything but the names and statements of records (a catalog control may be titled "… Elements").
    const own = await p.evaluate(() => { const c = document.getElementById("main").cloneNode(true); c.querySelectorAll(".k3-nm").forEach((n) => n.remove()); return c.textContent; });
    if (/\belements?\b/i.test(own)) bad.push(r + ": says element");
    if (/Open in /i.test(t)) bad.push(r + ": Open in");
    if (side > 1) bad.push(r + ": sideways " + side);
    if (!(await p.$("#main .k3-title"))) bad.push(r + ": not drawn");
    if (await p.$("#main .k3-rail:not(.k3-rtabs), #main .k3-split")) bad.push(r + ": a list down the side");
    if (await p.$('#main .k3-table tr[data-panel]')) bad.push(r + ": a row that opens a preview on click");
    if (w > 600 && !marked) bad.push(r + ": menu not marked");
  }
  ok(`${ROUTES.length} routes at ${w}: drawn, one word, no 'Open in', nothing down the side, rows go to pages, no sideways scroll${w > 600 ? ", System marked" : ""}`, !bad.length, bad);
}
await p.setViewportSize(VP);

// ——— Pass 3 (Josef, 21 Nov): one row over every table, saved views, compact rows, previews that list what the page lists ———
console.log("\nPass 3: the row, the views, the rows, the previews");
const oneLine = () => p.evaluate(() => [...document.querySelectorAll("#main .k3-table tbody tr")].filter((r) => r.getClientRects().length && r.getBoundingClientRect().height > 44).length);
for (const [r, noun, add] of [["system", "components", "Add component"], ["system-providers", "providers", "Add provider"], ["system-connected", "connected systems", "Add connected system"], ["system-connections", "connections", "Add connection"]]) {
  await go(r); await viewMenu("All " + noun); const t = await toolbar();
  ok(`${r}: one row over its table, its own views (All ${noun}), its actions at the row's end`, !!t && t.list === r && (W < 600 || t.lines === 1) && t.view === "All " + noun && !t.edited && t.acts.includes(add) && t.acts.some((a) => /^More/.test(a)) && t.filters.length >= 1 && (await p.$$("#main .k3-tb")).length === 1 && !(await p.$("#main .k3-head-a")) && !(await p.$("#main .k3-chips, #main .k3-rtabs")), t);
  ok(`${r}: every row is one line`, (await oneLine()) === 0 && (await rows()).length > 0);
}
await go("system");
ok("the List / Boundary switch stands in the row, before the actions", (await p.evaluate(() => { const r = document.querySelector("#main .k3-tb .k3-tools-r"), seg = r && r.querySelector(".k3-seg"); return !!seg && seg.textContent === "ListBoundary" && seg.compareDocumentPosition(r.querySelector(".btn.ink")) === Node.DOCUMENT_POSITION_FOLLOWING; })));
ok("a component's code and its library state each have their place on the line", (await rows()).some((r) => /^Mission Computer CN-109101 /.test(r)) && (await p.evaluate(() => [...document.querySelectorAll("#main .k3-table thead th")].map((x) => x.textContent).join("|"))).startsWith("Component|Code|Unit|Kind|Library|"), (await rows()).filter((r) => /^Mission Computer /.test(r)));
await click("Boundary", TB, { sel: "a" });
const tbB = await toolbar();
ok("the Boundary view has the same row: its authorization a filter, the switch and the actions at the end", (await hash()) === "system-boundary" && !!tbB && (W < 600 || tbB.lines === 1) && tbB.filters.join() === "Authorization" && tbB.acts.includes("Add component") && !(await p.$("#main .k3-head-a")) && !(await p.$("#main > .main > .k3-tools:not(.k3-tb)")), tbB);
// A saved view: two filters, saved under a name, left, and picked again.
await go("system-connections"); await viewMenu("All connections");
const cAll = await rows();
await pickFilter("k3s.cb", "Crosses"); await pickFilter("k3s.cagr", "Not signed");
const cT = await toolbar(), cRows = await rows();
ok("two filters of the row narrow the connections, and the view says it was edited", cT.on.length === 2 && cT.edited && cRows.length > 0 && cRows.length < cAll.length && cRows.every((r) => / Crosses /.test(r)), [cT, cRows.length, cAll.length]);
await viewMenu("Save as new view"); await p.fill("#modal input[name=name]", "Crossing, not signed"); await p.click("#modal [data-k3-submit]"); await wait(450);
ok("Save as new view names the question", (await toolbar()).view === "Crossing, not signed" && !(await toolbar()).edited, await toolbar());
await viewMenu("All connections");
ok("All connections asks nothing again", (await toolbar()).on.length === 0 && (await rows()).length === cAll.length);
await go("system"); await go("system-connections");
await viewMenu("Crossing, not signed");
ok("left and picked again, the saved view gives the same rows", JSON.stringify(await rows()) === JSON.stringify(cRows) && (await toolbar()).view === "Crossing, not signed" && (await toolbar()).on.length === 2, [(await rows()).length, cRows.length]);
await p.click("#main .k3-vbtn"); await wait(120);
const vItems = await p.evaluate(() => [...document.querySelectorAll("#main .k3-vlist .k3-menu-i")].map((e) => e.textContent.trim()));
await p.evaluate(() => { const d = document.querySelector("#main .k3-vmenu"); if (d) d.open = false; });
ok("the views menu lists the list's own views, the seeded one, the saved one, and how to manage them", ["All connections", "Crosses the boundary", "Without a signed agreement", "PPSM not registered", "Crossing, not signed", "Manage views"].every((l) => vItems.some((x) => x.startsWith(l))), vItems);
await viewMenu("PPSM not registered");
ok("the seeded view asks its question", (await toolbar()).on.join() === "PPSM: Not registered" && (await rows()).length >= 1 && (await rows()).length < cAll.length, [await toolbar(), (await rows()).length]);
await viewMenu("All connections");
// The component's tabs: one row over each table; the long ones keep views.
for (const [t, id, filters] of [["controls", "component-controls", "Family,Implementation,Status"], ["requirements", "component-requirements", "Evidence"], ["findings", "component-findings", "Source,Severity"], ["software", "", "Kind,CVE"], ["connections", "", "Agreement"]]) {
  await go(`component--CN-109001--${t}`); const tb = await toolbar();
  ok(`a component's ${t}: one row, ${id ? "with views" : "search and filters only"}, every row one line`, !!tb && tb.list === id && (W < 600 || tb.lines === 1) && tb.filters.join() === filters && (await p.$$("#main .k3-tb")).length === 1 && !(await p.$("#main .k3-chips, #main .k3-rtabs")) && (await oneLine()) === 0, tb);
}
await go("component--CN-109001--controls"); await viewMenu("Not written");
const nwRows = await rows();
ok("Not written is a view of a component's controls", (await toolbar()).on.join() === "Implementation: Not written" && nwRows.every((r) => / Not written /.test(r)), [await toolbar(), nwRows.length]);
await viewMenu("All controls");
// Previews: after the facts, what the page lists.
await go("system"); await eyeOf("Mission Computing Subsystem");
const pTabs = ["Components", "Software & firmware", "Connections", "Controls", "Requirements", "Findings"], pS = await panelSecs(), pOf = (t) => pS.find((x) => x.title === t) || {};
const pTo = { Components: "components", "Software & firmware": "software", Connections: "connections", Controls: "controls", Requirements: "requirements", Findings: "findings" };
ok("a component's preview lists what its page lists, tab by tab, after its facts", pTabs.every((t) => pS.some((x) => x.title === t)) && /Kind Subsystem/.test(await panel()), pS);
ok("each as a short list: five rows at most, one line each, then View all to that tab", pTabs.every((t) => pOf(t).rows <= 5 && !pOf(t).tall && (pOf(t).n <= 5 || pOf(t).all === `component--CN-109001--${pTo[t]}`)), pS);
ok("no table in the preview is wider than the panel", (await p.evaluate(() => [...document.querySelectorAll("#panel .k3-pn table")].filter((t) => t.scrollWidth > t.parentElement.clientWidth + 2).length)) === 0);
await p.evaluate(() => { const a = [...document.querySelectorAll("#panel .k3-pk-all")].find((x) => /--controls$/.test(x.getAttribute("href"))); if (a) a.click(); }); await wait(500);
ok("View all opens the tab, whose count is the preview's", (await hash()) === "component--CN-109001--controls" && (await tabCount("Controls")) === pOf("Controls").n, [await hash(), pOf("Controls").n]);
await closePanel(); await go("system-connections"); await eyeOf("Mission planning network");
const xS = await panelSecs();
ok("a connection's preview lists its ports, its agreement and the components it joins", ["Ports and protocols", "Agreement", "Components it joins"].every((t) => xS.some((x) => x.title === t)) && xS.every((x) => !x.tall) && /Protected Network Gateway/.test(await panel()), xS);
await closePanel(); await go("system-providers"); await eyeOf("F-16 Block 70");
const hS = await panelSecs();
ok("a provider's preview lists the controls it offers, the components it carries and its connections", ["Controls offered", "Components it carries", "Connections"].every((t) => hS.some((x) => x.title === t)) && (hS.find((x) => x.title === "Controls offered") || {}).all === "component--f16--offered", hS);
await closePanel();

// ——— 10. A created program shows its own system, never WS-X90's ———
console.log("\n10. A created program");
await b.close();
process.env.BUILD = build;
const { open, createSP70 } = await import(SP + "/v3/P/lib.mjs");
const H = await open({ build });
const seen = await createSP70(H, { nss: true });
ok("a program is created (lane P's wizard)", /^PRG-23/.test(seen.code || ""), seen.code);
await H.go("system");
const t10 = await H.main();
ok("its System page is its own: its system, none of WS-X90's components", /SP-70 Strike Pod/.test(t10) && !/Mission Computer|Navigation Processor|Tactical Data Radio/.test(t10), t10.slice(0, 400));
ok("it offers Add component", /Add component/.test(t10));
await H.click("Add component", "#main .k3-tb .k3-tools-r");
await H.fill("#k3f-name", "Pod Power Supply"); await H.sel("#modal [data-k3-submit]");
ok("a component added there is kept under that program", /Pod Power Supply/.test(await H.main()) && /^component--/.test(await H.hash()), await H.hash());
ok("as that program's own record (lane P's store), so its other pages read it", (await H.ev(() => (PA.v2.get("v3.P." + PA.v2hubs.cur() + ".el", []) || []).some((e) => e.name === "Pod Power Supply"))));
await H.go("system-providers"); await H.click("Add provider", "#main .k3-tb .k3-tools-r");
ok("Add provider there is that program's own dialog, opened on this page", /Add provider/.test(await H.modal()) && (await H.hash()) === "system-providers", (await H.modal()).slice(0, 120));
await H.ev(() => { const s = document.querySelector("#modal select"); if (s) { s.value = s.options[s.options.length - 1].value; s.dispatchEvent(new Event("change", { bubbles: true })); } });
await H.click("Add provider", "#modal", { sel: "button" }); await H.wait(500); await H.go("system");
ok("the provider it adds joins this program's Providers", (await H.ev(() => PA.v3.fact("components").filter((c) => c.boundary === "provider").length)) === 1, await H.ev(() => PA.v3.fact("components").map((c) => c.name + ":" + c.boundary)));
ok("its components are the wizard's own", (await H.ev(() => PA.v3.fact("components").map((c) => c.name))).includes("Pod Mission Processor"));
await H.go("component--f16--offered");
ok("its host's page shows what the host offers, with no WS-X90 state to change", /Controls offered\s+16/.test(await H.main()) && !/Change/.test(await H.ev(() => [...document.querySelectorAll("#main .k3-table .k3s-x")].map((x) => x.innerText).join(" "))) && !/WS-X90 seals/.test("") , (await H.main()).slice(0, 200));
await H.go("system-boundary");
ok("its Boundary view draws its own bubble, not authorized yet", /Not authorized yet/.test(await H.main()) && !/Mission Computing Subsystem/.test(await H.main()), (await H.main()).slice(0, 300));
await H.ev(() => PA.v2hubs.setCur("PRG-1090")); await H.go("system");
ok("back in WS-X90, the pod's component is not there", !/Pod Power Supply/.test(await H.main()) && /Mission Computing Subsystem/.test(await H.main()));
errs.push(...H.errs);
await H.close();

fs.unlinkSync(build);
console.log(`\n${pass} passed, ${fail} failed`);
console.log("page errors:", errs.length ? errs.slice(0, 8) : "none");
process.exit(fail || errs.length ? 1 : 0);
