// Before, v1 and v2: each screen as it was in version 5, as it was until the gap review (v1, the old "after"), and now (v2).
// Reads window.PA.BA (mod-zz-compare-data.js: the version 6 comparison, its pairs and their numbered v1 changes)
// and window.PA.BA2 (mod-zz-compare-v2.js: the screens added since, the v2 screenshots and what v2 changed on each screen).
// Routes: before-after (the overview) and before-after-<group> (that group's screens).
(function () {
  const { S, M, ROUTE_NAV, h } = window.PA;
  const { esc, fmt, header } = h;
  const B = () => window.PA.BA || { pairs: [], groups: [], findings: [], decisions: [], method: [], stats: {} };
  const B2 = () => window.PA.BA2 || { groups: [], pairs: [], shots: {}, notes: {}, v2: {}, findings: {} };
  const SEV = { high: "Changes how it works", medium: "Changes what it shows", low: "Cosmetic" };
  const VER = { confirmed: ["ok", "Confirmed in the screenshots"], partly: ["part", "Partly confirmed, corrected"] };
  const MODES = [["v12", "v1 and v2"], ["all", "All three"], ["before", "Before"], ["v1", "v1"], ["v2", "v2"]];
  let pendingJump = null;
  let mode = "v12";
  try { const m = localStorage.getItem("ba-mode"); if (MODES.some(([k]) => k === m)) mode = m; } catch (e) { /* storage off: the default stands */ }

  // One list of groups and screens across both data files.
  // New in v2 first (it is what this round adds), then the version 6 groups, then the groups added since; short tab labels so the strip fits.
  const SHORT = { v2new: "New in v2", work: "Home and work", tests: "Tests", docs: "Documents", people: "People", risk: "Risk", program: "Program", analysis: "Analysis", library: "Library" };
  function groups() {
    const added = B2().groups || [];
    // V3 (mod-zzzz-v3-9ba.js adds it) leads: it is what this round proposes.
    return [...added.filter((g) => g.key === "drata"), ...added.filter((g) => g.key === "v3"), ...added.filter((g) => g.key === "v2new"), ...B().groups, ...added.filter((g) => g.key !== "v2new" && g.key !== "v3" && g.key !== "drata")].map((g) => ({ ...g, short: SHORT[g.key] || g.short }));
  }
  function pairs() {
    const b2 = B2();
    const old = B().pairs.map((p) => ({ ...p, v1: p.after, v1devs: p.devs, v2: (b2.shots || {})[p.id] || null, v2notes: (b2.notes || {})[p.id] || [] }));
    const added = (b2.pairs || []).map((p) => ({ ...p, v1devs: [], v2: (b2.shots || {})[p.id] || p.v2 || null, v2notes: (b2.notes || {})[p.id] || [] }));
    return [...old, ...added];
  }
  const v2count = (list) => list.reduce((a, p) => a + p.v2notes.filter((n) => n.by !== "V").length, 0);
  const v1count = (list) => list.reduce((a, p) => a + p.v1devs.length, 0);

  const ev = (e) => `<a class="ba-ev" href="${esc(e.u)}" target="_blank" rel="noopener" title="${esc(`${e.t}, image ${e.n}. Local copy: docs/products/vanta/${e.f}`)}">${esc(e.s || e.t)}</a>`;
  const evs = (list) => (list && list.length ? `<span class="ba-evs">${list.map(ev).join("")}</span>` : "");

  function finding(f) {
    return `<div class="ba-find"><div class="ba-find-k">${esc(f.label)}</div><p class="ba-find-h">${esc(f.headline)}</p>
      <div class="ba-find-row"><span class="ba-who">Ours</span><span>${esc(f.ours)}</span></div>
      <div class="ba-find-row"><span class="ba-who v">Vanta</span><span>${esc(f.vanta)}${evs(f.ev)}</span></div></div>`;
  }

  function dev(d) {
    const sev = SEV[d.sev] ? d.sev : "medium";
    const v = VER[d.verdict];
    return `<li class="ba-dev"><span class="ba-n num" aria-hidden="true">${d.n}</span><div class="ba-dev-b">
      <div class="ba-dev-t"><b>${esc(d.title)}</b><span class="ba-dev-p"><span class="ba-sev ${sev}">${SEV[sev]}</span>${v ? h.pill(v[0], v[1]) : ""}</span></div>
      <dl class="ba-dl"><dt>Vanta</dt><dd>${esc(d.vanta)}${evs(d.ev)}</dd>
      <dt>Ours</dt><dd>${esc(d.ours)}</dd><dt>v1</dt><dd>${esc(d.change)}</dd></dl></div></li>`;
  }

  function note(n) {
    const f = (B2().findings || {})[n.finding];
    return `<li class="ba-v2n"><span class="ba-fid num"${f ? ` title="${esc(f)}"` : ""}>${esc(n.finding || "v2")}</span><span class="ba-v2t">${esc(n.text)}${n.where ? ` <span class="ba-where">${esc(n.where)}</span>` : ""}</span></li>`;
  }

  function frame(p, side) {
    const img = side === "before" ? p.before : side === "v1" ? p.v1 : p.v2;
    const cap = side === "before"
      ? `<span class="ba-tag">Before</span>${p.before ? "Version 5" : "Not in version 5"}`
      : side === "v1"
        ? `<span class="ba-tag">v1</span>${p.v1 ? (p.v1devs.length ? "Until the gap review, numbered changes from version 5" : "Until the gap review") : "Not in v1"}`
        : `<span class="ba-tag a">v2</span>${p.v2 ? "Now in the prototype" : "Being redrawn"}`;
    const empty = side === "before" ? "This screen did not exist in version 5." : side === "v1" ? (p.v1none || "v1 had no screen for this. It is new in v2.") : "The v2 screenshot is not taken yet.";
    const alt = side === "before" ? `${p.title} in version 5` : side === "v1" ? `${p.title} in v1` : `${p.title} in v2`;
    return `<figure class="ba-fig ba-f-${side}"><figcaption>${cap}</figcaption>
      ${img ? `<button type="button" class="ba-img" data-modal="ba-zoom" data-id="${esc(p.id)}|${side}" aria-label="Enlarge ${esc(alt)}"><img src="${esc(img)}" alt="${esc(alt)}" loading="lazy"></button>` : `<div class="ba-none">${esc(empty)}</div>`}</figure>`;
  }

  function switcher(current, label, attr) {
    return `<div class="ba-switch" role="group" aria-label="${esc(label)}">${MODES.map(([k, l]) => `<button type="button" ${attr}="${k}" aria-pressed="${k === current}">${l}</button>`).join("")}</div>`;
  }

  function pair(p) {
    // The visual layer's notes (agent V) are the cleanup rules every screen took; the rest are this screen's own changes.
    const own = p.v2notes.filter((n) => n.by !== "V"), rules = p.v2notes.filter((n) => n.by === "V");
    const n2 = own.length, n1 = p.v1devs.length, ok = p.v1devs.filter((d) => d.verdict === "confirmed").length;
    const go = p.afterRoute || p.route;
    return `<section class="ba-pair" id="ba-${esc(p.id)}" data-ba-mode-state="${mode}">
      <div class="ba-ph"><div class="ba-ph-t"><h3 tabindex="-1">${esc(p.title)}</h3>
        <div class="facts">${p.group === "v2new" ? `<span>New in v2</span>` : `<span class="num">${n2} ${n2 === 1 ? "change" : "changes"} in v2</span>`}${rules.length ? `<span class="num">${rules.length} cleanup ${rules.length === 1 ? "rule" : "rules"}</span>` : ""}${n1 ? `<span class="num">${n1} in v1, ${ok} confirmed outright</span>` : ""}${p.vantaPage ? `<span>Vanta: ${esc(p.vantaPage)}</span>` : ""}</div></div>
        <div class="btns">${go ? `<span class="btn sm ink" data-go="${esc(go)}" role="link" tabindex="0">Open the screen</span>` : ""}</div></div>
      ${switcher(mode, `Show ${p.title}`, "data-ba-mode")}
      <div class="ba-frames">${frame(p, "before")}${frame(p, "v1")}${frame(p, "v2")}</div>
      <div class="ba-lists">
        <div class="ba-v2"><h4>What v2 changed</h4>${p.group === "v2new" ? `<ul class="ba-v2l"><li class="ba-v2n"><span class="ba-fid num">new</span><span class="ba-v2t">A screen v1 did not have. In v1: ${esc(p.v1none || "nothing")}.</span></li>${own.map(note).join("")}</ul>` : n2 ? `<ul class="ba-v2l">${own.map(note).join("")}</ul>` : `<p class="ba-quiet">Nothing of its own: only the cleanup rules every screen took.</p>`}</div>
        ${rules.length ? `<details class="ba-v1"><summary>Cleanup rules on this screen <span class="num">${rules.length}</span></summary><ul class="ba-v2l ba-rules">${rules.map(note).join("")}</ul></details>` : ""}
        ${n1 ? `<details class="ba-v1"><summary>What v1 changed from version 5 <span class="num">${n1}</span></summary><ol class="ba-devs">${p.v1devs.map(dev).join("")}</ol></details>` : ""}
      </div>
    </section>`;
  }

  function tabs(on) {
    const ps = pairs();
    const v3n = () => (window.PA.v3ba ? (window.PA.v3ba.tabCount ? window.PA.v3ba.tabCount() : window.PA.v3ba.count()) : null);
    const list = [["before-after", "Overview", null], ...groups().map((g) => ["before-after-" + g.key, g.short || g.label, g.key === "v3" ? v3n() : g.key === "drata" ? (window.PA.drba ? window.PA.drba.count() : null) : ps.filter((p) => p.group === g.key).length])];
    return `<div class="ba-tabs" role="tablist" aria-label="Before, v1 and v2">${list.map(([r, l, n]) => `<span role="tab" tabindex="0" aria-selected="${r === on}" class="${r === on ? "on" : ""}" data-go="${r}">${esc(l)}${n !== null ? `<span class="ct num">${n}</span>` : ""}</span>`).join("")}</div>`;
  }

  function facts() {
    const ps = pairs(), s = B().stats || {};
    return `<span class="num">${ps.length} screens</span><span class="num">${fmt(v1count(ps))} changes in v1</span><span class="num">${fmt(v2count(ps))} changes in v2</span><span class="num">${fmt(s.ux || 0)} of Vanta's own screens looked at</span>`;
  }

  const LEDE = `<p class="ba-lede"><b>Three versions of every screen.</b> Before is version 5. v1 is the prototype until the gap review of 18 November: the old "after", drawn closer to Vanta, with its numbered changes. v2 is the prototype now, with the review's changes applied. Choose what to compare in each screen, or for the whole page with the switch at the top.</p>`;

  function v2block() {
    const v = B2().v2 || {};
    const steps = v.steps || [];
    return `<div class="ba-v2sum">
      <h3>What v2 changed</h3>
      ${v.lede ? `<p class="ba-lede">${esc(v.lede)}</p>` : ""}
      ${steps.length ? `<ol class="ba-steps">${steps.map((s) => `<li><b>${esc(s.title)}</b><span>${esc(s.text)}</span>${s.items && s.items.length ? `<ul>${s.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</li>`).join("")}</ol>` : ""}
      ${(v.left || []).length ? `<div class="ba-left"><h4>Left as it is, and why</h4><ul>${v.left.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    </div>`;
  }

  S["before-after"] = () => {
    const d = B(), ps = pairs();
    const toc = groups().map((g) => {
      const list = ps.filter((p) => p.group === g.key); if (!list.length) return "";
      return `<div class="ba-toc-g"><span class="ba-toc-k" data-go="before-after-${esc(g.key)}" role="link" tabindex="0">${esc(g.label)} <span class="num">${list.length}</span></span>${list.map((p) => `<a href="#before-after-${esc(g.key)}" data-ba-jump="${esc(g.key)}|${esc(p.id)}">${esc(p.title)} <span class="num">${((c) => p.group === "v2new" && !c ? "New" : c)(p.v2notes.filter((n) => n.by !== "V").length)}</span></a>`).join("")}</div>`;
    }).join("");
    const v3 = window.PA.v3ba ? `<div class="ba-v3call"><div><b>V3 has been rethought by record.</b> Ten places in the program's menu instead of 27 pages, and the work done on each record. It is a layer you switch on, so you can see it before it goes into the prototype.</div><span class="btn ink" data-go="before-after-v3" role="link" tabindex="0">Open V3</span></div>` : "";
    return `<div class="main ba">${header(window.PA.v3ba ? "Before, v1, v2 and V3" : "Before, v1 and v2", facts(), "")}${tabs("before-after")}
      ${v3}${LEDE}
      ${v2block()}
      <h3 class="ba-sub">Screens compared</h3>
      <p class="ba-quiet">The number beside each screen is how many changes v2 made on it. New marks a screen v1 did not have.</p>
      <nav class="ba-toc" aria-label="Screens compared">${toc}</nav>
      <details class="ba-hist"><summary>How v1 was made: the version 6 comparison with Vanta</summary>
        <p class="ba-lede">${esc(d.lede || "")}</p>
        <div class="ba-finds">${(d.findings || []).map(finding).join("")}</div>
        ${(d.decisions || []).length ? `<div class="ba-decide"><h3>Decisions it raised</h3><ol>${d.decisions.map((x) => `<li><b>${esc(x.title)}</b> ${esc(x.text)}</li>`).join("")}</ol></div>` : ""}
        <div class="ba-method"><h3>How it was checked</h3>${(d.method || []).map((m) => `<p>${esc(m)}</p>`).join("")}</div>
      </details>
      ${(B2().v2 || {}).method ? `<div class="ba-method"><h3>How v2 was checked</h3>${B2().v2.method.map((m) => `<p>${esc(m)}</p>`).join("")}</div>` : ""}
    </div>`;
  };

  const drawGroup = (key) => {
    const route = "before-after-" + key;
    const g = groups().find((x) => x.key === key) || { label: key };
    const ps = pairs().filter((p) => p.group === key);
    if (pendingJump) { const id = pendingJump; pendingJump = null; setTimeout(() => { const t = document.getElementById("ba-" + id); if (t) { t.scrollIntoView({ block: "start" }); t.querySelector("h3").focus({ preventScroll: true }); } }, 60); }
    return `<div class="main ba">${header(window.PA.v3ba ? "Before, v1, v2 and V3" : "Before, v1 and v2", facts(), "")}${tabs(route)}
      <div class="ba-gintro">${LEDE}<h2 class="ba-gh">${esc(g.label)}</h2>${g.intro ? `<p class="ba-lede">${esc(g.intro)}</p>` : ""}
      <div class="ba-gbar"><span class="ba-glabel">Show in every screen</span>${switcher(mode, "Show in every screen", "data-ba-all")}</div>
      <div class="ba-jumps">${ps.map((p) => `<a href="#${route}" data-ba-jump="${key}|${esc(p.id)}">${esc(p.title)}</a>`).join("")}</div></div>
      ${ps.map(pair).join("")}</div>`;
  };
  // Every group gets its route; the data files may add groups, so the list is read once here (both load before this module).
  for (const g of groups()) { const route = "before-after-" + g.key; ROUTE_NAV[route] = "before-after"; S[route] = () => drawGroup(g.key); }

  M["ba-zoom"] = (k) => {
    const [id, side] = String(k).split("|"); const p = pairs().find((x) => x.id === id); if (!p) return null;
    const img = side === "before" ? p.before : side === "v1" ? p.v1 : p.v2;
    const name = side === "before" ? "before" : side;
    return { title: `${p.title}: ${name}`, body: `<div class="ba-zoom"><img src="${esc(img)}" alt="${esc(p.title)} ${esc(name)}"></div>`, footer: `<button type="button" class="btn" data-close-modal>Close</button>` };
  };

  function setMode(sec, m) {
    sec.dataset.baModeState = m;
    sec.querySelectorAll("[data-ba-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.baMode === m)));
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ba-mode]");
    if (b) { setMode(b.closest(".ba-pair"), b.dataset.baMode); return; }
    const all = e.target.closest("[data-ba-all]");
    if (all) {
      mode = all.dataset.baAll;
      try { localStorage.setItem("ba-mode", mode); } catch (err) { /* storage off: this visit only */ }
      document.querySelectorAll("[data-ba-all]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.baAll === mode)));
      document.querySelectorAll(".ba-pair").forEach((sec) => setMode(sec, mode));
      return;
    }
    const j = e.target.closest("[data-ba-jump]");
    if (j) {
      e.preventDefault();
      const [g, id] = j.dataset.baJump.split("|"), route = "before-after-" + g;
      if ((location.hash || "").slice(1) === route) { const t = document.getElementById("ba-" + id); if (t) { t.scrollIntoView({ behavior: "smooth", block: "start" }); t.querySelector("h3").focus({ preventScroll: true }); } }
      else { pendingJump = id; location.hash = route; }
    }
  });
})();
