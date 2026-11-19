// Version 7: the redrawn screens become the prototype's screens. This module loads last.
// - Every after-* route gets its canonical name (MAP). The hash, the links and the navigation follow the canonical names,
//   and an after-* address still works: it is rewritten to its canonical name before the screen draws.
// - A route a version-7 module redrew under its own name (PA.own) is left to that module.
// - The Before & after comparison's numbered callouts are hidden (mod-zzz-canon.css).
(function () {
  const PA = window.PA, { S, P, M, ROUTE_NAV, MODED } = PA;
  const OWNED = PA.OWNED || new Set();
  // [after base, canonical base, nav item]. The longest base that matches wins, and a suffix carries over:
  // after-findings-deadlines-vulns -> findings-vulns, after-audit-record-r3-comments -> campaign-r3-comments.
  const MAP = [
    ["after-home", "home", "home"],
    ["after-getting-started", "getting-started", "getting-started"],
    ["after-my-work", "my-work", "my-work"],
    ["after-review-queue", "review-queue", "review-queue"],
    ["after-schedule", "schedule", "schedule"],
    ["after-notifications", "notifications", "notifications"],
    ["after-reports", "reports", "reports"],
    ["after-ai-drafts", "ai-drafts", "ai-drafts"],
    ["after-tests-index", "checks", "checks"],
    ["after-test-page", "check", "checks"],
    ["after-controls-index", "controls", "controls"],
    ["after-control-record", "control-si2", "controls"],
    ["after-frameworks", "frameworks", "frameworks"],
    ["after-audits-index", "assessments", "assessments"],
    ["after-audit-record", "campaign", "assessments"],
    ["after-evidence-index", "evidence", "evidence"],
    ["after-evidence-page", "evidence-page", "evidence"],
    ["after-evidence-sources", "sources", "sources"],
    ["after-policies-index", "policies", "policies"],
    ["after-policy-page", "policy-page", "policies"],
    ["after-policy-editor", "policy-editor", "policies"],
    ["after-integrations-gallery", "integrations", "integrations"],
    ["after-integration", "integration", "integrations"],
    ["after-people-register", "people", "people"],
    ["after-people-roles", "people-roles", "people"],
    ["after-role-task-sets", "people-task-sets", "people"],
    ["after-access-reviews", "people-access", "people"],
    ["after-inventory", "inventory", "inventory"],
    ["after-scope-changes", "inventory-changes", "inventory"],
    ["after-component-record", "component-mc", "components"],
    ["after-risk-register", "risks", "risks"],
    ["after-findings-deadlines", "findings", "findings"],
    ["after-poam-tracker", "poam", "poam"],
    ["after-suppliers-index", "suppliers", "suppliers"],
    ["after-package-room-trust", "package-room", "package-room"],
    ["after-data-calls-questionnaires", "data-calls", "data-calls"],
  ].sort((a, b) => b[0].length - a[0].length);
  // A record pair drew its index screen again with the record's panel first: one canonical screen holds both.
  const EXACT = {
    "after-risk-record": ["risks", "risks"], "after-evidence-record": ["evidence", "evidence"], "after-test-page": ["checks", "checks"],
    "after-policy-record": ["policies", "policies"], "after-integration-drawer": ["integrations", "integrations"],
    "after-person-drawer": ["people", "people"], "after-supplier-record": ["suppliers", "suppliers"],
    "after-access-review": ["people-access", "people"], "after-home-overview": ["overview", "overview"],
  };
  // Old sub-routes no redrawn screen kept: they open the screen that holds their content now.
  const REDIRECT = { "assessments-plans": "assessments", "assessments-results": "assessments-completed" };

  const resolve = (r) => {
    if (EXACT[r]) return EXACT[r];
    for (const [a, c, nav] of MAP) if (r === a || r.startsWith(a + "-")) return [c + r.slice(a.length), nav];
    return null;
  };
  const CANON = {};
  for (const r of Object.keys(S)) if (r.startsWith("after-")) { const x = resolve(r); if (x) CANON[r] = x; }
  const target = (r) => (CANON[r] ? CANON[r][0] : REDIRECT[r] || null);
  const rewrite = (html) => typeof html === "string" ? html.replace(/(data-go="|href="#)(after-[a-z0-9-]+)(?=")/g, (m, pre, r) => { const t = target(r); return t ? pre + t : m; }) : html;
  PA.canon = { target, rewrite, CANON };

  // Canonical screens, drawn by the after screens with their links rewritten.
  for (const [r, [c, nav]] of Object.entries(CANON)) {
    ROUTE_NAV[r] = nav;
    if (OWNED.has(c) || EXACT[r]) { if (!ROUTE_NAV[c] && c !== nav) ROUTE_NAV[c] = nav; continue; }
    const draw = S[r];
    S[c] = () => rewrite(draw()); S[c].__canon = true; S[c].__from = r;
    if (c !== nav) ROUTE_NAV[c] = nav;
  }
  // Every other screen's links, panels and dialogs follow the canonical names too.
  for (const k of Object.keys(S)) if (!k.startsWith("after-") && !S[k].__canon) { const f = S[k]; S[k] = () => rewrite(f()); S[k].__canon = true; }
  for (const k of Object.keys(P)) { const f = P[k]; P[k] = (id) => { const o = f(id); if (o && o.body) o.body = rewrite(o.body); return o; }; }
  for (const k of Object.keys(M)) { const f = M[k]; M[k] = (id) => { const o = f(id); if (o) { if (o.body) o.body = rewrite(o.body); if (o.footer) o.footer = rewrite(o.footer); } return o; }; }
  // A screen the after modules drew in assessment mode (the campaign record and its requests) keeps the dark band under its canonical name.
  if (MODED) for (const r of [...MODED]) if (CANON[r]) MODED.add(CANON[r][0]);

  // Decorations other modules registered (PA.decorate, PA.decoratePanel), applied to the final screens and panels.
  const hit = (m, k) => (m instanceof RegExp ? m.test(k) : m === k);
  for (const k of Object.keys(S)) { const fns = (PA.DECOR || []).filter(([m]) => hit(m, k)).map(([, fn]) => fn); if (!fns.length) continue; const f = S[k]; S[k] = () => fns.reduce((html, fn) => rewrite(fn(html, k)), f()); S[k].__canon = true; if (f.__from) S[k].__from = f.__from; }
  for (const k of Object.keys(P)) { const fns = (PA.PDECOR || []).filter(([m]) => hit(m, k)).map(([, fn]) => fn); if (!fns.length) continue; const f = P[k]; P[k] = (id) => { const o = f(id); if (o && o.body) o.body = fns.reduce((html, fn) => rewrite(fn(html, id, k)), o.body); return o; }; }

  // An after-* or retired address becomes its canonical name before the core draws (core listens after every module).
  const fix = () => {
    const r = (location.hash || "").slice(1), t = target(r);
    if (!t || !S[t]) return;
    try { history.replaceState(null, "", "#" + t); } catch (e) { location.replace("#" + t); }
  };
  window.addEventListener("hashchange", fix);
  fix();
})();
