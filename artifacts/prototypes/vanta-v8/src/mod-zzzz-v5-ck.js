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
    Supported: ["pos", "check"], Published: ["pos", "check"], Approved: ["pos", "check"], "On schedule": ["pos", "check"],
    "To review": ["cau", "dot"], "Changes requested": ["cau", "edit"], "Due soon": ["cau", "dot"],
    "Other than satisfied": ["crit", "alert"], Overdue: ["crit", "alert"],
    Active: ["info", "dot"], Open: ["info", "dot"],
    "Not claimed": ["neu", "dot"], Planned: ["neu", "dot"], Proposed: ["neu", "dot"], Draft: ["neu", "edit"], "Not ready": ["neu", "dot"],
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
    return `<div class="ck-table-w"><table class="ck-table"><thead><tr>${cols.map((c, i) => `<th${c.n ? ' class="n"' : ""}${c.w ? ` style="width:${c.w}"` : ""}>${i === 0 && o.head ? o.head : esc(c.t)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((v, i) => `<td${cols[i].n ? ' class="n"' : ""}>${v}</td>`).join("")}</tr>`).join("")}</tbody></table>
      ${o.foot ? `<div class="ck-table-f">${o.foot}</div>` : ""}</div>`;
  }
  const pager = (a, b, n) => `<span>${a}–${b} of ${n}</span>${b >= n ? "" : `<span class="ck-pager">${iconBtn("left", "Previous page")}<span class="ck-pg on">1</span><span class="ck-pg">2</span>${Math.ceil(n / (b - a + 1)) > 2 ? `<span class="ck-pg">3</span>` : ""}${Math.ceil(n / (b - a + 1)) > 3 ? `<span class="ck-pg-gap">…</span>` : ""}${iconBtn("right", "Next page")}</span>`}`;
  const toolbar = (ph, filters, primary) => `<div class="ck-toolbar">${search(ph)}<span class="ck-btn ck-btn-tertiary ck-btn-sm">${ic("filter")}<span>All</span>${ic("chev")}</span>${filters.map(select).join("")}<span class="ck-sp"></span>${btn("More", "tertiary", "more", "sm")}${primary ? btn(primary, "primary", "plus", "sm") : ""}</div>`;
  const code = (t) => `<span class="ck-code">${esc(t)}</span>`;
  const muted = (t) => `<span class="ck-muted">${esc(t)}</span>`;
  const late = (t) => `<span class="ck-late">${esc(t)}</span>`;
  const title2 = (a, b) => `<span class="ck-t2"><span class="ck-t2a">${esc(a)}</span>${b ? `<span class="ck-t2b">${esc(b)}</span>` : ""}</span>`;

  // ——— The app frame: Canvas global header, side panel navigation, page header ———
  const NAV = [["Overview", "home"], ["System", "sys"], ["Controls", "shield"], ["Requirements", "list"], ["Evidence", "clip"], ["Documents", "doc"], ["Assessments", "clip2"], ["Findings", "flag"], ["Risks", "alert"], ["Authorization", "award"]];
  // The side panel is the program's by default; the workspace and the product library have their own (kind).
  function frame(on, main, nav, kind) {
    return `<div class="ck-app" style="width:${W}px">
      <header class="ck-top"><span class="ck-menu">${ic("grid")}</span><span class="ck-logo"><b>PA</b><span>Program Assurance</span></span>
        <span class="ck-gsearch">${ic("search")}<span>Search controls, evidence, findings</span><kbd>⌘K</kbd></span>
        <span class="ck-sp"></span>${iconBtn("bell", "Notifications")}<span class="ck-av ck-av-me">IS</span></header>
      <div class="ck-body">
        <nav class="ck-side" aria-label="Program">
          ${kind === "workspace" ? `<div class="ck-side-t">Workspace</div>` : kind === "products" ? `<span class="ck-back">${ic("left")}Workspace</span><div class="ck-side-t">Products</div>` : `<span class="ck-back">${ic("left")}Workspace</span>
          <div class="ck-prog"><div><b>WS-X90</b><span>Sentinel Mission System</span></div>${ic("chev")}</div>
          <div class="ck-prog-m">PRG-1090 · Impact High<br>Increment 2 · TMRR · PDR Nov 24</div>`}
          <div class="ck-side-l">${(nav || NAV).map(([t, i, n]) => `<span class="ck-nav${t === on ? " on" : ""}">${ic(i)}${esc(t)}${n != null ? count(n) : ""}</span>`).join("")}</div>
        </nav>
        <main class="ck-main">${main}</main>
      </div></div>`;
  }

  // ——— The six screens ———
  function overview() {
    const phases = [["MSA", "Materiel solution analysis", 1, 1], ["TMRR", "Technology maturation and risk reduction", 3, 5, true], ["EMD", "Engineering and manufacturing development", 0, 3], ["Test", "Integration, test and production approval", 0, 3], ["Ops", "Production, deployment and operations", 0, 3]];
    const steps = [["SRR · System requirements review", "Engineering review", "Decided Sep 22", "Passed", [2, 2]], ["SFR · System functional review", "Engineering review", "Decided Oct 13", "Passed", [2, 2]], ["Select security controls", "RMF action", "Decided Oct 27", "Completed", [1, 1]], ["PDR · Preliminary design review", "Engineering review", "Due Nov 24 · in 7 days", "In review", [2, 5]], ["AO approval of the RMF strategy", "RMF action", "Due Dec 15", "Not started", null]];
    const team = [["AO", "R. Calloway"], ["AODR", "Lena Marsh"], ["PM/SO", "Ray Colston"], ["Lead assessor", "D. Okafor"], ["Assessor", "Nadia Fournier"], ["ISSM", "Joel Barrantes"], ["ISSO", "Priya Raghavan"], ["ISSE", "Ingrid Solberg"], ["User rep", "Capt. T. Abara"]];
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
    const objs = [["AC-17(04)(a)[01]", "the execution of privileged commands via remote access is authorized only in a format that provides assessable evidence"], ["AC-17(04)(a)[02]", "access to security-relevant information via remote access is authorized only in a format that provides assessable evidence"], ["AC-17(04)(a)[03]", "the execution of privileged commands via remote access is authorized only for the following needs: [needs]"], ["AC-17(04)(a)[04]", "access to security-relevant information via remote access is authorized only for the following needs: [needs]"], ["AC-17(04)(b)", "the rationale for remote access is documented in the security plan for the system"]];
    const main = `${crumbs(["Controls", "AC-17(4)"])}
      <div class="ck-ph"><div class="ck-ph-t"><h1>Privileged Commands and Access</h1>${pill("AC-17(4)")}${status("Not assessed")}</div><div class="ck-ph-a">${btn("More", "secondary")}${btn("Open assessment campaign", "primary")}</div></div>
      <div class="ck-pn"><span class="ck-muted">44 of 560 controls</span><span class="ck-btn ck-btn-tertiary ck-btn-sm">${ic("left")}<span>Previous</span></span><span class="ck-btn ck-btn-tertiary ck-btn-sm"><span>Next: AC-17(6)</span>${ic("right")}</span></div>
      <div class="ck-banner">${ic("dot")}<div><b>Expanded control set assessment holds it.</b> 5 of 5 objectives judged, in draft results. Draft determination: Partially satisfied, which decides nothing until the results are published.</div><span class="ck-sp"></span><span class="ck-btn ck-btn-tertiary ck-btn-sm"><span>Open campaign</span></span></div>
      <div class="ck-grid ck-grid-side">
        <div class="ck-stack">
          ${card("Implementation", table([{ t: "Where", w: "26%" }, { t: "Implementation statement" }, { t: "Status", w: "200px" }], comps.map(([a, b], i) => [`<b class="ck-strong">${esc(a)}</b>`, i ? muted(b) : `<span class="ck-clamp">${esc(b)}</span>`, status("Partially implemented")])), `${count(5)}<span class="ck-sp"></span>${btn("Add component", "secondary", "plus", "sm")}`)}
          ${card("Requirements", table([{ t: "Requirement" }, { t: "Allocated to" }, { t: "Evidence", n: true }], [[title2("REQ-470", "Remote privileged maintenance commands pass three admission checks"), "The system", "1"], [title2("REQ-078", "AC Verification Requirement 078"), "The system", "0"]]), `${count(2)}<span class="ck-sp"></span>${btn("Add requirement", "secondary", "plus", "sm")}`)}
          ${card("Objectives", table([{ t: "An assessor determines that" }, { t: "Judged", w: "22%" }], objs.map(([a, b], i) => [title2(a, b), status(i === 2 ? "Other than satisfied" : "Satisfied")])), `${count(objs.length)}<span class="ck-sp"></span><span class="ck-meta">In draft results</span>`)}
        </div>
        <div class="ck-stack">
          ${card("Details", `<dl class="ck-dl">${[["Source", "NIST SP 800-53 Rev 5 High"], ["Responsibility", 'This system <span class="ck-link">Change</span>'], ["Owner", `${avatar("")} <span class="ck-link">Assign</span>`], ["Family", '<span class="ck-link">AC Access Control</span>']].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`)}
          ${card("Evidence", `<div class="ck-mini"><span class="ck-link">Remote privileged command admission test report</span><span class="ck-muted">REQ-470</span>${status("To revise")}</div>`, `${count(1)}<span class="ck-sp"></span>${btn("Add", "tertiary", "plus", "sm")}`)}
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

  // ——— More screens (version 2 of the tab): registers, records and the workspace ———
  const cb = (on, part) => `<span class="ck-cb${on ? " on" : ""}${part ? " part" : ""}">${on ? ic("check") : part ? '<i></i>' : ""}</span>`;
  const avs = (names) => `<span class="ck-avs">${names.map((n) => `<span class="ck-av" title="${esc(n)}">${esc(n.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase())}</span>`).join("")}</span>`;
  const plus = (n) => (n ? ` <span class="ck-more">+${n}</span>` : "");
  const tiles = (xs, cls) => `<div class="ck-tiles${cls ? " " + cls : ""}">${xs.map(([k, v, tone]) => `<div class="ck-tile${tone ? " ck-tile-" + tone : ""}"><b${tone === "late" ? ' class="ck-late"' : ""}>${v}</b><span>${k}</span></div>`).join("")}</div>`;
  const facts = (xs) => `<dl class="ck-facts">${xs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("")}</dl>`;

  function requirements() {
    const rows = [["REQ-001", "AC Enforcement Requirement 001", "AC-2, AC-7", "Navigation & Timing Subsystem", 1, 1, "Supported", true], ["REQ-002", "AC Verification Requirement 002", "AC-3", "Protected Network Gateway", 1, 1, "Supported", true], ["REQ-003", "AC Configuration Requirement 003", "AC-4", "Platform Management Controller", 2, 1, "Supported"], ["REQ-004", "AC Monitoring Requirement 004", "AC-5", "Navigation & Timing Subsystem", 1, 0, "No evidence"], ["REQ-005", "AC Enforcement Requirement 005", "AC-6", "Mission Computer", 1, 1, "Supported"], ["REQ-006", "AC Verification Requirement 006", "AC-7", "Mission Computer", 2, 1, "Supported"], ["REQ-007", "AC Configuration Requirement 007", "AC-8", "Protected Network Gateway", 0, 1, "Supported"], ["REQ-008", "AC Monitoring Requirement 008", "AC-11, AU-4", "Platform Management Controller", 1, 0, "No evidence"], ["REQ-009", "AC Enforcement Requirement 009", "AC-12", "Mission Computer", 2, 1, "Supported"]];
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>Requirements</h1></div><div class="ck-ph-a">${btn("Import requirements", "secondary")}${btn("Open workbook", "secondary")}</div></div>
      ${tabs([["All", 654], ["Engineering", 640], ["CUSA-SSRD", 14]], "All")}
      <div class="ck-chips"><span class="ck-chip-k">Gaps</span>${pill("No control", 17)}${pill("No evidence", 286)}${pill("Not allocated", 598)}${pill("Mapping to review", 1)}</div>
      ${toolbar("Search requirements", ["Component", "Family", "State"], "Create requirement")}
      <div class="ck-sel-w">${table([{ t: "", w: "52px" }, { t: "Requirement" }, { t: "Controls", w: "130px" }, { t: "Components", w: "290px" }, { t: "Evidence", n: true, w: "100px" }, { t: "State", w: "150px" }, { t: "Owner", w: "160px" }], rows.map(([id, t, c, comp, more, ev, s, on]) => [cb(on), title2(id, t), `<span class="ck-mono">${esc(c)}</span>`, `<span class="ck-ell">${esc(comp)}${plus(more)}</span>`, ev ? String(ev) : muted("—"), status(s), avatar("")]), { foot: pager(1, 9, 654), head: cb(false, true) })}
      <div class="ck-actionbar"><b>2 selected</b><span class="ck-link">Clear</span><span class="ck-sp"></span>${btn("Map control", "secondary", null, "sm")}${btn("Allocate", "secondary", null, "sm")}${btn("Assign owner", "secondary", null, "sm")}</div></div>`;
    return frame("Requirements", main);
  }

  function requirement() {
    const main = `${crumbs(["Requirements", "REQ-470"])}
      <div class="ck-ph"><div class="ck-ph-t"><h1>Remote privileged maintenance commands pass three admission checks</h1>${pill("REQ-470")}${status("To revise")}</div><div class="ck-ph-a">${btn("More", "secondary")}${btn("Edit requirement", "primary")}</div></div>
      <div class="ck-banner ck-banner-cau">${ic("alert")}<div><b>It is allocated to no component.</b> Nobody builds it until a component takes it.</div><span class="ck-sp"></span>${btn("Allocate", "secondary", null, "sm")}</div>
      <div class="ck-grid ck-grid-side">
        <div class="ck-stack">
          ${card("Statement", `<p class="ck-p0 ck-muted">No statement is written yet. The title says what the requirement asks; the statement says how it is verified.</p>`, btn("Write statement", "secondary", "edit", "sm"))}
          ${card("Controls", table([{ t: "Control" }, { t: "Status", w: "170px" }, { t: "", w: "90px" }], [[`<span class="ck-ctl">${code("AC-17(4)")}<span class="ck-link">Privileged Commands and Access</span></span>`, status("Not assessed"), `<span class="ck-link">Unmap</span>`]]), `${count(1)}<span class="ck-sp"></span>${btn("Map control", "secondary", "plus", "sm")}`)}
          ${card("Evidence", table([{ t: "Artifact" }, { t: "Kind", w: "120px" }, { t: "Review", w: "150px" }, { t: "Collected", w: "100px" }], [[`<span class="ck-link ck-ell">Remote privileged command admission test report, approved list, attestation and window checks</span>`, "Test record", status("To revise"), "Nov 10"]]), `${count(1)}<span class="ck-sp"></span>${btn("Link evidence", "secondary", "plus", "sm")}`)}
          ${card("What it leads to", `<div class="ck-list">${[["Operational issue", "Out-of-window remote privileged commands logged and then admitted by the Maintenance Access Gateway", "Low", "Closed"], ["Risk", "Out-of-window privileged maintenance was recorded rather than refused", "Low", "Open"], ["Remediation item", "Block out-of-window privileged commands at the maintenance gateway", "Completed", "Planned Dec 7"]].map(([k, t, s, st]) => `<div class="ck-li"><span class="ck-li-k">${esc(k)}</span><span class="ck-link ck-ell">${esc(t)}</span>${status(s)}<span class="ck-muted ck-li-r">${esc(st)}</span></div>`).join("")}</div>`, count(3))}
        </div>
        <div class="ck-stack">
          ${card("Details", `<dl class="ck-dl">${[["Source", "Engineering requirement"], ["Owner", `${avatar("")} <span class="ck-link">Assign</span>`], ["Controls", "1"], ["Components", '0 <span class="ck-link">Allocate</span>'], ["Evidence", "1 · to revise"], ["Revision", "3 · Nov 10"]].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`)}
          ${card("", `<div class="ck-exp">${ic("right")}<b>Edit history</b><span class="ck-sp"></span>${count(3)}</div><div class="ck-exp">${ic("right")}<b>Comments</b><span class="ck-sp"></span>${count(0)}</div>`, "", "ck-card-tight")}
        </div>
      </div>`;
    return frame("Requirements", main);
  }

  function system() {
    const rows = [[0, "WS-X90 Sentinel Mission System", "CN-109000", "System", "", "31 items", 543, 42, 140, true], [1, "Mission Computing Subsystem", "CN-109001", "Subsystem", "", "6 items", 145, 18, 61, true], [2, "Mission Computer", "CN-109101", "Hardware", "behind", "MC-FW 4.2.1 → 4.3.0 +1", 74, 13, 54], [2, "Secure Boot Controller", "CN-109102", "Hardware", "", "SBC-FW 2.0.7 → 2.1.0", 40, 3, 5], [2, "Cryptographic Services Module", "CN-109103", "Hardware", "", "CSM-FW 3.4.2", 55, 5, 6], [1, "Navigation & Timing Subsystem", "CN-109002", "Subsystem", "", "3 items", 49, 2, 2], [1, "Communications Subsystem", "CN-109003", "Subsystem", "", "5 items", 102, 6, 27, true], [2, "Protected Network Gateway", "CN-109107", "Hardware", "", "PNG-FW 6.0.4 → 6.1.1", 77, 6, 18], [2, "Tactical Data Radio", "CN-109108", "Hardware", "", "TDR-FW 8.2.0 → 8.3.0", 36, 1, 3], [2, "Internal Ethernet Switch", "CN-109109", "Hardware", "", "IES-OS 15.2(7)", 31, 0, 11], [1, "Payload Interface Subsystem", "CN-109004", "Subsystem", "", "3 items", 66, 1, 4], [1, "Ground Support Subsystem", "CN-109006", "Subsystem", "", "8 items", 319, 25, 53]];
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>System</h1>${pill("SYS-WSX90")}</div><div class="ck-ph-a">${btn("Boundary diagram", "secondary")}</div></div>
      ${tabs([["Components", 27], ["Host and providers", 3], ["Connected systems", 8], ["Connections", 18]], "Components")}
      <div class="ck-grid ck-grid-2">
        ${card("Authorization in force", `<div class="ck-row">${status("ATO with conditions")}<span class="ck-muted">until Sep 17, 2029</span></div><p class="ck-p">Increment 1 · Block 1, the six subsystems as fielded</p>${facts([["In the boundary", "27 components"], ["Conditions", '<span class="ck-link">3 open</span>'], ["Signed", "Sep 18, 2026 · R. Calloway"]])}`)}
        ${card("Needs attention", tiles([["Behind its library version", 1], ["Provider with no authorization", 1], ["Connections without an agreement", 4, "late"]], "ck-tiles-3"))}
      </div>
      ${toolbar("Search components", ["Subsystem", "Kind", "Library"], "Add component")}
      ${table([{ t: "Component" }, { t: "Kind", w: "110px" }, { t: "Library", w: "160px" }, { t: "Software & firmware", w: "230px" }, { t: "Controls", n: true, w: "100px" }, { t: "Requirements", n: true, w: "130px" }, { t: "Findings", n: true, w: "100px" }], rows.map(([lv, t, c, k, lib, sw, ctl, req, f, open]) => [`<span class="ck-tree" style="padding-left:${lv * 24}px">${lv < 2 ? `<span class="ck-tw${open ? " open" : ""}">${ic(open ? "chev" : "right")}</span>` : '<span class="ck-tw"></span>'}<span class="ck-t2 ck-tree-n"><span class="${lv < 2 ? "ck-strong" : "ck-link"} ck-ell">${esc(t)}</span><span class="ck-code ck-t2b">${esc(c)}</span></span></span>`, esc(k), lib === "behind" ? `<span class="ck-si ck-si-cau">${ic("alert")}1 version behind</span>` : lib === "current" ? `<span class="ck-si ck-si-pos">${ic("check")}Current</span>` : muted("—"), `<span class="ck-mono ck-ell">${esc(sw)}</span>`, String(ctl), req ? String(req) : muted("0"), f ? String(f) : muted("0")]), { foot: pager(1, 12, 27) })}`;
    return frame("System", main);
  }

  const PNAV = [["Products", "grid"], ["Components", "sys"], ["Suppliers", "user"]];
  function component() {
    const used = [["X800 Missile", "GS-MC · Product", "Product", "Version 1 · behind", "—"], ["WS-X90 Sentinel Mission System", "LRU-001 · PRG-1090", "50 of 54", "Version 1 · behind", "Not reminded yet"], ["Customer A · X800 Rail Integration", "CA-GS-MC · PRG-2101", "53 of 54", "Version 1 · behind", "Not reminded yet"], ["Customer B · X800 Palletized Integration", "CB-GS-MC · PRG-2102", "54 of 54", "Version 1 · behind", "Not reminded yet"]];
    const main = `${crumbs(["Components", "Mission Computer"])}
      <div class="ck-ph"><div class="ck-ph-t"><h1>Mission Computer</h1>${status("Published")}</div><div class="ck-ph-a">${select("Version 2")}${btn("Create task", "secondary")}${btn("Review offer", "primary")}</div></div>
      ${facts([["Owner", avatar("Priya Raghavan")], ["Version", "2 · Nov 12"], ["Business line", "Air Defense"], ["Component set", '<span class="ck-link">X800 Missile component set</span>'], ["Reassess", "Yearly"]])}
      ${tabs([["Overview"], ["Assessment", 61], ["Where used", 4], ["Findings", 1], ["SBOM", 13], ["Versions", 2]], "Overview")}
      <div class="ck-grid ck-grid-side">
        <div class="ck-stack">
          ${card("What changed in version 2", `<p class="ck-prose">The maintenance image carries OpenSSH server 9.8p1 in place of 9.6p1, which fixes CVE-2024-6387 (regreSSHion). Nothing else in the image changes.</p>
            <div class="ck-list">${[["AC-17(2)", "Protection of Confidentiality and Integrity Using Encryption", "To review"], ["SC-23", "Session Authenticity", "To review"], ["RA-5", "Vulnerability Monitoring and Scanning", "Not claimed"], ["SI-2", "Flaw Remediation", "Not claimed"]].map(([c, t, s]) => `<div class="ck-li">${code(c)}<span class="ck-ell">${esc(t)}</span>${status(s)}</div>`).join("")}</div>`, pill("Software"))}
          ${card("Where used", table([{ t: "Consumer" }, { t: "Controls inherited", w: "150px" }, { t: "Version", w: "170px" }, { t: "Reminder", w: "150px" }], used.map(([a, b, c, v, r]) => [title2(a, b), esc(c), `<span class="ck-si ck-si-cau">${ic("alert")}${esc(v)}</span>`, r === "—" ? muted("—") : muted(r)])), `${count(4)}<span class="ck-sp"></span>${btn("Send reminder", "secondary", "bell", "sm")}`)}
        </div>
        <div class="ck-stack">
          ${card("Details", `<dl class="ck-dl">${[["Version", "2 · published Nov 12"], ["Previous", "1 · assessed Sep 30"], ["Assessor", avatar("Elena Vasquez")], ["Determinations", "52 carried · 2 to review"], ["SBOM", "CycloneDX 1.5 · 13 components"], ["Open CVEs", '0 on version 2 · <span class="ck-late">1 on version 1</span>']].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`)}
          ${card("Controls", `<div class="ck-list ck-list-n">${[["Satisfied", 42], ["Partially satisfied", 6], ["Other than satisfied", 4], ["Not assessed", 7], ["To review", 2]].map(([s, n]) => `<div class="ck-li">${status(s)}<span class="ck-sp"></span><b>${n}</b></div>`).join("")}</div>`, count(61))}
          ${card("Offer waiting", `<div class="ck-hl"><b>CVE-2024-6387 · high, 8.1</b><span>Offered by Ingrid Solberg from LRU-001. Accepting opens an issue in Customer A and Customer B.</span></div>`, "")}
        </div>
      </div>`;
    return frame("Components", main, PNAV, "products");
  }

  function assessments() {
    const rows = [["Expanded control set assessment", "Control assessment", "Active", "Sep 14 – Nov 20", [56, 81], "35", "D. Okafor"], ["Continuous monitoring FY2027", "Control assessment", "Active", "Oct 1 – Sep 30, 2027", [0, 10], "—", "D. Okafor"], ["Initial authorization assessment", "Control assessment", "Completed", "Aug 3 – Aug 21", null, "17", "D. Okafor"], ["Cooperative vulnerability identification — FY2027", "Cyber test", "Planned", "Jan 11 – Feb 5, 2027", null, "—", "Ingrid Solberg"], ["Adversarial cybersecurity DT&E — FY2027", "Cyber test", "Proposed", "Jun 8 – Jul 3, 2027", null, "—", "Wes Duarte"], ["ACAS vulnerability scan, mission network", "Monitoring check", "Overdue", "Monthly · next Nov 15", "2 runs", "4", "Joel Barrantes"], ["STIG compliance scan", "Monitoring check", "Overdue", "Monthly · next Nov 11", "2 runs", "75", "Joel Barrantes"], ["POA&M review", "Monitoring check", "Due soon", "Monthly · next Nov 21", "2 runs", "—", "Priya Raghavan"], ["Audit log review sampling", "Monitoring check", "On schedule", "Quarterly · next Dec 23", "1 run", "—", "Nadia Fournier"]];
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>Assessments</h1></div><div class="ck-ph-a">${btn("Calendar", "secondary")}</div></div>
      <div class="ck-grid ck-grid-2">
        ${card("Under way", `<div class="ck-big"><b>69%</b><span>Objectives judged · 56 of 81 objectives</span></div>${bar(69)}<p class="ck-muted ck-p0">2 active control assessments</p>`)}
        ${card("Needs attention", tiles([["Results waiting to be published", 1], ["Monitoring checks overdue", 3, "late"], ["Windows ending within two weeks", 1]], "ck-tiles-3"))}
      </div>
      <div class="ck-seg" role="presentation"><span class="on">All 19</span><span>Control assessments 3</span><span>Cyber tests 4</span><span>Monitoring checks 12</span></div>
      ${toolbar("Search assessments", ["Status", "Needs", "Lead"], "Plan an assessment")}
      ${table([{ t: "Assessment" }, { t: "Kind", w: "150px" }, { t: "Status", w: "130px" }, { t: "Window or cadence", w: "180px" }, { t: "Progress", w: "100px" }, { t: "Findings", n: true, w: "90px" }, { t: "Lead", w: "160px" }], rows.map(([a, k, s, w, p, f, l]) => [`<span class="ck-link ck-ell">${esc(a)}</span>`, esc(k), status(s), s === "Overdue" ? late(w) : esc(w), Array.isArray(p) ? ring(p[0], p[1]) : p ? esc(p) : muted("—"), f === "—" ? muted("—") : f, avatar(l)]), { foot: pager(1, 9, 19) })}`;
    return frame("Assessments", main);
  }

  function documents() {
    const rows = [["SSP", "System security plan", "For Increment 2 · Block 1.1 · revision 2 is published", "3", "Draft", "Priya Raghavan", ["Priya Raghavan", "Marcus Ryde"], "10:42 AM"], ["CP", "Contingency plan", "Implements CP-2 · version 3 in review", "4", "Draft", "Amara Bell", ["Amara Bell"], "9:48 AM"], ["IRP", "Incident response plan", "Implements IR-8 · version 2 approved", "4", "Changes requested", "Priya Raghavan", ["Priya Raghavan"], "8:40 AM"], ["CMP", "Configuration management plan", "Implements CM-9 · version 1.4 approved", "5", "Draft", "Ingrid Solberg", ["Marcus Ryde"], "10:05 AM"], ["AC-1", "Access control policy", "Renew by Mar 18", "3.2", "Changes requested", "Wes Duarte", [], "—"], ["AT-1", "Awareness and training policy", "No document yet", "—", "Not started", "", [], "—"], ["AU-1", "Audit and accountability policy", "Renew by Mar 15", "4.2", "Changes requested", "", [], "—"], ["CA-1", "Assessment, authorization and monitoring policy", "Renew by Apr 8", "2.4", "Approved", "", [], "—"]];
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>Documents</h1></div></div>
      ${tiles([["Placeholder narratives in the SSP", 74], ["Changes requested", 9], ["In review, waiting on an approver", 1], ["Policies not started", 6], ["Agreements expired", 2, "late"]], "ck-tiles-row ck-tiles-5")}
      ${tabs([["All", 30], ["Plans", 4], ["Policies", 18], ["Categorization", 1], ["Agreements", 7]], "All")}
      ${toolbar("Search documents", ["State", "Owner"], "New document")}
      ${table([{ t: "Document" }, { t: "Revision", w: "100px" }, { t: "State", w: "190px" }, { t: "Owner", w: "180px" }, { t: "Editing now", w: "130px" }, { t: "Last edited", w: "120px" }, { t: "", w: "64px" }], rows.map(([c, t, sub, r, s, o, ed, at]) => [`<span class="ck-doc"><span class="ck-doc-c">${esc(c)}</span>${title2(t, sub)}</span>`, r === "—" ? muted("—") : r, status(s), avatar(o), ed.length ? `<span class="ck-live">${avs(ed)}</span>` : muted("—"), at === "—" ? muted("—") : at, iconBtn("more", "Actions")]), { foot: pager(1, 8, 30) })}`;
    return frame("Documents", main);
  }

  function authorization() {
    const parts = [["System security plan", "Revision 3, Increment 2", "A draft", "SSP"], ["Security assessment report", "3 control assessments", "1 assessment with results in draft", "SAR"], ["Plan of action and milestones", "48 findings with a plan", "12 plans past the planned date", "POA&M"], ["Risk assessment", "40 open risks", "40 risks without an owner", "Risk assessment"]];
    const conds = [["Complete the expanded control set assessment", "The campaign ends Nov 20", "D. Okafor", "Nov 20"], ["Close the high-severity remediation items within 90 days", "11 high issues open", "Priya Raghavan", "Dec 17"], ["Report the SA-24 design review at the annual authorization review", "Annual review", "Ingrid Solberg", "Sep 18, 2027"]];
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>Authorization</h1>${status("ATO with conditions")}</div><div class="ck-ph-a">${btn("More", "secondary")}${btn("Open the SSP", "primary")}</div></div>
      <p class="ck-muted ck-sub">In force since Sep 18, 2026, signed by R. Calloway · ends Sep 17, 2029 · Increment 1 · Block 1, the six subsystems as fielded</p>
      ${tabs([["Package"], ["Decisions", 4], ["Conditions", 3], ["Monitoring"], ["Sharing", 7]], "Package")}
      <div class="ck-grid ck-grid-side">
        <div class="ck-stack">
          ${card("Package readiness", `<div class="ck-steps">${parts.map(([, , , a], i) => `<div class="ck-step${i === 0 ? " on" : ""}"><span class="ck-step-n">${i + 1}</span><span>${esc(a)}</span></div>`).join('<span class="ck-step-l"></span>')}</div>
            <div class="ck-banner">${ic("dot")}<div><b>Next step:</b> 0 of 4 parts are ready. The system security plan is a draft.</div></div>`, `<span class="ck-meta">${ring(0, 4)} parts ready</span>`)}
          ${card("What the package holds", table([{ t: "Part" }, { t: "Holds", w: "200px" }, { t: "Ready", w: "125px" }, { t: "State", w: "250px" }], parts.map(([a, b, c]) => [`<b class="ck-strong">${esc(a)}</b>`, esc(b), status("Not ready"), muted(c)])), count(4))}
          ${card("Conditions", table([{ t: "Condition" }, { t: "Owner", w: "170px" }, { t: "Due", w: "120px" }, { t: "State", w: "100px" }], conds.map(([a, b, o, d]) => [title2(a, b), avatar(o), esc(d), status("Open")])), `${count(3)}<span class="ck-sp"></span>${btn("Add condition", "secondary", "plus", "sm")}`)}
        </div>
        <div class="ck-stack">
          ${card("Decision in force", `<dl class="ck-dl">${[["Decision", "ATO with conditions"], ["Signed", "Sep 18, 2026"], ["By", avatar("R. Calloway")], ["Ends", "Sep 17, 2029"], ["Covers", "Increment 1 · Block 1, the six subsystems as fielded"], ["Conditions", '<span class="ck-link">3 open</span>']].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`)}
          ${card("Shared with", `<div class="ck-list">${[["R. Calloway", "Authorizing official"], ["D. Okafor", "Lead assessor"], ["Joel Barrantes", "ISSM"]].map(([n, r]) => `<div class="ck-li">${avatar(n)}<span class="ck-sp"></span><span class="ck-muted">${esc(r)}</span></div>`).join("")}<div class="ck-li"><span class="ck-link">View all 7</span></div></div>`, `${count(7)}<span class="ck-sp"></span>${btn("Share", "tertiary", "plus", "sm")}`)}
        </div>
      </div>`;
    return frame("Authorization", main);
  }

  const WNAV = [["Home", "home"], ["My work", "check", 21], ["Review queue", "list", 32], ["Programs", "shield"], ["Products", "grid"], ["Library", "doc"], ["AI agents", "dot"]];
  function mywork() {
    const group = (icon, tone, t, n, items, open) => `<section class="ck-grp"><div class="ck-grp-h">${ic(open ? "chev" : "right")}<span class="ck-grp-i ck-grp-${tone}">${ic(icon)}</span><b>${esc(t)}</b>${count(n)}</div>${open ? `<div class="ck-grp-b">${items.map(([a, b, who, k]) => `<div class="ck-task">${cb(false)}<span class="ck-task-t"><span class="ck-strong">${esc(a)}</span><span class="ck-muted">${esc(b)}</span></span>${k ? `<span class="ck-pill">${esc(k)}</span>` : ""}${who === "-" ? avatar("") : avatar(who)}</div>`).join("")}${n > items.length ? `<div class="ck-task"><span class="ck-link">Show ${n - items.length} more</span></div>` : ""}</div>` : ""}</section>`;
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>My work</h1></div><div class="ck-ph-a">${select("Type")}</div></div>
      <div class="ck-seg" role="presentation"><span class="on">All 21</span><span>Assigned to me 4</span><span>Needs my approval 8</span><span>Waiting on others 2</span></div>
      <div class="ck-card ck-card-flush">
        ${group("alert", "crit", "Urgent", 3, [["Remediate CVE-2024-6387 on the Mission Computer", "WSX-409 · High · due Nov 9 · 8 days late", "Ingrid Solberg", "Task"], ["Resolve 17 operational issues past their remediation date", "1 critical · 9 high · 7 moderate", "-", "Findings"], ["Treat 2 critical risks", "A password alone reaches WS-X90 · unverifiable arm and release records", "-", "Risks"]], true)}
        ${group("dot", "info", "Needs my approval", 8, [["Narrative drafter: 10 implementation narratives for AC in SSP 3", "AI agent run · started by you · Today 9:12 · 10 narratives waiting", "Ingrid Solberg", "AI run"], ["Evidence mapper: Link 6 artifacts to 11 controls", "AI agent run · started by Priya Raghavan · Today 8:40 · 11 links waiting", "Priya Raghavan", "AI run"], ["POA&M milestone writer: Milestones for 3 POA&M items", "AI agent run · started by Joel Barrantes · Today 8:02 · 9 milestones waiting", "Joel Barrantes", "AI run"], ["Package access: Cooperative vulnerability identification test lead", "Asked Nov 16 · wants SSP and POA&M · Planning the Jan 11 event", "Ingrid Solberg", "Access"]], true)}
        ${group("award", "cau", "Conditions to close", 3, [], false)}
        ${group("flag", "neu", "Due for PDR · Nov 24", 3, [], false)}
        ${group("dot", "neu", "Coming soon", 4, [], false)}
      </div><div class="ck-pad-toast"></div>
      <div class="ck-toast">${ic("check")}<div><b>Narrative drafter run approved</b><span>10 narratives saved to SSP revision 3.</span></div><span class="ck-link">Undo</span></div>`;
    return frame("My work", main, WNAV, "workspace");
  }

  function reviewq() {
    const rows = [["PDR · Preliminary design review · Increment 2", "Gate to decide", "WS-X90", "Marcus Ryde", "Nov 10 · 7d", "Ray Colston"], ["Customer B security plan approval package · version 1", "Package to decide", "Customer B · X800 Palletized", "", "Nov 3 · 14d", "Joel Barrantes"], ["Sanitisation and contamination-trace procedure, LRU-015 region clearing", "Evidence to accept", "WS-X90", "Nadia Fournier", "Nov 12 · 5d", "Ingrid Solberg"], ["Account-issue gate configuration export, LRU-017 to LRU-013", "Evidence to accept", "WS-X90", "Nadia Fournier", "Nov 13 · 4d", "Wes Duarte"], ["Approved portable-storage registry export, LRU-020 revision 11", "Evidence to accept", "WS-X90", "Nadia Fournier", "Nov 13 · 4d", "Joel Barrantes"], ["Flight program function list, customer build", "Evidence to accept", "Customer A · X800 Rail", "Elena Vasquez", "Nov 13 · 4d", "Nadia Fournier"], ["Paragraph as received", "Discussion to resolve", "Customer B · X800 Palletized", "", "Nov 13 · 4d", "Local developer"], ["System Requirements Review", "Gate to decide", "Legacy billing gateway", "", "Sep 12 · 66d", ""]];
    const KIND = { "Gate to decide": "award", "Package to decide": "doc", "Evidence to accept": "clip", "Discussion to resolve": "list" };
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>Review queue</h1></div></div>
      ${tabs([["All", 32], ["Needs my approval", 8]], "All")}
      <div class="ck-toolbar">${search("Search the queue")}${["Kind", "Program", "Waiting on", "Waiting longer than"].map(select).join("")}${btn("Add filter", "tertiary", "plus", "sm")}<span class="ck-sp"></span>${iconBtn("filter", "Columns")}</div>
      ${table([{ t: "Record" }, { t: "Kind", w: "190px" }, { t: "Program", w: "220px" }, { t: "Waiting on", w: "170px" }, { t: "Waiting since", w: "130px" }, { t: "Requested by", w: "170px" }], rows.map(([a, k, p, w, s, r]) => [`<span class="ck-link ck-ell">${esc(a)}</span>`, `<span class="ck-kind">${ic(KIND[k])}${esc(k)}</span>`, `<span class="ck-ell">${esc(p)}</span>`, w ? avatar(w) : muted("Anyone"), /66d/.test(s) ? late(s) : esc(s), r ? avatar(r) : muted("—")]), { foot: pager(1, 8, 32) })}`;
    return frame("Review queue", main, WNAV, "workspace");
  }

  // ——— The component gallery: the Canvas Kit parts these screens would use, each drawn in place ———
  Object.assign(P, {
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    trash: '<path d="M5 7h14M9 7V4.5h6V7M7 7l1 13h8l1-13"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8h.01"/>',
    cal: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  });
  const field = (label, ctl, o) => { const x = o || {}; return `<div class="ck-field${x.err ? " err" : ""}"><label>${esc(label)}${x.req ? '<span class="ck-req">*</span>' : ""}</label>${ctl}${x.hint ? `<span class="ck-hint">${x.err ? ic("alert") : ""}${esc(x.hint)}</span>` : ""}</div>`; };
  const tinput = (v, o) => `<span class="ck-input ck-tin${o && o.err ? " err" : ""}${o && o.focus ? " focus" : ""}">${v ? esc(v) : `<span class="ck-muted">${esc((o && o.ph) || "")}</span>`}${o && o.icon ? ic(o.icon) : ""}</span>`;
  const radio = (t, on) => `<span class="ck-opt"><span class="ck-rd${on ? " on" : ""}"></span>${esc(t)}</span>`;
  const check = (t, on, part) => `<span class="ck-opt">${cb(on, part)}${esc(t)}</span>`;
  const sw = (t, on) => `<span class="ck-opt"><span class="ck-sw${on ? " on" : ""}"><i></i></span>${esc(t)}</span>`;
  const menu = (items) => `<div class="ck-menu-p">${items.map((x) => (x === "-" ? '<hr>' : `<span class="ck-mi${x[2] ? " " + x[2] : ""}">${x[1] ? ic(x[1]) : '<span class="ck-ic"></span>'}${esc(x[0])}</span>`)).join("")}</div>`;
  const gc = (name, line, body) => `<section class="ck-gc"><div class="ck-gc-h"><b>${esc(name)}</b><span>${esc(line)}</span></div><div class="ck-gc-b">${body}</div></section>`;
  const GALLERY = [
    ["Buttons", "PrimaryButton, SecondaryButton, TertiaryButton, DeleteButton", `<div class="ck-wrap">${btn("Plan an assessment", "primary")}${btn("Export SCTM", "secondary")}${btn("Open campaign", "tertiary")}<span class="ck-btn ck-btn-delete"><span>Delete draft</span></span></div><div class="ck-wrap">${btn("Add control", "primary", "plus", "sm")}${btn("Send reminder", "secondary", "bell", "sm")}<span class="ck-btn ck-btn-secondary ck-btn-sm ck-dis"><span>Publish</span></span>${iconBtn("more", "More")}${iconBtn("edit", "Edit")}</div>`],
    ["Text input", "FormField with TextInput: label, hint and error", `${field("Title", tinput("Expanded control set assessment", { focus: true }), { req: true })}${field("Due date", tinput("", { ph: "MM/DD/YYYY", icon: "cal" }), { hint: "A calendar day, in your time zone." })}${field("Owner", tinput("", { err: true, ph: "Choose a person", icon: "chev" }), { req: true, err: true, hint: "Choose an owner before you assign." })}`],
    ["Text area", "FormField with TextArea and a character count", `${field("Rationale", `<span class="ck-input ck-ta">Required where the determination is short of satisfied: the gateway logs out-of-window commands but still admits them.</span>`, { req: true })}<span class="ck-hint ck-hint-r">118 / 500</span>`],
    ["Select", "Select, open, with its listbox", `${field("Status", `<span class="ck-select ck-select-open">Partially satisfied${ic("chev")}</span>`)}${menu([["Satisfied"], ["Partially satisfied", "check", "on"], ["Other than satisfied"], ["Not assessed"]])}`],
    ["Choices", "Checkbox, RadioGroup and Switch", `<div class="ck-cols"><div class="ck-col"><b class="ck-gl">Kinds</b>${check("Control assessments", true)}${check("Cyber tests", false)}${check("Monitoring checks", false, true)}</div><div class="ck-col"><b class="ck-gl">Objectives</b>${radio("Whole control", true)}${radio("Chosen objectives", false)}</div></div><div class="ck-col">${sw("Show controls not in the baseline", true)}${sw("Email me when results publish", false)}</div>`],
    ["Segmented control", "SegmentedControl for 2 to 5 states", `<div class="ck-seg"><span class="on">Families</span><span>List</span></div><div class="ck-seg"><span class="on">All 368</span><span>Waiting 88</span><span>Accepted 226</span></div>`],
    ["Pills", "Pill: read-only, removable, with an avatar, with a count", `<div class="ck-wrap">${pill("REQ-470")}<span class="ck-pill ck-pill-rm">Severity: High${ic("x")}</span><span class="ck-pill ck-pill-rm">Owner: none${ic("x")}</span><span class="ck-pill"><span class="ck-av ck-av-xs">PR</span>Priya Raghavan</span>${pill("Past due", 27)}${count(560)}</div>`],
    ["Status indicators", "StatusIndicator, low and high emphasis, with icons", `<div class="ck-wrap">${["Satisfied", "Partially satisfied", "Other than satisfied", "Not assessed", "In review"].map(status).join("")}</div><div class="ck-wrap">${[["pos", "check", "Satisfied"], ["cau", "dot", "Partially satisfied"], ["crit", "alert", "Critical"], ["info", "dot", "Active"], ["neu", "dot", "Draft"]].map(([k, i, t]) => `<span class="ck-si ck-si-hi ck-si-hi-${k}">${ic(i)}${esc(t)}</span>`).join("")}</div>`],
    ["Banners", "Banner: info, caution and error, with an action", `<div class="ck-banner">${ic("dot")}<div><b>Expanded control set assessment holds it.</b> Results in draft.</div><span class="ck-sp"></span><span class="ck-link">Open</span></div><div class="ck-banner ck-banner-cau">${ic("alert")}<div><b>Version 2 is published.</b> This program is on version 1.</div><span class="ck-sp"></span><span class="ck-link">Take version 2</span></div><div class="ck-banner ck-banner-err">${ic("alert")}<div><b>3 errors.</b> Fix them before you save.</div><span class="ck-sp"></span><span class="ck-link">View all</span></div>`],
    ["Toast", "Toast after an action, with Undo", `<div class="ck-toast ck-toast-in">${ic("check")}<div><b>26 objectives of AC-2 added</b><span>To Continuous monitoring FY2027.</span></div><span class="ck-link">Undo</span>${iconBtn("x", "Close")}</div><div class="ck-toast ck-toast-in ck-toast-err">${ic("alert")}<div><b>Could not publish the results</b><span>Another session changed them since you opened them.</span></div><span class="ck-link">Reload</span></div>`],
    ["Modal", "Modal with a heading, fields, Cancel and the one primary", `<div class="ck-scrim"><div class="ck-modal"><div class="ck-modal-h"><b>Plan an assessment</b>${iconBtn("x", "Close")}</div><p class="ck-muted ck-p0">Plans AC-2's 26 assessment objectives.</p>${field("Title", tinput("AC-2 assessment"), { req: true })}${field("SSP", `<span class="ck-select">SSP revision 2 · WS-X90${ic("chev")}</span>`)}<div class="ck-modal-f">${btn("Cancel", "secondary")}${btn("Plan an assessment", "primary")}</div></div></div>`],
    ["Menu", "Popup menu of actions, the destructive one last", `<div class="ck-wrap ck-top-a">${btn("Actions", "secondary", null)}</div>${menu([["Edit control implementation", "edit"], ["Copy link", "copy"], ["Add to assessment campaign", "plus"], "-", ["Inspect record", "info"], ["Remove from baseline", "trash", "danger"]])}`],
    ["Tooltip", "Tooltip on an icon button, on hover and focus", `<div class="ck-tip-w">${iconBtn("info", "About Objectives mapped")}<span class="ck-tip">Objectives a requirement maps on every system that selects the control</span></div>`],
    ["Expandable", "Expandable sections for provenance and history", `<div class="ck-exp-c"><div class="ck-exp open">${ic("chev")}<b>Where the baseline comes from</b></div><p class="ck-muted ck-p0 ck-exp-body">NIST SP 800-53 Rev 5 High, then CNSSI 1253 and two overlays, then the F-16 SPO and program tailoring.</p><div class="ck-exp">${ic("right")}<b>Edit history</b><span class="ck-sp"></span>${count(3)}</div></div>`],
    ["Information highlight", "InformationHighlight for a fact that needs a second look", `<div class="ck-hl"><b>CVE-2024-6387 · high, 8.1</b><span>Open on version 1: 3 programs use it, 2 hold no issue for it yet.</span><span class="ck-link">Open findings</span></div>`],
    ["Loading", "LoadingDots and Skeleton while a register loads", `<span class="ck-dots"><i></i><i></i><i></i></span><div class="ck-skel"><i style="width:62%"></i><i style="width:88%"></i><i style="width:74%"></i><i style="width:40%"></i></div>`],
    ["Avatars", "Avatar in sizes, and a group", `<div class="ck-wrap"><span class="ck-av ck-av-xs">PR</span><span class="ck-av">PR</span><span class="ck-av ck-av-me">PR</span><span class="ck-av ck-av-lg">PR</span>${avs(["Priya Raghavan", "Marcus Ryde", "Ingrid Solberg", "Joel Barrantes"])}<span class="ck-more">+3</span></div>`],
    ["Action bar", "ActionBar while rows are chosen", `<div class="ck-actionbar ck-actionbar-in"><b>2 selected</b><span class="ck-link">Clear</span><span class="ck-sp"></span>${btn("Allocate", "secondary", null, "sm")}${btn("Assign owner", "primary", null, "sm")}</div>`],
    ["Breadcrumbs and pagination", "Breadcrumbs above a title; Pagination at a table's foot", `${crumbs(["Programs", "WS-X90", "Controls", "AC-17(4)"])}<div class="ck-table-f ck-flat">${pager(1, 25, 560)}</div>`],
  ];
  GALLERY.push(
    ["Count badges", "CountBadge on navigation items and tabs", `<div class="ck-side-l ck-gal-nav">${[["My work", "check", 21, true], ["Review queue", "list", 32], ["Programs", "shield"]].map(([t, i, n, on]) => `<span class="ck-nav${on ? " on" : ""}">${ic(i)}${esc(t)}${n != null ? count(n) : ""}</span>`).join("")}</div>${tabs([["All", 174], ["Assessment", 52]], "All")}`],
    ["Theme", "The brand palette through the tokens: Canvas blue, then indigo", `<div class="ck-wrap">${btn("Plan an assessment", "primary")}${tabs([["Plan"], ["Objectives", 81]], "Objectives")}</div><div class="ck-wrap ck-theme-indigo">${btn("Plan an assessment", "primary")}${tabs([["Plan"], ["Objectives", 81]], "Objectives")}</div>`],
    ["Combobox", "Combobox: type to filter, the match highlighted", `${field("Owner", `<span class="ck-input ck-tin focus">pri<span class="ck-caret"></span>${ic("chev")}</span>`)}<div class="ck-lb"><span class="ck-opt-r hl"><span class="ck-av ck-av-xs">PR</span><span class="ck-t2"><span><mark>Pri</mark>ya Raghavan</span><span class="ck-t2b">ISSO · WS-X90</span></span></span><span class="ck-opt-r"><span class="ck-av ck-av-xs">PI</span><span class="ck-t2"><span><mark>Pri</mark>me Integration Services</span><span class="ck-t2b">Organization</span></span></span></div>`],
  );
  const gallery = () => `<div class="ck-app ck-gal">${GALLERY.map(([n, l, b]) => gc(n, l, b)).join("")}</div>`;

  // ——— Version 3: the rest of the study's screens ———
  Object.assign(P, {
    undo: '<path d="M9 7 4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 12"/>',
    hist: '<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4h4M12 8v4.5l3 2"/>',
    share: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5"/>',
    spark: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    table: '<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M4 10h16M10 10v9"/>',
    freeze: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 9h16M9 4v16"/>',
    sort: '<path d="M8 5v14M5 16l3 3 3-3M16 19V5M13 8l3-3 3 3"/>',
  });
  // A full-screen working surface (document editor, workbook): its own header bar takes the global header's place.
  const surface = (back, title, meta, actions, body) => `<div class="ck-app ck-surf" style="width:${W}px">
      <header class="ck-surf-h"><div class="ck-surf-t"><span class="ck-back">${ic("left")}${esc(back)}</span><div class="ck-row"><h1>${esc(title)}</h1>${meta}</div></div><span class="ck-sp"></span>${actions}</header>${body}</div>`;

  function portfolio() {
    const rows = [["g", "Air Defense", "2 products · 2 programs", "Priya Raghavan"], ["Customer A · X800 Rail Integration", "Ops · next SAR Dec 1 · Host: F-16 Block 70", 31, "116 of 374", "No change", "Dan Whitfield", "2 products · 1 behind", false], ["Customer B · X800 Palletized Integration", "EMD · next SSP Nov 16 · Host: C-130J", 39, "143 of 370", "No change", "Hana Lindqvist", "1 product", false], ["g", "Mission Systems", "2 products · 1 program", "Marcus Ryde"], ["Customer C · G25 Battery Control Fielding", "TMRR · next PDR Nov 19", 20, "56 of 287", "No change", "", "2 products", false], ["g", "No business line", "6 programs", ""], ["WS-X90 Sentinel Mission System", "Increment 2 · TMRR · next PDR Nov 24 · Host: F-16 Block 70", 41, "227 of 560", "+2 controls", "Ray Colston", "2 components · 1 behind", false], ["Legacy billing gateway", "TMRR · next SRR Apr 22, 2025", 0, "0 of 149", "No change", "", "Nothing shared", true], ["Field operations mobile", "Ops · next IOC Nov 19", 0, "0 of 287", "No change", "Priya Raghavan", "Nothing shared", false], ["Northwind data warehouse", "EMD · next CDR Dec 12, 2025", 0, "0 of 287", "No change", "Marcus Ryde", "Nothing shared", true], ["Corporate identity provider", "Planned · next SRR Mar 4, 2026", 0, "0 of 287", "No change", "", "Nothing shared", true], ["Atlas payments platform", "TMRR · next PDR Jun 9, 2026", 0, "0 of 149", "No change", "", "Nothing shared", true]];
    const tr = rows.map((r) => r[0] === "g" ? `<tr class="ck-grp-row"><td colspan="5"><span class="ck-row">${ic("chev")}<b>${esc(r[1])}</b><span class="ck-muted">${esc(r[2])}</span>${r[3] ? `<span class="ck-sp"></span>${avatar(r[3])}` : ""}</span></td></tr>` : `<tr><td><span class="ck-t2"><span class="ck-row ck-nw"><span class="ck-t2a ck-ell">${esc(r[0])}</span>${r[7] ? `<span class="ck-si ck-si-crit">${ic("alert")}Past due</span>` : ""}</span><span class="ck-t2b ck-ell">${esc(r[1])}</span></span></td><td><span class="ck-row"><b class="ck-strong">${r[2]}%</b>${bar(r[2])}<span class="ck-muted">${esc(r[3])}</span></span></td><td>${r[4].startsWith("+") ? `<span class="ck-up">${esc(r[4])}</span>` : muted(r[4])}</td><td>${avatar(r[5])}</td><td>${/behind/.test(r[6]) ? `${esc(r[6].split(" · ")[0])} <span class="ck-si ck-si-cau">${ic("alert")}1 behind</span>` : muted(r[6])}</td></tr>`).join("");
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>Programs</h1></div><div class="ck-ph-a">${btn("Create program", "primary", "plus")}</div></div>
      ${tiles([["Programs", 9], ["Built from a product", 3], ["Next gate past due", 4, "late"], ["No owner", 4]], "ck-tiles-row ck-tiles-4")}
      <div class="ck-toolbar">${search("Search programs")}${["Business line", "Owner", "Status"].map(select).join("")}${btn("Add filter", "tertiary", "plus", "sm")}</div>
      <div class="ck-table-w"><table class="ck-table"><thead><tr><th>Program</th><th style="width:270px">Controls satisfied</th><th style="width:140px">Since Nov 13</th><th style="width:190px">Owner</th><th style="width:240px">Built from</th></tr></thead><tbody>${tr}</tbody></table><div class="ck-table-f">${pager(1, 9, 9)}</div></div>`;
    return frame("Programs", main, WNAV, "workspace");
  }

  function products() {
    const rows = [["p", "X800 Missile", "X800", 27, [149, 370], "Version 2", "Published", "Nov 10", "2 programs · 1 behind"], ["c", "Core · in every configuration", "", 18, [161, 370]], ["c", "Lug & Rail Launch", "A", 20, [169, 370], "", "", "", "Customer A · X800-A-CUSA · on version 1"], ["c", "Eject Launch", "B", 21, [170, 370], "", "", "", "No program yet"], ["c", "Palletized Launch", "C", 22, [168, 370], "", "", "", "Customer B · X800-C-CUSB"], ["p", "R210 Launcher Electronics Unit", "R210", 3, [73, 370], "Version 2", "Published", "Oct 30", "1 program"], ["c", "Standard", "STD", 3, [73, 370], "", "", "", "Customer A · R210-STD-CUSA"], ["p", "G25 Launch Control Station", "G25", 13, [94, 287], "Version 1", "Published", "Jul 17", "1 program"], ["c", "Shelter", "SHL", 11, [98, 287], "", "", "", "No program yet"], ["c", "Vehicle-Mounted", "VEH", 11, [103, 287], "", "", "", "Customer C · G25-VEH-CUSC"], ["p", "G40 Ground Terminal", "G40", 4, [60, 287], "Version 1", "Published", "Nov 6", "1 program"], ["c", "Fixed Site", "FIX", 4, [60, 287], "", "", "", "No program yet"], ["c", "Transportable", "TRN", 4, [60, 287], "", "", "", "Customer C · G40-TRN-CUSC"]];
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>Products</h1></div><div class="ck-ph-a">${btn("Create product", "primary", "plus")}</div></div>
      <p class="ck-muted ck-sub">Each version is assessed once, by configuration; a variant owes only what it changes.</p>
      <div class="ck-banner">${ic("dot")}<div><b>X800 Missile version 2 is published,</b> and Customer A's X800-A-CUSA is still on version 1.</div><span class="ck-sp"></span>${btn("Review update", "secondary", null, "sm")}</div>
      ${tabs([["Products", 4], ["Variant delta", 5]], "Products")}
      ${table([{ t: "Product or configuration" }, { t: "Components", n: true, w: "110px" }, { t: "Controls satisfied", w: "230px" }, { t: "Version", w: "100px" }, { t: "Product assessment", w: "180px" }, { t: "Programs built from it", w: "250px" }], rows.map(([k, t, c, el, cs, v, st, d, prog]) => [k === "p" ? `<span class="ck-row"><span class="ck-doc-c">${esc(c)}</span><span class="ck-link ck-strong">${esc(t)}</span></span>` : `<span class="ck-row ck-indent">${c ? `<span class="ck-pill">${esc(c)}</span>` : ""}<span>${esc(t)}</span></span>`, String(el), `<span class="ck-row">${bar(Math.round((cs[0] / cs[1]) * 100))}<span class="ck-muted ck-nw">${cs[0]} of ${cs[1]}</span></span>`, v ? esc(v) : "", st ? `<span class="ck-row">${status(st)}<span class="ck-muted">${esc(d)}</span></span>` : "", prog ? (/behind|on version 1/.test(prog) ? `<span class="ck-ell">${esc(prog)}</span>` : muted(prog)) : ""]))}`;
    return frame("Products", main, PNAV, "products");
  }

  function campaign() {
    const ctl = [["AC-2(7)", "Privileged User Accounts", [0, 4], "Not judged"], ["AC-17(3)", "Managed Access Control Points", [1, 1], "Satisfied"], ["AC-17(4)", "Privileged Commands and Access", [5, 5], "Partially satisfied"], ["AC-17(9)", "Disconnect or Disable Access", [0, 1], "Not judged"], ["AU-14", "Session Audit", [0, 5], "Not judged"], ["CA-3", "Information Exchange", [8, 8], "Partially satisfied"], ["IA-1", "Policy and Procedures", [17, 17], "Satisfied"], ["IA-2(2)", "Multi-factor Authentication to Non-privileged Accounts", [1, 1], "Other than satisfied"]];
    const main = `${crumbs(["Assessments", "Control assessments", "Expanded control set assessment"])}
      <div class="ck-ph"><div class="ck-ph-t"><h1>WS-X90 Expanded Control Set Assessment</h1>${status("Active")}</div><div class="ck-ph-a">${btn("More", "secondary")}${btn("Publish results", "primary")}</div></div>
      <div class="ck-row ck-sub ck-muted">Sep 14 – Nov 20 · ${avatar("D. Okafor")} leads</div>
      ${tabs([["Plan"], ["Objectives", 81], ["Requests", 14], ["Results", 2], ["Findings", 35]], "Plan")}
      <div class="ck-banner ck-banner-cau">${ic("alert")}<div><b>1 set of results in draft.</b> A draft decides nothing until it is published.</div></div>
      <div class="ck-grid ck-grid-side">
        <div class="ck-stack">
          ${card("Plan approval", table([{ t: "Step" }, { t: "Who", w: "180px" }, { t: "Recorded", w: "130px" }, { t: "State", w: "130px" }], [["Lead assessor approves the plan", avatar("D. Okafor"), "With the plan", status("Approved")], ["Authorizing official concurs", avatar("R. Calloway"), "With the plan", `<span class="ck-si ck-si-pos">${ic("check")}Concurred</span>`]]))}
          ${card("Controls in the plan", table([{ t: "Control" }, { t: "Objectives judged", w: "170px" }, { t: "Determination", w: "230px" }], ctl.map(([c, t, j, d]) => [`<span class="ck-ctl">${code(c)}<span class="ck-link ck-ell">${esc(t)}</span></span>`, ring(j[0], j[1]), d === "Not judged" ? status(d) : `<span class="ck-row">${status(d)}<span class="ck-pill ck-pill-sm">Draft</span></span>`]), { foot: pager(1, 8, 26) }), `${count(26)}<span class="ck-sp"></span>${select("All determinations")}`)}
        </div>
        <div class="ck-stack">
          ${card("Progress", `<div class="ck-big"><b>69%</b><span>56 of 81 objectives judged</span></div>${bar(69)}<div class="ck-list ck-list-n">${[["Satisfied", 14], ["Partially satisfied", 4], ["Other than satisfied", 1], ["Not judged", 7]].map(([s, n]) => `<div class="ck-li">${status(s)}<span class="ck-sp"></span><b>${n}</b></div>`).join("")}</div>`)}
          ${card("Details", `<dl class="ck-dl">${[["Kind", "Control assessment"], ["Window", "Sep 14 – Nov 20"], ["Plan", "Version 1 · approved"], ["Lead assessor", avatar("D. Okafor")], ["Assessor", avatar("Nadia Fournier")], ["Assesses", '<span class="ck-link">SSP 2, published Jul 25</span>']].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`)}
        </div>
      </div>`;
    return frame("Assessments", main);
  }

  function ssp() {
    const toc = [["1", "System identification", ""], ["2", "Security categorization", "dot"], ["3", "Roles and responsibilities", ""], ["4", "Mission and purpose", ""], ["5", "Authorization boundary", ""], ["6", "Architecture and data flows", ""], ["7", "Interconnections", ""], ["8", "Hardware and software inventory", "dot"], ["9", "Ports, protocols and services", ""], ["10", "Control baseline", ""], ["11", "Control implementations", "dot"], ["11.1", "Access control", "52"], ["11.2", "Awareness and training", "12"], ["11.3", "Audit and accountability", "35"], ["11.4", "Assessment, authorization, and monitoring", "18"], ["11.5", "Configuration management", "43"], ["11.6", "Contingency planning", "27"]];
    const idrows = [["System name", "WS-X90 Sentinel Mission System"], ["System code", "SYS-WSX90"], ["Program", "PRG-1090 · WS-X90 Sentinel Mission System"], ["System type", "Platform"], ["Lifecycle", "Planned"], ["Catalog", "NIST SP 800-53 Rev 5 (5.2.0)"], ["Control baseline", "WS-X90 Tailored Security Baseline"], ["Authorization", "In progress"], ["Description", "Synthetic mission platform used only to exercise security engineering, compliance, assessment, SSP, and POA&M workflows."]];
    const actions = `${avs(["Priya Raghavan", "Joel Barrantes", "Marcus Ryde", "D. Okafor"])}<span class="ck-muted">+ you</span><span class="ck-pill ck-pill-info">${ic("chat")}6</span>${iconBtn("hist", "Version history")}${btn("Share", "secondary", "share", "sm")}${btn("Submit for review", "primary", null, "sm")}`;
    const tb = `<div class="ck-edtb">${iconBtn("undo", "Undo")}<span class="ck-vr"></span>${select("Normal text")}<span class="ck-vr"></span><b class="ck-tbg">B</b><i class="ck-tbg">I</i><u class="ck-tbg">U</u><span class="ck-vr"></span>${iconBtn("list", "List")}${iconBtn("table", "Table")}<span class="ck-btn ck-btn-tertiary ck-btn-sm"><span>Insert</span>${ic("chev")}</span>${iconBtn("chat", "Comment")}<span class="ck-sp"></span>${btn("Assist", "tertiary", "spark", "sm")}</div>`;
    const body = `${tb}<div class="ck-ed">
      <nav class="ck-toc"><div class="ck-row"><b>Contents</b><span class="ck-sp"></span><span class="ck-seg ck-seg-sm"><span class="on">All</span><span>Gaps only</span></span></div>${toc.map(([n, t, f]) => `<div class="ck-toc-i${n.includes(".") ? " sub" : ""}${n === "1" ? " on" : ""}"><span class="ck-muted">${n}</span><span class="ck-ell">${esc(t)}</span>${f === "dot" ? '<i class="ck-dotc"></i>' : f ? `<span class="ck-toc-n"><i class="ck-dotc"></i>${f}</span>` : ""}</div>`).join("")}</nav>
      <article class="ck-page"><h2>WS-X90 System Security Plan</h2><p class="ck-muted">SYS-WSX90 · Revision 3 · Draft · NIST SP 800-53 Rev 5 (5.2.0) · WS-X90 Tailored Security Baseline</p>
        <h3><span class="ck-muted">1</span> System identification</h3><div class="ck-row ck-sm">${pill("Live from System record SYS-WSX90")}<span class="ck-muted">synced 2 min ago</span></div>
        <dl class="ck-dl ck-dl-rows ck-dl-doc">${idrows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
        <h3><span class="ck-muted">2</span> Security categorization</h3><div class="ck-banner ck-banner-cau">${ic("alert")}<div><b>Needs action.</b> The availability impact has no basis recorded.</div><span class="ck-sp"></span><span class="ck-link">Add a basis</span></div></article>
      <aside class="ck-thr">${tabs([["Internal", 7], ["Assessor", 2]], "Internal")}<div class="ck-seg ck-seg-sm"><span class="on">Open</span><span>Resolved</span></div>
        ${[["Marcus Ryde", "10:31 AM", "2 · Security categorization", "Availability is Moderate in the categorization memo, but the basis column is empty here. Can we cite the memo?"], ["D. Okafor", "Yesterday", "8 · Hardware and software inventory", "The Maintenance Laptop image version doesn't match the SBOM import from Nov 12."]].map(([w, t, s, c]) => `<div class="ck-thr-c"><div class="ck-row">${avatar(w)}<span class="ck-sp"></span><span class="ck-muted ck-sm">${t}</span></div><span class="ck-muted ck-sm">${esc(s)}</span><p class="ck-p0">${esc(c)}</p><div class="ck-row"><span class="ck-link">Reply</span><span class="ck-link">Resolve</span></div></div>`).join("")}</aside></div>`;
    return surface("Documents", "WS-X90 System Security Plan", `${pill("Revision 3")}${status("Draft")}<span class="ck-muted ck-sm">${ic("check")} Saved</span>`, actions, body);
  }

  function team() {
    const roles = [["AO", "Authorizing official", "R. Calloway", "Categorization, IATT and ATO"], ["AODR", "Authorizing official designated representative", "Lena Marsh", ""], ["PM/SO", "Program manager and system owner", "Ray Colston", "Operational steps"], ["SCA", "Lead assessor", "D. Okafor", "Control selection and the SAR"], ["SCA", "Assessor", "Nadia Fournier", ""], ["ISSM", "Information system security manager", "Joel Barrantes", "RMF steps, first"], ["ISSO", "Information system security officer", "Priya Raghavan", ""], ["ISSE", "Information system security engineer", "Ingrid Solberg", ""], ["User rep", "User representative", "Capt. T. Abara", ""]];
    const people = [["R. Calloway", "AO", "Weapons AO office", "Viewer"], ["Ray Colston", "PM/SO", "Program office", "Editor"], ["D. Okafor", "Lead assessor", "Assessment team", "Commenter"], ["Joel Barrantes", "ISSM", "Program office", "Editor"], ["Priya Raghavan", "ISSO", "Program office", "Editor"], ["Ingrid Solberg", "ISSE", "Program office", "Editor"]];
    const main = `${crumbs(["Programs", "PRG-1090"])}
      <div class="ck-ph"><div class="ck-ph-t"><h1>WS-X90 Sentinel Mission System</h1>${pill("PRG-1090")}${status("ATO with conditions")}</div><div class="ck-ph-a">${btn("More", "secondary")}</div></div>
      ${tabs([["Overview"], ["Team", 15], ["Activity"]], "Team")}
      ${card("Roles", table([{ t: "Role", w: "90px" }, { t: "" }, { t: "Held by", w: "210px" }, { t: "Decides", w: "260px" }, { t: "", w: "110px" }], roles.map(([a, b, w, d], i) => [`<b class="ck-strong">${esc(a)}</b>`, esc(b), `${avatar(w)}${i === 7 ? ' <span class="ck-pill ck-pill-sm">You</span>' : ""}`, d ? esc(d) : muted("—"), '<span class="ck-link">Reassign</span>'])), `${count(roles.length)}<span class="ck-sp"></span>${btn("Assign a role", "primary", "plus", "sm")}`)}
      ${card("People", table([{ t: "Person" }, { t: "Roles", w: "200px" }, { t: "Organization", w: "220px" }, { t: "SSP access", w: "200px" }], people.map(([n, r, o, a]) => [avatar(n), esc(r), esc(o), `<span class="ck-select ck-select-sm">${esc(a)}${ic("chev")}</span>`]), { foot: pager(1, 6, 15) }), `${count(15)}<span class="ck-sp"></span>${btn("Add a person", "secondary", "plus", "sm")}`)}`;
    return frame("Overview", main);
  }

  function frameworks() {
    const rows = [["NIST SP 800-53 Rev 5 High baseline", "NIST SP 800-53B · release 5.1.1", [346, 370], 64, 39, "In WS-X90's stack", "24 not in WS-X90"], ["NIST SP 800-53 Rev 5 Moderate baseline", "NIST SP 800-53B · release 5.1.1", [280, 287], 68, 43, "Reference", "7 not in WS-X90"], ["NIST SP 800-53 Rev 5 Low baseline", "NIST SP 800-53B · release 5.1.1", [147, 149], 70, 38, "Reference", "2 not in WS-X90"], ["NIST SP 800-53 Rev 5 Privacy baseline", "NIST SP 800-53B · release 5.1.1", [46, 96], 31, 15, "Reference", "50 not in WS-X90"]];
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>Frameworks & overlays</h1></div><div class="ck-ph-a">${btn("Import OSCAL", "secondary")}${btn("Create overlay", "primary", "plus")}</div></div>
      ${tabs([["Baselines", 4], ["Overlays", 5]], "Baselines")}
      <div class="ck-toolbar">${search("Search baselines")}${["Source", "Status"].map(select).join("")}${btn("Add filter", "tertiary", "plus", "sm")}</div>
      ${table([{ t: "Baseline" }, { t: "In WS-X90", w: "120px" }, { t: "With evidence", w: "160px" }, { t: "Satisfied", w: "160px" }, { t: "Status", w: "170px" }, { t: "Gap", w: "150px" }, { t: "", w: "64px" }], rows.map(([t, s, iw, ev, sa, st, gap]) => [title2(t, s), ring(iw[0], iw[1]), `<span class="ck-row">${bar(ev)}<span class="ck-muted">${ev}%</span></span>`, `<span class="ck-row">${bar(sa)}<span class="ck-muted">${sa}%</span></span>`, st === "Reference" ? `<span class="ck-si ck-si-neu">${ic("doc")}Reference</span>` : `<span class="ck-si ck-si-info">${ic("check")}${esc(st)}</span>`, `<span class="ck-link">${esc(gap)}</span>`, iconBtn("more", "Row actions")]), { foot: pager(1, 4, 4) })}
      <div class="ck-hl ck-hl-info"><b>Where the numbers come from</b><span>With evidence is each baseline's controls in WS-X90's baseline less those with no requirement or evidence; Satisfied is WS-X90's control status.</span></div>`;
    return frame("Library", main, WNAV, "workspace");
  }

  function sctm() {
    const rows = [["AC-1", "Policy and Procedures", "Partially implemented", "The WS-X90 access control policy and its procedures …", "Configuration Repository", 1, "REQ-436"], ["AC-2", "Account Management", "Partially implemented", "The SYS-WSX90 satisfies the tailored intent of AC-2 th…", "", 2, "REQ-001, REQ-002"], ["AC-2(1)", "Automated System Account Management", "Implemented", "Account create, modify, enable, disable and remove ac…", "Platform Management Controller", 1, "REQ-026"], ["AC-2(2)", "Automated Temporary and Emergency…", "Partially implemented", "Temporary and emergency maintenance accounts are …", "Platform Management Controller", 1, "REQ-027"], ["AC-2(3)", "Disable Accounts", "Implemented", "Two disable paths carry AC-2(3). On the platform side …", "Platform Management Controller", 2, "REQ-439, REQ-440"], ["AC-2(4)", "Automated Audit Actions", "Implemented", "The audit write is on the critical path of the account ch…", "Platform Management Controller", 1, "REQ-029"], ["AC-2(5)", "Inactivity Logout", "Partially implemented", "End-of-work-period logout on the Provisioning Workst…", "Provisioning Workstation", 1, "REQ-442"], ["AC-2(7)", "Privileged User Accounts", "Partially implemented", "WS-X90 carries privilege in named roles rather than o…", "Platform Management Controller", 1, "REQ-443"], ["AC-2(11)", "Usage Conditions", "Planned", "Usage conditions are designed and not yet enforced. T…", "Mission Computer", 1, "REQ-031"], ["AC-2(12)", "Account Monitoring for Atypical Usage", "Planned", "Atypical usage detection is a design on paper. The WS…", "Security Log Collector", 1, "REQ-033"], ["AC-3", "Access Enforcement", "Implemented", "The SYS-WSX90 satisfies the tailored intent of AC-3 th…", "", 3, "REQ-002, REQ-005"], ["AC-3(4)", "Discretionary Access Control", "Planned", "WS-X90 is a non-discretionary system everywhere it …", "Provisioning Workstation", 1, "REQ-037"], ["AC-4", "Information Flow Enforcement", "Implemented", "The SYS-WSX90 satisfies the tailored intent of AC-4 th…", "", 2, "REQ-003, REQ-008"], ["AC-4(4)", "Flow Control of Encrypted Information", "Partially implemented", "The Protected Network Gateway (LRU-007) is a defaul…", "Protected Network Gateway", 1, "REQ-449"], ["AC-4(21)", "Physical or Logical Separation of Inf…", "Planned", "Planned: Mission, payload and maintenance flows are …", "", 0, ""], ["AC-5", "Separation of Duties", "Partially implemented", "The SYS-WSX90 satisfies the tailored intent of AC-5 th…", "", 2, "REQ-004, REQ-012"], ["AC-6", "Least Privilege", "Partially implemented", "The SYS-WSX90 satisfies the tailored intent of AC-6 th…", "", 2, "REQ-005, REQ-019"], ["AC-6(1)", "Authorize Access to Security Functions", "Implemented", "WS-X90 enumerates its security functions rather than …", "Mission Computer", 1, "REQ-043"]];
    const IM = { "Partially implemented": ["cau", "dot"], Implemented: ["pos", "check"], Planned: ["neu", "dot"] };
    const cols = [["A", "Control", 90], ["B", "Title", 210], ["C", "Family", 80], ["D", "Implementation", 185], ["E", "Narrative", 285], ["F", "Responsible component", 220], ["G", "Requirements", 130], ["H", "Mapped by", 140]];
    const actions = `<span class="ck-seg ck-seg-sm"><span>List</span><span class="on">Workbook</span></span>${iconBtn("search", "Find")}${iconBtn("more", "More")}<span class="ck-btn ck-btn-primary ck-btn-sm ck-dis"><span>Review changes</span></span>${iconBtn("x", "Close")}`;
    const tb = `<div class="ck-edtb">${iconBtn("undo", "Undo")}<span class="ck-vr"></span>${btn("Sort A–Z", "tertiary", "sort", "sm")}${btn("Filter", "tertiary", "filter", "sm")}<span class="ck-vr"></span><span class="ck-btn ck-btn-secondary ck-btn-sm ck-on">${ic("freeze")}<span>Freeze</span></span>${btn("Fit", "tertiary", null, "sm")}${btn("Copy", "tertiary", "copy", "sm")}<span class="ck-vr"></span><span class="ck-muted">Filter view</span>${select("All controls")}<span class="ck-sp"></span><span class="ck-muted ck-sm">Read only: derived from WS-X90's records</span></div>
      <div class="ck-fx"><span class="ck-fx-n">A1</span><span class="ck-fx-i">fx</span><span>AC-1</span></div>`;
    const grid = `<div class="ck-sheet-g"><table class="ck-grid-t"><thead><tr><th class="ck-rn"></th>${cols.map(([l, t, w]) => `<th style="width:${w}px"><span class="ck-muted">${l}</span> ${esc(t)}</th>`).join("")}</tr></thead><tbody>${rows.map((r, i) => `<tr><td class="ck-rn">${i + 1}</td><td${i === 0 ? ' class="sel"' : ""}><span class="ck-link">${esc(r[0])}</span></td><td><span class="ck-ell">${esc(r[1])}</span></td><td>${esc(r[0].split("-")[0])}</td><td><span class="ck-si ck-si-${IM[r[2]][0]}">${ic(IM[r[2]][1])}${esc(r[2])}</span></td><td><span class="ck-ell">${esc(r[3])}</span></td><td>${r[4] ? `<span class="ck-link ck-ell">${esc(r[4])}</span>` : muted("—")}</td><td class="n">${r[5]}</td><td>${r[6] ? `<span class="ck-link ck-ell">${esc(r[6])}</span>` : muted("—")}</td></tr>`).join("")}</tbody></table></div>
      <div class="ck-sheets">${[["SCTM", 560], ["Controls", 560], ["Requirements", 640], ["Evidence", 368], ["Operational issues", 43], ["Assessment findings", 313], ["Risks", 40], ["Analysis"]].map(([t, n], i) => `<span class="ck-tab${i === 0 ? " on" : ""}">${esc(t)}${n ? count(n) : ""}</span>`).join("")}<span class="ck-sp"></span><span class="ck-muted ck-sm">560 rows · Formulas: IronCalc 0.8.4</span></div>`;
    return surface("Controls", "SCTM workbook", `<span class="ck-muted ck-sm">Snapshot Nov 17, 2026 · SSP revision 3 draft</span><span class="ck-si ck-si-pos">${ic("check")}No changes staged</span>`, actions, tb + grid);
  }

  function boundary() {
    const left = [["F-16 Block 70", "Host system · Authorized until Mar 3, 2028", "pos"], ["Squadron operations facility", "Common control provider · Authorized until Jun 1, 2028", "pos"], ["Corporate identity provider", "Enterprise service · not authorized", "crit"]];
    const subs = [["Mission Computing Subsystem", "3 components", ["MIL-STD-1553B", "Aircraft power"], ["Removable media"]], ["Navigation & Timing Subsystem", "3 components", ["MIL-STD-1553B", "Aircraft antennas"], ["RF, receive only"]], ["Communications Subsystem", "3 components", ["Aircraft power", "Aircraft antennas"], ["RF data link", "Ethernet", "VPN over DISN"]], ["Payload Interface Subsystem", "3 components", ["MIL-STD-1760", "Aircraft power"], ["Ethernet"]], ["Platform Management Subsystem", "4 components", ["MIL-STD-1553B", "Aircraft power"], []], ["Ground Support Subsystem", "4 components", ["Aircraft power"], ["Maintenance Ethernet"]]];
    const right = [["Mission planning system loader", "No agreement in force", true], ["GPS", "RF, receive only"], ["Tactical data link network", "RF data link"], ["Mission planning network", "Ethernet"], ["SIPRNet", "No agreement in force", true], ["Ground support telemetry system", "No agreement in force", true], ["Squadron maintenance network", "Maintenance Ethernet"], ["Joint mission planning workstation", "Removable media"]];
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>System</h1>${pill("SYS-WSX90")}</div><div class="ck-ph-a"><span class="ck-seg"><span>List</span><span class="on">Boundary</span></span>${btn("Add component", "primary", "plus")}</div></div>
      ${tabs([["Components", 27], ["Host and providers", 3], ["Connected systems", 8], ["Connections", 18]], "Components")}
      <div class="ck-row">${select("Authorization: ATO")}<p class="ck-p0 ck-muted">The boundary is SYS-WSX90 and everything inside it: six subsystems and the twenty components they hold.</p><span class="ck-sp"></span>${btn("Edit description", "tertiary", "edit", "sm")}</div>
      <div class="ck-bd">
        <div class="ck-bd-col"><span class="ck-bd-k">Host system and providers</span>${left.map(([t, s, k]) => `<div class="ck-node"><b>${esc(t)}</b><span class="ck-muted">${esc(s)}</span><span class="ck-si ck-si-${k}">${ic(k === "pos" ? "check" : "alert")}${k === "pos" ? "Authorized" : "Not authorized"}</span></div>`).join("")}</div>
        <div class="ck-bd-b"><div class="ck-bd-bh"><span class="ck-bd-k">Authorization boundary</span><b>ATO · Increment 1 · Block 1</b><span class="ck-muted">Authorized with conditions Sep 18, 2026 · until Sep 17, 2029</span></div>
          ${subs.map(([t, s, l, r]) => `<div class="ck-bd-r"><div class="ck-bd-l">${l.map((x) => `<span class="ck-wire">${esc(x)}</span>`).join("")}</div><div class="ck-node ck-node-in"><b>${esc(t)}</b><span class="ck-muted">${esc(s)}</span></div><div class="ck-bd-l ck-bd-l-r">${r.map((x) => `<span class="ck-wire">${esc(x)}</span>`).join("")}</div></div>`).join("")}</div>
        <div class="ck-bd-col"><span class="ck-bd-k">Connected systems</span>${right.map(([t, s, bad]) => `<div class="ck-node${bad ? " ck-node-bad" : ""}"><b>${esc(t)}</b>${bad ? `<span class="ck-si ck-si-crit">${ic("alert")}${esc(s)}</span>` : `<span class="ck-muted">${esc(s)}</span>`}</div>`).join("")}</div>
      </div>`;
    return frame("System", main);
  }

  function stigs() {
    const rows = [["RHEL 9", "V2R9", "V2R10", "Mission Computer", "STIG Viewer 2.18", "Oct 13", [2, 21, 6], 33, 93], ["ASD", "V6R5", "", "Mission Computer", "STIG Viewer 3.6", "Nov 4", [0, 9, 2], 27, 95], ["Cisco IOS Switch NDM", "V3R6", "V3R7", "Internal Ethernet Switch", "STIG Viewer 2.18", "Aug 18", [0, 3, 0], 1, 93], ["Cisco IOS Switch L2S", "V3R1", "", "Internal Ethernet Switch", "STIG Viewer 2.18", "Aug 18", [0, 2, 1], 0, 84], ["Cisco IOS XE Router NDM", "V3R7", "", "Protected Network Gateway", "Evaluate-STIG 1.2508.1", "Sep 30", [0, 2, 0], 2, 95], ["Cisco IOS XE Router RTR", "V3R5", "", "Protected Network Gateway", "Evaluate-STIG 1.2508.1", "Sep 30", [0, 3, 3], 5, 87], ["Windows 11", "V2R9", "", "Maintenance Laptop", "SCC 5.10.1", "Oct 14", [1, 17, 3], 18, 91]];
    const cat = ([a, b, c]) => `<span class="ck-cats"><span class="ck-cat ck-cat-1${a ? "" : " z"}">${a}</span><span class="ck-cat ck-cat-2${b ? "" : " z"}">${b}</span><span class="ck-cat ck-cat-3${c ? "" : " z"}">${c}</span></span>`;
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>Evidence</h1></div><div class="ck-ph-a">${btn("Import a checklist", "secondary")}</div></div>
      ${tabs([["Evidence", 368], ["Sources", 9]], "Evidence")}
      <div class="ck-seg" role="presentation"><span>All 368</span><span>Documents 154</span><span>Test records 85</span><span>Datasets 70</span><span>Scan results 59</span><span class="on">STIG checklists 7</span></div>
      ${toolbar("Search checklists", ["Asset", "Source"], "Add evidence")}
      ${table([{ t: "Checklist" }, { t: "Asset", w: "190px" }, { t: "Source", w: "160px" }, { t: "Last import", w: "105px" }, { t: "Open CAT I · II · III", w: "150px" }, { t: "Not reviewed", n: true, w: "110px" }, { t: "Compliance", w: "140px" }], rows.map(([t, v, nv, a, s, d, c, nr, pc]) => [`<span class="ck-row"><span class="ck-link ck-strong">${esc(t)}</span><span class="ck-pill ck-pill-sm">${esc(v)}</span>${nv ? `<span class="ck-si ck-si-info">${ic("right")}${esc(nv)} out</span>` : ""}</span>`, esc(a), muted(s), esc(d), cat(c), nr ? String(nr) : muted("0"), `<span class="ck-row">${bar(pc)}<b class="ck-strong">${pc}%</b></span>`]), { foot: `<span>7 of 7 checklists</span>` })}`;
    return frame("Evidence", main);
  }

  // ——— Version 4: patterns and states (tasks, comments and activity; the side panel; forms; pickers; table states;
  // loading and failure; global search; phone layouts; theming) ———
  Object.assign(P, {
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    send: '<path d="M4 12 20 4l-5 16-3-7z"/><path d="m12 13 8-9"/>',
    at: '<circle cx="12" cy="12" r="3.5"/><path d="M15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.3 6.7"/>',
    up: '<path d="m7 14 5-5 5 5"/>',
    down: '<path d="m7 10 5 5 5-5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    empty: '<rect x="3.5" y="6" width="17" height="13" rx="2"/><path d="M3.5 10h17M8 14h8"/>',
    refresh: '<path d="M19 8a7.5 7.5 0 1 0 1 5"/><path d="M19.5 3.5V8H15"/>',
    bolt: '<path d="M13 3 5 13h6l-1 8 8-10h-6z"/>',
  });
  // frame() with what these screens add: a side panel beside Main, an overlay over the page, the search opened,
  // the theme class. The plain screens above keep calling frame() as they did.
  function frameX(on, main, nav, kind, o) {
    let html = frame(on, main, nav, kind);
    if (o.panel) html = html.replace(/<\/main>\s*<\/div>/, `</main>${o.panel}</div>`);
    if (o.search) html = html.replace(/<span class="ck-gsearch">[\s\S]*?<\/kbd><\/span>/, o.search);
    if (o.theme) html = html.replace('class="ck-app"', `class="ck-app ${o.theme}"`);
    if (o.over) html = html.replace(/<\/div>\s*$/, `${o.over}</div>`);
    return html;
  }
  const mark = (t, q) => { const i = t.toLowerCase().indexOf(q.toLowerCase()); return i < 0 ? esc(t) : `${esc(t.slice(0, i))}<mark>${esc(t.slice(i, i + q.length))}</mark>${esc(t.slice(i + q.length))}`; };
  const due = (d, s) => `<span class="ck-due">${ic("cal")}${esc(d)}${s ? " " + status(s) : ""}</span>`;
  const sk = (w) => `<i class="ck-sk" style="width:${w}"></i>`;

  // Tasks, comments and activity on a record (the risk record)
  function collab() {
    const tasks = [[true, "Confirm the flightline laptop inventory with the squadron", "Ingrid Solberg", "Nov 8", "Completed"], [false, "Draft the CAC requirement for the Maintenance Laptop (IA-2(1))", "Priya Raghavan", "Nov 19", "Due soon"], [false, "Request the SCA review of the CAC reader change", "Joel Barrantes", "Dec 6", "Not started"], [false, "Record the residual risk once IA-2(1) is assessed", "", "Dec 13", "Not started"]];
    const act = [["Priya Raghavan", "raised the severity from High to Critical", "Nov 12 · 10:42 AM", "edit"], ["Ingrid Solberg", "completed the task Confirm the flightline laptop inventory", "Nov 8 · 3:15 PM", "check"], ["D. Okafor", "linked the assessment finding AC-17(4) [03], Other than satisfied", "Nov 5 · 9:02 AM", "flag"], ["Joel Barrantes", "set the response to Mitigate, due Dec 13", "Oct 31 · 4:40 PM", "edit"], ["Priya Raghavan", "created the risk from the operational issue Shared maintenance password", "Oct 30 · 11:20 AM", "plus"]];
    const cm = (who, when, text, o) => `<div class="ck-cm${o && o.reply ? " ck-cm-r" : ""}"><span class="ck-av">${esc(who.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase())}</span><div class="ck-cm-b"><div class="ck-row"><b class="ck-strong">${esc(who)}</b><span class="ck-muted">${esc(when)}</span>${o && o.tag ? pill(o.tag) : ""}</div><p>${text}</p>${o && o.reply ? "" : `<div class="ck-row ck-cm-a"><span class="ck-link">Reply</span><span class="ck-link">Resolve</span>${iconBtn("more", "More actions")}</div>`}</div></div>`;
    const main = `${crumbs(["Risks", "Register", "A password on its own reaches WS-X90 at the flightline"])}
      <div class="ck-ph"><div class="ck-ph-t"><h1>A password on its own reaches WS-X90 at the flightline</h1>${status("Critical")}</div><div class="ck-ph-a">${btn("More", "secondary")}${btn("Edit risk", "primary")}</div></div>
      ${tabs([["Overview"], ["Assessments", 2], ["Remediation", 1]], "Overview")}
      <div class="ck-grid ck-grid-side">
        <div class="ck-stack">
          ${card("Tasks", `<div class="ck-row ck-tk-p">${bar(25)}<span class="ck-muted">1 of 4 done</span></div><div class="ck-tks">${tasks.map(([done, t, who, d, s]) => `<div class="ck-tk${done ? " done" : ""}">${cb(done)}<span class="ck-tk-t">${esc(t)}</span>${avatar(who)}${done ? `<span class="ck-due">${ic("cal")}${esc(d)}</span>` : due(d, s === "Due soon" ? s : "")}</div>`).join("")}</div>`, `<span class="ck-row">${count(4)}${btn("Add task", "secondary", "plus", "sm")}</span>`)}
          ${card("Comments", `<div class="ck-compose"><span class="ck-av">IS</span><div class="ck-compose-i"><span class="ck-muted">Write a comment. Type @ to mention someone.</span><div class="ck-row">${iconBtn("at", "Mention someone")}${iconBtn("clip", "Attach a file")}<span class="ck-sp"></span>${btn("Post comment", "secondary", "send", "sm")}</div></div></div>
            ${cm("Ingrid Solberg", "Nov 12 · 10:31 AM", "The squadron counts 6 laptops on the flightline. Two still run the older image without the CAC middleware, so a password alone gets an operator in.")}
            ${cm("Priya Raghavan", "Nov 12 · 11:05 AM", '<span class="ck-mention">@Ingrid Solberg</span> thanks. I raised it to Critical; the CAC requirement will cover both images and I\'ll have a draft by Wednesday.', { reply: true })}
            ${cm("Marcus Ryde", "Nov 14 · 8:47 AM", "Does this block PDR on the 24th, or can it go to the POA&amp;M with a date?", { tag: "Gate reviewer" })}
            <div class="ck-exp">${ic("right")}<b>2 resolved comments</b></div>`, count(5))}
        </div>
        <div class="ck-stack">
          ${card("Details", `<dl class="ck-dl">${[["Owner", `${avatar("")} <span class="ck-link">Assign</span>`], ["Likelihood", "Moderate"], ["Impact", "High"], ["Response", "Mitigate"], ["Response due", `<span>Dec 13</span>`], ["Techniques", '<span class="ck-mono">T1078, T1110</span>'], ["Program", '<span class="ck-link">WS-X90</span>']].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`)}
          ${card("Activity", `<div class="ck-seg ck-seg-sm"><span class="on">All</span><span>Changes</span><span>Comments</span></div><ol class="ck-feed">${act.map(([who, what, when, i]) => `<li><span class="ck-feed-i">${ic(i)}</span><div><span><b class="ck-strong">${esc(who)}</b> ${esc(what)}</span><span class="ck-muted">${esc(when)}</span></div></li>`).join("")}</ol><span class="ck-link">Show all 14 events</span>`)}
        </div>
      </div>`;
    return frame("Risks", main);
  }

  // A register with the record preview open in a side panel
  function preview() {
    const rows = [["REQ-001", "AC Enforcement Requirement 001", "AC-2, AC-7", 1, "Supported"], ["REQ-002", "AC Verification Requirement 002", "AC-3", 1, "Supported"], ["REQ-003", "AC Configuration Requirement 003", "AC-4", 1, "Supported"], ["REQ-004", "AC Monitoring Requirement 004", "AC-5", 0, "No evidence"], ["REQ-005", "AC Enforcement Requirement 005", "AC-6", 1, "Supported"], ["REQ-006", "AC Verification Requirement 006", "AC-7", 1, "Supported"], ["REQ-007", "AC Configuration Requirement 007", "AC-8", 1, "Supported"], ["REQ-008", "AC Monitoring Requirement 008", "AC-11, AU-4", 0, "No evidence", true], ["REQ-009", "AC Enforcement Requirement 009", "AC-12", 1, "Supported"]];
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>Requirements</h1></div></div>
      ${tabs([["All", 654], ["Engineering", 640], ["CUSA-SSRD", 14]], "All")}
      <div class="ck-toolbar">${search("Search requirements")}${select("State")}<span class="ck-sp"></span>${btn("Create requirement", "primary", "plus", "sm")}</div>
      <div class="ck-table-w"><table class="ck-table"><thead><tr><th>Requirement</th><th style="width:130px">Controls</th><th class="n" style="width:90px">Evidence</th><th style="width:140px">State</th></tr></thead><tbody>${rows.map(([id, t, c, ev, s, on]) => `<tr${on ? ' class="ck-tr-on"' : ""}><td><span class="ck-row ck-nw">${title2(id, t)}<span class="ck-eye${on ? " on" : ""}">${ic("eye")}</span></span></td><td><span class="ck-mono">${esc(c)}</span></td><td class="n">${ev ? ev : muted("—")}</td><td>${status(s)}</td></tr>`).join("")}</tbody></table><div class="ck-table-f">${pager(1, 9, 654)}</div></div>`;
    const panel = `<aside class="ck-spanel" aria-label="Requirement preview">
      <div class="ck-spanel-h"><b class="ck-spanel-n">Requirement preview</b><span class="ck-sp"></span>${iconBtn("left", "Previous requirement")}<span class="ck-muted">8 of 654</span>${iconBtn("right", "Next requirement")}${iconBtn("ext", "Open the full record")}${iconBtn("x", "Close Requirement preview")}</div>
      <div class="ck-spanel-b">
        <div class="ck-row">${pill("REQ-008")}${status("No evidence")}</div>
        <div class="ck-row ck-spanel-t"><h3>AC Monitoring Requirement 008</h3><span class="ck-sp"></span>${btn("Edit", "primary", null, "sm")}${iconBtn("more", "More actions")}</div>
        <dl class="ck-dl">${[["Owner", avatar("")], ["Source", "Engineering"], ["Components", "Platform Management Controller +1"], ["Revision", "3 · edited Oct 21"]].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
        <div class="ck-spanel-s"><b class="ck-gl">Statement</b><p>The Platform Management Controller shall lock an operator session after 15 minutes of inactivity and record each lock in the audit log.</p></div>
        <div class="ck-spanel-s"><div class="ck-row"><b class="ck-gl">Controls</b>${count(2)}</div>
          <div class="ck-list">${[["AC-11", "Device Lock", "Mapped to control"], ["AU-4", "Audit Log Storage Capacity", "Mapped to objective AU-04.01"]].map(([c, t, m]) => `<div class="ck-li">${code(c)}<span class="ck-link">${esc(t)}</span><span class="ck-sp"></span>${muted(m)}</div>`).join("")}</div></div>
        <div class="ck-banner ck-banner-cau">${ic("alert")}<div class="ck-banner-col"><span><b>No evidence cited.</b> AC-11 and AU-4 stay at No evidence until it has some.</span>${btn("Link evidence", "secondary", null, "sm")}</div></div>
      </div></aside>`;
    return frameX("Requirements", main, null, null, { panel });
  }

  // Create and edit forms, with their error and saving states
  function forms() {
    const over = `<div class="ck-over"><div class="ck-modal ck-modal-l" role="presentation">
        <div class="ck-modal-h"><b>Create risk</b>${iconBtn("x", "Close")}</div>
        <div class="ck-banner ck-banner-err">${ic("alert")}<div><b>2 fields need an answer.</b> <span class="ck-link">Likelihood</span> · <span class="ck-link">Owner</span></div></div>
        ${field("Title", tinput("Maintenance laptops reach the mission computer over the service port"), { req: true })}
        ${field("Threat", `<span class="ck-input ck-ta">An insider with a laptop on the flightline connects to the J3 service port and reaches the mission computer's maintenance shell.</span>`, { hint: "112 / 500 characters" })}
        <div class="ck-cols">${field("Likelihood", `<span class="ck-select err">Choose a likelihood${ic("chev")}</span>`, { req: true, err: true, hint: "Choose how likely the threat is." })}${field("Impact", `<span class="ck-select">High${ic("chev")}</span>`, { req: true })}</div>
        <div class="ck-cols">${field("Owner", tinput("", { err: true, ph: "Search people and organizations", icon: "search" }), { req: true, err: true, hint: "Choose who owns the risk." })}${field("Response due", tinput("12/13/2026", { icon: "cal" }), { hint: "A calendar day." })}</div>
        <div class="ck-modal-f">${btn("Cancel", "tertiary")}${btn("Create risk", "primary")}</div>
      </div>
      <div class="ck-modal ck-modal-m ck-saving" role="presentation">
        <div class="ck-modal-h"><b>Edit risk response</b>${iconBtn("x", "Close")}</div>
        ${field("Response", `<span class="ck-select">Mitigate${ic("chev")}</span>`, { req: true })}
        ${field("Response due", tinput("12/13/2026", { icon: "cal" }))}
        ${field("Rationale", `<span class="ck-input ck-ta">CAC on both laptop images closes the password-only path; IA-2(1) is assessed in the next campaign.</span>`, { hint: "104 / 500 characters" })}
        <div class="ck-modal-f">${btn("Cancel", "tertiary")}<span class="ck-btn ck-btn-primary ck-btn-busy"><span class="ck-dots"><i></i><i></i><i></i></span><span>Saving</span></span></div>
      </div></div>`;
    return frameX("Risks", risks().match(/<main class="ck-main">([\s\S]*)<\/main>/)[1], null, null, { over });
  }

  // Searchable pickers: Combobox and MultiSelect
  function pickers() {
    const opt = (q, a, b, o) => `<span class="ck-opt-r${o && o.on ? " on" : ""}${o && o.hl ? " hl" : ""}">${o && o.cb != null ? cb(o.cb) : ""}${o && o.av ? `<span class="ck-av ck-av-xs">${esc(a.split(/\s+/).map((x) => x[0]).join("").slice(0, 2))}</span>` : ""}<span class="ck-t2"><span>${mark(a, q)}</span>${b ? `<span class="ck-t2b">${esc(b)}</span>` : ""}</span>${o && o.on && o.cb == null ? `<span class="ck-sp"></span>${ic("check")}` : ""}</span>`;
    const lb = (xs, foot) => `<div class="ck-lb">${xs.join("")}${foot ? `<div class="ck-lb-f">${foot}</div>` : ""}</div>`;
    const main = `${crumbs(["Requirements", "REQ-008"])}
      <div class="ck-ph"><div class="ck-ph-t"><h1>AC Monitoring Requirement 008</h1>${pill("REQ-008")}${status("No evidence")}</div><div class="ck-ph-a">${btn("More", "secondary")}${btn("Edit requirement", "primary")}</div></div>
      <div class="ck-grid ck-grid-2e">
        ${card("Owner", `${field("Owner", `<span class="ck-input ck-tin focus">pri<span class="ck-caret"></span>${ic("chev")}</span>`)}${lb([opt("pri", "Priya Raghavan", "ISSO · WS-X90", { av: true, hl: true }), opt("pri", "Prime Integration Services", "Organization · supplier", { av: true })], "2 matches")}`, muted("Combobox: one person or organization"))}
        ${card("Map controls", `${field("Controls", `<span class="ck-input ck-tin ck-multi focus"><span class="ck-pill ck-pill-rm">AC-11${ic("x")}</span><span class="ck-pill ck-pill-rm">AU-4${ic("x")}</span>ac-1<span class="ck-caret"></span></span>`, { hint: "Only controls the program's baseline selects." })}${lb([opt("ac-1", "AC-1 Policy and Procedures", "Partially satisfied", { cb: false, hl: true }), opt("ac-1", "AC-11 Device Lock", "No evidence", { cb: true }), opt("ac-1", "AC-11(1) Pattern-hiding Displays", "Satisfied", { cb: false }), opt("ac-1", "AC-12 Session Termination", "Satisfied", { cb: false })], "12 controls match · 2 chosen")}`, muted("MultiSelect with search"))}
        ${card("Filter the findings register", `<div class="ck-toolbar ck-toolbar-0">${search("Search findings")}<span class="ck-select ck-select-open">Severity · 2${ic("chev")}</span>${select("Control")}</div>${lb([opt("", "Critical", "3 findings", { cb: true }), opt("", "High", "41 findings", { cb: true }), opt("", "Moderate", "88 findings", { cb: false }), opt("", "Low", "42 findings", { cb: false })], `<span class="ck-link">Clear</span><span class="ck-sp"></span>${btn("Apply", "secondary", null, "sm")}`)}<div class="ck-chips">${`<span class="ck-pill ck-pill-rm">Severity: Critical, High${ic("x")}</span>`}${pill("44 findings")}</div>`, muted("MultiSelect in a toolbar"))}
        ${card("Link evidence", `${field("Evidence", `<span class="ck-input ck-tin focus">${ic("search")}session lock<span class="ck-caret"></span></span>`)}${lb([opt("session lock", "PMC session lock configuration export", "Version 2 · Accepted · Platform Management Controller", { hl: true }), opt("session lock", "Session lock and screen saver test report", "Version 1 · Waiting on review · Mission Computer"), opt("session lock", "Operator session lock procedure, SOP-114", "Version 4 · Accepted · Program")], "Showing 3 of 9 · type more to narrow")}`, muted("Combobox over a server-paged register"))}
      </div>`;
    return frame("Requirements", main);
  }

  // Table features: sorting, selection, a sticky header, an empty register and a search with no results
  function tablestates() {
    const rows = [[true, "PMC session lock configuration export", "Platform Management Controller", "Nov 14", "Accepted", "Priya Raghavan"], [true, "Gateway counter export, October", "Protected Network Gateway", "Nov 13", "Waiting on review", "Ingrid Solberg"], [false, "Mission computer STIG checklist, RHEL 9", "Mission Computer", "Nov 12", "To revise", "Joel Barrantes"], [false, "Key rotation log, Cryptographic Services Module", "Cryptographic Services Module", "Nov 10", "Accepted", ""], [false, "Remote access session log export", "Protected Network Gateway", "Nov 9", "Waiting on review", "Priya Raghavan"]];
    const th = (t, s, w) => `<th${w ? ` style="width:${w}"` : ""}${s ? ` aria-sort="${s}"` : ""}><span class="ck-th${s ? " on" : ""}">${esc(t)}${ic(s === "ascending" ? "up" : s === "descending" ? "down" : "sort")}</span></th>`;
    const main = `<div class="ck-ph"><div class="ck-ph-t"><h1>Evidence</h1></div><div class="ck-ph-a">${btn("Add evidence", "primary", "plus")}</div></div>
      <div class="ck-sel-w ck-table-w ck-scroll"><table class="ck-table ck-sticky"><thead><tr><th style="width:52px">${cb(false, true)}</th>${th("Evidence")}${th("Component", "", "250px")}${th("Last version", "descending", "140px")}${th("Review", "", "170px")}${th("Owner", "", "180px")}</tr></thead>
        <tbody>${rows.map(([on, t, c, d, s, o]) => `<tr${on ? ' class="ck-tr-sel"' : ""}><td>${cb(on)}</td><td><span class="ck-link ck-ell">${esc(t)}</span></td><td><span class="ck-ell">${esc(c)}</span></td><td>${esc(d)}</td><td>${status(s)}</td><td>${avatar(o)}</td></tr>`).join("")}</tbody></table>
        <div class="ck-actionbar"><b>2 selected</b><span class="ck-link">Select all 368</span><span class="ck-link">Clear</span><span class="ck-sp"></span>${btn("Assign owner", "secondary", null, "sm")}${btn("Request review", "secondary", null, "sm")}</div></div>
      <div class="ck-grid ck-grid-2e">
        ${card("Risks · a new program", `<div class="ck-empty"><span class="ck-empty-i">${ic("empty")}</span><b>No risks yet</b><span class="ck-muted">Risks you raise from findings, or create here, are listed here.</span>${btn("Create risk", "primary", "plus", "sm")}</div>`)}
        ${card("Requirements · a search that finds nothing", `<div class="ck-toolbar ck-toolbar-0"><span class="ck-input ck-input-search">${ic("search")}<span class="ck-strong">gateway lock</span></span><span class="ck-pill ck-pill-rm">State: No evidence${ic("x")}</span></div><div class="ck-empty"><span class="ck-empty-i">${ic("search")}</span><b>No requirements match</b><span class="ck-muted">Nothing with No evidence matches "gateway lock". 286 requirements have No evidence.</span>${btn("Clear filters", "secondary", null, "sm")}</div>`)}
      </div>`;
    return frame("Evidence", main);
  }

  // Loading and failure: skeleton rows while a part loads, one page banner with Retry when a part fails
  function states() {
    const main = `${crumbs(["Programs", "PRG-1090"])}
      <div class="ck-ph"><div class="ck-ph-t"><h1>WS-X90 Sentinel Mission System</h1>${pill("PRG-1090")}</div><div class="ck-ph-a">${btn("More", "secondary", null)}${btn("Open the PDR package", "primary")}</div></div>
      <div class="ck-banner ck-banner-err">${ic("alert")}<div><b>Needs attention could not load.</b> The rest of the page is current.</div><span class="ck-sp"></span>${btn("Retry", "secondary", "refresh", "sm")}</div>
      ${tabs([["Overview"], ["Team", 15], ["Activity"]], "Overview")}
      <div class="ck-grid ck-grid-side">
        <div class="ck-stack">
          ${card("Lifecycle", `<div class="ck-phases">${Array.from({ length: 5 }, () => `<div class="ck-phase ck-phase-sk">${sk("40%")}${sk("90%")}${sk("60%")}</div>`).join("")}</div>
            <div class="ck-table-w"><table class="ck-table"><thead><tr><th>Step</th><th style="width:150px">Kind</th><th style="width:170px">Due or decided</th><th style="width:130px">Status</th><th style="width:80px">Ready</th></tr></thead><tbody>${["72%", "64%", "48%", "80%", "56%"].map((w) => `<tr><td>${sk(w)}</td><td>${sk("70%")}</td><td>${sk("60%")}</td><td>${sk("80px")}</td><td>${sk("36px")}</td></tr>`).join("")}</tbody></table></div>`, `<span class="ck-row ck-muted"><span class="ck-dots"><i></i><i></i><i></i></span>Loading the lifecycle</span>`)}
          ${card("Next gate", `${sk("50%")}<div class="ck-skel">${sk("92%")}${sk("84%")}${sk("88%")}</div>`)}
        </div>
        <div class="ck-stack">
          ${card("Details", `<dl class="ck-dl">${[["System", '<span class="ck-link">SYS-WSX90 · Platform</span>'], ["Host system", '<span class="ck-link">F-16 Block 70</span>'], ["Categorization", "C High · I High · A Moderate"], ["Next gate", "PDR · Nov 24"]].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`)}
          ${card("Needs attention", `<div class="ck-fail">${ic("alert")}<b>Could not load</b><span class="ck-muted">The counts are not shown as zero while they cannot be read.</span></div>`)}
          ${card("Team", `<div class="ck-skel">${Array.from({ length: 4 }, () => `<span class="ck-row"><i class="ck-sk ck-sk-av"></i>${sk("60%")}</span>`).join("")}</div>`)}
        </div>
      </div>`;
    return frame("Overview", main);
  }

  // The global search, opened over the page with results across records, saved views and commands
  function gsearch() {
    const q = "AC-17";
    const grp = (t, n, rows) => `<div class="ck-sr-g"><div class="ck-sr-gh"><b>${esc(t)}</b><span class="ck-muted">${n}</span></div>${rows.join("")}</div>`;
    const r = (icn, a, b, meta, on) => `<div class="ck-sr-r${on ? " on" : ""}"><span class="ck-sr-i">${ic(icn)}</span><span class="ck-t2"><span>${mark(a, q)}</span><span class="ck-t2b">${b}</span></span><span class="ck-sp"></span>${meta || ""}</div>`;
    const panel = `<span class="ck-gsearch ck-gsearch-on">${ic("search")}<span class="ck-strong">${q}</span><span class="ck-caret"></span><span class="ck-sp"></span>${iconBtn("x", "Clear search")}
      <div class="ck-sr" role="presentation">
        ${grp("Controls", "3", [r("shield", "AC-17(4) Privileged Commands and Access", "WS-X90 · in the Expanded control set assessment", status("Partially satisfied"), true), r("shield", "AC-17(3) Managed Access Control Points", "WS-X90", status("Satisfied")), r("shield", "AC-17(9) Disconnect or Disable Access", "WS-X90", status("Not assessed"))])}
        ${grp("Findings", "2", [r("flag", "AC-17(4) [03] privileged commands are authorized only for compelling needs", "Assessment finding · <mark>…</mark>out-of-window commands still admitted", status("Other than satisfied"))])}
        ${grp("Evidence", "4", [r("clip", "Remote access session log export", "Cited by REQ-011 for <mark>AC-17</mark> · Protected Network Gateway", status("Waiting on review"))])}
        ${grp("Saved views and commands", "", [r("list", "Controls in AC-17 with no evidence", "Saved view · Controls", ""), r("bolt", "Plan an assessment for AC-17(4)", "Command", `<kbd class="ck-kbd">↵</kbd>`)])}
        <div class="ck-sr-f"><span class="ck-muted"><kbd class="ck-kbd">↑</kbd><kbd class="ck-kbd">↓</kbd> to move · <kbd class="ck-kbd">↵</kbd> to open · <kbd class="ck-kbd">Esc</kbd> to close</span><span class="ck-sp"></span><span class="ck-link">See all 9 records</span></div>
      </div></span>`;
    const main = controls().match(/<main class="ck-main">([\s\S]*)<\/main>/)[1];
    return frameX("Controls", main, null, null, { search: panel, over: '<div class="ck-dim"></div>' });
  }

  // Three phone layouts at 390px: a record with overflow tabs, a register with an action bar, a record's comments
  function phones() {
    const top = `<div class="ckp-top">${ic("menu")}<span class="ck-logo"><b>PA</b></span><span class="ck-sp"></span>${iconBtn("search", "Search")}<span class="ck-av">IS</span></div>`;
    const phone = (cap, body, foot) => `<figure class="ckp"><div class="ckp-dev">${top}<div class="ckp-b">${body}</div>${foot || ""}</div><figcaption>${esc(cap)}</figcaption></figure>`;
    const ovtabs = (xs, on) => `<div class="ck-tabs ckp-tabs">${xs.map(([t, n]) => `<span class="ck-tab${t === on ? " on" : ""}">${esc(t)}${n != null ? count(n) : ""}</span>`).join("")}<span class="ck-tab ckp-more">More${ic("chev")}</span></div>`;
    const a = phone("Requirement record", `<div class="ck-crumbs"><span class="ck-link">…</span>${ic("right")}<span class="ck-link">Requirements</span>${ic("right")}<span>REQ-008</span></div>
      <h1 class="ckp-h1">AC Monitoring Requirement 008</h1><div class="ck-row">${pill("REQ-008")}${status("No evidence")}</div>
      <div class="ck-row">${btn("Edit requirement", "primary", null, "sm")}${iconBtn("more", "More actions")}</div>
      ${ovtabs([["Overview"], ["Controls", 2]], "Overview")}
      ${card("Statement", `<p class="ck-p0">The Platform Management Controller shall lock an operator session after 15 minutes of inactivity and record each lock in the audit log.</p>`)}
      ${card("Details", `<dl class="ckp-dl">${[["Owner", avatar("")], ["Source", "Engineering"], ["Components", "Platform Management Controller +1"]].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`)}`);
    const reqs = [[true, "REQ-004", "AC Monitoring Requirement 004", "No evidence"], [false, "REQ-005", "AC Enforcement Requirement 005", "Supported"], [true, "REQ-008", "AC Monitoring Requirement 008", "No evidence"], [false, "REQ-009", "AC Enforcement Requirement 009", "Supported"], [false, "REQ-012", "AC Monitoring Requirement 012", "No evidence"]];
    const b = phone("Requirements register", `<div class="ck-row"><h1 class="ckp-h1">Requirements</h1><span class="ck-sp"></span>${count(654)}</div>
      <span class="ck-input ck-input-search ckp-full">${ic("search")}<span>Search requirements</span></span>
      <div class="ck-row">${btn("Filters", "secondary", "filter", "sm")}${pill("No evidence", 286)}</div>
      <div class="ckp-list">${reqs.map(([on, id, t, s]) => `<div class="ckp-li${on ? " on" : ""}">${cb(on)}<span class="ck-t2"><span class="ck-t2a">${esc(id)}</span><span class="ck-t2b">${esc(t)}</span></span><span class="ck-sp"></span>${status(s)}</div>`).join("")}</div>`,
      `<div class="ckp-ab"><b>2 selected</b><span class="ck-sp"></span>${btn("Map control", "primary", null, "sm")}${iconBtn("more", "More actions")}</div>`);
    const c = phone("Risk record, comments", `<div class="ck-crumbs"><span class="ck-link">…</span>${ic("right")}<span class="ck-link">Risks</span></div>
      <h1 class="ckp-h1">A password on its own reaches WS&#8209;X90 at the flightline</h1><div class="ck-row">${status("Critical")}${avatar("")}</div>
      ${ovtabs([["Tasks", 4], ["Comments", 5]], "Comments")}
      <div class="ck-compose"><span class="ck-av">IS</span><div class="ck-compose-i"><span class="ck-muted">Write a comment</span></div></div>
      ${[["Ingrid Solberg", "Nov 12", "The squadron counts 6 laptops on the flightline. Two still run the older image without the CAC middleware."], ["Marcus Ryde", "Nov 14", "Does this block PDR on the 24th, or can it go to the POA&amp;M with a date?"]].map(([w, d, t]) => `<div class="ck-cm"><span class="ck-av">${esc(w.split(/\s+/).map((x) => x[0]).join(""))}</span><div class="ck-cm-b"><div class="ck-row"><b class="ck-strong">${esc(w)}</b><span class="ck-muted">${d}</span></div><p>${t}</p><div class="ck-row ck-cm-a"><span class="ck-link">Reply</span><span class="ck-link">Resolve</span></div></div></div>`).join("")}`);
    return `<div class="ck-app ckp-stage" style="width:${W}px">${a}${b}${c}</div>`;
  }

  // One brand colour across the tokens: the program overview with the primary palette set to Canvas indigo
  function theme() {
    return overview().replace('class="ck-app"', 'class="ck-app ck-theme-indigo"');
  }

  const SCREENS = [
    { id: "overview", title: "Program overview", draw: overview, route: "overview", notes: ["The global header and a side panel replace the bare top bar and list: the program's places get icons and the selected one takes the brand tint.", "Status reads as Canvas StatusIndicators (soft fill, strong text, an icon), so 'Passed' and 'In review' never rely on colour alone.", "One primary button per screen (Canvas rule): Open the PDR package. Everything else is Secondary or Tertiary.", "Cards take Canvas's container border, 8px corners and card padding; the attention numbers become tiles."] },
    { id: "controls", title: "Controls register", draw: controls, route: "controls", notes: ["Tabs carry their counts in Canvas count badges.", "The toolbar is one row: search input, an All filter, Selects, then More and the one primary action, all pill-shaped.", "The Canvas Table: raised header row, 1px dividers, roomier rows; Pagination at the foot instead of an endless list.", "Control IDs keep their monospace, in Roboto Mono."] },
    { id: "control", title: "Control record (AC-17(4))", draw: control, route: "control--AC-17(4)", notes: ["Previous and Next become Tertiary buttons with icons.", "The assessment that holds the control is a Canvas info Banner above the content, not a line of body text.", "Each section is a card with its count and its own Add, so the page reads as stacked cards beside a Details card.", "Long implementation text is clamped to four lines in the table; the full text opens on the row."] },
    { id: "evidence", title: "Evidence register", draw: evidence, route: "evidence", notes: ["The review states become a Segmented Control above the table, the quickest filter on this page.", "Owners show as Canvas Avatars with the name beside them.", "Requirement IDs that open a record are Hyperlinks (blue), following Canvas's 'buttons act, hyperlinks navigate'."] },
    { id: "findings", title: "Findings register", draw: findings, route: "findings", notes: ["Sources become tabs (All, Assessment, Operational, STIG rules, Vulnerabilities) instead of a filter menu.", "Saved states (Past due, On the POA&M, No owner) are Canvas Pills with counts.", "Severity uses the critical and caution StatusIndicators with an icon; past-due dates use Canvas's critical text colour."] },
    { id: "risks", title: "Risks register", draw: risks, route: "risks", notes: ["A row of tiles over the table counts risks by severity, without an owner, and past due.", "Technique IDs set in Roboto Mono.", "Create risk stays the one primary action."] },
    { id: "requirements", title: "Requirements register", draw: requirements, route: "requirements", notes: ["Sources become tabs (All, Engineering, CUSA-SSRD); the gap filters become Pills with counts.", "Rows are chosen with Checkboxes, and an ActionBar takes the foot of the table with Map control, Allocate and Assign owner.", "Each requirement reads as its ID in link blue over its title, so the code is never the only name."] },
    { id: "requirement", title: "Requirement record (REQ-470)", draw: requirement, route: "requirement--REQ-470", notes: ["The next step (nobody builds it) is a caution Banner with its action, not a line inside the page.", "Controls and evidence are cards with their counts and a Secondary add; Unmap is a Hyperlink-style tertiary action in the row.", "What the requirement leads to (issue, risk, remediation) is one compact list, each with its status.", "Edit history and comments fold into Expandables under Details."] },
    { id: "system", title: "System components", draw: system, route: "system", notes: ["The boundary's parts read as a tree table: subsystems open and close with a chevron, parts link to their records.", "A component behind its library version carries a caution StatusIndicator in the Library column.", "The authorization in force and what needs attention sit as two cards above the table."] },
    { id: "component", title: "Library component (Mission Computer)", draw: component, route: "component-mc", notes: ["The product library has its own side panel (Products, Components, Suppliers).", "The record's facts sit in one row under the title: owner Avatar, version, business line, set, cadence.", "Where used marks each consumer one version behind with a caution StatusIndicator; Send reminder is a Secondary with an icon.", "The waiting CVE offer is an InformationHighlight beside the control counts."] },
    { id: "assessments", title: "Assessments register", draw: assessments, route: "assessments", notes: ["Kinds become a Segmented Control (All, control assessments, cyber tests, monitoring checks).", "Progress is a ring with its count; an overdue cadence reads in critical text.", "Plan an assessment is the one primary; its form is a Canvas Modal (see Components)."] },
    { id: "documents", title: "Documents", draw: documents, route: "ssps", notes: ["Five attention tiles head the page; the expired agreements count in critical text.", "Each document's short code sits in a tile beside its title and what it implements.", "Editing now shows an Avatar group with a live dot; row actions are an IconButton that opens a Menu."] },
    { id: "authorization", title: "Authorization package", draw: authorization, route: "authorization", notes: ["Package readiness is a four-step stepper over the parts, with the next step in an info Banner.", "Every part's Not ready state is a StatusIndicator with an icon; the reason beside it is muted text.", "Conditions move onto the Package tab as a card, and who the package is shared with sits under the decision."] },
    { id: "mywork", title: "My work", draw: mywork, route: "my-work", notes: ["The workspace has its own side panel; My work is the selected item.", "Groups (Urgent, Needs my approval, Conditions to close…) are Expandables with Count badges, each with a toned icon.", "Every item can be ticked with a Checkbox, carries a Pill for its kind and an Avatar for who holds it.", "Finishing an item raises a Toast with Undo, bottom left."] },
    { id: "review", title: "Review queue", draw: reviewq, route: "review-queue", notes: ["Filters are Selects in one row with a tertiary Add filter; the register has no create action, as today.", "Each kind (gate, package, evidence, discussion) carries its own icon in the Kind column.", "Nobody named reads as Anyone, muted; a wait over 60 days turns critical."] },
    { id: "portfolio", title: "Programs (portfolio)", draw: portfolio, route: "portfolio", notes: ["Business lines become group rows with their owner, so a program reads under the line it belongs to.", "Controls satisfied is a percentage, a bar and its count in one cell; a change since the first snapshot reads in success green.", "A program past its next gate carries a critical Past due StatusIndicator beside its stage."] },
    { id: "products", title: "Products", draw: products, route: "products", notes: ["The update waiting for Customer A is an info Banner with Review update, above the tabs.", "Products and their configurations share one table: a product leads with its code tile, its configurations sit indented with a Pill.", "Each product version's assessment is a StatusIndicator with its day."] },
    { id: "campaign", title: "Assessment campaign (expanded control set)", draw: campaign, route: "campaign", notes: ["The campaign's tabs carry counts; Publish results is the one primary.", "Draft results get a caution Banner: a draft decides nothing.", "Each control's progress is a ring of objectives judged, and its determination a StatusIndicator with a Draft pill.", "A Progress card sums the determinations beside the Details."] },
    { id: "ssp", title: "System security plan (editor)", draw: ssp, route: "ssp", notes: ["A full-screen surface: its own header holds the revision Pill, a Draft status, collaborators as an Avatar group, Share and Submit for review.", "The editing toolbar uses Canvas's tertiary and icon buttons, with Assist at the end.", "Contents is a side list with caution dots where a section needs action; Gaps only is a Segmented Control.", "Comment threads sit in a right rail with Internal and Assessor tabs."] },
    { id: "team", title: "Program team", draw: team, route: "people", notes: ["Roles and People are two cards on the Team tab, each with its count and its own add.", "Who holds a role is an Avatar; you are marked with a Pill.", "SSP access is a small Select in the row."] },
    { id: "frameworks", title: "Frameworks & overlays", draw: frameworks, route: "frameworks", notes: ["Frameworks sit under Library in the workspace's side panel.", "With evidence and Satisfied become bars with their share; In WS-X90 is a ring.", "A baseline in WS-X90's stack wears an info StatusIndicator, a reference one a neutral one; the gap is a link."] },
    { id: "sctm", title: "SCTM workbook", draw: sctm, route: "sctm", notes: ["The workbook is a full-screen surface with List and Workbook as a Segmented Control in its header.", "Sort, Filter, Freeze, Fit and Copy are tertiary buttons; Review changes stays the primary and waits, disabled, until a change is staged.", "Implementation states are StatusIndicators inside the grid's cells; the sheets are tabs with counts at the foot."] },
    { id: "boundary", title: "Authorization boundary", draw: boundary, route: "boundary", notes: ["List and Boundary are a Segmented Control beside Add component.", "Providers, subsystems and connected systems are Canvas cards; the boundary is a dashed brand-tinted container.", "A provider or connection with no authorization or agreement carries a critical StatusIndicator, not only a line of text."] },
    { id: "stigs", title: "STIG checklists", draw: stigs, route: "stigs", notes: ["STIG checklists is one segment of the evidence kinds, not a separate filter.", "A newer STIG release shows as an info StatusIndicator beside the version Pill.", "Open CAT I, II and III are three toned counts; compliance is a bar and its share."] },
    { id: "collab", title: "Tasks, comments and activity (risk record)", draw: collab, now: false, route: "risks", notes: ["Tasks are a card on the record: a Checkbox to tick each one off, its assignee as an Avatar, its due day with a Due soon StatusIndicator, and progress as a bar (1 of 4 done).", "Comments start with a composer (Avatar, a text area that takes @ mentions, Mention and Attach icon buttons, Post comment); each comment has Reply and Resolve, replies sit indented under it, and resolved ones fold into an Expandable.", "Activity is a timeline in the side column: an icon a kind of change, who did what in a sentence, the moment in your time zone, and a Segmented Control for All, Changes or Comments.", "Edit risk stays the one primary; Post comment and Add task are secondary, so the page keeps one."] },
    { id: "preview", title: "Record preview in a side panel", draw: preview, now: false, route: "requirements", notes: ["The eye on a row opens Canvas's SidePanel at the right of Main; the register stays where it was, narrower, with the shown row highlighted.", "The panel's own header holds only Previous, Next, where you are (8 of 654), Open the full record and Close.", "Under it the record's header: its code Pill and status, its name, one small primary (Edit) and an overflow icon button.", "A gap the record has is a caution Banner with its fix (Link evidence), not a sentence in the body."] },
    { id: "forms", title: "Create and edit forms", draw: forms, now: false, route: "risks", notes: ["Create risk is a Canvas Modal over the register: FormFields with labels, a required star, hints and character counts.", "A submit with two answers missing shows an error Banner at the top naming each field as a link, and each field turns red with what fixes it under it.", "Likelihood and Impact are Selects; Owner is a search Combobox; Response due is a date input with its calendar icon.", "Edit risk response shows a save in flight: fields dimmed, the primary showing LoadingDots and Saving, and Cancel kept in place until it ends.", "Cancel is a tertiary button before the one primary, which repeats the operation (Create risk)."] },
    { id: "pickers", title: "Searchable pickers", draw: pickers, now: false, route: "requirements", notes: ["Owner is a Combobox: typed letters filter people and organizations, the match is highlighted, and each option says the person's role.", "Map controls is a MultiSelect: chosen controls are removable Pills in the input, options carry Checkboxes and their control status, and the foot counts matches and choices.", "A toolbar filter is a MultiSelect too: Severity · 2 in the button, counts beside each value, and Apply and Clear in the menu's foot.", "Link evidence searches a register that is paged on the server: each option says its version, review state and component, and the foot says only some are shown."] },
    { id: "tablestates", title: "Table features and empty states", draw: tablestates, now: false, route: "evidence", notes: ["Every column header is a sort button; the sorted one (Last version, newest first) is marked with its arrow and in bold.", "The header stays at the top as the table scrolls, with a shadow under it.", "Chosen rows take the brand tint; the ActionBar counts them and offers Select all 368, Clear and the verbs.", "An empty register shows an illustration, a title, one line and the same create action as its toolbar.", "A search with no results says what was asked, how many records the filter alone finds, and offers Clear filters, a different state from an empty register."] },
    { id: "states", title: "Loading and failure", draw: states, now: false, route: "overview", notes: ["While a card loads its rows are Skeleton bars in the table's own columns, with LoadingDots beside the card's heading.", "A part that fails says so once, in an error Banner at the top with Retry, and the rest of the page stays usable.", "The card that failed keeps its place and says Could not load; its counts are never shown as zero."] },
    { id: "search", title: "Global search", draw: gsearch, now: false, route: "controls", notes: ["The header's search opens a results panel over a dimmed page as you type (Canvas's SearchForm with a listbox).", "Results are grouped (Controls, Findings, Evidence, Saved views and commands), each with its icon, where it sits, its status and the match highlighted.", "A command (Plan an assessment for AC-17(4)) runs from the same list; the foot shows the keys and See all 9 records."] },
    { id: "phones", title: "Phone layouts", draw: phones, now: false, notes: ["At 390px the side panel folds into the header's menu; search and the avatar stay in the header.", "Breadcrumbs collapse to an ellipsis and the last two levels; tabs that do not fit fold into More.", "A register becomes a list of rows with Checkboxes, and the ActionBar sits at the bottom of the screen with the one primary and More.", "Comments keep the composer at the top and Reply and Resolve under each comment."] },
    { id: "theme", title: "Theming: one brand colour", draw: theme, now: false, route: "overview", notes: ["Canvas themes by its brand tokens: the program overview with the primary palette set to Canvas indigo, and nothing else changed.", "The primary button, the selected navigation item, the selected tab and its count, and the logo all take the brand colour.", "Links and status colours keep Canvas's own (the kit does not let a tenant theme them), so Satisfied stays green and a link stays a link."] },
  ];

  // The screens in the order a reader meets them, under a heading each.
  const GROUPS = [["The program", ["overview", "team", "system", "boundary", "authorization"]], ["Controls and requirements", ["controls", "control", "sctm", "requirements", "requirement"]], ["Evidence, documents and assessments", ["evidence", "stigs", "documents", "ssp", "assessments", "campaign"]], ["Findings and risks", ["findings", "risks"]], ["Workspace and library", ["portfolio", "mywork", "review", "products", "component", "frameworks"]], ["Patterns and states", ["collab", "preview", "forms", "pickers", "tablestates", "states", "search", "phones", "theme"]]];
  const inGroup = (ids) => ids.map((id) => SCREENS.find((s) => s.id === id)).filter(Boolean);
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
    ["Row selection", "Checkbox in the first column, and an ActionBar with the verbs"],
    ["Create and edit forms", "Modal with FormField, TextInput, TextArea and Select"],
    ["Toasts after a save", "Toast, with Undo where the change can be taken back"],
    ["Overflow menus", "IconButton opening a Menu; destructive items last, in red"],
    ["Provenance and history", "Expandable"],
    ["A fact that needs a second look", "InformationHighlight"],
    ["Loading rows", "Skeleton, and LoadingDots inside a button"],
    ["Collaborators", "Avatar group"],
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
    // A pattern with no screen of its own today (now: false) has no Today view; its button opens the nearest screen.
    const v = s.now === false ? "ck" : view[s.id] || "ck";
    return `<section class="ckba-pair" id="ckba-${s.id}">
      <div class="ba-ph"><div class="ba-ph-t"><h3 tabindex="-1">${esc(s.title)}</h3><div class="facts"><span class="num">${s.notes.length} changes</span>${s.now === false ? "<span>New pattern</span>" : ""}</div></div>
        <div class="btns">${s.now === false ? "" : `<div class="ba-switch" role="group" aria-label="Show ${esc(s.title)}">${[["ck", "Canvas Kit"], ["now", "Today"]].map(([k, l]) => `<button type="button" data-ckba-view="${s.id}:${k}" aria-pressed="${k === v}">${l}</button>`).join("")}</div>`}
        ${s.route ? `<button type="button" class="btn sm" data-ckba-open="${esc(s.route)}">${s.now === false ? "Open the nearest screen today" : "Open today's screen"}</button>` : ""}</div></div>
      <div class="ckba-stage">${v === "ck" ? `<div class="ckba-fit" data-ckba-fit>${s.draw()}</div>` : shot(s)}</div>
      <ol class="ckba-notes">${s.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ol>
    </section>`;
  }
  function draw() {
    const tabsHtml = S["before-after"] ? (() => { const t = document.createElement("template"); t.innerHTML = S["before-after"](); const el = t.content.querySelector(".ba-tabs"); if (el) el.querySelectorAll('[role="tab"]').forEach((x) => { const sel = x.dataset.go === ROUTE; x.setAttribute("aria-selected", String(sel)); x.classList.toggle("on", sel); }); return el ? el.outerHTML : ""; })() : "";
    const facts = `<span class="num">${SCREENS.length} screens</span><span>${GALLERY.length} components</span><span>Canvas Kit tokens 4.x</span><span>Mockups only</span>`;
    setTimeout(fit, 0);
    return `<div class="main ba ckba">${header("Before, v1, v2 and V3", facts, "")}${tabsHtml}
      <section class="drba-hero"><h2>Canvas Kit: the same screens, refreshed</h2>
        <p class="ba-lede">What the Vanta flow study would look like if the prototype adopted Workday's <b>Canvas Kit</b>: its type, colour, shape and depth tokens and its components. Each block is one screen with WS-X90's own data. <b>Canvas Kit</b> is the mockup; <b>Today</b> is the screen as it is now, with V3 on. Patterns and states shows what the kit adds that has no screen of its own today (tasks, comments and activity, the preview panel, forms, pickers, table and loading states, search, phones and theming), so those blocks have no Today view.</p>
        <p class="ba-lede drba-small">These are static mockups drawn on this page. Nothing in the prototype changes; Open today's screen takes you to the working one.</p>
        <nav class="drba-jump" aria-label="On this page"><a href="#${ROUTE}" data-ckba-jump="ckba-kit">What changes</a><a href="#${ROUTE}" data-ckba-jump="ckba-gal">Components</a><a href="#${ROUTE}" data-ckba-jump="ckba-map">Component map</a></nav>
        ${GROUPS.map(([g, ids]) => `<nav class="drba-jump ckba-jump-g" aria-label="${esc(g)}"><span class="ckba-jg">${esc(g)}</span>${inGroup(ids).map((s) => `<a href="#${ROUTE}" data-ckba-jump="ckba-${s.id}">${esc(s.title)}</a>`).join("")}</nav>`).join("")}
      </section>
      <h3 class="ba-sub" id="ckba-kit">What changes</h3>
      <div class="ckba-kit"><dl class="ckba-dl">${KIT.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>${kitSheet()}</div>
      <h3 class="ba-sub" id="ckba-gal">Components</h3>
      <p class="ba-lede drba-small">The Canvas Kit parts the screens below use, each drawn with WS-X90's words: forms, overlays, feedback and selection as well as the buttons and statuses above.</p>
      ${gallery()}
      <h3 class="ba-sub">Screens</h3>
      ${GROUPS.map(([g, ids]) => `<h4 class="ckba-g">${esc(g)}</h4>${inGroup(ids).map(block).join("")}`).join("")}
      <h3 class="ba-sub" id="ckba-map">Component map</h3>
      <p class="ba-lede drba-small">Each piece of today's prototype and the Canvas Kit component that would replace it.</p>
      <table class="drba-cov ckba-map"><tbody>${MAP.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</tbody></table>
      <div class="ba-method"><h3>Where this comes from</h3><p>Colours, type, shape, depth and space are Canvas Kit's own tokens (@workday/canvas-tokens-web 4.x, Apache-2.0), resolved into this page by ck/gen-tokens.py. Component choices follow the kit's design-principles guidance in canvas-kit-master (one primary action per view, buttons act and hyperlinks navigate, status never by colour alone). Roboto is bundled from Fontsource (OFL-1.1). The icons are simple strokes drawn for this page, not Canvas's icon set.</p></div>
    </div>`;
  }

  // Scale each 1440px mockup to the width of its column, as the Today screenshot is: the mockup keeps its desktop
  // layout and is drawn smaller, never reflowed. A transform (not CSS zoom, which mobile Safari lays out again and
  // whose text it inflates) scales the drawing; the frame takes the scaled height.
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => fit()) : null;
  function fit() {
    document.querySelectorAll("[data-ckba-fit]").forEach((el) => {
      const app = el.firstElementChild; if (!app) return;
      const z = Math.min(1, el.clientWidth / W);
      app.style.zoom = "";
      app.style.transformOrigin = "0 0";
      app.style.transform = z < 1 ? `scale(${z})` : "";
      el.style.height = `${Math.ceil(app.offsetHeight * z)}px`;
      if (ro && !app.dataset.ckbaObserved) { app.dataset.ckbaObserved = "1"; ro.observe(app); }
    });
  }
  window.addEventListener("resize", fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  document.addEventListener("click", (e) => {
    const v = e.target.closest("[data-ckba-view]");
    if (v) {
      e.preventDefault(); const [id, k] = String(v.dataset.ckbaView).split(":"); view[id] = k;
      const s = SCREENS.find((x) => x.id === id), sec = document.getElementById("ckba-" + id);
      if (s && sec) { const t = document.createElement("template"); t.innerHTML = block(s).trim(); const next = t.content.firstElementChild; sec.replaceWith(next); fit(); const b = next.querySelector(`[data-ckba-view="${id}:${k}"]`); if (b) b.focus({ preventScroll: true }); }
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
