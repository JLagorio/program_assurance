// Prototype v2, agent H (v2h-): host systems, common control providers and the authorization boundary. Loads after the SCTM and
// before G's lifecycle (mod-zzzz-v2-8life) and the visual layer. Data: PA.HOSTD (mod-zzzz-v2-8host-data.js).
// Routes: boundary (the bubble: what the ATO and the IATT each cover), hosts (Host & providers: each provider's offer and what WS-X90
// takes; the inheritance table; Change responsibility; Add provider), rec--v2h-prov--<id>[|tab] (a provider's page).
// Model (RMF's, as eMASS keeps it): each control of WS-X90's baseline is Inherited (the provider implements and assesses it; its
// control status is the provider's), Hybrid (the provider does part; WS-X90 owes its own part; the status stays WS-X90's) or
// System-specific. A provider's offer sets the default; a change, with its reason, is kept in PA.v2 state:
//   host.resp.<code>  { kind, part, reason, by, at }      host.added [providerId]     host.qv / host.f (the table's question)
// Every inherited control's status is written into PA.SSP (controls[].cs and counts.controlStatus, in place), so the chain's counts,
// Controls, the Overview, the baseline, the SSP editor and the SCTM read one number; apply() runs again after every change.
// API, window.PA.v2host: hostOf(program) → { id, name, href } | null; responsibility(code[, program]) → { kind, provider, href, … };
//   providers(program) → [{ id, name, kind, href, offered, inherited, hybrid, back }]; href(providerId) → "#rec--v2h-prov--<id>";
//   counts() → { sat, total, inh, hyb, own, cs }; defaults(program, codes) → { offered, inherited, hybrid } (program creation).
(function () {
  const PA = window.PA, V = PA && PA.v2, HD = PA && PA.HOSTD;
  if (!V || !PA.AK || !PA.SSP || !HD) return;
  const { S, P, M, h, ROUTE_NAV } = PA;
  const AK = PA.AK, SSP = PA.SSP;
  const { esc, fmt, pct, pill } = h;
  const PROV = HD.providers, WSX = "PRG-1090", ME = "Ingrid Solberg";
  const TODAY = PA.data.TODAY;
  const mdy = (iso) => (iso ? new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  const days = (iso) => Math.round((new Date(iso + "T12:00:00") - TODAY) / 86400000);
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const DASH = '<span class="v2-dash" aria-label="None">—</span>';
  const mu = (t) => `<span class="v2h-mu">${t}</span>`;
  const num = (n) => `<span class="num">${fmt(n)}</span>`;
  const fam = (code) => String(code).split("-")[0];
  const ctl = (code) => SSP.ctl(code) || { c: code, t: code, f: fam(code), cs: "no_requirement", ob: 1 };
  const STW = { satisfied: "Satisfied", partially_satisfied: "Partially satisfied", other_than_satisfied: "Other than satisfied", not_assessed: "Not assessed", no_evidence: "No evidence", no_requirement: "No requirement" };
  const stPill = (cs) => pill("none", STW[cs] || "No requirement");
  const recRoute = (id, tab) => `rec--v2h-prov--${id}${tab ? "|" + tab : ""}`;
  const href = (id) => "#" + recRoute(id);
  const hubs = () => PA.v2hubs || null;
  const curProg = () => (hubs() ? hubs().cur() : WSX);
  const madeOne = (code) => (hubs() && code ? hubs().madeOne(code) : null);
  const btn = (label, attrs = "", ink = false, sm = true) => `<span class="btn${sm ? " sm" : ""}${ink ? " ink" : ""}" role="button" tabindex="0" ${attrs}>${label}</span>`;
  const lnk = (label, attrs) => `<span class="ak-link" role="link" tabindex="0" ${attrs}>${esc(label)}</span>`;
  const provBtn = (id, label) => `<span class="ak-link v2h-pl" role="button" tabindex="0" data-panel="v2h-prov" data-id="${esc(id)}">${esc(label || PROV[id].name)}</span>`;
  const note = (t) => `<p class="note-p v2h-foot">${esc(t)}</p>`;

  // ════════════════ Offers and responsibility ════════════════
  // A provider's offer, one entry a control: { code, kind "Inherited"|"Hybrid", prov (what the provider implements), own (the
  // consumer's part), st (the provider's control status), poam, cap }.
  const OFFERS = {};
  function offersOf(pid) {
    if (OFFERS[pid]) return OFFERS[pid];
    const p = PROV[pid]; const out = [];
    if (!p) return out;
    for (const [code, o] of Object.entries(p.offers || {})) {
      const [k, stmt, own, st, poam] = o;
      out.push({ code, kind: k === "h" ? "Hybrid" : "Inherited", prov: stmt || (p.fam && p.fam[fam(code)]) || `${p.name} implements ${code} for what it serves.`, own: own || null, st: st || "satisfied", poam: poam || null });
    }
    for (const [cid, name, codes, duty] of p.caps || []) for (const code of codes) {
      out.push({ code, kind: p.forceHybrid ? "Hybrid" : "Inherited", prov: `The ${p.name} provides ${name.charAt(0).toLowerCase() + name.slice(1)} for every system that takes it.`, own: `WS-X90's duty: ${duty}`, st: "satisfied", poam: null, cap: name, capId: cid });
    }
    return (OFFERS[pid] = out);
  }
  const offerIn = (pid, code) => offersOf(pid).find((o) => o.code === code) || null;
  const added = () => (V.get("host.added", null) || []).filter((id) => PROV[id]);
  // The program's providers in lookup order: WS-X90's from the data and those added here; a created program's host.
  function provIds(prog) {
    prog = prog || WSX;
    const base = (HD.programs[prog] || {}).providers;
    if (prog === WSX) return [...base, ...added().filter((id) => !base.includes(id))];
    if (base) return base.slice();
    const m = madeOne(prog); return m && m.host && PROV[m.host] ? [m.host] : [];
  }
  function hostId(prog) {
    prog = prog || curProg();
    if (HD.programs[prog]) return HD.programs[prog].host;
    const m = madeOne(prog); return m && m.host && PROV[m.host] ? m.host : null;
  }
  // WS-X90's index: control code → the offer that holds it (the first provider that offers it), rebuilt when the providers change.
  let IDX = null, IDXKEY = "";
  function index() {
    const ids = provIds(WSX), key = ids.join(",");
    if (IDX && key === IDXKEY) return IDX;
    IDX = new Map(); IDXKEY = key;
    for (const pid of ids) for (const o of offersOf(pid)) if (!IDX.has(o.code) && SSP.ctl(o.code)) IDX.set(o.code, { ...o, pid });
    return IDX;
  }
  const chg = (code) => V.get("host.resp." + code, null);
  // The responsibility of one of WS-X90's controls, as the session leaves it.
  function resp(code) {
    const o = index().get(code) || null, c = chg(code);
    let kind = o ? o.kind : "System-specific";
    if (c && c.kind) kind = c.kind;
    if (!o) kind = "System-specific";
    if (kind === "Inherited" && o && PROV[o.pid].forceHybrid) kind = "Hybrid";
    const own = kind === "Hybrid" ? (c && c.part) || (o && o.own) || "" : "";
    return { code, kind, pid: o ? o.pid : null, offer: o, own, change: c, def: o ? o.kind : "System-specific", back: !!(o && kind === "System-specific") };
  }
  const ORIG = new Map(SSP.controls.map((c) => [c.c, { cs: c.cs, oa: c.oa }]));
  function apply() {
    const cnt = { satisfied: 0, partially_satisfied: 0, other_than_satisfied: 0, not_assessed: 0, no_evidence: 0, no_requirement: 0 };
    for (const c of SSP.controls) {
      const o = ORIG.get(c.c), r = resp(c.c);
      if (r.kind === "Inherited") { c.cs = r.offer.st; c.oa = c.ob; c.v2hInh = r.pid; }
      else { c.cs = o.cs; c.oa = o.oa; if (c.v2hInh) delete c.v2hInh; }
      cnt[c.cs] = (cnt[c.cs] || 0) + 1;
    }
    Object.assign(SSP.counts.controlStatus, cnt);
  }
  // The default responsibilities, before anything the session changes: the snapshots the daily job took read them.
  const DEF = (() => {
    const d = { satisfied: 0, partially_satisfied: 0, other_than_satisfied: 0, not_assessed: 0, no_evidence: 0, no_requirement: 0 };
    const ix = new Map(); for (const pid of HD.programs[WSX].providers) for (const o of offersOf(pid)) if (!ix.has(o.code) && SSP.ctl(o.code)) ix.set(o.code, { ...o, pid });
    let inh = 0;
    for (const c of SSP.controls) { const o = ix.get(c.c); const whole = o && o.kind === "Inherited" && !PROV[o.pid].forceHybrid; if (whole) inh++; const cs = whole ? o.st : c.cs; d[cs]++; }
    const base = SSP.counts.controlStatus, dd = {}; for (const k of Object.keys(d)) dd[k] = d[k] - (base[k] || 0);
    return { cs: d, sat: d.satisfied, inh, delta: dd.satisfied, dd };
  })();
  apply();
  V.on((path) => { if (path === "*" || String(path).startsWith("host.")) { IDX = null; apply(); } });

  const all = () => SSP.controls.map((c) => resp(c.c));
  function counts() {
    const ch = V.chain, cs = ch ? ch.counts() : SSP.counts.controlStatus;
    const rs = all();
    return { cs, sat: cs.satisfied || 0, total: SSP.controls.length, inh: rs.filter((r) => r.kind === "Inherited").length, hyb: rs.filter((r) => r.kind === "Hybrid").length, own: rs.filter((r) => r.kind === "System-specific").length, back: rs.filter((r) => r.back).length };
  }
  // What WS-X90 takes from one provider: the controls of its baseline the provider holds, by responsibility.
  function takes(pid) {
    const ix = index(), mine = [...ix.values()].filter((o) => o.pid === pid).map((o) => resp(o.code));
    return { offered: mine.length, inh: mine.filter((r) => r.kind === "Inherited").length, hyb: mine.filter((r) => r.kind === "Hybrid").length, back: mine.filter((r) => r.back).length, rows: mine, shadow: offersOf(pid).filter((o) => SSP.ctl(o.code) && (ix.get(o.code) || {}).pid !== pid).length };
  }
  // A created program: what its host offers of the baseline it chose (codes), inherited by default.
  function defaults(pid, codes) {
    const of = offersOf(pid).filter((o) => !codes || codes.has(o.code));
    return { offered: of.length, inherited: of.filter((o) => o.kind === "Inherited" && !PROV[pid].forceHybrid).length, hybrid: of.filter((o) => o.kind === "Hybrid" || PROV[pid].forceHybrid).length };
  }
  const authWord = (p) => p.auth.word;
  const authLine = (p) => p.auth.on ? `${p.auth.word} · ${mdy(p.auth.on)}` : p.auth.word;
  const expCell = (p) => p.auth.atd ? `<span class="num${days(p.auth.atd) < 0 ? " v2h-late" : ""}">${mdy(p.auth.atd)}</span>` : DASH;
  const respWords = (r) => r.kind === "System-specific" ? "System-specific" : `${r.kind} · ${PROV[r.pid].name}`;

  PA.v2host = {
    hostOf: (prog) => { const id = hostId(prog || curProg()); return id ? { id, name: PROV[id].name, href: href(id) } : null; },
    responsibility: (code, prog) => {
      if (prog && prog !== WSX) { const pid = hostId(prog); const o = pid ? offerIn(pid, code) : null; return o ? { kind: o.kind, provider: PROV[pid].name, href: href(pid), part: o.own, statement: o.prov, status: o.st } : { kind: "System-specific", provider: null, href: null }; }
      const r = resp(code);
      return { kind: r.kind, provider: r.pid ? PROV[r.pid].name : null, href: r.pid ? href(r.pid) : null, providerId: r.pid, part: r.own || null, statement: r.offer ? r.offer.prov : null, status: r.offer ? r.offer.st : null, poam: r.offer ? r.offer.poam : null, reason: r.change ? r.change.reason : null, back: r.back };
    },
    providers: (prog) => provIds(prog || curProg()).map((id) => { const p = PROV[id], t = (prog || curProg()) === WSX ? takes(id) : null; return { id, name: p.name, kind: p.kind, href: href(id), offered: t ? t.offered : offersOf(id).length, inherited: t ? t.inh : null, hybrid: t ? t.hyb : null, back: t ? t.back : null }; }),
    href, counts, defaults, offersOf, takes, resp, apply, PROV, DEF, words: respWords, all,
  };

  // ════════════════ Previews ════════════════
  const card = (title, count, body, end = "") => `<div class="ak-card v2k-lk"><div class="v2k-lkh"><b>${esc(title)}</b>${count != null ? `<span class="num v2k-mu">${fmt(count)}</span>` : ""}${end ? `<span class="v2k-push">${end}</span>` : ""}</div>${body}</div>`;
  const line = (lead, text, end = "", attrs = "") => `<div class="v2k-li"${attrs ? " " + attrs : ""}>${lead}<span class="x">${text}</span>${end ? `<span class="e">${end}</span>` : ""}</div>`;
  const elName = (code) => { const e = PA.v7p && PA.v7p.EBY && PA.v7p.EBY[code]; return e ? e.name : code; };
  const PROGNAME = Object.fromEntries((PA.data.PROGRAMS || []).map((p) => [p.code, p.name]));
  // What a provider carries or serves: WS-X90 live, the others as their programs record them.
  function carried(pid) {
    const p = PROV[pid], out = [];
    if (provIds(WSX).includes(pid)) { const t = takes(pid); out.push({ prog: WSX, name: PROGNAME[WSX], inh: t.inh, hyb: t.hyb, at: p.kind === "Host system" ? "Installed mission system" : p.els.length ? p.els.map(elName).join(", ") : "The whole boundary", live: true }); }
    for (const [prog, c] of Object.entries(p.carries || {})) out.push({ prog, name: PROGNAME[prog] || prog, inh: c.inh.length, hyb: c.hyb.length, at: c.at });
    for (const m of (hubs() ? hubs().made() : []) || []) if (m.host === pid) { const d = m.hostTake || defaults(pid, null); out.push({ prog: m.code, name: m.name, inh: d.inherited, hyb: d.hybrid, at: "Created in this session", made: true }); }
    return out;
  }
  P["v2h-prov"] = (id) => {
    const p = PROV[id] || PROV.f16, t = takes(p.id), mine = provIds(WSX).includes(p.id);
    // A host system that carries other programs is not WS-X90's to add: its preview offers no verb.
    const otherHost = !mine && p.kind === "Host system";
    const head = AK.recordHead({ title: p.name, chip: AK.chip(p.kind), actions: mine ? btn("Show its controls", `data-v2h-show="${p.id}"`, true) : otherHost ? "" : btn("Add provider", `data-modal="v2h-add" data-id="${p.id}"`, true) });
    const facts = AK.facts([["Owner", esc(p.owner)], ["Authorization", `${esc(authLine(p))}`], ["Expires", expCell(p)], ["Offers", `${num(offersOf(p.id).length)} controls`]]);
    const take = mine ? card("What WS-X90 takes", t.offered, `<dl class="ak-kv"><dt>Inherited</dt><dd class="num">${fmt(t.inh)}</dd><dt>Hybrid</dt><dd class="num">${fmt(t.hyb)}</dd><dt>Taken back</dt><dd class="num">${fmt(t.back)}</dd>${t.shadow ? `<dt>From another provider</dt><dd class="num">${fmt(t.shadow)}</dd>` : ""}</dl>`)
      : otherHost ? card("What it offers", offersOf(p.id).length, `<p class="v2k-none">Offered to the programs it carries: ${plural(offersOf(p.id).filter((o) => o.kind === "Inherited").length, "control")} inherited by default, ${fmt(offersOf(p.id).filter((o) => o.kind === "Hybrid").length)} hybrid. WS-X90's host is F-16 Block 70.</p>`)
      : card("What it offers WS-X90", offersOf(p.id).filter((o) => SSP.ctl(o.code)).length, `<p class="v2k-none">Not a provider of WS-X90. Added, the controls it offers are inherited by default and their status becomes its own.</p>`);
    const ifs = (p.ifaces || []).length ? card("Interfaces", p.ifaces.length, p.ifaces.map((f) => line(`<span class="v2h-dot" aria-hidden="true"></span>`, `<b>${esc(f.name)}</b><span class="v2k-sub">${esc(f.data)}</span>`)).join("")) : "";
    const car = carried(p.id);
    const carries = car.length ? card(p.kind === "Host system" ? "Carries" : "Serves", car.length, car.map((x) => line(`<span class="v2h-dot" aria-hidden="true"></span>`, `<b>${esc(x.name)}</b><span class="v2k-sub">${esc(x.at)}</span>`, `<span class="num">${fmt(x.inh)}</span> inherited · <span class="num">${fmt(x.hyb)}</span> hybrid`)).join("")) : "";
    return { label: `${p.kind === "Host system" ? "Host system" : "Provider"} preview`, body: `<div class="a-tests-pan v2h-pan" data-v2r-full="${esc(recRoute(p.id))}">${head}${facts}${take}${ifs}${carries}</div>` };
  };
  // What the bubble names that no other record holds: the flight test instrumentation (inside, IATT) and the test range (outside).
  const EXT = {
    fti: { name: "Flight test instrumentation", kind: "Test only", where: "Inside the IATT's boundary", facts: [["Inside", "Increment 2's test configuration"], ["Records", "Bus traffic, payload telemetry and timing"], ["Leaves the aircraft", "After the test campaign"]], body: "Instrumentation the test aircraft carries for Increment 2's developmental flight test: a bus monitor on the MIL-STD-1553B bus and a telemetry encoder that sends what it records to the test range. It is inside the IATT's boundary and leaves with the test configuration." },
    range: { name: "Test range ground station", kind: "Test only", where: "Outside the IATT's boundary", facts: [["Receives", "Encrypted telemetry over RF"], ["Its own authorization", "The test range's"], ["Agreement", "Test range support agreement"]], body: "The range's ground station receives the flight test instrumentation's telemetry. It is the range's system, covered by the range's own authorization, so it stays outside the bubble." },
  };
  P["v2h-ext"] = (id) => {
    const x = EXT[id] || EXT.fti;
    return { label: "Boundary preview", body: `<div class="a-tests-pan v2h-pan">${AK.recordHead({ title: x.name, chip: AK.chip(x.kind) })}${AK.facts(x.facts.map(([k, v]) => [k, esc(v)]))}${card(x.where, null, `<p class="v2h-p">${esc(x.body)}</p>`)}</div>` };
  };

  // ════════════════ Change responsibility ════════════════
  const ui = () => (V.chain && V.chain.ui) || null;
  const codesOf = (id) => String(id || "").split(",").map((s) => s.trim()).filter((c) => SSP.ctl(c));
  function whatChanges(codes, kind) {
    // The control status each would read, and the satisfied count after the change.
    let sat = counts().sat;
    const lines = codes.map((code) => {
      const r = resp(code), o = ORIG.get(code), now = ctl(code).cs;
      const next = kind === "Inherited" && r.offer ? r.offer.st : o.cs;
      if (now === "satisfied" && next !== "satisfied") sat--; if (now !== "satisfied" && next === "satisfied") sat++;
      return [code, now, next];
    });
    return { sat, lines };
  }
  function respBody(codes, kind) {
    const u = ui(); const one = codes.length === 1, r0 = resp(codes[0]);
    const offered = codes.every((c) => resp(c).offer), anyOffer = codes.some((c) => resp(c).offer);
    const prov = r0.pid ? PROV[r0.pid].name : null;
    const w = whatChanges(codes, kind);
    const nowList = codes.slice(0, 6).map((c) => `<b>${esc(c)}</b> ${esc(ctl(c).t)} · ${esc(respWords(resp(c)))}`).join("<br>") + (codes.length > 6 ? `<br>${mu(`and ${codes.length - 6} more`)}` : "");
    const opts = [
      ["Inherited", one && prov ? `Inherited from ${prov}` : "Inherited", "The provider implements and assesses it; its control status is the provider's.", !offered],
      ["Hybrid", "Hybrid", "The provider does part; WS-X90 owes its own part and its status stays WS-X90's.", !offered],
      ["System-specific", "System-specific", "WS-X90 implements and assesses it: its own requirement, evidence and narrative.", false],
    ];
    const part = u.inp("part", "What WS-X90 does itself", { value: one && r0.offer ? (r0.change && r0.change.part) || r0.offer.own || "" : "" });
    const changeLine = w.lines.filter(([, a, b]) => a !== b);
    return `${u.desc(nowList)}${!anyOffer ? u.desc(`No provider of WS-X90 offers ${one ? esc(codes[0]) : "these controls"}, so ${one ? "it stays" : "they stay"} system-specific.`) : ""}
      ${u.fld("Responsibility", u.radios("kind", opts.map(([v, l, hint, off]) => [v, l, esc(hint), off]), kind), { req: true })}
      <div class="v2h-part"${kind === "Hybrid" ? "" : " hidden"}>${u.F("WS-X90's part", part, { req: true, hint: "One line: what WS-X90 still does for it." })}</div>
      ${u.F("Reason", u.area("reason", "Why the responsibility changes"), { req: true })}
      <div class="v2h-what" role="status">${changeLine.length ? `${changeLine.slice(0, 4).map(([c, a, b]) => `${esc(c)} reads ${esc(STW[b])} (now ${esc(STW[a])})`).join("; ")}${changeLine.length > 4 ? `; and ${changeLine.length - 4} more` : ""}. Controls satisfied: <b class="num">${fmt(w.sat)}</b> of ${fmt(SSP.controls.length)}.` : `No control status changes. Controls satisfied stays <b class="num">${fmt(w.sat)}</b> of ${fmt(SSP.controls.length)}.`}</div>`;
  }
  M["v2h-resp"] = (id) => {
    const codes = codesOf(id), u = ui();
    if (!codes.length || !u) return { title: "Change responsibility", body: `<p class="ak-desc">Choose controls first.</p>`, footer: `<button type="button" class="btn" data-close-modal>Close</button>` };
    const r0 = resp(codes[0]);
    const kind = r0.kind === "System-specific" ? (r0.offer ? r0.offer.kind : "System-specific") : "System-specific";
    return { title: codes.length === 1 ? `Change responsibility of ${codes[0]}` : `Change responsibility of ${plural(codes.length, "control")}`, body: `<div class="v2h-resp" data-codes="${esc(codes.join(","))}">${respBody(codes, kind)}</div>`, footer: u.foot("Change responsibility", "v2h-resp", codes.join(",")) };
  };
  // The dialog follows the choice: the part field shows for Hybrid, and what changes is counted again.
  document.addEventListener("change", (e) => {
    const t = e.target; if (!t || !t.closest) return;
    const box = t.closest(".v2h-resp"); if (!box || t.name !== "kind") return;
    const codes = box.dataset.codes.split(","), kind = t.value;
    const part = box.querySelector(".v2h-part"); if (part) part.hidden = kind !== "Hybrid";
    const w = whatChanges(codes, kind), ch = w.lines.filter(([, a, b]) => a !== b);
    const what = box.querySelector(".v2h-what");
    if (what) what.innerHTML = ch.length ? `${ch.slice(0, 4).map(([c, a, b]) => `${esc(c)} reads ${esc(STW[b])} (now ${esc(STW[a])})`).join("; ")}${ch.length > 4 ? `; and ${ch.length - 4} more` : ""}. Controls satisfied: <b class="num">${fmt(w.sat)}</b> of ${fmt(SSP.controls.length)}.` : `No control status changes. Controls satisfied stays <b class="num">${fmt(w.sat)}</b> of ${fmt(SSP.controls.length)}.`;
  });
  function registerActions() {
    const A = V.chain && V.chain.ACTIONS; if (!A || A["v2h-resp"]) return;
    A["v2h-resp"] = (id, o) => {
      const codes = codesOf(id); if (!codes.length) return "Choose a control first.";
      const kind = o.kind || "";
      if (!kind) return "Responsibility is required.";
      if (kind !== "System-specific" && codes.some((c) => !resp(c).offer)) return `Responsibility: no provider of WS-X90 offers ${codes.filter((c) => !resp(c).offer).slice(0, 3).join(", ")}.`;
      if (kind === "Hybrid" && !o.part) return "WS-X90's part is required.";
      if (!o.reason) return "Reason is required.";
      const before = counts().sat;
      for (const c of codes) { const r = resp(c); if (r.def === kind && !(kind === "Hybrid" && o.part && o.part !== (r.offer || {}).own)) V.set("host.resp." + c, null); else V.set("host.resp." + c, { kind, part: kind === "Hybrid" ? o.part : null, reason: o.reason, by: ME, at: "2026-11-17" }); }
      SEL.clear();
      const after = counts().sat, one = codes.length === 1;
      const what = kind === "System-specific" ? "system-specific" : kind === "Inherited" ? `inherited from ${PROV[resp(codes[0]).pid].name}` : "hybrid";
      return [`${one ? codes[0] + " is" : plural(codes.length, "control") + " are"} now ${what}${after !== before ? `: ${fmt(after)} of ${fmt(SSP.controls.length)} controls satisfied` : ""}`, { label: "Open Host & providers", route: "hosts" }];
    };
    A["v2h-add"] = (id, o) => {
      const pid = o.prov || id; const p = PROV[pid];
      if (!p) return "Provider is required.";
      if (provIds(WSX).includes(pid)) return `Provider: ${p.name} is already one of WS-X90's.`;
      const before = counts();
      V.set("host.added", [...added(), pid]);
      const t = takes(pid), after = counts();
      return [`${p.name} added: ${plural(t.inh, "control")} inherited${t.hyb ? `, ${fmt(t.hyb)} hybrid` : ""}${after.sat !== before.sat ? `; ${fmt(after.sat)} of ${fmt(after.total)} controls satisfied` : ""}`, { label: "Open Host & providers", route: "hosts" }];
    };
  }
  registerActions();
  // Add provider: the workspace's providers WS-X90 doesn't take from yet, each with what it offers.
  function addSummary(pid) {
    const p = PROV[pid]; if (!p) return "";
    const of = offersOf(pid).filter((o) => SSP.ctl(o.code)), ix = index();
    const free = of.filter((o) => !ix.has(o.code)), held = of.filter((o) => ix.has(o.code));
    const sat = free.filter((o) => ctl(o.code).cs !== "satisfied").length;
    return `<div class="v2h-addsum"><b>${esc(p.name)}</b> offers ${plural(of.length, "control")} of WS-X90's baseline${(p.caps || []).length ? `: ${esc(p.caps.map((c) => c[1].charAt(0).toLowerCase() + c[1].slice(1)).join("; "))}` : ""}.
      ${free.length ? `${plural(free.length, "control")} become inherited by default (${esc(free.map((o) => o.code).join(", "))}), and their status becomes ${esc(p.name)}'s${sat ? `: ${plural(sat, "control")} now short of satisfied read Satisfied` : ""}.` : "Every control it offers already comes from another provider."}
      ${held.length ? ` ${plural(held.length, "control")} stay with the provider that holds them now (${esc(held.map((o) => `${o.code} · ${PROV[ix.get(o.code).pid].name}`).join(", "))}).` : ""}
      Its authorization: ${esc(authLine(p))}${p.auth.atd ? `, expires ${esc(mdy(p.auth.atd))}` : ""}.</div>`;
  }
  M["v2h-add"] = (id) => {
    const u = ui(); const avail = Object.values(PROV).filter((p) => !provIds(WSX).includes(p.id) && p.kind !== "Host system");
    const hostTaken = Object.values(PROV).filter((p) => p.kind === "Host system" && !provIds(WSX).includes(p.id));
    if (!u) return { title: "Add provider", body: "", footer: "" };
    if (!avail.length) return { title: "Add provider", body: `<p class="ak-desc">WS-X90 takes from every provider in the workspace.</p>`, footer: `<button type="button" class="btn" data-close-modal>Close</button>` };
    const pick = avail.some((p) => p.id === id) ? id : avail[0].id;
    const opts = [...avail.map((p) => [p.id, p.name, esc(`${p.kind} · offers ${plural(offersOf(p.id).filter((o) => SSP.ctl(o.code)).length, "control")} of WS-X90's baseline · ${authWord(p)}`), false]),
      ...hostTaken.map((p) => [p.id, p.name, esc(`Host system of ${Object.keys(p.carries || {}).map((c) => PROGNAME[c] || c).join(", ")}: WS-X90's host is F-16 Block 70`), true])];
    return { title: "Add provider", body: `<div class="v2h-add">${u.desc("A provider WS-X90 inherits from: its controls are inherited by default, and each can be changed later.")}${u.fld("Provider", u.radios("prov", opts, pick), { req: true })}<div class="v2h-addbox" role="status">${addSummary(pick)}</div></div>`, footer: u.foot("Add provider", "v2h-add", pick) };
  };
  document.addEventListener("change", (e) => {
    const t = e.target; if (!t || !t.closest || t.name !== "prov") return;
    const box = t.closest(".v2h-add"); if (!box) return;
    const sum = box.querySelector(".v2h-addbox"); if (sum) sum.innerHTML = addSummary(t.value);
    const b = document.querySelector('#modal [data-v2k="v2h-add"]'); if (b) b.dataset.id = t.value;
  });

  // ════════════════ Boundary: the bubble ════════════════
  const SUBS = ["CN-109001", "CN-109002", "CN-109003", "CN-109004", "CN-109005", "CN-109006"];
  const AIR = SUBS.slice(0, 5);
  const kidsOf = (code) => (PA.v7p && PA.v7p.EBY ? Object.values(PA.v7p.EBY).filter((x) => x.parent === code) : []);
  const COMP = () => (PA.v7p && PA.v7p.COMP) || {};
  const changedIn11 = () => Object.keys(COMP()).filter((c) => { const p = COMP()[c][4]; return !!(p && p[1] && p[0][0] !== p[1][0]); });
  const ICS = () => PA.v8bIC || [];
  const subOf = (el) => { const e = PA.v7p && PA.v7p.EBY && PA.v7p.EBY[el]; return e && e.type === "subsystem" ? el : e ? e.parent : null; };
  const AUTH = () => {
    const ato = PA.v2life && PA.v2life.step ? PA.v2life.step("ato-1") : null;
    const iatt = PA.v2life && PA.v2life.step ? PA.v2life.step("iatt-2") : null;
    const done = (s) => s && /done|complete|signed|granted|approved|met|passed/i.test(String(s.status || ""));
    return {
      ato: { key: "ato", short: "ATO", name: "ATO · Increment 1 · Block 1", what: "Increment 1 · Block 1, the six subsystems as fielded", date: "Authorized with conditions Sep 18, 2026 · ATD Sep 17, 2029", cover: "ATO · Sep 18, 2026", route: "authorization", gate: ato && ato.href ? String(ato.href).replace(/^#/, "") : null },
      iatt: { key: "iatt", short: "IATT", name: "IATT · Increment 2 test configuration", what: "Increment 2's test configuration: Block 1.1 and the flight test instrumentation", date: iatt && iatt.due ? `${done(iatt) ? "Signed" : "Planned"} ${mdy(String(iatt.due).slice(0, 10))}` : "Increment 2, planned", cover: iatt && iatt.due ? `IATT · ${done(iatt) ? "" : "planned "}${mdy(String(iatt.due).slice(0, 10))}` : "IATT · Increment 2, planned", route: iatt && iatt.href ? String(iatt.href).replace(/^#/, "") : "lifecycle" },
    };
  };
  // The ATO is the Boundary page's own address, the IATT its second (boundary-iatt), so each opens and links as itself.
  const authKey = () => (V.cur() === "boundary-iatt" ? "iatt" : "ato");
  const IFACE_SHORT = { "1553": "MIL-STD-1553B", "1760": "MIL-STD-1760", pwr: "Aircraft power", rf: "Antennas", fac: "Power and space", ids: "Identity services" };
  function boundaryModel(key) {
    const prog = curProg(), madeP = prog !== WSX ? madeOne(prog) : null;
    const iatt = key === "iatt";
    const host = madeP ? (madeP.host ? PROV[madeP.host] : null) : PROV.f16;
    const rows = [];
    const ch = changedIn11();
    if (madeP) {
      // A program created here: its systems inside, its host outside, nothing else recorded yet.
      const sys = (madeP.systems && madeP.systems.length ? madeP.systems : [{ code: madeP.code, name: madeP.name }]);
      sys.forEach((s) => rows.push({ id: s.code, name: s.name || s.code, kids: null, air: true, panel: null, l: host ? (host.ifaces || []).map((f) => IFACE_SHORT[f.id] && host.id === "f16" ? IFACE_SHORT[f.id] : f.name) : [], r: [] }));
      return { rows, host, fac: null, idp: null, made: madeP, iatt: false };
    }
    for (const code of SUBS) {
      const kids = kidsOf(code), nch = kids.filter((k) => ch.includes(k.code)).length;
      const l = code === "CN-109006" ? [IFACE_SHORT.fac] : PROV.f16.ifaces.filter((f) => f.to.includes(code)).map((f) => IFACE_SHORT[f.id]);
      const r = ICS().filter((x) => subOf(x.els[0]) === code).map((x) => ({ id: x.id, name: x.to.replace(/ \(PRG-\d+\)$/, ""), type: x.type, out: iatt && x.id === "IC-105" }));
      rows.push({ id: code, name: elName(code), kids: kids.length, nch: iatt ? nch : 0, air: code !== "CN-109006", panel: "v7p-el", l, r });
      if (iatt && code === "CN-109005") rows.push({ id: "fti", name: "Flight test instrumentation", kids: null, test: true, air: true, panel: "v2h-ext", l: ["MIL-STD-1553B", "Aircraft power"], r: [{ id: "range", name: "Test range ground station", type: "RF telemetry", ext: true }] });
    }
    return { rows, host, fac: PROV.sqops, idp: PROV.idp, iatt };
  }
  function bubble(key) {
    const A = AUTH()[key], m = boundaryModel(key), n = m.rows.length;
    const air = m.rows.filter((r) => r.air).length;
    const provBlock = (p, rowStart, span, mRow, ifs) => `<div class="v2h-ext v2h-lb" role="button" tabindex="0" data-panel="v2h-prov" data-id="${p.id}" style="--r:${rowStart} / span ${span};--mr:${mRow}"><span class="v2h-k">${esc(p.kind)}</span><b>${esc(p.name)}</b><span class="v2h-s">${esc(authLine(p))}</span><span class="v2h-ifm">${esc(ifs.join(" · "))}</span></div>`;
    // Rows: 1 the caption and the column heads; 2… the elements inside. Phone: providers, caption, elements, then what connects.
    const lead = (m.host ? 1 : 0) + (m.fac ? 1 : 0);
    const out = [];
    out.push(`<div class="v2h-ch v2h-chl" style="--r:1;--mr:1">Host and providers</div>`);
    if (m.rows.some((r) => r.r.length)) out.push(`<div class="v2h-ch v2h-chr" style="--r:1;--mr:${lead + n + 3}">Interconnections</div>`);
    if (m.host) out.push(provBlock(m.host, 2, Math.max(1, air), 2, (m.host.ifaces || []).map((f) => IFACE_SHORT[f.id] || f.name)));
    if (m.fac) out.push(provBlock(m.fac, 2 + air, n - air || 1, 2 + (m.host ? 1 : 0), ["Power and space"]));
    if (!m.host && !m.fac) out.push(`<div class="v2h-ext v2h-none" style="--r:2 / span ${n};--mr:2">${m.made ? "No host system" : "No provider"}</div>`);
    const capRow = lead + 2;
    out.push(`<div class="v2h-bub" aria-hidden="true" style="--r:1 / span ${n + 1};--mr:${capRow} / span ${n + 1}"></div>`);
    out.push(`<div class="v2h-cap" style="--r:1;--mr:${capRow}"><span class="v2h-k">Authorization boundary</span><b>${esc(m.made ? m.made.name : A.name)}</b><span class="v2h-s">${esc(m.made ? "Not authorized yet" : A.date)}</span>${m.made ? "" : `<span class="ak-link" role="link" tabindex="0" data-go="${esc(A.route)}">${key === "ato" ? "Open authorization" : "Open in Lifecycle"}</span>`}</div>`);
    m.rows.forEach((r, i) => {
      const row = i + 2, mrow = capRow + 1 + i;
      out.push(`<div class="v2h-lc" style="--r:${row}" aria-hidden="true">${r.l.map((t) => `<span>${esc(t)}</span>`).join("")}</div>`);
      const meta = r.test ? "Test only" : r.kids != null ? `${plural(r.kids, "element")}${r.nch ? ` · ${fmt(r.nch)} change in Block 1.1` : ""}` : "System";
      out.push(`<div class="v2h-el${r.test ? " test" : ""}"${r.panel ? ` role="button" tabindex="0" data-panel="${r.panel}" data-id="${esc(r.id)}"` : ""} style="--r:${row};--mr:${mrow}"><b>${esc(r.name)}</b><span class="v2h-s">${esc(meta)}</span></div>`);
      out.push(`<div class="v2h-rc" style="--r:${row}" aria-hidden="true">${r.r.map((x) => `<span${x.out ? ' class="off"' : ""}>${esc(x.type)}</span>`).join("")}</div>`);
      const items = r.r.map((x) => `<div class="v2h-ic${x.out ? " off" : ""}" role="button" tabindex="0" data-panel="${x.ext ? "v2h-ext" : "v8b-ic"}" data-id="${esc(x.id)}"><b>${esc(x.name)}</b><span class="v2h-s">${esc(x.out ? `${x.type} · not in the test configuration` : x.ext ? `${x.type} · test only` : x.type)}</span></div>`).join("");
      out.push(`<div class="v2h-rb" style="--r:${row};--mr:${capRow + n + 2 + i}">${items}</div>`);
    });
    return `<div class="v2h-bd" data-auth="${key}" role="group" aria-label="${esc(m.made ? "Authorization boundary" : A.name)}: inside, ${esc(m.rows.map((r) => r.name).join(", "))}">${out.join("")}</div>`;
  }
  function coverRows(key) {
    const A = AUTH()[key], m = boundaryModel(key), rows = [];
    for (const r of m.rows) rows.push({ panel: r.panel, id: r.id, cells: [`${esc(r.name)}`, r.test ? "Inside · test only" : "Inside", esc(m.made ? "Not authorized yet" : A.cover), m.made ? "Its own" : "WS-X90's own"] });
    for (const p of [m.host, m.fac, m.idp].filter(Boolean)) {
      const t = m.made ? m.made.hostTake || defaults(p.id, null) : takes(p.id);
      const inh = m.made ? t.inherited : t.inh, hyb = m.made ? t.hybrid : t.hyb;
      rows.push({ panel: "v2h-prov", id: p.id, cells: [esc(p.name), p.kind === "Host system" ? "Outside · host system" : "Outside · provider", esc(p.auth.on ? `Its own ${p.auth.word === "Authorized" ? "ATO" : p.auth.word.toLowerCase()} · ${mdy(p.auth.on)}` : p.auth.word), `${inh ? `${fmt(inh)} inherited` : ""}${inh && hyb ? " · " : ""}${hyb ? `${fmt(hyb)} hybrid` : ""}${!inh && !hyb ? "None taken" : ""}`] });
    }
    if (!m.made) for (const x of ICS()) {
      if (x.id === "IC-109") continue; // the identity provider's row above
      const off = key === "iatt" && x.id === "IC-105";
      rows.push({ panel: "v8b-ic", id: x.id, cells: [esc(x.to.replace(/ \(PRG-\d+\)$/, "")), off ? "Outside · not in the test configuration" : "Outside · interconnection", esc(x.agr.kind ? `${x.agr.kind} · ${x.agr.st}` : x.agr.st), `The connected system's · ${esc(x.org)}`] });
    }
    if (key === "iatt" && !m.made) rows.push({ panel: "v2h-ext", id: "range", cells: ["Test range ground station", "Outside · test only", "The test range's own", "The test range's"] });
    return rows;
  }
  const tblHtml = (cols, rows, opt = {}) => `<div class="frame${opt.cls ? " " + opt.cls : ""}"><div class="tablebox"><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr${r.panel ? ` tabindex="0" data-panel="${esc(r.panel)}" data-id="${esc(r.id)}"` : r.go ? ` tabindex="0" data-go="${esc(r.go)}"` : ""}${r.cls ? ` class="${r.cls}"` : ""}>${r.cells.map((c, i) => `<td${i === (opt.nm == null ? 0 : opt.nm) ? ' class="nm"' : ""}>${c}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cols.length}">${mu(esc(opt.empty || "Nothing matches."))}</td></tr>`}</tbody></table></div>${opt.pager || ""}</div>`;
  function boundaryPage() {
    const prog = curProg(), madeP = prog !== WSX ? madeOne(prog) : null;
    const key = madeP ? "ato" : authKey(), A = AUTH();
    const seg = madeP ? "" : `<div class="v2h-seg" role="group" aria-label="Authorization">${["ato", "iatt"].map((k) => `<button type="button" class="v2h-segb${k === key ? " on" : ""}" aria-pressed="${k === key}" data-v2h-auth="${k}">${esc(A[k].short)}</button>`).join("")}</div>`;
    const rows = coverRows(key);
    return h.page(
      AK.indexHead({ title: "Boundary", desc: madeP ? esc(`${madeP.name} · ${madeP.host ? `carried by ${PROV[madeP.host].name}` : "no host system"}`) : esc(A[key].what), actions: seg }),
      bubble(key),
      AK.section("What it covers", tblHtml(["Element or system", "Inside or outside", "Covered by", "Responsibility"], rows, { cls: "v2h-cov" }), { count: rows.length }),
      note(madeP ? "Created in this session: the boundary holds its systems and its host until the ITCSC and the system tree are filled in." : "F-16 Block 70, the Squadron operations facility, their authorizations, the IATT's test configuration and the test range are synthetic; the subsystems and the interconnections are WS-X90's."),
    );
  }
  V.screen("boundary", boundaryPage, "boundary");
  V.screen("boundary-iatt", boundaryPage, "boundary");
  document.addEventListener("click", (e) => {
    const b = e.target && e.target.closest ? e.target.closest("[data-v2h-auth]") : null; if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const to = b.dataset.v2hAuth === "iatt" ? "boundary-iatt" : "boundary";
    if (V.cur() !== to) { location.hash = to; setTimeout(() => { const again = document.querySelector(`[data-v2h-auth="${b.dataset.v2hAuth}"]`); if (again) again.focus(); }, 60); }
  }, true);

  // ════════════════ Host & providers ════════════════
  const SEL = new Set();
  let PAGE = 0;
  const Q = () => V.get("host.q", null) || { qv: "all", prov: "", fam: "" };
  const setQ = (patch) => { V.set("host.q", Object.assign({}, Q(), patch)); PAGE = 0; };
  const QV = { all: () => true, inh: (r) => r.kind === "Inherited", hyb: (r) => r.kind === "Hybrid", back: (r) => r.back };
  function offeredRows() { const ix = index(); return [...ix.values()].map((o) => resp(o.code)); }
  const famOrder = (SSP.families || []).map((f) => f.f);
  const byCode = (a, b) => famOrder.indexOf(fam(a.code)) - famOrder.indexOf(fam(b.code)) || a.code.localeCompare(b.code, "en", { numeric: true });
  // The table leads with the host's controls, then each provider's in the order WS-X90 takes from them.
  const byProv = (a, b) => provIds(WSX).indexOf(a.pid) - provIds(WSX).indexOf(b.pid) || byCode(a, b);
  const menu = (label, items, cur) => `<details class="v2h-flt"><summary class="flt">${esc(label)}${cur ? `: ${esc(cur)}` : ""} ⌄</summary><div class="v2h-menu" role="menu">${items.map(([v, l, on]) => `<span role="menuitemradio" tabindex="0" aria-checked="${on ? "true" : "false"}" class="v2h-mi${on ? " on" : ""}" data-v2h-f="${esc(v)}">${esc(l)}</span>`).join("")}</div></details>`;
  const cb = (id, on, label) => `<span class="a-tests-cb v2h-cb" role="checkbox" tabindex="0" aria-checked="${on}" aria-label="${esc(label)}" data-v2h-sel="${esc(id)}">${AK.check(on === true)}</span>`;
  function hostsPage() {
    const prog = curProg(), madeP = prog !== WSX ? madeOne(prog) : null;
    if (madeP) return madeHosts(madeP);
    const q = Q(), ids = provIds(WSX);
    const provRows = ids.map((id) => { const p = PROV[id], t = takes(id); return { panel: "v2h-prov", id, cells: [`${esc(p.name)}`, esc(p.kind), num(t.offered), num(t.inh), num(t.hyb), num(t.back), esc(authWord(p)), expCell(p)] }; });
    const rows0 = offeredRows();
    const f = (r) => (QV[q.qv] || QV.all)(r) && (!q.prov || r.pid === q.prov) && (!q.fam || fam(r.code) === q.fam);
    const rows = rows0.filter(f).sort(byProv);
    const pages = Math.max(1, Math.ceil(rows.length / 25)); if (PAGE >= pages) PAGE = pages - 1;
    const shown = rows.slice(PAGE * 25, PAGE * 25 + 25);
    const chosen = [...SEL].filter((c) => rows0.some((r) => r.code === c));
    const allOn = shown.length && shown.every((r) => SEL.has(r.code));
    const fams = [...new Set(rows0.map((r) => fam(r.code)))].sort((a, b) => famOrder.indexOf(a) - famOrder.indexOf(b));
    const views = `<div class="views" role="group" aria-label="Quick views">${[["all", "All", rows0.length], ["inh", "Inherited", rows0.filter(QV.inh).length], ["hyb", "Hybrid", rows0.filter(QV.hyb).length], ["back", "Taken back", rows0.filter(QV.back).length]].map(([k, l, n]) => `<span class="qv${k === q.qv ? " on" : ""}" role="button" tabindex="0" aria-pressed="${k === q.qv}" data-v2h-qv="${k}">${esc(l)} <span class="num">${fmt(n)}</span></span>`).join("")}</div>`;
    const tools = chosen.length
      ? `<div class="tools v2h-bulk" role="toolbar" aria-label="Chosen controls"><span><b class="num">${fmt(chosen.length)}</b> chosen</span>${btn("Change responsibility", `data-modal="v2h-resp" data-id="${esc(chosen.join(","))}"`)}<span class="ak-link" role="button" tabindex="0" data-v2h-desel="1">Deselect</span></div>`
      : `<div class="tools v2h-tools"><span class="in">Search controls</span>${menu("Provider", [["prov:", "All providers", !q.prov], ...ids.map((id) => [`prov:${id}`, PROV[id].name, q.prov === id])], q.prov ? PROV[q.prov].name : "")}${menu("Family", [["fam:", "All families", !q.fam], ...fams.map((x) => [`fam:${x}`, `${x} · ${((SSP.families || []).find((y) => y.f === x) || {}).t || x}`, q.fam === x])], q.fam || "")}</div>`;
    const pager = `<div class="pager"><span class="num">${rows.length ? `${PAGE * 25 + 1}–${PAGE * 25 + shown.length} of ${fmt(rows.length)}` : "0 of 0"}</span><span class="v2h-pg"><button type="button" class="ib" aria-label="Previous page" data-v2h-page="-1"${PAGE ? "" : " disabled"}>‹</button><button type="button" class="ib" aria-label="Next page" data-v2h-page="1"${PAGE < pages - 1 ? "" : " disabled"}>›</button></span></div>`;
    const table = tblHtml([cb("*", allOn ? true : shown.some((r) => SEL.has(r.code)) ? "mixed" : false, "Choose every control shown"), "Control", "Provider", "Responsibility", "Provider's status", "WS-X90's part", '<span class="v2-sr">Row actions</span>'],
      shown.map((r) => { const c = ctl(r.code); return { panel: "a-tests-control", id: r.code, cls: SEL.has(r.code) ? "sel" : "", cells: [cb(r.code, SEL.has(r.code), `Choose ${r.code}`), `${esc(r.code)} ${esc(c.t)}`, esc(PROV[r.pid].name), r.change && r.change.reason ? `<span title="${esc(`Changed by ${r.change.by || ME}: ${r.change.reason}`)}">${esc(r.back ? "System-specific" : r.kind)} ${mu("· changed")}</span>` : esc(r.back ? "System-specific" : r.kind), stPill(r.offer.st), r.kind === "Hybrid" ? `<span class="v2h-tr" title="${esc(r.own)}">${esc(r.own.replace(/^WS-X90's duty: /, ""))}</span>` : DASH,
        `<details class="a-tests-more v2h-rowmore"><summary class="btn sm" aria-label="More actions for ${esc(r.code)}" title="More actions for ${esc(r.code)}">${AK.i("dots")}</summary><div class="a-tests-menu" role="menu"><span role="menuitem" tabindex="0" class="a-tests-mi" data-modal="v2h-resp" data-id="${esc(r.code)}">Change responsibility</span><span role="menuitem" tabindex="0" class="a-tests-mi" data-go="${esc(V.chain ? V.chain.ctlRoute(r.code) : "controls")}">Open control</span></div></details>`] }; }),
      { nm: 1, pager, cls: "v2h-inh v2-keepcols", empty: "No control matches." });
    const c = counts();
    return h.page(
      AK.indexHead({ title: "Host & providers", desc: `Carried by ${esc(PROV.f16.name)} · ${fmt(c.inh)} controls inherited, ${fmt(c.hyb)} hybrid, ${fmt(c.own)} system-specific`, actions: btn("Add provider", 'data-modal="v2h-add"', true, false) }),
      AK.section("Providers", tblHtml(["Provider", "Kind", "Offered", "Inherited", "Hybrid", "Taken back", "Authorization", "Expires"], provRows, { cls: "v2h-provs" }), { count: provRows.length }),
      AK.section("Controls from providers", `${views}${tools}${table}`, { count: rows0.length }),
      note("The F-16 Block 70's and the Squadron operations facility's offers, statements and authorizations are synthetic; the Corporate identity provider's offer and WS-X90's acceptance are real, and with no authorization of its own every control it offers is hybrid."),
    );
  }
  function madeHosts(m) {
    const pid = m.host && PROV[m.host] ? m.host : null;
    if (!pid) return h.page(AK.indexHead({ title: "Host & providers", desc: esc(m.name) }), AK.empty({ title: "No host system", line: "This program was created with no host system, so every control of its baseline is its own. Add a provider when one offers controls." }));
    const p = PROV[pid], d = m.hostTake || defaults(pid, null);
    const rows = offersOf(pid).map((o) => ({ panel: "a-tests-control", id: o.code, cells: [`${esc(o.code)} ${esc(ctl(o.code).t)}`, esc(p.name), esc(o.kind), stPill(o.st), o.kind === "Hybrid" ? esc(o.own || "") : DASH] }));
    return h.page(
      AK.indexHead({ title: "Host & providers", desc: `${esc(m.name)} · carried by ${esc(p.name)}` }),
      AK.section("Providers", tblHtml(["Provider", "Kind", "Offered", "Inherited", "Hybrid", "Authorization", "Expires"], [{ panel: "v2h-prov", id: pid, cells: [esc(p.name), esc(p.kind), num(d.offered), num(d.inherited), num(d.hybrid), esc(authWord(p)), expCell(p)] }]), { count: 1 }),
      AK.section("Controls from providers", tblHtml(["Control", "Provider", "Responsibility", "Provider's status", "Its part"], rows), { count: rows.length }),
      note("Chosen when the program was created: the host's offered controls are inherited by default."),
    );
  }
  V.screen("hosts", hostsPage, "hosts");
  const redrawFocus = (sel) => { V.redraw(); if (sel) { const el = document.querySelector(sel); if (el) el.focus(); } };
  document.addEventListener("click", (e) => {
    const t = e.target; if (!t || !t.closest) return;
    const qv = t.closest("[data-v2h-qv]");
    if (qv) { e.preventDefault(); e.stopPropagation(); setQ({ qv: qv.dataset.v2hQv }); redrawFocus(`[data-v2h-qv="${qv.dataset.v2hQv}"]`); return; }
    const fi = t.closest("[data-v2h-f]");
    if (fi) { e.preventDefault(); e.stopPropagation(); const [k, v] = fi.dataset.v2hF.split(":"); setQ({ [k]: v }); redrawFocus(".v2h-tools .v2h-flt summary"); return; }
    const sb = t.closest("[data-v2h-sel]");
    if (sb) {
      e.preventDefault(); e.stopPropagation();
      const id = sb.dataset.v2hSel;
      if (id === "*") { const shown = [...document.querySelectorAll("#main [data-v2h-sel]")].map((x) => x.dataset.v2hSel).filter((x) => x !== "*"); const on = shown.every((x) => SEL.has(x)); shown.forEach((x) => (on ? SEL.delete(x) : SEL.add(x))); }
      else if (SEL.has(id)) SEL.delete(id); else SEL.add(id);
      redrawFocus(`[data-v2h-sel="${CSS.escape(id)}"]`); return;
    }
    if (t.closest("[data-v2h-desel]")) { e.preventDefault(); e.stopPropagation(); SEL.clear(); redrawFocus('[data-v2h-sel="*"]'); return; }
    const pg = t.closest("[data-v2h-page]");
    if (pg) { e.preventDefault(); e.stopPropagation(); PAGE = Math.max(0, PAGE + Number(pg.dataset.v2hPage)); redrawFocus(`[data-v2h-page="${pg.dataset.v2hPage}"]`); return; }
    const sh = t.closest("[data-v2h-show]");
    if (sh) {
      e.preventDefault(); e.stopPropagation();
      const pid = sh.dataset.v2hShow;
      V.set("host.q", { qv: "all", prov: pid, fam: "" }); PAGE = 0;
      const panel = document.getElementById("panel"); if (panel && !panel.hidden) { const x = panel.querySelector("#closePanel"); if (x) x.click(); }
      V.go("hosts", { focus: ".v2h-inh" });
    }
  }, true);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = e.target; if (!t || !t.matches) return;
    if (t.matches("[data-v2h-qv], [data-v2h-f], [data-v2h-sel], [data-v2h-desel], [data-v2h-show], .v2h-pl, .v2h-hostf, .v2h-el[data-panel], .v2h-ext[data-panel], .v2h-ic[data-panel]")) { e.preventDefault(); t.click(); }
  }, true);
  window.addEventListener("hashchange", () => { if (V.cur() !== "hosts") SEL.clear(); });

  // ════════════════ A provider's page ════════════════
  const PTABS = [["offers", "Offered controls"], ["carries", "Carries"], ["ifaces", "Interfaces"], ["auth", "Authorization"]];
  function provPage(id, tab) {
    const p = PROV[id]; if (!p) return h.page(AK.recordHead({ crumbs: [["Host & providers", "hosts"], ["Not found"]], title: "This provider is not in the prototype" }));
    tab = tab || "offers";
    const mine = provIds(WSX).includes(id), t = mine ? takes(id) : null, car = carried(id);
    const of = offersOf(id);
    const head = AK.recordHead({ crumbs: [["Host & providers", "hosts"], [p.name]], title: p.name, chip: pill("none", authWord(p)),
      actions: mine ? btn("Show in Host & providers", `data-v2h-show="${id}"`) : p.kind === "Host system" ? "" : btn("Add provider", `data-modal="v2h-add" data-id="${id}"`, true) });
    const tabs = AK.tabs(PTABS.map(([k, l]) => [k === "carries" && p.kind !== "Host system" ? "Serves" : l, k === "offers" ? of.length : k === "carries" ? car.length : k === "ifaces" ? (p.ifaces || []).length : null, recRoute(id, k === "offers" ? "" : k), k === tab]), "Provider sections");
    const rail = AK.railCard(`${p.kind === "Host system" ? "Host system" : "Provider"} details`, [["Kind", esc(p.kind)], ["Owner", esc(p.owner)], ["Authorizing official", p.ao ? esc(p.ao) : DASH], ["Authorized", p.auth.on ? `<span class="num">${mdy(p.auth.on)}</span>` : esc(p.auth.word)], ["Expires", expCell(p)], ["Record", esc(p.auth.ref || "—")]]);
    let body;
    if (tab === "carries") {
      body = car.length ? tblHtml(["Program", p.kind === "Host system" ? "Carried as" : "Serves", "Inherited", "Hybrid"], car.map((x) => ({ go: x.prog === WSX ? "hosts" : x.made ? "program-start" : "portfolio", cells: [esc(x.name), esc(x.at), num(x.inh), num(x.hyb)] }))) : AK.empty({ title: "No program takes from it yet", line: "A program that adds it inherits the controls it offers." });
    } else if (tab === "ifaces") {
      body = (p.ifaces || []).length ? tblHtml(["Interface", "Crosses to", "Carries"], p.ifaces.map((f) => ({ cells: [esc(f.name), f.to.length ? esc(f.to.map(elName).join(", ")) : DASH, esc(f.data)] }))) : AK.empty({ title: "No interface recorded", line: "It offers controls without a connection that crosses the boundary." });
    } else if (tab === "auth") {
      const poams = of.filter((o) => o.poam);
      body = `<div class="ak-card v2h-authc"><dl class="ak-kv"><dt>Decision</dt><dd>${esc(p.auth.word)}${p.auth.on ? ` · <span class="num">${mdy(p.auth.on)}</span>` : ""}</dd><dt>Expires</dt><dd>${expCell(p)}</dd><dt>Decided by</dt><dd>${p.ao ? esc(p.ao) : DASH}${p.auth.by ? ` ${mu(`· ${esc(p.auth.by)}`)}` : ""}</dd>${p.auth.note ? `<dt>Note</dt><dd>${esc(p.auth.note)}</dd>` : ""}</dl></div>
        ${AK.section("Its POA&M items behind what it offers", poams.length ? tblHtml(["Item", "Control", "Due"], poams.map((o) => ({ panel: "a-tests-control", id: o.code, cells: [esc(o.poam.title), esc(o.code), `<span class="num">${mdy(o.poam.due)}</span>`] }))) : `<p class="v2h-p">${mu("None: every control it offers is satisfied in its own authorization.")}</p>`, { count: poams.length })}`;
    } else {
      const rows = of.slice().sort(byCode).map((o) => {
        const inBase = !!SSP.ctl(o.code), r = mine && inBase ? resp(o.code) : null, holder = r && r.pid !== id ? r.pid : null;
        const w = !inBase ? "Not in WS-X90's baseline" : !mine ? "Not taken" : holder ? `From ${PROV[holder].name}` : r.back ? "Taken back" : r.kind;
        return { panel: inBase ? "a-tests-control" : null, id: o.code, cells: [`${esc(o.code)} ${esc(ctl(o.code).t)}`, esc(o.kind), esc(w), stPill(o.st), `<span class="v2h-tr" title="${esc(o.prov)}">${esc(o.prov)}</span>`] };
      });
      body = tblHtml(["Control", "Offered as", "WS-X90", "Its status", "What it implements"], rows, { cls: "v2h-crm" });
    }
    return h.page(head.replace(/<\/div>\s*$/, `${tabs}</div>`), AK.withRail(body, rail) + note(p.real ? "The Corporate identity provider's offer and its acceptance are real; its authorization dates are not recorded." : "Synthetic: the snapshot records no host system or provider for WS-X90 beyond the Corporate identity provider."));
  }
  const ensureProv = () => {
    const r = V.cur(); const m = /^rec--v2h-prov--([a-z0-9]+)(?:\|(\w+))?$/.exec(r);
    if (m && !S[r]) V.screen(r, () => provPage(m[1], m[2]), "hosts");
  };
  Object.keys(PROV).forEach((id) => { V.screen(recRoute(id), () => provPage(id), "hosts"); PTABS.slice(1).forEach(([k]) => V.screen(recRoute(id, k), () => provPage(id, k), "hosts")); });
  window.addEventListener("hashchange", ensureProv); ensureProv();

  // ════════════════ Responsibility on a control's preview and page ════════════════
  const respFact = (code) => {
    const r = resp(code);
    if (r.kind === "System-specific") return `System-specific${r.back ? ` ${mu(`· taken back from ${esc(PROV[r.pid].name)}`)}` : ""}`;
    return `${r.kind === "Inherited" ? "Inherited from" : "Hybrid with"}\u00a0${provBtn(r.pid)}`;
  };
  const provCard = (code, page) => {
    const r = resp(code);
    // Taken back: the change is recorded with its reason, and the provider's offer still stands beside it.
    if (r.back) { const p = PROV[r.pid], c = r.change || {}; return card(`Taken back from ${p.name}`, null, `<p class="v2h-p">${c.reason ? esc(c.reason) : "WS-X90 implements and assesses it itself."}</p><p class="v2h-p">${mu(`${c.by ? `${esc(c.by)} · ` : ""}${c.at ? esc(mdy(c.at)) : ""}${c.by || c.at ? " · " : ""}${esc(p.name)} still offers it: ${esc(r.offer.prov)}`)}</p>`, lnk("Change", `data-modal="v2h-resp" data-id="${esc(code)}"`)); }
    if (r.kind === "System-specific") return "";
    const p = PROV[r.pid], o = r.offer;
    const body = `<p class="v2h-p">${esc(o.prov)}</p>${page ? `<p class="v2h-p">${mu("WS-X90 writes no narrative, requirement or evidence for it: its SSP cites this implementation and the provider's authorization.")}</p>` : ""}${r.kind === "Hybrid" ? `<p class="v2h-p"><b>WS-X90's part.</b> ${esc(r.own.replace(/^WS-X90's duty: /, ""))}</p>` : ""}${o.poam ? `<p class="v2h-p">${mu(`${esc(p.name)}'s POA&M item ${esc(o.poam.id)}, due ${esc(mdy(o.poam.due))}: ${esc(o.poam.title)}.`)}</p>` : ""}<p class="v2h-p">${mu(`${esc(authLine(p))}${p.auth.atd ? ` · expires ${esc(mdy(p.auth.atd))}` : ""}`)}</p>`;
    return card(r.kind === "Inherited" ? `Inherited from ${p.name}` : `Hybrid with ${p.name}`, null, body, lnk("Change", `data-modal="v2h-resp" data-id="${esc(code)}"`));
  };
  const tpl = (html) => { const t = document.createElement("template"); t.innerHTML = html; return t; };
  function decorPreview(o, id) {
    if (!o || !o.body) return o;
    const code = String(id || "").split("|")[0]; if (!SSP.ctl(code)) return o;
    const r = resp(code), t = tpl(o.body), root = t.content;
    const kv = root.querySelector("dl.v2k-kv, dl.ak-kv");
    if (kv) {
      kv.insertAdjacentHTML("beforeend", `<dt>Responsibility</dt><dd>${respFact(code)}</dd>`);
      if (r.kind === "Inherited") {
        const dts = [...kv.querySelectorAll("dt")];
        const ob = dts.find((d) => /^Objectives$/.test(d.textContent.trim())); if (ob && ob.nextElementSibling) ob.nextElementSibling.innerHTML = `<span class="num">${fmt(ctl(code).ob)} of ${fmt(ctl(code).ob)}</span> assessed by ${esc(PROV[r.pid].name)}`;
        const db = dts.find((d) => /^Determined by$/.test(d.textContent.trim())); if (db && db.nextElementSibling) db.nextElementSibling.textContent = `${PROV[r.pid].name}'s assessment`;
      }
    }
    if (r.back) { const first = root.querySelector(".v2k-lk"), cards = root.querySelectorAll(".v2k-lk"); if (cards.length >= 3) cards[cards.length - 1].remove(); const html = provCard(code); if (first) first.insertAdjacentHTML("beforebegin", html); else if (kv) kv.insertAdjacentHTML("afterend", html); }
    if (r.kind !== "System-specific") {
      const cards = [...root.querySelectorAll(".v2k-lk")];
      if (r.kind === "Inherited") cards.filter((c) => /^(Requirements|Evidence)/.test((c.querySelector(".v2k-lkh b") || {}).textContent || "")).forEach((c) => c.remove());
      else { const ev = cards.find((c) => /^Evidence/.test((c.querySelector(".v2k-lkh b") || {}).textContent || "")); if (ev && root.querySelectorAll(".v2k-lk").length >= 3) ev.remove(); }
      const first = root.querySelector(".v2k-lk");
      const html = provCard(code);
      if (first) first.insertAdjacentHTML("beforebegin", html); else if (kv) kv.insertAdjacentHTML("afterend", html);
      if (r.kind === "Inherited") { const head = root.querySelector(".ak-rh .btns"); if (head) head.innerHTML = ""; }
    }
    o.body = t.innerHTML;
    return o;
  }
  if (P["a-tests-control"]) { const f = P["a-tests-control"]; P["a-tests-control"] = (id) => decorPreview(f(id), id); }
  // The control's page (drawn on demand by the records module): one fact more, the provider's statement on Implementation, and
  // Change responsibility in its ⋯.
  function decorPage(html, code, tab) {
    if (!SSP.ctl(code) || typeof html !== "string") return html;
    const t = tpl(html), root = t.content, r = resp(code);
    const facts = root.querySelector(".ak-rh .ak-facts, .ak-facts");
    if (facts) facts.insertAdjacentHTML("beforeend", `<div><dt>Responsibility</dt><dd>${respFact(code)}</dd></div>`);
    const menuEl = root.querySelector(".v2r-menu, .a-tests-menu");
    if (menuEl && !menuEl.querySelector('[data-modal="v2h-resp"]')) menuEl.insertAdjacentHTML("beforeend", `<span role="menuitem" tabindex="0" class="a-tests-mi" data-modal="v2h-resp" data-id="${esc(code)}">Change responsibility</span>`);
    if (r.back && (!tab || tab === "impl")) { const body = root.querySelector(".ak-rec-b") || root.querySelector(".v2r-body"); if (body) body.insertAdjacentHTML("afterbegin", provCard(code)); }
    if (r.kind !== "System-specific" && (!tab || tab === "impl")) {
      const body = root.querySelector(".ak-rec-b") || root.querySelector(".v2r-body");
      if (r.kind === "Inherited" && body) {
        // WS-X90 writes no narrative, requirement or evidence for it: its SSP cites the provider's implementation.
        [...body.querySelectorAll(":scope > .card, :scope > .v2k-lk")].filter((c) => /^(Implementation in SSP|Requirements|Evidence)/.test(((c.querySelector(".t, .v2k-lkh b") || {}).textContent || "").trim())).forEach((c) => c.remove());
      }
      if (body) body.insertAdjacentHTML("afterbegin", provCard(code, r.kind === "Inherited"));
      if (r.kind === "Inherited") {
        const p = PROV[r.pid];
        [...root.querySelectorAll(".ak-facts dt")].filter((d) => d.textContent.trim() === "Determined by").forEach((db) => { if (db.nextElementSibling) db.nextElementSibling.textContent = `${p.name}'s assessment`; });
        const prim = root.querySelector(".ak-rh .btns .btn.ink"); if (prim) prim.remove();
        [...root.querySelectorAll(".ak-rail-s")].forEach((sec) => {
          const ttl = (sec.querySelector(".ak-rail-t") || {}).textContent || "";
          if (/^Next step/.test(ttl.trim())) { const pp = sec.querySelector("p"); if (pp) pp.textContent = r.offer.st === "satisfied" ? `None: ${p.name} implements and assesses it.` : `None of WS-X90's: ${p.name}'s POA&M item ${r.offer.poam ? r.offer.poam.id : ""} holds it.`; }
          if (/^Where it stands/.test(ttl.trim())) { const dl = sec.querySelector("dl"); if (dl) dl.innerHTML = `<dt>Assessed</dt><dd><span class="num">${fmt(ctl(code).ob)} of ${fmt(ctl(code).ob)}</span> objectives, by ${esc(p.name)}</dd><dt>Requirements</dt><dd>${mu("None needed")}</dd><dt>Evidence</dt><dd>${mu("None needed")}</dd>`; }
        });
      }
    }
    return t.innerHTML;
  }
  function wrapCtlPage(route) {
    const m = /^rec--a-tests-control--(.+)$/.exec(route || ""); if (!m || !S[route] || S[route].__v2h) return;
    let id = m[1]; try { id = decodeURIComponent(id); } catch (e) { /* as is */ }
    const [code, tab] = id.split("|"); const f = S[route];
    S[route] = () => decorPage(f(), code, tab); S[route].__v2h = true;
  }
  window.addEventListener("hashchange", () => wrapCtlPage(V.cur())); wrapCtlPage(V.cur());

  // ════════════════ The Overview's Details rail: its host system ════════════════
  if (S.overview) {
    const f = S.overview;
    S.overview = () => {
      const html = f();
      const prog = curProg(); if (prog !== WSX) return html;
      const c = counts();
      const fact = `<dt>Host system</dt><dd><span class="v7p-factlink v2h-hostf" role="link" tabindex="0" data-panel="v2h-prov" data-id="f16">${esc(PROV.f16.name)}</span></dd>`;
      return html.replace(/(<div class="ak-rail-s v2-ov-rail">[\s\S]*?<dl class="ak-kv">[\s\S]*?<dt>System<\/dt><dd>[\s\S]*?<\/dd>)/, `$1${fact}`)
        .replace(/(<span class="v7p-mu num">[0-9,]+ of [0-9,]+ controls)(<\/span>)/, `$1 · <span class="ak-link v2h-inhl" role="link" tabindex="0" data-go="hosts">${fmt(c.inh)} inherited</span>$2`);
    };
  }

  // ════════════════ WS-X90's counts, one number everywhere ════════════════
  // Screens that print WS-X90's control totals from their own copies: the live number replaces the copy (today) and the daily
  // snapshots read the default responsibilities (they were taken with them).
  const live = () => counts();
  if (S.portfolio) {
    const f = S.portfolio;
    // Only inside WS-X90's own row: the other programs' cells keep their numbers.
    S.portfolio = () => { const c = live(); return String(f()).replace(/<tr\b[^>]*(?:data-id|data-v2prog)="PRG-1090"[^>]*>[\s\S]*?<\/tr>/, (row) => row.replace(/(<span class="v2-pf-sat"><b class="num">)\d+%(<\/b>)/, `$1${pct(c.sat, c.total)}%$2`).replace(/(<span class="num">)176 of 560(<\/span>)/, `$1${fmt(c.sat)} of ${fmt(c.total)}$2`)); };
  }
  if (P["v7o-prog"]) {
    const f = P["v7o-prog"];
    P["v7o-prog"] = (code) => {
      const o = f(code); if (!o || code !== WSX) return o;
      const c = live(), cs = c.cs;
      o.body = o.body.replace(/31%(<span class="v7o-mu"> satisfied)/, `${pct(c.sat, c.total)}%$1`)
        .replace(/176(<\/b>|\b)/g, (m0, tail) => `${fmt(cs.satisfied)}${tail}`)
        .replace(/\b233\b/g, fmt(cs.no_evidence)).replace(/(Not assessed[^0-9]{0,80})\b90\b/g, `$1${fmt(cs.not_assessed)}`).replace(/(Partially satisfied[^0-9]{0,80})\b34\b/g, `$1${fmt(cs.partially_satisfied)}`);
      return o;
    };
  }
  const snapSat = (n) => n + DEF.delta;
  ["event-log", "event-log-system"].forEach((r) => {
    if (!S[r]) return; const f = S[r];
    S[r] = () => String(f()).replace(/\b176 of 560 controls satisfied/g, `${fmt(snapSat(176))} of 560 controls satisfied`);
  });

  // The control status trend (Reports): every daily snapshot was taken with the default responsibilities, so each day's counts
  // move by what inheriting moves; today's point is the live count.
  const TREND_A = { satisfied: 174, partially_satisfied: 34, other_than_satisfied: 13, not_assessed: 90, no_evidence: 235, no_requirement: 14 };
  const TREND_L = { satisfied: "Satisfied", partially_satisfied: "Partially satisfied", other_than_satisfied: "Other than satisfied", not_assessed: "Not assessed", no_evidence: "No evidence", no_requirement: "No requirement" };
  function trendFix(html) {
    if (typeof html !== "string" || !/Control status trend/.test(html)) return html;
    const c = live(), cs = c.cs, sh = (n) => n + DEF.dd.satisfied, d0 = TREND_A.satisfied + DEF.dd.satisfied, dSat = c.sat - d0;
    let out = html.replace(/(<span class="big num">)176(<\/span>)/, `$1${fmt(c.sat)}$2`).replace(/of 560 · 31%/, `of 560 · ${pct(c.sat, c.total)}%`)
      .replace(/\+2 compared to Nov 13/, `${dSat >= 0 ? "+" : "−"}${Math.abs(dSat)} compared to Nov 13`)
      .replace(/>(170|175|180)<\/text>/g, (m0, n) => `>${sh(+n)}</text>`).replace(/(text-anchor="end">)176(<\/text>)/, `$1${fmt(c.sat)}$2`)
      .replace(/(<title>Nov 1[3-6]: )(\d+)( of 560 satisfied<\/title>)/g, (m0, a, n, b) => `${a}${sh(+n)}${b}`).replace(/(<title>Nov 17: )\d+( of 560 satisfied<\/title>)/, `$1${c.sat}$2`)
      .replace(/(from Nov 13 to Nov 17: )([0-9, ]+)( of 560)/, (m0, a, list, b) => { const v = list.split(/,\s*/).map((x) => sh(+x)); v[v.length - 1] = c.sat; return `${a}${v.join(", ")}${b}`; })
      .replace(/The axis starts at 170/, `The axis starts at ${sh(170)}`);
    for (const [k, l] of Object.entries(TREND_L)) {
      const a = TREND_A[k] + (DEF.dd[k] || 0), z = cs[k] || 0, d = z - a;
      out = out.replace(new RegExp(`(>${l}</span><b class="num">)\\d+(</b>)<span class="a-work-(?:up|dn|mu) num">[^<]*</span>`), `$1${fmt(z)}$2${d > 0 ? `<span class="a-work-up num">+${d}</span>` : d < 0 ? `<span class="a-work-dn num">−${-d}</span>` : '<span class="a-work-mu num">No change</span>'}`);
    }
    return out;
  }
  ["reports-trend", "after-reports-trend"].forEach((r) => { if (S[r]) { const f = S[r]; S[r] = () => trendFix(f()); } });

  // The workspace's providers for Settings › Common control providers: host systems first.
  const WS_ORDER = ["f16", "c130j", "sqops", "idp", "lab", "cssp", "peo"];
  PA.v2host.workspace = () => Object.values(PROV).sort((a, b) => WS_ORDER.indexOf(a.id) - WS_ORDER.indexOf(b.id)).map((p) => ({ id: p.id, name: p.name, kind: p.kind, offered: offersOf(p.id).length,
    takers: carried(p.id).map((x) => ({ prog: x.prog, name: x.name, inh: x.inh, hyb: x.hyb })), auth: p.auth.atd ? `${p.auth.word} · expires ${mdy(p.auth.atd)}` : p.auth.word }));
  // The bubble drawn small, for the Authorization page's Package tab: what the decision in force covers.
  PA.v2host.mini = () => {
    const els = SUBS.reduce((a, c) => a + kidsOf(c).length, 0), ics = ICS().filter((x) => x.id !== "IC-109").length;
    const label = `The ATO covers Increment 1 · Block 1: ${SUBS.length} subsystems and ${els} elements. Outside it: F-16 Block 70, the Squadron operations facility, the Corporate identity provider and ${ics} interconnections.`;
    return `<div class="ak-rail-s v2h-minis"><div class="ak-rail-t">What it covers</div><div class="v2h-mini" role="img" aria-label="${esc(label)}"><div class="v2h-minib"><span class="v2h-k">ATO</span><b>Increment 1 · Block 1</b><span class="v2h-s">${SUBS.length} subsystems · ${els} elements</span></div><div class="v2h-minio"><span>F-16 Block 70 · host</span><span>Squadron operations facility</span><span>Corporate identity provider</span><span>${ics} interconnections</span></div></div><span class="ak-link" role="link" tabindex="0" data-go="boundary">Open Boundary</span></div>`;
  };

  // The workspace's menus name the route; nothing else to register.
  ROUTE_NAV.boundary = "boundary"; ROUTE_NAV["boundary-iatt"] = "boundary"; ROUTE_NAV.hosts = "hosts";
})();
