// Drata round, lane A (dra-): controls after Drata. Two new routes; no existing screen changes.
//   dr-controls                     the controls register after: the code chip is the status (rec 2), a filter panel beside the
//                                   table opened from the toolbar (rec 21), a floating selection bar (rec 22), out of scope with a
//                                   rationale that keeps the control listed (rec 4)
//   dr-control--<code>[--<tab>]     the control record after: one header (rec 20), tabs with problem counts (rec 3), the status as
//                                   a sum of four stages (rec 1), cards with their own Edit (rec 25), compare with the library
//                                   implementation (rec 5), review and approval of the statement (rec 6), suggestions and an
//                                   agent's proposal (rec 28), in the sunken well (rec 19). Tabs: overview requirements evidence
//                                   assessment findings risks history.
// Reads what the current Controls reads (PA.v3c rows, reqsOf, evOf, compsOf, model; PA.v3s components; the facts findingsOf,
// risksOf, campaignOf, judgedN, people), so the numbers match the V3 screens. Writes only its own session data under "dr.A.":
//   f { q, fam[], status[], resp[], owner[], source[], scope }   the register's question     page n
//   oos { code: { why, by, at } }       marked out of scope here      own { code: name }      owners assigned here
//   appr { code: { stage, sent, due, acts: [{ who, what, at }] } }    review and approval of the implementation statement
//   info { code: { text, status } }     the Info card's edits         cmp { "code@comp": { text, status, params } }  compare applied
//   map { code: [requirement id] }      requirements mapped here      dis { code: [requirement id] }  suggestions dismissed
//   ev { code: [{ title, at }] }        evidence added here           prop { code: "approved" | "declined" }   the agent's proposal
//   auto "suggest" | "high" | "off"     how much the assistant may do alone              log { code: [{ at, who, what }] }
//   plan { code: { camp, at } }         the objectives left on a control judged in part, planned into a campaign here
// Version 24: a control judged in part (PART, derived: AU-14 at reset, 3 of 5 judged) on the register (the Judged column, the
// "Objectives judged" facet, the "Judged in part" view) and its record; parameters set by Program tailoring (SA-24 from the data,
// AC-2(3) read from its SSP narrative: PDER) in Info and in Compare's third field, found by the "Parameters" facet and view; the
// Evidence tab reads and writes lane B's links (PA.drB.linksFor, link, unlink) when lane B is here, else V3's evidence as before.
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k, V = PA && PA.v2, D = PA && PA.drk, C3 = PA && PA.v3c, S3 = PA && PA.v3s;
  if (!V3 || !K || !V || !D || !C3 || !PA.SSP) return;
  const SSP = PA.SSP, esc = K.esc, fmt = K.fmt;
  const ME = "Ingrid Solberg", TODAY = "2026-11-17", PER = 50, LIB = "dra-ctl";
  const NONE = '<span class="k3-none">—</span>';
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const uniq = (a) => [...new Set(a)];
  const md = (iso) => (iso ? new Date(String(iso).slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
  const addDays = (iso, n) => { const d = new Date(String(iso).slice(0, 10) + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const mu = (t) => `<span class="dra-mu">${esc(t)}</span>`;
  const fact = (name, ...a) => { try { return typeof V3.facts[name] === "function" ? V3.fact(name, ...a) : undefined; } catch (e) { return undefined; } };

  // ——— Session data, under "dr.A." ———
  const get = (p, d) => { const v = K.get("dr.A." + p); return v === undefined || v === null ? d : v; };
  const put = (p, v) => K.set("dr.A." + p, v);
  const mapPut = (p, key, v) => { const o = Object.assign({}, get(p, {})); if (v === undefined) delete o[key]; else o[key] = v; put(p, o); };
  const log = (code, what) => mapPut("log", code, (get("log", {})[code] || []).concat([{ at: TODAY, who: ME, what }]));
  let GEN = 0;
  V.on(() => { GEN++; });
  window.addEventListener("hashchange", () => { GEN++; });
  const memo = (fn) => { const box = new Map(); let g = -1; return (...a) => { if (g !== GEN) { box.clear(); g = GEN; } const k = a.join("|"); if (!box.has(k)) box.set(k, fn(...a)); return box.get(k); }; };

  // ——— Words ———
  const STW = (s) => SSP.STATUS[s] || ["Tailored out", "none"];
  const IMPLW = (s) => SSP.IMPL[s] || null;
  const SHORT = { high: "NIST High", cnssi: "CNSSI 1253", mission: "Mission Assurance", deployed: "Deployed Platform", custa: "F-16 SPO", tailor: "Program tailoring" };
  const layers = () => C3.model().rows || [];
  const layerName = (k) => (layers().find((r) => r.key === k) || {}).name || SHORT[k] || k;
  const layerShort = (k) => SHORT[k] || layerName(k);
  const LADDER = ["no_requirement", "no_evidence", "not_assessed", "other_than_satisfied", "partially_satisfied", "satisfied"];
  const RESPW = { own: "This system", hybrid: "Hybrid", inherited: "Inherited" };
  const respKey = (r) => (!r ? "" : r.kind === "Inherited" ? "inherited" : r.kind === "Hybrid" ? "hybrid" : "own");
  const FAMS = () => SSP.families.map((f) => f.f);
  const famName = (f) => (SSP.families.find((x) => x.f === f) || {}).t || f;
  const parts = (c) => { const m = /^([A-Z]{2})-(\d+)(?:\((\d+)\))?$/.exec(c) || []; const i = FAMS().indexOf(m[1]); return [i < 0 ? 99 : i, +m[2] || 0, m[3] ? +m[3] : -1]; };
  const byCode = (a, b) => { const x = parts(a.code || a), y = parts(b.code || b); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };
  const titleOf = (code) => ((SSP.ctl(code) || {}).t) || (fact("control", code) || {}).title || code;
  const people = () => (fact("people") || SSP.people || []).filter((p) => p && p.name);
  const byRmf = (r) => people().find((p) => p.rmf === r) || null;
  const ownerOf = (code, base) => get("own", {})[code] || base || "";
  const ownerCell = (n) => (n ? esc(n) : '<span class="dra-warnw">No owner</span>');
  const enc = (code) => encodeURIComponent(code).replace(/%28/g, "(").replace(/%29/g, ")");
  const recRoute = (code, tab) => `dr-control--${enc(code)}${tab && tab !== "overview" ? "--" + tab : ""}`;

  // ——— A control judged in part (Drata-only demo state, derived; WS-X90 holds none at reset): the first Not assessed control in
  // catalog order, other than AC-17(4), whose five objectives are all mapped and evidenced with none judged and none in draft
  // results. Its first three objectives in reading order are judged Satisfied in its campaign's latest published results; the
  // other two are left to plan. V3's own pages are unchanged. ———
  const PART = memo(() => {
    for (const r of C3.rows().slice().sort(byCode)) {
      if (r.code === "AC-17(4)" || r.status !== "not_assessed") continue;
      const v = (V.chain && V.chain.view(r.code)) || {}, jn = fact("judgedN", r.code) || { n: 0 };
      if ((v.ob || 0) !== 5 || v.om !== 5 || (v.oe || r.oe) !== 5 || v.oa || jn.n) continue;
      const camp = fact("campaignOf", r.code) || null, cname = camp ? ((fact("assessments") || []).find((a) => a.id === camp.id) || {}).name || "" : "";
      const res = (fact("results") || []).filter((x) => x.state === "published" && (!cname || x.campaign === cname)).sort((a, b) => (a.at < b.at ? 1 : -1))[0] || null;
      return { code: r.code, judged: 3, ob: 5, left: 2, camp, res };
    }
    return null;
  });
  const partOf = (code) => { const p = PART(); return p && p.code === code ? p : null; };
  // ——— Parameters the Drata screens read as set by Program tailoring. SA-24's come from the data (and no library component
  // carries it). AC-2(3)'s two are not set in the prototype; WS-X90's own SSP narrative for AC-2(3) states both as the CNSSI 1253
  // values, so they are read from it (derived): disable within 72 hours, inactive accounts after 90 days. ———
  const PDER = memo(() => {
    const n = String((SSP.ctl("AC-2(3)") || {}).n || ""), a = /within (\d+ hours)/.exec(n), b = /idle for (\d+ days)/.exec(n);
    return a && b ? { "AC-2(3)": { "AC-02(03)_ODP[01]": a[1], "AC-02(03)_ODP[02]": b[1] } } : {};
  });

  // ════════════════ The register's rows ════════════════
  const rowsAll = memo(() => {
    const m = C3.model(), oos = get("oos", {});
    const inB = C3.rows().map((r) => { const v = (V.chain && V.chain.view(r.code)) || {}, pt = partOf(r.code);
      return { code: r.code, title: r.title || titleOf(r.code), fam: r.fam, status: r.status, src: r.src, resp: r.resp, ob: r.ob || 0, oe: r.oe || 0, oj: pt ? pt.judged : v.oa || 0, owner: ownerOf(r.code, r.owner),
        comps: C3.compsOf(r.code).length, pm: r.hasParams ? (paramsOf(r.code).some((p) => p.value) ? "set" : "unset") : "", out: oos[r.code] ? Object.assign({ mine: true }, oos[r.code]) : null }; });
    const lo = [...m.out.entries()].map(([code, by]) => ({ code, title: titleOf(code), fam: code.split("-")[0], status: "", src: by, resp: null, ob: 0, oe: 0, oj: 0, pm: "", owner: ownerOf(code, ""), comps: 0, out: { why: `Removed by ${layerName(by)}`, layer: true } }));
    return inB.concat(lo).sort(byCode);
  });
  const judgedKey = (r) => (r.ob && r.oj >= r.ob ? "all" : r.oj > 0 ? "part" : "none");
  const F0 = { q: "", fam: [], status: [], resp: [], owner: [], source: [], scope: "", jd: "", pm: "" };
  const fstate = () => Object.assign({}, F0, get("f", {}));
  const KEYS = ["fam", "status", "resp", "owner", "source"];
  const test = (r, f, skip) => {
    const q = (f.q || "").trim().toLowerCase();
    if (skip !== "scope" && !f.scope && r.out) return false; // the default is the controls in scope; "all" adds the ones out of scope
    if (skip !== "scope" && f.scope === "out" && !r.out) return false;
    if (skip !== "fam" && f.fam.length && !f.fam.includes(r.fam)) return false;
    if (skip !== "status" && f.status.length && !f.status.includes(r.status)) return false;
    if (skip !== "resp" && f.resp.length && !f.resp.includes(respKey(r.resp))) return false;
    if (skip !== "owner" && f.owner.length && !f.owner.includes(r.owner || "none")) return false;
    if (skip !== "source" && f.source.length && !f.source.includes(r.src)) return false;
    if (skip !== "jd" && f.jd && (r.out || judgedKey(r) !== f.jd)) return false;
    if (skip !== "pm" && f.pm && r.pm !== f.pm) return false;
    return !q || `${r.code} ${r.title} ${r.out ? r.out.why : ""}`.toLowerCase().includes(q);
  };
  const ask = (f, skip) => rowsAll().filter((r) => test(r, f, skip));
  const RADIO = ["scope", "jd", "pm"], JDW = { part: "In part", all: "Every objective", none: "None" }, PMW = { set: "Set by Program tailoring", unset: "Not set" };
  const anyF = (f) => KEYS.some((k) => f[k].length) || RADIO.some((k) => !!f[k]);
  // The facet state rides in the toolbar's saved views as one hidden filter, so a saved view keeps the panel's choices too.
  const fsJson = (f) => { const o = {}; KEYS.forEach((k) => { if (f[k].length) o[k] = f[k].slice().sort(); }); RADIO.forEach((k) => { if (f[k]) o[k] = f[k]; }); return Object.keys(o).length ? JSON.stringify(o) : ""; };
  const fsRead = (s) => { let o = {}; try { o = s ? JSON.parse(s) : {}; } catch (e) { o = {}; } return Object.assign({}, F0, o); };
  const fsWords = (f) => { const w = []; if (f.fam.length) w.push(`Family: ${f.fam.join(", ")}`); if (f.status.length) w.push(`Status: ${f.status.map((s) => STW(s)[0]).join(", ")}`); if (f.resp.length) w.push(`Responsibility: ${f.resp.map((k) => RESPW[k]).join(", ")}`); if (f.owner.length) w.push(`Owner: ${f.owner.map((o) => (o === "none" ? "No owner" : o)).join(", ")}`); if (f.source.length) w.push(`Source: ${f.source.map(layerShort).join(", ")}`); if (f.scope) w.push(f.scope === "out" ? "Out of scope" : "In and out of scope"); if (f.jd) w.push(`Judged: ${JDW[f.jd].toLowerCase()}`); if (f.pm) w.push(`Parameters: ${PMW[f.pm].toLowerCase()}`); return w.join(" · ") || "Every control"; };
  const PRESETS = [["Needs evidence", { status: ["no_evidence"] }], ["Not assessed", { status: ["not_assessed"] }], ["Judged in part", { jd: "part" }], ["Short of satisfied", { status: ["other_than_satisfied", "partially_satisfied"] }], ["Parameters set", { pm: "set" }], ["No owner", { owner: ["none"] }], ["Out of scope", { scope: "out" }], ["In and out of scope", { scope: "all" }]];
  K.on("dra.fstate", (v) => { const f = fsRead(v); put("f", Object.assign(f, { q: fstate().q })); put("page", 0); K.redraw(); });
  K.on("dra.q", (v) => { put("f", Object.assign(fstate(), { q: v || "" })); put("page", 0); K.redraw(); });
  K.on("dra.page", (n) => { put("page", Math.max(0, +n || 0)); K.redraw(); });
  const facetAct = (key, value) => {
    const f = fstate();
    if (RADIO.includes(key)) f[key] = Array.isArray(value) ? value[0] || "" : value || "";
    else if (Array.isArray(value)) f[key] = value.slice();
    else if (value === "" || value == null) f[key] = [];
    else f[key] = f[key].includes(value) ? f[key].filter((x) => x !== value) : f[key].concat([value]);
    put("f", f); put("page", 0); K.redraw();
  };

  // ——— Choosing rows: kept in memory while the page is open; the bar redraws in place so the table keeps its scroll ———
  const SEL = new Set();
  let SELROUTE = "";
  window.addEventListener("hashchange", () => { if ((location.hash || "").slice(1) !== SELROUTE) SEL.clear(); });
  const selbar = () => { const f = fstate(), n = SEL.size; if (!n) return ""; const total = ask(f).length, anyOut = [...SEL].some((c) => (get("oos", {})[c]));
    return D.selbar({ n, total, noun: "controls", all: "dra.sel.all", clear: "dra.sel.clear", verbs: [{ label: "Assign owner", act: "dra.sel.owner" }, { label: "Add review", act: "dra.sel.review" }, anyOut ? { label: "Return to scope", act: "dra.sel.in" } : null, { label: "Mark out of scope", act: "dra.sel.out", danger: true }].filter(Boolean) }); };
  const paintSel = () => { const el = document.getElementById("dra-selbar"); if (el) el.innerHTML = selbar(); document.querySelectorAll("input[data-dra-sel]").forEach((x) => { x.checked = SEL.has(x.getAttribute("data-dra-sel")); const tr = x.closest("tr"); if (tr) tr.classList.toggle("dra-on", x.checked); }); };
  document.addEventListener("change", (e) => { const t = e.target; if (!V3.on() || !t || !t.matches || !t.matches("input[data-dra-sel]")) return; const c = t.getAttribute("data-dra-sel"); if (t.checked) SEL.add(c); else SEL.delete(c); paintSel(); });
  document.addEventListener("click", (e) => { const t = e.target; if (V3.on() && t && t.closest && t.closest("label.dra-ckl")) e.stopPropagation(); }, true);
  K.on("dra.sel.all", () => { for (const r of ask(fstate())) SEL.add(r.code); paintSel(); });
  K.on("dra.sel.clear", () => { SEL.clear(); paintSel(); });
  const chosen = () => rowsAll().filter((r) => SEL.has(r.code));
  const selOwner = () => { const list = chosen(); if (!list.length) return;
    K.form({ title: `Assign owner to ${plural(list.length, "control")}`, submit: "Assign owner", intro: `${esc(list.slice(0, 6).map((r) => r.code).join(", "))}${list.length > 6 ? ` and ${fmt(list.length - 6)} more` : ""}. Every chosen control takes the owner, or none does.`,
      fields: [{ key: "who", label: "Owner", type: "select", required: true, options: people().map((p) => [p.name, `${p.name} · ${p.rmf || p.role}`]) }],
      onSubmit: (v) => { const o = Object.assign({}, get("own", {})); list.forEach((r) => { o[r.code] = v.who; log(r.code, `assigned ${v.who} as owner`); }); put("own", o); SEL.clear(); K.redraw(); K.toast(`${v.who} owns ${plural(list.length, "control")}`); } }); };
  K.on("dra.sel.owner", selOwner);
  K.on("dra.own.all", () => { SEL.clear(); for (const r of ask(fstate())) if (!r.out) SEL.add(r.code); paintSel(); selOwner(); });
  K.on("dra.sel.out", () => { const list = chosen().filter((r) => !(r.out && r.out.layer)); if (!list.length) { K.toast("The chosen controls are already out of scope"); return; }
    K.form({ title: `Mark ${plural(list.length, "control")} out of scope`, submit: "Mark out of scope", danger: true, intro: `${esc(list.slice(0, 6).map((r) => r.code).join(", "))}${list.length > 6 ? ` and ${fmt(list.length - 6)} more` : ""} stay in the list with your rationale, and nothing is owed for them. This is a tailoring decision: Program tailoring records it.`,
      fields: [{ key: "why", label: "Rationale", type: "textarea", rows: 3, required: true, hint: "Every control you chose takes this rationale." }],
      onSubmit: (v) => { const o = Object.assign({}, get("oos", {})); list.forEach((r) => { o[r.code] = { why: v.why.trim(), by: ME, at: TODAY }; log(r.code, "marked it out of scope"); }); put("oos", o); SEL.clear(); K.redraw(); K.toast(`${plural(list.length, "control")} out of scope: Scope › Out of scope lists them with the rationale`); } }); });
  K.on("dra.sel.in", () => { const o = Object.assign({}, get("oos", {})); let n = 0; for (const c of SEL) if (o[c]) { delete o[c]; n++; log(c, "returned it to scope"); } put("oos", o); SEL.clear(); K.redraw(); K.toast(`${plural(n, "control")} back in scope`); });
  K.on("dra.sel.review", () => { const list = chosen().filter((r) => !r.out); if (!list.length) { K.toast("A control out of scope has nothing to review"); return; }
    const isso = byRmf("ISSO"), issm = byRmf("ISSM");
    K.form({ title: `Send ${plural(list.length, "statement")} to reviewers`, submit: "Send to reviewers", intro: `The implementation statements of ${esc(list.slice(0, 6).map((r) => r.code).join(", "))}${list.length > 6 ? ` and ${fmt(list.length - 6)} more` : ""} move to Needs approval.`,
      fields: [{ key: "who", label: "Approvers", type: "select", required: true, value: "both", options: [["both", `${isso ? isso.name : "ISSO"} (ISSO) and ${issm ? issm.name : "ISSM"} (ISSM)`], ["isso", `${isso ? isso.name : "ISSO"} (ISSO)`]] }, { key: "due", label: "Deadline", type: "date", required: true, value: dueOf() }],
      onSubmit: (v) => { const o = Object.assign({}, get("appr", {})); list.forEach((r) => { o[r.code] = { stage: "needs", sent: TODAY, due: v.due, who: v.who, acts: ((o[r.code] || {}).acts || []).concat([{ who: ME, what: "sent it to reviewers", at: TODAY }]) }; log(r.code, "sent the statement to reviewers"); }); put("appr", o); SEL.clear(); K.redraw(); K.toast(`${plural(list.length, "statement")} sent to reviewers`); } }); });

  // ════════════════ dr-controls ════════════════
  function register() {
    SELROUTE = "dr-controls";
    const f = fstate(), all = rowsAll(), shown = ask(f);
    const pages = Math.max(1, Math.ceil(shown.length / PER)), page = Math.min(get("page", 0), pages - 1), slice = shown.slice(page * PER, page * PER + PER);
    const cnt = (key, test1) => ask(f, key).filter(test1).length;
    const fams = uniq(all.map((r) => r.fam)).sort((a, b) => FAMS().indexOf(a) - FAMS().indexOf(b));
    const owners = uniq(all.map((r) => r.owner).filter(Boolean)).sort();
    const groups = [
      { key: "fam", label: "Family", type: "check", value: f.fam, options: fams.map((x) => [x, `${x} ${famName(x)}`, cnt("fam", (r) => r.fam === x)]) },
      { key: "status", label: "Status", type: "check", value: f.status, options: LADDER.map((s) => [s, STW(s)[0], cnt("status", (r) => r.status === s)]) },
      { key: "resp", label: "Responsibility", type: "check", value: f.resp, options: Object.keys(RESPW).map((k) => [k, RESPW[k], cnt("resp", (r) => respKey(r.resp) === k)]) },
      { key: "owner", label: "Owner", type: "check", value: f.owner, options: [["none", "No owner", cnt("owner", (r) => !r.owner)]].concat(owners.map((o) => [o, o, cnt("owner", (r) => r.owner === o)])) },
      { key: "source", label: "Source", type: "check", value: f.source, options: layers().map((l) => [l.key, layerShort(l.key), cnt("source", (r) => r.src === l.key)]) },
      { key: "scope", label: "Scope", type: "radio", value: f.scope, options: [["", "In scope", cnt("scope", (r) => !r.out)], ["all", "In and out of scope", rowsAll().filter((r) => test(r, Object.assign({}, f, { scope: "all" }))).length], ["out", "Out of scope", cnt("scope", (r) => !!r.out)]] },
      { key: "jd", label: "Objectives judged", type: "radio", value: f.jd, options: [["", "Any", cnt("jd", () => true)]].concat(["part", "all", "none"].map((k) => [k, JDW[k], cnt("jd", (r) => !r.out && judgedKey(r) === k)])) },
      { key: "pm", label: "Parameters", type: "radio", value: f.pm, options: [["", "Any", cnt("pm", () => true)]].concat(["set", "unset"].map((k) => [k, PMW[k], cnt("pm", (r) => r.pm === k)])) },
    ];
    const fsv = fsJson(f), panel = D.facets({ id: LIB, groups, act: facetAct, clear: () => { put("f", Object.assign({}, F0, { q: fstate().q })); put("page", 0); K.redraw(); } }); // drawn first, so the Filter button counts what is applied now
    let tools = K.toolbar({ id: "dr-controls", noun: "controls", search: { act: "dra.q", value: f.q, placeholder: "Search controls" },
      filters: [{ label: "Filters", key: "fs", act: "dra.fstate", value: fsv, options: fsv ? [[fsv, fsWords(f)]] : [] }],
      right: D.facetToggle(LIB), views: { total: ask(Object.assign({}, F0)).length, all: "Controls in scope", presets: PRESETS.map(([label, st]) => { const s = fsJson(Object.assign({}, F0, st)); return { label, state: { fs: s }, count: ask(fsRead(s)).length }; }), count: (st) => ask(Object.assign(fsRead(st.fs || ""), { q: st.q || "" })).length } });
    tools = tools.replace(/<label class="k3-flt(?: on)?"><span class="k3-sr">[^<]*<\/span><select data-k3-input="dra\.fstate"[\s\S]*?<\/select><\/label>/, "");
    const anyOut = slice.some((r) => r.out); // Rationale only while tailored-out controls are on the page (B4)
    const owners0 = uniq(shown.filter((r) => !r.out).map((r) => r.owner || "")), ownCol = owners0.length > 1; // Owner only while owners vary (B4)
    const ownLine = !shown.length || ownCol ? "" : owners0[0] ? `<p class="dra-ownl"><span class="dra-mu">Owner of all ${fmt(shown.filter((r) => !r.out).length)} listed controls:</span> ${esc(owners0[0])}</p>`
      : `<p class="dra-ownl"><span class="dra-warnw">No owner</span> <span>on any of the <span class="num">${fmt(shown.filter((r) => !r.out).length)}</span> listed controls</span><span class="dra-mu" aria-hidden="true">·</span>${K.actLink("Assign owner", "dra.own.all")}</p>`;
    const cols = [{ label: "Control" }, { label: "Responsibility", cls: "nw dra-cc" }, { label: "Components", cls: "nw end dra-cc" }, { label: "Evidence", cls: "nw" }, { label: "Judged", cls: "nw" }].concat(ownCol ? [{ label: "Owner", cls: "nw" }] : [], anyOut ? [{ label: "Rationale", cls: "dra-why" }] : []); // B15: Responsibility (a filter in the panel) and Components step aside while the panel is open, so names keep their room
    const respCell = (r) => (!r.resp ? NONE : r.resp.kind === "System-specific" || !r.resp.provider ? "This system" : `<span title="${esc(r.resp.word || r.resp.kind)}">${esc(r.resp.kind)}</span>`);
    const row = (r) => { const tone = r.out ? "none" : D.tone(r.status), word = r.out ? "Out of scope" : STW(r.status)[0];
      const c0 = `<span class="dra-c0"><label class="dra-ckl" title="Choose ${esc(r.code)}"><input type="checkbox" data-dra-sel="${esc(r.code)}" aria-label="Choose ${esc(r.code)}"${SEL.has(r.code) ? " checked" : ""}></label>${D.idChip(r.code, tone, { title: `${r.code} · ${word}` })}<span class="dra-t" title="${esc(r.title)}">${esc(r.title)}</span></span>`;
      const cells = (r.out && r.out.layer ? [c0, NONE, NONE, NONE, NONE] : [c0, respCell(r), K.num(r.comps), K.ring(r.oe, r.ob, "objectives with evidence"), r.ob ? K.ring(r.oj, r.ob, "objectives judged") : NONE]).concat(ownCol ? [r.out && r.out.layer ? NONE : ownerCell(r.owner)] : []);
      if (anyOut) cells.push(r.out ? `<span class="dra-whyt" title="${esc(r.out.why)}">${esc(r.out.why)}</span>` : "");
      return { go: recRoute(r.code), peek: { panel: "k3c-control", id: r.code }, cls: `${r.out ? "dra-out" : ""}${SEL.has(r.code) ? " dra-on" : ""}`, cells }; };
    const from = shown.length ? page * PER + 1 : 0, to = Math.min(shown.length, page * PER + PER);
    const foot = `<span class="num">${fmt(from)}–${fmt(to)} of ${fmt(shown.length)}</span><span class="dra-pg">${K.btn("Previous", { sm: true, act: "dra.page", arg: page - 1, disabled: page <= 0 ? "This is the first page" : "" })}${K.btn("Next", { sm: true, act: "dra.page", arg: page + 1, disabled: page >= pages - 1 ? "This is the last page" : "" })}</span>`;
    const table = K.table({ label: "Controls", cols, rows: slice.map(row), foot, empty: { title: "No controls match", line: "Clear a filter or the search.", action: anyF(f) || f.q ? K.btn("Clear filters", { sm: true, act: "k3.view.clear", arg: "dr-controls" }) : "" } });
    const head = K.head({ title: "Controls", actions: K.menu("More", [{ label: "Export controls", act: "dra.noop", arg: "Export controls" }, { label: "Open the workbook", go: "sctm" }]) + K.btn("Add control", { primary: true, act: "dra.noop", arg: "Add control" }) });
    return K.page({ cls: "dra dra-reg", head: D.review({ title: "Controls register", current: "controls" }) + head, body: [tools, D.withFacets(LIB, panel, ownLine + table), `<div id="dra-selbar" class="dra-selbar">${selbar()}</div>`] });
  }
  K.on("dra.noop", (what) => K.confirm({ title: String(what || "Not in the prototype"), submit: "Close", text: `${esc(what || "This")} works as it does on the current Controls page. Nothing is saved from here in the prototype.`, onOk: () => {} }));

  // ════════════════ dr-control--<code>: the record ════════════════
  const TABS = [["overview", "Overview"], ["requirements", "Requirements"], ["evidence", "Evidence"], ["assessment", "Assessment"], ["findings", "Findings"], ["risks", "Risks"], ["history", "History"]];
  const dueOf = () => { const g = fact("nextGate"); return g && g.due ? addDays(g.due, 14) : addDays(TODAY, 30); };
  // The program's values for the control's parameters, read from the current control panel's statement (Program tailoring's).
  const paramsOf = memo((code) => { try { const p = PA.P["k3c-control"] && V3.force(true, () => PA.P["k3c-control"](code)); const html = p ? String(p.body || "") : ""; const t = document.createElement("template"); t.innerHTML = html; const der = PDER()[code] || {}; return [...t.content.querySelectorAll(".k3c-pv")].map((el) => { const [label, what] = String(el.getAttribute("title") || "").split(" · "), set = el.classList.contains("unset") ? "" : el.textContent.trim(); return { label: label || "Parameter", what: what || "", value: set || der[label] || "", derived: !set && !!der[label] }; }); } catch (e) { return []; } });
  // Implementation: the system's narrative, and each component's own (lane S counts the narrative as a component's when it names it).
  const sysImpl = (code) => { const b = SSP.ctl(code) || {}, own = get("info", {})[code] || {}; return { text: own.text != null ? own.text : b.ph ? "" : b.n || "", status: own.status || b.s || "" }; };
  const compImpl = (code, comp) => { let r = null; try { r = S3 && S3.implOf ? S3.implOf(code, comp) : null; } catch (e) { r = null; } const w = fact("impl", code, comp); const base = w && w.text ? { text: w.text, status: IMPLW(w.status) ? IMPLW(w.status)[0] : w.status || "" } : r && r.text ? { text: r.text, status: r.status || "" } : { text: "", status: "" }; const o = get("cmp", {})[`${code}@${comp}`] || {}; return { text: o.text != null ? o.text : base.text, status: o.status || base.status, params: o.params || null, fromSsp: !!(r && r.fromSsp && !(w && w.text)) }; };
  const libOf = (comp) => { const c = S3 && S3.component ? S3.component(comp) : null; return c && c.lib ? (S3.libOf ? S3.libOf(c) : c.lib) : null; };
  const lru = (comp) => { const c = S3 && S3.component ? S3.component(comp) : null; return c && c.unit ? c.unit : ""; };
  // The component's own sentences: those of its statement that name it (by name or unit number), else the whole statement.
  const ownSentences = (text, comp) => { const nm = S3 && S3.nameOf ? S3.nameOf(comp) : comp, u = lru(comp); const ss = String(text || "").match(/[^.;]+(?:\([^)]*\)[^.;]*)*[.;]?/g) || []; const mine = ss.filter((s) => s.includes(nm) || (u && s.includes(u))); return (mine.length ? mine : ss).join(" ").replace(/\s+/g, " ").trim(); };
  // The library implementation (derived: the prototype holds none): the component's sentences with WS-X90's particulars taken out.
  const generalize = (s) => String(s || "").replace(/\s*\((?:LRU|SRU)-\d+\)/g, "").replace(/\bWS-X90's\b/g, "the host system's").replace(/\bWS-X90\b/g, "the host system").replace(/,? (?:on|since) \d{4}-\d{2}-\d{2}/g, "").replace(/ through the (?:[A-Z][a-z]+ ){1,3}(?:Gateway|Controller|Unit|Module)/g, " through the host's boundary gateway").replace(/\b(two|three|four) documented operational needs, [^.]*\./i, "the operational needs the host program documents in its security plan.").replace(/^On the [A-Z][\w-]*(?: [A-Z][\w-]*){0,4}, (\w)/, (m0, c) => c.toUpperCase()).replace(/\s+/g, " ").trim();
  const libImpl = (code, comp) => { const b = SSP.ctl(code) || {}, cur = ownSentences(b.ph ? "" : b.n || "", comp); return { text: paramsOf(code).reduce((t, p) => (p.value && p.value.length < 40 ? t.split(p.value).join(`[${p.what || p.label}]`) : t), generalize(cur)), status: "Implemented", params: paramsOf(code).map((p) => `[${p.what || p.label}]`).join("; ") }; };
  const curParams = (code, comp) => { const o = compImpl(code, comp); return o.params != null ? o.params : paramsOf(code).map((p) => p.value || `[${p.what || p.label}]`).join("; "); };
  const compareRows = (code, comp) => { const cur = compImpl(code, comp), lib = libImpl(code, comp), rows = [{ field: "Statement", current: ownSentences(cur.text, comp), template: lib.text }, { field: "Implementation status", current: cur.status || "Not written", template: lib.status }]; if (paramsOf(code).length) rows.push({ field: "Parameters", current: curParams(code, comp), template: lib.params }); return rows; };
  const changedFromLib = (code, comp) => !!libOf(comp) && !!(SSP.ctl(code) || {}).n && compareRows(code, comp).some((r) => r.current !== r.template);

  function recData(code) {
    const row = C3.rows().find((r) => r.code === code), m = C3.model();
    if (!row && !m.out.has(code)) return null;
    const b = SSP.ctl(code) || {}, v = (V.chain && V.chain.view(code)) || b;
    const reqs0 = row ? C3.reqsOf(code) : [], evs0 = row ? C3.evOf(code) : [];
    const mapped = (get("map", {})[code] || []).filter((id) => !reqs0.some((r) => r.id === id)).map((id) => ({ id, title: reqTitle(id), mine: true }));
    const evMine = (get("ev", {})[code] || []).map((x) => ({ title: x.title, req: (reqs0[0] || mapped[0] || {}).id || "", state: "Pending review", mine: true, at: x.at }));
    const fnd = fact("findingsOf", code) || [], risks = fact("risksOf", code) || [], jn = fact("judgedN", code) || { n: 0, draft: false }, camp = fact("campaignOf", code) || null;
    const poam = (((PA.riskLookup && PA.riskLookup.all()) || {}).POAM || []).filter((x) => JSON.stringify(x).includes(`"${code}"`) && x.status !== "completed");
    const pt = row ? partOf(code) : null, part = pt ? Object.assign({}, pt, { plan: get("plan", {})[code] || null }) : null;
    return { code, row, part, links: row ? bLinks(code) : null, out: !row ? { why: `Removed by ${layerName(m.out.get(code))}`, layer: true } : (get("oos", {})[code] ? get("oos", {})[code] : null), title: titleOf(code), status: row ? row.status : "", resp: row ? row.resp : null, src: row ? row.src : m.out.get(code),
      ob: v.ob || 0, om: v.om || 0, oe: row ? row.oe : 0, oa: part ? part.judged : v.oa || 0, jn, camp, reqs: reqs0.concat(mapped), evs: evs0.concat(evMine), comps: row ? C3.compsOf(code) : [], fnd, risks, poam, owner: ownerOf(code, row && row.owner), db: v.db || b.db || "" };
  }
  // The evidence lane B's screens keep for a control (V3's links, plus the session's links, less its removals), when lane B is here.
  const bLinks = (code) => { if (!PA.drB || typeof PA.drB.linksFor !== "function") return null; try { return arr0(PA.drB.linksFor(code)); } catch (e) { return null; } };
  const arr0 = (x) => (Array.isArray(x) ? x : []);
  const linkBad = (x) => (x.tone ? x.tone === "bad" : D.tone(x.state) === "bad");
  const allReqs = memo(() => { const out = new Map(); for (const r of C3.rows()) for (const q of C3.reqsOf(r.code)) { if (!out.has(q.id)) out.set(q.id, { id: q.id, title: q.title, ctl: [] }); out.get(q.id).ctl.push(r.code); } return out; });
  const reqTitle = (id) => (allReqs().get(id) || {}).title || id;

  // ——— Suggestions (derived): requirements that map the control's base or a sibling enhancement and are allocated to a component
  // that carries this control. Confidence: High when it maps the base control and shares a component, Medium when it shares a
  // component, Low when it only maps a sibling. ———
  const baseOf = (code) => code.replace(/\(\d+\)$/, "");
  const suggestions = memo((code) => {
    const d = recData(code); if (!d || d.out) return [];
    const have = new Set(d.reqs.filter((r) => !r.mine).map((r) => r.id)), base = baseOf(code), mine = new Set(d.comps), out = [];
    let alloc = (id) => []; try { alloc = (id) => { const r = fact("requirement", id); return (r && r.components) || []; }; } catch (e) { /* lane D not here */ }
    for (const [id, r] of allReqs()) {
      if (have.has(id)) continue;
      const sib = r.ctl.filter((c) => c !== code && baseOf(c) === base); if (!sib.length) continue;
      const shared = (alloc(id) || []).filter((c) => mine.has(c)), onBase = r.ctl.includes(base);
      const conf = onBase && shared.length ? "High" : shared.length ? "Medium" : "Low";
      const nm = shared.length && S3 && S3.nameOf ? S3.nameOf(shared[0]) : "";
      out.push({ id, title: r.title, conf, rank: (conf === "High" ? 0 : conf === "Medium" ? 1 : 2), why: `Maps ${sib.slice(0, 2).join(" and ")}${sib.length > 2 ? ` and ${fmt(sib.length - 2)} more` : ""}${nm ? `; allocated to ${nm}` : ""}.`, src: "the requirement register" });
    }
    return out.sort((a, b) => a.rank - b.rank || (a.id < b.id ? -1 : 1)).slice(0, 3);
  });

  // ——— The record ———
  function tabsOf(d, cur) {
    const stale = d.links ? d.links.filter(linkBad).length : d.evs.filter((e) => e.state !== "Accepted").length, open = d.fnd.filter((x) => x.state === "open").length, drafts = d.fnd.length - open;
    const short = d.fnd.filter((x) => x.state === "open" && x.det && x.det !== "satisfied").length;
    const list = TABS.map(([k, label]) => {
      const t = { label, route: recRoute(d.code, k), on: cur === k };
      if (k === "requirements") t.count = d.reqs.length;
      if (k === "evidence") { t.count = d.links ? d.links.length : d.evs.length; if (stale) t.problem = stale; }
      if (k === "assessment") t.count = d.ob;
      if (k === "findings") { if (open) t.problem = open; else t.count = drafts; }
      if (k === "risks") t.count = d.risks.length;
      if (k === "history") t.count = historyOf(d).length;
      return t;
    });
    void short;
    return D.tabs(list);
  }
  const statusChip = (d) => (d.out ? K.status("Out of scope", "none") : K.status(STW(d.status)[0], STW(d.status)[1]));
  function headOf(d, tab) {
    const comps = d.comps, libN = comps.filter((c) => libOf(c)).length;
    const facts = [
      ["Owner", ownerCell(d.owner), "dra.rec.owner"],
      ["Baseline", `${esc(layerShort(d.src))}${d.row ? mu(` · ${plural(layers().filter((l) => l.on).length, "layer")}`) : ""}`],
      ["Responsibility", d.resp ? esc(d.resp.kind === "System-specific" ? "This system" : `${d.resp.kind} · ${d.resp.provider || ""}`) : NONE],
      ["Components", comps.length ? `<span class="num">${fmt(comps.length)}</span>${libN ? mu(` · ${fmt(libN)} from a library`) : ""}` : NONE],
      ["Family", esc(`${d.code.split("-")[0]} ${famName(d.code.split("-")[0])}`)],
    ];
    const libC = comps.find((c) => libOf(c));
    const more = ([libC && !d.out ? { label: "Compare with library", act: "dra.cmp.first", arg: d.code } : null, { label: "Open the current control page", go: K.recRoute("k3c-control", d.code) || "controls" }, { label: "Assign owner", act: "dra.rec.owner" }, d.out && d.out.layer ? null : d.out ? { label: "Return to scope", act: "dra.rec.in", arg: d.code } : { label: "Mark out of scope", act: "dra.rec.out", arg: d.code, danger: true }].filter(Boolean));
    const step = primaryOf(d);
    const h = D.head({ review: D.review({ title: "Control record", current: K.recRoute("k3c-control", d.code) || "controls" }), crumbs: [["Controls", "dr-controls"], [d.code]], id: { code: d.code, tone: d.out ? "none" : D.tone(d.status) }, title: d.title, status: statusChip(d), facts, actions: { more, primary: step }, tabs: tabsOf(d, tab) });
    // The status word stands beside the title (the ladder stays the control's status; the stages below explain it).
    return h.includes("dra-st") || h.includes(STW(d.status)[0] + "</span></h1>") ? h : h.replace(/<\/h1>/, `</h1><span class="dra-st">${statusChip(d)}</span>`);
  }
  // The one primary: the control's next step, as the current page derives it.
  function primaryOf(d) {
    if (d.out) return d.out.layer ? "" : K.btn("Return to scope", { primary: true, act: "dra.rec.in", arg: d.code });
    if (d.status === "no_requirement") return K.btn("Map requirement", { primary: true, go: recRoute(d.code, "requirements") });
    if (d.status === "no_evidence") return K.btn(d.links ? "Link evidence" : "Add evidence", { primary: true, act: d.links ? "dra.ev.link" : "dra.ev.add", arg: d.code });
    if (d.part && !d.part.plan) return K.btn(`Plan the ${fmt(d.part.left)} left`, { primary: true, act: "dra.part.plan", arg: d.code });
    if (d.part && d.part.plan) { const c = campById(d.part.plan.camp); return K.btn("Open assessment campaign", { primary: true, go: c ? c.route : "assessments" }); }
    if (d.status === "not_assessed" && d.camp) return K.btn("Open assessment campaign", { primary: true, go: d.camp.route });
    if (d.status === "not_assessed") return K.btn("Add to assessment campaign", { primary: true, act: "dra.noop", arg: "Add to assessment campaign" });
    if (d.poam.length) return K.btn("Open POA&M item", { primary: true, go: "poam" });
    return K.btn("Edit implementation", { primary: true, act: "dra.card.edit", arg: d.code });
  }

  // ——— A control judged in part: only what's left goes into a plan ———
  const campaigns = () => (fact("assessments") || []).filter((a) => a.kind === "control" && a.status === "Active");
  const campById = (id) => { const a = (fact("assessments") || []).find((x) => x.id === id); return a ? { id: a.id, name: a.name, short: String(a.name || "").replace(/^WS-X90\s+/, ""), route: a.route } : null; };
  K.on("dra.part.plan", (code) => { const d = recData(code), p = d && d.part; if (!p) return; const list = campaigns();
    K.form({ title: `Plan the ${plural(p.left, "objective")} left on ${code}`, submit: "Add to the plan", intro: `${fmt(p.judged)} of ${fmt(p.ob)} are judged${p.res ? ` in ${esc(p.res.title)}` : ""}. Only the ${fmt(p.left)} nobody has judged go into the plan.`,
      fields: [{ key: "camp", label: "Assessment campaign", type: "select", required: true, value: p.camp && list.some((a) => a.id === p.camp.id) ? p.camp.id : (list[0] || {}).id, options: list.map((a) => [a.id, String(a.name).replace(/^WS-X90\s+/, "")]) }],
      onSubmit: (v) => { const c = campById(v.camp); mapPut("plan", code, { camp: v.camp, at: TODAY }); log(code, `planned the ${plural(p.left, "objective")} left in ${c ? c.short : v.camp}`); K.redraw(); K.toast(`${plural(p.left, "objective")} added to ${c ? c.short : "the plan"}`); } }); });
  K.on("dra.part.unplan", (code) => { mapPut("plan", code, undefined); log(code, "took the objectives left out of the plan"); K.redraw(); K.toast("Out of the plan: the objectives left are to plan again"); });

  // ——— Overview ———
  function stagesOf(d) {
    const ob = d.ob || 0, sat = d.status === "satisfied" ? (d.resp && d.resp.kind === "Inherited" ? ob : d.oa) : d.part ? d.part.judged : 0;
    const draftN = d.jn && d.jn.draft ? Math.max(0, (d.jn.n || 0) - d.oa) : 0, judged = d.oa, notJ = Math.max(0, ob - judged - draftN);
    const reqTab = recRoute(d.code, "requirements"), evTab = recRoute(d.code, "evidence"), asTab = recRoute(d.code, "assessment");
    const evAcc = d.evs.filter((e) => e.state === "Accepted").length, evPend = d.evs.length - evAcc;
    // With lane B here, the Evidence card counts its lifecycle states (Ready, Needs renewal…), one swatch each, problems first.
    const bLeg = d.links ? Object.values(d.links.reduce((o, x) => { const k = x.state || "Linked"; o[k] = o[k] || { label: k, n: 0, tone: x.tone || D.tone(k), go: evTab }; o[k].n++; return o; }, {})).sort((a, b) => (a.tone === "bad" ? 0 : a.tone === "ok" ? 2 : 1) - (b.tone === "bad" ? 0 : b.tone === "ok" ? 2 : 1)) : null;
    const planC = d.part && d.part.plan ? campById(d.part.plan.camp) : null;
    const inh = d.resp && d.resp.kind === "Inherited" ? ob : 0, inside = S3 && S3.inside ? S3.inside().filter((c) => !c.root).length : 0, notCarry = d.comps.length ? Math.max(0, inside - d.comps.length) : 0;
    const unc = inh ? [inh === 1 ? "objective judged by inheritance" : "objectives judged by inheritance"].concat(notCarry ? [`${plural(notCarry, "component")} don't carry it`] : []) : notCarry ? [notCarry === 1 ? "component doesn't carry it" : "components don't carry it"] : [];
    const cards = [
      { title: "Requirements", state: `${fmt(d.om)} of ${fmt(ob)} objectives mapped`, tone: d.om >= ob && ob ? "ok" : "warn", legend: [{ label: "Requirements", n: d.reqs.length, go: reqTab }, { label: "Objectives not mapped", n: Math.max(0, ob - d.om), tone: "bad", go: reqTab }].filter((l) => l.n), empty: d.reqs.length ? null : { line: "No requirement maps it", label: "Map requirement", go: reqTab } },
      { title: "Evidence", state: `${fmt(d.oe)} of ${fmt(ob)} objectives evidenced`, tone: d.oe >= ob && ob ? "ok" : "warn", legend: (bLeg ? bLeg : [{ label: "Accepted", n: evAcc, tone: "ok", go: evTab }, { label: "Pending review", n: evPend, tone: "warn", go: evTab }]).concat([{ label: "Objectives without evidence", n: Math.max(0, ob - d.oe), tone: "bad", go: evTab }]).filter((l) => l.n), empty: (d.links ? d.links.length : d.evs.length) ? null : { line: "No evidence is linked", label: d.links ? "Link evidence" : "Add evidence", act: d.links ? "dra.ev.link" : "dra.ev.add", arg: d.code } },
      { title: "Assessment", state: `${fmt(judged)} of ${fmt(ob)} objectives judged`, tone: judged >= ob && ob ? "ok" : draftN || d.part ? "warn" : "none", legend: [{ label: "Judged, published", n: judged, tone: "ok", go: asTab }, { label: "Judged in draft results", n: draftN, tone: "warn", go: asTab }].concat(d.part ? [planC ? { label: `Planned in ${planC.short}`, n: notJ, go: asTab } : { label: "Not judged, to plan", n: notJ, tone: "warn", act: "dra.part.plan", arg: d.code }] : [{ label: "Not judged", n: notJ, go: asTab }]).filter((l) => l.n), empty: judged || draftN ? null : { line: "No assessor has judged it", label: d.camp ? "Open assessment campaign" : "Add to assessment campaign", go: d.camp ? d.camp.route : "", act: d.camp ? "" : "dra.noop", arg: "Add to assessment campaign" } },
      { title: "Remediation", state: d.poam.length ? `${plural(d.poam.length, "open POA&M item")}` : "No open POA&M item", tone: d.poam.length ? "bad" : "ok", legend: d.poam.map((p) => ({ label: p.title, n: (p.ms || []).filter((x) => x.status !== "completed").length, tone: "warn", go: "poam" })), empty: d.poam.length ? null : { line: "Nothing to remediate" } },
    ];
    return D.stages({ done: sat, total: ob, unit: "objectives satisfied", tip: [["Requirements", d.om, ob], ["Evidence", d.oe, ob], ["Assessment", judged, ob], ["Remediation", d.poam.length, d.poam.length]], cards, uncounted: unc.length ? { n: inh || notCarry, label: unc.join(" · "), go: notCarry ? "system" : "" } : null });
  }
  function infoCard(d) {
    const s = sysImpl(d.code), ps = paramsOf(d.code), st = IMPLW(s.status);
    return D.card({ id: `dra-info-${d.code}`, title: "Info", facts: [
      ["Implementation statement", s.text ? `<span class="dra-prose">${esc(s.text)}</span>` : '<span class="dra-warnw">Not written</span>'],
      ["Implementation status", st ? K.status(st[0], st[1]) : NONE],
      ps.length ? ["Parameters", ps.map((p) => `<span class="dra-pv" title="${esc(p.label)}">${p.value ? esc(p.value) : `<span class="dra-warnw">[${esc(p.what || p.label)}] not set</span>`}</span>`).join("; ")] : null,
      ["Owner", ownerCell(d.owner)]].filter(Boolean),
      fields: [{ key: "text", label: "Implementation statement", type: "textarea", value: s.text }, { key: "status", label: "Implementation status", type: "select", value: s.status, options: Object.keys(SSP.IMPL).map((k) => [k, SSP.IMPL[k][0]]) }, { key: "owner", label: "Owner", type: "select", value: d.owner, options: [["", "No owner"]].concat(people().map((p) => [p.name, p.name])) }],
      save: (v) => { const was = sysImpl(d.code).text; mapPut("info", d.code, { text: v.text, status: v.status }); if (v.owner !== d.owner) { mapPut("own", d.code, v.owner || undefined); log(d.code, v.owner ? `assigned ${v.owner} as owner` : "cleared the owner"); } if (v.text !== was) { log(d.code, "edited the implementation statement"); resetApproval(d.code, "The statement changed"); } K.redraw(); K.toast("Info saved"); } });
  }
  function implCard(d) {
    const rows = d.comps.map((c) => { const im = compImpl(d.code, c), lib = libOf(c), ch = changedFromLib(d.code, c);
      return { go: `component--${c}`, cells: [`<span class="dra-nm">${esc(S3 && S3.nameOf ? S3.nameOf(c) : c)}</span>`, im.text ? `<span class="dra-line" title="${esc(ownSentences(im.text, c))}">${esc(ownSentences(im.text, c))}</span>` : '<span class="dra-warnw">Not written</span>', lib ? (ch ? '<span class="dra-warnw">Changed from library</span>' : `<span class="dra-okw">Matches library</span>`) : mu("Program only"), lib ? K.btn("Compare", { sm: true, act: "dra.cmp", arg: [d.code, c] }) : ""] }; });
    const body = rows.length ? K.table({ label: "Implementations", cls: "dra-impl", cols: [{ label: "Component", cls: "nw" }, { label: "Its statement" }, { label: "Library", cls: "nw" }, { label: "", cls: "tight" }], rows }) : `<p class="dra-mu">No component carries ${esc(d.code)}; the system's statement is the implementation.</p>`;
    return `<section class="k3-card dra-card"><div class="dra-card-h"><h2 class="k3-card-t">Implementations</h2><span class="dra-mu">${plural(d.comps.length, "component")}</span></div>${body}</section>`;
  }
  const STAGES = [["prepare", "Prepare for reviewers"], ["needs", "Needs approval"], ["changes", "Changes requested"], ["approved", "Approved"]];
  const apprOf = (code) => Object.assign({ stage: "prepare", sent: "", due: dueOf(), acts: [] }, get("appr", {})[code] || {});
  // Reset rules: an approved statement returns to Needs approval 14 days before its deadline; a change or a newly mapped
  // requirement returns it to Prepare for reviewers.
  const stageNow = (a) => (a.stage === "approved" && a.due && TODAY >= addDays(a.due, -14) ? "needs" : a.stage);
  function resetApproval(code, why) { const a = apprOf(code); if (a.stage === "prepare") return; mapPut("appr", code, Object.assign({}, a, { stage: "prepare", acts: a.acts.concat([{ who: "Rule", what: `${why}: back to Prepare for reviewers`, at: TODAY }]) })); }
  function apprCard(d) {
    const a = apprOf(d.code), st = stageNow(a), isso = byRmf("ISSO"), issm = byRmf("ISSM"), i = STAGES.findIndex((x) => x[0] === st);
    const apprs = [isso && ["ISSO", isso.name], a.who === "isso" ? null : issm && ["ISSM", issm.name]].filter(Boolean);
    const did = (n) => a.acts.filter((x) => x.who === n).slice(-1)[0];
    const steps = `<ol class="dra-stg">${STAGES.map(([k, l], n) => `<li class="${n < i || (k === "approved" && st === "approved") ? "dra-done" : ""}${k === st ? " dra-now" : ""}${k === "changes" && st !== "changes" ? " dra-alt" : ""}"${k === st ? ' aria-current="step"' : ""}><span class="dra-dot" aria-hidden="true"></span>${esc(l)}</li>`).join("")}</ol>`;
    const who = `<ul class="dra-apl">${apprs.map(([r, n]) => { const x = did(n); return `<li><span class="dra-nm">${esc(n)}</span>${mu(" · " + r)}<span class="dra-aps">${x ? esc(x.what) : st === "needs" ? "Waiting" : NONE}</span></li>`; }).join("")}</ul>`;
    const btns = st === "prepare" || st === "changes" ? K.btn("Send to reviewers", { sm: true, act: "dra.appr.send", arg: d.code }) : st === "needs" ? K.menu("Record a reviewer's answer", apprs.flatMap(([r, n]) => [{ label: `${n} approves`, act: "dra.appr.ok", arg: [d.code, n] }, { label: `${n} requests changes`, act: "dra.appr.chg", arg: [d.code, n] }]), { sm: true }) : K.btn("Withdraw approval", { sm: true, act: "dra.appr.reset", arg: d.code });
    const rules = `<ul class="dra-rules"><li>A change to the statement, or a requirement mapped, returns it to Prepare for reviewers.</li><li>An approval returns to Needs approval 14 days before its deadline.</li><li>Evidence added asks: Send to reviewers, or Still working.</li></ul>`;
    return `<section class="k3-card dra-card dra-appr"><div class="dra-card-h"><h2 class="k3-card-t">Review and approval</h2>${btns}</div><p class="dra-mu">The implementation statement, before the SSP goes out. Deadline <span class="num">${esc(md(a.due))}</span>${st === "needs" && a.sent ? ` · sent ${esc(md(a.sent))}` : ""}</p>${steps}${who}${rules}</section>`;
  }
  K.on("dra.appr.send", (code) => { const a = apprOf(code); mapPut("appr", code, Object.assign({}, a, { stage: "needs", sent: TODAY, acts: a.acts.concat([{ who: ME, what: "sent it to reviewers", at: TODAY }]) })); log(code, "sent the statement to reviewers"); K.redraw(); K.toast("Sent to reviewers: Needs approval"); });
  K.on("dra.appr.ok", ([code, n]) => { const a = apprOf(code), acts = a.acts.concat([{ who: n, what: "Approved", at: TODAY }]), isso = byRmf("ISSO"), issm = byRmf("ISSM"); const need = [isso && isso.name, a.who === "isso" ? null : issm && issm.name].filter(Boolean); const all = need.every((p) => { const x = acts.filter((y) => y.who === p).slice(-1)[0]; return x && x.what === "Approved"; }); mapPut("appr", code, Object.assign({}, a, { stage: all ? "approved" : "needs", acts })); log(code, `${n} approved the statement`); K.redraw(); K.toast(all ? "Approved by every reviewer" : `${n} approved; waiting on the other reviewer`); });
  K.on("dra.appr.chg", ([code, n]) => { const a = apprOf(code); mapPut("appr", code, Object.assign({}, a, { stage: "changes", acts: a.acts.concat([{ who: n, what: "Requested changes", at: TODAY }]) })); log(code, `${n} requested changes to the statement`); K.redraw(); K.toast("Changes requested"); });
  K.on("dra.appr.reset", (code) => { resetApproval(code, "Approval withdrawn"); log(code, "withdrew the approval"); K.redraw(); K.toast("Back to Prepare for reviewers"); });
  K.on("dra.card.edit", (code) => { const go = () => { const b = document.querySelector(`[data-drk-card="dra-info-${CSS.escape(code)}"] .drk-edit`); if (b) b.click(); }; if (curTab() !== "overview") { location.hash = recRoute(code); setTimeout(go, 60); } else go(); });

  // ——— Compare with the library implementation ———
  K.on("dra.cmp.first", (code) => { const d = recData(code), c = d && (d.comps.find((x) => changedFromLib(code, x)) || d.comps.find((x) => libOf(x))); if (c) openCmp(code, c); });
  K.on("dra.cmp", ([code, comp]) => openCmp(code, comp));
  function openCmp(code, comp) {
    const lib = libOf(comp), nm = S3 && S3.nameOf ? S3.nameOf(comp) : comp;
    D.openCompare({ title: `${nm}: compare ${code} with ${lib ? `${lib.set}, version ${lib.v}` : "the library"}`, rows: compareRows(code, comp), confirm: (sel) => {
      const take = (f) => { const v = sel && (sel[f] != null ? sel[f] : Array.isArray(sel) ? (sel.find((x) => x && x.field === f) || {}).choice : undefined); return v === true || v === "apply" || v === "template" || v === "Apply"; };
      const L = libImpl(code, comp), cur = compImpl(code, comp), o = Object.assign({}, get("cmp", {})[`${code}@${comp}`] || {}), done = [];
      if (take("Statement")) { o.text = L.text; done.push("statement"); }
      if (take("Implementation status")) { o.status = L.status; done.push("status"); }
      if (take("Parameters")) { o.params = L.params; done.push("parameters"); }
      void cur;
      if (!done.length) { K.toast("Nothing applied: the component keeps its own statement"); return; }
      mapPut("cmp", `${code}@${comp}`, o); log(code, `applied the library's ${done.join(", ")} to ${nm}`); resetApproval(code, "The statement changed"); K.redraw(); K.toast(`${nm} takes the library's ${done.join(" and ")}`);
    } });
  }

  // ——— Requirements, suggestions and the proposal ———
  const AUTO = { suggest: "The assistant suggests; it maps nothing alone.", high: "The assistant maps High-confidence suggestions alone; you can undo each.", off: "The assistant is off for this program." };
  function reqTab(d) {
    const kind = fact("reqPanel") || "v7p-req";
    const rows = d.reqs.map((r) => ({ panel: kind, id: r.id, cells: [`<span class="k3-nm"><span class="k3-nm-c">${esc(r.id)}</span><span class="k3-nm-t">${esc(r.title || r.id)}</span></span>`, r.mine ? mu("Mapped here") : r.today ? mu("Mapped today") : mu("Register"), (d.evs.filter((e) => e.req === r.id).length ? K.num(d.evs.filter((e) => e.req === r.id).length) : NONE), r.mine ? K.btn("Unmap", { sm: true, quiet: true, act: "dra.unmap", arg: [d.code, r.id] }) : ""] }));
    const table = K.related({ title: "Requirements", count: d.reqs.length, cols: [{ label: "Requirement" }, { label: "Mapped", cls: "nw" }, { label: "Evidence", cls: "nw end" }, { label: "", cls: "tight" }], rows, empty: `No requirement maps ${d.code} yet`, keep: true, add: { label: "Map requirement", act: "dra.map.pick", arg: d.code } });
    const auto = get("auto", "suggest"), dis = new Set(get("dis", {})[d.code] || []), sugg = auto === "off" ? [] : suggestions(d.code).filter((s) => !dis.has(s.id));
    const mappedHere = new Set(get("map", {})[d.code] || []);
    const cards = sugg.map((s) => mappedHere.has(s.id) ? `<div class="dra-sgdone"><span>${esc(s.id)} mapped</span>${K.actLink("Undo", "dra.undo", [d.code, s.id])}</div>` : D.suggest({ confidence: s.conf.toLowerCase(), title: `${s.id} ${s.title}`, rationale: s.why, source: s.src, actions: [{ label: "Map", act: "dra.sg.map", arg: [d.code, s.id] }, { label: "Dismiss", act: "dra.sg.dis", arg: [d.code, s.id] }] }));
    const undoDis = dis.size ? `<p class="dra-mu">${plural(dis.size, "suggestion")} dismissed. ${K.actLink("Undo", "dra.sg.undis", d.code)}</p>` : "";
    const high = sugg.filter((s) => s.conf === "High" && !mappedHere.has(s.id)), pr = get("prop", {})[d.code];
    const prop = high.length && !pr ? D.proposal({ who: "Mapping assistant", change: `Map ${high.map((s) => s.id).join(" and ")} to ${d.code}`, reasoning: `${high.length === 1 ? "It maps" : "Each maps"} ${baseOf(d.code)} and is allocated to a component that carries ${d.code}. Mapping returns the statement to Prepare for reviewers.`, approve: () => propOk(d.code), decline: () => propNo(d.code) }) : pr ? `<p class="dra-mu dra-prd">The assistant's proposal was ${pr === "approved" ? "approved" : "declined"}. ${K.actLink("Undo", "dra.prop.undo", d.code)}</p>` : "";
    const setting = `<p class="dra-auto"><span class="dra-ai">Assistant</span><span>${esc(AUTO[auto])}</span> ${K.actLink("Change", "dra.auto", d.code)}</p>`;
    const aiSec = `<section class="k3-sec dra-aisec"><div class="k3-sec-h"><h2>Suggested requirements</h2></div>${setting}${cards.length ? `<div class="dra-sgs">${cards.join("")}</div>` : auto === "off" ? "" : `<p class="dra-mu">No requirement to suggest.</p>`}${undoDis}${prop}</section>`;
    return [table, aiSec];
  }
  const propOk = (code) => { const hi = suggestions(code).filter((s) => s.conf === "High"); hi.forEach((s) => mapOne(code, s.id)); mapPut("prop", code, "approved"); K.redraw(); K.toast(`${plural(hi.length, "requirement")} mapped by the assistant's proposal`); };
  const propNo = (code) => { mapPut("prop", code, "declined"); K.redraw(); K.toast("Proposal declined"); };
  K.on("dra.prop.undo", (code) => { const was = get("prop", {})[code]; if (was === "approved") suggestions(code).filter((s) => s.conf === "High").forEach((s) => unmapOne(code, s.id)); mapPut("prop", code, undefined); K.redraw(); K.toast("Proposal undone"); });
  const curTab = () => { const m = /^dr-control--.+?--([a-z]+)$/.exec((location.hash || "").slice(1)); return m && TABS.some((t) => t[0] === m[1]) ? m[1] : "overview"; };
  const curCode = () => { const m = /^dr-control--(.+?)(?:--[a-z]+)?$/.exec((location.hash || "").slice(1)); return m ? decodeURIComponent(m[1]) : ""; };
  function mapOne(code, id) { const l = get("map", {})[code] || []; if (!l.includes(id)) { mapPut("map", code, l.concat([id])); log(code, `mapped ${id}`); resetApproval(code, `${id} was mapped`); } }
  function unmapOne(code, id) { mapPut("map", code, (get("map", {})[code] || []).filter((x) => x !== id)); log(code, `unmapped ${id}`); }
  K.on("dra.sg.map", ([code, id]) => { mapOne(code, id); K.redraw(); K.toast(`${id} mapped to ${code}`); });
  K.on("dra.undo", ([code, id]) => { unmapOne(code, id); K.redraw(); K.toast(`${id} unmapped`); });
  K.on("dra.unmap", ([code, id]) => { unmapOne(code, id); K.redraw(); K.toast(`${id} unmapped from ${code}`); });
  K.on("dra.sg.dis", ([code, id]) => { mapPut("dis", code, (get("dis", {})[code] || []).concat([id])); K.redraw(); K.toast(`Suggestion ${id} dismissed`); });
  K.on("dra.sg.undis", (code) => { mapPut("dis", code, undefined); K.redraw(); K.toast("Dismissed suggestions are back"); });
  K.on("dra.auto", () => K.form({ title: "What the assistant may do alone", submit: "Save", intro: "Chosen once for the program. Whatever it does alone, it says so and can be undone.", fields: [{ key: "auto", label: "The assistant", type: "select", required: true, value: get("auto", "suggest"), options: [["suggest", "Suggests only"], ["high", "Maps High-confidence suggestions alone"], ["off", "Is off"]] }],
    onSubmit: (v) => { put("auto", v.auto); if (v.auto === "high") { const code = curCode(); if (code) suggestions(code).filter((s) => s.conf === "High").forEach((s) => mapOne(code, s.id)); } K.redraw(); K.toast(AUTO[v.auto]); } }));
  K.on("dra.map.pick", (code) => { const d = recData(code), have = new Set(d.reqs.map((r) => r.id));
    K.pick({ title: `Map requirements to ${code}`, multi: true, submit: (n) => (n ? `Map ${plural(n, "requirement")}` : "Map requirements"), items: [...allReqs().values()].map((r) => ({ id: r.id, code: r.id, title: r.title, desc: `Maps ${r.ctl.slice(0, 3).join(", ")}${r.ctl.length > 3 ? "…" : ""}`, held: have.has(r.id) ? "Mapped" : "" })),
      onPick: (ids) => { ids.forEach((id) => mapOne(code, id)); K.redraw(); K.toast(`${plural(ids.length, "requirement")} mapped to ${code}`); } }); });

  // ——— Evidence: adding evidence to a statement under review asks whether to send it ———
  function evTab(d) {
    if (d.links) return evTabB(d);
    const kind = fact("evPanel") || "";
    const ET = { Accepted: "ok", "Pending review": "warn", "Needs revision": "bad" };
    const rows = d.evs.map((x) => ({ cells: [`<span class="dra-line" title="${esc(x.title)}">${esc(x.title)}</span>`, x.req ? esc(x.req) : NONE, K.status(x.state, ET[x.state] || "none"), x.mine ? mu(md(x.at)) : mu("Register")] }));
    void kind;
    return [K.related({ title: "Evidence", count: d.evs.length, cols: [{ label: "Evidence" }, { label: "Cited by", cls: "nw" }, { label: "State", cls: "nw" }, { label: "Added", cls: "nw" }], rows, keep: true, empty: d.reqs.length ? "Its requirements cite no evidence yet" : "Evidence comes through a requirement that maps the control", add: d.reqs.length ? { label: "Add evidence", act: "dra.ev.add", arg: d.code } : null })];
  }
  // With lane B here: the evidence its screens keep for the control (V3's links and the session's), each row opening lane B's
  // evidence record, its eye lane B's preview; Link evidence and Unlink write through PA.drB, so the evidence record shows them.
  function evTabB(d) {
    const pv = !!(PA.P && PA.P["drb-ev"]), renew = d.links.some((x) => x.renew);
    const rows = d.links.map((x) => ({ go: x.route || `dr-evidence--${x.id}`, peek: pv ? { panel: "drb-ev", id: x.id } : null,
      cells: [`<span class="dra-line" title="${esc(x.title)}">${esc(x.title)}</span>`, x.kind ? esc(x.kind) : NONE, K.status(x.state || "Linked", x.tone || D.tone(x.state))].concat(renew ? [x.renew ? `<span class="num">${esc(md(x.renew))}</span>` : NONE] : [], [K.btn("Unlink", { sm: true, quiet: true, act: "dra.ev.unlink", arg: [d.code, x.id] })]) }));
    return [K.related({ title: "Evidence", count: d.links.length, cls: "dra-evt", cols: [{ label: "Evidence" }, { label: "Kind", cls: "nw" }, { label: "State", cls: "nw" }].concat(renew ? [{ label: "Renewal", cls: "nw" }] : [], [{ label: "", cls: "tight" }]), rows, keep: true, empty: `No evidence is linked to ${d.code}`, add: { label: "Link evidence", act: "dra.ev.link", arg: d.code } })];
  }
  const askReview = (code) => { const a = apprOf(code); if (stageNow(a) === "prepare") return false;
    setTimeout(() => K.dialog({ title: "Send to reviewers?", body: `<p>${esc(code)}'s statement is ${esc((STAGES.find((x) => x[0] === stageNow(a)) || [])[1] || "")}. New evidence can go to the reviewers now, or wait while you keep working.</p>`, submit: "Send to reviewers", cancel: "Still working", onOk: () => { const b = apprOf(code); mapPut("appr", code, Object.assign({}, b, { stage: "needs", sent: TODAY, acts: b.acts.concat([{ who: ME, what: "sent it to reviewers with new evidence", at: TODAY }]) })); log(code, "sent the statement to reviewers with new evidence"); K.redraw(); K.toast("Sent to reviewers: Needs approval"); } }), 0);
    return true; };
  K.on("dra.ev.link", (code) => { if (!PA.drB) return; const have = new Set((bLinks(code) || []).map((x) => x.title)), arts = (fact("artifacts") || []).filter((a) => a && a.id && a.title);
    K.pick({ title: `Link evidence to ${code}`, multi: true, submit: (n) => (n ? `Link ${plural(n, "artifact")}` : "Link evidence"), intro: "The evidence record lists the control too.",
      items: arts.map((a) => ({ id: a.id, code: a.kind || "Evidence", title: a.title, desc: (a.requirements || []).length ? `Cited by ${(a.requirements || []).slice(0, 2).join(", ")}${(a.requirements || []).length > 2 ? "…" : ""}` : "Cited by no requirement", held: have.has(a.title) ? "Linked" : "" })),
      onPick: (ids) => { let n = 0; for (const id of ids) { let ok = false; try { ok = PA.drB.link(code, id); } catch (e) { ok = false; } if (ok) { n++; const a = arts.find((x) => x.id === id); log(code, `linked evidence “${a ? a.title : id}”`); } }
        K.redraw(); if (!askReview(code)) K.toast(n ? `${plural(n, "artifact")} linked to ${code}` : "Nothing linked"); } }); });
  K.on("dra.ev.unlink", ([code, id]) => { let ok = false; try { ok = !!(PA.drB && PA.drB.unlink(code, id)); } catch (e) { ok = false; } const x = (bLinks(code) || []).find((y) => y.id === id); if (ok) log(code, `unlinked evidence${x ? ` “${x.title}”` : ""}`); K.redraw(); K.toast(ok ? `Unlinked from ${code}` : "Nothing to unlink"); });
  K.on("dra.ev.add", (code) => K.form({ title: `Add evidence to ${code}`, submit: "Add evidence", intro: "Cited by the control's first requirement. Nothing is uploaded in the prototype.", fields: [{ key: "title", label: "Title", required: true, placeholder: "Remote session admission log, November" }],
    onSubmit: (v) => { mapPut("ev", code, (get("ev", {})[code] || []).concat([{ title: v.title.trim(), at: TODAY }])); log(code, `added evidence “${v.title.trim()}”`); K.redraw();
      const a = apprOf(code); if (stageNow(a) === "prepare") { K.toast("Evidence added"); return; }
      setTimeout(() => K.dialog({ title: "Send to reviewers?", body: `<p>${esc(code)}'s statement is ${esc((STAGES.find((x) => x[0] === stageNow(a)) || [])[1] || "")}. New evidence can go to the reviewers now, or wait while you keep working.</p>`, submit: "Send to reviewers", cancel: "Still working", onOk: () => { K.close && 0; const b = apprOf(code); mapPut("appr", code, Object.assign({}, b, { stage: "needs", sent: TODAY, acts: b.acts.concat([{ who: ME, what: "sent it to reviewers with new evidence", at: TODAY }]) })); log(code, "sent the statement to reviewers with new evidence"); K.redraw(); K.toast("Sent to reviewers: Needs approval"); } }), 0); } }));

  // ——— Assessment, findings, risks, history ———
  function asTab(d) {
    const objs = (PA.v3r && PA.v3r.objectivesOf ? PA.v3r.objectivesOf(d.code) : []) || [], draft = d.jn && d.jn.draft ? d.jn.n || 0 : 0;
    const planC = d.part && d.part.plan ? campById(d.part.plan.camp) : null;
    const word = (o, n) => (n < d.oa || (d.resp && d.resp.kind === "Inherited") ? K.status(d.part ? "Satisfied" : "Judged", "ok") : n < d.oa + Math.max(0, draft - d.oa) ? K.status("Judged in draft", "warn") : d.part ? (planC ? K.status("Planned", "none") : K.status("To plan", "warn")) : K.status("Not judged", "none"));
    const rows = objs.map((o, n) => ({ cells: [`<span class="k3-nm" title="${esc(o.text)}"><span class="k3-nm-c">${esc(o.label)}</span><span class="k3-nm-t">${esc(o.text)}</span></span>`, esc((o.methods || []).join(", ")), word(o, n)] }));
    const p = d.part, partFacts = p ? [["Judged in part", `<span class="num">${fmt(p.judged)} of ${fmt(p.ob)}</span> objectives${p.res ? ` · ${esc(p.res.title)}, ${esc(md(p.res.at))}` : ""}`],
      ["Left to judge", planC ? `<span class="num">${fmt(p.left)}</span> planned in ${K.link(planC.short, planC.route)} ${K.actLink("Take out", "dra.part.unplan", d.code)}` : `<span class="dra-warnw">${plural(p.left, "objective")} to plan</span> ${K.actLink("Plan them", "dra.part.plan", d.code)}`]] : [];
    const facts = K.facts([d.camp ? ["Campaign", K.link(d.camp.short, d.camp.route)] : null].concat(partFacts, [draft > d.oa ? ["Draft results", `<span class="num">${fmt(draft)} of ${fmt(d.ob)}</span> objectives judged, not published`] : null, d.db ? ["Determined by", esc(d.db)] : null, ["satisfied", "partially_satisfied", "other_than_satisfied"].includes(d.status) ? ["Determination", K.status(STW(d.status)[0], STW(d.status)[1])] : null]).filter(Boolean)); // no empty fact rows
    return [facts.includes("<div>") ? `<section class="k3-card dra-card">${facts}</section>` : "", K.related({ title: "Assessment objectives", count: objs.length, keep: true, cols: [{ label: "An assessor determines that" }, { label: "Method", cls: "nw" }, { label: "Judged", cls: "nw" }], rows, empty: "No assessment objectives are recorded for it" })];
  }
  function fndTab(d) {
    const due = d.fnd.some((x) => x.due); // a column with nothing in it folds
    const rows = d.fnd.map((x) => ({ panel: x.panel || "k3e-finding", id: x.id, cells: [`<span class="dra-line" title="${esc(x.title)}">${esc(x.title)}</span>`, esc(x.source || ""), x.state === "draft" ? K.status("Draft", "none") : K.status("Open", "bad")].concat(due ? [x.late ? `<span class="dra-warnw">Past due ${esc(md(x.due))}</span>` : x.due ? `<span class="num">${esc(md(x.due))}</span>` : NONE] : []) }));
    return [K.related({ title: "Findings", count: d.fnd.length, keep: true, cols: [{ label: "Finding" }, { label: "Source", cls: "nw" }, { label: "State", cls: "nw" }].concat(due ? [{ label: "Due", cls: "nw" }] : []), rows, empty: `No finding names ${d.code}` })];
  }
  function riskTab(d) {
    const rows = d.risks.map((x) => ({ panel: x.panel || "k3e-risk", id: x.id, cells: [`<span class="dra-line">${esc(x.title)}</span>`, esc(x.sev ? x.sev.charAt(0).toUpperCase() + x.sev.slice(1) : ""), esc(x.response || ""), ownerCell(x.owner)] }));
    return [K.related({ title: "Risks", count: d.risks.length, keep: true, cols: [{ label: "Risk" }, { label: "Severity", cls: "nw" }, { label: "Response", cls: "nw" }, { label: "Owner", cls: "nw" }], rows, empty: `No risk names ${d.code}` })];
  }
  function historyOf(d) {
    const b = SSP.ctl(d.code) || {}, out = [];
    if (b.up) out.push({ at: b.up, who: "SSP editor", what: `Implementation statement revision ${b.rv || 1}` });
    for (const f of d.fnd) if (f.opened) out.push({ at: f.opened, who: f.source || "Finding", what: `${f.state === "draft" ? "Draft finding" : "Finding opened"}: ${f.title}` });
    for (const x of get("log", {})[d.code] || []) out.push({ at: x.at, who: x.who, what: x.what, mine: true });
    return out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  }
  function histTab(d) {
    const rows = historyOf(d).map((x) => ({ cells: [`<span class="num">${esc(md(x.at))}</span>`, esc(x.who), `<span class="dra-line" title="${esc(x.what)}">${esc(x.what)}</span>`] }));
    return [K.related({ title: "History", count: rows.length, keep: true, cols: [{ label: "When", cls: "nw" }, { label: "Who", cls: "nw" }, { label: "What" }], rows, empty: "Nothing recorded yet" })];
  }

  function record(id) {
    let code = String(id || ""), tab = "overview";
    const m = /^(.+?)--([a-z]+)$/.exec(code); if (m && TABS.some((t) => t[0] === m[2])) { code = m[1]; tab = m[2]; }
    try { code = decodeURIComponent(code); } catch (e) { /* as typed */ }
    SELROUTE = "";
    const d = V3.wsx() ? recData(code) : null;
    const rv = D.review({ title: "Control record", current: K.recRoute("k3c-control", code) || "controls" });
    if (!d) return K.page({ cls: "dra k3-rec", head: rv + K.head({ crumbs: [["Controls", "dr-controls"], ["Not found"]], title: "This control is not here" }), body: K.empty({ title: "Nothing at this address", line: "The address names a control WS-X90's baseline does not hold.", action: K.btn("Back to Controls", { go: "dr-controls" }) }) });
    let body;
    if (d.out && tab === "overview") body = D.sunken(`<section class="k3-card dra-card"><h2 class="k3-card-t">Out of scope</h2>${K.facts([["Rationale", esc(d.out.why)], d.out.by ? ["Marked", `${esc(md(d.out.at))} · ${esc(d.out.by)}`] : null].filter(Boolean))}</section>`);
    else if (tab === "overview") body = D.sunken(`${stagesOf(d)}<div class="dra-grid"><div class="dra-col">${infoCard(d)}${implCard(d)}</div><div class="dra-col">${apprCard(d)}</div></div>`);
    else body = ({ requirements: reqTab, evidence: evTab, assessment: asTab, findings: fndTab, risks: riskTab, history: histTab }[tab] || (() => ""))(d);
    return K.page({ cls: "dra dra-rec k3-rec", head: headOf(d, tab), body });
  }

  K.on("dra.rec.owner", () => { const code = curCode(); if (!code) return; const cur = ownerOf(code, (C3.rows().find((r) => r.code === code) || {}).owner);
    K.form({ title: `Owner of ${code}`, submit: "Save owner", fields: [{ key: "who", label: "Owner", type: "select", value: cur, options: [["", "No owner"]].concat(people().map((p) => [p.name, `${p.name} · ${p.rmf || p.role}`])) }],
      onSubmit: (v) => { mapPut("own", code, v.who || undefined); log(code, v.who ? `assigned ${v.who} as owner` : "cleared the owner"); K.redraw(); K.toast(v.who ? `${v.who} owns ${code}` : `${code} has no owner`); } }); });
  K.on("dra.rec.out", (code) => K.form({ title: `Mark ${code} out of scope`, submit: "Mark out of scope", danger: true, intro: "It stays in Controls, under Scope › Out of scope, with your rationale; nothing is owed for it.", fields: [{ key: "why", label: "Rationale", type: "textarea", rows: 3, required: true }],
    onSubmit: (v) => { mapPut("oos", code, { why: v.why.trim(), by: ME, at: TODAY }); log(code, "marked it out of scope"); K.redraw(); K.toast(`${code} out of scope: Controls lists it under Scope › Out of scope`); } }));
  K.on("dra.rec.in", (code) => { mapPut("oos", code, undefined); log(code, "returned it to scope"); K.redraw(); K.toast(`${code} back in scope`); });

  D.route("dr-controls", register, { nav: "controls" });
  D.routeLike("dr-control", record, { nav: "controls" });
  PA.dra = { count: () => ask(fstate()).length, rows: rowsAll, recData, suggestions, compareRows, changedFromLib };
})();
