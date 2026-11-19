// Prototype v2, agent C1 (v2r-): the record pages behind every preview's ↗ [A22 B3], and a control's page for every control.
// ↗ opens, in order: the page the preview names itself (data-adfull, kept by mod-after-docs; data-v2r-full), a page the prototype
// already draws for that kind (a check, a person, a plan, a STIG checklist, the SSP), else a record page drawn from the preview at
// rec--<kind>--<id>: the preview's title, its one status pill, its facts in a Details rail beside the body, its tabs as the page's
// tabs (each a page), and its actions in the header. A preview with no record behind it (a matrix cell, a posture cell) loses ↗.
// A control's page, rec--a-tests-control--<code>, is drawn in SI-2's shape from the chain (mod-zzzz-v2-1chain.js) for every control.
(function () {
  const PA = window.PA, V = PA && PA.v2;
  if (!V || !PA.AK) return;
  const { S, P, h, ROUTE_NAV } = PA;
  const AK = PA.AK, SSP = PA.SSP;
  const { esc, fmt, pill, tag, gl } = h;
  const CH = () => V.chain;
  const enc = (s) => encodeURIComponent(String(s));
  const dec = (s) => { try { return decodeURIComponent(s); } catch (e) { return s; } };
  const recRoute = (kind, id) => `rec--${kind}--${enc(id == null ? "" : id)}`;
  const DASH = '<span class="v2-dash" aria-label="None">—</span>';

  // ════════════════ Where a kind's page is, and which menu item it belongs to ════════════════
  // Pages the prototype already draws for a preview kind.
  const PAGES = {
    "a-tests-check": (id) => `check-${String(id).split("|")[0]}`,
    "a-people-person": (id) => personRoute(id), "risk-person": (id) => personRoute(id),
    "v8d-plan": (id) => (S["plan-" + id] ? "plan-" + id : null),
    ssp: () => "ssp",
    "v8g-ck": (id) => (S["stigs-" + id] ? "stigs-" + id : null),
    "plat-dc": (id) => (S["data-calls-" + id] ? "data-calls-" + id : null),
    "v7o-comp": (id) => (id === "mc" || /mission/i.test(id) ? "component-mc" : null),
    "a-tests-control": (id) => { const code = String(id || "").split("|")[0]; return code === "SI-2" ? "control-si2" : recRoute("a-tests-control", code); },
  };
  const personRoute = (id) => { const slug = String(id || "").split("|")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); return S["person-" + slug] ? "person-" + slug : null; };
  // Previews that are a reading of a matrix, not a record: no page can make sense, so they lose ↗.
  // v2 (F): a requirement has no page of its own; its chain is a component of its preview on the Requirements page.
  const NO_PAGE = new Set(["v7a-pcell", "sys-cell", "sys-pf", "posture-cell", "v7a-gapc", "cmp-gap", "sys-delta-fam", "v7a-cyf", "v7p-req", "v2f-ev"]);
  const NAV_OF = { "a-tests-control": "controls", "a-risk-risk": "risks", "a-risk-issue": "findings", "a-risk-poam": "poam", "a-risk-sup": "suppliers", "v7p-req": "requirements", "v7p-decision": "authorization", "a-work-task": "schedule", "a-work-gate": "schedule", "a-work-rq": "review-queue" };
  const navOf = (kind) => V.get("rec.nav." + kind, null) || NAV_OF[kind] || null;
  const labelOfNav = (key) => { const it = (PA.navItems ? PA.navItems() : []).find(([k]) => k === key); return it ? it[1] : null; };

  // ════════════════ A record page drawn from its preview ════════════════
  const txt = (el) => (el ? (el.textContent || "").replace(/\s+/g, " ").trim() : "");
  function fromPreview(kind, id) {
    const o = P[kind] && P[kind](id);
    if (!o) return null;
    const tpl = document.createElement("template");
    tpl.innerHTML = o.body;
    const root = tpl.content;
    // Title and actions: the kit's record head, else the first heading.
    let title = "", actions = "";
    const rh = root.querySelector(".ak-rh");
    if (rh) {
      title = txt(rh.querySelector(".ak-title"));
      const b = rh.querySelector(".btns"); actions = b ? b.innerHTML : "";
      rh.remove();
    } else {
      const hd = root.querySelector("h4, h3, h2, .ak-title");
      if (hd) {
        title = txt(hd);
        const box = hd.parentElement && hd.parentElement !== root && hd.parentElement.children.length <= 3 ? hd.parentElement : null;
        if (box) { box.querySelectorAll(".btn").forEach((x) => { actions += x.outerHTML; }); box.remove(); } else hd.remove();
      }
    }
    title = title || o.label.replace(/ preview$/i, "");
    // Facts: the kit's labelled values, else the first definition list. One status pill goes beside the title: the first fact
    // that holds a pill leaves the facts for it.
    const facts = [];
    let chip = "";
    const fl = root.querySelector(".ak-facts") || root.querySelector("dl.ak-kv, dl.kv");
    if (fl) {
      const pairs = fl.classList.contains("ak-facts") ? [...fl.querySelectorAll(":scope > div")].map((d) => [d.querySelector("dt"), d.querySelector("dd")]) : [...fl.querySelectorAll(":scope > dt")].map((dt) => [dt, dt.nextElementSibling]);
      pairs.forEach(([dt, dd]) => {
        const p = dd && dd.querySelector(".pill");
        if (p && !chip) { chip = p.outerHTML; if (txt(dd) === txt(p)) return; }
        facts.push([txt(dt), dd ? dd.innerHTML : ""]);
      });
      const wrap = fl.parentElement && fl.parentElement !== root && fl.parentElement.children.length === 1 ? fl.parentElement : fl;
      wrap.remove();
    }
    // The page has one primary: the preview's first action (the visual layer outlined it inside the preview).
    actions = actions.replace(/class="btn([^"]*)\bv2-sec\b/, 'class="btn$1 ink');
    // Tabs: the preview's own tabs become the page's, each a page (rec--kind--base|tab).
    let tabs = "";
    const strip = root.querySelector(".ak-tabs, [role=tablist]");
    if (strip) {
      tabs = strip.outerHTML.replace(new RegExp(`data-panel="${kind.replace(/[-]/g, "\\-")}" data-id="([^"]*)"`, "g"), (m, tid) => `data-go="${recRoute(kind, tid.replace(/&amp;/g, "&"))}"`);
      strip.remove();
    }
    // Inside the page, a link that opened this same preview on another tab now opens that tab's page.
    const rest = root.firstElementChild && root.children.length === 1 && /pan\b|-pan|pan /.test(root.firstElementChild.className) ? root.firstElementChild.innerHTML : (() => { const d = document.createElement("div"); d.appendChild(root.cloneNode(true)); return d.innerHTML; })();
    return { title, actions, facts: facts.slice(0, 6), more: facts.slice(6), chip, tabs, body: rest, label: o.label };
  }
  function genericPage(kind, id) {
    const x = fromPreview(kind, id);
    const nav = navOf(kind), navLabel = nav ? labelOfNav(nav) : null;
    if (!x) return h.page(AK.recordHead({ crumbs: nav && navLabel ? [[navLabel, nav], ["Not found"]] : [["Home", "home"], ["Not found"]], title: "This record is not in the prototype" }), `<div class="card"><p class="note-p">${esc(kind)} · ${esc(id)}</p></div>`);
    const kindWord = x.label.replace(/ preview$/i, "");
    const head = AK.recordHead({ crumbs: [...(nav && navLabel ? [[navLabel, nav]] : []), [kindWord]], title: x.title, chip: x.chip, actions: x.actions });
    const rail = x.facts.length ? AK.railCard(`${kindWord} details`, x.facts.map(([k, v]) => [k, v || DASH])) : "";
    const body = `<div class="v2r-body">${x.body}</div>`;
    return h.page(head.replace(/<\/div>\s*$/, `${x.tabs}</div>`), rail ? AK.withRail(body, rail) : body);
  }

  // ════════════════ A control's page, in SI-2's shape, for every control ════════════════
  const IMPL = { implemented: ["ok", "Implemented"], partial: ["part", "Partial"], planned: ["none", "Planned"], not_implemented: ["bad", "Not implemented"] };
  const TABS = [["impl", "Implementation"], ["requirements", "Requirements"], ["evidence", "Evidence"], ["assessment", "Assessment"], ["findings", "Findings"], ["activity", "Activity"]];
  const ctlTab = (code, tab) => recRoute("a-tests-control", tab && tab !== "impl" ? `${code}|${tab}` : code);
  const tbl = (cols, rows, empty) => rows.length ? `<div class="frame"><div class="tablebox"><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div><div class="pager"><span class="num">1–${rows.length} of ${rows.length}</span></div></div>` : AK.empty({ title: empty[0], line: empty[1] });
  function controlPage(code, tab) {
    const ch = CH(); if (!ch) return h.page(h.header(code, "", ""));
    const v = ch.view(code), b = SSP.ctl(code) || { c: code, t: code, f: code.split("-")[0], s: "planned", n: "" };
    const l = ch.links(code);
    const step = v.step;
    const stepBtn = step ? (step.modal ? `<span class="btn ink" role="button" tabindex="0" data-modal="${step.modal}" data-id="${esc(step.id || code)}">${esc(step.label)}</span>` : `<span class="btn ink" ${ch.goAttr(step.route, step.q)}>${esc(step.label)}</span>`) : "";
    const xr = PA.v2reqs ? PA.v2reqs.mappedTo(code).filter((k) => k !== v.s.req && !ch.baseReqsOf(code).some((x) => x[0] === k)).map((k) => [k, PA.v2reqs.title(k), null, "Mapped " + ch.md(PA.v2reqs.mappedAt(k, code))]) : [];
    const reqs = [...(v.s.req ? [[v.s.req, v.s.reqTitle, v.s.evTitle || null, "Mapped " + ch.md(v.s.mapAt)]] : []), ...xr, ...ch.baseReqsOf(code).map(([k, t, e]) => [k, t, e, "WS-X90's mapping"])];
    const counts = { requirements: reqs.length, evidence: reqs.filter((r) => r[2]).length, assessment: v.camp ? v.ob : 0, findings: (v.det ? 1 : 0) + (v.issue ? 1 : 0) + (v.poam ? 1 : 0) + (v.risk ? 1 : 0) };
    const events = [];
    const s = v.s;
    if (s.mapAt) events.push(["Ingrid Solberg", `mapped <b>${esc(s.req)}</b> to ${esc(code)}: ${v.ob} of ${v.ob} objectives`, s.mapAt]);
    if (s.evAt) events.push(["Ingrid Solberg", `linked <b>${esc(s.evTitle)}</b> to ${esc(s.req)}`, s.evAt]);
    if (s.campAt) events.push(["Ingrid Solberg", `added ${v.ob} objectives to <b>${esc(v.camp ? v.camp.title : "")}</b>`, s.campAt]);
    if (s.readyAt) events.push(["Ingrid Solberg", "set the evidence request Ready for the assessor", s.readyAt]);
    if (s.detAt) events.push([s.detBy || "Nadia Fournier", `judged it <b>${esc(ch.ST[s.det][1])}</b> in the draft results`, s.detAt]);
    if (s.pubAt) events.push(["D. Okafor", `published the results: <b>${esc(ch.ST[s.det][1])}</b>`, s.pubAt]);
    const head = AK.recordHead({ crumbs: [["Controls", "controls"], [code]], title: `${code} ${v.title}`,
      actions: `<details class="v2r-more"><summary class="btn" aria-label="More control actions" title="More control actions">⋯</summary><div class="v2r-menu" role="menu"><span role="menuitem" tabindex="0" data-modal="a-tests-owner" data-id="${esc(code)}">Assign owner</span><span role="menuitem" tabindex="0" data-go="baseline">Open in Baseline</span></div></details>${stepBtn}`,
      facts: [["Status", ch.stPill(v.status)], ["Family", tag(v.fam)], ["Owner", AK.owner(null)], ["Determined by", v.db ? esc(v.db) : DASH]] });
    const tabs = AK.tabs(TABS.map(([k, label]) => [label, k === "impl" || k === "activity" ? (k === "activity" ? events.length || null : null) : counts[k], ctlTab(code, k), k === (tab || "impl")]), "Control sections");
    const rail = `${AK.railCard("Where it stands", [["Mapped", `<span class="num">${fmt(v.om)} of ${fmt(v.ob)}</span> objectives`], ["With evidence", `<span class="num">${fmt(v.oe)} of ${fmt(v.ob)}</span> objectives`], ["Assessed", `<span class="num">${fmt(v.oa)} of ${fmt(v.ob)}</span> objectives`], ["Campaign", v.camp ? `<span class="ak-link" ${ch.goAttr(v.camp.route)}>${esc(v.camp.short)}</span>` : DASH]])}
      <div class="ak-rail-s"><div class="ak-rail-t">Next step</div><p class="v2r-p">${step ? esc(step.label) : v.status === "satisfied" ? "None: an assessor found it satisfied." : "Nothing moves it until its determination's findings are closed."}</p></div>`;
    let body;
    const t = tab || "impl";
    if (t === "requirements") body = tbl(["Requirement", "Title", "Evidence", "Mapping"], reqs.map(([k, ti, e, m]) => `<tr tabindex="0" data-panel="v7p-req" data-id="${esc(k)}"><td class="nm">${esc(k)}</td><td>${esc(ti || "")}</td><td>${e ? esc(e) : DASH}</td><td>${esc(m)}</td></tr>`), ["No requirement maps it yet", `Map a requirement and ${code}'s objectives count as mapped on SYS-WSX90.`]) + (v.status === "no_requirement" ? `<p class="note-p"><span class="ak-link" role="button" tabindex="0" data-modal="v2k-map" data-id="${esc(code)}">Map a requirement</span></p>` : "");
    else if (t === "evidence") body = tbl(["Evidence", "Cited by", "Review"], reqs.filter((r) => r[2]).map(([k, , e]) => `<tr><td class="nm">${esc(e)}</td><td>${tag(k)}</td><td>${k === s.req ? pill("none", "Pending review") : pill("ok", "Accepted")}</td></tr>`), ["No evidence yet", reqs.length ? `Link evidence to ${reqs[0][0]} and it covers ${code}'s objectives.` : "Evidence comes through a requirement that maps the control."]) + (v.status === "no_evidence" ? `<p class="note-p"><span class="ak-link" role="button" tabindex="0" data-modal="v2k-link" data-id="${esc(code)}">Link evidence</span></p>` : "");
    else if (t === "assessment") body = v.camp ? tbl(["Campaign", "Objectives", "Request", "Determination"], [`<tr tabindex="0" data-go="${esc(v.camp.route)}"><td class="nm">${esc(v.camp.title)}</td><td class="num">${v.ob}</td><td>${s.det ? (s.published ? "Accepted" : "Judged · draft") : s.ready ? "Ready" : s.camp ? "Not ready" : DASH}</td><td>${s.det ? esc(ch.ST[s.det][1]) + (s.published ? "" : " · draft") : DASH}</td></tr>`], ["", ""]) : AK.empty({ title: "No campaign holds it", line: `Add ${code} to an assessment campaign's draft plan, or plan an assessment around it.` }) + (v.status === "not_assessed" ? `<p class="note-p"><span class="ak-link" role="button" tabindex="0" data-modal="v2k-addcamp" data-id="${esc(code)}">Add to assessment campaign</span></p>` : "");
    else if (t === "findings") body = `<div class="v2r-links">${l.fnd}${l.risks}</div>`;
    else if (t === "activity") body = events.length ? AK.activity(events.slice().reverse().map(([who, what, when]) => ({ who, what, when: ch.mdy(when) }))) : AK.empty({ title: "Nothing recorded here yet", line: "Each mapping, evidence link, campaign and determination joins this list with who and when." });
    else body = AK.withRail(`<div class="card"><div class="t">Implementation in SSP 3 <span>${pill(...(IMPL[b.s] || IMPL.planned))}</span></div><p class="v2r-p">${esc(b.n || "No narrative written yet.")}</p><div><span class="ak-link" data-go="ssp" role="link" tabindex="0">Open it in the SSP</span></div></div>${l.reqs}${l.evs}`, rail);
    return h.page(head.replace(/<\/div>\s*$/, `${tabs}</div>`), body);
  }

  // ════════════════ Registering the pages on demand ════════════════
  function draw(route) {
    const m = /^rec--([a-z0-9-]+)--(.*)$/.exec(route); if (!m) return null;
    const kind = m[1], id = dec(m[2]);
    if (kind === "a-tests-control") { const [code, tab] = id.split("|"); return () => controlPage(code, tab); }
    return () => genericPage(kind, id);
  }
  function ensure(route) {
    if (!route || S[route] || !/^rec--/.test(route)) return;
    const fn = draw(route); if (!fn) return;
    const kind = route.split("--")[1];
    V.screen(route, fn, navOf(kind) || undefined);
  }
  window.addEventListener("hashchange", () => ensure(V.cur()));
  ensure(V.cur());
  PA.v2.records = { recRoute, ensure, fromPreview };

  // ════════════════ ↗ on every preview ════════════════
  const fullRoute = (panel) => {
    if (panel.querySelector("[data-adfull]")) return "adfull";
    const own = panel.querySelector("[data-v2r-full]"); if (own) return own.getAttribute("data-v2r-full");
    const last = V.lastPanel(); if (!last || !last.kind) return null;
    if (NO_PAGE.has(last.kind)) return null;
    const known = PAGES[last.kind] && PAGES[last.kind](last.id);
    if (known && (S[known] || /^rec--/.test(known))) return known;
    return recRoute(last.kind, last.id);
  };
  // Draw ↗ only where a page can open: drop it on a preview with no record behind it.
  const panelEl = document.getElementById("panel");
  if (panelEl && window.MutationObserver) new MutationObserver(() => {
    if (panelEl.hidden) return;
    const b = panelEl.querySelector('.bar-top button[aria-label="Open the full record"]'); if (!b || b.dataset.v2r) return;
    b.dataset.v2r = "1";
    const r = fullRoute(panelEl);
    if (!r) { b.remove(); return; }
    b.setAttribute("title", "Open the full record");
  }).observe(panelEl, { childList: true });
  document.addEventListener("click", (e) => {
    const b = e.target && e.target.closest ? e.target.closest('#panel .bar-top button[aria-label="Open the full record"]') : null;
    if (!b) return;
    const r = fullRoute(panelEl);
    if (r === "adfull") return; // mod-after-docs opens its own page
    e.preventDefault(); e.stopPropagation();
    if (!r) return;
    const last = V.lastPanel(), cur = V.cur();
    if (last && last.kind && !V.get("rec.nav." + last.kind, null)) V.set("rec.nav." + last.kind, ROUTE_NAV[cur] || cur);
    ensure(r);
    const x = panelEl.querySelector("#closePanel"); if (x) x.click();
    location.hash = r;
  }, true);
})();
