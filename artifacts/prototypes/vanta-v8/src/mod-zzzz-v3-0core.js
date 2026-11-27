// Prototype V3: the fixes recommended for the walkthrough's 82 findings, as a layer over v2 that does nothing until the reader
// switches it on. Off (the default, and after every new visit), every screen, preview, dialog and the menu draw exactly as v2.
// Loads after every v2 module (name order) and before the V3 lanes' modules (mod-zzzz-v3-2… onward). API, window.PA.v3:
//   on()                      whether V3 is on (sessionStorage "pa-v3"; a new visit starts in v2)
//   set(flag, opts)           switch V3 on or off; the menu, the page and the panel draw again ({ redraw: false }: only the switch);
//                             the current program is kept
//   force(flag, fn)           run fn with on() reading flag (the compare drawer draws v2 this way beside the live V3 page)
//   S(match, fn)              V3's version of a screen: match is a route or a RegExp (RegExp also reaches routes registered later,
//                             such as rec-- record pages). With V3 on the screen draws fn(orig, route), orig() drawing it as before
//                             (v2's, or an earlier V3 lane's); with V3 off it is orig, untouched. Later lanes wrap earlier ones.
//   P(kind, fn) / M(key, fn)  the same for a preview ({label, body}) and a dialog ({title, body, footer}); fn(orig, id)
//   screen(route, fn, nav)    a page only V3 has: fn(route) gives its HTML; with V3 off it says it belongs to V3 and offers the switch
//   redirect(from, to)        with V3 on, from's address (a route or a RegExp) opens to (a route, or fn(route) → route): merged pages
//   wsx() / prog()            whether the current program is WS-X90 (PRG-1090) / the current program's code
//   facts, fact(name, …a)     facts a lane publishes for the others (fact() is undefined until a lane registers it)
//   menu                      V3's program menu, [[group, [[route, label, count?], …]], …] (core.js draws it while V3 is on)
//   rail(RAIL) / areaGroups(G) hooks a lane may set to change the rail's areas and an area's groups while V3 is on
//   keepProgram(route)        hook (lane P): true when following a link to route must not change the current program
//   navDrawn(fn)              fn(route) after core.js draws the menu, while V3 is on
//   lazyRoute(re, draw, nav)  record pages by address: a route matching re is registered when first asked for; draw(route, match)
//   compareAs(match, v2route) the v2 page "Compare with v2" draws beside a page only V3 has
//   ready(fn)                 fn() once PA.start has drawn the first screen
//   compare()                 open or close the drawer that draws v2's version of the current page beside it (wide windows)
// Events: window "v3change" ({ detail: { on } }) after V3 is switched on or off.
// A V3 lane's markup is not passed through v2's visual layer (mod-zzzz-v2-9clean.js): write it in v2's look (PA.AK, PA.h).
(function () {
  const PA = window.PA; if (!PA || !PA.v2) return;
  const { S, P, M, ROUTE_NAV, h } = PA;
  const esc = h.esc;
  const KEY = "pa-v3", WSX = "PRG-1090";
  let ON = false, FORCED = null, toggling = false;
  try { ON = sessionStorage.getItem(KEY) === "1"; } catch (e) { ON = false; }
  const on = () => (FORCED === null ? ON : FORCED);
  const force = (flag, fn) => { const was = FORCED; FORCED = !!flag; try { return fn(); } finally { FORCED = was; } };
  const cur = () => (location.hash || "#home").slice(1);
  const prog = () => (PA.v2hubs ? PA.v2hubs.cur() : WSX);
  const wsx = () => prog() === WSX;

  // ——— Wrapping: V3's version when on, the screen as it was when off ———
  const keep = (f, g, mark) => { Object.keys(f).forEach((p) => { g[p] = f[p]; }); g.__v3 = (f.__v3 || 0) + 1; g.__v3mark = mark; return g; };
  const patterns = []; // [RegExp, apply] for routes registered after the call
  let seq = 0;
  function S3(match, fn) {
    const mark = "s" + (++seq);
    const apply = (k) => {
      const orig = S[k]; if (typeof orig !== "function" || hasMark(orig, mark)) return;
      const g = function () { if (!on()) return orig.apply(this, arguments); const self = this, a = arguments; return fn(() => orig.apply(self, a), k); };
      // The marks are set after keep() copies orig's properties, so a later sweep sees this wrapper and never wraps it twice.
      const marks = (orig.__v3marks || []).concat([mark]);
      S[k] = keep(orig, g, mark);
      S[k].__v3marks = marks;
    };
    if (match instanceof RegExp) { Object.keys(S).filter((k) => match.test(k)).forEach(apply); patterns.push([match, apply]); }
    else if (S[match]) apply(match);
    else screen(match, (r) => fn(() => "", r));
  }
  const hasMark = (f, mark) => (f.__v3marks || []).indexOf(mark) >= 0;
  function wrapReg(reg, match, fn) {
    const apply = (k) => {
      const orig = reg[k]; if (typeof orig !== "function") return;
      const g = function (id) { if (!on()) return orig.apply(this, arguments); const self = this, a = arguments; return fn(() => orig.apply(self, a), id, k); };
      reg[k] = keep(orig, g);
    };
    if (match instanceof RegExp) Object.keys(reg).filter((k) => match.test(k)).forEach(apply);
    else if (reg[match]) apply(match);
    else reg[match] = keep(function () { return null; }, function (id) { return on() ? fn(() => null, id, match) : null; });
  }
  const P3 = (match, fn) => wrapReg(P, match, fn);
  const M3 = (match, fn) => wrapReg(M, match, fn);
  // Routes registered later (record pages on demand): the RegExp lanes reach them as they appear.
  const sweep = () => { for (const k of Object.keys(S)) for (const [re, apply] of patterns) if (re.test(k)) apply(k); };
  window.addEventListener("hashchange", sweep);

  // ——— Pages only V3 has ———
  const offPage = (route) => h.page(h.header("Part of V3", "", ""), `<div class="card v3-off"><p>This page is one of the changes V3 recommends. Switch V3 on to see it; the prototype stays v2 until you do.</p><button type="button" class="btn ink" data-v3-set="1">Switch V3 on</button></div>`);
  function screen(route, fn, nav) {
    const g = function () { return on() ? fn(route) : offPage(route); };
    g.__v2c = true; g.__v3 = 1; g.__v3only = true;
    S[route] = g;
    if (nav) ROUTE_NAV[route] = nav;
    return g;
  }

  // ——— Record pages by address: a route matching a pattern is registered the first time it is asked for, V3 on only ———
  const LAZY = [];
  const lazyRoute = (pattern, draw, nav) => { LAZY.push([pattern, draw, nav]); };
  function lazy(r) {
    if (!on() || S[r]) return;
    for (const [re, draw, nav] of LAZY) { if (re.test(r)) { screen(r, (route) => draw(route, re.exec(route)), typeof nav === "function" ? nav(r) : nav); return; } }
  }
  // What "Compare with v2" draws beside a page only V3 has: the v2 page it replaces.
  const WAS = [];
  const compareAs = (match, v2route) => { WAS.push([match, v2route]); };
  const wasOf = (r) => { for (const [m, to] of WAS) { if (m instanceof RegExp ? m.test(r) : m === r) return typeof to === "function" ? to(r) : to; } return null; };

  // ——— Merged pages: the address of a page V3 folded into another opens that one ———
  const REDIRECTS = [];
  const redirect = (from, to) => { REDIRECTS.push([from, to]); };
  const drawn = (t) => !!S[t] || LAZY.some(([re]) => re.test(t));
  function redirectOnce(r) {
    for (const [from, to] of REDIRECTS) {
      const hit = from instanceof RegExp ? from.test(r) : from === r;
      if (!hit) continue;
      const t = typeof to === "function" ? to(r) : to;
      if (t && t !== r && drawn(t)) return t;
    }
    return r;
  }
  // A folded page may itself have been folded since (an earlier lane's merge, then the menu's): follow the chain to its end.
  function redirectOf(r) {
    if (!on()) return r;
    const seen = new Set([r]);
    for (let i = 0; i < 6; i++) { const t = redirectOnce(r); if (t === r || seen.has(t)) break; seen.add(t); r = t; }
    return r;
  }

  // ——— The program menu: the program's records, not its process steps. Ten places; everything else is a tab, a rail category,
  // a view or a section of one of them (the 27 pages of V3's first menu, which followed the RMF steps, fold into these). ———
  const menu = [
    [null, [["overview", "Overview"], ["system", "System"], ["controls", "Controls"], ["requirements", "Requirements"], ["evidence", "Evidence"], ["documents", "Documents"],
      ["assessments", "Assessments"], ["findings", "Findings"], ["risks", "Risks"], ["authorization", "Authorization"]]],
  ];
  // Where a folded page's address opens, unless the lane that owns the new home points it at a tab or a view with redirect(), which
  // wins. A default applies only once its new home is drawn, so a build without that lane keeps the old page.
  const MERGED = {
    lifecycle: "overview", sse: "overview", "getting-started": "overview", people: "overview-team", activity: "overview-activity",
    boundary: "system-boundary", interconnections: "system-connections", ppsm: "system-connections", composition: "system", hosts: "system", inheritance: "system", inventory: "system",
    baseline: "controls", resiliency: "controls", posture: "controls",
    ssps: "documents", policies: "documents", stigs: "evidence", sources: "evidence", traceability: "requirements",
    "cyber-te": "assessments", conmon: "assessments", checks: "assessments", schedule: "assessments",
    poam: "findings", threats: "risks", "package-room": "authorization",
  };
  const FOLDED = new Set(Object.keys(MERGED));
  setTimeout(() => { for (const [from, to] of Object.entries(MERGED)) redirect(from, to); }, 0); // after the lanes' own redirects

  // ——— Switching ———
  const proto = document.getElementById("proto");
  const mark = () => { if (proto) proto.classList.toggle("v3on", on()); document.documentElement.classList.toggle("v3on", on()); chip(); };
  // Draw the menu, the page and the preview area again as a link would, keeping the current program (A16: a switch at the same address).
  function refresh() {
    toggling = true;
    try { window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL: location.href, newURL: location.href })); } finally { toggling = false; }
  }
  // set(flag, { redraw: false }) only flips the switch: the link being followed draws the next page in the new mode.
  function set(flag, opts) {
    ON = !!flag;
    try { sessionStorage.setItem(KEY, ON ? "1" : "0"); } catch (e) { /* storage off: this visit only */ }
    mark();
    if (!ON) closeCompare();
    if (!opts || opts.redraw !== false) refresh();
    try { window.dispatchEvent(new CustomEvent("v3change", { detail: { on: ON } })); } catch (e) { /* old browser: no event */ }
    // (Not under a test driver: the message would sit over every screenshot a script takes after switching.)
    if (PA.v2 && PA.v2.toast && !navigator.webdriver) PA.v2.toast(ON ? "V3 is on: the prototype is arranged by record. Switch it off to see v2." : "V3 is off: the prototype is v2, as published.");
  }
  // The top bar says V3 is on, and holds the compare and off switches.
  function chip() {
    const top = document.querySelector("#proto .top"); if (!top) return;
    let c = document.getElementById("v3chip");
    if (!on()) { if (c) c.remove(); return; }
    if (!c) {
      c = document.createElement("div"); c.id = "v3chip"; c.className = "v3chip";
      c.innerHTML = `<span class="v3chip-t">V3 <small>recommended</small></span><button type="button" class="v3chip-b" data-v3-compare aria-pressed="false">Compare with v2</button><button type="button" class="v3chip-b" data-v3-set="0">Back to v2</button>`;
      const av = top.querySelector(".avatar"); top.insertBefore(c, av || null);
    }
    const b = c.querySelector("[data-v3-compare]"); if (b) b.setAttribute("aria-pressed", String(!!cmpOpen));
  }
  document.addEventListener("click", (e) => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const s = t.closest("[data-v3-set]");
    if (s) { e.preventDefault(); set(s.dataset.v3Set === "1"); return; }
    const c = t.closest("[data-v3-compare]");
    if (c) { e.preventDefault(); compare(); }
  });

  // ——— Compare: v2's version of the page, drawn beside the live V3 page (read only) ———
  let cmpOpen = false, cmpTimer = null;
  const wide = () => window.innerWidth >= 1100;
  function drawCompare() {
    const d = document.getElementById("v3cmp"); if (!d || !cmpOpen) return;
    const r = cur(), was = wasOf(r), key = was && S[was] ? was : S[r] ? r : "home";
    let html = "";
    try { html = force(false, () => (S[key] ? S[key]() : "")); } catch (e) { html = `<div class="card"><p>v2 could not draw this page: ${esc(e.message)}</p></div>`; }
    if (S[key] && S[key].__v3only) html = `<div class="card v3-off"><p>v2 has no page here: this page is new in V3.</p></div>`;
    const body = d.querySelector(".v3cmp-page"); if (body) body.innerHTML = html;
  }
  function compare(force2) {
    const open = force2 === undefined ? !cmpOpen : !!force2;
    if (open && !wide()) { if (PA.v2) PA.v2.toast("Compare needs a window at least 1,100 pixels wide."); return; }
    cmpOpen = open;
    let d = document.getElementById("v3cmp");
    if (open && !d) {
      d = document.createElement("aside"); d.id = "v3cmp"; d.className = "v3cmp"; d.setAttribute("aria-label", "This page in v2");
      d.innerHTML = `<div class="v3cmp-h"><b>v2</b><span>This page as the prototype draws it now. Read only.</span><button type="button" class="v3cmp-x" data-v3-compare aria-label="Close the v2 comparison">✕</button></div><div class="v3cmp-scroll"><div class="v3cmp-page" inert></div></div>`;
      (proto || document.body).appendChild(d);
    }
    if (proto) proto.classList.toggle("v3cmp-on", open);
    if (d) d.hidden = !open;
    chip();
    if (open) drawCompare();
  }
  const closeCompare = () => { if (cmpOpen) compare(false); };
  const later = () => { clearTimeout(cmpTimer); cmpTimer = setTimeout(drawCompare, 60); };
  window.addEventListener("hashchange", later);
  if (PA.v2.on) PA.v2.on(later);
  window.addEventListener("resize", () => { if (cmpOpen && !wide()) closeCompare(); });

  // ——— Hooks core.js and the hubs layer call ———
  const afterNav = [];
  const navDrawn = (fn) => { afterNav.push(fn); };
  const readyFns = [];
  const ready = (fn) => { readyFns.push(fn); };
  const start0 = PA.start;
  PA.start = function () {
    const out = start0.apply(this, arguments);
    mark(); sweep();
    for (const fn of readyFns) { try { fn(); } catch (e) { console.error(e); } }
    return out;
  };

  const facts = {};
  const fact = (name, ...a) => { const f = facts[name]; if (typeof f !== "function") return undefined; try { return f(...a); } catch (e) { console.error(e); return undefined; } };

  PA.v3 = {
    on, set, refresh, force, S: S3, P: P3, M: M3, screen, redirect, redirectOf, wsx, prog, WSX, facts, fact, menu, FOLDED, MERGED,
    lazyRoute, lazy, compareAs, wasOf,
    rail: null, areaGroups: null, keepProgram: null, navDrawn, ready, compare,
    get toggling() { return toggling; },
    _afterNav(route) { if (!on()) return; for (const fn of afterNav) { try { fn(route); } catch (e) { console.error(e); } } },
  };
  // The Activity page (C28) is a program page in V3; the lane that draws it replaces this placeholder.
  if (PA.navRegister) PA.navRegister({ program: ["activity"] });
  screen("activity", () => h.page(h.header("Activity", "", ""), `<div class="card"><p>The program's event log.</p></div>`), "activity");
})();
