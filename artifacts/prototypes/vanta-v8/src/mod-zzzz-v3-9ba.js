// Before & after › V3 (route before-after-v3): what V3 recommends for the walkthrough's findings. A switch, walks the reader
// follows with a guide card, the fixes by theme with a "See it" for each, v2 and V3 screenshots, the menu side by side, and how V3
// was checked. Reads window.PA.REVIEW (the findings, mod-zzzz-v2-9review-data.js) and window.PA.BA3 (what each V3 lane did,
// mod-zzzz-v3-9ba-data.js, generated from SP/vanta/v3/<lane>/notes.json by SP/vanta/v3/gen-ba3.py). API, window.PA.v3ba:
//   see(spec)      switch V3 on and open spec = { route, prog: "wsx"|"created", open: { kind, id }, modal }
//   walk(id)       start a walk: V3 on, its guide card shown, its first step opened
//   ledger(id)     V3's entry for a finding id ({ status, text, why, see, lane }) or null
//   count()        how many findings V3 fixes in whole or in part
(function () {
  const PA = window.PA; if (!PA || !PA.v3 || !PA.v2) return;
  const { S, ROUTE_NAV, h } = PA;
  const { esc, fmt, header } = h;
  const V2 = PA.v2, V3 = PA.v3, WSX = "PRG-1090", ROUTE = "before-after-v3";
  const R = () => PA.REVIEW || { findings: [], themes: [], menu: {}, dup: [], fixes: [] };
  const D = () => PA.BA3 || { findings: {}, walks: [], extras: [], shots: [], checks: [], lanes: {} };
  const ledger = (id) => (D().findings || {})[id] || null;
  const standing = () => (R().findings || []).filter((f) => !(R().dropped || []).includes(f.id));
  const count = () => standing().filter((f) => { const l = ledger(f.id); return l && (l.status === "fixed" || l.status === "partly"); }).length;

  // ——— Opening what a fix changed ———
  const made = () => { try { return (PA.v2hubs && PA.v2hubs.made()) || []; } catch (e) { return []; } };
  function openThing(spec) {
    const main = document.getElementById("main"); if (!main) return;
    const fire = (attr, kind, id) => { const t = document.createElement("span"); t.setAttribute(attr, kind); if (id != null) t.dataset.id = String(id); t.hidden = true; main.appendChild(t); t.click(); t.remove(); };
    if (spec.open && spec.open.kind) {
      const el = main.querySelector(`[data-panel="${CSS.escape(spec.open.kind)}"][data-id="${CSS.escape(String(spec.open.id))}"]`);
      if (el) { el.scrollIntoView({ block: "center" }); el.click(); } else fire("data-panel", spec.open.kind, spec.open.id);
    }
    if (spec.modal) fire("data-modal", spec.modal, spec.modalId);
  }
  function see(spec) {
    spec = spec || {};
    if (!V3.on()) V3.set(true);
    if (spec.prog === "created") {
      const d = made()[0];
      if (!d) { V2.toast("This fix is on a created program: create one first (Continue on each step keeps the defaults).", { label: "Create program", route: "program-new" }); location.hash = "program-new"; return; }
      if (PA.v2hubs.cur() !== d.code) PA.v2hubs.setCur(d.code);
    } else if (spec.prog === "wsx" || !spec.prog) { if (PA.v2hubs && PA.v2hubs.cur() !== WSX) PA.v2hubs.setCur(WSX); }
    const route = spec.route || (location.hash || "#home").slice(1);
    const after = () => setTimeout(() => openThing(spec), 120);
    if ((location.hash || "").slice(1) === route) { V3.refresh(); after(); }
    else { location.hash = route; after(); }
  }

  // ——— The guide card: one step of a walk at a time, kept across pages ———
  const WKEY = "pa-v3-walk";
  const walkState = () => { try { return JSON.parse(sessionStorage.getItem(WKEY) || "null"); } catch (e) { return null; } };
  const saveWalk = (s) => { try { if (s) sessionStorage.setItem(WKEY, JSON.stringify(s)); else sessionStorage.removeItem(WKEY); } catch (e) { /* storage off */ } };
  // The rethink (V3 by record): what its lanes did, generated into PA.BA3R by SP/vanta/v3r/gen-ba3r.py.
  const D2 = () => PA.BA3R || { said: [], pages: [], folded: [], inplace: [], walks: [], shots: [], open: [], checks: [], lanes: [] };
  const walkOf = (id) => (D2().walks || []).concat(D().walks || []).find((w) => w.id === id) || null;
  function drawGuide() {
    let g = document.getElementById("v3guide");
    const s = walkState(), w = s && walkOf(s.id);
    if (!w || !V3.on()) { if (g) g.remove(); return; }
    const i = Math.max(0, Math.min(s.i || 0, w.steps.length - 1)), st = w.steps[i];
    if (!g) { g = document.createElement("section"); g.id = "v3guide"; g.className = "v3guide"; g.setAttribute("aria-label", "V3 walk"); (document.getElementById("proto") || document.body).appendChild(g); }
    g.classList.toggle("v3guide-min", !!s.min);
    g.innerHTML = s.min
      ? `<button type="button" class="v3guide-pill" data-v3g="max">Walk · step ${i + 1} of ${w.steps.length}</button>`
      : `<div class="v3guide-h"><span class="v3guide-k">Walk · step <span class="num">${i + 1}</span> of <span class="num">${w.steps.length}</span></span><button type="button" class="v3guide-ib" data-v3g="min" aria-label="Fold the walk">–</button><button type="button" class="v3guide-ib" data-v3g="end" aria-label="End the walk">✕</button></div>
        <p class="v3guide-t">${esc(w.title)}</p>
        <dl class="v3guide-dl"><dt>Do</dt><dd>${esc(st.do || "")}</dd>${st.see ? `<dt>Look for</dt><dd>${esc(st.see)}</dd>` : ""}${st.v2 ? `<dt>v2 did</dt><dd>${esc(st.v2)}</dd>` : ""}${st.was ? `<dt>Before</dt><dd>${esc(st.was)}</dd>` : ""}</dl>
        <div class="v3guide-f"><button type="button" class="btn sm" data-v3g="back"${i === 0 ? " disabled" : ""}>Back</button>${st.route ? `<button type="button" class="btn sm" data-v3g="open">Open this step</button>` : ""}<button type="button" class="btn sm ink" data-v3g="next">${i === w.steps.length - 1 ? "Finish" : "Next"}</button></div>`;
  }
  function openStep() {
    const s = walkState(), w = s && walkOf(s.id); if (!w) return;
    const st = w.steps[s.i || 0]; if (!st || !st.route) return;
    see({ route: st.route, prog: st.prog || w.prog, open: st.open, modal: st.modal });
  }
  function walk(id) {
    const w = walkOf(id); if (!w) return;
    saveWalk({ id, i: 0, min: false });
    if (!V3.on()) V3.set(true);
    drawGuide(); openStep();
  }
  document.addEventListener("click", (e) => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const ws = t.closest("[data-v3-walk]");
    if (ws) { e.preventDefault(); walk(ws.dataset.v3Walk); return; }
    const sb = t.closest("[data-v3-see]");
    if (sb) { e.preventDefault(); let spec = null; try { spec = JSON.parse(sb.dataset.v3See); } catch (x) { spec = null; } if (spec) see(spec); return; }
    const g = t.closest("[data-v3g]"); if (!g) return;
    e.preventDefault();
    const s = walkState(), w = s && walkOf(s.id); if (!w) return;
    const a = g.dataset.v3g;
    if (a === "end") { saveWalk(null); drawGuide(); V2.toast("Walk ended. V3 stays on until you switch it off.", { label: "Back to the V3 tab", route: ROUTE }); return; }
    if (a === "min" || a === "max") { s.min = a === "min"; saveWalk(s); drawGuide(); const f = document.querySelector(a === "min" ? "#v3guide .v3guide-pill" : "#v3guide [data-v3g=next]"); if (f) f.focus(); return; }
    if (a === "back") { s.i = Math.max(0, (s.i || 0) - 1); saveWalk(s); drawGuide(); openStep(); return; }
    if (a === "open") { openStep(); return; }
    if (a === "next") {
      if ((s.i || 0) >= w.steps.length - 1) { saveWalk(null); drawGuide(); V2.toast(`Walk finished: ${w.title}.`, { label: "Back to the V3 tab", route: ROUTE }); return; }
      s.i = (s.i || 0) + 1; saveWalk(s); drawGuide(); openStep();
      const n = document.querySelector("#v3guide [data-v3g=next]"); if (n) n.focus();
    }
  });
  window.addEventListener("hashchange", () => setTimeout(drawGuide, 0));
  V3.ready(drawGuide);

  // ——— The page ———
  const STATUS = { fixed: ["ok", "Fixed in V3"], partly: ["warn", "Partly fixed"], not: ["none", "Not fixed"] };
  const statusPill = (st) => { const s = STATUS[st] || ["none", "Not in V3 yet"]; return `<span class="v3b-st v3b-st-${esc(st || "none")}">${esc(s[1])}</span>`; };
  const SEV = { blocker: "Blocker", major: "Major", minor: "Minor" };
  const seeBtn = (spec, label) => (spec && (spec.route || spec.open || spec.modal) ? `<button type="button" class="v3b-see" data-v3-see="${esc(JSON.stringify(spec))}">${esc(label || "See it in V3")}</button>` : "");
  const shotUrl = (p) => String(p || "").replace(/^v3\/([A-Z])\/shots\//, "v3/");

  function fixRow(f) {
    const l = ledger(f.id);
    return `<li class="v3b-fix" id="v3b-${esc(f.id)}"><div class="v3b-fix-h"><b class="v3b-id">${esc(f.id)}</b><span class="v3b-sev v3b-sev-${esc(f.sev)}">${esc(SEV[f.sev] || f.sev)}</span>${statusPill(l && l.status)}</div>
      <p class="v3b-was"><span class="v3b-k">v2</span>${esc(f.what)}</p>
      ${l ? `<p class="v3b-now"><span class="v3b-k v3b-k3">V3</span>${esc(l.text || "")}${l.why ? ` <span class="v3b-why">${esc(l.why)}</span>` : ""}</p>` : `<p class="v3b-now v3b-dim"><span class="v3b-k v3b-k3">V3</span>Not addressed yet.</p>`}
      ${l && l.see ? `<div class="v3b-acts">${seeBtn(l.see)}</div>` : ""}</li>`;
  }
  function shotPair(s) {
    return `<figure class="v3b-shot"><figcaption><b>${esc(s.title)}</b>${s.caption ? `<span>${esc(s.caption)}</span>` : ""}${(s.findings || []).length ? `<span class="v3b-ids">${s.findings.map(esc).join(" · ")}</span>` : ""}</figcaption>
      <div class="v3b-shot-2">${[["v2", "ba-tag", s.v2], ["V3", "ba-tag a", s.v3]].map(([k, cls, src]) => `<div><span class="${cls}">${k}</span><button type="button" class="v3b-zoom" data-modal="v3b-zoom" data-id="${esc(shotUrl(src))}|${esc(`${s.title} in ${k}`)}" aria-label="Enlarge ${esc(s.title)} in ${k}"><img src="${esc(shotUrl(src))}" alt="${esc(s.title)} in ${k}" loading="lazy"></button></div>`).join("")}</div></figure>`;
  }
  function themeBlock(t, i) {
    const ids = new Set(t.ids || []);
    const fs = standing().filter((f) => ids.has(f.id));
    const done = fs.filter((f) => { const l = ledger(f.id); return l && l.status === "fixed"; }).length;
    const part = fs.filter((f) => { const l = ledger(f.id); return l && l.status === "partly"; }).length;
    const shots = (D().shots || []).filter((s) => (s.findings || []).some((x) => ids.has(x)));
    return `<section class="v3b-theme" id="v3b-t-${esc(t.key)}"><div class="v3b-theme-h"><span class="v3b-n">${i + 1}</span><div><h3>${esc(t.label)}</h3><p>${esc(t.text || "")}</p></div><span class="v3b-tally"><span class="num">${done}</span> of <span class="num">${fs.length}</span> fixed${part ? ` · <span class="num">${part}</span> partly` : ""}</span></div>
      ${shots.length ? `<div class="v3b-shots">${shots.map(shotPair).join("")}</div>` : ""}
      <details class="v3b-list"${i === 0 ? " open" : ""}><summary>The ${fs.length === 1 ? "finding" : `${fs.length} findings`}, v2 and V3</summary><ul>${fs.map(fixRow).join("")}</ul></details></section>`;
  }
  function menuBlock() {
    const m = R().menu || {};
    const col = (title, groups) => `<div class="v3b-menu-col"><h4>${esc(title)}</h4>${(groups || []).map((g) => `<div class="v3b-mg">${g.group ? `<div class="v3b-mgh">${esc(g.group)}${g.rmf && g.rmf !== g.group ? ` <span>${esc(g.rmf)}</span>` : ""}</div>` : ""}<ul>${(g.pages || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>`).join("")}</div>`;
    const merges = m.merges || [];
    return `<section class="v3b-sec"><h3 class="ba-sub">The program's menu, in the order the work is done</h3><p class="ba-lede">${esc(m.result || "")}</p>
      <div class="v3b-menu">${col("v2", m.today)}${col("V3", m.proposed)}</div>
      ${merges.length ? `<details class="v3b-list"><summary>What V3 merges and moves <span class="num">${merges.length + (m.moves || []).length}</span></summary><ul class="v3b-merges">${[...merges.map((x) => [x, "into"]), ...(m.moves || []).map((x) => [x, "to"])].map(([x, w]) => `<li><b>${esc(x.from)}</b> ${w} ${esc(x.to)}${x.why ? ` <span class="v3b-why">${esc(x.why)}</span>` : ""}</li>`).join("")}${m.tweak ? `<li>${esc(m.tweak.text.replace(/^My one change to the proposal: /, ""))}</li>` : ""}</ul></details>` : ""}
      <div class="v3b-acts">${seeBtn({ route: "overview", prog: "wsx" }, "Open WS-X90 with the V3 menu")}</div></section>`;
  }
  function walksBlock() {
    const ws = D().walks || [];
    if (!ws.length) return `<p class="ba-quiet">The walks are being written.</p>`;
    return `<div class="v3b-walks">${ws.map((w) => `<article class="v3b-walk"><h4>${esc(w.title)}</h4><p class="v3b-wmeta"><span class="num">${w.steps.length}</span> steps${w.prog === "created" ? " · on a program you create" : " · on WS-X90"}</p>${(w.findings || []).length ? `<p class="v3b-ids">${w.findings.map(esc).join(" · ")}</p>` : ""}<button type="button" class="btn sm ink" data-v3-walk="${esc(w.id)}">Start walk</button></article>`).join("")}</div>`;
  }
  function stats() {
    const fs = standing(), by = (st) => fs.filter((f) => { const l = ledger(f.id); return l && l.status === st; }).length;
    const none = fs.filter((f) => !ledger(f.id)).length;
    return `<dl class="v3b-stats"><div><dt>Fixed</dt><dd class="num">${by("fixed")}</dd></div><div><dt>Partly</dt><dd class="num">${by("partly")}</dd></div><div><dt>Not fixed</dt><dd class="num">${by("not") + none}</dd></div><div><dt>Of findings</dt><dd class="num">${fs.length}</dd></div></dl>`;
  }
  // ——— The rethink's blocks ———
  const LANE_OF = { O: "Overview", S: "System", C: "Controls", D: "Documents, requirements and evidence", E: "Assessments, findings, risks and authorization", P1: "Every list", P2: "Every page", P3: "Every preview" };
  const HOME = [["overview", "Overview"], ["system", "System"], ["component", "System"], ["controls", "Controls"], ["requirements", "Requirements"], ["evidence", "Evidence"], ["documents", "Documents"], ["ssp", "Documents"], ["itcsc", "Documents"], ["assessments", "Assessments"], ["findings", "Findings"], ["risks", "Risks"], ["authorization", "Authorization"]];
  const homeOf = (route) => { const r = String(route || ""); const hit = HOME.find(([k]) => r === k || r.startsWith(k + "-")); return hit ? hit[1] : "Elsewhere"; };
  const HOW = { view: "a view", tab: "a tab", rail: "a tab or a filter", section: "a section", panel: "a record's page", gone: "gone", page: "a page", filter: "a filter", rows: "rows of a record" };
  function pair2(s) {
    const cell = (k, cls, src) => (src ? `<div><span class="${cls}">${k}</span><button type="button" class="v3b-zoom" data-modal="v3b-zoom" data-id="${esc(src)}|${esc(`${s.title}: ${k}`)}" aria-label="Enlarge ${esc(s.title)}, ${k}"><img src="${esc(src)}" alt="${esc(s.title)}, ${k}" loading="lazy"></button></div>` : "");
    return `<figure class="v3b-shot"><figcaption><b>${esc(s.title)}</b>${s.caption ? `<span>${esc(s.caption)}</span>` : ""}</figcaption><div class="v3b-shot-2${s.was ? "" : " one"}">${cell("Before", "ba-tag", s.was)}${cell("V3", "ba-tag a", s.now)}</div></figure>`;
  }
  function saidBlock(x, i) {
    const d = D2(), lanes = new Set(x.lanes || []);
    const shots = (d.shots || []).filter((s) => lanes.has(s.lane)), walks = (d.walks || []).filter((w) => lanes.has(w.lane));
    const built = (x.lanes || []).some((l) => (d.lanes || []).includes(l));
    return `<section class="v3b-theme v3r-said" id="v3r-${esc(x.id)}"><div class="v3b-theme-h"><span class="v3b-n">${i + 1}</span><div><h3>${esc(x.title)}</h3><blockquote class="v3r-q">${esc(x.quote)}</blockquote><p>${esc(x.text)}</p></div></div>
      ${built ? `<div class="v3b-acts v3r-acts">${seeBtn(x.see, x.seeLabel || "See it in V3")}${walks.map((w) => `<button type="button" class="v3b-see" data-v3-walk="${esc(w.id)}">Walk: ${esc(w.title)}</button>`).join("")}</div>` : `<p class="v3b-dim">Being built: not in this version yet.</p>`}
      ${shots.length ? `<details class="v3b-list"${i < 3 ? " open" : ""}><summary>Before and V3, <span class="num">${shots.length}</span> ${shots.length === 1 ? "scene" : "scenes"}</summary><div class="v3b-shots">${shots.map(pair2).join("")}</div></details>` : ""}</section>`;
  }
  function foldedBlock() {
    const f = D2().folded || []; if (!f.length) return "";
    const groups = {}; f.forEach((x) => { const hname = homeOf(String(x.now || "").split(/[ ,(]/)[0]); (groups[hname] = groups[hname] || []).push(x); });
    const order = ["Overview", "System", "Controls", "Requirements", "Evidence", "Documents", "Assessments", "Findings", "Risks", "Authorization", "Elsewhere"].filter((k) => groups[k]);
    return `<section class="v3b-sec"><h3 class="ba-sub">Where each old page went</h3><p class="ba-lede">Every old address still opens: it lands on its new home.</p>
      <div class="v3r-map">${order.map((k) => `<div class="v3r-map-g"><h4>${esc(k)}</h4><ul>${groups[k].map((x) => `<li><span class="v3r-old">${esc(x.old)}</span><span class="v3r-how">${esc(HOW[x.how] || x.how || "")}</span>${x.dropped ? `<span class="v3b-why">Dropped: ${esc(x.dropped)}</span>` : ""}</li>`).join("")}</ul></div>`).join("")}</div></section>`;
  }
  function inplaceBlock() {
    const a = D2().inplace || []; if (!a.length) return "";
    const by = {}; a.forEach((x) => { (by[x.on] = by[x.on] || []).push(x); });
    return `<section class="v3b-sec"><h3 class="ba-sub">What you can now do on the record</h3>
      <div class="v3r-map">${Object.keys(by).map((k) => `<div class="v3r-map-g"><h4>${esc(k.charAt(0).toUpperCase() + k.slice(1))}</h4><ul>${by[k].map((x) => `<li><span>${esc(x.can.charAt(0).toUpperCase() + x.can.slice(1))}</span>${(x.shows || []).length ? `<span class="v3b-why">Shows on: ${esc(x.shows.join(", "))}</span>` : ""}</li>`).join("")}</ul></div>`).join("")}</div></section>`;
  }
  function jobsBlock() {
    const j = D2().jobs; if (!j || !(j.rows || []).length) return "";
    return `<section class="v3b-sec"><h3 class="ba-sub">Ten jobs, walked before and after</h3><p class="ba-lede">${esc(j.lede || "")}</p>
      <div class="frame"><div class="tablebox"><table><thead><tr><th>Job</th><th>First V3</th><th>V3 now</th></tr></thead><tbody>${j.rows.map((r) => `<tr><td class="nm" style="white-space:normal">${esc(r.job)}</td><td style="white-space:normal">${esc(r.was)}</td><td style="white-space:normal">${esc(r.now)}</td></tr>`).join("")}</tbody></table></div></div></section>`;
  }
  function openBlock() {
    const o = D2().open || []; if (!o.length) return "";
    return `<section class="v3b-sec"><details class="v3b-list"><summary>What is still open <span class="num">${o.length}</span></summary><ul class="v3b-merges">${o.map((x) => `<li><b>${esc(LANE_OF[x.lane] || x.lane)}</b> ${esc(x.text)}</li>`).join("")}</ul></details></section>`;
  }
  function rstats() {
    const d = D2();
    return `<dl class="v3b-stats"><div><dt>Menu pages</dt><dd class="num">27 → 10</dd></div><div><dt>Old pages folded</dt><dd class="num">${(d.folded || []).length}</dd></div><div><dt>Done on the record</dt><dd class="num">${(d.inplace || []).length}</dd></div><div><dt>Walks</dt><dd class="num">${(d.walks || []).length}</dd></div></dl>`;
  }
  function draw() {
    const on = V3.on(), d = D2();
    const tabs = S["before-after"] ? (() => { const t = document.createElement("template"); t.innerHTML = S["before-after"](); const el = t.content.querySelector(".ba-tabs"); if (el) { el.querySelectorAll('[role="tab"]').forEach((x) => { const sel = x.dataset.go === ROUTE; x.setAttribute("aria-selected", String(sel)); x.classList.toggle("on", sel); }); } return el ? el.outerHTML : ""; })() : "";
    const extras = D().extras || [], checks = (d.checks || []).length ? d.checks : D().checks || [];
    const ws = d.walks || [];
    return `<div class="main ba v3b">${header("Before, v1, v2 and V3", `<span class="num">27 pages became 10 records</span><span>v2 stays the prototype until you approve V3</span>`, "")}${tabs}
      <section class="v3b-hero"><div class="v3b-hero-t"><h2>V3, rethought: the program's records, and the work done on them</h2>
        <p class="ba-lede">The first V3 arranged the program by process step, which made many pages that each showed a piece of one thing and sent you elsewhere to change it. This V3 arranges it by record. Switch it on and the whole prototype runs this way; switch it off and you are back on v2.</p>
        <div class="v3b-switch">${on ? `<span class="v3b-onnow">V3 is on</span><button type="button" class="btn" data-v3-set="0">Back to v2</button>` : `<button type="button" class="btn ink" data-v3-set="1">Switch V3 on</button><span class="v3b-dim">You are looking at v2.</span>`}</div>
        ${(d.walks || []).length ? `<p class="v3b-how"><b>Three ways to look.</b> Start a walk: a card leads you step by step. Press See it under any block below. Or, with V3 on, use any page and press <b>Compare with v2</b> in the top bar.</p>` : `<p class="v3b-how"><b>Two ways to look.</b> Press See it under any block below. Or, with V3 on, use any page and press <b>Compare with v2</b> in the top bar.</p>`}</div>${rstats()}</section>
      <h3 class="ba-sub">What you said, and what changed</h3>
      ${(d.said || []).map(saidBlock).join("")}
      ${ws.length ? `<h3 class="ba-sub">Walk it</h3><div class="v3b-walks">${ws.map((w) => `<article class="v3b-walk"><h4>${esc(w.title)}</h4><p class="v3b-wmeta"><span class="num">${w.steps.length}</span> steps · ${esc(LANE_OF[w.lane] || "")}</p><button type="button" class="btn sm ink" data-v3-walk="${esc(w.id)}">Start walk</button></article>`).join("")}</div>` : ""}
      ${jobsBlock()}
      ${inplaceBlock()}
      ${foldedBlock()}
      ${openBlock()}
      <section class="v3b-sec"><h3 class="ba-sub">The first V3's fixes, kept underneath</h3><p class="ba-lede">The walkthrough's ${standing().length} findings were fixed in the first V3 (${count()} in whole or in part). Those fixes to the data and the flows stay under the new pages: one source for each fact, gates that read their deliverables, assessment by objective, a created program that is real. See it opens where each one lives now.</p>
        <details class="v3b-list"><summary>The findings by theme <span class="num">${standing().length}</span></summary><div class="v3r-old-themes">${(R().themes || []).map(themeBlock).join("")}</div></details>
        ${extras.length ? `<details class="v3b-list"><summary>Also changed in the first V3 <span class="num">${extras.length}</span></summary><ul class="v3b-extras">${extras.map((x) => `<li><span>${esc(x.text)}</span>${seeBtn(x.see, "See it")}</li>`).join("")}</ul></details>` : ""}</section>
      ${checks.length ? `<section class="v3b-sec"><h3 class="ba-sub">How V3 was checked</h3>${checks.map((c) => `<p class="ba-lede v3b-small">${esc(c)}</p>`).join("")}</section>` : ""}
    </div>`;
  }
  PA.M["v3b-zoom"] = (k) => { const i = String(k || "").indexOf("|"); const src = String(k).slice(0, i), title = String(k).slice(i + 1); return { title, body: `<div class="ba-zoom"><img src="${esc(src)}" alt="${esc(title)}"></div>`, footer: `<button type="button" class="btn" data-close-modal>Close</button>` }; };
  ROUTE_NAV[ROUTE] = "before-after";
  const g = function () { return draw(); }; g.__v2c = true; S[ROUTE] = g;
  // The tab joins the Before & after strip (mod-zz-compare.js puts it first and counts the findings V3 fixes).
  if (PA.BA2 && Array.isArray(PA.BA2.groups) && !PA.BA2.groups.some((x) => x.key === "v3")) PA.BA2.groups.unshift({ key: "v3", short: "V3", label: "V3, rethought by record", intro: "" });
  // The page redraws when V3 is switched while it is open.
  V2.on(() => { if ((location.hash || "").slice(1) === ROUTE) { /* the switch redraws the route itself */ } });

  PA.v3ba = { see, walk, ledger, count, tabCount: () => null };
})();
