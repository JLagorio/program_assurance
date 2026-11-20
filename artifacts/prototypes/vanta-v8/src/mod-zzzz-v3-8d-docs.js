// V3 lane D (k3d-): the program's documents, requirements and evidence. Three registers in the kit's list shape, each with its
// kinds as tabs (K.rail) and its states as chips; a document's row opens its editor at once; a requirement's row and an
// artifact's row go to the record's page, where the work is done, and the row's eye previews the same record in a panel. It replaces Plans (ssps…), Policies, STIG checklists (the register), Evidence sources,
// Traceability and Requirements' Objectives, Compliance and Chain tabs. Inert while V3 is off (K.screen / K.lazy / V3.S pages,
// kit actions, V3.redirect; every listener returns at once).
//
// Pages
//   documents            every document of the program: the SSP, the plans, the policies, the ITCSC, the agreements
//   document--<id>       a document created here from a blank page (the plan templates are the earlier lane X's: plan-scrm, …)
//   requirements         the register: tabs by where a requirement comes from, chips by what it lacks
//   requirement--<code>  the requirement's page (the kit draws it from k3d-req, called with { page: true }): its statement edited
//                        in place, Controls, Components and Evidence each added and removed there, one primary in the header
//   evidence             the register: kinds as a switch (STIG checklists are a kind whose rows open the checklist's own page)
//   artifact--<id>       the artifact's page (from k3d-ev): its review in the header, Cited by, the controls it supports, versions
//   evidence-sources     the integrations that collect evidence (the earlier lane W's rows, in the same page shape)
//   ssp--<at>            the SSP editor at a place: a section (ssp--s8, ssp--8), a control (ssp--AC-2), a component (ssp--CN-109101),
//                        the first placeholder narrative (ssp--placeholder)
// Panels (the previews of those two pages, opened by a row's eye): k3d-req and k3d-ev; everything on the page is doable there. With V3 on, v7p-req draws k3d-req, and a-docs-ev
//   and v3x-ev draw k3d-ev for the artifacts it knows.
// Opening a register on exactly some records (set, then go):
//   K.set("doc.view", { rail: "" | "plan" | "policy" | "cat" | "agreement", chip: "" | "draft" | "review" | "changes" | "expired" | "approved" | "none", q: "" })   → documents
//   K.set("req.view", { rail: "" | "eng" | "cust", chip: "" | "noctl" | "noev" | "noalloc" | "review" | <a customer answer>, q: "",
//                       comp: "<component code>", fam: "AC", ctl: "<control code>", codes: ["REQ-001", …], note: "the words over them", page: 0 })   → requirements
//   K.set("evd.view", { rail: "" | "Document" | "Test record" | "Dataset" | "Scan result" | "stig", chip: "" | "pending" | "accepted" | "revise" | "expiring",
//                       q: "", owner: "<name>", codes: [artifact ids], note: "", page: 0 })                                                   → evidence
// Session data (K.get/K.set; another program than WS-X90 under "p.<program>."; Reset clears it; nothing is seeded):
//   req.made [{ code, title, statement, type, by, at }]   requirements created here (WS-X90: also listed in lane S's sys.reqs)
//   req.edits { code: { title, statement } } · req.own { code: name } · req.evl [[req, artifact id]] · req.evRm [[req, artifact id]]
//   evd.made [{ id, title, kind, file, owner, collected, renew, by, at }] · evd.state { id: { state: pending|accepted|revise, at, by, note } }
//   evd.vers { id: [{ file, note, at, by }] } · evd.renew { id: iso } · doc.made [{ id, title, kind: plan|policy, by, at, state, text }]
// One home a fact, so this lane writes where the fact is already kept and reads the same places:
//   a control mapped or unmapped   kit data ctl.reqs { control: [{ id, title }] } and ctl.unmap { control: [id] } (lane C's panel), and the
//                                  control's walk (PA.v2.chain) when the control had no requirement; also sys.maps / sys.mapsRm (lane S)
//   an allocation                  kit data sys.alloc [[component, req]] and sys.unalloc (lane S's component page)
//   requirements created elsewhere ctl.madeReqs (a control's panel) and sys.reqs (a component's page) are listed in the register
//   a narrative                    PA.SSP's own (the SSP editor's record): the editor and a control's panel read one text
//   a plan from a template         lane X's (v3.X.plans)
//   the base registers             the workbook's records (PA.sctm, which lane X widened to 640 requirements and 368 artifacts), read
//                                  again after anything the chain changed; another program: lane P's records (v3.P.<program>.req / ev / pol / ssp)
// Facts published (PA.v3.fact), WS-X90:
//   requirement(code) → { code, id, title, statement, st, type, controls, ctl, components, els, evidence: [artifact ids], state, owner, made, by, at }
//   createdRequirements() → the same shape, for every requirement created today (here, in a control's panel, on a component's page)
//   requirementsOfControl(control) → codes · requirementsOfComponent(component) → codes (allocated directly)
//   createRequirement({ title, statement, type, controls: [codes], components: [codes] }) → code
//   mapControl(req, control) · unmapControl(req, control) · allocateRequirement(req, component) · unallocateRequirement(req, component)
//   artifacts() → [{ id, title, kind, state: pending|accepted|revise, owner, collected, requirements }] · artifact(id)
//   linkEvidence(req, artifactId) · unlinkEvidence(req, artifactId) · reqPanel() → "k3d-req" · evPanel() → "k3d-ev"
//   sspAt(target) → the route that opens the SSP there (8, "s8", "AC-2", "CN-109101", { control }, { component }, { connection: name },
//     "ports", "placeholder") · documents() → [{ id, name, kind, state, revision, route }]
//   fact("evidence") and fact("requirements") follow what is reviewed, added and created here (requirements().total is the highest
//   requirement number in use, so a lane numbering the next requirement from it never collides; .count is the number of rows).
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k, V = PA && PA.v2;
  if (!V3 || !K || !V) return;
  const S = PA.S, SSP = PA.SSP, h = PA.h, AK = PA.AK, esc = K.esc, fmt = K.fmt;
  const WSX = "PRG-1090";
  const CH = V.chain || null;
  const TODAY = (CH && CH.TODAY_ISO) || "2026-11-17", ME = (CH && CH.ME) || "Ingrid Solberg";
  const on = () => V3.on(), wsx = () => V3.wsx();
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
  const natural = (a, b) => collator.compare(String(a), String(b));
  const uniq = (a) => [...new Set(a.filter((x) => x != null && x !== ""))];
  const clip = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).replace(/[\s,;:.]+\S*$/, "") + "…" : s; };
  const md = (iso) => { if (!iso) return ""; const d = new Date(String(iso).slice(0, 10) + "T12:00:00"); return isNaN(d) ? String(iso) : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() === 2026 ? undefined : "numeric" }); };
  const days = (iso) => Math.round((new Date(String(iso).slice(0, 10) + "T12:00:00") - new Date(TODAY + "T12:00:00")) / 864e5);
  const none = (label) => `<span class="k3-none"${label ? ` aria-label="${esc(label)}"` : ""}>—</span>`;
  const mu = (t) => `<span class="k3-muted">${esc(t)}</span>`;
  const tpl = (html) => { const t = document.createElement("template"); t.innerHTML = String(html || ""); return t.content; };
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  const has = (route) => !!S[route];
  const cur = () => (location.hash || "#home").slice(1);

  // ——— Session data: WS-X90's under its own names, another program's under "p.<program>." ———
  const pre = () => (wsx() ? "" : `p.${V3.prog()}.`);
  const get = (p, d) => { const v = K.get(pre() + p, d); return v == null ? d : v; };
  const set = (p, v) => K.set(pre() + p, v);
  const pairHas = (p, a, b) => get(p, []).some((x) => x[0] === a && x[1] === b);
  const pairAdd = (p, a, b) => { if (!pairHas(p, a, b)) set(p, get(p, []).concat([[a, b]])); };
  const pairDrop = (p, a, b) => { if (pairHas(p, a, b)) set(p, get(p, []).filter((x) => !(x[0] === a && x[1] === b))); };

  // ——— Memo: derived lists live for one draw; anything written forgets them ———
  let MEMO = {};
  const memo = (k, fn) => (k in MEMO ? MEMO[k] : (MEMO[k] = fn()));
  const fresh = () => { MEMO = {}; };
  V.on(fresh);
  window.addEventListener("hashchange", fresh);
  window.addEventListener("v3change", fresh);

  // ——— The pages this lane folds, read where they are: an old page's table gives its rows at draw time ———
  const ORIG = {}; // the old draw of a route this lane replaces (set by its wrapper)
  let DEPTH = 0; // inside an old page's draw: this lane's own pages hand back the page as it was (an old page may draw another)
  const oldPage = (route) => memo("old:" + route, () => { DEPTH++; try { const fn = ORIG[route] || S[route]; return fn ? tpl(fn()) : tpl(""); } catch (e) { console.error("k3d", route, e); return tpl(""); } finally { DEPTH--; } });
  const oldRows = (route) => [...oldPage(route).querySelectorAll("table tbody tr")];
  const openModal = (key, id) => { const main = document.getElementById("main"); if (!main) return; const t = document.createElement("span"); t.hidden = true; t.setAttribute("data-modal", key); if (id != null) t.setAttribute("data-id", id); main.appendChild(t); t.click(); t.remove(); };
  const people = () => memo("people", () => { const l = (V3.fact("people", V3.prog()) || []).map((p) => p.name); return uniq(l.concat([ME])); });

  // ——— Sibling lanes, used when they are in the build ———
  const hasS = () => typeof V3.facts.components === "function" && !!PA.v3s;
  const hasC = () => !!PA.P["k3c-control"];
  const ctlPanel = () => (hasC() ? "k3c-control" : "a-tests-control");
  const compRoute = (code) => (hasS() ? `component--${code}` : `rec--v7p-el--${code}`);
  const compRec = (code) => { const f = hasS() ? V3.fact("component", code) : null; if (f) return f; const e = PA.v7p && PA.v7p.EBY ? PA.v7p.EBY[code] : null; return e ? { code, name: e.name, kind: e.type, boundary: "inside", parent: e.parent } : null; };
  const compName = (code) => { const c = compRec(code); return c ? c.name : code; };
  const compLink = (code) => `<a class="k3-link" href="#${esc(compRoute(code))}">${esc(compName(code))}</a> <span class="k3-nm-c">${esc(code)}</span>`;
  const allComps = () => memo("comps", () => {
    const f = hasS() ? V3.fact("components") : null;
    if (f) return f.filter((c) => c.boundary === "inside");
    return ((SSP && SSP.elements) || []).filter((e) => e[2] !== "platform" && e[3]).map(([code, name, type, parent]) => ({ code, name, kind: type, boundary: "inside", parent }));
  });
  const ctlRec = (code) => (SSP && SSP.ctl ? SSP.ctl(code) : null);
  const CSW = { satisfied: "Satisfied", partially_satisfied: "Partially satisfied", other_than_satisfied: "Other than satisfied", not_assessed: "Not assessed", no_evidence: "No evidence", no_requirement: "No requirement" };
  const ctlStatus = (code) => { const s = V3.fact("status", code) || (ctlRec(code) || {}).cs; return CSW[s] || ""; };

  // ════════════════ Documents ════════════════
  const DSTATE = { draft: ["Draft", "none"], review: ["In review", "none"], changes: ["Changes requested", "bad"], expired: ["Expired", "bad"], approved: ["Approved", "ok"], none: ["Not started", "none"] };
  const dstate = (word) => { const w = String(word || "").toLowerCase(); return /sent back|changes/.test(w) ? "changes" : /in review|submitted|waiting/.test(w) ? "review" : /approved|published|signed/.test(w) ? "approved" : /no document|not started/.test(w) ? "none" : "draft"; };
  const DKIND = { plan: "Plans", policy: "Policies", cat: "Categorization", agreement: "Agreements" };
  const placeholders = () => ((SSP && SSP.controls) || []).filter((c) => c.ph);
  const madeDocs = () => get("doc.made", []);
  // Every document of WS-X90, one row each, read from the pages that hold them.
  function docsWsx() {
    const out = [];
    for (const tr of oldRows("ssps")) {
      const kind = tr.getAttribute("data-panel"), id = tr.getAttribute("data-id"), td = [...tr.children];
      const name = txt(td[0] && td[0].querySelector("span > span")) || txt(td[0]), abbr = txt(td[0] && td[0].querySelector(".ak-code"));
      const base = { kind: "plan", name, rev: txt(td[1]), owner: txt(td[3] && td[3].querySelector(".nm")) || txt(td[3]), editing: td[4] ? td[4].innerHTML : "", editors: (td[4] && td[4].querySelector("[title]") ? td[4].querySelector("[title]").getAttribute("title") : txt(td[4])) || "", edited: txt(td[5] && td[5].querySelector(".num")) || txt(td[5]), comments: +txt(td[6]) || 0 };
      if (kind === "ssp") {
        const revs = (SSP && SSP.revisions) || [], pub = revs.filter((r) => r.state === "Published").pop(), d = (SSP && SSP.doc) || {};
        const inc = txt(td[2]).replace(/^Revision \d+\s*·?\s*/, "");
        out.push(Object.assign(base, { id: "ssp", route: "ssp", abbr: abbr || "SSP", state: dstate(d.state || "Draft"), rev: String(d.revision || base.rev),
          what: `${abbr || "SSP"} · revision ${d.revision || base.rev} is the draft${inc ? ` for ${inc}` : ""}${pub ? `; revision ${pub.v} is published` : ""}`,
          menu: [{ label: "Version history", act: "k3d.go", arg: "ssp-history" }, { label: "Submit for review", act: "k3d.go", arg: "ssp-review" }, PA.M["v3g-ssp21"] ? { label: "Revision 2.1, Increment 1's annual update", act: "k3d.modal", arg: ["v3g-ssp21", "r21"] } : null, { label: "Export as PDF", act: "k3d.export", arg: "System security plan, revision " + (d.revision || base.rev) }] }));
      } else if (kind === "v8d-plan" && has("plan-" + id)) {
        out.push(Object.assign(base, { id: "plan-" + id, route: "plan-" + id, abbr, state: dstate(txt(td[2])), what: `${abbr} · revision ${base.rev}`,
          menu: [has(`plan-${id}-history`) ? { label: "Version history", act: "k3d.go", arg: `plan-${id}-history` } : null, { label: dstate(txt(td[2])) === "changes" ? "Resubmit for review" : dstate(txt(td[2])) === "review" ? "Review status" : "Submit for review", act: "k3d.modal", arg: ["v8d-submit", id] }, { label: "Export as PDF", act: "k3d.export", arg: `${name}, revision ${base.rev}` }] }));
      } else if (kind === "v3x-plan" && has("plan-" + id)) {
        out.push(Object.assign(base, { id: "plan-" + id, route: "plan-" + id, abbr, state: "draft", editing: "", editors: "", what: `${abbr} · revision 1, from its template`, menu: [{ label: "Export as PDF", act: "k3d.export", arg: `${name}, revision 1` }] }));
      }
    }
    for (const d of madeDocs()) out.push({ id: d.id, kind: d.kind === "policy" ? "policy" : "plan", name: d.title, abbr: "", rev: "1", state: d.state || "draft", owner: d.by, editing: "", editors: "", edited: md(d.edited || d.at), route: "document--" + d.id, made: true, what: `${d.kind === "policy" ? "Policy" : "Plan"} · revision 1, written here`,
      menu: [{ label: (d.state || "draft") === "review" ? "Withdraw from review" : "Submit for review", act: "k3d.doc.submit", arg: d.id }, { label: "Export as PDF", act: "k3d.export", arg: d.title }, { label: "Delete document", act: "k3d.doc.rm", arg: d.id, danger: true }] });
    for (const tr of oldRows("policies")) {
      const id = String(tr.getAttribute("data-id") || "").split("|")[0], td = [...tr.children]; if (!id) continue;
      const name = txt(td[0] && td[0].querySelector(".a-docs-tr")) || txt(td[0]), lv = td[2], pillEl = lv && lv.querySelector(".pill");
      const word = txt(pillEl), rev = lv ? txt(lv).replace(word, "").replace(/Start\d*$/, "").trim() : "";
      const st = dstate(word || "Draft"), slug = [`policy-page-${id.toLowerCase()}`, `after-policy-page-${id.toLowerCase()}`].find(has) || "";
      const renew = st === "none" ? "" : txt(td[4]), owner = st === "none" ? "" : txt(td[6] && td[6].querySelector(".nm"));
      // A plan the policy register lists beside the -1 policies (the incident response plan under IR-8) is the plan's own row.
      const twin = slug ? null : out.find((d) => d.kind === "plan" && d.name.toLowerCase() === name.toLowerCase());
      if (twin) { twin.what += ` · implements ${id}${rev && !/^(—|)$/.test(rev) ? ` · ${rev.toLowerCase()} ${DSTATE[st][0].toLowerCase()}` : ""}`; continue; }
      out.push({ id: "pol-" + id, kind: "policy", name: `${name} policy`, abbr: id, rev: /^(—|)$/.test(rev) ? "" : rev.replace(/^(Revision|Version|Edition|Issue)\s*/, ""), state: st, owner, editing: "", editors: "", edited: "", route: slug || null, panel: slug ? null : ["a-docs-pol", `${id}|versions`],
        what: `${id} · policy and procedures${renew && renew !== "—" ? ` · renew by ${renew}` : ""}`,
        menu: [st === "none" && PA.M["a-docs-start"] ? { label: "Start the document", act: "k3d.modal", arg: ["a-docs-start", id] } : null, st === "none" ? null : { label: "Export as PDF", act: "k3d.export", arg: `${name} policy` }] });
    }
    if (has("itcsc")) {
      const pg = oldPage("itcsc"), facts = {}; pg.querySelectorAll(".ak-rh .ak-facts > div").forEach((d) => { facts[txt(d.querySelector("dt"))] = txt(d.querySelector("dd")); });
      const word = txt(pg.querySelector(".ak-rh .ak-title-row .pill")), ver = (facts.Version || "").split("·")[0].trim();
      out.push({ id: "itcsc", kind: "cat", name: txt(pg.querySelector(".ak-rh .ak-title")) || "IT categorization and selection checklist", abbr: "ITCSC", rev: ver, state: dstate(word || "Approved"), owner: facts.Owner || "", editing: "", editors: "", edited: (facts.Version || "").split("·")[1] ? (facts.Version || "").split("·")[1].trim().replace(/, 2026$/, "") : "", route: "itcsc",
        what: `ITCSC · ${facts.Categorization || "the system's categorization"}${facts["Next review"] ? ` · next review ${facts["Next review"]}` : ""}`,
        menu: [has("itcsc-history") ? { label: "Version history", act: "k3d.go", arg: "itcsc-history" } : null, has("itcsc-approval") ? { label: "Approval and signatures", act: "k3d.go", arg: "itcsc-approval" } : null, { label: "Export as AF ITCSC", act: "k3d.export", arg: "ITCSC, version " + ver }] });
    }
    // Agreements are a connection's own (lane S): listed here, each opening its connection.
    const conns = hasS() ? V3.fact("connections") || [] : [];
    for (const x of conns) {
      const a = x.agreement; if (!a || !(a.ref || a.kind)) continue;
      const w = String(a.st || a.state || ""), st = /expired/i.test(w) ? "expired" : /draft/i.test(w) ? "draft" : /review|pending/i.test(w) ? "review" : "approved", exp = a.exp || a.expires || "";
      out.push({ id: "agr-" + x.id, kind: "agreement", name: `${a.kind || "Agreement"} with ${x.name}`, abbr: a.ref || "", rev: "", state: st, stateWord: st === "approved" ? w || "Signed" : "", owner: a.owner || "", editing: "", editors: "", edited: a.signed ? md(a.signed) : "", panel: ["k3s-conn", x.id],
        what: `${a.ref ? a.ref + " · " : ""}the agreement of the ${x.name} connection${exp ? ` · ${st === "expired" ? "expired" : "expires"} ${md(exp)}` : a.interim ? ` · interim until ${md(a.interim)}` : ""}`, menu: [] });
    }
    return out;
  }
  // A created program's documents: what lane P's records hold for it.
  function docsMade() {
    const code = V3.prog(), out = [], P = PA.v3p;
    const g = (k, d) => { const v = V.get(`v3.P.${code}.${k}`); return v == null ? d : v; };
    const ssp = g("ssp", {}) || {}, nar = g("nar", {}) || {};
    if (has("ssp")) out.push({ id: "ssp", kind: "plan", name: "System security plan", abbr: "SSP", rev: "1", state: ssp.state === "published" ? "approved" : "draft", stateWord: ssp.state === "published" ? "Published" : "", owner: ssp.by || "", editing: "", editors: "", edited: ssp.at ? md(ssp.at) : "", route: "ssp", what: `SSP · revision 1 · ${plural(Object.values(nar).filter((t) => String(t || "").trim()).length, "narrative")} written`, menu: [] });
    if (has("itcsc")) out.push({ id: "itcsc", kind: "cat", name: "IT categorization and selection checklist", abbr: "ITCSC", rev: "1", state: (g("itcsc", {}) || {}).ao ? "approved" : "draft", owner: "", editing: "", editors: "", edited: "", route: "itcsc", what: "ITCSC · the system's categorization and its signatures", menu: [] });
    for (const p of (P && P.recs ? P.recs(code, "pol") : g("pol", [])) || []) out.push({ id: "pol-" + p.id, kind: "policy", name: p.title || p.id, abbr: p.id, rev: "1", state: "draft", owner: p.owner || p.by || "", editing: "", editors: "", edited: p.at ? md(p.at) : "", panel: ["v3p-rec", `pol|${p.id}`], what: `${p.id} · policy`, menu: [] });
    for (const d of madeDocs()) out.push({ id: d.id, kind: d.kind === "policy" ? "policy" : "plan", name: d.title, abbr: "", rev: "1", state: d.state || "draft", owner: d.by, editing: "", editors: "", edited: md(d.edited || d.at), route: "document--" + d.id, made: true, what: `${d.kind === "policy" ? "Policy" : "Plan"} · revision 1, written here`, menu: [{ label: "Delete document", act: "k3d.doc.rm", arg: d.id, danger: true }] });
    return out;
  }
  const docs = () => memo("docs", () => (wsx() ? docsWsx() : docsMade()));
  const docView = () => Object.assign({ rail: "", chip: "", q: "" }, K.get("doc.view", {}) || {});
  const docSet = (ch) => K.set("doc.view", Object.assign({}, docView(), ch));

  K.on("k3d.go", (route) => K.go(route));
  K.on("k3d.modal", (a) => openModal(a[0], a[1]));
  K.on("k3d.panel", (a) => K.openPanel(a[0], a[1]));
  K.on("k3d.export", (what) => K.toast(`${what}: exported as a PDF with today's date`));
  K.on("k3d.doc.rail", (id) => { docSet({ rail: id || "", chip: "" }); K.redraw(); });
  K.on("k3d.doc.chip", (id) => { docSet({ chip: docView().chip === id ? "" : id || "" }); K.redraw(); });
  K.on("k3d.doc.q", (v) => { docSet({ q: v }); K.redraw(); });
  K.on("k3d.doc.att", (a) => { docSet({ rail: a[0] || "", chip: a[1] || "", q: "" }); K.redraw(); });
  K.on("k3d.doc.open", (id) => { const d = docs().find((x) => x.id === id); if (!d) return; if (d.route) K.go(d.route); else if (d.panel) K.openPanel(d.panel[0], d.panel[1]); });
  K.on("k3d.doc.ph", () => K.go("ssp--placeholder"));

  // New document: a plan from one of lane X's templates (its own drafts, listed here), or a blank plan or policy written here.
  const XPLANS = [["scrm", "Supply chain risk management plan", "NIST SP 800-161 Rev 1"], ["pia", "Privacy impact assessment", "OMB M-03-22"], ["cms", "Continuous monitoring strategy", "NIST SP 800-137"]];
  const xMade = () => (V.get("v3.X.plans", null) || []).filter(Boolean);
  K.on("k3d.doc.new", () => {
    if (!wsx() && PA.M["v3p-new"]) { /* a created program: a blank document, kept with that program */ }
    const tpls = wsx() ? XPLANS.filter(([k]) => has("plan-" + k)) : [];
    K.form({ title: "New document", submit: "Create document", intro: "It opens in its editor as revision 1, a draft, and is listed here.",
      fields: [{ key: "from", label: "Start from", type: "select", required: true, value: "blank-plan", options: tpls.map(([k, t, std]) => ["x:" + k, `${t} · ${std} template${xMade().some((p) => p.k === k) ? " (already a draft: opens it)" : ""}`]).concat([["blank-plan", "A blank plan"], ["blank-policy", "A blank policy"]]) },
        { key: "title", label: "Title", hint: "Needed for a blank document; a template names its own.", placeholder: "Security assessment plan" }],
      onSubmit: (v) => {
        if (v.from.indexOf("x:") === 0) {
          const k = v.from.slice(2), t = XPLANS.find((x) => x[0] === k), was = xMade().some((p) => p.k === k);
          if (!was) V.set("v3.X.plans", xMade().concat([{ k, at: new Date().toISOString(), by: ME, text: {} }]));
          K.go("plan-" + k); K.toast(was ? `${t[1]} is already a draft: it opens where you left it` : `${t[1]} created: revision 1, a draft, from the ${t[2]} template`);
          return null;
        }
        if (!v.title) return { title: "Enter a title for the blank document." };
        if (docs().some((d) => d.name.toLowerCase() === v.title.toLowerCase())) return { title: "A document of this program already has that title." };
        const id = K.id("doc");
        set("doc.made", madeDocs().concat([{ id, title: v.title, kind: v.from === "blank-policy" ? "policy" : "plan", by: ME, at: TODAY, state: "draft", text: "" }]));
        K.go("document--" + id); K.toast(`${v.title} created: revision 1, a draft`);
        return null;
      } });
  });
  K.on("k3d.doc.submit", (id) => { const d = madeDocs().find((x) => x.id === id); if (!d) return; const to = (d.state || "draft") === "review" ? "draft" : "review"; set("doc.made", madeDocs().map((x) => (x.id === id ? Object.assign({}, x, { state: to }) : x))); K.redraw(); K.toast(to === "review" ? `${d.title} submitted for review: it waits on its approver` : `${d.title} withdrawn from review: a draft again`); });
  K.on("k3d.doc.rm", (id) => { const d = madeDocs().find((x) => x.id === id); if (!d) return; K.confirm({ title: "Delete document", text: `${esc(d.title)} was written in this session and nothing cites it. It leaves the Documents list.`, submit: "Delete document", danger: true, onOk: () => { set("doc.made", madeDocs().filter((x) => x.id !== id)); if (cur() === "document--" + id) K.go("documents"); else K.redraw(); K.toast(`${d.title} deleted`); } }); });

  const rowMenu = (label, items) => { const l = items.filter(Boolean); return l.length ? `<span class="k3d-rowact">${K.menu("\u22ef", l, { sm: true, quiet: true, bare: true, aria: `More for ${label}` })}</span>` : ""; };
  function documentsPage() {
    fresh();
    const v = docView(), all = docs(), q = v.q.trim().toLowerCase();
    const inRail = all.filter((d) => !v.rail || d.kind === v.rail);
    const rows = inRail.filter((d) => (!v.chip || d.state === v.chip) && (!q || `${d.name} ${d.abbr} ${d.what} ${d.owner}`.toLowerCase().includes(q)));
    const n = (list, st) => list.filter((d) => d.state === st).length;
    const ph = wsx() ? placeholders().length : 0;
    const kinds = Object.keys(DKIND).filter((k) => all.some((d) => d.kind === k) || k === "plan" || k === "policy");
    const att = K.attention({ rows: [
      wsx() ? { label: "Placeholder narratives in the system security plan", n: ph, act: "k3d.doc.ph" } : null,
      { label: "Changes requested", n: n(all, "changes"), tone: "bad", act: "k3d.doc.att", arg: ["", "changes"] },
      { label: "In review, waiting on an approver", n: n(all, "review"), act: "k3d.doc.att", arg: ["", "review"] },
      { label: "Policies not started", n: all.filter((d) => d.kind === "policy" && d.state === "none").length, act: "k3d.doc.att", arg: ["policy", "none"] },
      all.some((d) => d.kind === "agreement") ? { label: "Agreements expired", n: all.filter((d) => d.kind === "agreement" && d.state === "expired").length, tone: "bad", act: "k3d.doc.att", arg: ["agreement", "expired"] } : null].filter(Boolean) });
    const chips = K.chips([{ id: "", label: "All", count: inRail.length, on: !v.chip }].concat(Object.keys(DSTATE).filter((k) => n(inRail, k) || v.chip === k).map((k) => ({ id: k, label: DSTATE[k][0], count: n(inRail, k), on: v.chip === k }))), "k3d.doc.chip", "State");
    const table = K.table({ label: "Documents", cls: "k3d-docs",
      cols: [{ label: "Document" }, { label: "Revision", cls: "nw" }, { label: "State", cls: "nw" }, { label: "Owner" }, { label: "Editing now", cls: "nw" }, { label: "Last edited", cls: "nw" }, { label: "", cls: "tight" }],
      rows: rows.map((d) => ({ go: d.route || undefined, panel: d.route ? undefined : (d.panel || [])[0], id: d.route ? undefined : (d.panel || [])[1], cls: "k3d-doc", cells: [K.name(d.name, d.what), d.rev ? `<span class="num">${esc(d.rev)}</span>` : none("No revision"), K.status(d.stateWord || DSTATE[d.state][0], DSTATE[d.state][1]), d.owner ? K.owner(d.owner) : none("No owner"), d.editing ? `<span class="k3d-eds">${d.editing}</span>` : none("Nobody"), d.edited ? `<span class="num">${esc(d.edited)}</span>` : none(), rowMenu(d.name, d.menu || [])] })),
      empty: all.length ? { title: "No document matches", line: "Clear the search or choose another state.", action: K.btn("Show every document", { sm: true, act: "k3d.doc.att", arg: ["", ""] }) } : { title: "No documents yet", line: "Start the program's first plan or policy.", action: K.btn("New document", { sm: true, primary: true, act: "k3d.doc.new" }) },
      foot: `<span class="num">${fmt(rows.length)} of ${plural(all.length, "document")}</span>` });
    return K.page({ cls: "k3d",
      head: K.head({ title: "Documents", actions: K.menu("More", [{ label: "Export the list", act: "k3d.export", arg: "The documents list" }, wsx() && has("ssp-history") ? { label: "Published revisions of the SSP", act: "k3d.go", arg: "ssp-history" } : null]) + K.btn("New document", { primary: true, act: "k3d.doc.new" }) }),
      body: K.split(
        K.rail({ title: "Documents", act: "k3d.doc.rail", items: [{ id: "", label: "All documents", count: all.length, on: !v.rail }].concat(kinds.map((k) => ({ id: k, label: DKIND[k], count: all.filter((d) => d.kind === k).length, on: v.rail === k }))) }),
        [all.length ? K.cards(att) : "", chips, K.toolbar({ search: { act: "k3d.doc.q", value: v.q, placeholder: "Search documents" } }), table]) });
  }
  K.screen("documents", documentsPage, "documents");
  V3.compareAs("documents", "ssps");
  V3.redirect(/^ssps(-|$)/, (r) => { if (r === "ssps-review") K.set("doc.view", { rail: "", chip: "review", q: "" }); else if (r === "ssps-published") K.set("doc.view", { rail: "", chip: "approved", q: "" }); return "documents"; });
  V3.redirect("policies", () => { K.set("doc.view", { rail: "policy", chip: "", q: "" }); return "documents"; });

  // Clicks inside a row's own actions never open the row.
  document.addEventListener("click", (e) => { if (!on()) return; const t = e.target; if (t && t.closest && t.closest(".k3d-rowact")) e.stopPropagation(); }, true);


  // ════════════════ The registers' records ════════════════
  // WS-X90: the workbook's own records (PA.sctm, which lane X widened to the full registers: 640 requirements, 368 artifacts),
  // read again after anything the chain changed, then what the reader created, mapped, allocated, linked and reviewed.
  let RDIRTY = true, BUILDING = false; // BUILDING: the workbook is reading its records; the facts answer as before meanwhile
  V.on((path) => { if (path === "*" || /^(chain|reqx|sctm|v3\.[FRX])\./.test(String(path))) RDIRTY = true; });
  window.addEventListener("v3change", () => { RDIRTY = true; });
  function R0() {
    const sx = PA.sctm, st = sx && sx.state; if (!sx || !st || typeof sx.build !== "function") return null;
    const open = !!document.getElementById("sx-app"); // the workbook is on screen: its records are as fresh as they get
    if (BUILDING) return st.R || null;
    if (!st.R || (!open && (RDIRTY || !st.R.__v3x))) { BUILDING = true; RDIRTY = false; try { sx.build(); } catch (e) { console.error("k3d: the workbook's records", e); } finally { BUILDING = false; } MEMO = {}; /* nothing derived while it was reading stands */ }
    return st.R || null;
  }
  const EVKINDS = ["Document", "Test record", "Dataset", "Scan result"];
  const EVKW = { Document: "Documents", "Test record": "Test records", Dataset: "Datasets", "Scan result": "Scan results" };
  const kindOf = (k) => (k === "Scan" ? "Scan result" : EVKINDS.indexOf(k) >= 0 ? k : "Document");
  const REVW = { pending: ["Waiting on review", "none"], accepted: ["Accepted", "ok"], revise: ["To revise", "bad"] };
  const TYPES = ["Enforcement", "Verification", "Configuration", "Monitoring"];
  const cleanSt = (s) => String(s || "").replace(/\s*This is fictional example language[^.]*\.\s*$/, "");
  const kdata = (p, d) => { const v = K.get(p, d); return v == null ? d : v; }; // another lane's kit data, read as it documents it
  const kPairHas = (p, a, b) => kdata(p, []).some((x) => x[0] === a && x[1] === b);
  const kPairAdd = (p, a, b) => { if (!kPairHas(p, a, b)) K.set(p, kdata(p, []).concat([[a, b]])); };
  const kPairDrop = (p, a, b) => { if (kPairHas(p, a, b)) K.set(p, kdata(p, []).filter((x) => !(x[0] === a && x[1] === b))); };
  const blankReq = (o) => Object.assign({ code: "", title: "", statement: "", type: "", ctl: new Set(), els: new Set(), ev: new Set(), owner: "" }, o);

  function model() {
    return memo("model", () => {
      const reqs = new Map(), arts = new Map();
      const add = (r) => { if (!reqs.has(r.code)) reqs.set(r.code, blankReq(r)); return reqs.get(r.code); };
      if (wsx()) {
        const R = R0();
        if (R) {
          for (const e of R.ev) arts.set(e.id, { id: e.id, title: e.title, kind: kindOf(e.kind), owner: e.owner || "", collected: e.collected || "", state: e.state === "needs_revision" ? "revise" : e.state === "pending" ? "pending" : "accepted", reviewed: e.reviewed || "", reviewer: "", reqs: [], base: true });
          for (const q of R.reqs.values()) {
            const info = PA.v2reqs && PA.v2reqs.info ? PA.v2reqs.info(q.code) : null;
            add({ code: q.code, title: q.t || (info && info.title) || q.code, statement: cleanSt(q.st || (info && (info.statement || info.note))), type: q.kind || (/(Enforcement|Verification|Configuration|Monitoring) Requirement/.exec(q.t || "") || [])[1] || "", ctl: new Set(q.ctl), els: new Set(q.els.length ? q.els : (info && info.els) || []), ev: new Set((R.evByReq.get(q.code) || []).map((e) => e.id)), review: !!(info && info.review), base: true });
          }
        }
        for (const m of get("req.made", [])) add({ code: m.code, title: m.title, statement: m.statement || "", type: m.type || "", made: "the Requirements register", mine: true, by: m.by, at: m.at, owner: m.by || "" });
        // Created from a control's panel (lane C) and from a component (lane S).
        for (const m of kdata("ctl.madeReqs", [])) if (m && m.id) { const r = add({ code: m.id, title: m.title || m.id, statement: m.st || "", made: "a control's panel", by: m.by, at: m.at, owner: m.by || "" }); for (const c of m.els || []) r.els.add(c); }
        for (const m of kdata("sys.reqs", [])) if (m && m.code) add({ code: m.code, title: m.title || m.code, statement: m.statement || "", made: "a component's page", by: m.by, at: m.at, owner: m.by || "" });
      } else {
        const code = V3.prog(), P = PA.v3p, recs = (k) => (P && P.recs ? P.recs(code, k) : V.get(`v3.P.${code}.${k}`)) || [];
        for (const e of recs("ev")) arts.set(e.id, { id: e.id, title: e.title || e.id, kind: /scan/i.test(e.kind || "") ? "Scan result" : /test/i.test(e.kind || "") ? "Test record" : /config|export/i.test(e.kind || "") ? "Dataset" : "Document", owner: e.by || "", collected: e.at || "", state: "pending", reviewed: "", reqs: [], p: true, file: e.file || "" });
        for (const q of recs("req")) add({ code: q.id, title: q.title || q.id, statement: q.text || "", ctl: new Set(q.ctl || []), ev: new Set(recs("ev").filter((e) => e.req === q.id).map((e) => e.id)), owner: q.owner || "", p: true, by: q.by, at: q.at });
      }
      if (!wsx()) for (const m of get("req.made", [])) add({ code: m.code, title: m.title, statement: m.statement || "", type: m.type || "", made: "the Requirements register", mine: true, by: m.by, at: m.at, owner: m.by || "" });
      for (const m of get("evd.made", [])) arts.set(m.id, { id: m.id, title: m.title, kind: kindOf(m.kind), owner: m.owner || m.by || "", collected: m.collected || m.at, state: "pending", reviewed: "", reqs: [], made: true, file: m.file || "", renew: m.renew || "" });
      if (wsx()) {
        // Mappings and allocations made or removed today, where the control's panel and the component's page keep them.
        for (const [c, list] of Object.entries(kdata("ctl.reqs", {}))) for (const x of list || []) { const r = reqs.get(x && x.id); if (r) r.ctl.add(c); }
        for (const [a, b] of kdata("sys.maps", [])) { const r = reqs.get(a); if (r) r.ctl.add(b); }
        if (CH && CH.touched && CH.st) for (const c of CH.touched()) { const s = CH.st(c) || {}; const r = s.req ? reqs.get(s.req) : null; if (r) r.ctl.add(c); }
        for (const [c, list] of Object.entries(kdata("ctl.unmap", {}))) for (const id of list || []) { const r = reqs.get(id); if (r) r.ctl.delete(c); }
        for (const [a, b] of kdata("sys.mapsRm", [])) { const r = reqs.get(a); if (r) r.ctl.delete(b); }
        for (const [comp, q] of kdata("sys.alloc", [])) { const r = reqs.get(q); if (r) r.els.add(comp); }
        for (const [comp, q] of kdata("sys.unalloc", [])) { const r = reqs.get(q); if (r) r.els.delete(comp); }
        for (const [c, list] of Object.entries(kdata("ctl.ev", {}))) for (const x of list || []) { const r = x && reqs.get(x.req); if (!r) continue; const a = x.id && arts.has(x.id) ? arts.get(x.id) : [...arts.values()].find((y) => y.title === x.title); if (a) r.ev.add(a.id); }
      }
      for (const [q, id] of get("req.evl", [])) { const r = reqs.get(q); if (r && arts.has(id)) r.ev.add(id); }
      for (const [q, id] of get("req.evRm", [])) { const r = reqs.get(q); if (r) r.ev.delete(id); }
      const edits = get("req.edits", {}), own = get("req.own", {});
      for (const r of reqs.values()) { const e = edits[r.code]; if (e) { if (e.title != null) r.title = e.title; if (e.statement != null) r.statement = e.statement; } if (own[r.code] !== undefined) r.owner = own[r.code] || ""; }
      const stt = get("evd.state", {}), renew = get("evd.renew", {}), vers = get("evd.vers", {});
      for (const a of arts.values()) { const s = stt[a.id]; if (s) { a.state = s.state; a.reviewed = s.at; a.reviewer = s.by; a.note = s.note || ""; } if (renew[a.id] !== undefined) a.renew = renew[a.id]; a.vers = vers[a.id] || []; }
      for (const r of reqs.values()) for (const id of r.ev) { const a = arts.get(id); if (a) a.reqs.push(r.code); else r.ev.delete(id); }
      return { reqs, arts };
    });
  }
  // A record's page when the kit gives its kind one (K.recRoute); a row of a related list is then the kit's own row (a click:
  // the page; the eye: the preview), else a kit action that opens the old preview.
  const recRoute = (kind, id) => (typeof K.recRoute === "function" ? K.recRoute(kind, id) || "" : "");
  const rowOpen = (kind, id) => (recRoute(kind, id) ? { panel: kind, id } : { act: "k3d.open", arg: [kind, id] });
  const req = (code) => model().reqs.get(code) || null;
  const art = (id) => model().arts.get(id) || null;
  const reqList = () => memo("reqList", () => { const l = [...model().reqs.values()], made = l.filter((r) => r.made).sort((a, b) => natural(b.code, a.code)), base = l.filter((r) => !r.made).sort((a, b) => natural(a.code, b.code)); return made.concat(base); });
  const artList = () => memo("artList", () => { const l = [...model().arts.values()], rank = { pending: 0, revise: 1, accepted: 2 }; return l.sort((a, b) => (a.made ? 0 : 1) - (b.made ? 0 : 1) || rank[a.state] - rank[b.state] || String(b.collected).localeCompare(String(a.collected)) || natural(a.title, b.title)); });
  const expiring = (a) => !!a.renew && days(a.renew) <= 30;
  const reqState = (r) => {
    if (r.review) return ["Mapping to review", "none"];
    if (!r.ctl.size) return ["No control mapped", "none"];
    const evs = [...r.ev].map(art).filter(Boolean);
    if (!evs.length) return ["No evidence", "none"];
    if (evs.some((a) => a.state === "accepted")) return ["Supported", "ok"];
    return evs.some((a) => a.state === "pending") ? ["Evidence in review", "none"] : ["Evidence to revise", "bad"];
  };
  const nextReqCode = () => { let n = 643; for (const c of model().reqs.keys()) { const m = /^REQ-(\d+)$/.exec(c); if (m) n = Math.max(n, +m[1]); } return "REQ-" + (n + 1); };

  // ——— What the reader does to a requirement (WS-X90). A control mapped or unmapped is written where the control's panel keeps
  // it (kit data ctl.reqs / ctl.unmap and the control's walk); an allocation where the component's page keeps it (sys.alloc /
  // sys.unalloc), so the three places read one fact. ———
  const ctlMap = (name) => kdata("ctl." + name, {});
  const ctlPut = (name, key, list) => { const o = Object.assign({}, ctlMap(name)); if (!list || !list.length) delete o[key]; else o[key] = list; K.set("ctl." + name, o); };
  const chainSt = (c) => (CH && CH.st ? CH.st(c) || {} : {});
  const isMapped = (code, c) => { const r = req(code); return !!(r && r.ctl.has(c)); };
  function mapControl(code, c) {
    const r = req(code); if (!r || !ctlRec(c)) return false;
    const un = ctlMap("unmap")[c] || [];
    if (un.indexOf(code) >= 0) ctlPut("unmap", c, un.filter((x) => x !== code));
    kPairDrop("sys.mapsRm", code, c);
    if (!isMapped(code, c)) {
      const view = CH && CH.view ? CH.view(c) : null;
      if (CH && CH.put && !chainSt(c).req && view && view.status === "no_requirement") CH.put(c, { req: code, reqTitle: r.title, mapAt: TODAY });
      else ctlPut("reqs", c, (ctlMap("reqs")[c] || []).filter((x) => x.id !== code).concat([{ id: code, title: r.title }]));
      if (hasS()) kPairAdd("sys.maps", code, c);
    }
    moveEvidence(code);
    return true;
  }
  function unmapControl(code, c) {
    const s = chainSt(c);
    if (s.req === code && CH && CH.put) CH.put(c, { req: null, reqTitle: null, ev: null, evTitle: null, evReq: null });
    const mine = ctlMap("reqs")[c] || [];
    if (mine.some((x) => x.id === code)) ctlPut("reqs", c, mine.filter((x) => x.id !== code));
    kPairDrop("sys.maps", code, c);
    const rx = V.get("reqx.map", null) || [];
    if (rx.some((x) => x.req === code && x.ctl === c)) V.set("reqx.map", rx.filter((x) => !(x.req === code && x.ctl === c)));
    if (isMapped(code, c)) { ctlPut("unmap", c, (ctlMap("unmap")[c] || []).concat([code])); if (hasS()) kPairAdd("sys.mapsRm", code, c); }
    return true;
  }
  // A requirement that cites evidence moves the controls it maps past No evidence, as v2's Link evidence does.
  function moveEvidence(code) {
    const r = req(code); if (!r || !wsx() || !CH || !CH.put || !CH.view) return;
    const a = [...r.ev].map(art).filter(Boolean)[0]; if (!a) return;
    for (const c of r.ctl) { if (!chainSt(c).ev && CH.view(c).status === "no_evidence") CH.put(c, { ev: a.id, evTitle: a.title, evAt: TODAY, evReq: code }); }
  }
  function allocate(code, comp) {
    const r = req(code); if (!r) return false;
    kPairDrop("sys.unalloc", comp, code);
    if (!req(code).els.has(comp)) kPairAdd("sys.alloc", comp, code);
    return true;
  }
  function unallocate(code, comp) {
    kPairDrop("sys.alloc", comp, code);
    const r = req(code); if (r && r.els.has(comp)) kPairAdd("sys.unalloc", comp, code);
    return true;
  }
  function linkEvidence(code, id) { pairDrop("req.evRm", code, id); const r = req(code); if (r && !r.ev.has(id)) pairAdd("req.evl", code, id); moveEvidence(code); return true; }
  function unlinkEvidence(code, id) { pairDrop("req.evl", code, id); const r = req(code); if (r && r.ev.has(id)) pairAdd("req.evRm", code, id); return true; }
  function createRequirement(o) {
    const code = nextReqCode();
    set("req.made", get("req.made", []).concat([{ code, title: o.title, statement: o.statement || "", type: o.type || "", by: ME, at: TODAY }]));
    // Lane S lists the requirements it knows: one created here joins them, as one created on a component does.
    if (wsx() && hasS()) K.set("sys.reqs", kdata("sys.reqs", []).concat([{ code, title: o.title, statement: o.statement || "", by: ME, at: TODAY }]));
    for (const comp of o.components || []) allocate(code, comp);
    for (const c of o.controls || []) mapControl(code, c);
    return code;
  }
  const reqsOfControl = (c) => reqList().filter((r) => r.ctl.has(c)).map((r) => r.code);
  const reqsOfComponent = (comp) => reqList().filter((r) => r.els.has(comp)).map((r) => r.code);
  const plainReq = (r) => (r ? { code: r.code, id: r.code, title: r.title, statement: r.statement, st: r.statement, type: r.type, controls: [...r.ctl].sort(natural), ctl: [...r.ctl].sort(natural), components: [...r.els], els: [...r.els], evidence: [...r.ev], state: reqState(r)[0], owner: r.owner || null, made: r.made || null, by: r.by || null, at: r.at || null } : null);

  // ════════════════ Requirements ════════════════
  const reqView = () => Object.assign({ rail: "", chip: "", q: "", comp: "", fam: "", ctl: "", codes: null, note: "", page: 0 }, K.get("req.view", {}) || {});
  const reqSet = (ch) => K.set("req.view", Object.assign({}, reqView(), ch));
  const CHIPS = [["noctl", "No control mapped", (r) => !r.ctl.size], ["noev", "Cites no evidence", (r) => !r.ev.size], ["noalloc", "Not allocated", (r) => !r.els.size], ["review", "Mapping to review", (r) => !!r.review]];
  // The customer's requirements document, with the program's answers (the old Compliance tab's rows).
  const custDoc = () => memo("cust", () => {
    if (!wsx() || !S["requirements-compliance"]) return null;
    const pg = oldPage("requirements-compliance"), nm = txt(pg.querySelector(".v7p-doc-t b")); if (!nm) return null;
    const rows = [...pg.querySelectorAll("table tbody tr")].map((tr) => { const td = [...tr.children].map(txt); return { ref: td[0], title: td[1], answer: td[2] || "Unanswered", met: td[3], els: td[4], ver: td[5], ctl: td[6], panel: tr.getAttribute("data-panel"), id: tr.getAttribute("data-id") }; }).filter((r) => r.ref);
    return { code: nm.split("·")[0].trim(), name: (nm.split("·")[1] || nm).trim(), sub: txt(pg.querySelector(".v7p-doc-t .v7p-mu")), rows };
  });
  const ANSWERS = ["Compliant", "Partially compliant", "Non-compliant", "Unanswered", "Not applicable"];
  const ansTone = (a) => (/^Compliant/.test(a) ? "ok" : /Non-compliant/.test(a) ? "bad" : "none");
  const answerOf = (a) => (ANSWERS.find((x) => x.toLowerCase() === String(a).toLowerCase()) || (/—|^$/.test(a) ? "Unanswered" : a));
  const PAGE = 50;
  const pager = (act, page, total) => { const from = total ? page * PAGE + 1 : 0, to = Math.min(total, (page + 1) * PAGE); return `<span class="num">${fmt(from)}–${fmt(to)} of ${fmt(total)}</span>${total > PAGE ? `<span class="k3d-pg">${K.btn("Previous", { sm: true, quiet: true, act, arg: page - 1, disabled: page <= 0 ? "This is the first page" : "" })}${K.btn("Next", { sm: true, quiet: true, act, arg: page + 1, disabled: to >= total ? "This is the last page" : "" })}</span>` : ""}`; };

  K.on("k3d.req.rail", (id) => { reqSet({ rail: id || "", chip: "", page: 0, codes: null, note: "" }); K.redraw(); });
  K.on("k3d.req.chip", (id) => { reqSet({ chip: reqView().chip === id ? "" : id || "", page: 0 }); K.redraw(); });
  K.on("k3d.req.q", (v) => { reqSet({ q: v, page: 0 }); K.redraw(); });
  K.on("k3d.req.comp", (v) => { reqSet({ comp: v, page: 0 }); K.redraw(); });
  K.on("k3d.req.fam", (v) => { reqSet({ fam: v, page: 0 }); K.redraw(); });
  K.on("k3d.req.page", (n) => { reqSet({ page: Math.max(0, n) }); K.redraw(); const m = document.getElementById("main"); if (m) m.scrollTop = 0; });
  K.on("k3d.req.clear", () => { K.set("req.view", { rail: reqView().rail }); K.redraw(); });
  K.on("k3d.req.export", () => K.toast(`${plural(reqList().length, "requirement")} exported as CSV, with their controls, components and evidence`));

  const ctlCell = (r) => { const l = [...r.ctl].sort(natural); return l.length ? `<span class="num">${esc(l.slice(0, 2).join(", "))}</span>${l.length > 2 ? ` <span class="k3-muted num">+${l.length - 2}</span>` : ""}` : none("No control"); };
  const compCell = (r) => { const l = [...r.els]; return l.length ? `<span class="k3d-c1"><a class="k3-link" href="#${esc(compRoute(l[0]))}" title="${esc(compName(l[0]))} · ${esc(l[0])}">${esc(compName(l[0]))}</a>${l.length > 1 ? `<span class="k3-muted num" title="${esc(l.slice(1).map(compName).join(", "))}">+${l.length - 1}</span>` : ""}</span>` : none("Not allocated"); };
  // A question another page sent with the reader (PA.v2.go(route, { open, rows, note, filter: { qv } })) is answered here.
  const takeAsk = (route, apply) => { const ask = V.peek ? V.peek(route) : null; if (!ask) return; V.take(route); try { apply(ask); } catch (e) { console.error("k3d", e); } };
  function requirementsPage() {
    fresh();
    if (!wsx()) return requirementsMade();
    takeAsk("requirements", (ask) => {
      const ch = {}, qv = ask.filter && ask.filter.qv ? String(ask.filter.qv).toLowerCase() : "";
      if (ask.rows && ask.rows.length) Object.assign(ch, { codes: ask.rows.filter((x) => /^REQ-/.test(x)), note: ask.note || "", rail: "", chip: "", q: "", page: 0 });
      if (qv) Object.assign(ch, { chip: /no evidence/.test(qv) ? "noev" : /review/.test(qv) ? "review" : "", rail: /compliance/.test(qv) ? "cust" : "", page: 0 });
      if (Object.keys(ch).length) K.set("req.view", Object.assign({}, reqView(), ch));
      if (ask.open && ask.open.id) { const id = String(ask.open.id).split("|")[0], to = recRoute("k3d-req", id); setTimeout(() => { if (!req(id)) return; if (to) K.go(to); else K.openPanel("k3d-req", id); }, 60); }
    });
    const v = reqView(), all = reqList(), cd = custDoc(), q = v.q.trim().toLowerCase();
    const nCust = cd ? cd.rows.length : 0;
    const rail = K.rail({ title: "Requirements", act: "k3d.req.rail", items: [{ id: "", label: "All requirements", count: all.length + nCust, on: !v.rail }, { head: "Where they come from" }, { id: "eng", label: "Engineering requirements", count: all.length, on: v.rail === "eng" }, cd ? { id: "cust", label: cd.code, count: nCust, on: v.rail === "cust" } : null] });
    const head = K.head({ title: "Requirements", actions: K.menu("More", [PA.M["v7p-import"] ? { label: "Import requirements", act: "k3d.modal", arg: ["v7p-import", ""] } : null, { label: "Export requirements", act: "k3d.req.export" }, has("sctm") ? { label: "Open the workbook", act: "k3d.go", arg: "sctm" } : null]) + K.btn("Create requirement", { primary: true, act: "k3d.req.new" }) });
    if (v.rail === "cust" && cd) {
      const ans = (r) => answerOf(r.answer), inq = cd.rows.filter((r) => !q || `${r.ref} ${r.title} ${r.met} ${r.els}`.toLowerCase().includes(q));
      const rows = inq.filter((r) => !v.chip || ans(r) === v.chip);
      return K.page({ cls: "k3d", head, body: K.split(rail, [
        `<p class="k3-muted k3d-src"><b>${esc(cd.name)}</b> · ${esc(cd.sub)}</p>`,
        K.chips([{ id: "", label: "All", count: inq.length, on: !v.chip }].concat(ANSWERS.filter((a) => inq.some((r) => ans(r) === a) || v.chip === a).map((a) => ({ id: a, label: a, count: inq.filter((r) => ans(r) === a).length, on: v.chip === a }))), "k3d.req.chip", "The program's answer"),
        K.toolbar({ search: { act: "k3d.req.q", value: v.q, placeholder: "Search this document's requirements" } }),
        K.table({ label: `${cd.code} requirements`, cols: [{ label: "Requirement" }, { label: "Answer" }, { label: "Met by" }, { label: "Components" }, { label: "Verification" }, { label: "Controls", cls: "nw" }],
          rows: rows.map((r) => ({ panel: r.panel, id: r.id, cells: [K.name(r.title, "", r.ref), K.status(ans(r), ansTone(ans(r))), esc(r.met) || none(), esc(r.els) || none(), esc(r.ver) || none(), `<span class="num">${esc(r.ctl)}</span>`] })),
          empty: { title: "No requirement matches", line: "Clear the search or choose another answer.", action: K.btn("Show them all", { sm: true, act: "k3d.req.clear" }) }, foot: `<span class="num">${fmt(rows.length)} of ${plural(cd.rows.length, "requirement")}</span>` })]) });
    }
    const fams = (SSP.families || []).map((f) => [f.f, `${f.f} ${typeof f.t === "string" ? f.t : ""}`.trim()]);
    const codes = v.codes && v.codes.length ? new Set(v.codes) : null;
    const scoped = all.filter((r) => (!codes || codes.has(r.code)) && (!v.comp || r.els.has(v.comp)) && (!v.ctl || r.ctl.has(v.ctl)) && (!v.fam || [...r.ctl].some((c) => c.indexOf(v.fam + "-") === 0)) && (!q || `${r.code} ${r.title} ${r.statement} ${[...r.ctl].join(" ")} ${[...r.els].map(compName).join(" ")}`.toLowerCase().includes(q)));
    const chipFn = (CHIPS.find((c) => c[0] === v.chip) || [])[2];
    const eng = chipFn ? scoped.filter(chipFn) : scoped;
    const custAll = v.rail === "eng" || !cd || codes || v.comp || v.ctl || v.fam ? [] : cd.rows.filter((r) => !q || `${r.ref} ${r.title}`.toLowerCase().includes(q));
    const cust = chipFn ? [] : custAll;
    const total = eng.length + cust.length, page = Math.min(v.page, Math.max(0, Math.ceil(total / PAGE) - 1));
    const slice = eng.map((r) => ["e", r]).concat(cust.map((r) => ["c", r])).slice(page * PAGE, (page + 1) * PAGE);
    const compOpts = allComps().filter((c) => all.some((r) => r.els.has(c.code))).map((c) => [c.code, c.name]);
    const narrowed = !!(v.chip || q || v.comp || v.ctl || v.fam || codes);
    return K.page({ cls: "k3d", head, body: K.split(rail, [
      codes || v.ctl ? K.note(`${esc(v.note || (v.ctl ? `The requirements that map ${v.ctl}` : `${plural(codes.size, "requirement")} chosen elsewhere`))} · ${K.actLink("Show every requirement", "k3d.req.clear")}`) : "",
      K.chips([{ id: "", label: "All", count: scoped.length + custAll.length, on: !v.chip }].concat(CHIPS.filter((c) => scoped.some(c[2]) || v.chip === c[0]).map((c) => ({ id: c[0], label: c[1], count: scoped.filter(c[2]).length, on: v.chip === c[0] }))), "k3d.req.chip", "What a requirement lacks"),
      K.toolbar({ search: { act: "k3d.req.q", value: v.q, placeholder: "Search requirements" }, filters: [compOpts.length ? { label: "Component", value: v.comp, act: "k3d.req.comp", options: compOpts } : null, { label: "Control family", value: v.fam, act: "k3d.req.fam", options: fams }] }),
      K.table({ label: "Requirements", cls: "k3d-reqs", cols: [{ label: "Requirement" }, { label: "Controls", cls: "nw" }, { label: "Components" }, { label: "Evidence", cls: "nw" }, { label: "State" }, { label: "Owner" }],
        rows: slice.map(([k, r]) => (k === "e"
          ? { panel: "k3d-req", id: r.code, cells: [K.name(r.title, clip(r.statement, 120), r.code), ctlCell(r), compCell(r), r.ev.size ? `<span class="num">${fmt(r.ev.size)}</span>` : none("No evidence"), K.status(reqState(r)[0], reqState(r)[1]), r.owner ? K.owner(r.owner) : none("No owner")] }
          : { panel: r.panel, id: r.id, cells: [K.name(r.title, `${cd.code} · met by ${r.met || "nothing yet"}`, r.ref), `<span class="num">${esc(r.ctl)}</span>`, esc(r.els) || none(), none(), K.status(answerOf(r.answer), ansTone(answerOf(r.answer))), none()] })),
        empty: narrowed ? { title: "No requirement matches", line: "Clear the search and the filters to see them all.", action: K.btn("Show every requirement", { sm: true, act: "k3d.req.clear" }) } : { title: "No requirements yet", line: "Create each requirement the system must meet, then map the controls it answers.", action: K.btn("Create requirement", { sm: true, primary: true, act: "k3d.req.new" }) },
        foot: pager("k3d.req.page", page, total) })]) });
  }
  // A created program: its own requirements (lane P's records), with lane P's working Create requirement.
  function requirementsMade() {
    const all = reqList();
    const newBtn = (sm) => (PA.M["v3p-new"] ? `<button type="button" class="btn ink${sm ? " sm" : ""}" data-modal="v3p-new" data-id="req">Create requirement</button>` : "");
    return K.page({ cls: "k3d", head: K.head({ title: "Requirements", actions: newBtn() }), body: [
      K.table({ label: "Requirements", cols: [{ label: "Requirement" }, { label: "Controls", cls: "nw" }, { label: "Evidence", cls: "nw" }, { label: "State" }, { label: "Owner" }],
        rows: all.map((r) => ({ panel: "v3p-rec", id: `req|${r.code}`, cells: [K.name(r.title, clip(r.statement, 120), r.code), ctlCell(r), r.ev.size ? `<span class="num">${fmt(r.ev.size)}</span>` : none("No evidence"), K.status(reqState(r)[0], reqState(r)[1]), r.owner ? K.owner(r.owner) : none("No owner")] })),
        empty: { title: "No requirements yet", line: "Create each requirement the system must meet, then map it to the controls it answers.", action: newBtn(true) }, foot: all.length ? `<span class="num">${plural(all.length, "requirement")}</span>` : "" })] });
  }
  V3.S("requirements", (orig) => { ORIG.requirements = orig; return DEPTH ? orig() : requirementsPage(); });
  V3.redirect("requirements-compliance", () => { K.set("req.view", { rail: "cust" }); return "requirements"; });
  V3.redirect(/^(requirements-chain|requirements-objectives|traceability)(-|$)/, () => "requirements");
  // The old record address of a requirement: its page (the kit draws it from the panel), or Requirements with its panel open.
  V3.redirect(/^rec--v7p-req--/, (r) => { const id = r.replace(/^rec--v7p-req--/, ""), to = wsx() ? recRoute("k3d-req", id) : ""; if (to) return to; K.set("req.open", id); return "requirements"; });
  // PA.v2.go("requirements", { open: { kind: "v7p-req", id } }) and the old record address open the requirement's panel.
  window.addEventListener("hashchange", () => { if (!on() || cur() !== "requirements") return; const id = K.get("req.open", null); if (!id) return; K.set("req.open", null); setTimeout(() => { if (!req(id)) return; const to = recRoute("k3d-req", id); if (to) K.go(to); else K.openPanel("k3d-req", id); }, 60); });

  // ——— Create requirement ———
  K.on("k3d.req.new", (pre0) => {
    const o = pre0 || {};
    K.form({ title: "Create requirement", submit: "Create requirement", intro: "It joins the register, each component it is allocated to and the control it maps. More controls and components are added from its panel.",
      fields: [{ key: "title", label: "Title", required: true, placeholder: "What the system must do, in one line" },
        { key: "statement", label: "Statement", type: "textarea", rows: 3, required: true, placeholder: "The assigned component shall …" },
        { key: "type", label: "Type", type: "select", options: TYPES, half: true },
        { key: "ctl", label: "Maps control", half: true, placeholder: "A control of the baseline, as AC-2", value: o.ctl || "" },
        { key: "els", label: "Allocated to", type: "checks", value: o.comp ? [o.comp] : [], options: allComps().filter((c) => !allComps().some((x) => x.parent === c.code)).map((c) => [c.code, c.name]) }],
      onSubmit: (v) => {
        const c = v.ctl.toUpperCase().replace(/\s+/g, "");
        if (c && !ctlRec(c)) return { ctl: `${c} is not a control of the baseline.` };
        const code = createRequirement({ title: v.title, statement: v.statement, type: v.type, controls: c ? [c] : [], components: v.els || [] });
        K.set("req.view", { rail: reqView().rail === "cust" ? "" : reqView().rail });
        const to = recRoute("k3d-req", code); // the new requirement's own page: the work goes on there
        if (to) K.go(to); else { if (cur() !== "requirements") K.go("requirements"); else K.redraw(); setTimeout(() => K.openPanel("k3d-req", code), 80); }
        K.toast(`${code} created${c ? `, mapped to ${c}` : ""}${(v.els || []).length ? `, allocated to ${v.els.length === 1 ? compName(v.els[0]) : plural(v.els.length, "component")}` : ""}`);
        return null;
      } });
  });

  // ——— The requirement's panel: everything a person does to a requirement is done here ———
  const rowAct = (label, act, arg, title) => `<span class="k3d-rowact">${K.btn(label, { sm: true, quiet: true, act, arg, title })}</span>`;
  K.on("k3d.req.map", (code) => {
    const r = req(code); if (!r) return;
    K.pick({ title: `Map controls to ${code}`, multi: true, search: "Search the baseline's controls", submit: (n) => (n ? `Map ${plural(n, "control")}` : "Map controls"),
      items: (SSP.controls || []).map((c) => ({ id: c.c, code: c.c, title: c.t, group: famName(c.f), meta: ctlStatus(c.c), held: r.ctl.has(c.c) ? "Mapped" : "" })),
      onPick: (ids) => { ids.forEach((c) => mapControl(code, c)); K.redraw(); K.toast(`${ids.length === 1 ? ids[0] : plural(ids.length, "control")} mapped to ${code}${ids.length === 1 && ctlStatus(ids[0]) ? ` · ${ids[0]} reads ${ctlStatus(ids[0])}` : ""}`); } });
  });
  K.on("k3d.req.unmap", (a) => { const [code, c] = a, left = reqsOfControl(c).filter((x) => x !== code).length;
    K.confirm({ title: "Unmap control", submit: "Unmap control", danger: true, text: `${esc(code)} no longer maps ${esc(c)} ${esc((ctlRec(c) || {}).t || "")}. ${left ? `${esc(c)} keeps ${plural(left, "other requirement")}.` : `${esc(c)} is left with no requirement.`} The requirement stays in the register.`,
      onOk: () => { unmapControl(code, c); K.redraw(); K.toast(`${c} unmapped from ${code}`); } }); });
  K.on("k3d.req.alloc", (code) => {
    const r = req(code); if (!r) return;
    const comps = allComps(), nm = (c) => (c ? c.name : "");
    K.pick({ title: `Allocate ${code}`, multi: true, search: "Search the system's components", submit: (n) => (n ? `Allocate to ${plural(n, "component")}` : "Allocate"),
      items: comps.map((c) => ({ id: c.code, code: c.code, title: c.name, group: nm(comps.find((p) => p.code === c.parent)) || "The system", meta: c.kind || "", held: r.els.has(c.code) ? "Allocated" : "" })),
      onPick: (ids) => { ids.forEach((c) => allocate(code, c)); K.redraw(); K.toast(`${code} allocated to ${ids.length === 1 ? compName(ids[0]) : plural(ids.length, "component")}`); } });
  });
  K.on("k3d.req.unalloc", (a) => { const [code, comp] = a;
    K.confirm({ title: "Remove allocation", submit: "Remove allocation", danger: true, text: `${esc(code)} is no longer allocated to ${esc(compName(comp))} (${esc(comp)}). It leaves that component's requirements; the requirement, its controls and its evidence stay.`,
      onOk: () => { unallocate(code, comp); K.redraw(); K.toast(`${code} no longer allocated to ${compName(comp)}`); } }); });
  K.on("k3d.req.link", (code) => {
    const r = req(code); if (!r) return;
    K.pick({ title: `Link evidence to ${code}`, multi: true, search: `Search all ${fmt(artList().length)} evidence artifacts`, submit: (n) => (n ? `Link ${plural(n, "artifact")}` : "Link evidence"),
      create: { label: "Add evidence", onCreate: () => addEvidence({ req: code }) },
      items: artList().map((a) => ({ id: a.id, title: a.title, desc: `${a.kind}${a.collected ? ` · collected ${md(a.collected)}` : ""}${a.owner ? ` · ${a.owner}` : ""}`, meta: REVW[a.state][0], held: r.ev.has(a.id) ? "Linked" : "" })),
      onPick: (ids) => { ids.forEach((id) => linkEvidence(code, id)); K.redraw(); K.toast(`${plural(ids.length, "evidence artifact")} linked to ${code}`); } });
  });
  K.on("k3d.req.unlink", (a) => { const [code, id] = a, x = art(id);
    K.confirm({ title: "Unlink evidence", submit: "Unlink evidence", danger: true, text: `${esc(code)} no longer cites ${esc(x ? x.title : "this artifact")}. The artifact stays in the Evidence register${x && x.reqs.length > 1 ? `, cited by ${plural(x.reqs.length - 1, "other requirement")}` : ""}.`,
      onOk: () => { unlinkEvidence(code, id); K.redraw(); K.toast(`Evidence unlinked from ${code}`); } }); });
  K.on("k3d.req.owner", (code) => { const r = req(code); if (!r) return;
    K.form({ title: `Assign an owner to ${code}`, submit: "Assign owner", fields: [{ key: "owner", label: "Owner", type: "select", placeholder: "No owner", options: people(), value: r.owner || "" }],
      onSubmit: (v) => { set("req.own", Object.assign({}, get("req.own", {}), { [code]: v.owner || "" })); K.redraw(); K.toast(v.owner ? `${v.owner} owns ${code}` : `${code} has no owner`); return null; } }); });
  K.on("k3d.req.rename", (code) => { const r = req(code); if (!r) return;
    K.form({ title: `Edit ${code}`, submit: "Save requirement", fields: [{ key: "title", label: "Title", required: true, value: r.title }, { key: "statement", label: "Statement", type: "textarea", rows: 5, required: true, value: r.statement }],
      onSubmit: (v) => { set("req.edits", Object.assign({}, get("req.edits", {}), { [code]: { title: v.title, statement: v.statement } })); K.redraw(); K.toast(`${code} saved`); return null; } }); });
  K.on("k3d.req.rm", (code) => { const r = req(code); if (!r || !r.mine) return;
    K.confirm({ title: "Delete requirement", submit: "Delete requirement", danger: true, text: `${esc(code)} ${esc(r.title)} was created today. Deleting it removes it from the register${r.ctl.size ? `, from ${esc([...r.ctl].join(", "))}` : ""}${r.els.size ? ` and from ${plural(r.els.size, "component")}` : ""}.`,
      onOk: () => { for (const c of [...r.ctl]) unmapControl(code, c); for (const c of [...r.els]) unallocate(code, c); set("req.made", get("req.made", []).filter((x) => x.code !== code)); if (kdata("sys.reqs", []).some((x) => x.code === code)) K.set("sys.reqs", kdata("sys.reqs", []).filter((x) => x.code !== code)); K.redraw(); K.toast(`${code} deleted`); } }); });
  K.on("k3d.open", (a) => K.openPanel(a[0], a[1]));
  K.on("k3d.ev.go", (id) => { const to = recRoute("k3d-ev", id); if (to) K.go(to); else K.openPanel("k3d-ev", id); });
  // The statement is edited where it is read: saved when the reader leaves it.
  document.addEventListener("focusout", (e) => {
    if (!on()) return;
    const el = e.target && e.target.closest ? e.target.closest("[data-k3d-st]") : null; if (!el) return;
    const code = el.getAttribute("data-k3d-st"), r = req(code), t = el.innerText.replace(/\s+\n/g, "\n").trim(); if (!r || !t || t === r.statement) { if (r && !t) el.innerText = r.statement; return; }
    set("req.edits", Object.assign({}, get("req.edits", {}), { [code]: Object.assign({}, get("req.edits", {})[code] || {}, { statement: t }) }));
    const hint = el.parentElement && el.parentElement.querySelector(".k3d-saved"); if (hint) hint.textContent = "Saved to the requirement.";
  });
  // The requirement: a page (requirement--<code>, which the kit draws from this definition; rows of every list go there) and
  // the same record as a preview (the row's eye). The page has the room for wider tables and holds the one primary in its header.
  const cap = (s) => { s = String(s || ""); return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; };
  const famName = (f) => { const x = (SSP.families || []).find((y) => y.f === f) || {}; return typeof x.t === "string" && x.t ? x.t : f; };
  const famOf = (c) => { const r = ctlRec(c); return r ? famName(r.f) : ""; };
  function reqPanel(id0, opts) {
    if (!wsx()) return null; // a created program's requirement is lane P's record, worked in its own preview
    const page = !!(opts && opts.page);
    const code = String(id0 || "").split("@")[0].split("|")[0], r = req(code); if (!r) return null;
    const st = reqState(r), ctls = [...r.ctl].sort(natural), els = [...r.els], evs = [...r.ev].map(art).filter(Boolean);
    const pending = evs.find((a) => a.state === "pending");
    const next = !ctls.length ? K.next({ text: "No control is mapped: it answers nothing in the baseline yet.", action: K.btn("Map control", { sm: true, act: "k3d.req.map", arg: code }) })
      : !els.length ? K.next({ text: "It is allocated to no component: nobody builds it.", action: K.btn("Allocate", { sm: true, act: "k3d.req.alloc", arg: code }) })
      : !evs.length ? K.next({ text: `It cites no evidence: ${esc(ctls.slice(0, 2).join(" and "))} cannot be assessed on it.`, action: K.btn("Link evidence", { sm: true, act: "k3d.req.link", arg: code }) })
      : pending && !evs.some((a) => a.state === "accepted") ? K.next({ text: "Its evidence waits on a reviewer.", action: K.btn("Review the evidence", { sm: true, act: "k3d.ev.go", arg: pending.id }) }) : "";
    const f = PA.v2reqs && PA.v2reqs.follow && r.base ? PA.v2reqs.follow(code) || {} : {};
    const fol = [["Assessment findings", f.fnd], ["Operational issues", f.iss], ["Risks", f.rsk], ["Remediation", f.rem]].filter(([, l]) => l && l.length);
    const more = [page ? null : { label: "Edit title and statement", act: "k3d.req.rename", arg: code }, { label: r.owner ? "Change owner" : "Assign owner", act: "k3d.req.owner", arg: code }, r.mine ? { label: "Delete requirement", act: "k3d.req.rm", arg: code, danger: true } : null];
    const parent = (c) => { const x = compRec(c), p = x && x.parent ? compRec(x.parent) : null; return p ? p.name : ""; };
    return { label: "Requirement", title: r.title, code: r.code, chip: K.status(st[0], st[1]),
      actions: K.menu("More", more, { sm: !page }) + (page ? K.btn("Edit requirement", { primary: true, act: "k3d.req.rename", arg: code }) : ""),
      sub: page ? `${r.made ? `Created today on ${esc(r.made)}` : "Engineering requirement"}${r.type ? ` · ${esc(r.type)}` : ""}` : "",
      facts: [["Source", r.made ? `Engineering requirement, created today on ${esc(r.made)}` : "Engineering requirement"], r.type ? ["Type", esc(r.type)] : null, ["Owner", r.owner ? K.owner(r.owner) : K.actLink("Assign owner", "k3d.req.owner", code)],
        page ? ["Controls", `<span class="num">${fmt(ctls.length)}</span>`] : null, page ? ["Components", `<span class="num">${fmt(els.length)}</span>`] : null, page ? ["Evidence", evs.length ? `<span class="num">${fmt(evs.length)}</span> ${mu(`· ${fmt(evs.filter((a) => a.state === "accepted").length)} accepted`)}` : `<span class="num">0</span>`] : null],
      sections: [
        K.section({ title: "Statement", body: `<div class="k3d-st" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Statement of ${esc(code)}" spellcheck="false" data-k3d-st="${esc(code)}">${esc(r.statement)}</div><p class="k3-muted k3d-saved" role="status">Type here to change it: it saves when you leave the text.</p>` }),
        next,
        K.related({ title: "Controls", empty: "No control mapped", add: { label: "Map control", act: "k3d.req.map", arg: code }, cols: [{ label: "Control" }, page ? { label: "Family" } : null, { label: "Status", cls: "nw" }, { label: "", cls: "tight" }].filter(Boolean),
          rows: ctls.map((c) => Object.assign(rowOpen(ctlPanel(), c), { cells: [K.name((ctlRec(c) || {}).t || c, "", c), page ? esc(famOf(c)) : null, ctlStatus(c) ? esc(ctlStatus(c)) : none(), rowAct("Unmap", "k3d.req.unmap", [code, c], `Unmap ${c} from ${code}`)].filter((x) => x !== null) })) }),
        K.related({ title: "Components", empty: "Allocated to no component", add: { label: "Allocate", act: "k3d.req.alloc", arg: code }, cols: [{ label: "Component" }, { label: "Kind", cls: "nw" }, page ? { label: "Inside" } : null, { label: "", cls: "tight" }].filter(Boolean),
          rows: els.map((c) => Object.assign(hasS() ? { go: compRoute(c) } : {}, { cells: [hasS() ? K.name(compName(c), c) : `<span class="k3d-comp">${compLink(c)}</span>`, esc(cap((compRec(c) || {}).kind)), page ? esc(parent(c)) || none() : null, rowAct("Remove", "k3d.req.unalloc", [code, c], `Remove the allocation to ${compName(c)}`)].filter((x) => x !== null) })) }),
        K.related({ title: "Evidence", empty: "Cites no evidence", add: { label: "Link evidence", act: "k3d.req.link", arg: code }, cols: [{ label: "Artifact" }, page ? { label: "Kind", cls: "nw" } : null, { label: "Review", cls: "nw" }, page ? { label: "Collected", cls: "nw" } : null, { label: "", cls: "tight" }].filter(Boolean),
          rows: evs.map((a) => Object.assign(rowOpen("k3d-ev", a.id), { cells: [K.name(a.title, page ? (a.owner ? `Owner ${a.owner}` : "") : `${a.kind}${a.collected ? ` · collected ${md(a.collected)}` : ""}`), page ? esc(a.kind) : null, K.status(REVW[a.state][0], REVW[a.state][1]), page ? (a.collected ? `<span class="num">${esc(md(a.collected))}</span>` : none()) : null, rowAct("Unlink", "k3d.req.unlink", [code, a.id], `Unlink this artifact from ${code}`)].filter((x) => x !== null) })) }),
      ].concat(fol.map(([t, l]) => K.section({ title: t, count: l.length, body: `<ul class="k3d-fol">${l.map((x) => `<li>${x.p || x.panel ? `<button type="button" class="k3-link" data-panel="${esc(x.p || x.panel)}" data-id="${esc(x.id)}">${esc(x.title || x.label || x.id)}</button>` : esc(x.title || x.label || String(x.id || x))}${x.sub || x.meta ? ` <span class="k3-muted">${esc(x.sub || x.meta)}</span>` : ""}</li>`).join("")}</ul>` }))) };
  }
  K.panel("k3d-req", reqPanel);
  // Every place that opened the old requirement preview opens this panel (WS-X90; a created program keeps lane P's preview).
  V3.P("v7p-req", (orig, id) => { if (!wsx() || !req(String(id).split("|")[0])) return orig(); return PA.P["k3d-req"](id); });

  // ════════════════ Evidence ════════════════
  const evView = () => Object.assign({ rail: "", chip: "", q: "", owner: "", codes: null, note: "", page: 0 }, K.get("evd.view", {}) || {});
  const evSet = (ch) => K.set("evd.view", Object.assign({}, evView(), ch));
  const EVCHIPS = [["pending", "Waiting on review", (a) => a.state === "pending"], ["accepted", "Accepted", (a) => a.state === "accepted"], ["revise", "To revise", (a) => a.state === "revise"], ["expiring", "Expiring", expiring]];
  // STIG checklists are evidence of a kind: the old register's rows, each opening the checklist's own page.
  const stigs = () => memo("stigs", () => (wsx() && S.stigs ? oldRows("stigs").map((tr) => { const td = [...tr.children].map(txt), id = tr.getAttribute("data-id"); return { id, asset: td[0], stig: td[1], source: td[2], last: td[3], cat: td[4], notrev: td[5], comp: td[6], route: has("stigs-" + id) ? "stigs-" + id : null, panel: tr.getAttribute("data-panel") }; }).filter((x) => x.id) : []));
  const sources = () => memo("sources", () => (ORIG["evidence-sources"] || S["evidence-sources"] ? oldRows("evidence-sources").map((tr) => ({ panel: tr.getAttribute("data-panel"), id: tr.getAttribute("data-id"), td: [...tr.children].map((c) => ({ t: txt(c), h: c.innerHTML })) })).filter((x) => x.td.length > 3) : []));

  K.on("k3d.ev.rail", (id) => { evSet({ rail: id || "", chip: "", page: 0, codes: null, note: "" }); K.redraw(); });
  K.on("k3d.ev.chip", (id) => { evSet({ chip: evView().chip === id ? "" : id || "", page: 0 }); K.redraw(); });
  K.on("k3d.ev.q", (v) => { evSet({ q: v, page: 0 }); K.redraw(); });
  K.on("k3d.ev.owner", (v) => { evSet({ owner: v, page: 0 }); K.redraw(); });
  K.on("k3d.ev.page", (n) => { evSet({ page: Math.max(0, n) }); K.redraw(); const m = document.getElementById("main"); if (m) m.scrollTop = 0; });
  K.on("k3d.ev.clear", () => { K.set("evd.view", { rail: evView().rail }); K.redraw(); });
  K.on("k3d.ev.export", () => K.toast(`${plural(artList().length, "evidence artifact")} exported as CSV, with their reviews and the requirements that cite them`));
  K.on("k3d.stig", (id) => { const s = stigs().find((x) => x.id === id); if (!s) return; if (s.route) K.go(s.route); else if (s.panel) K.openPanel(s.panel, id); });

  const evTabs = (onTab) => K.tabs([{ label: "Evidence", count: artList().length, route: "evidence", on: onTab === "ev" }, wsx() && (ORIG["evidence-sources"] || S["evidence-sources"]) ? { label: "Sources", count: sources().length, route: "evidence-sources", on: onTab === "src" } : null], "Evidence");
  const evHead = (primary, stig) => K.head({ title: "Evidence", actions: K.menu("More", [{ label: "Export evidence", act: "k3d.ev.export" }, PA.M["a-docs-request"] ? { label: "Request evidence from an owner", act: "k3d.modal", arg: ["a-docs-request", ""] } : null]
    .concat(stig ? [has("stigs-open") ? { label: "Open STIG rules, across the checklists", act: "k3d.go", arg: "stigs-open" } : null, has("stigs-benchmarks") ? { label: "STIG benchmarks and their releases", act: "k3d.go", arg: "stigs-benchmarks" } : null, has("stigs-imports") ? { label: "Checklist imports", act: "k3d.go", arg: "stigs-imports" } : null] : [])) + primary });
  function evidencePage() {
    fresh();
    if (!wsx()) return evidenceMade();
    takeAsk("evidence", (ask) => {
      const qv = ask.filter && ask.filter.qv ? String(ask.filter.qv).toLowerCase() : "";
      if (qv) K.set("evd.view", Object.assign({}, evView(), { rail: "", page: 0, chip: /pending|waiting/.test(qv) ? "pending" : /revis/.test(qv) ? "revise" : /accept/.test(qv) ? "accepted" : "" }));
      if (ask.open && ask.open.id) { const id = String(ask.open.id).split("|")[0]; setTimeout(() => { if (art(id)) K.openPanel("k3d-ev", id); }, 90); }
    });
    const v = evView(), all = artList(), q = v.q.trim().toLowerCase(), ck = stigs();
    const rail = K.rail({ title: "Evidence", act: "k3d.ev.rail", items: [{ id: "", label: "All evidence", count: all.length, on: !v.rail }].concat(EVKINDS.map((k) => ({ id: k, label: EVKW[k], count: all.filter((a) => a.kind === k).length, on: v.rail === k })), ck.length ? [{ head: "Checklists" }, { id: "stig", label: "STIG checklists", count: ck.length, on: v.rail === "stig" }] : []) });
    const head = evHead(K.btn("Add evidence", { primary: true, act: "k3d.ev.new" }), v.rail === "stig");
    if (v.rail === "stig") {
      const rows = ck.filter((s) => !q || `${s.asset} ${s.stig} ${s.source}`.toLowerCase().includes(q));
      return K.page({ cls: "k3d", head, tabs: evTabs("ev"), body: K.split(rail, [
        K.toolbar({ search: { act: "k3d.ev.q", value: v.q, placeholder: "Search checklists" }, right: PA.M["v8g-import"] ? `<button type="button" class="btn sm" data-modal="v8g-import">Import a checklist</button>` : "" }),
        K.table({ label: "STIG checklists", cols: [{ label: "Checklist" }, { label: "Source" }, { label: "Last import" }, { label: "Open by CAT I·II·III", cls: "nw" }, { label: "Not reviewed", cls: "nw" }, { label: "Compliance", cls: "nw" }],
          rows: rows.map((s) => Object.assign(s.route ? { go: s.route } : { act: "k3d.stig", arg: s.id }, { cells: [K.name(s.stig, `On ${s.asset}`), esc(s.source), esc(s.last), `<span class="num">${esc(s.cat)}</span>`, `<span class="num">${esc(s.notrev)}</span>`, `<span class="num">${esc(s.comp)}</span>`] })),
          empty: { title: "No checklist matches", line: "Clear the search to see them all." }, foot: `<span class="num">${fmt(rows.length)} of ${plural(ck.length, "checklist")}</span>` })]) });
    }
    const codes = v.codes && v.codes.length ? new Set(v.codes) : null;
    const scoped = all.filter((a) => (!v.rail || a.kind === v.rail) && (!codes || codes.has(a.id)) && (!v.owner || a.owner === v.owner) && (!q || `${a.title} ${a.kind} ${a.owner} ${a.reqs.join(" ")}`.toLowerCase().includes(q)));
    const chipFn = (EVCHIPS.find((c) => c[0] === v.chip) || [])[2];
    const rows = chipFn ? scoped.filter(chipFn) : scoped;
    const page = Math.min(v.page, Math.max(0, Math.ceil(rows.length / PAGE) - 1));
    const owners = uniq(all.map((a) => a.owner)).sort();
    const shows = (a) => { const r = a.reqs.length ? req(a.reqs[0]) : null; return r ? `Supports ${a.reqs[0]} ${clip(r.title, 80)}` : "Cited by no requirement yet"; };
    return K.page({ cls: "k3d", head, tabs: evTabs("ev"), body: K.split(rail, [
      codes ? K.note(`${esc(v.note || `${plural(codes.size, "artifact")} chosen elsewhere`)} · ${K.actLink("Show all evidence", "k3d.ev.clear")}`) : "",
      K.chips([{ id: "", label: "All", count: scoped.length, on: !v.chip }].concat(EVCHIPS.filter((c) => scoped.some(c[2]) || v.chip === c[0]).map((c) => ({ id: c[0], label: c[1], count: scoped.filter(c[2]).length, on: v.chip === c[0] }))), "k3d.ev.chip", "Review"),
      K.toolbar({ search: { act: "k3d.ev.q", value: v.q, placeholder: "Search evidence" }, filters: [{ label: "Owner", value: v.owner, act: "k3d.ev.owner", options: owners.map((o) => [o, o]) }] }),
      K.table({ label: "Evidence", cls: "k3d-evs", cols: [{ label: "Evidence" }, { label: "Kind", cls: "nw" }, { label: "Review" }, { label: "Cited by", cls: "nw" }, { label: "Collected", cls: "nw" }, { label: "Renew by", cls: "nw" }, { label: "Owner" }],
        rows: rows.slice(page * PAGE, (page + 1) * PAGE).map((a) => ({ panel: "k3d-ev", id: a.id, cells: [K.name(a.title, shows(a)), esc(a.kind), K.status(REVW[a.state][0], REVW[a.state][1]), a.reqs.length ? `<span class="num">${esc(a.reqs.slice(0, 1).join(""))}</span>${a.reqs.length > 1 ? ` <span class="k3-muted num">+${a.reqs.length - 1}</span>` : ""}` : none("No requirement"), a.collected ? `<span class="num">${esc(md(a.collected))}</span>` : none(), a.renew ? `<span class="num${expiring(a) ? " k3d-due" : ""}">${esc(md(a.renew))}</span>` : none("Not set"), a.owner ? K.owner(a.owner) : none("No owner")] })),
        empty: v.chip || q || v.owner || codes ? { title: "No evidence matches", line: "Clear the search and the filters to see it all.", action: K.btn("Show all evidence", { sm: true, act: "k3d.ev.clear" }) } : { title: "No evidence of this kind yet", line: "Add the first artifact; a requirement cites it from its panel.", action: K.btn("Add evidence", { sm: true, primary: true, act: "k3d.ev.new" }) },
        foot: pager("k3d.ev.page", page, rows.length) })]) });
  }
  function evidenceMade() {
    const all = artList(), canAdd = reqList().length > 0 && PA.M["v3p-new"];
    const add = (sm) => (canAdd ? `<button type="button" class="btn ink${sm ? " sm" : ""}" data-modal="v3p-new" data-id="ev">Add evidence</button>` : `<a class="btn${sm ? " sm" : ""}" href="#requirements">Open requirements</a>`);
    return K.page({ cls: "k3d", head: K.head({ title: "Evidence", actions: all.length || canAdd ? add() : "" }), body: [
      K.table({ label: "Evidence", cols: [{ label: "Evidence" }, { label: "Kind" }, { label: "Review" }, { label: "Cited by", cls: "nw" }, { label: "Collected", cls: "nw" }],
        rows: all.map((a) => ({ panel: a.p ? "v3p-rec" : "k3d-ev", id: a.p ? `ev|${a.id}` : a.id, cells: [K.name(a.title, a.file || ""), esc(a.kind), K.status(REVW[a.state][0], REVW[a.state][1]), a.reqs.length ? `<span class="num">${esc(a.reqs.join(", "))}</span>` : none(), a.collected ? `<span class="num">${esc(md(a.collected))}</span>` : none()] })),
        empty: { title: "No evidence yet", line: canAdd ? "Add evidence against a requirement: it moves the controls that requirement maps to Not assessed." : "Evidence is added against a requirement: create a requirement first.", action: add(true) }, foot: all.length ? `<span class="num">${plural(all.length, "artifact")}</span>` : "" })] });
  }
  V3.S("evidence", (orig) => { ORIG.evidence = orig; return DEPTH ? orig() : evidencePage(); });
  // Sources: the integrations that collect evidence (lane W's rows and panel), in this page's shape.
  if (S["evidence-sources"]) V3.S("evidence-sources", (orig) => {
    ORIG["evidence-sources"] = orig;
    if (DEPTH || !wsx()) return orig();
    fresh();
    const src = sources(), heads = [...oldPage("evidence-sources").querySelectorAll("table thead th")].map(txt);
    return K.page({ cls: "k3d", head: evHead(PA.M["plat-add-source"] ? `<button type="button" class="btn ink" data-modal="plat-add-source">Add source</button>` : ""), tabs: evTabs("src"),
      body: [K.table({ label: "Evidence sources", cols: heads.map((t) => ({ label: t, cls: /^(Kind|Cadence|State|Owner)$/.test(t) ? "nw" : "" })), rows: src.map((s) => ({ panel: s.panel, id: s.id, cells: s.td.map((c, i) => (i === 0 ? K.name(c.t) : c.h)) })), empty: { title: "No source collects evidence yet", line: "Connect a scanner or a checklist tool and its results arrive here as evidence." }, foot: `<span class="num">${plural(src.length, "source")}</span>` })] });
  });
  V3.redirect("stigs", () => { K.set("evd.view", { rail: "stig" }); return "evidence"; });
  V3.compareAs("evidence", "evidence");

  // ——— Add evidence ———
  function addEvidence(o) {
    const pre0 = o || {};
    K.form({ title: "Add evidence", submit: "Add evidence", intro: pre0.req ? `It is added to the register and linked to ${esc(pre0.req)}; it waits on a reviewer.` : "It joins the register and waits on a reviewer. A requirement cites it from its panel, or name one here.",
      fields: [{ key: "title", label: "Title", required: true, placeholder: "What the file shows" },
        { key: "kind", label: "Kind", type: "select", required: true, options: EVKINDS, value: "Document", half: true },
        { key: "file", label: "File name", half: true, placeholder: "report.pdf", hint: "The prototype keeps the name, not the file." },
        { key: "collected", label: "Collected", type: "date", value: TODAY, half: true },
        { key: "renew", label: "Renew by", type: "date", half: true },
        pre0.req ? null : { key: "req", label: "Cited by requirement", placeholder: "REQ-248", hint: "Optional. More are linked from the artifact's panel." }].filter(Boolean),
      onSubmit: (v) => {
        const rq = pre0.req || (v.req || "").toUpperCase().replace(/\s+/g, "");
        if (rq && !req(rq)) return { req: `${rq} is not a requirement of this program.` };
        if (artList().some((a) => a.title.toLowerCase() === v.title.toLowerCase())) return { title: "An artifact of this program already has that title." };
        const id = K.id("ev");
        set("evd.made", get("evd.made", []).concat([{ id, title: v.title, kind: v.kind, file: v.file || "", owner: ME, collected: v.collected || TODAY, renew: v.renew || "", by: ME, at: TODAY }]));
        if (rq) linkEvidence(rq, id);
        if (!pre0.req && cur() === "evidence") K.set("evd.view", { rail: "" });
        K.redraw(); K.toast(`${v.title} added${rq ? ` and linked to ${rq}` : ""}: it waits on a reviewer`);
        return null;
      } });
  }
  K.on("k3d.ev.new", () => addEvidence());

  // ——— The artifact's panel: its review is done here ———
  const setState = (id, state, note) => set("evd.state", Object.assign({}, get("evd.state", {}), { [id]: { state, at: TODAY, by: ME, note: note || "" } }));
  const follows = (a) => { const l = a.reqs.map(req).filter(Boolean).slice(0, 2).map((r) => `${r.code} reads ${reqState(r)[0]}`); return l.length ? " · " + l.join(", ") : ""; };
  K.on("k3d.ev.accept", (id) => { const a = art(id); if (!a) return; setState(id, "accepted"); K.redraw(); const b = art(id); K.toast(`${clip(a.title, 60)} accepted · ${plural(artList().filter((x) => x.state === "pending").length, "artifact")} still wait on review${follows(b)}`); });
  K.on("k3d.ev.revise", (id) => { const a = art(id); if (!a) return;
    K.form({ title: "Request changes", submit: "Request changes", intro: `${esc(clip(a.title, 90))} goes back to ${esc(a.owner || "its owner")} to revise.`, fields: [{ key: "note", label: "What needs to change", type: "textarea", rows: 3, required: true }],
      onSubmit: (v) => { setState(id, "revise", v.note); K.redraw(); K.toast(`Changes requested from ${a.owner || "the owner"}`); return null; } }); });
  K.on("k3d.ev.reopen", (id) => { const a = art(id); if (!a) return; setState(id, "pending"); K.redraw(); K.toast(`${clip(a.title, 60)} waits on review again`); });
  K.on("k3d.ev.version", (id) => { const a = art(id); if (!a) return;
    K.form({ title: "Add a version", submit: "Add version", intro: "The new version replaces the one under review and waits on a reviewer.", fields: [{ key: "file", label: "File name", required: true, placeholder: "report-v2.pdf" }, { key: "note", label: "What changed", type: "textarea", rows: 2 }],
      onSubmit: (v) => { set("evd.vers", Object.assign({}, get("evd.vers", {}), { [id]: (get("evd.vers", {})[id] || []).concat([{ file: v.file, note: v.note || "", at: TODAY, by: ME }]) })); setState(id, "pending"); K.redraw(); K.toast(`Version ${(get("evd.vers", {})[id] || []).length + 1} added: it waits on a reviewer`); return null; } }); });
  K.on("k3d.ev.renew", (id) => { const a = art(id); if (!a) return;
    K.form({ title: "Set the renewal date", submit: "Save date", fields: [{ key: "renew", label: "Renew by", type: "date", value: a.renew || "", hint: "Leave it empty for evidence that does not expire." }],
      onSubmit: (v) => { set("evd.renew", Object.assign({}, get("evd.renew", {}), { [id]: v.renew || "" })); K.redraw(); K.toast(v.renew ? `Renew by ${md(v.renew)}` : "No renewal date"); return null; } }); });
  K.on("k3d.ev.file", (id) => { const a = art(id); if (a) K.toast(`${a.file || "The file"} would download here: the prototype keeps its name, not the file`); });
  K.on("k3d.ev.cite", (id) => { const a = art(id); if (!a) return;
    K.pick({ title: "Link to requirements", multi: true, search: `Search all ${fmt(reqList().length)} requirements`, submit: (n) => (n ? `Link to ${plural(n, "requirement")}` : "Link"), create: wsx() ? { label: "Create requirement", onCreate: () => K.toast("Create it on Requirements, then link this artifact from its panel", { label: "Open Requirements", route: "requirements" }) } : null,
      items: reqList().map((r) => ({ id: r.code, code: r.code, title: r.title, desc: clip(r.statement, 110), meta: [...r.ctl].slice(0, 2).join(", "), held: r.ev.has(id) ? "Cites it" : "" })),
      onPick: (ids) => { ids.forEach((c) => linkEvidence(c, id)); K.redraw(); K.toast(`${plural(ids.length, "requirement")} now cite${ids.length === 1 ? "s" : ""} this artifact`); } }); });
  K.on("k3d.ev.uncite", (a) => { const [id, code] = a, x = art(id);
    K.confirm({ title: "Unlink requirement", submit: "Unlink requirement", danger: true, text: `${esc(code)} no longer cites ${esc(x ? x.title : "this artifact")}. Both stay in their registers.`, onOk: () => { unlinkEvidence(code, id); K.redraw(); K.toast(`${code} no longer cites this artifact`); } }); });
  K.on("k3d.req.open", (code) => K.openPanel("k3d-req", code));
  // The artifact: a page (artifact--<id>, drawn by the kit from this definition) and the same record as a preview (the eye).
  function evPanel(id0, opts) {
    const page = !!(opts && opts.page);
    const id = String(id0 || "").split("|")[0], a = art(id); if (!a) return null;
    const rv = REVW[a.state], reqs = a.reqs.map(req).filter(Boolean), ctls = uniq(reqs.flatMap((r) => [...r.ctl])).sort(natural);
    const nver = (a.vers || []).length + 1;
    const versions = [{ n: 1, file: a.file || "", at: a.collected, by: a.owner, note: "" }].concat((a.vers || []).map((x, i) => ({ n: i + 2, file: x.file, at: x.at, by: x.by, note: x.note }))).reverse();
    const sm = !page;
    const actions = a.state === "pending" ? K.btn("Request changes", { sm, act: "k3d.ev.revise", arg: id }) + K.btn("Accept", { sm, primary: true, act: "k3d.ev.accept", arg: id })
      : a.state === "revise" ? K.btn("Accept as it is", { sm, act: "k3d.ev.accept", arg: id }) + K.btn("Add a version", { sm, primary: true, act: "k3d.ev.version", arg: id })
      : K.menu("More", [{ label: "Reopen the review", act: "k3d.ev.reopen", arg: id }, { label: "Request changes", act: "k3d.ev.revise", arg: id }], { sm });
    return { label: "Evidence", title: a.title, chip: K.status(rv[0], rv[1]), actions,
      crumbs: page ? [["Evidence", "evidence"], [clip(a.title, 60)]] : null,
      sub: page ? `${esc(a.kind)}${a.collected ? ` · collected ${esc(md(a.collected))}` : ""}${a.owner ? ` · ${esc(a.owner)}` : ""}` : "",
      facts: [["Kind", esc(a.kind)], ["Owner", a.owner ? K.owner(a.owner) : none("No owner")], ["Collected", a.collected ? esc(md(a.collected)) : none()],
        ["Review", a.state === "pending" ? "Waits on a reviewer" : `${esc(rv[0])}${a.reviewed ? ` ${esc(md(a.reviewed))}` : ""}${a.reviewer ? ` by ${esc(a.reviewer)}` : ""}`], a.note ? ["Asked to change", esc(a.note)] : null,
        ["Renew by", `${a.renew ? `<span class="num${expiring(a) ? " k3d-due" : ""}">${esc(md(a.renew))}</span> ` : ""}${K.actLink(a.renew ? "Change" : "Set a date", "k3d.ev.renew", id)}`],
        ["File", versions[0].file ? K.actLink(versions[0].file, "k3d.ev.file", id) : mu("No file recorded")]],
      sections: [
        K.related({ title: "Cited by", empty: "No requirement cites it", add: { label: "Link to a requirement", act: "k3d.ev.cite", arg: id }, cols: [{ label: "Requirement" }, page ? { label: "Controls" } : null, { label: "State", cls: "nw" }, { label: "", cls: "tight" }].filter(Boolean),
          rows: reqs.map((r) => Object.assign(rowOpen("k3d-req", r.code), { cells: [K.name(r.title, page ? clip(r.statement, 110) : "", r.code), page ? ctlCell(r) : null, esc(reqState(r)[0]), rowAct("Unlink", "k3d.ev.uncite", [id, r.code], `Unlink ${r.code}`)].filter((x) => x !== null) })) }),
        ctls.length ? K.related({ title: "Controls it supports", cols: [{ label: "Control" }, { label: "Status", cls: "nw" }], rows: ctls.slice(0, 12).map((c) => Object.assign(rowOpen(ctlPanel(), c), { cells: [K.name((ctlRec(c) || {}).t || c, "", c), ctlStatus(c) ? esc(ctlStatus(c)) : none()] })) }) : "",
        K.related({ title: "Versions", count: nver, add: { label: "Add a version", act: "k3d.ev.version", arg: id }, cols: [{ label: "Version" }, page ? { label: "File" } : null, { label: "Added", cls: "nw" }, { label: "By", cls: "nw" }].filter(Boolean),
          rows: versions.map((x) => ({ cells: [K.name(`Version ${x.n}`, page ? x.note || "" : x.note || x.file || ""), page ? (x.file ? esc(x.file) : mu("No file recorded")) : null, x.at ? `<span class="num">${esc(md(x.at))}</span>` : none(), esc(x.by || "") || none()].filter((y) => y !== null) })) }),
      ] };
  }
  K.panel("k3d-ev", evPanel);
  // The old artifact previews (the register's and the workbook's) draw this panel for the artifacts it knows.
  ["a-docs-ev", "v3x-ev"].forEach((kind) => { if (PA.P[kind]) V3.P(kind, (orig, id) => { const k = String(id || "").split("|")[0]; if (!wsx() || !art(k)) return orig(); return PA.P["k3d-ev"](k); }); });

  // ——— Facts: the registers' counts follow what is created, reviewed and linked here ———
  const F = V3.facts, ev0 = F.evidence, rq0 = F.requirements;
  F.evidence = function (p) { if (BUILDING || !on() || !wsx() || (p && p !== WSX)) return ev0 ? ev0.apply(this, arguments) : undefined; const l = artList(); return { total: l.length, pending: l.filter((a) => a.state === "pending").length, revise: l.filter((a) => a.state === "revise").length, accepted: l.filter((a) => a.state === "accepted").length }; };
  F.requirements = function (p) { const b = rq0 ? rq0.apply(this, arguments) : undefined; if (BUILDING || !on() || !wsx() || (p && p !== WSX)) return b; let hi = 0; for (const c of model().reqs.keys()) { const m = /^REQ-(\d+)$/.exec(c); if (m) hi = Math.max(hi, +m[1]); } return Object.assign({}, b || {}, { total: Math.max(reqList().length, hi), count: reqList().length }); };
  Object.assign(F, {
    requirement: (code) => plainReq(req(code)),
    requirementsOfControl: (c) => reqsOfControl(c),
    requirementsOfComponent: (comp) => reqsOfComponent(comp),
    createdRequirements: () => reqList().filter((r) => r.made).map(plainReq),
    createRequirement: (o) => createRequirement(o || {}),
    mapControl: (code, c) => mapControl(code, c), unmapControl: (code, c) => unmapControl(code, c),
    allocateRequirement: (code, comp) => allocate(code, comp), unallocateRequirement: (code, comp) => unallocate(code, comp),
    artifacts: () => artList().map((a) => ({ id: a.id, title: a.title, kind: a.kind, state: a.state, owner: a.owner || null, collected: a.collected || null, requirements: a.reqs.slice() })),
    artifact: (id) => { const a = art(id); return a ? { id: a.id, title: a.title, kind: a.kind, state: a.state, owner: a.owner || null, collected: a.collected || null, requirements: a.reqs.slice() } : null; },
    linkEvidence: (code, id) => linkEvidence(code, id), unlinkEvidence: (code, id) => unlinkEvidence(code, id),
    reqPanel: () => "k3d-req", evPanel: () => "k3d-ev",
    documents: () => docs().map((d) => ({ id: d.id, name: d.name, kind: d.kind, state: DSTATE[d.state][0], revision: d.rev || null, route: d.route || null })),
  });

  // ════════════════ A document written here ════════════════
  K.lazy(/^document--([\w-]+)$/, (route, m) => {
    fresh();
    const d = madeDocs().find((x) => x.id === m[1]);
    if (!d) return K.page({ cls: "k3d", head: K.head({ crumbs: [["Documents", "documents"], ["Not found"]], title: "Document not found" }), body: K.empty({ title: "This document is no longer here", line: "It was deleted, or the session was reset.", action: K.btn("Open Documents", { sm: true, go: "documents" }) }) });
    const st = DSTATE[d.state || "draft"];
    return K.page({ cls: "k3d", head: K.head({ crumbs: [["Documents", "documents"], [d.title]], title: d.title, chip: K.status(st[0], st[1]), sub: `${d.kind === "policy" ? "Policy" : "Plan"} · revision 1 · owner ${esc(d.by)}`,
      actions: K.menu("More", [{ label: "Export as PDF", act: "k3d.export", arg: d.title }, { label: "Delete document", act: "k3d.doc.rm", arg: d.id, danger: true }]) + K.btn((d.state || "draft") === "review" ? "Withdraw from review" : "Submit for review", { primary: true, act: "k3d.doc.submit", arg: d.id }) }),
      body: `<article class="k3d-paper"><div class="k3d-ed" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${esc(d.title)}" spellcheck="false" data-k3d-doc="${esc(d.id)}" data-ph="Write the document here">${esc(d.text || "")}</div></article><p class="k3-muted k3d-saved" role="status">What you write is saved when you leave the text.</p>` });
  }, "documents");
  document.addEventListener("focusout", (e) => {
    if (!on()) return;
    const el = e.target && e.target.closest ? e.target.closest("[data-k3d-doc]") : null; if (!el) return;
    const id = el.getAttribute("data-k3d-doc"), d = madeDocs().find((x) => x.id === id), t = el.innerText.replace(/ /g, " ").trim(); if (!d || t === (d.text || "")) return;
    set("doc.made", madeDocs().map((x) => (x.id === id ? Object.assign({}, x, { text: t, edited: TODAY }) : x)));
    const hint = document.querySelector("#main .k3d-saved"); if (hint) hint.textContent = "Saved.";
  });

  // ════════════════ The SSP editor: one click from Documents, opened at a place, its generated sections edited at their source ════════════════
  const secId = (n) => { const s = ((SSP && SSP.sections) || []).find((x) => String(x.n).toUpperCase() === String(n).toUpperCase() || x.id === n); return s ? s.id : null; };
  const isComp = (x) => !!(PA.v7p && PA.v7p.EBY && PA.v7p.EBY[x]) || (hasS() && !!V3.fact("component", x));
  // sspAt(target) → the route that opens the editor there: 8 or "s8" (a section), "AC-2" (a control), "CN-109101" (a component's
  // row in section 8), { connection: name } (section 7), "ports" (section 9), "placeholder" (the first placeholder narrative).
  const sspAt = (t) => {
    if (t && typeof t === "object") t = t.control || t.component || (t.connection ? "connection:" + t.connection : t.section || "");
    return t === "" || t == null ? "ssp" : "ssp--" + String(t);
  };
  let SSP_AT = null;
  function sspTarget(key) {
    key = decodeURIComponent(String(key || ""));
    if (key === "placeholder") { const c = placeholders()[0]; return c ? { at: c.c } : { at: "s11" }; }
    if (ctlRec(key)) return { at: key };
    if (isComp(key)) return { at: "s8", comp: key };
    if (/^connection:/.test(key)) return { at: "s7", text: key.slice(11) };
    if (key === "connections") return { at: "s7" };
    if (key === "ports") return { at: "s9" };
    const s = secId(key) || secId(key.replace(/^s/, "")); return s ? { at: s } : null;
  }
  V3.redirect(/^ssp--/, (r) => { SSP_AT = sspTarget(r.slice(5)); return "ssp"; });
  F.sspAt = sspAt;

  const inEditor = () => document.getElementById("se-app");
  const jump = (at) => { const app = inEditor(); if (!app) return false; const b = document.createElement("button"); b.type = "button"; b.hidden = true; b.setAttribute("data-act", "jump"); b.setAttribute("data-at", at); app.appendChild(b); b.click(); b.remove(); return true; };
  // lead: what is above a place can still grow after the editor has scrolled to it (rows added from System, a section drawn
  // again, the editor putting back the place it remembers before the page is laid out), which left the place under the fold.
  // The place is looked at again a few times and put back in view, unless the reader has moved meanwhile. The editor may have
  // drawn itself again since, so the scroller and the place are found afresh each time.
  function settle(find, frac) {
    let mine = true; const EV = ["wheel", "touchmove", "keydown", "mousedown"];
    const stop = (e) => { if (e.target && e.target.closest && e.target.closest("#se-app")) mine = false; };
    EV.forEach((n) => document.addEventListener(n, stop, { capture: true, passive: true }));
    [1000, 1800, 2800].forEach((ms, k, all) => setTimeout(() => {
      const sc = document.getElementById("se-scroll"), tgt = mine && sc ? find() : null;
      if (tgt) { const a = tgt.getBoundingClientRect(), b = sc.getBoundingClientRect(); if (a.top < b.top + 30 || a.top > b.top + sc.clientHeight * 0.6) sc.scrollTo({ top: Math.max(0, sc.scrollTop + a.top - b.top - (frac ? sc.clientHeight * frac : 150)), behavior: "auto" }); }
      if (k === all.length - 1) EV.forEach((n) => document.removeEventListener(n, stop, true));
    }, ms));
  }
  function sspFocus(t) {
    if (!t || !t.at || !jump(t.at)) return;
    setTimeout(() => {
      const isCtl = !!ctlRec(t.at), blk = isCtl ? document.getElementById("se-c-" + t.at) : document.getElementById("se-s-" + t.at); if (!blk) return;
      let el = null;
      if (t.comp) { const tr = [...blk.querySelectorAll("tbody tr")].find((r) => txt(r.children[1]) === t.comp); if (tr) { el = tr.querySelector("[contenteditable='true']") || tr; tr.classList.add("k3d-at"); const sc = document.getElementById("se-scroll"); if (sc) { const a = tr.getBoundingClientRect(), b = sc.getBoundingClientRect(); sc.scrollTo({ top: Math.max(0, sc.scrollTop + a.top - b.top - sc.clientHeight / 3), behavior: "auto" }); } } }
      else if (t.text) { const tr = [...blk.querySelectorAll("tbody tr")].find((r) => txt(r.children[0]).toLowerCase().indexOf(t.text.toLowerCase()) === 0); if (tr) { tr.classList.add("k3d-at"); el = tr; } }
      if (!el) el = blk.querySelector(isCtl ? ".se-n" : "[contenteditable='true'], .se-h") || blk;
      if (!/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !el.isContentEditable && !el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true }); blk.classList.add("v2c-at");
      // lead: what is above the place can still grow after the jump (rows added from System, a section drawn again), which left
      // the place under the fold. It is looked at again a few times and put back in view, unless the reader has moved meanwhile.
      settle(() => { const now = document.getElementById((isCtl ? "se-c-" : "se-s-") + t.at); return now ? now.querySelector("tr.k3d-at") || now : null; }, t.comp ? 0.33 : 0);
    }, 90);
  }

  // Edit source: where a generated section's records are edited. Leaves the editor with the return bar back to the section.
  const pick1 = (...routes) => routes.find((r) => r && has(r)) || routes[routes.length - 1];
  const SECSRC = {
    s1: () => [pick1("system", "composition"), "the system's record"], s2: () => ["itcsc", "the categorization"], s3: () => [pick1("overview-team", "people"), "the program's roles"],
    s5: () => [pick1("system-boundary", "boundary"), "the authorization boundary"], s6: () => [pick1("system", "composition"), "the system's components"],
    s7: () => [pick1("system-connections", "interconnections"), "the connections"], s8: () => [pick1("system", "inventory"), "the components and what they run"],
    s9: () => [pick1("system-connections", "ppsm"), "the connections' ports and protocols"], s10: () => [pick1("controls", "baseline"), "the control baseline"],
  };
  const secNum = (id) => { const s = ((SSP && SSP.sections) || []).find((x) => x.id === id); return s ? s.n : String(id).replace(/^s/, ""); };
  let PEND = null; // a panel to open once its page has drawn
  window.addEventListener("hashchange", () => { if (!on() || !PEND) return; const p = PEND; if (cur() !== p.route) { if (!/^ssp/.test(cur())) PEND = null; return; } PEND = null; setTimeout(() => K.openPanel(p.kind, p.id), 220); });
  function editSource(src) {
    const [kind, key] = [src.slice(0, src.indexOf(":")), src.slice(src.indexOf(":") + 1)];
    let from, what, route, panel = null;
    if (kind === "sec") { const f = SECSRC[key]; if (!f) return false; const [r, w] = f(); from = { label: `SSP section ${secNum(key)}`, route: "ssp--" + key }; what = w; route = r; }
    else if (kind === "comp") { from = { label: "SSP section 8", route: "ssp--" + key }; what = `${compName(key)}, where it is edited`; route = hasS() ? `component--${key}--software` : compRoute(key); }
    else if (kind === "ctl") {
      from = { label: `SSP section 11, ${key}`, route: "ssp--" + key }; what = `${key}, where it is written`;
      const page = recRoute(ctlPanel(), key);
      if (page) route = page; // the control's own page
      else { route = "controls"; panel = { route, kind: ctlPanel(), id: key }; if (hasC()) K.set("ctl.view", { codes: [key], note: `${key}, opened from the SSP's section 11` }); }
    } else if (kind === "conn") {
      const x = hasS() ? (V3.fact("connections") || []).find((c) => String(c.name || "").toLowerCase().indexOf(key.toLowerCase()) === 0 || key.toLowerCase().indexOf(String(c.name || "").toLowerCase()) === 0) : null;
      from = { label: "SSP section 7", route: "ssp--connection:" + encodeURIComponent(key) }; what = `${key}, where it is edited`; route = pick1("system-connections", "interconnections");
      if (x && PA.P["k3s-conn"]) { const page = recRoute("k3s-conn", x.id); if (page) route = page; else panel = { route, kind: "k3s-conn", id: x.id }; }
    } else return false;
    PEND = panel;
    K.task.start({ from, what, steps: [{ label: what.charAt(0).toUpperCase() + what.slice(1), route }] });
    return true;
  }

  // What the editor shows of other lanes' records, added to its own blocks once they are drawn (families draw as they scroll in).
  let dressing = false, dressT = null, OBS = null;
  const swOf = (code) => { try { const l = hasS() && PA.v3s && PA.v3s.itemsOf ? PA.v3s.itemsOf(code) || [] : [], mine = new Set(kdata("sys.items", []).map((x) => x.id)); return l.filter((x) => x && x.kind !== "Hardware").sort((a, b) => (mine.has(a.id) ? 0 : 1) - (mine.has(b.id) ? 0 : 1)); } catch (e) { return []; } };
  const swLine = (code) => { const sw = swOf(code); return sw.slice(0, 4).map((x) => `${x.kind || "Software"} ${x.name}${x.version ? " " + x.version : ""}`).join(" · ") + (sw.length > 4 ? ` · and ${sw.length - 4} more` : ""); };
  const implsOf = () => memo("impls", () => { const m = new Map(); if (!hasC()) return m; for (const k of Object.keys(kdata("ctl.impl", {}))) { const i = k.indexOf("@"); if (i < 1) continue; const c = k.slice(0, i), comp = k.slice(i + 1); if (!comp) continue; if (!m.has(c)) m.set(c, []); m.get(c).push(comp); } return m; });
  function dress() {
    const app = inEditor(), page = document.getElementById("se-page"); if (!app || !page || !on() || !wsx()) return;
    dressing = true;
    try {
      // The way back says Documents.
      const back = app.querySelector(".se-head .ak-back"); if (back && back.getAttribute("data-go") !== "documents") { back.setAttribute("data-go", "documents"); const tn = [...back.childNodes].filter((n) => n.nodeType === 3).pop(); if (tn) tn.textContent = "Documents"; }
      // A generated section's Open record is Edit source.
      for (const b of page.querySelectorAll(".sd-live[data-live] > .sd-live-h .se-lacts > [data-go]:not([data-k3d-src])")) { const id = b.closest("[data-live]").getAttribute("data-live"); if (!SECSRC[id]) continue; b.setAttribute("data-k3d-src", "sec:" + id); const tn = [...b.childNodes].filter((n) => n.nodeType === 3).pop(); if (tn) tn.textContent = "Edit source"; b.setAttribute("title", `Edit ${SECSRC[id]()[1]} where they are kept`); }
      // Section 8: a component's row opens the component, and prints the software and firmware recorded on it.
      const s8 = document.getElementById("se-s-s8");
      if (s8) for (const tr of s8.querySelectorAll("tbody tr")) {
        const code = txt(tr.children[1]), cell = tr.children[0]; if (!cell || !isComp(code)) continue;
        if (!cell.querySelector(".k3d-srcl")) { const name = txt(cell); cell.innerHTML = `<button type="button" class="k3d-srcl" data-k3d-src="comp:${esc(code)}" title="Edit source: open ${esc(name)} where it is edited">${esc(name)}</button>`; }
        const line = swLine(code), had = cell.querySelector(".k3d-sw");
        if (line && (!had || had.textContent !== line)) { if (had) had.textContent = line; else cell.insertAdjacentHTML("beforeend", `<span class="k3d-sw">${esc(line)}</span>`); } else if (!line && had) had.remove();
      }
      if (s8 && hasS()) { const tb = s8.querySelector("tbody"), have = new Set([...s8.querySelectorAll("tbody tr")].map((tr) => txt(tr.children[1]))), all = allComps();
        if (tb) for (const c of all) { if (have.has(c.code) || all.some((x) => x.parent === c.code) || !/^CN-/.test(c.code) || (PA.v7p.EBY && PA.v7p.EBY[c.code])) continue; const line = swLine(c.code);
          tb.insertAdjacentHTML("beforeend", `<tr data-k3d-added="1"><td><button type="button" class="k3d-srcl" data-k3d-src="comp:${esc(c.code)}" title="Edit source: open ${esc(c.name)} where it is edited">${esc(c.name)}</button>${line ? `<span class="k3d-sw">${esc(line)}</span>` : ""}</td><td class="se-mono se-nw">${esc(c.code)}</td><td class="se-mono se-nw">—</td><td>${esc(c.kind || "")}</td><td>${esc(compName(c.parent) || "")}</td><td class="se-desc">Added on System today</td></tr>`); } }
      // Section 7: a connection's row opens the connection.
      const s7 = document.getElementById("se-s-s7");
      if (s7) for (const tr of s7.querySelectorAll("tbody tr")) { const cell = tr.children[0]; if (!cell || cell.querySelector(".k3d-srcl")) continue; const name = txt(cell); cell.innerHTML = `<button type="button" class="k3d-srcl" data-k3d-src="conn:${esc(name)}" title="Edit source: open this connection where it is edited">${esc(name)}</button>`; }
      // Section 10: the baseline as Controls holds it now.
      const s10 = document.getElementById("se-s-s10"), bl = hasC() ? V3.fact("baseline") : null;
      if (s10 && bl && bl.here) {
        const a = bl.here.added || [], r = bl.here.removed || [], had = s10.querySelector(".k3d-bl");
        const line = a.length || r.length ? `Tailored on Controls since this revision's table was drawn: ${[a.length ? `${plural(a.length, "control")} added (${a.slice(0, 6).join(", ")}${a.length > 6 ? "…" : ""})` : "", r.length ? `${plural(r.length, "control")} removed (${r.slice(0, 6).join(", ")}${r.length > 6 ? "…" : ""})` : ""].filter(Boolean).join("; ")}. The baseline holds ${fmt(bl.total)} controls.` : "";
        if (line && (!had || had.textContent !== line)) { if (had) had.textContent = line; else { const p = s10.querySelector(".sd-live .sd-p"); if (p) p.insertAdjacentHTML("afterend", `<p class="sd-p k3d-bl">${esc(line)}</p>`); } } else if (!line && had) had.remove();
      }
      // Section 11: a control's Open record is Edit source; the record's narrative is the one text; under it, what each component
      // that carries the control implements (written in the control's panel).
      const impls = implsOf();
      for (const blk of page.querySelectorAll(".se-ctl[data-at]")) {
        const code = blk.getAttribute("data-at"), c = ctlRec(code); if (!c) continue;
        const b = blk.querySelector(".se-ctl-a [data-go]"); if (b && !b.hasAttribute("data-k3d-src")) { b.setAttribute("data-k3d-src", "ctl:" + code); b.setAttribute("aria-label", `Edit source: open ${code} where it is written`); b.setAttribute("title", "Edit source"); }
        const n = blk.querySelector(".se-n");
        if (n) { const seen = blk.getAttribute("data-k3d-n"); if (seen != null && seen !== c.n && document.activeElement !== n && !n.contains(document.activeElement)) { n.textContent = c.n; const ch = blk.querySelector(".se-ctl-m .ak-chip.warn"); if (ch && !c.ph) ch.remove(); } if (seen !== c.n) blk.setAttribute("data-k3d-n", c.n); }
        const comps = impls.get(code) || [], rows = comps.map((comp) => { const im = V3.fact("impl", code, comp) || kdata("ctl.impl", {})[`${code}@${comp}`]; return im && String(im.text || "").trim() ? `<div class="k3d-im"><b>${esc(compName(comp))}</b> <span class="se-mono">${esc(comp)}</span>${im.status ? ` <span class="se-meta">${esc(im.status)}</span>` : ""}<p>${esc(im.text)}</p></div>` : ""; }).join("");
        const had = blk.querySelector(".k3d-ims");
        if (rows) { const html = `<div class="k3d-imh">By component</div>${rows}`; if (!had) (n || blk).insertAdjacentHTML(n ? "afterend" : "beforeend", `<div class="k3d-ims" data-ui="">${html}</div>`); else if (had.innerHTML !== html) had.innerHTML = html; } else if (had) had.remove();
      }
    } catch (e) { console.error("k3d: the SSP editor", e); }
    try { syncBoundary(); } catch (e) { console.error("k3d: the boundary's description", e); }
    if (OBS) OBS.takeRecords();
    dressing = false;
    keepInView();
  }
  // lead: the boundary's description is one text. System › Boundary writes it (sys.boundaryText) and section 5 prints it;
  // a sentence typed in section 5 is written back, so System shows it too. (The editor kept its own copy once the section
  // had been typed in, and System kept another: a reader who changed one found the other unchanged.)
  const S5ED = '#se-s-s5 .se-auth[data-key="s5"]';
  const plainOf = (ed) => { const ps = [...ed.querySelectorAll("p")].map((x) => x.innerText.replace(/\s+/g, " ").trim()).filter(Boolean); return ps.length ? ps.join("\n\n") : ed.innerText.replace(/\s+/g, " ").trim(); };
  const sameText = (a, b2) => String(a || "").replace(/\s+/g, " ").trim() === String(b2 || "").replace(/\s+/g, " ").trim();
  function syncBoundary() {
    const ed = document.querySelector(S5ED); if (!ed) return;
    const sys = K.get("sys.boundaryText", null);
    if (sys == null || document.activeElement === ed || sameText(sys, plainOf(ed))) return;
    ed.innerHTML = String(sys).split(/\n{2,}/).map((x) => `<p>${K.esc(x)}</p>`).join("");
    ed.dispatchEvent(new Event("input", { bubbles: true })); // the editor keeps what it now shows
  }
  let s5T = null;
  document.addEventListener("input", (e) => {
    if (!on() || !wsx()) return;
    const ed = e.target && e.target.closest ? e.target.closest(S5ED) : null; if (!ed || !e.isTrusted) return;
    clearTimeout(s5T); s5T = setTimeout(() => { const t = plainOf(ed); if (t && !sameText(t, K.get("sys.boundaryText", null))) K.set("sys.boundaryText", t); }, 500);
  }, true);
  // lead: dressing adds rows and text above the place the editor scrolled to (also when the editor itself puts back the place
  // it remembers), which left that place under the fold. For a few seconds after the SSP opens, and only while the reader has
  // not touched the editor, the place that holds the cursor is put back in view after each dressing.
  let KEEP = 0, keepT = null;
  function keepInView() {
    if (Date.now() > KEEP) return;
    clearTimeout(keepT);
    keepT = setTimeout(() => {
      const sc = document.getElementById("se-scroll"), f = document.activeElement, tgt = sc && f && f !== document.body && f.closest && f.closest("#se-scroll") ? f.closest('[id^="se-c-"], [id^="se-s-"], [data-at]') || f : null;
      if (!tgt || Date.now() > KEEP) return;
      const hit = tgt.querySelector("tr.k3d-at") || tgt, a = hit.getBoundingClientRect(), b2 = sc.getBoundingClientRect();
      if (a.top < b2.top + 30 || a.top > b2.top + sc.clientHeight * 0.6) sc.scrollTo({ top: Math.max(0, sc.scrollTop + a.top - b2.top - 150), behavior: "auto" });
    }, 450);
  }
  const keepArm = () => { if (!on()) return; if (/^#?ssp(--|$)/.test(location.hash || "")) { KEEP = Date.now() + 4500; [900, 1700, 2600, 3600].forEach((ms) => setTimeout(keepInView, ms)); } else KEEP = 0; };
  window.addEventListener("hashchange", keepArm);
  ["wheel", "touchmove", "keydown", "mousedown"].forEach((n) => document.addEventListener(n, (e) => { if (KEEP && e.target && e.target.closest && e.target.closest("#se-app")) KEEP = 0; }, { capture: true, passive: true }));
  const dressSoon = () => { clearTimeout(dressT); dressT = setTimeout(() => { fresh(); dress(); }, 60); };
  function watch() {
    const page = document.getElementById("se-page"); if (!page) return;
    if (OBS) OBS.disconnect();
    OBS = new MutationObserver(() => { if (!dressing) dressSoon(); });
    OBS.observe(page, { childList: true, subtree: true });
  }
  V.on(() => { if (on() && inEditor()) dressSoon(); });
  V3.S("ssp", (orig) => {
    const html = orig(); if (DEPTH || !wsx()) return html;
    const t = SSP_AT; SSP_AT = null;
    const task = K.task.get(); if (task && task.from && /^ssp/.test(task.from.route || "")) K.task.end(false);
    setTimeout(() => { fresh(); dress(); watch(); if (t) sspFocus(t); else settle(() => { const f = document.activeElement; return f && f !== document.body && f.closest && f.closest("#se-scroll") ? f.closest('[id^="se-c-"], [id^="se-s-"], [data-at]') || f : null; }, 0); }, 140);
    return html;
  });
  // Inside the editor: Edit source on a section, a component, a connection or a control.
  window.addEventListener("click", (e) => {
    if (!on() || !wsx()) return;
    const t = e.target && e.target.closest ? e.target.closest("#se-app [data-k3d-src]") : null; if (!t) return;
    if (editSource(t.getAttribute("data-k3d-src"))) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
  }, true);
  // Anywhere else: a link to the SSP that names a control, a component or a section lands there. A link inside a control's panel
  // (k3c-control, or the old preview) lands on that control; lane X's listener already reads "SSP section N" from the link's words.
  window.addEventListener("click", (e) => {
    if (!on() || !wsx()) return;
    const t = e.target && e.target.closest ? e.target.closest('[data-go="ssp"], a[href="#ssp"], [data-v2go="ssp"]') : null;
    if (!t || t.closest("#se-app, #sx-app")) return;
    let at = t.getAttribute("data-k3d-at") || "";
    if (!at) { const pn = t.closest("#panel"); const last = pn && V.lastPanel ? V.lastPanel() : null; if (last && /control/.test(last.kind || "") && ctlRec(String(last.id).split("@")[0].split("|")[0])) at = String(last.id).split("@")[0].split("|")[0]; }
    if (!at) { const m = /^component--([\w-]+)/.exec(cur()); if (m && isComp(m[1]) && /section 8|§8\b|inventory/i.test(txt(t) + " " + txt(t.parentElement))) at = m[1]; }
    if (!at) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    K.go("ssp--" + at);
  }, true);
  // The other plans' editors and lane X's drafts say Documents on their way back.
  const relabel = (html) => { const t = document.createElement("template"); t.innerHTML = String(html || ""); let hit = false; t.content.querySelectorAll('[data-go="ssps"]').forEach((b) => { b.setAttribute("data-go", "documents"); const tn = [...b.childNodes].filter((n) => n.nodeType === 3).pop(); if (tn && /Plans/.test(tn.textContent)) { tn.textContent = tn.textContent.replace(/Plans/, "Documents"); hit = true; } }); return hit ? t.innerHTML : html; };
  V3.S(/^plan-[a-z]+(-history)?$/, (orig) => (wsx() && !DEPTH ? relabel(orig()) : orig()));
  V3.S(/^(after-)?policy-page-/, (orig) => { const html = orig(); if (DEPTH || !wsx()) return html; const t = document.createElement("template"); t.innerHTML = String(html || ""); let hit = false; t.content.querySelectorAll('.ak-crumbs [data-go], .ak-crumbs a[href]').forEach((b) => { const to = b.getAttribute("data-go") || String(b.getAttribute("href") || "").slice(1); if (!/^(after-)?polic(ies|ies-index)$/.test(to) && to !== "after-policies-index") return; if (b.hasAttribute("data-go")) b.setAttribute("data-go", "policies"); else b.setAttribute("href", "#policies"); b.textContent = "Documents"; hit = true; }); return hit ? t.innerHTML : html; });
  PA.v3d = Object.assign(PA.v3d || {}, { docs, fresh });
})();
