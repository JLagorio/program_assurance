// Lane E's walk: with V3 on, through the UI, every flow of the brief; asserts what a person would see. node walk.mjs [build]
import { open, createSP70, SP } from "../../v3/P/lib.mjs";
const build = process.argv[2] || SP + "/vanta/proto/out/v3r-E.html";
const H = await open({ build, start: "overview" }), p = H.p;
p.setDefaultTimeout(6000);
setTimeout(() => { console.log("WATCHDOG: the walk ran over 6 minutes"); process.exit(2); }, 360000);
let fails = 0, n = 0;
const ok = (c, name, extra) => { n++; if (!c) fails++; console.log(c ? "ok  " : "FAIL", name, c || extra === undefined ? "" : JSON.stringify(extra)); };
const ev = (fn, a) => p.evaluate(fn, a);
const w = (ms = 350) => p.waitForTimeout(ms);
const flat = (s) => String(s || "").replace(/\s+/g, " ").trim();
const rows = (sel = "#main") => ev((sel) => [...document.querySelectorAll(sel + " .k3-table tbody tr:not(.k3-grow)")].map((tr) => tr.innerText.replace(/\s+/g, " ").trim()), sel);
const rail = () => ev(() => [...document.querySelectorAll("#main .k3-rail-i")].map((x) => ({ t: x.querySelector(".x").innerText.replace(/\s+/g, " "), n: +x.querySelector(".num").innerText.replace(/,/g, ""), on: x.classList.contains("on") })));
const chip = (label) => ev((l) => { const c = [...document.querySelectorAll("#main .k3-chip")].find((x) => x.innerText.startsWith(l)); return c ? +c.querySelector(".num").innerText.replace(/,/g, "") : -1; }, label);
const tabN = (label) => ev((l) => { const c = [...document.querySelectorAll("#main .k3-tab")].find((x) => x.innerText.trim().startsWith(l)); const n = c && c.querySelector(".k3-ct"); return n ? +n.innerText.replace(/,/g, "") : -1; }, label);
const search = async (q) => { await p.fill("#main .k3-search input", q); await w(500); };
const panel = () => ev(() => { const e = document.querySelector("#panel"); return e && !e.hidden ? e.innerText.replace(/[ \t]+/g, " ") : ""; });
const plabel = () => ev(() => { const e = document.querySelector("#panel"); return e && !e.hidden ? (e.querySelector(".bar-top span, #panelLabel") || {}).textContent || "" : ""; });
const sec = (title) => ev((t) => { const s = [...document.querySelectorAll("#panel .k3-sec")].find((x) => (x.querySelector("h2") || {}).innerText.startsWith(t)); return s ? { n: +((s.querySelector(".k3-ct") || {}).innerText || "0"), text: s.innerText.replace(/\s+/g, " ") } : null; }, title);
const submit = async () => { await p.click("#modal [data-k3-submit]"); await w(450); };
const modalOpen = () => ev(() => !document.getElementById("modal").hidden);
const bad = () => ev(() => document.querySelectorAll("#modal .k3-f.bad").length);
const fact = (name, ...a) => ev(([name, a]) => PA.v3.fact(name, ...a), [name, a]);
const navOn = () => ev(() => [...document.querySelectorAll("#nav a.item")].filter((a) => a.classList.contains("on")).map((a) => a.innerText.trim()).join("|"));
const navItems = () => ev(() => [...document.querySelectorAll("#nav a.item")].map((a) => a.innerText.trim()));
const clickRow = async (text, scope = "#main") => { const r = await ev(([text, scope]) => { const tr = [...document.querySelectorAll(scope + " .k3-table tbody tr")].find((t) => t.innerText.includes(text)); if (!tr) return false; tr.scrollIntoView({ block: "center" }); tr.click(); return true; }, [text, scope]); await w(500); return r; };
const inPanel = (text, opts) => H.click(text, "#panel", Object.assign({ exact: true }, opts || {}));
const pmenu = async (item) => { await p.click("#panel details.k3-menu summary"); await w(150); return H.click(item, "#panel .k3-menu-l", { exact: true }); };
const later = (days) => { const d = new Date("2026-11-17T12:00:00"); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };

try {
// ——— 1. Assessments: a kind filters in place; a campaign's row opens its page with the program menu still there ———
await H.go("assessments");
const allN = (await rows()).length;
ok((await navOn()) === "Assessments" && allN >= 15 && (await rail()).length === 4, "1 Assessments lists every assessment under one rail", [allN, await rail()]);
await H.click("Control assessments", "#main .k3-rail");
ok((await H.hash()) === "assessments-control" && (await rows()).length === 3 && (await rail())[1].on && /^Assessments/.test(flat(await H.txt("#main .k3-title"))), "1 the rail kind filters in place", [await H.hash(), (await rows()).length]);
await H.click("Monitoring checks", "#main .k3-rail");
ok((await rows()).length === 12 && /Monthly/.test((await rows())[0]), "1 monitoring checks are assessments with a cadence and a next run", (await rows())[0]);
await H.click("Control assessments", "#main .k3-rail");
await clickRow("Expanded control set assessment");
ok((await H.hash()) === "assessment--exp" && (await navOn()) === "Assessments" && (await navItems()).includes("Findings") && (await navItems()).includes("Overview") && (await navItems()).length === 10, "1 the campaign's page keeps the program menu, Assessments marked", [await H.hash(), await navItems()]);
ok(/Plan\s*Objectives\s*\d+\s*Requests\s*\d+\s*Results\s*\d+\s*Findings\s*\d+/.test(flat(await H.txt("#main .k3-tabs"))), "1 its tabs: Plan, Objectives, Requests, Results, Findings", flat(await H.txt("#main .k3-tabs")));

// ——— 2. Judge one objective: a finding opens at once ———
const src0 = (await fact("findingCounts")).bySource, f0tab = await tabN("Findings");
await H.click("Objectives", "#main .k3-tabs");
ok((await H.hash()) === "assessment--exp--objectives" && (await navOn()) === "Assessments", "2 Objectives is a tab by address");
await H.click("AC-2(7)", "#main .k3-rail");
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
const fid = "af:exp:AC-2(7):0";
ok(!(await modalOpen()) && /Assessment finding/.test(await plabel()) && /AC-02\(07\)\(a\) judged other than satisfied/.test(await panel()) && /Draft results/.test(await panel()), "2 the finding opens at once, in its own panel", [await plabel(), (await panel()).slice(0, 160)]);
ok(/maintainer accounts/.test(await panel()) && /Recorded as|recorded as/.test(await panel()) && /Create plan/.test(await panel()), "2 the panel says what was found, who recorded it, and offers Create plan");
ok((await tabN("Findings")) === f0tab + 1, "2 the campaign's Findings tab counts one more", [f0tab, await tabN("Findings")]);
ok(/Other than satisfied/.test((await rows())[0]) && /draft/.test((await rows())[0]), "2 the objective reads Other than satisfied, a draft", (await rows())[0]);
await H.click("Findings", "#main .k3-tabs");
ok((await rows()).some((r) => /AC-02\(07\)\(a\) judged other than satisfied/.test(r)), "2 it is on the campaign's Findings tab");
await H.go("findings-assessment");
const srcA = (await fact("findingCounts")).bySource;
ok((await rail())[2].on && (await rail())[2].n === src0.af + 1 && srcA.af === src0.af + 1, "2 it is under Assessment findings, counted", [src0.af, (await rail())[2]]);
await search("AC-02(07)(a)");
ok((await rows()).length === 1, "2 the list finds it", await rows());
await clickRow("AC-02(07)(a)");
ok(/Assessment finding/.test(await plabel()) && !/^Control/.test(await plabel()), "2 its row opens its own panel, never the control's", await plabel());

// ——— 3. From the finding: a plan (the POA&M item), then a risk ———
await search("");
const poam0 = await chip("On the POA&M");
await inPanel("Create plan");
ok((await modalOpen()) && /Correct AC-2\(7\)/.test(await H.val("#k3f-title")), "3 Create plan opens with the finding named", await H.val("#k3f-title"));
await p.fill("#k3f-planned", later(45)); await p.fill("#k3f-resources", "40 engineering hours"); await p.fill("#k3f-ms", "Rework the privileged role table"); await p.fill("#k3f-msDate", later(20));
await submit();
ok(!(await modalOpen()) && /Rework the privileged role table/.test(await panel()) && /40 engineering hours/.test(await panel()) && /Change planned date/.test(await panel()), "3 the plan and its milestone are in the panel", (await panel()).slice(0, 300));
ok((await chip("On the POA&M")) === poam0 + 1, "3 On the POA&M counts one more", [poam0, await chip("On the POA&M")]);
await H.go("findings-poam");
ok((await ev(() => (document.querySelector("#main .k3-chip.on") || {}).innerText || "")).startsWith("On the POA&M") && /Planned completion\s*Milestones\s*Resources/.test(flat(await H.txt("#main .k3-table thead"))), "3 the POA&M is the same list with the plan's columns", flat(await H.txt("#main .k3-table thead")));
await search("AC-02(07)(a)");
ok((await rows()).length === 1 && /40 engineering hours/.test((await rows())[0]) && /0\/1/.test((await rows())[0]), "3 the finding is on the POA&M with its date, milestones and resources", await rows());
await clickRow("AC-02(07)(a)");
const risk0 = (await fact("risks", "PRG-1090")).open;
await inPanel("Create risk");
ok((await modalOpen()) && (await H.val("#k3f-resp")) === "mitigate", "3 Create risk asks the response: Mitigate, since a plan answers it", await H.val("#k3f-resp"));
await p.fill("#k3f-title", "Privileged accounts outlive the role that justified them"); await p.selectOption("#k3f-owner", { index: 2 });
await submit();
ok(!(await modalOpen()) && /Privileged accounts outlive/.test((await sec("Risk") || {}).text || ""), "3 the risk is on the finding", await sec("Risk"));
ok((await fact("risks", "PRG-1090")).open === risk0 + 1, "3 the program's open risks count one more", [risk0, (await fact("risks", "PRG-1090")).open]);
await H.go("risks");
ok((await navOn()) === "Risks" && (await rows()).some((r) => /Privileged accounts outlive/.test(r)) && (await tabN("Register")) === risk0 + 1, "3 the risk is in the register", [await tabN("Register")]);
await clickRow("Privileged accounts outlive");
ok(/^Risk/.test(await plabel()) && /AC-02\(07\)\(a\) judged other than satisfied/.test((await sec("Findings behind it") || {}).text || "") && /Mitigate/.test(await panel()), "3 the risk's panel names the finding and its response", await sec("Findings behind it"));

// ——— 4. The control and the component read the finding and the risk ———
await clickRow("AC-02(07)(a)", "#panel");
ok(/Assessment finding/.test(await plabel()), "4 the risk's finding row opens the finding");
await H.click("AC-2(7)", "#panel .k3-facts");
ok(/^Control/.test(await plabel()) && /AC-2\(7\)/.test(await panel()), "4 the finding's Control opens lane C's panel", await plabel());
const fr = await sec("Findings and risks");
ok(fr && /AC-02\(07\)\(a\) judged other than satisfied/.test(fr.text) && /Privileged accounts outlive/.test(fr.text), "4 the control's panel lists the finding and the risk", fr);
const fOf = await fact("findingsOf", "AC-2(7)"), rOf = await fact("risksOf", "AC-2(7)"), fOn = comp ? await fact("findingsOn", comp) : [];
ok(fOf.some((f) => f.id === fid && f.plan && f.risk) && rOf.length === 1 && rOf[0].response === "Mitigate", "4 fact findingsOf and risksOf answer them", [fOf.map((f) => f.id), rOf]);
ok(!comp || fOn.some((f) => f.id === fid), "4 fact findingsOn answers the component it was found on", [comp, fOn.length]);

// ——— 5. Publish as the lead assessor: the control's status follows ———
await H.go("assessment--exp--objectives");
ok((await ev(() => (document.querySelector("#main .k3-rail-i.on .x") || {}).innerText || "")).includes("AC-2(7)") && (await rows()).length === 4, "5 the objectives tab kept its control after leaving and coming back");
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
await H.go("overview");
const ovr = flat(await H.main()), cs = await fact("controls", "PRG-1090"), judged = cs.satisfied + cs.partially_satisfied + cs.other_than_satisfied;
ok(judged > 275 && new RegExp(`Assessed\\S* ${judged}/`).test(ovr) && new RegExp(`${cs.satisfied} controls`).test(ovr), "5 the Overview counts the controls judged and satisfied from the published results", [judged, cs.satisfied, (ovr.match(/Controls satisfied.{0,90}/) || [""])[0]]);
await H.go("findings-assessment"); await search("AC-02(07)(a)");
ok((await rows()).length === 1 && !/Draft results/.test((await rows())[0]), "5 the finding is no longer a draft", await rows());
await search("");

// ——— 6. An operational issue: planned date, milestone, deactivate; each kept after a reload ———
await H.go("findings-issues");
const open0 = await chip("Open"), iss0 = (await fact("issues", "PRG-1090")).open;
ok((await rail())[1].on && open0 === (await rail())[1].n, "6 Operational issues: the rail's count is the Open chip's", [open0, (await rail())[1]]);
await search("Session-table occupancy"); await clickRow("Session-table occupancy");
ok(/Operational issue/.test(await plabel()) && /Change planned date/.test(await panel()), "6 an operational issue opens the same panel with its plan", await plabel());
const ms0 = await ev(() => document.querySelectorAll("#panel .k3-sec .k3-table tbody tr").length);
await inPanel("Change planned date", { sel: "button" });
await submit();
ok((await bad()) === 1, "6 a new date needs its reason");
const moved = later(120);
await p.fill("#k3f-to", moved); await p.fill("#k3f-reason", "The gateway firmware that restores the counter ships with Block 1.1."); await submit();
ok(!(await modalOpen()) && /Mar 17, 2027/.test(await panel()) && /Moved once/.test(await panel()), "6 the planned date moved, with its reason", (await panel()).match(/Planned completion[^\n]*\n[^\n]*/));
await inPanel("Add milestone");
await p.fill("#k3f-title", "Flight test the restored counter export"); await submit();
ok(/Flight test the restored counter export/.test(await panel()), "6 the milestone is on the plan");
await inPanel("Mark reached", { sel: "button" });
ok(/Reached/.test(await panel()), "6 a milestone is marked reached");
await p.reload(); await w(900);
ok(await ev(() => PA.v3.on()), "6 after a reload V3 is still on");
await H.go("overview"); await H.go("findings-issues"); await search("Session-table occupancy"); await clickRow("Session-table occupancy");
ok(/Mar 17, 2027/.test(await panel()) && /Flight test the restored counter export/.test(await panel()) && /Reached/.test(await panel()), "6 the date, the milestone and its state are kept after a reload");
await pmenu("Deactivate");
await p.selectOption("#k3f-reason", { index: 4 }); await p.fill("#k3f-note", "The provider's gateway answers it under its own authorization."); await submit();
await search("");
ok((await chip("Open")) === open0 - 1 && (await chip("Deactivated")) === 1 && (await fact("issues", "PRG-1090")).open === iss0 - 1, "6 deactivated: one fewer open here and in fact(issues), one under Deactivated", [open0, await chip("Open"), await chip("Deactivated")]);
await H.click("Deactivated", "#main .k3-chips");
ok((await rows()).length === 1 && /Session-table occupancy/.test((await rows())[0]), "6 the Deactivated chip lists it");
await clickRow("Session-table occupancy");
ok(/Inherited and answered by the provider/.test(await panel()) && /Reactivate/.test(await ev(() => { document.querySelector("#panel details.k3-menu summary").click(); return document.querySelector("#panel .k3-menu-l").innerText; })), "6 its panel says why, and offers Reactivate");
await p.reload(); await w(900); await H.go("overview"); await H.go("findings-issues");
ok((await chip("Open")) === open0 - 1 && (await chip("Deactivated")) === 1, "6 still deactivated after a reload");
await H.click("Open", "#main .k3-chips");

// ——— 7. Risks' Threats: a technique lists its risks; a technique is linked on a risk's panel ———
await H.go("threats");
ok((await H.hash()) === "risks-threats" && (await navOn()) === "Risks" && (await rows()).length >= 30, "7 Threats is a tab of Risks", [await H.hash(), (await rows()).length]);
await clickRow("T1078");
const t0 = await sec("Risks that name it");
ok(/ATT&CK technique/.test(await plabel()) && t0.n === 5 && /A password on its own reaches WS-X90/.test(t0.text) && (await sec("Countering controls")).n === 5, "7 a technique lists its risks and its countering controls", [t0 && t0.n]);
await clickRow("A password on its own", "#panel");
ok(/^Risk/.test(await plabel()) && /A password on its own/.test(await panel()), "7 a risk's row there opens the risk");
const tk0 = (await sec("ATT&CK techniques")).n;
await inPanel("Link technique");
ok((await modalOpen()) && (await ev(() => document.querySelectorAll("#modal .k3-pick-i.held").length)) === tk0, "7 the picker marks the techniques it names already", [tk0]);
await p.fill("#modal [data-k3-pickq]", "T1200"); await w(250);
await p.click("#modal .k3-pick-i:not(.held) input"); await submit();
const tk1 = await sec("ATT&CK techniques");
ok(tk1.n === tk0 + 1 && /T1200/.test(tk1.text), "7 the technique is linked on the risk's panel", tk1);
await H.go("risks-threats"); await clickRow("T1200");
ok(/A password on its own reaches WS-X90/.test((await sec("Risks that name it")).text), "7 and the technique now lists that risk");
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
ok(/Not ready.*A draft/.test(pk[0]) && /Ready.*Every result published/.test(pk[1]) && /without an owner/.test(pk[3]), "8 each part says ready or not from its record", pk);
await clickRow("Plan of action and milestones");
ok((await H.hash()) === "findings-poam" && (await chip("On the POA&M")) === poamN, "8 the POA&M part opens the same list", [await H.hash()]);
await H.go("authorization-conditions");
const c0 = await tabN("Conditions");
await H.click("Close", "#main .k3-table", { exact: true });
await p.fill("#k3f-how", "The twelve high items are closed or carry an approved plan; the POA&M review of Nov 17 records it."); await submit();
ok((await tabN("Conditions")) === c0 - 1 && (await rows()).some((r) => /Closed/.test(r)) && (await fact("conditions", "PRG-1090")).filter((c) => !c.closed).length === c0 - 1, "8 a condition closed in place lowers the count, here and in fact(conditions)", [c0, await tabN("Conditions")]);
await H.go("authorization-decisions");
ok((await rows()).length === 4 && (await rows()).filter((r) => /Record decision/.test(r)).length === 2, "8 Decisions lists the IATTs and ATOs; the two planned offer Record decision", await rows());
await H.click("Record decision", "#main .k3-table", { exact: true });
ok(/Gate|IATT/.test(await plabel() + (await panel()).slice(0, 200)), "8 Record decision opens the gate's panel over the page", [await plabel(), (await panel()).slice(0, 80)]);
await H.go("package-room");
ok((await H.hash()) === "authorization-sharing" && (await rows()).length === 7, "8 the Package room is Authorization's Sharing tab", [await H.hash(), (await rows()).length]);
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
for (const [from, to, nav] of FOLDS) { await H.go("overview", 250); await H.go(from, 500); const s = { from, hash: await H.hash(), nav: await navOn(), k3: await ev(() => !!document.querySelector("#main .k3e .k3-title")) }; if (s.hash !== to || s.nav !== nav || !s.k3) landed.push(s); }
ok(!landed.length, `9 ${FOLDS.length} folded addresses open their new home under the right menu entry`, landed);
await H.go("findings-vulns");
ok((await rail())[3].on && (await rows()).length === 4 && /CVE-2024-6387/.test((await rows()).join(" ")), "9 the Vulnerabilities address opens Findings on that source");
await H.go("assessment--chk-stig--findings");
ok((await rows()).length === 75 && (await tabN("Findings")) === 75, "9 a monitoring check's failures are findings on its page", [(await rows()).length, await tabN("Findings")]);
await H.go("assessment--chk-vuln");
await H.click("Record a run", "#main", { exact: true });
await p.selectOption("#k3f-result", "Passed"); await submit();
ok(/On schedule/.test(await H.txt("#main .k3-head")) && (await tabN("Runs")) === 3, "9 a run recorded on a check's page puts it back on schedule", [flat(await H.txt("#main .k3-head")).slice(0, 120), await tabN("Runs")]);

// ——— Widths ———
const ROUTES = ["findings", "findings-poam", "assessments", "assessment--exp", "assessment--exp--objectives", "assessment--chk-vuln", "assessment--cy-cvi", "risks", "risks-threats", "authorization", "authorization-conditions", "authorization-sharing"];
for (const width of [1440, 390]) { const off = []; await H.width(width); for (const r of ROUTES) { await H.go("overview", 200); await H.go(r, 450); const s = await ev(() => ({ side: document.documentElement.scrollWidth - document.documentElement.clientWidth, main: document.getElementById("main").scrollWidth - document.getElementById("main").clientWidth, nav: !!document.querySelector("#nav a.item.on"), k3: !!document.querySelector("#main .k3e") })); if (s.side > 0 || s.main > 1 || !s.nav || !s.k3) off.push(Object.assign({ r }, s)); } ok(!off.length, `${ROUTES.length} routes at ${width}: no sideways scroll, the menu entry marked`, off); }
await H.go("findings"); await ev(() => document.querySelector("#main .k3-table tbody tr").click()); await w(500);
ok(await ev(() => !!document.querySelector("#panel .k3-pn") && document.documentElement.scrollWidth <= 390), "the finding's panel opens at 390 without sideways scroll");
await H.width(1440);

// ——— 9b. A created program: its own registers, never WS-X90's ———
const wsxOpen = (await fact("findingCounts")).open;
const seen = await createSP70(H, { nss: true });
const other = {};
for (const r of ["findings", "assessments", "risks", "authorization", "authorization-conditions", "authorization-sharing", "risks-threats", "findings-poam"]) { await H.go(r, 500); other[r] = flat(await H.main()); }
const leak = Object.entries(other).filter(([, t]) => /WS-X90|Payload arm|Expanded control set|ACAS|R\. Calloway.*Sep 18|T1078|CVE-2024/.test(t)).map(([r]) => r);
ok((await H.cur()) === seen.code && !leak.length, "9 a created program's pages show none of WS-X90's records", [seen.code, leak]);
ok(/No finding yet/.test(other.findings) && /Add finding/.test(other.findings) && /No assessment yet/.test(other.assessments) && /Plan an assessment/.test(other.assessments) && /No risk yet/.test(other.risks) && /No decision yet/.test(other.authorization), "9 each is an empty register with its working Add", Object.fromEntries(Object.entries(other).map(([k, v]) => [k, v.slice(0, 90)])));
await H.go("findings"); await H.click("Add finding", "#main .k3-head", { exact: true });
await p.fill("#k3f-title", "Pod stores interface accepts an unsigned mission load"); await p.selectOption("#k3f-sev", "high"); await submit();
ok(/Pod stores interface/.test(await panel()), "9 Add finding works there and opens the finding");
await inPanel("Create plan"); await p.fill("#k3f-title", "Verify the mission load signature at the stores interface"); await submit();
await H.go("findings");
ok((await rows()).length === 1 && (await chip("On the POA&M")) === 1, "9 its plan puts it on that program's POA&M", [await rows(), await chip("On the POA&M")]);
await H.go("risks"); await H.click("Create risk", "#main .k3-head", { exact: true });
await p.fill("#k3f-title", "A tampered mission load reaches the weapon"); await p.selectOption("#k3f-resp", "mitigate"); await submit();
ok((await rows()).length === 1 && /A tampered mission load/.test((await rows())[0]), "9 Create risk works there", await rows());
await H.go("assessments"); await H.click("Plan an assessment", "#main .k3-head", { exact: true });
await p.fill("#k3f-name", "SP-70 initial control assessment"); await submit();
ok(/^assessment--asm-/.test(await H.hash()) && /SP-70 initial control assessment/.test(await H.txt("#main .k3-title")), "9 Plan an assessment works there and opens the assessment's page", await H.hash());
await ev(() => PA.v2hubs.setCur("PRG-1090")); await H.go("overview"); await H.go("findings", 700);
ok((await fact("findingCounts")).open === wsxOpen && !/Pod stores interface/.test(await H.main()), "9 back on WS-X90: its own findings, none of the other program's", [wsxOpen, (await fact("findingCounts")).open]);

// ——— V3 off ———
await ev(() => PA.v3.set(false)); await w(400); await H.go("findings", 600);
ok(!(await ev(() => !!document.querySelector("#main .k3e"))) && /Findings/.test(await H.main()), "V3 off: Findings is v2's page");
await H.go("risks-threats", 500);
ok(/Part of V3/.test(await H.main()), "V3 off: a page only V3 has says so");
} catch (e) { fails++; console.log("THREW:", String(e.message).split("\n").slice(0, 3).join(" | ")); }
console.log(`\n${n - fails} of ${n} passed`);
console.log("page errors", H.errs.slice(0, 8));
await H.b.close();
process.exit(fails || H.errs.length ? 1 : 0);
