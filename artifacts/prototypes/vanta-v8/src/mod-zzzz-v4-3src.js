// Drata round, lane C (drc-): sources after Drata, what feeds automated compliance. Recommendations 11, 13 and 14, with the kit's
// 19 (sunken record), 20 (one header) and 27 (counts before a command), drawn with the Drata kit (PA.drk, D) over WS-X90's real
// sources and imports (V3's facts imports(), components(), people(), the SSP's controls and their objectives). New routes only.
//
// Routes
//   dr-sources                       the sources register after: one toolbar row with saved views; Name, Kind, Health (Healthy,
//                                    Overdue, or Error with the step that failed), Last run, Evidences (objectives · controls), Owner.
//                                    A source the baseline needs that is not connected reads "Not connected" with what it would evidence.
//   dr-source--<id>[--<tab>]         a source's record: the header with health in its facts, then Overview (what it evidences, the
//                                    sync steps, what it last brought in), Scope (the boundary as rules, a live count, Apply through
//                                    the counts step), Matching (assets to the component inventory, or accounts to people, with the
//                                    consequence line and a picker in each unmatched cell) and Runs. <tab>: scope | matching | runs.
//                                    acas is the scanner pair, idp the identity pair.
// Round 2: every source has the same tabs. A source that reads one component (a STIG checklist, an SBOM, a container scan) has
// Scope (that component and, for a checklist, the rules of its STIGs from V3's checklists via PA.drb.checklists) and Matching
// (the host or image it read, matched to that component); one not connected says so on each. Connect, Import file and Run
// now queue a run that moves Queued, Running, Done in four seconds (PA.drc.queue(id) for lane B), reading V3's last run.
// Preview: drc-src (the register's eye; walkable).
// Derived (nothing in the prototype holds it; v4dr/C/notes.json lists each): the source kinds, the controls each source can
// evidence (their objectives are the SSP's own counts), the scanner's hosts and their enclaves, the directory's accounts, the
// identity, inventory and ticketing sources, the scope rules and the sync steps.
// Session data (K.get/K.set under "dr.C."; Reset clears it): rules.<src> [rule] (the draft) · applied.<src> [rule] · step.<src>
//   ("review" while the counts step is open) · match.<src> { asset: code | name } · conn { src: iso } · owner { src: name }
//   · reg { q, kind, health } · mq.<src> { q, st } · runs.<src> [{ at, what, by, read, kind: "run", t0, adopt }] · where.<src>
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k, V = PA && PA.v2, D = PA && PA.drk;
  if (!V3 || !K || !V || !D) return;
  const SSP = PA.SSP, esc = K.esc, fmt = K.fmt;
  const CH = V.chain || null;
  const TODAY = (CH && CH.TODAY_ISO) || "2026-11-17", ME = (CH && CH.ME) || "Ingrid Solberg";
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const ms = (iso) => Date.parse(String(iso).slice(0, 10) + "T12:00:00Z");
  const daysAgo = (iso) => Math.round((ms(TODAY) - ms(iso)) / 864e5);
  const md = (iso) => { if (!iso) return ""; const d = new Date(ms(iso)); return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getUTCFullYear() === 2026 ? undefined : "numeric", timeZone: "UTC" }); };
  const mdy = (iso) => (iso ? new Date(ms(iso)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "");
  const none = () => '<span class="k3-none">—</span>';
  const mu = (t) => `<span class="k3-muted">${esc(t)}</span>`;
  const warnW = (t) => `<span class="drc-warnw">${D.glyph("tri", "drc-wg")}${esc(t)}</span>`;
  const get = (p, d) => { const v = K.get("dr.C." + p, d); return v == null ? d : v; };
  const set = (p, v) => K.set("dr.C." + p, v);
  const fact = (name, ...a) => { try { return typeof V3.facts[name] === "function" ? V3.fact(name, ...a) : null; } catch (e) { return null; } };

  // ——— Controls and their objectives (the SSP's own counts) ———
  const ctlRec = (code) => ((SSP && SSP.controls) || []).find((c) => (c.c || c.code) === code) || null;
  const objN = (code) => { const c = ctlRec(code); if (c && typeof c.ob === "number") return c.ob; const o = PA.v3r && PA.v3r.objectivesOf ? PA.v3r.objectivesOf(code) : null; return (o && o.length) || 0; };
  const objLabel = (code, i) => { const o = PA.v3r && PA.v3r.objectivesOf ? PA.v3r.objectivesOf(code) || [] : []; return (o[i] && o[i].label) || `${code} objective ${i + 1}`; };
  const STW = { satisfied: "Satisfied", partially_satisfied: "Partially satisfied", other_than_satisfied: "Other than satisfied", not_assessed: "Not assessed", no_evidence: "No evidence", no_requirement: "No requirement" };
  const ctlKey = (code) => fact("status", code) || (ctlRec(code) || {}).cs || "";
  const ctlRoute = (code) => (K.recRoute && K.recRoute("k3c-control", code)) || `control--${code}`;

  // ——— Components and people ———
  const comps = () => fact("components") || [];
  const comp = (code) => comps().find((c) => c.code === code) || null;
  const compName = (code) => { const c = comp(code); return c ? c.name : code; };
  const inside = () => comps().filter((c) => c.boundary === "inside" && /Hardware|Software/.test(c.kind));
  const people = () => (fact("people") || []).map((p) => p.name).filter(Boolean);

  // ═══════════════ The sources ═══════════════
  // V3's ten (Evidence › Sources, ids kept so their imports read through), the identity source, and two the baseline needs that
  // are not connected. Each names the controls it can evidence (derived from what the tool reads).
  const KIND = { scanner: "Scanner", stig: "STIG checklist", inventory: "Inventory", ticketing: "Ticketing", identity: "Identity" };
  const STIGC = ["CM-6", "CM-6(1)", "CM-7", "CM-7(1)", "CM-2", "CM-2(2)", "IA-5", "AU-12"];
  const SRC = [
    { id: "acas", name: "ACAS vulnerability scan — mission network", kind: "scanner", tool: "ACAS / Tenable.sc", file: ".nessus", owner: "Joel Barrantes", every: 30, ctls: ["RA-5", "RA-5(2)", "RA-5(5)", "RA-5(11)", "SI-2", "SI-2(2)", "SI-2(3)", "SI-3", "CM-8", "CM-8(3)"], assets: true, steps: ["Collect", "Validate", "Match assets", "Apply"] },
    { id: "stig-mc", name: "DISA STIG checklist — mission computing (RHEL 9)", kind: "stig", tool: "STIG Viewer 2.18", file: ".ckl", owner: "Joel Barrantes", every: 30, ctls: STIGC, comps: ["CN-109101"] },
    { id: "stig-asd", name: "DISA STIG checklist — mission software (ASD)", kind: "stig", tool: "STIG Viewer 3.6", file: ".cklb", owner: ME, every: 30, ctls: STIGC, comps: ["CN-109101"] },
    { id: "stig-sw", name: "DISA STIG checklist — internal Ethernet switch", kind: "stig", tool: "STIG Viewer 2.18", file: ".ckl", owner: "Priya Raghavan", every: 30, ctls: STIGC, comps: ["CN-109109"] },
    { id: "stig-gw", name: "Evaluate-STIG run — protected network gateway", kind: "stig", tool: "Evaluate-STIG 1.2508.1", file: ".cklb", owner: "Joel Barrantes", every: 30, ctls: STIGC, comps: ["CN-109107"] },
    { id: "scap-lt", name: "SCAP compliance scan — maintenance laptop (Windows 11)", kind: "stig", tool: "SCC 5.10.1", file: "XCCDF", owner: "Joel Barrantes", every: 30, ctls: ["CM-6", "CM-6(1)", "CM-7", "CM-2", "IA-5", "AU-12"], comps: ["CN-109119"] },
    { id: "sbom-mc", name: "Mission Computer maintenance image SBOM", kind: "inventory", tool: "SBOM feeds", file: "CycloneDX 1.5", owner: "Priya Raghavan", every: 0, ctls: ["CM-8", "CM-8(1)", "CM-10", "SR-3", "SR-4", "SR-11", "SA-22", "RA-5", "SI-2"], comps: ["CN-109101"] },
    { id: "sbom-pic", name: "Software bill of materials — Payload Interface Controller firmware", kind: "inventory", tool: "SBOM feeds", file: "CycloneDX", owner: "Joel Barrantes", every: 0, ctls: ["CM-8", "CM-8(1)", "CM-10", "SR-3", "SR-4", "SR-11", "SA-22", "RA-5", "SI-2"], comps: ["CN-109110"] },
    { id: "sarif-tel", name: "Container image scan — telemetry services", kind: "scanner", tool: "Static analysis (SARIF)", file: "SARIF 2.1.0", owner: "Joel Barrantes", every: 30, ctls: ["SA-11", "SA-11(1)", "SA-15", "RA-5", "SI-2"], comps: ["CN-109112"] },
    { id: "idp", name: "Corporate identity provider — WS-X90 accounts", kind: "identity", tool: "Directory export (SCIM)", file: "SCIM 2.0", owner: "Priya Raghavan", every: 1, ctls: ["AC-2", "AC-2(1)", "AC-2(2)", "AC-2(3)", "AC-2(4)", "AC-2(13)", "AC-6", "AC-6(7)", "IA-2", "IA-4", "PS-4", "PS-5"], comps: ["idp"], assets: true, steps: ["Connect", "Collect accounts", "Match people", "Apply"], api: true },
    { id: "inv-cfg", name: "Hardware and software inventory — Configuration Repository", kind: "inventory", tool: "Inventory export (CSV)", file: "CSV", owner: null, every: 30, ctls: ["CM-8", "CM-8(1)", "CM-8(2)", "CM-8(4)", "CM-2", "CM-2(2)"], comps: ["CN-109120"], off: true },
    { id: "jira", name: "Change tickets — program office Jira", kind: "ticketing", tool: "Jira Data Center", file: "REST API", owner: null, every: 1, ctls: ["CM-3", "CM-3(1)", "CM-4", "CM-5"], comps: [], off: true, api: true },
    { id: "nessus-gw", name: "Nessus scan — maintenance access gateway", kind: "scanner", tool: "ACAS / Tenable.sc", file: ".nessus", owner: "Joel Barrantes", every: 30, ctls: ["RA-5", "SI-2", "CM-8"], comps: ["CN-109114"], retired: true },
  ];
  const byId = (id) => SRC.find((s) => s.id === id) || null;
  const inBase = (code) => !!ctlRec(code);
  const ctlsOf = (s) => s.ctls.filter(inBase);
  const objOf = (s) => ctlsOf(s).reduce((a, c) => a + objN(c), 0);
  // A STIG source's cadence is its checklists' own next import as V3 schedules it (round 2, so the source and its evidence agree).
  const everyOf = (s) => { if (s.kind === "stig" && PA.drb && PA.drb.checklists) { const ks = PA.drb.checklists().filter((c) => c.src === s.id); if (ks.length) return Math.min(...ks.map((k) => k.cadence)); } return s.every; };
  const connected = (s) => !s.retired && (!s.off || !!get("conn", {})[s.id]);
  const ownerOf = (s) => get("owner", {})[s.id] || s.owner;

  // ——— Imports (V3's one list), and the runs this module adds ———
  const imports = () => fact("imports", V3.WSX) || [];
  const importsOf = (s) => imports().filter((i) => i.src === s.id);
  const lastDone = (s) => importsOf(s).find((i) => i.st === "done" || i.st === "superseded") || null;
  const latest = (s) => importsOf(s)[0] || null;
  // ——— Runs that finish (round 2): Connect, Import file and Run now each add a run here (runs.<src>, kind "run", with the moment it
  // was asked, t0) that reads Queued for 1.5 s, then Running while the sync steps light one by one, then Done at 4 s; a moving
  // page redraws itself at each change, and the state is worked out from t0, so it holds across pages and reloads. A done run
  // reads the counts V3 already holds for the source (its last applied import), or, for a source that never ran, what V3 holds
  // that the source would read (derived, notes.json). A V3 import still pending (ACAS's November scan, the switch's queued
  // checklist, the PIC's SBOM) is taken over by the run, which then finishes it. ———
  const QD = 1500, RUN = 4000;
  const runSt = (r) => (!r.t0 ? "done" : Date.now() - r.t0 < QD ? "queued" : Date.now() - r.t0 < RUN ? "running" : "done");
  const myRuns = (s) => get("runs." + s.id, []).filter(Boolean);
  const adopted = (s) => new Set(myRuns(s).map((r) => r.adopt).filter(Boolean));
  // The identity source runs every day through its connector (derived): yesterday's and today's runs.
  const apiRuns = (s) => {
    if (s.id === "idp") return [{ at: TODAY, by: "Automation", file: "Account export · 21 accounts", tool: s.tool, st: "done", read: "21 accounts: 16 in scope, 1 deleted at the source" }, { at: "2026-11-16", by: "Automation", file: "Account export · 21 accounts", tool: s.tool, st: "done", read: "21 accounts: 16 in scope" }, { at: "2026-10-28", by: "Automation", file: "Account export · 21 accounts", tool: s.tool, st: "done", read: "hwalsh deleted at the source: access revoked" }];
    return [];
  };
  const runsOf = (s) => { const ad = adopted(s);
    return (s.api ? apiRuns(s) : importsOf(s).filter((i) => !ad.has(i.file))).map((r, i) => Object.assign({ o: -i }, r)).concat(myRuns(s).map((r) => ({ at: r.at, by: r.by, file: r.what, tool: s.tool, st: runSt(r), read: runSt(r) === "done" ? r.read || "" : runSt(r) === "queued" ? "Queued" : "Reading", mine: true, t0: r.t0 || 0, kind: r.kind })))
      .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : (b.t0 || 0) - (a.t0 || 0) || (b.o || 0) - (a.o || 0))); };
  // What a run of the source reads, from what V3 holds: its last applied import, else (derived) what it would read.
  const readOf = (s) => {
    if (s.id === "idp") return "21 accounts: 16 in scope";
    const d = lastDone(s); if (d && d.read) return d.read;
    if (s.id === "inv-cfg") { const all = comps(), ins = all.filter((c) => c.boundary === "inside"); return `${plural(all.length, "component")} read · ${fmt(ins.length)} inside the boundary`; }
    if (s.id === "jira") return "Change tickets read from project WSX90";
    const p = importsOf(s).find((i) => ["running", "queued", "validating"].includes(i.st));
    return p ? `${p.file}: read and applied` : `${s.file} results read and applied`;
  };
  // Queue a run of the source (lane B's checklist evidence asks through PA.drc.queue). Returns false while one of its own is moving.
  function queueRun(id, what) {
    const s = byId(id); if (!s || s.retired || !connected(s)) return false;
    const mine = myRuns(s).find((r) => r.t0 && runSt(r) !== "done"); if (mine) return false;
    const v3p = !s.api ? importsOf(s).find((i) => ["running", "queued", "validating"].includes(i.st) && !adopted(s).has(i.file)) : null;
    set("runs." + s.id, [{ kind: "run", at: TODAY, by: ME, what: what || (v3p ? v3p.file : s.api ? "Run now" : `${s.id}-${TODAY}${s.file.startsWith(".") ? s.file : ".xml"}`), read: readOf(s), t0: Date.now(), adopt: v3p ? v3p.file : "" }].concat(myRuns(s)));
    tick(); return true;
  }
  // The page redraws itself at each change of a moving run (and of its sync steps).
  let TICK = 0;
  function tick() {
    clearTimeout(TICK); const now = Date.now(); let next = Infinity;
    for (const s of SRC) for (const r of myRuns(s)) if (r.t0 && now - r.t0 < RUN + 200) [QD, QD + 600, QD + 1200, QD + 1800, RUN].forEach((d) => { if (r.t0 + d > now) next = Math.min(next, r.t0 + d); });
    if (next === Infinity) return;
    TICK = setTimeout(() => { if (V3.on() && /^#dr-(source|evidence)/.test(location.hash)) { if (PA.drb && PA.drb.fresh) PA.drb.fresh(); K.redraw(); } tick(); }, Math.max(40, next - now + 40));
  }
  setTimeout(tick, 0);
  const IMP_ST = { running: ["info", "Running"], done: ["ok", "Applied"], cancelled: ["none", "Cancelled"], queued: ["none", "Queued"], rejected: ["bad", "Rejected"], superseded: ["none", "Superseded"], validating: ["info", "Validating"], failed: ["bad", "Failed"] };

  // ——— Health: Healthy, Overdue (past its cadence), Error at the step that failed, Not connected, Retired ———
  function health(s) {
    if (s.retired) return { key: "retired", word: "Retired", tone: "none" };
    if (!connected(s)) return { key: "off", word: "Not connected", tone: "none" };
    const rs = runsOf(s), l = rs[0];
    const done = rs.find((r) => r.st === "done" || r.st === "superseded");
    if (l && (l.st === "failed" || l.st === "rejected") && (!done || done.at < l.at)) return { key: "error", word: "Error", tone: "bad", step: l.st === "failed" ? "Validate" : "Upload", why: l.read, at: l.at };
    if (!done) return l && IMP_ST[l.st] ? { key: "new", word: l.st === "queued" ? "First run queued" : IMP_ST[l.st][1], tone: "none" } : { key: "new", word: "Not yet run", tone: "none" };
    const E = everyOf(s);
    if (E && daysAgo(done.at) > E && !(l && ["running", "queued", "validating"].includes(l.st) && E > 1 && daysAgo(l.at) <= E)) return { key: "overdue", word: "Overdue", tone: "warn", why: `No run in ${daysAgo(done.at)} days; due every ${E}` };
    return { key: "ok", word: "Healthy", tone: "ok" };
  }
  const healthCell = (s) => { const hl = health(s); return `${K.status(hl.word, hl.tone)}${hl.step ? ` ${mu("at " + hl.step)}` : ""}`; };
  const pending = (s) => { const l = runsOf(s)[0]; return l && ["running", "queued", "validating"].includes(l.st) ? l : null; };
  const lastCell = (s) => {
    if (!connected(s)) return none();
    const p = pending(s), d = runsOf(s).find((r) => r.st === "done" || r.st === "superseded");
    if (p) return `<span class="num">${esc(md(p.at))}</span> ${mu("· " + IMP_ST[p.st][1].toLowerCase())}`;
    return d ? `<span class="num">${esc(md(d.at))}</span> ${mu(`· ${daysAgo(d.at)}d ago`)}` : mu("Never");
  };
  const worthCell = (s) => `<span class="drc-wc${connected(s) ? "" : " off"}"${connected(s) ? "" : ' title="Would evidence, once connected"'}><b class="num">${fmt(objOf(s))}</b> objectives · <b class="num">${fmt(ctlsOf(s).length)}</b> controls</span>`;

  // ═══════════════ Resources a source reads, and the scope rules over them ═══════════════
  // The scanner's hosts (derived from the component inventory: a host named for its LRU matches it; the rest wait for a match).
  const ZONES = {
    acas: { label: "Enclave", noun: "hosts", one: "host", list: [["mission", "Mission network · 10.20.0.0/16"], ["ground", "Ground support LAN · 10.30.0.0/16"], ["depot", "Depot maintenance enclave · 10.40.0.0/16"], ["bench", "Integration test bench · 10.90.0.0/16"]] },
    idp: { label: "Directory group", noun: "accounts", one: "account", list: [["eng", "ws-x90-engineering"], ["assess", "ws-x90-assessors"], ["ops", "ws-x90-squadron-ops"], ["depot", "depot-maintenance-users"]] },
  };
  const H = (name, ip, zone, comp, tags) => ({ id: name, name, ip, zone, comp: comp || null, tags: tags || [] });
  const HOSTS = [
    H("lru-001-mc", "10.20.1.11", "mission", "CN-109101"), H("lru-001-mc-maint", "10.20.1.12", "mission", "CN-109101"), H("lru-002-sbc", "10.20.1.21", "mission", "CN-109102"),
    H("lru-003-csm", "10.20.1.31", "mission", "CN-109103"), H("lru-004-nav", "10.20.2.11", "mission", "CN-109104"), H("lru-005-trx", "10.20.2.21", "mission", "CN-109105"),
    H("lru-006-nsi", "10.20.2.31", "mission", "CN-109106"), H("lru-007-pngw", "10.20.3.11", "mission", "CN-109107"), H("lru-009-esw", "10.20.3.31", "mission", "CN-109109"),
    H("lru-010-pic", "10.20.4.11", "mission", "CN-109110"), H("lru-011-psi", "10.20.4.21", "mission", "CN-109111"), H("lru-012-ptu", "10.20.4.22", "mission", "CN-109112"),
    H("lru-014-mag", "10.20.5.21", "mission", "CN-109114"), H("lru-015-ssm", "10.20.5.31", "mission", "CN-109115"), H("lru-016-urc", "10.20.5.41", "mission", "CN-109116"),
    H("tdr-a1", "10.20.3.21", "mission", null, [], "CN-109108"), H("pmc-01", "10.20.5.11", "mission", null, [], "CN-109113"), H("lru-007-pngw-b", "10.20.3.12", "mission", null, ["state:spare"]),
    H("esw-2", "10.20.3.32", "mission", null), H("10.20.4.31", "10.20.4.31", "mission", null),
    H("lru-017-provws", "10.30.1.11", "ground", "CN-109117"), H("lru-019-mlt", "10.30.1.21", "ground", "CN-109119"), H("provws-02", "10.30.1.12", "ground", null),
    H("slc-vm01", "10.30.2.11", "ground", null), H("cfgrepo-01", "10.30.2.21", "ground", null), H("mlt-07", "10.30.1.27", "ground", null),
    H("depot-lt-01", "10.40.1.11", "depot", null), H("depot-lt-02", "10.40.1.12", "depot", null), H("depot-srv-01", "10.40.2.11", "depot", null), H("bench-sim-01", "10.90.1.11", "bench", null, ["env:lab"]),
  ];
  // The directory's accounts for WS-X90 (derived from the program's people; three have no person yet, one was deleted at the source).
  const A = (name, zone, person, extra) => Object.assign({ id: name, name, zone, comp: person || null, tags: [] }, extra || {});
  const ACCTS = [
    A("isolberg", "eng", "Ingrid Solberg"), A("jbarrantes", "eng", "Joel Barrantes"), A("praghavan", "eng", "Priya Raghavan"), A("rcolston", "eng", "Ray Colston"),
    A("mryde", "eng", "Marcus Ryde"), A("sortega", "eng", "Sam Ortega"), A("vamsel", "eng", "Victor Amsel"), A("abell", "eng", "Amara Bell"), A("wduarte", "eng", "Wes Duarte"),
    A("dokafor", "assess", "D. Okafor"), A("nfournier", "assess", "Nadia Fournier"), A("tabara", "ops", "Capt. T. Abara"),
    A("kchen", "eng", null), A("jlee.adm", "eng", null, { tags: ["role:admin"] }), A("mx-shared01", "ops", null, { tags: ["type:shared"] }),
    A("hwalsh", "eng", null, { revoked: "2026-10-28", was: "H. Walsh" }),
    A("svc-acas-scan", "eng", null, { tags: ["type:service"], service: "ACAS vulnerability scan" }),
    A("depot-tech1", "depot", null), A("depot-tech2", "depot", null), A("depot-tech3", "depot", null), A("depot-lead", "depot", null),
  ];
  const resOf = (s) => (s.id === "acas" ? HOSTS : s.id === "idp" ? ACCTS : []);
  const RULES0 = {
    acas: [{ t: "zone", v: "mission", m: "in" }, { t: "zone", v: "ground", m: "in" }, { t: "zone", v: "depot", m: "out" }, { t: "zone", v: "bench", m: "out" }, { t: "tag", v: "env:lab", m: "out" }],
    idp: [{ t: "zone", v: "eng", m: "in" }, { t: "zone", v: "assess", m: "in" }, { t: "zone", v: "ops", m: "in" }, { t: "zone", v: "depot", m: "out" }, { t: "tag", v: "type:service", m: "out" }],
  };
  // The identity source's rules were applied when it was connected (derived); the scanner's are a draft written from the boundary.
  const APPLIED0 = { idp: RULES0.idp };
  const draftOf = (s) => get("rules." + s.id, null) || RULES0[s.id] || [];
  const appliedOf = (s) => get("applied." + s.id, null) || APPLIED0[s.id] || null;
  const glob = (pat, name) => new RegExp("^" + String(pat).split("*").map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$", "i").test(name);
  const ruleHits = (r, x) => (r.t === "zone" ? x.zone === r.v : r.t === "tag" ? x.tags.includes(r.v) : glob(r.v, x.name));
  // Enclave (or group) rules first, then tag and name rules in order: the last rule that matches decides. No rule: out.
  const inScope = (rules, x) => { let v = false; for (const r of rules.filter((r) => r.t === "zone")) if (ruleHits(r, x)) v = r.m === "in"; for (const r of rules.filter((r) => r.t !== "zone")) if (ruleHits(r, x)) v = r.m === "in"; return v; };
  const scopeOf = (s, rules) => { const all = resOf(s); if (!rules) return { inn: all.filter((x) => !x.revoked), out: [] }; return { inn: all.filter((x) => inScope(rules, x)), out: all.filter((x) => !inScope(rules, x)) }; };
  const dirty = (s) => !appliedOf(s) || JSON.stringify(draftOf(s)) !== JSON.stringify(appliedOf(s));

  // ——— Matching: the resources in scope (by the rules as written) against the inventory or the people ———
  const matchMap = (s) => get("match." + s.id, {});
  const matchOf = (s, x) => { const m = matchMap(s)[x.id]; return m ? { to: m, by: "you" } : x.comp ? { to: x.comp, by: "auto" } : null; };
  const toMatch = (s) => scopeOf(s, draftOf(s)).inn.filter((x) => !x.revoked && !x.service);
  const unmatched = (s) => (s.assets ? toMatch(s).filter((x) => !matchOf(s, x)) : []);
  const consCtl = (s) => (s.id === "idp" ? "AC-2" : "CM-8");
  const consLine = (s) => { const n = unmatched(s).length, z = ZONES[s.id]; return n ? `${plural(n, z.one + " not matched", z.noun + " not matched")} · ${objLabel(consCtl(s), 0)} stays unevidenced` : ""; };
  const matchedComps = (s) => { if (!s.assets) return (s.comps || []).filter((c) => comp(c)); if (s.id === "idp") return ["idp"]; return [...new Set(toMatch(s).map((x) => (matchOf(s, x) || {}).to).filter(Boolean))]; };

  // ═══════════════ Actions ═══════════════
  const regV = () => Object.assign({ q: "", kind: "", health: "" }, get("reg", {}));
  K.on("drc.reg.q", (v) => { set("reg", Object.assign(regV(), { q: v || "" })); K.redraw(); });
  K.on("drc.reg.kind", (v) => { set("reg", Object.assign(regV(), { kind: v || "" })); K.redraw(); });
  K.on("drc.reg.health", (v) => { set("reg", Object.assign(regV(), { health: v || "" })); K.redraw(); });
  K.on("drc.reg.clear", () => { set("reg", {}); K.redraw(); });
  const route = (s, tab) => `dr-source--${s.id}${tab && tab !== "overview" ? "--" + tab : ""}`;
  K.on("drc.add", () => K.dialog({ title: "Add source", submit: false, cancel: "Close", body: `<p class="k3-muted">The prototype saves nothing here. The two sources WS-X90's baseline needs and lacks are listed as Not connected; open one and connect it.</p><ul class="drc-addl">${SRC.filter((s) => s.off && !connected(s)).map((s) => `<li><a class="k3-link" href="#${esc(route(s))}">${esc(s.name)}</a> ${mu(`· ${KIND[s.kind]} · would evidence ${fmt(objOf(s))} objectives`)}</li>`).join("")}</ul>` }));
  K.on("drc.connect", (id) => {
    const s = byId(id); if (!s) return;
    K.form({ title: `Connect ${s.name}`, submit: "Connect", intro: `${esc(s.tool)} · it can evidence <b>${fmt(objOf(s))}</b> objectives of ${fmt(ctlsOf(s).length)} controls in WS-X90's baseline.`,
      fields: [{ key: "where", label: s.api ? "Project or base URL" : "Export folder", required: true, value: s.id === "jira" ? "https://jira.example.com/projects/WSX90" : "\\\\cfgrepo-01\\exports\\inventory" }, { key: "owner", label: "Owner", type: "select", required: true, value: ME, options: people().map((p) => [p, p]) }],
      onSubmit: (v) => { set("conn", Object.assign({}, get("conn", {}), { [s.id]: TODAY })); set("where." + s.id, v.where || ""); set("owner", Object.assign({}, get("owner", {}), { [s.id]: v.owner })); queueRun(s.id, "First run"); K.toast(`${s.name} connected: its first run is queued.`); K.redraw(); return null; } });
  });
  K.on("drc.run", (id) => {
    const s = byId(id); if (!s) return;
    const p = pending(s);
    if (!queueRun(s.id)) { K.toast(`A run of ${s.name} is already ${p ? IMP_ST[p.st][1].toLowerCase() : "moving"}.`); return; }
    K.toast(p && !p.mine ? `${s.name}: run queued; it finishes ${p.file}.` : `${s.name}: ${s.api ? "run queued" : "file imported, run queued"}.`); K.redraw();
  });
  K.on("drc.owner", (id) => {
    const s = byId(id); if (!s) return;
    K.form({ title: "Owner of this source", submit: "Save", fields: [{ key: "owner", label: "Owner", type: "select", required: true, value: ownerOf(s) || ME, options: people().map((p) => [p, p]) }],
      onSubmit: (v) => { set("owner", Object.assign({}, get("owner", {}), { [s.id]: v.owner })); K.toast(`${v.owner} owns ${s.name}.`); K.redraw(); return null; } });
  });
  K.on("drc.retire", (id) => { const s = byId(id); if (!s) return; K.confirm({ title: "Retire this source?", text: "The prototype saves nothing here. A retired source keeps its runs as evidence and stops counting toward status.", submit: "Close", onOk: () => {} }); });
  // Scope
  const putRules = (s, rules) => { set("rules." + s.id, rules); set("step." + s.id, ""); };
  K.on("drc.rule.add", (id) => {
    const s = byId(id); if (!s) return;
    K.form({ title: "Add a rule", submit: "Add rule", intro: "Tag and name rules are read after the enclave rules; the last rule that matches decides.",
      fields: [{ key: "t", label: "Match on", type: "select", required: true, value: "name", options: [["name", "Name (use * as a wildcard)"], ["tag", "Tag"], ["zone", ZONES[s.id].label]] }, { key: "v", label: "Value", required: true, value: "", placeholder: s.id === "acas" ? "lru-007-*  or  state:spare" : "svc-*  or  role:admin" }, { key: "m", label: "Then", type: "select", required: true, value: "out", options: [["in", "In scope"], ["out", "Out of scope"]] }],
      onSubmit: (v) => {
        let val = v.v.trim(); if (v.t === "zone") { const z = ZONES[s.id].list.find(([k, l]) => k === val || l.toLowerCase().includes(val.toLowerCase())); if (!z) return { v: `No ${ZONES[s.id].label.toLowerCase()} is called that.` }; val = z[0]; }
        putRules(s, draftOf(s).concat([{ t: v.t, v: val, m: v.m }])); K.redraw(); return null;
      } });
  });
  K.on("drc.rule.drop", (a) => { const s = byId(a.s); if (!s) return; putRules(s, draftOf(s).filter((r, i) => i !== a.i)); K.redraw(); });
  K.on("drc.rule.reset", (id) => { const s = byId(id); if (!s) return; set("rules." + s.id, appliedOf(s) || null); set("step." + s.id, ""); K.redraw(); });
  K.on("drc.scope.review", (id) => { const s = byId(id); if (!s || !dirty(s)) return; set("step." + s.id, "review"); K.redraw(); });
  K.on("drc.scope.back", (id) => { set("step." + id, ""); K.redraw(); });
  K.on("drc.scope.apply", (id) => {
    const s = byId(id); if (!s) return; const sc = scopeOf(s, draftOf(s));
    set("applied." + s.id, draftOf(s)); set("rules." + s.id, draftOf(s)); set("step." + s.id, "");
    set("runs." + s.id, [{ at: TODAY, by: ME, what: "Scope rules applied", read: `${fmt(sc.inn.length)} in scope · ${fmt(sc.out.length)} out` }].concat(get("runs." + s.id, [])));
    K.toast(`Scope applied: ${plural(sc.inn.length, ZONES[s.id].one)} in scope, ${fmt(sc.out.length)} out.`); K.redraw();
  });
  // Matching
  K.on("drc.match.undo", (a) => { const s = byId(a.s); if (!s) return; const m = Object.assign({}, matchMap(s)); delete m[a.x]; set("match." + s.id, m); K.redraw(); });
  const mqV = (s) => Object.assign({ q: "", st: "" }, get("mq." + s.id, {}));
  K.on("drc.mq.q", (v, el) => { const id = el && el.closest("[data-drc-src]") ? el.closest("[data-drc-src]").getAttribute("data-drc-src") : "acas"; const s = byId(id); set("mq." + id, Object.assign(mqV(s), { q: v || "" })); K.redraw(); });
  K.on("drc.mq.st", (v, el) => { const id = el && el.closest("[data-drc-src]") ? el.closest("[data-drc-src]").getAttribute("data-drc-src") : "acas"; const s = byId(id); set("mq." + id, Object.assign(mqV(s), { st: v || "" })); K.redraw(); });
  K.on("drc.objs", (id) => {
    const s = byId(id); if (!s) return;
    const rows = ctlsOf(s).map((c) => `<tr><td>${D.idChip(c, D.tone(ctlKey(c)), { go: ctlRoute(c), title: `${c} · ${STW[ctlKey(c)] || ""}` })}</td><td class="drc-ell">${esc((ctlRec(c) || {}).t || "")}</td><td class="end num">${fmt(objN(c))}</td></tr>`).join("");
    K.dialog({ title: `What ${s.name.split(" — ")[0]} can evidence`, wide: true, submit: false, cancel: "Close", body: `<div class="drc-tw"><table class="drc-mini"><thead><tr><th>Control</th><th>Title</th><th class="end">Objectives</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td></td><td>${fmt(ctlsOf(s).length)} controls</td><td class="end num">${fmt(objOf(s))}</td></tr></tfoot></table></div>` });
  });
  K.on("drc.comps", (id) => {
    const s = byId(id); if (!s) return; const cs = matchedComps(s);
    K.dialog({ title: "Components it covers", submit: false, cancel: "Close", body: `<ul class="drc-addl">${cs.map((c) => `<li><a class="k3-link" href="#component--${esc(c)}">${esc(compName(c))}</a> ${mu(c)}</li>`).join("")}</ul>` });
  });
  // The pickers in the matching cells, and the In/Out of each rule, are selects.
  document.addEventListener("change", (e) => {
    if (!V3.on()) return; const t = e.target; if (!t || !t.matches) return;
    if (t.matches("select[data-drc-match]")) { const s = byId(t.getAttribute("data-drc-src-id")); if (!s || !t.value) return; set("match." + s.id, Object.assign({}, matchMap(s), { [t.getAttribute("data-drc-match")]: t.value })); K.toast(`${t.getAttribute("data-drc-match")} matched to ${s.id === "idp" ? t.value : compName(t.value)}.`); K.redraw(); return; }
    if (t.matches("select[data-drc-rule]")) { const s = byId(t.getAttribute("data-drc-src-id")); if (!s) return; const i = Number(t.getAttribute("data-drc-rule")); putRules(s, draftOf(s).map((r, k) => (k === i ? Object.assign({}, r, { m: t.value }) : r))); K.redraw(); }
  }, true);

  // ═══════════════ 1. The register (dr-sources) ═══════════════
  const HORDER = { error: 0, overdue: 1, off: 2, new: 3, ok: 4, retired: 5 };
  const HWORD = { ok: "Healthy", overdue: "Overdue", error: "Error", off: "Not connected", new: "First run", retired: "Retired" };
  const ask = (v) => SRC.filter((s) => (!v.kind || s.kind === v.kind) && (!v.health || (v.health === "problem" ? ["error", "overdue"].includes(health(s).key) : health(s).key === v.health)) && (!v.q || (s.name + " " + s.tool + " " + KIND[s.kind]).toLowerCase().includes(v.q.toLowerCase())))
    .sort((a, b) => HORDER[health(a).key] - HORDER[health(b).key] || a.name.localeCompare(b.name));
  function registerPage() {
    const v = regV(), rows = ask(v), cnt = (fn) => SRC.filter(fn).length;
    const conn = SRC.filter(connected), off = SRC.filter((s) => !s.retired && !connected(s));
    const objU = (list) => { const seen = new Set(); list.forEach((s) => ctlsOf(s).forEach((c) => seen.add(c))); return [...seen].reduce((a, c) => a + objN(c), 0); };
    const total = ((fact("objectives") || {}).total) || ((SSP && SSP.controls) || []).reduce((a, c) => a + (c.ob || 0), 0);
    const now = objU(conn), more = objU(conn.concat(off)) - now;
    const filters = [
      { label: "Kind", key: "kind", value: v.kind, act: "drc.reg.kind", options: Object.keys(KIND).map((k) => [k, KIND[k], cnt((s) => s.kind === k)]).filter((o) => o[2]) },
      { label: "Health", key: "health", value: v.health, act: "drc.reg.health", options: Object.keys(HWORD).map((k) => [k, HWORD[k], cnt((s) => health(s).key === k)]).filter((o) => o[2]) }];
    const views = { total: SRC.length, all: "All sources", count: (st) => ask({ q: st.q || "", kind: st.kind || "", health: st.health || "" }).length,
      presets: [{ label: "Needs attention", state: { health: "error" }, count: cnt((s) => health(s).key === "error") }, { label: "Not connected", state: { health: "off" }, count: off.length }, { label: "Scanners", state: { kind: "scanner" }, count: cnt((s) => s.kind === "scanner") }],
      seed: [{ name: "STIG checklists past their cadence", state: { kind: "stig", health: "overdue" }, by: "Joel Barrantes" }] };
    D.walkable("drc-src", rows.map((s) => s.id));
    const head = D.review({ title: "Sources register", current: "evidence-sources" }) + K.head({ crumbs: [["Evidence", "evidence"], ["Sources"]], title: "Sources", actions: K.btn("Add source", { primary: true, act: "drc.add" }) });
    const sum = `<p class="drc-sum"><span>Connected sources evidence <b class="num">${fmt(now)}</b> of WS-X90's <span class="num">${fmt(total)}</span> objectives</span>${more ? `<span class="drc-dot" aria-hidden="true">·</span><span>Connecting ${fmt(off.length)} more adds <b class="num">${fmt(more)}</b></span>` : ""}</p>`;
    return K.page({ cls: "k3d drc drc-reg", head, body: [sum,
      K.toolbar({ id: "dr-sources", noun: "sources", search: { act: "drc.reg.q", value: v.q, placeholder: "Search sources" }, filters, views }),
      K.table({ label: "Sources", cls: "drc-srcs", cols: [{ label: "Name" }, { label: "Kind", cls: "nw" }, { label: "Health", cls: "nw" }, { label: "Last run", cls: "nw" }, { label: "Evidences", cls: "nw" }],
        rows: rows.map((s) => ({ go: route(s), peek: { panel: "drc-src", id: s.id }, cls: s.retired ? "drc-ret" : "", cells: [K.name(s.name), esc(KIND[s.kind]), healthCell(s), lastCell(s), worthCell(s)] })),
        empty: { title: "No source matches", line: "Clear the search and the filters.", action: K.btn("Show all sources", { sm: true, act: "drc.reg.clear" }) },
        foot: `<span class="num">${plural(rows.length, "source")}</span>` })] });
  }
  D.route("dr-sources", () => registerPage(), { nav: "sources" });

  // ——— The preview: what the page lists, walkable ———
  D.panel("drc-src", (id) => {
    const s = byId(id); if (!s) return null; const hl = health(s), l = runsOf(s).find((r) => r.st === "done" || r.st === "superseded");
    return { label: "Source preview", status: healthCell(s), title: s.name, open: route(s),
      facts: [["Kind", esc(KIND[s.kind])], ["Last run", lastCell(s)], ["Owner", ownerOf(s) ? K.owner(ownerOf(s)) : mu("No owner")], ["Tool", esc(s.tool)], hl.why ? ["Why", esc(hl.why)] : null],
      body: [K.section({ title: connected(s) ? "Evidences" : "Would evidence", body: worthOf(s) }),
        connected(s) ? K.section({ title: "Sync", body: stepsOf(s) }) : "",
        s.assets ? K.section({ title: "Matching", body: unmatched(s).length ? `<p class="drc-cons">${warnW(consLine(s))}</p>` : mu("Every one matched") }) : "",
        l ? K.section({ title: "Last brought in", body: K.facts([["Run", `<span class="num">${esc(md(l.at))}</span> · ${esc(l.file)}`], ["Read", esc(l.read)]]) }) : ""].join("") };
  });

  // ═══════════════ 2. The record (dr-source--<id>[--tab]) ═══════════════
  function worthOf(s) {
    const cs = matchedComps(s);
    return D.worth([{ label: "objectives", n: objOf(s), act: "drc.objs", arg: s.id }, { label: "controls", n: ctlsOf(s).length, act: "drc.objs", arg: s.id }, { label: cs.length === 1 ? "component" : "components", n: cs.length, go: s.assets && s.id !== "idp" ? route(s, "matching") : cs.length === 1 ? "component--" + cs[0] : null, act: s.assets && s.id !== "idp" ? null : cs.length > 1 ? "drc.comps" : null, arg: s.id }]);
  }
  function stepsOf(s) {
    const steps = s.steps || ["Upload", "Validate", "Match", "Apply"];
    const rs = runsOf(s), l = rs[0], hl = health(s);
    let at = steps.length, state = "done", line = l ? `${md(l.at)} · ${l.read}` : "";
    if (!l) { at = 0; state = "wait"; line = "Waiting for the first run"; }
    else if (l.mine && l.t0 && l.st !== "done") { const el = Date.now() - l.t0; if (l.st === "queued") { at = 0; state = "wait"; line = l.file; } else { at = Math.min(steps.length - 1, Math.max(0, Math.floor((el - QD) / 600))); state = "run"; line = l.file; } }
    else if (hl.key === "error") { at = 1; state = "bad"; line = l.read; if (l.st === "rejected") at = 0; }
    else if (["running", "validating"].includes(l.st)) { at = l.st === "running" ? 0 : 1; state = "run"; line = l.read; }
    else if (l.st === "queued") { at = 1; state = "wait"; line = l.read; }
    const li = (label, i) => { const k = i < at ? "done" : i === at ? state : "later"; const word = { done: "Done", bad: "Failed", run: "Running", wait: "Queued", later: "Waiting" }[k];
      return `<li class="drc-sy drc-sy-${k}"><span class="drc-sy-d" aria-hidden="true">${k === "done" ? D.glyph("ok") : k === "bad" ? D.glyph("x") : ""}</span><span class="drc-sy-l">${esc(label)}</span><span class="drc-sy-w">${esc(word)}</span>${i === at && line ? `<span class="drc-sy-x" title="${esc(line)}">${esc(line)}</span>` : i === steps.length - 1 && at >= steps.length && l ? `<span class="drc-sy-x">${esc(md(l.at))}</span>` : ""}</li>`; };
    return `<ol class="drc-sync">${steps.map(li).join("")}</ol>`;
  }
  const TABS = ["overview", "scope", "matching", "runs"];
  function recordPage(raw) {
    const parts = String(raw).split("--"), s = byId(parts[0]); const tab = TABS.includes(parts[1]) ? parts[1] : "overview";
    if (!s) return K.page({ cls: "k3d drc", head: K.head({ title: "Source" }), body: K.empty({ title: "No such source", line: "It may have been retired.", action: K.btn("All sources", { go: "dr-sources" }) }) });
    const hl = health(s), conn = connected(s);
    // Every source has the same tabs (round 2); a retired one keeps Overview and Runs.
    const tabs = D.tabs([{ label: "Overview", route: route(s), on: tab === "overview" }, !s.retired ? { label: "Scope", route: route(s, "scope"), on: tab === "scope" } : null,
      !s.retired ? { label: "Matching", route: route(s, "matching"), on: tab === "matching", problem: s.assets && conn ? unmatched(s).length : 0 } : null, { label: "Runs", route: route(s, "runs"), on: tab === "runs", count: runsOf(s).length }]);
    const primary = s.retired ? null : !conn ? { label: "Connect", act: "drc.connect", arg: s.id } : s.api ? { label: "Run now", act: "drc.run", arg: s.id } : { label: "Import file", act: "drc.run", arg: s.id };
    const onScope = tab === "scope";
    const head = D.head({ review: D.review({ title: onScope ? "Scope rules" : tab === "matching" ? "Matching" : "Source record", current: onScope ? "system-boundary" : tab === "matching" ? (s.id === "idp" ? "people" : "system") : "evidence-sources" }),
      crumbs: [["Evidence", "evidence"], ["Sources", "dr-sources"], [s.name]], title: s.name,
      facts: [["Health", `${K.status(hl.word, hl.tone)}${hl.step ? ` ${mu("at " + hl.step)}` : ""}`], ["Kind", esc(KIND[s.kind])], ["Last run", lastCell(s)], ["Cadence", everyOf(s) === 1 ? "Daily" : everyOf(s) ? `Every ${everyOf(s)} days` : "Each release"], ["Tool", esc(s.tool)], ["Owner", ownerOf(s) ? K.owner(ownerOf(s)) : mu("No owner"), s.retired ? null : { act: "drc.owner", arg: s.id }]],
      actions: { more: [{ label: "See today's source preview", go: "evidence-sources" }, s.retired ? null : { label: "Retire source", act: "drc.retire", arg: s.id, danger: true }].filter(Boolean), [onScope ? "secondary" : "primary"]: primary },
      tabs });
    const body = tab === "runs" ? runsTab(s) : tab === "overview" || s.retired ? overviewTab(s) : !conn ? notYet(s, tab) : tab === "scope" ? (s.assets ? scopeTab(s) : oneTarget(s) ? scopeOne(s) : scopeAny(s)) : s.assets ? matchTab(s) : oneTarget(s) ? matchOne(s) : matchAny(s);
    tick();
    return K.page({ cls: "k3d drc drc-rec k3-rec", head, body });
  }
  D.routeLike("dr-source", (id) => recordPage(id), { nav: "sources" });

  function overviewTab(s) {
    const conn = connected(s), hl = health(s), l = runsOf(s).find((r) => r.st === "done" || r.st === "superseded");
    const chips = `<ul class="drc-chips">${ctlsOf(s).map((c) => `<li>${D.idChip(c, D.tone(ctlKey(c)), { go: ctlRoute(c), title: `${c} ${(ctlRec(c) || {}).t || ""} · ${STW[ctlKey(c)] || ""}` })}</li>`).join("")}</ul>`;
    const oe = ctlsOf(s).reduce((a, c) => a + Math.min(objN(c), (ctlRec(c) || {}).oe || 0), 0);
    const today = `<p class="drc-p k3-muted">Objectives with evidence today: <b class="num drc-ink">${fmt(oe)}</b> of <span class="num">${fmt(objOf(s))}</span></p>`;
    const evid = D.box(conn ? "Evidences" : "Would evidence", [worthOf(s), chips, today, conn ? "" : `<p class="k3-muted drc-p">Not connected: WS-X90's baseline selects these controls, and nothing evidences them automatically.</p>`]);
    const problem = hl.key === "overdue" ? `<p class="drc-cons">${warnW("Overdue")} ${esc(hl.why)}</p>` : "";
    const sync = conn ? D.box("Sync", [problem, stepsOf(s)]) : "";
    const last = conn && l ? D.box("Last brought in", [K.facts([["Run", `<span class="num">${esc(mdy(l.at))}</span> · ${esc(l.by)}`], ["File", esc(l.file)], ["Read", esc(l.read)]]), `<p class="drc-p">${K.link("All runs", route(s, "runs"))}</p>`]) : "";
    let scope = "";
    if (s.assets && conn) {
      const z = ZONES[s.id], sc = scopeOf(s, draftOf(s)), un = unmatched(s).length;
      scope = D.box("Scope and matching", [K.facts([["In scope", `<span class="num">${fmt(sc.inn.length)}</span> ${esc(z.noun)} ${mu(`· ${fmt(sc.out.length)} out`)}`], ["Rules", dirty(s) ? `${warnW(appliedOf(s) ? "Changed, not applied" : "Not applied")} ${K.link("Review", route(s, "scope"))}` : `${plural(draftOf(s).length, "rule")} applied ${K.link("View", route(s, "scope"))}`], ["Matched", un ? `${warnW(plural(un, "not matched", "not matched"))} ${K.link("Match", route(s, "matching"))}` : `Every one ${K.link("View", route(s, "matching"))}`]])]);
    }
    const comps = !s.assets && matchedComps(s).length ? D.box("Covers", K.facts(matchedComps(s).map((c) => [comp(c) ? comp(c).kind : "Component", K.link(compName(c), "component--" + c)]))) : "";
    return D.sunken([`<div class="drc-grid">${evid}${sync || comps}</div>`, `<div class="drc-grid">${scope || last}${scope ? last : sync ? comps : ""}</div>`]);
  }

  function scopeTab(s) {
    const z = ZONES[s.id], rules = draftOf(s), sc = scopeOf(s, rules), ap = appliedOf(s), was = scopeOf(s, ap);
    const isIn = new Set(sc.inn.map((x) => x.id)), wasIn = new Set(was.inn.map((x) => x.id));
    const join = sc.inn.filter((x) => !wasIn.has(x.id)).length, leave = was.inn.filter((x) => !isIn.has(x.id)).length;
    if (get("step." + s.id, "") === "review" && dirty(s)) {
      const zoneIn = sc.inn.filter((x) => rules.some((r) => r.t === "zone" && r.m === "in" && ruleHits(r, x))).length;
      const byRule = sc.inn.length - zoneIn;
      const mv = D.moving({ title: `Apply the scope rules to ${s.name.split(" — ")[0]}`, rows: [{ label: `${z.noun[0].toUpperCase() + z.noun.slice(1)} in WS-X90's ${s.id === "idp" ? "groups" : "enclaves"}`, n: zoneIn, locked: true }, byRule > 0 ? { label: "Brought in by a tag or name rule", n: byRule } : null, { label: `Left out: ${s.id === "idp" ? "another group" : "outside the boundary"}, or by a rule`, n: sc.out.length }].filter(Boolean),
        moving: sc.inn.length, notMoving: sc.out.length,
        consequence: sc.out.length ? `${s.id === "idp" ? "Accounts" : "Findings on"} the ${fmt(sc.out.length)} stop counting toward WS-X90${s.id === "idp" ? "'s AC-2 review" : ""}.` : `Every ${z.one} counts toward WS-X90.` });
      const delta = ap ? `<p class="drc-p k3-muted">Since the rules last applied: <b class="num">${fmt(join)}</b> join · <b class="num">${fmt(leave)}</b> leave.</p>` : `<p class="drc-p k3-muted">Today every ${esc(z.one)} the source reached counts: <span class="num">${fmt(resOf(s).length)}</span>.</p>`;
      return D.sunken(D.box("Review before applying", [mv, delta, `<div class="drc-acts">${K.btn("Back to rules", { act: "drc.scope.back", arg: s.id })}${K.btn("Apply scope", { primary: true, act: "drc.scope.apply", arg: s.id })}</div>`]));
    }
    const label = (r) => (r.t === "zone" ? (z.list.find(([k]) => k === r.v) || [r.v, r.v])[1] : r.v);
    const kindW = (r) => (r.t === "zone" ? z.label : r.t === "tag" ? "Tag" : "Name");
    const nOf = (r) => resOf(s).filter((x) => ruleHits(r, x)).length;
    const row = (r, i) => `<tr><td class="nw">${esc(kindW(r))}</td><td class="drc-ell"><span class="${r.t === "zone" ? "" : "drc-mono"}">${esc(label(r))}</span></td><td class="end num">${fmt(nOf(r))}</td><td class="nw"><select class="drc-sel" data-drc-rule="${i}" data-drc-src-id="${esc(s.id)}" aria-label="${esc(label(r))}: in or out"><option value="in"${r.m === "in" ? " selected" : ""}>In scope</option><option value="out"${r.m === "out" ? " selected" : ""}>Out of scope</option></select></td><td class="end nw"><button type="button" class="btn sm k3-quiet" aria-label="Remove the rule ${esc(label(r))}"${K.a("drc.rule.drop", { s: s.id, i })}>Remove</button></td></tr>`;
    const zoneRules = rules.map((r, i) => [r, i]).filter(([r]) => r.t === "zone"), otherRules = rules.map((r, i) => [r, i]).filter(([r]) => r.t !== "zone");
    const tbl = (title, list) => `<h4 class="drc-h4">${esc(title)}</h4><div class="drc-tw"><table class="drc-rules"><thead><tr><th>Match on</th><th>Value</th><th class="end">Reaches</th><th>Then</th><th class="end"><span class="k3-sr">Remove</span></th></tr></thead><tbody>${list.map(([r, i]) => row(r, i)).join("") || `<tr><td colspan="5" class="k3-muted">No rule yet</td></tr>`}</tbody></table></div>`;
    const live = `<div class="drc-live" aria-live="polite"><div class="drc-live-n"><span class="drc-live-l">In scope</span><b class="num">${fmt(sc.inn.length)}</b>${ap && join - leave ? `<span class="drc-live-d num">${join - leave > 0 ? "+" : "−"}${fmt(Math.abs(join - leave))}</span>` : ""}</div><div class="drc-live-n"><span class="drc-live-l">Out of scope</span><b class="num">${fmt(sc.out.length)}</b></div><div class="drc-live-n"><span class="drc-live-l">Rules</span><b class="num">${fmt(rules.length)}</b></div></div>`;
    const status = dirty(s) ? `<p class="drc-p">${ap ? warnW("Changed, not applied") : warnW("Not applied")} ${mu(ap ? "· the applied rules still decide" : `· written from the boundary; until applied, all ${fmt(resOf(s).length)} count`)}</p>` : `<p class="drc-p k3-muted">Applied. These rules decide which ${esc(z.noun)} count toward WS-X90.</p>`;
    const acts = `<div class="drc-acts">${K.btn("Add rule", { act: "drc.rule.add", arg: s.id })}${ap && dirty(s) ? K.btn("Discard changes", { act: "drc.rule.reset", arg: s.id }) : ""}${K.btn("Apply scope", { primary: true, act: "drc.scope.review", arg: s.id, disabled: dirty(s) ? "" : "Change a rule first" })}</div>`;
    const list = `<div class="drc-tw"><table class="drc-mini"><thead><tr><th>${esc(z.one[0].toUpperCase() + z.one.slice(1))}</th><th>${esc(z.label)}</th><th>Scope</th></tr></thead><tbody>${resOf(s).map((x) => `<tr><td class="drc-mono drc-ell">${esc(x.name)}</td><td class="drc-ell">${esc((z.list.find(([k]) => k === x.zone) || ["", x.zone])[1])}</td><td class="nw">${isIn.has(x.id) ? "In" : mu("Out")}</td></tr>`).join("")}</tbody></table></div>`;
    return D.sunken(`<div class="drc-grid drc-g2">${D.box("Scope rules", [status, live, tbl(`${z.label} rules`, zoneRules), tbl("Tag and name rules · the last match decides", otherRules), acts])}${D.box(`What the rules reach · ${fmt(resOf(s).length)} ${z.noun}`, list)}</div>`);
  }

  function matchTab(s) {
    const z = ZONES[s.id], v = mqV(s), all = toMatch(s).concat(s.id === "idp" ? resOf(s).filter((x) => x.revoked && inScope(draftOf(s), x)) : []);
    const stOf = (x) => (x.revoked ? "revoked" : matchOf(s, x) ? "ok" : "un");
    const rows0 = all.filter((x) => (!v.st || stOf(x) === v.st) && (!v.q || (x.name + " " + (x.ip || "") + " " + ((matchOf(s, x) || {}).to || "")).toLowerCase().includes(v.q.toLowerCase())))
      .sort((a, b) => ({ un: 0, ok: 1, revoked: 2 }[stOf(a)] - { un: 0, ok: 1, revoked: 2 }[stOf(b)]) || a.name.localeCompare(b.name, "en", { numeric: true }));
    const isPeople = s.id === "idp";
    const opts = isPeople ? people().map((p) => [p, p]) : inside().map((c) => [c.code, `${c.name} · ${c.code}`]);
    const picker = (x) => `<select class="drc-sel drc-pick" data-drc-match="${esc(x.id)}" data-drc-src-id="${esc(s.id)}" aria-label="Match ${esc(x.name)} to ${isPeople ? "a person" : "a component"}"><option value="">${isPeople ? "Choose a person" : "Choose a component"}</option>${opts.map(([val, l]) => `<option value="${esc(val)}">${esc(l)}</option>`).join("")}</select>`;
    const toCell = (x) => { if (x.revoked) return mu(x.was || "—"); const m = matchOf(s, x); if (!m) return picker(x); return isPeople ? K.owner(m.to) : K.link(compName(m.to), "component--" + m.to); };
    const stCell = (x) => (x.revoked ? `${K.status("Access revoked", "none")} ${mu(md(x.revoked))}` : !matchOf(s, x) ? warnW("Not matched") : matchOf(s, x).by === "you" ? `${K.status("Matched", "ok")} ${K.actLink("Undo", "drc.match.undo", { s: s.id, x: x.id })}` : K.status("Matched", "ok"));
    const cols = isPeople ? [{ label: "Account" }, { label: "Group", cls: "nw" }, { label: "Person", cls: "nw" }, { label: "Status", cls: "nw" }, { label: "Last sign-in", cls: "nw" }]
      : [{ label: "Asset" }, { label: "Address", cls: "nw" }, { label: "Enclave", cls: "nw" }, { label: "Component", cls: "nw" }, { label: "Status", cls: "nw" }];
    const seen = (x) => { const n = [...x.name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 9; return x.revoked ? md(x.revoked) : md(new Date(ms(TODAY) - n * 864e5).toISOString().slice(0, 10)); };
    const zoneW = (x) => esc((z.list.find(([k]) => k === x.zone) || ["", x.zone])[1].split(" · ")[0]);
    const cnt = (k) => all.filter((x) => stOf(x) === k).length;
    const n = unmatched(s).length;
    const line = n ? `<p class="drc-cons">${warnW(consLine(s))} ${mu(isPeople ? "· AC-2 reviews an account only through its person" : "· CM-8 counts a host once it is in the inventory")}</p>` : `<p class="drc-cons k3-muted">Every ${esc(z.one)} in scope is matched · ${esc(objLabel(consCtl(s), 0))} can count this source</p>`;
    return `<div data-drc-src="${esc(s.id)}">${line}${K.toolbar({ id: "dr-source-match-" + s.id, noun: z.noun, search: { act: "drc.mq.q", value: v.q, placeholder: `Search ${z.noun}` }, filters: [{ label: "Status", key: "st", value: v.st, act: "drc.mq.st", options: [["un", "Not matched", cnt("un")], ["ok", "Matched", cnt("ok")], ["revoked", "Access revoked", cnt("revoked")]].filter((o) => o[2]) }], views: { total: all.length, all: `All ${z.noun}`, presets: [{ label: "Not matched", state: { st: "un" }, count: cnt("un") }] } })}
      ${K.table({ label: isPeople ? "Accounts" : "Assets", cls: "drc-match", keep: true, cols, rows: rows0.map((x) => ({ cls: stOf(x) === "un" ? "drc-un" : "", cells: isPeople ? [`<span class="drc-mono">${esc(x.name)}</span>`, zoneW(x), toCell(x), stCell(x), `<span class="num">${esc(seen(x))}</span>`] : [`<span class="drc-mono">${esc(x.name)}</span>`, `<span class="num">${esc(x.ip)}</span>`, zoneW(x), toCell(x), stCell(x)] })),
        empty: { title: `No ${z.one} matches`, line: "Clear the search and the filter." }, foot: `<span class="num">${plural(rows0.length, z.one, z.noun)}</span>` })}</div>`;
  }

  // ═══════════════ Scope and Matching for a source that reads one component (round 2) ═══════════════
  // A STIG checklist reads one host: its scope is that component and the rules of its STIG (from V3's checklists, read through
  // lane B's PA.drb.checklists), and its matching is the host it ran on, matched to that component by the checklist's asset. An
  // SBOM and a container scan read one image of one component. The host of each is the scanner's host for that component's LRU
  // (derived, notes.json); the images are named for the component.
  const TARGET = { "stig-mc": "lru-001-mc", "stig-asd": "lru-001-mc", "stig-sw": "lru-009-esw", "stig-gw": "lru-007-pngw", "scap-lt": "lru-019-mlt" };
  const IMAGE = { "sbom-mc": ["mission-computer-maint-image:v2", "Image"], "sbom-pic": ["pic-firmware-7.3.bin", "Image"], "sarif-tel": ["telemetry-services:2026.10", "Image"], "inv-cfg": ["\\\\cfgrepo-01\\exports\\inventory", "Export"] };
  const oneTarget = (s) => !s.assets && (s.comps || []).length > 0;
  const cklsOf = (s) => (s.kind === "stig" && PA.drb && PA.drb.checklists ? PA.drb.checklists().filter((c) => c.src === s.id) : []);
  const targetOf = (s) => { const c = (s.comps || [])[0], h = HOSTS.find((x) => x.id === TARGET[s.id]) || HOSTS.find((x) => x.comp === c), img = IMAGE[s.id];
    return { comp: c, name: img ? img[0] : h ? h.name : c, ip: !img && h ? h.ip : "", zone: !img && h ? h.zone : "", what: img ? img[1] : "Host" }; };
  const liveRow = (cells) => `<div class="drc-live">${cells.filter(([l, n], i) => i === 0 || n > 0).map(([l, n]) => `<div class="drc-live-n"><span class="drc-live-l">${esc(l)}</span><b class="num">${fmt(n)}</b></div>`).join("")}</div>`;
  function scopeOne(s) {
    const t = targetOf(s), cks = cklsOf(s), c = comp(t.comp), z = ZONES.acas;
    const pk = (/(\d[\d,]*) components?/.exec(readOf(s)) || [])[1];
    const what = s.id === "inv-cfg" ? "An inventory export reads the Configuration Repository's list. Its scope is the components it lists." : s.kind === "stig" ? `A checklist reads one host. Its scope is that component and the rules of its STIG${cks.length > 1 ? "s" : ""}; a rule marked Not applicable stays out of the count.`
      : s.kind === "inventory" ? "An SBOM describes one component's image. Its scope is that component and the packages the SBOM lists." : "A container scan reads one image. Its scope is the component built from it.";
    const live = s.kind === "stig" ? liveRow([["Components", 1], ["Rules in scope", cks.reduce((a, k) => a + k.total - k.na, 0)], ["Not applicable", cks.reduce((a, k) => a + k.na, 0)], ["Open", cks.reduce((a, k) => a + k.open, 0)]])
      : liveRow(s.id === "inv-cfg" ? [["Repository", 1], ["Components listed", pk ? +pk.replace(/,/g, "") : 0]] : [["Components", 1], ["Packages", pk ? +pk.replace(/,/g, "") : 0]]);
    const tbl = cks.length ? `<h4 class="drc-h4">Rules, by checklist</h4><div class="drc-tw"><table class="drc-mini drc-ckt"><thead><tr><th>Checklist</th><th class="end">Rules</th><th class="end">Not applicable</th><th class="end">In scope</th><th class="end">Open</th></tr></thead><tbody>${cks.map((k) => `<tr><td class="drc-ell"><a class="k3-link" href="#${esc(k.route)}">${esc(k.stig)}</a></td><td class="end num">${fmt(k.total)}</td><td class="end num">${fmt(k.na)}</td><td class="end num">${fmt(k.total - k.na)}</td><td class="end num">${fmt(k.open)}</td></tr>`).join("")}</tbody></table></div>` : "";
    const scope = D.box("Scope", [`<p class="drc-p k3-muted">${esc(what)}</p>`, live, tbl]);
    const where = t.zone ? (z.list.find(([k]) => k === t.zone) || ["", t.zone])[1] : "";
    const compBox = D.box("Component", K.facts([["Component", `${K.link(compName(t.comp), "component--" + t.comp)} ${mu(t.comp)}`], ["Kind", esc(c ? c.kind : "")], ["Boundary", c && c.boundary !== "inside" ? mu("Outside WS-X90's boundary") : "Inside WS-X90's boundary"], [t.what, `<span class="drc-mono">${esc(t.name)}</span>`], where ? ["Enclave", esc(where)] : null].filter(Boolean)));
    return D.sunken(`<div class="drc-grid drc-g2">${scope}${compBox}</div>`);
  }
  function matchOne(s) {
    const t = targetOf(s), cks = cklsOf(s), host = t.what === "Host";
    const by = s.kind === "stig" ? `Its asset, ${cks[0] ? cks[0].asset : compName(t.comp)}` : "The image's name";
    const line = `<p class="drc-cons k3-muted">${host ? "1 host" : "1 image"} in scope, matched · ${esc(objLabel(s.kind === "stig" ? "CM-6" : "CM-8", 0))} can count this source</p>`;
    const cols = [{ label: host ? "Host" : "Image" }, { label: host ? "Address" : "Read", cls: "nw" }, { label: "Component", cls: "nw" }, { label: "Matched by", cls: "nw" }, { label: "Status", cls: "nw" }];
    const row = { cells: [`<span class="drc-mono">${esc(t.name)}</span>`, host ? `<span class="num">${esc(t.ip)}</span>` : esc(s.file), K.link(compName(t.comp), "component--" + t.comp), esc(by), K.status("Matched", "ok")] };
    return `<div data-drc-src="${esc(s.id)}">${line}${K.table({ label: "Matching", cls: "drc-match", keep: true, cols, rows: [row], foot: `<span class="num">1 ${host ? "host" : "image"}</span>` })}</div>`;
  }
  // A source that reads a project rather than a component (the change tickets): what it reads, and nothing to match.
  function scopeAny(s) {
    return D.sunken(D.box("Scope", [`<p class="drc-p k3-muted">It reads one project. Each ticket names the components and controls it changes.</p>`, K.facts([["Reads", esc(s.tool)], ["Where", `<span class="drc-mono">${esc(get("where." + s.id, "") || "—")}</span>`], ["Controls", `<span class="num">${fmt(ctlsOf(s).length)}</span>`]])]));
  }
  const matchAny = (s) => `<div data-drc-src="${esc(s.id)}">${K.empty({ title: "Nothing to match", line: "Each ticket names its own component." })}</div>`;
  const notYet = (s, tab) => `<div data-drc-src="${esc(s.id)}">${K.empty({ title: "Not connected", line: tab === "scope" ? "Connect it first; then set what it reads." : "Connect it first; then match what it reads." })}</div>`;

  function runsTab(s) {
    const v = get("rq." + s.id, ""), rs = runsOf(s).filter((r) => !v || (r.file + " " + r.read + " " + r.by).toLowerCase().includes(v.toLowerCase()));
    return `<div data-drc-src="${esc(s.id)}">${K.toolbar({ search: { act: "drc.rq", value: v, placeholder: "Search runs" }, views: false })}${K.table({ label: "Runs", cls: "drc-runs", keep: true, cols: [{ label: "Run" }, { label: "Read", cls: "" }, { label: "State", cls: "nw" }, { label: "By", cls: "nw" }],
      rows: rs.map((r) => ({ cells: [`<span class="num">${esc(md(r.at))}</span> · ${esc(r.file)}`, `<span class="drc-ell-i" title="${esc(r.read)}">${esc(r.read)}</span>`, K.status(IMP_ST[r.st][1], IMP_ST[r.st][0]), K.owner(r.by)] })), empty: { title: "No run yet", line: connected(s) ? "Its first run is queued." : "Connect the source first." }, foot: `<span class="num">${plural(rs.length, "run")}</span>` })}</div>`;
  }
  K.on("drc.rq", (v, el) => { const id = el && el.closest("[data-drc-src]") ? el.closest("[data-drc-src]").getAttribute("data-drc-src") : "acas"; set("rq." + id, v || ""); K.redraw(); });

  PA.drc = { SRC, health, objOf, ctlsOf, unmatched, scopeOf, draftOf, appliedOf, queue: (id) => queueRun(id), runsOf: (id) => (byId(id) ? runsOf(byId(id)) : []) };
})();
