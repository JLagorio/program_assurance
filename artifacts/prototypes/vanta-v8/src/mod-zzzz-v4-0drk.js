// Drata kit (drk-): the parts the Drata round's after screens are built from. window.PA.drk (usually D). Loads after the V3 kit.
// Every function returns an HTML string unless it says otherwise. The names and arguments are fixed (COMMON.md); the optional
// arguments marked [+] were added by lane K and are safe to leave out.
//
//   Callbacks. Anywhere an argument is an action (act, clear, all, prev, next, backAct, nextAct, approve, decline, save, …) it may be
//   a function (called with its arg), the name of a K.on action (K.a(name, arg)), or { go: route } / "#route" to follow a link.
//
//   Routes
//   route(name, draw, { nav })            an exact route; draw(name) → HTML (usually K.page(…))
//   routeLike(prefix, draw, { nav })      a record route <prefix>--<id>; draw(id) → HTML (id decoded)
//                                         Either, opened with V3 off, switches V3 on with WS-X90 and then draws. nav is the program
//                                         menu key to highlight ("controls", "evidence", "findings", …; a key V3 folded, such as
//                                         "sources" or "checks", lights the entry it was folded into).
//   review({ title, current, back })      the one neutral line above an after page: "After · title", See current, Back to the Drata tab
//
//   Identity and header
//   idChip(code, tone, { title, go, act, arg })   monospace code in a round pill, tinted by tone: ok | bad | warn | none | inh
//   tone(status)                          a status word or key → ok | bad | warn | none | inh
//   head({ crumbs, id: { code, tone }, title, facts: [[label, html, editAct]], actions: { more, secondary, primary }, tabs, review })
//                                         more = [{ label, go|act, arg, danger }] (the ⋯ menu); secondary/primary = HTML, or
//                                         { label, go|act, arg, icon, disabled }. [+] review = D.review(…) output, drawn above the trail
//   tabs([{ label, count, problem, route, act, arg, on }])     line tabs; problem: a pale red count; count: grey; 0 shows nothing
//
//   Status and counts
//   stages({ done, total, unit, tip: [[label, n, of]], cards, uncounted })
//       cards = [{ title, state, tone, legend: [{ label, n, tone, go, act, arg }], empty: { line, label, go, act, arg } }]
//       uncounted = { n, label, go }
//   stats([{ label, n, problem, go, act, arg }])               up to four plain tiles
//   numbers([{ label, metric, n, tone, since, links: [{ label, go, act, arg }] }])    Track / Fix / Manage
//   worth([{ label, n, go, act, arg }], { title })              "46 objectives · 12 controls · 3 components", each a link
//
//   Registers
//   facets({ id, groups: [{ key, label, type: "radio"|"check", options: [[value, label, count]], value }], act, [+] clear })
//       act(key, value): value is the chosen value for a radio group, the array of ticked values for a check group.
//       [+] clear: an action for "Clear all" (shown while anything is applied); without it each group resets through act(key, "" | []).
//   withFacets(id, panel, body)           the panel beside the body; closed by default below 1180px; state kept per id (K.set)
//   facetToggle(id)                       the toolbar's Filter button (put it in K.toolbar's right); opens and closes the panel
//   selbar({ n, total, all, clear, verbs: [{ label, act, arg, danger }], [+] inline, [+] noun })
//       floating at the foot of the viewport. [+] inline: true draws it in place (a demo, a dialog). [+] noun: "controls" etc.
//
//   Records
//   drawer({ pos, total, prev, next, status, title, open, facts, body, [+] kind, [+] id, [+] code, [+] tone, [+] actions })
//       The content of a preview you can walk. How it sits in V3's panel (#panel): register the preview with
//       D.panel(kind, fn) [+], where fn(id) returns this spec; the panel's own bar is then replaced by the drawer's header row
//       ("2 of 10", Previous ↑, Next ↓, ✕), and ↑/↓ keys walk too. open is the record's route (its Open button).
//       Walking: D.walkable(kind, ids) [+] gives the order of the list the drawer walks (call it while drawing the list, with
//       the ids in the order shown). With kind and id known, pos, total, prev and next are worked out; pass them to override.
//       Without D.walkable (or opened on another page than the one that called it), the drawer still walks: the rows of the
//       list it was opened from, in their drawn order (the [data-panel=kind] rows and eyes of the opener's table or list).
//   panel(kind, fn) [+]                   registers PA.P[kind] so data-panel="kind" data-id="…" opens the drawer for that id
//   walkable(kind, ids) [+]               the walk order for kind; returns ids
//   walkOf(kind, id) [+]                  the ids the drawer of kind walks from id (the lane's list, else the drawn list), or null
//   baseRoute() [+]                       the current route without a dock suffix
//   openPanel(kind, id) [+]               opens the preview of one record (as clicking its eye would)
//   dock({ id, items: [{ key, icon, label, count, pane }], [+] body })
//       a 40px rail of icon buttons at the page's right edge. Choosing an item docks its pane (pane() → HTML) at 380px and the
//       page narrows; no overlay. Open pane kept in K.set("dr.k.dock.<id>"), and, for a page dock (no body), in the address as
//       a trailing --dock-<key> (history.replaceState: no history entry; loading the address opens that pane, closing it
//       takes the suffix off; the key is letters, digits and hyphens). Lanes change nothing. Without body the rail sits at the right edge of
//       the page (.main); with body [+] it lays body, pane and rail out as one row (a demo, a section). At 390px it becomes
//       a row of icons at the foot and the pane opens under it. icon: an AK icon name (chat, history, link, task, …).
//   card({ id, title, facts: [[label, html]], fields: [{ key, label, value, type, options }], save, [+] note })
//       Edit swaps facts for inputs (type text | textarea | select | date | number; options [[v, l]] or [v]); Save calls
//       save(values) and the card redraws; Cancel drops the edit.
//   sunken(html)                          a record or overview body in the grey well; put white cards in it (D.box [+])
//   box(title, html, { actions }) [+]     one white raised card for the well
//
//   Flows
//   steps({ back, title, steps: [label], at, body, foot: { backAct, nextAct, nextLabel, nextDisabled, [+] backLabel } })
//       back = route or { label, go }. at is the current step's index (0-based).
//   moving({ title, rows: [{ label, n, locked }], moving, notMoving, consequence })
//   sheet({ cols, rows: [{ cells, err: { [col]: message }, warn: { [col]: message } }], filter, [+] id })
//       cols = ["Label", …] or [{ key, label }]; err/warn keyed by a column's key, label or index. filter: "all" | "valid" |
//       "invalid" (the first view); the segmented control switches it, kept per id.
//   openCompare({ title, rows: [{ field, current, template }], confirm(selections) })    returns nothing
//       each changed field is one switch, Keep current | Use template (Keep current by default), with Use template for all at
//       the top. selections = { [field]: "current" | "template" }
//
//   AI (marked as the prototype marks AI: the sparkle and "AI" in the brand tint)
//   suggest({ confidence, title, rationale, source, actions: [{ label, act, arg, go, primary }] })   confidence: high | medium | low
//   proposal({ change, reasoning, approve, decline, [+] who, [+] primary })   Approve is filled only with primary: true (one primary a page);
//                                         without it Approve is a secondary and Decline a quiet text button
//
//   The gallery
//   COMPONENTS = [{ id, name, rec: [n], what, ledger, where }]      demo(id) → a live demo that stands alone in ~560px
//   Route dr-components.
(function () {
  const PA = window.PA; if (!PA || !PA.v3 || !PA.v3k || !PA.v2) return;
  const V3 = PA.v3, V2 = PA.v2, K = PA.v3k, S = PA.S, h = PA.h, esc = h.esc;
  const D = {};
  const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : esc(String(n == null ? "" : n)));
  const arr = (x) => (Array.isArray(x) ? x : x == null || x === "" ? [] : [x]);
  const st = (k, d) => K.get("dr.k." + k, d);
  const put = (k, v) => K.set("dr.k." + k, v);

  // ——— Callbacks: a function, a K action name, or a route ———
  const REG = new Map(); let seq = 0;
  const reg = (fn) => { const k = "f" + (++seq).toString(36); REG.set(k, fn); if (REG.size > 6000) REG.delete(REG.keys().next().value); return k; };
  K.on("drk.fn", (a, el, e) => { const f = REG.get(a && a.f); if (f) f(a.v, el, e); else K.toast("Nothing to do here in the prototype."); });
  const cb = (x, v) => {
    if (!x) return "";
    if (typeof x === "function") return K.a("drk.fn", { f: reg(x), v: v === undefined ? null : v });
    if (typeof x === "string") return x.charAt(0) === "#" ? ` data-go="${esc(x.slice(1))}"` : K.a(x, v);
    if (x.go) return ` data-go="${esc(x.go)}"`;
    if (x.act) return cb(x.act, x.arg);
    return "";
  };
  const hit = (o) => (!o ? "" : o.go ? ` data-go="${esc(o.go)}"` : o.act ? cb(o.act, o.arg) : o.panel ? ` data-panel="${esc(o.panel)}" data-id="${esc(o.id == null ? "" : o.id)}"` : "");
  const live = (o) => !!(o && (o.go || o.act || o.panel));
  const call = (x, v) => { if (typeof x === "function") return x(v); if (typeof x === "string") { if (x.charAt(0) === "#") K.go(x.slice(1)); } else if (x && x.go) K.go(x.go); else if (x && x.act) call(x.act, x.arg); };
  D.cb = cb; D.hit = hit;

  // ——— Glyphs (16px grid, the AK icon style) ———
  const G = {
    ok: "M3.5 8.2l3 3 6-6.4", bad: "M8 2.8a5.2 5.2 0 1 0 0 10.4A5.2 5.2 0 1 0 8 2.8zM4.4 11.6l7.2-7.2", warn: "M8 2.8a5.2 5.2 0 1 0 0 10.4A5.2 5.2 0 1 0 8 2.8zM8 5.4V8l1.8 1.3", none: "M5 8h6", inh: "M5.5 4.5L9 8l-3.5 3.5M9.5 4.5L13 8l-3.5 3.5",
    filter: "M2.5 3.5h11l-4.2 5v4l-2.6 1.2V8.5z", up: "M8 12.5v-9M4 7.5l4-4 4 4", down: "M8 3.5v9M4 8.5l4 4 4-4", x: "M4 4l8 8M12 4l-8 8",
    pen: "M10.5 3l2.5 2.5L6 12.5H3.5V10z", chev: "M6 4l4 4-4 4", tri: "M8 2.5l6 10.5H2z", more: "M3.5 8h.1M8 8h.1M12.5 8h.1",
  };
  const g = (k, cls) => `<svg class="drk-g${cls ? " " + cls : ""}" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="${k === "more" ? 2.6 : 1.6}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${G[k] || G.none}"/></svg>`;
  const ico = (k) => (G[k] ? g(k) : K.i(k));
  D.glyph = g;

  // ——— Routes ———
  const NAVKEY = (nav) => { if (!nav) return nav; const m = V3.MERGED && V3.MERGED[nav]; return m ? String(m).split("-")[0] : nav; };
  let switching = false;
  const switchOn = () => {
    if (switching) return; switching = true;
    setTimeout(() => { switching = false; if (PA.v2hubs && PA.v2hubs.cur() !== V3.WSX) PA.v2hubs.setCur(V3.WSX); if (!V3.on()) V3.set(true); else V3.refresh(); }, 0);
  };
  const holding = () => `<div class="main k3 drk-hold"><p class="k3-muted">Opening the after screen with V3 on…</p></div>`;
  const wrapDraw = (draw, arg, label) => {
    const fn = function () {
      if (!V3.on() || (PA.v2hubs && PA.v2hubs.cur() !== V3.WSX)) { switchOn(); return holding(); }
      try { return draw(arg); } catch (e) { console.error(e); return `<div class="main k3"><div class="k3-note warn">${esc(label)} could not draw: ${esc(e.message)}</div></div>`; }
    };
    fn.__v3only = true; fn.__v2c = true; fn.__v3 = 1;
    return fn;
  };
  const ROUTES = [];
  D.route = (name, draw, o = {}) => { S[name] = wrapDraw(draw, name, name); if (o.nav) PA.ROUTE_NAV[name] = NAVKEY(o.nav); ROUTES.push(name); takeDock(); return name; };
  const LIKE = [];
  const likeOf = (r) => { for (const L of LIKE) if (r.indexOf(L.prefix + "--") === 0) return L; return null; };
  const ensure = (r) => {
    if (!r || S[r]) return; const L = likeOf(r); if (!L) return;
    let id = r.slice(L.prefix.length + 2); try { id = decodeURIComponent(id); } catch (e) { /* as typed */ }
    S[r] = wrapDraw(L.draw, id, r); if (L.nav) PA.ROUTE_NAV[r] = NAVKEY(L.nav);
  };
  D.routeLike = (prefix, draw, o = {}) => { LIKE.push({ prefix, draw, nav: o.nav }); takeDock(); ensure((location.hash || "").slice(1)); return prefix; };

  // ——— The dock in the address. A page dock's open pane rides in the hash as a trailing --dock-<pane> (a Drata route, the pane's
  // key in letters, digits and hyphens). The suffix is taken off before anything draws (this listener runs before the router; at
  // load, as each Drata route registers), so pages, K.page and K.toolbar only ever see the route itself; the pane it named opens
  // when the page's D.dock draws; after every draw the address is written again with history.replaceState (no history entry):
  // the suffix while a pane is open, none once it closes. While the suffix is in the address, S[<route>--dock-<pane>] draws the
  // route under its own address, so a redraw (K.redraw reads the address) finds it. Docks drawn with body (demos) stay out. ———
  const DOCKRE = /^(.+?)--dock-([A-Za-z0-9][A-Za-z0-9-]*)$/, PANEKEY = /^[A-Za-z0-9][A-Za-z0-9-]*$/;
  const hashNow = () => (location.hash || "").slice(1);
  const isDr = (r) => !!r && (ROUTES.indexOf(r) >= 0 || !!likeOf(r));
  const baseOf = (r) => { const m = DOCKRE.exec(r || ""); return m && isDr(m[1]) ? m[1] : r || ""; };
  const swapHash = (r) => { try { history.replaceState(history.state, "", "#" + r); } catch (e) { /* the address stays */ } };
  let WANT = null, syncT = 0;
  const queueSync = () => { clearTimeout(syncT); syncT = setTimeout(syncDock, 0); };
  function takeDock() {
    const m = DOCKRE.exec(hashNow()); if (!m || !isDr(m[1])) return;
    WANT = { base: m[1], pane: m[2] }; swapHash(m[1]); queueSync();
  }
  const dockAlias = (base, full) => {
    if (S[full] && S[full].__drkDock === base) return;
    ensure(base);
    const g = function () { const was = hashNow(); swapHash(base); try { const f = S[base]; return typeof f === "function" ? f.apply(this, arguments) : ""; } finally { if (hashNow() === base) swapHash(was); } };
    g.__v3only = true; g.__v2c = true; g.__v3 = 1; g.__drkDock = base;
    S[full] = g; if (PA.ROUTE_NAV[base]) PA.ROUTE_NAV[full] = PA.ROUTE_NAV[base];
  };
  function syncDock() {
    const main = document.getElementById("main");
    if (main && main.querySelector(".drk-hold")) return; // V3 is still switching on: the pane asked for opens on the next draw
    WANT = null;
    const r = hashNow(), base = baseOf(r); if (!isDr(base)) return;
    const on = main && main.querySelector(".drk-dock .drk-dk-i.on[data-drk-dk]"), key = on ? on.getAttribute("data-drk-dk") : "";
    const want = key && PANEKEY.test(key) ? `${base}--dock-${key}` : base;
    if (want === r) return;
    if (want !== base) dockAlias(base, want);
    swapHash(want);
  }
  // Registered before PA.start adds the router, so this runs first on every hash change (and V3.refresh's synthetic one).
  window.addEventListener("hashchange", () => { takeDock(); ensure(hashNow()); });
  D.routes = () => ROUTES.slice();
  D.baseRoute = () => baseOf(hashNow());

  D.review = ({ title, current, back } = {}) => `<div class="drk-review" role="note"><span class="drk-rv-t"><span class="drk-rv-k">After</span><span class="drk-rv-s" aria-hidden="true">·</span>${esc(title || "")}</span><span class="drk-rv-a">${current ? `<a class="k3-link" href="#${esc(current)}">See current</a>` : ""}<a class="k3-link" href="#${esc(back || "before-after-drata")}">Back to the Drata tab</a></span></div>`;

  // ——— Identity ———
  const TONES = { ok: 1, bad: 1, warn: 1, none: 1, inh: 1 };
  const T = (t) => (TONES[t] ? t : "none");
  D.tone = (s) => {
    const w = String(s == null ? "" : s).toLowerCase().replace(/[_-]+/g, " ").trim();
    if (!w) return "none";
    if (TONES[w]) return w;
    const SK = { satisfied: "ok", partially_satisfied: "warn", other_than_satisfied: "bad", not_assessed: "warn", no_evidence: "none", no_requirement: "none", inherited: "inh", part: "warn", info: "inh" }, key = w.replace(/\s+/g, "_");
    if (SK[key]) return SK[key];
    if (/inherit|provided by|common/.test(w)) return "inh";
    if (/other than|not satisfied|fail|error|invalid|overdue|expired|blocked|open finding|critical|high|missing|rejected|declined|bad|problem/.test(w)) return "bad";
    if (/not assessed|partial|at risk|warn|attention|expiring|due|in progress|pending|review|draft|medium|planned|to do|stale/.test(w)) return "warn";
    if (/satisf|pass|ok|ready|met|compliant|complete|done|valid|current|published|approved|accepted|closed|healthy|connected/.test(w)) return "ok";
    return "none";
  };
  const TONE_WORD = { ok: "Satisfied", bad: "Problem", warn: "Needs attention", none: "No status", inh: "Inherited" };
  D.idChip = (code, tone, o = {}) => {
    const t = T(tone), tag = live(o) ? "button" : "span";
    return `<${tag}${tag === "button" ? ' type="button"' : ""} class="drk-id drk-t-${t}"${hit(o)} title="${esc(o.title || `${code} · ${TONE_WORD[t]}`)}">${g(t, "drk-id-g")}<span class="drk-id-c">${esc(code)}</span></${tag}>`;
  };
  const btnOf = (x, o = {}) => {
    if (!x) return "";
    if (typeof x === "string") return x;
    return K.btn(x.label, Object.assign({ primary: !!o.primary, sm: o.sm, icon: x.icon, disabled: x.disabled, danger: x.danger }, x.go ? { go: x.go } : {}, x.act && typeof x.act === "string" ? { act: x.act, arg: x.arg } : {})).replace(/^<button /, x.act && typeof x.act === "function" ? `<button ${cb(x.act, x.arg)} ` : "<button ");
  };
  D.btn = btnOf;
  D.head = ({ crumbs, id, title, facts, actions, tabs, review } = {}) => {
    const a = actions || {};
    const more = Array.isArray(a.more) && a.more.length ? K.menu("⋯", a.more.map((it) => ({ label: it.label, go: it.go, danger: it.danger, act: typeof it.act === "function" ? "drk.fn" : it.act, arg: typeof it.act === "function" ? { f: reg(it.act), v: it.arg === undefined ? null : it.arg } : it.arg })), { quiet: true, bare: true, aria: "More actions" }).replace("<summary class=\"btn", "<summary class=\"btn drk-more") : typeof a.more === "string" ? a.more : "";
    const acts = `${more}${btnOf(a.secondary)}${btnOf(a.primary, { primary: true })}`;
    const factRow = arr(facts).filter(Boolean).length ? `<dl class="drk-facts">${arr(facts).filter(Boolean).map(([l, v, ed]) => `<div class="drk-fact"><dt>${esc(l)}</dt><dd>${v == null || v === "" ? '<span class="k3-none">—</span>' : v}${ed ? `<button type="button" class="drk-pen"${cb(ed)} aria-label="Edit ${esc(l)}">${g("pen")}</button>` : ""}</dd></div>`).join("")}</dl>` : "";
    return `<header class="drk-head">${review || ""}${crumbs && crumbs.length ? K.crumbs(crumbs) : ""}<div class="drk-head-r"><div class="drk-head-t">${id && id.code ? D.idChip(id.code, id.tone) : ""}<h1 class="drk-title" title="${esc(title || "")}">${esc(title || "")}</h1></div>${acts ? `<div class="drk-head-a">${acts}</div>` : ""}</div>${factRow}</header>${tabs || ""}`;
  };
  D.tabs = (list, label) => `<nav class="drk-tabs" aria-label="${esc(label || "Sections")}">${arr(list).filter(Boolean).map((t) => {
    const n = t.problem ? `<span class="drk-tc bad num">${fmt(t.problem)}</span>` : t.count ? `<span class="drk-tc num">${fmt(t.count)}</span>` : "";
    const inner = `${esc(t.label)}${n}`;
    return t.route && !t.act ? `<a href="#${esc(t.route)}" class="drk-tab${t.on ? " on" : ""}"${t.on ? ' aria-current="page"' : ""}>${inner}</a>` : `<button type="button" class="drk-tab${t.on ? " on" : ""}"${t.on ? ' aria-current="page"' : ""}${cb(t.act, t.arg)}>${inner}</button>`;
  }).join("")}</nav>`;

  // ——— Status and counts ———
  const pctOf = (a, b) => (b ? Math.max(0, Math.min(100, Math.round((a / b) * 100))) : 0);
  const linkOr = (o, inner, cls) => (live(o) ? `<button type="button" class="${cls} drk-lk"${hit(o)}>${inner}</button>` : `<span class="${cls}">${inner}</span>`);
  D.stages = ({ done = 0, total = 0, unit = "", tip, cards, uncounted } = {}) => {
    const tipH = arr(tip).length ? `<span class="drk-tip" role="tooltip">${arr(tip).map(([l, n, of]) => `<span class="drk-tip-r"><span>${esc(l)}</span><span class="num">${fmt(n)}${of == null ? "" : ` of ${fmt(of)}`}</span></span>`).join("")}</span>` : "";
    const bar = `<div class="drk-stg-bar" tabindex="0"><span class="drk-stg-n"><b class="num">${fmt(done)}</b> of <span class="num">${fmt(total)}</span>${unit ? " " + esc(unit) : ""}</span><span class="drk-stg-track" role="img" aria-label="${pctOf(done, total)}%"><i style="width:${pctOf(done, total)}%"></i></span>${tipH}</div>`;
    const card = (c) => {
      const t = T(c.tone);
      const legend = arr(c.legend).filter((x) => x && x.n);
      const body = legend.length ? `<ul class="drk-lg">${legend.map((x) => `<li>${linkOr(x, `<i class="drk-sw drk-t-${T(x.tone)}" aria-hidden="true"></i><span class="drk-lg-l">${esc(x.label)}</span><span class="drk-lg-n num">${fmt(x.n)}</span>`, "drk-lg-r")}</li>`).join("")}</ul>`
        : c.empty ? `<div class="drk-stg-e"><span>${esc(c.empty.line || "")}</span>${c.empty.label ? `<button type="button" class="btn sm drk-ol"${hit(c.empty)}>${esc(c.empty.label)}</button>` : ""}</div>` : "";
      return `<section class="drk-stg-c"><h3 class="drk-stg-h">${esc(c.title)}</h3><p class="drk-stg-s drk-t-${t}">${g(t)}<span>${esc(c.state || "")}</span></p>${body}</section>`;
    };
    const unc = uncounted && uncounted.n ? `<p class="drk-unc">${live(uncounted) ? `<button type="button" class="k3-link"${hit(uncounted)}>${fmt(uncounted.n)} ${esc(uncounted.label || "not counted")}</button>` : `${fmt(uncounted.n)} ${esc(uncounted.label || "not counted")}`}</p>` : "";
    return `<div class="drk-stg">${bar}<div class="drk-stg-cs">${arr(cards).map(card).join("")}</div>${unc}</div>`;
  };
  D.stats = (list) => `<div class="drk-stats">${arr(list).slice(0, 4).map((x) => linkOr(x, `<span class="drk-st-l">${esc(x.label)}</span><span class="drk-st-n num">${x.problem ? g("tri", "drk-st-w") : ""}${fmt(x.n)}</span>`, "drk-st" + (x.problem ? " problem" : ""))).join("")}</div>`;
  D.numbers = (list) => `<div class="drk-nums">${arr(list).map((x) => `<section class="drk-num"><h3 class="drk-num-l">${esc(x.label)}</h3><p class="drk-num-m">${esc(x.metric || "")}</p><p class="drk-num-n num drk-tn-${T(x.tone)}">${fmt(x.n)}</p>${x.since ? `<p class="drk-num-s">${esc(x.since)}</p>` : ""}${arr(x.links).length ? `<div class="drk-num-a">${arr(x.links).map((l) => `<button type="button" class="k3-link"${hit(l)}>${esc(l.label)}</button>`).join("")}</div>` : ""}</section>`).join("")}</div>`;
  D.worth = (list, o = {}) => { const xs = arr(list).filter((x) => x && x.n); return `<div class="drk-worth">${o.title ? `<span class="drk-worth-t">${esc(o.title)}</span>` : ""}${xs.length ? xs.map((x) => (live(x) ? `<button type="button" class="drk-worth-i"${hit(x)}><b class="num">${fmt(x.n)}</b> ${esc(x.label)}</button>` : `<span class="drk-worth-i"><b class="num">${fmt(x.n)}</b> ${esc(x.label)}</span>`)).join('<span class="drk-worth-s" aria-hidden="true">·</span>') : '<span class="k3-none">Feeds nothing yet</span>'}</div>`; };

  // ——— Registers ———
  const FACETS = {};
  const applied = (gr) => (gr.type === "check" ? arr(gr.value).length : gr.value != null && gr.value !== "" ? 1 : 0);
  D.facets = ({ id, groups, act, clear } = {}) => {
    FACETS[id] = { act, groups: arr(groups), clear };
    const total = arr(groups).reduce((s, gr) => s + applied(gr), 0);
    const grp = (gr) => {
      const n = applied(gr), closed = st(`facetg.${id}.${gr.key}`, false);
      const opts = arr(gr.options).map(([v, l, c]) => {
        const on = gr.type === "check" ? arr(gr.value).map(String).includes(String(v)) : String(gr.value == null ? "" : gr.value) === String(v);
        return `<label class="drk-fo${on ? " on" : ""}"><input type="${gr.type === "check" ? "checkbox" : "radio"}" name="drkf-${esc(id)}-${esc(gr.key)}" value="${esc(v)}"${on ? " checked" : ""} data-drk-facet="${esc(id)}" data-drk-key="${esc(gr.key)}"><span class="drk-fo-l">${esc(l)}</span>${c == null ? "" : `<span class="drk-fo-n num">${fmt(c)}</span>`}</label>`;
      }).join("");
      return `<section class="drk-fg${closed ? " closed" : ""}"><button type="button" class="drk-fg-h" aria-expanded="${closed ? "false" : "true"}"${K.a("drk.fg", { id, key: gr.key })}><span>${esc(gr.label)}</span>${n ? `<span class="drk-fg-n num">${n}</span>` : ""}<span class="drk-fg-c" aria-hidden="true">${g("chev")}</span></button><div class="drk-fg-b"${closed ? " hidden" : ""}>${opts}</div></section>`;
    };
    return `<aside class="drk-facets" aria-label="Filters" data-drk-facets="${esc(id)}"><div class="drk-fc-h"><span>Filters</span>${total ? `<button type="button" class="k3-link"${K.a("drk.fclear", id)}>Clear all</button>` : ""}<button type="button" class="drk-fc-x" aria-label="Close filters"${K.a("drk.ftoggle", id)}>${g("x")}</button></div>${arr(groups).map(grp).join("")}</aside>`;
  };
  K.on("drk.fg", (a) => { const k = `facetg.${a.id}.${a.key}`; put(k, !st(k, false)); K.redraw(); });
  K.on("drk.fclear", (id) => { const F = FACETS[id]; if (!F) return; if (F.clear) { call(F.clear); return; } F.groups.forEach((gr) => { if (applied(gr) && typeof F.act === "function") F.act(gr.key, gr.type === "check" ? [] : ""); }); });
  const facetOpen = (id) => st(`facet.${id}`, null) ?? (window.innerWidth >= 1180);
  K.on("drk.ftoggle", (id) => {
    const open = !facetOpen(id); put(`facet.${id}`, open);
    document.querySelectorAll(`[data-drk-wf="${CSS.escape(id)}"]`).forEach((el) => el.classList.toggle("open", open));
    document.querySelectorAll(`[data-drk-ftog="${CSS.escape(id)}"]`).forEach((el) => el.setAttribute("aria-pressed", String(open)));
  });
  D.withFacets = (id, panel, body) => `<div class="drk-wf${facetOpen(id) ? " open" : ""}" data-drk-wf="${esc(id)}"><div class="drk-wf-p">${panel || ""}</div><div class="drk-wf-b">${arr(body).join("")}</div></div>`;
  D.facetToggle = (id) => {
    const F = FACETS[id], n = F ? F.groups.reduce((s, gr) => s + applied(gr), 0) : 0;
    return `<button type="button" class="btn drk-ftog" aria-pressed="${facetOpen(id) ? "true" : "false"}" data-drk-ftog="${esc(id)}"${K.a("drk.ftoggle", id)}>${g("filter")}Filter${n ? `<span class="drk-ftog-n num">${n}</span>` : ""}</button>`;
  };
  D.selbar = ({ n = 0, total, all, clear, verbs, inline, noun } = {}) => {
    if (!n) return "";
    return `<div class="drk-sel${inline ? " inline" : ""}" role="region" aria-label="Selection"><span class="drk-sel-n"><b class="num">${fmt(n)}</b> selected${noun ? " " + esc(noun) : ""}</span>${all && total && total > n ? `<span class="drk-sel-s" aria-hidden="true">·</span><button type="button" class="drk-sel-b"${cb(all)}>Select all <span class="num">${fmt(total)}</span></button>` : ""}<span class="drk-sel-v">${arr(verbs).map((v) => `<button type="button" class="drk-sel-b${v.danger ? " danger" : ""}"${cb(v.act, v.arg)}>${esc(v.label)}</button>`).join("")}</span>${clear ? `<button type="button" class="drk-sel-b drk-sel-c"${cb(clear)}>Clear</button>` : ""}</div>`;
  };

  // ——— Records ———
  // Walking. A lane's D.walkable list wins on the page that drew it. Without one (or on another page), the drawer walks the rows
  // of the list it was opened from, in their drawn order: the [data-panel=kind] rows and eyes in the opener's table or list
  // (else the first one on the page that holds the id), once each, hidden rows left out.
  const WALK = {}, WALKAT = {}, OPENER = {};
  D.walkable = (kind, ids) => { WALK[kind] = arr(ids).map(String); WALKAT[kind] = baseOf(hashNow()); return ids; };
  const noteOpener = (t) => { const el = t && t.closest && t.closest("[data-panel]"); if (el && el.getAttribute("data-panel") && !el.hidden && el.closest("#main")) OPENER[el.getAttribute("data-panel")] = el; };
  document.addEventListener("click", (e) => noteOpener(e.target), true);
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") noteOpener(e.target); }, true);
  const drawnWalk = (kind, sid) => {
    const main = document.getElementById("main"); if (!main) return null;
    let sel; try { sel = `[data-panel="${CSS.escape(kind)}"]`; } catch (e) { return null; }
    const all = [...main.querySelectorAll(sel)].filter((el) => !el.hidden && !el.closest("[hidden]"));
    let from = OPENER[kind];
    if (!from || !main.contains(from) || from.getAttribute("data-id") !== sid || from.hidden || from.closest("[hidden]")) from = all.find((el) => el.getAttribute("data-id") === sid) || null;
    if (!from) return null;
    const scope = from.closest("tbody, table, ul, ol, [role=list], [role=grid]") || main, ids = [];
    for (const el of all) { if (!scope.contains(el)) continue; const v = el.getAttribute("data-id"); if (v != null && v !== "" && ids.indexOf(v) < 0) ids.push(v); }
    return ids.indexOf(sid) >= 0 ? ids : null;
  };
  const walkOf = (kind, id) => {
    if (!kind || id == null) return null;
    const sid = String(id), w = WALK[kind], has = !!w && w.indexOf(sid) >= 0;
    if (has && WALKAT[kind] === baseOf(hashNow())) return w;
    return drawnWalk(kind, sid) || (has ? w : null);
  };
  D.walkOf = walkOf;
  D.openPanel = (kind, id) => K.openPanel(kind, String(id));
  D.panel = (kind, fn) => {
    PA.P[kind] = (id) => {
      let spec = null; try { spec = fn(id); } catch (e) { console.error(e); spec = null; }
      if (!spec) return { label: "Preview", body: K.empty({ title: "This record is no longer here" }) };
      return { label: spec.label || "Preview", body: D.drawer(Object.assign({ kind, id }, spec)) };
    };
  };
  D.drawer = (o = {}) => {
    let { pos, total, prev, next } = o;
    const w = walkOf(o.kind, o.id);
    if (w && o.id != null) {
      const i = w.indexOf(String(o.id));
      if (i >= 0) {
        if (pos == null) pos = i + 1;
        if (total == null) total = w.length;
        if (prev == null && i > 0) prev = { panelTo: [o.kind, w[i - 1]] };
        if (next == null && i < w.length - 1) next = { panelTo: [o.kind, w[i + 1]] };
      }
    }
    const nav = (x, label, k, key) => {
      const h2 = x && x.panelTo ? K.a("drk.walk", x.panelTo) : cb(x);
      return `<button type="button" class="drk-dw-b" data-drk-key="${key}"${h2 ? h2 : ' aria-disabled="true"'} title="${esc(label)}">${g(k)}<span>${esc(label)}</span></button>`;
    };
    const head = `<div class="drk-dw-h">${pos ? `<span class="drk-dw-pos num">${fmt(pos)} of ${fmt(total || pos)}</span>` : "<span></span>"}<span class="drk-dw-nav">${nav(prev, "Previous", "up", "up")}${nav(next, "Next", "down", "down")}</span><button type="button" class="drk-dw-x" data-drk-close aria-label="Close preview">${g("x")}</button></div>`;
    const status = o.status ? `<div class="drk-dw-st">${o.status}</div>` : "";
    const facts = arr(o.facts).filter(Boolean).length ? `<dl class="drk-dw-f">${arr(o.facts).filter(Boolean).map(([l, v]) => `<div><dt>${esc(l)}</dt><dd>${v == null || v === "" ? '<span class="k3-none">—</span>' : v}</dd></div>`).join("")}</dl>` : "";
    const openB = o.open ? `<a class="btn sm" href="#${esc(o.open)}">Open</a>` : "";
    return `<div class="drk-dw"${o.kind ? ` data-drk-kind="${esc(o.kind)}"` : ""}>${head}<div class="drk-dw-c">${status}<div class="drk-dw-t">${o.code ? D.idChip(o.code, o.tone) : ""}<h4 class="drk-dw-title">${esc(o.title || "")}</h4></div><div class="drk-dw-a">${o.actions || ""}${openB}</div>${facts}${arr(o.body).join("")}</div></div>`;
  };
  K.on("drk.walk", (a) => { if (Array.isArray(a)) D.openPanel(a[0], a[1]); });
  const PANEL = document.getElementById("panel");
  if (PANEL && window.MutationObserver) new MutationObserver(() => { if (PANEL.hidden) return; const x = PANEL.querySelector(".drk-dw .drk-dw-x"); if (x && !PANEL.contains(document.activeElement)) { try { x.focus({ preventScroll: true }); } catch (e) { x.focus(); } } }).observe(PANEL, { childList: true });
  document.addEventListener("click", (e) => {
    const t = e.target; if (!t || !t.closest) return;
    if (t.closest("[data-drk-close]")) { const c = document.getElementById("closePanel"); if (c) c.click(); }
  });
  document.addEventListener("keydown", (e) => {
    if (!V3.on() || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    const p = document.getElementById("panel"); if (!p || p.hidden || !p.querySelector(".drk-dw") || e.target.matches("input, select, textarea, [contenteditable]") || (e.target.closest && e.target.closest("#modal, details[open]"))) return;
    const md = document.getElementById("modal"); if (md && !md.hidden) return;
    const b = p.querySelector(`.drk-dw-b[data-drk-key="${e.key === "ArrowUp" ? "up" : "down"}"]:not([aria-disabled])`);
    if (b) { e.preventDefault(); b.click(); }
  });

  // Dock
  const DOCKS = {};
  D.dock = ({ id, items, body } = {}) => {
    DOCKS[id] = arr(items);
    if (body == null) { // a page dock: the pane the address asks for opens; the address follows the open pane after the draw
      if (WANT && WANT.base === baseOf(hashNow())) { const hit = arr(items).find((x) => String(x.key) === WANT.pane); if (hit) put(`dock.${id}`, hit.key); }
      queueSync();
    }
    const cur = st(`dock.${id}`, null), it = arr(items).find((x) => x.key === cur);
    const rail = `<nav class="drk-dk-rail" aria-label="Side panes">${arr(items).map((x) => `<button type="button" class="drk-dk-i${x.key === cur ? " on" : ""}" aria-pressed="${x.key === cur ? "true" : "false"}" title="${esc(x.label)}"${body == null ? ` data-drk-dk="${esc(x.key)}"` : ""}${K.a("drk.dock", { id, key: x.key })}>${ico(x.icon || "dots")}<span class="k3-sr">${esc(x.label)}</span>${x.count ? `<span class="drk-dk-n num">${fmt(x.count)}</span>` : ""}</button>`).join("")}</nav>`;
    let pane = "";
    if (it) { let ph = ""; try { ph = typeof it.pane === "function" ? it.pane() : it.pane || ""; } catch (e) { console.error(e); ph = ""; } pane = `<section class="drk-dk-pane" aria-label="${esc(it.label)}"><div class="drk-dk-ph"><h3>${esc(it.label)}</h3><button type="button" class="drk-dw-x" aria-label="Close ${esc(it.label)}"${K.a("drk.dock", { id, key: it.key })}>${g("x")}</button></div><div class="drk-dk-pb">${ph}</div></section>`; }
    if (body != null) return `<div class="drk-docked${it ? " open" : ""}"><div class="drk-dk-main">${arr(body).join("")}</div>${pane}${rail}</div>`;
    return `<div class="drk-dock${it ? " open" : ""}">${pane}${rail}</div>`;
  };
  K.on("drk.dock", (a) => { const k = `dock.${a.id}`; put(k, st(k, null) === a.key ? null : a.key); K.redraw(); });

  // Card with its own Edit
  const CARDS = {};
  const fieldH = (cid, f) => {
    const nm = `drkc-${cid}-${f.key}`, v = f.value == null ? "" : f.value;
    let c;
    if (f.type === "textarea") c = `<textarea id="${esc(nm)}" data-drk-cf="${esc(f.key)}" rows="${f.rows || 3}">${esc(v)}</textarea>`;
    else if (f.type === "select") c = `<select id="${esc(nm)}" data-drk-cf="${esc(f.key)}">${arr(f.options).map((o) => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(ov)}"${String(ov) === String(v) ? " selected" : ""}>${esc(ol)}</option>`; }).join("")}</select>`;
    else c = `<input id="${esc(nm)}" data-drk-cf="${esc(f.key)}" type="${f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}" value="${esc(v)}">`;
    return `<div class="drk-cf"><label for="${esc(nm)}">${esc(f.label)}</label>${c}</div>`;
  };
  D.card = ({ id, title, facts, fields, save, note } = {}) => {
    CARDS[id] = { save, fields: arr(fields) };
    const editing = st(`card.${id}`, false) && arr(fields).length;
    const actions = editing ? "" : arr(fields).length ? `<button type="button" class="btn sm k3-quiet drk-edit"${K.a("drk.card.edit", id)}>${g("pen")}Edit</button>` : "";
    const bodyH = editing
      ? `<div class="drk-cfs">${arr(fields).map((f) => fieldH(id, f)).join("")}</div><div class="drk-cfa"><button type="button" class="btn sm"${K.a("drk.card.cancel", id)}>Cancel</button><button type="button" class="btn sm ink"${K.a("drk.card.save", id)}>Save</button></div>`
      : `<dl class="drk-cd-f">${arr(facts).filter(Boolean).map(([l, v]) => `<div><dt>${esc(l)}</dt><dd>${v == null || v === "" ? '<span class="k3-none">—</span>' : v}</dd></div>`).join("")}</dl>${note ? `<p class="drk-cd-note">${note}</p>` : ""}`;
    return `<section class="drk-box drk-card${editing ? " editing" : ""}" data-drk-card="${esc(id)}"><div class="drk-box-h"><h3>${esc(title || "")}</h3>${actions}</div>${bodyH}</section>`;
  };
  K.on("drk.card.edit", (id) => { put(`card.${id}`, true); K.redraw(); setTimeout(() => { const f = document.querySelector(`[data-drk-card="${CSS.escape(id)}"] [data-drk-cf]`); if (f) f.focus(); }, 0); });
  K.on("drk.card.cancel", (id) => { put(`card.${id}`, false); K.redraw(); });
  K.on("drk.card.save", (id, el) => {
    const C = CARDS[id], box = el && el.closest("[data-drk-card]"); const vals = {};
    if (box) box.querySelectorAll("[data-drk-cf]").forEach((f) => { vals[f.getAttribute("data-drk-cf")] = f.value.trim(); });
    put(`card.${id}`, false);
    try { if (C && typeof C.save === "function") C.save(vals); else if (C && C.save) call(C.save, vals); } catch (e) { console.error(e); }
    K.redraw();
  });
  D.sunken = (html) => `<div class="drk-sunken">${arr(html).join("")}</div>`;
  D.box = (title, html, o = {}) => `<section class="drk-box">${title || o.actions ? `<div class="drk-box-h"><h3>${esc(title || "")}</h3>${o.actions || ""}</div>` : ""}${arr(html).join("")}</section>`;

  // ——— Flows ———
  D.steps = ({ back, title, steps, at = 0, body, foot } = {}) => {
    const f = foot || {};
    const b = back ? (typeof back === "string" ? { label: "Back", go: back } : back) : null;
    const stepper = `<ol class="drk-stp">${arr(steps).map((l, i) => `<li class="drk-stp-i ${i < at ? "done" : i === at ? "cur" : "later"}"${i === at ? ' aria-current="step"' : ""}><span class="drk-stp-d" aria-hidden="true">${i < at ? g("ok") : ""}</span><span class="drk-stp-l">${esc(l)}</span></li>`).join("")}</ol>`;
    const footH = `<div class="drk-sf">${f.backAct && at > 0 ? `<button type="button" class="btn"${cb(f.backAct)}>${esc(f.backLabel || "Back")}</button>` : "<span></span>"}<button type="button" class="btn ink"${f.nextDisabled ? ` aria-disabled="true" title="${esc(typeof f.nextDisabled === "string" ? f.nextDisabled : "Complete this step first")}"` : cb(f.nextAct)}>${esc(f.nextLabel || "Continue")}</button></div>`;
    return `<div class="drk-steps">${b ? `<a class="drk-back" href="#${esc(b.go)}">${K.i("back")}<span>${esc(b.label || "Back")}</span></a>` : ""}<h1 class="drk-title">${esc(title || "")}</h1><div class="drk-st-g">${stepper}<div class="drk-st-f"><div class="drk-st-body">${arr(body).join("")}</div>${footH}</div></div></div>`;
  };
  D.moving = ({ title, rows, moving, notMoving, consequence } = {}) => `<section class="drk-mv">${title ? `<h3 class="drk-mv-t">${esc(title)}</h3>` : ""}<table class="drk-mv-tb"><tbody>${arr(rows).map((r) => `<tr class="${r.locked ? "locked" : ""}"><td class="drk-mv-c"><input type="checkbox" checked disabled aria-label="${esc(r.label)}${r.locked ? ", locked" : ""}"></td><td class="drk-mv-l">${esc(r.label)}${r.locked ? '<span class="drk-mv-k">Locked</span>' : ""}</td><td class="drk-mv-n num">${fmt(r.n)}</td></tr>`).join("")}</tbody></table><p class="drk-mv-s"><span>Moving <b class="num">${fmt(moving || 0)}</b></span><span class="drk-mv-dot" aria-hidden="true">·</span><span>Not moving <b class="num">${fmt(notMoving || 0)}</b></span></p>${consequence ? `<p class="drk-mv-q">${esc(consequence)}</p>` : ""}</section>`;
  const colKey = (c, i) => (typeof c === "string" ? c : c.key || c.label || String(i));
  const colLabel = (c) => (typeof c === "string" ? c : c.label || c.key);
  const msgFor = (m, c, i) => (!m ? null : m[colKey(c, i)] || m[colLabel(c)] || m[i] || null);
  D.sheet = ({ cols, rows, filter, id } = {}) => {
    const sid = id || "sheet", cur = st(`sheet.${sid}`, null) || filter || "all";
    const bad = (r) => r.err && Object.keys(r.err).length;
    const nAll = arr(rows).length, nBad = arr(rows).filter(bad).length, nOk = nAll - nBad;
    const shown = arr(rows).filter((r) => (cur === "valid" ? !bad(r) : cur === "invalid" ? bad(r) : true));
    const seg = `<span class="drk-seg" role="group" aria-label="Show rows">${[["all", "All", nAll], ["valid", "Valid", nOk], ["invalid", "Invalid", nBad]].map(([k, l, n]) => `<button type="button" class="${cur === k ? "on" : ""}" aria-pressed="${cur === k ? "true" : "false"}"${K.a("drk.sheet", { id: sid, f: k })}>${l} <span class="num">${fmt(n)}</span></button>`).join("")}</span>`;
    const head = `<tr><th class="drk-sh-i">#</th>${arr(cols).map((c) => `<th>${esc(colLabel(c))}</th>`).join("")}</tr>`;
    const body = shown.length ? shown.map((r) => { const ri = arr(rows).indexOf(r) + 1; return `<tr>${`<td class="drk-sh-i num">${ri}</td>`}${arr(cols).map((c, i) => { const e = msgFor(r.err, c, i), w = e ? null : msgFor(r.warn, c, i); const v = arr(r.cells)[i]; return `<td class="${e ? "err" : w ? "warn" : ""}"${e || w ? ` title="${esc(e || w)}"` : ""}>${e ? g("bad", "drk-sh-g") : w ? g("warn", "drk-sh-g") : ""}<span>${v == null || v === "" ? "" : esc(v)}</span></td>`; }).join("")}</tr>`; }).join("") : `<tr><td class="drk-sh-none" colspan="${arr(cols).length + 1}">No rows in this view</td></tr>`;
    return `<div class="drk-sheet" data-drk-sheet="${esc(sid)}"><div class="drk-sh-bar">${seg}</div><div class="drk-sh-wrap"><table class="drk-sh-tb"><thead>${head}</thead><tbody>${body}</tbody></table></div></div>`;
  };
  K.on("drk.sheet", (a) => { put(`sheet.${a.id}`, a.f); K.redraw(); });

  // Compare: current, template, selections
  let CMP = null;
  const cmpDiff = (r) => String(r.current == null ? "" : r.current) !== String(r.template == null ? "" : r.template);
  const cmpBody = () => {
    const rows = CMP.rows, sel = CMP.sel;
    const nDiff = rows.filter(cmpDiff).length, allTpl = nDiff && rows.filter(cmpDiff).every((r) => sel[r.field] === "template");
    // One decision a field: a two-way switch, Keep current | Use template (Keep current until chosen). data-drk-cmp keeps the
    // old names, reject (keep current) and apply (use template), so earlier scripts still click it.
    const seg = (r, i) => { const s = sel[r.field] || "current"; return `<span class="drk-seg drk-cmp-seg" role="group" aria-label="${esc(r.field)}">${[["reject", "current", "Keep current"], ["apply", "template", "Use template"]].map(([k, v, l]) => `<button type="button" class="${s === v ? "on" : ""}" aria-pressed="${s === v ? "true" : "false"}" data-drk-cmp="${k}" data-i="${i}">${l}</button>`).join("")}</span>`; };
    return `<div class="drk-cmp"><div class="drk-cmp-bar"><span class="k3-muted"><span class="num">${nDiff}</span> of <span class="num">${rows.length}</span> fields differ</span>${nDiff ? `<button type="button" class="k3-link" data-drk-cmp="${allTpl ? "none" : "all"}">${allTpl ? "Keep current for all" : "Use template for all"}</button>` : ""}</div><div class="drk-cmp-wrap"><table class="drk-cmp-tb"><thead><tr><th>Field</th><th>Current</th><th>Template</th><th>Selections</th></tr></thead><tbody>${rows.map((r, i) => {
      const d = cmpDiff(r);
      return `<tr class="${d ? "diff" : ""}"><th scope="row">${esc(r.field)}</th><td class="${d ? "drk-cmp-cur" : ""}">${esc(r.current == null ? "—" : r.current)}</td><td class="${d ? "drk-cmp-tpl" : ""}">${esc(r.template == null ? "—" : r.template)}</td><td>${d ? seg(r, i) : '<span class="k3-none">Same</span>'}</td></tr>`;
    }).join("")}</tbody></table></div></div>`;
  };
  D.openCompare = ({ title, rows, confirm } = {}) => {
    CMP = { rows: arr(rows), sel: {}, confirm };
    K.dialog({ title: title || "Compare with the template", wide: true, body: cmpBody(), submit: "Confirm selections", onOk: () => { const c = CMP; CMP = null; if (c && typeof c.confirm === "function") c.confirm(Object.assign({}, ...c.rows.map((r) => ({ [r.field]: c.sel[r.field] || "current" })))); } });
  };
  document.addEventListener("click", (e) => {
    const b = e.target && e.target.closest && e.target.closest("[data-drk-cmp]"); if (!b || !CMP) return;
    e.preventDefault();
    const k = b.getAttribute("data-drk-cmp");
    if (k === "all" || k === "none") CMP.rows.forEach((r) => { if (cmpDiff(r)) CMP.sel[r.field] = k === "all" ? "template" : "current"; });
    else { const r = CMP.rows[+b.getAttribute("data-i")]; if (r) CMP.sel[r.field] = k === "apply" ? "template" : "current"; }
    K.dialogBody(cmpBody());
  });
  document.addEventListener("change", (e) => {
    const t = e.target; if (!t || !t.matches) return;
    if (t.matches("[data-drk-facet]")) {
      const id = t.getAttribute("data-drk-facet"), key = t.getAttribute("data-drk-key"), F = FACETS[id]; if (!F) return;
      const gr = F.groups.find((x) => x.key === key);
      let v;
      if (gr && gr.type === "check") { v = [...document.querySelectorAll(`[data-drk-facet="${CSS.escape(id)}"][data-drk-key="${CSS.escape(key)}"]`)].filter((x) => x.checked).map((x) => x.value); }
      else v = t.value;
      if (typeof F.act === "function") F.act(key, v); else if (F.act) call(F.act, { key, value: v });
    }
  }, true);

  // ——— AI ———
  const AI = () => `<span class="drk-ai">${K.i("sparkle")}AI</span>`;
  D.suggest = ({ confidence, title, rationale, source, actions } = {}) => {
    const c = String(confidence || "").toLowerCase(), word = c === "high" ? "High" : c === "medium" ? "Medium" : c === "low" ? "Low" : "";
    return `<section class="drk-sug"><div class="drk-sug-h">${AI()}${word ? `<span class="drk-conf drk-conf-${c}">${word} confidence</span>` : ""}</div><h4 class="drk-sug-t">${esc(title || "")}</h4>${rationale ? `<p class="drk-sug-r">${esc(rationale)}</p>` : ""}${source ? `<p class="drk-sug-s">From ${esc(source)}</p>` : ""}${arr(actions).length ? `<div class="drk-sug-a">${arr(actions).map((a) => `<button type="button" class="btn sm${a.primary ? " ink" : ""}"${hit(a)}>${esc(a.label)}</button>`).join("")}</div>` : ""}</section>`;
  };
  D.proposal = ({ change, reasoning, approve, decline, who, primary } = {}) => `<section class="drk-prop"><div class="drk-sug-h">${AI()}${who ? `<span class="drk-prop-w">${esc(who)}</span>` : ""}</div><p class="drk-prop-c">${esc(change || "")}</p>${reasoning ? `<details class="drk-prop-y"><summary>Why</summary><p>${esc(reasoning)}</p></details>` : ""}<div class="drk-sug-a"><button type="button" class="btn sm${primary ? " ink" : ""}"${cb(approve)}>Approve</button><button type="button" class="btn sm ${primary ? "drk-ol" : "k3-quiet"}"${cb(decline)}>Decline</button></div></section>`;

  // ——— The gallery: one live demo a component, on WS-X90's own controls (PA.SSP) ———
  const where = {
    reg: "the controls register (dr-controls)", rec: "the control record (dr-control--<code>)", ev: "the evidence register (dr-evidence)", evr: "the evidence record (dr-evidence--<id>)",
    imp: "the import (dr-import)", src: "the source record (dr-source--<id>)", srcs: "the sources register (dr-sources)", chk: "the check record (dr-check--<id>)", fnd: "the finding record (dr-finding--<id>)", pick: "the evidence picker (dr-evidence-pick)",
  };
  D.COMPONENTS = [
    { id: "idchip", name: "Identifier chip", rec: [2], what: "The control code carries its status: one mark instead of a code and a status column.", ledger: "Id takes a status tone: monospaced code in a round chip on color.background.<status>.subtler, glyph in front; only where status varies (B14).", where: [where.reg, where.rec, where.ev, where.fnd] },
    { id: "head", name: "Record header", rec: [20], what: "Trail, id chip, title, then ⋯ · secondary · primary, a facts strip with pencils, and line tabs.", ledger: "PageHeader gains an identifier slot and a facts strip (label over value, an inline edit trigger); Edit stays the one primary.", where: [where.rec, where.evr, where.src, where.chk, where.fnd] },
    { id: "tabs", name: "Problem counts on tabs", rec: [3], what: "A tab counts its problems in pale red; a tab with nothing wrong shows no badge.", ledger: "Tabs take a count with a tone: neutral Badge for a size, danger.subtler Badge for problems; zero draws nothing (B3).", where: [where.rec, where.chk, where.fnd] },
    { id: "stages", name: "Readiness by stage", rec: [1], what: "The status as a sum you can read: a bar with its breakdown, then four stage cards with counts.", ledger: "Four Cards on the Overview tab, each a status word after a tinted glyph and a Tally; an empty stage holds the derived next step.", where: [where.rec] },
    { id: "stats", name: "Plain stat tiles", rec: [26], what: "Up to four equal tiles, a label over a big ink figure; only a problem tile leads with a warning glyph.", ledger: "Stat at the display size, no bar, trend or colour; a problem tile leads with the warning glyph (rule 4).", where: [where.ev, where.srcs] },
    { id: "numbers", name: "Track · Fix · Manage", rec: [12], what: "A record opens on three numbers, each with what it counts since when and the place that works it.", ledger: "Three Stat tiles in a row on a Record's Overview, each with a LinkButton to its register; the figure takes the status tone.", where: [where.chk, where.fnd] },
    { id: "worth", name: "What a source is worth", rec: [11], what: "A source says how much of this program it can evidence; each number opens its list.", ledger: "An inline Tally of LinkButtons (count + noun), joined by middots, in a Record's header or a register cell.", where: [where.src, where.srcs] },
    { id: "facets", name: "Filter panel beside the table", rec: [21], what: "Collapsible groups with applied counts, opened and closed by the toolbar's Filter button.", ledger: "AsideLayout slot beside DataTable holding a facet Card (radio and checkbox groups with counts); the toolbar row stays, no chip row.", where: [where.reg] },
    { id: "selbar", name: "Floating selection bar", rec: [22], what: "“N selected · Select all M”, the verbs as text buttons, and Clear, floating at the foot.", ledger: "DataTable's selection bar, floated at the viewport's foot on elevation.surface.overlay; verbs are subtle Buttons.", where: [where.reg, where.ev] },
    { id: "drawer", name: "Walkable preview", rec: [23], what: "A preview that walks the list: “2 of 10”, Previous ↑, Next ↓, then the status, title, Open and facts.", ledger: "Inspector gains a pager (position, previous, next, arrow keys) bound to the register's current order.", where: [where.ev, where.reg] },
    { id: "dock", name: "Docked side panes", rec: [24], what: "A thin rail at the right edge opens notes, tasks or history beside the page; the page narrows.", ledger: "StickyRail of icon toggles docking a WorkPane (≈380px); one pane at a time, the chosen icon marked with color.border.selected.", where: [where.chk, where.fnd] },
    { id: "card", name: "Card with its own Edit", rec: [25], what: "Edit swaps one card's facts for inputs, with Save and Cancel under them.", ledger: "Editable on a Card: the card's facts become its form; Save (small, solid) and Cancel at its foot.", where: [where.rec] },
    { id: "sunken", name: "Sunken page, raised cards", rec: [19], what: "Record and overview bodies sit in a grey well behind white bordered cards; registers stay one surface.", ledger: "elevation.surface.sunken behind a Record's Overview and the standing views; Cards on elevation.surface.raised.default.", where: [where.rec, where.evr, where.src, where.chk, where.fnd] },
    { id: "steps", name: "Full-page flow with a stepper", rec: [10], what: "Back link, title, a vertical stepper, a form column, and Back · primary at the foot.", ledger: "A vertical Stepper for long Flows: done filled with a check, current a ring, later subdued; a ≈880px form column.", where: [where.imp] },
    { id: "sheet", name: "Validation sheet", rec: [10], what: "Imported rows in a compact grid: red cells block, amber cells warn; All · Valid · Invalid.", ledger: "A dense DataTable variant with cell tones (danger.subtler blocks, warning.subtler warns) and a SegmentedControl of counts.", where: [where.imp] },
    { id: "moving", name: "What will change", rec: [27], what: "Counts before a command over many records: locked rows ticked, “Moving N · Not moving M”, one consequence.", ledger: "A confirmation Dialog body: a short Tally table, locked rows disabled, the totals, and one line naming the consequence.", where: [where.imp, where.src] },
    { id: "compare", name: "Compare with the template", rec: [5], what: "Current, template and selections side by side; one switch a field, Keep current or Use template, then Confirm.", ledger: "A wide Dialog of three columns with diff tones (current danger.subtler, template success.subtler) and a SegmentedControl per field.", where: [where.rec] },
    { id: "suggest", name: "AI suggestion", rec: [28], what: "A confidence word, the suggestion, one line of rationale and its source, then Map · Dismiss.", ledger: "A Card marked AI (accent.purple.subtler in Ledger, the brand tint here), a confidence Badge in words, two small Buttons.", where: [where.rec] },
    { id: "proposal", name: "Agent's proposal", rec: [28], what: "One bold line naming the change, a collapsed Why, then Approve and Decline; Approve is filled only as the page's one primary.", ledger: "An agent's answer ends in a Sign card: the change, a Disclosure of its reasoning, Approve (primary only where the page has none) and a quiet Decline.", where: [where.rec] },
  ];
  const DEMOS = {};
  D.demo = (id) => { const f = DEMOS[id]; if (!f) return `<p class="k3-muted">No demo for ${esc(id)}.</p>`; try { return `<div class="drk-demo" data-drk-demo="${esc(id)}">${f()}</div>`; } catch (e) { console.error(e); return `<p class="k3-muted">The demo could not draw.</p>`; } };
  D._demos = DEMOS;

  const SSPD = () => PA.SSP || null;
  const ctl = (c) => (SSPD() && SSPD().ctl(c)) || { c, t: c, cs: "no_requirement", ob: 0, om: 0, oe: 0, oa: 0, r: 0, e: 0 };
  const stWord = (cs) => (SSPD() && SSPD().STATUS[cs] ? SSPD().STATUS[cs][0] : String(cs || ""));
  const CODES = ["AC-2", "SI-2", "CM-8", "RA-5", "AU-6", "IA-2", "SC-7", "CM-6", "AC-17", "SI-4"].filter((c) => !SSPD() || SSPD().ctl(c));
  const dst = (k, d) => st("demo." + k, d), dput = (k, v) => put("demo." + k, v);
  const toast = (t) => () => K.toast(t);
  const saysNothing = (what) => () => K.confirm({ title: what, text: `${esc(what)} saves nothing in the prototype: it shows where the verb lives.`, submit: "OK", cancel: "Close", onOk: () => {} });
  // The control the stage demo reads: the first of WS-X90's controls part way along (deterministic: catalog order).
  const midCtl = () => { const L = (SSPD() && SSPD().controls) || []; return L.find((c) => c.ob > 4 && c.om === c.ob && c.oe > 0 && c.oe < c.om && c.oa < c.ob) || L.find((c) => c.ob > 2 && c.om > 0 && c.oe < c.om && c.oa < c.ob) || L.find((c) => c.ob && c.oa < c.ob) || ctl("SI-2"); };
  const stCounts = () => { const L = (SSPD() && SSPD().controls) || []; const n = {}; L.forEach((c) => { n[c.cs] = (n[c.cs] || 0) + 1; }); return { total: L.length, n }; };

  DEMOS.idchip = () => `<table class="drk-demo-tb"><thead><tr><th class="id">Control</th><th>Name</th><th class="n">Judged</th></tr></thead><tbody>${CODES.slice(0, 6).map((c) => { const x = ctl(c); return `<tr><td class="id">${D.idChip(x.c, D.tone(x.cs), { title: `${x.c} · ${stWord(x.cs)}` })}</td><td>${esc(x.t)}</td><td class="n num">${fmt(x.oa)} of ${fmt(x.ob)}</td></tr>`; }).join("")}</tbody></table><p class="drk-demo-note">Hover a chip for its status word. The status column is gone.</p>`;

  DEMOS.head = () => {
    const x = ctl("SI-2"), owner = dst("owner", "Priya Raghavan");
    return D.box("", D.head({
      crumbs: [["Controls", "controls"], [x.c]], id: { code: x.c, tone: D.tone(x.cs) }, title: x.t,
      facts: [["Status", esc(stWord(x.cs))], ["Owner", K.owner(owner), () => { const ppl = ((SSPD() && SSPD().people) || []).map((p) => p.name); K.form({ title: "Owner", fields: [{ key: "owner", label: "Owner", type: "select", options: ppl.length ? ppl : [owner], value: owner, required: true }], submit: "Save", onSubmit: (v) => { dput("owner", v.owner); K.redraw(); } }); }], ["Judged", `<span class="num">${fmt(x.oa)} of ${fmt(x.ob)}</span>`], ["Frequency", "At least annually"]],
      actions: { more: [{ label: "Export", act: saysNothing("Export") }, { label: "History", act: saysNothing("History") }], secondary: { label: "Map requirement", act: saysNothing("Map requirement") }, primary: { label: "Edit", act: saysNothing("Edit") } },
      tabs: D.tabs([{ label: "Overview", on: true, act: toast("Overview is open") }, { label: "Requirements", count: x.r, act: toast("Requirements: a tab of the record") }, { label: "Evidence", count: x.e, act: toast("Evidence: a tab of the record") }, { label: "Assessment", problem: Math.max(0, x.ob - x.oa), act: toast("Assessment: objectives not judged") }]),
    }));
  };

  DEMOS.tabs = () => {
    const x = midCtl(), on = dst("tab", "assessment");
    const T2 = [["overview", "Overview", null, null], ["requirements", "Requirements", x.r, null], ["evidence", "Evidence", null, Math.max(0, x.om - x.oe)], ["assessment", "Assessment", null, Math.max(0, x.ob - x.oa)], ["activity", "Activity", null, null]];
    const cur = T2.find((t) => t[0] === on) || T2[0];
    const line = cur[3] ? `${fmt(cur[3])} ${cur[0] === "evidence" ? "objectives mapped but not evidenced" : "objectives not judged"}` : cur[2] ? `${fmt(cur[2])} requirements` : "Nothing wrong here";
    return D.box("", `${D.tabs(T2.map(([k, l, n, p]) => ({ label: l, count: n, problem: p, on: k === on, act: () => { dput("tab", k); K.redraw(); } })))}<p class="drk-demo-note">${esc(x.c)} · ${esc(cur[1])}: ${esc(line)}</p>`);
  };

  DEMOS.stages = () => {
    const x = midCtl();
    return D.box("", D.stages({
      done: x.oa, total: x.ob, unit: "objectives judged", tip: [["Mapped", x.om, x.ob], ["Evidenced", x.oe, x.ob], ["Judged", x.oa, x.ob], ["Open POA&M items", 0]],
      cards: [
        { title: "Requirements", state: x.om >= x.ob ? "Mapped" : "Mapping", tone: x.om >= x.ob ? "ok" : "warn", legend: [{ label: "Mapped", n: x.om, tone: "ok", act: toast("Opens the mapped objectives") }, { label: "Not mapped", n: x.ob - x.om, tone: "bad", act: toast("Opens the objectives with no requirement") }] },
        { title: "Evidence", state: x.oe >= x.ob ? "Evidenced" : x.oe ? "Part evidenced" : "No evidence", tone: x.oe >= x.ob ? "ok" : x.oe ? "warn" : "bad", legend: [{ label: "Evidenced", n: x.oe, tone: "ok", act: toast("Opens the evidenced objectives") }, { label: "Owed", n: Math.max(0, x.om - x.oe), tone: "warn", act: toast("Opens the objectives that owe evidence") }, { label: "Not mapped", n: x.ob - x.om, tone: "none" }] },
        { title: "Assessment", state: x.oa >= x.ob ? "Judged" : "Not assessed", tone: x.oa >= x.ob ? "ok" : "warn", legend: [{ label: "Judged", n: x.oa, tone: "ok" }, { label: "Not judged", n: x.ob - x.oa, tone: "warn", act: toast("Opens the objectives no assessor has judged") }], empty: { line: "No assessment has judged it", label: "Add to assessment", act: saysNothing("Add to assessment") } },
        { title: "Remediation", state: "Nothing open", tone: "none", legend: [], empty: { line: "No open POA&M items", label: "Create POA&M item", act: saysNothing("Create POA&M item") } },
      ],
      uncounted: { n: 0, label: "objectives judged by inheritance" },
    })) + `<p class="drk-demo-note">${esc(x.c)} ${esc(x.t)}: hover the bar for the breakdown.</p>`;
  };

  DEMOS.stats = () => { const c = stCounts(); return D.stats([{ label: "Controls", n: c.total, act: toast("Opens every control") }, { label: "Satisfied", n: c.n.satisfied || 0, act: toast("Opens the satisfied controls") }, { label: "Not assessed", n: c.n.not_assessed || 0, act: toast("Opens the controls not assessed") }, { label: "Other than satisfied", n: c.n.other_than_satisfied || 0, problem: (c.n.other_than_satisfied || 0) > 0, act: toast("Opens the controls other than satisfied") }]); };

  DEMOS.numbers = () => {
    const ch = (V3.fact("checks") || []).find((c) => c.failing) || null;
    const days = ch && ch.due ? Math.max(1, Math.round((new Date("2026-11-17T12:00:00") - new Date(ch.due)) / 86400000)) : 52;
    return `${ch ? `<p class="drk-demo-note">${esc(ch.name)}</p>` : ""}${D.numbers([
      { label: "Track", metric: "Days failing", n: days, tone: "bad", since: ch && ch.due ? `Since ${new Date(ch.due).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Since Sep 26", links: [{ label: "History", act: toast("Opens the check's run history") }] },
      { label: "Fix", metric: "Items failing", n: ch && typeof ch.failing === "number" ? ch.failing : 14, tone: "bad", since: "Last run today", links: [{ label: "View findings", act: toast("Opens the findings this check raised") }] },
      { label: "Manage", metric: "POA&M items in progress", n: 0, tone: "none", since: "None open", links: [{ label: "Create POA&M item", act: saysNothing("Create POA&M item") }] },
    ])}`;
  };

  DEMOS.worth = () => { const L = (SSPD() && SSPD().controls) || [], cm = L.filter((c) => c.f === "CM"), ob = cm.reduce((s, c) => s + (c.ob || 0), 0); return D.box("ACAS scanner feed", `${D.worth([{ label: "objectives", n: ob, act: toast("Opens the objectives this feed can evidence") }, { label: "controls", n: cm.length, act: toast("Opens the controls") }, { label: "components", n: ((SSPD() && SSPD().elements) || []).filter((e) => /lru/i.test(String(e[4] || "")) || e[4]).length || 3, act: toast("Opens the components it covers") }], { title: "Can evidence" })}<p class="drk-demo-note">Before connecting: what the feed is worth to WS-X90 (the CM family).</p>`); };

  DEMOS.facets = () => {
    const f = dst("facets", { status: "", family: [] });
    const L = CODES.map(ctl), fams = [...new Set(L.map((c) => c.f))];
    const rows = L.filter((c) => (!f.status || c.cs === f.status) && (!f.family.length || f.family.includes(c.f)));
    const panel = D.facets({ id: "drk-demo", act: (key, v) => { const n = Object.assign({}, dst("facets", { status: "", family: [] })); n[key] = v; dput("facets", n); K.redraw(); }, groups: [
      { key: "status", label: "Status", type: "radio", value: f.status, options: [["", "Any", L.length], ...[...new Set(L.map((c) => c.cs))].map((s) => [s, stWord(s), L.filter((c) => c.cs === s).length])] },
      { key: "family", label: "Family", type: "check", value: f.family, options: fams.map((x) => [x, x, L.filter((c) => c.f === x).length]) },
    ] });
    const table = `<div class="drk-demo-row">${D.facetToggle("drk-demo")}<span class="drk-demo-note"><span class="num">${rows.length}</span> of <span class="num">${L.length}</span> controls</span></div><table class="drk-demo-tb"><tbody>${rows.length ? rows.map((c) => `<tr><td class="id">${D.idChip(c.c, D.tone(c.cs))}</td><td>${esc(c.t)}</td></tr>`).join("") : '<tr><td colspan="2">No controls match</td></tr>'}</tbody></table>`;
    return D.withFacets("drk-demo", panel, table);
  };

  DEMOS.selbar = () => {
    const sel = dst("sel", ["AC-2", "CM-8"]), L = CODES.slice(0, 6);
    const tog = (c) => () => { const s = new Set(dst("sel", ["AC-2", "CM-8"])); s.has(c) ? s.delete(c) : s.add(c); dput("sel", [...s]); K.redraw(); };
    return `<table class="drk-demo-tb"><tbody>${L.map((c) => { const x = ctl(c), on = sel.includes(c); return `<tr class="${on ? "on" : ""}"><td class="c"><button type="button" class="drk-lk" role="checkbox" aria-checked="${on}" aria-label="Choose ${esc(c)}"${cb(tog(c))}><input type="checkbox" tabindex="-1" aria-hidden="true"${on ? " checked" : ""}></button></td><td class="id">${D.idChip(x.c, D.tone(x.cs))}</td><td>${esc(x.t)}</td></tr>`; }).join("")}</tbody></table>${sel.length ? D.selbar({ inline: true, n: sel.length, total: CODES.length, all: () => { dput("sel", CODES.slice()); K.redraw(); }, clear: () => { dput("sel", []); K.redraw(); }, verbs: [{ label: "Assign owner", act: saysNothing("Assign owner") }, { label: "Add to assessment", act: saysNothing("Add to assessment") }] }) : '<p class="drk-demo-note">Choose a row: the bar appears.</p>'}`;
  };

  // The drawer, both ways: inline in the demo, and as a real V3 preview registered with D.panel and walked with D.walkable.
  const DW_KIND = "drk-demo-ctl";
  const dwSpec = (c) => { const x = ctl(c); return { code: x.c, tone: D.tone(x.cs), title: x.t, status: K.status(stWord(x.cs), (SSPD() && SSPD().STATUS[x.cs] || [])[1]), facts: [["Objectives", `<span class="num">${fmt(x.ob)}</span>`], ["Mapped", `<span class="num">${fmt(x.om)}</span>`], ["Evidenced", `<span class="num">${fmt(x.oe)}</span>`], ["Judged", `<span class="num">${fmt(x.oa)}</span>`], ["Requirements", `<span class="num">${fmt(x.r)}</span>`]] }; };
  D.panel(DW_KIND, (id) => (ctl(id) ? Object.assign(dwSpec(id), { open: K.recRoute("k3c-control", id) || "" }) : null));
  DEMOS.drawer = () => {
    const L = CODES.slice(0, 8); D.walkable(DW_KIND, L);
    const i = Math.max(0, Math.min(L.length - 1, dst("dw", 1))), shut = dst("dwShut", false);
    const go = (j) => () => { dput("dw", j); dput("dwShut", false); K.redraw(); };
    const list = `<table class="drk-demo-tb"><tbody>${L.map((c, j) => { const x = ctl(c); return `<tr class="${!shut && j === i ? "on" : ""}"><td class="id">${D.idChip(x.c, D.tone(x.cs))}</td><td>${esc(x.t)}</td><td class="c"><button type="button" class="drk-dw-x" title="Preview" aria-label="Preview ${esc(c)}"${cb(go(j))}>${K.i("eye")}</button></td></tr>`; }).join("")}</tbody></table>`;
    const pane = shut ? `<p class="drk-demo-note">Preview closed. Choose an eye to open it.</p>` : `<div class="drk-demo-panel">${D.drawer(Object.assign(dwSpec(L[i]), { pos: i + 1, total: L.length, prev: i > 0 ? go(i - 1) : null, next: i < L.length - 1 ? go(i + 1) : null, open: K.recRoute("k3c-control", L[i]) || "", actions: `<button type="button" class="btn sm"${cb(() => D.openPanel(DW_KIND, L[i]))}>Open in the side panel</button>` }))}</div>`;
    return `${list}${pane}`;
  };
  document.addEventListener("click", (e) => {
    const t = e.target; if (!t || !t.closest) return;
    const x = t.closest("[data-drk-close]"); if (!x) return;
    if (x.closest('.drk-demo[data-drk-demo="drawer"]')) { e.preventDefault(); e.stopPropagation(); dput("dwShut", true); K.redraw(); }
  }, true);

  DEMOS.dock = () => {
    const x = ctl("RA-5");
    return D.dock({ id: "drk-demo", body: `<div class="drk-dw-t">${D.idChip(x.c, D.tone(x.cs))}<h4 class="drk-dw-title">${esc(x.t)}</h4></div><dl class="drk-cd-f" style="margin-top:12px"><div><dt>Status</dt><dd>${esc(stWord(x.cs))}</dd></div><div><dt>Objectives</dt><dd class="num">${fmt(x.ob)}</dd></div><div><dt>Requirements</dt><dd class="num">${fmt(x.r)}</dd></div></dl>`, items: [
      { key: "notes", icon: "chat", label: "Notes", count: 2, pane: () => `<p><b>Ingrid Solberg</b> · Nov 14</p><p>ACAS scan of LRU-018 is due before the gate.</p><p><b>Priya Raghavan</b> · Nov 12</p><p>Moved the weekly scan to Tuesdays.</p>` },
      { key: "tasks", icon: "task", label: "Tasks", count: 1, pane: () => `<p>Upload November ACAS results · due Nov 28</p>` },
      { key: "history", icon: "history", label: "History", pane: () => `<p>Statement edited · Nov 13</p><p>Mapped to REQ-112 · Nov 4</p>` },
    ] });
  };

  DEMOS.card = () => {
    const v = dst("card", { owner: "Priya Raghavan", freq: "At least annually", impl: "Partially implemented" });
    return D.card({ id: "drk-demo", title: "Implementation", facts: [["Owner", K.owner(v.owner)], ["Frequency", esc(v.freq)], ["Status", esc(v.impl)]], fields: [
      { key: "owner", label: "Owner", type: "select", value: v.owner, options: ((SSPD() && SSPD().people) || []).map((p) => p.name).slice(0, 8).concat(v.owner).filter((n, i, a) => a.indexOf(n) === i) },
      { key: "freq", label: "Frequency", type: "select", value: v.freq, options: ["At least annually", "Every six months", "Quarterly", "Monthly"] },
      { key: "impl", label: "Status", type: "select", value: v.impl, options: ["Implemented", "Partially implemented", "Planned", "Not implemented"] },
    ], save: (vals) => { dput("card", Object.assign({}, v, vals)); K.toast("Implementation saved"); } });
  };

  DEMOS.sunken = () => { const x = ctl("AC-2"); return D.sunken([D.box("Statement", `<p class="k3-muted" style="margin:0">${esc(x.n || "")}</p>`), D.box("Coverage", `<dl class="drk-cd-f"><div><dt>Objectives</dt><dd class="num">${fmt(x.ob)}</dd></div><div><dt>Evidenced</dt><dd class="num">${fmt(x.oe)}</dd></div></dl>`)]); };

  const STEPS = ["Upload", "Map columns", "Map values", "Review", "Confirm"];
  DEMOS.steps = () => {
    const at = Math.max(0, Math.min(STEPS.length - 1, dst("step", 1)));
    const body = [
      `<p class="k3-muted">WS-X90 SCTM.xlsx · 560 rows · uploaded</p>`,
      `<table class="drk-demo-tb"><thead><tr><th>Column in the file</th><th>Field</th></tr></thead><tbody><tr><td>Control</td><td>Control code</td></tr><tr><td>Imp. Status</td><td>Implementation status</td></tr><tr><td>Narrative</td><td>Statement</td></tr></tbody></table>`,
      `<table class="drk-demo-tb"><thead><tr><th>Value in the file</th><th>Becomes</th></tr></thead><tbody><tr><td>Implemented</td><td>Implemented</td></tr><tr><td>Partial</td><td>Partially implemented</td></tr><tr><td>Planned</td><td>Planned</td></tr></tbody></table>`,
      `<p class="k3-muted">The sheet of rows, with All · Valid · Invalid.</p>`,
      `<p class="k3-muted">Counts of what will be created and updated.</p>`,
    ][at];
    return D.steps({ back: { label: "Evidence", go: "evidence" }, title: "Import an SCTM", steps: STEPS, at, body, foot: { backAct: () => { dput("step", Math.max(0, at - 1)); K.redraw(); }, nextAct: () => { if (at >= STEPS.length - 1) { dput("step", 0); K.toast("Import saves nothing in the prototype: back to the first step"); } else dput("step", at + 1); K.redraw(); }, nextLabel: at >= STEPS.length - 1 ? "Import 548 rows" : "Continue" } });
  };

  DEMOS.sheet = () => D.sheet({ id: "drk-demo", cols: ["Control", "Status", "Statement"], rows: [
    { cells: ["AC-2", "Partial", "Accounts are managed by the mission computer's directory…"] },
    { cells: ["AC-2(1)", "Implemented", "Automated account management…"], warn: { Control: "Updates an existing statement" } },
    { cells: ["SI-2", "Partly", "Flaws are remediated through the ACAS cycle…"], err: { Status: "“Partly” is not an implementation status" } },
    { cells: ["CM-8", "Implemented", "The component inventory is the system tree…"] },
    { cells: ["XX-9", "Planned", ""], err: { Control: "No control XX-9 in the baseline", Statement: "A statement is required" } },
    { cells: ["RA-5", "Implemented", "ACAS scans every LRU weekly…"], warn: { Control: "Updates an existing statement" } },
  ] });

  DEMOS.moving = () => D.box("", D.moving({ title: "Apply the boundary rules", rows: [{ label: "Assets inside the boundary", n: 147, locked: true }, { label: "Assets matched to a component", n: 131 }, { label: "Assets outside: left out of every count", n: 12 }], moving: 147, notMoving: 12, consequence: "CM-8's objectives count the 147; the 12 stop counting toward any status." }));

  DEMOS.compare = () => {
    const done = dst("cmp", null);
    const open = () => D.openCompare({ title: "CM-8 on Mission Computer · compare with the library", rows: [
      { field: "Status", current: "Partially implemented", template: "Implemented" },
      { field: "Responsible role", current: "System owner", template: "System owner" },
      { field: "Statement", current: "The inventory is kept in the system tree and reviewed at each gate.", template: "The inventory is kept in the system tree and reviewed quarterly." },
      { field: "Review frequency", current: "At each gate", template: "Quarterly" },
    ], confirm: (s) => { const n = Object.values(s).filter((x) => x === "template").length; dput("cmp", n); K.toast(n ? `${n} field${n === 1 ? "" : "s"} taken from the library` : "Kept every current value"); K.redraw(); } });
    return D.box("CM-8 · Mission Computer", `<p class="k3-muted" style="margin:0">Changed here: 2 fields differ from the library implementation it started from.</p><div class="drk-demo-row"><button type="button" class="btn sm"${cb(open)}>Compare with library</button>${done != null ? `<span class="drk-demo-note">Last confirmed: <span class="num">${fmt(done)}</span> taken from the library</span>` : ""}</div>`);
  };

  DEMOS.suggest = () => {
    const gone = dst("sug", null);
    if (gone) return `<p class="drk-demo-note">${gone === "map" ? "Mapped REQ-112 to SI-2(2)." : "Dismissed."} <button type="button" class="k3-link"${cb(() => { dput("sug", null); K.redraw(); })}>Undo</button></p>`;
    return D.suggest({ confidence: "high", title: "Map REQ-112 to SI-2(2) Automated flaw remediation status", rationale: "The requirement asks for weekly automated scan status, which is SI-2(2)'s objective.", source: "REQ-112 · System Requirements Document §3.4", actions: [{ label: "Map", primary: true, act: () => { dput("sug", "map"); K.redraw(); } }, { label: "Dismiss", act: () => { dput("sug", "dismiss"); K.redraw(); } }] });
  };

  DEMOS.proposal = () => {
    const d = dst("prop", null);
    if (d) return `<p class="drk-demo-note">${d === "ok" ? "Approved: the tasks are created for the system owner." : "Declined: nothing changes."} <button type="button" class="k3-link"${cb(() => { dput("prop", null); K.redraw(); })}>Undo</button></p>`;
    return D.proposal({ who: "Evidence agent", change: "Request November ACAS results for 6 controls from the system owner", reasoning: "RA-5, SI-2 and four more cite the October scan, which falls outside the assessment period that starts Dec 1.", approve: () => { dput("prop", "ok"); K.redraw(); }, decline: () => { dput("prop", "no"); K.redraw(); } });
  };

  // The gallery page
  D.route("dr-components", () => {
    const secs = D.COMPONENTS.map((c) => `<section class="drk-gs" id="drk-c-${esc(c.id)}"><div class="drk-gs-m"><div class="drk-gs-h"><h2>${esc(c.name)}</h2><span class="drk-gs-rec">Rec ${c.rec.join(", ")}</span></div><p class="drk-gs-w">${esc(c.what)}</p><dl class="drk-gs-dl"><div><dt>Used on</dt><dd>${esc(arr(c.where).join("; "))}</dd></div><div><dt>In Ledger</dt><dd>${esc(c.ledger)}</dd></div></dl></div><div class="drk-gs-d">${D.demo(c.id)}</div></section>`).join("");
    return K.page({ cls: "drk-galp", head: `${D.review({ title: "New components", back: "before-after-drata" })}${K.head({ crumbs: [["Before & after", "before-after"], ["New components"]], title: "New components" })}`, body: `<div class="drk-gal"><p class="drk-gal-intro">The parts Drata's patterns add, drawn in the V3 kit's look on WS-X90's controls. Each demo works: choose, walk, edit, confirm.</p><nav class="drk-gal-toc" aria-label="Components">${D.COMPONENTS.map((c) => `<a href="#dr-components" data-drk-jump="drk-c-${esc(c.id)}">${esc(c.name)}</a>`).join("")}</nav>${secs}</div>` });
  }, { nav: "before-after" });
  document.addEventListener("click", (e) => {
    const a = e.target && e.target.closest && e.target.closest("[data-drk-jump]"); if (!a) return;
    e.preventDefault(); const el = document.getElementById(a.getAttribute("data-drk-jump")); if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
  });

  PA.drk = D;
})();
