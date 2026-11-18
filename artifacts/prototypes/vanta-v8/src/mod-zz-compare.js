// Before and after: where the prototype deviates from Vanta, screen by screen. Reads window.PA.BA (mod-zz-compare-data.js).
// Routes: before-after (the overview) and before-after-<group> (that group's pairs).
(function () {
  const { S, M, ROUTE_NAV, h } = window.PA;
  const { esc, fmt, header } = h;
  const B = () => window.PA.BA || { pairs: [], groups: [], findings: [], decisions: [], method: [], stats: {} };
  const SEV = { high: "Changes how it works", medium: "Changes what it shows", low: "Cosmetic" };
  const VER = { confirmed: ["ok", "Confirmed in the screenshots"], partly: ["part", "Partly confirmed, corrected"] };
  let pendingJump = null;

  const ev = (e) => `<a class="ba-ev" href="${esc(e.u)}" target="_blank" rel="noopener" title="${esc(`${e.t}, image ${e.n}. Local copy: docs/examples/products/vanta/${e.f}`)}">${esc(e.s || e.t)}</a>`;
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
      <dt>Ours</dt><dd>${esc(d.ours)}</dd><dt>After</dt><dd>${esc(d.change)}</dd></dl></div></li>`;
  }

  function pair(p) {
    const n = p.devs.length, ok = p.devs.filter((d) => d.verdict === "confirmed").length;
    return `<section class="ba-pair" id="ba-${esc(p.id)}" data-ba-mode-state="both">
      <div class="ba-ph"><div class="ba-ph-t"><h3 tabindex="-1">${esc(p.title)}</h3>
        <div class="facts"><span class="num">${n} ${n === 1 ? "change" : "changes"}</span><span class="num">${ok} of ${n} confirmed outright</span>${p.vantaPage ? `<span>Vanta: ${esc(p.vantaPage)}</span>` : ""}</div></div>
        <div class="btns">${p.afterRoute ? `<span class="btn sm ink" data-go="${esc(p.afterRoute)}" role="link" tabindex="0">Open the screen</span>` : ""}</div></div>
      <div class="ba-switch" role="group" aria-label="Show">${[["both", "Side by side"], ["before", "Before"], ["after", "After"]].map(([k, l]) => `<button type="button" data-ba-mode="${k}" aria-pressed="${k === "both"}">${l}</button>`).join("")}</div>
      <div class="ba-frames">
        <figure class="ba-fig ba-before"><figcaption><span class="ba-tag">Before</span>${p.route ? "Version 5" : "Not in version 5"}</figcaption>
          ${p.before ? `<button type="button" class="ba-img" data-modal="ba-zoom" data-id="${esc(p.id)}|before" aria-label="Enlarge the before screen of ${esc(p.title)}"><img src="${esc(p.before)}" alt="${esc(p.title)} in version 5" loading="lazy"></button>` : `<div class="ba-none">We have no screen for this. The after screen is new.</div>`}</figure>
        <figure class="ba-fig ba-after"><figcaption><span class="ba-tag a">After</span>Now in the prototype, numbered changes</figcaption>
          ${p.after ? `<button type="button" class="ba-img" data-modal="ba-zoom" data-id="${esc(p.id)}|after" aria-label="Enlarge the after screen of ${esc(p.title)}"><img src="${esc(p.after)}" alt="${esc(p.title)} drawn closer to Vanta" loading="lazy"></button>` : ""}</figure>
      </div>
      <ol class="ba-devs">${p.devs.map(dev).join("")}</ol>
    </section>`;
  }

  function tabs(on) {
    const d = B();
    const list = [["before-after", "Overview", null], ...d.groups.map((g) => ["before-after-" + g.key, g.short || g.label, d.pairs.filter((p) => p.group === g.key).length])];
    return `<div class="ba-tabs" role="tablist" aria-label="Before and after">${list.map(([r, l, n]) => `<span role="tab" tabindex="0" aria-selected="${r === on}" class="${r === on ? "on" : ""}" data-go="${r}">${esc(l)}${n !== null ? `<span class="ct num">${n}</span>` : ""}</span>`).join("")}</div>`;
  }

  function facts() {
    const d = B(), s = d.stats || {};
    const devs = d.pairs.reduce((a, p) => a + p.devs.length, 0);
    return `<span class="num">${fmt(s.images || 0)} help-center images looked at</span><span class="num">${fmt(s.ux || 0)} of them Vanta's own screens</span><span class="num">${d.pairs.length} screens compared</span><span class="num">${devs} changes, each checked</span>`;
  }

  S["before-after"] = () => {
    const d = B();
    const groups = d.groups.map((g) => {
      const ps = d.pairs.filter((p) => p.group === g.key); if (!ps.length) return "";
      return `<div class="ba-toc-g"><span class="ba-toc-k" data-go="before-after-${esc(g.key)}" role="link" tabindex="0">${esc(g.label)} <span class="num">${ps.length}</span></span>${ps.map((p) => `<a href="#before-after-${esc(g.key)}" data-ba-jump="${esc(g.key)}|${esc(p.id)}">${esc(p.title)} <span class="num">${p.devs.length}</span></a>`).join("")}</div>`;
    }).join("");
    return `<div class="main ba">${header("Before and after", facts(), "")}${tabs("before-after")}
      <p class="ba-lede"><b>Version 7 adopted every change.</b> The after screens are now the prototype’s screens, and the screens no pair covered were redrawn in the same style. Before shows version 5.</p>
      <p class="ba-lede">${esc(d.lede || "")}</p>
      <div class="ba-finds">${(d.findings || []).map(finding).join("")}</div>
      ${(d.decisions || []).length ? `<div class="ba-decide"><h3>Decisions this raises</h3><ol>${d.decisions.map((x) => `<li><b>${esc(x.title)}</b> ${esc(x.text)}</li>`).join("")}</ol></div>` : ""}
      <h3 class="ba-sub">Screens compared</h3>
      <nav class="ba-toc" aria-label="Screens compared">${groups}</nav>
      <div class="ba-method"><h3>How this was checked</h3>${(d.method || []).map((m) => `<p>${esc(m)}</p>`).join("")}</div>
    </div>`;
  };

  for (const key of ["work", "tests", "docs", "people", "risk"]) {
    const route = "before-after-" + key;
    ROUTE_NAV[route] = "before-after";
    S[route] = () => {
      const d = B(), g = d.groups.find((x) => x.key === key) || { label: key };
      const ps = d.pairs.filter((p) => p.group === key);
      if (pendingJump) { const id = pendingJump; pendingJump = null; setTimeout(() => { const t = document.getElementById("ba-" + id); if (t) { t.scrollIntoView({ block: "start" }); t.querySelector("h3").focus({ preventScroll: true }); } }, 60); }
      return `<div class="main ba">${header("Before and after", facts(), "")}${tabs(route)}
        <div class="ba-gintro"><p class="ba-lede"><b>Version 7 adopted every change.</b> The after screens are now the prototype’s screens, and the screens no pair covered were redrawn in the same style. Before shows version 5.</p><h2 class="ba-gh">${esc(g.label)}</h2>${g.intro ? `<p class="ba-lede">${esc(g.intro)}</p>` : ""}
        <div class="ba-jumps">${ps.map((p) => `<a href="#${route}" data-ba-jump="${key}|${esc(p.id)}">${esc(p.title)}</a>`).join("")}</div></div>
        ${ps.map(pair).join("")}</div>`;
    };
  }

  M["ba-zoom"] = (k) => {
    const [id, side] = String(k).split("|"); const p = B().pairs.find((x) => x.id === id); if (!p) return null;
    return { title: `${p.title}: ${side === "before" ? "before" : "after"}`, body: `<div class="ba-zoom"><img src="${esc(side === "before" ? p.before : p.after)}" alt="${esc(p.title)} ${esc(side)}"></div>`, footer: `<button type="button" class="btn" data-close-modal>Close</button>` };
  };

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ba-mode]");
    if (b) {
      const sec = b.closest(".ba-pair"); sec.dataset.baModeState = b.dataset.baMode;
      sec.querySelectorAll("[data-ba-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
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
