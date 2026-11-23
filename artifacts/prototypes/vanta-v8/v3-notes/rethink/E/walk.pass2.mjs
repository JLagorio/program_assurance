// Lane E's walk (pass 2): with V3 on, through the UI, on the whole build. A row goes to the record's page, the eye opens its
// preview, kinds are horizontal tabs. Asserts what a person would see. node walk.mjs [build]   WIDTH=390 node walk.mjs [build]
import { open, createSP70, SP } from "../../v3/P/lib.mjs";
const build = process.argv[2] || SP + "/vanta/proto/out/v3r2-E.html";
const WIDTH = +(process.env.WIDTH || 1440), NARROW = WIDTH < 700;
const H = await open({ build, start: "overview", width: WIDTH }), p = H.p;
p.setDefaultTimeout(6000);
setTimeout(() => { console.log("WATCHDOG: the walk ran over 8 minutes"); process.exit(2); }, 480000);
let fails = 0, n = 0;
const ok = (c, name, extra) => { n++; if (!c) fails++; console.log(c ? "ok  " : "FAIL", name, c || extra === undefined ? "" : JSON.stringify(extra)); };
const ev = (fn, a) => p.evaluate(fn, a);
const w = (ms = 350) => p.waitForTimeout(ms);
const flat = (s) => String(s || "").replace(/\s+/g, " ").trim();
const hash = () => ev(() => { try { return decodeURIComponent(location.hash.slice(1)); } catch (e) { return location.hash.slice(1); } });
const rows = (sel = "#main") => ev((sel) => [...document.querySelectorAll(sel + " .k3-table tbody tr:not(.k3-grow)")].map((tr) => tr.innerText.replace(/\s+/g, " ").trim()), sel);
const rail = () => ev(() => [...document.querySelectorAll("#main .k3-rail-i")].map((x) => ({ t: x.querySelector(".x").innerText.replace(/\s+/g, " "), n: +(x.querySelector(".num") || { innerText: "-1" }).innerText.replace(/,/g, ""), on: x.classList.contains("on"), top: Math.round(x.getBoundingClientRect().top) })));
const chip = (label) => ev((l) => { const c = [...document.querySelectorAll("#main .k3-chip")].find((x) => x.innerText.startsWith(l)); return c ? +c.querySelector(".num").innerText.replace(/,/g, "") : -1; }, label);
const tabN = (label) => ev((l) => { const c = [...document.querySelectorAll("#main .k3-tabs .k3-tab")].find((x) => x.innerText.trim().startsWith(l)); const n = c && c.querySelector(".k3-ct"); return n ? +n.innerText.replace(/,/g, "") : -1; }, label);
const search = async (q) => { await p.fill("#main .k3-search input", q); await w(500); };
const panel = () => ev(() => { const e = document.querySelector("#panel"); return e && !e.hidden ? e.innerText.replace(/[ \t]+/g, " ") : ""; });
const plabel = () => ev(() => { const e = document.querySelector("#panel"); return e && !e.hidden ? (e.querySelector(".bar-top span, #panelLabel") || {}).textContent || "" : ""; });
const closePanel = () => ev(() => { const b = document.querySelector("#closePanel"); if (b && !document.getElementById("panel").hidden) b.click(); });
const secIn = (scope, title) => ev(([scope, t]) => { const s = [...document.querySelectorAll(scope + " .k3-sec")].find((x) => (x.querySelector("h2") || {}).innerText.trim().startsWith(t)); return s ? { n: +((s.querySelector(".k3-ct") || {}).innerText || "0"), text: s.innerText.replace(/\s+/g, " ") } : null; }, [scope, title]);
const sec = (title) => secIn("#panel", title), msec = (title) => secIn("#main", title);
const head = () => H.txt("#main .k3-head").then(flat);
const submit = async () => { await p.click("#modal [data-k3-submit]"); await w(450); };
const modalOpen = () => ev(() => !document.getElementById("modal").hidden);
const bad = () => ev(() => document.querySelectorAll("#modal .k3-f.bad").length);
const fact = (name, ...a) => ev(([name, a]) => PA.v3.fact(name, ...a), [name, a]);
const navOn = () => ev(() => [...document.querySelectorAll("#nav a.item")].filter((a) => a.classList.contains("on")).map((a) => a.textContent.trim()).join("|"));
const navItems = () => ev(() => [...document.querySelectorAll("#nav a.item")].map((a) => a.textContent.trim()));
// A row's click goes to the record's page; its eye opens the preview.
const clickRow = async (text, scope = "#main") => { const r = await ev(([text, scope]) => { const tr = [...document.querySelectorAll(scope + " .k3-table tbody tr")].find((t) => t.innerText.includes(text)); if (!tr) return false; tr.scrollIntoView({ block: "center" }); tr.click(); return true; }, [text, scope]); await w(550); return r; };
const eye = async (text, scope = "#main") => { const r = await ev(([text, scope]) => { const tr = [...document.querySelectorAll(scope + " .k3-table tbody tr")].find((t) => t.innerText.includes(text)); const b = tr && tr.querySelector(".k3-eye"); if (!b) return false; b.scrollIntoView({ block: "center" }); b.click(); return true; }, [text, scope]); await w(500); return r; };
const inMain = (text, opts) => H.click(text, "#main", Object.assign({ exact: true }, opts || {}));
const headMenu = async (item) => { await p.click("#main .k3-head details.k3-menu summary"); await w(150); return H.click(item, "#main .k3-head .k3-menu-l", { exact: true }); };
const railPick = async (text) => { const i = await ev((text) => { const s = document.querySelector("#main select[data-k3-railsel]"); return s ? [...s.options].findIndex((o) => o.textContent.includes(text)) : -1; }, text); if (i < 0) return H.click(text, "#main .k3-rail"); await p.selectOption("#main select[data-k3-railsel]", { index: i }); await w(450); return "selected"; };
const later = (days) => { const d = new Date("2026-11-17T12:00:00"); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
const fid = "af:exp:AC-2(7):0";

try {
// ——— 0. The Overview's counts open exactly their records (a fresh program: 43 and 40) ———
await H.go("overview");
const att0 = await ev(() => [...document.querySelectorAll("#main .k3-att-r")].map((x) => x.innerText.replace(/\s+/g, " ").trim()));
ok(att0.includes("Operational issues 43") && att0.includes("Risks without an owner 40"), "0 the Overview prints 43 operational issues and 40 risks without an owner", att0);
await H.click("Operational issues", "#main .k3-att");
ok((await hash()) === "findings-issues" && (await chip("Open")) === 43 && /of 43$/.test(flat(await H.txt("#main .pager .num"))) && (await ev(() => (document.querySelector("#main .k3-chip.on") || {}).innerText || "")).startsWith("Open"), "0 its count opens Findings on exactly those 43", [await hash(), await chip("Open"), await H.txt("#main .pager .num")]);
await H.go("overview"); await H.click("Risks without an owner", "#main .k3-att");
ok((await hash()) === "risks" && (await chip("No owner")) === 40 && (await rows()).length === 40 && (await ev(() => (document.querySelector("#main .k3-chip.on") || {}).innerText || "")).startsWith("No owner"), "0 and Risks on exactly those 40", [await hash(), await chip("No owner"), (await rows()).length]);
await H.click("Open", "#main .k3-chips");

// ——— 1. Assessments: kinds are horizontal tabs; a row opens the assessment's page with the program menu still there ———
await H.go("assessments");
const allN = (await rows()).length, r1 = await rail();
ok((await navOn()) === "Assessments" && allN >= 15 && r1.length === 4, "1 Assessments lists every assessment under four kinds", [allN, r1]);
ok((await ev(() => !!document.querySelector("#main nav.k3-rail.k3-rtabs") && !document.querySelector("#main .k3-rail:not(.k3-rtabs)"))) && (NARROW || new Set(r1.map((x) => x.top)).size === 1), "1 the kinds run across the page as tabs, not down its side", r1.map((x) => x.top));
await H.click("Control assessments", "#main .k3-rail");
ok((await hash()) === "assessments-control" && (await rows()).length === 3 && (await rail())[1].on && /^Assessments/.test(flat(await H.txt("#main .k3-title"))), "1 a kind filters in place", [await hash(), (await rows()).length]);
await H.click("Monitoring checks", "#main .k3-rail");
ok((await rows()).length === 12 && /Monthly/.test((await rows())[0]), "1 monitoring checks are assessments with a cadence and a next run", (await rows())[0]);
await H.click("Control assessments", "#main .k3-rail");
await clickRow("Expanded control set assessment");
ok((await hash()) === "assessment--exp" && (await navOn()) === "Assessments" && (await navItems()).includes("Findings") && (await navItems()).includes("Overview") && (await navItems()).length === 10, "1 the campaign's row opens its page; the program menu stays, Assessments marked", [await hash(), await navItems()]);
ok(/Plan\s*Objectives\s*\d+\s*Requests\s*\d+\s*Results\s*\d+\s*Findings\s*\d+/.test(flat(await H.txt("#main .k3-tabs"))), "1 its tabs: Plan, Objectives, Requests, Results, Findings", flat(await H.txt("#main .k3-tabs")));
await clickRow("AC-2(7)");
ok((await hash()) === "control--AC-2(7)" && (await navOn()) === "Controls", "1 a control's row in the plan goes to the control's page", await hash());
await H.go("assessment--exp"); await eye("AC-2(7)");
ok(/^Control/.test(await plabel()), "1 and its eye opens the control's preview", await plabel());
await closePanel();

// ——— 2. Judge one objective: a finding exists at once, with its own page ———
const src0 = (await fact("findingCounts")).bySource, f0tab = await tabN("Findings");
await H.click("Objectives", "#main .k3-tabs");
ok((await hash()) === "assessment--exp--objectives" && (await navOn()) === "Assessments", "2 Objectives is a tab by address");
ok(await ev(() => !!document.querySelector("#main .k3-tools select[data-k3-railsel]") && !!document.querySelector("#main .k3-tools .k3-search") && document.querySelectorAll("#main .k3-tabs, #main nav.k3-rtabs").length === 1), "2 its 26 controls are one dropdown beside the search, not a second row of tabs");
await railPick("AC-2(7)");
ok((await rows()).length === 4 && (await rows()).every((r) => /Not judged/.test(r)), "2 a control's four objectives, none judged", await rows());
await H.click("Judge", "#main .k3-table", { exact: true });
ok((await modalOpen()) && /Judge AC-02\(07\)\(a\)/.test(await H.modal()), "2 Judge opens on the one objective", (await H.modal()).slice(0, 80));
await submit();
ok((await bad()) >= 1 && (await modalOpen()), "2 a determination is required");
await p.selectOption("#k3f-det", "other_than_satisfied"); await submit();
ok((await bad()) === 1 && /fell short/.test(await H.modal()), "2 short of satisfied asks for the justification");
await p.fill("#k3f-note", "The role table lists two maintainer accounts with no assigned role; the administrator could not say who approved them.");
const comp = await ev(() => { const s = document.querySelector("#k3f-comp"); const o = s && [...s.options].find((x) => x.value); if (o) { s.value = o.value; return o.value; } return null; });
await submit();
ok(!(await modalOpen()) && !(await panel()) && (await hash()) === "assessment--exp--objectives" && /a finding is open/.test(await H.toast()) && /Open finding/.test(await H.toast()), "2 the finding opens at once; the assessor stays on the objectives", await H.toast());
ok((await tabN("Findings")) === f0tab + 1 && /Other than satisfied/.test((await rows())[0]) && /draft/.test((await rows())[0]) && /Its finding/.test((await rows())[0]), "2 the objective reads Other than satisfied, a draft, and names its finding; the Findings tab counts one more", [(await rows())[0], f0tab, await tabN("Findings")]);
await ev(() => document.querySelector("#v2-toast .v2-toast-link").click()); await w(550);
ok((await hash()) === "finding--" + fid && (await navOn()) === "Findings" && /AC-02\(07\)\(a\) judged other than satisfied/.test(await head()) && /Draft results/.test(await head()), "2 Open finding goes to the finding's own page, Findings marked", [await hash(), await head()]);
ok(/Findings\s*›\s*Assessment findings/.test(await head()) && /maintainer accounts/.test(await H.main()) && /recorded as/i.test(await H.main()) && /Create plan/.test(await H.main()), "2 the page says what was found, who recorded it, and offers Create plan");
await H.go("assessment--exp--findings");
ok((await rows()).some((r) => /AC-02\(07\)\(a\) judged other than satisfied/.test(r)), "2 it is on the campaign's Findings tab");
await clickRow("AC-02(07)(a)");
ok((await hash()) === "finding--" + fid, "2 its row there goes to the same page", await hash());
await H.go("findings-assessment");
const srcA = (await fact("findingCounts")).bySource;
ok((await rail())[2].on && (await rail())[2].n === src0.af + 1 && srcA.af === src0.af + 1, "2 it is under Assessment findings, counted", [src0.af, (await rail())[2]]);
ok((await ev(() => !!document.querySelector("#main nav.k3-rail.k3-rtabs") && !document.querySelector("#main .k3-rail:not(.k3-rtabs)"))) && (await rail()).length === 5 && (NARROW || new Set((await rail()).map((x) => x.top)).size === 1), "2 Findings' sources are horizontal tabs");
await search("AC-02(07)(a)");
ok((await rows()).length === 1, "2 the list finds it", await rows());
await eye("AC-02(07)(a)");
ok(/Assessment finding/.test(await plabel()) && /AC-02\(07\)\(a\)/.test(await panel()) && (await hash()) === "findings-assessment", "2 its eye opens its own preview over the list, never the control's", await plabel());
ok(await ev((to) => { const x = document.querySelector("#panel .k3-pn"); return !!x && decodeURIComponent(x.getAttribute("data-v2r-full")) === to; }, "finding--" + fid), "2 the preview's way to the full record is the finding's page");
await closePanel();

// ——— 3. On the finding's page: a plan (the POA&M item), then a risk ———
await search("");
await H.go("findings"); const poam0 = await chip("On the POA&M");
await p.click("#main .k3-head details.k3-menu summary"); await w(150); await H.click("Export POA&M", "#main .k3-head .k3-menu-l", { exact: true });
ok(/PRG-1090-poam-2026-11-17\.csv (downloaded|saved)/.test(await H.toast()) || /Copy PRG-1090-poam/.test(await H.modal()), "3 More holds Export POA&M: the kit saves the file", [await H.toast(), (await H.modal()).slice(0, 60)]);
if (await modalOpen()) { await ev(() => document.querySelector("#modal [data-k3-close]").click()); await w(200); }
await H.go("findings-assessment"); await clickRow("AC-02(07)(a)");
ok((await hash()) === "finding--" + fid, "3 the row goes to the finding's page");
await inMain("Create plan", { sel: "button" });
ok((await modalOpen()) && /Correct AC-2\(7\)/.test(await H.val("#k3f-title")), "3 Create plan opens with the finding named", await H.val("#k3f-title"));
await p.fill("#k3f-planned", later(45)); await p.fill("#k3f-resources", "40 engineering hours"); await p.fill("#k3f-ms", "Rework the privileged role table"); await p.fill("#k3f-msDate", later(20));
await submit();
const plan1 = await msec("Plan");
ok(!(await modalOpen()) && plan1 && plan1.n === 1 && /Rework the privileged role table/.test(plan1.text) && /40 engineering hours/.test(plan1.text) && /Change planned date/.test(plan1.text) && /Add milestone/.test(plan1.text) && (await hash()) === "finding--" + fid, "3 the plan and its milestone are on the page, with Add milestone", plan1);
await inMain("Add milestone", { sel: "button" });
await p.fill("#k3f-title", "Retest AC-02(07)(a)"); await submit();
ok(((await msec("Plan")) || {}).n === 2 && /Retest AC-02\(07\)\(a\)/.test((await msec("Plan")).text), "3 a second milestone is added there");
await H.go("findings");
ok((await chip("On the POA&M")) === poam0 + 1, "3 On the POA&M counts one more", [poam0, await chip("On the POA&M")]);
await H.go("findings-poam");
ok((await ev(() => (document.querySelector("#main .k3-chip.on") || {}).innerText || "")).startsWith("On the POA&M") && /Planned completion\s*Milestones\s*Resources/.test(flat(await H.txt("#main .k3-table thead"))), "3 the POA&M is the same list with the plan's columns", flat(await H.txt("#main .k3-table thead")));
await search("AC-02(07)(a)");
ok((await rows()).length === 1 && /40 engineering hours/.test((await rows())[0]) && /0\/2/.test((await rows())[0]), "3 the finding is on the POA&M with its date, milestones and resources", await rows());
await search(""); await clickRow("AC-02(07)(a)");
const risk0 = (await fact("risks", "PRG-1090")).open;
await inMain("Create risk", { sel: "button" });
ok((await modalOpen()) && (await H.val("#k3f-resp")) === "mitigate", "3 Create risk asks the response: Mitigate, since a plan answers it", await H.val("#k3f-resp"));
await p.fill("#k3f-title", "Privileged accounts outlive the role that justified them"); await p.selectOption("#k3f-owner", { index: 2 });
await submit();
ok(!(await modalOpen()) && /Privileged accounts outlive/.test(((await msec("Risk")) || {}).text || "") && (await hash()) === "finding--" + fid, "3 the risk is on the finding's page", await msec("Risk"));
ok((await fact("risks", "PRG-1090")).open === risk0 + 1, "3 the program's open risks count one more", [risk0, (await fact("risks", "PRG-1090")).open]);
await clickRow("Privileged accounts outlive");
ok(/^risk--/.test(await hash()) && (await navOn()) === "Risks" && /Privileged accounts outlive/.test(await head()), "3 the risk's row goes to the risk's page", await hash());
const fb = await msec("Findings behind it");
ok(fb && fb.n === 1 && /AC-02\(07\)\(a\) judged other than satisfied/.test(fb.text) && /Mitigate/.test(await H.main()) && /Link findings/.test(fb.text), "3 the risk's page names the finding and its response, with Link findings", fb);
await H.go("risks");
ok((await rows()).some((r) => /Privileged accounts outlive/.test(r)) && (await tabN("Register")) === risk0 + 1, "3 the risk is in the register", [await tabN("Register")]);
await eye("Privileged accounts outlive");
ok(/^Risk/.test(await plabel()) && /AC-02\(07\)\(a\)/.test(((await sec("Findings behind it")) || {}).text || ""), "3 its eye previews the same record", await plabel());
await closePanel();

// ——— 4. The control and the component read the finding and the risk ———
await H.go("finding--" + encodeURIComponent(fid));
const ctlS = await msec("Control"), cmpS = await msec("Components");
ok(ctlS && ctlS.n === 1 && /AC-2\(7\)/.test(ctlS.text) && cmpS && (!comp || cmpS.n === 1), "4 the finding's page lists its control and its component as rows", [ctlS, cmpS]);
await clickRow("AC-2(7)");
ok((await hash()) === "control--AC-2(7)" && (await navOn()) === "Controls", "4 the control's row goes to the control's page", await hash());
const fr = await msec("Findings and risks");
ok(fr && /AC-02\(07\)\(a\) judged other than satisfied/.test(fr.text) && /Privileged accounts outlive/.test(fr.text), "4 lane C's control page lists the finding and the risk", fr);
const fOf = await fact("findingsOf", "AC-2(7)"), rOf = await fact("risksOf", "AC-2(7)"), fOn = comp ? await fact("findingsOn", comp) : [];
ok(fOf.some((f) => f.id === fid && f.plan && f.risk) && rOf.length === 1 && rOf[0].response === "Mitigate", "4 fact findingsOf and risksOf answer them", [fOf.map((f) => f.id), rOf]);
ok(!comp || fOn.some((f) => f.id === fid), "4 fact findingsOn answers the component it was found on", [comp, fOn.length]);
if (comp) {
  await H.go("finding--" + encodeURIComponent(fid)); await ev(() => { const s = [...document.querySelectorAll("#main .k3-sec")].find((x) => (x.querySelector("h2") || {}).innerText.trim().startsWith("Components")); const tr = s && s.querySelector("tbody tr"); if (tr) tr.click(); }); await w(550);
  ok((await hash()) === "component--" + comp && (await navOn()) === "System", "4 the component's row goes to lane S's component page", await hash());
  await H.go("component--" + comp + "--findings", 600);
  ok(/AC-02\(07\)\(a\) judged other than satisfied/.test(await H.main()), "4 and the component's Findings tab lists the finding", (await H.main()).slice(0, 200));
}

// ——— 5. Publish as the lead assessor: the control's status follows ———
await H.go("assessment--exp--objectives");
ok((await ev(() => { const s = document.querySelector("#main select[data-k3-railsel]"); return s ? s.selectedOptions[0].textContent : ""; })).includes("AC-2(7)") && (await rows()).length === 4, "5 the objectives tab kept its control after leaving and coming back");
for (let i = 0; i < 3; i++) { await H.click("Judge", "#main .k3-table", { exact: true }); await p.selectOption("#k3f-det", "satisfied"); await submit(); }
ok((await rows()).filter((r) => /Satisfied/.test(r) && !/Other than/.test(r)).length === 3 && (await fact("status", "AC-2(7)")) === "not_assessed", "5 all four judged; the draft decides nothing yet", [await fact("status", "AC-2(7)")]);
const ots0 = (await fact("controls", "PRG-1090")).other_than_satisfied;
await H.click("Publish results", "#main .k3-next", { exact: true });
ok((await modalOpen()) && /Only the lead assessor publishes/.test(await H.modal()) && /D\. Okafor/.test(await H.modal()), "5 only the lead assessor publishes: recorded as D. Okafor", (await H.modal()).slice(0, 200));
await submit();
ok(!(await modalOpen()) && /published by D\. Okafor/.test(await H.toast()), "5 published", await H.toast());
ok((await fact("status", "AC-2(7)")) === "other_than_satisfied" && (await fact("controls", "PRG-1090")).other_than_satisfied >= ots0 + 1, "5 fact status and the baseline's counts follow", [await fact("status", "AC-2(7)"), ots0, (await fact("controls", "PRG-1090")).other_than_satisfied]);
await H.click("Results", "#main .k3-tabs");
ok((await rows()).every((r) => /Published/.test(r)) && (await rows()).length >= 3, "5 every result of the campaign is published", await rows());
await H.go("controls"); await search("AC-2(7)");
ok((await rows()).some((r) => /AC-2\(7\)/.test(r) && /Other than satisfied/.test(r)), "5 Controls reads Other than satisfied", (await rows()).slice(0, 2));
await search("");
await H.go("overview");
const ovr = flat(await H.main()), cs = await fact("controls", "PRG-1090"), judged = cs.satisfied + cs.partially_satisfied + cs.other_than_satisfied;
ok(judged > 275 && new RegExp(`Assessed\\S* ${judged}/`).test(ovr) && new RegExp(`${cs.satisfied} controls`).test(ovr), "5 the Overview counts the controls judged and satisfied from the published results", [judged, cs.satisfied, (ovr.match(/Controls satisfied.{0,90}/) || [""])[0]]);
await H.go("finding--" + encodeURIComponent(fid));
ok(!/Draft results/.test(await head()) && /Other than satisfied/.test(await head()), "5 the finding is no longer a draft", await head());

// ——— 6. An operational issue on its page: planned date, milestone, deactivate; each kept after a reload ———
await H.go("findings-issues");
const open0 = await chip("Open"), iss0 = (await fact("issues", "PRG-1090")).open;
ok((await rail())[1].on && open0 === (await rail())[1].n && open0 === iss0, "6 Operational issues: the tab's count, the Open chip and fact(issues) are one number", [open0, (await rail())[1], iss0]);
await search("Session-table occupancy"); await clickRow("Session-table occupancy");
const issRoute = await hash();
ok(/^finding--/.test(issRoute) && /Session-table occupancy/.test(await head()) && /Operational issues/.test(await head()) && (await ev(() => document.querySelectorAll("#main .k3-head .btn.ink").length)) === 1, "6 an operational issue's row goes to its page: a short title, one primary in the header", [issRoute, await head()]);
ok((await ev(() => { const a = document.querySelector("#main .k3-head-a"), t = document.querySelector("#main .k3-title"); return a && t ? Math.abs(a.getBoundingClientRect().top - t.getBoundingClientRect().top) < 24 : false; })) || NARROW, "6 the header's actions sit beside the title, not under it");
ok(/leaving low-rate state exhaustion undetectable/.test(await H.txt("#main .k3-sub")), "6 the full sentence is under the title", await H.txt("#main .k3-sub"));
const pl0 = await msec("Plan");
ok(pl0 && pl0.n === 4 && /Change planned date/.test(pl0.text) && /Planned\s*State/.test(pl0.text), "6 its plan and four milestones with their state", pl0 && pl0.text.slice(0, 200));
ok((await msec("Risk")).n === 1 && (await msec("Control")).n === 1 && (await msec("Components")).n >= 1, "6 its risk, its control and its components are rows on the page", [await msec("Risk"), await msec("Components")]);
await inMain("Change planned date", { sel: "button" });
await submit();
ok((await bad()) === 1, "6 a new date needs its reason");
const moved = later(120);
await p.fill("#k3f-to", moved); await p.fill("#k3f-reason", "The gateway firmware that restores the counter ships with Block 1.1."); await submit();
ok(!(await modalOpen()) && /Mar 17, 2027/.test((await msec("Plan")).text) && /Moved once/.test((await msec("Plan")).text), "6 the planned date moved, with its reason", (await msec("Plan")).text.slice(0, 260));
await inMain("Add milestone", { sel: "button" });
await p.fill("#k3f-title", "Flight test the restored counter export"); await submit();
ok(/Flight test the restored counter export/.test((await msec("Plan")).text) && (await msec("Plan")).n === 5, "6 the milestone is on the plan");
const reached0 = ((await msec("Plan")).text.match(/Reached/g) || []).length;
await inMain("Mark reached", { sel: "button" });
ok(((await msec("Plan")).text.match(/Reached/g) || []).length === reached0 + 1, "6 a milestone is marked reached");
await p.reload(); await w(900);
ok((await ev(() => PA.v3.on())) && (await hash()) === issRoute, "6 after a reload V3 is still on, on the same page");
ok(/Mar 17, 2027/.test((await msec("Plan")).text) && /Flight test the restored counter export/.test((await msec("Plan")).text) && ((await msec("Plan")).text.match(/Reached/g) || []).length === reached0 + 1, "6 the date, the milestone and its state are kept after a reload");
await headMenu("Deactivate");
await p.selectOption("#k3f-reason", { index: 4 }); await p.fill("#k3f-note", "The provider's gateway answers it under its own authorization."); await submit();
ok(/Deactivated/.test(await head()) && /Inherited and answered by the provider/.test(await H.main()) && (await hash()) === issRoute, "6 deactivated on its page, with the reason", await head());
ok(/Reactivate/.test(await ev(() => { document.querySelector("#main .k3-head details.k3-menu summary").click(); const t = document.querySelector("#main .k3-head .k3-menu-l").innerText; document.querySelector("#main .k3-head details.k3-menu").open = false; return t; })), "6 More offers Reactivate");
await H.go("findings-issues");
ok(flat(await H.val("#main .k3-search input")) === "Session-table occupancy", "6 back on the list, the search the reader typed is still there");
await search("");
ok((await chip("Open")) === open0 - 1 && (await chip("Deactivated")) === 1 && (await fact("issues", "PRG-1090")).open === iss0 - 1, "6 one fewer open here and in fact(issues), one under Deactivated", [open0, await chip("Open"), await chip("Deactivated")]);
await H.click("Deactivated", "#main .k3-chips");
ok((await rows()).length === 1 && /Session-table occupancy/.test((await rows())[0]), "6 the Deactivated chip lists it");
await p.reload(); await w(900); await H.go("overview"); await H.go("findings-issues");
ok((await chip("Open")) === open0 - 1 && (await chip("Deactivated")) === 1, "6 still deactivated after a reload");
await H.click("Open", "#main .k3-chips");
await H.go("overview");
ok((await ev(() => [...document.querySelectorAll("#main .k3-att-r")].map((x) => x.innerText.replace(/\s+/g, " ").trim()))).includes(`Operational issues ${open0 - 1}`), "6 the Overview prints the same number");

// ——— 7. Risks' Threats: a technique's page lists its risks; a technique is linked on a risk's page ———
await H.go("threats");
ok((await hash()) === "risks-threats" && (await navOn()) === "Risks" && (await rows()).length >= 30, "7 Threats is a tab of Risks", [await hash(), (await rows()).length]);
await eye("T1078");
const t0 = await sec("Risks that name it");
ok(/ATT&CK technique/.test(await plabel()) && t0.n === 5 && /A password on its own reaches WS-X90/.test(t0.text), "7 a technique's eye previews its risks", [t0 && t0.n]);
await closePanel();
await clickRow("T1078");
ok((await hash()) === "technique--T1078" && (await navOn()) === "Risks" && /Risks\s*›\s*Threats\s*›\s*T1078/.test(await head()) && /Link to a risk/.test(await head()), "7 its row goes to the technique's page", [await hash(), await head()]);
ok((await msec("Risks that name it")).n === 5 && (await msec("Countering controls")).n === 5 && /In the baseline/.test((await msec("Countering controls")).text), "7 the page lists its risks and its countering controls with their standing");
await clickRow("A password on its own");
const riskRoute = await hash();
ok(/^risk--/.test(riskRoute) && /A password on its own/.test(await head()) && (await ev(() => document.querySelectorAll("#main .k3-head .btn.ink").length)) === 1, "7 a risk's row there goes to the risk's page, one primary in its header", [riskRoute, await head()]);
const tk0 = (await msec("ATT&CK techniques")).n;
await inMain("Link technique", { sel: "button" });
ok((await modalOpen()) && (await ev(() => document.querySelectorAll("#modal .k3-pick-i.held").length)) === tk0, "7 the picker marks the techniques it names already", [tk0]);
await p.fill("#modal [data-k3-pickq]", "T1200"); await w(250);
await p.click("#modal .k3-pick-i:not(.held) input"); await submit();
const tk1 = await msec("ATT&CK techniques");
ok(tk1.n === tk0 + 1 && /T1200/.test(tk1.text) && (await hash()) === riskRoute, "7 the technique is linked on the risk's page", tk1);
await H.click("Unlink", "#main", { exact: true }); await w(200);
ok((await modalOpen()) && (await hash()) === riskRoute, "7 Unlink asks first and does not leave the page", await hash());
await ev(() => document.querySelector("#modal [data-k3-close]").click()); await w(200);
await H.go("technique--T1200");
ok(/A password on its own reaches WS-X90/.test((await msec("Risks that name it")).text), "7 and the technique now lists that risk");
await H.go("risks");
ok((await chip("No owner")) === (await chip("Open")) - 1, "7 the register's No owner chip follows the one risk that has an owner", [await chip("Open"), await chip("No owner")]);
await H.click("No owner", "#main .k3-chips");
ok((await rows()).length === (await chip("No owner")), "7 a chip shows exactly what it counts");
await H.click("Open", "#main .k3-chips");

// ——— 8. Authorization: the package reads its records; a condition is closed in place; Sharing adds a person ———
await H.go("findings"); const poamN = await chip("On the POA&M");
await H.go("authorization");
const pk = await rows();
ok((await navOn()) === "Authorization" && /ATO with conditions/.test(await H.txt("#main .k3-head")) && pk.length === 4, "8 Authorization says the decision in force and what the package holds", pk);
ok(new RegExp(`${poamN} findings with a plan`).test(pk[2]) && (await fact("findingCounts")).poam === poamN, "8 the POA&M part counts what Findings counts", [poamN, pk[2]]);
ok(/Not ready/.test(pk[0]) && /Ready.*Every result published/.test(pk[1]) && /without an owner/.test(pk[3]), "8 each part says ready or not from its record", pk);
await clickRow("Plan of action and milestones");
ok((await hash()) === "findings-poam" && (await chip("On the POA&M")) === poamN, "8 the POA&M part opens the same list", [await hash()]);
await H.go("authorization-conditions");
const c0 = await tabN("Conditions");
await H.click("Close", "#main .k3-table", { exact: true });
await p.fill("#k3f-how", "The high items are closed or carry an approved plan; the POA&M review of Nov 17 records it."); await submit();
ok((await tabN("Conditions")) === c0 - 1 && (await rows()).some((r) => /Closed/.test(r)) && (await fact("conditions", "PRG-1090")).filter((c) => !c.closed).length === c0 - 1, "8 a condition closed in place lowers the count, here and in fact(conditions)", [c0, await tabN("Conditions")]);
await H.go("authorization-decisions");
ok((await rows()).length === 4 && (await rows()).filter((r) => /Record decision/.test(r)).length === 2, "8 Decisions lists the IATTs and ATOs; the two planned offer Record decision", await rows());
await H.click("Record decision", "#main .k3-table", { exact: true });
// lead (whole build): an authorization's decision is recorded here; lane O sends gate--ato-N back to Authorization.
ok((await hash()) === "authorization-decisions" && (await modalOpen()) && /Record decision: (IATT|ATO)/.test(await ev(() => document.getElementById("modal").innerText)), "8 Record decision opens here, on the planned decision", [await hash(), await modalOpen()]);
const scope0 = await ev(() => document.querySelector("#k3f-scope").value); await submit();
ok(scope0.length > 5 && (await rows()).filter((r) => /Record decision/.test(r)).length === 1 && (await rows()).filter((r) => /Decided/.test(r)).length === 3, "8 recorded: the row reads Decided and one planned decision is left", [scope0, await rows()]);
await H.go("package-room");
ok((await hash()) === "authorization-sharing" && (await rows()).length === 7, "8 the Package room is Authorization's Sharing tab", [await hash(), (await rows()).length]);
await H.click("Share with a person", "#main", { exact: true });
await p.fill("#k3f-name", "Col. M. Reyes"); await p.fill("#k3f-role", "Receiving authorizing official"); await p.selectOption("#k3f-can", { index: 2 }); await submit();
ok((await rows()).length === 8 && (await rows()).some((r) => /Col\. M\. Reyes/.test(r)) && (await tabN("Sharing")) === 8, "8 Sharing adds a person", [await tabN("Sharing")]);
await H.go("authorization-monitoring");
ok(/What ongoing authorization owes\s*12/.test(flat(await H.main())) && /Significant changes/.test(await H.main()), "8 Monitoring lists what ongoing authorization owes");

// ——— 9. Every folded address lands ———
const FOLDS = [["cyber-te", "assessments-cyber", "Assessments"], ["cyber-te-findings", "assessments-cyber", "Assessments"], ["conmon", "assessments-checks", "Assessments"], ["conmon-runs", "assessments-checks", "Assessments"], ["checks", "assessments-checks", "Assessments"], ["schedule", "assessments-checks", "Assessments"], ["check-stig", "assessment--chk-stig", "Assessments"], ["check-scan-history", "assessment--chk-vuln", "Assessments"],
  ["campaign", "assessment--exp", "Assessments"], ["campaign-conmon", "assessment--conmon", "Assessments"], ["campaign-findings", "assessment--exp--findings", "Assessments"], ["assessments-assessor", "assessments", "Assessments"], ["assessments-results", "assessments", "Assessments"],
  ["poam", "findings-poam", "Findings"], ["poam-milestones", "findings-poam", "Findings"], ["findings-assets", "findings-assets", "Findings"], ["findings-deactivated", "findings-deactivated", "Findings"], ["findings-vulns", "findings-vulns", "Findings"],
  ["threats", "risks-threats", "Risks"], ["threats-controls", "risks-threats", "Risks"], ["risks-snapshots", "risks-snapshots", "Risks"], ["package-room", "authorization-sharing", "Authorization"], ["package-room-log", "authorization-sharing", "Authorization"], ["authorization-sharing-requests", "authorization-sharing", "Authorization"]];
const landed = [];
for (const [from, to, nav] of FOLDS) { await H.go("overview", 250); await H.go(from, 500); const s = { from, hash: await hash(), nav: await navOn(), k3: await ev(() => !!document.querySelector("#main .k3e .k3-title")) }; if (s.hash !== to || s.nav !== nav || !s.k3) landed.push(s); }
ok(!landed.length, `9 ${FOLDS.length} folded addresses open their new home under the right menu entry`, landed);
await H.go("findings-vulns");
ok((await rail())[3].on && (await rows()).length === 4 && /CVE-2024-6387/.test((await rows()).join(" ")), "9 the Vulnerabilities address opens Findings on that source");
await H.go("assessment--chk-stig--findings");
ok((await rows()).length === 75 && (await tabN("Findings")) === 75, "9 a monitoring check's failures are findings on its page", [(await rows()).length, await tabN("Findings")]);
await clickRow("V-257789");
ok(/^finding--stig:/.test(await hash()) && /STIG rules/.test(await head()), "9 a STIG rule's row goes to its finding page", await hash());
await H.go("assessment--chk-vuln");
await H.click("Record a run", "#main", { exact: true });
await p.selectOption("#k3f-result", "Passed"); await submit();
ok(/On schedule/.test(await H.txt("#main .k3-head")) && (await tabN("Runs")) === 3, "9 a run recorded on a check's page puts it back on schedule", [flat(await H.txt("#main .k3-head")).slice(0, 120), await tabN("Runs")]);

// ——— 10. A CVE a component's newer version fixes leaves that component's findings (lane S's fact cveFixed) ———
const mc = "CN-109101", on0 = (await fact("findingsOn", mc)).filter((f) => f.kind === "vuln").length;
await H.go("findings-vulns"); const vOpen0 = await chip("Open");
// lead (whole build): where lane S is in the build the version is really taken on the component's page; the stand-in is for a build without it.
if (await ev(() => typeof PA.v3.facts.cveFixed === "function" && !!document.querySelector("body") && !!PA.v3s)) {
  await H.go("component--" + mc, 600); await p.click('#main .k3-next button:has-text("Take version 2")'); await w(400);
  await p.fill("#v3w-take-note", "Checked the image hash and the SBOM against the supplier's release note."); await p.click("#modal [data-v3w-take]"); await w(700);
  await H.go("findings-vulns", 600);
} else { await ev(() => { window.__cve0 = PA.v3.facts.cveFixed; PA.v3.facts.cveFixed = (cve, c) => (cve === "CVE-2024-6387" && c === "CN-109101") || (typeof window.__cve0 === "function" && window.__cve0(cve, c) === true); PA.v3k.set("e.walk", 1); PA.v3k.redraw(); }); await w(450); }
const on1 = (await fact("findingsOn", mc)).filter((f) => f.kind === "vuln").length;
ok(on0 >= 1 && on1 === on0 - 1, "10 once lane S says the version fixes it, the CVE leaves the component's findings", [on0, on1]);
ok((await chip("Open")) === vOpen0 - 1 && (await chip("Fixed")) === 1 && !(await rows()).some((r) => /CVE-2024-6387/.test(r)), "10 it leaves the open vulnerabilities; a Fixed chip counts it", [vOpen0, await chip("Open"), await chip("Fixed")]);
await H.click("Fixed", "#main .k3-chips");
ok((await rows()).length === 1 && /CVE-2024-6387/.test((await rows())[0]) && /Fixed in a newer version/.test((await rows())[0]), "10 the Fixed chip lists it, marked fixed", await rows());
await clickRow("CVE-2024-6387");
ok(/Fixed in a newer version/.test(await head()) && /Mission Computer took a version that fixes it/.test(flat(await H.main())), "10 its page says which component's version fixed it", await head());
await H.go("component--" + mc + "--findings", 600);
ok(!(await rows()).some((r) => /CVE-2024-6387/.test(r)), "10 lane S's Findings tab no longer lists it", // lead: the rows, not the page: the back link names the finding the reader came from
  await ev(() => { const t = document.getElementById("main").innerText, i = t.indexOf("CVE-2024-6387"); return [location.hash, i < 0 ? null : t.slice(Math.max(0, i - 200), i + 100).replace(/\s+/g, " ")]; }));
await ev(() => { PA.v3.facts.cveFixed = window.__cve0; if (!window.__cve0) delete PA.v3.facts.cveFixed; PA.v3k.set("e.walk", 2); });
await H.go("findings-vulns"); await H.click("Open", "#main .k3-chips");
ok((await chip("Open")) === vOpen0, "10 (the walk's stand-in for lane S's fact is taken back)");

// ——— Widths: every route at this width; no list of kinds down the side; a tabbed page has one row of tabs ———
const ROUTES = ["findings", "findings-poam", "finding--1f680dd7", "finding--" + encodeURIComponent(fid), "assessments", "assessment--exp", "assessment--exp--objectives", "assessment--conmon--objectives", "assessment--chk-vuln", "assessment--cy-cvi", "risks", "risks-threats", "risk--0a21dc94", "technique--T1078", "authorization", "authorization-conditions", "authorization-sharing"];
for (const width of NARROW ? [390] : [1440, 390]) { const off = []; await H.width(width); for (const r of ROUTES) { await H.go("overview", 200); await H.go(r, 450); const s = await ev(() => ({ side: document.documentElement.scrollWidth - document.documentElement.clientWidth, main: document.getElementById("main").scrollWidth - document.getElementById("main").clientWidth, nav: !!document.querySelector("#nav a.item.on"), k3: !!document.querySelector("#main .k3"), gone: /no longer here|Nothing at this address/.test(document.getElementById("main").innerText), vrail: !!document.querySelector("#main .k3-rail:not(.k3-rtabs), #main .k3-split"), tabrows: document.querySelector("#main .k3-tabs") ? [...document.querySelectorAll("#main nav.k3-rtabs")].filter((x) => getComputedStyle(x).borderBottomWidth !== "0px").length : 0 })); if (s.side > 0 || s.main > 1 || !s.nav || !s.k3 || s.gone || s.vrail || s.tabrows) off.push(Object.assign({ r }, s)); } ok(!off.length, `${ROUTES.length} routes at ${width}: no sideways scroll, the menu entry marked, no vertical tabs, one row of tabs`, off); }
await H.go("findings"); await eye("Payload arm");
ok(await ev(() => !!document.querySelector("#panel .k3-pn") && document.documentElement.scrollWidth <= 390), "the finding's preview opens at 390 without sideways scroll");
await closePanel();
await H.width(WIDTH);

// ——— 11. A created program: its own registers, never WS-X90's ———
const wsxOpen = (await fact("findingCounts")).open;
if (NARROW) await H.width(1440); // the program wizard is walked at a desktop width
const seen = await createSP70(H, { nss: true });
if (NARROW) await H.width(WIDTH);
const other = {};
for (const r of ["findings", "assessments", "risks", "authorization", "authorization-conditions", "authorization-sharing", "risks-threats", "findings-poam"]) { await H.go(r, 500); other[r] = flat(await H.main()); }
const leak = Object.entries(other).filter(([, t]) => /WS-X90|Payload arm|Expanded control set|ACAS|R\. Calloway.*Sep 18|T1078|CVE-2024/.test(t)).map(([r]) => r);
ok((await H.cur()) === seen.code && !leak.length, "11 a created program's pages show none of WS-X90's records", [seen.code, leak]);
ok(/No finding yet/.test(other.findings) && /Add finding/.test(other.findings) && /No assessment yet/.test(other.assessments) && /Plan an assessment/.test(other.assessments) && /No risk yet/.test(other.risks) && /No decision yet/.test(other.authorization), "11 each is an empty register with its working Add", Object.fromEntries(Object.entries(other).map(([k, v]) => [k, v.slice(0, 90)])));
await H.go("findings"); await H.click("Add finding", "#main .k3-head", { exact: true });
await p.fill("#k3f-title", "Pod stores interface accepts an unsigned mission load"); await p.selectOption("#k3f-sev", "high"); await submit();
ok(/^finding--fnd-/.test(await hash()) && /Pod stores interface/.test(await head()) && !/WS-X90/.test(await H.main()), "11 Add finding works there and goes to the finding's page", await hash());
await inMain("Create plan", { sel: "button" }); await p.fill("#k3f-title", "Verify the mission load signature at the stores interface"); await submit();
await H.go("findings");
ok((await rows()).length === 1 && (await chip("On the POA&M")) === 1, "11 its plan puts it on that program's POA&M", [await rows(), await chip("On the POA&M")]);
await H.go("overview");
ok((await ev(() => [...document.querySelectorAll("#main .k3-att-r")].map((x) => x.innerText.replace(/\s+/g, " ").trim()))).some((x) => /^Operational issues 1$/.test(x)) || !(await ev(() => !!document.querySelector("#main .k3-att-r"))), "11 that program's Overview counts its one finding", await ev(() => [...document.querySelectorAll("#main .k3-att-r")].map((x) => x.innerText.replace(/\s+/g, " ").trim())));
await H.go("risks"); await H.click("Create risk", "#main .k3-head", { exact: true });
await p.fill("#k3f-title", "A tampered mission load reaches the weapon"); await p.selectOption("#k3f-resp", "mitigate"); await submit();
ok(/^risk--/.test(await hash()) && /A tampered mission load/.test(await head()), "11 Create risk works there and goes to the risk's page", await hash());
await H.go("risks");
ok((await rows()).length === 1 && /A tampered mission load/.test((await rows())[0]), "11 the risk is in that program's register", await rows());
await H.go("assessments"); await H.click("Plan an assessment", "#main .k3-head", { exact: true });
await p.fill("#k3f-name", "SP-70 initial control assessment"); await submit();
ok(/^assessment--asm-/.test(await hash()) && /SP-70 initial control assessment/.test(await H.txt("#main .k3-title")), "11 Plan an assessment works there and opens the assessment's page", await hash());
await ev(() => PA.v2hubs.setCur("PRG-1090")); await H.go("overview"); await H.go("findings", 700);
ok((await fact("findingCounts")).open === wsxOpen && !/Pod stores interface/.test(await H.main()), "11 back on WS-X90: its own findings, none of the other program's", [wsxOpen, (await fact("findingCounts")).open]);

// ——— V3 off ———
await ev(() => PA.v3.set(false)); await w(400); await H.go("findings", 600);
ok(!(await ev(() => !!document.querySelector("#main .k3e"))) && /Findings/.test(await H.main()), "V3 off: Findings is v2's page");
await H.go("risks-threats", 500);
ok(/Part of V3/.test(await H.main()), "V3 off: a page only V3 has says so");
ok(await ev(() => !(PA.v2.get("chain.camps", null) || []).length && !Object.keys(PA.v2.get("chain.ctl", null) || {}).includes("AC-2(7)")), "V3 off: the expanded campaign's objective results left nothing in v2's chain", await ev(() => [PA.v2.get("chain.camps", null), Object.keys(PA.v2.get("chain.ctl", null) || {})]));
await H.go("assessments", 600); const camps1 = ((await H.main()).match(/Open campaign/g) || []).length;
await ev(() => PA.v2.reset()); await w(400); await H.go("home", 300); await H.go("assessments", 600);
ok(camps1 > 0 && camps1 === ((await H.main()).match(/Open campaign/g) || []).length, "V3 off: v2's Assessments lists the same campaigns as a fresh visit, none twice", camps1);
} catch (e) { fails++; console.log("THREW:", String(e.message).split("\n").slice(0, 3).join(" | ")); }
console.log(`\n${n - fails} of ${n} passed at ${WIDTH}`);
console.log("page errors", H.errs.slice(0, 8));
await H.b.close();
process.exit(fails || H.errs.length ? 1 : 0);
