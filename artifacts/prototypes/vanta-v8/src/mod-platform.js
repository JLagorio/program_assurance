// mod-platform: evidence sources, integrations, data calls, reports, deadlines, notifications,
// event log, enclaves, common control providers, components and the Mission Computer record.
// Real rows were read from the local database on 17 Nov 2026 (read-only); anything else is marked Example.
(() => {
  const { S, P, M, ROUTE_NAV, data, h } = window.PA;
  const { esc, fmt, pct, day, gl, pill, tag, who, bar, header, completion, attention, tools, table, page, pair, sevPill } = h;
  const TODAY = data.TODAY;
  const EX = '<span class="ex">Example</span>';
  const PROP = '<span class="ex">Proposal</span>';
  const REAL = '<span class="platform-real">In the app</span>';
  const ago = (iso) => Math.round((TODAY - new Date(iso.slice(0, 10) + "T12:00:00")) / 86400000);
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const utc = (iso) => `${MON[+iso.slice(5, 7) - 1]} ${+iso.slice(8, 10)}${iso.slice(0, 4) !== "2026" ? ", " + iso.slice(0, 4) : ""} · ${iso.slice(11, 16)} UTC`;
  const trunc = (t, cls = "") => `<span class="platform-trunc ${cls}" title="${esc(t)}">${esc(t)}</span>`;
  const muted = (t) => `<span class="platform-muted">${esc(t)}</span>`;
  const none = (t) => `<span class="who">${gl("ring")}${esc(t)}</span>`;
  const num = (n) => `<span class="num">${typeof n === "number" ? fmt(n) : esc(n)}</span>`;
  const kv = (pairs) => `<dl class="kv">${pairs.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
  const sect = (title, count, body) => `<div class="sect"><div class="sh">${esc(title)}${count != null ? `<span class="num platform-nw">${typeof count === "number" ? fmt(count) : count}</span>` : ""}</div><div class="sb">${body}</div></div>`;
  const sbRow = (l, r) => `<div class="platform-sb-row"><span>${l}</span>${r}</div>`;
  const head4 = (title, action) => `<div class="platform-h"><h4>${esc(title)}</h4>${action || ""}</div>`;
  const tabs = (list, cur) => `<div class="tabsx platform-tabs" role="tablist">${list.map(([r, l, c]) => `<span role="tab" tabindex="0" data-go="${r}" aria-selected="${r === cur}"${r === cur ? ' class="on"' : ""}>${esc(l)}${c != null ? ` <span class="ct">${fmt(c)}</span>` : ""}</span>`).join("")}</div>`;
  const qviews = (list, cur) => `<div class="views">${list.map(([r, l, n]) => `<span class="qv platform-qv${r === cur ? " on" : ""}" role="link" tabindex="0" data-go="${r}">${esc(l)} <span class="num">${fmt(n)}</span></span>`).join("")}</div>`;
  const nav = (routes, parent) => routes.forEach((r) => { ROUTE_NAV[r] = parent; });
  const btn = (label, attrs = "", ink = false) => `<button type="button" class="btn${ink ? " ink" : ""}" ${attrs}>${label}</button>`;
  const sm = (label, attrs = "", ink = false) => `<button type="button" class="btn sm${ink ? " ink" : ""}" ${attrs}>${label}</button>`;
  const field = (label, control, hint) => `<div class="platform-field"><span class="lb">${esc(label)}</span>${control}${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
  const choice = (group, val, on, title, line, small) => `<button type="button" class="platform-choice" data-plat-pick="${esc(group)}" data-val="${esc(val)}" aria-pressed="${on}"><b>${title}</b>${line ? `<span>${line}</span>` : ""}${small ? `<small>${small}</small>` : ""}</button>`;
  const pickRow = (group, val, on, label, meta, radio = true) => `<button type="button" class="platform-choice" data-plat-pick="${esc(group)}" data-val="${esc(val)}" aria-pressed="${on}"${radio ? " data-radio" : ""}><span class="platform-box${radio ? " platform-radio" : ""}" aria-hidden="true"></span><span>${label}</span>${meta ? `<small>${meta}</small>` : "<small></small>"}</button>`;
  const cancel = '<button type="button" class="btn" data-close-modal>Cancel</button>';
  const close = '<button type="button" class="btn" data-close-modal>Close</button>';
  const done = (label) => `${cancel}<button type="button" class="btn ink" data-close-modal>${esc(label)}</button>`;

  // ——— WS-X90 control statuses, from program_control_status ———
  const CTL = {
    "AC-2": ["Account Management", "satisfied"], "AC-2(1)": ["Automated System Account Management", "satisfied"], "AC-2(3)": ["Disable Accounts", "satisfied"],
    "AC-7": ["Unsuccessful Logon Attempts", "satisfied"], "AC-12": ["Session Termination", "partially_satisfied"], "AC-17": ["Remote Access", "satisfied"],
    "AU-2": ["Event Logging", "satisfied"], "AU-6": ["Audit Record Review, Analysis, and Reporting", "partially_satisfied"], "AU-6(1)": ["Automated Process Integration", "satisfied"],
    "AU-12": ["Audit Record Generation", "satisfied"], "CA-2": ["Control Assessments", "partially_satisfied"], "CA-5": ["Plan of Action and Milestones", "satisfied"],
    "CA-7": ["Continuous Monitoring", "satisfied"], "CM-2": ["Baseline Configuration", "partially_satisfied"], "CM-2(2)": ["Automation Support for Accuracy and Currency", "satisfied"],
    "CM-6": ["Configuration Settings", "satisfied"], "CM-6(1)": ["Automated Management, Application, and Verification", "satisfied"], "CM-7": ["Least Functionality", "satisfied"],
    "CM-7(1)": ["Periodic Review", "not_assessed"], "CM-8": ["System Component Inventory", "satisfied"], "CM-8(1)": ["Updates During Installation and Removal", "satisfied"],
    "CM-8(3)": ["Automated Unauthorized Component Detection", "not_assessed"], "CM-10": ["Software Usage Restrictions", "satisfied"], "CM-11": ["User-installed Software", "partially_satisfied"],
    "CP-7": ["Alternate Processing Site", "no_evidence"], "CP-9": ["System Backup", "satisfied"], "IA-2": ["Identification and Authentication (Organizational Users)", "satisfied"],
    "IA-2(1)": ["Multi-factor Authentication to Privileged Accounts", "not_assessed"], "IA-2(2)": ["Multi-factor Authentication to Non-privileged Accounts", "not_assessed"],
    "IA-2(8)": ["Access to Accounts — Replay Resistant", "not_assessed"], "IA-4": ["Identifier Management", "satisfied"], "IA-5": ["Authenticator Management", "other_than_satisfied"],
    "IA-5(1)": ["Password-based Authentication", "not_assessed"], "IA-5(2)": ["Public Key-based Authentication", "not_assessed"], "IA-8": ["Identification and Authentication (Non-organizational Users)", "partially_satisfied"],
    "IR-4": ["Incident Handling", "satisfied"], "IR-4(1)": ["Automated Incident Handling Processes", "satisfied"], "IR-5": ["Incident Monitoring", "satisfied"], "IR-6": ["Incident Reporting", "satisfied"],
    "MA-4": ["Nonlocal Maintenance", "satisfied"], "PE-2": ["Physical Access Authorizations", "no_evidence"], "PE-3": ["Physical Access Control", "satisfied"], "PE-6": ["Monitoring Physical Access", "satisfied"],
    "RA-3": ["Risk Assessment", "partially_satisfied"], "RA-5": ["Vulnerability Monitoring and Scanning", "satisfied"], "RA-5(2)": ["Update Vulnerabilities to Be Scanned", "partially_satisfied"],
    "RA-5(5)": ["Privileged Access", "satisfied"], "RA-5(11)": ["Public Disclosure Program", "no_evidence"], "SA-11": ["Developer Testing and Evaluation", "no_evidence"],
    "SA-11(1)": ["Static Code Analysis", "not_assessed"], "SA-15": ["Development Process, Standards, and Tools", "not_assessed"], "SA-22": ["Unsupported System Components", "no_evidence"],
    "SC-7": ["Boundary Protection", "satisfied"], "SC-12": ["Cryptographic Key Establishment and Management", "satisfied"], "SC-13": ["Cryptographic Protection", "no_evidence"],
    "SC-17": ["Public Key Infrastructure Certificates", "satisfied"], "SI-2": ["Flaw Remediation", "not_assessed"], "SI-2(2)": ["Automated Flaw Remediation Status", "satisfied"],
    "SI-2(3)": ["Time to Remediate Flaws and Benchmarks for Corrective Actions", "no_evidence"], "SI-4": ["System Monitoring", "satisfied"], "SI-5": ["Security Alerts, Advisories, and Directives", "satisfied"],
    "SI-7": ["Software, Firmware, and Information Integrity", "no_evidence"], "SR-3": ["Supply Chain Controls and Processes", "no_evidence"], "SR-4": ["Provenance", "satisfied"],
    "SR-5": ["Acquisition Strategies, Tools, and Methods", "satisfied"], "SR-6": ["Supplier Assessments and Reviews", "satisfied"], "SR-11": ["Component Authenticity", "partially_satisfied"],
  };
  const ST = { satisfied: ["ok", "Satisfied"], partially_satisfied: ["part", "Partially satisfied"], other_than_satisfied: ["bad", "Other than satisfied"], not_assessed: ["info", "Not assessed"], no_evidence: ["none", "No evidence"], no_requirement: ["none", "No requirement"], to_review: ["warn", "To review"] };
  const stPill = (s) => pill(ST[s][0], ST[s][1]);
  const ctlRows = (codes) => codes.map((c) => sbRow(`<b style="font-weight:500">${esc(c)}</b> ${esc(CTL[c][0])}`, stPill(CTL[c][1]))).join("");
  const satOf = (codes) => codes.filter((c) => CTL[c][1] === "satisfied").length;

  // ——— Evidence sources: WS-X90's scanner ingestion jobs and SBOMs ———
  const INFORMS = {
    nessus: ["RA-5", "RA-5(2)", "RA-5(5)", "RA-5(11)", "SI-2", "SI-2(2)", "SI-2(3)", "CM-8", "CM-8(1)", "CM-8(3)", "SI-5"],
    ckl: ["CM-6", "CM-6(1)", "CM-7", "CM-7(1)", "CM-2", "CM-2(2)", "AC-17", "IA-5", "AU-2", "AU-12"],
    scap: ["CM-6", "CM-6(1)", "CM-7", "CM-7(1)", "CM-2", "IA-5", "AU-12", "CM-11"],
    sbom: ["CM-8", "CM-10", "SR-3", "SR-4", "SR-5", "SR-6", "SR-11", "SA-22", "RA-5", "SI-7"],
    sarif: ["SA-11", "SA-11(1)", "SA-15", "RA-5", "SI-2"],
    emass: ["CA-2", "CA-5", "CA-7", "RA-3"],
  };
  const SRC = [
    { id: "acas", name: "ACAS vulnerability scan — mission network", type: "nessus", kind: ".nessus", reads: "Hosts, plugins, CVEs, IAVAs", cadence: 7, last: "2026-10-10", state: "late", note: "1,284 results across 26 hosts: 2 critical, 9 high, 31 medium, 112 low, 1,130 informational.",
      jobs: [["2026-11-12", "info", "Importing", "ACAS vulnerability scan — mission network", "Started Nov 12 · 02:15 UTC"], ["2026-10-10", "ok", "Completed", "ACAS vulnerability scan — mission network, October", "1,284 results across 26 hosts"]] },
    { id: "stig-mc", name: "DISA STIG checklist — mission computing (RHEL 9)", type: "ckl", kind: ".ckl", reads: "Rule results by CAT", cadence: 90, last: "2026-10-13", state: "ok", note: "412 rules: 371 not a finding, 29 open, 12 not applicable.",
      jobs: [["2026-10-13", "ok", "Completed", "DISA STIG checklist — mission computing (RHEL 9)", "412 rules · 29 open"]] },
    { id: "scap-lt", name: "SCAP compliance scan — maintenance laptop (Windows 11)", type: "scap", kind: "XCCDF", reads: "Rule pass and fail, score", cadence: 30, last: "2026-10-14", state: "late", note: "286 rules: 259 pass, 21 fail, 6 not applicable; score 90.6%.",
      jobs: [["2026-10-14", "ok", "Completed", "SCAP compliance scan — maintenance laptop (Windows 11)", "286 rules · 21 fail · 90.6%"]] },
    { id: "sbom-mc", name: "Mission Computer maintenance image SBOM", type: "sbom", kind: "CycloneDX 1.5", reads: "Components, licenses, package URLs", cadence: 0, last: "2026-11-12", state: "ok", note: "Version 2: 13 components; OpenSSH 9.8p1 fixes CVE-2024-6387.",
      jobs: [["2026-11-12", "ok", "Imported", "Mission Computer maintenance image SBOM, version 2", "13 components · 0 affected"], ["2026-10-08", "ok", "Imported", "Mission Computer maintenance image SBOM", "13 components · 1 affected by CVE-2024-6387"]] },
    { id: "sbom-pic", name: "Software bill of materials — Payload Interface Controller firmware", type: "sbom", kind: "CycloneDX", reads: "Components, licenses, package URLs", cadence: 0, last: null, state: "validating", note: "First import: the file is being validated.",
      jobs: [["2026-11-13", "info", "Validating", "Software bill of materials — Payload Interface Controller firmware", "Started Nov 13 · 02:15 UTC"]] },
    { id: "stig-sw", name: "DISA STIG checklist — internal Ethernet switch", type: "ckl", kind: ".ckl", reads: "Rule results by CAT", cadence: 90, last: null, state: "queued", note: "First import: queued Nov 13.",
      jobs: [["2026-11-13", "none", "Queued", "DISA STIG checklist — internal Ethernet switch", "Queued Nov 13 · 20:22 UTC"]] },
    { id: "nessus-gw", name: "Nessus scan — maintenance access gateway", type: "nessus", kind: ".nessus", reads: "Hosts, plugins, CVEs, IAVAs", cadence: 7, last: null, state: "cancelled", note: "Cancelled: superseded by the expanded control set assessment's adversarial testing.",
      jobs: [["2026-09-28", "none", "Cancelled", "Nessus scan — maintenance access gateway", "Superseded by adversarial testing"]] },
    { id: "sarif-tel", name: "Container image scan — telemetry services", type: "sarif", kind: "SARIF 2.1.0", reads: "Image findings by rule", cadence: 30, last: null, state: "failed", note: "Rejected: SARIF 2.1.0 validation failed at runs[0].results[17].locations, which has no physicalLocation.",
      jobs: [["2026-10-30", "bad", "Failed", "Container image scan — telemetry services", "Validation failed at runs[0].results[17]"]] },
  ];
  const INFORMED = new Set(SRC.flatMap((s) => INFORMS[s.type])).size;
  const cadenceText = (s) => (s.cadence ? `Every ${s.cadence} days` : "Each release");
  const srcStatus = (s) => ({ ok: pill("ok", "Current"), late: pill("bad", "Past cadence"), validating: pill("info", "Validating"), queued: pill("none", "Queued"), cancelled: pill("none", "Cancelled"), failed: pill("bad", "Import failed") })[s.state];
  const lastCell = (s) => {
    if (!s.last) return none("Never imported");
    const a = ago(s.last), late = s.cadence && a > s.cadence ? a - s.cadence : 0;
    return late ? `<span class="platform-late">${day(s.last)} · ${late}d past cadence</span>` : `<span class="num">${day(s.last)} · ${a}d ago</span>`;
  };
  const srcRows = (list) => list.map((s) => ({ id: s.id, cells: [trunc(s.name, "s"), tag(s.kind), lastCell(s), muted(cadenceText(s)), num(`${INFORMS[s.type].length} controls`), srcStatus(s)] }));
  const srcCols = ["Source", "Kind", "Last imported", "Cadence", "Informs", "Status"];
  function sourcesTop(cur) {
    const within = SRC.filter((s) => s.state === "ok").length;
    return [
      header("Evidence sources", "<span>System <b>SYS-WSX90</b></span><span>Requested by <b>Joel Barrantes</b>, ISSM</span>", `<a class="btn platform-a" href="#integrations">Integrations</a>${btn("Add source", 'data-modal="plat-add-source" data-id="nessus"', true)}`),
      pair(
        completion({ title: "Sources within their cadence", total: SRC.length, done: within, unit: "sources current", note: "last import against cadence", minis: [["Imported once or more", 4, 8], ["Waiting on a first import", 2, 8], ["Controls informed", INFORMED, 560]] }),
        attention([["diamond", "Import failed", 1], ["diamond", "Past cadence", 2], ["clock", "Import running", 2], ["ring", "Queued", 1], ["ring", "Cancelled", 1, true]]),
      ),
      tabs([["sources", "Connected", 7], ["sources-errors", "Errors", 1]], cur),
    ];
  }
  S.sources = () => page(...sourcesTop("sources"),
    tools("Search sources", ["Kind", "Status", "Cadence"]),
    table(srcCols, srcRows(SRC.filter((s) => s.state !== "failed")), 7, "plat-source"),
    `<p class="note-p">Imports, dates and what each file read are WS-X90's, from Scanner ingestion. Cadences and the controls each kind informs are proposed; the statuses beside those controls are WS-X90's.</p>`);
  S["sources-errors"] = () => page(...sourcesTop("sources-errors"),
    `<div class="next">${gl("diamond")}<span><b>Container image scan — telemetry services</b> was rejected on Oct 30: SARIF 2.1.0 validation failed at runs[0].results[17].locations.</span>${sm("Retry import", 'data-modal="plat-retry" data-id="sarif-tel"')}</div>`,
    table(srcCols, srcRows(SRC.filter((s) => s.state === "failed")), 1, "plat-source"));
  P["plat-source"] = (id) => {
    const s = SRC.find((x) => x.id === id) || SRC[0];
    const codes = INFORMS[s.type];
    return { label: "Evidence source preview", body: `
      ${head4(s.name, s.state === "failed" ? sm("Retry import", `data-modal="plat-retry" data-id="${s.id}"`, true) : sm("Import file", `data-modal="plat-add-source" data-id="${s.type === "sarif" ? "nessus" : s.type}"`, true))}
      ${kv([["Status", srcStatus(s)], ["Kind", tag(s.kind)], ["Reads", esc(s.reads)], ["Cadence", esc(cadenceText(s))], ["Last imported", lastCell(s)], ["System", tag("SYS-WSX90")], ["Requested by", s.id === "sbom-mc" ? muted("Imported as SBOM records") : who("Joel Barrantes")]])}
      ${s.state === "failed" ? `<div class="next">${gl("diamond")}<span class="platform-wrap">${esc(s.note)}</span></div>` : `<p class="note-p">${esc(s.note)}</p>`}
      ${sect("Imports", s.jobs.length, s.jobs.map(([d, k, st, t, n]) => sbRow(`${esc(day(d))} · ${esc(n)}`, pill(k, st))).join(""))}
      ${sect("Informs", `${codes.length} controls · ${satOf(codes)} satisfied`, ctlRows(codes))}
      <p class="note-p">The control list is a proposed mapping for ${esc(s.kind)} files; each status is WS-X90's today.</p>` };
  };

  // The Add source wizard: six steps, Next and Back change the step.
  const TYPES = {
    nessus: { label: ".nessus", what: "ACAS or Tenable.sc scan results", tool: "Scanner ingestion · in the app" },
    ckl: { label: ".ckl / .cklb", what: "STIG Viewer checklists", tool: "Scanner ingestion · in the app" },
    scap: { label: "SCAP results", what: "XCCDF or ARF from SCC", tool: "Scanner ingestion · in the app" },
    sbom: { label: "CycloneDX / SPDX", what: "Software bill of materials", tool: "SBOM import · in the app" },
    emass: { label: "eMASS export", what: "Controls, test results, POA&M", tool: "Example · not in the app" },
  };
  const STEPS = ["Source type", "System", "Match hosts", "Scope", "Severity threshold", "Review"];
  const CHIPS = ["Type", "System", "Hosts", "Scope", "Threshold", "Review"];
  const SUBS = [["CN-109001", "Mission Computing Subsystem"], ["CN-109002", "Navigation & Timing Subsystem"], ["CN-109003", "Communications Subsystem"], ["CN-109004", "Payload Interface Subsystem"], ["CN-109005", "Platform Management Subsystem"], ["CN-109006", "Ground Support Subsystem"]];
  const SYSTEMS = [["SYS-WSX90", "WS-X90 Sentinel Mission System", "PRG-1090 · 20 system components"], ["X800-A-CUSA", "X800 Missile · Lug & Rail Launch · Customer A", "PRG-2101"], ["X800-C-CUSB", "X800 Missile · Palletized Launch · Customer B", "PRG-2102"], ["G25-VEH-CUSC", "G25 Launch Control Station · Vehicle-Mounted · Customer C", "PRG-2201"]];
  const THR = {
    nessus: [["critical", "Critical", 2], ["high", "High and above", 11], ["medium", "Medium and above", 42], ["low", "Low and above", 154], ["info", "Everything, informational too", 1284]],
    ckl: [["cat1", "CAT I only", null], ["cat2", "CAT II and above", null], ["cat3", "All open rules", 29]],
    scap: [["high", "High only", null], ["medium", "Medium and above", null], ["low", "All failed rules", 21]],
    sbom: [["critical", "Critical", 0], ["high", "High and above", 1], ["medium", "Medium and above", 1], ["low", "Every known CVE", 1]],
    emass: [["all", "Import as it stands", null]],
  };
  const W = { step: 1, type: "nessus", sys: "SYS-WSX90", scope: new Set(SUBS.map((s) => s[0])), outside: "skip", thr: "medium" };
  const defThr = { nessus: "medium", ckl: "cat2", scap: "medium", sbom: "high", emass: "all" };
  function wizSteps() {
    return `<div class="wiz platform-wiz" aria-label="Steps">${STEPS.map((l, i) => {
      const n = i + 1, on = n === W.step, past = n < W.step;
      const inner = `<i>${past ? "✓" : n}</i>${esc(CHIPS[i])}`;
      return `<span class="${on ? "on" : past ? "done" : ""}"${on ? ' aria-current="step"' : ""}>${past ? `<button type="button" data-plat-wiz="go" data-val="${n}">${inner}</button>` : inner}</span>`;
    }).join("")}</div>`;
  }
  function wizMatch() {
    const t = W.type;
    if (t === "sbom") return `${field("Component the file describes", `<div class="platform-list">${pickRow("w-sbom", "mc", true, "<b>mission-computer-image 1.0.0</b> → Mission Computer, version 1", "X800 Missile component set · LRU-001")}</div>`)}
      <p class="platform-stepnote">An SBOM belongs to a component version, not a host: every system built from that version reads it.</p>`;
    if (t === "emass") return `${EX}<div class="frame"><div class="tablebox"><table><thead><tr><th>In the export</th><th>Becomes</th></tr></thead><tbody><tr><td class="nm">eMASS system 4471 · WS-X90</td><td>${tag("SYS-WSX90")}</td></tr><tr><td class="nm">Control rows</td><td>WS-X90 baseline controls by code</td></tr><tr><td class="nm">POA&amp;M rows</td><td>POA&amp;M items by eMASS id</td></tr></tbody></table></div></div>`;
    const rows = t === "nessus" ? [["10.90.1.11", "wsx90-mc-a", "LRU-001 Mission Computer", "Name"], ["10.90.1.12", "wsx90-sbc", "LRU-002 Secure Boot Controller", "Name"], ["10.90.1.13", "wsx90-csm", "LRU-003 Cryptographic Services Module", "MAC"], ["10.90.2.21", "wsx90-gw", "LRU-007 Protected Network Gateway", "Name"], ["10.90.2.29", "wsx90-sw", "LRU-009 Internal Ethernet Switch", "MAC"], ["10.90.4.14", "wsx90-mag", "LRU-014 Maintenance Access Gateway", "Name"], ["10.90.9.40", "lab-jump-02", null, ""], ["10.90.9.41", "lab-print-01", null, ""]]
      : t === "ckl" ? [["10.90.1.11", "wsx90-mc-rhel9", "LRU-001 Mission Computer", "Host name"]] : [["10.90.4.19", "WSX90-MAINT-LT01", "LRU-019 Maintenance Laptop", "Host name"]];
    return `<div class="platform-inline">${EX}<span class="platform-stepnote">${t === "nessus" ? "26 hosts read: 20 matched to elements, 6 with no element. 8 shown." : "The checklist names one host."}</span></div>
      <div class="frame"><div class="tablebox"><table><thead><tr><th>Host</th><th>Name</th><th>Element</th></tr></thead><tbody>${rows.map(([ip, n, el, by]) => `<tr><td class="nm num">${ip}</td><td>${esc(n)}</td><td>${el ? `${tag(el.split(" ")[0])} <span class="platform-trunc xs platform-muted">${esc(el.split(" ").slice(1).join(" "))}</span>` : `<span class="who">${gl("ring")}<span class="platform-late">No element</span></span>`}</td></tr>`).join("")}</tbody></table></div></div>`;
  }
  function wizScope() {
    return `${field("Elements in scope", `<div class="platform-list">${SUBS.map(([c, n]) => pickRow("w-scope", c, W.scope.has(c), `<b>${c}</b> ${esc(n)}`, "", false)).join("")}</div>`, `${W.scope.size} of 6 subsystems of SYS-WSX90. Results on elements outside them are skipped.`)}
      ${field("Hosts with no element", `<div class="platform-list">${pickRow("w-outside", "skip", W.outside === "skip", "Skip them and say so in the review", "")}${pickRow("w-outside", "candidate", W.outside === "candidate", "Add them to Inventory as candidates", "")}</div>`)}`;
  }
  function wizThr() {
    const list = THR[W.type];
    if (W.type === "emass") return `${EX}<p class="platform-stepnote">An eMASS export carries test results and POA&amp;M items, not severities: it imports as it stands.</p>`;
    const unit = W.type === "nessus" ? "results" : W.type === "sbom" ? "CVEs" : W.type === "ckl" ? "open rules" : "failed rules";
    return `${field("Create findings for", `<div class="platform-list">${list.map(([k, l, n]) => pickRow("w-thr", k, W.thr === k, esc(l), n == null ? "" : `${fmt(n)} ${unit}`)).join("")}</div>`, "Everything below the threshold is kept as evidence of scanning, not opened as a finding.")}
      <p class="note-p">${W.type === "nessus" ? "Counts are the October ACAS scan's, as Scanner ingestion recorded them." : W.type === "sbom" ? "Counts are the Mission Computer SBOM of Oct 8: openssh-server 9.6p1 is affected by CVE-2024-6387 (high, 8.1)." : W.type === "ckl" ? "The RHEL 9 checklist of Oct 13 holds 29 open rules; its split by CAT is read from the file." : "The maintenance laptop scan of Oct 14 failed 21 rules; their severities are read from the file."}</p>`;
  }
  function wizReview() {
    const t = W.type, codes = INFORMS[t];
    const sys = SYSTEMS.find((s) => s[0] === W.sys);
    const informs = sect("Informs", `${codes.length} controls`, `<div class="platform-chips">${codes.map(tag).join("")}</div>`);
    const tiles = (list) => `<div class="platform-sum">${list.map(([l, n]) => `<div>${esc(l)}<b class="num">${typeof n === "number" ? fmt(n) : esc(n)}</b></div>`).join("")}</div>`;
    const skipped = (rows) => sect("Skipped, and why", null, rows.map(([l, n]) => sbRow(esc(l), `<b class="num">${typeof n === "number" ? fmt(n) : esc(n)}</b>`)).join(""));
    const scopeRow = W.scope.size < 6 ? [[`Results on the ${6 - W.scope.size} subsystems left out of scope`, "Counted on import"]] : [];
    let body = "";
    if (t === "nessus") {
      const at = THR.nessus.find((x) => x[0] === W.thr)[2];
      body = tiles([["Results read", 1284], ["Hosts read", 26], ["Become findings", at], ["Kept as evidence", 1284 - at]])
        + skipped([["Below the threshold", 1284 - at], [`Hosts with no element (${W.outside === "skip" ? "skipped" : "added as candidates"})`, "6 · Example"], ...scopeRow])
        + `<p class="note-p">Findings already open for the same plugin on the same element are updated, not opened twice. WS-X90 holds 44 open operational issues today.</p>`;
    } else if (t === "ckl") {
      body = tiles([["Rules read", 412], ["Not a finding", 371], ["Not applicable", 12], ["Open", 29]])
        + skipped([["Not a finding or not applicable", 383], ["Open rules below the threshold", "Counted on import"], ...scopeRow]);
    } else if (t === "scap") {
      body = tiles([["Rules read", 286], ["Pass", 259], ["Fail", 21], ["Score", "90.6%"]])
        + skipped([["Passed or not applicable", 265], ["Failed rules below the threshold", "Counted on import"], ...scopeRow]);
    } else if (t === "sbom") {
      body = tiles([["Components read", 13], ["Matched to a CVE", 1], ["Programs built from it", 3], ["Issues to open", 2]])
        + sect("What it opens", null, sbRow("CVE-2024-6387 · openssh-server 9.6p1 · affected", sevPill("high")) + sbRow("Customer A · X800 Rail Integration", muted("1 operational issue")) + sbRow("Customer B · X800 Palletized Integration", muted("1 operational issue")) + sbRow("WS-X90 Sentinel Mission System", muted("keeps its own")))
        + skipped([["Components with no known CVE", 12], ["The image itself (no package URL)", 1]]);
    } else {
      body = `${EX}` + tiles([["Control rows", "—"], ["POA&M rows", "—"], ["Test results", "—"]]) + skipped([["Rows for controls outside the baseline", "Counted on import"]]);
    }
    return `<p class="platform-stepnote">${esc(TYPES[t].what)} into <b>${esc(sys[0])}</b> ${esc(sys[1])}.</p>${body}${informs}`;
  }
  function wizBody() {
    const views = [
      () => `<p class="platform-stepnote">Scans on closed networks arrive as files. Each import says what it read, what it skipped and why.</p><div class="platform-choices">${Object.entries(TYPES).map(([k, t]) => `<button type="button" class="platform-choice" data-plat-wiz="type" data-val="${k}" aria-pressed="${W.type === k}"><b>${esc(t.label)}</b><span>${esc(t.what)}</span><small>${esc(t.tool)}</small></button>`).join("")}</div>`,
      () => field("System", `<div class="platform-list">${SYSTEMS.map(([c, n, m]) => `<button type="button" class="platform-choice" data-plat-wiz="sys" data-val="${c}" aria-pressed="${W.sys === c}"><span class="platform-box platform-radio" aria-hidden="true"></span><span><b>${c}</b> ${esc(n)}</span><small>${esc(m)}</small></button>`).join("")}</div>`, "The authorization boundary the results belong to."),
      wizMatch, wizScope, wizThr, wizReview,
    ];
    return `${wizSteps()}<h5 id="platWizH" tabindex="-1" style="margin:0;font-size:16px;font-weight:600">${W.step}. ${esc(STEPS[W.step - 1])}</h5>${views[W.step - 1]()}`;
  }
  const wizFoot = () => `${W.step > 1 ? '<button type="button" class="btn" data-plat-wiz="back">Back</button>' : cancel}<button type="button" class="btn ink" ${W.step < 6 ? 'data-plat-wiz="next">Next' : "data-close-modal>Import"}</button>`;
  M["plat-add-source"] = (id) => {
    W.step = 1; W.type = TYPES[id] ? id : "nessus"; W.thr = defThr[W.type]; W.sys = "SYS-WSX90"; W.scope = new Set(SUBS.map((s) => s[0])); W.outside = "skip";
    return { title: "Add source", body: wizBody(), footer: wizFoot() };
  };
  const modalEl = document.getElementById("modal");
  modalEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-plat-wiz]");
    if (b) {
      const a = b.dataset.platWiz, v = b.dataset.val;
      if (a === "next" && W.step < 6) W.step++;
      else if (a === "back" && W.step > 1) W.step--;
      else if (a === "go") W.step = +v;
      else if (a === "type") { W.type = v; W.thr = defThr[v]; }
      else if (a === "sys") W.sys = v;
      modalEl.querySelector(".dlg-b").innerHTML = wizBody();
      modalEl.querySelector(".dlg-f").innerHTML = wizFoot();
      const again = a === "type" || a === "sys" ? modalEl.querySelector(`[data-plat-wiz="${a}"][data-val="${CSS.escape(v)}"]`) : modalEl.querySelector("#platWizH");
      if (again) again.focus();
      return;
    }
    const p = e.target.closest("[data-plat-pick]");
    if (p && p.closest("#platWizH, .dlg")) {
      const g = p.dataset.platPick;
      if (g === "w-scope") { W.scope.has(p.dataset.val) ? W.scope.delete(p.dataset.val) : W.scope.add(p.dataset.val); }
      if (g === "w-outside") W.outside = p.dataset.val;
      if (g === "w-thr") W.thr = p.dataset.val;
    }
  });
  // Choices anywhere: radio groups pick one, other groups toggle.
  document.addEventListener("click", (e) => {
    const p = e.target.closest("[data-plat-pick]");
    if (p) {
      const g = p.dataset.platPick, root = p.closest(".dlg, .pbody, .main") || document;
      if (p.hasAttribute("data-radio")) root.querySelectorAll(`[data-plat-pick="${CSS.escape(g)}"]`).forEach((x) => x.setAttribute("aria-pressed", String(x === p)));
      else p.setAttribute("aria-pressed", String(p.getAttribute("aria-pressed") !== "true"));
      if (g === "w-scope") { const hint = p.closest(".platform-field").querySelector(".hint"); if (hint) hint.textContent = `${W.scope.size} of 6 subsystems of SYS-WSX90. Results on elements outside them are skipped.`; }
      return;
    }
    const t = e.target.closest("[data-plat-tog]");
    if (t && t.getAttribute("aria-disabled") !== "true") {
      const on = t.getAttribute("aria-pressed") !== "true";
      t.setAttribute("aria-pressed", String(on));
      t.innerHTML = `${gl(on ? "check" : "ring")}${on ? "On" : "Off"}`;
    }
  });
  M["plat-retry"] = () => ({ title: "Retry import", body: `
      ${kv([["Source", "Container image scan — telemetry services"], ["File", tag("SARIF 2.1.0")], ["Failed", "Oct 30 · 03:40 UTC"]])}
      <div class="next">${gl("diamond")}<span class="platform-wrap">runs[0].results[17].locations has no physicalLocation.</span></div>
      ${field("Retry with", `<div class="platform-list">${pickRow("retry", "fixed", true, "A corrected file", "Upload a new SARIF file")}${pickRow("retry", "lenient", false, "This file, skipping results with no location", "Says how many it skipped")}</div>`)}`,
    footer: done("Retry import") });

  // ——— Integrations ———
  const INT = [
    { id: "emass", logo: "eM", name: "eMASS", real: false, mode: "File and online", reads: "System registration, controls, test results, POA&M", feeds: "Control status, POA&M, artifacts back to eMASS", caps: ["Import package export", "POA&M sync", "Registration read"], use: "Not connected" },
    { id: "acas", logo: "AC", name: "ACAS / Tenable.sc", real: true, mode: "File · online is Example", reads: ".nessus: hosts, plugins, CVEs, IAVAs", feeds: "Operational issues, inventory hosts, RA-5 and SI-2 evidence", caps: ["Host matching", "Severity threshold", "IAVA due dates"], use: "WS-X90: 3 imports since Sep 28" },
    { id: "stig", logo: "SV", name: "STIG Viewer checklists", real: true, mode: "File", reads: ".ckl and .cklb: rule results by CAT", feeds: "Open rules as findings, CM-6 and CM-7 evidence", caps: ["CAT I/II/III deadlines", "Host matching"], use: "WS-X90: 2 checklists" },
    { id: "scap", logo: "SC", name: "SCAP Compliance Checker", real: true, mode: "File", reads: "XCCDF and ARF results, score", feeds: "Failed rules as findings, configuration evidence", caps: ["Score trend", "Host matching"], use: "WS-X90: 1 import" },
    { id: "sbom", logo: "SB", name: "SBOM feeds", real: true, mode: "File · feed is Example", reads: "CycloneDX (SPDX is Example): components, licenses, package URLs", feeds: "Vulnerabilities in VEX states, one issue a consuming program", caps: ["CVE matching", "Opens issues downstream"], use: "Mission Computer: 2 SBOMs, 13 components each" },
    { id: "sarif", logo: "SA", name: "Static analysis (SARIF)", real: true, mode: "File", reads: "SARIF 2.1.0 results by rule", feeds: "Findings, SA-11 evidence", caps: ["Schema validation", "Rejects with the failing path"], use: "WS-X90: 1 import, failed" },
    { id: "doors", logo: "RQ", name: "IBM DOORS (ReqIF)", real: true, mode: "File · DOORS Next is Example", reads: "ReqIF objects by their long names; CSV and Excel too", feeds: "Requirements, allocations by element code", caps: ["Reads before it sends", "Stops whole on an unknown code"], use: "3 customer requirements documents" },
    { id: "oscal", logo: "OS", name: "NIST OSCAL content", real: true, mode: "File", reads: "SP 800-53 Rev 5 catalog, baselines and profiles", feeds: "The reference catalog and control baselines", caps: ["Pinned sources", "Provenance kept"], use: "SP 800-53 Rev 5 · High baseline" },
    { id: "jira", logo: "JI", name: "Jira", real: false, mode: "Online", reads: "Issues and their status", feeds: "Tasks and POA&M milestones, both ways", caps: ["Two-way status", "Link by key"], use: "Not connected" },
    { id: "snow", logo: "SN", name: "ServiceNow", real: false, mode: "Online", reads: "Incidents and change requests", feeds: "IR-4 and CM-3 evidence, operational issues", caps: ["Change records as evidence", "Incident sync"], use: "Not connected" },
    { id: "splunk", logo: "SP", name: "Splunk", real: false, mode: "Online · on-premises", reads: "Saved searches over audit logs", feeds: "AU-6 and SI-4 evidence on a schedule", caps: ["Scheduled evidence", "Search results as files"], use: "Not connected" },
  ];
  S.integrations = () => page(
    header("Integrations", "<span>Connectors for a DoD program: files from closed networks first, online where the enclave allows</span>", btn("Request a connector", 'data-modal="plat-request"', true)),
    pair(
      completion({ title: "Connectors in the app", total: INT.length, done: INT.filter((i) => i.real).length, unit: "read files today", note: "the rest are Example", minis: [["File imports", 8, 11], ["Online", 5, 11], ["In use for WS-X90", 5, 11]] }),
      attention([["diamond", "Import failed", 1], ["diamond", "Sources past cadence", 2], ["clock", "Imports running", 2], ["ring", "Online connectors not set up", 5, true]]),
    ),
    h.views([["All", 11], ["In the app", 7], ["File", 8], ["Online", 5]]),
    `<div class="grid3">${INT.map((i) => `<div class="platform-card" tabindex="0" role="button" data-panel="plat-int" data-id="${i.id}" aria-label="${esc(i.name)}">
      <div class="top2"><span class="platform-logo" aria-hidden="true">${i.logo}</span><b>${esc(i.name)}</b><span class="sp">${i.real ? REAL : EX}</span></div>
      <dl><dt>Reads</dt><dd>${esc(i.reads)}</dd><dt>Feeds</dt><dd>${esc(i.feeds)}</dd><dt>Mode</dt><dd>${esc(i.mode)}</dd></dl>
      <div class="platform-chips">${i.caps.map(tag).join("")}</div>
      <p>${esc(i.use)}</p></div>`).join("")}</div>`,
    `<p class="note-p">In the app: ReqIF requirements import, SBOM import and Scanner ingestion (.nessus, .ckl, XCCDF, SARIF, CycloneDX). Every online connection, and eMASS, Jira, ServiceNow and Splunk, is Example.</p>`,
  );
  P["plat-int"] = (id) => {
    const i = INT.find((x) => x.id === id) || INT[0];
    const wiz = { acas: "nessus", stig: "ckl", scap: "scap", sbom: "sbom" }[i.id];
    const action = wiz ? sm("Import file", `data-modal="plat-add-source" data-id="${wiz}"`, true) : i.id === "doors" ? sm("Import requirements", 'data-modal="plat-reqif"', true) : i.real ? "" : sm("Connect", `data-modal="plat-connect" data-id="${i.id}"`, true);
    const used = { acas: SRC.filter((s) => s.type === "nessus"), stig: SRC.filter((s) => s.type === "ckl"), scap: SRC.filter((s) => s.type === "scap"), sbom: SRC.filter((s) => s.type === "sbom"), sarif: SRC.filter((s) => s.type === "sarif") }[i.id];
    return { label: "Integration preview", body: `
      ${head4(i.name, action)}
      ${kv([["In the app", i.real ? REAL : EX], ["Mode", esc(i.mode)], ["Reads", esc(i.reads)], ["Feeds", esc(i.feeds)], ["Offline", i.mode.startsWith("File") ? pill("ok", "Works from a file") : pill("none", "Needs a connection")]])}
      ${sect("Capabilities", i.caps.length, i.caps.map((c) => sbRow(esc(c), gl("check"))).join(""))}
      ${used ? sect("WS-X90 sources", used.length, used.map((s) => sbRow(trunc(s.name, "s"), srcStatus(s))).join("")) : sect("In use", null, esc(i.use))}
      ${i.id === "doors" ? sect("Requirements documents", 3, sbRow("CUSA-SSRD · Customer A System Security Requirements Document", muted("PRG-2101")) + sbRow("CUSB-SRS · Customer B Security Requirements Specification", muted("PRG-2102")) + sbRow("CUSC-SSS · Customer C System Security Specification", muted("PRG-2201"))) : ""}
      ${i.id === "sbom" ? sect("Open CVEs found", 1, sbRow("CVE-2024-6387 · Mission Computer version 1", sevPill("high"))) : ""}` };
  };
  M["plat-connect"] = (id) => {
    const i = INT.find((x) => x.id === id) || INT[0];
    return { title: `Connect ${i.name}`, body: `${EX}
      ${field("Address", `<input class="platform-input" value="${i.id === "emass" ? "https://emass.example.mil/api" : "https://" + i.id + ".wsx90.example.mil"}" aria-label="Address">`, "Reachable from the CUI workspace's network only.")}
      ${field("Authenticate with", `<div class="platform-list">${pickRow("auth", "pki", true, "DoD PKI certificate", "Recommended")}${pickRow("auth", "key", false, "API key", "Stored in the workspace vault")}</div>`)}
      ${field("Sync", `<div class="platform-list">${pickRow("sync", "d", true, "Daily at 02:00", "")}${pickRow("sync", "w", false, "Weekly", "")}${pickRow("sync", "m", false, "Only when asked", "")}</div>`)}`,
      footer: done("Connect") };
  };
  M["plat-reqif"] = () => ({ title: "Import requirements", body: `
      ${field("File", `<div class="next">${gl("info")}<span>Choose a ReqIF, CSV or Excel file, or paste rows</span>${sm("Choose file")}</div>`, "Read before it is sent: it says how many requirements and which columns it read.")}
      ${field("Into", `<div class="platform-list">${pickRow("doc", "new", true, "A new requirements document", "")}${pickRow("doc", "cusa", false, "CUSA-SSRD · Customer A System Security Requirements Document", "PRG-2101")}</div>`)}
      <p class="note-p">An Elements column allocates each requirement by element code; a code the program does not hold stops the import whole.</p>`, footer: done("Import requirements") });
  M["plat-request"] = () => ({ title: "Request a connector", body: `
      ${field("Tool", '<input class="platform-input" placeholder="For example Xacta, Nessus Manager, GitLab" aria-label="Tool">')}
      ${field("What it should read", '<textarea class="platform-input" aria-label="What it should read"></textarea>')}
      ${field("Network", `<div class="platform-list">${pickRow("net", "file", true, "Files from a closed network", "")}${pickRow("net", "online", false, "Online inside the enclave", "")}</div>`)}`, footer: done("Send request") });

  // ——— Data calls ———
  const DC = [
    { id: "fisma", name: "FY2027 FISMA annual data call", from: "DoD CIO via the PEO", due: "2026-12-11", q: 48, drafted: 41, conflicts: 2, review: ["warn", "In review"], owner: "Joel Barrantes" },
    { id: "ready", name: "Cyber readiness data call — Q1 FY2027", from: "Component cyber command", due: "2026-11-24", q: 22, drafted: 22, conflicts: 1, review: ["warn", "In review"], owner: "Priya Raghavan" },
    { id: "scrm", name: "SCRM data call — microelectronics provenance", from: "PEO supply chain office", due: "2026-11-20", q: 15, drafted: 9, conflicts: 3, review: ["bad", "Needs answers"], owner: "Ray Colston" },
    { id: "cusa", name: "Customer A security questionnaire — rail integration", from: "Customer A", due: "2026-12-04", q: 64, drafted: 38, conflicts: 0, review: ["none", "Drafting"], owner: null },
    { id: "fy26", name: "FY2026 FISMA annual data call", from: "DoD CIO via the PEO", due: "2025-12-12", q: 46, drafted: 46, conflicts: 0, review: ["ok", "Sent"], owner: "Joel Barrantes" },
  ];
  const QA = [
    ["Does the system hold a current authorization to operate?", "Yes: authorized with conditions by R. Calloway on Sep 18, 2026; it expires Sep 17, 2029.", "Authorization decision · package version 1", "ok", "Matches"],
    ["Are credentialed vulnerability scans run at least weekly?", "ACAS scans the mission network; the last completed scan is Oct 10, 2026 (1,284 results, 26 hosts).", "Scanner ingestion · SSP 3 RA-5", "bad", "Conflict"],
    ["How many POA&M items are open?", "41 items: 7 completed, 33 in progress, 1 not started.", "POA&M · WS-X90", "ok", "Matches"],
    ["Is multifactor authentication enforced for privileged accounts?", "Yes: tested on LRU-013 and LRU-014, build 4.2.1, and accepted Nov 12.", "Evidence · privileged two-factor enforcement test report", "warn", "Needs review"],
    ["Do you keep a software bill of materials for mission software?", "Yes for the Mission Computer image (CycloneDX 1.5, 13 components, Nov 12); the Payload Interface Controller firmware SBOM is being validated.", "SBOMs · Mission Computer", "ok", "Matches"],
    ["When was incident response capability last tested?", "Annual incident response capability test report, injected detection and account-abuse cases.", "Package version 1 · document", "warn", "Needs a date"],
  ];
  S["data-calls"] = () => page(
    header("Data calls", "<span>FISMA and readiness data calls and customer questionnaires, answered from what the program already holds</span>", `${btn("Knowledge base", 'data-panel="plat-kb" data-id="kb"')}${btn("Import data call", 'data-modal="plat-dc-new"', true)}`),
    pair(
      completion({ title: "Answers drafted", total: 149, done: 110, unit: "questions drafted", note: "Example · 4 open data calls", minis: [["Matching a source", 104, 149], ["Reviewed", 61, 149], ["Sent", 0, 149]] }),
      attention([["diamond", "Due within a week", 2], ["diamond", "Conflicts with a source", 6], ["clock", "Waiting on review", 2], ["ring", "No owner", 1]]),
    ),
    h.views([["Open", 4], ["Due this month", 2], ["Conflicts", 3], ["Sent", 1], ["All", 5]]),
    tools("Search data calls", ["From", "Review", "Owner", "Due"]),
    table(["Data call", "Due", "Drafted", "Conflicts", "Review", "Owner"], DC.map((d) => {
      const a = ago(d.due), due = d.review[1] === "Sent" ? muted(day(d.due)) : -a <= 7 ? `<span class="platform-late">${day(d.due)} · in ${-a}d</span>` : `<span class="num">${day(d.due)}</span>`;
      return { id: d.id, cells: [`${trunc(d.name, "s")} ${EX}`, due, `<span class="num">${d.drafted} of ${d.q}</span>`, d.conflicts ? `<span class="platform-late num">${d.conflicts}</span>` : muted("0"), pill(...d.review), who(d.owner)] };
    }), 5, "plat-dc"),
    `<p class="note-p">The data calls are Example. Their drafted answers quote WS-X90's real records: its authorization decision, ACAS imports, POA&amp;M, evidence and SBOMs.</p>`,
  );
  P["plat-dc"] = (id) => {
    const d = DC.find((x) => x.id === id) || DC[0];
    return { label: "Data call preview", body: `
      ${head4(d.name, sm("Review answers", `data-modal="plat-dc-review" data-id="${d.id}"`, true))}
      ${kv([["From", `${esc(d.from)} ${EX}`], ["Due", esc(day(d.due))], ["Review", pill(...d.review)], ["Owner", who(d.owner)], ["Coverage", `<span class="num">${d.drafted} of ${d.q} drafted · ${pct(d.drafted, d.q)}%</span>`]])}
      ${bar(pct(d.drafted, d.q))}
      ${sect("Drafted answers", QA.length, QA.map(([q, a, src, k, s]) => `<div style="display:grid;gap:4px;padding:6px 0;border-bottom:1px dashed var(--line)"><div class="platform-sb-row"><b style="color:var(--ink);font-weight:500;white-space:normal">${esc(q)}</b>${pill(k, s)}</div><span>${esc(a)}</span><span class="note-p">From ${esc(src)}</span></div>`).join(""))}` };
  };
  P["plat-kb"] = () => ({ label: "Knowledge base", body: `
      ${head4("What answers are drafted from", "")}
      ${sect("System security plan", 2, sbRow("SSP 3", pill("warn", "Draft")) + sbRow("SSP 2", `${pill("ok", "Published")} <span class="num">Jul 25</span>`))}
      ${sect("Policies", 2, sbRow(trunc("IA policy and IA procedure set, revision 2.4", "s"), pill("ok", "Accepted")) + sbRow(trunc("WS-X90 contingency planning policy and recovery procedure set, revision 3.1", "s"), muted("In package 1")))}
      ${sect("Evidence", 368, sbRow("Accepted by the assessor", num(226)) + sbRow("Pending review", num(88)) + sbRow("Sent back", num(54)))}
      ${sect("Records", null, sbRow("Authorization decision · Sep 18", pill("ok", "With conditions")) + sbRow("POA&amp;M items", num(41)) + sbRow("SBOMs", num(2)))}
      <p class="note-p">Answers never cite a draft as fact: a draft source marks the answer for review.</p>` });
  M["plat-dc-new"] = () => ({ title: "Import data call", body: `
      ${field("File", `<div class="next">${gl("info")}<span>Excel, CSV or a questionnaire PDF</span>${sm("Choose file")}</div>`)}
      ${field("Kind", `<div class="platform-list">${pickRow("dk", "fisma", true, "FISMA or readiness data call", "")}${pickRow("dk", "cust", false, "Customer questionnaire", "")}${pickRow("dk", "scrm", false, "Supply chain data call", "")}</div>`)}
      ${field("Draft answers from", `<div class="platform-list">${pickRow("kb", "ssp", true, "System security plan", "SSP 2 published", false)}${pickRow("kb", "pol", true, "Policies", "2 accepted", false)}${pickRow("kb", "ev", true, "Accepted evidence", "226 artifacts", false)}${pickRow("kb", "drafts", false, "Draft records", "Marked for review", false)}</div>`)}
      ${field("Due", '<input class="platform-input" type="text" value="Dec 11, 2026" aria-label="Due">')}`, footer: done("Import and draft") });
  M["plat-dc-review"] = (id) => {
    const d = DC.find((x) => x.id === id) || DC[0];
    return { title: "Review answers", body: `<p class="platform-stepnote">${esc(d.name)} ${EX}</p>${QA.slice(0, 4).map(([q, a, src, k, s]) => `<div class="sect"><div class="sh"><span style="color:var(--ink);font-weight:600;margin:0">${esc(q)}</span>${pill(k, s)}</div><div class="sb"><textarea class="platform-input" aria-label="Answer">${esc(a)}</textarea><span class="note-p">From ${esc(src)}</span></div></div>`).join("")}`, footer: done("Mark reviewed") };
  };

  // ——— Reports and exports ———
  const REP = [
    { id: "ssp", name: "System security plan", fmt: "OSCAL JSON", source: "SSP 2 · published Jul 25", last: "2026-11-03", sched: "On publish", ex: true },
    { id: "sar", name: "Security assessment report", fmt: "OSCAL JSON", source: "Expanded Control Set results · 225 findings", last: "2026-11-12", sched: "When results are published", ex: true },
    { id: "poam", name: "Plan of action and milestones", fmt: "OSCAL JSON", source: "41 items · 7 completed", last: "2026-11-01", sched: "Monthly · 1st", ex: true },
    { id: "emass", name: "eMASS import package", fmt: "eMASS XLSX", source: "560 controls · 41 POA&M items", last: "2026-10-01", sched: "Quarterly", ex: true },
    { id: "sctm", name: "Security controls traceability matrix", fmt: "XLSX", source: "560 controls · 640 requirements", last: "2026-11-16", sched: "Weekly · Monday", ex: true },
    { id: "risk", name: "Risk snapshot", fmt: "PDF, locked", source: "40 open risks", last: null, sched: "On package publish", ex: true },
    { id: "trend", name: "Control status trend", fmt: "CSV", source: "Daily snapshot since Nov 13 · 5 days", last: "2026-11-17", lastT: "23:55 UTC", sched: "Daily · 23:55 UTC", ex: false },
    { id: "pkg", name: "Authorization package", fmt: "ZIP", source: "Package version 1 · Priya Raghavan", last: "2026-09-02", sched: "On publish", ex: false },
  ];
  S.reports = () => page(
    header("Reports & exports", "<span>WS-X90 Sentinel Mission System · CUI banner on every export</span>", btn("Generate", 'data-modal="plat-generate" data-id="ssp"', true)),
    pair(
      completion({ title: "Package ready to export", total: 4, done: 3, unit: "of its parts published", note: "SSP, SAR and POA&M", minis: [["SSP 2 published", 1, 1], ["Results published", 2, 2], ["Risk snapshots", 0, 1]] }),
      attention([["clock", "SSP 3 is still a draft", 1], ["ring", "No risk snapshot taken", 1], ["clock", "Package version 2 is a draft", 1], ["ring", "Exports with no schedule", 0, true]]),
    ),
    tools("Search reports", ["Format", "Schedule"]),
    table(["Report", "Format", "From", "Last run", "Schedule"], REP.map((r) => ({ id: r.id, cells: [`${esc(r.name)}${r.ex ? " " + EX : ""}`, tag(r.fmt), trunc(r.source, "xs"), r.last ? `<span class="num">${day(r.last)}${r.lastT ? " · " + r.lastT : ""}</span>` : none("Not run"), muted(r.sched)] })), 8, "plat-report"),
    `<p class="note-p">Real: the daily control status snapshot (pg_cron, 23:55 UTC) and package version 1. The OSCAL, eMASS, SCTM and risk exports, their runs and schedules, are Example; what each would read from is WS-X90's.</p>`,
  );
  const SNAP = [["Nov 13", 174], ["Nov 14", 174], ["Nov 15", 176], ["Nov 16", 176], ["Nov 17", 176]];
  P["plat-report"] = (id) => {
    const r = REP.find((x) => x.id === id) || REP[0];
    const runs = r.id === "trend" ? SNAP.slice().reverse().map(([d, n]) => sbRow(`${d} · 23:55 UTC · ${n} of 560 satisfied`, pill("ok", "Done"))).join("")
      : r.id === "pkg" ? sbRow("Sep 2 · version 1 published by Priya Raghavan", pill("ok", "Done")) + sbRow("Sep 18 · authorized with conditions by R. Calloway", pill("ok", "Decided"))
      : r.last ? sbRow(`${day(r.last)} · ${r.fmt}`, pill("ok", "Done")) + `<span class="note-p">${EX} run history</span>` : none("Never run");
    return { label: "Report preview", body: `
      ${head4(r.name, sm("Generate", `data-modal="plat-generate" data-id="${r.id}"`, true))}
      ${kv([["Format", tag(r.fmt)], ["From", esc(r.source)], ["Schedule", esc(r.sched)], ["Marking", tag("CUI")], ["In the app", r.ex ? EX : REAL]])}
      ${r.id === "trend" ? sect("Controls satisfied", "560 controls", `<div class="platform-spark" aria-label="174, 174, 176, 176, 176 controls satisfied">${SNAP.map(([, n]) => `<i style="height:${Math.round(((n - 160) / 20) * 100)}%"></i>`).join("")}</div><div class="platform-spark-l">${SNAP.map(([d]) => `<span>${d.slice(4)}</span>`).join("")}</div><span class="note-p">The axis starts at 160.</span>`) : ""}
      ${sect("Runs", null, runs)}` };
  };
  M["plat-generate"] = (id) => {
    const cur = REP.find((x) => x.id === id) || REP[0];
    return { title: "Generate report", body: `
      ${field("Report", `<div class="platform-list">${REP.map((r) => pickRow("rep", r.id, r.id === cur.id, esc(r.name), esc(r.fmt))).join("")}</div>`)}
      ${field("Read from", `<div class="platform-list">${pickRow("rev", "ssp2", true, "SSP 2 · published Jul 25", "")}${pickRow("rev", "ssp3", false, "SSP 3 · draft", "Marked DRAFT on every page")}</div>`)}
      ${field("Then", `<div class="platform-list">${pickRow("when", "once", true, "Generate once now", "")}${pickRow("when", "keep", false, "Keep this schedule: " + esc(cur.sched), "")}</div>`)}
      <div class="next">${gl("info")}<span>Exports carry the CUI banner, the designation indicator and Distribution D. Each export is logged in the event log.</span></div>`, footer: done("Generate") };
  };

  // ——— Deadlines (a proposal) ———
  const DL = [
    ["iava", "IAVA", "Vulnerabilities", "ACAS results that carry an IAVA number, from release", 21, "21–30", "ACAS · 3 WS-X90 imports"],
    ["iavb", "IAVB", "Vulnerabilities", "ACAS results that carry an IAVB number, from release", 30, "30–60", "ACAS · 3 WS-X90 imports"],
    ["cat1", "STIG CAT I", "STIG", "Open CAT I rules in STIG checklists, from import", 30, "14–30", "29 open rules · RHEL 9 checklist"],
    ["cat2", "STIG CAT II", "STIG", "Open CAT II rules, from import", 90, "60–90", "29 open rules · RHEL 9 checklist"],
    ["cat3", "STIG CAT III", "STIG", "Open CAT III rules, from import", 180, "90–365", "29 open rules · RHEL 9 checklist"],
    ["crit", "Critical finding", "Findings", "Operational issues, from when opened", 15, "7–15", "2 open"],
    ["high", "High finding", "Findings", "Operational issues, from when opened", 30, "15–30", "12 open"],
    ["mod", "Moderate finding", "Findings", "Operational issues, from when opened", 90, "60–90", "Open moderate issues"],
    ["low", "Low finding", "Findings", "Operational issues, from when opened", 180, "90–365", "Open low issues"],
    ["mile", "POA&M milestone reminder", "POA&M", "Days before a milestone's planned date", 14, "7–30", "41 POA&M items"],
    ["renew", "Evidence renewal", "Evidence", "Accepted evidence, from its review", 365, "180–365", "368 artifacts · none with a date"],
    ["access", "Access review cycle", "Accounts", "AC-2 and AC-2(3), as the identity provider asks", 90, "30–90", "IDP-CAP-ACCOUNTS"],
  ];
  const dlRows = (grp) => DL.filter((d) => !grp || d[2] === grp).map(([id, n, g, ap, days, range, used]) => ({ id, cells: [esc(n), trunc(ap, "s"), `<b class="num">${days} days</b>`, muted(range + " days"), trunc(used, "s")] }));
  const dlTop = (cur) => [
    header("Deadlines", `<span>Workspace setting ${PROP}</span><span>Set by <b>Joel Barrantes</b>, ISSM</span>`, btn("Reset to recommended", 'data-modal="plat-dl-reset"')),
    `<div class="next">${gl("info")}<span>New work: one place sets how long each kind of finding has. Findings already use the four severity windows; the rest are proposed.</span></div>`,
    qviews([["deadlines", "All", 12], ["deadlines-vuln", "Vulnerabilities", 2], ["deadlines-stig", "STIG", 3], ["deadlines-findings", "Findings", 4], ["deadlines-other", "POA&M, evidence, accounts", 3]], cur),
  ];
  const dlCols = ["Category", "Applies to", "Days", "Recommended", "In use by"];
  S.deadlines = () => page(...dlTop("deadlines"), table(dlCols, dlRows(), 12, "plat-deadline"), `<p class="note-p">Recommended ranges follow common DoD practice; an IAVA's own date wins when it is sooner. Counts in "In use by" are WS-X90's.</p>`);
  S["deadlines-vuln"] = () => page(...dlTop("deadlines-vuln"), table(dlCols, dlRows("Vulnerabilities"), 2, "plat-deadline"));
  S["deadlines-stig"] = () => page(...dlTop("deadlines-stig"), table(dlCols, dlRows("STIG"), 3, "plat-deadline"));
  S["deadlines-findings"] = () => page(...dlTop("deadlines-findings"), table(dlCols, dlRows("Findings"), 4, "plat-deadline"));
  S["deadlines-other"] = () => page(...dlTop("deadlines-other"), table(dlCols, DL.filter((d) => ["POA&M", "Evidence", "Accounts"].includes(d[2])).map((d) => dlRows().find((r) => r.id === d[0])), 3, "plat-deadline"));
  P["plat-deadline"] = (id) => {
    const d = DL.find((x) => x[0] === id) || DL[0];
    return { label: "Deadline preview", body: `
      ${head4(d[1], sm("Edit", `data-modal="plat-deadline" data-id="${d[0]}"`, true))}
      ${kv([["Days", `<b class="num">${d[4]}</b>`], ["Recommended", `${esc(d[5])} days`], ["Group", tag(d[2])], ["Applies to", esc(d[3])], ["In use by", esc(d[6])], ["Status", `${pill("info", "Proposed")}`]])}
      ${d[2] === "Findings" ? `<div class="next">${gl("check")}<span>Findings' Remediate by already uses ${d[4]} days.</span></div>` : ""}
      ${d[0] === "access" ? sect("Why 90 days", null, "The Corporate identity provider's account lifecycle offer asks each consumer to complete the quarterly access review.") : ""}` };
  };
  M["plat-deadline"] = (id) => {
    const d = DL.find((x) => x[0] === id) || DL[0];
    return { title: `Edit ${d[1]} deadline`, body: `
      ${field("Days", `<div class="platform-inline"><input class="platform-input num" type="number" min="1" value="${d[4]}" aria-label="Days"><span class="platform-stepnote">Recommended ${esc(d[5])} days</span></div>`)}
      ${field("Count from", `<div class="platform-list">${pickRow("from", "found", true, d[2] === "Vulnerabilities" ? "The day the IAVA was released" : "The day it was found or opened", "")}${pickRow("from", "imported", false, "The day it was imported", "")}</div>`)}
      ${field("Open items", `<div class="platform-list">${pickRow("apply", "new", true, "Apply to new items only", "")}${pickRow("apply", "all", false, "Recompute every open item's due date", "Logged in the event log")}</div>`)}
      <p class="note-p">Applies to: ${esc(d[3])}.</p>`, footer: done("Save deadline") };
  };
  M["plat-dl-reset"] = () => ({ title: "Reset to recommended", body: `<p>Each deadline goes back to the top of its recommended range. Open items keep their due dates.</p>`, footer: done("Reset deadlines") });

  // ——— Notifications ———
  const NT = [
    ["Operational issue past its remediation date", "Owner, ISSO", 1, 1, 0, "Daily digest"],
    ["Critical or high finding opened", "ISSO, ISSM", 1, 1, 0, "Immediately"],
    ["IAVA released that affects an asset", "ISSM", 1, 1, 0, "Immediately"],
    ["Evidence sent back by the assessor", "Evidence owner", 1, 1, 0, "Daily digest"],
    ["Evidence waiting for review", "Assessor", 0, 1, 0, "Daily digest"],
    ["Finding offered on a component you own", "Component owner", 1, 1, 0, "Immediately"],
    ["New CVE in a component the program uses", "ISSO", 1, 1, 0, "Immediately"],
    ["POA&M milestone due within 14 days", "POA&M owner", 1, 1, 0, "Weekly digest"],
    ["Import failed or past its cadence", "Requester, ISSM", 1, 1, 0, "Immediately"],
    ["Assessment results published", "ISSO, ISSM, system owner", 1, 1, 0, "Immediately"],
    ["Authorization decision recorded", "AO, ISSM, system owner", 1, 1, 0, "Immediately"],
    ["Data call due within 7 days", "Owner", 1, 1, 0, "Daily digest"],
    ["Access review due", "ISSO", 1, 0, 0, "Weekly digest"],
  ];
  const ROLE = { ISSO: "Priya Raghavan", ISSM: "Joel Barrantes", "system owner": "Ray Colston", AO: "R. Calloway", Assessor: "Nadia Fournier", "Component owner": "Priya Raghavan" };
  const tog = (on, dis) => `<button type="button" class="platform-tog" data-plat-tog aria-pressed="${!!on}"${dis ? ' aria-disabled="true" title="Chat is for unclassified enclaves only"' : ""}>${gl(on ? "check" : "ring")}${dis ? "Off · CUI" : on ? "On" : "Off"}</button>`;
  S.notifications = () => page(
    header("Notifications", `<span>Workspace <b>CUI</b> ${EX}</span><span>Chat only on unclassified enclaves</span>`, `${btn("Digest schedule", 'data-modal="plat-digest"')}${btn("Send a test", 'data-modal="plat-test"', true)}`),
    pair(
      completion({ title: "Events that reach someone", total: NT.length, done: NT.filter((n) => n[2] || n[3]).length, unit: "events with a channel on", note: "Proposal", minis: [["By email", NT.filter((n) => n[2]).length, NT.length], ["In the app", NT.filter((n) => n[3]).length, NT.length], ["By chat", 0, NT.length]] }),
      attention([["clock", "Sent immediately", NT.filter((n) => n[5] === "Immediately").length], ["info", "In a daily digest", NT.filter((n) => n[5] === "Daily digest").length], ["info", "In a weekly digest", NT.filter((n) => n[5] === "Weekly digest").length], ["ring", "Chat, off in this enclave", NT.length, true]], "How they arrive"),
    ),
    `<div class="frame"><div class="tablebox"><table><thead><tr><th>Event</th><th>Who</th><th>Email</th><th>In the app</th><th>Chat</th><th>Frequency</th></tr></thead><tbody>${NT.map(([ev, r, e, a, c, f], i) => `<tr><td class="nm"><button type="button" class="platform-linkbtn" data-panel="plat-notif" data-id="${i}">${trunc(ev)}</button></td><td>${muted(r)}</td><td>${tog(e)}</td><td>${tog(a)}</td><td>${tog(c, true)}</td><td>${f === "Immediately" ? pill("warn", f) : pill("none", f)}</td></tr>`).join("")}</tbody></table></div><div class="pager"><span class="num">1–${NT.length} of ${NT.length}</span><span>Changes save as you make them</span></div></div>`,
    `<p class="note-p">Proposal: the events, channels and frequencies are Example. The people each role reaches are WS-X90's role holders.</p>`,
  );
  P["plat-notif"] = (id) => {
    const n = NT[+id] || NT[0];
    const roles = n[1].split(", ");
    return { label: "Notification preview", body: `
      ${head4(n[0], sm("Edit", 'data-modal="plat-digest"', true))}
      ${kv([["Frequency", n[5] === "Immediately" ? pill("warn", n[5]) : pill("none", n[5])], ["Email", n[2] ? pill("ok", "On") : pill("none", "Off")], ["In the app", n[3] ? pill("ok", "On") : pill("none", "Off")], ["Chat", pill("none", "Off · CUI enclave")]])}
      ${sect("Who it reaches on WS-X90", roles.length, roles.map((r) => sbRow(esc(r), ROLE[r] ? who(ROLE[r]) : muted("The record's own"))).join(""))}
      ${sect("Message", EX, `<span>WS-X90 · ${esc(n[0])}</span><span class="note-p">Subject lines carry the marking (CUI) and no record text.</span>`)}` };
  };
  M["plat-digest"] = () => ({ title: "Digest schedule", body: `${EX}
      ${field("Daily digest", `<div class="platform-list">${pickRow("dg", "7", true, "07:00 local", "")}${pickRow("dg", "12", false, "12:00 local", "")}</div>`)}
      ${field("Weekly digest", `<div class="platform-list">${pickRow("wk", "mon", true, "Monday", "")}${pickRow("wk", "fri", false, "Friday", "")}</div>`)}
      ${field("Quiet hours", `<div class="platform-list">${pickRow("qh", "on", true, "20:00 to 06:00 · critical findings still go", "", false)}</div>`)}`, footer: done("Save schedule") });
  M["plat-test"] = () => ({ title: "Send a test", body: `<p>Sends one of each event to you, by email and in the app. Chat stays off in the CUI enclave.</p>${kv([["To", who("Joel Barrantes")], ["Marking", tag("CUI")]])}`, footer: done("Send test") });

  // ——— Event log: WS-X90's recorded actions ———
  const EVENTS = [["2026-11-17T23:55", "Snapshot taken", "Daily job", "Control status · WS-X90", "176 of 560 controls satisfied", "program_posture_snapshots"], ["2026-11-16T23:55", "Snapshot taken", "Daily job", "Control status · WS-X90", "176 of 560 controls satisfied", "program_posture_snapshots"], ["2026-11-15T23:55", "Snapshot taken", "Daily job", "Control status · WS-X90", "176 of 560 controls satisfied", "program_posture_snapshots"], ["2026-11-14T23:55", "Snapshot taken", "Daily job", "Control status · WS-X90", "174 of 560 controls satisfied", "program_posture_snapshots"], ["2026-11-14T16:30", "Finding offered", "Ingrid Solberg", "Mission Computer · X800 Missile component set", "CVE-2024-6387 in the Mission Computer's OpenSSH server: found on version 1 of X800 Missile component set.", "activity_events"], ["2026-11-13T23:55", "Snapshot taken", "Daily job", "Control status · WS-X90", "174 of 560 controls satisfied", "program_posture_snapshots"], ["2026-11-13T20:22", "Import queued", "Joel Barrantes", "DISA STIG checklist — internal Ethernet switch", "", "ingestion_jobs"], ["2026-11-13T17:00", "Evidence accepted", "Nadia Fournier", "Key store containment test report, LRU-003 export attempts and handle-only interface trace", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-13T14:00", "Evidence accepted", "Nadia Fournier", "Separate-device factor test report, LRU-014 and LRU-019 local, network and remote paths", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-13T14:00", "Evidence accepted", "Nadia Fournier", "Replay resistance test report, LRU-007 gateway and LRU-008 link authentication", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-13T14:00", "Evidence sent back", "Nadia Fournier", "PIV path build and revocation check test report, LRU-017 and LRU-019", "Does not settle the determination; the assessor asked for more before closing it.", "evidence_reviews"], ["2026-11-13T09:00", "Evidence sent back", "Nadia Fournier", "Non-privileged authentication method inventory, LRU-019 and LRU-017 baselines", "Shows the requirement not met on at least one of its components; resubmit once the finding is closed.", "evidence_reviews"], ["2026-11-13T09:00", "Evidence accepted", "Nadia Fournier", "Receiving inspection attestations, 24 units of LRU-004 / LRU-006 / LRU-008", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-13T09:00", "Evidence sent back", "Nadia Fournier", "External exchange agreement register with interim-approval exceptions", "Shows the requirement not met on at least one of its components; resubmit once the finding is closed.", "evidence_reviews"], ["2026-11-13T09:00", "Evidence sent back", "Nadia Fournier", "Switch port authentication state export, LRU-009 with LRU-002 boot measurement bindings", "Shows the requirement not met on at least one of its components; resubmit once the finding is closed.", "evidence_reviews"], ["2026-11-13T02:15", "Import validating", "Joel Barrantes", "Software bill of materials — Payload Interface Controller firmware", "", "ingestion_jobs"], ["2026-11-12T17:00", "Evidence accepted", "Nadia Fournier", "IA policy and IA procedure set, revision 2.4, signed export with review-flag report", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-12T16:00", "Evidence accepted", "Nadia Fournier", "Privileged two-factor enforcement test report, LRU-013 and LRU-014, build 4.2.1", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-12T15:00", "Results published", "D. Okafor", "WS-X90 Expanded Control Set Assessment", "Security assessment report — expanded control set, increment 1: 225 findings.", "activity_events"], ["2026-11-12T14:00", "Evidence accepted", "Nadia Fournier", "Boot chain signature verification test, out-of-set certificate injection on LRU-002", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-12T13:00", "Evidence accepted", "Nadia Fournier", "Spill isolation test report, LRU-007 enclave session block and LRU-009 port isolation, 10-minute threshold", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-12T11:00", "Evidence accepted", "Nadia Fournier", "Update package staging rejection test, single unsigned component in package UPD-5.4.1", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-12T02:15", "Import importing", "Joel Barrantes", "ACAS vulnerability scan — mission network", "", "ingestion_jobs"], ["2026-11-11T14:00", "Evidence accepted", "Nadia Fournier", "Approved WS-X90 external network baseline showing the single managed access control point", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-11T11:00", "Evidence sent back", "Nadia Fournier", "Privileged maintenance tool invocation log extract, LRU-014 to LRU-018", "Shows the requirement not met on at least one of its components; resubmit once the finding is closed.", "evidence_reviews"], ["2026-11-11T09:00", "Evidence sent back", "Nadia Fournier", "Remote privileged command admission test report, approved list, attestation and window checks", "Shows the requirement not met on at least one of its components; resubmit once the finding is closed.", "evidence_reviews"], ["2026-11-11T09:00", "Evidence accepted", "Nadia Fournier", "Installation privilege elevation test, LRU-019 maintenance session to LRU-001", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-11T09:00", "Evidence accepted", "Nadia Fournier", "Inventory currency figure and unconfirmed record list, 30 operating days to 2026-11-10", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-10T16:00", "Evidence accepted", "Nadia Fournier", "Configuration setting verification pass, security-relevant component set including LRU-004 and LRU-005", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-10T14:00", "Evidence accepted", "Nadia Fournier", "Execution prevention test, unapproved image load refusal on LRU-001 in mission and maintenance mode", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-10T11:00", "Evidence accepted", "Nadia Fournier", "Authorised software list and deny-all enforcement policy export, LRU-001 and LRU-013", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-10T11:00", "Evidence accepted", "Nadia Fournier", "LRU replacement inventory delta test, maintenance action MA-2026-0177", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-10T09:00", "Evidence accepted", "Nadia Fournier", "Maintenance tool authorization test report, LRU-014 session token enforcement", "Matches the requirement's acceptance criteria and the Block 1 configuration.", "evidence_reviews"], ["2026-11-09T17:00", "Evidence sent back", "Nadia Fournier", "Hardware identity comparison test report, LRU-013 power-on inventory check", "Shows the requirement not met on at least one of its components; resubmit once the finding is closed.", "evidence_reviews"], ["2026-10-30T03:40", "Import failed", "Joel Barrantes", "Container image scan — telemetry services", "Rejected: SARIF 2.1.0 validation failed at runs[0].results[17].locations, which has no physicalLocation.", "ingestion_jobs"], ["2026-10-14T03:40", "Import completed", "Joel Barrantes", "SCAP compliance scan — maintenance laptop (Windows 11)", "286 rules: 259 pass, 21 fail, 6 not applicable; score 90.6%.", "ingestion_jobs"], ["2026-10-13T03:40", "Import completed", "Joel Barrantes", "DISA STIG checklist — mission computing (RHEL 9)", "412 rules: 371 not a finding, 29 open, 12 not applicable.", "ingestion_jobs"], ["2026-10-10T03:40", "Import completed", "Joel Barrantes", "ACAS vulnerability scan — mission network, October", "1,284 results across 26 hosts: 2 critical, 9 high, 31 medium, 112 low, 1,130 informational.", "ingestion_jobs"], ["2026-09-28T02:15", "Import cancelled", "Joel Barrantes", "Nessus scan — maintenance access gateway", "Cancelled: superseded by the expanded control set assessment's adversarial testing.", "ingestion_jobs"], ["2026-09-18T19:00", "Authorization decided", "R. Calloway", "WS-X90 Sentinel Mission System authorization package · version 1", "authorized with conditions, effective 2026-09-18, expires 2029-09-17", "authorization_decisions"], ["2026-09-02T15:00", "Package published", "Priya Raghavan", "WS-X90 Sentinel Mission System authorization package · version 1", "6 documents", "package_revisions"], ["2026-08-28T15:00", "Results published", "D. Okafor", "WS-X90 Initial Authorization Security Assessment", "Security assessment report — initial authorization: 68 findings.", "activity_events"], ["2026-06-30T14:00", "Inheritance accepted", "Priya Raghavan", "Corporate identity provider · 15 controls", "SSP 2 and SSP 3", "inheritance_acceptances"]];
  const KIND = { evidence_reviews: "reviews", ingestion_jobs: "imports", program_posture_snapshots: "system" };
  const kindOf = (e) => KIND[e[5]] || "decisions";
  const evType = (t) => ({ "Import importing": "Import started" })[t] || t;
  const evPill = (e) => {
    const t = evType(e[1]);
    const k = /failed|sent back/i.test(t) ? "bad" : /accepted|completed|published|decided|Snapshot/i.test(t) ? "ok" : /offered|started|validating/i.test(t) ? "info" : "none";
    return pill(k, t);
  };
  const SRCNAME = { activity_events: "Activity event", evidence_reviews: "Evidence review", ingestion_jobs: "Scanner ingestion job", program_posture_snapshots: "Control status snapshot", package_revisions: "Package version", authorization_decisions: "Authorization decision", inheritance_acceptances: "Inheritance acceptance" };
  const EVCOUNT = { all: 299, reviews: 280, imports: 8, decisions: 6, system: 5 };
  function eventLog(cur, kind) {
    const list = EVENTS.map((e, i) => [e, i]).filter(([e]) => !kind || kindOf(e) === kind).slice(0, kind ? 24 : 30);
    return page(
      header("Event log", "<span>WS-X90 Sentinel Mission System</span><span>Times in UTC</span>", btn("Export", 'data-modal="plat-export-log"', true)),
      pair(
        `<div class="card"><div class="t">Events recorded <span class="num">299</span></div><div class="big num">299</div><div class="stack"><i style="width:${(226 / 299) * 100}%;background:var(--ok)"></i><i style="width:${(54 / 299) * 100}%;background:var(--bad)"></i><i style="width:${(8 / 299) * 100}%;background:var(--info)"></i><i style="width:${(11 / 299) * 100}%;background:var(--ink-4)"></i></div><div class="legend"><span style="--c:var(--ok)">Evidence accepted 226</span><span style="--c:var(--bad)">Sent back 54</span><span style="--c:var(--info)">Imports 8</span><span style="--c:var(--ink-4)">Decisions and daily job 11</span></div><div class="foot"><span>Since Jun 30, 2026</span><span>Read-only · kept 7 years ${EX}</span></div></div>`,
        attention([["diamond", "Import failed", 1], ["diamond", "Evidence sent back", 54], ["clock", "Imports not finished", 3], ["info", "Decisions and publications", 6]], "Worth a look"),
      ),
      qviews([["event-log", "All", EVCOUNT.all], ["event-log-reviews", "Evidence reviews", EVCOUNT.reviews], ["event-log-imports", "Imports", EVCOUNT.imports], ["event-log-decisions", "Decisions and publications", EVCOUNT.decisions], ["event-log-system", "Daily job", EVCOUNT.system]], cur),
      tools("Search events", ["Type", "Actor", "Target", "Time"]),
      table(["Time", "Type", "Actor", "Target", "Details"], list.map(([e, i]) => ({ id: String(i), cells: [`<span class="num">${utc(e[0])}</span>`, evPill(e), e[2] === "Daily job" ? muted("Daily job") : who(e[2]), trunc(e[3], "xs"), e[4] ? trunc(e[4], "s") : muted("—")] })), EVCOUNT[kind || "all"], "plat-event"),
      `<p class="note-p">Every row is WS-X90's, read from activity events, evidence reviews, scanner ingestion jobs, package versions, the authorization decision, inheritance acceptances and the daily snapshot. The log of the tool's own settings and exports is proposed.</p>`,
    );
  }
  S["event-log"] = () => eventLog("event-log");
  S["event-log-reviews"] = () => eventLog("event-log-reviews", "reviews");
  S["event-log-imports"] = () => eventLog("event-log-imports", "imports");
  S["event-log-decisions"] = () => eventLog("event-log-decisions", "decisions");
  S["event-log-system"] = () => eventLog("event-log-system", "system");
  P["plat-event"] = (id) => {
    const e = EVENTS[+id] || EVENTS[0];
    return { label: "Event preview", body: `
      ${head4(evType(e[1]), "")}
      ${kv([["Time", `<span class="num">${utc(e[0])}</span>`], ["Type", evPill(e)], ["Actor", e[2] === "Daily job" ? muted("Daily job · pg_cron") : who(e[2])], ["Program", tag("PRG-1090")], ["Recorded as", esc(SRCNAME[e[5]] || e[5])]])}
      ${sect("Target", null, `<span class="platform-wrap" style="color:var(--ink)">${esc(e[3])}</span>`)}
      ${e[4] ? sect("Details", null, `<span class="platform-wrap">${esc(e[4])}</span>`) : ""}
      <p class="note-p">Entries cannot be edited or deleted. An export of the log is itself an entry.</p>` };
  };
  M["plat-export-log"] = () => ({ title: "Export event log", body: `
      ${field("Events", `<div class="platform-list">${pickRow("ev", "all", true, "All 299 events", "Jun 30 to Nov 17")}${pickRow("ev", "30", false, "Last 30 days", "")}${pickRow("ev", "view", false, "The view shown", "")}</div>`)}
      ${field("Format", `<div class="platform-list">${pickRow("fm", "csv", true, "CSV", "")}${pickRow("fm", "json", false, "JSON", "")}</div>`)}
      <div class="next">${gl("info")}<span>The file carries the CUI banner, and the export is recorded as an event.</span></div>`, footer: done("Export") });

  // ——— Enclaves and markings (Example) ———
  const EN = [
    { id: "u", name: "Unclassified", banner: "u", text: "UNCLASSIFIED", deploy: "Cloud · DoD IL2", programs: "5 corporate programs", ai: "Hosted model inside the IL2 tenancy", chat: "On", connect: "Online connectors allowed" },
    { id: "cui", name: "CUI", banner: "", text: "CUI", deploy: "On-premises · program data center", programs: "WS-X90, Customer A, B and C", ai: "Model hosted inside the enclave; no prompt leaves it", chat: "Off", connect: "Files, and online only to hosts inside the enclave" },
    { id: "s", name: "Classified enclave", banner: "s", text: "SECRET", deploy: "Air-gapped · SIPRNet", programs: "None drawn", ai: "Off unless the AO approves an on-enclave model", chat: "Off", connect: "Files by approved cross-domain transfer only" },
  ];
  S.enclaves = () => page(
    header("Enclaves & markings", `<span>Workspaces separated by classification ${EX}</span>`, btn("Add enclave", 'data-modal="plat-enclave-new"', true)),
    `<div class="grid3">${EN.map((e) => `<div class="platform-card" tabindex="0" role="button" data-panel="plat-enclave" data-id="${e.id}" aria-label="${esc(e.name)} workspace">
      <div class="platform-banner ${e.banner}">${e.text}</div>
      <div class="top2"><b>${esc(e.name)} workspace</b><span class="sp">${e.id === "cui" ? pill("info", "You are here") : ""}</span></div>
      <dl><dt>Runs</dt><dd>${esc(e.deploy)}</dd><dt>Holds</dt><dd>${esc(e.programs)}</dd><dt>AI</dt><dd>${esc(e.ai)}</dd><dt>Chat</dt><dd>${esc(e.chat)}</dd></dl></div>`).join("")}</div>`,
    `<div class="grid2"><div class="card"><div class="t">CUI marking on every page and export</div>
      <div class="platform-doc"><div class="platform-banner">CUI</div><div class="pg"><div class="platform-ind">Controlled by: Program office<br>CUI category: CTI<br>Distribution statement: D<br>POC: Joel Barrantes, ISSM</div><span>(CUI) WS-X90 Sentinel Mission System · System security plan, SSP 3</span><span>(U) Section headings carry their own portion marks.</span></div><div class="platform-banner">CUI</div></div></div>
      <div class="card"><div class="t">Marking rules <span>${EX}</span></div><div class="rows">
      <div class="row">${gl("check")}<span>Banner at top and bottom of every page</span></div>
      <div class="row">${gl("check")}<span>Designation indicator on first page of an export</span></div>
      <div class="row">${gl("check")}<span>Portion marks on exported paragraphs</span></div>
      <div class="row">${gl("check")}<span>Distribution statement D on exports</span></div>
      <div class="row">${gl("clock")}<span>Export-controlled (ITAR) warning, when set</span></div>
      <div class="row">${gl("diamond")}<span>A classified upload is blocked and reported as spillage</span></div></div></div></div>`,
    `<div class="card"><div class="t">Where AI drafting may run <span>${EX}</span></div><div class="frame"><div class="tablebox"><table><thead><tr><th>Drafting</th><th>Unclassified</th><th>CUI</th><th>Classified</th></tr></thead><tbody>
      ${[["Data call answers", "ok", "ok", "none"], ["Control implementation narratives", "ok", "ok", "none"], ["Finding summaries", "ok", "ok", "none"], ["Evidence reading", "ok", "warn", "none"]].map(([t, a, b, c]) => `<tr><td class="nm">${t}</td><td>${pill(a, "Hosted model")}</td><td>${b === "ok" ? pill("ok", "In-enclave model") : pill("warn", "In-enclave, ISSM approves")}</td><td>${pill("none", "Off")}</td></tr>`).join("")}
    </tbody></table></div></div></div>`,
    `<p class="note-p">Everything on this screen is Example. Banner colours follow the DoD marking convention.</p>`,
  );
  P["plat-enclave"] = (id) => {
    const e = EN.find((x) => x.id === id) || EN[1];
    return { label: "Enclave preview", body: `
      <div class="platform-banner ${e.banner}">${e.text}</div>
      ${head4(`${e.name} workspace`, sm("Edit", 'data-modal="plat-enclave-new"', true))}
      ${kv([["Runs", esc(e.deploy)], ["Holds", esc(e.programs)], ["AI drafting", esc(e.ai)], ["Chat", esc(e.chat)], ["Connectors", esc(e.connect)], ["In the app", EX]])}
      ${sect("Moving data out", null, e.id === "s" ? "Only through an approved cross-domain solution, reviewed by the ISSM." : "Exports carry the banner; a higher-classification file never enters.")}` };
  };
  M["plat-enclave-new"] = () => ({ title: "Add enclave", body: `${EX}
      ${field("Classification", `<div class="platform-list">${pickRow("cl", "u", false, "Unclassified", "")}${pickRow("cl", "cui", true, "CUI", "")}${pickRow("cl", "s", false, "Secret", "")}</div>`)}
      ${field("Runs", `<div class="platform-list">${pickRow("dp", "cloud", false, "Cloud · DoD IL4 or IL5", "")}${pickRow("dp", "prem", true, "On-premises", "")}${pickRow("dp", "gap", false, "Air-gapped", "")}</div>`)}
      ${field("AI drafting", `<div class="platform-list">${pickRow("ai", "in", true, "Model inside the enclave", "")}${pickRow("ai", "off", false, "Off", "")}</div>`)}`, footer: done("Add enclave") });

  // ——— Common control providers ———
  const CCP = [
    { id: "idp", name: "Corporate identity provider", kind: "Enterprise service", real: true, caps: [["IDP-CAP-SSO", "Enterprise single sign-on", ["IA-2", "IA-8", "AC-7", "AC-12", "IA-5(1)"], "Federate the boundary's applications to the enterprise identity provider and keep no local password store."], ["IDP-CAP-MFA", "Phishing-resistant multifactor authentication", ["IA-2(1)", "IA-2(2)", "IA-2(8)", "IA-5"], "Require the enterprise authenticator for every interactive logon to the boundary."], ["IDP-CAP-ACCOUNTS", "Account lifecycle management", ["AC-2", "AC-2(1)", "AC-2(3)", "IA-4"], "Map the boundary's roles to directory groups and complete the quarterly access review for them."], ["IDP-CAP-PKI", "Certificate issuance", ["SC-17", "IA-5(2)"], "Enroll the boundary's devices and validate certificate paths to the enterprise trust anchor."]], accepted: "Jun 30 · Priya Raghavan", ssp: "SSP 2 and SSP 3" },
    { id: "lab", name: "Integration laboratory hosting enclave", kind: "Hosting enclave", real: false, caps: [["LAB-PHYS", "Physical and environmental protection", ["PE-2", "PE-3", "PE-6"], "Badge the program's staff through the enclave's access list."], ["LAB-CONT", "Backup and alternate processing", ["CP-7", "CP-9"], "Name the system's backup sets and test a restore each year."], ["LAB-NET", "Boundary and remote maintenance", ["SC-7", "MA-4"], "Route maintenance sessions through the enclave's jump hosts."]] },
    { id: "cssp", name: "Cybersecurity service provider (CSSP)", kind: "CSSP", real: false, caps: [["CSSP-IR", "Incident handling and reporting", ["IR-4", "IR-4(1)", "IR-5", "IR-6"], "Report incidents to the CSSP within one hour and keep the contact roster current."], ["CSSP-MON", "Monitoring and log review", ["SI-4", "AU-6", "AU-6(1)"], "Forward audit logs to the CSSP's collector."]] },
    { id: "peo", name: "PEO enterprise services", kind: "PEO shared services", real: false, caps: [["PEO-VM", "Vulnerability management and advisories", ["RA-5", "SI-5", "CA-7"], "Accept ACAS policies from the PEO and import scans on its cadence."], ["PEO-KEY", "Key management and provenance", ["SC-12", "SC-13", "SR-4"], "Order keys through the PEO's key management office."]] },
  ];
  const ccpCodes = (c) => c.caps.flatMap((x) => x[2]);
  S["common-controls"] = () => {
    const idp = ccpCodes(CCP[0]);
    const n = (s) => idp.filter((c) => CTL[c][1] === s).length;
    return page(
      header("Common control providers", "<span>What WS-X90 inherits, and from whom</span><span>Accepted by <b>Priya Raghavan</b>, ISSO</span>", btn("Add provider", 'data-modal="plat-ccp-new"', true)),
      pair(
        completion({ title: "Inherited controls satisfied", total: idp.length, done: n("satisfied"), unit: "controls satisfied", note: "from the Corporate identity provider", minis: [["Capabilities", 4, 4], ["Accepted on SSP 2", 15, 15], ["Consumer duties", 4, 4]] }),
        attention([["clock", "Not assessed", n("not_assessed")], ["diamond", "Other than satisfied", n("other_than_satisfied")], ["part", "Partially satisfied", n("partially_satisfied")], ["ring", "Example providers, not accepted", 3, true]]),
      ),
      tools("Search providers", ["Kind", "Status"]),
      table(["Provider", "Kind", "Controls satisfied", "Accepted", "Status"], CCP.map((c) => {
        const codes = ccpCodes(c);
        return { id: c.id, cells: [`${esc(c.name)}${c.real ? "" : " " + EX}`, tag(c.kind), `<span class="num">${satOf(codes)} of ${codes.length}</span>`, c.real ? esc(c.accepted) : none("Not offered yet"), c.real ? pill("ok", "Accepted") : pill("none", "Proposed")] };
      }), 4, "plat-ccp"),
      `<p class="note-p">The Corporate identity provider, its offers and WS-X90's acceptances are real. The enclave, CSSP and PEO rows are Example; the statuses beside their controls are WS-X90's own today.</p>`,
    );
  };
  P["plat-ccp"] = (id) => {
    const c = CCP.find((x) => x.id === id) || CCP[0];
    const codes = ccpCodes(c);
    return { label: "Provider preview", body: `
      ${head4(c.name, c.real ? sm("Review acceptance", 'data-modal="plat-ccp-new"') : sm("Ask for an offer", 'data-modal="plat-ccp-new"', true))}
      ${kv([["Kind", tag(c.kind)], ["Program", c.real ? "PRG-1013 · system idp-core" : "—"], ["In the app", c.real ? REAL : EX], ["Controls", `<span class="num">${codes.length} · ${satOf(codes)} satisfied</span>`], ["Accepted", c.real ? esc(c.accepted) : none("Not offered yet")], ["On", c.real ? esc(c.ssp) : "—"]])}
      ${c.caps.map(([code, name, ctl, duty]) => sect(`${name}`, code, `${ctlRows(ctl)}<span class="note-p">Consumer duty: ${esc(duty)}</span>`)).join("")}` };
  };
  M["plat-ccp-new"] = () => ({ title: "Add provider", body: `
      ${field("Provider", `<div class="platform-list">${pickRow("pv", "lab", true, "A hosting enclave", "Physical, contingency, boundary")}${pickRow("pv", "cssp", false, "A CSSP", "Incident response and monitoring")}${pickRow("pv", "peo", false, "PEO enterprise services", "Shared tools and keys")}</div>`)}
      ${field("Their offer", `<div class="next">${gl("info")}<span>An offer names each capability, the controls it covers and the consumer's duty. WS-X90 accepts it control by control on its SSP.</span></div>`)}`, footer: done("Ask for an offer") });

  // ——— Components register (component_rows) ———
  const COMP = [["Mission Computer", "X800 Missile component set", 2, "published", "Priya Raghavan", "hardware", 1, 3, 4, 0, 61, 52, 42, 6, 4, 1, 1, 2, "Air Defense"], ["Audit Log Collector", "G25 launch control component set", 1, "published", "Marcus Ryde", "software", 1, 2, 0, 0, 14, 14, 13, 1, 0, 0, 0, 0, "Mission Systems"], ["Console Workstation", "G25 launch control component set", 1, "published", "Marcus Ryde", "hardware", 1, 1, 0, 0, 33, 0, 0, 0, 0, 0, 0, 0, "Mission Systems"], ["Launch Control Software", "G25 launch control component set", 1, "published", "Marcus Ryde", "software", 1, 1, 0, 1, 34, 0, 0, 0, 0, 0, 0, 0, "Mission Systems"], ["Link Encryptor", "G25 launch control component set", 1, "published", "Marcus Ryde", "hardware", 1, 1, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, "Mission Systems"], ["Shelter Power Distribution Unit", "G25 launch control component set", 1, "published", "Marcus Ryde", "hardware", 1, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, "Mission Systems"], ["Tactical Router", "G25 launch control component set", 1, "published", "Marcus Ryde", "hardware", 1, 1, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, "Mission Systems"], ["Time Server", "G25 launch control component set", 1, "published", "Marcus Ryde", "hardware", 1, 1, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, "Mission Systems"], ["Vehicle Power Interface", "G25 launch control component set", 1, "published", "Marcus Ryde", "hardware", 1, 1, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, "Mission Systems"], ["Cryptographic Module", "X800 Missile component set", 2, "published", "Priya Raghavan", "hardware", 1, 2, 3, 1, 27, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Datalink Radio", "X800 Missile component set", 2, "published", "Priya Raghavan", "hardware", 1, 2, 3, 0, 26, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Ejector Interface Unit", "X800 Missile component set", 2, "published", "Priya Raghavan", "hardware", 1, 0, 1, 0, 15, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Field Test Set", "X800 Missile component set", 2, "published", "Priya Raghavan", "hardware", 1, 2, 3, 0, 28, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Key Load Interface", "X800 Missile component set", 2, "published", "Priya Raghavan", "hardware", 1, 2, 3, 0, 17, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Maintenance Port", "X800 Missile component set", 2, "published", "Priya Raghavan", "hardware", 1, 2, 3, 0, 24, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Mission Data Loader", "X800 Missile component set", 2, "published", "Priya Raghavan", "software", 1, 1, 2, 0, 24, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Navigation Unit", "X800 Missile component set", 2, "published", "Priya Raghavan", "hardware", 1, 2, 3, 0, 13, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Operational Flight Program", "X800 Missile component set", 2, "published", "Priya Raghavan", "software", 1, 2, 3, 1, 51, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Pallet Controller", "X800 Missile component set", 2, "published", "Priya Raghavan", "hardware", 1, 1, 2, 0, 31, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Pallet Controller Firmware", "X800 Missile component set", 2, "published", "Priya Raghavan", "software", 1, 1, 2, 1, 39, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Pallet Datalink Node", "X800 Missile component set", 2, "published", "Priya Raghavan", "hardware", 1, 1, 2, 0, 27, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Rail Umbilical Interface Unit", "X800 Missile component set", 2, "published", "Priya Raghavan", "hardware", 1, 1, 2, 0, 30, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Secure Boot Firmware", "X800 Missile component set", 2, "published", "Priya Raghavan", "software", 1, 2, 3, 0, 30, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Seeker Interface Unit", "X800 Missile component set", 2, "published", "Priya Raghavan", "hardware", 1, 2, 3, 0, 7, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Separation Sensor", "X800 Missile component set", 2, "published", "Priya Raghavan", "hardware", 1, 0, 1, 0, 9, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Telemetry Unit", "X800 Missile component set", 2, "published", "Priya Raghavan", "hardware", 1, 2, 3, 1, 14, 0, 0, 0, 0, 0, 0, 0, "Air Defense"], ["Company A Profile", "Company A Profile", 1, "published", null, "policy", 0, 1, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, null], ["Datalink Relay", "G40 ground terminal component set", 1, "published", null, "hardware", 1, 1, 0, 0, 21, 0, 0, 0, 0, 0, 0, 0, null], ["Planning Software", "G40 ground terminal component set", 1, "published", null, "software", 1, 1, 0, 1, 27, 0, 0, 0, 0, 0, 0, 0, null], ["Planning Workstation", "G40 ground terminal component set", 1, "published", null, "hardware", 1, 1, 0, 0, 37, 0, 0, 0, 0, 0, 0, 0, null], ["Shelter Power Unit", "G40 ground terminal component set", 1, "published", null, "hardware", 1, 1, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, null], ["Production code signing enclave", "Production code signing enclave", 1, "published", null, "service", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null], ["Launch Controller", "R210 launcher electronics component set", 1, "published", null, "hardware", 1, 1, 0, 0, 51, 0, 0, 0, 0, 0, 0, 0, null], ["Launch Controller Firmware", "R210 launcher electronics component set", 1, "published", null, "software", 1, 1, 0, 1, 37, 0, 0, 0, 0, 0, 0, 0, null], ["Launcher Power Supply", "R210 launcher electronics component set", 1, "published", null, "hardware", 1, 1, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, null], ["Subsystem A.2", "Subsystem A.2", 1, "published", null, "service", 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, null], ["Company B Profile", "Company B Profile", 1, "draft", null, "policy", 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, null], ["Component A.11 · Mission Computer X", "Component A.11 · Mission Computer X", 1, "draft", null, "hardware", 0, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, null], ["Component A.12 · Sensor Interface", "Component A.12 · Sensor Interface", 1, "draft", null, "hardware", 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, null], ["Component A.21 · Gateway G4", "Component A.21 · Gateway G4", 1, "draft", null, "hardware", 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, null], ["Component A.22 · CipherCore C2", "Component A.22 · CipherCore C2", 1, "draft", null, "hardware", 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, null], ["Component B.21 · Operator Console", "Component B.21 · Operator Console", 1, "draft", null, "hardware", 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, null], ["Corporate identity provider", "Corporate identity provider", 1, "draft", null, "service", 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, null], ["Enterprise security policy set", "Enterprise security policy set", 1, "draft", null, "policy", 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, null], ["Europe Operations Supplement", "Europe Operations Supplement", 1, "draft", null, "policy", 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, null], ["GovCloud landing zone", "GovCloud landing zone", 1, "draft", null, "service", 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, null], ["Host Platform H", "Host Platform H", 1, "draft", null, "hardware", 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, null], ["Module provisioning and fusing line", "Module provisioning and fusing line", 1, "draft", null, "process", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null], ["Sierra Vista data center", "Sierra Vista data center", 1, "draft", null, "service", 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, null], ["Subsystem A.1", "Subsystem A.1", 1, "draft", null, "service", 0, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, null], ["System A", "System A", 1, "draft", null, "service", 0, 0, 0, 0, 26, 0, 0, 0, 0, 0, 0, 0, null], ["System B", "System B", 1, "draft", null, "service", 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, null]];
  const typeName = (t) => t[0].toUpperCase() + t.slice(1);
  const satCell = (c) => (c[11] ? `<span class="num">${c[12]} of ${c[10]}</span>` : c[10] ? none("Not assessed") : muted("No claims"));
  const waitCell = (c) => {
    const parts = [c[15] ? `${c[15]} offer` : "", c[16] ? `<span class="platform-late">${c[16]} CVE</span>` : "", c[17] ? `<span class="platform-soon">${c[17]} review</span>` : ""].filter(Boolean);
    return parts.length ? parts.join(" · ") : muted("Nothing");
  };
  const usedCell = (c) => (c[6] || c[7] ? `<span class="num">${c[6] ? c[6] + " product · " : ""}${c[7]} program${c[7] === 1 ? "" : "s"}</span>` : muted("Not used"));
  S.components = () => page(
    header("Components", "<span>Assessed once, used everywhere</span><span><b>52</b> components in <b>23</b> component sets</span>", `${btn("Component sets")}${btn("Review offer", 'data-panel="plat-offer" data-id="cve"', true)}`),
    pair(
      completion({ title: "Published components assessed", total: 36, done: 2, unit: "with a published component assessment", note: "Mission Computer and Audit Log Collector", minis: [["Published", 36, 52], ["With an owner", 26, 52], ["Used by a program", 31, 52]] }),
      attention([["diamond", "Open CVE in use", 1], ["info", "Offer waiting", 1], ["clock", "Controls to review", 2], ["clock", "Components with consumers behind", 18], ["ring", "No owner", 26]]),
    ),
    h.views([["All", 52], ["Published", 36], ["Draft", 16], ["Assessed", 2], ["Consumers behind", 18]]),
    tools("Find components", ["Component set", "Owner", "Type", "Business line"]),
    table(["Component", "Component set", "Version", "Owner", "Behind", "Controls satisfied", "Waiting"], COMP.slice(0, 25).map((c, i) => ({ id: String(i), cells: [
      c[0] === "Mission Computer" ? `<a href="#component-mc" style="color:var(--ink);text-decoration:none">${esc(c[0])}</a>` : trunc(c[0], "s"), trunc(c[1], "xxs"),
      `<span class="num">${c[2]}</span>${c[3] === "draft" ? " " + pill("none", "Draft") : ""}`, who(c[4]),
      c[8] ? `<span class="platform-soon num">${c[8]}</span>` : muted("0"), satCell(c), waitCell(c)] })), 52, "plat-comp"),
    `<p class="note-p">Every row is the workspace's, from component_rows. Mission Computer has a full record; the others open a preview.</p>`,
  );
  P["plat-comp"] = (id) => {
    const c = COMP[+id] || COMP[0];
    const mc = c[0] === "Mission Computer";
    const parts = [[c[12], "var(--ok)"], [c[13], "var(--warn)"], [c[14], "var(--bad)"], [c[17], "var(--info)"]];
    return { label: "Component preview", body: `
      ${head4(c[0], mc ? `<a class="btn sm ink platform-a" href="#component-mc">Open component</a>` : c[3] === "draft" ? sm("Publish version 1") : sm("Plan an assessment"))}
      ${kv([["Version", `<span class="num">${c[2]}</span> · ${c[3] === "draft" ? pill("none", "Draft") : pill("ok", "Published")}`], ["Component set", esc(c[1])], ["Owner", who(c[4])], ["Type", esc(typeName(c[5]))], ["Business line", c[18] ? esc(c[18]) : muted("None")], ["Used by", usedCell(c)]])}
      ${c[11] ? sect("Controls", `${c[10]} claimed`, `<div class="stack">${parts.filter(([n]) => n).map(([n, col]) => `<i style="width:${(n / c[10]) * 100}%;background:${col}"></i>`).join("")}</div><div class="legend"><span style="--c:var(--ok)">Satisfied ${c[12]}</span><span style="--c:var(--warn)">Partially ${c[13]}</span><span style="--c:var(--bad)">Other than ${c[14]}</span>${c[17] ? `<span style="--c:var(--info)">To review ${c[17]}</span>` : ""}</div>`) : sect("Controls", c[10], c[10] ? `${c[10]} claimed; no published component assessment yet, so every consumer judges them itself.` : "Claims no controls.")}
      ${c[8] ? `<div class="next">${gl("clock")}<span>${c[8]} consumer${c[8] === 1 ? " is" : "s are"} behind version ${c[2]}</span></div>` : ""}
      ${mc ? `<div class="next">${gl("info")}<span>CVE-2024-6387 offered from WS-X90 by Ingrid Solberg</span><span class="sp">${sm("Review offer", 'data-panel="plat-offer" data-id="cve"')}</span></div>` : ""}` };
  };

  // ——— Mission Computer record ———
  const MCCTL = [["AC-2", "Account Management", "AC", "satisfied", true, false], ["AC-2(1)", "Automated System Account Management", "AC", "satisfied", true, false], ["AC-2(3)", "Disable Accounts", "AC", "satisfied", true, false], ["AC-2(5)", "Inactivity Logout", "AC", "satisfied", true, false], ["AC-2(11)", "Usage Conditions", "AC", "satisfied", true, false], ["AC-2(12)", "Account Monitoring for Atypical Usage", "AC", "satisfied", true, false], ["AC-3", "Access Enforcement", "AC", "satisfied", true, false], ["AC-4", "Information Flow Enforcement", "AC", "satisfied", true, false], ["AC-4(4)", "Flow Control of Encrypted Information", "AC", "partially_satisfied", true, false], ["AC-6(5)", "Privileged Accounts", "AC", "satisfied", true, false], ["AC-6(9)", "Log Use of Privileged Functions", "AC", "partially_satisfied", true, false], ["AC-6(10)", "Prohibit Non-privileged Users from Executing Privileged Functions", "AC", "satisfied", true, false], ["AC-7", "Unsuccessful Logon Attempts", "AC", "partially_satisfied", true, false], ["AC-10", "Concurrent Session Control", "AC", "satisfied", true, false], ["AC-12", "Session Termination", "AC", "not_assessed", false, false], ["AC-17(1)", "Monitoring and Control", "AC", "satisfied", true, false], ["AC-17(2)", "Protection of Confidentiality and Integrity Using Encryption", "AC", "not_assessed", false, true], ["AC-17(3)", "Managed Access Control Points", "AC", "not_assessed", false, false], ["AC-17(4)", "Privileged Commands and Access", "AC", "satisfied", true, false], ["AC-18", "Wireless Access", "AC", "satisfied", true, false], ["AC-18(3)", "Disable Wireless Networking", "AC", "satisfied", true, false], ["AC-18(5)", "Antennas and Transmission Power Levels", "AC", "satisfied", true, false], ["AC-20", "Use of External Systems", "AC", "other_than_satisfied", true, false], ["AU-1", "Policy and Procedures", "AU", "satisfied", true, false], ["AU-2", "Event Logging", "AU", "satisfied", true, false], ["AU-4", "Audit Log Storage Capacity", "AU", "satisfied", true, false], ["AU-5(1)", "Storage Capacity Warning", "AU", "satisfied", true, false], ["AU-6", "Audit Record Review, Analysis, and Reporting", "AU", "satisfied", true, false], ["AU-8", "Time Stamps", "AU", "satisfied", true, false], ["AU-9(2)", "Store on Separate Physical Systems or Components", "AU", "other_than_satisfied", true, false], ["AU-10", "Non-repudiation", "AU", "satisfied", true, false], ["AU-11", "Audit Record Retention", "AU", "satisfied", true, false], ["AU-12", "Audit Record Generation", "AU", "other_than_satisfied", true, false], ["AU-12(1)", "System-wide and Time-correlated Audit Trail", "AU", "other_than_satisfied", true, false], ["IA-2", "Identification and Authentication (Organizational Users)", "IA", "satisfied", true, false], ["IA-2(2)", "Multi-factor Authentication to Non-privileged Accounts", "IA", "satisfied", true, false], ["IA-2(8)", "Access to Accounts — Replay Resistant", "IA", "not_assessed", false, false], ["IA-5", "Authenticator Management", "IA", "satisfied", true, false], ["IA-5(1)", "Password-based Authentication", "IA", "satisfied", true, false], ["IA-8", "Identification and Authentication (Non-organizational Users)", "IA", "satisfied", true, false], ["IA-12", "Identity Proofing", "IA", "satisfied", true, false], ["SC-1", "Policy and Procedures", "SC", "satisfied", true, false], ["SC-3", "Security Function Isolation", "SC", "satisfied", true, false], ["SC-7(3)", "Access Points", "SC", "partially_satisfied", true, false], ["SC-7(7)", "Split Tunneling for Remote Devices", "SC", "satisfied", true, false], ["SC-7(8)", "Route Traffic to Authenticated Proxy Servers", "SC", "satisfied", true, false], ["SC-7(18)", "Fail Secure", "SC", "satisfied", true, false], ["SC-7(21)", "Isolation of System Components", "SC", "not_assessed", false, false], ["SC-12", "Cryptographic Key Establishment and Management", "SC", "satisfied", true, false], ["SC-15", "Collaborative Computing Devices and Applications", "SC", "satisfied", true, false], ["SC-18", "Mobile Code", "SC", "partially_satisfied", true, false], ["SC-22", "Architecture and Provisioning for Name/Address Resolution Service", "SC", "satisfied", true, false], ["SC-23", "Session Authenticity", "SC", "not_assessed", false, true], ["SC-28(1)", "Cryptographic Protection", "SC", "not_assessed", false, false], ["SC-39", "Process Isolation", "SC", "satisfied", true, false], ["SI-4(2)", "Automated Tools and Mechanisms for Real-time Analysis", "SI", "not_assessed", false, false], ["SI-4(20)", "Privileged Users", "SI", "not_assessed", false, false], ["SI-4(22)", "Unauthorized Network Services", "SI", "satisfied", true, false], ["SI-7", "Software, Firmware, and Information Integrity", "SI", "satisfied", true, false], ["SI-7(2)", "Automated Notifications of Integrity Violations", "SI", "satisfied", true, false], ["SI-8", "Spam Protection", "SI", "partially_satisfied", true, false]];
  const ctlState = (r) => (r[5] ? "to_review" : r[3]);
  const mcTabs = (cur) => tabs([["component-mc", "Overview"], ["component-mc-assessment", "Assessment", 61], ["component-mc-where", "Where used", 4], ["component-mc-findings", "Findings", 1], ["component-mc-sbom", "SBOM", 13], ["component-mc-versions", "Versions", 2]], cur);
  const mcHead = (cur) => [
    `<div class="platform-crumb"><a href="#components">Components</a><span aria-hidden="true">›</span><span>Mission Computer</span></div>`,
    header("Mission Computer", "<span>Version <b>2</b> · Nov 12</span><span>Owner <b>Priya Raghavan</b></span><span>Business line <b>Air Defense</b></span><span>Set <b>X800 Missile component set</b></span>", `${btn("Version 2 ⌄")}${btn("Review offer", 'data-panel="plat-offer" data-id="cve"', true)}`),
    mcTabs(cur),
  ];
  const mcCount = (s) => MCCTL.filter((r) => ctlState(r) === s).length;
  S["component-mc"] = () => page(...mcHead("component-mc"),
    pair(
      completion({ title: "Controls satisfied", total: 61, done: 42, unit: "controls satisfied", note: "version 1 assessment, carried to version 2", minis: [["Carried from version 1", 52, 61], ["Determined", 52, 61], ["To review", 2, 61]] }),
      attention([["diamond", "Other than satisfied", mcCount("other_than_satisfied")], ["part", "Partially satisfied", mcCount("partially_satisfied")], ["clock", "To review after version 2", mcCount("to_review")], ["ring", "Not assessed", mcCount("not_assessed")], ["info", "Offer waiting", 1]]),
    ),
    `<div class="grid2">
      <div class="card platform-fit"><div class="t">What changed in version 2 <span>Software</span></div><p style="color:var(--ink-2)">The maintenance image carries OpenSSH server 9.8p1 in place of 9.6p1, which fixes CVE-2024-6387 (regreSSHion). Nothing else in the image changes.</p>
        <div class="rows platform-fit">${["AC-17(2)", "SC-23", "RA-5", "SI-2"].map((c) => `<div class="row">${gl(c === "AC-17(2)" || c === "SC-23" ? "clock" : "ring")}<span class="platform-rowtxt"><b style="font-weight:500">${c}</b> ${esc(c === "SC-23" ? "Session Authenticity" : c === "AC-17(2)" ? "Protection of Confidentiality and Integrity Using Encryption" : CTL[c][0])}</span><b class="muted platform-rowend" style="font-size:13px;font-weight:400">${c === "AC-17(2)" || c === "SC-23" ? "To review" : "Not claimed"}</b></div>`).join("")}</div></div>
      <div class="card platform-fit"><div class="t">Where used <span><a href="#component-mc-where">View all</a></span></div><div class="rows platform-fit">
        <div class="row">${gl("clock")}<span>X800 Missile · product, element GS-MC</span><b class="muted" style="font-size:13px;font-weight:400">Version 1</b></div>
        <div class="row">${gl("clock")}<span>WS-X90 Sentinel Mission System · LRU-001</span><b class="num">50 of 54</b></div>
        <div class="row">${gl("clock")}<span>Customer A · X800 Rail Integration</span><b class="num">53 of 54</b></div>
        <div class="row">${gl("clock")}<span>Customer B · X800 Palletized Integration</span><b class="num">54 of 54</b></div></div><p class="note-p">Controls inherited, of those judged. All four take version 1.</p></div>
    </div>`,
    `<div class="next">${gl("diamond")}<span><b>CVE-2024-6387</b> (high, 8.1) is open on version 1: 3 programs use it, 2 hold no issue for it yet.</span><a class="sp" href="#component-mc-findings" style="font-weight:500">Open findings →</a></div>`,
  );
  const MCV = [["all", "All", 61], ["satisfied", "Satisfied", 42], ["partially_satisfied", "Partially satisfied", 6], ["other_than_satisfied", "Other than satisfied", 4], ["to_review", "To review", 2], ["not_assessed", "Not assessed", 7]];
  S["component-mc-assessment"] = () => page(...mcHead("component-mc-assessment"),
    `<div class="card"><div class="t">X800 Missile component set version 1 component assessment <span>Elena Vasquez · Sep 30</span></div><div class="stack">${[[42, "var(--ok)"], [6, "var(--warn)"], [4, "var(--bad)"], [2, "var(--info)"], [7, "var(--ink-4)"]].map(([n, c]) => `<i style="width:${(n / 61) * 100}%;background:${c}"></i>`).join("")}</div><div class="legend"><span style="--c:var(--ok)">Satisfied 42</span><span style="--c:var(--warn)">Partially 6</span><span style="--c:var(--bad)">Other than 4</span><span style="--c:var(--info)">To review 2</span><span style="--c:var(--ink-4)">Not assessed 7</span></div><p class="note-p">52 determinations carried from version 1 to version 2; 2 wait on review because version 2 changes them.</p></div>`,
    h.views(MCV.map(([, l, n]) => [l, n])),
    tools("Find controls", ["Family", "Determination", "Carried"]),
    table(["Control", "Family", "Determination", "Basis"], MCCTL.map((r, i) => ({ id: String(i), cells: [`<span class="platform-trunc" title="${esc(r[0] + " " + r[1])}"><b style="font-weight:500">${esc(r[0])}</b> ${esc(r[1])}</span>`, tag(r[2]), stPill(ctlState(r)), r[5] ? `<span class="platform-soon">Version 2 changes it</span>` : r[4] ? muted("Carried from version 1") : none("Not judged")] })), 61, "plat-mcctl"),
  );
  P["plat-mcctl"] = (id) => {
    const r = MCCTL[+id] || MCCTL[0];
    return { label: "Control preview", body: `
      ${head4(`${r[0]} ${r[1]}`, r[5] ? sm("Record determination", "", true) : "")}
      ${kv([["Determination", stPill(ctlState(r))], ["Family", tag(r[2])], ["Claimed", pill("ok", "Claimed")], ["Basis", r[5] ? "Version 2 changes it: OpenSSH 9.8p1" : r[4] ? "Carried from version 1" : "Not judged in version 1"], ["Assessment", r[4] || r[5] ? "Version 1 · Elena Vasquez · Sep 30" : "—"]])}
      ${sect("Consumers of version 1", 3, sbRow("WS-X90 Sentinel Mission System", muted("LRU-001")) + sbRow("Customer A · X800 Rail Integration", muted("CA-GS-MC")) + sbRow("Customer B · X800 Palletized Integration", muted("CB-GS-MC")))}` };
  };
  const CONS = [
    { id: "x800", name: "X800 Missile", kind: "Product", sys: "Versions 1 and 2", el: "GS-MC", ver: 1, change: null, inh: null, cve: 1, issue: null, pin: "Configurations A, B and C" },
    { id: "wsx90", name: "WS-X90 Sentinel Mission System", kind: "PRG-1090", sys: "SYS-WSX90", el: "LRU-001", ver: 1, change: null, inh: [50, 54], cve: 1, issue: "Open · 1 POA&M item", pin: "WS-X90 Block 1 production configuration · MC-FW 4.2.1" },
    { id: "cusa", name: "Customer A · X800 Rail Integration", kind: "PRG-2101", sys: "X800-A-CUSA", el: "CA-GS-MC", ver: 1, change: "Inherited", inh: [53, 54], cve: 1, issue: null, pin: "First article as built · 1.0" },
    { id: "cusb", name: "Customer B · X800 Palletized Integration", kind: "PRG-2102", sys: "X800-C-CUSB", el: "CB-GS-MC", ver: 1, change: "Inherited", inh: [54, 54], cve: 1, issue: null, pin: "Pallet set 101 as built · 1.0" },
  ];
  S["component-mc-where"] = () => page(...mcHead("component-mc-where"),
    pair(
      completion({ title: "Consumers on version 2", total: 4, done: 0, unit: "consumers on the latest version", note: "4 take version 1", minis: [["Programs", 3, 3], ["Products", 1, 1], ["Modified here", 0, 4]] }),
      attention([["clock", "Behind version 2", 4], ["diamond", "Open CVE, no issue yet", 2], ["ring", "Modified here", 0, true]]),
    ),
    h.views([["Everything using it", 4], ["Behind", 4], ["Modified here", 0]]),
    table(["Consumer", "System", "Element", "Version", "Change", "Controls inherited", "CVE-2024-6387"], CONS.map((c) => ({ id: c.id, cells: [`${trunc(c.name, "s")} ${c.kind === "Product" ? tag("Product") : ""}`, esc(c.sys), esc(c.el), `<span class="platform-soon num">${c.ver} · behind</span>`, c.change ? pill("ok", c.change) : muted("—"), c.inh ? `<span class="num">${c.inh[0]} of ${c.inh[1]}</span>` : muted("Product"), c.issue ? pill("warn", "Issue open") : c.kind === "Product" ? muted("—") : pill("bad", "No issue yet")] })), 4, "plat-consumer"),
  );
  P["plat-consumer"] = (id) => {
    const c = CONS.find((x) => x.id === id) || CONS[1];
    return { label: "Consumer preview", body: `
      ${head4(c.name, c.id === "wsx90" ? sm("Take version 2", 'data-modal="plat-take"', true) : c.kind === "Product" ? "" : sm("Take version 2", 'data-modal="plat-take"', true))}
      ${kv([["Kind", tag(c.kind)], ["System", esc(c.sys)], ["Element", esc(c.el)], ["Version", `<span class="platform-soon">1 · one behind</span>`], ["Pinned in", `<span class="platform-wrap">${esc(c.pin)}</span>`], ["Inherited", c.inh ? `<span class="num">${c.inh[0]} of ${c.inh[1]} judged controls</span>` : "—"]])}
      ${c.kind === "Product" ? "" : sect("CVE-2024-6387", null, c.issue ? sbRow("CVE-2024-6387 in the OpenSSH server (regreSSHion)", pill("warn", "Open")) + sbRow("Opened Oct 10 · owner Ingrid Solberg", muted(c.issue)) : sbRow("No operational issue for it yet", pill("bad", "Unanswered")) + `<span class="note-p">Accepting the offer opens one here.</span>`)}` };
  };
  M["plat-take"] = () => ({ title: "Take version 2", body: `
      ${kv([["System", "SYS-WSX90 · LRU-001 Mission Computer"], ["From", "Version 1"], ["To", "Version 2 · published Nov 12"]])}
      <div class="platform-sum"><div>Determinations taken<b class="num">54</b></div><div>Carried<b class="num">52</b></div><div>To review<b class="num">2</b></div><div>Judged anew<b class="num">0</b></div></div>
      <div class="frame"><div class="tablebox"><table><thead><tr><th>Control</th><th>Inherited</th><th>Now</th><th>After</th></tr></thead><tbody>
        <tr><td class="nm">AC-17(2)</td><td>${pill("ok", "Yes")}</td><td>${stPill("satisfied")}</td><td>${stPill("not_assessed")}</td></tr>
        <tr><td class="nm">SC-23</td><td>${pill("ok", "Yes")}</td><td>${stPill("satisfied")}</td><td>${stPill("not_assessed")}</td></tr>
        <tr><td class="nm">RA-5</td><td>${pill("none", "No")}</td><td>${stPill("satisfied")}</td><td>${stPill("satisfied")}</td></tr>
        <tr><td class="nm">SI-2</td><td>${pill("none", "No")}</td><td>${stPill("not_assessed")}</td><td>${stPill("not_assessed")}</td></tr>
      </tbody></table></div></div>
      <p class="note-p">From component_version_review for LRU-001: the SSP keeps version 1 until this is taken.</p>`, footer: done("Take version 2") });
  S["component-mc-findings"] = () => page(...mcHead("component-mc-findings"),
    `<h4 class="subhead">Offers</h4>`,
    table(["Finding", "State", "From", "Offered by", "Offered", "Waiting on"], [{ id: "cve", cells: [trunc("CVE-2024-6387 in the Mission Computer's OpenSSH server", "s"), pill("info", "Offered"), trunc("WS-X90 Sentinel Mission System", "xs"), who("Ingrid Solberg"), `<span class="num">Nov 14</span>`, who("Priya Raghavan")] }], 1, "plat-offer"),
    `<h4 class="subhead">Vulnerabilities</h4>`,
    table(["CVE", "Severity", "Component", "Fixed in", "Programs", "Answered", "Controls"], [{ id: "cve", cells: [`<b style="font-weight:500">CVE-2024-6387</b> regreSSHion`, sevPill("high"), "openssh-server 9.6p1 · version 1", "OpenSSH 9.8p1 · version 2", num(3), `<span class="platform-late num">1 of 3</span>`, `${tag("RA-5")} ${tag("SI-2")}`] }], 1, "plat-offer"),
  );
  P["plat-offer"] = () => ({ label: "Offer preview", body: `
      ${head4("CVE-2024-6387 in the Mission Computer's OpenSSH server", `<span class="platform-actions">${sm("Return", 'data-modal="plat-return"')}${sm("Accept", 'data-modal="plat-accept"', true)}</span>`)}
      <div class="chain">
        <div class="step">${gl("check")}<span>Found · Oct 10 · WS-X90 Sentinel Mission System</span><span class="muted">LRU-001</span></div>
        <div class="step">${gl("check")}<span>Offered · Nov 14 · Ingrid Solberg</span><span class="muted">Done</span></div>
        <div class="step">${gl("clock")}<span>Review · Priya Raghavan</span><span class="muted">Waiting</span></div>
        <div class="step">${gl("ring")}<span>Accepted</span><span class="muted">Next</span></div></div>
      ${kv([["State", pill("info", "Offered")], ["Component", "Mission Computer · version 1"], ["Program", "WS-X90 Sentinel Mission System"], ["System component", "LRU-001 Mission Computer"], ["Severity", sevPill("high")]])}
      <p style="color:var(--ink-2)">Found on WS-X90's LRU-001, which runs the Mission Computer's image as version 1 of the component set delivers it. Every system built from that version carries the same server.</p>
      ${sect("Operational issues offered", 1, sbRow("CVE-2024-6387 in the OpenSSH server (regreSSHion)", sevPill("high")))}
      ${sect("Accepting opens", null, sbRow("Customer A · X800 Rail Integration", muted("1 operational issue")) + sbRow("Customer B · X800 Palletized Integration", muted("1 operational issue")) + sbRow("WS-X90 Sentinel Mission System", muted("Keeps its own")))}` });
  M["plat-accept"] = () => ({ title: "Accept offer", body: `
      <p>Accepting records the finding against Mission Computer version 1 and opens one operational issue in each other program built from it.</p>
      <div class="platform-sum"><div>Issues opened<b class="num">2</b></div><div>Programs<b class="num">3</b></div><div>WS-X90 keeps<b class="num">1</b></div></div>
      ${field("Note to the programs", '<textarea class="platform-input" aria-label="Note to the programs">Fixed in version 2 (OpenSSH 9.8p1). Take version 2 to close it.</textarea>')}`, footer: done("Accept offer") });
  M["plat-return"] = () => ({ title: "Return offer", body: `
      <p>Returning sends the finding back to Ingrid Solberg on WS-X90. Nothing opens in the other programs.</p>
      ${field("Reason", '<textarea class="platform-input" aria-label="Reason" placeholder="Say what the program should change before offering it again"></textarea>', "Required. WS-X90 sees it on the offer.")}`, footer: done("Return offer") });

  const SB = [["busybox", "1.36.1", "1.36.1", "application", "GPL-2.0-only"], ["chrony", "4.5", "4.5", "application", "GPL-2.0-only"], ["dbus", "1.14.10", "1.14.10", "application", "AFL-2.1 OR GPL-2.0-or-later"], ["glibc", "2.39", "2.39", "library", "LGPL-2.1-or-later"], ["libpcap", "1.10.4", "1.10.4", "library", "BSD-3-Clause"], ["linux", "6.6.21", "6.6.21", "operating-system", "GPL-2.0-only"], ["mission-computer-image", "1.0.0", "1.0.0", "firmware", null], ["openssh-server", "9.6p1", "9.8p1", "application", "BSD-2-Clause AND BSD-3-Clause AND ISC AND MIT"], ["openssl", "3.2.1", "3.2.1", "library", "Apache-2.0"], ["sqlite", "3.45.1", "3.45.1", "library", "blessing"], ["systemd", "255.4", "255.4", "application", "LGPL-2.1-or-later"], ["u-boot", "2024.01", "2024.01", "firmware", "GPL-2.0-or-later"], ["zlib", "1.3.1", "1.3.1", "library", "Zlib"]];
  const purl = (n, v) => (n === "mission-computer-image" ? null : `pkg:generic/${n === "openssh-server" ? "openssh" : n}@${v}`);
  function sbomTab(v) {
    const two = v === 2;
    return page(...mcHead("component-mc-sbom"),
      `<div class="card"><div class="t">${two ? "Mission Computer maintenance image SBOM, version 2" : "Mission Computer maintenance image SBOM"} <span>CycloneDX 1.5</span></div>${kv([["Generated", two ? "Nov 12" : "Oct 8"], ["Serial", `<span class="platform-mono">${two ? "urn:uuid:8f2b1c7e-5a4d-4e39-9c61-2d7f0b3a6e15" : "urn:uuid:63d63818-ca79-406b-939d-74a552feae25"}</span>`], ["Components", "13"], ["Affected", two ? `${gl("check")} None` : `<span class="platform-late">1 · openssh-server 9.6p1</span>`]])}</div>`,
      qviews([["component-mc-sbom", "Version 2 · Nov 12", 13], ["component-mc-sbom-v1", "Version 1 · Oct 8", 13]], two ? "component-mc-sbom" : "component-mc-sbom-v1"),
      tools("Find packages", ["Kind", "License", "Vulnerable"]),
      table(["Package", "Version", "Kind", "License", "Package URL", "Vulnerabilities"], SB.map((s, i) => {
        const ver = two ? s[2] : s[1], vuln = !two && s[0] === "openssh-server";
        return { id: `${v}-${i}`, cells: [esc(s[0]), `<span class="num">${esc(ver)}</span>${two && s[1] !== s[2] ? ` <span class="platform-muted">was ${esc(s[1])}</span>` : ""}`, tag(s[3]), s[4] ? trunc(s[4], "xs") : muted("None"), purl(s[0], ver) ? `<span class="platform-trunc xs platform-muted">${esc(purl(s[0], ver))}</span>` : muted("None"), vuln ? sevPill("high") : two && s[0] === "openssh-server" ? pill("ok", "Fixed") : muted("0")] };
      }), 13, "plat-sbomc"));
  }
  S["component-mc-sbom"] = () => sbomTab(2);
  S["component-mc-sbom-v1"] = () => sbomTab(1);
  P["plat-sbomc"] = (id) => {
    const [v, i] = String(id).split("-").map(Number);
    const s = SB[i] || SB[7], ver = v === 2 ? s[2] : s[1], ssh = s[0] === "openssh-server";
    return { label: "Package preview", body: `
      ${head4(`${s[0]} ${ver}`, "")}
      ${kv([["SBOM", v === 2 ? "Version 2 · Nov 12" : "Version 1 · Oct 8"], ["Kind", tag(s[3])], ["License", s[4] ? `<span class="platform-wrap">${esc(s[4])}</span>` : muted("None")], ["Package URL", purl(s[0], ver) ? `<span class="platform-mono">${esc(purl(s[0], ver))}</span>` : muted("None")], ["Parent", s[0] === "mission-computer-image" ? muted("The image itself") : "mission-computer-image"]])}
      ${ssh ? sect("CVE-2024-6387", v === 2 ? "fixed" : "affected", `${sbRow("Signal handler race in OpenSSH's sshd (regreSSHion)", sevPill("high"))}<span>${v === 2 ? "9.8p1 holds the fix." : "9.6p1 is inside the affected range, OpenSSH 8.5p1 through 9.7p1."}</span><span class="note-p">CVSS 8.1 · published Jul 1, 2024 · counters RA-5, SI-2</span>`) : sect("Vulnerabilities", 0, "No known CVE.")}` };
  };
  S["component-mc-versions"] = () => page(...mcHead("component-mc-versions"),
    table(["Version", "State", "Published", "Change", "Controls affected", "Determinations", "SBOM", "Open CVEs"], [
      { id: "2", cells: ["Version 2", pill("ok", "Published"), `<span class="num">Nov 12</span>`, tag("Software"), `<span class="num">4</span> · <span class="platform-soon">2 to review</span>`, `<span class="num">52 carried</span>`, `<span class="num">Nov 12 · 13</span>`, muted("0")] },
      { id: "1", cells: ["Version 1", pill("ok", "Published"), muted("Assessed Sep 30"), muted("First version"), muted("—"), `<span class="num">52 by Elena Vasquez</span>`, `<span class="num">Oct 8 · 13</span>`, `<span class="platform-late num">1</span>`] },
    ], 2, "plat-version"),
    `<p class="note-p">Consumers take a version explicitly; WS-X90, Customer A and Customer B are still on version 1.</p>`,
  );
  P["plat-version"] = (id) => ({ label: "Version preview", body: id === "1" ? `
      ${head4("Mission Computer version 1", "")}
      ${kv([["State", pill("ok", "Published")], ["Assessment", "X800 Missile component set version 1 component assessment"], ["Assessor", who("Elena Vasquez")], ["Completed", "Sep 30"], ["Determinations", "52 of 61 claimed"]])}
      ${sect("Open CVE", 1, sbRow("CVE-2024-6387 · openssh-server 9.6p1", sevPill("high")))}
      ${sect("Taken by", 4, "X800 Missile, WS-X90, Customer A and Customer B")}` : `
      ${head4("Mission Computer version 2", sm("Compare with version 1"))}
      ${kv([["State", pill("ok", "Published")], ["Published", "Nov 12 · 17:00 UTC"], ["Change", tag("Software")], ["Determinations", "52 carried · 2 to review"], ["Taken by", none("No consumer yet")]])}
      ${sect("What changed", null, "The maintenance image carries OpenSSH server 9.8p1 in place of 9.6p1, which fixes CVE-2024-6387 (regreSSHion). Nothing else in the image changes.")}
      ${sect("Controls it affects", 4, ["AC-17(2)", "SC-23", "RA-5", "SI-2"].map((c) => sbRow(esc(c), c === "AC-17(2)" || c === "SC-23" ? pill("warn", "To review") : pill("none", "Not claimed"))).join(""))}` });

  document.getElementById("main").addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches(".platform-card[data-panel]")) { e.preventDefault(); e.target.click(); }
  });
  nav(["sources-errors"], "sources");
  nav(["deadlines-vuln", "deadlines-stig", "deadlines-findings", "deadlines-other"], "deadlines");
  nav(["event-log-reviews", "event-log-imports", "event-log-decisions", "event-log-system"], "event-log");
  nav(["component-mc", "component-mc-assessment", "component-mc-where", "component-mc-findings", "component-mc-sbom", "component-mc-sbom-v1", "component-mc-versions"], "components");
})();
