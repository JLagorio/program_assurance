// After screens for the docs group (a-docs-): Evidence, an evidence artifact, Policies, a policy, writing a policy,
// Integrations, a connector's panel and Evidence sources, each from BA/dev/docs.final.json (its deviations win over
// `after`, and the parts after_flags refutes are left out), drawn with the after kit (window.PA.AK).
// Values are WS-X90's, copied from core.js, mod-compliance.js and mod-platform.js or read from the local database
// (read-only, 17 Nov 2026): evidence reviews and their reasons, requirements, owners, policy documents, imports.
// Anything the data does not hold carries Example.
(function () {
  const { S, P, M, ROUTE_NAV, data, h } = window.PA;
  const AK = window.PA.AK;
  if (!AK) return;
  const { esc, fmt, gl, pill, tag } = h;
  const TODAY = data.TODAY;
  const EX = '<span class="ex">Example</span>';
  const ME = "Ingrid Solberg";
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const D = (iso) => new Date(iso + "T12:00:00");
  const ahead = (iso) => Math.round((D(iso) - TODAY) / 86400000);
  const plus = (iso, n) => { const d = D(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const md = (iso) => `${MON[+iso.slice(5, 7) - 1]} ${+iso.slice(8, 10)}`;
  const mdy = (iso) => `${md(iso)}, ${iso.slice(0, 4)}`;
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const here = () => (location.hash || "#home").slice(1);
  const co = (n) => AK.co(n).replace('class="ak-co"', 'class="ak-co a-docs-co"');
  const ring = (t) => `<span class="who">${gl("ring")}${esc(t)}</span>`;
  const tr = (s, w) => `<span class="a-docs-tr" style="max-width:${w}px" title="${esc(s)}">${esc(s)}</span>`;
  const mu = (t) => `<span class="a-docs-mu">${t}</span>`;
  const num = (n) => `<span class="num">${typeof n === "number" ? fmt(n) : esc(n)}</span>`;
  const go = (r) => `data-go="${esc(r)}"`;
  const btn = (label, attrs = "", ink = false) => `<button type="button" class="btn sm${ink ? " ink" : ""}" ${attrs}>${label}</button>`;
  const big = (label, attrs = "", ink = false) => `<button type="button" class="btn${ink ? " ink" : ""}" ${attrs}>${label}</button>`;
  const lk = (label, attrs = "") => `<button type="button" class="ak-link a-docs-lk" ${attrs}>${label}</button>`;
  const owner = (n) => AK.owner(n || null, { label: "No owner" });
  const nav = (...rs) => rs.forEach((r) => { ROUTE_NAV[r] = "before-after"; });

  // ——— State kept while the prototype is open: chosen rows and quick views ———
  const SEL = {};
  const QS = {};
  const sel = (key, def = []) => SEL[key] || (SEL[key] = new Set(def));
  let openMenu = null;
  function redraw(focus) {
    const r = here();
    if (!S[r]) return;
    const main = document.getElementById("main");
    const top = main.scrollTop;
    closeMenu();
    main.innerHTML = S[r]();
    main.scrollTop = top;
    const el = focus && main.querySelector(focus);
    if (el) el.focus();
  }
  let toastTimer = 0;
  function toast(msg) {
    document.querySelectorAll(".a-docs-toast").forEach((x) => x.remove());
    const t = document.createElement("div");
    t.className = "a-docs-toast";
    t.innerHTML = AK.toast(msg);
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 3200);
  }

  // A ••• or ▾ menu. Its items wait in a <template>, so nothing hidden carries data-panel or data-modal, and the open
  // menu floats over the page (inside #main or #panel, so the core's click handler still runs its items).
  const menu = (label, items, { text = "", ink = false, sm = false } = {}) =>
    `<button type="button" class="btn${sm ? " sm" : ""}${ink ? " ink" : ""} a-docs-mbtn${text ? "" : " icon"}" data-admenu aria-haspopup="menu" aria-expanded="false"${text ? "" : ` aria-label="${esc(label)}" title="${esc(label)}"`}>${text || AK.i("dots")}</button><template>${items
      .map(([l, a, ex]) => `<button type="button" role="menuitem" class="a-docs-mi" ${a || ""}>${esc(l)}${ex ? ` ${EX}` : ""}</button>`).join("")}</template>`;
  function closeMenu(back) {
    if (!openMenu) return;
    const { el, from } = openMenu;
    openMenu = null;
    el.remove();
    from.setAttribute("aria-expanded", "false");
    if (back && from.isConnected) from.focus();
  }
  function toggleMenu(b) {
    const same = openMenu && openMenu.from === b;
    closeMenu();
    if (same) return;
    const tpl = b.nextElementSibling;
    if (!tpl || tpl.tagName !== "TEMPLATE") return;
    const host = b.closest("#panel") || document.getElementById("main");
    const box = host.id === "panel" ? host : document.getElementById("shell");
    const el = document.createElement("div");
    el.className = "a-docs-menu";
    el.setAttribute("role", "menu");
    el.appendChild(tpl.content.cloneNode(true));
    host.appendChild(el);
    const r = b.getBoundingClientRect(), c = box.getBoundingClientRect();
    const w = el.offsetWidth, ht = el.offsetHeight;
    const left = Math.max(8, Math.min(r.right - c.left - w, c.width - w - 8));
    let top = r.bottom - c.top + 6;
    if (top + ht > c.height - 8 && r.top - c.top - ht - 6 > 8) top = r.top - c.top - ht - 6;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    openMenu = { el, from: b };
    b.setAttribute("aria-expanded", "true");
    const first = el.querySelector('[role="menuitem"]');
    if (first) first.focus();
  }
  function countScope(root, g) {
    const out = root.querySelector(`[data-adcount="${CSS.escape(g)}"]`);
    if (!out) return;
    const all = root.querySelectorAll(`[data-adpick="${CSS.escape(g)}"]`);
    const on = [...all].filter((x) => x.getAttribute("aria-pressed") === "true").length;
    out.textContent = `${on} of ${all.length} in scope`;
  }
  function pick(el, value) {
    el.setAttribute("aria-pressed", String(value));
    if (el.hasAttribute("aria-checked")) el.setAttribute("aria-checked", String(value));
  }
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t || !t.closest) return;
    const mb = t.closest("[data-admenu]");
    if (mb) { e.preventDefault(); e.stopPropagation(); toggleMenu(mb); return; }
    if (openMenu) { if (openMenu.el.contains(t)) setTimeout(() => closeMenu(), 0); else closeMenu(); }
    const ts = t.closest("[data-adtoast]");
    if (ts) toast(ts.dataset.adtoast);
    const pe = t.closest("[data-adpe]");
    if (pe) QS.pe = pe.dataset.adpe;
    const full = t.closest('#panel .bar-top button[aria-label="Open the full record"]');
    if (full) {
      const f = document.querySelector("#panel [data-adfull]");
      if (f && f.dataset.adfull) { e.stopPropagation(); location.hash = f.dataset.adfull; }
      return;
    }
    const c = t.closest("[data-adsel]");
    if (c) {
      e.preventDefault(); e.stopPropagation();
      const key = c.dataset.adsel, id = c.dataset.adid, s = sel(key);
      if (id === "*") { const ids = c.dataset.adall.split(","); const all = ids.every((i) => s.has(i)); ids.forEach((i) => (all ? s.delete(i) : s.add(i))); }
      else if (s.has(id)) s.delete(id); else s.add(id);
      redraw(`[data-adsel="${key}"][data-adid="${CSS.escape(id)}"]`);
      return;
    }
    const d = t.closest("[data-addesel]");
    if (d) { e.preventDefault(); e.stopPropagation(); SEL[d.dataset.addesel] = new Set(); redraw(`[data-adsel="${d.dataset.addesel}"][data-adid="*"]`); return; }
    const q = t.closest("[data-adq]");
    if (q) {
      e.preventDefault(); e.stopPropagation();
      QS[q.dataset.adq] = q.dataset.adv;
      redraw(`[data-adq="${q.dataset.adq}"][data-adv="${CSS.escape(q.dataset.adv)}"]`);
      return;
    }
    const cont = t.closest("[data-adcontinue]");
    if (cont) {
      const dlg = cont.closest(".dlg");
      const on = dlg && dlg.querySelector(`[data-adpick="${CSS.escape(cont.dataset.adcontinue)}"][aria-pressed="true"]`);
      const dest = (on && on.dataset.dest) || "";
      e.preventDefault(); e.stopPropagation();
      if (dest.startsWith("route:")) { const [r, fam] = dest.slice(6).split("|"); if (fam) QS.pe = fam; location.hash = r; }
      else if (dest.startsWith("modal:")) {
        const [k, ...rest] = dest.slice(6).split("|");
        const b = document.createElement("button");
        b.type = "button"; b.hidden = true; b.dataset.modal = k; b.dataset.id = rest.join("|");
        dlg.appendChild(b); b.click();
      } else if (dest.startsWith("toast:")) { toast(dest.slice(6)); }
      return;
    }
    const pk = t.closest("[data-adpick]");
    if (pk) {
      const g = pk.dataset.adpick, root = pk.closest(".dlg, .pbody, .main") || document;
      if (pk.hasAttribute("data-radio")) root.querySelectorAll(`[data-adpick="${CSS.escape(g)}"]`).forEach((x) => pick(x, x === pk));
      else pick(pk, pk.getAttribute("aria-pressed") !== "true");
      countScope(root, g);
      return;
    }
    const all = t.closest("[data-adall]");
    if (all) {
      const g = all.dataset.adall, root = all.closest(".dlg, .pbody, .main") || document;
      root.querySelectorAll(`[data-adpick="${CSS.escape(g)}"]`).forEach((x) => pick(x, all.dataset.v === "true"));
      countScope(root, g);
    }
  }, true);
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (openMenu && e.key === "Escape") { e.preventDefault(); closeMenu(true); return; }
    if (openMenu && (e.key === "ArrowDown" || e.key === "ArrowUp") && openMenu.el.contains(t)) {
      e.preventDefault();
      const items = [...openMenu.el.querySelectorAll('[role="menuitem"]')];
      const i = items.indexOf(t);
      const next = items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length];
      if (next) next.focus();
      return;
    }
    if ((e.key === "Enter" || e.key === " ") && t && t.matches && t.matches("[data-adsel], [data-addesel], [data-adq]:not(button), .a-docs-pan [data-panel]:not(button), .a-docs-pan [data-go]:not(button), [data-go].a-docs-step")) {
      e.preventDefault();
      t.click();
    }
  }, true);
  document.addEventListener("scroll", (e) => { if (openMenu && !openMenu.el.contains(e.target)) closeMenu(); }, true);
  // The builder remembers which family it writes only while the reader stays in it; the pair's route opens on AC-1.
  window.addEventListener("hashchange", () => { closeMenu(); if (!/^after-policy-editor/.test(here())) QS.pe = null; });

  // ——— Shared pieces built on the kit ———
  const cb = (key, id, on, label) => `<span class="a-docs-cb" role="checkbox" tabindex="0" aria-checked="${on}" aria-label="${esc(label)}" data-adsel="${esc(key)}" data-adid="${esc(id)}">${AK.check(on)}</span>`;
  const cbAll = (key, ids, label) => {
    const s = sel(key);
    const all = ids.length > 0 && ids.every((i) => s.has(i));
    return `<span class="a-docs-cb" role="checkbox" tabindex="0" aria-checked="${all ? "true" : s.size ? "mixed" : "false"}" aria-label="${esc(label)}" data-adsel="${esc(key)}" data-adid="*" data-adall="${esc(ids.join(","))}">${AK.check(all)}</span>`;
  };
  function tbl({ cols, rows, total, panel = "", nm = 1, cls = "", empty = "Nothing matches this view", pager = true }) {
    const body = rows.length ? rows.map((r) => {
      const p = r.panel !== undefined ? r.panel : panel;
      const attrs = p ? ` data-panel="${esc(p)}" data-id="${esc(r.id)}"` : "";
      return `<tr tabindex="0"${r.sel ? ' class="sel"' : ""}${attrs}>${r.cells.map((c, i) => (c && typeof c === "object" ? `<td colspan="${c.span}">${c.html}</td>` : `<td${i === nm ? ' class="nm"' : ""}>${c}</td>`)).join("")}</tr>`;
    }).join("") : `<tr class="a-docs-empty"><td colspan="${cols.length}">${ring(empty)}</td></tr>`;
    return `<div class="frame ${cls}"><div class="tablebox"><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>${pager ? `<div class="pager"><span class="num">${rows.length ? `1–${rows.length} of ${fmt(total)}` : `0 of ${fmt(total)}`}</span><span>${pager === true ? "25 per page · ‹ ›" : esc(pager)}</span></div>` : ""}</div>`;
  }
  const qv = (key, list) => {
    const on = QS[key] || list[0][0];
    return `<div class="views a-docs-views" role="group" aria-label="Quick views">${list.map(([v, l, n]) => `<button type="button" class="qv a-docs-qv${on === v ? " on" : ""}" aria-pressed="${on === v}" data-adq="${esc(key)}" data-adv="${esc(v)}">${esc(l)}${n != null ? ` <span class="num">${fmt(n)}</span>` : ""}</button>`).join("")}</div>`;
  };
  const filters = (search, list, { add = true, reset = "", extra = "" } = {}) => `<div class="tools a-docs-tools"><span class="in">${esc(search)}</span>${list.map((f) => `<span class="flt">${esc(f)} ⌄</span>`).join("")}${add ? '<span class="flt sub">+ Add filter</span>' : ""}${reset ? `<span class="flt sub">${esc(reset)}</span>` : ""}${extra}<span class="end"><span class="ib" title="Columns">▥</span><span class="ib" title="Settings">⚙</span></span></div>`;
  // While rows are chosen the selection bar takes the filters' place; the search stays, as on Vanta's Documents (1699).
  function selbar(key, search, n, actions, c = "") {
    let html = AK.bulk({ count: n, actions: actions.map((a) => a[0]), co: c });
    html = html.replace('<span class="ak-link">Deselect</span>', `<span class="ak-link" role="button" tabindex="0" data-addesel="${esc(key)}">Deselect</span>`);
    for (const [label, attrs, inner] of actions) html = html.replace(`<span class="btn sm">${esc(label)}</span>`, btn(inner || esc(label), attrs));
    return `<div class="tools a-docs-selbar"><span class="in">${esc(search)}</span>${html}</div>`;
  }
  const banner = (tone, text, action, attrs, c = "") => {
    const html = AK.banner({ tone, text, action, co: c });
    return action ? html.replace(`<span class="btn sm">${esc(action)}</span>`, btn(esc(action), attrs)) : html;
  };
  const addCos = (html, cos) => {
    for (const [lab, n] of Object.entries(cos)) html = html.replace(new RegExp(`(>${reEsc(esc(lab))}(?:<span class="ct num">[^<]*</span>)?)(</span>)`), `$1${co(n)}$2`);
    return html;
  };
  // Line tabs in a panel re-open the same record on another tab; on a full page they switch in place.
  const ptabs = (kind, base, list, cur, cos = {}) => addCos(AK.tabs(list.map(([k, l, n]) => [l, n, "@p:" + k, k === cur]), "Record sections")
    .replace(/data-go="@p:([^"]+)"/g, (m, k) => `data-panel="${kind}" data-id="${esc(base + "|" + k)}"`), cos);
  const qtabs = (key, list, cur, cos = {}) => addCos(AK.tabs(list.map(([k, l, n]) => [l, n, "@q:" + k, k === cur]), "Record sections")
    .replace(/data-go="@q:([^"]+)"/g, (m, k) => `data-adq="${esc(key)}" data-adv="${esc(k)}"`), cos);
  const ownerBtn = (n, what) => `<button type="button" class="a-docs-pick" data-modal="a-docs-owner" data-id="${esc(what)}" title="Change owner">${owner(n)}${AK.i("pen", "a-docs-pen")}</button>`;
  const chipBtn = (text, icon, attrs) => `<button type="button" class="a-docs-chipbtn" ${attrs}>${AK.chip(text, { icon })}</button>`;
  const rowh = (inner) => `<div class="a-docs-rowh">${inner}</div>`;
  const li = (lead, main, end = "") => `<div class="a-docs-li">${lead}<span class="x">${main}</span>${end ? `<span class="a-docs-le">${end}</span>` : ""}</div>`;
  const ul = (items) => `<ul class="a-docs-ul">${items.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  const field = (label, control, hint = "", flag = "") => `<div class="ak-field"><label>${esc(label)}${flag}</label>${control}${hint ? `<span class="s">${hint}</span>` : ""}</div>`;
  const REQ = ' <span class="req">Required</span>';
  const OPT = ' <span class="opt">Optional</span>';
  const select = (v, lead = "") => `<div class="ak-select">${lead}<span>${esc(v)}</span>${AK.i("down")}</div>`;
  const input = (v, filled = true) => `<div class="ak-input a-docs-in${filled ? " v" : ""}">${esc(v)}</div>`;
  const radios = (g, list) => `<div class="a-docs-opts" role="radiogroup">${list.map(([l, hint, on, dest]) => `<button type="button" class="a-docs-opt" role="radio" aria-checked="${!!on}" aria-pressed="${!!on}" data-adpick="${esc(g)}" data-radio${dest ? ` data-dest="${esc(dest)}"` : ""}><span class="a-docs-dot" aria-hidden="true"></span><span>${l}${hint ? `<small>${hint}</small>` : ""}</span></button>`).join("")}</div>`;
  const toggles = (g, list) => `<div class="a-docs-opts">${list.map(([l, hint, on]) => `<button type="button" class="a-docs-tog" role="switch" aria-checked="${!!on}" aria-pressed="${!!on}" data-adpick="${esc(g)}"><span class="a-docs-sw" aria-hidden="true"></span><span>${l}${hint ? `<small>${hint}</small>` : ""}</span></button>`).join("")}</div>`;
  const foot = (primary, attrs = "") => `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-close-modal ${attrs}>${esc(primary)}</button>`;
  const stepFoot = (label, back, next, primary) => `<span class="a-docs-mu num a-docs-stepn">${esc(label)}</span>${back ? `<button type="button" class="btn" ${back}>Back</button>` : '<button type="button" class="btn" data-close-modal>Cancel</button>'}<button type="button" class="btn ink" ${next}>${esc(primary)}</button>`;
  const PEOPLE = [["Ingrid Solberg", ""], ["Joel Barrantes", "ISSM"], ["Priya Raghavan", "ISSO"], ["Ray Colston", "System owner"], ["Nadia Fournier", "Assessor"], ["Wes Duarte", ""], ["Victor Amsel", ""]];

  // ═════════════ Evidence: WS-X90's 368 artifacts ═════════════
  // core.js EVIDENCE is the register's first page; the rest are read from the local database: every artifact's latest
  // version and review (226 accepted, 88 pending with Nadia Fournier, 54 sent back), its owner and the requirement it supports.
  const KINDS = { "Test record": "Test records", Dataset: "Datasets", Document: "Documents", Scan: "Scans" };
  const R_BACK = "Shows the requirement not met on at least one of its components; resubmit once the finding is closed.";
  const R_MORE = "Does not settle the determination; the assessor asked for more before closing it.";
  const R_OK = "Matches the requirement's acceptance criteria and the Block 1 configuration.";
  const TOP_REQ = [["REQ-248", "Clock compared to the authoritative source every 60 seconds"], ["REQ-386", "Confirmed termination of maintenance sessions and network connections"],
    ["REQ-186", "Build toolchain pinned and builds reproducible from the recorded tool set"], ["REQ-518", "Unregistered internal connections left unforwarding"],
    ["REQ-592", "Documented location of protected mission information and the accounts that can reach it"], ["REQ-435", "Disposal of protected storage, key-bearing and maintenance units"]];
  const ev = (id, title, kind, own, collected, state, req, reviewed = null, why = "") => ({ id, title, kind, owner: own, collected, state, req, reviewed, why });
  const EV_TOP = data.EVIDENCE.map(([t, k, o, d], i) => ev(`e${i + 1}`, t, k, o, d, "pending", TOP_REQ[i] || ["REQ", ""]));
  const EV_MINE = [
    ev("m1", "Remote command authentication tag verification test report, LRU-008 and LRU-010 discard counters", "Test record", ME, "2026-11-13", "pending", ["REQ-474", "Remote commands are authenticated at the radio and again at the payload controller"]),
    ev("m2", "Clock synchronisation test report, LRU-005 reference against LRU-001 and LRU-012, four-hour run", "Test record", ME, "2026-11-13", "pending", ["REQ-247", "Single platform time reference held within 50 milliseconds"]),
    ev("m3", "Maintenance session cipher negotiation test report, LRU-003, LRU-007 and LRU-014", "Test record", ME, "2026-11-13", "pending", ["REQ-385", "Maintenance traffic protected with CNSSP 15 Annex B approved algorithms"]),
    ev("m4", "Unauthorised firmware detection and function isolation test, LRU-002 and LRU-013", "Scan", ME, "2026-11-13", "pending", ["REQ-586", "Continuous detection of unauthorised software and firmware, with isolation of the affected function"]),
    ev("m5", "Sanitisation and contamination-trace procedure, LRU-015 region clearing and LRU-020 baseline query", "Document", ME, "2026-11-12", "pending", ["REQ-326", "Spill eradication with a cleared-region record and a baseline contamination trace"]),
  ];
  const EV_BACK = [
    ev("b1", "PIV path build and revocation check test report, LRU-017 and LRU-019", "Test record", null, "2026-10-08", "needs_revision", ["REQ-603", "Electronic verification of a PIV-compliant credential before account binding"], "2026-11-13", R_MORE),
    ev("b2", "External exchange agreement register with interim-approval exceptions", "Document", null, "2026-11-10", "needs_revision", ["REQ-508", "No external exchange enabled without a signed exchange agreement"], "2026-11-13", R_BACK),
    ev("b3", "Non-privileged authentication method inventory, LRU-019 and LRU-017 baselines", "Test record", null, "2026-09-29", "needs_revision", ["REQ-599", "Hardware credential and PIN for non-privileged ground support sessions"], "2026-11-13", R_BACK),
    ev("b4", "Switch port authentication state export, LRU-009 with LRU-002 boot measurement bindings", "Dataset", null, "2026-10-13", "needs_revision", ["REQ-604", "Mutual certificate authentication before a switch port joins the mission VLAN"], "2026-11-13", R_BACK),
    ev("b5", "Privileged maintenance tool invocation log extract, LRU-014 to LRU-018", "Document", null, "2026-11-10", "needs_revision", ["REQ-379", "Privileged maintenance tool use monitored and alerted"], "2026-11-11", R_BACK),
    ev("b6", "Remote privileged command admission test report, approved list, attestation and window checks", "Test record", null, "2026-11-10", "needs_revision", ["REQ-470", "Remote privileged maintenance commands pass three admission checks"], "2026-11-11", R_BACK),
  ];
  const EV_OK = [
    ev("a1", "Key store containment test report, LRU-003 export attempts and handle-only interface trace", "Test record", null, "2026-11-10", "accepted", ["REQ-243", "Cryptographic keys held only in the hardware key store"], "2026-11-13", R_OK),
    ev("a2", "Replay resistance test report, LRU-007 gateway and LRU-008 link authentication", "Test record", null, "2026-10-06", "accepted", ["REQ-602", "Nonce-bound authentication that refuses a replayed exchange"], "2026-11-13", R_OK),
    ev("a3", "Separate-device factor test report, LRU-014 and LRU-019 local, network and remote paths", "Test record", null, "2026-10-01", "accepted", ["REQ-601", "One authentication factor from a device separate from the endpoint being accessed"], "2026-11-13", R_OK),
    ev("a4", "Receiving inspection attestations, 24 units of LRU-004 / LRU-006 / LRU-008", "Document", null, "2026-11-10", "accepted", ["REQ-431", "Receiving inspection for tamper on delivered navigation and radio units"], "2026-11-13", R_OK),
    ev("a5", "IA policy and IA procedure set, revision 2.4, signed export with review-flag report", "Document", null, "2026-09-15", "accepted", ["REQ-597", "IA policy and procedure set held signed with an annual review flag"], "2026-11-12", R_OK),
    ev("a6", "Privileged two-factor enforcement test report, LRU-013 and LRU-014, build 4.2.1", "Test record", null, "2026-09-22", "accepted", ["REQ-598", "Two distinct factors before any privileged administrative command"], "2026-11-12", R_OK),
  ];
  const EV_ALL = [...EV_TOP, ...EV_MINE, ...EV_BACK, ...EV_OK];
  // v2 (F) [B10, the re-review's new high]: an artifact Upload or Add link added in the session (evx.add) and a review Save review
  // recorded (evx.rev.<id>, mod-zzzz-v2-4wire.js) read here at draw time, so the register's rows, its quick views, the preview
  // and a requirement's chain agree on each artifact's review.
  const V2 = () => window.PA.v2 || null;
  const added = () => ((V2() && V2().get("evx.add", null)) || []).map((x) => ev(x.id, x.title, x.kind, x.owner, x.collected, "pending", x.req || ["", ""]));
  const cur = (r) => { const x = V2() && V2().get("evx.rev." + r.id, null); return x ? { ...r, state: x.state, reviewed: x.at, why: x.why || (x.state === "accepted" ? R_OK : R_BACK) } : r; };
  const allNow = () => [...added(), ...EV_ALL].map(cur);
  const evById = (id) => allNow().find((r) => r.id === id) || cur(EV_TOP[0]);
  // v2 (F): a requirement's chain opens an artifact the register lists by its title.
  window.PA.evLookup = { byTitle: (t) => allNow().find((r) => r.title === t) || null, all: allNow };
  const LATEST = { pending: ["warn", "Pending review"], needs_revision: ["bad", "Needs revision"], accepted: ["ok", "Accepted"] };
  const latest = (r) => pill(LATEST[r.state][0], LATEST[r.state][1]);
  const evq = () => {
    const a = added(), moved = [...a, ...EV_ALL].map((r) => [r, cur(r)]).filter(([r, c]) => r.state !== c.state);
    const d = (k) => moved.filter(([, c]) => c.state === k).length - moved.filter(([r]) => r.state === k).length;
    return [["all", "All", 368 + a.length], ["mine", "Owned by me", 27 + a.filter((r) => r.owner === ME).length], ["approval", "Requires my approval", 0], ["pending", "Pending review", 88 + a.length + d("pending")], ["revision", "Needs revision", 54 + d("needs_revision")], ["accepted", "Accepted", 226 + d("accepted")]];
  };
  const evView = (v) => {
    const a = added(), st = (list, k) => list.map(cur).filter((r) => r.state === k);
    const moved = (k) => [...a, ...EV_TOP, ...EV_MINE, ...EV_BACK, ...EV_OK].filter((r) => r.state !== k && cur(r).state === k);
    return ({ all: [...a, ...EV_TOP].map(cur), mine: [...a.filter((r) => r.owner === ME), EV_TOP[0], ...EV_MINE].map(cur), approval: [], pending: st([...a, ...EV_TOP], "pending"),
      revision: st([...moved("needs_revision"), ...EV_BACK], "needs_revision"), accepted: st([...moved("accepted"), ...EV_OK], "accepted") })[v] || [...a, ...EV_TOP].map(cur);
  };
  const evRowMenu = (r) => menu(`Row actions for ${r.title}`, [["Open", `data-panel="a-docs-ev" data-id="${r.id}|evidence"`], ["Assign owner", `data-modal="a-docs-owner" data-id="${esc(r.title)}"`],
    ["Mark not applicable", `data-modal="ak-reason" data-id="Mark not applicable|The artifact leaves the register's counts until the end date. The reason shows on the record and in History."`]], { sm: true });

  function evRegister(key, withCo) {
    const v = QS[key] || "all";
    const rows = evView(v), Q = evq(), pend = Q[3][2];
    const total = (Q.find((x) => x[0] === v) || Q[0])[2];
    const s = sel(key, withCo ? ["e1", "e2"] : []);
    const c = (n) => (withCo ? co(n) : "");
    const n = s.size;
    const actions = `${menu("More evidence actions", [["View not applicable", 'data-adtoast="No artifact is marked not applicable yet"'], ["Export all", 'data-adtoast="Exporting 368 artifacts as CSV"'], ["Import evidence", 'data-modal="a-docs-upload" data-id="import|"']])}${menu("Add evidence", [["Upload a file", 'data-modal="a-docs-upload" data-id="upload|"'], ["Add a link", 'data-modal="a-docs-upload" data-id="link|"'], ["Import from evidence sources", 'data-modal="a-docs-upload" data-id="import|"']], { text: `Add evidence ${AK.i("down")}`, ink: true })}`;
    return h.page(
      h.header("Evidence", "", actions),
      banner("warn", `<b>${fmt(pend)} artifacts</b> are pending review, waiting on Nadia Fournier.`, "View", `data-adq="${key}" data-adv="pending"`, c(1)),
      qv(key, Q),
      n ? selbar(key, "Search evidence", n, [["Assign owner", `data-modal="a-docs-owner" data-id="${n} artifact${n === 1 ? "" : "s"}"`, `Assign owner ${AK.i("down")}`]], c(2))
        : filters("Search evidence", ["Kind", "Status", "Latest version", "Owner", "Renew by"], { reset: "Reset view" }),
      tbl({
        cols: [cbAll(key, rows.map((r) => r.id), "Select every artifact on this page"), "Evidence", "Kind", "Owner", `<span class="a-docs-th">Status${c(3)}</span>`, "Latest version", "Renew by", '<span class="a-docs-sr">Row actions</span>'],
        rows: rows.map((r) => ({ id: `${r.id}|evidence`, sel: s.has(r.id), cells: [cb(key, r.id, s.has(r.id), `Select ${r.title}`), tr(r.title, 350), tag(r.kind), owner(r.owner), pill("none", "No renewal set"), latest(r), ring("Not set"), evRowMenu(r)] })),
        total, panel: "a-docs-ev", cls: "a-docs-tight a-docs-evt",
        empty: v === "approval" ? "Nothing waits on your approval: Nadia Fournier reviews WS-X90's evidence" : "Nothing matches this view",
      }),
      `<p class="note-p">Rows, counts, owners and the reviewer are WS-X90's. Owned by me counts the 27 artifacts Ingrid Solberg owns; Renew by reads Not set, as our register shows it today.</p>`,
    );
  }
  S["after-evidence-index"] = () => evRegister("ev", true);
  S["after-evidence-record"] = () => evRegister("ev-record", false);

  // ——— An evidence artifact: a wide panel, or a page from ↗ ———
  const fileOf = (r) => `${r.title.split(",")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 44)}.${r.kind === "Dataset" ? "csv" : "pdf"}`;
  const askLine = (r) => r.id === "e1"
    ? `Asked by <b>REQ-248</b>: comparison records no more than 60 seconds apart across a one-hour capture, and an injected 1.5-second offset corrected and logged with before and after values.`
    : `Asked by <b>${esc(r.req[0])}</b>: ${esc(r.req[1])}.`;
  function evEvidence(r, c) {
    const reason = r.state === "needs_revision"
      ? AK.reasonCard({ question: "Sent back for revision", reason: r.why, who: "Nadia Fournier, Assessor", when: mdy(r.reviewed), action: "Upload revision" })
        .replace('<span class="btn sm">Upload revision</span>', btn("Upload revision", `data-modal="a-docs-upload" data-id="upload|${r.id}"`, true))
      : "";
    const renewal = AK.card(`${rowh(`${gl("ring")}<b>No renewal set</b>${c(3)}<span class="a-docs-push">${btn("Set renewal", `data-modal="a-docs-renewal" data-id="${r.id}"`)}</span>`)}<p class="a-docs-p">Repeat it from the collection date, with a task for the owner before it falls due. Once set, this card counts down to the renewal and turns red when it is past.</p>`, { cls: "a-docs-renew" });
    const decision = r.state === "pending"
      ? AK.awaiting("Nadia Fournier", ["Accept", "Send back"]).replace("Pending approval from", "Pending review by")
        .replace('<span class="btn sm ink">Accept</span>', btn("Accept", `data-modal="a-docs-review" data-id="${r.id}|accept"`, true))
        .replace('<span class="btn sm">Send back</span>', btn("Send back", `data-modal="a-docs-review" data-id="${r.id}|back"`))
      : r.state === "accepted"
        ? `<div class="a-docs-dec">${gl("check")}<span>Accepted by <b>Nadia Fournier</b> on ${md(r.reviewed)}: ${esc(r.why)}</span></div>`
        : `<div class="a-docs-dec">${gl("diamond")}<span>Sent back by <b>Nadia Fournier</b> on ${md(r.reviewed)}</span></div>`;
    const ver = AK.card(`
      <div class="a-docs-verh"><span class="a-docs-veri ${r.state}">${AK.i(r.state === "accepted" ? "check" : r.state === "needs_revision" ? "flag" : "clock")}</span><div class="a-docs-vert"><div class="a-docs-rowt"><b>Version 1</b>${latest(r)}${c(2)}</div><span class="a-docs-mu">Collected ${md(r.collected)}${r.owner ? ` · added by ${esc(r.owner)}` : ""}</span></div></div>
      <div class="a-docs-file"><span class="a-docs-fi">${h.icon("evidence")}</span><div class="x"><span class="a-docs-fn"><b>${esc(fileOf(r))}</b>${EX}</span><span class="a-docs-mu">Effective ${md(r.collected)} · ${r.kind === "Dataset" ? "CSV" : "PDF"} · ${r.owner ? `Added by ${esc(r.owner)}` : "Owner not recorded"}</span></div><span class="a-docs-ibs"><button type="button" class="a-docs-ib" aria-label="Replace the file" data-modal="a-docs-upload" data-id="upload|${esc(r.id)}">${AK.i("upload")}</button></span></div>
      ${decision}`, { cls: "a-docs-ver" });
    const start = `<div class="a-docs-start"><b>Start version 2</b><span class="a-docs-acts">${btn(`${AK.i("upload")}Upload`, `data-modal="a-docs-upload" data-id="upload|${r.id}"`)}${btn(`${AK.i("link")}Add link`, `data-modal="a-docs-upload" data-id="link|${r.id}"`)}${btn("Import from evidence sources", `data-modal="a-docs-upload" data-id="import|${r.id}"`)}</span><span class="a-docs-mu">Each asks an effective date.</span></div>`;
    const prior = `<p class="a-docs-prior">${AK.i("history")}<span>No prior versions</span>${mu("Earlier versions show here")}</p>`;
    const note = r.id === "e1" ? "The file name, the comments and the request in History are invented; the requirement, owner, reviewer and dates are WS-X90's."
      : `The file name is invented; the requirement, ${r.owner ? "owner, " : ""}review${r.why ? ", its reason" : ""} and dates are WS-X90's.`;
    return `${reason}${renewal}${ver}${start}${prior}${AK.note(note)}`;
  }
  function evCited(r) {
    const e1 = r.id === "e1";
    return AK.card(`${rowh(`<span class="ak-code">${esc(r.req[0])}</span><b>${esc(r.req[1])}</b>`)}
      ${e1 ? `${mu("Acceptance criteria")}${ul(["Comparison records appear at no more than 60-second spacing across a one-hour capture with no gaps.", "An injected 1.5-second offset is corrected and the correction is logged with before and after values.", "The unpropagated holdover marking on the navigation output message is recorded as an open gap."].map(esc))}
        ${li(mu("Maps"), `<span class="ak-code">SC-45(1)</span> Synchronization with Authoritative Time Source`)}` : `<p class="a-docs-p">The controls it maps show on the requirement's record.</p>`}`);
  }
  function evTasks(r) {
    return AK.empty({ title: "No tasks yet", line: "A task gives someone part of this record to do, such as collecting version 2 before the renewal date.", action: "Create task" })
      .replace('<span class="btn sm ink">Create task</span>', btn("Create task", `data-modal="a-docs-task" data-id="${r.id}"`, true));
  }
  function evComments(r) {
    if (r.id !== "e1") return AK.comments({ you: ME, items: [] });
    return AK.comments({ you: ME, items: [
      { who: "Nadia Fournier", role: "Assessor", when: "Nov 16, 09:40", text: `The report shows the injected 1.5-second offset but not the alert it should raise; add the alert log. ${AK.mention("Ingrid Solberg")}` },
      { who: "Ingrid Solberg", when: "Nov 16, 14:05", text: "Adding the alert export as version 2." },
    ] }) + AK.note("The comments are invented.");
  }
  function evHistory(r) {
    const items = [{ who: r.owner, what: "added <b>version 1</b>", when: md(r.collected) }];
    if (r.state === "pending") items.push({ who: r.owner, what: `sent it for review to <b>Nadia Fournier</b> ${EX}`, when: md(r.collected) });
    else items.push({ who: "Nadia Fournier", what: `${r.state === "accepted" ? "accepted it" : "sent it back"}: “${esc(r.why)}”`, when: md(r.reviewed) });
    return `${AK.activity(items)}<p class="a-docs-p a-docs-mu">Each review, owner change, renewal and change of state joins this list, with who, when and why.</p>`;
  }
  function evRecord(r, tab, mode, pair) {
    const c = (n) => (pair ? co(n) : "");
    const primary = r.state === "pending" ? btn("Review", `data-modal="a-docs-review" data-id="${r.id}"`, true)
      : r.state === "needs_revision" ? btn("Upload revision", `data-modal="a-docs-upload" data-id="upload|${r.id}"`, true)
        : btn("Start version 2", `data-modal="a-docs-upload" data-id="upload|${r.id}"`, true);
    const head = AK.recordHead({
      crumbs: [["Evidence", "after-evidence-index"], [KINDS[r.kind] || r.kind]],
      title: r.title, desc: askLine(r),
      facts: [["Owner", ownerBtn(r.owner, r.title)], ["Review", latest(r)], ["Renew", chipBtn("Not set", "calendar", `data-modal="a-docs-renewal" data-id="${r.id}"`)], ["Kind", tag(r.kind)], ["Collected", md(r.collected)]],
      actions: `${menu("More evidence actions", [["Manage subscribers", `data-modal="a-docs-subs" data-id="${r.id}"`], ["Create task", `data-modal="a-docs-task" data-id="${r.id}"`],
        ["Mark not applicable", `data-modal="ak-reason" data-id="Mark not applicable|The artifact leaves the register's counts until the end date. The reason shows on the record and in History."`], ["Download", 'data-adtoast="Downloading version 1"']])}${primary}${r.state === "pending" ? c(5) : ""}`,
    }).replace("</h2>", `${c(1)}</h2>`);
    const list = [["evidence", "Evidence"], ["cited", "Cited by", 1], ["tasks", "Tasks", 0], ["comments", "Comments", r.id === "e1" ? 2 : 0], ["history", "History"]];
    const strip = mode === "panel" ? ptabs("a-docs-ev", r.id, list, tab, pair ? { Tasks: 6, Comments: 4 } : {}) : qtabs(`evp-${r.id}`, list, tab);
    const body = tab === "cited" ? evCited(r) : tab === "tasks" ? evTasks(r) : tab === "comments" ? evComments(r) : tab === "history" ? evHistory(r) : evEvidence(r, c);
    return `<div class="a-docs-pan${mode === "panel" ? " a-docs-wide" : " a-docs-page"}"${mode === "panel" && S[`after-evidence-page-${r.id}`] ? ` data-adfull="after-evidence-page-${r.id}"` : ""}>${head}${strip}${body}</div>`;
  }
  P["a-docs-ev"] = (id) => {
    const [rid, tab] = String(id || "").split("|");
    const r = evById(rid);
    return { label: "Evidence", body: evRecord(r, tab || "evidence", "panel", r.id === "e1" && here() === "after-evidence-record") };
  };
  EV_ALL.forEach((r) => { S[`after-evidence-page-${r.id}`] = () => h.page(evRecord(evById(r.id), QS[`evp-${r.id}`] || "evidence", "page", false)); nav(`after-evidence-page-${r.id}`); });

  // ═════════════ Policies: the -1 control of each family in WS-X90's baseline (mod-compliance.js POL) ═════════════
  const POL = [
    ["AC-1", "Access control", "partially_satisfied", "REQ-436", "WS-X90 access control policy and procedure baseline, LRU-020 signed export", "needs_revision", "Revision 3.2", "2026-09-18", "2027-03-18", "Wes Duarte"],
    ["AT-1", "Awareness and training", "no_evidence", "REQ-534"],
    ["AU-1", "Audit and accountability", "partially_satisfied", "REQ-344", "WS-X90 audit and accountability policy and procedure set, approval record", "needs_revision", "Revision 4.2", "2026-09-15", "2027-03-15"],
    ["CA-1", "Assessment, authorization and monitoring", "satisfied", "REQ-505", "Assessment, authorization and continuous monitoring procedure set, with approver record", "accepted", "Revision 2.4", "2026-10-08", "2027-04-08"],
    ["CM-1", "Configuration management", "partially_satisfied", "REQ-559", "WS-X90 configuration management policy and CM procedure set, with dissemination record", "needs_revision", "Revision 4.0", "2026-09-11", "2027-03-11"],
    ["CP-1", "Contingency planning", "satisfied", "REQ-481", "WS-X90 contingency planning policy and recovery procedure set, with distribution record", "accepted", "Revision 3.1", "2026-09-18", "2027-03-18"],
    ["IA-1", "Identification and authentication", "not_assessed", "REQ-597", "IA policy and IA procedure set, signed export with review-flag report", "accepted", "Revision 2.4", "2026-09-15", "2027-03-15"],
    ["IR-1", "Incident response", "partially_satisfied", "REQ-298", "Signed revision manifest for the WS-X90 incident response policy and procedure set", "needs_revision", null, "2026-09-14", "2027-03-14"],
    ["MA-1", "Maintenance", "no_evidence", "REQ-372"],
    ["MP-1", "Media protection", "not_assessed", "REQ-631", "Media protection policy and procedure set export, with review-overdue report", "pending", "Revision 2.3", "2026-09-17", "2027-03-17", "Priya Raghavan"],
    ["PE-1", "Physical and environmental protection", "no_evidence", "REQ-390"],
    ["PL-1", "Planning", "no_evidence", "REQ-547"],
    ["PS-1", "Personnel security", "partially_satisfied", "REQ-330", "Personnel security policy revision manifest and dissemination list", "needs_revision", null, "2026-09-15", "2027-03-15"],
    ["RA-1", "Risk assessment", "no_evidence", "REQ-520"],
    ["SA-1", "System and services acquisition", "partially_satisfied", "REQ-121", "WS-X90 acquisition policy and procedure issue record, LRU-020 revision index", "needs_revision", null, "2026-09-10", "2027-03-10"],
    ["SC-1", "System and communications protection", "partially_satisfied", "REQ-193", "SC policy and procedure baseline record, object SCP-BASE-3", "needs_revision", "Issue 2026-09", "2026-09-10", "2027-03-10"],
    ["SI-1", "System and information integrity", "partially_satisfied", "REQ-251", "WS-X90 system and information integrity policy and procedure set, signed 2026-09-11", "needs_revision", "Edition 3", "2026-09-11", "2027-03-11"],
    ["SR-1", "Supply chain risk management", "no_evidence", "REQ-415"],
  ];
  const POL_EX = [
    ["IR-8", "Incident response plan", "WS-X90 incident response plan", "accepted", "Version 2", "Joel Barrantes", "2027-06-30", "Priya Raghavan"],
    ["CP-2", "Contingency plan", "WS-X90 contingency plan and recovery playbooks", "pending", "Version 3", "R. Calloway", "2027-04-30", "Amara Bell"],
    ["CM-9", "Configuration management plan", "WS-X90 configuration management plan", "accepted", "Version 1.4", "Joel Barrantes", "2027-08-15", "Ingrid Solberg"],
  ];
  // Each document's latest review, from evidence_reviews: who decided it and when (MP-1's is still pending, asked Nov 13).
  const REVIEWED = { "AC-1": "2026-10-24", "AU-1": "2026-10-13", "CA-1": "2026-11-01", "CM-1": "2026-11-07", "CP-1": "2026-10-30", "IA-1": "2026-11-12", "IR-1": "2026-10-07", "PS-1": "2026-10-11", "SA-1": "2026-09-16", "SC-1": "2026-09-23", "SI-1": "2026-10-01" };
  const POLST = { accepted: ["ok", "Approved"], pending: ["warn", "In review"], needs_revision: ["bad", "Sent back"] };
  const polPill = (r) => (r ? pill(POLST[r][0], POLST[r][1]) : pill("none", "No document"));
  const ST = { satisfied: ["ok", "Satisfied"], partially_satisfied: ["part", "Partially satisfied"], other_than_satisfied: ["bad", "Other than satisfied"], not_assessed: ["info", "Not assessed"], no_evidence: ["none", "No evidence"], no_requirement: ["none", "No requirement"] };
  const stPill = (s) => pill(ST[s][0], ST[s][1]);
  const renewCell = (iso) => (ahead(iso) <= 120 ? `<span class="a-docs-soon" title="Renew by within 120 days">${AK.i("clock")}${md(iso)}</span>` : num(md(iso)));
  const polCode = (code) => code.toLowerCase();
  // v2: five quick views, counted. No approver says what v1's banner said (12 policies have a document and no approver);
  // In review and Approved are values of the Latest version filter.
  const PQ = [["all", "All", 21], ["mine", "Needs my approval", 0], ["back", "Sent back", 8], ["nodoc", "No document", 6], ["noappr", "No approver", 12]];
  const polKeep = (v) => ({ all: () => true, mine: () => false, back: (p) => p[5] === "needs_revision", review: (p) => p[5] === "pending", nodoc: (p) => !p[4], ok: (p) => p[5] === "accepted", noappr: (p) => !!p[4] })[v] || (() => true);
  // v2: a policy's control status is a glyph and an ink word, as Vanta draws Overall policy status; the one pill a row is
  // the latest version's state.
  const ST_GL = { satisfied: "check", partially_satisfied: "part", other_than_satisfied: "diamond", not_assessed: "ring", no_evidence: "ring", no_requirement: "ring" };
  const stInk = (s) => `<span class="v2l-st">${gl(ST_GL[s] || "ring")}<span>${esc(ST[s][1])}</span></span>`;

  function polRows(v, c) {
    let first = true;
    const rows = POL.filter(polKeep(v)).map(([code, fam, s, , t, r, ver, , renew, own]) => {
      const name = `<span class="a-docs-pn${t ? "" : " a-docs-off"}">${tr(fam, 172)}${tag(code)}</span>`;
      if (!t) {
        const cc = first ? c(4) : "";
        first = false;
        return { id: `${code}|versions`, cells: [name, stInk(s), { span: 5, html: `<span class="a-docs-split">${pill("none", "No document")}<span class="a-docs-push">${btn("Start", `data-modal="a-docs-start" data-id="${code}"`)}${cc}</span></span>` }] };
      }
      // v2: Renew by is a plain day (v1 drew the next 120 days amber), so a row tones two cells at most: the status glyph
      // and the version's pill. An empty value is a dash; nobody has acknowledged a policy yet, said without a ring.
      return { id: `${code}|versions`, cells: [name, stInk(s), `<span class="a-docs-lv">${ver ? esc(ver) : mu("—")}${polPill(r)}</span>`, mu("—"), num(md(renew)), mu("0 of 23"), owner(own)] };
    });
    const ex = v === "all" || v === "ok" || v === "review"
      ? POL_EX.filter(([, , , r]) => v === "all" || (v === "ok" ? r === "accepted" : r === "pending")).map(([code, fam, , r, ver, ap, renew, own]) => ({ id: `${code}|versions`, cells: [`<span class="a-docs-pn">${tr(fam, 108)}${EX}${tag(code)}</span>`, stInk("not_assessed"), `<span class="a-docs-lv">${esc(ver)}${polPill(r)}</span>`, owner(ap), num(md(renew)), mu("0 of 23"), owner(own)] }))
      : [];
    return rows.concat(ex);
  }
  function polRegister(key, withCo) {
    const v = QS[key] || "all";
    const c = (n) => (withCo ? co(n) : "");
    const rows = polRows(v, c);
    // v2: no banner on the register: its count is the No approver quick view and its action, Assign approvers, is in the ⋯
    // menu (and beside the filters while No approver is shown). One toolbar line: four filters and + Add filter; the
    // Require my approval box repeated the Needs my approval quick view, and the order is said under the table.
    const assign = 'data-modal="a-docs-approvers" data-id="the 12 policies with a document"';
    return h.page(
      h.header("Policies", "<span>Policy and procedures for each family, the -1 controls</span><span>18 families in WS-X90's baseline</span>",
        `${menu("More policy actions", [["Assign approvers", assign], ["Download policy packet", 'data-adtoast="Packing the 12 policy documents into one PDF"'], ["Bulk replace text", 'data-modal="a-docs-bulk"', true], ["Renewal SLA: every 6 months", 'data-modal="a-docs-sla"'], ["Download acknowledgment history", 'data-adtoast="Downloading the acknowledgment history as CSV"']])}${c(5)}${big("Create policy", 'data-modal="a-docs-start" data-id=""', true)}`),
      qv(key, PQ),
      filters("Search policies", ["Family", "Control status", "Latest version", "Owner"], { extra: v === "noappr" ? btn("Assign approvers", assign) : "" }),
      tbl({
        cols: ["Policy", `<span class="a-docs-th">Control status${c(3)}</span>`, "Latest version", "Approver", "Renew by", `<span class="a-docs-th2"><span>Acknowledged</span><span class="a-docs-th">${EX}${c(2)}</span></span>`, "Owner"],
        rows, total: v === "all" ? 21 : rows.length, panel: "a-docs-pol", nm: 0, cls: "a-docs-tight a-docs-polt",
        empty: v === "mine" ? "No policy version waits on your approval" : "Nothing matches this view", pager: "Sorted by family",
      }),
      AK.note("Acknowledged counts are invented, and so are the three plans IR-8, CP-2 and CM-9. The 18 families, their -1 control status, documents, versions, owners and renewal dates are WS-X90's."),
    );
  }
  S["after-policies-index"] = () => polRegister("pol", true);
  S["after-policy-record"] = () => polRegister("pol-record", false);

  // ——— A policy: a wide panel, or a page from ↗ ———
  function approvalBlock(code, fam, r, c) {
    const when = REVIEWED[code];
    const st1 = r === "needs_revision" ? { state: "changes", when: md(when) } : r === "accepted" ? { state: "approved", when: md(when) } : { state: "sent", when: "Nov 13" };
    let html = AK.approval({
      title: "Approval", co: c(3),
      sub: r === "needs_revision" ? "Sent back at step 1. Upload a revision and submit it again." : r === "accepted" ? "Step 1 accepted. The ISSM's approval is not recorded yet." : "Waiting on step 1.",
      steps: [{ label: "Step 1 · Evidence review", approvers: [{ who: "Nadia Fournier", role: "Assessor", ...st1 }] }, { label: "Step 2 · ISSM", approvers: [{ who: "Joel Barrantes", role: "ISSM", state: "waiting" }] }],
    });
    html = html.replace("Changes requested", "Sent back").replace('<span class="t">Not started</span>', `<span class="t">${r === "accepted" ? "Not recorded" : "Not requested"}</span>${EX}`);
    const asApprover = r === "pending"
      ? `<div class="a-docs-asap"><span class="a-docs-mu">What Nadia Fournier sees</span>${AK.awaiting("Nadia Fournier", ["Approve", "View file"])
        .replace('<span class="btn sm ink">Approve</span>', btn("Approve", `data-modal="a-docs-approve" data-id="${code}|1"`, true)).replace('<span class="btn sm">View file</span>', btn("View file", 'data-adtoast="Opening the document"'))}</div>`
      : "";
    const next = r === "needs_revision" ? `<div class="btns">${btn("Assign approvers and submit", `data-modal="a-docs-approvers" data-id="the next revision of the ${esc(fam.toLowerCase())} policy"`)}</div>` : "";
    return html.replace(/<\/div>$/, `${asApprover}${next}</div>`);
  }
  const rung = (l, n, of) => `<div class="a-docs-rung"><span>${esc(l)}</span>${h.bar(Math.round((n / of) * 100))}<b class="num">${n} of ${of}</b></div>`;
  function polVersions(p, c) {
    const [code, fam, , req, t, r, ver, coll, renew, own] = p;
    if (!t) {
      return AK.card(`${rowh(`${gl("ring")}<b>No document yet</b>`)}<p class="a-docs-p">${esc(req)} asks for this policy. Start it in the policy editor, upload a file, or sync one.</p><div class="btns">${btn("Use the policy editor", `${go("after-policy-editor")} data-adpe="${code}"`, true)}${btn("Upload a file", `data-modal="a-docs-upload" data-id="policy|${code}"`)}${btn(`Sync a file ${EX}`, 'data-adtoast="Sync a file is an example"')}</div>`);
    }
    const reason = r === "needs_revision"
      ? AK.reasonCard({ question: "Sent back for revision", reason: R_BACK, who: "Nadia Fournier, Assessor", when: mdy(REVIEWED[code]), action: "Upload revision" })
        .replace('<span class="btn sm">Upload revision</span>', btn("Upload revision", `data-modal="a-docs-upload" data-id="policy|${code}"`, true))
      : "";
    const renewal = AK.card(`<details class="a-docs-rdet" open><summary>${rowh(`<span class="a-docs-ren-i">${AK.i("history")}</span><b>Renew before ${mdy(renew)}</b>${mu(`in ${ahead(renew)} days`)}${c(4)}<span class="a-docs-push a-docs-chev">${AK.i("down")}</span>`)}</summary>
      <div class="a-docs-rbody"><p class="a-docs-p">Update the policy, or renew it as it stands.</p><div class="btns">${btn("Update and renew", `${go("after-policy-editor")} data-adpe="${code}"`)}${btn("Renew without changes", `data-modal="a-docs-renew" data-id="${code}|1"`)}</div></div></details>`, { cls: "a-docs-renew" });
    const card = AK.card(`
      <div class="a-docs-verh"><span class="a-docs-veri ${r}">${AK.i(r === "accepted" ? "check" : r === "needs_revision" ? "flag" : "clock")}</span><div class="a-docs-vert"><div class="a-docs-rowt"><b>${ver ? esc(ver) : "Version not stated"}</b>${polPill(r)}${c(2)}</div><span class="a-docs-mu">Collected ${md(coll)} · ${own ? esc(own) : "No owner"}</span></div></div>
      <div class="a-docs-file"><span class="a-docs-fi">${h.icon("evidence")}</span><div class="x"><b>${esc(t)}</b><span class="a-docs-mu">Document · collected ${md(coll)} · expires ${mdy(renew)}</span></div>${btn("View", 'data-adtoast="Opening the document"')}</div>
      ${reason}${approvalBlock(code, fam, r, c)}`, { cls: "a-docs-ver" });
    return `${renewal}${card}<p class="a-docs-prior">${AK.i("history")}<span>No prior versions recorded</span></p>`;
  }
  function polRecord(code, tab, mode, pair) {
    const c = (n) => (pair ? co(n) : "");
    const ex = POL_EX.find((x) => x[0] === code);
    if (ex) {
      const [, fam, t, r, ver, ap, renew, own] = ex;
      const head = AK.recordHead({ crumbs: [["Policies", "after-policies-index"], [fam]], title: t, chip: `${polPill(r)}${EX}`, desc: `An owned plan beside the -1 policies, under ${esc(code)}.`,
        facts: [["Control", tag(code)], ["Version", esc(ver)], ["Approver", owner(ap)], ["Renew by", `<span class="num">${mdy(renew)}</span>`], ["Owner", owner(own)]],
        actions: btn("Renew without changes", `data-modal="a-docs-renew" data-id="${code}|1"`, true) });
      return `<div class="a-docs-pan${mode === "panel" ? " a-docs-wide" : " a-docs-page"}">${head}${AK.note("This plan and every value on it are invented, to show how owned plans would sit beside the -1 policies.")}</div>`;
    }
    const p = POL.find((x) => x[0] === code) || POL[0];
    const [, fam, s, req, t, r, , coll, renew, own] = p;
    const comments = code === "AC-1" ? 2 : 0;
    const primary = !t ? btn("Start", `data-modal="a-docs-start" data-id="${code}"`, true)
      : r === "accepted" ? btn("Renew", `data-modal="a-docs-renew" data-id="${code}|1"`, true)
        : btn("Upload revision", `data-modal="a-docs-upload" data-id="policy|${code}"`, true);
    const head = AK.recordHead({
      crumbs: [["Policies", "after-policies-index"], [fam]],
      title: `${fam} policy and procedures`, chip: polPill(r),
      desc: `Policy and procedures for ${esc(fam.toLowerCase())}, the -1 control of the ${esc(code.split("-")[0])} family.`,
      facts: [
        ["Control", `<span class="a-docs-inl">${tag(code)}${stPill(s)}</span>`],
        ["Owner", ownerBtn(t ? own : null, `the ${fam.toLowerCase()} policy`)],
        ["Approver", `<span class="a-docs-inl">${ring("Not recorded")}${lk("Assign", `data-modal="a-docs-approvers" data-id="the ${esc(fam.toLowerCase())} policy"`)}</span>`],
        ["Renews", chipBtn(t ? "Every 6 months" : "Not set", "history", `data-modal="a-docs-recur" data-id="${code}"`)],
        ["Renew by", t ? `<span class="num">${mdy(renew)} · in ${ahead(renew)}d</span>` : ring("Not set")],
        ["Requirement", tag(req)],
        ...(t ? [["Acknowledged", `<span class="a-docs-inl">${ring("0 of 23")}${EX}${c(5)}</span>`]] : []),
      ],
      actions: `${menu("More policy actions", [["Download", 'data-adtoast="Downloading the latest version"'], ["Copy link", 'data-adtoast="Link copied"'], ["Re-send approval request", 'data-adtoast="Approval request sent again to Nadia Fournier"'], ["Cancel approval request", 'data-modal="ak-reason" data-id="Cancel approval request|The approvers stop seeing Approve. The reason shows on the version and in History."'], ["Delete draft", 'data-adtoast="There is no draft to delete"']])}${primary}`,
    }).replace("</h2>", `${c(1)}</h2>`);
    const list = [["versions", "Versions"], ["objectives", "Objectives", 17], ["comments", "Comments", comments], ["history", "History"]];
    const strip = mode === "panel" ? ptabs("a-docs-pol", code, list, tab, pair ? { Comments: 6 } : {}) : qtabs(`polp-${code}`, list, tab);
    let body;
    if (tab === "objectives") {
      const e = t ? 17 : 0, a = ["satisfied", "partially_satisfied"].includes(s) ? 17 : 0;
      body = AK.card(`${rung("Objectives mapped", 17, 17)}${rung("With evidence", e, 17)}${rung("Assessed", a, 17)}`);
    } else if (tab === "comments") {
      body = code === "AC-1"
        ? AK.comments({ you: ME, items: [
          { who: "Nadia Fournier", role: "Assessor", when: "Oct 2, 11:20", text: `Section 4 names roles but not how often the policy is reviewed (AC-1c). ${AK.mention("Wes Duarte")}` },
          { who: "Wes Duarte", when: "Oct 3, 08:55", text: "Adding annual review and review after significant change in 3.3." },
        ] }) + AK.note("The comments are invented.")
        : AK.comments({ you: ME, items: [] });
    } else if (tab === "history") {
      const items = t ? [{ who: own || null, what: `recorded <b>${esc(p[6] || "the document")}</b>, collected ${md(coll)}`, when: md(coll) }] : [];
      if (r === "pending") items.push({ who: null, what: "asked <b>Nadia Fournier</b> to review it", when: "Nov 13" });
      else if (r) items.push({ who: "Nadia Fournier", what: `${r === "accepted" ? "accepted it" : "sent it back"}: “${esc(r === "accepted" ? R_OK : R_BACK)}”`, when: md(REVIEWED[code]) });
      body = items.length ? AK.activity(items) : `<p class="ak-none">Nothing recorded yet.</p>`;
    } else body = polVersions(p, c);
    const note = tab !== "versions" ? "" : !t ? AK.note("Sync a file is invented; the family, its -1 control status and the requirement that asks for the policy are WS-X90's.")
      : AK.note(`Acknowledgment counts and the ISSM step are invented; the document, ${r === "pending" ? "the pending review and its request date" : "the review, its reason and its date"} are WS-X90's.`);
    return `<div class="a-docs-pan${mode === "panel" ? " a-docs-wide" : " a-docs-page"}"${mode === "panel" ? ` data-adfull="after-policy-page-${polCode(code)}"` : ""}>${head}${strip}${body}${note}</div>`;
  }
  P["a-docs-pol"] = (id) => {
    const [code, tab] = String(id || "").split("|");
    return { label: "Policy", body: polRecord(code || "AC-1", tab || "versions", "panel", (code || "AC-1") === "AC-1" && here() === "after-policy-record") };
  };
  POL.forEach(([code]) => { const r = `after-policy-page-${polCode(code)}`; S[r] = () => h.page(polRecord(code, QS[`polp-${code}`] || "versions", "page", false)); nav(r); });

  // ═════════════ Writing a policy: the builder beside a live preview ═════════════
  const PE = ["Owner and dates", "Purpose and scope", "Roles and responsibilities", "Procedures", "Review and finalize"];
  const PE_R = ["after-policy-editor", "after-policy-editor-2", "after-policy-editor-3", "after-policy-editor-4", "after-policy-editor-review"];
  const peFam = () => POL.find((p) => p[0] === (QS.pe || "AC-1")) || POL[0];
  const q = (title, hint, control) => `<div class="a-docs-q"><b>${esc(title)}</b>${hint ? `<span class="a-docs-mu">${hint}</span>` : ""}${control}</div>`;
  function peRail(step, c) {
    let i = 0;
    return AK.steps(PE, step - 1)
      .replace(/<li class="([^"]*)">/g, (m, cls) => `<li class="${cls} a-docs-step" tabindex="0" ${go(PE_R[i++])}${i - 1 === step - 1 ? ' aria-current="step"' : ""}>`)
      .replace("<span>Review and finalize</span>", `<span class="a-docs-stepl">Review and finalize<small>Preview, save as draft, or assign approvers and submit</small></span>${c(3)}`);
  }
  function peQuestions(step, p) {
    const [code, fam, , , , , , , , own] = p;
    const ac = code === "AC-1";
    if (step === 2) return `${q("Which system does it cover?", "Filled from the program: no input needed.", select("SYS-WSX90 WS-X90 Sentinel Mission System"))}${q("Who must follow it?", `Everyone with an account on SYS-WSX90 and its six subsystems. ${EX}`, select("Operators, maintainers and ground support"))}`;
    if (step === 3) return `${q(`Who manages the policy and its procedures (${code}b)?`, "", select("Joel Barrantes · ISSM", AK.avatar("Joel Barrantes", 22)))}${q(`Who receives it (${code}a)?`, `The groups asked to acknowledge each approved version. ${EX}`, `<div class="a-docs-chips">${["Operators", "Maintainers", "Ground support"].map(tag).join("")}</div>`)}`;
    if (step === 4) return `${q("Where are the procedures held?", ac ? "REQ-436 asks for one signed, version-controlled baseline." : "", select(ac ? "Configuration Repository (LRU-020), one signed baseline" : "With the policy, one signed baseline"))}${q("How many procedures go with it?", ac ? "The Revision 3.2 export holds 14." : EX, select(ac ? "14 procedures" : "Not stated"))}`;
    return `${q("Who owns this policy?", "The person who drafts it and answers for it.", own ? select(own, AK.avatar(own, 22)) : select("Choose an owner", AK.avatar(null, 22)))}
      ${q("When does it take effect?", "The date the policy becomes active.", radios("pe-eff", [["On approval", "Effective from the approval date", true], ["On a date", "A future date you choose", false]]))}
      ${q("How often is it reviewed?", `${esc(code)}c asks a frequency. WS-X90's renewal dates already fall 6 months after collection.`, select("Every 6 months"))}`;
  }
  function pePreview(p, c) {
    const [code, fam, , , , , , , , own] = p;
    const ac = code === "AC-1";
    const sec = (title, ok, body) => `<section class="a-docs-psec"><div class="a-docs-psec-h"><h4>${esc(title)}</h4>${ok ? AK.chip("No input needed", { tone: "ok", icon: "check" }) : AK.chip("Needs input", { tone: "warn" })}</div>${body}</section>`;
    const pop = `<div class="a-docs-pop" role="group" aria-label="Comments on the highlighted sentence">${AK.comment({ who: "Nadia Fournier", role: "Assessor", when: "Today 10:12", text: `${esc(code)}c asks how often this is reviewed.` })}<div class="a-docs-reply">${AK.avatar(ME, 24)}<div class="ak-input">Reply…</div></div></div>`;
    return `<div class="a-docs-prev">
      <div class="a-docs-prev-h">${rowh(`<b class="a-docs-prev-t">${esc(fam)} policy and procedures</b>${AK.chip("3 of 3 answered", { tone: "ok", icon: "check" })}`)}
        <dl class="a-docs-pvals"><div><dt>Policy owner:</dt><dd><mark class="a-docs-val">${esc(own || "[Owner]")}</mark></dd></div><div><dt>Effective date:</dt><dd><mark class="a-docs-val">[Approval date]</mark></dd></div><div><dt>Review:</dt><dd><mark class="a-docs-val">Every 6 months</mark></dd></div></dl></div>
      ${sec("Purpose", true, `<div class="a-docs-pt">To set how ${esc(fam.toLowerCase())} is managed on WS-X90 Sentinel Mission System, so that everyone carries out the controls of the ${esc(code.split("-")[0])} family the same way.</div>`)}
      ${sec("Scope", true, `<div class="a-docs-pt">SYS-WSX90 and its six subsystems, CN-109001 to CN-109006, and everyone who holds an account on them.</div>`)}
      ${sec("Roles and responsibilities", false, `<div class="a-docs-pt">The ISSM, Joel Barrantes, manages this policy and its procedures (${esc(code)}b). <mark class="a-docs-hl">The ISSM reviews this policy and its procedures.</mark>${c(2)} The ISSO, Priya Raghavan, keeps the account register.</div>${pop}`)}
      ${sec("Procedures", false, `<div class="a-docs-pt">${ac ? "The approved policy and its 14 procedures are held as one signed, version-controlled baseline in the Configuration Repository (LRU-020). The Provisioning Workstation (LRU-017) refuses a technician procedure package that cites a superseded revision (REQ-436)." : "The procedures that carry out this policy are held with it as one signed, version-controlled baseline."}</div>`)}
    </div>`;
  }
  function peHead(p, c) {
    const [code, fam] = p;
    return AK.recordHead({
      crumbs: [["Policies", "after-policies-index"], [fam, `after-policy-page-${polCode(code)}`], ["Policy builder"]],
      title: `${fam} policy and procedures`, chip: `${AK.chip(code === "AC-1" ? "Draft · Revision 3.3" : "Draft · first version", { tone: "warn" })}${EX}`, co: c(1),
      actions: `<span class="a-docs-saved">${AK.i("check")}All changes saved</span>${menu("More builder actions", [["Preview as PDF", 'data-adtoast="Preparing a PDF of the draft"'], ["Template guidance", 'data-adtoast="Template guidance is an example"', true], ["Delete draft", 'data-modal="ak-reason" data-id="Delete draft|The draft and its comments are removed. The approved version, if any, stays."']])}${big("Save and close", `${go(`after-policy-page-${polCode(code)}`)} data-adtoast="Draft saved"`)}`,
    });
  }
  function peStep(step, withCo) {
    const c = (n) => (withCo ? co(n) : "");
    const p = peFam();
    const left = step === 5
      ? `<div class="ak-card a-docs-pecard"><h3 class="a-docs-pe-h">Review and finalize</h3>${btn(`${AK.i("eye")}Preview policy ${AK.i("down")}`, 'data-adtoast="Opening the full preview"')}
          ${AK.banner({ tone: "info", text: "<b>Review the policy before submitting it for approval.</b> Every section that needs your input is answered. Open a section in the preview to change it." })}
          <div class="a-docs-pefoot"><span class="a-docs-saved">${AK.i("check")}All changes saved</span><span class="a-docs-push">${btn("Back", go(PE_R[3]))}${btn("Save as draft", `${go("after-policies-index")} data-adtoast="Saved as a draft"`)}${btn("Assign approvers and submit", `data-modal="a-docs-approvers" data-id="${p[0] === "AC-1" ? "Revision 3.3 of the access control policy" : `the ${esc(p[1].toLowerCase())} policy`}"`, true)}</span></div></div>`
      : `<div class="ak-card a-docs-pecard"><span class="a-docs-mu num">Step ${step} of 5 · ${esc(PE[step - 1])}</span>${peQuestions(step, p)}
          <div class="a-docs-pefoot"><span class="a-docs-push">${btn("Back", step > 1 ? go(PE_R[step - 2]) : 'aria-disabled="true" title="This is the first step"')}${btn("Next", go(PE_R[step]), true)}</span></div></div>`;
    return h.page(
      peHead(p, c),
      `<div class="a-docs-pe"><div class="a-docs-pel"><nav class="ak-card a-docs-rail" aria-label="Policy builder steps">${peRail(step, c)}</nav>${left}</div>${pePreview(p, c)}</div>`,
      AK.note("The policy text, the comment and the draft's revision number are invented; the owner, the roles, the six subsystems, the 6-month review and the LRU-020 baseline are WS-X90's."),
    );
  }
  S["after-policy-editor"] = () => peStep(1, (QS.pe || "AC-1") === "AC-1");
  S["after-policy-editor-2"] = () => peStep(2, false);
  S["after-policy-editor-3"] = () => peStep(3, false);
  S["after-policy-editor-4"] = () => peStep(4, false);
  S["after-policy-editor-review"] = () => peStep(5, false);

  // ═════════════ Integrations and Evidence sources (mod-platform.js: INT, SRC, INFORMS and WS-X90's control statuses) ═════════════
  const CTL = {
    "AC-2": ["Account Management", "satisfied"], "AC-2(1)": ["Automated System Account Management", "satisfied"], "AC-2(3)": ["Disable Accounts", "satisfied"],
    "AC-7": ["Unsuccessful Logon Attempts", "satisfied"], "AC-12": ["Session Termination", "partially_satisfied"], "AC-17": ["Remote Access", "satisfied"],
    "AU-2": ["Event Logging", "satisfied"], "AU-6": ["Audit Record Review, Analysis, and Reporting", "partially_satisfied"], "AU-6(1)": ["Automated Process Integration", "satisfied"],
    "AU-12": ["Audit Record Generation", "satisfied"], "CA-2": ["Control Assessments", "partially_satisfied"], "CA-5": ["Plan of Action and Milestones", "satisfied"],
    "CA-7": ["Continuous Monitoring", "satisfied"], "CM-2": ["Baseline Configuration", "partially_satisfied"], "CM-2(2)": ["Automation Support for Accuracy and Currency", "satisfied"],
    "CM-6": ["Configuration Settings", "satisfied"], "CM-6(1)": ["Automated Management, Application, and Verification", "satisfied"], "CM-7": ["Least Functionality", "satisfied"],
    "CM-7(1)": ["Periodic Review", "not_assessed"], "CM-8": ["System Component Inventory", "satisfied"], "CM-8(1)": ["Updates During Installation and Removal", "satisfied"],
    "CM-8(3)": ["Automated Unauthorized Component Detection", "not_assessed"], "CM-10": ["Software Usage Restrictions", "satisfied"], "CM-11": ["User-installed Software", "partially_satisfied"],
    "CP-7": ["Alternate Processing Site", "no_evidence"], "CP-9": ["System Backup", "satisfied"], "IA-2": ["Identification and Authentication (Organizational Users)", "satisfied"],
    "IA-5": ["Authenticator Management", "other_than_satisfied"], "IR-4": ["Incident Handling", "satisfied"], "IR-5": ["Incident Monitoring", "satisfied"], "IR-6": ["Incident Reporting", "satisfied"],
    "RA-3": ["Risk Assessment", "partially_satisfied"], "RA-5": ["Vulnerability Monitoring and Scanning", "satisfied"], "RA-5(2)": ["Update Vulnerabilities to Be Scanned", "partially_satisfied"],
    "RA-5(5)": ["Privileged Access", "satisfied"], "RA-5(11)": ["Public Disclosure Program", "no_evidence"], "SA-11": ["Developer Testing and Evaluation", "no_evidence"],
    "SA-11(1)": ["Static Code Analysis", "not_assessed"], "SA-15": ["Development Process, Standards, and Tools", "not_assessed"], "SA-22": ["Unsupported System Components", "no_evidence"],
    "SI-2": ["Flaw Remediation", "not_assessed"], "SI-2(2)": ["Automated Flaw Remediation Status", "satisfied"], "SI-2(3)": ["Time to Remediate Flaws and Benchmarks for Corrective Actions", "no_evidence"],
    "SI-4": ["System Monitoring", "satisfied"], "SI-5": ["Security Alerts, Advisories, and Directives", "satisfied"], "SI-7": ["Software, Firmware, and Information Integrity", "no_evidence"],
    "SR-3": ["Supply Chain Controls and Processes", "no_evidence"], "SR-4": ["Provenance", "satisfied"], "SR-5": ["Acquisition Strategies, Tools, and Methods", "satisfied"],
    "SR-6": ["Supplier Assessments and Reviews", "satisfied"], "SR-11": ["Component Authenticity", "partially_satisfied"],
  };
  const INFORMS = {
    nessus: ["RA-5", "RA-5(2)", "RA-5(5)", "RA-5(11)", "SI-2", "SI-2(2)", "SI-2(3)", "CM-8", "CM-8(1)", "CM-8(3)", "SI-5"],
    ckl: ["CM-6", "CM-6(1)", "CM-7", "CM-7(1)", "CM-2", "CM-2(2)", "AC-17", "IA-5", "AU-2", "AU-12"],
    scap: ["CM-6", "CM-6(1)", "CM-7", "CM-7(1)", "CM-2", "IA-5", "AU-12", "CM-11"],
    sbom: ["CM-8", "CM-10", "SR-3", "SR-4", "SR-5", "SR-6", "SR-11", "SA-22", "RA-5", "SI-7"],
    sarif: ["SA-11", "SA-11(1)", "SA-15", "RA-5", "SI-2"],
    emass: ["CA-2", "CA-5", "CA-7", "RA-3"],
    splunk: ["AU-6", "SI-4"], snow: ["IR-4", "IR-5", "IR-6"],
  };
  const SRC = [
    { id: "acas", name: "ACAS vulnerability scan — mission network", type: "nessus", kind: ".nessus", reads: "Hosts, plugins, CVEs, IAVAs", cadence: 7, last: "2026-10-10", state: "late", note: "1,284 results across 26 hosts: 2 critical, 9 high, 31 medium, 112 low, 1,130 informational.",
      jobs: [["2026-11-12", "info", "Importing", "Started Nov 12 · 02:15 UTC"], ["2026-10-10", "ok", "Completed", "1,284 results across 26 hosts"]] },
    { id: "stig-mc", name: "DISA STIG checklist — mission computing (RHEL 9)", type: "ckl", kind: ".ckl", reads: "Rule results by CAT", cadence: 90, last: "2026-10-13", state: "ok", note: "412 rules: 371 not a finding, 29 open, 12 not applicable.",
      jobs: [["2026-10-13", "ok", "Completed", "412 rules · 29 open"]] },
    { id: "scap-lt", name: "SCAP compliance scan — maintenance laptop (Windows 11)", type: "scap", kind: "XCCDF", reads: "Rule pass and fail, score", cadence: 30, last: "2026-10-14", state: "late", note: "286 rules: 259 pass, 21 fail, 6 not applicable; score 90.6%.",
      jobs: [["2026-10-14", "ok", "Completed", "286 rules · 21 fail · 90.6%"]] },
    { id: "sbom-mc", name: "Mission Computer maintenance image SBOM", type: "sbom", kind: "CycloneDX 1.5", reads: "Components, licenses, package URLs", cadence: 0, last: "2026-11-12", state: "ok", note: "Version 2: 13 components; OpenSSH 9.8p1 fixes CVE-2024-6387.",
      jobs: [["2026-11-12", "ok", "Imported", "Version 2 · 13 components · 0 affected"], ["2026-10-08", "ok", "Imported", "13 components · 1 affected by CVE-2024-6387"]] },
    { id: "sbom-pic", name: "Software bill of materials — Payload Interface Controller firmware", type: "sbom", kind: "CycloneDX", reads: "Components, licenses, package URLs", cadence: 0, last: null, state: "validating", note: "First import: the file is being validated.",
      jobs: [["2026-11-13", "info", "Validating", "Started Nov 13 · 02:15 UTC"]] },
    { id: "stig-sw", name: "DISA STIG checklist — internal Ethernet switch", type: "ckl", kind: ".ckl", reads: "Rule results by CAT", cadence: 90, last: null, state: "queued", note: "First import: queued Nov 13.",
      jobs: [["2026-11-13", "none", "Queued", "Queued Nov 13 · 20:22 UTC"]] },
    { id: "nessus-gw", name: "Nessus scan — maintenance access gateway", type: "nessus", kind: ".nessus", reads: "Hosts, plugins, CVEs, IAVAs", cadence: 7, last: null, state: "cancelled", note: "Cancelled: superseded by the expanded control set assessment's adversarial testing.",
      jobs: [["2026-09-28", "none", "Cancelled", "Superseded by adversarial testing"]] },
    { id: "sarif-tel", name: "Container image scan — telemetry services", type: "sarif", kind: "SARIF 2.1.0", reads: "Image findings by rule", cadence: 30, last: null, state: "failed", note: "Rejected: SARIF 2.1.0 validation failed at runs[0].results[17].locations, which has no physicalLocation.",
      jobs: [["2026-10-30", "bad", "Failed", "Validation failed at runs[0].results[17]"]] },
  ];
  const SRC_BY = Object.fromEntries(SRC.map((s) => [s.id, s]));
  const INT = [
    { id: "emass", logo: "eM", name: "eMASS", real: false, mode: "File and online", reads: "System registration, controls, test results, POA&M", feeds: "Control status, POA&M, artifacts back to eMASS", caps: ["Import package export", "POA&M sync", "Registration read"], use: "Not connected" },
    { id: "acas", logo: "AC", name: "ACAS / Tenable.sc", real: true, mode: "File · online is Example", reads: ".nessus: hosts, plugins, CVEs, IAVAs", feeds: "Operational issues, inventory hosts, RA-5 and SI-2 evidence", caps: ["Host matching", "Severity threshold", "IAVA due dates"], use: "WS-X90: 3 imports since Sep 28" },
    { id: "stig", logo: "SV", name: "STIG Viewer checklists", real: true, mode: "File", reads: ".ckl and .cklb: rule results by CAT", feeds: "Open rules as findings, CM-6 and CM-7 evidence", caps: ["CAT I/II/III deadlines", "Host matching"], use: "WS-X90: 2 checklists" },
    { id: "scap", logo: "SC", name: "SCAP Compliance Checker", real: true, mode: "File", reads: "XCCDF and ARF results, score", feeds: "Failed rules as findings, configuration evidence", caps: ["Score trend", "Host matching"], use: "WS-X90: 1 import" },
    { id: "sbom", logo: "SB", name: "SBOM feeds", real: true, mode: "File · feed is Example", reads: "CycloneDX (SPDX is Example): components, licenses, package URLs", feeds: "Vulnerabilities in VEX states, one issue a consuming program", caps: ["CVE matching", "Opens issues downstream"], use: "Mission Computer: 2 SBOMs, 13 components each" },
    { id: "sarif", logo: "SA", name: "Static analysis (SARIF)", real: true, mode: "File", reads: "SARIF 2.1.0 results by rule", feeds: "Findings, SA-11 evidence", caps: ["Schema validation", "Rejects with the failing path"], use: "WS-X90: 1 import, failed" },
    { id: "doors", logo: "RQ", name: "IBM DOORS (ReqIF)", real: true, mode: "File · DOORS Next is Example", reads: "ReqIF objects by their long names; CSV and Excel too", feeds: "Requirements, allocations by element code", caps: ["Reads before it sends", "Stops whole on an unknown code"], use: "3 customer requirements documents" },
    { id: "oscal", logo: "OS", name: "NIST OSCAL content", real: true, mode: "File", reads: "SP 800-53 Rev 5 catalog, baselines and profiles", feeds: "The reference catalog and control baselines", caps: ["Pinned sources", "Provenance kept"], use: "SP 800-53 Rev 5 · High baseline" },
    { id: "jira", logo: "JI", name: "Jira", real: false, mode: "Online · connected", reads: "Issues and their status", feeds: "Tasks and POA&M milestones, both ways", caps: ["Two-way status", "Link by key"], use: "Connected · WSX project · two-way, POA&M milestones ↔ issues" },
    { id: "snow", logo: "SN", name: "ServiceNow", real: false, mode: "Online", reads: "Incidents and change requests", feeds: "IR-4 and CM-3 evidence, operational issues", caps: ["Change records as evidence", "Incident sync"], use: "Not connected" },
    { id: "splunk", logo: "SP", name: "Splunk", real: false, mode: "Online · on-premises", reads: "Saved searches over audit logs", feeds: "AU-6 and SI-4 evidence on a schedule", caps: ["Scheduled evidence", "Search results as files"], use: "Not connected" },
  ];
  const INT_BY = Object.fromEntries(INT.map((i) => [i.id, i]));
  // What a connector's drawer says beyond the card: informs, access, resources, category, and the WS-X90 sources it feeds.
  const INT_X = {
    acas: { wiz: "nessus", informs: "nessus", sources: ["acas", "nessus-gw"], category: "Scans and checklists", overview: ".nessus files: hosts, plugins, CVEs and IAVAs become operational issues, inventory hosts, and RA-5 and SI-2 evidence.", access: "Reads .nessus files you import; no network connection.", online: "Online mode: a Tenable.sc API key, read-only.", resources: ["Hosts", "Plugins", "CVEs", "IAVAs"] },
    stig: { wiz: "ckl", informs: "ckl", sources: ["stig-mc", "stig-sw"], category: "Scans and checklists", overview: ".ckl and .cklb checklists: each open rule becomes a finding with its CAT deadline, and the results are CM-6 and CM-7 evidence.", access: "Reads checklist files you import; no network connection.", resources: ["Rules", "CAT I, II and III results", "Hosts"] },
    scap: { wiz: "scap", informs: "scap", sources: ["scap-lt"], category: "Scans and checklists", overview: "XCCDF and ARF results from SCC: failed rules become findings, and the score and passes are configuration evidence.", access: "Reads result files you import; no network connection.", resources: ["Rules", "Scores", "Hosts"] },
    sbom: { wiz: "sbom", informs: "sbom", sources: ["sbom-mc", "sbom-pic"], category: "Software supply chain", overview: "CycloneDX files: components and package URLs are matched to CVEs, and each consuming program gets its own operational issue.", access: "Reads SBOM files you import; no network connection.", online: "Feed mode: a supplier's SBOM feed, read-only.", resources: ["Components", "Licenses", "Package URLs", "CVEs in VEX states"] },
    sarif: { wiz: "nessus", informs: "sarif", sources: ["sarif-tel"], category: "Scans and checklists", overview: "SARIF 2.1.0 results by rule become findings and SA-11 evidence; a file that fails validation is rejected with the failing path.", access: "Reads SARIF files you import; no network connection.", resources: ["Results by rule", "Locations", "Images"] },
    doors: { category: "Requirements and catalogs", overview: "ReqIF objects, or CSV and Excel rows, become requirements, allocated by element code.", access: "Reads requirement files you import; no network connection.", online: "DOORS Next: an OSLC connection, read-only.", resources: ["Requirements", "Allocations", "Requirements documents"] },
    oscal: { category: "Requirements and catalogs", overview: "OSCAL catalogs, baselines and profiles become the reference catalog and control baselines, from pinned sources with their provenance.", access: "Reads OSCAL files from pinned sources; no network connection.", resources: ["Catalog controls", "Baselines", "Profiles"] },
    emass: { informs: "emass", category: "Authorization", overview: "An eMASS package export, or the online API: registration, controls, test results and POA&M items come in, and artifacts go back only when you send them.", access: "A DoD PKI certificate with read access to SYS-WSX90's eMASS record. Nothing goes back until you send it.", resources: ["System registration", "Controls", "Test results", "POA&M items"] },
    jira: { category: "Ticketing and logs", overview: "Issues and their status, linked by key to tasks and POA&M milestones, both ways.", access: "An API token for one project, read and write on linked issues only.", resources: ["Issues", "Status", "Comments"] },
    snow: { informs: "snow", category: "Ticketing and logs", overview: "Incidents and change requests become IR-4 and CM-3 evidence, and incidents can open operational issues.", access: "A read-only integration user on the incident and change tables.", resources: ["Incidents", "Change requests"] },
    splunk: { informs: "splunk", category: "Ticketing and logs", overview: "Saved searches over audit logs, run on a schedule, become AU-6 and SI-4 evidence as files.", access: "A token that runs named saved searches, on-premises.", resources: ["Saved searches", "Search results"] },
  };
  const REAL = '<span class="a-docs-real">In the app</span>';
  const srcStatus = (s) => ({ ok: pill("ok", "Current"), late: pill("bad", "Past cadence"), validating: pill("info", "Validating"), queued: pill("none", "Queued"), cancelled: pill("none", "Cancelled"), failed: pill("bad", "Import failed") })[s.state];
  const cadenceText = (s) => (s.cadence ? `Every ${s.cadence} days` : "Each release");
  const lastCell = (s) => {
    if (!s.last) return ring("Never imported");
    const a = -ahead(s.last), late = s.cadence && a > s.cadence ? a - s.cadence : 0;
    return late ? `<span class="a-docs-late">${md(s.last)} · ${late}d past cadence</span>` : `<span class="num">${md(s.last)} · ${a}d ago</span>`;
  };
  const srcOwner = (s) => (s.id === "sbom-mc" ? null : "Joel Barrantes");
  const nextDue = (s) => (s.cadence && s.last ? plus(s.last, s.cadence) : null);
  const ctlLine = (k) => li(`<span class="ak-code">${esc(k)}</span>`, `<span class="a-docs-one" title="${esc(CTL[k] ? CTL[k][0] : "")}">${esc(CTL[k] ? CTL[k][0] : "")}</span>`, CTL[k] ? stPill(CTL[k][1]) : "");
  const satOf = (codes) => codes.filter((k) => CTL[k] && CTL[k][1] === "satisfied").length;
  // One strip on both pages: Available is the gallery, Connected and Errors are the evidence sources.
  const intTabs = (cur, cos = {}) => addCos(AK.tabs([["Available", 11, "after-integrations-gallery", cur === "available"], ["Connected", 7, "after-evidence-sources", cur === "connected"], ["Errors", 1, "after-evidence-sources-errors", cur === "errors"]], "Integrations"), cos);

  // ——— Integrations: the gallery ———
  const GROUPS = [["In use for WS-X90", ["acas", "stig", "scap", "sbom", "sarif"]], ["Requirements and catalogs", ["doors", "oscal"]], ["Authorization", ["emass"]], ["Ticketing and logs", ["jira", "snow", "splunk"]]];
  const card = (i, c = "") => `<div class="a-docs-card" role="button" tabindex="0" data-panel="a-docs-int" data-id="${i.id}" aria-label="${esc(i.name)}">
      <div class="a-docs-card-h"><span class="a-docs-logo" aria-hidden="true">${i.logo}</span><b>${esc(i.name)}</b><span class="a-docs-push">${i.real ? REAL : EX}</span></div>
      <div class="a-docs-chips">${i.caps.map(tag).join("")}</div>
      <p class="a-docs-use${i.id === "sarif" ? " bad" : ""}">${i.id === "sarif" ? gl("diamond") : ""}<span>${esc(i.use)}</span></p>
      <div class="a-docs-card-f"><a class="btn sm" href="#after-integration-${i.id}">View details</a>${c}</div></div>`;
  function gallery(withCo) {
    const c = (n) => (withCo ? co(n) : "");
    return h.page(
      h.header("Integrations", "<span>Connectors for a DoD program: files from closed networks first, online where the enclave allows</span>", lk("Missing a connector? Request one", 'data-modal="a-docs-request"')),
      intTabs("available", withCo ? { Available: 1, Errors: 2 } : {}),
      `<div class="tools a-docs-tools"><span class="in">Find a connector or file type</span><span class="flt">Category ⌄</span><span class="flt">Mode ⌄</span><span class="flt">Feeds ⌄</span><span class="flt sub">Clear</span>${c(3)}</div>`,
      GROUPS.map(([g, ids], gi) => `<section class="a-docs-group"><h4 class="a-docs-gh">${esc(g)} <span class="ct num">${ids.length}</span></h4><div class="grid3 a-docs-grid">${ids.map((id, k) => card(INT_BY[id], gi === 0 && k === 0 ? c(4) : "")).join("")}${gi === GROUPS.length - 1 ? `<div class="a-docs-card a-docs-reqc"><b>Missing a connector?</b><span class="a-docs-mu">Name the tool and what it should read.</span>${btn("Request a connector", 'data-modal="a-docs-request"')}</div>` : ""}</div></section>`).join(""),
      AK.note("The grouping is proposed. eMASS, Jira, ServiceNow and Splunk, and every online connection, are invented; the other seven read files in the app today."),
    );
  }
  S["after-integrations-gallery"] = () => gallery(true);
  S["after-integration-drawer"] = () => gallery(false);

  // ——— A connector's panel ———
  function intPanel(i, pair) {
    const c = (n) => (pair ? co(n) : "");
    const x = INT_X[i.id] || {};
    const codes = x.informs ? INFORMS[x.informs] : [];
    const used = (x.sources || []).map((sid) => SRC_BY[sid]);
    const primary = x.wiz ? btn("Import file", `data-modal="a-docs-import" data-id="${x.wiz}"`, true) : i.id === "doors" ? btn("Import requirements", 'data-modal="a-docs-reqif"', true) : i.real ? "" : btn("Connect", go(`after-integration-connect-${i.id}-1`), true);
    const head = AK.recordHead({ title: i.name, chip: i.real ? REAL : EX, desc: `<span class="a-docs-chips">${i.caps.map(tag).join("")}</span>`, actions: `${primary}<a class="btn sm" href="#after-integration-${i.id}">View details</a>${c(3)}` })
      .replace('<h2 class="ak-title">', `<span class="a-docs-logo lg" aria-hidden="true">${i.logo}</span><h2 class="ak-title">`);
    const informs = codes.length
      ? `${codes.slice(0, 8).map(ctlLine).join("")}${codes.length > 8 ? `<a class="ak-link a-docs-more" href="#after-integration-${i.id}">and ${codes.length - 8} more</a>` : ""}`
      : `<p class="a-docs-p a-docs-mu">Informs no control directly: it feeds ${esc(i.feeds.toLowerCase())}.</p>`;
    const online = x.online || "";
    return `<div class="a-docs-pan" data-adfull="after-integration-${i.id}">${head}
      ${AK.section("Overview", `<p class="a-docs-p">${esc(x.overview || i.reads)}</p>`)}
      ${AK.section("Informs", informs, { count: codes.length ? `${codes.length} controls · ${satOf(codes)} satisfied` : undefined, co: c(1) })}
      ${AK.section("Access it needs", `<p class="a-docs-p">${esc(x.access || "")}</p>${online ? `<div class="a-docs-online"><span>${esc(online)} ${EX}</span>${btn("Connect online", go(`after-integration-connect-${i.id}-1`))}${c(2)}</div>` : ""}`)}
      ${AK.section("Resources", `<div class="a-docs-chips">${(x.resources || []).map(tag).join("")}</div>`)}
      ${AK.section("Category", `<p class="a-docs-p">${esc(x.category || "")}</p>`)}
      ${AK.section("WS-X90 sources", used.length ? used.map((s) => li(gl(s.state === "ok" ? "check" : s.state === "late" || s.state === "failed" ? "diamond" : "ring"), `<span class="a-docs-tr2">${esc(s.name)}</span>`, srcStatus(s))).join("") : `<p class="a-docs-p a-docs-mu">${esc(i.use)}</p>`, { count: used.length || undefined })}
      ${pair ? AK.note("Online mode is invented: ACAS reads .nessus files in the app today.") : ""}</div>`;
  }
  P["a-docs-int"] = (id) => {
    const i = INT_BY[id] || INT_BY.acas;
    return { label: "Integration", body: intPanel(i, i.id === "acas" && here() === "after-integration-drawer") };
  };

  // ——— A connector's page (View details) ———
  function intPage(i) {
    const key = `intp-${i.id}`, tab = QS[key] || "overview";
    const x = INT_X[i.id] || {};
    const codes = x.informs ? INFORMS[x.informs] : [];
    const used = (x.sources || []).map((sid) => SRC_BY[sid]);
    const primary = x.wiz ? btn("Import file", `data-modal="a-docs-import" data-id="${x.wiz}"`, true) : i.id === "doors" ? btn("Import requirements", 'data-modal="a-docs-reqif"', true) : i.real ? "" : btn("Connect", go(`after-integration-connect-${i.id}-1`), true);
    const head = AK.recordHead({ back: ["Back to integrations", "after-integrations-gallery"], title: i.name, chip: i.real ? REAL : EX, desc: `Reads ${esc(i.reads)}. Feeds ${esc(i.feeds.charAt(0).toLowerCase() + i.feeds.slice(1))}.` })
      .replace('<h2 class="ak-title">', `<span class="a-docs-logo lg" aria-hidden="true">${i.logo}</span><h2 class="ak-title">`);
    const strip = qtabs(key, [["overview", "Overview"], ["informs", "Informs", codes.length], ["sources", "WS-X90 sources", used.length], ["activity", "Activity"]], tab);
    let body;
    if (tab === "informs") body = codes.length ? tbl({ cols: ["Control", "Title", "WS-X90 status"], rows: codes.map((k) => ({ id: k, panel: "", cells: [`<span class="ak-code">${esc(k)}</span>`, esc(CTL[k] ? CTL[k][0] : ""), CTL[k] ? stPill(CTL[k][1]) : ""] })), total: codes.length, nm: 1, pager: "Statuses are WS-X90's today" }) : AK.empty({ title: "No control informed directly", line: `It feeds ${i.feeds.toLowerCase()}.` });
    else if (tab === "sources") body = used.length ? tbl({ cols: ["Source", "Last imported", "Cadence", "Status"], rows: used.map((s) => ({ id: s.id, cells: [tr(s.name, 360), lastCell(s), mu(cadenceText(s)), srcStatus(s)] })), total: used.length, panel: "a-docs-src", nm: 0, pager: "From Scanner ingestion" }) : AK.empty({ title: "No WS-X90 source yet", line: i.real ? "Import a file to start one." : "Connect it to start one." });
    else if (tab === "activity") {
      const VERB = { Importing: "started importing", Completed: "imported", Imported: "imported", Validating: "is validating", Queued: "queued", Cancelled: "cancelled", Failed: "rejected" };
      body = used.length ? AK.activity(used.flatMap((s) => s.jobs.map(([d, , st, n]) => ({ d, who: null, what: `${VERB[st] || esc(st)} <b>${esc(s.name)}</b>: ${esc(n)}`, when: md(d) }))).sort((a, b) => (a.d < b.d ? -1 : 1))) : `<p class="ak-none">Nothing yet.</p>`;
    }
    else body = `${AK.section("Overview", `<p class="a-docs-p">${esc(x.overview || i.reads)}</p>`)}${AK.section("Access it needs", `<p class="a-docs-p">${esc(x.access || "")}</p>${x.online ? `<p class="a-docs-p">${esc(x.online)} ${EX}</p>` : ""}`)}${AK.section("Resources", `<div class="a-docs-chips">${(x.resources || []).map(tag).join("")}</div>`)}`;
    const rail = `${AK.card(`<div class="a-docs-big"><b class="num">${codes.length ? `Informs ${codes.length} controls` : "Informs no control directly"}</b>${codes.length ? `<span class="a-docs-mu">${satOf(codes)} satisfied in WS-X90's baseline</span>` : ""}</div>${primary}`, { cls: "a-docs-side" })}
      ${AK.railCard("About", [["Category", esc(x.category || "")], ["Capabilities", `<span class="a-docs-chips">${i.caps.map(tag).join("")}</span>`], ["Works offline", i.mode.startsWith("File") ? pill("ok", "Works from a file") : pill("none", "Needs a connection")], ["Mode", esc(i.mode)], ["Built by", i.real ? REAL : EX]])}`;
    return h.page(head, strip, AK.withRail(body, rail));
  }
  INT.forEach((i) => { S[`after-integration-${i.id}`] = () => intPage(i); nav(`after-integration-${i.id}`); });

  // ——— Connect: a stepped flow ending in scope (online connectors, all Example) ———
  const FLOW = ["Address", "Authenticate", "Systems in scope", "What to sync", "Review"];
  const SYSTEMS = [["SYS-WSX90", "WS-X90 Sentinel Mission System", true], ["X800-A-CUSA", "X800 Missile · Lug & Rail Launch · Customer A", false], ["X800-C-CUSB", "X800 Missile · Palletized Launch · Customer B", false], ["G25-VEH-CUSC", "G25 Launch Control Station · Vehicle-Mounted · Customer C", false]];
  const SYNC = {
    emass: [["Controls and test results", "Read from eMASS", true], ["POA&M items", "Both ways, matched by eMASS id", true], ["Artifacts", "Sent back to eMASS only when you send them", false]],
    acas: [["Scan results", "Read from the repository after each scan", true], ["Asset list", "Hosts matched to WS-X90's elements", true], ["IAVA notices", "With their due dates", true]],
    jira: [["Issue status", "Both ways on linked issues", true], ["Comments", "Read only", false]],
    snow: [["Incidents", "Read only", true], ["Change requests", "Read only", true]],
    splunk: [["Saved searches", "Run on the schedule below", true], ["Search results as files", "Kept as evidence versions", true]],
  };
  const ADDR = { emass: "https://emass.example.mil/api", acas: "https://tenablesc.wsx90.example.mil" };
  function connectPage(id, n) {
    const i = INT_BY[id];
    const done = n > 5;
    const pct = done ? 100 : Math.round(((n - 1) / 5) * 100);
    const name = id === "acas" ? "Tenable.sc" : i.name;
    const head = AK.recordHead({ back: [`Back to ${i.name}`, `after-integration-${id}`], title: `Connect ${name}`, chip: EX, desc: done ? "Connected. Choose what counts in scope." : `Step ${n} of 5 · ${FLOW[n - 1]}` });
    const prog = `<div class="a-docs-flowbar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Connection set up">${h.bar(pct, "var(--ink)")}<span class="num">${pct}%</span></div>`;
    let step;
    if (done) {
      step = `${AK.toast(`${name} connection saved`)}${AK.card(`${rowh(`${gl("check")}<b>${esc(name)} connected</b>`)}<p class="a-docs-p">Establish which of SYS-WSX90's subsystems and items count in scope, before the first sync runs at 02:00.</p><div class="btns">${btn("Close", go(`after-integration-${id}`))}${btn("Configure scope", `data-modal="a-docs-scope" data-id="int-${id}"`, true)}</div>`)}`;
    } else if (n === 1) step = field("Address", input(ADDR[id] || `https://${id}.wsx90.example.mil`), "Reachable from the CUI workspace's network only.");
    else if (n === 2) step = field("Authenticate with", radios("auth", [["DoD PKI certificate", "Recommended: the workspace's certificate for this connection", true], [id === "acas" ? "API key, read-only" : "API key", "Stored in the workspace vault", false]]));
    else if (n === 3) step = `${field("Systems in scope", toggles("sys", SYSTEMS.map(([c, nm, on]) => [`<b>${c}</b> ${esc(nm)}`, "", on])), `<span data-adcount="sys">1 of 4 in scope</span>`)}${id === "emass" ? `<p class="a-docs-p a-docs-mu">eMASS system 4471 maps to SYS-WSX90.</p>` : ""}`;
    else if (n === 4) step = `${field("What to sync", toggles("sync", SYNC[id] || SYNC.jira))}${field("When", radios("when", [["Daily at 02:00", "", true], ["Weekly", "", false], ["Only when asked", "", false]]))}`;
    else step = AK.railCard("Review", [["Address", esc(ADDR[id] || `https://${id}.wsx90.example.mil`)], ["Authenticate with", "DoD PKI certificate"], ["Systems in scope", tag("SYS-WSX90")], ["Sync", esc((SYNC[id] || SYNC.jira).filter((x) => x[2]).map((x) => x[0]).join(", "))], ["When", "Daily at 02:00"]]);
    const footer = done ? "" : `<div class="a-docs-flowfoot">${btn(n > 1 ? "Back" : "Cancel", go(n > 1 ? `after-integration-connect-${id}-${n - 1}` : `after-integration-${id}`))}${btn(n < 5 ? "Next" : "Connect", go(`after-integration-connect-${id}-${n + 1}`), true)}</div>`;
    return h.page(head, prog, `<div class="a-docs-flow"><nav class="ak-card a-docs-rail" aria-label="Steps">${AK.steps(FLOW, done ? 5 : n - 1)}</nav><div class="a-docs-flowb">${step}${footer}</div></div>`,
      AK.note(`Connecting ${name} online is invented: every value in this flow is an example.`));
  }
  ["emass", "acas", "jira", "snow", "splunk"].forEach((id) => { for (let n = 1; n <= 6; n++) { const r = `after-integration-connect-${id}-${n}`; S[r] = () => connectPage(id, n); nav(r); } });

  // ——— Evidence sources: Connected and Errors ———
  const manageItems = (s) => [["Import file", `data-modal="a-docs-import" data-id="${s.type === "sarif" ? "nessus" : s.type}"`], ["Edit cadence", `data-modal="a-docs-cadence" data-id="${s.id}"`],
    ["Pause", `data-modal="ak-reason" data-id="Pause imports|The source stops counting against its cadence until you resume it. The reason shows on the source."`], ["Delete", `data-modal="a-docs-delete" data-id="${s.id}"`]];
  const srcBanner = (c = "") => `<div class="a-docs-bwrap">${AK.banner({ tone: "bad", text: "<b>3 sources need attention:</b> 1 import failed, 2 are past their cadence.", co: c })}<ul class="a-docs-blist">
      <li><span class="x"><b>Container image scan — telemetry services</b> · rejected Oct 30: SARIF 2.1.0 validation failed at runs[0].results[17]</span>${btn("Retry import", 'data-modal="a-docs-retry" data-id="sarif-tel"')}</li>
      <li><span class="x"><b>ACAS vulnerability scan — mission network</b> · 31d past its 7-day cadence</span>${btn("Import file", 'data-modal="a-docs-import" data-id="nessus"')}</li>
      <li><span class="x"><b>SCAP compliance scan — maintenance laptop (Windows 11)</b> · 4d past its 30-day cadence</span>${btn("Import file", 'data-modal="a-docs-import" data-id="scap"')}</li></ul></div>`;
  function srcRegister(cur, withCo) {
    const c = (n) => (withCo ? co(n) : "");
    const list = SRC.filter((s) => (cur === "errors" ? s.state === "failed" : s.state !== "failed"));
    return h.page(
      h.header("Evidence sources", "<span>System <b>SYS-WSX90</b></span><span>Requested by <b>Joel Barrantes</b>, ISSM</span>", big("Add source", go("after-integrations-gallery"), true)),
      intTabs(cur, withCo ? { Connected: 1 } : {}),
      srcBanner(c(2)),
      filters("Search sources", ["Kind", "Status", "Cadence", "Owner"]),
      tbl({
        cols: ["Source", "Last imported", "Cadence", "Informs", "Status", `<span class="a-docs-th2"><span>Owner</span><span class="a-docs-th">${EX}${c(4)}</span></span>`, `<span class="a-docs-th">${withCo ? c(3) : ""}<span class="a-docs-sr">Actions</span></span>`],
        rows: list.map((s) => ({ id: s.id, cells: [
          `<span class="a-docs-pn" title="${esc(s.kind)}">${tr(s.name, 220)}</span>`, lastCell(s), mu(cadenceText(s)), num(`${INFORMS[s.type].length} controls`), srcStatus(s), owner(srcOwner(s)),
          `<span class="a-docs-acts">${s.state === "failed" ? btn("Retry import", `data-modal="a-docs-retry" data-id="${s.id}"`) : btn("Configure scope", `data-modal="a-docs-scope" data-id="${s.id}"`)}${menu(`Manage ${s.name}`, manageItems(s), { text: `Manage ${AK.i("down")}`, sm: true })}</span>`,
        ] })),
        total: list.length, panel: "a-docs-src", nm: 0, cls: "a-docs-tight a-docs-srct",
      }),
      AK.note("Owners are invented: the data records only who requested each source. Imports, dates, cadences and what each file read are WS-X90's, from Scanner ingestion."),
    );
  }
  S["after-evidence-sources"] = () => srcRegister("connected", true);
  S["after-evidence-sources-errors"] = () => srcRegister("errors", false);
  P["a-docs-src"] = (id) => {
    const s = SRC_BY[id] || SRC[0];
    const codes = INFORMS[s.type];
    const due = nextDue(s);
    const late = due && ahead(due) < 0;
    const head = AK.recordHead({ title: s.name, chip: srcStatus(s),
      actions: `${menu("More source actions", manageItems(s).slice(1).concat([["Configure scope", `data-modal="a-docs-scope" data-id="${s.id}"`]]))}${s.state === "failed" ? btn("Retry import", `data-modal="a-docs-retry" data-id="${s.id}"`, true) : btn("Import file", `data-modal="a-docs-import" data-id="${s.type}"`, true)}` });
    const facts = AK.railCard("Details", [["Kind", tag(s.kind)], ["Reads", esc(s.reads)], ["Cadence", esc(cadenceText(s))], ["Last imported", lastCell(s)], ["Next import due", due ? AK.due(due, { prefix: false }) : ring(s.cadence ? "After the first import" : "With each release")],
      ["Owner", `<span class="a-docs-inl">${ownerBtn(srcOwner(s), s.name)}${EX}</span>`], ["System", tag("SYS-WSX90")], ["Requested by", s.id === "sbom-mc" ? mu("Imported as SBOM records") : owner("Joel Barrantes")]]);
    const told = late
      ? `<p class="a-docs-p">Notified on ${md(due)}: Joel Barrantes, the requester and ISSM, by email and in the app, as the “Import failed or past its cadence” rule sends it.</p>${AK.remind({ last: md(due) }).replace('<span class="btn sm">', '<span class="btn sm" role="button" tabindex="0" data-adtoast="Reminder sent">')}`
      : s.state === "failed" ? `<p class="a-docs-p">Notified on Oct 30: Joel Barrantes, the requester and ISSM, by email and in the app, when the import failed.</p>${AK.remind({ last: "Oct 30" }).replace('<span class="btn sm">', '<span class="btn sm" role="button" tabindex="0" data-adtoast="Reminder sent">')}`
        : `<p class="a-docs-p">${due ? `Joel Barrantes is told if no file arrives by ${md(due)}.` : "No reminder: this source has no cadence date yet."}</p>`;
    const rem = AK.card(`${rowh(`<b>Reminders and tasks</b>${EX}`)}${told}${toggles(`task-${s.id}`, [["Create a task when an import is due", "For the owner, due on the cadence date", false]])}${rowh(`${mu("Subscribers")}<span class="a-docs-inl">${AK.avatars(["Joel Barrantes"])}Joel Barrantes</span><span class="a-docs-push">${lk("Manage", `data-modal="a-docs-subs" data-id="src-${s.id}"`)}</span>`)}`);
    return { label: "Evidence source", body: `<div class="a-docs-pan">${head}${s.state === "failed" ? AK.banner({ tone: "bad", text: esc(s.note) }) : `<p class="a-docs-p">${esc(s.note)}</p>`}${facts}${rem}
      ${AK.card(`${rowh(`<b>Imports</b><span class="ct num a-docs-mu">${s.jobs.length}</span>`)}${s.jobs.map(([d, k, st, n]) => li(mu(md(d)), esc(n), pill(k, st))).join("")}`)}
      ${AK.card(`${rowh(`<b>Informs</b><span class="a-docs-mu num">${codes.length} controls · ${satOf(codes)} satisfied</span>`)}${codes.map(ctlLine).join("")}`)}
      ${AK.note("The owner, reminders, tasks and subscribers are invented; the notice follows the proposed notification rule.")}</div>` };
  };

  // ═════════════ Dialogs ═════════════
  M["a-docs-owner"] = (id) => ({ title: "Assign owner", body: `<p class="ak-desc">${esc(id ? `Give ${id} one owner. It replaces any owner set now, and the change shows in History.` : "Choose an owner.")}</p>${AK.ownerPicker({ you: ME, people: PEOPLE })}`, footer: foot("Assign owner", 'data-adtoast="Owner assigned"') });
  M["a-docs-review"] = (id) => {
    const [rid, mode] = String(id || "").split("|");
    const r = evById(rid);
    const back = mode === "back";
    return { title: "Review evidence", body: `<p class="ak-desc">${esc(r.title)} · version 1</p>
      ${field("Decision", radios("rev", [["Accept", `It meets ${esc(r.req[0])}'s acceptance criteria`, !back], ["Send back for revision", "The owner revises it and submits it again", back]]))}
      ${field("What to revise", `<div class="ak-input tall">Say what is missing or wrong. The owner sees it on the record, and in the daily digest the “Evidence sent back by the assessor” rule sends.</div>`, "", ' <span class="req">Required to send back</span>')}
      <p class="a-docs-p a-docs-mu">Your decision shows on the record and in History, with your name and the date.</p>`, footer: foot("Save review", 'data-adtoast="Review saved"') };
  };
  M["a-docs-renewal"] = (id) => {
    const r = evById(id);
    return { title: "Set renewal", body: `<p class="ak-desc">Repeats from the collection date, ${mdy(r.collected)}. The artifact reads Renewal due in its last 30 days and Expired once past.</p>
      ${field("Renew", radios("ren", [["Every 6 months", `Next renewal ${mdy(plus(r.collected, 181))}`, true], ["Annually", `Next renewal ${mdy(plus(r.collected, 365))}`, false], ["Every 3 years", "", false], ["Never", "", false]]))}
      ${field("Create a task for the owner", radios("rtask", [["On the renewal date", "", true], ["14 days before", "", false], ["No task", "", false]]), "", ` ${EX}`)}`, footer: foot("Set renewal", 'data-adtoast="Renewal set"') };
  };
  M["a-docs-subs"] = (id) => {
    const src = String(id || "").startsWith("src-");
    const who = src ? [["Joel Barrantes", "Requester · ISSM"]] : [[evById(id).owner || "No owner", "Owner"], ["Nadia Fournier", "Reviewer"]].filter((x) => x[0] !== "No owner");
    return { title: "Manage subscribers", body: `<p class="ak-desc">Subscribers get an email when this ${src ? "source" : "record"} changes: a new version, a review, a ${src ? "late or failed import" : "renewal coming due"}.</p>
      ${field("Add", `<div class="a-docs-addrow">${input("Email, mailing list or channel address", false)}${btn("Add")}</div>`)}
      <div class="a-docs-subs">${who.map(([n, r]) => li(AK.avatar(n, 22), esc(n), `${mu(esc(r))} ${lk("Remove")}`)).join("")}</div>${AK.note("Who is subscribed is invented.")}`, footer: foot("Save", 'data-adtoast="Subscribers saved"') };
  };
  M["a-docs-task"] = (id) => {
    const r = evById(id);
    return { title: "Create task", body: `${field("Task", input("Collect version 2"))}${field("Assignee", select(r.owner || "Choose a person", AK.avatar(r.owner, 22)))}
      ${field("Due", radios("tdue", [["On the renewal date", "Set a renewal first", true], ["On a date", "", false]]))}${field("Linked to", `<div class="a-docs-ro">${esc(r.title)}</div>`)}${AK.note("The task is an example.")}`, footer: foot("Create task", 'data-adtoast="Task created"') };
  };
  M["a-docs-upload"] = (id) => {
    const [mode, rid] = String(id || "upload|").split("|");
    const pol = mode === "policy" ? POL.find((p) => p[0] === rid) : null;
    const r = !pol && rid ? evById(rid) : null;
    const into = pol ? `${pol[1]} policy · ${pol[6] ? "next revision" : "first version"}` : r ? `${r.title} · version 2` : "A new artifact";
    const eff = field("Effective date", select(mdy("2026-11-17"), AK.i("calendar")), "The date the evidence speaks for. Renewal counts from it.");
    const body = mode === "link"
      ? `${field("URL", input("https://", false), "", REQ)}${field("Title", input("", false))}${field("Description", `<div class="ak-input tall"></div>`, "", OPT)}${eff}`
      : mode === "import"
        ? `${field("Source", `<div class="a-docs-opts">${SRC.filter((s) => s.last).map((s, k) => `<button type="button" class="a-docs-opt" role="radio" aria-checked="${k === 0}" aria-pressed="${k === 0}" data-adpick="imp" data-radio><span class="a-docs-dot" aria-hidden="true"></span><span>${esc(s.name)}<small>Last imported ${md(s.last)} · ${esc(s.kind)}</small></span></button>`).join("")}</div>`)}${eff}`
        : `<div class="ak-drop">${AK.i("upload")}Drop a file, or choose one: ${pol ? ".pdf or .docx" : "PDF, image, .nessus, .ckl, CycloneDX or SPDX"}</div>${field("Filename", input("", false), "A friendly name for the assessor.")}${field("Description", `<div class="ak-input tall"></div>`, "", OPT)}${eff}`;
    return { title: pol ? (pol[4] ? "Upload revision" : "Upload a file") : mode === "link" ? "Add link" : mode === "import" ? "Import from evidence sources" : "Upload", body: `<p class="ak-desc">Into: ${esc(into)}</p>${body}`, footer: foot(pol ? "Upload" : r ? "Add to version 2" : "Add evidence", 'data-adtoast="Added, pending review"') };
  };
  M["a-docs-start"] = (code) => {
    const p = POL.find((x) => x[0] === code);
    const fam = p || POL[1];
    return { title: "Start a policy", body: `<p class="ak-desc">${p ? `${esc(p[1])} (${esc(code)}) · ${esc(p[3])} asks for it.` : "Choose the family, then how to start its policy."}</p>
      ${p ? "" : field("Family", select("Awareness and training (AT-1)"), "6 families have no document: AT-1, MA-1, PE-1, PL-1, RA-1 and SR-1.")}
      ${field("How do you want to start?", radios("start", [
        ["Use the policy editor", `Answer a few questions beside a live preview, from a template ${EX}`, true, `route:after-policy-editor|${fam[0]}`],
        ["Upload a file", ".pdf or .docx", false, `modal:a-docs-upload|policy|${fam[0]}`],
        [`Sync a file ${EX}`, "Confluence, Google Drive or SharePoint", false, "toast:Sync a file is an example"],
      ]))}
      ${field("Who owns this policy?", select("Choose an owner", AK.avatar(null, 22)))}`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-adcontinue="start">Continue</button>` };
  };
  const stepCard = (n, label, who, ex) => `<div class="ak-stepcard"><div class="k"><span class="ak-step-n">${n}</span>Step ${n} · ${esc(label)}${ex ? ` ${EX}` : ""}</div><p class="s">Up to three approvers. Each must approve.</p>${who.map(([w, r]) => li(AK.avatar(w, 22), `<b>${esc(w)}</b>`, mu(esc(r)))).join("")}<div class="ak-select">${AK.i("user")}<span>Search people</span></div></div>`;
  M["a-docs-approvers"] = (id) => ({ title: "Assign approvers", body: `<p class="ak-desc">Approvers are emailed and see Approve once they sign in. Everyone in a step approves before the next step starts.</p>
      ${stepCard(1, "Evidence review", [["Nadia Fournier", "Assessor"]])}${stepCard(2, "ISSM", [["Joel Barrantes", "ISSM"]], true)}
      <div class="ak-addstep">${AK.i("plus")}Add new approval step</div>
      ${field("Add a message", `<div class="ak-input tall">Please review ${esc(id || "this policy")}.</div><span class="s">${AK.i("sparkle")}Draft with AI</span>`, "", OPT)}`,
    footer: foot("Submit for approval", 'data-adtoast="Sent to Nadia Fournier for step 1"') });
  const GROUPS_ACK = [["Operators", 9], ["Maintainers", 8], ["Ground support", 6]];
  const ackStep = (what) => `${field(what, radios("reack", [["Yes, ask them", "In the next reminder email", true], ["No", "", false]]))}
      ${field("Groups", toggles("grp", GROUPS_ACK.map(([g, n]) => [`<b>${g}</b>`, `${n} people`, true])), `<span>23 people</span> ${EX}`)}`;
  M["a-docs-approve"] = (id) => {
    const [code, step] = String(id || "MP-1|1").split("|");
    const p = POL.find((x) => x[0] === code) || POL[9];
    if (step === "2") return { title: "Approve", body: `<p class="ak-desc">Step 2 of 2 · ${esc(p[1])} policy, ${esc(p[6] || "this version")}</p>${ackStep(`Ask these groups to acknowledge ${p[6] || "this version"}?`)}`,
      footer: stepFoot("Step 2 of 2", `data-modal="a-docs-approve" data-id="${code}|1"`, `data-close-modal data-adtoast="Approved; the groups are asked to acknowledge it"`, "Approve") };
    return { title: "Approve", body: `<p class="ak-desc">Step 1 of 2 · ${esc(p[1])} policy, ${esc(p[6] || "this version")}</p>
      ${li(`<span class="a-docs-fi">${h.icon("evidence")}</span>`, esc(p[4] || ""), btn("View file", 'data-adtoast="Opening the document"'))}
      ${field("Comment", `<div class="ak-input tall">Shown on the version and in History.</div>`, "", OPT)}`,
      footer: stepFoot("Step 1 of 2", "", `data-modal="a-docs-approve" data-id="${code}|2"`, "Next") };
  };
  M["a-docs-renew"] = (id) => {
    const [code, step] = String(id || "AC-1|1").split("|");
    const p = POL.find((x) => x[0] === code) || POL_EX.find((x) => x[0] === code) || POL[0];
    const name = `${p[1]}${POL_EX.find((x) => x[0] === code) ? "" : " policy"}`;
    if (step === "2") return { title: "Renew without changes", body: `<p class="ak-desc">Step 2 of 2 · ${esc(name)}</p>${ackStep(`Do you want personnel to re-acknowledge the ${name.toLowerCase()} after it is renewed?`)}`,
      footer: stepFoot("Step 2 of 2", `data-modal="a-docs-renew" data-id="${code}|1"`, 'data-close-modal data-adtoast="Renewal sent for approval"', "Renew") };
    return { title: "Renew without changes", body: `<p class="ak-desc">Step 1 of 2 · ${esc(name)} stays as it is; the renewal is approved like a new version.</p>
      ${field("Approver", select("Joel Barrantes · ISSM", AK.avatar("Joel Barrantes", 22)), "", ` ${EX}`)}${field("Add a message", `<div class="ak-input tall">Renewing the ${esc(name.toLowerCase())} as it stands.</div>`, "", OPT)}`,
      footer: stepFoot("Step 1 of 2", "", `data-modal="a-docs-renew" data-id="${code}|2"`, "Next") };
  };
  M["a-docs-recur"] = (code) => {
    const p = POL.find((x) => x[0] === code) || POL[0];
    return { title: "Edit recurrence", body: `<p class="ak-desc">How often the ${esc(p[1].toLowerCase())} policy is renewed, counted from its latest version.</p>
      ${field("Renew", radios("rec", [["Every 6 months", "As WS-X90's renewal dates fall today", !!p[4]], ["Annually", "", false], ["Every 2 years", "", false], ["Every 3 years", "", false], ["Never", "", !p[4]]]))}`, footer: foot("Save", 'data-adtoast="Recurrence saved"') };
  };
  M["a-docs-sla"] = () => ({ title: "Renewal SLA", body: `<p class="ak-desc">Every policy is renewed this long after its document is collected. WS-X90's 12 documents all fall 6 months after collection today.</p>
      ${field("Renew policies", radios("sla", [["Every 6 months", "12 policies, the earliest due Mar 10, 2027", true], ["Annually", "", false], ["Every 2 years", "", false]]))}`, footer: foot("Save SLA", 'data-adtoast="Renewal SLA saved"') });
  M["a-docs-bulk"] = () => ({ title: "Bulk replace text", body: `<p class="ak-desc">Replaces text in the policy editor's drafts of every policy chosen, as a new draft version of each. ${EX}</p>
      ${field("Find", input("Information System Security Manager"))}${field("Replace with", input("ISSM"))}${field("In", select("12 policies with a document"))}`, footer: foot("Preview changes", 'data-adtoast="Bulk replace is an example"') });
  M["a-docs-request"] = () => ({ title: "Request a connector", body: `${field("Tool", input("For example Xacta, Nessus Manager or GitLab", false))}
      ${field("What it should read", `<div class="ak-input tall"></div>`)}${field("Network", radios("net", [["Files from a closed network", "", true], ["Online inside the enclave", "", false]]))}`, footer: foot("Send request", 'data-adtoast="Request sent"') });
  const SUBS = [["CN-109001", "Mission Computing Subsystem"], ["CN-109002", "Navigation & Timing Subsystem"], ["CN-109003", "Communications Subsystem"], ["CN-109004", "Payload Interface Subsystem"], ["CN-109005", "Platform Management Subsystem"], ["CN-109006", "Ground Support Subsystem"]];
  M["a-docs-scope"] = (id) => {
    const s = SRC_BY[id];
    const conn = INT_BY[String(id || "").replace(/^int-/, "")];
    const name = s ? s.name : conn ? `${conn.id === "acas" ? "Tenable.sc" : conn.name} connection` : "Source";
    const sbom = s && s.type === "sbom";
    const list = sbom ? [["SYS-WSX90", "WS-X90 Sentinel Mission System"], ["X800-A-CUSA", "Customer A · X800 Rail Integration"], ["X800-C-CUSB", "Customer B · X800 Palletized Integration"]] : SUBS;
    return { title: "Configure scope", body: `<p class="ak-desc">${esc(name)}</p>
      <div class="a-docs-scopeh"><b>${sbom ? "Systems built from this component version" : "Subsystems of SYS-WSX90"}</b><span class="a-docs-mu num" data-adcount="scope">${list.length} of ${list.length} in scope</span><span class="a-docs-push">${lk("Mark all in", 'data-adall="scope" data-v="true"')}<span class="a-docs-mu">·</span>${lk("Mark all out", 'data-adall="scope" data-v="false"')}</span></div>
      ${toggles("scope", list.map(([c, n]) => [`<b>${c}</b> ${esc(n)}`, "", true]))}
      ${sbom ? `<p class="a-docs-p a-docs-mu">An SBOM belongs to a component version: every system built from it reads it.</p>` : field("Hosts with no element", radios("orphan", [["Skip them", "And say so in each import's review", true], ["Add them to Inventory as candidates", "", false]]))}`,
      footer: foot("Save scope", 'data-adtoast="Scope saved"') };
  };
  M["a-docs-cadence"] = (id) => {
    const s = SRC_BY[id] || SRC[0];
    return { title: "Edit cadence", body: `<p class="ak-desc">${esc(s.name)}: how often a new file is due. Past it, the source reads Past cadence and the notification rule tells the requester.</p>
      ${field("A new file is due", radios("cad", [["Every 7 days", "", s.cadence === 7], ["Every 30 days", "", s.cadence === 30], ["Every 90 days", "", s.cadence === 90], ["With each release", "", !s.cadence]]))}`, footer: foot("Save cadence", 'data-adtoast="Cadence saved"') };
  };
  M["a-docs-delete"] = (id) => {
    const s = SRC_BY[id] || SRC[0];
    return { title: "Delete source", body: `<p class="ak-desc">${esc(s.name)}</p><p class="a-docs-p">The ${s.jobs.length} import${s.jobs.length === 1 ? "" : "s"} it read stay, with the findings and evidence they made. The source stops counting against its cadence.</p>`, footer: foot("Delete source", 'data-adtoast="Source deleted"') };
  };
  // The existing flows keep their dialogs when the whole prototype is built: Import file opens the six-step Add source
  // wizard, Retry import and Import requirements theirs (mod-platform.js). Built alone, a short stand-in opens.
  M["a-docs-import"] = (type) => (M["plat-add-source"] ? M["plat-add-source"](type) : { title: "Import file", body: `<p class="ak-desc">Opens the six-step Add source wizard: source type, system, match hosts, scope, severity threshold, review.</p><div class="ak-drop">${AK.i("upload")}Drop a file, or choose one</div>`, footer: foot("Next") });
  M["a-docs-retry"] = (id) => (M["plat-retry"] ? M["plat-retry"](id) : { title: "Retry import", body: `<p class="ak-desc">Container image scan — telemetry services</p>${AK.banner({ tone: "bad", text: "runs[0].results[17].locations has no physicalLocation." })}${field("Retry with", radios("retry", [["A corrected file", "Upload a new SARIF file", true], ["This file, skipping results with no location", "Says how many it skipped", false]]))}`, footer: foot("Retry import") });
  M["a-docs-reqif"] = () => (M["plat-reqif"] ? M["plat-reqif"]() : { title: "Import requirements", body: `<div class="ak-drop">${AK.i("upload")}Choose a ReqIF, CSV or Excel file, or paste rows</div>`, footer: foot("Import requirements") });

  nav("after-evidence-index", "after-evidence-record", "after-policies-index", "after-policy-record", ...PE_R, "after-integrations-gallery", "after-integration-drawer", "after-evidence-sources", "after-evidence-sources-errors");
})();
