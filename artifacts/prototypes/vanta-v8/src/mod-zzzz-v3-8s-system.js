// V3 lane S (k3s-): the system and its components. One place, System, and one record, the component, on which the work is done.
// It replaces Boundary, Interconnections, Ports & protocols, Composition (and its Assets), Host & providers, Inheritance, Inventory
// and the read-only "element" page. Inert while V3 is off (K.screen / K.lazy pages, kit actions, V3.redirect).
//
// Pages
//   system                         Components: what is inside the boundary, a Subsystem filter beside the search (no rail)
//   system-providers               Host and providers: the systems outside the boundary that offer controls
//   system-connected               Connected systems: the systems outside the boundary a component exchanges data with
//   system-boundary[--blk|--iatt]  the Components tab as the bubble: what the ATO, Block 1.1 and the IATT each cover
//   system-connections             every connection, one row each: between two components, to the host, to an outside system
//   connection--<id>               a connection's page, drawn by the kit from the k3s-conn definition (fn(id, { page: true }))
//   component--<code>[--<tab>]     the record: overview, software, connections, controls, requirements, findings, components (a
//                                  subsystem), offered (a host or a provider). <code> is CN-…, a provider's id (f16), or EXT-… .
// Panels: k3s-conn (a connection: its ports, its agreement, its two ends), k3s-req ("REQ-001@CN-109101": a requirement seen from
//   a component), k3s-ctl ("AC-2@CN-109101": a control on a component; used only when lane C's k3c-control is not in the build),
//   k3s-comp (a component named on another page; its Open goes to its page). With V3 on, the old previews v7p-el, sys-el and
//   v2h-prov draw k3s-comp, and v8b-ic draws k3s-conn.
// Opening exactly some records (set, then go):
//   K.set("sys.view", { rail: "" | "<subsystem code>", q: "", att: "" | "behind" })  → system   (rail host | provider | connected
//     still opens its tab);  K.set("sys.oview", { provider: { q, att: "" | "noauth" }, connected: { q } })  → system-providers, system-connected
//   K.set("sys.cview", { q: "", f: "" | "noagr" | "inside" | "cross" })                                                          → system-connections
//   K.set("sys.tab", { ["<componentCode>:<tab>"]: { fam: "", q: "", f: "" } })   one tab of a component, then go component--<code>--<tab>
//     (f: controls "nowritten|inherited|hybrid"; requirements "noev"; connections "noagr"; offered "inh|hyb|back"; software and findings: a kind)
// Session data (K.get/K.set under "sys." for WS-X90, "p.<program>.sys." for any other program; Reset clears it). Nothing is seeded:
//   added [component], edits { code: changes }, removed [code]; items [{ id, comp, … }], itemEdits { id: changes }, itemsRm [id];
//   placed [[comp, ctl]], unplaced [[comp, ctl]]; impl { "ctl@comp": { status, text } } (only without lane C);
//   alloc [[comp, req]], unalloc [[comp, req]], reqs [created requirement], maps [[req, ctl]], mapsRm [[req, ctl]];
//   conns [connection], connEdits { id: changes }, connsRm [id]; ports [{ id, conn, … }], portsRm [id]; agr { connId: agreement };
//   boundaryText (the boundary's description, also written to SSP section 5).
// A control's responsibility is not kept here: it is mod-zzzz-v2-8host's (PA.v2 state host.resp.<code>), changed in place.
// Facts published (PA.v3.fact):
//   components() → [{ code, name, kind, boundary: "inside|host|provider|connected", parent }]   component(code)
//   controlsOf(componentCode) → control codes placed there (a subsystem pools what stands inside it; a provider: what is taken)
//   componentsOf(controlCode) → component codes the control is placed on (direct placements)
//   place(componentCode, controlCode) · unplace(componentCode, controlCode) · connections() → [{ id, name, from, to: [codes], … }]
//   requirementsOf(componentCode) → requirement codes allocated there · allocate(componentCode, reqCode) · madeRequirements()
//   items(componentCode) → { software: [...], firmware: [...], hardware: [...] }: each { id, name, version, kind, supplier, baseline,
//     note, proposed, asset, sbom, added } (added: the reader's own row). Allocations stay [component, requirement] pairs under
//     sys.alloc and sys.unalloc.
//   cveFixed(cve, componentCode) → true once the component runs a version that fixes the CVE (Take version 2 on Mission Computer)
//   componentCounts(componentCode) → { controls, requirements, findings, items, connections, components }: the one count of what
//     stands on a component. Each is the length of a list drawn row by row here (PA.v7p.EBY's ctl and req have no rows behind them).
//   reqPanel is read, not published: a later lane's requirement panel kind (default k3s-req).
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k, V = PA && PA.v2;
  if (!V3 || !K || !V || !PA.SSP) return;
  const SSP = PA.SSP, esc = K.esc, fmt = K.fmt;
  const ME = "Ingrid Solberg", TODAY = "2026-11-17";
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const mdy = (iso) => (iso ? new Date(String(iso).slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  const clip = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; };
  const mu = (t) => `<span class="k3-muted">${t}</span>`;
  const uniq = (a) => [...new Set(a)];
  const natural = (a, b) => String(a).localeCompare(String(b), "en", { numeric: true });
  const wsx = () => V3.wsx();

  // ——— Session data, per program ———
  const pk = (p) => (wsx() ? "sys." + p : "p." + V3.prog() + ".sys." + p);
  const get = (p, d) => { const v = K.get(pk(p), d); return v == null ? d : v; };
  const set = (p, v) => K.set(pk(p), v);
  const push = (p, item) => K.push(pk(p), item);
  const drop = (p, test) => K.drop(pk(p), test);
  const pairHas = (p, a, b) => get(p, []).some((x) => x[0] === a && x[1] === b);
  const pairAdd = (p, a, b) => { if (!pairHas(p, a, b)) push(p, [a, b]); };
  const pairDrop = (p, a, b) => drop(p, (x) => x[0] === a && x[1] === b);
  // Derived lists are kept until anything in the session changes.
  let MEMO = {};
  V.on(() => { MEMO = {}; });
  window.addEventListener("v3change", () => { MEMO = {}; });
  const memo = (k, fn) => { const key = V3.prog() + "|" + k; return key in MEMO ? MEMO[key] : (MEMO[key] = fn()); };
  const STATIC = {};
  const stat = (k, fn) => (k in STATIC ? STATIC[k] : (STATIC[k] = fn()));

  // ——— Where WS-X90's records are ———
  const EBY = () => (PA.v7p && PA.v7p.EBY) || {};
  const COMP = () => (PA.v7p && PA.v7p.COMP) || {};
  const PROV = () => (PA.HOSTD && PA.HOSTD.providers) || {};
  const H = () => PA.v2host || null;
  const ICS = () => PA.v8bIC || [];
  const REQD = () => (PA.SCTMD && PA.SCTMD.reqs) || {};
  const hubs = () => PA.v2hubs || null;
  const madeProg = () => (!wsx() && hubs() && hubs().madeOne ? hubs().madeOne(V3.prog()) : null);
  const pRecs = (kind) => (wsx() ? [] : V.get(`v3.P.${V3.prog()}.${kind}`, []) || []);
  const parse = (html) => new DOMParser().parseFromString(String(html || ""), "text/html");
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  const KINDW = { other: "System", platform: "System", subsystem: "Subsystem", hardware: "Hardware", software: "Software" };
  const WHERE = { inside: "Inside the boundary", host: "Host system", provider: "Provider", connected: "Connected system" };
  const extName = (to) => String(to || "").replace(/ \(PRG-\d+\)$/, "");

  // ——— Components: WS-X90's tree, its host and providers, the systems it connects to, and what the reader added ———
  function baseComponents() {
    const out = [];
    if (wsx()) {
      const C = COMP();
      for (const e of Object.values(EBY())) {
        if (e.type === "platform") continue;
        const c = C[e.code];
        out.push({ code: e.code, name: e.name, kind: KINDW[e.type] || "Hardware", boundary: "inside", parent: e.type === "other" ? null : e.parent, root: e.type === "other", unit: c ? c[0] : null, lib: c && c[1] ? { name: c[1], v: c[2], set: c[3] } : null });
      }
    } else {
      const d = madeProg();
      const systems = d && d.systems && d.systems.length ? d.systems : d ? [{ code: d.code, name: d.name }] : [];
      systems.forEach((s, i) => {
        out.push({ code: s.code, name: s.name || s.code, kind: "System", boundary: "inside", parent: null, root: i === 0, owner: s.owner || null });
        const byK = new Map((s.els || []).map((e) => [e.k, e.code]));
        for (const e of s.els || []) { if (/removed|dropped/i.test(e.state || "")) continue; out.push({ code: e.code, name: e.name || e.code, kind: KINDW[e.type] || "Hardware", boundary: "inside", parent: byK.get(e.parent) || s.code, lib: e.pin ? { name: e.pin, v: e.pinV || 1, set: "Library component" } : null }); }
      });
      // What was added to the program after the wizard is lane P's record (v3.P.<program>.el), read here and written by Add component.
      for (const e of pRecs("el")) if (!out.some((c) => c.code === e.code)) out.push({ code: e.code, name: e.name || e.code, kind: KINDW[e.type] || "Hardware", boundary: "inside", parent: e.sys && out.some((c) => c.code === e.sys) ? e.sys : (out[0] || {}).code || null, added: true });
    }
    const provs = (H() && H().providers ? H().providers(V3.prog()) || [] : []).slice();
    if (!wsx()) for (const id of pRecs("prov")) if (PROV()[id] && !provs.some((p) => p.id === id)) provs.push({ id, name: PROV()[id].name, kind: PROV()[id].kind });
    for (const p of provs) { const P0 = PROV()[p.id] || {}; out.push({ code: p.id, name: p.name, kind: p.kind, boundary: p.kind === "Host system" ? "host" : "provider", parent: null, org: P0.owner || null, about: P0.about || "" }); }
    if (wsx()) {
      const seen = new Set(out.map((c) => c.name));
      for (const ic of ICS()) { const name = extName(ic.to); if (seen.has(name)) continue; seen.add(name); out.push({ code: "EXT-" + String(ic.id).replace(/^IC-/, ""), name, kind: "Connected system", boundary: "connected", parent: null, org: ic.org || null, ao: ic.ao || null }); }
    }
    return out;
  }
  const components = () => memo("comps", () => {
    const ed = get("edits", {}), rm = new Set(get("removed", []));
    return baseComponents().concat(get("added", []).map((x) => Object.assign({ added: true }, x))).filter((c) => !rm.has(c.code)).map((c) => Object.assign({}, c, ed[c.code] || {}));
  });
  const byCode = () => memo("byCode", () => new Map(components().map((c) => [c.code, c])));
  const component = (code) => byCode().get(code) || null;
  const nameOf = (code) => (component(code) || { name: code }).name;
  const inside = () => components().filter((c) => c.boundary === "inside");
  const kids = (code) => components().filter((c) => c.parent === code);
  const rootOf = () => inside().find((c) => c.root) || null;
  const below = (code) => memo("below:" + code, () => { const out = []; const walk = (c) => { for (const k of kids(c)) { out.push(k.code); walk(k.code); } }; walk(code); return out; });
  const isContainer = (c) => c.boundary === "inside" && (c.root || c.kind === "Subsystem" || kids(c.code).length > 0);
  const subsystems = () => { const r = rootOf(); return inside().filter((c) => !c.root && (c.parent === (r && r.code) || !c.parent) && (c.kind === "Subsystem" || kids(c.code).length)); };
  // Tree order: the system, then each subsystem followed by what it holds.
  const treeOrder = () => memo("tree", () => { const out = []; const walk = (c, d) => { out.push([c, d]); kids(c.code).forEach((k) => walk(k, d + 1)); }; inside().filter((c) => !c.parent || !byCode().has(c.parent)).forEach((c) => walk(c, 0)); return out; });
  const ownerOf = (code) => { const c = component(code); return c && c.owner ? c.owner : null; };
  const people = () => stat("people", () => uniq([].concat((V3.fact("people") || []).map((p) => p.name), (SSP.people || []).map((p) => p.name)).filter(Boolean)));
  const nextCode = (kind) => { const used = new Set(baseComponents().map((c) => c.code).concat(get("added", []).map((c) => c.code), get("removed", []))); if (!wsx() && kind !== "ext") { const r = rootOf(), pre0 = (r ? r.code : V3.prog()) + "-C"; for (let i = 1; i < 999; i++) if (!used.has(pre0 + i)) return pre0 + i; } const [pre, start] = kind === "Subsystem" ? ["CN-1090", 1] : kind === "ext" ? ["EXT-", 201] : ["CN-1091", 1]; for (let i = start; i < 999; i++) { const c = pre + (kind === "ext" ? i : String(i).padStart(2, "0")); if (!used.has(c)) return c; } return K.id("CN"); };

  // ——— Library version (Mission Computer): lane W's command and fact ———
  const mc2 = () => V3.fact("mc2") || null;
  const libOf = (c) => { if (!c || !c.lib) return null; const taken = c.code === "CN-109101" && mc2() && mc2().taken; return { name: c.lib.name, set: c.lib.set, v: taken ? 2 : c.lib.v, latest: c.code === "CN-109101" ? 2 : c.lib.v, behind: c.code === "CN-109101" && !taken ? 1 : 0 }; };
  const behind = (c) => { const l = libOf(c); return l ? l.behind : 0; };

  // ——— Software, firmware and hardware: the rows a component owns ———
  const kindOfItem = (v) => (/-FW /.test(v) ? "Firmware" : "Software");
  const splitVer = (s) => { const m = /^(.*\S)\s+(\S+)$/.exec(String(s)); return m ? [m[1], m[2]] : [String(s), ""]; };
  // The SBOM the prototype holds (the Mission Computer's maintenance image) is read from the preview that draws it.
  const sbomOf = (code) => stat("sbom:" + code, () => {
    if (code !== "CN-109101" || !PA.P["v7p-el"]) return null;
    try { const d = parse(V3.force(false, () => PA.P["v7p-el"](code).body)); const hit = [...d.body.querySelectorAll("*")].filter((el) => /SBOM\s*·\s*\d+ parts/.test(txt(el))).sort((a, b) => txt(a).length - txt(b).length)[0]; const m = hit && /(\S[^·]*SBOM)\s*·\s*(\d+) parts/.exec(txt(hit)); const cve = /CVE-\d{4}-\d+/.exec(d.body.textContent); return m ? { title: m[1].replace(/^SBOM\s*/, "").trim(), parts: +m[2], cve: cve ? cve[0] : null } : null; } catch (e) { return null; }
  });
  function baseItems(c) {
    if (!wsx() || !c || c.boundary !== "inside") return [];
    const pins = (COMP()[c.code] || [])[4], out = [];
    if (pins && pins[0]) {
      const [n0, v0] = splitVer(pins[0][0]), changed = pins[1] && pins[1][0] !== pins[0][0];
      out.push({ id: c.code + ":b1", comp: c.code, name: n0, kind: kindOfItem(pins[0][0]), version: v0, baseline: "Block 1", note: changed ? pins[0][1] : "As assessed for the initial authorization; unchanged in Block 1.1." });
      if (changed) { const [n1, v1] = splitVer(pins[1][0]); out.push({ id: c.code + ":b11", comp: c.code, name: n1, kind: kindOfItem(pins[1][0]), version: v1, baseline: "Block 1.1 proposed", note: pins[1][1], proposed: true }); }
    }
    const sb = sbomOf(c.code);
    if (sb) { const fixed = mc2() && mc2().taken; out.push({ id: c.code + ":img", comp: c.code, name: sb.title.replace(/ SBOM$/, ""), kind: "Software", version: fixed ? "2" : "1", supplier: c.lib ? c.lib.set : "", sbom: { parts: sb.parts, cve: fixed ? null : sb.cve, fixed: fixed ? sb.cve : null }, baseline: "Block 1" }); }
    if (c.unit && c.kind === "Hardware") out.push({ id: c.code + ":hw", comp: c.code, name: c.name, kind: "Hardware", version: c.unit, asset: "AST-1090" + c.code.slice(-2), baseline: "Block 1", note: "The unit as fielded." });
    return out;
  }
  const itemsOf = (code) => memo("items:" + code, () => { const c = component(code), ed = get("itemEdits", {}), rm = new Set(get("itemsRm", [])); return baseItems(c).concat(get("items", []).filter((x) => x.comp === code)).filter((x) => !rm.has(x.id)).map((x) => Object.assign({}, x, ed[x.id] || {})); });
  const swLine = (code) => { const l = itemsOf(code).filter((x) => x.kind !== "Hardware"); if (!l.length) return ""; const cur = l.find((x) => !x.proposed) || l[0], next = l.find((x) => x.proposed && x.name === cur.name); const rest = l.length - (next ? 2 : 1); return `<span class="num">${esc(cur.name)} ${esc(cur.version)}${next ? ` → ${esc(next.version)}` : ""}</span>${rest > 0 ? ` ${mu("+" + rest)}` : ""}`; };

  // ——— Controls placed on a component ———
  // WS-X90 records no placement table in this prototype: a control stands on a component where its implementation names the
  // component (its unit number or its name) or where a requirement allocated there maps it. The reader's changes lie over that.
  const ctlRec = (code) => (SSP.ctl ? SSP.ctl(code) : null) || null;
  const inBaseline = (code) => { const f = V3.fact("control", code); return f ? f.inBaseline !== false : !!ctlRec(code); };
  const mentions = (c) => stat("men:" + c.code + ":" + c.name, () => { const keys = [c.unit, c.name, c.root ? "SYS-WSX90" : null].filter(Boolean); return new Set(SSP.controls.filter((x) => { const n = x.n || ""; return keys.some((k) => n.includes(k)); }).map((x) => x.c)); });
  const baseAlloc = (code) => stat("alloc:" + code, () => Object.keys(REQD()).filter((r) => (REQD()[r].els || []).includes(code)));
  function basePlace(c) {
    if (!wsx() || !c || c.boundary !== "inside" || c.added) return [];
    return stat("place:" + c.code, () => { const s = new Set(mentions(c)); for (const r of baseAlloc(c.code)) for (const k of REQD()[r].ctl || []) if (ctlRec(k)) s.add(k); return [...s]; });
  }
  const direct = (code) => memo("direct:" + code, () => { const c = component(code); if (!c) return []; const s = new Set(basePlace(c)); for (const [a, b] of get("placed", [])) if (a === code) s.add(b); for (const [a, b] of get("unplaced", [])) if (a === code) s.delete(b); return [...s].filter(inBaseline).sort(natural); });
  // What a provider offers and how this system takes it. WS-X90's responsibilities are live (mod-zzzz-v2-8host); another
  // program takes the provider's defaults.
  const offersTaken = (pid) => { const Hh = H(); if (!Hh) return []; if (wsx() && Hh.takes) return Hh.takes(pid).rows; return (Hh.offersOf ? Hh.offersOf(pid) : []).map((o) => { const kind = o.kind === "Inherited" && (PROV()[pid] || {}).forceHybrid ? "Hybrid" : o.kind; return { code: o.code, kind, def: o.kind, own: kind === "Hybrid" ? o.own || "" : "", offer: o, back: false, pid }; }); };
  const takeCounts = (pid) => { const r = offersTaken(pid); return { offered: r.length, inh: r.filter((x) => x.kind === "Inherited").length, hyb: r.filter((x) => x.kind === "Hybrid").length, back: r.filter((x) => x.back).length }; };
  const taken = (pid) => offersTaken(pid).filter((r) => r.kind !== "System-specific").map((r) => r.code);
  const controlsOf = (code) => memo("pool:" + code, () => { const c = component(code); if (!c) return []; if (c.boundary === "host" || c.boundary === "provider") return taken(code).sort(natural); if (c.boundary === "connected") return uniq(connsOf(code).flatMap((x) => x.ctl || [])).filter(inBaseline).sort(natural); const s = new Set(direct(code)); for (const k of below(code)) for (const x of direct(k)) s.add(x); return [...s].sort(natural); });
  const componentsOf = (ctl) => memo("on:" + ctl, () => inside().filter((c) => direct(c.code).includes(ctl)).map((c) => c.code));
  const place = (comp, ctl) => { pairDrop("unplaced", comp, ctl); if (!direct(comp).includes(ctl)) pairAdd("placed", comp, ctl); };
  const unplace = (comp, ctl) => { pairDrop("placed", comp, ctl); if (direct(comp).includes(ctl)) pairAdd("unplaced", comp, ctl); };
  // Why a control stands on a component: every placement has a row and a reason behind it.
  const basisOf = (comp, ctl) => { const c = component(comp); if (!c) return ""; if (pairHas("placed", comp, ctl)) return "Placed here"; const rs = c.added ? [] : baseAlloc(comp).filter((r) => (REQD()[r].ctl || []).includes(ctl)); if (rs.length) return `Mapped by ${rs[0]}${rs.length > 1 ? ` and ${rs.length - 1} more` : ""}`; return !c.added && mentions(c).has(ctl) ? "Named in its implementation" : ""; };
  // Which components inside `code` hold the control (for a subsystem's pooled list).
  const heldBy = (code, ctl) => [code].concat(below(code)).filter((k) => direct(k).includes(ctl));

  // A control's facts, from lane C when it is in the build, else from the sources C reads.
  const STW = { satisfied: "Satisfied", partially_satisfied: "Partially satisfied", other_than_satisfied: "Other than satisfied", not_assessed: "Not assessed", no_evidence: "No evidence", no_requirement: "No requirement" };
  const statusOf = (ctl) => { const s = V3.fact("status", ctl) || (ctlRec(ctl) || {}).cs; return STW[s] || "No requirement"; };
  const titleOf = (ctl) => (ctlRec(ctl) || { t: ctl }).t;
  const famOf = (ctl) => (ctlRec(ctl) || { f: String(ctl).split("-")[0] }).f;
  const famName = (f) => ((SSP.families || []).find((x) => x.f === f) || { t: f }).t;
  const respOf = (ctl) => { const r = H() && H().responsibility ? H().responsibility(ctl, V3.prog()) : null; return r || { kind: "System-specific" }; };
  const respWord = (r) => (r.kind === "Inherited" ? `Inherited from ${r.provider}` : r.kind === "Hybrid" ? `Hybrid with ${r.provider}` : "This system");
  const provAuth = (pid) => { const p = PROV()[pid]; return p && p.auth ? p.auth : null; };
  const unauth = (pid) => { const a = provAuth(pid); return !!a && a.word !== "Authorized"; };
  const hasC = () => typeof V3.facts.impl === "function" && typeof V3.facts.setImpl === "function";
  const implOf = (ctl, comp) => {
    if (hasC()) { const r = V3.fact("impl", ctl, comp); if (r) return r; }
    const mine = get("impl", {})[ctl + "@" + comp]; if (mine) return mine;
    const c = component(comp), rec = ctlRec(ctl);
    return c && rec && c.boundary === "inside" && !c.added && mentions(c).has(ctl) ? { status: (SSP.IMPL && SSP.IMPL[rec.s] ? SSP.IMPL[rec.s][0] : "Implemented"), text: rec.n, fromSsp: true } : { status: "", text: "" };
  };
  const setImpl = (ctl, comp, v) => { if (hasC()) { V3.fact("setImpl", ctl, comp, v); MEMO = {}; return; } set("impl", Object.assign({}, get("impl", {}), { [ctl + "@" + comp]: v })); };
  const written = (ctl, comp) => !!String(implOf(ctl, comp).text || "").trim();

  // ——— Requirements allocated to a component ———
  const madeReqs = () => get("reqs", []);
  const reqRec = (code) => memo("req:" + code, () => {
    const m = madeReqs().find((r) => r.code === code), d = REQD()[code];
    if (!m && !d) { const i = PA.v2reqs && PA.v2reqs.info ? PA.v2reqs.info(code) : null; if (!i) return null; return { code, title: i.title, statement: i.statement || "", ctl0: i.ctls || [], els0: i.els || [], ev: i.ev || [], iss: [], rk: [], rem: [] }; }
    return m ? { code, title: m.title, statement: m.statement || "", ctl0: [], els0: [], ev: [], iss: [], rk: [], rem: [], made: true, owner: m.by, at: m.at } : { code, title: d.t, statement: d.st || "", ctl0: d.ctl || [], els0: d.els || [], ev: d.ev || [], iss: d.iss || [], rk: d.rk || [], rem: d.rem || [] };
  });
  const allReqs = () => memo("allReqs", () => uniq(Object.keys(REQD()).concat(madeReqs().map((r) => r.code))).sort(natural));
  const reqCtls = (code) => memo("reqCtl:" + code, () => { const r = reqRec(code); if (!r) return []; const s = new Set(r.ctl0); if (PA.v2reqs && PA.v2reqs.mappings && !r.made) for (const m of PA.v2reqs.mappings(code) || []) s.add(m.ctl); for (const [a, b] of get("maps", [])) if (a === code) s.add(b); for (const [a, b] of get("mapsRm", [])) if (a === code) s.delete(b); return [...s].sort(natural); });
  const reqEls = (code) => memo("reqEl:" + code, () => { const r = reqRec(code); if (!r) return []; const s = new Set(r.els0); for (const [a, b] of get("alloc", [])) if (b === code) s.add(a); for (const [a, b] of get("unalloc", [])) if (b === code) s.delete(a); return [...s].filter((c) => byCode().has(c)); });
  const directReqs = (comp) => memo("dreq:" + comp, () => allReqs().filter((r) => reqEls(r).includes(comp)));
  const requirementsOf = (comp) => memo("preq:" + comp, () => { const s = new Set(directReqs(comp)); for (const k of below(comp)) for (const r of directReqs(k)) s.add(r); return [...s].sort(natural); });
  const allocate = (comp, req) => { pairDrop("unalloc", comp, req); if (!reqEls(req).includes(comp)) pairAdd("alloc", comp, req); };
  const unallocate = (comp, req) => { pairDrop("alloc", comp, req); if (reqEls(req).includes(comp)) pairAdd("unalloc", comp, req); };
  const nextReq = () => { let n = Math.max(643, (V3.fact("requirements") || { total: 640 }).total || 640); for (const r of allReqs()) { const m = /^REQ-(\d+)$/.exec(r); if (m) n = Math.max(n, +m[1]); } return "REQ-" + (n + 1); };

  // ——— Findings on a component: open issues (through the requirement each is about), assessment findings short of satisfied
  // (through the control each judges) and known vulnerabilities (the SBOM) ———
  const liveIssues = () => { const R = PA.riskLookup && PA.riskLookup.all ? PA.riskLookup.all() : null; return (R && R.ISS) || (PA.SCTMD && PA.SCTMD.iss) || []; };
  const issueReq = () => stat("issReq", () => { const m = new Map(); for (const i of (PA.SCTMD && PA.SCTMD.iss) || []) if (i.req) m.set(i.id, i.req); for (const [r, d] of Object.entries(REQD())) for (const id of d.iss || []) if (!m.has(id)) m.set(id, r); return m; });
  const SEVW = { critical: "Critical", high: "High", moderate: "Moderate", low: "Low" };
  const findingsOf = (comp) => memo("find:" + comp, () => {
    const c = component(comp); if (!c || !wsx() || c.boundary !== "inside") return [];
    // Lane E keeps the findings: with it in the build this tab, its count and Findings filtered to the component are one list.
    if (typeof V3.facts.findingsOn === "function") { let L = null; try { L = V3.fact("findingsOn", comp); } catch (e) { L = null; }
      if (Array.isArray(L)) return L.map((f) => ({ id: f.id, kind: f.source || "Finding", title: f.title, sev: f.sev, det: f.det ? STW[f.det] || f.det : "", about: f.control || f.where || "", owner: f.owner || null, opened: f.opened || null, panel: f.panel || "k3e-finding", pid: f.id, ctl: f.control || "" })); }
    const reqs = new Set(requirementsOf(comp)), ctls = new Set(controlsOf(comp)), out = [];
    for (const i of liveIssues()) { const r = issueReq().get(i.id); if (!r || !reqs.has(r)) continue; if (i.status && /closed|resolved/i.test(i.status)) continue; out.push({ id: "i:" + i.id, kind: "Operational issue", title: i.title, sev: i.sev, about: r, owner: i.owner || null, opened: i.opened, panel: "a-risk-issue", pid: i.id }); }
    for (const f of (PA.SCTMD && PA.SCTMD.af) || []) { if (!ctls.has(f.code) || !/^(other_than|partially)_satisfied$/.test(f.det)) continue; out.push({ id: "f:" + f.id, kind: "Assessment finding", title: `${f.code} ${f.title}`, det: STW[f.det], about: f.code, opened: f.date, panel: "risk-finding", pid: f.id, ctl: f.code }); }
    for (const it of [comp].concat(below(comp)).flatMap(itemsOf)) if (it.sbom && it.sbom.cve) out.push({ id: "v:" + it.sbom.cve, kind: "Vulnerability", title: `${it.sbom.cve} in ${it.name}`, sev: "high", about: it.name, opened: null, panel: PA.P["risk-vuln"] ? "risk-vuln" : null, pid: it.sbom.cve, fix: it.comp });
    return out;
  });

  // ——— Connections: one record a connection, whatever it joins ———
  // Ports and services are read from the page that lists them (their records are private to it): one row a service of a connection.
  const oldPorts = () => stat("pps", () => {
    try {
      if (!PA.S.ppsm) return [];
      const d = parse(V3.force(false, () => PA.S.ppsm()));
      return [...d.querySelectorAll("tr[data-id]")].map((tr) => { const td = [...tr.children], tip = (el) => { const t = el && el.querySelector("[title]"); return t ? t.getAttribute("title") : txt(el); }; return { id: tr.getAttribute("data-id"), port: txt(td[0]), protocol: txt(td[1]), service: tip(td[2]), bnd: txt(td[3]), used: tip(td[4]), cal: txt(td[5]), ppsm: txt(td[6]) }; }).filter((x) => x.id && x.port);
    } catch (e) { return []; }
  });
  const agrState = (a) => (!a ? "none" : a.st === "Signed" ? (a.exp && a.exp < TODAY ? "expired" : "signed") : a.st === "Expired" ? "expired" : a.st === "Not required" ? "notneeded" : a.st === "Draft" ? "draft" : "none");
  function baseConns() {
    if (!wsx()) return [];
    const out = [], comps = baseComponents(), byName = new Map(comps.map((c) => [c.name, c.code]));
    for (const ic of ICS()) out.push({ id: ic.id, name: ic.name, from: (ic.els || [])[0] || null, via: (ic.els || []).slice(1), to: [byName.get(extName(ic.to)) || extName(ic.to)], iface: ic.type, dir: ic.dir, flows: ic.flows, enc: ic.enc, encBy: ic.encBy, cls: ic.cls, agr: ic.agr && (ic.agr.kind || ic.agr.st) ? Object.assign({}, ic.agr) : null, owner: ic.owner || null, ctl: ic.ctl || [], org: ic.org, ao: ic.ao });
    for (const p of comps.filter((c) => c.boundary === "host" || c.boundary === "provider")) for (const f of (PROV()[p.code] || {}).ifaces || []) { if (out.some((x) => x.to.includes(p.code))) continue; out.push({ id: `IF-${p.code}-${f.id}`, name: f.name, from: p.code, to: f.to.slice(), iface: f.name, dir: "Both ways", flows: f.data, agr: null, covered: p.code, ctl: [] }); }
    const ports = oldPorts();
    for (const x of ports.filter((p) => /internal/i.test(p.bnd))) { const el = comps.find((c) => c.boundary === "inside" && ((c.unit && x.used.includes(c.unit)) || x.used.includes(c.name))); const root = comps.find((c) => c.root); if (!el || !root) continue; const id = "IN-" + el.code.slice(-3); if (!out.some((o) => o.id === id)) out.push({ id, name: `${el.name} internal services`, from: el.code, to: [root.code], iface: "Internal network", dir: "Inside", flows: x.service, agr: null, internal: true, ctl: [] }); }
    return out;
  }
  const connections = () => memo("conns", () => { const ed = get("connEdits", {}), rm = new Set(get("connsRm", [])), agr = get("agr", {}); return baseConns().concat(get("conns", [])).filter((x) => !rm.has(x.id)).map((x) => Object.assign({}, x, ed[x.id] || {}, agr[x.id] ? { agr: agr[x.id] } : {})).filter((x) => byCode().has(x.from) && x.to.some((t) => byCode().has(t))); });
  const conn = (id) => connections().find((x) => x.id === id) || null;
  const endsOf = (x) => [x.from].concat(x.to);
  const touches = (x, code) => { const set2 = new Set([code].concat(below(code))); return endsOf(x).some((e) => set2.has(e)) || (x.via || []).some((e) => set2.has(e)); };
  const connsOf = (code) => connections().filter((x) => touches(x, code));
  const crosses = (x) => endsOf(x).some((e) => (component(e) || {}).boundary !== "inside");
  const outsideEnd = (x) => endsOf(x).map(component).find((c) => c && c.boundary !== "inside") || null;
  // A connection to a connected system needs an agreement; one to the host or a provider rides on that system's authorization.
  const needsAgr = (x) => { const o = outsideEnd(x); return !!o && o.boundary === "connected"; };
  const noAgr = (x) => needsAgr(x) && !["signed", "notneeded"].includes(agrState(x.agr));
  const portsOf = (id) => memo("ports:" + id, () => {
    const x = conn(id), rm = new Set(get("portsRm", [])); if (!x) return [];
    const base = oldPorts().filter((p) => (x.internal ? /internal/i.test(p.bnd) && (p.used.includes(nameOf(x.from)) || p.used.includes((component(x.from) || {}).unit || "¤")) : p.used.split(" · ")[0] === x.name)).map((p) => ({ id: p.id, conn: id, protocol: p.protocol, port: p.port, service: p.service, dir: x.internal ? "Inside" : x.dir, ppsm: p.ppsm, cal: p.cal }));
    return base.concat(get("ports", []).filter((p) => p.conn === id)).filter((p) => !rm.has(p.id));
  });
  const portLine = (id) => { const l = portsOf(id); return l.length ? `${l.slice(0, 2).map((p) => `${esc(p.protocol)} <span class="num">${esc(p.port)}</span>`).join(", ")}${l.length > 2 ? ` ${mu("+" + (l.length - 2))}` : ""}` : ""; };

  // Shared with the rest of this module (the pages, in the next part).
  const S0 = { get, set, push, drop, pairAdd, pairDrop, pairHas, memo, stat, pk };
  PA.v3s = { S0, components, component, nameOf, inside, kids, rootOf, below, isContainer, subsystems, treeOrder, ownerOf, people, nextCode, libOf, behind, mc2, itemsOf, swLine, direct, controlsOf, componentsOf, place, unplace, heldBy, basisOf, statusOf, titleOf, famOf, famName, respOf, respWord, provAuth, unauth, implOf, setImpl, written, hasC, reqRec, allReqs, reqCtls, reqEls, directReqs, requirementsOf, allocate, unallocate, nextReq, madeReqs, findingsOf, connections, conn, connsOf, endsOf, crosses, outsideEnd, needsAgr, noAgr, agrState, portsOf, portLine, inBaseline, ctlRec, SEVW, WHERE, wsx, plural, mdy, clip, mu, uniq, natural, ME, TODAY, PROV, H, ICS, taken, extName, parse, txt, madeProg, pRecs, offersTaken, takeCounts };

  // ——— Facts for the other lanes ———
  Object.assign(V3.facts, {
    components: () => components().map((c) => ({ code: c.code, name: c.name, kind: c.kind, boundary: c.boundary, parent: c.parent || null })),
    component: (code) => { const c = component(code); return c ? { code: c.code, name: c.name, kind: c.kind, boundary: c.boundary, parent: c.parent || null, owner: c.owner || null, unit: c.unit || null } : null; },
    controlsOf: (code) => controlsOf(code).slice(),
    componentsOf: (ctl) => componentsOf(ctl).slice(),
    place: (comp, ctl) => { place(comp, ctl); return true; },
    unplace: (comp, ctl) => { unplace(comp, ctl); return true; },
    connections: () => connections().map((x) => ({ id: x.id, name: x.name, from: x.from, to: x.to.slice(), iface: x.iface, dir: x.dir, crosses: crosses(x), agreement: x.agr ? Object.assign({}, x.agr) : null, needsAgreement: noAgr(x), ports: portsOf(x.id).map((p) => ({ protocol: p.protocol, port: p.port, dir: p.dir, ppsm: p.ppsm })) })),
    requirementsOf: (comp) => requirementsOf(comp).slice(),
    allocate: (comp, req) => { allocate(comp, req); return true; },
    madeRequirements: () => madeReqs().map((r) => Object.assign({}, r, { controls: reqCtls(r.code), components: reqEls(r.code) })),
    // What a component is made of, by kind (lane D's SSP section 8 reads it): the rows of its Software & firmware tab.
    items: (code) => { const mine = new Set(get("items", []).map((x) => x.id)), out = { software: [], firmware: [], hardware: [] }; for (const x of component(code) ? itemsOf(code) : []) out[x.kind === "Hardware" ? "hardware" : x.kind === "Firmware" ? "firmware" : "software"].push({ id: x.id, name: x.name, version: x.version, kind: x.kind, supplier: x.supplier || "", baseline: x.baseline || "", note: x.note || "", proposed: !!x.proposed, asset: x.asset || null, sbom: x.sbom ? Object.assign({}, x.sbom) : null, added: mine.has(x.id) }); return out; },
    // True once the component (or a component inside it) runs a version that fixes the CVE: its findings should leave with it.
    cveFixed: (cve, code) => { const c = component(code); return !!c && [code].concat(below(code)).flatMap(itemsOf).some((it) => it.sbom && it.sbom.fixed === cve); },
    // The one count of what stands on a component, each the length of a list this lane draws row by row.
    componentCounts: (code) => { const c = component(code); return c ? { controls: controlsOf(code).length, requirements: c.boundary === "inside" ? requirementsOf(code).length : 0, findings: findingsOf(code).length, items: itemsOf(code).length, connections: connsOf(code).length, components: below(code).length } : null; },
  });
})();

// ════════════════ The pages ════════════════
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k, V = PA && PA.v2, D = PA && PA.v3s;
  if (!V3 || !K || !V || !D) return;
  const SSP = PA.SSP, esc = K.esc, fmt = K.fmt, h = PA.h;
  const { get, set, push, drop, pairAdd, pairDrop } = D.S0;
  const { plural, mdy, clip, mu, uniq, natural, ME, TODAY } = D;
  const route = (code, tab) => `component--${code}${tab && tab !== "overview" ? "--" + tab : ""}`;
  const pill = (kind, word) => h.pill(kind || "none", word);
  const openModal = (key, id) => { const main = document.getElementById("main"); if (!main) return; const t = document.createElement("span"); t.hidden = true; t.setAttribute("data-modal", key); if (id != null) t.setAttribute("data-id", id); main.appendChild(t); t.click(); t.remove(); };
  // A primary menu (the kit's menu, drawn as the page's primary).
  const addMenu = (label, items) => `<details class="k3-menu k3s-add"><summary class="btn ink">${K.i("plus")}${esc(label)}<span class="k3-caret" aria-hidden="true">⌄</span></summary><div class="k3-menu-l" role="menu">${items.filter(Boolean).map((it) => `<button type="button" role="menuitem" class="k3-menu-i"${K.a(it.act, it.arg)}>${esc(it.label)}</button>`).join("")}</div></details>`;
  const rowBtn = (label, act, arg, title) => `<button type="button" class="k3s-x" title="${esc(title || label)}" aria-label="${esc(title || label)}"${K.a(act, arg)}>${esc(label)}</button>`;
  // A button inside a row that opens a panel acts alone: the row does not open, and the panel that is open stays the one a
  // redraw draws (v2 notes the row under any click as the last preview, so the open one is noted again).
  let OPEN = null;
  document.addEventListener("click", (e) => { if (!V3.on()) return; const t = e.target; if (!t || !t.closest || t.closest(".k3s-x")) return; const r = t.closest("[data-panel]"); if (r) OPEN = { kind: r.getAttribute("data-panel"), id: r.getAttribute("data-id") }; }, true);
  const stop = (e) => { if (!e || !e.stopPropagation) return; e.stopPropagation(); const p = document.getElementById("panel"), t = e.target; if (t && t.closest && t.closest("[data-panel]") && p && !p.hidden && OPEN && PA.P[OPEN.kind]) K.openPanel(OPEN.kind, OPEN.id); };
  const cname = (c, desc) => K.name(c.name, desc, c.code);
  const clink = (code) => (D.component(code) ? K.link(D.nameOf(code), route(code)) : esc(code));
  const whereChip = (c) => pill(c.boundary === "inside" ? "none" : "info", D.WHERE[c.boundary]);
  const authWord = (a) => (!a ? "" : a.word === "Authorized" ? `Authorized until ${mdy(a.atd)}` : a.word);
  // An export is the kit's to save (K.save: the viewer's Save prompt in the published page, a download from disk, else a copy dialog).
  const csvDown = (name, rows) => { const csv = rows.map((r) => r.map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`).join(",")).join("\n"); if (K.save) K.save(name, csv); else K.toast("This view cannot save a file."); };

  // ════════════════ System: the lists ════════════════
  // Four tabs under System, each a kind of record it lists: the components inside the boundary, the host and providers, the
  // systems it connects to, and the connections. A subsystem is a filter of the first tab. Nothing runs down the side.
  const view = () => Object.assign({ rail: "", q: "", att: "" }, K.get("sys.view", {}));
  const setView = (p) => K.set("sys.view", Object.assign({}, view(), p));
  const oview = (k) => Object.assign({ q: "", att: "" }, (K.get("sys.oview", {}) || {})[k] || {});
  const setO = (k, p) => K.set("sys.oview", Object.assign({}, K.get("sys.oview", {}) || {}, { [k]: Object.assign({}, oview(k), p) }));
  const OUT = { host: "provider", provider: "provider", connected: "connected" }, OROUTE = { provider: "system-providers", connected: "system-connected" };
  const tabNow = () => { const r = V.cur(); return r === "system-providers" ? "provider" : r === "system-connected" ? "connected" : "components"; };
  K.on("k3s.sub", (id) => { setView({ rail: id || "", att: "" }); K.redraw(); });
  K.on("k3s.rail", (id) => { if (OUT[id]) { K.go(OROUTE[OUT[id]]); return; } setView({ rail: id || "", att: "" }); K.go("system"); });
  K.on("k3s.q", (v) => { const t = tabNow(); if (t === "components") setView({ q: v }); else setO(t, { q: v }); K.redraw(); });
  K.on("k3s.att", (id) => { if (id === "noauth") { setO("provider", { att: V.cur() === "system-providers" && oview("provider").att === id ? "" : id, q: "" }); K.go("system-providers"); return; } setView({ att: V.cur() === "system" && view().att === id ? "" : id, rail: "", q: "" }); K.go("system"); });
  K.on("k3s.attc", (id) => { K.set("sys.cview", { q: "", f: id }); K.go("system-connections"); });
  const authInForce = () => { const l = (D.wsx() && V3.fact("authorizations")) || []; const done = l.filter((a) => a.decided); return done.length ? done[done.length - 1] : null; };
  const counts = () => D.S0.memo("sysCounts", () => {
    const ins = D.inside(), out = D.components().filter((c) => c.boundary !== "inside");
    return { inside: ins.length, host: out.filter((c) => c.boundary === "host").length, provider: out.filter((c) => c.boundary === "provider").length, connected: out.filter((c) => c.boundary === "connected").length,
      behind: ins.filter((c) => D.behind(c)).length, noauth: out.filter((c) => c.boundary !== "connected" && D.unauth(c.code)).length, noagr: D.connections().filter(D.noAgr).length, conns: D.connections().length };
  });
  const sysTabs = (on) => { const c = counts(); return K.tabs([{ label: "Components", count: c.inside, route: "system", on: on === "components" }, { label: "Host and providers", count: c.host + c.provider, route: "system-providers", on: on === "provider" }, { label: "Connected systems", count: c.connected, route: "system-connected", on: on === "connected" }, { label: "Connections", count: c.conns, route: "system-connections", on: on === "connections" }], "System"); };
  const primaryFor = (tab, sub) => (tab === "connections" ? K.btn("Add connection", { primary: true, act: "k3s.addConn", arg: "", icon: "plus" }) : tab === "provider" ? K.btn("Add provider", { primary: true, act: "k3s.addProvider", icon: "plus" }) : tab === "connected" ? K.btn("Add connected system", { primary: true, act: "k3s.addExt", icon: "plus" }) : K.btn("Add component", { primary: true, act: "k3s.addComp", arg: sub && !OUT[sub] ? sub : "", icon: "plus" }));
  const sysHead = (sub, tab) => K.head({ title: "System", code: D.wsx() ? SSP.system && SSP.system.code : V3.prog(), actions: K.menu("More", [{ label: "Export components", act: "k3s.export" }, { label: "Export connections", act: "k3s.exportConns" }, D.wsx() && PA.S.ssp ? { label: "System security plan, section 5", go: "ssp" } : null]) + primaryFor(tab, sub) });
  const authCard = () => {
    const a = authInForce(), c = counts();
    if (!a) return `<section class="k3-card k3s-auth"><h2 class="k3-card-t">Authorization</h2><p class="k3s-auth-w">Not authorized yet</p><p class="k3-muted">${plural(c.inside, "component")} inside the boundary.</p></section>`;
    return `<section class="k3-card k3s-auth"><h2 class="k3-card-t">Authorization in force</h2><p class="k3s-auth-w">${K.link(a.type, "authorization")}<span class="k3-muted num">until ${esc(mdy(a.atd))}</span></p><p class="k3-muted">${esc(a.scope)}</p><div class="k3s-auth-f">${K.link(`${plural(c.inside, "component")} in the boundary`, "system-boundary")}${a.conditions && a.conditions.length ? `<span class="k3-muted num">${plural(a.conditions.length, "condition")}</span>` : ""}</div></section>`;
  };
  const attCard = () => { const c = counts(); return K.attention({ rows: [{ label: "Behind its library version", n: c.behind, act: "k3s.att", arg: "behind" }, { label: "Provider with no authorization", n: c.noauth, act: "k3s.att", arg: "noauth" }, { label: "Connections without an agreement", n: c.noagr, act: "k3s.attc", arg: "noagr" }] }); };
  const insideRow = (c, depth) => {
    const cont = D.isContainer(c), lib = D.libOf(c), f = D.findingsOf(c.code).length;
    const desc = [c.code, c.root ? "the system as a whole" : cont ? plural(D.below(c.code).length, "component") : c.unit, lib && lib.behind ? `${plural(lib.behind, "version")} behind` : ""].filter(Boolean).join(" · ");
    return { go: route(c.code), peek: { panel: "k3s-comp", id: c.code }, cells: [depth > 0 ? `<span class="k3s-ind" style="--d:${Math.min(depth, 3)}">${K.name(c.name, desc, "")}</span>` : K.name(c.name, desc, ""), esc(c.kind), cont ? mu(plural([c.code].concat(D.below(c.code)).reduce((n, k) => n + D.itemsOf(k).filter((x) => x.kind !== "Hardware").length, 0), "item")) : D.swLine(c.code) || '<span class="k3-none">—</span>', K.num(D.controlsOf(c.code).length), K.num(D.requirementsOf(c.code).length), f ? K.num(f) : '<span class="k3-none">—</span>', D.ownerOf(c.code) ? K.owner(D.ownerOf(c.code)) : '<span class="k3-none">—</span>'] };
  };
  const outsideRow = (c) => {
    const a = D.provAuth(c.code), n = D.connsOf(c.code).length, ao = esc(c.ao || (D.PROV()[c.code] || {}).ao || "") || '<span class="k3-none">—</span>', peek = { panel: "k3s-comp", id: c.code };
    if (c.boundary === "connected") return { go: route(c.code), peek, cells: [K.name(c.name, c.org || "", ""), D.connsOf(c.code).map((x) => agrWord(x)).join(", ") || '<span class="k3-none">—</span>', K.num(n), ao] };
    const t = D.takeCounts(c.code);
    return { go: route(c.code), peek, cells: [K.name(c.name, c.org || "", ""), esc(c.kind), a && a.word !== "Authorized" ? pill("warn", a.word) : esc(authWord(a)), `<span class="num">${fmt(t.inh)} inherited · ${fmt(t.hyb)} hybrid</span>`, K.num(n), ao] };
  };
  const agrWord = (x) => { const a = x.agr, st = D.agrState(a); if (!D.needsAgr(x)) { const o = D.outsideEnd(x); return o ? mu(`${esc(o.name)}'s authorization`) : mu("Inside the boundary"); } return st === "signed" ? `${esc(a.kind || "Agreement")} · signed${a.exp ? ` · until ${esc(mdy(a.exp))}` : ""}` : st === "notneeded" ? mu("None needed") : st === "expired" ? pill("bad", `${a.kind || "Agreement"} expired`) : st === "draft" ? pill("warn", `${a.kind || "Agreement"} in draft`) : pill("warn", "No agreement"); };
  function listInside(v) {
    const q = v.q.trim().toLowerCase(), hit = (c) => !q || `${c.name} ${c.code} ${c.unit || ""} ${c.kind}`.toLowerCase().includes(q);
    const sub = v.rail && !OUT[v.rail] ? D.component(v.rail) : null;
    const all = D.treeOrder().filter(([c]) => (!sub || D.below(sub.code).includes(c.code)) && hit(c) && (v.att !== "behind" || D.behind(c)));
    const flat = !!q || !!v.att, rows = all.map(([c, d]) => insideRow(c, flat ? 0 : sub ? d - 2 : d));
    if (sub && !q && !v.att) rows.unshift({ group: `<span class="k3s-grp">${K.link(sub.name, route(sub.code))}<span class="k3-muted num">${esc(sub.code)} · ${plural(D.controlsOf(sub.code).length, "control")} · ${plural(D.requirementsOf(sub.code).length, "requirement")}</span></span>` });
    return K.table({ label: "Components", cls: "k3s-list", cols: [{ label: "Component" }, { label: "Kind" }, { label: "Software & firmware", cls: "nw" }, { label: "Controls", cls: "nw" }, { label: "Requirements", cls: "nw" }, { label: "Findings", cls: "nw" }, { label: "Owner" }], rows,
      empty: q || v.att ? { title: "No component matches", line: "Clear the search or the subsystem." } : { title: sub ? `Nothing inside ${sub.name} yet` : "No component yet", line: sub ? "Add the units and software it holds." : "Add the system's subsystems, units and software: everything inside the authorization boundary.", action: K.btn("Add component", { sm: true, act: "k3s.addComp", arg: sub ? sub.code : "" }) },
      foot: `<span class="num">${plural(all.length, "component")}${v.att === "behind" ? " behind the library version" : ""}</span>${v.att ? K.actLink("Show all", "k3s.att", v.att) : ""}` });
  }
  // Outside the boundary: the host system and the providers (one tab: each offers controls), or the connected systems.
  function listOutside(kind) {
    const v = oview(kind), q = v.q.trim().toLowerCase(), con = kind === "connected";
    const rows = D.components().filter((c) => (con ? c.boundary === "connected" : c.boundary === "host" || c.boundary === "provider") && (!q || `${c.name} ${c.kind} ${c.org || ""}`.toLowerCase().includes(q)) && (v.att !== "noauth" || D.unauth(c.code)));
    if (!con) rows.sort((a, b) => (a.boundary === "host" ? 0 : 1) - (b.boundary === "host" ? 0 : 1));
    return K.table({ label: con ? "Connected systems" : "Host and providers", cols: con ? [{ label: "Connected system" }, { label: "Agreement" }, { label: "Connections", cls: "nw" }, { label: "Authorizing official" }] : [{ label: "System" }, { label: "Kind" }, { label: "Authorization" }, { label: "Controls taken", cls: "nw" }, { label: "Connections", cls: "nw" }, { label: "Authorizing official" }], rows: rows.map(outsideRow),
      empty: q || v.att ? { title: "Nothing matches", line: "Clear the search." } : con ? { title: "No connected system", line: "A system outside the boundary that a component exchanges data with.", action: K.btn("Add connected system", { sm: true, act: "k3s.addExt" }) } : { title: "No host system or provider", line: "A system outside the boundary whose controls this one inherits.", action: K.btn("Add provider", { sm: true, act: "k3s.addProvider" }) },
      foot: `<span class="num">${con ? plural(rows.length, "connected system") : `${plural(rows.length, "system")}${v.att === "noauth" ? " with no authorization" : ""}`}</span>${v.att ? K.actLink("Show all", "k3s.att", v.att) : ""}` });
  }
  const viewSeg = (on) => K.seg([{ label: "List", on: on === "list", go: "system" }, { label: "Boundary", on: on === "boundary", go: "system-boundary" }], "View");
  K.screen("system", () => {
    const v = view(), subs = D.subsystems();
    // An older address of the choice (rail: host, provider, connected) opens its tab.
    if (OUT[v.rail]) { const to = OROUTE[OUT[v.rail]]; setTimeout(() => { setView({ rail: "" }); if (V.cur() === "system") K.go(to); }, 0); }
    return K.page({ cls: "k3s", head: sysHead(v.rail, "components"), tabs: sysTabs("components"), body: [K.cards(authCard(), attCard()),
      K.toolbar({ search: { act: "k3s.q", value: v.q, placeholder: "Search components" }, filters: subs.length ? [{ label: "Subsystem", act: "k3s.sub", value: OUT[v.rail] ? "" : v.rail, options: subs.map((s) => [s.code, `${s.name} (${fmt(D.below(s.code).length)})`]) }] : [], right: viewSeg("list") }), listInside(v)] });
  }, "system");
  K.screen("system-providers", () => K.page({ cls: "k3s", head: sysHead("", "provider"), tabs: sysTabs("provider"), body: [K.toolbar({ search: { act: "k3s.q", value: oview("provider").q, placeholder: "Search the host and providers" } }), listOutside("provider")] }), "system");
  K.screen("system-connected", () => K.page({ cls: "k3s", head: sysHead("", "connected"), tabs: sysTabs("connected"), body: [K.toolbar({ search: { act: "k3s.q", value: oview("connected").q, placeholder: "Search connected systems" } }), listOutside("connected")] }), "system");
  K.on("k3s.export", () => { const rows = [["Code", "Component", "Kind", "Where", "Inside", "Controls", "Requirements", "Owner"]].concat(D.components().map((c) => [c.code, c.name, c.kind, D.WHERE[c.boundary], c.parent ? D.nameOf(c.parent) : "", D.controlsOf(c.code).length, c.boundary === "inside" ? D.requirementsOf(c.code).length : "", D.ownerOf(c.code) || ""])); csvDown("system-components.csv", rows); });
  K.on("k3s.exportConns", () => { const rows = [["Id", "Connection", "From", "To", "Interface", "Direction", "Crosses the boundary", "Agreement", "Ports"]].concat(D.connections().map((x) => [x.id, x.name, D.nameOf(x.from), x.to.map(D.nameOf).join("; "), x.iface, x.dir, D.crosses(x) ? "Yes" : "No", x.agr ? `${x.agr.kind || ""} ${x.agr.st || ""}`.trim() : "", D.portsOf(x.id).map((p) => `${p.protocol} ${p.port}`).join("; ")])); csvDown("system-connections.csv", rows); });

  PA.v3s.ui = { route, pill, openModal, addMenu, rowBtn, stop, cname, clink, whereChip, authWord, agrWord, sysHead, sysTabs, viewSeg, view, setView, counts, authInForce, insideRow, csvDown };
})();

// ════════════════ Adding, editing and removing components; connections; the Boundary view ════════════════
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k, V = PA && PA.v2, D = PA && PA.v3s, U = D && D.ui;
  if (!V3 || !K || !V || !D || !U) return;
  const SSP = PA.SSP, esc = K.esc, fmt = K.fmt;
  const { get, set, push, drop } = D.S0;
  const { plural, mdy, clip, mu, uniq, ME, TODAY } = D;
  const { route, pill, rowBtn, stop, clink } = U;
  const cur = () => (location.hash || "#").slice(1);
  const curComp = () => { const m = /^component--(.+?)(?:--(?:overview|software|connections|controls|requirements|findings|components|offered))?$/.exec(cur()); return m ? m[1] : null; };
  const ownerOpts = () => D.people().map((n) => [n, n]);

  // ——— Components ———
  function compForm(code, parentDefault) {
    const c = code ? D.component(code) : null, root = D.rootOf(), insideC = !c || c.boundary === "inside";
    const parents = (root ? [[root.code, `${root.name} (top level)`]] : [["", "Top level"]]).concat(D.inside().filter((x) => !x.root && x.code !== code && (x.kind === "Subsystem" || D.kids(x.code).length) && !(code && D.below(code).includes(x.code))).map((x) => [x.code, x.name]));
    const fields = [{ key: "name", label: "Name", required: true, value: c ? c.name : "" }];
    if (insideC && !(c && c.root)) fields.push({ key: "kind", label: "Kind", type: "select", options: root ? ["Subsystem", "Hardware", "Software"] : ["System", "Subsystem", "Hardware", "Software"], required: true, half: true, value: c ? c.kind : "Hardware" }, { key: "parent", label: "Inside", type: "select", options: parents, required: true, half: true, value: c ? c.parent || parents[0][0] : parentDefault && parents.some((p) => p[0] === parentDefault) ? parentDefault : parents[0][0] }, { key: "unit", label: "Unit number", half: true, value: c ? c.unit || "" : "", hint: "The line-replaceable unit it ships as, if it is one." });
    if (!insideC) fields.push({ key: "org", label: "Organization", half: true, value: c.org || "" }, { key: "ao", label: "Authorizing official", half: true, value: c.ao || "" });
    fields.push({ key: "owner", label: "Owner", type: "select", options: ownerOpts(), half: true, value: c ? c.owner || "" : "", placeholder: "No owner" }, { key: "about", label: "What it is", type: "textarea", rows: 3, value: c ? c.about || "" : "" });
    K.form({ title: c ? "Edit component" : "Add component", submit: c ? "Save component" : "Add component", fields, onSubmit: (v) => {
      if (D.components().some((x) => x.code !== code && x.name.toLowerCase() === v.name.toLowerCase())) return { name: "Another component already has this name." };
      const ch = { name: v.name, owner: v.owner || null, about: v.about || "" };
      if ("kind" in v) Object.assign(ch, { kind: v.kind, parent: v.parent || null, unit: v.unit || null });
      if ("org" in v) Object.assign(ch, { org: v.org || null, ao: v.ao || null });
      if (c) { set("edits", Object.assign({}, get("edits", {}), { [code]: Object.assign({}, get("edits", {})[code] || {}, ch) })); K.redraw(); K.toast(`${v.name} saved`); return null; }
      const nc = D.nextCode(v.kind);
      if (!D.wsx() && D.madeProg() && root) { V.set(`v3.P.${V3.prog()}.el`, D.pRecs("el").concat([{ code: nc, name: v.name, type: v.kind.toLowerCase(), sys: root.code, at: TODAY, by: ME }])); set("edits", Object.assign({}, get("edits", {}), { [nc]: ch })); }
      else push("added", Object.assign({ code: nc, boundary: "inside", root: !root && v.kind === "System" }, ch));
      K.go(route(nc)); K.toast(`${v.name} added${ch.parent ? ` inside ${D.nameOf(ch.parent)}` : ""}`); return null;
    } });
  }
  K.on("k3s.addComp", (parent) => compForm(null, parent || curComp() || ""));
  K.on("k3s.editComp", (code) => compForm(code));
  K.on("k3s.owner", (code) => { const c = D.component(code); if (!c) return; K.form({ title: "Assign owner", submit: "Assign owner", intro: `Who answers for ${esc(c.name)}.`, fields: [{ key: "owner", label: "Owner", type: "select", options: ownerOpts(), value: c.owner || "", placeholder: "No owner" }], onSubmit: (v) => { set("edits", Object.assign({}, get("edits", {}), { [code]: Object.assign({}, get("edits", {})[code] || {}, { owner: v.owner || null }) })); K.redraw(); K.toast(v.owner ? `${v.owner} owns ${c.name}` : `${c.name} has no owner`); } }); });
  K.on("k3s.rmComp", (code) => {
    const c = D.component(code); if (!c) return;
    const all = [code].concat(D.below(code)), nc = D.controlsOf(code).length, nr = c.boundary === "inside" ? D.requirementsOf(code).length : 0, nx = D.connsOf(code).length;
    K.confirm({ title: "Remove component", danger: true, submit: "Remove component", text: `${esc(c.name)} leaves the system${all.length > 1 ? `, with the ${plural(all.length - 1, "component")} inside it` : ""}. ${[nc ? plural(nc, "control placement") : "", nr ? plural(nr, "requirement allocation") : "", nx ? plural(nx, "connection") : ""].filter(Boolean).join(", ") || "Nothing else"} ${nc + nr + nx === 1 ? "goes" : "go"} with it; the controls stay in the baseline and the requirements in the program.`,
      onOk: () => { if (c.boundary === "provider" && (V.get("host.added", []) || []).includes(code)) V.set("host.added", V.get("host.added", []).filter((x) => x !== code)); set("removed", uniq(get("removed", []).concat(all))); K.go(c.parent ? route(c.parent, "components") : "system"); K.toast(`${c.name} removed`); } });
  });
  K.on("k3s.addProvider", () => {
    if (!D.wsx() && D.madeProg() && PA.M["v3p-new"]) { U.openModal("v3p-new", "prov"); return; }
    if (!D.wsx() || !D.H()) { K.form({ title: "Add provider", submit: "Add provider", fields: [{ key: "name", label: "Name", required: true }, { key: "kind", label: "Kind", type: "select", options: ["Host system", "Common control provider", "Enterprise service"], required: true, value: "Common control provider" }, { key: "org", label: "Organization" }], onSubmit: (v) => { const code = K.id("PRV"); push("added", { code, name: v.name, kind: v.kind, boundary: v.kind === "Host system" ? "host" : "provider", parent: null, org: v.org || null }); K.go(route(code)); K.toast(`${v.name} added`); } }); return; }
    const have = new Set(D.components().map((c) => c.code)), hasHost = D.components().some((c) => c.boundary === "host");
    K.pick({ title: "Add provider", search: "Search systems that offer controls", submit: () => "Add provider", empty: "Every provider on record is already one of this system's.",
      items: Object.values(D.PROV()).map((p) => ({ id: p.id, title: p.name, desc: clip(p.about, 150), meta: p.kind, held: have.has(p.id) ? "Added" : p.kind === "Host system" && hasHost ? "Carries other programs" : "" })),
      onPick: (pid) => { V.set("host.added", uniq((V.get("host.added", []) || []).concat([pid]))); set("removed", get("removed", []).filter((x) => x !== pid)); const t = D.H().takes(pid); K.go(route(pid)); K.toast(`${D.PROV()[pid].name} added: ${plural(t.inh, "control")} inherited${t.hyb ? `, ${fmt(t.hyb)} hybrid` : ""}`); } });
  });
  K.on("k3s.addExt", () => K.form({ title: "Add connected system", submit: "Add connected system", intro: "A system outside the boundary that a component exchanges data with. It keeps its own authorization.", fields: [{ key: "name", label: "Name", required: true }, { key: "org", label: "Organization", half: true }, { key: "ao", label: "Authorizing official", half: true }, { key: "about", label: "What it is", type: "textarea", rows: 3 }],
    onSubmit: (v) => { if (D.components().some((x) => x.name.toLowerCase() === v.name.toLowerCase())) return { name: "A system with this name is already here." }; const code = D.nextCode("ext"); push("added", { code, name: v.name, kind: "Connected system", boundary: "connected", parent: null, org: v.org || null, ao: v.ao || null, about: v.about || "" }); K.go(route(code)); K.toast(`${v.name} added as a connected system`); } }));

  // ——— Connections ———
  const cview = () => Object.assign({ q: "", f: "" }, K.get("sys.cview", {}));
  K.on("k3s.cq", (v) => { K.set("sys.cview", Object.assign({}, cview(), { q: v })); K.redraw(); });
  K.on("k3s.cf", (id) => { K.set("sys.cview", Object.assign({}, cview(), { f: id || "" })); K.redraw(); });
  const DIRW = { "Both ways": "Both ways", Outbound: "Outbound", Inbound: "Inbound", Inside: "Inside" };
  const connRow = (x, here) => ({ panel: "k3s-conn", id: x.id, cells: [K.name(x.name, x.iface, ""), here && x.from === here ? mu("This component") : esc(D.nameOf(x.from)), x.to.map((t) => (here && t === here ? mu("This component") : esc(D.nameOf(t)))).join(", "), D.portLine(x.id) || '<span class="k3-none">—</span>', esc(DIRW[x.dir] || x.dir || ""), D.crosses(x) ? "Crosses" : mu("Inside"), U.agrWord(x)] });
  const connCols = [{ label: "Connection" }, { label: "From", cls: "k3s-w" }, { label: "To", cls: "k3s-w" }, { label: "Protocols and ports" }, { label: "Direction", cls: "nw" }, { label: "Boundary", cls: "nw" }, { label: "Agreement" }];
  K.screen("system-connections", () => {
    const v = cview(), all = D.connections(), q = v.q.trim().toLowerCase();
    const F = { "": () => true, cross: D.crosses, inside: (x) => !D.crosses(x), noagr: D.noAgr };
    const rows = all.filter(F[v.f] || F[""]).filter((x) => !q || `${x.name} ${x.id} ${x.iface} ${D.nameOf(x.from)} ${x.to.map(D.nameOf).join(" ")} ${D.portsOf(x.id).map((p) => p.protocol + " " + p.port).join(" ")}`.toLowerCase().includes(q));
    return K.page({ cls: "k3s", head: U.sysHead("", "connections"), tabs: U.sysTabs("connections"), body: [
      K.toolbar({ search: { act: "k3s.cq", value: v.q, placeholder: "Search connections" }, right: K.chips([{ id: "", label: "All", count: all.length, on: !v.f }, { id: "cross", label: "Crosses the boundary", count: all.filter(D.crosses).length, on: v.f === "cross" }, { id: "inside", label: "Inside", count: all.filter((x) => !D.crosses(x)).length, on: v.f === "inside" }, { id: "noagr", label: "Without an agreement", count: all.filter(D.noAgr).length, on: v.f === "noagr" }], "k3s.cf", "Show connections") }),
      K.table({ label: "Connections", cols: connCols, rows: rows.map((x) => connRow(x)), empty: all.length ? { title: "No connection matches", line: "Clear the search or choose All." } : { title: "No connection yet", line: "A connection joins two components, or a component and a system outside the boundary. Its ports and its agreement are kept on it.", action: K.btn("Add connection", { sm: true, act: "k3s.addConn", arg: "" }) }, foot: `<span class="num">${plural(rows.length, "connection")}</span>` })] });
  }, "system");
  const connRoute = (id) => (K.recRoute ? K.recRoute("k3s-conn", id) : "") || "system-connections";
  const endOpts = (skip) => D.components().filter((c) => c.code !== skip).map((c) => [c.code, `${c.name} · ${c.boundary === "inside" ? c.kind.toLowerCase() : D.WHERE[c.boundary].toLowerCase()}`]);
  function connForm(id, fromDefault) {
    const x = id ? D.conn(id) : null;
    K.form({ title: x ? "Edit connection" : "Add connection", submit: x ? "Save connection" : "Add connection", fields: [
      { key: "name", label: "Name", required: true, value: x ? x.name : "", placeholder: "Navigation data bus" },
      { key: "from", label: "From", type: "select", options: endOpts(), required: true, half: true, value: x ? x.from : fromDefault || "" },
      { key: "to", label: "To", type: "select", options: endOpts(), required: true, half: true, value: x ? x.to[0] : "" },
      { key: "iface", label: "Interface", required: true, half: true, value: x ? x.iface : "", placeholder: "Ethernet, MIL-STD-1553B, RF…" },
      { key: "dir", label: "Direction", type: "select", options: ["Both ways", "Outbound", "Inbound"], required: true, half: true, value: x ? (x.dir === "Inside" ? "Both ways" : x.dir) : "Both ways" },
      x ? null : { key: "protocol", label: "Protocol", half: true, placeholder: "TLS 1.3" }, x ? null : { key: "port", label: "Port", half: true, placeholder: "443/tcp" },
      { key: "flows", label: "What it carries", type: "textarea", rows: 2, value: x ? x.flows || "" : "" }].filter(Boolean),
      onSubmit: (v) => {
        if (v.from === v.to) return { to: "Choose a different end: a connection joins two components." };
        if (v.port && !v.protocol) return { protocol: "Name the protocol this port carries." };
        const a = D.component(v.from), b = D.component(v.to);
        if (a.boundary !== "inside" && b.boundary !== "inside") return { to: "One end must be a component inside the boundary." };
        const ch = { name: v.name, from: v.from, to: x && x.to.length > 1 && x.to[0] === v.to ? x.to : [v.to], iface: v.iface, dir: v.dir, flows: v.flows || "" };
        if (x) { set("connEdits", Object.assign({}, get("connEdits", {}), { [id]: Object.assign({}, get("connEdits", {})[id] || {}, ch) })); K.redraw(); K.toast(`${v.name} saved`); return null; }
        const n = get("conns", []).length + 1, nid = "CX-" + String(n + get("connsRm", []).filter((r) => /^CX-/.test(r)).length).padStart(2, "0");
        push("conns", Object.assign({ id: nid, agr: null, ctl: [], owner: ME, added: TODAY }, ch));
        if (v.protocol) push("ports", { id: K.id("PT"), conn: nid, protocol: v.protocol, port: v.port || "n/a", service: v.flows || "", dir: v.dir, ppsm: a.boundary === "inside" && b.boundary === "inside" ? "Not required" : "Not registered" });
        K.redraw(); K.toast(`Connection added: ${a.name} to ${b.name}${D.noAgr(D.conn(nid) || {}) ? ". It needs an agreement." : ""}`, { label: "Open connection", route: connRoute(nid) }); return null;
      } });
  }
  K.on("k3s.addConn", (from) => connForm(null, from || curComp() || ""));
  K.on("k3s.editConn", (id) => connForm(id));
  K.on("k3s.rmConn", (id, el, e) => { stop(e); const x = D.conn(id); if (!x) return; K.confirm({ title: "Remove connection", danger: true, submit: "Remove connection", text: `${esc(x.name)} leaves ${esc(D.nameOf(x.from))} and ${esc(x.to.map(D.nameOf).join(", "))}, with ${plural(D.portsOf(id).length, "port")}${x.agr && x.agr.ref ? ` and its agreement ${esc(x.agr.ref)}` : ""}. It also leaves the Boundary view and section 7 of the SSP.`, onOk: () => { set("connsRm", uniq(get("connsRm", []).concat([id]))); const p = document.getElementById("panel"), c = p && !p.hidden ? document.getElementById("closePanel") : null; if (c) c.click(); if (/^connection--/.test(cur())) K.go("system-connections"); else K.redraw(); K.toast("Connection removed"); } }); });
  K.on("k3s.addPort", (id) => { const x = D.conn(id); if (!x) return; K.form({ title: "Add port", submit: "Add port", intro: `A protocol and port ${esc(x.name)} uses.`, fields: [{ key: "protocol", label: "Protocol", required: true, half: true, placeholder: "HTTPS (TLS 1.3)" }, { key: "port", label: "Port", required: true, half: true, placeholder: "443/tcp" }, { key: "service", label: "Service", placeholder: "What uses it" }, { key: "dir", label: "Direction", type: "select", options: ["Both ways", "Outbound", "Inbound", "Inside"], required: true, half: true, value: x.dir || "Both ways" }, { key: "ppsm", label: "PPSM state", type: "select", options: ["Registered", "Pending", "Not registered", "Not required"], required: true, half: true, value: D.crosses(x) ? "Not registered" : "Not required" }],
    onSubmit: (v) => { if (D.portsOf(id).some((p) => p.protocol.toLowerCase() === v.protocol.toLowerCase() && p.port === v.port)) return { port: "This protocol and port is already on the connection." }; push("ports", Object.assign({ id: K.id("PT"), conn: id }, v)); K.redraw(); K.toast(`${v.protocol} ${v.port} added to ${x.name}`); return null; } }); });
  K.on("k3s.rmPort", ([id, pid], el, e) => { stop(e); const p = D.portsOf(id).find((y) => y.id === pid); if (!p) return; K.confirm({ title: "Remove port", danger: true, submit: "Remove port", text: `${esc(p.protocol)} ${esc(p.port)} leaves ${esc((D.conn(id) || {}).name || "the connection")} and section 9 of the SSP.`, onOk: () => { if (!drop("ports", (y) => y.id === pid)) set("portsRm", uniq(get("portsRm", []).concat([pid]))); K.redraw(); K.toast("Port removed"); } }); });
  const evidenceOpts = () => D.S0.stat("evOpts", () => ((PA.SCTMD && PA.SCTMD.ev) || []).map((e) => [e.id, clip(e.title, 70)]));
  K.on("k3s.agr", (id) => { const x = D.conn(id); if (!x) return; const a = x.agr || {}; K.form({ title: a.ref ? "Change agreement" : "Link agreement", submit: a.ref ? "Save agreement" : "Link agreement", intro: `The agreement that covers ${esc(x.name)} with ${esc((D.outsideEnd(x) || {}).name || "the other system")}.`, fields: [
    { key: "kind", label: "Kind", type: "select", options: [["ISA", "ISA · interconnection security agreement"], ["MOA", "MOA · memorandum of agreement"], ["MOU", "MOU · memorandum of understanding"], ["SLA", "SLA · service level agreement"]], required: true, half: true, value: a.kind || "ISA" },
    { key: "st", label: "State", type: "select", options: ["Signed", "Draft"], required: true, half: true, value: a.st === "Draft" ? "Draft" : "Signed" },
    { key: "ref", label: "Reference", required: true, half: true, value: a.ref || "", placeholder: "ISA-WSX90-…" }, { key: "exp", label: "Expires", type: "date", half: true, value: a.st === "Signed" && a.exp && a.exp >= TODAY ? a.exp : "" },
    { key: "ev", label: "Document or evidence", type: "select", options: evidenceOpts(), value: a.ev || "", placeholder: "Not in the program's evidence yet" }],
    onSubmit: (v) => { if (v.st === "Signed" && v.exp && v.exp < TODAY) return { exp: "This day has passed: a signed agreement expires later." }; set("agr", Object.assign({}, get("agr", {}), { [id]: { kind: v.kind, st: v.st, ref: v.ref, signed: v.st === "Signed" ? TODAY : null, exp: v.exp || null, ev: v.ev || null, by: ME } })); K.redraw(); K.toast(v.st === "Signed" ? `${v.ref} linked: ${x.name} is covered` : `${v.ref} linked as a draft`); return null; } }); });
  K.on("k3s.noAgr", (id) => { const x = D.conn(id); if (!x) return; K.form({ title: "No agreement needed", submit: "Record the reason", fields: [{ key: "why", label: "Why", type: "textarea", rows: 3, required: true, hint: "It is kept on the connection and shown in section 7 of the SSP." }], onSubmit: (v) => { set("agr", Object.assign({}, get("agr", {}), { [id]: { kind: "", st: "Not required", why: v.why, by: ME } })); K.redraw(); K.toast(`${x.name}: no agreement needed`); return null; } }); });
  const ctlPanel = () => (PA.P["k3c-control"] ? "k3c-control" : "k3s-ctl");
  // A connection is a record with a page (connection--<id>, drawn by the kit from this definition) and a preview (the eye).
  // The page has room for what the preview folds: the service of each port in its own column, and the components it joins.
  K.panel("k3s-conn", (id, o) => {
    const x = D.conn(id); if (!x) return null;
    const page = !!(o && o.page), NONE = '<span class="k3-none">—</span>';
    const st = D.agrState(x.agr), needs = D.needsAgr(x), out = D.outsideEnd(x), ports = D.portsOf(id), a = x.agr || {};
    const chip = !D.crosses(x) ? pill("none", "Inside the boundary") : !needs ? pill("none", "Crosses the boundary") : st === "signed" ? pill("ok", "Agreement signed") : st === "notneeded" ? pill("none", "No agreement needed") : st === "expired" ? pill("bad", "Agreement expired") : st === "draft" ? pill("warn", "Agreement in draft") : pill("warn", "No agreement");
    const agrBody = !D.crosses(x) ? `<p class="k3-muted">Both ends are inside the boundary: the authorization covers it.</p>`
      : !needs ? `<p class="k3-muted">${clink(out.code)} keeps its own authorization${D.provAuth(out.code) ? `: ${esc(U.authWord(D.provAuth(out.code)))}` : ""}. No interconnection agreement applies.</p>`
        : st === "notneeded" ? K.facts([["State", "None needed"], ["Why", esc(a.why || "")]])
          : a.ref || a.kind ? K.facts([["Agreement", `${esc(a.kind || "")}${a.ref ? ` <span class="k3-code">${esc(a.ref)}</span>` : ""}`], ["State", st === "signed" ? "Signed" : st === "expired" ? "Expired" : "Draft"], a.signed ? ["Signed", esc(mdy(a.signed))] : null, a.exp ? ["Expires", esc(mdy(a.exp))] : null, a.interim ? ["Interim approval until", esc(mdy(a.interim))] : null, page && out ? ["With", clink(out.code)] : null, page && x.org ? ["Organization", esc(x.org)] : null, page && x.ao ? ["Its authorizing official", esc(x.ao)] : null])
            : `<div class="k3-none-row"><span>No agreement covers this connection yet.</span>${K.actLink("Link agreement", "k3s.agr", id)}</div>`;
    const agrActs = needs ? `${st !== "notneeded" && st !== "signed" && page ? K.btn("No agreement needed", { sm: true, quiet: true, act: "k3s.noAgr", arg: id }) : ""}${st !== "signed" || page ? K.btn(a.ref ? "Change agreement" : "Link agreement", { sm: true, act: "k3s.agr", arg: id }) : ""}` : "";
    const ends = uniq(D.endsOf(x).concat(x.via || [])).filter((e) => D.component(e));
    const role = (e) => (e === x.from ? "From" : x.to.includes(e) ? "To" : "Through");
    return { label: "Connection", title: x.name, code: x.id, chip,
      crumbs: [["System", "system"], ["Connections", "system-connections"], [x.name]],
      sub: `<span class="k3s-line">${clink(x.from)}<span class="dot" aria-hidden="true">${x.dir === "Inbound" ? "←" : x.dir === "Outbound" ? "→" : "↔"}</span><span>${x.to.map(clink).join(", ")}</span>${x.iface ? `<span class="dot" aria-hidden="true">·</span><span>${esc(x.iface)}</span>` : ""}</span>`,
      actions: K.btn("Add port", { sm: true, primary: true, act: "k3s.addPort", arg: id, icon: "plus" }) + K.menu("More", [{ label: "Edit connection", act: "k3s.editConn", arg: id }, needs ? { label: a.ref ? "Change agreement" : "Link agreement", act: "k3s.agr", arg: id } : null, needs && st !== "notneeded" ? { label: "No agreement needed", act: "k3s.noAgr", arg: id } : null, { label: "Remove connection", act: "k3s.rmConn", arg: id, danger: true }], { sm: true }),
      facts: [page ? null : ["From", clink(x.from)], page ? null : ["To", x.to.map(clink).join(", ")], !page && (x.via || []).length ? ["Through", x.via.map(clink).join(", ")] : null, ["Interface", esc(x.iface || "")], ["Direction", esc(x.dir || "")], ["Boundary", D.crosses(x) ? "Crosses it" : "Stays inside"], x.flows ? ["Carries", esc(x.flows)] : null, x.cls && page ? ["Classification", esc(x.cls)] : null, x.enc ? ["Encryption", `${esc(x.enc)}${x.encBy ? ` ${mu(esc(x.encBy))}` : ""}`] : null, x.owner ? ["Owner", K.owner(x.owner)] : null],
      sections: [
        K.related({ title: "Ports and protocols", add: { label: "Add port", act: "k3s.addPort", arg: id }, empty: "No port recorded on this connection",
          cols: page ? [{ label: "Protocol" }, { label: "Port", cls: "nw" }, { label: "Service" }, { label: "Direction", cls: "nw" }, { label: "PPSM state" }, { label: "", cls: "tight" }] : [{ label: "Protocol" }, { label: "Port", cls: "nw" }, { label: "Direction", cls: "nw" }, { label: "PPSM" }, { label: "", cls: "tight" }],
          rows: ports.map((p) => ({ cells: page ? [K.name(p.protocol, "", ""), K.num(p.port), p.service ? esc(p.service) : NONE, esc(p.dir || ""), p.ppsm ? esc(p.ppsm) : NONE, rowBtn("Remove", "k3s.rmPort", [id, p.id], `Remove ${p.protocol} ${p.port}`)] : [K.name(p.protocol, p.service || "", ""), K.num(p.port), esc(p.dir || ""), esc(p.ppsm || ""), rowBtn("Remove", "k3s.rmPort", [id, p.id], `Remove ${p.protocol} ${p.port}`)] })) }),
        K.section({ title: "Agreement", actions: agrActs, body: agrBody }),
        (x.ctl || []).length ? K.related({ title: "Controls it bears on", cols: [{ label: "Control" }, { label: "Status" }], rows: x.ctl.filter(D.inBaseline).map((c) => ({ panel: ctlPanel(), id: PA.P["k3c-control"] ? c : `${c}@${x.from}`, cells: [K.name(D.titleOf(c), "", c), K.status(D.statusOf(c))] })) }) : "",
        page ? K.related({ title: "Components it joins", cols: [{ label: "Component" }, { label: "End", cls: "nw" }, { label: "Kind" }, { label: "Where" }], rows: ends.map((e) => { const c = D.component(e); return { go: route(e), peek: { panel: "k3s-comp", id: e }, cells: [K.name(c.name, c.boundary === "inside" ? c.code : c.org || "", ""), esc(role(e)), esc(c.kind), esc(D.WHERE[c.boundary])] }; }) }) : ""] };
  });

  // ——— The Boundary view: whatever is in the bubble is what the authorization covers ———
  const S5 = SSP.sec ? SSP.sec("s5") : null, S5_ORIG = S5 && S5.text ? S5.text.slice() : null;
  const syncS5 = () => { if (!S5 || !S5_ORIG) return; const t = K.get("sys.boundaryText", null); S5.text = t ? String(t).split(/\n{2,}/) : S5_ORIG.slice(); };
  V.on(syncS5); V3.ready(syncS5);
  const oneWord = (t) => String(t).replace(/\bElements\b/g, "Components").replace(/\belements\b/g, "components").replace(/\bElement\b/g, "Component").replace(/\belement\b/g, "component");
  const boundaryText = () => (D.wsx() ? get("boundaryText", null) || (S5_ORIG ? oneWord(S5_ORIG.join("\n\n")) : "") : get("boundaryText", ""));
  K.on("k3s.bText", () => K.form({ title: "Edit the boundary's description", submit: "Save description", intro: D.wsx() ? "The same text as section 5 of the system security plan." : "What is inside the boundary and what stays outside it.", fields: [{ key: "text", label: "Description", type: "textarea", rows: 6, required: true, value: boundaryText() }], onSubmit: (v) => { set("boundaryText", v.text); K.redraw(); K.toast(D.wsx() ? "Description saved here and in section 5 of the SSP" : "Description saved"); return null; } }));
  const extTitle = (id) => D.S0.stat("ext:" + id, () => { try { return D.txt(D.parse(V3.force(false, () => PA.P["v2h-ext"](id).body)).querySelector("h1, h2, h3, h4, .ak-rh-t, b")) || null; } catch (e) { return null; } });
  const bndReview = () => V.get("v3.G.bnd", null);
  function bubble(key) {
    const root = D.rootOf(), ins = D.inside();
    const rows = (root ? D.kids(root.code) : ins.filter((c) => !c.parent)).slice();
    if (!rows.length && root) rows.push(root);
    const conns = D.connections(), auths = (D.wsx() && V3.fact("authorizations")) || [];
    const A = key === "iatt" ? auths.find((a) => a.id === "iatt-2") : key === "blk" ? auths.find((a) => a.id === "ato-2") : U.authInForce();
    const cap = !D.wsx() ? [root ? root.name : "This system", "Not authorized yet"] : key === "blk" ? ["Increment 2 · Block 1.1", `Design boundary${A && A.planned ? ` · ATO planned ${mdy(A.planned)}` : ""}`] : key === "iatt" ? [A ? `${A.type} · Increment ${A.inc} test configuration` : "IATT", A ? (A.decided ? `Signed ${mdy(A.decided)}${A.atd ? ` · until ${mdy(A.atd)}` : ""}` : `Planned ${mdy(A.planned)}`) : ""] : A ? [`${A.type.replace(/ with conditions$/, "")} · Increment ${A.inc} · Block 1`, `${/conditions/.test(A.type) ? "Authorized with conditions" : "Authorized"} ${mdy(A.decided)} · until ${mdy(A.atd)}`] : ["This system", "Not authorized yet"];
    const provs = D.components().filter((c) => c.boundary === "host" || c.boundary === "provider");
    const box = (c, sub, cls) => `<a class="k3s-box${cls ? " " + cls : ""}" href="#${esc(route(c.code))}"><b>${esc(c.name)}</b><span>${sub}</span></a>`;
    const wire = (x, label, off) => `<a class="k3s-wire${off ? " off" : ""}" href="#${esc(connRoute(x.id))}" data-conn="${esc(x.id)}" title="${esc(x.name)}: ${esc(D.nameOf(x.from))} to ${esc(x.to.map(D.nameOf).join(", "))}"><span>${esc(label)}</span></a>`;
    const short = (s) => String(s || "").replace(/ data bus$| aircraft–store interface$/i, "");
    const fam = (r) => new Set([r.code].concat(D.below(r.code)));
    const out = [];
    out.push(`<div class="k3s-bd-l"><div class="k3s-bd-h">Host system and providers</div>${provs.length ? provs.map((p) => box(p, `${esc(p.kind)} · ${D.unauth(p.code) ? "not authorized" : esc(U.authWord(D.provAuth(p.code)) || "its own authorization")}`, D.unauth(p.code) ? "warn" : "")).join("") : `<p class="k3-muted">No host system or provider.</p>`}</div>`);
    const mid = [`<div class="k3s-cap"><span class="k3s-bd-h">Authorization boundary</span><b>${esc(cap[0])}</b><span class="k3-muted">${esc(cap[1])}</span></div>`];
    rows.forEach((r) => {
      const f = fam(r), mine = conns.filter((x) => D.endsOf(x).some((e) => f.has(e)));
      const left = mine.filter((x) => { const o = D.outsideEnd(x); return o && o.boundary !== "connected"; }), right = mine.filter((x) => { const o = D.outsideEnd(x); return o && o.boundary === "connected"; });
      const n = D.below(r.code).length, chg = key !== "ato" ? [r.code].concat(D.below(r.code)).filter((k) => D.itemsOf(k).some((i) => i.proposed)).length : 0;
      mid.push(`<div class="k3s-row"><div class="k3s-wl">${left.map((x) => wire(x, provs.length > 1 ? `${short(x.iface)}` : short(x.iface))).join("")}</div>${box(r, `${n ? plural(n, "component") : esc(r.kind)}${chg ? ` · ${fmt(chg)} changed in Block 1.1` : ""}`)}<div class="k3s-wr">${right.map((x) => { const o = D.outsideEnd(x), off = key === "iatt" && x.id === "IC-105"; return `<div class="k3s-pair">${wire(x, x.iface, off)}${box(o, off ? "Not in the test configuration" : D.noAgr(x) ? "No agreement in force" : esc(x.iface), off ? "off" : D.noAgr(x) ? "warn" : "")}</div>`; }).join("")}</div></div>`);
    });
    if (key === "iatt" && D.wsx() && extTitle("fti")) mid.push(`<div class="k3s-row"><div class="k3s-wl"></div><button type="button" class="k3s-box test" data-panel="v2h-ext" data-id="fti"><b>${esc(extTitle("fti"))}</b><span>Test only</span></button><div class="k3s-wr">${extTitle("range") ? `<div class="k3s-pair"><span class="k3s-wire"><span>RF telemetry</span></span><button type="button" class="k3s-box" data-panel="v2h-ext" data-id="range"><b>${esc(extTitle("range"))}</b><span>Test only</span></button></div>` : ""}</div></div>`);
    const inner = conns.filter((x) => !D.crosses(x));
    if (inner.length) mid.push(`<div class="k3s-inner"><span class="k3s-bd-h">Connections inside the boundary</span><div class="k3s-inner-l">${inner.map((x) => `<a class="k3s-ilink" href="#${esc(connRoute(x.id))}" data-conn="${esc(x.id)}"><b>${esc(D.nameOf(x.from))}</b><span aria-hidden="true">↔</span><b>${esc(x.to.map(D.nameOf).join(", "))}</b><span class="k3-muted">${esc(x.iface || "")}</span></a>`).join("")}</div></div>`);
    out.push(`<div class="k3s-bub" role="group" aria-label="Inside the authorization boundary">${mid.join("")}</div>`);
    return `<div class="k3s-bd" data-auth="${esc(key)}">${out.join("")}</div>`;
  }
  function boundaryPage(r) {
    const key = /--iatt$/.test(r) ? "iatt" : /--blk$/.test(r) ? "blk" : "ato", text = boundaryText(), b = bndReview();
    const seg = D.wsx() ? K.seg([{ label: "ATO", on: key === "ato", go: "system-boundary" }, { label: "Block 1.1", on: key === "blk", go: "system-boundary--blk" }, { label: "IATT", on: key === "iatt", go: "system-boundary--iatt" }], "Authorization") : "";
    const review = key === "blk" && D.wsx() && PA.M["v3g-bndreq"] ? K.next({ label: "SCA boundary review", text: !b ? "The lead assessor reviews the Block 1.1 design boundary before PDR decides." : b.state === "requested" ? `Requested ${esc(mdy(b.at))} by ${esc(b.by)}: it waits on D. Okafor.` : b.state === "accepted" ? `Reviewed ${esc(mdy(b.at))} by D. Okafor${b.note ? `: ${esc(b.note)}` : ""}.` : `Changes requested ${esc(mdy(b.at))} by D. Okafor: ${esc(b.note || "")}`, action: !b || b.state === "changes" ? K.btn(b ? "Request the review again" : "Request the SCA's review", { sm: true, primary: true, act: "k3s.modal", arg: ["v3g-bndreq", "blk"] }) : b.state === "requested" ? K.btn("Record the review", { sm: true, act: "k3s.modal", arg: ["v3g-bndrec", "blk"] }) : "" }) : "";
    return K.page({ cls: "k3s", head: U.sysHead("", "components"), tabs: U.sysTabs("components"), body: [
      `<div class="k3-tools">${seg}<div class="k3-tools-r">${U.viewSeg("boundary")}</div></div>`,
      `<div class="k3s-btext">${text ? `<p>${esc(text).replace(/\n{2,}/g, "</p><p>")}</p>` : `<p class="k3-muted">No description of the boundary yet.</p>`}${K.actLink(text ? "Edit description" : "Add description", "k3s.bText")}</div>`,
      review, bubble(key)] });
  }
  K.on("k3s.modal", ([key, id]) => U.openModal(key, id));
  K.screen("system-boundary", boundaryPage, "system");
  K.screen("system-boundary--blk", boundaryPage, "system");
  K.screen("system-boundary--iatt", boundaryPage, "system");

  Object.assign(U, { cur, curComp, compForm, connRow, connCols, connRoute, ctlPanel, ownerOpts });
})();

// ════════════════ The component's record: the work is done here ════════════════
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k, V = PA && PA.v2, D = PA && PA.v3s, U = D && D.ui;
  if (!V3 || !K || !V || !D || !U || !U.curComp) return;
  const SSP = PA.SSP, esc = K.esc, fmt = K.fmt;
  const { get, set, push, drop, pairAdd, pairDrop } = D.S0;
  const { plural, mdy, clip, mu, uniq, natural, ME, TODAY } = D;
  const { route, pill, rowBtn, stop, clink, curComp, ctlPanel } = U;
  const NONE = '<span class="k3-none">—</span>';
  const TABS = "overview|software|connections|controls|requirements|findings|components|offered";
  const RE = new RegExp(`^component--(.+?)(?:--(${TABS}))?$`);
  const tabKey = (code, tab) => code + ":" + tab;
  const tabState = (code, tab) => Object.assign({ fam: "", q: "", f: "" }, (K.get("sys.tab", {}) || {})[tabKey(code, tab)] || {});
  const setTab = (code, tab, p) => K.set("sys.tab", Object.assign({}, K.get("sys.tab", {}) || {}, { [tabKey(code, tab)]: Object.assign({}, tabState(code, tab), p) }));
  const here = () => { const m = RE.exec(U.cur()); return m ? [m[1], m[2] || "overview"] : [null, null]; };
  K.on("k3s.tq", (v) => { const [c, t] = here(); if (c) { setTab(c, t, { q: v }); K.redraw(); } });
  K.on("k3s.tfam", (id) => { const [c, t] = here(); if (c) { setTab(c, t, { fam: id || "" }); K.redraw(); } });
  K.on("k3s.tf", (id) => { const [c, t] = here(); if (c) { setTab(c, t, { f: id || "" }); K.redraw(); } });
  K.on("k3s.goTab", ([code, tab, f]) => { setTab(code, tab, { f: f || "", fam: "", q: "" }); K.go(route(code, tab)); });
  const reqPanel = () => V3.fact("reqPanel") || "k3s-req";
  // Lane D keeps the requirement records: with it in the build a requirement is created, mapped and unmapped through it, so the
  // control's panel and the Requirements register read the same links (it writes this lane's lists too). Falsy: do it here.
  const dOp = (name, ...a) => { if (!D.wsx() || typeof V3.facts[name] !== "function") return null; try { return V3.fact(name, ...a) || null; } catch (e) { return null; } };
  const sevKind = (s) => (s === "critical" || s === "high" ? "bad" : s === "moderate" ? "warn" : "none");
  const two = (a, b, warn) => `<span class="k3s-two"><span>${a}</span>${b ? `<small${warn ? ' class="warn"' : ""}>${b}</small>` : ""}</span>`;
  const respCell = (ctl) => { const r = D.respOf(ctl); return two(esc(D.respWord(r)), r.providerId && D.unauth(r.providerId) ? "Provider not authorized" : "", true); };

  // ——— Software, firmware and hardware ———
  function itemForm(comp, id, kind) {
    const c = D.component(comp), it = id ? D.itemsOf(comp).find((x) => x.id === id) : null; if (!c) return;
    K.form({ title: it ? "Edit item" : kind === "Hardware" ? "Add hardware" : "Add software or firmware", submit: it ? "Save item" : "Add item", fields: [
      { key: "kind", label: "Kind", type: "select", options: ["Software", "Firmware", "Hardware"], required: true, half: true, value: it ? it.kind : kind || "" },
      { key: "version", label: kind === "Hardware" || (it && it.kind === "Hardware") ? "Part or unit number" : "Version", required: true, half: true, value: it ? it.version : "" },
      { key: "name", label: "Name", required: true, value: it ? it.name : "" },
      { key: "supplier", label: "Supplier", half: true, value: it ? it.supplier || "" : "" },
      D.wsx() ? { key: "baseline", label: "Baseline", type: "select", options: ["Block 1", "Block 1.1 proposed"], required: true, half: true, value: it ? it.baseline || "Block 1" : "Block 1.1 proposed" } : { key: "baseline", label: "Baseline", half: true, value: it ? it.baseline || "" : "" },
      { key: "note", label: "What it does", type: "textarea", rows: 3, value: it ? it.note || "" : "" }],
      onSubmit: (v) => {
        if (D.itemsOf(comp).some((x) => x.id !== id && x.name.toLowerCase() === v.name.toLowerCase() && x.version === v.version)) return { name: "This item and version is already on the component." };
        const ch = { name: v.name, kind: v.kind, version: v.version, supplier: v.supplier || "", baseline: v.baseline || "", note: v.note || "", proposed: /proposed/i.test(v.baseline || "") };
        if (it) { set("itemEdits", Object.assign({}, get("itemEdits", {}), { [id]: Object.assign({}, get("itemEdits", {})[id] || {}, ch) })); K.redraw(); K.toast(`${v.name} ${v.version} saved`); return null; }
        push("items", Object.assign({ id: K.id("IT"), comp, by: ME, at: TODAY }, ch)); K.redraw(); K.toast(`${v.kind} added to ${c.name}: ${v.name} ${v.version}`); return null;
      } });
  }
  K.on("k3s.addItem", ([comp, kind]) => itemForm(comp, null, kind || ""));
  K.on("k3s.editItem", ([comp, id], el, e) => { stop(e); itemForm(comp, id); });
  K.on("k3s.rmItem", ([comp, id], el, e) => { stop(e); const it = D.itemsOf(comp).find((x) => x.id === id); if (!it) return; K.confirm({ title: "Remove item", danger: true, submit: "Remove item", text: `${esc(it.name)} ${esc(it.version)} leaves ${esc(D.nameOf(comp))}${it.sbom ? ", with its SBOM" : ""}, and section 8 of the SSP.`, onOk: () => { if (!drop("items", (x) => x.id === id)) set("itemsRm", uniq(get("itemsRm", []).concat([id]))); K.redraw(); K.toast(`${it.name} ${it.version} removed`); } }); });

  // ——— Controls ———
  K.on("k3s.addCtl", (comp) => {
    const c = D.component(comp); if (!c) return; const have = new Set(D.direct(comp));
    const fams = (SSP.families || []).map((f) => f.f), items = SSP.controls.filter((x) => D.inBaseline(x.c)).slice().sort((a, b) => fams.indexOf(a.f) - fams.indexOf(b.f) || natural(a.c, b.c)).map((x) => ({ id: x.c, title: x.t, code: x.c, group: `${x.f} · ${D.famName(x.f)}`, held: have.has(x.c) ? "Already here" : "", meta: D.statusOf(x.c) }));
    K.pick({ title: `Add controls to ${c.name}`, multi: true, search: "Search the baseline's controls", submit: (n) => (n ? `Add ${plural(n, "control")}` : "Add controls"), items, empty: "The baseline has no control yet.",
      onPick: (ids) => { ids.forEach((k) => D.place(comp, k)); K.redraw(); K.toast(`${plural(ids.length, "control")} added to ${c.name}: ${ids.slice(0, 3).join(", ")}${ids.length > 3 ? "…" : ""}`); } });
  });
  K.on("k3s.rmCtl", ([comp, ctl], el, e) => { stop(e); const others = D.componentsOf(ctl).filter((x) => x !== comp).length, wr = D.written(ctl, comp) && !D.implOf(ctl, comp).fromSsp; K.confirm({ title: "Remove control from this component", danger: true, submit: "Remove control", text: `${esc(ctl)} ${esc(D.titleOf(ctl))} leaves ${esc(D.nameOf(comp))}${wr ? ", with the implementation written for it here" : ""}. It stays in the baseline${others ? ` and on ${plural(others, "other component")}` : ", placed on no component"}.`, onOk: () => { D.unplace(comp, ctl); K.redraw(); K.toast(`${ctl} removed from ${D.nameOf(comp)}`); } }); });
  K.on("k3s.impl", ([ctl, comp], el, e) => { stop(e); const c = D.component(comp), cur = D.implOf(ctl, comp); if (!c) return; K.form({ title: `${ctl} on ${c.name}`, submit: "Save implementation", intro: `How ${esc(c.name)} implements ${esc(ctl)} ${esc(D.titleOf(ctl))}.`, fields: [{ key: "status", label: "Implementation status", type: "select", options: ["Implemented", "Partially implemented", "Planned", "Not implemented"], required: true, value: ["Implemented", "Partially implemented", "Planned", "Not implemented"].includes(cur.status) ? cur.status : /partial/i.test(cur.status || "") ? "Partially implemented" : "Implemented" }, { key: "text", label: "Implementation", type: "textarea", rows: 9, required: true, value: cur.text || "" }], onSubmit: (v) => { D.setImpl(ctl, comp, { status: v.status, text: v.text, by: ME, at: TODAY }); K.redraw(); K.toast(`Implementation of ${ctl} on ${c.name} saved`); return null; } }); });
  K.on("k3s.resp", (ctl, el, e) => {
    stop(e); const Hh = D.H(), r = Hh && Hh.resp ? Hh.resp(ctl) : null; if (!r) return;
    if (!r.offer) { K.toast(`No provider of this system offers ${ctl}: it stays this system's own.`); return; }
    const pname = (D.PROV()[r.pid] || {}).name || "the provider";
    K.form({ title: `Change responsibility of ${ctl}`, submit: "Change responsibility", intro: `${esc(pname)} offers ${esc(ctl)} ${esc(D.titleOf(ctl))} as ${esc(r.def.toLowerCase())}. Inherited, its status is the provider's; hybrid, the status stays this system's.`, fields: [
      { key: "kind", label: "Responsibility", type: "select", options: [["Inherited", `Inherited from ${pname}`], ["Hybrid", `Hybrid with ${pname}`], ["System-specific", "This system"]], required: true, value: r.kind },
      { key: "part", label: "This system's part", type: "textarea", rows: 2, value: r.own || (r.offer && r.offer.own) || "", hint: "For hybrid: one line on what this system still does." },
      { key: "reason", label: "Reason", type: "textarea", rows: 2, required: true }],
      onSubmit: (v) => {
        if (v.kind === r.kind && (v.kind !== "Hybrid" || v.part === r.own)) return { kind: "Choose a different responsibility, or change this system's part." };
        if (v.kind === "Hybrid" && !v.part) return { part: "Say what this system still does for it." };
        const same = r.def === v.kind && !(v.kind === "Hybrid" && v.part && v.part !== (r.offer || {}).own);
        V.set("host.resp." + ctl, same ? null : { kind: v.kind, part: v.kind === "Hybrid" ? v.part : null, reason: v.reason, by: ME, at: TODAY });
        if (Hh.apply) Hh.apply();
        K.redraw(); K.toast(`${ctl} is now ${v.kind === "System-specific" ? "this system's own" : v.kind === "Inherited" ? `inherited from ${pname}` : `hybrid with ${pname}`}`); return null;
      } });
  });
  K.panel("k3s-ctl", (id) => {
    const [ctl, comp] = String(id).split("@"), rec = D.ctlRec(ctl), c = comp ? D.component(comp) : null; if (!rec) return null;
    const r = D.respOf(ctl), isProv = c && c.boundary !== "inside", im = c && !isProv ? D.implOf(ctl, comp) : null, placed = D.componentsOf(ctl), offer = isProv && D.H() && D.H().resp ? D.H().resp(ctl).offer : null;
    const reqs = c && !isProv ? D.requirementsOf(comp).filter((q) => D.reqCtls(q).includes(ctl)) : [];
    const onHere = c && !isProv && D.direct(comp).includes(ctl);
    return { label: c ? `Control on ${c.name}` : "Control", title: rec.t, code: ctl, chip: K.status(D.statusOf(ctl)),
      actions: (c && !isProv ? K.btn(im && im.text ? "Edit implementation" : "Write implementation", { sm: true, primary: true, act: "k3s.impl", arg: [ctl, comp] }) : K.btn("Change responsibility", { sm: true, primary: true, act: "k3s.resp", arg: ctl })) + K.menu("More", [c && !isProv ? { label: "Change responsibility", act: "k3s.resp", arg: ctl } : null, onHere ? { label: "Remove from this component", act: "k3s.rmCtl", arg: [comp, ctl], danger: true } : null], { sm: true }),
      facts: [["Family", `${esc(rec.f)} · ${esc(D.famName(rec.f))}`], ["Responsibility", `${esc(D.respWord(r))}${r.providerId && D.unauth(r.providerId) ? ` ${mu("· the provider is not authorized")}` : ""}`], r.kind === "Hybrid" && r.part ? ["This system's part", esc(r.part)] : null, ["Placed on", placed.length ? placed.slice(0, 6).map(clink).join(", ") + (placed.length > 6 ? ` ${mu("and " + (placed.length - 6) + " more")}` : "") : mu("No component")]],
      sections: [
        isProv ? K.section({ title: `What ${c.name} does`, body: `<p class="k3s-prose">${esc(offer ? offer.prov : "It offers nothing for this control.")}</p>` })
          : c ? K.section({ title: `Implementation on ${c.name}`, actions: im.text ? K.tagged(im.status || "Written") : "", body: im.text ? `<p class="k3s-prose">${esc(im.text)}</p>${im.fromSsp ? `<p class="k3-muted">From the control's implementation in the system security plan, which names this component.</p>` : im.at ? `<p class="k3-muted">Written ${esc(mdy(im.at))}${im.by ? ` by ${esc(im.by)}` : ""}.</p>` : ""}` : `<div class="k3-none-row"><span>Nothing is written for this component yet.</span>${K.actLink("Write implementation", "k3s.impl", [ctl, comp])}</div>` }) : "",
        c && !isProv ? K.related({ title: "Requirements here that map it", empty: "No requirement allocated here maps this control", add: { label: "Add requirement", act: "k3s.addReq", arg: [comp, ctl] }, cols: [{ label: "Requirement" }], rows: reqs.map((q) => ({ panel: reqPanel(), id: reqPanel() === "k3s-req" ? `${q}@${comp}` : q, cells: [K.name(D.reqRec(q).title, "", q)] })) }) : ""] };
  });

  // ——— Requirements ———
  function reqForm(comp, ctl0) {
    const c = D.component(comp); if (!c) return; const own = D.controlsOf(comp), pool = own.length ? own : SSP.controls.map((x) => x.c).filter(D.inBaseline);
    K.form({ title: "Create requirement", submit: "Create requirement", intro: `It is allocated to ${esc(c.name)} and joins the program's requirements as a draft.`, fields: [{ key: "title", label: "Title", required: true }, { key: "statement", label: "Statement", type: "textarea", rows: 4, required: true, placeholder: `${c.name} shall…` }, { key: "ctl", label: "Control it maps", type: "select", options: pool.map((k) => [k, `${k} ${D.titleOf(k)}`]), required: true, value: ctl0 || "", hint: own.length ? "From the controls placed on this component." : "No control is placed here yet: choose from the baseline." }],
      onSubmit: (v) => { let code = dOp("createRequirement", { title: v.title, statement: v.statement, controls: [v.ctl], components: [comp] }); if (!code) { code = D.nextReq(); push("reqs", { code, title: v.title, statement: v.statement, by: ME, at: TODAY, state: "Draft" }); pairAdd("maps", code, v.ctl); pairAdd("alloc", comp, code); } K.redraw(); K.toast(`${code} created on ${c.name}, mapped to ${v.ctl}`); return null; } });
  }
  K.on("k3s.addReq", (arg) => {
    const [comp, ctl0] = Array.isArray(arg) ? arg : [arg, ""], c = D.component(comp); if (!c) return; const have = new Set(D.directReqs(comp));
    K.pick({ title: `Add requirements to ${c.name}`, multi: true, search: "Search the program's requirements", submit: (n) => (n ? `Allocate ${plural(n, "requirement")}` : "Allocate requirements"), create: { label: "Create requirement", onCreate: () => reqForm(comp, ctl0) }, empty: "The program has no requirement yet: create the first.",
      items: D.allReqs().map((q) => { const r = D.reqRec(q); return { id: q, title: r.title, code: q, desc: clip(r.statement, 130), meta: D.reqCtls(q).slice(0, 3).join(", "), held: have.has(q) ? "Already here" : "" }; }),
      onPick: (ids) => { ids.forEach((q) => D.allocate(comp, q)); K.redraw(); K.toast(`${plural(ids.length, "requirement")} allocated to ${c.name}`); } });
  });
  K.on("k3s.rmReq", ([comp, q], el, e) => { stop(e); const r = D.reqRec(q); if (!r) return; const left = D.reqEls(q).filter((x) => x !== comp).length; K.confirm({ title: "Remove allocation", danger: true, submit: "Remove allocation", text: `${esc(q)} ${esc(r.title)} is no longer allocated to ${esc(D.nameOf(comp))}. The requirement stays in the program${left ? `, allocated to ${plural(left, "other component")}` : ", allocated to no component"}.`, onOk: () => { D.unallocate(comp, q); K.redraw(); K.toast(`${q} no longer allocated to ${D.nameOf(comp)}`); } }); });
  K.on("k3s.reqMap", ([q, comp]) => { const have = new Set(D.reqCtls(q)), own = comp ? new Set(D.controlsOf(comp)) : new Set(); const items = SSP.controls.filter((x) => D.inBaseline(x.c)).slice().sort((a, b) => (own.has(b.c) ? 1 : 0) - (own.has(a.c) ? 1 : 0) || natural(a.c, b.c)).map((x) => ({ id: x.c, title: x.t, code: x.c, group: own.has(x.c) ? `On ${D.nameOf(comp)}` : "The rest of the baseline", held: have.has(x.c) ? "Mapped" : "" })); K.pick({ title: `Map ${q} to controls`, multi: true, search: "Search controls", submit: (n) => (n ? `Map ${plural(n, "control")}` : "Map controls"), items, onPick: (ids) => { ids.forEach((k) => { if (dOp("mapControl", q, k)) return; pairDrop("mapsRm", q, k); pairAdd("maps", q, k); }); K.redraw(); K.toast(`${q} mapped to ${ids.join(", ")}`); } }); });
  K.on("k3s.rmMap", ([q, k], el, e) => { stop(e); K.confirm({ title: "Remove mapping", danger: true, submit: "Remove mapping", text: `${esc(q)} no longer maps ${esc(k)} ${esc(D.titleOf(k))}. Both stay where they are.`, onOk: () => { if (!dOp("unmapControl", q, k) && !pairDrop("maps", q, k)) pairAdd("mapsRm", q, k); K.redraw(); K.toast(`${q} no longer maps ${k}`); } }); });
  K.on("k3s.reqAlloc", (q) => { const have = new Set(D.reqEls(q)); K.pick({ title: `Allocate ${q} to components`, multi: true, search: "Search components", submit: (n) => (n ? `Allocate to ${plural(n, "component")}` : "Allocate"), items: D.treeOrder().map(([c]) => ({ id: c.code, title: c.name, code: c.code, meta: c.kind, held: have.has(c.code) ? "Allocated" : "" })), onPick: (ids) => { ids.forEach((c) => D.allocate(c, q)); K.redraw(); K.toast(`${q} allocated to ${ids.map(D.nameOf).join(", ")}`); } }); });
  K.panel("k3s-req", (id) => {
    const [q, comp] = String(id).split("@"), r = D.reqRec(q); if (!r) return null;
    const ctls = D.reqCtls(q), els = D.reqEls(q), c = comp ? D.component(comp) : null, R = PA.riskLookup;
    const iss = (r.iss || []).map((i) => (R && R.issue ? R.issue(i) : null)).filter(Boolean);
    return { label: "Requirement", title: r.title, code: q, chip: r.made ? pill("none", "Draft") : "",
      actions: K.btn("Map control", { sm: true, primary: true, act: "k3s.reqMap", arg: [q, comp || ""], icon: "plus" }) + K.menu("More", [{ label: "Allocate to components", act: "k3s.reqAlloc", arg: q }, c && els.includes(comp) ? { label: `Remove allocation to ${c.name}`, act: "k3s.rmReq", arg: [comp, q], danger: true } : null], { sm: true }),
      sections: [
        K.section({ title: "Statement", body: `<p class="k3s-prose">${esc(r.statement || "Its statement is not recorded.")}</p>` }),
        K.related({ title: "Controls it maps", add: { label: "Map control", act: "k3s.reqMap", arg: [q, comp || ""] }, empty: "It maps no control yet", cols: [{ label: "Control" }, { label: "Status" }, { label: "", cls: "tight" }], rows: ctls.map((k) => ({ panel: ctlPanel(), id: comp && D.direct(comp).includes(k) ? `${k}@${comp}` : PA.P["k3c-control"] ? k : `${k}@${D.componentsOf(k)[0] || ""}`, cells: [K.name(D.titleOf(k), "", k), K.status(D.statusOf(k)), rowBtn("Remove", "k3s.rmMap", [q, k], `Remove the mapping to ${k}`)] })) }),
        K.related({ title: "Allocated to", add: { label: "Allocate", act: "k3s.reqAlloc", arg: q }, empty: "Allocated to no component", cols: [{ label: "Component" }, { label: "Kind" }, { label: "", cls: "tight" }], rows: els.map((e) => ({ cells: [clink(e), esc((D.component(e) || {}).kind || ""), rowBtn("Remove", "k3s.rmReq", [e, q], `Remove the allocation to ${D.nameOf(e)}`)] })) }),
        K.related({ title: "Evidence", empty: "It cites no evidence yet", cols: [{ label: "Evidence" }], rows: (r.ev || []).map((t) => ({ cells: [esc(t)] })) }),
        iss.length ? K.related({ title: "Open issues", cols: [{ label: "Issue" }, { label: "Severity" }], rows: iss.map((i) => ({ panel: "a-risk-issue", id: i.id, cells: [esc(clip(i.title, 110)), pill(sevKind(i.sev), D.SEVW[i.sev] || i.sev)] })) }) : ""] };
  });

  // ——— The page ———
  const tabsOf = (c) => (c.boundary === "inside"
    ? [["overview", "Overview"], D.isContainer(c) ? ["components", "Components", D.below(c.code).length] : null, ["software", "Software & firmware", pooledItems(c).length], ["connections", "Connections", D.connsOf(c.code).length], ["controls", "Controls", D.controlsOf(c.code).length], ["requirements", "Requirements", D.requirementsOf(c.code).length], ["findings", "Findings", D.findingsOf(c.code).length]]
    : c.boundary === "connected" ? [["overview", "Overview"], ["connections", "Connections", D.connsOf(c.code).length]]
      : [["overview", "Overview"], ["offered", "Controls offered", offersOf(c.code).length], ["connections", "Connections", D.connsOf(c.code).length]]).filter(Boolean);
  const pooledItems = (c) => (D.isContainer(c) ? [c.code].concat(D.below(c.code)).flatMap(D.itemsOf) : D.itemsOf(c.code));
  const offersOf = (pid) => D.offersTaken(pid);
  function head(c) {
    const crumbs = [["System", "system"]], up = []; let p = c.parent ? D.component(c.parent) : null;
    while (p && !p.root) { up.unshift([p.name, route(p.code)]); p = p.parent ? D.component(p.parent) : null; }
    crumbs.push(...up, [c.name]);
    const lib = D.libOf(c), owner = D.ownerOf(c.code), ins = c.boundary === "inside";
    const line = `<span class="k3s-line">${K.owner(owner)}${K.actLink(owner ? "Change owner" : "Assign owner", "k3s.owner", c.code)}${lib ? `<span class="dot" aria-hidden="true">·</span><span>Built from ${esc(lib.name)}, ${esc(lib.set)}, version ${fmt(lib.v)}${lib.behind ? `, ${plural(lib.behind, "version")} behind` : ""}</span>` : ""}${!ins && c.org ? `<span class="dot" aria-hidden="true">·</span><span>${esc(c.org)}</span>` : ""}</span>`;
    const removable = ins ? !c.root : c.added || c.boundary === "connected" || (c.boundary === "provider" && (V.get("host.added", []) || []).includes(c.code));
    const more = K.menu("More", [{ label: "Edit component", act: "k3s.editComp", arg: c.code }, removable ? { label: "Remove component", act: "k3s.rmComp", arg: c.code, danger: true } : null]);
    const add = ins ? U.addMenu("Add", [{ label: "Software or firmware", act: "k3s.addItem", arg: [c.code, ""] }, { label: "Hardware", act: "k3s.addItem", arg: [c.code, "Hardware"] }, { label: "Connection", act: "k3s.addConn", arg: c.code }, { label: "Controls", act: "k3s.addCtl", arg: c.code }, { label: "Requirement", act: "k3s.addReq", arg: c.code }, D.isContainer(c) ? { label: "Component inside", act: "k3s.addComp", arg: c.code } : null]) : K.btn("Add connection", { primary: true, act: "k3s.addConn", arg: c.code, icon: "plus" });
    return K.head({ crumbs, title: c.name, code: ins ? c.code : "", chip: U.whereChip(c), sub: line, actions: more + add });
  }
  const tools = (code, tab, o) => { const st = tabState(code, tab); return K.toolbar({ search: o.search ? { act: "k3s.tq", value: st.q, placeholder: o.search } : null, filters: o.filters || [], right: `${o.chips || ""}${o.add || ""}` }); };
  const addBtn = (label, act, arg) => K.btn(label, { sm: true, act, arg, icon: "plus" });
  const has = (st, s) => !st.q.trim() || s.toLowerCase().includes(st.q.trim().toLowerCase());

  function nextStep(c, m) {
    const lib = D.libOf(c);
    if (lib && lib.behind && PA.M["v3w-take"]) { const cve = D.itemsOf(c.code).map((i) => i.sbom && i.sbom.cve).find(Boolean); return K.next({ text: `Version ${fmt(lib.latest)} of ${esc(lib.name)} is published${cve ? ` and fixes ${esc(cve)}` : ""}. This component runs version ${fmt(lib.v)}.`, action: K.btn(`Take version ${lib.latest}`, { sm: true, primary: true, act: "k3s.modal", arg: ["v3w-take", c.code] }) }); }
    if (!m.ctls.length) return K.next({ text: "No control is placed on this component yet.", action: K.btn("Add controls", { sm: true, primary: true, act: "k3s.addCtl", arg: c.code }) });
    if (m.first) return K.next({ text: `${plural(m.notWritten, "control")} of ${fmt(m.ctls.length)} ${m.notWritten === 1 ? "has" : "have"} no implementation written for ${D.isContainer(c) ? "a component here" : "this component"}. Start with ${esc(m.first[0])} ${esc(D.titleOf(m.first[0]))}.`, action: K.btn(`Write ${m.first[0]}`, { sm: true, primary: true, act: "k3s.impl", arg: m.first }) });
    if (!D.ownerOf(c.code)) return K.next({ text: "Nobody answers for this component yet.", action: K.btn("Assign owner", { sm: true, primary: true, act: "k3s.owner", arg: c.code }) });
    return "";
  }
  function overviewInside(c) {
    const code = c.code, ctls = D.controlsOf(code), holder = (k) => D.heldBy(code, k);
    const gaps = ctls.filter((k) => !holder(k).some((y) => D.written(k, y))).map((k) => [k, holder(k)[0] || code]);
    const reqs = D.requirementsOf(code), reqEv = reqs.filter((q) => (D.reqRec(q).ev || []).length).length, finds = D.findingsOf(code), xs = D.connsOf(code);
    const sat = ctls.filter((k) => D.statusOf(k) === "Satisfied").length, m = { ctls, notWritten: gaps.length, first: gaps[0] || null };
    const lib = D.libOf(c), parent = c.parent ? D.component(c.parent) : null;
    return K.aside([
      nextStep(c, m),
      K.cards(K.completion({ label: "Controls satisfied", done: sat, total: ctls.length, unit: "controls", minis: [{ label: "Implementation written", done: ctls.length - gaps.length, total: ctls.length, act: "k3s.goTab", arg: [code, "controls", ""] }, { label: "Requirements with evidence", done: reqEv, total: reqs.length, act: "k3s.goTab", arg: [code, "requirements", ""] }] }),
        K.attention({ rows: [{ label: "No implementation written", n: gaps.length, act: "k3s.goTab", arg: [code, "controls", "nowritten"] }, { label: "Requirements without evidence", n: reqs.length - reqEv, act: "k3s.goTab", arg: [code, "requirements", "noev"] }, { label: "Open findings", n: finds.length, tone: finds.some((f) => f.sev === "critical") ? "bad" : "", act: "k3s.goTab", arg: [code, "findings", ""] }, { label: "Connections without an agreement", n: xs.filter(D.noAgr).length, act: "k3s.goTab", arg: [code, "connections", "noagr"] }] })),
      c.about ? K.section({ title: "What it is", body: `<p class="k3s-prose">${esc(c.about)}</p>` }) : ""],
    [K.details("Details", [["Kind", esc(c.kind)], ["Inside", parent ? clink(parent.code) : c.root ? "The authorization boundary" : ""], c.unit ? ["Unit number", `<span class="k3-code">${esc(c.unit)}</span>`] : null, lib ? ["Built from", `${esc(lib.name)} ${mu(esc(lib.set))}`] : null, lib ? ["Library version", `${fmt(lib.v)}${lib.behind ? ` ${mu("· " + lib.latest + " is published")}` : lib.latest > 1 && lib.v === lib.latest ? ` ${mu("· current")}` : ""}`] : null, ["Owner", K.owner(D.ownerOf(code))], c.added ? ["Added", `${esc(mdy(TODAY))} ${mu("in this session")}`] : null])]);
  }
  function overviewOutside(c) {
    const P0 = D.PROV()[c.code] || {}, a = P0.auth || null, xs = D.connsOf(c.code), isProv = c.boundary !== "connected";
    const t = isProv ? D.takeCounts(c.code) : null;
    const body = [];
    if (isProv && D.unauth(c.code)) body.push(K.note(`<b>${esc(c.name)} has no authorization of its own.</b> ${t ? `This system leans on it for ${plural(t.inh + t.hyb, "control")}; an assessor would not accept the inheritance until it is authorized.` : ""}${a && a.note ? ` ${esc(a.note)}` : ""}`));
    if (t) body.push(K.cards(K.completion({ title: "What this system takes", label: "Controls taken of those offered", done: t.inh + t.hyb, total: t.offered, unit: "controls", minis: [{ label: "Inherited", done: t.inh, total: t.offered, act: "k3s.goTab", arg: [c.code, "offered", "inh"] }, { label: "Hybrid", done: t.hyb, total: t.offered, act: "k3s.goTab", arg: [c.code, "offered", "hyb"] }] }), K.attention({ rows: [{ label: "Taken back as this system's own", n: t.back, act: "k3s.goTab", arg: [c.code, "offered", "back"] }, { label: "Connections", n: xs.length, act: "k3s.goTab", arg: [c.code, "connections", ""] }] })));
    if (c.about || P0.about) body.push(K.section({ title: "What it is", body: `<p class="k3s-prose">${esc(c.about || P0.about)}</p>` }));
    if ((P0.els || []).length) body.push(K.related({ title: P0.kind === "Host system" ? "Components it carries" : "Components it serves", cols: [{ label: "Component" }, { label: "Kind" }], rows: P0.els.filter((e) => D.component(e)).map((e) => ({ go: route(e), cells: [K.name(D.nameOf(e), "", e), esc(D.component(e).kind)] })) }));
    if (!isProv) body.push(K.related({ title: "Connections", add: { label: "Add connection", act: "k3s.addConn", arg: c.code }, empty: "No connection to this system yet", cols: [{ label: "Connection" }, { label: "Component" }, { label: "Agreement" }], rows: xs.map((x) => ({ panel: "k3s-conn", id: x.id, cells: [K.name(x.name, x.iface, ""), esc(D.endsOf(x).filter((e) => e !== c.code).map(D.nameOf).join(", ")), U.agrWord(x)] })) }));
    return K.aside(body, [K.details("Details", [["Kind", esc(c.kind)], c.kind === D.WHERE[c.boundary] ? null : ["Where", esc(D.WHERE[c.boundary])], c.org ? ["Organization", esc(c.org)] : null, c.ao || P0.ao ? ["Authorizing official", esc(c.ao || P0.ao)] : null, isProv ? ["Authorization", a ? (a.word === "Authorized" ? `Authorized ${esc(mdy(a.on))}` : pill("warn", a.word)) : mu("Not recorded")] : ["Authorization", mu("Its own, kept by its organization")], a && a.atd ? ["Expires", esc(mdy(a.atd))] : null, a && a.ref ? ["Reference", `<span class="k3-code">${esc(a.ref)}</span>`] : null, P0.program && PA.v2hubs && PA.v2hubs.goAttrs ? ["Its program", `<a class="k3-link" href="#portfolio" ${PA.v2hubs.goAttrs("portfolio", { rows: [c.name], note: "Showing the provider's program" })}>${esc(P0.program)}</a>`] : null, ["Owner", K.owner(D.ownerOf(c.code))]])]);
  }
  function tabSoftware(c) {
    const code = c.code, st = tabState(code, "software"), cont = D.isContainer(c);
    const rows = pooledItems(c).filter((x) => (!st.f || x.kind === st.f) && has(st, `${x.name} ${x.version} ${x.supplier || ""} ${x.kind}`));
    return [tools(code, "software", { search: "Search items", filters: [{ label: "Kind", act: "k3s.tf", value: st.f, options: [["Software", "Software"], ["Firmware", "Firmware"], ["Hardware", "Hardware"]] }], add: addBtn("Add item", "k3s.addItem", [code, ""]) }),
      K.table({ label: "Software, firmware and hardware", cols: [{ label: "Item" }, { label: "Kind" }, { label: "Version", cls: "nw" }, { label: "Supplier" }, { label: "SBOM" }, { label: "Baseline", cls: "nw" }, { label: "", cls: "tight" }],
        rows: rows.map((x) => ({ act: "k3s.editItem", arg: [x.comp, x.id], cells: [K.name(x.name, cont && x.comp !== code ? `On ${D.nameOf(x.comp)}` : x.asset ? `Asset ${x.asset}` : clip(x.note || "", 90), ""), esc(x.kind), K.num(x.version), x.supplier ? esc(x.supplier) : NONE, x.sbom ? `<span class="num">${plural(x.sbom.parts, "part")}</span> · ${x.sbom.cve ? pill("bad", x.sbom.cve) : mu(x.sbom.fixed ? `${esc(x.sbom.fixed)} fixed` : "no open CVE")}` : NONE, esc(x.baseline || "") || NONE, rowBtn("Remove", "k3s.rmItem", [x.comp, x.id], `Remove ${x.name} ${x.version}`)] })),
        empty: st.q || st.f ? { title: "No item matches", line: "Clear the search or the kind." } : { title: "Nothing recorded yet", line: "The software, firmware and hardware this component is made of. Each row is kept here and read by the SSP's inventory.", action: addBtn("Add item", "k3s.addItem", [code, ""]) }, foot: `<span class="num">${plural(rows.length, "item")}</span>` })];
  }
  function tabConnections(c) {
    const code = c.code, st = tabState(code, "connections"), all = D.connsOf(code), rows = all.filter((x) => (st.f !== "noagr" || D.noAgr(x)) && has(st, `${x.name} ${x.iface} ${D.endsOf(x).map(D.nameOf).join(" ")}`));
    return [tools(code, "connections", { search: "Search connections", chips: K.chips([{ id: "", label: "All", count: all.length, on: st.f !== "noagr" }, { id: "noagr", label: "Without an agreement", count: all.filter(D.noAgr).length, on: st.f === "noagr" }], "k3s.tf", "Show connections"), add: addBtn("Add connection", "k3s.addConn", code) }),
      K.table({ label: "Connections", cols: U.connCols, rows: rows.map((x) => U.connRow(x, code)), empty: st.q || st.f ? { title: "No connection matches", line: "Clear the search or choose All." } : { title: "No connection yet", line: "What this component exchanges data with: another component, the host system or a system outside the boundary.", action: addBtn("Add connection", "k3s.addConn", code) }, foot: `<span class="num">${plural(rows.length, "connection")}</span>` })];
  }
  function tabControls(c) {
    const code = c.code, st = tabState(code, "controls"), all = D.controlsOf(code), cont = D.isContainer(c), own = new Set(D.direct(code));
    const holders = (k) => D.heldBy(code, k), wr = (k) => holders(k).some((x) => D.written(k, x));
    const F = { "": () => true, nowritten: (k) => !wr(k), inherited: (k) => D.respOf(k).kind === "Inherited", hybrid: (k) => D.respOf(k).kind === "Hybrid" };
    const inFam = all.filter((k) => !st.fam || D.famOf(k) === st.fam), rows = inFam.filter(F[st.f] || F[""]).filter((k) => has(st, `${k} ${D.titleOf(k)}`));
    const fams = uniq(all.map(D.famOf)), order = (SSP.families || []).map((f) => f.f); fams.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const table = K.table({ label: "Controls", cols: [{ label: "Control" }, { label: "Responsibility", cls: "k3s-w" }, { label: "Implementation", cls: "nw" }, { label: "Status" }, { label: "", cls: "tight" }],
      rows: rows.map((k) => { const hs = holders(k), at = own.has(k) ? code : hs[0] || code; return { panel: ctlPanel(), id: `${k}@${at}`, cells: [K.name(D.titleOf(k), !cont ? D.basisOf(code, k) : (own.has(k) && hs.length === 1 ? "On this component itself" : `On ${hs.filter((x) => x !== code).slice(0, 2).map(D.nameOf).join(", ")}${hs.filter((x) => x !== code).length > 2 ? ` and ${hs.filter((x) => x !== code).length - 2} more` : ""}`), k), respCell(k), wr(k) ? "Written" : mu("Not written"), K.status(D.statusOf(k)), own.has(k) ? rowBtn("Remove", "k3s.rmCtl", [code, k], `Remove ${k} from this component`) : ""] }; }),
      empty: st.q || st.f || st.fam ? { title: "No control matches", line: "Clear the search, or choose All controls." } : { title: "No control placed here yet", line: "Place the baseline's controls this component carries. Each is then written and assessed here.", action: addBtn("Add controls", "k3s.addCtl", code) }, foot: `<span class="num">${fmt(rows.length)} of ${plural(all.length, "control")}</span>` });
    const top = tools(code, "controls", { search: "Search controls", filters: fams.length > 1 ? [{ label: "Family", act: "k3s.tfam", value: st.fam, options: fams.map((f) => [f, `${f} · ${D.famName(f)} (${fmt(all.filter((k) => D.famOf(k) === f).length)})`]) }] : [], chips: K.chips([{ id: "", label: "All", count: inFam.length, on: !F[st.f] || !st.f }, { id: "nowritten", label: "Not written", count: inFam.filter(F.nowritten).length, on: st.f === "nowritten" }, { id: "inherited", label: "Inherited", count: inFam.filter(F.inherited).length, on: st.f === "inherited" }, { id: "hybrid", label: "Hybrid", count: inFam.filter(F.hybrid).length, on: st.f === "hybrid" }], "k3s.tf", "Show controls"), add: addBtn("Add controls", "k3s.addCtl", code) });
    return [top, table];
  }
  function tabRequirements(c) {
    const code = c.code, st = tabState(code, "requirements"), all = D.requirementsOf(code), own = new Set(D.directReqs(code)), cont = D.isContainer(c);
    const noev = (q) => !(D.reqRec(q).ev || []).length, rows = all.filter((q) => (st.f !== "noev" || noev(q))).filter((q) => { const r = D.reqRec(q); return has(st, `${q} ${r.title} ${r.statement} ${D.reqCtls(q).join(" ")}`); });
    return [tools(code, "requirements", { search: "Search requirements", chips: K.chips([{ id: "", label: "All", count: all.length, on: st.f !== "noev" }, { id: "noev", label: "Without evidence", count: all.filter(noev).length, on: st.f === "noev" }], "k3s.tf", "Show requirements"), add: addBtn("Add requirement", "k3s.addReq", code) }),
      K.table({ label: "Requirements", cols: [{ label: "Requirement" }, { label: "Controls it maps" }, { label: "Evidence", cls: "nw" }, { label: "", cls: "tight" }],
        rows: rows.map((q) => { const r = D.reqRec(q), ks = D.reqCtls(q), at = own.has(q) ? code : D.reqEls(q).find((e) => D.below(code).includes(e)) || code; return { panel: reqPanel(), id: reqPanel() === "k3s-req" ? `${q}@${at}` : q, cells: [K.name(r.title, cont && !own.has(q) ? `On ${D.nameOf(at)}` : clip(r.statement, 110), q), ks.length ? `<span class="num">${esc(ks.slice(0, 3).join(", "))}</span>${ks.length > 3 ? ` ${mu("+" + (ks.length - 3))}` : ""}` : mu("None"), (r.ev || []).length ? K.num(r.ev.length) : mu("None"), own.has(q) ? rowBtn("Remove", "k3s.rmReq", [code, q], `Remove the allocation of ${q}`) : ""] }; }),
        empty: st.q || st.f ? { title: "No requirement matches", line: "Clear the search or choose All." } : { title: "No requirement allocated here yet", line: "Allocate the program's requirements this component must meet, or create one here.", action: addBtn("Add requirement", "k3s.addReq", code) }, foot: `<span class="num">${plural(rows.length, "requirement")}</span>` })];
  }
  function tabFindings(c) {
    const code = c.code, st = tabState(code, "findings"), all = D.findingsOf(code), rows = all.filter((f) => (!st.f || f.kind === st.f) && has(st, `${f.title} ${f.about} ${f.kind}`));
    return [tools(code, "findings", { search: "Search findings", filters: [{ label: "Kind", act: "k3s.tf", value: st.f, options: uniq(all.map((f) => f.kind)).map((k) => [k, k]) }] }),
      K.table({ label: "Findings", cols: [{ label: "Finding" }, { label: "Severity or determination" }, { label: "Opened", cls: "nw" }, { label: "Owner" }],
        rows: rows.map((f) => Object.assign(f.panel && PA.P[f.panel] ? { panel: f.panel, id: f.pid } : {}, { cells: [K.name(clip(f.title, 120), `${f.kind} · ${f.about}`, ""), f.det ? K.status(f.det) : pill(sevKind(f.sev), D.SEVW[f.sev] || f.sev || ""), f.opened ? esc(mdy(f.opened)) : NONE, f.owner ? K.owner(f.owner) : NONE] })),
        empty: st.q || st.f ? { title: "No finding matches", line: "Clear the search or the kind." } : { title: "Nothing open on this component", line: "Open issues, assessment findings short of satisfied and known vulnerabilities show here as they are recorded." }, foot: `<span class="num">${plural(rows.length, "finding")}</span>` })];
  }
  function tabComponents(c) {
    const code = c.code, st = tabState(code, "components"), under = new Set(D.below(code)), base = D.treeOrder().find(([x]) => x.code === code), d0 = base ? base[1] + 1 : 1;
    const rows = D.treeOrder().filter(([x]) => under.has(x.code) && has(st, `${x.name} ${x.code} ${x.unit || ""}`));
    return [tools(code, "components", { search: "Search components", add: addBtn("Add component", "k3s.addComp", code) }),
      K.table({ label: "Components inside", cls: "k3s-list", cols: [{ label: "Component" }, { label: "Kind" }, { label: "Software & firmware", cls: "nw" }, { label: "Controls", cls: "nw" }, { label: "Requirements", cls: "nw" }, { label: "Findings", cls: "nw" }, { label: "Owner" }], rows: rows.map(([x, d]) => U.insideRow(x, st.q ? 0 : d - d0)),
        empty: st.q ? { title: "No component matches", line: "Clear the search." } : { title: `Nothing inside ${c.name} yet`, line: "Add the units and software it holds.", action: addBtn("Add component", "k3s.addComp", code) }, foot: `<span class="num">${plural(rows.length, "component")}</span>` })];
  }
  function tabOffered(c) {
    const code = c.code, st = tabState(code, "offered"), all = offersOf(code);
    const F = { "": () => true, inh: (r) => r.kind === "Inherited", hyb: (r) => r.kind === "Hybrid", back: (r) => r.back };
    const rows = all.filter(F[st.f] || F[""]).filter((r) => has(st, `${r.code} ${D.titleOf(r.code)}`));
    return [tools(code, "offered", { search: "Search controls", chips: K.chips([{ id: "", label: "All", count: all.length, on: !st.f }, { id: "inh", label: "Inherited", count: all.filter(F.inh).length, on: st.f === "inh" }, { id: "hyb", label: "Hybrid", count: all.filter(F.hyb).length, on: st.f === "hyb" }, { id: "back", label: "Taken back", count: all.filter(F.back).length, on: st.f === "back" }], "k3s.tf", "Show controls") }),
      K.table({ label: "Controls offered", cols: [{ label: "Control" }, { label: "Offered as", cls: "nw" }, { label: "This system takes it as" }, { label: "This system's part" }, { label: "Status" }, { label: "", cls: "tight" }],
        rows: rows.map((r) => ({ panel: ctlPanel(), id: PA.P["k3c-control"] ? r.code : `${r.code}@${code}`, cells: [K.name(D.titleOf(r.code), clip((r.offer || {}).prov || "", 110), r.code), esc(r.def), r.kind === "System-specific" ? two("This system", "Taken back") : esc(r.kind), r.own ? esc(clip(r.own, 90)) : NONE, K.status(D.statusOf(r.code)), D.wsx() ? rowBtn("Change", "k3s.resp", r.code, `Change the responsibility of ${r.code}`) : ""] })),
        empty: st.q || st.f ? { title: "No control matches", line: "Clear the search or choose All." } : { title: "It offers no control of this baseline", line: "Controls a provider offers are inherited by default; their status becomes the provider's." }, foot: `<span class="num">${plural(rows.length, "control")}</span>` })];
  }
  K.lazy(RE, (r, m) => {
    const c = D.component(m[1]), tab = m[2] || "overview";
    if (!c) return K.page({ cls: "k3s", head: K.head({ crumbs: [["System", "system"], ["Not found"]], title: "This component is not here" }), body: K.empty({ title: "No component at this address", line: "It may have been removed. The System page lists every component.", action: `<a class="btn sm" href="#system">System</a>` }) });
    const list = tabsOf(c), t = list.some((x) => x[0] === tab) ? tab : "overview";
    const body = t === "overview" ? (c.boundary === "inside" ? overviewInside(c) : overviewOutside(c)) : t === "software" ? tabSoftware(c) : t === "connections" ? tabConnections(c) : t === "controls" ? tabControls(c) : t === "requirements" ? tabRequirements(c) : t === "findings" ? tabFindings(c) : t === "components" ? tabComponents(c) : tabOffered(c);
    return K.page({ cls: "k3s", head: head(c), tabs: K.tabs(list.map(([id, label, count]) => ({ label, count, route: route(c.code, id), on: id === t })), c.name), body });
  }, "system");

  // ——— A component named on another page: its panel, whose Open goes to its page ———
  K.panel("k3s-comp", (code0) => {
    const code = code0 === "SYS-WSX90" && D.rootOf() ? D.rootOf().code : code0, c = D.component(code); if (!c) return null;
    const ins = c.boundary === "inside", n = (list, tab) => (list.length ? K.link(fmt(list.length), route(code, tab)) : mu("None")), t = ins || c.boundary === "connected" ? null : D.takeCounts(code), lib = D.libOf(c);
    return { label: "Component", title: c.name, code: ins ? c.code : "", chip: U.whereChip(c), page: route(code), open: "Open component",
      facts: ins ? [["Kind", esc(c.kind)], c.parent && D.component(c.parent) ? ["Inside", clink(c.parent)] : null, ["Owner", K.owner(D.ownerOf(code))], lib ? ["Built from", `${esc(lib.name)}, version ${fmt(lib.v)}${lib.behind ? ` ${mu("· " + plural(lib.behind, "version") + " behind")}` : ""}`] : null, ["Software & firmware", D.swLine(code) || mu("None recorded")], ["Controls", n(D.controlsOf(code), "controls")], ["Requirements", n(D.requirementsOf(code), "requirements")], ["Open findings", n(D.findingsOf(code), "findings")], ["Connections", n(D.connsOf(code), "connections")]]
        : [["Kind", esc(c.kind)], c.org ? ["Organization", esc(c.org)] : null, c.boundary !== "connected" ? ["Authorization", D.unauth(code) ? pill("warn", (D.provAuth(code) || {}).word || "Not authorized") : esc(U.authWord(D.provAuth(code)))] : null, t ? ["This system takes", K.link(`${fmt(t.inh)} inherited · ${fmt(t.hyb)} hybrid`, route(code, "offered"))] : null, ["Connections", n(D.connsOf(code), "connections")]] };
  });
  for (const k of ["v7p-el", "sys-el"]) V3.P(k, (orig, id) => (D.wsx() && (D.component(id) || id === "SYS-WSX90") ? PA.P["k3s-comp"](id) : orig()));
  V3.P("v2h-prov", (orig, id) => (D.component(id) ? PA.P["k3s-comp"](id) : orig()));
  V3.P("v8b-ic", (orig, id) => (D.conn(id) ? PA.P["k3s-conn"](id) : orig()));
  // A question another page left for a folded page (PA.v2.go("composition", { open: … })) is answered at its new home.
  window.addEventListener("hashchange", () => { if (!V3.on()) return; for (const r of ["composition", "composition-list", "composition-assets", "hosts", "boundary", "interconnections", "ppsm", "inventory"]) { const q = V.peek(r), o = q && q.open; if (!o) continue; V.take(r); if (/^(v7p-el|sys-el|v2h-prov)$/.test(o.kind) && D.component(o.id)) setTimeout(() => K.go(route(o.id)), 0); else if (o.kind === "v8b-ic" && D.conn(o.id)) setTimeout(() => K.go(U.connRoute(o.id)), 0); } });

  // ════════════════ Folding the old pages ════════════════
  const R = (from, to) => V3.redirect(from, to);
  R("boundary", "system-boundary"); R("boundary-iatt", "system-boundary--iatt"); R("boundary-block-1-1", "system-boundary--blk");
  R(/^interconnections(-|$)/, "system-connections"); R(/^ppsm(-|$)/, "system-connections");
  R(/^composition(-|$)/, "system"); R(/^inventory(-|$)/, "system"); R(/^hosts(-|$)/, "system"); R("inheritance", "system");
  const dec = (s) => { try { return decodeURIComponent(s); } catch (e) { return s; } };
  R(/^rec--v7p-el--/, (r) => { const code = dec(r.replace(/^rec--v7p-el--/, "")).split("|")[0]; return code === "SYS-WSX90" ? "system" : route(code); });
  R(/^rec--(sys-el|v7a-pel|sys-pel)--/, (r) => route(dec(r.replace(/^rec--[\w-]+?--/, "")).split("|")[0]));
  R(/^rec--v2h-prov--/, (r) => { const [id, tab] = dec(r.replace(/^rec--v2h-prov--/, "")).split("|"); return route(id, tab && /control|offer|inherit/i.test(tab) ? "offered" : tab && /interface|connect/i.test(tab) ? "connections" : ""); });
  R(/^rec--v8b-ic--/, (r) => { const id = dec(r.replace(/^rec--v8b-ic--/, "")).split("|")[0]; return D.conn(id) ? U.connRoute(id) : "system-connections"; });
  R(/^rec--v8b-pps--/, "system-connections");
  R(/^rec--(sys-asset|risk-asset)--/, (r) => { const id = dec(r.replace(/^rec--[\w-]+?--/, "")).split("|")[0], m = /^AST-1090(\d\d)$/.exec(id); return m ? route("CN-1091" + m[1], "software") : "system"; });
  V3.compareAs("system", "composition"); V3.compareAs(/^system-boundary/, "boundary"); V3.compareAs("system-connections", "interconnections");
  V3.compareAs(RE, (r) => { const m = RE.exec(r), c = m && D.component(m[1]); return !c ? "composition" : c.boundary === "inside" ? "rec--v7p-el--" + c.code : c.boundary === "connected" ? "interconnections" : "hosts"; });
})();
