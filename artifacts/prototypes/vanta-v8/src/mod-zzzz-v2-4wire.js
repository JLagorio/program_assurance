// Prototype v2, agent F (v2f-): what the re-review (v2/R/review.json) found still breaks, fixed through the chain's one handler.
// Every primary here carries data-v2-wired and data-v2k="<action>"; mod-zzzz-v2-1chain.js checks its required fields, runs the
// action (CH.ACTIONS), closes the dialog, redraws the screen and the open preview, and says what changed with a link to it.
// - Evidence [the review's new high, B10]: Review evidence takes a real decision; What to revise is required only to send back.
//   Upload and Add link add an artifact (a file or a URL is required), pending review: the register, its quick views, the preview
//   and a requirement's chain read it (evx.add, evx.rev.<id>, read by mod-after-docs.js).
// - The registers' own create verbs make what their preview counterparts make [B1, B9, new medium]: POA&M Create POA&M item (any
//   open operational issues it answers), Risks Create risk, Schedule Create task, SI-2 Add evidence (cited by REQ-064), and the
//   Assessments card's Plan an assessment (the planned CVI campaign's first plan).
// - Preview actions that did nothing [B17]: Asset Edit asset, Inheritance Ask Priya Raghavan, Lifecycle gate Add security outcomes.
// - The launcher [A19] answers a few questions from the prototype's data (which controls lack evidence, …) and links AI agents.
(function () {
  const PA = window.PA, V = PA && PA.v2;
  if (!V || !PA.AK || !V.chain || !V.chain.ui) return;
  const { S, P, M, h } = PA;
  const AK = PA.AK, SSP = PA.SSP, CH = V.chain, U = CH.ui;
  const { esc, fmt, tag } = h;
  const TODAY_ISO = CH.TODAY_ISO, md = CH.md, ME = CH.ME;
  let fid = 0;
  const cancel = '<button type="button" class="btn" data-close-modal>Cancel</button>';
  const fileField = (label, accept, hint) => { const id = "v2f-file-" + ++fid; return U.fld(label, `<label class="ak-drop v2k-file" for="${id}">${AK.i("upload")}<span class="v2k-fname">Drop a file here, or choose one</span><input id="${id}" class="v2k-sr" type="file" name="file"${accept ? ` accept="${esc(accept)}"` : ""} aria-label="${esc(label)}"></label>`, { req: true, id, hint }); };
  const fileName = (v) => String(v || "").split(/[\\/]/).pop();
  const nice = (f) => fileName(f).replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim();

  // ════════════════ Evidence: review it, add it ════════════════
  const EVL = () => (PA.evLookup ? PA.evLookup.all() : []);
  const evOf = (id) => EVL().find((r) => r.id === id) || null;
  M["a-docs-review"] = (id) => {
    const [rid, mode] = String(id || "").split("|"), r = evOf(rid);
    if (!r) return { title: "Review evidence", body: U.desc("This artifact is not in the prototype's register."), footer: '<button type="button" class="btn" data-close-modal>Close</button>' };
    const back = mode === "back", reqLine = r.req && r.req[0] ? `It meets ${esc(r.req[0])}'s acceptance criteria` : "It shows what it is cited for";
    return { title: "Review evidence", body: `${U.desc(`${esc(r.title)} · version 1`)}
      ${U.fld("Decision", U.radios("dec", [["accepted", "Accept", reqLine], ["needs_revision", "Send back for revision", "The owner revises it and submits it again"]], back ? "needs_revision" : mode === "accept" ? "accepted" : ""), { req: true })}
      ${U.F("What to revise", U.area("why", "Say what is missing or wrong. The owner sees it on the record, and in the daily digest the “Evidence sent back by the assessor” rule sends."), { hint: "Required to send back." })}
      <p class="note-p">The decision shows on the record and in History with the reviewer's name and the date; the prototype records it as Nadia Fournier, WS-X90's reviewer.</p>`,
      footer: `${cancel}<button type="button" class="btn ink" data-v2-wired data-v2k="evreview" data-id="${esc(rid)}">Save review</button>` };
  };
  CH.ACTIONS.evreview = (rid, o) => {
    const r = evOf(rid); if (!r) return "Decision: the artifact is not in the register.";
    if (!o.dec) return "Decision is required.";
    if (o.dec === "needs_revision" && !o.why) return "What to revise is required to send it back.";
    V.set("evx.rev." + rid, { state: o.dec, why: o.why || "", at: TODAY_ISO, by: "Nadia Fournier" });
    return [o.dec === "accepted" ? `Accepted: ${r.title}` : `Sent back for revision: ${r.title}`, { label: "Open Evidence", go: ["evidence", { filter: { qv: o.dec === "accepted" ? "Accepted" : "Needs revision" } }] }];
  };
  const KINDS = [["Document", "Document"], ["Test record", "Test record"], ["Scan", "Scan"], ["Dataset", "Dataset"]];
  const reqOpts = () => (PA.v7p ? PA.v7p.REQS.map((r) => [r[0], `${r[0]} · ${r[1]}`]) : []);
  const origUpload = M["a-docs-upload"];
  M["a-docs-upload"] = (id) => {
    const [mode, rid] = String(id || "upload|").split("|");
    if (rid || (mode !== "upload" && mode !== "link")) return origUpload(id); // a new version of an artifact, a policy, an import: as drawn (the guard says it is not saved)
    const link = mode === "link";
    return { title: link ? "Add link" : "Upload", body: `${U.desc("Into: a new artifact. It joins the register pending review by Nadia Fournier.")}
      ${link ? U.F("URL", U.inp("url", "https://", { type: "url" }), { req: true }) : fileField("File", "", "PDF, image, .nessus, .ckl, CycloneDX or SPDX")}
      ${U.F("Title", U.inp("title", link ? "What the page shows, for the assessor" : "A friendly name for the assessor; the file's name if left empty"), link ? { req: true } : {})}
      <div class="v2k-row2">${U.F("Kind", U.choose("kind", KINDS, link ? "Document" : "Test record"))}${U.F("Effective date", U.inp("eff", "", { type: "date", value: TODAY_ISO }))}</div>
      ${U.F("Requirement it supports", U.choose("req", reqOpts(), "", "None yet"), { hint: "A requirement that cites it moves the controls it maps past No evidence." })}`,
      footer: `${cancel}<button type="button" class="btn ink" data-v2-wired data-v2k="evadd" data-id="${mode}">Add evidence</button>` };
  };
  CH.ACTIONS.evadd = (mode, o) => {
    const title = (o.title || (mode === "link" ? "" : nice(o.file))).trim();
    if (mode === "link" && !o.url) return "URL is required.";
    if (mode !== "link" && !o.file) return "File is required.";
    if (!title) return "Title is required.";
    const n = CH.seq("ev"), id = "v2f-ev" + n, rq = (PA.v7p ? PA.v7p.REQS.find((r) => r[0] === o.req) : null);
    V.set("evx.add", [...(V.get("evx.add", null) || []), { id, title, kind: o.kind || "Document", owner: ME, collected: o.eff || TODAY_ISO, req: rq ? [rq[0], rq[1]] : ["", ""], file: fileName(o.file || o.url), at: TODAY_ISO }]);
    if (rq) V.set("reqx.ev", [...(V.get("reqx.ev", null) || []), { req: rq[0], ev: id, title, kind: o.kind || "Document", note: "", at: TODAY_ISO }]);
    return [`Added, pending review: ${title}${rq ? `, cited by ${rq[0]}` : ""}`, { label: "Open it", go: ["evidence", { open: { kind: "a-docs-ev", id: `${id}|evidence` } }] }];
  };

  // ════════════════ The registers' own create verbs ════════════════
  // POA&M › Create POA&M item, and Findings' bar with issues chosen: the item answers the issues, as the issue preview's does.
  const RL = () => PA.riskLookup || null;
  const openIssues = () => (RL() && RL().all ? RL().all().ISS : CH.issues()).filter((i) => !i.closed);
  M["a-risk-poam-new"] = (id) => {
    const chosen = String(id || "").split(",").filter((x) => x && openIssues().some((i) => i.id === x));
    const all = openIssues(), none = all.filter((i) => !i.poam), some = all.filter((i) => !!i.poam);
    const opts = [...none.map((i) => [i.id, i.title]), ...some.map((i) => [i.id, `${i.title} · has a POA&M item`])];
    return { title: "Create POA&M item", body: `${chosen.length ? U.ro(chosen.length === 1 ? "Answers" : `Answers ${chosen.length} operational issues`, chosen.map((x) => esc((all.find((i) => i.id === x) || {}).title || x)).join("<br>")) : U.F("Answers", U.choose("issue", opts, "", `Choose an open operational issue · ${all.length} open`), { req: true, hint: none.length ? `${none.length} have no POA&M item yet, listed first.` : "Each has a POA&M item already; this one joins the POA&M beside it." })}
      ${U.F("Title", U.inp("title", "What the item fixes, in one line"), { req: true })}
      <div class="v2k-row2">${U.F("Owner", U.choose("owner", U.peopleOpts()))}${U.F("Planned completion", U.inp("planned", "", { type: "date", value: CH.plus(30) }), { req: true })}</div>
      ${U.F("Remediation plan", U.area("plan", "How it will be fixed, and what evidence will show it"))}
      <p class="note-p">The item joins the WS-X90 POA&amp;M and exports to eMASS and OSCAL with its milestones.</p>`, footer: `${cancel}<button type="button" class="btn ink" data-v2-wired data-v2k="poamx" data-id="${esc(chosen.join(","))}">Create POA&amp;M item</button>` };
  };
  CH.ACTIONS.poamx = (ids, o) => {
    const list = ids ? ids.split(",").filter(Boolean) : o.issue ? [o.issue] : [];
    if (!list.length) return "Answers is required.";
    const n = CH.seq("poam"), pid = "v2k-poam-" + n;
    CH.push("poams", { id: pid, title: o.title, issue: list[0], also: list.slice(1), owner: o.owner || "", planned: o.planned, plan: o.plan, created: TODAY_ISO });
    return [`POA&M item created: ${o.title}${list.length > 1 ? `, answering ${list.length} operational issues` : ""}`, { label: "Open POA&M item", go: ["poam", { open: { kind: "a-risk-poam", id: pid + "|overview" } }] }];
  };
  // Risks › Create risk: a risk the register lists, resting on an issue or an item where the reader names one.
  M["a-risk-new-risk"] = () => {
    const iss = openIssues().map((i) => [i.id, i.title]);
    return { title: "Create risk", body: `${U.F("Title", U.inp("title", "What could happen, to what, in one sentence"), { req: true })}
      ${U.F("Threat", U.area("threat", "Who or what, and how"))}
      <div class="v2k-row2">${U.F("Likelihood", U.choose("lik", U.LEVELS, "moderate"))}${U.F("Impact", U.choose("imp", U.LEVELS, "high"))}</div>
      <div class="v2k-row2">${U.F("Response", U.choose("resp", [["mitigate", "Mitigate"], ["accept", "Accept"], ["avoid", "Avoid"], ["transfer", "Transfer"]], "mitigate"))}${U.F("Owner", U.choose("owner", U.peopleOpts()))}</div>
      ${U.F("Rests on", U.choose("issue", iss, "", "No operational issue"), { hint: "The issue it rests on shows it, and so does its POA&M item." })}`, footer: `${cancel}<button type="button" class="btn ink" data-v2-wired data-v2k="riskx">Create risk</button>` };
  };
  CH.ACTIONS.riskx = (_, o) => {
    const n = CH.seq("risk"), id = "v2k-risk-" + n, p = o.issue ? CH.poams().find((x) => x.issue === o.issue || (x.also || []).includes(o.issue)) : null;
    CH.push("risks", { id, title: o.title, issue: o.issue || null, poam: p ? p.id : null, lik: o.lik, imp: o.imp, sev: CH.sevOf(o.lik, o.imp), owner: o.owner || "", threat: o.threat, resp: o.resp, created: TODAY_ISO });
    return [`Risk created: ${o.title}`, { label: "Open risk", go: ["risks", { open: { kind: "a-risk-risk", id: id + "|overview" } }] }];
  };
  // Schedule › Create task: the task joins the Schedule first, counted in All and Open, and opens.
  const SOURCES = [["", "Custom"], ["Monthly · RA-5, SI-2", "Monthly vulnerability scan (RA-5, SI-2)"], ["Monthly · CM-6", "Monthly STIG compliance scan (CM-6)"], ["Monthly · CA-5", "Monthly POA&M review (CA-5)"], ["Quarterly · AU-6", "Quarterly audit log review sampling (AU-6)"]];
  M["a-work-task-new"] = () => ({ title: "Create task", body: `${U.F("Title", U.inp("title", "What is done, in one line"), { req: true })}
      <div class="v2k-row2">${U.F("Owner", U.choose("owner", U.peopleOpts()))}${U.F("Due date", U.inp("due", "", { type: "date", value: CH.plus(14) }), { req: true })}</div>
      ${U.F("Source", U.choose("src", SOURCES, ""), { hint: "Or the recurring check it fulfils." })}`, footer: `${cancel}<button type="button" class="btn ink" data-v2-wired data-v2k="taskx">Create task</button>` });
  CH.ACTIONS.taskx = (_, o) => {
    const n = CH.seq("task"), id = "v2f-t" + n;
    V.set("sched.tasks", [...(V.get("sched.tasks", null) || []), { id, t: o.title, s: "planned", a: TODAY_ISO, b: o.due, o: o.owner || "", src: o.src || "" }]);
    return [`Task created: ${o.title}, due ${md(o.due)}`, { label: "Open task", go: ["schedule", { open: { kind: "a-work-task", id } }] }];
  };
  // SI-2 › Add evidence: a version cited by REQ-064, SI-2's requirement (one source with REQ-064's chain).
  M["a-tests-addev"] = () => ({ title: "Add evidence", body: `${U.ro("Control", `${tag("SI-2")} Flaw Remediation`)}${U.ro("Cited by", `${tag("REQ-064")} SI Monitoring Requirement 064`)}
      ${fileField("File", "", "PDF, image, .nessus, .ckl, CycloneDX or SPDX")}
      ${U.F("Title", U.inp("title", "A friendly name for the assessor", { value: "openssh-server 9.8p1 update record, Mission Computer maintenance image version 2" }), { req: true })}
      ${U.F("Kind", U.choose("kind", KINDS, "Document"))}`, footer: `${cancel}<button type="button" class="btn ink" data-v2-wired data-v2k="si2ev">Add evidence</button>` });
  CH.ACTIONS.si2ev = (_, o) => {
    if (!o.file) return "File is required.";
    const have = PA.v2reqs ? PA.v2reqs.evidence("REQ-064") : [];
    if (have.some((e) => e.title === o.title)) return "Title: REQ-064 cites a version by that title already.";
    V.set("reqx.ev", [...(V.get("reqx.ev", null) || []), { req: "REQ-064", ev: "upload:" + fileName(o.file), title: o.title, kind: o.kind || "Document", note: "", at: TODAY_ISO }]);
    return [`Evidence added to SI-2, cited by REQ-064: ${o.title}, pending review`, { label: "Open the Evidence tab", route: "control-si2-evidence" }];
  };
  // Assessments › the planned CVI campaign's Plan an assessment: its first plan, a draft on SSP 2.
  M["a-tests-plan"] = () => ({ title: "Plan an assessment", body: `${U.desc("Gives the planned campaign its first plan, a draft on SSP 2. Controls join it from their own pages.")}
      ${U.F("Title", U.inp("title", "Name the campaign", { value: "WS-X90 cooperative vulnerability identification — FY2027" }), { req: true })}
      ${U.F("SSP", U.choose("ssp", [["ssp2", "SYS-WSX90 · SSP 2, published Jul 25 · 560 controls"]], "ssp2"))}
      <div class="v2k-row2">${U.F("Window opens", U.inp("from", "", { type: "date", value: "2027-01-11" }), { req: true })}${U.F("Window closes", U.inp("to", "", { type: "date", value: "2027-02-05" }), { req: true })}</div>
      ${U.ro("Kind", "Cyber test · cooperative vulnerability identification")}`, footer: `${cancel}<button type="button" class="btn ink" data-v2-wired data-v2k="plancvi">Plan an assessment</button>` });
  CH.ACTIONS.plancvi = (_, o) => {
    if (CH.camp("cvi")) return "Title: this campaign has its plan already.";
    const n = CH.seq("camp");
    CH.push("camps", { id: "cvi", n, title: o.title, ssp: "SSP 2, published Jul 25", from: o.from, to: o.to, ctl: null, kind: "Cyber test · CVI" });
    return [`${o.title} has its first plan, a draft on SSP 2`, { label: "Open campaign", route: "campaign-new-" + n }];
  };

  // ════════════════ Preview actions that did nothing ════════════════
  // Lifecycle gate › Add security outcomes: NIST SP 800-160 Vol. 1's outcomes of the gate's process that it does not hold yet.
  const OUTCOMES = {
    pdr: ["System Architecture Definition", [["AR.1", "The problem space is refined with respect to key stakeholder security concerns."], ["AR.2", "Alignment of the architecture with applicable security policies, directives, objectives, and constraints is achieved."], ["AR.3", "Concepts, properties, characteristics, behaviors, functions, and constraints that are significant to security-relevant architecture decisions about the system are allocated to architectural entities."], ["AR.4", "Identified stakeholder protection concerns are addressed by the system architecture."], ["AR.5", "Traceability of the security aspects of system architecture elements to key architecturally relevant stakeholder and system requirements is established."], ["AR.6", "Security aspects of architecture views and models of the system are developed."], ["AR.7", "Security aspects of system elements, their interactions, and their interfaces are defined."]]],
    cdr: ["Design Definition", [["DE.1", "Security aspects of design alternatives for system elements are assessed."], ["DE.2", "System requirements are allocated to address their security aspects."], ["DE.3", "Security interfaces and security aspects of interfaces between system elements composing the system are defined."], ["DE.4", "Security design characteristics of each system element are defined."], ["DE.5", "Enabling systems or services for the security aspects of design definition are available."], ["DE.6", "Traceability of security design characteristics is established."]]],
  };
  const HELD = { pdr: ["AR.4", "AR.5", "AR.7"], cdr: ["DE.2", "DE.3", "DE.4", "DE.6"] };
  const gateAdded = (g) => V.get("gate." + g + ".added", null) || [];
  M["v2f-outcomes"] = (g) => {
    const o = OUTCOMES[g] || OUTCOMES.pdr, held = new Set([...(HELD[g] || []), ...gateAdded(g).map((x) => x.code)]);
    const left = o[1].filter(([c]) => !held.has(c));
    return { title: "Add security outcomes", body: `${U.desc(`The outcomes NIST SP 800-160 Vol. 1 gives ${esc(o[0])}, which the gate does not hold yet. Each becomes a gate criterion, not met until someone records it met.`)}
      ${left.length ? U.fld("Security outcomes", `<div class="v2f-checks">${left.map(([c, t]) => `<label class="v2k-radio"><input type="checkbox" name="oc-${esc(c)}"><span><b>${esc(c)}</b><small>${esc(t)}</small></span></label>`).join("")}</div>`, { req: false }) : '<p class="note-p">The gate holds every outcome of its process already.</p>'}`,
      footer: `${cancel}<button type="button" class="btn ink" data-v2-wired data-v2k="outcomes" data-id="${esc(g)}"${left.length ? "" : ' aria-disabled="true" title="Nothing left to add"'}>Add security outcomes</button>` };
  };
  CH.ACTIONS.outcomes = (g, o) => {
    const pick = Object.keys(o).filter((k) => k.startsWith("oc-") && o[k]).map((k) => k.slice(3));
    if (!pick.length) return "Security outcomes: choose at least one.";
    const proc = (OUTCOMES[g] || OUTCOMES.pdr)[0], all = (OUTCOMES[g] || OUTCOMES.pdr)[1];
    V.set("gate." + g + ".added", [...gateAdded(g), ...pick.map((c) => ({ code: c, title: (all.find((x) => x[0] === c) || [c, c])[1], proc }))]);
    return [`${pick.length} security outcome${pick.length === 1 ? "" : "s"} added to ${g.toUpperCase()}'s criteria: ${pick.join(", ")}`, { label: "Open the gate", go: ["schedule", { open: { kind: "a-work-gate", id: g } }] }];
  };
  // Inheritance source › Ask Priya Raghavan: the reminder is recorded, and the card says when she was asked.
  if (P["v7a-src"]) {
    const f = P["v7a-src"];
    P["v7a-src"] = (id) => {
      const o = f(id); if (!o || !o.body) return o;
      const asked = V.get("inh.asked", null);
      o.body = o.body.replace(/<span class="ak-remind"><span>[^<]*<\/span><span class="btn sm">([\s\S]*?)Ask Priya Raghavan<\/span><\/span>/, (m0, icon) => `<span class="ak-remind"><span>${asked ? `Asked on ${esc(md(asked))}` : "Not asked yet"}</span><button type="button" class="btn sm" data-v2f-ask="1">${icon}${asked ? "Ask again" : "Ask Priya Raghavan"}</button></span>`);
      return o;
    };
  }
  document.addEventListener("click", (e) => {
    const b = e.target && e.target.closest ? e.target.closest("[data-v2f-ask]") : null; if (!b) return;
    e.preventDefault(); e.stopPropagation();
    V.set("inh.asked", TODAY_ISO); V.redraw();
    V.toast("Priya Raghavan, the Mission Computer's owner, is asked to review AC-17(2) and SC-23 for version 2; the Next step says when");
  }, true);
  // Asset › Edit asset: serial number, manufacturer and owner, which the preview then shows.
  if (P["sys-asset"]) {
    const f = P["sys-asset"];
    P["sys-asset"] = (id) => {
      const o = f(id); if (!o || !o.body) return o;
      const x = V.get("asset." + id, null);
      o.body = o.body.replace('<span class="btn sm">Edit asset</span>', `<button type="button" class="btn sm" data-modal="v2f-asset" data-id="${esc(id)}">Edit asset</button>`);
      if (x) {
        if (x.serial) o.body = o.body.replace(/(<dt>Serial number<\/dt><dd>)[\s\S]*?(<\/dd>)/, `$1<span class="num">${esc(x.serial)}</span>$2`);
        if (x.maker) o.body = o.body.replace(/(<dt>Manufacturer<\/dt><dd>)[\s\S]*?(<\/dd>)/, `$1${esc(x.maker)}$2`);
        if (x.owner) o.body = o.body.replace(/(<dt>Owner<\/dt><dd>)[\s\S]*?(<\/dd>)/, `$1${AK.owner(x.owner)}$2`);
      }
      return o;
    };
  }
  M["v2f-asset"] = (id) => {
    const x = V.get("asset." + id, null) || {};
    return { title: "Edit asset", body: `${U.desc(`${esc(id)}: what the recorded asset leaves out. Scope and the element it sits on change from the inventory's Scope changes.`)}
      <div class="v2k-row2">${U.F("Serial number", U.inp("serial", "As printed on the unit", { value: x.serial || "" }))}${U.F("Manufacturer", U.inp("maker", "Who built it", { value: x.maker || "" }))}</div>
      ${U.F("Owner", U.choose("owner", U.peopleOpts(), x.owner || ""))}`, footer: `${cancel}<button type="button" class="btn ink" data-v2-wired data-v2k="asset" data-id="${esc(id)}">Save asset</button>` };
  };
  CH.ACTIONS.asset = (id, o) => {
    if (!o.serial && !o.maker && !o.owner) return "Serial number: enter something to save, or Cancel.";
    V.set("asset." + id, { serial: o.serial, maker: o.maker, owner: o.owner, at: TODAY_ISO });
    return [`${id} saved: ${[o.serial && "serial number", o.maker && "manufacturer", o.owner && "owner"].filter(Boolean).join(", ")}`, null];
  };

  // ════════════════ The launcher answers a few questions [A19] ════════════════
  // Typed questions about controls, evidence, risks and issues are answered from the prototype's own data, each answer a link that
  // opens the list it counts; any other question says AI agents answer questions, and links there.
  const ASK = [
    [/(control|controls).*(no|without|lack|lacking|missing).*evidence|evidence.*(missing|lack)/i, () => { const n = CH.counts().no_evidence || 0; return { text: `${fmt(n)} controls have no evidence yet`, sub: "Controls · Needs evidence", go: ["controls", { filter: { qv: "Needs evidence" } }] }; }],
    [/(control|controls).*(no|without|lack|missing).*requirement/i, () => { const n = CH.counts().no_requirement || 0; return { text: `${fmt(n)} controls have no requirement mapped`, sub: "Controls · No requirement", go: ["controls", { filter: { qv: "No requirement" } }] }; }],
    [/(requirement|requirements).*(no|without|lack|missing).*evidence|cite no evidence/i, () => { const n = 286 - (PA.v2reqs ? PA.v2reqs.gainedEvidence() : 0); return { text: `${fmt(n)} requirements cite no evidence`, sub: "Requirements · Cite no evidence", go: ["requirements", { filter: { qv: "Cite no evidence" } }] }; }],
    [/critical.*risk|risk.*critical/i, () => ({ text: "2 critical risks, both without an owner", sub: "Risks · Severity: Critical", go: ["risks", { filter: { sev: "critical" } }] })],
    [/(past due|overdue|late).*(issue|finding)|(issue|finding).*(past due|overdue|late)/i, () => ({ text: "17 operational issues are past their remediation date", sub: "Findings · Past due", go: ["findings", { filter: { qv: "Past due" } }] })],
    [/pending.*(review|evidence)|evidence.*(pending|wait)/i, () => ({ text: "Evidence waiting on a reviewer", sub: "Evidence · Pending review", go: ["evidence", { filter: { qv: "Pending review" } }] })],
  ];
  const isQuestion = (q) => /\?\s*$|^(which|what|how many|how much|show me|list|who|where|when|why|are there|is there|do we|does)\b/i.test(q.trim());
  const answerFor = (q) => { for (const [re, fn] of ASK) if (re.test(q)) return fn(); return null; };
  // The launcher (mod-v8-platform.js) asks for its first group: an Answer row that opens what it counts, or, for a question it
  // cannot answer, a row that says AI agents answer questions and opens them. Words that are not a question get neither.
  const ask = (q) => {
    const a = answerFor(q);
    if (a) return { t: "answer", key: "answer:" + a.sub, name: a.text, sub: a.sub, to: a.sub.split(" · ")[0], glyph: AK.i("sparkle"), act: () => { V.go(a.go[0], a.go[1]); return null; } };
    if (!isQuestion(q)) return null;
    return { t: "answer", key: "answer:agents", name: "Ask AI agents", sub: "Search finds records by their words; AI agents answer questions over WS-X90's records", to: "AI agents", glyph: AK.i("sparkle"), act: { go: "ai-drafts" } };
  };
  PA.v2wire = { answerFor, ask };
})();
