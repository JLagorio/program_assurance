// SSP editor (se-): WS-X90's System Security Plan as a live document. Route: ssp (full window).
// Live blocks read and write WS-X90's records (control narratives, the categorization, the system tree);
// authored and custom sections are plain rich text. Reads window.PA.SSP (mod-a-ssp-data.js) and the after kit.
// People, presence, comments, suggestions and AI drafts are examples; the collaborators are scripted.
(function () {
  const PA = window.PA, { S, M, ROUTE_NAV, h } = PA, AK = PA.AK, D = PA.SSP;
  if (!D || !AK) return;
  const U = D.ui, esc = U.esc;
  PA.fullWindow("ssp");
  ROUTE_NAV.ssp = "ssps";

  // ——— Small helpers ———
  const ME = "Ingrid Solberg", ME_ROLE = "Security engineer", TODAY_ISO = "2026-11-17";
  const RM = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NARROW = () => matchMedia("(max-width: 1000px)").matches;
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const app = () => document.getElementById("se-app");
  const sel = (at) => `[data-at="${String(at).replace(/["\\]/g, "\\$&")}"]`;
  const inPage = (at) => document.querySelector("#se-page " + sel(at));
  const ini = (n) => String(n).replace(/\./g, "").split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const trunc = (t, n) => (t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`;
  const sentences = (t, n) => ((t.match(/[^.!?]+[.!?]+(\s|$)/g) || [t]).slice(0, n).join("").trim());
  const toast = (t, link, fn) => { const el = U.toast(t, link); const k = el && el.querySelector(".ak-link"); if (k && fn) { k.setAttribute("role", "button"); k.tabIndex = 0; k.addEventListener("click", fn); } return el; };
  const SRC_CHANGED = ["AC-17(2)", "SC-23"];
  const OTHERS = D.people.filter((p) => !p.you);
  const ALL = [...D.people.map((p) => [p.name, p.role]), ...D.access.map((a) => [a[0], a[1]])];
  const roleOf = (n) => (ALL.find((p) => p[0] === n) || [])[1] || "";
  const famName = (f) => f.t.charAt(0) + f.t.slice(1).toLowerCase();
  const famOf = (at) => (D.ctl(at) || {}).f;
  const isCtl = (at) => !!D.ctl(at);
  const ORIG = new Map(D.controls.map((c) => [c.c, { n: c.n, rv: c.rv }]));
  const CIDX = new Map(D.controls.map((c, i) => [c.c, i]));
  const INHERIT = [["IA-2", "Shared"], ["IA-4", "Inherited"], ["IA-5", "Shared"], ["IA-8", "Shared"], ["IA-12", "Inherited"]];
  const LEAD = { AC: "the Platform Management Controller (LRU-013)", AT: "the program's training records", AU: "the Security Log Collector (LRU-018)", CA: "the program's assessment records", CM: "the Configuration Repository (LRU-020)", CP: "the Update & Recovery Controller (LRU-016)", IA: "the Platform Management Controller (LRU-013)", IR: "the Security Log Collector (LRU-018)", MA: "the Maintenance Access Gateway (LRU-014)", MP: "the Secure Storage Module (LRU-015)", PE: "the protected equipment bay", PL: "the program's security plan", PS: "the program's personnel records", RA: "the program's risk register", SA: "the Configuration Repository (LRU-020)", SC: "the Protected Network Gateway (LRU-007)", SI: "the Security Log Collector (LRU-018)", SR: "the Configuration Repository (LRU-020)" };
  const NOTE = "Collaborators and their activity are scripted. People, presence, comments, suggestions, AI drafts, sections 4, 6, 9, 12 and 13, Appendix A, three interconnections and two element descriptions are examples; narratives, statuses, the system tree, roles, requirements and evidence are WS-X90's.";

  const IP = {
    undo: "M6 4 3 7l3 3M3 7h7a3 3 0 0 1 0 6H8", redo: "M10 4l3 3-3 3M13 7H6a3 3 0 0 0 0 6h2",
    ul: "M6.5 4.5h7M6.5 8h7M6.5 11.5h7M3 4.5h.01M3 8h.01M3 11.5h.01", ol: "M7 4.5h6.5M7 8h6.5M7 11.5h6.5M2.5 3.5h1v3M2.5 9.5h1.8l-1.8 2.2h1.8",
    table: "M2.5 3h11v10h-11zM2.5 6.5h11M2.5 9.75h11M6.2 3v10M9.8 3v10", cplus: "M3 3h10v7H7l-3 3v-3H3zM8 4.5v4M6 6.5h4",
    toc: "M3 4h10M3 8h10M3 12h6", cloud: "M4.5 12.5h7a2.5 2.5 0 0 0 .3-5A3.5 3.5 0 0 0 5 6.8a2.9 2.9 0 0 0-.5 5.7zM6.3 9.6l1.3 1.3 2.2-2.4",
    live: "M2.5 8a5.5 5.5 0 0 1 9.4-3.9M13.5 8a5.5 5.5 0 0 1-9.4 3.9M12 1.8v2.5H9.5M4 14.2v-2.5h2.5", diagram: "M2.5 2.5h4.5v3.5H2.5zM9 10h4.5v3.5H9zM4.75 6v5.75H9",
    image: "M2.5 3.5h11v9h-11zM2.5 10.5l3-3 3 3 2-2 3 3", pb: "M2.5 8h2M6.5 8h3M11.5 8h2M4 2.5v3h8v-3M4 13.5v-3h8v3",
    open: "M9 2.5h4.5V7M13.5 2.5 7.5 8.5M11.5 9.5v4h-9v-9h4", unlink: "M7 9a2.5 2.5 0 0 0 3.5 0l2-2a2.5 2.5 0 0 0-3.5-3.5M9 7a2.5 2.5 0 0 0-3.5 0l-2 2A2.5 2.5 0 0 0 7 12.5M2.5 2.5l11 11",
    right: "M6 3.5 10.5 8 6 12.5", follow: "M8 1.5v2.5M8 12v2.5M1.5 8H4M12 8h2.5M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
    lock: "M4 7.5h8v6H4zM5.5 7.5v-2a2.5 2.5 0 0 1 5 0v2", sugg: "M2.5 13.5h3l7-7-3-3-7 7zM8.5 4.5l3 3M10.5 13.5h3",
  };
  const I = (k, cls = "") => IP[k] ? `<svg class="ak-i se-i ${cls}" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IP[k]}"/></svg>` : AK.i(k, cls);

  // ——— State (module variables, so it survives route changes) ———
  const SIMTEXT = "Holds the signed configuration baseline and the technician procedure packages.";
  const TYPE_AT = (() => { let s = 11, t = 2500; return [...SIMTEXT].map((ch) => { s = (s * 9301 + 49297) % 233280; t += 55 + (s / 233280) * 70 + (ch === " " ? 35 : 0) + (/[,.]/.test(ch) ? 240 : 0); return Math.round(t); }); })();
  const EV = { marcusMove: 15500, reply: 20000, joelMove: 32000 }, SIM_END = 32500;
  const ST = {
    title: D.doc.title, mode: "edit", side: "comments", sideTouched: false, ctab: "internal", cfilter: "open", atab: "check",
    gaps: false, open11: true, rendered: new Set(["AC"]), active: null, save: ["saved", "Saved"], follow: null,
    detached: new Set(), reviewed: new Set(), paramsSet: false, secHTML: {}, secs: D.sections.map((s) => ({ ...s })),
    comments: D.comments.map((c) => ({ ...c, thread: c.thread.map((m) => m.slice()) })),
    sugg: D.suggestions.map((g) => ({ ...g, card: true })),
    q: { running: false, i: 0, list: [], timer: 0 }, chat: [], dt: null, lastGen: null, codesOpen: new Set(), srcOff: {},
    inv: { "LRU-013": "Disables accounts on expiry, loss of programme association or a recorded policy violation.", "LRU-017": "Assembles each technician procedure package from the current approved revision." },
    invSynced: "", typed: 0, unread: 0,
    pos: { "Priya Raghavan": { at: "AC-2", doing: "Editing", caret: 1 }, "Joel Barrantes": { at: "s5", doing: "Viewing" }, "Marcus Ryde": { at: "s8", doing: "Editing", caret: 1 }, "D. Okafor": { at: "SI-14(1)", doing: "Viewing" } },
    sim: { on: true, t: 0, last: 0, timer: 0, fired: new Set() },
    share: { link: false, access: {}, invited: [] },
    lastEd: null, lastAuth: null, lastRange: null, selRange: null, selAt: null, sess: null, scrollTop: 0, popFor: null, seq: 0, cur: null, io: null,
  };
  let SRCS = [];

  const pendAt = (at) => ST.sugg.filter((g) => g.at === at && !g.done);
  const openCount = () => ST.comments.filter((c) => !c.resolved && !c.draft).length;
  const rationale = () => D.system.rationale || "";
  const isApp = (s) => /^a\d$/.test(s.id);
  const secById = (id) => ST.secs.find((s) => s.id === id);
  function nums() { const m = {}; let i = 0; for (const s of ST.secs) m[s.id] = isApp(s) ? s.n : String(++i); return m; }
  function where(at) { const N = nums(), c = D.ctl(at); if (c) return `${N.s11}.${D.families.findIndex((f) => f.f === c.f) + 1} ${at}`; const s = secById(at); return s ? `${N[s.id]} ${s.t}` : String(at); }
  function docOrder(at) { const c = D.ctl(at), i = ST.secs.findIndex((s) => s.id === (c ? "s11" : at)); return i * 1000 + (c ? 1 + CIDX.get(at) : 0); }
  const invEls = () => D.elements.filter((e) => e[4]);
  const marcusTyping = () => ST.sim.on && ST.pos["Marcus Ryde"].at === "s8" && !ST.inv["LRU-020"];
  const presenceLine = (n) => (ST.sim.on ? `${ST.pos[n].doing} ${where(ST.pos[n].at)}` : "Idle");
  const famPh = (f) => D.ofFamily(f).filter((c) => c.ph).length;
  function secText(id) { const html = ST.secHTML[id]; if (html != null) return html.replace(/<h\d[^>]*>[\s\S]*?<\/h\d>/g, "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim(); return ((secById(id) || {}).text || []).join(" ").trim(); }
  function compl(s) {
    if (ST.detached.has(s.id)) return 100;
    if (s.id === "s2") return rationale() ? 100 : 75;
    if (s.id === "s8") { const els = invEls(); return Math.round((els.filter((e) => ST.inv[e[4]]).length / els.length) * 100); }
    if (s.id === "s11") { const ph = D.controls.filter((c) => c.ph).length; return Math.round(((D.controls.length - ph) / D.controls.length) * 100); }
    if (s.kind === "custom" || s.kind === "authored") return secText(s.id) ? 100 : 0;
    return 100;
  }
  const checkDone = (k) => ({ k1: () => !D.controls.some((c) => c.ph), k5: () => ST.paramsSet, k6: () => SRC_CHANGED.every((x) => ST.reviewed.has(x)), k7: () => !!rationale() }[k.id] || (() => false))();
  const openAt = (pred) => ST.comments.some((c) => !c.resolved && !c.draft && pred(c.at));
  function famGap(f) { const codes = new Set(D.ofFamily(f).map((c) => c.c)); return famPh(f) > 0 || openAt((at) => codes.has(at)) || D.checks.some((k) => !checkDone(k) && k.codes.some((x) => codes.has(x))); }
  function secGap(s) { if (s.id === "s11") return D.families.some((f) => famGap(f.f)); return compl(s) < 100 || openAt((at) => at === s.id) || D.checks.some((k) => k.at === s.id && !checkDone(k)); }

  function log(e, quiet) { const r = D.log(Object.assign({ who: ME }, e)); if (!quiet) refreshSec("a3"); return r; }
  function setSave(kind, text) { ST.save = [kind, text]; const el = $("#se-save"); if (el) el.innerHTML = saveHTML(); }
  function setSaveSoon(kind, text) { setSave("saving", "Saving…"); if (RM()) setSave(kind, text); else setTimeout(() => setSave(kind, text), 380); }
  const saveHTML = () => `${ST.save[0] === "saving" ? '<span class="se-spin" aria-hidden="true"></span>' : I("cloud")}<span class="se-save-t">${esc(ST.save[1])}</span>`;

  // ——— Text annotation: comment anchors, suggestions and flags over plain narrative text ———
  function annotate(text, ranges, points) {
    const cuts = new Set([0, text.length]);
    ranges.forEach((r) => { cuts.add(r.s); cuts.add(r.e); }); points.forEach((p) => cuts.add(p.at));
    const xs = [...cuts].filter((x) => x >= 0 && x <= text.length).sort((a, b) => a - b);
    let out = "";
    for (let i = 0; i < xs.length; i++) {
      points.filter((p) => p.at === xs[i]).forEach((p) => (out += p.html));
      if (i === xs.length - 1) break;
      const a = xs[i], b = xs[i + 1]; if (a === b) continue;
      let seg = esc(text.slice(a, b));
      ranges.filter((r) => r.s <= a && r.e >= b).sort((x, y) => y.pri - x.pri).forEach((r) => (seg = r.open + seg + r.close));
      out += seg;
    }
    return out;
  }
  const markRange = (c, i) => ({ s: i, e: i + c.quote.length, pri: 1, open: `<span class="sd-mark${c.resolved ? " resolved" : ""}${ST.active === c.id ? " on" : ""}" data-cid="${c.id}">`, close: "</span>" });
  function markText(p, at) { const R = []; for (const c of ST.comments) if (c.at === at && !c.draft) { const i = p.indexOf(c.quote); if (i >= 0) R.push(markRange(c, i)); } return annotate(p, R, []); }
  // Plain text of an editable: "base" is the record's text (deletions kept, insertions skipped); "proposed" applies my own marks.
  function textOf(el, which = "base") {
    let s = "";
    (function walk(n) {
      if (n.nodeType === 3) { s += n.nodeValue; return; }
      if (n.nodeType !== 1 || n.matches(".sd-cur, .se-vm, [data-ui]")) return;
      const mine = n.hasAttribute("data-mine");
      if (n.tagName === "INS" || n.classList.contains("sd-ai")) { if (which === "proposed" && mine) n.childNodes.forEach(walk); return; }
      if (n.tagName === "DEL") { if (!(which === "proposed" && mine)) n.childNodes.forEach(walk); return; }
      if (n.tagName === "BR") { s += " "; return; }
      n.childNodes.forEach(walk);
      if (/^(P|DIV|LI|H\d)$/.test(n.tagName)) s += " ";
    })(el);
    return s.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }

  // ——— Header and toolbar ———
  const MODES = { edit: ["Editing", "pen", "Edit directly; changes save to the records"], suggest: ["Suggesting", "sugg", "Edits become suggestions others accept"], view: ["Viewing", "eye", "Read the document without suggestions"] };
  const modeChip = () => (ST.mode === "edit" ? "" : AK.chip(MODES[ST.mode][0], { tone: ST.mode === "suggest" ? "info" : "" }));
  function headHTML() {
    const n = openCount(), m = MODES[ST.mode];
    return `<header class="se-head">
      <div class="se-head-l">${AK.back("System security plans", "ssps")}
        <div class="se-head-row"><input class="se-title" id="se-title" value="${esc(ST.title)}" aria-label="Document title" spellcheck="false" autocomplete="off">
          <span class="se-chips">${AK.chip("Revision 3")}${AK.chip("Draft", { tone: "warn" })}${AK.chip(D.system.code)}</span>
          <span class="se-save" id="se-save" role="status" aria-live="polite">${saveHTML()}</span></div></div>
      <div class="se-head-r">
        <div class="se-pres" role="group" aria-label="People in this document">${OTHERS.map((p) => `<button type="button" class="se-pav" data-act="person" data-name="${esc(p.name)}" aria-haspopup="dialog" aria-expanded="false" aria-label="${esc(`${p.name}, ${p.role}: ${presenceLine(p.name)}`)}">${U.av(p.name, 26)}</button>`).join("")}<span class="se-you">+ you</span></div>
        <button type="button" class="se-pstack" data-modal="se-people" aria-label="People in this document: ${OTHERS.length} others and you">${OTHERS.slice(0, 3).map((p) => U.av(p.name, 22)).join("")}<span class="se-pstack-n">+2</span></button>
        <button type="button" class="se-hb${ST.side === "comments" ? " on" : ""}" id="se-ctog" data-act="side" data-side="comments" aria-pressed="${ST.side === "comments"}" aria-label="Comments: ${n} open threads">${ctogInner()}</button>
        <button type="button" class="se-ib se-hist" data-go="ssp-history" aria-label="Version history" title="Version history">${I("history")}</button>
        <button type="button" class="btn sm se-sharebtn" data-modal="se-share">${I("user")}Share</button>
        <button type="button" class="btn sm se-modebtn" id="se-modebtn" data-act="modemenu" aria-haspopup="menu" aria-expanded="false" aria-label="Mode: ${m[0]}">${I(m[1])}<span>${m[0]}</span>${I("down")}</button>
        <button type="button" class="se-ib se-morebtn" data-act="more" aria-haspopup="menu" aria-expanded="false" aria-label="More">${I("dots")}</button>
        <button type="button" class="btn ink se-submit" data-go="ssp-review"><span class="se-l">Submit for review</span><span class="se-s">Submit</span></button>
      </div></header>`;
  }
  const ctogInner = () => `${I("chat")}<span class="num">${openCount()}</span>${ST.unread ? `<span class="se-ndot">${ST.unread} new</span>` : ""}`;
  function toolbarHTML() {
    const b = (act, label, icon, extra = "") => `<button type="button" class="se-tbb" data-act="${act}" ${extra} aria-label="${label}" title="${label}">${icon}</button>`;
    return `<div class="se-tb" role="toolbar" aria-label="Document tools">
      <button type="button" class="se-tbb se-tbc" data-act="contents" aria-label="Contents">${I("toc")}<span>Contents</span></button><span class="se-sep se-tbc"></span>
      ${b("cmd", "Undo", I("undo"), 'data-cmd="undo"')}${b("cmd", "Redo", I("redo"), 'data-cmd="redo"')}<span class="se-sep"></span>
      <select class="se-style" data-chg="style" aria-label="Text style"><option value="p">Normal text</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option></select><span class="se-sep"></span>
      ${b("cmd", "Bold", "<b>B</b>", 'data-cmd="bold"')}${b("cmd", "Italic", "<i>I</i>", 'data-cmd="italic"')}${b("cmd", "Underline", "<u>U</u>", 'data-cmd="underline"')}${b("link", "Insert link", I("link"))}<span class="se-sep"></span>
      ${b("cmd", "Bulleted list", I("ul"), 'data-cmd="insertUnorderedList"')}${b("cmd", "Numbered list", I("ol"), 'data-cmd="insertOrderedList"')}${b("table", "Insert table", I("table"))}<span class="se-sep"></span>
      <button type="button" class="se-tbb se-tbt" data-act="insert" aria-haspopup="menu" aria-expanded="false">Insert${I("down")}</button>
      ${b("comment", "Add comment", I("cplus"))}
      <span class="se-tbsp"></span><span class="se-modechip" id="se-modechip">${modeChip()}</span>
      <button type="button" class="se-tbb se-asst${ST.side === "assist" ? " on" : ""}" id="se-atog" data-act="side" data-side="assist" aria-pressed="${ST.side === "assist"}">${I("sparkle")}<span>Assist</span></button>
    </div>`;
  }

  // ——— Outline ———
  function dots(match) {
    const ps = OTHERS.filter((p) => match(ST.pos[p.name].at));
    return ps.length ? `<span class="se-dots" aria-hidden="true">${ps.map((p) => `<span class="se-dot" style="--c:${p.color}" title="${esc(p.name)}"></span>`).join("")}</span>` : "";
  }
  function outlineHTML() {
    const N = nums(), rows = [];
    for (const s of ST.secs) {
      if (ST.gaps && !secGap(s)) continue;
      const live = !ST.detached.has(s.id) && (s.kind === "data" || s.kind === "diagram" || s.kind === "controls");
      const is11 = s.id === "s11", p = compl(s);
      rows.push(`<li class="se-oli"><button type="button" class="se-o" data-act="goto" data-at="${s.id}"><span class="ak-donut se-ring" style="--p:${p}" aria-hidden="true"></span><span class="se-o-n">${esc(N[s.id])}</span><span class="se-o-t">${esc(s.t)}</span>${live ? `<span class="se-o-live" title="${s.kind === "diagram" ? "Drawn from records" : "Live data"}">${I(s.kind === "diagram" ? "diagram" : "live")}</span>` : ""}${dots((at) => at === s.id || (is11 && !ST.open11 && !!famOf(at)))}<span class="se-sr">, ${p}% complete</span></button>${is11 ? `<button type="button" class="se-o-x${ST.open11 ? " on" : ""}" data-act="t11" aria-expanded="${ST.open11}" aria-label="${ST.open11 ? "Collapse" : "Expand"} the control families">${I("down")}</button>` : ""}</li>`);
      if (is11 && ST.open11) rows.push(`<li><ul class="se-ofs">${D.families.map((f, i) => [f, i]).filter(([f]) => !ST.gaps || famGap(f.f)).map(([f, i]) => { const ph = famPh(f.f); return `<li><button type="button" class="se-o se-of" data-act="goto" data-at="fam:${f.f}"><span class="ak-donut se-ring" style="--p:${Math.round(((f.n - ph) / f.n) * 100)}" aria-hidden="true"></span><span class="se-o-n">${N.s11}.${i + 1}</span><span class="se-o-t">${esc(famName(f))}</span>${dots((at) => famOf(at) === f.f)}${ph ? `<span class="se-phb" title="${ph} placeholder narratives"><span class="se-sr">, </span>${ph}<span class="se-sr"> placeholder narratives</span></span>` : ""}<span class="se-o-c num"><span class="se-sr">, </span>${f.n}<span class="se-sr"> controls</span></span></button></li>`; }).join("")}</ul></li>`);
    }
    return `<div class="se-out-h"><b>Contents</b><button type="button" class="se-tog" data-act="gaps" aria-pressed="${ST.gaps}">Gaps only</button><button type="button" class="se-ib se-out-x" data-act="contents" aria-label="Close contents">${I("x")}</button></div>
      <ul class="se-ol">${rows.join("")}</ul>
      <div class="se-out-f"><button type="button" class="btn sm" data-modal="se-add">${I("plus")}Add section</button></div>`;
  }

  // ——— The page ———
  const tbl = (cols, rows, cls = "") => `<div class="sd-tablebox"><table class="sd-table ${cls}"><thead><tr>${cols.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.join("")}</tr>`).join("")}</tbody></table></div>`;
  const td = (x, cls) => `<td${cls ? ` class="${cls}"` : ""}>${x}</td>`;
  function liveHead(at, src, open, opts = {}) {
    return `<div class="sd-live-h"><span class="sd-live-tag">${I("live")}Live</span><span>${esc(src)}</span><span class="se-sync" data-sync="${esc(at)}">· ${esc(opts.synced || "synced 2 min ago")}</span><span class="se-lacts">${open ? `<button type="button" class="se-lb" data-go="${open}">${I("open")}${esc(opts.openLabel || "Open record")}</button>` : ""}<button type="button" class="se-lb" data-modal="se-rechist" data-id="${esc(at)}">${I("history")}History</button>${opts.detach === false ? "" : `<button type="button" class="se-lb" data-modal="se-detach" data-id="${esc(at)}">${I("unlink")}Detach</button>`}</span></div>`;
  }
  function wrapLive(at, src, open, inner, opts = {}) {
    if (ST.detached.has(at)) {
      const key = at + ":det", html = ST.secHTML[key] != null ? ST.secHTML[key] : inner;
      return `<div class="se-det"><div class="sd-live-h"><span class="se-dtag">${I("unlink")}Detached</span><span>from ${esc(src)} · kept as text you can edit</span><span class="se-lacts"><button type="button" class="se-lb" data-act="reattach" data-at="${esc(at)}">${I("live")}Reattach</button></span></div><div class="se-auth" data-ed="sec" data-key="${esc(key)}" contenteditable="${canEditStr("sec")}" role="textbox" aria-multiline="true" aria-label="Detached ${esc(src)}">${html}</div></div>`;
    }
    return `<div class="sd-live" data-live="${esc(at)}">${liveHead(at, src, open, opts)}${inner}</div>`;
  }
  const subName = (code) => ((D.elements.find((e) => e[0] === code) || [])[1] || "").replace(/ Subsystem$/, "");
  const rolesTable = () => tbl(["Role", "Name"], D.roles.map(([, l, n]) => [td(esc(l)), td(esc(n))]));
  const icTable = () => tbl(["Connects to", "Kind", "Via", "Data", "Agreement"], D.interconnections.map((x) => [td(`${esc(x.to)}${x.ex ? ' <span class="ex">Example</span>' : ""}`), td(esc(x.kind)), td(esc(x.via)), td(esc(x.data)), td(esc(x.agreement))]));
  const ppsmTable = () => tbl(["Element", "Protocol", "Port", "Service", "Direction"], D.ppsm.map((r) => r.map((x, i) => td(esc(x), i === 2 ? "se-mono se-nw" : ""))));
  function invTable(copy) {
    return tbl(["Element", "Code", "LRU", "Type", "Subsystem", "Description"], invEls().map((e) => [td(esc(e[1])), td(esc(e[0]), "se-mono se-nw"), td(esc(e[4]), "se-mono se-nw"), td(e[2] === "software" ? "Software" : "Hardware"), td(esc(subName(e[3]))),
      copy ? td(esc(ST.inv[e[4]] || "")) : `<td class="se-desc" id="se-inv-${e[4]}" data-ed="inv" data-lru="${e[4]}" contenteditable="${canEditStr("inv", e[4])}" data-ph="Not described" aria-label="${esc(e[1])} description">${invDescHTML(e[4])}</td>`]), "se-invt");
  }
  function invDescHTML(lru) {
    if (lru === "LRU-020" && ST.pos["Marcus Ryde"].at === "s8") return `${esc(ST.inv[lru] || SIMTEXT.slice(0, ST.typed))}<span class="sd-cur" style="--c:${D.person("Marcus Ryde").color}" data-name="Marcus Ryde" data-ui contenteditable="false"></span>`;
    return esc(ST.inv[lru] || "");
  }
  function baselineInner() {
    const cnt = (k, v) => D.controls.filter((c) => c[k] === v).length, total = D.controls.length;
    const imp = [["implemented", "var(--ok)"], ["partial", "var(--warn)"], ["planned", "var(--line-strong)"], ["not_implemented", "var(--bad)"]].map(([k, col]) => [D.IMPL[k][0], cnt("s", k), col]);
    const st = [["satisfied", "var(--ok)"], ["partially_satisfied", "var(--warn)"], ["other_than_satisfied", "var(--bad)"], ["not_assessed", "var(--info)"], ["no_evidence", "var(--line-strong)"], ["no_requirement", "var(--ink-4)"]].map(([k, col]) => [D.STATUS[k][0], cnt("cs", k), col]);
    const bar = (title, parts) => `<div class="se-bar"><b>${title}</b><div class="stack" role="img" aria-label="${esc(title + ": " + parts.map(([l, n]) => `${n} ${l.toLowerCase()}`).join(", "))}">${parts.map(([l, n, col]) => `<i style="width:${((n / total) * 100).toFixed(2)}%;background:${col}" title="${esc(l)}: ${n}"></i>`).join("")}</div><div class="legend">${parts.map(([l, n, col]) => `<span style="--c:${col}">${esc(l)} <b class="num">${n}</b></span>`).join("")}</div></div>`;
    return `<p class="sd-p"><b>${esc(D.system.catalog)}</b> · ${esc(D.system.baseline)} · <b class="num">${total}</b> controls</p>${bar("Implementation status", imp)}${bar("Control status", st)}`;
  }
  const figCaps = (id) => `<span class="se-capb"><button type="button" class="se-lb" data-act="regen" data-id="${id}">${I("live")}Regenerate</button><button type="button" class="se-lb" data-act="layout">${I("diagram")}Edit layout</button><button type="button" class="se-lb" data-modal="se-upload" data-id="Replace ${id === "se-fig1" ? "Figure 1" : "Figure 2"}">${I("image")}Replace with an image</button></span>`;

  const BODY = {
    s1: () => { const y = D.system, rows = [["System name", y.name], ["System code", y.code], ["Program", `${D.program.code} · ${D.program.name}`], ["System type", y.type], ["Lifecycle", y.lifecycle], ["Authorization", y.authorization], ["Catalog", y.catalog], ["Control baseline", y.baseline], ["Description", y.description]];
      return wrapLive("s1", "System record " + y.code, "composition", `<div class="sd-tablebox"><table class="sd-table se-facts"><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div>`); },
    s2: () => {
      const [c, i, a] = D.system.cia, c7 = ST.comments.find((x) => x.id === "c7"), g = pendAt("s2").find((x) => x.ai);
      const mark = c7 ? `<span class="sd-mark${c7.resolved ? " resolved" : ""}${ST.active === "c7" ? " on" : ""}" data-cid="c7">Categorization rationale</span>` : "Categorization rationale";
      return wrapLive("s2", "System record " + D.system.code, "composition", `${tbl(["Security objective", "Impact level", "Basis"], [["Confidentiality", c], ["Integrity", i], ["Availability", a]].map(([k, v]) => [td(esc(k)), td(`<b>${esc(v)}</b>`), td("CNSSI 1253")]))}
        <h3 class="sd-h3">${mark}</h3>
        <p class="sd-p se-rat" data-ed="rat" contenteditable="${canEditStr("rat")}" role="textbox" aria-label="Categorization rationale" data-ph="Not recorded. Say why confidentiality, integrity and availability are High, High and Moderate; eMASS asks for it.">${esc(rationale())}</p>
        ${g ? `<p class="sd-p se-insp"><span class="sd-ai" data-sid="${g.id}">${esc(g.text)}</span></p>${barHTML(g)}` : ""}
        <div class="se-ctl-f" data-ui><span class="se-saving" hidden>${I("pen")}Edits save to ${esc(D.system.code)}'s categorization</span></div>`);
    },
    s3: () => wrapLive("s3", "Program roles", "people", rolesTable()),
    s5: (s) => wrapLive("s5", "System tree, 27 elements", "composition", `<figure class="sd-fig se-fig" id="se-fig1">${boundarySVG()}</figure><p class="sd-cap se-cap"><span>Figure 1. Authorization boundary. Drawn from the system tree: 6 subsystems, 20 elements</span>${figCaps("se-fig1")}</p>`) + authored(s),
    s6: () => wrapLive("s6", "System tree and interconnections", "composition", `<figure class="sd-fig se-fig" id="se-fig2">${flowsSVG()}</figure><p class="sd-cap se-cap"><span>Figure 2. Data flows between the subsystems: 1 mission plans in, 2 telemetry out, 3 security events to the Security Log Collector.</span>${figCaps("se-fig2")}</p>`),
    s7: () => wrapLive("s7", "Interconnection records", "composition", icTable()),
    s8: () => wrapLive("s8", "System tree, 20 elements", "inventory", invTable(false) + `<p class="se-small"><span class="ex">Example</span> The descriptions of LRU-013 and LRU-017 are examples.</p>`, { synced: ST.invSynced }),
    s9: () => wrapLive("s9", "PPSM records", "inventory", ppsmTable()),
    s10: () => wrapLive("s10", D.system.baseline, "baseline", baselineInner() + `<p><button type="button" class="btn sm" data-go="baseline">${I("open")}Open baseline</button></p>`),
    s11: () => `<p class="sd-p se-lede">Each implementation below is a live block: it reads its control's record, and an edit saves to that record.</p>` + D.families.map((f, i) => famHTML(f, i)).join(""),
    a1: () => wrapLive("a1", "Common control providers", "common-controls", tbl(["Control", "Title", "Provider", "Inheritance"], INHERIT.map(([code, k]) => [td(codeBtn(code)), td(esc((D.ctl(code) || {}).t || "")), td("Corporate identity provider (PRG-1013)"), td(k)]))),
    a2: () => wrapLive("a2", "POA&M", "poam", tbl(["POA&M item", "Status", "Answers"], PA.data.POAM.map(([t, s]) => [td(esc(t)), td(h.pill(s === "Completed" ? "ok" : "warn", s)), td(esc(t.replace("Remediate ", "")), "se-mono")]))),
    a3: () => {
      const rows = [...D.session.map((e) => ({ t: e.time, who: [e.who], what: e.what + (e.at ? " · " + where(e.at) : ""), now: 1 })), ...D.versions.map((v) => ({ t: v.at, who: v.who, what: v.name || v.changes.map(([at, w]) => `${where(at)}: ${w.toLowerCase()}`).join("; ") || "No changes", ex: v.ex }))];
      return wrapLive("a3", "Version history", "ssp-history", tbl(["When", "Who", "What"], rows.map((r) => [td(esc(U.when(r.t)), "se-nw"), td(r.who.map(esc).join(", ")), td(`${esc(r.what)}${r.ex ? ' <span class="ex">Example</span>' : ""}${r.now ? ' <span class="se-this">This session</span>' : ""}`)])), { openLabel: "Open version history", detach: false });
    },
    live: (s) => { const L = { inv: ["System tree, 20 elements", invTable(true), "inventory"], roles: ["Program roles", rolesTable(), "people"], ic: ["Interconnection records", icTable(), "composition"], ppsm: ["PPSM records", ppsmTable(), "inventory"], base: [D.system.baseline, baselineInner(), "baseline"] }[s.live]; return wrapLive(s.id, L[0], L[2], L[1]); },
  };
  function secHead(s, N) {
    const chips = [];
    if (s.kind === "custom") chips.push(AK.chip("Custom section"));
    if (s.template) chips.push(AK.chip("From a template"));
    if (s.ex) chips.push('<span class="ex">Example</span>');
    return `<h2 class="sd-h1 se-h" id="se-h-${s.id}"><span class="sd-num">${esc(N[s.id])}</span><span>${esc(s.t)}</span>${chips.join("")}</h2>`;
  }
  function secHTML(s, N = nums()) {
    const f = BODY[s.id] || (s.live ? BODY.live : authored);
    return `<section class="se-sec" id="se-s-${s.id}" data-at="${s.id}" aria-labelledby="se-h-${s.id}">${secHead(s, N)}${f(s)}</section>`;
  }
  function authored(s) {
    const html = ST.secHTML[s.id] != null ? ST.secHTML[s.id] : (s.text || []).map((p) => `<p>${markText(p, s.id)}</p>`).join("");
    const empty = s.kind === "custom" && !secText(s.id);
    return `<div class="se-auth" data-ed="sec" data-key="${s.id}" contenteditable="${canEditStr("sec")}" role="textbox" aria-multiline="true" aria-label="${esc(s.t)}" data-ph="Start writing, or draft this section with Assist.">${html}</div>${pendAt(s.id).filter((g) => g.ai).map((g) => `<p class="sd-p se-insp"><span class="sd-ai" data-sid="${g.id}">${esc(g.text)}</span></p>${barHTML(g)}`).join("")}${pendAt(s.id).filter((g) => g.kind === "sdom").map(barHTML).join("")}${empty && !pendAt(s.id).some((g) => g.ai) ? `<p class="se-small"><button type="button" class="se-lb ai" data-act="draftwith" data-at="${s.id}">${I("sparkle")}Draft this section with Assist</button></p>` : ""}`;
  }
  function famHTML(f, i) {
    const N11 = nums().s11, on = ST.rendered.has(f.f);
    return `<div class="se-fam" id="se-f-${f.f}" data-fam="${f.f}"${on ? "" : ' data-lazy="1"'}><h3 class="sd-h2 se-fh" id="se-h-${f.f}"><span class="sd-num">${N11}.${i + 1}</span><span>${esc(famName(f))} (${f.f})</span><span class="se-fct num">· ${f.n}</span></h3>${on ? D.ofFamily(f.f).map(ctlHTML).join("") : `<div class="se-skel" style="height:${f.n * 210}px" role="status" aria-label="${f.n} control implementations load as you scroll"></div>`}</div>`;
  }
  function ctlHTML(c) {
    const at = c.c, imp = D.IMPL[c.s], st = D.STATUS[c.cs], pend = pendAt(at);
    const full = pend.find((g) => g.kind === "replace" && !g.from), mine = pend.find((g) => g.kind === "edit"), part = pend.filter((g) => g.from);
    const chips = [];
    if (c.ph && !full) chips.push(AK.chip("Placeholder text", { tone: "warn" }));
    if (D.changed.includes(at)) chips.push(`<button type="button" class="se-chipb" data-act="changed" data-at="${esc(at)}" aria-haspopup="dialog" aria-expanded="false">${I("history")}Changed since revision 2</button>`);
    if (SRC_CHANGED.includes(at) && !ST.reviewed.has(at)) chips.push(`<button type="button" class="se-chipb warn" data-act="source" data-at="${esc(at)}" aria-haspopup="dialog" aria-expanded="false">${I("flag")}Source changed</button>`);
    if (at === "AC-2(3)" && !ST.paramsSet) chips.push(`<button type="button" class="se-chipb warn" data-modal="se-params" data-id="AC-2(3)">${I("flag")}2 values the baseline doesn't set</button>`);
    const lock = full ? "Accept or reject the AI draft to edit this narrative." : mine && ST.mode !== "suggest" ? "Accept or reject your suggestion to edit this narrative directly." : part.length && ST.mode === "suggest" ? `Resolve ${part[0].by}'s suggestion before you suggest another.` : "";
    const editable = ST.mode !== "view" && !lock;
    return `<div class="sd-live se-ctl" id="se-c-${at.replace(/[()]/g, "-")}" data-at="${esc(at)}">
      <div class="se-ctl-h"><h4 class="se-ctl-t"><span class="se-code">${esc(at)}</span><span>${esc(c.t)}</span></h4><span class="se-ctl-a" data-ui><button type="button" class="se-ib sm" data-go="controls" aria-label="Open ${esc(at)}'s record" title="Open record">${I("open")}</button><button type="button" class="se-ib sm" data-modal="se-rechist" data-id="${esc(at)}" aria-label="${esc(at)} record history" title="Record history">${I("history")}</button></span></div>
      <div class="se-ctl-m">${h.pill(imp[1], imp[0])}${h.pill(st[1], st[0])}<span class="se-meta num">Objectives ${c.oa} of ${c.ob} assessed</span><span class="se-meta num">${plural(c.r, "requirement")} · ${c.e} with evidence</span>${chips.join("")}</div>
      <div class="se-n" data-ed="ctl" contenteditable="${editable}" spellcheck="false" role="textbox" aria-multiline="true" aria-label="${esc(at)} implementation narrative">${narrHTML(c, pend, full, mine)}</div>
      <div class="se-ctl-f" data-ui>${lock ? `<span class="se-lock">${I("lock")}${esc(lock)}</span>` : `<span class="se-saving" hidden>${I("pen")}Edits save to ${esc(at)}'s implementation</span>`}${c.ph && !full && !mine ? `<button type="button" class="se-lb ai" data-act="draftwith" data-at="${esc(at)}">${I("sparkle")}Draft with Assist</button>` : ""}</div>
      ${pend.map(barHTML).join("")}</div>`;
  }
  function narrHTML(c, pend, full, mine) {
    if (mine && mine.base === c.n) return U.diff(mine.base, mine.text, ME).replace(/<(ins|del) class="sd-(ins|del)"/g, `<$1 data-mine="1" data-sid="${mine.id}" class="sd-$2"`);
    const t = c.n, R = [], P = [];
    for (const cm of ST.comments) if (cm.at === c.c && !cm.draft) { const i = t.indexOf(cm.quote); if (i >= 0) R.push(markRange(cm, i)); }
    if (c.c === "AC-2(3)") for (const w of ["72 hours", "90 days"]) { let i = t.indexOf(w); while (i >= 0) { R.push({ s: i, e: i + w.length, pri: 2, open: `<span class="se-val${ST.paramsSet ? " ok" : ""}" data-tip="${ST.paramsSet ? `Set by WS-X90's program tailoring: ${w}` : "WS-X90's baseline doesn't set this value: the program tailoring records no parameter for AC-2(3), so the assessor can't test against it."}">`, close: "</span>" }); i = t.indexOf(w, i + 1); } }
    for (const g of pend) if (g.from && !full) { const i = t.indexOf(g.from); if (i >= 0) { R.push({ s: i, e: i + g.from.length, pri: 3, open: `<del class="sd-del" ${U.c(g.by)} data-sid="${g.id}">`, close: "</del>" }); P.push({ at: i + g.from.length, html: `<ins class="sd-ins" ${U.c(g.by)} data-sid="${g.id}" contenteditable="false">${esc(g.text)}</ins>` }); } }
    if (c.ph) R.push({ s: 0, e: t.length, pri: 0, open: '<span class="sd-ph">', close: "</span>" });
    let html = annotate(t, R, P);
    const priya = ST.pos["Priya Raghavan"].at === c.c ? `<span class="sd-cur" style="--c:${D.person("Priya Raghavan").color}" data-name="Priya Raghavan${full ? " · reviewing the AI draft" : ""}" data-ui contenteditable="false"></span>` : "";
    return full ? `<del class="sd-del" data-sid="${full.id}">${html}</del> ${priya}<span class="sd-ai" data-sid="${full.id}">${esc(full.text)}</span>` : priya + html;
  }
  const srcChip = ([k, l]) => `<span class="se-src" title="${esc(k + ": " + l)}"><span class="k">${esc(k)}</span>${esc(trunc(l, 44))}</span>`;
  const codeBtn = (code) => `<button type="button" class="ak-code se-codeb" data-act="jump" data-at="${esc(code)}">${esc(code)}</button>`;
  function barHTML(g) {
    const acts = `<button type="button" class="btn sm" data-act="accept" data-id="${g.id}">${I("check")}Accept</button><button type="button" class="btn sm" data-act="reject" data-id="${g.id}">${I("x")}Reject</button>`;
    if (!g.ai) return `<div class="se-sbar" data-ui>${U.av(g.by, 20)}<span class="se-sbar-t"><b>${g.by === ME ? "Your suggestion" : esc(g.by)}</b>${g.by === ME ? " · changes nothing until accepted" : " suggested an edit"}</span>${acts}</div>`;
    const src = g.sources || [];
    return `<div class="se-aib" data-ui><div class="se-aib-h"><span class="se-aib-l">${I("sparkle")}AI draft · needs review</span>${g.ex ? '<span class="ex">Example</span>' : ""}<span class="se-aib-w">Asked by ${esc(g.for || ME)}</span></div>${src.length ? `<div class="se-srcs">${src.slice(0, 3).map(srcChip).join("")}${src.length > 3 ? `<span class="se-src more">+${src.length - 3} more</span>` : ""}</div>` : ""}<div class="se-aib-b">${acts}${g.card ? `<button type="button" class="se-lb" data-act="card" data-id="${g.id}">Why and sources</button>` : ""}</div></div>`;
  }
  function pageHTML() { const N = nums(); return `<header class="se-cover"><h1 class="sd-title" id="se-doctitle">${esc(ST.title)}</h1><div class="sd-sub">${esc(D.system.code)} · Revision ${D.doc.revision} · ${esc(D.doc.state)} · ${esc(D.system.catalog)} · ${esc(D.system.baseline)}</div></header>` + ST.secs.map((s) => secHTML(s, N)).join(""); }

  // ——— Diagrams, drawn from the system tree; colours are tokens so they hold in dark mode ———
  function boundarySVG() {
    const L = { "CN-109001": [0, 0], "CN-109003": [1, 0], "CN-109002": [0, 1], "CN-109005": [1, 1], "CN-109004": [0, 2], "CN-109006": [1, 2] };
    const W = 700, BX = 8, BY = 8, PAD = 14, TOP = 30, CW = 222, GAP = 12, RH = 19, HEAD = 26;
    const kids = (code) => D.elements.filter((e) => e[3] === code);
    const rowH = [0, 1, 2].map((r) => Math.max(...Object.entries(L).filter(([, p]) => p[1] === r).map(([c]) => HEAD + kids(c).length * RH + 8)));
    const rowY = []; let y = BY + TOP; for (let r = 0; r < 3; r++) { rowY[r] = y; y += rowH[r] + GAP; }
    const BW = PAD * 2 + CW * 2 + GAP, BH = y - GAP + PAD - BY, EX = BX + BW + 42, EW = W - EX - 4, H = BY + BH + 8;
    let s = `<svg class="se-svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="se-f1t"><title id="se-f1t">Authorization boundary of SYS-WSX90: 6 subsystems holding 20 elements, and 4 connections to parties outside it</title>`;
    s += `<rect class="b" x="${BX}" y="${BY}" width="${BW}" height="${BH}" rx="10"/><text class="bl" x="${BX + PAD}" y="${BY + 20}">SYS-WSX90 · authorization boundary</text>`;
    const row = {};
    for (const [code, [col, r]] of Object.entries(L)) {
      const x = BX + PAD + col * (CW + GAP), yy = rowY[r], ks = kids(code), hh = HEAD + ks.length * RH + 8;
      s += `<rect class="sub" x="${x}" y="${yy}" width="${CW}" height="${hh}" rx="6"/><text class="st" x="${x + 10}" y="${yy + 17}">${esc(subName(code))}</text>`;
      ks.forEach((k, i) => { const ry = yy + HEAD + i * RH + 12; s += `<text class="el" x="${x + 10}" y="${ry}">${esc(k[1])}</text><text class="lru" x="${x + CW - 9}" y="${ry}" text-anchor="end">${esc(k[4])}</text>`; row[k[1]] = [x + CW, ry - 3.5]; });
    }
    const ex = D.interconnections.map((ic) => ({ ic, y: (row[ic.via] || [0, 0])[1] })).sort((a, b) => a.y - b.y);
    let last = -1e9; ex.forEach((e) => { e.by = Math.max(e.y - 18, last + 8); last = e.by + 36; });
    ex.forEach((e, i) => {
      const [x2, ry] = row[e.ic.via] || [BX + BW, BY], lane = BX + BW + 10 + i * 8, inh = /Inherited/.test(e.ic.kind), nm = e.ic.to.replace(/\s*\(PRG-\d+\)/, "");
      s += `<path class="ln${inh ? " dash" : ""}" d="M${x2} ${ry} H${lane} V${e.by + 18} H${EX}"/><circle class="dt" cx="${x2}" cy="${ry}" r="2.2"/>`;
      s += `<rect class="ext${inh ? " dash" : ""}" x="${EX}" y="${e.by}" width="${EW}" height="36" rx="6"/><text class="et" x="${EX + 8}" y="${e.by + 15}">${esc(nm)}</text><text class="ek" x="${EX + 8}" y="${e.by + 28}">${esc(inh ? "Inherited service · PRG-1013" : "Interconnection")}</text>`;
    });
    return s + "</svg>";
  }
  function flowsSVG() {
    const W = 700, H = 286, box = (x, y, w, t, sub, cls = "sub") => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="44" rx="6"/><text class="st" x="${x + 10}" y="${y + 19}">${esc(t)}</text><text class="ek" x="${x + 10}" y="${y + 33}">${esc(sub)}</text>`;
    const num = (x, y, n) => `<circle class="nb" cx="${x}" cy="${y}" r="8"/><text class="nt" x="${x}" y="${y + 3.5}" text-anchor="middle">${n}</text>`;
    let s = `<svg class="se-svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="se-f2t"><title id="se-f2t">Data flows: mission plans enter through the Protected Network Gateway to the Mission Computer; telemetry leaves over the Tactical Data Radio; every element sends security events to the Security Log Collector</title>`;
    s += `<defs><marker id="se-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ah" d="M0 0 10 5 0 10z"/></marker></defs>`;
    s += `<rect class="b" x="150" y="8" width="404" height="256" rx="10"/><text class="bl" x="164" y="27">SYS-WSX90</text>`;
    s += box(6, 40, 124, "Mission planning", "network", "ext") + box(6, 190, 124, "Tactical data link", "Outside the boundary", "ext");
    s += box(168, 40, 168, "Protected Network Gateway", "Communications · LRU-007") + box(168, 115, 168, "Platform Management", "4 elements") + box(168, 190, 168, "Tactical Data Radio", "Communications · LRU-008");
    s += box(372, 40, 168, "Navigation & Timing", "3 elements") + box(372, 115, 168, "Mission Computer", "Mission Computing · LRU-001") + box(372, 190, 168, "Payload Interface", "3 elements");
    s += box(578, 104, 116, "Security Log", "Collector · LRU-018");
    s += `<path class="ln" d="M130 62 H166" marker-end="url(#se-arr)"/><path class="ln" d="M336 56 H352 V130 H370" marker-end="url(#se-arr)"/><path class="ln" d="M372 148 H360 V212 H338" marker-end="url(#se-arr)"/><path class="ln" d="M168 212 H132" marker-end="url(#se-arr)"/>`;
    s += `<path class="ln dash" d="M554 126 H576" marker-end="url(#se-arr)"/>`;
    s += num(148, 52, 1) + num(150, 224, 2) + num(565, 114, 3);
    return s + "</svg>";
  }

  // ——— Comment margin ———
  function cardList() {
    const out = [];
    for (const c of ST.comments) { if (c.audience !== ST.ctab) continue; if (ST.cfilter === "open" ? c.resolved : !c.resolved || c.draft) continue; out.push({ kind: "c", id: c.id, o: c }); }
    if (ST.ctab === "internal") for (const g of ST.sugg) { if (!g.card) continue; if (ST.cfilter === "open" ? g.done : !g.done || g.done === "withdrawn") continue; out.push({ kind: "g", id: g.id, o: g }); }
    return out.sort((a, b) => docOrder(a.o.at) - docOrder(b.o.at));
  }
  const tabCount = (aud) => ST.comments.filter((c) => c.audience === aud && !c.resolved && !c.draft).length + (aud === "internal" ? ST.sugg.filter((g) => g.card && !g.done).length : 0);
  function marginHTML() {
    const items = cardList();
    return `<div class="se-mh"><div class="se-mtabs" role="tablist" aria-label="Threads">${[["internal", "Internal"], ["assessor", "Assessor"]].map(([k, l]) => `<button type="button" role="tab" aria-selected="${ST.ctab === k}" class="se-mtab${ST.ctab === k ? " on" : ""}" data-act="ctab" data-k="${k}">${l}<span class="ct num">${tabCount(k)}</span>${k === "assessor" && ST.unread ? `<span class="se-ndot">${ST.unread} new</span>` : ""}</button>`).join("")}<span class="se-tbsp"></span><button type="button" class="se-ib" data-act="side" data-side="" aria-label="Close comments">${I("x")}</button></div>
      <div class="se-mf"><div class="se-seg" role="group" aria-label="Show threads">${[["open", "Open"], ["resolved", "Resolved"]].map(([k, l]) => `<button type="button" aria-pressed="${ST.cfilter === k}" data-act="cfilter" data-k="${k}">${l}</button>`).join("")}</div>${items.length ? `<button type="button" class="se-lb" data-act="nextthread">Next thread${I("down")}</button>` : ""}</div>
      ${ST.ctab === "assessor" ? `<div class="ak-ext">${AK.i("eye")}The assessor can read this.</div>` : ""}</div>
      <div class="se-cards" id="se-cards">${items.length ? items.map(cardHTML).join("") : `<p class="se-none">${ST.cfilter === "open" ? "No open threads here." : "No resolved threads here."}</p>`}</div>`;
  }
  function mentions(t) { let s = esc(t); for (const [n] of ALL) s = s.split("@" + esc(n)).join(`<span class="ak-at">@${esc(n)}</span>`); return s; }
  const composer = (id, ph, label) => `<div class="se-cmp"><textarea class="se-ta" data-cmp="${id}" rows="2" placeholder="${esc(ph)}" aria-label="${esc(label)}"></textarea><div class="se-atl" role="listbox" aria-label="People" hidden></div></div><div class="se-assign" hidden></div>`;
  function cardHTML(it) {
    const on = ST.active === it.id ? " on" : "";
    if (it.kind === "g") return suggCard(it.o, on);
    const c = it.o;
    if (c.draft) return `<article class="se-card se-new-c${on}" data-card="${c.id}" data-at="${esc(c.at)}" aria-label="New comment on ${esc(where(c.at))}"><div class="se-ch">${U.av(ME, 28)}<div class="se-cw"><b>${ME}</b><span class="se-role">${ME_ROLE}</span></div></div><blockquote class="se-q1">${esc(trunc(c.quote, 90))}</blockquote>${composer(c.id, "Comment or add others with @", "New comment")}<div class="se-rb-b"><button type="button" class="btn sm" data-act="cancelnew" data-id="${c.id}">Cancel</button><button type="button" class="btn sm se-post" data-act="post" data-id="${c.id}">Comment</button></div></article>`;
    const [who, role, iso, text] = c.thread[0], p = D.person(who);
    return `<article class="se-card${on}${c.resolved ? " done" : ""}${c.fresh ? " se-fresh" : ""}" data-card="${c.id}" data-at="${esc(c.at)}" tabindex="0" aria-label="Thread by ${esc(who)} on ${esc(where(c.at))}">
      <div class="se-ch">${U.av(who, 28)}<div class="se-cw"><b>${esc(who)}</b><span class="${p.assessor ? "ak-role" : "se-role"}">${esc(role)}</span></div>${c.resolved ? `<button type="button" class="se-ib" data-act="reopen" data-id="${c.id}" aria-label="Reopen thread" title="Reopen">${I("history")}</button>` : `<button type="button" class="se-ib" data-act="resolve" data-id="${c.id}" aria-label="Resolve thread" title="Resolve">${I("check")}</button>`}</div>
      <div class="se-ct"><span>${esc(U.when(iso))}</span><span>· ${esc(where(c.at))}</span>${c.fresh ? '<span class="se-ndot">New reply</span>' : ""}</div>
      ${c.task ? `<div class="se-task">${I("task")}<span>Assigned to ${esc(c.task.to)}</span>${AK.due(c.task.due)}</div>` : ""}
      <div class="se-cx">${mentions(text)}</div>
      ${c.thread.slice(1).map(([w, r, t2, x]) => `<div class="se-rep">${U.av(w, 22)}<div><div class="se-rep-h"><b>${esc(w)}</b><span>${esc(U.when(t2))}</span></div><div class="se-cx">${mentions(x)}</div></div></div>`).join("")}
      ${c.resolved ? `<div class="se-res">${I("check")}Resolved</div>` : on ? `<div class="se-rb">${composer(c.id, "Reply or add others with @", "Reply to " + who)}<div class="se-rb-b"><button type="button" class="btn sm" data-act="deact">Cancel</button><button type="button" class="btn sm se-post" data-act="reply" data-id="${c.id}">Reply</button></div></div>` : ""}
    </article>`;
  }
  function changeList(g) {
    let pairs;
    if (g.kind === "edit") { const box = document.createElement("div"); box.innerHTML = U.diff(g.base, g.text); pairs = [...box.querySelectorAll("ins, del")].map((n) => [n.tagName === "INS" ? "Add" : "Delete", n.textContent.trim()]); }
    else pairs = g.summary || [];
    return pairs.filter((p) => p[1]).slice(0, 3).map(([k, t]) => `<div>${k} <span class="${k === "Add" ? "sd-ins" : "sd-del"}" ${U.c(g.by)}>${esc(trunc(t, 70))}</span></div>`).join("") + (pairs.length > 3 ? `<div class="se-small">and ${pairs.length - 3} more changes</div>` : "");
  }
  function suggCard(g, on) {
    const done = g.done ? `<div class="se-res">${I(g.done === "accepted" ? "check" : "x")}${{ accepted: "Accepted", rejected: "Rejected", replaced: "Replaced by a newer draft" }[g.done] || "Closed"}${g.doneBy ? " by " + esc(g.doneBy) : ""}</div>` : `<div class="se-gb"><button type="button" class="btn sm" data-act="accept" data-id="${g.id}">${I("check")}Accept</button><button type="button" class="btn sm" data-act="reject" data-id="${g.id}">${I("x")}Reject</button></div>`;
    if (g.ai) return `<article class="se-card se-g ai${on}${g.done ? " done" : ""}" data-card="${g.id}" data-at="${esc(g.at)}" tabindex="0" aria-label="AI draft for ${esc(where(g.at))}">
      <div class="se-ch"><span class="se-aiav" aria-hidden="true">${I("sparkle")}</span><div class="se-cw"><b>AI draft · needs review</b><span class="se-role">Asked by ${esc(g.for || ME)}</span></div>${g.ex ? '<span class="ex">Example</span>' : ""}</div>
      <div class="se-ct"><span>${esc(where(g.at))}</span><span>· ${g.kind === "insert" ? "Adds text" : "Replaces the narrative"}</span></div>
      <div class="se-cx se-gx">${esc(trunc(g.text, on ? 400 : 150))}</div>
      ${g.why ? `<div class="se-why"><b>Why</b> ${esc(g.why)}</div>` : ""}
      ${(g.sources || []).length ? `<div class="se-srcs"><span class="se-k">Sources</span>${g.sources.map(srcChip).join("")}</div>` : ""}${done}</article>`;
    const what = g.from ? `<div class="se-cx">Replace <del class="sd-del" ${U.c(g.by)}>${esc(g.from)}</del> with <ins class="sd-ins" ${U.c(g.by)}>${esc(g.text)}</ins></div>` : `<div class="se-cx se-chg">${changeList(g)}</div>`;
    return `<article class="se-card se-g${on}${g.done ? " done" : ""}" data-card="${g.id}" data-at="${esc(g.at)}" tabindex="0" aria-label="Suggestion by ${esc(g.by)} on ${esc(where(g.at))}">
      <div class="se-ch">${U.av(g.by, 28)}<div class="se-cw"><b>${esc(g.by)}</b><span class="se-role">${esc(roleOf(g.by))}</span></div></div>
      <div class="se-ct"><span>Suggested edit</span><span>· ${esc(where(g.at))}</span></div>${what}${done}</article>`;
  }
  function anchorEl(id, at) {
    return document.querySelector(`#se-page [data-cid="${id}"]`) || document.querySelector(`#se-page [data-sid="${id}"]`) || inPage(at) || (famOf(at) && document.getElementById("se-f-" + famOf(at))) || document.getElementById("se-s-" + at);
  }
  function layoutMargin() {
    const m = $("#se-margin"), cols = $(".se-cols"); if (!m || !cols) return;
    const cards = $$(".se-card", m), flow = ST.side !== "comments" || NARROW();
    m.classList.toggle("flow", flow);
    if (flow) { cards.forEach((el) => (el.style.top = "")); m.style.minHeight = ""; return; }
    const base = cols.getBoundingClientRect().top, mh = $(".se-mh", m), minTop = (mh ? mh.offsetHeight : 0) + 10;
    const items = cards.map((el) => { const a = anchorEl(el.dataset.card, el.dataset.at); return { el, id: el.dataset.card, want: Math.max(minTop, a ? a.getBoundingClientRect().top - base - 4 : minTop), h: el.offsetHeight }; }).sort((x, y) => x.want - y.want);
    const ai = items.findIndex((x) => x.id === ST.active);
    if (ai >= 0) {
      items[ai].top = items[ai].want;
      for (let i = ai - 1; i >= 0; i--) items[i].top = Math.min(items[i].want, items[i + 1].top - 10 - items[i].h);
      if (items.length && items[0].top < minTop) { let yy = minTop; for (const it of items) { it.top = Math.max(it.top, yy); yy = it.top + it.h + 10; } }
      for (let i = ai + 1; i < items.length; i++) items[i].top = Math.max(items[i].want, items[i - 1].top + items[i - 1].h + 10);
    } else { let yy = minTop; for (const it of items) { it.top = Math.max(it.want, yy); yy = it.top + it.h + 10; } }
    items.forEach((it) => (it.el.style.top = it.top + "px"));
    const lastIt = items[items.length - 1]; m.style.minHeight = lastIt ? lastIt.top + lastIt.h + 40 + "px" : "";
  }
  let layRaf = 0;
  const schedLayout = () => { if (layRaf) return; layRaf = requestAnimationFrame(() => { layRaf = 0; layoutMargin(); }); };
  function captureComposer() { const o = {}; $$("#se-margin textarea[data-cmp]").forEach((ta) => (o[ta.dataset.cmp] = { v: ta.value, f: document.activeElement === ta, s: ta.selectionStart })); return o; }
  function restoreComposer(k) { for (const [id, o] of Object.entries(k)) { const ta = $(`#se-margin textarea[data-cmp="${id}"]`); if (!ta) continue; ta.value = o.v; if (o.f) { ta.focus({ preventScroll: true }); ta.setSelectionRange(o.s, o.s); } if (o.v) updateAssign(ta); } }
  function renderMargin() { const m = $("#se-margin"); if (!m) return; const k = captureComposer(); m.innerHTML = marginHTML(); restoreComposer(k); layoutMargin(); }
  function markActive() { $$("#se-page .sd-mark.on").forEach((e) => e.classList.remove("on")); if (ST.active) $$(`#se-page [data-cid="${ST.active}"]`).forEach((e) => e.classList.add("on")); }
  function activate(id, opts = {}) {
    const c = ST.comments.find((x) => x.id === id), g = ST.sugg.find((x) => x.id === id), o = c || g; if (!o) return;
    ST.active = id;
    if (c) { ST.ctab = c.audience; ST.cfilter = c.resolved ? "resolved" : "open"; if (c.fresh) { c.fresh = 0; ST.unread = Math.max(0, ST.unread - 1); } }
    if (g) { ST.ctab = "internal"; ST.cfilter = g.done ? "resolved" : "open"; }
    if (opts.scroll) { const a = anchorEl(id, o.at); if (!a || a.classList.contains("se-fam") || !$("#se-page").contains(a)) goTo(o.at, { noflash: true }); else scrollToEl(a, "center"); }
    markActive();
    if (ST.side !== "comments") openSide("comments", true); else renderMargin();
    updateHead();
    if (opts.focus !== false) setTimeout(() => { const card = $(`#se-margin .se-card[data-card="${id}"]`); if (card && !card.contains(document.activeElement)) (card.querySelector("textarea") || card).focus({ preventScroll: true }); }, 40);
  }

  // ——— Assist ———
  const CANNED = ["What changed since revision 2?", "Which controls do we inherit from the corporate identity provider?", "Which narratives cite the Mission Computer?"];
  function assistHTML() {
    const nOpen = D.checks.filter((k) => !checkDone(k)).length;
    return `<div class="se-ah"><span class="se-at">${I("sparkle")}Assist</span><span class="se-tbsp"></span><button type="button" class="se-ib" data-act="side" data-side="" aria-label="Close Assist">${I("x")}</button></div>
      <div class="se-atabs" role="tablist" aria-label="Assist">${[["check", "Check", nOpen], ["draft", "Draft"], ["ask", "Ask"]].map(([k, l, n]) => `<button type="button" role="tab" aria-selected="${ST.atab === k}" class="se-atab${ST.atab === k ? " on" : ""}" data-act="atab" data-k="${k}">${l}${n != null ? `<span class="ct num">${n}</span>` : ""}</button>`).join("")}</div>
      <div class="se-ab" id="se-ab">${ST.atab === "check" ? checkTab() : ST.atab === "draft" ? draftTab() : askTab()}</div>
      <p class="se-afoot">${I("sparkle")}AI output is a suggestion: it names its sources and waits for a person to accept it.</p>`;
  }
  function renderAssist() {
    const a = $("#se-assist"); if (!a) return;
    const ab = $("#se-ab"), top = ab ? ab.scrollTop : 0, askv = ($("#se-askin") || {}).value || "";
    a.innerHTML = assistHTML();
    const nb = $("#se-ab"); if (nb) nb.scrollTop = top; const ai = $("#se-askin"); if (ai) ai.value = askv;
  }
  function k1HTML(k, sev) {
    const ph = D.controls.filter((c) => c.ph), ran = ST.sugg.some((g) => g.bulk), drafts = ran ? bulkPending("all") : [], toDraft = ph.filter((c) => !pendAt(c.c).some((g) => g.ai)).length;
    const sat = ph.filter((c) => c.cs === "satisfied").length;
    let foot = "";
    if (ST.q.running) foot = `<div class="se-q" id="se-qprog">${qProg()}</div><button type="button" class="btn sm" data-act="qstop">Stop</button>`;
    else if (drafts.length) foot = `<div class="se-qdone"><b class="num">${plural(drafts.length, "draft")} to review</b><span>Nothing changes until someone accepts a draft.</span></div><div class="btns"><button type="button" class="btn sm" data-act="reviewnext">${I("right")}Review next</button><button type="button" class="btn sm" data-act="accfrom" aria-haspopup="menu" aria-expanded="false">Accept all from…${I("down")}</button></div>${toDraft ? `<button type="button" class="se-lb ai" data-act="check" data-id="k1">${I("sparkle")}Draft the other ${toDraft}</button>` : ""}`;
    else if (ph.length) foot = `<button type="button" class="btn sm" data-act="check" data-id="k1">${I("sparkle")}Draft ${ph.length} narratives</button>`;
    const codes = ph.map((c) => c.c), open = ST.codesOpen.has("k1"), shown = open ? codes : codes.slice(0, 8);
    return `<div class="se-chk${ph.length ? "" : " done"}"><div class="se-chk-h">${sev}<b>${ph.length ? `${ph.length} narratives are placeholder text` : "No placeholder narratives"}</b></div>${ph.length ? `<p>${sat} of them are on controls the assessor found satisfied, so the SSP doesn't describe what was assessed.</p><div class="se-codes">${shown.map(codeBtn).join("")}${!open && codes.length > 8 ? `<button type="button" class="se-src more" data-act="morecodes" data-id="k1">+${codes.length - 8} more</button>` : ""}</div>` : ""}${foot}</div>`;
  }
  const qProg = () => { const q = ST.q, n = q.list.length, code = q.list[Math.min(q.i, n - 1)] || ""; return `<div class="se-qh"><span>Drafting <b class="num">${q.i} of ${n}</b></span><span class="se-mono">${esc(code)}</span></div>${h.bar(n ? Math.round((q.i / n) * 100) : 0)}`; };
  function checkTab() {
    return D.checks.map((k) => {
      const done = checkDone(k), sev = done ? h.pill("ok", "Resolved") : k.sev === "high" ? h.pill("bad", "High") : k.sev === "medium" ? h.pill("warn", "Medium") : h.pill("none", "Low");
      if (k.id === "k1") return k1HTML(k, sev);
      const open = ST.codesOpen.has(k.id), shown = open ? k.codes : k.codes.slice(0, 8);
      let act = "";
      if (!done) {
        if (k.id === "k2" || k.id === "k3") act = `<button type="button" class="btn sm" data-modal="se-checklist" data-id="${k.id}">${esc(k.action)}</button>`;
        else if (k.id === "k4") act = `<button type="button" class="btn sm" data-go="controls">${I("open")}${esc(k.action)}</button>`;
        else if (k.id === "k5") act = `<button type="button" class="btn sm" data-modal="se-params" data-id="AC-2(3)">${esc(k.action)}</button>`;
        else if (k.id === "k6") { const nx = SRC_CHANGED.find((x) => !ST.reviewed.has(x)); act = `<button type="button" class="btn sm" data-act="jump" data-at="${esc(nx)}" data-modal="se-source" data-id="${esc(nx)}">${esc(k.action)} · ${esc(nx)}</button>`; }
        else if (k.id === "k7") act = `<button type="button" class="btn sm" data-act="check" data-id="k7">${I("sparkle")}${esc(k.action)}</button>`;
      }
      return `<div class="se-chk${done ? " done" : ""}"><div class="se-chk-h">${sev}<b>${esc(k.title)}</b></div><p>${esc(k.detail)}</p>${k.codes.length ? `<div class="se-codes">${shown.map(codeBtn).join("")}${!open && k.codes.length > 8 ? `<button type="button" class="se-src more" data-act="morecodes" data-id="${k.id}">+${k.codes.length - 8} more</button>` : ""}</div>` : k.at ? `<div class="se-codes"><button type="button" class="ak-code se-codeb" data-act="jump" data-at="${k.at}">${esc(where(k.at))}</button></div>` : ""}${act}</div>`;
    }).join("");
  }
  function sourcesFor(tgt) {
    const out = [], c = D.ctl(tgt);
    if (c) {
      (D.requirements[tgt] || []).forEach(([rq, tt, ev]) => { out.push(["Requirement", `${rq} ${tt}`]); if (ev) out.push(["Evidence", ev]); });
      if (!D.requirements[tgt] && c.r) out.push(["Requirement", `${plural(c.r, "mapped requirement")}, ${c.e} with evidence`]);
      [...new Set(c.n.match(/LRU-\d{3}/g) || [])].forEach((l) => { const e = D.elements.find((x) => x[4] === l); if (e) out.push(["Component", `${e[1]} (${l}) narrative`]); });
      D.controls.filter((x) => x.c.startsWith(tgt + "(") && !x.ph).slice(0, 6).forEach((x) => out.push(["Control", `${x.c} implementation`, x.c]));
      if (c.was) out.push(["Revision 2", trunc(c.was.n, 70)]);
    } else if (tgt === "s2") out.push(["System", "SYS-WSX90 categorization High / High / Moderate"], ["Control", "CP-12 implementation", "CP-12"], ["Component", "Cryptographic Services Module (LRU-003)"]);
    else { const s = secById(tgt); if (s && s.template) out.push(["Template", s.template]); out.push(["System", "System record SYS-WSX90"]); }
    return out;
  }
  function draftTab() {
    const tgt = ST.dt || (ST.focusAt && (isCtl(ST.focusAt) || secById(ST.focusAt)) ? ST.focusAt : "AC-2"); ST.dt = tgt;
    SRCS = sourcesFor(tgt); const off = ST.srcOff[tgt] || new Set(), N = nums();
    const opts = `<optgroup label="Sections">${ST.secs.map((s) => `<option value="${s.id}"${s.id === tgt ? " selected" : ""}>${esc(N[s.id] + " " + s.t)}</option>`).join("")}</optgroup>` + D.families.map((f) => `<optgroup label="${esc(famName(f))} (${f.f})">${D.ofFamily(f.f).map((c) => `<option value="${esc(c.c)}"${c.c === tgt ? " selected" : ""}>${esc(c.c + " " + c.t)}${c.ph ? " · placeholder" : ""}</option>`).join("")}</optgroup>`).join("");
    const g = ST.lastGen && ST.sugg.find((x) => x.id === ST.lastGen);
    const c = D.ctl(tgt);
    return `<div class="ak-field"><label for="se-dt">Target</label><select class="se-in" id="se-dt" data-chg="dt">${opts}</select><span class="se-hint">${c ? `${c.ph ? "Placeholder narrative · " : ""}${D.IMPL[c.s][0]} · ${D.STATUS[c.cs][0]}` : "A section of the document"}</span></div>
      <fieldset class="se-fs"><legend>Sources</legend>${SRCS.length ? SRCS.map((s, i) => `<label class="se-chkl"><input type="checkbox" data-src="${i}"${off.has(i) ? "" : " checked"}><span class="se-k">${esc(s[0])}</span><span>${esc(s[1])}</span></label>`).join("") : `<p class="se-hint">No records stand behind this target, so the draft will be marked Example.</p>`}</fieldset>
      <div class="ak-field"><label for="se-voice">Voice</label><select class="se-in" id="se-voice"><option>SSP voice: present tense, names elements by LRU</option><option>Assessor voice: names what each objective asks</option><option>Plain summary: two sentences</option></select></div>
      <button type="button" class="btn se-gen" id="se-gen" data-act="generate">${I("sparkle")}Generate</button>
      ${g ? `<div class="se-genres">${I("check")}<span>Draft placed in <b>${esc(where(g.at))}</b> as a suggestion. It changes nothing until someone accepts it.</span><button type="button" class="se-lb" data-act="jump" data-at="${esc(g.at)}">Show in the page</button></div>` : ""}`;
  }
  function askTab() {
    return `<div class="se-chat" id="se-chat" aria-live="polite">${ST.chat.length ? ST.chat.map((m) => (m.me ? `<div class="se-msg me"><div class="se-bub">${esc(m.text)}</div></div>` : `<div class="se-msg"><div class="se-aih">${I("sparkle")}Assist · AI answer${m.wait ? "" : ` · searched ${D.controls.length} narratives`}</div>${m.wait ? '<div class="se-dotsx" role="status" aria-label="Answering"><i></i><i></i><i></i></div>' : `<div class="se-ans">${m.html}</div>`}</div>`)).join("") : `<p class="se-hint">Ask about this SSP and the records behind it. Answers cite records you can open.</p>`}</div>
      <div class="se-canned">${CANNED.map((q, i) => `<button type="button" class="se-qb" data-act="ask" data-i="${i}">${esc(q)}</button>`).join("")}</div>
      <form class="se-askf" data-form="ask"><input class="se-in" id="se-askin" placeholder="Ask about WS-X90's SSP" aria-label="Ask Assist" autocomplete="off"><button type="submit" class="se-ib" aria-label="Send">${I("send")}</button></form>`;
  }
  function answerFor(q) {
    const s = q.toLowerCase(), chips = (list, max = 12) => `<div class="se-codes">${list.slice(0, max).map(codeBtn).join("")}${list.length > max ? `<span class="se-src more">+${list.length - max} more</span>` : ""}</div>`;
    if (/chang|since revision|revision 2/.test(s)) return { html: `<p>Six controls changed since revision 2, published Jul 25, 2026. Priya Raghavan changed all six on Nov 13: status and narrative.</p><ul class="se-al">${D.changed.map((code) => { const c = D.ctl(code); return `<li>${codeBtn(code)}<span>${esc(c.t)}: ${esc(D.IMPL[c.was.s][0])} → ${esc(D.IMPL[c.s][0])}, narrative rewritten</span></li>`; }).join("")}</ul>` };
    if (/inherit|identity provider|corporate/.test(s)) return { html: `<p><span class="ex">Example</span> Five identity controls come from the corporate identity provider (PRG-1013). IA-4 and IA-12 are inherited whole; IA-2, IA-5 and IA-8 are shared, so WS-X90's narratives cover their own part.</p>${chips(INHERIT.map((x) => x[0]))}` };
    const lru = q.match(/LRU-?(\d{3})/i);
    if (/mission computer/.test(s) || lru) {
      const code = lru ? "LRU-" + lru[1] : "LRU-001", el = D.elements.find((e) => e[4] === code), name = el ? el[1] : "Mission Computer";
      const re = new RegExp(`${name.replace(/[.*+?^${}()|[\]\\&]/g, "\\$&")}|\\b${code}\\b`, "i"), hits = D.controls.filter((c) => re.test(c.n)).map((c) => c.c);
      return { html: `<p><b class="num">${hits.length}</b> of ${D.controls.length} narratives name the ${esc(name)} or ${code}.</p>${chips(hits)}` };
    }
    const words = s.replace(/[^a-z0-9\- ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !/^(which|what|does|have|with|that|this|from|narratives?|controls?|about)$/.test(w));
    const hits = words.length ? D.controls.filter((c) => words.every((w) => c.n.toLowerCase().includes(w))).map((c) => c.c) : [];
    return { html: words.length ? `<p><b class="num">${hits.length}</b> narratives name ${words.map((w) => `“${esc(w)}”`).join(" and ")}.</p>${hits.length ? chips(hits) : ""}` : "<p>Ask about a control, an element or a change, and I'll search the narratives and records.</p>" };
  }
  function ask(q) {
    q = (q || "").trim(); if (!q) return;
    ST.chat.push({ me: 1, text: q }); const m = { wait: 1 }; ST.chat.push(m); renderAssist(); scrollChat();
    const fin = () => { Object.assign(m, answerFor(q), { wait: 0 }); if (ST.atab === "ask") { renderAssist(); scrollChat(); } };
    RM() ? fin() : setTimeout(fin, 550);
  }
  const scrollChat = () => { const ab = $("#se-ab"); if (ab) ab.scrollTop = ab.scrollHeight; };
  function draftFor(code) {
    const c = D.ctl(code), enh = D.controls.filter((x) => x.c.startsWith(code + "(") && !x.ph);
    const reqs = c.r ? [["Requirement", `${plural(c.r, "mapped requirement")}, ${c.e} with evidence`]] : [];
    if (enh.length) {
      const parts = []; let len = 0;
      for (const e of enh.slice(0, 3)) { const t = sentences(e.n, enh.length === 1 ? 2 : 1); if (len + t.length > 720 && parts.length) break; parts.push(t); len += t.length; }
      return { text: parts.join(" "), sources: [...enh.slice(0, 3).map((e) => ["Control", `${e.c} implementation`]), ...reqs], ex: 0, why: c.cs === "satisfied" ? `The narrative is placeholder text, while the assessor judged all ${c.ob} of ${code}'s objectives satisfied.` : "The narrative is placeholder text." };
    }
    return { text: `WS-X90 meets ${code} at ${LEAD[c.f] || "the elements that hold the function"}: ${c.t.toLowerCase()} is configured there, recorded in the Configuration Repository (LRU-020) and reviewed each quarter.`, sources: reqs, ex: 1, why: `The narrative is placeholder text, and no enhancement of ${code} has a narrative to draw from.` };
  }
  const SECTION_DRAFTS = {
    "Continuous monitoring strategy": "Monthly, every element that runs software is scanned with ACAS and the security log is reviewed; quarterly, a sample of control implementations is reassessed; annually, the SSP is reviewed against the baseline.",
    "Contingency plan summary": "A failed integrity check drops the Mission Computer into its restricted safe mode, and the Update & Recovery Controller (LRU-016) restores a signed image from the Configuration Repository (LRU-020) before the next mission.",
    "Incident response summary": "Security events from every element reach the Security Log Collector (LRU-018); ground support triages them within one shift and reports incidents to the CSSP within the hour.",
    "Supply chain risk management": "Each LRU arrives with an SBOM and a signed image; the Configuration Repository (LRU-020) refuses an image whose signature or SBOM does not match the approved configuration.",
    "Privacy summary": "WS-X90 holds no personally identifiable information beyond operator identities, which come from the corporate identity provider and are not stored on the platform.",
    "Cyber resiliency approach": "The mission keeps flying through a compromised element: segmentation isolates each subsystem, and the safe mode keeps the platform recoverable while the element is restored.",
    Acronyms: "LRU: line replaceable unit. PPSM: ports, protocols and services management. SCA: security control assessor. CSSP: cybersecurity service provider.",
  };
  function composeDraft(tgt, chosen, voice) {
    const c = D.ctl(tgt);
    let out;
    if (c) {
      const enh = chosen.filter((s) => s[0] === "Control" && s[2] && s[2].startsWith(tgt + "(")).map((s) => D.ctl(s[2])).filter(Boolean);
      const rev = chosen.find((s) => s[0] === "Revision 2"), comps = chosen.filter((s) => s[0] === "Component");
      let text, ex = 0;
      if (enh.length) text = enh.slice(0, 3).map((e) => sentences(e.n, enh.length === 1 ? 2 : 1)).join(" ");
      else if (rev && c.was) text = `${c.was.n.replace(/^Planned:\s*/, "")} ${sentences(c.n, 1)}`;
      else if (!c.ph && comps.length) text = sentences(c.n, 3);
      else { text = draftFor(tgt).text; ex = 1; }
      if (/Plain summary/.test(voice)) text = sentences(text, 2);
      out = { text, ex, why: c.ph ? "The narrative is placeholder text." : "Redrafted on request, from the sources chosen." };
    } else if (tgt === "s2") out = { text: D.suggestions.find((g) => g.id === "g2").text, ex: 1, why: "Section 2 has no categorization rationale; eMASS needs one." };
    else { const s = secById(tgt) || {}; out = { text: SECTION_DRAFTS[s.template || s.t] || `${s.t || "This section"} for WS-X90: who owns it, what it covers and where its records are kept. Replace this draft with the program's own words.`, ex: 1, why: "Drafted on request for a custom section." }; }
    out.sources = chosen.map((s) => [s[0], s[1]]);
    return out;
  }
  function generate() {
    if (ST.mode === "view") return toast("You're viewing. Switch to Editing or Suggesting to draft.");
    const tgt = ST.dt || "AC-2", panel = $("#se-assist");
    const chosen = $$("input[data-src]", panel).filter((x) => x.checked).map((x) => SRCS[+x.dataset.src]).filter(Boolean);
    const voice = ($("#se-voice", panel) || {}).value || "", btn = $("#se-gen");
    if (btn) { btn.setAttribute("aria-disabled", "true"); btn.innerHTML = `${I("sparkle")}Drafting…`; }
    const done = () => {
      const d = composeDraft(tgt, chosen, voice);
      ST.sugg.filter((g) => g.at === tgt && g.ai && !g.done).forEach((g) => (g.done = "replaced"));
      const g = { id: "a" + ++ST.seq, at: tgt, by: "AI draft", for: ME, kind: isCtl(tgt) ? "replace" : "insert", ai: 1, card: true, text: d.text, sources: d.sources, why: d.why, ex: d.ex };
      ST.sugg.push(g); ST.lastGen = g.id;
      refreshAt(tgt); renderAssist(); renderMargin(); renderOutline();
      goTo(tgt, { block: "center" });
      toast(`AI draft placed in ${where(tgt)} as a suggestion`);
    };
    RM() ? done() : setTimeout(done, 700);
  }
  function openDraft(at) { ST.dt = at; ST.atab = "draft"; ST.lastGen = null; if (ST.side !== "assist") openSide("assist", true); else renderAssist(); setTimeout(() => { const b = $("#se-gen"); if (b) b.focus({ preventScroll: true }); }, 40); }
  function runQueue() {
    if (ST.mode === "view") return toast("You're viewing. Switch to Editing or Suggesting to draft.");
    const list = D.controls.filter((c) => c.ph).map((c) => c.c);
    if (!list.some((code) => !pendAt(code).some((g) => g.ai))) return toast("Every placeholder already has a draft to review");
    ST.q = { running: true, i: 0, list, timer: 0 };
    if (RM()) { list.forEach(makeDraft); ST.q.i = list.length; return finishQueue(); }
    renderAssist();
    const step = () => {
      if (!ST.q.running) return;
      makeDraft(ST.q.list[ST.q.i]); ST.q.i++;
      const el = $("#se-qprog"); if (el) el.innerHTML = qProg();
      if (ST.q.i < ST.q.list.length) ST.q.timer = setTimeout(step, 150); else finishQueue();
    };
    step();
  }
  function makeDraft(code) { if (pendAt(code).some((g) => g.ai)) return; const d = draftFor(code); ST.sugg.push({ id: "d" + ++ST.seq, at: code, by: "AI draft", for: ME, kind: "replace", ai: 1, bulk: 1, text: d.text, sources: d.sources, why: d.why, ex: d.ex }); refreshCtl(code); }
  function finishQueue() { const n = bulkPending("all").length; ST.q.running = false; clearTimeout(ST.q.timer); if (app()) { renderAssist(); renderOutline(); toast(`${plural(n, "draft")} ready to review. Nothing is accepted until you accept it.`); } }
  function stopQueue() { ST.q.running = false; clearTimeout(ST.q.timer); renderAssist(); toast(`Stopped after ${plural(ST.q.i, "draft")}`); }
  const bulkPending = (scope) => ST.sugg.filter((g) => g.ai && !g.done && g.kind === "replace" && !g.from && isCtl(g.at) && D.ctl(g.at).ph && (scope === "all" || famOf(g.at) === scope)).sort((a, b) => docOrder(a.at) - docOrder(b.at));
  function reviewNext() {
    const g = bulkPending("all")[0]; if (!g) return toast("No drafts left to review");
    goTo(g.at, { block: "center" });
    setTimeout(() => { const b = $(`#se-page ${sel(g.at)} .se-aib [data-act="accept"]`); if (b) b.focus({ preventScroll: true }); }, RM() ? 0 : 420);
  }
  function acceptAll(scope) {
    const list = bulkPending(scope); if (!list.length) return;
    list.forEach((g) => acceptS(g.id, { bulk: 1 }));
    list.forEach((g) => refreshCtl(g.at)); refreshSec("a3");
    setSave("record", `Saved to ${plural(list.length, "control implementation")}`);
    renderMargin(); renderOutline(); renderAssist();
    toast(`Accepted ${plural(list.length, "AI draft")}. Each narrative is saved to its control's record.`);
  }

  // ——— Suggestions: accept and reject ———
  function applyDom(key, sid, accept) {
    const ed = $(`#se-page [data-key="${key}"]`), box = document.createElement("div");
    box.innerHTML = ed ? ed.innerHTML : ST.secHTML[key] || "";
    box.querySelectorAll(`[data-sid="${sid}"]`).forEach((n) => { if ((n.tagName === "INS") === accept) n.replaceWith(...n.childNodes); else n.remove(); });
    ST.secHTML[key] = box.innerHTML; if (ed) ed.innerHTML = box.innerHTML;
  }
  function acceptS(id, opts = {}) {
    const g = ST.sugg.find((x) => x.id === id); if (!g || g.done) return;
    if (ST.mode === "view") return toast("You're viewing. Switch to Editing to accept suggestions.");
    const c = D.ctl(g.at);
    if (c) {
      if (g.from && !c.n.includes(g.from)) { g.done = "rejected"; g.doneBy = ME; refreshAt(g.at); renderMargin(); return toast("The words this suggestion changes were edited since, so nothing was replaced."); }
      c.n = g.kind === "edit" ? g.text : g.from ? c.n.replace(g.from, g.text) : g.text; c.rv += 1; c.up = TODAY_ISO; c.ph = 0;
      if (!opts.bulk) setSaveSoon("record", `Saved to ${g.at}'s implementation · record revision ${c.rv}`);
    } else if (g.at === "s2" && g.ai) { D.system.rationale = g.text; setSaveSoon("record", `Saved to ${D.system.code}'s categorization rationale`); }
    else if (g.kind === "sdom") { applyDom(g.key, g.id, true); setSaveSoon("saved", "Saved"); }
    else { const ed = $(`#se-page [data-key="${g.at}"]`); const cur = ed ? ed.innerHTML : ST.secHTML[g.at] != null ? ST.secHTML[g.at] : ((secById(g.at) || {}).text || []).map((p) => `<p>${esc(p)}</p>`).join(""); ST.secHTML[g.at] = cur + `<p>${esc(g.text)}</p>`; setSaveSoon("saved", "Saved"); }
    g.done = "accepted"; g.doneBy = ME;
    log({ what: g.ai ? `AI draft accepted by ${ME}` : g.by === ME ? "Suggestion accepted" : `Suggestion by ${g.by} accepted by ${ME}`, at: g.at, kind: "accept" }, opts.bulk);
    if (opts.bulk) return;
    if (ST.active === id) ST.active = null;
    refreshAt(g.at); renderMargin(); renderOutline(); if (ST.side === "assist") renderAssist();
    toast(g.ai ? (c ? `AI draft accepted and saved to ${g.at}'s implementation` : "AI draft accepted") : "Suggestion accepted");
  }
  function rejectS(id) {
    const g = ST.sugg.find((x) => x.id === id); if (!g || g.done) return;
    if (g.kind === "sdom") applyDom(g.key, g.id, false);
    g.done = "rejected"; g.doneBy = ME; if (ST.active === id) ST.active = null;
    refreshAt(g.at); renderMargin(); renderOutline(); if (ST.side === "assist") renderAssist();
    toast(g.ai ? "AI draft rejected. The narrative is unchanged." : "Suggestion rejected");
  }

  // ——— Comments ———
  function storeMarks(id) { $$(`#se-page [data-cid="${id}"]`).forEach((m) => { const ed = m.closest('[data-ed="sec"]'); if (ed) storeSec(ed); }); }
  function resolveC(id, on) {
    const c = ST.comments.find((x) => x.id === id); if (!c) return;
    c.resolved = on ? 1 : 0; if (on && ST.active === id) ST.active = null;
    $$(`#se-page [data-cid="${id}"]`).forEach((m) => { m.classList.toggle("resolved", on); m.classList.remove("on"); });
    storeMarks(id); log({ what: on ? "Thread resolved" : "Thread reopened", at: c.at, kind: "comment" });
    renderMargin(); updateHead(); renderOutline(); toast(on ? "Thread resolved" : "Thread reopened");
  }
  function assignFrom(id) { const cb = $(`#se-margin .se-card[data-card="${id}"] input[data-assign]`); if (!cb || !cb.checked) return null; const d = $(`#se-margin .se-card[data-card="${id}"] input[type="date"]`); return { to: cb.dataset.name, due: (d && d.value) || "2026-11-24" }; }
  function postReply(id) {
    const c = ST.comments.find((x) => x.id === id), ta = $(`#se-margin textarea[data-cmp="${id}"]`), text = ((ta && ta.value) || "").trim();
    if (!c || !text) { if (ta) ta.focus(); return; }
    const task = assignFrom(id); c.thread.push([ME, ME_ROLE, D.now(), text]); if (task) c.task = task;
    if (ta) ta.value = "";
    log({ what: task ? `Reply, assigned to ${task.to}` : "Reply", at: c.at, kind: "comment" }); renderMargin(); updateHead();
    toast(task ? `Reply posted and assigned to ${task.to}` : "Reply posted");
    setTimeout(() => { const t2 = $(`#se-margin textarea[data-cmp="${id}"]`); if (t2) t2.focus({ preventScroll: true }); }, 30);
  }
  function postNew(id) {
    const c = ST.comments.find((x) => x.id === id), ta = $(`#se-margin textarea[data-cmp="${id}"]`), text = ((ta && ta.value) || "").trim();
    if (!c || !text) { if (ta) ta.focus(); return; }
    const task = assignFrom(id); c.thread = [[ME, ME_ROLE, D.now(), text]]; c.draft = 0; if (task) c.task = task;
    if (ta) ta.value = "";
    log({ what: task ? `Comment, assigned to ${task.to}` : "Comment", at: c.at, kind: "comment" });
    renderMargin(); updateHead(); renderOutline(); toast(task ? `Comment added and assigned to ${task.to}` : "Comment added");
  }
  function cancelNew(id) {
    ST.comments = ST.comments.filter((x) => x.id !== id);
    $$(`#se-page [data-cid="${id}"]`).forEach((m) => { const ed = m.closest('[data-ed="sec"]'); m.replaceWith(...m.childNodes); if (ed) storeSec(ed); });
    ST.active = null; renderMargin();
  }
  function commentFromSelection() {
    const r = ST.selRange;
    if (!r || r.collapsed || !document.contains(r.startContainer)) return toast("Select text in the page to comment on it");
    const quote = r.toString().replace(/\s+/g, " ").trim(); if (!quote) return toast("Select text in the page to comment on it");
    const id = "n" + ++ST.seq, mark = document.createElement("span"); mark.className = "sd-mark on"; mark.dataset.cid = id;
    try { r.surroundContents(mark); } catch (_) { mark.appendChild(r.extractContents()); r.insertNode(mark); }
    getSelection().removeAllRanges(); ST.selRange = null; const b = $("#se-cbtn"); if (b) b.hidden = true;
    ST.comments.push({ id, at: ST.selAt, quote, audience: ST.ctab, thread: [], draft: 1, mine: 1 });
    storeMarks(id); ST.active = id; ST.cfilter = "open";
    if (ST.side !== "comments") openSide("comments", true); else renderMargin();
    markActive();
    setTimeout(() => { const ta = $(`#se-margin textarea[data-cmp="${id}"]`); if (ta) ta.focus({ preventScroll: true }); }, 40);
  }
  function onCmpInput(ta) {
    const v = ta.value.slice(0, ta.selectionStart), m = v.match(/@([\w.]*)$/), list = ta.parentElement.querySelector(".se-atl");
    if (m) {
      const q = m[1].toLowerCase().replace(/\./g, ""), ppl = ALL.filter(([n]) => n !== ME && (!q || n.toLowerCase().replace(/\./g, "").split(/\s+/).some((w) => w.startsWith(q)))).slice(0, 6);
      list.innerHTML = ppl.map(([n, r], i) => `<button type="button" role="option" aria-selected="${!i}" class="se-atp${i ? "" : " on"}" data-act="mention" data-name="${esc(n)}">${U.av(n, 20)}<span>${esc(n)}</span><span class="r">${esc(r)}</span></button>`).join("");
      list.hidden = !ppl.length;
    } else list.hidden = true;
    updateAssign(ta);
  }
  function pickMention(btn) {
    const box = btn.closest(".se-cmp"), ta = box.querySelector("textarea"), pos = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
    const before = ta.value.slice(0, pos).replace(/@([\w.]*)$/, "@" + btn.dataset.name + " ");
    ta.value = before + ta.value.slice(pos); box.querySelector(".se-atl").hidden = true; ta.focus(); ta.setSelectionRange(before.length, before.length); updateAssign(ta);
  }
  function updateAssign(ta) {
    const card = ta.closest(".se-card"), slot = card && card.querySelector(".se-assign"); if (!slot) return;
    const names = ALL.map(([n]) => n).filter((n) => n !== ME && ta.value.includes("@" + n));
    if (!names.length) { slot.hidden = true; slot.innerHTML = ""; slot.dataset.name = ""; return; }
    const n = names[names.length - 1]; if (slot.dataset.name === n && !slot.hidden) return;
    slot.dataset.name = n; slot.hidden = false;
    slot.innerHTML = `<label class="se-chkl"><input type="checkbox" data-assign data-name="${esc(n)}"><span>Assign to ${esc(n)}</span></label><label class="se-due">Due <input type="date" class="se-in sm" value="2026-11-24"></label>`;
  }

  // ——— Presence, follow and the scripted collaborators ———
  function presenceCard(name) {
    const p = D.person(name), pos = ST.pos[name], f = ST.follow === name;
    return `<div class="se-pc" role="dialog" aria-label="${esc(name)}"><div class="se-pc-h">${U.av(name, 36)}<div><b>${esc(name)}</b><div class="se-pc-s">${esc(p.role)} · ${esc(p.access)}</div></div></div>
      <div class="se-pc-at">${ST.sim.on ? `<span class="se-dot" style="--c:${p.color}"></span><span>${esc(pos.doing)} ${esc(where(pos.at))}</span>` : "<span>Idle · simulated collaborators are off</span>"}</div>
      <div class="btns"><button type="button" class="btn sm" data-act="gotoperson" data-name="${esc(name)}">${I("right")}Go to</button><button type="button" class="btn sm" data-act="${f ? "unfollow" : "follow"}" data-name="${esc(name)}">${I("follow")}${f ? "Stop following" : "Follow"}</button></div>
      <label class="se-sw"><input type="checkbox" role="switch" data-chg="sim"${ST.sim.on ? " checked" : ""}><span class="se-sw-t" aria-hidden="true"></span><span>Simulated collaborators</span></label></div>`;
  }
  function paintPresence() {
    const root = app(); if (!root) return;
    root.classList.toggle("se-nosim", !ST.sim.on);
    $$("#se-page .se-vm").forEach((el) => el.remove());
    if (!ST.sim.on) return;
    for (const p of OTHERS) {
      const pos = ST.pos[p.name]; if (pos.caret) continue;
      const el = document.getElementById(D.ctl(pos.at) ? "se-c-" + pos.at.replace(/[()]/g, "-") : "se-s-" + pos.at); if (!el) continue;
      const k = el.querySelectorAll(":scope > .se-vm").length;
      el.insertAdjacentHTML("afterbegin", `<span class="se-vm" data-ui style="--k:${k}" title="${esc(p.name + " · " + pos.doing.toLowerCase())}">${U.av(p.name, 22)}</span>`);
    }
  }
  function posChanged(name) {
    if (!app()) return;
    renderOutline(); paintPresence(); updateHead();
    if (ST.popFor && ST.popFor.dataset.name === name && !$("#se-pop").hidden) $("#se-pop").innerHTML = presenceCard(name);
    if (ST.follow === name) goToPerson(name);
  }
  function goToPerson(name) { const pos = ST.pos[name]; if (pos) goTo(pos.at, { block: "center" }); }
  function followBar() { return ST.follow ? `<div class="se-follow" role="status">${U.av(ST.follow, 20)}<span>Following ${esc(ST.follow)}</span><button type="button" class="se-lb" data-act="unfollow">Stop following</button></div>` : ""; }
  function renderFollow() { const d = $(".se-desk"); if (!d) return; const old = $(".se-follow", d); if (old) old.remove(); if (ST.follow) d.insertAdjacentHTML("afterbegin", followBar()); }
  function startFollow(name) { closePop(false); ST.follow = name; renderFollow(); goToPerson(name); toast(`Following ${name}. Scroll to stop.`); }
  function stopFollow(say) { if (!ST.follow) return; const n = ST.follow; ST.follow = null; renderFollow(); closePop(false); if (say) toast(`Stopped following ${n}`); }
  function paintTyping() {
    const cell = document.getElementById("se-inv-LRU-020"); if (!cell || cell === document.activeElement) return;
    cell.innerHTML = invDescHTML("LRU-020"); cell.setAttribute("contenteditable", canEditStr("inv", "LRU-020"));
  }
  function arriveReply(quiet) {
    const c = ST.comments.find((x) => x.id === "c2"); if (!c) return;
    c.thread.push(["Marcus Ryde", "Component owner", D.now(), "Dec 4. The signing job is in test."]);
    if (!quiet) { c.fresh = 1; ST.unread += 1; }
    if (!app()) return;
    renderMargin(); updateHead();
    if (!quiet) { toast("Marcus Ryde replied on SI-14(1)", "Show", () => activate("c2", { scroll: true })); setTimeout(() => { if (c.fresh) { c.fresh = 0; const el = $('#se-margin .se-card[data-card="c2"]'); if (el) el.classList.remove("se-fresh"); } }, 2600); }
  }
  function simApply(quiet) {
    const t = ST.sim.t, k = TYPE_AT.filter((x) => x <= t).length;
    if (k !== ST.typed) {
      ST.typed = k;
      if (k >= SIMTEXT.length && !ST.inv["LRU-020"]) { ST.inv["LRU-020"] = SIMTEXT; ST.invSynced = "synced just now · Marcus Ryde"; const s = $('[data-sync="s8"]'); if (s) s.textContent = "· " + ST.invSynced; renderOutline(); }
      paintTyping();
    }
    if (t >= EV.marcusMove && !ST.sim.fired.has("mm")) { ST.sim.fired.add("mm"); ST.pos["Marcus Ryde"] = { at: "SI-14(1)", doing: "Commenting on" }; paintTyping(); posChanged("Marcus Ryde"); }
    if (t >= EV.reply && !ST.sim.fired.has("rp")) { ST.sim.fired.add("rp"); arriveReply(quiet); }
    if (t >= EV.joelMove && !ST.sim.fired.has("jm")) { ST.sim.fired.add("jm"); ST.pos["Joel Barrantes"] = { at: "s2", doing: "Viewing" }; posChanged("Joel Barrantes"); }
  }
  function simStop() { clearInterval(ST.sim.timer); ST.sim.timer = 0; }
  function simStart() {
    if (!ST.sim.on || ST.sim.timer) return;
    if (RM() || ST.sim.t >= SIM_END) { ST.sim.t = Math.max(ST.sim.t, SIM_END); simApply(true); return; }
    ST.sim.last = performance.now();
    ST.sim.timer = setInterval(() => {
      if (!app()) return simStop();
      const now = performance.now(); ST.sim.t += now - ST.sim.last; ST.sim.last = now; simApply();
      if (ST.sim.t >= SIM_END) simStop();
    }, 60);
  }
  function setSim(on) {
    ST.sim.on = on; if (on) simStart(); else simStop();
    paintPresence(); renderOutline(); paintTyping(); updateHead();
    if (ST.popFor && ST.popFor.dataset.name && !$("#se-pop").hidden) $("#se-pop").innerHTML = presenceCard(ST.popFor.dataset.name);
    toast(on ? "Simulated collaborators on" : "Simulated collaborators off: their carets and scripted edits stop");
  }

  // ——— Navigation inside the document ———
  function renderFam(f) {
    const el = document.getElementById("se-f-" + f); if (!el || !el.dataset.lazy) return;
    if (ST.io) ST.io.unobserve(el); ST.rendered.add(f);
    const i = D.families.findIndex((x) => x.f === f); el.outerHTML = famHTML(D.families[i], i);
    paintPresence(); schedLayout();
  }
  function renderUpTo(f) { const idx = D.families.findIndex((x) => x.f === f); D.families.slice(0, idx + 1).forEach((x) => renderFam(x.f)); }
  function lazyObserve() {
    const sc = $("#se-scroll"); if (ST.io) ST.io.disconnect(); if (!sc || !window.IntersectionObserver) return;
    ST.io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) renderFam(en.target.dataset.fam); }), { root: sc, rootMargin: "1200px 0px" });
    $$(".se-fam[data-lazy]").forEach((el) => ST.io.observe(el));
  }
  function scrollToEl(el, block) {
    const sc = $("#se-scroll"); if (!sc || !el) return; const r = el.getBoundingClientRect(), sr = sc.getBoundingClientRect();
    const top = sc.scrollTop + r.top - sr.top - (block === "center" ? Math.max(24, (sc.clientHeight - Math.min(r.height, sc.clientHeight)) / 2) : 20);
    sc.scrollTo({ top: Math.max(0, top), behavior: RM() ? "auto" : "smooth" });
  }
  function flash(el) { if (!el || RM()) return; el.classList.remove("se-flash"); void el.offsetWidth; el.classList.add("se-flash"); setTimeout(() => el.classList.remove("se-flash"), 1500); }
  function goTo(at, opts = {}) {
    if (!app() || !at) return;
    const c = D.ctl(at); let el;
    if (c) { renderUpTo(c.f); el = inPage(at); }
    else if (String(at).startsWith("fam:")) { const f = at.slice(4); renderUpTo(f); el = document.getElementById("se-f-" + f); }
    else { if (ST.secs.findIndex((s) => s.id === at) > ST.secs.findIndex((s) => s.id === "s11")) renderUpTo(D.families[D.families.length - 1].f); el = document.getElementById("se-s-" + at); }
    if (!el) return;
    scrollToEl(el, opts.block || (c ? "center" : "start"));
    if (!opts.noflash) flash(c ? el : el.querySelector(".sd-h1, .sd-h2") || el);
  }
  function spy() {
    const sc = $("#se-scroll"); if (!sc) return; const top = sc.getBoundingClientRect().top + 90;
    let cur = null; for (const el of $$("#se-page > .se-sec")) { if (el.getBoundingClientRect().top <= top) cur = el.dataset.at; else break; }
    let fam = null; if (cur === "s11") for (const el of $$("#se-s-s11 .se-fam")) { if (el.getBoundingClientRect().top <= top) fam = el.dataset.fam; else break; }
    const key = fam ? "fam:" + fam : cur; if (key === ST.cur) return; ST.cur = key; markCur();
  }
  function markCur() {
    $$("#se-out .se-o.on").forEach((b) => { b.classList.remove("on"); b.removeAttribute("aria-current"); });
    const b = (ST.cur && $(`#se-out .se-o[data-at="${ST.cur}"]`)) || (ST.cur && ST.cur.startsWith("fam:") && $('#se-out .se-o[data-at="s11"]')); if (b) { b.classList.add("on"); b.setAttribute("aria-current", "location"); }
  }
  function toggleContents(force) { const a = app(); if (!a) return; const on = force != null ? force : !a.classList.contains("out-open"); a.classList.toggle("out-open", on); if (on) setTimeout(() => { const f = $("#se-out .se-o"); if (f) f.focus(); }, 30); }
  function openSide(which, touched) {
    if (touched) ST.sideTouched = true;
    ST.side = which; const b = $(".se-body"), a = app(); if (!b || !a) return;
    b.dataset.side = which;
    if (which === "comments") renderMargin(); else if (which === "assist") renderAssist();
    a.classList.toggle("se-ov", NARROW() && !!which);
    updateHead(); schedLayout();
    if (NARROW() && which) setTimeout(() => { const f = which === "assist" ? $("#se-assist .se-ah .se-ib") : $("#se-margin .se-mtab.on"); if (f && !document.activeElement.closest(".se-card")) f.focus(); }, 40);
  }
  function updateHead() {
    const c = $("#se-ctog"); if (c) { c.classList.toggle("on", ST.side === "comments"); c.setAttribute("aria-pressed", String(ST.side === "comments")); c.setAttribute("aria-label", `Comments: ${openCount()} open threads${ST.unread ? `, ${ST.unread} new reply` : ""}`); c.innerHTML = ctogInner(); }
    const a = $("#se-atog"); if (a) { a.classList.toggle("on", ST.side === "assist"); a.setAttribute("aria-pressed", String(ST.side === "assist")); }
    $$(".se-pav").forEach((b) => b.setAttribute("aria-label", `${b.dataset.name}, ${roleOf(b.dataset.name)}: ${presenceLine(b.dataset.name)}`));
    const mb = $("#se-modebtn"), m = MODES[ST.mode]; if (mb) { mb.innerHTML = `${I(m[1])}<span>${m[0]}</span>${I("down")}`; mb.setAttribute("aria-label", "Mode: " + m[0]); }
    const mc = $("#se-modechip"); if (mc) mc.innerHTML = modeChip();
  }
  function renderOutline() {
    const o = $("#se-out"); if (!o) return;
    const st = o.scrollTop, fa = document.activeElement, fk = fa && o.contains(fa) ? fa.dataset.at || fa.dataset.act : null;
    o.innerHTML = outlineHTML(); o.scrollTop = st; markCur();
    if (fk) { const b = $(`#se-out [data-at="${fk}"]`) || $(`#se-out [data-act="${fk}"]`); if (b) b.focus({ preventScroll: true }); }
  }
  function refreshCtl(code) { const el = inPage(code); if (!el || !el.classList.contains("se-ctl")) return; el.outerHTML = ctlHTML(D.ctl(code)); paintPresence(); schedLayout(); }
  function refreshSec(id) { const el = document.getElementById("se-s-" + id), s = secById(id); if (!el || !s || id === "s11") return; el.outerHTML = secHTML(s); paintPresence(); schedLayout(); }
  const refreshAt = (at) => (isCtl(at) ? refreshCtl(at) : refreshSec(at));
  function rerenderPage() { const p = $("#se-page"), sc = $("#se-scroll"); if (!p) return; const top = sc.scrollTop; p.innerHTML = pageHTML(); sc.scrollTop = top; lazyObserve(); paintPresence(); markActive(); schedLayout(); }

  // ——— Editing, saving to records, and suggesting ———
  function canEditStr(k, lru) { if (ST.mode === "view") return "false"; if (k === "inv") return String(ST.mode === "edit" && !(lru === "LRU-020" && marcusTyping())); if (k === "rat") return String(ST.mode === "edit"); return "true"; }
  function setMode(m) {
    ST.mode = m; const root = app(); if (!root) return; root.dataset.mode = m;
    $$("#se-page [data-ed]").forEach((el) => { const k = el.dataset.ed; if (k !== "ctl") el.setAttribute("contenteditable", canEditStr(k, el.dataset.lru)); });
    $$("#se-page .se-ctl").forEach((el) => refreshCtl(el.dataset.at));
    updateHead();
    toast(m === "suggest" ? "Suggesting: your edits become suggestions others can accept" : m === "view" ? "Viewing: the document as it reads, without suggestions" : "Editing: your changes save to the records");
  }
  const storeSec = (ed) => { if (ed && ed.dataset.key) ST.secHTML[ed.dataset.key] = ed.innerHTML; };
  function onFocusIn(e) {
    const ed = e.target.closest && e.target.closest("[data-ed]"); if (!ed) return;
    const blk = ed.closest("[data-at]"); ST.lastEd = ed; ST.focusAt = blk ? blk.dataset.at : null;
    if (ed.dataset.ed === "sec") ST.lastAuth = ed;
    ed.dataset.before = ed.dataset.ed === "sec" ? ed.innerHTML : textOf(ed);
    ST.sess = ST.mode === "suggest" ? { ed, sid: "m-" + (ed.dataset.key || ST.focusAt) } : null;
  }
  function onInput(e) {
    const t = e.target;
    if (t.id === "se-title") { const d = $("#se-doctitle"); if (d) d.textContent = t.value || D.doc.title; return; }
    if (t.matches && t.matches("textarea[data-cmp]")) return onCmpInput(t);
    const ed = t.closest && t.closest("[data-ed]"); if (!ed || ST.mode === "suggest") return;
    const blk = ed.closest(".se-ctl, .sd-live") || ed.closest("[data-at]"), line = blk && blk.querySelector(".se-saving"); if (line) line.hidden = false;
    if (ST.save[0] !== "saving") setSave("saving", "Saving…");
    if (ed.dataset.ed === "sec") storeSec(ed);
  }
  function onFocusOut(e) {
    const ed = e.target.closest && e.target.closest("[data-ed]"); if (!ed) return;
    if (ST.mode === "suggest") return commitSuggest(ed);
    const k = ed.dataset.ed, blk = ed.closest("[data-at]"), at = blk && blk.dataset.at, line = (ed.closest(".se-ctl, .sd-live") || blk || ed).querySelector(".se-saving"); if (line) line.hidden = true;
    if (k === "ctl") return saveCtl(ed, at);
    if (k === "rat") { const t = textOf(ed); if (t === rationale()) { if (ST.save[0] === "saving") setSave("saved", "Saved"); return; } D.system.rationale = t; log({ what: "Categorization rationale edited", at: "s2" }); setSaveSoon("record", `Saved to ${D.system.code}'s categorization rationale`); return renderOutline(); }
    if (k === "inv") { const lru = ed.dataset.lru, t = textOf(ed); if (t === (ST.inv[lru] || "")) { if (ST.save[0] === "saving") setSave("saved", "Saved"); return; } ST.inv[lru] = t; log({ what: `${lru} description edited`, at: "s8" }); setSaveSoon("record", `Saved to ${lru}'s description`); return renderOutline(); }
    if (k === "sec") { storeSec(ed); if (ed.innerHTML !== ed.dataset.before) { log({ what: "Section text edited", at }); setSaveSoon("saved", "Saved"); renderOutline(); } else if (ST.save[0] === "saving") setSave("saved", "Saved"); }
  }
  function saveCtl(ed, at) {
    const c = D.ctl(at); if (!c) return; const t = textOf(ed, "base");
    if (!t) { ed.innerHTML = narrHTML(c, pendAt(at)); setSave("saved", "Saved"); return toast(`A narrative can't be empty, so ${at}'s text is back.`); }
    if (t === c.n) { if (ST.save[0] === "saving") setSave("saved", "Saved"); return; }
    const wasPh = c.ph; c.n = t; c.rv += 1; c.up = TODAY_ISO; c.ph = 0;
    log({ what: "Narrative edited", at });
    setSaveSoon("record", `Saved to ${at}'s implementation · record revision ${c.rv}`);
    if (wasPh) { const blk = inPage(at); $$(".sd-ph", ed).forEach((n) => n.replaceWith(...n.childNodes)); if (blk) { const ch = $(".se-ctl-m .ak-chip.warn", blk); if (ch) ch.remove(); const dw = $('[data-act="draftwith"]', blk); if (dw) dw.remove(); } renderOutline(); }
  }
  function commitSuggest(ed) {
    const blk = ed.closest("[data-at]"), at = blk && blk.dataset.at, k = ed.dataset.ed; if (!at) return;
    if (k === "ctl") {
      const c = D.ctl(at), prop = textOf(ed, "proposed"), id = "m-" + at; let g = ST.sugg.find((x) => x.id === id && !x.done);
      if (prop === c.n) { if (g) g.done = "withdrawn"; setTimeout(() => refreshCtl(at), 160); renderMargin(); return; }
      if (!g) { g = { id, at, by: ME, kind: "edit", card: true, mine: 1 }; ST.sugg.push(g); }
      const first = g.text == null; g.base = c.n; g.text = prop;
      log({ what: "Suggested an edit", at, kind: "comment" }); setTimeout(() => refreshCtl(at), 160); renderMargin(); renderOutline();
      if (first) toast(`Suggestion added to ${at}. It changes nothing until someone accepts it.`);
    } else if (k === "sec") {
      storeSec(ed); const key = ed.dataset.key, id = "m-" + key, marks = $$(`[data-mine][data-sid="${id}"]`, ed); let g = ST.sugg.find((x) => x.id === id && !x.done);
      if (!marks.length) { if (g) { g.done = "withdrawn"; renderMargin(); } return; }
      if (!g) { g = { id, at, key, by: ME, kind: "sdom", card: true, mine: 1 }; ST.sugg.push(g); toast(`Suggestion added to ${where(at)}. It changes nothing until someone accepts it.`); }
      g.summary = marks.map((n) => [n.tagName === "INS" ? "Add" : "Delete", n.textContent]);
      log({ what: "Suggested an edit", at, kind: "comment" }); renderMargin(); renderOutline();
    }
  }
  function placeCaret(node, before) { const s = getSelection(), r = document.createRange(); if (before) r.setStartBefore(node); else r.setStartAfter(node); r.collapse(true); s.removeAllRanges(); s.addRange(r); }
  const mineEl = (tag, sid) => { const el = document.createElement(tag); el.className = tag === "ins" ? "sd-ins" : "sd-del"; el.dataset.mine = "1"; el.dataset.sid = sid; el.style.setProperty("--c", D.person(ME).color); return el; };
  function insIns(text, ed, sid) {
    const s = getSelection(), r = s.getRangeAt(0), node = r.startContainer.nodeType === 3 ? r.startContainer.parentElement : r.startContainer, host = node.closest("ins[data-mine], del[data-mine]");
    if (host && host.tagName === "INS" && ed.contains(host)) { const tn = document.createTextNode(text); r.insertNode(tn); placeCaret(tn, false); return; }
    if (host && host.tagName === "DEL") { r.setStartAfter(host); r.collapse(true); }
    const ins = mineEl("ins", sid); ins.textContent = text; r.insertNode(ins);
    const nr = document.createRange(); nr.setStart(ins.firstChild, text.length); nr.collapse(true); s.removeAllRanges(); s.addRange(nr);
  }
  function markDel(r, ed, sid, backward) {
    const anc = r.commonAncestorContainer, el = anc.nodeType === 3 ? anc.parentElement : anc, myIns = el.closest("ins[data-mine]");
    if (myIns && ed.contains(myIns)) { r.deleteContents(); if (!myIns.textContent) myIns.remove(); return; }
    const inDel = el.closest("del"); if (inDel && ed.contains(inDel)) return placeCaret(inDel, backward);
    const del = mineEl("del", sid);
    try { r.surroundContents(del); } catch (_) { del.appendChild(r.extractContents()); r.insertNode(del); }
    const sib = (n, dir) => { let x = n[dir]; while (x && x.nodeType === 3 && !x.nodeValue) x = x[dir]; return x; };
    const nx = sib(del, "nextSibling"); if (nx && nx.nodeType === 1 && nx.matches("del[data-mine]")) { while (nx.firstChild) del.appendChild(nx.firstChild); nx.remove(); }
    const pv = sib(del, "previousSibling"); if (pv && pv.nodeType === 1 && pv.matches("del[data-mine]")) { while (del.firstChild) pv.appendChild(del.firstChild); del.remove(); return placeCaret(pv, backward); }
    placeCaret(del, backward);
  }
  function onBeforeInput(e) {
    if (ST.mode !== "suggest") return;
    const ed = e.target.closest && e.target.closest("[data-ed]"); if (!ed || (ed.dataset.ed !== "ctl" && ed.dataset.ed !== "sec")) return;
    const blk = ed.closest("[data-at]"), sid = ST.sess && ST.sess.ed === ed ? ST.sess.sid : "m-" + (ed.dataset.key || (blk && blk.dataset.at));
    const t = e.inputType, s = getSelection(); if (!s.rangeCount) return;
    if (t === "insertText" || t === "insertReplacementText" || t === "insertFromPaste") {
      const text = e.data != null ? e.data : e.dataTransfer ? e.dataTransfer.getData("text/plain") : ""; if (!text) return;
      e.preventDefault(); const r = s.getRangeAt(0); if (!r.collapsed) markDel(r, ed, sid, false); insIns(text, ed, sid);
    } else if (t.startsWith("delete")) {
      e.preventDefault();
      if (s.isCollapsed && s.modify) s.modify("extend", t.includes("Backward") ? "backward" : "forward", /Word/.test(t) ? "word" : "character");
      const r = s.getRangeAt(0); if (r.collapsed || !ed.contains(r.commonAncestorContainer)) return;
      markDel(r, ed, sid, t.includes("Backward"));
    } else if (t === "insertParagraph" || t === "insertLineBreak") e.preventDefault();
  }

  // ——— Toolbar commands and inserts ———
  function restoreRange(ed) { if (document.activeElement !== ed) ed.focus(); if (ST.lastRange && ed.contains(ST.lastRange.startContainer)) { const s = getSelection(); s.removeAllRanges(); s.addRange(ST.lastRange); } }
  function execCmd(cmd, val) {
    if (ST.mode === "view") return toast("You're viewing. Switch to Editing or Suggesting to change the text.");
    const ed = ST.lastEd && document.contains(ST.lastEd) ? ST.lastEd : null;
    if (cmd === "undo" || cmd === "redo") { if (!ed) return toast(cmd === "undo" ? "Nothing to undo yet" : "Nothing to redo"); ed.focus(); document.execCommand(cmd); return; }
    if (!ed || ed.dataset.ed !== "sec") return toast("Formatting applies to authored sections. Narratives and live tables are plain text in their records.");
    restoreRange(ed); document.execCommand(cmd, false, val || null); storeSec(ed);
  }
  function snip(src, inner) { return `<div class="sd-live se-snip" contenteditable="false"><div class="sd-live-h"><span class="sd-live-tag">${I("live")}Live</span><span>${esc(src)}</span><span>· synced just now</span></div>${inner}</div>`; }
  function insertBlock(html, label) {
    if (ST.mode === "view") return toast("You're viewing. Switch to Editing to insert.");
    let ed = ST.lastAuth && document.contains(ST.lastAuth) ? ST.lastAuth : null;
    if (!ed) { const last = [...ST.secs].reverse().find((s) => s.kind === "custom"); ed = last && $(`#se-s-${last.id} .se-auth`); }
    if (!ed) return toast("Add a custom section first");
    const tmp = document.createElement("div"); tmp.innerHTML = html; const node = tmp.firstElementChild;
    let anchor = ST.lastRange && ed.contains(ST.lastRange.startContainer) ? ST.lastRange.startContainer : null; while (anchor && anchor.parentNode !== ed) anchor = anchor.parentNode;
    if (anchor) anchor.after(node); else ed.appendChild(node);
    if (!node.nextSibling) node.insertAdjacentHTML("afterend", "<p><br></p>");
    storeSec(ed); const at = ed.closest("[data-at]").dataset.at;
    log({ what: `${label} inserted`, at }); setSave("saved", "Saved"); renderOutline();
    toast(`Inserted ${label} in ${where(at)}`); scrollToEl(node, "center"); flash(node); schedLayout();
  }
  function insertItem(k) {
    if (k === "live-ctl") return clickModal("se-insctl");
    if (k === "dia-upload") return clickModal("se-upload", "Upload an image");
    if (k === "template") return clickModal("se-add", "template");
    const map = {
      "live-inv": ["Inventory table", () => snip("System tree, 20 elements", invTable(true))], "live-roles": ["Roles table", () => snip("Program roles", rolesTable())],
      "live-ic": ["Interconnections", () => snip("Interconnection records", icTable())], "live-ppsm": ["Ports and protocols", () => snip("PPSM records", ppsmTable())],
      "live-base": ["Baseline summary", () => snip(D.system.baseline, baselineInner())],
      "dia-boundary": ["Authorization boundary diagram", () => `<figure class="sd-fig se-fig" contenteditable="false">${boundarySVG()}</figure>`],
      "dia-flows": ["Data flow diagram", () => `<figure class="sd-fig se-fig" contenteditable="false">${flowsSVG()}</figure>`],
      pb: ["Page break", () => `<div class="se-pb" contenteditable="false"><span>Page break</span></div>`],
    };
    if (map[k]) insertBlock(map[k][1](), map[k][0]);
  }
  function insertMenu(lv) {
    const it = (k, ic, l, sub) => `<button type="button" role="menuitem" class="se-mi" data-act="${sub ? "insmenu" : "ins"}" data-k="${k}">${I(ic)}<span class="se-mi-t"><b>${l}</b></span>${sub ? I("right", "se-mi-c") : ""}</button>`;
    const back = `<button type="button" role="menuitem" class="se-mi se-mi-back" data-act="insmenu" data-k="root">${I("back")}<span class="se-mi-t"><b>Insert</b></span></button>`;
    if (lv === "live") return `<div class="se-menu" role="menu" aria-label="Live data">${back}${it("live-ctl", "live", "Control implementation…")}${it("live-inv", "table", "Inventory table")}${it("live-roles", "user", "Roles table")}${it("live-ic", "link", "Interconnections")}${it("live-ppsm", "toc", "Ports and protocols")}${it("live-base", "live", "Baseline summary")}</div>`;
    if (lv === "diagram") return `<div class="se-menu" role="menu" aria-label="Diagram">${back}${it("dia-boundary", "diagram", "Authorization boundary")}${it("dia-flows", "diagram", "Data flows")}${it("dia-upload", "image", "Upload an image")}</div>`;
    return `<div class="se-menu" role="menu" aria-label="Insert">${it("live", "live", "Live data", 1)}${it("diagram", "diagram", "Diagram", 1)}${it("template", "plus", "Section from a template…")}${it("pb", "pb", "Page break")}</div>`;
  }
  const modeMenu = () => `<div class="se-menu" role="menu" aria-label="Mode">${Object.entries(MODES).map(([k, [l, ic, d]]) => `<button type="button" role="menuitemradio" aria-checked="${ST.mode === k}" class="se-mi${ST.mode === k ? " on" : ""}" data-act="mode" data-k="${k}">${I(ic)}<span class="se-mi-t"><b>${l}</b><span>${d}</span></span>${ST.mode === k ? I("check", "se-mi-c") : ""}</button>`).join("")}</div>`;
  const moreMenu = () => `<div class="se-menu" role="menu" aria-label="More">
    <button type="button" role="menuitem" class="se-mi" data-act="side" data-side="comments">${I("chat")}<span class="se-mi-t"><b>Comments</b><span>${openCount()} open threads</span></span></button>
    <button type="button" role="menuitem" class="se-mi" data-act="side" data-side="assist">${I("sparkle")}<span class="se-mi-t"><b>Assist</b><span>Check, draft and ask</span></span></button>
    <button type="button" role="menuitem" class="se-mi" data-go="ssp-history">${I("history")}<span class="se-mi-t"><b>Version history</b></span></button>
    <button type="button" role="menuitem" class="se-mi" data-modal="se-share">${I("user")}<span class="se-mi-t"><b>Share</b></span></button>
    <div class="se-mi-g">Mode</div>${modeMenu().replace(/^<div[^>]*>|<\/div>$/g, "")}</div>`;
  const scopeMenu = () => { const all = bulkPending("all"), fams = D.families.map((f) => [f, bulkPending(f.f).length]).filter(([, n]) => n); return `<div class="se-menu" role="menu" aria-label="Accept all from">${[[`All drafts`, all.length, "all"], ...fams.map(([f, n]) => [`${famName(f)} (${f.f})`, n, f.f])].map(([l, n, k]) => `<button type="button" role="menuitem" class="se-mi" data-modal="se-acceptall" data-id="${k}"><span class="se-mi-t"><b>${esc(l)}</b></span><span class="se-mi-n num">${n}</span></button>`).join("")}</div>`; };
  function clickModal(key, id) { const a = app(); if (!a) return; const b = document.createElement("button"); b.type = "button"; b.hidden = true; b.dataset.modal = key; if (id) b.dataset.id = id; a.appendChild(b); b.click(); b.remove(); setTimeout(focusModal, 0); }
  function focusModal() { const f = $("#modal [data-autofocus]"); if (f) f.focus(); }
  function regen(id) { const f = document.getElementById(id); if (!f) return; f.innerHTML = id === "se-fig1" ? boundarySVG() : flowsSVG(); flash(f); toast(id === "se-fig1" ? "Redrawn from the system tree: 6 subsystems, 20 elements, 4 interconnections" : "Redrawn from the system tree and the interconnection records"); }
  function reviewSource(at, how) { ST.reviewed.add(at); refreshCtl(at); log({ what: how === "dismissed" ? "Source change dismissed" : "Source change reviewed", at }); renderOutline(); if (ST.side === "assist") renderAssist(); toast(how === "dismissed" ? `Dismissed the source change on ${at}` : `Marked ${at}'s source change reviewed`); }
  function changedPop(at) { const c = D.ctl(at); return `<div class="se-popc" role="dialog" aria-label="${esc(at)} changed since revision 2"><div class="se-pop-t">${I("history")}Changed since revision 2</div><div class="se-pop-r"><span class="se-k">Status</span>${AK.change(D.IMPL[c.was.s][0], D.IMPL[c.s][0])}</div><div class="se-k">Narrative</div><p class="se-red">${U.diff(c.was.n, c.n)}</p><div class="se-pop-f"><span>Nov 13 · Priya Raghavan</span><button type="button" class="se-lb" data-go="ssp-history">${I("history")}Open version history</button></div></div>`; }
  function sourcePop(at) { return `<div class="se-popc" role="dialog" aria-label="Source changed for ${esc(at)}"><div class="se-pop-t">${I("flag")}Source changed</div><p class="se-pop-p">Mission Computer version 2, published Nov 12, leaves ${esc(at)} to review. This narrative cites version 1.</p><div class="btns"><button type="button" class="btn sm" data-modal="se-source" data-id="${esc(at)}">Review change</button><button type="button" class="btn sm" data-act="srcdismiss" data-at="${esc(at)}">Dismiss</button></div></div>`; }

  // ——— Popovers ———
  function openPop(trigger, html) {
    const pop = $("#se-pop"); if (!pop) return;
    if (ST.popFor === trigger && !pop.hidden) return closePop();
    closePop(false);
    pop.innerHTML = html; pop.hidden = false; ST.popFor = trigger; trigger.setAttribute("aria-expanded", "true");
    const r = trigger.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    const left = Math.max(8, Math.min(r.right - pw > 8 && r.left + pw > innerWidth - 8 ? r.right - pw : r.left, innerWidth - pw - 8));
    let top = r.bottom + 6; if (top + ph > innerHeight - 8) top = Math.max(8, r.top - ph - 6);
    pop.style.left = left + "px"; pop.style.top = top + "px";
    const f = pop.querySelector("button, input, select"); if (f) f.focus({ preventScroll: true });
  }
  function closePop(restore = true) {
    const pop = $("#se-pop"); if (!pop || pop.hidden) return;
    pop.hidden = true; pop.innerHTML = ""; const t = ST.popFor; ST.popFor = null;
    if (t) { t.setAttribute("aria-expanded", "false"); if (restore && document.contains(t)) t.focus({ preventScroll: true }); }
  }

  // ——— Events on the editor ———
  const ACTIONS = {
    side: (t) => { closePop(false); openSide(ST.side === t.dataset.side || !t.dataset.side ? "" : t.dataset.side, true); },
    person: (t) => openPop(t, presenceCard(t.dataset.name)),
    gotoperson: (t) => { closePop(false); goToPerson(t.dataset.name); },
    follow: (t) => startFollow(t.dataset.name),
    unfollow: () => stopFollow(true),
    goto: (t) => { goTo(t.dataset.at); if (app().classList.contains("out-open")) toggleContents(false); },
    jump: (t) => goTo(t.dataset.at),
    t11: () => { ST.open11 = !ST.open11; renderOutline(); },
    gaps: () => { ST.gaps = !ST.gaps; renderOutline(); },
    contents: () => toggleContents(),
    scrim: () => { if (app().classList.contains("out-open")) toggleContents(false); else openSide("", true); },
    modemenu: (t) => openPop(t, modeMenu()),
    mode: (t) => { closePop(false); setMode(t.dataset.k); },
    more: (t) => openPop(t, moreMenu()),
    cmd: (t) => execCmd(t.dataset.cmd),
    link: () => { if (ST.mode === "view") return toast("You're viewing. Switch to Editing to add a link."); if (!(ST.lastAuth && ST.lastRange && !ST.lastRange.collapsed && document.contains(ST.lastRange.startContainer))) return toast("Select text in an authored section to link it"); clickModal("se-link"); },
    table: () => { const ed = ST.lastEd; if (ed && ed.dataset.ed !== "sec") return toast("Tables go in authored and custom sections; live tables come from Insert › Live data."); insertBlock(`<div class="sd-tablebox"><table class="sd-table se-utable"><tbody>${"<tr><td><br></td><td><br></td><td><br></td></tr>".repeat(3)}</tbody></table></div>`, "Table"); },
    insert: (t) => openPop(t, insertMenu("root")),
    insmenu: (t) => { const pop = $("#se-pop"); pop.innerHTML = insertMenu(t.dataset.k); const f = pop.querySelector(t.dataset.k === "root" ? "button" : ".se-mi:not(.se-mi-back)"); if (f) f.focus(); },
    ins: (t) => { closePop(false); insertItem(t.dataset.k); },
    comment: () => commentFromSelection(),
    changed: (t) => openPop(t, changedPop(t.dataset.at)),
    source: (t) => openPop(t, sourcePop(t.dataset.at)),
    srcdismiss: (t) => { closePop(false); reviewSource(t.dataset.at, "dismissed"); },
    draftwith: (t) => openDraft(t.dataset.at),
    accept: (t) => acceptS(t.dataset.id),
    reject: (t) => rejectS(t.dataset.id),
    card: (t) => activate(t.dataset.id, { scroll: true }),
    resolve: (t) => resolveC(t.dataset.id, true),
    reopen: (t) => resolveC(t.dataset.id, false),
    reply: (t) => postReply(t.dataset.id),
    post: (t) => postNew(t.dataset.id),
    cancelnew: (t) => cancelNew(t.dataset.id),
    deact: () => { ST.active = null; markActive(); renderMargin(); },
    mention: (t) => pickMention(t),
    ctab: (t) => { ST.ctab = t.dataset.k; if (t.dataset.k === "assessor") { ST.unread = 0; ST.comments.forEach((c) => (c.fresh = 0)); } renderMargin(); updateHead(); const b = $(`#se-margin .se-mtab[data-k="${t.dataset.k}"]`); if (b) b.focus(); },
    cfilter: (t) => { ST.cfilter = t.dataset.k; renderMargin(); const b = $(`#se-margin [data-act="cfilter"][data-k="${t.dataset.k}"]`); if (b) b.focus(); },
    atab: (t) => { ST.atab = t.dataset.k; renderAssist(); const b = $(`#se-assist .se-atab[data-k="${t.dataset.k}"]`); if (b) b.focus(); },
    check: (t) => { if (t.dataset.id === "k1") return runQueue(); const g = pendAt("s2").find((x) => x.ai); if (g) { goTo("s2"); return setTimeout(() => { const b = $('#se-page [data-at="s2"] .se-aib [data-act="accept"]'); if (b) b.focus({ preventScroll: true }); }, RM() ? 0 : 420); } openDraft("s2"); },
    nextthread: () => {
      const sc = $("#se-scroll"), line = sc.getBoundingClientRect().top + 120, list = cardList();
      const below = list.find((it) => { const a = anchorEl(it.id, it.o.at); return a && a.getBoundingClientRect().top > line && it.id !== ST.active; });
      const next = below || list[0]; if (next) activate(next.id, { scroll: true });
    },
    morecodes: (t) => { ST.codesOpen.add(t.dataset.id); renderAssist(); },
    qstop: () => stopQueue(),
    reviewnext: () => reviewNext(),
    accfrom: (t) => openPop(t, scopeMenu()),
    generate: (t) => { if (t.getAttribute("aria-disabled") !== "true") generate(); },
    ask: (t) => ask(CANNED[+t.dataset.i]),
    regen: (t) => regen(t.dataset.id),
    layout: () => toast("Edit layout would open the figure's boxes for dragging. The figure stays drawn from the system tree."),
    reattach: (t) => { const at = t.dataset.at; ST.detached.delete(at); delete ST.secHTML[at + ":det"]; refreshSec(at); log({ what: "Reattached to its record", at }); renderOutline(); toast(`${where(at)} reads from its record again`); },
  };
  function onClick(e) {
    const md = e.target.closest("[data-modal]");
    if (md) { closePop(false); if (/^se-/.test(md.dataset.modal)) setTimeout(focusModal, 0); }
    const t = e.target.closest("[data-act]");
    if (!t) {
      if (md || e.target.closest("[data-go]")) return;
      const mk = e.target.closest(".sd-mark[data-cid]"); if (mk) return activate(mk.dataset.cid, { focus: false });
      const sg = e.target.closest("#se-page [data-sid]"); if (sg && ST.sugg.some((g) => g.id === sg.dataset.sid && g.card && !g.done)) return activate(sg.dataset.sid, { focus: false });
      const card = e.target.closest(".se-card"); if (card && !e.target.closest("textarea, input, button, label, a, select") && ST.active !== card.dataset.card) return activate(card.dataset.card, { scroll: true });
      return;
    }
    const A = ACTIONS[t.dataset.act]; if (A) A(t, e);
  }
  function onChange(e) {
    const t = e.target, k = t.dataset && t.dataset.chg;
    if (t.id === "se-title") { const v = t.value.trim() || D.doc.title; t.value = v; if (v !== ST.title) { ST.title = v; log({ what: `Title renamed to “${v}”` }); setSaveSoon("saved", "Saved"); } return; }
    if (k === "sim") return setSim(t.checked);
    if (k === "dt") { ST.dt = t.value; ST.lastGen = null; renderAssist(); const s = $("#se-dt"); if (s) s.focus(); return; }
    if (k === "style") { execCmd("formatBlock", t.value === "p" ? "p" : t.value); return; }
    if (t.dataset && t.dataset.src != null && ST.dt) { const off = ST.srcOff[ST.dt] || (ST.srcOff[ST.dt] = new Set()); t.checked ? off.delete(+t.dataset.src) : off.add(+t.dataset.src); }
  }
  function onKey(e) {
    const t = e.target;
    if (t.matches && t.matches("textarea[data-cmp]")) {
      const list = t.parentElement.querySelector(".se-atl");
      if (list && !list.hidden) {
        const opts = $$(".se-atp", list), i = opts.findIndex((o) => o.classList.contains("on"));
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); const j = (i + (e.key === "ArrowDown" ? 1 : opts.length - 1)) % opts.length; opts.forEach((o, x) => { o.classList.toggle("on", x === j); o.setAttribute("aria-selected", String(x === j)); }); return; }
        if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); if (opts[Math.max(0, i)]) pickMention(opts[Math.max(0, i)]); return; }
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); list.hidden = true; return; }
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); const id = t.dataset.cmp, c = ST.comments.find((x) => x.id === id); return c && c.draft ? postNew(id) : postReply(id); }
      return;
    }
    if (t.id === "se-title" && e.key === "Enter") { e.preventDefault(); t.blur(); return; }
    if (e.key === "Enter" && t.closest && t.closest('[data-ed="ctl"], [data-ed="inv"], [data-ed="rat"]')) { e.preventDefault(); return; }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && t.closest && t.closest("#se-pop .se-menu")) { e.preventDefault(); const items = $$("#se-pop .se-mi"), i = items.indexOf(t.closest(".se-mi")); const n = items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]; if (n) n.focus(); }
  }
  function onSubmit(e) { if (e.target.dataset.form === "ask") { e.preventDefault(); const i = $("#se-askin"); const v = i ? i.value : ""; if (i) i.value = ""; ask(v); } }
  function onSel() {
    const b = $("#se-cbtn"), page = $("#se-page"); if (!b || !page) return;
    const s = getSelection();
    if (s.rangeCount) { const r0 = s.getRangeAt(0), n0 = r0.startContainer.nodeType === 3 ? r0.startContainer.parentElement : r0.startContainer, au = n0 && n0.closest && n0.closest('[data-ed="sec"]'); if (au && page.contains(au)) { ST.lastRange = r0.cloneRange(); ST.lastAuth = au; } }
    if (!s.rangeCount || s.isCollapsed) { b.hidden = true; return; }
    const r = s.getRangeAt(0), anc = r.commonAncestorContainer, node = anc.nodeType === 3 ? anc.parentElement : anc;
    const box = node && node.closest && node.closest(".se-n, .se-auth, td, th, .sd-p, .sd-h3, li, figcaption");
    if (!box || !page.contains(box) || node.closest("[data-ui], .sd-live-h, button")) { b.hidden = true; return; }
    const blk = box.closest("[data-at]"), text = r.toString().trim(); if (!blk || !text) { b.hidden = true; return; }
    ST.selRange = r.cloneRange(); ST.selAt = blk.dataset.at;
    const rect = r.getBoundingClientRect(), cols = $(".se-cols").getBoundingClientRect(), pr = page.getBoundingClientRect(), wide = ST.side === "comments" && !NARROW();
    b.style.top = Math.max(4, rect.top - cols.top + (wide ? -4 : -40)) + "px";
    b.style.left = Math.max(4, wide ? pr.right - cols.left + 10 : Math.min(rect.left - cols.left, cols.width - 130)) + "px";
    b.hidden = false;
  }
  function userScrolled() { if (ST.follow) stopFollow(true); }
  function mount() {
    const root = app(); if (!root) return;
    if (NARROW() && !ST.sideTouched) { ST.side = ""; $(".se-body").dataset.side = ""; }
    root.classList.toggle("se-ov", NARROW() && !!ST.side);
    root.addEventListener("click", onClick); root.addEventListener("change", onChange); root.addEventListener("input", onInput);
    root.addEventListener("focusin", onFocusIn); root.addEventListener("focusout", onFocusOut); root.addEventListener("beforeinput", onBeforeInput);
    root.addEventListener("keydown", onKey); root.addEventListener("submit", onSubmit);
    root.addEventListener("mousedown", (e) => { if (e.target.closest("#se-cbtn, .se-tb button")) e.preventDefault(); });
    const sc = $("#se-scroll");
    let spyRaf = 0;
    sc.addEventListener("scroll", () => { ST.scrollTop = sc.scrollTop; if (!spyRaf) spyRaf = requestAnimationFrame(() => { spyRaf = 0; spy(); }); }, { passive: true });
    ["wheel", "touchmove"].forEach((ev) => sc.addEventListener(ev, userScrolled, { passive: true }));
    sc.addEventListener("keydown", (e) => { if (/^(PageUp|PageDown|ArrowUp|ArrowDown|Home|End| )$/.test(e.key) && !(e.target.closest && e.target.closest("[contenteditable='true'], input, textarea, select"))) userScrolled(); });
    lazyObserve();
    if (window.ResizeObserver) new ResizeObserver(schedLayout).observe($("#se-page"));
    if (ST.scrollTop) sc.scrollTop = ST.scrollTop;
    simStart(); paintPresence(); markActive(); spy(); layoutMargin();
    setTimeout(layoutMargin, 150); if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedLayout);
  }
  function viewHTML() {
    if (NARROW() && !ST.sideTouched) ST.side = "";
    return `<div class="se-app" id="se-app" data-mode="${ST.mode}">${headHTML()}${toolbarHTML()}
      <div class="se-body" data-side="${ST.side}">
        <nav class="se-out" id="se-out" aria-label="Contents">${outlineHTML()}</nav>
        <div class="se-scroll" id="se-scroll"><div class="se-cols">
          <div class="sd-desk se-desk">${followBar()}<div class="se-note">${AK.note(NOTE)}</div><article class="sd-page se-page" id="se-page" aria-label="${esc(ST.title)}">${pageHTML()}</article></div>
          <aside class="se-margin" id="se-margin" aria-label="Comments and suggestions">${marginHTML()}</aside>
          <button type="button" class="se-cbtn" id="se-cbtn" data-act="comment" hidden>${I("cplus")}Comment</button>
        </div></div>
        <aside class="se-assist" id="se-assist" aria-label="Assist">${assistHTML()}</aside>
      </div>
      <div class="se-scrim" data-act="scrim" aria-hidden="true"></div>
      <div class="se-pop" id="se-pop" hidden></div>
    </div>`;
  }
  S.ssp = () => { queueMicrotask(mount); return viewHTML(); };

  // ——— Window-level listeners, attached once ———
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !app()) return;
    const pop = $("#se-pop"), md = document.getElementById("modal");
    if (pop && !pop.hidden) { e.preventDefault(); return closePop(); }
    if (md && !md.hidden && md.querySelector(".se-dlg")) { e.preventDefault(); const x = md.querySelector("[data-close-modal]"); if (x) x.click(); return; }
    if (app().classList.contains("out-open")) return toggleContents(false);
    if (NARROW() && ST.side) return openSide("", true);
    if (ST.active && !(e.target.closest && e.target.closest("textarea"))) { ST.active = null; markActive(); renderMargin(); }
  });
  document.addEventListener("selectionchange", () => { if (app()) onSel(); });
  document.addEventListener("pointerdown", (e) => { if (!app()) return; const pop = $("#se-pop"); if (pop && !pop.hidden && !pop.contains(e.target) && !(ST.popFor && ST.popFor.contains(e.target))) closePop(false); }, true);
  window.addEventListener("resize", () => { const a = app(); if (!a) return; a.classList.toggle("se-ov", NARROW() && !!ST.side); schedLayout(); });

  // ——— Dialogs ———
  const MODAL = document.getElementById("modal");
  const closeModalNow = () => { const x = MODAL && MODAL.querySelector("[data-close-modal]"); if (x) x.click(); };
  const verb = { Editor: "edit", Commenter: "comment", Viewer: "view" };
  function shareBody() {
    const rows = [...D.people.map((p) => [p.name, p.role, p.access, p.you, p.assessor]), ...D.access.map(([n, r, a]) => [n, r, a, 0, /Assessor/.test(r)]), ...ST.share.invited.map(([n, a]) => [n, "Invited", a, 0, 0])];
    return `<div class="se-dlg se-share">
      <div class="se-inv"><input class="se-in" id="se-inv-in" type="text" placeholder="Add people by name or email" aria-label="Invite people" data-autofocus><select class="se-in" id="se-inv-role" aria-label="Access for the people you invite"><option>Editor</option><option selected>Commenter</option><option>Viewer</option></select><button type="button" class="btn" data-mact="invite">Invite</button></div>
      <div class="se-dk">People with access <span class="num">${rows.length}</span></div>
      <ul class="se-plist">${rows.map(([n, r, a, you, ass]) => { const v = ST.share.access[n] || a; return `<li>${U.av(n, 28)}<span class="se-pl-n"><b>${esc(n)}${you ? " (you)" : ""}</b><span>${ass ? `<span class="ak-role">${esc(r)}</span>` : esc(r)}</span></span>${you ? `<span class="se-pl-a">${esc(v)}</span>` : `<select class="se-in" data-mchg="acc" data-name="${esc(n)}" aria-label="Access for ${esc(n)}">${["Editor", "Commenter", "Viewer"].map((o) => `<option${o === v ? " selected" : ""}>${o}</option>`).join("")}</select>`}</li>`; }).join("")}</ul>
      <div class="se-dk">Link access</div>
      <div class="se-linkrow">${I("link")}<span class="se-pl-n"><b>${ST.share.link ? "Anyone in the workspace with the link" : "Restricted"}</b><span>${ST.share.link ? "Can comment. The assessor keeps the access set above." : "Only the people above can open the SSP."}</span></span><label class="se-sw"><input type="checkbox" role="switch" data-mchg="link"${ST.share.link ? " checked" : ""} aria-label="Workspace link access"><span class="se-sw-t" aria-hidden="true"></span></label></div>
      <p class="se-small"><span class="ex">Example</span> The people beyond WS-X90's recorded roles, their access and the link setting are examples.</p></div>`;
  }
  M["se-share"] = () => ({ title: "Share the SSP", body: shareBody(), footer: `<button type="button" class="btn" data-mact="copy" style="margin-inline-end:auto">${I("link")}Copy link</button><button type="button" class="btn ink" data-close-modal>Done</button>` });
  const LIVE_KINDS = [["inv", "Inventory table"], ["roles", "Roles table"], ["ic", "Interconnections"], ["ppsm", "Ports and protocols"], ["base", "Baseline summary"]];
  M["se-add"] = (pre) => {
    const N = nums(), numbered = ST.secs.filter((s) => !isApp(s)), last = numbered[numbered.length - 1];
    return { title: "Add section", body: `<div class="se-dlg">
      <fieldset class="se-fs"><legend>Start from</legend>
        <label class="se-opt"><input type="radio" name="se-kind" value="blank" data-mchg="kind"${pre ? "" : " checked"}><span><b>Blank</b><span>Authored text you write</span></span></label>
        <label class="se-opt"><input type="radio" name="se-kind" value="template" data-mchg="kind"${pre === "template" ? " checked" : ""}><span><b>A template</b><span>Headings and prompts to fill in</span></span></label>
        <label class="se-opt"><input type="radio" name="se-kind" value="live" data-mchg="kind"${pre === "live" ? " checked" : ""}><span><b>Live data</b><span>A table that reads from WS-X90's records</span></span></label></fieldset>
      <div class="ak-field" id="se-add-tpl"${pre === "template" ? "" : " hidden"}><label for="se-add-t">Template</label><select class="se-in" id="se-add-t" data-mchg="tpl">${D.templates.filter((t) => t !== "Blank section").map((t) => `<option>${esc(t)}</option>`).join("")}</select></div>
      <div class="ak-field" id="se-add-live" hidden><label for="se-add-l">Live data</label><select class="se-in" id="se-add-l" data-mchg="live">${LIVE_KINDS.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("")}</select></div>
      <div class="ak-field"><label for="se-add-name">Name</label><input class="se-in" id="se-add-name" value="${pre === "template" ? esc(D.templates[1]) : "New section"}" data-autofocus></div>
      <div class="ak-field"><label for="se-add-pos">Position</label><select class="se-in" id="se-add-pos">${numbered.map((s) => `<option value="${s.id}"${s === last ? " selected" : ""}>After ${esc(N[s.id] + " " + s.t)}</option>`).join("")}</select></div></div>`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-mact="add">Add section</button>` };
  };
  function templateHTML(name) {
    const P = { "Continuous monitoring strategy": [["Cadence", "What is checked monthly, quarterly and annually."], ["Reporting", "Who receives the results, and how fast."]], "Contingency plan summary": [["Recovery", "How each subsystem comes back, and how long it takes."]], "Incident response summary": [["Reporting", "How incidents reach the CSSP, and how fast."]], "Supply chain risk management": [["Suppliers", "Who supplies each LRU, and what they deliver with it."]], "Privacy summary": [["Data held", "What personal data the system holds, if any."]], "Cyber resiliency approach": [["Approach", "The goals and techniques chosen for SA-24."]], Acronyms: [["Terms", "Each acronym the SSP uses, with its meaning."]] }[name] || [["Overview", "What this section covers."]];
    return P.map(([hh, ph]) => `<h3>${esc(hh)}</h3><p data-ph="${esc(ph)}"><br></p>`).join("");
  }
  function addSection() {
    const kind = (MODAL.querySelector('input[name="se-kind"]:checked') || {}).value || "blank", nameEl = MODAL.querySelector("#se-add-name"), name = nameEl.value.trim();
    if (!name) { nameEl.focus(); nameEl.setAttribute("aria-invalid", "true"); return toast("Give the section a name"); }
    const after = MODAL.querySelector("#se-add-pos").value, id = "x" + ++ST.seq, s = { id, t: name, kind: "custom" };
    if (kind === "template") { s.template = MODAL.querySelector("#se-add-t").value; ST.secHTML[id] = templateHTML(s.template); }
    if (kind === "live") { s.live = MODAL.querySelector("#se-add-l").value; s.kind = "data"; }
    ST.secs.splice(ST.secs.findIndex((x) => x.id === after) + 1, 0, s);
    log({ what: `Section added: ${name}${s.template ? ", from a template" : s.live ? ", live data" : ""}`, at: id, kind: "section" }, true);
    closeModalNow(); rerenderPage(); renderOutline();
    setTimeout(() => { goTo(id); const ed = $(`#se-s-${id} [data-ed]`); if (ed && !s.live) ed.focus({ preventScroll: true }); }, 40);
    toast(`Added ${where(id)}`);
  }
  M["se-acceptall"] = (scope) => { const list = bulkPending(scope || "all"); return { title: `Accept ${plural(list.length, "AI draft")}`, body: `<div class="se-dlg"><p class="ak-desc">Each control's narrative will be replaced in its record by the AI draft, as if you had written it. Each replacement is a new record revision, logged as accepted by you; revision 2 keeps the old text.</p><div class="se-dk">Controls <span class="num">${list.length}</span></div><div class="se-codes">${list.map((g) => `<span class="ak-code">${esc(g.at)}</span>`).join("")}</div></div>`, footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-mact="acceptall" data-id="${esc(scope || "all")}" data-close-modal>Replace ${plural(list.length, "narrative")}</button>` }; };
  M["se-detach"] = (at) => { const s = secById(at); return { title: "Detach from the record?", body: `<div class="se-dlg"><p class="ak-desc">${esc(where(at))} keeps today's values as text you can edit, and stops updating from its record. You can reattach it later; edits to the text are then replaced by the record's values.</p></div>`, footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-mact="detach" data-id="${esc(at)}" data-close-modal>Detach ${esc(s ? "section " + nums()[s.id] : "")}</button>` }; };
  M["se-rechist"] = (at) => {
    const c = D.ctl(at), sess = D.session.filter((e) => e.at === at && (e.kind === "edit" || e.kind === "accept"));
    if (c) {
      const o = ORIG.get(at), rows = sess.map((e, i) => `<li><b>Record revision ${c.rv - i}</b><span>${esc(e.what)} · ${esc(e.who)} · ${esc(U.when(e.time))}</span><span class="se-this">This session</span></li>`);
      if (c.was) rows.push(`<li><b>Record revision ${o.rv}</b><span>Status and narrative · Priya Raghavan · Nov 13</span><p class="se-red">${U.diff(c.was.n, o.n)}</p></li>`);
      rows.push(`<li><b>Record revision ${c.was ? o.rv - 1 : o.rv}</b><span>${c.was ? `${esc(D.IMPL[c.was.s][0])} · the text SSP revision 2 published` : "Recorded Nov 13, 2026"}</span></li>`);
      return { title: `${at} implementation history`, body: `<div class="se-dlg"><p class="ak-desc">The SSP shows ${esc(at)}'s latest record revision. An edit made here is a new revision of the record.</p><ol class="se-hist">${rows.join("")}</ol></div>`, footer: `<button type="button" class="btn" data-go="ssp-history" style="margin-inline-end:auto">${I("history")}Open version history</button><button type="button" class="btn" data-close-modal>Close</button>` };
    }
    const sx = D.session.filter((e) => e.at === at);
    return { title: `${where(at)}: record history`, body: `<div class="se-dlg"><p class="ak-desc">This section reads from its record and was last synced 2 minutes ago. Changes are kept on the record; the SSP's own edits are in its version history.</p><ol class="se-hist">${sx.length ? sx.map((e) => `<li><b>${esc(e.what)}</b><span>${esc(e.who)} · ${esc(U.when(e.time))}</span><span class="se-this">This session</span></li>`).join("") : "<li><b>No edits in this revision</b><span>Synced from the record</span></li>"}</ol></div>`, footer: `<button type="button" class="btn" data-go="ssp-history" style="margin-inline-end:auto">${I("history")}Open version history</button><button type="button" class="btn" data-close-modal>Close</button>` };
  };
  M["se-source"] = (at) => { const c = D.ctl(at) || { n: "" }; return { title: `Review the source change on ${at}`, body: `<div class="se-dlg"><dl class="se-kv"><dt>Component</dt><dd>Mission Computer · LRU-001</dd><dt>Version</dt><dd>${AK.change("Version 1", "Version 2")}</dd><dt>Published</dt><dd>Nov 12, 2026</dd><dt>Leaves to review</dt><dd>${AK.codes(SRC_CHANGED)}</dd></dl><p class="ak-desc">Version 2 fixes the open CVE and lists ${esc(at)} as affected, so this narrative, written against version 1, waits for someone to confirm it still holds.</p><div class="se-dk">${esc(at)} narrative today</div><blockquote class="se-quote">${esc(c.n)}</blockquote></div>`, footer: `<button type="button" class="btn" data-mact="editnarr" data-id="${esc(at)}" data-close-modal style="margin-inline-end:auto">${I("pen")}Edit the narrative</button><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-mact="reviewed" data-id="${esc(at)}" data-close-modal>Mark reviewed</button>` }; };
  M["se-params"] = () => ({ title: "Set AC-2(3)'s parameters", body: `<div class="se-dlg"><p class="ak-desc">The narrative says 72 hours and 90 days, but WS-X90's program tailoring sets neither value, so the assessor can't test against them. Setting them adds them to the tailoring, the baseline's last layer.</p>
      <div class="ak-field"><label for="se-p1">AC-2(3) time period before an account is disabled</label><input class="se-in" id="se-p1" value="72 hours" data-autofocus></div>
      <div class="ak-field"><label for="se-p2">AC-2(3)d inactivity period</label><input class="se-in" id="se-p2" value="90 days"></div>
      <div class="ak-field"><label for="se-p3">Rationale <span class="req">Required</span></label><textarea class="se-in" id="se-p3" rows="2">CNSSI 1253 values, as the narrative states.</textarea></div></div>`,
    footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-mact="params" data-close-modal>Set parameters</button>` });
  M["se-checklist"] = (kid) => { const k = D.checks.find((x) => x.id === kid) || D.checks[1]; return { title: k.title, body: `<div class="se-dlg"><p class="ak-desc">${esc(k.detail)}</p><div class="sd-tablebox se-dtable"><table class="sd-table"><thead><tr><th scope="col">Control</th><th scope="col">Title</th><th scope="col">SSP says</th><th scope="col">Assessor found</th></tr></thead><tbody>${k.codes.map((code) => { const c = D.ctl(code); return `<tr><td><button type="button" class="ak-code se-codeb" data-mact="jump" data-at="${esc(code)}" data-close-modal>${esc(code)}</button></td><td>${esc(c.t)}</td><td>${h.pill(D.IMPL[c.s][1], D.IMPL[c.s][0])}</td><td>${h.pill(D.STATUS[c.cs][1], D.STATUS[c.cs][0])}</td></tr>`; }).join("")}</tbody></table></div></div>`, footer: `<button type="button" class="btn" data-close-modal>Close</button>` }; };
  M["se-insctl"] = () => ({ title: "Insert a control implementation", body: `<div class="se-dlg"><p class="ak-desc">The block reads the control's record and shows its latest narrative and statuses.</p><div class="ak-field"><label for="se-ic">Control</label><select class="se-in" id="se-ic" data-autofocus>${D.families.map((f) => `<optgroup label="${esc(famName(f))} (${f.f})">${D.ofFamily(f.f).map((c) => `<option value="${esc(c.c)}">${esc(c.c + " " + c.t)}</option>`).join("")}</optgroup>`).join("")}</select></div></div>`, footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-mact="insctl" data-close-modal>Insert</button>` });
  M["se-upload"] = (label) => ({ title: label || "Upload an image", body: `<div class="se-dlg"><div class="ak-drop">${I("upload")}Drop a PNG, SVG or PDF here, up to 10 MB</div><p class="se-small">An uploaded figure is kept with this revision of the SSP; it does not update from the records.</p></div>`, footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-mact="pick" data-close-modal>${I("upload")}Choose a file</button>` });
  M["se-link"] = () => ({ title: "Insert link", body: `<div class="se-dlg"><div class="ak-field"><label for="se-ln-t">Text</label><input class="se-in" id="se-ln-t" value="${esc(ST.lastRange ? ST.lastRange.toString().slice(0, 120) : "")}" readonly></div><div class="ak-field"><label for="se-ln-u">Link</label><input class="se-in" id="se-ln-u" value="https://" data-autofocus></div></div>`, footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-mact="link" data-close-modal>Apply</button>` });
  M["se-people"] = () => ({ title: "People in this document", body: `<div class="se-dlg"><ul class="se-plist">${OTHERS.map((p) => `<li>${U.av(p.name, 28)}<span class="se-pl-n"><b>${esc(p.name)}</b><span>${esc(p.role)} · ${esc(presenceLine(p.name))}</span></span><span class="btns"><button type="button" class="btn sm" data-mact="pgoto" data-name="${esc(p.name)}" data-close-modal>Go to</button><button type="button" class="btn sm" data-mact="pfollow" data-name="${esc(p.name)}" data-close-modal>Follow</button></span></li>`).join("")}<li>${U.av(ME, 28)}<span class="se-pl-n"><b>${ME} (you)</b><span>${ME_ROLE} · Editor</span></span></li></ul><label class="se-sw"><input type="checkbox" role="switch" data-mchg="sim"${ST.sim.on ? " checked" : ""}><span class="se-sw-t" aria-hidden="true"></span><span>Simulated collaborators</span></label></div>` , footer: `<button type="button" class="btn" data-close-modal>Close</button>` });
  const MACT = {
    invite: () => { const i = MODAL.querySelector("#se-inv-in"), v = i.value.trim(), role = MODAL.querySelector("#se-inv-role").value; if (!v) { i.focus(); return toast("Type a name or an email first"); } ST.share.invited.push([v, role]); MODAL.querySelector(".dlg-b").innerHTML = shareBody(); toast(`Invited ${v} to ${verb[role]}`); const n = MODAL.querySelector("#se-inv-in"); if (n) n.focus(); },
    copy: () => toast("Link copied"),
    add: () => addSection(),
    acceptall: (b) => setTimeout(() => acceptAll(b.dataset.id), 0),
    detach: (b) => { const at = b.dataset.id; ST.detached.add(at); setTimeout(() => { refreshSec(at); renderOutline(); }, 0); log({ what: "Detached from its record", at }); toast(`${where(at)} is detached: its values stay as text`); },
    reviewed: (b) => setTimeout(() => reviewSource(b.dataset.id, "reviewed"), 0),
    editnarr: (b) => setTimeout(() => { goTo(b.dataset.id); const n = $(`#se-page ${sel(b.dataset.id)} .se-n`); if (n) n.focus({ preventScroll: true }); }, 0),
    params: () => setTimeout(() => { ST.paramsSet = true; refreshCtl("AC-2(3)"); log({ what: "AC-2(3) parameters set in the program tailoring", at: "AC-2(3)" }); renderOutline(); if (ST.side === "assist") renderAssist(); toast("Set in WS-X90's program tailoring: 72 hours and 90 days"); }, 0),
    jump: (b) => setTimeout(() => goTo(b.dataset.at), 0),
    insctl: () => { const code = MODAL.querySelector("#se-ic").value, c = D.ctl(code); setTimeout(() => insertBlock(snip(`${code} implementation · record revision ${c.rv}`, `<p class="se-snip-h"><b class="se-code">${esc(code)}</b> ${esc(c.t)} ${h.pill(D.IMPL[c.s][1], D.IMPL[c.s][0])} ${h.pill(D.STATUS[c.cs][1], D.STATUS[c.cs][0])}</p><p class="sd-p">${esc(c.n)}</p>`), `${code} implementation`), 0); },
    link: () => { const url = MODAL.querySelector("#se-ln-u").value.trim(); setTimeout(() => { if (!url || url === "https://") return toast("Type a link first"); if (ST.lastAuth) ST.lastEd = ST.lastAuth; execCmd("createLink", url); toast("Link added"); }, 0); },
    pick: () => toast("Your file picker would open here: PNG, SVG or PDF, up to 10 MB"),
    pgoto: (b) => setTimeout(() => goToPerson(b.dataset.name), 0),
    pfollow: (b) => setTimeout(() => startFollow(b.dataset.name), 0),
  };
  if (MODAL) {
    MODAL.addEventListener("click", (e) => { const b = e.target.closest("[data-mact]"); if (!b || !MODAL.querySelector(".se-dlg") || !MACT[b.dataset.mact]) return; MACT[b.dataset.mact](b, e); }, true);
    MODAL.addEventListener("change", (e) => {
      const t = e.target, k = t.dataset && t.dataset.mchg; if (!k || !MODAL.querySelector(".se-dlg")) return;
      if (k === "acc") { ST.share.access[t.dataset.name] = t.value; toast(`${t.dataset.name} can now ${verb[t.value]}`); }
      else if (k === "link") { ST.share.link = t.checked; MODAL.querySelector(".dlg-b").innerHTML = shareBody(); const n = MODAL.querySelector('[data-mchg="link"]'); if (n) n.focus(); toast(t.checked ? "Anyone in the workspace with the link can comment" : "Only the people with access can open the SSP"); }
      else if (k === "kind") { MODAL.querySelector("#se-add-tpl").hidden = t.value !== "template"; MODAL.querySelector("#se-add-live").hidden = t.value !== "live"; const nm = MODAL.querySelector("#se-add-name"); nm.value = t.value === "template" ? MODAL.querySelector("#se-add-t").value : t.value === "live" ? MODAL.querySelector("#se-add-l").selectedOptions[0].textContent : "New section"; }
      else if (k === "tpl" || k === "live") MODAL.querySelector("#se-add-name").value = t.selectedOptions[0].textContent;
      else if (k === "sim") setSim(t.checked);
    });
  }
})();
