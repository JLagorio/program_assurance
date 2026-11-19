// After kit (ak-): the workflow pieces Vanta draws, in Ledger's look, shared by every after screen. window.PA.AK
// Shapes follow BA/dev/work.md "Workflow pieces, as Vanta draws them", which cites the screenshots for each.
(function () {
  const { h, data, M } = window.PA;
  const { esc } = h;
  const TODAY = data.TODAY;
  const ini = (n) => String(n).split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const days = (iso) => Math.round((new Date(iso + "T12:00:00") - TODAY) / 86400000);
  const md = (iso) => { const d = new Date(iso + "T12:00:00"); return d.toLocaleDateString("en-US", d.getFullYear() === TODAY.getFullYear() ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" }); };
  const P = {
    calendar: "M3 4.5h10v9H3zM3 7h10M6 3v3M10 3v3", clock: "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM8 5v3l2 1.5", flag: "M4 14V2.5M4 3h7.5l-1.5 2.5L11.5 8H4",
    eye: "M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8zM8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z", send: "M2.5 8 13.5 3 10 13.5 7.5 9zM7.5 9l6-6", dots: "M3.5 8h.01M8 8h.01M12.5 8h.01",
    mail: "M2.5 4h11v8h-11zM2.5 4.5 8 9l5.5-4.5", plus: "M8 3v10M3 8h10", check: "M3 8.5l3 3 7-7", x: "M4 4l8 8M12 4l-8 8", pen: "M10.5 3l2.5 2.5L6 12.5 3 13l.5-3z",
    user: "M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 13.5c0-2.5 2.2-4 5-4s5 1.5 5 4", sparkle: "M8 2l1.3 3.2L12.5 6.5 9.3 7.8 8 11 6.7 7.8 3.5 6.5l3.2-1.3z", link: "M7 9a2.5 2.5 0 0 0 3.5 0l2-2a2.5 2.5 0 0 0-3.5-3.5L8 4.5M9 7a2.5 2.5 0 0 0-3.5 0l-2 2A2.5 2.5 0 0 0 7 12.5l1-1",
    upload: "M8 11V3M5 6l3-3 3 3M3 13h10", down: "M4 6l4 4 4-4", back: "M10 3 5 8l5 5", ban: "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM4.2 4.2l7.6 7.6", bell: "M4 11V7a4 4 0 0 1 8 0v4l1 1.5H3zM6.5 14h3",
    task: "M3 3.5h10v9H3zM5.5 8l1.5 1.5 3-3", chat: "M3 3h10v7H7l-3 3v-3H3z", history: "M3 8a5 5 0 1 0 1.5-3.5M3 2.5v2.5h2.5M8 5.5V8l2 1.5", gear: "M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4",
  };
  const AK = {};
  AK.i = (k, cls = "") => `<svg class="ak-i ${cls}" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[k] || P.dots}"/></svg>`;
  AK.md = md; AK.days = days;

  // A numbered callout matching the change list under the pair. Put it right after the element it marks.
  AK.co = (n) => `<i class="ak-co" aria-hidden="true">${n}</i>`;

  // People: initials avatars; nobody is a dashed person glyph and "Unassigned".
  AK.avatar = (n, size = 24) => n ? `<span class="ak-av" style="--s:${size}px">${esc(ini(n))}</span>` : `<span class="ak-av none" style="--s:${size}px">${AK.i("user")}</span>`;
  AK.avatars = (names) => `<span class="ak-avs">${names.map((n) => AK.avatar(n, 22)).join("")}</span>`;
  AK.owner = (n, opt = {}) => `<span class="ak-owner${n ? "" : " none"}">${AK.avatar(n, opt.size || 22)}<span class="nm">${esc(n || opt.label || "Unassigned")}</span></span>`;
  // The owner picker: search, the reader first as "(You)", each person with a muted role, Unassign owner at the foot.
  AK.ownerPicker = ({ you, people = [] }) => `<div class="ak-pop" role="listbox" aria-label="Owner"><div class="ak-pop-s">${AK.i("user")}<span>Search people</span></div>
    ${[[you + " (You)", people.find((p) => p[0] === you)?.[1] || ""], ...people.filter((p) => p[0] !== you)].map(([n, r]) => `<div class="ak-pop-r">${AK.avatar(n.replace(" (You)", ""), 22)}<span>${esc(n)}</span><span class="r">${esc(r)}</span></div>`).join("")}
    <div class="ak-pop-f">${AK.i("x")}Unassign owner</div></div>`;

  // Dates: a calendar glyph and the day; past due turns red with a flag and the age; an SLA is a clock fact.
  AK.due = (iso, opt = {}) => {
    if (!iso) return `<span class="ak-due none">${AK.i("calendar")}${esc(opt.none || "No due date")}</span>`;
    const d = days(iso);
    if (opt.done) return `<span class="ak-due">${AK.i("calendar")}${opt.prefix === false ? "" : "Due "}${md(iso)}</span>`;
    if (d < 0) return `<span class="ak-due bad">${AK.i("flag")}${opt.prefix === false ? "" : "Due "}${md(iso)} · ${-d === 1 ? "1 day" : -d + " days"} ago</span>`;
    if (d <= 14) return `<span class="ak-due warn">${AK.i("calendar")}${opt.prefix === false ? "" : "Due "}${md(iso)} · ${d === 0 ? "today" : "in " + (d === 1 ? "1 day" : d + " days")}</span>`;
    return `<span class="ak-due">${AK.i("calendar")}${opt.prefix === false ? "" : "Due "}${md(iso)}</span>`;
  };
  AK.sla = (text) => `<span class="ak-due">${AK.i("clock")}SLA: ${esc(text)}</span>`;

  // Record header: a back link or crumbs, the title (with a state chip beside it), actions on the right,
  // one paragraph, a row of labelled values (status, ID, owner, due, cadence, framework codes), then counted line tabs.
  AK.back = (label, route) => `<span class="ak-back"${route ? ` data-go="${esc(route)}" role="link" tabindex="0"` : ""}>${AK.i("back")}${esc(label)}</span>`;
  AK.crumbs = (list) => `<nav class="ak-crumbs" aria-label="Breadcrumb">${list.map(([l, r], i) => (i < list.length - 1 && r ? `<span data-go="${esc(r)}" role="link" tabindex="0">${esc(l)}</span>` : `<span>${esc(l)}</span>`)).join(`<span class="sep" aria-hidden="true">›</span>`)}</nav>`;
  AK.facts = (list) => `<dl class="ak-facts">${list.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
  AK.chip = (text, opt = {}) => `<span class="ak-chip${opt.tone ? " " + opt.tone : ""}">${opt.icon ? AK.i(opt.icon) : ""}${esc(text)}</span>`;
  AK.codes = (list) => `<span class="ak-codes">${list.map((c) => `<span class="ak-code">${esc(c)}</span>`).join("")}</span>`;
  AK.tabs = (list, label = "Sections") => `<div class="ak-tabs" role="tablist" aria-label="${esc(label)}">${list.map(([l, n, r, on]) => `<span role="tab" aria-selected="${on ? "true" : "false"}" class="ak-tab${on ? " on" : ""}"${r ? ` data-go="${esc(r)}" tabindex="0"` : ""}>${esc(l)}${n !== undefined && n !== null ? `<span class="ct num">${esc(typeof n === "number" ? h.fmt(n) : n)}</span>` : ""}</span>`).join("")}</div>`;
  AK.recordHead = ({ back, crumbs, title, chip = "", desc, facts, actions = "", tabs, co = "" }) => `<div class="ak-rh">${back ? AK.back(back[0], back[1]) : crumbs ? AK.crumbs(crumbs) : ""}
    <div class="ak-rh-top"><div class="ak-rh-t"><div class="ak-title-row"><h2 class="ak-title">${esc(title)}</h2>${chip}${co}</div>${desc ? `<p class="ak-desc">${desc}</p>` : ""}</div><div class="btns">${actions}</div></div>
    ${facts ? AK.facts(facts) : ""}${tabs ? AK.tabs(tabs) : ""}</div>`;
  // An index page's head: title, one line, actions. Counts go in its tabs, or one banner, not in cards.
  AK.indexHead = ({ title, desc, actions = "", co = "" }) => `<div class="ak-ih"><div class="ak-rh-t"><div class="ak-title-row"><h2 class="ak-title">${esc(title)}</h2>${co}</div>${desc ? `<p class="ak-desc">${desc}</p>` : ""}</div><div class="btns">${actions}</div></div>`;

  // Layout: a record's body beside its rail of facts; sections inside it.
  AK.withRail = (body, rail) => `<div class="ak-rec"><div class="ak-rec-b">${body}</div><aside class="ak-rail">${rail}</aside></div>`;
  AK.railCard = (title, rows, opt = {}) => `<div class="ak-rail-s">${title ? `<div class="ak-rail-t">${esc(title)}${opt.co || ""}</div>` : ""}<dl class="ak-kv">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl></div>`;
  AK.section = (title, body, opt = {}) => `<section class="ak-sec"><div class="ak-sec-h"><h3>${esc(title)}${opt.count !== undefined ? `<span class="ct num">${esc(opt.count)}</span>` : ""}${opt.co || ""}</h3>${opt.action || ""}</div>${body}</section>`;
  AK.card = (body, opt = {}) => `<div class="ak-card${opt.cls ? " " + opt.cls : ""}">${body}</div>`;

  // One line above a list, in place of summary cards: what needs doing, and the button that does it.
  AK.banner = ({ tone = "warn", text, action, co = "" }) => `<div class="ak-banner ${tone}">${h.gl(tone === "bad" ? "diamond" : tone === "info" ? "info" : tone === "ok" ? "check" : "clock")}<span class="x">${text}</span>${action ? `<span class="btn sm">${esc(action)}</span>` : ""}${co}</div>`;

  // Comments: a record tab ("Comments", or "Assessor comments" and "Internal comments" when outsiders join).
  // The thread runs oldest first, each comment tied by a thin rule; the composer sits under it.
  AK.mention = (n) => `<span class="ak-at">@${esc(n)}</span>`;
  AK.comment = ({ who, role, when, text, flag }) => `<div class="ak-c">${AK.avatar(who, 28)}<div class="ak-c-b"><div class="ak-c-h"><b>${esc(who)}</b>${role ? `<span class="ak-role">${esc(role)}</span>` : ""}<span class="t">${esc(when)}</span><span class="ak-c-m">${AK.i("dots")}</span></div>${flag ? `<div class="ak-c-flag">${AK.i("flag")}${esc(flag)}</div>` : ""}<div class="ak-c-x">${text}</div></div></div>`;
  AK.composer = ({ you = "Ingrid Solberg", placeholder = "Comment or add others with @…", external = false, review } = {}) => `${external ? `<div class="ak-ext">${AK.i("eye")}This is an external facing conversation. The assessor can read it.</div>` : ""}
    <div class="ak-compose">${AK.avatar(you, 28)}<div class="ak-input">${esc(placeholder)}</div><span class="ak-send" aria-label="Send">${AK.i("send")}</span></div>
    ${review ? `<label class="ak-review">${AK.check(false)}<span><b>${esc(review[0])}</b> ${esc(review[1] || "")}</span></label>` : ""}`;
  AK.comments = ({ items = [], composer = true, external = false, review, you, placeholder } = {}) => `<div class="ak-cm">${items.length ? `<div class="ak-thread">${items.map(AK.comment).join("")}</div>` : `<p class="ak-none">No comments yet.</p>`}
    ${composer ? AK.composer({ you, placeholder, external, review }) : ""}</div>`;

  // Activity: who did what, oldest first like the thread, with the time.
  AK.activity = (items) => `<ol class="ak-act">${items.map(({ who, what, when }) => `<li>${AK.avatar(who, 22)}<span class="x"><b>${esc(who || "Program Assurance")}</b> ${what}</span><span class="t">${esc(when)}</span></li>`).join("")}</ol>`;

  // Approval: a block with a ring, "Approval" and what's next; steps of up to three approvers, each request dated;
  // a black decision button for the approver. A pending version is a card with its requester.
  const stateLine = (s, when) => s === "approved" ? `<span class="ak-ok">${AK.i("check")}Approved${when ? " " + esc(when) : ""}</span>` : s === "changes" ? `<span class="ak-bad">Changes requested${when ? " " + esc(when) : ""}</span>` : s === "waiting" ? `<span class="t">Not started</span>` : `<span class="t">Request sent on ${esc(when || "")}</span>`;
  AK.approval = ({ title = "Approval", sub, facts, steps = [], decision, note, co = "" }) => `<div class="ak-appr"><div class="ak-appr-h"><span class="ak-ring${steps.every((s) => s.approvers.every((a) => a.state === "approved")) && steps.length ? " done" : ""}"></span><div><b>${esc(title)}</b>${co}${sub ? `<div class="s">${esc(sub)}</div>` : ""}</div></div>
    ${facts ? AK.facts(facts) : ""}
    ${steps.map((s, i) => `<div class="ak-appr-step"><div class="k">${esc(s.label || "Step " + (i + 1))}</div>${s.approvers.map((a) => `<div class="ak-appr-r"><span class="ak-ring sm${a.state === "approved" ? " done" : ""}"></span>${AK.avatar(a.who, 22)}<b>${esc(a.who)}</b>${a.role ? `<span class="t">${esc(a.role)}</span>` : ""}${stateLine(a.state, a.when)}</div>`).join("")}</div>`).join("")}
    ${note ? `<p class="ak-appr-n">${note}</p>` : ""}${decision ? `<div class="btns"><span class="btn sm ink">${esc(decision)}</span><span class="btn sm" aria-label="More">${AK.i("dots")}</span></div>` : ""}</div>`;
  AK.pendingVersion = ({ title = "Pending approval version", created, requester, approvers = [], co = "" }) => `<div class="ak-pend"><span class="ak-pend-i">${AK.i("clock")}</span><div class="ak-pend-b"><b>${esc(title)}</b>${co}<div class="s">${esc(created || "")}</div>
    <div class="ak-pend-r">Approval requested by ${esc(requester)} · <span class="ak-link">View</span></div>
    ${approvers.map((a) => `<div class="ak-appr-r"><span class="ak-ring sm${a.state === "approved" ? " done" : ""}"></span>${AK.avatar(a.who, 22)}<b>${esc(a.who)}</b>${stateLine(a.state || "sent", a.when)}</div>`).join("")}</div></div>`;
  AK.awaiting = (from, actions = ["Approve"]) => `<div class="ak-await"><span>Pending approval from <b>${esc(from)}</b></span><span class="btns">${actions.map((a, i) => `<span class="btn sm${i ? "" : " ink"}">${esc(a)}</span>`).join("")}</span></div>`;

  // A change that asks for a reason: before and after values, a required review comment, and who decides.
  AK.change = (before, after) => `<span class="ak-chg"><span class="ak-chg-v">${esc(before)}</span>${AK.i("down", "r")}<span class="ak-chg-v now">${esc(after)}</span></span>`;
  AK.reviewComment = ({ label = "Review comment", help, primary = "Assign approvers and submit", co = "" }) => `<div class="ak-rc"><div class="k">${esc(label)} <span class="req">Required</span>${co}</div><div class="ak-input">${esc(help || "Explain the reasoning behind the change.")}</div><div class="btns"><span class="btn sm ink">${esc(primary)}</span></div></div>`;
  // Afterwards the record says why: the state as a chip beside the title, and a first card with the reason.
  AK.reasonCard = ({ question, reason, who, when, action, co = "" }) => `<div class="ak-reason"><div class="ak-reason-h"><b>${esc(question)}</b>${co}${action ? `<span class="btn sm">${esc(action)}</span>` : ""}</div><p>${esc(reason)}</p><div class="s">${esc(who)} · ${esc(when)}</div></div>`;

  // A reminder: when it was last sent, and the button that sends it.
  AK.remind = ({ last, label = "Remind" } = {}) => `<span class="ak-remind"><span>${last ? `Last reminded on ${esc(last)}` : "Not reminded yet"}</span><span class="btn sm">${AK.i("mail")}${esc(label)}</span></span>`;

  // The bar that replaces the toolbar while rows are chosen: the count, Deselect, then outline actions.
  AK.bulk = ({ count, actions = [], co = "" }) => `<div class="ak-bulk"><span class="n num">${esc(count)} selected</span><span class="div"></span><span class="ak-link">Deselect</span>${actions.map((a) => `<span class="btn sm">${esc(a)}</span>`).join("")}${co}</div>`;
  AK.check = (on) => `<span class="ak-cb${on ? " on" : ""}" aria-hidden="true"></span>`;

  // Tasks: a register row (task, due, assignee, status, source), or a person's open task with its age.
  AK.taskStatus = (done) => done ? h.pill("ok", "Complete") : h.pill("none", "Open");
  AK.task = ({ title, source, owner, due, done, kind }) => `<div class="ak-task${done ? " done" : ""}"><span class="ak-ring sm${done ? " done" : ""}"></span><span class="x"><b>${esc(title)}</b>${source ? `<span class="s">${esc(source)}</span>` : ""}</span>${kind ? `<span class="tag">${esc(kind)}</span>` : "<span></span>"}${owner !== undefined ? AK.owner(owner) : "<span></span>"}${due !== undefined ? AK.due(due, { done }) : "<span></span>"}</div>`;
  AK.progress = (done, total, unit = "complete") => { const p = total ? Math.round((done / total) * 100) : 0; return `<span class="ak-prog"><span class="ak-donut" style="--p:${p}"></span><span class="num">${done} of ${total} ${esc(unit)}</span></span>`; };

  // Requests between the program and its assessor (the evidence request list).
  const REQ = { "Not ready": "none", "Internal review": "part", "Ready for assessor": "info", Accepted: "ok", Flagged: "bad" };
  AK.request = (s) => h.pill(REQ[s] || "none", s);
  AK.shared = ({ count, by, when, items = [], co = "" }) => `<div class="ak-shared"><div class="ak-shared-h"><b>Shared with your assessor <span class="num">${esc(count)}</span></b>${co}<span class="s">Last shared by ${esc(by)} on ${esc(when)}</span></div>
    ${items.map(([t, s]) => `<div class="ak-shared-r">${AK.check(false)}${AK.i("link")}<span class="x"><b>${esc(t)}</b><span class="s">${esc(s)}</span></span></div>`).join("")}</div>`;

  AK.empty = ({ title, line, action }) => `<div class="ak-empty"><div class="ak-empty-i" aria-hidden="true"></div><b>${esc(title)}</b>${line ? `<p>${esc(line)}</p>` : ""}${action ? `<span class="btn sm ink">${esc(action)}</span>` : ""}</div>`;
  AK.steps = (list, current) => `<ol class="ak-wz">${list.map((l, i) => `<li class="${i < current ? "done" : i === current ? "now" : ""}"><span class="ak-step-n">${i < current ? "" : i + 1}</span><span>${esc(l)}</span></li>`).join("")}</ol>`;
  AK.toast = (text, link) => `<div class="ak-toast" role="status">${h.gl("check")}<span>${esc(text)}</span>${link ? `<span class="ak-link">${esc(link)}</span>` : ""}</div>`;
  AK.note = (text) => `<p class="note-p"><span class="ex">Example</span> ${esc(text)}</p>`;

  // Dialogs any after screen can open: data-modal="ak-reason" data-id="Deactivate check|What it does" and data-modal="ak-approvers" data-id="<record>".
  M["ak-reason"] = (id) => {
    const [title, line] = String(id || "Change status|").split("|");
    return { title, body: `<p class="ak-desc">${esc(line || "")}</p>
      <div class="ak-field"><label>Duration</label><div class="ak-select">Indefinitely ${AK.i("down")}</div></div>
      <div class="ak-field"><label>Reason <span class="req">Required</span></label><div class="ak-input tall">Why is this changing? The reason shows on the record, with your name and the date.</div></div>
      <div class="ak-field"><label>Evidence <span class="opt">Optional</span></label><div class="ak-drop">${AK.i("upload")}Upload a file or link a document</div></div>`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-close-modal>Save</button>` };
  };
  M["ak-approvers"] = (id) => ({ title: "Assign approvers", body: `<p class="ak-desc">Approvers are emailed. Everyone in a step must approve before the next step starts.</p>
      <div class="ak-stepcard"><div class="k"><span class="ak-step-n">1</span>Approval step</div><p class="s">Add up to three approvers. Each must approve.</p><div class="ak-select">${AK.i("user")}Search people</div></div>
      <div class="ak-addstep">${AK.i("plus")}Add new approval step</div>
      <div class="ak-field"><label>Add a message <span class="opt">Optional</span></label><div class="ak-input tall">${esc(id ? "Please review " + id + "." : "")}</div><span class="s">${AK.i("sparkle")}Draft with AI</span></div>`,
    footer: `<span class="s num" style="margin-inline-end:auto">Step 1 of 2</span><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-close-modal>Next</button>` });

  window.PA.AK = AK;
})();
