// Builder B (sh-): the SSP's version history, review and submit with approvals, and the register of system security plans.
// Routes: ssp-history and ssp-review (full window), ssps with ssps-drafts, ssps-review and ssps-published (in the shell).
// Reads window.PA.SSP (mod-a-ssp-data.js) and the after kit (window.PA.AK).
// Real: version v37 (the six changes since published revision 2), revisions, roles, checks, and the other systems' SSP revisions
// (local database, read only, Nov 17). Example: every other version inside revision 3, its earlier texts, comments and approvals.
(function () {
  const PA = window.PA;
  const D = PA && PA.SSP, AK = PA && PA.AK;
  if (!D || !AK) return;
  const { S, P, M, ROUTE_NAV, h } = PA;
  const U = D.ui, esc = U.esc;
  if (PA.fullWindow) PA.fullWindow("ssp");
  ["ssps", "ssps-drafts", "ssps-review", "ssps-published"].forEach((r) => { ROUTE_NAV[r] = "ssps"; });

  const ME = "Ingrid Solberg", PRIYA = "Priya Raghavan", MARCUS = "Marcus Ryde";
  const PLACE = /satisfies the tailored intent/;
  const RANK = { not_implemented: 0, planned: 1, partial: 2, implemented: 3 };
  const EXB = '<span class="ex">Example</span>';
  const $ = (s, r = document) => r.querySelector(s);
  const route = () => (location.hash || "#home").slice(1);
  const reduce = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const narrow = () => !!(window.matchMedia && window.matchMedia("(max-width: 900px)").matches);
  const toast = (t) => U.toast(t);
  const plural = (n, one, many) => `${h.fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const dLong = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const TODAY_MD = AK.md(D.now().slice(0, 10));
  const sv = (d) => `<svg class="ak-i" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const I = {
    lock: sv("M4.5 7.5h7v6h-7zM6 7.5V5.5a2 2 0 0 1 4 0v2"),
    branch: sv("M5 2.5v11M11 2.5v3c0 2.5-2 3.5-6 4"),
    archive: sv("M2.5 3.5h11v3h-11zM3.5 6.5v6.5h9V6.5M6.5 9h3"),
    up: sv("M8 12.5v-9M4.5 7 8 3.5 11.5 7"),
    dn: sv("M8 3.5v9M4.5 9 8 12.5 11.5 9"),
    dl: sv("M8 2.5v7.5M5 7l3 3 3-3M3 13.5h10"),
    list: sv("M3 4h10M3 8h10M3 12h6"),
    cmp: sv("M5.5 2.5v11M10.5 2.5v11M2.5 5h6M7.5 11h6"),
    info: sv("M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM8 7.5v3.5M8 5.2h.01"),
    file: sv("M4 2.5h5l3 3v8H4zM9 2.5v3h3"),
  };
  const dot = (n) => `<span class="sh-dot" ${U.c(n)} aria-hidden="true"></span>`;
  const whoLine = (names) => names.map((n) => `<span class="sh-who">${dot(n)}${esc(n)}</span>`).join("");
  const roleOf = (k) => (D.roles.find((r) => r[0] === k) || [])[2] || "";
  const ISSM = roleOf("security_manager") || "Joel Barrantes", AO = roleOf("authorizing_official") || "R. Calloway";
  const closeModal = () => { const x = $("#modal .dlg-h [data-close-modal]"); if (x) x.click(); };
  const sel$ = (attr, v) => `[${attr}="${window.CSS && CSS.escape ? CSS.escape(v) : v}"]`;

  // ——— The snapshot taken as the module loads, before any edit: session versions compare against it ———
  const SNAP = {
    ctl: new Map(D.controls.map((c) => [c.c, { n: c.n, s: c.s, rv: c.rv }])),
    sec: new Map(D.sections.map((s) => [s.id, (s.text || []).slice()])),
    rationale: (D.system && D.system.rationale) || "",
  };

  // Earlier texts behind the example versions (marked Example wherever they show).
  const EX_AC2 = "The SYS-WSX90 satisfies the tailored intent of AC-2 through system-level procedures and component implementations.";
  const EX_IA21 = "Privileged access to WS-X90 runs through two enforcement points. The Platform Management Controller (LRU-013) and the Maintenance Access Gateway (LRU-014) require both factors: a hardware credential held in the Cryptographic Services Module (LRU-003) and an operator PIN. There is no reduced-privilege fallback session, so a single-factor attempt ends at refusal, and every refusal reaches the security log.";
  const EX_S5 = ["The boundary is SYS-WSX90 and everything inside it: six subsystems and their elements. The Maintenance Laptop and the Provisioning Workstation sit inside the boundary wherever they are; identity services come from outside it."];
  const DESC = { "LRU-018": "Collects every element's security log and forwards it over syslog/TLS", "LRU-020": "Holds the signed baselines and images; rejects an unsigned check-in" };

  // ——— Module state: survives route changes within the session ———
  const UI = { sel: null, compare: false, cmpFrom: "r2", cmpTo: null, named: false, show: true, folds: new Set(), fams: new Set(), det: new Set(), names: new Map(), restoreSrc: new WeakMap(), sheet: false, pop: false, jump: null, hit: -1 };
  const RV = { state: "draft", comment: "", err: false, blocker: false, asDraft: false, at: null, key: null, summary: null };
  const inReview = () => RV.state === "submitted" || RV.state === "approved";
  // v2 C2 (B5): the review state is written to the shared state, so My work, the Review queue and Authorization read the same
  // thing this page shows; a reload or another screen's redraw keeps it (PA.v2hubs restores it, PA.v2.reset clears it).
  const pubRV = () => { const V2 = PA.v2; if (!V2) return; V2.set("ssp.rev3", { state: RV.state, at: RV.at, asDraft: RV.asDraft, comment: RV.comment, key: RV.key, day: (RV.at || D.now()).slice(0, 10), when: RV.at ? U.when(RV.at) : "" }); };
  PA.sspReview = { restore: (o) => { if (o && o.state) Object.assign(RV, { state: o.state, at: o.at || null, asDraft: !!o.asDraft, comment: o.comment || RV.comment, key: o.key || null }); else Object.assign(RV, { state: "draft", at: null, asDraft: false, key: null }); } };

  // ——— The version model: a state is a map of target ("c:CODE" or "s:ID") → value; versions apply effects ———
  const tKind = (t) => t.slice(0, 1), tId = (t) => t.slice(2);
  function defaultVal(t) {
    const id = tId(t);
    if (tKind(t) === "c") { const c = SNAP.ctl.get(id) || D.ctl(id) || { n: "", s: "planned" }; return { n: c.n, s: c.s }; }
    if (id === "s2") return { present: true, text: SNAP.rationale ? [SNAP.rationale] : [] };
    if (SNAP.sec.has(id)) return { present: true, text: SNAP.sec.get(id).slice() };
    const s = D.sec(id);
    return { present: false, text: s && s.text ? s.text.slice() : [] };
  }
  const getVal = (st, t) => (st && st.get(t)) || defaultVal(t);
  const same = (a, b) => a.n === b.n && a.s === b.s && !!a.present === !!b.present && (a.text || []).join("\n") === (b.text || []).join("\n") && JSON.stringify(a.desc || {}) === JSON.stringify(b.desc || {});
  function baseState() { // published revision 2, as signed
    const st = new Map(), put = (t, v) => st.set(t, Object.assign(defaultVal(t), v, { by: null }));
    for (const code of D.changed) { const c = D.ctl(code); if (c && c.was) put("c:" + code, { n: c.was.n, s: c.was.s, ex: false }); }
    put("c:AC-2", { n: EX_AC2, ex: true });
    put("c:IA-2(1)", { n: EX_IA21, ex: true });
    put("s:s5", { text: EX_S5.slice(), ex: true });
    put("s:s8", { desc: {}, ex: true });
    put("s:s12", { present: false, ex: true });
    put("s:s13", { present: false, ex: true });
    return st;
  }
  const cur = (code) => { const c = SNAP.ctl.get(code); return { n: c.n, s: c.s }; };
  const DATA_EFF = {
    v37: () => D.changed.map((code) => ({ t: "c:" + code, v: cur(code), by: PRIYA, ex: false })), // real
    v38: () => [{ t: "s:s12", v: { present: true }, by: PRIYA, ex: true }, { t: "s:s13", v: { present: true }, by: PRIYA, ex: true }],
    v39: () => [{ t: "s:s8", v: { desc: Object.assign({}, DESC) }, by: MARCUS, ex: true }],
    v40: () => [{ t: "s:s5", v: { text: SNAP.sec.get("s5").slice() }, by: PRIYA, ex: true }, { t: "c:IA-2(1)", v: cur("IA-2(1)"), by: MARCUS, ex: true }],
    now: () => [{ t: "c:AC-2", v: cur("AC-2"), by: PRIYA, ex: true }],
  };
  function sessionEff(e) { // the reader's own edit: the current text against the text at page load
    if (!e.at || e.kind === "comment" || e.kind === "submit" || e.kind === "restore") return [];
    const who = e.who || ME, c = D.ctl(e.at);
    if (c) return [{ t: "c:" + e.at, v: { n: c.n, s: c.s }, by: who, ex: false }];
    const s = D.sec(e.at);
    if (e.at === "s2") { const txt = D.system.rationale ? [D.system.rationale] : (s && s.text) || []; return [{ t: "s:s2", v: { present: true, text: txt.slice() }, by: who, ex: false }]; }
    return s ? [{ t: "s:" + e.at, v: { present: true, text: (s.text || []).slice() }, by: who, ex: false }] : [];
  }
  const V41C = new Set(["c2", "c3", "c7"]);
  const T = (iso) => (iso ? new Date(iso.length > 10 ? iso : iso + "T12:00:00").getTime() : -Infinity);
  function buildList() {
    const n = D.session.length;
    const ses = D.session.map((e, i) => {
      const kind = e.kind === "restore" ? "restore" : e.kind === "submit" ? "submit" : "session";
      const cms = e.kind === "comment" && e.at ? [{ id: "x" + i, at: e.at, quote: "", audience: "internal", live: 1, thread: [[e.who || ME, "Security engineer", e.time, e.what]] }] : [];
      return { key: "se" + (n - 1 - i), t: e.time, kind, name: kind === "session" ? null : e.what, who: [e.who || ME], changes: kind === "session" ? [[e.at || null, e.what]] : [], ops: kind === "session" ? 1 : null, ex: false, cms, eff: sessionEff(e), restore: kind === "restore" ? UI.restoreSrc.get(e) || null : null, src: e };
    });
    const dv = D.versions.map((v) => ({ key: v.id, t: v.at, kind: v.kind && v.kind !== "current" ? v.kind : "plain", name: v.name || null, who: v.who || [], by: v.by, ops: v.ops, ex: !!v.ex, real: !!v.real, src: v,
      changes: v.id === "v38" ? v.changes.concat([["s13", "Section added from a template: Continuous monitoring strategy"]]) : v.changes,
      cms: v.id === "v41" ? D.comments.filter((c) => V41C.has(c.id)) : [], eff: DATA_EFF[v.id] ? DATA_EFF[v.id]() : [] }));
    for (const c of D.comments) if (!V41C.has(c.id)) {
      dv.push({ key: "cm-" + c.id, t: c.thread[c.thread.length - 1][2], kind: "plain", name: null, who: [...new Set(c.thread.map((x) => x[0]))], ops: c.thread.length, ex: true, cms: [c], eff: [], src: c,
        changes: [[c.at, c.resolved ? "Comment resolved" : c.thread.length > 1 ? "Comment and reply" : "Comment"]] });
    }
    dv.sort((a, b) => T(b.t) - T(a.t));
    const r1 = D.revisions.find((r) => r.v === 1) || { v: 1, controls: 0, description: "" };
    dv.push({ key: "rev1", t: null, kind: "rev1", name: "Revision 1", who: [], changes: [], ops: null, ex: false, cms: [], eff: [], src: r1 });
    return ses.concat(dv);
  }
  function computeStates(list) {
    const states = new Map();
    let st = baseState();
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i], prev = st;
      let next = prev;
      if (e.kind === "restore" && e.restore && states.has(e.restore)) {
        const src = states.get(e.restore);
        next = new Map(prev);
        for (const t of new Set([...prev.keys(), ...src.keys()])) { const b = getVal(src, t); if (!same(getVal(prev, t), b)) next.set(t, Object.assign({}, b, { by: e.who[0], ex: false })); }
      } else if (e.eff.length) {
        next = new Map(prev);
        for (const f of e.eff) next.set(f.t, Object.assign({}, getVal(next, f.t), f.v, { by: f.by, ex: f.ex }));
      }
      const touched = e.kind === "restore" ? new Set([...prev.keys(), ...next.keys()]) : new Set(e.eff.map((f) => f.t));
      e.chg = [...touched].filter((t) => !same(getVal(prev, t), getVal(next, t)));
      if (e.kind === "restore") e.changes = e.chg.map((t) => [tId(t), "Restored"]);
      states.set(e.key, next);
      st = next;
    }
    return states;
  }

  // ——— Labels ———
  let LIST = [], STATES = new Map();
  const byKey = (k) => LIST.find((e) => e.key === k);
  const nameOf = (e) => UI.names.get(e.key) || e.name;
  const whenOf = (e) => (e && e.t ? U.when(e.t) : "");
  const absWhen = (iso) => { const d = new Date(iso); return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); };
  const atLabel = (at) => { if (!at) return ""; if (D.ctl(at)) return at; const s = D.sec(at); return s ? (/^\d+$/.test(s.n) ? "Section " + s.n : "Appendix " + s.n) : at; };
  const vLabel = (e) => !e ? "" : e.kind === "rev1" ? "Revision 1 (superseded)" : e.kind === "published" ? "Revision 2 (published)" : e === LIST[0] ? "Current · " + whenOf(e) : (nameOf(e) ? nameOf(e) + " · " : "") + whenOf(e);
  function details(e) {
    if (e.kind === "rev1") return `${h.fmt(e.src.controls)} implementations · superseded by revision 2 · its text is not drawn here`;
    if (e.kind === "published") return `Frozen · ${h.fmt((D.revisions.find((r) => r.v === 2) || {}).controls || 0)} implementations at their record revisions as of Jul 25, 2026 · the approvals are kept with the publication`;
    if (e.kind === "start") return `${h.fmt((D.revisions.find((r) => r.v === 3) || {}).controls || 0)} implementations copied from revision 2 · no record written`;
    if (e.kind === "submit") return "Revision 3 locked for review · no record written";
    const p = [];
    if (e.ops != null) p.push(plural(e.ops, "change") + " since the version before");
    if (e.who.length) p.push("edited by " + e.who.join(", "));
    const recs = (e.chg || []).map((t) => {
      const id = tId(t);
      if (tKind(t) === "c") {
        const s0 = SNAP.ctl.get(id) || { rv: 1 };
        if (e.real) return `${id}'s implementation, record revision ${s0.rv - 1} → ${s0.rv}`;
        if (e.kind === "session" || e.kind === "restore") { const live = (D.ctl(id) || {}).rv || s0.rv; return `${id}'s implementation, record revision ${s0.rv} → ${live > s0.rv ? live : s0.rv + 1}`; }
        return `${id}'s implementation, at its next record revision`;
      }
      if (id === "s8") return "the Security Log Collector and Configuration Repository element records, at their next record revision";
      return null;
    }).filter(Boolean);
    p.push("records written: " + (recs.length ? recs.join("; ") : e.cms.length ? "none; comments are kept with the document" : "none; authored text lives in the document"));
    return p.join(" · ");
  }

  // ——— The document at a version (shared sd- classes) ———
  // A rewrite that keeps under half its words reads better as the old text struck and the new text inserted; an edit, word by word.
  const words = (t) => String(t || "").split(/\s+/).filter(Boolean);
  function overlap(a, b) {
    const A = words(a), B = words(b);
    if (!A.length || !B.length) return 0;
    let prev = new Int32Array(B.length + 1);
    for (let i = A.length - 1; i >= 0; i--) { const row = new Int32Array(B.length + 1); for (let j = B.length - 1; j >= 0; j--) row[j] = A[i] === B[j] ? prev[j + 1] + 1 : Math.max(prev[j], row[j + 1]); prev = row; }
    return prev[0] / Math.max(A.length, B.length);
  }
  function redline(a, b, by) {
    if (!a || !b || overlap(a, b) >= 0.5) return U.diff(a, b, by);
    const st = by ? " " + U.c(by) : "";
    return `<del class="sd-del"${st}>${esc(a)}</del> <ins class="sd-ins"${st}>${esc(b)}</ins>`;
  }
  const live = (src, body) => `<div class="sd-live"><div class="sd-live-h"><span class="sd-live-tag">${AK.i("link")}Live data</span><span>${esc(src || "")}</span></div>${body}</div>`;
  const tbl = (head, rows) => `<div class="sd-tablebox"><table class="sd-table">${head ? `<thead><tr>${head.map((x) => `<th scope="col">${esc(x)}</th>`).join("")}</tr></thead>` : ""}<tbody>${rows.map((r) => `<tr>${r.map((x, i) => (!head && i === 0 ? `<th scope="row">${x}</th>` : `<td>${x}</td>`)).join("")}</tr>`).join("")}</tbody></table></div>`;
  const markQ = (html, cms) => cms.reduce((acc, c) => { if (!c.quote) return acc; const q = esc(c.quote), i = acc.indexOf(q); return i < 0 ? acc : acc.slice(0, i) + `<mark class="sd-mark${c.resolved ? " resolved" : ""}">${q}</mark>` + acc.slice(i + q.length); }, html);
  const cmLine = (c) => {
    const [w, role, , text] = c.thread[0], n = c.thread.length - 1;
    const state = c.resolved ? "Resolved" : c.audience === "assessor" ? "With the assessor" : "Internal";
    return `<div class="sh-cm" ${U.c(w)}>${AK.i("chat")}<b>${esc(w)}</b>${role ? `<span class="sh-cm-r">${esc(role)}</span>` : ""}<span class="sh-cm-x">${esc(text)}</span><span class="sh-cm-n">${n ? plural(n, "reply", "replies") + " · " : ""}${state}</span>${c.live ? "" : EXB}</div>`;
  };
  function paras(o) {
    const A = o.a.present ? o.a.text || [] : [], B = o.b.present ? o.b.text || [] : [];
    const out = o.mark ? Array.from({ length: Math.max(A.length, B.length) }, (_, i) => `<p class="sd-p">${redline(A[i] || "", B[i] || "", o.by)}</p>`) : B.map((p) => `<p class="sd-p">${markQ(esc(p), o.cms)}</p>`);
    return out.join("") + o.cms.map(cmLine).join("");
  }
  const shortSub = (name) => String(name).replace(/ Subsystem$/, "");
  function figBoundary() {
    const subs = D.elements.filter((x) => x[2] === "subsystem");
    const boxes = subs.map((s, i) => {
      const x = 22 + (i % 3) * 148, y = 50 + Math.floor(i / 3) * 70, n = D.elements.filter((e) => e[3] === s[0]).length;
      return `<rect class="sh-f-box" x="${x}" y="${y}" width="144" height="54" rx="6"/><text class="sh-f-t" x="${x + 9}" y="${y + 23}">${esc(shortSub(s[1]))}</text><text class="sh-f-s" x="${x + 9}" y="${y + 41}">${n} elements</text>`;
    }).join("");
    return `<figure class="sd-fig sh-fig"><svg viewBox="0 0 660 206" role="img" aria-label="Authorization boundary: SYS-WSX90 holds six subsystems; the corporate identity provider sits outside it">
      <rect class="sh-f-bd" x="8" y="12" width="468" height="186" rx="10"/><text class="sh-f-l" x="22" y="34">SYS-WSX90 · authorization boundary</text>${boxes}
      <line class="sh-f-ln" x1="476" y1="147" x2="512" y2="147"/><rect class="sh-f-ext" x="512" y="120" width="140" height="54" rx="6"/><text class="sh-f-t" x="522" y="143">Corporate identity</text><text class="sh-f-s" x="522" y="161">provider · PRG-1013</text></svg></figure>
      <p class="sd-cap">Figure 1. Authorization boundary, drawn from the system tree (27 elements)</p>`;
  }
  function figFlows() {
    const rows = [["Mission planning network", "Protected Network Gateway"], ["Tactical data link", "Tactical Data Radio"], ["Depot maintenance enclave", "Maintenance Access Gateway"]];
    const g = rows.map(([x, y], i) => {
      const yy = 36 + i * 60;
      return `<rect class="sh-f-ext" x="8" y="${yy}" width="178" height="44" rx="6"/><text class="sh-f-t" x="20" y="${yy + 27}">${esc(x)}</text><line class="sh-f-ln" x1="186" y1="${yy + 22}" x2="262" y2="${yy + 22}"/><rect class="sh-f-box" x="262" y="${yy}" width="200" height="44" rx="6"/><text class="sh-f-t" x="274" y="${yy + 27}">${esc(y)}</text><line class="sh-f-in" x1="462" y1="${yy + 22}" x2="500" y2="118"/>`;
    }).join("");
    return `<figure class="sd-fig sh-fig"><svg viewBox="0 0 660 226" role="img" aria-label="Data flows: three outside networks reach the mission computer through three gateways inside the boundary">
      <rect class="sh-f-bd" x="244" y="10" width="408" height="206" rx="10"/><text class="sh-f-l" x="258" y="28">SYS-WSX90</text>${g}<rect class="sh-f-box" x="500" y="96" width="140" height="44" rx="6"/><text class="sh-f-t" x="512" y="123">Mission Computer</text></svg></figure>
      <p class="sd-cap">Figure 2. Architecture and data flows, from the system tree and interconnections ${EXB}</p>`;
  }
  function ctlBlock(code, ctx) {
    const c = D.ctl(code), t = "c:" + code, a = getVal(ctx.base, t), b = getVal(ctx.st, t);
    const mark = ctx.show && ctx.chg.has(t), by = b.by || a.by || null;
    const cms = ctx.show ? ctx.cms.filter((x) => x.at === code) : [];
    const status = mark && a.s !== b.s ? AK.change(D.IMPL[a.s][0], D.IMPL[b.s][0]) : h.pill(D.IMPL[b.s][1], D.IMPL[b.s][0]);
    const textChanged = mark && a.n !== b.n;
    const text = textChanged ? redline(a.n, b.n, by) : markQ(esc(b.n), cms);
    const chg = mark || cms.length > 0;
    const who = mark && by ? `<span class="sh-by">${dot(by)}${esc(by)}</span>` : "";
    return `<div class="sh-blk"${chg ? " data-sh-chg" : ""} data-sh-anchor="${esc(code)}" tabindex="-1"><h5 class="sd-h3"><span class="sd-num">${esc(code)}</span> ${esc(c ? c.t : "")}</h5>
      <div class="sh-st"><span>Implementation status</span>${status}${who}${mark && (a.ex || b.ex) ? EXB : ""}</div>
      <p class="sd-p${!textChanged && PLACE.test(b.n) ? " sd-ph" : ""}">${text}</p>${cms.map(cmLine).join("")}</div>`;
  }
  function sec11(ctx) {
    const touched = new Set();
    for (const t of ctx.chg) if (tKind(t) === "c") touched.add(tId(t));
    if (ctx.show) for (const c of ctx.cms) if (D.ctl(c.at)) touched.add(c.at);
    const total = D.controls.length;
    let out = `<p class="sh-quiet">${touched.size ? `${plural(touched.size, "control")} ${ctx.compare ? "differ between the two versions" : "touched in this version"}; the other ${h.fmt(total - touched.size)} are folded by family.` : `No control changed in this version. Open a family to read its controls.`}</p>`;
    for (const f of D.families) {
      const all = D.ofFamily(f.f), tc = all.filter((c) => touched.has(c.c)), open = UI.fams.has(f.f), rest = all.length - tc.length;
      if (tc.length || open) out += `<h4 class="sd-h2"><span class="sd-num">${esc(f.f)}</span>${esc(f.t)}</h4>` + (open ? all : tc).map((c) => ctlBlock(c.c, ctx)).join("");
      if (rest) out += `<button type="button" class="sh-fam" data-sh-fam="${esc(f.f)}" aria-expanded="${open}">${AK.i("down")}<span>${esc(f.f)} · ${open ? `Fold the ${h.fmt(rest)} unchanged controls` : `${h.fmt(rest)} ${tc.length ? "more " : ""}${rest === 1 ? "control" : "controls"} unchanged`}</span></button>`;
    }
    return out;
  }
  const SEC = {
    s1: (ctx, o) => { const y = D.system; return live(o.s.src, tbl(null, [["System", `${esc(y.code)} · ${esc(y.name)}`], ["Type", esc(y.type)], ["Lifecycle", esc(y.lifecycle)], ["Authorization", esc(y.authorization)], ["Control baseline", esc(y.baseline)], ["Catalog", esc(y.catalog)]])); },
    s2: (ctx, o) => {
      const A = o.a.text || [], B = o.b.text || [];
      const r = o.mark ? redline(A.join(" "), B.join(" "), o.by) : B.length ? esc(B.join(" ")) : `<span class="sd-ph">No rationale recorded</span>`;
      return live(o.s.src, tbl(["Confidentiality", "Integrity", "Availability"], [D.system.cia.map(esc)]) + tbl(null, [[markQ("Categorization rationale", o.cms), r]])) + o.cms.map(cmLine).join("");
    },
    s3: (ctx, o) => live(o.s.src, tbl(["Role", "Name"], D.roles.map((r) => [esc(r[1]), esc(r[2])]))),
    s5: (ctx, o) => paras(o) + figBoundary(),
    s6: () => figFlows(),
    s7: (ctx, o) => live(o.s.src, tbl(["Connects to", "Kind", "Through", "Agreement"], D.interconnections.map((x) => [esc(x.to), esc(x.kind), esc(x.via), esc(x.agreement)]))),
    s8: (ctx, o) => {
      const hw = D.elements.filter((x) => x[4]), name = (code) => shortSub((D.elements.find((x) => x[0] === code) || [])[1] || "");
      const A = o.a.desc || {}, B = o.b.desc || {}, keep = new Set(hw.slice(0, 4).map((x) => x[4]));
      Object.keys(A).concat(Object.keys(B)).forEach((k) => keep.add(k));
      const rows = hw.filter((x) => keep.has(x[4])).map((x) => { const d0 = A[x[4]] || "", d1 = B[x[4]] || ""; return [esc(x[4]), esc(x[1]), esc(name(x[3])), o.mark && d0 !== d1 ? redline(d0, d1, o.by) : esc(d1)]; });
      const more = hw.length - rows.length;
      return live(o.s.src, tbl(["LRU", "Element", "Subsystem", "Description"], rows) + (more ? `<p class="sh-quiet">${plural(more, "more element")} in the system tree</p>` : "")) + (o.mark ? `<p class="sh-quiet">${EXB} The two descriptions are examples.</p>` : "");
    },
    s9: (ctx, o) => live(o.s.src, tbl(["Element", "Protocol", "Port", "Service", "Direction"], D.ppsm.map((r) => r.map(esc)))),
    s10: (ctx, o) => {
      const f = D.families, rows = [];
      for (let i = 0; i < f.length; i += 3) rows.push(f.slice(i, i + 3).flatMap((x) => [`<abbr title="${esc(x.t)}">${esc(x.f)}</abbr>`, `<span class="num">${x.n}</span>`]));
      const total = f.reduce((a, x) => a + x.n, 0);
      return live(o.s.src, `<p class="sd-p">${esc(D.system.baseline)} · ${esc(D.system.catalog)} · <span class="num">${h.fmt(total)}</span> controls in ${f.length} families</p>` + tbl(["Family", "Controls", "Family", "Controls", "Family", "Controls"], rows));
    },
    s11: (ctx) => sec11(ctx),
    a1: (ctx, o) => live(o.s.src, `<p class="sd-p">Identity, authentication and certificate services are inherited from the Corporate identity provider (PRG-1013), a common control provider with its own published SSP.</p>`),
    a2: (ctx, o) => live(o.s.src, tbl(["Item", "Status"], ((PA.data && PA.data.POAM) || []).map(([t, s]) => [esc(t), esc(s)]))),
    a3: (ctx, o) => live(o.s.src, tbl(["Revision", "State", "Date", "Controls"], D.revisions.filter((r) => r.v <= ctx.rev).map((r) => [String(r.v), esc(r.state), r.published ? "Published " + dLong(r.published) : r.started ? "Started " + dLong(r.started) : "", `<span class="num">${h.fmt(r.controls)}</span>`]))),
  };
  function secHtml(s, ctx) {
    const t = "s:" + s.id, a = getVal(ctx.base, t), b = getVal(ctx.st, t);
    const mark = ctx.show && ctx.chg.has(t);
    if (!b.present && !(mark && a.present)) return "";
    const by = b.by || a.by;
    const tag = mark && !a.present && b.present ? `<span class="sh-tag" ${U.c(by)}>Added</span>` : mark && a.present && !b.present ? `<span class="sh-tag" ${U.c(by)}>Removed</span>` : "";
    const cms = ctx.show ? ctx.cms.filter((c) => c.at === s.id) : [];
    const chg = mark || cms.length > 0;
    const o = { s, a, b, mark, by, cms };
    const body = SEC[s.id] ? SEC[s.id](ctx, o) : paras(o);
    const by2 = mark && by ? `<span class="sh-by">${dot(by)}${esc(by)}</span>` : "";
    return `<section class="sh-sec"${chg ? ' data-sh-chg tabindex="-1"' : ""}><h3 class="sd-h1" data-sh-anchor="${esc(s.id)}" tabindex="-1"><span class="sd-num">${esc(s.n)}</span><span>${esc(s.t)}</span>${s.ex ? EXB : ""}${tag}${by2}</h3>${body}</section>`;
  }
  function docHtml(ctx, e) {
    const pub = D.revisions.find((r) => r.v === 2) || {};
    const sub = ctx.compare ? `Comparing ${esc(vLabel(byKey(UI.cmpFrom)))} with ${esc(vLabel(byKey(UI.cmpTo)))}` : ctx.rev === 2 ? `Revision 2 · Published ${pub.published ? dLong(pub.published) : ""} · Frozen` : `Revision 3 · Draft · as of ${esc(whenOf(e))}`;
    let banner = "";
    if (!ctx.compare && e.kind === "published") banner = AK.banner({ tone: "info", text: `<b>Frozen.</b> Revision 2 was published on ${pub.published ? dLong(pub.published) : ""} and can't change. This is the text as signed; restoring it copies the text into a new version of revision 3.` });
    if (!ctx.compare && e.kind === "start") banner = AK.banner({ tone: "info", text: "Revision 3 started here as a copy of published revision 2. Every version above this one is a change to that copy." });
    return `<h2 class="sd-title">${esc(D.doc.title)}</h2><div class="sd-sub">${sub}</div>${banner ? `<div class="sh-banner">${banner}</div>` : ""}${D.sections.map((s) => secHtml(s, ctx)).join("")}`;
  }
  function ctxFor(e) {
    if (UI.compare) {
      const a = STATES.get(UI.cmpFrom), b = STATES.get(UI.cmpTo);
      if (a && b) {
        const chg = new Set([...new Set([...a.keys(), ...b.keys()])].filter((t) => !same(getVal(a, t), getVal(b, t))));
        return { st: b, base: a, chg, cms: [], show: UI.show, rev: UI.cmpTo === "r2" || UI.cmpTo === "rev1" ? 2 : 3, compare: true };
      }
      UI.compare = false;
    }
    const i = LIST.indexOf(e), prev = LIST[i + 1];
    const st = STATES.get(e.key), base = prev ? STATES.get(prev.key) : st;
    return { st, base, chg: new Set(e.chg || []), cms: e.cms || [], show: UI.show, rev: e.kind === "published" || e.kind === "rev1" ? 2 : 3, compare: false };
  }
  function marksOf(ctx) {
    const blocks = new Set([...ctx.chg]);
    if (ctx.show) for (const c of ctx.cms) blocks.add((D.ctl(c.at) ? "c:" : "s:") + c.at);
    return ctx.show ? blocks.size : 0;
  }
  function summaryChips(ctx) {
    let cR = 0, cX = 0, up = 0, down = 0, add = 0, rem = 0, ed = 0, sX = false;
    for (const t of ctx.chg) {
      const a = getVal(ctx.base, t), b = getVal(ctx.st, t), x = !!(a.ex || b.ex);
      if (tKind(t) === "c") { if (x) cX++; else { cR++; if (a.s !== b.s) { if (RANK[b.s] > RANK[a.s]) up++; else down++; } } }
      else { if (x) sX = true; if (!a.present && b.present) add++; else if (a.present && !b.present) rem++; else ed++; }
    }
    const chip = (n, one, many, x) => (n ? `<span class="sh-sc"><b class="num">${h.fmt(n)}</b>${esc(n === 1 ? one : many)}${x ? EXB : ""}</span>` : "");
    const out = chip(cR, "control changed", "controls changed") + chip(up, "status moved up", "statuses moved up") + chip(down, "status moved down", "statuses moved down") + chip(cX, "narrative reworded", "narratives reworded", true) + chip(add, "section added", "sections added", sX) + chip(ed, "section edited", "sections edited", sX) + chip(rem, "section removed", "sections removed", sX);
    return out || `<span class="sh-sc">No differences</span>`;
  }
  function barLabel(e, ctx) {
    if (e.kind === "rev1") return "Revision 1 · Superseded";
    const nC = [...ctx.chg].filter((t) => tKind(t) === "c").length, nS = [...ctx.chg].filter((t) => tKind(t) === "s").length, nM = ctx.cms.length;
    const counts = [nC ? plural(nC, "control") + " changed" : "", nS ? plural(nS, "section") + " changed" : "", nM ? plural(nM, "comment") : ""].filter(Boolean);
    if (e.kind === "published") counts.push("frozen");
    if (!counts.length) counts.push("no changes");
    return [nameOf(e), whenOf(e), e.who.join(", ")].filter(Boolean).concat(counts).join(" · ");
  }
  function barHtml(e, ctx) {
    const n = marksOf(ctx);
    const left = ctx.compare ? `<b>Comparing</b> ${esc(vLabel(byKey(UI.cmpFrom)))} <span class="sh-to">to</span> ${esc(vLabel(byKey(UI.cmpTo)))}` : `${esc(barLabel(e, ctx))}${e.ex ? EXB : ""}`;
    const dis = n ? "" : ` aria-disabled="true" data-why="No changes are marked in this version."`;
    const nav = `<span class="sh-bar-c" aria-live="polite">${n ? plural(n, "change") : "No changes marked"}</span><button type="button" class="btn sm" data-sh-act="${n ? "prev" : "why"}"${dis}>${I.up}Previous change</button><button type="button" class="btn sm" data-sh-act="${n ? "next" : "why"}"${dis}>${I.dn}Next change</button>`;
    const sum = ctx.compare ? `<div class="sh-sum-row">${summaryChips(ctx)}<button type="button" class="btn sm" data-sh-act="cmp-x">${AK.i("x")}Exit compare</button></div>` : "";
    return `<div class="sh-bar"><div class="sh-bar-r"><span class="sh-bar-t"><span class="ak-chip">${AK.i("eye")}Read only</span><span class="sh-bar-l">${left}</span></span><span class="sh-bar-n">${nav}</span></div>${sum}</div>`;
  }

  // ——— The version list (right panel, a sheet at phone width) ———
  const foldable = (e, top) => e !== top && !nameOf(e) && !e.real && (e.kind === "plain" || e.kind === "session");
  const apprRow = (who, role, word, iso) => `<div class="ak-appr-r"><span class="ak-ring sm done"></span>${AK.avatar(who, 20)}<b>${esc(who)}</b><span class="t">${esc(role)}</span><span class="ak-ok">${esc(word)} ${esc(AK.md(iso))}</span></div>`;
  function entryHtml(e, sel, top) {
    const nm = nameOf(e), on = !UI.compare && e.key === sel;
    const tag = UI.compare ? (e.key === UI.cmpFrom ? "From" : e.key === UI.cmpTo ? "To" : "") : "";
    const icon = { published: I.lock, start: I.branch, rev1: I.archive, restore: AK.i("history"), submit: AK.i("send") }[e.kind] || "";
    const time = whenOf(e);
    const flags = [e.kind === "published" ? `<span class="ak-chip">${I.lock}Frozen</span>` : "", e.kind === "rev1" ? h.pill("none", "Superseded") : "", e.real ? AK.chip("Real changes", { tone: "ok" }) : "", e.ex ? EXB : "", tag ? `<span class="sh-ft">${tag}</span>` : ""].join("");
    const l1 = (x, plain) => `<span class="sh-v-l1"><span class="sh-v-n${plain ? " plain" : ""}">${x}</span>${flags}</span>`;
    let head;
    if (e.kind === "rev1") head = l1(`${icon}Revision 1`) + `<span class="sh-v-s">${h.fmt(e.src.controls)} controls</span>`;
    else if (nm) head = l1(`${icon}${esc(nm)}`) + `<span class="sh-v-s">${esc(time)}${e === top ? " · Current version" : ""}</span>`;
    else head = l1(esc(time), true) + (e === top ? `<span class="sh-v-s">Current version</span>` : "");
    const lines = e.changes.slice(0, 6).map(([at, what]) => (at ? `<button type="button" class="sh-cl" data-sh-jump="${esc(at)}" data-sh-of="${esc(e.key)}">${esc(atLabel(at))} · ${esc(what)}</button>` : `<span class="sh-cl">${esc(what)}</span>`)).join("") + (e.changes.length > 6 ? `<span class="sh-cl">+${e.changes.length - 6} more</span>` : "");
    const appr = e.kind === "published" ? `<div class="sh-v-ap">${(e.src.approvals || []).map(([role, name, iso]) => apprRow(name, role, /official/i.test(role) ? "Signed" : "Approved", iso)).join("")}<p class="sh-v-note">${I.lock}Published revisions can't change. Opening it shows the text as signed.</p></div>` : "";
    const rev1 = e.kind === "rev1" ? `<p class="sh-v-note">${esc(e.src.description)}</p>` : "";
    const det = UI.det.has(e.key);
    return `<div class="sh-v${on ? " on" : ""}${nm ? " named" : ""}">
      <button type="button" class="sh-v-main" data-sh-sel="${esc(e.key)}" aria-current="${on ? "true" : "false"}">${head}</button>
      ${e.who.length && e.kind !== "published" ? `<div class="sh-v-w">${whoLine(e.who)}</div>` : ""}${lines ? `<div class="sh-v-c">${lines}</div>` : ""}${appr}${rev1}
      <button type="button" class="sh-dt" data-sh-det="${esc(e.key)}" aria-expanded="${det}">${AK.i("down")}Details</button>${det ? `<p class="sh-dtb">${esc(details(e))}</p>` : ""}</div>`;
  }
  function foldRuns(items, sel, top) {
    let out = "", i = 0;
    while (i < items.length) {
      const e = items[i];
      if (foldable(e, top)) {
        let j = i;
        while (j < items.length && foldable(items[j], top)) j++;
        const run = items.slice(i, j);
        if (run.length >= 3) {
          const rest = run.slice(1), fk = rest[0].key;
          const open = UI.folds.has(fk) || rest.some((x) => x.key === sel || (UI.compare && (x.key === UI.cmpFrom || x.key === UI.cmpTo)));
          out += entryHtml(run[0], sel, top) + `<button type="button" class="sh-more" data-sh-fold="${esc(fk)}" aria-expanded="${open}">${AK.i("down")}${plural(rest.length, "more version")}</button>`;
          if (open) out += `<div class="sh-fold">${rest.map((x) => entryHtml(x, sel, top)).join("")}</div>`;
          i = j;
          continue;
        }
      }
      out += entryHtml(e, sel, top);
      i++;
    }
    return out;
  }
  function listHtml(sel) {
    const top = LIST[0];
    const shown = LIST.filter((e) => !UI.named || e === top || nameOf(e));
    const groups = [];
    for (const e of shown) {
      const g = e.t ? U.group(e.t) : "Earlier";
      let G = groups[groups.length - 1];
      if (!G || G.g !== g) groups.push((G = { g, items: [] }));
      G.items.push(e);
    }
    return groups.map((G) => `<div class="sh-g"><h3 class="sh-g-h">${esc(G.g)}</h3>${foldRuns(G.items, sel, top)}</div>`).join("");
  }
  const toggle = (k, label, on) => `<div class="sh-tg"><span id="sh-tg-${k}">${esc(label)}</span><button type="button" class="sh-sw" role="switch" aria-checked="${on}" aria-labelledby="sh-tg-${k}" data-sh-act="tg-${k}"></button></div>`;
  const howHtml = () => `<div class="sh-how"><button type="button" class="sh-link" data-sh-act="how" aria-expanded="${UI.pop}" aria-controls="sh-how-pop">${I.info}How versions are kept</button>
    <div class="sh-pop" id="sh-how-pop" role="dialog" aria-label="How versions are kept" tabindex="-1"${UI.pop ? "" : " hidden"}><ul>
      <li>Every edit is kept as an operation; a version is a snapshot of them.</li>
      <li>Names mark the versions that matter.</li>
      <li>Restoring adds a new version; nothing is deleted.</li>
      <li>A published revision is frozen.</li>
      <li>A live-data section writes its record at the next record revision, so both histories agree.</li></ul></div></div>`;
  function sideHtml(sel) {
    return `<div class="sh-scrim" data-sh-act="sheet-x"${UI.sheet ? "" : " hidden"}></div>
    <aside class="sh-side${UI.sheet ? " open" : ""}" aria-label="Versions" data-sh-scroll="side">
      <div class="sh-vh"><div class="sh-vh-r"><h2>Versions</h2><button type="button" class="ib sh-side-x" data-sh-act="sheet-x" aria-label="Close versions">${AK.i("x")}</button></div>
        ${toggle("named", "Only named versions", UI.named)}${toggle("show", "Show changes", UI.show)}</div>
      <div class="sh-vl">${listHtml(sel)}</div>
      <div class="sh-vf">${howHtml()}${AK.note("The versions inside revision 3, their earlier texts, comments and authors are invented, except Nov 13, 3:10 PM (the six real changes since revision 2) and the start of revision 3. Revision 2's publication date is real; its approval dates are invented.")}</div>
    </aside>`;
  }

  // ——— ssp-history ———
  function selKey() {
    if (UI.sel && LIST.some((e) => e.key === UI.sel)) return UI.sel;
    const top = LIST[0];
    UI.sel = top.kind === "session" || top.kind === "restore" ? top.key : LIST.some((e) => e.key === "v37") ? "v37" : top.key;
    return UI.sel;
  }
  function historyHtml() {
    LIST = buildList();
    STATES = computeStates(LIST);
    if (!UI.cmpTo || !byKey(UI.cmpTo)) UI.cmpTo = LIST[0].key;
    const top = LIST[0], sel = selKey(), e = byKey(sel) || top, ctx = ctxFor(e);
    const why = UI.compare ? "Leave compare to restore a version." : e === top ? "This is the current version." : e.kind === "rev1" ? "Revision 1's text isn't drawn in this prototype." : inReview() ? "Revision 3 is locked for the ISSM's review." : "";
    const restore = why ? `<button type="button" class="btn sm ink" aria-disabled="true" data-sh-act="why" data-why="${esc(why)}" aria-describedby="sh-why">${AK.i("history")}Restore this version</button>` : `<button type="button" class="btn sm ink" data-modal="sh-restore">${AK.i("history")}Restore this version</button>`;
    const nameWhy = UI.compare ? "Leave compare to name a version." : e.kind === "published" || e.kind === "rev1" ? "A revision's name is fixed." : "";
    const name = `<button type="button" class="btn sm"${nameWhy ? ` aria-disabled="true" data-sh-act="why" data-why="${esc(nameWhy)}"` : ' data-modal="sh-name"'}>${AK.i("pen")}Name this version</button>`;
    const head = `<header class="sh-top">${AK.back("Back to editing", "ssp")}<div class="sh-top-t"><h1>Version history</h1><div class="sh-top-s">${esc(D.doc.title)} · Revision ${D.doc.revision} · ${inReview() ? "In review, locked" : esc(D.doc.state)}</div></div>
      <div class="sh-acts">${why ? `<span class="sh-why" id="sh-why">${esc(why)}</span>` : ""}<button type="button" class="btn sm sh-vbtn" data-sh-act="sheet" aria-haspopup="dialog" aria-expanded="${UI.sheet}">${I.list}Versions</button><button type="button" class="btn sm" data-modal="sh-compare">${I.cmp}Compare</button>${name}${restore}</div></header>`;
    let doc;
    if (e.kind === "rev1" && !UI.compare) {
      doc = AK.empty({ title: "Revision 1 · Superseded", line: `${h.fmt(e.src.controls)} controls. ${e.src.description} Revision 2 replaced it; its text isn't drawn in this prototype.` }).replace(/<\/div>$/, `<button type="button" class="btn sm" data-sh-sel="r2">Open revision 2</button></div>`);
    } else doc = docHtml(ctx, e);
    return `<div class="sh-root">${head}<div class="sh-hb"><div class="sh-docpane" data-sh-scroll="doc">${barHtml(e, ctx)}<div class="sd-desk"><article class="sd-page sh-doc" aria-label="${esc(D.doc.title)}, read only">${doc}</article></div></div>${sideHtml(sel)}</div></div>`;
  }

  // ——— Dialogs: restore, name, compare ———
  const selected = () => byKey(UI.sel) || LIST[0];
  M["sh-restore"] = () => {
    const e = selected();
    return { title: "Restore this version?", body: `<div class="sh-dlg"><p class="ak-desc">Restoring makes a new version from this one. Every version stays in the history.</p>
      <div class="sh-dlg-v">${AK.i("history")}<b>${esc(vLabel(e))}</b><span class="sh-dlg-w">${whoLine(e.who)}</span></div>
      <ul class="sh-dlg-l"><li>Revision 3 stays a draft; the restored text becomes the current version.</li><li>Live-data sections write their records at the next record revision.</li>${e.kind === "published" ? "<li>Revision 2 stays published and frozen.</li>" : ""}</ul></div>`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-sh-act="restore-ok">Restore</button>` };
  };
  M["sh-name"] = () => {
    const e = selected();
    return { title: "Name this version", body: `<div class="sh-dlg"><p class="ak-desc">${esc(vLabel(e))}. A name keeps the version in view when only named versions show.</p>
      <div class="ak-field"><label for="sh-name-in">Name</label><input id="sh-name-in" class="sh-in" type="text" data-sh-focus autocomplete="off" value="${esc(nameOf(e) || "")}" placeholder="For example: Sent to the ISSM" aria-describedby="sh-name-err"><p class="sh-err" id="sh-name-err" hidden></p></div></div>`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-sh-act="name-ok">Save name</button>` };
  };
  M["sh-compare"] = () => {
    if (!LIST.length) { LIST = buildList(); STATES = computeStates(LIST); }
    const opts = (v) => LIST.filter((e) => e.kind !== "rev1").map((e) => `<option value="${esc(e.key)}"${e.key === v ? " selected" : ""}>${esc(vLabel(e))}</option>`).join("");
    return { title: "Compare versions", body: `<div class="sh-dlg"><p class="ak-desc">The second version's text shows with every difference from the first marked.</p>
      <div class="sh-two"><div class="ak-field"><label for="sh-cmp-a">From</label><select id="sh-cmp-a" class="sh-in" data-sh-focus>${opts(UI.cmpFrom || "r2")}</select></div>
      <div class="ak-field"><label for="sh-cmp-b">To</label><select id="sh-cmp-b" class="sh-in">${opts(UI.cmpTo || LIST[0].key)}</select></div></div><p class="sh-err" id="sh-cmp-err" hidden></p></div>`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-sh-act="compare-ok">Compare</button>` };
  };
  function doRestore() {
    const e = selected();
    const label = e.kind === "published" ? "revision 2 (published)" : (nameOf(e) ? nameOf(e) + " (" + absWhen(e.t) + ")" : absWhen(e.t));
    const entry = D.log({ kind: "restore", what: "Restored from " + label, at: null });
    UI.restoreSrc.set(entry, e.key);
    UI.sel = "se" + (D.session.length - 1);
    UI.compare = false;
    closeModal();
    rerender(sel$("data-sh-sel", UI.sel), true);
    toast("Restored as a new version. Every version stays in the history.");
  }
  function doName() {
    const inp = $("#sh-name-in"), err = $("#sh-name-err");
    if (!inp) return;
    const v = inp.value.trim();
    if (!v || v.length > 80) { err.textContent = v ? `Keep the name to 80 characters; this one has ${v.length}.` : "Write a name, or cancel."; err.hidden = false; inp.setAttribute("aria-invalid", "true"); inp.focus(); return; }
    const e = selected();
    UI.names.set(e.key, v);
    closeModal();
    rerender(sel$("data-sh-sel", e.key));
    toast(`Named “${v}”.`);
  }
  function doCompare() {
    const a = $("#sh-cmp-a"), b = $("#sh-cmp-b"), err = $("#sh-cmp-err");
    if (!a || !b) return;
    if (a.value === b.value) { err.textContent = "Choose two different versions."; err.hidden = false; b.focus(); return; }
    UI.cmpFrom = a.value; UI.cmpTo = b.value; UI.compare = true; UI.hit = -1;
    closeModal();
    rerender('[data-sh-act="cmp-x"]', true);
  }

  // ——— ssp-review: submit revision 3 for review ———
  // v2 C2 (B11): a readiness fix opens the editor at the section or control it names, scrolled to and focused there.
  const atEditor = (at) => (at ? `data-v2go="ssp" data-v2q="${esc(JSON.stringify({ at }))}"` : "");
  const k7ok = () => !!(D.system.rationale && String(D.system.rationale).trim()) || ((D.sec("s2") || {}).text || []).some((x) => String(x).trim()) || D.session.some((e) => e.at === "s2" && (e.kind === "accept" || e.kind === "edit"));
  const btnize = (html, map) => Object.keys(map).reduce((acc, label) => acc.replace(new RegExp(`<span class="btn sm( ink)?">${label}</span>`), (m, ink) => `<button type="button" class="btn sm${ink || ""}" data-sh-act="${map[label]}">${label}</button>`), html);
  const aid = (who) => `<p class="sh-aid">${EXB} Walkthrough aid: these buttons play ${esc(who)}'s part.</p>`;
  function stateBlock() {
    const view = `<button type="button" class="sh-link" data-sh-hist="" data-sh-v="${esc(RV.key || "")}" data-go="ssp-history">View</button>`;
    if (RV.state === "submitted") {
      return AK.pendingVersion({ created: `Revision 3 · submitted ${U.when(RV.at)}${RV.asDraft ? " as a draft for ISSM review" : ""}`, requester: ME, approvers: [{ who: ISSM, state: "sent", when: TODAY_MD }] }).replace('<span class="ak-link">View</span>', view)
        + btnize(AK.awaiting(ISSM, ["Approve", "Request changes"]), { Approve: "approve", "Request changes": "changes" }) + aid(ISSM);
    }
    if (RV.state === "approved") {
      const blocked = RV.asDraft && !k7ok();
      return AK.pendingVersion({ created: `Revision 3 · submitted ${U.when(RV.at)}`, requester: ME, approvers: [{ who: ISSM, state: "approved", when: TODAY_MD }, { who: AO, state: "sent", when: TODAY_MD }] }).replace('<span class="ak-link">View</span>', view)
        + (blocked ? AK.banner({ tone: "bad", text: `<b>${esc(AO)} can't sign yet.</b> The categorization has no rationale, and eMASS refuses an SSP without one. <button type="button" class="sh-link" data-go="ssp" ${atEditor("s2")}>Fix in the editor</button>` }) : "")
        + btnize(AK.awaiting(AO, ["Sign"]), { Sign: "sign" }) + aid(AO);
    }
    if (RV.state === "changes") return AK.reasonCard({ question: "Changes requested", reason: "Draft the categorization rationale in section 2 before this goes to the AO; the rest reads well.", who: `${ISSM}, ISSM`, when: TODAY_MD }) + `<p class="sh-aid">${EXB} The ISSM's decision and its reason are a walkthrough aid.</p>`;
    return "";
  }
  function summaryRows() {
    const rows = D.changed.map((code) => { const c = D.ctl(code); return { at: code, v: "v37", text: `${code} ${c.t}: ${D.IMPL[c.was.s][0]} → ${D.IMPL[c.s][0]}, narrative rewritten`, html: `<span class="ak-code">${esc(code)}</span><span class="sh-sl-t">${esc(c.t)}</span>${AK.change(D.IMPL[c.was.s][0], D.IMPL[c.s][0])}` }; });
    rows.push({ at: "s12", v: "v38", text: "Sections 12 and 13 added: Cyber resiliency approach, Continuous monitoring strategy", html: `<span class="sh-sl-t">Sections 12 and 13 added: Cyber resiliency approach, Continuous monitoring strategy</span>${EXB}` });
    rows.push({ at: "s5", v: "v40", text: "Boundary text and inventory edited (sections 5 and 8)", html: `<span class="sh-sl-t">Boundary text and inventory edited, sections 5 and 8</span>${EXB}` });
    rows.push({ at: "IA-2(1)", v: "v40", text: "IA-2(1) and AC-2 narratives reworded", html: `<span class="sh-sl-t">IA-2(1) and AC-2 narratives reworded</span>${EXB}` });
    const n = D.session.length, mine = D.session.filter((e) => e.at && !["submit", "restore", "comment"].includes(e.kind));
    if (mine.length) {
      const where = [...new Set(mine.map((e) => atLabel(e.at)))];
      rows.push({ at: mine[0].at, v: "se" + (n - 1 - D.session.indexOf(mine[0])), text: `This session: ${plural(mine.length, "edit")} by you (${where.join(", ")})`, html: `<span class="sh-sl-t">This session: ${plural(mine.length, "edit")} by you · ${esc(where.slice(0, 4).join(", "))}${where.length > 4 ? " …" : ""}</span>` });
    }
    return rows;
  }
  function summaryCard() {
    const rows = summaryRows();
    const body = RV.summary
      ? `<ul class="sh-sum-ed">${RV.summary.split(/\n+/).filter((l) => l.trim()).map((l) => `<li>${esc(l.replace(/^[•\-*]\s*/, ""))}</li>`).join("")}</ul><p class="sh-aid">Edited by you · <button type="button" class="sh-link" data-sh-act="sum-reset">Use the AI summary again</button></p>`
      : `<ul class="sh-sl-list">${rows.map((r) => `<li><button type="button" class="sh-sl" data-sh-hist="${esc(r.at)}" data-sh-v="${esc(r.v)}" data-go="ssp-history">${r.html}<span class="sh-sl-go">See the change ›</span></button></li>`).join("")}</ul>`;
    return AK.card(`<div class="sh-card-h"><h2>Change summary since revision 2</h2>${AK.chip(RV.summary ? "AI summary, edited by you" : "AI summary · check it before you submit", { icon: "sparkle", tone: "info" })}<span class="sp"></span><button type="button" class="btn sm" data-modal="sh-summary"${inReview() ? ' aria-disabled="true" data-sh-act="why" data-why="The summary went with the submission; withdraw it to edit."' : ""}>${AK.i("pen")}Edit summary</button></div>${body}`);
  }
  M["sh-summary"] = () => {
    const text = RV.summary || summaryRows().map((r) => "• " + r.text).join("\n");
    return { title: "Edit summary", body: `<div class="sh-dlg"><p class="ak-desc">The ISSM reads this first. Keep one change a line.</p><div class="ak-field"><label for="sh-sum-in">Summary</label><textarea id="sh-sum-in" class="sh-ta" rows="10" data-sh-focus>${esc(text)}</textarea></div></div>`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-sh-act="sum-ok">Save summary</button>` };
  };
  function readinessCard() {
    const ok7 = k7ok(), ph = D.controls.filter((c) => PLACE.test(c.n)).length;
    const items = D.checks.map((k) => {
      const blk = k.id === "k7" && !ok7, done = k.id === "k7" && ok7;
      const title = k.id === "k1" ? k.title.replace(/^\d+/, String(ph)) : k.title, action = k.id === "k1" ? k.action.replace(/\d+/, String(ph)) : k.action;
      return { k, blk, done, title, action, rank: blk ? 0 : done ? 9 : k.sev === "high" ? 1 : k.sev === "medium" ? 2 : 3 };
    }).sort((a, b) => a.rank - b.rank);
    const nb = items.filter((x) => x.blk).length, nw = items.filter((x) => !x.blk && !x.done).length;
    const sev = { high: "High", medium: "Medium", low: "Low" };
    const li = (x) => `<li class="${x.blk ? "blk" : x.done ? "done" : ""}">${h.gl(x.blk ? "diamond" : x.done ? "check" : x.k.sev === "low" ? "info" : "clock")}
      <div class="sh-rd-b"><div class="sh-rd-t"><b>${esc(x.title)}</b>${x.blk ? `<span class="sh-rd-tag bad">Blocks submission</span>` : x.done ? `<span class="sh-rd-tag ok">Resolved this session</span>` : `<span class="sh-rd-tag">${sev[x.k.sev] || ""}</span>`}</div><p>${esc(x.blk ? x.k.detail + " eMASS requires one, so this blocks submission." : x.k.detail)}</p></div>
      ${x.done ? "" : `<button type="button" class="btn sm" data-go="ssp" ${atEditor(x.k.at || x.k.codes[0])}>${esc(x.action)}</button>`}</li>`;
    return AK.card(`<div class="sh-card-h"><h2>Readiness</h2><span class="sh-cnt">${nb ? `<b class="sh-bad">${plural(nb, "item")} blocks submission</b> · ` : ""}${plural(nw, "warning")}</span></div><ul class="sh-rd">${items.map(li).join("")}</ul>`, { cls: RV.blocker && !ok7 ? "sh-rd-card on" : "sh-rd-card" });
  }
  function reviewCommentHtml() {
    const help = "What should the ISSM look at first? Say what changed and why.";
    let html = AK.reviewComment({ label: "Review comment", help, primary: "Submit for review" });
    html = html.replace(`<div class="ak-input">${esc(help)}</div>`, `<textarea id="sh-rc" class="sh-ta" rows="4" aria-label="Review comment" aria-required="true" placeholder="${esc(help)}"${RV.err ? ' aria-invalid="true" aria-describedby="sh-rc-err"' : ""}>${esc(RV.comment)}</textarea>${RV.err ? `<p class="sh-err" id="sh-rc-err">Write a review comment for the ISSM before you submit.</p>` : ""}`);
    html = html.replace(/<div class="btns"><span class="btn sm ink">[^<]*<\/span><\/div>/, "");
    return AK.card(html);
  }
  function approversCard() {
    const s = RV.state;
    const st1 = s === "submitted" ? "sent" : s === "approved" ? "approved" : s === "changes" ? "changes" : "waiting", st2 = s === "approved" ? "sent" : "waiting";
    const sub = s === "draft" ? "Two steps, in order. Each approver is emailed when the step starts." : s === "changes" ? "Sent back at step 1. Submit again to restart it." : s === "submitted" ? "Step 1 of 2 is open." : "Step 2 of 2 is open.";
    return `<div class="sh-appr">${AK.approval({ title: "Approvers", sub, steps: [{ label: "Step 1 · ISSM", approvers: [{ who: ISSM, role: "ISSM", state: st1, when: TODAY_MD }] }, { label: "Step 2 · Authorizing official", approvers: [{ who: AO, role: "Authorizing official", state: st2, when: TODAY_MD }] }], note: `Only the holder of the AO role can sign. On WS-X90 that is ${esc(AO)}.` })}
      ${s === "draft" || s === "changes" ? `<button type="button" class="sh-link" data-modal="ak-approvers" data-id="revision 3 of the WS-X90 SSP">${AK.i("user")}Change approvers</button>` : ""}</div>`;
  }
  const nextCard = () => AK.card(`<div class="ak-rail-t">What happens next</div>${AK.steps(["Revision 3 is locked for review", "On the AO's signature it is published and frozen", "Revision 4 starts as the next draft"], inReview() ? 1 : 0)}`);
  const exportCard = () => AK.card(`<div class="ak-rail-t">Export</div><div class="sh-exs">${[["OSCAL SSP", "JSON"], ["Word", ".docx"], ["PDF", ".pdf"], ["eMASS package", "For upload to eMASS"]].map(([n, f]) => `<button type="button" class="sh-exb" data-sh-act="export" data-id="${esc(n)}">${I.dl}<span class="sh-exb-t"><b>${esc(n)}</b><span>${esc(f)}</span></span></button>`).join("")}</div>`);
  function reviewHtml() {
    const s = RV.state, locked = inReview();
    const title = s === "submitted" ? "Revision 3 is with the ISSM" : s === "approved" ? "Revision 3 is with the authorizing official" : "Submit revision 3 for review";
    const started = (D.revisions.find((r) => r.v === 3) || {}).started;
    const actions = locked ? `<button type="button" class="btn sm" data-sh-hist="" data-sh-v="${esc(RV.key || "")}" data-go="ssp-history">${AK.i("history")}Version history</button><button type="button" class="btn sm" data-sh-act="withdraw">Withdraw submission</button>` : `<button type="button" class="btn ink" data-sh-act="submit">${AK.i("send")}Submit for review</button>`;
    const blocker = RV.blocker && !locked && !k7ok() ? `<div class="sh-blocker" tabindex="-1">${AK.banner({ tone: "bad", text: `<b>The categorization has no rationale.</b> eMASS refuses an SSP without one, so the AO can't sign revision 3 until section 2 has it. Submitting anyway sends the draft to the ISSM only; the AO step stays blocked. <span class="sh-bl-a"><button type="button" class="btn sm" data-sh-act="submit-draft">Submit anyway as a draft for ISSM review</button><button type="button" class="btn sm" data-go="ssp" ${atEditor("s2")}>Fix in the editor</button></span>` })}</div>` : "";
    const comment = locked ? AK.card(`<div class="ak-rail-t">Review comment</div>${AK.comment({ who: ME, role: "Security engineer", when: U.when(RV.at), text: esc(RV.comment) })}`) : reviewCommentHtml();
    const note = AK.note("The section bullets of the summary, the approval dates and the ISSM's decisions are invented; the six control changes, the checks, the roles and the revision dates are WS-X90's.");
    return `<div class="sh-rv"><header class="sh-top">${AK.back("Back to editing", "ssp")}<div class="sh-top-t"><h1>${esc(title)}</h1><div class="sh-top-s">${esc(D.doc.title)} · Revision 3 · ${locked ? "In review, locked" : "Draft"}${started ? " · started " + esc(AK.md(started)) : ""}</div></div><div class="sh-acts">${actions}</div></header>
      <div class="sh-rv-b"><div class="sh-rv-m">${stateBlock()}${blocker}${summaryCard()}${readinessCard()}${comment}${note}</div><aside class="sh-rv-r" aria-label="Approval and export">${approversCard()}${nextCard()}${exportCard()}</aside></div></div>`;
  }
  function submit(asDraft) {
    if (!RV.comment.trim()) { RV.err = true; rerender("#sh-rc", false, "reveal"); return; }
    RV.err = false;
    if (!asDraft && !k7ok()) { RV.blocker = true; rerender(".sh-blocker", false, "top"); return; }
    RV.state = "submitted"; RV.asDraft = !k7ok(); RV.blocker = false; RV.at = D.now();
    D.log({ kind: "submit", what: RV.asDraft ? "Submitted as a draft for ISSM review" : "Submitted for ISSM review" });
    RV.key = "se" + (D.session.length - 1);
    pubRV();
    rerender('[data-sh-act="approve"]', false, "top");
    toast(`Submitted for review. ${ISSM} is emailed.`);
  }

  // ——— ssps: the register of system security plans ———
  // Other systems: ssp_revisions joined to systems and programs in tenant 80ad4373…, read Nov 17 (three check fixtures left out).
  // Placeholders: narratives that are placeholder text or empty. Editors: holders of the ISSO, ISSM, system owner and control owner roles.
  const P2101 = [["Nadia Fournier", "ISSO", "Editor"], ["Dan Whitfield", "System owner", "Editor"], ["Ingrid Solberg", "Control owner", "Editor"], ["Amara Bell", "Control owner", "Editor"], ["Sarah Chen", "Program manager", "Viewer"], ["Victor Amsel", "Reviewer", "Commenter"], ["Elena Vasquez", "Lead assessor", "Commenter"]];
  const P2102 = [["Joel Barrantes", "ISSO", "Editor"], ["Hana Lindqvist", "System owner", "Editor"], ["Amara Bell", "Control owner", "Editor"], ["Tom Okafor", "Program manager", "Viewer"], ["Ray Colston", "Lead assessor", "Commenter"]];
  const P2201 = [["Joel Barrantes", "ISSO", "Editor"], ["Wes Duarte", "Program manager", "Viewer"], ["Elena Vasquez", "Lead assessor", "Commenter"]];
  const INIT = "Draft SSP initialized from the program profile adopted at creation.";
  const SYS = [
    { code: "idp-core", name: "Corporate identity provider", prog: "PRG-1013", pname: "Corporate identity provider", ctl: 15, ph: 0, edited: "2026-11-13", people: [], revs: [[1, "published", "2026-04-15", "Common control SSP for the corporate identity provider: the identity, authentication and certificate services other boundaries inherit."]] },
    { code: "atlas-prod", name: "Atlas payments platform", prog: "PRG-1041", pname: "Atlas payments platform", ctl: 16, ph: 10, edited: "2026-09-16", people: [["R. Calloway", "Authorizing official", "Viewer"], ["D. Okafor", "Lead assessor", "Commenter"]], revs: [[1, "draft", "2026-09-12", "Cardholder and settlement processing for the Atlas platform, assessed against the High baseline ahead of the FY27 authorization package."]] },
    { code: "R210-STD-CUSA", name: "R210 Launcher Electronics Unit · Standard · Customer A", prog: "PRG-2101", pname: "Customer A · X800 Rail Integration", ctl: 370, ph: 0, edited: "2026-11-13", people: P2101, revs: [[1, "published", "2026-11-02", INIT]] },
    { code: "X800-A-CUSA", name: "X800 Missile · Lug & Rail Launch · Customer A", prog: "PRG-2101", pname: "Customer A · X800 Rail Integration", ctl: 370, ph: 0, edited: "2026-11-13", people: P2101, revs: [[1, "published", "2026-11-13", INIT], [2, "draft", "2026-11-13", "Working draft. SSP 1 was published as the product seeded it so the delta assessment could be planned. This revision records how the variant implements each control."]] },
    { code: "X800-C-CUSB", name: "X800 Missile · Palletized Launch · Customer B", prog: "PRG-2102", pname: "Customer B · X800 Palletized Integration", ctl: 370, ph: 0, edited: "2026-11-13", people: P2102, revs: [[1, "published", "2026-11-10", INIT], [2, "draft", "2026-11-13", "Working draft. SSP 1 is published; this revision records how the variant implements every control of its baseline."]] },
    { code: "G25-VEH-CUSC", name: "G25 Launch Control Station · Vehicle-Mounted · Customer C", prog: "PRG-2201", pname: "Customer C · G25 Battery Control Fielding", ctl: 287, ph: 0, edited: "2026-11-13", people: P2201, revs: [[1, "published", "2026-10-30", INIT], [2, "draft", "2026-11-13", "Working draft. SSP 1 is published; this revision records how the variant implements every control of its baseline."]] },
    { code: "G40-TRN-CUSC", name: "G40 Ground Terminal · Transportable · Customer C", prog: "PRG-2201", pname: "Customer C · G25 Battery Control Fielding", ctl: 287, ph: 0, edited: "2026-11-13", people: P2201, revs: [[1, "published", "2026-11-05", INIT]] },
  ];
  function wsRow() {
    const r = (v) => D.revisions.find((x) => x.v === v) || {};
    const people = D.people.map((p) => [p.name, p.role, p.access]).concat(D.access);
    const lastEdit = D.session.find((e) => ["edit", "accept", "section", "restore"].includes(e.kind));
    const lastIso = lastEdit ? lastEdit.time : (D.versions[0] || {}).at;
    return { ws: 1, code: D.system.code, name: D.system.name, prog: D.program.code, pname: D.program.name, ctl: r(3).controls || 0, ph: D.controls.filter((c) => PLACE.test(c.n)).length, editedIso: lastIso, people,
      revs: [[1, "superseded", null, r(1).description || ""], [2, "published", r(2).published, r(2).description || ""], [3, inReview() ? "review" : "draft", r(3).started, r(3).description || ""]] };
  }
  const regRows = () => [wsRow()].concat(SYS);
  const curRev = (r) => r.revs[r.revs.length - 1];
  const lastPub = (r) => r.revs.filter((x) => x[1] === "published").pop();
  const statePill = (s) => (s === "published" ? h.pill("ok", "Published") : s === "review" ? h.pill("warn", "In review") : s === "superseded" ? h.pill("none", "Superseded") : h.pill("none", "Draft"));
  const editorsOf = (r) => r.people.filter((p) => p[2] === "Editor").map((p) => p[0]);
  function approvalCell(r) {
    if (r.ws && RV.state === "submitted") return `<span class="sh-ap warn">${AK.i("clock")}ISSM review · ${esc(TODAY_MD)}</span>`;
    if (r.ws && RV.state === "approved") return `<span class="sh-ap warn">${AK.i("clock")}AO review · ${esc(TODAY_MD)}</span>`;
    if (r.ws && RV.state === "changes") return `<span class="sh-ap bad">${AK.i("flag")}Changes requested</span>`;
    const c = curRev(r);
    if (c[1] === "published") return `<span class="sh-ap ok">${AK.i("check")}Published ${esc(AK.md(c[2]))}</span>`;
    return `<span class="sh-ap"><span class="ak-ring sm"></span>Not submitted</span>`;
  }
  const lastEdited = (r) => (r.ws ? (r.editedIso ? U.when(r.editedIso) : "") : AK.md(r.edited));
  function regHtml(tab) {
    const rows = regRows(), st = (r) => curRev(r)[1];
    const counts = { all: rows.length, drafts: rows.filter((r) => st(r) === "draft").length, review: rows.filter((r) => st(r) === "review").length, published: rows.filter((r) => st(r) === "published").length };
    const shown = tab === "all" ? rows : rows.filter((r) => st(r) === (tab === "drafts" ? "draft" : tab));
    const cols = ["System", "Program", "Revision", "State", "Controls", "Placeholders", "Last edited", "Editors", "Approval"];
    const trs = shown.map((r) => { const eds = editorsOf(r); return { id: r.code, cells: [
      `<span class="sh-sys"><span class="ak-code">${esc(r.code)}</span><span class="sh-ell">${esc(r.name)}</span></span>`,
      `<span class="sh-ell sh-pg">${esc(r.pname)}</span>`, `Revision ${curRev(r)[0]}`, statePill(st(r)),
      `<span class="num">${h.fmt(r.ctl)}</span>`, `<span class="num${r.ph ? "" : " sh-mute"}">${h.fmt(r.ph)}</span>`, esc(lastEdited(r)),
      eds.length ? `<span class="sh-eds" title="${esc(eds.join(", "))}" aria-label="Editors: ${esc(eds.join(", "))}">${AK.avatars(eds.slice(0, 4))}${eds.length > 4 ? `<span class="sh-more-n">+${eds.length - 4}</span>` : ""}</span>` : `<span class="sh-mute">None recorded</span>`, approvalCell(r)] }; });
    const table = shown.length ? h.table(cols, trs, shown.length, "ssp") : AK.empty({ title: tab === "review" ? "No SSP is in review" : "Nothing here", line: tab === "review" ? "Submit a draft from its document; it waits here for the ISSM." : "No system has an SSP in this state." }).replace(/<\/div>$/, tab === "review" ? `<button type="button" class="btn sm" data-go="ssp-review">Review WS-X90's revision 3</button></div>` : "</div>");
    const programs = new Set(rows.map((r) => r.prog)).size;
    return `<div class="sh-reg">${h.page(
      AK.indexHead({ title: "System security plans", desc: `One SSP per system, with its revisions: ${rows.length} systems in ${programs} programs.`, actions: `<button type="button" class="btn ink" data-modal="sh-newrev">${AK.i("plus")}New revision</button>` }),
      AK.tabs([["All", counts.all, "ssps", tab === "all"], ["Drafts", counts.drafts, "ssps-drafts", tab === "drafts"], ["In review", counts.review, "ssps-review", tab === "review"], ["Published", counts.published, "ssps-published", tab === "published"]], "System security plans"),
      table,
      AK.note("WS-X90's last edit and its editors' presence are the prototype's. Every other row is the tenant's SSP revisions from the database, with editors from program roles; three check fixtures are left out. Placeholders counts narratives that are placeholder text or empty."))}</div>`;
  }
  P.ssp = (code) => {
    const r = regRows().find((x) => x.code === code);
    if (!r) return null;
    const c = curRev(r), pub = lastPub(r);
    const revs = r.revs.slice().reverse().map(([v, s, iso, desc]) => `<div class="sh-rev"><b>Revision ${v}</b>${statePill(s)}<span class="s">${iso ? (s === "published" ? "Published " : "Started ") + esc(AK.md(iso)) : ""}${s === "published" && pub && pub[0] === v ? " · frozen" : ""}</span>${desc ? `<p class="d">${esc(desc)}</p>` : ""}</div>`).join("");
    const people = r.people.length ? r.people.map(([n, role, acc]) => `<div class="sh-pp">${AK.owner(n)}<span class="s">${esc(role)}</span><span class="ak-chip">${esc(acc)}</span></div>`).join("") : `<p class="sh-quiet">No program roles recorded, so nobody but workspace administrators can edit it.</p>`;
    const acts = r.ws
      ? `<button type="button" class="btn sm ink" data-go="ssp">Open document</button><button type="button" class="btn sm" data-sh-hist="" data-sh-v="" data-go="ssp-history">${AK.i("history")}Version history</button><button type="button" class="btn sm" data-go="ssp-review">${AK.i("send")}Review and submit</button>`
      : `<button type="button" class="btn sm ink" data-sh-act="nodoc">Open document</button>`;
    return { label: "System security plan", body: `<div class="sh-pan"><div class="sh-pan-h"><h4>${esc(r.name)}</h4>${statePill(c[1])}</div>
      <div class="sh-pan-c">${AK.codes([r.code, r.prog])}<span class="s">${esc(r.pname)}</span></div>
      ${AK.railCard("Plan", [["Current revision", `Revision ${c[0]}`], ["Controls", `<span class="num">${h.fmt(r.ctl)}</span>`], ["Placeholders", `<span class="num">${h.fmt(r.ph)}</span>`], ["Last edited", esc(lastEdited(r))], ["Approval", approvalCell(r)]])}
      ${AK.card(`<div class="ak-rail-t">Revisions <span class="sh-ct num">${r.revs.length}</span></div>${revs}`)}
      ${AK.card(`<div class="ak-rail-t">People with access <span class="sh-ct num">${r.people.length}</span></div>${people}${r.ws ? "" : `<p class="sh-quiet">Access follows program roles.</p>`}`)}
      <div class="btns">${acts}</div>${r.ws ? AK.note("Presence and access levels are the prototype's; the roles are WS-X90's.") : `<p class="note-p">Only WS-X90's document is drawn in this prototype.</p>`}</div>` };
  };
  M["sh-newrev"] = () => {
    const rows = regRows();
    let first = null;
    const opts = rows.map((r) => {
      const open = r.revs.find((x) => x[1] === "draft" || x[1] === "review");
      if (!open && !first) first = r.code;
      return `<option value="${esc(r.code)}"${open ? " disabled" : ""}${!open && first === r.code ? " selected" : ""}>${esc(r.code)} · ${esc(r.name)}${open ? ` (revision ${open[0]} open)` : ""}</option>`;
    }).join("");
    const fr = rows.find((r) => r.code === first) || rows[0], pub = lastPub(fr);
    return { title: "New revision", body: `<div class="sh-dlg"><p class="ak-desc">A new revision starts as a draft; the published one stays frozen. A system with an open draft can't start another.</p>
      <div class="ak-field"><label for="sh-nr-sys">System</label><select id="sh-nr-sys" class="sh-in" data-sh-focus>${opts}</select></div>
      <fieldset class="sh-opts"><legend>Start from</legend>
        <label class="sh-opt"><input type="radio" name="sh-nr" value="pub" checked><span class="sh-opt-i">${AK.i("history")}</span><span class="sh-opt-t"><b>The published revision</b><span id="sh-nr-pub">Copies revision ${pub ? pub[0] : 1}'s text and statuses. Live-data sections read their records again.</span></span></label>
        <div class="sh-or"><span>Or</span></div>
        <label class="sh-opt"><input type="radio" name="sh-nr" value="file"><span class="sh-opt-i">${AK.i("upload")}</span><span class="sh-opt-t"><b>Upload a file</b><span>OSCAL SSP (JSON) or Word (.docx)</span></span></label>
      </fieldset>
      <button type="button" class="ak-drop sh-drop" data-sh-act="file" hidden>${AK.i("upload")}Choose a file to upload</button></div>`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-sh-act="newrev-ok">Create revision</button>` };
  };
  function newRevSync() {
    const sel = $("#sh-nr-sys"), r = sel && regRows().find((x) => x.code === sel.value), pub = r && lastPub(r);
    const t = $("#sh-nr-pub"); if (t) t.textContent = pub ? `Copies revision ${pub[0]}'s text and statuses. Live-data sections read their records again.` : "This system has no published revision yet.";
    const file = document.querySelector('input[name="sh-nr"]:checked'), drop = $(".sh-drop");
    if (drop) drop.hidden = !file || file.value !== "file";
  }

  // ——— Rendering, navigation and events ———
  S["ssp-history"] = historyHtml;
  S["ssp-review"] = reviewHtml;
  S["ssps"] = () => regHtml("all");
  S["ssps-drafts"] = () => regHtml("drafts");
  S["ssps-review"] = () => regHtml("review");
  S["ssps-published"] = () => regHtml("published");

  const barH = () => { const b = $(".sh-bar"); return (b ? b.offsetHeight : 56) + 24; };
  function scrollPaneTo(el) {
    const pane = $(".sh-docpane");
    if (!pane || !el) return;
    const top = pane.scrollTop + el.getBoundingClientRect().top - pane.getBoundingClientRect().top - barH();
    pane.scrollTo({ top: Math.max(0, top), behavior: reduce() ? "auto" : "smooth" });
  }
  function flash(el, focus) {
    document.querySelectorAll(".sh-hit").forEach((x) => x.classList.remove("sh-hit"));
    el.classList.add("sh-hit");
    if (focus) el.focus({ preventScroll: true });
  }
  // mode "top" scrolls the page to its top (a new state); "reveal" scrolls the focused control into view (a field's error).
  function rerender(focusSel, toFirst, mode) {
    const r = route(), main = $("#main");
    if (!S[r] || !main) return;
    const keep = {};
    main.querySelectorAll("[data-sh-scroll]").forEach((el) => { keep[el.dataset.shScroll] = el.scrollTop; });
    const top = main.scrollTop;
    main.innerHTML = S[r]();
    main.querySelectorAll("[data-sh-scroll]").forEach((el) => { if (keep[el.dataset.shScroll] != null) el.scrollTop = keep[el.dataset.shScroll]; });
    main.scrollTop = mode === "top" ? 0 : top;
    if (toFirst) {
      const pane = $(".sh-docpane");
      if (pane) { pane.scrollTop = 0; const first = $(".sh-doc [data-sh-chg]"); if (first) { const t = pane.scrollTop + first.getBoundingClientRect().top - pane.getBoundingClientRect().top - barH(); pane.scrollTop = Math.max(0, t); } }
    }
    if (focusSel) { const f = main.querySelector(focusSel); if (f) { f.focus({ preventScroll: true }); if (mode === "reveal") f.scrollIntoView({ block: "center", behavior: reduce() ? "auto" : "smooth" }); } }
  }
  function doJump() {
    const at = UI.jump;
    UI.jump = null;
    if (!at || route() !== "ssp-history") return;
    const el = $(`.sh-doc ${sel$("data-sh-anchor", at)}`);
    if (!el) return;
    const blk = el.closest("[data-sh-chg]") || el;
    scrollPaneTo(blk);
    flash(blk, true);
  }
  function walk(dir) {
    const blocks = [...document.querySelectorAll(".sh-doc [data-sh-chg]")];
    if (!blocks.length) { toast("No changes are marked in this version."); return; }
    UI.hit = UI.hit < 0 || UI.hit >= blocks.length ? (dir > 0 ? 0 : blocks.length - 1) : (UI.hit + dir + blocks.length) % blocks.length;
    const b = blocks[UI.hit];
    scrollPaneTo(b);
    flash(b, false);
    const c = $(".sh-bar-c");
    if (c) c.textContent = `Change ${UI.hit + 1} of ${blocks.length}`;
  }
  function setSheet(open) {
    UI.sheet = open;
    const side = $(".sh-side"), scrim = $(".sh-scrim"), btn = $('[data-sh-act="sheet"]');
    if (side) side.classList.toggle("open", open);
    if (scrim) scrim.hidden = !open;
    if (btn) btn.setAttribute("aria-expanded", String(open));
    if (open) { const x = $(".sh-side-x"); if (x) x.focus(); } else if (btn && narrow()) btn.focus();
  }
  function setPop(open, focusBack) {
    UI.pop = open;
    const pop = $("#sh-how-pop"), b = $('[data-sh-act="how"]');
    if (pop) pop.hidden = !open;
    if (b) b.setAttribute("aria-expanded", String(open));
    if (open && pop) pop.focus();
    else if (focusBack && b) b.focus();
  }
  function act(name, el) {
    switch (name) {
      case "why": toast(el.dataset.why || "Not available here."); break;
      case "tg-named": UI.named = !UI.named; rerender('[data-sh-act="tg-named"]'); break;
      case "tg-show": UI.show = !UI.show; UI.hit = -1; rerender('[data-sh-act="tg-show"]'); break;
      case "prev": walk(-1); break;
      case "next": walk(1); break;
      case "how": setPop(!UI.pop, false); break;
      case "sheet": setSheet(!UI.sheet); break;
      case "sheet-x": setSheet(false); break;
      case "cmp-x": UI.compare = false; UI.hit = -1; rerender('[data-modal="sh-compare"]', true); break;
      case "restore-ok": doRestore(); break;
      case "name-ok": doName(); break;
      case "compare-ok": doCompare(); break;
      case "submit": submit(false); break;
      case "submit-draft": submit(true); break;
      case "approve":
        RV.state = "approved"; pubRV();
        D.log({ who: ISSM, kind: "submit", what: "ISSM approved revision 3" });
        rerender('[data-sh-act="sign"]', false, "top");
        toast(`${ISSM} approved. The request moved to ${AO}, the authorizing official.`);
        break;
      case "changes":
        RV.state = "changes"; pubRV();
        D.log({ who: ISSM, kind: "submit", what: "ISSM requested changes" });
        rerender('[data-sh-act="submit"]', false, "top");
        toast(`${ISSM} requested changes. Revision 3 is a draft again.`);
        break;
      case "withdraw":
        RV.state = "draft"; pubRV();
        D.log({ kind: "submit", what: "Withdrew the review request" });
        rerender('[data-sh-act="submit"]', false, "top");
        toast("Submission withdrawn. Revision 3 is a draft again.");
        break;
      case "sign":
        toast(RV.asDraft && !k7ok() ? `${AO} can't sign until section 2 has a categorization rationale; eMASS refuses the package without one.` : `${AO} signs as the AO. On signature, revision 3 is published and frozen, and revision 4 starts as the next draft.`);
        break;
      case "sum-ok": { const t = $("#sh-sum-in"); RV.summary = t && t.value.trim() ? t.value.trim() : null; closeModal(); rerender('[data-modal="sh-summary"]'); toast("Summary saved. It goes to the ISSM with the submission."); break; }
      case "sum-reset": RV.summary = null; rerender('[data-modal="sh-summary"]'); break;
      case "export": toast(`${el.dataset.id} of revision 3 would download now; the prototype's viewer blocks downloads.`); break;
      case "nodoc": toast("Only WS-X90's document is drawn in this prototype."); break;
      case "file": toast("The prototype can't open a file picker. A real upload reads the OSCAL SSP's controls and narratives into the new draft."); break;
      case "newrev-ok": {
        const s = $("#sh-nr-sys"), r = s && regRows().find((x) => x.code === s.value), f = document.querySelector('input[name="sh-nr"]:checked');
        if (!r) break;
        const next = curRev(r)[0] + 1, pub = lastPub(r);
        closeModal();
        toast(`Revision ${next} of ${r.code} would start as a draft from ${f && f.value === "file" ? "the uploaded file" : pub ? "published revision " + pub[0] : "a blank plan"}.`);
        break;
      }
      default: break;
    }
  }
  // Capture phase, so a dialog's fields are read before core closes the dialog, and a choice is set before core navigates.
  document.addEventListener("click", (ev) => {
    const t = ev.target;
    if (!(t instanceof Element)) return;
    if (UI.pop && !t.closest(".sh-how")) setPop(false, false);
    const el = t.closest("[data-sh-act],[data-sh-sel],[data-sh-jump],[data-sh-fold],[data-sh-fam],[data-sh-det],[data-sh-hist]");
    if (!el) return;
    const d = el.dataset;
    if (el.hasAttribute("data-sh-hist")) { UI.sel = d.shV || null; UI.jump = d.shHist || null; UI.compare = false; UI.hit = -1; return; }
    if (d.shSel) { UI.sel = d.shSel; UI.compare = false; UI.hit = -1; if (narrow()) UI.sheet = false; rerender(narrow() ? '[data-sh-act="sheet"]' : sel$("data-sh-sel", d.shSel), true); return; }
    if (d.shJump) { if (UI.sel !== d.shOf || UI.compare) { UI.sel = d.shOf; UI.compare = false; } UI.jump = d.shJump; UI.hit = -1; if (narrow()) UI.sheet = false; rerender(null); doJump(); return; }
    if (d.shFold) { if (UI.folds.has(d.shFold)) UI.folds.delete(d.shFold); else UI.folds.add(d.shFold); rerender(sel$("data-sh-fold", d.shFold)); return; }
    if (d.shFam) { if (UI.fams.has(d.shFam)) UI.fams.delete(d.shFam); else UI.fams.add(d.shFam); UI.hit = -1; rerender(sel$("data-sh-fam", d.shFam)); return; }
    if (d.shDet) { if (UI.det.has(d.shDet)) UI.det.delete(d.shDet); else UI.det.add(d.shDet); rerender(sel$("data-sh-det", d.shDet)); return; }
    act(d.shAct, el);
  }, true);
  // After core opens one of these dialogs, put focus on its first field.
  document.addEventListener("click", (ev) => {
    const m = ev.target instanceof Element && ev.target.closest('[data-modal^="sh-"]');
    if (m) setTimeout(() => { const f = $("#modal [data-sh-focus]"); if (f) { f.focus(); if (f.select && f.tagName === "INPUT") f.select(); } }, 0);
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      if (UI.pop) { setPop(false, true); ev.preventDefault(); return; }
      const m = $("#modal");
      if (m && !m.hidden && m.querySelector(".sh-dlg")) { closeModal(); ev.preventDefault(); return; }
      if (UI.sheet && $(".sh-side.open")) { setSheet(false); ev.preventDefault(); return; }
      const pan = $("#panel");
      if (pan && !pan.hidden && pan.querySelector(".sh-pan")) { const x = $("#closePanel"); if (x) x.click(); ev.preventDefault(); }
      return;
    }
    if (ev.key === "Enter" && ev.target instanceof Element && ev.target.id === "sh-name-in") { ev.preventDefault(); doName(); }
  });
  document.addEventListener("input", (ev) => {
    const t = ev.target;
    if (!(t instanceof Element)) return;
    if (t.id === "sh-rc") { RV.comment = t.value; if (RV.err && t.value.trim()) { RV.err = false; t.removeAttribute("aria-invalid"); const e = $("#sh-rc-err"); if (e) e.remove(); } }
    if (t.id === "sh-name-in") { const e = $("#sh-name-err"); if (e) e.hidden = true; t.removeAttribute("aria-invalid"); }
  });
  document.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t instanceof Element && (t.id === "sh-nr-sys" || t.getAttribute("name") === "sh-nr")) newRevSync();
  });
  function afterRoute() {
    if (route() !== "ssp-history") return;
    const side = $(".sh-side"), on = $(".sh-v.on");
    if (side && on && !narrow()) side.scrollTop += on.getBoundingClientRect().top - side.getBoundingClientRect().top - 150;
    if (UI.jump) { doJump(); return; }
    const pane = $(".sh-docpane"), first = $(".sh-doc [data-sh-chg]");
    if (pane && first) pane.scrollTop = Math.max(0, first.getBoundingClientRect().top - pane.getBoundingClientRect().top - barH());
  }
  window.addEventListener("hashchange", () => { UI.sheet = false; UI.pop = false; setTimeout(afterRoute, 0); });
  setTimeout(afterRoute, 0);
})();
