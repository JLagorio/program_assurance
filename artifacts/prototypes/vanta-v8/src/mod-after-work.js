// After screens for the work group (a-work-): Home with the program overview, Getting started, My work, the Review queue,
// Schedule, Notifications, Reports & exports and AI drafts, each drawn from BA/dev/work.final.json with the after kit (window.PA.AK).
// Values are WS-X90's, copied from core.js, mod-risk.js, mod-platform.js and mod-compliance.js and checked against the local
// database on 17 Nov 2026 (review_queue_rows, evidence_artifact_rows, operational_issue_rows); anything it does not hold carries Example.
// after_flags are honoured: My work's icons mark two broad kinds, the queue has no "Requested by me" tab and keeps its search while
// rows are chosen, assessor and internal comments are two threads, a task preview has activity but no thread, the reminder goes to
// an owner for all their open tasks, and the bell and the mention and approval alerts stay off the screens the images don't show.
// Pieces built here beyond the kit: a switch, a radio, filter dropdowns, the bell's inbox, the report line chart and a toast host.
(function () {
  const { S, P, M, ROUTE_NAV, data, h } = window.PA;
  const AK = window.PA.AK;
  const { esc, fmt, pct, gl, pill, tag, bar } = h;
  const TODAY = data.TODAY;
  const EX = '<span class="ex">Example</span>';
  const ME = "Ingrid Solberg";
  const D = (iso) => new Date(iso + "T12:00:00");
  const ago = (iso) => Math.round((TODAY - D(iso)) / 86400000);
  const md = AK.md;
  const dfull = (iso) => D(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const co = (n) => AK.co(n).replace('class="ak-co"', 'class="ak-co a-work-co"');
  const go = (r) => `data-go="${esc(r)}" role="link" tabindex="0"`;
  const btn = (label, attrs = "", ink = false) => `<span class="btn sm${ink ? " ink" : ""}" role="button" tabindex="0" ${attrs}>${label}</span>`;
  const mu = (t) => `<span class="a-work-mu">${t}</span>`;
  const tr = (s, w) => `<span class="a-work-tr" style="max-width:${w}px" title="${esc(s)}">${esc(s)}</span>`;
  const svg = (d, cls = "", extra = "") => `<svg class="ak-i ${cls}" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"${extra}/></svg>`;
  const I = {
    right: "M6 3.5 10.5 8 6 12.5",
    down: "M3.5 6 8 10.5 12.5 6",
    list: "M7 4.5h6.5M7 8h6.5M7 11.5h6.5M2.5 4.6l1 1 1.6-1.8M2.5 8.1l1 1 1.6-1.8M2.5 11.6l1 1 1.6-1.8",
    clip: "M5.5 3H4v11h8V3h-1.5M6 2h4v2H6zM6.2 7.5h3.6M6.2 10h2.6",
    search: "M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3.5-3.5",
    thumb: "M5.5 7v6.5H3V7zM5.5 7l2.2-4.5c.9 0 1.6.7 1.6 1.6V6h3.2c.8 0 1.4.7 1.2 1.5l-1 4.5c-.1.6-.7 1-1.3 1H5.5",
    checks: "M1.5 8.5 4 11l5-5.5M7.5 10.5l.5.5 5-5.5",
  };
  const thumbUp = svg(I.thumb);
  const thumbDown = svg(I.thumb, "", ' transform="rotate(180 8 8)"');
  const dl = (rows) => `<dl class="ak-kv a-work-kv">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
  const foot = (primary) => `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-close-modal>${esc(primary)}</button>`;
  const field = (label, control, flag = "", hint = "") => `<div class="ak-field"><label>${esc(label)}${flag}</label>${control}${hint ? `<span class="s">${hint}</span>` : ""}</div>`;
  const REQ = ' <span class="req">Required</span>';
  const OPT = ' <span class="opt">Optional</span>';

  // ——— Selection, switches, menus and toasts: small state kept for the session ———
  const SEL = {};
  const sel = (key, init) => SEL[key] || (SEL[key] = new Set(init || []));
  let quiet = false;
  function redraw(focus) {
    const r = (location.hash || "").slice(1);
    if (!S[r]) return;
    const main = document.getElementById("main"), top = main.scrollTop;
    quiet = true;
    try { main.innerHTML = S[r](); } finally { quiet = false; }
    main.scrollTop = top;
    const el = focus && main.querySelector(focus);
    if (el) el.focus();
  }
  function toast(text) {
    document.querySelectorAll(".a-work-toastw").forEach((n) => n.remove());
    const w = document.createElement("div");
    w.className = "a-work-toastw";
    w.innerHTML = AK.toast(text);
    (document.getElementById("proto") || document.body).appendChild(w);
    setTimeout(() => w.remove(), 2800);
  }
  const closeMenus = (except) => document.querySelectorAll("details.a-work-dd[open], details.a-work-mn[open]").forEach((x) => { if (!except || !x.contains(except)) x.open = false; });
  function closeInbox() {
    const ib = document.querySelector(".a-work-inbox:not([hidden])");
    if (!ib) return;
    ib.hidden = true;
    const b = document.querySelector(".a-work-bell");
    if (b) b.setAttribute("aria-expanded", "false");
  }
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t || !t.closest) return;
    const c = t.closest("[data-aw-sel]");
    if (c) {
      e.stopPropagation(); e.preventDefault();
      const key = c.dataset.awSel, id = c.dataset.awId, s = sel(key);
      if (id === "*") { const ids = c.dataset.awAll.split(","); const all = ids.every((i) => s.has(i)); ids.forEach((i) => (all ? s.delete(i) : s.add(i))); }
      else if (s.has(id)) s.delete(id); else s.add(id);
      redraw(`[data-aw-sel="${key}"][data-aw-id="${CSS.escape(id)}"]`);
      return;
    }
    const d = t.closest("[data-aw-desel]");
    if (d) { e.stopPropagation(); e.preventDefault(); SEL[d.dataset.awDesel] = new Set(); redraw(`[data-aw-sel="${d.dataset.awDesel}"][data-aw-id="*"]`); return; }
    const w = t.closest("[data-aw-sw]");
    if (w) { e.stopPropagation(); e.preventDefault(); const on = w.getAttribute("aria-checked") !== "true"; w.setAttribute("aria-checked", String(on)); w.classList.toggle("on", on); return; }
    const kd = t.closest("[data-aw-kind]");
    if (kd) { e.stopPropagation(); e.preventDefault(); RQ_ON = kd.dataset.awKind || null; closeMenus(); SEL["rq-all"] = new Set(); redraw(".v2-rq") ; return; }
    const o = t.closest("[data-aw-opt]");
    if (o) { e.stopPropagation(); e.preventDefault(); const b = o.querySelector(".ak-cb"); if (b) { b.classList.toggle("on"); o.setAttribute("aria-checked", String(b.classList.contains("on"))); } return; }
    const rd = t.closest("[data-aw-radio]");
    if (rd) {
      e.stopPropagation(); e.preventDefault();
      const g = rd.closest("[role=radiogroup]");
      if (g) g.querySelectorAll("[data-aw-radio]").forEach((x) => { const on = x === rd; x.classList.toggle("on", on); x.setAttribute("aria-checked", String(on)); });
      return;
    }
    const ts = t.closest("[data-aw-toast]");
    if (ts) { e.stopPropagation(); e.preventDefault(); closeMenus(); toast(ts.dataset.awToast); return; }
    const bl = t.closest(".a-work-bell");
    if (bl) {
      e.stopPropagation(); e.preventDefault();
      const ib = bl.parentElement.querySelector(".a-work-inbox");
      const open = ib.hidden;
      ib.hidden = !open;
      bl.setAttribute("aria-expanded", String(open));
      return;
    }
    if (t.closest("[data-aw-inbox-close]")) { e.stopPropagation(); closeInbox(); const b = document.querySelector(".a-work-bell"); if (b) b.focus(); return; }
    if (t.closest("[data-aw-inbox-read]")) { e.stopPropagation(); document.querySelectorAll(".a-work-ibr.unread").forEach((r) => r.classList.remove("unread")); const dot = document.querySelector(".a-work-bell .a-work-dot"); if (dot) dot.remove(); return; }
    closeMenus(t);
    if (!t.closest(".a-work-bellw")) closeInbox();
  }, true);
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (e.key === "Escape") { closeInbox(); closeMenus(); return; }
    if ((e.key === "Enter" || e.key === " ") && t && t.matches) {
      if (t.matches("[data-aw-sel], [data-aw-desel], [data-aw-sw], [data-aw-toast], [data-aw-opt], [data-aw-radio], [data-aw-kind]")) { e.preventDefault(); e.stopPropagation(); t.click(); }
      else if (t.matches("#panel .a-work-pan [data-panel]:not(button), #panel .a-work-pan [data-go]:not(button), #panel .a-work-pan [data-modal]:not(button)")) { e.preventDefault(); t.click(); }
    }
  }, true);

  // ——— The shell: the Getting started nav item, Create program in the switcher (Home), the bell (Notifications) ———
  const SHELL = "data-a-work-shell";
  window.addEventListener("hashchange", () => { closeInbox(); document.querySelectorAll(`[${SHELL}]`).forEach((n) => n.remove()); });
  function navItem(on, c = "") {
    const nav = document.getElementById("nav");
    if (!nav || nav.querySelector(".a-work-gs") || nav.querySelector('a.item[href="#getting-started"]')) return;
    const html = `<a class="item a-work-gs${on ? " on" : ""}" href="#after-getting-started"${on ? ' aria-current="page"' : ""} ${SHELL}><span class="ak-donut a-work-ring" style="--p:20" aria-hidden="true"></span>Getting started${c}<span class="c a-work-pct num">20%</span></a>`;
    const rq = nav.querySelector('a.item[href="#review-queue"]');
    if (rq) rq.insertAdjacentHTML("afterend", html); else nav.insertAdjacentHTML("afterbegin", html);
  }
  const navNow = () => { const r = (location.hash || "").slice(1); if (r === "after-home") navItem(false, co(2)); else if (/^after-getting-started/.test(r)) navItem(true); };
  const navEl = document.getElementById("nav");
  if (navEl) new MutationObserver(navNow).observe(navEl, { childList: true });
  function switcherCreate() {
    const m = document.getElementById("swMenu");
    if (!m || m.querySelector(".a-work-swc") || m.querySelector('a[href="#program-new"]')) return;
    m.insertAdjacentHTML("beforeend", `<a role="menuitem" href="#after-home" class="a-work-swc" ${SHELL}>Create program <small>New</small></a>`);
  }
  const INBOX = [
    { who: "Nadia Fournier", on: "Approved vendor verification key set and release metadata binding, LRU-003 and LRU-020", text: "@Ingrid Solberg the binding covers LRU-003; is LRU-020's metadata in a second file?", age: "1d", unread: true },
    { who: "Priya Raghavan", on: "CVE-2024-6387 in the Mission Computer's OpenSSH server", text: "Taking Mission Computer version 2 closes it for every consumer.", age: "3d" },
  ];
  function bell(c = "") {
    const top = document.querySelector("#proto .top");
    if (!top || top.querySelector(".a-work-bellw")) return;
    const av = top.querySelector(".avatar");
    const rows = INBOX.map((r) => `<div class="a-work-ibr${r.unread ? " unread" : ""}">${AK.avatar(r.who, 28)}<div class="x"><span><b>${esc(r.who)}</b> commented on <b>${esc(r.on)}</b></span><q>${esc(r.text)}</q></div><span class="t">${esc(r.age)}</span></div>`).join("");
    const html = `<span class="a-work-bellw"><button type="button" class="a-work-bell" aria-haspopup="dialog" aria-expanded="false" aria-label="Inbox, 1 unread">${AK.i("bell")}<span class="a-work-dot" aria-hidden="true"></span></button>${c}
      <div class="a-work-inbox" role="dialog" aria-label="Comments" hidden><div class="a-work-ibh"><b>Comments <span class="num">2</span></b>${AK.i("down")}<span class="sp"></span><button type="button" class="a-work-ibb" data-aw-inbox-read aria-label="Mark all as read" title="Mark all as read">${svg(I.checks)}</button><button type="button" class="a-work-ibb" data-aw-inbox-close aria-label="Close the inbox" title="Close">${AK.i("x")}</button></div>${rows}<p class="note-p a-work-ibn">${EX} Both comments are invented.</p></div></span>`;
    if (av) av.insertAdjacentHTML("beforebegin", html); else top.insertAdjacentHTML("beforeend", html);
  }

  bell(); // version 7: the inbox bell sits left of the avatar on every screen

  // ——— Shared pieces: checkboxes, tables, toolbars, dropdowns, the selection bar ———
  const cb = (key, id, on, label) => `<span class="a-work-cb" role="checkbox" tabindex="0" aria-checked="${on}" aria-label="${esc(label)}" data-aw-sel="${esc(key)}" data-aw-id="${esc(id)}">${AK.check(on)}</span>`;
  const cbAll = (key, ids, label) => { const s = sel(key); const all = ids.length > 0 && ids.every((i) => s.has(i)); return `<span class="a-work-cb" role="checkbox" tabindex="0" aria-checked="${all ? "true" : s.size ? "mixed" : "false"}" aria-label="${esc(label)}" data-aw-sel="${esc(key)}" data-aw-id="*" data-aw-all="${esc(ids.join(","))}">${AK.check(all)}</span>`; };
  function tbl({ cols, rows, total, panel = "", nm = 0, cls = "", pager = true }) {
    const body = rows.map((r) => {
      const p = r.panel !== undefined ? r.panel : panel;
      const attrs = r.go ? ` tabindex="0" data-go="${esc(r.go)}"` : p ? ` tabindex="0" data-panel="${esc(p)}" data-id="${esc(r.id || "")}"` : ' class="a-work-still"';
      return `<tr${r.sel ? ' class="sel"' : ""}${attrs}>${r.cells.map((c, i) => `<td${i === nm ? ' class="nm"' : ""}>${c}</td>`).join("")}</tr>`;
    }).join("");
    return `<div class="frame ${cls}"><div class="tablebox"><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>${pager ? `<div class="pager"><span class="num">1–${rows.length} of ${fmt(total)}</span><span>25 per page · ‹ ›</span></div>` : ""}</div>`;
  }
  // A filter whose values drop down; it renders as HTML wherever it is placed, and filters() passes it through unescaped.
  const dd = (label, items, opt = {}) => { const html = ddHtml(label, items, opt); return { html, toString: () => html }; };
  const ddHtml = (label, items, opt = {}) => `<details class="a-work-dd"><summary class="flt">${esc(label)} ⌄</summary><div class="a-work-pop" role="group" aria-label="${esc(label)}">${opt.search ? `<div class="ak-pop-s">${svg(I.search)}<span>${esc(opt.search)}</span></div>` : ""}${items.map(([l, n]) => `<span class="a-work-opt" role="checkbox" tabindex="0" aria-checked="false" data-aw-opt>${AK.check(false)}<span>${esc(l)}</span>${n != null ? `<span class="num">${fmt(n)}</span>` : ""}</span>`).join("")}</div></details>`;
  const ends = `<span class="end"><span class="ib" title="Columns">▥</span><span class="ib" title="Settings">⚙</span></span>`;
  const filters = (search, list) => `<div class="tools"><span class="in">${esc(search)}</span>${list.map((f) => (typeof f === "string" ? `<span class="flt">${esc(f)} ⌄</span>` : String(f))).join("")}<span class="flt sub">+ Add filter</span>${ends}</div>`;
  function bulk(key, n, actions, { co: c = "", attrs = {} } = {}) {
    let html = AK.bulk({ count: n, actions });
    html = html.replace('<span class="ak-link">Deselect</span>', `<span class="ak-link" role="button" tabindex="0" data-aw-desel="${esc(key)}">Deselect</span>${c}`);
    for (const [label, a] of Object.entries(attrs)) html = html.replace(`<span class="btn sm">${esc(label)}</span>`, `<span class="btn sm" role="button" tabindex="0" ${a}>${esc(label)}</span>`);
    return html;
  }
  // The search stays while rows are chosen; the bar takes the filters' place.
  const toolbar = (key, search, list, actions, opt = {}) => { const n = sel(key).size; return n ? `<div class="tools a-work-selbar"><span class="in">${esc(search)}</span>${bulk(key, n, actions, opt)}</div>` : filters(search, list); };
  const banner = (opt, attrs) => { const html = AK.banner(opt); return opt.action && attrs ? html.replace(`<span class="btn sm">${esc(opt.action)}</span>`, `<span class="btn sm" role="button" tabindex="0" ${attrs}>${esc(opt.action)}</span>`) : html; };
  const chevR = svg(I.right, "a-work-chev");
  const stamp = (c = "") => `<span class="a-work-stamp">Updated now${c}</span>`;
  const dots = `<span class="a-work-dots" aria-hidden="true">${AK.i("dots")}</span>`;
  const sr = (t) => `<span class="a-work-sr">${esc(t)}</span>`;
  const card = (body) => AK.card(body, { cls: "a-work-card" });

  // ═════════════ 1. Home, and the program overview its WS-X90 card opens ═════════════
  // v2 (home budget): one card a program: its name, a %, one green bar and N of M. No note line, no pills.
  const progCard = (p) => {
    const v = pct(p.sat, p.total);
    const inner = `<div class="nm2"><span>${esc(p.name)}</span><span class="a-work-pcr"><span class="code">${esc(p.code)}</span>${chevR}</span></div><div class="big num">${v}%</div>${bar(v)}<div class="foot"><span class="num">${fmt(p.sat)} of ${fmt(p.total)} controls satisfied</span></div>`;
    // v2 C2 (B2, B6): WS-X90's card opens its overview and makes it the current program; another program's card opens Programs with
    // that program's preview; a program created in this session opens its own page.
    if (p.made) return `<a class="pcard" href="#program-start" data-v2prog="${esc(p.code)}">${inner}</a>`;
    return p.code === "PRG-1090" ? `<a class="pcard" href="#after-home-overview" data-v2prog="PRG-1090">${inner}</a>` : `<a class="pcard" href="#portfolio" data-v2go="portfolio" data-v2q="${esc(JSON.stringify({ open: { kind: "v7o-prog", id: p.code } }))}">${inner}</a>`;
  };
  const OTHER_CODE = { "Atlas payments platform": "PRG-1041", "Corporate identity provider": "PRG-1013", "Field operations mobile": "PRG-1007", "Legacy billing gateway": "PRG-0994", "Northwind data warehouse": "PRG-1028" };
  const madeCards = () => ((window.PA.v2hubs && window.PA.v2hubs.made()) || []).map((d) => ({ code: d.code, name: d.name, sat: 0, total: d.total || 0, made: true }));
  const offerQ = esc(JSON.stringify({ open: { kind: "v7o-offer", id: "cve" } }));
  // v2 (B16, home budget): Create program is Home's primary, beside View my work; the two tinted banners are one grey callout.
  S["after-home"] = () => {
    navItem(false, co(2));
    switcherCreate();
    return h.page(
      h.header("Home", "", `<span class="btn" ${go("after-my-work")}>View my work</span>${co(4)}<span class="btn ink" ${go("program-new")}>Create program</span>`),
      `<div class="a-work-banners v2-home-call">${banner({ tone: "warn", text: "<b>Mission Computer version 2</b> is published: 4 consumers are behind, and its CVE-2024-6387 offer waits on Priya Raghavan.", action: "Open offer", co: co(1) }, `data-v2go="component-mc-findings" data-v2q="${offerQ}"`)}</div>`,
      `<div class="a-work-secth"><h4 class="subhead">Controls satisfied, by program</h4>${stamp(co(3))}</div>`,
      `<div class="grid3">${madeCards().concat(data.PROGRAMS).map(progCard).join("")}</div>`,
      `<div class="card v2-home-other"><div class="t">Other programs <span class="num">${data.OTHER.length}</span></div><div class="rows">${data.OTHER.map((n) => `<a class="row" href="#portfolio"${OTHER_CODE[n] ? ` data-v2go="portfolio" data-v2q="${esc(JSON.stringify({ open: { kind: "v7o-prog", id: OTHER_CODE[n] } }))}"` : ""}><span>${esc(n)}</span><span class="muted num">0 of ${n === "Legacy billing gateway" ? 149 : 287} controls satisfied</span></a>`).join("")}</div></div>`,
    );
  };
  ROUTE_NAV["after-home"] = "before-after";

  const standCard = (title, v, left, right, route, extra = "") => `<a class="pcard a-work-stand" href="#${route}"><div class="nm2"><span>${esc(title)}</span>${chevR}</div><div class="big num">${v}%</div>${bar(v)}<div class="foot"><span class="num">${left}</span><span class="num">${right}</span></div>${extra}</a>`;
  S["after-home-overview"] = () => h.page(
    h.header("WS-X90 Sentinel Mission System", "<span>PRG-1090</span><span>Impact <b>High</b></span><span>Lead assessor <b>D. Okafor</b></span><span>Authorizing official <b>R. Calloway</b></span>", `<span class="btn" role="button" tabindex="0" aria-label="More program actions">⋯</span><span class="btn ink" ${go("authorization")}>Open package</span>`),
    `<div class="a-work-banners">${banner({ tone: "bad", text: "<b>17 operational issues</b> are past their remediation date: 1 critical, 9 high, 7 moderate.", action: "View issues", co: co(1) }, go("findings"))}${banner({ tone: "bad", text: "<b>2 critical risks</b> have no owner: a password alone reaches WS-X90; unverifiable arm and release records.", action: "Assign owners" }, go("risks"))}</div>`,
    `<div class="a-work-secth"><h4 class="subhead">Where WS-X90 stands</h4>${stamp(co(3))}</div>`,
    `<div class="a-work-pc3">${standCard("Controls satisfied", 31, "176 controls satisfied", "560 total", "controls", `<div class="note-p num">546 mapped · 312 with evidence · 223 assessed</div>`)}${standCard("Evidence accepted", 61, "226 artifacts accepted", "368 total", "evidence")}${standCard("POA&M completed", 17, "7 items completed", "41 total", "poam")}</div>`,
    `<div class="card"><div class="t">Assessments <span><a href="#assessments">View all</a></span></div>${data.CAMPAIGNS.map(([t, s, , a, b]) => h.lane(t, s, a, b)).join("")}</div>`,
    `<p class="note-p">Evidence to revise (54) and risks with no owner (40), the last rows of the Needs attention card, are rows of My work now.</p>`,
  );
  ROUTE_NAV["after-home-overview"] = "before-after";

  // ═════════════ 2. Getting started: a checklist of WS-X90's real gaps ═════════════
  const GS = [
    { label: "Workspace setup", route: "after-getting-started", line: "Load the catalog and record the roles, then adopt the deadlines and notifications proposed for the workspace.", groups: [
      { icon: "frameworks", title: "Catalog and roles", line: "The controls every baseline reads, and who acts for WS-X90.", items: [["Load NIST SP 800-53 Rev 5.1.1 · 1,014 active controls", 1, "frameworks"], ["Record WS-X90's roles · AO R. Calloway, lead assessor D. Okafor", 1, "people"]] },
      { icon: "deadlines", title: "Deadlines", line: "How long each kind of finding has before it is late.", items: [["Adopt the 12 proposed deadlines set by Joel Barrantes, ISSM", 0, "deadlines", "Go to deadlines"]] },
      { icon: "notifications", title: "Notifications", line: "Who hears of what, by email and in the app.", items: [["Turn on the 13 proposed notifications", 0, "notifications", "Go to notifications"]] },
    ] },
    { label: "Owners", route: "after-getting-started-owners", line: "Give WS-X90's records someone who answers for them.", groups: [
      { icon: "people", title: "Record owners", line: "Requirements and open risks with nobody named.", items: [["Give an owner to 640 requirements", 0, "requirements", "Go to requirements"], ["Give an owner to 40 open risks", 0, "risks", "Go to risks"]] },
      { icon: "evidence", title: "Evidence renewal", line: "When each artifact must be collected again.", items: [["Set renewal dates on 368 evidence artifacts", 0, "evidence", "Go to evidence"]] },
    ] },
    { label: "WS-X90's gaps", route: "after-getting-started-gaps", line: "Close what stands between WS-X90 and its next package.", groups: [
      { icon: "requirements", title: "Requirements", line: "Controls of the baseline that no requirement maps.", items: [["Map the 14 controls with no requirement", 0, "controls", "Go to controls"]] },
      { icon: "policies", title: "System security plan", line: "SSP 3, in draft for the Block 1.1 configuration.", items: [["Replace the 74 placeholder narratives in SSP 3", 0, "ssp", "Open the SSP"], ["Submit SSP 3 for review", 0, "ssp-review", "Review and submit"]] },
    ] },
  ];
  // v2 C2 (B7): the share done is counted from the checklist's items, here and on the menu's Getting started (it read 25% there).
  const gsCount = () => { const items = GS.flatMap((s) => s.groups.flatMap((g) => g.items)); return { done: items.filter((x) => x[1]).length, total: items.length }; };
  window.PA.gs = { pct: () => { const c = gsCount(); return pct(c.done, c.total); } };
  function gsPage(si, withCo) {
    navItem(true);
    const c = (n) => (withCo ? co(n) : "");
    const step = GS[si];
    let k = 0;
    const steps = AK.steps(GS.map((s) => s.label), si)
      .replace(/<li class="([^"]*)"><span class="ak-step-n">([^<]*)<\/span>/g, (m, cls) => { const i = k++; return `<li class="${i === si ? "now" : ""}"${i === si ? ' aria-current="step"' : ""} ${go(GS[i].route)}><span class="ak-step-n">${i + 1}</span>`; });
    const nextGroup = step.groups.findIndex((g) => g.items.some((x) => !x[1]));
    let nextShown = false;
    const group = (g, gi) => {
      const done = g.items.filter((x) => x[1]).length, n = g.items.length, all = done === n;
      const open = all || gi === nextGroup;
      const ring = all ? `<span class="ak-ring done"></span>` : `<span class="ak-donut" style="--p:${pct(done, n)}"></span>`;
      const items = g.items.map(([t, ok, route, action]) => {
        if (ok) return `<div class="a-work-ti done"><span class="ak-ring sm done"></span><s>${esc(t)}</s></div>`;
        if (!nextShown) { nextShown = true; return `<div class="a-work-ti next"><span class="ak-ring sm"></span><span class="x" ${go(route)}>${esc(t)}</span><span class="btn sm ink" ${go(route)}>${esc(action)}</span>${c(2)}</div>`; }
        return `<div class="a-work-ti"><span class="ak-ring sm"></span><span class="x">${esc(t)}</span><span class="ak-link" ${go(route)}>Open</span></div>`;
      }).join("");
      return `<details class="a-work-tg"${open ? " open" : ""}><summary class="a-work-tgh"><span class="a-work-tile">${h.icon(g.icon)}</span><span class="a-work-tgt"><b${all ? ' class="done"' : ""}>${esc(g.title)}</b><span>${esc(g.line)}</span></span><span class="a-work-tgn num">${done} of ${n} complete${ring}</span>${svg(I.down, "a-work-tgc")}</summary><div class="a-work-tgb">${items}</div></details>`;
    };
    const next = GS[si + 1];
    return h.page(
      AK.indexHead({ title: "Getting started", desc: `Set up the workspace, give records owners, then close WS-X90's gaps. ${EX}`, co: c(1) }),
      `<div class="a-work-gsp">${AK.progress(gsCount().done, gsCount().total, "done")}<span class="num">· ${window.PA.gs.pct()}%</span>${c(3)}</div>`,
      `<div class="a-work-stepper">${steps}</div>`,
      `<section class="a-work-gsc" aria-label="${esc(step.label)}"><div class="a-work-gsch"><h3>${esc(step.label)}</h3><p>${esc(step.line)}</p></div>${step.groups.map(group).join("")}${next ? `<div class="a-work-gsf"><span class="btn" ${go(next.route)}>Continue to ${esc(next.label)} →</span></div>` : ""}</section>`,
      AK.note("The checklist is an example: its three steps, their order and their wording are invented. Every number in it is already on WS-X90's screens."),
    );
  }
  S["after-getting-started"] = () => gsPage(0, true);
  S["after-getting-started-owners"] = () => gsPage(1, false);
  S["after-getting-started-gaps"] = () => gsPage(2, false);
  ["after-getting-started", "after-getting-started-owners", "after-getting-started-gaps"].forEach((r) => { ROUTE_NAV[r] = "before-after"; });

  // ═════════════ 3. My work ═════════════
  // Two broad kinds, as Vanta draws them: a checklist for work to do, a clipboard for documents (the SSP, evidence).
  const KIND = { act: [svg(I.list), "Work item"], doc: [svg(I.clip), "Document"] };
  const av = (n) => `<span class="a-work-av" title="${esc(n || "No owner")}">${AK.avatar(n, 24)}${n ? "" : sr("No owner")}</span>`;
  // v2 C2 (B2, B7): each row opens its register asked for exactly the records it counts (a quick view, the rows, the record's
  // preview), and each count is read from the screen the row opens (PA.v2hubs.count), so the row and the list cannot disagree.
  // B5: SSP 3's row follows the review state the submit page writes (ssp.rev3).
  const live = (route, label, d) => { const H = window.PA.v2hubs, n = H && H.count(route, label); return n == null ? d : n; };
  const v2get = (path, d) => (window.PA.v2 ? window.PA.v2.get(path, d) : d);
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const CRIT = ["A password on its own reaches WS-X90 at the flightline", "Payload arm and release records become unverifiable as signing keys rotate"];
  function mwData() {
    const late = live("findings", "Past due", 17), soon = live("findings", "Due soon", 3), noOwner = live("risks", "No owner", 40);
    const revise = live("evidence", "Needs revision", 54), pending = live("evidence", "Pending review", 88), ready = live("campaign", "Ready", 88);
    const H = window.PA.v2hubs, crit = H ? H.rows("risks", (tr) => /\bCritical\b/.test(tr.textContent)) : { n: 2, names: CRIT };
    const critNames = crit.n ? crit.names : CRIT;
    const ssp = v2get("ssp.rev3.state", "draft");
    const sspRow = ssp === "submitted" || ssp === "approved"
      ? { k: "doc", t: `SSP 3 waits on ${ssp === "approved" ? "R. Calloway, the AO" : "Joel Barrantes, the ISSM"}`, m: ssp === "approved" ? "Approved by the ISSM" : "In review", o: [ssp === "approved" ? "R. Calloway" : "Joel Barrantes"], r: "ssp-review" }
      : { k: "doc", t: ssp === "changes" ? "Revise SSP 3: the ISSM sent it back" : "Submit SSP 3 for review", m: ssp === "changes" ? "Changes requested" : "Draft", o: ["Priya Raghavan"], r: "ssp-review", ex: true };
    const waiting = [
      { k: "doc", t: `${plural(pending, "evidence version")} wait on a reviewer`, m: "Pending review", o: ["Nadia Fournier"], r: "evidence", q: { filter: { qv: "Pending review" } } },
      { k: "act", t: "An offered finding, CVE-2024-6387, waits on Priya Raghavan", m: "offered Nov 14", o: ["Priya Raghavan"], r: "component-mc-findings", q: { open: { kind: "v7o-offer", id: "cve" } } },
    ];
    const soonRows = [
      { k: "act", t: "Close out the Expanded Control Set Assessment", m: `${plural(ready, "request")} ready for the assessor • ends Nov 20`, o: ["D. Okafor"], r: "campaign", q: { filter: { qv: "Ready" } } },
      { k: "act", t: `Remediate ${plural(soon, "operational issue")}`, m: "1 critical • 2 high • due within two weeks", o: [null], r: "findings", q: { filter: { qv: "Due soon" } } },
      { k: "act", t: "Run the quarterly configuration baseline audit (CM-2, CM-3)", m: "WSX-397 • Planned • due Dec 28", o: [ME], r: "schedule", me: true, q: { open: { kind: "a-work-task", id: "t10" } } },
    ];
    if (sspRow.r && !(ssp === "submitted" || ssp === "approved")) soonRows.splice(2, 0, sspRow); else waiting.unshift(sspRow);
    return [
      { title: "Urgent", glyph: "diamond", rows: [
        { k: "act", t: "Remediate CVE-2024-6387 on the Mission Computer", m: `WSX-409 • High • due Nov 9 • ${ago("2026-11-09")} days late`, o: [ME], r: "findings-vulns", me: true, q: { rows: ["CVE-2024-6387"], open: { kind: "a-risk-issue", id: "c0fdce4e" }, note: "Showing the CVE this row names" } },
        { k: "act", t: `Resolve ${plural(late, "operational issue")} past their remediation date`, m: "1 critical • 9 high • 7 moderate", o: [null], r: "findings", q: { filter: { qv: "Past due" } } },
        { k: "act", t: `Treat ${plural(critNames.length, "critical risk")}`, m: "a password alone reaches WS-X90 • unverifiable arm and release records", o: [null], r: "risks", q: { filter: { sev: "critical" } } }, // v2 F [B2]: Risks applies Severity: Critical, so its rows are the ones counted
      ] },
      { title: "Coming soon", glyph: "clock", rows: soonRows },
      { title: "Unscheduled", glyph: "ring", rows: [
        { k: "act", t: `Give an owner to ${plural(noOwner, "open risk")}`, m: "", o: [null], r: "risks", q: { filter: { qv: "No owner" } } },
        { k: "doc", t: `Revise ${plural(revise, "evidence version")}`, m: "sent back by reviewers", o: [null, "Wes Duarte"], r: "evidence", q: { filter: { qv: "Needs revision" } } },
      ] },
      { title: "Waiting on others", glyph: "wait", rows: waiting },
    ];
  }
  window.PA.mywork = { data: mwData }; // the rail's My work count reads these rows
  // v2 (A12, A13, N16; inbox budget): one hairline list a group, each row an icon, the title, grey meta (a ticket key as plain grey
  // text, one state word) and the avatars. The callout column that squeezed the second Urgent row is gone (callouts are hidden).
  const mwGo = (x) => (x.q ? ` data-v2go="${esc(x.r)}" data-v2q="${esc(JSON.stringify(x.q))}"` : "");
  const mwRow = (x, cs = {}) => `<a class="a-work-mw" href="#${x.r}"${mwGo(x)}><span class="a-work-sq" title="${KIND[x.k][1]}">${KIND[x.k][0]}</span>${cs[1] || ""}<span class="a-work-mwt"><span class="a-work-mwtt">${esc(x.t)}</span>${cs[5] || ""}${x.m ? `<span class="m">${x.m}</span>` : ""}${x.ex ? EX : ""}${cs[4] || ""}</span><span class="a-work-mwo"><span class="ak-avs">${x.o.map(av).join("")}</span>${cs[2] || ""}</span></a>`;
  const mwGroup = (g, rows, cs = {}) => `<details class="a-work-mwg" open><summary>${svg(I.down, "a-work-chv")}${g.glyph === "wait" ? '<span class="gl info a-work-glg"></span>' : gl(g.glyph)}<b>${esc(g.title)}</b><span class="ct num">${rows.length}</span>${cs.g || ""}</summary><div class="a-work-mwl">${rows.map((x, i) => mwRow(x, (cs.rows || [])[i])).join("")}</div></details>`;
  const TYPES = ["Operational issue", "Risk", "Assessment", "SSP", "Evidence", "Gate", "Task", "POA&M milestone", "Component offer"];
  const mwViews = (cur, c3 = "") => `<div class="views a-work-mwv">${[["all", "All", "after-my-work"], ["mine", "Assigned to me", "after-my-work-mine"], ["teams", "My teams", null], ["approval", "Needs my approval", "after-my-work-approval"]].map(([k, l, r]) => `<span class="qv${k === cur ? " on" : ""}"${k === cur ? ' aria-current="true"' : r ? ` ${go(r)}` : ""}>${esc(l)}</span>`).join("")}<span class="a-work-type">${dd("Type", TYPES.map((t) => [t, null]), { search: "Search types" })}${c3}</span></div>`;
  S["after-my-work"] = () => h.page(
    h.header("My work", "", ""),
    mwViews("all", co(3)),
    `<div class="mw">${mwData().map((g, gi) => mwGroup(g, g.rows, gi === 0 ? { g: co(6), rows: [{ 5: co(5), 4: co(4) }, { 1: co(1), 2: co(2) }] } : {})).join("")}</div>`,
  );
  S["after-my-work-mine"] = () => h.page(
    h.header("My work", "", ""),
    mwViews("mine"),
    `<div class="mw">${mwData().map((g) => [g, g.rows.filter((x) => x.me)]).filter(([, r]) => r.length).map(([g, r]) => mwGroup(g, r)).join("")}</div>`,
  );
  S["after-my-work-approval"] = () => h.page(h.header("My work", "", ""), mwViews("approval"), AK.empty({ title: "Nothing waits on your approval", line: "Approvals assigned to you, Ingrid Solberg, show here." }));
  ["after-my-work", "after-my-work-mine", "after-my-work-approval"].forEach((r) => { ROUTE_NAV[r] = "before-after"; });

  // ═════════════ 4. Review queue (review_queue_rows, as mod-risk.js reads it) ═════════════
  const RQK = [
    ["evidence", "Evidence to accept", 96, "check"], ["discussion", "Discussions to resolve", 40, "info"], ["gate", "Gates to decide", 8, "clock"],
    ["assessment_results", "Assessment results to publish", 1, "clock"], ["product_assessment", "Product assessment to publish", 1, "clock"], ["package", "Package to decide", 1, "clock"], ["component_offer", "Component offer to review", 1, "info"],
  ];
  const RQ = {
    evidence: [
      ["e1", "Account-issue gate configuration export, LRU-017 to LRU-013 provisioning rule set", "WS-X90", "Nadia Fournier", "2026-11-13", "Wes Duarte"],
      ["e2", "Approved portable-storage registry export, LRU-020 revision 11, with mount policy hash", "WS-X90", "Nadia Fournier", "2026-11-13", "Joel Barrantes"],
      ["e3", "Approved vendor verification key set and release metadata binding, LRU-003 and LRU-020", "WS-X90", "Nadia Fournier", "2026-11-13", "Ingrid Solberg"],
      ["e4", "Flight program function list, customer build", "Customer A · X800 Rail Integration", "Elena Vasquez", "2026-11-13", "Nadia Fournier"],
      ["e5", "Pallet sequencing firmware build record, customer aircraft", "Customer B · X800 Palletized Integration", "Ray Colston", "2026-11-13", "Hana Lindqvist"],
    ],
    discussion: [
      ["d1", "Paragraph as received", "Customer B · X800 Palletized Integration", null, "2026-11-13", "Local developer"],
      ["d2", "What closes the gap", "Customer A · X800 Rail Integration", null, "2026-11-13", "Local developer"],
      ["d3", "Answer needed", "Customer B · X800 Palletized Integration", null, "2026-11-13", "Local developer"],
      ["d4", "Plan to reach compliance", "Customer C · G25 Battery Control Fielding", null, "2026-11-13", "Local developer"],
    ],
    gate: [
      ["g1", "System Requirements Review", "Legacy billing gateway", null, "2026-09-12", null, "2025-04-22"],
      ["g2", "Critical Design Review", "Northwind data warehouse", null, "2026-09-12", null, "2025-12-12"],
      ["g3", "Production Readiness Review", "Atlas payments platform", null, "2026-09-12", null, "2026-09-04"],
      ["g4", "PDR", "WS-X90", null, "2026-09-12", null, "2026-10-10"],
      ["g5", "Variant security plan approval", "Customer B · X800 Palletized Integration", null, "2026-11-13", null, "2026-11-16"],
      ["g6", "Initial Operational Capability", "Field operations mobile", null, "2026-09-12", null, "2026-11-19"],
      ["g7", "Customer configuration review", "Customer C · G25 Battery Control Fielding", null, "2026-11-13", null, "2026-11-19"],
      ["g8", "Delta assessment results review", "Customer A · X800 Rail Integration", null, "2026-11-13", null, "2026-12-01"],
    ],
    assessment_results: [["r1", "Interim results — expanded control set, increment 2 · 20 findings", "WS-X90", null, "2026-11-13", null]],
    product_assessment: [["pa1", "G40 Ground Terminal version 1 against the High baseline · 9 determinations", "G40 Ground Terminal", "Elena Vasquez", "2026-11-13", null]],
    package: [["pk1", "Customer B security plan approval package · version 1", "Customer B · X800 Palletized Integration", null, "2026-11-03", "Joel Barrantes"]],
    component_offer: [["co1", "CVE-2024-6387 in the Mission Computer's OpenSSH server", "WS-X90", "Priya Raghavan", "2026-11-14", "Ingrid Solberg"]],
  };
  const RQ_ALL = Object.entries(RQ).flatMap(([k, rows]) => rows.map((r) => ({ kind: k, id: r[0], name: r[1], prog: r[2], on: r[3], since: r[4], by: r[5], due: r[6] })));
  const ROLE_OF = { "Nadia Fournier": "Assessor", "D. Okafor": "Lead assessor", "Elena Vasquez": "Assessor", "Ray Colston": "System owner", "Priya Raghavan": "Component owner", "Joel Barrantes": "ISSM", "R. Calloway": "Authorizing official" };
  const sinceCell = (iso) => `<span class="num">${md(iso)}</span> <span class="a-work-mu num">· ${ago(iso)}d</span>`;
  const nobody = (n) => AK.owner(n, { label: "Nobody named" });
  // v2 (A11): one table for every kind, with a Kind column and a Kind filter, the record that has waited longest first; nothing is
  // ticked when the page opens (the selection bar takes the filters' place only once a row is chosen).
  const RQ_KIND = { evidence: "Evidence to accept", discussion: "Discussion to resolve", gate: "Gate to decide", assessment_results: "Assessment results to publish", product_assessment: "Product assessment to publish", package: "Package to decide", component_offer: "Component offer to review" };
  const RQ_ORDER = RQK.map(([k]) => k).concat(["ssp"]);
  const RQ_ROWS = [...RQ_ALL].sort((a, b) => (a.since < b.since ? -1 : a.since > b.since ? 1 : RQ_ORDER.indexOf(a.kind) - RQ_ORDER.indexOf(b.kind)));
  // v2 C2 (B7, B5): one source for every count on the page: the kinds' counts, summed for the header, the All tab and the pager.
  // The evidence kind takes WS-X90's share from the Evidence register's Pending review, the same records, plus the 8 versions
  // pending in Customer A and Customer B (review_queue_rows, Nov 17). SSP revision 3 joins once it is submitted for review.
  // The Kind filter works: it keeps the rows of one kind, and the pager counts that kind.
  RQ_KIND.ssp = "SSP to approve";
  const RQ_OTHER_EVIDENCE = 8;
  let RQ_ON = null;
  const sspState = () => v2get("ssp.rev3.state", "draft");
  function rqKinds() {
    const ev = live("evidence", "Pending review", 88) + RQ_OTHER_EVIDENCE, s = sspState();
    return RQK.map((k) => (k[0] === "evidence" ? [k[0], k[1], ev, k[3]] : k)).concat(s === "submitted" || s === "approved" ? [["ssp", "SSP to approve", 1, "clock"]] : []);
  }
  function rqRows() {
    const s = sspState();
    const ssp = s === "submitted" || s === "approved" ? [{ kind: "ssp", id: "rev3", name: "WS-X90 system security plan · revision 3", prog: "WS-X90", on: s === "approved" ? "R. Calloway" : "Joel Barrantes", since: v2get("ssp.rev3.day", "2026-11-17"), by: ME }] : [];
    return RQ_ROWS.concat(ssp);
  }
  const rqTotal = () => rqKinds().reduce((a, k) => a + k[2], 0);
  const kindFilter = (kinds) => {
    const on = kinds.find((k) => k[0] === RQ_ON);
    const html = `<details class="a-work-dd"><summary class="flt${on ? " on" : ""}">${on ? `Kind: ${esc(on[1])}` : "Kind"} ⌄</summary><div class="a-work-pop" role="group" aria-label="Kind">${[["", "Every kind", kinds.reduce((a, k) => a + k[2], 0)]].concat(kinds).map(([k, l, n]) => `<span class="a-work-opt" role="menuitemradio" tabindex="0" aria-checked="${(RQ_ON || "") === k}" data-aw-kind="${esc(k)}">${AK.check((RQ_ON || "") === k)}<span>${esc(l)}</span><span class="num">${fmt(n)}</span></span>`).join("")}</div></details>`;
    return { html, toString: () => html };
  };
  function rqTable() {
    const key = "rq-all", s = sel(key), kinds = rqKinds(), all = rqRows();
    const list = RQ_ON ? all.filter((r) => r.kind === RQ_ON) : all;
    const total = RQ_ON ? (kinds.find((k) => k[0] === RQ_ON) || [0, 0, list.length])[2] : rqTotal();
    const chosen = list.filter((r) => s.has(`${r.kind}:${r.id}`));
    const named = [...new Set(chosen.filter((r) => r.on).map((r) => r.on))];
    const remind = named.length ? `${named.join(" and ")} reminded of ${s.size} waiting record${s.size === 1 ? "" : "s"}` : "Nobody is named on these; reassign a reviewer first";
    const tools = toolbar(key, "Search the queue", [kindFilter(kinds), dd("Program", [...new Set(all.map((r) => r.prog))].map((p) => [p, null])), "Waiting on", dd("Waiting longer than", [["30 days", 8], ["7 days", 1]])], ["Reassign reviewer", "Remind"],
      { attrs: { "Reassign reviewer": `data-modal="a-work-owner" data-id="Reassign reviewer|${s.size} record${s.size === 1 ? "" : "s"}"`, Remind: `data-aw-toast="${esc(remind)}"` } });
    return tools + tbl({
      cols: [cbAll(key, list.map((r) => `${r.kind}:${r.id}`), "Select every row"), "Record", "Kind", "Program", "Waiting on", "Waiting since", "Requested by"],
      rows: list.map((r) => { const id = `${r.kind}:${r.id}`; return { id, sel: s.has(id), cells: [cb(key, id, s.has(id), `Select ${r.name}`), tr(r.name, 330), esc(RQ_KIND[r.kind]), tr(r.prog, 170), r.on ? AK.owner(r.on) : mu("—"), sinceCell(r.since), r.by ? AK.owner(r.by) : mu("—")] }; }),
      total, panel: "a-work-rq", nm: 1, cls: "a-work-tight v2-rq",
    });
  }
  window.PA.reviewQueue = { total: rqTotal }; // the rail's Review count reads the queue's own total
  function rqPage(view, withCo) {
    const c = (n) => (withCo ? co(n) : ""), total = rqTotal();
    const head = h.header("Review queue", `<span>Across the workspace</span><span>Waiting <b>${fmt(total)}</b></span><span>Programs <b>8</b></span><span>Longest wait <b>66 days</b></span>${c(1)}`, "");
    const tabs = AK.tabs([["All", total, view === "all" ? null : "after-review-queue", view === "all"], ["Waiting on me", 0, view === "mine" ? null : "after-review-queue-mine", view === "mine"]], "Review queue").replace(/<\/div>$/, `${c(2)}</div>`);
    if (view === "mine") return h.page(head, tabs, filters("Search the queue", [dd("Kind", rqKinds().map(([, l, n]) => [l, n])), "Program", "Waiting on", dd("Waiting longer than", [["30 days", 8], ["7 days", 1]])]), AK.empty({ title: "Nothing waits on you", line: "Records waiting on Ingrid Solberg as reviewer, approver or assessor show here. None does today." }));
    return h.page(head, tabs, rqTable());
  }
  S["after-review-queue"] = () => rqPage("all", true);
  S["after-review-queue-mine"] = () => rqPage("mine", false);
  ["after-review-queue", "after-review-queue-mine"].forEach((r) => { ROUTE_NAV[r] = "before-after"; });

  // The record's preview: decision buttons, labelled facts, the approval steps, the comment threads and the activity.
  const ptabs = (kind, base, list, cur, label) => AK.tabs(list.map(([k, l, n]) => [l, n, "@p:" + k, k === cur]), label).replace(/data-go="@p:([^"]+)"/g, (m, k) => `data-panel="${kind}" data-id="${esc(base + "|" + k)}"`);
  P["a-work-rq"] = (id) => {
    const [base, thread = "assessor"] = String(id).split("|");
    const [k, rid] = base.split(":");
    const r = rqRows().find((x) => x.kind === k && x.id === rid) || RQ_ALL[0];
    const first = r.kind === "evidence" && r.id === "e1";
    const c = (n) => (first ? co(n) : "");
    const kind = (rqKinds().find((x) => x[0] === r.kind) || [0, RQ_KIND[r.kind]])[1];
    const days = ago(r.since);
    const wait = `${md(r.since)} · waiting ${days} days`;
    let actions;
    if (r.kind === "evidence") actions = `${btn("Send back", `data-modal="a-work-sendback" data-id="${esc(base)}"`)}${c(4)}${btn("Accept evidence", `data-aw-toast="${esc("Not saved: Accept evidence isn't wired in the review queue; the Evidence register's Review saves a decision")}"`, true)}`; // v2 F [B1]: no success toast for nothing
    else if (r.kind === "assessment_results") actions = `<span class="btn sm ink a-work-held" aria-disabled="true" title="Held to D. Okafor, the lead assessor">Publish assessment results</span>`;
    else if (r.kind === "gate" || r.kind === "package") actions = btn("Request decision", `data-modal="ak-approvers" data-id="${esc(r.name)}"`, true);
    // v2 C2 (B17 in this file): the offer opens the offer, and SSP revision 3 opens its review page.
    else if (r.kind === "component_offer") actions = btn("Review offer", `data-v2go="component-mc-findings" data-v2q="${offerQ}"`, true);
    else if (r.kind === "ssp") actions = btn("Open the review", 'data-go="ssp-review"', true);
    else actions = btn({ discussion: "Open discussion", product_assessment: "Publish product assessment" }[r.kind], `data-aw-toast="${esc(r.kind === "discussion" ? "The discussion opens on the record it was started on" : "Opened for review")}"`, true);
    const head = AK.recordHead({ title: r.name, actions });
    const facts = [["Kind", esc(kind)], ["Program", esc(r.prog)], ["Waiting since", `${dfull(r.since)} · ${days} days`]];
    if (r.kind === "evidence") facts.push(["Owner", AK.owner(r.by)]);
    else if (r.by) facts.push(["Requested by", AK.owner(r.by) + (r.by === ME ? '<span class="a-work-mu a-work-you">(you)</span>' : "")]);
    if (r.due) facts.push(["Gate due", AK.due(r.due)]);
    let appr = "";
    if (r.kind !== "discussion") {
      const sub = r.kind === "evidence" ? `Requested by ${r.by} · ${md(r.since)}` : r.kind === "assessment_results" ? `Held to the lead assessor · waiting since ${md(r.since)}` : r.by && r.kind !== "package" ? `Requested by ${r.by}${r.by === ME ? " (you)" : ""} · ${md(r.since)}` : r.on ? `Waiting since ${md(r.since)}` : "No approver named yet. Request decision names them, in steps.";
      const approver = r.on || (r.kind === "assessment_results" ? "D. Okafor" : null);
      const steps = approver ? [{ label: "Step 1", approvers: [{ who: approver, role: ROLE_OF[approver] || "", state: "sent", when: wait }] }] : [];
      appr = AK.approval({ title: "Approval", sub, steps, facts: r.kind === "evidence" ? [["Version", "1 · pending review"]] : null, co: c(3) });
    }
    const extra = r.kind === "assessment_results" ? card(`<div class="a-work-ch"><b>Holds</b><span class="ct num">20</span></div><div class="a-work-lines"><div>${gl("check")}13 satisfied</div><div>${gl("part")}4 partially satisfied</div><div>${gl("diamond")}1 other than satisfied · IA-2(2)</div><div>${gl("ring")}2 not assessed</div></div>`)
      : r.kind === "component_offer" ? card(`<div class="a-work-ch"><b>The offer</b></div><p class="a-work-p">Found on WS-X90's LRU-001, which runs version 1 of the X800 Missile component set. Every system built from that version carries the same server.</p>`) : "";
    const two = r.kind === "evidence" || r.kind === "assessment_results";
    const items = first && thread === "assessor" ? [{ who: "Nadia Fournier", role: "Assessor", when: "Nov 14, 9:12 AM", text: `${AK.mention("Wes Duarte")} the export shows LRU-017's rule set; is LRU-013's coming in a second file? ${EX}` }] : [];
    const counts = first ? { assessor: 1, internal: 0 } : { assessor: 0, internal: 0 };
    const sub = two ? `<div class="a-work-subtabs">${ptabs("a-work-rq", base, [["assessor", "Assessor comments", counts.assessor], ["internal", "Internal comments", counts.internal]], thread, "Comment threads")}</div>` : "";
    const cm = AK.comments({ items, you: ME, external: two && thread === "assessor" });
    const comments = AK.section("Comments", `${sub}${cm}`, { count: two ? counts.assessor + counts.internal : 0, co: c(5) });
    const act = r.kind === "evidence" ? [{ who: r.by, what: "submitted version 1", when: md(r.since) }]
      : r.kind === "component_offer" ? [{ who: ME, what: "offered CVE-2024-6387 to the Mission Computer's owner", when: md(r.since) }]
      : r.kind === "assessment_results" ? [{ who: null, what: "recorded 20 findings in the draft results, increment 2", when: md(r.since) }] : [];
    return { label: "Review preview", body: `<div class="a-work-pan">${head}${AK.facts(facts)}${appr}${extra}${comments}${act.length ? AK.section("Activity", AK.activity(act)) : ""}${first ? AK.note("The comment is invented; the approval step, its dates and the version are WS-X90's.") : ""}</div>` };
  };
  M["a-work-sendback"] = (id) => {
    const r = RQ_ALL.find((x) => `${x.kind}:${x.id}` === id) || RQ_ALL[0];
    return { title: "Send back evidence", body: `<p class="ak-desc">${esc(r.name)}</p>
      ${field("What to revise", `<div class="ak-input tall">Say what the owner must change before the evidence can be accepted.</div>`, REQ)}
      <p class="a-work-hint">${AK.i("chat")}<span>${esc(r.by || "The owner")} sees this in the evidence's comments, as “Sent back: …”, and the evidence moves to Needs revision.</span></p>`, footer: foot("Send back") };
  };
  M["a-work-owner"] = (id) => {
    const [title = "Assign owner", what = ""] = String(id || "").split("|");
    return { title, body: `<p class="ak-desc">${esc(what ? `${what} chosen. The person you pick replaces whoever holds them now.` : "Pick a person.")}</p>${AK.ownerPicker({ you: ME, people: [["Nadia Fournier", "Assessor"], ["D. Okafor", "Lead assessor"], ["Priya Raghavan", "ISSO"], ["Joel Barrantes", "ISSM"], ["Ray Colston", "System owner"], ["Wes Duarte", "Engineer"]] })}`, footer: foot(title) };
  };

  // ═════════════ 5. Schedule: tasks and lifecycle gates (mod-risk.js TASKS, GATES and CHECKS) ═════════════
  const TASKS = [
    ["t1", "Monthly vulnerability scan — mission network (October)", "completed", "2026-10-04", "2026-10-11", "Joel Barrantes"],
    ["t2", "Monthly STIG compliance scan (October)", "completed", "2026-10-06", "2026-10-13", "Joel Barrantes"],
    ["t3", "Monthly POA&M review (October)", "completed", "2026-10-09", "2026-10-14", "Priya Raghavan"],
    ["t4", "Penetration test — maintenance access gateway", "cancelled", "2026-10-08", "2026-10-18", "Wes Duarte"],
    ["t5", "Monthly STIG compliance scan", "blocked", "2026-11-01", "2026-11-11", "Joel Barrantes"],
    ["t6", "Monthly vulnerability scan — mission network", "in_progress", "2026-11-04", "2026-11-15", "Joel Barrantes"],
    ["t7", "Monthly POA&M review", "ready", "2026-11-12", "2026-11-21", "Priya Raghavan"],
    ["t8", "Quarterly privileged account review (AC-2, AC-6)", "in_progress", "2026-11-07", "2026-12-01", "Victor Amsel"],
    ["t9", "Quarterly audit log review sampling (AU-6)", "planned", "2026-12-03", "2026-12-23", "Nadia Fournier"],
    ["t10", "Quarterly configuration baseline audit (CM-2, CM-3)", "planned", "2026-12-08", "2026-12-28", "Ingrid Solberg"],
    ["t11", "Annual control subset assessment — AC and IA families", "planned", "2027-01-12", "2027-02-11", "Nadia Fournier"],
    ["t12", "Incident response tabletop (IR-3)", "planned", "2027-02-16", "2027-03-13", "Priya Raghavan"],
    ["t13", "Contingency plan test on a whole article (CP-4)", "planned", "2027-03-23", "2027-04-12", "Amara Bell"],
    ["t14", "Cyber resiliency exercise — Redundancy and Non-Persistence (SA-24)", "planned", "2027-05-02", "2027-06-01", "Wes Duarte"],
  ].map(([id, t, s, a, b, o]) => ({ id, t, s, a, b, o, o0: o, s0: s }));
  // v2 F (B1): a task the Schedule's Create task made (sched.tasks, mod-zzzz-v2-4wire.js) is listed first, counted with the rest.
  const TASKS0 = TASKS.slice();
  // v2 C2 (B5): a task's owner follows an offboarding's reassignment (people.off), and the quarterly privileged account review's
  // task completes with its review (access.q1), as People and the access review show them.
  const syncTasks = () => {
    const made = (v2get("sched.tasks", []) || []).slice().reverse().map((m) => TASKS.find((x) => x.id === m.id) || { id: m.id, t: m.t, s: m.s, a: m.a, b: m.b, o: m.o, o0: m.o, s0: m.s, made: true });
    TASKS.splice(0, TASKS.length, ...made, ...TASKS0);
    const off = v2get("people.off", {}) || {}, done = v2get("access.q1.done"); for (const x of TASKS) { const o = off[x.o0]; x.o = (o && o.owners && o.owners[x.id]) || x.o0; x.s = x.id === "t8" && done ? "completed" : x.s0; }
  };
  // Source: the recurring check each task fulfils, from the cadence of checks on Continuous monitoring.
  const CHECK = { vuln: ["Monthly", "RA-5, SI-2", "vulnerability scan"], stig: ["Monthly", "CM-6", "STIG compliance scan"], poamr: ["Monthly", "CA-5", "POA&M review"], par: ["Quarterly", "AC-2, AC-6", "privileged account review"], au6: ["Quarterly", "AU-6", "audit log review sampling"], cm: ["Quarterly", "CM-2, CM-3", "configuration baseline audit"], subset: ["Yearly", "CA-2, CA-7", "control subset assessment"], ir: ["Yearly", "IR-3", "incident response tabletop"], cp: ["Yearly", "CP-4", "contingency plan test"], sa24: ["Yearly", "SA-24", "cyber resiliency exercise"] };
  const TCHECK = { t1: "vuln", t6: "vuln", t2: "stig", t5: "stig", t3: "poamr", t7: "poamr", t8: "par", t9: "au6", t10: "cm", t11: "subset", t12: "ir", t13: "cp", t14: "sa24" };
  const srcOf = (x) => { const k = CHECK[TCHECK[x.id]]; return k ? `${k[0]} · ${k[1]}` : "Custom"; };
  const TSTAT = { completed: ["ok", "Completed"], cancelled: ["none", "Cancelled"], blocked: ["bad", "Blocked"], in_progress: ["warn", "In progress"], ready: ["info", "Ready"], planned: ["none", "Planned"] };
  const tstat = (s) => pill(TSTAT[s][0], TSTAT[s][1]);
  const openTask = (x) => x.s !== "completed" && x.s !== "cancelled";
  const openCount = (o) => TASKS.filter((x) => x.o === o && openTask(x)).length;
  // v2 G: these are Increment 2's PDR and CDR (pdr-2, cdr-2 on Lifecycle, mod-zzzz-v2-8life.js): the PDR in review now, due Nov 24,
  // the CDR after it. Their NIST SP 800-160 Vol. 1 outcomes are the gate criteria Lifecycle reads (PA.lifeGates below).
  const GATES = [
    { id: "pdr", t: "PDR", long: "Preliminary design review", st: "in_review", due: "2026-11-24", crit: [["AR.4", "Identified stakeholder protection concerns are addressed by the system architecture.", "System Architecture Definition", "check"], ["AR.5", "Traceability of the security aspects of system architecture elements to key architecturally relevant stakeholder and system requirements is established.", "System Architecture Definition", "check"], ["AR.7", "Security aspects of system elements, their interactions, and their interfaces are defined.", "System Architecture Definition", "clock"], ["SR.6", "Traceability of the security aspects of system requirements and associated security-relevant constraints to stakeholder requirements is established.", "System Requirements Definition", "ring"]] },
    { id: "cdr", t: "CDR", long: "Critical design review", st: "not_started", due: "2027-03-23", crit: [["DE.2", "System requirements are allocated to address their security aspects.", "Design Definition", "ring"], ["DE.3", "Security interfaces and security aspects of interfaces between system elements composing the system are defined.", "Design Definition", "ring"], ["DE.4", "Security design characteristics of each system element are defined.", "Design Definition", "ring"], ["DE.6", "Traceability of security design characteristics is established.", "Design Definition", "ring"]] },
  ];
  const gpill = (g) => pill(g.st === "in_review" ? "info" : "none", g.st === "in_review" ? "In review" : "Not started");
  // v2 F (B17): Add security outcomes adds the outcomes chosen (gate.<id>.added, mod-zzzz-v2-4wire.js) to the gate's criteria, not met yet.
  const critOf = (g) => [...g.crit, ...((v2get("gate." + g.id + ".added", []) || []).map((x) => [x.code, x.title, x.proc, "ring"]))];
  // v2 G: the gates left the Schedule for Lifecycle, which reads their outcomes here: the base list, or with the outcomes added.
  window.PA.lifeGates = { crit: (id, added) => { const g = GATES.find((x) => x.id === id); return g ? (added ? critOf(g) : g.crit.slice()) : []; } };
  // The one grey line that points to Lifecycle: its next step, read from PA.v2life when the page draws.
  const lifeLine = () => {
    const L = window.PA.v2life, sg = L && L.stage("PRG-1090"), nx = sg && sg.next;
    return `<p class="note-p a-work-lifeln">Reviews, milestones and RMF steps are on <span class="ak-link" role="link" tabindex="0" data-go="lifecycle">Lifecycle</span>${nx ? `: next ${esc(nx.short)}, ${md(nx.due)}` : ""}.</p>`;
  };
  S["after-schedule"] = () => {
    syncTasks();
    // The STIG scan's preview opens beside the list on a wide screen, so its reason, reminder and activity show with the page.
    if (!quiet && window.innerWidth >= 1100) setTimeout(() => { if ((location.hash || "") !== "#after-schedule") return; const row = document.querySelector('#main tr[data-panel="a-work-task"][data-id="t5"]'); if (!row) return; row.click(); const f = document.activeElement; if (f && f.id === "closePanel") f.blur(); }, 0);
    const key = "sch", s = sel(key); // v2 C2 (A2): nothing ticked when the page opens
    const chosen = TASKS.filter((x) => s.has(x.id));
    const owners = [...new Set(chosen.map((x) => x.o))];
    const remind = owners.length ? owners.map((o) => `${o} (${openCount(o)} open task${openCount(o) === 1 ? "" : "s"})`).join(", ") + " reminded of everything still open" : "";
    // v2 F (B7): the chips count the rows, so a task Create task made joins All and Open (and Due soon when it falls due soon).
    const opn = TASKS.filter(openTask), dd = (x) => AK.days(x.b);
    const CHIPS = [["All", TASKS.length], ["Open", opn.length], ["Past due", opn.filter((x) => dd(x) < 0).length], ["Due soon", opn.filter((x) => dd(x) >= 0 && dd(x) <= 14).length], ["Blocked", TASKS.filter((x) => x.s === "blocked").length], ["Completed", TASKS.filter((x) => x.s === "completed").length]];
    return h.page(
      h.header("Schedule", `<span>WS-X90 Sentinel Mission System</span><span>Tasks <b>${TASKS.length}</b></span>`, btn("Create task", 'data-modal="a-work-task-new"', true)),
      lifeLine(),
      `<div class="views a-work-chips">${CHIPS.map(([l, n], i) => `<span class="qv${i ? "" : " on"}">${esc(l)} <span class="num">${n}</span></span>`).join("")}${co(1)}</div>`,
      toolbar(key, "Search tasks", ["Status", "Owner", "Due", "Source"], ["Assign owner", "Change due date", "Remind owners"], { co: co(6), attrs: { "Assign owner": `data-modal="a-work-owner" data-id="Assign owner|${s.size} task${s.size === 1 ? "" : "s"}"`, "Change due date": `data-modal="a-work-due" data-id="${s.size}"`, "Remind owners": `data-aw-toast="${esc(remind)}"` } }),
      tbl({
        cols: [cbAll(key, TASKS.map((x) => x.id), "Select every task"), "Task", "Due", `Source${co(2)}`, "Owner", "Status", `<span class="a-work-cc" title="Comments">${AK.i("chat")}${sr("Comments")}${EX}</span>`, sr("Row actions")],
        rows: TASKS.map((x) => ({ id: x.id, sel: s.has(x.id), cells: [cb(key, x.id, s.has(x.id), `Select ${x.t}`), tr(x.t, 240), openTask(x) ? AK.due(x.b, { prefix: false }) : AK.due(x.b, { done: true, prefix: false }), mu(srcOf(x)), AK.owner(x.o), tstat(x.s), x.id === "t5" ? `<span class="num">2</span>` : mu("0"), dots] })),
        total: TASKS.length, panel: "a-work-task", nm: 1, cls: "a-work-tight",
      }),
      AK.note("The STIG scan's blocker and reason, its comment count and who assigned it are invented. The tasks, their windows, owners and sources are WS-X90's continuous monitoring FY2027 plan."),
    );
  };
  ROUTE_NAV["after-schedule"] = "before-after";
  P["a-work-task"] = (id) => {
    syncTasks();
    const x = TASKS.find((t) => t.id === id) || TASKS[4];
    const stig = x.id === "t5", c = (n) => (stig ? co(n) : "");
    const open = openTask(x), n = openCount(x.o);
    const actions = stig ? btn("Unblock", 'data-aw-toast="Unblocked: Joel Barrantes is told, and the reason stays in the activity"', true)
      : open ? `${btn("Mark blocked", `data-modal="a-work-blocked" data-id="${x.id}"`)}${btn("Mark complete", `data-aw-toast="${esc(x.t)} completed"`, true)}` : "";
    const head = AK.recordHead({ title: x.t, chip: tstat(x.s), actions });
    const reason = stig ? AK.reasonCard({ question: "What blocks it", reason: "The RHEL 9 checklist needs the new STIG release before the scan can run.", who: "Joel Barrantes", when: "Nov 11", co: c(4) }).replace("</p>", ` ${EX}</p>`) : "";
    const remind = open ? AK.remind({}).replace('<span class="btn sm">', `<span class="btn sm" role="button" tabindex="0" data-aw-toast="${esc(`${x.o} reminded of ${n === 1 ? "their open task" : `all ${n} of their open tasks`}`)}">`) : "";
    const owner = `<span class="a-work-own"><span class="a-work-own1">${AK.owner(x.o)}${open ? mu(`· ${n} open task${n === 1 ? "" : "s"}`) : ""}</span>${open ? `<span class="a-work-rem">${remind}${c(5)}</span>` : ""}</span>`;
    const ck = CHECK[TCHECK[x.id]];
    const kv = dl([["Owner", owner], ["Window", `<span class="num">${dfull(x.a)} – ${dfull(x.b)}</span>`], ["Due", open ? AK.due(x.b) : AK.due(x.b, { done: true })], ["Repeats", ck ? `${ck[0]} · ${ck[1]}` : "Does not repeat"], ["Plan", "WS-X90 continuous monitoring — FY2027"]]);
    const act = [{ who: null, what: ck ? `created the task from the plan's ${ck[0].toLowerCase()} ${esc(ck[2])}` : "created the task from the plan", when: md(x.a) }];
    if (stig) act.push({ who: "Priya Raghavan", what: `assigned it to <b>Joel Barrantes</b> ${EX}`, when: "Nov 1" }, { who: "Joel Barrantes", what: `set the status to <b>Blocked</b> and said why ${EX}`, when: "Nov 11" });
    return { label: "Task preview", body: `<div class="a-work-pan">${head}${reason}${kv}${AK.section("Activity", AK.activity(act), { co: c(3) })}${stig ? AK.note("The blocker, its reason and who assigned the task are invented.") : ""}</div>` };
  };
  // v2 G: one gate record. Lifecycle (mod-zzzz-v2-8life.js) draws every step's preview, PDR and CDR included, with its deliverables,
  // criteria, approval and decision, and ↗ to the gate's page; this drawing stays only for a build without that module.
  P["a-work-gate"] = (id) => {
    if (window.PA.v2life && window.PA.v2life.preview) { const o = window.PA.v2life.preview(id); if (o) return o; }
    const g = GATES.find((x) => x.id === id) || GATES[0];
    const pdr = g.id === "pdr";
    const head = AK.recordHead({ title: `${g.t} · ${g.long}`, chip: gpill(g), actions: `${btn("Add security outcomes", `data-modal="v2f-outcomes" data-id="${g.id}"`)}${btn("Request decision", `data-modal="ak-approvers" data-id="${esc(g.t)}"`, true)}` });
    const kv = dl([["Due", AK.due(g.due)], ["Decided", `<span class="who">${gl("ring")}Not yet</span>`]]);
    const appr = pdr ? AK.approval({ title: "Approval", sub: "Requested Oct 10 · the gate is decided when every step approves", steps: [{ label: "Step 1", approvers: [{ who: "Ray Colston", role: "System owner", state: "sent", when: `Oct 10 · waiting ${ago("2026-10-10")} days` }] }] })
      : AK.approval({ title: "Approval", sub: "No decision requested yet. Request decision names the approvers, in steps." });
    const crit = AK.section("Gate criteria", `<div class="a-work-crit">${critOf(g).map(([code, t, proc, st]) => `<div>${gl(st)}<span><span>${esc(t)}</span><small>${tag(code)} ${esc(proc)}</small></span></div>`).join("")}</div>`, { count: critOf(g).length, co: " " + EX });
    return { label: "Lifecycle gate preview", body: `<div class="a-work-pan">${head}${kv}${appr}${pdr ? AK.note("The approver and the request date are invented; WS-X90's PDR names no approver yet.") : ""}${crit}</div>` };
  };
  M["a-work-blocked"] = (id) => {
    const x = TASKS.find((t) => t.id === id) || TASKS[4];
    return { title: "Mark blocked", body: `<p class="ak-desc">${esc(x.t)} · ${esc(x.o)}</p>
      ${field("What blocks it", `<div class="ak-input tall">Say what stops the work. It shows first on the task, with your name and the date.</div>`, REQ)}
      ${field("Unblock by", `<div class="ak-select">${AK.i("calendar")}Choose a day</div>`, OPT, "On that day the owner is reminded to look again.")}`, footer: foot("Mark blocked") };
  };
  M["a-work-due"] = (n) => ({ title: "Change due date", body: `<p class="ak-desc">${esc(n)} tasks chosen. Each keeps its window's start.</p>${field("Due date", `<div class="ak-select">${AK.i("calendar")}Choose a day</div>`, REQ)}${field("Reason", `<div class="ak-input tall">Why the date moves. It is kept in each task's activity.</div>`, REQ)}`, footer: foot("Change due date") });
  M["a-work-task-new"] = () => ({ title: "Create task", body: `${field("Title", `<div class="ak-input">What is done, in one line</div>`, REQ)}${field("Owner", `<div class="ak-select">${AK.i("user")}No owner ${AK.i("down")}</div>`)}${field("Due date", `<div class="ak-select">${AK.i("calendar")}Choose a day</div>`)}${field("Source", `<div class="ak-select">Custom ${AK.i("down")}</div>`, "", "Or the recurring check it fulfils, such as Monthly · CM-6.")}`, footer: foot("Create task") });

  // ═════════════ 6. Notifications (mod-platform.js NT, its digest schedule and quiet hours) ═════════════
  const NT = [
    ["Operational issue past its remediation date", "Owner, ISSO", 1, 1, "Daily digest"], ["Critical or high finding opened", "ISSO, ISSM", 1, 1, "Immediately"], ["IAVA released that affects an asset", "ISSM", 1, 1, "Immediately"],
    ["Evidence sent back by the assessor", "Evidence owner", 1, 1, "Daily digest"], ["Evidence waiting for review", "Assessor", 0, 1, "Daily digest"], ["Finding offered on a component you own", "Component owner", 1, 1, "Immediately"],
    ["New CVE in a component the program uses", "ISSO", 1, 1, "Immediately"], ["POA&M milestone due within 14 days", "POA&M owner", 1, 1, "Weekly digest"], ["Import failed or past its cadence", "Requester, ISSM", 1, 1, "Immediately"],
    ["Assessment results published", "ISSO, ISSM, system owner", 1, 1, "Immediately"], ["Authorization decision recorded", "AO, ISSM, system owner", 1, 1, "Immediately"], ["Data call due within 7 days", "Owner", 1, 1, "Daily digest"], ["Access review due", "ISSO", 1, 0, "Weekly digest"],
  ];
  const sw = (on, label) => `<span class="a-work-sw${on ? " on" : ""}" role="switch" tabindex="0" aria-checked="${!!on}" aria-label="${esc(label)}" data-aw-sw></span>`;
  const chan = (t = "In the app and email") => `<span class="ak-select a-work-chan">${esc(t)} ${AK.i("down")}</span>`;
  // v2 (settings budget): On and Off are the only pills; a frequency is a grey word.
  const freq = (f) => `<span class="a-work-mu a-work-freq">${esc(f)}</span>`;
  const radio = (label, on, hint = "") => `<span class="a-work-radio${on ? " on" : ""}" role="radio" tabindex="0" aria-checked="${!!on}" data-aw-radio><span class="dot" aria-hidden="true"></span><span>${esc(label)}${hint ? `<small>${esc(hint)}</small>` : ""}</span></span>`;
  // New for the reader (0337's ownership, comment-thread and task-deadline alerts), then today's events as they reach her.
  const MINE = [
    ["When I'm made the owner of a record", 1, null, 1],
    ["When a comment is added to a thread I'm in", 1, null, 1],
    ["When a task I own is due in 7 days or overdue", 1, null, 1, "An alert goes 7 days before the due date, and again once it passes."],
    ["When an operational issue I own passes its remediation date", 1, "Daily digest"],
    ["When a critical or high finding opens on WS-X90", 0, "Immediately"],
    ["When a finding is offered on a component I own", 0, "Immediately"],
  ];
  const alertRow = ([t, on, f, , hint], c = "") => `<div class="a-work-al">${sw(on, t)}<span class="x"><span>${esc(t)}${c}</span>${hint ? `<small>${esc(hint)}</small>` : ""}</span><span class="a-work-alf">${f ? freq(f) : ""}${on ? chan() : ""}</span></div>`;
  const onOff = (on, dis) => (dis ? pill("none", "Off") : on ? pill("ok", "On") : pill("none", "Off"));
  // v2 (A7): the Settings frame's list of sections holds My account › Notifications and Workspace › Notifications, so the page's
  // own My alerts / Workspace tabs are gone (the two routes stay); each page names itself.
  function notifPage(tab, withCo) {
    bell(withCo ? co(4) : "");
    const c = (n) => (withCo ? co(n) : "");
    const tabs = "";
    const head = AK.indexHead({ title: tab === "mine" ? "Notifications" : "Workspace notifications", desc: tab === "mine" ? `What reaches you, Ingrid Solberg, and how. The workspace is CUI ${EX}, so chat is off.` : `What the workspace sends, to whom and when. The workspace is CUI ${EX}, so chat is off.`, actions: `${c(1)}${btn("Send a test", 'data-modal="a-work-test"', true)}` });
    if (tab === "mine") {
      const alerts = card(`<div class="a-work-ch"><b>Alerts</b>${EX}<span class="a-work-mu">Sent to you, Ingrid Solberg.</span></div><div class="a-work-als">${MINE.map((r, i) => alertRow(r, i === 0 ? c(3) : "")).join("")}</div>`);
      const lines = [["Findings", "17 operational issues past their remediation date", "findings"], ["Evidence", "54 evidence versions to revise", "evidence"], ["Risks", "40 open risks with no owner", "risks"], ["Schedule", "2 tasks past due", "schedule"]];
      const digest = card(`<div class="a-work-ch"><b>My digest</b>${EX}${c(6)}</div>
        <div class="a-work-al">${sw(1, "Monday summary")}<span class="x"><span>Monday summary</span><small>Everything waiting on WS-X90, every Monday at 07:00.</small></span><span class="a-work-alf">${chan("Email")}</span></div>
        <div class="a-work-msg" role="group" aria-label="Preview of Monday's summary"><div class="a-work-msgh">${AK.i("mail")}<b>A summary of everything waiting on WS-X90</b><span class="a-work-mu">Mon, Nov 23 · 07:00</span></div>
        ${lines.map(([k, t, r]) => `<div class="a-work-msgg"><span class="k">${k}</span><span><b class="num">${t}</b>, on <a href="#${r}">${k}</a></span></div>`).join("")}</div>`);
      return h.page(head, tabs, alerts, digest, AK.note("The alerts, their channels and the digest are a proposal; the counts in Monday's summary are WS-X90's today."));
    }
    const sched = card(`<div class="a-work-ch"><b>Schedule</b></div><p class="a-work-p">When alerts may go out. A digest waits for the next allowed hour.</p><div class="a-work-fld"><span class="k">Allow notifications</span><span class="a-work-radios" role="radiogroup" aria-label="Allow notifications">${radio("Anytime", 0)}${radio("Between 06:00 and 20:00 local", 1, "Critical findings still go at any hour.")}</span></div>`);
    const owners = card(`<div class="a-work-ch"><b>Owner reminders</b>${EX}</div><div class="a-work-al">${sw(1, "Owner reminders")}<span class="x"><span>Send each owner a digest of their open work</span><small>On top of the alerts owners already get: an issue past its remediation date, a POA&amp;M milestone due within 14 days, a data call due within 7 days.</small></span><span class="a-work-alf">${chan("Email")}</span></div><div class="a-work-fld"><span class="k">Frequency</span><span class="a-work-radios" role="radiogroup" aria-label="Frequency">${radio("Every Monday", 1)}${radio("Every weekday", 0)}</span></div>`);
    const table = `<div class="frame a-work-tight"><div class="tablebox"><table><thead><tr><th>Event</th><th>Who</th><th>Email</th><th>In the app</th><th>Chat</th><th>Frequency</th></tr></thead><tbody>${NT.map(([ev, who, e, a, f]) => `<tr class="a-work-still"><td class="nm">${tr(ev, 330)}</td><td>${mu(esc(who))}</td><td>${onOff(e)}</td><td>${onOff(a)}</td><td>${onOff(0, true)}</td><td>${freq(f)}</td></tr>`).join("")}</tbody></table></div><div class="pager"><span class="num">1–13 of 13</span><span>Changes save as you make them</span></div></div>`;
    const chat = card(`<div class="a-work-ch"><b>Chat</b></div><p class="a-work-p">Off in the CUI enclave; available in the unclassified enclave.</p>`);
    return h.page(head, tabs, `<div class="grid2">${sched}${owners}</div>`, `<h4 class="subhead">Workspace defaults</h4>`, table, chat, AK.note("Proposal: the events, channels and frequencies are Example. The people each role reaches are WS-X90's role holders."));
  }
  S["after-notifications"] = () => notifPage("mine", true);
  S["after-notifications-workspace"] = () => notifPage("ws", false);
  ["after-notifications", "after-notifications-workspace"].forEach((r) => { ROUTE_NAV[r] = "before-after"; });
  M["a-work-test"] = () => ({ title: "Send a test", body: `<p class="ak-desc">Sends one of each alert you have on to you, Ingrid Solberg, by email and in the app. Chat stays off in the CUI enclave.</p>${dl([["To", AK.owner(ME)], ["Marking", tag("CUI")]])}`, footer: foot("Send test") });

  // ═════════════ 7. Reports & exports (mod-platform.js REP) ═════════════
  const REP = [
    { id: "ssp", name: "System security plan", fmt: "OSCAL JSON", source: "SSP 2 · published Jul 25", last: "2026-11-03", sched: "On publish", ex: true },
    { id: "sar", name: "Security assessment report", fmt: "OSCAL JSON", source: "Expanded Control Set results · 225 findings", last: "2026-11-12", sched: "When results are published", ex: true },
    { id: "poam", name: "Plan of action and milestones", fmt: "OSCAL JSON", source: "41 items · 7 completed", last: "2026-11-01", sched: "Monthly · 1st", ex: true },
    { id: "emass", name: "eMASS import package", fmt: "eMASS XLSX", source: "560 controls · 41 POA&M items", last: "2026-10-01", sched: "Quarterly", ex: true },
    { id: "sctm", name: "Security controls traceability matrix", fmt: "XLSX", source: "560 controls · 640 requirements", last: "2026-11-16", sched: "Weekly · Monday", ex: true },
    { id: "risk", name: "Risk snapshot", fmt: "PDF, locked", source: "40 open risks", last: null, sched: "On package publish", ex: true },
    { id: "trend", name: "Control status trend", fmt: "CSV", source: "Daily snapshot since Nov 13 · 5 days", last: "2026-11-17", lastT: "23:55 UTC", sched: "Daily · 23:55 UTC" },
    { id: "pkg", name: "Authorization package", fmt: "ZIP", source: "Package version 1 · 3 of its parts published", last: "2026-09-02", sched: "On publish", by: "Priya Raghavan" },
  ];
  const PA_BY = `<span class="a-work-sys"><span class="a-work-pa" aria-hidden="true">PA</span>Program Assurance</span>`;
  const byCell = (r) => (r.by ? AK.owner(r.by) : PA_BY);
  const lastCell = (r) => (r.last ? `<span class="num">${md(r.last)}${r.lastT ? " · " + r.lastT : ""}</span>` : `<span class="who">${gl("ring")}Not run</span>`);
  const repName = (r) => `<span class="a-work-rn">${tr(r.name, 230)}${r.ex ? EX : ""}${r.id === "trend" ? `<span class="a-work-pgt">${AK.i("link")}Page</span>${co(5)}` : ""}</span>`;
  S["after-reports"] = () => h.page(
    h.header("Reports & exports", `<span>WS-X90 Sentinel Mission System · CUI banner on every export</span>${co(1)}`, btn("Generate", 'data-modal="a-work-generate" data-id="ssp"', true)),
    filters("Search reports", [dd("Format", [["OSCAL JSON", 3], ["eMASS XLSX", 1], ["XLSX", 1], ["PDF, locked", 1], ["CSV", 1], ["ZIP", 1]]), dd("Schedule", [["On publish", 3], ["Daily", 1], ["Weekly", 1], ["Monthly", 1], ["Quarterly", 1], ["When results are published", 1]]), dd("Created by", [["Program Assurance", 7], ["Priya Raghavan", 1]])]),
    tbl({
      cols: ["Report", `Created by${co(2)}`, "Format", "From", "Last run", "Schedule", sr("Row actions")],
      rows: REP.map((r) => ({ id: r.id, go: r.id === "trend" ? "after-reports-trend" : undefined, cells: [repName(r), byCell(r), tag(r.fmt), tr(r.source, 190), lastCell(r), tr(r.sched, 140), `<span class="a-work-dots" title="Generate · Share · Manage schedule">${AK.i("dots")}</span>`] })),
      total: 8, panel: "a-work-report", cls: "a-work-tight",
    }),
    AK.note("The OSCAL, eMASS, SCTM and risk exports, their runs and schedules, and who they are shared with are invented; the daily control status snapshot, package version 1 and what each export reads from are WS-X90's."),
  );
  ROUTE_NAV["after-reports"] = "before-after";
  const SHARED = [["Priya Raghavan", "ISSO", "Can edit"], ["Joel Barrantes", "ISSM", "Can view"], ["R. Calloway", "Authorizing official", "Can view"]];
  const shareMenu = (r) => `<details class="a-work-mn"><summary class="btn sm ink" aria-haspopup="menu">Share ${AK.i("down")}</summary><div class="a-work-menu" role="menu"><span role="menuitem" tabindex="0" data-modal="a-work-access" data-id="${r.id}">${AK.i("user")}Manage access</span><span role="menuitem" tabindex="0" data-modal="a-work-schedule" data-id="${r.id}">${AK.i("calendar")}Manage schedule</span><span role="menuitem" tabindex="0" data-aw-toast="Link copied. Access stays limited to people cleared for CUI">${AK.i("link")}Copy link</span><p>Access is limited to people cleared for CUI.</p></div></details>`;
  const RUNS = {
    pkg: [["Sep 2 · version 1 published by Priya Raghavan", pill("ok", "Done")], ["Sep 18 · authorized with conditions by R. Calloway", pill("ok", "Decided")]],
  };
  P["a-work-report"] = (id) => {
    const r = REP.find((x) => x.id === id) || REP[0];
    const first = r.id === "ssp", c = (n) => (first ? co(n) : "");
    const head = AK.recordHead({ title: r.name, actions: `${shareMenu(r)}${btn("Generate", `data-aw-toast="${esc(`Not saved: Generate isn't wired in this prototype; no run of ${r.name} is made`)}"`)}${c(3)}` });
    const kv = dl([["Format", tag(r.fmt)], ["From", esc(r.source)], ["Schedule", `<span class="a-work-schd">${esc(r.sched)} · <span class="ak-link" role="button" tabindex="0" data-modal="a-work-schedule" data-id="${r.id}">Manage schedule</span>${c(4)}</span>`], ["Marking", tag("CUI")], ["Created by", byCell(r)]]);
    const shared = AK.section("Shared with", `<div class="a-work-share">${SHARED.map(([n, role, can]) => `<div class="a-work-sh">${AK.avatar(n, 26)}<span class="x"><b>${esc(n)}</b><small>${esc(role)}</small></span><span class="a-work-can">${esc(can)}</span><span class="a-work-ib" role="button" tabindex="0" title="Send now" aria-label="${esc(`Send ${r.name} to ${n} now`)}" data-aw-toast="${esc(`Sent to ${n} once, by email`)}">${AK.i("mail")}</span><span class="a-work-ib" title="More" aria-label="${esc(`More for ${n}`)}">${AK.i("dots")}</span></div>`).join("")}</div>`, { count: 3, co: " " + EX });
    const runs = (RUNS[r.id] || (r.last ? [[`${md(r.last)} · ${r.fmt}`, pill("ok", "Done")]] : [])).map(([t, p]) => `<div class="a-work-run"><span>${esc(t)}</span>${p}</div>`).join("") || `<span class="who">${gl("ring")}Never run</span>`;
    return { label: "Report preview", body: `<div class="a-work-pan">${head}${kv}${shared}${AK.section("Runs", `<div class="a-work-runs">${runs}</div>`, { co: r.ex ? " " + EX : "" })}${AK.note("Who has access, their rights and the run history are invented.")}</div>` };
  };
  M["a-work-schedule"] = (id) => {
    const r = REP.find((x) => x.id === id) || REP[2];
    const poam = r.id === "poam";
    const rec = poam ? ["Ray Colston", "Joel Barrantes"] : ["Priya Raghavan"];
    const event = /publish/i.test(r.sched);
    const freqHtml = poam ? `<span class="a-work-inl">Send every <span class="ak-select a-work-n">1</span><span class="ak-select">Month ${AK.i("down")}</span> on the <span class="ak-select">1st ${AK.i("down")}</span></span>`
      : event ? `<span class="ak-select">${esc(r.sched === "On publish" ? "Each time its source is published" : r.sched)} ${AK.i("down")}</span>` : `<span class="ak-select">${esc(r.sched)} ${AK.i("down")}</span>`;
    return { title: "Manage schedule", body: `
      <div class="a-work-repc"><span class="a-work-tile">${h.icon("reports")}</span><span class="x"><b>${esc(r.name)}</b><small>${esc(r.fmt)} · ${esc(r.source)}</small></span></div>
      <p class="a-work-p">This report has 1 schedule: ${esc(r.sched)}. <span class="ak-link">View schedules</span></p>
      ${field("Frequency", freqHtml)}
      ${event ? "" : field("Starting on", `<div class="ak-select">${AK.i("calendar")}${poam ? "Dec 1, 2026" : "Nov 23, 2026"}</div>`)}
      ${field("Recipients", `<div class="a-work-chips2">${rec.map((n) => `<span class="ak-chip">${AK.avatar(n, 18)}${esc(n)}${AK.i("x")}</span>`).join("")}<span class="ak-link">${AK.i("plus")}Add people</span></div>`, ` ${EX}`, poam ? "The system owner owns the POA&amp;M; the ISSM owns continuous monitoring." : "")}
      ${field("Message", `<div class="ak-input tall">Sent with each report.</div>`, OPT)}`, footer: foot("Save schedule") };
  };
  M["a-work-access"] = (id) => {
    const r = REP.find((x) => x.id === id) || REP[0];
    return { title: "Manage access", body: `<p class="ak-desc">${esc(r.name)} · access is limited to people cleared for CUI. ${EX}</p>
      <div class="a-work-share">${SHARED.map(([n, role, can]) => `<div class="a-work-sh">${AK.avatar(n, 26)}<span class="x"><b>${esc(n)}</b><small>${esc(role)}</small></span><span class="ak-select a-work-can2">${esc(can)} ${AK.i("down")}</span><span class="a-work-ib" title="Send a one-time notification" aria-label="${esc(`Notify ${n} once`)}">${AK.i("mail")}</span><span class="a-work-ib" title="Remove access" aria-label="${esc(`Remove access for ${n}`)}">${AK.i("x")}</span></div>`).join("")}</div>
      ${field("Add people", `<div class="ak-select">${AK.i("user")}Search people cleared for CUI</div>`)}`, footer: `<button type="button" class="btn ink" data-close-modal>Done</button>` };
  };
  M["a-work-generate"] = (id) => {
    const r = REP.find((x) => x.id === id) || REP[0];
    return { title: "Generate report", body: `${field("Report", `<div class="ak-select">${esc(r.name)} · ${esc(r.fmt)} ${AK.i("down")}</div>`)}${field("Read from", `<span class="a-work-radios" role="radiogroup" aria-label="Read from">${radio("SSP 2 · published Jul 25", 1)}${radio("SSP 3 · draft", 0, "Marked DRAFT on every page.")}</span>`)}<p class="a-work-hint">${AK.i("info")}<span>Exports carry the CUI banner, the designation indicator and Distribution D, and each is logged in the event log.</span></p>`, footer: foot("Generate") };
  };
  // A report opens as a page: a time frame, the widgets, and each value compared with the period's first day.
  const SNAP = [["2026-11-13", 14, 235, 90, 13, 34, 174], ["2026-11-14", 14, 235, 90, 13, 34, 174], ["2026-11-15", 14, 234, 89, 13, 34, 176], ["2026-11-16", 14, 234, 89, 13, 34, 176], ["2026-11-17", 14, 233, 90, 13, 34, 176]];
  function trendChart() {
    const W = 520, H = 170, L = 34, R = 24, T = 18, B = 30, lo = 170, hi = 180;
    const x = (i) => L + (i * (W - L - R)) / (SNAP.length - 1);
    const y = (v) => T + ((hi - v) / (hi - lo)) * (H - T - B);
    const pts = SNAP.map((s, i) => `${x(i).toFixed(1)},${y(s[6]).toFixed(1)}`).join(" ");
    const grid = [170, 175, 180].map((v) => `<line class="a-work-gl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="a-work-gt" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("");
    const days = SNAP.map((s, i) => `<text class="a-work-gt" x="${x(i)}" y="${H - 8}" text-anchor="middle">${md(s[0])}</text>`).join("");
    const dotsSvg = SNAP.map((s, i) => `<circle class="a-work-gd" cx="${x(i)}" cy="${y(s[6])}" r="3.5"><title>${md(s[0])}: ${s[6]} of 560 satisfied</title></circle>`).join("");
    const lastI = SNAP.length - 1;
    return `<svg class="a-work-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Controls satisfied each day from Nov 13 to Nov 17: ${SNAP.map((s) => s[6]).join(", ")} of 560">${grid}<polyline class="a-work-gp" points="${pts}"/>${dotsSvg}<text class="a-work-gv" x="${x(lastI) + 6}" y="${y(SNAP[lastI][6]) - 8}" text-anchor="end">176</text>${days}</svg>`;
  }
  S["after-reports-trend"] = () => {
    const a = SNAP[0], z = SNAP[SNAP.length - 1];
    const ST = [["Satisfied", "ok", 6], ["Partially satisfied", "part", 5], ["Other than satisfied", "bad", 4], ["Not assessed", "info", 3], ["No evidence", "none", 2], ["No requirement", "none", 1]];
    const delta = (d) => (d > 0 ? `<span class="a-work-up num">+${d}</span>` : d < 0 ? `<span class="a-work-dn num">−${-d}</span>` : `<span class="a-work-mu num">No change</span>`);
    return h.page(
      AK.back("Reports & exports", "after-reports"),
      AK.indexHead({ title: "Control status trend", desc: "WS-X90's 560 controls by control status, from the snapshot taken every day at 23:55 UTC.", actions: `${btn(`${AK.i("down")}Export CSV`)}${btn("Share", 'data-modal="a-work-access" data-id="trend"', true)}` }),
      `<div class="tools"><span class="ak-select a-work-tf">${AK.i("calendar")}Last 5 days (Nov 13 – Nov 17) ${AK.i("down")}</span><span class="flt">Program: WS-X90 ⌄</span><span class="flt">Baseline: WS-X90 control baseline ⌄</span></div>`,
      `<div class="grid2 a-work-widgets">${card(`<div class="a-work-ch"><b>Controls satisfied</b></div><div class="a-work-big"><span class="big num">176</span><span class="a-work-mu num">of 560 · 31%</span>${AK.chip("+2 compared to Nov 13", { tone: "ok" })}</div>${trendChart()}<p class="note-p">The axis starts at 170, so a change of two controls shows.</p>`)}
        ${card(`<div class="a-work-ch"><b>Control status, Nov 17</b><span class="a-work-mu">Compared to Nov 13</span></div><div class="a-work-strows">${ST.map(([l, k, i]) => `<div>${pill(k, l)}<b class="num">${z[i]}</b>${delta(z[i] - a[i])}</div>`).join("")}</div><p class="note-p">Two controls moved from No evidence to Satisfied on Nov 15.</p>`)}</div>`,
      `<p class="note-p">Real: the five daily snapshots in program_posture_snapshots since tracking began on Nov 13; a longer time frame shows the same five days.</p>`,
    );
  };
  ROUTE_NAV["after-reports-trend"] = "before-after";

  // ═════════════ 8. AI drafts (mod-compliance.js BATCHES): runs, agents and one approval frame ═════════════
  const TEMPLATE = "The SYS-WSX90 satisfies the tailored intent of {c} through a combination of system-level procedures and mapped component implementations. This narrative is synthetic demo content.";
  const BATCHES = [
    { id: "b1", t: "SSP 3 narratives · AC family", kind: "Narrative", agent: "SSP narratives", when: "Nov 16", items: [
      ["AC-2", "Account management on WS-X90 rests on REQ-001 and REQ-075: accounts on the Mission Computer, Protected Network Gateway, Navigation & Timing Subsystem and Maintenance Laptop are created, reviewed and disabled through the provisioning workstation.", "REQ-001, REQ-075 · Evidence for REQ-001"],
      ["AC-2(7)", "Platform privilege is carried by named roles, never attached to an account (REQ-443). The Platform Management Controller holds the role table; membership changes are logged and exported.", "REQ-443 · Privileged role table and membership change log export, LRU-013"],
      ["AC-11", "The Protected Network Gateway, Platform Management Controller and Maintenance Access Gateway lock a session after the inactivity period AC-11_ODP[02] sets; that period is not set yet.", "REQ-008, REQ-082 · AC-11_ODP[02] not set"],
    ] },
    { id: "b2", t: "Requirements for the controls no requirement maps", kind: "Requirement", agent: "Requirements for unmapped controls", when: "Nov 16", items: [
      ["SA-24", "WS-X90 shall apply the nine cyber resiliency techniques SA-24_ODP[03] names, Adaptive Response through Substantiated Integrity, to the Mission Computing and Communications subsystems.", "SA-24_ODP[03] · program tailoring"],
      ["SI-4(13)", "Map REQ-262 to SI-04(13)(a)[02], (b)[02] and (c)[02]: event patterns are profiled beside the traffic it already profiles.", "REQ-262 · SI-4(13) objectives"],
      ["SC-34", "The Mission Computer and Secure Boot Controller shall load the operating system and applications from hardware-enforced read-only media.", "SC-34 · Secure Boot Controller"],
    ] },
    { id: "b3", t: "SSP 3 narratives · SI family", kind: "Narrative", agent: "SSP narratives", when: "Nov 15", items: [
      ["SI-2", "Flaws are identified by the monthly mission network scan and the Mission Computer SBOM. CVE-2024-6387 was fixed in Mission Computer version 2 (openssh-server 9.8p1); updates install within the SI-02_ODP period, not yet set.", "REQ-064 · Mission Computer SBOM · CVE-2024-6387"],
      ["SI-4(13)", "Outbound traffic is profiled per mission phase on the Protected Network Gateway and Tactical Data Radio (REQ-262).", "REQ-262"],
    ] },
  ];
  const DS = { "b1-0": "approved", "b3-0": "approved", "b3-1": "rejected" };
  const tally = (b) => { const s = b.items.map((_, i) => DS[`${b.id}-${i}`]); return { ok: s.filter((x) => x === "approved").length, no: s.filter((x) => x === "rejected").length, wait: s.filter((x) => !x).length }; };
  const AGENTS = [
    { id: "ssp", name: "SSP narratives", does: "Drafts a control's implementation narrative for SSP 3 from its requirements, evidence and parameters.", runs: 2 },
    { id: "req", name: "Requirements for unmapped controls", does: "Drafts a requirement for each control of the baseline that no requirement maps.", runs: 1 },
  ];
  const aiHead = () => h.header("AI drafts", "<span>Drafted from WS-X90's requirements, evidence and parameters</span><span>Nothing applies without a person</span>", `<span class="btn" role="button" tabindex="0">Settings</span><span class="btn ink" role="button" tabindex="0" data-aw-toast="A run of SSP narratives starts on the AU family: its drafts will wait on you">Draft narratives</span>`);
  const aiTabs = (cur, c = "") => AK.tabs([["Runs", 3, cur === "runs" ? null : "after-ai-drafts", cur === "runs"], ["Agents", 2, cur === "agents" ? null : "after-ai-drafts-agents", cur === "agents"], ["Templates", null, null, false]], "AI drafts").replace(/<\/div>$/, `${c}</div>`);
  S["after-ai-drafts"] = () => h.page(
    aiHead(),
    banner({ tone: "info", text: `<b>74 of SSP 3's 560</b> narratives are placeholder text, and 14 controls have no requirement.${co(1)}`, action: "Draft requirements" }, 'data-aw-toast="A run of Requirements for unmapped controls starts: its drafts will wait on you"'),
    aiTabs("runs", co(2)),
    filters("Search runs", [dd("Agent", AGENTS.map((a) => [a.name, a.runs])), dd("Status", [["Waiting on you", 2], ["Reviewed", 1]])]),
    tbl({
      cols: ["Run", "Agent", "Drafts", "Waiting", "Approved", "Rejected", "Drafted", "Status"],
      rows: BATCHES.map((b) => { const t = tally(b); return { id: b.id, cells: [`<span class="a-work-rn">${tr(b.t, 270)}${EX}</span>`, tr(b.agent, 170), `<span class="num">${b.items.length}</span>`, t.wait ? `<b class="num a-work-warn">${t.wait}</b>` : mu("0"), `<span class="num">${t.ok}</span>`, `<span class="num">${t.no}</span>`, `<span class="num">${esc(b.when)}</span>`, t.wait ? pill("warn", "Waiting on you") : pill("ok", "Reviewed")] }; }),
      total: 3, panel: "a-work-run", cls: "a-work-tight",
    }),
    AK.note("WS-X90 holds no AI drafts: the runs, agents and drafts are invented. The 74 placeholder narratives and the 14 controls with no requirement are WS-X90's."),
  );
  S["after-ai-drafts-agents"] = () => h.page(
    aiHead(),
    aiTabs("agents"),
    filters("Search agents", [dd("Trigger", [["Manual", 2], ["Schedule", 0], ["Event", 0]]), dd("Status", [["Active", 2], ["Inactive", 0]])]),
    tbl({ cols: ["Name", "Trigger", "Status", sr("Row actions")], rows: AGENTS.map((a) => ({ id: a.id, cells: [`<span class="a-work-agent"><span><b>${esc(a.name)}</b> ${EX}</span><small>${esc(a.does)}</small></span>`, tag("Manual"), pill("ok", "Active"), `<span class="a-work-dots" title="Run now · Duplicate · Deactivate · Edit">${AK.i("dots")}</span>`] })), total: 2, panel: "a-work-agent", cls: "a-work-tight", pager: false }),
    AK.note("The two agents are invented: WS-X90 holds no AI drafts."),
  );
  ["after-ai-drafts", "after-ai-drafts-agents"].forEach((r) => { ROUTE_NAV[r] = "before-after"; });
  const byline = (when, c = "") => `<div class="a-work-by">${AK.i("sparkle")}<span>Drafted ${esc(when)} · can make mistakes</span><span class="a-work-help">Helpful?<span class="a-work-ib" role="button" tabindex="0" aria-label="Helpful" title="Helpful" data-aw-toast="Thanks: the agent keeps drafting this way">${thumbUp}</span><span class="a-work-ib" role="button" tabindex="0" aria-label="Not helpful" title="Not helpful" data-aw-toast="Thanks: say what was wrong when you reject it">${thumbDown}</span></span>${c}</div>`;
  P["a-work-run"] = (id) => {
    const b = BATCHES.find((x) => x.id === id) || BATCHES[0];
    const first = b.id === "b1", c = (n) => (first ? co(n) : "");
    const t = tally(b);
    let rejectCo = c(4), byCo = c(5);
    const head = AK.recordHead({ title: b.t });
    const appr = t.wait ? AK.banner({ tone: "warn", text: `<b>Approval required</b> · ${t.wait} of ${b.items.length} drafts wait on you`, co: c(3) }) : AK.banner({ tone: "ok", text: `Reviewed · ${t.ok} approved, ${t.no} rejected` });
    const kv = dl([["Agent", esc(b.agent)], ["Drafts", `<span class="num">${b.items.length} · ${t.ok} approved · ${t.no} rejected · ${t.wait} waiting</span>`], ["Drafted", esc(b.when)]]);
    const cards = b.items.map(([ctl, txt, src], i) => {
      const s = DS[`${b.id}-${i}`];
      let acts;
      if (s) acts = btn("Undo", `data-aw-toast="${esc(`Undone: ${ctl} waits on you again`)}"`);
      else { acts = `${btn("Reject", `data-modal="a-work-reject" data-id="${esc(`${b.id}|${i}`)}"`)}${rejectCo}${btn("Approve", `data-aw-toast="${esc(`${ctl} approved: it becomes an SSP 3 edit under your name`)}"`, true)}`; rejectCo = ""; }
      const card = `<div class="a-work-draft"><div class="hd"><b class="num">${esc(ctl)}</b>${s === "approved" ? pill("ok", "Approved") : s === "rejected" ? pill("bad", "Rejected") : pill("warn", "Waiting")}<span class="push">${acts}</span></div><div class="bd">${b.kind === "Narrative" ? `<span class="was">${esc(TEMPLATE.replace("{c}", ctl))}</span>` : ""}<span class="now">${esc(txt)}</span><span class="src">Sources: ${esc(src)}</span>${byline(b.when, byCo)}</div></div>`;
      byCo = "";
      return card;
    }).join("");
    const stick = t.wait ? `<div class="a-work-stick">${btn(`Reject ${t.wait} waiting`, `data-modal="a-work-reject" data-id="${b.id}|all"`)}${btn(`Approve ${t.wait} waiting`, `data-aw-toast="${esc(`${t.wait} drafts approved: each becomes an SSP 3 edit under your name`)}"`, true)}</div>` : "";
    return { label: "Run preview", body: `<div class="a-work-pan">${head}${appr}${kv}${cards}${AK.note("The run and its drafts are invented; each draft quotes WS-X90's requirements, evidence and parameters.")}${stick}</div>` };
  };
  P["a-work-agent"] = (id) => {
    const a = AGENTS.find((x) => x.id === id) || AGENTS[0];
    const head = AK.recordHead({ title: a.name, chip: pill("ok", "Active"), actions: `${btn("Edit", 'data-aw-toast="The agent form opens here"')}${btn("Run now", `data-aw-toast="${esc(`${a.name} runs now: its drafts will wait on you`)}"`, true)}` });
    return { label: "Agent preview", body: `<div class="a-work-pan">${head}${dl([["Trigger", tag("Manual")], ["Runs", `<span class="num">${a.runs}</span>`], ["Approves", "A person, draft by draft"]])}${AK.section("What it does", `<p class="a-work-p">${esc(a.does)} ${EX}</p>`)}${AK.section("More", `<div class="a-work-lines"><div>${AK.i("plus")}Duplicate</div><div>${AK.i("ban")}Deactivate</div></div>`)}</div>` };
  };
  M["a-work-reject"] = (id) => {
    const [bid, i = "1"] = String(id || "b1|1").split("|");
    const b = BATCHES.find((x) => x.id === bid) || BATCHES[0];
    const all = i === "all";
    const what = all ? `${tally(b).wait} waiting drafts` : (b.items[+i] || b.items[0])[0];
    return { title: all ? "Reject waiting drafts" : "Reject draft", body: `<p class="ak-desc">${esc(what)} · ${esc(b.t)}</p>
      ${field("What was wrong", `<div class="ak-input tall">Say what the draft got wrong, such as a requirement it should not cite.</div>`, OPT)}
      <span class="a-work-chk" role="checkbox" tabindex="0" aria-checked="true" data-aw-opt>${AK.check(true)}<span><b>Remember for the next run</b><small>The agent avoids it next time.</small></span></span>`, footer: foot("Reject") };
  };
})();
