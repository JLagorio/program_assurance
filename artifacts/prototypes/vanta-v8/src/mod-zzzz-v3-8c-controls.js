// V3 lane C (k3c-): Controls and the baseline are one page; a control is worked in its side panel; the workbook is its second view.
// Pages: controls (the list: V3's version of v2's page), controls-coverage (the Coverage view: components by control family).
// Folded here: baseline, baseline-params, resiliency…, posture… . Panel: k3c-control, id "AC-2", or "AC-2@CN-109101" when opened
// from a component (it then leads with that component's implementation). With V3 on, every a-tests-control preview is this panel.
//
// Opening Controls on exactly some records: K.set("ctl.view", { … }) and go to "controls". Every key is optional:
//   fam "AC" · chip noreq|noev|notassessed|short|inherited · q "text" · status <control status key> · source <layer key> ·
//   resp own|hybrid|inherited · tech <technique code, or "*" for any> · owner <name, or "none"> · layer <layer key: what it added
//   and removed> · mini req|ev|assessed|params · comp <component code: the controls it carries> · codes ["AC-2", …] with note
//   "the words over them" · out true (Tailored out) · page n
// PA.v2.go("controls", { filter: { qv }, rows: [codes], note }) is answered the same way.
//
// What the reader changes (K session data under "ctl."; another program than WS-X90 under "p.<program>.ctl."):
//   added [{ code, title, why, by, at }]   controls tailored in here       removed [{ code, why, by, at }]   controls tailored out here
//   off [layer key]  overlays switched off         ovl [overlay key]  published overlays added to the stack
//   impl { "<control>@<component>": { status, text, by, at } }   a component's implementation of a control
//   place { add: { control: [component] }, rm: { control: [component] } }   placement, in a build without lane S
//   reqs { control: [{ id, title }] } · unmap { control: [requirement id] } · madeReqs [{ id, title, st, ctl, els, by, at }]
//   ev { control: [{ id, title, req }] } · unev { control: [evidence title] } · own { control: name } · param { id: { value, why, by, at } }
// The same stores as the pages that already hold the fact: a control's first requirement and evidence (PA.v2.chain, as Map a
// requirement and Link evidence write them), its responsibility (host.resp.<code>, as Host & providers), and the system's own
// implementation status and narrative (sctm.ctl.<code> and PA.SSP, as the workbook's Review changes and the SSP editor).
//
// Facts for the other lanes: baseline() → { total, layers: [{ key, name, added, removed, count, on }], added: [codes a layer added
//   that stand], removed: [codes tailored out], here: { added, removed } }; control(code) → { code, title, family, status, source,
//   responsibility, owner, inBaseline }; impl(control, component) → { status, text } or null while nothing is written (no
//   component: the system's own); setImpl(control, component, { status, text }); madeRequirements(). fact("controls") and
//   fact("status") follow a control tailored in or out, a requirement unmapped and a responsibility changed.
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k, V = PA && PA.v2;
  if (!V3 || !K || !V || !PA.SSP || !PA.h) return;
  const SSP = PA.SSP, P = PA.P, S = PA.S, esc = K.esc, fmt = K.fmt, pct = K.pct;
  const WSX = "PRG-1090", ME = "Ingrid Solberg", TODAY = "2026-11-17", PER = 50;
  const on = () => V3.on(), wsx = () => V3.wsx(), prog = () => V3.prog();
  const CH = () => V.chain || null;
  const off = (fn) => V3.force(false, fn);
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const uniq = (a) => [...new Set(a)];
  const md = (iso) => (iso ? new Date(String(iso).slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
  const strip = (html) => String(html || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
  const codesIn = (s) => uniq(String(s || "").match(/[A-Z]{2}-\d+(?:\(\d+\))?/g) || []);
  const frag = (s) => { const t = document.createElement("template"); t.innerHTML = s || ""; return t.content; };
  const muted = (t) => `<span class="k3c-mu">${esc(t)}</span>`;
  const NONE = '<span class="k3-none">—</span>';

  // ——— Session data, a program at a time ———
  const kp = (p) => (wsx() ? "ctl." : `p.${prog()}.ctl.`) + p;
  const get = (p, d) => { const v = K.get(kp(p)); return v === undefined || v === null ? d : v; };
  const put = (p, v) => K.set(kp(p), v);
  const mapPut = (p, key, v) => { const o = Object.assign({}, get(p, {})); if (v === undefined) delete o[key]; else o[key] = v; put(p, o); };
  let GEN = 0;
  V.on(() => { GEN++; });
  window.addEventListener("hashchange", () => { GEN++; });
  const memo = (fn) => { const box = new Map(); let g = -1; return (...a) => { if (g !== GEN) { box.clear(); g = GEN; } const k = a.join("|"); if (!box.has(k)) box.set(k, fn(...a)); return box.get(k); }; };

  // ——— The catalog's order ———
  const FAM = () => SSP.families.map((f) => f.f);
  const famName = (f) => (SSP.families.find((x) => x.f === f) || {}).t || f;
  const parts = (c) => { const m = /^([A-Z]{2})-(\d+)(?:\((\d+)\))?$/.exec(c) || []; const i = FAM().indexOf(m[1]); return [i < 0 ? 99 : i, m[1] || "", +m[2] || 0, m[3] ? +m[3] : -1]; };
  const byCode = (a, b) => { const x = parts(a), y = parts(b); return x[0] - y[0] || (x[1] < y[1] ? -1 : x[1] > y[1] ? 1 : 0) || x[2] - y[2] || x[3] - y[3]; };
  const famOf = (c) => String(c).split("-")[0];

  // ════════════════ Reference data, read from where v2 holds it ════════════════
  // The stack's decisions are private to v2's Baseline page, so each layer is read from its own preview there (as lanes P and X
  // read theirs), and the reference baseline's membership and titles from the program wizard's baseline preview.
  const NAMES = { high: "NIST SP 800-53 Rev 5 High", cnssi: "CNSSI 1253", mission: "Mission Assurance Overlay", deployed: "Deployed Platform Overlay", custa: "F-16 SPO Tailoring", tailor: "Program tailoring" };
  const SHORT = { high: "NIST High", cnssi: "CNSSI 1253", mission: "Mission Assurance", deployed: "Deployed Platform", custa: "F-16 SPO", tailor: "Program tailoring" };
  const KIND = { high: "Baseline", tailor: "Tailoring" };
  function readLayer(key) {
    let body = ""; try { body = off(() => ((P["v7p-layer"] && P["v7p-layer"](key)) || {}).body) || ""; } catch (e) { body = ""; }
    const m = /Added (\d+) (.*?) Removed (\d+) (.*?)(?: Already selected (\d+) (.*?))?(?: Parameters it sets .*)?$/.exec(strip(body)) || [];
    return { n: +m[1] || 0, add: codesIn(m[2]), rem: codesIn(m[4]), re: codesIn(m[6]) };
  }
  function readHigh() {
    let body = ""; try { body = off(() => ((P["pn-baseline"] && P["pn-baseline"]()) || {}).body) || ""; } catch (e) { body = ""; }
    const titles = [], base = [], rem = [], re = /<i class="(base|add|rem)" title="([^"]+)"/g; let m;
    while ((m = re.exec(body))) { const t = strip(m[2]).replace(/ · (from the baseline|added|removed)$/, ""), i = t.indexOf(" "), c = i > 0 ? t.slice(0, i) : t; titles.push([c, i > 0 ? t.slice(i + 1) : ""]); if (m[1] === "base") base.push(c); else if (m[1] === "rem") rem.push(c); }
    const clean = /^High baseline/.test(strip(body)) && !/Overlay v\d/.test(body);
    return { titles, high: clean ? base.concat(rem) : null };
  }
  function readOverlay(key) {
    let body = ""; try { body = off(() => ((P["cmp-ovl"] && P["cmp-ovl"](key)) || {}).body) || ""; } catch (e) { body = ""; }
    const t = strip(body), m = /Adds (\d+) (.*?) Removes (\d+) (.*)$/.exec(t); if (!m) return null;
    return { key, name: (/^(.*?) Add to /.exec(t) || [])[1] || key, adds: codesIn(m[2]), rems: codesIn(m[4]) };
  }
  let REF = null;
  function ref() {
    if (REF) return REF;
    const L = {}; for (const k of ["cnssi", "mission", "deployed", "custa", "tailor"]) L[k] = readLayer(k);
    const H = readHigh(); let high = H.high && H.high.length ? H.high : null;
    try { if (high) sessionStorage.setItem("k3c-high", JSON.stringify(high)); else high = JSON.parse(sessionStorage.getItem("k3c-high") || "null"); } catch (e) { /* storage off: this visit only */ }
    const titles = new Map(H.titles); for (const c of SSP.controls) titles.set(c.c, c.t);
    const B = SSP.controls.map((c) => c.c);
    let exact = !!high;
    if (exact) {
      // What CNSSI 1253 added: everything in the baseline the reference does not hold and no later layer added, and what it added
      // that a later layer removed again. Its preview lists the first 48 of them.
      const hs = new Set(high), later = new Set(L.deployed.add.concat(L.tailor.add));
      const a = B.filter((c) => !hs.has(c) && !later.has(c)).concat(uniq(L.mission.rem.concat(L.custa.rem)).filter((c) => !hs.has(c)));
      if (!L.cnssi.n || a.length === L.cnssi.n) L.cnssi.add = a; else exact = false;
    }
    if (!exact) { const known = new Set(L.cnssi.add.concat(L.deployed.add, L.tailor.add)); high = B.filter((c) => !known.has(c)).concat(L.cnssi.rem, L.mission.rem, L.custa.rem.filter((c) => !known.has(c))); }
    const ovl = {}; const cusa = readOverlay("cusa"); if (cusa) ovl.cusa = cusa;
    REF = { L, high: uniq(high), titles, exact, ovl };
    return REF;
  }
  const titleOf = (code) => {
    const t = ref().titles.get(code); if (t) return t;
    const a = (get("added", []).find((x) => x.code === code) || {}).title; if (a) return a;
    const m = /^(.*)\((\d+)\)$/.exec(code), p = m ? ref().titles.get(m[1]) : null;
    return p ? `${p}, enhancement ${m[2]}` : "";
  };
  // The cyber resiliency techniques (NIST SP 800-160 Vol. 2, Table E-1) with the controls that support each: lane X's reading.
  const techs = () => { try { return (PA.v3x && PA.v3x.techs && PA.v3x.techs()) || []; } catch (e) { return []; } };
  const techIx = memo(() => { const m = new Map(); for (const t of techs()) for (const c of t.ctl || []) { if (!m.has(c)) m.set(c, []); m.get(c).push(t); } return m; });
  // Parameters: the 17 the Baseline's Parameters tab listed, with the values the reader set here.
  let PARAMS = null;
  function params() {
    if (!PARAMS) {
      PARAMS = [];
      try {
        const f = frag(off(() => (S["baseline-params"] ? S["baseline-params"]() : "")));
        for (const tr of f.querySelectorAll('tr[data-panel="v7p-param"]')) {
          const td = tr.querySelectorAll("td"); if (td.length < 4) continue;
          const what = td[0].querySelector("[title]"), val = td[2].querySelector("[title]");
          PARAMS.push({ id: tr.dataset.id, label: strip((td[0].querySelector("b") || {}).innerHTML), what: what ? what.getAttribute("title") : "", ctl: strip(td[1].innerHTML), value: val ? val.getAttribute("title") : null, by: val ? "Program tailoring" : null });
        }
      } catch (e) { PARAMS = []; }
    }
    const mine = get("param", {});
    return PARAMS.map((p) => (mine[p.id] ? Object.assign({}, p, { value: mine[p.id].value, by: "Program tailoring", why: mine[p.id].why, here: true }) : p));
  }
  const paramsOf = (code) => (wsx() ? params().filter((p) => p.ctl === code) : []);
  // A statement prints where the control has parameters: the catalog's sentence with a slot for each (the prototype holds no
  // statement text; these nine are the controls whose parameters it lists).
  const STMT = {
    "SA-24": "Design organizational systems, system components, or system services to achieve cyber resiliency by defining the following cyber resiliency goals: {sa24-1}; objectives: {sa24-2}; techniques: {sa24-3}; implementation approaches: {sa24-4}; and design principles: {sa24-5}; and implement them as part of an architecture and design process.",
    "AC-2(3)": "Disable accounts within {ac23-1} when the accounts have expired, are no longer associated with a user or individual, are in violation of organizational policy, or have been inactive for {ac23-2}.",
    "RA-5": "Monitor and scan for vulnerabilities in the system and hosted applications {ra5-1} and {ra5-2}; remediate legitimate vulnerabilities {ra5-3} in accordance with an organizational assessment of risk; and share what the monitoring finds with {ra5-4}.",
    "SI-2": "Identify, report and correct system flaws; test software and firmware updates for effectiveness and side effects before installation; and install security-relevant updates within {si2} of their release.",
    "AC-7": "Enforce a limit of {ac7} consecutive invalid logon attempts by a user during a defined time period, and lock the account or node when the limit is exceeded.",
    "AC-11": "Prevent further access to the system by initiating a device lock after {ac11} of inactivity, and retain the lock until the user reestablishes access.",
    "AU-11": "Retain audit records for {au11} to support after-the-fact investigations of incidents and to meet retention requirements.",
    "CA-7": "Develop a system-level continuous monitoring strategy and implement continuous monitoring that establishes {ca7} for monitoring and for assessing control effectiveness.",
    "CM-8": "Develop and document an inventory of system components that accurately reflects the system, and review and update it {cm8}.",
  };

  // ════════════════ The baseline: which controls are in the list, and where each came from ════════════════
  function layersDef(offKeys, ovlKeys) {
    const R = ref(), offK = new Set(offKeys || get("off", [])), extra = ovlKeys || get("ovl", []);
    const L = [{ key: "high", adds: R.high, rems: [], fixed: true }];
    for (const k of ["cnssi", "mission", "deployed", "custa"]) L.push({ key: k, adds: R.L[k].add.concat(R.L[k].re), rems: R.L[k].rem });
    for (const k of extra) if (R.ovl[k]) L.push({ key: k, name: R.ovl[k].name, adds: R.ovl[k].adds, rems: R.ovl[k].rems, extra: true });
    L.push({ key: "tailor", adds: R.L.tailor.add.concat(R.L.tailor.re, get("added", []).map((x) => x.code)), rems: R.L.tailor.rem.concat(get("removed", []).map((x) => x.code)), fixed: true });
    return L.map((l) => Object.assign({ name: NAMES[l.key] || l.key, kind: KIND[l.key] || "Overlay" }, l, { on: !!l.fixed || !offK.has(l.key) }));
  }
  function derive(L) {
    const set = new Set(), out = new Map(), src = new Map();
    const rows = L.map((l) => {
      const a = [], r = [];
      if (l.on) {
        for (const c of l.adds) if (!set.has(c)) { set.add(c); a.push(c); src.set(c, l.key); out.delete(c); }
        for (const c of l.rems) if (set.has(c)) { set.delete(c); r.push(c); out.set(c, l.key); }
      }
      return Object.assign({}, l, { added: a, removed: r, count: set.size });
    });
    return { rows, set, src, out };
  }
  const model = memo(() => { const d = derive(layersDef()); d.codes = [...d.set].sort(byCode); return d; });
  const layerName = (key) => (model(prog()).rows.find((r) => r.key === key) || {}).name || NAMES[key] || key;
  const layerShort = (key) => SHORT[key] || layerName(key);
  const changedHere = () => get("added", []).length + get("removed", []).length + get("off", []).length + get("ovl", []).length > 0;
  // Assessments in progress: a change to the baseline reaches their plans once they close.
  const openCamps = () => { const L = ((PA.data && PA.data.CAMPAIGNS) || []).filter((c) => c[1] === "active"); return { n: L.length, next: L.map((c) => c[4]).sort()[0] || null }; };
  const waitLine = () => { const o = openCamps(); return o.n ? `${plural(o.n, "assessment is", "assessments are")} open: ${o.n === 1 ? "its plan keeps" : "their plans keep"} the baseline ${o.n === 1 ? "it" : "they"} started on until ${o.n === 1 ? "it closes" : "they close"}${o.next ? `, the ${o.n === 1 ? "" : "first "}on ${md(o.next)}` : ""}.` : ""; };

  // ════════════════ One control ════════════════
  const view = (code) => { const ch = CH(); return ch ? ch.view(code) : null; };
  const chainSt = (code) => { const ch = CH(); return (ch && ch.st ? ch.st(code) : null) || {}; };
  const rec = (code) => (wsx() && SSP.ctl(code)) || { c: code, t: titleOf(code), f: famOf(code), s: null, n: "", cs: "no_requirement", r: 0, e: 0, ob: 1, om: 0, oe: 0, oa: 0, syn: true };
  const STW = (s) => (SSP.STATUS[s] || SSP.STATUS.no_requirement);
  const stPill = (s) => K.status(STW(s)[0], STW(s)[1]);
  const DETS = new Set(["satisfied", "partially_satisfied", "other_than_satisfied"]);
  // A control's status is read through the facts registry at draw time, so a lane that wraps fact("status") after this one
  // (lane E, once an assessment's result is published) is seen here too. status0 is what was registered beneath this lane;
  // ownStatus is that with this lane's own changes (a control tailored in, a requirement unmapped); statusOf asks the registry
  // and keeps those changes on top of whatever it answers. BUSY stops the registry's answer from asking this lane in a loop.
  const status0 = V3.facts.status, controls0 = V3.facts.controls;
  let BUSY = 0, myStatus = null;
  const below = (code) => { if (typeof status0 !== "function") return undefined; try { return status0(code); } catch (e) { return undefined; } };
  const adjust = (code, s) => ((s === "no_evidence" || s === "not_assessed") && (get("unmap", {})[code] || []).length && !reqsOf(code).length && respOf(code).kind !== "Inherited" ? "no_requirement" : s);
  function ownStatus(code) {
    let s = SSP.ctl(code) ? below(code) : null;
    if (!s) { const v = view(code); s = v ? v.status : rec(code).cs; }
    return adjust(code, s);
  }
  function statusOf(code) {
    const reg = V3.facts.status;
    if (!BUSY && typeof reg === "function" && reg !== myStatus) { BUSY++; let s = null; try { s = reg(code); } catch (e) { s = null; } finally { BUSY--; } if (s) return adjust(code, s); }
    return ownStatus(code);
  }
  // Responsibility: Host & providers' store, so a change here is the change there.
  function respOf(code) {
    const H = PA.v2host; if (!H || !wsx() || !SSP.ctl(code)) return { kind: "System-specific", word: "This system", pid: null };
    const r = H.resp(code), p = r.pid ? H.PROV[r.pid] : null, lean = p && r.kind !== "System-specific";
    const unauth = !!(lean && (p.forceHybrid || /not authorized/i.test((p.auth || {}).word || "")));
    return { kind: r.kind, pid: r.pid, provider: p ? p.name : null, offer: r.offer, own: r.own, def: r.def, unauth, forceHybrid: !!(p && p.forceHybrid),
      word: r.kind === "System-specific" ? "This system" : r.kind === "Hybrid" ? `Hybrid with ${p.name}` : `Inherited from ${p.name}` };
  }
  const ownerOf = (code) => get("own", {})[code] || null;
  // Requirements: the register's mappings of the control (the snapshot, the SSP's lists and lane X's full register), then today's.
  let RI = null, RBY = null;
  function reqIndex() {
    if (RI) return RI;
    RI = new Map(); RBY = new Map(); const seen = new Set();
    const add = (c, id, t, ev, els) => { if (!RBY.has(id)) RBY.set(id, { id, title: t, ctl: [], els: els || [] }); const r = RBY.get(id); if (!r.ctl.includes(c)) r.ctl.push(c); const k = c + "|" + id; if (seen.has(k)) return; seen.add(k); if (!RI.has(c)) RI.set(c, []); RI.get(c).push({ id, title: t, ev: ev || null }); };
    const X = (PA.SCTMD || {}).reqs || {};
    for (const [c, list] of Object.entries(SSP.requirements || {})) for (const [id, t, ev] of list) add(c, id, t, ev, (X[id] || {}).els);
    for (const [id, r] of Object.entries(X)) for (const c of r.ctl || []) add(c, id, r.t, (r.ev || [])[0], r.els);
    let syn = null; try { syn = PA.v3x && PA.v3x.synth ? PA.v3x.synth() : null; } catch (e) { syn = null; }
    for (const r of (syn && syn.reqs) || []) for (const c of r.ctl || []) add(c, r.code, r.t, null, null);
    return RI;
  }
  // Lane D keeps the requirement records and their links (requirement, requirementsOfControl, mapControl, createRequirement…):
  // with it in the build this panel reads and writes through it, so a requirement made on a component or in the register is here too.
  const hasD = () => typeof V3.facts.requirementsOfControl === "function" && typeof V3.facts.mapControl === "function";
  const dReq = (id) => { if (!hasD()) return null; let r = null; try { r = V3.fact("requirement", id); } catch (e) { r = null; } return r ? { id: r.code || id, title: r.title || "", st: r.statement || "", ctl: r.controls || [], els: r.components || [] } : null; };
  const dArt = (id) => { if (!hasD() || typeof V3.facts.artifact !== "function") return null; try { return V3.fact("artifact", id) || null; } catch (e) { return null; } };
  const reqById = (id) => { reqIndex(); return RBY.get(id) || get("madeReqs", []).find((r) => r.id === id) || dReq(id) || null; };
  function reqsOf(code) {
    if (!wsx()) return [];
    const out = [], un = new Set(get("unmap", {})[code] || []), s = chainSt(code);
    if (s.req) out.push({ id: s.req, title: s.reqTitle || (reqById(s.req) || {}).title || "", today: true, chain: true });
    for (const x of get("reqs", {})[code] || []) if (!out.some((o) => o.id === x.id)) out.push({ id: x.id, title: x.title, today: true });
    for (const x of reqIndex().get(code) || []) if (!out.some((o) => o.id === x.id)) out.push({ id: x.id, title: x.title, ev: x.ev, base: true });
    const mine = out.filter((x) => !un.has(x.id));
    if (!hasD()) return mine;
    let ids = null; try { ids = V3.fact("requirementsOfControl", code); } catch (e) { ids = null; }
    if (!Array.isArray(ids)) return mine;
    const have = new Set(mine.map((x) => x.id));
    return mine.concat(ids.filter((id) => !have.has(id) && !un.has(id)).map((id) => ({ id, title: (reqById(id) || {}).title || "", today: true })));
  }
  // Evidence: what its requirements cite. The register counts c.e artifacts for the control; a requirement whose artifact the
  // snapshot does not name cites "Evidence for <requirement>", as the control's page has always listed it.
  function evOf(code) {
    if (!wsx()) return [];
    const out = [], un = new Set(get("unev", {})[code] || []), s = chainSt(code), b = SSP.ctl(code);
    if (s.ev) out.push({ title: s.evTitle || s.ev, req: s.evReq || s.req || "", state: "Pending review", chain: true, id: s.ev });
    for (const x of get("ev", {})[code] || []) out.push({ title: x.title, req: x.req, state: "Pending review", id: x.id, mine: true });
    if (hasD()) { // evidence linked on a requirement (lane D) shows on every control that requirement maps
      const rids = new Set(reqsOf(code).map((r) => r.id)), W = { pending: "Pending review", revise: "Needs revision", accepted: "Accepted" };
      for (const [q, id] of K.get("req.evl", []) || []) { if (!rids.has(q) || out.some((o) => o.id === id || o.title === id)) continue; const a = dArt(id); if (a && !out.some((o) => o.title === a.title)) out.push({ title: a.title, req: q, state: W[a.state] || "Pending review", id, viaD: true }); }
    }
    let left = b ? b.e : 0;
    for (const r of reqsOf(code)) { if (!r.base || left <= 0) continue; out.push({ title: r.ev || `Evidence for ${r.id}`, req: r.id, state: "Accepted", base: true }); left--; }
    return out.filter((x) => !un.has(x.title));
  }
  // Components that carry it: lane S's placement when it is in the build; else where its requirements are allocated, and what
  // the reader placed or removed here.
  const sOn = () => typeof V3.facts.componentsOf === "function";
  const ROOT = ((SSP.elements || []).find((e) => !e[3]) || [])[0] || ""; // the system itself: its implementation is the SSP's narrative
  const compName = (code) => { const c = sOn() ? V3.fact("component", code) : null; if (c && c.name) return c.name; const e = (PA.v7p && PA.v7p.EBY && PA.v7p.EBY[code]) || null; if (e) return e.name; const x = (SSP.elements || []).find((el) => el[0] === code); return x ? x[1] : code; };
  const compLink = (code) => (typeof V3.facts.component === "function" ? K.link(compName(code), "component--" + code) : esc(compName(code)));
  function compsOf(code) {
    if (!wsx()) return [];
    if (sOn()) return uniq((V3.fact("componentsOf", code) || []).map((x) => (typeof x === "string" ? x : x && x.code)).filter((c) => c && c !== ROOT));
    const pl = get("place", {}), add = (pl.add || {})[code] || [], rm = new Set((pl.rm || {})[code] || []), out = [];
    reqIndex();
    for (const r of reqsOf(code)) for (const e of (RBY.get(r.id) || r).els || []) if (e !== ROOT && !out.includes(e)) out.push(e);
    for (const e of add) if (!out.includes(e)) out.push(e);
    return out.filter((e) => !rm.has(e));
  }
  function allComps() {
    const L = sOn() ? V3.fact("components") : null;
    if (Array.isArray(L) && L.length) return L.filter((c) => c && c.code && c.code !== ROOT).map((c) => ({ code: c.code, name: c.name, group: c.boundary && c.boundary !== "inside" ? "Outside the boundary" : c.parent ? compName(c.parent) : "System" }));
    return (SSP.elements || []).filter((e) => e[0] !== ROOT).map((e) => ({ code: e[0], name: e[1], group: e[3] && e[3] !== ROOT ? compName(e[3]) : "Subsystems" }));
  }
  function place(code, comp, yes) {
    if (sOn() && typeof V3.facts[yes ? "place" : "unplace"] === "function") { V3.fact(yes ? "place" : "unplace", comp, code); return; }
    const pl = get("place", {}), add = Object.assign({}, pl.add), rm = Object.assign({}, pl.rm);
    add[code] = (add[code] || []).filter((x) => x !== comp); rm[code] = (rm[code] || []).filter((x) => x !== comp);
    (yes ? add : rm)[code].push(comp);
    put("place", { add, rm });
  }
  // Implementation. The system's own is the SSP's narrative (the workbook and the SSP editor write the same record); a
  // component's is kept here.
  const IMPLW = (s) => (s && SSP.IMPL[s]) || null;
  const implKey = (code, comp) => `${code}@${comp || ""}`;
  function implOf(code, comp) {
    const b = wsx() ? SSP.ctl(code) : null;
    if (!comp && b) return { status: b.s, text: b.ph ? "" : b.n || "", placeholder: !!b.ph, rev: b.rv, sys: true };
    return get("impl", {})[implKey(code, comp)] || null;
  }
  // lead: what a page shows for a component. Nothing written here yet, and the system's narrative names the component: lane S
  // counts that text as the component's ("Written", from the SSP). The control's page shows the same text and says where it is
  // from, so the component's Controls tab and the control's page agree. The fact impl stays what was written here, or null.
  function implShown(code, comp) {
    const own = implOf(code, comp); if (own || !comp) return own;
    try { const r = PA.v3s && PA.v3s.implOf ? PA.v3s.implOf(code, comp) : null; return r && r.fromSsp && String(r.text || "").trim() ? { status: SSP.ctl(code) ? SSP.ctl(code).s : "", text: r.text, fromSsp: true } : null; } catch (e) { return null; }
  }
  const ORIG = new Map();
  function setImpl(code, comp, o) {
    const b = wsx() ? SSP.ctl(code) : null;
    if (!comp && b) {
      if (!ORIG.has(code)) ORIG.set(code, { s: b.s, n: b.n, rv: b.rv, up: b.up, ph: b.ph });
      const keep = Object.assign({}, V.get("sctm.ctl." + code, null) || {});
      if (o.status && SSP.IMPL[o.status]) { b.s = o.status; keep.s = b.s; }
      if (o.text != null) { b.n = o.text; b.ph = 0; keep.n = b.n; }
      b.rv = (b.rv || 1) + 1; b.up = TODAY;
      V.set("sctm.ctl." + code, keep);
      if (SSP.log) { try { SSP.log({ who: ME, what: `changed ${code}'s implementation on its control`, at: code, kind: "edit" }); } catch (e) { /* the log is the SSP editor's */ } }
      return;
    }
    mapPut("impl", implKey(code, comp), { status: o.status, text: o.text, by: ME, at: TODAY });
  }
  V.on((path) => { if (path !== "*") return; for (const [code, o] of ORIG) { const b = SSP.ctl(code); if (b) Object.assign(b, o); } ORIG.clear(); });

  // ════════════════ The list's rows and counts ════════════════
  const rowsWSX = memo(() => {
    const m = model(prog()), tx = techIx(), pset = new Set(params().map((p) => p.ctl));
    return m.codes.map((code) => {
      const b = rec(code), v = view(code) || b, r = respOf(code), st = statusOf(code);
      const im = implOf(code, "");
      return { code, title: b.t || titleOf(code), fam: b.f || famOf(code), status: st, src: m.src.get(code) || "high", resp: r, ob: v.ob || 0, oe: r.kind === "Inherited" ? v.ob || 0 : v.oe || 0, owner: ownerOf(code), line: im && im.text ? im.text : "", tech: tx.get(code) || [], hasParams: pset.has(code), syn: !!b.syn };
    });
  });
  const outRows = () => { const m = model(prog()); return [...m.out.keys()].sort(byCode).map((code) => ({ code, title: titleOf(code), fam: famOf(code), by: m.out.get(code), out: true })); };
  function counts(rows) {
    const c = { total: rows.length, satisfied: 0, partially_satisfied: 0, other_than_satisfied: 0, not_assessed: 0, no_evidence: 0, no_requirement: 0, inherited: 0, hybrid: 0 };
    for (const r of rows) { c[r.status] = (c[r.status] || 0) + 1; if (r.resp.kind === "Inherited") c.inherited++; else if (r.resp.kind === "Hybrid") c.hybrid++; }
    return c;
  }
  const CHIPS = [["", "All"], ["noreq", "No requirement"], ["noev", "Needs evidence"], ["notassessed", "Not assessed"], ["short", "Short of satisfied"], ["inherited", "Inherited"]];
  const chipTest = { noreq: (r) => r.status === "no_requirement", noev: (r) => r.status === "no_evidence", notassessed: (r) => r.status === "not_assessed", short: (r) => r.status === "partially_satisfied" || r.status === "other_than_satisfied", inherited: (r) => r.resp.kind === "Inherited" };
  const miniTest = { req: (r) => r.status !== "no_requirement", ev: (r) => r.status !== "no_requirement" && r.status !== "no_evidence", assessed: (r) => DETS.has(r.status), params: (r) => r.hasParams };
  const MINIW = { req: "Controls with a requirement", ev: "Controls with evidence", assessed: "Controls an assessor has judged", params: "Controls whose statement has parameters" };
  const respKey = (r) => (r.resp.kind === "Inherited" ? "inherited" : r.resp.kind === "Hybrid" ? "hybrid" : "own");

  // ——— The view: filters, the rail choice and the page live in the session, so a redraw and Back keep them ———
  const VIEW0 = { fam: "", chip: "", q: "", status: "", source: "", resp: "", tech: "", owner: "", layer: "", mini: "", comp: "", codes: null, note: "", out: false, page: 0 };
  const vw = () => Object.assign({}, VIEW0, get("view", {}));
  const setView = (patch, keepPage) => { put("view", Object.assign({}, vw(), keepPage ? {} : { page: 0 }, patch)); };
  const anyFilter = (v) => !!(v.fam || v.chip || v.q || v.status || v.source || v.resp || v.tech || v.owner || v.layer || v.mini || v.comp || v.codes || v.out);
  function applyView(rows, v, skip = {}) {
    const q = (v.q || "").trim().toLowerCase(), codes = v.codes ? new Set(v.codes) : null;
    return rows.filter((r) => (skip.fam || !v.fam || r.fam === v.fam)
      && (skip.chip || !v.chip || (chipTest[v.chip] || (() => true))(r))
      && (!v.status || r.status === v.status) && (!v.source || r.src === v.source) && (!v.resp || respKey(r) === v.resp)
      && (!v.tech || (v.tech === "*" ? r.tech.length > 0 : r.tech.some((t) => t.code === v.tech)))
      && (!v.owner || (v.owner === "none" ? !r.owner : r.owner === v.owner))
      && (!v.layer || r.src === v.layer) && (!v.comp || compsOf(r.code).includes(v.comp)) && (!v.mini || (miniTest[v.mini] || (() => true))(r)) && (!codes || codes.has(r.code))
      && (!q || `${r.code} ${r.title} ${r.line}`.toLowerCase().includes(q)));
  }
  // A question another page sends with PA.v2.go("controls", q).
  const QV = { "needs evidence": "noev", "no evidence": "noev", "not assessed": "notassessed", "short of satisfied": "short", "no requirement": "noreq", inherited: "inherited" };
  function takeQuestion() {
    const q = V.take ? V.take("controls") : null; if (!q) return;
    const patch = Object.assign({}, VIEW0);
    const qv = q.filter && q.filter.qv ? String(q.filter.qv).toLowerCase() : "";
    if (QV[qv]) patch.chip = QV[qv];
    if (q.rows && q.rows.length) { patch.codes = uniq(q.rows.flatMap((t) => codesIn(t))); patch.note = q.note || ""; }
    put("view", patch);
  }

  // ════════════════ Controls: the list ════════════════
  const addMenu = () => K.menu("Add control", [{ label: "From the catalog", act: "k3c.add" }, { label: "Apply an overlay", act: "k3c.baseline" }], { primary: true });
  const head = (cur) => K.head({ title: "Controls", chip: wsx() ? seg(cur) : "", actions: K.menu("More", wsx() ? [{ label: "Gap assessment", go: "frameworks-gap" }, { label: "Export controls", act: "k3c.export" }, { label: "Open the SSP at section 11", act: "k3c.ssp", arg: "s11" }] : [{ label: "Export controls", act: "k3c.export" }, { label: "Remove a control", act: "k3c.rmcode", danger: true }]) + (wsx() ? addMenu() : K.btn("Add control", { primary: true, act: "k3c.addcode" })) });
  K.on("k3c.rmcode", () => K.form({ title: "Remove a control", submit: "Remove control", danger: true, intro: "The control leaves this program's baseline as its own tailoring decision.", fields: [{ key: "code", label: "Control", required: true, placeholder: "PE-17", half: true }, { key: "why", label: "Rationale", type: "textarea", rows: 3, required: true }],
    onSubmit: (v) => { const code = v.code.toUpperCase().replace(/\s+/g, ""), d = made(), row = rowsOther().find((r) => r.code === code); if (!row) return { code: `${code || "That control"} is not in the baseline.` };
      if (d) V.set(`v3.P.${d.code}.tl`, (V.get(`v3.P.${d.code}.tl`, null) || []).concat([{ code, act: "remove", why: v.why, title: row.title, by: ME, at: TODAY }])); else put("added", get("added", []).filter((x) => x.code !== code));
      K.redraw(); K.toast(`${code} removed from the baseline · ${plural(rowsOther().length, "control")}`); } }));
  function seg(cur) { return K.seg([{ label: "List", on: cur === "list", go: "controls" }, { label: "Coverage", on: cur === "coverage", go: "controls-coverage" }, { label: "Workbook", go: "sctm" }], "View of the controls"); }
  function baselineCard(m, v) {
    const here = get("added", []).length + get("removed", []).length;
    const line = (r) => `<li><button type="button" class="k3c-ly${v.layer === r.key ? " on" : ""}${r.on ? "" : " off"}" aria-pressed="${v.layer === r.key}"${K.a("k3c.layer", r.key)}><span class="l">${esc(r.name)}</span><span class="d num">${!r.on ? "Not applied" : r.key === "high" ? "" : `${r.added.length ? "+" + fmt(r.added.length) : ""}${r.added.length && r.removed.length ? " " : ""}${r.removed.length ? "−" + fmt(r.removed.length) : ""}${r.added.length || r.removed.length ? "" : "No change"}`}</span><span class="n num">${fmt(r.count)}</span></button></li>`;
    const w = changedHere() ? waitLine() : "";
    return `<section class="k3-card k3c-base" aria-label="Baseline"><div class="k3-sec-h"><h2 class="k3-card-t">Baseline</h2>${K.btn("Edit baseline", { sm: true, act: "k3c.baseline" })}</div><div class="k3c-base-n"><span class="num">${fmt(m.set.size)}</span> controls, from ${plural(m.rows.filter((r) => r.on).length, "layer")} in the order they apply</div><ul class="k3c-lys">${m.rows.map(line).join("")}</ul>${here || w ? `<p class="k3-muted k3c-base-f">${here ? `${plural(here, "tailoring decision")} made here. ` : ""}${esc(w)}</p>` : ""}</section>`;
  }
  function showing(v, n) {
    const bits = [];
    if (v.out) bits.push("Controls a layer or the program removed");
    if (v.layer) bits.push(`What ${layerName(v.layer)} added${v.layer === "high" ? "" : " or removed"}`);
    if (v.mini) bits.push(MINIW[v.mini] || "");
    if (v.comp) bits.push(`Controls ${compName(v.comp)} carries`);
    if (v.codes) bits.push(v.note || `${plural(v.codes.length, "control")} another page named`);
    if (!bits.length && !anyFilter(v)) return "";
    return `<p class="k3c-showing">${bits.length ? `<span>${esc(bits.join(" · "))}</span>` : `<span>${plural(n, "control")} match</span>`}${K.actLink("Clear filters", "k3c.clear")}</p>`;
  }
  const outRow = (r) => ({ cls: "k3c-out", panel: "k3c-control", id: r.code, cells: [K.name(r.title || r.code, "", r.code), `<span class="k3c-src k3c-mu">Tailored out</span>`, `<span class="k3c-src">${esc(layerShort(r.by))} removed it</span>`, NONE, NONE, NONE, K.btn("Restore", { sm: true, act: "k3c.restore", arg: r.code })] });
  function listWSX() {
    takeQuestion();
    const v = vw(), m = model(prog()), all = rowsWSX(prog()), c = counts(all), outs = outRows();
    const inScope = applyView(all, Object.assign({}, v, { chip: "" })), noFam = applyView(all, Object.assign({}, v, { fam: "" }));
    let shown = v.out ? [] : applyView(all, v), outShown = [];
    if (v.out) outShown = outs.filter((r) => (!v.fam || r.fam === v.fam) && (!v.q || `${r.code} ${r.title}`.toLowerCase().includes(v.q.toLowerCase())));
    else if (v.layer) outShown = outs.filter((r) => r.by === v.layer && (!v.fam || r.fam === v.fam));
    const total = shown.length + outShown.length, pages = Math.max(1, Math.ceil(total / PER)), page = Math.min(v.page || 0, pages - 1);
    const slice = shown.concat(outShown).slice(page * PER, page * PER + PER);
    const fams = FAM().concat(uniq(all.map((r) => r.fam)).filter((f) => !FAM().includes(f)));
    const rail = K.rail({ title: "Control families", label: "Control family", act: "k3c.fam", items: [{ id: "", label: "All families", count: noFam.length, on: !v.fam && !v.out }]
      .concat(fams.map((f) => ({ id: f, code: f, label: famName(f), count: noFam.filter((r) => r.fam === f).length, on: v.fam === f && !v.out })))
      .concat([{ head: "Outside the baseline" }, { id: "__out", label: "Tailored out", count: outs.length, on: !!v.out }]) });
    const cards = K.cards(
      K.completion({ label: "Controls satisfied", done: c.satisfied, total: c.total, unit: "controls", minis: [["req", "With a requirement"], ["ev", "With evidence"], ["assessed", "Assessed"]].map(([k, l]) => ({ label: l, done: all.filter(miniTest[k]).length, total: c.total, act: "k3c.mini", arg: k })) }),
      baselineCard(m, v));
    const chips = K.chips(CHIPS.map(([id, label]) => ({ id, label, count: id ? inScope.filter(chipTest[id]).length : inScope.length, on: !v.out && (v.chip || "") === id })), "k3c.chip", "Show controls");
    const people = uniq(all.map((r) => r.owner).filter(Boolean)).sort();
    const tools = K.toolbar({ search: { act: "k3c.q", value: v.q, placeholder: "Search controls" }, filters: [
      { label: "Status", act: "k3c.f.status", value: v.status, options: Object.keys(SSP.STATUS).map((k) => [k, SSP.STATUS[k][0]]) },
      { label: "Source", act: "k3c.f.source", value: v.source, options: m.rows.filter((r) => r.on).map((r) => [r.key, layerShort(r.key)]) },
      { label: "Responsibility", act: "k3c.f.resp", value: v.resp, options: [["own", "This system"], ["hybrid", "Hybrid"], ["inherited", "Inherited"]] },
      { label: "Technique", act: "k3c.f.tech", value: v.tech, options: [["*", "Any technique"]].concat(techs().map((t) => [t.code, t.t])) },
      { label: "Owner", act: "k3c.f.owner", value: v.owner, options: [["none", "No owner"]].concat(people.map((p) => [p, p])) },
    ] });
    const row = (r) => (r.out ? outRow(r) : { panel: "k3c-control", id: r.code, cells: [
      K.name(r.title || r.code, r.line || (r.syn ? "Tailored in here: nothing recorded yet" : "Implementation not written"), r.code),
      stPill(r.status), `<span class="k3c-src" title="${esc(layerName(r.src))}">${esc(layerShort(r.src))}</span>`,
      `<span class="k3c-rs" title="${esc(r.resp.word)}${r.resp.unauth ? ", which is not authorized" : ""}"><span>${esc(r.resp.kind === "System-specific" ? "This system" : r.resp.kind)}</span>${r.resp.provider && r.resp.kind !== "System-specific" ? `<span class="p">${esc(r.resp.provider)}${r.resp.unauth ? " · not authorized" : ""}</span>` : ""}</span>`,
      K.num(compsOf(r.code).length), K.ring(r.oe, r.ob, "objectives with evidence"), K.owner(r.owner)] });
    const from = total ? page * PER + 1 : 0, to = Math.min(total, page * PER + PER);
    const foot = `<span class="num">${fmt(from)}–${fmt(to)} of ${fmt(total)}</span>${v.out || v.layer ? "" : '<span class="k3c-same">The workbook holds the same rows.</span>'}<span class="k3c-pg">${K.btn("Previous", { sm: true, act: "k3c.page", arg: page - 1, disabled: page <= 0 ? "This is the first page" : "" })}${K.btn("Next", { sm: true, act: "k3c.page", arg: page + 1, disabled: page >= pages - 1 ? "This is the last page" : "" })}</span>`;
    const table = K.table({ label: "Controls", cols: [{ label: "Control" }, { label: "Status" }, { label: "Source", cls: "nw" }, { label: "Responsibility" }, { label: "Components", cls: "nw k3c-w2" }, { label: "Evidence", cls: "nw" }, { label: "Owner", cls: "k3c-own" }],
      rows: slice.map(row), foot, empty: { title: v.out ? "Nothing is tailored out" : "No controls match", line: v.out ? "Every control a layer selects is in the baseline." : "Clear a filter or choose another family.", action: anyFilter(v) ? K.btn("Clear filters", { sm: true, act: "k3c.clear" }) : "" } });
    return K.page({ head: head("list"), cls: "k3c", body: K.split(rail, [cards, chips, tools, showing(v, total), table]) });
  }

  // ——— Another program than WS-X90: its own baseline, or an empty Controls with its Add control ———
  const made = () => { const H = PA.v2hubs; return H && H.madeOne && !wsx() ? H.madeOne(prog()) : null; };
  function rowsOther() {
    const d = made(), H = PA.v2host, own = get("added", []);
    if (d && PA.v3p && PA.v3p.standing) return [...PA.v3p.standing(d).values()].map((s) => ({ code: s.c, title: s.t, fam: famOf(s.c), status: s.cs, kind: s.kind, provider: s.offer && H && H.PROV[s.offer.pid] ? H.PROV[s.offer.pid].name : null, reqs: s.reqs || [], made: true }));
    return own.map((x) => ({ code: x.code, title: x.title || "", fam: famOf(x.code), status: "no_requirement", kind: "System-specific", provider: null, reqs: [] }));
  }
  function listOther() {
    const v = vw(), all = rowsOther().sort((a, b) => byCode(a.code, b.code)), d = made();
    if (!all.length) return K.page({ head: head("list"), cls: "k3c", body: K.empty({ title: "No controls yet", line: "This program has chosen no baseline. Add the first control, or choose a baseline in the program's setup.", action: K.btn("Add control", { primary: true, act: "k3c.addcode" }) }) });
    const q = (v.q || "").toLowerCase(), shown = all.filter((r) => (!v.fam || r.fam === v.fam) && (!v.status || r.status === v.status) && (!q || `${r.code} ${r.title}`.toLowerCase().includes(q)));
    const fams = uniq(all.map((r) => r.fam)), sat = all.filter((r) => r.status === "satisfied").length;
    const pages = Math.max(1, Math.ceil(shown.length / PER)), page = Math.min(v.page || 0, pages - 1);
    const rail = K.rail({ title: "Control families", act: "k3c.fam", label: "Control family", items: [{ id: "", label: "All families", count: all.length, on: !v.fam }].concat(fams.map((f) => ({ id: f, code: f, label: famName(f), count: all.filter((r) => r.fam === f).length, on: v.fam === f }))) });
    const tl = d && PA.v3p && PA.v3p.recs ? PA.v3p.recs(d.code, "tl") : get("added", []);
    let stack = [];
    if (d) { try { const f = frag(((P["pn-baseline"] && P["pn-baseline"]()) || {}).body); stack = [...f.querySelectorAll("table.pn-stack tbody tr")].map((tr) => { const td = tr.querySelectorAll("td"); return { name: strip((td[0].querySelector(".t") || td[0]).innerHTML), d: [strip(td[1].innerHTML), strip(td[2].innerHTML)].filter((x) => x && x !== "—").join(" "), n: strip(td[3].innerHTML) }; }); } catch (e) { stack = []; } }
    const tin = tl.filter((x) => x.act !== "remove").length, tout = tl.filter((x) => x.act === "remove").length;
    if (stack.length && tl.length) stack.push({ name: "Tailoring since setup", d: `${tin ? "+" + tin : ""}${tin && tout ? " " : ""}${tout ? "−" + tout : ""}`, n: fmt(all.length) });
    const base = `<section class="k3-card k3c-base" aria-label="Baseline"><div class="k3-sec-h"><h2 class="k3-card-t">Baseline</h2></div><div class="k3c-base-n"><span class="num">${fmt(all.length)}</span> controls${d ? ", as the program's setup resolved its stack" : ""}</div>${stack.length ? `<ul class="k3c-lys">${stack.map((r, i) => `<li><div class="k3c-ly still"><span class="l">${esc(r.name)}</span><span class="d num">${i ? esc(r.d) : ""}</span><span class="n num">${esc(r.n)}</span></div></li>`).join("")}</ul>` : `<p class="k3-muted">${tl.length ? `${plural(tl.length, "tailoring decision")} so far.` : "No tailoring decision yet."}</p>`}</section>`;
    const table = K.table({ label: "Controls", cols: [{ label: "Control" }, { label: "Status" }, { label: "Responsibility" }, { label: "Requirements" }],
      rows: shown.slice(page * PER, page * PER + PER).map((r) => Object.assign(r.made && P["v3p-ctl"] ? { panel: "v3p-ctl", id: r.code } : {}, { cells: [K.name(r.title || r.code, "", r.code), stPill(r.status), esc(r.kind === "System-specific" ? "This system" : `${r.kind} · ${r.provider || "a provider"}`), r.reqs.length ? esc(r.reqs.join(", ")) : NONE] })),
      foot: `<span class="num">${fmt(shown.length ? page * PER + 1 : 0)}–${fmt(Math.min(shown.length, page * PER + PER))} of ${fmt(shown.length)}</span><span class="k3c-pg">${K.btn("Previous", { sm: true, act: "k3c.page", arg: page - 1, disabled: page <= 0 ? "This is the first page" : "" })}${K.btn("Next", { sm: true, act: "k3c.page", arg: page + 1, disabled: page >= pages - 1 ? "This is the last page" : "" })}</span>`,
      empty: { title: "No controls match", line: "Clear the search or choose another family.", action: K.btn("Clear filters", { sm: true, act: "k3c.clear" }) } });
    return K.page({ head: head("list"), cls: "k3c", body: K.split(rail, [K.cards(K.completion({ label: "Controls satisfied", done: sat, total: all.length, unit: "controls" }), base),
      K.toolbar({ search: { act: "k3c.q", value: v.q, placeholder: "Search controls" }, filters: [{ label: "Status", act: "k3c.f.status", value: v.status, options: Object.keys(SSP.STATUS).map((k) => [k, SSP.STATUS[k][0]]) }] }), table]) });
  }
  V3.S("controls", () => (wsx() ? listWSX() : listOther()));

  // ——— Coverage: the components by control family (what Posture drew), as a view of this page ———
  K.screen("controls-coverage", () => {
    if (!wsx()) return listOther();
    let body = "";
    try {
      const f = frag(S.posture ? S.posture() : ""), root = f.querySelector(".main") || f;
      for (const el of root.querySelectorAll(".ak-ih, .ph, .k3-head, .ak-tabs, .tabs, .next, .ak-banner, .banner, [role='tablist']")) { if (!el.closest(".card, .ak-card, .frame")) el.remove(); }
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let tn;
      while ((tn = tw.nextNode())) if (/element/i.test(tn.nodeValue)) tn.nodeValue = tn.nodeValue.replace(/\belement(s?)\b/g, "component$1").replace(/\bElement(s?)\b/g, "Component$1");
      const box = document.createElement("div"); box.appendChild(root.cloneNode(true)); body = root.classList && root.classList.contains("main") ? root.innerHTML : box.innerHTML;
    } catch (e) { body = ""; }
    return K.page({ head: head("coverage"), cls: "k3c", body: [`<p class="k3-muted k3c-covt">Where the baseline's objectives are mapped: one row a component, one column a control family. A cell opens what stands there.</p>`, body ? `<div class="k3c-cov">${body}</div>` : K.empty({ title: "Coverage could not be drawn", line: "The list holds the same controls." })] });
  }, "controls");

  // ════════════════ Actions on the list ════════════════
  const redraw = () => K.redraw();
  const ACT = {};
  const act = (name, fn) => { ACT[name] = fn; K.on(name, fn); };
  K.on("k3c.fam", (id) => { setView(id === "__out" ? { out: true, fam: "", chip: "" } : { fam: id, out: false }); redraw(); });
  K.on("k3c.chip", (id) => { setView({ chip: id, out: false }); redraw(); });
  K.on("k3c.q", (v) => { setView({ q: v }); redraw(); });
  for (const k of ["status", "source", "resp", "tech", "owner"]) K.on("k3c.f." + k, (v) => { setView({ [k]: v, out: false }); redraw(); });
  K.on("k3c.mini", (k) => { const v = vw(); setView({ mini: v.mini === k ? "" : k, out: false }); redraw(); });
  K.on("k3c.layer", (k) => { const v = vw(); setView({ layer: v.layer === k ? "" : k, out: false }); redraw(); });
  K.on("k3c.clear", () => { put("view", Object.assign({}, VIEW0)); redraw(); });
  K.on("k3c.page", (n) => { setView({ page: Math.max(0, +n || 0) }, true); redraw(); const m = document.getElementById("main"); if (m) m.scrollTop = Math.max(0, (m.querySelector(".k3-tools") || m).offsetTop - 12); });
  K.on("k3c.ssp", (at) => { if (V.go) V.go("ssp", { at: at || "s11" }); else location.hash = "ssp"; });
  K.on("k3c.export", () => {
    const rows = wsx() ? applyView(rowsWSX(prog()), vw()) : rowsOther();
    const cell = (s) => `"${String(s == null ? "" : s).replace(/"/g, '""')}"`;
    const csv = [["Control", "Title", "Family", "Status", "Source", "Responsibility", "Owner"].map(cell).join(",")].concat(rows.map((r) => [r.code, r.title, r.fam, STW(r.status)[0], r.src ? layerName(r.src) : "", r.resp ? r.resp.word : r.kind, r.owner || ""].map(cell).join(","))).join("\n");
    if (typeof K.save === "function") K.save(`${prog()}-controls.csv`, csv); else K.toast(`${plural(rows.length, "control")} are ready, but this view cannot save a file`);
  });

  // ——— Tailoring a control in or out ———
  const total = () => model(prog()).set.size;
  function tailorIn(codes, why, titles = {}) {
    const m = model(prog()), rem = get("removed", []), add = get("added", []).slice();
    const back = new Set(rem.map((x) => x.code));
    put("removed", rem.filter((x) => !codes.includes(x.code)));
    for (const c of codes) if (!back.has(c) && !m.set.has(c) && !add.some((x) => x.code === c)) add.push({ code: c, title: titles[c] || titleOf(c), why, by: ME, at: TODAY });
    put("added", add);
  }
  function tailorOut(code, why) {
    const add = get("added", []);
    if (add.some((x) => x.code === code)) put("added", add.filter((x) => x.code !== code));
    if (model(prog()).set.has(code)) put("removed", get("removed", []).filter((x) => x.code !== code).concat([{ code, why, by: ME, at: TODAY }]));
  }
  function catalogItems() {
    const m = model(prog()), tx = techIx(), R = ref(), items = [], seen = new Set();
    const push = (code, group, meta) => { if (seen.has(code) || m.set.has(code)) return; seen.add(code); items.push({ id: code, code, title: titleOf(code) || `${famName(famOf(code))} control`, group, meta }); };
    for (const code of [...m.out.keys()].sort(byCode)) push(code, "Removed by a layer", `Removed by ${layerName(m.out.get(code))}`);
    for (const o of Object.values(R.ovl)) for (const code of o.adds.slice().sort(byCode)) push(code, "In a published overlay the stack does not hold", o.name);
    for (const code of [...tx.keys()].sort(byCode)) push(code, "Supports a cyber resiliency technique", tx.get(code).slice(0, 2).map((t) => t.t).join(", "));
    return items;
  }
  K.on("k3c.add", () => {
    const items = catalogItems(), w = waitLine();
    K.pick({ title: "Add controls from the catalog", multi: true, search: "Search NIST SP 800-53 Rev 5 by code or title", submit: (n) => (n ? `Add ${plural(n, "control")}` : "Add controls"),
      intro: `Controls outside the baseline join under Program tailoring. ${plural(items.length, "control")} listed: those a layer removed, a published overlay adds, or Table E-1 ties to a cyber resiliency technique.${w ? " " + esc(w) : ""}`,
      items, create: { label: "Add another control by its code", onCreate: () => ACT["k3c.addcode"]() },
      extra: [{ key: "why", label: "Rationale", type: "textarea", rows: 2, required: true, hint: "Recorded with the tailoring decision and printed in SSP section 10." }],
      onPick: (ids, x) => { tailorIn(ids, x.why); put("view", Object.assign({}, VIEW0, { source: "tailor" })); redraw(); K.toast(`${ids.length === 1 ? ids[0] : plural(ids.length, "control")} added under Program tailoring · ${plural(total(), "control")}`); } });
  });
  act("k3c.addcode", () => K.form({ title: "Add control", submit: "Add control", intro: wsx() ? "Any control of NIST SP 800-53 Rev 5 joins the baseline under Program tailoring." : "The control joins this program's baseline as its own tailoring decision.", fields: [
    { key: "code", label: "Control", required: true, placeholder: "SC-7(20)", half: true }, { key: "title", label: "Title", half: true },
    { key: "why", label: "Rationale", type: "textarea", rows: 3, required: true }],
    onSubmit: (v) => {
      const code = v.code.toUpperCase().replace(/\s+/g, "");
      if (!/^[A-Z]{2}-\d+(\(\d+\))?$/.test(code)) return { code: "Enter a control as the catalog writes it: SC-7(20)." };
      if (wsx()) { if (model(prog()).set.has(code)) return { code: `${code} is already in the baseline.` }; tailorIn([code], v.why, v.title ? { [code]: v.title } : {}); put("view", Object.assign({}, VIEW0, { source: "tailor" })); }
      else {
        if (rowsOther().some((r) => r.code === code)) return { code: `${code} is already in the baseline.` };
        const d = made(), t = v.title || (SSP.ctl(code) || {}).t || "";
        if (d) V.set(`v3.P.${d.code}.tl`, (V.get(`v3.P.${d.code}.tl`, null) || []).concat([{ code, act: "add", why: v.why, title: t, by: ME, at: TODAY }]));
        else put("added", get("added", []).concat([{ code, title: t, why: v.why, by: ME, at: TODAY }]));
      }
      redraw(); K.toast(`${code} added to the baseline · ${plural(wsx() ? total() : rowsOther().length, "control")}`);
    } }));
  K.on("k3c.remove", (code) => {
    const n = reqsOf(code).length, w = waitLine();
    K.form({ title: "Remove from the baseline", submit: "Remove control", danger: true, intro: `${esc(code)} ${esc(rec(code).t || "")} leaves the baseline's ${fmt(total())} controls and moves to Tailored out, from where it can be restored. ${n ? `Its ${plural(n, "requirement")} and its implementation text stay on record. ` : ""}${esc(w)}`,
      fields: [{ key: "why", label: "Rationale", type: "textarea", rows: 3, required: true }],
      onSubmit: (v) => { tailorOut(code, v.why); redraw(); K.toast(`${code} removed from the baseline · ${plural(total(), "control")}`); } });
  });
  K.on("k3c.restore", (code) => K.confirm({ title: "Restore to the baseline", submit: "Restore control", text: `${esc(code)} ${esc(titleOf(code))} returns to the baseline under Program tailoring, which will hold ${fmt(total() + 1)} controls. ${esc(waitLine())}`,
    onOk: () => { tailorIn([code], "Restored to the baseline"); redraw(); K.toast(`${code} restored · ${plural(total(), "control")}`); } }));

  // ——— Edit baseline: the layers with a switch each, Add overlay, and what changes before Apply ———
  let EB = null;
  function ebBody() {
    const now = model(prog()), next = derive(layersDef([...EB.off], EB.ovl));
    const plus = [...next.set].filter((c) => !now.set.has(c)).sort(byCode), minus = [...now.set].filter((c) => !next.set.has(c)).sort(byCode);
    const codes = (l) => (l.length ? `${l.slice(0, 36).map((c) => `<span class="k3c-code">${esc(c)}</span>`).join(" ")}${l.length > 36 ? ` ${muted(`and ${l.length - 36} more`)}` : ""}` : muted("None"));
    const left = Object.values(ref().ovl).filter((o) => !EB.ovl.includes(o.key));
    const rows = next.rows.map((r) => `<li class="k3c-eb-r${r.on ? "" : " off"}"><span class="x"><b>${esc(r.name)}</b><span class="k3c-mu">${esc(r.kind)}${r.extra ? " · added here" : ""}</span></span><span class="num d">${!r.on ? "Not applied" : r.key === "high" ? "" : `${r.added.length ? "+" + fmt(r.added.length) : ""}${r.added.length && r.removed.length ? " " : ""}${r.removed.length ? "−" + fmt(r.removed.length) : ""}${r.added.length || r.removed.length ? "" : "No change"}`}</span><span class="num n">${fmt(r.count)}</span>${r.fixed ? `<span class="k3c-mu s">${r.key === "high" ? "The root" : "Stays last"}</span>` : r.extra ? `<span class="s">${K.btn("Remove", { sm: true, quiet: true, act: "k3c.eb.drop", arg: r.key })}</span>` : `<span class="s"><button type="button" class="k3c-sw" role="switch" aria-checked="${r.on}" aria-label="Apply ${esc(r.name)}"${K.a("k3c.eb.toggle", r.key)}></button></span>`}</li>`).join("");
    const w = waitLine();
    return `<ul class="k3c-eb-l">${rows}</ul>
      <div class="k3c-eb-add">${left.length ? left.map((o) => K.btn(`Add overlay: ${o.name}`, { sm: true, icon: "plus", act: "k3c.eb.add", arg: o.key })).join("") : muted("Every published overlay of NIST SP 800-53 Rev 5 is in the stack.")}</div>
      <section class="k3c-eb-w" aria-label="What changes"><h5>What changes</h5>${K.facts([["Controls", `<span class="num">${fmt(now.set.size)} now · ${fmt(next.set.size)} after</span>`], ["Added", codes(plus)], ["Removed", codes(minus)]])}</section>
      ${w ? `<p class="k3-muted">${esc(w)} The list, the totals and section 10 of the next SSP revision follow at once.</p>` : ""}`;
  }
  const ebSame = () => { const a = get("off", []).slice().sort().join(","), b = get("ovl", []).join(","); return a === [...EB.off].sort().join(",") && b === EB.ovl.join(","); };
  function ebDraw() { const el = document.getElementById("k3c-eb"); if (el) el.innerHTML = ebBody(); const b = document.querySelector("#modal [data-k3-submit]"); if (b) b.setAttribute("aria-disabled", String(ebSame())); }
  K.on("k3c.baseline", () => {
    if (!wsx()) return;
    EB = { off: new Set(get("off", [])), ovl: get("ovl", []).slice() };
    K.dialog({ title: "Edit baseline", wide: true, submit: "Apply to the baseline", body: `<p class="k3-muted">Switch an overlay off, or add a published one. Program tailoring stays last.</p><div id="k3c-eb" class="k3c-eb"></div>`,
      onOk: () => { const before = total(); put("off", [...EB.off]); put("ovl", EB.ovl.slice()); put("view", Object.assign({}, VIEW0)); redraw(); const d = total() - before; K.toast(`Baseline applied: ${plural(total(), "control")}${d ? ` (${fmt(Math.abs(d))} ${d > 0 ? "more" : "fewer"})` : ""}`); } });
    ebDraw();
  });
  K.on("k3c.eb.toggle", (k) => { if (!EB) return; if (EB.off.has(k)) EB.off.delete(k); else EB.off.add(k); ebDraw(); const s = document.querySelector(`#k3c-eb [data-k3a='${JSON.stringify(k)}']`); if (s) s.focus(); });
  K.on("k3c.eb.add", (k) => { if (!EB || EB.ovl.includes(k)) return; EB.ovl.push(k); ebDraw(); });
  K.on("k3c.eb.drop", (k) => { if (!EB) return; EB.ovl = EB.ovl.filter((x) => x !== k); ebDraw(); });

  // ════════════════ The control's side panel: everything done to a control is done here ════════════════
  const people = () => { const L = V3.fact("people", prog()) || []; return L.length ? L.map((p) => [p.name, `${p.name} · ${p.rmf || p.role}`]) : [[ME, ME]]; };
  // The one next step of a control: its words, and the button that does it (the preview's next line, the page's one primary).
  // lead: lane E knows which open assessment's plan holds a control and how many of its objectives are judged there, drafts
  // included; the control's page reads both, so it never offers "Add to assessment campaign" for a control a campaign holds,
  // nor "0 judged" beside a determination.
  const eCamp = (code) => { try { return typeof V3.facts.campaignOf === "function" ? V3.fact("campaignOf", code) || null : null; } catch (e) { return null; } };
  const eJudged = (code) => { try { return (typeof V3.facts.judgedN === "function" && V3.fact("judgedN", code)) || { n: 0, draft: false }; } catch (e) { return { n: 0, draft: false }; } };
  function stepOf(code, st, r) {
    const v = view(code) || {}, ch = CH();
    if (r.kind === "Inherited") return null;
    const mk = (label, o) => ({ primary, sm }) => (o.modal ? `<button type="button" class="btn${sm ? " sm" : ""}${primary ? " ink" : ""}" data-modal="${esc(o.modal)}" data-id="${esc(o.id)}">${esc(label)}</button>`
      : o.attrs ? `<button type="button" class="btn${sm ? " sm" : ""}${primary ? " ink" : ""}" ${o.attrs}>${esc(label)}</button>` : K.btn(label, Object.assign({ primary, sm }, o)));
    if (st === "no_requirement") return { text: "No requirement maps it yet.", btn: mk("Add requirement", { act: "k3c.req.add", arg: code }) };
    if (st === "no_evidence") return { text: "Its requirements cite no evidence.", btn: mk("Add evidence", { act: "k3c.ev.add", arg: code }) };
    const s = v.step; if (!s) return null;
    const ec = st === "not_assessed" && !v.camp ? eCamp(code) : null;
    if (ec) { const j = eJudged(code), ob = v.ob || 0; return { text: j.n ? `${esc(ec.short)} holds it: ${fmt(j.n)} of ${fmt(ob)} ${ob === 1 ? "objective" : "objectives"} judged${j.draft ? ", in draft results" : ""}.` : `${esc(ec.short)} holds it; nobody has judged it yet.`, btn: mk("Open assessment campaign", { go: ec.route }) }; }
    const text = st === "not_assessed" ? (v.camp ? `${esc(v.camp.short)} holds it; nobody has judged it yet.` : "Its evidence waits on an assessor.") : "An assessor found it short of satisfied.";
    return { text, btn: mk(s.label, s.modal ? { modal: s.modal, id: s.id || code } : ch && ch.goAttr ? { attrs: ch.goAttr(s.route, s.q) } : { go: s.route }) };
  }
  function statement(code) {
    const ps = paramsOf(code); if (!ps.length) return "";
    const slot = (p) => `<span role="button" tabindex="0" class="k3c-pv${p.value ? "" : " unset"}" title="${esc(`${p.label} · ${p.what}${p.by ? " · set by " + p.by : " · not set"}`)}"${K.a("k3c.param", p.id)}>${p.value ? esc(p.value) : `[${esc(p.what)}]`}</span>`;
    const tpl = STMT[code]; let body;
    if (tpl) body = `<p class="k3c-stmt">${esc(tpl).replace(/\{([\w-]+)\}/g, (m0, id) => { const p = ps.find((x) => x.id === id); return p ? slot(p) : m0; })}</p>`;
    else body = `<ul class="k3c-plist">${ps.map((p) => `<li><span class="k3c-mu">${esc(p.label)}</span> ${slot(p)}</li>`).join("")}</ul>`;
    const unset = ps.filter((p) => !p.value).length;
    return K.section({ id: "k3c-stmt", title: "Statement", sub: `${plural(ps.length, "parameter")}${unset ? `, ${fmt(unset)} not set` : ", all set"}. Choose a value to change it; it is set on Program tailoring.`, body });
  }
  // Implementation: one row a component that carries it, and the system's own. On a component's page of the control, that
  // component's text stands first, whole, and the others follow.
  const implSt = (im) => (im && im.status && IMPLW(im.status) ? K.status(IMPLW(im.status)[0], IMPLW(im.status)[1]) : NONE);
  const implCell = (name, im, wide) => `<span class="k3-nm"><span class="k3-nm-t">${name}</span><span class="k3c-impl${wide ? " wide" : ""}${im && im.text ? "" : " none"}">${im && im.text ? esc(im.text) : `Not written yet. <span class="k3-link">Write it</span>`}</span></span>`;
  const sspLink = (code) => { let to = null; try { to = typeof V3.facts.sspAt === "function" ? V3.fact("sspAt", code) : null; } catch (e) { to = null; } return to ? K.link(`Open the SSP at ${code}`, to) : K.actLink(`Open the SSP at ${code}`, "k3c.ssp", code); };
  function implCard(code, lead, page) {
    const comps = compsOf(code), others = comps.filter((c) => c !== lead), order = lead ? [lead].concat(others) : comps;
    const sys = implOf(code, ""), b = SSP.ctl(code);
    const sysRow = { act: "k3c.impl", arg: { code, comp: "" }, cells: [implCell("The system as a whole", sys, page), implSt(sys), ""] };
    // lead: a component the system's text names is not given that whole text again, row after row: one line says where it is.
    const row = (c) => { const im0 = implShown(code, c), im = im0 && im0.fromSsp ? Object.assign({}, im0, { text: "Covered by the system's text above, which names this component. Nothing more is written for it here." }) : im0; return { act: "k3c.impl", arg: { code, comp: c }, cls: c === lead ? "k3c-lead" : "", cells: [implCell(compLink(c), im, page), implSt(im), K.btn("Remove", { sm: true, quiet: true, act: "k3c.comp.rm", arg: { code, comp: c }, title: `Remove ${compName(c)} from ${code}` })] }; };
    const rev = SSP.doc ? `SSP revision ${SSP.doc.revision} (${String(SSP.doc.state || "").toLowerCase()})` : "the SSP";
    const under = `<p class="k3-muted k3c-under">${b ? `Section 11 of ${esc(rev)} prints the system's text. ${sspLink(code)}` : "It prints in section 11 of the next SSP revision."}</p>`;
    const cols = [{ label: "Where it is implemented" }, { label: "Status", cls: "nw" }, { label: "", cls: "tight" }], add = { label: "Add component", act: "k3c.comp.add", arg: code };
    if (page && lead) {
      const im = implShown(code, lead), name = compName(lead);
      return [K.section({ id: "k3c-impl-lead", title: `${name}'s implementation`, actions: im ? implSt(im) : "", body: im && im.text ? `<p class="k3c-prose">${esc(im.text)}</p>${im.fromSsp ? `<p class="k3-muted">From the control's implementation in the system security plan, which names this component. Write this component's own text to replace it here.</p>` : ""}` : `<div class="k3-none-row"><span>Nothing is written yet for how ${esc(name)} implements ${esc(code)}.</span>${K.actLink("Write implementation", "k3c.impl", { code, comp: lead })}</div>` }),
        K.related({ id: "k3c-impl", title: "Implemented elsewhere", add, cols, rows: [sysRow].concat(others.map(row)) }) + under];
    }
    return [K.related({ id: "k3c-impl", title: "Implementation", add, cols, rows: lead ? order.map(row).concat([sysRow]) : [sysRow].concat(order.map(row)) }) + under];
  }
  // Requirements and evidence are rows of the kit's table: a click goes to the record's page, the eye previews it (the kinds are
  // lane D's; without it the requirement keeps v2's preview and evidence rows stay still).
  const reqKind = () => { let k = null; try { k = V3.fact("reqPanel"); } catch (e) { k = null; } return k || "v7p-req"; };
  const evKind = () => { let k = null; try { k = V3.fact("evPanel"); } catch (e) { k = null; } return k || ""; };
  const artIx = memo(() => { const m = new Map(); try { for (const a of (typeof V3.facts.artifacts === "function" && V3.fact("artifacts")) || []) if (a && a.title && a.id && !m.has(a.title)) m.set(a.title, a.id); } catch (e) { /* lane D not here */ } return m; });
  const artOf = (x) => (x.id && dArt(x.id) ? x.id : artIx(prog()).get(x.title) || "");
  function reqSection(code, reqs, evs, page) {
    const kind = reqKind();
    const alloc = (id) => { const els = ((dReq(id) || reqById(id) || {}).els || []).filter((e) => e !== ROOT); return els.length ? `${esc(els.slice(0, 2).map(compName).join(", "))}${els.length > 2 ? ` ${muted(`and ${els.length - 2} more`)}` : ""}` : muted("The system"); };
    const rows = reqs.map((x) => { const un = K.btn("Unmap", { sm: true, quiet: true, act: "k3c.req.rm", arg: { code, id: x.id } }), st = page ? (dReq(x.id) || {}).st || "" : "";
      return { panel: kind, id: x.id, cells: page ? [K.name(x.title || x.id, x.today ? "Mapped today" : st, x.id), alloc(x.id), K.num(evs.filter((e) => e.req === x.id).length), un] : [K.name(x.title || x.id, x.today ? "Mapped today" : "", x.id), un] }; });
    return K.related({ id: "k3c-reqs", title: "Requirements", add: { label: "Add requirement", act: "k3c.req.add", arg: code }, empty: `No requirement maps ${code} yet`,
      cols: page ? [{ label: "Requirement" }, { label: "Allocated to" }, { label: "Evidence", cls: "nw" }, { label: "", cls: "tight" }] : [{ label: "Requirement" }, { label: "", cls: "tight" }], rows });
  }
  function evSection(code, reqs, evs, page) {
    const kind = evKind(), rk = reqKind();
    const rows = evs.map((x) => { const id = kind ? artOf(x) : "", rm = K.btn("Remove", { sm: true, quiet: true, act: "k3c.ev.rm", arg: { code, title: x.title } }), to = x.req ? K.recRoute(rk, x.req) : "";
      return Object.assign(id ? { panel: kind, id } : {}, { cells: page ? [K.name(x.title), to ? K.link(x.req, to) : esc(x.req || ""), esc(x.state), rm] : [K.name(x.title, `Cited by ${x.req} · ${x.state}`), rm] }); });
    return K.related({ id: "k3c-evs", title: "Evidence", add: reqs.length ? { label: "Add evidence", act: "k3c.ev.add", arg: code } : null, empty: reqs.length ? "Its requirements cite no evidence yet" : "Evidence comes through a requirement that maps the control",
      cols: page ? [{ label: "Evidence" }, { label: "Cited by", cls: "nw" }, { label: "State", cls: "nw" }, { label: "", cls: "tight" }] : [{ label: "Evidence" }, { label: "", cls: "tight" }], rows });
  }
  // A control's assessment objectives: label, text and whether an assessor has judged each (lane F's records). In the preview
  // they fold under Assessment; on the page they are a table of their own.
  const objsOf = (code) => { const R3 = PA.v3r; if (!R3 || !R3.objectivesOf) return null; const objs = R3.objectivesOf(code) || []; if (!objs.length || objs.every((o) => o.ex)) return null;
    const v = view(code) || {}, all = respOf(code).kind === "Inherited" || (v.oa || 0) >= (v.ob || objs.length), judged = new Set((R3.judgedOf ? R3.judgedOf(code) : []).map((o) => o.i)); return { objs, is: (o) => all || judged.has(o.i) }; };
  const objGroup = (code) => {
    const O = objsOf(code); if (!O) return "";
    return K.group({ id: "k3c-obj-" + code.replace(/[^A-Za-z0-9]+/g, "-"), title: "Objectives", meta: `<span class="num">${O.objs.length}</span>`, body: `<ol class="k3c-objs">${O.objs.map((o) => `<li><span class="k3-code">${esc(o.label)}</span><span class="t">${esc(o.text)}</span><span class="k3-muted s">${O.is(o) ? "Judged" : "Not judged"}</span></li>`).join("")}</ol>` });
  };
  const objSection = (code) => {
    const O = objsOf(code); if (!O) return "";
    return K.section({ id: "k3c-objs", title: "Objectives", count: O.objs.length, body: K.table({ label: "Assessment objectives", cols: [{ label: "Objective", cls: "nw" }, { label: "An assessor determines that" }, { label: "Judged", cls: "nw" }],
      rows: O.objs.map((o) => ({ cells: [`<span class="k3-code">${esc(o.label)}</span>`, esc(o.text), O.is(o) ? "Judged" : muted("Not judged")] })) }) });
  };
  // Working through a list: where this control stands in the list as Controls is filtered now, with the one before and after.
  function viewWords(v) {
    const bits = [], chip = (CHIPS.find((c) => c[0] === v.chip) || [])[1];
    if (v.chip && chip) bits.push(chip); if (v.fam) bits.push(famName(v.fam)); if (v.status) bits.push(STW(v.status)[0]); if (v.source) bits.push(layerShort(v.source));
    if (v.resp) bits.push({ own: "This system", hybrid: "Hybrid", inherited: "Inherited" }[v.resp] || ""); if (v.tech) bits.push(v.tech === "*" ? "Any technique" : (techs().find((t) => t.code === v.tech) || {}).t || "");
    if (v.owner) bits.push(v.owner === "none" ? "No owner" : v.owner); if (v.layer) bits.push(`${layerShort(v.layer)} added`); if (v.mini) bits.push(MINIW[v.mini] || ""); if (v.comp) bits.push(`on ${compName(v.comp)}`);
    if (v.codes) bits.push(v.note || "named by another page"); if (v.q) bits.push(`"${v.q}"`);
    return bits.filter(Boolean);
  }
  function stepper(code) {
    const v = vw(); if (v.out) return "";
    const list = applyView(rowsWSX(prog()), v).map((r) => r.code), n = list.length, i = list.indexOf(code); if (!n || (n === 1 && i === 0)) return "";
    const to = (c, label) => `<a class="k3-link" href="#${esc(K.recRoute("k3c-control", c))}" title="${esc(`${c} ${rec(c).t || ""}`)}">${label}</a>`, w = viewWords(v), what = w.length ? esc(w.join(" · ")) : "controls";
    if (i < 0) { const nx = list.find((c) => byCode(c, code) > 0) || list[0]; return `<span class="k3c-step"><span>No longer among the <span class="num">${fmt(n)}</span> in ${K.link("Controls", "controls")}${w.length ? `: ${what}` : ""}</span>${to(nx, `Next: ${esc(nx)} ›`)}</span>`; }
    return `<span class="k3c-step"><span><span class="num">${fmt(i + 1)} of ${fmt(n)}</span> ${w.length ? `in ${K.link("Controls", "controls")}: ${what}` : "controls"}</span>${i > 0 ? to(list[i - 1], "‹ Previous") : ""}${i < n - 1 ? to(list[i + 1], `Next: ${esc(list[i + 1])} ›`) : ""}</span>`;
  }
  function panelWSX(id, opts = {}) {
    const page = !!opts.page, [code, lead0] = String(id || "").split("@"); if (!code) return null;
    const m = model(prog()), home = ["Controls", "controls"];
    if (!m.set.has(code)) {
      if (!m.out.has(code)) return null;
      const by = m.out.get(code), mine = get("removed", []).find((x) => x.code === code);
      return { label: "Control", title: titleOf(code) || code, code, chip: K.status("Tailored out", "none"), crumbs: [home, [code]], actions: K.btn("Restore to the baseline", { sm: !page, primary: true, act: "k3c.restore", arg: code }),
        sections: page ? [`<p class="k3-muted">${esc(layerName(by))} removed ${esc(code)} from the baseline${mine ? `: ${esc(mine.why)}` : ""}. Nothing is owed for it while it is out; restoring it brings it back under Program tailoring.</p>`] : [],
        facts: [["Removed by", esc(layerName(by))], mine ? ["Rationale", esc(mine.why)] : null, mine ? ["When", `${esc(md(mine.at))} · ${esc(mine.by)}`] : null, ["Family", `${esc(famOf(code))} ${esc(famName(famOf(code)))}`]] };
    }
    const lead = lead0 || "";
    const b = rec(code), st = statusOf(code), r = respOf(code), v = view(code) || b, own = ownerOf(code);
    const reqs = reqsOf(code), evs = evOf(code), ch = CH(), step = stepOf(code, st, r);
    const src = m.src.get(code) || "high", addRec = get("added", []).find((x) => x.code === code);
    const facts = [
      ["Source", `${esc(layerName(src))}${addRec ? ` ${muted("· added " + md(addRec.at))}` : ""}`],
      ["Responsibility", `${esc(r.word)}${r.unauth ? ` ${muted("· not authorized")}` : r.kind === "Inherited" ? ` ${muted("· its status is the provider's")}` : ""} ${K.actLink("Change", "k3c.resp", code)}`],
      ["Owner", `${K.owner(own)} ${K.actLink(own ? "Change" : "Assign", "k3c.owner", code)}`],
    ];
    const fnd = V3.fact("finding", code) || null, camp = v.camp || eCamp(code), ej = eJudged(code), jn = r.kind === "Inherited" ? v.ob : Math.min(v.ob || 0, Math.max(v.oa || 0, ej.n || 0));
    const assess = [
      ["Objectives", `<span class="num">${fmt(jn || 0)} of ${fmt(v.ob || 0)}</span> judged${ej.draft && (ej.n || 0) > (v.oa || 0) ? " (draft results)" : ""} · <span class="num">${fmt(v.om || 0)}</span> mapped · <span class="num">${fmt(v.oe || 0)}</span> with evidence`],
      ["Determination", fnd ? `${stPill(fnd.det)} ${muted(md(fnd.date))}` : DETS.has(st) ? stPill(st) : muted(r.kind === "Inherited" ? `${r.provider}'s assessor` : "None yet")],
      v.db ? ["Determined by", esc(v.db)] : null,
      ["Campaign", fnd && fnd.camp ? K.link(fnd.camp, fnd.route || "assessments") : camp ? K.link(camp.short, camp.route) : NONE],
    ];
    const iss = ((PA.riskLookup && PA.riskLookup.all().ISS) || []).filter((i) => (i.from || []).some((f) => f[0] === code));
    const frows = [];
    if (fnd && fnd.det !== "satisfied") frows.push({ go: "findings-assessment", cells: [K.name(`${STW(fnd.det)[0]} · ${fnd.res || "Assessment finding"}`, fnd.camp || ""), muted(md(fnd.date))] });
    for (const i of iss) frows.push({ panel: "a-risk-issue", id: i.id, cells: [K.name(i.title, `Operational issue · ${i.sev}`), muted(i.poam ? "Has a POA&M item" : "No POA&M item")] });
    if (v.risk) frows.push({ panel: "a-risk-risk", id: `${v.risk.id}|overview`, cells: [K.name(v.risk.title, "Risk"), muted(v.risk.sev || "")] });
    if (typeof V3.facts.findingsOf === "function") { // lane E keeps the findings and the risks they raised
      let fs = [], rs = []; try { fs = V3.fact("findingsOf", code) || []; rs = (typeof V3.facts.risksOf === "function" && V3.fact("risksOf", code)) || []; } catch (e) { fs = []; rs = []; }
      frows.length = 0;
      for (const f of fs) frows.push({ panel: f.panel || "k3e-finding", id: f.id, cells: [K.name(f.title, [f.source, f.state === "draft" ? "draft results" : ""].filter(Boolean).join(" · ")), f.plan && f.plan.planned ? `<span class="num">${esc(md(f.plan.planned))}</span>` : muted("No plan")] });
      for (const x of rs) frows.push({ panel: x.panel || "k3e-risk", id: x.id, cells: [K.name(x.title, "Risk"), muted(x.sev ? String(x.sev).charAt(0).toUpperCase() + String(x.sev).slice(1) : "")] });
    }
    const findSec = K.related({ id: "k3c-fnd", title: "Findings and risks", cols: [{ label: "Record" }, { label: page ? "Planned" : "", cls: "nw" }], rows: frows, empty: "No finding or risk names it",
      add: typeof V3.facts.findingsOf === "function" ? { label: "Add finding", act: "k3e.f.add", arg: { control: code, comp: lead0 || "" } } : null }); // lead: lane E's form, opened on this control
    const more = [{ label: "Change responsibility", act: "k3c.resp", arg: code }, { label: "Assign owner", act: "k3c.owner", arg: code }, { label: "Remove from the baseline", act: "k3c.remove", arg: code, danger: true }];
    if (!page) { // the preview: the same record in a 520px panel
      const respNote = r.kind !== "System-specific" && r.offer ? `<p class="k3-muted k3c-under">${esc(r.offer.prov || "")}${r.kind === "Hybrid" && r.own ? ` <b>This system's part:</b> ${esc(r.own)}` : ""}</p>` : "";
      const sections = [statement(code), step ? K.next({ text: step.text, action: step.btn({ primary: true, sm: true }) }) : "", respNote].concat(implCard(code, lead, false),
        [reqSection(code, reqs, evs, false), evSection(code, reqs, evs, false), K.section({ title: "Assessment", body: K.facts(assess) + objGroup(code) }), findSec]);
      return { label: "Control", title: b.t || code, code, chip: stPill(st), actions: K.menu("More", more, { sm: true }), facts, sections: sections.filter(Boolean) };
    }
    // The page. One primary in its header: the next step; on a component's page of the control, that component's implementation.
    const lim = lead ? implShown(code, lead) : null, sys = implOf(code, "");
    const primary = lead ? K.btn(lim && lim.text ? "Edit implementation" : "Write implementation", { primary: true, act: "k3c.impl", arg: { code, comp: lead } })
      : step ? step.btn({ primary: true, sm: false }) : r.kind !== "Inherited" && !(sys && sys.text) ? K.btn("Write implementation", { primary: true, act: "k3c.impl", arg: { code, comp: "" } }) : "";
    const statusSec = K.section({ id: "k3c-status", title: "Status", sub: step ? step.text : st === "satisfied" ? "An assessor found it satisfied: nothing is owed." : r.kind === "Inherited" ? `${esc(r.provider)} implements and assesses it: its status is the provider's.` : "", body: K.facts(assess) });
    const impl = implCard(code, lead, true);
    const sections = (lead ? [impl[0], statusSec, statement(code), impl[1]] : [statement(code), statusSec].concat(impl)).concat([reqSection(code, reqs, evs, true), evSection(code, reqs, evs, true), objSection(code), findSec]);
    const tx = techIx().get(code) || [];
    facts.push(["Family", K.actLink(`${famOf(code)} ${famName(famOf(code))}`, "k3c.gofam", famOf(code))]);
    if (tx.length) facts.push(["Technique", esc(tx.map((t) => t.t).join(", "))]);
    const side = [];
    if (r.kind !== "System-specific" && r.offer) side.push(K.details(r.kind === "Hybrid" ? "Shared with a provider" : "Inherited from a provider", [["Provider", `${esc(r.provider)}${r.unauth ? ` ${muted("· not authorized")}` : ""}`], ["It provides", esc(r.offer.prov || "")], r.kind === "Hybrid" && r.own ? ["This system's part", esc(r.own)] : null]));
    if (addRec) side.push(K.details("Tailored in", [["When", `${esc(md(addRec.at))} · ${esc(addRec.by || "")}`], ["Rationale", esc(addRec.why || "")]]));
    let crumbs = [home, [code]], sub = stepper(code);
    if (lead) {
      const S1 = typeof V3.facts.component === "function", c = S1 ? V3.fact("component", lead) : null, par = c && c.parent && c.parent !== ROOT ? c.parent : "";
      crumbs = S1 ? [["System", "system"]].concat(par ? [[compName(par), "component--" + par]] : [], [[compName(lead), `component--${lead}--controls`], [code]]) : [home, [compName(lead)], [code]];
      sub = `How <b>${esc(compName(lead))}</b> implements this control. ${K.link(`${code} across the system`, K.recRoute("k3c-control", code))}`;
    }
    return { label: "Control", title: b.t || code, code, chip: stPill(st), crumbs, sub, actions: K.menu("More", more) + primary, facts, side, sections: sections.filter(Boolean) };
  }
  // The control's page, control--<code>, and a control on a component, control--<code>@<component>: this lane draws them from the
  // panel's own definition (called with { page: true }), so the page of a control on a component sits under System in the menu.
  K.record("k3c-control", { noun: "control", home: ["Controls", "controls"], nav: "controls" });
  function ctlPage(id) {
    let r = null; try { r = wsx() ? panelWSX(id, { page: true }) : null; } catch (e) { console.error(e); r = null; }
    if (!r) return K.page({ cls: "k3-rec", head: K.head({ crumbs: [["Controls", "controls"], ["Not found"]], title: "This control is not here" }), body: K.empty({ title: "Nothing at this address", line: "It may have been removed, or the address names a control this program's baseline does not hold.", action: K.btn("Back to Controls", { go: "controls" }) }) });
    return K.page({ cls: "k3-rec k3c-rec", head: K.head({ crumbs: r.crumbs, title: r.title, code: r.code, chip: r.chip, sub: r.sub || "", actions: r.actions || "" }), body: K.aside(r.sections, [K.details("Details", r.facts)].concat(r.side || [])) });
  }
  K.lazy(/^control--(.+)$/, (route, m) => { let id = m[1]; try { id = decodeURIComponent(id); } catch (e) { /* as typed */ } return ctlPage(id); }, (r) => (/(@|%40)/.test(r) && typeof V3.facts.component === "function" ? "system" : "controls"));
  K.on("k3c.gofam", (f) => { put("view", Object.assign({}, VIEW0, { fam: f })); K.go("controls"); });
  K.panel("k3c-control", (id, opts) => (wsx() ? panelWSX(id, opts) : null));
  // Every list that names a control opens this panel: v2's control preview is it while V3 is on, for WS-X90's baseline.
  V3.P("a-tests-control", (orig, id) => { const code = String(id || "").split("|")[0]; if (!wsx() || !code || !(model(prog()).set.has(code) || model(prog()).out.has(code))) return orig(); return P["k3c-control"](code); });

  // ——— Implementation, placement ———
  K.on("k3c.impl", (a) => {
    const im = implShown(a.code, a.comp) || {}, what = a.comp ? compName(a.comp) : "the system";
    K.form({ title: a.comp ? `${a.code} on ${what}` : `${a.code}: the system's implementation`, submit: "Save implementation",
      intro: a.comp ? `How ${esc(what)} implements ${esc(a.code)} ${esc(rec(a.code).t || "")}.` : `The narrative section 11 of the SSP prints for ${esc(a.code)}; the workbook's Narrative cell is the same text.`,
      fields: [{ key: "status", label: "Status", type: "select", required: true, value: im.status || "", options: Object.keys(SSP.IMPL).map((k) => [k, SSP.IMPL[k][0]]) }, { key: "text", label: "How it is implemented", type: "textarea", rows: 8, required: true, value: im.text || "" }],
      onSubmit: (v) => { setImpl(a.code, a.comp, { status: v.status, text: v.text }); redraw(); K.toast(`${a.code}'s implementation ${a.comp ? "on " + what : "for the system"} saved`); } });
  });
  K.on("k3c.comp.add", (code) => {
    const have = new Set(compsOf(code));
    K.pick({ title: `Add components to ${code}`, multi: true, search: "Search components", submit: (n) => (n ? `Add ${plural(n, "component")}` : "Add components"), intro: `Where ${esc(code)} ${esc(rec(code).t || "")} is implemented. Each component gets its own implementation text.`,
      items: allComps().map((c) => ({ id: c.code, code: c.code, title: c.name, group: c.group, held: have.has(c.code) ? "Added" : "" })),
      onPick: (ids) => { for (const c of ids) place(code, c, true); redraw(); K.toast(`${plural(ids.length, "component")} added to ${code}`); } });
  });
  K.on("k3c.comp.rm", (a) => { const im = implOf(a.code, a.comp);
    K.confirm({ title: "Remove component", submit: "Remove component", danger: true, text: `${esc(compName(a.comp))} no longer carries ${esc(a.code)}: it leaves the component's Controls${im ? ", and its implementation text for this control is dropped" : ""}.`,
      onOk: () => { place(a.code, a.comp, false); if (im) mapPut("impl", implKey(a.code, a.comp), undefined); redraw(); K.toast(`${compName(a.comp)} removed from ${a.code}`); } }); });

  // ——— Requirements and evidence ———
  const nextReqId = () => { const t = (V3.fact("requirements", prog()) || {}).total || 640; return `REQ-${Math.max(643, t) + get("madeReqs", []).length + 1}`; };
  function mapReq(code, id, title) {
    if (hasD() && V3.fact("requirement", id)) { V3.fact("mapControl", id, code); return; }
    const ch = CH(), s = chainSt(code), un = get("unmap", {})[code] || [];
    if (un.includes(id)) { mapPut("unmap", code, un.filter((x) => x !== id)); return; }
    if (ch && ch.put && !s.req) ch.put(code, { req: id, reqTitle: title, mapAt: TODAY });
    else mapPut("reqs", code, (get("reqs", {})[code] || []).filter((x) => x.id !== id).concat([{ id, title }]));
  }
  act("k3c.req.new", (code) => K.form({ title: "Create requirement", submit: "Create requirement", intro: `It maps ${esc(code)} ${esc(rec(code).t || "")} from the start.`, fields: [
    { key: "title", label: "Title", required: true, placeholder: "What the system must do, in one line" }, { key: "st", label: "Statement", type: "textarea", rows: 4, required: true },
    { key: "el", label: "Allocated to", type: "select", placeholder: "The system as a whole", options: allComps().map((c) => [c.code, c.name]) }],
    onSubmit: (v) => {
      let id = hasD() ? V3.fact("createRequirement", { title: v.title, statement: v.st, controls: [code], components: v.el ? [v.el] : [] }) : null;
      if (!id) { id = nextReqId(); put("madeReqs", get("madeReqs", []).concat([{ id, title: v.title, st: v.st, ctl: [code], els: v.el ? [v.el] : [], by: ME, at: TODAY }])); mapReq(code, id, v.title); }
      redraw(); K.toast(`${id} created and mapped to ${code}`); } }));
  K.on("k3c.req.add", (code) => {
    reqIndex(); const have = new Set(reqsOf(code).map((r) => r.id));
    const made = get("madeReqs", []).map((r) => ({ id: r.id, title: r.title })); let dMade = []; try { dMade = hasD() ? V3.fact("createdRequirements") || [] : []; } catch (e) { dMade = []; }
    for (const r of dMade) if (r && r.code && !made.some((m) => m.id === r.code)) made.push({ id: r.code, title: r.title });
    const items = made.map((r) => ({ id: r.id, code: r.id, title: r.title, meta: "Created today" })).concat([...RBY.values()].sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true })).map((r) => ({ id: r.id, code: r.id, title: r.title, meta: `Maps ${r.ctl.slice(0, 2).join(", ")}${r.ctl.length > 2 ? ` and ${r.ctl.length - 2} more` : ""}` })));
    K.pick({ title: `Add requirements to ${code}`, multi: true, search: "Search the program's requirements", submit: (n) => (n ? `Map ${plural(n, "requirement")}` : "Map requirements"),
      items: items.map((x) => Object.assign(x, { held: have.has(x.id) ? "Mapped" : "" })), create: { label: "Create requirement", onCreate: () => ACT["k3c.req.new"](code) },
      onPick: (ids) => { for (const id of ids) mapReq(code, id, (items.find((x) => x.id === id) || {}).title || ""); redraw(); K.toast(`${plural(ids.length, "requirement")} mapped to ${code}`); } });
  });
  K.on("k3c.req.rm", (a) => { const evs = evOf(a.code).filter((e) => e.req === a.id).length;
    K.confirm({ title: "Unmap requirement", submit: "Unmap requirement", danger: true, text: `${esc(a.id)} no longer maps ${esc(a.code)}. The requirement stays in the register${evs ? `; the ${plural(evs, "evidence artifact")} it cites ${evs === 1 ? "leaves" : "leave"} this control` : ""}.`,
      onOk: () => {
        const ch = CH(), s = chainSt(a.code), mine = get("reqs", {})[a.code] || [];
        if (hasD() && V3.fact("requirement", a.id)) V3.fact("unmapControl", a.id, a.code);
        else if (s.req === a.id && ch && ch.put) ch.put(a.code, { req: null, reqTitle: null, ev: null, evTitle: null, evReq: null });
        else if (mine.some((x) => x.id === a.id)) mapPut("reqs", a.code, mine.filter((x) => x.id !== a.id));
        else mapPut("unmap", a.code, (get("unmap", {})[a.code] || []).concat([a.id]));
        redraw(); K.toast(`${a.id} unmapped from ${a.code}`);
      } }); });
  K.on("k3c.ev.add", (code) => {
    const reqs = reqsOf(code); if (!reqs.length) { K.toast("Map a requirement first: evidence is cited by a requirement"); return; }
    const have = new Set(evOf(code).map((e) => e.title)), all = (PA.evLookup && PA.evLookup.all()) || [];
    K.pick({ title: `Add evidence to ${code}`, search: "Search the program's evidence", submit: "Add evidence", intro: "An evidence artifact is cited by a requirement that maps the control.",
      items: all.map((e) => ({ id: e.id, title: e.title, desc: `${e.kind} · collected ${md(e.collected)}`, meta: e.owner || "", held: have.has(e.title) ? "Cited" : "" })),
      extra: [{ key: "req", label: "Cited by", type: "select", required: true, value: reqs[0].id, options: reqs.map((r) => [r.id, `${r.id} ${r.title}`]) }],
      onPick: (id, x) => {
        const e = all.find((y) => y.id === id) || { title: id }, ch = CH(), s = chainSt(code), un = get("unev", {})[code] || [];
        if (un.includes(e.title)) mapPut("unev", code, un.filter((t) => t !== e.title));
        else if (ch && ch.put && !s.ev) ch.put(code, { ev: id, evTitle: e.title, evReq: x.req, evAt: TODAY });
        else mapPut("ev", code, (get("ev", {})[code] || []).concat([{ id, title: e.title, req: x.req }]));
        if (dArt(id) && typeof V3.facts.linkEvidence === "function") V3.fact("linkEvidence", x.req, id); // the requirement's own record cites it too
        redraw(); K.toast(`Evidence added to ${x.req}: ${code} reads ${STW(statusOf(code))[0]}`);
      } });
  });
  K.on("k3c.ev.rm", (a) => K.confirm({ title: "Remove evidence", submit: "Remove evidence", danger: true, text: `${esc(a.title)} is no longer cited for ${esc(a.code)}. The artifact stays in the Evidence register.`,
    onOk: () => {
      const ch = CH(), s = chainSt(a.code), mine = get("ev", {})[a.code] || [], was = evOf(a.code).find((x) => x.title === a.title);
      if (was && was.id && was.req && dArt(was.id) && typeof V3.facts.unlinkEvidence === "function") V3.fact("unlinkEvidence", was.req, was.id);
      if ((s.evTitle || s.ev) === a.title && ch && ch.put) ch.put(a.code, { ev: null, evTitle: null, evReq: null });
      else if (mine.some((x) => x.title === a.title)) mapPut("ev", a.code, mine.filter((x) => x.title !== a.title));
      else mapPut("unev", a.code, (get("unev", {})[a.code] || []).concat([a.title]));
      redraw(); K.toast(`Evidence removed from ${a.code}`);
    } }));

  // ——— Responsibility, owner, parameter values ———
  K.on("k3c.resp", (code) => {
    const r = respOf(code), H = PA.v2host;
    const opts = [["System-specific", "This system"]];
    if (r.offer) { opts.push(["Hybrid", `Hybrid with ${r.provider}`]); if (!r.forceHybrid) opts.push(["Inherited", `Inherited from ${r.provider}`]); }
    K.form({ title: "Change responsibility", submit: "Change responsibility",
      intro: `${esc(code)} ${esc(rec(code).t || "")}. ${r.offer ? `${esc(r.provider)} offers it${r.forceHybrid ? ", but holds no authorization: it can be leaned on as Hybrid only" : ""}. Inherited, its status is the provider's.` : "No provider of this system offers it, so it is this system's own."}`,
      fields: [{ key: "kind", label: "Responsibility", type: "select", required: true, value: r.kind, options: opts }, r.offer ? { key: "part", label: "This system's part", type: "textarea", rows: 3, value: r.own || (r.offer && r.offer.own) || "", hint: "For a hybrid control: what this system still owes." } : null, { key: "reason", label: "Reason", required: true }].filter(Boolean),
      onSubmit: (v) => {
        if (v.kind === "Hybrid" && !v.part) return { part: "Enter this system's part of a hybrid control." };
        if (!H || !SSP.ctl(code)) return { kind: "A control tailored in today is this system's own until a provider offers it." };
        if (r.def === v.kind && !(v.kind === "Hybrid" && v.part && v.part !== (r.offer || {}).own)) V.set("host.resp." + code, null);
        else V.set("host.resp." + code, { kind: v.kind, part: v.kind === "Hybrid" ? v.part : null, reason: v.reason, by: ME, at: TODAY });
        redraw(); const n = respOf(code); K.toast(`${code}: ${n.word}${n.kind === "Inherited" ? ` · its status is the provider's, ${STW(statusOf(code))[0]}` : ""}`);
      } });
  });
  K.on("k3c.owner", (code) => K.form({ title: "Assign owner", submit: "Assign owner", intro: `${esc(code)} ${esc(rec(code).t || "")}`, fields: [{ key: "owner", label: "Owner", type: "select", value: ownerOf(code) || "", placeholder: "No owner", options: people() }],
    onSubmit: (v) => { mapPut("own", code, v.owner || undefined); redraw(); K.toast(v.owner ? `${code} is ${v.owner}'s` : `${code} has no owner`); } }));
  K.on("k3c.param", (id) => { const p = params().find((x) => x.id === id); if (!p) return;
    K.form({ title: `${p.value ? "Edit" : "Set"} ${p.label}`, submit: p.value ? "Edit value" : "Set value", intro: `${esc(p.ctl)} · ${esc(p.what)}. The value is set on Program tailoring, the stack's last layer, so it wins over any value beneath it.`,
      fields: [{ key: "value", label: "Value", required: true, value: p.value || "" }, { key: "why", label: "Rationale", type: "textarea", rows: 2, required: true, value: p.why || "" }],
      onSubmit: (v) => { mapPut("param", id, { value: v.value, why: v.why, by: ME, at: TODAY }); redraw(); K.toast(`${p.label} set: the statement prints ${v.value}`); } }); });

  // ════════════════ The workbook is Controls' second view ════════════════
  const inSctm = () => /^sctm(-|$)/.test((location.hash || "").slice(1));
  function sctmDom() {
    if (!on() || !inSctm()) return;
    const row = document.querySelector("#sx-app .sx-head-row"); if (!row) return;
    if (!row.querySelector(".k3c-wb")) {
      const n = wsx() ? total() : 0, here = SSP.controls.length;
      row.insertAdjacentHTML("beforeend", `<span class="k3c-wb"><span class="k3-seg" role="group" aria-label="View of the controls"><a href="#controls">List</a><button type="button" class="on" aria-pressed="true">Workbook</button></span><span class="k3c-wb-n">${wsx() ? (n === here ? `The same ${fmt(here)} controls as the list` : `${fmt(here)} controls of the SSP's baseline · the list holds ${fmt(n)} after today's tailoring`) : ""}</span></span>`);
    }
  }
  let sxT = 0;
  if (window.MutationObserver) new MutationObserver(() => { if (!on() || !inSctm() || sxT) return; sxT = requestAnimationFrame(() => { sxT = 0; sctmDom(); }); }).observe(document.body || document.documentElement, { childList: true, subtree: true });
  // A record opened from a workbook row's preview keeps a way back to the workbook: the return bar, set once the record's page
  // is drawn. (v2's ↗ has changed the address and redrawn the preview by the time this listener runs, so it reads what was
  // previewed from the core, not from the page.)
  let PENDING = null, WBAT = "sctm";
  window.addEventListener("hashchange", () => { if (inSctm()) WBAT = (location.hash || "#sctm").slice(1); });
  document.addEventListener("click", (e) => {
    if (!on() || !document.getElementById("sx-app")) return;
    const t = e.target && e.target.closest ? e.target.closest('button[aria-label="Open the full record"], .k3-pn-a a.btn[href]') : null; if (!t) return;
    const last = V.lastPanel ? V.lastPanel() : null, id = last && last.id != null ? String(last.id).split("|")[0].split("@")[0] : "";
    if (id) PENDING = { from: inSctm() ? (location.hash || "#sctm").slice(1) : WBAT, code: id };
  }, true);
  window.addEventListener("hashchange", () => {
    const pd = PENDING; PENDING = null; if (!pd || !on()) return;
    setTimeout(() => { // after the page is drawn
      const route = (location.hash || "").slice(1); if (!route || inSctm()) return;
      K.set("task", { from: { label: "the workbook", route: pd.from }, what: "A record from the workbook", steps: [{ label: `Record of ${pd.code}`, route }], i: 0 });
    }, 0);
  });

  // ════════════════ Folded pages, and what this lane tells the others ════════════════
  const preset = (patch) => { if (!on() || !wsx()) return; const want = Object.assign({}, VIEW0, patch), have = vw(); if (JSON.stringify(want) !== JSON.stringify(have)) put("view", want); };
  // The old control record pages are folded into the control's one page (control--<code>, drawn by the kit from the panel's
  // definition): their addresses open it. SI-2's hand-made page (control-si2) goes the same way.
  const OLDCTL = /^(?:rec--a-tests-control--(.+?)(?:--.*)?|control-si2(?:-.*)?|after-control-record)$/;
  const oldCode = (r) => { const m = OLDCTL.exec(r); return m ? decodeURIComponent(m[1] || "SI-2") : ""; };
  const inBase = (code) => wsx() && (model(prog()).set.has(code) || model(prog()).out.has(code));
  V3.redirect(OLDCTL, (r) => { const code = oldCode(r); return inBase(code) ? K.recRoute("k3c-control", code) || "controls" : null; });
  V3.redirect("baseline-params", () => { preset({ mini: "params" }); return "controls"; });
  V3.redirect(/^baseline(-|$)/, "controls");
  V3.redirect(/^resiliency(-|$)/, () => { preset({ tech: "*" }); return "controls"; });
  V3.redirect(/^posture(-|$)/, "controls-coverage");
  V3.compareAs("controls-coverage", "posture");

  const F = V3.facts;
  F.baseline = () => { if (!wsx()) return null; const m = model(prog()); return { total: m.set.size, layers: m.rows.map((r) => ({ key: r.key, name: r.name, kind: r.kind, added: r.added.length, removed: r.removed.length, count: r.count, on: r.on })), added: [...m.src.entries()].filter(([c, k]) => k !== "high" && m.set.has(c)).map(([c]) => c), removed: [...m.out.keys()], here: { added: get("added", []).map((x) => x.code), removed: get("removed", []).map((x) => x.code) } }; };
  F.control = (code) => { if (!wsx()) return null; const m = model(prog()), inB = m.set.has(code); if (!inB && !m.out.has(code)) return null; const b = rec(code); return { code, title: b.t || titleOf(code), family: b.f || famOf(code), status: inB ? statusOf(code) : null, source: inB ? layerName(m.src.get(code) || "high") : null, responsibility: inB ? respOf(code).word : null, owner: ownerOf(code), inBaseline: inB }; };
  F.impl = (code, comp) => { const im = implOf(code, comp || ""); return im && (im.text || !im.sys) ? { status: im.status, text: im.text } : null; };
  F.setImpl = (code, comp, o) => { setImpl(code, comp || "", o || {}); };
  F.madeRequirements = () => get("madeReqs", []).slice();
  // The baseline's counts and a control's status stay true after tailoring, an unmapping and a change of responsibility.
  // fact("controls") is summed from the same statuses as the list (asked through the registry), so it follows this lane's changes
  // and a later lane's alike. fact("status"), as this lane registers it, answers with its own changes on top of what was beneath.
  F.controls = (p) => { const base = typeof controls0 === "function" ? controls0(p) : undefined; if (!on() || (p && p !== WSX) || !wsx()) return base; return Object.assign({}, base, counts(rowsWSX(prog()))); };
  myStatus = (code) => { if (!on() || !wsx()) return below(code); const m = model(prog()); return m.set.has(code) || !SSP.ctl(code) ? ownStatus(code) : below(code); };
  F.status = myStatus;
  PA.v3c = { model: () => model(prog()), rows: () => rowsWSX(prog()), ref, reqsOf, evOf, compsOf, statusOf, view: vw };
})();
