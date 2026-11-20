// Prototype V3, lane R (v3r-): assess and test by the book. Findings B16 B17 B18 B19 B20 B21 B22 B24 B25 B28 C13 (SP/vanta/review).
// Inert while V3 is off: every screen, preview and dialog goes through PA.v3.S/P/M, every listener returns at once, and every wrapper
// of a v2 function hands back v2's answer.
// - A campaign's plan lists each assessment objective with its methods (Examine, Interview, Test). A determination is recorded per
//   objective; the control's determination is the worst of its objectives once every one is judged (Not assessed until all).
// - A plan is approved before requests and determinations run: the lead assessor approves, the authorizing official concurs, each
//   step recorded as its holder. A control added to an approved plan joins its next revision, which is approved the same way.
// - Only the lead assessor publishes; a determination recorded for someone says whom it was recorded as. One publish rule: each
//   determination short of satisfied opens an operational issue, whichever campaign it belongs to (the expanded set's too).
// - Result batches are named by set ("Expanded set 2"); Increment stays the acquisition increment.
// - A control names the campaign that holds it (requests and plans of every campaign) and offers Open assessment campaign.
// - Risks ask their response; Assign owner, Deactivate, Change planned date and Link ATT&CK technique save and show everywhere.
// - Cyber T&E: adversarial testing waits on the IATT; Plan the test runs Plan an assessment; SVR reads its owner from the campaign.
// State (PA.v2 session state, cleared by PA.v2.reset()): under v3.R: plan.<cid> { rev, state draft|review|approved, steps, adds,
//   hist }; obj.<code> { <i>: { det, methods, note, by, rec, at, pub } }; res.<cid> [{ title, at, by, rec, n, objs }];
//   own.<kind>.<id> owner; deact.<id> { reason, at }; planned.<id> { to, reason, at }; tech.<riskId> [codes]; resp.<riskId> response.
//   Writes v2's own shapes to chain.ctl.<code> (det, published), chain.issues, chain.results.<cid>, chain.inc2, chain.risks, chain.camps.
// Facts: campaignOf(code), results(prog), ownerOf(kind, id).
(function () {
  const PA = window.PA, V = PA && PA.v2, X = PA && PA.v3;
  if (!V || !X || !PA.AK || !PA.h || !V.chain || !V.chain.ui || !PA.SSP) return;
  const { S, P, M, h } = PA;
  const AK = PA.AK, { esc, fmt, pill, tag } = h;
  const CH = V.chain, U = CH.ui;
  const on = () => X.on();
  const TODAY_ISO = "2026-11-17", WSX = "PRG-1090", ME = "Ingrid Solberg", LEAD = "D. Okafor", ASSESSOR = "Nadia Fournier";
  const AO = CH.AO || "R. Calloway";
  const md = (iso) => (iso ? CH.md(String(iso).slice(0, 10)) : "");
  const mdy = (iso) => (iso ? CH.mdy(String(iso).slice(0, 10)) : "");
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const DASH = '<span class="v2-dash" aria-label="None">—</span>';
  const mu = (t) => `<span class="v2k-mu">${t}</span>`;
  const R = (p, d) => { const v = V.get("v3.R." + p, null); return v === undefined || v === null ? d : v; };
  const Rset = (p, v) => V.set("v3.R." + p, v);
  const wsx = () => X.wsx();
  const goAttr = CH.goAttr;
  const ST = CH.ST;
  const DET_ORDER = ["other_than_satisfied", "partially_satisfied", "satisfied"]; // worst first
  const worst = (dets) => DET_ORDER.find((d) => dets.includes(d)) || null;
  const edit = (html, fn) => {
    if (typeof html !== "string") return html;
    const t = document.createElement("template"); t.innerHTML = html;
    try { fn(t.content); } catch (e) { console.error("v3r", e); return html; }
    return t.innerHTML;
  };
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");

  // A screen another module registers again is swept again: the outermost layer of a wrapper applies, the inner ones pass through.
  const once = (fn) => { let depth = 0; return (orig, route) => { if (depth) return orig(); depth++; try { return fn(orig, route); } finally { depth--; } }; };
  const S1 = (match, fn) => X.S(match, once(fn));

  // ════════════════ B16: result batches are named by set; Increment stays the acquisition increment ════════════════
  const RENAMES = [
    [/\b([Ee])xpanded control set, increment (\d)/g, (m, e, n) => `${e}xpanded set ${n}`],
    [/\b([Ee])xpanded set, increment (\d)/g, (m, e, n) => `${e}xpanded set ${n}`],
    [/\b([Ii])nterim results, increment (\d)/g, (m, i, n) => `${i}nterim results, expanded set ${n}`],
    [/\b([Ii])ncrement (\d)( results| findings| determinations| published)/g, (m, i, n, w) => `${i === "I" ? "E" : "e"}xpanded set ${n}${w}`],
    [/\bthe increment (\d) results\b/g, (m, n) => `the expanded set ${n} results`],
  ];
  const NEEDS = /increment [12]\b/i;
  const renameStr = (s) => { if (typeof s !== "string" || !NEEDS.test(s)) return s; let o = s; for (const [re, fn] of RENAMES) o = o.replace(re, fn); return o; };
  // Text and the words a screen reader hears change; addresses, ids and values do not.
  function renameHtml(html) {
    if (typeof html !== "string" || !NEEDS.test(html)) return html;
    return edit(html, (root) => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) if (NEEDS.test(n.nodeValue)) n.nodeValue = renameStr(n.nodeValue);
      for (const el of root.querySelectorAll("[title], [aria-label], input[placeholder]")) {
        for (const a of ["title", "aria-label", "placeholder"]) { const v = el.getAttribute(a); if (v && NEEDS.test(v)) el.setAttribute(a, renameStr(v)); }
      }
    });
  }
  S1(/./, (orig) => renameHtml(orig()));
  const renameObj = (o) => (o && typeof o === "object" ? Object.assign({}, o, ...["title", "body", "footer", "label"].filter((k) => typeof o[k] === "string").map((k) => ({ [k]: renameHtml(o[k]) }))) : o);
  const t0 = V.toast;
  if (typeof t0 === "function") V.toast = function (text, link) { return t0.call(this, on() ? renameStr(text) : text, link); };

  // ════════════════ Assessment objectives: each with its methods (SP 800-53A) ════════════════
  const OBJ = {
    "SI-2": [["SI-02a.[01]", "system flaws are identified"], ["SI-02a.[02]", "system flaws are reported"], ["SI-02a.[03]", "system flaws are corrected"], ["SI-02b.[01]", "software updates related to flaw remediation are tested for effectiveness before installation"], ["SI-02b.[02]", "software updates related to flaw remediation are tested for potential side effects before installation"], ["SI-02b.[03]", "firmware updates related to flaw remediation are tested for effectiveness before installation"], ["SI-02b.[04]", "firmware updates related to flaw remediation are tested for potential side effects before installation"], ["SI-02c.[01]", "security-relevant software updates are installed within [time period] of the release of the updates"], ["SI-02c.[02]", "security-relevant firmware updates are installed within [time period] of the release of the updates"], ["SI-02d.", "flaw remediation is incorporated into the organizational configuration management process"]],
    "AC-2(7)": [["AC-02(07)(a)", "privileged user accounts are established and administered in accordance with a role-based access scheme"], ["AC-02(07)(b)", "privileged role or attribute assignments are monitored"], ["AC-02(07)(c)", "changes to roles or attributes are monitored"], ["AC-02(07)(d)", "access is revoked when privileged role or attribute assignments are no longer appropriate"]],
    "AC-17(4)": [["AC-17(04)(a)[01]", "the execution of privileged commands via remote access is authorized only in a format that provides assessable evidence"], ["AC-17(04)(a)[02]", "access to security-relevant information via remote access is authorized only in a format that provides assessable evidence"], ["AC-17(04)(a)[03]", "the execution of privileged commands via remote access is authorized only for the following needs: [needs]"], ["AC-17(04)(a)[04]", "access to security-relevant information via remote access is authorized only for the following needs: [needs]"], ["AC-17(04)(b)", "the rationale for remote access is documented in the security plan for the system"]],
    "AC-2": [["AC-02a.[01]", "account types allowed for use within the system are defined and documented"], ["AC-02a.[02]", "account types specifically prohibited for use within the system are defined and documented"], ["AC-02b.", "account managers are assigned"], ["AC-02c.", "[prerequisites and criteria] for group and role membership are required"], ["AC-02d.01", "authorized users of the system are specified"], ["AC-02d.02", "group and role membership are specified"], ["AC-02d.03[01]", "access authorizations (privileges) are specified for each account"], ["AC-02d.03[02]", "[attributes] are specified for each account"], ["AC-02e.", "approvals are required by [personnel or roles] for requests to create accounts"], ["AC-02f.[01]", "accounts are created in accordance with [policy, procedures, prerequisites and criteria]"], ["AC-02f.[02]", "accounts are enabled in accordance with [policy, procedures, prerequisites and criteria]"], ["AC-02f.[03]", "accounts are modified in accordance with [policy, procedures, prerequisites and criteria]"], ["AC-02f.[04]", "accounts are disabled in accordance with [policy, procedures, prerequisites and criteria]"], ["AC-02f.[05]", "accounts are removed in accordance with [policy, procedures, prerequisites and criteria]"], ["AC-02g.", "the use of accounts is monitored"], ["AC-02h.01", "account managers and [personnel or roles] are notified within [time period] when accounts are no longer required"], ["AC-02h.02", "account managers and [personnel or roles] are notified within [time period] when users are terminated or transferred"], ["AC-02h.03", "account managers and [personnel or roles] are notified within [time period] when system usage or need to know changes for an individual"], ["AC-02i.01", "access to the system is authorized based on a valid access authorization"], ["AC-02i.02", "access to the system is authorized based on intended system usage"], ["AC-02i.03", "access to the system is authorized based on [attributes]"], ["AC-02j.", "accounts are reviewed for compliance with account management requirements [frequency]"], ["AC-02k.01", "a process is established for changing shared or group account authenticators when individuals are removed from the group"], ["AC-02k.02", "a process is implemented for changing shared or group account authenticators when individuals are removed from the group"], ["AC-02l.01", "account management processes are aligned with personnel termination processes"], ["AC-02l.02", "account management processes are aligned with personnel transfer processes"]],
  };
  const METHOD = { examine: "Examine", interview: "Interview", test: "Test" };
  const methodsFor = (t) => /tested|installed|corrected|identified|monitored|revoked|disabled|removed|enabled|created|modified|authorized based/.test(t) ? ["examine", "test"]
    : /assigned|notified|reported|aligned|approvals/.test(t) ? ["examine", "interview"] : ["examine"];
  function objectivesOf(code) {
    const b = CH.base(code), n = Math.max(1, b.ob || 1), L = OBJ[code];
    if (L && L.length === n) return L.map(([label, text], i) => ({ i, label, text, ex: false, methods: methodsFor(text) }));
    return Array.from({ length: n }, (_, i) => ({ i, label: `${code} objective ${i + 1}`, text: `${b.t}, objective ${i + 1} of ${n}`, ex: true, methods: ["examine", "interview"] }));
  }
  const objState = (code) => R("obj." + code, {}) || {};
  const judgedOf = (code) => { const s = objState(code); return objectivesOf(code).filter((o) => s[o.i] && s[o.i].det); };
  const draftsOf = (code) => { const s = objState(code); return objectivesOf(code).filter((o) => s[o.i] && s[o.i].det && !s[o.i].pub); };
  const allJudged = (code) => judgedOf(code).length === objectivesOf(code).length;
  const derived = (code) => (allJudged(code) ? worst(judgedOf(code).map((o) => objState(code)[o.i].det)) : null);

  // ════════════════ Campaigns, plans and their approval [B19] ════════════════
  const EXP = { id: "exp", title: "WS-X90 Expanded Control Set Assessment", short: "Expanded control set assessment", route: "campaign", lead: LEAD };
  // The expanded campaign's requests and its second set's findings (mod-after-tests.js REQUESTS and INC2): the controls it holds.
  const EXP_REQ = { "AC-17(3)": "Accepted", "AC-17(4)": "Flagged", "AC-17(9)": "Ready", "AC-2(7)": "Ready", "AU-14": "Ready", "CA-3": "Flagged", "CM-8(4)": "Ready", "CM-11(2)": "Accepted", "CM-12": "Ready", "CM-14": "Accepted", "IA-2(2)": "Flagged", "IA-2(8)": "Accepted", "IA-3(1)": "Flagged", "IA-12": "Ready" };
  const INC2 = (PA.v3f && PA.v3f.INC2) || {};
  const BASE_PLAN = { conmon: ["SI-2"] };
  const planDefault = (cid) => ({ rev: 1, state: cid === "exp" ? "approved" : "draft", steps: [], adds: [], hist: [] });
  const planOf = (cid) => Object.assign(planDefault(cid), R("plan." + cid, {}) || {});
  const planCodes = (cid) => { const base = BASE_PLAN[cid] || []; const added = CH.touched().filter((c) => CH.st(c).camp === cid); return [...new Set([...base, ...added])]; };
  const campById = (cid) => (cid === "exp" ? EXP : CH.camp(cid));
  // A control's requests and determinations run once the plan revision that holds it is approved.
  const workable = (cid, code) => { const p = planOf(cid); return p.state === "approved" || (p.rev > 1 && !(p.adds || []).includes(code)); };
  const PLAN_STEPS = [["sca", "Lead assessor", LEAD, "approves the plan"], ["ao", "Authorizing official", AO, "concurs"]];
  const planWords = (cid) => {
    const p = planOf(cid);
    if (p.state === "approved") { const a = (p.steps || []).filter((s) => s.rev === p.rev); const ao = a.find((s) => s.k === "ao"); return `Version ${p.rev} · approved${ao ? " " + md(ao.at) : ""}`; }
    if (p.state === "review") return `Version ${p.rev} · draft · ${LEAD} approved, waits on ${AO}'s concurrence`;
    return `Version ${p.rev} · draft · waits on ${LEAD}'s approval and ${AO}'s concurrence`;
  };
  const planName = (cid) => { const c = campById(cid); return cid === "conmon" ? "Continuous monitoring plan — FY2027" : `${c ? c.title : "Campaign"} plan`; };

  // Which campaign holds a control: the walk's own, a plan's, or the expanded campaign's requests and second set [B17].
  function campaignOf(code) {
    const cid = CH.campOf(code);
    if (cid) {
      const c = CH.camp(cid); if (!c) return null;
      const s = CH.st(code), p = planOf(cid);
      const req = s.det && s.published ? "Accepted" : s.det || draftsOf(code).length ? "Judged · draft" : s.ready ? "Ready" : workable(cid, code) ? "Not ready" : "Waits on the plan's approval";
      return { id: cid, title: c.title, short: c.short, route: c.route, req, plan: p.state, holds: BASE_PLAN[cid] && BASE_PLAN[cid].includes(code) ? "plan" : "request" };
    }
    if (EXP_REQ[code] || INC2[code]) return { id: "exp", title: EXP.title, short: EXP.short, route: EXP.route, req: EXP_REQ[code] || (CH.inc2() ? "Accepted" : "Judged · draft"), plan: "approved", holds: "request" };
    return null;
  }

  // ════════════════ Result batches, by set [B16] ════════════════
  function results(prog) {
    if (prog && prog !== WSX) return undefined;
    const i2 = CH.inc2();
    const out = [
      { id: "init", title: "SAR · initial authorization", campaign: "WS-X90 Initial Authorization Security Assessment", state: "published", at: "2026-08-10", by: LEAD },
      { id: "exp1", title: "SAR · expanded set 1", campaign: EXP.title, state: "published", at: "2026-10-21", by: LEAD },
      { id: "exp2", title: i2 ? renameStr(i2.title) : "Interim results — expanded set 2", campaign: EXP.title, state: i2 ? "published" : "draft", at: i2 ? i2.at : null, by: i2 ? i2.by : null, n: 20 },
    ];
    for (const c of CH.camps()) {
      for (const r of R("res." + c.id, [])) out.push({ id: c.id + ":" + r.title, title: r.title, campaign: c.title, state: "published", at: r.at, by: r.by, rec: r.rec, n: r.n });
      const d = planCodes(c.id).filter((code) => draftsOf(code).length);
      if (d.length) out.push({ id: c.id + ":draft", title: `${c.short} results — draft`, campaign: c.title, state: "draft", n: d.length });
    }
    return out;
  }
  Object.assign(X.facts, { campaignOf: (code) => campaignOf(code), results: (prog) => results(prog) });

  // ════════════════ The campaign page, by objective [B18 B19 B20] ════════════════
  const reqPill = (cid, code) => {
    const s = CH.st(code), dr = draftsOf(code).length, pub = s.det && s.published;
    if (pub) return pill("ok", "Accepted");
    if (dr) return pill("none", "Judged · draft");
    if (!workable(cid, code)) return pill("none", "Waits on the plan");
    return s.ready ? pill("none", "Ready") : pill("none", "Not ready");
  };
  const why = (cid) => planOf(cid).state === "review" ? `Waits on ${AO}'s concurrence with plan version ${planOf(cid).rev}` : `Waits on plan version ${planOf(cid).rev}'s approval`;
  const sbtn = (label, attrs, ink = false) => `<span class="btn sm${ink ? " ink" : ""}" role="button" tabindex="0" ${attrs}>${esc(label)}</span>`;
  const offBtn = (label, reason) => `<span class="btn sm" role="button" tabindex="0" aria-disabled="true" title="${esc(reason)}">${esc(label)}</span>`;
  const methodTags = (ms) => ms.map((m) => tag(METHOD[m] || m)).join(" ");
  function objRows(cid) {
    const rows = [];
    for (const code of planCodes(cid)) {
      const s = objState(code), b = CH.base(code);
      for (const o of objectivesOf(code)) {
        const d = s[o.i];
        rows.push(`<tr tabindex="0" data-panel="a-tests-control" data-id="${esc(code)}"><td class="nm"><b>${esc(o.label)}</b><span class="v3r-ot">${esc(o.text)}${o.ex ? ' <span class="ex">Example</span>' : ""}</span></td><td>${tag(code)}</td><td>${methodTags(d && d.methods && d.methods.length ? d.methods : o.methods)}</td>`
          + `<td>${d && d.det ? CH.stPill(d.det) : mu("Not judged")}</td><td>${d && d.det ? mu(`${d.pub ? "Published" : "Draft"} · recorded as ${esc(d.by)}${d.rec && d.rec !== d.by ? ` by ${esc(d.rec)}` : ""}`) : DASH}</td>`
          + `<td class="v2k-act">${d && d.pub ? "" : workable(cid, code) && (CH.st(code).ready || d) ? sbtn("Record", `data-modal="v3r-det" data-id="${esc(cid + "|" + code + "|" + o.i)}" aria-label="Record determination for ${esc(o.label)}"`) : ""}</td></tr>`);
      }
      void b;
    }
    return rows;
  }
  function campaignPage(cid, html) {
    const c = CH.camp(cid); if (!c || !wsx()) return html;
    const p = planOf(cid), codes = planCodes(cid);
    const tab = V.get("chain.tab." + cid, "requests");
    const drafts = codes.filter((code) => draftsOf(code).length);
    const nObj = codes.reduce((a, code) => a + objectivesOf(code).length, 0);
    const pubs = R("res." + cid, []);
    // One primary: the plan's approval step while the plan waits, then Publish once draft determinations exist.
    let primary;
    if (p.state !== "approved") primary = `<span class="btn ink" role="button" tabindex="0" data-modal="v3r-plan" data-id="${esc(cid)}">${p.state === "review" ? "Record AO concurrence" : "Approve plan"}</span>`;
    else primary = `<span class="btn${drafts.length ? " ink" : ""}" role="button" tabindex="0" ${drafts.length ? `data-modal="v3r-publish" data-id="${esc(cid)}"` : 'aria-disabled="true" title="The draft results hold no determination yet"'}>Publish assessment results</span>`;
    const head = AK.recordHead({ crumbs: [["Assessments", "assessments"], [c.short]], title: c.title, actions: primary,
      facts: [["Status", pill("none", c.kind ? "Planned" : "Active")], ["Kind", c.kind || "Control assessment"], ["Window", `<span class="num">${md(c.from)} – ${mdy(c.to)}</span>`], ["Plan", esc(planWords(cid))], ["Lead assessor", AK.owner(c.lead || LEAD)], ["Owner", AK.owner(c.owner)]] });
    const tabs = AK.tabs([["Requests", codes.length, null, tab === "requests"], ["Objectives", nObj, null, tab === "objectives"], ["Results", pubs.length + (drafts.length ? 1 : 0), null, tab === "results"], ["Plan", p.rev, null, tab === "plan"]], "Campaign sections")
      .replace(/<span role="tab"([^>]*)>(Requests|Objectives|Results|Plan)/g, (m, a, l) => `<span role="tab"${a} tabindex="0" data-v2k-tab="${cid}|${l.toLowerCase()}">${l}`);
    const gate = p.state === "approved" && !(p.adds || []).length ? "" : `<p class="note-p v3r-gate">${p.state === "approved" ? `Plan version ${p.rev} adds ${(p.adds || []).map(esc).join(", ")}: ${esc(why(cid).toLowerCase())}. What version ${p.rev - 1} holds runs as approved.` : `Requests and determinations wait on the plan: ${esc(LEAD)}, the lead assessor, approves it and ${esc(AO)}, the authorizing official, concurs.`}</p>`;
    let body;
    if (tab === "objectives") {
      const rows = objRows(cid);
      body = `${gate}<div class="frame"><div class="tablebox"><table aria-label="Assessment objectives"><thead><tr><th>Objective</th><th>Control</th><th>Methods</th><th>Determination</th><th>Recorded</th><th aria-label="Actions"></th></tr></thead><tbody>${rows.join("")}</tbody></table></div><div class="pager"><span class="num">1–${rows.length} of ${rows.length}</span></div></div>`;
    } else if (tab === "results") {
      const lines = [
        ...pubs.slice().reverse().map((r) => `<div class="v2k-li">${AK.i("task")}<span class="x"><b>${esc(r.title)}</b><span class="v2k-sub">Published ${md(r.at)} by ${esc(r.by)}, lead assessor${r.rec && r.rec !== r.by ? ` · recorded as ${esc(r.by)} by ${esc(r.rec)}` : ""} · ${plural(r.objs || 0, "objective")} over ${plural(r.n, "control")}</span></span></div>`),
        ...(drafts.length ? [`<div class="v2k-li">${AK.i("pen")}<span class="x"><b>${esc(c.short)} results — set ${pubs.length + 1} · draft</b><span class="v2k-sub">${plural(drafts.reduce((a, code) => a + draftsOf(code).length, 0), "objective")} judged over ${plural(drafts.length, "control")} · decides nothing until ${esc(LEAD)} publishes</span></span></div>`] : []),
      ];
      body = lines.length ? `<div class="ak-card v2k-res">${lines.join("")}</div>` : AK.empty({ title: "No results yet", line: "Results join the campaign once an assessor records a determination on an objective." });
    } else if (tab === "plan") {
      const steps = (p.steps || []).slice().reverse().map((s) => `<div class="v2k-li">${AK.avatar(s.who, 22)}<span class="x"><b>${esc(s.who)}</b> ${esc(s.o === "return" ? "sent version " + s.rev + " back" : s.k === "sca" ? "approved version " + s.rev : "concurred with version " + s.rev)}<span class="v2k-sub">${esc(s.role)} · ${md(s.at)}${s.rec && s.rec !== s.who ? ` · recorded as ${esc(s.who)} by ${esc(s.rec)}` : ""}${s.note ? " · " + esc(s.note) : ""}</span></span></div>`);
      const revs = Array.from({ length: p.rev }, (_, k) => k + 1).reverse().map((r) => { const adds = r === 1 ? (BASE_PLAN[cid] || []).concat(codes.filter((x) => !(BASE_PLAN[cid] || []).includes(x) && !(p.hist || []).some((hh) => (hh.adds || []).includes(x)) && !(p.adds || []).includes(x))) : r === p.rev ? p.adds || [] : ((p.hist || []).find((hh) => hh.rev === r) || {}).adds || []; const st = r < p.rev || p.state === "approved" ? "Approved" : "Draft"; return `<tr><td class="nm">Version ${r}</td><td>${st === "Approved" ? pill("ok", st) : pill("none", st)}</td><td>${adds.length ? adds.map((x) => tag(x)).join(" ") : DASH}</td></tr>`; });
      body = `${gate}<div class="frame"><div class="tablebox"><table aria-label="Plan versions"><thead><tr><th>Version</th><th>State</th><th>Controls it adds</th></tr></thead><tbody>${revs.join("")}</tbody></table></div></div>${steps.length ? `<div class="ak-card v2k-res">${steps.join("")}</div>` : ""}`;
    } else {
      const rows = codes.map((code) => {
        const s = CH.st(code), b = CH.base(code), n = objectivesOf(code).length, j = judgedOf(code).length;
        const act = (s.det && s.published) ? "" : !workable(cid, code) ? offBtn(s.ready ? "Record determinations" : "Set Ready", why(cid)) : !s.ready && !draftsOf(code).length ? sbtn("Set Ready", `data-modal="v2k-ready" data-id="${esc(code)}"`) : sbtn("Record determinations", `data-modal="v3r-det" data-id="${esc(cid + "|" + code)}"`);
        return `<tr tabindex="0" data-panel="a-tests-control" data-id="${esc(code)}"><td class="nm">Evidence for ${esc(code)} ${esc(b.t)}</td><td>${tag(code)}</td><td>${esc(s.evTitle || (BASE_PLAN[cid] || []).includes(code) ? s.evTitle || `${code}'s accepted evidence` : "—")}</td><td>${reqPill(cid, code)}</td><td class="num">${fmt(j)} of ${fmt(n)}</td><td class="v2k-act">${act}</td></tr>`;
      });
      body = rows.length ? `${gate}<div class="frame"><div class="tablebox"><table aria-label="Requests"><thead><tr><th>Request</th><th>Control</th><th>Evidence</th><th>Status</th><th>Objectives judged</th><th aria-label="Actions"></th></tr></thead><tbody>${rows.join("")}</tbody></table></div><div class="pager"><span class="num">1–${rows.length} of ${rows.length}</span></div></div>`
        : `${gate}${AK.empty({ title: "No requests yet", line: "A control added from its own page joins the plan's next version and sends a request for its evidence here." })}`;
    }
    return h.page(head.replace(/<\/div>\s*$/, `${tabs}</div>`), body);
  }
  S1(/^campaign-(conmon|new-\d+)$/, (orig, route) => { const m = /^campaign-(conmon|new-(\d+))$/.exec(route); const cid = m[1] === "conmon" ? "conmon" : "new" + m[2]; return campaignPage(cid, orig()); });

  // ════════════════ Dialogs: approve the plan, record by objective, publish as the lead assessor ════════════════
  const ro = U.ro, desc = U.desc, F = U.F, area = U.area, inp = U.inp, choose = U.choose, radios = U.radios, fld = U.fld;
  const prim = (label, act, id) => `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v2-wired data-v3r="${esc(act)}" data-id="${esc(id || "")}">${esc(label)}</button>`;
  X.M("v3r-plan", (orig, cid) => {
    const p = planOf(cid), k = p.state === "review" ? 1 : 0, [, role, who, verb] = PLAN_STEPS[k];
    const codes = planCodes(cid), nObj = codes.reduce((a, code) => a + objectivesOf(code).length, 0);
    return { title: k ? "Record the AO's concurrence" : "Approve assessment plan", body: `${desc(`Step ${k + 1} of 2 · <b>${esc(who)}</b>, ${esc(role.toLowerCase())}, ${esc(verb)}: <b>${esc(planName(cid))} · version ${p.rev}</b>, ${plural(codes.length, "control")} as ${plural(nObj, "assessment objective")}${p.rev > 1 ? `; it adds ${(p.adds || []).map(esc).join(", ") || "nothing"} to version ${p.rev - 1}` : ""}.`)}
      <ol class="v2k-steps">${PLAN_STEPS.map(([, r, w], i) => `<li><span class="v2k-n">${i + 1}</span>${AK.avatar(w, 22)}<b>${esc(w)}</b><span class="v2k-mu">${esc(r)}${i < k ? " · done" : ""}</span></li>`).join("")}</ol>
      ${fld("Decision", radios("dec", k ? [["approve", "Concur", "The plan is approved; requests and determinations run"], ["return", "Send back", "Returns the plan to the lead assessor"]] : [["approve", "Approve", `Passes it to ${esc(AO)} for concurrence`], ["return", "Send back", "Returns the plan to the campaign's owner"]], ""), { req: true })}
      ${F("Comment", area("note", "Required when sending back"), { hint: "Required when sending back." })}
      <p class="note-p">The prototype records it as ${esc(who)}, who holds the step; it says so wherever the approval shows.</p>`, footer: prim("Record decision", "plan", cid) };
  });
  // Record determinations for a control: one row an objective, each with the methods used and its determination.
  function detDialog(cid, code, focus) {
    const s = objState(code), objs = objectivesOf(code), b = CH.base(code);
    const opts = [["", "Not judged"], ["satisfied", "Satisfied"], ["partially_satisfied", "Partially satisfied"], ["other_than_satisfied", "Other than satisfied"]];
    const rows = objs.map((o) => {
      const d = s[o.i] || {}, frozen = !!d.pub, ms = d.methods && d.methods.length ? d.methods : o.methods;
      if (frozen) return `<div class="v3r-orow done"><div class="v3r-ol"><b>${esc(o.label)}</b><span>${esc(o.text)}</span></div><div class="v3r-ov">${CH.stPill(d.det)} ${mu(`Published · ${methodTags(ms)}`)}</div></div>`;
      const sel = choose(`d.${o.i}`, opts, d.det || "");
      return `<fieldset class="v3r-orow${String(o.i) === String(focus) ? " focus" : ""}"><legend class="v3r-ol"><b>${esc(o.label)}</b><span>${esc(o.text)}${o.ex ? ' <span class="ex">Example</span>' : ""}</span></legend>
        <div class="v3r-om" role="group" aria-label="Methods for ${esc(o.label)}">${Object.entries(METHOD).map(([k, l]) => `<label class="v3r-ck"><input type="checkbox" name="m.${o.i}.${k}"${ms.includes(k) ? " checked" : ""}> ${l}</label>`).join("")}</div>
        <div class="v3r-od"><label class="v3r-sr" for="${sel.id}">Determination for ${esc(o.label)}</label>${sel.html}<input class="v2k-in" type="text" name="n.${o.i}" value="${esc(d.note || "")}" placeholder="Rationale, required short of satisfied" aria-label="Rationale for ${esc(o.label)}" autocomplete="off"></div></fieldset>`;
    });
    const byNow = Object.values(s).map((x) => x && x.by).filter(Boolean)[0] || ASSESSOR;
    return { title: `Record determinations for ${code}`, body: `${desc(`${esc(code)} ${esc(b.t)} counts ${plural(objs.length, "assessment objective")}. Judge each with the methods used; the control's determination is the worst of its objectives once every one is judged, and nothing decides until ${esc(LEAD)} publishes.`)}
      <div class="v3r-orows">${rows.join("")}</div>
      ${F("Recorded as", choose("by", [[ASSESSOR, `${ASSESSOR} · Assessor`], [LEAD, `${LEAD} · Lead assessor`]], byNow), { hint: `You record it for the assessor named; the draft says "recorded as ${esc(byNow)}".` })}`, footer: prim("Record determinations", "det", `${cid}|${code}`) };
  }
  X.M("v3r-det", (orig, id) => { const [cid, code, focus] = String(id || "").split("|"); return detDialog(cid, code, focus); });
  // v2's own Record determination (one value a control) becomes the objective rows wherever it is opened.
  X.M("v2k-det", (orig, code) => { if (!wsx()) return orig(); const cid = CH.campOf(code) || "conmon"; return detDialog(cid, code); });
  X.M("v2k-ready", (orig, code) => { const o = orig(); const cid = CH.campOf(code); if (!cid || workable(cid, code)) return o; return { title: "Set Ready", body: `${desc(`The request for ${esc(code)}'s evidence goes to the assessor once ${esc(planName(cid))} version ${planOf(cid).rev} is approved.`)}<p class="note-p">${esc(why(cid))}.</p>`, footer: `<button type="button" class="btn" data-close-modal>Close</button><button type="button" class="btn ink" aria-disabled="true" data-v2-wired title="${esc(why(cid))}">Set Ready</button>` }; });
  function publishDialog(cid) {
    const c = campById(cid), codes = planCodes(cid).filter((code) => draftsOf(code).length);
    const nObj = codes.reduce((a, code) => a + draftsOf(code).length, 0);
    const lines = codes.map((code) => { const d = allJudged(code) ? derived(code) : null; return `<li>${tag(code)} ${d ? `${CH.stPill(d)}${d !== "satisfied" ? " " + mu("opens an operational issue") : ""}` : mu(`${judgedOf(code).length} of ${objectivesOf(code).length} objectives judged · stays Not assessed`)}</li>`; }).join("");
    const setN = R("res." + cid, []).length + 1;
    return { title: "Publish assessment results", body: `${desc(`<b>${esc(c.title)}</b>'s draft results hold ${plural(nObj, "objective determination")} over ${plural(codes.length, "control")}.`)}
      <ul class="v3r-pl">${lines}</ul>
      ${desc("Publishing freezes them. A control whose objectives are all judged takes the worst of them; one judged in part stays Not assessed. Each control determination short of satisfied opens an operational issue.")}
      ${F("Results title", inp("title", "Name the results", { value: `${c.short} results — set ${setN}` }), { req: true })}
      ${ro("Publishes", `${AK.owner(LEAD)} ${mu("Lead assessor")}`)}
      <p class="note-p">Only the lead assessor publishes. The prototype records it as ${esc(LEAD)}, who holds the role; the results say so.</p>`, footer: prim("Publish assessment results", "publish", cid) };
  }
  X.M("v3r-publish", (orig, cid) => publishDialog(cid));
  X.M("v2k-publish", (orig, cid) => (wsx() ? publishDialog(cid || "conmon") : orig()));

  // ════════════════ What the dialogs do ════════════════
  const slug = (code) => code.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const openIssues = () => (PA.riskLookup ? PA.riskLookup.all().ISS : []);
  // An open operational issue already standing for a control: the chain's, or one of WS-X90's own that names it.
  const issueFor = (code) => CH.issues().find((i) => i.ctl === code) || openIssues().find((i) => !i.chain && (i.from || []).some((f) => f[0] === code)) || null;
  // One publish rule: a determination short of satisfied opens an operational issue unless one is open for the control already.
  function openIssue(code, det, cid, short) {
    if (det === "satisfied" || det === "not_assessed" || issueFor(code)) return false;
    const b = CH.base(code);
    CH.push("issues", { id: "v2k-iss-" + slug(code), ctl: code, sev: det === "other_than_satisfied" ? "high" : "moderate", opened: TODAY_ISO, camp: cid, title: `${code} ${b.t} judged ${ST[det][1].toLowerCase()} (${short})` });
    return true;
  }
  const ACT = {
    plan(cid, o) {
      const p = planOf(cid), k = p.state === "review" ? 1 : 0, [key, role, who] = PLAN_STEPS[k];
      if (o.dec === "return" && !o.note) return "Comment is required when sending back.";
      const steps = [...(p.steps || []), { k: key, role, who, o: o.dec, note: o.note || "", at: TODAY_ISO, rec: ME, rev: p.rev }];
      if (o.dec === "return") { Rset("plan." + cid, { ...p, state: "draft", steps }); return [`Plan version ${p.rev} sent back by ${who}`, null]; }
      if (!k) { Rset("plan." + cid, { ...p, state: "review", steps }); return [`${LEAD} approved plan version ${p.rev}; it waits on ${AO}'s concurrence`, null]; }
      Rset("plan." + cid, { ...p, state: "approved", steps, adds: [], hist: [...(p.hist || []), { rev: p.rev, adds: p.adds || [], at: TODAY_ISO }] });
      return [`Plan version ${p.rev} approved: ${AO} concurred, and its requests and determinations run`, null];
    },
    det(id, o) {
      const [cid, code] = id.split("|"); const objs = objectivesOf(code), s = Object.assign({}, objState(code));
      let n = 0;
      for (const ob of objs) {
        if (s[ob.i] && s[ob.i].pub) continue;
        const det = o["d." + ob.i], note = o["n." + ob.i] || "";
        if (!det) { delete s[ob.i]; continue; }
        const methods = Object.keys(METHOD).filter((k) => o[`m.${ob.i}.${k}`]);
        if (!methods.length) return `Methods are required for ${ob.label}: choose at least one.`;
        if (det !== "satisfied" && !note) return `Rationale is required for ${ob.label}, short of satisfied.`;
        s[ob.i] = { det, methods, note, by: o.by || ASSESSOR, rec: ME, at: TODAY_ISO };
        n++;
      }
      if (!n && !objs.some((ob) => s[ob.i] && s[ob.i].pub)) return "Recorded as: judge at least one objective first.";
      Rset("obj." + code, s);
      // The control's draft determination, in v2's own shape, once every objective is judged; a draft decides nothing.
      const d = derived(code), cur = CH.st(code);
      if (d && !cur.published) CH.put(code, { det: d, detNote: `The worst of its ${objs.length} objectives`, detBy: o.by || ASSESSOR, detAt: TODAY_ISO });
      else if (!d && cur.det && !cur.published) CH.put(code, { det: null });
      const j = judgedOf(code).length;
      return [`${plural(n, "objective")} of ${code} recorded as ${o.by || ASSESSOR} in the draft results${j === objs.length ? `; all ${objs.length} judged, ${ST[d][1].toLowerCase()} once published` : `; ${j} of ${objs.length} judged, Not assessed until all are`}`, null];
    },
    publish(cid, o) {
      const c = campById(cid), codes = planCodes(cid).filter((code) => draftsOf(code).length);
      if (!codes.length) return "The draft results hold no determination yet.";
      let opened = 0, objs = 0, decided = 0;
      for (const code of codes) {
        const s = Object.assign({}, objState(code));
        for (const ob of draftsOf(code)) { s[ob.i] = { ...s[ob.i], pub: { at: TODAY_ISO, cid, by: LEAD } }; objs++; }
        Rset("obj." + code, s);
        const d = derived(code);
        if (d) { decided++; CH.put(code, { det: d, detNote: `The worst of its ${objectivesOf(code).length} objectives`, detBy: LEAD, detAt: TODAY_ISO, published: true, pubAt: TODAY_ISO }); if (openIssue(code, d, cid, c.short)) opened++; }
      }
      V.set("chain.results." + cid, { title: o.title, at: TODAY_ISO, by: LEAD, n: codes.length });
      Rset("res." + cid, [...R("res." + cid, []), { title: o.title, at: TODAY_ISO, by: LEAD, rec: ME, n: codes.length, objs }]);
      const last = CH.issues()[CH.issues().length - 1];
      return [`${o.title} published by ${LEAD}: ${plural(objs, "objective")} over ${plural(codes.length, "control")}, ${decided} decided${opened ? `, ${plural(opened, "operational issue")} opened` : ""}`, opened && last ? { label: "Open the issue", go: ["findings", { open: { kind: "a-risk-issue", id: last.id } }] } : { label: "Open Controls", route: "controls" }];
    },
    inc2(_, o) {
      V.set("chain.inc2", { title: o.title, at: TODAY_ISO, by: LEAD });
      let opened = 0;
      for (const [code, det] of Object.entries(INC2)) if (openIssue(code, det, "exp", "expanded set 2")) opened++;
      return [`Expanded set 2 published by ${LEAD}: 20 determinations now decide WS-X90's control statuses${opened ? `, ${plural(opened, "operational issue")} opened` : ""}`, { label: "Open Findings", route: "findings" }];
    },
  };
  document.addEventListener("click", (e) => {
    if (!on()) return;
    const b = e.target && e.target.closest ? e.target.closest("#modal [data-v3r]") : null;
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (b.getAttribute("aria-disabled") === "true") return;
    const dlg = b.closest(".dlg"); if (!dlg || !U.check(dlg)) return;
    const fn = ACT[b.dataset.v3r]; if (!fn) return;
    const out = fn(b.dataset.id || "", U.vals(dlg), dlg);
    if (typeof out === "string") {
      dlg.querySelectorAll(".v2k-err").forEach((x) => x.remove());
      const lab = out.split(/[:,]/)[0].replace(/^(Methods|Rationale) are? required for /, "").replace(/^(Methods|Rationale) is required for /, "");
      const row = [...dlg.querySelectorAll(".v3r-orow")].find((r) => txt(r.querySelector(".v3r-ol b")) === lab);
      const f = row || [...dlg.querySelectorAll(".v2k-f")].find((x) => out.startsWith(txt(x.querySelector("label")).replace(/\s*Required\s*/i, ""))) || dlg.querySelector(".v2k-f:last-of-type") || dlg.querySelector(".dlg-b, .dlg-body") || dlg;
      f.insertAdjacentHTML("beforeend", `<span class="v2k-err" role="alert">${esc(out)}</span>`);
      const ctl = f.querySelector(/Methods/.test(out) ? "input[type=checkbox]" : /Rationale/.test(out) ? "input[type=text], textarea" : "select, input, textarea"); if (ctl) { ctl.setAttribute("aria-invalid", "true"); ctl.focus(); }
      return;
    }
    U.closeDlg();
    setTimeout(() => { V.redraw(); if (out && out[2]) out[2](); if (out && out[0]) V.toast(out[0], out[1] || undefined); }, 0);
  }, true);

  // ════════════════ B21 B16 B20: the expanded set's second results, under the one publish rule ════════════════
  X.M("a-tests-publish", (orig) => {
    if (!wsx()) return renameObj(orig());
    const i2 = CH.inc2();
    const short = Object.entries(INC2).filter(([, d]) => d === "partially_satisfied" || d === "other_than_satisfied");
    const lines = short.map(([code, d]) => { const i = issueFor(code); return `<li>${tag(code)} ${CH.stPill(d)} ${mu(i && !(i2 && i.camp === "exp") ? "an operational issue is open for it already" : i2 ? "operational issue opened" : "opens an operational issue")}</li>`; }).join("");
    return { title: "Publish assessment results", body: `${desc("<b>Interim results — expanded set 2</b> holds 20 findings: 13 satisfied, 4 partially, 1 other than satisfied and 2 not assessed.")}
      ${desc("Publishing freezes them. WS-X90's control statuses and traces read them from then on, and each determination short of satisfied opens an operational issue, as every campaign's results do:")}
      <ul class="v3r-pl">${lines}</ul>
      ${F("Results title", inp("title", "Name the results", { value: "Security assessment report — expanded set 2" }), { req: true })}
      ${ro("Publishes", `${AK.owner(LEAD)} ${mu("Lead assessor")}`)}
      <p class="note-p">Only the lead assessor publishes. The prototype records it as ${esc(LEAD)}, who holds the role.</p>`,
      footer: i2 ? `<button type="button" class="btn" data-close-modal>Close</button><button type="button" class="btn ink" aria-disabled="true" title="Published already">Published ${esc(md(i2.at))}</button>` : prim("Publish assessment results", "inc2", "") };
  });

  // ════════════════ B17: a control names the campaign that holds it ════════════════
  function holdFix(body, code) {
    if (typeof body !== "string" || !wsx()) return body;
    const c = campaignOf(code); if (!c) return body;
    const word = c.req === "Waits on the plan's approval" ? "waits on the plan's approval" : `request ${c.req.toLowerCase()}`;
    return body
      .replace(/(<dt>Campaign<\/dt><dd>)<span class="v2-dash"[^>]*>—<\/span>/, `$1<span class="ak-link" ${goAttr(c.route)}>${esc(c.short)}</span> ${mu("· " + esc(word))}`)
      .replace(/(<dt>Campaign<\/dt><dd><span class="ak-link"[^>]*>[^<]*<\/span>)(?!\s*<span class="v2k-mu">)/, `$1 ${mu("· " + esc(word))}`)
      .replace(/<span class="btn([^"]*)" role="button" tabindex="0" data-modal="v2k-addcamp" data-id="[^"]*">Add to assessment campaign<\/span>/g, (m, cls) => `<span class="btn${cls}" ${goAttr(c.route)}>Open assessment campaign</span>`)
      .replace(/(<div><dt>Determined by<\/dt><dd>[\s\S]*?<\/dd><\/div>)(?![\s\S]*<dt>Campaign<\/dt>)/, `$1<div><dt>Campaign</dt><dd><span class="ak-link" ${goAttr(c.route)}>${esc(c.short)}</span> ${mu("· " + esc(word))}</dd></div>`)
      .replace(/(<div class="ak-rail-t">Next step<\/div><p class="v2r-p">)Add to assessment campaign(<\/p>)/, `$1<span class="ak-link" ${goAttr(c.route)}>Open assessment campaign</span>$2`)
      .replace(/<p class="v2k-none">No assessment has judged [^<]*<\/p>/, `<p class="v2k-none">${esc(c.short)} holds ${esc(code)}: its evidence request is ${esc(c.req.toLowerCase())}, and nobody has judged it yet.</p>`);
  }
  // A control with objectives judged in this session counts them in its Objectives line.
  function objFix(body, code) {
    if (typeof body !== "string") return body;
    const j = judgedOf(code).length; if (!j || CH.st(code).published) return body;
    return body.replace(/(\d[\d,]*) assessed(<\/dd>)/, `${fmt(j)} judged in draft$2`);
  }
  X.P("a-tests-control", (orig, id) => { const o = orig(); if (!o) return o; const code = String(id || "").split("|")[0] || "SA-24"; return renameObj({ ...o, body: objFix(holdFix(o.body, code), code) }); });
  S1(/^rec--a-tests-control--/, (orig, route) => { const html = orig(); let code = route.replace(/^rec--a-tests-control--/, "").split("|")[0]; try { code = decodeURIComponent(code); } catch (e) { /* as is */ } return objFix(holdFix(html, code), code); });

  // Add to assessment campaign: a campaign that holds the control already is named, and an approved plan takes it in its next version.
  X.M("v2k-addcamp", (orig, code) => {
    if (!wsx()) return orig();
    const c = CH.view(code || "SA-24"), held = campaignOf(c.code);
    if (held) return { title: "Add to assessment campaign", body: `${desc(`<b>${esc(held.title)}</b> holds ${esc(c.code)} already: its evidence request is ${esc(held.req.toLowerCase())}. Adding it to another campaign would assess it twice.`)}`, footer: `<button type="button" class="btn" data-close-modal>Close</button><button type="button" class="btn ink" data-v2-wired ${goAttr(held.route)}>Open assessment campaign</button>` };
    const opts = CH.camps().map((x) => { const p = planOf(x.id); return [x.id, x.title, p.state === "approved" ? `Plan version ${p.rev} is approved: ${esc(c.code)} joins version ${p.rev + 1}, a draft that waits on approval` : `Plan version ${p.rev} · draft · ${esc(c.code)} joins it before approval`]; });
    opts.push(["exp", EXP.title, "Its plan is published and approved; it takes no new control in this window", true]);
    return { title: "Add to assessment campaign", body: `${desc(`${esc(c.code)} joins the campaign's plan as its ${c.ob} assessment objectives, and a request for its evidence goes to the program team once that plan version is approved.`)}
      ${fld("Campaign", radios("camp", opts, ""), { req: true })}
      <p class="note-p">No campaign fits? <span class="ak-link" role="button" tabindex="0" data-modal="v2k-plan" data-id="${esc(c.code)}">Plan an assessment</span> around ${esc(c.code)} instead.</p>`, footer: prim("Add to assessment campaign", "addcamp", c.code) };
  });
  ACT.addcamp = (code, o) => {
    const c = CH.camp(o.camp); if (!c) return "Campaign is required.";
    CH.put(code, { camp: o.camp, campAt: TODAY_ISO });
    const p = planOf(o.camp);
    if (p.state === "approved") { Rset("plan." + o.camp, { ...p, rev: p.rev + 1, state: "draft", adds: [code] }); return [`${CH.base(code).ob} objectives of ${code} added to ${c.title}'s plan version ${p.rev + 1}, a draft that waits on approval`, { label: "Open campaign", route: c.route }]; }
    if (p.rev > 1) Rset("plan." + o.camp, { ...p, adds: [...new Set([...(p.adds || []), code])] });
    return [`${CH.base(code).ob} objectives of ${code} added to ${c.title}'s draft plan version ${p.rev}`, { label: "Open campaign", route: c.route }];
  };

  // ════════════════ C13: Assign owner, Deactivate, Change planned date and Link ATT&CK technique save ════════════════
  // The registers draw from their own records; V3's answer is read through each record's field while V3 is on (v2 reads its own).
  const regs = () => (PA.riskLookup ? PA.riskLookup.all() : { ISS: [], RISKS: [], POAM: [] });
  const OVR = typeof Symbol === "function" ? Symbol("v3r") : "__v3r";
  function overlay(r, field, read) {
    if (!r || r.chain) return;
    if (!r[OVR]) Object.defineProperty(r, OVR, { value: {}, enumerable: false });
    if (r[OVR][field]) return; r[OVR][field] = true;
    let val = r[field];
    Object.defineProperty(r, field, { configurable: true, enumerable: true, get() { if (!on()) return val; const o = read(r, val); return o === undefined ? val : o; }, set(v) { val = v; } });
  }
  const ownerOf = (kind, id) => { const v = V.get(`v3.R.own.${kind}.${id}`, null); return v === null || v === undefined ? undefined : v; };
  const techAdd = (id) => R("tech." + id, []);
  (function install() {
    const L = regs();
    L.RISKS.forEach((r) => { overlay(r, "owner", (x) => ownerOf("risk", x.id)); overlay(r, "tech", (x, v) => { const add = techAdd(x.id).filter((t) => !(v || []).some((y) => y[0] === t[0])); return add.length ? [...(v || []), ...add] : undefined; }); });
    L.ISS.forEach((i) => overlay(i, "owner", (x) => ownerOf("issue", x.id)));
    L.POAM.forEach((p) => { overlay(p, "owner", (x) => ownerOf("poam", x.id)); overlay(p, "planned", (x) => { const m = R("planned." + x.id, null); return m ? m.to : undefined; }); });
  })();
  const deact = () => R("deact", {}) || {};
  // A deactivated issue leaves the open issues: the register's list and every count read from it.
  (function () {
    const L = regs(); const A = L.ISS;
    if (!A || A.__v3rSplice) return;
    const sp = A.splice;
    Object.defineProperty(A, "splice", { configurable: true, writable: true, enumerable: false, value: function () { const r = sp.apply(this, arguments); if (on()) { const d = deact(); for (let k = this.length - 1; k >= 0; k--) if (this[k] && d[this[k].id]) sp.call(this, k, 1); } return r; } });
    Object.defineProperty(A, "__v3rSplice", { value: true, enumerable: false });
  })();
  const people = () => { const L = X.fact("people", WSX); return L && L.length ? L.map((p) => [p.name, p.role]) : U.PEOPLE; };
  const NOUN = { risk: ["risk", "risks"], issue: ["operational issue", "operational issues"], poam: ["POA&M item", "POA&M items"] };
  function targets(id, kinds = ["risk", "issue", "poam"]) {
    const s = String(id || "").replace(/&amp;/g, "&"), L = regs();
    const lists = { risk: L.RISKS, issue: L.ISS, poam: L.POAM };
    const m = /^(\d+) (risk|finding|POA&M item)s?$/.exec(s);
    if (m) {
      const kind = m[2] === "risk" ? "risk" : m[2] === "finding" ? "issue" : "poam";
      const ids = [...document.querySelectorAll('#main [data-arsel][aria-checked="true"]')].map((e) => e.dataset.arid).filter((x) => x && x !== "*");
      return ids.map((x) => lists[kind].find((r) => r.id === x || r.id === x.split("|")[0])).filter(Boolean).map((r) => ({ kind, id: r.id, title: r.title, chain: !!r.chain }));
    }
    const ids = s.split(",").filter(Boolean);
    const out = [];
    for (const x of ids) for (const kind of kinds) { const r = lists[kind].find((y) => y.id === x || y.title === x); if (r) { out.push({ kind, id: r.id, title: r.title, chain: !!r.chain }); break; } }
    if (!out.length) for (const kind of kinds) { const r = lists[kind].find((y) => y.title === s); if (r) return [{ kind, id: r.id, title: r.title, chain: !!r.chain }]; }
    return out;
  }
  const many = (T) => { const k = T[0].kind; return T.length === 1 ? `<b>${esc(T[0].title)}</b>` : plural(T.length, NOUN[k][0], NOUN[k][1]); };
  const listOf = (T) => (T.length > 1 ? `<ul class="v3r-pl">${T.slice(0, 5).map((t) => `<li>${esc(t.title)}</li>`).join("")}${T.length > 5 ? `<li>${mu(`and ${T.length - 5} more`)}</li>` : ""}</ul>` : "");
  const enc = (T) => T.map((t) => `${t.kind}:${t.id}`).join(",");
  const dec = (s) => String(s || "").split(",").filter(Boolean).map((x) => { const k = x.indexOf(":"); return { kind: x.slice(0, k), id: x.slice(k + 1) }; });
  const clearSel = () => { const d = document.querySelector("#main [data-ardesel]"); if (d) d.click(); };
  X.M("a-risk-owner", (orig, id) => {
    const T = wsx() ? targets(id) : []; if (!T.length) return orig();
    const cur = T.length === 1 ? (regs()[{ risk: "RISKS", issue: "ISS", poam: "POAM" }[T[0].kind]].find((r) => r.id === T[0].id) || {}).owner || "" : "";
    return { title: "Assign owner", body: `${desc(`Give ${many(T)} one owner, a person or an organization. It replaces any owner ${T.length === 1 ? "it has" : "they have"} now, and every page that shows ${T.length === 1 ? "its owner" : "their owners"} follows.`)}${listOf(T)}
      ${F("Owner", choose("owner", [...people().map(([n, r]) => [n, `${n} · ${r}`]), ["-", "No owner"]], cur, "Choose a person"), { req: true })}`, footer: prim("Assign owner", "owner", enc(T)) };
  });
  ACT.owner = (ids, o) => {
    const T = dec(ids), name = o.owner === "-" ? "" : o.owner;
    for (const t of T) {
      const cl = t.kind === "risk" ? "risks" : t.kind === "poam" ? "poams" : null, L = cl ? CH.list(cl) : [];
      if (cl && L.some((x) => x.id === t.id)) V.set("chain." + cl, L.map((x) => (x.id === t.id ? { ...x, owner: name } : x)));
      else Rset(`own.${t.kind}.${t.id}`, name);
    }
    const k = T[0] ? T[0].kind : "risk";
    return [name ? `${name} owns ${plural(T.length, NOUN[k][0], NOUN[k][1])} now` : `${plural(T.length, NOUN[k][0], NOUN[k][1])} ${T.length === 1 ? "has" : "have"} no owner now`, null, clearSel];
  };
  X.M("a-risk-deactivate", (orig, id) => {
    const T = wsx() ? targets(id, ["issue"]) : []; if (!T.length) return orig();
    return { title: T.length > 1 ? `Deactivate ${T.length} findings` : "Deactivate finding", body: `${desc(`${many(T)} ${T.length === 1 ? "leaves" : "leave"} the open operational issues and ${T.length === 1 ? "its" : "their"} remediation deadline; the Deactivated tab and the issue's history keep ${T.length === 1 ? "it" : "them"} with the reason.`)}${listOf(T)}
      ${F("Reason", choose("reason", [["na", "Not applicable to this system"], ["fp", "False positive"], ["dup", "Duplicate of another issue"], ["inh", "Inherited and answered by the provider"]], "na"), { req: true })}
      ${F("Why", area("note", "What shows it, in a sentence or two; it stays in the history"), { req: true })}`, footer: prim(T.length > 1 ? `Deactivate ${T.length} findings` : "Deactivate finding", "deact", enc(T)) };
  });
  const REASON = { na: "Not applicable to this system", fp: "False positive", dup: "Duplicate of another issue", inh: "Inherited and answered by the provider" };
  ACT.deact = (ids, o) => {
    const T = dec(ids), d = Object.assign({}, deact());
    T.forEach((t) => { d[t.id] = { reason: REASON[o.reason] || o.reason, note: o.note, at: TODAY_ISO, by: ME }; });
    Rset("deact", d);
    return [`${plural(T.length, "operational issue")} deactivated: ${REASON[o.reason] || o.reason}`, { label: "Open Findings", route: "findings" }, clearSel];
  };
  const addDays = (iso, n) => { const d = new Date(String(iso).slice(0, 10) + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  X.M("a-risk-ms-move", (orig, id) => {
    const T = wsx() ? targets(id, ["poam"]) : []; if (!T.length) return orig();
    const L = regs().POAM, first = L.find((p) => p.id === T[0].id) || {};
    const from = first.planned || TODAY_ISO;
    return { title: "Change planned date", body: `${desc(`${many(T)}: the new planned completion replaces the one ${T.length === 1 ? "it has" : "they have"} now. The change and its reason stay in the item's history and the eMASS export.`)}${listOf(T)}
      ${T.length === 1 ? ro("Planned now", `<span class="num">${esc(mdy(from))}</span>`) : ""}
      ${F("New planned date", inp("to", "", { type: "date", value: addDays(from < TODAY_ISO ? TODAY_ISO : from, 30) }), { req: true })}
      ${F("Reason for the change", area("reason", "Why the date moves"), { req: true })}`, footer: prim("Change planned date", "planned", enc(T)) };
  });
  ACT.planned = (ids, o) => {
    const T = dec(ids);
    for (const t of T) {
      const L = CH.list("poams");
      if (L.some((x) => x.id === t.id)) V.set("chain.poams", L.map((x) => (x.id === t.id ? { ...x, planned: o.to } : x)));
      else { const p = regs().POAM.find((x) => x.id === t.id); Rset("planned." + t.id, { to: o.to, from: p ? p.planned : null, reason: o.reason, at: TODAY_ISO, by: ME }); }
    }
    return [`Planned completion moved to ${mdy(o.to)} for ${plural(T.length, "POA&M item")}`, null, clearSel];
  };
  const TECHS = () => { const m = new Map(); regs().RISKS.forEach((r) => (r.tech || []).forEach(([c, n]) => { if (!m.has(c)) m.set(c, n); })); return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])); };
  X.M("v7a-att-link", (orig, id) => {
    if (!wsx()) return orig();
    const L = regs().RISKS.filter((r) => !r.chain);
    return { title: "Link ATT&CK technique", body: `${desc("A risk names the techniques it concerns; the countering controls then show what WS-X90 holds against it.")}
      ${F("Risk", choose("risk", L.map((r) => [r.id, r.title]), id && L.some((r) => r.id === id) ? id : "", "Choose one of WS-X90's open risks"), { req: true })}
      ${F("Technique", choose("tech", TECHS().map(([c, n]) => [c, `${c} ${n}`]), "", "Choose an ATT&CK technique"), { req: true, hint: "Appendix F for Enterprise, Appendix G for ICS" })}`, footer: prim("Link technique", "tech", "") };
  });
  ACT.tech = (_, o) => {
    const r = regs().RISKS.find((x) => x.id === o.risk); if (!r) return "Risk is required.";
    if ((r.tech || []).some((t) => t[0] === o.tech)) return `Technique: ${r.title} names ${o.tech} already.`;
    const n = (TECHS().find((t) => t[0] === o.tech) || [o.tech, o.tech])[1];
    Rset("tech." + r.id, [...techAdd(r.id), [o.tech, n]]);
    return [`${o.tech} ${n} linked to ${r.title}`, { label: "Open risk", go: ["risks", { open: { kind: "a-risk-risk", id: r.id + "|overview" } }] }];
  };
  // The findings register leaves out what was deactivated; its Deactivated tab counts them.
  const deactTab = (root, n) => { for (const t of root.querySelectorAll("[role='tab']")) if (/^Deactivated/.test(txt(t))) { const c = t.querySelector(".ct, .num"); if (c) c.textContent = fmt(n); else t.insertAdjacentHTML("beforeend", `<span class="ct num">${fmt(n)}</span>`); } };
  S1(/^(findings|after-findings-deadlines)$/, (orig) => {
    const html = orig(); const d = deact(); const ids = Object.keys(d); if (!ids.length || !wsx()) return html;
    return edit(html, (root) => {
      for (const tr of root.querySelectorAll("tr[data-id]")) { const k = String(tr.getAttribute("data-id")).split("|")[0]; if (d[k]) tr.remove(); }
      deactTab(root, ids.length);
    });
  });
  // The Deactivated tab lists what was deactivated, with its reason, in place of "Nothing is deactivated".
  S1(/^(findings-deactivated|findings-deadlines-deactivated|after-findings-deadlines-deactivated)$/, (orig) => {
    const html = orig(); const d = deact(); const ids = Object.keys(d); if (!ids.length || !wsx()) return html;
    const all = PA.riskLookup ? X.force(false, () => PA.riskLookup.all().ISS.slice()) : [];
    return edit(html, (root) => {
      deactTab(root, ids.length);
      const empty = [...root.querySelectorAll("div, section")].filter((e) => /^Nothing is deactivated/.test(txt(e)) && !e.querySelector("table")).pop();
      if (!empty) return;
      const rows = ids.map((k) => { const i = all.find((x) => x.id === k) || { title: k, sev: "moderate" }; const x = d[k]; return `<tr tabindex="0" data-panel="a-risk-issue" data-id="${esc(k)}"><td class="nm">${esc(i.title)}</td><td>${h.sevPill ? h.sevPill(i.sev) : esc(i.sev)}</td><td>${esc(x.reason)}</td><td>${esc(x.note || "")}</td><td>${mu(`${esc(md(x.at))} · ${esc(x.by)}`)}</td></tr>`; }).join("");
      const box = document.createElement("div");
      box.innerHTML = `<div class="frame"><div class="tablebox"><table aria-label="Deactivated findings"><thead><tr><th>Finding</th><th>Severity</th><th>Reason</th><th>Why</th><th>Deactivated</th></tr></thead><tbody>${rows}</tbody></table></div><div class="pager"><span class="num">1–${ids.length} of ${ids.length}</span></div></div>`;
      empty.replaceWith(box.firstElementChild);
    });
  });
  // Pages that count the risks nobody owns read the register.
  const ownerLine = (html) => {
    if (typeof html !== "string" || !/40 open risks/.test(html)) return html;
    const r = X.fact("risks", WSX); if (!r) return html;
    return html.replace(/Give an owner to 40 open risks/g, r.noOwner ? `Give an owner to ${fmt(r.noOwner)} open risk${r.noOwner === 1 ? "" : "s"}` : "Every open risk has an owner")
      .replace(/40 open risks with no owner/g, r.noOwner ? `${fmt(r.noOwner)} open risk${r.noOwner === 1 ? "" : "s"} with no owner` : "Every open risk has an owner");
  };
  S1(/./, (orig) => (wsx() ? ownerLine(orig()) : orig()));

  // ════════════════ B22: a risk asks its response, and may rest on an issue before its POA&M item ════════════════
  const RESP = { mitigate: "Mitigate", accept: "Accept", transfer: "Transfer" };
  const poamFor = (iid) => { const L = regs(); const i = CH.issues().find((x) => x.id === iid) || L.ISS.find((x) => x.id === iid); const c = CH.poams().find((x) => x.issue === iid || (x.also || []).includes(iid)); if (c) return c; return i && i.poam ? L.POAM.find((x) => x.title === i.poam) || null : null; };
  X.M("v2k-risk", (orig, iid) => {
    if (!wsx()) return orig();
    const L = regs(), i = CH.issues().find((x) => x.id === iid) || L.ISS.find((x) => x.id === iid) || { id: iid, title: iid }, p = poamFor(iid);
    return { title: "Create risk", body: `${ro("Rests on", `${esc(i.title)}<br><span class="v2k-mu">${p ? `Answered by ${esc(p.title)}` : "No POA&amp;M item answers it yet"}</span>`)}
      ${F("Title", inp("title", "What could happen, to what, in one sentence"), { req: true })}
      ${F("Threat", area("threat", "Who or what, and how"))}
      <div class="v2k-row2">${F("Likelihood", choose("lik", U.LEVELS, "moderate"))}${F("Impact", choose("imp", U.LEVELS, "high"))}</div>
      ${fld("Response", radios("resp", [["mitigate", "Mitigate", p ? `${esc(p.title)} answers it` : "A POA&amp;M item answers it; create it next"], ["accept", "Accept", `The ISSO, the ISSM and ${esc(AO)} accept it in turn`], ["transfer", "Transfer", "Another organization or system carries it"]], p ? "mitigate" : ""), { req: true })}
      ${F("Owner", choose("owner", U.peopleOpts()))}`, footer: prim("Create risk", "risk", iid) };
  });
  ACT.risk = (iid, o) => {
    const out = CH.ACTIONS.risk(iid, o); const r = CH.risks()[CH.risks().length - 1];
    if (r) Rset("resp." + r.id, o.resp);
    const p = poamFor(iid);
    return [`${out[0]} · response ${RESP[o.resp]}${o.resp === "mitigate" && !p ? "; create the POA&M item that mitigates it next" : ""}`, out[1]];
  };
  const respOf = (rid) => R("resp." + rid, null);
  X.P("a-risk-risk", (orig, id) => {
    const o = orig(); if (!o || typeof o.body !== "string" || !wsx()) return o;
    const rid = String(id || "").split("|")[0], resp = respOf(rid); if (!resp) return o;
    const r = CH.risks().find((x) => x.id === rid); const p = r ? (r.poam ? CH.poams().find((x) => x.id === r.poam) : poamFor(r.issue)) : null;
    const words = resp === "mitigate" ? `Mitigate · ${p ? `answered by ${esc(p.title)}` : "no POA&amp;M item yet"}` : resp === "transfer" ? "Transfer" : `Accept, if ${esc(AO)} agrees`;
    let body = o.body.replace(/Accept, if the AO agrees/, words);
    if (resp !== "accept") body = edit(body, (root) => {
      for (const el of root.querySelectorAll('[data-modal="v2k-accept"]')) {
        if (p || !r) { el.remove(); continue; }
        el.setAttribute("data-modal", "v2k-poam"); el.setAttribute("data-id", r.issue); el.textContent = "Create POA&M item";
      }
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) if (/Request acceptance sends it to step 1\./.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/Not requested yet\. Request acceptance sends it to step 1\./, `Not requested: the response is ${RESP[resp]}, so nobody is asked to accept it.`).replace(/Request acceptance sends it to step 1\./, `The response is ${RESP[resp]}, so nobody is asked to accept it.`);
    });
    return { ...o, body };
  });
  X.P("a-risk-issue", (orig, id) => {
    const o = orig(); if (!o || typeof o.body !== "string" || !wsx()) return o;
    const iid = String(id || "").split("|")[0];
    return { ...o, body: o.body.replace(/(<span class="who"><span class="gl ring"[^>]*><\/span>)A risk rests on the issue once its POA&amp;M item exists(<\/span>)/, `$1No risk rests on this issue yet$2 <span class="btn sm" role="button" tabindex="0" data-modal="v2k-risk" data-id="${esc(iid)}">Create risk</span>`) };
  });

  // ════════════════ B24 B25 B28: Cyber T&E by the authorization that lets it test ════════════════
  const iattOf = () => { const a = (X.fact("authorizations", WSX) || []).find((x) => x.id === "iatt-2"); return a ? a.decided || a.planned || "2027-05-18" : "2027-05-18"; };
  const T0 = new Date("2026-10-01T12:00:00"), T1 = new Date("2027-12-01T12:00:00");
  const xp = (iso) => Math.max(0, Math.min(100, ((new Date(String(iso).slice(0, 10) + "T12:00:00") - T0) / (T1 - T0)) * 100));
  const rng = (a, b) => `${CH.md(a)} – ${CH.mdy(b)}`;
  const acdWin = () => { const i = iattOf(); return [addDays(i, 21), addDays(i, 46)]; };
  const cyber = () => R("cyber", {}) || {};
  S1(/^cyber-te/, (orig, route) => {
    const html = orig(); if (!wsx()) return html;
    const iatt = iattOf(), [a, b] = acdWin(), cy = cyber();
    return edit(html, (root) => {
      for (const lane of root.querySelectorAll(".v7a-lane[data-id='acd']")) {
        const m = lane.querySelector(".v7a-lane-t .v7a-mu"); if (m) m.textContent = `4 · ACD · ${rng(a, b)} · after the IATT, ${CH.md(iatt)} · Example`;
        const bar = lane.querySelector(".v7a-bar"); if (bar) { bar.style.left = xp(a) + "%"; bar.style.width = Math.max(1, xp(b) - xp(a)) + "%"; }
      }
      for (const lane of root.querySelectorAll(".v7a-lane[data-id='res']")) {
        const m = lane.querySelector(".v7a-lane-t .v7a-mu"); if (m) m.textContent = `${m.textContent} · starts before the IATT it needs, ${CH.md(iatt)}`;
      }
      // The IATT that authorizes the Increment 2 test configuration, as a lane of its own.
      const lanes = [...root.querySelectorAll(".v7a-lane")];
      const after = lanes.filter((l) => /\b(Jan|Feb|Mar|Apr|May)\b/.test(txt(l)) && !/data-id/.test("")).pop();
      if (lanes.length) {
        const ms = `<div class="v7a-lane v3r-ms" role="note"><span class="v7a-lane-t"><b>IATT · Increment 2 test configuration</b><span class="v7a-mu">Prerequisite for adversarial testing · planned ${CH.mdy(iatt)}</span></span><span class="v7a-lane-tr"><i class="v3r-msbar" style="left:${xp(iatt)}%"></i></span></div>`;
        const res = root.querySelector(".v7a-lane[data-id='res']") || after || lanes[lanes.length - 1];
        res.insertAdjacentHTML("afterend", ms);
      }
      // The campaigns table: ACD's window; the CVI's test plan once planned.
      for (const tr of root.querySelectorAll("tr[data-id='acd']")) { const c = tr.cells[3]; if (c) c.innerHTML = `<span class="num">${esc(rng(a, b))}</span>`; }
      if (cy.cvi) for (const tr of root.querySelectorAll("tr[data-id='cvi']")) { const c = tr.cells[5]; if (c) c.innerHTML = `<span class="ak-link" ${goAttr("campaign-new-" + cy.cvi.n)}>Planned ${esc(md(cy.cvi.at))}</span>`; }
      for (const tr of root.querySelectorAll("tr[data-id='res']")) { const c = tr.cells[2]; if (c) c.insertAdjacentHTML("beforeend", ` ${mu(`starts before the IATT, ${esc(CH.md(iatt))}`)}`); }
      if (cy.cvi) for (const ban of root.querySelectorAll(".banner, .ak-banner")) if (/cooperative vulnerability identification starts/.test(txt(ban))) ban.outerHTML = `<p class="note-p">The cooperative vulnerability identification is planned: <span class="ak-link" ${goAttr("campaign-new-" + cy.cvi.n)}>${esc(cy.cvi.title)}</span>, ${esc(cy.cvi.ssp)}, ${esc(rng(cy.cvi.from, cy.cvi.to))}.</p>`;
      for (const p of root.querySelectorAll(".v7a-phase")) if (/Adversarial cybersecurity DT&E/.test(txt(p))) { const s = p.querySelector(".v7a-mu"); if (s) s.textContent = `Proposed ${CH.md(a)}, after the IATT`; }
    });
  });
  X.P("v7a-camp", (orig, id) => {
    const o = orig(); if (!o || !wsx() || typeof o.body !== "string") return o;
    const key = String(id || "").split("|")[0]; if (key !== "acd") return o;
    const [a, b] = acdWin();
    return { ...o, body: o.body.replace(/Apr 12 – May 7, 2027/g, rng(a, b)).replace(/(<\/dl>)/, `$1<p class="note-p">Waits on the IATT for the Increment 2 test configuration, planned ${esc(CH.mdy(iattOf()))}: adversarial testing on the range starts only once it is granted, after TRR.</p>`) };
  });
  X.P("v7a-evt", (orig, id) => {
    const o = orig(); if (!o || !wsx() || typeof o.body !== "string") return o;
    if (String(id || "").split("|")[0] !== "res") return o;
    return { ...o, body: o.body.replace(/(<\/dl>)/, `$1<p class="note-p v3r-warn">Starts May 2, before the IATT for the Increment 2 test configuration (planned ${esc(CH.mdy(iattOf()))}). Move the exercise after the IATT, or ask ${esc(AO)} for the IATT before May 2.</p>`) };
  });
  // Plan the test and Plan an assessment are one command: a campaign with its first plan a draft, on the SSP chosen [B25 B15].
  const sspOpts = () => { const s3 = PA.v2hubs && PA.v2hubs.ssp ? PA.v2hubs.ssp() : "draft"; return [["ssp2", "SYS-WSX90 · SSP 2, published Jul 25 · Increment 1"], ["ssp3", `SYS-WSX90 · SSP 3 · Increment 2, Block 1.1 · ${s3 === "approved" ? "approved" : s3 === "submitted" ? "in review" : "draft"}`]]; };
  const SSP_WORD = { ssp2: "SSP 2, published Jul 25", ssp3: "SSP 3, Increment 2" };
  function planDialog(code, cyberPhase) {
    const c = code ? CH.view(code) : null, cvi = cyberPhase === "cvi" || cyberPhase === "3";
    const title = cyberPhase ? (cvi ? "WS-X90 cooperative vulnerability identification — FY2027" : "WS-X90 adversarial cybersecurity DT&E — FY2027") : c ? `${c.code} assessment` : "";
    const [fa, fb] = cyberPhase ? (cvi ? ["2027-01-11", "2027-02-05"] : acdWin()) : [CH.plus(14), CH.plus(45)];
    return { title: cyberPhase ? "Plan a cyber test" : "Plan an assessment", body: `${desc(cyberPhase ? `Plans a cyber test campaign the way Assessments' Plan an assessment does: its first plan is a draft that the lead assessor approves and ${esc(AO)} concurs with.${cvi ? "" : ` Adversarial testing waits on the IATT for the Increment 2 test configuration, planned ${esc(CH.mdy(iattOf()))}.`}` : c ? `Plans a new campaign around ${esc(c.code)}: its first plan, a draft, holds ${esc(c.code)}'s ${c.ob} assessment objectives.` : "Plans a new campaign with a draft plan. Controls join its plan from their own pages.")}
      ${cyberPhase ? fld("Phase", radios("phase", [["3", "3 · Cooperative vulnerability identification"], ["4", "4 · Adversarial cybersecurity DT&E"]], cvi ? "3" : "4"), { req: true }) : ""}
      ${F("Title", inp("title", "Name the campaign", { value: title }), { req: true })}
      ${F("SSP", choose("ssp", sspOpts(), cyberPhase ? "ssp3" : "ssp2"), { hint: cyberPhase ? "Increment 2's test configuration is Block 1.1, which SSP 3 describes." : "" })}
      <div class="v2k-row2">${F("Window opens", inp("from", "", { type: "date", value: fa }), { req: true })}${F("Window closes", inp("to", "", { type: "date", value: fb }), { req: true })}</div>
      ${ro("Lead assessor", AK.owner(LEAD))}${cyberPhase ? ro("Owner", AK.owner(ME)) : ""}`, footer: prim(cyberPhase ? "Plan cyber test" : "Plan an assessment", "plan2", `${code || ""}|${cyberPhase || ""}`) };
  }
  X.M("v2k-plan", (orig, code) => (wsx() ? planDialog(code || "", "") : orig()));
  X.M("v7a-cyber-plan", (orig, id) => (wsx() ? planDialog("", id === "cvi" || id === "3" ? "cvi" : "acd") : orig()));
  ACT.plan2 = (id, o) => {
    const [code, cy] = id.split("|");
    if (o.to < o.from) return "Window closes: it must be after the window opens.";
    const phase = cy ? o.phase || (cy === "cvi" ? "3" : "4") : "";
    if (phase === "4" && o.from < iattOf()) return `Window opens: adversarial testing starts after the IATT, ${CH.mdy(iattOf())}.`;
    const n = CH.seq("camp"), cid = "new" + n;
    CH.push("camps", { id: cid, n, title: o.title, ssp: SSP_WORD[o.ssp] || SSP_WORD.ssp2, from: o.from, to: o.to, ctl: code || null, ...(phase ? { kind: phase === "3" ? "Cyber test · 3 CVI" : "Cyber test · 4 ACD" } : {}) });
    if (code) CH.put(code, { camp: cid, campAt: TODAY_ISO });
    if (phase) Rset("cyber", { ...cyber(), [phase === "3" ? "cvi" : "acd"]: { n, cid, title: o.title, ssp: SSP_WORD[o.ssp] || SSP_WORD.ssp2, from: o.from, to: o.to, at: TODAY_ISO } });
    return [code ? `${CH.base(code).ob} objectives of ${code} planned in ${o.title}` : `${o.title} planned on ${SSP_WORD[o.ssp] || SSP_WORD.ssp2}; its plan waits on approval`, { label: "Open campaign", route: "campaign-new-" + n }];
  };
  // B28: a deliverable that is a cyber test names the campaign's own lead.
  S1(/^lifecycle-svr-2$/, (orig) => {
    const html = orig(); if (!wsx() || typeof html !== "string") return html;
    return edit(html, (root) => {
      for (const el of root.querySelectorAll("tr, li, .v2g-dl, [data-id], div")) {
        if (el.children.length > 12 || !/CVI FY2027/.test(txt(el)) || !/Wes Duarte/.test(txt(el))) continue;
        const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) if (/Wes Duarte/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/Wes Duarte/g, ME);
        for (const a of el.querySelectorAll("[aria-label*='Wes Duarte'], [title*='Wes Duarte']")) { ["aria-label", "title"].forEach((k) => { const v = a.getAttribute(k); if (v) a.setAttribute(k, v.replace(/Wes Duarte/g, ME)); }); }
        for (const av of el.querySelectorAll(".av, .ak-av")) if (/^WD$/.test(txt(av))) av.textContent = "IS";
      }
    });
  });

  // B16 in previews and dialogs other lanes draw: the words only.
  Object.keys(P).forEach((k) => { if (k !== "a-tests-control") X.P(k, (orig) => renameObj(orig())); });
  Object.keys(M).forEach((k) => { if (!/^(v3r-|v2k-det$|v2k-publish$|a-tests-publish$|v2k-addcamp$|v2k-ready$)/.test(k)) X.M(k, (orig) => renameObj(orig())); });

  X.facts.ownerOf = (kind, id) => ownerOf(kind, id);
  PA.v3r = { campaignOf, results, objectivesOf, planOf, planCodes, derived, judgedOf, draftsOf, ownerOf };
})();
