// Prototype V3, lane F (v3f-): one store per fact. A fact has one source; every page that shows it reads that source at draw time,
// and an action moves it everywhere. Inert while V3 is off (PA.v3.S/P/M wrappers; every listener returns at once).
// Facts it publishes (PA.v3.facts, read with PA.v3.fact(name, …)), WS-X90 (PRG-1090) only; another program answers undefined:
//   controls(prog)     { total, satisfied, partially_satisfied, other_than_satisfied, not_assessed, no_evidence, no_requirement,
//                        inherited, hybrid }: each control's live status (PA.v2.chain.view, increment 2 once published, the host's
//                        inheritance already in PA.SSP), summed; equals PA.v2.chain.counts()
//   status(code)       one control's live status;  objectives() { total, mapped, evidenced, assessed }
//   issues(prog)       { open, bySev, pastDue }   risks(prog) { open, noOwner, bySev }   poam(prog) { items, open, completed }
//                      (the live registers, PA.riskLookup.all())
//   evidence(prog)     { total, accepted, pending, revise } (the Evidence register's quick views, PA.v2hubs.count)
//   requirements(prog) { total, drafts }   setup(prog) { done, total, steps }   people(prog) [{ name, role, rmf, ssp, decides }]
//   snapshots(prog)    [{ at, sat, total, cs, live }] newest first   techniques() { total, enterprise, ics, named }   customer()
// State (PA.v2 state, cleared by PA.v2.reset()): v3.F.drafts { at, by } the Requirement drafter's run approved (REQ-641–643 join
//   the register); v3.F.elog { prog } the Event log's program filter.
(function () {
  const PA = window.PA, V3 = PA && PA.v3, V = PA && PA.v2;
  if (!V3 || !V || !PA.h || !PA.AK || !PA.SSP) return;
  const { S, P, M, h } = PA;
  const AK = PA.AK, SSP = PA.SSP;
  const { esc, fmt } = h;
  const WSX = "PRG-1090", ME = "Ingrid Solberg", TODAY_ISO = "2026-11-17";
  const on = () => V3.on();
  const CH = () => V.chain || null;
  const get = (p, d) => V.get("v3.F." + p, d);
  const put = (p, v) => V.set("v3.F." + p, v);
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const md = (iso) => (iso ? new Date(String(iso).slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
  const DASH = '<span class="v2-dash" aria-label="None">—</span>';

  // ——— Editing drawn markup: parse, change, serialize (a failure keeps the page as it was) ———
  function edit(html, fn) {
    if (typeof html !== "string") return html;
    const t = document.createElement("template"); t.innerHTML = html;
    try { fn(t.content); } catch (e) { console.error("v3f", e); return html; }
    return t.innerHTML;
  }
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  const setNum = (el, n) => { if (el) el.textContent = fmt(n); };
  // A tab, a quick view or a chip whose label starts with label: its count becomes n.
  function setCount(root, label, n) {
    const want = label.toLowerCase();
    for (const el of root.querySelectorAll("[role='tab'], .qv, .chip, .tab, .ak-tab")) {
      const t = txt(el).toLowerCase(); if (!t.startsWith(want)) continue;
      const c = el.querySelector(".ct, .num, .n"); if (c) setNum(c, n);
    }
  }

  // ════════════════ The control status store ════════════════
  const DETS = new Set(["satisfied", "partially_satisfied", "other_than_satisfied"]);
  const ORDER = ["satisfied", "partially_satisfied", "other_than_satisfied", "not_assessed", "no_evidence", "no_requirement"];
  const WORD = { satisfied: "Satisfied", partially_satisfied: "Partially satisfied", other_than_satisfied: "Other than satisfied", not_assessed: "Not assessed", no_evidence: "No evidence", no_requirement: "No requirement" };
  // Increment 2's 20 determinations (mod-after-tests.js INC2): they decide once the results are published, as chain.counts() counts.
  const INC2 = { "AC-17(3)": "satisfied", "AC-17(4)": "partially_satisfied", "AU-6(3)": "satisfied", "AU-12(1)": "satisfied", "CA-3": "partially_satisfied", "CM-8(2)": "satisfied", "CM-11(2)": "satisfied", "CM-12(1)": "not_assessed", "CM-14": "satisfied", "IA-1": "satisfied", "IA-2(1)": "satisfied", "IA-2(2)": "other_than_satisfied", "IA-2(6)": "satisfied", "IA-2(8)": "satisfied", "IA-2(12)": "not_assessed", "IA-3(1)": "partially_satisfied", "IR-9": "satisfied", "MA-3(5)": "partially_satisfied", "SC-28(3)": "satisfied", "SR-10": "satisfied" };
  // Cache: everything is read again after any state write or route change.
  let GEN = 0;
  V.on(() => { GEN++; });
  window.addEventListener("hashchange", () => { GEN++; });
  const memo = (fn) => { const box = new Map(); let g = -1; return (...a) => { if (g !== GEN) { box.clear(); g = GEN; } const k = a.join("|"); if (!box.has(k)) box.set(k, fn(...a)); return box.get(k); }; };
  const i2on = () => { const ch = CH(); return !!(ch && ch.inc2 && ch.inc2()); };
  function view(code) { const ch = CH(); return ch ? ch.view(code) : null; }
  function status(code) {
    const v = view(code), b = SSP.ctl(code) || {};
    let s = v ? v.status : b.cs || "no_requirement";
    // A published determination decides a control not yet judged, and replaces an older one (AU-6(3) and AU-12(1) were Partially
    // satisfied in increment 1 and retested). chain.counts() moves 18 Not assessed instead, two more than the controls themselves.
    if (i2on() && INC2[code] && !(v && v.det) && INC2[code] !== "not_assessed" && (s === "not_assessed" || DETS.has(s))) s = INC2[code];
    return s;
  }
  const controlsWSX = memo(() => {
    const c = { total: SSP.controls.length }; ORDER.forEach((k) => { c[k] = 0; });
    for (const x of SSP.controls) c[status(x.c)] = (c[status(x.c)] || 0) + 1;
    const hc = PA.v2host ? PA.v2host.counts() : null;
    c.inherited = hc ? hc.inh : 0; c.hybrid = hc ? hc.hyb : 0;
    return c;
  });
  const objectives = memo(() => {
    let total = 0, mapped = 0, evidenced = 0, assessed = 0;
    for (const x of SSP.controls) {
      const v = view(x.c) || { ob: x.ob, om: x.om, oe: x.oe, oa: x.oa };
      total += v.ob; mapped += v.om; evidenced += v.oe;
      assessed += i2on() && INC2[x.c] && INC2[x.c] !== "not_assessed" && !(v.det) && (v.status === "not_assessed" || DETS.has(v.status)) ? v.ob : v.oa;
    }
    return { total, mapped, evidenced, assessed };
  });
  // The finding behind a determination: the walk's own, else the latest published finding the records hold for it.
  const RES = { init: ["SAR · initial authorization", "WS-X90 Initial Authorization Security Assessment", "assessments"], inc1: ["SAR · expanded set, increment 1", "WS-X90 Expanded Control Set Assessment", "campaign"], inc2: ["Increment 2 results", "WS-X90 Expanded Control Set Assessment", "campaign"] };
  function findingOf(code) {
    const v = view(code);
    if (v && v.det && v.camp) return { det: v.det, res: (CH().results(v.camp.id) || {}).title || v.camp.short, camp: v.camp.short, route: v.camp.route, date: v.s.pubAt || TODAY_ISO };
    const af = ((PA.SCTMD && PA.SCTMD.af) || []).filter((x) => x.code === code && (x.res !== "inc2" || i2on()) && DETS.has(x.det)).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
    if (af) { const r = RES[af.res] || [af.res, "", "assessments"]; return { det: af.det, res: r[0], camp: r[1], route: r[2], date: af.date }; }
    if (i2on() && INC2[code] && DETS.has(INC2[code])) return { det: INC2[code], res: RES.inc2[0], camp: RES.inc2[1], route: "campaign", date: (CH().inc2() || {}).at || TODAY_ISO };
    return null;
  }

  // ════════════════ Issues, risks, POA&M items, evidence: the live registers ════════════════
  const regs = () => (PA.riskLookup ? PA.riskLookup.all() : { ISS: [], RISKS: [], POAM: [] });
  const sevs = (list) => { const o = { critical: 0, high: 0, moderate: 0, low: 0 }; list.forEach((x) => { if (x.sev in o) o[x.sev]++; }); return o; };
  const issuesWSX = memo(() => { const L = regs().ISS; return { open: L.length, bySev: sevs(L), pastDue: L.filter((x) => x.late).length, placed: L.filter((x) => !x.chain).length - 1 }; });
  const risksWSX = memo(() => { const L = regs().RISKS; return { open: L.length, noOwner: L.filter((x) => !x.owner).length, bySev: sevs(L) }; });
  const poamWSX = memo(() => { const L = regs().POAM; const done = L.filter((x) => x.status === "completed").length; return { items: L.length, open: L.length - done, completed: done }; });
  const hub = (route, label, d) => { const H = PA.v2hubs; const n = H ? H.count(route, label) : null; return n == null ? d : n; };
  const evidenceWSX = memo(() => ({ total: hub("evidence", "All", 368), pending: hub("evidence", "Pending review", 88), revise: hub("evidence", "Needs revision", 54), accepted: hub("evidence", "Accepted", 226) }));

  // ════════════════ Requirements: the register, and the Requirement drafter's run once approved ════════════════
  const DRAFTS = [
    ["REQ-641", "Mission functions continue through the compromise of one element", "SA-24", ["CN-109000"], "WS-X90 shall apply the nine cyber resiliency techniques SA-24_ODP[03] names, Adaptive Response through Substantiated Integrity, to the Mission Computing and Communications subsystems."],
    ["REQ-642", "Cyber resiliency goals and techniques are traced to the design at each block review", "SA-24", ["CN-109000"], "Each block review traces the cyber resiliency goals and techniques SA-24's parameters set to the design elements that carry them."],
    ["REQ-643", "A compromised partition is restored from a trusted image within one sortie", "SC-34", ["CN-109101"], "The Mission Computer and Secure Boot Controller shall load the operating system and applications from hardware-enforced read-only media."],
  ];
  const draftsIn = () => !!get("drafts", null);
  const requirementsWSX = memo(() => ({ total: 640 + (draftsIn() ? DRAFTS.length : 0), drafts: draftsIn() ? DRAFTS.map((d) => d[0]) : [] }));

  // ════════════════ People & roles: one record a program ════════════════
  // WS-X90's role holders: program_role_assignments (People), the ITCSC's §11 team, the life cycle's deciders (PA.v2life WHO) and
  // the SSP's editors, as one list. Local developer, a seeded test account, holds no role here.
  const PEOPLE_WSX = [
    { name: "R. Calloway", role: "Authorizing official", rmf: "AO", org: "Weapons AO office", ssp: "Viewer", decides: "Categorization, IATT and ATO" },
    { name: "Lena Marsh", role: "Authorizing official designated representative", rmf: "AODR", org: "Weapons AO office", ssp: "Viewer", decides: null },
    { name: "R. Feldman", role: "Milestone decision authority", rmf: null, org: "Program executive office", ssp: null, decides: "Milestones A, B and C" },
    { name: "Ray Colston", role: "Program manager and system owner", rmf: "PM/SO", org: "Program office", ssp: "Editor", decides: "Operational steps" },
    { name: "D. Okafor", role: "Lead assessor", rmf: "SCA", org: "Assessment team", ssp: "Commenter", decides: "Control selection and the SAR" },
    { name: "Nadia Fournier", role: "Assessor", rmf: "SCA", org: "Assessment team", ssp: "Commenter", decides: null },
    { name: "Joel Barrantes", role: "Information system security manager", rmf: "ISSM", org: "Program office", ssp: "Editor", decides: "RMF steps, first" },
    { name: "Priya Raghavan", role: "Information system security officer", rmf: "ISSO", org: "Program office", ssp: "Editor", decides: null },
    { name: ME, role: "Information system security engineer", rmf: "ISSE", org: "Program office", ssp: "Editor", decides: null },
    { name: "Marcus Ryde", role: "Chief engineer", rmf: null, org: "Program office", ssp: "Editor", decides: "Engineering reviews: SRR, SFR, PDR, CDR" },
    { name: "Capt. T. Abara", role: "User representative", rmf: "User rep", org: "Operating squadron", ssp: null, decides: null },
    { name: "Sam Ortega", role: "Requirements lead", rmf: null, org: "Program office", ssp: null, decides: null },
    { name: "Victor Amsel", role: "Engineer", rmf: null, org: "Program office", ssp: null, decides: null },
    { name: "Amara Bell", role: "Contingency plan owner", rmf: null, org: "Program office", ssp: null, decides: null },
    { name: "Wes Duarte", role: "Cyber resiliency exercise owner", rmf: null, org: "Program office", ssp: null, decides: null },
  ];
  const personOf = (n) => PEOPLE_WSX.find((p) => p.name === n) || null;

  // ════════════════ Control status snapshots: one rule for every day ════════════════
  // The daily job counts every control of the baseline at its status, inherited controls at their provider's (the host's default
  // responsibilities, PA.v2host.DEF). Today's (23:55) is the live count; the days before add the same inheritance to what they read.
  const OWN = [["2026-11-16", { satisfied: 176, partially_satisfied: 34, other_than_satisfied: 13, not_assessed: 90, no_evidence: 233, no_requirement: 14 }],
    ["2026-11-15", { satisfied: 176, partially_satisfied: 34, other_than_satisfied: 13, not_assessed: 90, no_evidence: 233, no_requirement: 14 }],
    ["2026-11-14", { satisfied: 174, partially_satisfied: 34, other_than_satisfied: 13, not_assessed: 90, no_evidence: 235, no_requirement: 14 }],
    ["2026-11-13", { satisfied: 174, partially_satisfied: 34, other_than_satisfied: 13, not_assessed: 90, no_evidence: 235, no_requirement: 14 }]];
  const snapshotsWSX = memo(() => {
    const dd = (PA.v2host && PA.v2host.DEF && PA.v2host.DEF.dd) || {};
    const c = controlsWSX();
    const today = { at: TODAY_ISO + "T23:55", sat: c.satisfied, total: c.total, cs: Object.fromEntries(ORDER.map((k) => [k, c[k]])), live: true };
    return [today, ...OWN.map(([d, o]) => { const cs = Object.fromEntries(ORDER.map((k) => [k, (o[k] || 0) + (dd[k] || 0)])); return { at: d + "T23:55", sat: cs.satisfied, total: 560, cs, live: false }; })];
  });
  const snapOn = (iso) => snapshotsWSX().find((s) => s.at.slice(0, 10) === String(iso).slice(0, 10)) || null;

  // ════════════════ The setup checklist: one object, one fraction ════════════════
  const setupWSX = memo(() => {
    const c = controlsWSX(), r = risksWSX(), ssp = PA.v2hubs ? PA.v2hubs.ssp() : "draft";
    const roles = ["AO", "SCA", "ISSM", "ISSO"].every((k) => PEOPLE_WSX.some((p) => p.rmf === k));
    const ph = (SSP.counts && SSP.counts.placeholders) || 0;
    const steps = [
      { id: "itcsc", label: "Approve the ITCSC", done: true, sub: "Version 3, approved Sep 2", route: "itcsc" },
      { id: "itcsc2", label: "Re-approve the ITCSC for the 2 external interfaces added since version 3", done: false, sub: "Interconnections IC-110 and IC-111", route: "itcsc" },
      { id: "roles", label: "Record WS-X90's roles", done: roles, sub: `${PEOPLE_WSX.filter((p) => p.rmf).length} RMF roles held · People & roles`, route: "people" },
      { id: "req", label: "Map a requirement to every control", done: c.no_requirement === 0, sub: c.no_requirement ? `${plural(c.no_requirement, "control")} with no requirement` : "Every control has a requirement", route: "controls", q: { filter: { qv: "All" } } },
      { id: "risk", label: "Give every open risk an owner", done: r.noOwner === 0, sub: r.noOwner ? `${plural(r.noOwner, "open risk")} with no owner` : "Every open risk has an owner", route: "risks" },
      { id: "narr", label: "Replace SSP 3's placeholder narratives", done: ph === 0, sub: ph ? `${plural(ph, "placeholder narrative")} in SSP 3` : "None left", route: "ssp" },
      { id: "submit", label: "Submit SSP 3 for review", done: ssp !== "draft" && ssp !== "changes", sub: ssp === "draft" ? "Draft" : ssp === "changes" ? "Changes requested" : ssp === "submitted" ? "In review" : "Approved", route: "ssp-review" },
    ];
    return { done: steps.filter((s) => s.done).length, total: steps.length, steps, next: steps.find((s) => !s.done) || null };
  });

  // ════════════════ Words: WS-X90's own customer ════════════════
  const CUSTOMER = { name: "F-16 SPO", long: "the F-16 System Program Office", tailoring: "F-16 SPO Tailoring" };
  const TECH = { total: 32, enterprise: 31, ics: 1, named: 31 };

  // ════════════════ Publish ════════════════
  const only = (fn) => (prog) => (!prog || prog === WSX ? fn() : undefined);
  Object.assign(V3.facts, {
    controls: only(controlsWSX), status: (code) => status(code), objectives: () => objectives(), finding: (code) => findingOf(code),
    issues: only(issuesWSX), risks: only(risksWSX), poam: only(poamWSX), evidence: only(evidenceWSX), requirements: only(requirementsWSX),
    setup: only(setupWSX), people: only(() => PEOPLE_WSX.map((p) => ({ ...p }))), snapshots: only(snapshotsWSX),
    techniques: () => ({ ...TECH }), customer: () => ({ ...CUSTOMER }),
  });
  PA.v3f = { status, controls: controlsWSX, objectives, issues: issuesWSX, risks: risksWSX, poam: poamWSX, evidence: evidenceWSX, snapshots: snapshotsWSX, setup: setupWSX, INC2, DRAFTS };

  // ════════════════ Drawing helpers ════════════════
  const COL = { satisfied: "var(--ok)", partially_satisfied: "var(--warn)", other_than_satisfied: "var(--bad)", not_assessed: "var(--info)", no_evidence: "var(--ink-4)", no_requirement: "var(--line-strong)" };
  // A status strip and its legend, drawn from counts c, wherever the page drew them (Baseline, Overview).
  function liveStrip(root, c) {
    for (const st of root.querySelectorAll(".stack.v7p-stack, .v7p-stack")) {
      st.innerHTML = ORDER.map((k) => (c[k] ? `<i style="flex:${c[k]};background:${COL[k]}" title="${esc(WORD[k])}: ${c[k]}"></i>` : "")).join("");
      st.setAttribute("aria-label", ORDER.map((k) => `${WORD[k]} ${c[k] || 0}`).join(", "));
    }
    for (const lg of root.querySelectorAll(".legend.v7p-legend, .v7p-legend")) {
      for (const sp of lg.children) { const b = sp.querySelector("b"); const lab = txt(sp).replace(/[\d,]+$/, "").trim(); const k = ORDER.find((x) => WORD[x] === lab); if (b && k) setNum(b, c[k] || 0); }
    }
  }

  // ════════════════ B03 C07 C22: Baseline reads the live store ════════════════
  V3.S("baseline", (orig) => {
    const html = orig(); if (!V3.wsx()) return html;
    const c = controlsWSX();
    return custA(edit(html, (root) => {
      liveStrip(root, c);
      // The List: each family's statuses from the same store.
      const tbl = root.querySelector('table[aria-label="Controls by family"]');
      if (tbl) {
        const fam = {}; for (const x of SSP.controls) { const f = (fam[x.f] = fam[x.f] || {}); const s = status(x.c); f[s] = (f[s] || 0) + 1; }
        for (const tr of tbl.querySelectorAll("tbody tr")) {
          const f = txt(tr.cells[0]).split(" ")[0], st = fam[f] || {}, cells = tr.cells; if (cells.length < 8) continue;
          setNum(cells[4], st.satisfied || 0); setNum(cells[5], (st.partially_satisfied || 0) + (st.other_than_satisfied || 0)); setNum(cells[6], st.not_assessed || 0); setNum(cells[7], (st.no_evidence || 0) + (st.no_requirement || 0));
        }
      }
    }));
  });
  // C22: WS-X90's tailoring layer and its customer carry WS-X90's own customer's name; "Customer A" stays the X800 program's.
  const custA = (html) => (typeof html === "string" ? html.replace(/Customer A Tailoring/g, CUSTOMER.tailoring).replace(/With Customer A and tailoring/g, `With the ${CUSTOMER.name}'s and the program's tailoring`) : html);
  V3.P("v7p-layer", (orig, id) => { const o = orig(); if (!o || !V3.wsx()) return o; return { ...o, body: custA(o.body) }; });

  // ════════════════ B03 C20: Controls reads the same store; component inheritance is a responsibility ════════════════
  // AU-7 is inherited from the Audit Log Collector's published component assessment (mod-after-tests.js CHIST, mod-compliance.js).
  const COMP_INH = { "AU-7": "Audit Log Collector 1" };
  const pillFor = (root, s) => { const w = WORD[s]; const hit = [...root.querySelectorAll(".pill, [class*='pill']")].find((x) => txt(x) === w); return hit ? hit.outerHTML : (CH() ? CH().stPill(s) : h.pill("none", w)); };
  V3.S(/^(controls|after-controls-index)$/, (orig) => {
    const html = orig(); if (!V3.wsx()) return html;
    const c = controlsWSX();
    return edit(html, (root) => {
      const Q = { "Needs evidence": c.no_evidence, "Not assessed": c.not_assessed, "Short of satisfied": c.partially_satisfied + c.other_than_satisfied };
      for (const el of root.querySelectorAll(".qv")) { const lab = txt(el).replace(/[\d,]+$/, "").trim(); if (lab in Q) setNum(el.querySelector(".num"), Q[lab]); }
      const comp = root.querySelector(".a-tests-cards"); if (comp) comp.innerHTML = comp.innerHTML.replace(/\b\d+(?= of 560| controls satisfied)/, String(c.satisfied)).replace(/\b\d+%/, pct(c.satisfied, c.total) + "%");
      for (const tr of root.querySelectorAll("tbody tr[data-id]")) {
        const code = tr.getAttribute("data-id"), cells = tr.cells; if (cells.length < 8) continue;
        const s = status(code), shown = txt(cells[3]);
        if (WORD[s] && shown !== WORD[s]) cells[3].innerHTML = pillFor(root, s);
        if (COMP_INH[code]) { cells[4].innerHTML = `Inherited <span class="a-tests-mu">· ${esc(COMP_INH[code])}</span>`; if (txt(cells[6]) === "Inherited") cells[6].innerHTML = DASH; }
      }
    });
  });
  // The finding that set a control's status, and its campaign, in the control's preview and on its page.
  function findingFix(body, code) {
    if (typeof body !== "string" || !/No assessment has judged|nobody has judged it yet|Campaign<\/dt><dd><span class="v2-dash"/.test(body)) return body;
    const s = status(code), f = findingOf(code);
    if (COMP_INH[code] && DETS.has(s)) {
      return body.replace(/<p class="v2k-none">No assessment has judged[^<]*<\/p>/, `<div class="v2k-li">${CH().stPill(s)}<span class="x">${esc(COMP_INH[code])} component assessment<span class="v2k-sub">G25 launch control component set · published · inherited</span></span></div>`);
    }
    if (!f || !DETS.has(s)) return body;
    const line = `<div class="v2k-li" data-v2k-go="findings-assessment" data-v2k-q="${esc(JSON.stringify({ rows: [code], note: `Showing ${code}'s assessment findings` }))}" role="link" tabindex="0">${CH().stPill(f.det)}<span class="x">Assessment finding · ${esc(f.res)}<span class="v2k-sub">${esc(f.camp)} · ${esc(md(f.date))}</span></span></div>`;
    return body.replace(/<p class="v2k-none">(No assessment has judged|[^<]*nobody has judged it yet)[^<]*<\/p>/, line)
      .replace(/(<dt>Campaign<\/dt><dd>)<span class="v2-dash"[^>]*>—<\/span>/, `$1<span class="ak-link" data-go="${esc(f.route)}" role="link" tabindex="0">${esc(f.camp)}</span>`);
  }
  V3.P("a-tests-control", (orig, id) => { const o = orig(); if (!o || !V3.wsx()) return o; const code = String(id || "").split("|")[0] || "SA-24"; return { ...o, body: findingFix(o.body, code) }; });
  V3.S(/^rec--a-tests-control--/, (orig, route) => { const html = orig(); if (!V3.wsx()) return html; let code = route.replace(/^rec--a-tests-control--/, "").split("|")[0]; try { code = decodeURIComponent(code); } catch (e) { /* as is */ } return findingFix(html, code); });

  // ════════════════ B04 C07 C27: Posture's band counts the live store and registers ════════════════
  ["posture", "posture-unevidenced", "posture-issues", "posture-risks"].forEach((route) => V3.S(route, (orig) => {
    const html = orig(); if (!V3.wsx()) return html;
    const o = objectives(), i = issuesWSX(), r = risksWSX();
    const placed = 43; // issues standing on an element (Posture's own count): the rest stand on none
    return edit(html, (root) => {
      setCount(root, "Objectives mapped", o.mapped); setCount(root, "Without evidence", o.mapped - o.evidenced); setCount(root, "Open issues", i.open); setCount(root, "Open risks", r.open);
      const ban = root.querySelector(".ak-banner, .banner, [class*='banner']");
      const line = route === "posture" ? `<b>${fmt(o.mapped)} of the baseline's ${fmt(o.total)} objectives</b> are mapped on an element; ${fmt(o.total - o.mapped)} are mapped nowhere yet.`
        : route === "posture-unevidenced" ? `<b>${fmt(o.mapped - o.evidenced)} mapped objectives have no evidence yet.</b> ${fmt(o.evidenced)} of the ${fmt(o.mapped)} do.`
        : route === "posture-issues" ? `<b>${fmt(i.bySev.critical + i.bySev.high)} open issues are critical or high.</b> ${fmt(Math.min(placed, i.open))} of the ${fmt(i.open)} stand on an element; ${fmt(Math.max(0, i.open - placed))} stand on none.`
        : `<b>${fmt(r.bySev.critical + r.bySev.high)} open risks are critical or high.</b> ${fmt(Math.min(40, r.open))} of the ${fmt(r.open)} stand on an element.`;
      // Lead, integration: the banner's text span, never its icon (.gl), which a selector list matched first.
      if (ban) { const t = ban.querySelector(".x") || ban.querySelector(".t") || ban.querySelector("span:not(.btn):not(.gl)") || ban; const keep = ban.querySelector(".btn"); if (t !== ban) t.innerHTML = line; else { ban.innerHTML = line; if (keep) ban.appendChild(keep); } }
      // The boundary's row pools what the walks mapped: its SA column and its total.
      if (route === "posture" || route === "posture-unevidenced") {
        const delta = SSP.controls.reduce((a, x) => { const v = view(x.c); return v ? a + (route === "posture" ? v.om - x.om : (v.om - v.oe) - (x.om - x.oe)) : a; }, 0);
        if (delta) for (const tr of root.querySelectorAll("table.v7a-heat tbody tr")) { if (!/CN-109000/.test(txt(tr.cells[0]))) continue; const tot = tr.querySelector(".v7a-htot"); if (tot) setNum(tot, (+txt(tot).replace(/,/g, "") || 0) + delta); }
      }
    });
  }));

  // ════════════════ C07: Cyber resiliency reads SA-24 from the chain ════════════════
  V3.S("resiliency", (orig) => {
    const html = orig(); if (!V3.wsx()) return html;
    const v = view("SA-24"); if (!v) return html;
    return html.replace(/(SA-24 Design for Cyber Resiliency<\/b> has )(\d+ of its \d+ objectives mapped|no requirement)/, `$1${fmt(v.om)} of its ${fmt(v.ob)} objectives mapped`);
  });

  // ════════════════ C08 C02: the Overview's open work and setup read the stores ════════════════
  V3.S("overview", (orig) => {
    const html = orig(); if (!V3.wsx()) return html;
    const i = issuesWSX(), r = risksWSX(), p = poamWSX(), e = evidenceWSX(), s = setupWSX();
    const c = controlsWSX();
    return edit(html, (root) => {
      liveStrip(root, c);
      for (const li of root.querySelectorAll(".v2-ov-li")) {
        const lab = txt(li.querySelector("b")), sub = li.querySelector(".v7p-mu"), n = li.querySelector("b.num");
        if (lab === "Operational issues") { setNum(n, i.open); if (sub) sub.textContent = `${i.pastDue} past due · ${plural(i.bySev.critical, "critical")}`; }
        else if (lab === "Open risks") { setNum(n, r.open); if (sub) sub.textContent = `${fmt(r.bySev.critical + r.bySev.high)} critical or high · ${fmt(r.noOwner)} with no owner`; }
        else if (lab === "POA&M items open") { setNum(n, p.open); if (sub) sub.textContent = `${fmt(p.completed)} of ${fmt(p.items)} completed`; }
        else if (lab === "Evidence to revise") { setNum(n, e.revise); if (sub) sub.textContent = `${fmt(e.pending)} waiting on review`; }
        else if (lab === "Set up WS-X90") {
          if (sub) sub.textContent = `${s.done} of ${s.total} steps done${s.next ? ` · next, ${s.next.label.toLowerCase()}` : ""}`;
          li.removeAttribute("data-go"); li.setAttribute("data-panel", "v3f-setup"); li.setAttribute("data-id", WSX); li.setAttribute("role", "button");
        }
      }
      // Team: the program's one people-and-roles record.
      const team = [...root.querySelectorAll(".v2-ov-team")][0];
      const dl = team && team.nextElementSibling && team.nextElementSibling.matches("dl") ? team.nextElementSibling : null;
      if (dl) dl.innerHTML = PEOPLE_WSX.filter((x) => x.rmf || x.decides).filter((x) => ["AO", "AODR", "PM/SO", "SCA", "ISSM", "ISSO", "ISSE"].includes(x.rmf) || x.name === "Marcus Ryde")
        .map((x) => `<dt>${esc(x.rmf && x.rmf !== "SCA" ? x.rmf : x.role)}</dt><dd>${AK.owner(x.name === ME ? ME + " (You)" : x.name)}</dd>`).join("");
    });
  });
  // The checklist itself: a preview from the Overview's setup row (Getting started folds into the Overview in V3).
  V3.P("v3f-setup", () => {
    const s = setupWSX();
    const row = (x) => `<div class="v2k-li v3f-step${x.done ? " done" : ""}" ${x.done ? "" : `data-go="${esc(x.route)}" role="link" tabindex="0"`}>${h.gl ? h.gl(x.done ? "check" : "ring") : ""}<span class="x">${x.done ? `<s>${esc(x.label)}</s>` : `<b>${esc(x.label)}</b>`}<span class="v2k-sub">${esc(x.sub)}</span></span></div>`;
    return { label: "Setup checklist preview", body: `<div class="v2k-pan v3f-setup">${AK.recordHead({ title: "Set up WS-X90" })}<dl class="ak-kv v2k-kv"><dt>Done</dt><dd class="num">${s.done} of ${s.total} steps</dd><dt>Next</dt><dd>${s.next ? esc(s.next.label) : "Nothing left"}</dd></dl><div class="ak-card v2k-lk">${s.steps.map(row).join("")}</div><p class="note-p">Each step reads the record it names. Workspace setup (catalog, deadlines, notifications) is in Settings.</p></div>` };
  });

  // ════════════════ C08: the assessor's request tracker, My work's assessor item ════════════════
  // The campaign's 368 evidence requests are the Evidence register's artifacts: Ready is Pending review, Flagged Needs revision.
  function trackerFix(html) {
    const e = evidenceWSX();
    return edit(html, (root) => {
      const ready0 = (() => { for (const el of root.querySelectorAll(".qv")) if (/^Ready\b/.test(txt(el))) return +txt(el).replace(/\D+/g, ""); return 88; })();
      const re = Math.max(0, ready0 - 88); // requests the team set Ready again on the campaign itself
      const want = { Ready: e.pending + re, Flagged: Math.max(0, e.revise - re), Accepted: e.accepted, All: e.total };
      for (const el of root.querySelectorAll(".qv")) { const lab = txt(el).replace(/[\d,]+$/, "").trim(); if (lab in want) setNum(el.querySelector(".num"), want[lab]); }
      for (const trk of root.querySelectorAll(".a-tests-trk")) {
        for (const sp of trk.querySelectorAll(".legend > span")) { const lab = txt(sp).replace(/[\d,]+$/, "").trim(); if (lab in want) setNum(sp.querySelector("b"), want[lab]); }
        const segs = trk.querySelectorAll(".stack > i"), tot = want.Ready + want.Flagged + want.Accepted || 1;
        if (segs.length === 3) [want.Ready, want.Flagged, want.Accepted].forEach((n, k) => { segs[k].style.width = `${(n / tot) * 100}%`; });
        const t = trk.querySelector(".a-tests-box-t"); if (t && t.firstChild && t.firstChild.nodeType === 3) t.firstChild.textContent = t.firstChild.textContent.replace(/· [\d,]+/, `· ${fmt(want.All)}`);
      }
    });
  }
  V3.S(/^(assessments|campaign|after-audit-record|after-audits-index)$/, (orig) => { const html = orig(); return V3.wsx() ? trackerFix(html) : html; });
  const readyNow = () => { const e = evidenceWSX(); return e.pending + Math.max(0, hub("campaign", "Ready", 88) - 88); };
  V3.S("my-work", (orig) => {
    const html = orig();
    const ready = readyNow();
    return typeof html === "string" ? html.replace(/(\d[\d,]*) (requests?) ready for the assessor/g, () => `${plural(ready, "request")} ready for the assessor`) : html;
  });
  // Lead, integration: lane W draws My work from PA.mywork.data(), so the assessor's line is put right in the data as well.
  if (PA.mywork && typeof PA.mywork.data === "function") {
    const data0 = PA.mywork.data;
    PA.mywork.data = function () {
      const out = data0.apply(this, arguments);
      if (!V3.on() || !V3.wsx()) return out;
      try { const ready = readyNow(); for (const g of out) for (const x of g.rows || []) if (typeof x.m === "string" && / ready for the assessor/.test(x.m)) x.m = x.m.replace(/(\d[\d,]*) (requests?) ready for the assessor/, () => `${plural(ready, "request")} ready for the assessor`); } catch (e) { console.error("v3f mywork", e); }
      return out;
    };
  }

  // ════════════════ C03: every snapshot taken one way; the Programs trend reads the rows ════════════════
  const EVENTS = () => (PA.v3fEvents || []);
  const snapText = (s) => `${fmt(s.sat)} of ${fmt(s.total)} controls satisfied`;
  function snapRows(root) {
    for (const tr of root.querySelectorAll("tr[data-panel='v7o-event']")) {
      const t = txt(tr); if (!/Snapshot taken/.test(t)) continue;
      const m = /^(Nov \d+)/.exec(txt(tr.cells[0])); if (!m) continue;
      const iso = "2026-11-" + String(m[1].split(" ")[1]).padStart(2, "0"), s = snapOn(iso); if (!s) continue;
      for (const td of tr.cells) if (/controls satisfied/.test(txt(td))) { const el = td.querySelector("[title]") || td; el.textContent = snapText(s); if (el.title) el.title = snapText(s); }
    }
  }
  V3.P("v7o-event", (orig, id) => {
    const o = orig(); if (!o || typeof o.body !== "string") return o;
    if (!/Control status snapshot/.test(o.body)) return o;
    const m = /(Nov \d+), 23:55/.exec(o.body); if (!m) return o;
    const s = snapOn("2026-11-" + String(m[1].split(" ")[1]).padStart(2, "0")); if (!s) return o;
    return { ...o, body: o.body.replace(/\d[\d,]* of 560 controls satisfied/g, snapText(s)) };
  });
  V3.S("portfolio", (orig) => {
    const html = orig(); const snaps = snapshotsWSX(), first = snaps[snaps.length - 1], d = snaps[0].sat - first.sat;
    return typeof html === "string" ? html.replace(/(<tr\b[^>]*(?:data-id|data-v2prog)="PRG-1090"[^>]*>[\s\S]*?<\/tr>)/, (row) => row.replace(/<span class="num">\+\d+ controls<\/span>|<span class="v7o-mu">No change<\/span>/, d ? `<span class="num">${d > 0 ? "+" : "−"}${Math.abs(d)} controls</span>` : '<span class="v7o-mu">No change</span>')) : html;
  });

  // ════════════════ C08 C28: the session's events join the log; the program's Activity, the workspace's Event log ════════════════
  // Each review, publication, mapping and decision recorded in this session, newest first, in the log's own row shape.
  function sessionEvents() {
    const out = [], ch = CH();
    const ev = PA.evLookup ? PA.evLookup.all() : [];
    for (const [id, r] of Object.entries(V.get("evx.rev", null) || {})) {
      const a = ev.find((x) => x.id === id); if (!r || !a) continue;
      out.push({ prog: WSX, at: r.at, who: r.by || "Nadia Fournier", act: r.state === "accepted" ? "Evidence accepted" : "Evidence sent back", rec: a.title, det: r.state === "accepted" ? "Matches the requirement's acceptance criteria." : r.why || "Sent back for revision.", kind: "reviews", src: "Evidence review" });
    }
    if (ch && ch.inc2()) out.push({ prog: WSX, at: ch.inc2().at, who: ch.inc2().by || "D. Okafor", act: "Results published", rec: "Interim results — expanded control set, increment 2", det: "20 determinations now decide WS-X90's control statuses.", kind: "decisions", src: "Assessment results" });
    for (const [cid, r] of Object.entries(V.get("chain.results", null) || {})) if (r) out.push({ prog: WSX, at: r.at, who: r.by || "D. Okafor", act: "Results published", rec: r.title || cid, det: `${r.n || 1} determination${(r.n || 1) === 1 ? "" : "s"} decide control statuses.`, kind: "decisions", src: "Assessment results" });
    for (const [code, x] of Object.entries(V.get("chain.ctl", null) || {})) {
      if (x && x.req) out.push({ prog: WSX, at: x.mapAt || TODAY_ISO, who: ME, act: "Requirement mapped", rec: `${x.req} maps ${code}`, det: x.mapNote || "Whole control, on SYS-WSX90.", kind: "decisions", src: "Control mapping" });
      if (x && x.ev) out.push({ prog: WSX, at: x.evAt || TODAY_ISO, who: ME, act: "Evidence linked", rec: x.evTitle || "Evidence", det: `Cited by ${x.evReq || x.req || "its requirement"} for ${code}.`, kind: "decisions", src: "Evidence citation" });
    }
    for (const m of V.get("reqx.map", null) || []) out.push({ prog: WSX, at: m.at || TODAY_ISO, who: ME, act: "Requirement mapped", rec: `${m.req} maps ${m.ctl}`, det: m.note || "", kind: "decisions", src: "Control mapping" });
    const d = get("drafts", null); if (d) out.push({ prog: WSX, at: d.at, who: d.by, act: "Drafts approved", rec: "Requirement drafter: REQ-641, REQ-642 and REQ-643", det: "The three requirements join WS-X90's register.", kind: "decisions", src: "AI agent run" });
    for (const [prog, steps] of Object.entries(V.get("life.dec", null) || {})) for (const [step, x] of Object.entries(steps || {})) if (x) out.push({ prog, at: x.at || TODAY_ISO, who: x.by || ME, act: "Gate decided", rec: `${String(step).toUpperCase()} · ${x.o === "yes" ? "Approved" : x.o === "cond" ? "Approved with conditions" : "Not approved"}`, det: x.c || "", kind: "decisions", src: "Gate decision" });
    for (const m of (PA.v2hubs && PA.v2hubs.made()) || []) out.push({ prog: m.code, at: m.at || TODAY_ISO, who: ME, act: "Program created", rec: `${m.code} ${m.name || ""}`.trim(), det: "", kind: "decisions", src: "Program" });
    return out.reverse();
  }
  const progName = (code) => code === WSX ? "WS-X90 Sentinel Mission System" : ((PA.v2hubs && PA.v2hubs.madeOne(code)) || {}).name || code;
  // The log as v2 draws it (30 rows of WS-X90's 299 events), read once and reshaped.
  const v2log = (route) => V3.force(false, () => (S[route] ? S[route]() : ""));
  const TABS = [["event-log", "All", null], ["event-log-reviews", "Evidence reviews", "reviews"], ["event-log-imports", "Imports", "imports"], ["event-log-decisions", "Decisions and publications", "decisions"], ["event-log-system", "Daily job", "system"]];
  function logPage(route, scope) {
    const kind = (TABS.find((x) => x[0] === route) || TABS[0])[2];
    const progF = scope === "program" ? WSX : get("elog", "all");
    const sess = sessionEvents().filter((x) => (progF === "all" || x.prog === progF) && (!kind || x.kind === kind));
    const add = (k) => sessionEvents().filter((x) => (progF === "all" || x.prog === progF) && (!k || x.kind === k)).length;
    return edit(v2log(route), (root) => {
      snapRows(root);
      const head = root.querySelector(".ak-ih, .ph, .ak-rh"); const title = head && head.querySelector("h1, h2, b");
      if (title) title.textContent = scope === "program" ? "Activity" : "Event log";
      const desc = head && head.querySelector("p, .ak-desc, .ak-ih-d, span.d");
      if (desc) desc.textContent = scope === "program" ? "Who did what to which WS-X90 record, and when: its reviews, decisions, imports and daily snapshots. Times are UTC; entries never change." : "Who did what to which record, and when, across the workspace's programs. Times are UTC; entries never change.";
      for (const el of root.querySelectorAll("[role='tab']")) {
        const lab = txt(el).replace(/[\d,]+$/, "").trim(), t = TABS.find((x) => x[1] === lab), c = el.querySelector(".ct, .num");
        if (t && c) setNum(c, (+txt(c).replace(/,/g, "") || 0) + add(t[2]));
        if (scope === "program" && t) { for (const a of [el, ...el.querySelectorAll("[data-go], [href]")]) { if (a.getAttribute("data-go")) a.setAttribute("data-go", t[0] === "event-log" ? "activity" : "activity-" + t[0].replace("event-log-", "")); if (a.getAttribute("href")) a.setAttribute("href", "#" + (t[0] === "event-log" ? "activity" : "activity-" + t[0].replace("event-log-", ""))); } }
      }
      const tbl = root.querySelector('table[aria-label="Events"]'); if (!tbl) return;
      const body = tbl.querySelector("tbody"), first = body.querySelector("tr");
      const programCol = scope !== "program";
      if (programCol) { const th = document.createElement("th"); th.textContent = "Program"; tbl.querySelector("thead tr").insertBefore(th, tbl.querySelector("thead th:nth-child(2)")); for (const tr of body.querySelectorAll("tr")) { const td = document.createElement("td"); td.textContent = "WS-X90"; tr.insertBefore(td, tr.cells[1]); } }
      const keepRow = (tr, prog) => { if (progF !== "all" && prog !== progF) tr.remove(); };
      if (programCol) for (const tr of [...body.querySelectorAll("tr")]) keepRow(tr, WSX);
      sess.forEach((x, i) => {
        if (!first) return;
        const tr = first.cloneNode(true); tr.setAttribute("data-panel", "v3f-ev"); tr.setAttribute("data-id", String(i) + "|" + (kind || "") + "|" + (scope === "program" ? WSX : progF));
        const c = [...tr.cells]; let k = 0;
        c[k++].innerHTML = `<span class="num">${esc(md(x.at))}, today</span>`;
        if (programCol) c[k++].textContent = x.prog === WSX ? "WS-X90" : x.prog;
        c[k++].innerHTML = AK.owner(x.who);
        c[k++].innerHTML = `<span class="v7o-act">${esc(x.act)}</span>`;
        c[k++].innerHTML = `<span title="${esc(x.rec)}">${esc(x.rec)}</span>`;
        if (c[k]) c[k].innerHTML = x.det ? `<span title="${esc(x.det)}">${esc(x.det)}</span>` : DASH;
        body.insertBefore(tr, first);
      });
      const pager = root.querySelector(".pager .num"); if (pager) pager.textContent = pager.textContent.replace(/[\d,]+–([\d,]+) of ([\d,]+)/, (m0, a, b) => `1–${fmt(+a.replace(/,/g, "") + sess.length)} of ${fmt(+b.replace(/,/g, "") + sess.length)}`);
      if (programCol) {
        const progs = [["all", "All programs"], [WSX, "WS-X90"], ...((PA.v2hubs && PA.v2hubs.made()) || []).map((m) => [m.code, m.name || m.code])];
        tbl.closest(".frame, .tablebox, div").insertAdjacentHTML("beforebegin", `<div class="views v3f-elog" role="group" aria-label="Program">${progs.map(([k2, l]) => `<span class="qv${progF === k2 ? " on" : ""}" role="button" tabindex="0" aria-pressed="${progF === k2}" data-v3f-elog="${esc(k2)}">${esc(l)}</span>`).join("")}</div>`);
      }
    });
  }
  TABS.forEach(([r]) => V3.S(r, () => logPage(r, "workspace")));
  V3.screen("activity", () => logPage("event-log", "program"), "activity");
  TABS.slice(1).forEach(([r, , k]) => V3.screen("activity-" + k, () => logPage(r, "program"), "activity"));
  document.addEventListener("click", (e) => {
    if (!on()) return;
    const t = e.target && e.target.closest ? e.target.closest("[data-v3f-elog]") : null; if (!t) return;
    e.preventDefault(); put("elog", t.dataset.v3fElog); V.redraw();
  }, true);
  V3.P("v3f-ev", (orig, id) => {
    const [i, kind, prog] = String(id || "").split("|");
    const x = sessionEvents().filter((y) => (prog === "all" || !prog || y.prog === prog) && (!kind || y.kind === kind))[+i]; if (!x) return null;
    return { label: "Event preview", body: `<div class="v2k-pan">${AK.recordHead({ title: x.act })}<dl class="ak-kv v2k-kv"><dt>When</dt><dd class="num">${esc(md(x.at))}, today · UTC</dd><dt>Who</dt><dd>${AK.owner(x.who)}</dd><dt>Program</dt><dd>${esc(progName(x.prog))}</dd><dt>Record</dt><dd>${esc(x.rec)}</dd><dt>Recorded as</dt><dd>${esc(x.src)}</dd></dl>${x.det ? `<div class="ak-card"><b>Result</b><p class="v7o-p">${esc(x.det)}</p></div>` : ""}<p class="note-p">Entries cannot be edited or deleted.</p></div>` };
  });

  // ════════════════ C09: a person's records, counted from the registers' owner fields ════════════════
  function ownCounts(n) {
    const R = regs();
    const ev = (PA.evLookup ? PA.evLookup.all() : []);
    return {
      "Operational issues": R.ISS.filter((x) => x.owner === n).length,
      "POA&M items": R.POAM.filter((x) => x.owner === n).length,
      Risks: R.RISKS.filter((x) => x.owner === n).length,
      _evAdded: ev.filter((x) => x.owner === n && /^x/.test(String(x.id))).length,
    };
  }
  V3.S(/^person-[a-z0-9-]+$/, (orig, route) => {
    const html = orig(); if (/-(onboarding|access|training|offboarding|comments|activity)$/.test(route)) return html;
    return edit(html, (root) => {
      const head = root.querySelector(".ak-title, h1"); const name = head ? txt(head).replace(/\s*\(you\)$/i, "") : "";
      const own = root.querySelector(".v8d-own"); if (!own || !name) return;
      const c = ownCounts(name);
      const tasksSec = [...root.querySelectorAll(".v8d-tasks")][0];
      const openTasks = tasksSec ? tasksSec.children.length : null;
      let total = 0;
      for (const tile of own.querySelectorAll(".v8d-tile")) {
        const lab = txt(tile.querySelector("span")), b = tile.querySelector("b");
        let n = +txt(b).replace(/\D+/g, "") || 0;
        if (lab in c) n = c[lab];
        if (lab === "Evidence") n += c._evAdded;
        if (lab === "Open tasks" && openTasks != null) n = openTasks;
        setNum(b, n); b.classList.toggle("v8d-mu", !n); total += n;
      }
      const sec = own.closest("section, .ak-section, .ak-sec") || own.parentElement;
      const t = sec && [...sec.querySelectorAll("h2, h3, h4, .ak-sec-t, .ak-section-t, b")].find((x) => /Records they own/.test(txt(x)));
      if (t && !t.querySelector(".v3f-total")) t.insertAdjacentHTML("beforeend", ` <span class="v3f-total">· <span class="num">${fmt(total)}</span> in all</span>`);
    });
  });

  // ════════════════ C19: People & roles, one record, read by People, the Overview's Team, ITCSC §11, SSP access, Permissions ════════
  const roleLine = (x) => `${esc(x.role)}${x.rmf ? ` ${h.tag(x.rmf)}` : ""}`;
  V3.S(/^(people|after-people-register)$/, (orig) => {
    const html = orig(); if (!V3.wsx()) return html;
    return edit(html, (root) => {
      const body = root.querySelector('table[aria-label="People"] tbody'); if (!body) return;
      const rows = [...body.querySelectorAll("tr[data-id]")];
      const tpl = rows.find((tr) => /No open tasks/.test(txt(tr))) || rows[rows.length - 1];
      for (const tr of rows) {
        const n = tr.getAttribute("data-id"), x = personOf(n);
        if (!x) { if (n === "Local developer") tr.remove(); continue; }
        const roleTd = tr.cells[2]; if (roleTd) roleTd.innerHTML = `<span class="a-people-role">${roleLine(x)}</span>`;
      }
      const have = new Set([...body.querySelectorAll("tr[data-id]")].map((tr) => tr.getAttribute("data-id")));
      for (const x of PEOPLE_WSX) {
        if (have.has(x.name) || !tpl) continue;
        const tr = tpl.cloneNode(true); tr.setAttribute("data-id", x.name); tr.classList.remove("sel");
        const c = tr.cells, box = c[0].querySelector("input, [role=checkbox]"); if (box) box.setAttribute("aria-label", `Select ${x.name}`);
        if (c[1]) c[1].innerHTML = `<span class="a-people-pers">${AK.avatar(x.name, 26)}<span>${esc(x.name)}</span></span>`;
        if (c[2]) c[2].innerHTML = `<span class="a-people-role">${roleLine(x)}</span>`;
        if (c[3]) c[3].innerHTML = `<span class="a-people-mu">No open tasks</span>`;
        if (c[4]) c[4].innerHTML = DASH; if (c[6]) c[6].innerHTML = DASH;
        body.appendChild(tr);
      }
      const n = body.querySelectorAll("tr[data-id]").length;
      setCount(root, "People", n); setCount(root, "All", n);
      const pager = root.querySelector(".pager .num"); if (pager) pager.textContent = pager.textContent.replace(/[\d,]+–[\d,]+ of [\d,]+/, `1–${n} of ${n}`);
    });
  });
  // A role holder v2 has no record of (Marcus Ryde, Lena Marsh, R. Feldman, …) opens their own preview, never R. Calloway's.
  V3.P("a-people-person", (orig, id) => {
    const n = String(id || "").split("|")[0], x = personOf(n), o = orig();
    if (!V3.wsx() || !x) return o;
    const known = o && typeof o.body === "string" && o.body.includes(`>${esc(n)}<`);
    if (known) return { ...o, body: o.body.replace(/(<div class="a-people-pht"><h4>[^<]*<\/h4>)<span[^>]*>[^<]*<\/span>/, `$1<span class="a-people-mu">${esc(x.role)}${x.rmf ? ` · ${esc(x.rmf)}` : ""}</span>`) };
    return { label: "Person preview", body: `<div class="v2k-pan">${AK.recordHead({ title: x.name })}<dl class="ak-kv v2k-kv"><dt>Role</dt><dd>${roleLine(x)}</dd><dt>Program</dt><dd>WS-X90 Sentinel Mission System</dd><dt>Organization</dt><dd>${esc(x.org)}</dd><dt>SSP access</dt><dd>${x.ssp ? esc(x.ssp) : DASH}</dd>${x.decides ? `<dt>Decides</dt><dd>${esc(x.decides)}</dd>` : ""}</dl><p class="note-p">No open task in WS-X90's Schedule names them.</p></div>` };
  });
  // A person's page: the role and SSP access come from the same record.
  V3.S(/^person-[a-z0-9-]+$/, (orig) => {
    const html = orig(); if (!V3.wsx()) return html;
    return edit(html, (root) => {
      const head = root.querySelector(".ak-title, h1"); const x = head ? personOf(txt(head).replace(/\s*\(you\)$/i, "")) : null; if (!x) return;
      for (const dt of root.querySelectorAll("dt, .k")) {
        const k = txt(dt), dd = dt.nextElementSibling; if (!dd) continue;
        if (k === "WS-X90 role") dd.innerHTML = esc(x.role); else if (k === "SSP access") dd.innerHTML = x.ssp ? esc(x.ssp) : DASH;
      }
    });
  });
  // ITCSC §11: the team's titles and names are the record's; the deciders and the assessor join it.
  V3.S(/^itcsc$/, (orig) => {
    const html = orig(); if (!V3.wsx()) return html;
    return custA(edit(html, (root) => {
      const tb = root.querySelector('table[aria-label="RMF team"] tbody'); if (!tb) return;
      const rows = [...tb.querySelectorAll("tr")];
      for (const tr of rows) { const n = txt(tr.cells[1]).replace(/^[A-Z]{1,3}\s+/, ""); const x = PEOPLE_WSX.find((p) => n.endsWith(p.name)); if (x && tr.cells[0] && !/AODR|Primary POC/.test(txt(tr.cells[0]))) { const star = tr.cells[0].querySelector(".v8b-req"); tr.cells[0].innerHTML = esc(x.rmf ? `${x.rmf} · ${x.role}` : x.role) + (star ? " " + star.outerHTML : ""); } }
      const have = new Set(rows.map((tr) => txt(tr.cells[1])));
      for (const x of PEOPLE_WSX.filter((p) => ["Nadia Fournier", "Marcus Ryde", "R. Feldman"].includes(p.name))) {
        if ([...have].some((t) => t.endsWith(x.name)) || !rows[0]) continue;
        const tr = rows[0].cloneNode(true); const c = tr.cells;
        c[0].innerHTML = esc(x.rmf ? `${x.rmf} · ${x.role}` : x.role); c[1].innerHTML = AK.owner(x.name); c[2].innerHTML = '<span class="v8b-mu">Not recorded</span>'; c[3].textContent = x.org; c[4].innerHTML = '<span class="v8b-src">People &amp; roles</span>';
        tb.appendChild(tr);
      }
    }));
  });
  // Permissions: the RMF roles WS-X90 records, with today's holders, from the record.
  V3.S(/^permissions$/, (orig) => {
    const html = orig(); if (!V3.wsx()) return html;
    return edit(html, (root) => {
      const tbl = root.querySelector('table[aria-label="RMF roles on WS-X90"]'); if (!tbl) return;
      const tb = tbl.querySelector("tbody"), tpl = tb.querySelector("tr"); if (!tpl) return;
      const HOLDS = { "Authorizing official": "Records the authorization decision on WS-X90's packages", "Authorizing official designated representative": "Acts for the AO where the AO delegates", "Program manager and system owner": "Owns WS-X90 and signs its security plan", "Lead assessor": "Publishes WS-X90's assessment results", Assessor: "Judges controls in a draft of the results", "Information system security manager": "Approves the security plan and the POA&M", "Information system security officer": "Runs day-to-day security: evidence, issues, risks", "Information system security engineer": "Engineers security into WS-X90's design", "User representative": "Speaks for the operating squadron" };
      const groups = []; for (const x of PEOPLE_WSX.filter((p) => p.rmf)) { const g = groups.find((y) => y.role === x.role); if (g) g.names.push(x.name); else groups.push({ rmf: x.rmf, role: x.role, names: [x.name] }); }
      const one = tpl.cells[tpl.cells.length - 1].innerHTML;
      tb.innerHTML = "";
      for (const g of groups) {
        const tr = tpl.cloneNode(true); const c = tr.cells; tr.removeAttribute("data-panel"); tr.removeAttribute("tabindex"); tr.removeAttribute("data-id");
        c[0].innerHTML = `<b>${esc(g.role)}</b> <span class="v8w-mu">${esc(g.rmf)}</span>`; c[1].innerHTML = esc(HOLDS[g.role] || g.role);
        c[2].innerHTML = `<span class="v8w-avrow">${g.names.map((n) => AK.owner(n)).join("")}</span>`;
        c[c.length - 1].innerHTML = g.role === "Authorizing official" || g.role === "Lead assessor" ? one : '<span class="v8w-mu">Several</span>';
        tb.appendChild(tr);
      }
      for (const el of root.querySelectorAll("*")) { if (el.children.length || txt(el) !== "RMF roles on WS-X90") continue; const box = el.parentElement; const ct = box && [...box.querySelectorAll(".num, .ct")].find((x) => /^\d+$/.test(txt(x))); if (ct) ct.textContent = String(groups.length); }
    });
  });

  // ════════════════ C22 C27: Cyber T&E and Threats say whose and which ════════════════
  // WS-X90 holds no customer requirements document (Requirements › Compliance shows Customer A's, the X800 program's): what its
  // testers take from the customer is the F-16 SPO's tailoring of the baseline. Risks name ATT&CK for Enterprise techniques only.
  const cyberFix = (html) => (typeof html === "string" ? html
    .replace(/Customer A's requirements document, 14 requirements/g, `The ${CUSTOMER.name}'s tailoring of the baseline: penetration testing (CA-8) and vulnerability monitoring (RA-5)`)
    .replace(/(\d+) risks name (\d+) ATT&(?:amp;)?CK techniques/g, "$1 risks name $2 ATT&amp;CK for Enterprise techniques") : html);
  V3.S(/^cyber-te/, (orig) => (V3.wsx() ? cyberFix(orig()) : orig()));
  V3.P("v7a-phase", (orig) => { const o = orig(); return o && V3.wsx() ? { ...o, body: cyberFix(o.body) } : o; });
  V3.S(/^threats/, (orig) => {
    const html = orig(); if (!V3.wsx()) return html;
    const r = risksWSX();
    return String(html).replace(/(of WS-X90's )40( open risks name an ATT&amp;CK technique)/, `$1${fmt(r.open)}$2`)
      .replace(/(aria-label="Quick views">[\s\S]*?Enterprise <span class="num">)(\d+)(<\/span>)/, "$1$2$3");
  });
  // C27: the STIG triage run counts the open CAT II rules across the checklists it read, not the laptop's alone.
  const STIG_RE = /23 CAT II open rules matched to existing POA&(?:amp;)?M items/g;
  V3.S(/^ai-drafts/, (orig) => (V3.wsx() ? String(orig()).replace(STIG_RE, "23 open CAT II rules on the October and November checklists matched to existing POA&amp;M items") : orig()));
  V3.P("v8w-run", (orig, id) => { const o = orig(); return o && V3.wsx() ? { ...o, body: String(o.body).replace(STIG_RE, "23 open CAT II rules on the October and November checklists matched to existing POA&amp;M items") } : o; });
  // C27: the boundary's element pools the issues standing on an element: 43 of the 44 open (one stands on none).
  const elFix = (body) => { const i = issuesWSX(); return String(body).replace(/(<dt>Open issues<\/dt><dd>(?:<[^>]+>)*)43\b/, `$1${fmt(Math.min(43, i.open))} of ${fmt(i.open)}`).replace(/(Open issues<\/span><b class="num">)43(<\/b>)/, `$1${fmt(Math.min(43, i.open))} of ${fmt(i.open)}$2`); };
  V3.P("v7p-el", (orig, id) => { const o = orig(); return o && V3.wsx() && /^(CN-109000|SYS-WSX90)/.test(String(id)) ? { ...o, body: elFix(o.body) } : o; });
  V3.S(/^rec--v7p-el--(CN-109000|SYS-WSX90)/, (orig) => (V3.wsx() ? elFix(orig()) : orig()));

  // ════════════════ C26: each fact once on Findings ════════════════
  V3.S(/^(findings|after-findings-deadlines)$/, (orig) => {
    const html = orig(); if (!V3.wsx()) return html;
    return edit(html, (root) => {
      for (const t of root.querySelectorAll(".a-risk-scard .t > .num")) t.remove(); // "44 open" twice: the tab says it
      for (const el of root.querySelectorAll(".qv, .chip")) { if (/^All\b/.test(txt(el))) { const n = el.querySelector(".num"); if (n) n.remove(); } }
    });
  });

  // ════════════════ Traceability folds into Requirements as its chain view ════════════════
  function chainView() {
    const R = requirementsWSX(), r = risksWSX(), i = issuesWSX();
    const mapped = 640 + R.drafts.filter((c) => PA.v2reqs && PA.v2reqs.mappings(c).length).length;
    return edit(V3.force(false, () => S.traceability()), (root) => {
      const head = root.querySelector(".ak-ih");
      const reqTabs = edit(S.requirements ? S.requirements() : "", () => {});
      const tmp = document.createElement("template"); tmp.innerHTML = reqTabs;
      const newHead = tmp.content.querySelector(".ak-ih"), newTabs = tmp.content.querySelector(".ak-tabs");
      if (head && newHead) head.replaceWith(newHead);
      const oldTabs = root.querySelector(".ak-tabs");
      if (oldTabs && newTabs) { for (const t of newTabs.querySelectorAll("[role=tab]")) { t.classList.remove("on"); t.setAttribute("aria-selected", "false"); if (!t.getAttribute("data-go")) { const lab = txt(t).replace(/[\d,]+$/, "").trim(); t.setAttribute("data-go", lab === "Requirements" ? "requirements" : lab === "Objectives" ? "requirements-objectives" : "requirements-compliance"); t.setAttribute("tabindex", "0"); } } const ch = newTabs.querySelector('[data-go="requirements-chain"]'); if (ch) { ch.classList.add("on"); ch.setAttribute("aria-selected", "true"); ch.removeAttribute("data-go"); } oldTabs.replaceWith(newTabs); }
      const CAP = { "Map a control": [mapped, mapped === R.total ? "Every requirement maps one" : `${fmt(R.total - mapped)} of the ${fmt(R.total)} requirements map none yet`],
        "Reach an operational issue": [null, `52 requirements reach an issue; 43 of them an open one, of the ${fmt(i.open)} open`],
        "Reach a risk": [null, `52 requirements reach the register's ${fmt(r.open)} open risks`],
        "Reach a POA&M item": [null, "52 requirements: each of their issues has one"] };
      for (const it of root.querySelectorAll(".v7a-fun-i")) { const k = txt(it.querySelector(".k")), c = CAP[k]; if (!c) continue; if (c[0] != null) setNum(it.querySelector("b.num"), c[0]); const sEl = it.querySelector(".s"); if (sEl) sEl.textContent = c[1]; }
      for (const el of root.querySelectorAll(".v7a-chart-t .v7a-mu, .v7a-mu.num")) if (/^640 requirements/.test(txt(el))) el.textContent = `${fmt(R.total)} requirements, current revisions`;
    });
  }
  V3.screen("requirements-chain", () => chainView(), "requirements");
  V3.redirect(/^traceability/, "requirements-chain");
  // The Requirements tabs gain Chain, the merged Traceability.
  V3.S(/^requirements(-objectives|-compliance)?$/, (orig, route) => {
    const html = orig(); if (!V3.wsx()) return html;
    return edit(route === "requirements-compliance" ? custA(html) : html, (root) => {
      const tabs = root.querySelector(".ak-tabs"); if (!tabs || tabs.querySelector('[data-go="requirements-chain"]')) return;
      const last = [...tabs.querySelectorAll("[role=tab]")].pop(); if (!last) return;
      const t = last.cloneNode(false); t.className = "ak-tab"; t.setAttribute("aria-selected", "false"); t.setAttribute("data-go", "requirements-chain"); t.setAttribute("tabindex", "0"); t.textContent = "Chain";
      tabs.appendChild(t);
    });
  });

  // ════════════════ C06: the SCTM's sheets say what they hold ════════════════
  function sctmTabs() {
    if (!on() || !V3.wsx() || (location.hash || "").slice(1) !== "sctm") return;
    const app = document.getElementById("sx-app"); if (!app) return;
    // The snapshot holds the requirements of 92 controls (its own note), the evidence they cite, and the 44 operational issues beside
    // 68 assessment findings in one sheet: each tab says which subset it is.
    const NAME = { Requirements: "Requirements behind 92 controls", Evidence: "Evidence they cite", Findings: "Operational issues and assessment findings" };
    for (const el of app.querySelectorAll("[role='tab'], .sx-tab, button")) {
      const t = el.childNodes[0]; if (!t || t.nodeType !== 3) continue;
      const k = t.textContent.trim(); if (NAME[k]) { t.textContent = NAME[k] + " "; el.setAttribute("title", NAME[k]); }
    }
  }
  if (window.MutationObserver) new MutationObserver(() => { if (on()) sctmTabs(); }).observe(document.body || document.documentElement, { childList: true, subtree: true });

  // ════════════════ C07 C18: Requirements count the register, approved drafts included ════════════════
  V3.S("requirements", (orig) => {
    const html = orig(); if (!V3.wsx()) return html;
    const R = requirementsWSX(); if (!R.drafts.length) return html;
    return edit(html, (root) => {
      setCount(root, "Requirements", R.total); setCount(root, "All", R.total);
      for (const el of root.querySelectorAll(".qv")) { const lab = txt(el).replace(/[\d,]+$/, "").trim(); const n = el.querySelector(".num"); if (!n) continue; const v = +txt(n).replace(/,/g, ""); if (lab === "Cite no evidence" || lab === "No owner") setNum(n, v + R.drafts.length); }
      const pager = root.querySelector(".pager .num"); if (pager) pager.textContent = pager.textContent.replace(/of [\d,]+/, `of ${fmt(R.total)}`);
      const tbl = root.querySelector('table[aria-label="Requirements"]'), body = tbl && tbl.querySelector("tbody"), first = body && body.querySelector("tr");
      if (!first) return;
      // Columns by their headings: the visual layer cuts a column that reads the same on every row (Owner).
      const heads = [...tbl.querySelectorAll("thead th")].map((th) => txt(th));
      const col = (name) => heads.findIndex((x) => x === name);
      for (const [code, title, , els] of DRAFTS.slice().reverse()) {
        const tr = first.cloneNode(true); tr.setAttribute("data-id", code); tr.classList.remove("sel");
        const cells = tr.cells, maps = PA.v2reqs ? PA.v2reqs.mappings(code).map((m) => m.ctl) : [];
        const put2 = (name, html2) => { const i = col(name); if (i >= 0 && cells[i]) cells[i].innerHTML = html2; };
        const box = cells[0] && cells[0].querySelector("input, [role=checkbox]"); if (box) box.setAttribute("aria-label", `Select ${code}`);
        put2("Requirement", `<span class="v7p-rq"><b>${esc(code)}</b><span class="v7p-clip" style="max-width:230px" title="${esc(title)}">${esc(title)}</span></span>`);
        put2("State", h.pill("none", "Draft"));
        put2("Controls", maps.length ? AK.codes(maps) : DASH);
        const ob = maps.reduce((a, c) => a + ((SSP.ctl(c) || {}).ob || 0), 0);
        put2("Objectives", maps.length ? `<span class="num">${fmt(ob)} of ${fmt(ob)}</span>` : DASH);
        put2("Evidence", DASH);
        put2("Allocated to", AK.codes([els[0]]));
        body.insertBefore(tr, first);
      }
    });
  });
  // The Requirement drafter's run, approved, joins the register at once.
  document.addEventListener("click", (e) => {
    if (!on()) return;
    const t = e.target && e.target.closest ? e.target.closest('[data-v8w-approve-all="b2"]') : null;
    if (t && !get("drafts", null)) put("drafts", { at: TODAY_ISO, by: ME });
  }, true);
  // Map a requirement offers only requirements in the register.
  V3.M("v2k-map", (orig, id) => {
    const o = orig(); if (!o || !V3.wsx()) return o;
    const opts = [...requirementsWSX().drafts.map((c) => { const d = DRAFTS.find((x) => x[0] === c); return [c, `${c} · ${d[1]}`]; }),
      ...(PA.v7p && PA.v7p.REQS ? PA.v7p.REQS.map((r) => [r[0], `${r[0]} · ${r[1]}`]) : [])];
    const sel = `<option value="">Choose a requirement</option>${opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("")}`;
    const body = String(o.body).replace(/(<select[^>]*name="req"[^>]*>)[\s\S]*?(<\/select>)/, `$1${sel}$2`)
      .replace(/Requirements allocated to SYS-WSX90 that map no control yet(\s*<span class="ex">Example<\/span>)?/, draftsIn() ? "Requirements in WS-X90's register, the drafts approved today first" : "Requirements in WS-X90's register. The Requirement drafter's drafts join it once approved in AI agents");
    return { ...o, body };
  });
})();
