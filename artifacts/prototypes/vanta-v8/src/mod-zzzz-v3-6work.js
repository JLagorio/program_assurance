// Prototype V3, lane W (v3w-): one personal inbox, one home for each recurring check, source and provider, and Mission Computer
// version 2 taken in one place. Inert while V3 is off (PA.v3.S/P/M/screen/redirect; every listener returns at once).
// Findings: C04 C14 (My work is the one inbox: Assigned to me, Needs my approval with AI agent runs and package access requests,
//   Waiting on others; Overview's Your tasks counts Assigned to me; the bell holds mentions), C15 (the Review queue lists every row it
//   counts, 25 a page), C11 C10 C17 (Continuous monitoring owns each recurring check, Checks and Schedule fold into its Checks and
//   Runs tabs; Evidence's Sources tab owns a program's sources and imports, read from one list of what was imported), C12 (one Take
//   version 2 dialog that moves Components, Composition and its Assets, the supplier, the CVE's POA&M item and the SBOM check), C16
//   C23 (Host & providers holds providers and library components, one inherited count, one Add provider; the unauthorized provider is
//   flagged), C24 (Workspace setup in Settings; Deadlines' Adopt proposed).
// State (PA.v2 state, cleared by PA.v2.reset()): v3.W.mc2 { at, by, note } Mission Computer version 2 taken by WS-X90;
//   v3.W.imports [{ src, at, by, file, st }] files imported into a source this session; v3.W.dl { at, by } the proposed deadlines
//   adopted; v3.W.rq { page } the Review queue's page; v3.W.qv { checks, sources } quick views.
// Facts it publishes: mc2() { taken, at, by, behind } (lane R reads it for the CVE's POA&M item); imports(prog) the one list of
//   what was imported [{ src, at, by, file, tool, st, read }]; checks(prog) the recurring checks [{ id, name, cadence, state, … }];
//   inbox() { assigned, approval, waiting } My work's rows by view.
(function () {
  const PA = window.PA, V3 = PA && PA.v3, V = PA && PA.v2;
  if (!V3 || !V || !PA.h || !PA.AK) return;
  const { S, P, M, h } = PA;
  const AK = PA.AK;
  const { esc, fmt } = h;
  const WSX = "PRG-1090", ME = "Ingrid Solberg", TODAY_ISO = "2026-11-17";
  const TODAY = PA.data && PA.data.TODAY ? PA.data.TODAY : new Date(TODAY_ISO + "T12:00:00");
  const on = () => V3.on();
  const wsx = () => V3.wsx();
  const get = (p, d) => V.get("v3.W." + p, d);
  const put = (p, v) => V.set("v3.W." + p, v);
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const md = (iso) => (iso ? new Date(String(iso).slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
  const mdy = (iso) => (iso ? new Date(String(iso).slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  const days = (iso) => Math.round((new Date(String(iso).slice(0, 10) + "T12:00:00") - TODAY) / 86400000);
  const pill = (k, t) => h.pill(k, t);
  const DASH = '<span class="v2-dash" aria-label="None">—</span>';
  const mu = (t) => `<span class="v3w-mu">${t}</span>`;
  const num = (n) => `<span class="num">${fmt(n)}</span>`;
  const btn = (label, attrs = "", ink = false, sm = true) => `<span class="btn${sm ? " sm" : ""}${ink ? " ink" : ""}" role="button" tabindex="0" ${attrs}>${label}</span>`;
  const lnk = (label, attrs) => `<span class="ak-link" role="link" tabindex="0" ${attrs}>${label}</span>`;
  const gl = (g) => (h.gl ? h.gl(g) : "");
  const note = (t) => `<p class="note-p">${t}</p>`;
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  function edit(html, fn) {
    if (typeof html !== "string") return html;
    const t = document.createElement("template"); t.innerHTML = html;
    try { fn(t.content); } catch (e) { console.error("v3w", e); return html; }
    return t.innerHTML;
  }
  const frag = (html) => { const t = document.createElement("template"); t.innerHTML = typeof html === "string" ? html : ""; return t.content; };
  const goQ = (route, q) => `data-v2go="${esc(route)}" data-v2q="${esc(JSON.stringify(q))}"`;
  const tblH = (cols, rows, opt = {}) => `<div class="frame${opt.cls ? " " + opt.cls : ""}"><div class="tablebox"><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr${r.panel ? ` tabindex="0" data-panel="${esc(r.panel)}" data-id="${esc(r.id || "")}"` : r.go ? ` tabindex="0" data-go="${esc(r.go)}"` : ""}${r.cls ? ` class="${r.cls}"` : ""}>${r.cells.map((c, i) => `<td${i === 0 ? ' class="nm"' : ""}>${c}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cols.length}" class="v3w-empty">${esc(opt.empty || "Nothing to show.")}</td></tr>`}</tbody></table></div>${opt.pager === false ? "" : opt.pager || `<div class="pager"><span class="num">${rows.length ? `1–${rows.length} of ${fmt(rows.length)}` : "0 of 0"}</span><span>25 per page</span></div>`}</div>`;
  const views = (key, list, cur) => `<div class="views" role="group" aria-label="Quick views">${list.map(([k, l, n]) => `<button type="button" class="qv${k === cur ? " on" : ""}" aria-pressed="${k === cur}" data-v3w-qv="${esc(key)}|${esc(k)}">${esc(l)} <span class="num">${fmt(n)}</span></button>`).join("")}</div>`;
  const closeModal = () => { const x = document.querySelector("#modal [data-close-modal]"); if (x) x.click(); };
  const toast = (t, link) => { if (V.toast) V.toast(t, link); };

  // ═══════════════════════════ 1. One personal inbox: My work [C04 C14] ═══════════════════════════
  const WAIT_G = "Waiting on others", APPR_G = "Needs my approval";
  // AI agent runs waiting on a person: read from the agents' own queue as it is drawn now (approving one removes it).
  function aiWaiting() {
    if (typeof S["ai-drafts"] !== "function") return [];
    let html = ""; try { html = S["ai-drafts"](); } catch (e) { return []; }
    return [...frag(html).querySelectorAll(".v8w-qr[data-v8w-run]")].map((c) => {
      const id = c.getAttribute("data-v8w-run");
      const what = [...c.querySelectorAll(".v8w-qt > span")].find((s) => !s.classList.contains("v8w-qsep"));
      const kids = c.querySelector(".v8w-qm") ? c.querySelector(".v8w-qm").children : [];
      const by = txt(c.querySelector(".v8w-qm .ak-owner .nm"));
      return { id, agent: txt(c.querySelector(".v8w-qt b")), what: txt(what), by, when: txt(kids[1]), count: txt(kids[2]) };
    });
  }
  // Package access requests (Authorization › Sharing › Access requests), as the request tab draws them.
  function accessWaiting() {
    const f = S["package-room-requests"]; if (typeof f !== "function") return [];
    let html = ""; try { html = V3.force(false, () => f()); } catch (e) { return []; }
    const C = frag(html), heads = [...C.querySelectorAll("thead th")].map(txt);
    const col = (tr, name) => { const i = heads.findIndex((x) => x === name); return i >= 0 && tr.cells[i] ? txt(tr.cells[i]) : ""; };
    return [...C.querySelectorAll("tbody tr")].filter((tr) => tr.cells.length > 3 && !/\b(Approved|Denied)\b/.test(txt(tr)))
      .map((tr) => ({ who: col(tr, "Requester"), org: col(tr, "Organization"), asked: col(tr, "Asked"), why: col(tr, "Reason"), wants: col(tr, "Wants") })).filter((x) => x.who);
  }
  function approvalRows() {
    const ai = aiWaiting().map((r) => ({ k: "act", t: `${r.agent}: ${r.what}`, m: `AI agent run · ${r.by === ME ? "started by you" : "started by " + r.by} · ${r.when} · ${r.count}`, o: [ME], panel: ["v8w-run", r.id], me: true, appr: "ai" }));
    const acc = accessWaiting().map((r) => ({ k: "doc", t: `Package access: ${r.who}${r.org ? ", " + r.org : ""}`, m: `Asked ${r.asked}${r.wants ? " · wants " + r.wants : ""}${r.why ? " · " + r.why : ""}`, o: [ME], r: "authorization-sharing-requests", me: true, prog: WSX, appr: "access" }));
    // Review queue rows waiting on the reader (none today): the queue's own Waiting on column.
    const rq = rqRowsData().filter((x) => x.waitOn === ME).map((x) => ({ k: "doc", t: x.name, m: `${x.kind} · waiting since ${md(x.since)}`, o: [ME], r: "review-queue", me: true, appr: "review" }));
    return [...ai, ...acc, ...rq];
  }
  if (PA.mywork && typeof PA.mywork.data === "function") {
    const data0 = PA.mywork.data;
    PA.mywork.data = function () {
      const out = data0.apply(this, arguments); if (!on()) return out;
      try {
        // Once Mission Computer version 2 is taken, the CVE row says what is left: the rescan that closes it.
        if (mc2Taken()) for (const g of out) for (const x of g.rows) if (/^Remediate CVE-2024-6387/.test(x.t)) x.m = `WSX-409 • High • version 2 taken ${md(get("mc2").at)} • rescan to close it`;
        const rows = approvalRows();
        if (rows.length && !out.some((g) => g.title === APPR_G)) out.splice(1, 0, { title: APPR_G, glyph: "wait", rows, v3w: true });
      } catch (e) { console.error("v3w", e); }
      return out;
    };
  }
  const isW = (g) => g.title === WAIT_G, isA = (g) => g.title === APPR_G;
  function inbox() {
    const groups = PA.mywork ? PA.mywork.data() : [];
    const assigned = [], approval = [], waiting = [];
    for (const g of groups) {
      if (isA(g)) approval.push(...g.rows.map((x) => [g, x]));
      else if (isW(g)) waiting.push(...g.rows.map((x) => [g, x]));
      else for (const x of g.rows) if (x.me === true) assigned.push([g, x]);
    }
    return { groups, assigned, approval, waiting };
  }
  V3.facts.inbox = () => { const b = inbox(); return { assigned: b.assigned.length, approval: b.approval.length, waiting: b.waiting.length }; };
  // Markup pieces taken from v2's My work as drawn (the row icons and the group chevron), so the rows look as v2's do.
  let PIECES = null;
  function pieces() {
    if (PIECES) return PIECES;
    let html = ""; try { html = V3.force(false, () => S["my-work"]()); } catch (e) { html = ""; }
    const C = frag(html), sq = {};
    for (const s of C.querySelectorAll(".a-work-sq")) { const k = s.getAttribute("title") === "Document" ? "doc" : "act"; if (!sq[k]) sq[k] = s.innerHTML; }
    const chev = C.querySelector(".a-work-chv"), type = C.querySelector(".a-work-type");
    if (type) type.querySelectorAll(".ak-co").forEach((x) => x.remove());
    PIECES = { sq, chev: chev ? chev.outerHTML : "", type: type ? type.outerHTML : "" };
    return PIECES;
  }
  const avs = (o) => `<span class="ak-avs">${(o && o.length ? o : [null]).map((n) => `<span class="a-work-av" title="${esc(n || "No owner")}">${AK.avatar(n, 24)}${n ? "" : '<span class="v2-sr">No owner</span>'}</span>`).join("")}</span>`;
  function rowH(x) {
    const pc = pieces();
    const inner = `<span class="a-work-sq" title="${x.k === "doc" ? "Document" : "Work item"}">${pc.sq[x.k] || pc.sq.act || ""}</span><span class="a-work-mwt"><span class="a-work-mwtt">${esc(x.t)}</span>${x.m ? `<span class="m">${esc(String(x.m).replace(/<[^>]+>/g, ""))}</span>` : ""}</span><span class="a-work-mwo">${avs(x.o)}</span>`;
    if (x.panel) return `<div class="a-work-mw v3w-mw" role="button" tabindex="0" data-panel="${esc(x.panel[0])}" data-id="${esc(x.panel[1])}">${inner}</div>`;
    return `<a class="a-work-mw" href="#${esc(x.r)}"${x.q ? " " + goQ(x.r, x.q) : ""}${x.prog ? ` data-v2prog="${esc(x.prog)}"` : ""}>${inner}</a>`;
  }
  const glyphH = (g) => (g === "wait" ? '<span class="gl info a-work-glg"></span>' : gl(g || "ring"));
  const groupH = (g, rows) => `<details class="a-work-mwg${isA(g) ? " v3w-appr" : ""}" open><summary>${pieces().chev}${glyphH(g.glyph)}<b>${esc(g.title)}</b><span class="ct num">${rows.length}</span></summary><div class="a-work-mwl">${rows.map(rowH).join("")}</div></details>`;
  const MW_VIEWS = [["all", "All", "my-work"], ["mine", "Assigned to me", "my-work-mine"], ["approval", "Needs my approval", "my-work-approval"], ["waiting", "Waiting on others", "my-work-waiting"]];
  function mwPage(view) {
    const b = inbox();
    const n = { all: b.groups.reduce((a, g) => a + g.rows.length, 0), mine: b.assigned.length, approval: b.approval.length, waiting: b.waiting.length };
    // The rail's My work count is the All view's, also after an approval redraws the page in place.
    setTimeout(() => { if (!on()) return; for (const c of document.querySelectorAll('#rail a[href="#my-work"] .ri-b, #bottom a[href="#my-work"] .ri-b')) c.textContent = fmt(n.all); }, 0);
    const vbar = `<div class="views a-work-mwv">${MW_VIEWS.map(([k, l, r]) => `<span class="qv${k === view ? " on" : ""}"${k === view ? ' aria-current="true"' : ` data-go="${r}" role="link" tabindex="0"`}>${esc(l)} <span class="num">${fmt(n[k])}</span></span>`).join("")}${pieces().type}</div>`;
    let shown;
    if (view === "all") shown = b.groups.map((g) => [g, g.rows]);
    else if (view === "mine") shown = b.groups.filter((g) => !isW(g) && !isA(g)).map((g) => [g, g.rows.filter((x) => x.me === true)]);
    else if (view === "approval") shown = b.groups.filter(isA).map((g) => [g, g.rows]);
    else shown = b.groups.filter(isW).map((g) => [g, g.rows]);
    shown = shown.filter(([, r]) => r.length);
    const empty = { mine: ["Nothing is assigned to you", "Work whose owner is you, Ingrid Solberg, shows here."], approval: ["Nothing waits on your approval", "AI agent runs, package access requests and reviews that wait on you, Ingrid Solberg, show here."], waiting: ["You are waiting on nobody", "Decisions and reviews you asked for show here until someone acts."], all: ["Nothing to do", ""] }[view];
    return h.page(
      h.header("My work", "", ""),
      vbar,
      shown.length ? `<div class="mw">${shown.map(([g, r]) => groupH(g, r)).join("")}</div>` : AK.empty({ title: empty[0], line: empty[1] }),
      note("My work is your one inbox: what is assigned to you, what needs your approval (AI agent runs and package access requests included) and what you wait on. The Review queue is the workspace's register; the bell holds mentions."),
    );
  }
  V3.S("my-work", () => mwPage("all"));
  V3.S("my-work-mine", () => mwPage("mine"));
  V3.S("my-work-approval", () => mwPage("approval"));
  V3.screen("my-work-waiting", () => mwPage("waiting"), "my-work");
  // The agents' Needs approval page and the queue's Waiting on me send the reader to My work's Needs my approval.
  V3.redirect("ai-drafts", "my-work-approval");
  V3.redirect("review-queue-mine", "my-work-approval");
  V3.S(/^ai-drafts-(runs|agents)$/, (orig) => edit(orig(), (C) => {
    for (const tb of C.querySelectorAll('.ak-tab[data-go="ai-drafts"], .ak-tab.on')) {
      if (!/^Needs approval/.test(txt(tb))) continue;
      tb.setAttribute("data-go", "my-work-approval"); tb.setAttribute("tabindex", "0");
      if (tb.firstChild && tb.firstChild.nodeType === 3) tb.firstChild.textContent = "Needs approval, in My work";
    }
  }));
  // Overview's Your tasks: My work's Assigned to me rows for this program, and that view.
  const assignedIn = (prog) => inbox().assigned.filter(([, x]) => (x.prog || WSX) === prog).length;
  V3.S("overview", (orig) => {
    const html = orig(); if (!wsx()) return html;
    return edit(html, (C) => {
      for (const el of C.querySelectorAll('[data-go="my-work"]')) {
        if (!/Your tasks/.test(txt(el))) continue;
        el.setAttribute("data-go", "my-work-mine");
        const n = el.querySelector("b.num"); if (n) n.textContent = fmt(assignedIn(WSX));
        const m = el.querySelector(".v7p-mu"); if (m) m.textContent = "assigned to you, in My work";
      }
    });
  });

  // ——— The bell holds mentions only (a V3 copy beside v2's, which the stylesheet hides while V3 is on) ———
  const MENTIONS = [{ who: "Nadia Fournier", on: "Approved vendor verification key set and release metadata binding, LRU-003 and LRU-020", text: "@Ingrid Solberg the binding covers LRU-003; is LRU-020's metadata in a second file?", age: "1d", unread: true }];
  function bell() {
    const top = document.querySelector("#proto .top"); if (!top || top.querySelector(".v3w-bellw")) return;
    const old = top.querySelector(".a-work-bellw:not(.v3w-bellw)");
    const unread = MENTIONS.filter((m) => m.unread).length;
    const rows = MENTIONS.map((r) => `<div class="a-work-ibr${r.unread ? " unread" : ""}">${AK.avatar(r.who, 28)}<div class="x"><span><b>${esc(r.who)}</b> mentioned you on <b>${esc(r.on)}</b></span><q>${esc(r.text)}</q></div><span class="t">${esc(r.age)}</span></div>`).join("");
    const html = `<span class="a-work-bellw v3w-bellw"><button type="button" class="a-work-bell" aria-haspopup="dialog" aria-expanded="false" aria-label="Mentions, ${unread} unread">${AK.i("bell")}${unread ? '<span class="a-work-dot" aria-hidden="true"></span>' : ""}</button>`
      + `<div class="a-work-inbox" role="dialog" aria-label="Mentions" hidden><div class="a-work-ibh"><b>Mentions <span class="num">${MENTIONS.length}</span></b><span class="sp"></span><button type="button" class="a-work-ibb" data-aw-inbox-close aria-label="Close the mentions" title="Close">✕</button></div>${rows}<div class="v3w-ibf">Work and approvals are in <a href="#my-work" class="ak-link">My work</a>.</div></div></span>`;
    if (old) old.insertAdjacentHTML("beforebegin", html); else { const av = top.querySelector(".avatar"); if (av) av.insertAdjacentHTML("beforebegin", html); else top.insertAdjacentHTML("beforeend", html); }
  }

  // ═══════════════════════════ 2. The Review queue lists every row it counts [C15 C14] ═══════════════════════════
  const RQ_PAGE = 25;
  const dayOf = (s) => { const m = /([A-Z][a-z]{2}) (\d{1,2})(?:, (\d{4}))?/.exec(s || ""); if (!m) return "9999-12-31"; const mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(m[1]) + 1; return `${m[3] || "2026"}-${String(mo).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`; };
  // WS-X90's evidence versions pending review that the Evidence register holds as records (accepting one removes it here too).
  function evPending() {
    const L = PA.evLookup && PA.evLookup.all ? PA.evLookup.all() : [];
    return L.filter((r) => r.state === "pending");
  }
  // The rows the queue lists: the rows v2 draws (gates, evidence, discussions, package, results, product assessment, offer), and
  // WS-X90's pending evidence records the register holds; the count is these rows.
  // The queue as the earlier layers draw it (this lane's wrapper steps aside while it is read).
  let RQ_INNER = false;
  function rqOrigHtml() { RQ_INNER = true; try { return typeof S["review-queue"] === "function" ? S["review-queue"]() : ""; } catch (e) { return ""; } finally { RQ_INNER = false; } }
  function rqRowsData(htmlIn) {
    const C = frag(htmlIn != null ? htmlIn : rqOrigHtml());
    const out = [];
    for (const tr of C.querySelectorAll("tbody tr")) {
      if (tr.cells.length < 6) continue;
      out.push({ tr: tr.outerHTML, name: txt(tr.cells[1]), kind: txt(tr.cells[2]), prog: txt(tr.cells[3]), waitOn: txt(tr.cells[4] && tr.cells[4].querySelector(".nm")) || "", since: dayOf(txt(tr.cells[5])), v2: true });
    }
    const hasEv = out.some((x) => x.kind === "Evidence to accept" && x.prog === "WS-X90");
    if (hasEv) for (const r of evPending()) {
      const since = String(r.collected || TODAY_ISO).slice(0, 10), d = Math.max(0, -days(since));
      const cells = [`<span class="a-work-cb" role="checkbox" tabindex="0" aria-checked="false" aria-label="Select ${esc(r.title)}" data-aw-sel="rq-all" data-aw-id="ev:${esc(r.id)}"><span class="ak-cb" aria-hidden="true"></span></span>`,
        `<span class="a-work-tr" style="max-width:330px" title="${esc(r.title)}">${esc(r.title)}</span>`, "Evidence to accept", '<span class="a-work-tr" style="max-width:170px" title="WS-X90">WS-X90</span>',
        AK.owner("Nadia Fournier"), `<span class="num">${esc(md(since))}</span> <span class="a-work-mu num">· ${d}d</span>`, AK.owner(r.owner)];
      out.push({ tr: `<tr tabindex="0" data-panel="a-docs-ev" data-id="${esc(r.id)}|evidence">${cells.map((c, i) => `<td${i === 1 ? ' class="nm"' : ""}>${c}</td>`).join("")}</tr>`, name: r.title, kind: "Evidence to accept", prog: "WS-X90", waitOn: "Nadia Fournier", since });
    }
    out.sort((a, b) => (a.since < b.since ? -1 : a.since > b.since ? 1 : 0));
    return out;
  }
  if (PA.reviewQueue && typeof PA.reviewQueue.total === "function") {
    const t0 = PA.reviewQueue.total;
    PA.reviewQueue.total = function () { if (!on()) return t0.apply(this, arguments); try { return rqRowsData().length; } catch (e) { return t0.apply(this, arguments); } };
  }
  V3.S("review-queue", (orig) => {
    if (RQ_INNER) return orig();
    const html = orig();
    return edit(html, (C) => {
      const rows = rqRowsData(html), n = rows.length, pages = Math.max(1, Math.ceil(n / RQ_PAGE));
      let pg = Math.min(get("rq.page", 0), pages - 1); if (pg < 0) pg = 0;
      const shown = rows.slice(pg * RQ_PAGE, pg * RQ_PAGE + RQ_PAGE);
      const body = C.querySelector("tbody"); if (body) body.innerHTML = shown.map((x) => x.tr).join("");
      const pager = C.querySelector(".pager");
      if (pager) pager.innerHTML = `<span class="num">${n ? `${pg * RQ_PAGE + 1}–${pg * RQ_PAGE + shown.length} of ${fmt(n)}` : "0 of 0"}</span><span class="v3w-pg">25 per page <button type="button" class="ib" aria-label="Previous page" data-v3w-rqpage="-1"${pg ? "" : " disabled"}>‹</button><button type="button" class="ib" aria-label="Next page" data-v3w-rqpage="1"${pg < pages - 1 ? "" : " disabled"}>›</button></span>`;
      const appr = approvalRows().length;
      for (const q of C.querySelectorAll(".qv, .ak-tab")) {
        const t = txt(q);
        if (/^All(?![a-z])/.test(t)) { const c = q.querySelector(".num, .ct"); if (c) c.textContent = fmt(n); }
        if (/^Waiting on me(?![a-z])/.test(t)) {
          q.innerHTML = q.classList.contains("ak-tab") ? `Needs my approval, in My work<span class="ct num">${fmt(appr)}</span>` : `Needs my approval <span class="num">${fmt(appr)}</span>`;
          q.setAttribute("aria-selected", "false");
          q.setAttribute("data-go", "my-work-approval"); q.setAttribute("role", "link"); q.setAttribute("tabindex", "0"); q.classList.remove("on"); q.removeAttribute("aria-current");
          q.setAttribute("title", "What waits on you is in My work");
        }
      }
      const nt = C.querySelector(".note-p");
      const line = `The queue lists every row it counts: ${plural(n, "record")} waiting on a reviewer, 25 a page. WS-X90's evidence rows are the Evidence register's versions pending review that the prototype holds as records; your own approvals are in My work.`;
      if (nt) nt.insertAdjacentHTML("beforebegin", note(esc(line))); else C.appendChild(frag(note(esc(line))));
    });
  });

  // ═══════════════════════════ 3. Mission Computer version 2: one dialog, wired [C12] ═══════════════════════════
  const mc2Taken = () => !!get("mc2");
  const BEHIND0 = 4; // consumers on version 1 before WS-X90 takes version 2 (component_consumers)
  const mcBehind = () => BEHIND0 - (mc2Taken() ? 1 : 0);
  V3.facts.mc2 = () => { const t = get("mc2"); return { taken: !!t, at: t ? t.at : null, by: t ? t.by : null, behind: mcBehind(), item: "Remediate CVE-2024-6387 on the Mission Computer", milestones: t ? 1 : 0 }; };
  function takeDialog() {
    if (mc2Taken()) {
      const t = get("mc2");
      return { title: "Mission Computer version 2", body: `<p class="ak-desc">WS-X90 took version 2 on ${esc(mdy(t.at))}, ${esc(t.by === ME ? "by you" : "by " + t.by)}. LRU-001 runs it; AC-17(2) and SC-23 wait on WS-X90's review.</p>`, footer: `<button type="button" class="btn" data-close-modal>Close</button>` };
    }
    const kv = (rows) => `<dl class="ak-kv v2k-kv">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
    const moves = [
      ["Components", `Mission Computer: ${BEHIND0} consumers behind, then ${BEHIND0 - 1}`],
      ["Composition and its Assets", "LRU-001 and asset AST-109001 run version 2"],
      ["Supplier", `X800 Missile component set: ${BEHIND0 - 1} consumers left on version 1`],
      ["POA&M", "Remediate CVE-2024-6387: milestone 1 of 3, take the fixed version, done"],
      ["Continuous monitoring", "Known-affected components passes: no affected version in use"],
    ];
    return { title: "Take version 2 of Mission Computer", body: `<p class="ak-desc">Version 2 carries 52 of version 1's 54 determinations and fixes CVE-2024-6387 (OpenSSH 9.8p1). AC-17(2) and SC-23 are affected, so they wait on WS-X90's review before they count again.</p>
      ${kv([["System", "SYS-WSX90 · LRU-001 Mission Computer"], ["From", "Version 1 · assessed Sep 30"], ["To", "Version 2 · published Nov 12"], ["Carried", "52 determinations"], ["To review", "AC-17(2), SC-23"]])}
      ${AK.section("What moves", `<ul class="v3w-moves">${moves.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join("")}</ul>`)}
      <label class="v3w-fl" for="v3w-take-note"><span>Review comment <span class="v3w-req">required</span></span><textarea id="v3w-take-note" class="v3w-ta" rows="3" placeholder="Say what WS-X90 checked before taking it."></textarea></label><p class="v3w-err" id="v3w-take-err" hidden>Say what WS-X90 checked before taking version 2.</p>`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v3w-take>Take version 2</button>` };
  }
  V3.M("v3w-take", () => takeDialog());
  // Every way into a Take version dialog for WS-X90's Mission Computer opens this one.
  for (const k of ["v7p-take", "v7a-take", "sys-take", "plat-take"]) V3.M(k, (orig, id) => (wsx() ? takeDialog() : orig()));
  V3.M("v7o-take", (orig, id) => (/wsx|1090|WS-X90/i.test(String(id || "")) ? takeDialog() : orig()));
  function doTake() {
    const ta = document.getElementById("v3w-take-note"), er = document.getElementById("v3w-take-err");
    const note2 = ta ? ta.value.trim() : "";
    if (!note2) { if (er) er.hidden = false; if (ta) { ta.setAttribute("aria-invalid", "true"); ta.focus(); } return; }
    put("mc2", { at: TODAY_ISO, by: ME, note: note2 });
    closeModal();
    toast(`WS-X90 took Mission Computer version 2: Components, Assets, POA&M and Continuous monitoring follow.`, { label: "Open Assets", route: "composition-assets" });
    if (V.redraw) V.redraw();
  }
  // Pages that follow the version taken.
  const MC_LINE = () => (mc2Taken() ? `WS-X90 took Mission Computer version 2 on ${md(get("mc2").at)}; ${plural(mcBehind(), "consumer")} still run version 1, which carries CVE-2024-6387.` : `Mission Computer version 2 is published and fixes CVE-2024-6387: ${plural(mcBehind(), "consumer")} run version 1.`);
  V3.S("home", (orig) => edit(orig(), (C) => {
    for (const b of C.querySelectorAll(".next, .ak-banner, .v7o-nudge, .banner")) {
      if (!/Mission Computer version 2/.test(txt(b))) continue;
      const span = b.querySelector("span:not(.gl):not(.sp)") || b;
      span.textContent = MC_LINE();
      for (const a of b.querySelectorAll("[data-panel], [data-go], [data-modal], a, .btn")) if (a !== span && !a.contains(span)) a.remove();
      b.insertAdjacentHTML("beforeend", `<a class="btn sm" href="#hosts" data-v2prog="${WSX}">${mc2Taken() ? "Open Host & providers" : "Take it on Host & providers"}</a>`);
    }
  }));
  V3.S("components", (orig) => edit(orig(), (C) => {
    if (!mc2Taken()) return;
    for (const tr of C.querySelectorAll("tbody tr")) { if (!/^Mission Computer/.test(txt(tr.cells[0]))) continue; for (const td of tr.cells) if (/^\d+ behind$/.test(txt(td))) td.textContent = `${mcBehind()} behind`; }
    for (const q of C.querySelectorAll(".qv")) if (/^Consumers behind/.test(txt(q))) { const c = q.querySelector(".num"); if (c) c.textContent = fmt(Math.max(0, +c.textContent.replace(/\D+/g, "") - 1)); }
  }));
  V3.S(/^component-mc(-where)?$/, (orig) => edit(orig(), (C) => {
    if (!mc2Taken()) return;
    C.querySelectorAll("*").forEach((el) => { if (el.children.length === 0 && /No consumer has taken version 2 yet/.test(el.textContent)) el.textContent = `WS-X90 took version 2 on ${md(get("mc2").at)}. ${plural(mcBehind(), "consumer")} still run version 1, which carries CVE-2024-6387.`; });
    for (const tr of C.querySelectorAll("tbody tr")) if (/^WS-X90/.test(txt(tr.cells[0]))) { if (tr.cells[2]) tr.cells[2].innerHTML = `52 of 54 ${mu("· version 2 · 2 to review")}`; if (tr.cells[3]) tr.cells[3].innerHTML = pill("ok", "Fixed by version 2"); if (tr.cells[4]) tr.cells[4].innerHTML = mu("Not needed"); }
  }));
  V3.S("suppliers", (orig) => edit(orig(), (C) => {
    for (const tr of C.querySelectorAll("tbody tr")) if (/^X800 Missile component set/.test(txt(tr.cells[0]))) for (const td of tr.cells) if (/Open CVE/.test(txt(td))) td.setAttribute("title", `CVE-2024-6387: ${plural(mcBehind(), "consumer")} of Mission Computer still run version 1`), td.insertAdjacentHTML("beforeend", ` ${mu(`· ${mcBehind()} on version 1`)}`);
  }));
  // The CVE's POA&M item (lane R owns POA&M; it reads facts.mc2 too, so this only fills in what R has not drawn).
  V3.S(/^poam$/, (orig) => edit(orig(), (C) => {
    if (!mc2Taken()) return;
    for (const tr of C.querySelectorAll("tbody tr")) {
      if (!/Remediate CVE-2024-6387 on the Mission Computer/.test(txt(tr))) continue;
      for (const td of tr.cells) {
        const t = txt(td);
        if (/^Not started\b/.test(t)) td.innerHTML = td.innerHTML.replace("Not started", "In progress");
        if (/^0 of 3$/.test(t)) td.textContent = "1 of 3";
      }
      tr.setAttribute("title", "Milestone 1 of 3, take Mission Computer version 2, done");
    }
  }));

  // ═══════════════════════════ 4. Continuous monitoring owns each recurring check [C11 C10] ═══════════════════════════
  // The one list of what was imported (Evidence › Sources' history, STIG checklists, Integrations' counts and the checks' footnote
  // read it). Files and dates are WS-X90's scanner ingestion and STIG import records.
  const IMP0 = [
    { src: "acas", at: "2026-11-12", by: "Joel Barrantes", file: "ACAS vulnerability scan — mission network, November", tool: "ACAS / Tenable.sc", st: "running", read: "Started Nov 12 · 02:15 UTC" },
    { src: "acas", at: "2026-10-10", by: "Joel Barrantes", file: "ACAS vulnerability scan — mission network, October", tool: "ACAS / Tenable.sc", st: "done", read: "1,284 results across 26 hosts" },
    { src: "nessus-gw", at: "2026-09-28", by: "Joel Barrantes", file: "Nessus scan — maintenance access gateway", tool: "ACAS / Tenable.sc", st: "cancelled", read: "Superseded by adversarial testing" },
    { src: "stig-sw", at: "2026-11-13", by: "Joel Barrantes", file: "disa-stig-checklist-internal-ethernet-switch.ckl", tool: "STIG Viewer 2.18", st: "queued", read: "Not read yet; replaces the checklists of Aug 18 once applied", n: 2 },
    { src: "stig-asd", at: "2026-11-04", by: ME, file: "LRU-001_mission-software_ASD_V6R5.cklb", tool: "STIG Viewer 3.6", st: "done", read: "286 rules: 223 not a finding, 11 open, 25 not applicable, 27 not reviewed", n: 1 },
    { src: "scap-lt", at: "2026-10-14", by: "Joel Barrantes", file: "scap-compliance-scan-maintenance-laptop-windows-11.xccdf.xml", tool: "SCC 5.10.1", st: "done", read: "286 results: 259 pass, 21 fail, 6 not applicable · score 90.6%", n: 1 },
    { src: "stig-mc", at: "2026-10-13", by: "Joel Barrantes", file: "disa-stig-checklist-mission-computing-rhel-9.ckl", tool: "STIG Viewer 2.18", st: "done", read: "412 rules: 371 not a finding, 29 open, 12 not applicable", n: 1 },
    { src: "scap-lt", at: "2026-10-02", by: ME, file: "LRU-019_win11_scc-arf.xml", tool: "SCC 5.10.1", st: "rejected", read: "Rejected: an ARF report, not XCCDF results" },
    { src: "stig-gw", at: "2026-09-30", by: "Automation", file: "LRU-007_Cisco_IOS-XE_Router_NDM_V3R7.cklb + RTR_V3R5.cklb", tool: "Evaluate-STIG 1.2508.1", st: "done", read: "139 rules: 78 not a finding, 11 open, 46 not applicable, 7 not reviewed", n: 2 },
    { src: "scap-lt", at: "2026-09-14", by: "Joel Barrantes", file: "scap-compliance-scan-maintenance-laptop-windows-11-2026-09-14.xccdf.xml", tool: "SCC 5.10.1", st: "superseded", read: "286 results: 251 pass, 29 fail, 6 not applicable" },
    { src: "stig-sw", at: "2026-08-18", by: "Priya Raghavan", file: "LRU-009_Cisco_IOS_Switch_NDM_V3R6.ckl + L2S_V3R1.ckl", tool: "STIG Viewer 2.18", st: "done", read: "65 rules: 54 not a finding, 6 open, 4 not applicable, 1 not reviewed", n: 2 },
    { src: "stig-mc", at: "2026-07-13", by: "Joel Barrantes", file: "LRU-001_RHEL_9_STIG_V2R8.ckl", tool: "STIG Viewer 2.18", st: "superseded", read: "398 rules answered, 41 open" },
    { src: "sbom-mc", at: "2026-11-12", by: "Priya Raghavan", file: "Mission Computer maintenance image SBOM, version 2", tool: "SBOM feeds", st: "done", read: "13 components · 0 affected" },
    { src: "sbom-mc", at: "2026-10-08", by: "Priya Raghavan", file: "Mission Computer maintenance image SBOM, version 1", tool: "SBOM feeds", st: "done", read: "13 components · 1 affected by CVE-2024-6387" },
    { src: "sbom-pic", at: "2026-11-13", by: "Joel Barrantes", file: "Software bill of materials — Payload Interface Controller firmware", tool: "SBOM feeds", st: "validating", read: "Started Nov 13 · 02:15 UTC" },
    { src: "sarif-tel", at: "2026-10-30", by: "Joel Barrantes", file: "Container image scan — telemetry services", tool: "Static analysis (SARIF)", st: "failed", read: "SARIF 2.1.0 validation failed at runs[0].results[17]" },
  ];
  const IMP_ST = { running: ["info", "Importing"], done: ["ok", "Applied"], cancelled: ["none", "Cancelled"], queued: ["none", "Queued"], rejected: ["bad", "Rejected"], superseded: ["none", "Superseded"], validating: ["info", "Validating"], failed: ["bad", "Failed"] };
  const imports = () => [...get("imports", []), ...IMP0].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  V3.facts.imports = (prog) => ((prog || WSX) === WSX ? imports() : []);
  // The program's sources: each reads its cadence and its state from the recurring check it feeds.
  const SOURCES = [
    { id: "acas", name: "ACAS vulnerability scan — mission network", kind: ".nessus", check: "vuln", owner: "Joel Barrantes", informs: 11 },
    { id: "stig-mc", name: "DISA STIG checklist — mission computing (RHEL 9)", kind: ".ckl", check: "stig", owner: "Joel Barrantes", informs: 10 },
    { id: "stig-asd", name: "DISA STIG checklist — mission software (ASD)", kind: ".cklb", check: "stig", owner: ME, informs: 10 },
    { id: "stig-sw", name: "DISA STIG checklist — internal Ethernet switch", kind: ".ckl", check: "stig", owner: "Priya Raghavan", informs: 10 },
    { id: "stig-gw", name: "Evaluate-STIG run — protected network gateway", kind: ".cklb", check: "stig", owner: "Joel Barrantes", informs: 10 },
    { id: "scap-lt", name: "SCAP compliance scan — maintenance laptop (Windows 11)", kind: "XCCDF", check: "stig", owner: "Joel Barrantes", informs: 8 },
    { id: "sbom-mc", name: "Mission Computer maintenance image SBOM", kind: "CycloneDX 1.5", check: "sbom", owner: "Priya Raghavan", informs: 10 },
    { id: "sbom-pic", name: "Software bill of materials — Payload Interface Controller firmware", kind: "CycloneDX", check: "sbom", owner: "Joel Barrantes", informs: 10 },
    { id: "nessus-gw", name: "Nessus scan — maintenance access gateway", kind: ".nessus", check: "vuln", owner: "Joel Barrantes", informs: 11, retired: true },
    { id: "sarif-tel", name: "Container image scan — telemetry services", kind: "SARIF 2.1.0", check: "vuln", owner: "Joel Barrantes", informs: 5 },
  ];
  // The recurring checks: Continuous monitoring's ten (the FY2027 plan's scheduled tasks) and the two Checks held alone.
  // Each has one cadence and one state; Checks' automated tests are read as the failing count of the check they test.
  const CHECKS = [
    { id: "vuln", name: "ACAS vulnerability scan, mission network", ctl: "RA-5, SI-2", cad: "Monthly", owner: "Joel Barrantes", last: "2026-10-11", due: "2026-11-15", run: "In progress", tests: [["check-scan", "Vulnerability scans run at RA-5's frequency", 2], ["check-iava", "IAVA and IAVB patches inside their windows", 3]] },
    { id: "stig", name: "STIG compliance scan", ctl: "CM-6", cad: "Monthly", owner: "Joel Barrantes", last: "2026-10-13", due: "2026-11-11", run: "Blocked", tests: [["check-stig", "No open STIG CAT I; CAT II inside 30 days", 2]] },
    { id: "sbom", name: "Known-affected components, from each SBOM", ctl: "RA-5, SI-2", cad: "Each release", owner: ME, last: "2026-11-12", due: "2026-11-09", run: "Open", tests: [["check-sbom", "No known-affected component in use", 1]] },
    { id: "poamr", name: "POA&M review", ctl: "CA-5", cad: "Monthly", owner: "Priya Raghavan", last: "2026-10-14", due: "2026-11-21", run: "Ready", tests: [["check-poam-review", "POA&M reviewed every month", 0]] },
    { id: "par", name: "Privileged account review", ctl: "AC-2, AC-6", cad: "Quarterly", owner: "Victor Amsel", last: null, due: "2026-12-01", run: "In progress", tests: [["check-priv-review", "Privileged accounts reviewed each quarter", 0]] },
    { id: "au6", name: "Audit log review sampling", ctl: "AU-6", cad: "Quarterly", owner: "Nadia Fournier", last: null, due: "2026-12-23", run: "Planned", tests: [] },
    { id: "cm", name: "Configuration baseline audit", ctl: "CM-2, CM-3", cad: "Quarterly", owner: ME, last: null, due: "2026-12-28", run: "Planned", tests: [] },
    { id: "expiring", name: "Evidence renewed before it expires", ctl: "CA-7", cad: "Daily", owner: null, last: TODAY_ISO, due: "2027-02-01", run: "Watching", tests: [["check-expiring", "Evidence renewed before it expires", 54]] },
    { id: "subset", name: "Reassessment sample: AC and IA controls", ctl: "CA-2, CA-7", cad: "Yearly", owner: "Nadia Fournier", last: null, due: "2027-02-11", run: "Planned", tests: [] },
    { id: "ir", name: "Incident response tabletop", ctl: "IR-3", cad: "Yearly", owner: "Priya Raghavan", last: null, due: "2027-03-13", run: "Planned", tests: [] },
    { id: "cp", name: "Contingency plan test on a whole article", ctl: "CP-4", cad: "Yearly", owner: "Amara Bell", last: null, due: "2027-04-12", run: "Planned", tests: [] },
    { id: "sa24", name: "Cyber resiliency exercise", ctl: "SA-24", cad: "Yearly", owner: "Wes Duarte", last: null, due: "2027-06-01", run: "Planned", tests: [] },
  ];
  const CHECK = Object.fromEntries(CHECKS.map((c) => [c.id, c]));
  // One state a check: Overdue (its due day passed and it is not done), Due soon (14 days), On schedule; the SBOM check passes
  // once no affected version is in use (Mission Computer version 2 taken).
  function checkNow(c) {
    const x = Object.assign({}, c);
    if (c.id === "sbom" && mc2Taken()) { x.run = "Passing"; x.due = null; x.last = get("mc2").at; x.tests = c.tests.map(([r, t]) => [r, t, 0]); }
    x.failing = x.tests.reduce((a, t) => a + t[2], 0);
    x.state = x.due && days(x.due) < 0 ? "overdue" : x.due && days(x.due) <= 14 ? "soon" : "ok";
    return x;
  }
  const checksNow = () => CHECKS.map(checkNow);
  V3.facts.checks = (prog) => ((prog || WSX) === WSX ? checksNow().map((c) => ({ id: c.id, name: c.name, cadence: c.cad, state: c.state, due: c.due, owner: c.owner, failing: c.failing })) : undefined);
  const CST = { overdue: ["bad", "Overdue"], soon: ["warn", "Due soon"], ok: ["ok", "On schedule"] };
  const cstPill = (c) => pill(CST[c.state][0], CST[c.state][1]);
  const dueCell = (c) => (c.due ? `<span class="num">${esc(String(c.due).slice(0, 4) === "2026" ? md(c.due) : mdy(c.due))}${days(c.due) < 0 ? ` · ${-days(c.due)}d late` : ""}</span>` : mu("Each release"));
  const lastImport = (src) => imports().filter((i) => i.src === src && (i.st === "done" || i.st === "superseded"))[0] || null;
  const pendingImport = (src) => imports().filter((i) => i.src === src && ["running", "queued", "validating"].includes(i.st))[0] || null;
  const failedImport = (src) => { const l = imports().filter((i) => i.src === src)[0]; return l && (l.st === "failed" || l.st === "rejected") && !lastImport(src) ? l : null; };
  function srcState(s) {
    if (s.retired) return ["none", "Retired"];
    if (failedImport(s.id)) return ["bad", "Import failed"];
    const p = pendingImport(s.id);
    if (p) return p.st === "running" ? ["info", "Importing"] : p.st === "validating" ? ["info", "Validating"] : ["none", "Import queued"];
    const c = checkNow(CHECK[s.check]), l = lastImport(s.id);
    if (!l) return ["none", "Never imported"];
    // Its check's cadence decides: a file older than one cadence is overdue (an SBOM is current until the next release).
    const every = { Daily: 1, Monthly: 30, Quarterly: 91, Yearly: 365 }[c.cad];
    return every && -days(l.at) > every ? ["bad", "Overdue"] : ["ok", "Current"];
  }
  function footLine() {
    const L = imports(), stig = L.filter((i) => /STIG|SCC|Evaluate/.test(i.tool));
    const inUse = SOURCES.filter((s) => /^stig|^scap/.test(s.id)).reduce((a, s) => { const l = lastImport(s.id); return a + (l ? l.n || 1 : 0); }, 0);
    const acas = lastImport("acas"), acasP = pendingImport("acas"), q = pendingImport("stig-sw");
    return `What the scans fed is read from Evidence › Sources: ACAS last imported ${md(acas ? acas.at : "")}${acasP ? `, with ${md(acasP.at)}'s import still running` : ""}; ${plural(inUse, "STIG checklist")} in use from ${plural(stig.length, "import")}${q ? `, the switch's ${md(q.at)} import queued` : ""}.`;
  }
  // ——— The Checks tab: one row a check ———
  let CM_TAB = null; // "runs" while Continuous monitoring's Runs tab is drawn
  function checksBody() {
    const list0 = checksNow(), qv = get("qv.checks", "all");
    const F = { all: () => true, overdue: (c) => c.state === "overdue", soon: (c) => c.state === "soon", failing: (c) => c.failing > 0 };
    const list = list0.filter(F[qv] || F.all);
    const rows = list.map((c) => ({ panel: "v3w-check", id: c.id, cells: [`<b>${esc(c.name)}</b> ${mu(esc(c.ctl))}`, `<span class="tag">${esc(c.cad)}</span>`, c.owner ? AK.owner(c.owner) : mu("No owner"), c.last ? `<span class="num">${esc(md(c.last))}</span>` : mu("Not yet"), dueCell(c), cstPill(c), c.tests.length ? num(c.failing) : DASH] }));
    return `${views("checks", [["all", "All", list0.length], ["overdue", "Overdue", list0.filter(F.overdue).length], ["soon", "Due in 14 days", list0.filter(F.soon).length], ["failing", "Failing tests", list0.filter(F.failing).length]], qv)}
      ${tblH(["Check", "Cadence", "Owner", "Last run", "Next due", "State", "Failing"], rows, { cls: "v3w-checks", empty: "No check matches." })}
      ${note(esc(footLine()) + " Each check has one cadence and one state; its runs are on the Runs tab, and the sources it reads say when they were last imported.")}`;
  }
  P["v3w-check"] = (id) => {
    if (!on()) return null;
    const c = checkNow(CHECK[id] || CHECKS[0]);
    const srcs = SOURCES.filter((s) => s.check === c.id && !s.retired);
    const facts = AK.facts([["State", cstPill(c)], ["Cadence", `<span class="tag">${esc(c.cad)}</span>`], ["Next due", dueCell(c)], ["Last run", c.last ? `<span class="num">${esc(md(c.last))}</span>` : mu("Not yet")], ["Run", esc(c.run)], ["Owner", c.owner ? AK.owner(c.owner) : mu("No owner")], ["Controls", esc(c.ctl)]]);
    const tests = c.tests.length ? AK.section("Tests", `<div class="ak-card v2k-lk">${c.tests.map(([r, t, n]) => `<div class="v2k-li" data-go="${esc(r)}" role="link" tabindex="0">${gl(n ? "diamond" : "check")}<span class="x">${esc(t)}</span><span class="e num">${n ? `${fmt(n)} failing` : "Passing"}</span></div>`).join("")}</div>`, { count: c.tests.length }) : "";
    const src = srcs.length ? AK.section("Sources it reads", `<div class="ak-card v2k-lk">${srcs.map((s) => { const l = lastImport(s.id), st = srcState(s); return `<div class="v2k-li" data-panel="v3w-source" data-id="${esc(s.id)}" role="button" tabindex="0">${gl("ring")}<span class="x">${esc(s.name)}<span class="v2k-sub">${l ? `Last imported ${esc(md(l.at))}` : "Never imported"}</span></span><span class="e">${pill(st[0], st[1])}</span></div>`; }).join("")}</div>`, { count: srcs.length }) : "";
    return { label: "Check preview", body: `<div class="v2k-pan">${AK.recordHead({ title: c.name, chip: cstPill(c) })}${facts}${tests}${src}<p class="note-p">One cadence and one state, read by Evidence › Sources and the checks' tests.</p></div>` };
  };
  // ——— The Runs tab: Schedule's tasks, each a run of a check ———
  function runsBody() {
    const f = S.schedule; let html = "";
    try { html = typeof f === "function" ? f() : ""; } catch (e) { html = ""; }
    const C = frag(html), keep = [];
    for (const el of C.querySelectorAll(".views, .tools, .frame")) keep.push(el.outerHTML);
    return `${keep.join("")}${note("Each run is a task of a recurring check, due by the check's cadence. Your own tasks are in My work.")}`;
  }
  function conmonFix(html) {
    return edit(html, (C) => {
      const tabs = C.querySelector(".ak-tabs"); if (!tabs) return;
      const onTab = tabs.querySelector(".ak-tab.on"), cur = CM_TAB === "runs" ? "runs" : onTab ? (onTab.getAttribute("data-v7p-tab") || "").split("|")[1] : "checks";
      const list = checksNow();
      // Tabs: Checks · Runs · Reauthorization triggers · Control status.
      for (const tb of tabs.querySelectorAll(".ak-tab")) {
        const k = (tb.getAttribute("data-v7p-tab") || "").split("|")[1];
        if (k === "checks") { tb.firstChild.textContent = "Checks"; const ct = tb.querySelector(".ct"); if (ct) ct.textContent = fmt(list.length); }
        if (CM_TAB === "runs") { tb.classList.remove("on"); tb.setAttribute("aria-selected", "false"); tb.removeAttribute("data-v7p-tab"); tb.setAttribute("data-v3w-cmtab", k); tb.setAttribute("tabindex", "0"); }
      }
      const runsN = (() => { try { return frag(S.schedule()).querySelectorAll("tbody tr").length; } catch (e) { return 14; } })();
      const checksTab = tabs.querySelector('[data-v7p-tab="conmon|checks"], [data-v3w-cmtab="checks"]');
      if (checksTab) checksTab.insertAdjacentHTML("afterend", `<span role="tab" aria-selected="${cur === "runs"}" class="ak-tab${cur === "runs" ? " on" : ""}"${cur === "runs" ? "" : ' data-go="conmon-runs" tabindex="0"'}>Runs<span class="ct num">${fmt(runsN)}</span></span>`);
      // The banner: the overdue checks, from the one list.
      const late = list.filter((c) => c.state === "overdue");
      for (const b of C.querySelectorAll(".ak-banner, .banner, .next")) {
        if (!/overdue/i.test(txt(b))) continue;
        const words = late.map((c) => (c.id === "vuln" ? `the ACAS scan is still running, due ${md(c.due)}` : c.id === "stig" ? `the STIG compliance scan is blocked, due ${md(c.due)}` : c.id === "sbom" ? `CVE-2024-6387 is in use on the Mission Computer, due ${md(c.due)}` : `${c.name}, due ${md(c.due)}`));
        if (!late.length) { b.remove(); continue; }
        const span = [...b.querySelectorAll("span")].find((s) => /overdue/i.test(s.textContent)) || b;
        span.innerHTML = `<b>${plural(late.length, "check is", "checks are")} overdue.</b> ${esc(words.join("; ").replace(/^./, (m) => m.toUpperCase()))}.`;
        b.querySelectorAll('[data-go="checks"]').forEach((a) => a.remove());
      }
      // The significant-change trigger names Increment 2's own IATT and ATO (lane G's records), not SSP 3.
      for (const td of C.querySelectorAll("tbody td")) if (/SSP 3 drafts the Block 1\.1 configuration/.test(txt(td))) td.innerHTML = esc("Increment 2's Block 1.1 is authorized on its own: its IATT, due May 18, 2027, then its ATO, on Lifecycle");
      // The body under the tabs.
      if (cur !== "checks" && cur !== "runs") return;
      let n = tabs.nextElementSibling; const drop = [];
      while (n && !(n.classList && n.classList.contains("note-p"))) { drop.push(n); n = n.nextElementSibling; }
      // Lead, integration: keep v2's "Shown in SSP section 13" link (lane X opens the SSP editor at that section); its other two links
      // pointed at Checks and Schedule, which this page now holds.
      const links = drop.map((x) => (x.classList && x.classList.contains("v7p-links") ? x : x.querySelector ? x.querySelector(".v7p-links") : null)).find(Boolean);
      drop.forEach((x) => x.remove());
      tabs.insertAdjacentHTML("afterend", `<div class="v3w-cm">${cur === "runs" ? runsBody() : checksBody()}</div>`);
      if (links && cur === "checks") {
        const ssp = [...links.querySelectorAll('[data-go="ssp"]')].find((a) => /SSP section/.test(a.textContent));
        if (ssp) { const keep = document.createElement("div"); keep.className = "v7p-links"; keep.appendChild(ssp.cloneNode(true)); const box = C.querySelector(".v3w-cm"); if (box) box.after(keep); }
      }
    });
  }
  V3.S("conmon", (orig) => { const html = orig(); if (!wsx()) return html; return conmonFix(html); });
  V3.screen("conmon-runs", () => { CM_TAB = "runs"; try { return S.conmon(); } finally { CM_TAB = null; } }, "conmon");
  V3.redirect("checks", "conmon");
  V3.redirect("schedule", "conmon-runs");
  V3.redirect(/^schedule-/, "conmon-runs");

  // ═══════════════════════════ 5. Evidence › Sources owns a program's sources and imports [C17 C10] ═══════════════════════════
  const srcLast = (s) => { const l = lastImport(s.id); return l ? `<span class="num">${esc(md(l.at))}</span> ${mu(`· ${-days(l.at)}d ago`)}` : mu("Never imported"); };
  function sourcesBody() {
    const qv = get("qv.sources", "all");
    const st = (s) => srcState(s)[1];
    const F = { all: (s) => !s.retired, attention: (s) => ["Import failed", "Overdue"].includes(st(s)), pending: (s) => ["Importing", "Validating", "Import queued"].includes(st(s)), retired: (s) => !!s.retired };
    const list0 = SOURCES, list = list0.filter(F[qv] || F.all);
    const rows = list.map((s) => { const c = checkNow(CHECK[s.check]), x = srcState(s); return { panel: "v3w-source", id: s.id, cells: [esc(s.name), `<span class="tag">${esc(s.kind)}</span>`, srcLast(s), `<span class="tag">${esc(c.cad)}</span>`, lnk(esc(c.name), `data-panel="v3w-check" data-id="${esc(c.id)}"`), pill(x[0], x[1]), AK.owner(s.owner)] }; });
    return `${views("sources", [["all", "All", list0.filter(F.all).length], ["attention", "Needs attention", list0.filter(F.attention).length], ["pending", "Import waiting", list0.filter(F.pending).length], ["retired", "Retired", list0.filter(F.retired).length]], qv)}
      ${tblH(["Source", "Kind", "Last imported", "Cadence", "Check", "State", "Owner"], rows, { cls: "v3w-srcs", empty: "No source matches." })}
      ${note("Each source's cadence and state come from the recurring check it feeds on Continuous monitoring; its imports are the one list STIG checklists and Integrations read. Owners are proposed.")}`;
  }
  function evidenceTabs(html, cur) {
    return edit(html, (C) => {
      const ph = C.querySelector(".ph, .ak-ih"); if (!ph) return;
      const all = (() => { const q = C.querySelector(".qv .num"); return q ? q.textContent : null; })();
      ph.insertAdjacentHTML("afterend", AK.tabs([["Artifacts", all, cur === "artifacts" ? null : "evidence", cur === "artifacts"], ["Sources", SOURCES.filter((s) => !s.retired).length, cur === "sources" ? null : "evidence-sources", cur === "sources"]], "Evidence"));
    });
  }
  V3.S("evidence", (orig) => { const html = orig(); return wsx() ? evidenceTabs(html, "artifacts") : html; });
  V3.screen("evidence-sources", () => {
    let html = ""; try { html = S.evidence(); } catch (e) { html = ""; }
    // The Evidence page's header and tab strip, then the sources.
    return edit(html, (C) => {
      const tabs = C.querySelector(".ak-tabs"); if (!tabs) return;
      tabs.querySelectorAll(".ak-tab").forEach((t) => { const on2 = /^Sources/.test(txt(t)); t.classList.toggle("on", on2); t.setAttribute("aria-selected", String(on2)); if (on2) { t.removeAttribute("data-go"); t.removeAttribute("tabindex"); } else { t.setAttribute("data-go", "evidence"); t.setAttribute("tabindex", "0"); } });
      let n = tabs.nextElementSibling; const drop = []; while (n) { drop.push(n); n = n.nextElementSibling; }
      drop.forEach((x) => x.remove());
      const btns = C.querySelector(".ph .btns, .ak-ih .btns");
      if (btns) btns.insertAdjacentHTML("afterbegin", btn("Add source", 'data-modal="plat-add-source" data-id="nessus"'));
      tabs.insertAdjacentHTML("afterend", sourcesBody());
    });
  }, "evidence");
  V3.redirect("sources", "evidence-sources");
  V3.redirect("sources-errors", "evidence-sources");
  P["v3w-source"] = (id) => {
    if (!on()) return null;
    const s = SOURCES.find((x) => x.id === id) || SOURCES[0], c = checkNow(CHECK[s.check]), st = srcState(s);
    const hist = imports().filter((i) => i.src === s.id);
    const facts = AK.facts([["State", pill(st[0], st[1])], ["Kind", `<span class="tag">${esc(s.kind)}</span>`], ["Last imported", srcLast(s)], ["Cadence", `${esc(c.cad)} ${mu("· from its check")}`], ["Check", lnk(esc(c.name), `data-panel="v3w-check" data-id="${esc(c.id)}"`)], ["Owner", AK.owner(s.owner)], ["Informs", `${num(s.informs)} controls`]]);
    const rows = hist.map((i) => `<div class="v2k-li">${gl(i.st === "done" ? "check" : i.st === "failed" || i.st === "rejected" ? "diamond" : "ring")}<span class="x">${esc(md(i.at))} · ${esc(i.file)}<span class="v2k-sub">${esc(i.read)} · ${esc(i.by)}</span></span><span class="e">${pill(IMP_ST[i.st][0], IMP_ST[i.st][1])}</span></div>`).join("");
    return { label: "Evidence source preview", body: `<div class="v2k-pan">${AK.recordHead({ title: s.name, chip: pill(st[0], st[1]), actions: s.retired ? "" : btn("Import file", `data-modal="v3w-import" data-id="${esc(s.id)}"`, true) })}${facts}${AK.section("Imports", `<div class="ak-card v2k-lk">${rows || '<div class="v2k-li"><span class="x">Nothing imported yet.</span></div>'}</div>`, { count: hist.length })}</div>` };
  };
  M["v3w-import"] = (id) => {
    if (!on()) return null;
    const s = SOURCES.find((x) => x.id === id) || SOURCES[0];
    return { title: `Import a file into ${s.name}`, body: `<p class="ak-desc">The file joins this source's imports: it is validated, then applied, and the source, its check and STIG checklists read it from there.</p>
      <label class="v3w-fl" for="v3w-imp-file"><span>File <span class="v3w-req">required</span></span><input id="v3w-imp-file" class="v3w-in" type="text" value="" placeholder="${esc(s.kind === ".nessus" ? "acas-mission-network-2026-11.nessus" : s.kind.indexOf("ckl") >= 0 ? "checklist.ckl" : "results.xml")}"></label>
      <p class="v3w-err" id="v3w-imp-err" hidden>Name the file to import.</p><p class="note-p">Kind ${esc(s.kind)} · the check it feeds: ${esc(CHECK[s.check].name)}.</p>`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v3w-import="${esc(s.id)}">Import file</button>` };
  };
  function doImport(id) {
    const s = SOURCES.find((x) => x.id === id); if (!s) return;
    const el = document.getElementById("v3w-imp-file"), er = document.getElementById("v3w-imp-err");
    const file = el ? (el.value.trim() || "") : "";
    if (!file) { if (er) er.hidden = false; if (el) { el.setAttribute("aria-invalid", "true"); el.focus(); } return; }
    const tool = { ".nessus": "ACAS / Tenable.sc", ".ckl": "STIG Viewer 2.18", ".cklb": "STIG Viewer 3.6", XCCDF: "SCC 5.10.1", "SARIF 2.1.0": "Static analysis (SARIF)" }[s.kind] || "SBOM feeds";
    put("imports", [{ src: s.id, at: TODAY_ISO, by: ME, file, tool, st: "queued", read: "Queued for validation" }, ...get("imports", [])]);
    closeModal();
    toast(`${file} imported into ${s.name}: queued for validation.`);
    if (V.redraw) V.redraw();
  }
  // Integrations lists connectors: its tabs into a program's sources go, and its counts read the one list.
  V3.S("integrations", (orig) => edit(orig(), (C) => {
    const tabs = C.querySelector(".ak-tabs, .tabs"); if (tabs && /Connected/.test(txt(tabs))) tabs.remove();
    const L = imports();
    const by = (re) => L.filter((i) => re.test(i.tool));
    const cnt = (re) => { const l = by(re); const applied = l.filter((i) => i.st === "done").length, waiting = l.filter((i) => ["queued", "running", "validating"].includes(i.st)).length, failed = l.filter((i) => ["failed", "rejected"].includes(i.st)).length; return `WS-X90: ${plural(l.length, "import")}, ${fmt(applied)} applied${waiting ? `, ${fmt(waiting)} waiting` : ""}${failed ? `, ${fmt(failed)} failed` : ""}`; };
    // Checklists in use: the latest applied import of each source the tool fed, as STIG checklists lists them.
    const inUse = (re) => SOURCES.reduce((a, s) => { const l = lastImport(s.id); return a + (l && re.test(l.tool) && l.st === "done" ? l.n || 1 : 0); }, 0);
    const ck = (re) => `WS-X90: ${plural(inUse(re), "checklist")} in use · ${cnt(re).replace(/^WS-X90: /, "")}`;
    const want = { "ACAS / Tenable.sc": cnt(/ACAS/), "STIG Viewer checklists": ck(/STIG Viewer|Evaluate-STIG/), "SCAP Compliance Checker": ck(/SCC/), "SBOM feeds": cnt(/SBOM/), "Static analysis (SARIF)": cnt(/SARIF/) };
    for (const card of C.querySelectorAll("div, li")) {
      const head = card.querySelector(":scope > b, :scope > div > b, :scope b"); if (!head) continue;
      const name = txt(head); if (!(name in want) || card.getAttribute("data-v3w-done")) continue;
      for (const el of card.querySelectorAll("*")) {
        if (el.children.length) continue;
        if (/^(WS-X90|Mission Computer):/.test(el.textContent.trim())) { el.textContent = want[name]; el.setAttribute("data-go", "evidence-sources"); el.setAttribute("role", "link"); el.setAttribute("tabindex", "0"); el.classList.add("v3w-srcl"); card.setAttribute("data-v3w-done", "1"); }
      }
    }
    const nt = C.querySelector(".note-p"); if (nt) nt.insertAdjacentHTML("beforebegin", note("A connector reads a kind of file or service. A program's sources and their imports are on its Evidence page, under Sources."));
  }));
  // STIG checklists: the next import follows the STIG compliance scan's monthly cadence; the footnote opens Evidence › Sources.
  V3.S(/^stigs(-[a-z0-9-]+)?$/, (orig) => edit(orig(), (C) => {
    if (!wsx()) return;
    const c = checkNow(CHECK.stig);
    for (const el of C.querySelectorAll("dd, td, span")) {
      if (el.children.length > 2) continue;
      if (/^Due [A-Z][a-z]{2} \d{1,2}(, \d{4})?$/.test(txt(el)) && el.closest("dd")) el.innerHTML = `${esc(`Due ${md(c.due)}`)} ${mu(`· monthly, the STIG compliance scan's cadence`)}`;
    }
    for (const a of C.querySelectorAll('[data-go="sources"], a[href="#sources"]')) { if (a.tagName === "A") a.setAttribute("href", "#evidence-sources"); else a.setAttribute("data-go", "evidence-sources"); if (/^Evidence sources$/.test(txt(a))) a.textContent = "Evidence › Sources"; }
  }));

  // ═══════════════════════════ 6. Host & providers holds providers and library components [C16 C23] ═══════════════════════════
  const HD = PA.HOSTD || null;
  const idpOf = () => (HD && HD.providers ? Object.values(HD.providers).find((p) => !p.auth || !p.auth.on) : null);
  const unauth = (pid) => { const p = HD && HD.providers ? HD.providers[pid] : null; return !!(p && p.auth && !p.auth.on && !/Authorized|Accredited/.test(p.auth.word || "")); };
  const LIB = () => [
    { el: "CN-109101", name: "Mission Computer", lru: "LRU-001", comp: "Mission Computer", owner: "Priya Raghavan", v: mc2Taken() ? 2 : 1, latest: 2, dets: mc2Taken() ? 52 : 54, review: mc2Taken() ? ["AC-17(2)", "SC-23"] : [], route: "component-mc" },
    { el: "CN-109118", name: "Security Log Collector", lru: "LRU-018", comp: "Audit Log Collector", owner: "Marcus Ryde", v: 1, latest: 1, dets: 14, review: [], decides: "AU-7, SI-4(2)", route: null },
  ];
  function libSection() {
    const rows = LIB().map((c) => {
      const behind = c.latest > c.v;
      const next = behind ? btn(`Take version ${c.latest}`, 'data-modal="v3w-take"', true) : c.review.length ? `${esc(c.review.length)} to review: ${esc(c.review.join(", "))}` : mu("Up to date");
      return { cells: [`${esc(c.name)} ${mu(esc(c.lru))}`, c.route ? `<a class="ak-link" href="#${esc(c.route)}">${esc(c.comp)}</a>` : esc(c.comp), `${num(c.v)}${behind ? ` ${mu(`· ${c.latest} published`)}` : ""}`, num(c.dets), AK.owner(c.owner), next] };
    });
    return AK.section("Library components", `${tblH(["Element", "Component", "Version", "Determinations", "Owner", "Next step"], rows, { pager: false, cls: "v3w-lib" })}<p class="note-p">Components assessed once: their determinations decide the controls on the element they build, not the program's inherited count.</p>`, { count: rows.length });
  }
  V3.S("hosts", (orig) => {
    const html = orig(); if (!wsx()) return html;
    return edit(html, (C) => {
      const ih = C.querySelector(".ak-ih .ak-desc");
      const lib = LIB().reduce((a, c) => a + c.dets, 0);
      if (ih) ih.insertAdjacentHTML("beforeend", ` · ${esc(plural(lib, "determination"))} from 2 library components`);
      // The provider with no authorization: flagged, and linked to its own program row.
      for (const tr of C.querySelectorAll('tr[data-panel="v2h-prov"]')) {
        const pid = tr.getAttribute("data-id"); if (!unauth(pid)) continue;
        const p = HD.providers[pid], prog = p.program || "";
        for (const td of tr.cells) if (/^Not authorized$/.test(txt(td))) td.innerHTML = `${pill("bad", "Not authorized")}`;
        tr.classList.add("v3w-flag");
        const sec = tr.closest("section");
        if (sec && !sec.querySelector(".v3w-flagline")) sec.insertAdjacentHTML("beforeend", `<div class="next v3w-flagline">${gl("diamond")}<span><b>${esc(p.name)} has no authorization of its own.</b> WS-X90 leans on it for ${plural(15, "hybrid control")}; an SCA would not accept the inheritance until it is authorized. Its program, ${esc(prog)}, is past due at TMRR with 0 of 287 controls satisfied.</span><a class="ak-link" href="#portfolio" ${goQ("portfolio", { rows: [p.name], note: "Showing the provider's program" })}>Open its program</a></div>`);
      }
      const provSec = [...C.querySelectorAll("section.ak-sec")].find((s) => /^Providers/.test(txt(s.querySelector("h3"))));
      if (provSec) provSec.insertAdjacentHTML("afterend", libSection());
    });
  });
  V3.redirect(/^inheritance(-.*)?$/, "hosts");
  // Boundary and Authorization read the providers WS-X90 takes from (a provider added on Host & providers joins them).
  const provsNow = () => (PA.v2host && PA.v2host.providers ? PA.v2host.providers(WSX) : []);
  V3.S(/^boundary(-iatt)?$/, (orig) => {
    const html = orig(); if (!wsx()) return html;
    return edit(html, (C) => {
      const sec = [...C.querySelectorAll("section.ak-sec")].find((s) => /^What it covers/.test(txt(s.querySelector("h3")))); if (!sec) return;
      const body = sec.querySelector("tbody"); if (!body) return;
      let added = 0;
      for (const p of provsNow()) {
        if (body.querySelector(`tr[data-panel="v2h-prov"][data-id="${CSS.escape(p.id)}"]`)) continue;
        const P0 = HD && HD.providers[p.id], auth = P0 && P0.auth ? (P0.auth.on ? `Its own ${P0.auth.word === "Authorized" ? "ATO" : String(P0.auth.word).toLowerCase()} · ${mdy(P0.auth.on)}` : P0.auth.word) : "";
        body.insertAdjacentHTML("beforeend", `<tr tabindex="0" data-panel="v2h-prov" data-id="${esc(p.id)}"><td class="nm">${esc(p.name)}</td><td>Outside · provider</td><td>${esc(auth)}</td><td>${fmt(p.inherited || 0)} inherited · ${fmt(p.hybrid || 0)} hybrid</td></tr>`);
        added++;
      }
      const ct = sec.querySelector("h3 .ct"); if (ct && added) ct.textContent = fmt(+ct.textContent.replace(/\D+/g, "") + added);
    });
  });
  V3.S(/^authorization$/, (orig) => {
    const html = orig(); if (!wsx()) return html;
    return edit(html, (C) => {
      const mini = C.querySelector(".v2h-minis"); if (!mini) return;
      const have = txt(mini);
      const extra = provsNow().filter((p) => have.indexOf(p.name) < 0);
      const box = mini.querySelector(".v2h-minib") || mini;
      for (const p of extra) box.insertAdjacentHTML("beforeend", `<span class="v3w-minip">${esc(p.name)}</span>`);
    });
  });
  // Settings keeps the workspace's catalog of providers; a program takes from it on its Host & providers page.
  V3.S("common-controls", (orig) => edit(orig(), (C) => {
    const t = C.querySelector(".ak-title, h2, h3"); if (t) t.textContent = "Provider catalog";
    const d = C.querySelector(".ak-desc"); if (d) d.textContent = "The workspace's host systems and common control providers, with their authorizations. A program takes controls from them on its own Host & providers page.";
    for (const b of C.querySelectorAll(".btn, button")) if (/^Add provider$/.test(txt(b))) b.textContent = "Add to catalog";
  }));
  // A control that leans on the unauthorized provider says so, in its preview and in the Controls register.
  V3.P("a-tests-control", (orig, id) => {
    const o = orig(); if (!o || typeof o.body !== "string" || !wsx() || !PA.v2host) return o;
    let r = null; try { r = PA.v2host.responsibility(String(id || "").split("|")[0]); } catch (e) { r = null; }
    if (!r || !r.providerId || !unauth(r.providerId)) return o;
    const line = `<div class="next v3w-flagline">${gl("diamond")}<span><b>Leans on ${esc(r.provider)}, which is not authorized.</b> An SCA would not accept this ${esc(String(r.kind || "").toLowerCase())} inheritance until the provider holds an authorization.</span><a class="ak-link" href="#hosts">Host & providers</a></div>`;
    return Object.assign({}, o, { body: line + o.body });
  });
  V3.S(/^controls$/, (orig) => {
    const html = orig(); if (!wsx() || !HD) return html;
    const idp = idpOf(); if (!idp) return html;
    return edit(html, (C) => {
      for (const td of C.querySelectorAll("tbody td")) if (td.children.length <= 1 && txt(td) === idp.name) td.insertAdjacentHTML("beforeend", ` ${mu("· not authorized")}`);
    });
  });

  // ═══════════════════════════ 7. Composition: its Assets tab is Inventory; LRU-001 follows version 2 [C12] ═══════════════════════════
  function compTabs(html, cur) {
    return edit(html, (C) => {
      const head = C.querySelector(".ak-ih, .ph"); if (!head) return;
      if (C.querySelector(".v3w-ctabs")) return;
      head.insertAdjacentHTML("afterend", `<div class="v3w-ctabs">${AK.tabs([["Elements", null, cur === "elements" ? null : "composition", cur === "elements"], ["Assets", 20, cur === "assets" ? null : "composition-assets", cur === "assets"]], "Composition")}</div>`);
    });
  }
  function compFix(html) {
    return edit(html, (C) => {
      // One call to action: the page's banner points to Host & providers; the other Take version buttons go.
      C.querySelectorAll('[data-modal="sys-take"], [data-modal="v7p-take"], [data-modal="v7a-take"]').forEach((a) => a.remove());
      const ban = [...C.querySelectorAll(".ak-banner, .banner, .ak-bn")].find((b) => /Mission Computer/.test(txt(b)) && /version 2/i.test(txt(b)));
      if (ban) {
        if (mc2Taken()) ban.remove();
        else if (!ban.querySelector(".v3w-hostl")) ban.insertAdjacentHTML("beforeend", `<a class="ak-link v3w-hostl" href="#hosts">Take it on Host & providers</a>`);
      }
      if (!mc2Taken()) return;
      C.querySelectorAll("*").forEach((el) => {
        if (el.children.length) return;
        const t = el.textContent.trim();
        if (t === "Library · v1" && el.closest("[data-id*='LRU-001'], [data-id*='CN-109101']")) el.textContent = "Library · v2";
        if (t === "1 behind" && el.closest("[data-id*='LRU-001'], [data-id*='CN-109101']")) el.remove();
      });
    });
  }
  V3.S(/^composition(-list|-config)?$/, (orig, route) => { const html = orig(); if (!wsx()) return html; return compTabs(compFix(html), "elements"); });
  V3.screen("composition-assets", () => {
    let html = ""; try { html = S.inventory(); } catch (e) { html = ""; }
    html = edit(html, (C) => {
      const t = C.querySelector(".ak-title, .ph h3"); if (t) t.textContent = "Composition";
      if (!mc2Taken()) return;
      for (const tr of C.querySelectorAll("tbody tr")) if (/AST-109001/.test(txt(tr))) for (const td of tr.cells) if (/^LRU-001$/.test(txt(td))) td.innerHTML = `LRU-001 ${mu("· Mission Computer version 2")}`;
    });
    return compTabs(html, "assets");
  }, "composition");
  V3.redirect(/^inventory$/, "composition-assets");

  // ═══════════════════════════ 8. Workspace setup in Settings; Deadlines' Adopt proposed [C24] ═══════════════════════════
  const dlAdopted = () => !!get("dl");
  function setupSteps() {
    return [
      { label: "Load the control catalog", sub: "NIST SP 800-53 Rev 5 (5.2.0), with the CNSSI 1253 overlays", done: true, route: "frameworks" },
      { label: "Give the workspace's roles their holders", sub: "AO, AODR, ISSM, ISSO, SCA and ISSE are held on WS-X90's people record", done: true, route: "permissions" },
      { label: "Adopt the proposed deadlines", sub: dlAdopted() ? `Adopted ${md(get("dl").at)} by ${get("dl").by}` : "12 proposed, 4 in use", done: dlAdopted(), route: "deadlines" },
      { label: "Choose the workspace's notifications", sub: "Alerts, their channels and the Monday digest", done: false, route: "notifications-workspace" },
    ];
  }
  V3.facts.workspaceSetup = () => { const s = setupSteps(); return { done: s.filter((x) => x.done).length, total: s.length, steps: s }; };
  V3.screen("workspace-setup", () => {
    const s = setupSteps(), done = s.filter((x) => x.done).length;
    const rows = s.map((x) => `<div class="v2k-li v3w-step${x.done ? " done" : ""}" data-go="${esc(x.route)}" role="link" tabindex="0">${gl(x.done ? "check" : "ring")}<span class="x">${x.done ? `<s>${esc(x.label)}</s>` : `<b>${esc(x.label)}</b>`}<span class="v2k-sub">${esc(x.sub)}</span></span><span class="e">${x.done ? "Done" : "Open"}</span></div>`).join("");
    return h.page(
      AK.indexHead({ title: "Workspace setup", desc: `Done once for the workspace, not per program · ${done} of ${s.length} steps done` }),
      `<div class="ak-card v2k-lk v3w-setup">${rows}</div>`,
      note("Each step reads the record it names. A program's own setup (requirements, mappings, evidence, its signed ITCSC) is the setup card on its Overview."),
    );
  }, "deadlines");
  if (PA.navRegister) { /* Settings' area holds Workspace setup (a V3-only page; the menu shows it only while V3 is on) */ }
  V3.S(/^deadlines(-(vuln|stig|findings|other))?$/, (orig) => edit(orig(), (C) => {
    const btns = C.querySelector(".ak-ih .btns");
    if (btns && !dlAdopted()) btns.insertAdjacentHTML("beforeend", btn("Adopt proposed", 'data-modal="v3w-adopt"', false, false));
    if (dlAdopted()) {
      for (const el of C.querySelectorAll(".pill, span")) if (el.children.length === 0 && el.textContent.trim() === "Proposed") { el.textContent = "On"; el.classList.remove("warn", "none", "info"); el.classList.add("ok"); }
      const nt = C.querySelector(".note-p"); if (nt) nt.insertAdjacentHTML("beforebegin", note(esc(`The proposed deadlines were adopted on ${md(get("dl").at)} by ${get("dl").by}: every deadline is in use.`)));
    }
  }));
  M["v3w-adopt"] = () => {
    if (!on()) return null;
    return { title: "Adopt the proposed deadlines", body: `<p class="ak-desc">The 12 proposed deadlines come into use for every program in the workspace: 6 for vulnerabilities, 3 for STIG rules and 3 for POA&M milestones, evidence renewal and access reviews. The 4 finding deadlines already in use stay as they are.</p><p class="note-p">Workspace setup's deadline step is done once they are adopted.</p>`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v3w-adopt>Adopt 12 deadlines</button>` };
  };

  // ═══════════════════════════ The menu: Settings holds Workspace setup and the provider catalog; AI agents keep Runs and Agents ═══════════════════════════
  const prevAreas = V3.areaGroups;
  V3.areaGroups = (G) => {
    const g0 = typeof prevAreas === "function" ? prevAreas(G) : G;
    const out = Object.assign({}, g0);
    if (out.deadlines) out.deadlines = out.deadlines.map(([g, items]) => [g, g === "Workspace" ? [["workspace-setup", "Workspace setup"], ...items.map(([k, l]) => (k === "common-controls" ? [k, "Provider catalog"] : [k, l]))] : items]);
    return out;
  };
  const prevRail = V3.rail;
  V3.rail = (R) => {
    const r0 = typeof prevRail === "function" ? prevRail(R) : R;
    return r0.map((r) => (r[0] === "ai-drafts" && r[3] ? [r[0], r[1], r[2], r[3].filter(([k]) => k !== "ai-drafts"), r[4]] : r[0] === "deadlines" && r[3] ? [r[0], r[1], r[2], [["workspace-setup", "Workspace setup"], ...r[3].map(([k, l]) => (k === "common-controls" ? [k, "Provider catalog"] : [k, l]))], r[4]] : r));
  };
  if (PA.navRegister) PA.navRegister({ workspace: { deadlines: ["workspace-setup"] } });
  V3.navDrawn(() => {
    for (const a of document.querySelectorAll('#rail a[href="#ai-drafts"], #bottom a[href="#ai-drafts"], #moreMenu a[href="#ai-drafts"]')) a.setAttribute("href", "#ai-drafts-runs");
    bell();
  });
  V3.ready(() => { if (on()) bell(); });

  // ═══════════════════════════ Listeners (V3 only) ═══════════════════════════
  document.addEventListener("click", (e) => {
    if (!on()) return;
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const tk = t.closest("[data-v3w-take]");
    if (tk) { e.preventDefault(); e.stopPropagation(); doTake(); return; }
    const im = t.closest("[data-v3w-import]");
    if (im) { e.preventDefault(); e.stopPropagation(); doImport(im.getAttribute("data-v3w-import")); return; }
    const ad = t.closest("[data-v3w-adopt]");
    if (ad) { e.preventDefault(); e.stopPropagation(); put("dl", { at: TODAY_ISO, by: ME }); closeModal(); toast("12 deadlines adopted: every deadline is in use. Workspace setup's deadline step is done.", { label: "Workspace setup", route: "workspace-setup" }); if (V.redraw) V.redraw(); return; }
    const cm = t.closest("[data-v3w-cmtab]");
    if (cm) { e.preventDefault(); e.stopPropagation(); const k = cm.getAttribute("data-v3w-cmtab"); location.hash = "conmon"; setTimeout(() => { const el = document.querySelector(`[data-v7p-tab="conmon|${CSS.escape(k)}"]`); if (el && !el.classList.contains("on")) el.click(); }, 60); return; }
    const pg = t.closest("[data-v3w-rqpage]");
    if (pg) { e.preventDefault(); e.stopPropagation(); if (pg.disabled) return; put("rq.page", Math.max(0, get("rq.page", 0) + +pg.getAttribute("data-v3w-rqpage"))); if (V.redraw) V.redraw(); const again = document.querySelector(`[data-v3w-rqpage="${pg.getAttribute("data-v3w-rqpage")}"]`); if (again && !again.disabled) again.focus(); return; }
    const qv = t.closest("[data-v3w-qv]");
    if (qv) { e.preventDefault(); e.stopPropagation(); const [k, v] = qv.getAttribute("data-v3w-qv").split("|"); put("qv." + k, v); if (V.redraw) V.redraw(); const again = document.querySelector(`[data-v3w-qv="${CSS.escape(k + "|" + v)}"]`); if (again) again.focus(); return; }
  }, true);
  document.addEventListener("keydown", (e) => {
    if (!on()) return;
    const t = e.target; if (!t || !t.matches) return;
    if ((e.key === "Enter" || e.key === " ") && t.matches(".v3w-mw[data-panel], #main .v2k-li[data-go], #panel .v2k-li[data-go], #panel .v2k-li[data-panel]")) { e.preventDefault(); t.click(); }
  }, true);
  // A page turned in the Review queue starts again at its first page on the next visit.
  window.addEventListener("hashchange", () => { if (!on()) return; if (V.cur && V.cur() !== "review-queue" && get("rq.page", 0)) put("rq.page", 0); });
})();
