// Drata round, lane B (drb-): evidence after Drata. Recommendations 7, 8, 9 and 10, drawn with the Drata kit (PA.drk, D) over
// WS-X90's real evidence (lane D's facts: artifacts(), requirement(code), status(code)). New routes only; no existing screen changes.
// Inert while V3 is off (D.route switches V3 on when one of these addresses is opened).
//
// Routes
//   dr-evidence            the evidence register after: four stat tiles that filter, one toolbar row, the lifecycle status, the
//                          renewal date, the source, "k of n ready" controls and the evidence owner; the eye opens a walkable drawer
//   dr-evidence--<id>      the evidence record after: the header with facts, the one next step (Add new artifact, Renew), linked
//                          controls as code chips, versions (an automated one fixed, "Fix or disable the source"), the renewal and why
//   dr-evidence-pick       an assessment objective's evidence picker: only evidence current in the campaign's period, "n hidden ·
//                          Show them", the pick mapped to the objective's control
//   dr-import              importing an SCTM or a POA&M spreadsheet: Upload → Map columns → Map values → Review → Confirm, each
//                          kind with its own columns, words and sample (dr-import--review: the SCTM at Review; dr-import--poam:
//                          the POA&M at Map columns)
// Round 2: V3's seven STIG checklists are evidence (record ids ckl-<checklist slug>, Source "STIG checklist", fixed versions,
// open rules by CAT, renewal at the next import V3 schedules), and PA.drB (at the end) is the one store for every link,
// unlink and renewal, read by lane A's control record and lane F's renewal check.
// Derived (nothing in the prototype holds it): the renewal schedule from the controls' assessment frequency, the lifecycle status,
// the source, an automated item's earlier runs. See the rules beside each function and v4dr/B/notes.json.
// Session data (K.get/K.set, under "dr.B."; Reset clears it): vers { id: [{ at, by, file }] } · owner { id: name } · links { id: [codes] }
//   unl { id: [codes] } (V3 links removed through PA.drB) · off { source: iso } · made [{ id, title, kind, owner, at }] · ev { q, status, source, owner, fam, page } · pick { q, all, chosen, done }
//   imp { at, file, kind, map, vmap, fix, done }
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k, V = PA && PA.v2, D = PA && PA.drk;
  if (!V3 || !K || !V || !D) return;
  const SSP = PA.SSP, esc = K.esc, fmt = K.fmt;
  const CH = V.chain || null;
  const TODAY = (CH && CH.TODAY_ISO) || "2026-11-17", ME = (CH && CH.ME) || "Ingrid Solberg";
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
  const natural = (a, b) => collator.compare(String(a), String(b));
  const uniq = (a) => [...new Set(a.filter((x) => x != null && x !== ""))];
  const clip = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).replace(/[\s,;:.]+\S*$/, "") + "…" : s; };
  const ms = (iso) => Date.parse(String(iso).slice(0, 10) + "T12:00:00Z");
  const addDays = (iso, n) => new Date(ms(iso) + n * 864e5).toISOString().slice(0, 10);
  const daysTo = (iso) => Math.round((ms(iso) - ms(TODAY)) / 864e5);
  const md = (iso) => { if (!iso) return ""; const d = new Date(ms(iso)); return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getUTCFullYear() === 2026 ? undefined : "numeric", timeZone: "UTC" }); };
  const mdy = (iso) => (iso ? new Date(ms(iso)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "");
  const none = (label) => `<span class="k3-none"${label ? ` aria-label="${esc(label)}"` : ""}>—</span>`;
  const mu = (t) => `<span class="k3-muted">${esc(t)}</span>`;
  const warnW = (t) => `<span class="drb-warnw">${esc(t)}</span>`;
  const SVG = { lock: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>',
    sync: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 6.5A5 5 0 004.2 4.3L3 5.5M3 2.5v3h3M3 9.5a5 5 0 008.8 2.2L13 10.5M13 13.5v-3h-3"/></svg>',
    doc: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 1.5h5.5L13 5v9.5H4z"/><path d="M9.5 1.5V5H13M6 8.5h5M6 11h5"/></svg>' };
  const g = (k) => SVG[k] || (K.i ? K.i(k) : "");
  const get = (p, d) => { const v = K.get("dr.B." + p, d); return v == null ? d : v; };
  const set = (p, v) => K.set("dr.B." + p, v);

  // ——— Memo: one draw; anything written forgets it ———
  let MEMO = {};
  const memo = (k, fn) => (k in MEMO ? MEMO[k] : (MEMO[k] = fn()));
  V.on(() => { MEMO = {}; });
  window.addEventListener("hashchange", () => { MEMO = {}; });
  window.addEventListener("v3change", () => { MEMO = {}; });

  // ——— Controls ———
  const STW = { satisfied: "Satisfied", partially_satisfied: "Partially satisfied", other_than_satisfied: "Other than satisfied", not_assessed: "Not assessed", no_evidence: "No evidence", no_requirement: "No requirement" };
  const STK = { satisfied: "ok", partially_satisfied: "part", other_than_satisfied: "bad", not_assessed: "warn", no_evidence: "none", no_requirement: "none" };
  const ctlRec = (code) => (SSP && SSP.ctl ? SSP.ctl(code) : null) || null;
  const ctlKey = (code) => V3.fact("status", code) || (ctlRec(code) || {}).cs || "";
  const ctlTitle = (code) => (ctlRec(code) || {}).t || "";
  const ctlRoute = (code) => (typeof K.recRoute === "function" && K.recRoute("k3c-control", code)) || `control--${code}`;
  const ctlTone = (code) => { const k = ctlKey(code); return k === "satisfied" ? "ok" : k === "other_than_satisfied" ? "bad" : k === "partially_satisfied" || k === "not_assessed" ? "warn" : "none"; };
  const ctlReady = (code) => ctlKey(code) === "satisfied";
  const ctlPill = (code) => { const k = ctlKey(code); return k ? K.status(STW[k] || k, STK[k] || "none") : none(); };
  const baseline = () => memo("baseline", () => ((SSP && SSP.controls) || []).map((c) => c.c || c.code).filter(Boolean));

  // ——— Assessment frequency (derived) ———
  // The prototype keeps no assessment frequency. WS-X90's parameters name three that would (RA-05_ODP[01], CM-08_ODP[02],
  // CA-07_ODP[02]) and set none of them, so each control takes a continuous-monitoring default: the scan-driven controls (RA-5,
  // SI-2, SI-3, SI-7, CM-6, CM-8) every 30 days, the review controls at least quarterly, the rest at least annually (the catalog's default for its -1 controls).
  // An evidence item renews at the shortest frequency among its controls; an automated item at its source's monthly import.
  const F30 = /^(RA-5|SI-2|SI-3|SI-7|CM-6|CM-8)$/, F90 = /^(AU-6|SI-4|CA-7|AC-6)$/;
  const freqOfCtl = (code) => {
    const base = String(code).replace(/\(.*$/, "");
    if (F30.test(base)) return { days: 30, word: "every 30 days", param: base === "RA-5" ? "RA-05_ODP[01]" : base === "CM-8" ? "CM-08_ODP[02]" : "CA-07_ODP[02]", what: base === "RA-5" ? "scan frequency" : "assessment frequency", code };
    if (F90.test(base)) return { days: 91, word: "at least quarterly", param: "CA-07_ODP[02]", what: "assessment frequency", code };
    return { days: 365, word: "at least annually", param: "CA-07_ODP[02]", what: "assessment frequency", code };
  };
  const freqOf = (ctls, auto, src) => {
    if (auto) return { days: 30, word: "every 30 days", param: "RA-05_ODP[01]", what: "import cadence", code: null, auto: true, src };
    const all = ctls.map(freqOfCtl).sort((a, b) => a.days - b.days || natural(a.code, b.code));
    return all[0] || { days: 365, word: "at least annually", param: "CA-07_ODP[02]", what: "default", code: null };
  };
  const whyOf = (fq) => (fq.why ? fq.why : fq.auto ? `${fq.src}'s import cadence: ${fq.word}` : fq.code ? `${fq.code}'s ${fq.what}: ${fq.word}` : `No control yet: the program's default, ${fq.word}`);
  const windowOf = (days) => Math.min(60, Math.round(days / 3)); // "Upcoming renewal": within 60 days, or a third of a short period

  // ——— The source (derived from the artifact's kind) and an automated item's source ———
  const sourceOf = (a) => (!a.collected ? "" : a.kind === "Scan result" ? "Scan import" : /approval|exceptions|worksheet|manifest|change request|work order|waiver/i.test(a.title) ? "Ticket" : a.kind === "Dataset" ? "Link" : "File");
  const autoSrc = (a) => (/log extract/i.test(a.title) ? "Audit log collection" : /firmware|integrity|scan/i.test(a.title) ? "ACAS vulnerability scan" : "Monitoring import");
  const SOURCES = ["File", "Link", "Scan import", "STIG checklist", "Ticket"];

  // ——— V3's STIG checklist kind (round 2): each checklist is fixed evidence from its source ———
  // Read as V3's evidence register reads it: the old STIG register's rows (PA.S.stigs) and each checklist's preview (v8g-ck), for
  // the asset, the STIG and its release, the tool, the run date, the open rules by CAT, the rule counts, the owner and the next
  // import V3 schedules (its renewal date). The source is lane C's (the STIG sources of Evidence › Sources); the controls a
  // checklist evidences are that source's (CM-6, CM-7, CM-2, IA-5, AU-12 and their enhancements in the baseline).
  const CKSRC = { "mission-computer-rhel9": "stig-mc", "mission-computer-asd": "stig-asd", "ethernet-switch-ndm": "stig-sw", "ethernet-switch-l2s": "stig-sw", "network-gateway-ndm": "stig-gw", "network-gateway-rtr": "stig-gw", "maintenance-laptop-win11": "scap-lt" };
  const STIGC = ["CM-6", "CM-6(1)", "CM-7", "CM-7(1)", "CM-2", "CM-2(2)", "IA-5", "AU-12"];
  const isoOf = (t) => { const m = /([A-Z][a-z]{2}) (\d{1,2})(?:, (\d{4}))?/.exec(t || ""); if (!m) return ""; const d = Date.parse(`${m[1]} ${m[2]}, ${m[3] || 2026} 12:00:00 UTC`); return isNaN(d) ? "" : new Date(d).toISOString().slice(0, 10); };
  const tplOf = (html) => { const t = document.createElement("template"); t.innerHTML = html || ""; return t.content; };
  const srcRec = (id) => (PA.drc && PA.drc.SRC ? PA.drc.SRC.find((x) => x.id === id) : null) || null;
  function checklists() {
    return memo("ckl", () => {
      if (!V3.wsx() || !PA.S || typeof PA.S.stigs !== "function") return [];
      let page; try { page = tplOf(PA.S.stigs()); } catch (err) { return []; }
      const comps = V3.fact("components") || [];
      return [...page.querySelectorAll("table tbody tr")].map((tr) => {
        const slug = tr.getAttribute("data-id"); if (!slug) return null;
        const td = [...tr.children].map((c) => c.textContent.replace(/\s+/g, " ").trim());
        let pv = null; try { pv = PA.P && PA.P["v8g-ck"] ? PA.P["v8g-ck"](slug) : null; } catch (err) { pv = null; }
        const P0 = tplOf(pv && pv.body), text = P0.textContent.replace(/\s+/g, " ");
        const dd = (label) => { const dt = [...P0.querySelectorAll("dt")].find((x) => x.textContent.trim() === label); return dt ? dt.nextElementSibling : null; };
        const n = (re) => { const m = re.exec(text); return m ? +m[1].replace(/,/g, "") : 0; };
        const ownEl = dd("Owner"), nextEl = dd("Next import");
        const imp = isoOf(td[3]), next = nextEl ? isoOf(nextEl.textContent) : "", cat = String(td[4] || "").split("·").map((x) => +x || 0);
        const stigW = String(td[1] || ""), newer = (/↑\s*(\S+)/.exec(stigW) || [])[1] || "", stig = stigW.replace(/\s*↑.*$/, "");
        const rules = [...P0.querySelectorAll(".v8g-li")].map((li) => { const b = li.querySelector("b"), v = b ? b.textContent.trim() : "", x = li.querySelector(".x"), c = li.querySelector(".v8g-cat"); return { id: li.getAttribute("data-id") || "", v, cat: c ? ((/c(\d)/.exec(c.className) || [])[1] | 0) : 0, title: x ? x.textContent.replace(v, "").trim() : "" }; });
        const src = CKSRC[slug] || "", asset = td[0] || "", cp = comps.find((c) => c.name === asset) || null;
        const cadence = imp && next ? Math.max(1, Math.round((ms(next) - ms(imp)) / 864e5)) : 30;
        return { slug, id: "ckl-" + slug, src, asset, stig, newer, tool: td[2] || "", imp, by: String(td[3] || "").split(" · ")[1] || "", cat, open: cat[0] + cat[1] + cat[2], notrev: +td[5] || 0, comp: td[6] || "", total: n(/Results\s*([\d,]+)\s*rules/), naf: n(/Not a finding\s*([\d,]+)/), na: n(/Not applicable\s*([\d,]+)/), owner: ownEl ? ((ownEl.querySelector(".nm") || ownEl).textContent.trim()) : "", next, cadence, rules, route: "stigs-" + slug, compCode: cp ? cp.code : "" };
      }).filter(Boolean);
    });
  }
  const cklBy = (slug) => checklists().find((c) => c.slug === slug || c.id === slug) || null;
  // A checklist's runs: V3's imports of its source, then the runs lane C's screens finished (dr.C.runs.<source>, read once done)
  // and the imports made from its evidence record here.
  const cRunDone = (r) => !r.t0 || Date.now() - r.t0 >= 4000;
  const cklRuns = (c) => { const v3 = (V3.fact("imports", V3.WSX) || []).filter((i) => i.src === c.src).map((i) => ({ at: i.at, file: i.file, by: i.by, st: i.st, read: i.read }));
    const lc = (K.get("dr.C.runs." + c.src, []) || []).filter((r) => r && r.kind === "run").map((r) => ({ at: r.at, file: r.what, by: r.by, st: cRunDone(r) ? "done" : Date.now() - r.t0 < 1500 ? "queued" : "running", read: r.read || "", mine: true }));
    return lc.concat(v3).sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)); };
  const RUNW = { done: "Applied", superseded: "Superseded", queued: "Queued", running: "Running", validating: "Validating", rejected: "Rejected", failed: "Failed", cancelled: "Cancelled" };

  // ——— Lifecycle (rec 7) ———
  // Needs artifact: nothing collected, or the reviewer sent it back. Error: an automated item whose last run was rejected (its
  // source failed): it counts neither way, so it has no tile and stays out of the list until the line over the table's "Show
  // them" or the Status filter asks for it.
  const LIFE = { error: ["Error", "bad", true], artifact: ["Needs artifact", "bad", true], renewal: ["Needs renewal", "bad", true], upcoming: ["Upcoming renewal", "none", false], ready: ["Ready", "ok", false] };
  const LORDER = ["artifact", "renewal", "upcoming", "ready", "error"], TILES = ["artifact", "renewal", "upcoming", "ready"];
  const REVW = { pending: "Waiting on review", accepted: "Accepted", revise: "To revise" };
  const lifePill = (k) => K.status(LIFE[k][0], LIFE[k][1]);

  const hash = (s) => { let x = 5381; for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) >>> 0; return x.toString(36); };
  const slugOf = (id) => (/^[\w-]+$/.test(id) ? id : "c" + hash(id));

  function model() {
    return memo("model", () => {
      const arts = (V3.fact("artifacts") || []).concat(get("made", []).map((m) => ({ id: m.id, title: m.title, kind: m.kind, state: "pending", owner: m.owner, collected: m.at, requirements: [], made: true })));
      const vers = get("vers", {}), owners = get("owner", {}), links = get("links", {}), unl = get("unl", {}), off = get("off", {});
      const list = arts.map((a) => {
        const sl = slugOf(a.id), base = [], via = {}, gone = new Set(unl[sl] || []);
        for (const q of a.requirements || []) { const r = V3.fact("requirement", q); for (const c of (r && r.controls) || []) { if (!via[c] && !gone.has(c)) { via[c] = q; base.push(c); } } }
        const extra = (links[sl] || []).filter((c) => !via[c]);
        extra.forEach((c) => { via[c] = ""; });
        const ctls = base.concat(extra).sort(natural);
        const source = sourceOf(a) || ((vers[sl] || []).length ? "File" : ""), auto = source === "Scan import", src = auto ? autoSrc(a) : "";
        const added = vers[sl] || [], collected = added.length ? added[added.length - 1].at : a.collected || "";
        const review = added.length ? "pending" : a.state;
        const fq = freqOf(ctls, auto, src), renew = collected ? addDays(collected, fq.days) : "";
        const life = auto && review === "revise" ? "error" : !collected || review === "revise" ? "artifact" : daysTo(renew) < 0 ? "renewal" : daysTo(renew) <= windowOf(fq.days) ? "upcoming" : "ready";
        return { id: a.id, sl, title: a.title, kind: a.kind, review, owner: owners[sl] !== undefined ? owners[sl] : a.owner || "", collected, first: a.collected || "", renew, fq, life, source, auto, src, srcOff: auto ? off[src] || "" : "", ctls, via, extra, reqs: a.requirements || [], added, made: !!a.made, cited: !a.collected && !added.length };
      });
      for (const c of checklists()) {
        const sl = c.id, gone = new Set(unl[sl] || []), via = {}, sr = srcRec(c.src);
        const base = ((sr && sr.ctls) || STIGC).filter((x) => baseline().includes(x) && !gone.has(x));
        base.forEach((x) => { via[x] = "rules"; });
        const extra = (links[sl] || []).filter((x) => !via[x]); extra.forEach((x) => { via[x] = ""; });
        const added = vers[sl] || [], runs = cklRuns(c).filter((r) => r.st === "done" || r.st === "superseded");
        const collected = [c.imp, runs[0] && runs[0].at, added.length && added[added.length - 1].at].filter(Boolean).sort().pop() || "";
        const src = (sr && sr.name) || c.tool;
        const fq = { days: c.cadence, word: `every ${c.cadence} days`, what: "import cadence", code: null, auto: true, src, param: null, why: `The checklist's import cadence: every ${c.cadence} days` };
        const renew = collected ? (collected === c.imp && c.next ? c.next : addDays(collected, c.cadence)) : "";
        const life = !collected ? "artifact" : daysTo(renew) < 0 ? "renewal" : daysTo(renew) <= windowOf(fq.days) ? "upcoming" : "ready";
        list.push({ id: sl, sl, title: `${c.stig} checklist · ${c.asset}`, kind: "STIG checklist", review: "accepted", owner: owners[sl] !== undefined ? owners[sl] : c.owner || "", collected, first: c.imp, renew, fq, life, source: "STIG checklist", auto: true, src, srcId: c.src, srcOff: off[src] || "", ctls: base.concat(extra).sort(natural), via, extra, reqs: [], added, made: false, cited: false, ckl: c });
      }
      const rank = (e) => LORDER.indexOf(e.life);
      list.sort((a, b) => (b.made ? 1 : 0) - (a.made ? 1 : 0) || rank(a) - rank(b) || String(a.renew || "9").localeCompare(String(b.renew || "9")) || natural(a.title, b.title));
      const by = new Map(list.map((e) => [e.sl, e]));
      return { list, by };
    });
  }
  const evBy = (sl) => model().by.get(sl) || null;
  const recRoute = (e) => `dr-evidence--${e.sl}`;
  const readyN = (e) => e.ctls.filter(ctlReady).length;

  // ——— Cells ———
  const renewCell = (e) => (!e.renew ? none("No renewal date") : daysTo(e.renew) < 0 ? `<span class="drb-late num" title="Renew by ${esc(mdy(e.renew))}">${esc(md(e.renew))} · ${plural(-daysTo(e.renew), "day")} past due</span>` : e.life === "upcoming" ? `<span class="num" title="Renew by ${esc(mdy(e.renew))}">${esc(md(e.renew))}</span> ${mu(`in ${daysTo(e.renew)} days`)}` : `<span class="num">${esc(md(e.renew))}</span>`);
  const ctlMark = (e) => {
    if (!e.ctls.length) return none("No control");
    const shown = e.ctls.slice(0, 4), more = e.ctls.length - shown.length;
    return `<span class="drb-cm" title="${esc(e.ctls.map((c) => `${c} ${STW[ctlKey(c)] || ""}`).join(" · "))}">${shown.map((c) => `<i class="drb-dot t-${ctlTone(c)}" aria-hidden="true"></i>`).join("")}${more > 0 ? `<i class="drb-dot more" aria-hidden="true"></i>` : ""}<span class="num">${fmt(readyN(e))} of ${fmt(e.ctls.length)}</span><span class="drb-cm-w">ready</span></span>`;
  };
  const ownerCell = (e) => (e.owner ? K.owner(e.owner) : warnW("No owner"));
  const srcCell = (e) => (e.source ? (e.auto ? `<span class="drb-src">${g("sync")}${esc(e.source)}</span>` : esc(e.source)) : none("No artifact"));

  // ════════════════ 1. The register (dr-evidence) ════════════════
  const view = () => Object.assign({ q: "", status: "", source: "", owner: "", fam: "", page: 0 }, get("ev", {}) || {});
  const setView = (ch) => set("ev", Object.assign({}, view(), ch));
  const famOf = (c) => String(c).split("-")[0];
  const ask = (v) => {
    const q = String(v.q || "").trim().toLowerCase();
    const scoped = model().list.filter((e) => (!v.source || e.source === v.source || (v.source === "none" && !e.source)) && (!v.owner || (v.owner === "none" ? !e.owner : e.owner === v.owner)) && (!v.fam || e.ctls.some((c) => famOf(c) === v.fam)) && (!q || `${e.title} ${e.kind} ${e.owner} ${e.ctls.join(" ")} ${e.reqs.join(" ")} ${e.ckl ? e.ckl.tool : ""}`.toLowerCase().includes(q)));
    return { scoped, rows: v.status ? scoped.filter((e) => e.life === v.status) : scoped.filter((e) => e.life !== "error") };
  };
  const PAGE = 50;
  ["q", "status", "source", "owner", "fam"].forEach((k) => K.on("drb.ev." + k, (val) => { setView({ [k]: val || "", page: 0 }); K.redraw(); }));
  K.on("drb.ev.page", (n) => { setView({ page: Math.max(0, n) }); K.redraw(); const m = document.getElementById("main"); if (m) m.scrollTop = 0; });
  K.on("drb.ev.clear", () => { set("ev", {}); K.redraw(); });
  const tile = (k) => () => { const v = view(); setView({ status: v.status === k ? "" : k, page: 0 }); K.redraw(); };

  K.on("drb.ev.export", () => K.toast(`${plural(model().list.length, "evidence item")} exported as CSV, with status, renewal date, source, controls and owner`));
  K.on("drb.ev.add", () => {
    K.form({ title: "Add evidence", submit: "Add evidence", intro: "It joins the register with today's artifact and waits on a reviewer. Link the controls it serves from its page.",
      fields: [{ key: "title", label: "Name", required: true, placeholder: "What the artifact shows" }, { key: "kind", label: "Kind", type: "select", required: true, value: "Document", options: ["Document", "Test record", "Dataset"] }, { key: "owner", label: "Evidence owner", type: "select", required: true, value: ME, options: people() }],
      onSubmit: (val) => { const id = "drb-" + hash(val.title + Date.now()); K.push("dr.B.made", { id, title: val.title, kind: val.kind, owner: val.owner, at: TODAY }); setView({ status: "", page: 0 }); K.toast(`${val.title} added: Ready, renews ${md(addDays(TODAY, 365))}`); K.redraw(); return null; } });
  });
  const people = () => memo("people", () => uniq(((V3.fact("people", V3.prog()) || []).map((p) => p.name)).concat(model().list.map((e) => e.owner), [ME])).sort(natural));

  function registerPage() {
    const v = view(), all = model().list, A = ask(v), rows = A.rows;
    const n = (k) => A.scoped.filter((e) => e.life === k).length;
    const stats = D.stats(TILES.map((k) => ({ label: LIFE[k][0], n: n(k), problem: LIFE[k][2] && n(k) > 0, act: tile(k) })));
    const owners = uniq(all.map((e) => e.owner)).sort(natural), fams = uniq(all.flatMap((e) => e.ctls.map(famOf))).sort(natural);
    const cnt = (fn) => all.filter(fn).length;
    const views = { total: all.length, all: "All evidence", count: (st) => ask({ q: st.q || "", status: st.status || "", source: st.source || "", owner: st.owner || "", fam: st.family || "" }).rows.length,
      presets: [{ label: "Needs artifact", state: { status: "artifact" }, count: cnt((e) => e.life === "artifact") }, { label: "Needs renewal", state: { status: "renewal" }, count: cnt((e) => e.life === "renewal") }, { label: "Scan imports", state: { source: "Scan import" }, count: cnt((e) => e.source === "Scan import") }, { label: "STIG checklists", state: { source: "STIG checklist" }, count: cnt((e) => e.source === "STIG checklist") }],
      seed: [{ name: "Scan imports past renewal", state: { status: "renewal", source: "Scan import" }, by: "Joel Barrantes" }, { name: "Mine", state: { owner: ME }, by: ME }] };
    const filters = [
      { label: "Status", key: "status", value: v.status, act: "drb.ev.status", options: LORDER.map((k) => [k, LIFE[k][0], cnt((e) => e.life === k)]) },
      { label: "Source", key: "source", value: v.source, act: "drb.ev.source", options: SOURCES.map((s) => [s, s, cnt((e) => e.source === s)]).concat([["none", "No artifact", cnt((e) => !e.source)]]).filter((o) => o[2]) },
      { label: "Owner", key: "owner", value: v.owner, act: "drb.ev.owner", options: owners.map((o) => [o, o, cnt((e) => e.owner === o)]).concat([["none", "No owner", cnt((e) => !e.owner)]]).filter((o) => o[2]) },
      { label: "Control family", key: "family", value: v.fam, act: "drb.ev.fam", options: fams.map((f) => [f, f, cnt((e) => e.ctls.some((c) => famOf(c) === f))]) }];
    const page = Math.min(v.page, Math.max(0, Math.ceil(rows.length / PAGE) - 1)), shown = rows.slice(page * PAGE, (page + 1) * PAGE);
    D.walkable("drb-ev", rows.map((e) => e.sl));
    const foot = `<span class="num">${rows.length ? `${fmt(page * PAGE + 1)}–${fmt(page * PAGE + shown.length)} of ` : ""}${plural(rows.length, "item")}</span>${rows.length > PAGE ? `<span class="drb-pg">${K.btn("Previous", { sm: true, act: "drb.ev.page", arg: page - 1, disabled: page ? "" : "This is the first page" })}${K.btn("Next", { sm: true, act: "drb.ev.page", arg: page + 1, disabled: (page + 1) * PAGE < rows.length ? "" : "This is the last page" })}</span>` : ""}`;
    const head = D.review({ title: "Evidence register", current: "evidence" }) + K.head({ title: "Evidence", actions: K.menu("More", [{ label: "Import evidence from a spreadsheet", go: "dr-import" }, { label: "Export evidence", act: "drb.ev.export" }]) + K.btn("Add evidence", { primary: true, act: "drb.ev.add" }) });
    const errN = A.scoped.filter((e) => e.life === "error").length;
    const errLine = errN && v.status !== "error" ? `<p class="drb-hid">${warnW(plural(errN, "automated item") + " in error")}: the last run was rejected, so ${errN === 1 ? "it counts" : "they count"} neither way. ${K.actLink("Show them", "drb.ev.status", "error")}</p>` : "";
    return K.page({ cls: "k3d drb drb-reg", head, body: [stats, errLine,
      K.toolbar({ id: "dr-evidence", noun: "evidence", search: { act: "drb.ev.q", value: v.q, placeholder: "Search evidence" }, filters, views }),
      K.table({ label: "Evidence", cls: "drb-evs", cols: [{ label: "Name" }, { label: "Status", cls: "nw" }, { label: "Renewal date", cls: "nw" }, { label: "Source", cls: "nw" }, { label: "Controls", cls: "nw" }, { label: "Evidence owner", cls: "nw" }],
        rows: shown.map((e) => ({ go: recRoute(e), peek: { panel: "drb-ev", id: e.sl }, cells: [K.name(e.title), lifePill(e.life), renewCell(e), srcCell(e), ctlMark(e), ownerCell(e)] })),
        empty: { title: "No evidence matches", line: "Clear the search and the filters.", action: K.btn("Show all evidence", { sm: true, act: "drb.ev.clear" }) }, foot })] });
  }
  D.route("dr-evidence", () => registerPage(), { nav: "evidence" });

  // ——— The drawer (rec 23): what the page lists, walkable through the filtered list ———
  D.panel("drb-ev", (sl) => {
    const e = evBy(sl); if (!e) return null;
    const vs = versionsOf(e);
    return { label: "Evidence preview", status: lifePill(e.life), title: e.title, open: recRoute(e),
      facts: [["Renewal date", renewCell(e)], ["Source", srcCell(e)], ["Evidence owner", ownerCell(e)], ["Controls", ctlMark(e)], [e.ckl ? "Last run" : "Collected", e.collected ? `<span class="num">${esc(md(e.collected))}</span>` : none("Never")], e.ckl ? ["Open rules", `${catMark(e.ckl)} ${mu("CAT I · II · III")}`] : null].filter(Boolean),
      body: [nextOf(e, true),
        e.ckl && e.ckl.open ? K.section({ title: "Open rules", count: e.ckl.open, body: `<ul class="drb-vl drb-rl">${e.ckl.rules.slice(0, 3).map((r) => `<li><span class="${r.cat === 1 ? "drb-c1" : ""}">${esc(CATW[r.cat - 1] || "")}</span><span class="num">${esc(r.v)}</span><span class="drb-rt" title="${esc(r.title)}">${esc(r.title)}</span></li>`).join("")}</ul><p class="drb-more">${K.link("Open the checklist", e.ckl.route)}</p>` }) : "",
        K.section({ title: "Linked controls", count: e.ctls.length, body: e.ctls.length ? `<ul class="drb-chips">${e.ctls.map((c) => `<li>${D.idChip(c, ctlTone(c), { title: `${c} ${ctlTitle(c)} · ${STW[ctlKey(c)] || ""}`, go: ctlRoute(c) })}</li>`).join("")}</ul>` : mu("No control yet") }),
        K.section({ title: "Versions", count: vs.length, body: vs.length ? `<ul class="drb-vl">${vs.slice(0, 3).map((x) => `<li><span class="num">${esc(md(x.at))}</span><span>${esc(x.file)}</span>${x.fixed ? `<span class="drb-fixed">${g("lock")}Fixed</span>` : ""}</li>`).join("")}</ul>` : mu("No artifact yet") }),
        K.section({ title: "Renewal", body: K.facts([["Schedule", esc(e.fq.word[0].toUpperCase() + e.fq.word.slice(1))], ["Why", esc(whyOf(e.fq))]]) })].join("") };
  });

  // ════════════════ 2. The record (dr-evidence--<id>) ════════════════
  const fileOf = (e, at) => { const stem = clip(e.title, 44).replace(/…$/, "").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase(); return `${stem}-${String(at).replace(/-/g, "")}.${e.kind === "Dataset" ? "csv" : e.auto ? "json" : "pdf"}`; };
  // Versions (derived): an automated item's runs every 30 days back from its last collection, at most four and none before
  // Jul 1; a manual item's one collected artifact, then those added here.
  function versionsOf(e) {
    const out = [];
    if (e.ckl) { // a checklist's runs, each a fixed version; the imports made from this page after them
      cklRuns(e.ckl).forEach((r) => out.push({ at: r.at, file: r.file, by: r.by, fixed: r.st === "done" || r.st === "superseded", st: r.st, read: r.read }));
      e.added.forEach((x) => out.push({ at: x.at, file: x.file, by: x.by, fixed: true, st: "done", read: "" }));
      return out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
    }
    if (e.auto) { for (let i = 0, at = e.first; at && at >= "2026-07-01" && i < 4; i++, at = addDays(at, -30)) out.push({ at, file: fileOf(e, at), by: e.src, fixed: true }); return out; }
    if (e.first) out.push({ at: e.first, file: fileOf(e, e.first), by: e.owner || "—", base: true, review: e.added.length ? "Superseded" : REVW[e.review] || "" });
    e.added.forEach((x, i) => out.push({ at: x.at, file: x.file, by: x.by, added: i, review: i === e.added.length - 1 ? "Waiting on review" : "Superseded" }));
    return out.reverse();
  }
  function nextOf(e, compact) {
    if (e.auto && e.srcOff) return K.next({ label: "Source disabled", text: `${esc(e.src)} was disabled on ${esc(md(e.srcOff))}: no new runs arrive, so this evidence stops renewing.`, action: K.btn("Turn the source back on", { sm: true, act: "drb.src.on", arg: e.src }) });
    if (e.life === "error") return K.next({ label: "Error", text: `The last run of ${esc(e.src)}, ${esc(md(e.collected))}, was rejected: it counts neither way. Fix or disable the source.`, action: compact ? "" : K.btn("Fix the source", { sm: true, primary: true, act: "drb.src.fix", arg: e.src }) });
    if (e.life === "artifact") return K.next({ text: e.cited ? `Needs an artifact: ${e.reqs[0] ? esc(e.reqs[0]) + " cites it, but" : ""} nothing has been collected.` : `Needs an artifact: the reviewer sent the last one back.`, action: compact ? "" : K.btn("Add new artifact", { sm: true, primary: true, act: "drb.rec.add", arg: e.sl }) });
    if (e.life === "renewal") return K.next({ text: e.auto ? `Past renewal by ${plural(-daysTo(e.renew), "day")}: ${esc(e.src)}'s last run was ${esc(md(e.collected))}.` : `Past renewal by ${plural(-daysTo(e.renew), "day")}: collected ${esc(md(e.collected))}, renew ${esc(e.fq.word)}.`, action: compact ? "" : e.auto ? K.btn("Run the import now", { sm: true, primary: true, act: "drb.rec.run", arg: e.sl }) : K.btn("Renew", { sm: true, primary: true, act: "drb.rec.add", arg: e.sl }) });
    return "";
  }
  const addVersion = (sl, verb) => {
    const e = evBy(sl); if (!e) return;
    const vers = Object.assign({}, get("vers", {})), l = (vers[sl] || []).slice();
    l.push({ at: TODAY, file: fileOf(e, TODAY), by: verb === "run" ? e.src : ME });
    vers[sl] = l; set("vers", vers);
  };
  K.on("drb.rec.add", (sl) => {
    const e = evBy(sl); if (!e) return;
    K.form({ title: e.life === "renewal" ? "Renew evidence" : "Add new artifact", submit: e.life === "renewal" ? "Renew" : "Add artifact", intro: `${esc(clip(e.title, 90))}. The new artifact becomes the current version and waits on a reviewer; it renews ${esc(e.fq.word)}.`,
      fields: [{ key: "file", label: "File", required: true, value: fileOf(e, TODAY), hint: "The prototype keeps the name only, not the file." }, { key: "note", label: "Note for the reviewer", type: "textarea", rows: 2 }],
      onSubmit: (val) => { addVersion(sl, "add"); const vers = get("vers", {}); const l = vers[sl] || []; if (l.length) { l[l.length - 1].file = val.file; set("vers", vers); } K.toast(`New artifact added: Ready, renews ${md(addDays(TODAY, e.fq.days))}`); K.redraw(); return null; } });
  });
  K.on("drb.rec.run", (sl) => {
    const e = evBy(sl); if (!e) return;
    if (e.ckl && PA.drc && PA.drc.queue && PA.drc.queue(e.srcId)) { K.toast(`${e.src}: run queued. It renews this checklist once done.`); K.redraw(); return; }
    addVersion(sl, "run"); K.toast(`${e.src} ran: a fixed version of ${md(TODAY)} was imported`); K.redraw();
  });
  K.on("drb.rec.unadd", ([sl, i]) => { const vers = Object.assign({}, get("vers", {})), l = (vers[sl] || []).filter((x, n) => n !== i); vers[sl] = l; set("vers", vers); K.toast("Version removed"); K.redraw(); });
  K.on("drb.src.off", (src) => K.confirm({ title: `Disable ${src}`, submit: "Disable the source", danger: true, text: `No new runs arrive from ${esc(src)}. The versions it imported stay, fixed, and the evidence it feeds stops renewing.`, onOk: () => { set("off", Object.assign({}, get("off", {}), { [src]: TODAY })); K.toast(`${src} disabled`); K.redraw(); } }));
  K.on("drb.src.on", (src) => { const o = Object.assign({}, get("off", {})); delete o[src]; set("off", o); K.toast(`${src} is on again`); K.redraw(); });
  K.on("drb.src.fix", (src) => K.dialog({ title: `Fix ${src}`, submit: false, cancel: "Close", body: `<p>A wrong run is fixed at its source: correct the scan's scope or its credentials there, then run the import again. The prototype connects to no source and saves nothing here.</p>` }));
  K.on("drb.rec.link", (sl) => {
    const e = evBy(sl); if (!e) return;
    const have = new Set(e.ctls);
    K.pick({ title: "Link controls", multi: true, search: "Search WS-X90's baseline", submit: (n) => (n ? `Link ${plural(n, "control")}` : "Link controls"), intro: "This evidence will count toward each control you link.",
      items: baseline().map((c) => ({ id: c, code: c, title: ctlTitle(c), meta: STW[ctlKey(c)] || "", held: have.has(c) ? "Linked" : "" })),
      onPick: (ids) => { ids.forEach((c) => PA.drB.link(c, sl)); K.toast(`${plural(ids.length, "control")} linked`); K.redraw(); } });
  });
  K.on("drb.rec.unlink", ([sl, c]) => { PA.drB.unlink(c, sl); K.toast(`${c} unlinked`); K.redraw(); });
  K.on("drb.rec.del", (sl) => K.confirm({ title: "Delete evidence", submit: "Delete evidence", danger: true, text: "The prototype deletes nothing: WS-X90's evidence stays as it is.", onOk: () => K.toast("Nothing was deleted: the prototype keeps WS-X90's evidence") }));

  // A checklist's open rules by CAT, one compact mark; its open rules and its results, the two boxes its record adds.
  const CATW = ["CAT I", "CAT II", "CAT III"];
  const catMark = (c) => (c.open ? `<span class="drb-cat num" title="Open: ${esc(c.cat.map((n, i) => `${n} ${CATW[i]}`).join(" · "))}">${c.cat[0] ? `<b class="drb-c1">${fmt(c.cat[0])}</b>` : `<span>0</span>`}<i>·</i><span>${fmt(c.cat[1])}</span><i>·</i><span>${fmt(c.cat[2])}</span></span>` : mu("None open"));
  function cklBoxes(e) {
    const c = e.ckl;
    const rows = c.rules.map((r) => ({ go: c.route, peek: { panel: "v8g-rule", id: r.id }, cells: [r.cat === 1 ? `<span class="drb-c1">${CATW[0]}</span>` : esc(CATW[r.cat - 1] || ""), `<span class="num">${esc(r.v)}</span>`, K.name(r.title)] }));
    const rules = D.box("Open rules", c.open ? [K.table({ label: "Open rules", cls: "drb-rules", cols: [{ label: "CAT", cls: "nw" }, { label: "Rule", cls: "nw" }, { label: "Title" }], rows }), c.open > rows.length ? `<p class="drb-more">${K.link(`All ${fmt(c.open)} open rules`, c.route)}</p>` : ""] : `<div class="k3-none-row"><span>No rule is open</span></div>`, { actions: `<span class="drb-bx-m">${catMark(c)} ${mu("CAT I · II · III")}</span>` });
    const results = D.box("Results", K.facts([["Rules", `<span class="num">${fmt(c.total)}</span>${c.newer ? ` ${mu(`· ${c.newer} is out`)}` : ""}`], ["Open", `<span class="num">${fmt(c.open)}</span>`], ["Not a finding", `<span class="num">${fmt(c.naf)}</span>`], ["Not applicable", `<span class="num">${fmt(c.na)}</span>`], c.notrev ? ["Not reviewed", warnW(fmt(c.notrev))] : null, ["Compliance", `<span class="num">${esc(c.comp)}</span>`]].filter(Boolean)));
    return { rules, results };
  }
  function recordPage(sl) {
    const e = evBy(sl);
    const cur = e && e.ckl ? e.ckl.route : e && !e.made ? (typeof K.recRoute === "function" && K.recRoute("k3d-ev", e.id)) || `artifact--${encodeURIComponent(e.id)}` : "evidence";
    const review = D.review({ title: "Evidence record", current: cur });
    if (!e) return K.page({ cls: "k3d drb", head: review + K.head({ crumbs: [["Evidence", "dr-evidence"], ["Not found"]], title: "This evidence is no longer here" }), body: K.empty({ title: "Nothing at this address", action: K.btn("Open the register", { sm: true, go: "dr-evidence" }) }) });
    const nx = nextOf(e, false), vs = versionsOf(e);
    const head = D.head({ review, crumbs: [["Evidence", "dr-evidence"], [clip(e.title, 60)]], title: e.title,
      facts: e.ckl ? [["Status", lifePill(e.life)], ["Renewal date", renewCell(e)], ["Source", srcCell(e)], ["Last run", e.collected ? `<span class="num">${esc(md(e.collected))}</span>` : none("Never")], ["Open rules", catMark(e.ckl)], ["Evidence owner", ownerCell(e), { act: "drb.rec.owner", arg: e.sl }]]
        : [["Status", lifePill(e.life)], ["Renewal date", renewCell(e)], ["Source", srcCell(e)], ["Evidence owner", ownerCell(e), { act: "drb.rec.owner", arg: e.sl }], ["Collected", e.collected ? `<span class="num">${esc(md(e.collected))}</span>` : none("Never")], ["Controls", ctlMark(e)]],
      actions: { more: e.ckl ? [{ label: "Open the checklist", go: e.ckl.route }, { label: "Fix the source", act: "drb.src.fix", arg: e.src }, { label: "Disable the source", act: "drb.src.off", arg: e.src, danger: true }] : e.auto ? [{ label: "Fix the source", act: "drb.src.fix", arg: e.src }, { label: "Disable the source", act: "drb.src.off", arg: e.src, danger: true }] : [{ label: "Export as PDF", act: () => K.toast("Exported as PDF (prototype: no file is written)") }, { label: "Delete evidence", act: "drb.rec.del", arg: e.sl, danger: true }],
        secondary: { label: "Link controls", act: "drb.rec.link", arg: e.sl }, primary: nx || e.auto ? null : { label: "Add new artifact", act: "drb.rec.add", arg: e.sl } } });
    const ctlRows = e.ctls.map((c) => { const r = ctlRec(c) || {}; return { go: ctlRoute(c), cells: [`<span class="drb-cc">${D.idChip(c, ctlTone(c))}<span class="drb-ct">${esc(ctlTitle(c))}</span></span>`, ctlPill(c), e.via[c] === "rules" ? mu("Its rules") : e.via[c] ? `<span class="num">${esc(e.via[c])}</span>` : mu("Linked here"), r.ob ? `<span class="num">${fmt(r.oe || 0)} of ${fmt(r.ob)}</span>` : none(), e.via[c] === "" ? `<button type="button" class="btn sm k3-quiet"${K.a("drb.rec.unlink", [e.sl, c])}>Unlink</button>` : ""] }; });
    const controls = D.box("Linked controls", ctlRows.length ? K.table({ label: "Linked controls", cls: "drb-ctls", cols: [{ label: "Control" }, { label: "Status", cls: "nw" }, { label: "Cited by", cls: "nw" }, { label: "Objectives evidenced", cls: "nw" }, { label: "", cls: "tight" }], rows: ctlRows }) : `<div class="k3-none-row"><span>No control counts this evidence yet</span>${K.actLink("Link controls", "drb.rec.link", e.sl)}</div>`, { actions: `<span class="drb-bx-m num">${fmt(readyN(e))} of ${fmt(e.ctls.length)} ready</span>` + K.btn("Link controls", { sm: true, act: "drb.rec.link", arg: e.sl, icon: "plus" }) });
    const stW = (x) => (x.st === "rejected" || x.st === "failed" ? warnW(RUNW[x.st]) : x.st === "superseded" ? `<span class="drb-fixed">${g("lock")}Fixed</span> ${mu("· superseded")}` : RUNW[x.st] || "");
    const vRows = vs.map((x) => ({ cells: [`<span class="num">${esc(md(x.at))}</span>`, `<span class="drb-file" title="${esc(x.read || x.file)}">${esc(x.file)}</span>`, esc(x.by), e.ckl ? (x.st === "done" ? `<span class="drb-fixed">${g("lock")}Fixed</span>` : stW(x)) : x.fixed ? `<span class="drb-fixed">${g("lock")}Fixed</span>${x.at === e.first && e.life === "error" ? ` ${warnW("Rejected")}` : ""}` : x.review ? esc(x.review) : "", x.added != null ? `<button type="button" class="btn sm k3-quiet"${K.a("drb.rec.unadd", [e.sl, x.added])}>Remove</button>` : ""] }));
    const versions = D.box("Versions", [vRows.length ? K.table({ label: "Versions", cls: "drb-vers", cols: [{ label: "Collected", cls: "nw" }, { label: "Artifact" }, { label: e.auto ? "Imported by" : "Added by", cls: "nw" }, { label: e.auto ? "" : "Review", cls: "nw" }, { label: "", cls: "tight" }], rows: vRows }) : `<div class="k3-none-row"><span>No artifact collected</span>${K.actLink("Add new artifact", "drb.rec.add", e.sl)}</div>`,
      e.auto ? `<div class="drb-auto"><span>${g("lock")}${e.ckl ? "Each checklist is imported as a fixed version" : "Each run is imported as a fixed version"}: it can't be edited or deleted. Fix or disable the source instead.</span><span class="drb-auto-a">${K.btn("Fix the source", { sm: true, act: "drb.src.fix", arg: e.src })}${e.srcOff ? K.btn("Turn the source back on", { sm: true, act: "drb.src.on", arg: e.src }) : K.btn("Disable the source", { sm: true, act: "drb.src.off", arg: e.src })}</span></div>` : ""], { actions: e.auto ? `<span class="drb-bx-m">${esc(e.ckl ? e.ckl.tool : e.src)} · ${e.ckl ? `every ${e.ckl.cadence} days` : "monthly"}</span>` : "" });
    const renewal = D.box("Renewal", K.facts([["Schedule", esc(e.fq.word[0].toUpperCase() + e.fq.word.slice(1))], ["Why", esc(whyOf(e.fq))], e.fq.param ? ["Parameter", `<span class="num">${esc(e.fq.param)}</span> ${mu("not set in the tailoring")}`] : ["Next import", e.ckl && e.ckl.next ? `<span class="num">${esc(md(e.ckl.next))}</span> ${mu("· scheduled in STIG checklists")}` : none()], ["Renew by", renewCell(e)], ["Upcoming from", e.renew ? `<span class="num">${esc(md(addDays(e.renew, -windowOf(e.fq.days))))}</span>` : none()]]));
    const details = D.card({ id: "drb-det-" + e.sl, title: "Details", facts: e.ckl ? [["Kind", esc(e.kind)], ["Asset", e.ckl.compCode ? K.link(e.ckl.asset, "component--" + e.ckl.compCode) : esc(e.ckl.asset)], ["Tool", esc(e.ckl.tool)], ["Evidence owner", ownerCell(e)]] : [["Kind", esc(e.kind)], ["Review", e.cited ? none("No artifact") : esc(REVW[e.review] || "")], ["Evidence owner", ownerCell(e)], ["Cited by", e.reqs.length ? e.reqs.map((q) => `<a class="k3-link num" href="#requirement--${esc(q)}">${esc(q)}</a>`).join(", ") : mu("No requirement")]],
      fields: [{ key: "owner", label: "Evidence owner", type: "select", value: e.owner, options: [["", "No owner"]].concat(people().map((p) => [p, p])) }],
      save: (val) => { set("owner", Object.assign({}, get("owner", {}), { [e.sl]: val.owner || "" })); K.toast(val.owner ? `Evidence owner: ${val.owner}` : "Evidence owner removed"); K.redraw(); } });
    const ck = e.ckl ? cklBoxes(e) : { rules: "", results: "" };
    return K.page({ cls: "k3d drb drb-rec", head, body: D.sunken([nx, `<div class="drb-grid"><div class="drb-main">${ck.rules}${controls}${versions}</div><div class="drb-side">${ck.results}${renewal}${details}</div></div>`]) });
  }
  K.on("drb.rec.owner", (sl) => {
    const e = evBy(sl); if (!e) return;
    K.form({ title: "Evidence owner", submit: "Save owner", intro: "Who collects and renews this evidence. Each control keeps its own owner.", fields: [{ key: "owner", label: "Evidence owner", type: "select", value: e.owner, options: [["", "No owner"]].concat(people().map((p) => [p, p])) }],
      onSubmit: (val) => { set("owner", Object.assign({}, get("owner", {}), { [sl]: val.owner || "" })); K.toast(val.owner ? `Evidence owner: ${val.owner}` : "Evidence owner removed"); K.redraw(); return null; } });
  });
  D.routeLike("dr-evidence", (id) => recordPage(id), { nav: "evidence" });

  // ════════════════ 3. The picker (dr-evidence-pick) ════════════════
  // One objective of the expanded control set assessment: AC-17(04)(a)[01], Protection of Remote Access: Privileged Commands. The period is the campaign's window
  // (PA.data.CAMPAIGNS). Current in the period: an accepted or waiting artifact collected inside the window whose renewal
  // date falls after the window opened.
  const PICK = { cid: "exp", code: "AC-17(4)", i: 0 };
  const campaign = () => memo("camp", () => { const row = ((PA.data && PA.data.CAMPAIGNS) || []).find((x) => /Expanded Control Set/.test(x[0])) || []; return { id: "exp", name: row[0] || "WS-X90 Expanded Control Set Assessment", from: row[3] || "2026-09-14", to: row[4] || "2026-11-20", route: "assessment--exp" }; });
  const objective = () => memo("obj", () => { const l = (PA.v3r && PA.v3r.objectivesOf && PA.v3r.objectivesOf(PICK.code)) || []; return l[PICK.i] || { i: 0, label: "AC-17(04)(a)[01]", text: "the execution of privileged commands via remote access is authorized only in a format that provides assessable evidence" }; });
  const currentWhy = (e, c) => (!e.collected || e.cited ? "No artifact" : e.review === "revise" ? "Sent back for revision" : e.collected < c.from ? `Collected ${md(e.collected)}, before the period` : e.collected > c.to ? `Collected ${md(e.collected)}, after the period` : e.renew < c.from ? "Lapsed before the period" : "");
  const pv = () => Object.assign({ q: "", all: false, chosen: [], done: [] }, get("pick", {}) || {});
  const setPv = (ch) => set("pick", Object.assign({}, pv(), ch));
  K.on("drb.pk.q", (t) => { setPv({ q: t || "" }); K.redraw(); });
  K.on("drb.pk.all", () => { setPv({ all: !pv().all }); K.redraw(); });
  K.on("drb.pk.clear", () => { setPv({ chosen: [] }); K.redraw(); });
  K.on("drb.pk.link", () => {
    const p = pv(), ids = p.chosen.slice(); if (!ids.length) return;
    for (const sl of ids) PA.drB.link(PICK.code, sl);
    setPv({ chosen: [], done: uniq(p.done.concat(ids)) });
    K.toast(`${plural(ids.length, "artifact")} linked to ${objective().label}, mapped to ${PICK.code}`); K.redraw();
  });
  K.on("drb.pk.unlink", (sl) => { if ((get("links", {})[sl] || []).includes(PICK.code)) PA.drB.unlink(PICK.code, sl); setPv({ done: pv().done.filter((x) => x !== sl) }); K.toast("Unlinked from the objective"); K.redraw(); });
  document.addEventListener("change", (ev) => {
    if (!V3.on()) return;
    const t = ev.target; if (!t || !t.matches || !t.matches("input[data-drb-pick]")) return;
    const sl = t.getAttribute("data-drb-pick"), p = pv(), ch = new Set(p.chosen);
    t.checked ? ch.add(sl) : ch.delete(sl);
    setPv({ chosen: [...ch] }); K.redraw();
  }, true);

  function pickPage() {
    const c = campaign(), o = objective(), p = pv(), q = p.q.trim().toLowerCase(), done = new Set(p.done), chosen = new Set(p.chosen);
    const all = model().list.filter((e) => !done.has(e.sl));
    const why = new Map(all.map((e) => [e.sl, currentWhy(e, c)]));
    const match = (e) => !q || `${e.title} ${e.kind} ${e.owner} ${e.ctls.join(" ")}`.toLowerCase().includes(q);
    const serves = (e) => e.ctls.includes(PICK.code);
    const cur = all.filter((e) => !why.get(e.sl)), hidden = all.filter((e) => why.get(e.sl));
    const pool = (p.all ? all : cur).filter(match);
    const base = PICK.code.replace(/\(.*$/, ""), fam = famOf(PICK.code);
    const near = (e) => (e.ctls.some((x) => x.replace(/\(.*$/, "") === base) ? 0 : e.ctls.some((x) => famOf(x) === fam) ? 1 : 2);
    const first = pool.filter(serves), rest = pool.filter((e) => !serves(e)).sort((a, b) => near(a) - near(b)), LIMIT = 25;
    const servesOff = hidden.filter(serves);
    const box = (e) => { const off = why.get(e.sl); return off ? `<input type="checkbox" disabled aria-label="${esc(off)}" title="${esc(off)}">` : `<input type="checkbox" data-drb-pick="${esc(e.sl)}"${chosen.has(e.sl) ? " checked" : ""} aria-label="Choose ${esc(clip(e.title, 60))}">`; };
    const row = (e) => { const off = why.get(e.sl); return { cls: off ? "drb-off" : chosen.has(e.sl) ? "drb-on" : "", peek: { panel: "drb-ev", id: e.sl }, cells: [box(e), K.name(e.title), off ? `<span class="drb-oop">${esc(off)}</span>` : lifePill(e.life), e.collected ? `<span class="num">${esc(md(e.collected))}</span>` : none(), srcCell(e), ctlMark(e)] }; };
    const rows = [];
    rows.push({ group: `Serves ${esc(PICK.code)} <span class="num k3-muted">${fmt(first.length)}</span>${!first.length && !q ? `<span class="drb-grp-m">${servesOff.length ? `Nothing current: ${plural(servesOff.length, "item")} out of the period` : "No evidence serves it yet"}</span>` : ""}` });
    first.forEach((e) => rows.push(row(e)));
    if (rest.length) { rows.push({ group: `${p.all ? "Other evidence, nearest first" : "Other evidence current in the period, nearest first"} <span class="num k3-muted">${fmt(rest.length)}</span>` }); rest.slice(0, LIMIT).forEach((e) => rows.push(row(e))); }
    D.walkable("drb-ev", pool.map((e) => e.sl));
    const linked = p.done.map(evBy).filter(Boolean);
    const head = D.head({ review: D.review({ title: "Evidence picker on an assessment objective", current: "assessment--exp--objectives" }), crumbs: [["Assessments", "assessments"], ["Expanded control set assessment", c.route], ["Objectives", c.route + "--objectives"], [o.label]], title: `Link evidence to ${o.label}`,
      facts: [["Objective", `<span class="drb-obj" title="Determine if ${esc(o.text)}">${esc(clip("Determine if " + o.text, 110))}</span>`], ["Control", `${D.idChip(PICK.code, ctlTone(PICK.code), { title: ctlTitle(PICK.code), go: ctlRoute(PICK.code) })}`], ["Assessment period", `<span class="num">${esc(md(c.from))} – ${esc(md(c.to))}</span>`]],
      actions: { secondary: { label: "Back to the objectives", go: c.route + "--objectives" } } });
    const hiddenLine = hidden.length ? `<p class="drb-hid">${p.all ? `Showing ${plural(hidden.length, "item")} out of the period: they can't be linked. ` : `${plural(hidden.length, "item")} hidden: not current in the assessment period. `}${K.actLink(p.all ? "Hide them" : "Show them", "drb.pk.all")}</p>` : "";
    const doneBox = linked.length ? K.section({ title: `Linked to ${o.label}`, count: linked.length, body: K.table({ label: "Linked to the objective", cls: "drb-pk", cols: [{ label: "Evidence" }, { label: "Status", cls: "nw" }, { label: "Collected", cls: "nw" }, { label: "Maps to", cls: "nw" }, { label: "", cls: "tight" }], rows: linked.map((e) => ({ go: recRoute(e), cells: [K.name(e.title), lifePill(e.life), e.collected ? `<span class="num">${esc(md(e.collected))}</span>` : none(), D.idChip(PICK.code, ctlTone(PICK.code)), `<button type="button" class="btn sm k3-quiet"${K.a("drb.pk.unlink", e.sl)}>Unlink</button>`] })) }) }) : "";
    const n = p.chosen.length;
    const bar = `<div class="drb-pkbar"><span class="drb-pkbar-n">${n ? `<b class="num">${fmt(n)}</b> chosen · each maps to ${D.idChip(PICK.code, ctlTone(PICK.code))}` : mu("Choose the evidence the assessor examines for this objective")}</span>${n ? K.btn("Clear", { sm: true, quiet: true, act: "drb.pk.clear" }) : ""}${K.btn(n ? `Link ${plural(n, "artifact")}` : "Link evidence", { primary: true, act: "drb.pk.link", disabled: n ? "" : "Choose evidence first" })}</div>`;
    return K.page({ cls: "k3d drb drb-pick", head, body: [doneBox,
      K.toolbar({ id: "dr-evidence-pick", noun: "evidence", search: { act: "drb.pk.q", value: p.q, placeholder: "Search evidence" }, views: false }),
      hiddenLine,
      K.table({ label: "Evidence to link", cls: "drb-pk", cols: [{ label: "", cls: "tight" }, { label: "Name" }, { label: "Status", cls: "nw" }, { label: "Collected", cls: "nw" }, { label: "Source", cls: "nw" }, { label: "Controls", cls: "nw" }], rows,
        empty: { title: "No current evidence matches", line: "Clear the search, or show what is out of the period.", action: K.btn("Clear the search", { sm: true, act: "drb.pk.q", arg: "" }) },
        foot: rest.length > LIMIT ? `<span class="num">${fmt(first.length + LIMIT)} of ${plural(pool.length, "item")} shown · search to find the rest</span>` : `<span class="num">${plural(pool.length, "item")}</span>` }),
      bar] });
  }
  D.route("dr-evidence-pick", () => pickPage(), { nav: "assessments" });

  // ════════════════ 4. Import an SCTM or a POA&M spreadsheet (dr-import) ════════════════
  // Each kind of sheet has its own columns, its own words to map and its own sample (round 2: the POA&M's steps are its own).
  const STEPS = ["Upload", "Map columns", "Map values", "Review", "Confirm"];
  const iv = () => Object.assign({ at: 0, file: "", kind: "sctm", map: null, vmap: null, fix: {}, done: false }, get("imp", {}) || {});
  const setIv = (ch) => set("imp", Object.assign({}, iv(), ch));
  const inBaseline = (code) => baseline().includes(code);
  const isoD = (d) => (!d ? "" : (typeof d === "string" ? d : new Date(d).toISOString()).slice(0, 10));
  const OWNERS = ["Priya Raghavan", "Joel Barrantes", "Victor Amsel", "Wes Duarte", "Ingrid Solberg"];
  const RES = { create: "Creates", update: "Updates", same: "No change", skip: "Skipped" };

  // ——— The SCTM: 24 of WS-X90's own controls (the first two of each of twelve families in the baseline), each with the
  // requirement that maps it, its first component and owner, and its status. Four cells are wrong on purpose, as a real sheet
  // is: two control codes the baseline doesn't hold and two rows with no owner. A row whose status differs from the SSP's
  // updates that implementation; a control whose narrative is still the placeholder gets a new one; N/A rows are skipped. ———
  const IMPLW = { implemented: "Implemented", partial: "Partially implemented", planned: "Planned", not_implemented: "Not implemented", "": "Skip these rows" };
  const SCTM = {
    file: "WS-X90 SCTM.xlsx", sheet: "Controls", noun: "control implementation", what: "Controls and their implementations", title: "Import an SCTM spreadsheet", current: "sctm",
    heads: [["Control", "control"], ["Control name", ""], ["Requirement", "requirement"], ["Implementation status", "status"], ["Component", "component"], ["Responsible", "owner"], ["Implementation statement", "statement"], ["Last reviewed", ""]],
    fields: [["control", "Control code"], ["requirement", "Requirement"], ["status", "Implementation status"], ["component", "Component"], ["owner", "Implementation owner"], ["statement", "Implementation statement"], ["", "Don't import"]],
    need: ["control", "Control code"],
    vals: [["Implemented", "implemented"], ["Partial", "partial"], ["Planned", "planned"], ["Not implemented", "not_implemented"], ["N/A", ""]],
    words: IMPLW, valTitle: "Implementation status", valSub: "The sheet's words, matched to the statuses WS-X90 uses. N/A rows are skipped unless you map them.",
    sample: () => memo("sample", () => {
      const fams = ["AC", "AU", "CM", "IA", "SC", "SI", "CP", "IR", "MA", "RA", "SA", "PE"], ctls = (SSP && SSP.controls) || [], els = ((SSP && SSP.elements) || []).filter((x) => x[2] !== "platform");
      const pick = []; fams.forEach((f) => ctls.filter((c) => (c.f || "") === f).slice(0, 2).forEach((c) => pick.push(c)));
      const bump = { planned: "Partial", partial: "Implemented", implemented: "Implemented", not_implemented: "Planned" };
      return pick.slice(0, 24).map((c, i) => {
        const code = c.c, reqs = (V3.fact("requirementsOfControl", code) || []), cur = c.s || "planned";
        const sheetStatus = i === 11 || i === 19 ? "N/A" : i % 5 === 2 ? bump[cur] : (SCTM.vals.find((x) => x[1] === cur) || ["Planned"])[0];
        return { n: i + 2, code: i === 4 ? "AU-6(40)" : i === 14 ? "SC-7(52)" : code, real: code, title: c.t, req: reqs[0] || "", status: sheetStatus, cur, comp: els.length ? els[(i * 7) % els.length][0] : "", owner: i === 8 || i === 17 ? "" : OWNERS[i % OWNERS.length], ph: !!c.ph };
      });
    }),
    first: (r) => [r.code, r.title, r.req, r.status, r.comp, r.owner, "The component enforces…", "2026-10-02"],
    prevCols: ["Control code", "Requirement", "Implementation status", "Component", "Implementation owner"],
    prev: (r) => [`<span class="num">${esc(r.code)}</span>`, `<span class="num">${esc(r.req || "—")}</span>`, esc(r.status), `<span class="num">${esc(r.comp)}</span>`, r.owner ? esc(r.owner) : warnW("Empty")],
    judge: (r, vmap) => {
      const err = {}, warn = {}, st = vmap[r.status];
      if (!inBaseline(r.code)) err.Control = `${r.code} is not in WS-X90's baseline`;
      if (st !== "" && !r.owner) err.Owner = "An implementation needs an owner";
      let result = "";
      if (st === "") result = "skip"; else if (r.ph) result = "create"; else if (st !== r.cur) { result = "update"; warn.Status = `Updates ${r.code}: ${IMPLW[r.cur]} → ${IMPLW[st]}`; } else result = "same";
      return { err, warn, result };
    },
    cols: ["Control", "Requirement", "Status", "Component", "Owner", "Result"],
    cells: (j, vmap) => [j.r.code, j.r.req || "—", vmap[j.r.status] === "" ? `${j.r.status}: skipped` : IMPLW[vmap[j.r.status]] || j.r.status, j.r.comp, j.r.owner || "Empty", RES[j.result]],
    errVal: (r, k) => (k === "Control" ? r.code : r.owner),
    fixField: (r, k) => (k === "Control"
      ? { key: "v", label: "Control code", type: "select", required: true, value: r.real, options: [r.real].concat(baseline().filter((c) => c.split("(")[0] === r.real.split("(")[0] && c !== r.real).slice(0, 10)), hint: `${r.code} is not in WS-X90's baseline. The sheet's row names ${r.title}.` }
      : { key: "v", label: "Implementation owner", type: "select", required: true, value: "", options: people().map((x) => [x, x]), hint: "Each implementation names who keeps it." }),
    fixKey: (k) => (k === "Control" ? "code" : "owner"),
    moving: (c) => [{ label: "Implementation statements created", n: c("create") }, { label: "Implementations updated", n: c("update") }, { label: "Rows with no change", n: c("same"), locked: true }, { label: "Rows skipped (N/A)", n: c("skip"), locked: true }],
    done: (c) => `<span class="num">${fmt(c("create"))}</span> implementations created, <span class="num">${fmt(c("update"))}</span> updated, <span class="num">${fmt(c("same") + c("skip"))}</span> rows left as they were.`,
    unchanged: "WS-X90's SSP is unchanged", open: ["Open the workbook", "sctm"],
  };

  // ——— The POA&M: the program's own items as an eMASS-style export. 21 of WS-X90's open POA&M items that name a weakness and
  // its control (the weakness, the control, the milestones, the scheduled completion, the status), each with a point of contact
  // from the team (the items record none), and three weaknesses not yet on the POA&M: the open CAT I rules of V3's STIG
  // checklists (CM-6, due 30 days after the checklist's import). Four cells are wrong on purpose: two control codes the baseline
  // doesn't hold and two open rows with no scheduled completion. A row whose status or date differs from the item updates it;
  // a row with no item id creates one; Not Applicable rows are skipped. ———
  const PSTW = { in_progress: "In progress", completed: "Completed", risk_accepted: "Risk accepted", "": "Skip these rows" };
  const POAM = {
    file: "WS-X90 POA&M.xlsx", sheet: "POA&M", noun: "POA&M item", what: "POA&M items and their milestones", title: "Import a POA&M spreadsheet", current: "findings-poam",
    heads: [["POA&M Item ID", "id"], ["Weakness", "weakness"], ["Security Control Number", "control"], ["Milestones", "milestones"], ["Scheduled Completion Date", "due"], ["Status", "status"], ["POC", "owner"], ["Raw Severity", "severity"], ["Comments", ""]],
    fields: [["id", "POA&M item"], ["weakness", "Weakness"], ["control", "Control code"], ["milestones", "Milestones"], ["due", "Scheduled completion"], ["status", "Status"], ["owner", "Point of contact"], ["severity", "Severity"], ["", "Don't import"]],
    need: ["weakness", "Weakness"],
    vals: [["Ongoing", "in_progress"], ["Completed", "completed"], ["Risk Accepted", "risk_accepted"], ["Not Applicable", ""]],
    words: PSTW, valTitle: "Status", valSub: "The sheet's words, matched to the POA&M statuses WS-X90 uses. Not Applicable rows are skipped unless you map them.",
    sample: () => memo("psample", () => {
      const P0 = (PA.riskLookup && V3.wsx() && PA.riskLookup.all().POAM) || [];
      const items = P0.filter((p) => p.status !== "completed" && p.issues && p.issues[0] && (p.issues[0].from || []).length).slice(0, 21);
      const rows = items.map((p, i) => {
        const is = p.issues[0], ctl = is.from[0][0], due = isoD(p.deadline) || p.planned || "", base = ctl.replace(/\(.*$/, "");
        return { n: i + 2, id: p.id, weakness: is.title, code: i === 3 ? base + "(93)" : i === 15 ? base + "(41)" : ctl, real: ctl, ms: (p.ms || []).map((m) => m.title), due: i === 9 || i === 19 ? "" : i % 5 === 2 ? addDays(due, 60) : due,
          cur: { due, status: p.status === "open" ? "in_progress" : p.status }, status: i === 6 ? "Completed" : i === 13 ? "Risk Accepted" : i === 17 ? "Not Applicable" : "Ongoing", owner: p.owner || OWNERS[i % OWNERS.length], sev: is.sev || "" };
      });
      checklists().flatMap((c) => c.rules.filter((r) => r.cat === 1).map((r) => ({ c, r }))).slice(0, 3).forEach(({ c, r }) => rows.push({ n: rows.length + 2, id: "", weakness: `${r.v} ${r.title}`, code: "CM-6", real: "CM-6", ms: ["Apply the STIG fix", "Import the checklist again"], due: addDays(c.imp, 30), cur: null, status: "Ongoing", owner: c.owner || OWNERS[0], sev: "high" }));
      return rows;
    }),
    first: (r) => [r.id || "(new)", r.weakness, r.code, r.ms.map((m, k) => `${k + 1}) ${m}`).join("; "), r.due ? `${r.due.slice(5, 7)}/${r.due.slice(8, 10)}/${r.due.slice(0, 4)}` : "", r.status, r.owner, r.sev, ""],
    prevCols: ["POA&M item", "Weakness", "Control code", "Milestones", "Scheduled completion", "Status"],
    prev: (r) => [`<span class="num">${esc(r.id || "New")}</span>`, `<span class="drb-ell" title="${esc(r.weakness)}">${esc(r.weakness)}</span>`, `<span class="num">${esc(r.code)}</span>`, `<span class="num">${fmt(r.ms.length)}</span>`, r.due ? `<span class="num">${esc(mdy(r.due))}</span>` : warnW("Empty"), esc(r.status)],
    judge: (r, vmap) => {
      const err = {}, warn = {}, st = vmap[r.status];
      if (!inBaseline(r.code)) err.Control = `${r.code} is not in WS-X90's baseline`;
      if (st !== "" && st !== "completed" && !r.due) err["Scheduled completion"] = "An open item needs a scheduled completion date";
      let result = "";
      if (st === "") result = "skip";
      else if (!r.id) result = "create";
      else {
        if (st !== r.cur.status) warn.Status = `Updates item ${r.id}: ${PSTW[r.cur.status] || r.cur.status} → ${PSTW[st]}`;
        if (r.due && r.cur.due && r.due !== r.cur.due) warn["Scheduled completion"] = `Updates item ${r.id}: ${mdy(r.cur.due)} → ${mdy(r.due)}`;
        result = Object.keys(warn).length ? "update" : "same";
      }
      return { err, warn, result };
    },
    cols: ["Weakness", "Control", "Milestones", "Scheduled completion", "Status", "Result"],
    cells: (j, vmap) => [clip(j.r.weakness, 70), j.r.code, plural(j.r.ms.length, "milestone"), j.r.due ? mdy(j.r.due) : "Empty", vmap[j.r.status] === "" ? `${j.r.status}: skipped` : PSTW[vmap[j.r.status]] || j.r.status, RES[j.result]],
    errVal: (r, k) => (k === "Control" ? r.code : r.due),
    fixField: (r, k) => (k === "Control"
      ? { key: "v", label: "Control code", type: "select", required: true, value: r.real, options: [r.real].concat(baseline().filter((c) => c.split("(")[0] === r.real.split("(")[0] && c !== r.real).slice(0, 10)), hint: `${r.code} is not in WS-X90's baseline. The weakness: ${clip(r.weakness, 90)}` }
      : { key: "v", label: "Scheduled completion", type: "date", required: true, value: addDays(TODAY, 90), hint: "An open item needs the date its last milestone is due." }),
    fixKey: (k) => (k === "Control" ? "code" : "due"),
    moving: (c) => [{ label: "POA&M items created", n: c("create") }, { label: "POA&M items updated", n: c("update") }, { label: "Rows with no change", n: c("same"), locked: true }, { label: "Rows skipped (Not Applicable)", n: c("skip"), locked: true }],
    done: (c) => `<span class="num">${fmt(c("create"))}</span> POA&amp;M items created, <span class="num">${fmt(c("update"))}</span> updated, <span class="num">${fmt(c("same") + c("skip"))}</span> rows left as they were.`,
    unchanged: "WS-X90's POA&M is unchanged", open: ["Open the POA&M", "findings-poam"],
  };
  const SHEETS = { sctm: SCTM, poam: POAM };
  const kindOf = (v) => SHEETS[v.kind] || SCTM;
  const defaultMap = (k) => Object.fromEntries(k.heads.map(([h, f]) => [h, f]));
  const defaultVmap = (k) => Object.fromEntries(k.vals.map(([x, y]) => [x, y]));
  const rowsNow = () => { const v = iv(), f = v.fix || {}; return kindOf(v).sample().map((r) => Object.assign({}, r, f[r.n] || {})); };
  const go = (n) => { setIv({ at: n }); K.redraw(); const m = document.getElementById("main"); if (m) m.scrollTop = 0; };
  const seedImp = (kind, at) => { const k = SHEETS[kind]; set("imp", { at, file: k.file, kind, map: defaultMap(k), vmap: defaultVmap(k), fix: {}, done: false }); };
  K.on("drb.imp.sample", () => { const v = iv(), k = kindOf(v); setIv({ file: k.file, map: defaultMap(k), vmap: defaultVmap(k), fix: {}, done: false }); K.toast(`${k.file} read: ${plural(k.sample().length, "row")} in the sheet ${k.sheet}`); K.redraw(); });
  K.on("drb.imp.choose", () => { const k = kindOf(iv()); K.dialog({ title: "Choose a file", submit: false, cancel: "Close", body: `<p>The prototype reads no file from your computer. Use the sample, ${esc(k.file)}: it is the program's own ${k === POAM ? "POA&amp;M" : "workbook"}, exported as a sheet.</p>` }); });
  K.on("drb.imp.kind", (kind) => { if (iv().kind === kind) return; set("imp", { at: 0, kind, file: "", map: null, vmap: null, fix: {}, done: false }); K.redraw(); });
  K.on("drb.imp.reset", () => { set("imp", { kind: iv().kind }); K.redraw(); });
  const footFor = (v, errN) => {
    const back = v.at ? { backAct: () => go(v.at - 1), backLabel: "Back" } : {}, k = kindOf(v);
    if (v.done) return { nextAct: () => { set("imp", { kind: v.kind }); K.redraw(); }, nextLabel: "Start another import" };
    if (v.at === 0) return Object.assign(back, { nextAct: () => go(1), nextLabel: "Next: map columns", nextDisabled: v.file ? false : "Upload a sheet or use the sample first" });
    if (v.at === 1) return Object.assign(back, { nextAct: () => go(2), nextLabel: "Next: map values", nextDisabled: Object.values(v.map || {}).includes(k.need[0]) ? false : `Map a column to ${k.need[1]} first` });
    if (v.at === 2) return Object.assign(back, { nextAct: () => go(3), nextLabel: "Next: review" });
    if (v.at === 3) return Object.assign(back, { nextAct: () => go(4), nextLabel: errN ? `Fix ${plural(errN, "red cell")} to continue` : "Next: confirm", nextDisabled: errN ? `${plural(errN, "red cell")} left: fix each before you continue` : false });
    return Object.assign(back, { nextAct: () => { setIv({ done: true }); K.toast("Import finished (prototype: nothing was saved)"); K.redraw(); }, nextLabel: "Import" });
  };
  document.addEventListener("change", (ev) => {
    if (!V3.on()) return;
    const t = ev.target; if (!t || !t.matches) return;
    if (t.matches("select[data-drb-map]")) { const v = iv(); setIv({ map: Object.assign({}, v.map || defaultMap(kindOf(v)), { [t.getAttribute("data-drb-map")]: t.value }) }); K.redraw(); return; }
    if (t.matches("select[data-drb-vmap]")) { const v = iv(); setIv({ vmap: Object.assign({}, v.vmap || defaultVmap(kindOf(v)), { [t.getAttribute("data-drb-vmap")]: t.value }) }); K.redraw(); return; }
  }, true);

  const fixCell = (n, key) => {
    const k = kindOf(iv()), r = rowsNow().find((x) => x.n === n); if (!r) return;
    K.form({ title: `Fix row ${n - 1}: ${key === "Control" ? "control code" : key.toLowerCase()}`, submit: "Fix the cell", fields: [k.fixField(r, key)],
      onSubmit: (val) => { if (!val.v) return { v: "Choose one" }; const f = Object.assign({}, iv().fix || {}); f[n] = Object.assign({}, f[n] || {}, { [k.fixKey(key)]: val.v }); setIv({ fix: f }); K.toast(`Row ${n - 1} fixed`); K.redraw(); return null; } });
  };
  K.on("drb.imp.fix", ([n, key]) => fixCell(n, key));
  document.addEventListener("click", (ev) => {
    if (!V3.on()) return;
    const td = ev.target && ev.target.closest && ev.target.closest('[data-drk-sheet="drb-imp"] td.err'); if (!td) return;
    const tr = td.parentElement, ix = +((tr.querySelector(".drk-sh-i") || {}).textContent || 0), col = [...tr.children].indexOf(td) - 1;
    const k = kindOf(iv()), j = k.sample()[ix - 1], key = k.cols[col];
    if (j && key && key !== "Result") fixCell(j.n, key);
  });
  function importPage() {
    const v = iv(), k = kindOf(v), map = v.map || defaultMap(k), vmap = v.vmap || defaultVmap(k), rows = rowsNow(), judged = rows.map((r) => Object.assign({ r }, k.judge(r, vmap)));
    const errN = judged.reduce((n, j) => n + Object.keys(j.err).length, 0);
    if (v.at > 3 && errN && !v.done) v.at = 3; // Confirm is reached only once no red cell remains
    let body = "";
    if (v.at === 0) {
      body = `${K.section({ title: "What the sheet holds", body: K.seg([{ label: "SCTM", on: v.kind !== "poam", act: "drb.imp.kind", arg: "sctm" }, { label: "POA&M", on: v.kind === "poam", act: "drb.imp.kind", arg: "poam" }], "What the sheet holds") + `<span class="drb-kind-w k3-muted">${esc(k.what)}</span>` })}
        ${v.file ? `<div class="drb-file-card">${g("doc")}<span class="drb-fc-t"><b>${esc(v.file)}</b><span class="k3-muted">Sheet ${esc(k.sheet)} · ${plural(k.sample().length, "row")} · ${plural(k.heads.length, "column")}</span></span>${K.btn("Remove", { sm: true, quiet: true, act: "drb.imp.reset" })}</div>`
          : `<div class="drb-drop"><p><b>Drop an .xlsx or .csv file here</b></p><p class="k3-muted">The first row names the columns; each row after it is one ${esc(k.noun)}.</p><div class="drb-drop-a">${K.btn("Choose a file", { sm: true, act: "drb.imp.choose" })}${K.btn(`Use the sample: ${k.file}`, { sm: true, act: "drb.imp.sample" })}</div></div>`}`;
    } else if (v.at === 1) {
      const sm = k.sample();
      body = K.section({ title: "Match each column to a field", sub: "Matched by the column's name. A column mapped to Don't import is left out.", body: K.table({ label: "Columns", cls: "drb-map", cols: [{ label: "Column in the sheet" }, { label: "First values" }, { label: "Imports into", cls: "nw" }],
        rows: k.heads.map(([hd], i) => ({ cells: [`<b>${esc(hd)}</b>`, `<span class="k3-muted" title="${esc(sm.slice(0, 3).map((r) => k.first(r)[i] || "—").join(" · "))}">${esc(sm.slice(0, 3).map((r) => clip(k.first(r)[i] || "—", 48)).join(" · "))}</span>`, `<select class="drb-sel" data-drb-map="${esc(hd)}" aria-label="${esc(hd)} imports into">${k.fields.map(([f, l]) => `<option value="${esc(f)}"${map[hd] === f ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`] })) }) })
        + K.section({ title: "Preview", sub: "The sheet's first three rows as they will be read.", body: K.table({ label: "Preview", cls: "drb-prev" + (k === POAM ? " drb-prev-p" : ""), cols: [{ label: "Row", cls: "nw" }].concat(k.prevCols.map((c, i) => ({ label: c, cls: k === POAM && i === 1 ? "" : "nw" }))), rows: sm.slice(0, 3).map((r) => ({ cells: [`<span class="num">${r.n}</span>`].concat(k.prev(r)) })) }) });
    } else if (v.at === 2) {
      const cnt = (x) => rows.filter((r) => r.status === x).length;
      body = K.section({ title: k.valTitle, sub: k.valSub, body: K.table({ label: "Values", cls: "drb-map", cols: [{ label: "In the sheet" }, { label: "Rows", cls: "nw" }, { label: "Becomes", cls: "nw" }],
        rows: k.vals.map(([x]) => ({ cells: [`<b>${esc(x)}</b>`, `<span class="num">${fmt(cnt(x))}</span>`, `<select class="drb-sel" data-drb-vmap="${esc(x)}" aria-label="${esc(x)} becomes">${Object.keys(k.words).map((w) => `<option value="${esc(w)}"${vmap[x] === w ? " selected" : ""}>${esc(k.words[w])}</option>`).join("")}</select>`] })).filter((x, i) => cnt(k.vals[i][0])) }) });
    } else if (v.at === 3) {
      const reds = judged.flatMap((j) => Object.keys(j.err).map((key) => ({ n: j.r.n, key, val: k.errVal(j.r, key) })));
      body = D.sheet({ id: "drb-imp", cols: k.cols.map((c) => ({ key: c, label: c })), rows: judged.map((j) => ({ cells: k.cells(j, vmap), err: j.err, warn: j.warn })), filter: "all" })
        + (reds.length ? `<div class="drb-fixes"><span class="drb-fixes-t">${warnW(plural(reds.length, "red cell") + " left")}</span>${reds.map((x) => `<button type="button" class="btn sm"${K.a("drb.imp.fix", [x.n, x.key])}>Row ${x.n - 1} · ${esc(x.key)}: ${esc(x.val || "empty")}</button>`).join("")}</div>` : `<p class="drb-legend">${g("check")}Every row is valid.</p>`)
        + `<p class="drb-legend">Red stops the import: choose a red cell to fix it. Amber imports, and updates ${k === POAM ? "a POA&amp;M item" : "an implementation"} WS-X90 already has.</p>`;
    } else {
      const c = (x) => judged.filter((j) => j.result === x).length;
      body = v.done ? `<div class="drb-done"><h3>Imported, in the prototype</h3><p>${k.done(c)}</p><p class="k3-muted">Nothing was saved: the prototype keeps no import, and ${esc(k.unchanged)}.</p><p>${K.link(k.open[0], k.open[1])} · ${K.link("Open the evidence register", "dr-evidence")}</p></div>`
        : D.moving({ title: "What the import will do", rows: k.moving(c), moving: c("create") + c("update"), notMoving: c("same") + c("skip"), consequence: "All rows import together or none do. It saves nothing real: the prototype keeps no import." });
    }
    const page = D.steps({ back: { label: "Evidence", go: "dr-evidence" }, title: k.title, steps: STEPS, at: v.at, body, foot: footFor(v, errN) });
    return K.page({ cls: "k3d drb drb-imp", head: D.review({ title: "Import a spreadsheet (new screen)", current: k.current }), body: page });
  }
  D.route("dr-import", () => importPage(), { nav: "evidence" });
  // dr-import--review: the SCTM flow opened at Review with the WS-X90 sample read and nothing fixed yet; dr-import--poam: the
  // POA&M flow opened at Map columns with WS-X90's POA&M read (each seeded once on arrival; the reader's fixes and steps then
  // hold while they stay on the address).
  let SEEDED = "";
  window.addEventListener("hashchange", () => { if (!/^#dr-import--(review|poam)$/.test(location.hash)) SEEDED = ""; });
  D.routeLike("dr-import", (id) => {
    if ((id === "review" || id === "poam") && SEEDED !== id) { SEEDED = id; seedImp(id === "poam" ? "poam" : "sctm", id === "poam" ? 1 : 3); }
    return importPage();
  }, { nav: "evidence" });

  PA.drb = { model: () => model().list, evBy, campaign, objective, checklists: () => checklists(), fresh: () => { MEMO = {}; } };
  // ——— PA.drB: the evidence links and renewals lane B keeps, read by lanes A (the control record) and F (the renewal check) ———
  // Every link, unlink and renewal made on lane B's screens goes through here, so the other Drata screens show it. An id is the
  // evidence's address id (dr-evidence--<id>) or its raw V3 id. Session data: links { id: [codes] } adds, unl { id: [codes] }
  // V3 links removed, vers { id: [...] } renewals (K.set under dr.B.; Reset clears them).
  const resolve = (id) => evBy(String(id)) || model().list.find((e) => e.id === id) || evBy(slugOf(String(id))) || null;
  const linkRow = (e) => ({ id: e.sl, title: e.title, kind: e.kind, state: LIFE[e.life][0], stateKey: e.life, tone: LIFE[e.life][1], renew: e.renew, source: e.source, route: recRoute(e) });
  PA.drB = {
    linksFor(code) { return model().list.filter((e) => e.ctls.includes(code)).map(linkRow); },
    link(code, id) {
      const e = resolve(id); if (!e || !code) return false;
      const unl = Object.assign({}, get("unl", {})), links = Object.assign({}, get("links", {}));
      if ((unl[e.sl] || []).includes(code)) { unl[e.sl] = unl[e.sl].filter((c) => c !== code); set("unl", unl); }
      if (!e.ctls.includes(code) && !e.via[code]) { links[e.sl] = uniq((links[e.sl] || []).concat([code])); set("links", links); }
      MEMO = {}; return true;
    },
    unlink(code, id) {
      const e = resolve(id); if (!e || !code) return false;
      const links = Object.assign({}, get("links", {}));
      if ((links[e.sl] || []).includes(code)) { links[e.sl] = links[e.sl].filter((c) => c !== code); set("links", links); }
      if (e.via[code]) { const unl = Object.assign({}, get("unl", {})); unl[e.sl] = uniq((unl[e.sl] || []).concat([code])); set("unl", unl); }
      MEMO = {}; return true;
    },
    renewalCheck() {
      const l = model().list.filter((e) => e.collected && !e.made && e.life !== "error");
      const failing = l.filter((e) => e.life === "renewal" || e.life === "upcoming").sort((a, b) => String(a.renew).localeCompare(String(b.renew)) || natural(a.title, b.title));
      return { total: l.length, failing: failing.map((e) => ({ id: e.sl, title: e.title, expires: e.renew, state: LIFE[e.life][0], route: recRoute(e) })) };
    },
  };
})();
