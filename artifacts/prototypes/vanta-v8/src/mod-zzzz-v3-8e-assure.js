// V3 lane E (k3e-): what was assessed, what was found, what could happen, and what the authorizing official decides.
// Pages
//   findings[-issues|-assessment|-vulns|-stig|-poam]   one list of everything found. The source is a row of tabs; the chips are states;
//                                   "On the POA&M" is the findings that have a plan, with the plan's columns (findings-poam opens on it).
//   assessments[-control|-cyber|-checks]               every assessment in one table: control assessments, cyber tests, monitoring checks
//   assessment--<id>[--<tab>]       an assessment's page, the program menu still there. Control assessment: plan, objectives, requests,
//                                   results, findings. <id>: exp, init, a campaign's id (conmon), cy-<id> a cyber test, chk-<id> a check.
//   risks, risks-threats            the register, and the ATT&CK techniques its risks name
//   authorization[-decisions|-conditions|-monitoring|-sharing]   the record the authorizing official decides on
// Records: k3e-finding (any finding: its plan and milestones, its risk, its owner), k3e-risk, k3e-tech (an ATT&CK technique). Each is
//   one definition, fn(id, { page }): the kit draws its page (finding--<id>, risk--<id>, technique--<code>: where a row's click
//   goes) and its preview (the eye on a row). On the page the next step's button is the header's one primary, and the control and
//   the components are rows that go to their pages. With V3 on, v2's a-risk-issue, a-risk-poam, a-risk-risk and v7a-att previews
//   are these previews.
// Folded here: cyber-te…, conmon…, checks, check-…, schedule, campaign…, assessments-plans|results|completed|assessor → Assessments;
//   poam…, findings-assets|deactivated|history → Findings; threats… → Risks' Threats tab; package-room… → Authorization's Sharing.
//
// Opening a list on exactly some records (then go to the route):
//   K.set("fnd.view", { chip: "open|late|poam|noowner|deact|fixed", q, sev, comp: "<component code>", ctl: "<control code>", asm: "<assessment id>", page })
//   K.set("asm.view", { att: "publish|failing|ending", q })      K.set("rsk.view", { chip: "open|noowner|late|accept", q, sev, tech: "T1078" })
//   The source (findings) and the kind (assessments) are in the address: findings-stig, assessments-checks.
//
// Facts for the other lanes (PA.v3.fact(name, …)); each finding is
//   { id, kind: "issue|af|vuln|stig", source: "Operational issue|Assessment finding|Vulnerability|STIG rule", title, where, sev,
//     det, control, components: [codes], state: "open|draft|deact", opened, due, late, owner, plan: { id, planned, reached, total } | null,
//     risk: <risk id> | null, panel: "k3e-finding" }   (open it with { panel: f.panel, id: f.id })
//   findingsOf(controlCode) → the findings on a control, open and draft
//   findingsOn(componentCode) → the findings on a component (an issue through its requirement's allocation, a CVE and a STIG rule
//     through the asset they name, an assessment finding through the controls placed there)
//   risksOf(controlCode) → [{ id, title, sev, response, owner, panel: "k3e-risk" }]: the risks its findings raised
//   findingCounts() → { open, late, poam, noOwner, bySource }    assessments() → [{ id, name, kind, status, route }]
//   issues(prog), risks(prog), poam(prog) (lane F's, lane P's) answer what Findings and Risks list for the program on screen, so the
//   Overview's counts open exactly their records (an operational issue raised for a CVE is listed once, under Vulnerabilities).
// Read from lane S when it is there: cveFixed(cve, componentCode) → true once a component took a version that fixes the CVE: the
//   finding leaves that component (findingsOn), and the open findings once every component it names is fixed (state "fixed").
//   finding(code) (lane F's) also answers a finding recorded here on one objective, before every objective is judged.
//
// What the reader changes. The same stores as the pages that already hold the fact, so every other page follows:
//   objective determinations and plan approval: lane R's v3.R.obj.<control> and v3.R.plan.<campaign>; a published determination:
//   PA.v2.chain (chain.ctl.<control>, chain.results.<campaign>, chain.inc2); a plan and a risk: chain.poams and chain.risks (their
//   issue is the finding's id); owner, planned date, deactivation of an operational issue: lane R's v3.R.own / planned / deact;
//   a risk's response and techniques: v3.R.resp / tech; its acceptance: chain.acc; a condition closed: lane G's v3.G.condx.
//   The expanded campaign's objective results stay in v3.R.obj and v3.R.res.exp alone (PA.v2.chain has no such campaign, and V3 off
//   must stay v2): a control every objective of which is published there joins lane F's expanded-set table (PA.v3f.INC2), which
//   fact("status") and fact("controls") read.
//   A determination short of satisfied opens an assessment finding, never a second operational issue.
//   Only what no earlier store holds is under K "e." ("p.<program>.e." for another program than WS-X90): ms { planId: [milestone] },
//   msd { "planId:seq": day reached }, res { planId: resources }, own { findingId: owner }, deact { findingId: {…} }, rlink
//   { findingId: riskId }, made [findings added by hand], runs { checkId: [run] }, share [recipient], scn [significant change],
//   and, for another program, find / plans / risks / camps.
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k, V = PA && PA.v2;
  if (!V3 || !K || !V || !PA.SSP || !PA.h || !V.chain) return;
  const SSP = PA.SSP, P = PA.P, S = PA.S, CH = V.chain, h = PA.h, esc = K.esc, fmt = K.fmt;
  const ME = "Ingrid Solberg", LEAD = "D. Okafor", ASSESSOR = "Nadia Fournier", AO = CH.AO || "R. Calloway", ISSO = "Priya Raghavan", ISSM = "Joel Barrantes";
  const TODAY = CH.TODAY_ISO || "2026-11-17", PER = 50;
  const wsx = () => V3.wsx(), prog = () => V3.prog();
  const off = (fn) => V3.force(false, fn);
  const R3 = () => PA.v3r || null;
  const iso = (d) => (d ? (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)) : "");
  const md = (d) => (d ? CH.md(iso(d)) : ""), mdy = (d) => (d ? CH.mdy(iso(d)) : "");
  const days = (a, b) => Math.round((new Date(iso(a) + "T12:00:00") - new Date(iso(b) + "T12:00:00")) / 864e5);
  const addDays = (d, n) => { const x = new Date(iso(d) + "T12:00:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const mu = (t) => `<span class="k3e-mu">${t}</span>`;
  const NONE = '<span class="k3-none">—</span>';
  const parse = (html) => { const t = document.createElement("template"); t.innerHTML = typeof html === "string" ? html : ""; return t.content; };
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  const uniq = (a) => [...new Set(a)];
  const cur = () => (location.hash || "#").slice(1);
  const safe = (s) => String(s).replace(/[^A-Za-z0-9_-]/g, "_");
  // Lane E's own session data: WS-X90's under "e.", any other program's under "p.<program>.e.".
  const pk = (p) => (wsx() ? "e." + p : `p.${safe(prog())}.e.${p}`);
  const get = (p, d) => { const v = K.get(pk(p), d); return v == null ? d : v; };
  const set = (p, v) => K.set(pk(p), v);
  const mapSet = (p, key, val) => { const m = Object.assign({}, get(p, {})); if (val == null) delete m[key]; else m[key] = val; set(p, m); };
  const view = (k) => K.get(k + ".view", {}) || {};
  const setView = (k, patch) => K.set(k + ".view", Object.assign({}, view(k), patch));
  // Everything derived is kept for one draw: any change to the session state clears it.
  let MEMO = {};
  V.on(() => { MEMO = {}; });
  window.addEventListener("v3change", () => { MEMO = {}; });
  const memo = (key, fn) => { const k = prog() + "|" + key; if (!(k in MEMO)) MEMO[k] = fn(); return MEMO[k]; };
  let STATIC = {}; // parsed from v2's own pages once: their records never change
  const stat = (key, fn) => { if (!(key in STATIC)) { try { STATIC[key] = fn(); } catch (e) { console.error("k3e", key, e); STATIC[key] = null; } } return STATIC[key]; };
  const old = (route) => { const f = S[route]; if (!f) return ""; const o = off(() => f()); return typeof o === "string" ? o : ""; };

  const people = () => { const L = V3.fact("people", prog()); return L && L.length ? L.map((p) => p.name) : ((CH.ui && CH.ui.PEOPLE) || []).map((p) => p[0]); };
  const ownerOpts = () => people().map((n) => [n, n]);
  const SEVW = { critical: "Critical", high: "High", moderate: "Moderate", low: "Low" }, SEVN = { critical: 4, high: 3, moderate: 2, low: 1 };
  const sevPill = (s) => (s ? h.pill(s === "critical" || s === "high" ? "bad" : s === "moderate" ? "warn" : "none", SEVW[s] || s) : NONE);
  const DETW = { satisfied: "Satisfied", partially_satisfied: "Partially satisfied", other_than_satisfied: "Other than satisfied", not_assessed: "Not assessed" };
  const SHORT = new Set(["other_than_satisfied", "partially_satisfied"]);
  const detPill = (d) => (CH.stPill ? CH.stPill(d) : h.pill("none", DETW[d] || d));
  const ctlTitle = (code) => { const c = SSP.ctl ? SSP.ctl(code) : null; return (c && (c.t || c.title)) || (CH.base ? (CH.base(code) || {}).t : "") || ""; };
  const inBaseline = (code) => !!(code && SSP.ctl && SSP.ctl(code));

  // ——— Components: lane S's page when it is in the build, else the name ———
  const EBY = () => (PA.v7p && PA.v7p.EBY) || {};
  const compName = (code) => { const f = V3.fact("component", code); return (f && f.name) || (EBY()[code] || {}).name || code; };
  const hasCompPage = (code) => !!(S["system"] && V3.fact("component", code));
  const compLink = (code) => (code ? (hasCompPage(code) ? K.link(compName(code), "component--" + code) : esc(compName(code))) : NONE);
  const compByName = (name) => stat("cn:" + name, () => { const n = String(name || "").split("·")[0].trim().toLowerCase(); const e = Object.values(EBY()).find((x) => x.name.toLowerCase() === n); return e ? e.code : null; });
  const compsOfCtl = (code) => V3.fact("componentsOf", code) || (PA.v3c && PA.v3c.compsOf ? PA.v3c.compsOf(code) : []) || [];
  const ctlsOfComp = (code) => V3.fact("controlsOf", code) || [];

  // ════════════════ The registers ════════════════
  const regs = () => (PA.riskLookup && wsx() ? PA.riskLookup.all() : { ISS: [], RISKS: [], POAM: [] });
  const D = () => PA.SCTMD || {};
  const issReq = () => stat("issReq", () => new Map(((D().iss) || []).filter((i) => i.req).map((i) => [i.id, i.req])));
  const reqEls = (req) => ((D().reqs || {})[req] || {}).els || [];
  const leafFirst = (codes) => codes.slice().sort((a, b) => ((EBY()[b] || {}).depth || 0) - ((EBY()[a] || {}).depth || 0));
  const dueOfText = (t) => { const m = /([A-Z][a-z]{2}) (\d{1,2})/.exec(t || ""); if (!m) return ""; const mo = "JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(m[1]) / 3; if (mo < 0) return ""; return `${mo < 7 ? 2027 : 2026}-${String(mo + 1).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`; };
  // v2's Vulnerabilities and open STIG rules are closures of their modules: read once from the pages that draw them.
  const vulnRows = () => stat("vulns", () => [...parse(old("findings-vulns")).querySelectorAll("tbody tr")].map((tr) => { const c = [...tr.children].map(txt); const s = /^(\w+)\s*([\d.]*)/.exec(c[3] || "") || []; return { cve: c[1], title: c[2], sev: (s[1] || "").toLowerCase(), cvss: s[2] || "", asset: c[4], iava: /^IAV/.test(c[5]) ? c[5] : "", due: dueOfText(c[6]), status: c[7], issue: tr.getAttribute("data-panel") === "a-risk-issue" ? tr.getAttribute("data-id") : null }; }).filter((v) => /^CVE-/.test(v.cve))) || [];
  const stigRows = () => stat("stigs", () => { let cat = ""; const out = []; for (const tr of parse(old("stigs-open")).querySelectorAll("tbody tr")) { if (!tr.getAttribute("data-panel")) { cat = (/CAT I{1,3}/.exec(txt(tr)) || [""])[0]; continue; } const c = [...tr.children]; const v = txt(c[0].querySelector("b")) || "", t = c[0].querySelector("[title]"); const a = c[3].querySelector("a"); out.push({ id: tr.getAttribute("data-id"), v, title: t ? t.getAttribute("title") : txt(c[0]).replace(v, "").trim(), asset: txt(c[1]), stig: txt(c[2]), control: a ? txt(a) : "", due: dueOfText(txt(c[4])), poam: /^No POA/.test(txt(c[5])) ? "" : txt(c[5]), cat }); } return out; }) || [];
  const CATSEV = { "CAT I": "high", "CAT II": "moderate", "CAT III": "low" };
  const RESW = { init: ["init", "SAR · initial authorization"], inc1: ["exp", "SAR · expanded set 1"], inc2: ["exp", "Expanded set 2 results"] };

  // ——— Plans (the POA&M item that answers a finding), milestones, risks: read where they are, overlaid with what was done here ———
  const poamList = () => (wsx() ? regs().POAM : get("plans", []).map((p) => Object.assign({ ms: [], issues: [], status: "open" }, p)));
  const riskList = () => (wsx() ? regs().RISKS : get("risks", []));
  const msOf = (p) => {
    const done = get("msd", {});
    const base = (p.ms || []).map((m) => { const d = m.done || done[p.id + ":" + m.seq] || null; return { key: String(m.seq), title: m.title, planned: m.planned || null, done: d, status: d ? "completed" : m.status || "planned" }; });
    const mine = (get("ms", {})[p.id] || []).map((m) => { const d = done[p.id + ":" + m.id] || null; return { key: m.id, title: m.title, planned: m.planned || null, done: d, status: d ? "completed" : "planned", mine: true }; });
    return base.concat(mine);
  };
  const planShape = (p) => { if (!p) return null; const ms = msOf(p); return { id: p.id, title: p.title, planned: p.planned || null, text: p.plan || "", status: p.status || "open", resources: get("res", {})[p.id] || "", ms, reached: ms.filter((m) => m.done || m.status === "completed").length, total: ms.length, chain: !!p.chain || !wsx(), late: !!(p.planned && p.status !== "completed" && iso(p.planned) < TODAY) }; };
  const planOfFinding = (f) => memo("plan:" + f.id, () => {
    const L = poamList(); let p = null;
    if (wsx()) {
      if (f.issueId) p = L.find((x) => (x.issues || []).some((i) => i.id === f.issueId)) || null;
      if (!p) { const c = CH.poams().find((x) => x.issue === (f.issueId || f.id) || (x.also || []).includes(f.issueId || f.id)); if (c) p = L.find((x) => x.id === c.id) || c; }
      if (!p && f.poamTitle) p = L.find((x) => x.title === f.poamTitle) || null;
    } else p = L.find((x) => x.issue === f.id) || null;
    return planShape(p);
  });
  const riskOfFinding = (f) => memo("risk:" + f.id, () => {
    const L = riskList(), key = f.issueId || f.id, link = get("rlink", {})[f.id];
    if (link) { const r = L.find((x) => x.id === link); if (r) return r; }
    const c = L.find((r) => r.issue === key); if (c) return c;
    if (wsx() && f.issueId) { const s = ((D().risks) || []).find((r) => (r.iss || []).includes(f.issueId)); if (s) return L.find((r) => r.id === s.id) || null; }
    return null;
  });

  // ════════════════ Findings: everything found, each once ════════════════
  const SRC = { issue: "Operational issue", af: "Assessment finding", vuln: "Vulnerability", stig: "STIG rule" };
  const SRCS = [["", "All findings", "findings"], ["issue", "Operational issues", "findings-issues"], ["af", "Assessment findings", "findings-assessment"], ["vuln", "Vulnerabilities", "findings-vulns"], ["stig", "STIG rules", "findings-stig"]];
  function buildFindings() {
    const out = [], own = get("own", {}), deact = get("deact", {});
    const fixed = V3.facts.cveFixed ? (cve, c) => { try { return V3.fact("cveFixed", cve, c) === true; } catch (e) { return false; } } : null;
    const fin = (f) => { if (!f.issueId) { f.owner = own[f.id] || f.owner || ""; if (deact[f.id]) { f.state = "deact"; f.deact = deact[f.id]; } }
      // A CVE that a component's newer version fixes (lane S says which) leaves that component; fixed everywhere, it leaves the open findings.
      if (fixed && f.cve && f.state === "open") { const fx = f.components.filter((c) => fixed(f.cve.cve, c)); if (fx.length) { f.fixedOn = fx; if (fx.length === f.components.length) f.state = "fixed"; else f.components = f.components.filter((c) => !fx.includes(c)); } }
      f.late = f.state === "open" && !!f.due && f.due < TODAY; f.source = SRC[f.kind]; out.push(f); return f; };
    for (const m of get("made", [])) fin(Object.assign({ kind: "issue", components: m.comp ? [m.comp] : [], state: "open", made: true }, m));
    if (!wsx()) return out;
    const L = regs(), rdeact = V.get("v3.R.deact", null) || {}, cves = vulnRows(), cveBy = new Map(cves.filter((v) => v.issue).map((v) => [v.issue, v]));
    const allIss = Object.keys(rdeact).length ? off(() => PA.riskLookup.all().ISS.slice()) : L.ISS;
    if (allIss !== L.ISS) regs(); // put the open list back as V3 reads it
    for (const i of allIss) {
      const v = cveBy.get(i.id), req = issReq().get(i.id) || (/(REQ-\d+)/.exec(i.title) || [])[1] || null;
      const ctl = (i.from && i.from[0] && i.from[0][0]) || i.ctl || (/\(([A-Z]{2}-\d+(?:\(\d+\))?)\)\s*$/.exec(i.title) || [])[1] || null;
      const comps = v ? [compByName(v.asset)].filter(Boolean) : leafFirst(reqEls(req).filter((c) => EBY()[c]));
      fin({ id: i.id, issueId: i.id, kind: v ? "vuln" : "issue", title: i.title, sev: i.sev, control: ctl, req, components: comps, opened: i.opened, due: iso(i.due), owner: i.owner || "", state: rdeact[i.id] ? "deact" : "open", deact: rdeact[i.id] || null, cve: v || null, chain: !!i.chain, det: i.from && i.from[0] ? i.from[0][1] : null, asm: v ? "chk-vuln" : i.camp || null });
    }
    for (const v of cves.filter((x) => !x.issue)) fin({ id: "cve:" + v.cve, kind: "vuln", title: `${v.cve} ${v.title}`, sev: v.sev, control: "SI-2", components: [compByName(v.asset)].filter(Boolean), where: v.asset, opened: "", due: v.due, state: "open", cve: v, asm: "chk-vuln" });
    for (const r of stigRows()) fin({ id: "stig:" + r.id, kind: "stig", title: `${r.v} ${r.title}`, sev: CATSEV[r.cat] || "moderate", cat: r.cat, control: r.control || null, components: [compByName(r.asset)].filter(Boolean), where: `${r.asset} · ${r.stig}`, due: r.due, state: "open", poamTitle: r.poam, stig: r, asm: "chk-stig" });
    // Assessment findings: a published determination short of satisfied stands until a later one replaces it; a draft decides nothing yet.
    const i2 = !!(CH.inc2 && CH.inc2()), pub = new Map(), draft = new Map();
    for (const x of (D().af) || []) { const isDraft = x.res === "inc2" && !i2, m = isDraft ? draft : pub, c = m.get(x.code); if (!c || String(x.date) > String(c.date)) m.set(x.code, x); }
    const issueFor = (code) => L.ISS.find((i) => (i.from || []).some((f) => f[0] === code)) || null;
    const afRow = (x, isDraft) => { const [asm, res] = RESW[x.res] || ["exp", x.res], via = issueFor(x.code); return fin({ id: `af:${x.res}:${x.code}`, kind: "af", title: `${x.title} judged ${DETW[x.det].toLowerCase()}`, det: x.det, sev: x.det === "other_than_satisfied" ? "high" : "moderate", control: x.code, components: [], where: res, opened: x.date, due: "", state: isDraft ? "draft" : "open", asm, res, via: via ? via.id : null }); };
    for (const x of pub.values()) if (SHORT.has(x.det) && !(draft.has(x.code) && !SHORT.has(draft.get(x.code).det) && false)) afRow(x, false);
    for (const x of draft.values()) if (SHORT.has(x.det) && !(pub.has(x.code) && SHORT.has(pub.get(x.code).det))) afRow(x, true);
    const O = V.get("v3.R.obj", null) || {}, r3 = R3();
    if (r3) for (const code of Object.keys(O)) {
      const objs = r3.objectivesOf(code), st = O[code] || {}, camp = r3.campaignOf(code);
      for (const o of objs) { const s = st[o.i]; if (!s || !SHORT.has(s.det)) continue; const cid = (s.pub && s.pub.cid) || (camp && camp.id) || "exp"; fin({ id: `af:${cid}:${code}:${o.i}`, kind: "af", title: `${o.label} judged ${DETW[s.det].toLowerCase()}`, text: `Determine if ${o.text}.`, note: s.note || "", det: s.det, sev: s.det === "other_than_satisfied" ? "high" : "moderate", control: code, objective: o.label, methods: s.methods || [], by: s.by, rec: s.rec, components: s.comp ? [s.comp] : [], where: asmName(cid), opened: s.at, due: s.due || "", state: s.pub ? "open" : "draft", asm: cid, obj: o.i }); }
    }
    return out;
  }
  const findings = () => memo("findings", buildFindings);
  const findingById = (id) => findings().find((f) => f.id === id) || null;
  const whereOf = (f) => [f.components[0] ? compName(f.components[0]) : "", f.kind === "af" || f.kind === "stig" || (f.kind === "vuln" && !f.issueId) ? f.where : f.req || "", f.control && f.kind !== "af" ? f.control : ""].filter(Boolean).join(" · ") || (f.control ? f.control : "The system as a whole");
  const isOpen = (f) => f.state === "open" || f.state === "draft";
  const hasPlan = (f) => { const p = planOfFinding(f); return !!p; };
  const ownPlan = (f) => hasPlan(f) && !f.via;
  const CHIPF = { open: isOpen, late: (f) => f.late || (isOpen(f) && !!(planOfFinding(f) || {}).late), poam: (f) => isOpen(f) && ownPlan(f), noowner: (f) => isOpen(f) && !f.owner, deact: (f) => f.state === "deact", fixed: (f) => f.state === "fixed" };
  const publicFinding = (f) => { const p = planOfFinding(f), r = riskOfFinding(f); return { id: f.id, kind: f.kind, source: f.source, title: f.title, where: whereOf(f), sev: f.sev, det: f.det || null, control: f.control, components: f.components, state: f.state, opened: f.opened, due: f.due, late: f.late, owner: f.owner, plan: p ? { id: p.id, planned: p.planned, reached: p.reached, total: p.total } : null, risk: r ? r.id : null, panel: "k3e-finding" }; };
  const findingsOf = (code) => findings().filter((f) => isOpen(f) && f.control === code);
  // A component holds what stands on it and on everything inside it (a subsystem counts its units), as lane S pools controls and requirements.
  const withinOf = (comp) => { const S3 = PA.v3s; let below = []; try { below = S3 && S3.below ? S3.below(comp) || [] : []; } catch (e) { below = []; } return new Set([comp].concat(below)); };
  const onComp = (f, set, ctls) => f.components.some((c) => set.has(c)) || (f.kind === "af" && ctls.has(f.control));
  const findingsOn = (comp) => { const ctls = new Set(ctlsOfComp(comp)), set = withinOf(comp); return findings().filter((f) => isOpen(f) && onComp(f, set, ctls)); };
  const risksOfCtl = (code) => uniq(findingsOf(code).map(riskOfFinding).filter(Boolean));

  // ——— Assessments' names are needed by the findings (drawn further down) ———
  function asmName(id) { const a = assessmentById(id); return a ? a.short || a.name : id; }

  // ════════════════ Findings: the page ════════════════
  const srcOfRoute = (route) => { const m = /^findings-(issues|assessment|vulns|stig)$/.exec(route); return m ? { issues: "issue", assessment: "af", vulns: "vuln", stig: "stig" }[m[1]] : ""; };
  const fview = (route) => { const v = Object.assign({ chip: "open", q: "", sev: "", comp: "", ctl: "", asm: "", page: 0 }, view("fnd")); if (route === "findings-poam") v.chip = "poam"; return v; };
  const matchQ = (q, s) => !q || s.toLowerCase().includes(q.toLowerCase());
  // Filtered to a component, the list is findingsOn(component): the component's Findings tab counts the same records.
  let CC = null; const compCtls = (comp) => { if (!CC || CC[0] !== comp) CC = [comp, new Set(ctlsOfComp(comp)), withinOf(comp)]; return CC[1]; }; const compIn = (comp) => { compCtls(comp); return CC[2]; };
  const filtered = (route) => { CC = null; const v = fview(route), src = srcOfRoute(route); const base = findings().filter((f) => !src || f.kind === src); const narrowed = base.filter((f) => (!v.sev || f.sev === v.sev) && (!v.comp || onComp(f, compIn(v.comp), compCtls(v.comp))) && (!v.ctl || f.control === v.ctl) && (!v.asm || f.asm === v.asm) && matchQ(v.q, `${f.title} ${whereOf(f)} ${f.control || ""} ${f.owner || ""}`)); return { v, src, base, narrowed, rows: narrowed.filter(CHIPF[v.chip] || CHIPF.open) }; };
  const sortF = (a, b) => (b.late - a.late) || ((SEVN[b.sev] || 0) - (SEVN[a.sev] || 0)) || String(a.due || "9").localeCompare(String(b.due || "9")) || a.title.localeCompare(b.title);
  const planCell = (f) => { const p = planOfFinding(f); if (!p) return mu("None"); return `<span class="k3e-plan">${p.planned ? `<span class="num${p.late ? " k3e-late" : ""}">${esc(md(p.planned))}</span>` : mu("No date")}${p.total ? K.ring(p.reached, p.total, "milestones") : ""}${f.via ? mu("its issue's") : ""}</span>`; };
  const dueCell = (f) => (f.due ? `<span class="num${f.late ? " k3e-late" : ""}">${esc(md(f.due))}</span>` : NONE);
  const sevCell = (f) => (f.kind === "af" ? detPill(f.det) : f.kind === "stig" ? h.pill(f.cat === "CAT I" ? "bad" : f.cat === "CAT II" ? "warn" : "none", f.cat) : sevPill(f.sev));
  const stateTag = (f) => (f.state === "draft" ? `<span class="k3e-tag">${K.tagged("Draft results")}</span>` : f.state === "deact" ? `<span class="k3e-tag">${K.tagged("Deactivated")}</span>` : f.state === "fixed" ? `<span class="k3e-tag">${K.tagged("Fixed in a newer version")}</span>` : "");
  const findingRow = (f, poam, src) => { const p = planOfFinding(f); return { panel: "k3e-finding", id: f.id, cells: poam
    ? [K.name(f.title, whereOf(f)), sevCell(f), p && p.planned ? `<span class="num${p.late ? " k3e-late" : ""}">${esc(mdy(p.planned))}</span>` : mu("No date"), p && p.total ? K.ring(p.reached, p.total, "milestones") : mu("None"), p && p.resources ? esc(p.resources) : NONE, `<span class="k3e-own">${K.owner(f.owner)}</span>`]
    : [K.name(f.title, [src ? "" : f.source, f.kind === "issue" || f.issueId ? f.req || "" : f.where || ""].filter(Boolean).join(" · ")) + stateTag(f), sevCell(f), f.control ? `<span class="num">${esc(f.control)}</span>` : NONE, f.components[0] ? `<span class="k3e-cut">${esc(compName(f.components[0]))}</span>${f.components.length > 1 ? mu(` +${f.components.length - 1}`) : ""}` : NONE, planCell(f), `<span class="k3e-own">${K.owner(f.owner)}</span>`] }; };
  const FCOLS = [{ label: "Finding" }, { label: "Severity or determination" }, { label: "Control", cls: "nw" }, { label: "Component" }, { label: "Plan", cls: "nw" }, { label: "Owner" }];
  const PCOLS = [{ label: "Finding" }, { label: "Severity or determination" }, { label: "Planned completion", cls: "nw" }, { label: "Milestones", cls: "nw" }, { label: "Resources" }, { label: "Owner" }];
  const pager = (n, page, act) => { const pages = Math.max(1, Math.ceil(n / PER)); return `<span class="num">${n ? `${fmt(page * PER + 1)}–${fmt(Math.min(n, (page + 1) * PER))} of ${fmt(n)}` : "0"}</span>${pages > 1 ? `<span class="k3e-pg">${K.btn("Previous", { sm: true, quiet: true, act, arg: page - 1, disabled: page <= 0 ? "This is the first page" : "" })}${K.btn("Next", { sm: true, quiet: true, act, arg: page + 1, disabled: page >= pages - 1 ? "This is the last page" : "" })}</span>` : ""}`; };
  function findingsPage(route) {
    const { v, src, base, narrowed, rows } = filtered(route), poam = v.chip === "poam";
    const list = rows.slice().sort(sortF), page = Math.min(v.page || 0, Math.max(0, Math.ceil(list.length / PER) - 1));
    const comps = uniq(findings().flatMap((f) => f.components)).map((c) => [c, compName(c)]).sort((a, b) => a[1].localeCompare(b[1]));
    const chip = (id, label) => ({ id, label, count: narrowed.filter(CHIPF[id]).length, on: v.chip === id });
    const dn = narrowed.filter(CHIPF.deact).length, fxn = narrowed.filter(CHIPF.fixed).length;
    const narrowedBy = [v.ctl ? `control ${v.ctl}` : "", v.asm ? asmName(v.asm) : ""].filter(Boolean);
    return K.page({ cls: "k3e",
      head: K.head({ title: "Findings", actions: K.menu("More", [{ label: "Export POA&M", act: "k3e.export" }, { label: "Import scan results", act: "k3e.import" }]) + K.btn("Add finding", { primary: true, act: "k3e.f.add", icon: "plus" }) }),
      body: K.split(
        K.rail({ title: "Source", label: "Source of the findings", items: SRCS.map(([id, label, r]) => ({ id, label, go: r, on: src === id, count: findings().filter((f) => isOpen(f) && (!id || f.kind === id)).length })) }),
        [K.chips([chip("open", "Open"), chip("late", "Past due"), chip("poam", "On the POA&M"), chip("noowner", "No owner"), dn || v.chip === "deact" ? chip("deact", "Deactivated") : null, fxn || v.chip === "fixed" ? chip("fixed", "Fixed") : null], "k3e.f.chip"),
          K.toolbar({ search: { act: "k3e.f.q", value: v.q, placeholder: "Search findings" }, filters: [{ label: "Severity", act: "k3e.f.sev", value: v.sev, options: Object.keys(SEVW).map((k) => [k, SEVW[k]]) }, comps.length ? { label: "Component", act: "k3e.f.comp", value: v.comp, options: comps } : null] }),
          narrowedBy.length ? K.note(`Showing the findings of ${esc(narrowedBy.join(" and "))}. ${K.actLink("Show all", "k3e.f.clear")}`) : "",
          K.table({ label: "Findings", cls: "k3e-list", cols: poam ? PCOLS : FCOLS, rows: list.slice(page * PER, page * PER + PER).map((f) => findingRow(f, poam, src)),
            empty: base.length ? { title: "No finding matches", line: "Clear the search, or choose another state." } : { title: wsx() ? "Nothing found here" : "No finding yet", line: "An assessment's result short of satisfied, a scan's result and what the team notices all arrive here.", action: K.btn("Add finding", { sm: true, act: "k3e.f.add" }) },
            foot: pager(list.length, page, "k3e.f.page") })]) });
  }
  const fset = (patch) => { setView("fnd", Object.assign({ page: 0 }, patch)); if (cur() === "findings-poam" && patch.chip && patch.chip !== "poam") K.go("findings"); else K.redraw(); };
  K.on("k3e.f.chip", (id) => fset({ chip: id }));
  K.on("k3e.f.q", (q) => fset({ q }));
  K.on("k3e.f.sev", (sev) => fset({ sev }));
  K.on("k3e.f.comp", (comp) => fset({ comp }));
  K.on("k3e.f.page", (page) => { setView("fnd", { page }); K.redraw(); });
  K.on("k3e.f.clear", () => fset({ ctl: "", asm: "", comp: "" }));

  // ——— Changing a finding: each writes the store the fact already lives in ———
  const nextId = (p) => `${p}-${CH.seq ? CH.seq(p) : K.id("n")}`;
  const setOwner = (f, name) => { if (f.issueId && wsx() && !f.chain) V.set("v3.R.own.issue." + f.issueId, name); else if (f.made) set("made", get("made", []).map((m) => (m.id === f.id ? Object.assign({}, m, { owner: name }) : m))); else mapSet("own", f.id, name); };
  const DEACT_WHY = [["Not applicable to this system", "Not applicable to this system"], ["False positive", "False positive"], ["Duplicate of another finding", "Duplicate of another finding"], ["Inherited and answered by the provider", "Inherited and answered by the provider"], ["Risk accepted", "Risk accepted"]];
  const createPlan = (f, o) => {
    const id = nextId("k3e-poam"), rec = { id, title: o.title, issue: f.issueId || f.id, owner: f.owner || "", planned: o.planned, plan: o.text || "", created: TODAY };
    if (wsx()) CH.push("poams", rec); else set("plans", get("plans", []).concat([rec]));
    if (o.resources) mapSet("res", id, o.resources);
    if (o.ms) mapSet("ms", id, [{ id: K.id("m"), title: o.ms, planned: o.msDate || null }]);
    return id;
  };
  const movePlan = (p, to, reason) => {
    if (!wsx()) return set("plans", get("plans", []).map((x) => (x.id === p.id ? Object.assign({}, x, { planned: to }) : x)));
    const L = CH.list ? CH.list("poams") : CH.poams();
    if (L.some((x) => x.id === p.id)) V.set("chain.poams", L.map((x) => (x.id === p.id ? Object.assign({}, x, { planned: to }) : x)));
    else V.set("v3.R.planned." + p.id, { to, from: p.planned, reason, at: TODAY, by: ME });
  };
  const SEVOF = (lik, imp) => (CH.sevOf ? CH.sevOf(lik, imp) : "moderate");
  const createRisk = (o, f) => {
    const id = nextId("k3e-risk"), p = f ? planOfFinding(f) : null;
    const rec = { id, title: o.title, issue: f ? f.issueId || f.id : null, poam: p ? p.id : null, lik: o.lik, imp: o.imp, sev: SEVOF(o.lik, o.imp), owner: o.owner || "", threat: o.threat || "", created: TODAY, due: o.due || "", tech: [] };
    if (wsx()) { CH.push("risks", rec); V.set("v3.R.resp." + id, o.resp); } else set("risks", get("risks", []).concat([Object.assign({ resp: o.resp }, rec)]));
    return id;
  };
  const LEVELS = [["low", "Low"], ["moderate", "Moderate"], ["high", "High"]];
  const RESP = { mitigate: "Mitigate", accept: "Accept", transfer: "Transfer" };
  const riskForm = (f) => K.form({ title: "Create risk", submit: "Create risk", intro: f ? `Rests on <b>${esc(f.title)}</b>. ${hasPlan(f) ? "Its plan answers the risk when the response is Mitigate." : "It has no plan yet: with Mitigate, create the plan next."}` : "A risk says what could happen, to what. Link the findings behind it from its panel.",
    fields: [{ key: "title", label: "What could happen", required: true, hint: "To what, in one sentence" }, { key: "threat", label: "Threat", type: "textarea", rows: 3, hint: "Who or what, and how" },
      { key: "lik", label: "Likelihood", type: "select", options: LEVELS, value: "moderate", required: true, half: true }, { key: "imp", label: "Impact", type: "select", options: LEVELS, value: f && f.sev === "critical" ? "high" : "high", required: true, half: true },
      { key: "resp", label: "Response", type: "select", required: true, options: [["mitigate", "Mitigate: a plan answers it"], ["accept", `Accept: the ISSO, the ISSM and ${AO} accept it in turn`], ["transfer", "Transfer: another organization carries it"]], value: f && hasPlan(f) ? "mitigate" : "" },
      { key: "owner", label: "Owner", type: "select", options: ownerOpts(), half: true }, { key: "due", label: "Response due", type: "date", half: true, value: addDays(TODAY, 30) }],
    onSubmit: (o) => { const id = createRisk(o, f); K.redraw(); K.toast(`Risk created: ${o.title} · response ${RESP[o.resp]}`, f && K.recRoute ? { label: "Open risk", route: K.recRoute("k3e-risk", id) } : null); if (!f && K.recRoute) K.go(K.recRoute("k3e-risk", id)); } });
  K.on("k3e.f.owner", (id) => { const f = findingById(id); if (!f) return; K.form({ title: "Assign owner", submit: "Assign owner", intro: esc(f.title), fields: [{ key: "owner", label: "Owner", type: "select", options: ownerOpts(), value: f.owner || "", required: true }], onSubmit: (o) => { setOwner(f, o.owner); K.redraw(); K.toast(`${o.owner} owns the finding`); } }); });
  K.on("k3e.f.plan", (id) => { const f = findingById(id); if (!f) return; K.form({ title: "Create plan", submit: "Create plan", intro: `The plan of action for <b>${esc(f.title)}</b>. It joins the POA&amp;M with its milestones.`,
    fields: [{ key: "title", label: "Plan", required: true, value: f.kind === "af" ? `Correct ${f.control}${f.objective ? " · " + f.objective : ""}` : "", hint: "What will be done, in one line" }, { key: "text", label: "How", type: "textarea", rows: 3 },
      { key: "planned", label: "Planned completion", type: "date", required: true, half: true, value: f.due && f.due >= TODAY ? f.due : addDays(TODAY, 30) }, { key: "resources", label: "Resources", half: true, hint: "Hours, funding or people" },
      { key: "ms", label: "First milestone", hint: "A step on the way, with its own date" }, { key: "msDate", label: "Milestone date", type: "date", half: true }],
    onSubmit: (o) => { if (o.planned < TODAY) return { planned: "Choose today or a later day." }; if (o.msDate && o.msDate > o.planned) return { msDate: "A milestone falls on or before the planned completion." }; createPlan(f, o); K.redraw(); K.toast(`Plan created: ${o.title}. The finding is on the POA&M.`); } }); });
  K.on("k3e.f.move", (id) => { const f = findingById(id), p = f && planOfFinding(f); if (!p) return; K.form({ title: "Change planned date", submit: "Change planned date", intro: `${esc(p.title)}: planned ${esc(mdy(p.planned) || "with no date")} now. The change and its reason stay in the plan's history and the POA&amp;M export.`,
    fields: [{ key: "to", label: "New planned completion", type: "date", required: true, value: addDays(p.planned && iso(p.planned) > TODAY ? p.planned : TODAY, 30) }, { key: "reason", label: "Reason for the change", type: "textarea", rows: 3, required: true }],
    onSubmit: (o) => { if (o.to < TODAY) return { to: "Choose today or a later day." }; movePlan(p, o.to, o.reason); mapSet("hist", p.id, (get("hist", {})[p.id] || []).concat([{ at: TODAY, by: ME, from: p.planned, to: o.to, reason: o.reason }])); K.redraw(); K.toast(`Planned completion moved to ${mdy(o.to)}`); } }); });
  K.on("k3e.f.ms", (id) => { const f = findingById(id), p = f && planOfFinding(f); if (!p) return; K.form({ title: "Add milestone", submit: "Add milestone", intro: esc(p.title),
    fields: [{ key: "title", label: "Milestone", required: true }, { key: "planned", label: "Planned", type: "date", required: true, value: p.planned && iso(p.planned) > TODAY ? iso(p.planned) : addDays(TODAY, 14) }],
    onSubmit: (o) => { mapSet("ms", p.id, (get("ms", {})[p.id] || []).concat([{ id: K.id("m"), title: o.title, planned: o.planned }])); K.redraw(); K.toast(`Milestone added: ${o.title}`); } }); });
  K.on("k3e.f.msdone", (a) => { mapSet("msd", a.plan + ":" + a.key, a.undo ? null : TODAY); K.redraw(); K.toast(a.undo ? "Milestone reopened" : "Milestone reached"); });
  K.on("k3e.f.res", (id) => { const f = findingById(id), p = f && planOfFinding(f); if (!p) return; K.form({ title: "Edit resources", submit: "Save resources", fields: [{ key: "resources", label: "Resources", value: p.resources, hint: "Hours, funding or people the plan needs" }], onSubmit: (o) => { mapSet("res", p.id, o.resources || null); K.redraw(); K.toast("Resources saved"); } }); });
  K.on("k3e.f.risk", (id) => { const f = findingById(id); if (f) riskForm(f); });
  K.on("k3e.f.rlink", (id) => { const f = findingById(id); if (!f) return; K.pick({ title: "Link a risk", submit: () => "Link risk", search: "Search the risk register", create: { label: "Create risk", onCreate: () => riskForm(f) }, items: riskList().map((r) => ({ id: r.id, title: r.title, desc: r.threat, meta: SEVW[r.sev] || "" })), onPick: (rid) => { mapSet("rlink", f.id, rid); K.redraw(); K.toast("Risk linked to the finding"); } }); });
  K.on("k3e.f.deact", (id) => { const f = findingById(id); if (!f) return; const p = planOfFinding(f); K.form({ title: "Deactivate finding", submit: "Deactivate finding", danger: true, intro: `<b>${esc(f.title)}</b> leaves the open findings${p ? " and the POA&amp;M" : ""}; it stays under Deactivated with the reason.`,
    fields: [{ key: "reason", label: "Reason", type: "select", options: DEACT_WHY, required: true }, { key: "note", label: "Why", type: "textarea", rows: 3, required: true, hint: "What shows it, in a sentence or two" }],
    onSubmit: (o) => { const rec = { reason: o.reason, note: o.note, at: TODAY, by: ME }; if (f.issueId && wsx() && !f.made) V.set("v3.R.deact", Object.assign({}, V.get("v3.R.deact", null) || {}, { [f.issueId]: rec })); else mapSet("deact", f.id, rec); K.redraw(); K.toast(`Finding deactivated: ${o.reason}`); } }); });
  K.on("k3e.f.react", (id) => { const f = findingById(id); if (!f) return; K.confirm({ title: "Reactivate finding", text: `${esc(f.title)} returns to the open findings${hasPlan(f) ? " and the POA&amp;M" : ""}.`, submit: "Reactivate finding", onOk: () => { if (f.issueId && wsx() && !f.made) { const d = Object.assign({}, V.get("v3.R.deact", null) || {}); delete d[f.issueId]; V.set("v3.R.deact", d); } else mapSet("deact", f.id, null); K.redraw(); K.toast("Finding reactivated"); } }); });
  // pre (lead): a record's page that adds a finding about itself names its control and component, so the form opens on them.
  K.on("k3e.f.add", (pre) => K.form({ title: "Add finding", submit: "Add finding", intro: "Something the team noticed outside an assessment or a scan. Results short of satisfied and scan results arrive on their own.",
    fields: [{ key: "title", label: "What was found", required: true }, { key: "sev", label: "Severity", type: "select", options: Object.keys(SEVW).map((k) => [k, SEVW[k]]), value: "moderate", required: true, half: true }, { key: "due", label: "Remediate by", type: "date", half: true, value: addDays(TODAY, 90) },
      { key: "control", label: "Control", hint: "Its code, such as AC-2", half: true, value: pre && pre.control ? pre.control : "" }, { key: "comp", label: "Component", type: "select", half: true, value: pre && pre.comp ? pre.comp : "", options: Object.values(EBY()).filter(() => wsx()).map((e) => [e.code, e.name]) }, { key: "owner", label: "Owner", type: "select", options: ownerOpts() }],
    onSubmit: (o) => { if (o.control && wsx() && !inBaseline(o.control.toUpperCase())) return { control: "No control of the baseline has that code." }; const id = K.id("fnd"); set("made", get("made", []).concat([{ id, title: o.title, sev: o.sev, due: o.due, control: o.control ? o.control.toUpperCase() : null, comp: o.comp || null, owner: o.owner || "", opened: TODAY }])); K.redraw(); K.toast(`Finding added: ${o.title}`); if (K.recRoute) K.go(K.recRoute("k3e-finding", id)); } }));
  K.on("k3e.import", () => K.form({ title: "Import scan results", submit: "Import results", intro: "An ACAS .nessus file, a STIG checklist (.ckl, .cklb) or an SBOM. Each result becomes a finding on the component it names; a result already here is updated, not doubled.", fields: [{ key: "kind", label: "Kind", type: "select", required: true, options: ["ACAS vulnerability scan (.nessus)", "STIG checklist (.ckl, .cklb)", "SBOM (CycloneDX, SPDX)"] }, { key: "file", label: "File name", required: true, hint: "The prototype reads no file: it records the import" }], onSubmit: (o) => { K.toast(`${o.file} queued: its results join Findings once read`); } }));
  const csvCell = (s) => `"${String(s == null ? "" : s).replace(/"/g, '""')}"`;
  K.on("k3e.export", () => {
    const rows = findings().filter(CHIPF.poam).sort(sortF), lines = [["Finding", "Source", "Severity", "Control", "Component", "Plan", "Planned completion", "Milestones reached", "Milestones", "Resources", "Owner", "Status"].map(csvCell).join(",")];
    for (const f of rows) { const p = planOfFinding(f); lines.push([f.title, f.source, f.kind === "af" ? DETW[f.det] : f.cat || SEVW[f.sev] || "", f.control || "", f.components.map(compName).join("; "), p.title, p.planned || "", p.reached, p.total, p.resources, f.owner, p.status].map(csvCell).join(",")); }
    const done = wsx() ? regs().POAM.filter((p) => p.status === "completed") : [];
    for (const p of done) lines.push([p.title, "Operational issue", "", "", "", p.title, p.planned || "", (p.ms || []).length, (p.ms || []).length, "", p.owner || "", "completed"].map(csvCell).join(","));
    const name = `${prog()}-poam-${TODAY}.csv`;
    if (K.save) K.save(name, lines.join("\n")); else K.toast(`POA&M exported: ${plural(rows.length, "open finding")} with a plan${done.length ? ` and ${plural(done.length, "completed item")}` : ""}`);
  });

  // ════════════════ A finding: its preview (the eye on a row) and its page (finding--<id>), from one definition ════════════════
  const recGo = (kind, id) => (K.recRoute ? K.recRoute(kind, id) : "");
  const ctlRoute = (code) => (code && P["k3c-control"] && inBaseline(code) ? recGo("k3c-control", code) : "");
  const ctlOpen = (code) => (code ? (ctlRoute(code) ? K.link(`${code} ${ctlTitle(code)}`.trim(), ctlRoute(code)) : esc(`${code} ${ctlTitle(code)}`.trim())) : NONE);
  const clip = (t, n) => { t = String(t || ""); if (t.length <= n) return t; const c = t.slice(0, n - 1), i = c.lastIndexOf(" "); return (i > n * 0.6 ? c.slice(0, i) : c).replace(/[\s,;:(]+$/, "") + "…"; };
  const riskRow = (r) => ({ panel: "k3e-risk", id: r.id, cells: [K.name(r.title, [SEVW[r.sev] || "", respWord(r)].filter(Boolean).join(" · ")), K.owner(r.owner)] });
  // A next step is { text, label, act, arg } (done here, in a dialog) or { text, label, go } (done on another record's page).
  // In a preview the step's line carries its button; on a page the button is the header's one primary and the line says why.
  const stepBtn = (nx, page) => (!nx || !nx.label ? "" : nx.go ? (page ? K.btn(nx.label, { primary: true, go: nx.go }) : K.link(nx.label, nx.go)) : K.btn(nx.label, { primary: page || !nx.plain, sm: !page, act: nx.act, arg: nx.arg }));
  const stepLine = (nx, page) => (nx ? K.next({ text: nx.text, action: page ? "" : stepBtn(nx, false) }) : "");
  function nextOfFinding(f) {
    const p = planOfFinding(f), r = riskOfFinding(f);
    if (f.state === "deact" || f.state === "fixed") return null;
    if (f.state === "draft") return { text: `It decides nothing until ${esc(asmName(f.asm))}'s results are published.`, label: "Open the results", go: `assessment--${f.asm}--results` };
    if (f.via) return { text: "An operational issue tracks its correction: the plan below is that issue's.", label: "Open the issue", go: recGo("k3e-finding", f.via) };
    if (!p) return { text: "No plan answers it yet.", label: "Create plan", act: "k3e.f.plan", arg: f.id };
    if (p.late) return { text: `Its plan was due ${esc(mdy(p.planned))}.`, label: "Change planned date", act: "k3e.f.move", arg: f.id };
    if (!f.owner) return { text: "Nobody owns it.", label: "Assign owner", act: "k3e.f.owner", arg: f.id };
    if (!r) return { text: "No risk says what it could lead to.", label: "Create risk", act: "k3e.f.risk", arg: f.id };
    const m = p.ms.find((x) => !x.done && x.status !== "completed");
    return m ? { text: `Next milestone: ${esc(m.title)}${m.planned ? `, ${esc(md(m.planned))}` : ""}.`, label: "Mark reached", act: "k3e.f.msdone", arg: { plan: p.id, key: m.key }, plain: true } : null;
  }
  const compKind = (c) => { const x = V3.fact("component", c); return (x && x.kind) || ((EBY()[c] || {}).type || "").replace(/^./, (y) => y.toUpperCase()) || ""; };
  const compRow = (c) => { const cells = [K.name(compName(c), "", c), esc(compKind(c))]; return hasCompPage(c) ? Object.assign({ go: "component--" + c, cells }, P["k3s-comp"] ? { peek: { panel: "k3s-comp", id: c } } : {}) : { cells }; };
  const ctlRow = (code) => { const st = V3.fact("status", code), cells = [K.name(ctlTitle(code) || code, "", ctlTitle(code) ? code : ""), st ? detPill(st) : NONE]; return ctlRoute(code) ? { panel: "k3c-control", id: code, cells } : { cells }; };
  K.panel("k3e-finding", (raw, opt) => {
    const page = !!(opt && opt.page), f = findingById(String(raw || "")) || findingById(String(raw || "").split("|")[0]); if (!f) return null; const id = f.id;
    const src = f.via ? findingById(f.via) : null, pf = src || f, p = planOfFinding(pf), r = riskOfFinding(f) || (src ? riskOfFinding(src) : null), nx = nextOfFinding(f), a = f.asm ? assessmentById(f.asm) : null;
    const carry = !f.components.length && f.kind === "af" ? compsOfCtl(f.control) : [];
    const facts = [
      ["Source", a ? `${esc(f.source)} · ${K.link(a.short || a.name, a.route + (f.kind === "af" ? "--findings" : ""))}` : esc(f.source)],
      f.objective ? ["Objective", `<span class="num">${esc(f.objective)}</span>${f.methods && f.methods.length ? mu(" · " + f.methods.map((m) => m[0].toUpperCase() + m.slice(1)).join(", ")) : ""}`] : null,
      page ? null : ["Control", ctlOpen(f.control)],
      page ? null : ["Component", f.components.length ? f.components.slice(0, 3).map(compLink).join(", ") + (f.components.length > 3 ? mu(` and ${f.components.length - 3} more`) : "") : carry.length ? mu(`${plural(carry.length, "component")} carry ${esc(f.control)}`) : mu("The system as a whole")],
      f.req ? ["Requirement", K.recRoute && P["k3d-req"] ? K.link(f.req, recGo("k3d-req", f.req)) : `<span class="num">${esc(f.req)}</span>`] : null,
      ["Owner", `${K.owner(f.owner)} ${K.actLink(f.owner ? "Change" : "Assign", "k3e.f.owner", f.id)}`],
      f.due ? ["Remediate by", `<span class="num${f.late ? " k3e-late" : ""}">${esc(mdy(f.due))}</span>${f.late ? mu(` · ${plural(days(TODAY, f.due), "day")} past`) : ""}`] : null,
      f.opened ? ["Found", `<span class="num">${esc(mdy(f.opened))}</span>${f.by ? mu(` · recorded as ${esc(f.by)}${f.rec && f.rec !== f.by ? " by " + esc(f.rec) : ""}`) : ""}`] : null,
      f.state === "deact" && f.deact ? ["Deactivated", `${esc(f.deact.reason)}${mu(` · ${esc(md(f.deact.at))} · ${esc(f.deact.by || "")}`)}<br>${mu(esc(f.deact.note || ""))}`] : null,
      f.fixedOn && f.fixedOn.length ? ["Fixed", `${f.fixedOn.map(compLink).join(", ")} took a version that fixes it`] : null,
    ];
    const hist = p ? get("hist", {})[p.id] || [] : [];
    const msAct = (m) => (m.done || m.status === "completed" ? (m.done && get("msd", {})[p.id + ":" + m.key] ? K.btn("Undo", { sm: true, quiet: true, act: "k3e.f.msdone", arg: { plan: p.id, key: m.key, undo: true } }) : "") : K.btn("Mark reached", { sm: true, quiet: true, act: "k3e.f.msdone", arg: { plan: p.id, key: m.key } }));
    const msState = (m) => (m.done || m.status === "completed" ? h.pill("ok", "Reached") : m.planned && iso(m.planned) < TODAY ? h.pill("bad", "Past its date") : m.status === "in_progress" ? h.pill("info", "Under way") : h.pill("none", "Planned"));
    const msTable = p && p.ms.length ? (page
      ? K.table({ label: "Milestones", cols: [{ label: "Milestone" }, { label: "Planned", cls: "nw" }, { label: "State" }, { label: "", cls: "tight" }], rows: p.ms.map((m) => ({ cells: [K.name(m.title), m.planned ? `<span class="num">${esc(mdy(m.planned))}</span>` : NONE, msState(m), msAct(m)] })) })
      : K.table({ label: "Milestones", cols: [{ label: "Milestone" }, { label: "Planned", cls: "nw" }, { label: "", cls: "tight" }], rows: p.ms.map((m) => ({ cells: [K.name(m.title), m.planned ? `<span class="num">${esc(md(m.planned))}</span>` : NONE, m.done || m.status === "completed" ? `${h.pill("ok", "Reached")}${msAct(m)}` : msAct(m)] })) })) : "";
    const planSec = p
      ? K.section({ title: "Plan", count: page ? p.total : null, actions: K.btn("Add milestone", { sm: true, act: "k3e.f.ms", arg: pf.id, icon: "plus" }), body: [
        K.facts([["Plan", `${esc(p.title)}${p.text ? `<br>${mu(esc(p.text))}` : ""}`], ["Planned completion", `${p.planned ? `<span class="num${p.late ? " k3e-late" : ""}">${esc(mdy(p.planned))}</span>` : mu("No date")} ${K.actLink("Change planned date", "k3e.f.move", pf.id)}${hist.length ? `<br>${mu(`Moved ${hist.length === 1 ? "once" : hist.length + " times"}: ${esc(hist[hist.length - 1].reason)}`)}` : ""}`], ["Resources", `${p.resources ? esc(p.resources) : mu("None recorded")} ${K.actLink(p.resources ? "Edit" : "Add", "k3e.f.res", pf.id)}`], f.via ? ["Belongs to", K.link(clip((src || {}).title || "its operational issue", 60), recGo("k3e-finding", f.via))] : null]),
        msTable || `<div class="k3-none-row"><span>No milestone yet</span>${K.actLink("Add milestone", "k3e.f.ms", pf.id)}</div>`] })
      : K.section({ title: "Plan", body: `<div class="k3-none-row"><span>No plan yet: with one, the finding is on the POA&amp;M</span>${f.state === "deact" || f.state === "fixed" ? "" : K.actLink("Create plan", "k3e.f.plan", f.id)}</div>` });
    const riskSec = K.related({ title: "Risk", count: r ? 1 : 0, add: r ? null : { label: "Create risk", act: "k3e.f.risk", arg: f.id }, more: r ? "" : K.btn("Link a risk", { sm: true, quiet: true, act: "k3e.f.rlink", arg: f.id }), cols: [{ label: "Risk" }, { label: "Owner" }], rows: r ? [riskRow(r)] : [], empty: "No risk rests on it yet" });
    const found = f.note || f.text || (f.cve ? `${f.cve.title}. CVSS ${f.cve.cvss || "—"}${f.cve.iava ? " · " + f.cve.iava : ""} · ${f.cve.status}.` : "") || (f.stig ? `${f.stig.stig} on ${f.stig.asset}: the rule is open.` : "");
    const foundSec = found ? K.section({ title: "What was found", body: `<p class="k3e-p">${f.text ? esc(f.text) + (f.note ? "<br>" : "") : ""}${esc(f.note || (f.text ? "" : found))}</p>` }) : "";
    const menu = K.menu("More", [{ label: f.owner ? "Change owner" : "Assign owner", act: "k3e.f.owner", arg: f.id }, p ? { label: "Change planned date", act: "k3e.f.move", arg: pf.id } : null, f.state === "fixed" ? null : f.state === "deact" ? { label: "Reactivate", act: "k3e.f.react", arg: f.id } : { label: "Deactivate", act: "k3e.f.deact", arg: f.id, danger: true }], { sm: !page });
    const out = { label: SRC[f.kind], title: f.title, chip: `${sevCell(f)}${stateTag(f)}`, actions: menu, facts, sections: [stepLine(nx, false), foundSec, planSec, riskSec] };
    if (!page) return out;
    // The page: a short title with the full sentence under it, the next step's button as the one primary, and the control
    // and the components it stands on as rows that go to their pages.
    const short = clip(f.title, 64), where = f.components.length ? f.components : carry, srcTab = SRCS.find((x) => x[0] === f.kind) || SRCS[0];
    return Object.assign(out, { title: short, sub: short !== f.title ? esc(f.title) : "", crumbs: [["Findings", "findings"], [srcTab[1], srcTab[2]], [clip(f.title, 40)]], actions: menu + stepBtn(nx, true),
      sections: [stepLine(nx, true), foundSec, planSec, riskSec,
        K.related({ title: "Control", count: f.control ? 1 : 0, cols: [{ label: "Control" }, { label: "Status", cls: "nw" }], rows: f.control ? [ctlRow(f.control)] : [], empty: "It names no control" }),
        K.related({ title: f.components.length || !carry.length ? "Components" : `Components that carry ${f.control}`, count: where.length, cols: [{ label: "Component" }, { label: "Kind", cls: "nw" }], rows: where.map(compRow), empty: "It stands on the system as a whole" })] });
  });

  // The rest of the module (assessments, risks, authorization, folding) registers below; these are filled in there.
  let assessmentById = () => null, respWord = () => "";
  PA.v3e = { findings, findingById, planOfFinding, riskOfFinding, findingsOf, findingsOn, risksOfCtl, findingsPage, filtered, CHIPF, isOpen, regs, get, set, mapSet, riskList, poamList, hooks: (o) => { if (o.assessmentById) assessmentById = o.assessmentById; if (o.respWord) respWord = o.respWord; },
    u: { recGo, ctlRoute, ctlRow, compRow, clip, stepBtn, stepLine, sevCell, planCell, md, mdy, iso, days, addDays, plural, mu, NONE, parse, txt, uniq, cur, safe, memo, stat, old, off, people, ownerOpts, sevPill, detPill, SEVW, SEVN, DETW, SHORT, ctlTitle, inBaseline, compName, compLink, compsOfCtl, ctlOpen, findingRow, FCOLS, sortF, riskRow, riskForm, createRisk, pager, view, setView, matchQ, publicFinding, asmName, whereOf, hasPlan, ownPlan, RESP, LEVELS, SEVOF, nextId, PER, TODAY, ME, LEAD, ASSESSOR, AO, ISSO, ISSM } };

  V3.S(/^findings(-(vulns|assets|assessment|deactivated|history))?$/, (orig, route) => findingsPage(/-(vulns|assessment)$/.test(route) ? route : "findings"));
  for (const r of ["findings-issues", "findings-stig", "findings-poam"]) K.screen(r, () => findingsPage(r), "findings");
  V3.P("a-risk-issue", (orig, id) => P["k3e-finding"](String(id || "").split("|")[0]));
  V3.P("a-risk-poam", (orig, id) => { const pid = String(id || "").split("|")[0], f = findings().find((x) => { const p = planOfFinding(x); return p && p.id === pid && !x.via; }); return f ? P["k3e-finding"](f.id) : orig(); });
  Object.assign(V3.facts, { findingsOf: (code) => findingsOf(code).map(publicFinding), findingsOn: (comp) => findingsOn(comp).map(publicFinding),
    findingCounts: () => { const L = findings(); return { open: L.filter(CHIPF.open).length, late: L.filter(CHIPF.late).length, poam: L.filter(CHIPF.poam).length, noOwner: L.filter(CHIPF.noowner).length, bySource: Object.fromEntries(Object.keys(SRC).map((k) => [k, L.filter((f) => isOpen(f) && f.kind === k).length])) }; } });
})();

// ════════════════ Assessments: control assessments, cyber tests and monitoring checks in one table; an assessment is a page ════════════════
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k, V = PA && PA.v2, E = PA && PA.v3e;
  if (!V3 || !K || !V || !E) return;
  const SSP = PA.SSP, P = PA.P, S = PA.S, CH = V.chain, h = PA.h, esc = K.esc, fmt = K.fmt, U = E.u;
  const { md, mdy, iso, days, addDays, plural, mu, NONE, parse, txt, uniq, cur, memo, stat, people, ownerOpts, detPill, DETW, SHORT, ctlTitle, inBaseline, findingRow, FCOLS, sortF, view, setView, matchQ, TODAY, ME, LEAD, ASSESSOR, AO } = U;
  const wsx = () => V3.wsx(), prog = () => V3.prog(), r3 = () => PA.v3r || null;
  const get = E.get, set = E.set, mapSet = E.mapSet;
  const KINDS = [["", "All assessments", "assessments"], ["control", "Control assessments", "assessments-control"], ["cyber", "Cyber tests", "assessments-cyber"], ["check", "Monitoring checks", "assessments-checks"]];
  const KINDW = { control: "Control assessment", cyber: "Cyber test", check: "Monitoring check" };
  const STP = { Active: "info", Planned: "none", Proposed: "none", Completed: "ok", Overdue: "bad", "Due soon": "warn", "On schedule": "ok" };
  const stPill = (w) => h.pill(STP[w] || "none", w);
  const INC2 = () => (PA.v3f && PA.v3f.INC2) || {};
  const objState = (code) => V.get("v3.R.obj." + code, null) || {};
  const objectivesOf = (code) => (r3() ? r3().objectivesOf(code) : []);
  const CAD = { Daily: 1, Weekly: 7, Monthly: 30, Quarterly: 91, Yearly: 365 };
  const personOf = (td) => { const n = td && td.querySelector(".nm"); return n ? txt(n) : txt(td).replace(/^[A-Z]{2}(?=[A-Z][a-z])/, ""); };
  // v2's cyber tests and the checks' runs are closures of their modules: read from the pages that draw them.
  const cyberRows = () => memo("cyber", () => { try { return [...parse(S["cyber-te"] ? S["cyber-te"]() : "").querySelectorAll('tbody tr[data-panel="v7a-camp"]')].map((tr) => { const c = [...tr.children]; return { id: tr.getAttribute("data-id"), name: txt(c[0]), phase: txt(c[1]), status: txt(c[2]), window: txt(c[3]), lead: personOf(c[4]) === "—" ? "" : personOf(c[4]), plan: txt(c[5]), findings: +txt(c[6]) || 0 }; }); } catch (e) { return []; } });
  const cyberFinds = () => stat("cyf", () => [...parse(U.old("cyber-te-findings")).querySelectorAll('tbody tr[data-panel="v7a-cyf"]')].map((tr) => { const c = [...tr.children].map(txt); return { id: tr.getAttribute("data-id"), title: c[0], sev: c[1], from: c[2], then: c[3], within: c[5] }; })) || [];
  const checkRuns = () => stat("chk", () => { const m = {}; for (const tr of parse(U.old("conmon")).querySelectorAll('tbody tr[data-panel="v7p-check"]')) { const c = [...tr.children]; const codes = (txt(c[0]).match(/[A-Z]{2}-\d+(?:\(\d+\))?/g) || []); m[tr.getAttribute("data-id")] = { last: txt(c[3]), runs: +txt(c[6]) || 0, covers: codes }; } return m; }) || {};
  const runsOf = (id) => get("runs", {})[id] || [];

  function build() {
    const out = [];
    for (const c of get("camps", [])) out.push(Object.assign({ kind: "control", status: "Planned", route: "assessment--" + c.id, made: true }, c));
    if (!wsx()) return out;
    const C4 = (PA.data && PA.data.CAMPAIGNS) || [], row = (re) => C4.find((x) => re.test(x[0])) || [];
    const ex = row(/Expanded Control Set/), ini = row(/Initial Authorization/);
    out.push({ id: "exp", kind: "control", name: ex[0] || "WS-X90 Expanded Control Set Assessment", short: "Expanded control set assessment", status: "Active", from: ex[3], to: ex[4], lead: LEAD, assessor: ASSESSOR, ssp: "SSP 2, published Jul 25", route: "assessment--exp" });
    const cy = cyberRows();
    for (const c of CH.camps()) { if (c.id === "exp") continue; const cyber = /vulnerability identification|cybersecurity DT&E|CVPA|penetration|adversarial/i.test(c.title); if (cyber && cy.some((x) => x.name === c.title)) continue; out.push({ id: c.id, kind: cyber ? "cyber" : "control", name: c.title, short: c.short || c.title, status: c.from && c.from > TODAY ? "Planned" : "Active", from: c.from, to: c.to, lead: c.lead || LEAD, owner: c.owner, ssp: c.ssp, route: "assessment--" + c.id, chain: true }); }
    if (ini[0]) out.push({ id: "init", kind: "control", name: ini[0], short: "Initial authorization assessment", status: "Completed", from: ini[3], to: ini[4], lead: LEAD, assessor: ASSESSOR, ssp: "SSP 2, published Jul 25", route: "assessment--init" });
    for (const c of cy) out.push({ id: "cy-" + c.id, kind: "cyber", name: c.name, short: c.name.replace(/^WS-X90 /, "").replace(/^./, (x) => x.toUpperCase()), status: c.status, window: c.window, phase: c.phase, lead: c.lead, plan: c.plan, cyf: c.findings, route: "assessment--cy-" + c.id });
    const runs = checkRuns();
    for (const c of V3.fact("checks", prog()) || []) {
      const mine = runsOf(c.id), last = mine[mine.length - 1], step = CAD[c.cadence] || 0;
      const due = last && step ? addDays(last.at, step) : last ? "" : c.due, state = last ? (last.result === "Failed" ? "Overdue" : "On schedule") : c.state === "overdue" ? "Overdue" : c.state === "soon" ? "Due soon" : "On schedule";
      out.push({ id: "chk-" + c.id, kind: "check", name: c.name, short: c.name, status: state, cadence: c.cadence, due, lead: c.owner || "", failing: c.failing || 0, covers: (runs[c.id] || {}).covers || [], lastRun: last ? md(last.at) : (runs[c.id] || {}).last || "", nruns: ((runs[c.id] || {}).runs || 0) + mine.length, check: c.id, route: "assessment--chk-" + c.id });
    }
    return out;
  }
  const assessments = () => memo("assessments", build);
  const byId = (id) => assessments().find((a) => a.id === id) || null;
  E.hooks({ assessmentById: byId });
  // The controls an assessment holds, and how far its objectives are judged.
  const ctlsOf = (id) => memo("asmctl:" + id, () => { const a = byId(id); if (!a || a.kind !== "control" || !r3()) return []; if (a.made) return a.controls || []; if (id === "init") return []; if (id === "exp") return SSP.controls.map((c) => c.c || c.code).filter((code) => { const c = r3().campaignOf(code); return c && c.id === "exp"; }); return r3().planCodes(id); });
  const ctlDet = (code) => { const s = CH.st(code); if (s.det) return { det: s.det, draft: !s.published }; const mine = r3() && Object.keys(objState(code)).length ? r3().derived(code) : null; if (mine) return { det: mine, draft: r3().draftsOf(code).length > 0 }; const d = INC2()[code]; if (d && d !== "not_assessed") return { det: d, draft: !(CH.inc2 && CH.inc2()), whole: true }; return null; };
  const judgedN = (code) => { const n = objectivesOf(code).length, s = objState(code), j = objectivesOf(code).filter((o) => s[o.i] && s[o.i].det).length; const d = ctlDet(code); return j || !(d && d.whole) ? j : n; };
  const progress = (id) => memo("asmprog:" + id, () => { const L = ctlsOf(id); return { done: L.reduce((n, c) => n + judgedN(c), 0), total: L.reduce((n, c) => n + objectivesOf(c).length, 0) }; });
  const draftsIn = (id) => ctlsOf(id).filter((c) => r3() && r3().draftsOf(c).length);
  const planOf = (id) => (id === "init" ? { rev: 1, state: "approved", steps: [] } : r3() ? r3().planOf(id) : { rev: 1, state: "draft", steps: [] });
  const resultsOf = (a) => memo("asmres:" + a.id, () => {
    const out = ((V3.fact("results", prog()) || []).filter((r) => r.campaign === a.name)).map((r) => Object.assign({}, r));
    if (a.id === "exp" && !CH.camp("exp")) for (const r of V.get("v3.R.res.exp", null) || []) out.push({ id: "exp:" + r.title, title: r.title, state: "published", at: r.at, by: r.by, rec: r.rec, n: r.n });
    const d = draftsIn(a.id); if (a.id === "exp" && d.length && !out.some((r) => r.state === "draft" && /^exp:/.test(r.id))) out.push({ id: "exp:draft", title: "Objective determinations — draft", state: "draft", n: d.length, mine: true });
    return out;
  });
  const toPublish = (a) => resultsOf(a).filter((r) => r.state === "draft").length;
  const findingsOfAsm = (id) => E.findings().filter((f) => f.asm === id && E.isOpen(f));
  const windowCell = (a) => (a.kind === "check" ? `${esc(a.cadence)}${a.due ? ` · next <span class="num${a.status === "Overdue" ? " k3e-late" : ""}">${esc(md(a.due))}</span>` : ""}` : a.window ? esc(a.window) : a.from ? `<span class="num">${esc(md(a.from))} – ${esc(a.to && a.to.slice(0, 4) !== a.from.slice(0, 4) ? mdy(a.to) : md(a.to))}</span>` : NONE);
  const coversLine = (a) => (a.kind === "control" ? (a.id === "init" ? "The baseline as first authorized" : `${plural(ctlsOf(a.id).length, "control")} · plan version ${planOf(a.id).rev}, ${planOf(a.id).state === "approved" ? "approved" : "a draft"}`) : a.kind === "cyber" ? `Phase ${a.phase || ""}${a.plan ? " · " + a.plan : ""}` : a.covers && a.covers.length ? a.covers.join(", ") : "Runs on its cadence");
  const ending = (a) => a.kind !== "check" && a.status === "Active" && a.to && days(a.to, TODAY) >= 0 && days(a.to, TODAY) <= 14;
  const ATT = { publish: (a) => a.kind === "control" && toPublish(a) > 0, failing: (a) => a.kind === "check" && a.status === "Overdue", ending };
  const kindOfRoute = (route) => { const m = /^assessments-(control|cyber|checks)$/.exec(route); return m ? (m[1] === "checks" ? "check" : m[1]) : ""; };

  function listPage(route) {
    const kind = kindOfRoute(route), v = Object.assign({ att: "", q: "" }, view("asm")), all = assessments();
    const rows = all.filter((a) => (!kind || a.kind === kind) && (!v.att || ATT[v.att](a)) && matchQ(v.q, `${a.name} ${a.lead || ""} ${KINDW[a.kind]}`));
    const act = all.filter((a) => a.kind === "control" && a.status === "Active"), pr = act.map((a) => progress(a.id));
    const attRow = (id, label, tone) => ({ label, n: all.filter(ATT[id]).length, tone, act: "k3e.a.att", arg: id });
    return K.page({ cls: "k3e",
      head: K.head({ title: "Assessments", actions: wsx() ? `<button type="button" class="btn ink" data-modal="v2k-plan">${K.i("plus")}Plan an assessment</button>` : K.btn("Plan an assessment", { primary: true, act: "k3e.a.new", icon: "plus" }) }),
      body: K.split(
        K.rail({ title: "Kind", items: KINDS.map(([id, label, r]) => ({ id, label, go: r, on: kind === id, count: all.filter((a) => !id || a.kind === id).length })) }),
        [all.length ? K.cards(K.completion({ title: "Under way", label: "Objectives judged", done: pr.reduce((n, p) => n + p.done, 0), total: pr.reduce((n, p) => n + p.total, 0), unit: "objectives", note: plural(act.length, "active control assessment") }), K.attention({ rows: [attRow("publish", "Results waiting to be published"), attRow("failing", "Monitoring checks overdue", "bad"), attRow("ending", "Windows ending within two weeks")] })) : "",
          v.att ? K.note(`Showing ${esc({ publish: "the assessments with results to publish", failing: "the monitoring checks that are overdue", ending: "the assessments whose window ends within two weeks" }[v.att])}. ${K.actLink("Show all", "k3e.a.att", "")}`) : "",
          K.toolbar({ search: { act: "k3e.a.q", value: v.q, placeholder: "Search assessments" } }),
          K.table({ label: "Assessments", cls: "k3e-list", cols: [{ label: "Assessment" }, { label: "Status" }, { label: "Window or cadence", cls: "nw" }, { label: "Progress", cls: "nw" }, { label: "Findings", cls: "nw" }, { label: "Lead" }],
            rows: rows.map((a) => { const p = a.kind === "control" && a.id !== "init" ? progress(a.id) : null, n = findingsOfAsm(a.id).length + (a.cyf || 0); return { go: a.route, cells: [K.name(a.short || a.name, (kind ? "" : KINDW[a.kind] + " · ") + coversLine(a)), stPill(a.status), windowCell(a), p && p.total ? K.ring(p.done, p.total, "objectives judged") : a.kind === "check" ? mu(plural(a.nruns, "run")) : NONE, n ? K.num(n) : NONE, `<span class="k3e-own">${K.owner(a.lead)}</span>`] }; }),
            empty: all.length ? { title: "No assessment matches", line: "Clear the search or choose All assessments." } : { title: "No assessment yet", line: "Plan the first one: it names the controls an assessor will judge and when.", action: K.btn("Plan an assessment", { sm: true, act: "k3e.a.new" }) }, foot: `<span class="num">${plural(rows.length, "assessment")}</span>` })]) });
  }
  K.on("k3e.a.att", (id) => { setView("asm", { att: id || "" }); if (id && kindOfRoute(cur())) K.go("assessments"); else K.redraw(); });
  K.on("k3e.a.q", (q) => { setView("asm", { q }); K.redraw(); });
  K.on("k3e.a.new", () => K.form({ title: "Plan an assessment", submit: "Plan assessment", intro: "A control assessment with a draft plan. Add its controls on its page; the lead assessor approves the plan before anything is judged.",
    fields: [{ key: "name", label: "Name", required: true }, { key: "from", label: "Window opens", type: "date", required: true, half: true, value: addDays(TODAY, 14) }, { key: "to", label: "Window closes", type: "date", required: true, half: true, value: addDays(TODAY, 44) }, { key: "lead", label: "Lead assessor", type: "select", options: ownerOpts().length ? ownerOpts() : [[ME, ME]], value: (ownerOpts()[0] || [ME])[0], required: true }],
    onSubmit: (o) => { if (o.to < o.from) return { to: "The window closes on or after the day it opens." }; const id = K.id("asm"); set("camps", get("camps", []).concat([{ id, name: o.name, short: o.name, from: o.from, to: o.to, lead: o.lead, controls: [] }])); K.toast(`Assessment planned: ${o.name}`); K.go("assessment--" + id); } }));

  // ——— An assessment's page ———
  const TABS = { control: [["", "Plan"], ["objectives", "Objectives"], ["requests", "Requests"], ["results", "Results"], ["findings", "Findings"]], cyber: [["", "Overview"], ["findings", "Findings"]], check: [["", "Overview"], ["runs", "Runs"], ["findings", "Findings"]] };
  const PLAN_STEPS = [["sca", "Lead assessor", LEAD, "approves the plan"], ["ao", "Authorizing official", AO, "concurs"]];
  const planWords = (id) => { const p = planOf(id); return p.state === "approved" ? `Version ${p.rev} · approved` : p.state === "review" ? `Version ${p.rev} · ${LEAD} approved, waits on ${AO}` : `Version ${p.rev} · a draft, waits on ${LEAD}`; };
  const workable = (id) => planOf(id).state === "approved";
  const requestsOf = (a) => memo("asmreq:" + a.id, () => {
    const ov = get("req", {});
    if (a.id === "exp") return (stat("expreq", () => [...parse(U.old("campaign")).querySelectorAll("tbody tr")].map((tr) => { const c = [...tr.children].map(txt); return { title: c[1].replace(/\s*\d+$/, ""), control: c[2], owner: c[3] === "—" ? "" : c[3].replace(/^[A-Z]{2}(?=[A-Z][a-z])/, ""), status: c[4], due: c[6] }; }).filter((r) => /^[A-Z]{2}-\d/.test(r.control))) || []).map((r) => Object.assign({}, r, { key: "exp:" + r.control, status: ov["exp:" + r.control] || r.status }));
    return ctlsOf(a.id).map((code) => { const s = CH.st(code); return { key: a.id + ":" + code, title: `Evidence for ${code} ${ctlTitle(code)}`, control: code, owner: "", status: ov[a.id + ":" + code] || (s.det && s.published ? "Accepted" : s.ready ? "Ready" : "Not ready"), due: "" }; });
  });
  const counts = (a) => (a.kind === "control" ? { objectives: progress(a.id).total, requests: requestsOf(a).length, results: resultsOf(a).length, findings: findingsOfAsm(a.id).length } : a.kind === "cyber" ? { findings: cyberFinds().filter((f) => a.phase && f.from === a.phase).length } : { runs: a.nruns, findings: findingsOfAsm(a.id).length });
  function nextOf(a) {
    if (a.kind === "check") return a.status === "Overdue" ? { text: `Its ${esc((a.cadence || "").toLowerCase())} run was due ${esc(md(a.due))}.`, action: K.btn("Record a run", { sm: true, primary: true, act: "k3e.a.run", arg: a.id }) } : null;
    if (a.kind === "cyber") return /No plan/.test(a.plan || "") && wsx() ? { text: "It has no test plan yet.", action: `<button type="button" class="btn sm ink" data-modal="v7a-cyber-plan" data-id="${esc(a.id.slice(3))}">Plan the test</button>` } : null;
    if (a.status === "Completed") return null;
    const p = planOf(a.id), d = toPublish(a), pr = progress(a.id);
    if (!ctlsOf(a.id).length) return { text: "Its plan names no control yet.", action: K.btn("Add controls", { sm: true, primary: true, act: "k3e.a.addctl", arg: a.id }) };
    if (p.state === "draft") return { text: `Plan version ${p.rev} waits on ${esc(LEAD)}, the lead assessor. Nothing is judged before it is approved.`, action: K.btn(`Approve as ${LEAD}`, { sm: true, primary: true, act: "k3e.a.approve", arg: a.id }) };
    if (p.state === "review") return { text: `${esc(LEAD)} approved plan version ${p.rev}; it waits on ${esc(AO)}'s concurrence.`, action: K.btn(`Concur as ${AO}`, { sm: true, primary: true, act: "k3e.a.approve", arg: a.id }) };
    if (d) return { text: `${plural(d, "set")} of results in draft: a draft decides nothing.`, action: K.btn("Publish results", { sm: true, primary: true, act: "k3e.a.publish", arg: a.id }) };
    if (pr.done < pr.total) return { text: `${fmt(pr.total - pr.done)} of ${plural(pr.total, "objective")} still to judge.`, action: K.link("Open the objectives", a.route + "--objectives") };
    return null;
  }
  function head(a, tab) {
    const c = counts(a), base = a.route, d = a.kind === "control" ? toPublish(a) : 0;
    const primary = a.kind === "check" && !nextOf(a) ? K.btn("Record a run", { primary: true, act: "k3e.a.run", arg: a.id }) : "";
    const more = a.kind === "control" && a.status !== "Completed" ? K.menu("More", [a.id === "exp" ? null : { label: "Add controls to the plan", act: "k3e.a.addctl", arg: a.id }, d ? { label: "Publish results", act: "k3e.a.publish", arg: a.id } : null, { label: "Export the assessment plan", act: "k3e.a.export", arg: a.id }]) : a.kind === "check" && nextOf(a) ? "" : "";
    return { head: K.head({ crumbs: [["Assessments", "assessments"], [KINDW[a.kind] + "s", KINDS.find((k) => k[0] === a.kind)[2]], [a.short || a.name]], title: a.name, chip: stPill(a.status), actions: more + primary,
      sub: a.kind === "check" ? `${esc(a.cadence)} · ${K.owner(a.lead)}` : `${windowCell(a)}${a.lead ? ` · ${K.owner(a.lead)} leads` : ""}` }),
      tabs: K.tabs(TABS[a.kind].map(([k, label]) => ({ label, route: k ? `${base}--${k}` : base, on: (tab || "") === k, count: k ? c[k] : null })), "Assessment") };
  }
  const ctlBtn = (code) => (U.ctlRoute(code) ? K.link(code, U.ctlRoute(code)) : `<span class="num">${esc(code)}</span>`);
  function tabPlan(a) {
    const p = planOf(a.id), nx = nextOf(a), L = ctlsOf(a.id), pr = progress(a.id);
    const steps = PLAN_STEPS.map(([k, role, who, verb], i) => { const s = (p.steps || []).filter((x) => x.k === k && x.rev === p.rev && x.o !== "return").pop(); const turn = !s && a.status !== "Completed" && ((i === 0 && p.state === "draft") || (i === 1 && p.state === "review")); return { cells: [K.name(`${role} ${verb}`, s ? `Recorded as ${who}${s.rec && s.rec !== who ? " by " + s.rec : ""} · ${md(s.at)}` : a.id === "init" || (p.state === "approved" && !s) ? "Recorded with the plan" : "Not yet"), K.owner(who), s || p.state === "approved" ? h.pill("ok", i ? "Concurred" : "Approved") : turn ? K.btn(i ? "Concur" : "Approve", { sm: true, act: "k3e.a.approve", arg: a.id }) : mu("Waits")] }; });
    return K.aside([nx ? K.next(nx) : "",
      K.section({ title: "Plan approval", body: K.table({ label: "Plan approval", cols: [{ label: "Step" }, { label: "Who" }, { label: "", cls: "tight" }], rows: steps }) }),
      a.id === "init" ? "" : K.related({ title: "Controls in the plan", count: L.length, add: a.status === "Completed" || a.id === "exp" ? null : { label: "Add controls", act: "k3e.a.addctl", arg: a.id }, empty: "The plan names no control yet",
        cols: [{ label: "Control" }, { label: "Objectives judged", cls: "nw" }, { label: "Determination" }], rows: L.map((code) => { const d = ctlDet(code); return { panel: P["k3c-control"] ? "k3c-control" : "a-tests-control", id: code, cells: [K.name(ctlTitle(code), "", code), K.ring(judgedN(code), objectivesOf(code).length, "objectives"), d ? detPill(d.det) + (d.draft ? ` ${mu("draft")}` : "") : mu("Not judged")] }; }) })],
    [K.details("Details", [["Kind", esc(KINDW[a.kind])], ["Window", windowCell(a)], ["Plan", esc(planWords(a.id))], ["Lead assessor", K.owner(a.lead)], a.assessor ? ["Assessor", K.owner(a.assessor)] : null, a.owner ? ["Owner", K.owner(a.owner)] : null, a.ssp ? ["Assesses", esc(a.ssp)] : null, a.id === "init" ? null : ["Objectives", `<span class="num">${fmt(pr.done)} of ${fmt(pr.total)}</span> judged`]])]);
  }
  const oview = (id) => Object.assign({ ctl: "", chip: "all", q: "" }, (view("asmo") || {})[id] || {});
  const setO = (id, patch) => K.set("asmo.view", Object.assign({}, view("asmo"), { [id]: Object.assign({}, oview(id), patch) }));
  const METHODW = { examine: "Examine", interview: "Interview", test: "Test" };
  function tabObjectives(a) {
    const L = ctlsOf(a.id), v = oview(a.id), ok = workable(a.id), nx0 = nextOf(a), nx = nx0 && !/Open the objectives/.test(nx0.action) ? nx0 : null;
    const rowsOf = (code) => objectivesOf(code).map((o) => { const s = objState(code)[o.i] || null, d = ctlDet(code); return { code, o, s, whole: !s && d && d.whole ? d : null }; });
    const all = L.flatMap(rowsOf), CHIP = { all: () => true, open: (r) => !r.s && !r.whole, short: (r) => (r.s && SHORT.has(r.s.det)) || (r.whole && SHORT.has(r.whole.det)), draft: (r) => (r.s && !r.s.pub) || (r.whole && r.whole.draft) };
    const inCtl = all.filter((r) => (!v.ctl || r.code === v.ctl) && matchQ(v.q, `${r.o.label} ${r.o.text} ${r.code} ${ctlTitle(r.code)}`)), shown = inCtl.filter(CHIP[v.chip] || CHIP.all);
    const rows = []; let last = null;
    for (const r of shown) {
      if (r.code !== last) { last = r.code; const d = ctlDet(r.code); rows.push({ group: `<span class="k3e-grp">${ctlBtn(r.code)} ${esc(ctlTitle(r.code))}<span class="k3e-grp-m">${d ? detPill(d.det) + (d.draft ? mu(" draft") : "") : mu("Not assessed until every objective is judged")}</span></span>` }); }
      const s = r.s, arg = { cid: a.id, code: r.code, i: r.o.i };
      rows.push({ cells: [K.name(r.o.label, `Determine if ${r.o.text}.`), esc((s ? s.methods : r.o.methods).map((m) => METHODW[m] || m).join(", ")), s ? `${detPill(s.det)}${s.pub ? "" : ` ${mu("draft")}`}${SHORT.has(s.det) && U.recGo("k3e-finding", "x") ? ` ${K.link("Its finding", U.recGo("k3e-finding", `af:${(s.pub && s.pub.cid) || a.id}:${r.code}:${r.o.i}`))}` : ""}` : r.whole ? `${detPill(r.whole.det)} ${mu("with the control")}` : mu("Not judged"), s ? `<span class="k3e-own">${K.owner(s.by)}</span>` : NONE,
        s && s.pub ? "" : K.btn(s ? "Change" : "Judge", { sm: true, quiet: !!s, act: "k3e.a.judge", arg, disabled: a.status === "Completed" ? "This assessment is completed" : ok ? "" : "The plan is approved first" })] });
    }
    const chip = (id, label) => ({ id, label, count: inCtl.filter(CHIP[id]).length, on: v.chip === id });
    return [nx ? K.next(nx) : "", K.split(
      K.rail({ title: "Controls in the plan", act: "k3e.a.octl", items: [{ id: { a: a.id, c: "" }, label: "All controls", count: all.length, on: !v.ctl }].concat(L.map((code) => ({ id: { a: a.id, c: code }, code, label: ctlTitle(code), count: objectivesOf(code).length, on: v.ctl === code }))) }),
      [K.chips([chip("all", "All"), chip("open", "Not judged"), chip("short", "Short of satisfied"), chip("draft", "Draft")], "k3e.a.ochip"),
        K.toolbar({ search: { act: "k3e.a.oq", value: v.q, placeholder: "Search objectives" } }),
        K.table({ label: "Objectives", cls: "k3e-obj", cols: [{ label: "Objective" }, { label: "Methods", cls: "nw" }, { label: "Determination" }, { label: "Recorded as" }, { label: "", cls: "tight" }], rows,
          empty: L.length ? { title: "No objective matches", line: "Choose All, or another control." } : { title: "No objective yet", line: "Add the controls the plan assesses: each brings its objectives.", action: a.id === "exp" ? "" : K.btn("Add controls", { sm: true, act: "k3e.a.addctl", arg: a.id }) }, foot: `<span class="num">${plural(shown.length, "objective")}</span>` })])];
  }
  const REQP = { Accepted: "ok", Ready: "info", Flagged: "warn", "Not ready": "none" };
  function tabRequests(a) {
    const L = requestsOf(a), ok = workable(a.id);
    return [K.table({ label: "Requests", cols: [{ label: "Request" }, { label: "Control", cls: "nw" }, { label: "Owner" }, { label: "Status" }, { label: "", cls: "tight" }],
      rows: L.map((r) => ({ cells: [K.name(r.title, r.due ? `Due ${r.due}` : ""), ctlBtn(r.control), `<span class="k3e-own">${K.owner(r.owner)}</span>`, h.pill(REQP[r.status] || "none", r.status), a.status === "Completed" || r.status === "Accepted" ? "" : K.menu("Set", [{ label: "Ready", act: "k3e.a.req", arg: { a: a.id, key: r.key, code: r.control, to: "Ready" } }, { label: "Flagged: evidence falls short", act: "k3e.a.req", arg: { a: a.id, key: r.key, code: r.control, to: "Flagged" } }, { label: "Accepted", act: "k3e.a.req", arg: { a: a.id, key: r.key, code: r.control, to: "Accepted" } }], { sm: true })] })),
      empty: { title: "No request yet", line: ok ? "A request asks a control's owner for the evidence its objectives need." : "Requests run once the plan is approved." }, foot: `<span class="num">${plural(L.length, "request")}</span>` })];
  }
  function tabResults(a) {
    const L = resultsOf(a);
    return [toPublish(a) ? K.next({ text: "A draft decides nothing: the controls keep their status until the lead assessor publishes.", action: K.btn("Publish results", { sm: true, primary: true, act: "k3e.a.publish", arg: a.id }) }) : "",
      K.table({ label: "Results", cols: [{ label: "Results" }, { label: "State" }, { label: "Published", cls: "nw" }, { label: "By" }, { label: "Controls", cls: "nw" }],
        rows: L.map((r) => ({ cells: [K.name(r.title, r.rec && r.rec !== r.by ? `Recorded as ${r.by} by ${r.rec}` : ""), r.state === "draft" ? h.pill("warn", "Draft") : h.pill("ok", "Published"), r.at ? `<span class="num">${esc(mdy(r.at))}</span>` : NONE, r.by ? `<span class="k3e-own">${K.owner(r.by)}</span>` : NONE, r.n ? K.num(r.n) : NONE] })),
        empty: { title: "No results yet", line: "Results join here once an objective is judged." } })];
  }
  function tabFindings(a) {
    if (a.kind === "cyber") { const L = cyberFinds().filter((f) => a.phase && f.from === a.phase); return [K.table({ label: "Findings", cols: [{ label: "Finding" }, { label: "Severity" }, { label: "Then" }, { label: "Remediate within", cls: "nw" }], rows: L.map((f) => ({ panel: "v7a-cyf", id: f.id, cells: [K.name(f.title), U.sevPill(f.sev.toLowerCase()), esc(f.then), esc(f.within)] })), empty: { title: "No finding yet", line: "What the test finds arrives here and in Findings." } })]; }
    const L = findingsOfAsm(a.id).slice().sort(sortF);
    return [K.table({ label: "Findings", cls: "k3e-list", cols: FCOLS, rows: L.map((f) => findingRow(f, false, f.kind)), empty: { title: "No finding", line: a.kind === "check" ? "A failing run's results arrive here and in Findings." : "A determination short of satisfied opens a finding at once." }, foot: `<span class="num">${plural(L.length, "finding")}</span>` })];
  }
  function tabCheck(a) {
    const nx = nextOf(a);
    return K.aside([nx ? K.next(nx) : "", K.related({ title: "What it covers", count: a.covers.length, cols: [{ label: "Control" }], rows: a.covers.map((code) => ({ panel: P["k3c-control"] ? "k3c-control" : "a-tests-control", id: code, cells: [K.name(ctlTitle(code), "", code)] })), empty: "It names no control" })],
      [K.details("Details", [["Kind", "Monitoring check"], ["Cadence", esc(a.cadence)], ["Owner", K.owner(a.lead)], ["Last run", a.lastRun ? esc(a.lastRun) : mu("None recorded")], ["Next run", a.due ? `<span class="num${a.status === "Overdue" ? " k3e-late" : ""}">${esc(mdy(a.due))}</span>` : NONE], ["Failing now", a.failing ? K.link(plural(a.failing, "result"), a.route + "--findings") : mu("Nothing")]])]);
  }
  function tabRuns(a) {
    const mine = runsOf(a.check).slice().reverse(), seedN = a.nruns - mine.length;
    const rows = mine.map((r) => ({ cells: [`<span class="num">${esc(mdy(r.at))}</span>`, h.pill(r.result === "Failed" ? "bad" : "ok", r.result), `<span class="k3e-own">${K.owner(r.by)}</span>`, esc(r.note || "")] }));
    if (a.lastRun && seedN > 0) rows.push({ cells: [`<span class="num">${esc(runsOf(a.check).length ? (checkRuns()[a.check] || {}).last || "" : a.lastRun)}</span>`, h.pill(a.failing ? "bad" : "ok", a.failing ? "Failed" : "Passed"), `<span class="k3e-own">${K.owner(a.lead)}</span>`, a.failing ? esc(`${plural(a.failing, "result")} failing`) : ""] });
    return [K.table({ label: "Runs", cols: [{ label: "Run", cls: "nw" }, { label: "Result" }, { label: "By" }, { label: "Note" }], rows, empty: { title: "No run recorded", line: "Record each run: a failing one opens findings.", action: K.btn("Record a run", { sm: true, act: "k3e.a.run", arg: a.id }) }, foot: `<span class="num">${plural(a.nruns, "run")}${seedN > rows.length - mine.length ? " · the latest shown" : ""}</span>` })];
  }
  function cyberOverview(a) {
    const nx = nextOf(a);
    return K.aside([nx ? K.next(nx) : "", K.section({ title: "What it tests", body: `<p class="k3e-p">${esc(a.name)}: phase ${esc(a.phase || "")} of the cyber test and evaluation sequence. Its findings arrive in Findings with their plans.</p>` })],
      [K.details("Details", [["Kind", "Cyber test"], ["Phase", esc(a.phase || "")], ["Window", windowCell(a)], ["Lead", a.lead ? K.owner(a.lead) : mu("Not named")], ["Test plan", a.plan ? esc(a.plan) : mu("None")]])]);
  }
  function recordPage(route, m) {
    const a = byId(m[1]), tab = m[2] || "";
    if (!a) return K.page({ cls: "k3e", head: K.head({ crumbs: [["Assessments", "assessments"], ["Not found"]], title: "This assessment is not here" }), body: K.empty({ title: "No assessment has that address", line: "It may belong to another program.", action: K.link("Open Assessments", "assessments") }) });
    const hd = head(a, tab);
    const body = a.kind === "control" ? (tab === "objectives" ? tabObjectives(a) : tab === "requests" ? tabRequests(a) : tab === "results" ? tabResults(a) : tab === "findings" ? tabFindings(a) : tabPlan(a)) : a.kind === "cyber" ? (tab === "findings" ? tabFindings(a) : cyberOverview(a)) : tab === "runs" ? tabRuns(a) : tab === "findings" ? tabFindings(a) : tabCheck(a);
    return K.page({ cls: "k3e", head: hd.head, tabs: hd.tabs, body });
  }
  K.lazy(/^assessment--([\w-]+?)(?:--(objectives|requests|results|findings|runs))?$/, recordPage, "assessments");
  V3.S("assessments", (orig, route) => listPage("assessments"));
  for (const r of ["assessments-control", "assessments-cyber", "assessments-checks"]) K.screen(r, () => listPage(r), "assessments");

  // ——— What an assessor does on the page ———
  K.on("k3e.a.octl", (x) => { setO(x.a, { ctl: x.c }); K.redraw(); });
  K.on("k3e.a.oq", (q) => { const m = /^assessment--([\w-]+?)--objectives$/.exec(cur()); if (m) { setO(m[1], { q }); K.redraw(); } });
  K.on("k3e.a.ochip", (id) => { const m = /^assessment--([\w-]+?)--objectives$/.exec(cur()); if (m) { setO(m[1], { chip: id }); K.redraw(); } });
  K.on("k3e.a.approve", (id) => { const a = byId(id); if (!a) return; if (a.made) { set("camps", get("camps", []).map((c) => (c.id === id ? Object.assign({}, c, { approved: TODAY }) : c))); K.redraw(); return; } const p = planOf(id), k = p.state === "review" ? 1 : 0, [key, role, who] = PLAN_STEPS[k];
    K.confirm({ title: k ? "Record the AO's concurrence" : "Approve the plan", text: `Plan version ${p.rev} of ${esc(a.short || a.name)}: ${plural(ctlsOf(id).length, "control")}, ${plural(progress(id).total, "objective")}. The step is ${esc(who)}'s, the ${esc(role.toLowerCase())}; the prototype records it as ${esc(who)}, by ${esc(ME)}.`, submit: k ? `Concur as ${who}` : `Approve as ${who}`,
      onOk: () => { const steps = (p.steps || []).concat([{ k: key, role, who, o: "approve", note: "", at: TODAY, rec: ME, rev: p.rev }]); V.set("v3.R.plan." + id, k ? Object.assign({}, p, { state: "approved", steps, adds: [], hist: (p.hist || []).concat([{ rev: p.rev, adds: p.adds || [], at: TODAY }]) }) : Object.assign({}, p, { state: "review", steps })); K.redraw(); K.toast(k ? `Plan version ${p.rev} approved: its objectives can be judged` : `${LEAD} approved plan version ${p.rev}; it waits on ${AO}'s concurrence`); } }); });
  K.on("k3e.a.addctl", (id) => { const a = byId(id); if (!a) return; if (id === "exp") { K.toast("The expanded set's plan is published: a control joins its next version from the control's panel"); return; }
    const mine = new Set(ctlsOf(id));
    K.pick({ title: "Add controls to the plan", multi: true, search: "Search the baseline's controls", submit: (n) => (n ? `Add ${plural(n, "control")}` : "Add controls"), items: SSP.controls.map((c) => { const code = c.c || c.code, other = !mine.has(code) && r3() ? r3().campaignOf(code) : null; return { id: code, code, title: c.t || c.title || "", group: (SSP.families && (SSP.families.find((f) => (f.code || f[0]) === (c.f || c.family)) || {}).name) || c.f || c.family || "", held: mine.has(code) ? "In the plan" : other ? `In ${other.short}` : "" }; }),
      onPick: (codes) => { if (a.made) set("camps", get("camps", []).map((c) => (c.id === id ? Object.assign({}, c, { controls: uniq((c.controls || []).concat(codes)) }) : c))); else for (const code of codes) CH.put(code, { camp: id, campAt: TODAY }); K.redraw(); K.toast(`${plural(codes.length, "control")} added to the plan with ${codes.length === 1 ? "its" : "their"} objectives`); } }); });
  K.on("k3e.a.judge", (x) => {
    const a = byId(x.cid), o = objectivesOf(x.code).find((y) => y.i === x.i); if (!a || !o) return;
    const s = objState(x.code)[x.i] || {}, comps = U.compsOfCtl(x.code);
    K.form({ title: `Judge ${o.label}`, submit: "Record determination", intro: `Determine if ${esc(o.text)}. A result short of satisfied opens a finding at once; it decides nothing until the lead assessor publishes.`,
      fields: [{ key: "det", label: "Determination", type: "select", required: true, value: s.det || "", options: [["satisfied", "Satisfied"], ["partially_satisfied", "Partially satisfied"], ["other_than_satisfied", "Other than satisfied"]] },
        { key: "methods", label: "Methods", type: "checks", required: true, value: s.methods || o.methods, options: Object.keys(METHODW).map((k) => [k, METHODW[k]]) },
        { key: "note", label: "Justification", type: "textarea", rows: 4, value: s.note || "", hint: "Required short of satisfied: what was examined, asked or tested, and what fell short" },
        comps.length ? { key: "comp", label: "Where it was found", type: "select", half: true, value: s.comp || "", options: comps.map((c) => [c, U.compName(c)]), placeholder: "The system as a whole" } : null,
        { key: "by", label: "Recorded as", type: "select", required: true, half: true, value: s.by || a.assessor || ASSESSOR, options: uniq([a.assessor || ASSESSOR, a.lead || LEAD]).map((n) => [n, n]) }].filter(Boolean),
      onSubmit: (v) => {
        if (v.det !== "satisfied" && !v.note) return { note: "Say what fell short: the finding opens with these words." };
        const st = Object.assign({}, objState(x.code)); st[x.i] = { det: v.det, methods: v.methods, note: v.note, by: v.by, rec: ME, at: TODAY, comp: v.comp || null };
        V.set("v3.R.obj." + x.code, st);
        const d = r3() ? r3().derived(x.code) : null, c = CH.st(x.code), n = objectivesOf(x.code).length;
        if (x.cid !== "exp") { if (d && !c.published) CH.put(x.code, { det: d, detNote: `The worst of its ${n} objectives`, detBy: v.by, detAt: TODAY }); else if (!d && c.det && !c.published) CH.put(x.code, { det: null }); }
        K.redraw();
        const j = objectivesOf(x.code).filter((y) => (objState(x.code)[y.i] || {}).det).length;
        if (SHORT.has(v.det)) { K.toast(`${o.label} judged ${DETW[v.det].toLowerCase()}: a finding is open in the draft results`, U.recGo("k3e-finding", "x") ? { label: "Open finding", route: U.recGo("k3e-finding", `af:${x.cid}:${x.code}:${x.i}`) } : null); }
        else K.toast(`${o.label} judged satisfied · ${j} of ${n} of ${x.code} judged${j === n ? `, ${DETW[d].toLowerCase()} once published` : ""}`);
      } });
  });
  K.on("k3e.a.req", (x) => { mapSet("req", x.key, x.to); if (x.a !== "exp" && x.to !== "Flagged") CH.put(x.code, { ready: true }); K.redraw(); K.toast(`${x.code}'s request is ${x.to.toLowerCase()}`); });
  K.on("k3e.a.publish", (id) => {
    const a = byId(id); if (!a) return; const codes = draftsIn(id), set2 = id === "exp" && !(CH.inc2 && CH.inc2());
    if (!codes.length && !set2) { K.toast("The draft results hold no determination yet"); return; }
    const objs = codes.reduce((n, c) => n + r3().draftsOf(c).length, 0);
    K.form({ title: "Publish results", submit: `Publish as ${LEAD}`, intro: `${set2 ? "Expanded set 2's 20 determinations" : ""}${set2 && objs ? " and " : ""}${objs ? `${plural(objs, "objective")} over ${plural(codes.length, "control")}` : ""}. Only the lead assessor publishes: the prototype records it as ${esc(LEAD)}, by ${esc(ME)}. From then on the controls' statuses and the findings read these results.`,
      fields: [{ key: "title", label: "Results", required: true, value: set2 ? "SAR · expanded set 2" : `${a.short || a.name} results, ${md(TODAY)}` }],
      onSubmit: (v) => {
        let decided = 0;
        for (const code of codes) { const st = Object.assign({}, objState(code)); for (const ob of r3().draftsOf(code)) st[ob.i] = Object.assign({}, st[ob.i], { pub: { at: TODAY, cid: id, by: LEAD } }); V.set("v3.R.obj." + code, st); const d = r3().derived(code); if (d) { decided++; if (id !== "exp") CH.put(code, { det: d, detNote: `The worst of its ${objectivesOf(code).length} objectives`, detBy: LEAD, detAt: TODAY, published: true, pubAt: TODAY }); } }
        if (codes.length) { if (id !== "exp") V.set("chain.results." + id, { title: v.title, at: TODAY, by: LEAD, n: codes.length }); V.set("v3.R.res." + id, (V.get("v3.R.res." + id, null) || []).concat([{ title: v.title, at: TODAY, by: LEAD, rec: ME, n: codes.length, objs }])); }
        if (set2) V.set("chain.inc2", { title: v.title, at: TODAY, by: LEAD });
        K.redraw(); K.toast(`${v.title} published by ${LEAD}: ${set2 ? "20 determinations" : plural(objs, "objective")}${decided ? `, ${plural(decided, "control")} decided` : ""}. Controls and Findings read them now.`);
      } });
  });
  K.on("k3e.a.run", (id) => { const a = byId(id); if (!a) return; K.form({ title: "Record a run", submit: "Record run", intro: esc(a.name), fields: [{ key: "at", label: "Run on", type: "date", required: true, half: true, value: TODAY }, { key: "result", label: "Result", type: "select", required: true, half: true, options: ["Passed", "Failed"] }, { key: "note", label: "Note", type: "textarea", rows: 3, hint: "What ran, and what failed if anything did" }],
    onSubmit: (o) => { if (o.at > TODAY) return { at: "A run is recorded on or after the day it ran." }; if (o.result === "Failed" && !o.note) return { note: "Say what failed: its findings are opened from it." }; mapSet("runs", a.check, runsOf(a.check).concat([{ at: o.at, result: o.result, note: o.note, by: ME }])); K.redraw(); K.toast(`Run recorded: ${o.result.toLowerCase()}${o.result === "Passed" ? "; the next is due on its cadence" : ""}`); } }); });
  K.on("k3e.a.export", (id) => { const a = byId(id); if (a) K.toast(`${a.short || a.name}: plan version ${planOf(id).rev} exported with its ${plural(progress(id).total, "objective")}`); });
  E.asm = { assessments, byId, ctlsOf, progress, resultsOf, toPublish, findingsOfAsm, listPage, objState };
  V3.facts.assessments = () => assessments().map((a) => ({ id: a.id, name: a.name, kind: a.kind, status: a.status, route: a.route }));
  // lead: for a control's own page, so it agrees with the assessment that holds it: campaignOf(control) → the open control
  // assessment whose plan holds the control, or null; judgedN(control) → { n, draft }: how many of its objectives are judged
  // there, draft results included, and whether any of them is still a draft.
  V3.facts.campaignOf = (code) => { try { const a = assessments().find((x) => x.kind === "control" && x.id !== "init" && !/complete|closed|published/i.test(String(x.status || "")) && ctlsOf(x.id).indexOf(code) >= 0) || assessments().find((x) => x.kind === "control" && x.id !== "init" && ctlsOf(x.id).indexOf(code) >= 0); return a ? { id: a.id, short: a.short || a.name, route: a.route + "--objectives" } : null; } catch (e) { return null; } };
  V3.facts.judgedN = (code) => { try { const d = ctlDet(code); return { n: judgedN(code), draft: !!(d && d.draft) }; } catch (e) { return null; } };
})();

// ════════════════ Risks: the register and the techniques it names; a risk is worked in its panel ════════════════
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k, V = PA && PA.v2, E = PA && PA.v3e;
  if (!V3 || !K || !V || !E) return;
  const P = PA.P, S = PA.S, CH = V.chain, h = PA.h, esc = K.esc, fmt = K.fmt, U = E.u;
  const { md, mdy, days, addDays, plural, mu, NONE, parse, txt, uniq, cur, memo, stat, ownerOpts, sevPill, SEVW, SEVN, ctlTitle, inBaseline, view, setView, matchQ, RESP, LEVELS, SEVOF, TODAY, ME, AO } = U;
  const wsx = () => V3.wsx(), get = E.get, set = E.set, mapSet = E.mapSet;
  const LVW = { low: "Low", moderate: "Moderate", high: "High" };
  // A risk as it stands: the register's record with what was changed here (assessment, response, owner, techniques).
  const shape = (r) => { const o = get("rassess", {})[r.id] || {}, lik = o.lik || r.lik, imp = o.imp || r.imp; const adds = wsx() && r.chain ? V.get("v3.R.tech." + r.id, null) || [] : []; return { id: r.id, title: r.title, lik, imp, sev: o.lik || o.imp ? SEVOF(lik, imp) : r.sev, threat: o.threat != null ? o.threat : r.threat || "", owner: r.owner || "", due: r.due || "", tech: (r.tech || []).concat(adds.filter((t) => !(r.tech || []).some((y) => y[0] === t[0]))), chain: !!r.chain, issue: r.issue || null, created: r.created || "", resp: (wsx() ? V.get("v3.R.resp." + r.id, null) : r.resp) || "mitigate", acc: wsx() && CH.acc ? CH.acc(r.id) : null }; };
  const risks = () => memo("risks", () => E.riskList().map(shape));
  const riskById = (id) => risks().find((r) => r.id === id) || null;
  const respWord = (r) => { const x = r.resp ? r : shape(r); return x.acc && x.acc.state === "accepted" ? "Accepted" : x.resp === "accept" ? (x.acc ? (x.acc.state === "returned" ? "Acceptance sent back" : "Acceptance requested") : "Accept") : RESP[x.resp] || ""; };
  E.hooks({ respWord });
  const findingsOfRisk = (id) => memo("rf:" + id, () => E.findings().filter((f) => { const r = E.riskOfFinding(f); return r && r.id === id && E.isOpen(f); }));
  const late = (r) => !!r.due && r.due < TODAY && !(r.acc && r.acc.state === "accepted");
  const CHIPR = { open: () => true, noowner: (r) => !r.owner, late, accept: (r) => !!r.acc && r.acc.state === "requested" };
  // ATT&CK techniques: v2's Threats page holds them (a closure of its module); the risks that name each are counted here.
  const techs = () => stat("techs", () => [...parse(S["threats"] ? U.old("threats") : "").querySelectorAll('tbody tr[data-panel="v7a-att"]')].map((tr) => { const c = [...tr.children]; return { code: tr.getAttribute("data-id"), name: txt(c[0].querySelector(".v7a-b")) || txt(c[0]).replace(tr.getAttribute("data-id"), ""), matrix: txt(c[1]), tactics: txt(c[2]), counter: txt(c[4]) }; })) || [];
  const techName = (code) => { const t = techs().find((x) => x.code === code); if (t) return t.name; for (const r of risks()) { const y = r.tech.find((x) => x[0] === code); if (y) return y[1]; } return ""; };
  const risksOfTech = (code) => risks().filter((r) => r.tech.some((t) => t[0] === code));
  const counterOf = (code) => stat("cc:" + code, () => { const o = P["v7a-att"] ? U.off(() => P["v7a-att"](code)) : null; return o ? uniq([...parse(o.body).querySelectorAll('[data-panel="v7a-cctl"]')].map((x) => x.getAttribute("data-id"))) : []; }) || [];
  const allTechs = () => { const L = techs().slice(), have = new Set(L.map((t) => t.code)); for (const r of risks()) for (const [c, n] of r.tech) if (!have.has(c)) { have.add(c); L.push({ code: c, name: n, matrix: /^T0/.test(c) ? "ICS" : "Enterprise", tactics: "", counter: "" }); } return L; };

  const tabs = (on) => K.tabs([{ label: "Register", count: risks().length, route: "risks", on: on === "risks" }, { label: "Threats", count: allTechs().filter((t) => risksOfTech(t.code).length).length, route: "risks-threats", on: on === "threats" }], "Risks");
  const headOf = () => K.head({ title: "Risks", actions: K.btn("Create risk", { primary: true, act: "k3e.r.new", icon: "plus" }) });
  function registerPage() {
    const v = Object.assign({ chip: "open", q: "", sev: "", tech: "" }, view("rsk")), all = risks();
    const narrowed = all.filter((r) => (!v.sev || r.sev === v.sev) && (!v.tech || r.tech.some((t) => t[0] === v.tech)) && matchQ(v.q, `${r.title} ${r.threat} ${r.owner} ${r.tech.map((t) => t.join(" ")).join(" ")}`));
    const rows = narrowed.filter(CHIPR[v.chip] || CHIPR.open).sort((a, b) => (SEVN[b.sev] || 0) - (SEVN[a.sev] || 0) || String(a.due || "9").localeCompare(String(b.due || "9")));
    const chip = (id, label) => ({ id, label, count: narrowed.filter(CHIPR[id]).length, on: v.chip === id });
    return K.page({ cls: "k3e", head: headOf(), tabs: tabs("risks"), body: [
      K.chips([chip("open", "Open"), chip("noowner", "No owner"), chip("late", "Response past due"), chip("accept", "Acceptance requested")], "k3e.r.chip"),
      K.toolbar({ search: { act: "k3e.r.q", value: v.q, placeholder: "Search risks" }, filters: [{ label: "Severity", act: "k3e.r.sev", value: v.sev, options: Object.keys(SEVW).map((k) => [k, SEVW[k]]) }] }),
      v.tech ? K.note(`Showing the risks that name ${esc(v.tech)} ${esc(techName(v.tech))}. ${K.actLink("Show all", "k3e.r.tech", "")}`) : "",
      K.table({ label: "Risks", cls: "k3e-list", cols: [{ label: "Risk" }, { label: "Severity" }, { label: "Response" }, { label: "Findings", cls: "nw" }, { label: "Techniques" }, { label: "Response due", cls: "nw" }, { label: "Owner" }],
        rows: rows.map((r) => { const n = findingsOfRisk(r.id).length; return { panel: "k3e-risk", id: r.id, cells: [K.name(r.title, r.threat), sevPill(r.sev), esc(respWord(r)), n ? K.num(n) : NONE, r.tech.length ? `<span class="num k3e-mu">${esc(r.tech.slice(0, 2).map((t) => t[0]).join(", "))}${r.tech.length > 2 ? ` +${r.tech.length - 2}` : ""}</span>` : NONE, r.due ? `<span class="num${late(r) ? " k3e-late" : ""}">${esc(md(r.due))}</span>` : NONE, `<span class="k3e-own">${K.owner(r.owner)}</span>`] }; }),
        empty: all.length ? { title: "No risk matches", line: "Clear the search, or choose Open." } : { title: "No risk yet", line: "A risk says what a finding could lead to, how likely and how bad, and what is done about it.", action: K.btn("Create risk", { sm: true, act: "k3e.r.new" }) }, foot: `<span class="num">${plural(rows.length, "risk")}</span>` })] });
  }
  function threatsPage() {
    const q = (view("rsk").tq || ""), L = allTechs().map((t) => { const rs = risksOfTech(t.code); return Object.assign({ rs, worst: rs.map((r) => r.sev).sort((a, b) => (SEVN[b] || 0) - (SEVN[a] || 0))[0] || "" }, t); }).filter((t) => matchQ(q, `${t.code} ${t.name} ${t.tactics}`)).sort((a, b) => (SEVN[b.worst] || 0) - (SEVN[a.worst] || 0) || b.rs.length - a.rs.length || a.code.localeCompare(b.code));
    return K.page({ cls: "k3e", head: headOf(), tabs: tabs("threats"), body: [
      K.toolbar({ search: { act: "k3e.r.tq", value: q, placeholder: "Search techniques" } }),
      K.table({ label: "ATT&CK techniques", cols: [{ label: "ATT&CK technique" }, { label: "Matrix", cls: "nw" }, { label: "Risks", cls: "nw" }, { label: "Worst" }, { label: "Countering controls in the baseline", cls: "nw" }],
        rows: L.map((t) => ({ panel: "k3e-tech", id: t.code, cells: [K.name(t.name, t.tactics, t.code), esc(t.matrix), t.rs.length ? K.num(t.rs.length) : NONE, t.worst ? sevPill(t.worst) : NONE, t.counter ? `<span class="num">${esc(t.counter)}</span>` : NONE] })),
        empty: { title: wsx() ? "No technique matches" : "No technique named yet", line: wsx() ? "Clear the search." : "Link an ATT&CK technique on a risk's panel: it then lists here with its risks." }, foot: `<span class="num">${plural(L.length, "technique")}</span>` })] });
  }
  V3.S(/^risks(-snapshots|-library)?$/, () => registerPage());
  K.screen("risks-threats", threatsPage, "risks");
  const rset = (patch) => { setView("rsk", patch); K.redraw(); };
  K.on("k3e.r.chip", (id) => rset({ chip: id }));
  K.on("k3e.r.q", (q) => rset({ q }));
  K.on("k3e.r.tq", (tq) => rset({ tq }));
  K.on("k3e.r.sev", (sev) => rset({ sev }));
  K.on("k3e.r.tech", (tech) => { setView("rsk", { tech: tech || "", chip: "open" }); K.go("risks"); });
  K.on("k3e.r.new", () => U.riskForm(null));

  // ——— Changing a risk ———
  const patchRisk = (id, changes) => { if (!wsx()) return set("risks", get("risks", []).map((r) => (r.id === id ? Object.assign({}, r, changes) : r))); const L = CH.list ? CH.list("risks") : CH.risks(); if (L.some((r) => r.id === id)) V.set("chain.risks", L.map((r) => (r.id === id ? Object.assign({}, r, changes) : r))); else return false; return true; };
  const setResp = (r, resp) => { if (wsx()) V.set("v3.R.resp." + r.id, resp); else patchRisk(r.id, { resp }); };
  const addTech = (r, code, name) => { if (!wsx()) return patchRisk(r.id, { tech: r.tech.concat([[code, name]]) }); V.set("v3.R.tech." + r.id, (V.get("v3.R.tech." + r.id, null) || []).concat([[code, name]])); };
  const rmTech = (r, code) => { if (!wsx()) return patchRisk(r.id, { tech: r.tech.filter((t) => t[0] !== code) }); V.set("v3.R.tech." + r.id, (V.get("v3.R.tech." + r.id, null) || []).filter((t) => t[0] !== code)); };
  const addedTech = (r, code) => (wsx() ? (V.get("v3.R.tech." + r.id, null) || []).some((t) => t[0] === code) : true);
  K.on("k3e.r.owner", (id) => { const r = riskById(id); if (!r) return; K.form({ title: "Assign owner", submit: "Assign owner", intro: esc(r.title), fields: [{ key: "owner", label: "Owner", type: "select", options: ownerOpts(), value: r.owner, required: true }], onSubmit: (o) => { if (patchRisk(id, { owner: o.owner }) === false) V.set("v3.R.own.risk." + id, o.owner); K.redraw(); K.toast(`${o.owner} owns the risk`); } }); });
  K.on("k3e.r.assess", (id) => { const r = riskById(id); if (!r) return; K.form({ title: "Edit assessment", submit: "Save assessment", intro: `${esc(r.title)}. Likelihood and impact give the severity.`, fields: [{ key: "lik", label: "Likelihood", type: "select", options: LEVELS, value: r.lik, required: true, half: true }, { key: "imp", label: "Impact", type: "select", options: LEVELS, value: r.imp, required: true, half: true }, { key: "threat", label: "Threat", type: "textarea", rows: 4, value: r.threat, hint: "Who or what, and how" }],
    onSubmit: (o) => { if (patchRisk(id, { lik: o.lik, imp: o.imp, sev: SEVOF(o.lik, o.imp), threat: o.threat }) === false) mapSet("rassess", id, { lik: o.lik, imp: o.imp, threat: o.threat }); K.redraw(); K.toast(`Assessment saved: ${SEVW[SEVOF(o.lik, o.imp)]}`); } }); });
  K.on("k3e.r.resp", (id) => { const r = riskById(id); if (!r) return; K.form({ title: "Change response", submit: "Save response", intro: esc(r.title), fields: [{ key: "resp", label: "Response", type: "select", required: true, value: r.resp, options: [["mitigate", "Mitigate: a plan answers it"], ["accept", `Accept: the ISSO, the ISSM and ${AO} accept it in turn`], ["transfer", "Transfer: another organization carries it"]] }, { key: "due", label: "Response due", type: "date", value: r.due || addDays(TODAY, 30) }],
    onSubmit: (o) => { setResp(r, o.resp); if (o.due && o.due !== r.due && patchRisk(id, { due: o.due }) === false) mapSet("rdue", id, o.due); K.redraw(); K.toast(`Response: ${RESP[o.resp]}${o.resp === "accept" ? ". Request the acceptance next." : ""}`); } }); });
  K.on("k3e.r.accreq", (id) => { const r = riskById(id); if (!r) return; K.form({ title: "Request acceptance", submit: "Request acceptance", intro: `${esc(r.title)}: the ISSO, then the ISSM, then ${esc(AO)} accept it, each recorded on its own.`, fields: [{ key: "reason", label: "Why it is accepted", type: "textarea", rows: 3, required: true }, { key: "until", label: "Accepted until", type: "date", required: true, value: addDays(TODAY, 180) }],
    onSubmit: (o) => { if (o.until <= TODAY) return { until: "Choose a later day." }; setResp(r, "accept"); if (wsx() && CH.ACTIONS && CH.ACTIONS.accept) CH.ACTIONS.accept(id, o); else patchRisk(id, { accReq: o }); K.redraw(); K.toast("Acceptance requested: step 1 waits on the ISSO"); } }); });
  K.on("k3e.r.accstep", (id) => { const r = riskById(id), a = r && r.acc; if (!a) return; const [n, role, who] = (CH.STEPS || [])[a.step - 1] || [a.step, "", ""];
    K.form({ title: `Record step ${n}`, submit: `Record as ${who}`, intro: `${esc(role)}: ${esc(who)}. The prototype records the step as ${esc(who)}, by ${esc(ME)}. Why it is accepted: ${esc(a.reason || "")}`, fields: [{ key: "dec", label: "Decision", type: "select", required: true, options: [["approve", n === 3 ? "Accept the risk" : "Approve and pass it on"], ["return", "Send it back"]] }, { key: "note", label: "Comment", type: "textarea", rows: 3, hint: "Required when sending back" }],
      onSubmit: (o) => { if (o.dec === "return" && !o.note) return { note: "Say why it goes back." }; const out = CH.ACTIONS.decide(id, o); if (typeof out === "string") return { dec: out }; K.redraw(); K.toast(Array.isArray(out) ? out[0] : "Step recorded"); } }); });
  K.on("k3e.r.techadd", (id) => { const r = riskById(id); if (!r) return; K.pick({ title: "Link ATT&CK technique", multi: true, search: "Search techniques", submit: (n) => (n ? `Link ${plural(n, "technique")}` : "Link technique"), intro: "A risk names the techniques it concerns; their countering controls then show what the baseline holds against it.", empty: "No technique is recorded for this program: the reference data lists them once loaded.",
    items: allTechs().map((t) => ({ id: t.code, code: t.code, title: t.name, desc: t.tactics, meta: t.matrix, held: r.tech.some((x) => x[0] === t.code) ? "Linked" : "" })), onPick: (codes) => { let x = riskById(id); for (const c of codes) { addTech(x, c, techName(c)); x = Object.assign({}, x, { tech: x.tech.concat([[c, techName(c)]]) }); } K.redraw(); K.toast(`${plural(codes.length, "technique")} linked to the risk`); } }); });
  K.on("k3e.r.techrm", (a, el, ev) => { if (ev) ev.stopPropagation(); const r = riskById(a.id); if (!r) return; K.confirm({ title: "Unlink technique", text: `${esc(a.code)} ${esc(techName(a.code))} leaves this risk; the technique's countering controls no longer count against it.`, submit: "Unlink technique", danger: true, onOk: () => { rmTech(r, a.code); K.redraw(); K.toast(`${a.code} unlinked`); } }); });
  K.on("k3e.r.fadd", (id) => { const r = riskById(id); if (!r) return; K.pick({ title: "Link findings", multi: true, search: "Search findings", submit: (n) => (n ? `Link ${plural(n, "finding")}` : "Link findings"), items: E.findings().filter(E.isOpen).map((f) => { const x = E.riskOfFinding(f); return { id: f.id, title: f.title, desc: U.whereOf(f), meta: f.source, held: x ? (x.id === id ? "Linked" : "Has a risk") : "" }; }), onPick: (ids) => { for (const fid of ids) mapSet("rlink", fid, id); K.redraw(); K.toast(`${plural(ids.length, "finding")} linked to the risk`); } }); });
  K.on("k3e.t.link", (code) => K.pick({ title: `Link ${code} to a risk`, search: "Search the risk register", submit: () => "Link to the risk", items: risks().map((r) => ({ id: r.id, title: r.title, desc: r.threat, meta: SEVW[r.sev] || "", held: r.tech.some((t) => t[0] === code) ? "Names it" : "" })), onPick: (rid) => { addTech(riskById(rid), code, techName(code)); K.redraw(); K.toast(`${code} linked to the risk`); } }));

  function nextOf(r) {
    const fs = findingsOfRisk(r.id), a = r.acc;
    if (!r.owner) return { text: "Nobody owns it.", label: "Assign owner", act: "k3e.r.owner", arg: r.id };
    if (r.resp === "accept" && !a) return { text: "Its response is Accept, and no acceptance is requested.", label: "Request acceptance", act: "k3e.r.accreq", arg: r.id };
    if (a && a.state === "requested") { const st = (CH.STEPS || [])[a.step - 1] || []; return { text: `Acceptance step ${a.step} of 3 waits on ${esc(st[2] || "")}, the ${esc(st[1] || "")}.`, label: `Record as ${st[2] || "its holder"}`, act: "k3e.r.accstep", arg: r.id }; }
    if (a && a.state === "returned") return { text: "The acceptance was sent back.", label: "Request acceptance", act: "k3e.r.accreq", arg: r.id };
    if (r.resp === "mitigate" && !fs.some(E.u.hasPlan)) return fs.length ? { text: "Its response is Mitigate, and none of its findings has a plan.", label: "Open the finding", go: U.recGo("k3e-finding", fs[0].id) } : { text: "Its response is Mitigate, and no finding with a plan stands behind it.", label: "Link findings", act: "k3e.r.fadd", arg: r.id };
    return null;
  }
  const techRow = (r, c, n, page) => { const t = allTechs().find((x) => x.code === c) || {}, un = addedTech(r, c) ? K.btn("Unlink", { sm: true, quiet: true, act: "k3e.r.techrm", arg: { id: r.id, code: c } }) : ""; return { panel: "k3e-tech", id: c, cells: page ? [K.name(n, t.tactics || "", c), esc(t.matrix || ""), t.counter ? `<span class="num">${esc(t.counter)}</span>` : NONE, un] : [K.name(n, "", c), un] }; };
  K.panel("k3e-risk", (raw, opt) => {
    const page = !!(opt && opt.page), id = String(raw || "").split("|")[0], r = riskById(id); if (!r) return null;
    const fs = findingsOfRisk(id), nx = nextOf(r), a = r.acc, due = get("rdue", {})[id] || r.due;
    const accSec = r.resp === "accept" || a ? K.section({ title: "Acceptance", actions: !a || a.state === "returned" ? K.btn("Request acceptance", { sm: true, act: "k3e.r.accreq", arg: id }) : "", body: a
      ? [K.facts([["Why", esc(a.reason || "")], ["Until", a.until ? `<span class="num">${esc(mdy(a.until))}</span>` : NONE]]), K.table({ label: "Acceptance steps", cols: [{ label: "Step" }, { label: "", cls: "tight" }], rows: (CH.STEPS || []).map(([n, role, who]) => { const done = a.state === "accepted" || n < a.step, turn = a.state === "requested" && n === a.step; return { cells: [K.name(`${n}. ${role}`, who), done ? h.pill("ok", n === 3 ? "Accepted" : "Approved") : turn ? K.btn(`Record as ${who}`, { sm: true, act: "k3e.r.accstep", arg: id }) : a.state === "returned" && n === a.step ? h.pill("warn", "Sent back") : mu("Waits")] }; }) })]
      : `<div class="k3-none-row"><span>Not requested yet</span>${K.actLink("Request acceptance", "k3e.r.accreq", id)}</div>` }) : "";
    const menu = K.menu("More", [{ label: "Edit assessment", act: "k3e.r.assess", arg: id }, { label: "Change response", act: "k3e.r.resp", arg: id }, { label: r.owner ? "Change owner" : "Assign owner", act: "k3e.r.owner", arg: id }], { sm: !page });
    const threat = r.threat ? K.section({ title: "Threat", body: `<p class="k3e-p">${esc(r.threat)}</p>` }) : "";
    const fAdd = { label: "Link findings", act: "k3e.r.fadd", arg: id }, tAdd = { label: "Link technique", act: "k3e.r.techadd", arg: id };
    const out = { label: "Risk", title: r.title, chip: sevPill(r.sev), actions: menu,
      facts: [["Assessment", `${esc(LVW[r.lik] || r.lik || "")} likelihood · ${esc(LVW[r.imp] || r.imp || "")} impact ${K.actLink("Edit", "k3e.r.assess", id)}`], ["Response", `${esc(respWord(r))} ${K.actLink("Change", "k3e.r.resp", id)}`], ["Owner", `${K.owner(r.owner)} ${K.actLink(r.owner ? "Change" : "Assign", "k3e.r.owner", id)}`], due ? ["Response due", `<span class="num${late(r) ? " k3e-late" : ""}">${esc(mdy(due))}</span>`] : null, r.created ? ["Created", `<span class="num">${esc(mdy(r.created))}</span>`] : null],
      sections: [U.stepLine(nx, false), threat, accSec,
        K.related({ title: "Findings behind it", count: fs.length, add: fAdd, cols: [{ label: "Finding" }, { label: "Plan", cls: "nw" }], rows: fs.map((f) => { const p = E.planOfFinding(f); return { panel: "k3e-finding", id: f.id, cells: [K.name(f.title, f.source), p ? (p.planned ? `<span class="num">${esc(md(p.planned))}</span>` : mu("No date")) : mu("No plan")] }; }), empty: "No finding is linked" }),
        K.related({ title: "ATT&CK techniques", count: r.tech.length, add: tAdd, cols: [{ label: "Technique" }, { label: "", cls: "tight" }], rows: r.tech.map(([c, n]) => techRow(r, c, n, false)), empty: "It names no technique yet" })] };
    if (!page) return out;
    // The page: the findings behind it in the list's own columns, the techniques with what counters them.
    const short = U.clip(r.title, 64);
    return Object.assign(out, { title: short, sub: short !== r.title ? esc(r.title) : "", crumbs: [["Risks", "risks"], [U.clip(r.title, 40)]], actions: menu + U.stepBtn(nx, true),
      sections: [U.stepLine(nx, true), threat, accSec,
        K.related({ title: "Findings behind it", count: fs.length, add: fAdd, cols: [{ label: "Finding" }, { label: "Severity or determination" }, { label: "Plan", cls: "nw" }, { label: "Owner" }], rows: fs.slice().sort(U.sortF).map((f) => ({ panel: "k3e-finding", id: f.id, cells: [K.name(f.title, [f.source, U.whereOf(f)].filter(Boolean).join(" · ")), U.sevCell(f), U.planCell(f), K.owner(f.owner)] })), empty: "No finding is linked" }),
        K.related({ title: "ATT&CK techniques", count: r.tech.length, add: tAdd, cols: [{ label: "Technique" }, { label: "Matrix", cls: "nw" }, { label: "Countering controls in the baseline", cls: "nw" }, { label: "", cls: "tight" }], rows: r.tech.map(([c, n]) => techRow(r, c, n, true)), empty: "It names no technique yet" })] });
  });
  K.panel("k3e-tech", (code, opt) => {
    const page = !!(opt && opt.page), t = allTechs().find((x) => x.code === code); if (!t) return null;
    const rs = risksOfTech(code), cc = counterOf(code), link = { label: "Link to a risk", act: "k3e.t.link", arg: code };
    const ccRow = (c) => { const st = inBaseline(c) ? V3.fact("status", c) : null, cells = [K.name(U.ctlTitle(c) || c, "", U.ctlTitle(c) ? c : ""), inBaseline(c) ? "In the baseline" : mu("Not selected")].concat(page ? [st ? U.detPill(st) : NONE] : []); return U.ctlRoute(c) ? { panel: "k3c-control", id: c, cells } : { cells }; };
    const out = { label: "ATT&CK technique", title: t.name, code, chip: K.tagged(t.matrix), facts: [["Tactics", t.tactics ? esc(t.tactics) : NONE], ["Printed in", esc(t.matrix === "ICS" ? "NIST SP 800-160 Vol. 2, Appendix G" : "NIST SP 800-160 Vol. 2, Appendix F")], page ? ["Risks", rs.length ? K.actLink(plural(rs.length, "risk"), "k3e.r.tech", code) : mu("None")] : null],
      sections: [K.related({ title: "Risks that name it", count: rs.length, add: page ? null : link, cols: page ? [{ label: "Risk" }, { label: "Severity" }, { label: "Response" }, { label: "Owner" }] : [{ label: "Risk" }, { label: "Owner" }], rows: rs.map((r) => (page ? { panel: "k3e-risk", id: r.id, cells: [K.name(r.title, r.threat), sevPill(r.sev), esc(respWord(r)), K.owner(r.owner)] } : U.riskRow(r))), empty: "No risk names it yet" }),
        K.related({ title: "Countering controls", count: cc.length, cols: [{ label: "Control" }, { label: "Baseline", cls: "nw" }].concat(page ? [{ label: "Status", cls: "nw" }] : []), rows: cc.map(ccRow), empty: "The appendix prints no control against it" })] };
    return page ? Object.assign(out, { crumbs: [["Risks", "risks"], ["Threats", "risks-threats"], [code]], actions: K.btn(link.label, { primary: true, act: link.act, arg: link.arg, icon: "plus" }) }) : out;
  });
  V3.P("a-risk-risk", (orig, id) => { const rid = String(id || "").split("|")[0]; return riskById(rid) ? P["k3e-risk"](rid) : orig(); });
  V3.P("v7a-att", (orig, id) => (wsx() && allTechs().some((t) => t.code === id) ? P["k3e-tech"](id) : orig()));
  E.rsk = { risks, riskById, findingsOfRisk, respWord, CHIPR };
  V3.facts.risksOf = (code) => E.risksOfCtl(code).map((x) => { const r = shape(x); return { id: r.id, title: r.title, sev: r.sev, response: respWord(r), owner: r.owner, panel: "k3e-risk" }; });
})();

// ════════════════ Authorization: the record the authorizing official decides on ════════════════
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k, V = PA && PA.v2, E = PA && PA.v3e;
  if (!V3 || !K || !V || !E) return;
  const P = PA.P, S = PA.S, CH = V.chain, h = PA.h, esc = K.esc, fmt = K.fmt, U = E.u;
  const { md, mdy, days, addDays, plural, mu, NONE, parse, txt, cur, memo, stat, safe, ownerOpts, people, TODAY, ME, AO, ISSM } = U;
  const wsx = () => V3.wsx(), prog = () => V3.prog(), get = E.get, set = E.set;
  const auths = () => memo("auths", () => (V3.fact("authorizations", prog()) || []).map((a) => Object.assign({}, a)));
  const conds = () => memo("conds", () => (V3.fact("conditions", prog()) || []).map((c) => Object.assign({}, c)));
  const inForce = () => auths().filter((a) => a.decided && (!a.atd || a.atd >= TODAY) && !/^(DATO|Not approved)/.test(a.type)).sort((a, b) => String(b.decided).localeCompare(String(a.decided)))[0] || null;
  const recipients = () => memo("share", () => { const base = wsx() ? stat("recipients", () => [...parse(U.old("package-room")).querySelectorAll("tbody tr")].map((tr) => { const c = [...tr.children]; const nm = c[0].querySelector(".nm"); return { name: nm ? txt(nm) : txt(c[0]).replace(/^[A-Z]{2}(?=[A-Z][a-z. ])/, ""), role: txt(c[1]), can: txt(c[2]), expires: txt(c[3]), opened: txt(c[4]) }; }).filter((r) => r.name)) || [] : []; return base.concat(get("share", []).map((r) => Object.assign({ mine: true, opened: "Not opened yet" }, r))); });
  const TABS = [["", "Package"], ["decisions", "Decisions"], ["conditions", "Conditions"], ["monitoring", "Monitoring"], ["sharing", "Sharing"]];
  const route = (k) => (k ? "authorization-" + k : "authorization");
  // What the package holds, each part read from its record.
  function parts() {
    const out = [], F = E.findings(), poam = F.filter(E.CHIPF.poam), plate = poam.filter((f) => (E.planOfFinding(f) || {}).late).length, R = E.rsk ? E.rsk.risks() : [], noOwn = R.filter((r) => !r.owner).length;
    if (wsx()) { const st = CH.ssp3 ? CH.ssp3() : "draft"; out.push({ part: "System security plan", holds: "Revision 3, Increment 2", state: st === "approved" ? "Approved" : st === "submitted" ? "In review" : st === "changes" ? "Changes requested" : "A draft", ready: st === "approved", go: "ssp", open: "Open the SSP" }); }
    const A = E.asm ? E.asm.assessments().filter((a) => a.kind === "control") : [], drafts = A.filter((a) => E.asm.toPublish(a) > 0);
    out.push({ part: "Security assessment report", holds: A.length ? `${plural(A.length, "control assessment")}` : "No assessment yet", state: !A.length ? "Nothing to report" : drafts.length ? `${plural(drafts.length, "assessment")} with results in draft` : "Every result published", ready: !!A.length && !drafts.length, go: drafts.length === 1 ? drafts[0].route + "--results" : "assessments", act: drafts.length > 1 ? ["asm", { att: "publish" }] : null, open: drafts.length ? "Open the results" : "Open Assessments" });
    out.push({ part: "Plan of action and milestones", holds: `${plural(poam.length, "finding")} with a plan`, state: !poam.length ? "No finding has a plan" : plate ? `${plural(plate, "plan")} past the planned date` : "Every plan on its date", ready: !!poam.length && !plate, go: "findings-poam", open: "Open the POA&M" });
    out.push({ part: "Risk assessment", holds: `${plural(R.length, "open risk")}`, state: !R.length ? "No risk recorded" : noOwn ? `${plural(noOwn, "risk")} without an owner` : "Every risk owned", ready: !!R.length && !noOwn, go: "risks", act: noOwn ? ["rsk", { chip: "noowner" }] : null, open: "Open the risks" });
    return out;
  }
  const openConds = () => conds().filter((c) => !c.closed);
  function head(tab) {
    const f = inForce(), counts = { decisions: auths().length, conditions: openConds().length, sharing: recipients().length };
    return { head: K.head({ title: "Authorization", chip: f ? h.pill(/condition/i.test(f.type) ? "warn" : "ok", f.type) : h.pill("none", "No decision yet"),
      sub: f ? `In force since <span class="num">${esc(mdy(f.decided))}</span>, signed by ${esc(f.by || AO)}${f.atd ? ` · ends <span class="num">${esc(mdy(f.atd))}</span>` : ""} · ${esc(f.scope || "")}` : "The authorizing official has decided nothing yet for this program.",
      actions: K.menu("More", [{ label: "Export the package", act: "k3e.z.export" }, { label: "Share the package", act: "k3e.z.share" }]) }),
      tabs: K.tabs(TABS.map(([k, label]) => ({ label, route: route(k), on: tab === k, count: counts[k] == null ? null : counts[k] })), "Authorization") };
  }
  function tabPackage() {
    const L = parts(), ready = L.filter((x) => x.ready).length, f = inForce(), next = auths().find((a) => !a.decided), first = L.find((x) => !x.ready);
    return K.aside([first ? K.next({ text: `${fmt(ready)} of ${fmt(L.length)} parts are ready. ${esc(first.part)}: ${esc(first.state.toLowerCase())}.`, action: first.act ? K.btn(first.open, { sm: true, primary: true, act: "k3e.z.open", arg: { go: first.go, set: first.act } }) : K.btn(first.open, { sm: true, primary: true, go: first.go }) }) : K.next({ text: "Every part is ready for the authorizing official.", action: next ? K.btn("Record decision", { sm: true, primary: true, act: "k3e.z.decide", arg: next.id }) : "" }),
      K.section({ title: "What the package holds", count: L.length, body: K.table({ label: "Package", cols: [{ label: "Part" }, { label: "State" }, { label: "", cls: "tight" }], rows: L.map((x) => Object.assign(x.act ? { act: "k3e.z.open", arg: { go: x.go, set: x.act } } : { go: x.go }, { cells: [K.name(x.part, x.holds), `${h.pill(x.ready ? "ok" : "warn", x.ready ? "Ready" : "Not ready")} ${mu(esc(x.state))}`, ""] })) }) })],
    [K.details("Decision in force", f ? [["Decision", esc(f.type)], ["Signed", `<span class="num">${esc(mdy(f.decided))}</span>`], ["By", K.owner(f.by || AO)], ["Ends", f.atd ? `<span class="num">${esc(mdy(f.atd))}</span>` : NONE], ["Covers", esc(f.scope || "")], ["Conditions", openConds().length ? K.link(`${fmt(openConds().length)} open`, route("conditions")) : mu("None open")]] : [["Decision", mu("None yet")], next ? ["Planned", `${esc(next.type)}${next.planned ? ` · <span class="num">${esc(mdy(next.planned))}</span>` : ""}`] : null])]);
  }
  function tabDecisions() {
    const L = auths().slice().sort((a, b) => String(b.decided || b.planned || "").localeCompare(String(a.decided || a.planned || "")));
    return [K.table({ label: "Decisions", cols: [{ label: "Decision" }, { label: "State" }, { label: "Decided or planned", cls: "nw" }, { label: "Authorizing official" }, { label: "Ends", cls: "nw" }, { label: "", cls: "tight" }],
      rows: L.map((a) => Object.assign({}, { cells: [K.name(a.type, `${a.inc ? `Increment ${a.inc} · ` : ""}${a.scope || ""}`), a.decided ? h.pill(/condition/i.test(a.type) ? "warn" : /DATO|Not approved/.test(a.type) ? "bad" : "ok", (a.conditions || []).length ? `Decided · ${plural(a.conditions.length, "condition")}` : "Decided") : h.pill("none", "Planned"), a.decided ? `<span class="num">${esc(mdy(a.decided))}</span>` : a.planned ? `<span class="num">${esc(mdy(a.planned))}</span>` : NONE, a.by ? `<span class="k3e-own">${K.owner(a.by)}</span>` : mu(AO), a.atd ? `<span class="num">${esc(mdy(a.atd))}</span>` : NONE, a.decided ? "" : K.btn("Record decision", { sm: true, act: "k3e.z.decide", arg: a.id })] })),
      empty: { title: "No decision yet", line: "An interim authorization to test or an authorization to operate is recorded here when the authorizing official signs.", action: K.btn("Record decision", { sm: true, act: "k3e.z.decide", arg: "" }) }, foot: `<span class="num">${plural(L.length, "decision")}</span>` })];
  }
  function tabConditions() {
    const L = conds().slice().sort((a, b) => (a.closed ? 1 : 0) - (b.closed ? 1 : 0) || String(a.due || "").localeCompare(String(b.due || "")));
    const nameOf = (c) => { const a = auths().find((x) => x.id === c.step); return a ? a.type : c.step || ""; };
    return [K.table({ label: "Conditions", cols: [{ label: "Condition" }, { label: "Owner" }, { label: "Due", cls: "nw" }, { label: "State" }, { label: "", cls: "tight" }],
      rows: L.map((c) => ({ cells: [K.name(c.t, [nameOf(c), c.closed ? "" : c.progress].filter(Boolean).join(" · ")), `<span class="k3e-own">${K.owner(c.owner)}</span>`, c.due ? `<span class="num${!c.closed && c.due < TODAY ? " k3e-late" : ""}">${esc(md(c.due))}</span>` : NONE, c.closed ? `${h.pill("ok", "Closed")} ${mu(esc(md(c.closed)))}` : h.pill("none", "Open"), c.closed ? "" : K.btn("Close", { sm: true, act: "k3e.z.close", arg: c.id })] })),
      empty: { title: "No condition", line: "A decision with conditions lists each here with its owner and its due day." }, foot: `<span class="num">${plural(openConds().length, "open condition")} of ${fmt(L.length)}</span>` })];
  }
  function tabMonitoring() {
    const checks = E.asm ? E.asm.assessments().filter((a) => a.kind === "check") : [], scn = get("scn", []), f = inForce();
    return [K.related({ title: "What ongoing authorization owes", count: checks.length, cols: [{ label: "Report or check" }, { label: "Cadence", cls: "nw" }, { label: "Next", cls: "nw" }, { label: "State" }], rows: checks.map((a) => ({ go: a.route, cells: [K.name(a.name, a.covers && a.covers.length ? a.covers.join(", ") : ""), esc(a.cadence), a.due ? `<span class="num${a.status === "Overdue" ? " k3e-late" : ""}">${esc(md(a.due))}</span>` : NONE, h.pill(a.status === "Overdue" ? "bad" : a.status === "Due soon" ? "warn" : "ok", a.status)] })), empty: f ? "No monitoring check is planned yet: plan them on Assessments" : "Monitoring starts with the first decision" }),
      K.related({ title: "Significant changes", count: scn.length, add: { label: "Report a change", act: "k3e.z.scn" }, cols: [{ label: "Change" }, { label: "Reported", cls: "nw" }, { label: "Effect on the authorization" }], rows: scn.map((x) => ({ cells: [K.name(x.what, x.by), `<span class="num">${esc(md(x.at))}</span>`, h.pill(x.effect === "Reauthorization" ? "bad" : x.effect === "AO review" ? "warn" : "none", x.effect)] })), empty: "No significant change reported since the decision" })];
  }
  function tabSharing() {
    const L = recipients();
    return [K.toolbar({ right: K.btn("Share with a person", { sm: true, act: "k3e.z.share", icon: "plus" }) }),
      K.table({ label: "Who can open the package", cols: [{ label: "Recipient" }, { label: "Can open" }, { label: "Until", cls: "nw" }, { label: "Last opened", cls: "nw" }, { label: "", cls: "tight" }], rows: L.map((r) => ({ cells: [K.name(r.name, r.role), esc(r.can), r.mine ? `<span class="num">${esc(mdy(r.expires))}</span>` : esc(r.expires), esc(r.opened), r.mine ? K.btn("Remove", { sm: true, quiet: true, act: "k3e.z.unshare", arg: r.id }) : ""] })),
        empty: { title: "Nobody outside the team can open it", line: "Share the package with the people who review and sign it. Every open is watermarked and logged.", action: K.btn("Share with a person", { sm: true, act: "k3e.z.share" }) }, foot: `<span class="num">${plural(L.length, "recipient")}</span>` })];
  }
  function page(tab) { const hd = head(tab); return K.page({ cls: "k3e", head: hd.head, tabs: hd.tabs, body: tab === "decisions" ? tabDecisions() : tab === "conditions" ? tabConditions() : tab === "monitoring" ? tabMonitoring() : tab === "sharing" ? tabSharing() : tabPackage() }); }
  V3.S("authorization", () => page(""));
  for (const [k] of TABS) if (k) { if (S[route(k)]) V3.S(route(k), () => page(k)); else K.screen(route(k), () => page(k), "authorization"); }
  K.on("k3e.z.open", (a) => { if (a.set) U.setView(a.set[0], a.set[1]); K.go(a.go); });
  K.on("k3e.z.close", (id) => { const c = conds().find((x) => x.id === id); if (!c) return; K.form({ title: "Close condition", submit: "Close condition", intro: `${esc(c.t)}. ${esc(c.owner || "Its owner")} closes it; the decision keeps the record.`, fields: [{ key: "how", label: "What closed it", type: "textarea", rows: 3, required: true, hint: "The record that meets it: results published, a review recorded, a plan completed" }, { key: "at", label: "Closed on", type: "date", required: true, value: TODAY }],
    onSubmit: (o) => { if (o.at > TODAY) return { at: "Choose today or an earlier day." }; V.set("v3.G.condx." + safe(id), { at: o.at, by: c.owner || ME, how: o.how, rec: ME }); K.redraw(); K.toast(`Condition closed: ${c.t}`); } }); });
  K.on("k3e.z.decide", (id, el, ev) => {
    if (ev) ev.stopPropagation();
    // lead: an authorization decision is recorded here, on Authorization. Lane O sends gate--ato-N and gate--iatt-N back to this
    // page, so sending the reader to "the gate's page" was a circle; the form opens on the planned decision's own type and scope.
    const a0 = id ? auths().find((x) => x.id === id) : null;
    K.form({ title: a0 ? `Record decision: ${a0.type}` : "Record decision", submit: `Record as ${AO}`, intro: `The authorizing official's decision on this program. The prototype records it as ${esc(AO)}, by ${esc(ME)}.`, fields: [{ key: "type", label: "Decision", type: "select", required: true, value: a0 ? (/IATT/.test(a0.type) ? "IATT" : "ATO") : "", options: ["IATT", "ATO", "ATO with conditions", "DATO"] }, { key: "decided", label: "Signed", type: "date", required: true, half: true, value: TODAY }, { key: "atd", label: "Ends", type: "date", half: true, value: addDays(TODAY, 365) }, { key: "scope", label: "What it covers", required: true, value: a0 ? a0.scope || "" : "" }, { key: "cond", label: "Conditions", type: "textarea", rows: 3, hint: "One a line; each is tracked with an owner and a due day" }],
      onSubmit: (o) => { const lines = o.cond.split("\n").map((x) => x.trim()).filter(Boolean); if (/conditions/.test(o.type) && !lines.length) return { cond: "List at least one condition." }; const key = id || "auth-" + (auths().length + 1), k = safe(prog()); V.set(`v3.G.auth.${k}.${key}`, { type: o.type, decided: o.decided, by: AO, atd: o.type === "DATO" ? null : o.atd || null, scope: o.scope, conditions: lines }); if (lines.length) V.set(`v3.G.cond.${k}.${key}`, lines.map((t, j) => ({ id: `${k}.${key}#${j + 1}`, t, owner: "", due: addDays(o.decided, 90), at: o.decided })));
        // lead: a planned decision (an IATT or ATO step of the lifecycle) counts as decided once its step holds the decision too:
        // lane G's authorizations() reads both, and the Overview's gates read the step.
        if (a0) V.set(`life.dec.${k}.${key}`, { o: lines.length ? "cond" : /DATO/.test(o.type) ? "no" : "yes", c: lines.join("; "), at: o.decided, by: AO, rec: ME });
        K.redraw(); K.toast(`${o.type} recorded as ${AO}`); } });
  });
  K.on("k3e.z.scn", () => K.form({ title: "Report a significant change", submit: "Report change", intro: "A change to the system or its environment after the decision. The authorizing official's office decides whether the authorization still holds.", fields: [{ key: "what", label: "What changes", required: true }, { key: "effect", label: "Effect on the authorization", type: "select", required: true, options: ["None: within the authorized baseline", "AO review", "Reauthorization"] }],
    onSubmit: (o) => { set("scn", get("scn", []).concat([{ id: K.id("scn"), what: o.what, effect: o.effect.split(":")[0], at: TODAY, by: ME }])); K.redraw(); K.toast("Change reported to the authorizing official's office"); } }));
  K.on("k3e.z.share", () => K.form({ title: "Share the package", submit: "Share package", intro: "The person can open the package until the day given. Every open is watermarked and logged.", fields: [{ key: "name", label: "Person", required: true, hint: "A name, or an office outside the program" }, { key: "role", label: "Role", required: true, half: true }, { key: "can", label: "Can open", type: "select", required: true, half: true, options: ["Full package", "SSP, SAR and POA&M", "SSP and POA&M", "Read only"] }, { key: "expires", label: "Until", type: "date", required: true, value: addDays(TODAY, 90) }],
    onSubmit: (o) => { if (o.expires <= TODAY) return { expires: "Choose a later day." }; if (recipients().some((r) => r.name.toLowerCase() === o.name.toLowerCase())) return { name: "This person can open the package already." }; set("share", get("share", []).concat([Object.assign({ id: K.id("sh") }, o)])); K.redraw(); K.toast(`Package shared with ${o.name} until ${mdy(o.expires)}`); if (cur() !== route("sharing")) K.go(route("sharing")); } }));
  K.on("k3e.z.unshare", (id) => { const r = get("share", []).find((x) => x.id === id); if (!r) return; K.confirm({ title: "Remove access", text: `${esc(r.name)} can no longer open the package. The opens already logged stay in the log.`, submit: "Remove access", danger: true, onOk: () => { set("share", get("share", []).filter((x) => x.id !== id)); K.redraw(); K.toast(`${r.name} can no longer open the package`); } }); });
  K.on("k3e.z.export", () => { const L = parts(); K.toast(`Package exported: ${L.map((x) => x.part).join(", ")}`); });
  E.auth = { parts, auths, conds, recipients, inForce };

  // ════════════════ Folding: every old address opens its new home ════════════════
  const fold = (from, to, was) => { V3.redirect(from, to); if (was) V3.compareAs(typeof to === "string" ? to : was[0], was[1] || was); };
  V3.redirect(/^cyber-te(-|$)/, "assessments-cyber"); V3.compareAs("assessments-cyber", "cyber-te");
  V3.redirect(/^(conmon|checks|schedule)(-|$)/, "assessments-checks"); V3.compareAs("assessments-checks", "conmon");
  const CHK = { scan: "vuln", iava: "vuln", stig: "stig", sbom: "sbom", expiring: "expiring", "poam-review": "poamr", "priv-review": "par" };
  V3.redirect(/^check-/, (r) => { const m = /^check-(scan|iava|stig|sbom|expiring|poam-review|priv-review)/.exec(r); return m ? "assessment--chk-" + CHK[m[1]] : "assessments-checks"; });
  V3.redirect("campaign", "assessment--exp"); V3.redirect(/^campaign-(objectives|findings|controls)$/, (r) => "assessment--exp--" + (r.endsWith("findings") ? "findings" : "objectives"));
  V3.redirect(/^campaign-conmon/, "assessment--conmon"); V3.redirect(/^campaign-r\d+/, "assessments-control");
  V3.redirect(/^campaign-new-/, (r) => { const c = CH.camps().find((x) => x.route && (r === x.route || r.startsWith(x.route + "-"))); return c ? "assessment--" + c.id : "assessments-control"; });
  V3.redirect(/^assessments-(plans|results|completed|assessor)$/, "assessments"); V3.compareAs("assessments-control", "assessments");
  V3.redirect(/^poam(-|$)/, "findings-poam"); V3.compareAs("findings-poam", "poam"); V3.compareAs("findings-issues", "findings"); V3.compareAs("findings-stig", "stigs-open");
  V3.redirect(/^threats(-|$)/, "risks-threats"); V3.compareAs("risks-threats", "threats");
  V3.redirect(/^package-room(-|$)/, "authorization-sharing"); V3.redirect(/^authorization-sharing-/, "authorization-sharing");
  V3.compareAs(/^assessment--exp/, "campaign"); V3.compareAs(/^assessment--conmon/, "campaign-conmon"); V3.compareAs(/^assessment--chk-/, "conmon"); V3.compareAs(/^assessment--cy-/, "cyber-te");
  V3.compareAs("authorization-decisions", "authorization"); V3.compareAs("authorization-conditions", "authorization"); V3.compareAs("authorization-monitoring", "conmon");

  // ════════════════ What the other lanes read ════════════════
  // The Overview, the gates and My work count operational issues, risks and POA&M items from lane F's facts (and lane P's for a
  // created program). For the program on screen they count what Findings and Risks list, so a count opens exactly its records:
  // an operational issue raised for a CVE is listed once, under Vulnerabilities.
  V3.ready(() => {
    const wrap = (name, fn) => { const f = V3.facts[name]; V3.facts[name] = (p, ...a) => { const base = typeof f === "function" ? f(p, ...a) : undefined; if (!V3.on() || (p && p !== prog())) return base; try { return fn(base); } catch (e) { console.error("k3e", name, e); return base; } }; };
    const sevs = (L) => { const o = { critical: 0, high: 0, moderate: 0, low: 0 }; for (const x of L) if (x.sev in o) o[x.sev]++; return o; };
    // A control of the expanded campaign every objective of which is judged and published stands at the worst of them. Lane F's
    // status reads the expanded set's determinations from its own table (PA.v3f.INC2), and lanes C, O and S read lane F: the
    // control's determination joins that table while it stands, and leaves it when the session's state no longer holds it.
    const KEPT = new Map();
    const syncSet = () => {
      const T = PA.v3f && PA.v3f.INC2, r3 = PA.v3r; if (!T || !r3) return;
      const O = V.get("v3.R.obj", null) || {}, now = new Map();
      for (const code of Object.keys(O)) { const st = O[code] || {}; let objs = []; try { objs = r3.objectivesOf(code); } catch (e) { objs = []; } if (!objs.length || !objs.every((o) => st[o.i] && st[o.i].det && st[o.i].pub && st[o.i].pub.cid === "exp")) continue; const d = r3.derived(code); if (d) now.set(code, d); }
      for (const [code, was] of KEPT) if (!now.has(code)) { if (was === undefined) delete T[code]; else T[code] = was; KEPT.delete(code); }
      for (const [code, det] of now) { if (!KEPT.has(code)) KEPT.set(code, T[code]); T[code] = det; }
    };
    syncSet(); V.on(syncSet);
    wrap("issues", (base) => { const L = E.findings().filter((f) => f.kind === "issue" && E.isOpen(f)); if (!wsx() && !L.length) return base; return Object.assign({}, base || {}, wsx() ? { open: L.length, bySev: sevs(L), pastDue: L.filter((f) => f.late).length } : { open: ((base || {}).open || 0) + L.length, bySev: sevs(L), pastDue: L.filter((f) => f.late).length }); });
    wrap("risks", (base) => { if (wsx()) return base; const L = get("risks", []); return L.length ? Object.assign({}, base || {}, { open: ((base || {}).open || 0) + L.length, noOwner: ((base || {}).noOwner || 0) + L.filter((r) => !r.owner).length, bySev: sevs(L) }) : base; });
    wrap("poam", (base) => { if (wsx()) return base; const L = get("plans", []); return L.length ? Object.assign({}, base || {}, { items: ((base || {}).items || 0) + L.length, open: ((base || {}).open || 0) + L.length }) : base; });
  });
  // Lane F's finding(code) also answers a finding recorded here on one objective, before every objective is judged.
  const f0 = V3.facts.finding;
  V3.facts.finding = (code) => { const base = f0 ? f0(code) : null; const mine = E.findingsOf(code).filter((f) => f.kind === "af" && f.obj != null).sort((a, b) => (b.det === "other_than_satisfied") - (a.det === "other_than_satisfied"))[0]; if (!mine || (base && base.det === "other_than_satisfied")) return base; const a = E.asm.byId(mine.asm); return { det: mine.det, res: mine.state === "draft" ? "Draft results" : "Published results", camp: a ? a.short || a.name : "", route: a ? a.route + "--findings" : "assessments", date: mine.opened || TODAY }; };
})();
