// Version 8, builder 4 (v8g-): DoD assurance data. STIG checklists on DISA's own rules and CCIs, and security engineering for a
// weapon system: NIST SP 800-160 Vol. 1 security outcomes at WS-X90's technical reviews, and the Cyber Survivability Endorsement.
// Routes: stigs (-open, -benchmarks, -imports), a checklist page per asset and STIG (stigs-<slug>, -comments, -activity),
// sse (-processes, -csa). Adds the STIG rules that map to SI-2 to control-si2.
// Real: DISA's STIGs from dl.dod.cyber.mil (manual XCCDF, read Nov 18): RHEL 9 V2R9 and V2R10, Cisco IOS Switch NDM V3R6 and V3R7,
// Cisco IOS Switch L2S V3R1, Cisco IOS XE Router NDM V3R7 and RTR V3R5, Windows 11 V2R9, Application Security and Development V6R5:
// Vuln and rule ids, titles, severities, CCIs, check, fix and discussion text, and what changed between releases. DISA's CCI list
// (2024-01-10, REPO supabase/reference) maps each CCI to NIST SP 800-53 Rev 5. WS-X90's imports (ingestion_jobs): the RHEL 9 checklist
// (Oct 13, 412 rules: 371 not a finding, 29 open, 12 not applicable), the Windows 11 SCAP scan (Oct 14, 286 results: 259 pass, 21 fail,
// 6 not applicable, 90.6%) and the switch checklist queued Nov 13, with their files, hashes and importer (Joel Barrantes). The deadline
// windows are deadlines-stig's (CAT I 30, CAT II 90, CAT III 180 days). NIST SP 800-160 Vol. 1 Rev. 1's 4 groups, 30 processes and 181
// outcomes as printed (REPO supabase/reference). WS-X90's PDR (in review, due Oct 10) and CDR (not started, due Oct 1) are its
// lifecycle_gates. The ten cyber survivability attributes, their pillars, the CSE IG's exemplar language and the CSRC levels come from
// the Joint Staff J6 CSE brief (CSIAC, Apr 13 2023, citing CSE IG v3.0, Jul 2022). Evidence titles, POA&M items, controls and their
// status, cyber T&E events and SA-24's chosen techniques are WS-X90's (PA.SSP, mod-after-risk, mod-v7-analysis, evidence_artifacts).
// Example, and marked: each rule's status beyond the real totals, finding details and comments, the ASD, switch and gateway checklists,
// the older imports, owners, SRR, Milestone B, TRR and Milestone C, which outcomes each review holds and their status, WS-X90's CSA
// statements, thresholds, objectives and CSRC, and the controls, techniques and events placed behind each attribute.
(function () {
  const PA = window.PA, { S, P, M, ROUTE_NAV, data, h } = PA, AK = PA.AK, SSP = PA.SSP;
  if (!AK) return;
  const { esc, fmt, pill, gl, tag } = h;
  const G = __DATA__;
  const EX = '<span class="ex">Example</span>';
  const ME = "Ingrid Solberg";
  const TODAY_ISO = "2026-11-17";

  // ——— Small parts ———
  const route = () => (location.hash || "#home").slice(1);
  const has = (r) => typeof S[r] === "function";
  const btn = (label, attrs = "", ink = false) => `<button type="button" class="btn sm${ink ? " ink" : ""}" ${attrs}>${label}</button>`;
  const hbtn = (label, attrs = "", ink = false) => `<button type="button" class="btn${ink ? " ink" : ""}" ${attrs}>${label}</button>`;
  const lk = (label, r) => `<span class="v8g-a" role="link" tabindex="0" data-go="${esc(r)}">${label}</span>`;
  const ak = (label, r, title = "") => `<a class="v8g-a" href="#${esc(r)}"${title ? ` title="${esc(title)}"` : ""}>${label}</a>`;
  const mu = (t) => `<span class="v8g-mu">${t}</span>`;
  const num = (n) => `<span class="num">${typeof n === "number" ? fmt(n) : esc(n)}</span>`;
  const plural = (n, w, ws) => `${fmt(n)} ${n === 1 ? w : ws || w + "s"}`;
  const code = (c) => `<span class="ak-code">${esc(c)}</span>`;
  const tr = (s, w) => `<span class="v8g-tr" style="max-width:${w}px" title="${esc(s)}">${esc(s)}</span>`;
  const md = (iso) => AK.md(iso);
  const mdy = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const andList = (l) => (l.length < 2 ? l.join("") : `${l.slice(0, -1).join(", ")} and ${l[l.length - 1]}`);
  const kv = (rows) => `<dl class="ak-kv">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
  const redraw = () => { const m = document.getElementById("main"), r = route(); if (m && has(r)) { const y = m.scrollTop; m.innerHTML = S[r](); m.scrollTop = y; } };
  const toast = (text, link, to) => {
    const el = SSP && SSP.ui && SSP.ui.toast ? SSP.ui.toast(text, link) : null, l = el && el.querySelector(".ak-link");
    if (l && to) { l.setAttribute("role", "link"); l.tabIndex = 0; const f = () => { location.hash = to; el.remove(); }; l.addEventListener("click", f); l.addEventListener("keydown", (e) => { if (e.key === "Enter") f(); }); }
    return el;
  };
  const closeModal = () => { const x = document.querySelector("#modal [data-close-modal]"); if (x) x.click(); };
  const refreshPanel = (key, id) => { const b = document.querySelector("#panel:not([hidden]) .pbody"); if (b && P[key]) { const p = P[key](id); if (p) b.innerHTML = p.body; } };
  function tbl({ cols, rows, total, panel = "", label = "", cls = "", pager = true, pagerHtml = "", empty = "Nothing matches this view." }) {
    const body = rows.length ? rows.map((r) => {
      if (r.raw) return `<tr class="v8g-grp">${r.raw}</tr>`;
      const pk = r.panel !== undefined ? r.panel : panel;
      const at = r.go ? ` data-go="${esc(r.go)}" tabindex="0"` : pk ? ` data-panel="${esc(pk)}" data-id="${esc(r.id == null ? "" : r.id)}" tabindex="0"` : "";
      return `<tr${r.cls ? ` class="${r.cls}"` : ""}${at}>${r.cells.map((c, i) => `<td${i ? "" : ' class="nm"'}>${c}</td>`).join("")}</tr>`;
    }).join("") : `<tr class="v8g-grp"><td colspan="${cols.length}">${mu(esc(empty))}</td></tr>`;
    const shown = rows.filter((r) => !r.raw).length;
    const pg = pagerHtml || (pager ? `<div class="pager"><span class="num">${shown ? `1–${fmt(shown)} of ${fmt(total == null ? shown : total)}` : "0 shown"}</span><span></span></div>` : "");
    return `<div class="frame v8g-frame ${cls}"><div class="tablebox"><table${label ? ` aria-label="${esc(label)}"` : ""}><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>${pg}</div>`;
  }
  const Q = {};
  const chips = (key, list, label, reset = "") => { const on = String(Q[key] == null ? list[0][0] : Q[key]); return `<div class="views v8g-views" role="group" aria-label="${esc(label)}">${list.map(([v, l, n]) => `<button type="button" class="qv${on === String(v) ? " on" : ""}" aria-pressed="${on === String(v)}" data-v8g-q="${esc(key)}" data-v8g-v="${esc(v)}"${reset ? ` data-v8g-reset="${esc(reset)}"` : ""}>${esc(l)}${n !== undefined ? ` <span class="num">${typeof n === "number" ? fmt(n) : esc(n)}</span>` : ""}</button>`).join("")}</div>`; };
  const filters = (search, list, end = "") => `<div class="tools v8g-tools"><span class="in">${esc(search)}</span>${list.map((f) => `<span class="flt">${esc(f)} ⌄</span>`).join("")}<span class="flt sub">+ Add filter</span>${end ? `<span class="v8g-push">${end}</span>` : ""}</div>`;
  const REQ = ' <span class="req">Required</span>', OPT = ' <span class="opt">Optional</span>';
  const field = (label, control, flag = "", hint = "") => `<div class="ak-field v8g-field"><span class="v8g-lbl">${esc(label)}${flag}</span>${control}${hint ? `<span class="s">${hint}</span>` : ""}</div>`;
  const input = (name, value, label) => `<input class="v8g-in" type="text" name="${name}" value="${esc(value)}" aria-label="${esc(label)}" autocomplete="off">`;
  const area = (name, value, label) => `<textarea class="v8g-in tall" name="${name}" aria-label="${esc(label)}">${esc(value)}</textarea>`;
  const select = (name, opts, sel, label) => `<select class="v8g-in" name="${name}" aria-label="${esc(label)}">${opts.map(([v, l]) => `<option value="${esc(v)}"${v === sel ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
  const err = (t) => `<p class="v8g-err" role="alert" hidden>${esc(t)}</p>`;
  const line = (html) => `<p class="v8g-line">${html}</p>`;
  const PEOPLE = [["Ingrid Solberg", "Security engineer"], ["Joel Barrantes", "ISSM"], ["Priya Raghavan", "ISSO"], ["Ray Colston", "System owner"], ["Marcus Ryde", "Component owner"]];

  // ═══════════════ STIG checklists ═══════════════
  const CATS = ["CAT I", "CAT II", "CAT III"];
  const WIN = [30, 90, 180]; // deadlines-stig: from import
  const cat = (n) => `<span class="v8g-cat c${n}">${CATS[n - 1]}</span>`;
  const catN = (n, c) => (n ? `<span class="v8g-n c${c}">${fmt(n)}</span>` : mu("0"));
  const ST_L = { O: "Open", N: "Not a finding", A: "Not applicable", R: "Not reviewed" };
  const stPill = (s) => (s === "A" ? `<span class="pill p-none v8g-na">Not applicable</span>` : pill(...{ O: ["bad", "Open"], N: ["ok", "Not a finding"], R: ["none", "Not reviewed"] }[s]));
  const cciId = (n) => "CCI-" + String(n).padStart(6, "0");
  const idxOf = (n) => String(G.cci[n] || "").split(";").filter(Boolean);
  const ctlCode = (ix) => { const m = String(ix).match(/^([A-Z]{2}-\d+)(?:\s*\((\d+)\))?/); return m ? m[1] + (m[2] ? `(${m[2]})` : "") : ix; };
  const ctlsOf = (r) => [...new Set(r.cci.flatMap(idxOf).map(ctlCode))];
  const ctlRoute = (c) => (c === "SI-2" ? "control-si2" : "controls");
  const ctlInfo = (c) => (SSP && SSP.ctl ? SSP.ctl(c) : null);
  const ctlCell = (r) => { const l = ctlsOf(r); if (!l.length) return mu("No mapping"); return `${ak(esc(l[0]), ctlRoute(l[0]), ctlInfo(l[0]) ? `${l[0]} ${ctlInfo(l[0]).t}` : l[0])}${l.length > 1 ? ` ${mu("+" + (l.length - 1))}` : ""}`; };
  const CS = { satisfied: ["ok", "Satisfied"], partially_satisfied: ["part", "Partially satisfied"], other_than_satisfied: ["bad", "Other than satisfied"], not_assessed: ["info", "Not assessed"], no_evidence: ["none", "No evidence"], no_requirement: ["none", "No requirement"] };
  const csPill = (c) => { const x = ctlInfo(c); return x && CS[x.cs] ? pill(...CS[x.cs]) : mu("Not in WS-X90's baseline"); };

  const ROWS = {};
  const parseRow = (l) => { const [n, r, c, t, x] = l.split("|"); return { n, v: "V-" + n, rule: `SV-${n}${r}_rule`, cat: +c, title: t, cci: x ? x.split(",").map(Number) : [] }; };
  const rowsOfBm = (k) => ROWS[k] || (ROWS[k] = G.bm[k].rows.split("\n").map(parseRow));
  const CK = G.ck.map((c) => ({ ...c, route: "stigs-" + c.slug }));
  const ckBy = (slug) => CK.find((c) => c.slug === slug);
  const SES = { st: {}, moved: {}, ck: {}, imports: [], poam: {}, qdone: false, held: {} };
  const bmOf = (c) => G.bm[c.bm];
  const moved = (c) => !!SES.moved[c.slug];
  const newerOf = (c) => (G.newer[c.bm] && !moved(c) ? G.newer[c.bm] : null);
  const verOf = (c) => (moved(c) ? G.newer[c.bm].ver : bmOf(c).ver);
  const dateOf = (c) => (moved(c) ? G.newer[c.bm].date : bmOf(c).date);
  const impOf = (c) => SES.ck[c.slug] || { date: c.imp, by: c.by, file: c.file, sha: c.sha, tool: c.tool, fmt: c.fmt, real: c.real };
  const queued = (c) => c.queued && !SES.qdone;
  const EXT = { CKL: "ckl", CKLB: "cklb", XCCDF: "xml" };
  function rulesOf(c) {
    const ov = SES.st[c.slug] || {};
    let list = rowsOfBm(c.bm).map((r, i) => ({ ...r, s: ov[r.n] || c.st[i] }));
    if (moved(c)) {
      const nw = G.newer[c.bm], gone = new Set(nw.removed.map((x) => x[0])), rt = new Map(nw.retitled.map((x) => [x[0], x[2]]));
      list = list.filter((r) => !gone.has(r.n)).map((r) => (rt.has(r.n) ? { ...r, title: rt.get(r.n) } : r));
      for (const [n, rv, ct, t, x] of nw.added) list.push({ n, v: "V-" + n, rule: `SV-${n}${rv}_rule`, cat: ct, title: t, cci: x ? String(x).split(",").map(Number) : [], s: ov[n] || "R", added: true });
    }
    return list;
  }
  function countsOf(c) {
    const k = { O: [0, 0, 0], N: 0, A: 0, R: 0, total: 0 };
    for (const r of rulesOf(c)) { k.total++; if (r.s === "O") k.O[r.cat - 1]++; else k[r.s]++; }
    k.open = k.O[0] + k.O[1] + k.O[2];
    k.comp = k.N + k.open ? Math.round((k.N / (k.N + k.open)) * 100) : 0;
    return k;
  }
  const dueOf = (c, ct) => addDays(impOf(c).date, WIN[ct - 1]);
  const poamOf = (c, r) => SES.poam[`${c.slug}:${r.v}`] || G.poam[`${c.slug}:${r.v}`] || null;
  const openAll = () => CK.flatMap((c) => rulesOf(c).filter((r) => r.s === "O").map((r) => ({ c, r })));
  const assetCell = (c) => `${ak(esc(c.asset), "inventory", `${c.ast} · ${c.lru}`)} ${mu(esc(c.lru))}`;
  const srcCell = (c) => { const i = impOf(c); return `${esc(i.tool)} ${mu(i.fmt === "XCCDF" ? "· XCCDF results" : "· ." + EXT[i.fmt])}`; };
  const compCell = (p) => `<span class="v8g-comp"><span class="num">${p}%</span><span class="v8g-cbar"><i style="width:${p}%"></i></span></span>`;
  const verCell = (c) => `${code(verOf(c))}${newerOf(c) ? ` <span class="v8g-new" title="DISA published ${esc(newerOf(c).ver)} on ${esc(mdy(newerOf(c).date))}">↑ ${esc(newerOf(c).ver)}</span>` : ""}`;
  const ckName = (c) => `${c.asset} · ${bmOf(c).s} ${verOf(c)}`;
  const fdOf = (c, r) => G.fd[`${c.slug}:${r.v}`] || null;

  // Comments and activity on each checklist (Example).
  const CKC = {
    "mission-computer-rhel9": [["Priya Raghavan", "ISSO", "Oct 15, 9:12 AM", `29 open after the October run. Both CAT I rules need a decision before Nov 12. ${AK.mention("Joel Barrantes")}`], ["Joel Barrantes", "ISSM", "Oct 16, 4:40 PM", "FIPS mode goes into MC-FW 4.3, planned for Jan 30. The boot loader name ships with the next maintenance image."], ["D. Okafor", "Lead assessor", "Nov 10, 11:05 AM", "For CM-6 I will sample 25 Not a finding answers against the running image, not the checklist."]],
    "mission-computer-asd": [["Ingrid Solberg", "Security engineer", "Nov 4, 3:20 PM", "27 rules stay Not reviewed until the OFP 7.3 code review closes on Dec 4."]],
    "ethernet-switch-ndm": [["Priya Raghavan", "ISSO", "Nov 13, 10:02 AM", "The November file is queued. It is V3R7, which only rewrites fix text, so answers carry over."]],
    "ethernet-switch-l2s": [["Priya Raghavan", "ISSO", "Aug 19, 8:47 AM", "VTP is off (transparent mode), so V-220624 is Not applicable."]],
    "network-gateway-ndm": [["Joel Barrantes", "ISSM", "Oct 1, 9:30 AM", "Evaluate-STIG reads the running configuration every quarter; the next run is Dec 29."]],
    "network-gateway-rtr": [["Ingrid Solberg", "Security engineer", "Oct 2, 1:15 PM", "45 RTR rules are Not applicable: the gateway runs no BGP, multicast or MPLS."]],
    "maintenance-laptop-win11": [["Joel Barrantes", "ISSM", "Oct 20, 2:10 PM", "SCC also ran the Defender Antivirus and Edge benchmarks; the import keeps those results apart."], ["Priya Raghavan", "ISSO", "Nov 14, 8:05 AM", `The monthly scan is past its 30-day cadence. ${AK.mention("Joel Barrantes")}, can it run this week?`]],
  };
  function actOf(c) {
    const i = impOf(c), k = countsOf(c), mine = SES.imports.filter((x) => x.slugs.includes(c.slug));
    const list = mine.map((x) => ({ who: x.by, what: `imported <b>${esc(x.file)}</b>: ${esc(x.read)}`, when: "Just now" }));
    for (const [key, po] of Object.entries(SES.poam)) if (key.startsWith(c.slug + ":")) list.push({ who: ME, what: `created POA&amp;M item <b>${esc(po[1])}</b> for ${esc(key.split(":")[1])}`, when: "Just now" });
    if (moved(c) && !mine.length) list.push({ who: ME, what: `moved the checklist to <b>${esc(verOf(c))}</b>`, when: "Just now" });
    for (const [key, po] of Object.entries(G.poam)) if (key.startsWith(c.slug + ":")) list.push({ who: "Joel Barrantes", what: `linked ${esc(key.split(":")[1])} to POA&amp;M item <b>${esc(po[1])}</b>`, when: c.slug === "mission-computer-rhel9" ? "Nov 2, 2026" : mdy(addDays(c.imp, 6)) });
    list.push({ who: null, what: `set the deadlines from Settings › Deadlines: ${k.O[0] ? `CAT I due ${md(dueOf(c, 1))}, ` : ""}CAT II ${md(dueOf(c, 2))}, CAT III ${md(dueOf(c, 3))}`, when: mdy(c.imp) });
    list.push({ who: c.auto ? null : c.by, what: `imported <b>${esc(c.file)}</b> from ${esc(c.tool)}`, when: mdy(c.imp) });
    list.push({ who: c.by === c.owner || c.auto ? "Joel Barrantes" : c.by, what: `made <b>${esc(c.owner)}</b> the checklist's owner`, when: mdy(c.imp) });
    if (c.prev) list.push({ who: c.auto ? null : c.by, what: `imported the checklist of ${esc(mdy(c.prev))}`, when: mdy(c.prev) });
    return list;
  }

  // ——— Index: head, tabs, the CAT I banner ———
  const importsAll = () => [...SES.imports, ...IMPORTS];
  const BMS = (() => { const m = new Map(); for (const c of CK) { if (!m.has(c.bm)) m.set(c.bm, []); m.get(c.bm).push(c); } return [...m.entries()].map(([k, list]) => ({ k, list })); })();
  const stHead = () => AK.indexHead({ title: "STIG checklists", desc: `DISA STIG results for ${plural(new Set(CK.map((c) => c.ast)).size, "asset")} in SYS-WSX90, from STIG Viewer, Evaluate-STIG and SCC`, actions: `${hbtn("Export .ckl", 'data-v8g-toast="7 checklists exported as .ckl files"')}${hbtn("Import checklist", 'data-modal="v8g-import" data-id=""', true)}` });
  const stTabs = (cur) => AK.tabs([["Checklists", CK.length, cur === "list" ? null : "stigs", cur === "list"], ["Open rules", openAll().length, cur === "open" ? null : "stigs-open", cur === "open"], ["Benchmarks", BMS.length, cur === "bench" ? null : "stigs-benchmarks", cur === "bench"], ["Imports", importsAll().length, cur === "imp" ? null : "stigs-imports", cur === "imp"]], "STIG checklists");
  function catOneBanner() {
    const ones = openAll().filter((x) => x.r.cat === 1);
    if (!ones.length) return AK.banner({ tone: "ok", text: "No CAT I rule is open on any asset." });
    const noP = ones.filter((x) => !poamOf(x.c, x.r)).length, oldest = ones.map((x) => dueOf(x.c, 1)).sort()[0], d = AK.days(oldest);
    const assets = new Set(ones.map((x) => x.c.asset)).size;
    const text = `<b>${plural(ones.length, "open CAT I rule")}</b> on ${plural(assets, "asset")}${noP ? `, ${noP === ones.length ? "none with" : fmt(noP) + " without"} a POA&amp;M item` : ""}. ${d < 0 ? `The oldest was due ${md(oldest)}, ${plural(-d, "day")} ago.` : `The first is due ${md(oldest)}.`}`;
    return AK.banner({ tone: "bad", text, action: "Review CAT I" }).replace('<span class="btn sm">Review CAT I</span>', btn("Review CAT I", 'data-go="stigs-open" data-v8g-set="open-cat=1"'));
  }

  // ——— Checklists ———
  S["stigs"] = () => h.page(
    stHead(), stTabs("list"), catOneBanner(),
    filters("Search checklists", ["Asset", "STIG", "Source"]),
    tbl({
      cols: ["Asset", "STIG", "Source", "Last import", "Open by CAT", "Not reviewed", "Compliance"],
      rows: CK.map((c) => { const k = countsOf(c), i = impOf(c); return { id: c.slug, cells: [ak(tr(c.asset, 168), "inventory", `${c.asset} · ${c.ast} · ${c.lru}`), `<span class="v8g-one">${tr(bmOf(c).s, 140)} ${verCell(c)}</span>`, tr(i.tool, 110), `<span class="v8g-one">${num(md(i.date))} ${mu("· " + esc(i.auto ? "Automation" : i.by))}${queued(c) ? ` <span class="v8g-qd" title="A newer file is queued: disa-stig-checklist-internal-ethernet-switch.ckl, uploaded Nov 13" aria-label="A newer file is queued">${gl("clock")}</span>` : ""}</span>`, `<span class="v8g-one v8g-cats">${catN(k.O[0], 1)}<i>·</i>${catN(k.O[1], 2)}<i>·</i>${catN(k.O[2], 3)}</span>`, num(k.R), compCell(k.comp)] }; }),
      total: CK.length, panel: "v8g-ck", label: "STIG checklists", pager: false, cls: "v8g-tight",
    }),
    line(`Compliance is Not a finding over Not a finding and Open. ${lk("How deadlines are set", "deadlines-stig")} · ${lk("Evidence sources", "sources")}`),
    AK.note("The rules, releases, CCIs and the RHEL 9 and Windows 11 imports' totals are real; each rule's status on WS-X90's assets, the ASD, switch and gateway checklists and the owners are invented."),
  );

  P["v8g-ck"] = (slug) => {
    const c = ckBy(slug) || CK[0], k = countsOf(c), i = impOf(c);
    const head = AK.recordHead({ title: ckName(c), chip: k.O[0] ? AK.chip(`${k.O[0]} open CAT I`, { tone: "bad" }) : AK.chip(`${k.comp}% compliant`, { tone: "ok" }), actions: btn("Open checklist", `data-go="${c.route}"`, true) });
    const facts = AK.facts([["Asset", lk(esc(c.asset), "inventory")], ["Last import", `${md(i.date)} · ${esc(i.by)}`], ["Owner", AK.owner(c.owner)], ["Next import", AK.due(addDays(i.date, c.cadence))]]);
    const res = AK.section("Results", kv([["Open", `${catN(k.O[0], 1)} ${mu("CAT I")} · ${catN(k.O[1], 2)} ${mu("CAT II")} · ${catN(k.O[2], 3)} ${mu("CAT III")}`], ["Not a finding", num(k.N)], ["Not applicable", num(k.A)], ["Not reviewed", num(k.R)], ["Compliance", `${k.comp}%`]]), { count: fmt(k.total) + " rules" });
    const open = rulesOf(c).filter((r) => r.s === "O").sort((a, b) => a.cat - b.cat).slice(0, 5);
    const top = open.length ? AK.section("Open rules", `<div class="v8g-list">${open.map((r) => `<div class="v8g-li" role="button" tabindex="0" data-panel="v8g-rule" data-id="${esc(c.slug + "|" + r.n)}">${cat(r.cat)}<span class="x"><b>${esc(r.v)}</b> ${esc(r.title)}</span></div>`).join("")}</div>`, { count: k.open }) : "";
    return { label: "Checklist preview", body: `<div class="v8g-pan">${head}${facts}${queued(c) ? `<div class="v8g-hint">${gl("clock")}<span>A newer file is queued: <b>disa-stig-checklist-internal-ethernet-switch.ckl</b>, uploaded Nov 13.</span></div>` : ""}${res}${top}</div>` };
  };

  // ——— A checklist's page ———
  function ckBanners(c) {
    let out = "";
    const nw = newerOf(c);
    if (nw) out += AK.banner({ tone: "info", text: `DISA published <b>${esc(bmOf(c).s)} ${esc(nw.ver)}</b> on ${esc(mdy(nw.date))}: ${relSummary(nw)}.`, action: "See what changed" }).replace('<span class="btn sm">See what changed</span>', btn("See what changed", `data-panel="v8g-bench" data-id="${c.bm}"`));
    if (queued(c)) out += AK.banner({ tone: "warn", text: `A newer checklist file is queued: <b>disa-stig-checklist-internal-ethernet-switch.ckl</b>, uploaded Nov 13 by Joel Barrantes.`, action: "Review import" }).replace('<span class="btn sm">Review import</span>', btn("Review import", `data-modal="v8g-import" data-id="${c.slug}|q"`));
    return out;
  }
  const relSummary = (nw) => nw.added.length || nw.removed.length ? `${plural(nw.added.length, "rule")} added (${nw.added.filter((x) => x[2] === 1).length} CAT I), ${fmt(nw.removed.length)} retired, ${fmt(nw.retitled.length)} retitled` : `no rule added or retired; ${plural(nw.fix, "fix text")} revised`;
  function ckPage(c, tab, body) {
    const k = countsOf(c), i = impOf(c), b = bmOf(c), cm = CKC[c.slug] || [], act = actOf(c);
    const head = AK.recordHead({
      crumbs: [["STIG checklists", "stigs"], [`${c.asset} · ${b.s}`]], title: ckName(c),
      chip: k.O[0] ? AK.chip(`${k.O[0]} open CAT I`, { tone: "bad" }) : AK.chip(`${k.comp}% compliant`, { tone: "ok" }),
      actions: `${hbtn(`Download .${EXT[i.fmt]}`, `data-v8g-toast="${esc(i.file)} downloaded"`)}${hbtn("Import checklist", `data-modal="v8g-import" data-id="${c.slug}"`, true)}`,
      facts: [["Asset", `<span class="v8g-one">${lk(esc(c.asset), "inventory")} ${mu(esc(c.lru))}</span>`], ["STIG", `<span class="v8g-one">${esc(b.t)} ${code(verOf(c))}</span>`], ["Source", `<span class="v8g-one">${srcCell(c)}</span>`], ["Last import", `<span class="v8g-one">${num(mdy(i.date))} ${mu("· " + esc(i.by))}</span>`], ["Owner", AK.owner(c.owner)], ["Next import", AK.due(addDays(i.date, c.cadence))]],
      tabs: [["Rules", k.total, tab === "rules" ? null : c.route, tab === "rules"], ["Comments", cm.length, tab === "comments" ? null : c.route + "-comments", tab === "comments"], ["Activity", act.length, tab === "activity" ? null : c.route + "-activity", tab === "activity"]],
    });
    return h.page(head, ckBanners(c), body);
  }
  function ckRail(c) {
    const k = countsOf(c), i = impOf(c), nw = newerOf(c);
    const dueRow = (ct) => [CATS[ct - 1], k.O[ct - 1] ? AK.due(dueOf(c, ct), { prefix: false }) : mu("None open")];
    return AK.railCard("Results", [["Open", `${num(k.open)} ${mu(`${k.O[0]} · ${k.O[1]} · ${k.O[2]}`)}`], ["Not a finding", num(k.N)], ["Not applicable", num(k.A)], ["Not reviewed", num(k.R)], ["Compliance", `${k.comp}%`]])
      + AK.railCard("Import", [["File", tr(i.file, 168)], ["SHA-256", `<span class="v8g-hash" title="${esc(i.sha)}">${esc(i.sha.slice(0, 12))}…</span>`], ["Read", i.fmt === "XCCDF" && !SES.ck[c.slug] ? `286 results ${mu("· SCC 90.6%")}` : `${num(k.total - k.R)} of ${num(k.total)} answered`], ["Supersedes", SES.ck[c.slug] ? `Checklist of ${esc(md(c.imp))}` : c.prev ? `Checklist of ${esc(mdy(c.prev))}` : mu("First checklist")]])
      + AK.railCard("Benchmark", [["Release", `${code(verOf(c))} ${mu(esc(mdy(dateOf(c))))}`], ["DISA's latest", nw ? `<span class="v8g-a" role="link" tabindex="0" data-panel="v8g-bench" data-id="${c.bm}">${esc(nw.ver)} · ${esc(md(nw.date))}</span>` : pill("ok", "This release")], ["Rules", `${num(k.total)} ${mu(bmOf(c).n.join(" · "))}`]])
      + AK.railCard("Deadlines", [dueRow(1), dueRow(2), dueRow(3), ["Set by", lk("Settings › Deadlines", "deadlines-stig")]]);
  }
  const PAGE = 25;
  function rulesBody(c) {
    const all = rulesOf(c), k = countsOf(c);
    const sk = "s:" + c.slug, ckey = "c:" + c.slug, pk = "p:" + c.slug;
    if (Q[sk] == null) Q[sk] = k.open ? "O" : "all";
    const qs = Q[sk], qc = String(Q[ckey] == null ? "all" : Q[ckey]);
    const bySt = all.filter((r) => qs === "all" || r.s === qs);
    const list = bySt.filter((r) => qc === "all" || r.cat === +qc).sort((a, b) => (qs === "O" ? a.cat - b.cat : 0));
    const pages = Math.max(1, Math.ceil(list.length / PAGE)), p = Math.min(Q[pk] || 0, pages - 1); Q[pk] = p;
    const shown = list.slice(p * PAGE, p * PAGE + PAGE);
    const nCat = (ct) => bySt.filter((r) => r.cat === ct).length;
    const pager = `<div class="pager"><span class="num">${list.length ? `${fmt(p * PAGE + 1)}–${fmt(p * PAGE + shown.length)} of ${fmt(list.length)}` : "0 shown"}</span><span class="v8g-pg">${pages > 1 ? `<button type="button" class="ib" data-v8g-page="${c.slug}" data-v8g-dir="-1" aria-label="Previous page"${p ? "" : " disabled"}>‹</button><span class="num">Page ${p + 1} of ${pages}</span><button type="button" class="ib" data-v8g-page="${c.slug}" data-v8g-dir="1" aria-label="Next page"${p < pages - 1 ? "" : " disabled"}>›</button>` : ""}</span></div>`;
    const table = tbl({
      cols: ["Vuln ID", "Rule title", "CAT", "Status", "Control", "Finding details"],
      rows: shown.map((r) => { const fd = fdOf(c, r); return { id: `${c.slug}|${r.n}`, cells: [`<span class="v8g-one"><b class="num">${esc(r.v)}</b>${r.added ? ` <span class="v8g-new">New</span>` : ""}</span>`, tr(r.title, 230), cat(r.cat), stPill(r.s), ctlCell(r), fd ? tr(fd, 150) : mu("None")] }; }),
      panel: "v8g-rule", label: "Rules", pagerHtml: pager, empty: "No rule matches these filters.", cls: "v8g-tight",
    });
    const left = `${chips(sk, [["all", "All", all.length], ["O", "Open", k.open], ["N", "Not a finding", k.N], ["A", "Not applicable", k.A], ["R", "Not reviewed", k.R]], "Status", pk)}
      <div class="v8g-row2">${chips(ckey, [["all", "All CATs", bySt.length], ["1", "CAT I", nCat(1)], ["2", "CAT II", nCat(2)], ["3", "CAT III", nCat(3)]], "Severity", pk)}<span class="in v8g-search">Search rules</span></div>${table}`;
    return AK.withRail(left, ckRail(c));
  }
  const ckNote = (c) => AK.note(c.real ? `The rules, their CCIs and the import's totals are real (DISA ${bmOf(c).s} ${bmOf(c).ver}, ingestion_jobs); which rule holds which status, the finding details and the comments are invented.` : `The rules and their CCIs are DISA's (${bmOf(c).s} ${bmOf(c).ver}); this checklist, its import, statuses, finding details and comments are invented.`);
  for (const c of CK) {
    S[c.route] = () => ckPage(c, "rules", rulesBody(c) + ckNote(c));
    S[c.route + "-comments"] = () => ckPage(c, "comments", AK.section("Comments", AK.comments({ you: ME, items: (CKC[c.slug] || []).map(([who, role, when, text]) => ({ who, role, when, text: `${text} ${EX}` })) }), { count: (CKC[c.slug] || []).length }) + AK.note("The comments are invented."));
    S[c.route + "-activity"] = () => ckPage(c, "activity", AK.section("Activity", AK.activity(actOf(c)), { count: actOf(c).length }) + AK.note(c.real ? "The import, its file and its importer are real; the owner, the deadlines' entry and the POA&M links are invented." : "This checklist's activity is invented."));
  }

  // ——— A rule's panel ———
  const ruleOf = (id) => { const [slug, n] = String(id || "").split("|"); const c = ckBy(slug) || CK[0]; const all = rulesOf(c); return { c, r: all.find((x) => x.n === n) || all[0] }; };
  const pre = (t) => `<pre class="v8g-pre">${esc(t)}</pre>`;
  P["v8g-rule"] = (id) => {
    const { c, r } = ruleOf(id), key = `${c.slug}:${r.v}`, det = G.det[`${c.bm}:${r.n}`], fd = fdOf(c, r), po = poamOf(c, r), cm = G.cm[key] || [];
    const rid = `${c.slug}|${r.n}`;
    const head = AK.recordHead({ title: r.title, chip: stPill(r.s), actions: `${r.s === "O" && !po ? btn("Create POA&amp;M item", `data-modal="v8g-poam" data-id="${esc(rid)}"`, true) : ""}${btn("Change status", `data-modal="ak-reason" data-id="${esc(`Change the status of ${r.v}|${ST_L[r.s]} on the ${c.asset}. The new status, your reason and the date show on the rule and in the checklist's activity.`)}"`)}` });
    const facts = AK.facts([["Vuln ID", code(r.v)], ["Rule ID", `<span class="num v8g-brk">${esc(r.rule)}</span>`], ["STIG ID", det ? `<span class="num">${esc(det[0])}</span>` : mu("Not shown")], ["Severity", cat(r.cat)], ["Asset", lk(esc(c.asset), "inventory")], ["Checklist", lk(esc(`${bmOf(c).s} ${verOf(c)}`), c.route)]]);
    const due = r.s === "O" ? `<div class="v8g-hint">${gl(AK.days(dueOf(c, r.cat)) < 0 ? "diamond" : "clock")}<span>${CATS[r.cat - 1]} closes within ${WIN[r.cat - 1]} days of import: ${AK.due(dueOf(c, r.cat))}</span>${lk("Deadlines", "deadlines-stig")}</div>` : "";
    const poSec = AK.section("POA&M item", po ? `<div class="v8g-li">${gl("check")}<span class="x">${lk(esc(po[1]), "poam")}</span>${po[0].startsWith("new") ? mu("Created just now") : ""}</div>` : `<div class="v8g-li">${gl("ring")}<span class="x">No POA&amp;M item</span>${r.s === "O" ? btn("Create POA&amp;M item", `data-modal="v8g-poam" data-id="${esc(rid)}"`) : ""}</div>`);
    const fdSec = AK.section("Finding details", fd ? `<p class="v8g-p">${esc(fd)} ${EX}</p>` : mu(r.s === "N" ? "None recorded: the check passed." : "None recorded."));
    const cciSec = AK.section("CCIs and controls", r.cci.length ? `<div class="v8g-list">${r.cci.map((n) => { const ix = idxOf(n); return `<div class="v8g-cci"><span class="ak-code">${cciId(n)}</span><span class="x">${G.ccid[n] ? esc(G.ccid[n]) : mu("DISA's definition")}</span><span class="v8g-cc">${ix.length ? ix.map((x) => lk(esc(x), ctlRoute(ctlCode(x)))).join(", ") : mu("No Rev 5 mapping")}</span></div>`; }).join("")}</div>` : mu("This rule names no CCI."), { count: r.cci.length });
    const txt = det ? `${AK.section("Check text", pre(det[2]))}${AK.section("Fix text", pre(det[3]))}${det[1] ? AK.section("Discussion", `<p class="v8g-p">${esc(det[1])}</p>`) : ""}` : "";
    const comments = AK.section("Comments", AK.comments({ you: ME, items: cm.map(([who, role, when, text]) => ({ who, role, when, text: `${esc(text)} ${EX}` })) }), { count: cm.length });
    return { label: "STIG rule preview", body: `<div class="v8g-pan">${head}${facts}${due}${poSec}${fdSec}${cciSec}${txt}${comments}</div>` };
  };

  // ——— Create POA&M item ———
  M["v8g-poam"] = (id) => {
    const { c, r } = ruleOf(id), i = impOf(c), ctls = ctlsOf(r), due = dueOf(c, r.cat);
    return { title: "Create POA&M item", body: `<p class="ak-desc">From ${esc(r.v)} on the ${esc(c.asset)} · ${esc(bmOf(c).s)} ${esc(verOf(c))} checklist, imported ${esc(md(i.date))}</p>
      ${field("Weakness", `<div class="v8g-ro">${code(r.v)} ${esc(r.title)}</div>`)}
      ${field("Item title", input("v8g-pt", `Close ${r.v} on the ${c.asset}`, "Item title"), REQ)}
      <div class="v8g-2">${field("Severity", `<div class="v8g-ro">${cat(r.cat)} ${mu("from the STIG")}</div>`)}${field("Controls", ctls.length ? AK.codes(ctls) : mu("None mapped"))}</div>
      <div class="v8g-2">${field("Owner", select("v8g-po", PEOPLE.map(([n, rl]) => [n, `${n} · ${rl}`]), c.owner, "Owner"), REQ)}${field("Scheduled completion", `<input class="v8g-in" type="date" name="v8g-pd" value="${due}" aria-label="Scheduled completion">`, REQ, `The ${CATS[r.cat - 1]} deadline is ${esc(mdy(due))}, from ${lk("Settings › Deadlines", "deadlines-stig")}.`)}</div>
      ${field("Milestones", area("v8g-pm", `1. Apply the fix text on ${c.lru}\n2. Run the check again and import the checklist`, "Milestones"), OPT)}
      ${err("Give the POA&M item a title.")}`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v8g-submit="poam" data-id="${esc(id)}">Create POA&amp;M item</button>` };
  };

  // ——— Open rules ———
  S["stigs-open"] = () => {
    const all = openAll(), qc = String(Q["open-cat"] == null ? "all" : Q["open-cat"]);
    const n = (f) => all.filter(f).length;
    const list = all.filter((x) => (qc === "all" ? true : qc === "nop" ? !poamOf(x.c, x.r) : x.r.cat === +qc));
    const rows = [];
    for (const ct of [1, 2, 3]) {
      const g = list.filter((x) => x.r.cat === ct).sort((a, b) => dueOf(a.c, ct).localeCompare(dueOf(b.c, ct)) || a.c.asset.localeCompare(b.c.asset));
      if (!g.length) continue;
      rows.push({ raw: `<td colspan="6"><span class="v8g-grp-n">${CATS[ct - 1]}</span>${mu(`${plural(g.length, "open rule")} · close within ${WIN[ct - 1]} days of import`)}</td>` });
      for (const { c, r } of g) { const po = poamOf(c, r); rows.push({ id: `${c.slug}|${r.n}`, cells: [`<span class="v8g-one"><b class="num">${esc(r.v)}</b> ${tr(r.title, 220)}</span>`, ak(esc(c.asset), "inventory", `${c.ast} · ${c.lru}`), tr(`${bmOf(c).s} ${verOf(c)}`, 150), ctlCell(r), AK.due(dueOf(c, ct), { prefix: false }), po ? ak(tr(po[1], 140), "poam", po[1]) : mu("No POA&amp;M item")] }); }
    }
    return h.page(stHead(), stTabs("open"), catOneBanner(),
      chips("open-cat", [["all", "All", all.length], ["1", "CAT I", n((x) => x.r.cat === 1)], ["2", "CAT II", n((x) => x.r.cat === 2)], ["3", "CAT III", n((x) => x.r.cat === 3)], ["nop", "No POA&M item", n((x) => !poamOf(x.c, x.r))]], "Open rules"),
      filters("Search open rules", ["Asset", "STIG", "Control"]),
      tbl({ cols: ["Rule", "Asset", "STIG", "Control", "Deadline", "POA&amp;M item"], rows, total: list.length, panel: "v8g-rule", label: "Open rules", cls: "v8g-tight" }),
      line(`Deadlines: CAT I ${WIN[0]} days, CAT II ${WIN[1]}, CAT III ${WIN[2]} from each import, as ${lk("Settings › Deadlines", "deadlines-stig")} proposes. Controls come from each rule's CCIs in DISA's CCI list.`),
      AK.note("Which rules are open on each asset, and their links to POA&M items, are invented; the rules, their CCIs and controls, the POA&M items and the deadline windows are real."));
  };

  // ——— Benchmarks ———
  S["stigs-benchmarks"] = () => {
    const behind = BMS.filter((b) => b.list.some((c) => newerOf(c)));
    return h.page(stHead(), stTabs("bench"),
      behind.length ? AK.banner({ tone: "info", text: `DISA has published a newer release of <b>${plural(behind.length, "STIG")}</b> in use: ${andList(behind.map((b) => `${esc(G.bm[b.k].s)} ${esc(G.newer[b.k].ver)}`))}.` }) : AK.banner({ tone: "ok", text: "Every checklist is on DISA's latest release." }),
      filters("Search benchmarks", ["Platform", "Release"]),
      tbl({
        cols: ["STIG", "In use", "Published", "Rules · CAT I · II · III", "Used on", "DISA's latest", "What changed"],
        rows: BMS.map(({ k, list }) => { const b = G.bm[k], c = list[0], nw = newerOf(c); return { id: k, cells: [tr(b.t, 240), code(verOf(c)), num(mdy(dateOf(c))), `<span class="v8g-one">${num(moved(c) ? G.newer[k].total : rowsOfBm(k).length)} ${mu((moved(c) ? G.newer[k].n : b.n).join(" · "))}</span>`, tr([...new Set(list.map((x) => x.asset))].join(", "), 170), nw ? `<span class="v8g-new">${esc(nw.ver)} · ${esc(md(nw.date))}</span>` : pill("ok", "Current"), nw ? tr(relSummary(nw), 200) : mu("Nothing newer")] }; }),
        total: BMS.length, panel: "v8g-bench", label: "Benchmarks", pager: false, cls: "v8g-tight",
      }),
      line(`DISA releases STIG updates quarterly. Release and benchmark dates are read from each STIG's manual XCCDF on dl.dod.cyber.mil, Nov 18.`),
      AK.note("The releases, rule counts and what changed are DISA's; the gateway's choice of the Cisco IOS XE Router STIGs is invented."));
  };
  P["v8g-bench"] = (k) => {
    const b = G.bm[k] || G.bm.rhel9, list = (BMS.find((x) => x.k === k) || BMS[0]).list, c = list[0], nw = newerOf(c), all = G.newer[k];
    const head = AK.recordHead({ title: `${b.t} STIG`, chip: nw ? `<span class="v8g-new">${esc(nw.ver)} available</span>` : pill("ok", "Current"), actions: nw ? btn(`Move to ${esc(nw.ver)}`, `data-modal="v8g-move" data-id="${k}"`, true) : "" });
    const facts = AK.facts([["In use", `${code(verOf(c))} ${mu(esc(mdy(dateOf(c))))}`], ["DISA's latest", all ? `${code(all.ver)} ${mu(esc(mdy(all.date)))}` : `${code(b.ver)} ${mu(esc(mdy(b.date)))}`], ["Rules", `${num(moved(c) ? all.total : rowsOfBm(k).length)} ${mu((moved(c) ? all.n : b.n).join(" · "))}`], ["Used on", andList([...new Set(list.map((x) => lk(esc(x.asset), x.route)))])]]);
    if (!all) return { label: "Benchmark preview", body: `<div class="v8g-pan">${head}${facts}${AK.section("Release", `<p class="v8g-p">${esc(b.ver)} is DISA's latest release of this STIG. The next quarterly release is expected in January.</p>`)}</div>` };
    const st = (n) => { const r = rulesOf(c).find((x) => x.n === n); return r ? stPill(r.s) : mu("Not in the checklist"); };
    const strip = `<div class="v8g-strip">${[["Added", all.added.length], ["Retired", all.removed.length], ["Retitled", all.retitled.length], ["Fix text revised", all.fix], ["Check text revised", all.check]].map(([l, n]) => `<span><small>${esc(l)}</small><b class="num">${fmt(n)}</b></span>`).join("")}</div>`;
    const sec = [];
    if (all.added.length) sec.push(AK.section(`Added in ${all.ver}`, `<div class="v8g-list">${all.added.map(([n, , ct, t]) => `<div class="v8g-li">${cat(ct)}<span class="x"><b>V-${esc(n)}</b> ${esc(t)}</span>${moved(c) ? st(n) : mu("Not reviewed after the move")}</div>`).join("")}</div>`, { count: all.added.length }));
    if (all.removed.length) sec.push(AK.section(`Retired in ${all.ver}`, `<div class="v8g-list">${all.removed.map(([n, ct, t]) => `<div class="v8g-li">${cat(ct)}<span class="x"><b>V-${esc(n)}</b> ${esc(t)}</span>${moved(c) ? mu("Answer kept in history") : st(n)}</div>`).join("")}</div>`, { count: all.removed.length }));
    if (all.retitled.length) sec.push(AK.section("Retitled", `<div class="v8g-list">${all.retitled.slice(0, 6).map(([n, a, z]) => `<div class="v8g-rt"><b class="num">V-${esc(n)}</b><span class="v8g-old">${esc(a)}</span><span>${esc(z)}</span></div>`).join("")}</div>${all.retitled.length > 6 ? mu(`and ${all.retitled.length - 6} more; most change “DOD” to “DoW”.`) : ""}`, { count: all.retitled.length }));
    if (all.fixed && all.fixed.length) sec.push(AK.section("Fix text revised", `<div class="v8g-list">${all.fixed.map(([n, ct, t]) => `<div class="v8g-li">${cat(ct)}<span class="x"><b>V-${esc(n)}</b> ${esc(t)}</span>${st(n)}</div>`).join("")}</div>`, { count: all.fixed.length }));
    sec.push(line(`${plural(all.revs, "rule")} carry a new revision number. Answers carry over to every rule that stays; a new rule starts Not reviewed.`));
    return { label: "Benchmark preview", body: `<div class="v8g-pan">${head}${facts}${AK.section(moved(c) ? `What ${all.ver} changed` : `What changes in ${all.ver}`, strip)}${sec.join("")}</div>` };
  };
  M["v8g-move"] = (k) => {
    const list = (BMS.find((x) => x.k === k) || BMS[0]).list, all = G.newer[k];
    return { title: `Move to ${G.bm[k].s} ${all.ver}`, body: `<p class="ak-desc">${andList(list.map((c) => esc(ckName(c))))} ${list.length === 1 ? "moves" : "move"} to DISA's release of ${esc(mdy(all.date))}.</p>
      <div class="v8g-strip">${[["Join as Not reviewed", all.added.length], ["Retire, answer kept", all.removed.length], ["Retitled", all.retitled.length], ["Fix text revised", all.fix]].map(([l, n]) => `<span><small>${esc(l)}</small><b class="num">${fmt(n)}</b></span>`).join("")}</div>
      ${all.added.length ? `<div class="v8g-list">${all.added.map(([n, , ct, t]) => `<div class="v8g-li">${cat(ct)}<span class="x"><b>V-${esc(n)}</b> ${esc(t)}</span></div>`).join("")}</div>` : ""}
      ${line("Every other answer carries over. The next import of the asset's checklist is read against the new release.")}`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v8g-submit="move" data-id="${esc(k)}">Move to ${esc(all.ver)}</button>` };
  };

  // ——— Imports ———
  const IMPORTS = [
    { id: "q-sw", file: "disa-stig-checklist-internal-ethernet-switch.ckl", slugs: ["ethernet-switch-ndm", "ethernet-switch-l2s"], tool: "STIG Viewer 2.18", fmt: "CKL", date: "2026-11-13", by: "Joel Barrantes", sha: "dd802a12668665973b5a6661392c273f40d05bcc23aed881d42fa1fc27b92369", read: "Not read yet", sup: "Checklist of Aug 18", state: "queued", real: 1 },
    { id: "asd", file: CK[1].file, slugs: ["mission-computer-asd"], tool: "STIG Viewer 3.6", fmt: "CKLB", date: "2026-11-04", by: ME, sha: CK[1].sha, read: "286 rules: 223 not a finding, 11 open, 25 not applicable, 27 not reviewed", sup: "First checklist", state: "done" },
    { id: "win", file: CK[6].file, slugs: ["maintenance-laptop-win11"], tool: "SCC 5.10.1", fmt: "XCCDF", date: "2026-10-14", by: "Joel Barrantes", sha: CK[6].sha, read: "286 results: 259 pass, 21 fail, 6 not applicable · score 90.6%", sup: "Scan of Sep 14", state: "done", real: 1 },
    { id: "rhel", file: CK[0].file, slugs: ["mission-computer-rhel9"], tool: "STIG Viewer 2.18", fmt: "CKL", date: "2026-10-13", by: "Joel Barrantes", sha: CK[0].sha, read: "412 rules: 371 not a finding, 29 open, 12 not applicable", sup: "Checklist of Jul 13", state: "done", real: 1 },
    { id: "lt-fail", file: "LRU-019_win11_scc-arf.xml", slugs: ["maintenance-laptop-win11"], tool: "SCC 5.10.1", fmt: "XCCDF", date: "2026-10-02", by: ME, sha: "41f0c2b9e7d35a18c6f4b20e9d7a3c5f18b6e2d40a9c7f3e5b1d8a26c4f0e9b3", read: "Rejected: an ARF report, not XCCDF results", sup: "Nothing", state: "failed" },
    { id: "gw", file: "LRU-007_Cisco_IOS-XE_Router_NDM_V3R7.cklb + RTR_V3R5.cklb", slugs: ["network-gateway-ndm", "network-gateway-rtr"], tool: "Evaluate-STIG 1.2508.1", fmt: "CKLB", date: "2026-09-30", by: "evaluate-stig-runner", sha: CK[4].sha, read: "139 rules: 78 not a finding, 11 open, 46 not applicable, 7 not reviewed", sup: "Run of Jun 30", state: "done" },
    { id: "win-sep", file: "scap-compliance-scan-maintenance-laptop-windows-11-2026-09-14.xccdf.xml", slugs: ["maintenance-laptop-win11"], tool: "SCC 5.10.1", fmt: "XCCDF", date: "2026-09-14", by: "Joel Barrantes", sha: "9c3e7a15d2b84f60e1c9a7d3b5f28e4c0a6d9b1f7e3c5a28d4b0f6e9c1a7d3b5", read: "286 results: 251 pass, 29 fail, 6 not applicable", sup: "Scan of Aug 14", state: "superseded" },
    { id: "sw", file: "LRU-009_Cisco_IOS_Switch_NDM_V3R6.ckl + L2S_V3R1.ckl", slugs: ["ethernet-switch-ndm", "ethernet-switch-l2s"], tool: "STIG Viewer 2.18", fmt: "CKL", date: "2026-08-18", by: "Priya Raghavan", sha: CK[2].sha, read: "65 rules: 54 not a finding, 6 open, 4 not applicable, 1 not reviewed", sup: "Checklist of May 12", state: "done" },
    { id: "rhel-jul", file: "LRU-001_RHEL_9_STIG_V2R8.ckl", slugs: ["mission-computer-rhel9"], tool: "STIG Viewer 2.18", fmt: "CKL", date: "2026-07-13", by: "Joel Barrantes", sha: "e2a7c4f19b3d58e0c6a1f9d7b3e52c8a4f0d6b2e9c7a15d3f8b0e4c6a2d9f1b7", read: "398 rules answered, 41 open", sup: "Checklist of Apr 14", state: "superseded" },
  ];
  const IST = { done: ["ok", "Applied"], queued: ["warn", "Queued"], superseded: ["none", "Superseded"], failed: ["bad", "Rejected"] };
  const impState = (x) => { const s = x.id === "q-sw" && SES.qdone ? "done" : x.id === "sw" && SES.qdone ? "superseded" : x.state; return pill(...IST[s]); };
  S["stigs-imports"] = () => h.page(stHead(), stTabs("imp"),
    queued(CK[2]) ? AK.banner({ tone: "warn", text: `<b>disa-stig-checklist-internal-ethernet-switch.ckl</b> is queued since Nov 13. It replaces the switch's checklists of Aug 18 once applied.`, action: "Review import" }).replace('<span class="btn sm">Review import</span>', btn("Review import", 'data-modal="v8g-import" data-id="ethernet-switch-ndm|q"')) : "",
    filters("Search imports", ["Asset", "Tool", "State"]),
    tbl({
      cols: ["File", "Tool", "Imported", "SHA-256", "Rules read", "Supersedes", "State"],
      rows: importsAll().map((x) => ({ id: x.id, cells: [tr(x.file, 186), tr(x.tool, 124), `<span class="v8g-one">${num(x.date === TODAY_ISO ? "Today" : md(x.date))} ${mu("· " + esc(x.by === "evaluate-stig-runner" ? "Automation" : x.by))}</span>`, `<span class="v8g-hash" title="${esc(x.sha)}">${esc(x.sha.slice(0, 10))}…</span>`, tr(x.read, 170), tr(x.sup, 120), impState(x)] })),
      total: importsAll().length, panel: "v8g-imp", label: "Imports", cls: "v8g-tight",
    }),
    line(`Each file is kept as imported, with its SHA-256. A newer import of the same asset and STIG supersedes the last; nothing is deleted.`),
    AK.note("The Oct 13, Oct 14 and Nov 13 imports are WS-X90's, with their files and hashes; the others are invented."));
  P["v8g-imp"] = (id) => {
    const x = importsAll().find((i) => i.id === id) || IMPORTS[0], cks = x.slugs.map(ckBy);
    const isQ = x.id === "q-sw" && !SES.qdone;
    const head = AK.recordHead({ title: x.file, chip: impState(x), actions: isQ ? btn("Review and apply", 'data-modal="v8g-import" data-id="ethernet-switch-ndm|q"', true) : btn("Download", `data-v8g-toast="${esc(x.file)} downloaded"`) });
    const facts = AK.facts([["Asset", lk(esc(cks[0].asset), "inventory")], ["Tool", `${esc(x.tool)} ${mu(x.fmt === "XCCDF" ? "· XCCDF results" : "· ." + EXT[x.fmt])}`], ["Imported", `${esc(x.date === TODAY_ISO ? "Today" : mdy(x.date))} · ${esc(x.by)}`]]);
    const body = AK.section("File", kv([["SHA-256", `<span class="v8g-hash v8g-brk">${esc(x.sha)}</span>`], ["Read", esc(x.read)], ["Supersedes", esc(x.sup)], ["Checklists", cks.map((c) => lk(esc(`${bmOf(c).s} ${verOf(c)}`), c.route)).join(", ")]]));
    return { label: "Import preview", body: `<div class="v8g-pan">${head}${facts}${body}${x.real ? "" : `<p class="v8g-p">${EX}</p>`}</div>` };
  };

  // ——— Import a checklist: choose, preview, apply ———
  const IMP = { slug: CK[0].slug, fmt: "CKL", step: 1 };
  const FMTS = [["CKL", "STIG Viewer 2 checklist", ".ckl"], ["CKLB", "STIG Viewer 3 or Evaluate-STIG checklist", ".cklb"], ["XCCDF", "SCAP results from SCC or OpenSCAP", "XCCDF .xml"]];
  const fileFor = (c, f) => {
    if (queued(c)) return "disa-stig-checklist-internal-ethernet-switch.ckl";
    const nw = newerOf(c), ver = nw && f !== "XCCDF" ? nw.ver : verOf(c);
    if (c.slug === "mission-computer-rhel9" && f === "CKL") return `disa-stig-checklist-mission-computing-rhel-9-${ver.toLowerCase()}.ckl`;
    if (c.slug === "maintenance-laptop-win11" && f === "XCCDF") return "scap-compliance-scan-maintenance-laptop-windows-11-2026-11-17.xccdf.xml";
    return `${c.lru}_${bmOf(c).s.replace(/ /g, "_")}_${ver}${f === "XCCDF" ? "_scc-xccdf.results.xml" : "." + EXT[f]}`;
  };
  function previewOf(slug, f) {
    const c0 = ckBy(slug), group = queued(c0) ? CK.filter((x) => x.queued) : [c0];
    return group.map((c) => {
      const rules = rulesOf(c), open = rules.filter((r) => r.s === "O"), naf = rules.filter((r) => r.s === "N"), nr = rules.filter((r) => r.s === "R");
      const chg = [];
      open.filter((r) => r.cat > 1 && !poamOf(c, r)).slice(0, c.bm === "rhel9" ? 4 : c.bm === "win11" ? 3 : 1).forEach((r) => chg.push([r, "O", "N"]));
      if ((c.bm === "rhel9" || c.bm === "win11") && naf.length) chg.push([naf[Math.floor(naf.length / 3)], "N", "O"]);
      nr.slice(0, c.bm === "rhel9" ? 6 : c.bm === "asd" ? 4 : 1).forEach((r, i) => chg.push([r, "R", c.bm === "rhel9" && i === 1 ? "O" : "N"]));
      const rel = f !== "XCCDF" ? newerOf(c) : null;
      const held = f === "XCCDF" ? naf.filter((r, i) => i % 97 === 11).slice(0, 2) : [];
      return { c, chg, rel, held, other: f === "XCCDF" && c.bm === "win11" ? 47 : 0 };
    });
  }
  const impSteps = (n) => AK.steps(["Choose a file", "Preview changes", "Apply"], n);
  function impBody() {
    const c = ckBy(IMP.slug);
    if (IMP.step === 1) return `${impSteps(0)}
      ${field("Format", `<div class="v8g-fmts" role="radiogroup" aria-label="Format">${FMTS.map(([v, l, x]) => `<label class="v8g-opt"><input type="radio" name="v8g-fmt" value="${v}"${IMP.fmt === v ? " checked" : ""}><span><b>${v === "XCCDF" ? "XCCDF results" : v} ${mu(esc(x))}</b><small>${esc(l)}</small></span></label>`).join("")}</div>`, REQ)}
      ${field("Checklist", select("v8g-ck", CK.map((x) => [x.slug, ckName(x)]), IMP.slug, "Checklist"), REQ, "The asset and STIG the file answers. A new release in the file moves the checklist to it.")}
      ${field("File", `<div class="v8g-drop">${AK.i("upload")}<span><b class="v8g-brk">${esc(fileFor(c, IMP.fmt))}</b>${mu(queued(c) ? "Uploaded Nov 13 by Joel Barrantes · queued" : "Chosen just now · read in your browser before anything is saved")}</span><span class="v8g-a">Choose another</span></div>`, REQ)}`;
    const pv = previewOf(IMP.slug, IMP.fmt), file = fileFor(c, IMP.fmt);
    const tot = (f) => pv.reduce((a, g) => a + f(g), 0);
    const chgs = tot((g) => g.chg.length), adds = tot((g) => (g.rel ? g.rel.added.length : 0)), rets = tot((g) => (g.rel ? g.rel.removed.length : 0)), held = tot((g) => g.held.length);
    const row = (r, b, a) => `<div class="v8g-chg"><b class="num">${esc(r.v)}</b><span class="x" title="${esc(r.title)}">${esc(r.title)}</span>${AK.change(ST_L[b], ST_L[a])}</div>`;
    const groups = pv.map((g) => {
      const i = impOf(g.c), parts = [];
      if (g.chg.length) parts.push(`<div class="v8g-sub">Since the last import, ${esc(md(i.date))}<span class="num">${g.chg.length}</span></div>${g.chg.map(([r, b, a]) => row(r, b, a)).join("")}`);
      if (g.rel && g.rel.added.length) parts.push(`<div class="v8g-sub">New rules in ${esc(g.rel.ver)}<span class="num">${g.rel.added.length}</span></div>${g.rel.added.map(([n, , ct, t]) => `<div class="v8g-chg"><b class="num">V-${esc(n)}</b><span class="x" title="${esc(t)}">${esc(t)}</span>${cat(ct)} ${stPill(n === "288833" ? "O" : "R")}</div>`).join("")}`);
      if (g.rel && g.rel.removed.length) parts.push(`<div class="v8g-sub">Retired by DISA<span class="num">${g.rel.removed.length}</span></div>${g.rel.removed.map(([n, , t]) => `<div class="v8g-chg"><b class="num">V-${esc(n)}</b><span class="x" title="${esc(t)}">${esc(t)}</span>${mu("Answer kept in history")}</div>`).join("")}`);
      if (g.rel && !g.rel.added.length && !g.rel.removed.length) parts.push(`<div class="v8g-sub">Release ${esc(verOf(g.c))} → ${esc(g.rel.ver)}</div>${line(`No rule added or retired. ${plural(g.rel.fix, "rule")} carry new fix text; their answers carry over.`)}`);
      if (g.held.length) parts.push(`<div class="v8g-sub">Held back: no CCI in the result<span class="num">${g.held.length}</span></div>${g.held.map((r) => `<div class="v8g-chg"><b class="num">${esc(r.v)}</b><span class="x" title="${esc(r.title)}">${esc(r.title)}</span>${mu("Waits for an analyst to map it")}</div>`).join("")}`);
      if (g.other) parts.push(line(`${fmt(g.other)} results belong to the Microsoft Defender Antivirus and Microsoft Edge benchmarks SCC ran in the same scan; they stay with those benchmarks.`));
      return `<div class="v8g-pgrp"><div class="v8g-pgh">${esc(ckName(g.c))}${g.rel ? ` → ${code(g.rel.ver)}` : ""}</div>${parts.join("") || line("No change since the last import.")}</div>`;
    }).join("");
    return `${impSteps(1)}<div class="v8g-drop sm">${AK.i("upload")}<span><b class="v8g-brk">${esc(file)}</b>${mu(`${IMP.fmt === "XCCDF" ? "XCCDF results" : "." + EXT[IMP.fmt]} · read just now`)}</span></div>
      <div class="v8g-strip">${[["Status changes", chgs], [adds || rets ? "New rules" : "Release", adds || rets ? adds : pv.some((g) => g.rel) ? "New" : "Same"], ["Retired", rets], ["Held back", held]].map(([l, n]) => `<span><small>${esc(l)}</small><b class="num">${typeof n === "number" ? fmt(n) : esc(n)}</b></span>`).join("")}</div>
      ${groups}${line(`${EX} The changes in this preview are invented; the new and retired rules are DISA's.`)}`;
  }
  const impFoot = () => IMP.step === 1
    ? `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v8g-imp="next">Preview changes</button>`
    : `<button type="button" class="btn" data-v8g-imp="back">Back</button><button type="button" class="btn ink" data-v8g-imp="apply">Apply import</button>`;
  M["v8g-import"] = (id) => {
    const [slug, mode] = String(id || "").split("|");
    IMP.slug = ckBy(slug) ? slug : CK[0].slug; IMP.fmt = ckBy(IMP.slug).fmt; IMP.step = mode === "q" ? 2 : 1;
    return { title: "Import a checklist", body: `<div class="v8g-imp">${impBody()}</div>`, footer: `<div class="v8g-impf">${impFoot()}</div>` };
  };
  const impRedraw = () => { const b = document.querySelector("#modal .v8g-imp"), f = document.querySelector("#modal .v8g-impf"); if (b) b.innerHTML = impBody(); if (f) f.innerHTML = impFoot(); const fb = document.querySelector("#modal .dlg-b"); if (fb) fb.scrollTop = 0; };
  function impApply() {
    const pv = previewOf(IMP.slug, IMP.fmt), c0 = ckBy(IMP.slug), file = fileFor(c0, IMP.fmt), wasQ = queued(c0);
    let closed = 0, adds = 0;
    for (const g of pv) {
      const ov = SES.st[g.c.slug] || (SES.st[g.c.slug] = {});
      for (const [r, , a] of g.chg) { ov[r.n] = a; if (a === "N") closed++; }
      if (g.rel) { SES.moved[g.c.slug] = true; for (const [n] of g.rel.added) { ov[n] = n === "288833" ? "O" : "R"; adds++; } }
      SES.ck[g.c.slug] = { date: TODAY_ISO, by: ME, file, sha: wasQ ? "dd802a12668665973b5a6661392c273f40d05bcc23aed881d42fa1fc27b92369" : "7b1e9c04d3a8f25e6c0b9d7a1f3e58c2a4d6b0e9f1c7a35d8b2e4f6c0a9d1e7b3", tool: wasQ ? "STIG Viewer 2.18" : IMP.fmt === "XCCDF" ? "SCC 5.10.1" : IMP.fmt === "CKLB" ? "STIG Viewer 3.6" : "STIG Viewer 2.18", fmt: IMP.fmt };
    }
    if (wasQ) SES.qdone = true;
    const k = countsOf(c0);
    SES.imports.unshift({ id: "s" + SES.imports.length, file, slugs: pv.map((g) => g.c.slug), tool: SES.ck[c0.slug].tool, fmt: IMP.fmt, date: TODAY_ISO, by: ME, sha: SES.ck[c0.slug].sha, read: `${fmt(k.total)} rules: ${fmt(k.N)} not a finding, ${fmt(k.open)} open, ${fmt(k.A)} not applicable, ${fmt(k.R)} not reviewed`, sup: `Checklist of ${md(c0.imp)}`, state: "done" });
    closeModal();
    toast(`Checklist imported: ${plural(closed, "rule")} closed${adds ? `, ${plural(adds, "new rule")} from ${verOf(c0)}` : ""}`, "Open checklist", c0.route);
    redraw();
  }

  // ——— SI-2's record: the STIG rules that map to it through their CCIs ———
  PA.decorate("control-si2", (html) => {
    const marker = '<h4 class="subhead">Assessment objectives</h4>';
    if (!html.includes(marker) || html.includes("v8g-si2")) return html;
    const hits = [];
    for (const c of CK) for (const r of rulesOf(c)) { const ix = r.cci.flatMap((n) => idxOf(n).filter((x) => /^SI-2\b/.test(x)).map((x) => [n, x])); if (ix.length) hits.push({ c, r, ix }); }
    if (!hits.length) return html;
    const open = hits.filter((x) => x.r.s === "O").length;
    const sec = `<div class="v8g-si2"><h4 class="subhead">STIG rules mapped to SI-2 <span class="ct num">${hits.length}</span></h4>
      ${tbl({ cols: ["Rule", "Asset", "STIG", "CCI", "Status"], rows: hits.map(({ c, r, ix }) => ({ id: `${c.slug}|${r.n}`, cells: [`<span class="v8g-one"><b class="num">${esc(r.v)}</b> ${tr(r.title, 300)} ${cat(r.cat)}</span>`, esc(c.asset), `${esc(bmOf(c).s)} ${mu(esc(verOf(c)))}`, ix.map(([n, x]) => `${code(cciId(n))} ${mu("→ " + esc(x))}`).join(" "), stPill(r.s)] })), panel: "v8g-rule", label: "STIG rules mapped to SI-2", pager: false })}
      ${line(`${plural(open, "open rule")} of ${hits.length}, mapped through DISA's CCI list. ${lk("Open STIG checklists", "stigs")}`)}</div>`;
    return html.replace(marker, sec + marker);
  });

  // ——— The asset's panel (inventory) names its STIG checklists where it said no scan was imported ———
  PA.decoratePanel("sys-asset", (html, id) => {
    const mine = CK.filter((c) => c.ast === id), head = 'Seen by scans<span class="num">0</span>', body = "No scan has been imported for SYS-WSX90.";
    if (!mine.length || !html.includes(head) || !html.includes(body)) return html;
    const list = `<div class="v8g-list">${mine.map((c) => { const k = countsOf(c), i = impOf(c); return `<div class="v8g-li" role="link" tabindex="0" data-go="${c.route}"><span class="x"><b>${esc(bmOf(c).s)} ${esc(verOf(c))}</b>${mu(`${plural(k.open, "open rule")}${k.O[0] ? `, ${k.O[0]} CAT I` : ""} · imported ${esc(md(i.date))}`)}</span>${compCell(k.comp)}</div>`; }).join("")}</div>`;
    return html.replace(head, `STIG checklists<span class="num">${mine.length}</span>`).replace(body, list);
  });

  // ═══════════════ Security engineering ═══════════════
  const P1 = G.p160;
  const GRP = Object.fromEntries(P1.groups.map(([k, t, list]) => [k, { t, list }]));
  const procOf = (pc) => P1.proc[pc];
  const groupOf = (pc) => P1.groups.find((g) => g[2].includes(pc));
  const outText = (oc) => { const [pc, n] = oc.split("."); const p = procOf(pc); return p ? p[2][+n - 1] : oc; };
  const OS = { met: ["ok", "Met"], part: ["part", "Partly met"], not: ["bad", "Not met"], na: ["none", "Not assessed"] };
  const osPill = (s) => pill(...OS[s]);
  const REV = [
    { id: "srr", t: "SRR", long: "System requirements review", st: "decided", when: "2025-06-12", ex: 1, out: [["SN.7", "met", "Mission-essential designation query output and generated critical asset list, baseline 5.4.0"], ["SN.9", "met", "Control baseline selection record, PROFILE-WSX90-TAILORED"], ["SR.1", "met", "External interface inventory, LRU-007 running configuration and 20-LRU interface state export"], ["SR.2", "met", "Baseline tailoring event register, PROFILE-WSX90-TAILORED"], ["SR.6", "not", null]] },
    { id: "pdr", t: "PDR", long: "Preliminary design review", st: "in_review", due: "2026-10-10", out: [["AR.4", "met", "Approved WS-X90 external network baseline showing the single managed access control point"], ["AR.5", "met", "Functional properties description, LRU-002 boot verification and LRU-003 key services, rev D"], ["AR.7", "part", "Maintenance VLAN and boundary policy export, LRU-009 and LRU-007"], ["SR.6", "na", null]] },
    { id: "msb", t: "Milestone B", long: "Engineering and manufacturing development decision", st: "unscheduled", ex: 1, out: [["RM.1", "na", null], ["RM.3", "na", null], ["PL.1", "na", null], ["AQ.3", "na", null]] },
    { id: "cdr", t: "CDR", long: "Critical design review", st: "not_started", due: "2026-10-01", out: [["DE.2", "na", null], ["DE.3", "na", null], ["DE.4", "na", null], ["DE.6", "na", null]] },
    { id: "trr", t: "TRR", long: "Test readiness review", st: "planned", due: "2027-03-22", ex: 1, out: [["IN.5", "na", null], ["VE.1", "na", null], ["VE.5", "na", null]] },
    { id: "msc", t: "Milestone C", long: "Production and deployment decision", st: "planned", due: "2027-08-16", ex: 1, out: [["VA.4", "na", null], ["VA.7", "na", null], ["TR.3", "na", null], ["TR.5", "na", null]] },
  ];
  const revBy = (id) => REV.find((r) => r.id === id) || REV[1];
  const outsOf = (rv) => [...rv.out, ...(SES.held[rv.id] || []).map((oc) => [oc, "na", null, true])];
  const RS = { decided: ["ok", "Decided"], in_review: ["info", "In review"], not_started: ["none", "Not started"], planned: ["none", "Planned"], unscheduled: ["none", "Not scheduled"] };
  const rsPill = (rv) => pill(...RS[rv.st]);
  const revWhen = (rv) => (rv.st === "decided" ? `<span class="ak-due">${AK.i("check")}Decided ${esc(mdy(rv.when))}</span>` : rv.due ? AK.due(rv.due) : `<span class="ak-due none">${AK.i("calendar")}No date</span>`);
  const revCount = (rv) => { const o = outsOf(rv), c = { met: 0, part: 0, not: 0, na: 0 }; o.forEach((x) => c[x[1]]++); return { ...c, total: o.length }; };
  const allOuts = () => REV.flatMap((rv) => outsOf(rv).map((o) => ({ rv, o })));
  const sseHead = () => AK.indexHead({ title: "Security engineering", desc: "Security outcomes at WS-X90's technical reviews, and its cyber survivability attributes", actions: `${hbtn("Vol. 2: cyber resiliency", 'data-go="resiliency"')}${hbtn("Add security outcomes", `data-modal="v8g-outcomes" data-id="${esc(Q.rev && Q.rev !== "all" ? Q.rev : "cdr")}"`, true)}` });
  const sseTabs = (cur) => AK.tabs([["Technical reviews", REV.length, cur === "rev" ? null : "sse", cur === "rev"], ["Processes", Object.keys(P1.proc).length, cur === "proc" ? null : "sse-processes", cur === "proc"], ["Cyber survivability", CSA.length, cur === "csa" ? null : "sse-csa", cur === "csa"]], "Security engineering");

  S["sse"] = () => {
    const qr = Q.rev || "all", qs = Q["out-st"] || "all";
    const cdr = revBy("cdr"), cc = revCount(cdr), d = AK.days(cdr.due);
    const strip = `<div class="v8g-revs" role="group" aria-label="Technical reviews, in order">${REV.map((rv) => { const k = revCount(rv), on = qr === rv.id; return `<button type="button" class="v8g-rev${on ? " on" : ""}" aria-pressed="${on}" data-v8g-q="rev" data-v8g-v="${on ? "all" : rv.id}" title="${esc(rv.long)}"><span class="k">${esc(rv.t)}</span><span class="s">${rsPill(rv)}</span><span class="d">${revWhen(rv)}</span><span class="v8g-cbar"><i style="width:${k.total ? Math.round((k.met / k.total) * 100) : 0}%"></i></span><span class="m">${fmt(k.met)} of ${fmt(k.total)} met</span></button>`; }).join("")}</div>`;
    const rows = [];
    const pool = allOuts().filter((x) => (qr === "all" || x.rv.id === qr) && (qs === "all" || x.o[1] === qs));
    for (const rv of REV) {
      const g = pool.filter((x) => x.rv === rv); if (!g.length && qr !== rv.id) continue;
      const k = revCount(rv);
      rows.push({ raw: `<td colspan="4"><span class="v8g-grph"><span class="v8g-grp-n">${esc(rv.t)}</span>${mu(esc(rv.long))}<span class="v8g-dot"></span>${revWhen(rv)}<span class="v8g-dot"></span>${mu(`${fmt(k.met)} of ${fmt(k.total)} met`)}${rv.ex ? EX : ""}<span class="v8g-push">${btn("Open review", `data-panel="v8g-review" data-id="${rv.id}"`)}${btn("Add security outcomes", `data-modal="v8g-outcomes" data-id="${rv.id}"`)}</span></span></td>` });
      for (const { o } of g) { const [oc, s, ev, added] = o, pc = oc.split(".")[0]; rows.push({ id: `${rv.id}|${oc}`, cells: [`<span class="v8g-one">${code(oc)} ${tr(outText(oc), 400)}${added ? ` <span class="v8g-new">Added</span>` : ""}</span>`, tr(procOf(pc)[0], 180), osPill(s), ev ? tr(ev, 230) : mu("No evidence")] }); }
    }
    const all = allOuts(), n = (s) => all.filter((x) => x.o[1] === s).length;
    return h.page(sseHead(), sseTabs("rev"),
      AK.banner({ tone: "bad", text: `<b>CDR</b> was due ${esc(md(cdr.due))}, ${plural(-d, "day")} ago, and holds ${plural(cc.na, "security outcome")} no one has assessed. PDR waits on its decision since Oct 10.`, action: "Open CDR" }).replace('<span class="btn sm">Open CDR</span>', btn("Open CDR", 'data-panel="v8g-review" data-id="cdr"')),
      strip,
      `<div class="v8g-row2">${chips("out-st", [["all", "All outcomes", all.length], ["met", "Met", n("met")], ["part", "Partly met", n("part")], ["not", "Not met", n("not")], ["na", "Not assessed", n("na")]], "Outcome status")}${qr !== "all" ? `<span class="v8g-one">${mu(`Showing ${esc(revBy(qr).t)} only`)}<button type="button" class="btn sm" data-v8g-q="rev" data-v8g-v="all">Show every review</button></span>` : ""}</div>`,
      tbl({ cols: ["Security outcome", "Process", "Status", "Evidence"], rows, total: pool.length, panel: "v8g-outcome", label: "Security outcomes by review", empty: "No outcome matches.", cls: "v8g-tight" }),
      line(`Outcomes are NIST SP 800-160 Vol. 1 Rev. 1's, as printed. ${lk("Schedule", "schedule")} holds the gates' tasks and decisions · ${lk("Traceability", "traceability")} · ${lk("Vol. 2: cyber resiliency", "resiliency")}`),
      AK.note("WS-X90's PDR and CDR are its own gates and record no gate criteria yet: the outcomes placed under every review, their status and evidence links are invented, and so are SRR, Milestone B, TRR and Milestone C. The evidence titles are WS-X90's."));
  };

  P["v8g-review"] = (id) => {
    const rv = revBy(id), k = revCount(rv);
    const head = AK.recordHead({ title: `${rv.t} · ${rv.long}`, chip: rsPill(rv), actions: `${btn("Add security outcomes", `data-modal="v8g-outcomes" data-id="${rv.id}"`)}${rv.st === "decided" ? "" : btn("Request decision", `data-modal="ak-approvers" data-id="${esc(rv.t)}"`, true)}` });
    const facts = AK.facts([["When", revWhen(rv)], ["Outcomes", num(k.total)], ["Met", `${num(k.met)} ${mu(`· ${k.part} partly · ${k.not} not met`)}`], ["Not assessed", num(k.na)]]);
    const appr = rv.id === "pdr" ? AK.approval({ title: "Decision", sub: "Requested Oct 10 · decided when every step approves", steps: [{ label: "Step 1", approvers: [{ who: "Ray Colston", role: "System owner", state: "sent", when: "Oct 10" }] }] })
      : rv.st === "decided" ? AK.approval({ title: "Decision", sub: `Decided ${mdy(rv.when)} with one action: trace SR.6 before PDR`, steps: [{ label: "Step 1", approvers: [{ who: "Ray Colston", role: "System owner", state: "approved", when: mdy(rv.when) }] }] })
      : AK.approval({ title: "Decision", sub: "No decision requested yet. Request decision names the approvers, in steps." });
    const outs = AK.section("Security outcomes", `<div class="v8g-list">${outsOf(rv).map(([oc, s, ev]) => `<div class="v8g-li" role="button" tabindex="0" data-panel="v8g-outcome" data-id="${esc(rv.id + "|" + oc)}">${gl(s === "met" ? "check" : s === "part" ? "part" : s === "not" ? "diamond" : "ring")}<span class="x"><b>${esc(oc)}</b> ${esc(outText(oc))}</span>${osPill(s)}</div>`).join("")}</div>`, { count: k.total, action: btn("Add", `data-modal="v8g-outcomes" data-id="${rv.id}"`) });
    return { label: "Technical review preview", body: `<div class="v8g-pan">${head}${facts}${appr}${outs}${line(`${lk("Open in Schedule", "schedule")}${rv.ex ? " · " + EX : ""}`)}</div>` };
  };
  P["v8g-outcome"] = (id) => {
    const [rid, oc] = String(id || "").split("|"), rv = revBy(rid), o = outsOf(rv).find((x) => x[0] === oc) || outsOf(rv)[0];
    const pc = o[0].split(".")[0], p = procOf(pc), g = groupOf(pc);
    const head = AK.recordHead({ title: outText(o[0]), chip: osPill(o[1]), actions: btn("Change status", `data-modal="ak-reason" data-id="${esc(`Change the status of ${o[0]} at ${rv.t}|${OS[o[1]][1]} today. Say what the evidence shows; the reason shows on the outcome with your name and the date.`)}"`) });
    const facts = AK.facts([["Outcome", code(o[0])], ["Process", `${esc(p[0])} ${mu(esc(p[1]))}`], ["Group", esc(g[1])], ["Review", lk(esc(rv.t), "sse")]]);
    const ev = AK.section("Evidence", o[2] ? `<div class="v8g-li">${gl("check")}<span class="x">${lk(esc(o[2]), "evidence")}</span></div>` : `<div class="v8g-li">${gl("ring")}<span class="x">No evidence linked</span>${btn("Link evidence", 'data-v8g-toast="The evidence picker opens here"')}</div>`);
    const where = REV.flatMap((r) => outsOf(r).filter((x) => x[0].startsWith(pc + ".")).map((x) => [r, x]));
    const sib = AK.section(`Other outcomes of ${p[0]}`, `<div class="v8g-list">${p[2].map((t, i) => { const c = `${pc}.${i + 1}`; if (c === o[0]) return ""; const at = where.filter(([, x]) => x[0] === c); return `<div class="v8g-li"><span class="x"><b>${esc(c)}</b> ${esc(t)}</span>${at.length ? at.map(([r, x]) => `<span class="v8g-revt">${esc(r.t)} ${gl(x[1] === "met" ? "check" : x[1] === "na" ? "ring" : x[1] === "part" ? "part" : "diamond")}</span>`).join("") : mu("Not held")}</div>`; }).join("")}</div>`, { count: p[2].length - 1 });
    const cm = o[0] === "AR.7" ? [{ who: "D. Okafor", role: "Lead assessor", when: "Oct 9, 2:30 PM", text: `The maintenance VLAN export covers LRU-009 and LRU-007 only; LRU-014's service connector is not in it. ${EX}` }] : [];
    return { label: "Security outcome preview", body: `<div class="v8g-pan">${head}${facts}${ev}${AK.section("Comments", AK.comments({ you: ME, items: cm }), { count: cm.length })}${sib}${line(`NIST SP 800-160 Vol. 1 Rev. 1, Section ${esc(p[1])} · <a class="v8g-a" href="${esc(P1.src.url)}" target="_blank" rel="noopener">PDF on nvlpubs.nist.gov ↗</a>`)}</div>` };
  };

  // ——— Add security outcomes: a picker over the 181 outcomes ———
  const PK = { rev: "cdr", grp: "all", q: "" };
  function pkList() {
    const rv = revBy(PK.rev), held = new Set(outsOf(rv).map((x) => x[0]));
    return P1.groups.filter(([k]) => PK.grp === "all" || PK.grp === k).map(([k, t, list]) => `<div class="v8g-pkg" data-g="${k}"><div class="v8g-pkgh">${esc(t)}</div>${list.map((pc) => { const p = procOf(pc); return `<div class="v8g-pkp" data-p="${pc}"><div class="v8g-pkph">${esc(p[0])} ${mu(esc(p[1]))}</div>${p[2].map((txt, i) => { const c = `${pc}.${i + 1}`, h0 = held.has(c); return `<label class="v8g-pko v8g-opt" data-t="${esc((c + " " + txt + " " + p[0]).toLowerCase())}"><input type="checkbox" name="v8g-oc" value="${c}"${h0 ? " checked disabled" : PK.pre === c ? " checked" : ""}><span><b>${esc(c)}${h0 ? ` <span class="v8g-held">Held</span>` : ""}</b><small>${esc(txt)}</small></span></label>`; }).join("")}</div>`; }).join("")}</div>`).join("");
  }
  const pkCount = () => { const n = document.querySelectorAll('#modal input[name="v8g-oc"]:checked:not(:disabled)').length; const el = document.querySelector("#modal .v8g-pkn"); if (el) el.textContent = `${n} chosen`; const b = document.querySelector('#modal [data-v8g-submit="outcomes"]'); if (b) b.textContent = n ? `Add ${plural(n, "outcome")}` : "Add outcomes"; };
  const pkFilter = () => {
    const q = PK.q.trim().toLowerCase();
    document.querySelectorAll("#modal .v8g-pko").forEach((el) => { el.hidden = !!q && !el.dataset.t.includes(q); });
    document.querySelectorAll("#modal .v8g-pkp").forEach((el) => { el.hidden = ![...el.querySelectorAll(".v8g-pko")].some((x) => !x.hidden); });
    document.querySelectorAll("#modal .v8g-pkg").forEach((el) => { el.hidden = ![...el.querySelectorAll(".v8g-pkp")].some((x) => !x.hidden); });
    const none = document.querySelector("#modal .v8g-pkempty"); if (none) none.hidden = [...document.querySelectorAll("#modal .v8g-pko")].some((x) => !x.hidden);
  };
  M["v8g-outcomes"] = (id) => {
    const [rid, pre] = String(id || "").split("|"); PK.rev = REV.some((r) => r.id === rid) ? rid : "cdr"; PK.grp = "all"; PK.q = ""; PK.pre = pre || null;
    return { title: "Add security outcomes", body: `<p class="ak-desc">NIST SP 800-160 Vol. 1 Rev. 1: 181 outcomes in 30 processes. An outcome added to a review becomes one of its gate criteria, Not assessed until someone records its evidence.</p>
      <div class="v8g-2">${field("Review", select("v8g-pk-rev", REV.map((r) => [r.id, `${r.t} · ${r.long}`]), PK.rev, "Review"), REQ)}${field("Process group", select("v8g-pk-grp", [["all", "All groups"], ...P1.groups.map(([k, t]) => [k, t])], "all", "Process group"))}</div>
      <input class="v8g-in v8g-pk-q" type="search" placeholder="Search outcomes, processes or codes" aria-label="Search security outcomes">
      <div class="v8g-pk">${pkList()}<p class="v8g-pkempty v8g-mu" hidden>No outcome matches the search.</p></div>`,
      footer: `<span class="v8g-pkn num">${PK.pre ? 1 : 0} chosen</span><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v8g-submit="outcomes">${PK.pre ? "Add 1 outcome" : "Add outcomes"}</button>` };
  };

  // ——— Processes ———
  S["sse-processes"] = () => {
    const qg = Q.pg || "all";
    const heldAt = (pc) => REV.map((rv) => [rv, outsOf(rv).filter((x) => x[0].startsWith(pc + "."))]).filter(([, l]) => l.length);
    const isHeld = (pc) => heldAt(pc).length > 0;
    const procs = Object.keys(P1.proc);
    const rows = [];
    for (const [k, t, list] of P1.groups) {
      if (qg !== "all" && qg !== k && qg !== "held") continue;
      const l = list.filter((pc) => qg !== "held" || isHeld(pc)); if (!l.length) continue;
      rows.push({ raw: `<td colspan="5"><span class="v8g-grp-n">${esc(t)}</span>${mu(`${plural(l.length, "process", "processes")} · Appendix ${esc(procOf(l[0])[1][0])}`)}</td>` });
      for (const pc of l) { const p = procOf(pc), at = heldAt(pc), met = at.reduce((a, [, x]) => a + x.filter((o) => o[1] === "met").length, 0), held = at.reduce((a, [, x]) => a + x.length, 0); rows.push({ id: pc, cells: [`<span class="v8g-one">${code(pc)} ${esc(p[0])}</span>`, num(p[1]), num(p[2].length), at.length ? at.map(([rv, x]) => `<span class="v8g-revt">${esc(rv.t)} <span class="num">${x.length}</span></span>`).join("") : mu("Not held at a review"), held ? `${num(met)} ${mu(`of ${held} met`)}` : mu("None held")] }); }
    }
    const n = (k) => GRP[k].list.length;
    return h.page(sseHead(), sseTabs("proc"),
      chips("pg", [["all", "All", procs.length], ...P1.groups.map(([k, t]) => [k, t.replace(" Processes", ""), n(k)]), ["held", "Held at a review", procs.filter(isHeld).length]], "Process groups"),
      filters("Search processes and outcomes", ["Review", "Outcome status"]),
      tbl({ cols: ["Process", "Section", "Outcomes", "Held at reviews", "Met"], rows, total: rows.filter((r) => !r.raw).length, panel: "v8g-proc", label: "Life cycle processes", cls: "v8g-tight" }),
      line(`${esc(P1.src.title)}, NIST SP 800-160 Vol. 1 Rev. 1 (${esc(mdy(P1.src.published))}): every process and outcome as printed. <a class="v8g-a" href="${esc(P1.src.url)}" target="_blank" rel="noopener">PDF on nvlpubs.nist.gov ↗</a>`),
      AK.note("The processes and outcomes are NIST's; where WS-X90 holds each, and its status, are invented."));
  };
  P["v8g-proc"] = (pc) => {
    const p = procOf(pc) || procOf("AR"), g = groupOf(pc) || P1.groups[0];
    const where = REV.flatMap((r) => outsOf(r).filter((x) => x[0].startsWith(pc + ".")).map((x) => [r, x]));
    const head = AK.recordHead({ title: p[0], chip: AK.chip(g[1].replace(" Processes", "")), actions: btn("Add to a review", `data-modal="v8g-outcomes" data-id="${esc((where[0] ? where[0][0].id : "cdr") + "|" + pc + ".1")}"`, true) });
    const facts = AK.facts([["Identifier", code(pc)], ["Section", num(p[1])], ["Outcomes", num(p[2].length)], ["Held at", where.length ? andList([...new Set(where.map(([r]) => esc(r.t)))]) : mu("No review")]]);
    const outs = AK.section("Security outcomes, as printed", `<div class="v8g-list">${p[2].map((t, i) => { const c = `${pc}.${i + 1}`, at = where.filter(([, x]) => x[0] === c); return `<div class="v8g-li"><span class="x"><b>${esc(c)}</b> ${esc(t)}</span>${at.length ? at.map(([r, x]) => `<span class="v8g-revt" role="button" tabindex="0" data-panel="v8g-outcome" data-id="${esc(r.id + "|" + c)}">${esc(r.t)} ${osPill(x[1])}</span>`).join("") : btn("Add", `data-modal="v8g-outcomes" data-id="${esc("cdr|" + c)}"`)}</div>`; }).join("")}</div>`, { count: p[2].length });
    return { label: "Life cycle process preview", body: `<div class="v8g-pan">${head}${facts}${outs}${line(`Section ${esc(p[1])} of NIST SP 800-160 Vol. 1 Rev. 1 · <a class="v8g-a" href="${esc(P1.src.url)}" target="_blank" rel="noopener">PDF ↗</a>`)}</div>` };
  };

  // ——— Cyber survivability: the CSE's ten attributes under the SS KPP's pillars ———
  const TECH = { "adaptive-response": "Adaptive Response", "analytic-monitoring": "Analytic Monitoring", "contextual-awareness": "Contextual Awareness", "coordinated-protection": "Coordinated Protection", deception: "Deception", diversity: "Diversity", "dynamic-positioning": "Dynamic Positioning", "non-persistence": "Non-Persistence", "privilege-restriction": "Privilege Restriction", realignment: "Realignment", redundancy: "Redundancy", segmentation: "Segmentation", "substantiated-integrity": "Substantiated Integrity", unpredictability: "Unpredictability" };
  const CHOSEN = new Set(["adaptive-response", "analytic-monitoring", "coordinated-protection", "diversity", "non-persistence", "privilege-restriction", "redundancy", "segmentation", "substantiated-integrity"]);
  const TE = {
    cvi: ["WS-X90 cooperative vulnerability identification — FY2027", "Phase 3 · CVI", "planned", "2027-01-11", "2027-02-05"],
    acd: ["WS-X90 adversarial cybersecurity DT&E — FY2027", "Phase 4 · ACD", "proposed", "2027-04-12", "2027-05-07"],
    res: ["Cyber resiliency exercise — Redundancy and Non-Persistence (SA-24)", "Event · Exercise", "planned", "2027-05-02", "2027-06-01"],
    cvpa: ["WS-X90 CVPA — IOT&E", "Phase 5 · CVPA", "proposed", "2027-09-13", "2027-10-01"],
    aa: ["WS-X90 adversarial assessment — IOT&E", "Phase 6 · AA", "proposed", "2027-10-18", "2027-11-12"],
  };
  const FND = { f1: ["Maintenance Access Gateway accepts SSH password logons from the flightline LAN", "high", "POA&M item created"], f2: ["Tactical Data Radio management port answers on the mission network", "moderate", "Operational issue opened"], f3: ["Update & Recovery Controller loads an unsigned recovery image from removable media", "critical", "POA&M item created"] };
  const PILLARS = [
    ["Prevent", "Design requirements identify, protect and harden weapon system’s functions from adversary cybersecurity threats (to anticipate most likely and greatest risk)"],
    ["Mitigate", "Design requirements detect and respond to cyber-events making it through defenses; enabling cyber safety and operational resilience (to complete the mission)"],
    ["Recover", "Design requirements to recover to a known good condition after a cyber event; at a minimum, restore partial-to-full mission capability (to fight another day)"],
    ["Adapt", "Enables DevOps to adapt to changes in adversary threat and vulnerabilities (to win this war and next war)"],
  ];
  const CSA = [
    { n: 1, p: "Prevent", t: "Control Access", sub: "not RMF Access Control", st: "not", thr: "No single-factor path to a privileged interface", obj: "Mutual device authentication on every LRU-to-LRU interface", req: "WS-X90 shall allow only identified, authenticated and authorized persons and non-person entities, its cyber defenders and their tools included, to reach or interconnect with its elements; maintenance access requires CAC or PIV.", ctl: ["AC-3", "AC-17", "IA-2(1)", "IA-3", "PE-3", "SR-9"], tech: ["privilege-restriction", "coordinated-protection", "substantiated-integrity"], te: ["cvi", "aa"], fnd: ["f1"], ev: ["Independent penetration test report, WS-X90 external boundary and technician session path", "First article inspection anti-tamper section, LRU-002 and LRU-016, lot 7"], ig: "System shall only allow identified, authenticated, and authorized persons and non-person entities (including all assigned cyber defenders and their tools) access or interconnection to system or sub-system elements. The capability shall enforce a validation mechanism to protect the C, I, A of system resources (e.g., memory, files, interfaces, logical networks). The system shall employ anti-tamper measures that include features for protection of critical system components, information technologies, and maintenance of technology/program protection. Physical access to the system shall also be controlled." },
    { n: 2, p: "Prevent", t: "Reduce Cyber Detectability", st: "untested", thr: "No emission from the maintenance interface in flight", obj: "Low-probability-of-intercept waveform on every RF path", req: "WS-X90's signaling and communications, wired and wireless, shall minimize an adversary's ability to monitor or target the platform through its emanations; the Tactical Data Radio transmits only in assigned windows.", ctl: ["SC-40", "PE-19", "SC-8"], tech: ["deception", "unpredictability", "dynamic-positioning"], te: ["aa"], fnd: [], ev: [], ig: "System survivability requires signaling and communications (both wired and wireless) implemented by the system (or state “supported by system/capability”) shall minimize the ability of an adversary to monitor and/or target system and/or supported DoD weapon systems through its emanations, which may include deception." },
    { n: 3, p: "Prevent", t: "Secure Transmissions and Communications", st: "part", thr: "All data in transit under NSA-certified cryptography", obj: "Crypto-modernized links with automated rekey", req: "WS-X90 shall protect all data in transit to its confidentiality and integrity requirements with NSA-certified cryptography only, and keep a System TRANSEC Plan for the life of the system.", ctl: ["SC-8", "SC-8(1)", "SC-12", "SC-13"], tech: ["coordinated-protection", "segmentation"], te: ["cvi", "cvpa"], fnd: [], ev: ["Encrypted flow inspection and termination test report, LRU-007 with LRU-003 key path", "Cryptographic configuration item register for LRU-003 and LRU-008, baseline 5.4.0"], ig: "System shall ensure all transmissions and communications of data ‘in transit’ are protected commensurate with its confidentiality and integrity requirements. System shall only use NSA-certified cryptographic capabilities. [If a National Security System:] System shall develop, coordinate and maintain a System TRANSEC Plan (STP) throughout the system’s lifecycle." },
    { n: 4, p: "Prevent", t: "Protect Information from Exploitation", st: "ok", thr: "No key or mission data leaves LRU-003 or LRU-015 in clear", obj: "Tamper-triggered zeroization within 1 second", req: "WS-X90 shall protect all data at rest to its confidentiality and integrity requirements and prevent its unauthorized access, use, modification, transfer or exfiltration throughout the life cycle, development included.", ctl: ["SC-28", "SC-28(1)", "AC-4", "SC-7(10)"], tech: ["privilege-restriction", "segmentation"], te: ["cvi"], fnd: [], ev: ["Key store containment test report, LRU-003 export attempts and handle-only interface trace", "LRU-003 privileged key attestation inventory showing non-exportable key objects"], ig: "System shall ensure all data at rest is protected commensurate with its confidentiality and integrity requirements. System shall prevent unauthorized access, use, modification, and transfer/removal of data, including attempted exfiltration, from the system to unauthorized person and non-person entities throughout the system’s lifecycle (including development)." },
    { n: 5, p: "Prevent", t: "Partition and Ensure Critical Functions at Mission Completion Performance Levels", st: "part", thr: "Mission functions hold CONOPS minimums with any one non-critical partition lost", obj: "Hold full performance with any two lost", req: "WS-X90 shall segment its functions logically and physically, keep mission-critical functions at the minimum performance its CONOPS sets, and contain a compromise of any non-critical function.", ctl: ["SC-3", "SC-7(21)", "SC-39", "SC-32"], tech: ["segmentation", "redundancy", "diversity"], te: ["acd", "res"], fnd: [], ev: ["Partition separation test report, LRU-001 build 4.2.1, management endpoint reachability", "Payload segment isolation export, LRU-009 segment map with route traces from 18 LRUs"], ig: "System partitioning shall implement technical/logical mitigations including logical and physical segmentation. The system shall be able to maintain mission critical functions at minimum performance thresholds identified within the system’s CONOPS. Compromise of non-critical functions shall not significantly impact system mission capability." },
    { n: 6, p: "Prevent", t: "Minimize and Harden Cyber Attack Surfaces", st: "not", thr: "Only PPSM-registered ports, protocols and services open; no open STIG CAT I", obj: "No open STIG CAT II beyond its deadline", req: "WS-X90 shall disable every unauthorized port, protocol and service by default, take deviations from its PPS baseline to the configuration control board, log its attack surface, and approve and monitor all removable media.", ctl: ["CM-6", "CM-7", "CM-7(1)", "CM-7(5)", "SC-7(5)"], tech: ["non-persistence", "segmentation"], te: ["cvi", "acd"], fnd: ["f2"], ev: ["Default-deny probe test report, unapproved flows against every LRU-007 and LRU-009 interface", "External interface exposure survey, LRU-007, 2026 Q4"], stig: 1, ig: "System shall automatically disable all unauthorized ports, protocols, and services (PPS), including access points, by default. Any deviations from PPS baselines shall be approved and documented by a configuration management board. System shall support automated monitoring and logging of system attack surface and associated cyber events. Any removable media use must be approved, documented and strictly monitored." },
    { n: 7, p: "Mitigate", t: "Baseline & Monitor Systems, and Detect Anomalies", st: "part", thr: "Anomalies reported to operators and defenders within 60 seconds", obj: "Within 10 seconds, with the affected LRU named", req: "WS-X90 shall keep a cyber survivability configuration baseline of its hardware, software, firmware and open source modules by version, and monitor, detect and report health and anomalies that indicate cyber events.", ctl: ["CM-2", "CM-8", "SI-4", "SI-7", "AU-6"], tech: ["analytic-monitoring", "substantiated-integrity"], te: ["acd", "aa"], fnd: [], ev: ["Daily service baseline comparison output, LRU-009 and LRU-007, 2026-10-05", "Baseline reconciliation timing test, LRU-013 to LRU-020, seeded firmware change, run 26-09-24"], ig: "System shall implement and maintain a cyber survivability configuration baseline for its GOTS/COTS HW, SW, FW and open source modules, by version # to ensure an operationally acceptable cyber risk posture 24/7. System shall monitor, detect and report system health status and anomalies indicative of cyber events, based on its current adversary threat intelligence, CONOPS and MRT-C." },
    { n: 8, p: "Mitigate", t: "Manage System Performance and Enable Cyberspace Defense", st: "part", thr: "Minimum mission functions kept through a cyber event; return for recovery", obj: "Complete the current mission", req: "WS-X90 shall respond to detected anomalies in an ordered, prioritized way that keeps its minimum mission functions, let its defenders act against an adversary, and let the mission commander isolate non-critical subsystems.", ctl: ["SC-5", "SC-24", "CP-12", "IR-4", "SI-17"], tech: ["adaptive-response", "redundancy", "coordinated-protection"], te: ["res", "aa"], fnd: [], ev: ["Ingress flood shedding test report, LRU-007 external interfaces and LRU-009 port storm control", "Communications path disjointness trace, LRU-007 and LRU-008 through LRU-009"], ig: "If anomalies are detected and/or cyber-events degrade system capability, the system shall be sufficiently resilient to mitigate cyber-related event effects through orderly, structured and prioritized system responses, in order to ensure minimum mission functionality requirements [system functionality threshold specified by sponsor] to complete the current mission or return for recovery. The system shall enable assigned cyber defenders to impose effects on adversaries to counter their operations and objectives." },
    { n: 9, p: "Recover", t: "Recover System Capabilities", st: "not", thr: "Partial mission capability from a trusted source within 4 hours", obj: "Full mission capability within 4 hours", req: "After a cyber event WS-X90 shall be restorable to a known good configuration from a trusted source, at least to partial mission capability between mission cycles or within 4 hours, cyber resiliency functions first.", ctl: ["CP-10", "CP-10(2)", "CP-9", "SI-7(17)"], tech: ["non-persistence", "redundancy", "substantiated-integrity"], te: ["res", "cvpa"], fnd: ["f3"], ev: ["Baseline rollback exercise to N-2 retained version, LRU-020 to LRU-016, baseline 5.3.2"], poam: ["6c99b283", "Exercise a whole-article recovery against the four-hour objective"], ig: "After a cyber-event, the system shall be capable of being restored to a known good configuration from a trusted source; at a minimum, restored to partial mission capability, between mission cycles or within xx hours [specified by sponsor], to fight another day. System recovery shall prioritize cyber operational resiliency functions." },
    { n: 10, p: "Adapt", t: "Actively Manage System’s Configurations to Achieve and Maintain an Operationally Relevant Cyber Risk Posture", st: "part", thr: "Posture restored within one mission cycle of falling below CSRC-4", obj: "Machine-readable HBOM and SBOM before each release", req: "WS-X90 shall keep a configuration management process, automated and with technology refresh, that restores an assessed risk posture within one mission cycle and reviews a machine-readable bill of materials before each milestone and release.", ctl: ["CM-3", "CM-8", "RA-5", "SR-4", "SA-10"], tech: ["adaptive-response", "analytic-monitoring"], te: ["cvpa"], fnd: [], ev: ["Baseline tailoring event register, PROFILE-WSX90-TAILORED"], bench: 1, ig: "Throughout a system’s lifecycle and within one standard mission cycle of xx hours [specified by sponsor] of identification of a drop in cyber risk posture below its commensurate CSRC level, the system shall have a configuration management process, supported by automated capabilities and technology refresh options, to achieve and continuously maintain an objectively assessed and operationally-relevant risk posture." },
  ];
  const CST = { ok: ["ok", "Verified"], part: ["part", "Partly verified"], not: ["bad", "Not met"], untested: ["none", "Not yet tested"] };
  const cstPill = (s) => pill(...CST[s]);
  const csaName = (a) => `CSA ${String(a.n).padStart(2, "0")} · ${a.t}`;
  const nextTe = (a) => a.te.map((k) => TE[k]).filter((e) => e[2] !== "cancelled").sort((x, y) => x[3].localeCompare(y[3]))[0];
  S["sse-csa"] = () => {
    const qp = Q.pil || "all", n = (s) => CSA.filter((a) => a.st === s).length;
    const notMet = CSA.filter((a) => a.st === "not");
    const rows = [];
    for (const [pl, def] of PILLARS) {
      if (qp !== "all" && qp !== pl) continue;
      const g = CSA.filter((a) => a.p === pl);
      rows.push({ raw: `<td colspan="6"><span class="v8g-grph"><span class="v8g-grp-n">${esc(pl)}</span>${mu(plural(g.length, "attribute"))}<span class="v8g-dot"></span>${tr(def, 640)}</span></td>` });
      for (const a of g) { const e = nextTe(a); rows.push({ id: String(a.n), cells: [`<span class="v8g-one"><b class="num">CSA ${String(a.n).padStart(2, "0")}</b> ${tr(a.t, 230)}</span>`, tr(a.thr, 190), `<span class="v8g-one">${code(a.ctl[0])}${a.ctl.length > 1 ? ` ${mu("+" + (a.ctl.length - 1))}` : ""}</span>`, tr(a.tech.map((t) => TECH[t]).join(", "), 160), e ? `<span class="v8g-one">${esc(e[1].split(" · ")[1] || e[1])} ${mu(esc(md(e[3])))}</span>` : mu("None planned"), cstPill(a.st)] }); }
    }
    return h.page(sseHead(), sseTabs("csa"),
      `<div class="v8g-kpp">${AK.facts([["Key performance parameter", "System Survivability"], ["Risk category", `CSRC-4 · Very high ${EX}`], ["Attributes selected", "10 of 10"], ["Source", "CSE Implementation Guide v3.0 · Jul 2022"]])}</div>`,
      AK.banner({ tone: "bad", text: `<b>${plural(notMet.length, "attribute")} not met:</b> ${andList(notMet.map((a) => `CSA ${String(a.n).padStart(2, "0")} ${esc(a.t)}`))} each hold an open cyber T&amp;E finding.`, action: "Open findings" }).replace('<span class="btn sm">Open findings</span>', btn("Open findings", 'data-go="cyber-te-findings"')),
      chips("pil", [["all", "All", CSA.length], ...PILLARS.map(([pl]) => [pl, pl, CSA.filter((a) => a.p === pl).length])], "Pillars"),
      tbl({ cols: ["Attribute", "WS-X90 threshold", "Controls", "Resiliency techniques", "Next cyber T&amp;E", "Status"], rows, total: rows.filter((r) => !r.raw).length, panel: "v8g-csa", label: "Cyber survivability attributes", cls: "v8g-tight" }),
      line(`${plural(n("ok"), "attribute")} verified, ${fmt(n("part"))} partly verified, ${fmt(n("not"))} not met, ${fmt(n("untested"))} not yet tested. ${lk("Vol. 2: cyber resiliency", "resiliency")} · ${lk("Cyber T&amp;E", "cyber-te")} · ${lk("Traceability", "traceability")}`),
      AK.note("The attributes, pillars, exemplar language and CSRC levels are the Joint Staff's; WS-X90's statements, thresholds, objectives, CSRC, status and the controls, techniques and events behind each are invented. Controls' status, techniques chosen for SA-24, the events and evidence are WS-X90's."));
  };
  P["v8g-csa"] = (id) => {
    const a = CSA.find((x) => String(x.n) === String(id)) || CSA[0];
    const head = AK.recordHead({ title: csaName(a), chip: cstPill(a.st), actions: btn("Change status", `data-modal="ak-reason" data-id="${esc(`Change the status of CSA ${String(a.n).padStart(2, "0")}|${CST[a.st][1]} today. Name the test event or evidence behind the change.`)}"`) });
    const facts = AK.facts([["Pillar", esc(a.p)], ["Threshold", `${esc(a.thr)} ${EX}`], ["Objective", `${esc(a.obj)} ${EX}`], ["Owner", AK.owner(a.n === 6 || a.n === 10 ? "Joel Barrantes" : ME)]]);
    const req = AK.section("WS-X90 requirement", `<p class="v8g-p">${esc(a.req)} ${EX}</p>`);
    const ig = AK.section("CSE IG exemplar", `<blockquote class="v8g-q">“${esc(a.ig)}”</blockquote>${mu("Threshold exemplar, Joint Staff J6 CSE brief, Apr 2023")}`);
    const ctl = AK.section("Controls", `<div class="v8g-list">${a.ctl.map((c) => { const x = ctlInfo(c); return `<div class="v8g-li">${lk(code(c), ctlRoute(c))}<span class="x">${x ? esc(x.t) : mu("Not in WS-X90's baseline")}</span>${x ? csPill(c) : ""}</div>`; }).join("")}</div>`, { count: a.ctl.length });
    const tech = AK.section("Resiliency techniques", `<div class="v8g-list">${a.tech.map((t) => `<div class="v8g-li">${gl(CHOSEN.has(t) ? "check" : "ring")}<span class="x">${lk(esc(TECH[t]), "resiliency")}</span>${CHOSEN.has(t) ? AK.chip("Chosen for SA-24", { tone: "info" }) : mu("Not chosen for SA-24")}</div>`).join("")}</div>`, { count: a.tech.length });
    const te = AK.section("Cyber T&E that tests it", `<div class="v8g-list">${a.te.map((k) => { const e = TE[k]; return `<div class="v8g-li"><span class="x">${lk(esc(e[0]), k === "res" ? "cyber-te-events" : "cyber-te")}<small>${esc(e[1])} · ${esc(md(e[3]))} – ${esc(mdy(e[4]))}</small></span>${pill(e[2] === "planned" ? "info" : "none", e[2] === "planned" ? "Planned" : "Proposed")}</div>`; }).join("")}</div>`, { count: a.te.length });
    const fnd = a.fnd.length ? AK.section("Open findings", `<div class="v8g-list">${a.fnd.map((k) => { const f = FND[k]; return `<div class="v8g-li">${h.sevPill(f[1])}<span class="x">${lk(esc(f[0]), "cyber-te-findings")}<small>${esc(f[2])}</small></span></div>`; }).join("")}</div>`, { count: a.fnd.length }) : "";
    const ev = AK.section("Evidence", a.ev.length ? `<div class="v8g-list">${a.ev.map((t) => `<div class="v8g-li">${gl("check")}<span class="x">${lk(esc(t), "evidence")}</span></div>`).join("")}</div>` : mu("No evidence yet: nothing has tested it."), { count: a.ev.length });
    const extra = [];
    if (a.stig) { const k = openAll(); extra.push(`<div class="v8g-hint">${gl("diamond")}<span>${plural(k.length, "STIG rule")} open on ${plural(new Set(k.map((x) => x.c.asset)).size, "asset")}, ${fmt(k.filter((x) => x.r.cat === 1).length)} of them CAT I</span>${lk("Open rules", "stigs-open")}</div>`, `<div class="v8g-hint">${gl("info")}<span>Ports, protocols and services against the PPSM registry</span>${lk("Ports &amp; protocols", "ppsm")}</div>`); }
    if (a.bench) { const b = BMS.filter((x) => x.list.some((c) => newerOf(c))).length; extra.push(`<div class="v8g-hint">${gl(b ? "clock" : "check")}<span>${b ? `${plural(b, "STIG")} in use behind DISA's latest release` : "Every STIG on DISA's latest release"}</span>${lk("Benchmarks", "stigs-benchmarks")}</div>`); }
    if (a.poam) extra.push(`<div class="v8g-hint">${gl("clock")}<span>POA&amp;M item: ${lk(esc(a.poam[1]), "poam")}</span></div>`);
    return { label: "Cyber survivability attribute preview", body: `<div class="v8g-pan">${head}${facts}${extra.join("")}${req}${ig}${fnd}${te}${ctl}${tech}${ev}</div>` };
  };

  // ——— Events ———
  function submit(kind, id) {
    const dlg = document.querySelector("#modal .dlg");
    if (kind === "poam") {
      const t = dlg && dlg.querySelector('[name="v8g-pt"]'), e = dlg && dlg.querySelector(".v8g-err");
      if (!t || !t.value.trim()) { if (e) e.hidden = false; if (t) { t.setAttribute("aria-invalid", "true"); t.focus(); } return; }
      const { c, r } = ruleOf(id);
      SES.poam[`${c.slug}:${r.v}`] = ["new" + Object.keys(SES.poam).length, t.value.trim()];
      closeModal(); toast(`POA&M item created for ${r.v}`, "Open POA&M", "poam"); redraw(); refreshPanel("v8g-rule", id); return;
    }
    if (kind === "move") {
      const list = (BMS.find((x) => x.k === id) || BMS[0]).list;
      list.forEach((c) => { SES.moved[c.slug] = true; });
      closeModal(); toast(`${list.length === 1 ? "Checklist" : list.length + " checklists"} moved to ${G.newer[id].ver}`, "Open checklist", list[0].route); redraw(); refreshPanel("v8g-bench", id); return;
    }
    if (kind === "outcomes") {
      const chosen = [...document.querySelectorAll('#modal input[name="v8g-oc"]:checked:not(:disabled)')].map((x) => x.value);
      if (!chosen.length) { toast("Choose at least one outcome"); return; }
      const rv = revBy(PK.rev); SES.held[rv.id] = [...(SES.held[rv.id] || []), ...chosen];
      closeModal(); toast(`${plural(chosen.length, "security outcome")} added to ${rv.t}`, "View review", "sse"); redraw(); return;
    }
  }
  document.addEventListener("click", (e) => {
    const q = e.target.closest("[data-v8g-q]");
    if (q) { Q[q.dataset.v8gQ] = q.dataset.v8gV; if (q.dataset.v8gReset) Q[q.dataset.v8gReset] = 0; redraw(); return; }
    const pg = e.target.closest("[data-v8g-page]");
    if (pg) { const k = "p:" + pg.dataset.v8gPage; Q[k] = Math.max(0, (Q[k] || 0) + Number(pg.dataset.v8gDir)); redraw(); const f = document.querySelector(`[data-v8g-page="${pg.dataset.v8gPage}"][data-v8g-dir="${pg.dataset.v8gDir}"]`); if (f && !f.disabled) f.focus(); return; }
    const set = e.target.closest("[data-v8g-set]");
    if (set) { const [k, v] = set.dataset.v8gSet.split("="); Q[k] = v; if (set.dataset.go === route()) redraw(); }
    const t = e.target.closest("[data-v8g-toast]");
    if (t) { toast(t.dataset.v8gToast); return; }
    const im = e.target.closest("[data-v8g-imp]");
    if (im) { const a = im.dataset.v8gImp; if (a === "next") { IMP.step = 2; impRedraw(); } else if (a === "back") { IMP.step = 1; impRedraw(); } else if (a === "apply") impApply(); return; }
    const sb = e.target.closest("[data-v8g-submit]");
    if (sb) { submit(sb.dataset.v8gSubmit, sb.dataset.id); }
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (!t.closest || !t.closest("#modal")) return;
    if (t.name === "v8g-fmt") { IMP.fmt = t.value; impRedraw(); const f = document.querySelector(`#modal input[name="v8g-fmt"][value="${t.value}"]`); if (f) f.focus(); }
    else if (t.name === "v8g-ck") { IMP.slug = t.value; IMP.fmt = ckBy(t.value).fmt; impRedraw(); const s = document.querySelector('#modal select[name="v8g-ck"]'); if (s) s.focus(); }
    else if (t.name === "v8g-pk-rev" || t.name === "v8g-pk-grp") { if (t.name === "v8g-pk-rev") PK.rev = t.value; else PK.grp = t.value; const box = document.querySelector("#modal .v8g-pk"); if (box) { box.innerHTML = `${pkList()}<p class="v8g-pkempty v8g-mu" hidden>No outcome matches the search.</p>`; pkFilter(); pkCount(); } }
    else if (t.name === "v8g-oc") pkCount();
  });
  document.addEventListener("input", (e) => { if (e.target.classList && e.target.classList.contains("v8g-pk-q")) { PK.q = e.target.value; pkFilter(); } });
  // A role="button" row inside a panel or the SI-2 table opens on Enter, like the core's table rows.
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("#panel [data-panel]:not(button), #panel [data-go]:not(button), #modal [data-go]:not(button)")) { e.preventDefault(); e.target.click(); } });

  // ——— Routes ———
  const OWN = ["stigs", "stigs-open", "stigs-benchmarks", "stigs-imports", "sse", "sse-processes", "sse-csa"];
  for (const c of CK) OWN.push(c.route, c.route + "-comments", c.route + "-activity");
  for (const r of OWN) if (r !== "stigs" && r !== "sse") ROUTE_NAV[r] = r.startsWith("sse") ? "sse" : "stigs";
  if (PA.own) PA.own(OWN);
})();
