// Before & after › Canvas Kit (route before-after-canvas): six screens of the Vanta flow study as they would look in
// Workday's Canvas Kit (canvas-kit-master, Apache-2.0; tokens from @workday/canvas-tokens-web 4.x, generated into
// mod-zzzz-v5-ck.css by ck/gen-tokens.py). Each mockup is static HTML drawn here, scoped under .ck-app, with the
// prototype's own WS-X90 data; "Today" shows the screen as it is (V3 on) from ck/cur-<id>.jpg. Nothing of v2 or V3 changes.
(function () {
  const PA = window.PA; if (!PA || !PA.S) return;
  const { S, ROUTE_NAV, h } = PA;
  const { esc, header } = h;
  const ROUTE = "before-after-canvas";
  const W = 1440; // the width every mockup is drawn at (the width of the Today screenshots); it is zoomed to fit the column

  // ——— Icons (plain strokes, drawn for this page) ———
  const P = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    chev: '<path d="m7 10 5 5 5-5"/>',
    right: '<path d="m10 7 5 5-5 5"/>',
    left: '<path d="m14 7-5 5 5 5"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    home: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/>',
    sys: '<rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="16" height="6" rx="1.5"/>',
    shield: '<path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6z"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/>',
    clip: '<path d="M8 12.5 13.5 7a3 3 0 0 1 4.2 4.2l-7 7a5 5 0 0 1-7-7L10 4.8"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    flag: '<path d="M6 21V4M6 4h11l-2 4 2 4H6"/>',
    alert: '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4.5M12 17.5h.01"/>',
    award: '<circle cx="12" cy="9" r="5"/><path d="m9 13.5-1.5 7L12 18l4.5 2.5-1.5-7"/>',
    clip2: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9z"/>',
    user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5"/>',
    more: '<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
    ext: '<path d="M14 5h5v5M19 5l-8 8M17 14v5H5V7h5"/>',
    dot: '<circle cx="12" cy="12" r="4"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  };
  const ic = (n, cls) => `<svg class="ck-ic${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ""}</svg>`;

  // ——— Canvas pieces, drawn to the kit's specs ———
  const btn = (label, kind, icon, size) => `<span class="ck-btn ck-btn-${kind || "secondary"}${size ? " ck-btn-" + size : ""}">${icon ? ic(icon) : ""}${label ? `<span>${esc(label)}</span>` : ""}</span>`;
  const iconBtn = (icon, label) => `<span class="ck-ibtn" title="${esc(label)}" aria-label="${esc(label)}">${ic(icon)}</span>`;
  // StatusIndicator, low emphasis: a soft surface, strong text and an icon, so colour is never the only signal.
  const SI = {
    Satisfied: ["pos", "check"], Passed: ["pos", "check"], Completed: ["pos", "check"], Accepted: ["pos", "check"],
    "Partially satisfied": ["cau", "dot"], "Partially implemented": ["cau", "dot"], Moderate: ["cau", "alert"], "In review": ["info", "dot"],
    "Waiting on review": ["info", "dot"], "To revise": ["cau", "dot"],
    "Not assessed": ["neu", "dot"], "No evidence": ["neu", "dot"], "Not started": ["neu", "dot"], "Not judged": ["neu", "dot"],
    Critical: ["crit", "alert"], High: ["crit", "alert"], "CAT I": ["crit", "alert"], Low: ["neu", "dot"],
    "ATO with conditions": ["cau", "award"],
  };
  const status = (t) => { const [k, i] = SI[t] || ["neu", "dot"]; return `<span class="ck-si ck-si-${k}">${ic(i)}${esc(t)}</span>`; };
  const pill = (t, n) => `<span class="ck-pill">${esc(t)}${n != null ? `<span class="ck-pill-n">${esc(n)}</span>` : ""}</span>`;
  const count = (n) => `<span class="ck-count">${esc(n)}</span>`;
  const avatar = (name) => {
    if (!name) return `<span class="ck-who ck-who-none"><span class="ck-av ck-av-none">${ic("user")}</span>Unassigned</span>`;
    const ini = name.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase();
    return `<span class="ck-who"><span class="ck-av">${esc(ini)}</span>${esc(name)}</span>`;
  };
  const ring = (a, b) => {
    const f = b ? a / b : 0, r = 7, c = 2 * Math.PI * r;
    return `<span class="ck-ring"><svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="${r}" class="ck-ring-t"/><circle cx="9" cy="9" r="${r}" class="ck-ring-v" stroke-dasharray="${(f * c).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 9 9)"/></svg>${a}/${b}</span>`;
  };
  const bar = (pct) => `<span class="ck-bar"><span style="width:${pct}%"></span></span>`;
  const select = (label) => `<span class="ck-select">${esc(label)}${ic("chev")}</span>`;
  const search = (ph) => `<span class="ck-input ck-input-search">${ic("search")}<span>${esc(ph)}</span></span>`;
  const tabs = (items, on) => `<div class="ck-tabs" role="presentation">${items.map(([t, n]) => `<span class="ck-tab${t === on ? " on" : ""}">${esc(t)}${n != null ? count(n) : ""}</span>`).join("")}</div>`;
  const crumbs = (xs) => `<div class="ck-crumbs">${xs.map((x, i) => (i < xs.length - 1 ? `<span class="ck-link">${esc(x)}</span>${ic("right")}` : `<span>${esc(x)}</span>`)).join("")}</div>`;
  const card = (title, body, extra, cls) => `<section class="ck-card${cls ? " " + cls : ""}">${title ? `<div class="ck-card-h"><h3>${esc(title)}</h3>${extra || ""}</div>` : ""}${body}</section>`;
  function table(cols, rows, opt) {
    const o = opt || {};
    return `<div class="ck-table-w"><table class="ck-table"><thead><tr>${cols.map((c) => `<th${c.n ? ' class="n"' : ""}${c.w ? ` style="width:${c.w}"` : ""}>${esc(c.t)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((v, i) => `<td${cols[i].n ? ' class="n"' : ""}>${v}</td>`).join("")}</tr>`).join("")}</tbody></table>
      ${o.foot ? `<div class="ck-table-f">${o.foot}</div>` : ""}</div>`;
  }
  const pager = (a, b, n) => `<span>${a}–${b} of ${n}</span><span class="ck-pager">${iconBtn("left", "Previous page")}<span class="ck-pg on">1</span><span class="ck-pg">2</span><span class="ck-pg">3</span><span class="ck-pg-gap">…</span>${iconBtn("right", "Next page")}</span>`;
  const toolbar = (ph, filters, primary) => `<div class="ck-toolbar">${search(ph)}<span class="ck-btn ck-btn-tertiary ck-btn-sm">${ic("filter")}<span>All</span>${ic("chev")}</span>${filters.map(select).join("")}<span class="ck-sp"></span>${btn("More", "tertiary", "more", "sm")}${btn(primary, "primary", "plus", "sm")}</div>`;
  const code = (t) => `<span class="ck-code">${esc(t)}</span>`;
  const muted = (t) => `<span class="ck-muted">${esc(t)}</span>`;
  const late = (t) => `<span class="ck-late">${esc(t)}</span>`;
  const title2 = (a, b) => `<span class="ck-t2"><span class="ck-t2a">${esc(a)}</span>${b ? `<span class="ck-t2b">${esc(b)}</span>` : ""}</span>`;

  // ——— The app frame: Canvas global header, side panel navigation, page header ———
  const NAV = [["Overview", "home"], ["System", "sys"], ["Controls", "shield"], ["Requirements", "list"], ["Evidence", "clip"], ["Documents", "doc"], ["Assessments", "clip2"], ["Findings", "flag"], ["Risks", "alert"], ["Authorization", "award"]];
  function frame(on, main) {
    return `<div class="ck-app" style="width:${W}px">
      <header class="ck-top"><span class="ck-menu">${ic("grid")}</span><span class="ck-logo"><b>PA</b><span>Program Assurance</span></span>
        <span class="ck-gsearch">${ic("search")}<span>Search controls, evidence, findings</span><kbd>⌘K</kbd></span>
        <span class="ck-sp"></span>${iconBtn("bell", "Notifications")}<span class="ck-av ck-av-me">IS</span></header>
      <div class="ck-body">
        <nav class="ck-side" aria-label="Program">
          <span class="ck-back">${ic("left")}Workspace</span>
          <div class="ck-prog"><div><b>WS-X90</b><span>Sentinel Mission System</span></div>${ic("chev")}</div>
          <div class="ck-prog-m">PRG-1090 · Impact High<br>Increment 2 · TMRR · PDR Nov 24</div>
          <div class="ck-side-l">${NAV.map(([t, i]) => `<span class="ck-nav${t === on ? " on" : ""}">${ic(i)}${esc(t)}</span>`).join("")}</div>
        </nav>
        <main class="ck-main">${main}</main>
      </div></div>`;
  }

  // ——— The six screens ———
  function overview() {
    const phases = [["MSA", "Materiel solution analysis", 1, 1], ["TMRR", "Technology maturation and risk reduction", 3, 5, true], ["EMD", "Engineering and manufacturing development", 0, 3], ["Test", "Integration, test and production approval", 0, 3], ["Ops", "Production, deployment and operations", 0, 3]];
    const steps = [["SRR · System requirements review", "Engineering review", "Decided Sep 22", "Passed", [2, 2]], ["SFR · System functional review", "Engineering review", "Decided Oct 13", "Passed", [2, 2]], ["Select security controls", "RMF action", "Decided Oct 27", "Completed", [1, 1]], ["PDR · Preliminary design review", "Engineering review", "Due Nov 24 · in 7 days", "In review", [2, 5]], ["AO approval of the RMF strategy", "RMF action", "Due Dec 15", "Not started", null]];
    const team = [["AO", "R. Calloway"], ["AODR", "Lena Marsh"], ["PM/SO", "Ray Colston"], ["Lead assessor", "D. Okafor"], ["ISSM", "Joel Barrantes"], ["ISSO", "Priya Raghavan"], ["ISSE", "Ingrid Solberg"]];
    const main = `${crumbs(["Programs", "PRG-1090"])}
      <div class="ck-ph"><div class="ck-ph-t"><h1>WS-X90 Sentinel Mission System</h1>${pill("PRG-1090")}${status("ATO with conditions")}</div><div class="ck-ph-a">${btn("More", "secondary", null)}${btn("Open the PDR package", "primary")}</div></div>
      ${tabs([["Overview"], ["Team", 15], ["Activity"]], "Overview")}
      <div class="ck-grid ck-grid-side">
        <div class="ck-stack">
          ${card("Lifecycle", `<div class="ck-phases">${phases.map(([k, t, a, b, cur]) => `<div class="ck-phase${cur ? " on" : ""}"><b>${k}</b><span>${esc(t)}</span><span class="ck-phase-d">${Array.from({ length: b }, (_, i) => `<i class="${i < a ? "d" : ""}"></i>`).join("")}</span><span class="ck-muted">${a} of ${b} done</span></div>`).join("")}</div>
            ${table([{ t: "Step" }, { t: "Kind", w: "150px" }, { t: "Due or decided", w: "170px" }, { t: "Status", w: "130px" }, { t: "Ready", w: "80px" }], steps.map(([a, b, c, d, r]) => [`<b class="ck-strong">${esc(a)}</b>`, esc(b), esc(c), status(d), r ? ring(r[0], r[1]) : muted("—")]))}`, select("Increment 2 · Block 1.1 · current"))}
          ${card("Next gate: PDR · Preliminary design review", `<p class="ck-muted ck-p">Engineering review · Due Nov 24 · in 7 days · Marcus Ryde decides</p>
            <ul class="ck-checks">${[["PDR package", "Submitted Nov 10", true], ["Requirements", "14 controls with no requirement", false, "Open 14 controls"], ["SCTM workbook", "Current", true], ["Connections", "4 connections with no current agreement", false, "Open 4 connections"], ["Boundary", "1 SCA review to request", false, "Open the boundary"]].map(([a, b, ok, go]) => `<li><span class="ck-ck${ok ? " ok" : ""}">${ok ? ic("check") : ""}</span><b>${esc(a)}</b><span class="ck-muted">${esc(b)}</span><span class="ck-sp"></span>${go ? btn(go, "secondary", null, "sm") : ""}</li>`).join("")}</ul>`, `<span class="ck-meta">${ring(2, 5)} deliverables ready</span>`)}
        </div>
        <div class="ck-stack">
          ${card("Details", `<dl class="ck-dl">${[["System", '<span class="ck-link">SYS-WSX90 · Platform</span>'], ["Host system", '<span class="ck-link">F-16 Block 70</span>'], ["Categorization", "C High · I High · A Moderate"], ["Baseline", '<span class="ck-link">WS-X90 Tailored Security Baseline · 560 controls</span>'], ["Next gate", "PDR · Nov 24"], ["Next date", "Nov 20 · Expanded assessment ends"]].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`)}
          ${card("Team", `<dl class="ck-dl ck-dl-team">${team.map(([k, v]) => `<dt>${k}</dt><dd>${avatar(v)}</dd>`).join("")}</dl>`, `<span class="ck-btn ck-btn-tertiary ck-btn-sm"><span>Manage</span></span>`)}
          ${card("Needs attention", `<div class="ck-tiles">${[["Operational issues", 43], ["Risks without an owner", 40], ["Evidence waiting on review", 88], ["Your tasks", 4]].map(([k, v]) => `<div class="ck-tile"><b>${v}</b><span>${k}</span></div>`).join("")}</div>`)}
        </div>
      </div>`;
    return frame("Overview", main);
  }

  function controls() {
    const rows = [["AC-1", "Policy and Procedures", "", "Partially satisfied", "NIST High", "This system", [17, 17]], ["AC-2", "Account Management", "Implementation not written", "Satisfied", "NIST High", "Hybrid", [26, 26]], ["AC-2(1)", "Automated System Account Management", "", "Satisfied", "NIST High", "Hybrid", [1, 1]], ["AC-2(2)", "Automated Temporary and Emergency Account Management", "", "Satisfied", "NIST High", "This system", [1, 1]], ["AC-2(3)", "Disable Accounts", "", "Satisfied", "NIST High", "Hybrid", [4, 4]], ["AC-2(4)", "Automated Audit Actions", "", "Satisfied", "NIST High", "This system", [5, 5]], ["AC-2(5)", "Inactivity Logout", "", "No evidence", "NIST High", "This system", [0, 1]], ["AC-2(7)", "Privileged User Accounts", "", "Not assessed", "CNSSI 1253", "This system", [4, 4]], ["AC-2(9)", "Restrictions on Use of Shared and Group Accounts", "", "Satisfied", "NIST High", "This system", [2, 2]]];
    const layers = [["NIST SP 800-53 Rev 5 High", "", 370], ["CNSSI 1253", "+201 −17", 554], ["Mission Assurance Overlay", "−5", 549], ["Deployed Platform Overlay", "+1", 550], ["F-16 SPO Tailoring", "−4", 546], ["Program tailoring", "+14", 560]];
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>Controls</h1></div><div class="ck-ph-a">${btn("Export SCTM", "secondary")}</div></div>
      ${tabs([["List", 560], ["Coverage"], ["Workbook"]], "List")}
      <div class="ck-grid ck-grid-2">
        ${card("Completion", `<div class="ck-big"><b>41%</b><span>Controls satisfied · 227 of 560</span></div>${bar(41)}
          <div class="ck-kpis">${[["With a requirement", 546, 98], ["With evidence", 361, 64], ["Assessed", 275, 49]].map(([k, a, p]) => `<div class="ck-kpi"><span class="ck-link">${k}</span><b>${a}<span>/560</span></b>${bar(p)}<span class="ck-muted">${p}%</span></div>`).join("")}</div>`)}
        ${card("Baseline", `<p class="ck-p"><b class="ck-num">560</b> controls, from 6 layers in the order they apply</p><dl class="ck-dl ck-dl-rows">${layers.map(([a, d, n]) => `<dt>${esc(a)}</dt><dd>${d ? muted(d) : ""}<b>${n}</b></dd>`).join("")}</dl>`, btn("Edit baseline", "secondary", null, "sm"))}
      </div>
      ${toolbar("Search controls", ["Family", "Status", "Responsibility", "Owner"], "Add control")}
      ${table([{ t: "Control" }, { t: "Status", w: "180px" }, { t: "Source", w: "130px" }, { t: "Responsibility", w: "140px" }, { t: "Evidence", w: "110px" }, { t: "Owner", w: "170px" }], rows.map(([id, t, note, s, src, resp, ev]) => [`<span class="ck-ctl">${code(id)}<span class="ck-link">${esc(t)}</span>${note ? muted(note) : ""}</span>`, status(s), esc(src), esc(resp), ring(ev[0], ev[1]), avatar("")]), { foot: pager(1, 9, 560) })}`;
    return frame("Controls", main);
  }

  function control() {
    const comps = [["The system as a whole", "Remote privileged access exists on two paths, both bounded. On the maintenance path the Maintenance Access Gateway (LRU-014) admits a privileged command from a Maintenance Laptop (LRU-019) only when the command is on the approved remote-privileged list, the laptop presents a current device attestation, and the session falls inside a scheduled maintenance window…"], ["Mission Computer", "In the system's text"], ["Protected Network Gateway", "In the system's text"], ["Maintenance Access Gateway", "In the system's text"], ["Maintenance Laptop", "In the system's text"]];
    const objs = [["AC-17(04)(a)[01]", "the execution of privileged commands via remote access is authorized only in a format that provides assessable evidence"], ["AC-17(04)(a)[02]", "access to security-relevant information via remote access is authorized only in a format that provides assessable evidence"], ["AC-17(04)(a)[03]", "the execution of privileged commands via remote access is authorized only for the following needs: [needs]"], ["AC-17(04)(b)", "the rationale for remote access is documented in the security plan for the system"]];
    const main = `${crumbs(["Controls", "AC-17(4)"])}
      <div class="ck-ph"><div class="ck-ph-t"><h1>Privileged Commands and Access</h1>${pill("AC-17(4)")}${status("Not assessed")}</div><div class="ck-ph-a">${btn("More", "secondary")}${btn("Open assessment campaign", "primary")}</div></div>
      <div class="ck-pn"><span class="ck-muted">44 of 560 controls</span><span class="ck-btn ck-btn-tertiary ck-btn-sm">${ic("left")}<span>Previous</span></span><span class="ck-btn ck-btn-tertiary ck-btn-sm"><span>Next: AC-17(6)</span>${ic("right")}</span></div>
      <div class="ck-banner">${ic("dot")}<div><b>Expanded control set assessment holds it.</b> 5 of 5 objectives judged, in draft results. Determination: none yet.</div><span class="ck-sp"></span><span class="ck-btn ck-btn-tertiary ck-btn-sm"><span>Open campaign</span></span></div>
      <div class="ck-grid ck-grid-side">
        <div class="ck-stack">
          ${card("Implementation", table([{ t: "Where", w: "26%" }, { t: "Implementation statement" }, { t: "Status", w: "200px" }], comps.map(([a, b], i) => [`<b class="ck-strong">${esc(a)}</b>`, i ? muted(b) : `<span class="ck-clamp">${esc(b)}</span>`, status("Partially implemented")])), `${count(5)}<span class="ck-sp"></span>${btn("Add component", "secondary", "plus", "sm")}`)}
          ${card("Requirements", table([{ t: "Requirement" }, { t: "Allocated to" }, { t: "Evidence", n: true }], [[title2("REQ-470", "Remote privileged maintenance commands pass three admission checks"), "The system", "1"], [title2("REQ-078", "AC Verification Requirement 078"), "The system", "0"]]), `${count(2)}<span class="ck-sp"></span>${btn("Add requirement", "secondary", "plus", "sm")}`)}
          ${card("Objectives", table([{ t: "An assessor determines that" }, { t: "Judged", w: "18%" }], objs.map(([a, b]) => [title2(a, b), status("Not judged")])), count(5))}
        </div>
        <div class="ck-stack">
          ${card("Details", `<dl class="ck-dl">${[["Source", "NIST SP 800-53 Rev 5 High"], ["Responsibility", 'This system <span class="ck-link">Change</span>'], ["Owner", `${avatar("")} <span class="ck-link">Assign</span>`], ["Family", '<span class="ck-link">AC Access Control</span>']].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`)}
          ${card("Evidence", `<div class="ck-mini"><span class="ck-link">Remote privileged command admission test report</span><span class="ck-muted">REQ-470</span>${status("Accepted")}</div>`, `${count(1)}<span class="ck-sp"></span>${btn("Add", "tertiary", "plus", "sm")}`)}
          ${card("Findings and risks", `<div class="ck-mini"><span class="ck-link">Privileged Commands and Access judged partially satisfied</span><span class="ck-muted">Assessment finding · draft results · No plan</span></div>`, `${count(1)}<span class="ck-sp"></span>${btn("Add", "tertiary", "plus", "sm")}`)}
        </div>
      </div>`;
    return frame("Controls", main);
  }

  function evidence() {
    const rows = [["Authorized internal-connection register and switch enforcement state, LRU-009 and LRU-020", "Dataset", "REQ-518", "Nov 15", "Priya Raghavan"], ["Destruction certificates for six retired units, LRU-003 / LRU-015 / LRU-019", "Document", "REQ-435", "Nov 15", "Victor Amsel"], ["Maintenance session teardown verification test report, LRU-014 and LRU-007", "Test record", "REQ-386", "Nov 15", "Joel Barrantes"], ["Pinned toolchain record export, LRU-020 build environment for release 4.2", "Dataset", "REQ-186", "Nov 15", "Joel Barrantes"], ["Protected information location map and location-change log, LRU-001 and LRU-015", "Document", "REQ-592", "Nov 15", "Priya Raghavan"], ["Time source comparison test report, LRU-005 60-second cadence", "Test record", "REQ-248", "Nov 15", "Ingrid Solberg"], ["REQ-127 configuration export, AU-9(3)", "Dataset", "REQ-127", "Nov 14", "Priya Raghavan"], ["REQ-523 configuration export, SC-7(21)", "Dataset", "REQ-523", "Nov 14", "Ingrid Solberg"], ["Clock synchronisation test report, LRU-005 reference against LRU-001 and LRU-012", "Test record", "REQ-247", "Nov 13", "Ingrid Solberg"]];
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>Evidence</h1></div></div>
      ${tabs([["Evidence", 368], ["Sources", 9]], "Evidence")}
      <div class="ck-seg" role="presentation"><span class="on">All 368</span><span>Waiting on review 88</span><span>Accepted 226</span><span>To revise 54</span></div>
      ${toolbar("Search evidence", ["Kind", "Owner"], "Add evidence")}
      ${table([{ t: "Evidence" }, { t: "Kind", w: "120px" }, { t: "Review", w: "180px" }, { t: "Cited by", w: "110px" }, { t: "Collected", w: "110px" }, { t: "Owner", w: "190px" }], rows.map(([a, k, req, d, o]) => [`<span class="ck-link ck-ell">${esc(a)}</span>`, esc(k), status("Waiting on review"), `<span class="ck-link">${req}</span>`, d, avatar(o)]), { foot: pager(1, 9, 368) })}`;
    return frame("Evidence", main);
  }

  function findings() {
    const rows = [["Payload arm and release commands signed under a rotated key cannot be verified (AU-10)", "Critical", "AU-10", "Cryptographic Services Module +2", "Nov 5", "Dec 29", [1, 3], ""], ["Unmet requirement REQ-100", "High", "CM-4", "—", "Sep 6", "Oct 18", [0, 3], ""], ["Unmet requirement REQ-008", "High", "AC-11", "Platform Management Controller +1", "Sep 9", "Oct 6", [0, 3], ""], ["Session-table occupancy missing from the gateway counter export (SC-5(3))", "High", "SC-5(3)", "Protected Network Gateway +1", "Oct 24", "Jan 26", [2, 4], ""], ["Mission data sessions over the tactical radio never presented to monitoring (SI-4(10))", "High", "SI-4(10)", "—", "Nov 1", "Mar 8", [1, 4], ""], ["CVE-2024-6387 in the OpenSSH server (regreSSHion)", "High", "—", "Mission Computer", "Nov 9", "Dec 8", [0, 3], "Ingrid Solberg"], ["V-257789 RHEL 9 must require a unique superuser name", "CAT I", "AC-3", "Mission Computer", "Nov 12", "None", null, ""], ["V-258230 RHEL 9 must enable FIPS mode", "CAT I", "AC-17(2)", "Mission Computer", "Nov 12", "None", null, ""], ["Unmet requirement REQ-024", "Moderate", "CM-2", "Mission Computer +1", "Nov 5", "Sep 8", [0, 3], ""]];
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>Findings</h1></div><div class="ck-ph-a">${btn("Import POA&M", "secondary")}</div></div>
      ${tabs([["All", 174], ["Assessment", 52], ["Operational", 43], ["STIG rules", 75], ["Vulnerabilities", 4]], "All")}
      <div class="ck-chips">${pill("Past due", 27)}${pill("On the POA&M", 48)}${pill("No owner", 173)}</div>
      ${toolbar("Search findings", ["Severity", "Component", "Control"], "Add finding")}
      ${table([{ t: "Finding" }, { t: "Severity", w: "120px" }, { t: "Control", w: "100px" }, { t: "Component", w: "190px" }, { t: "Due", w: "80px" }, { t: "Plan", w: "130px" }, { t: "Owner", w: "170px" }], rows.map(([a, s, c, comp, due, plan, ms, o]) => [`<span class="ck-link ck-ell">${esc(a)}</span>`, status(s), c === "—" ? muted("—") : code(c), comp === "—" ? muted("—") : `<span class="ck-ell">${esc(comp)}</span>`, late(due), plan === "None" ? muted("None") : `<span class="ck-plan">${esc(plan)} ${ms ? ring(ms[0], ms[1]) : ""}</span>`, avatar(o)]), { foot: pager(1, 9, 174) })}`;
    return frame("Findings", main);
  }

  function risks() {
    const rows = [["Payload arm and release records become unverifiable as signing keys rotate", "Critical", "Mitigate", 2, "T1553, T1565", "Nov 2", true], ["A password on its own reaches WS-X90 at the flightline", "Critical", "Mitigate", 2, "T1078, T1110", "Dec 13"], ["Risk arising from REQ-039", "High", "Mitigate", 0, "—", "Oct 2", true], ["Risk arising from REQ-100", "High", "Mitigate", 1, "—", "Oct 6", true], ["The payload interlock's trust basis is asserted and six units identify themselves", "High", "Mitigate", 3, "T1036, T1195", "Nov 15", true], ["Low-rate exhaustion and unattributable egress at the WS-X90 external boundary", "High", "Mitigate", 3, "T1048, T1499", "Nov 22"], ["The mission link is unmonitored and three firmware domains cannot be verified", "High", "Mitigate", 3, "T1040, T1495", "Nov 30"], ["An unsealed service connector leaves a physical route into the maintenance bay", "High", "Mitigate", 1, "T1091, T1200", "Dec 8"], ["Risk arising from REQ-024", "Moderate", "Mitigate", 1, "—", "Dec 5"]];
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>Risks</h1></div><div class="ck-ph-a">${btn("Heat map", "secondary")}</div></div>
      ${tabs([["Register", 40], ["Threats", 31]], "Register")}
      <div class="ck-tiles ck-tiles-row">${[["Critical", 2, "crit"], ["High", 10, "crit"], ["Moderate", 18, "cau"], ["Low", 10, "neu"]].map(([k, v, c]) => `<div class="ck-tile ck-tile-${c}"><b>${v}</b><span>${status(k)}</span></div>`).join("")}<div class="ck-tile"><b>40</b><span>Without an owner</span></div><div class="ck-tile"><b class="ck-late">6</b><span>Response past due</span></div></div>
      ${toolbar("Search risks", ["State", "Severity", "Technique"], "Create risk")}
      ${table([{ t: "Risk" }, { t: "Severity", w: "120px" }, { t: "Response", w: "100px" }, { t: "Findings", n: true, w: "90px" }, { t: "Techniques", w: "130px" }, { t: "Response due", w: "120px" }, { t: "Owner", w: "160px" }], rows.map(([a, s, r, f, t, d, l]) => [`<span class="ck-link ck-ell">${esc(a)}</span>`, status(s), esc(r), f ? String(f) : muted("—"), t === "—" ? muted("—") : `<span class="ck-mono ck-ell">${esc(t)}</span>`, l ? late(d) : esc(d), avatar("")]), { foot: pager(1, 9, 40) })}`;
    return frame("Risks", main);
  }

  const SCREENS = [
    { id: "overview", title: "Program overview", draw: overview, route: "overview", notes: ["The global header and a side panel replace the bare top bar and list: the program's places get icons and the selected one takes the brand tint.", "Status reads as Canvas StatusIndicators (soft fill, strong text, an icon), so 'Passed' and 'In review' never rely on colour alone.", "One primary button per screen (Canvas rule): Open the PDR package. Everything else is Secondary or Tertiary.", "Cards take Canvas's container border, 8px corners and card padding; the attention numbers become tiles."] },
    { id: "controls", title: "Controls register", draw: controls, route: "controls", notes: ["Tabs carry their counts in Canvas count badges.", "The toolbar is one row: search input, an All filter, Selects, then More and the one primary action, all pill-shaped.", "The Canvas Table: raised header row, 1px dividers, roomier rows; Pagination at the foot instead of an endless list.", "Control IDs keep their monospace, in Roboto Mono."] },
    { id: "control", title: "Control record (AC-17(4))", draw: control, route: "control--AC-17(4)", notes: ["Previous and Next become Tertiary buttons with icons.", "The assessment that holds the control is a Canvas info Banner above the content, not a line of body text.", "Each section is a card with its count and its own Add, so the page reads as stacked cards beside a Details card.", "Long implementation text is clamped to four lines in the table; the full text opens on the row."] },
    { id: "evidence", title: "Evidence register", draw: evidence, route: "evidence", notes: ["The review states become a Segmented Control above the table, the quickest filter on this page.", "Owners show as Canvas Avatars with the name beside them.", "Requirement IDs that open a record are Hyperlinks (blue), following Canvas's 'buttons act, hyperlinks navigate'."] },
    { id: "findings", title: "Findings register", draw: findings, route: "findings", notes: ["Sources become tabs (All, Assessment, Operational, STIG rules, Vulnerabilities) instead of a filter menu.", "Saved states (Past due, On the POA&M, No owner) are Canvas Pills with counts.", "Severity uses the critical and caution StatusIndicators with an icon; past-due dates use Canvas's critical text colour."] },
    { id: "risks", title: "Risks register", draw: risks, route: "risks", notes: ["A row of tiles over the table counts risks by severity, without an owner, and past due.", "Technique IDs set in Roboto Mono.", "Create risk stays the one primary action."] },
  ];

  const KIT = [
    ["Type", "Roboto at Canvas's type scale: 28px title, 20px card headings, 14px body in tables, 12px subtext. Today: the prototype's own sans."],
    ["Colour", "Canvas system tokens: blue 600 for primary actions and links, slate for navigation and borders, green, amber and red only in status. Today: black primary buttons."],
    ["Shape", "Buttons, inputs and selects are fully rounded (Canvas shape round); cards and tables take 8px; status and pills 4px."],
    ["Depth", "Canvas depth 1 on cards and depth 2 on the global header, instead of flat borders only."],
    ["Space", "Canvas's 4px unit: 24px card padding, 32px between cards, 40px page margins."],
  ];
  const MAP = [
    ["Page title and actions", "Page header with Breadcrumbs, one PrimaryButton, SecondaryButtons"],
    ["Top bar", "Global header with a search input, IconButton and Avatar"],
    ["Program menu", "Side Panel with navigation items"],
    ["Tabs with counts", "Tabs with Count badges"],
    ["Status chips", "StatusIndicator, low emphasis, with an icon"],
    ["Filter menus", "Select, and a Segmented Control where there are 2 to 5 states"],
    ["Saved views", "Pill with a count"],
    ["Table", "Table, with Pagination at its foot"],
    ["Owner chip", "Avatar"],
    ["Inline notice", "Banner"],
  ];

  function kitSheet() {
    return `<div class="ck-app ck-sheet">
      <div class="ck-sheet-r"><span class="ck-sheet-k">Buttons</span>${btn("Primary", "primary")}${btn("Secondary", "secondary")}${btn("Tertiary", "tertiary")}${btn("Add control", "primary", "plus", "sm")}${btn("Small", "secondary", null, "sm")}${iconBtn("more", "More")}</div>
      <div class="ck-sheet-r"><span class="ck-sheet-k">Status</span>${["Satisfied", "Partially satisfied", "In review", "Not assessed", "High", "Moderate"].map(status).join("")}</div>
      <div class="ck-sheet-r"><span class="ck-sheet-k">Inputs</span>${search("Search controls")}${select("Family")}<span class="ck-seg"><span class="on">All</span><span>Accepted</span><span>To revise</span></span></div>
      <div class="ck-sheet-r"><span class="ck-sheet-k">Pills and people</span>${pill("Past due", 27)}${pill("No owner", 173)}${avatar("Priya Raghavan")}${avatar("")}${ring(2, 5)}</div>
      <div class="ck-sheet-r ck-sheet-tabs"><span class="ck-sheet-k">Tabs</span>${tabs([["List", 560], ["Coverage"], ["Workbook"]], "List")}</div>
    </div>`;
  }

  // ——— The page ———
  const view = {}; // screen id → "ck" or "now"
  function shot(s) {
    const src = `ck/cur-${s.id}.jpg`, alt = `${s.title}, today`;
    return `<button type="button" class="ba-img ckba-now" data-modal="v3b-zoom" data-id="${esc(src)}|${esc(alt)}" aria-label="Enlarge ${esc(alt)}"><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy"></button>`;
  }
  function block(s) {
    const v = view[s.id] || "ck";
    return `<section class="ckba-pair" id="ckba-${s.id}">
      <div class="ba-ph"><div class="ba-ph-t"><h3 tabindex="-1">${esc(s.title)}</h3><div class="facts"><span class="num">${s.notes.length} changes</span></div></div>
        <div class="btns"><div class="ba-switch" role="group" aria-label="Show ${esc(s.title)}">${[["ck", "Canvas Kit"], ["now", "Today"]].map(([k, l]) => `<button type="button" data-ckba-view="${s.id}:${k}" aria-pressed="${k === v}">${l}</button>`).join("")}</div>
        <button type="button" class="btn sm" data-ckba-open="${esc(s.route)}">Open today's screen</button></div></div>
      <div class="ckba-stage">${v === "ck" ? `<div class="ckba-fit" data-ckba-fit>${s.draw()}</div>` : shot(s)}</div>
      <ol class="ckba-notes">${s.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ol>
    </section>`;
  }
  function draw() {
    const tabsHtml = S["before-after"] ? (() => { const t = document.createElement("template"); t.innerHTML = S["before-after"](); const el = t.content.querySelector(".ba-tabs"); if (el) el.querySelectorAll('[role="tab"]').forEach((x) => { const sel = x.dataset.go === ROUTE; x.setAttribute("aria-selected", String(sel)); x.classList.toggle("on", sel); }); return el ? el.outerHTML : ""; })() : "";
    const facts = `<span class="num">${SCREENS.length} screens</span><span>Canvas Kit tokens 4.x</span><span>Mockups only</span>`;
    setTimeout(fit, 0);
    return `<div class="main ba ckba">${header("Before, v1, v2 and V3", facts, "")}${tabsHtml}
      <section class="drba-hero"><h2>Canvas Kit: the same screens, refreshed</h2>
        <p class="ba-lede">What the Vanta flow study would look like if the prototype adopted Workday's <b>Canvas Kit</b>: its type, colour, shape and depth tokens and its components. Each block is one screen with WS-X90's own data. <b>Canvas Kit</b> is the mockup; <b>Today</b> is the screen as it is now, with V3 on.</p>
        <p class="ba-lede drba-small">These are static mockups drawn on this page. Nothing in the prototype changes; Open today's screen takes you to the working one.</p>
        <nav class="drba-jump" aria-label="On this page"><a href="#${ROUTE}" data-ckba-jump="ckba-kit">What changes</a>${SCREENS.map((s) => `<a href="#${ROUTE}" data-ckba-jump="ckba-${s.id}">${esc(s.title)}</a>`).join("")}<a href="#${ROUTE}" data-ckba-jump="ckba-map">Component map</a></nav>
      </section>
      <h3 class="ba-sub" id="ckba-kit">What changes</h3>
      <div class="ckba-kit"><dl class="ckba-dl">${KIT.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>${kitSheet()}</div>
      <h3 class="ba-sub">Screens</h3>
      ${SCREENS.map(block).join("")}
      <h3 class="ba-sub" id="ckba-map">Component map</h3>
      <p class="ba-lede drba-small">Each piece of today's prototype and the Canvas Kit component that would replace it.</p>
      <table class="drba-cov ckba-map"><tbody>${MAP.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</tbody></table>
      <div class="ba-method"><h3>Where this comes from</h3><p>Colours, type, shape, depth and space are Canvas Kit's own tokens (@workday/canvas-tokens-web 4.x, Apache-2.0), resolved into this page by ck/gen-tokens.py. Component choices follow the kit's design-principles guidance in canvas-kit-master (one primary action per view, buttons act and hyperlinks navigate, status never by colour alone). Roboto is bundled from Fontsource (OFL-1.1). The icons are simple strokes drawn for this page, not Canvas's icon set.</p></div>
    </div>`;
  }

  // Zoom each 1440px mockup to the width of its column.
  function fit() {
    document.querySelectorAll("[data-ckba-fit]").forEach((el) => {
      const app = el.firstElementChild; if (!app) return;
      const z = Math.min(1, el.clientWidth / W);
      app.style.zoom = String(z);
    });
  }
  window.addEventListener("resize", fit);
  document.addEventListener("click", (e) => {
    const v = e.target.closest("[data-ckba-view]");
    if (v) {
      e.preventDefault(); const [id, k] = String(v.dataset.ckbaView).split(":"); view[id] = k;
      const s = SCREENS.find((x) => x.id === id), sec = document.getElementById("ckba-" + id);
      if (s && sec) { const t = document.createElement("template"); t.innerHTML = block(s).trim(); sec.replaceWith(t.content.firstElementChild); fit(); }
      return;
    }
    const o = e.target.closest("[data-ckba-open]");
    if (o) {
      e.preventDefault(); const r = o.dataset.ckbaOpen;
      if (PA.v3ba && PA.v3ba.see) PA.v3ba.see({ route: r, prog: "wsx" }); else location.hash = r;
      return;
    }
    const j = e.target.closest("[data-ckba-jump]");
    if (j) { e.preventDefault(); const t = document.getElementById(j.dataset.ckbaJump); if (t) t.scrollIntoView({ block: "start", behavior: "smooth" }); }
  });

  ROUTE_NAV[ROUTE] = "before-after";
  const g = function () { return draw(); }; g.__v2c = true; S[ROUTE] = g;
  // The tab joins the Before & after strip; mod-zz-compare.js puts it first.
  if (PA.BA2 && Array.isArray(PA.BA2.groups) && !PA.BA2.groups.some((x) => x.key === "canvas")) PA.BA2.groups.unshift({ key: "canvas", short: "Canvas Kit", label: "Canvas Kit: a refreshed UI", intro: "" });
  PA.ckba = { count: () => SCREENS.length, screens: SCREENS.map((s) => s.id), draw: (id) => { const s = SCREENS.find((x) => x.id === id); return s ? s.draw() : ""; } };
})();
