// Drata round, lane F (drf-): checks and findings after Drata, what automated compliance finds. Recommendations 12, 15, 16, 17
// and 18, drawn with the Drata kit (PA.drk, D) over WS-X90's real checks, STIG checklists and findings. New routes only; no
// existing screen changes. Inert while V3 is off (D.route switches V3 on when one of these addresses is opened).
//
// Routes
//   dr-checks                  the checks register after: one toolbar row with saved views, Result, Findings, Source, Controls and
//                              State (Enabled, Draft, Unused, New); drafts run but are left out of the program's numbers (rec 15);
//                              Unused names the source that isn't connected (rec 17); Library among the list's actions
//   dr-check--<id>[--<tab>]    a check: the header, Track / Fix / Manage (rec 12), tabs Overview, Findings, Decisions, Controls,
//                              History; a draft shows Publish, and Edit on a published check opens a draft over it (rec 15);
//                              an exclusion is a signed decision with a reason and an end date, never a free Exclude.
//                              Version 24: Overview says what the check checks (a STIG's rules, else its rule in one line), and a
//                              failing row's eye opens the drawer (drf-res, walkable) with the STIG rule's check and fix text as
//                              mod-v8-dod holds them (read through its own rule preview, PA.P["v8g-rule"]), and Finding preview for
//                              V3's. Two more checks: ev-renewal (V3's 54-failing test; its failing resources are
//                              PA.drB.renewalCheck() when lane B is in the build, else V3's own numbers) and priv-review (never run;
//                              Run now reads the 18 privileged accounts of the quarterly review)
//   dr-library[--<id>]       the checks library: DISA STIGs, SCAP benchmarks, scanner policies, SBOM and review templates, In use
//                              and Not in use, Essential or Recommended, Add to program as Draft or Published; a template's page
//                              lists the checks using it, with Manage on each (rec 16)
//   dr-finding--<id>           a finding: Track (days open) / Fix (affected items) / Manage (milestones in progress) (rec 12), the
//                              routing rule and the one POA&M item it made (rec 18), and docked Notes, Tickets and Tasks (rec 24)
// Real: the STIG checklists, benchmarks, releases, imports and owners (mod-v8-dod), the recurring checks and their tests and the
// import history (mod-zzzz-v3-6work), the findings, plans and milestones (PA.v3e). Derived: see notes.json "derived" and the
// comment beside each rule. Session data (K.get/K.set under "dr.F."): pub { id: iso } · redraft { id: { at, by } } · dec [decision]
//   made [check] · items { fid: item } · join { fid: fid } · notes / tickets / tasks { fid: [entry] } · runs { id: [iso] } · ck · lib
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k, V = PA && PA.v2, D = PA && PA.drk;
  if (!V3 || !K || !V || !D) return;
  const SSP = PA.SSP, esc = K.esc, fmt = K.fmt;
  const CH = V.chain || {};
  const TODAY = "2026-11-17", ME = "Ingrid Solberg", ISSM = "Joel Barrantes", ISSO = "Priya Raghavan", SO = "Ray Colston", AO = CH.AO || "R. Calloway";
  const E = () => PA.v3e || null;
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
  const natural = (a, b) => collator.compare(String(a), String(b));
  const uniq = (a) => [...new Set(a.filter((x) => x != null && x !== ""))];
  const clip = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).replace(/[\s,;:.(]+\S*$/, "") + "…" : s; };
  const ms = (iso) => Date.parse(String(iso).slice(0, 10) + "T12:00:00Z");
  const addDays = (iso, n) => new Date(ms(iso) + n * 864e5).toISOString().slice(0, 10);
  const daysSince = (iso) => Math.max(0, Math.round((ms(TODAY) - ms(iso)) / 864e5));
  const md = (iso) => { if (!iso) return ""; const d = new Date(ms(iso)); return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getUTCFullYear() === 2026 ? undefined : "numeric", timeZone: "UTC" }); };
  const mdy = (iso) => (iso ? new Date(ms(iso)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "");
  const none = (label) => `<span class="k3-none"${label ? ` aria-label="${esc(label)}"` : ""}>—</span>`;
  const mu = (t) => `<span class="k3-muted">${esc(t)}</span>`;
  const warnW = (t) => `<span class="drf-warnw">${esc(t)}</span>`;
  const num = (n) => `<span class="num">${fmt(n)}</span>`;
  const get = (p, d) => { const v = K.get("dr.F." + p, d); return v == null ? d : v; };
  const set = (p, v) => K.set("dr.F." + p, v);
  const patchMap = (p, k, v) => { const o = Object.assign({}, get(p, {})); if (v === undefined) delete o[k]; else o[k] = v; set(p, o); };
  const pushMap = (p, k, item) => { const o = Object.assign({}, get(p, {})); o[k] = (o[k] || []).concat([item]); set(p, o); };
  const hash = (s) => { let x = 5381; for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) >>> 0; return x.toString(36); };

  // ——— Memo: one draw; anything written forgets it ———
  let MEMO = {};
  const memo = (k, fn) => (k in MEMO ? MEMO[k] : (MEMO[k] = fn()));
  V.on(() => { MEMO = {}; });
  window.addEventListener("hashchange", () => { MEMO = {}; });
  window.addEventListener("v3change", () => { MEMO = {}; });

  // ——— Controls ———
  const STW = { satisfied: "Satisfied", partially_satisfied: "Partially satisfied", other_than_satisfied: "Other than satisfied", not_assessed: "Not assessed", no_evidence: "No evidence", no_requirement: "No requirement" };
  const ctlRec = (code) => (SSP && SSP.ctl ? SSP.ctl(code) : null) || null;
  const inBase = (code) => !!ctlRec(code);
  const ctlKey = (code) => V3.fact("status", code) || (ctlRec(code) || {}).cs || "";
  const ctlTitle = (code) => (ctlRec(code) || {}).t || "";
  const ctlRoute = (code) => (typeof K.recRoute === "function" && K.recRoute("k3c-control", code)) || `control--${code}`;
  const ctlTone = (code) => D.tone(ctlKey(code));
  const ctlPill = (code) => { const k = ctlKey(code); return k ? K.status(STW[k] || k, k === "satisfied" ? "ok" : k === "other_than_satisfied" ? "bad" : k === "partially_satisfied" ? "part" : k === "not_assessed" ? "warn" : "none") : none(); };

  // ——— Components (V3's own records; lane S's page when it is in the build) ———
  const compName = (code) => { const c = V3.fact("component", code); return (c && c.name) || code || ""; };
  const compLink = (code) => (code && V3.fact("component", code) ? K.link(compName(code), "component--" + code) : esc(compName(code)) || none());

  // ════════════════ The library: templates (rec 16) ════════════════
  // DISA's STIGs as mod-v8-dod reads them (release, date, rule count, CCIs → SP 800-53 controls: CTL below, worked out from its
  // rules' CCIs through DISA's CCI list, then kept to WS-X90's baseline at draw time). The two Microsoft benchmarks are the ones
  // SCC also ran on the Maintenance Laptop, whose results the import keeps apart (the checklist's comment, Oct 20).
  const CTL = {
    rhel9: "AC-10 AC-11 AC-11(1) AC-12 AC-17(1) AC-17(2) AC-17(9) AC-18(1) AC-2(1) AC-2(2) AC-2(3) AC-2(4) AC-3 AC-3(4) AC-6(10) AC-6(8) AC-6(9) AC-7 AC-8 AU-12 AU-12(3) AU-14(1) AU-3 AU-3(1) AU-4 AU-4(1) AU-5 AU-5(1) AU-6(4) AU-7 AU-7(1) AU-8 AU-9 AU-9(3) CM-14 CM-3(5) CM-5(1) CM-5(6) CM-6 CM-7 CM-7(2) CM-7(5) CM-7(9) IA-2 IA-2(1) IA-2(12) IA-2(2) IA-2(5) IA-2(6) IA-2(8) IA-3 IA-5(1) IA-5(13) IA-5(2) IA-7 IA-8 MA-3(5) MA-4 MA-4(1) MA-4(6) MA-4(7) SC-10 SC-11 SC-13 SC-2 SC-24 SC-28 SC-28(1) SC-3 SC-4 SC-45(1) SC-5 SC-5(2) SC-8 SC-8(1) SC-8(2) SI-11 SI-16 SI-2(6) SI-6",
    swndm: "AC-10 AC-17(2) AC-2(4) AC-2(7) AC-4 AC-6(9) AC-7 AC-8 AU-10 AU-12 AU-3 AU-3(1) AU-4 AU-4(1) AU-5(2) AU-8 AU-9 CM-5(6) CM-6 CM-6(1) CM-7 CP-9 IA-2(8) IA-3(1) IA-5(1) MA-4(4) MA-4(6) SC-10 SC-17 SC-28(3) SC-45 SC-45(1) SC-45(2) SC-5 SI-2",
    swl2s: "CM-6 IA-3 IA-7 SC-47 SC-5 SC-5(2) SC-7(29)",
    rtndm: "AC-10 AC-17(2) AC-2(4) AC-2(7) AC-4 AC-6(9) AC-7 AC-8 AU-10 AU-12 AU-3 AU-3(1) AU-4 AU-4(1) AU-5(2) AU-8 AU-9 CM-5(6) CM-6 CM-6(1) CM-7 CP-9 IA-2(8) IA-3(1) IA-5(1) MA-4(4) MA-4(6) SC-10 SC-17 SC-28(3) SC-45 SC-45(1) SC-45(2)",
    rtrtr: "AC-4 AC-4(17) AC-4(8) AU-3 CM-6 IA-3 IA-7 SC-47 SC-5 SC-5(1) SC-5(2) SC-7 SC-7(11) SC-7(29) SC-7(5)",
    win11: "AC-11 AC-11(1) AC-12 AC-17(1) AC-17(2) AC-2(3) AC-2(4) AC-3 AC-3(4) AC-6(10) AC-6(9) AC-7 AC-8 AU-12 AU-12(3) AU-3 AU-3(1) AU-4 AU-9 CM-11(2) CM-5(1) CM-6 CM-7 CM-7(2) CM-7(5) IA-2(1) IA-3(1) IA-5(1) IA-5(2) IA-7 IA-8 MA-4 MA-4(6) SC-10 SC-13 SC-23(5) SC-28(1) SC-3 SC-4 SC-45(1) SC-5 SC-8 SC-8(1) SI-11 SI-16",
    asd: "AC-10 AC-12 AC-12(1) AC-12(2) AC-16 AC-17(2) AC-2 AC-2(1) AC-2(2) AC-2(3) AC-2(4) AC-23 AC-3 AC-3(4) AC-4 AC-6(10) AC-6(4) AC-6(8) AC-6(9) AC-7 AC-8 AC-9 AT-3(3) AU-10 AU-11 AU-12 AU-12(1) AU-14(1) AU-3 AU-3(1) AU-4(1) AU-5 AU-5(1) AU-5(2) AU-6 AU-6(4) AU-7 AU-7(1) AU-8 AU-9 AU-9(2) AU-9(3) CA-2(2) CM-11(2) CM-14 CM-4(2) CM-5 CM-5(1) CM-5(6) CM-6 CM-7 CM-7(2) CM-7(3) CM-7(5) CM-9 CP-11 CP-2 CP-2(8) CP-9 IA-2 IA-2(1) IA-2(12) IA-2(2) IA-2(5) IA-2(8) IA-3 IA-3(1) IA-5 IA-5(1) IA-5(13) IA-5(2) IA-5(6) IA-6 IA-7 IA-8 IA-8(1) IA-8(2) IA-8(4) MA-4 MA-4(1) MA-4(6) MA-4(7) MP-3 PM-14 SA-10 SA-10(1) SA-11 SA-11(2) SA-11(4) SA-15 SA-15(10) SA-15(5) SA-22 SA-4(5) SA-5 SC-10 SC-11 SC-13 SC-18(1) SC-18(2) SC-2 SC-23 SC-23(1) SC-23(3) SC-23(5) SC-24 SC-28 SC-28(1) SC-28(2) SC-3 SC-39 SC-4 SC-5 SC-5(1) SC-5(2) SC-7(13) SC-8 SC-8(1) SC-8(2) SI-10 SI-10(3) SI-11 SI-16 SI-2 SI-2(6) SI-4(12) SI-5 SI-6",
  };
  const KIND = { stig: "DISA STIG", scap: "SCAP benchmark", scan: "Scanner policy", sbom: "SBOM check", review: "Program review", records: "Program records" };
  const RATE = { essential: "Essential", recommended: "Recommended" };
  const TPL = [
    { id: "rhel9-v2r9", kind: "stig", short: "RHEL 9", name: "Red Hat Enterprise Linux 9 STIG", ver: "V2R9", date: "2026-07-01", by: "DISA", rules: 445, cats: [28, 402, 15], bm: "rhel9", rating: "essential", what: "Operating system rules for RHEL 9 hosts, answered in STIG Viewer or Evaluate-STIG." },
    { id: "rhel9-v2r10", kind: "stig", short: "RHEL 9", name: "Red Hat Enterprise Linux 9 STIG", ver: "V2R10", date: "2026-09-30", by: "DISA", rules: 445, cats: [29, 401, 15], bm: "rhel9", rating: "essential", what: "DISA's October release: two rules added, others retitled; answers to unchanged rules carry over." },
    { id: "asd-v6r5", kind: "stig", short: "ASD", name: "Application Security and Development STIG", ver: "V6R5", date: "2026-09-30", by: "DISA", rules: 286, cats: [34, 230, 22], bm: "asd", rating: "essential", what: "Rules for the mission software, answered against its code and build." },
    { id: "swndm-v3r6", kind: "stig", short: "Cisco IOS Switch NDM", name: "Cisco IOS Switch NDM STIG", ver: "V3R6", date: "2026-01-05", by: "DISA", rules: 43, cats: [8, 35, 0], bm: "swndm", rating: "essential", what: "Network device management rules for Cisco IOS switches." },
    { id: "swndm-v3r7", kind: "stig", short: "Cisco IOS Switch NDM", name: "Cisco IOS Switch NDM STIG", ver: "V3R7", date: "2026-04-01", by: "DISA", rules: 43, cats: [8, 35, 0], bm: "swndm", rating: "recommended", what: "Rewrites fix text only, so answers carry over from V3R6." },
    { id: "swl2s-v3r1", kind: "stig", short: "Cisco IOS Switch L2S", name: "Cisco IOS Switch L2S STIG", ver: "V3R1", date: "2024-07-24", by: "DISA", rules: 22, cats: [1, 17, 4], bm: "swl2s", rating: "essential", what: "Layer 2 switching rules for Cisco IOS switches." },
    { id: "rtndm-v3r7", kind: "stig", short: "Cisco IOS XE Router NDM", name: "Cisco IOS XE Router NDM STIG", ver: "V3R7", date: "2026-04-01", by: "DISA", rules: 42, cats: [8, 34, 0], bm: "rtndm", rating: "essential", what: "Network device management rules for Cisco IOS XE routers." },
    { id: "rtrtr-v3r5", kind: "stig", short: "Cisco IOS XE Router RTR", name: "Cisco IOS XE Router RTR STIG", ver: "V3R5", date: "2025-10-01", by: "DISA", rules: 97, cats: [10, 58, 29], bm: "rtrtr", rating: "essential", what: "Routing rules for Cisco IOS XE routers." },
    { id: "win11-v2r9", kind: "scap", short: "Windows 11", name: "Microsoft Windows 11 STIG benchmark", ver: "V2R9", date: "2026-08-10", by: "DISA", rules: 257, cats: [27, 214, 16], bm: "win11", rating: "essential", what: "The SCAP benchmark SCC runs on Windows 11, read as XCCDF results." },
    { id: "defender", kind: "scap", name: "Microsoft Defender Antivirus STIG benchmark", by: "DISA", rating: "recommended", ctl: ["SI-3", "SI-3(1)"], what: "SCC runs it beside Windows 11; the laptop's import keeps its results apart." },
    { id: "edge", kind: "scap", name: "Microsoft Edge STIG benchmark", by: "DISA", rating: "recommended", ctl: ["CM-6", "SC-8"], what: "SCC runs it beside Windows 11; the laptop's import keeps its results apart." },
    { id: "acas-freq", kind: "scan", name: "Vulnerability scans run at RA-5's frequency", by: "ACAS / Tenable.sc", rating: "essential", ctl: ["RA-5"], what: "Every host in the boundary has an applied scan inside RA-5's scan frequency (30 days)." },
    { id: "acas-iava", kind: "scan", name: "IAVA and IAVB patches inside their windows", by: "ACAS / Tenable.sc", rating: "essential", ctl: ["SI-2", "RA-5"], what: "Each IAVA or IAVB a scan reports is patched inside the window DISA gave it." },
    { id: "nessus-host", kind: "scan", name: "Vulnerability scan of one host", by: "Nessus", rating: "recommended", ctl: ["RA-5"], what: "A credentialed Nessus scan of a host outside ACAS's repository.", rule: "The host has a credentialed scan inside RA-5's scan frequency (30 days)." },
    { id: "sarif", kind: "scan", name: "Container images free of known CVEs", by: "Static analysis (SARIF)", rating: "recommended", ctl: ["RA-5", "SI-2"], what: "Each image's SARIF report holds no known CVE above Low." },
    { id: "sbom-affected", kind: "sbom", name: "No known-affected component in use", by: "SBOM feeds", rating: "essential", ctl: ["RA-5", "SI-2"], what: "No component an SBOM lists is affected by a known CVE in the version in use." },
    { id: "poam-review", kind: "review", name: "POA&M reviewed every month", by: "Program", rating: "essential", ctl: ["CA-5"], what: "The ISSO reviews every open POA&M item and its milestones each month." },
    { id: "audit-review", kind: "review", name: "Audit records reviewed and reported", by: "Audit log collection", rating: "recommended", ctl: ["AU-6"], what: "A sample of audit records is reviewed weekly and anything unusual reported." },
    // Version 24: V3's two monitoring checks the round left out (Continuous monitoring's "expiring" and "par").
    { id: "evidence-renewal", kind: "records", name: "Evidence renewed before it expires", by: "Program evidence", rating: "essential", ctl: ["CA-7"], what: "Reads each evidence item's renewal date every day; the date follows its controls' assessment frequency.", rule: "Each evidence item is renewed before its renewal date; one past it, or inside its upcoming window, fails." },
    { id: "priv-review", kind: "review", name: "Privileged accounts reviewed each quarter", by: "Corporate identity provider", rating: "essential", ctl: ["AC-2", "AC-6"], what: "Reads the privileged accounts the Corporate identity provider holds for WS-X90 (IDP-CAP-ACCOUNTS) against the quarter's review.", rule: "Every privileged account has a named owner, and none marked for removal is still active." },
  ];
  const tplBy = (id) => TPL.find((t) => t.id === id) || null;
  const tplName = (t) => (t ? `${t.name}${t.ver ? " " + t.ver : ""}` : "");
  const tplCtls = (t) => (t ? (t.bm ? CTL[t.bm].split(" ") : t.ctl || []) : []);
  const ruleLine = (t) => (t ? t.rule || t.what || "" : "");

  // ════════════════ The checks ════════════════
  // The STIG checklists are mod-v8-dod's (assets, benchmarks, tools, owners, imports); a checklist's failing resources are its open
  // rules, the very findings V3 lists under Findings › STIG rules. The tests are V3's recurring checks' (Continuous monitoring).
  // runs: the imports V3 records for the source (its "Evidence › Sources" history), each [day, failing, what it read, result].
  const STIGCK = [
    { id: "rhel9-mc", tpl: "rhel9-v2r9", slug: "mission-computer-rhel9", comp: "CN-109101", src: "DISA STIG checklist — mission computing (RHEL 9)", tool: "STIG Viewer 2.18", owner: ISSM, added: "2026-07-13", runs: [["2026-07-13", 41, "LRU-001_RHEL_9_STIG_V2R8.ckl · 398 rules answered"], ["2026-10-13", null, "disa-stig-checklist-mission-computing-rhel-9.ckl · 412 rules"]] },
    { id: "asd-mc", tpl: "asd-v6r5", slug: "mission-computer-asd", comp: "CN-109101", src: "DISA STIG checklist — mission software (ASD)", tool: "STIG Viewer 3.6", owner: ME, added: "2026-11-04", runs: [["2026-11-04", null, "LRU-001_mission-software_ASD_V6R5.cklb · 286 rules"]] },
    { id: "swndm", tpl: "swndm-v3r6", slug: "ethernet-switch-ndm", comp: "CN-109109", src: "DISA STIG checklist — internal Ethernet switch", tool: "STIG Viewer 2.18", owner: ISSO, added: "2026-05-12", runs: [["2026-08-18", null, "LRU-009_Cisco_IOS_Switch_NDM_V3R6.ckl · 43 rules"]] },
    { id: "swl2s", tpl: "swl2s-v3r1", slug: "ethernet-switch-l2s", comp: "CN-109109", src: "DISA STIG checklist — internal Ethernet switch", tool: "STIG Viewer 2.18", owner: ISSO, added: "2026-05-12", runs: [["2026-08-18", null, "LRU-009_Cisco_IOS_Switch_L2S_V3R1.ckl · 22 rules"]] },
    { id: "rtndm", tpl: "rtndm-v3r7", slug: "network-gateway-ndm", comp: "CN-109107", src: "Evaluate-STIG run — protected network gateway", tool: "Evaluate-STIG 1.2508.1", owner: ISSM, added: "2026-06-30", auto: true, runs: [["2026-09-30", null, "LRU-007_Cisco_IOS-XE_Router_NDM_V3R7.cklb · 42 rules"]] },
    { id: "rtrtr", tpl: "rtrtr-v3r5", slug: "network-gateway-rtr", comp: "CN-109107", src: "Evaluate-STIG run — protected network gateway", tool: "Evaluate-STIG 1.2508.1", owner: ISSM, added: "2026-06-30", auto: true, runs: [["2026-09-30", null, "LRU-007_Cisco_IOS-XE_Router_RTR_V3R5.cklb · 97 rules"]] },
    { id: "win11-lt", tpl: "win11-v2r9", slug: "maintenance-laptop-win11", comp: "CN-109119", src: "SCAP compliance scan — maintenance laptop (Windows 11)", tool: "SCC 5.10.1", owner: ISSM, added: "2026-09-14", runs: [["2026-09-14", 29, "286 results: 251 pass, 29 fail"], ["2026-10-02", "error", "LRU-019_win11_scc-arf.xml · rejected: an ARF report, not XCCDF results"], ["2026-10-14", null, "286 results: 259 pass, 21 fail · score 90.6%"]] },
  ];
  // Checks that read a scanner, an SBOM or a review. Their failing resources are the findings or the gaps V3 already holds:
  // IAVA/IAVB → the open CVEs that carry an IAVA or IAVB; the SBOM check → CVE-2024-6387 while the Mission Computer runs version 1;
  // RA-5's frequency → the two scans past 30 days (ACAS's applied scan of Oct 10, the gateway's Nessus scan cancelled Sep 28).
  const TESTCK = [
    { id: "acas-freq", tpl: "acas-freq", name: "Vulnerability scans run at RA-5's frequency", comp: "CN-109000", src: "ACAS vulnerability scan — mission network", tool: "ACAS / Tenable.sc", owner: ISSM, added: "2026-03-10", runs: [["2026-10-10", 2, "ACAS, October · 1,284 results across 26 hosts"], ["2026-11-12", "running", "ACAS, November · importing since Nov 12, 02:15 UTC"]] },
    { id: "acas-iava", tpl: "acas-iava", name: "IAVA and IAVB patches inside their windows", comp: "CN-109000", src: "ACAS vulnerability scan — mission network", tool: "ACAS / Tenable.sc", owner: ISSM, added: "2026-03-10", runs: [["2026-10-10", null, "ACAS, October · 1,284 results across 26 hosts"]] },
    { id: "sbom-mc", tpl: "sbom-affected", name: "No known-affected component · Mission Computer image", comp: "CN-109101", src: "Mission Computer maintenance image SBOM", tool: "SBOM feeds", owner: ME, added: "2026-10-08", runs: [["2026-10-08", 1, "SBOM, version 1 · 13 components, 1 affected by CVE-2024-6387"], ["2026-11-12", null, "SBOM, version 2 · 13 components, 0 affected; version 1 still in use"]] },
    { id: "poam-rev", tpl: "poam-review", name: "POA&M reviewed every month", comp: "CN-109000", src: "POA&M review (Priya Raghavan)", tool: "Program review", owner: ISSO, added: "2026-01-14", runs: [["2026-09-14", 0, "September review recorded"], ["2026-10-14", 0, "October review recorded"]] },
    { id: "sarif-tel", tpl: "sarif", name: "Container images free of known CVEs · telemetry services", comp: "CN-109112", src: "Container image scan — telemetry services", tool: "Static analysis (SARIF)", owner: ISSM, added: "2026-10-30", runs: [["2026-10-30", "error", "SARIF 2.1.0 validation failed at runs[0].results[17]"]], error: "The last import failed SARIF 2.1.0 validation at runs[0].results[17], so the check reads nothing until the file is fixed." },
  ];
  // Unused (rec 17): WS-X90's baseline selects the control, the template answers it, and its source is not connected.
  const UNUSED = [
    { id: "nessus-gw", tpl: "nessus-host", name: "Vulnerability scan · Maintenance Access Gateway", comp: "CN-109114", src: "Nessus scan — maintenance access gateway", tool: "Nessus", owner: ISSM, added: "2026-06-28", why: "Retired Sep 28: superseded by adversarial testing" },
    { id: "audit-logs", tpl: "audit-review", name: "Audit records reviewed and reported", comp: "CN-109118", src: "Audit log collection", tool: "Security Log Collector", owner: "Nadia Fournier", added: "2026-11-02", why: "Never connected" },
  ];
  // The draft (rec 15): DISA published RHEL 9 V2R10 on Sep 30; Joel Barrantes added it as a draft beside V2R9 (derived: on Nov 10),
  // where it runs against the Oct 13 checklist's answers. Publishing it replaces the V2R9 check.
  const DRAFT0 = { id: "rhel9-v2r10", tpl: "rhel9-v2r10", slug: "mission-computer-rhel9", comp: "CN-109101", src: "DISA STIG checklist — mission computing (RHEL 9)", tool: "STIG Viewer 2.18", owner: ISSM, added: "2026-11-10", by: ISSM, draft: true, replaces: "rhel9-mc", runs: [["2026-11-10", null, "Oct 13 checklist's answers, read against V2R10"]] };

  // Version 24: V3's own monitoring checks "expiring" and "par" (mod-zzzz-v3-6work's CHECKS), each as a check here.
  // ev-renewal: V3 says it runs daily (last run today), names no owner, and fails 54 of 368 versions inside 90 days. Its failing
  // resources are lane B's evidence owed (PA.drB.renewalCheck(): past renewal or inside the upcoming window, with the session's
  // renewals applied), so renewing on lane B's screens lowers the count; without lane B, V3's own numbers and four listed items.
  // priv-review: V3 records no run (last: null). Run now reads the 18 privileged accounts of the quarterly review (mod-after-people,
  // its account lines marked Example there): two have no owner and are marked for removal but still active, which fails the rule.
  const NEWCK = [
    { id: "ev-renewal", tpl: "evidence-renewal", name: "Evidence renewed before it expires", comp: "CN-109000", src: "Evidence register · renewal dates", tool: "Program evidence", owner: null, added: "2026-10-01", shape: "evidence", runs: [] },
    { id: "priv-review", tpl: "priv-review", name: "Privileged accounts reviewed each quarter", comp: "CN-109005", src: "Corporate identity provider · account lifecycle (IDP-CAP-ACCOUNTS)", tool: "Corporate identity provider", owner: "Victor Amsel", added: "2026-11-07", shape: "account", never: true, runs: [] },
  ];
  const V3RENEW = { total: 368, n: 54, first: "2027-02-01", window: 90, items: [["Evidence for REQ-001, dataset · accepted", "2027-02-01"], ["Evidence for REQ-113, dataset · accepted", "2027-02-01"], ["Evidence for REQ-002, test record · Wes Duarte", "2027-02-02"], ["Evidence for REQ-058, test record · Victor Amsel", "2027-02-02"]] };
  const renewal = () => memo("renewal", () => {
    const B = PA.drB;
    if (B && typeof B.renewalCheck === "function") { try { const r = B.renewalCheck(); if (r && Array.isArray(r.failing)) return { live: true, total: r.total || 0, failing: r.failing, more: 0 }; } catch (e) { console.error(e); } }
    return { live: false, total: V3RENEW.total, failing: V3RENEW.items.map(([title, expires], i) => ({ id: "v3-exp-" + (i + 1), title, expires, state: "Upcoming renewal" })), more: V3RENEW.n - V3RENEW.items.length };
  });
  const PMC = "CN-109113", MAG = "CN-109114";
  // [account, component, owner, decision in the Q4 review (keep | revoke | null: not decided), still active]
  const ACCTS = [["svc-maint-07", PMC, null, "revoke", true], ["j.barrantes-adm", MAG, ISSM, "keep"], ["p.raghavan-adm", PMC, ISSO, "keep"], ["field-tech-03", MAG, null, "revoke", true], ["w.duarte-adm", PMC, "Wes Duarte", null],
    ["r.colston-adm", PMC, SO, "keep"], ["n.fournier-adm", MAG, "Nadia Fournier", "keep"], ["i.solberg-adm", PMC, ME, "keep"], ["svc-backup-02", PMC, ISSM, "keep"], ["svc-logship-01", MAG, ISSM, "keep"], ["a.bell-adm", MAG, "Amara Bell", "keep"],
    ["svc-update-04", PMC, ISSO, "keep"], ["field-tech-01", MAG, SO, null], ["field-tech-02", MAG, SO, null], ["svc-diag-05", PMC, ISSM, null], ["v.amsel-adm", PMC, "Victor Amsel", null], ["svc-maint-03", MAG, ISSO, null], ["ldev-adm", PMC, "Local developer", null]]
    .map(([id, comp, owner, dec, active]) => ({ id, comp, owner, dec, active: !!active }));
  const acctFails = (a) => !a.owner || (a.dec === "revoke" && a.active);
  const acctWhy = (a) => [!a.owner ? "No owner" : "", a.dec === "revoke" && a.active ? "marked for removal, still active" : ""].filter(Boolean).join(" · ");
  const REVIEW_DUE = "2026-12-01";

  const SEV = { critical: ["Critical", "bad", 4], high: ["High", "bad", 3], moderate: ["Moderate", "warn", 2], low: ["Low", "none", 1] };
  const sevOf = (f) => (f && f.cat ? `${f.cat} · ${(SEV[f.sev] || ["", ""])[0]}` : (SEV[f && f.sev] || ["—"])[0]);
  const sevPill = (f) => (f && f.sev ? K.status(f.cat || SEV[f.sev][0], SEV[f.sev][1]) : none());
  const findingsAll = () => memo("fall", () => { const e = E(); try { return e ? e.findings() : []; } catch (x) { return []; } });
  const isOpenF = (f) => f && (f.state === "open" || f.state === "draft");
  const fById = (id) => { const e = E(); return e ? e.findingById(id) : null; };
  // A STIG rule's own text (version 24): mod-v8-dod holds DISA's check, fix and discussion text for the open rules and draws them in
  // its rule preview (PA.P["v8g-rule"], id "<checklist>|<rule>"); read from there, never changed. That preview falls back to the
  // checklist's first rule for an id it does not know, so the Vuln ID must match. → { stigId, check, fix, disc } or null.
  const ruleText = (fid) => memo("rt:" + fid, () => {
    const m = /^stig:([^|]+)\|(\d+)$/.exec(String(fid || "")), P = PA.P && PA.P["v8g-rule"];
    if (!m || typeof P !== "function" || typeof DOMParser === "undefined") return null;
    let html = ""; try { html = ((P(m[1] + "|" + m[2]) || {}).body) || ""; } catch (e) { return null; }
    const doc = new DOMParser().parseFromString(html, "text/html");
    const fact = (l) => { const d = [...doc.querySelectorAll(".ak-facts > div")].find((x) => ((x.querySelector("dt") || {}).textContent || "").trim() === l); return d ? (d.querySelector("dd") || {}).textContent.trim() : ""; };
    if (fact("Vuln ID") !== "V-" + m[2]) return null;
    const sec = (t) => { const s = [...doc.querySelectorAll("section.ak-sec")].find((x) => { const h = x.querySelector(".ak-sec-h h3"); return h && h.firstChild && String(h.firstChild.textContent).trim() === t; }); const b = s && s.querySelector("pre, p"); return b ? b.textContent : ""; };
    const clean = (s) => String(s || "").replace(/<\/?check-content>/g, "").replace(/\n{3,}/g, "\n\n").trim();
    const out = { stigId: fact("STIG ID") === "Not shown" ? "" : fact("STIG ID"), check: clean(sec("Check text")), fix: clean(sec("Fix text")), disc: clean(sec("Discussion")) };
    return out.check || out.fix ? out : null;
  });
  // A failing resource's one mark: a finding's severity, an evidence item's renewal state, an account's problem.
  const markOf = (r) => (r.acct ? warnW(r.acct.owner ? "Still active" : "No owner") : r.expires !== undefined ? K.status(r.past ? "Needs renewal" : "Upcoming renewal", r.past ? "bad" : "none") : sevPill(r));

  // A check's resources: [{ key, fid, title, sev, cat, comp, ctl, finding }] (fid: the finding it is, when V3 holds one).
  function resourcesOf(c) {
    return memo("res:" + c.id, () => {
      const L = findingsAll();
      if (c.slug) return L.filter((f) => isOpenF(f) && String(f.id).indexOf("stig:" + c.slug + "|") === 0).map((f) => ({ key: f.id, fid: f.id, title: f.title, sev: f.sev, cat: f.cat || (f.stig && f.stig.cat), comp: f.components[0] || c.comp, ctl: f.control, f }))
        .sort((a, b) => (SEV[b.sev] || [0, 0, 0])[2] - (SEV[a.sev] || [0, 0, 0])[2] || natural(a.title, b.title));
      if (c.id === "acas-iava") return L.filter((f) => isOpenF(f) && f.kind === "vuln" && f.cve && f.cve.iava).map((f) => ({ key: f.id, fid: f.id, title: f.title, sev: f.sev, cat: f.cve.iava.split(" ")[0], comp: f.components[0] || "", ctl: f.control || "SI-2", f }));
      if (c.id === "sbom-mc") return L.filter((f) => isOpenF(f) && f.kind === "vuln" && f.cve && f.cve.cve === "CVE-2024-6387").map((f) => ({ key: f.id, fid: f.id, title: f.title, sev: f.sev, comp: f.components[0] || c.comp, ctl: f.control || "SI-2", f }));
      if (c.id === "acas-freq") return [
        { key: "scan:acas", title: "Mission network hosts: last applied scan Oct 10, 38 days", sev: "moderate", comp: "CN-109000", ctl: "RA-5" },
        { key: "scan:gw", title: "Maintenance Access Gateway: no scan since Sep 28", sev: "moderate", comp: "CN-109114", ctl: "RA-5" }];
      if (c.id === "ev-renewal") return renewal().failing.map((e) => ({ key: "ev:" + e.id, title: e.title, expires: e.expires || "", past: !!e.expires && e.expires < TODAY, state: e.state || (e.expires && e.expires < TODAY ? "Needs renewal" : "Upcoming renewal"), comp: c.comp, ctl: "CA-7", route: renewal().live ? e.route || `dr-evidence--${e.id}` : "" }))
        .sort((a, b) => String(a.expires).localeCompare(String(b.expires)) || natural(a.title, b.title));
      if (c.id === "priv-review") return c.runs.length ? ACCTS.filter(acctFails).map((a) => ({ key: "acct:" + a.id, title: a.id, acct: a, why: acctWhy(a), comp: a.comp, ctl: "AC-2", route: "people-access" })) : [];
      return [];
    });
  }
  const decisions = () => get("dec", []);
  const activeDec = (c, key) => decisions().find((d) => d.check === c.id && d.key === key && d.ends >= TODAY) || null;

  function checks() {
    return memo("checks", () => {
      const pub = get("pub", {}), redraft = get("redraft", {}), made = get("made", []);
      const out = [];
      const mk = (base, kind) => {
        const t = tplBy(base.tpl), c = Object.assign({ kind }, base);
        c.t = t; c.name = base.name || (t && t.short ? `${t.short} ${t.ver} STIG · ${compName(base.comp)}` : `${tplName(t)} · ${compName(base.comp)}`);
        c.ctls = uniq(tplCtls(t)).filter(inBase).sort(natural);
        const nowRead = base.id === "priv-review" ? `${plural(ACCTS.length, "privileged account")} read · ${fmt(ACCTS.filter((a) => a.dec).length)} decided, ${fmt(ACCTS.filter((a) => !a.dec).length)} to decide by ${md(REVIEW_DUE)}` : "Run now from this page";
        const own = base.id === "ev-renewal" ? [[TODAY, null, `${plural(renewal().total, "evidence item")} with a renewal date${renewal().live ? "" : " · V3's own count"}`]] : base.runs || [];
        c.runs = own.concat((get("runs", {})[base.id] || []).map((at) => [at, null, nowRead]));
        c.shape = base.shape || "finding";
        c.published = pub[base.id] || null;
        c.state = base.unused ? "unused" : base.draft && !c.published ? "draft" : c.published || daysSince(base.added) <= 30 ? "new" : "enabled";
        c.redraft = redraft[base.id] || null;
        c.owner = get("own", {})[base.id] || base.owner;
        return c;
      };
      STIGCK.forEach((x) => out.push(mk(x, "stig")));
      out.push(mk(DRAFT0, "stig"));
      TESTCK.forEach((x) => out.push(mk(x, "test")));
      NEWCK.forEach((x) => out.push(mk(x, "test")));
      UNUSED.forEach((x) => out.push(mk(Object.assign({ unused: true, runs: [] }, x), "unused")));
      made.forEach((m) => out.push(mk(Object.assign({ runs: [] }, m, { draft: m.status === "draft" }), "made")));
      const by = new Map(out.map((c) => [c.id, c]));
      // A published draft that replaces another check: the old one stops counting.
      out.forEach((c) => { if (c.replaces && c.published && by.get(c.replaces)) by.get(c.replaces).state = "replaced"; });
      out.forEach((c) => {
        const res = c.state === "unused" || c.kind === "made" && !c.slug ? [] : resourcesOf(c);
        c.res = res; c.failing = res.filter((r) => !activeDec(c, r.key)); c.decided = res.length - c.failing.length;
        c.error = c.error || null;
        const last = c.runs.filter((r) => r[1] !== "running").slice(-1)[0];
        c.last = last ? last[0] : "";
        // more: failing resources V3 counts but does not list (ev-renewal without lane B: V3 lists 4 of its 54).
        c.more = c.id === "ev-renewal" ? renewal().more : 0;
        c.result = c.state === "unused" ? "" : (c.kind === "made" || c.never) && !c.runs.length && !c.slug ? "" : c.error && last && last[1] === "error" ? "error" : c.failing.length + c.more ? "failed" : "passed";
        c.counts = c.state !== "draft" && c.state !== "unused" && c.state !== "replaced";
        // Days failing: from the first run of the unbroken run of failing results that ends at the last one (an error breaks nothing).
        let since = "";
        if (c.result === "failed") { for (let i = c.runs.length - 1; i >= 0; i--) { const r = c.runs[i]; if (r[1] === "running" || r[1] === "error") continue; if (r[1] === 0) break; since = r[0]; } }
        // ev-renewal runs daily and V3 keeps only its last run: it has failed since the first item went past its renewal date (lane B),
        // or since the first of V3's items entered its 90-day window (Feb 1 less 90 days), and never before it was added.
        if (c.id === "ev-renewal" && c.result === "failed") { const past = c.failing.filter((r) => r.past).map((r) => r.expires).sort()[0]; const s = past || (renewal().live ? TODAY : addDays(V3RENEW.first, -V3RENEW.window)); since = s < c.added ? c.added : s; }
        c.since = since || c.last;
        c.items = itemsOfCheck(c);
      });
      const rank = { error: 0, failed: 1, passed: 2, "": 3 }, srank = { draft: 0, new: 1, enabled: 2, unused: 3, replaced: 4 };
      out.sort((a, b) => (b.kind === "made") - (a.kind === "made") || rank[a.result] - rank[b.result] || srank[a.state] - srank[b.state] || failN(b) - failN(a) || natural(a.name, b.name));
      return out;
    });
  }
  const failN = (c) => c.failing.length + (c.more || 0);
  const checkBy = (id) => checks().find((c) => c.id === id) || null;
  const chkRoute = (c, tab) => `dr-check--${c.id}${tab && tab !== "overview" ? "--" + tab : ""}`;
  const RES = { passed: ["Passed", "ok"], failed: ["Failed", "bad"], error: ["Error", "warn"] };
  const resPill = (c) => (c.result ? K.status(RES[c.result][0], RES[c.result][1]) : none("No result"));
  const STATE = { enabled: "Enabled", draft: "Draft", unused: "Unused", new: "New", replaced: "Replaced" };
  const stateCell = (c) => c.state === "draft" ? `<span class="drf-draft">Draft</span> ${mu("· Doesn't count yet")}` : c.state === "unused" ? `<span class="drf-unused">Unused</span>` : c.state === "new" ? `<span class="drf-new">New</span>` : c.state === "replaced" ? mu("Replaced") : `${esc(STATE[c.state])}${c.redraft ? " " + mu("· draft open") : ""}`;
  const srcCell = (c) => (c.kind === "made" && !c.runs.length ? `<span class="drf-src">${esc(c.tool)}</span> ${mu("· not imported yet")}` : c.state === "unused" ? `<span class="drf-src" title="${esc(c.src)} · ${esc(c.why || "")}">${esc(clip(c.src, 40))}</span> ${warnW("Not connected")}` : `<span class="drf-src" title="${esc(c.src)}">${esc(c.tool)}</span>`);

  // ——— POA&M items: the plans V3 holds for the check's findings, and those made here (rec 18) ———
  const planOf = (f) => { const e = E(); if (!e || !f) return null; try { return e.planOfFinding(f); } catch (x) { return null; } };
  function itemOf(fid) {
    const mine = get("items", {})[fid]; if (mine) return Object.assign({ mine: true, fid }, mine);
    const j = get("join", {})[fid]; if (j) { const it = itemOf(j); return it ? Object.assign({ joined: true }, it) : null; }
    const f = fById(fid), p = planOf(f); if (!p) return null;
    return { id: p.id, title: p.title, owner: (f && f.owner) || "", status: p.status, reached: p.reached, total: p.total, ms: p.ms, planned: p.planned, late: p.late, v3: true };
  }
  function itemsOfCheck(c) {
    const m = new Map();
    for (const r of c.res) { if (!r.fid) continue; const it = itemOf(r.fid); if (it && it.status !== "completed") m.set(it.id, it); }
    return [...m.values()];
  }

  // ════════════════ 1. The register (dr-checks) ════════════════
  const view = () => Object.assign({ q: "", result: "", state: "", kind: "" }, get("ck", {}) || {});
  const setView = (ch) => set("ck", Object.assign({}, view(), ch));
  ["q", "result", "state", "kind"].forEach((k) => K.on("drf.ck." + k, (v) => { setView({ [k]: v || "" }); K.redraw(); }));
  K.on("drf.ck.clear", () => { set("ck", {}); K.redraw(); });
  const KINDOF = (c) => (c.t ? c.t.kind : "stig");
  const ask = (v) => {
    const q = String(v.q || "").trim().toLowerCase();
    return checks().filter((c) => (!v.result || c.result === v.result || (v.result === "none" && !c.result)) && (!v.state || c.state === v.state) && (!v.kind || KINDOF(c) === v.kind) && (!q || `${c.name} ${c.src} ${c.tool} ${c.ctls.join(" ")}`.toLowerCase().includes(q)));
  };
  K.on("drf.ck.export", () => K.toast(`${plural(checks().length, "check")} exported as CSV with result, findings, source, controls and state`));

  function registerPage() {
    const v = view(), all = checks(), rows = ask(v);
    const cnt = (fn) => all.filter(fn).length;
    const counted = all.filter((c) => c.counts);
    const drafts = all.filter((c) => c.state === "draft");
    const tiles = [
      { label: "Failed", n: counted.filter((c) => c.result === "failed").length, problem: true, act: () => { setView({ result: v.result === "failed" ? "" : "failed" }); K.redraw(); } },
      { label: "Error", n: counted.filter((c) => c.result === "error").length, problem: true, act: () => { setView({ result: v.result === "error" ? "" : "error" }); K.redraw(); } },
      { label: "Passed", n: counted.filter((c) => c.result === "passed").length, act: () => { setView({ result: v.result === "passed" ? "" : "passed" }); K.redraw(); } },
      { label: "Unused", n: cnt((c) => c.state === "unused"), problem: true, act: () => { setView({ state: v.state === "unused" ? "" : "unused" }); K.redraw(); } },
    ].filter((t) => t.n);
    const filters = [
      { label: "Result", key: "result", value: v.result, act: "drf.ck.result", options: [["failed", "Failed", cnt((c) => c.result === "failed")], ["error", "Error", cnt((c) => c.result === "error")], ["passed", "Passed", cnt((c) => c.result === "passed")], ["none", "No result", cnt((c) => !c.result)]].filter((o) => o[2]) },
      { label: "State", key: "state", value: v.state, act: "drf.ck.state", options: Object.keys(STATE).map((k) => [k, STATE[k], cnt((c) => c.state === k)]).filter((o) => o[2]) },
      { label: "Kind", key: "kind", value: v.kind, act: "drf.ck.kind", options: Object.keys(KIND).map((k) => [k, KIND[k], cnt((c) => KINDOF(c) === k)]).filter((o) => o[2]) }];
    const views = { total: all.length, all: "All checks", count: (st) => ask({ q: st.q || "", result: st.result || "", state: st.state || "", kind: st.kind || "" }).length,
      presets: [{ label: "Failed", state: { result: "failed" }, count: cnt((c) => c.result === "failed") }, { label: "Drafts", state: { state: "draft" }, count: drafts.length }, { label: "Unused", state: { state: "unused" }, count: cnt((c) => c.state === "unused") }, { label: "New", state: { state: "new" }, count: cnt((c) => c.state === "new") }],
      seed: [{ name: "STIG checklists failing", state: { kind: "stig", result: "failed" }, by: ISSM }] };
    D.walkable("drf-chk", rows.map((c) => c.id));
    const dn = drafts.reduce((s, c) => s + c.failing.length, 0);
    const line = drafts.length ? `<p class="drf-line">Drafts run but don't count: ${plural(drafts.length, "draft check")}${dn ? ` with ${plural(dn, "failing resource")}` : ""} ${drafts.length === 1 ? "is" : "are"} left out of WS-X90's numbers until published. ${v.state === "draft" ? "" : K.actLink("Show drafts", "drf.ck.state", "draft")}</p>` : "";
    const head = D.review({ title: "Checks register", current: "assessments-checks" }) + K.head({ title: "Checks", actions: K.menu("More", [{ label: "Export checks", act: "drf.ck.export" }]) + K.btn("Create check", { primary: true, act: "drf.add", arg: "" }) });
    return K.page({ cls: "k3d drf drf-reg", head, body: [D.stats(tiles),
      K.toolbar({ id: "dr-checks", noun: "checks", search: { act: "drf.ck.q", value: v.q, placeholder: "Search checks" }, filters, views, right: K.btn("Library", { go: "dr-library" }) }),
      line,
      K.table({ label: "Checks", cls: "drf-cks", cols: [{ label: "Name" }, { label: "Result", cls: "nw" }, { label: "Findings", cls: "nw num" }, { label: "Source", cls: "nw" }, { label: "Controls", cls: "nw num" }, { label: "State", cls: "nw" }],
        rows: rows.map((c) => ({ go: chkRoute(c), peek: { panel: "drf-chk", id: c.id }, cls: c.counts ? "" : "drf-off", cells: [K.name(c.name), resPill(c), c.result ? (failN(c) ? `<span class="num${c.counts ? "" : " k3-muted"}">${fmt(failN(c))}</span>` : none("No findings")) : none(), srcCell(c), c.ctls.length ? `<span class="num" title="${esc(c.ctls.slice(0, 24).join(", "))}${c.ctls.length > 24 ? "…" : ""}">${fmt(c.ctls.length)}</span>` : none(), stateCell(c)] })),
        empty: { title: "No check matches", line: "Clear the search and the filters.", action: K.btn("Show all checks", { sm: true, act: "drf.ck.clear" }) },
        foot: `<span class="num">${plural(rows.length, "check")}</span>` })] });
  }
  D.route("dr-checks", () => registerPage(), { nav: "checks" });

  // ——— The preview (the eye): what the page lists ———
  D.panel("drf-chk", (id) => {
    const c = checkBy(id); if (!c) return null;
    return { label: "Check preview", status: resPill(c), title: c.name, open: chkRoute(c),
      facts: [["State", stateCell(c)], ["Source", srcCell(c)], ["Last run", c.last ? num(md(c.last)) : none("Never")], ["Owner", K.owner(c.owner)]],
      body: [nextOf(c, true),
        c.res.length ? K.section({ title: "Failing resources", count: failN(c), body: `<ul class="drf-pl">${c.failing.slice(0, 5).map((r) => `<li>${markOf(r)}<span>${esc(clip(r.title, 64))}</span></li>`).join("")}</ul>${failN(c) > 5 ? K.link(`View all ${failN(c)}`, chkRoute(c, "findings")) : ""}` }) : "",
        K.section({ title: "Controls", count: c.ctls.length, body: c.ctls.length ? `<ul class="drf-chips">${c.ctls.slice(0, 12).map((x) => `<li>${D.idChip(x, ctlTone(x), { title: `${x} ${ctlTitle(x)}`, go: ctlRoute(x) })}</li>`).join("")}</ul>${c.ctls.length > 12 ? K.link(`View all ${c.ctls.length}`, chkRoute(c, "controls")) : ""}` : mu("None in WS-X90's baseline") })].join("") };
  });

  // ════════════════ 2. The check record (dr-check--<id>[--tab]) ════════════════
  const evRoute = () => (PA.S && PA.S["dr-evidence"] ? "dr-evidence" : "evidence");
  function nextOf(c, compact) {
    if (c.never && !c.runs.length) return K.next({ label: "Never run", text: `It has not run yet. Run now reads the ${esc(c.tool)}'s privileged accounts for WS-X90 against the quarter's review.`, action: "" });
    if (c.shape === "account" && c.result === "failed") return K.next({ text: `${plural(failN(c), "privileged account")} with no owner, marked for removal and still active.`, action: compact ? "" : K.link("Open the review", "people-access") });
    if (c.shape === "evidence" && c.result === "failed") { const past = c.failing.filter((r) => r.past).length; return K.next({ text: past ? `${plural(past, "evidence item")} past ${past === 1 ? "its" : "their"} renewal date, the first since ${esc(md(c.since))}.` : `${plural(failN(c), "evidence item")} inside ${failN(c) === 1 ? "its" : "their"} renewal window.`, action: compact ? "" : K.link("Open evidence", evRoute()) }); }
    if (c.state === "unused") return K.next({ label: "Unused", text: `WS-X90's baseline selects ${esc(c.ctls.slice(0, 3).join(", ") || "its controls")}, and ${esc(c.src)} is not connected (${esc(c.why || "")}).`, action: compact ? "" : K.btn("Connect source", { sm: true, primary: true, act: "drf.connect", arg: c.id }) });
    if (c.state === "draft") return K.next({ label: "Draft", text: `It runs and shows a result, but doesn't count yet: ${plural(c.failing.length, "failing resource")} left out of WS-X90's numbers${c.replaces ? `. Publishing replaces ${esc((checkBy(c.replaces) || {}).name || "")}` : ""}.`, action: "" });
    if (c.result === "error") return K.next({ label: "Error", text: esc(c.error || "The last run failed, so the check counts neither way."), action: compact ? "" : K.btn("Fix the source", { sm: true, act: "drf.fixsrc", arg: c.id }) });
    if (c.result === "failed" && !c.items.length && c.failing.some((r) => r.fid)) return K.next({ text: `${plural(c.failing.length, "resource")} failing and no POA&M item answers ${c.failing.length === 1 ? "it" : "them"} yet.`, action: compact ? "" : "" });
    return "";
  }
  const tabsOf = (c, tab) => D.tabs([
    { label: "Overview", route: chkRoute(c), on: tab === "overview" },
    { label: "Findings", problem: c.counts ? failN(c) : 0, count: c.counts ? 0 : failN(c), route: chkRoute(c, "findings"), on: tab === "findings" },
    { label: "Decisions", count: decisions().filter((d) => d.check === c.id).length, route: chkRoute(c, "decisions"), on: tab === "decisions" },
    { label: "Controls", count: c.ctls.length, route: chkRoute(c, "controls"), on: tab === "controls" },
    { label: "History", count: c.runs.length, route: chkRoute(c, "history"), on: tab === "history" }]);

  function numbersOf(c) {
    const track = c.state === "unused" ? { label: "Track", metric: "Days unused", n: daysSince(c.added), tone: "warn", since: `since ${md(c.added)}, when it was added` }
      : c.result === "failed" ? { label: "Track", metric: "Days failing", n: daysSince(c.since), tone: c.counts ? "bad" : "none", since: `since ${md(c.since)}` }
      : c.result === "error" ? { label: "Track", metric: "Days in error", n: daysSince(c.last), tone: "warn", since: `since ${md(c.last)}` }
      : c.result === "passed" ? { label: "Track", metric: "Days passing", n: daysSince(c.last || c.added), tone: "ok", since: `since ${md(c.last || c.added)}` }
      : { label: "Track", metric: "Days since added", n: daysSince(c.added), since: `since ${md(c.added)}${c.never && !c.runs.length ? " · never run" : ""}` };
    const notRun = c.never && !c.runs.length;
    const fix = { label: "Fix", metric: "Failing resources", n: failN(c), tone: failN(c) && c.counts ? "bad" : "none", since: notRun ? "Not run yet" : c.decided ? `${plural(c.decided, "more")} left out by a decision` : c.counts ? "" : "Not counted while a draft", links: c.res.length ? [{ label: "View findings", go: chkRoute(c, "findings") }] : [] };
    const canItem = c.failing.some((r) => r.fid && !itemOf(r.fid));
    let manage = { label: "Manage", metric: "POA&M items in progress", n: c.items.length, links: [canItem ? { label: "Create POA&M item", act: "drf.item.check", arg: c.id } : null, c.items.length ? { label: "View items", go: chkRoute(c, "findings") } : null].filter(Boolean) };
    // Evidence owed: the fix is renewing, not a POA&M item. Accounts: the quarter's review decides what stays.
    if (c.shape === "evidence") { const past = c.failing.filter((r) => r.past); manage = { label: "Manage", metric: "Past their renewal date", n: past.length, tone: past.length && c.counts ? "bad" : "none", since: past.length ? `the first since ${md(past.map((r) => r.expires).sort()[0])}` : "None past", links: [{ label: "Open evidence", go: evRoute() }] }; }
    if (c.shape === "account") { const und = ACCTS.filter((a) => !a.dec).length; manage = { label: "Manage", metric: "Accounts to decide", n: notRun ? 0 : und, since: notRun ? "Not run yet" : `by ${md(REVIEW_DUE)}, in the quarterly review`, links: [{ label: "Open the review", go: "people-access" }] }; }
    // A check that has never run read nothing: no Fix or Manage figure, never a zero.
    return D.numbers(notRun ? [track] : [track, fix, manage]);
  }

  function recordPage(raw) {
    let [id, tab] = String(raw).split("--"); tab = tab || "overview";
    const c = checkBy(id);
    const review = D.review({ title: tab === "decisions" ? "Exclusions as decisions" : "Check record", current: curOf(id) });
    if (!c) return K.page({ cls: "k3d drf", head: review + K.head({ crumbs: [["Checks", "dr-checks"], ["Not found"]], title: "This check is no longer here" }), body: K.empty({ title: "Nothing at this address", action: K.btn("Open the checks", { sm: true, go: "dr-checks" }) }) });
    const notRun = c.never && !c.runs.length;
    const primary = c.state === "draft" ? { label: "Publish", act: "drf.publish", arg: c.id } : c.state === "unused" ? { label: "Connect source", act: "drf.connect", arg: c.id } : c.state === "replaced" ? null : notRun ? { label: "Run now", act: "drf.run", arg: c.id } : c.redraft ? { label: "Publish draft", act: "drf.publish", arg: c.id } : { label: "Edit check", act: "drf.edit", arg: c.id };
    const more = [c.state === "unused" || c.state === "replaced" || notRun ? null : { label: "Run now", act: "drf.run", arg: c.id }, notRun ? { label: "Edit check", act: "drf.edit", arg: c.id } : null, c.t ? { label: "Open its template", go: "dr-library--" + c.t.id } : null, { label: "Download results", act: "drf.dl", arg: c.id }, c.redraft ? { label: "Discard the draft", act: "drf.discard", arg: c.id, danger: true } : null].filter(Boolean);
    const head = D.head({ review, crumbs: [["Checks", "dr-checks"], [clip(c.name, 60)]], id: { code: "CHK-" + codeOf(c), tone: c.result === "passed" ? "ok" : c.result === "failed" ? "bad" : c.result === "error" ? "warn" : "none" }, title: c.name,
      facts: [notRun ? null : ["Result", resPill(c)], ["State", stateCell(c)], ["Source", `${esc(c.tool)}${c.state === "unused" ? " " + warnW("Not connected") : ""}`], ["Owner", K.owner(c.owner), () => ownerForm(c)], notRun ? null : ["Last run", c.last ? num(mdy(c.last)) : none("Never")], ["Component", compLink(c.comp)]].filter(Boolean),
      actions: { more, primary }, tabs: tabsOf(c, tab) });
    let body;
    if (tab === "findings") body = findingsTab(c);
    else if (tab === "decisions") body = decisionsTab(c);
    else if (tab === "controls") body = controlsTab(c);
    else if (tab === "history") body = historyTab(c);
    else body = overviewTab(c);
    return K.page({ cls: "k3d drf drf-rec", head, body });
  }
  // A check's code (derived): CHK- and a number fixed by its place in the seeded list, made checks after them.
  const ORDER = [...STIGCK, DRAFT0, ...TESTCK, ...UNUSED, ...NEWCK].map((x) => x.id);
  const codeOf = (c) => { const i = ORDER.indexOf(c.id); return String(101 + (i >= 0 ? i : ORDER.length + get("made", []).findIndex((m) => m.id === c.id))); };
  // Today's page for the same check: V3's monitoring check (assessment--chk-<id>) it is a test of.
  const curOf = (id) => `assessment--chk-${/^acas|sarif|nessus/.test(id) ? "vuln" : id === "sbom-mc" ? "sbom" : id === "poam-rev" ? "poamr" : id === "audit-logs" ? "au6" : id === "ev-renewal" ? "expiring" : id === "priv-review" ? "par" : "stig"}`;
  D.routeLike("dr-check", (raw) => recordPage(raw), { nav: "checks" });

  function overviewTab(c) {
    const nx = nextOf(c, false);
    const lastRun = c.runs.filter((r) => r[1] !== "running").slice(-1)[0], running = c.runs.find((r) => r[1] === "running");
    const latest = !(lastRun || running || c.decided) ? "" : D.box("Latest result", [K.facts([["Ran", lastRun ? num(mdy(lastRun[0])) : none("Never")], ["What it read", lastRun ? esc(lastRun[2]) : none()], running ? ["Running now", esc(running[2])] : null, c.decided ? ["Left out", `${plural(c.decided, "resource")} by a signed decision · ${K.link("Decisions", chkRoute(c, "decisions"))}`] : null])]);
    const draftBox = c.redraft ? D.box("Draft over this check", [`<p class="drf-p">${esc(c.redraft.by)} opened a draft on ${esc(md(c.redraft.at))}. It runs beside the published check, which keeps counting until the draft is published.</p>`], { actions: `<span class="drf-acts">${K.btn("Discard", { sm: true, act: "drf.discard", arg: c.id })}</span>` }) : "";
    const details = D.box("Details", [K.facts([["Template", c.t ? K.link(tplName(c.t), "dr-library--" + c.t.id) : none()], ["Kind", esc(c.t ? KIND[c.t.kind] : "Custom")], ["Reads", `${esc(c.src)}${c.state === "unused" ? " " + warnW("Not connected") : ""}`], ["Added", `${num(mdy(c.added))}${c.by ? mu(" · by " + c.by) : ""}`]])]);
    const ctl = `<div class="drf-wide">${D.box(c.counts ? "Counts toward" : c.state === "draft" ? "Will count toward, once published" : "Controls", [c.ctls.length ? `<ul class="drf-chips">${c.ctls.slice(0, 18).map((x) => `<li>${D.idChip(x, ctlTone(x), { title: `${x} ${ctlTitle(x)}`, go: ctlRoute(x) })}</li>`).join("")}</ul>${c.ctls.length > 18 ? K.link(`View all ${c.ctls.length}`, chkRoute(c, "controls")) : ""}` : mu("No control of WS-X90's baseline")])}</div>`;
    return D.sunken([nx ? `<div class="drf-nx">${nx}</div>` : "", numbersOf(c), `<div class="drf-grid">${[whatBox(c), latest, draftBox, details, ctl].filter(Boolean).join("")}</div>`]);
  }
  // What the check checks (version 24): a STIG's rules, counted, with its failing rules one click from their check and fix text;
  // any other check's rule in one line.
  const resId = (c, r) => `${c.id}~${r.key}`;
  function whatBox(c) {
    const t = c.t;
    if (!t) return "";
    if (!t.rules) return D.box("What it checks", [K.facts([["Rule", esc(ruleLine(t))]])]);
    const held = c.res.filter((r) => r.fid && ruleText(r.fid));
    const top = c.res.slice(0, 3);
    if (top.length) D.walkable("drf-res", c.res.map((r) => resId(c, r)));
    const list = top.length ? `<ul class="drf-rl">${top.map((r) => `<li><button type="button" class="drf-rl-b" data-panel="drf-res" data-id="${esc(resId(c, r))}" aria-label="Open ${esc(clip(r.title, 60))}">${sevPill(r)}<span class="drf-rl-t">${esc(r.title)}</span></button></li>`).join("")}</ul>` : "";
    return D.box("What it checks", [K.facts([["Rules", `${num(t.rules)} ${mu(`· CAT I ${t.cats[0]}, CAT II ${t.cats[1]}, CAT III ${t.cats[2]}`)}`], ["Rule text", held.length ? `Check and fix text for ${plural(held.length, "open rule")}` : mu(c.slug ? "Held for open rules only" : "Once its first checklist is imported")]]), list, c.res.length > top.length ? K.link(`View all ${fmt(c.res.length)} open rules`, chkRoute(c, "findings")) : ""]);
  }
  const people = () => memo("people", () => uniq(((V3.fact("people", V3.prog()) || []).map((p) => p.name)).concat([ME, ISSM, ISSO])).sort(natural));
  const patchOwner = (c, owner) => { if (c.kind === "made") { set("made", get("made", []).map((m) => (m.id === c.id ? Object.assign({}, m, { owner }) : m))); } else patchMap("own", c.id, owner); };
  const ownerForm = (c) => K.form({ title: "Change owner", submit: "Save owner", fields: [{ key: "owner", label: "Owner", type: "select", required: true, value: c.owner, options: people() }], onSubmit: (v) => { patchOwner(c, v.owner); K.toast(`${c.name}: owner ${v.owner}`); K.redraw(); return null; } });

  // ——— Findings: the failing resources ———
  const fRoute = (fid) => `dr-finding--${encodeURIComponent(fid)}`;
  const itemCell = (r) => { if (!r.fid) return none(); const it = itemOf(r.fid); return it ? `<span class="drf-item" title="${esc(it.title)}">${esc(clip(it.title, 34))}</span>` : none("No item"); };
  function findingsTab(c) {
    const q = String(get("fq." + c.id, "") || "").toLowerCase();
    const list = c.res.filter((r) => !q || `${r.title} ${compName(r.comp)} ${r.ctl}`.toLowerCase().includes(q));
    const oneComp = uniq(c.res.map((r) => r.comp)).length <= 1; // B4: a constant column folds
    const decCell = (d) => `<span class="drf-dec">${esc(DK[d.kind][0])}</span> ${mu("until " + md(d.ends))}`;
    const actCell = (r, d) => (d ? "" : `<span class="drf-rowact">${K.btn("Record decision", { sm: true, quiet: true, act: "drf.dec", arg: { check: c.id, key: r.key } })}</span>`);
    // Each row's eye opens the drawer (drf-res): the rule it fails, with a STIG rule's check and fix text, and Finding preview.
    D.walkable("drf-res", list.map((r) => resId(c, r)));
    let cols, rows;
    if (c.shape === "evidence") {
      cols = [{ label: "Evidence" }, { label: "State", cls: "nw" }, { label: "Renew by", cls: "nw" }, { label: "Decision", cls: "nw" }, { label: "", cls: "tight" }];
      rows = list.map((r) => { const d = activeDec(c, r.key); return { go: r.route || undefined, peek: { panel: "drf-res", id: resId(c, r) }, cls: d ? "drf-off" : "", cells: [K.name(r.title), markOf(r), renewCell(r), d ? decCell(d) : none("No decision"), actCell(r, d)] }; });
      if (!rows.some((x) => /drf-dec/.test(x.cells[3]))) { cols.splice(3, 1); rows.forEach((x) => x.cells.splice(3, 1)); }
    } else if (c.shape === "account") {
      cols = [{ label: "Account" }, { label: "Problem", cls: "nw" }, { label: "Component", cls: "nw" }, { label: "Review decision", cls: "nw" }, { label: "", cls: "tight" }];
      rows = list.map((r) => { const d = activeDec(c, r.key); return { go: r.route, peek: { panel: "drf-res", id: resId(c, r) }, cls: d ? "drf-off" : "", cells: [K.name(r.title), markOf(r), esc(compName(r.comp)), d ? decCell(d) : esc(DECW[r.acct.dec] || "Not decided"), actCell(r, d)] }; });
    } else {
      cols = [{ label: "Resource" }, { label: "Severity", cls: "nw" }, { label: "Component", cls: "nw" }, { label: "Control", cls: "nw" }, { label: "POA&M item", cls: "nw" }, { label: "", cls: "tight" }];
      rows = list.map((r) => {
        const d = activeDec(c, r.key);
        const cells = [K.name(r.title), sevPill(r), esc(compName(r.comp)), r.ctl ? D.idChip(r.ctl, ctlTone(r.ctl), { title: `${r.ctl} ${ctlTitle(r.ctl)}` }) : none(), d ? decCell(d) : itemCell(r), actCell(r, d)];
        if (oneComp) cells.splice(2, 1);
        return { go: r.fid ? fRoute(r.fid) : undefined, peek: { panel: "drf-res", id: resId(c, r) }, cls: d ? "drf-off" : "", cells };
      });
      if (oneComp) cols.splice(2, 1);
    }
    const right = c.shape === "finding" && c.failing.some((r) => r.fid && !itemOf(r.fid)) ? K.btn("Create POA&M item", { act: "drf.item.check", arg: c.id }) : "";
    const notRun = c.never && !c.runs.length;
    return [K.toolbar({ id: "dr-check-f-" + c.id, noun: "failing resources", views: false, search: { act: "drf.fq", value: q, placeholder: "Search failing resources" }, right }),
      c.counts ? "" : `<p class="drf-line">A draft: these ${plural(c.failing.length, "resource")} don't count toward WS-X90's numbers until it is published.</p>`,
      c.more ? `<p class="drf-line">V3 counts ${fmt(failN(c))} and lists the first ${fmt(c.failing.length)}.</p>` : "",
      K.table({ label: "Failing resources", cls: "drf-fs", cols, rows,
        empty: { title: notRun ? "Not run yet" : c.res.length ? "No resource matches" : "Nothing failing", line: notRun ? "Run now reads its resources." : c.res.length ? "Clear the search." : c.result === "error" ? "The last run read nothing." : "Every resource passed the last run.", action: notRun ? K.btn("Run now", { sm: true, act: "drf.run", arg: c.id }) : "" },
        foot: `<span class="num">${fmt(failN(c))} failing${c.decided ? ` · ${fmt(c.decided)} left out by a decision` : ""}</span>` })];
  }
  const DECW = { keep: "Keep", revoke: "Remove" };
  const renewCell = (r) => (!r.expires ? none("No renewal date") : r.past ? `<span class="num drf-warnw">${esc(md(r.expires))} · ${fmt(daysSince(r.expires))} days past</span>` : `<span class="num">${esc(md(r.expires))}</span>`);
  // ——— The drawer: one failing resource and the rule it fails (version 24) ———
  const resOf = (id) => { const s = String(id || ""), i = s.indexOf("~"); if (i < 0) return null; const c = checkBy(s.slice(0, i)); const r = c && c.res.find((x) => x.key === s.slice(i + 1)); return r ? { c, r } : null; };
  const ruleSec = (title, text, pre) => (text ? `<section class="drf-rt"><h5>${esc(title)}</h5>${pre ? `<pre class="drf-pre">${esc(text)}</pre>` : `<p class="drf-rt-p">${esc(text)}</p>`}</section>` : "");
  D.panel("drf-res", (id) => {
    const x = resOf(id); if (!x) return null;
    const { c, r } = x, d = activeDec(c, r.key), f = r.fid ? r.f || fById(r.fid) : null;
    const rt = r.fid ? ruleText(r.fid) : null;
    const status = d ? K.status(DK[d.kind][0], "none") : K.status(c.counts ? "Failing" : "Failing · draft", "bad");
    const code = f && f.stig ? f.stig.v || "V-" + String(r.fid).split("|")[1] : f && f.cve ? f.cve.cve : "";
    const title = String(r.title).replace(/^V-\d+\s+/, "");
    let facts;
    if (c.shape === "evidence") facts = [["State", markOf(r)], ["Renew by", renewCell(r)], ["Control", D.idChip("CA-7", ctlTone("CA-7"), { title: "CA-7 " + ctlTitle("CA-7"), go: ctlRoute("CA-7") })]];
    else if (c.shape === "account") facts = [["Component", compLink(r.comp)], ["Owner", r.acct.owner ? K.owner(r.acct.owner) : warnW("No owner")], ["Review decision", esc(DECW[r.acct.dec] || "Not decided")], ["Active", r.acct.active ? warnW("Still active") : mu("Disabled")]];
    else facts = [rt && rt.stigId ? ["STIG ID", num(rt.stigId)] : null, ["Severity", sevPill(r)], ["Component", compLink(r.comp)], r.ctl ? ["Control", D.idChip(r.ctl, ctlTone(r.ctl), { title: `${r.ctl} ${ctlTitle(r.ctl)}`, go: ctlRoute(r.ctl) })] : null, r.fid ? ["POA&M item", itemCell(r)] : null].filter(Boolean);
    if (d) facts.push(["Decision", `${esc(DK[d.kind][0])} ${mu(`· ${d.by}, until ${md(d.ends)}`)}`]);
    const body = rt ? [ruleSec("Check text", rt.check, true), ruleSec("Fix text", rt.fix, true), ruleSec("Discussion", rt.disc, false)].join("")
      : ruleSec("The rule", ruleLine(c.t) || c.name, false) + (r.why ? ruleSec("Why it fails", r.why, false) : "");
    return { label: "Failing resource", status, title, code, tone: SEV[r.sev] ? (SEV[r.sev][1] === "none" ? "warn" : SEV[r.sev][1]) : "none", open: r.fid ? fRoute(r.fid) : r.route || chkRoute(c, "findings"),
      actions: r.fid ? K.btn("Finding preview", { sm: true, act: "drf.fprev", arg: r.fid }) : "", facts, body: `<div class="drf-rule">${body}</div>` };
  });
  K.on("drf.fprev", (fid) => { if (fid) K.openPanel("k3e-finding", fid); });
  K.on("drf.fq", (v) => { const r = (location.hash || "").slice(1), m = /^dr-check--([^-][^]*?)--findings$/.exec(r); if (m) set("fq." + m[1], v || ""); K.redraw(); });

  // ——— Decisions: an exclusion is a recorded decision, signed by its role, with an end date ———
  const DK = {
    fp: ["False positive", "ISSO", ISSO, 365, "The rule is met, and the scan or checklist read it wrong. Name what shows it."],
    opreq: ["Operational requirement", "ISSM", ISSM, 365, "The mission needs the setting the rule forbids. Name the requirement."],
    risk: ["Risk acceptance", "AO", AO, 180, "The weakness stays, and the authorizing official accepts the risk until the end date."],
  };
  K.on("drf.dec", (a) => {
    const c = checkBy(a && a.check); if (!c) return;
    const open = c.failing.filter((r) => !activeDec(c, r.key));
    if (!open.length) { K.toast("Every failing resource already has a decision"); return; }
    K.form({ title: "Record decision", submit: "Record decision", intro: `A failing resource leaves the count only by a signed decision that ends on a date. The prototype records it as the signer, by ${esc(ME)}.`,
      fields: [{ key: "key", label: "Resource", type: "select", required: true, value: a.key || open[0].key, options: open.map((r) => [r.key, clip(r.title, 70)]) },
        { key: "kind", label: "Decision", type: "select", required: true, value: "fp", options: Object.keys(DK).map((k) => [k, `${DK[k][0]} · signed by the ${DK[k][1]}, ${DK[k][2]}`]) },
        { key: "reason", label: "Why", type: "textarea", rows: 3, required: true, hint: "What shows it, in a sentence or two" },
        { key: "ends", label: "Ends", type: "date", required: true, value: addDays(TODAY, 365), hint: "A risk acceptance ends within 180 days" }],
      onSubmit: (v) => {
        if (!v.reason || v.reason.trim().length < 8) return { reason: "Say why, in a sentence." };
        if (!v.ends || v.ends <= TODAY) return { ends: "The end date is after today." };
        if (v.kind === "risk" && v.ends > addDays(TODAY, 180)) return { ends: "A risk acceptance ends within 180 days." };
        const r = c.res.find((x) => x.key === v.key);
        K.push("dr.F.dec", { id: "dec-" + hash(c.id + v.key + v.kind + v.ends), check: c.id, key: v.key, title: r ? r.title : v.key, kind: v.kind, reason: v.reason.trim(), by: DK[v.kind][2], role: DK[v.kind][1], rec: ME, at: TODAY, ends: v.ends });
        K.toast(`${DK[v.kind][0]} recorded, signed by ${DK[v.kind][2]}: the resource leaves the count until ${md(v.ends)}`);
        K.redraw(); return null;
      } });
  });
  K.on("drf.dec.end", (id) => K.confirm({ title: "End decision", submit: "End decision", danger: true, text: "The resource counts again from today. The decision stays in the list, ended today.", onOk: () => { set("dec", decisions().map((d) => (d.id === id ? Object.assign({}, d, { ends: addDays(TODAY, -1), ended: TODAY }) : d))); K.toast("Decision ended: the resource counts again"); K.redraw(); } }));
  function decisionsTab(c) {
    const L = decisions().filter((d) => d.check === c.id);
    const add = c.failing.length ? K.btn("Record decision", { act: "drf.dec", arg: { check: c.id } }) : "";
    const rows = L.map((d) => { const on = d.ends >= TODAY; return { cells: [K.name(d.title), `<span class="drf-dec">${esc(DK[d.kind][0])}</span>`, `<span class="drf-why" title="${esc(d.reason)}">${esc(clip(d.reason, 60))}</span>`, `${esc(d.by)} ${mu("· " + d.role)}`, num(md(d.at)), on ? num(md(d.ends)) : mu(`Ended ${md(d.ended || d.ends)}`), on ? K.btn("End", { sm: true, quiet: true, act: "drf.dec.end", arg: d.id }) : ""] }; });
    return [K.toolbar({ id: "dr-check-d-" + c.id, noun: "decisions", views: false, right: add }),
      `<p class="drf-line">An exclusion is a decision: a false positive, an operational requirement or a risk acceptance, each signed by its role, with a reason and an end date. There is no free Exclude.</p>`,
      K.table({ label: "Decisions", cls: "drf-ds", cols: [{ label: "Resource" }, { label: "Decision", cls: "nw" }, { label: "Why" }, { label: "Signed by", cls: "nw" }, { label: "When", cls: "nw" }, { label: "Ends", cls: "nw" }, { label: "", cls: "tight" }], rows,
        empty: { title: "No decision recorded", line: "Every failing resource counts.", action: add ? K.btn("Record decision", { sm: true, act: "drf.dec", arg: { check: c.id } }) : "" } })];
  }

  // ——— Controls ———
  function controlsTab(c) {
    const fails = new Map(); c.failing.forEach((r) => { if (r.ctl) fails.set(r.ctl, (fails.get(r.ctl) || 0) + 1); });
    const rows = c.ctls.map((x) => ({ go: ctlRoute(x), cells: [K.name(ctlTitle(x) || x, "", x), ctlPill(x), fails.get(x) ? `<span class="num drf-warnw">${fmt(fails.get(x))}</span>` : none("None failing")] }));
    return [K.table({ label: "Controls", cls: "drf-cs", cols: [{ label: "Control" }, { label: "Status", cls: "nw" }, { label: "Failing here", cls: "nw num" }], rows, empty: { title: "No control of WS-X90's baseline", line: "Its template maps to controls the baseline leaves out." }, foot: `<span class="num">${plural(c.ctls.length, "control")} of WS-X90's baseline</span>` })];
  }

  // ——— History: runs over twelve months ———
  const MONTHS = (() => { const out = []; for (let i = 11; i >= 0; i--) { const d = new Date(Date.UTC(2026, 10 - i, 1)); out.push(d.toISOString().slice(0, 7)); } return out; })();
  function historyTab(c) {
    const runs = c.runs.slice().reverse();
    const word = (r) => (r[1] === "running" ? ["Running", "none"] : r[1] === "error" ? ["Error", "warn"] : r === c.runs.filter((x) => x[1] !== "running").slice(-1)[0] ? [RES[c.result] ? RES[c.result][0] : "Passed", RES[c.result] ? RES[c.result][1] : "ok"] : r[1] === 0 ? ["Passed", "ok"] : ["Failed", "bad"]);
    const failN = (r) => (r[1] === "running" || r[1] === "error" ? null : r === c.runs.filter((x) => x[1] !== "running").slice(-1)[0] ? failN(c) : r[1]);
    const strip = `<div class="drf-strip" role="img" aria-label="Runs by month over twelve months">${MONTHS.map((m) => {
      const rs = c.runs.filter((r) => String(r[0]).slice(0, 7) === m);
      const r = rs[rs.length - 1], w = r ? word(r) : null, n = r ? failN(r) : null;
      const lab = new Date(m + "-15T12:00:00Z").toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
      return `<div class="drf-mo${r ? " t-" + w[1] : ""}" title="${esc(lab)}: ${r ? `${w[0]}${n != null ? ", " + n + " failing" : ""}` : "no run"}"><span class="drf-mo-b"></span><span class="drf-mo-l">${esc(lab)}</span>${r && n != null ? `<span class="drf-mo-n num">${fmt(n)}</span>` : ""}</div>`;
    }).join("")}</div>`;
    return [D.box(`Runs over twelve months`, [strip, `<p class="drf-cap">${plural(c.runs.length, "run")} recorded since ${esc(mdy(addDays(TODAY, -365)))}; a month with no mark had no run.</p>`]),
      K.table({ label: "Runs", cls: "drf-rs", cols: [{ label: "Run", cls: "nw" }, { label: "Result", cls: "nw" }, { label: "Failing", cls: "nw num" }, { label: "What it read" }], rows: runs.map((r) => { const w = word(r), n = failN(r); return { cells: [num(mdy(r[0])), K.status(w[0], w[1]), n == null ? none() : num(n), `<span class="drf-why" title="${esc(r[2])}">${esc(clip(r[2], 90))}</span>`] }; }),
        empty: { title: "No run yet", line: c.state === "unused" ? "It runs once its source is connected." : c.never ? "Run now runs it." : "It runs at the next import." } })];
  }

  // ——— Commands on a check ———
  K.on("drf.publish", (id) => {
    const c = checkBy(id); if (!c) return;
    const old = c.replaces ? checkBy(c.replaces) : null;
    K.confirm({ title: c.redraft ? "Publish draft" : "Publish check", submit: "Publish", text: `${esc(c.name)} starts counting toward WS-X90's numbers now: ${plural(c.failing.length, "failing resource")} join the program's counts and auditors see its results.${old ? ` ${esc(old.name)} stops counting: it is replaced.` : ""}`,
      onOk: () => { if (c.redraft) patchMap("redraft", c.id, undefined); else if (c.kind === "made") set("made", get("made", []).map((m) => (m.id === c.id ? Object.assign({}, m, { status: "published" }) : m))); patchMap("pub", c.id, TODAY); K.toast(`${c.name} published: it counts from today`); K.redraw(); } });
  });
  K.on("drf.edit", (id) => {
    const c = checkBy(id); if (!c) return;
    K.confirm({ title: "Edit check", submit: "Open a draft", text: `Editing a published check opens a draft over it. The draft runs beside ${esc(c.name)}, which keeps counting until you publish the draft.`, onOk: () => { patchMap("redraft", c.id, { at: TODAY, by: ME }); K.toast("Draft opened over the published check"); K.redraw(); } });
  });
  K.on("drf.discard", (id) => { const c = checkBy(id); if (!c) return; patchMap("redraft", id, undefined); K.toast(`Draft discarded: ${c.name} stays as published`); K.redraw(); });
  K.on("drf.run", (id) => { const c0 = checkBy(id); if (!c0) return; pushMap("runs", id, TODAY); MEMO = {}; const c = checkBy(id) || c0; K.toast(`${c.name} ran: ${failN(c) ? plural(failN(c), "resource") + " failing" : "passed"}`); K.redraw(); });
  K.on("drf.dl", (id) => { const c = checkBy(id); if (!c) return; K.toast(`${c.name}: results downloaded as CSV (${plural(c.res.length, "resource")})`); });
  K.on("drf.connect", (id) => { const c = checkBy(id); if (!c) return; K.dialog({ title: `Connect ${c.src}`, submit: false, cancel: "Close", body: `<p>${esc(c.src)} is set up under Sources, where its tool, credentials and schedule live. Once its first import lands, this check runs and its state turns Enabled. The prototype connects to no source and saves nothing here.</p>` }); });
  K.on("drf.fixsrc", (id) => { const c = checkBy(id); if (!c) return; K.dialog({ title: `Fix ${c.src}`, submit: false, cancel: "Close", body: `<p>${esc(c.error || "")} Correct the file at its source and import it again; the check runs on the next import. The prototype imports nothing here.</p>` }); });

  // ——— Add to program (from the library or Create check) ———
  const COMPS = () => memo("comps", () => ((V3.fact("components") || []).filter((x) => /^CN-1091/.test(x.code))).map((x) => [x.code, x.name]));
  K.on("drf.add", (tid) => {
    const t = tplBy(tid);
    const fields = [t ? null : { key: "tpl", label: "Template", type: "select", required: true, options: TPL.map((x) => [x.id, tplName(x)]) },
      { key: "comps", label: "Components", type: "checks", options: COMPS(), value: [], hint: "One check is added for each component you choose" },
      { key: "status", label: "Add as", type: "select", required: true, value: "draft", options: [["draft", "Draft · runs, but doesn't count until published"], ["published", "Published · counts from today"]] }].filter(Boolean);
    K.form({ title: t ? `Add ${tplName(t)} to WS-X90` : "Create check", submit: "Add to program", intro: t ? esc(t.what) : "Start from a template; a check's rules come from its template.", fields,
      onSubmit: (v) => {
        const tpl = t || tplBy(v.tpl); if (!tpl) return { tpl: "Choose a template." };
        const comps = [].concat(v.comps || []).filter(Boolean); if (!comps.length) return { comps: "Choose at least one component." };
        const made = get("made", []), ids = [];
        comps.forEach((cc) => { const id = "m-" + hash(tpl.id + cc + made.length + ids.length); ids.push(id); made.push({ id, tpl: tpl.id, comp: cc, src: "Not imported yet", tool: tpl.by, owner: ME, added: TODAY, status: v.status, by: ME }); });
        set("made", made);
        if (v.status === "published") { const p = Object.assign({}, get("pub", {})); ids.forEach((id) => { p[id] = TODAY; }); set("pub", p); }
        K.toast(`${plural(ids.length, "check")} added as ${v.status === "draft" ? "drafts" : "published"}: ${tplName(tpl)}`, { label: "Open checks", route: "dr-checks" });
        K.redraw(); return null;
      } });
  });

  // ════════════════ 3. The library (dr-library, dr-library--<id>) ════════════════
  const usesOf = (t) => checks().filter((c) => c.t && c.t.id === t.id);
  const lview = () => Object.assign({ q: "", use: "", rating: "", kind: [] }, get("lib", {}) || {});
  const setL = (ch) => set("lib", Object.assign({}, lview(), ch));
  K.on("drf.lib.q", (v) => { setL({ q: v || "" }); K.redraw(); });
  ["use", "rating"].forEach((k) => K.on("drf.lib." + k, (v) => { setL({ [k]: v || "" }); K.redraw(); }));
  K.on("drf.lib.clear", () => { set("lib", {}); K.redraw(); });
  const lask = (v) => { const q = String(v.q || "").trim().toLowerCase(), ks = [].concat(v.kind || []);
    return TPL.filter((t) => (!v.use || (v.use === "in") === usesOf(t).length > 0) && (!v.rating || t.rating === v.rating) && (!ks.length || ks.includes(t.kind)) && (!q || `${tplName(t)} ${t.by} ${tplCtls(t).join(" ")}`.toLowerCase().includes(q))); };
  K.on("drf.lib.sel", (id) => { const s = new Set(get("lsel", [])); if (s.has(id)) s.delete(id); else s.add(id); set("lsel", [...s]); K.redraw(); });
  K.on("drf.lib.selclear", () => { set("lsel", []); K.redraw(); });
  K.on("drf.lib.addsel", () => {
    const sel = get("lsel", []).map(tplBy).filter(Boolean); if (!sel.length) return;
    K.form({ title: `Add ${plural(sel.length, "template")} to WS-X90`, submit: "Add to program", intro: sel.map((t) => esc(tplName(t))).join(" · "),
      fields: [{ key: "comps", label: "Components", type: "checks", options: COMPS(), value: [], hint: "Each template is added once for each component" }, { key: "status", label: "Add as", type: "select", required: true, value: "draft", options: [["draft", "Draft · runs, but doesn't count until published"], ["published", "Published · counts from today"]] }],
      onSubmit: (v) => { const comps = [].concat(v.comps || []).filter(Boolean); if (!comps.length) return { comps: "Choose at least one component." }; const made = get("made", []); let n = 0; const pub = Object.assign({}, get("pub", {}));
        sel.forEach((t) => comps.forEach((cc) => { const id = "m-" + hash(t.id + cc + made.length); made.push({ id, tpl: t.id, comp: cc, src: "Not imported yet", tool: t.by, owner: ME, added: TODAY, status: v.status, by: ME }); if (v.status === "published") pub[id] = TODAY; n++; }));
        set("made", made); set("pub", pub); set("lsel", []); K.toast(`${plural(n, "check")} added as ${v.status === "draft" ? "drafts" : "published"}`, { label: "Open checks", route: "dr-checks" }); K.redraw(); return null; } });
  });

  function libraryPage() {
    const v = lview(), rows = lask(v), sel = new Set(get("lsel", []));
    const cntT = (fn) => TPL.filter(fn).length;
    const inUse = cntT((t) => usesOf(t).length > 0);
    const panel = D.facets({ id: "drf-lib", groups: [
      { key: "use", label: "Usage", type: "radio", value: v.use, options: [["", "All", TPL.length], ["in", "In use", inUse], ["out", "Not in use", TPL.length - inUse]] },
      { key: "rating", label: "Rating", type: "radio", value: v.rating, options: [["", "All", TPL.length], ["essential", "Essential", cntT((t) => t.rating === "essential")], ["recommended", "Recommended", cntT((t) => t.rating === "recommended")]] },
      { key: "kind", label: "Kind", type: "check", value: v.kind, options: Object.keys(KIND).map((k) => [k, KIND[k], cntT((t) => t.kind === k)]) }],
      act: (key, val) => { setL({ [key]: val }); K.redraw(); }, clear: () => { set("lib", Object.assign({}, { q: lview().q })); K.redraw(); } });
    const stats = D.stats([{ label: "In use", n: inUse, act: () => { setL({ use: v.use === "in" ? "" : "in" }); K.redraw(); } }, { label: "Not in use", n: TPL.length - inUse, act: () => { setL({ use: v.use === "out" ? "" : "out" }); K.redraw(); } }].filter((x) => x.n));
    const table = K.table({ label: "Templates", cls: "drf-lib", cols: [{ label: "", cls: "tight" }, { label: "Template" }, { label: "Kind", cls: "nw" }, { label: "Rating", cls: "nw" }, { label: "Usage", cls: "nw" }, { label: "Controls", cls: "nw num" }],
      rows: rows.map((t) => { const u = usesOf(t).length; return { go: "dr-library--" + t.id, cells: [`<button type="button" class="drf-tick${sel.has(t.id) ? " on" : ""}" role="checkbox" aria-checked="${sel.has(t.id)}" aria-label="Choose ${esc(tplName(t))}"${K.a("drf.lib.sel", t.id)}>${sel.has(t.id) ? D.glyph("ok") : ""}</button>`, K.name(tplName(t)), esc(KIND[t.kind]), t.rating === "essential" ? `<span class="drf-ess">Essential</span>` : esc(RATE[t.rating]), u ? `In use ${mu("· " + fmt(u))}` : mu("Not in use"), num(uniq(tplCtls(t)).filter(inBase).length)] }; }),
      empty: { title: "No template matches", line: "Clear the search and the filters.", action: K.btn("Show all templates", { sm: true, act: "drf.lib.clear" }) }, foot: `<span class="num">${plural(rows.length, "template")}</span>` });
    const head = D.review({ title: "Checks library", current: "stigs-benchmarks" }) + K.head({ crumbs: [["Checks", "dr-checks"], ["Library"]], title: "Checks library", actions: K.btn("Add to program", { primary: true, act: sel.size ? "drf.lib.addsel" : "drf.add", arg: "" }) });
    return K.page({ cls: "k3d drf drf-libp", head, body: [stats, K.toolbar({ id: "dr-library", noun: "templates", views: false, search: { act: "drf.lib.q", value: v.q, placeholder: "Search templates" }, right: D.facetToggle("drf-lib") }), D.withFacets("drf-lib", panel, [table]),
      D.selbar({ n: sel.size, total: rows.length, noun: "templates", all: () => { set("lsel", rows.map((t) => t.id)); K.redraw(); }, clear: "drf.lib.selclear", verbs: [{ label: "Add to program", act: "drf.lib.addsel" }] })] });
  }
  D.route("dr-library", () => libraryPage(), { nav: "checks" });

  function templatePage(id) {
    const t = tplBy(id), review = D.review({ title: "Checks library", current: "stigs-benchmarks" });
    if (!t) return K.page({ cls: "k3d drf", head: review + K.head({ crumbs: [["Library", "dr-library"], ["Not found"]], title: "This template is no longer here" }), body: K.empty({ title: "Nothing at this address", action: K.btn("Open the library", { sm: true, go: "dr-library" }) }) });
    const uses = usesOf(t), ctls = uniq(tplCtls(t)).filter(inBase).sort(natural);
    const head = D.head({ review, crumbs: [["Checks", "dr-checks"], ["Library", "dr-library"], [clip(tplName(t), 50)]], title: tplName(t),
      facts: [["Kind", esc(KIND[t.kind])], ["Rating", esc(RATE[t.rating])], ["Publisher", esc(t.by)], t.date ? ["Released", num(mdy(t.date))] : null, t.rules ? ["Rules", `${num(t.rules)} ${mu(`· CAT I ${t.cats[0]}, CAT II ${t.cats[1]}, CAT III ${t.cats[2]}`)}`] : null, ["Usage", uses.length ? `In use · ${plural(uses.length, "check")}` : mu("Not in use")]],
      actions: { primary: { label: "Add to program", act: "drf.add", arg: t.id } } });
    const useRows = uses.map((c) => ({ go: chkRoute(c), cells: [K.name(c.name), esc(compName(c.comp)), stateCell(c), resPill(c), K.btn("Manage", { sm: true, go: chkRoute(c) })] }));
    return K.page({ cls: "k3d drf drf-rec", head, body: D.sunken([`<div class="drf-grid">${[
      D.box("About", [`<p class="drf-p">${esc(t.what)}</p>`]),
      D.box("Checks using this template", [K.table({ label: "Checks using this template", cols: [{ label: "Check" }, { label: "Component", cls: "nw" }, { label: "State", cls: "nw" }, { label: "Result", cls: "nw" }, { label: "", cls: "tight" }], rows: useRows, empty: { title: "Not in use", line: "No check of WS-X90's is a copy of it.", action: K.btn("Add to program", { sm: true, act: "drf.add", arg: t.id }) } })], { actions: uses.length ? `<span class="num k3-muted">${fmt(uses.length)}</span>` : "" }),
      D.box("Controls it evidences", [ctls.length ? `<ul class="drf-chips">${ctls.slice(0, 30).map((x) => `<li>${D.idChip(x, ctlTone(x), { title: `${x} ${ctlTitle(x)}`, go: ctlRoute(x) })}</li>`).join("")}</ul>${ctls.length > 30 ? mu(`and ${ctls.length - 30} more`) : ""}` : mu("None in WS-X90's baseline")]),
    ].join("")}</div>`]) });
  }
  D.routeLike("dr-library", (id) => templatePage(id), { nav: "checks" });

  // ════════════════ 4. The finding record (dr-finding--<id>) ════════════════
  // The check that found it: the check whose resources hold it (a published one before a draft).
  const checkOfF = (fid) => checks().filter((c) => c.res.some((r) => r.fid === fid)).sort((a, b) => (a.state === "draft") - (b.state === "draft"))[0] || null;
  // Same weakness (rec 18, derived): the same control on the same component. Its open findings are the affected items.
  const weakKey = (f) => `${f.cve ? f.cve.cve : f.control || ""}@${(f.components || [])[0] || ""}`;
  const weakWords = (f) => `${f.cve ? f.cve.cve : f.control || "the same control"} on ${compName((f.components || [])[0]) || "the system"}`;
  const sameWeak = (f) => findingsAll().filter((x) => isOpenF(x) && x.kind === f.kind && weakKey(x) === weakKey(f));
  // The owner it routes to: the component's owner (WS-X90 records none, so the owner of the component's STIG checklist stands in),
  // else the system owner.
  const COMPOWN = { "CN-109101": ISSM, "CN-109109": ISSO, "CN-109107": ISSM, "CN-109119": ISSM };
  const routeTo = (f) => { const cc = (f.components || [])[0]; const o = COMPOWN[cc]; return o ? { who: o, why: `owner of ${compName(cc)}` } : { who: SO, why: "system owner, the fallback" }; };
  function itemFor(f) { return itemOf(f.id); }
  K.on("drf.item", (fid) => {
    const f = fById(fid); if (!f) return;
    const peers = sameWeak(f).filter((x) => x.id !== f.id), open = peers.map((x) => [x, itemOf(x.id)]).find((p) => p[1] && p[1].status !== "completed");
    const to = routeTo(f);
    if (open) {
      K.confirm({ title: "Join the open item", submit: "Join item", text: `An item is already open for this weakness (${esc(weakWords(f))}): <b>${esc(open[1].title)}</b>. The finding joins it instead of opening a second.`, onOk: () => { patchMap("join", fid, open[0].id); K.toast(`Joined ${clip(open[1].title, 50)}: no second item`); K.redraw(); } });
      return;
    }
    K.form({ title: "Create POA&M item", submit: "Create item", intro: `It goes to ${esc(to.who)} (${esc(to.why)}). While it is open, findings of the same weakness join it.`,
      fields: [{ key: "title", label: "Item", required: true, value: `Remediate ${f.stig ? f.stig.v || "" : f.cve ? f.cve.cve : ""} ${f.control ? "(" + f.control + ")" : ""} on ${compName((f.components || [])[0]) || "WS-X90"}`.replace(/\s+/g, " ").trim() },
        { key: "planned", label: "Planned completion", type: "date", required: true, value: f.due && f.due > TODAY ? f.due : addDays(TODAY, 90) }],
      onSubmit: (v) => { patchMap("items", fid, { id: "it-" + hash(fid), title: v.title, owner: to.who, planned: v.planned, at: TODAY, status: "open", reached: 0, total: 0, ms: [] }); K.toast(`POA&M item created and routed to ${to.who}`); K.redraw(); return null; } });
  });
  K.on("drf.item.check", (cid) => {
    const c = checkBy(cid); if (!c) return;
    const r = c.failing.find((x) => x.fid && !itemOf(x.fid)); if (!r) { K.toast("Every failing finding has an item"); return; }
    K.go(fRoute(r.fid));
    K.toast("The first failing finding with no item: create it from its page");
  });

  // Docked panes (rec 24): notes, tickets, tasks, kept per finding.
  const paneList = (kind, fid, empty, row) => { const L = get(kind, {})[fid] || []; return L.length ? `<ul class="drf-pane-l">${L.slice().reverse().map(row).join("")}</ul>` : `<p class="drf-pane-e">${esc(empty)}</p>`; };
  const notesPane = (fid) => () => `${paneList("notes", fid, "No notes yet.", (n) => `<li><div class="drf-pane-m"><b>${esc(n.by)}</b>${mu(" · " + md(n.at))}</div><p>${esc(n.text)}</p></li>`)}<div class="drf-pane-f"><label class="k3-sr" for="drf-note">Add a note</label><textarea id="drf-note" rows="3" placeholder="Add a note for the program"></textarea>${K.btn("Add note", { sm: true, act: "drf.note", arg: fid })}</div>`;
  const ticketsPane = (fid) => () => `${paneList("tickets", fid, "No ticket yet.", (t) => `<li><div class="drf-pane-m"><b class="num">${esc(t.key)}</b>${mu(" · " + t.dest)}</div><p>${esc(t.title)}</p><div class="drf-pane-m">${K.status("Open", "none")}${mu(" · " + t.who)}</div></li>`)}<div class="drf-pane-f">${K.btn("Create ticket", { sm: true, act: "drf.ticket", arg: fid })}</div>`;
  const tasksPane = (fid) => () => `${paneList("tasks", fid, "No task yet.", (t, i) => `<li><div class="drf-pane-m"><b>${esc(t.title)}</b></div><div class="drf-pane-m">${K.owner(t.who)}${mu(" · due " + md(t.due))}</div></li>`)}<div class="drf-pane-f">${K.btn("Add task", { sm: true, act: "drf.task", arg: fid })}</div>`;
  K.on("drf.note", (fid, el) => { const ta = document.getElementById("drf-note"); const text = ta ? ta.value.trim() : ""; if (!text) { K.toast("Write the note first"); if (ta) ta.focus(); return; } pushMap("notes", fid, { by: ME, at: TODAY, text }); K.toast("Note added"); K.redraw(); });
  K.on("drf.ticket", (fid) => { const f = fById(fid); K.form({ title: "Create ticket", submit: "Create ticket", intro: "The ticket is kept on this finding; the prototype sends it nowhere.", fields: [{ key: "title", label: "Summary", required: true, value: f ? clip(f.title, 90) : "" }, { key: "dest", label: "Destination", type: "select", required: true, value: "Engineering change request", options: ["Engineering change request", "Depot work order", "Program Jira"] }, { key: "who", label: "Assignee", type: "select", required: true, value: f ? routeTo(f).who : ISSM, options: people() }],
    onSubmit: (v) => { const n = (get("tickets", {})[fid] || []).length + Object.values(get("tickets", {})).reduce((s, l) => s + l.length, 0); pushMap("tickets", fid, { key: `WSX-${4100 + n + 1}`, title: v.title, dest: v.dest, who: v.who, at: TODAY }); K.toast("Ticket created"); K.redraw(); return null; } }); });
  K.on("drf.task", (fid) => { K.form({ title: "Add task", submit: "Add task", fields: [{ key: "title", label: "Task", required: true }, { key: "who", label: "Assignee", type: "select", required: true, value: ME, options: people() }, { key: "due", label: "Due", type: "date", required: true, value: addDays(TODAY, 14) }],
    onSubmit: (v) => { pushMap("tasks", fid, { title: v.title, who: v.who, due: v.due, at: TODAY }); K.toast("Task added"); K.redraw(); return null; } }); });

  function findingPage(fid) {
    const f = fById(fid), review = D.review({ title: "Finding record", current: f && K.recRoute ? K.recRoute("k3e-finding", f.id) || "findings" : "findings" });
    if (!f) return K.page({ cls: "k3d drf", head: review + K.head({ crumbs: [["Findings", "findings"], ["Not found"]], title: "This finding is no longer here" }), body: K.empty({ title: "Nothing at this address", action: K.btn("Open the checks", { sm: true, go: "dr-checks" }) }) });
    const c = checkOfF(f.id), it = itemFor(f), weak = sameWeak(f), to = routeTo(f);
    const opened = f.opened || (c ? c.since || c.added : "") || "";
    const msList = it && it.ms ? it.ms : [];
    const msOpen = msList.filter((m) => !(m.done || m.status === "completed")).length;
    const code = f.stig ? f.stig.v || String(f.id).split("|")[1] : f.cve ? f.cve.cve : String(f.id).slice(0, 8);
    const tone = SEV[f.sev] ? (SEV[f.sev][1] === "none" ? "warn" : SEV[f.sev][1]) : "none";
    const dec = c ? activeDec(c, f.id) : null;
    const primary = dec ? null : it ? (it.v3 ? { label: "Add milestone", act: "k3e.f.ms", arg: f.id } : null) : { label: "Create POA&M item", act: "drf.item", arg: f.id };
    const more = [c && !dec ? { label: "Record decision", act: "drf.dec", arg: { check: c.id, key: f.id } } : null, { label: "Open in Findings", go: K.recRoute ? K.recRoute("k3e-finding", f.id) || "findings" : "findings" }].filter(Boolean);
    const short = clip(String(f.title).replace(/^V-\d+\s+/, ""), 72);
    const head = D.head({ review, crumbs: [["Findings", "findings"], c ? [clip(c.name, 44), chkRoute(c, "findings")] : null, [clip(short, 40)]].filter(Boolean), id: { code, tone }, title: short,
      facts: [["Severity", sevPill(f)], ["Component", compLink((f.components || [])[0])], ["Control", f.control ? K.link(f.control, ctlRoute(f.control)) : none()], ["Owner", f.owner ? K.owner(f.owner) : `${K.owner(to.who)} ${mu("· routed")}`], f.due ? ["Remediate by", `<span class="num${f.due < TODAY ? " drf-warnw" : ""}">${esc(mdy(f.due))}</span>`] : null, c ? ["Found by", K.link(clip(c.name, 40), chkRoute(c))] : null],
      actions: { more, primary } });
    const nums = D.numbers([
      { label: "Track", metric: "Days open", n: opened ? daysSince(opened) : 0, tone: f.due && f.due < TODAY ? "bad" : "none", since: opened ? `since ${md(opened)}${f.opened ? "" : ", the run that found it"}` : "" },
      { label: "Fix", metric: "Affected items", n: weak.length, since: weak.length > 1 ? weakWords(f) : "This finding alone", links: weak.length > 1 ? [{ label: "View affected items", act: () => { const el = document.getElementById("drf-aff"); if (el) el.scrollIntoView({ block: "start", behavior: "smooth" }); } }] : [] },
      { label: "Manage", metric: "Milestones in progress", n: it ? `${msOpen} of ${msList.length}` : 0, since: it ? clip(it.title, 60) : "No POA&M item yet", links: it ? (it.v3 ? [{ label: "Add milestone", act: "k3e.f.ms", arg: f.id }] : []) : dec ? [] : [{ label: "Create POA&M item", act: "drf.item", arg: f.id }] }]);
    // Routing (rec 18): the rule, and the one item it made.
    const peersOn = it ? findingsAll().filter((x) => isOpenF(x) && x.id !== f.id && (itemOf(x.id) || {}).id === it.id) : [];
    const routing = D.box("Routing", [K.facts([
      ["Goes to", `${K.owner(to.who)} ${mu("· " + to.why)}`],
      ["Fallback", `${esc(SO)} ${mu("· system owner, for a component with no owner")}`],
      ["No duplicates", esc(`No second item while one is open for the same weakness: ${weakWords(f)}`)],
      ["The item it made", it ? `${esc(clip(it.title, 70))}${it.joined ? " " + mu("· joined, not a second item") : ""}` : dec ? mu("None: a decision leaves it out") : warnW("None yet")],
      it ? ["Owner", `${K.owner(it.owner || to.who)}${it.owner && it.owner !== to.who ? " " + mu("· set by hand before the rule") : ""}`] : null,
      it && peersOn.length ? ["Also on it", `${plural(peersOn.length, "other finding")} ${mu("· held back from opening their own")}`] : null])]);
    const aff = weak.length > 1 ? `<div id="drf-aff">${D.box("Affected items", [K.table({ label: "Affected items", cols: [{ label: "Finding" }, { label: "Severity", cls: "nw" }, { label: "POA&M item", cls: "nw" }], rows: weak.map((x) => ({ go: x.id === f.id ? undefined : fRoute(x.id), cls: x.id === f.id ? "drf-cur" : "", cells: [K.name(x.title), sevPill(x), (() => { const i2 = itemOf(x.id); return i2 ? `<span class="drf-item" title="${esc(i2.title)}">${esc(clip(i2.title, 30))}</span>` : warnW("No item"); })()] })) })], { actions: `<span class="num k3-muted">${fmt(weak.length)}</span>` })}</div>` : "";
    const msBox = it ? D.box("Milestones", [msList.length ? K.table({ label: "Milestones", cols: [{ label: "Milestone" }, { label: "Planned", cls: "nw" }, { label: "State", cls: "nw" }], rows: msList.map((m) => ({ cells: [K.name(m.title), m.planned ? num(mdy(m.planned)) : none(), m.done || m.status === "completed" ? K.status("Reached", "ok") : m.planned && m.planned < TODAY ? K.status("Past its date", "bad") : K.status("Planned", "none")] })) }) : `<p class="drf-p">${mu("No milestone yet")}</p>`]) : "";
    const found = f.stig ? `${f.stig.stig} on ${f.stig.asset}: the rule is open.` : f.cve ? `${f.cve.title || f.title}. ${f.cve.iava ? f.cve.iava + " · " : ""}${f.cve.status || ""}` : f.text || f.note || "";
    const what = found ? D.box("What was found", [`<p class="drf-p">${esc(found)}</p>`]) : "";
    // The rule it fails (version 24): a STIG rule's check and fix text, as mod-v8-dod holds them.
    const rt = f.kind === "stig" ? ruleText(f.id) : null;
    const ruleBox = rt ? `<div class="drf-wide">${D.box("The rule", [`<div class="drf-rule drf-rule2">${rt.stigId ? `<p class="drf-cap">STIG ID <span class="num">${esc(rt.stigId)}</span></p>` : ""}<div class="drf-rule-c">${ruleSec("Check text", rt.check, true)}${ruleSec("Fix text", rt.fix, true)}</div>${ruleSec("Discussion", rt.disc, false)}</div>`])}</div>` : "";
    const decBox = dec ? D.box("Decision", [K.facts([["Decision", `<span class="drf-dec">${esc(DK[dec.kind][0])}</span>`], ["Why", esc(dec.reason)], ["Signed by", `${esc(dec.by)} ${mu("· " + dec.role)}`], ["When", num(mdy(dec.at))], ["Ends", num(mdy(dec.ends))]])]) : "";
    const counts = { notes: (get("notes", {})[f.id] || []).length, tickets: (get("tickets", {})[f.id] || []).length, tasks: (get("tasks", {})[f.id] || []).length };
    const dock = D.dock({ id: "drf-f", items: [{ key: "notes", icon: "chat", label: "Notes", count: counts.notes, pane: notesPane(f.id) }, { key: "tickets", icon: "link", label: "Tickets", count: counts.tickets, pane: ticketsPane(f.id) }, { key: "tasks", icon: "task", label: "Tasks", count: counts.tasks, pane: tasksPane(f.id) }] });
    return K.page({ cls: "k3d drf drf-rec drf-fp", head, body: [D.sunken([nums, `<div class="drf-grid">${[decBox, routing, what, msBox, ruleBox].filter(Boolean).join("")}</div>`, aff]), dock] });
  }
  D.routeLike("dr-finding", (id) => findingPage(id), { nav: "findings" });
})();
