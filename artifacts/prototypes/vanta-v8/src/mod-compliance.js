// mod-compliance: the control work and assessment. Baseline, Controls, Requirements, Checks, Policies,
// Assessments, the assessor's Campaign, Cyber T&E, AI drafts, Frameworks & overlays.
// Numbers come from the local database (WS-X90, read 17 Nov 2026) unless a row or screen says Example.
(() => {
  const { S, P, M, MODED, ROUTE_NAV, data, h } = window.PA;
  const { esc, fmt, pct, day, gl, pill, tag, who, bar, header, completion, attention, tools, views, table, page, pair, sevPill, dueOf, dueCell } = h;
// Read from the local database on 17 Nov 2026: WS-X90's reference baseline and each layer's recorded decisions.
  const HIGH_CODES = "AC-1 AC-2 AC-2(1) AC-2(2) AC-2(3) AC-2(4) AC-2(5) AC-2(11) AC-2(12) AC-2(13) AC-3 AC-4 AC-4(4) AC-5 AC-6 AC-6(1) AC-6(2) AC-6(3) AC-6(5) AC-6(7) AC-6(9) AC-6(10) AC-7 AC-8 AC-10 AC-11 AC-11(1) AC-12 AC-14 AC-17 AC-17(1) AC-17(2) AC-17(3) AC-17(4) AC-18 AC-18(1) AC-18(3) AC-18(4) AC-18(5) AC-19 AC-19(5) AC-20 AC-20(1) AC-20(2) AC-21 AC-22 AT-1 AT-2 AT-2(2) AT-2(3) AT-3 AT-4 AU-1 AU-2 AU-3 AU-3(1) AU-4 AU-5 AU-5(1) AU-5(2) AU-6 AU-6(1) AU-6(3) AU-6(5) AU-6(6) AU-7 AU-7(1) AU-8 AU-9 AU-9(2) AU-9(3) AU-9(4) AU-10 AU-11 AU-12 AU-12(1) AU-12(3) CA-1 CA-2 CA-2(1) CA-2(2) CA-3 CA-3(6) CA-5 CA-6 CA-7 CA-7(1) CA-7(4) CA-8 CA-8(1) CA-9 CM-1 CM-2 CM-2(2) CM-2(3) CM-2(7) CM-3 CM-3(1) CM-3(2) CM-3(4) CM-3(6) CM-4 CM-4(1) CM-4(2) CM-5 CM-5(1) CM-6 CM-6(1) CM-6(2) CM-7 CM-7(1) CM-7(2) CM-7(5) CM-8 CM-8(1) CM-8(2) CM-8(3) CM-8(4) CM-9 CM-10 CM-11 CM-12 CM-12(1) CP-1 CP-2 CP-2(1) CP-2(2) CP-2(3) CP-2(5) CP-2(8) CP-3 CP-3(1) CP-4 CP-4(1) CP-4(2) CP-6 CP-6(1) CP-6(2) CP-6(3) CP-7 CP-7(1) CP-7(2) CP-7(3) CP-7(4) CP-8 CP-8(1) CP-8(2) CP-8(3) CP-8(4) CP-9 CP-9(1) CP-9(2) CP-9(3) CP-9(5) CP-9(8) CP-10 CP-10(2) CP-10(4) IA-1 IA-2 IA-2(1) IA-2(2) IA-2(5) IA-2(8) IA-2(12) IA-3 IA-4 IA-4(4) IA-5 IA-5(1) IA-5(2) IA-5(6) IA-6 IA-7 IA-8 IA-8(1) IA-8(2) IA-8(4) IA-11 IA-12 IA-12(2) IA-12(3) IA-12(4) IA-12(5) IR-1 IR-2 IR-2(1) IR-2(2) IR-3 IR-3(2) IR-4 IR-4(1) IR-4(4) IR-4(11) IR-5 IR-5(1) IR-6 IR-6(1) IR-6(3) IR-7 IR-7(1) IR-8 MA-1 MA-2 MA-2(2) MA-3 MA-3(1) MA-3(2) MA-3(3) MA-4 MA-4(3) MA-5 MA-5(1) MA-6 MP-1 MP-2 MP-3 MP-4 MP-5 MP-6 MP-6(1) MP-6(2) MP-6(3) MP-7 PE-1 PE-2 PE-3 PE-3(1) PE-4 PE-5 PE-6 PE-6(1) PE-6(4) PE-8 PE-8(1) PE-9 PE-10 PE-11 PE-11(1) PE-12 PE-13 PE-13(1) PE-13(2) PE-14 PE-15 PE-15(1) PE-16 PE-17 PE-18 PL-1 PL-2 PL-4 PL-4(1) PL-8 PL-10 PL-11 PS-1 PS-2 PS-3 PS-4 PS-4(2) PS-5 PS-6 PS-7 PS-8 PS-9 RA-1 RA-2 RA-3 RA-3(1) RA-5 RA-5(2) RA-5(4) RA-5(5) RA-5(11) RA-7 RA-9 SA-1 SA-2 SA-3 SA-4 SA-4(1) SA-4(2) SA-4(5) SA-4(9) SA-4(10) SA-5 SA-8 SA-9 SA-9(2) SA-10 SA-11 SA-15 SA-15(3) SA-16 SA-17 SA-21 SA-22 SC-1 SC-2 SC-3 SC-4 SC-5 SC-7 SC-7(3) SC-7(4) SC-7(5) SC-7(7) SC-7(8) SC-7(18) SC-7(21) SC-8 SC-8(1) SC-10 SC-12 SC-12(1) SC-13 SC-15 SC-17 SC-18 SC-20 SC-21 SC-22 SC-23 SC-24 SC-28 SC-28(1) SC-39 SI-1 SI-2 SI-2(2) SI-3 SI-4 SI-4(2) SI-4(4) SI-4(5) SI-4(10) SI-4(12) SI-4(14) SI-4(20) SI-4(22) SI-5 SI-5(1) SI-6 SI-7 SI-7(1) SI-7(2) SI-7(5) SI-7(7) SI-7(15) SI-8 SI-8(2) SI-10 SI-11 SI-12 SI-16 SR-1 SR-2 SR-2(1) SR-3 SR-5 SR-6 SR-8 SR-9 SR-9(1) SR-10 SR-11 SR-11(1) SR-11(2) SR-12";
  const DEC_CNSSI = "+AC-12(1) +AC-12(2) +AC-16 +AC-16(6) +AC-16(7) +AC-17(10) +AC-17(6) +AC-17(9) +AC-2(7) +AC-2(9) +AC-20(3) +AC-23 +AC-3(4) +AC-6(8) +AT-2(4) +AT-2(5) +AT-2(6) +AT-3(1) +AT-3(2) +AT-6 +AU-11(1) +AU-14 +AU-14(1) +AU-14(3) +AU-16 +AU-16(1) +AU-16(2) +AU-4(1) -AU-5(2) +AU-6(4) +AU-9(5) +AU-9(6) +CA-7(3) +CA-7(5) +CA-7(6) +CA-8(3) +CM-10(1) +CM-11(2) +CM-14 +CM-3(5) +CM-3(7) +CM-3(8) +CM-5(5) +CM-5(6) +CM-7(3) +CM-7(8) +CM-7(9) -CP-10(4) -CP-2(2) -CP-2(5) -CP-3(1) -CP-4(2) -CP-6(2) -CP-7(4) -CP-8(3) -CP-8(4) -CP-9(2) -CP-9(3) +IA-10 +IA-12(1) -IA-12(5) +IA-2(6) +IA-3(1) +IA-4(9) +IA-5(13) +IA-5(14) +IA-5(16) +IA-5(7) +IA-5(8) +IA-9 +IR-4(10) +IR-4(12) +IR-4(13) +IR-4(14) +IR-4(3) +IR-4(6) +IR-4(7) +IR-4(8) +IR-6(2) +IR-7(2) +IR-9 +IR-9(2) +IR-9(3) +IR-9(4) +MA-3(4) +MA-3(5) +MA-3(6) +MA-4(1) +MA-4(4) +MA-4(6) +MA-4(7) +MA-6(1) -PE-11(1) -PE-15(1) -PE-18 +PE-22 +PE-23 +PE-8(3) +PL-7 +PL-8(1) +PL-8(2) +PL-9 +PS-3(4) +PS-4(1) +PS-6(3) +RA-10 +RA-3(2) +RA-3(3) +RA-5(10) +SA-10(1) +SA-10(3) +SA-10(7) +SA-11(1) +SA-11(2) +SA-15(7) +SA-3(1) +SA-3(2) +SA-3(3) +SA-4(3) +SA-4(7) +SA-8(1) +SA-8(10) +SA-8(11) +SA-8(12) +SA-8(13) +SA-8(14) +SA-8(15) +SA-8(16) +SA-8(17) +SA-8(18) +SA-8(19) +SA-8(2) +SA-8(20) +SA-8(21) +SA-8(22) +SA-8(23) +SA-8(24) +SA-8(25) +SA-8(26) +SA-8(27) +SA-8(28) +SA-8(29) +SA-8(3) +SA-8(30) +SA-8(31) +SA-8(32) +SA-8(4) +SA-8(5) +SA-8(6) +SA-8(7) +SA-8(8) +SA-8(9) +SA-9(1) +SA-9(3) +SA-9(8) -SC-12(1) +SC-16 +SC-16(1) +SC-16(2) +SC-16(3) +SC-18(1) +SC-18(2) +SC-18(3) +SC-18(4) +SC-23(1) +SC-23(3) +SC-23(5) +SC-28(3) +SC-38 +SC-41 +SC-45 +SC-45(1) +SC-47 +SC-5(1) +SC-5(2) +SC-5(3) +SC-7(10) +SC-7(11) +SC-7(12) +SC-7(13) +SC-7(14) +SC-7(15) +SC-7(25) +SC-7(28) +SC-7(29) +SC-7(9) +SC-8(2) +SI-10(3) +SI-10(5) +SI-10(6) +SI-12(3) +SI-15 +SI-2(3) +SI-2(4) +SI-2(6) +SI-21 +SI-3(10) +SI-4(1) +SI-4(11) +SI-4(15) +SI-4(16) +SI-4(19) +SI-4(23) +SI-4(24) +SI-4(25) +SI-6(3) +SI-7(10) +SI-7(17) +SI-7(8) +SI-7(9) +SR-3(1) +SR-3(2) +SR-3(3) +SR-4 +SR-5(1) +SR-5(2) +SR-6(1) +SR-7";
  const DEC_MISSION = "-AC-18 -AC-18(1) -AC-18(3) -AC-18(4) -AC-18(5) +SC-39 +SI-16 +SR-11";
  const DEC_DEPLOYED = "+CP-10 +MA-5 +PE-18";
  const DEC_CUSTA = "-AC-20 -AC-20(1) -AC-20(2) -AC-20(3) +CA-8 +RA-5";
  const DEC_TAILOR = "+AC-4(21) +CP-11 +CP-12 +CP-13 +SA-24 +SC-29 +SC-29(1) +SC-34 +SC-36 +SC-36(1) +SC-7(22) +SI-14 +SI-14(1) +SI-4(13)";
  const DEC_CUSA = "+AC-4(21) +CM-14 -PE-17 +SC-12(2) -SC-15 +SC-32 +SI-7(6) +SR-4";
  const TODAY = data.TODAY;
  const EX = '<span class="ex">Example</span>';
  const note = (t) => `<p class="note-p">${t}</p>`;
  const cut = (t, w = 420) => `<span class="compliance-cut" style="max-width:${w}px" title="${esc(t)}">${esc(t)}</span>`;
  const num = (n) => `<span class="num">${fmt(n)}</span>`;
  const of = (a, b) => `<span class="num">${fmt(a)} of ${fmt(b)}</span>`;
  const muted = (t) => `<span class="compliance-muted">${esc(t)}</span>`;
  const none = (t = "None") => `<span class="who">${gl("ring")}${esc(t)}</span>`;
  const tabs = (list, cur) => `<div class="tabsx compliance-tabs" role="tablist">${list
    .map(([r, l, n]) => `<span role="tab" tabindex="0" aria-selected="${r === cur}" data-go="${r}"${r === cur ? ' class="on"' : ""}>${esc(l)}${n != null ? ` <span class="ct num">${fmt(n)}</span>` : ""}</span>`)
    .join("")}</div>`;
  const sect = (title, count, body, action = "") => `<div class="sect"><div class="sh"><div class="compliance-sht">${esc(title)}${count != null ? `<span class="num">${fmt(count)}</span>` : ""}</div>${action}</div><div class="sb">${body}</div></div>`;
  const kv = (pairs) => `<dl class="kv">${pairs.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
  const phead = (title, actions = "") => `<div class="compliance-ph"><h4>${esc(title)}</h4><div class="compliance-pa">${actions}</div></div>`;
  const li = (glyph, text, end = "") => `<div class="compliance-li">${glyph ? gl(glyph) : ""}<span class="compliance-grow">${text}</span>${end ? `<span class="compliance-end">${end}</span>` : ""}</div>`;
  const btn = (label, attrs = "", ink = false) => `<button type="button" class="btn sm${ink ? " ink" : ""}" ${attrs}>${esc(label)}</button>`;
  const field = (label, control, hint = "") => `<div class="compliance-field"><span class="lb">${esc(label)}</span>${control}${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
  const doneBtn = (label, msg) => `<div class="compliance-foot"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-cmp="done" data-msg="${esc(msg)}">${esc(label)}</button></div>`;
  const codes = (list, max = 40) => `<div class="compliance-codes">${list.slice(0, max).map((c) => tag(c)).join("")}${list.length > max ? `<span class="compliance-sub">and ${list.length - max} more</span>` : ""}</div>`;
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const days = (iso) => Math.round((new Date(iso + "T12:00:00") - TODAY) / 86400000);
  let open = null; // the panel this module drew last: { kind, id, label }
  const mark = (kind, id, label) => { open = { kind, id, label }; return label; };

  // ——— Vocabulary ———
  const ST = {
    satisfied: ["ok", "Satisfied"], partially_satisfied: ["part", "Partially satisfied"], other_than_satisfied: ["bad", "Other than satisfied"],
    not_assessed: ["info", "Not assessed"], no_evidence: ["none", "No evidence"], no_requirement: ["none", "No requirement"],
  };
  const stPill = (s) => pill(ST[s][0], ST[s][1]);
  const RV = { accepted: ["ok", "Accepted"], pending: ["warn", "Pending review"], needs_revision: ["bad", "Needs revision"] };
  const rvPill = (r) => (RV[r] ? pill(RV[r][0], RV[r][1]) : none("No document"));
  const ELEMENTS = {
    "SYS-WSX90": "WS-X90 Sentinel Mission System", "CN-109001": "Mission Computing Subsystem", "CN-109002": "Navigation & Timing Subsystem", "CN-109003": "Communications Subsystem",
    "CN-109004": "Payload Interface Subsystem", "CN-109005": "Platform Management Subsystem", "CN-109006": "Ground Support Subsystem",
    "CN-109101": "Mission Computer", "CN-109102": "Secure Boot Controller", "CN-109103": "Cryptographic Services Module", "CN-109104": "Navigation Processor",
    "CN-109105": "Timing Receiver", "CN-109106": "Navigation Sensor Interface", "CN-109107": "Protected Network Gateway", "CN-109108": "Tactical Data Radio",
    "CN-109109": "Internal Ethernet Switch", "CN-109110": "Payload Interface Controller", "CN-109111": "Payload Safety Interlock", "CN-109112": "Payload Telemetry Unit",
    "CN-109113": "Platform Management Controller", "CN-109114": "Maintenance Access Gateway", "CN-109115": "Secure Storage Module", "CN-109116": "Update & Recovery Controller",
    "CN-109117": "Provisioning Workstation", "CN-109118": "Security Log Collector", "CN-109119": "Maintenance Laptop", "CN-109120": "Configuration Repository",
  };
  const elName = (c) => `${c} ${ELEMENTS[c] || ""}`.trim();
  const toast = (msg) => {
    const old = document.querySelector(".compliance-toast"); if (old) old.remove();
    const t = document.createElement("div"); t.className = "compliance-toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 3600);
  };

  // ════════════════════ Baseline ════════════════════
  // The stack, read from profile_resolutions: High, four overlays in order, then the program tailoring.
  const LAYERS = [
    { key: "cnssi", title: "CNSSI 1253 National Security System Allocation", kind: "Overlay", ver: 1, dec: DEC_CNSSI, params: 0, desc: "CNSSI 1253 (2022) allocates controls against confidentiality, integrity and availability independently. At C=high, I=high, A=moderate it selects 554 controls, adding 201 the SP 800-53B High baseline does not carry and withdrawing 17 it does." },
    { key: "mission", title: "Mission Assurance Overlay", kind: "Overlay", ver: 1, dec: DEC_MISSION, params: 0, desc: "Emphasizes isolation, integrity and supply-chain assurance; removes the wireless-specific requirement from this configuration." },
    { key: "deployed", title: "Deployed Platform Overlay", kind: "Overlay", ver: 1, dec: DEC_DEPLOYED, params: 0, desc: "Adds protections for deployed and fielded operation and controlled maintenance." },
    { key: "custa", title: "Customer A Tailoring", kind: "Overlay", ver: 1, dec: DEC_CUSTA, params: 0, desc: "Adds penetration testing and vulnerability monitoring while excluding external-system use for this isolated configuration." },
    { key: "tailor", title: "WS-X90 program tailoring", kind: "Tailoring", ver: null, dec: DEC_TAILOR, params: 5, desc: "The program's own last layer: 14 controls in for cyber resiliency and separation, and SA-24's five parameters set from the mission threat assessment." },
  ];
  const CUSA = { key: "cusa", title: "Customer A rail integration", kind: "Overlay", ver: 1, dec: DEC_CUSA, params: 0, desc: "What Customer A's CUSA-SSRD Rev C asks of the X800 on its rail launcher beyond the High baseline, and two controls that do not apply to a missile on a rail launcher." };
  const HIGH = HIGH_CODES.split(" ");
  const HIGHSET = new Set(HIGH);
  function derive(layers, off = new Set()) {
    const sel = new Set(HIGH);
    const rows = layers.map((L) => {
      if (off.has(L.key)) return { ...L, off: true, add: [], rem: [], re: [], total: sel.size };
      const add = [], rem = [], re = [];
      for (const d of L.dec.split(" ")) {
        const c = d.slice(1);
        if (d[0] === "+") { if (sel.has(c)) re.push(c); else { sel.add(c); add.push(c); } }
        else if (sel.has(c)) { sel.delete(c); rem.push(c); }
      }
      return { ...L, off: false, add, rem, re, total: sel.size };
    });
    return { rows, sel };
  }
  const SAVED = derive(LAYERS);
  const whatif = { off: new Set() };
  const fam = (c) => c.split("-")[0];
  function famCounts(sel) { const m = {}; for (const c of sel) m[fam(c)] = (m[fam(c)] || 0) + 1; return m; }

  const baseTabs = (cur) => tabs([["baseline", "Stack", 6], ["baseline-params", "Parameters", 1048]], cur);
  const baseHeader = () => header("Baseline", "<span>Reference <b>NIST SP 800-53 Rev 5 High</b></span><span>4 overlays · program tailoring last</span><span>SSP 2 published at <b>560</b></span>", `<a style="text-decoration:none" class="btn" href="#frameworks-gap">Gap assessment</a><button type="button" class="btn ink" data-modal="cmp-overlays">Edit overlays</button>`);
  S.baseline = () => {
    const cur = derive(LAYERS, whatif.off);
    const n = cur.sel.size;
    const more = [...cur.sel].filter((c) => !SAVED.sel.has(c)), fewer = [...SAVED.sel].filter((c) => !cur.sel.has(c));
    const offNames = cur.rows.filter((r) => r.off).map((r) => r.title);
    const rows = [{ id: "high", cells: [`<span class="num compliance-muted">0</span>`, "NIST SP 800-53 Rev 5 High baseline", tag("Baseline"), muted("—"), muted("—"), muted("—"), num(370), muted("Root")] }].concat(cur.rows.map((r, i) => ({
      id: r.key,
      cells: [`<span class="num compliance-muted">${i + 1}</span>`, esc(r.title) + (r.ver ? ` <span class="compliance-sub">version ${r.ver}</span>` : ""), tag(r.kind),
        r.off ? muted("Not applied") : `<span class="num" style="color:var(--ok)">+${r.add.length}</span>`, r.off ? "" : `<span class="num" style="color:${r.rem.length ? "var(--bad)" : "var(--ink-4)"}">−${r.rem.length}</span>`,
        r.off ? "" : num(r.params), `<b class="num" style="font-weight:600">${fmt(r.total)}</b>`,
        `<button type="button" class="compliance-sw" role="switch" aria-checked="${!r.off}" aria-label="Apply ${esc(r.title)}" data-cmp="whatif" data-id="${r.key}"></button>`],
    })));
    const fc = famCounts(cur.sel), sc = famCounts(SAVED.sel);
    const fams = Object.keys({ ...fc, ...sc }).sort((a, b) => (fc[b] || 0) - (fc[a] || 0) || a.localeCompare(b));
    const max = Math.max(...Object.values(fc));
    let tableHtml = table(["#", "Layer", "Type", "Added", "Removed", "Parameters", "Controls", "Apply"], rows, 6, "cmp-layer");
    tableHtml = tableHtml.replace(/<tr tabindex="0" data-panel="cmp-layer" data-id="(\w+)">/g, (m, k) => (cur.rows.find((r) => r.key === k && r.off) ? m.replace("<tr ", '<tr class="compliance-off" ') : m));
    return page(
      baseHeader(),
      pair(
        (() => { const fromHigh = [...cur.sel].filter((c) => HIGHSET.has(c)).length, added = n - fromHigh; return `<div class="card"><div class="t">Controls in the baseline <span>${whatif.off.size ? "what-if, not saved" : "after every layer"}</span></div><div class="big num">${fmt(n)}</div><div class="stack"><i style="width:${(fromHigh / n) * 100}%;background:var(--ink-3)"></i><i style="width:${(added / n) * 100}%;background:var(--info)"></i></div><div class="legend"><span style="--c:var(--ink-3)">From High ${fromHigh}</span><span style="--c:var(--info)">Added by layers ${added}</span><span style="--c:var(--line-strong)">High left out ${370 - fromHigh}</span></div><div class="minis"><div class="mini">Of the catalog's active<b class="num">${fmt(n)} of 1,014</b>${bar(pct(n, 1014), "var(--ink-3)")}</div><div class="mini">SSP 2 pinned at<b class="num">560</b>${bar(100, "var(--ink-3)")}</div><div class="mini">Parameters set<b class="num">5 of 1,048</b>${bar(1)}</div></div></div>`; })(),
        attention([["clock", "Assessments active: changes wait", 2], ["ring", "Parameters not set", 1043], ["ring", "Controls with no requirement", 14], ["ring", "Newer overlay versions", 0, true]], "Before you change it"),
      ),
      baseTabs("baseline"),
      whatif.off.size
        ? `<div class="next" role="status">${gl("info")}<span><b>What-if:</b> ${fmt(more.length)} more and ${fmt(fewer.length)} fewer controls than the saved baseline · ${esc(offNames.join(", "))} not applied. Nothing is saved.</span><button type="button" class="btn sm sp" data-cmp="whatif-reset">Back to saved</button></div>`
        : "",
      tableHtml,
      note("Each switch reads the stack without that layer: every layer after it applies again to what is beneath it, from the decisions it recorded. On WS-X90, Mission Assurance off reads 565, 5 more than the saved 560."),
      `<div class="card"><div class="t">${fmt(n)} controls after ${esc(cur.rows.filter((r) => !r.off).slice(-1)[0]?.title || "the reference baseline")} <span class="num">${fams.length} families</span></div><div class="compliance-fam">${fams
        .map((f) => { const a = fc[f] || 0, d = a - (sc[f] || 0); return `<div class="f"><b>${f}</b>${bar(max ? (a / max) * 100 : 0, "var(--ink-3)")}<span class="num">${a}${d ? ` <span class="d">${d > 0 ? "+" : "−"}${Math.abs(d)}</span>` : ""}</span></div>`; })
        .join("")}</div></div>`,
    );
  };
  P["cmp-layer"] = (id) => {
    const cur = derive(LAYERS, whatif.off);
    if (id === "high") return { label: mark("cmp-layer", id, "Layer preview"), body: `${phead("NIST SP 800-53 Rev 5 High baseline")}${kv([["Type", tag("Baseline")], ["Controls", num(370)], ["Source", "Electronic (OSCAL) version of NIST SP 800-53B, release 5.1.1"], ["In WS-X90", `${of(346, 370)} after the layers`]])}${sect("Left out by a layer", 24, codes(HIGH.filter((c) => !SAVED.sel.has(c))))}` };
    const r = cur.rows.find((x) => x.key === id) || cur.rows[0];
    const s = SAVED.rows.find((x) => x.key === id);
    return { label: mark("cmp-layer", id, "Layer preview"), body: `
      ${phead(r.title, `<button type="button" class="compliance-sw" role="switch" aria-checked="${!r.off}" aria-label="Apply ${esc(r.title)}" data-cmp="whatif" data-id="${r.key}"></button>`)}
      ${kv([["Type", tag(r.kind)], ["Version", r.ver ? `${r.ver} · ${pill("ok", "Published")}` : muted("The program's own")], ["Applies", r.off ? pill("none", "Not applied (what-if)") : pill("ok", "Applied")], ["Changes", `<span class="num">+${s.add.length} −${s.rem.length}</span> · ${fmt(s.total)} after it`], ["Parameters", num(r.params)]])}
      <p class="compliance-prose">${esc(r.desc)}</p>
      ${sect("Added", s.add.length, s.add.length ? codes(s.add) : muted("Nothing added"))}
      ${sect("Removed", s.rem.length, s.rem.length ? codes(s.rem) : muted("Nothing removed"))}
      ${s.re.length ? sect("Already selected", s.re.length, `${codes(s.re)}<span class="compliance-sub">Recorded as reaffirmed: the layer beneath already selects them.</span>`) : ""}` };
  };

  // Parameters: 1,048 in WS-X90's 560 controls; the tailoring sets SA-24's five, nothing else sets any.
  const PARAMS = [
    ["sa24-1", "SA-24_ODP[01]", "SA-24", "cyber resiliency goals", "Anticipate; Withstand; Recover; Adapt", "tailor"],
    ["sa24-2", "SA-24_ODP[02]", "SA-24", "cyber resiliency objectives", "Prevent or Avoid; Prepare; Continue; Constrain; Reconstitute; Understand", "tailor"],
    ["sa24-3", "SA-24_ODP[03]", "SA-24", "cyber resiliency techniques", "Adaptive Response; Analytic Monitoring; Coordinated Protection; Diversity; Non-Persistence; Privilege Restriction; Redundancy; Segmentation; Substantiated Integrity", "tailor"],
    ["sa24-4", "SA-24_ODP[04]", "SA-24", "implementation approaches", "Dynamic Reconfiguration; Monitoring and Damage Assessment; Sensor Fusion and Analysis; Calibrated Defense-in-Depth; Architectural Diversity; Design Diversity; Non-Persistent Services; and 8 more", "tailor"],
    ["sa24-5", "SA-24_ODP[05]", "SA-24", "design principles", "Focus on Common Critical Assets; Reduce Attack Surfaces; Assume Compromised Resources; Limit the Need for Trust; and 5 more", "tailor"],
    ["ra5-1", "RA-05_ODP[01]", "RA-5", "frequency (scan the system)", null, null, "Scan cadence"],
    ["ra5-2", "RA-05_ODP[02]", "RA-5", "frequency (when new vulnerabilities are reported)", null, null, "Scan cadence"],
    ["ra5-3", "RA-05_ODP[03]", "RA-5", "response times (remediate)", null, null, "IAVA/IAVB patch windows"],
    ["ra5-4", "RA-05_ODP[04]", "RA-5", "personnel or roles", null, null],
    ["si2", "SI-02_ODP", "SI-2", "time period (install security-relevant updates)", null, null, "IAVA/IAVB patch windows"],
    ["ac7", "AC-07_ODP[01]", "AC-7", "number (consecutive invalid logon attempts)", null, null],
    ["ac11", "AC-11_ODP[02]", "AC-11", "time period (inactivity before lock)", null, null],
    ["au11", "AU-11_ODP", "AU-11", "time period (retain audit records)", null, null],
    ["ca7", "CA-07_ODP[02]", "CA-7", "frequencies (monitor control effectiveness)", null, null],
    ["cm8", "CM-08_ODP[02]", "CM-8", "frequency (review the component inventory)", null, null],
  ];
  const TAILOR_WHY = "The program's cyber resiliency commitments, from the WS-X90 mission threat assessment and the Block 1 architecture review.";
  S["baseline-params"] = () => page(
    baseHeader(),
    pair(
      completion({ title: "Parameters set", total: 1048, done: 5, unit: "parameters set, all SA-24's", note: "1,043 read as the catalog's placeholder", minis: [["By the tailoring", 5, 1048], ["By an overlay", 0, 1048], ["Read by a check", 4, 0]] }),
      attention([["diamond", "Read by a check and not set", 4], ["ring", "Not set in a control an assessor judged", 475], ["ring", "Not set", 1043], ["check", "Set by the program tailoring", 5, true]], "Parameters to set"),
    ),
    baseTabs("baseline-params"),
    tools("Search parameters", ["Control family", "Set by", "Read by a check"]),
    table(["Parameter", "Control", "Value", "Set by", "Read by"], PARAMS.map(([id, lab, ctl, what, val, by, check]) => ({
      id, cells: [`<span class="num">${esc(lab)}</span> <span class="compliance-sub">${esc(what)}</span>`, tag(ctl), val ? cut(val, 320) : none("Not set"), by ? tag("Program tailoring") : muted("—"), check ? `<a class="compliance-link" href="#checks">${esc(check)}</a>` : muted("—")],
    })), 1048, "cmp-param"),
    note("Not set in a control an assessor judged counts the parameters of the 223 controls with a determination. Read by a check: the Checks screen compares what the system does against these values."),
  );
  P["cmp-param"] = (id) => {
    const p = PARAMS.find((x) => x[0] === id) || PARAMS[0];
    const [, lab, ctl, what, val, by, check] = p;
    return { label: mark("cmp-param", id, "Parameter preview"), body: `
      ${phead(`${lab} · ${what}`, btn(val ? "Edit value" : "Set value", `data-modal="cmp-param-set" data-id="${id}"`, true))}
      ${kv([["Control", tag(ctl)], ["Value", val ? esc(val) : none("Not set")], ["Set by", by ? "WS-X90 program tailoring" : muted("Nothing in the stack: the catalog prints a placeholder")], ["Read by", check ? `<a class="compliance-link" href="#checks">${esc(check)} check</a>` : muted("No check")]])}
      ${by ? sect("Rationale", null, `<span class="compliance-prose">${esc(TAILOR_WHY)}</span>`) : ""}
      ${!val && check ? `<div class="next">${gl("diamond")}<span>The ${esc(check)} check cannot pass until this is set: it has nothing to compare against.</span></div>` : ""}
      ${sect("Where it prints", null, `${esc(ctl)}'s statement and its assessment objectives show the value in place of the placeholder on the program's control record.`)}` };
  };
  M["cmp-param-set"] = (id) => {
    const p = PARAMS.find((x) => x[0] === id) || PARAMS[5];
    return { title: `${p[4] ? "Edit" : "Set"} ${p[1]}`, body: `
      ${field("Value", `<input class="compliance-in" value="${esc(p[0].startsWith("ra5-1") ? "every 30 days and after each software load" : p[4] || "")}" aria-label="Value">`, `${esc(p[2])} · ${esc(p[3])}`)}
      ${field("Rationale", `<textarea class="compliance-ta" aria-label="Rationale">${p[4] ? esc(TAILOR_WHY) : ""}</textarea>`, "Required. It is recorded on the program tailoring beside the value.")}
      ${note("The value is set on WS-X90 program tailoring, the stack's last layer, so it wins over any value beneath it.")}`, footer: doneBtn(p[4] ? "Edit value" : "Set value", `${p[1]} set on WS-X90 program tailoring (prototype: nothing is saved)`) };
  };

  // Edit overlays: add Customer A rail integration after Customer A Tailoring, the tailoring last.
  M["cmp-overlays"] = () => {
    const next = derive([...LAYERS.slice(0, 4), CUSA, LAYERS[4]]);
    const after = next.sel.size, cusa = next.rows[4], tailor = next.rows[5];
    const moot = DEC_TAILOR.split(" ").map((d) => d.slice(1)).filter((c) => !tailor.add.includes(c));
    const row = (i, r, isNew) => `<tr${isNew ? ' class="compliance-new"' : ""}><td class="num">${i}</td><td>${esc(r.title)}${isNew ? " " + pill("ok", "Added") : ""}</td><td>${esc(r.kind)}</td><td class="num">+${r.add.length}</td><td class="num">−${r.rem.length}</td><td class="num"><b>${fmt(r.total)}</b></td><td>${r.kind === "Overlay" ? `<button type="button" class="compliance-iconbtn" aria-label="Move ${esc(r.title)} earlier">↑</button> <button type="button" class="compliance-iconbtn" aria-label="Move ${esc(r.title)} later">↓</button> <button type="button" class="compliance-iconbtn" aria-label="Remove ${esc(r.title)}">✕</button>` : `<span class="compliance-sub">Stays last</span>`}</td></tr>`;
    return { title: "Edit overlays", body: `
      <div class="compliance-refuse" role="alert"><b>${gl("clock")} This change waits: 2 assessments are active</b>
        <div class="compliance-li"><span class="compliance-grow">WS-X90 Expanded Control Set Assessment</span><span class="compliance-end">ends Nov 20</span></div>
        <div class="compliance-li"><span class="compliance-grow">WS-X90 continuous monitoring — FY2027</span><span class="compliance-end">draft plan holds 10 objectives</span></div>
        <span class="compliance-sub" style="color:var(--ink-2)">Changing what the program owes mid-assessment would move controls out from under the assessor. Save it as a what-if, or apply it once the expanded assessment closes.</span></div>
      <div style="min-width:0"><div class="compliance-minibox"><table class="compliance-mini"><thead><tr><th>#</th><th>Layer</th><th>Type</th><th class="num">Added</th><th class="num">Removed</th><th class="num">Controls</th><th></th></tr></thead><tbody>
        <tr><td class="num">0</td><td>NIST SP 800-53 Rev 5 High baseline</td><td>Baseline</td><td></td><td></td><td class="num"><b>370</b></td><td></td></tr>
        ${next.rows.map((r, i) => row(i + 1, r, r.key === "cusa")).join("")}</tbody></table></div></div>
      <div><button type="button" class="btn sm">Add overlay ▾</button></div>
      <div class="sect"><div class="sh"><div class="compliance-sht">What changes</div></div><div class="sb">${kv([
        ["Controls", `<b class="num" style="font-weight:600">${fmt(SAVED.sel.size)} → ${fmt(after)}</b>`],
        ["Added", codes(cusa.add)],
        ["Removed", codes(cusa.rem)],
        ["Already selected", `${codes(cusa.re)}`],
        ["Program tailoring", `Carried, last. ${moot.length ? `${moot.join(", ")} no longer changes anything there and is left out.` : ""}`],
        ["Systems", "SYS-WSX90 follows the program profile: it moves with it"],
        ["SSP revisions", "SSP 2 (published, 560) and SSP 3 (draft, 560) keep the baseline they were pinned to"],
      ])}</div></div>`,
      footer: `<div class="compliance-foot"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn" data-cmp="done" data-msg="Saved as a what-if: ${fmt(SAVED.sel.size)} → ${fmt(after)} controls (prototype: nothing is saved)">Save as what-if</button><button type="button" class="btn ink compliance-dis" aria-disabled="true" title="Waits until the active assessments close">Edit overlays</button></div>` };
  };

  // ════════════════════ Controls ════════════════════
  // program_control_status, program_control_objectives and assurance_trace for WS-X90.
  const CTRL = {
    "AC-1": { t: "Policy and Procedures", s: "partially_satisfied", o: 17, m: 17, e: 17, a: 17, req: [["REQ-436", "Access control policy and procedure baseline held under signature", 1]], ev: [["WS-X90 access control policy and procedure baseline, revision 3.2, LRU-020 signed export", "needs_revision"]], f: ["partially_satisfied"], iss: ["Seven access control procedures in field packages carry no current owner signature (AC-1)", "moderate"], rsk: "A disallowed session survives at the boundary while field procedures go unsigned", poam: "Terminate failed-inspection sessions and reissue the unsigned access procedures", el: ["CN-109120", "CN-109117"] },
    "AC-2": { t: "Account Management", s: "satisfied", o: 26, m: 26, e: 26, a: 26, req: [["REQ-001", "AC Enforcement Requirement 001", 1], ["REQ-075", "AC Configuration Requirement 075", 1]], ev: [["Evidence for REQ-001", "accepted"], ["Evidence for REQ-075", "accepted"]], f: ["satisfied"], el: ["CN-109101", "CN-109107", "CN-109002", "CN-109119"] },
    "AC-2(5)": { t: "Inactivity Logout", s: "no_evidence", o: 1, m: 1, e: 0, a: 0, req: [["REQ-442", "Technicians log out at the end of the standard work period", 0]], ev: [], f: [], el: ["CN-109117", "CN-109119"] },
    "AC-2(7)": { t: "Privileged User Accounts", s: "not_assessed", o: 4, m: 4, e: 4, a: 0, req: [["REQ-443", "Platform privilege is carried by named roles, never attached to an account", 1]], ev: [["Privileged role table and membership change log export, LRU-013", "pending"]], f: [], el: ["CN-109101", "CN-109113"] },
    "AC-11": { t: "Device Lock", s: "other_than_satisfied", o: 2, m: 2, e: 2, a: 2, req: [["REQ-008", "AC Monitoring Requirement 008", 0], ["REQ-082", "AC Verification Requirement 082", 1]], ev: [["Evidence for REQ-082", "accepted"]], f: ["other_than_satisfied"], iss: ["Unmet requirement REQ-008", "high"], rsk: "Risk arising from REQ-008", poam: "Remediate REQ-008", el: ["CN-109107", "CN-109113", "CN-109114"] },
    "AU-7": { t: "Audit Record Reduction and Report Generation", s: "satisfied", o: 4, m: 4, e: 4, a: 4, inh: 4, req: [["REQ-353", "On-demand audit reduction that does not alter the source records", 1]], ev: [["Audit report generation non-alteration test report, LRU-018", "pending"]], f: [], el: ["CN-109118"] },
    "AU-10": { t: "Non-repudiation", s: "other_than_satisfied", o: 1, m: 1, e: 1, a: 1, req: [["REQ-360", "Payload arm and release commands are signed at origin", 1], ["REQ-361", "Signing key custody and signature verification on ingest", 0]], ev: [["Payload command signature test report, LRU-010 with LRU-011 and LRU-003", "needs_revision"]], f: ["other_than_satisfied"], iss: ["Payload arm and release commands signed under a rotated key cannot be verified at all (AU-10)", "critical"], rsk: "Payload arm and release records become unverifiable as signing keys rotate", poam: "Publish the retired key history and reissue the audit direction", el: ["CN-109103", "CN-109110", "CN-109111", "CN-109118"] },
    "IA-2(2)": { t: "Multi-factor Authentication to Non-privileged Accounts", s: "not_assessed", o: 1, m: 1, e: 1, a: 0, req: [["REQ-599", "Hardware credential and PIN for non-privileged ground support sessions", 1]], ev: [["Non-privileged authentication method inventory, LRU-019 and LRU-017 baselines", "needs_revision"]], f: [], draft: "other_than_satisfied", iss: ["Disconnected Maintenance Laptop still offers a password-only logon on the flightline (IA-2(2))", "critical"], rsk: "A password on its own reaches WS-X90 at the flightline", poam: "Remove the password-only path and make the switch exchange mutual", el: ["CN-109117", "CN-109119"] },
    "IA-5": { t: "Authenticator Management", s: "other_than_satisfied", o: 10, m: 10, e: 10, a: 10, req: [["REQ-039", "IA Configuration Requirement 039", 1], ["REQ-113", "IA Enforcement Requirement 113", 1]], ev: [["Evidence for REQ-039", "needs_revision"], ["Evidence for REQ-113", "accepted"]], f: ["other_than_satisfied", "satisfied"], iss: ["Unmet requirement REQ-039 (closed)", "high"], rsk: "Risk arising from REQ-039", poam: "Remediate REQ-039 (completed)", el: ["CN-109101", "CN-109107", "CN-109114", "CN-109117"] },
    "RA-5": { t: "Vulnerability Monitoring and Scanning", s: "satisfied", o: 10, m: 10, e: 10, a: 10, req: [["REQ-054", "RA Verification Requirement 054", 1]], ev: [["Evidence for REQ-054", "accepted"]], f: ["satisfied"], el: ["CN-109113", "CN-109118", "CN-109120"], cve: true },
    "SC-5(3)": { t: "Detection and Monitoring", s: "other_than_satisfied", o: 2, m: 2, e: 2, a: 2, req: [["REQ-200", "Boundary counters exported and alerted on connection-rate excursions", 1]], ev: [["Boundary counter export sample, LRU-007 to LRU-018, one-hour capture with excursion", "needs_revision"]], f: ["other_than_satisfied"], iss: ["Session-table occupancy missing from the gateway counter export (SC-5(3))", "high"], rsk: "Low-rate exhaustion and unattributable egress at the WS-X90 external boundary", poam: "Restore state-level visibility and operator attribution at the boundary gateway", el: ["CN-109107", "CN-109118"] },
    "SI-2": { t: "Flaw Remediation", s: "not_assessed", o: 10, m: 10, e: 10, a: 0, req: [["REQ-064", "SI Monitoring Requirement 064", 1]], ev: [["Account disable trigger test report - expiry, disassociation and policy violation, LRU-013", "accepted"]], f: [], plan: true, el: ["CN-109116"], cve: true },
    "SI-4(13)": { t: "Analyze Traffic and Event Patterns", s: "no_requirement", o: 6, m: 3, e: 0, a: 0, req: [["REQ-262", "Outbound traffic profiled per mission phase for anomalies", 0]], ev: [], f: [], el: ["CN-109107", "CN-109108"] },
    "SA-24": { t: "Design For Cyber Resiliency", s: "no_requirement", o: 10, m: 0, e: 0, a: 0, req: [], ev: [], f: [], el: [] },
  };
  // The other controls the program tailoring added, which no requirement maps yet.
  const NOREQ = [["AC-4(21)", "Physical or Logical Separation of Information Flows", 2], ["CP-11", "Alternate Communications Protocols", 1], ["CP-12", "Safe Mode", 1], ["CP-13", "Alternative Security Mechanisms", 1], ["SC-7(22)", "Separate Subnets for Connecting to Different Security Domains", 1], ["SC-29", "Heterogeneity", 1], ["SC-29(1)", "Virtualization Techniques", 1], ["SC-34", "Non-modifiable Executable Programs", 2], ["SC-36", "Distributed Processing and Storage", 2], ["SC-36(1)", "Polling Techniques", 2], ["SI-14", "Non-persistence", 2], ["SI-14(1)", "Refresh from Trusted Sources", 1]];
  for (const [c, t, o] of NOREQ) CTRL[c] = { t, s: "no_requirement", o, m: 0, e: 0, a: 0, req: [], ev: [], f: [], el: [] };

  function nextStep(code, c) {
    if (c.s === "satisfied") return null;
    if (c.s === "no_requirement") return c.m ? { g: "ring", l: `Map ${c.o - c.m} more objectives`, why: `${c.m} of ${c.o} objectives are mapped, by ${c.req[0][0]}; the rest are covered on no system.`, a: `data-modal="cmp-map" data-id="${code}"` } : { g: "ring", l: "Map a requirement", why: "No requirement of WS-X90 maps it, on SYS-WSX90 or anywhere inside it.", a: `data-modal="cmp-map" data-id="${code}"` };
    if (c.s === "no_evidence") { const r = c.req.find((x) => !x[2]) || c.req[0]; return { g: "ring", l: `Link evidence to ${r[0]}`, why: `${r[0]} maps it and cites no evidence.`, a: `data-modal="cmp-link-ev" data-id="${code}"` }; }
    if (c.s === "not_assessed") return c.plan ? { g: "clock", l: "Open assessment campaign", why: "WS-X90 continuous monitoring — FY2027: its draft plan holds all 10 objectives.", href: "#assessments-plans" } : { g: "clock", l: "Add to assessment campaign", why: `Evidence covers ${c.e} of ${c.o} objectives and no assessor has judged them. Continuous monitoring FY2027 has a draft plan.`, a: `data-modal="cmp-add-camp" data-id="${code}"` };
    return { g: "diamond", l: "Open assessment findings", why: `Published results say ${ST[c.s][1].toLowerCase()}.`, href: "#findings" };
  }
  const stepCell = (code, c) => { const n = nextStep(code, c); return n ? `<span class="who">${gl(n.g)}<span style="color:var(--ink)">${esc(n.l)}</span></span>` : (c.inh ? `<span class="who">${gl("check")}Inherited</span>` : muted("None")); };
  const stepBox = (code, c) => {
    const n = nextStep(code, c);
    if (!n) return c.inh ? "" : `<div class="next">${gl("check")}<span>Satisfied: no next step.</span></div>`;
    const action = n.href ? `<a style="text-decoration:none" class="btn sm ink" href="${n.href}">${esc(n.l)}</a>` : `<button type="button" class="btn sm ink" ${n.a}>${esc(n.l)}</button>`;
    return `<div class="next compliance-next">${gl(n.g)}<div class="compliance-nt"><span class="compliance-sub">Next step</span><span>${esc(n.why)}</span></div>${action}</div>`;
  };
  const rung = (label, n, total) => `<div class="compliance-rung">${gl(n === total ? "check" : n ? "part" : "ring")}<span>${esc(label)}</span><b class="num">${fmt(n)} of ${fmt(total)}</b>${bar(total ? pct(n, total) : 0)}</div>`;
  const ladder = (c) => `<div class="compliance-ladder">${rung("Objectives mapped", c.m, c.o)}${rung("With evidence", c.e, c.o)}${rung("Assessed", c.a, c.o)}</div>`;
  const stage = (label, n, gapWord) => `<div class="compliance-stage${n ? "" : " gap"}"><small>${esc(label)}</small><b class="num">${n ? fmt(n) : esc(gapWord)}</b></div>`;
  const traceStrip = (c) => `<div class="compliance-trace" aria-label="Trace">${stage("Requirements", c.req.length, "None")}${stage("Evidence", c.ev.length, "None")}${stage("Findings", c.f.length, c.draft ? "Draft" : "None")}${stage("POA&M", c.poam ? 1 : 0, "None")}${stage("Risks", c.rsk ? 1 : 0, "None")}</div>`;
  P.control = (id) => {
    const code = CTRL[id] ? id : "SI-2";
    const c = CTRL[code];
    const det = c.inh ? `${pill("ok", "Component assessment")}` : c.a === c.o && c.a ? "Program assessment" : muted("Nobody yet");
    return { label: mark("control", code, "Control preview"), body: `
      ${phead(`${code} ${c.t}`, code === "SI-2" ? `<a style="text-decoration:none" class="btn sm" href="#control-si2">Open record</a>` : "")}
      ${kv([["Status", stPill(c.s)], ["Determined by", det], ["Family", tag(fam(code))], ["Requirements", c.req.length ? c.req.map((r) => tag(r[0])).join(" ") : none("None map it")]])}
      ${c.inh ? `<div class="next">${gl("check")}<span><b style="font-weight:600">Decided by Audit Log Collector 1</b> · G25 launch control component set version 1 component assessment, published. ${c.inh} of ${c.o} objectives inherited on CN-109118 Security Log Collector.</span><a class="sp compliance-link" href="#components">Open →</a></div>` : ""}
      ${stepBox(code, c)}
      ${sect("Where it stands", c.o, ladder(c), `<span class="compliance-sub">by objective</span>`)}
      ${sect("By system", 1, `${li(c.m === c.o ? "check" : c.m ? "part" : "ring", `SYS-WSX90 · boundary`, `${c.m} mapped · ${c.e} with evidence`)}${c.el.length ? `<span class="compliance-sub">Its requirements stand on ${c.el.length} element${c.el.length > 1 ? "s" : ""}</span>${c.el.map((e) => li("", esc(elName(e)))).join("")}` : `<span class="compliance-sub">No requirement places it on an element yet.</span>`}`)}
      ${sect("Trace", null, traceStrip(c))}
      ${c.req.length ? sect("Requirements", c.req.length, c.req.map(([r, t, ev]) => li(ev ? "check" : "ring", `<b style="font-weight:500">${esc(r)}</b> ${esc(t)}`, ev ? `${ev} evidence` : "No evidence")).join("")) : ""}
      ${c.ev.length ? sect("Evidence", c.ev.length, c.ev.map(([t, r]) => li("", esc(t), rvPill(r))).join("")) : ""}
      ${c.f.length || c.draft ? sect("Findings", c.f.length, c.f.map((d) => li("", "Published results, judged on its statement", stPill(d))).join("") + (c.draft ? li("info", "Interim results, increment 2 (draft): decides nothing until published", stPill(c.draft)) : "")) : ""}
      ${c.iss ? sect("Downstream", 3, `${li("diamond", esc(c.iss[0]), sevPill(c.iss[1]))}${li("clock", esc(c.rsk), "Risk")}${li("clock", esc(c.poam), "POA&M")}`) : ""}
      ${c.cve ? `<div class="next">${gl("diamond")}<span>CVE-2024-6387 names ${esc(code)}: WS-X90's operational issue for it is open, high.</span><a class="sp compliance-link" href="#checks">Check →</a></div>` : ""}` };
  };
  const CONTROL_ROWS = ["AC-1", "AC-2", "AC-2(5)", "AC-2(7)", "AC-11", "AU-7", "AU-10", "IA-2(2)", "IA-5", "RA-5", "SC-5(3)", "SI-2", "SI-4(13)", "SA-24"];
  S.controls = () => page(
    header("Controls", "<span>SSP 3 draft · 560 controls in the baseline</span><span>1,791 assessment objectives</span>", `<span class="btn">Export ▾</span><span class="btn">Publish SSP 3</span><button type="button" class="btn ink" data-modal="cmp-map" data-id="SA-24">Map a requirement</button>`),
    pair(
      completion({ title: "Controls satisfied", total: 560, done: 176, unit: "controls", minis: [["Mapped", 546, 560], ["With evidence", 313, 560], ["Assessed", 223, 560]] }),
      attention([["diamond", "Short of satisfied", 47], ["clock", "Not assessed", 90], ["ring", "No evidence", 233], ["ring", "No requirement", 14], ["ring", "No owner", "—", true]]),
    ),
    views([["All", 560], ["Needs evidence", 233], ["Not assessed", 90], ["Short of satisfied", 47], ["Inherited", 2]]),
    tools("Search controls", ["Family", "Status", "Determined by"]),
    table(["Control", "Status", "Objectives with evidence", "Next step", "Requirement"], CONTROL_ROWS.map((k) => { const c = CTRL[k]; return { id: k, cells: [cut(`${k} ${c.t}`, 340), stPill(c.s), of(c.e, c.o), stepCell(k, c), c.req.length ? tag(c.req[0][0]) : none()] }; }), 560, "control"),
    note("Statuses, objectives and next steps are WS-X90's, from program_control_status: a control climbs by its assessment objectives, counted on every system that selects it."),
  );

  // SI-2's full record, for going deep.
  const si2Tabs = (cur) => tabs([["control-si2", "Implementation"], ["control-si2-requirements", "Requirements", 1], ["control-si2-evidence", "Evidence", 1], ["control-si2-assessment", "Assessment", 10], ["control-si2-findings", "Findings", 1]], cur);
  const SI2_OBJ = [["SI-02a.[01]", "system flaws are identified"], ["SI-02a.[02]", "system flaws are reported"], ["SI-02a.[03]", "system flaws are corrected"], ["SI-02b.[01]", "software updates related to flaw remediation are tested for effectiveness before installation"], ["SI-02b.[02]", "software updates related to flaw remediation are tested for potential side effects before installation"], ["SI-02b.[03]", "firmware updates related to flaw remediation are tested for effectiveness before installation"], ["SI-02b.[04]", "firmware updates related to flaw remediation are tested for potential side effects before installation"], ["SI-02c.[01]", "security-relevant software updates are installed within [time period] of the release of the updates"], ["SI-02c.[02]", "security-relevant firmware updates are installed within [time period] of the release of the updates"], ["SI-02d.", "flaw remediation is incorporated into the organizational configuration management process"]];
  const cveDue = dueOf("2026-10-10", "high");
  const si2Page = (cur, ...body) => page(
    `<div class="compliance-trail"><a href="#controls">Controls</a><span>›</span><span>SI-2</span></div>`,
    header("SI-2 Flaw Remediation", `<span>Status ${stPill("not_assessed")}</span><span>Objectives <b>10 of 10</b> with evidence · <b>0</b> assessed</span><span>Implementation <b>Partial</b> in SSP 3</span><span>Requirement <b>REQ-064</b></span>`, `<span class="btn">⋯</span><button type="button" class="btn ink" data-modal="cmp-link-ev" data-id="SI-2">Add evidence</button>`),
    stepBox("SI-2", CTRL["SI-2"]),
    `<div class="next">${gl("diamond")}<span><b style="font-weight:600">CVE-2024-6387</b> (regreSSHion, high) names SI-2 and RA-5. WS-X90's operational issue is open: ${dueCell(cveDue)}.</span><a class="sp compliance-link" href="#checks">Open check →</a></div>`,
    traceStrip(CTRL["SI-2"]),
    si2Tabs(cur),
    ...body,
  );
  S["control-si2"] = () => si2Page("control-si2",
    `<div class="compliance-row2"><div class="card"><div class="t">Implementation in SSP 3 <span>${pill("part", "Partial")}</span></div>
      <p class="compliance-prose">The SYS-WSX90 satisfies the tailored intent of SI-2 through a combination of system-level procedures and mapped component implementations. This narrative is synthetic demo content.</p>
      <div class="next">${gl("ring")}<span>Template text: 546 of SSP 3's 560 narratives read like this one.</span><a class="sp compliance-link" href="#ai-drafts">Draft with AI →</a></div></div>
      <div class="card"><div class="t">Parameter</div>${kv([["SI-02_ODP", none("Not set")], ["Asks", "time period to install security-relevant updates"], ["Read by", `<a class="compliance-link" href="#checks">Patch windows check</a>`]])}<div><a style="text-decoration:none" class="btn sm" href="#baseline-params">Set in Baseline</a></div></div></div>`,
    `<h4 class="subhead">Assessment objectives</h4>`,
    table(["Objective", "Text", "Mapped", "With evidence", "Assessed"], SI2_OBJ.map(([l, t]) => ({ id: "SI-2", cells: [`<span class="num">${esc(l)}</span>`, cut(t, 460), pill("ok", "Mapped"), pill("ok", "Evidenced"), pill("info", "Not assessed")] })), 10, "control"),
  );
  S["control-si2-requirements"] = () => si2Page("control-si2-requirements",
    table(["Requirement", "Title", "Allocated to", "Maps", "Evidence"], [{ id: "REQ-064", cells: ["REQ-064", "SI Monitoring Requirement 064", tag("CN-109116 Update & Recovery Controller"), `${tag("SI-2")} ${tag("SI-10")} <span class="compliance-sub">whole controls</span>`, num(1)] }], 1, "cmp-req"),
    note("REQ-064 maps SI-2 whole, so it covers all 10 objectives on SYS-WSX90, the only system that selects SI-2."),
  );
  S["control-si2-evidence"] = () => si2Page("control-si2-evidence",
    table(["Evidence", "Kind", "Review", "Collected", "Renew by", "Cited by"], [{ id: "SI-2", cells: [cut("Account disable trigger test report - expiry, disassociation and policy violation, LRU-013", 420), tag("Test record"), pill("ok", "Accepted"), `<span class="num">${day("2026-09-25")}</span>`, `<span class="num">${day("2027-03-25")}</span>`, tag("REQ-064")] }], 1, "control"),
    note("The one version cited is an account-disable test. A patch record for the openssh-server 9.8p1 update that closes CVE-2024-6387 would speak to SI-2c directly."),
  );
  S["control-si2-assessment"] = () => si2Page("control-si2-assessment",
    `<div class="grid2"><div class="card"><div class="t">Plans that hold SI-2</div>${li("check", "WS-X90 continuous monitoring — FY2027 · plan 1, draft", "10 of 10 objectives")}${li("ring", "WS-X90 Expanded Control Set Assessment · plan 1", "Not held")}</div>
      <div class="card"><div class="t">Scheduled in that plan</div>${li("check", "Monthly vulnerability scan — mission network (October)", "Done Oct 11")}${li("clock", "Monthly vulnerability scan — mission network", `<span style="color:var(--bad)">Due Nov 15 · 2d late</span>`)}${li("ring", "Monthly POA&M review", "Due Nov 21")}</div></div>`,
    table(["Objective", "Plan", "Determination"], SI2_OBJ.map(([l]) => ({ id: "SI-2", cells: [`<span class="num">${esc(l)}</span>`, "Continuous monitoring FY2027 · plan 1", pill("none", "Not yet judged")] })), 10, "control"),
  );
  S["control-si2-findings"] = () => si2Page("control-si2-findings",
    `<div class="card"><div class="t">Assessment findings <span class="num">0</span></div><p class="note-p">No published or draft result judges SI-2.</p></div>`,
    table(["Operational issue", "Severity", "Opened", "Remediate by", "Owner"], [{ id: "CVE-2024", cells: [cut("CVE-2024-6387 in the OpenSSH server (regreSSHion)", 400), sevPill("high"), `<span class="num">${day("2026-10-10")}</span>`, dueCell(cveDue), who(null)] }], 1, "issue"),
  );
  for (const r of ["control-si2", "control-si2-requirements", "control-si2-evidence", "control-si2-assessment", "control-si2-findings", "baseline-params"]) ROUTE_NAV[r] = r.startsWith("control") ? "controls" : "baseline";

  M["cmp-map"] = (id) => {
    const c = CTRL[id] || CTRL["SA-24"];
    const left = id === "SI-4(13)";
    return { title: "Map a requirement", body: `
      ${kv([["Control", `${tag(id)} ${esc(c.t)}`], ["Covers today", `${c.m} of ${c.o} objectives`]])}
      ${field("Requirements", `<div style="min-width:0"><div class="compliance-minibox"><table class="compliance-mini"><thead><tr><th></th><th>Requirement</th><th>Allocated to</th><th></th></tr></thead><tbody>
        <tr><td><input type="checkbox" aria-label="Choose REQ-262"${left ? " checked" : ""}></td><td>REQ-262 Outbound traffic profiled per mission phase</td><td>CN-109107, CN-109108</td><td class="compliance-sub">${left ? "Maps 3 of 6" : ""}</td></tr>
        <tr><td><input type="checkbox" aria-label="Choose REQ-200"></td><td>REQ-200 Boundary counters exported and alerted</td><td>CN-109107, CN-109118</td><td></td></tr>
        <tr><td><input type="checkbox" aria-label="Choose REQ-064"></td><td>REQ-064 SI Monitoring Requirement 064</td><td>CN-109116</td><td></td></tr></tbody></table></div></div>`, "640 of WS-X90's requirements, read a page at a time; showing 3.")}
      ${field("Objectives", `<div class="compliance-radios"><label><input type="radio" name="cmpobj"${left ? "" : " checked"}> Whole control</label><label><input type="radio" name="cmpobj"${left ? " checked" : ""}> Chosen objectives${left ? ": SI-04(13)(a)[02], (b)[02], (c)[02]" : ""}</label></div>`)}
      ${field("Relationship", `<input class="compliance-in" value="Maps to" aria-label="Relationship">`)}
      ${field("Rationale", `<textarea class="compliance-ta" aria-label="Rationale"></textarea>`)}`, footer: doneBtn("Map requirement", `Mapped to ${id} on SYS-WSX90 (prototype: nothing is saved)`) };
  };
  M["cmp-link-ev"] = (id) => {
    const c = CTRL[id] || CTRL["SI-2"];
    const r = c.req.find((x) => !x[2]) || c.req[0] || ["REQ-064", ""];
    return { title: "Add evidence", body: `
      ${kv([["Control", `${tag(id)} ${esc(c.t)}`], ["Cited by", tag(r[0])]])}
      <div class="compliance-seg" role="group" aria-label="Source"><span class="on">Upload a file</span><span>Link a version</span><span>From a source</span></div>
      <div class="compliance-drop"><b>Drop a file, or choose one</b><span>PDF, image, .nessus, .ckl, CycloneDX or SPDX</span></div>
      ${field("Title", `<input class="compliance-in" value="${id === "SI-2" ? "openssh-server 9.8p1 update record, Mission Computer maintenance image version 2" : ""}" aria-label="Title">`)}
      ${field("Renew by", `<input class="compliance-in" value="May 17, 2027" aria-label="Renew by">`, "Evidence older than six months goes back to Needs renewal.")}`, footer: doneBtn("Add evidence", `Evidence added to ${r[0]}, pending review (prototype: nothing is saved)`) };
  };
  M["cmp-add-camp"] = (id) => {
    const c = CTRL[id] || CTRL["AC-2(7)"];
    return { title: "Add to assessment campaign", body: `
      <p class="compliance-prose">${esc(id)} joins the campaign's draft plan as its ${c.o} assessment objective${c.o > 1 ? "s" : ""}.</p>
      <div style="min-width:0"><div class="compliance-minibox"><table class="compliance-mini"><thead><tr><th></th><th>Campaign</th><th>Status</th><th>Draft plan</th><th class="num">Objectives</th></tr></thead><tbody>
        <tr><td><input type="radio" name="cmpcamp" checked aria-label="WS-X90 continuous monitoring — FY2027"></td><td>WS-X90 continuous monitoring — FY2027</td><td>${pill("info", "Active")}</td><td>Plan 1</td><td class="num">10</td></tr>
        <tr><td><input type="radio" name="cmpcamp" disabled aria-label="WS-X90 Expanded Control Set Assessment"></td><td>WS-X90 Expanded Control Set Assessment</td><td>${pill("info", "Active")}</td><td class="compliance-sub">Published, no draft</td><td class="num">—</td></tr></tbody></table></div></div>`, footer: doneBtn("Add to assessment campaign", `${c.o} objective${c.o > 1 ? "s" : ""} of ${id} added to WS-X90 continuous monitoring — FY2027 (prototype: nothing is saved)`) };
  };

  // ════════════════════ Requirements ════════════════════
  // program_requirement_rows for WS-X90: 640 requirements, all allocated, flat (no decomposition yet).
  const REQS = [
    ["REQ-001", "AC Enforcement Requirement 001", ["CN-109002", "CN-109101"], ["AC-2", "AC-7"], 1],
    ["REQ-008", "AC Monitoring Requirement 008", ["CN-109113", "CN-109114"], ["AC-11", "AU-4"], 0],
    ["REQ-039", "IA Configuration Requirement 039", ["CN-109101", "CN-109114", "CN-109117"], ["IA-5"], 1],
    ["REQ-054", "RA Verification Requirement 054", ["CN-109113", "CN-109118", "CN-109120"], ["RA-5"], 1],
    ["REQ-064", "SI Monitoring Requirement 064", ["CN-109116"], ["SI-2", "SI-10"], 1],
    ["REQ-200", "Boundary counters exported and alerted on connection-rate excursions", ["CN-109107", "CN-109118"], ["SC-5(3)"], 1],
    ["REQ-262", "Outbound traffic profiled per mission phase for anomalies", ["CN-109107", "CN-109108"], ["SI-4(11)", "SI-4(13)"], 0, true],
    ["REQ-353", "On-demand audit reduction that does not alter the source records", ["CN-109118"], ["AU-7"], 1],
    ["REQ-360", "Payload arm and release commands are signed at origin", ["CN-109103", "CN-109110", "CN-109111"], ["AU-10"], 1],
    ["REQ-361", "Signing key custody and signature verification on ingest", ["CN-109103", "CN-109118"], ["AU-10"], 0],
    ["REQ-436", "Access control policy and procedure baseline held under signature", ["CN-109117", "CN-109120"], ["AC-1"], 1],
    ["REQ-442", "Technicians log out at the end of the standard work period", ["CN-109117", "CN-109119"], ["AC-2(5)"], 0],
    ["REQ-443", "Platform privilege is carried by named roles, never attached to an account", ["CN-109101", "CN-109113"], ["AC-2(7)"], 1],
    ["REQ-599", "Hardware credential and PIN for non-privileged ground support sessions", ["CN-109117", "CN-109119"], ["IA-2(2)"], 1],
  ];
  const TREE = [
    ["CN-109001", null, [["CN-109101", 102], ["CN-109102", 42], ["CN-109103", 60]]],
    ["CN-109002", 2, [["CN-109104", 27], ["CN-109105", 22], ["CN-109106", 20]]],
    ["CN-109003", null, [["CN-109107", 84], ["CN-109108", 34], ["CN-109109", 34]]],
    ["CN-109004", null, [["CN-109110", 33], ["CN-109111", 31], ["CN-109112", 25]]],
    ["CN-109005", null, [["CN-109113", 128], ["CN-109114", 86], ["CN-109115", 66], ["CN-109116", 46]]],
    ["CN-109006", null, [["CN-109117", 140], ["CN-109118", 124], ["CN-109119", 83], ["CN-109120", 139]]],
  ];
  const reqTabs = (cur) => tabs([["requirements", "Requirements", 640], ["requirements-objectives", "Mapping by objective"], ["requirements-compliance", "Customer documents", 1]], cur);
  const reqHeader = () => header("Requirements", "<span>640 requirements · allocated to 20 elements</span><span>1,376 control mappings on 547 controls</span>", `<button type="button" class="btn" data-modal="cmp-import">Import requirements</button><span class="btn ink">Create requirement</span>`);
  const reqPair = () => pair(
    completion({ title: "Requirements with evidence", total: 640, done: 354, unit: "cite at least one evidence version", minis: [["Allocated", 640, 640], ["Map a control", 640, 640], ["With an owner", 0, 640]] }),
    attention([["ring", "Cite no evidence", 286], ["clock", "Mapping needs review", 1], ["ring", "No owner", 640], ["ring", "Unallocated", 0, true]]),
  );
  S.requirements = () => page(
    reqHeader(), reqPair(), reqTabs("requirements"),
    `<div class="compliance-split"><div class="card" style="padding:16px 14px"><div class="t" style="font-size:15px">Allocation <span class="num">20 elements</span></div><div class="compliance-tree" role="tree" aria-label="Allocation by element">
      <div class="n on" role="treeitem" aria-selected="true"><span>SYS-WSX90 · all requirements</span><span class="num">640</span></div>
      ${TREE.map(([s, n, kids]) => `<div class="n l1" role="treeitem" tabindex="0" data-panel="cmp-el" data-id="${s}"><span title="${esc(elName(s))}">${esc(ELEMENTS[s])}</span>${n ? `<span class="num">${n}</span>` : ""}</div>${kids.map(([k, c]) => `<div class="n l2" role="treeitem" tabindex="0" data-panel="cmp-el" data-id="${k}"><span title="${esc(elName(k))}">${esc(ELEMENTS[k])}</span><span class="num">${c}</span></div>`).join("")}`).join("")}
    </div></div><div style="display:grid;gap:16px;min-width:0">
      ${tools("Search requirements", ["Element", "Control", "Evidence", "Owner"])}
      ${table(["Requirement", "Title", "Allocated to", "Maps", "Evidence"], REQS.map(([c, t, el, ctl, ev, obj]) => ({ id: c, cells: [esc(c), cut(t, 250), tag(el[0]) + (el.length > 1 ? ` <span class="compliance-sub">+${el.length - 1}</span>` : ""), ctl.map((x) => tag(x)).join(" ") + (obj ? ` <span class="compliance-sub">by objective</span>` : ""), ev ? num(ev) : none("None")] })), 640, "cmp-req")}
    </div></div>`,
    note("WS-X90's requirements are flat today: none decomposes another, so the tree is allocation, element by element. A count is the requirements allocated to that element; one requirement may sit on several."),
  );
  P["cmp-el"] = (id) => {
    const kids = TREE.find((t) => t[0] === id);
    const parent = TREE.find((t) => t[2].some(([k]) => k === id));
    const count = kids ? kids[1] || 0 : parent[2].find(([k]) => k === id)[1];
    const here = REQS.filter((r) => r[2].includes(id));
    return { label: mark("cmp-el", id, "Element preview"), body: `
      ${phead(elName(id), btn("Allocate requirements", `data-cmp="done" data-msg="Allocate requirements opens over the page (prototype)"`))}
      ${kv([["Code", tag(id)], ["Inside", parent ? esc(elName(parent[0])) : "CN-109000 WS-X90 Sentinel Mission System"], ["Allocated", `${num(count)} requirements`], ["Holds", kids ? `${kids[2].length} elements, ${fmt(kids[2].reduce((a, k) => a + k[1], 0))} allocations` : muted("No elements")]])}
      ${here.length ? sect("Among those listed", here.length, here.map(([c, t]) => li("", `<b style="font-weight:500">${c}</b> ${esc(t)}`)).join("")) : ""}` };
  };
  P["cmp-req"] = (id) => {
    const r = REQS.find((x) => x[0] === id) || REQS[0];
    const [c, t, el, ctl, ev, obj] = r;
    return { label: mark("cmp-req", id, "Requirement preview"), body: `
      ${phead(`${c} ${t}`, btn("Map control", `data-modal="cmp-map-control" data-id="${c}"`, true))}
      ${kv([["Type", "Security"], ["Mapping", obj ? pill("warn", "Needs review") : pill("ok", "Control linked")], ["Owner", who(null)], ["Version", "1 · Draft"]])}
      ${sect("Allocated to", el.length, el.map((e) => li("", esc(elName(e)))).join(""))}
      ${sect("Control mappings", obj ? null : el.length * ctl.length, obj
        ? `${li("part", "SI-4(13) · objectives (a)[01], (b)[01], (c)[01]", "on CN-109107 and CN-109108")}${li("check", "SI-4(11) · whole control", "both elements")}<span class="compliance-sub">Three of SI-4(13)'s six objectives: event patterns are mapped by nothing yet.</span>`
        : ctl.map((x) => li("check", `${esc(x)} · whole control`, el.length > 1 ? `on ${el.length} elements` : `on ${el[0]}`)).join(""))}
      ${sect("Evidence", ev, ev ? li("check", "Cited, version 1", "") : `<div class="next">${gl("ring")}<span>Cites no evidence: the controls it maps stay at No evidence.</span>${btn("Link evidence", `data-modal="cmp-link-ev" data-id="${ctl[0]}"`)}</div>`)}` };
  };
  M["cmp-map-control"] = (id) => ({ title: "Map control", body: `
    ${kv([["Requirement", tag(id)]])}
    ${field("System", `<input class="compliance-in" value="SYS-WSX90 · WS-X90 Sentinel Mission System" aria-label="System">`)}
    ${field("Control", `<input class="compliance-in" value="SI-4(13) Analyze Traffic and Event Patterns" aria-label="Control">`, "From SYS-WSX90's control baseline: 560 controls.")}
    ${field("Objectives", `<div class="compliance-radios"><label><input type="radio" name="cmpmc"> Whole control</label><label><input type="radio" name="cmpmc" checked> Chosen objectives: SI-04(13)(a)[02], (b)[02], (c)[02]</label></div>`, "A heading covers the objectives under it.")}
    ${field("Rationale", `<textarea class="compliance-ta" aria-label="Rationale"></textarea>`)}`, footer: doneBtn("Map control", `3 objectives of SI-4(13) mapped by ${id} (prototype: nothing is saved)`) });

  const SI413 = [["SI-04(13)(a)[01]", "communications traffic for the system is analyzed", true], ["SI-04(13)(a)[02]", "event patterns for the system are analyzed", false], ["SI-04(13)(b)[01]", "profiles representing common traffic are developed", true], ["SI-04(13)(b)[02]", "profiles representing event patterns are developed", false], ["SI-04(13)(c)[01]", "traffic profiles are used in tuning system-monitoring devices", true], ["SI-04(13)(c)[02]", "event profiles are used in tuning system-monitoring devices", false]];
  S["requirements-objectives"] = () => page(
    reqHeader(),
    pair(
      completion({ title: "Objectives mapped", total: 1791, done: 1761, unit: "assessment objectives covered on every system that selects them", minis: [["With evidence", 1128, 1791], ["Assessed", 829, 1791], ["Mapped by objective", 3, 0]] }),
      attention([["part", "Controls mapped in part", 1], ["ring", "Controls no requirement maps", 13], ["ring", "Objectives not mapped", 30], ["ring", "Mapped, with no evidence", 633]]),
    ),
    reqTabs("requirements-objectives"),
    `<h4 class="subhead">SI-4(13) Analyze Traffic and Event Patterns · 3 of 6 mapped</h4>`,
    table(["Objective", "Text", "Mapped by", "Systems", "Evidence"], SI413.map(([l, t, m]) => ({ id: "SI-4(13)", cells: [`<span class="num">${esc(l)}</span>`, cut(t, 380), m ? tag("REQ-262") : none("Nothing"), m ? `${tag("CN-109107")} ${tag("CN-109108")}` : muted("—"), none("None")] })), 6, "control"),
    `<h4 class="subhead">Controls with objectives left to map</h4>`,
    table(["Control", "Objectives mapped", "Next step", "Added by"], [["SI-4(13)", "Analyze Traffic and Event Patterns", 6, 3], ["SA-24", "Design For Cyber Resiliency", 10, 0], ...NOREQ.slice(0, 6).map(([c, t, o]) => [c, t, o, 0])].map(([c, t, o, m]) => ({ id: c, cells: [cut(`${c} ${t}`, 360), of(m, o), `<span class="who">${gl("ring")}<span style="color:var(--ink)">${m ? `Map ${o - m} more objectives` : "Map a requirement"}</span></span>`, tag("Program tailoring")] })), 14, "control"),
    note("All 14 came in with the program tailoring and are mapped by nothing but REQ-262. Every other mapping of WS-X90 maps a whole control; a whole-control mapping covers all its objectives."),
  );

  // Customer A's requirements document (requirement_source_compliance, PRG-2101).
  const CREQ = [
    ["3.1.1", "Maintenance access", "compliant", "product", 3, "similarity", ["CA-PS-MX", "CA-SE-TS"], "The missile shall restrict maintenance functions to authenticated maintainers.", "Met by the product's maintenance port as assessed in version 1."],
    ["3.1.2", "Audit of maintenance sessions", "compliant", "product", 4, "similarity", ["CA-PS-MX", "CA-PS-TLM", "CA-SE-TS"], "The missile shall record each maintenance session and protect the record.", "Met by the product's maintenance port and telemetry unit as assessed in version 1."],
    ["3.2.1", "Datalink encryption", "partially_compliant", "variant_change", 2, "test", ["CA-CS-CRY", "CA-CS-DL"], "The datalink shall be encrypted with the customer's algorithm suite.", "The radio is the product's. The customer's algorithm suite in the cryptographic module is to be tested."],
    ["3.2.2", "Customer key management", "partially_compliant", "variant_change", 2, "demonstration", ["CA-CS-CRY", "CA-CS-KL"], "Keys shall be loaded and zeroized under the customer's key management plan.", "Key loading is the product's. Zeroization with the customer's suite is to be demonstrated."],
    ["3.2.3", "Mission data at rest", "non_compliant", "variant_change", 1, "test", ["CA-CS-CRY", "CA-GS-NAV", "CA-GS-OFP"], "Mission data held in the missile shall be protected at rest.", "Mission data is built into the flight program for this variant, and its protection at rest is not yet shown."],
    ["3.3.1", "Software integrity at load", "partially_compliant", "variant_change", 2, "test", ["CA-GS-OFP", "CA-GS-SKR", "CA-PS-BOOT"], "The missile shall verify the integrity of each software load before it runs.", "Secure boot is the product's. The customer's flight program load is to be tested against it."],
    ["3.3.2", "Signed software only", "compliant", "product", 1, "similarity", ["CA-PS-BOOT"], "The missile shall run only software signed by the approved authority.", "Met by the product's secure boot firmware as assessed in version 1."],
    ["3.3.3", "Least functionality", null, "variant_change", 1, null, ["CA-GS-OFP"], "The flight program shall include only the functions the mission needs.", null],
    ["3.4.1", "Tamper response", "compliant", "product", 1, "inspection", ["CA-GS-MC", "CA-GS-NAV", "CA-GS-SKR", "CA-LA-UMB"], "The missile shall detect and report physical tampering with its guidance section.", "Met by the product's mission computer and rail umbilical interface."],
    ["3.4.2", "Launcher interface isolation", "compliant", "variant_change", 3, "similarity", ["CA-LA-UMB", "CA-LEU-CTL", "CA-LEU-FW", "R210-STD-CUSA"], "The launcher interface shall pass only the data the launch sequence needs.", "Met by the product's rail umbilical interface unit as assessed in version 1."],
    ["3.5.1", "Waveform separation", null, "program", 2, null, ["CA-CS-CWM"], "The customer waveform shall be separated from the product's datalink.", null],
    ["3.5.2", "Waveform confidentiality", "non_compliant", "program", 1, "test", ["CA-CS-CWM"], "The customer waveform shall protect the confidentiality of what it carries.", "The waveform module is the program's own and has not been tested."],
    ["3.6.1", "Mission data loading", "not_applicable", "unallocated", 0, null, [], "Mission data shall be loaded only with the customer's loader.", "The product's mission data loader is not delivered in this variant, and the customer's loader is outside the system."],
    ["3.7.1", "Supply chain records", "compliant", "product", 2, "inspection", ["CA-LEU-PSU", "CA-PS-PWR", "X800-A-CUSA"], "The contractor shall keep supply chain records for each delivered unit.", "Met by the product's supply chain process."],
  ];
  const CMP = { compliant: ["ok", "Compliant"], partially_compliant: ["part", "Partially compliant"], non_compliant: ["bad", "Non-compliant"], not_applicable: ["none", "Not applicable"] };
  const cmpPill = (s) => (s ? pill(CMP[s][0], CMP[s][1]) : pill("none", "Unanswered"));
  const MET = { product: "Product", variant_change: "Variant change", program: "Program", unallocated: "Not allocated" };
  S["requirements-compliance"] = () => page(
    reqHeader(),
    pair(
      completion({ title: "Compliant", total: 14, done: 6, unit: "of CUSA-SSRD Rev C's requirements", note: "received Jul 15", minis: [["Met by the product", 5, 14], ["By a variant change", 6, 14], ["By the program", 2, 14]] }),
      attention([["diamond", "Non-compliant", 2], ["part", "Partially compliant", 3], ["ring", "Unanswered", 2], ["ring", "Not applicable", 1, true]], "Compliance to answer"),
    ),
    reqTabs("requirements-compliance"),
    `<div class="ph" style="gap:8px"><div style="display:grid;gap:2px"><b style="font-size:16px;font-weight:600">CUSA-SSRD · Customer A System Security Requirements Document</b><span class="compliance-sub">CUSA-SSRD-0042 Rev C · held by PRG-2101 Customer A · X800 Rail Integration</span></div><span class="flt">Requirements document ⌄</span></div>`,
    tools("Search requirements", ["Compliance", "Met by", "Elements", "Verification"]),
    table(["Reference", "Requirement", "Compliance", "Met by", "Elements", "Verification", "Controls"], CREQ.map(([ref, t, s, m, ctl, v, el]) => ({ id: ref, cells: [`<span class="num">${ref}</span>`, esc(t), cmpPill(s), esc(MET[m]), el.length ? tag(el[0]) + (el.length > 1 ? ` <span class="compliance-sub">+${el.length - 1}</span>` : "") : none("None"), v ? esc(cap(v)) : muted("—"), num(ctl)] })), 14, "cmp-creq"),
    note("WS-X90 has received no customer requirements document. This is the one Customer A sent for its X800 rail variant, read from the database; Import requirements adds one to WS-X90."),
  );
  P["cmp-creq"] = (id) => {
    const r = CREQ.find((x) => x[0] === id) || CREQ[0];
    const [ref, t, s, m, ctl, v, el, stmt, ans] = r;
    return { label: mark("cmp-creq", id, "Customer requirement preview"), body: `
      ${phead(`${ref} ${t}`, btn(ans ? "Edit compliance statement" : "Create compliance statement", `data-modal="cmp-compliance" data-id="${ref}"`, true))}
      ${kv([["Compliance", cmpPill(s)], ["Met by", esc(MET[m])], ["Verification", v ? esc(cap(v)) : muted("Not chosen")], ["Controls", num(ctl)]])}
      ${sect("Customer's statement", null, `<span class="compliance-prose">${esc(stmt)}</span>`)}
      ${sect("Compliance statement", null, ans ? `<span class="compliance-prose">${esc(ans)}</span>` : none("Not written"))}
      ${sect("Allocated to", el.length, el.length ? el.map((e) => li(e.includes("CWM") ? "ring" : e.includes("OFP") || e.includes("CRY") || e.includes("FW") ? "part" : "check", esc(e), e.includes("CWM") ? "Program's own" : e.includes("OFP") || e.includes("CRY") || e.includes("FW") ? "Modified" : "Inherited")).join("") : muted("Not allocated"))}` };
  };
  M["cmp-compliance"] = (id) => {
    const r = CREQ.find((x) => x[0] === id) || CREQ[0];
    return { title: r[8] ? "Edit compliance statement" : "Create compliance statement", body: `
      ${kv([["Requirement", `${r[0]} ${esc(r[1])}`]])}
      ${field("Compliance", `<div class="compliance-radios">${Object.entries(CMP).map(([k, [, l]]) => `<label><input type="radio" name="cmpc"${k === r[2] ? " checked" : ""}> ${l}</label>`).join("")}</div>`)}
      ${field("Verification method", `<input class="compliance-in" value="${esc(r[5] ? cap(r[5]) : "")}" aria-label="Verification method">`, "Inspection, analysis, demonstration, test or similarity.")}
      ${field("Statement", `<textarea class="compliance-ta" aria-label="Statement">${esc(r[8] || "")}</textarea>`, "Required where the answer is short of compliant.")}`, footer: doneBtn(r[8] ? "Edit compliance statement" : "Create compliance statement", `Compliance statement saved for ${r[0]} (prototype: nothing is saved)`) };
  };
  M["cmp-import"] = () => ({ title: "Import requirements", body: `
    <div class="compliance-seg" role="group" aria-label="Format"><span class="on">CSV</span><span>Excel</span><span>ReqIF</span><span>Paste rows</span></div>
    <div class="compliance-drop"><b>Drop a file, or choose one</b><span>.csv, the first sheet of an .xlsx that holds anything, or a .reqif</span></div>
    <div class="next" role="status">${gl("check")}<span>Read <b>CUSB-SRS Issue 2.csv</b> ${EX}: 14 requirements, 4 columns (Reference, Title, Statement, Elements); passed over 2 empty rows.</span></div>
    ${field("Add to", `<div class="compliance-radios"><label><input type="radio" name="cmpimp" checked> A new requirements document</label><label><input type="radio" name="cmpimp"> A document WS-X90 holds (none yet)</label></div>`)}
    ${field("Document code and title", `<input class="compliance-in" value="CUSB-SRS · Customer B Security Requirements Specification" aria-label="Document">`)}
    ${note("An Elements column allocates each requirement to the elements it names by code; a code WS-X90 does not hold stops the import whole, and nothing is imported.")}`, footer: doneBtn("Import requirements", "14 requirements imported, 21 allocations made (prototype: nothing is saved)") });

  // ════════════════════ Checks ════════════════════
  const cveDays = -days("2026-11-09");
  const CHECKS = [
    { id: "scan", name: "Vulnerability scans run at RA-5's frequency", ctl: "RA-5", ok: false, src: "RA-5 parameter, scheduled scans", fail: 2,
      inputs: [["RA-05_ODP[01]", none("Not set")], ["Plan", "Continuous monitoring FY2027: a monthly mission network scan"], ["Last done", "October scan, Oct 11 · Joel Barrantes"], ["Now", `November scan, in progress, due Nov 15 · <span style="color:var(--bad)">2d late</span>`]],
      items: [["diamond", "RA-5's scan frequency is not set in WS-X90's baseline", "Parameter"], ["diamond", "Monthly vulnerability scan — mission network: due Nov 15, in progress", "2d late"]],
      fix: ["Set RA-05_ODP[01] on the program tailoring, for example every 30 days and after each software load.", "Finish the November scan, or move its due date with a reason.", "Import its .nessus results under Evidence sources, so the check reads hosts and plugins too."] },
    { id: "iava", name: "IAVA and IAVB patches inside their windows", ctl: "SI-2", ok: false, ex: true, src: "IAVM notices, SI-2 parameter, ACAS", fail: 3,
      inputs: [["SI-02_ODP", none("Not set")], ["Windows used", "IAVA 21 days, IAVB 30 days (DoD default until SI-2 is set)"], ["Notices tracked", `9 ${EX}`], ["Source", `ACAS repository, SYS-WSX90 ${EX}`]],
      items: [["diamond", `IAVA 2026-A-0117, OpenSSH on the Mission Computer image ${EX}`, "6d late"], ["clock", `IAVA 2026-A-0124, Linux kernel 6.6 ${EX}`, "in 4d"], ["clock", `IAVB 2026-B-0052, U-Boot ${EX}`, "in 11d"]],
      fix: ["Set SI-02_ODP so the window is the program's, not the default.", "Patch or record a POA&M item with milestones for each notice past its window.", "Acknowledge each notice in its IAVM compliance record."] },
    { id: "stig", name: "No open STIG CAT I; CAT II inside 30 days", ctl: "CM-6", ok: false, ex: true, src: "STIG checklists (.ckl), scheduled scans", fail: 2,
      inputs: [["Scan", `Monthly STIG compliance scan: <span style="color:var(--bad)">blocked since Nov 1, due Nov 11</span>`], ["Checklists", `14 of 20 LRUs ${EX}`], ["Open", `CAT I 2 · CAT II 17 · CAT III 41 ${EX}`]],
      items: [["diamond", `CAT I · Maintenance Laptop: SSH permits password authentication ${EX}`, "Open"], ["diamond", `CAT I · Provisioning Workstation: USB mass storage not disabled ${EX}`, "Open"]],
      fix: ["Unblock the November STIG scan (it is blocked since Nov 1).", "Close both CAT I findings or record a POA&M item for each; CAT I cannot wait.", "Import the .ckl or .cklb files under Evidence sources."] },
    { id: "sbom", name: "No known-affected component in use", ctl: "RA-5 · SI-2", ok: false, src: "SBOMs, CVE records, VEX states", fail: 1,
      inputs: [["SBOM", "Mission Computer maintenance image, CycloneDX 1.5, Oct 8"], ["Components", "13 · 1 affected"], ["Fixed in", "Mission Computer version 2 (openssh-server 9.8p1), published Nov 12"], ["WS-X90 issue", `Open, high, opened Oct 10 · <span style="color:var(--bad)">${cveDays}d late</span>`]],
      items: [["diamond", "CVE-2024-6387 regreSSHion · openssh-server 9.6p1 · CVSS 8.1", `${cveDays}d late`]],
      fix: ["Take Mission Computer version 2 on the Mission Computer element (it carries openssh-server 9.8p1).", "Attach the new SBOM: the VEX state for 9.8p1 is Fixed.", "Close the operational issue with the update record as its evidence."] },
    { id: "expiring", name: "Evidence renewed before it expires", ctl: "CA-7", ok: false, src: "Evidence versions, expiry dates", fail: 54,
      inputs: [["Window", "Expiring within 90 days (by Feb 15)"], ["Expiring", "54 of 368 versions"], ["First", "Feb 1, 5 versions"], ["No owner", "51 of the 54"]],
      items: [["clock", "Evidence for REQ-001, dataset · accepted", "Feb 1"], ["clock", "Evidence for REQ-113, dataset · accepted", "Feb 1"], ["clock", "Evidence for REQ-002, test record · Wes Duarte", "Feb 2"], ["clock", "Evidence for REQ-058, test record · Victor Amsel", "Feb 2"]],
      fix: ["Give each expiring version an owner, so a reminder reaches someone.", "Collect a new version before the date; the old one stays as history.", "Where a source feeds it, renew from the source instead of by hand."] },
    { id: "poam-review", name: "POA&M reviewed every month", ctl: "CA-5", ok: true, src: "Scheduled assessment tasks", fail: 0,
      inputs: [["Last done", "October review, Oct 14 · Priya Raghavan"], ["Now", "November review, ready, due Nov 21"]], items: [], fix: [] },
    { id: "priv-review", name: "Privileged accounts reviewed each quarter", ctl: "AC-2 · AC-6", ok: true, src: "Scheduled assessment tasks", fail: 0,
      inputs: [["Now", "Quarterly privileged account review, in progress, due Dec 1 · Victor Amsel"]], items: [], fix: [] },
  ];
  S.checks = () => page(
    header("Checks", "<span>Derived from WS-X90's records, run daily</span><span>7 checks · 5 read real data, 2 are partly Example</span>", `<span class="btn">Run all now</span><span class="btn ink">Create check</span>`),
    pair(
      completion({ title: "Checks passing", total: 7, done: 2, unit: "checks OK", minis: [["Vulnerability", 0, 4], ["Evidence", 0, 1], ["Monitoring", 2, 2]] }),
      attention(CHECKS.filter((c) => !c.ok).map((c) => [c.items[0][0], c.name, c.fail])),
    ),
    views([["All", 7], ["Needs attention", 5], ["OK", 2]]),
    tools("Search checks", ["Status", "Control", "Source"]),
    table(["Check", "Status", "Control", "Reads", "Failing"], CHECKS.map((c) => ({ id: c.id, cells: [esc(c.name) + (c.ex ? " " + EX : ""), c.ok ? pill("ok", "OK") : pill("bad", "Needs attention"), tag(c.ctl), cut(c.src, 260), c.fail ? `<b class="num" style="color:var(--bad);font-weight:500">${fmt(c.fail)}</b>` : muted("0")] })), 7, "cmp-check"),
    note("Real: RA-5's parameter, the scheduled scans and reviews, the SBOM and CVE, the evidence dates. Example: IAVM notices, STIG checklist counts and their failing items, since no ACAS or STIG data is loaded."),
  );
  P["cmp-check"] = (id) => {
    const c = CHECKS.find((x) => x.id === id) || CHECKS[0];
    return { label: mark("cmp-check", id, "Check preview"), body: `
      ${phead(c.name, c.ok ? btn("Run now") : btn("Create POA&M item", `data-modal="cmp-poam" data-id="${c.id}"`, true))}
      ${kv([["Status", c.ok ? pill("ok", "OK") : pill("bad", "Needs attention")], ["Control", tag(c.ctl)], ["Runs", "Daily, last at 06:00"], ["Data", c.ex ? `Partly ${EX}` : "WS-X90's records"]])}
      ${sect("Inputs", c.inputs.length, kv(c.inputs))}
      ${c.items.length ? sect("Failing", c.fail, c.items.map(([g, t, e]) => li(g, t, e)).join("") + (c.fail > c.items.length ? `<span class="compliance-sub">and ${fmt(c.fail - c.items.length)} more</span>` : "")) : sect("Failing", 0, muted("Nothing fails."))}
      ${c.fix.length ? sect("How to fix", null, `<ol style="margin:0;padding-inline-start:18px;display:grid;gap:6px;color:var(--ink)">${c.fix.map((f) => `<li>${esc(f)}</li>`).join("")}</ol>`) : ""}
      ${c.ok ? "" : `<p class="note-p">Not applicable here? Deactivate it with a reason and an end date that switches it back on.</p>`}` };
  };
  M["cmp-poam"] = (id) => {
    const c = CHECKS.find((x) => x.id === id) || CHECKS[0];
    const sev = id === "sbom" || id === "stig" ? "high" : "moderate";
    return { title: "Create POA&M item", body: `
      ${field("Weakness", `<input class="compliance-in" value="${esc(c.items[0] ? c.items[0][1].replace(/<[^>]+>/g, "").replace("Example", "").trim() : c.name)}" aria-label="Weakness">`)}
      ${kv([["Source", `Check · ${esc(c.name)}`], ["Control", tag(c.ctl)], ["Severity", sevPill(sev)], ["Scheduled completion", `<span class="num">${dueOf("2026-11-17", sev).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span> <span class="compliance-sub">${sev === "high" ? 30 : 90} days, from Deadlines</span>`]])}
      ${field("Milestones", `<textarea class="compliance-ta" aria-label="Milestones">${c.fix.map((f, i) => `${i + 1}. ${f}`).join("\n")}</textarea>`)}
      ${field("Owner", `<input class="compliance-in" value="Joel Barrantes · ISSM" aria-label="Owner">`)}`, footer: doneBtn("Create POA&M item", "POA&M item created and linked to the check (prototype: nothing is saved)") };
  };

  // ════════════════════ Policies ════════════════════
  // The -1 control of each family in WS-X90's baseline, with the document its requirement cites.
  const POL = [
    ["AC-1", "Access control", "partially_satisfied", "REQ-436", "WS-X90 access control policy and procedure baseline, LRU-020 signed export", "needs_revision", "Revision 3.2", "2026-09-18", "2027-03-18", "Wes Duarte"],
    ["AT-1", "Awareness and training", "no_evidence", "REQ-534"],
    ["AU-1", "Audit and accountability", "partially_satisfied", "REQ-344", "WS-X90 audit and accountability policy and procedure set, approval record", "needs_revision", "Revision 4.2", "2026-09-15", "2027-03-15"],
    ["CA-1", "Assessment, authorization and monitoring", "satisfied", "REQ-505", "Assessment, authorization and continuous monitoring procedure set, with approver record", "accepted", "Revision 2.4", "2026-10-08", "2027-04-08"],
    ["CM-1", "Configuration management", "partially_satisfied", "REQ-559", "WS-X90 configuration management policy and CM procedure set, with dissemination record", "needs_revision", "Revision 4.0", "2026-09-11", "2027-03-11"],
    ["CP-1", "Contingency planning", "satisfied", "REQ-481", "WS-X90 contingency planning policy and recovery procedure set, with distribution record", "accepted", "Revision 3.1", "2026-09-18", "2027-03-18"],
    ["IA-1", "Identification and authentication", "not_assessed", "REQ-597", "IA policy and IA procedure set, signed export with review-flag report", "accepted", "Revision 2.4", "2026-09-15", "2027-03-15"],
    ["IR-1", "Incident response", "partially_satisfied", "REQ-298", "Signed revision manifest for the WS-X90 incident response policy and procedure set", "needs_revision", null, "2026-09-14", "2027-03-14"],
    ["MA-1", "Maintenance", "no_evidence", "REQ-372"],
    ["MP-1", "Media protection", "not_assessed", "REQ-631", "Media protection policy and procedure set export, with review-overdue report", "pending", "Revision 2.3", "2026-09-17", "2027-03-17", "Priya Raghavan"],
    ["PE-1", "Physical and environmental protection", "no_evidence", "REQ-390"],
    ["PL-1", "Planning", "no_evidence", "REQ-547"],
    ["PS-1", "Personnel security", "partially_satisfied", "REQ-330", "Personnel security policy revision manifest and dissemination list", "needs_revision", null, "2026-09-15", "2027-03-15"],
    ["RA-1", "Risk assessment", "no_evidence", "REQ-520"],
    ["SA-1", "System and services acquisition", "partially_satisfied", "REQ-121", "WS-X90 acquisition policy and procedure issue record, LRU-020 revision index", "needs_revision", null, "2026-09-10", "2027-03-10"],
    ["SC-1", "System and communications protection", "partially_satisfied", "REQ-193", "SC policy and procedure baseline record, object SCP-BASE-3", "needs_revision", "Issue 2026-09", "2026-09-10", "2027-03-10"],
    ["SI-1", "System and information integrity", "partially_satisfied", "REQ-251", "WS-X90 system and information integrity policy and procedure set, signed 2026-09-11", "needs_revision", "Edition 3", "2026-09-11", "2027-03-11"],
    ["SR-1", "Supply chain risk management", "no_evidence", "REQ-415"],
  ];
  const POL_EX = [
    ["IR-8", "Incident response plan", "WS-X90 incident response plan", "accepted", "Version 2", "Joel Barrantes", "2027-06-30", "Priya Raghavan"],
    ["CP-2", "Contingency plan", "WS-X90 contingency plan and recovery playbooks", "pending", "Version 3", "R. Calloway", "2027-04-30", "Amara Bell"],
    ["CM-9", "Configuration management plan", "WS-X90 configuration management plan", "accepted", "Version 1.4", "Joel Barrantes", "2027-08-15", "Ingrid Solberg"],
  ];
  const POLST = { accepted: ["ok", "Approved"], pending: ["warn", "In review"], needs_revision: ["bad", "Sent back"] };
  const polPill = (r) => (r ? pill(POLST[r][0], POLST[r][1]) : pill("none", "No document"));
  S.policies = () => page(
    header("Policies", "<span>Policy and procedures for each family, the -1 controls</span><span>18 families in WS-X90's baseline</span>", `<span class="btn">Upload document</span><span class="btn ink">Create policy</span>`),
    pair(
      completion({ title: "Policies approved", total: 18, done: 3, unit: "families with an accepted policy document", minis: [["Sent back", 8, 18], ["In review", 1, 18], ["No document", 6, 18]] }),
      attention([["diamond", "Sent back by a reviewer", 8], ["ring", "No document", 6], ["clock", "Renew by within 120 days", 9], ["ring", "No owner", 10], ["ring", "No approver recorded", 12]]),
    ),
    views([["All", 18], ["Sent back", 8], ["No document", 6], ["In review", 1], ["Approved", 3]]),
    tools("Search policies", ["Status", "Family", "Owner", "Renew by"]),
    table(["Policy", "Control", "Status", "Version", "Approver", "Renew by", "Owner"], POL.map(([c, f, , , t, r, v, , renew, owner]) => ({ id: c, cells: [t ? cut(f, 260) : `<span class="compliance-muted">${esc(f)}</span>`, tag(c), polPill(r), v ? esc(v) : muted(t ? "Not stated" : "—"), t ? none("Not recorded") : muted("—"), renew ? dueCell(new Date(renew + "T12:00:00")) : muted("—"), t ? who(owner || null) : muted("—")] }))
      .concat(POL_EX.map(([c, f, , r, v, ap, renew, owner]) => ({ id: c, cells: [`${esc(f)} ${EX}`, tag(c), polPill(r), esc(v), who(ap), dueCell(new Date(renew + "T12:00:00")), who(owner)] }))), 21, "cmp-policy"),
    note("The 18 policy rows are WS-X90's: each -1 control, the requirement that maps it and the document that requirement cites, with its review state and expiry. The three plans marked Example show how owned plans (IR-8, CP-2, CM-9) would sit beside them."),
  );
  P["cmp-policy"] = (id) => {
    const ex = POL_EX.find((x) => x[0] === id);
    if (ex) {
      const [c, f, t, r, v, ap, renew, owner] = ex;
      return { label: mark("cmp-policy", id, "Policy preview"), body: `${phead(t, btn("Renew", "", true))}<p>${EX}</p>${kv([["Control", tag(c)], ["Status", polPill(r)], ["Version", esc(v)], ["Approver", who(ap)], ["Renew by", dueCell(new Date(renew + "T12:00:00"))], ["Owner", who(owner)]])}` };
    }
    const p = POL.find((x) => x[0] === id) || POL[0];
    const [c, f, s, req, t, r, v, coll, renew, owner] = p;
    return { label: mark("cmp-policy", id, "Policy preview"), body: `
      ${phead(`${f} policy and procedures`, t ? (r === "needs_revision" ? btn("Upload revision", `data-modal="cmp-link-ev" data-id="${c}"`, true) : btn("Renew", "", true)) : btn("Upload document", `data-modal="cmp-link-ev" data-id="${c}"`, true))}
      ${kv([["Control", `${tag(c)} ${stPill(s)}`], ["Status", polPill(r)], ["Document", t ? esc(t) : none("None cited")], ["Version", v ? esc(v) : muted(t ? "Not stated" : "—")], ["Collected", coll ? `<span class="num">${day(coll)}</span>` : muted("—")], ["Renew by", renew ? dueCell(new Date(renew + "T12:00:00")) : muted("—")], ["Owner", t ? who(owner || null) : muted("—")], ["Requirement", tag(req)]])}
      ${sect("Approval, in order", null, `<div class="chain">
        <div class="step">${gl(t ? "check" : "ring")}<span>Owner uploads · ${esc(owner || "No owner")}</span><span class="muted">${t ? day(coll) : "Not started"}</span></div>
        <div class="step">${gl(r === "accepted" ? "check" : r === "needs_revision" ? "diamond" : r === "pending" ? "clock" : "ring")}<span>Evidence reviewer</span><span class="muted">${r ? POLST[r][1] : "Not started"}</span></div>
        <div class="step">${gl("ring")}<span>ISSM approves · Joel Barrantes</span><span class="muted">Not recorded</span></div></div><span class="compliance-sub">The approval step is proposed: today the program records the review, not who approved the policy.</span>`)}
      ${sect("Objectives", 17, ladder({ m: 17, e: t ? 17 : 0, a: ["satisfied", "partially_satisfied"].includes(s) ? 17 : 0, o: 17 }))}` };
  };

  // ════════════════════ Assessments ════════════════════
  // assessment_campaigns, plan and results revisions, findings and scheduled tasks for WS-X90.
  const DET = (s, p, o, n) => ({ s, p, o, n });
  const CAMPS = [
    { id: "exp", t: "WS-X90 Expanded Control Set Assessment", st: "active", kind: "Control assessment", a: "2026-09-14", b: "2026-11-20", lead: "D. Okafor", owner: "Nadia Fournier",
      plan: ["Security assessment plan — expanded control set", 1, "published", "2026-09-08"], holds: "243 controls, each by its statement",
      res: [["inc1", "Security assessment report — expanded control set, increment 1", "published", "2026-11-12", 225, "D. Okafor", DET(124, 21, 9, 71)], ["inc2", "Interim results — expanded control set, increment 2", "draft", null, 20, null, DET(13, 4, 1, 2)]] },
    { id: "conmon", t: "WS-X90 continuous monitoring — FY2027", st: "active", kind: "Control assessment", a: "2026-10-01", b: "2027-09-30", lead: "D. Okafor", owner: "Priya Raghavan",
      plan: ["Continuous monitoring plan — FY2027", 1, "draft", null], holds: "10 objectives (SI-2) · 14 scheduled tasks", res: [] },
    { id: "cvi", t: "WS-X90 cooperative vulnerability identification — FY2027", st: "planned", kind: "Cyber test · CVI", a: "2027-01-11", b: "2027-02-05", lead: "D. Okafor", owner: "Ingrid Solberg", plan: null, holds: "No plan yet", res: [] },
    { id: "init", t: "WS-X90 Initial Authorization Security Assessment", st: "completed", kind: "Control assessment", a: "2026-08-03", b: "2026-08-21", lead: "D. Okafor", owner: null,
      plan: ["Security assessment plan — initial authorization", 1, "published", "2026-07-28"], holds: "68 controls, each by its statement",
      res: [["init1", "Security assessment report — initial authorization", "published", "2026-08-28", 68, "D. Okafor", DET(50, 13, 4, 1)]] },
  ];
  const RESULTS = CAMPS.flatMap((c) => c.res.map((r) => ({ camp: c, id: r[0], t: r[1], st: r[2], pub: r[3], n: r[4], by: r[5], d: r[6] })));
  const stPillC = (s) => pill(s === "active" ? "info" : s === "completed" ? "ok" : "none", cap(s));
  const detStack = (d) => { const t = d.s + d.p + d.o + d.n; return `<div class="stack"><i style="width:${(d.s / t) * 100}%;background:var(--ok)"></i><i style="width:${(d.p / t) * 100}%;background:var(--warn)"></i><i style="width:${(d.o / t) * 100}%;background:var(--bad)"></i><i style="width:${(d.n / t) * 100}%;background:var(--ink-4)"></i></div><div class="legend"><span style="--c:var(--ok)">Satisfied ${d.s}</span><span style="--c:var(--warn)">Partially ${d.p}</span><span style="--c:var(--bad)">Other than ${d.o}</span><span style="--c:var(--ink-4)">Not assessed ${d.n}</span></div>`; };
  const asTabs = (cur) => tabs([["assessments", "Campaigns", 4], ["assessments-plans", "Plans by objective"], ["assessments-results", "Results", 3]], cur);
  const asHeader = () => header("Assessments", "<span>4 campaigns · 2 active</span><span>Lead assessor <b>D. Okafor</b></span>", `<a style="text-decoration:none" class="btn" href="#campaign">Open assessor's view</a><button type="button" class="btn ink" data-modal="cmp-plan">Plan an assessment</button>`);
  const asPair = () => pair(
    completion({ title: "Satisfied in published results", total: 293, done: 174, unit: "findings satisfied", note: "34 partially · 13 other than · 72 not assessed", minis: [["Controls assessed", 223, 560], ["Objectives assessed", 829, 1791], ["Left to judge", 300, 0]] }),
    attention([["info", "Results to publish", 1], ["clock", "Ends within a week", 1], ["clock", "Controls not assessed", 90], ["ring", "Plans written by control, not objective", 2, true]]),
  );
  S.assessments = () => page(
    asHeader(), asPair(), asTabs("assessments"),
    `<div class="card"><div class="t">Windows <span>today Nov 17</span></div>${CAMPS.map((c) => h.lane(c.t, c.st, c.a, c.b)).join("")}</div>`,
    table(["Assessment", "Kind", "Status", "Window", "Plan holds", "Findings"], CAMPS.map((c) => ({ id: c.id, cells: [cut(c.t, 340), tag(c.kind), stPillC(c.st), `<span class="num">${day(c.a)} – ${day(c.b)}</span>`, cut(c.holds, 220), c.res.length ? num(c.res.reduce((a, r) => a + r[4], 0)) : muted("—")] })), 4, "cmp-camp"),
  );
  P["cmp-camp"] = (id) => {
    const c = CAMPS.find((x) => x.id === id) || CAMPS[0];
    return { label: mark("cmp-camp", id, "Assessment campaign preview"), body: `
      ${phead(c.t, c.id === "exp" ? `<a style="text-decoration:none" class="btn sm ink" href="#campaign">Open assessor's view</a>` : c.id === "cvi" ? `<a style="text-decoration:none" class="btn sm ink" href="#cyber-te">Open in Cyber T&amp;E</a>` : "")}
      ${kv([["Status", stPillC(c.st)], ["Kind", tag(c.kind)], ["Window", `<span class="num">${day(c.a)} – ${day(c.b)}</span>`], ["Lead assessor", who(c.lead)], ["Owner", who(c.owner)]])}
      ${sect("Plan", c.plan ? 1 : 0, c.plan ? `${li(c.plan[2] === "published" ? "check" : "clock", `${esc(c.plan[0])} · version ${c.plan[1]}`, cap(c.plan[2]))}<span class="compliance-sub">Holds ${esc(c.holds)}</span>` : `<div class="next">${gl("ring")}<span>No plan yet.</span>${btn("Plan an assessment", `data-modal="cmp-plan"`)}</div>`)}
      ${c.res.length ? sect("Assessment results", c.res.length, c.res.map((r) => `${li(r[2] === "published" ? "check" : "clock", esc(r[1]), r[2] === "published" ? `Published ${day(r[3])}` : "Draft")}${detStack(r[6])}`).join("")) : ""}
      ${c.id === "conmon" ? sect("Scheduled tasks", 14, `${li("check", "Monthly vulnerability scan — mission network (October)", "Done")}${li("diamond", "Monthly STIG compliance scan", "Blocked")}${li("clock", "Monthly vulnerability scan — mission network", "2d late")}${li("clock", "Quarterly privileged account review (AC-2, AC-6)", "Due Dec 1")}<span class="compliance-sub">and 10 more, to the SA-24 cyber resiliency exercise in June</span>`) : ""}` };
  };
  const CONMON_OBJ = SI2_OBJ;
  S["assessments-plans"] = () => page(
    asHeader(), asPair(), asTabs("assessments-plans"),
    `<div class="grid2">${CAMPS.map((c) => `<div class="card" style="gap:10px"><div class="t" style="font-size:15px">${esc(c.t)} <span>${stPillC(c.st)}</span></div>${c.plan ? li(c.plan[2] === "published" ? "check" : "clock", `${esc(c.plan[0])} · v${c.plan[1]}`, cap(c.plan[2])) : li("ring", "No plan yet", "")}<span class="compliance-sub">${esc(c.holds)}</span></div>`).join("")}</div>`,
    `<h4 class="subhead">Continuous monitoring FY2027 · plan 1 (draft) · 10 objectives</h4>`,
    tools("Search objectives", ["Campaign", "Control", "Target"]),
    table(["Objective", "Target", "Control", "Campaign"], CONMON_OBJ.map(([l, t]) => ({ id: "SI-2", cells: [cut(`${l} ${t}`, 460), `<span class="num">${esc(l)}</span>`, tag("SI-2"), "Continuous monitoring FY2027"] })), 10, "control"),
    note("The two published plans were written by control, before plans took objectives: each control is held by its statement, which covers every objective under it. A plan written now holds one objective each, and only the ones nobody has judged."),
  );
  S["assessments-results"] = () => page(
    asHeader(), asPair(), asTabs("assessments-results"),
    table(["Assessment results", "Campaign", "State", "Findings", "Published by", "Published"], RESULTS.map((r) => ({ id: r.id, cells: [cut(r.t, 360), cut(r.camp.t, 260), r.st === "published" ? pill("ok", "Published") : pill("warn", "Draft"), num(r.n), r.by ? who(r.by) : muted("Not published"), r.pub ? `<span class="num">${day(r.pub)}</span>` : muted("Not published")] })), 3, "cmp-results"),
  );
  P["cmp-results"] = (id) => {
    const r = RESULTS.find((x) => x.id === id) || RESULTS[1];
    return { label: mark("cmp-results", id, "Assessment results preview"), body: `
      ${phead(r.t, r.st === "draft" ? btn("Publish assessment results", `data-modal="cmp-publish" data-id="${r.id}"`, true) : "")}
      ${kv([["State", r.st === "published" ? pill("ok", "Published") : pill("warn", "Draft")], ["Campaign", esc(r.camp.t)], ["Findings", num(r.n)], ["Published by", r.by ? who(r.by) : muted("Not published")], ["Published", r.pub ? day(r.pub) : muted("Not published")]])}
      ${sect("Determinations", r.n, detStack(r.d))}
      ${r.id === "inc2" ? sect("Findings short of satisfied", 5, `${li("", "IA-2(2) Multi-factor Authentication to Non-privileged Accounts", stPill("other_than_satisfied"))}${li("", "AC-17(4) Privileged Commands and Access", stPill("partially_satisfied"))}${li("", "CA-3 Information Exchange", stPill("partially_satisfied"))}${li("", "IA-3(1) Cryptographic Bidirectional Authentication", stPill("partially_satisfied"))}${li("", "MA-3(5) Execution with Privilege", stPill("partially_satisfied"))}`) : ""}
      ${r.st === "draft" ? `<p class="note-p">A draft decides nothing: WS-X90's control statuses read these findings once they are published.</p>` : ""}` };
  };
  M["cmp-publish"] = (id) => {
    const r = RESULTS.find((x) => x.id === id) || RESULTS[1];
    return { title: "Publish assessment results", body: `
      <p class="compliance-prose"><b>${esc(r.t)}</b> holds ${r.n} findings: ${r.d.s} satisfied, ${r.d.p} partially, ${r.d.o} other than satisfied and ${r.d.n} not assessed.</p>
      <p class="compliance-prose">Publishing freezes them. WS-X90's control statuses and traces read them from then on, and the publication is recorded in the program's activity.</p>
      ${detStack(r.d)}`, footer: doneBtn("Publish assessment results", `${r.t} published, ${r.n} findings (prototype: nothing is saved)`) };
  };
  M["cmp-plan"] = () => ({ title: "Plan an assessment", body: `
    ${field("Title", `<input class="compliance-in" value="WS-X90 not-assessed controls — FY2027 Q1" aria-label="Title">`)}
    ${field("SSP", `<input class="compliance-in" value="SYS-WSX90 · SSP 2, published Jul 25 · 560 controls" aria-label="SSP">`, "The latest published SSP of a system that selects the controls.")}
    ${field("Controls", `<div class="compliance-radios"><label><input type="radio" name="cmpplan" checked> Not assessed: 90 controls</label><label><input type="radio" name="cmpplan"> Short of satisfied: 47 controls</label><label><input type="radio" name="cmpplan"> Chosen controls</label></div>`)}
    <div class="next" role="status">${gl("info")}<span>Plans the <b>300</b> assessment objectives of those 90 controls nobody has judged, one plan objective each.</span></div>
    ${field("Window", `<input class="compliance-in" value="Jan 4 – Mar 26, 2027" aria-label="Window">`)}
    ${field("Lead assessor", `<input class="compliance-in" value="D. Okafor" aria-label="Lead assessor">`)}`, footer: doneBtn("Plan an assessment", "300 objectives over 90 controls planned (prototype: nothing is saved)") });
  for (const r of ["assessments-plans", "assessments-results"]) ROUTE_NAV[r] = "assessments";

  // ════════════════════ Campaign: the assessor's view ════════════════════
  // Requests are the evidence the campaign's controls rest on; their review states and the interim
  // determinations are real. The two-sided status is the proposal, mapped from those states.
  const REQUESTS = [
    ["r1", "AC-17(3)", "Managed Access Control Points", "Approved WS-X90 external network baseline showing the single managed access control point", null, "accepted", "satisfied"],
    ["r2", "AC-17(4)", "Privileged Commands and Access", "Remote privileged command admission test report, approved list, attestation and window checks", null, "needs_revision", "partially_satisfied"],
    ["r3", "AC-17(9)", "Disconnect or Disable Access", "Remote access disconnect and disable test report, 30-second boundary", "Joel Barrantes", "pending", null],
    ["r4", "AC-2(7)", "Privileged User Accounts", "Privileged role table and membership change log export, LRU-013", "Priya Raghavan", "pending", null],
    ["r5", "AU-14", "Session Audit", "Nonlocal maintenance session transcript sample, LRU-014, three sessions", "Joel Barrantes", "pending", null],
    ["r6", "CA-3", "Information Exchange", "External exchange agreement register with interim-approval exceptions", null, "needs_revision", "partially_satisfied"],
    ["r7", "CM-8(4)", "Accountability Information", "Component inventory accountability field export, all 20 WS-X90 line replaceable units", "Joel Barrantes", "pending", null],
    ["r8", "CM-11(2)", "Software Installation with Privileged Status", "Installation privilege elevation test, LRU-019 maintenance session to LRU-001", null, "accepted", "satisfied"],
    ["r9", "CM-12", "Information Location", "Protected information location map and location-change log, LRU-001 and LRU-015", "Priya Raghavan", "pending", null],
    ["r10", "CM-14", "Signed Components", "Boot chain signature verification test, out-of-set certificate injection on LRU-002", null, "accepted", "satisfied"],
    ["r11", "IA-2(2)", "Multi-factor Authentication to Non-privileged Accounts", "Non-privileged authentication method inventory, LRU-019 and LRU-017 baselines", null, "needs_revision", "other_than_satisfied"],
    ["r12", "IA-2(8)", "Access to Accounts — Replay Resistant", "Replay resistance test report, LRU-007 gateway and LRU-008 link authentication", null, "accepted", "satisfied"],
    ["r13", "IA-3(1)", "Cryptographic Bidirectional Authentication", "Switch port authentication state export, LRU-009 with LRU-002 boot measurement bindings", null, "needs_revision", "partially_satisfied"],
    ["r14", "IA-12", "Identity Proofing", "Registration authority identity proofing walkthrough record, LRU-017", "Joel Barrantes", "pending", null],
  ];
  const reqState = {};
  for (const [id, , , , , rv, det] of REQUESTS) reqState[id] = { team: "ready", as: rv === "accepted" ? "accepted" : rv === "needs_revision" ? "flagged" : null, det: rv === "pending" ? null : det, why: rv === "pending" ? "" : "Recorded in the evidence review before the two-sided flow." };
  const TEAM = [["not_ready", "Not ready"], ["internal", "Internal review"], ["ready", "Ready"]];
  const teamPill = (t) => (t === "ready" ? pill("info", "Ready") : t === "internal" ? pill("warn", "Internal review") : pill("none", "Not ready"));
  const asPillR = (s) => (s.as === "accepted" ? pill("ok", "Accepted") : s.as === "flagged" ? pill("bad", "Flagged") : s.team === "ready" ? pill("none", "Waiting on assessor") : muted("—"));
  const campTabs = (cur) => tabs([["campaign", "Requests", 368], ["campaign-findings", "Findings by objective", 245]], cur);
  const campHeader = () => header("Expanded Control Set Assessment", `<span>Sep 14 – Nov 20 · <b>${days("2026-11-20")} days left</b></span><span>Lead assessor <b>D. Okafor</b></span><span>Assessor <b>Nadia Fournier</b></span>`, `<a style="text-decoration:none" class="btn" href="#assessments">Leave assessment</a><button type="button" class="btn ink" data-modal="cmp-publish" data-id="inc2">Publish results</button>`);
  S.campaign = () => {
    const counts = { accepted: 0, flagged: 0, waiting: 0, internal: 0, not_ready: 0 };
    for (const id in reqState) { const s = reqState[id]; if (s.as) counts[s.as]++; else if (s.team === "ready") counts.waiting++; else counts[s.team]++; }
    return page(
      campHeader(),
      pair(
        `<div class="card"><div class="t">Evidence requests <span class="num">368</span></div><div class="stack"><i style="width:${(226 / 368) * 100}%;background:var(--ok)"></i><i style="width:${(88 / 368) * 100}%;background:var(--info)"></i><i style="width:${(54 / 368) * 100}%;background:var(--bad)"></i></div><div class="legend"><span style="--c:var(--ok)">Accepted 226</span><span style="--c:var(--info)">Ready, waiting on the assessor 88</span><span style="--c:var(--bad)">Flagged 54</span><span style="--c:var(--ink-4)">Not ready 0</span></div><p class="note-p">WS-X90's evidence review states read as the two-sided flow: accepted, pending and needs revision.</p></div>`,
        `<div class="card"><div class="t">Who sets what</div><div class="compliance-two"><div class="compliance-side"><b>The team</b><div class="compliance-flow">${pill("none", "Not ready")}→${pill("warn", "Internal review")}→${pill("info", "Ready")}</div></div><div class="compliance-side"><b>Only the assessor</b><div class="compliance-flow">${pill("bad", "Flagged")}${pill("ok", "Accepted")}</div><span class="compliance-sub">With a determination and a required justification.</span></div></div></div>`,
      ),
      campTabs("campaign"),
      views([["All", 14], ["Waiting on me", counts.waiting], ["Flagged", counts.flagged], ["Accepted", counts.accepted]]),
      tools("Search requests", ["Control", "Owner", "Team status", "Assessor status"]),
      table(["Request", "Control", "Owner", "Team", "Assessor", "Determination"], REQUESTS.map(([id, c, , t, o]) => { const s = reqState[id]; return { id, cells: [cut(t, 360), tag(c), who(o), teamPill(s.team), asPillR(s), s.det ? stPill(s.det) : muted("—")] }; }), 368, "cmp-request"),
      note("Rows are this campaign's evidence with their real review state; the interim determinations come from the draft increment 2 results. Not ready and Internal review are the team's own states, new with this flow."),
    );
  };
  MODED.add("campaign");
  P["cmp-request"] = (id) => {
    const r = REQUESTS.find((x) => x[0] === id) || REQUESTS[0];
    const [, c, ct, t, o] = r;
    const s = reqState[r[0]];
    return { label: mark("cmp-request", r[0], "Request preview"), body: `
      ${phead(t)}
      ${kv([["Control", `${tag(c)} ${esc(ct)}`], ["Owner", who(o)], ["Evidence", "Version 1"], ["Assessor", asPillR(s)], ["Determination", s.det ? stPill(s.det) : muted("None yet")]])}
      ${sect("The team sets", null, `<div class="compliance-steps" role="group" aria-label="Team status">${TEAM.map(([k, l]) => `<button type="button" aria-pressed="${s.team === k}" data-cmp="team" data-id="${r[0]}" data-v="${k}">${l}</button>`).join("")}</div>`)}
      ${sect("Only the assessor sets", null, `<div class="btns" role="group" aria-label="Assessor status">${btn("Flag", `data-modal="cmp-assess" data-id="${r[0]}|flag"`)}${btn("Accept", `data-modal="cmp-assess" data-id="${r[0]}|accept"`, true)}</div>${s.why ? `<span class="compliance-sub">Justification: ${esc(s.why)}</span>` : `<span class="compliance-sub">${s.team === "ready" ? "Ready: it waits on the assessor." : "Not ready yet: the assessor can still flag it."}</span>`}`)}
      ${sect("Objectives", null, `${li("", "Control statement · every objective under it", s.det ? stPill(s.det) : pill("none", "Not judged"))}`)}` };
  };
  M["cmp-assess"] = (id) => {
    const [rid, act] = (id || "r3|accept").split("|");
    const r = REQUESTS.find((x) => x[0] === rid) || REQUESTS[2];
    const acc = act === "accept";
    return { title: acc ? "Accept request" : "Flag request", body: `
      ${kv([["Request", esc(r[3])], ["Control", tag(r[1])]])}
      ${field("Determination", `<div class="compliance-radios" role="radiogroup" aria-label="Determination"><label><input type="radio" name="cmpdet" value="satisfied"${acc ? " checked" : ""}> Satisfied</label><label><input type="radio" name="cmpdet" value="other_than_satisfied"${acc ? "" : " checked"}> Other than satisfied</label></div>`, "NIST SP 800-53A's two determinations, on the control's statement.")}
      ${field("Justification", `<textarea class="compliance-ta" id="cmpWhy" aria-required="true" aria-describedby="cmpWhyErr" aria-label="Justification"></textarea><span class="compliance-err" id="cmpWhyErr" hidden>${gl("diamond")}Write why: a determination needs a justification.</span>`, "Required. It is kept with the finding.")}`,
      footer: `<div class="compliance-foot"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-cmp="assess-submit" data-id="${rid}|${act}">${acc ? "Accept" : "Flag"}</button></div>` };
  };

  const FAM = [["SC", 33, 21, 2, 4, 6], ["SA", 31, 11, 2, 1, 17], ["AC", 23, 16, 3, 0, 4], ["SI", 23, 16, 1, 2, 4], ["AU", 17, 10, 3, 1, 3], ["CM", 17, 11, 3, 0, 3], ["IR", 15, 6, 2, 0, 7], ["PE", 11, 4, 0, 1, 6], ["CP", 11, 6, 2, 0, 3], ["PS", 8, 5, 1, 0, 2], ["RA", 8, 3, 1, 0, 4], ["SR", 8, 5, 0, 0, 3]];
  const INTERIM = [["AC-17(3)", "Managed Access Control Points", "satisfied"], ["AC-17(4)", "Privileged Commands and Access", "partially_satisfied"], ["AU-6(3)", "Correlate Audit Record Repositories", "satisfied"], ["AU-12(1)", "System-wide and Time-correlated Audit Trail", "satisfied"], ["CA-3", "Information Exchange", "partially_satisfied"], ["CM-8(2)", "Automated Maintenance", "satisfied"], ["CM-12(1)", "Automated Tools to Support Information Location", "not_assessed"], ["IA-2(2)", "Multi-factor Authentication to Non-privileged Accounts", "other_than_satisfied"], ["IA-2(12)", "Acceptance of PIV Credentials", "not_assessed"], ["IA-3(1)", "Cryptographic Bidirectional Authentication", "partially_satisfied"], ["MA-3(5)", "Execution with Privilege", "partially_satisfied"], ["SR-10", "Inspection of Systems or Components", "satisfied"]];
  S["campaign-findings"] = () => page(
    campHeader(),
    pair(
      `<div class="card"><div class="t">Increment 1, published Nov 12 <span class="num">225 findings</span></div>${detStack(DET(124, 21, 9, 71))}<p class="note-p">Judged by D. Okafor on each control's statement.</p></div>`,
      `<div class="card"><div class="t">Increment 2, draft <span class="num">20 findings</span></div>${detStack(DET(13, 4, 1, 2))}<p class="note-p">Nadia Fournier, Nov 11–13. Decides nothing until published.</p></div>`,
    ),
    campTabs("campaign-findings"),
    `<h4 class="subhead">Increment 1 by family</h4>`,
    table(["Family", "Findings", "Satisfied", "Partially", "Other than", "Not assessed"], FAM.map(([f, n, s, p, o, x]) => ({ id: f, cells: [tag(f), num(n), num(s), p ? `<span class="num" style="color:var(--warn)">${p}</span>` : muted("0"), o ? `<span class="num" style="color:var(--bad)">${o}</span>` : muted("0"), x ? num(x) : muted("0")] })), 16, ""),
    `<h4 class="subhead">Increment 2 (draft), by objective</h4>`,
    table(["Control", "Objective", "Determination", "Assessor"], INTERIM.map(([c, t, d]) => ({ id: c, cells: [cut(`${c} ${t}`, 380), muted("Statement · all objectives"), stPill(d), who("Nadia Fournier")] })), 20, "cmp-finding"),
    note("Every finding of this campaign judges a control's statement, so it covers each objective under it; a plan written now would hold, and be judged on, one objective at a time."),
  );
  P["cmp-finding"] = (id) => {
    const f = INTERIM.find((x) => x[0] === id) || INTERIM[0];
    return { label: mark("cmp-finding", id, "Assessment finding preview"), body: `
      ${phead(`${f[0]} ${f[1]}`)}
      ${kv([["Determination", stPill(f[2])], ["Results", "Interim results, increment 2 · draft"], ["Judges", "The control's statement, every objective under it"], ["Assessor", who("Nadia Fournier")]])}
      ${f[2] !== "satisfied" ? `<div class="next">${gl(f[2] === "not_assessed" ? "ring" : "diamond")}<span>${f[2] === "not_assessed" ? "Says Not assessed: it judges nothing." : "Once published, WS-X90 reads this control as " + ST[f[2]][1].toLowerCase() + "."}</span></div>` : ""}
      ${sect("Trace", null, traceStrip(CTRL[f[0]] || { req: [1], ev: [1], f: [], draft: true }))}` };
  };
  MODED.add("campaign-findings");
  ROUTE_NAV["campaign-findings"] = "assessments";

  // ════════════════════ Cyber T&E ════════════════════
  const PHASES = [
    [1, "DT&E", "Understand cybersecurity requirements", "640 requirements · 560 controls · 1 customer document", "check"],
    [2, "DT&E", "Characterize the attack surface", "23 risks name 42 ATT&CK techniques", "part"],
    [3, "DT&E", "Cooperative vulnerability identification", "Planned Jan 11 – Feb 5", "clock"],
    [4, "DT&E", "Adversarial cybersecurity DT&E", "Not planned", "ring"],
    [5, "OT&E", "Cooperative vulnerability and penetration assessment", "Not planned", "ring"],
    [6, "OT&E", "Adversarial assessment", "Not planned", "ring"],
  ];
  const CYBER = [
    ["cvi", "WS-X90 cooperative vulnerability identification — FY2027", "CVI", 3, "planned", "2027-01-11", "2027-02-05", "Ingrid Solberg", false],
    ["acd", "WS-X90 adversarial cybersecurity DT&E — FY2027", "ACD", 4, "planned", "2027-04-12", "2027-05-07", "Wes Duarte", true],
    ["cvpa", "WS-X90 CVPA — IOT&E", "CVPA", 5, "planned", "2027-09-13", "2027-10-01", null, true],
    ["aa", "WS-X90 adversarial assessment — IOT&E", "AA", 6, "planned", "2027-10-18", "2027-11-12", null, true],
  ];
  const CYF = [
    ["Maintenance Access Gateway accepts SSH password logons from the flightline LAN", "high", "CVI", "POA&M item created"],
    ["Tactical Data Radio management port answers on the mission network", "moderate", "CVI", "Operational issue opened"],
    ["Update & Recovery Controller loads an unsigned recovery image from removable media", "critical", "CVI", "POA&M item created"],
  ];
  S["cyber-te"] = () => page(
    header("Cyber T&E", "<span>DoD Cyber DT&amp;E Guidebook, phases 1–6</span><span>CVI lead <b>Ingrid Solberg</b></span>", `<span class="btn">Export test plan</span><button type="button" class="btn ink" data-modal="cmp-cyber-plan">Plan a cyber test</button>`),
    pair(
      completion({ title: "Phases under way or done", total: 6, done: 2, unit: "of 6 phases", color: "var(--ink)", note: "phase 3 starts Jan 11", minis: [["Cyber test campaigns", 1, 0], ["Techniques named", 42, 0], ["Findings from tests", 0, 0]] }),
      attention([["clock", "CVI starts in 55 days, no plan yet", 1], ["ring", "Phases not planned", 3], ["diamond", "Penetration test of the maintenance gateway, cancelled", 1], ["info", "Risks that name an ATT&CK technique", 23]]),
    ),
    `<div class="compliance-phases">${PHASES.map(([n, band, t, s, g]) => `<div class="compliance-phase${n === 3 ? " on" : ""}" role="button" tabindex="0" data-panel="cmp-phase" data-id="${n}"><span class="compliance-band">${band} · PHASE ${n}</span><b>${esc(t)}</b><span class="who">${gl(g)}<span class="compliance-sub">${esc(s)}</span></span></div>`).join("")}</div>`,
    `<h4 class="subhead">Cyber test campaigns</h4>`,
    table(["Campaign", "Phase", "Status", "Window", "Lead"], CYBER.map(([id, t, ph, n, st, a, b, lead, ex]) => ({ id, cells: [esc(t) + (ex ? " " + EX : ""), tag(`${n} · ${ph}`), ex ? pill("none", "Proposed") : stPillC(st), `<span class="num">${day(a)} – ${day(b)}</span>`, who(lead)] })), 4, "cmp-cyber"),
    `<h4 class="subhead">Findings feeding the POA&amp;M</h4>`,
    `<div class="card" style="gap:10px"><div class="compliance-flow">${tag("Cyber test finding")}→${tag("Operational issue")}→${tag("POA&M item")}→${tag("Risk")}<span class="compliance-sub" style="margin-inline-start:8px">each test finding opens an issue with its severity; a POA&amp;M item answers it on its window</span></div></div>`,
    table(["Finding", "Severity", "From", "Then"], CYF.map(([t, s, from, then]) => ({ id: "cvi", cells: [cut(t, 420) + " " + EX, sevPill(s), tag(from), pill(then.startsWith("POA") ? "ok" : "info", then)] })), 3, "cmp-cyber"),
    note("Real: phases 1–2 from WS-X90's requirements, controls and risks; the CVI campaign (planned Jan 11 – Feb 5, Ingrid Solberg) and the cancelled maintenance gateway penetration test. Example: the ACD, CVPA and AA campaigns and every test finding, since no test has run."),
  );
  P["cmp-phase"] = (id) => {
    const p = PHASES[Number(id) - 1] || PHASES[2];
    const [n, band, t, s] = p;
    const body = {
      1: `${sect("What the testers start from", null, `${li("check", "640 requirements, all allocated to an element", "")}${li("check", "560 controls in the baseline: NIST High, CNSSI 1253 and 3 overlays", "")}${li("check", "Customer A's CUSA-SSRD, 14 requirements", "")}`)}`,
      2: `${sect("Most named ATT&CK techniques", 42, [["T1078", "Valid Accounts", 5], ["T1200", "Hardware Additions", 3], ["T1021", "Remote Services", 2], ["T1110", "Brute Force", 2], ["T1565", "Data Manipulation", 2], ["T1601", "Modify System Image", 2]].map(([c, nm, k]) => li("", `<b style="font-weight:500">${c}</b> ${nm}`, `${k} risks`)).join(""))}<p class="note-p">23 of WS-X90's risks name a technique, 42 links in all. Each risk's techniques are where a tester looks first.</p>`,
      3: `${sect("Campaign", 1, li("clock", "WS-X90 cooperative vulnerability identification — FY2027", "Jan 11 – Feb 5"))}<p class="compliance-prose">A cooperative vulnerability identification of the mission computer and its maintenance interface, with the program's engineers, ahead of the adversarial phases.</p>`,
    }[n] || `<div class="next">${gl("ring")}<span>No campaign plans this phase.</span>${btn("Plan a cyber test", `data-modal="cmp-cyber-plan"`)}</div>`;
    return { label: mark("cmp-phase", id, "Phase preview"), body: `${phead(`Phase ${n} · ${t}`)}${kv([["Band", band === "DT&E" ? "Developmental test and evaluation" : "Operational test and evaluation"], ["Status", esc(s)]])}${body}` };
  };
  P["cmp-cyber"] = (id) => {
    const c = CYBER.find((x) => x[0] === id) || CYBER[0];
    const [, t, ph, n, st, a, b, lead, ex] = c;
    return { label: mark("cmp-cyber", id, "Cyber test campaign preview"), body: `
      ${phead(t, btn("Open campaign", `data-cmp="done" data-msg="The campaign opens in assessment mode (prototype)"`, true))}${ex ? `<p>${EX}</p>` : ""}
      ${kv([["Phase", `${n} · ${esc(ph)}`], ["Status", ex ? pill("none", "Proposed") : stPillC(st)], ["Window", `<span class="num">${day(a)} – ${day(b)}</span>`], ["Lead", who(lead)], ["Kind", tag("Cyber test")]])}
      ${sect("Scope", 2, `${li("", esc(elName("CN-109101")))}${li("", esc(elName("CN-109114")))}`)}
      ${sect("Before it starts", 3, `${li(ex ? "ring" : "ring", "Rules of engagement signed", "Not yet")}${li("ring", "Test plan published", "Not yet")}${li("check", "Phase 2 attack surface: 42 techniques", "")}`)}
      ${sect("Findings", 0, `${muted("None yet. Each finding opens an operational issue and can be answered by a POA&M item.")}`)}` };
  };
  M["cmp-cyber-plan"] = () => ({ title: "Plan a cyber test", body: `
    ${field("Phase", `<div class="compliance-radios"><label><input type="radio" name="cmpph"> 3 · Cooperative vulnerability identification (CVI)</label><label><input type="radio" name="cmpph" checked> 4 · Adversarial cybersecurity DT&amp;E (ACD)</label><label><input type="radio" name="cmpph"> 5 · Cooperative vulnerability and penetration assessment (CVPA)</label><label><input type="radio" name="cmpph"> 6 · Adversarial assessment (AA)</label></div>`)}
    ${field("Title", `<input class="compliance-in" value="WS-X90 adversarial cybersecurity DT&amp;E — FY2027" aria-label="Title">`)}
    ${field("Scope", `<input class="compliance-in" value="CN-109101 Mission Computer, CN-109114 Maintenance Access Gateway" aria-label="Scope">`)}
    ${field("Window", `<input class="compliance-in" value="Apr 12 – May 7, 2027" aria-label="Window">`)}
    ${field("Test team", `<input class="compliance-in" value="" placeholder="A red team, by organization" aria-label="Test team">`)}`, footer: doneBtn("Plan a cyber test", "Cyber test campaign planned (prototype: nothing is saved)") });

  // ════════════════════ AI drafts (Example) ════════════════════
  const TEMPLATE = "The SYS-WSX90 satisfies the tailored intent of {c} through a combination of system-level procedures and mapped component implementations. This narrative is synthetic demo content.";
  const BATCHES = [
    { id: "b1", t: "SSP 3 narratives · AC family", kind: "Narrative", when: "Nov 16", items: [
      ["AC-2", "Account management on WS-X90 rests on REQ-001 and REQ-075: accounts on the Mission Computer, Protected Network Gateway, Navigation & Timing Subsystem and Maintenance Laptop are created, reviewed and disabled through the provisioning workstation.", "REQ-001, REQ-075 · Evidence for REQ-001"],
      ["AC-2(7)", "Platform privilege is carried by named roles, never attached to an account (REQ-443). The Platform Management Controller holds the role table; membership changes are logged and exported.", "REQ-443 · Privileged role table and membership change log export, LRU-013"],
      ["AC-11", "The Protected Network Gateway, Platform Management Controller and Maintenance Access Gateway lock a session after the inactivity period AC-11_ODP[02] sets; that period is not set yet.", "REQ-008, REQ-082 · AC-11_ODP[02] not set"],
    ] },
    { id: "b2", t: "Requirements for the controls no requirement maps", kind: "Requirement", when: "Nov 16", items: [
      ["SA-24", "WS-X90 shall apply the nine cyber resiliency techniques SA-24_ODP[03] names, Adaptive Response through Substantiated Integrity, to the Mission Computing and Communications subsystems.", "SA-24_ODP[03] · program tailoring"],
      ["SI-4(13)", "Map REQ-262 to SI-04(13)(a)[02], (b)[02] and (c)[02]: event patterns are profiled beside the traffic it already profiles.", "REQ-262 · SI-4(13) objectives"],
      ["SC-34", "The Mission Computer and Secure Boot Controller shall load the operating system and applications from hardware-enforced read-only media.", "SC-34 · Secure Boot Controller"],
    ] },
    { id: "b3", t: "SSP 3 narratives · SI family", kind: "Narrative", when: "Nov 15", items: [
      ["SI-2", "Flaws are identified by the monthly mission network scan and the Mission Computer SBOM. CVE-2024-6387 was fixed in Mission Computer version 2 (openssh-server 9.8p1); updates install within the SI-02_ODP period, not yet set.", "REQ-064 · Mission Computer SBOM · CVE-2024-6387"],
      ["SI-4(13)", "Outbound traffic is profiled per mission phase on the Protected Network Gateway and Tactical Data Radio (REQ-262).", "REQ-262"],
    ] },
  ];
  const draftState = {};
  BATCHES[0].items.forEach((_, i) => { if (i === 0) draftState["b1-0"] = "approved"; });
  BATCHES[2].items.forEach((_, i) => { draftState[`b3-${i}`] = i === 0 ? "approved" : "rejected"; });
  const tally = (b) => { const s = b.items.map((_, i) => draftState[`${b.id}-${i}`]); return { ok: s.filter((x) => x === "approved").length, no: s.filter((x) => x === "rejected").length, wait: s.filter((x) => !x).length }; };
  S["ai-drafts"] = () => {
    const all = BATCHES.flatMap((b) => b.items.map((_, i) => draftState[`${b.id}-${i}`]));
    const done = all.filter(Boolean).length;
    return page(
      header("AI drafts", "<span>Drafted from WS-X90's requirements, evidence and parameters</span><span>Nothing applies without a person</span>", `<span class="btn">Settings</span><span class="btn ink">Draft narratives</span>`),
      `<div class="next">${gl("info")}<span>${EX} WS-X90 holds no AI drafts. What is real: <b>546 of SSP 3's 560</b> narratives are template text, and 14 controls have no requirement.</span></div>`,
      pair(
        completion({ title: "Drafts reviewed", total: all.length, done, unit: "approved or rejected", note: "Example batches", minis: [["Approved", all.filter((x) => x === "approved").length, all.length], ["Rejected", all.filter((x) => x === "rejected").length, all.length], ["Waiting", all.filter((x) => !x).length, all.length]] }),
        attention([["clock", "Drafts waiting on a reviewer", all.filter((x) => !x).length], ["ring", "Narratives that are template text", 546], ["ring", "Controls with no requirement", 14]], "Where drafts help"),
      ),
      table(["Batch", "Kind", "Drafts", "Approved", "Rejected", "Waiting", "Drafted"], BATCHES.map((b) => { const t = tally(b); return { id: b.id, cells: [`${esc(b.t)} ${EX}`, tag(b.kind), num(b.items.length), num(t.ok), num(t.no), t.wait ? `<b class="num" style="font-weight:500;color:var(--warn)">${t.wait}</b>` : muted("0"), `<span class="num">${esc(b.when)}</span>`] }; }), 3, "cmp-batch"),
      note("Each draft names its sources and is applied only when a person approves it; an approved narrative becomes a new SSP 3 edit, recorded under the approver's name."),
    );
  };
  P["cmp-batch"] = (id) => {
    const b = BATCHES.find((x) => x.id === id) || BATCHES[0];
    const t = tally(b);
    return { label: mark("cmp-batch", b.id, "Draft batch preview"), body: `
      ${phead(b.t, btn("Approve all waiting", `data-cmp="draft-all" data-id="${b.id}"`, true))}<p>${EX}</p>
      ${kv([["Kind", tag(b.kind)], ["Drafts", `${b.items.length} · ${t.ok} approved · ${t.no} rejected · ${t.wait} waiting`], ["Drafted", esc(b.when)]])}
      ${b.items.map(([c, txt, src], i) => { const k = `${b.id}-${i}`, s = draftState[k]; return `<div class="compliance-draft"><div class="hd"><b>${esc(c)}</b>${s === "approved" ? pill("ok", "Approved") : s === "rejected" ? pill("bad", "Rejected") : pill("warn", "Waiting")}<span class="compliance-pa">${s ? `<button type="button" class="btn sm" data-cmp="draft" data-id="${k}" data-v="">Undo</button>` : `<button type="button" class="btn sm" data-cmp="draft" data-id="${k}" data-v="rejected">Reject</button><button type="button" class="btn sm ink" data-cmp="draft" data-id="${k}" data-v="approved">Approve</button>`}</span></div><div class="bd">${b.kind === "Narrative" ? `<span class="compliance-was">${esc(TEMPLATE.replace("{c}", c))}</span>` : ""}<span class="compliance-now">${esc(txt)}</span><span class="compliance-src">Sources: ${esc(src)}</span></div></div>`; }).join("")}` };
  };

  // ════════════════════ Frameworks & overlays ════════════════════
  const GAPS = [
    { id: "high", t: "NIST SP 800-53 Rev 5 High baseline", kind: "Baseline", total: 370, in: 346, s: 145, p: 39, n: 52, x: 110 },
    { id: "moderate", t: "NIST SP 800-53 Rev 5 Moderate baseline", kind: "Baseline", total: 287, in: 280, s: 123, p: 30, n: 42, x: 85, miss: "AC-18 AC-18(1) AC-18(3) AC-20 AC-20(1) AC-20(2) IA-12(5)" },
    { id: "low", t: "NIST SP 800-53 Rev 5 Low baseline", kind: "Baseline", total: 149, in: 147, s: 57, p: 22, n: 25, x: 43, miss: "AC-18 AC-20" },
    { id: "privacy", t: "NIST SP 800-53 Rev 5 Privacy baseline", kind: "Baseline", total: 96, in: 46, s: 14, p: 10, n: 6, x: 16, miss: "AC-3(14) AT-3(5) AU-3(3) IR-2(3) IR-8(1) PM-3 PM-4 PM-5(1) PM-6 PM-7 PM-8 PM-9 PM-10 PM-11 PM-13 PM-14 PM-17 PM-18 PM-19 PM-20 PM-20(1) PM-21 PM-22 PM-24 PM-25 PM-26 PM-27 PM-28 PM-31 PT-1 PT-2 PT-3 PT-4 PT-5 PT-5(2) PT-6 PT-6(1) PT-6(2) PT-7 PT-7(1) PT-7(2) PT-8 RA-8 SA-8(33) SC-7(24) SI-12(1) SI-12(2) SI-18 SI-18(4) SI-19" },
    { id: "cnssi", t: "CNSSI 1253 National Security System Allocation", kind: "Overlay adds", total: 201, in: 200, s: 31, p: 8, n: 38, x: 123, miss: "AC-20(3)" },
    { id: "cusa", t: "Customer A rail integration", kind: "Overlay adds", total: 6, in: 3, s: 1, p: 0, n: 1, x: 1, miss: "SC-12(2) SC-32 SI-7(6)" },
  ];
  GAPS[0].miss = HIGH.filter((c) => !SAVED.sel.has(c)).join(" ");
  const removedBy = (c) => { for (const r of SAVED.rows) if (r.rem.includes(c)) return r.title; return null; };
  const gapState = { cur: "high" };
  const fwTabs = (cur) => tabs([["frameworks", "Catalog & baselines", 4], ["frameworks-overlays", "Overlays", 5], ["frameworks-gap", "Gap assessment"]], cur);
  const fwHeader = () => header("Frameworks & overlays", "<span>Catalog <b>NIST SP 800-53 Rev 5.1.1</b> · 1,014 active controls · 20 families</span>", `<span class="btn">Import OSCAL</span><span class="btn ink">Create overlay</span>`);
  S.frameworks = () => page(
    fwHeader(),
    pair(
      completion({ title: "WS-X90's baseline in the catalog", total: 1014, done: 560, unit: "controls selected", color: "var(--ink)", note: "182 withdrawn controls not counted", minis: [["Satisfied", 176, 560], ["Assessed", 223, 560], ["Families", 20, 20]] }),
      attention([["part", "High baseline controls left out by a layer", 24], ["ring", "Privacy baseline controls not selected", 50], ["ring", "Controls added beyond High", 214, true]], "Against the reference baselines"),
    ),
    fwTabs("frameworks"),
    table(["Baseline", "Controls", "In WS-X90's baseline", "Satisfied", "Coverage"], GAPS.filter((g) => g.kind === "Baseline").map((g) => ({ id: g.id, cells: [esc(g.t), num(g.total), of(g.in, g.total), num(g.s), `<span style="display:inline-flex;gap:8px;align-items:center;width:160px">${bar(pct(g.in, g.total))}<span class="num">${pct(g.in, g.total)}%</span></span>`] })), 4, "cmp-gap"),
    note("Reference baselines are published profiles on the catalog, shared across the workspace. In WS-X90's baseline counts the controls of each that WS-X90's stack selects today; Satisfied is its control status."),
  );
  const OVL = [
    ["cnssi", "CNSSI 1253 National Security System Allocation", 1, "published", 201, 17, 2, true],
    ["mission", "Mission Assurance Overlay", 1, "published", 3, 5, 5, true],
    ["deployed", "Deployed Platform Overlay", 1, "published", 3, 0, 4, true],
    ["custa", "Customer A Tailoring", 1, "published", 2, 4, 2, true],
    ["cusa", "Customer A rail integration", 1, "published", 6, 2, 1, false],
  ];
  const OVL_EX = [["cls", "CNSSI 1253 Classified Information Overlay", 2, "draft", 12, 0, 0], ["space", "CNSSI 1253 Space Platform Overlay", 1, "published", 9, 3, 0]];
  S["frameworks-overlays"] = () => page(
    fwHeader(),
    pair(
      completion({ title: "Overlays published", total: 5, done: 5, unit: "published, each at version 1", color: "var(--ink)", minis: [["In WS-X90's stack", 4, 5], ["Newer version waiting", 0, 0], ["Drafts", 0, 0]] }),
      attention([["ring", "Newer versions not taken", 0, true], ["info", "Applied by more than one program", 5], ["ring", "Overlays with parameter values", 0, true]]),
    ),
    fwTabs("frameworks-overlays"),
    tools("Search overlays", ["State", "Catalog edition", "In WS-X90"]),
    table(["Overlay", "Version", "State", "Adds", "Removes", "Applied by", "In WS-X90"], OVL.map(([id, t, v, st, a, r, ap, inW]) => ({ id, cells: [esc(t), num(v), pill("ok", cap(st)), `<span class="num" style="color:var(--ok)">+${a}</span>`, `<span class="num">−${r}</span>`, `<span class="num">${ap} stacks</span>`, inW ? pill("ok", "Applied") : pill("none", "Not applied")] }))
      .concat(OVL_EX.map(([id, t, v, st, a, r]) => ({ id, cells: [`${esc(t)} ${EX}`, num(v), st === "draft" ? pill("warn", "Draft") : pill("ok", "Published"), `<span class="num" style="color:var(--ok)">+${a}</span>`, `<span class="num">−${r}</span>`, muted("0 stacks"), pill("none", "Not applied")] }))), 7, "cmp-ovl"),
    note("The five real overlays are the workspace's library; each version is a record of its own, chained to the one before. The two CNSSI 1253 appendix overlays are Example rows."),
  );
  P["cmp-ovl"] = (id) => {
    const o = OVL.find((x) => x[0] === id);
    if (!o) { const e = OVL_EX.find((x) => x[0] === id) || OVL_EX[0]; return { label: mark("cmp-ovl", id, "Overlay preview"), body: `${phead(e[1])}<p>${EX}</p>${kv([["Version", `${e[2]} · ${e[3] === "draft" ? pill("warn", "Draft") : pill("ok", "Published")}`], ["Adds", num(e[4])], ["Removes", num(e[5])]])}${e[2] > 1 ? sect("Versions", 2, `${li("clock", "Version 2", "Draft")}${li("check", "Version 1", "Published")}`) : ""}` }; }
    const L = id === "cusa" ? derive([...LAYERS.slice(0, 4), CUSA]).rows[4] : SAVED.rows.find((r) => r.key === id);
    const layer = [...LAYERS, CUSA].find((r) => r.key === id);
    return { label: mark("cmp-ovl", id, "Overlay preview"), body: `
      ${phead(o[1], o[7] ? `<a style="text-decoration:none" class="btn sm" href="#baseline">Open in Baseline</a>` : btn("Add to WS-X90", `data-modal="cmp-overlays"`, true))}
      ${kv([["Version", `1 · ${pill("ok", "Published")}`], ["Decisions", `<span class="num">+${o[4]} −${o[5]}</span>`], ["Applied by", `${o[6]} stacks`], ["In WS-X90", o[7] ? `Layer ${LAYERS.findIndex((r) => r.key === id) + 1} of 5 · <span class="num">+${L.add.length} −${L.rem.length}</span> where it sits` : `Would add ${L.add.length} and remove ${L.rem.length} after Customer A Tailoring`]])}
      <p class="compliance-prose">${esc(layer.desc)}</p>
      ${sect("Versions", 1, li("check", "Version 1", "Published"))}
      ${sect("Adds", o[4], codes(layer.dec.split(" ").filter((d) => d[0] === "+").map((d) => d.slice(1)), 30))}
      ${o[5] ? sect("Removes", o[5], codes(layer.dec.split(" ").filter((d) => d[0] === "-").map((d) => d.slice(1)))) : ""}` };
  };
  S["frameworks-gap"] = () => {
    const g = GAPS.find((x) => x.id === gapState.cur) || GAPS[0];
    const miss = g.miss.split(" ").filter(Boolean);
    return page(
      fwHeader(),
      fwTabs("frameworks-gap"),
      `<p class="compliance-prose" style="color:var(--ink-2)">How much of another baseline or overlay WS-X90 already covers: in its baseline, then satisfied. Choose one to see what is missing.</p>`,
      `<div class="compliance-gaps">${GAPS.map((x) => `<button type="button" class="compliance-gap" data-cmp="gap" data-id="${x.id}" aria-pressed="${x.id === g.id}"${x.id === g.id ? ' style="box-shadow:inset 0 0 0 1px var(--ink);border-color:var(--ink)"' : ""}><span class="t"><span>${esc(x.t)}</span></span><span class="compliance-sub">${esc(x.kind)}</span><span class="big num">${fmt(x.in)} <span class="compliance-sub" style="font-size:15px;font-weight:400">of ${fmt(x.total)}</span></span>${bar(pct(x.in, x.total))}<span class="compliance-sub">You cover ${fmt(x.in)} of ${fmt(x.total)} · ${fmt(x.s)} satisfied</span></button>`).join("")}</div>`,
      pair(
        completion({ title: `Satisfied of ${g.t}`, total: g.total, done: g.s, unit: "controls satisfied in WS-X90", minis: [["In the baseline", g.in, g.total], ["Assessed", g.s + g.p, g.total], ["Not in the baseline", g.total - g.in, g.total]] }),
        attention([["diamond", "Short of satisfied", g.p], ["clock", "Not assessed", g.n], ["ring", "No requirement or evidence", g.x], ["ring", "Not in WS-X90's baseline", miss.length]], "The rest"),
      ),
      `<h4 class="subhead">Not in WS-X90's baseline · ${miss.length}</h4>`,
      table(["Control", "Family", "Why it is out", "Next step"], miss.map((c) => { const by = removedBy(c); return { id: c, cells: [tag(c), tag(fam(c)), by ? `Removed by ${esc(by)}` : muted("Never selected by the stack"), `<span class="who">${gl("ring")}<span style="color:var(--ink)">${by ? "Review the removal" : "Add by tailoring"}</span></span>`] }; }), miss.length, ""),
      note("Computed from WS-X90's selected controls and its control status against each baseline's published selection and each overlay's adds."),
    );
  };
  P["cmp-gap"] = (id) => {
    const g = GAPS.find((x) => x.id === id) || GAPS[0];
    const miss = g.miss.split(" ").filter(Boolean);
    return { label: mark("cmp-gap", id, "Baseline preview"), body: `
      ${phead(g.t, `<button type="button" class="btn sm ink" data-cmp="gap-open" data-id="${g.id}">Open gap assessment</button>`)}
      ${kv([["Controls", num(g.total)], ["In WS-X90", of(g.in, g.total)], ["Satisfied", num(g.s)], ["Short of satisfied", num(g.p)]])}
      ${sect("Not in WS-X90's baseline", miss.length, codes(miss, 30))}` };
  };
  for (const r of ["frameworks-overlays", "frameworks-gap"]) ROUTE_NAV[r] = "frameworks";
  for (const r of ["requirements-objectives", "requirements-compliance"]) ROUTE_NAV[r] = "requirements";

  // ════════════════════ Interactions ════════════════════
  const rerender = (focusSel) => {
    const r = (location.hash || "#home").slice(1);
    const main = document.getElementById("main"), panel = document.getElementById("panel");
    const top = main.scrollTop;
    if (S[r]) { main.innerHTML = S[r](); main.scrollTop = top; }
    const lab = panel.querySelector(".bar-top span");
    if (!panel.hidden && open && lab && lab.textContent === open.label && P[open.kind]) panel.querySelector(".pbody").innerHTML = P[open.kind](open.id).body;
    if (focusSel) { const el = document.querySelector(focusSel); if (el) el.focus(); }
  };
  const closeModal = () => { const x = document.querySelector("#modal:not([hidden]) [data-close-modal]"); if (x) x.click(); };
  // The core draws ✕ on every panel but closes it only on a route change: close this module's panels on ✕ and Escape.
  let opener = null;
  const mine = () => { const p = document.getElementById("panel"), lab = p.querySelector(".bar-top span"); return !p.hidden && open && lab && lab.textContent === open.label; };
  const closeMine = () => { const p = document.getElementById("panel"); p.hidden = true; p.innerHTML = ""; const o = opener && opener.isConnected ? opener : document.getElementById("main"); opener = null; o.focus(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && document.getElementById("modal").hidden && mine()) { e.preventDefault(); closeMine(); } });
  document.addEventListener("click", (e) => {
    if (e.target.closest("#closePanel") && mine()) { e.stopPropagation(); closeMine(); return; }
    const t = e.target.closest("[data-panel]"); if (t && t.dataset.panel && !e.target.closest("[data-cmp]")) opener = t;
    const a = e.target.closest("[data-cmp]"); if (!a) return;
    e.stopPropagation(); e.preventDefault();
    const act = a.dataset.cmp, id = a.dataset.id || "", inPanel = !!a.closest("#panel");
    const where = inPanel ? "#panel " : "#main ";
    if (act === "done") { closeModal(); toast(a.dataset.msg || "Done (prototype: nothing is saved)"); return; }
    if (act === "whatif") { whatif.off.has(id) ? whatif.off.delete(id) : whatif.off.add(id); rerender(`${where}[data-cmp="whatif"][data-id="${id}"]`); return; }
    if (act === "whatif-reset") { whatif.off.clear(); rerender(`#main [data-cmp="whatif"]`); return; }
    if (act === "team") { reqState[id].team = a.dataset.v; if (a.dataset.v !== "ready" && !reqState[id].as) reqState[id].det = null; rerender(`${where}[data-cmp="team"][data-id="${id}"][data-v="${a.dataset.v}"]`); return; }
    if (act === "assess-submit") {
      const [rid, how] = id.split("|");
      const why = document.getElementById("cmpWhy"), err = document.getElementById("cmpWhyErr");
      const det = (document.querySelector('#modal input[name="cmpdet"]:checked') || {}).value || "satisfied";
      if (!why.value.trim()) { err.hidden = false; why.setAttribute("aria-invalid", "true"); why.focus(); return; }
      reqState[rid] = { ...reqState[rid], as: how === "accept" ? "accepted" : "flagged", det, why: why.value.trim() };
      closeModal(); rerender(`#panel [data-cmp="team"][data-id="${rid}"][aria-pressed="true"]`);
      toast(`${how === "accept" ? "Accepted" : "Flagged"} with ${ST[det][1].toLowerCase()} (prototype: nothing is saved)`); return;
    }
    if (act === "draft") { if (a.dataset.v) draftState[id] = a.dataset.v; else delete draftState[id]; rerender(`#panel [data-cmp="draft"][data-id="${id}"]`); return; }
    if (act === "draft-all") { const b = BATCHES.find((x) => x.id === id); b.items.forEach((_, i) => { if (!draftState[`${id}-${i}`]) draftState[`${id}-${i}`] = "approved"; }); rerender(`#panel [data-cmp="draft-all"]`); toast("Every waiting draft approved by you (prototype: nothing is saved)"); return; }
    if (act === "gap") { gapState.cur = id; rerender(`#main [data-cmp="gap"][data-id="${id}"]`); return; }
    if (act === "gap-open") { gapState.cur = id; if (location.hash === "#frameworks-gap") rerender(); else location.hash = "frameworks-gap"; return; }
  }, true);
  document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".compliance-phase[data-panel], .compliance-tree [data-panel]")) { e.preventDefault(); e.target.click(); }
  });
})();
